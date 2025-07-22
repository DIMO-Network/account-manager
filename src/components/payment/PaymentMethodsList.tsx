'use client';

import Link from 'next/link';
import { PaymentMethodCard } from '@/components/payment/PaymentMethodCard';
import { PaymentMethodSkeleton } from '@/components/payment/PaymentMethodSkeleton';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { BORDER_RADIUS, COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';

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
    return <PaymentMethodSkeleton count={2} showNote={true} />;
  }

  // Show customer error
  if (customerError) {
    return (
      <div className={`${SPACING.md} ${COLORS.background.primary} border border-feedback-error rounded-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-feedback-error font-medium">Error setting up payment methods</h3>
            <p className="text-text-secondary text-sm mt-1">{customerError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${SPACING.md} ${COLORS.background.primary} border border-feedback-error rounded-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-feedback-error font-medium">Error loading payment methods</h3>
            <p className="text-text-secondary text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchPaymentMethods}
            className={`${RESPONSIVE.touchSmall} px-3 py-1 text-sm text-feedback-error border-2 border-surface-raised rounded-full cursor-pointer`}
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

  // Show loading state if we're still loading OR if we have a customerId but no payment methods yet
  if (loading || (customerId && paymentMethods.length === 0 && !error)) {
    return <PaymentMethodSkeleton count={2} showNote={true} />;
  }

  // Only show "No payment methods found" if we're not loading and have confirmed there are no payment methods
  if (paymentMethods.length === 0) {
    return (
      <div className="space-y-4">
        <div className={`${SPACING.lg} text-center border ${COLORS.border.default} rounded-lg ${COLORS.background.secondary}`}>
          <div className="text-grey-400 text-4xl mb-3">💳</div>
          <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary} mb-2`}>No payment methods found</h3>
          <p className={`${RESPONSIVE.text.body} text-grey-400 mb-4`}>
            You haven't added any payment methods yet. Add one to get started.
          </p>
          <Link
            href="/payment-methods/add"
            className={`${RESPONSIVE.touchSmall} px-4 py-2 text-sm ${COLORS.background.primary} ${BORDER_RADIUS.full}`}
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
    <div className="space-y-4">
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
      <PaymentMethodsNote />
    </div>
  );
};
