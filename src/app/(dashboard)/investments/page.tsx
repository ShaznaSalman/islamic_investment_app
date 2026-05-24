'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { useInvestments, useDeleteInvestment } from '@/hooks/useInvestments';
import { useAuth } from '@/hooks/useAuth';
import { Investment, InvestmentStatus, InvestmentType } from '@/types';
import CurrencyAmount from '@/components/ui/CurrencyAmount';
import {
  formatDate, investmentStatusColors, investmentStatusLabels, investmentTypeLabels,
} from '@/lib/utils';
import { Plus, Search, Trash2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DEFAULTED', label: 'Defaulted' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'MUDARABAH', label: 'Mudarabah' },
  { value: 'MUSHARAKAH', label: 'Musharakah' },
  { value: 'QARD_HASSAN', label: 'Qard Hassan' },
  { value: 'MURABAHAH', label: 'Murabahah' },
];

function InvestmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatus(s);
  }, [searchParams]);

  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (type) params.type = type;
  if (search) params.search = search;

  const { data, isLoading } = useInvestments(params);
  const deleteMutation = useDeleteInvestment();

  const investments = data?.investments || [];

  const columns = [
    {
      key: 'title',
      header: 'Investment',
      render: (row: Investment) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-400">{investmentTypeLabels[row.type as InvestmentType]}</p>
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient',
      render: (row: Investment) => (
        <span>{row.recipient?.name || '—'}</span>
      ),
    },
    {
      key: 'principalAmount',
      header: 'Amount (OMR)',
      render: (row: Investment) => (
        <span className="font-medium"><CurrencyAmount amount={row.principalAmount} /></span>
      ),
    },
    {
      key: 'ownerProfitRatio',
      header: 'Profit Split',
      render: (row: Investment) => (
        <span className="text-xs text-gray-600">
          {row.ownerProfitRatio}% / {row.recipientProfitRatio}%
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (row: Investment) => formatDate(row.startDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Investment) => (
        <Badge
          variant={
            row.status === 'ACTIVE' ? 'success' :
            row.status === 'COMPLETED' ? 'info' :
            row.status === 'DEFAULTED' ? 'error' : 'warning'
          }
        >
          {investmentStatusLabels[row.status as InvestmentStatus]}
        </Badge>
      ),
    },
    ...(user?.role === 'OWNER'
      ? [{
          key: 'actions',
          header: '',
          render: (row: Investment) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this investment?')) deleteMutation.mutate(row.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
            >
              <Trash2 size={15} />
            </button>
          ),
        }]
      : []),
  ];

  return (
    <>
      <Header
        title="Investments"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Investments' }]}
      />
      <div className="px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or purpose…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-40"
          />
          <Select
            options={TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-44"
          />
          {user?.role === 'OWNER' && (
            <Link href="/investments/new">
              <Button size="md">
                <Plus size={16} /> New Investment
              </Button>
            </Link>
          )}
        </div>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            data={investments}
            keyField="id"
            isLoading={isLoading}
            onRowClick={(row) => router.push(`/investments/${row.id}`)}
            emptyMessage={
              user?.role === 'OWNER'
                ? 'No investments found. Create one to get started.'
                : 'No investments assigned to you yet.'
            }
          />
        </Card>

        {data && (
          <p className="text-xs text-gray-400">
            Showing {investments.length} of {data.total} investments
          </p>
        )}
      </div>
    </>
  );
}

export default function InvestmentsPageWrapper() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-400">Loading…</p>}>
      <InvestmentsPageContent />
    </Suspense>
  );
}
