import React, { useState, useEffect } from 'react';
import {
  HandCoins,
  Plus,
  Search,
  Filter,
  Users,
  HardHat,
  Fuel,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  Building2,
  TrendingDown,
} from 'lucide-react';
import { Advance, AdvanceType, AccountType, Profile } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import { AdvanceEntryModal } from '../components/advances/AdvanceEntryModal';

interface AdvancesPageProps {
  currentUser: Profile;
  onSelectWorkerAccount?: (workerId: string) => void;
}

export const AdvancesPage: React.FC<AdvancesPageProps> = ({
  currentUser,
  onSelectWorkerAccount,
}) => {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [recoveringAdvance, setRecoveringAdvance] = useState<Advance | null>(null);
  const [recoveryAmount, setRecoveryAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdvances();
  }, [statusFilter, typeFilter]);

  const loadAdvances = async () => {
    setLoading(true);
    try {
      const list = await db.getAdvances({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        advanceType: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setAdvances(list);
    } catch (e) {
      console.error('Error loading advances:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveringAdvance) return;
    const num = parseFloat(recoveryAmount);
    if (isNaN(num) || num <= 0) return;

    try {
      await db.recoverAdvance(recoveringAdvance.id, num);
      setRecoveringAdvance(null);
      setRecoveryAmount('');
      loadAdvances();
    } catch (err) {
      console.error('Error recovering advance:', err);
    }
  };

  const filteredAdvances = advances.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.account_name && a.account_name.toLowerCase().includes(q)) ||
      a.reason.toLowerCase().includes(q) ||
      a.advance_type.toLowerCase().includes(q)
    );
  });

  const totalOutstanding = advances
    .filter((a) => a.status !== 'Fully recovered' && a.status !== 'Cancelled')
    .reduce((sum, a) => sum + (a.remaining_amount || 0), 0);

  const totalIssued = advances
    .filter((a) => a.status !== 'Cancelled')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalRecovered = advances
    .filter((a) => a.status !== 'Cancelled')
    .reduce((sum, a) => sum + (a.recovered_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Advances Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Emergency cash advances, diesel fueling advances & multi-settlement recovery tracking
          </p>
        </div>

        <button
          onClick={() => setIsAdvanceModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors self-start"
        >
          <Plus className="h-4 w-4" />
          <span>+ Issue Advance</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Unrecovered Advances
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">{formatINR(totalOutstanding)}</p>
          <span className="text-[11px] text-slate-400">Active unrecovered balance</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Advances Issued
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatINR(totalIssued)}</p>
          <span className="text-[11px] text-slate-400">Cash + Diesel + Vendor advances</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Recovered Amount
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatINR(totalRecovered)}</p>
          <span className="text-[11px] text-slate-400">Deducted from daily work settlements</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search beneficiary, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-medium focus:outline-none"
          >
            <option value="all">All Advance Types</option>
            <option value="Cash advance">Cash advance</option>
            <option value="Diesel advance">Diesel advance</option>
            <option value="Salary advance">Salary advance</option>
            <option value="Vendor advance">Vendor advance</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses ({advances.length})</option>
            <option value="Active">Active</option>
            <option value="Partially recovered">Partially Recovered</option>
            <option value="Fully recovered">Fully Recovered</option>
          </select>
        </div>
      </div>

      {/* Advances Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Beneficiary</th>
                <th className="p-3">Advance Type</th>
                <th className="p-3">Reason / Purpose</th>
                <th className="p-3">Mode</th>
                <th className="p-3 text-right">Total Advance</th>
                <th className="p-3 text-right">Recovered</th>
                <th className="p-3 text-right bg-slate-950 text-rose-400">Remaining Balance</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-xs text-slate-400">
                    No advances match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{adv.advance_date}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{adv.account_name}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{adv.account_type}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          adv.advance_type === 'Diesel advance'
                            ? 'bg-sky-50 text-sky-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {adv.advance_type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs">{adv.reason}</td>
                    <td className="p-3">{adv.payment_mode}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatINR(adv.amount)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {formatINR(adv.recovered_amount || 0)}
                    </td>
                    <td className="p-3 text-right font-black text-sm text-rose-600 bg-slate-50">
                      {formatINR(adv.remaining_amount || 0)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          adv.status === 'Fully recovered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : adv.status === 'Partially recovered'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {adv.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {adv.status !== 'Fully recovered' && (
                        <button
                          onClick={() => {
                            setRecoveringAdvance(adv);
                            setRecoveryAmount(String(adv.remaining_amount));
                          }}
                          className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
                        >
                          Recover →
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partial Recovery Modal */}
      {recoveringAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <h2 className="text-base font-bold">Record Advance Recovery</h2>
              <button
                onClick={() => setRecoveringAdvance(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecover} className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">{recoveringAdvance.account_name}</p>
                <p className="text-slate-500">{recoveringAdvance.reason}</p>
                <div className="mt-2 flex justify-between font-bold">
                  <span>Total Advance: {formatINR(recoveringAdvance.amount)}</span>
                  <span className="text-rose-600">
                    Remaining: {formatINR(recoveringAdvance.remaining_amount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recovery Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  max={recoveringAdvance.remaining_amount}
                  required
                  value={recoveryAmount}
                  onChange={(e) => setRecoveryAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRecoveringAdvance(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400"
                >
                  Confirm Recovery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Modal */}
      {isAdvanceModalOpen && (
        <AdvanceEntryModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          onSuccess={() => loadAdvances()}
        />
      )}
    </div>
  );
};
