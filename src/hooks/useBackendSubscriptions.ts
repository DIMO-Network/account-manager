import type { BackendSubscription } from '@/types/subscription';
import { useEffect, useState } from 'react';
import { areAllStripeIdsNull, fetchBackendSubscriptions } from '@/libs/BackendSubscriptionService';
import { useAuth } from './useAuth';

export function useBackendSubscriptions() {
  const { user, isLoading: authLoading } = useAuth();
  const [subscriptions, setSubscriptions] = useState<BackendSubscription[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?.dimoToken) {
          setSubscriptions([]);
          return;
        }

        const data = await fetchBackendSubscriptions(user.dimoToken);
        setSubscriptions(data);
      } catch (err) {
        console.error('Error fetching backend subscriptions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if auth is not loading and we have user data
    if (!authLoading) {
      fetchSubscriptions();
    }
  }, [user?.dimoToken, authLoading]);

  // Use the shared utility function
  const allStripeIdsNull = areAllStripeIdsNull(subscriptions);

  return {
    subscriptions,
    loading: loading || authLoading,
    error,
    allStripeIdsNull,
  };
}
