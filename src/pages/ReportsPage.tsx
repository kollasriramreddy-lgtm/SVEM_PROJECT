import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Building,
  Users,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import {
  Profile,
  Site,
  Employee,
  PayrollPeriod,
  PayrollRecord,
  CompanySettings,
} from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import {
  exportPayrollToExcel,
  generateMonthlyPayrollPDF,
  generateEmployeePayslipPDF,
  exportAttendanceToCSV,
} from '../services/export/exportService';

export const ReportsPage: React.FC = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [records, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [searchWorker, setSearchWorker] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, [selectedYear, selectedMonth]);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [comp, allEmp, allSites, res] = await Promise.all([
        db.getCompanySettings(),
        db.getEmployees(),
        db.getSites(),
        db.calculatePayrollForPeriod(selectedYear, selectedMonth),
      ]);

      setCompany(comp);
      setEmployees(allEmp);
      setSites(allSites);
      setPeriod(res.period);
      setPayrollRecords(res.records);
    } catch (e) {
      console.error('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAttendance = async () => {
    const attendances = await db.getAttendanceForMonth(selectedYear, selectedMonth);
    exportAttendanceToCSV(attendances, `SVEM_Attendance_Master_${selectedMonth}_${selectedYear}.csv`);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentPeriodName = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

  const filteredRecords = records.filter(
    (r) =>
      (r.employee_name || '').toLowerCase().includes(searchWorker.toLowerCase()) ||
      (r.employee_code || '').toLowerCase().includes(searchWorker.toLowerCase()) ||
      (r.designation || '').toLowerCase().includes(searchWorker.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900">
              REPORTS & EXPORT CENTER
            </h2>
            <p className="text-xs text-slate-500">
              Official company payslips, monthly payroll master sheets and attendance muster downloads
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
          >
            {monthNames.map((mName, idx) => (
              <option key={idx + 1} value={idx + 1}>{mName}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Monthly Payroll Excel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-all">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
              <FileSpreadsheet className="h-4 w-4" />
              Monthly Payroll Sheet
            </div>
            <h3 className="text-sm font-black text-slate-900">Master Excel (.xlsx) Register</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Complete columnized workbook containing base wages, days in month, Sunday overtime multiplier, absence deductions, and net pay.
            </p>
          </div>
          <button
            onClick={() => company && period && exportPayrollToExcel(records, period, company)}
            disabled={records.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download Excel ({currentPeriodName})
          </button>
        </div>

        {/* 2. Master Payroll PDF */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-400 transition-all">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider mb-2">
              <FileText className="h-4 w-4 text-amber-500" />
              Executive PDF Report
            </div>
            <h3 className="text-sm font-black text-slate-900">Landscape Master PDF</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Official company letterhead document suitable for management audit and bank disbursement records.
            </p>
          </div>
          <button
            onClick={() => company && period && generateMonthlyPayrollPDF(records, period, company)}
            disabled={records.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-amber-400" />
            Download Master PDF
          </button>
        </div>

        {/* 3. Monthly Attendance CSV */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-sky-400 transition-all">
          <div>
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Calendar className="h-4 w-4" />
              Site Attendance Logs
            </div>
            <h3 className="text-sm font-black text-slate-900">Muster Roll CSV Export</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Raw daily shift attendance records including supervisor stamps, timestamps and remarks for all project sites.
            </p>
          </div>
          <button
            onClick={handleExportAttendance}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-600"
          >
            <Download className="h-4 w-4" />
            Download Attendance CSV
          </button>
        </div>
      </div>

      {/* Individual Worker Salary Payslip Generation Hub */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Individual Worker Payslip Generator ({currentPeriodName})
            </h3>
            <p className="text-xs text-slate-500">
              Download formatted salary slips with mathematical audit steps for individual operators and laborers
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search worker name or code..."
              value={searchWorker}
              onChange={(e) => setSearchWorker(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl border border-slate-200 p-4 hover:border-amber-400 transition-all flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{rec.employee_name}</p>
                <p className="text-xs font-mono text-amber-700 font-semibold">{rec.employee_code}</p>
                <p className="text-[11px] text-slate-500">{rec.designation}</p>
                <p className="text-xs font-mono font-bold text-emerald-700 mt-1">
                  Net: {formatINR(rec.net_pay)}
                </p>
              </div>

              <button
                onClick={() => company && period && generateEmployeePayslipPDF(rec, period, company)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 shrink-0 shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                Payslip PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
