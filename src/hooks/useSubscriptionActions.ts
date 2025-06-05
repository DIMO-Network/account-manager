import { useCallback, useState, useTransition } from 'react';
import { createCheckoutAction } from '@/app/actions/subscriptionActions';

export const useSubscriptionActions = () => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activateSubscription = useCallback(async (
    serialNumber: string,
    userEmail?: string,
  ) => {
    if (!userEmail) {
      setError('User email is required to activate subscription');
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        const result = await createCheckoutAction(
          serialNumber,
          userEmail,
          'price_1RUVNj4dLDxx1E1eF1HR4mRZ',
        );

        if (result.success && result.data.url) {
          window.location.href = result.data.url;
        } else {
          setError(result.error || 'Failed to create checkout session');
        }
      } catch (err) {
        console.error('Error creating checkout session:', err);
        setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      }
    });
  }, []);

  return {
    activating: isPending,
    error,
    activateSubscription,
  };
};
