import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle } from 'lucide-react';
import { PayrollRecord, AdjustmentType } from '../../types';
import { formatINR } from '../../services/payroll/payrollEngine';

interface AdjustmentModalProps {
  record: PayrollRecord | null;
  periodId: string;
  onClose: () => void;
  onSubmit: (periodId: string, employeeId: string, type: AdjustmentType, amount: number, reason: string) => Promise<void>;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  record,
  periodId,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<AdjustmentType>('Bonus');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      setError('Please enter a valid non-zero adjustment amount.');
      return;
    }
    if (!reason.trim()) {
      setError('A valid reason is required for administrative audit logs.');
      return;
    }

    // Convert deduction or advance to negative if positive entered
    let finalAmount = numAmount;
    if ((type === 'Deduction' || type === 'Advance') && finalAmount > 0) {
      finalAmount = -finalAmount;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(periodId, record.employee_id, type, finalAmount, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to apply adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Add Payroll Adjustment</h3>
              <p className="text-xs text-slate-400">{record.employee_name} ({record.employee_code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Adjustment Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AdjustmentType)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="Bonus">Bonus (+ Increases Pay)</option>
              <option value="Advance">Advance Deduction (- Reduces Pay)</option>
              <option value="Deduction">Other Deduction (- Reduces Pay)</option>
              <option value="Correction">Correction (+/-)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Amount in INR (₹)
            </label>
            <input
              type="number"
              step="1"
              placeholder="e.g. 2000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Current base salary: {formatINR(record.monthly_salary)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Reason / Justification (Audit Log Mandatory)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Site excavation milestone performance bonus approved by Owner"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
