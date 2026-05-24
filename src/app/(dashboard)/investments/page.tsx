'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import SearchInput from '@/components/ui/SearchInput';
import { useInvestments, useDeleteInvestment } from '@/hooks/useInvestments';
import { useAuth } from '@/hooks/useAuth';
import { Investment, InvestmentStatus, InvestmentType, User } from '@/types';
import CurrencyAmount from '@/components/ui/CurrencyAmount';
import {
  formatDate, investmentStatusColors, investmentStatusLabels, investmentTypeLabels,
} from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

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
  const [recipientId, setRecipientId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatus(s);
  }, [searchParams]);

  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (type) params.type = type;
  if (recipientId) params.recipientId = recipientId;
  if (from) params.from = from;
  if (to) params.to = to;
  if (search) params.search = search;

  const { data, isLoading } = useInvestments(params);
  const { data: usersData } = useQuery({
    queryKey: ['users', 'RECIPIENT'],
    queryFn: async () => {
      const { data } = await api.get('/api/users?role=RECIPIENT');
      return data as User[];
    },
    enabled: user?.role === 'OWNER',
  });
  const deleteMutation = useDeleteInvestment();

  const investments = data?.investments || [];
  const recipientOptions = [
    { value: '', label: 'All Recipients' },
    ...((usersData || []).map((u) => ({ value: u.id, label: u.name }))),
  ];

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
      <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <Card className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <SearchInput
              className="min-w-0 flex-1"
              label="Search"
              value={search}
              onChange={setSearch}
              placeholder="Search by title, recipient, or purpose…"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
              {user?.role === 'OWNER' && (
                <Select
                  label="Recipient"
                  compact
                  options={recipientOptions}
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full lg:w-48 lg:shrink-0"
                />
              )}
              <Select
                label="Status"
                compact
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full lg:w-40 lg:shrink-0"
              />
              <Select
                label="Type"
                compact
                options={TYPE_OPTIONS}
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full lg:w-44 lg:shrink-0"
              />
              <div className="w-full lg:w-36 lg:shrink-0">
                <label className="mb-1 block text-sm font-medium text-gray-700">From Date</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="block w-full rounded-xl border border-primary-100 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors hover:border-primary-300 focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>
              <div className="w-full lg:w-36 lg:shrink-0">
                <label className="mb-1 block text-sm font-medium text-gray-700">To Date</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="block w-full rounded-xl border border-primary-100 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors hover:border-primary-300 focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>
              {user?.role === 'OWNER' && (
                <Link href="/investments/new" className="sm:col-span-2 lg:col-span-1 lg:shrink-0">
                  <Button size="md" className="w-full lg:w-auto">
                    <Plus size={16} /> New Investment
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

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
