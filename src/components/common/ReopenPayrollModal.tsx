import React, { useState } from 'react';
import { X, Unlock, AlertTriangle } from 'lucide-react';
import { PayrollPeriod } from '../../types';

interface ReopenPayrollModalProps {
  period: PayrollPeriod | null;
  onClose: () => void;
  onConfirm: (periodId: string, reason: string) => Promise<void>;
}

export const ReopenPayrollModal: React.FC<ReopenPayrollModalProps> = ({
  period,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!period) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please enter a specific audit justification for reopening finalized payroll.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(period.id, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reopen payroll period');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-rose-200 bg-rose-950 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Unlock className="h-5 w-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Reopen Finalized Payroll</h3>
              <p className="text-xs text-rose-300">Period: {period.month}/{period.year}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-rose-300 hover:bg-rose-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-lg bg-rose-50 p-3 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Administrative Override Warning</p>
              <p className="mt-0.5">
                This period is officially finalized and locked. Reopening it will allow attendance modifications and salary adjustments. This action will be permanently recorded in the immutable audit log.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Audit Reason / Justification (Required)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Disputed Sunday duty shift verified with site logbook for excavator operator Ravi Kumar"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
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
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Reopening...' : 'Confirm Reopen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
