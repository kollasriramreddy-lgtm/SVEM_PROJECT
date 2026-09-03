import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PayrollRecord, PayrollPeriod, CompanySettings, Attendance } from '../../types';
import { formatINR } from '../payroll/payrollEngine';

/**
 * Export Monthly Payroll to Excel (.xlsx)
 */
export function exportPayrollToExcel(
  records: PayrollRecord[],
  period: PayrollPeriod,
  company: CompanySettings
): void {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const periodLabel = `${monthNames[period.month - 1]} ${period.year}`;

  const data = records.map((r, index) => ({
    'S.No': index + 1,
    'Employee Code': r.employee_code || '-',
    'Full Name': r.employee_name || '-',
    'Designation': r.designation || '-',
    'Site': r.site_name || '-',
    'Monthly Salary (₹)': r.monthly_salary,
    'Daily Rate (₹)': r.daily_rate,
    'Calendar Days': r.days_in_month,
    'Base Pay (₹)': r.base_pay,
    'Worked Sundays': r.calculation_metadata?.sundaysWorkedCount || 0,
    'OT Sundays': r.calculation_metadata?.overtimeSundaysCount || 0,
    'Sunday OT Pay (₹)': r.sunday_overtime_pay,
    'Gross Pay (₹)': r.gross_pay,
    'Absence Deductions (₹)': r.absence_deductions,
    'Sandwich Deductions (₹)': r.sandwich_deductions,
    'Manual Adjustments (₹)': r.adjustments,
    'Final Net Pay (₹)': r.net_pay,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Payroll_${period.month}_${period.year}`);

  XLSX.writeFile(
    workbook,
    `${company.company_name.replace(/\s+/g, '_')}_Payroll_${periodLabel.replace(/\s+/g, '_')}.xlsx`
  );
}

/**
 * Export Attendance Logs to CSV
 */
export function exportAttendanceToCSV(
  attendances: Attendance[],
  fileName: string = 'SVEM_Attendance_Register.csv'
): void {
  const headers = [
    'Date',
    'Employee Code',
    'Employee Name',
    'Designation',
    'Site Name',
    'Status',
    'Shift',
    'Marked By',
    'Marked At',
    'Remarks',
  ];

  const rows = attendances.map((a) => [
    a.attendance_date,
    `"${a.employee_code || ''}"`,
    `"${a.employee_name || ''}"`,
    `"${a.designation || ''}"`,
    `"${a.site_name || ''}"`,
    a.status,
    a.shift || 'Day',
    `"${a.marked_by_name || ''}"`,
    a.marked_at,
    `"${(a.remarks || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate Professional PDF Payslip for an Employee
 */
export function generateEmployeePayslipPDF(
  record: PayrollRecord,
  period: PayrollPeriod,
  company: CompanySettings
): void {
  const doc = new jsPDF();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const periodTitle = `${monthNames[period.month - 1]} ${period.year}`;

  // Company Header
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(245, 158, 11); // Earth Amber
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(company.company_name.toUpperCase(), 14, 15);

  doc.setTextColor(203, 213, 225); // Slate-300
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(company.tagline, 14, 22);
  doc.text(`${company.address} | Phone: ${company.phone} | GSTIN: ${company.gstin}`, 14, 28);

  // Payslip Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`SALARY PAYSLIP — ${periodTitle.toUpperCase()}`, 14, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 14, 54);

  // Employee Information Box
  autoTable(doc, {
    startY: 58,
    head: [['EMPLOYEE DETAILS', 'OPERATIONAL DETAILS']],
    body: [
      [`Employee Name: ${record.employee_name || '-'}`, `Site: ${record.site_name || 'Field Operations'}`],
      [`Employee Code: ${record.employee_code || '-'}`, `Days in Month: ${record.days_in_month}`],
      [`Designation: ${record.designation || '-'}`, `Daily Wage Rate: ${formatINR(record.daily_rate)}`],
      [`Worker Type: ${record.worker_type || '-'}`, `Period Status: ${period.status}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // Earnings vs Deductions Table
  // @ts-ignore
  const lastTableY = doc.lastAutoTable.finalY + 8;

  const earningsRows: string[][] = [
    ['Base Salary', formatINR(record.base_pay)],
    [`Sunday Overtime (${record.calculation_metadata?.overtimeSundaysCount || 0} extra Sun @ 2x rate)`, formatINR(record.sunday_overtime_pay)],
  ];

  const deductionRows: string[][] = [
    [`Absence & Leave Deductions (${record.calculation_metadata?.absentDaysCount || 0} days / penalties)`, formatINR(record.absence_deductions)],
    [`Sandwich Deductions (Rule D cuts)`, formatINR(record.sandwich_deductions)],
  ];

  if (record.adjustments !== 0) {
    if (record.adjustments > 0) {
      earningsRows.push(['Manual Adjustments / Bonuses', formatINR(record.adjustments)]);
    } else {
      deductionRows.push(['Manual Adjustments / Advances', formatINR(Math.abs(record.adjustments))]);
    }
  }

  autoTable(doc, {
    startY: lastTableY,
    head: [['EARNINGS', 'AMOUNT (INR)', 'DEDUCTIONS', 'AMOUNT (INR)']],
    body: [
      [earningsRows[0]?.[0] || '', earningsRows[0]?.[1] || '', deductionRows[0]?.[0] || '', deductionRows[0]?.[1] || ''],
      [earningsRows[1]?.[0] || '', earningsRows[1]?.[1] || '', deductionRows[1]?.[0] || '', deductionRows[1]?.[1] || ''],
      [earningsRows[2]?.[0] || '', earningsRows[2]?.[1] || '', deductionRows[2]?.[0] || '', deductionRows[2]?.[1] || ''],
      ['TOTAL GROSS EARNINGS', formatINR(record.gross_pay), 'TOTAL DEDUCTIONS', formatINR(record.absence_deductions + record.sandwich_deductions + (record.adjustments < 0 ? Math.abs(record.adjustments) : 0))],
    ],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3 },
  });

  // NET PAY HIGHLIGHT BOX
  // @ts-ignore
  const netY = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, netY, 182, 20, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NET SALARY PAYABLE:', 20, netY + 12);

  doc.setTextColor(16, 185, 129); // Emerald-600
  doc.setFontSize(14);
  doc.text(formatINR(record.net_pay), 140, netY + 13);

  // Calculation Steps Breakdown Section
  // @ts-ignore
  const stepsY = netY + 28;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYROLL CALCULATION AUDIT BREAKDOWN:', 14, stepsY);

  const stepsRows = (record.calculation_metadata?.explanationSteps || []).map((s) => [
    s.step,
    s.formula,
    s.values,
    s.result,
  ]);

  autoTable(doc, {
    startY: stepsY + 4,
    head: [['Step', 'Formula', 'Computed Values', 'Result']],
    body: stepsRows,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  // Signatures
  // @ts-ignore
  const sigY = doc.lastAutoTable.finalY + 16;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8.5);
  doc.text('Site Supervisor Signature', 25, sigY);
  doc.text('Authorized Signatory (SVEM)', 130, sigY);
  doc.line(20, sigY - 4, 75, sigY - 4);
  doc.line(125, sigY - 4, 185, sigY - 4);

  // Save
  doc.save(`${record.employee_code || 'Worker'}_Payslip_${periodTitle.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generate Master Monthly Payroll Register PDF
 */
export function generateMonthlyPayrollPDF(
  records: PayrollRecord[],
  period: PayrollPeriod,
  company: CompanySettings
): void {
  const doc = new jsPDF('landscape');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const periodTitle = `${monthNames[period.month - 1]} ${period.year}`;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 26, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(company.company_name.toUpperCase(), 14, 11);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`MONTHLY PAYROLL REGISTER — ${periodTitle.toUpperCase()} | Status: ${period.status}`, 14, 19);

  const tableData: (string | number)[][] = records.map((r, i) => [
    i + 1,
    r.employee_code || '-',
    r.employee_name || '-',
    r.designation || '-',
    r.site_name || 'Field',
    formatINR(r.monthly_salary),
    formatINR(r.daily_rate),
    `${r.calculation_metadata?.sundaysWorkedCount || 0} (${r.calculation_metadata?.overtimeSundaysCount || 0} OT)`,
    formatINR(r.sunday_overtime_pay),
    formatINR(r.absence_deductions),
    formatINR(r.sandwich_deductions),
    formatINR(r.adjustments),
    formatINR(r.net_pay),
  ]);

  autoTable(doc, {
    startY: 32,
    head: [[
      '#',
      'Code',
      'Worker Name',
      'Designation',
      'Site',
      'Salary',
      'Daily Rate',
      'Sundays',
      'Sunday OT',
      'Absence Cut',
      'Sandwich Cut',
      'Adj.',
      'Net Pay',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  doc.save(`${company.company_name.replace(/\s+/g, '_')}_Payroll_Register_${periodTitle.replace(/\s+/g, '_')}.pdf`);
}
