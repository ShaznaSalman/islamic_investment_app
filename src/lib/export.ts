import { formatOMR, formatDate, investmentStatusLabels, investmentTypeLabels } from '@/lib/utils';
import { Investment, Repayment } from '@/types';

type RepaymentStatusRow = {
  id: string;
  title: string;
  recipient: { name: string };
  principalAmount: number;
  totalRepaid: number;
  outstanding: number;
  nextRepaymentDate: string | null;
  status: string;
  isOverdue: boolean;
};

type RecipientReportData = {
  recipient: { name: string; email: string };
  investments: Investment[];
  summary: { totalInvested: number; totalRepaid: number; totalProfit: number };
};

function downloadBlob(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(headers: string[], rows: string[][]) {
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) lines.push(row.map(escapeCsv).join(','));
  return new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
}

export function exportReportCsv(
  reportType: string,
  reportData: object,
  filenameBase: string,
) {
  let blob: Blob;

  if (reportType === 'investments') {
    const investments = (reportData as { investments: Investment[] }).investments ?? [];
    blob = rowsToCsv(
      ['Title', 'Recipient', 'Type', 'Amount', 'Start Date', 'Status'],
      investments.map((inv) => [
        inv.title,
        inv.recipient?.name ?? '',
        investmentTypeLabels[inv.type],
        formatOMR(inv.principalAmount, false),
        formatDate(inv.startDate),
        investmentStatusLabels[inv.status],
      ]),
    );
  } else if (reportType === 'profit') {
    const { repayments = [] } = reportData as { repayments: Repayment[] };
    blob = rowsToCsv(
      ['Date', 'Investment', 'Recipient', 'Amount', 'Principal', 'Profit', 'Notes'],
      repayments.map((r) => [
        formatDate(r.paymentDate),
        (r as Repayment & { investment?: { title: string; recipient?: { name: string } } }).investment?.title ?? '',
        (r as Repayment & { investment?: { recipient?: { name: string } } }).investment?.recipient?.name ?? '',
        formatOMR(r.amount, false),
        formatOMR(r.principalPortion, false),
        formatOMR(r.profitPortion, false),
        r.notes ?? '',
      ]),
    );
  } else if (reportType === 'repayment-status') {
    const rows = reportData as RepaymentStatusRow[];
    blob = rowsToCsv(
      ['Investment', 'Recipient', 'Principal', 'Repaid', 'Outstanding', 'Next Due', 'Status'],
      rows.map((row) => [
        row.title,
        row.recipient?.name ?? '',
        formatOMR(row.principalAmount, false),
        formatOMR(row.totalRepaid, false),
        formatOMR(row.outstanding, false),
        formatDate(row.nextRepaymentDate),
        row.isOverdue ? 'Overdue' : row.status,
      ]),
    );
  } else {
    const data = reportData as RecipientReportData;
    blob = rowsToCsv(
      ['Investment', 'Type', 'Amount', 'Repaid', 'Status'],
      (data.investments ?? []).map((inv) => [
        inv.title,
        investmentTypeLabels[inv.type],
        formatOMR(inv.principalAmount, false),
        formatOMR(inv.totalRepaid, false),
        investmentStatusLabels[inv.status],
      ]),
    );
  }

  downloadBlob(blob, `${filenameBase}.csv`);
}

