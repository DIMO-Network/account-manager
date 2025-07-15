'use client';

import { useEffect, useState } from 'react';
import { CreditCardIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS, SPACING } from '@/utils/designSystem';

type CreditBalanceCardProps = {
  customerId: string;
};

type CreditBalance = {
  available: number;
  currency: string;
};

export const CreditBalanceCard = ({ customerId }: CreditBalanceCardProps) => {
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreditBalance = async () => {
      if (!customerId) {
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
      <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} ${SPACING.xs} mb-4`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} ${SPACING.xs} mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <CreditCardIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
          <span className="text-red-500 text-sm">Error loading credit balance</span>
        </div>
        <p className="text-xs text-grey-400">{error}</p>
      </div>
    );
  }

  const displayBalance = creditBalance?.available || 0;
  const displayCurrency = creditBalance?.currency || 'usd';

  return (
    <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} ${SPACING.xs} mb-4 relative`}>
      <div className="flex flex-col mt-4">
        <div className="absolute -top-2 right-6 px-2 py-1 rounded-full text-xs font-medium text-black bg-pill-gradient">
          Credit Balance
        </div>
        <div className="flex items-center gap-2 mb-2">
          <CreditCardIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
          <span className="font-medium text-white">Available Credit</span>
        </div>
        <span className="text-2xl font-bold text-white">
          {formatCurrency(displayBalance, displayCurrency)}
        </span>
        <span className="text-xs text-grey-400 mt-1">
          {displayBalance > 0
            ? 'This credit will be automatically applied to your next invoice'
            : 'No available credit balance'}
        </span>
      </div>
    </div>
  );
};
