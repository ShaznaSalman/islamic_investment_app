'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { useInvestments } from '@/hooks/useInvestments';
import { Investment, Repayment } from '@/types';
import {
  formatOMR, formatDate, investmentStatusLabels, investmentTypeLabels, isOverdue,
} from '@/lib/utils';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportReportCsv, exportReportPdf, exportReportXlsx } from '@/lib/export';

const REPORT_TYPES = [
  { value: 'investments', label: 'Investment Summary' },
  { value: 'profit', label: 'Profit & Returns' },
  { value: 'repayment-status', label: 'Repayment Status' },
  { value: 'recipient', label: 'Per-Recipient Report' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('investments');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [reportData, setReportData] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: investmentsData } = useInvestments();
  const investments = investmentsData?.investments || [];

  const { data: usersData } = useQuery({
    queryKey: ['users', 'RECIPIENT'],
    queryFn: async () => {
      const { data } = await api.get('/api/users?role=RECIPIENT');
      return data;
    },
  });
  const recipientOptions = (usersData || []).map((u: { id: string; name: string }) => ({ value: u.id, label: u.name }));

  async function generateReport() {
    setLoading(true);
    try {
      if (reportType === 'recipient' && !recipientId) {
        toast.error('Please select a recipient');
        setReportData(null);
        return;
      }
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (status) params.append('status', status);

      let url = `/api/reports/${reportType}`;
      if (reportType === 'recipient') url = `/api/reports/recipient/${recipientId}`;

      const { data } = await api.get(`${url}?${params}`);
      setReportData(data);
    } catch {
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }

  async function exportPdf() {
    if (!reportData) return;
    const label = REPORT_TYPES.find((r) => r.value === reportType)?.label || 'Report';
    await exportReportPdf(reportType, label, reportData, `iia-${reportType}-${Date.now()}`);
  }

  async function exportExcel() {
    if (!reportData) return;
    await exportReportXlsx(reportType, reportData, `iia-${reportType}-${Date.now()}`);
  }

  return (
    <>
      <Header
        title="Reports"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]}
      />
      <div className="px-6 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader title="Generate Report" subtitle="Select report type and apply filters" />
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Select
                label="Report Type"
                options={REPORT_TYPES}
                value={reportType}
                onChange={(e) => { setReportType(e.target.value); setReportData(null); }}
              />
              {reportType !== 'recipient' && (
                <>
                  <Input label="From Date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  <Input label="To Date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </>
              )}
              {reportType === 'investments' && (
                <Select
                  label="Status"
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'DEFAULTED', label: 'Defaulted' },
                  ]}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
              )}
              {reportType === 'recipient' && (
                <Select
                  label="Recipient"
                  options={recipientOptions}
                  placeholder="Select recipient…"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                />
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={generateReport} loading={loading}>
                <BarChart3 size={16} /> Generate Report
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Results */}
        {reportData !== null && (
          <Card>
            <CardHeader
              title={REPORT_TYPES.find((r) => r.value === reportType)?.label || 'Report'}
              subtitle={`Generated on ${formatDate(new Date().toISOString(), true)}`}
              action={
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={exportPdf}>
                    <Download size={14} /> PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportExcel}>
                    <FileSpreadsheet size={14} /> Excel
                  </Button>
                </div>
              }
            />
            <CardBody className="p-0">
              {reportType === 'investments' && (
                <InvestmentSummaryTable data={(reportData as { investments: Investment[] }).investments} />
              )}
              {reportType === 'profit' && (
                <ProfitReportTable data={reportData as { repayments: Repayment[]; totals: { totalAmount: number; totalProfit: number; totalPrincipal: number } }} />
              )}
              {reportType === 'repayment-status' && (
                <RepaymentStatusTable data={reportData as { id: string; title: string; recipient: { name: string }; principalAmount: number; totalRepaid: number; outstanding: number; nextRepaymentDate: string | null; status: string; isOverdue: boolean }[]} />
              )}
              {reportType === 'recipient' && (
                <RecipientReport data={reportData as { recipient: { name: string; email: string }; investments: Investment[]; summary: { totalInvested: number; totalRepaid: number; totalProfit: number } }} />
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}

function InvestmentSummaryTable({ data }: { data: Investment[] }) {
  return (
    <table className="min-w-full data-table">
      <thead><tr><th>Title</th><th>Recipient</th><th>Type</th><th>Amount</th><th>Start Date</th><th>Status</th></tr></thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {data.map((inv) => (
          <tr key={inv.id}>
            <td className="font-medium">{inv.title}</td>
            <td>{inv.recipient?.name}</td>
            <td>{investmentTypeLabels[inv.type]}</td>
            <td className="font-semibold">{formatOMR(inv.principalAmount)}</td>
            <td>{formatDate(inv.startDate)}</td>
            <td>
              <Badge variant={inv.status === 'ACTIVE' ? 'success' : inv.status === 'COMPLETED' ? 'info' : inv.status === 'DEFAULTED' ? 'error' : 'warning'}>
                {investmentStatusLabels[inv.status]}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProfitReportTable({ data }: { data: { repayments: Repayment[]; totals: { totalAmount: number; totalProfit: number; totalPrincipal: number } } }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-400">Total Received</p>
          <p className="text-xl font-bold text-primary-800">{formatOMR(data.totals.totalAmount)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Total Profit</p>
          <p className="text-xl font-bold text-green-700">{formatOMR(data.totals.totalProfit)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Principal Repaid</p>
          <p className="text-xl font-bold text-gray-900">{formatOMR(data.totals.totalPrincipal)}</p>
        </div>
      </div>
      <table className="min-w-full data-table">
        <thead><tr><th>Date</th><th>Amount</th><th>Principal</th><th>Profit</th><th>Notes</th></tr></thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.repayments.map((r) => (
            <tr key={r.id}>
              <td>{formatDate(r.paymentDate)}</td>
              <td className="font-semibold">{formatOMR(r.amount)}</td>
              <td>{formatOMR(r.principalPortion)}</td>
              <td className="text-primary-700 font-medium">{formatOMR(r.profitPortion)}</td>
              <td className="text-gray-400">{r.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RepaymentStatusTable({ data }: {
  data: { id: string; title: string; recipient: { name: string }; principalAmount: number; totalRepaid: number; outstanding: number; nextRepaymentDate: string | null; status: string; isOverdue: boolean }[];
}) {
  return (
    <table className="min-w-full data-table">
      <thead><tr><th>Investment</th><th>Recipient</th><th>Principal</th><th>Repaid</th><th>Outstanding</th><th>Next Due</th><th>Status</th></tr></thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {data.map((row) => (
          <tr key={row.id}>
            <td className="font-medium">{row.title}</td>
            <td>{row.recipient?.name}</td>
            <td>{formatOMR(row.principalAmount)}</td>
            <td>{formatOMR(row.totalRepaid)}</td>
            <td className={row.outstanding > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatOMR(row.outstanding)}</td>
            <td className={row.isOverdue ? 'text-red-600 font-medium' : ''}>{formatDate(row.nextRepaymentDate)}</td>
            <td>
              <Badge variant={row.isOverdue ? 'error' : 'neutral'}>{row.isOverdue ? 'Overdue' : row.status}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RecipientReport({ data }: { data: { recipient: { name: string; email: string }; investments: Investment[]; summary: { totalInvested: number; totalRepaid: number; totalProfit: number } } }) {
  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="font-semibold text-lg text-gray-900">{data.recipient?.name}</p>
        <p className="text-xs text-gray-400">{data.recipient?.email}</p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total Invested</p>
            <p className="font-bold text-gray-900">{formatOMR(data.summary.totalInvested)}</p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total Repaid</p>
            <p className="font-bold text-green-700">{formatOMR(data.summary.totalRepaid)}</p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total Profit</p>
            <p className="font-bold text-primary-700">{formatOMR(data.summary.totalProfit)}</p>
          </div>
        </div>
      </div>
      <table className="min-w-full data-table">
        <thead><tr><th>Investment</th><th>Type</th><th>Amount</th><th>Repaid</th><th>Status</th></tr></thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.investments?.map((inv: Investment) => (
            <tr key={inv.id}>
              <td className="font-medium">{inv.title}</td>
              <td>{investmentTypeLabels[inv.type]}</td>
              <td>{formatOMR(inv.principalAmount)}</td>
              <td>{formatOMR(inv.totalRepaid)}</td>
              <td>
                <Badge variant={inv.status === 'ACTIVE' ? 'success' : inv.status === 'COMPLETED' ? 'info' : inv.status === 'DEFAULTED' ? 'error' : 'warning'}>
                  {investmentStatusLabels[inv.status]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
