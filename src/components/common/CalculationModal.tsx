import React from 'react';
import { X, FileText, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PayrollRecord, PayrollPeriod, CompanySettings } from '../../types';
import { formatINR } from '../../services/payroll/payrollEngine';
import { generateEmployeePayslipPDF } from '../../services/export/exportService';

interface CalculationModalProps {
  record: PayrollRecord | null;
  period: PayrollPeriod;
  company: CompanySettings;
  onClose: () => void;
}

export const CalculationModal: React.FC<CalculationModalProps> = ({
  record,
  period,
  company,
  onClose,
}) => {
  if (!record) return null;

  const metadata = record.calculation_metadata;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Payroll Calculation Breakdown</h3>
              <p className="text-xs text-slate-400">
                {record.employee_name} ({record.employee_code}) — {record.designation}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Monthly Salary</p>
              <p className="text-base font-bold text-slate-900">{formatINR(record.monthly_salary)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Calendar Days</p>
              <p className="text-base font-bold text-slate-900">{record.days_in_month} days</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Daily Wage Rate</p>
              <p className="text-base font-bold text-amber-600">{formatINR(record.daily_rate)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Final Net Pay</p>
              <p className="text-base font-bold text-emerald-600">{formatINR(record.net_pay)}</p>
            </div>
          </div>

          {/* Special Sunday & Sandwich Rules Alert Box */}
          {(metadata?.ruleD_FullSandwichCuts?.length > 0 ||
            metadata?.ruleA_SaturdayAbsentSundays?.length > 0 ||
            metadata?.ruleC_SundayWorkedMondayAbsent?.length > 0 ||
            metadata?.overtimeSundaysCount > 0) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Active Special Rules & Overtime Triggers for this Month
              </div>
              <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                {metadata.overtimeSundaysCount > 0 && (
                  <li>
                    <strong>Sunday Overtime:</strong> Worker completed{' '}
                    <span className="font-semibold">{metadata.sundaysWorkedCount} Sundays</span>. First 2 Sundays are included in base salary;{' '}
                    <span className="font-semibold text-amber-900">{metadata.overtimeSundaysCount} extra Sunday(s)</span> paid at 2.0× daily wage rate (+{formatINR(record.sunday_overtime_pay)}).
                  </li>
                )}
                {metadata.ruleD_FullSandwichCuts?.map((cut, idx) => (
                  <li key={idx} className="text-rose-700 font-medium">
                    <strong>Rule D (Full Sandwich Cut):</strong> Saturday {cut.saturday} Absent + Sunday {cut.sunday} Worked + Monday {cut.monday} Absent. Penalty of 3× daily wage (-{formatINR(cut.deduction)}).
                  </li>
                ))}
                {metadata.ruleA_SaturdayAbsentSundays?.map((sun, idx) => (
                  <li key={idx}>
                    <strong>Rule A:</strong> Saturday absent prior to Sunday {sun} (not worked). Sunday wage forfeited (-{formatINR(record.daily_rate)}).
                  </li>
                ))}
                {metadata.ruleC_SundayWorkedMondayAbsent?.map((sun, idx) => (
                  <li key={idx}>
                    <strong>Rule C:</strong> Sunday {sun} worked, but Monday was Absent. Sunday wage forfeited (-{formatINR(record.daily_rate)}).
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mathematical Step-by-Step Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Step-by-Step Deterministic Calculation Audit
            </h4>
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Step & Description</th>
                    <th className="p-3">Formula</th>
                    <th className="p-3">Computed Values</th>
                    <th className="p-3 text-right">Impact / Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {metadata?.explanationSteps?.map((step, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">
                        {step.step}
                        {step.notes && (
                          <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                            {step.notes}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{step.formula}</td>
                      <td className="p-3 text-slate-600">{step.values}</td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900">
                        {step.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance Summary Grid */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Monthly Attendance Summary
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-400">Present</p>
                <p className="text-sm font-bold text-emerald-600">{metadata?.presentDaysCount || 0}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-400">Half Day</p>
                <p className="text-sm font-bold text-orange-600">{metadata?.halfDaysCount || 0}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-400">Absent</p>
                <p className="text-sm font-bold text-rose-600">{metadata?.absentDaysCount || 0}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-400">Leave</p>
                <p className="text-sm font-bold text-indigo-600">{metadata?.leaveDaysCount || 0}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-400">Worked Sundays</p>
                <p className="text-sm font-bold text-amber-600">{metadata?.sundaysWorkedCount || 0}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-400">OT Sundays</p>
                <p className="text-sm font-bold text-amber-700">{metadata?.overtimeSundaysCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={() => generateEmployeePayslipPDF(record, period, company)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <FileText className="h-4 w-4 text-amber-400" />
            Download PDF Payslip
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
