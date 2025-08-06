import type { BackendSubscription } from '@/types/subscription';
import { useMemo } from 'react';
import { BackendSubscriptionItem } from './BackendSubscriptionItem';

export function BackendSubscriptions({ statuses }: { statuses: BackendSubscription[] }) {
  const filteredStatuses = useMemo(() =>
    statuses.filter(status => status.status !== 'canceled' && status.status !== 'canceled'), [statuses]);

  if (filteredStatuses.length === 0) {
    return <p className="text-base font-medium leading-6">No devices found.</p>;
  }

  return (
    <ul className="space-y-4">
      {filteredStatuses.map((status) => {
        const device = status.device;
        const key = device?.tokenId
          ? `device-${device.tokenId}`
          : `status-${status.stripe_id || status.start_date}-${status.status}`;

        return (
          <BackendSubscriptionItem key={key} status={status} />
        );
      })}
    </ul>
  );
}
