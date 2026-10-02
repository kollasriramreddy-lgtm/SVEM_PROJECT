import React, { useState, useEffect } from 'react';
import { X, HandCoins, Building2, Users, HardHat, Check, AlertCircle } from 'lucide-react';
import { Advance, AdvanceType, AccountType, PaymentMode, Employee, Vendor, Client, Site } from '../../types';
import { db } from '../../services/db/database';
import { formatINR } from '../../services/payroll/payrollEngine';

interface AdvanceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (advance: Advance) => void;
  defaultAccountType?: AccountType;
  defaultAccountId?: string;
}

export const AdvanceEntryModal: React.FC<AdvanceEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultAccountType = 'Worker',
  defaultAccountId,
}) => {
  const [advanceDate, setAdvanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [accountType, setAccountType] = useState<AccountType>(defaultAccountType);
  const [accountId, setAccountId] = useState<string>(defaultAccountId || '');
  const [advanceType, setAdvanceType] = useState<AdvanceType>('Cash advance');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [siteId, setSiteId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [recoveryMethod, setRecoveryMethod] = useState<string>('Deduct from future daily work settlements');

  const [workers, setWorkers] = useState<Employee[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setAccountType(defaultAccountType);
      if (defaultAccountId) setAccountId(defaultAccountId);
      setAmount('');
      setReason('');
      setError(null);
    }
  }, [isOpen, defaultAccountType, defaultAccountId]);

  const loadData = async () => {
    try {
      const [wList, vList, cList, sList] = await Promise.all([
        db.getEmployees(),
        db.getVendors(),
        db.getClients(),
        db.getSites(),
      ]);
      setWorkers(wList);
      setVendors(vList);
      setClients(cList);
      setSites(sList);

      if (!defaultAccountId) {
        if (defaultAccountType === 'Worker' && wList.length > 0) setAccountId(wList[0].id);
        else if (defaultAccountType === 'Vendor' && vList.length > 0) setAccountId(vList[0].id);
        else if (defaultAccountType === 'Client' && cList.length > 0) setAccountId(cList[0].id);
      }
    } catch (e) {
      console.error('Error loading advance modal dependencies:', e);
    }
  };

  const getAccountName = () => {
    if (accountType === 'Worker' || accountType === 'Compressor Operator') {
      const w = workers.find((x) => x.id === accountId);
      return w ? w.full_name : 'Worker';
    }
    if (accountType === 'Vendor' || accountType === 'Supplier') {
      const v = vendors.find((x) => x.id === accountId);
      return v ? v.company_name : 'Vendor';
    }
    const c = clients.find((x) => x.id === accountId);
    return c ? c.company_name : 'Client';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid advance amount.');
      return;
    }
    if (!accountId) {
      setError('Please select an account beneficiary.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the advance.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accountName = getAccountName();
      const site = sites.find((s) => s.id === siteId);

      const created = await db.createAdvance({
        advance_date: advanceDate,
        account_type: accountType,
        account_id: accountId,
        account_name: accountName,
        advance_type: advanceType,
        amount: numAmount,
        payment_mode: paymentMode,
        site_id: siteId || undefined,
        site_name: site ? site.site_name : undefined,
        reason: reason,
        recovery_method: recoveryMethod,
        status: 'Active',
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to issue advance.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-500 p-2 text-slate-950 font-black">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Issue Cash / Diesel Advance</h2>
              <p className="text-xs text-slate-400">Track unrecovered balances & future settlement deductions</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Category</label>
              <select
                value={accountType}
                onChange={(e) => {
                  const val = e.target.value as AccountType;
                  setAccountType(val);
                  if (val === 'Worker' && workers.length > 0) setAccountId(workers[0].id);
                  if (val === 'Vendor' && vendors.length > 0) setAccountId(vendors[0].id);
                  if (val === 'Client' && clients.length > 0) setAccountId(clients[0].id);
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                <option value="Worker">Worker / Operator</option>
                <option value="Vendor">Vendor / Supplier</option>
                <option value="Client">Client</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Person / Company</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
              >
                {accountType === 'Worker' &&
                  workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.worker_type})
                    </option>
                  ))}
                {accountType === 'Vendor' &&
                  vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.company_name}
                    </option>
                  ))}
                {accountType === 'Client' &&
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Advance Type</label>
              <select
                value={advanceType}
                onChange={(e) => setAdvanceType(e.target.value as AdvanceType)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
              >
                <option value="Cash advance">Cash advance</option>
                <option value="Diesel advance">Diesel advance</option>
                <option value="Salary advance">Salary advance</option>
                <option value="Material advance">Material advance</option>
                <option value="Vendor advance">Vendor advance</option>
                <option value="Client advance">Client advance</option>
                <option value="Other advance">Other advance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Google Pay">Google Pay</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Advance Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-7 pr-3 py-2 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Advance Date</label>
              <input
                type="date"
                required
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Purpose</label>
            <input
              type="text"
              required
              placeholder="e.g. Medical emergency / diesel fueling at site"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Recovery Plan</label>
            <input
              type="text"
              placeholder="e.g. Deduct ₹1,000 per daily work settlement"
              value={recoveryMethod}
              onChange={(e) => setRecoveryMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
            />
          </div>

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
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{loading ? 'Issuing Advance...' : 'Issue Advance & Post Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
