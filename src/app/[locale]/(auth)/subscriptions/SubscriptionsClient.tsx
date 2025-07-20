import type { EnhancedSubscription } from '@/utils/subscriptionHelpers';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CarIcon, ChevronRightIcon, ConnectionIcon } from '@/components/Icons';
import { BackendSubscriptions } from '@/components/subscriptions/BackendSubscriptions';
import { StripeSubscriptions } from '@/components/subscriptions/StripeSubscriptions';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';
import { getSubscriptionRenewalInfo, getSubscriptionTypeAndPrice } from '@/utils/subscriptionHelpers';
import type { AllSubscriptionStatusesResponse } from '@/types/subscription';

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
      <ul className="space-y-4">
        {subscriptions.map(sub => (
          <li key={sub.id} className={`gap-2 ${BORDER_RADIUS.xl} bg-surface-raised`}>
            <Link href={`/subscriptions/${sub.id}`} className="block">
              <div className="border-b border-gray-700 pb-2">
                <div className="flex flex-row items-center justify-between gap-2 px-4 pt-3 w-full">
                  <div className="flex flex-row items-center gap-2">
                    <ConnectionIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
                    <h3 className="text-base font-medium leading-6">
                      {sub.productName}
                    </h3>
                  </div>
                  <ChevronRightIcon className={`w-2 h-3 ${COLORS.text.secondary}`} />
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="text-base font-medium leading-5">
                  {sub.vehicleDisplay}
                </div>
                <div className="text-xs font-light leading-5 mt-1">
                  {getSubscriptionTypeAndPrice(sub).displayText}
                </div>
                <div className={`text-xs font-light leading-5 ${COLORS.text.secondary}`}>
                  {getSubscriptionRenewalInfo(sub, sub.nextScheduledPrice, sub.nextScheduledDate).displayText}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
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
