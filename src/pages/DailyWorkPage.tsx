import React, { useState, useEffect } from 'react';
import {
  HardHat,
  Plus,
  Search,
  Filter,
  Fuel,
  HandCoins,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Calculator,
  Download,
  X,
} from 'lucide-react';
import {
  DailyWorkEntry,
  Profile,
  Employee,
  Site,
  Client,
  Machine,
  WorkCategory,
  WorkMeasurementUnit,
  DieselSupplierType,
} from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import { WorkDoneTodayModal } from '../components/work/WorkDoneTodayModal';

interface DailyWorkPageProps {
  currentUser: Profile;
  onSelectWorkerAccount?: (workerId: string) => void;
}

export const DailyWorkPage: React.FC<DailyWorkPageProps> = ({
  currentUser,
  onSelectWorkerAccount,
}) => {
  const [workEntries, setWorkEntries] = useState<DailyWorkEntry[]>([]);
  const [workers, setWorkers] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  // Filters
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterWorkerId, setFilterWorkerId] = useState<string>('');
  const [filterSiteId, setFilterSiteId] = useState<string>('');
  const [filterClientId, setFilterClientId] = useState<string>('');
  const [filterSettlement, setFilterSettlement] = useState<string>('all');

  const [isWorkTodayModalOpen, setIsWorkTodayModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Single Entry Form
  const [singleForm, setSingleForm] = useState({
    work_date: new Date().toISOString().split('T')[0],
    worker_id: '',
    site_id: '',
    client_id: '',
    machine_id: '',
    work_category: 'Drilling' as WorkCategory,
    quantity: '200',
    measurement_unit: 'Feet' as WorkMeasurementUnit,
    rate_per_unit: '35',
    client_rate_per_unit: '50',
    diesel_litres: '10',
    diesel_rate: '104',
    diesel_supplied_by: 'Company' as DieselSupplierType,
    diesel_source: 'Site Bowser #1',
    cash_advance: '1000',
    other_deductions: '0',
    notes: '',
  });

  useEffect(() => {
    loadWorkData();
  }, [filterDate, filterWorkerId, filterSiteId, filterClientId, filterSettlement]);

  const loadWorkData = async () => {
    setLoading(true);
    try {
      const [entries, wList, sList, cList, mList] = await Promise.all([
        db.getDailyWorkEntries({
          date: filterDate || undefined,
          workerId: filterWorkerId || undefined,
          siteId: filterSiteId || undefined,
          clientId: filterClientId || undefined,
          settlementStatus: filterSettlement !== 'all' ? filterSettlement : undefined,
        }),
        db.getEmployees(),
        db.getSites(),
        db.getClients(),
        db.getMachines(),
      ]);

      setWorkEntries(entries);
      setWorkers(wList);
      setSites(sList);
      setClients(cList);
      setMachines(mList);

      if (!singleForm.worker_id && wList.length > 0) {
        setSingleForm((prev) => ({
          ...prev,
          worker_id: wList[0].id,
          site_id: sList[0]?.id || '',
          client_id: cList[0]?.id || '',
          machine_id: mList[0]?.id || '',
        }));
      }
    } catch (e) {
      console.error('Error loading daily work register:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.worker_id || !singleForm.site_id) return;

    try {
      await db.createDailyWorkEntry({
        work_date: singleForm.work_date,
        worker_id: singleForm.worker_id,
        site_id: singleForm.site_id,
        client_id: singleForm.client_id || undefined,
        machine_id: singleForm.machine_id || undefined,
        work_category: singleForm.work_category,
        quantity: parseFloat(singleForm.quantity) || 0,
        measurement_unit: singleForm.measurement_unit,
        rate_per_unit: parseFloat(singleForm.rate_per_unit) || 0,
        client_rate_per_unit: parseFloat(singleForm.client_rate_per_unit) || 0,
        diesel_litres: parseFloat(singleForm.diesel_litres) || 0,
        diesel_rate: parseFloat(singleForm.diesel_rate) || 0,
        diesel_supplied_by: singleForm.diesel_supplied_by,
        diesel_source: singleForm.diesel_source,
        cash_advance: parseFloat(singleForm.cash_advance) || 0,
        other_deductions: parseFloat(singleForm.other_deductions) || 0,
        gross_amount: 0,
        diesel_amount: 0,
        net_payable: 0,
        notes: singleForm.notes,
        settlement_status: 'unsettled',
      });
      setIsSingleModalOpen(false);
      loadWorkData();
    } catch (err) {
      console.error('Error creating single work entry:', err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this daily work record?')) {
      await db.deleteDailyWorkEntry(id);
      loadWorkData();
    }
  };

  // Calculations for Single Entry Modal Live Preview
  const singleGross =
    (parseFloat(singleForm.quantity) || 0) * (parseFloat(singleForm.rate_per_unit) || 0);
  const singleDiesel =
    (parseFloat(singleForm.diesel_litres) || 0) * (parseFloat(singleForm.diesel_rate) || 0);
  const singleDieselDed = singleForm.diesel_supplied_by === 'Company' ? singleDiesel : 0;
  const singleNet =
    singleGross -
    singleDieselDed -
    (parseFloat(singleForm.cash_advance) || 0) -
    (parseFloat(singleForm.other_deductions) || 0);

  const totalQuantity = workEntries.reduce((sum, w) => sum + w.quantity, 0);
  const totalGrossAmount = workEntries.reduce((sum, w) => sum + w.gross_amount, 0);
  const totalNetPayable = workEntries.reduce((sum, w) => sum + w.net_payable, 0);
  const totalClientBilling = workEntries.reduce((sum, w) => sum + (w.client_gross_amount || 0), 0);
  const totalDieselLitres = workEntries.reduce((sum, w) => sum + w.diesel_litres, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daily Work Tracking Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log operator footage drilled, compressor hours, diesel consumption & client billing margins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => setIsWorkTodayModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md hover:bg-amber-400 transition-colors"
          >
            <HardHat className="h-4 w-4" />
            <span>Work Done Today</span>
          </button>

          <button
            onClick={() => setIsSingleModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-amber-500" />
            <span>+ Single Detailed Entry</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Measured Quantity
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">{totalQuantity.toLocaleString()} Units</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Gross Work Value
          </span>
          <p className="text-xl font-black text-amber-600 mt-1">{formatINR(totalGrossAmount)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Diesel Consumed
          </span>
          <p className="text-xl font-black text-rose-500 mt-1">{totalDieselLitres.toLocaleString()} Litres</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-emerald-950 p-3.5 shadow-sm text-center text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
            Net Worker Payable
          </span>
          <p className="text-xl font-black text-emerald-400 mt-1">{formatINR(totalNetPayable)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-3.5 shadow-sm text-center text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
            Client Billing Value
          </span>
          <p className="text-xl font-black text-sky-400 mt-1">{formatINR(totalClientBilling)}</p>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-amber-500" /> Filters:
          </span>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-slate-800 focus:outline-none"
          />

          <select
            value={filterWorkerId}
            onChange={(e) => setFilterWorkerId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 font-medium text-slate-800 focus:outline-none"
          >
            <option value="">All Workers ({workers.length})</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name}
              </option>
            ))}
          </select>

          <select
            value={filterSiteId}
            onChange={(e) => setFilterSiteId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 font-medium text-slate-800 focus:outline-none"
          >
            <option value="">All Worksites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.site_name}
              </option>
            ))}
          </select>

          <select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 font-medium text-slate-800 focus:outline-none"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold">Settlement:</span>
          <select
            value={filterSettlement}
            onChange={(e) => setFilterSettlement(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 font-semibold text-slate-700"
          >
            <option value="all">All Status</option>
            <option value="unsettled">Unsettled</option>
            <option value="settled">Settled</option>
          </select>
        </div>
      </div>

      {/* Main Work Entries Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Worker / Operator</th>
                <th className="p-3">Work Category</th>
                <th className="p-3">Worksite & Client</th>
                <th className="p-3">Quantity & Rate</th>
                <th className="p-3">Gross Value</th>
                <th className="p-3">Diesel & Adv. Cuts</th>
                <th className="p-3 bg-slate-950 text-amber-400">Net Worker Payable</th>
                <th className="p-3 text-emerald-400">Client Bill</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {workEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-xs text-slate-400">
                    No work entries match your filters. Click "Work Done Today" to log entries.
                  </td>
                </tr>
              ) : (
                workEntries.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{w.work_date}</td>
                    <td className="p-3">
                      <p
                        onClick={() => onSelectWorkerAccount && onSelectWorkerAccount(w.worker_id)}
                        className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer"
                      >
                        {w.worker_name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {w.worker_code} • {w.worker_type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {w.work_category}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-800 truncate max-w-xs">{w.site_name}</p>
                      <p className="text-[10px] text-slate-500">{w.client_name || 'Direct / Internal'}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-black text-slate-900">
                        {w.quantity} {w.measurement_unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block">@ ₹{w.rate_per_unit}/unit</span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{formatINR(w.gross_amount)}</td>
                    <td className="p-3 text-rose-600 text-[11px]">
                      <div>
                        {w.diesel_litres > 0 && (
                          <span>
                            Diesel ({w.diesel_litres}L): -{formatINR(w.diesel_amount)}
                          </span>
                        )}
                      </div>
                      {w.cash_advance > 0 && <div>Adv: -{formatINR(w.cash_advance)}</div>}
                    </td>
                    <td className="p-3 font-black text-sm text-slate-900 bg-slate-50">
                      <span className="text-emerald-700">{formatINR(w.net_payable)}</span>
                    </td>
                    <td className="p-3 text-emerald-800 font-bold">
                      {formatINR(w.client_gross_amount || 0)}
                      <span className="text-[9px] block font-normal text-slate-400">
                        Est Margin: {formatINR(w.estimated_margin || 0)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          w.settlement_status === 'settled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.settlement_status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteEntry(w.id)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Work Done Today Modal */}
      {isWorkTodayModalOpen && (
        <WorkDoneTodayModal
          isOpen={isWorkTodayModalOpen}
          onClose={() => setIsWorkTodayModalOpen(false)}
          onSuccess={() => loadWorkData()}
        />
      )}

      {/* Single Detailed Work Modal */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <HardHat className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold">Detailed Daily Work Record</h2>
              </div>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingle} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Date</label>
                  <input
                    type="date"
                    required
                    value={singleForm.work_date}
                    onChange={(e) => setSingleForm({ ...singleForm, work_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Worker / Operator</label>
                  <select
                    value={singleForm.worker_id}
                    onChange={(e) => setSingleForm({ ...singleForm, worker_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold focus:outline-none"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.full_name} ({w.worker_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Worksite</label>
                  <select
                    value={singleForm.site_id}
                    onChange={(e) => setSingleForm({ ...singleForm, site_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:outline-none"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.site_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client (Billed to)</label>
                  <select
                    value={singleForm.client_id}
                    onChange={(e) => setSingleForm({ ...singleForm, client_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:outline-none"
                  >
                    <option value="">None / Company Work</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Category</label>
                  <select
                    value={singleForm.work_category}
                    onChange={(e) =>
                      setSingleForm({ ...singleForm, work_category: e.target.value as any })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  >
                    <option value="Drilling">Drilling</option>
                    <option value="Compressor work">Compressor work</option>
                    <option value="Rock cutting">Rock cutting</option>
                    <option value="Excavation">Excavation</option>
                    <option value="Blasting">Blasting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={singleForm.quantity}
                    onChange={(e) => setSingleForm({ ...singleForm, quantity: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={singleForm.measurement_unit}
                    onChange={(e) =>
                      setSingleForm({ ...singleForm, measurement_unit: e.target.value as any })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  >
                    <option value="Feet">Feet</option>
                    <option value="Hour">Hour</option>
                    <option value="Meter">Meter</option>
                    <option value="Trip">Trip</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Worker Rate (₹/unit)</label>
                  <input
                    type="number"
                    step="any"
                    value={singleForm.rate_per_unit}
                    onChange={(e) => setSingleForm({ ...singleForm, rate_per_unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client Rate (₹/unit)</label>
                  <input
                    type="number"
                    step="any"
                    value={singleForm.client_rate_per_unit}
                    onChange={(e) =>
                      setSingleForm({ ...singleForm, client_rate_per_unit: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diesel Litres</label>
                  <input
                    type="number"
                    step="any"
                    value={singleForm.diesel_litres}
                    onChange={(e) => setSingleForm({ ...singleForm, diesel_litres: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diesel Rate (₹/L)</label>
                  <input
                    type="number"
                    step="any"
                    value={singleForm.diesel_rate}
                    onChange={(e) => setSingleForm({ ...singleForm, diesel_rate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diesel Supplier</label>
                  <select
                    value={singleForm.diesel_supplied_by}
                    onChange={(e) =>
                      setSingleForm({ ...singleForm, diesel_supplied_by: e.target.value as any })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  >
                    <option value="Company">Company (Deduct)</option>
                    <option value="Worker">Worker</option>
                    <option value="Client">Client</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cash Advance (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={singleForm.cash_advance}
                    onChange={(e) => setSingleForm({ ...singleForm, cash_advance: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-rose-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Other Deductions (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={singleForm.other_deductions}
                    onChange={(e) =>
                      setSingleForm({ ...singleForm, other_deductions: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              {/* Summary Live Calculation Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex justify-between">
                <div>
                  <span className="text-slate-500 block">Gross Work Value:</span>
                  <span className="font-bold text-slate-900">{formatINR(singleGross)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Diesel + Cash Cuts:</span>
                  <span className="font-bold text-rose-600">
                    - {formatINR(singleDieselDed + (parseFloat(singleForm.cash_advance) || 0))}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Net Worker Payable:</span>
                  <span className="font-black text-sm text-emerald-700">{formatINR(singleNet)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Save Daily Work Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
