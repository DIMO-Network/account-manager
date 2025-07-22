'use client';

import type { AllSubscriptionStatusesResponse } from '@/types/subscription';
import type { EnhancedSubscription } from '@/utils/subscriptionHelpers';
import { useEffect, useState } from 'react';
import { CarIcon } from '@/components/Icons';
import { BackendSubscriptions } from '@/components/subscriptions/BackendSubscriptions';
import { StripeSubscriptions } from '@/components/subscriptions/StripeSubscriptions';
import { SubscriptionSkeleton } from '@/components/subscriptions/SubscriptionSkeleton';
import { COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';

type SubscriptionsClientProps = {
  subscriptions: EnhancedSubscription[];
};

export function SubscriptionsClient({ subscriptions }: SubscriptionsClientProps) {
  const [backendStatuses, setBackendStatuses] = useState<AllSubscriptionStatusesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackendData, setUseBackendData] = useState(false);

  const fetchBackendData = async () => {
    if (!featureFlags.useBackendProxy) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/subscriptions/status/all');

      if (response.ok) {
        const data: AllSubscriptionStatusesResponse = await response.json();
        setBackendStatuses(data);
        setUseBackendData(true);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching backend subscription statuses:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Subscriptions</h1>
      </div>
      {loading
        ? (
            <SubscriptionSkeleton count={3} />
          )
        : error
          ? (
              <div className={`${SPACING.md} ${COLORS.background.primary} border border-feedback-error rounded-lg`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-feedback-error font-medium">Error loading subscription statuses</h3>
                    <p className="text-text-secondary text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={fetchBackendData}
                    className={`${RESPONSIVE.touchSmall} px-3 py-1 text-sm text-feedback-error border-2 border-surface-raised rounded-full cursor-pointer`}
                    type="button"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )
          : featureFlags.useBackendProxy && useBackendData && backendStatuses
            ? (
                <BackendSubscriptions statuses={backendStatuses} />
              )
            : (
                <StripeSubscriptions subscriptions={subscriptions} />
              )}
    </div>
  );
}

export default SubscriptionsClient;
