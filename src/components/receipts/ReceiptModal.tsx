import React from 'react';
import { X, Printer, Download, Share2, CheckCircle2, Building2, User, Calendar, CreditCard, FileText } from 'lucide-react';
import { Payment, Settlement, CompanySettings } from '../../types';
import { formatINR } from '../../services/payroll/payrollEngine';
import { generatePaymentReceiptPDF, generateSettlementReceiptPDF } from '../../services/export/receiptGenerator';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: Payment | null;
  settlement?: Settlement | null;
  company: CompanySettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  settlement,
  company,
}) => {
  if (!isOpen || (!payment && !settlement)) return null;

  const handleDownloadPDF = () => {
    if (payment) {
      generatePaymentReceiptPDF(payment, company);
    } else if (settlement) {
      generateSettlementReceiptPDF(settlement, company);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isReceived = payment?.payment_direction === 'Inward';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
        {/* Header Action Bar (Hidden during Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-3 text-white print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold tracking-wide">
              {payment ? 'Transaction Receipt Voucher' : 'Worker Settlement Clearance'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Receipt"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-amber-400" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              title="Download PDF"
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 text-slate-800 print:p-8" id="printable-voucher-content">
          {/* Company Brand Header */}
          <div className="border-b border-slate-200 pb-4 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black text-sm mb-1">
              SV
            </div>
            <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
              {company.company_name}
            </h2>
            <p className="text-[11px] font-medium text-slate-500">{company.tagline}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {company.address} • Phone: {company.phone} • GSTIN: {company.gstin}
            </p>
          </div>

          {payment && (
            <>
              {/* Receipt Status Tag */}
              <div className="my-3 flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Voucher No</span>
                  <p className="text-xs font-mono font-bold text-slate-900">{payment.transaction_id}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>
                  <p className="text-xs font-semibold text-slate-700">{payment.payment_date}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                      isReceived ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isReceived ? 'Money Received' : 'Money Paid'}
                  </span>
                </div>
              </div>

              {/* Amount Highlight */}
              <div className="my-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {isReceived ? 'Amount Received' : 'Amount Disbursed'}
                </span>
                <div
                  className={`text-2xl sm:text-3xl font-black mt-1 ${
                    isReceived ? 'text-emerald-600' : 'text-slate-900'
                  }`}
                >
                  {formatINR(payment.amount)}
                </div>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  Via <span className="font-bold">{payment.payment_mode}</span>
                  {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                </p>
              </div>

              {/* Transaction Key Details */}
              <div className="space-y-2 rounded-xl border border-slate-200 p-3 text-xs bg-white">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Account Type:</span>
                  <span className="font-semibold text-slate-800">{payment.account_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Party / Beneficiary:</span>
                  <span className="font-bold text-slate-900">{payment.account_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Payment Category:</span>
                  <span className="font-semibold text-slate-800">{payment.payment_category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Worksite:</span>
                  <span className="font-semibold text-slate-800">{payment.site_name || 'General Operations'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Description:</span>
                  <span className="font-medium text-slate-700 text-right max-w-[280px]">
                    {payment.description}
                  </span>
                </div>
              </div>
            </>
          )}

          {settlement && (
            <>
              {/* Settlement Summary */}
              <div className="my-3 flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Settlement Code</span>
                  <p className="text-xs font-mono font-bold text-slate-900">{settlement.settlement_code}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Period</span>
                  <p className="text-xs font-semibold text-slate-700">
                    {settlement.from_date} to {settlement.to_date}
                  </p>
                </div>
              </div>

              {/* Settlement Grid */}
              <div className="my-3 space-y-1.5 rounded-xl border border-slate-200 p-3 text-xs bg-slate-50">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Worker:</span>
                  <span className="font-bold text-slate-900">{settlement.worker_name} ({settlement.worker_code})</span>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-200">
                  <span className="text-slate-600">Gross Work Earnings:</span>
                  <span className="font-semibold text-slate-800">{formatINR(settlement.total_work_value)}</span>
                </div>
                <div className="flex justify-between py-1 text-rose-600">
                  <span>Less Diesel Advance Deductions:</span>
                  <span className="font-semibold">- {formatINR(settlement.total_diesel_advance)}</span>
                </div>
                <div className="flex justify-between py-1 text-rose-600">
                  <span>Less Cash Advance Deductions:</span>
                  <span className="font-semibold">- {formatINR(settlement.total_cash_advance)}</span>
                </div>
                {settlement.total_other_deductions > 0 && (
                  <div className="flex justify-between py-1 text-rose-600">
                    <span>Less Other Deductions:</span>
                    <span className="font-semibold">- {formatINR(settlement.total_other_deductions)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-t border-slate-200 font-bold text-slate-900">
                  <span>Net Settlement Payable:</span>
                  <span className="text-emerald-600">{formatINR(settlement.net_settlement_amount)}</span>
                </div>
                <div className="flex justify-between py-1 bg-emerald-50 px-2 rounded font-bold text-emerald-800">
                  <span>Amount Paid Now ({settlement.payment_mode || 'Cash'}):</span>
                  <span>{formatINR(settlement.amount_paid_now)}</span>
                </div>
                {settlement.remaining_carry_forward > 0 && (
                  <div className="flex justify-between py-1 text-amber-700 font-semibold">
                    <span>Balance Carried Forward:</span>
                    <span>{formatINR(settlement.remaining_carry_forward)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Signature Block */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-300 flex justify-between items-end text-[11px] text-slate-500">
            <div className="text-center">
              <div className="h-8 border-b border-slate-400 w-32 mb-1" />
              <span>Receiver's Signature</span>
            </div>
            <div className="text-center">
              <div className="h-8 border-b border-slate-400 w-36 mb-1" />
              <span className="font-bold text-slate-700">Authorized Signatory (SVEM)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