export async function exportReportXlsx(
  reportType: string,
  reportData: object,
  filenameBase: string,
) {
  const XLSX = await import('xlsx');
  let headers: string[] = [];
  let rows: string[][] = [];

  if (reportType === 'investments') {
    const investments = (reportData as { investments: Investment[] }).investments ?? [];
    headers = ['Title', 'Recipient', 'Type', 'Amount', 'Start Date', 'Status'];
    rows = investments.map((inv) => [
      inv.title,
      inv.recipient?.name ?? '',
      investmentTypeLabels[inv.type],
      formatOMR(inv.principalAmount, false),
      formatDate(inv.startDate),
      investmentStatusLabels[inv.status],
    ]);
  } else if (reportType === 'profit') {
    const { repayments = [] } = reportData as { repayments: Repayment[] };
    headers = ['Date', 'Investment', 'Amount', 'Principal', 'Profit', 'Notes'];
    rows = repayments.map((r) => [
      formatDate(r.paymentDate),
      (r as Repayment & { investment?: { title: string } }).investment?.title ?? '',
      formatOMR(r.amount, false),
      formatOMR(r.principalPortion, false),
      formatOMR(r.profitPortion, false),
      r.notes ?? '',
    ]);
  } else if (reportType === 'repayment-status') {
    const data = reportData as RepaymentStatusRow[];
    headers = ['Investment', 'Recipient', 'Principal', 'Repaid', 'Outstanding', 'Next Due', 'Status'];
    rows = data.map((row) => [
      row.title,
      row.recipient?.name ?? '',
      formatOMR(row.principalAmount, false),
      formatOMR(row.totalRepaid, false),
      formatOMR(row.outstanding, false),
      formatDate(row.nextRepaymentDate),
      row.isOverdue ? 'Overdue' : row.status,
    ]);
  } else {
    const data = reportData as RecipientReportData;
    headers = ['Investment', 'Type', 'Amount', 'Repaid', 'Status'];
    rows = (data.investments ?? []).map((inv) => [
      inv.title,
      investmentTypeLabels[inv.type],
      formatOMR(inv.principalAmount, false),
      formatOMR(inv.totalRepaid, false),
      investmentStatusLabels[inv.status],
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filenameBase}.xlsx`);
}

export async function exportReportPdf(
  reportType: string,
  reportLabel: string,
  reportData: object,
  filenameBase: string,
) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text('Islamic Investment App', 14, 16);
  doc.setFontSize(11);
  doc.text(reportLabel, 14, 24);
  doc.text(`Generated: ${formatDate(new Date().toISOString(), true)}`, 14, 30);

  let head: string[][] = [];
  let body: string[][] = [];

  if (reportType === 'investments') {
    const investments = (reportData as { investments: Investment[] }).investments ?? [];
    head = [['Title', 'Recipient', 'Type', 'Amount', 'Start', 'Status']];
    body = investments.map((inv) => [
      inv.title,
      inv.recipient?.name ?? '',
      investmentTypeLabels[inv.type],
      formatOMR(inv.principalAmount),
      formatDate(inv.startDate),
      investmentStatusLabels[inv.status],
    ]);
  } else if (reportType === 'profit') {
    const { repayments = [] } = reportData as { repayments: Repayment[] };
    head = [['Date', 'Investment', 'Amount', 'Principal', 'Profit']];
    body = repayments.map((r) => [
      formatDate(r.paymentDate),
      (r as Repayment & { investment?: { title: string } }).investment?.title ?? '',
      formatOMR(r.amount),
      formatOMR(r.principalPortion),
      formatOMR(r.profitPortion),
    ]);
  } else if (reportType === 'repayment-status') {
    const rows = reportData as RepaymentStatusRow[];
    head = [['Investment', 'Recipient', 'Principal', 'Repaid', 'Outstanding', 'Next Due', 'Status']];
    body = rows.map((row) => [
      row.title,
      row.recipient?.name ?? '',
      formatOMR(row.principalAmount),
      formatOMR(row.totalRepaid),
      formatOMR(row.outstanding),
      formatDate(row.nextRepaymentDate),
      row.isOverdue ? 'Overdue' : row.status,
    ]);
  } else {
    const data = reportData as RecipientReportData;
    head = [['Investment', 'Type', 'Amount', 'Repaid', 'Status']];
    body = (data.investments ?? []).map((inv) => [
      inv.title,
      investmentTypeLabels[inv.type],
      formatOMR(inv.principalAmount),
      formatOMR(inv.totalRepaid),
      investmentStatusLabels[inv.status],
    ]);
  }

  autoTable(doc, { head, body, startY: 36, styles: { fontSize: 8 } });
  doc.save(`${filenameBase}.pdf`);
}
