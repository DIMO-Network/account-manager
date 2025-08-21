'use client';

import { WalletIcon } from '@/components/Icons';
import { useBackendSubscriptions } from '@/hooks/useBackendSubscriptions';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { PaymentMethodClient } from '../subscriptions/PaymentMethodClient';
import { PaymentMethodButtons } from './PaymentMethodButtons';

export function PaymentMethodContent() {
  const { loading, allStripeIdsNull } = useBackendSubscriptions();

  // Show loading state while fetching subscription data
  if (loading) {
    return (
      <div className={`flex flex-col justify-between ${BORDER_RADIUS.lg} ${COLORS.background.primary} py-3 px-4 lg:block min-h-24`}>
        <div className="flex flex-col">
          <div className="mb-4 hidden lg:block">
            <WalletIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="animate-pulse">
              <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <PaymentMethodButtons />
      </div>
    );
  }

  // Hide payment method section if all stripe_id values are null
  if (allStripeIdsNull) {
    return null;
  }

  return (
    <div className={`flex flex-col justify-between ${BORDER_RADIUS.lg} ${COLORS.background.primary} py-3 px-4 lg:block min-h-24`}>
      <div className="flex flex-col">
        <div className="mb-4 hidden lg:block">
          <WalletIcon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <PaymentMethodClient />
        </div>
      </div>
      <PaymentMethodButtons />
    </div>
  );
}
