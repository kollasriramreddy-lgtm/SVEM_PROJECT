import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Payment,
  Advance,
  Settlement,
  CompanySettings,
  Client,
  Vendor,
  LedgerEntry,
  DailyWorkEntry,
  PurchaseBill,
} from '../../types';
import { formatINR } from '../payroll/payrollEngine';

/**
 * Generate Printable & Downloadable Payment / Advance Voucher Receipt
 */
export function generatePaymentReceiptPDF(
  payment: Payment,
  company: CompanySettings,
  additionalDetails?: {
    previousBalance?: number;
    newBalance?: number;
    workerDetails?: string;
  }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 compact voucher format for field printing
  });

  const pageWidth = 148;
  const margin = 10;
  const isReceived = payment.payment_direction === 'Inward';

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Company Name
  doc.setTextColor(245, 158, 11); // Amber
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(company.company_name.toUpperCase(), margin, 10);

  // Tagline & Contact
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(company.tagline, margin, 15);
  doc.text(`${company.address} | Phone: ${company.phone}`, margin, 20);
  doc.text(`GSTIN: ${company.gstin}`, margin, 24);

  // Voucher Title Box
  const voucherTitle = isReceived
    ? 'OFFICIAL PAYMENT RECEIPT (INWARD)'
    : 'OFFICIAL DISBURSEMENT VOUCHER (OUTWARD)';
  doc.setFillColor(isReceived ? 16 : 225, isReceived ? 185 : 29, isReceived ? 129 : 72); // Green or Red/Slate
  doc.rect(0, 28, pageWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(voucherTitle, margin, 33.5);

  // Receipt Meta Grid
  autoTable(doc, {
    startY: 38,
    margin: { left: margin, right: margin },
    head: [['TRANSACTION DETAILS', 'PAYMENT INFO']],
    body: [
      [`Voucher No: ${payment.transaction_id}`, `Date: ${payment.payment_date}`],
      [`Account: ${payment.account_name} (${payment.account_type})`, `Mode: ${payment.payment_mode}`],
      [`Category: ${payment.payment_category}`, `Ref No: ${payment.reference_number || 'N/A'}`],
      [`Site / Project: ${payment.site_name || 'General Operations'}`, `Status: ${payment.status}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  // Description & Amount Highlight Box
  // @ts-ignore
  const descY = doc.lastAutoTable.finalY + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, descY, pageWidth - margin * 2, 24, 2, 2, 'F');
  doc.rect(margin, descY, pageWidth - margin * 2, 24);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION / PURPOSE:', margin + 4, descY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(payment.description || 'Financial transaction entry.', 120), margin + 4, descY + 11);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT TRANSFERRED:', margin + 4, descY + 20);

  doc.setTextColor(isReceived ? 16 : 225, isReceived ? 185 : 29, isReceived ? 129 : 72);
  doc.setFontSize(12);
  doc.text(formatINR(payment.amount), margin + 65, descY + 20);

  // Balance info if provided
  let curY = descY + 28;
  if (additionalDetails && (additionalDetails.previousBalance !== undefined || additionalDetails.newBalance !== undefined)) {
    autoTable(doc, {
      startY: curY,
      margin: { left: margin, right: margin },
      head: [['Previous Balance', 'Transaction Amount', 'New Updated Balance']],
      body: [
        [
          formatINR(additionalDetails.previousBalance || 0),
          formatINR(payment.amount),
          formatINR(additionalDetails.newBalance || 0),
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 2, halign: 'center' },
    });
    // @ts-ignore
    curY = doc.lastAutoTable.finalY + 6;
  }

  // Signatures Area
  const sigY = curY + 18;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);

  doc.line(margin + 5, sigY, margin + 45, sigY);
  doc.line(pageWidth - margin - 45, sigY, pageWidth - margin - 5, sigY);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Receiver / Payer Signature', margin + 7, sigY + 4);
  doc.text('Authorized Signatory (SVEM)', pageWidth - margin - 43, sigY + 4);

  // Save PDF
  doc.save(`${payment.transaction_id}_Receipt.pdf`);
}

/**
 * Generate Worker Settlement Voucher PDF
 */
export function generateSettlementReceiptPDF(
  settlement: Settlement,
  company: CompanySettings
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(company.company_name.toUpperCase(), margin, 13);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(company.tagline, margin, 19);
  doc.text(`${company.address} | Phone: ${company.phone} | GSTIN: ${company.gstin}`, margin, 25);

  // Title
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 32, pageWidth, 9, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`WORKER SETTLEMENT & COMPENSATION CLEARANCE — ${settlement.settlement_code}`, margin, 38);

  // Info Table
  autoTable(doc, {
    startY: 45,
    margin: { left: margin, right: margin },
    head: [['WORKER INFORMATION', 'SETTLEMENT PERIOD & SITE']],
    body: [
      [`Worker Name: ${settlement.worker_name || 'Worker'}`, `Site: ${settlement.site_name || 'Operational Field'}`],
      [`Worker Code: ${settlement.worker_code || '-'}`, `Period: ${settlement.from_date} to ${settlement.to_date}`],
      [`Settlement Type: ${settlement.settlement_type}`, `Date Generated: ${settlement.settlement_date}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  // Calculation Breakdown
  // @ts-ignore
  const calcY = doc.lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: calcY,
    margin: { left: margin, right: margin },
    head: [['ACCOUNT COMPONENT', 'CALCULATION BASIS', 'AMOUNT (INR)']],
    body: [
      ['Gross Daily Work Earnings', 'Total measured work in feet / hours', formatINR(settlement.total_work_value)],
      ['Diesel Advance Deductions', 'Company supplied diesel for rigs / machines', `- ${formatINR(settlement.total_diesel_advance)}`],
      ['Cash Advance Deductions', 'Cash advances issued on-site during period', `- ${formatINR(settlement.total_cash_advance)}`],
      ['Other Field Deductions', 'Tools damage, maintenance, penalties', `- ${formatINR(settlement.total_other_deductions)}`],
      ['Previous Balance (Brought Forward)', 'Unpaid dues or previous adjustments', formatINR(settlement.previous_balance)],
      ['Payments Already Released', 'Interim part payments made earlier', `- ${formatINR(settlement.payments_already_made)}`],
      ['NET FINAL SETTLEMENT AMOUNT', 'Authorized payable balance', formatINR(settlement.net_settlement_amount)],
      ['AMOUNT PAID NOW', `Disbursed via ${settlement.payment_mode || 'Cash'}`, formatINR(settlement.amount_paid_now)],
      ['BALANCE CARRIED FORWARD', 'Remaining balance to next period', formatINR(settlement.remaining_carry_forward)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 3 },
  });

  // Highlight Box
  // @ts-ignore
  const boxY = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, 20, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AMOUNT DISBURSED IN THIS SETTLEMENT:', margin + 6, boxY + 12);

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(14);
  doc.text(formatINR(settlement.amount_paid_now), pageWidth - margin - 60, boxY + 13);

  // Signatures
  // @ts-ignore
  const sigY = boxY + 36;
  doc.line(margin + 10, sigY, margin + 65, sigY);
  doc.line(pageWidth - margin - 65, sigY, pageWidth - margin - 10, sigY);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8.5);
  doc.text('Worker Signature / Thumb Impression', margin + 12, sigY + 5);
  doc.text('Authorized Signatory (SVEM)', pageWidth - margin - 60, sigY + 5);

  doc.save(`${settlement.settlement_code}_Statement.pdf`);
}

/**
 * Generate Full Account Statement PDF (Clients & Vendors)
 */
export function generateAccountStatementPDF(
  accountType: 'Client' | 'Vendor' | 'Worker',
  accountName: string,
  openingBalance: number,
  ledger: LedgerEntry[],
  company: CompanySettings,
  filters?: { startDate?: string; endDate?: string }
): void {
  const doc = new jsPDF('landscape');
  const pageWidth = 297;
  const margin = 14;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(company.company_name.toUpperCase(), margin, 12);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`STATEMENT OF ACCOUNT — ${accountType.toUpperCase()}: ${accountName.toUpperCase()}`, margin, 19);
  doc.text(
    `Date Period: ${filters?.startDate || 'All Time'} to ${filters?.endDate || 'Present'} | Generated: ${new Date().toLocaleDateString('en-IN')}`,
    margin,
    24
  );

  let totalDebit = 0;
  let totalCredit = 0;

  const tableRows = ledger.map((entry, idx) => {
    totalDebit += entry.debit;
    totalCredit += entry.credit;
    return [
      idx + 1,
      entry.entry_date,
      entry.transaction_type,
      entry.reference_no || '-',
      entry.description,
      entry.debit > 0 ? formatINR(entry.debit) : '-',
      entry.credit > 0 ? formatINR(entry.credit) : '-',
    ];
  });

  autoTable(doc, {
    startY: 34,
    margin: { left: margin, right: margin },
    head: [['#', 'Date', 'Type', 'Ref No', 'Description / Details', 'Debit (₹)', 'Credit (₹)']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  // Summary row
  // @ts-ignore
  const sumY = doc.lastAutoTable.finalY + 6;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, sumY, pageWidth - margin * 2, 16, 2, 2, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Opening Balance: ${formatINR(openingBalance)}`, margin + 6, sumY + 10);
  doc.text(`Total Debit: ${formatINR(totalDebit)}`, margin + 80, sumY + 10);
  doc.text(`Total Credit: ${formatINR(totalCredit)}`, margin + 150, sumY + 10);

  const closingBalance =
    accountType === 'Client'
      ? openingBalance + totalDebit - totalCredit
      : openingBalance + totalCredit - totalDebit;

  doc.setTextColor(closingBalance > 0 ? 220 : 16, closingBalance > 0 ? 38 : 185, closingBalance > 0 ? 38 : 129);
  doc.text(`Net Outstanding Balance: ${formatINR(closingBalance)}`, margin + 220, sumY + 10);

  doc.save(`${accountName.replace(/\s+/g, '_')}_Account_Statement.pdf`);
}

/**
 * Export Account Statement to Excel
 */
export function exportAccountStatementToExcel(
  accountType: string,
  accountName: string,
  ledger: LedgerEntry[],
  openingBalance: number
): void {
  const data = ledger.map((item, idx) => ({
    'S.No': idx + 1,
    'Date': item.entry_date,
    'Transaction Type': item.transaction_type,
    'Reference No': item.reference_no || '-',
    'Description': item.description,
    'Debit (₹)': item.debit,
    'Credit (₹)': item.credit,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statement');

  XLSX.writeFile(workbook, `${accountName.replace(/\s+/g, '_')}_Statement.xlsx`);
}
