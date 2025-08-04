'use client';

import type { StripeEnhancedSubscription } from '@/libs/StripeSubscriptionService';
import type { BackendSubscription } from '@/types/subscription';
import { CarIcon } from '@/components/Icons';
import { BackendSubscriptions } from '@/components/subscriptions/backend';
import { StripeSubscriptions } from '@/components/subscriptions/StripeSubscriptions';
import { PageHeader } from '@/components/ui';

type SubscriptionsClientProps = {
  backendStatuses: BackendSubscription[] | null;
  subscriptions: StripeEnhancedSubscription[];
};

export function SubscriptionsClient({
  subscriptions,
  backendStatuses,
}: SubscriptionsClientProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader icon={<CarIcon />} title="Subscriptions" className="mb-0" />
      {backendStatuses
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
