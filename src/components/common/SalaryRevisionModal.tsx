import React, { useState } from 'react';
import { X, TrendingUp, AlertCircle, History } from 'lucide-react';
import { Employee, SalaryHistory } from '../../types';
import { formatINR } from '../../services/payroll/payrollEngine';
import { db } from '../../services/db/database';

interface SalaryRevisionModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SalaryRevisionModal: React.FC<SalaryRevisionModalProps> = ({
  employee,
  onClose,
  onSuccess,
}) => {
  const [newSalary, setNewSalary] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [history, setHistory] = useState<SalaryHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (employee) {
      setNewSalary(String(employee.monthly_salary));
      db.getSalaryHistoryForEmployee(employee.id).then((hist) => {
        setHistory(hist);
        setLoadingHistory(false);
      });
    }
  }, [employee]);

  if (!employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const salaryVal = parseFloat(newSalary);
    if (isNaN(salaryVal) || salaryVal <= 0) {
      setError('Please enter a valid positive salary amount.');
      return;
    }
    if (!reason.trim()) {
      setError('Reason for salary revision is mandatory for company audit logs.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await db.updateEmployeeSalary(employee.id, salaryVal, effectiveFrom, reason.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update salary');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Revise Employee Salary</h3>
              <p className="text-xs text-slate-400">{employee.full_name} ({employee.employee_code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Salary Box */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Current Monthly Salary</p>
              <p className="text-lg font-bold text-slate-900">{formatINR(employee.monthly_salary)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-slate-500">Effective Since</p>
              <p className="text-sm font-medium text-slate-700">{employee.salary_effective_from || 'Joining'}</p>
            </div>
          </div>

          <form id="salary-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                New Monthly Salary in INR (₹)
              </label>
              <input
                type="number"
                step="500"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                placeholder="e.g. 32000"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Effective From Date
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Reason for Increment / Revision (Mandatory)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual skill appraisal promotion to Lead Excavator Operator"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>
          </form>

          {/* Historical Salary Timeline */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Audited Salary Revision History
              </h4>
            </div>

            {loadingHistory ? (
              <p className="text-xs text-slate-400">Loading historical revisions...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                No past revisions recorded. Current salary is the base joining compensation.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-700">
                        {formatINR(h.previous_salary)} → <span className="text-emerald-600 font-bold">{formatINR(h.new_salary)}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">Eff: {h.effective_from}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">{h.reason}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">By: {h.changed_by_name || 'Admin'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="salary-form"
            disabled={isSubmitting}
            className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Save Salary Revision'}
          </button>
        </div>
      </div>
    </div>
  );
};
