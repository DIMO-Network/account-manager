'use client';

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
      <div className={`${SPACING.lg} text-center border ${COLORS.border.default} rounded-lg ${COLORS.background.secondary}`}>
        <div className="text-grey-400 text-4xl mb-3">💳</div>
        <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary} mb-2`}>No payment methods found</h3>
        <p className={`${RESPONSIVE.text.body} text-grey-400 mb-4`}>
          You haven't added any payment methods yet. Add one when you create your first subscription.
        </p>
        <button
          onClick={fetchPaymentMethods}
          className={`${RESPONSIVE.touch} px-4 py-2 text-sm text-primary-500 hover:text-primary-600 hover:bg-surface-sunken rounded transition-colors`}
          type="button"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2">
        <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Payment Method</h1>
      </div>
      {paymentMethods.map(pm => (
        <PaymentMethodCard
          key={pm.id}
          paymentMethod={pm}
          isDefault={pm.id === defaultPaymentMethodId}
          onSetDefaultAction={async () => {
            await fetchPaymentMethods();
          }}
          onRemoveAction={async () => {
            await fetchPaymentMethods();
          }}
          isLoading={false}
          onEditAction={() => {
            // This function is no longer needed as editCardId is removed
            // setEditCardId(pm.id);
          }}
        />
      ))}
      {/* TODO: Render EditCardModal here, passing cardToEdit and onClose */}
      <div className={`flex flex-col ${BORDER_RADIUS.lg} bg-surface-raised ${SPACING.xs} lg:block`}>
        <PaymentMethodsNote />
      </div>
    </div>
  );
};
