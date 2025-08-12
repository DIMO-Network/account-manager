import type { BackendSubscription } from '@/types/subscription';
import { useMemo } from 'react';
import { BackendSubscriptionItem } from './BackendSubscriptionItem';

export function BackendSubscriptions({ statuses }: { statuses: BackendSubscription[] }) {
  const filteredStatuses = useMemo(() =>
    statuses.filter((status) => {
      // Include all non-canceled subscriptions
      if (status.status !== 'canceled') {
        return true;
      }

      // For canceled subscriptions, only include Ruptela and AutoPi devices
      if (status.device?.manufacturer?.name) {
        const manufacturerName = status.device.manufacturer.name;
        return manufacturerName === 'Ruptela' || manufacturerName === 'AutoPi';
      }

      // Exclude canceled subscriptions without device/manufacturer info
      return false;
    }), [statuses]);

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
