'use client';

import { useSystemSettings } from '@/hooks/useSettings';
import { formatOMR, formatUSD } from '@/lib/utils';

export default function CurrencyAmount({
  amount,
  className = '',
  showUsd = true,
}: {
  amount: number | string;
  className?: string;
  showUsd?: boolean;
}) {
  const { data: settings } = useSystemSettings();
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (!showUsd || settings?.showUsdEquivalent === false) {
    return <span className={className}>{formatOMR(num)}</span>;
  }

  const rate = settings?.omrToUsdRate ?? 2.6;

  return (
    <span className={className}>
      {formatOMR(num)}
      <span className="ml-1.5 text-xs font-normal text-gray-400">
        approx. {formatUSD(num * rate)}
      </span>
    </span>
  );
}
