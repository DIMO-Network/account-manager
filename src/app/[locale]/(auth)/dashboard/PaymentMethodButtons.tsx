'use client';

import Link from 'next/link';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';

export function PaymentMethodButtons() {
  const buttonStyle = 'inline-flex flex-row items-center justify-center gap-2 rounded-full bg-surface-raised px-4 py-2 text-sm w-full';

  const { customerId } = useStripeCustomer();
  const { paymentMethods, loading } = usePaymentMethods(customerId);

  if (loading || !customerId) {
    return (
      <div className="mt-6 flex justify-center">
        <div className="animate-pulse bg-surface-sunken h-6 w-full rounded" />
      </div>
    );
  }

  return (
    <div className="mt-6 flex justify-center">
      {paymentMethods.length === 0
        ? (
            <Link href="/payment-methods/add" className={buttonStyle}>
              Add a Card
            </Link>
          )
        : (
            <Link href="/payment-methods" className={buttonStyle}>
              Edit
            </Link>
          )}
    </div>
  );
}
