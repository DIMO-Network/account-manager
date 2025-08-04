'use client';

import Link from 'next/link';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';

export function PaymentMethodButtons() {
  const buttonStyle = 'inline-flex flex-row items-center justify-center gap-2 rounded-full bg-surface-raised px-4 py-2 text-sm w-full';

  const { customerId } = useStripeCustomer();
  const { paymentMethods, defaultPaymentMethodId, loading } = usePaymentMethods(customerId);

  if (loading || !customerId) {
    return (
      <div className="mt-6 flex justify-center">
        <div className="animate-pulse bg-surface-sunken h-6 w-full rounded-full" />
      </div>
    );
  }

  // If there are payment methods but no default, don't render anything
  if (paymentMethods.length > 0 && !defaultPaymentMethodId) {
    return null;
  }

  return (
    <div className="mt-6 flex justify-center">
      {paymentMethods.length === 0
        ? (
            <Link href="/payment-methods/add" className={buttonStyle}>
              Add a Card
            </Link>
          )
        : defaultPaymentMethodId
          ? (
              <Link href="/payment-methods" className={buttonStyle}>
                Edit
              </Link>
            )
          : null}
    </div>
  );
}
