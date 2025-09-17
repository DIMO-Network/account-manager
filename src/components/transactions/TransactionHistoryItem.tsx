'use client';

import type { TransactionHistoryEntry } from '@/types/transaction';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

type TransactionHistoryItemProps = TransactionHistoryEntry & {
  walletAddress?: string;
};

export function TransactionHistoryItem({
  to,
  value,
  time,
  type,
  description,
  walletAddress,
}: TransactionHistoryItemProps) {
  const formatValue = (value: bigint) => {
    // Convert from wei to DIMO (18 decimals)
    const dimoValue = Number(value) / 1e18;
    return dimoValue.toFixed(2);
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Determine if transaction is incoming
  // 1. If we have wallet address, check if it's the recipient (to address)
  // 2. Otherwise, use transaction type: Rewards are incoming, CreditTopUp might be outgoing
  const isIncoming = walletAddress
    ? to.toLowerCase() === walletAddress.toLowerCase()
    : type === 'Baseline' || type === 'Referrals' || type === 'Marketplace';

  return (
    <div className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${RESPONSIVE.text.body} font-medium ${COLORS.text.primary}`}>
              {description}
            </span>
          </div>
          <div className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
            {formatTime(time)}
          </div>
        </div>
        <div className="text-right">
          <div className={`${RESPONSIVE.text.body} font-medium ${
            isIncoming ? 'text-green-400' : 'text-red-400'
          }`}
          >
            {isIncoming ? '+' : '-'}
            {formatValue(value)}
            {' '}
            DIMO
          </div>
        </div>
      </div>
    </div>
  );
}
