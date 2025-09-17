'use client';

import type { BackendSubscription } from '@/types/subscription';
import { CarIcon } from '@/components/Icons';
import { BackendSubscriptions } from '@/components/subscriptions/backend';
import { PageHeader } from '@/components/ui';

type SubscriptionsClientProps = {
  backendStatuses: BackendSubscription[];
};

export function SubscriptionsClient({
  backendStatuses,
}: SubscriptionsClientProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader icon={<CarIcon />} title="Subscriptions" className="mb-0" />
      <BackendSubscriptions statuses={backendStatuses} />
    </div>
  );
}

export default SubscriptionsClient;
