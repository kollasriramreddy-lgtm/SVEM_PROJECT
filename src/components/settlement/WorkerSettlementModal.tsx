import React, { useState, useEffect } from 'react';
import { X, Calculator, CheckCircle2, AlertCircle, FileText, DollarSign, Calendar } from 'lucide-react';
import { Employee, Site, DailyWorkEntry, Settlement, PaymentMode } from '../../types';
import { db } from '../../services/db/database';
import { formatINR } from '../../services/payroll/payrollEngine';

interface WorkerSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (settlement: Settlement) => void;
  workerId?: string;
}

export const WorkerSettlementModal: React.FC<WorkerSettlementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  workerId,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workerId || '');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [settlementType, setSettlementType] = useState<'Full Payment' | 'Partial Payment' | 'Carry Forward'>('Full Payment');
  const [amountPaidNow, setAmountPaidNow] = useState<string>('');
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('0');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [notes, setNotes] = useState<string>('');

  const [workers, setWorkers] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [unsettledWork, setUnsettledWork] = useState<DailyWorkEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (workerId) setSelectedWorkerId(workerId);
      setError(null);
    }
  }, [isOpen, workerId]);

  const loadData = async () => {
    try {
      const [wList, sList] = await Promise.all([db.getEmployees(), db.getSites()]);
      setWorkers(wList);
      setSites(sList);
      if (!selectedWorkerId && wList.length > 0) {
        setSelectedWorkerId(wList[0].id);
      }
    } catch (e) {
      console.error('Error loading settlement modal dependencies:', e);
    }
  };

  useEffect(() => {
    if (selectedWorkerId) {
      loadUnsettledEntries();
    }
  }, [selectedWorkerId, fromDate, toDate, selectedSiteId]);

  const loadUnsettledEntries = async () => {
    try {
      const entries = await db.getDailyWorkEntries({
        workerId: selectedWorkerId,
        startDate: fromDate,
        endDate: toDate,
        siteId: selectedSiteId || undefined,
        settlementStatus: 'unsettled',
      });
      setUnsettledWork(entries);
    } catch (e) {
      console.error('Error loading unsettled work:', e);
    }
  };

  const totalGrossWork = unsettledWork.reduce((sum, w) => sum + w.gross_amount, 0);
  const totalDieselAdvance = unsettledWork.reduce(
    (sum, w) => sum + (w.diesel_supplied_by === 'Company' ? w.diesel_amount : 0),
    0
  );
  const totalCashAdvance = unsettledWork.reduce((sum, w) => sum + w.cash_advance, 0);
  const totalOtherDeductions = unsettledWork.reduce((sum, w) => sum + w.other_deductions, 0);
  const numAdjustment = parseFloat(adjustmentAmount) || 0;

  const netPayableCalculated =
    totalGrossWork - totalDieselAdvance - totalCashAdvance - totalOtherDeductions + numAdjustment;

  useEffect(() => {
    if (settlementType === 'Full Payment') {
      setAmountPaidNow(String(Math.max(0, netPayableCalculated)));
    }
  }, [settlementType, netPayableCalculated]);

  const numPaidNow = parseFloat(amountPaidNow) || 0;
  const remainingCarryForward = Math.max(0, netPayableCalculated - numPaidNow);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unsettledWork.length === 0) {
      setError('No unsettled work entries found for the selected worker and period.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const worker = workers.find((w) => w.id === selectedWorkerId);
      const site = sites.find((s) => s.id === selectedSiteId);

      const settlement = await db.createSettlement({
        settlement_date: new Date().toISOString().split('T')[0],
        worker_id: selectedWorkerId,
        worker_name: worker ? worker.full_name : 'Worker',
        worker_code: worker ? worker.employee_code : '',
        site_id: selectedSiteId || undefined,
        site_name: site ? site.site_name : undefined,
        from_date: fromDate,
        to_date: toDate,
        total_work_value: totalGrossWork,
        total_cash_advance: totalCashAdvance,
        total_diesel_advance: totalDieselAdvance,
        total_other_deductions: totalOtherDeductions,
        previous_balance: 0,
        payments_already_made: 0,
        adjustment_amount: numAdjustment,
        net_settlement_amount: netPayableCalculated,
        settlement_type: settlementType,
        amount_paid_now: numPaidNow,
        remaining_carry_forward: remainingCarryForward,
        payment_mode: paymentMode,
        notes: notes || `Settled ${unsettledWork.length} work entries from ${fromDate} to ${toDate}`,
      });

      onSuccess(settlement);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create settlement.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500 p-2 text-slate-950 font-black">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Worker & Operator Settlement</h2>
              <p className="text-xs text-slate-400">
                Audit daily work, deduct cash/diesel advances & release net clearance payout
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Worker & Site Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Worker / Operator</label>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name} ({w.worker_type} - {w.employee_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Filter by Worksite</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
              >
                <option value="">All Worksites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
              <input
                type="date"
                required
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Calculation Breakdown Matrix */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Unsettled Work Records Found:</span>
              <span className="rounded bg-amber-200 px-2 py-0.5 text-slate-900">{unsettledWork.length} Entries</span>
            </div>

            <div className="flex justify-between py-1 border-t border-slate-200">
              <span className="text-slate-600">Gross Work Earnings (Qty × Rate):</span>
              <span className="font-bold text-slate-900">{formatINR(totalGrossWork)}</span>
            </div>

            <div className="flex justify-between py-1 text-rose-600">
              <span>Less Company Diesel Deductions:</span>
              <span className="font-semibold">- {formatINR(totalDieselAdvance)}</span>
            </div>

            <div className="flex justify-between py-1 text-rose-600">
              <span>Less On-site Cash Advances:</span>
              <span className="font-semibold">- {formatINR(totalCashAdvance)}</span>
            </div>

            {totalOtherDeductions > 0 && (
              <div className="flex justify-between py-1 text-rose-600">
                <span>Less Other Site Deductions:</span>
                <span className="font-semibold">- {formatINR(totalOtherDeductions)}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-1 border-t border-slate-200">
              <span className="text-slate-700 font-semibold">Adjustment / Bonus / Penalty:</span>
              <input
                type="number"
                step="any"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                className="w-24 rounded border border-slate-300 p-1 text-right font-bold text-xs"
              />
            </div>

            <div className="flex justify-between py-2 border-t-2 border-slate-300 font-black text-sm text-slate-900 bg-slate-100 px-2 rounded-lg">
              <span>Net Settlement Payable:</span>
              <span className="text-emerald-700">{formatINR(netPayableCalculated)}</span>
            </div>
          </div>

          {/* Settlement Payout Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Settlement Type</label>
              <select
                value={settlementType}
                onChange={(e) => setSettlementType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none"
              >
                <option value="Full Payment">Full Settlement</option>
                <option value="Partial Payment">Partial Payment</option>
                <option value="Carry Forward">Carry Forward Balance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount Paid Now (₹)</label>
              <input
                type="number"
                step="any"
                value={amountPaidNow}
                onChange={(e) => setAmountPaidNow(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {remainingCarryForward > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 flex justify-between font-semibold">
              <span>Remaining Balance to Carry Forward:</span>
              <span className="font-extrabold">{formatINR(remainingCarryForward)}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Authorization Remark</label>
            <input
              type="text"
              placeholder="e.g. Cleared 5 days drilling quota at ORR site via supervisor Ramesh"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || unsettledWork.length === 0}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? 'Processing Settlement...' : 'Authorize & Disburse Settlement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
