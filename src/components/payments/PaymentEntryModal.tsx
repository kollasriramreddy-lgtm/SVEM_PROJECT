import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Users,
  HardHat,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Upload,
  Check,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
} from 'lucide-react';
import {
  AccountType,
  PaymentDirection,
  PaymentMode,
  PaymentCategory,
  Client,
  Vendor,
  Employee,
  Site,
  Payment,
  CompanySettings,
} from '../../types';
import { db } from '../../services/db/database';
import { formatINR } from '../../services/payroll/payrollEngine';

interface PaymentEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
  defaultAccountType?: AccountType;
  defaultAccountId?: string;
  defaultDirection?: PaymentDirection;
  defaultCategory?: PaymentCategory;
}

export const PaymentEntryModal: React.FC<PaymentEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultAccountType = 'Vendor',
  defaultAccountId,
  defaultDirection = 'Outward',
  defaultCategory = 'Vendor payment',
}) => {
  const [accountType, setAccountType] = useState<AccountType>(defaultAccountType);
  const [accountId, setAccountId] = useState<string>(defaultAccountId || '');
  const [direction, setDirection] = useState<PaymentDirection>(defaultDirection);
  const [category, setCategory] = useState<PaymentCategory>(defaultCategory);
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [siteId, setSiteId] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [workers, setWorkers] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [existingPayments, setExistingPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      setAccountType(defaultAccountType);
      if (defaultAccountId) setAccountId(defaultAccountId);
      setDirection(defaultDirection);
      setCategory(defaultCategory);
      setAmount('');
      setDescription('');
      setReferenceNumber('');
      setError(null);
      setDuplicateWarning(false);
    }
  }, [isOpen, defaultAccountType, defaultAccountId, defaultDirection, defaultCategory]);

  const loadDependencies = async () => {
    try {
      const [cList, vList, wList, sList, pList] = await Promise.all([
        db.getClients(),
        db.getVendors(),
        db.getEmployees(),
        db.getSites(),
        db.getPayments(),
      ]);
      setClients(cList);
      setVendors(vList);
      setWorkers(wList);
      setSites(sList);
      setExistingPayments(pList);

      if (defaultAccountId) {
        setAccountId(defaultAccountId);
      } else if (defaultAccountType === 'Vendor' && vList.length > 0) {
        setAccountId(vList[0].id);
      } else if (defaultAccountType === 'Client' && cList.length > 0) {
        setAccountId(cList[0].id);
      } else if (wList.length > 0) {
        setAccountId(wList[0].id);
      }
    } catch (e) {
      console.error('Error loading payment form entities:', e);
    }
  };

  // Switch categories automatically when Account Type changes
  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
    setError(null);

    if (type === 'Client') {
      setDirection('Inward');
      setCategory('Client payment received');
      if (clients.length > 0) setAccountId(clients[0].id);
    } else if (type === 'Vendor' || type === 'Supplier') {
      setDirection('Outward');
      setCategory('Vendor payment');
      if (vendors.length > 0) setAccountId(vendors[0].id);
    } else if (type === 'Worker' || type === 'Compressor Operator') {
      setDirection('Outward');
      setCategory('Worker salary');
      if (workers.length > 0) setAccountId(workers[0].id);
    }
  };

  // Check duplicate payment
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0 && accountId && paymentDate) {
      const isDuplicate = existingPayments.some(
        (p) =>
          p.account_id === accountId &&
          p.payment_date === paymentDate &&
          p.amount === numAmount &&
          p.status === 'Approved'
      );
      setDuplicateWarning(isDuplicate);
    } else {
      setDuplicateWarning(false);
    }
  }, [amount, accountId, paymentDate, existingPayments]);

  const getSelectedAccountName = () => {
    if (accountType === 'Client') {
      const c = clients.find((x) => x.id === accountId);
      return c ? c.company_name || c.client_name : 'Selected Client';
    }
    if (accountType === 'Vendor' || accountType === 'Supplier') {
      const v = vendors.find((x) => x.id === accountId);
      return v ? v.company_name || v.vendor_name : 'Selected Vendor';
    }
    const w = workers.find((x) => x.id === accountId);
    return w ? w.full_name : 'Selected Worker';
  };

  const getSelectedAccountCurrentBalance = () => {
    if (accountType === 'Client') {
      const c = clients.find((x) => x.id === accountId);
      return c?.current_due || 0;
    }
    if (accountType === 'Vendor' || accountType === 'Supplier') {
      const v = vendors.find((x) => x.id === accountId);
      return v?.current_balance || 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }
    if (!accountId) {
      setError('Please select an account.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accountName = getSelectedAccountName();
      const site = sites.find((s) => s.id === siteId);

      const newPayment = await db.createPayment({
        payment_date: paymentDate,
        account_type: accountType,
        account_id: accountId,
        account_name: accountName,
        payment_direction: direction,
        payment_category: category,
        amount: numAmount,
        payment_mode: paymentMode,
        reference_number: referenceNumber || undefined,
        description: description || `${category} of ${formatINR(numAmount)} for ${accountName}`,
        site_id: siteId || undefined,
        site_name: site ? site.site_name : undefined,
        attachment_url: attachmentUrl || undefined,
        status: 'Approved',
        approval_status: 'Approved',
      });

      onSuccess(newPayment);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentBalance = getSelectedAccountCurrentBalance();
  const numAmount = parseFloat(amount) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-500 p-2 text-slate-950 font-black">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Record Financial Payment</h2>
              <p className="text-xs text-slate-400">
                Post double-entry transaction & update ledger accounts automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Warning:</strong> A matching payment for {formatINR(numAmount)} on {paymentDate} already exists for this account. Proceed only if this is an intentional repeat transaction.
              </span>
            </div>
          )}

          {/* Direction Switcher (Inward vs Outward) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Payment Flow Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDirection('Inward');
                  if (category === 'Vendor payment') setCategory('Client payment received');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  direction === 'Inward'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-400/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                <span>Money Received (Inward)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDirection('Outward');
                  if (category === 'Client payment received') setCategory('Vendor payment');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  direction === 'Outward'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm ring-2 ring-rose-400/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-rose-600" />
                <span>Money Paid Out (Outward)</span>
              </button>
            </div>
          </div>

          {/* Account Type and Target Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={accountType}
                onChange={(e) => handleAccountTypeChange(e.target.value as AccountType)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                <option value="Vendor">Vendor / Supplier</option>
                <option value="Client">Client / Customer</option>
                <option value="Worker">Worker / Machine Operator</option>
                <option value="Compressor Operator">Compressor Operator</option>
                <option value="Other">Other Account</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Account / Beneficiary <span className="text-rose-500">*</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                {accountType === 'Client' &&
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.client_name}) — Due: {formatINR(c.current_due || 0)}
                    </option>
                  ))}

                {(accountType === 'Vendor' || accountType === 'Supplier') &&
                  vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.company_name} ({v.vendor_category}) — Bal: {formatINR(v.current_balance || 0)}
                    </option>
                  ))}

                {(accountType === 'Worker' || accountType === 'Compressor Operator') &&
                  workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.worker_type})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Category & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PaymentCategory)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                {direction === 'Inward' ? (
                  <>
                    <option value="Client payment received">Client payment received</option>
                    <option value="Client advance">Client advance received</option>
                    <option value="Refund">Refund / Return received</option>
                    <option value="Other payment">Other Inward payment</option>
                  </>
                ) : (
                  <>
                    <option value="Vendor payment">Vendor payment</option>
                    <option value="Vendor advance">Vendor advance</option>
                    <option value="Material payment">Material purchase payment</option>
                    <option value="Worker salary">Worker salary payout</option>
                    <option value="Cash advance">Cash advance to worker</option>
                    <option value="Diesel advance">Diesel advance expense</option>
                    <option value="Repair payment">Machine & Equipment repair</option>
                    <option value="Salary adjustment">Salary adjustment</option>
                    <option value="Other payment">Other Outward payment</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI Transfer</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Google Pay">Google Pay</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other Mode</option>
              </select>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Worksite & Reference Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Linked Worksite / Project
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                <option value="">General Project / Office Account</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UTR / Reference / Cheque No.
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-99881122 or CHQ-0021"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Purpose Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Part payment for rock drill bits supply consignment invoice #88"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Dynamic Live Balance Preview Box */}
          {accountId && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Current Account Balance:</span>
                <span className="font-bold text-slate-900">{formatINR(currentBalance)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Projected Balance After Transaction:</span>
                <span className="font-extrabold text-amber-600">
                  {formatINR(
                    direction === 'Inward'
                      ? currentBalance - numAmount
                      : currentBalance - numAmount
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{loading ? 'Recording Entry...' : 'Confirm & Save Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
