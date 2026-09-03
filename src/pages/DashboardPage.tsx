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
  DollarSign,
  Activity,
  FileSpreadsheet,
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
} from 'recharts';
import {
  Profile,
  Site,
  Employee,
  Attendance,
  PayrollPeriod,
  PayrollRecord,
  AuditLog,
} from '../types';
import { db } from '../services/db/database';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatINR } from '../services/payroll/payrollEngine';

interface DashboardPageProps {
  currentUser: Profile;
  onNavigate: (tabId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigate }) => {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [attendancesToday, setAttendancesToday] = useState<Attendance[]>([]);
  const [latestPayrollPeriod, setLatestPayrollPeriod] = useState<PayrollPeriod | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [assignedSiteIds, setAssignedSiteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [allEmp, allSites, allPeriods, allLogs, assignments] = await Promise.all([
        db.getEmployees(),
        db.getSites(),
        db.getPayrollPeriods(),
        db.getAuditLogs(),
        db.getManagerSiteAssignments(),
      ]);

      const mySiteIds = isSuperAdmin
        ? allSites.map((s) => s.id)
        : assignments.filter((a) => a.manager_id === currentUser.id).map((a) => a.site_id);

      setAssignedSiteIds(mySiteIds);
      setEmployees(allEmp.filter((e) => isSuperAdmin || (e.site_id && mySiteIds.includes(e.site_id))));
      setSites(allSites.filter((s) => isSuperAdmin || mySiteIds.includes(s.id)));
      setAuditLogs(allLogs.slice(0, 8));

      // Fetch today's attendance across all assigned sites
      const allAttPromises = mySiteIds.map((sid) => db.getAttendanceForSiteAndDate(sid, todayStr));
      const attArrays = await Promise.all(allAttPromises);
      const flatAtt = attArrays.flat();
      setAttendancesToday(flatAtt);

      // Latest Payroll
      const curPeriod = allPeriods.find((p) => p.year === currentYear && p.month === currentMonth) || allPeriods[0];
      if (curPeriod) {
        setLatestPayrollPeriod(curPeriod);
        const records = await db.getPayrollRecordsForPeriod(curPeriod.id);
        setPayrollRecords(records);
      }
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const presentTodayCount = attendancesToday.filter(
    (a) => a.status === 'Present' || a.status === 'Sunday Duty' || a.status === 'Half Day'
  ).length;
  const absentTodayCount = attendancesToday.filter((a) => a.status === 'Absent').length;
  const totalAssignedWorkers = employees.filter((e) => e.status === 'active').length;
  const pendingAttendanceCount = Math.max(0, totalAssignedWorkers - attendancesToday.length);

  // Financial totals
  const totalPayrollAmount = payrollRecords.reduce((acc, r) => acc + r.net_pay, 0);
  const totalSundayOTAmount = payrollRecords.reduce((acc, r) => acc + r.sunday_overtime_pay, 0);
  const totalSandwichDeductions = payrollRecords.reduce((acc, r) => acc + r.sandwich_deductions, 0);
  const totalAbsenceDeductions = payrollRecords.reduce((acc, r) => acc + r.absence_deductions, 0);

  // Site breakdown data for charts
  const sitePayrollData = sites.map((site) => {
    const siteWorkers = employees.filter((e) => e.site_id === site.id);
    const siteRecords = payrollRecords.filter((r) => r.site_id === site.id);
    const sitePay = siteRecords.reduce((acc, r) => acc + r.net_pay, 0);

    return {
      name: site.site_name.length > 18 ? site.site_code : site.site_name,
      workers: siteWorkers.length,
      payroll: sitePay || siteWorkers.reduce((acc, w) => acc + w.monthly_salary, 0),
    };
  });

  const workerTypeDistribution = [
    { name: 'Excavator Operators', count: employees.filter((e) => e.worker_type === 'Excavator Operator').length, color: '#f59e0b' },
    { name: 'JCB Operators', count: employees.filter((e) => e.worker_type === 'JCB Operator').length, color: '#d97706' },
    { name: 'Rock Drillers', count: employees.filter((e) => e.worker_type === 'Rock Driller').length, color: '#0284c7' },
    { name: 'Heavy Drivers', count: employees.filter((e) => e.worker_type === 'Driver').length, color: '#64748b' },
    { name: 'Laborers & Helpers', count: employees.filter((e) => e.worker_type === 'Laborer' || e.worker_type === 'Helper').length, color: '#10b981' },
    { name: 'Others', count: employees.filter((e) => !['Excavator Operator', 'JCB Operator', 'Rock Driller', 'Driver', 'Laborer', 'Helper'].includes(e.worker_type)).length, color: '#8b5cf6' },
  ].filter((item) => item.count > 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading Hyderabad operations data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                {isSuperAdmin ? 'EXECUTIVE ERP DASHBOARD' : 'SITE SUPERVISOR REGISTER'}
              </span>
              <span className="text-xs text-slate-400">Hyderabad Hub</span>
            </div>
            <h1 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-white">
              Namaste, {currentUser.full_name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              {isSuperAdmin
                ? 'Complete management over earthmoving workforce, site attendance, Sunday overtime & monthly payroll.'
                : `Operational overview for your ${assignedSiteIds.length} assigned excavation & cutting sites.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('attendance')}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:bg-amber-400 transition-all hover:scale-[1.02]"
            >
              <CalendarCheck className="h-4 w-4" />
              Mark Today's Attendance
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => onNavigate('payroll')}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-all"
              >
                <Calculator className="h-4 w-4 text-amber-400" />
                Payroll Engine
              </button>
            )}
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Workforce"
          value={totalAssignedWorkers}
          subtitle={`${sites.length} Active Sites`}
          icon={Users}
          accentColor="amber"
          onClick={() => onNavigate('employees')}
        />
        <StatCard
          title="Present Today"
          value={presentTodayCount}
          subtitle={`${Math.round((presentTodayCount / (totalAssignedWorkers || 1)) * 100)}% attendance rate`}
          icon={CalendarCheck}
          accentColor="emerald"
          onClick={() => onNavigate('attendance')}
        />
        <StatCard
          title="Absent Today"
          value={absentTodayCount}
          subtitle={pendingAttendanceCount > 0 ? `${pendingAttendanceCount} pending logs` : 'All sites submitted'}
          icon={AlertTriangle}
          accentColor={absentTodayCount > 0 ? 'rose' : 'slate'}
          onClick={() => onNavigate('attendance')}
        />

        {isSuperAdmin ? (
          <StatCard
            title={`Payroll (${latestPayrollPeriod?.month || currentMonth}/${latestPayrollPeriod?.year || currentYear})`}
            value={formatINR(totalPayrollAmount || employees.reduce((acc, e) => acc + e.monthly_salary, 0))}
            subtitle={`Status: ${latestPayrollPeriod?.status || 'Draft'}`}
            icon={Calculator}
            accentColor="purple"
            onClick={() => onNavigate('payroll')}
          />
        ) : (
          <StatCard
            title="My Assigned Sites"
            value={sites.length}
            subtitle="Hyderabad Projects"
            icon={MapPin}
            accentColor="blue"
            onClick={() => onNavigate('sites')}
          />
        )}
      </div>

      {/* Super Admin Financial & Operational Summary Row */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Sunday Overtime Disbursal
              </span>
              <Activity className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-amber-950">{formatINR(totalSundayOTAmount)}</p>
            <p className="mt-1 text-xs text-amber-700">
              Paid at 2.0× daily rate for Sundays worked beyond 2 mandatory Sundays.
            </p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Sandwich & Absence Cuts
              </span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-rose-950">
              {formatINR(totalSandwichDeductions + totalAbsenceDeductions)}
            </p>
            <p className="mt-1 text-xs text-rose-700">
              Rule D Sandwich cuts: {formatINR(totalSandwichDeductions)} | Unexcused Absences: {formatINR(totalAbsenceDeductions)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quick Export Actions
                </span>
                <FileSpreadsheet className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Generate formatted PDF salary slips and master Excel registers for company records.
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onNavigate('reports')}
                className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 text-center"
              >
                Open Export Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics & Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Site Performance & Payroll Distribution */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Workforce & Financial Distribution by Site
              </h3>
              <p className="text-xs text-slate-500">
                Comparison of worker headcount and monthly payroll across Hyderabad project sites
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              Active Sites
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sitePayrollData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#f59e0b' }} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'payroll' ? formatINR(Number(value)) : `${value} workers`,
                    name === 'payroll' ? 'Monthly Payroll' : 'Active Workers',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar yAxisId="left" dataKey="workers" fill="#3b82f6" name="workers" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="payroll" fill="#f59e0b" name="payroll" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Worker Type Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Heavy Equipment Operators
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Breakdown by specialization & machinery
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workerTypeDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {workerTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-2">
              {workerTypeDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sites & Recent Audit Log Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sites Operational Status */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Project Sites & Excavation Locations
            </h3>
            <button
              onClick={() => onNavigate('sites')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View All Sites <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {sites.map((site) => {
              const siteWorkers = employees.filter((e) => e.site_id === site.id);
              const siteAttToday = attendancesToday.filter((a) => a.site_id === site.id);
              const presentCount = siteAttToday.filter(
                (a) => a.status === 'Present' || a.status === 'Sunday Duty' || a.status === 'Half Day'
              ).length;

              return (
                <div
                  key={site.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 p-4 hover:border-amber-400 transition-colors gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{site.site_name}</h4>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {site.site_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Client: <span className="font-medium text-slate-700">{site.client_name}</span> • {site.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 text-xs">
                    <div>
                      <p className="text-slate-400">Total Workers</p>
                      <p className="font-bold text-slate-900">{siteWorkers.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Today's Present</p>
                      <p className="font-bold text-emerald-600">{presentCount} / {siteWorkers.length}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('attendance')}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Record
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Audit Trail Stream (Visible to Super Admin) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Administrative Activity
            </h3>
            {isSuperAdmin && (
              <button
                onClick={() => onNavigate('audit-logs')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                All Logs
              </button>
            )}
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{log.description}</p>
                <p className="text-[10px] text-slate-400 mt-1">By: {log.user_name || 'System'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
