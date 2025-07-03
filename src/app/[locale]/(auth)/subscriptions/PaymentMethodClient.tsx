'use client';
import { DefaultPaymentMethodCard } from '@/components/payment/DefaultPaymentMethodCard';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';

export function PaymentMethodClient() {
  const { customerId, loading: customerLoading, error: customerError } = useStripeCustomer();
  const { paymentMethods, defaultPaymentMethodId, loading, error } = usePaymentMethods(customerId);

  if (customerLoading || loading) {
    return <div className="text-grey-400 text-sm">Loading…</div>;
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
