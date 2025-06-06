'use client';

import { useCallback, useEffect, useState } from 'react';

export const useStripeCustomer = () => {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch('/api/stripe/customer');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get customer');
      }

      const data = await response.json();
      setCustomerId(data.customerId);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to get customer');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    customerId,
    loading,
    error,
    refetchCustomer: fetchCustomer,
  };
};
