'use client';

import Link from 'next/link';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';

export function PaymentMethodButtons() {
  const { customerId } = useStripeCustomer();
  const { paymentMethods, loading } = usePaymentMethods(customerId);

  // Don't show buttons while loading
  if (loading || !customerId) {
    return null;
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="mt-6 flex justify-center">
        <Link
          href="/payment-methods/add"
          className="inline-flex flex-row items-center justify-center gap-2 rounded-full bg-surface-raised px-4 font-medium w-full h-10"
        >
          Add Card
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex justify-center">
      <Link
        href="/payment-methods"
        className="inline-flex flex-row items-center justify-center gap-2 rounded-full bg-surface-raised px-4 font-medium w-full h-10"
      >
        Edit
      </Link>
    </div>
  );
}
