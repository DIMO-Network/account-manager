'use client';

import type { BackendSubscription } from '@/types/subscription';
import { SubscriptionsClient } from '../subscriptions/SubscriptionsClient';

type DashboardContentProps = {
  initialBackendStatuses: BackendSubscription[];
};

export function DashboardContent({
  initialBackendStatuses,
}: DashboardContentProps) {
  return (
    <SubscriptionsClient
      backendStatuses={initialBackendStatuses}
    />
  );
}
