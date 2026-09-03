import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Check,
  X,
  Search,
  Filter,
  Save,
  CheckCheck,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { Profile, Site, Employee, Attendance, AttendanceStatus } from '../types';
import { db } from '../services/db/database';

interface AttendancePageProps {
  currentUser: Profile;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [workers, setWorkers] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, { status: AttendanceStatus; shift: 'Day' | 'Night'; remarks?: string }>>(
    new Map()
  );
  const [initialAttendanceMap, setInitialAttendanceMap] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkerType, setSelectedWorkerType] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load sites for user
  useEffect(() => {
    async function loadSites() {
      setLoading(true);
      try {
        const [allSites, assignments] = await Promise.all([
          db.getSites(),
          db.getManagerSiteAssignments(),
        ]);

        const allowedSites = isSuperAdmin
          ? allSites
          : allSites.filter((s) =>
              assignments.some((a) => a.manager_id === currentUser.id && a.site_id === s.id)
            );

        setSites(allowedSites);
        if (allowedSites.length > 0) {
          setSelectedSiteId(allowedSites[0].id);
        }
      } catch (e) {
        console.error('Error loading sites:', e);
      } finally {
        setLoading(false);
      }
    }
    loadSites();
  }, [currentUser]);

  // Load workers and attendance for selected site & date
  useEffect(() => {
    if (!selectedSiteId) return;

    async function loadSiteAttendance() {
      try {
        const [allEmployees, siteAttendances] = await Promise.all([
          db.getEmployees(),
          db.getAttendanceForSiteAndDate(selectedSiteId, selectedDate),
        ]);

        // Filter active workers assigned to this site
        const siteWorkers = allEmployees.filter(
          (e) => e.site_id === selectedSiteId && e.status === 'active'
        );
        setWorkers(siteWorkers);

        const newMap = new Map<string, { status: AttendanceStatus; shift: 'Day' | 'Night'; remarks?: string }>();
        const initMap = new Map<string, string>();

        const isDateSunday = new Date(selectedDate).getDay() === 0;

        siteWorkers.forEach((w) => {
          const existing = siteAttendances.find((a) => a.employee_id === w.id);
          if (existing) {
            newMap.set(w.id, {
              status: existing.status,
              shift: existing.shift === 'Night' ? 'Night' : 'Day',
              remarks: existing.remarks,
            });
            initMap.set(w.id, existing.status);
          } else {
            // Default: If Sunday, default to Sunday Duty or Leave; if weekday, default to Present
            const defaultStatus: AttendanceStatus = isDateSunday ? 'Sunday Duty' : 'Present';
            newMap.set(w.id, { status: defaultStatus, shift: 'Day' });
          }
        });

        setAttendanceRecords(newMap);
        setInitialAttendanceMap(initMap);
        setSaveSuccess(false);
      } catch (e) {
        console.error('Error loading attendance for date:', e);
      }
    }

    loadSiteAttendance();
  }, [selectedSiteId, selectedDate]);

  const handleStatusChange = (workerId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => {
      const updated = new Map(prev);
      const cur = updated.get(workerId) || { status: 'Present', shift: 'Day' };
      updated.set(workerId, { ...cur, status });
      return updated;
    });
    setSaveSuccess(false);
  };

  const handleShiftChange = (workerId: string, shift: 'Day' | 'Night') => {
    setAttendanceRecords((prev) => {
      const updated = new Map(prev);
      const cur = updated.get(workerId) || { status: 'Present', shift: 'Day' };
      updated.set(workerId, { ...cur, shift });
      return updated;
    });
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setAttendanceRecords((prev) => {
      const updated = new Map(prev);
      workers.forEach((w) => {
        const cur = updated.get(w.id) || { status: 'Present', shift: 'Day' };
        updated.set(w.id, { ...cur, status });
      });
      return updated;
    });
    setSaveSuccess(false);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSiteId) return;

    try {
      setIsSaving(true);
      setError(null);

      const recordsToSave = Array.from(attendanceRecords.entries()).map(([empId, data]) => ({
        employee_id: empId,
        status: data.status,
        shift: data.shift,
        remarks: data.remarks,
      }));

      await db.saveBatchAttendance(selectedSiteId, selectedDate, recordsToSave);

      // Update initial map
      const newInitMap = new Map<string, string>();
      recordsToSave.forEach((r) => newInitMap.set(r.employee_id, r.status));
      setInitialAttendanceMap(newInitMap);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const isSunday = new Date(selectedDate).getDay() === 0;

  // Filter workers by search query and designation
  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedWorkerType === 'ALL' || w.worker_type === selectedWorkerType;
    return matchesSearch && matchesType;
  });

  // Calculate live counts
  let presentCount = 0;
  let absentCount = 0;
  let sundayDutyCount = 0;
  let halfDayCount = 0;
  let leaveCount = 0;

  attendanceRecords.forEach((val) => {
    if (val.status === 'Present') presentCount++;
    if (val.status === 'Absent') absentCount++;
    if (val.status === 'Sunday Duty') sundayDutyCount++;
    if (val.status === 'Half Day') halfDayCount++;
    if (val.status === 'Leave') leaveCount++;
  });

  // Check unsaved changes
  let unsavedCount = 0;
  attendanceRecords.forEach((val, id) => {
    if (initialAttendanceMap.get(id) !== val.status) {
      unsavedCount++;
    }
  });

  const workerTypes = [
    'ALL',
    'Excavator Operator',
    'JCB Operator',
    'Rock Driller',
    'Machine Operator',
    'Driver',
    'Laborer',
    'Helper',
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-xs font-semibold text-slate-500">Loading Site Attendance Register...</p>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-lg mx-auto mt-10">
        <MapPin className="h-10 w-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">No Assigned Sites Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          {isSuperAdmin
            ? 'Please create project sites in Sites Management.'
            : 'You are not assigned to any active excavation sites. Please contact Super Admin.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Top Header & Site/Date Selector Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                FIELD ATTENDANCE REGISTER
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Mobile-optimized daily muster roll for excavation, drilling & equipment operators
            </p>
          </div>

          {/* Quick Summary Badges */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 border border-emerald-200 whitespace-nowrap">
              {presentCount} Present
            </span>
            <span className="rounded-lg bg-rose-50 px-2.5 py-1 font-bold text-rose-700 border border-rose-200 whitespace-nowrap">
              {absentCount} Absent
            </span>
            {isSunday && (
              <span className="rounded-lg bg-amber-100 px-2.5 py-1 font-bold text-amber-900 border border-amber-300 whitespace-nowrap">
                {sundayDutyCount} Sunday Duty
              </span>
            )}
            {halfDayCount > 0 && (
              <span className="rounded-lg bg-orange-50 px-2.5 py-1 font-bold text-orange-700 border border-orange-200 whitespace-nowrap">
                {halfDayCount} Half Day
              </span>
            )}
          </div>
        </div>

        {/* Site & Date Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Excavation Site
            </label>
            <div className="relative">
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.site_name} ({site.site_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Attendance Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Sunday Warning Notice */}
        {isSunday && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/15 p-3 text-xs text-amber-900 border border-amber-400">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Sunday Rule:</strong> First 2 worked Sundays in a month are included in base monthly pay. Additional worked Sundays earn <strong>2.0× daily wage overtime</strong> automatically in payroll.
            </span>
          </div>
        )}

        {/* Fast Batch Actions & Search / Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Quick Mark All Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll(isSunday ? 'Sunday Duty' : 'Present')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 active:scale-95 transition-all"
            >
              <CheckCheck className="h-4 w-4" />
              {isSunday ? 'All Sunday Duty' : 'Mark All Present'}
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('Absent')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500 active:scale-95 transition-all"
            >
              <XCircle className="h-4 w-4" />
              Mark All Absent
            </button>
          </div>

          {/* Search & Worker Type Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search operator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <select
              value={selectedWorkerType}
              onChange={(e) => setSelectedWorkerType(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-amber-500"
            >
              {workerTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'ALL' ? 'All Roles' : type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications / Errors */}
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-300 flex items-center gap-2 shadow-sm animate-bounce">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Attendance Saved Successfully!</strong> All worker records for {selectedDate} persisted to database.
          </span>
        </div>
      )}

      {/* Worker Attendance Cards List (Mobile-Optimized Touch UI) */}
      <div className="space-y-3">
        {filteredWorkers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-xs font-semibold text-slate-500">
              No workers matched the selected filters at this site.
            </p>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const currentRec = attendanceRecords.get(worker.id) || { status: 'Present', shift: 'Day' };
            const status = currentRec.status;

            return (
              <div
                key={worker.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all space-y-3"
              >
                {/* Worker Identity & Shift */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {worker.employee_code}
                      </span>
                      <h3 className="text-sm font-black text-slate-900">{worker.full_name}</h3>
                    </div>
                    <p className="text-xs text-amber-700 font-semibold mt-0.5">
                      {worker.designation}
                    </p>
                  </div>

                  {/* Shift Selector */}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleShiftChange(worker.id, 'Day')}
                      className={`px-2 py-1 rounded font-bold transition-colors ${
                        currentRec.shift === 'Day'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Day
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftChange(worker.id, 'Night')}
                      className={`px-2 py-1 rounded font-bold transition-colors ${
                        currentRec.shift === 'Night'
                          ? 'bg-slate-900 text-amber-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Night
                    </button>
                  </div>
                </div>

                {/* Touch Toggle Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(worker.id, 'Present')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      status === 'Present'
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    Present
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(worker.id, 'Absent')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      status === 'Absent'
                        ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-600 scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    <X className="h-4 w-4" />
                    Absent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(worker.id, 'Sunday Duty')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      status === 'Sunday Duty'
                        ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-500 scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-current" />
                    Sunday Duty
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(worker.id, 'Half Day')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      status === 'Half Day'
                        ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-500 scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-orange-50 hover:text-orange-800'
                    }`}
                  >
                    Half Day
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(worker.id, 'Leave')}
                    className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      status === 'Leave'
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-800'
                    }`}
                  >
                    Leave / Off
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Action Bar (Field-Friendly Save) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/95 p-3 backdrop-blur-md shadow-2xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-2">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">{workers.length}</span> workers listed for{' '}
            <span className="font-semibold text-amber-400">{selectedDate}</span>
            {unsavedCount > 0 && (
              <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/40">
                {unsavedCount} Unsaved Change(s)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-xl hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Submitting to Database...' : 'Save Site Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
};
