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
            'price_1RUVNj4dLDxx1E1eF1HR4mRZ',
          );

          // Check if the result has a 'data' property (success case)
          if ('data' in result && result.data?.url) {
            // Always redirect to either success page or checkout
            window.location.href = result.data.url;
            resolve({ success: true });
          } else if ('error' in result) {
            // Handle error case
            setError(result.error || 'Failed to create subscription');
            resolve({ success: false });
          } else {
            // Handle unexpected case where data exists but no URL
            setError('No redirect URL provided');
            resolve({ success: false });
          }
        } catch (err) {
          console.error('Error activating subscription:', err);
          setError(err instanceof Error ? err.message : 'Failed to activate subscription');
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
            // Check if result has error property and use it
            const errorMessage = 'error' in result ? result.error : 'Failed to cancel subscription';
            setError(errorMessage || 'Failed to cancel subscription');
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
