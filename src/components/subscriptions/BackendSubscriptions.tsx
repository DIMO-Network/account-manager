import type { AllSubscriptionStatusesResponse } from '@/types/subscription';
import { featureFlags } from '@/utils/FeatureFlags';
import { BackendSubscriptionItem } from './BackendSubscriptionItem';

export function BackendSubscriptions({ statuses }: { statuses: AllSubscriptionStatusesResponse }) {
  const filteredStatuses = featureFlags.useBackendProxy
    ? statuses.filter(status => status.status !== 'canceled' && status.new_status !== 'canceled')
    : statuses;

  if (filteredStatuses.length === 0) {
    return <p className="text-base font-medium leading-6">No devices found.</p>;
  }

  return (
    <ul className="space-y-4">
      {filteredStatuses.map((status, index) => {
        const device = status.device;
        const key = device?.tokenId
          ? `device-${device.tokenId}`
          : `status-${status.start_date}-${status.new_status}-${index}`;

        return (
          <BackendSubscriptionItem key={key} status={status} index={index} />
        );
      })}
    </ul>
  );
}
