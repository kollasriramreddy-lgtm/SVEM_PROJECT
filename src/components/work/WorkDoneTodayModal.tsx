import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  HardHat,
  Fuel,
  Check,
  Calculator,
  Calendar,
  Building2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  Employee,
  Site,
  Client,
  Machine,
  WorkCategory,
  WorkMeasurementUnit,
  DieselSupplierType,
  DailyWorkEntry,
} from '../../types';
import { db } from '../../services/db/database';
import { formatINR } from '../../services/payroll/payrollEngine';

interface BatchWorkRow {
  worker_id: string;
  site_id: string;
  client_id: string;
  machine_id: string;
  work_category: WorkCategory;
  quantity: number;
  measurement_unit: WorkMeasurementUnit;
  rate_per_unit: number;
  client_rate_per_unit: number;
  diesel_litres: number;
  diesel_rate: number;
  diesel_supplied_by: DieselSupplierType;
  cash_advance: number;
  other_deductions: number;
  notes: string;
}

interface WorkDoneTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (entries: DailyWorkEntry[]) => void;
}

export const WorkDoneTodayModal: React.FC<WorkDoneTodayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [defaultSiteId, setDefaultSiteId] = useState<string>('');
  const [defaultClientId, setDefaultClientId] = useState<string>('');

  const [workers, setWorkers] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  const [rows, setRows] = useState<BatchWorkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      setWorkDate(new Date().toISOString().split('T')[0]);
      setError(null);
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    try {
      const [wList, sList, cList, mList] = await Promise.all([
        db.getEmployees(),
        db.getSites(),
        db.getClients(),
        db.getMachines(),
      ]);
      setWorkers(wList);
      setSites(sList);
      setClients(cList);
      setMachines(mList);

      const firstSite = sList[0]?.id || '';
      const firstClient = cList[0]?.id || '';
      setDefaultSiteId(firstSite);
      setDefaultClientId(firstClient);

      // Initialize with 2 default rows
      if (wList.length > 0) {
        setRows([
          {
            worker_id: wList[0].id,
            site_id: firstSite,
            client_id: firstClient,
            machine_id: mList[0]?.id || '',
            work_category: 'Drilling',
            quantity: 200,
            measurement_unit: 'Feet',
            rate_per_unit: 35,
            client_rate_per_unit: 50,
            diesel_litres: 10,
            diesel_rate: 104,
            diesel_supplied_by: 'Company',
            cash_advance: 1000,
            other_deductions: 0,
            notes: 'Hole drilling in hard granite bench',
          },
        ]);
      }
    } catch (e) {
      console.error('Error loading Work Done Today data:', e);
    }
  };

  const handleAddRow = () => {
    if (workers.length === 0) return;
    const availableWorker = workers.find((w) => !rows.some((r) => r.worker_id === w.id)) || workers[0];
    setRows([
      ...rows,
      {
        worker_id: availableWorker.id,
        site_id: defaultSiteId,
        client_id: defaultClientId,
        machine_id: machines[0]?.id || '',
        work_category: 'Drilling',
        quantity: 150,
        measurement_unit: 'Feet',
        rate_per_unit: 35,
        client_rate_per_unit: 50,
        diesel_litres: 8,
        diesel_rate: 104,
        diesel_supplied_by: 'Company',
        cash_advance: 0,
        other_deductions: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, field: keyof BatchWorkRow, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  // Calculations for individual row
  const calculateRowValues = (row: BatchWorkRow) => {
    const grossAmount = row.quantity * row.rate_per_unit;
    const dieselAmount = row.diesel_litres * row.diesel_rate;
    const companyDieselDeduction = row.diesel_supplied_by === 'Company' ? dieselAmount : 0;
    const totalDeductions = companyDieselDeduction + row.cash_advance + row.other_deductions;
    const netPayable = grossAmount - totalDeductions;
    const clientBillingValue = row.quantity * (row.client_rate_per_unit || 0);
    const estimatedMargin = clientBillingValue - grossAmount - companyDieselDeduction;

    return {
      grossAmount,
      dieselAmount,
      totalDeductions,
      netPayable,
      clientBillingValue,
      estimatedMargin,
    };
  };

  // Totals across all rows
  const summaryTotals = rows.reduce(
    (acc, row) => {
      const calc = calculateRowValues(row);
      acc.totalWorkers += 1;
      acc.totalQuantity += Number(row.quantity) || 0;
      acc.totalGross += calc.grossAmount;
      acc.totalDieselLitres += Number(row.diesel_litres) || 0;
      acc.totalDieselAmount += calc.dieselAmount;
      acc.totalCashAdvances += Number(row.cash_advance) || 0;
      acc.totalDeductions += calc.totalDeductions;
      acc.totalNetPayable += calc.netPayable;
      acc.totalClientBilling += calc.clientBillingValue;
      acc.totalEstimatedMargin += calc.estimatedMargin;
      return acc;
    },
    {
      totalWorkers: 0,
      totalQuantity: 0,
      totalGross: 0,
      totalDieselLitres: 0,
      totalDieselAmount: 0,
      totalCashAdvances: 0,
      totalDeductions: 0,
      totalNetPayable: 0,
      totalClientBilling: 0,
      totalEstimatedMargin: 0,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) {
      setError('Please add at least one worker entry.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const entriesToCreate = rows.map((row) => ({
        work_date: workDate,
        worker_id: row.worker_id,
        site_id: row.site_id || defaultSiteId,
        client_id: row.client_id || defaultClientId || undefined,
        machine_id: row.machine_id || undefined,
        work_category: row.work_category,
        quantity: Number(row.quantity),
        measurement_unit: row.measurement_unit,
        rate_per_unit: Number(row.rate_per_unit),
        client_rate_per_unit: Number(row.client_rate_per_unit),
        diesel_litres: Number(row.diesel_litres),
        diesel_rate: Number(row.diesel_rate),
        diesel_supplied_by: row.diesel_supplied_by,
        cash_advance: Number(row.cash_advance),
        other_deductions: Number(row.other_deductions),
        gross_amount: 0, // auto computed by db service
        diesel_amount: 0,
        net_payable: 0,
        notes: row.notes,
        settlement_status: 'unsettled' as const,
      }));

      const created = await db.createBatchDailyWorkEntries(entriesToCreate);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save daily work entries.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-2xl bg-white shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500 p-2 text-slate-950 font-black">
              <HardHat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Work Done Today</h2>
                <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  Fast Batch Entry
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Log multi-operator daily feet drilling, machine hours, diesel debit & client billing simultaneously
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Date & Site Settings Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Work Execution Date</label>
              <input
                type="date"
                required
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Worksite</label>
              <select
                value={defaultSiteId}
                onChange={(e) => {
                  setDefaultSiteId(e.target.value);
                  setRows(rows.map((r) => ({ ...r, site_id: e.target.value })));
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-900 focus:outline-none focus:border-amber-500"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Client</label>
              <select
                value={defaultClientId}
                onChange={(e) => {
                  setDefaultClientId(e.target.value);
                  setRows(rows.map((r) => ({ ...r, client_id: e.target.value })));
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-900 focus:outline-none focus:border-amber-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.client_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[50vh]">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-800 text-[11px] font-bold text-slate-200">
                <tr>
                  <th className="p-2.5">Worker / Operator</th>
                  <th className="p-2.5">Work Type & Machine</th>
                  <th className="p-2.5">Quantity / Units</th>
                  <th className="p-2.5">Worker Rate (₹)</th>
                  <th className="p-2.5">Client Rate (₹)</th>
                  <th className="p-2.5">Diesel Litres & Rate</th>
                  <th className="p-2.5">Cash Adv (₹)</th>
                  <th className="p-2.5 bg-slate-900 text-amber-400">Net Worker Payable</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rows.map((row, idx) => {
                  const calc = calculateRowValues(row);
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      {/* Worker Selector */}
                      <td className="p-2 min-w-[160px]">
                        <select
                          value={row.worker_id}
                          onChange={(e) => handleRowChange(idx, 'worker_id', e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white p-1 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                        >
                          {workers.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.full_name} ({w.worker_type})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Notes / Bench ID"
                          value={row.notes}
                          onChange={(e) => handleRowChange(idx, 'notes', e.target.value)}
                          className="mt-1 w-full rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600"
                        />
                      </td>

                      {/* Work Type & Machine */}
                      <td className="p-2 min-w-[140px]">
                        <select
                          value={row.work_category}
                          onChange={(e) => handleRowChange(idx, 'work_category', e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white p-1 text-xs font-medium"
                        >
                          <option value="Drilling">Drilling</option>
                          <option value="Compressor work">Compressor work</option>
                          <option value="Rock cutting">Rock cutting</option>
                          <option value="Excavation">Excavation</option>
                          <option value="Blasting">Blasting</option>
                          <option value="Demolition">Demolition</option>
                          <option value="Loading">Loading & Tipper</option>
                          <option value="Other">Other</option>
                        </select>
                        <select
                          value={row.machine_id}
                          onChange={(e) => handleRowChange(idx, 'machine_id', e.target.value)}
                          className="mt-1 w-full rounded border border-slate-200 bg-slate-50 p-1 text-[10px] text-slate-700"
                        >
                          <option value="">No Machine Assigned</option>
                          {machines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.machine_name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Quantity & Unit */}
                      <td className="p-2 min-w-[120px]">
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.quantity}
                            onChange={(e) => handleRowChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 rounded border border-slate-300 p-1 text-xs font-bold text-slate-900"
                          />
                          <select
                            value={row.measurement_unit}
                            onChange={(e) => handleRowChange(idx, 'measurement_unit', e.target.value)}
                            className="w-20 rounded border border-slate-300 bg-slate-50 p-1 text-[11px]"
                          >
                            <option value="Feet">Feet</option>
                            <option value="Hour">Hour</option>
                            <option value="Meter">Meter</option>
                            <option value="Trip">Trip</option>
                            <option value="Day">Day</option>
                            <option value="Square Feet">Sq.ft</option>
                            <option value="Cubic Feet">Cu.ft</option>
                          </select>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Gross: {formatINR(calc.grossAmount)}
                        </span>
                      </td>

                      {/* Worker Rate */}
                      <td className="p-2 min-w-[90px]">
                        <input
                          type="number"
                          step="any"
                          value={row.rate_per_unit}
                          onChange={(e) => handleRowChange(idx, 'rate_per_unit', parseFloat(e.target.value) || 0)}
                          className="w-20 rounded border border-slate-300 p-1 text-xs font-bold text-slate-900"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">₹/unit</span>
                      </td>

                      {/* Client Rate */}
                      <td className="p-2 min-w-[90px]">
                        <input
                          type="number"
                          step="any"
                          value={row.client_rate_per_unit}
                          onChange={(e) =>
                            handleRowChange(idx, 'client_rate_per_unit', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 rounded border border-slate-300 p-1 text-xs font-bold text-emerald-800"
                        />
                        <span className="text-[10px] text-emerald-600 block mt-0.5">
                          Bill: {formatINR(calc.clientBillingValue)}
                        </span>
                      </td>

                      {/* Diesel Litres & Rate */}
                      <td className="p-2 min-w-[130px]">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Litres"
                            value={row.diesel_litres}
                            onChange={(e) =>
                              handleRowChange(idx, 'diesel_litres', parseFloat(e.target.value) || 0)
                            }
                            className="w-14 rounded border border-slate-300 p-1 text-xs font-semibold"
                          />
                          <span className="text-[10px] text-slate-400">L @ ₹</span>
                          <input
                            type="number"
                            step="any"
                            value={row.diesel_rate}
                            onChange={(e) =>
                              handleRowChange(idx, 'diesel_rate', parseFloat(e.target.value) || 0)
                            }
                            className="w-12 rounded border border-slate-300 p-1 text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-0.5">
                          <span className="text-rose-600 font-medium">Cut: {formatINR(calc.dieselAmount)}</span>
                          <select
                            value={row.diesel_supplied_by}
                            onChange={(e) => handleRowChange(idx, 'diesel_supplied_by', e.target.value)}
                            className="rounded border border-slate-200 text-[9px] p-0.5 bg-slate-50"
                          >
                            <option value="Company">By Co. (Deduct)</option>
                            <option value="Worker">By Worker</option>
                            <option value="Client">By Client</option>
                          </select>
                        </div>
                      </td>

                      {/* Cash Advance */}
                      <td className="p-2 min-w-[90px]">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="₹ Adv"
                          value={row.cash_advance}
                          onChange={(e) => handleRowChange(idx, 'cash_advance', parseFloat(e.target.value) || 0)}
                          className="w-20 rounded border border-slate-300 p-1 text-xs font-bold text-rose-700"
                        />
                      </td>

                      {/* Net Payable Highlight */}
                      <td className="p-2 min-w-[110px] bg-slate-50 font-black text-xs text-slate-900">
                        <span className="text-emerald-700">{formatINR(calc.netPayable)}</span>
                        <span className="text-[9px] block font-normal text-slate-400">
                          Margin: {formatINR(calc.estimatedMargin)}
                        </span>
                      </td>

                      {/* Delete Row Action */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={rows.length === 1}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Row Trigger */}
          <div>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-amber-500 bg-amber-50/50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <Plus className="h-4 w-4 text-amber-600" />
              <span>Add Another Worker Row</span>
            </button>
          </div>

          {/* Daily Aggregate Summary Dashboard Strip */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-white shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <Calculator className="h-4 w-4" />
                DAILY BATCH AGGREGATE SUMMARY
              </span>
              <span>{summaryTotals.totalWorkers} Operators Active</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 text-center">
              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Total Feet / Qty</span>
                <span className="text-sm font-black text-white">{summaryTotals.totalQuantity.toLocaleString()}</span>
              </div>

              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Gross Work Value</span>
                <span className="text-sm font-black text-amber-400">{formatINR(summaryTotals.totalGross)}</span>
              </div>

              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Diesel Litres</span>
                <span className="text-sm font-bold text-rose-300">
                  {summaryTotals.totalDieselLitres}L ({formatINR(summaryTotals.totalDieselAmount)})
                </span>
              </div>

              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Cash Advances</span>
                <span className="text-sm font-bold text-rose-400">{formatINR(summaryTotals.totalCashAdvances)}</span>
              </div>

              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Total Deductions</span>
                <span className="text-sm font-bold text-rose-500">{formatINR(summaryTotals.totalDeductions)}</span>
              </div>

              <div className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-700/60">
                <span className="text-[10px] text-emerald-300 block uppercase font-bold">Net Worker Payable</span>
                <span className="text-sm font-black text-emerald-400">{formatINR(summaryTotals.totalNetPayable)}</span>
              </div>

              <div className="bg-sky-950/60 p-2 rounded-lg border border-sky-700/60">
                <span className="text-[10px] text-sky-300 block uppercase font-bold">Client Billing Value</span>
                <span className="text-sm font-black text-sky-400">{formatINR(summaryTotals.totalClientBilling)}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
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
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{loading ? 'Posting Work Entries...' : 'Confirm & Save All Today Work'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
