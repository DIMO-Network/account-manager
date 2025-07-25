'use client';

import type { BackendSubscription } from '@/types/subscription';
import type { StripeEnhancedSubscription } from '@/utils/subscriptionHelpers';
import { CarIcon } from '@/components/Icons';
import { BackendSubscriptions } from '@/components/subscriptions/BackendSubscriptions';
import { StripeSubscriptions } from '@/components/subscriptions/StripeSubscriptions';
import { COLORS } from '@/utils/designSystem';

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
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Subscriptions</h1>
      </div>
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
