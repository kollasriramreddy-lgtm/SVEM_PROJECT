import React, { useState, useEffect } from 'react';
import { History, Calendar, Filter, FileSpreadsheet, Search, Check, X, Sparkles, MapPin } from 'lucide-react';
import { Profile, Site, Employee, Attendance, AttendanceStatus } from '../types';
import { db } from '../services/db/database';
import { getDaysInMonth, formatINR } from '../services/payroll/payrollEngine';
import { exportAttendanceToCSV } from '../services/export/exportService';

interface AttendanceHistoryPageProps {
  currentUser: Profile;
}

export const AttendanceHistoryPage: React.FC<AttendanceHistoryPageProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    worker: Employee;
    dateStr: string;
    dayNum: number;
    attendance?: Attendance;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const daysCount = getDaysInMonth(selectedYear, selectedMonth);

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSites, allEmp, monthAtt, assignments] = await Promise.all([
        db.getSites(),
        db.getEmployees(),
        db.getAttendanceForMonth(selectedYear, selectedMonth),
        db.getManagerSiteAssignments(),
      ]);

      const allowedSites = isSuperAdmin
        ? allSites
        : allSites.filter((s) =>
            assignments.some((a) => a.manager_id === currentUser.id && a.site_id === s.id)
          );

      setSites(allowedSites);
      setEmployees(allEmp.filter((e) => isSuperAdmin || allowedSites.some((s) => s.id === e.site_id)));
      setAttendances(monthAtt);
    } catch (e) {
      console.error('Error loading attendance history:', e);
    } finally {
      setLoading(false);
    }
  };

  // Build mapping: `${employee_id}_${dateStr}` -> Attendance
  const attMap = new Map<string, Attendance>();
  attendances.forEach((a) => {
    attMap.set(`${a.employee_id}_${a.attendance_date}`, a);
  });

  const filteredEmployees = employees.filter((e) => {
    const matchesSite = selectedSiteId === 'ALL' || e.site_id === selectedSiteId;
    const matchesSearch =
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSite && matchesSearch && e.status === 'active';
  });

  const getStatusPill = (status?: AttendanceStatus, isSun?: boolean) => {
    if (!status) {
      if (isSun) {
        return <span className="inline-block h-6 w-6 rounded bg-slate-100 text-slate-400 text-[10px] leading-6 font-bold text-center">OFF</span>;
      }
      return <span className="inline-block h-6 w-6 rounded bg-slate-100 text-slate-400 text-[10px] leading-6 font-bold text-center">-</span>;
    }

    switch (status) {
      case 'Present':
        return <span className="inline-block h-6 w-6 rounded bg-emerald-100 text-emerald-800 text-[11px] leading-6 font-black text-center shadow-xs">P</span>;
      case 'Absent':
        return <span className="inline-block h-6 w-6 rounded bg-rose-100 text-rose-800 text-[11px] leading-6 font-black text-center shadow-xs">A</span>;
      case 'Sunday Duty':
        return <span className="inline-block h-6 w-6 rounded bg-amber-400 text-slate-950 text-[11px] leading-6 font-black text-center shadow-xs">S</span>;
      case 'Half Day':
        return <span className="inline-block h-6 w-6 rounded bg-orange-200 text-orange-900 text-[11px] leading-6 font-black text-center shadow-xs">H</span>;
      case 'Leave':
        return <span className="inline-block h-6 w-6 rounded bg-indigo-100 text-indigo-800 text-[11px] leading-6 font-black text-center shadow-xs">L</span>;
      default:
        return <span className="inline-block h-6 w-6 rounded bg-slate-100 text-slate-600 text-[11px] leading-6 font-medium text-center">?</span>;
    }
  };

  const handleExport = () => {
    const relevantAttendances = selectedSiteId === 'ALL'
      ? attendances
      : attendances.filter((a) => a.site_id === selectedSiteId);
    exportAttendanceToCSV(relevantAttendances, `SVEM_Attendance_${selectedMonth}_${selectedYear}.csv`);
  };

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <History className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900">
                MONTHLY ATTENDANCE MASTER MATRIX
              </h2>
              <p className="text-xs text-slate-500">
                Full calendar view of worker presence, Sunday duties & absence tracking
              </p>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-amber-400" />
            Export Monthly CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>{mName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Site Filter</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Assigned Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.site_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Search</label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search operator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs pt-1 overflow-x-auto text-slate-600">
          <span className="font-semibold text-slate-700">Legend:</span>
          <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">P</span> Present</span>
          <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center justify-center">A</span> Absent</span>
          <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">S</span> Sunday Duty</span>
          <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-orange-200 text-orange-900 text-[10px] font-bold flex items-center justify-center">H</span> Half Day</span>
          <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center justify-center">L</span> Leave</span>
        </div>
      </div>

      {/* Grid Matrix Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] uppercase">
                <th className="p-3 sticky left-0 z-20 bg-slate-900 min-w-[180px] shadow-sm">Worker & Role</th>
                <th className="p-2 text-center text-slate-400 min-w-[70px]">Site</th>
                {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => {
                  const date = new Date(selectedYear, selectedMonth - 1, day);
                  const isSun = date.getDay() === 0;
                  return (
                    <th
                      key={day}
                      className={`p-1.5 text-center min-w-[32px] border-l border-slate-800 ${
                        isSun ? 'bg-amber-500/20 text-amber-300 font-black' : 'text-slate-300'
                      }`}
                    >
                      <span className="block">{day}</span>
                      <span className="text-[9px] font-normal text-slate-400">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredEmployees.map((emp) => {
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 sticky left-0 z-10 bg-white shadow-xs font-semibold text-slate-900 border-r border-slate-200">
                      <div>{emp.full_name}</div>
                      <div className="text-[10px] text-amber-700 font-mono font-normal">
                        {emp.employee_code} • {emp.designation}
                      </div>
                    </td>
                    <td className="p-2 text-center text-[10px] text-slate-500 font-mono border-r border-slate-200">
                      {sites.find((s) => s.id === emp.site_id)?.site_code || '-'}
                    </td>
                    {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => {
                      const date = new Date(selectedYear, selectedMonth - 1, day);
                      const isSun = date.getDay() === 0;
                      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const att = attMap.get(`${emp.id}_${dateStr}`);

                      return (
                        <td
                          key={day}
                          onClick={() => setSelectedCellInfo({ worker: emp, dateStr, dayNum: day, attendance: att })}
                          className={`p-1 text-center border-l border-slate-100 cursor-pointer hover:bg-amber-50 transition-colors ${
                            isSun ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          {getStatusPill(att?.status, isSun)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Cell Inspection Card */}
      {selectedCellInfo && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{selectedCellInfo.worker.full_name}</span>
              <span className="text-xs text-slate-500 font-mono font-semibold">({selectedCellInfo.worker.employee_code})</span>
              <span className="text-xs text-amber-800 font-semibold">• {selectedCellInfo.dateStr}</span>
            </div>
            <p className="text-xs text-slate-700 mt-1">
              Status:{' '}
              <strong className="text-slate-900">{selectedCellInfo.attendance?.status || 'No record / Weekly Off'}</strong>
              {selectedCellInfo.attendance?.shift && ` • Shift: ${selectedCellInfo.attendance.shift}`}
              {selectedCellInfo.attendance?.marked_by_name && ` • Marked By: ${selectedCellInfo.attendance.marked_by_name}`}
              {selectedCellInfo.attendance?.remarks && ` • Remarks: "${selectedCellInfo.attendance.remarks}"`}
            </p>
          </div>
          <button
            onClick={() => setSelectedCellInfo(null)}
            className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline self-end sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
