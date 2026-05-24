'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useInvestments';
import CurrencyAmount from '@/components/ui/CurrencyAmount';
import { formatAmountDual, formatDate, investmentStatusLabels, isOverdue } from '@/lib/utils';
import { Investment } from '@/types';
import {
  Wallet, TrendingUp, Clock, AlertCircle, ArrowRight, FileText,
} from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_META = {
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700' },
  COMPLETED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  DEFAULTED: { bg: 'bg-red-50', text: 'text-red-700' },
} as const;

export default function RecipientDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const total = stats
    ? (stats.statusCounts?.ACTIVE ?? 0) + (stats.statusCounts?.PENDING ?? 0)
      + (stats.statusCounts?.COMPLETED ?? 0) + (stats.statusCounts?.DEFAULTED ?? 0)
    : 0;

  return (
    <>
      <Header title="My Dashboard" />
      <div className="px-4 sm:px-6 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 px-6 py-8">
          <div className="relative z-10">
            <p className="text-primary-300 text-sm font-medium">
              {getGreeting()} &mdash; <span className="font-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</span>
            </p>
            <h1 className="text-3xl font-bold text-white mt-1.5">{user?.name}</h1>
            <p className="text-primary-300 text-sm mt-2">
              {isLoading ? 'Loading…' : `${total} assigned investment${total !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse bg-gray-200" />
            ))
          ) : (
            <>
              <Kpi label="Total Assigned" value={formatAmountDual(stats?.totalInvested ?? 0)} icon={<Wallet size={16} />} />
              <Kpi label="Total Repaid" value={formatAmountDual(stats?.totalRepaid ?? 0)} icon={<TrendingUp size={16} />} />
              <Kpi label="Outstanding" value={formatAmountDual(stats?.outstanding ?? 0)} icon={<Clock size={16} />} />
              <Kpi
                label="Overdue"
                value={String(stats?.overdueCount ?? 0)}
                icon={<AlertCircle size={16} />}
                warn={(stats?.overdueCount ?? 0) > 0}
              />
            </>
          )}
        </div>

        {stats?.nextDue && (
          <div className={`rounded-2xl border p-5 ${isOverdue(stats.nextDue.date) ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next Payment Due</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
              <div>
                <p className="font-bold text-gray-900">{stats.nextDue.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Due {formatDate(stats.nextDue.date)}
                  {isOverdue(stats.nextDue.date) && <span className="text-red-600 font-semibold ml-2">Overdue</span>}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Profit split: {stats.nextDue.ownerProfitRatio}% owner / {stats.nextDue.recipientProfitRatio}% you
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary-800"><CurrencyAmount amount={stats.nextDue.amount} /></p>
                <p className="text-xs text-gray-500">outstanding</p>
              </div>
            </div>
            <Link
              href={`/investments/${stats.nextDue.investmentId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 mt-3 hover:underline"
            >
              View investment <ArrowRight size={12} />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="My Investments" subtitle="Assigned to you" href="/investments">
            {isLoading ? (
              <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
            ) : !stats?.recentInvestments?.length ? (
              <p className="text-sm text-gray-400 py-8 text-center">No investments assigned yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {stats.recentInvestments.map((inv: Investment) => {
                  const meta = STATUS_META[inv.status as keyof typeof STATUS_META] ?? STATUS_META.PENDING;
                  return (
                    <li key={inv.id}>
                      <Link href={`/investments/${inv.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{inv.title}</p>
                          <p className="text-xs text-gray-400">{formatDate(inv.startDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold"><CurrencyAmount amount={inv.principalAmount} /></p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                            {investmentStatusLabels[inv.status]}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Payment History" subtitle="Recent repayments (view only)" href="/investments">
            {isLoading ? (
              <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
            ) : !stats?.recentPayments?.length ? (
              <p className="text-sm text-gray-400 py-8 text-center">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {stats.recentPayments.map((p: {
                  id: string; amount: number; paymentDate: string; investmentTitle: string; investmentId: string;
                }) => (
                  <li key={p.id} className="flex items-center justify-between py-3 px-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.investmentTitle}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.paymentDate)}</p>
                    </div>
                    <p className="text-sm font-bold text-green-700"><CurrencyAmount amount={p.amount} /></p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Link
          href="/documents"
          className="flex items-center gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <FileText size={18} className="text-amber-700" />
          <span className="text-sm font-semibold text-amber-800">View & acknowledge documents</span>
        </Link>
      </div>
    </>
  );
}

function Kpi({ label, value, icon, warn }: { label: string; value: string; icon: React.ReactNode; warn?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 text-white bg-gradient-to-br ${warn ? 'from-red-600 to-red-400' : 'from-primary-800 to-primary-600'}`}>
      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-3">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-white/80 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function Panel({ title, subtitle, href, children }: {
  title: string; subtitle: string; href: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <Link href={href} className="text-xs font-semibold text-primary-700 flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
