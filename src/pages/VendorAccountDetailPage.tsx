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
  ArrowUpRight,
  Package,
  Calendar,
  Tag,
} from 'lucide-react';
import { Vendor, PurchaseBill, Payment, LedgerEntry, CompanySettings } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import {
  generateAccountStatementPDF,
  exportAccountStatementToExcel,
} from '../services/export/receiptGenerator';
import { PaymentEntryModal } from '../components/payments/PaymentEntryModal';
import { ReceiptModal } from '../components/receipts/ReceiptModal';

interface VendorAccountDetailPageProps {
  vendorId: string;
  onBack: () => void;
}

export const VendorAccountDetailPage: React.FC<VendorAccountDetailPageProps> = ({
  vendorId,
  onBack,
}) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);

  const [activeTab, setActiveTab] = useState<'ledger' | 'purchases' | 'payments'>('ledger');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendorAccount();
  }, [vendorId]);

  const loadVendorAccount = async () => {
    setLoading(true);
    try {
      const [v, bills, pList, ledgerList, comp] = await Promise.all([
        db.getVendorById(vendorId),
        db.getPurchaseBills(vendorId),
        db.getPayments({ accountType: 'Vendor', accountId: vendorId }),
        db.getLedgerEntries('Vendor', vendorId),
        db.getCompanySettings(),
      ]);

      setVendor(v || null);
      setPurchaseBills(bills);
      setPayments(pList);
      setLedger(ledgerList);
      setCompany(comp);
    } catch (e) {
      console.error('Error loading vendor account details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (vendor && company) {
      generateAccountStatementPDF(
        'Vendor',
        vendor.company_name,
        vendor.opening_balance,
        ledger,
        company
      );
    }
  };

  const handleExportExcel = () => {
    if (vendor) {
      exportAccountStatementToExcel(
        'Vendor',
        vendor.company_name,
        ledger,
        vendor.opening_balance
      );
    }
  };

  if (loading || !vendor) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading vendor financial ledger...
      </div>
    );
  }

  const currentBal = vendor.current_balance || 0;

  return (
    <div className="space-y-6">
      {/* Back Button & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vendor Supplier Ledger
              </span>
              <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                {vendor.vendor_category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {vendor.company_name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>+ Make Payment</span>
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

      {/* Vendor Overview Card & Key Balance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Profile Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-600" />
            <span className="font-bold text-slate-900 text-sm">{vendor.vendor_name || vendor.company_name}</span>
          </div>
          <p className="text-slate-600 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400" /> {vendor.phone}
          </p>
          <p className="text-slate-600 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {vendor.address}
          </p>
          {vendor.gst_number && (
            <p className="text-slate-600 font-mono text-[11px]">GST: {vendor.gst_number}</p>
          )}
        </div>

        {/* Total Purchases */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Material Supplies
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatINR(vendor.total_purchases || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Opening Bal: {formatINR(vendor.opening_balance)}
          </p>
        </div>

        {/* Total Payments Made */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Payments Disbursed
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatINR(vendor.total_payments_made || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Last: {vendor.last_payment_date || 'No payments recorded'}
          </p>
        </div>

        {/* Current Balance */}
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 shadow-sm text-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {vendor.balance_type === 'payable'
                ? 'Payable to Vendor'
                : vendor.balance_type === 'receivable'
                ? 'Advance Receivable'
                : 'Settled Balance'}
            </span>
            <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
              {formatINR(Math.abs(currentBal))}
            </p>
          </div>
          <span className="text-[10px] text-slate-400">
            Formula: Opening + Bills − Payments − Advances
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
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'purchases'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Purchase Bills ({purchaseBills.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payments Made ({payments.length})
        </button>
      </div>

      {/* Tab 1: Ledger */}
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
                  <th className="p-3 text-right">Debit (₹) [Paid]</th>
                  <th className="p-3 text-right">Credit (₹) [Billed]</th>
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
                      <td className="p-3 text-right font-black text-emerald-600">
                        {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
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

      {/* Tab 2: Purchase Bills */}
      {activeTab === 'purchases' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Bill Date</th>
                  <th className="p-3">Bill Number</th>
                  <th className="p-3">Materials Count</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3 text-right">Credit Balance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{b.bill_date}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{b.bill_number}</td>
                    <td className="p-3">{b.items.length} item(s)</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatINR(b.total_amount)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{formatINR(b.amount_paid)}</td>
                    <td className="p-3 text-right font-bold text-rose-600">{formatINR(b.credit_amount)}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payments Made */}
      {activeTab === 'payments' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Voucher No</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Ref No</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{p.payment_date}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{p.transaction_id}</td>
                    <td className="p-3">{p.payment_category}</td>
                    <td className="p-3">{p.payment_mode}</td>
                    <td className="p-3 text-slate-500">{p.reference_number || '-'}</td>
                    <td className="p-3 text-slate-600">{p.description}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatINR(p.amount)}</td>
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
          defaultAccountType="Vendor"
          defaultAccountId={vendor.id}
          defaultDirection="Outward"
          defaultCategory="Vendor payment"
          onSuccess={(newP) => {
            loadVendorAccount();
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
