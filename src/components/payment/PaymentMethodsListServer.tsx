import { getPaymentMethods } from '@/app/actions/getPaymentMethods';
import { PaymentMethodCard } from '@/components/payment/PaymentMethodCard';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { COLORS, SPACING } from '@/utils/designSystem';

type PaymentMethodsListServerProps = {
  customerId: string;
};

export async function PaymentMethodsListServer({ customerId }: PaymentMethodsListServerProps) {
  try {
    const { paymentMethods, defaultPaymentMethodId } = await getPaymentMethods(customerId);

    // Only show "No payment methods found" if we have confirmed there are no payment methods
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
                'use server';
                // This will be handled by client-side action
              }}
              onRemoveAction={async () => {
                'use server';
                // This will be handled by client-side action
              }}
              isLoading={false}
              customerId={customerId}
            />
          ))}
        <PaymentMethodsNote />
      </div>
    );
  } catch (error) {
    console.error('Error loading payment methods:', error);
    return (
      <div className={`${SPACING.md} ${COLORS.background.primary} border border-feedback-error rounded-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-feedback-error font-medium">Error loading payment methods</h3>
            <p className="text-text-secondary text-sm mt-1">
              {error instanceof Error ? error.message : 'Failed to load payment methods'}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
