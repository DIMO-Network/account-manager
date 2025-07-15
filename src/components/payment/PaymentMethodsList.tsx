'use client';

import Link from 'next/link';
import { CreditBalanceCard } from '@/components/payment/CreditBalanceCard';
import { PaymentMethodCard } from '@/components/payment/PaymentMethodCard';
import { PaymentMethodSkeleton } from '@/components/payment/PaymentMethodSkeleton';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';
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

  if (loading) {
    return <PaymentMethodSkeleton count={2} showNote={true} />;
  }

  // Only show "No payment methods found" if we're not loading and have confirmed there are no payment methods
  if (paymentMethods.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between min-w-full bg-surface-default rounded-xl py-4 px-3">
          <h3 className="font-medium text-base leading-6">No payment methods found</h3>
          <p className="text-xs text-text-secondary font-light leading-4.5 mt-1">
            You haven't added any payment methods yet. Add one to get started.
          </p>
        </div>
        <PaymentMethodsNote />
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
        <CreditBalanceCard customerId={customerId} />
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
      <PaymentMethodsNote />
    </div>
  );
};
