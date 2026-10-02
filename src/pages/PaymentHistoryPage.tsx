import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Printer,
  Ban,
  Download,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Payment, PaymentDirection, PaymentMode, PaymentCategory, AccountType, CompanySettings, Profile } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import { generatePaymentReceiptPDF } from '../services/export/receiptGenerator';
import { PaymentEntryModal } from '../components/payments/PaymentEntryModal';
import { ReceiptModal } from '../components/receipts/ReceiptModal';

interface PaymentHistoryPageProps {
  currentUser: Profile;
  onSelectAccount?: (accountType: AccountType, accountId: string) => void;
}

export const PaymentHistoryPage: React.FC<PaymentHistoryPageProps> = ({
  currentUser,
  onSelectAccount,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'Inward' | 'Outward'>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  // Cancel Modal state
  const [cancellingPayment, setCancellingPayment] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, [directionFilter, modeFilter, categoryFilter, startDate, endDate]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const [list, comp] = await Promise.all([
        db.getPayments({
          direction: directionFilter !== 'all' ? directionFilter : undefined,
          mode: modeFilter !== 'all' ? (modeFilter as PaymentMode) : undefined,
          category: categoryFilter !== 'all' ? (categoryFilter as PaymentCategory) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        db.getCompanySettings(),
      ]);
      setPayments(list);
      setCompany(comp);
    } catch (e) {
      console.error('Error loading payments history:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingPayment || !cancelReason.trim()) return;

    try {
      await db.cancelPayment(cancellingPayment.id, cancelReason, currentUser.full_name);
      setCancellingPayment(null);
      setCancelReason('');
      loadPayments();
    } catch (err) {
      console.error('Error cancelling payment:', err);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.transaction_id.toLowerCase().includes(q) ||
      p.account_name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.reference_number && p.reference_number.toLowerCase().includes(q))
    );
  });

  const totalInward = payments
    .filter((p) => p.payment_direction === 'Inward' && p.status === 'Approved')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutward = payments
    .filter((p) => p.payment_direction === 'Outward' && p.status === 'Approved')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Payment & Transaction History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete auditable double-entry payment ledger, receipts & reversal logs
          </p>
        </div>

        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors self-start"
        >
          <Plus className="h-4 w-4" />
          <span>+ Record New Payment</span>
        </button>
      </div>

      {/* Aggregate Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Inward Received
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatINR(totalInward)}</p>
          <span className="text-[11px] text-slate-400">Client collections & cash inflows</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Outward Paid
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">{formatINR(totalOutward)}</p>
          <span className="text-[11px] text-slate-400">Vendor bills, wages, diesel & advances</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 shadow-sm text-white flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Net Cash Balance Flow
          </span>
          <p className="text-2xl font-black text-white mt-1">{formatINR(totalInward - totalOutward)}</p>
          <span className="text-[10px] text-slate-400">Receipts minus disbursements</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search txn ID, party name, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direction Filter */}
          <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setDirectionFilter('all')}
              className={`px-3 py-1 font-bold rounded-lg ${
                directionFilter === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              All Flows
            </button>
            <button
              onClick={() => setDirectionFilter('Inward')}
              className={`px-3 py-1 font-bold rounded-lg ${
                directionFilter === 'Inward' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Inward
            </button>
            <button
              onClick={() => setDirectionFilter('Outward')}
              className={`px-3 py-1 font-bold rounded-lg ${
                directionFilter === 'Outward' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Outward
            </button>
          </div>

          {/* Payment Mode */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none"
          >
            <option value="all">All Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="PhonePe">PhonePe</option>
            <option value="Google Pay">Google Pay</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>

          {/* Date range inputs */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 text-slate-800"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 text-slate-800"
          />
        </div>
      </div>

      {/* Main Payment History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Beneficiary / Account</th>
                <th className="p-3">Category</th>
                <th className="p-3">Flow</th>
                <th className="p-3">Mode & Ref</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-slate-400">
                    No payment transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isRec = p.payment_direction === 'Inward';
                  const isCancelled = p.status === 'Cancelled';
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 ${isCancelled ? 'opacity-50 line-through bg-slate-50/50' : ''}`}>
                      <td className="p-3 font-semibold text-slate-900">{p.payment_date}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{p.transaction_id}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{p.account_name}</p>
                        <span className="text-[10px] text-slate-400 font-medium">{p.account_type}</span>
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {p.payment_category}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                            isRec ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isRec ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {p.payment_direction}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800">{p.payment_mode}</span>
                        {p.reference_number && (
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Ref: {p.reference_number}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-black text-sm text-slate-900">
                        <span className={isRec ? 'text-emerald-600' : 'text-slate-900'}>
                          {isRec ? '+' : '-'} {formatINR(p.amount)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.cancellation_reason && (
                          <span className="text-[9px] text-rose-600 block mt-0.5">
                            Reason: {p.cancellation_reason}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedReceiptPayment(p)}
                            title="View & Print Voucher Receipt"
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {!isCancelled && (
                            <button
                              onClick={() => setCancellingPayment(p)}
                              title="Cancel / Reverse Payment Entry"
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reversal / Cancellation Modal */}
      {cancellingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-rose-500" />
                <h2 className="text-base font-bold">Reverse / Cancel Transaction</h2>
              </div>
              <button
                onClick={() => setCancellingPayment(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCancelPayment} className="p-6 space-y-4">
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-bold">Audit Safety Rule:</p>
                <p className="mt-0.5">
                  Financial records are never deleted. Cancelling this transaction (
                  {cancellingPayment.transaction_id} — {formatINR(cancellingPayment.amount)}) will create an immutable reversal entry in the ledger with your stated reason.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation / Reversal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Duplicate entry / wrong bank account transferred"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCancellingPayment(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
                >
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Entry Modal */}
      {isPaymentModalOpen && (
        <PaymentEntryModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={(newP) => {
            loadPayments();
            setSelectedReceiptPayment(newP);
          }}
        />
      )}

      {/* Receipt Modal Viewer */}
      {selectedReceiptPayment && company && (
        <ReceiptModal
          isOpen={Boolean(selectedReceiptPayment)}
          onClose={() => setSelectedReceiptPayment(null)}
          payment={selectedReceiptPayment}
          company={company}
        />
      )}
    </div>
  );
};
