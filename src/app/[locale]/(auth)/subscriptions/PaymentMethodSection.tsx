'use client';

import Link from 'next/link';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { useBackendSubscriptions } from '@/hooks/useBackendSubscriptions';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { PaymentMethodClient } from './PaymentMethodClient';

export function PaymentMethodSection() {
  const { loading, allStripeIdsNull } = useBackendSubscriptions();

  // Show loading state while fetching subscription data
  if (loading) {
    return (
      <div className="hidden lg:flex flex-col lg:w-1/4 gap-4">
        <div className={`hidden lg:flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} px-4 py-3`}>
          <div className="mb-4">
            <WalletIcon className="w-4 h-4" />
          </div>
          <div className="animate-pulse">
            <div className="h-5 bg-gray-800 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-800 rounded w-1/2"></div>
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              href="/payment-methods"
              className="inline-flex flex-row items-center justify-center gap-2 rounded-full bg-surface-raised px-4 font-medium w-full h-10"
            >
              Edit
            </Link>
          </div>
        </div>
        <div className="hidden lg:flex">
          <PaymentMethodsNote />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col lg:w-1/4 gap-4">
      {allStripeIdsNull
        ? null
        : (
            <div className={`hidden lg:flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} px-4 py-3`}>
              <div className="mb-4">
                <WalletIcon className="w-4 h-4" />
              </div>
              <PaymentMethodClient />
              <div className="mt-6 flex justify-center">
                <Link
                  href="/payment-methods"
                  className="inline-flex flex-row items-center justify-center gap-2 rounded-full bg-surface-raised px-4 font-medium w-full h-10"
                >
                  Edit
                </Link>
              </div>
            </div>
          )}
      <div className="hidden lg:flex">
        <PaymentMethodsNote />
      </div>
    </div>
  );
}
