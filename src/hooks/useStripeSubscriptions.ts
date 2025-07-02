'use client';

import { useCallback, useEffect, useState } from 'react';

export function useStripeSubscriptions(customerId: string | null) {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!customerId) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions?customer_id=${customerId}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setError(null);
    } catch {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return { subscriptions, loading, error };
}
