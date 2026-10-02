import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  HardHat,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Download,
  Printer,
  Plus,
  Fuel,
  HandCoins,
  Calculator,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Employee, DailyWorkEntry, Payment, Advance, LedgerEntry, Settlement, CompanySettings } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import {
  generateAccountStatementPDF,
  exportAccountStatementToExcel,
} from '../services/export/receiptGenerator';
import { PaymentEntryModal } from '../components/payments/PaymentEntryModal';
import { AdvanceEntryModal } from '../components/advances/AdvanceEntryModal';
import { WorkerSettlementModal } from '../components/settlement/WorkerSettlementModal';
import { ReceiptModal } from '../components/receipts/ReceiptModal';

interface WorkerAccountDetailPageProps {
  workerId: string;
  onBack: () => void;
}

export const WorkerAccountDetailPage: React.FC<WorkerAccountDetailPageProps> = ({
  workerId,
  onBack,
}) => {
  const [worker, setWorker] = useState<Employee | null>(null);
  const [workEntries, setWorkEntries] = useState<DailyWorkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);

  const [activeTab, setActiveTab] = useState<'work' | 'ledger' | 'advances' | 'payments' | 'settlements'>('work');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [selectedReceiptSettlement, setSelectedReceiptSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkerAccount();
  }, [workerId]);

  const loadWorkerAccount = async () => {
    setLoading(true);
    try {
      const [w, work, pList, advList, stlList, ledgerList, comp] = await Promise.all([
        db.getEmployeeById(workerId),
        db.getDailyWorkEntries({ workerId }),
        db.getPayments({ accountType: 'Worker', accountId: workerId }),
        db.getAdvances({ accountType: 'Worker', accountId: workerId }),
        db.getSettlements(workerId),
        db.getLedgerEntries('Worker', workerId),
        db.getCompanySettings(),
      ]);

      setWorker(w || null);
      setWorkEntries(work);
      setPayments(pList);
      setAdvances(advList);
      setSettlements(stlList);
      setLedger(ledgerList);
      setCompany(comp);
    } catch (e) {
      console.error('Error loading worker account details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (worker && company) {
      generateAccountStatementPDF(
        'Worker',
        worker.full_name,
        0,
        ledger,
        company
      );
    }
  };

  const handleExportExcel = () => {
    if (worker) {
      exportAccountStatementToExcel(
        'Worker',
        worker.full_name,
        ledger,
        0
      );
    }
  };

  if (loading || !worker) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading worker account details & work history...
      </div>
    );
  }

  const totalQuantity = workEntries.reduce((sum, w) => sum + w.quantity, 0);
  const totalGrossEarnings = workEntries.reduce((sum, w) => sum + w.gross_amount, 0);
  const totalCashAdvances = workEntries.reduce((sum, w) => sum + w.cash_advance, 0);
  const totalDieselAdvances = workEntries.reduce(
    (sum, w) => sum + (w.diesel_supplied_by === 'Company' ? w.diesel_amount : 0),
    0
  );
  const totalOtherDeductions = workEntries.reduce((sum, w) => sum + w.other_deductions, 0);
  const totalNetPayable = workEntries.reduce((sum, w) => sum + w.net_payable, 0);
  const totalPaymentsMade = payments
    .filter((p) => p.payment_direction === 'Outward' && p.status === 'Approved')
    .reduce((sum, p) => sum + p.amount, 0);

  const remainingPayableBalance = Math.max(0, totalNetPayable - totalPaymentsMade);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Worker Account & Daily Ledger
              </span>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                {worker.worker_type}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {worker.full_name} ({worker.employee_code})
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => setIsSettlementModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-sm hover:bg-amber-400 transition-colors"
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>+ Create Settlement</span>
          </button>

          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-sky-600/40 bg-sky-950/40 px-3 py-2 text-xs font-bold text-sky-300 hover:bg-sky-900/60"
          >
            <HandCoins className="h-3.5 w-3.5" />
            <span>+ Issue Advance</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            <CreditCard className="h-3.5 w-3.5 text-amber-400" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="rounded-xl border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
            title="Export PDF Statement"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Work Feet / Qty
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">{totalQuantity.toLocaleString()} Units</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Gross Earnings
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatINR(totalGrossEarnings)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Diesel Advance Cuts
          </span>
          <p className="text-xl font-black text-rose-500 mt-1">{formatINR(totalDieselAdvances)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Cash Advances Deducted
          </span>
          <p className="text-xl font-black text-rose-600 mt-1">{formatINR(totalCashAdvances)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Payments Made
          </span>
          <p className="text-xl font-black text-emerald-600 mt-1">{formatINR(totalPaymentsMade)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-3.5 shadow-sm text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Remaining Payable
          </span>
          <p className="text-xl font-black text-amber-300 mt-1">
            {formatINR(remainingPayableBalance)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('work')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'work'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Work Register ({workEntries.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'ledger'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Double-Entry Ledger ({ledger.length})
        </button>

        <button
          onClick={() => setActiveTab('advances')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'advances'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Advances History ({advances.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payments Released ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'settlements'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Settlements ({settlements.length})
        </button>
      </div>

      {/* Tab 1: Work Entries */}
      {activeTab === 'work' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase">
                <tr>
                  <th className="p-3">Work Date</th>
                  <th className="p-3">Work Category</th>
                  <th className="p-3">Worksite</th>
                  <th className="p-3">Quantity & Rate</th>
                  <th className="p-3">Gross Value</th>
                  <th className="p-3">Diesel Debit</th>
                  <th className="p-3">Cash Advance</th>
                  <th className="p-3 text-right bg-slate-950 text-amber-400">Net Payable</th>
                  <th className="p-3">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {workEntries.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{w.work_date}</td>
                    <td className="p-3 font-bold text-slate-800">{w.work_category}</td>
                    <td className="p-3 text-slate-600">{w.site_name}</td>
                    <td className="p-3 font-semibold">
                      {w.quantity} {w.measurement_unit} @ ₹{w.rate_per_unit}
                    </td>
                    <td className="p-3 font-bold">{formatINR(w.gross_amount)}</td>
                    <td className="p-3 text-rose-600">
                      {w.diesel_litres > 0 ? `-${formatINR(w.diesel_amount)}` : '-'}
                    </td>
                    <td className="p-3 text-rose-600">
                      {w.cash_advance > 0 ? `-${formatINR(w.cash_advance)}` : '-'}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-700 bg-slate-50">
                      {formatINR(w.net_payable)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          w.settlement_status === 'settled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.settlement_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Ledger */}
      {activeTab === 'ledger' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Transaction Type</th>
                  <th className="p-3">Reference No</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Debit (₹) [Paid / Cut]</th>
                  <th className="p-3 text-right">Credit (₹) [Earned]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{entry.entry_date}</td>
                    <td className="p-3 font-bold text-slate-800">{entry.transaction_type}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{entry.reference_no || '-'}</td>
                    <td className="p-3 text-slate-600 max-w-xs">{entry.description}</td>
                    <td className="p-3 text-right font-black text-rose-600">
                      {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600">
                      {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Advances */}
      {activeTab === 'advances' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Advance Amount</th>
                  <th className="p-3 text-right">Recovered</th>
                  <th className="p-3 text-right font-bold text-rose-600">Remaining</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advances.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{a.advance_date}</td>
                    <td className="p-3 font-bold">{a.advance_type}</td>
                    <td className="p-3 text-slate-600">{a.reason}</td>
                    <td className="p-3 text-right font-black">{formatINR(a.amount)}</td>
                    <td className="p-3 text-right text-emerald-600 font-bold">{formatINR(a.recovered_amount || 0)}</td>
                    <td className="p-3 text-right text-rose-600 font-black">{formatINR(a.remaining_amount || 0)}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isPaymentModalOpen && (
        <PaymentEntryModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          defaultAccountType="Worker"
          defaultAccountId={worker.id}
          defaultDirection="Outward"
          defaultCategory="Worker salary"
          onSuccess={(newP) => {
            loadWorkerAccount();
            setSelectedReceiptPayment(newP);
          }}
        />
      )}

      {isAdvanceModalOpen && (
        <AdvanceEntryModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          defaultAccountType="Worker"
          defaultAccountId={worker.id}
          onSuccess={() => loadWorkerAccount()}
        />
      )}

      {isSettlementModalOpen && (
        <WorkerSettlementModal
          isOpen={isSettlementModalOpen}
          onClose={() => setIsSettlementModalOpen(false)}
          workerId={worker.id}
          onSuccess={(newStl) => {
            loadWorkerAccount();
            setSelectedReceiptSettlement(newStl);
          }}
        />
      )}

      {selectedReceiptPayment && company && (
        <ReceiptModal
          isOpen={Boolean(selectedReceiptPayment)}
          onClose={() => setSelectedReceiptPayment(null)}
          payment={selectedReceiptPayment}
          company={company}
        />
      )}

      {selectedReceiptSettlement && company && (
        <ReceiptModal
          isOpen={Boolean(selectedReceiptSettlement)}
          onClose={() => setSelectedReceiptSettlement(null)}
          settlement={selectedReceiptSettlement}
          company={company}
        />
      )}
    </div>
  );
};
