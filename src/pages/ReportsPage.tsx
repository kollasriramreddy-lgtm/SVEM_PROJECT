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
  HardHat,
  Fuel,
  CreditCard,
  Building2,
  Boxes,
  Printer,
  TrendingUp,
  DollarSign,
  HandCoins,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Profile,
  Site,
  Employee,
  Client,
  Vendor,
  DailyWorkEntry,
  Payment,
  Advance,
  Material,
  CompanySettings,
} from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<string>('daily_work');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  const [dailyWork, setDailyWork] = useState<DailyWorkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [workers, setWorkers] = useState<Employee[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllReportData();
  }, []);

  const loadAllReportData = async () => {
    setLoading(true);
    try {
      const [workList, pList, advList, cList, vList, matList, sList, wList, comp] = await Promise.all([
        db.getDailyWorkEntries(),
        db.getPayments(),
        db.getAdvances(),
        db.getClients(),
        db.getVendors(),
        db.getMaterials(),
        db.getSites(),
        db.getEmployees(),
        db.getCompanySettings(),
      ]);

      setDailyWork(workList);
      setPayments(pList);
      setAdvances(advList);
      setClients(cList);
      setVendors(vList);
      setMaterials(matList);
      setSites(sList);
      setWorkers(wList);
      setCompany(comp);
    } catch (e) {
      console.error('Error loading report datasets:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filtered datasets based on date range and site
  const filteredWork = dailyWork.filter((w) => {
    const matchesDate =
      (!startDate || w.work_date >= startDate) && (!endDate || w.work_date <= endDate);
    const matchesSite = !selectedSiteId || w.site_id === selectedSiteId;
    return matchesDate && matchesSite;
  });

  const filteredPayments = payments.filter((p) => {
    const matchesDate =
      (!startDate || p.payment_date >= startDate) && (!endDate || p.payment_date <= endDate);
    const matchesSite = !selectedSiteId || p.site_id === selectedSiteId;
    return matchesDate && matchesSite;
  });

  const handleExportExcel = () => {
    let exportData: any[] = [];
    let fileName = `SVEM_Report_${reportType}_${startDate}_${endDate}.xlsx`;

    if (reportType === 'daily_work') {
      exportData = filteredWork.map((w, idx) => ({
        '#': idx + 1,
        'Date': w.work_date,
        'Worker Name': w.worker_name,
        'Category': w.work_category,
        'Site': w.site_name,
        'Client': w.client_name || '-',
        'Quantity': `${w.quantity} ${w.measurement_unit}`,
        'Worker Rate (₹)': w.rate_per_unit,
        'Gross Amount (₹)': w.gross_amount,
        'Diesel Litres': w.diesel_litres,
        'Diesel Deduction (₹)': w.diesel_amount,
        'Cash Advance (₹)': w.cash_advance,
        'Net Payable (₹)': w.net_payable,
        'Client Bill (₹)': w.client_gross_amount || 0,
        'Estimated Margin (₹)': w.estimated_margin || 0,
      }));
    } else if (reportType === 'client_outstanding') {
      exportData = clients.map((c, idx) => ({
        '#': idx + 1,
        'Client Company': c.company_name,
        'Contact Person': c.client_name,
        'Phone': c.phone,
        'Opening Balance (₹)': c.opening_balance,
        'Total Work Billed (₹)': c.total_billed || 0,
        'Total Payments Received (₹)': c.total_paid || 0,
        'Current Outstanding Due (₹)': c.current_due || 0,
        'Status': c.status,
      }));
    } else if (reportType === 'vendor_payables') {
      exportData = vendors.map((v, idx) => ({
        '#': idx + 1,
        'Vendor Company': v.company_name,
        'Category': v.vendor_category,
        'Phone': v.phone,
        'Opening Balance (₹)': v.opening_balance,
        'Total Purchases (₹)': v.total_purchases || 0,
        'Total Payments Made (₹)': v.total_payments_made || 0,
        'Current Balance (₹)': v.current_balance || 0,
        'Balance Type': v.balance_type,
      }));
    } else if (reportType === 'diesel_consumption') {
      exportData = filteredWork
        .filter((w) => w.diesel_litres > 0)
        .map((w, idx) => ({
          '#': idx + 1,
          'Date': w.work_date,
          'Worker': w.worker_name,
          'Worksite': w.site_name,
          'Diesel Litres': w.diesel_litres,
          'Diesel Rate (₹)': w.diesel_rate,
          'Total Diesel Debit (₹)': w.diesel_amount,
          'Supplied By': w.diesel_supplied_by,
          'Source': w.diesel_source || 'Site Bowser',
        }));
    } else if (reportType === 'payments_history') {
      exportData = filteredPayments.map((p, idx) => ({
        '#': idx + 1,
        'Date': p.payment_date,
        'Transaction ID': p.transaction_id,
        'Account Type': p.account_type,
        'Account Name': p.account_name,
        'Direction': p.payment_direction,
        'Category': p.payment_category,
        'Payment Mode': p.payment_mode,
        'Reference No': p.reference_number || '-',
        'Amount (₹)': p.amount,
        'Status': p.status,
      }));
    } else if (reportType === 'advances') {
      exportData = advances.map((a, idx) => ({
        '#': idx + 1,
        'Date': a.advance_date,
        'Beneficiary': a.account_name,
        'Account Type': a.account_type,
        'Advance Type': a.advance_type,
        'Amount (₹)': a.amount,
        'Recovered (₹)': a.recovered_amount || 0,
        'Remaining (₹)': a.remaining_amount || 0,
        'Mode': a.payment_mode,
        'Reason': a.reason,
        'Status': a.status,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, fileName);
  };

  const handleExportPDF = () => {
    if (!company) return;
    const doc = new jsPDF('landscape');
    const pageWidth = 297;
    const margin = 14;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(company.company_name.toUpperCase(), margin, 11);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `EXECUTIVE FINANCIAL REPORT — ${reportType.replace(/_/g, ' ').toUpperCase()} | Period: ${startDate} to ${endDate}`,
      margin,
      19
    );

    let head: string[][] = [];
    let body: any[][] = [];

    if (reportType === 'daily_work') {
      head = [['#', 'Date', 'Worker', 'Category', 'Site', 'Quantity', 'Gross (₹)', 'Diesel (₹)', 'Net Pay (₹)', 'Client Bill (₹)']];
      body = filteredWork.map((w, i) => [
        i + 1,
        w.work_date,
        w.worker_name,
        w.work_category,
        w.site_name,
        `${w.quantity} ${w.measurement_unit}`,
        formatINR(w.gross_amount),
        formatINR(w.diesel_amount),
        formatINR(w.net_payable),
        formatINR(w.client_gross_amount || 0),
      ]);
    } else if (reportType === 'client_outstanding') {
      head = [['#', 'Company Name', 'Contact Person', 'Phone', 'Opening Bal', 'Total Billed', 'Total Received', 'Current Due']];
      body = clients.map((c, i) => [
        i + 1,
        c.company_name,
        c.client_name,
        c.phone,
        formatINR(c.opening_balance),
        formatINR(c.total_billed || 0),
        formatINR(c.total_paid || 0),
        formatINR(c.current_due || 0),
      ]);
    } else if (reportType === 'vendor_payables') {
      head = [['#', 'Vendor Name', 'Category', 'Phone', 'Opening Bal', 'Total Purchases', 'Total Paid', 'Current Balance']];
      body = vendors.map((v, i) => [
        i + 1,
        v.company_name,
        v.vendor_category,
        v.phone,
        formatINR(v.opening_balance),
        formatINR(v.total_purchases || 0),
        formatINR(v.total_payments_made || 0),
        formatINR(v.current_balance || 0),
      ]);
    } else {
      head = [['#', 'Date', 'Party Name', 'Category', 'Direction', 'Mode', 'Amount (₹)', 'Status']];
      body = filteredPayments.map((p, i) => [
        i + 1,
        p.payment_date,
        p.account_name,
        p.payment_category,
        p.payment_direction,
        p.payment_mode,
        formatINR(p.amount),
        p.status,
      ]);
    }

    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
    });

    doc.save(`SVEM_${reportType}_Report.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial & Operational Reports Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Export contractor daily work reports, client receivables, vendor payables, diesel logs & statements
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Printer className="h-4 w-4 text-amber-500" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export to Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'daily_work', label: 'Daily Work Register', icon: HardHat },
          { id: 'client_outstanding', label: 'Client Outstanding', icon: Building2 },
          { id: 'vendor_payables', label: 'Vendor Payables', icon: CreditCard },
          { id: 'diesel_consumption', label: 'Diesel Consumption', icon: Fuel },
          { id: 'payments_history', label: 'Payment Transactions', icon: FileSpreadsheet },
          { id: 'advances', label: 'Worker Advances', icon: HandCoins },
        ].map((rep) => {
          const Icon = rep.icon;
          const isSel = reportType === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setReportType(rep.id)}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                isSel
                  ? 'border-amber-500 bg-slate-900 text-white shadow-md ring-2 ring-amber-400/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className={`h-5 w-5 mb-2 ${isSel ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold">{rep.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Parameters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-amber-500" /> Filter Criteria:
          </span>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 font-medium text-slate-800"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 font-medium text-slate-800"
          />

          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value="">All Project Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.site_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-bold">
          <span className="text-slate-800 uppercase tracking-wider">
            Report Data Preview ({reportType.replace(/_/g, ' ')})
          </span>
          <span className="text-slate-500">Live Database Records</span>
        </div>

        <div className="overflow-x-auto max-h-[55vh]">
          {reportType === 'daily_work' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Worker</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Site</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Gross (₹)</th>
                  <th className="p-3">Diesel Cut (₹)</th>
                  <th className="p-3 bg-slate-950 text-amber-400">Net Worker Payable</th>
                  <th className="p-3 text-emerald-400">Client Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWork.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{w.work_date}</td>
                    <td className="p-3 font-bold text-slate-900">{w.worker_name}</td>
                    <td className="p-3">{w.work_category}</td>
                    <td className="p-3">{w.site_name}</td>
                    <td className="p-3 font-semibold">
                      {w.quantity} {w.measurement_unit}
                    </td>
                    <td className="p-3 font-bold">{formatINR(w.gross_amount)}</td>
                    <td className="p-3 text-rose-600">
                      {w.diesel_litres > 0 ? `-${formatINR(w.diesel_amount)}` : '-'}
                    </td>
                    <td className="p-3 font-black text-emerald-700 bg-slate-50">{formatINR(w.net_payable)}</td>
                    <td className="p-3 font-bold text-slate-900">{formatINR(w.client_gross_amount || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'client_outstanding' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase sticky top-0">
                <tr>
                  <th className="p-3">Client Company</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Opening Bal</th>
                  <th className="p-3 text-right">Total Billed</th>
                  <th className="p-3 text-right">Total Received</th>
                  <th className="p-3 text-right bg-slate-950 text-rose-400">Current Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{c.company_name}</td>
                    <td className="p-3">{c.client_name}</td>
                    <td className="p-3">{c.phone}</td>
                    <td className="p-3 text-right">{formatINR(c.opening_balance)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatINR(c.total_billed || 0)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{formatINR(c.total_paid || 0)}</td>
                    <td className="p-3 text-right font-black text-rose-600 bg-slate-50">
                      {formatINR(c.current_due || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'vendor_payables' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase sticky top-0">
                <tr>
                  <th className="p-3">Vendor / Supplier</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Opening Bal</th>
                  <th className="p-3 text-right">Total Purchases</th>
                  <th className="p-3 text-right">Payments Made</th>
                  <th className="p-3 text-right bg-slate-950 text-amber-400">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{v.company_name}</td>
                    <td className="p-3">{v.vendor_category}</td>
                    <td className="p-3">{v.phone}</td>
                    <td className="p-3 text-right">{formatINR(v.opening_balance)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatINR(v.total_purchases || 0)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {formatINR(v.total_payments_made || 0)}
                    </td>
                    <td className="p-3 text-right font-black text-amber-600 bg-slate-50">
                      {formatINR(v.current_balance || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'diesel_consumption' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Worker / Operator</th>
                  <th className="p-3">Worksite</th>
                  <th className="p-3">Diesel Litres</th>
                  <th className="p-3">Rate (₹/L)</th>
                  <th className="p-3 text-right">Total Cost</th>
                  <th className="p-3">Supplied By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWork
                  .filter((w) => w.diesel_litres > 0)
                  .map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold">{w.work_date}</td>
                      <td className="p-3 font-bold text-slate-900">{w.worker_name}</td>
                      <td className="p-3">{w.site_name}</td>
                      <td className="p-3 font-black text-slate-900">{w.diesel_litres} L</td>
                      <td className="p-3">₹{w.diesel_rate}</td>
                      <td className="p-3 text-right font-black text-rose-600">{formatINR(w.diesel_amount)}</td>
                      <td className="p-3">{w.diesel_supplied_by}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {reportType === 'payments_history' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Party Name</th>
                  <th className="p-3">Flow</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{p.payment_date}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{p.transaction_id}</td>
                    <td className="p-3 font-bold">{p.account_name}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.payment_direction === 'Inward'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.payment_direction}
                      </span>
                    </td>
                    <td className="p-3">{p.payment_mode}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatINR(p.amount)}</td>
                    <td className="p-3">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'advances' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Beneficiary</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-right">Recovered</th>
                  <th className="p-3 text-right">Remaining</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advances.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{a.advance_date}</td>
                    <td className="p-3 font-bold text-slate-900">{a.account_name}</td>
                    <td className="p-3">{a.advance_type}</td>
                    <td className="p-3 text-slate-600">{a.reason}</td>
                    <td className="p-3 text-right font-bold">{formatINR(a.amount)}</td>
                    <td className="p-3 text-right text-emerald-600 font-bold">{formatINR(a.recovered_amount || 0)}</td>
                    <td className="p-3 text-right font-black text-rose-600">{formatINR(a.remaining_amount || 0)}</td>
                    <td className="p-3">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
