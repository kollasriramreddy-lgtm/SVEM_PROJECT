import React, { useState, useEffect } from 'react';
import {
  Calculator,
  RotateCw,
  CheckCircle2,
  Lock,
  Unlock,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  PlusCircle,
  Eye,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Profile,
  PayrollPeriod,
  PayrollRecord,
  CompanySettings,
  AdjustmentType,
} from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import { StatusBadge } from '../components/common/StatusBadge';
import { CalculationModal } from '../components/common/CalculationModal';
import { AdjustmentModal } from '../components/common/AdjustmentModal';
import { ReopenPayrollModal } from '../components/common/ReopenPayrollModal';
import { exportPayrollToExcel, generateMonthlyPayrollPDF, generateEmployeePayslipPDF } from '../services/export/exportService';

interface PayrollPageProps {
  currentUser: Profile;
}

export const PayrollPage: React.FC<PayrollPageProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [records, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);

  // Modals
  const [selectedRecordForCalculation, setSelectedRecordForCalculation] = useState<PayrollRecord | null>(null);
  const [selectedRecordForAdjustment, setSelectedRecordForAdjustment] = useState<PayrollRecord | null>(null);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');
  const [isCalculating, setIsCalculating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayrollData();
  }, [selectedYear, selectedMonth]);

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const comp = await db.getCompanySettings();
      setCompany(comp);

      const res = await db.calculatePayrollForPeriod(selectedYear, selectedMonth);
      setPeriod(res.period);
      setPayrollRecords(res.records);
    } catch (e) {
      console.error('Error loading payroll data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await db.calculatePayrollForPeriod(selectedYear, selectedMonth);
      setPeriod(res.period);
      setPayrollRecords(res.records);
    } catch (e) {
      console.error('Recalculation error:', e);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApprove = async () => {
    if (!period) return;
    if (window.confirm(`Approve calculated payroll for ${period.month}/${period.year}?`)) {
      const updated = await db.approvePayrollPeriod(period.id);
      setPeriod(updated);
    }
  };

  const handleFinalize = async () => {
    if (!period) return;
    if (window.confirm(`Finalize and officially lock payroll for ${period.month}/${period.year}? This will disallow further edits without formal admin reopen justification.`)) {
      const updated = await db.finalizePayrollPeriod(period.id);
      setPeriod(updated);
      // Rewarding celebration animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleReopen = async (periodId: string, reason: string) => {
    const updated = await db.reopenPayrollPeriod(periodId, reason);
    setPeriod(updated);
    await handleRecalculate();
  };

  const handleAddAdjustment = async (
    periodId: string,
    employeeId: string,
    type: AdjustmentType,
    amount: number,
    reason: string
  ) => {
    await db.addPayrollAdjustment(periodId, employeeId, type, amount, reason);
    await loadPayrollData();
  };

  // Financial aggregate totals
  const totalBasePay = records.reduce((acc, r) => acc + r.base_pay, 0);
  const totalSundayOT = records.reduce((acc, r) => acc + r.sunday_overtime_pay, 0);
  const totalAbsenceDeductions = records.reduce((acc, r) => acc + r.absence_deductions, 0);
  const totalSandwichDeductions = records.reduce((acc, r) => acc + r.sandwich_deductions, 0);
  const totalAdjustments = records.reduce((acc, r) => acc + r.adjustments, 0);
  const totalNetDisbursal = records.reduce((acc, r) => acc + r.net_pay, 0);

  const isFinalized = period?.status === 'Finalized';
  const isApproved = period?.status === 'Approved';

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      (r.employee_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.employee_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.designation || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSite = selectedSiteFilter === 'ALL' || r.site_id === selectedSiteFilter;
    return matchesSearch && matchesSite;
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Controls Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500 p-2.5 text-slate-950 font-black shadow-md">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  DETERMINISTIC PAYROLL ENGINE
                </h2>
                {period && <StatusBadge status={period.status} size="sm" />}
              </div>
              <p className="text-xs text-slate-500">
                Rule-based wage computing • Sunday overtime • Sandwich deduction engine • Transparent audit
              </p>
            </div>
          </div>

          {/* Month / Year Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-sm"
            >
              {monthNames.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>{mName}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-sm"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={handleRecalculate}
              disabled={isCalculating || isFinalized}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              title="Recalculate payroll based on latest site attendance logs"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isCalculating ? 'animate-spin text-amber-500' : ''}`} />
              Recalculate
            </button>

            {/* Workflow Action Buttons */}
            {isSuperAdmin && (
              <>
                {!isFinalized && !isApproved && (
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Payroll
                  </button>
                )}

                {!isFinalized && isApproved && (
                  <button
                    onClick={handleFinalize}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-500"
                  >
                    <Lock className="h-4 w-4" />
                    Finalize & Lock
                  </button>
                )}

                {isFinalized && (
                  <button
                    onClick={() => setIsReopenModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
                  >
                    <Unlock className="h-4 w-4" />
                    Reopen Finalized Payroll
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Workflow State Stepper */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { step: '1', title: 'Draft', desc: 'Attendance marked' },
            { step: '2', title: 'Calculated', desc: 'Wages computed' },
            { step: '3', title: 'Under Review', desc: 'Owner inspection' },
            { step: '4', title: 'Approved', desc: 'Wages approved' },
            { step: '5', title: 'Finalized', desc: 'Locked for disbursement' },
          ].map((st, i) => {
            const currentStatus = period?.status || 'Draft';
            const statusOrder = ['Draft', 'Calculated', 'Under Review', 'Approved', 'Finalized'];
            const curIdx = statusOrder.indexOf(currentStatus);
            const isCompleted = curIdx >= i;
            const isCurrent = curIdx === i;

            return (
              <div
                key={i}
                className={`rounded-xl p-2.5 border transition-all ${
                  isCurrent
                    ? 'bg-amber-50 border-amber-400 font-bold text-amber-950 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <p className="text-[10px] font-mono uppercase tracking-wider">{st.step}. {st.title}</p>
                <p className="text-[11px] font-medium mt-0.5 truncate hidden sm:block">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lock Notice if Finalized */}
      {isFinalized && (
        <div className="flex items-center justify-between rounded-xl bg-purple-950 p-4 text-xs text-white border border-purple-800 shadow-md">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">Official Finalized Payroll Period</p>
              <p className="text-purple-200 mt-0.5">
                This period was locked by {period.finalized_by_name || 'Admin'} on{' '}
                {new Date(period.finalized_at || '').toLocaleDateString('en-IN')}. Normal edits are blocked to ensure audit integrity.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsReopenModalOpen(true)}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shrink-0"
          >
            Reopen Period
          </button>
        </div>
      )}

      {/* Financial Aggregates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Base Salary</p>
          <p className="mt-1 text-base font-black text-slate-900">{formatINR(totalBasePay)}</p>
          <p className="text-[10px] text-slate-400">{records.length} Employees</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-amber-800">Sunday OT Pay</p>
          <p className="mt-1 text-base font-black text-amber-900">+{formatINR(totalSundayOT)}</p>
          <p className="text-[10px] text-amber-700">@ 2.0x Daily Wage</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-rose-800">Absence Cuts</p>
          <p className="mt-1 text-base font-black text-rose-900">-{formatINR(totalAbsenceDeductions)}</p>
          <p className="text-[10px] text-rose-700">Unexcused & Leaves</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-rose-800">Sandwich Cuts</p>
          <p className="mt-1 text-base font-black text-rose-900">-{formatINR(totalSandwichDeductions)}</p>
          <p className="text-[10px] text-rose-700">Rule D Penalties</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-blue-800">Adjustments</p>
          <p className="mt-1 text-base font-black text-blue-900">
            {totalAdjustments >= 0 ? '+' : ''}{formatINR(totalAdjustments)}
          </p>
          <p className="text-[10px] text-blue-700">Bonuses & Advances</p>
        </div>

        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-emerald-800">Net Payable</p>
          <p className="mt-1 text-base font-black text-emerald-950">{formatINR(totalNetDisbursal)}</p>
          <p className="text-[10px] text-emerald-700 font-semibold">Total Bank Disbursal</p>
        </div>
      </div>

      {/* Table Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder="Search employee code, name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => company && exportPayrollToExcel(records, period!, company)}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel Export
          </button>
          <button
            onClick={() => company && generateMonthlyPayrollPDF(records, period!, company)}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 shadow-xs"
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            Master PDF
          </button>
        </div>
      </div>

      {/* Payroll Master Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-3">Worker Code & Name</th>
                <th className="p-3">Monthly Base (₹)</th>
                <th className="p-3">Daily Rate (₹)</th>
                <th className="p-3">Sundays (Worked/OT)</th>
                <th className="p-3">Sunday OT (₹)</th>
                <th className="p-3">Absence Cut (₹)</th>
                <th className="p-3">Sandwich Cut (₹)</th>
                <th className="p-3">Adj. (₹)</th>
                <th className="p-3">Net Pay (₹)</th>
                <th className="p-3 text-right">Breakdown & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No payroll records found for this period.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const meta = rec.calculation_metadata;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm">{rec.employee_name}</div>
                        <div className="text-[10px] text-amber-700 font-mono">
                          {rec.employee_code} • {rec.designation}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-800">
                        {formatINR(rec.monthly_salary)}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {formatINR(rec.daily_rate)}
                        <span className="block text-[9px] text-slate-400">/{rec.days_in_month}d</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800">
                          {meta?.sundaysWorkedCount || 0} worked
                        </span>
                        {(meta?.overtimeSundaysCount || 0) > 0 && (
                          <span className="block text-[10px] font-bold text-amber-700">
                            +{meta.overtimeSundaysCount} OT Sun
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-semibold text-amber-700">
                        {rec.sunday_overtime_pay > 0 ? `+${formatINR(rec.sunday_overtime_pay)}` : '-'}
                      </td>
                      <td className="p-3 font-mono text-rose-700">
                        {rec.absence_deductions > 0 ? `-${formatINR(rec.absence_deductions)}` : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-rose-800">
                        {rec.sandwich_deductions > 0 ? `-${formatINR(rec.sandwich_deductions)}` : '-'}
                      </td>
                      <td className="p-3 font-mono">
                        {rec.adjustments !== 0 ? (
                          <span className={rec.adjustments > 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {rec.adjustments > 0 ? '+' : ''}{formatINR(rec.adjustments)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-black text-emerald-700 text-sm">
                        {formatINR(rec.net_pay)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRecordForCalculation(rec)}
                            className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200 border border-slate-300 shadow-xs"
                            title="View step-by-step mathematical breakdown"
                          >
                            <Eye className="h-3.5 w-3.5 text-amber-600" />
                            Calculation
                          </button>

                          {isSuperAdmin && !isFinalized && (
                            <button
                              onClick={() => setSelectedRecordForAdjustment(rec)}
                              className="rounded-lg p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200"
                              title="Add manual adjustment (Bonus/Advance/Deduction)"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => company && generateEmployeePayslipPDF(rec, period!, company)}
                            className="rounded-lg p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                            title="Download PDF Payslip"
                          >
                            <FileText className="h-3.5 w-3.5 text-amber-500" />
                          </button>
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

      {/* Calculation Modal */}
      {selectedRecordForCalculation && company && period && (
        <CalculationModal
          record={selectedRecordForCalculation}
          period={period}
          company={company}
          onClose={() => setSelectedRecordForCalculation(null)}
        />
      )}

      {/* Adjustment Modal */}
      {selectedRecordForAdjustment && period && (
        <AdjustmentModal
          record={selectedRecordForAdjustment}
          periodId={period.id}
          onClose={() => setSelectedRecordForAdjustment(null)}
          onSubmit={handleAddAdjustment}
        />
      )}

      {/* Reopen Finalized Payroll Modal */}
      {isReopenModalOpen && period && (
        <ReopenPayrollModal
          period={period}
          onClose={() => setIsReopenModalOpen(false)}
          onConfirm={handleReopen}
        />
      )}
    </div>
  );
};
