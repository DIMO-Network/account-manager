'use client';

import Link from 'next/link';
import { PaymentMethodCard } from '@/components/payment/PaymentMethodCard';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { BORDER_RADIUS, COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';
import { WalletIcon } from '../Icons';

export const PaymentMethodsList = () => {
  const { customerId, loading: customerLoading, error: customerError } = useStripeCustomer();
  const {
    paymentMethods,
    defaultPaymentMethodId,
    loading,
    error,
    fetchPaymentMethods,
  } = usePaymentMethods(customerId);

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId,
          customerId,
          action: 'set_default',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default payment method');
      }

      // Refresh the payment methods to get updated default
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove payment method');
      }

      // Refresh the payment methods
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error removing payment method:', error);
    }
  };

  // Show loading state while getting customer
  if (customerLoading) {
    return (
      <div className="space-y-4">
        <div className={`animate-pulse ${COLORS.background.tertiary} h-8 rounded w-1/3`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-24 rounded-lg`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-24 rounded-lg`}></div>
      </div>
    );
  }

  // Show customer error
  if (customerError) {
    return (
      <div className={`${SPACING.md} ${COLORS.background.secondary} border border-feedback-error rounded-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-feedback-error font-semibold">Error setting up payment methods</h3>
            <p className="text-grey-400 text-sm mt-1">{customerError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching payment methods
  if (loading) {
    return (
      <div className="space-y-4">
        <div className={`animate-pulse ${COLORS.background.tertiary} h-24 rounded-lg`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-24 rounded-lg`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${SPACING.md} ${COLORS.background.secondary} border border-feedback-error rounded-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-feedback-error font-semibold">Error loading payment methods</h3>
            <p className="text-grey-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchPaymentMethods}
            className={`${RESPONSIVE.touch} px-3 py-1 text-sm text-feedback-error hover:text-feedback-error hover:bg-surface-sunken rounded transition-colors`}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className={`${SPACING.md} ${COLORS.background.secondary} border border-yellow-500 rounded-lg`}>
        <p className="text-yellow-500">
          Unable to load payment methods. Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2">
          <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
          <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Payment Method</h1>
        </div>
        <div className={`${SPACING.lg} text-center border ${COLORS.border.default} rounded-lg ${COLORS.background.secondary}`}>
          <div className="text-grey-400 text-4xl mb-3">💳</div>
          <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary} mb-2`}>No payment methods found</h3>
          <p className={`${RESPONSIVE.text.body} text-grey-400 mb-4`}>
            You haven't added any payment methods yet. Add one to get started.
          </p>
          <Link
            href="/payment-methods/add"
            className={`${RESPONSIVE.touch} px-4 py-2 text-sm bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors inline-block`}
          >
            Add a Card
          </Link>
        </div>
        <div className={`flex flex-col ${BORDER_RADIUS.lg} bg-surface-raised ${SPACING.xs} lg:block`}>
          <PaymentMethodsNote />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between border-b border-gray-700 pb-2">
        <div className="flex flex-row items-center gap-2">
          <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
          <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Payment Method</h1>
        </div>
        <Link
          href="/payment-methods/add"
          className="px-4 py-2 text-sm bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors"
        >
          Add a Card
        </Link>
      </div>
      {paymentMethods
        .sort((a, b) => {
          // Default payment method first
          if (a.id === defaultPaymentMethodId) {
            return -1;
          }
          if (b.id === defaultPaymentMethodId) {
            return 1;
          }
          return 0;
        })
        .map(pm => (
          <PaymentMethodCard
            key={pm.id}
            paymentMethod={pm}
            isDefault={pm.id === defaultPaymentMethodId}
            onSetDefaultAction={async () => {
              await handleSetDefault(pm.id);
            }}
            onRemoveAction={async () => {
              await handleRemove(pm.id);
            }}
            isLoading={false}
            customerId={customerId}
          />
        ))}
      <div className={`flex flex-col ${BORDER_RADIUS.lg} bg-surface-raised ${SPACING.xs} lg:block`}>
        <PaymentMethodsNote />
      </div>
    </div>
  );
};
