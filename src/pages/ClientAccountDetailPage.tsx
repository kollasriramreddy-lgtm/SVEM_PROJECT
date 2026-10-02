import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Download,
  Printer,
  Plus,
  ArrowDownLeft,
  HardHat,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Client, DailyWorkEntry, Payment, LedgerEntry, CompanySettings } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import {
  generateAccountStatementPDF,
  exportAccountStatementToExcel,
} from '../services/export/receiptGenerator';
import { PaymentEntryModal } from '../components/payments/PaymentEntryModal';
import { ReceiptModal } from '../components/receipts/ReceiptModal';

interface ClientAccountDetailPageProps {
  clientId: string;
  onBack: () => void;
}

export const ClientAccountDetailPage: React.FC<ClientAccountDetailPageProps> = ({
  clientId,
  onBack,
}) => {
  const [client, setClient] = useState<Client | null>(null);
  const [workEntries, setWorkEntries] = useState<DailyWorkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);

  const [activeTab, setActiveTab] = useState<'ledger' | 'work' | 'payments'>('ledger');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientAccount();
  }, [clientId]);

  const loadClientAccount = async () => {
    setLoading(true);
    try {
      const [c, work, pList, ledgerList, comp] = await Promise.all([
        db.getClientById(clientId),
        db.getDailyWorkEntries({ clientId }),
        db.getPayments({ accountType: 'Client', accountId: clientId }),
        db.getLedgerEntries('Client', clientId),
        db.getCompanySettings(),
      ]);

      setClient(c || null);
      setWorkEntries(work);
      setPayments(pList);
      setLedger(ledgerList);
      setCompany(comp);
    } catch (e) {
      console.error('Error loading client account details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (client && company) {
      generateAccountStatementPDF(
        'Client',
        client.company_name,
        client.opening_balance,
        ledger,
        company
      );
    }
  };

  const handleExportExcel = () => {
    if (client) {
      exportAccountStatementToExcel(
        'Client',
        client.company_name,
        ledger,
        client.opening_balance
      );
    }
  };

  if (loading || !client) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading client financial ledger...
      </div>
    );
  }

  const currentDue = client.current_due || 0;

  return (
    <div className="space-y-6">
      {/* Back Button & Top Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Client Account Ledger
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {client.company_name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>+ Record Payment Received</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-amber-500" />
            <span>Print PDF Statement</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Client Overview Card & Key Balance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Profile Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-slate-900 text-sm">{client.client_name}</span>
          </div>
          <p className="text-slate-600 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400" /> {client.phone}
          </p>
          <p className="text-slate-600 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {client.address}
          </p>
          {client.gst_number && (
            <p className="text-slate-600 font-mono text-[11px]">GST: {client.gst_number}</p>
          )}
          {client.notes && (
            <p className="rounded bg-slate-50 p-2 text-[11px] text-slate-500 border border-slate-200">
              {client.notes}
            </p>
          )}
        </div>

        {/* Total Billed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Billed Work Value
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatINR(client.total_billed || 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Opening Bal: {formatINR(client.opening_balance)}
          </p>
        </div>

        {/* Total Collected */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Payments Received
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatINR(client.total_paid || 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Last: {client.last_payment_date || 'No receipts yet'}
          </p>
        </div>

        {/* Current Due Net Balance */}
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 shadow-sm text-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Current Outstanding Due
            </span>
            <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
              {formatINR(currentDue)}
            </p>
          </div>
          <span className="text-[10px] text-slate-400">
            Formula: Opening + Work Billed − Payments Received
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'ledger'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Double-Entry Running Ledger ({ledger.length})
        </button>

        <button
          onClick={() => setActiveTab('work')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'work'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Completed Work Entries ({workEntries.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payments Received ({payments.length})
        </button>
      </div>

      {/* Tab Content 1: Full Ledger */}
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
                  <th className="p-3 text-right">Debit (₹) [Billed]</th>
                  <th className="p-3 text-right">Credit (₹) [Received]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-xs text-slate-400">
                      No ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{entry.entry_date}</td>
                      <td className="p-3 font-bold text-slate-800">{entry.transaction_type}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{entry.reference_no || '-'}</td>
                      <td className="p-3 text-slate-600 max-w-xs">{entry.description}</td>
                      <td className="p-3 text-right font-black text-slate-900">
                        {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-600">
                        {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Work Entries */}
      {activeTab === 'work' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Worker / Operator</th>
                  <th className="p-3">Work Type</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Client Rate</th>
                  <th className="p-3 text-right">Client Bill Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workEntries.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{w.work_date}</td>
                    <td className="p-3 font-bold text-slate-900">{w.worker_name}</td>
                    <td className="p-3">{w.work_category}</td>
                    <td className="p-3 font-semibold">
                      {w.quantity} {w.measurement_unit}
                    </td>
                    <td className="p-3 font-medium">₹{w.client_rate_per_unit || 0}</td>
                    <td className="p-3 text-right font-black text-slate-900">
                      {formatINR(w.client_gross_amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Payments Received */}
      {activeTab === 'payments' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Voucher No</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Ref No</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{p.payment_date}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{p.transaction_id}</td>
                    <td className="p-3">{p.payment_mode}</td>
                    <td className="p-3 text-slate-500">{p.reference_number || '-'}</td>
                    <td className="p-3 text-slate-600">{p.description}</td>
                    <td className="p-3 text-right font-black text-emerald-600">{formatINR(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Entry Modal */}
      {isPaymentModalOpen && (
        <PaymentEntryModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          defaultAccountType="Client"
          defaultAccountId={client.id}
          defaultDirection="Inward"
          defaultCategory="Client payment received"
          onSuccess={(newP: Payment) => {
            loadClientAccount();
            setSelectedReceiptPayment(newP);
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
    </div>
  );
};
