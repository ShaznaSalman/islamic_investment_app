'use client';

import { useDashboardStats } from '@/hooks/useInvestments';
import { useAuth } from '@/hooks/useAuth';
import RecipientDashboard from '@/components/dashboard/RecipientDashboard';
import Header from '@/components/layout/Header';
import CurrencyAmount from '@/components/ui/CurrencyAmount';
import { formatDate, investmentStatusLabels } from '@/lib/utils';
import {
  TrendingUp, Users, CheckCircle, Clock,
  Wallet, ArrowRight, Plus, FileText, BarChart2, AlertCircle,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import { Investment } from '@/types';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number;
}) {
  if (percent < 0.07) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * RADIAN)}
      y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

const STATUS_META = {
  ACTIVE:    { color: '#16a34a', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PENDING:   { color: '#d97706', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  COMPLETED: { color: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  DEFAULTED: { color: '#ef4444', bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
} as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  if (user?.role === 'RECIPIENT') return <RecipientDashboard />;

  const total = stats
    ? stats.statusCounts.ACTIVE + stats.statusCounts.PENDING +
      stats.statusCounts.COMPLETED + stats.statusCounts.DEFAULTED
    : 0;

  const pieData = stats
    ? [
        { name: 'Active',    value: stats.statusCounts.ACTIVE,    color: STATUS_META.ACTIVE.color    },
        { name: 'Pending',   value: stats.statusCounts.PENDING,   color: STATUS_META.PENDING.color   },
        { name: 'Completed', value: stats.statusCounts.COMPLETED, color: STATUS_META.COMPLETED.color },
        { name: 'Defaulted', value: stats.statusCounts.DEFAULTED, color: STATUS_META.DEFAULTED.color },
      ].filter((d) => d.value > 0)
    : [];

  const barData = stats
    ? [
        { name: 'Active',    count: stats.statusCounts.ACTIVE,    fill: STATUS_META.ACTIVE.color    },
        { name: 'Pending',   count: stats.statusCounts.PENDING,   fill: STATUS_META.PENDING.color   },
        { name: 'Completed', count: stats.statusCounts.COMPLETED, fill: STATUS_META.COMPLETED.color },
        { name: 'Defaulted', count: stats.statusCounts.DEFAULTED, fill: STATUS_META.DEFAULTED.color },
      ]
    : [];

  return (
    <>
      <Header title="Dashboard" />
      <div className="space-y-6 px-4 py-4 sm:px-6 sm:py-6">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 px-4 py-6 sm:px-6 sm:py-8">
          {/* Islamic star pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stars" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <polygon points="30,4 35,22 54,22 39,33 44,51 30,41 16,51 21,33 6,22 25,22" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stars)" />
          </svg>
          {/* Gold arc decoration */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border-[40px] border-gold-500/10 pointer-events-none" />
          <div className="absolute -right-6 -bottom-10 w-40 h-40 rounded-full border-[24px] border-gold-500/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-primary-300 text-sm font-medium tracking-wide">
                {getGreeting()} &mdash; <span className="font-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</span>
              </p>
              <h1 className="mt-1.5 text-2xl font-bold leading-tight text-white sm:text-3xl">{user?.name}</h1>
              <p className="text-primary-300 text-sm mt-2">
                {isLoading ? (
                  'Loading portfolio...'
                ) : (
                  <>
                    {total} investment{total !== 1 ? 's' : ''} &middot; <CurrencyAmount amount={stats?.totalInvested || 0} /> total portfolio
                  </>
                )}
              </p>
            </div>
            <Link
              href="/investments/new"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-primary-950 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-lg self-start sm:self-auto whitespace-nowrap"
            >
              <Plus size={15} strokeWidth={2.5} />
              New Investment
            </Link>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl animate-pulse bg-gray-200" />
            ))
          ) : (
            <>
              <KpiCard
                label="Total Invested"
                value={<CurrencyAmount amount={stats?.totalInvested || 0} />}
                icon={<Wallet size={17} />}
                gradient="from-primary-800 to-primary-600"
              />
              <KpiCard
                label="Total Repaid"
                value={<CurrencyAmount amount={stats?.totalRepaid || 0} />}
                sub={<>+<CurrencyAmount amount={stats?.totalProfitReceived || 0} /> profit</>}
                icon={<TrendingUp size={17} />}
                gradient="from-blue-700 to-blue-500"
              />
              <KpiCard
                label="Due This Week"
                value={String(stats?.upcomingIn7Days || 0)}
                sub={`${stats?.upcomingIn30Days || 0} in 30 days`}
                icon={<Clock size={17} />}
                gradient="from-amber-600 to-amber-400"
              />
              <KpiCard
                label="Active Investments"
                value={String(stats?.statusCounts.ACTIVE || 0)}
                sub={stats?.statusCounts.DEFAULTED ? `⚠ ${stats.statusCounts.DEFAULTED} defaulted` : 'All healthy'}
                icon={stats?.statusCounts.DEFAULTED ? <AlertCircle size={17} /> : <CheckCircle size={17} />}
                gradient={stats?.statusCounts.DEFAULTED ? 'from-red-600 to-red-400' : 'from-emerald-600 to-emerald-400'}
              />
            </>
          )}
        </div>

        {/* ── Charts + Recent Investments ── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Charts panel */}
          <div className="space-y-5">
            {/* Donut */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900">Portfolio Distribution</h3>
              <p className="text-xs text-gray-400 mt-0.5 mb-4">{total} total investments</p>

              {isLoading ? (
                <div className="h-44 animate-pulse bg-gray-100 rounded-xl" />
              ) : pieData.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center gap-2">
                  <Wallet size={28} className="text-gray-300" />
                  <p className="text-xs text-gray-400">No investments yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={(p) => <PieLabel {...p} />}
                    >
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v}`, n as string]} />
                  </PieChart>
                </ResponsiveContainer>
              )}

              <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 min-[420px]:grid-cols-2">
                {(['ACTIVE', 'PENDING', 'COMPLETED', 'DEFAULTED'] as const).map((s) => (
                  <Link key={s} href={`/investments?status=${s}`} className="flex items-center gap-1.5 group">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_META[s].dot}`} />
                    <span className="text-xs text-gray-500 group-hover:text-gray-700 truncate">{investmentStatusLabels[s]}</span>
                    <span className="text-xs font-bold text-gray-800 ml-auto">{stats?.statusCounts[s] ?? 0}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Count by Status</h3>
              {isLoading ? (
                <div className="h-36 animate-pulse bg-gray-100 rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={barData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {barData.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Investments */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Recent Investments</h3>
                <p className="text-xs text-gray-400 mt-0.5">Latest activity across your portfolio</p>
              </div>
              <Link
                href="/investments"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {isLoading ? (
              <div className="p-5 space-y-3 flex-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse bg-gray-100 rounded-xl" />
                ))}
              </div>
            ) : !stats?.recentInvestments?.length ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                  <Wallet size={24} className="text-primary-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No investments yet</p>
                <Link
                  href="/investments/new"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={12} /> Create first investment
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 flex-1">
                {stats.recentInvestments.map((inv: Investment) => {
                  const meta = STATUS_META[inv.status as keyof typeof STATUS_META] ?? STATUS_META.PENDING;
                  const initials = inv.recipient?.name
                    ?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '??';
                  return (
                    <li key={inv.id}>
                      <Link
                        href={`/investments/${inv.id}`}
                        className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-gray-50/70 sm:gap-4 sm:px-6"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-xs font-bold text-primary-700">{initials}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                            {inv.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {inv.recipient?.name} &middot; {formatDate(inv.startDate)}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-bold text-gray-900">
                            <CurrencyAmount amount={inv.principalAmount} />
                          </span>
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
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-0.5">Quick Actions</p>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-4">
            {[
              {
                href: '/investments/new', icon: Plus, label: 'New Investment',
                bg: 'bg-primary-50 hover:bg-primary-100 border-primary-100', text: 'text-primary-700', iconBg: 'bg-primary-100',
              },
              {
                href: '/reports', icon: BarChart2, label: 'View Reports',
                bg: 'bg-blue-50 hover:bg-blue-100 border-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-100',
              },
              {
                href: '/documents', icon: FileText, label: 'Documents',
                bg: 'bg-amber-50 hover:bg-amber-100 border-amber-100', text: 'text-amber-700', iconBg: 'bg-amber-100',
              },
              {
                href: '/recipients', icon: Users, label: 'Recipients',
                bg: 'bg-purple-50 hover:bg-purple-100 border-purple-100', text: 'text-purple-700', iconBg: 'bg-purple-100',
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm ${a.bg}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.iconBg}`}>
                  <a.icon size={15} className={a.text} />
                </div>
                <span className={`min-w-0 text-sm font-semibold ${a.text}`}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

function KpiCard({
  label, value, sub, icon, gradient,
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ReactNode; gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white`}>
      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-lg sm:text-xl font-bold leading-tight truncate">{value}</p>
      <p className="text-white/80 text-xs mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-white/55 text-[11px] mt-0.5">{sub}</p>}
      {/* Decorative circles */}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/[0.07] pointer-events-none" />
      <div className="absolute -bottom-8 -right-1 w-14 h-14 rounded-full bg-white/[0.05] pointer-events-none" />
    </div>
  );
}
