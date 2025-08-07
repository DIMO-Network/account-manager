'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CreditCardIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

type CreditBalanceCardProps = {
  customerId: string;
};

type CreditBalance = {
  available: number;
  currency: string;
};

export const CreditBalanceCard = ({ customerId }: CreditBalanceCardProps) => {
  const router = useRouter();
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreditBalance = async () => {
      if (!customerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/credit-balance?customer_id=${customerId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch credit balance');
        }

        const data = await response.json();
        setCreditBalance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load credit balance');
      } finally {
        setLoading(false);
      }
    };

    fetchCreditBalance();
  }, [customerId]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  };

  if (loading) {
    return (
      <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4 mb-4 relative`}>
        <div className="flex flex-col">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-800 rounded w-32"></div>
            <div className="h-8 bg-gray-800 rounded w-24"></div>
            <div className="h-3 bg-gray-800 rounded w-64"></div>
            <div className="flex gap-2 mt-4">
              <div className="h-8 w-20 bg-gray-800 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4 mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <CreditCardIcon className="w-4 h-4 text-text-secondary" />
          <span className="text-red-500 text-sm">Error loading credit balance</span>
        </div>
        <p className="text-xs text-text-secondary">{error}</p>
      </div>
    );
  }

  const displayBalance = creditBalance?.available || 0;
  const displayCurrency = creditBalance?.currency || 'usd';

  return (
    <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4 mb-6 relative`}>
      <div className="flex flex-col">
        <div className="absolute -top-3 right-4 px-3 py-1 leading-6 rounded-full text-xs font-medium text-black bg-pill-gradient uppercase tracking-wider">
          Credit Balance
        </div>
        <span className="font-medium text-white">
          Available Credit
        </span>
        <span className="text-2xl font-bold text-white mt-1">
          {formatCurrency(displayBalance, displayCurrency)}
        </span>
        <span className="text-xs text-text-secondary leading-4.5 mt-1">
          {displayBalance > 0
            ? 'This credit will be automatically applied to your next invoice'
            : 'No available credit balance'}
        </span>
        <div className="flex flex-row gap-2 mt-4">
          <button
            onClick={() => {
              router.push('/payment-methods/top-up');
            }}
            className={`${RESPONSIVE.touchSmall} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium text-xs px-4`}
            type="button"
          >
            Top Up
          </button>
        </div>
      </div>
    </div>
  );
};
