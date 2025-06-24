import type { SubscriptionData } from '@/types/subscription';
import { useCallback, useEffect, useState, useTransition } from 'react';

export const useSubscriptionStatus = (connectionId: string) => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const checkStatus = useCallback(async () => {
    startTransition(async () => {
      try {
        setError(null);

        const url = `/api/subscriptions/check?connectionId=${connectionId}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SubscriptionData = await response.json();
        setSubscriptionData(data);

        if (data.error) {
          setError(data.error);
        }
      } catch (fetchError) {
        console.error('Error checking subscription:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to check subscription');
      }
    });
  }, [connectionId]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await checkStatus();
      setLoading(false);
    };

    loadInitialData();
  }, [checkStatus]);

  return {
    subscriptionData,
    loading: loading || isPending,
    error,
    checkStatus,
  };
};
