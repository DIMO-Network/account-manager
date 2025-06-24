import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  cancelSubscriptionAction,
  cancelSubscriptionActionV2,
  createCheckoutAction,
  createCheckoutActionV2,
} from '@/app/actions/subscriptionActions';
import { debugFeatureFlags, featureFlags } from '@/utils/FeatureFlags';

export const useSubscriptionActions = () => {
  const [error, setError] = useState<string | null>(null);
  const [activating, startActivationTransition] = useTransition();
  const [canceling, startCancellationTransition] = useTransition();

  useEffect(() => {
    debugFeatureFlags();
  }, []);

  const activateSubscription = useCallback(async (
    connectionId: string,
    vehicleTokenId: string,
    userEmail?: string,
    plan: 'monthly' | 'annual' = 'monthly',
  ) => {
    if (!userEmail) {
      setError('User email is required to activate subscription');
      return { success: false };
    }

    return new Promise<{ success: boolean }>((resolve) => {
      startActivationTransition(async () => {
        setError(null);

        try {
          if (featureFlags.useBackendProxy) {
            console.warn(`🚩 Using backend proxy: ${featureFlags.backendApiUrl}`);

            const result = await createCheckoutActionV2(connectionId, vehicleTokenId, plan);

            if (result.success) {
              // V2 format: result.data.checkout_url
              window.location.href = result.data.checkout_url;
              resolve({ success: true });
            } else {
              setError(result.error);
              resolve({ success: false });
            }
          } else {
            console.warn('🚩 Using direct Stripe');

            const priceId = plan === 'annual'
              ? 'price_1RY9qJ4dLDxx1E1eMcJGcKuT'
              : 'price_1RUVNj4dLDxx1E1eF1HR4mRZ';

            const result = await createCheckoutAction(connectionId, vehicleTokenId, priceId);

            if (result.success) {
              // V1 format: result.data.url
              window.location.href = result.data.url;
              resolve({ success: true });
            } else {
              setError(result.error);
              resolve({ success: false });
            }
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
          const result = featureFlags.useBackendProxy
            ? await cancelSubscriptionActionV2(subscriptionId)
            : await cancelSubscriptionAction(subscriptionId);

          if (result.success) {
            resolve({ success: true });
          } else {
            setError(result.error);
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
    config: {
      usingBackendProxy: featureFlags.useBackendProxy,
      backendApiUrl: featureFlags.backendApiUrl,
    },
  };
};
