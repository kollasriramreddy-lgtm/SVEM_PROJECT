import React, { useEffect, useState } from 'react';
import {
  Users,
  MapPin,
  HardHat,
  CalendarCheck,
  Calculator,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
  DollarSign,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Fuel,
  HandCoins,
  Receipt,
  FileSpreadsheet,
  Filter,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Profile,
  Site,
  Employee,
  Client,
  Vendor,
  DailyWorkEntry,
  Payment,
  AccountsDashboardSummary,
  DashboardFilter,
  CompanySettings,
} from '../types';
import { db } from '../services/db/database';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatINR } from '../services/payroll/payrollEngine';
import { QuickActionsBar } from '../components/common/QuickActionsBar';
import { PaymentEntryModal } from '../components/payments/PaymentEntryModal';
import { WorkDoneTodayModal } from '../components/work/WorkDoneTodayModal';
import { AdvanceEntryModal } from '../components/advances/AdvanceEntryModal';
import { WorkerSettlementModal } from '../components/settlement/WorkerSettlementModal';
import { ReceiptModal } from '../components/receipts/ReceiptModal';

interface DashboardPageProps {
  currentUser: Profile;
  onNavigate: (tabId: string, entityId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigate }) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [summary, setSummary] = useState<AccountsDashboardSummary>({
    totalClientReceivables: 0,
    totalVendorPayables: 0,
    totalWorkerEarnings: 0,
    totalCashAdvances: 0,
    totalDieselAdvances: 0,
    totalPaymentsReceived: 0,
    totalPaymentsMade: 0,
    totalOutstandingBalance: 0,
    todayWorkValue: 0,
    todayFeetCompleted: 0,
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    thisMonthNetMargin: 0,
    overdueClientsCount: 0,
    overdueVendorsCount: 0,
    unsettledWorkersCount: 0,
  });

  const [filter, setFilter] = useState<DashboardFilter>({
    dateRange: 'this_month',
    siteId: '',
    clientId: '',
    vendorId: '',
    workerId: '',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [workers, setWorkers] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentWork, setRecentWork] = useState<DailyWorkEntry[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  const [loading, setLoading] = useState(true);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWorkTodayModalOpen, setIsWorkTodayModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [filter, currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sum, cList, vList, wList, sList, pList, workList, company] = await Promise.all([
        db.getAccountsDashboardSummary(filter),
        db.getClients(),
        db.getVendors(),
        db.getEmployees(),
        db.getSites(),
        db.getPayments(),
        db.getDailyWorkEntries(),
        db.getCompanySettings(),
      ]);

      setSummary(sum);
      setClients(cList);
      setVendors(vList);
      setWorkers(wList);
      setSites(sList);
      setRecentPayments(pList.slice(0, 7));
      setRecentWork(workList.slice(0, 6));
      setCompanySettings(company);
    } catch (e) {
      console.error('Error loading accounts dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePreset = (preset: 'today' | 'this_week' | 'this_month' | 'custom') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setFilter({ ...filter, dateRange: 'today', startDate: todayStr, endDate: todayStr });
    } else if (preset === 'this_week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      setFilter({
        ...filter,
        dateRange: 'this_week',
        startDate: weekStart.toISOString().split('T')[0],
        endDate: todayStr,
      });
    } else if (preset === 'this_month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      setFilter({
        ...filter,
        dateRange: 'this_month',
        startDate: monthStart.toISOString().split('T')[0],
        endDate: todayStr,
      });
    } else {
      setFilter({ ...filter, dateRange: 'custom' });
    }
  };

  const overdueClientsList = clients.filter((c) => (c.current_due || 0) > 0).slice(0, 4);
  const overdueVendorsList = vendors
    .filter((v) => v.balance_type === 'payable' && (v.current_balance || 0) > 0)
    .slice(0, 4);

  // Financial Chart Data
  const financialBarData = [
    { name: 'Collections (Inward)', amount: summary.totalPaymentsReceived, fill: '#10b981' },
    { name: 'Disbursements (Outward)', amount: summary.totalPaymentsMade, fill: '#f43f5e' },
    { name: 'Worker Earnings', amount: summary.totalWorkerEarnings, fill: '#f59e0b' },
    { name: 'Diesel Debits', amount: summary.totalDieselAdvances, fill: '#0ea5e9' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions Strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Contractor Financial Overview
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-300">Live Accounts & Work Register</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-white">
            Main Accounts Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Excavation, Rock Drilling, Compressor Operations, Advances & Double-Entry Financials
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <QuickActionsBar
          onOpenWorkToday={() => setIsWorkTodayModalOpen(true)}
          onOpenPayment={() => setIsPaymentModalOpen(true)}
          onOpenAdvance={() => setIsAdvanceModalOpen(true)}
          onOpenSettlement={() => setIsSettlementModalOpen(true)}
          onOpenAddClient={() => onNavigate('clients')}
          onOpenAddVendor={() => onNavigate('vendors')}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-bold text-slate-700 mr-1">
            <Filter className="h-3.5 w-3.5 text-amber-500" /> Filter:
          </span>

          <button
            onClick={() => handleDatePreset('today')}
            className={`rounded-lg px-2.5 py-1.5 font-bold transition-all ${
              filter.dateRange === 'today'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>

          <button
            onClick={() => handleDatePreset('this_week')}
            className={`rounded-lg px-2.5 py-1.5 font-bold transition-all ${
              filter.dateRange === 'this_week'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            This Week
          </button>

          <button
            onClick={() => handleDatePreset('this_month')}
            className={`rounded-lg px-2.5 py-1.5 font-bold transition-all ${
              filter.dateRange === 'this_month'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>
        </div>

        {/* Worksite & Client Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filter.siteId || ''}
            onChange={(e) => setFilter({ ...filter, siteId: e.target.value })}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Worksites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.site_name}
              </option>
            ))}
          </select>

          <select
            value={filter.clientId || ''}
            onChange={(e) => setFilter({ ...filter, clientId: e.target.value })}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>

          <button
            onClick={loadDashboardData}
            title="Refresh Totals"
            className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 8 Core Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Client Receivables */}
        <div
          onClick={() => onNavigate('clients')}
          className="cursor-pointer transition-all hover:scale-[1.01]"
        >
          <StatCard
            title="Total Client Receivables"
            value={formatINR(summary.totalClientReceivables)}
            subtitle="Outstanding bills & uncollected client payments"
            icon={Building2}
            trend={{ value: `${summary.overdueClientsCount} Clients`, isPositive: true }}
            accentColor="emerald"
          />
        </div>

        {/* 2. Vendor Payables */}
        <div
          onClick={() => onNavigate('vendors')}
          className="cursor-pointer transition-all hover:scale-[1.01]"
        >
          <StatCard
            title="Total Vendor Payables"
            value={formatINR(summary.totalVendorPayables)}
            subtitle="Drill bits, explosives, diesel & spare parts dues"
            icon={CreditCard}
            trend={{ value: `${summary.overdueVendorsCount} Vendors`, isPositive: false }}
            accentColor="rose"
          />
        </div>

        {/* 3. Today's Completed Work Value */}
        <div
          onClick={() => onNavigate('daily-work')}
          className="cursor-pointer transition-all hover:scale-[1.01]"
        >
          <StatCard
            title="Today's Work Value"
            value={formatINR(summary.todayWorkValue)}
            subtitle={`${summary.todayFeetCompleted.toLocaleString()} feet drilled / measured today`}
            icon={Activity}
            trend={{ value: 'Live daily entry', isPositive: true }}
            accentColor="amber"
          />
        </div>

        {/* 4. Total Net Outstanding Balance */}
        <div className="transition-all hover:scale-[1.01]">
          <StatCard
            title="Net Balance (Receivables - Payables)"
            value={formatINR(summary.totalOutstandingBalance)}
            subtitle="Overall company operational solvency"
            icon={TrendingUp}
            trend={{
              value: summary.totalOutstandingBalance >= 0 ? '+ Positive net equity' : '- Payables exceed dues',
              isPositive: summary.totalOutstandingBalance >= 0,
            }}
            accentColor={summary.totalOutstandingBalance >= 0 ? 'emerald' : 'rose'}
          />
        </div>

        {/* 5. Payments Received (Inward) */}
        <div
          onClick={() => onNavigate('payment-history')}
          className="cursor-pointer transition-all hover:scale-[1.01]"
        >
          <StatCard
            title="Payments Received"
            value={formatINR(summary.totalPaymentsReceived)}
            subtitle="Bank transfers, UPI & client settlements"
            icon={ArrowDownLeft}
            accentColor="emerald"
          />
        </div>

        {/* 6. Payments Made (Outward) */}
        <div
          onClick={() => onNavigate('payment-history')}
          className="cursor-pointer transition-all hover:scale-[1.01]"
        >
          <StatCard
            title="Payments Made"
            value={formatINR(summary.totalPaymentsMade)}
            subtitle="Vendor bills, salaries & site disbursements"
            icon={ArrowUpRight}
            accentColor="rose"
          />
        </div>

        {/* 7. Total Cash Advances */}
        <div
          onClick={() => onNavigate('advances')}
          className="cursor-pointer transition-all hover:scale-[1.01]"
        >
          <StatCard
            title="Total Cash Advances"
            value={formatINR(summary.totalCashAdvances)}
            subtitle="Unrecovered emergency site cash issued"
            icon={HandCoins}
            accentColor="amber"
          />
        </div>

        {/* 8. Total Diesel Advances */}
        <div
          onClick={() => onNavigate('advances')}
          className="cursor-pointer transition-all hover:scale-[1.01]"
        >
          <StatCard
            title="Total Diesel Advances"
            value={formatINR(summary.totalDieselAdvances)}
            subtitle="Company supplied bowser diesel debit"
            icon={Fuel}
            accentColor="blue"
          />
        </div>
      </div>

      {/* Middle Section: Financial Chart + Overdue Balances Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Inflow vs Outflow Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Income, Expenses & Contractor Flows
              </h2>
              <p className="text-xs text-slate-500">
                Collections vs Disbursements vs Operator Value
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                Month Net: {formatINR(summary.thisMonthNetMargin)}
              </span>
            </div>
          </div>

          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialBarData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [formatINR(Number(value)), 'Amount']} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Overdue Accounts Alert Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Overdue Balances
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Action Needed</span>
            </div>

            {/* Overdue Clients */}
            <div className="mt-3 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Client Pending Collections
              </span>
              {overdueClientsList.length === 0 ? (
                <p className="text-xs text-slate-400 py-1">No overdue client accounts.</p>
              ) : (
                overdueClientsList.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('clients', c.id)}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs hover:bg-amber-50/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{c.company_name}</p>
                      <p className="text-[10px] text-slate-500">{c.phone}</p>
                    </div>
                    <span className="font-black text-rose-600">{formatINR(c.current_due || 0)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Overdue Vendors */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vendor Pending Payables
              </span>
              {overdueVendorsList.length === 0 ? (
                <p className="text-xs text-slate-400 py-1">All vendor bills settled.</p>
              ) : (
                overdueVendorsList.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => onNavigate('vendors', v.id)}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs hover:bg-amber-50/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{v.company_name}</p>
                      <p className="text-[10px] text-slate-500">{v.vendor_category}</p>
                    </div>
                    <span className="font-black text-amber-700">{formatINR(v.current_balance || 0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
            <button
              onClick={() => onNavigate('clients')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              View All Clients →
            </button>
            <button
              onClick={() => onNavigate('vendors')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              View All Vendors →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Payments & Work Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments Feed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Recent Payment Transactions
              </h2>
              <p className="text-xs text-slate-500">Live Inward & Outward vouchers</p>
            </div>
            <button
              onClick={() => onNavigate('payment-history')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Full History</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No payment entries logged yet.</p>
            ) : (
              recentPayments.map((p) => {
                const isRec = p.payment_direction === 'Inward';
                return (
                  <div key={p.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`rounded-lg p-2 ${
                          isRec ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isRec ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{p.account_name}</p>
                        <p className="text-[10px] text-slate-500">
                          {p.payment_date} • {p.payment_category} • {p.payment_mode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`font-black ${isRec ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isRec ? '+' : '-'} {formatINR(p.amount)}
                      </span>
                      <button
                        onClick={() => setSelectedReceiptPayment(p)}
                        title="View & Print Voucher"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Daily Work Entries */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Recent Daily Work Logged
              </h2>
              <p className="text-xs text-slate-500">Feet drilling, rock cutting & excavator operations</p>
            </div>
            <button
              onClick={() => onNavigate('daily-work')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Work Register</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentWork.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No daily work entries logged yet.</p>
            ) : (
              recentWork.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-600 font-bold">
                      <HardHat className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">
                        {w.worker_name} — {w.quantity} {w.measurement_unit} ({w.work_category})
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {w.work_date} • {w.site_name} • Rate: ₹{w.rate_per_unit}/{w.measurement_unit}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-slate-900 block">{formatINR(w.net_payable)}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Client Bill: {formatINR(w.client_gross_amount || 0)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reusable Modals */}
      {isPaymentModalOpen && (
        <PaymentEntryModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={(newP) => {
            loadDashboardData();
            setSelectedReceiptPayment(newP);
          }}
        />
      )}

      {isWorkTodayModalOpen && (
        <WorkDoneTodayModal
          isOpen={isWorkTodayModalOpen}
          onClose={() => setIsWorkTodayModalOpen(false)}
          onSuccess={() => loadDashboardData()}
        />
      )}

      {isAdvanceModalOpen && (
        <AdvanceEntryModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          onSuccess={() => loadDashboardData()}
        />
      )}

      {isSettlementModalOpen && (
        <WorkerSettlementModal
          isOpen={isSettlementModalOpen}
          onClose={() => setIsSettlementModalOpen(false)}
          onSuccess={() => loadDashboardData()}
        />
      )}

      {selectedReceiptPayment && companySettings && (
        <ReceiptModal
          isOpen={Boolean(selectedReceiptPayment)}
          onClose={() => setSelectedReceiptPayment(null)}
          payment={selectedReceiptPayment}
          company={companySettings}
        />
      )}
    </div>
  );
};
