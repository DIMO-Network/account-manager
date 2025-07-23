'use client';

import type Stripe from 'stripe';
import type { PaymentMethodsResponse } from '@/types/paymentMethod';
import { useCallback, useEffect, useState } from 'react';

export function usePaymentMethods(customerId: string | null) {
  const [paymentMethods, setPaymentMethods] = useState<Stripe.PaymentMethod[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!customerId) {
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`/api/payment-methods?customer_id=${customerId}`);
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch payment methods');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      const data: PaymentMethodsResponse = await response.json();
      setPaymentMethods(data.paymentMethods);
      setDefaultPaymentMethodId(data.defaultPaymentMethodId || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchPaymentMethods();
    }
  }, [fetchPaymentMethods, customerId]);

  return {
    paymentMethods,
    defaultPaymentMethodId,
    loading,
    error,
    fetchPaymentMethods,
    setDefaultPaymentMethodId,
    setPaymentMethods,
    setError,
    setLoading,
  };
}
