import { useCallback, useState, useTransition } from 'react';
import { cancelSubscriptionAction, createCheckoutAction } from '@/app/actions/subscriptionActions';

export const useSubscriptionActions = () => {
  const [error, setError] = useState<string | null>(null);
  const [activating, startActivationTransition] = useTransition();
  const [canceling, startCancellationTransition] = useTransition();

  const activateSubscription = useCallback(async (
    serialNumber: string,
    userEmail?: string,
  ) => {
    if (!userEmail) {
      setError('User email is required to activate subscription');
      return { success: false };
    }

    return new Promise<{ success: boolean }>((resolve) => {
      startActivationTransition(async () => {
        setError(null);

        try {
          const result = await createCheckoutAction(
            serialNumber,
            userEmail,
            'price_1RUVNj4dLDxx1E1eF1HR4mRZ',
          );

          if (result.success && result.data.url) {
            window.location.href = result.data.url;
            resolve({ success: true });
          } else {
            setError(result.error || 'Failed to create checkout session');
            resolve({ success: false });
          }
        } catch (err) {
          console.error('Error creating checkout session:', err);
          setError(err instanceof Error ? err.message : 'Failed to create checkout session');
          resolve({ success: false });
        }
      });
    });
  }, []);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    return new Promise<{ success: boolean }>((resolve) => {
      startCancellationTransition(async () => {
        setError(null);

        try {
          const result = await cancelSubscriptionAction(subscriptionId);

          if (result.success) {
            resolve({ success: true });
          } else {
            setError(result.error || 'Failed to cancel subscription');
            resolve({ success: false });
          }
        } catch (err) {
          console.error('Error canceling subscription:', err);
          setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
          resolve({ success: false });
        }
      });
    });
  }, []);

  return {
    activating,
    canceling,
    error,
    activateSubscription,
    cancelSubscription,
  };
};
