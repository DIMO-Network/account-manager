'use client';
import { DefaultPaymentMethodCard } from '@/components/payment/DefaultPaymentMethodCard';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { COLORS } from '@/utils/designSystem';

export function PaymentMethodClient() {
  const { customerId, loading: customerLoading, error: customerError } = useStripeCustomer();
  const { paymentMethods, defaultPaymentMethodId, loading, error } = usePaymentMethods(customerId);

  if (customerLoading || loading || !paymentMethods) {
    return (
      <div className="flex flex-col space-y-2">
        <div className={`animate-pulse ${COLORS.background.tertiary} h-5 rounded w-3/4`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-3 rounded w-1/2`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-3 rounded w-2/3`}></div>
      </div>
    );
  }

  if (customerError || error) {
    return <div className="text-feedback-error text-sm">Error loading payment method</div>;
  }

  const defaultPaymentMethod = paymentMethods.find(pm => pm.id === defaultPaymentMethodId);

  return (
    <>
      {defaultPaymentMethod && <DefaultPaymentMethodCard paymentMethod={defaultPaymentMethod} />}
    </>
  );
}
