'use client';

import { formatOMR, formatUSD, getUsdRate } from '@/lib/utils';

export default function CurrencyAmount({
  amount,
  className = '',
  showUsd = true,
}: {
  amount: number | string;
  className?: string;
  showUsd?: boolean;
}) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!showUsd) {
    return <span className={className}>{formatOMR(num)}</span>;
  }
  const rate = getUsdRate();
  return (
    <span className={className}>
      {formatOMR(num)}
      <span className="text-gray-400 font-normal text-xs ml-1.5">≈ {formatUSD(num * rate)}</span>
    </span>
  );
}
