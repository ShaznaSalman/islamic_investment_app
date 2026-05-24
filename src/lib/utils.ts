import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InvestmentStatus, InvestmentType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as OMR currency */
export function formatOMR(amount: number | string, showCode = true): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = new Intl.NumberFormat('en-OM', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(num);
  return showCode ? `OMR ${formatted}` : formatted;
}

/** Format a number as USD */
export function formatUSD(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

/** USD exchange rate (OMR → USD) */
export function getUsdRate(): number {
  const env = process.env.NEXT_PUBLIC_USD_EXCHANGE_RATE;
  return env ? parseFloat(env) || 2.6 : 2.6;
}

export function setUsdRate(rate: number) {
  return rate;
}

/** OMR with optional USD equivalent */
export function formatAmountDual(amount: number | string, showUsd = true): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const omr = formatOMR(num);
  if (!showUsd) return omr;
  return `${omr} (≈ ${formatUSD(num * getUsdRate())})`;
}

/** Simple OMR → USD conversion (approximate rate) */
export function omrToUsd(omr: number, rate?: number): number {
  return omr * (rate ?? getUsdRate());
}

/** Format a date string */
export function formatDate(date: string | Date | null | undefined, withTime = false): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** Returns true if a date is in the past */
export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

/** Returns true if a date is within the next N days */
export function isDueSoon(date: string | null | undefined, days = 7): boolean {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return d >= now && d <= future;
}

export const investmentTypeLabels: Record<InvestmentType, string> = {
  MUDARABAH: 'Mudarabah',
  MUSHARAKAH: 'Musharakah',
  QARD_HASSAN: 'Qard Hassan',
  MURABAHAH: 'Murabahah',
};

export const investmentStatusLabels: Record<InvestmentStatus, string> = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  DEFAULTED: 'Defaulted',
};

export const investmentStatusColors: Record<InvestmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  DEFAULTED: 'bg-red-100 text-red-800',
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function calculateOutstanding(principalAmount: number, totalRepaid: number): number {
  return Math.max(0, principalAmount - totalRepaid);
}

export function repaymentProgress(principalAmount: number, totalRepaid: number): number {
  if (principalAmount <= 0) return 0;
  return Math.min(100, (totalRepaid / principalAmount) * 100);
}
