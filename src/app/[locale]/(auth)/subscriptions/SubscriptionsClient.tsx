'use client';

import type { AllSubscriptionStatusesResponse } from '@/types/subscription';
import type { EnhancedSubscription } from '@/utils/subscriptionHelpers';
import { useEffect, useState } from 'react';
import { CarIcon } from '@/components/Icons';
import { BackendSubscriptions } from '@/components/subscription/BackendSubscriptions';
import { StripeSubscriptions } from '@/components/subscription/StripeSubscriptions';
import { COLORS } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';

type SubscriptionsClientProps = {
  subscriptions: EnhancedSubscription[];
};

export function SubscriptionsClient({ subscriptions }: SubscriptionsClientProps) {
  const [backendStatuses, setBackendStatuses] = useState<AllSubscriptionStatusesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackendData, setUseBackendData] = useState(false);

  useEffect(() => {
    if (featureFlags.useBackendProxy) {
      const fetchBackendData = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch('/api/subscriptions/status/all');

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: AllSubscriptionStatusesResponse = await response.json();
          setBackendStatuses(data);
          setUseBackendData(true);
        } catch (err) {
          console.error('Error fetching backend subscription statuses:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };

      fetchBackendData();
    }
  }, []);

  let content;

  if (loading) {
    content = <p>Loading subscription statuses...</p>;
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="text-sm text-red-500">
          Error:
          {error}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  } else if (featureFlags.useBackendProxy && useBackendData && backendStatuses) {
    content = <BackendSubscriptions statuses={backendStatuses} />;
  } else {
    content = <StripeSubscriptions subscriptions={subscriptions} />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Subscriptions</h1>
      </div>
      {content}
    </div>
  );
}

export default SubscriptionsClient;
