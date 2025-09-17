'use client';

import { PaymentMethodCard } from '@/components/payment/PaymentMethodCard';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { useState } from 'react';
import type Stripe from 'stripe';

type PaymentMethodsListClientProps = {
  paymentMethods: Stripe.PaymentMethod[];
  defaultPaymentMethodId: string | null;
  customerId: string;
};

export function PaymentMethodsListClient({
  paymentMethods,
  defaultPaymentMethodId,
  customerId,
}: PaymentMethodsListClientProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleSetDefault = async (paymentMethodId: string) => {
    setLoadingStates(prev => ({ ...prev, [paymentMethodId]: true }));

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

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error setting default payment method:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [paymentMethodId]: false }));
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    setLoadingStates(prev => ({ ...prev, [paymentMethodId]: true }));

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

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error removing payment method:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [paymentMethodId]: false }));
    }
  };

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
            onSetDefaultAction={handleSetDefault}
            onRemoveAction={handleRemove}
            isLoading={loadingStates[pm.id] || false}
            customerId={customerId}
          />
        ))}
      <PaymentMethodsNote />
    </div>
  );
}
