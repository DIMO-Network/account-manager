import type { AllSubscriptionStatusesResponse } from '@/types/subscription';
import { ConnectionIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';
import { getBackendSubscriptionRenewalInfo } from '@/utils/subscriptionHelpers';

function BackendSubscriptionItem({ status, index }: { status: any; index: number }) {
  const device = status.device;
  const statusDisplay = getStatusDisplay(status);
  const key = device?.tokenId ? `device-${device.tokenId}` : `status-${status.start_date}-${index}`;

  return (
    <li key={key} className={`py-3 px-4 gap-2 ${BORDER_RADIUS.xl} bg-surface-raised hover:bg-dark-950 transition`}>
      <div className="block">
        <div className="flex flex-row items-center justify-between gap-2 mb-2 border-b border-gray-700 pb-2">
          <div className="flex flex-row items-center gap-2">
            <ConnectionIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
            <h3 className="text-base font-medium leading-6">
              {device ? `${device.vehicle.definition.make} ${device.vehicle.definition.model}` : 'Unknown Device'}
            </h3>
          </div>
          <div className={`text-sm font-medium ${statusDisplay.color}`}>
            {statusDisplay.text}
          </div>
        </div>
        {device && (
          <div className="text-base font-medium leading-5 mb-2 mt-4">
            {device.vehicle.definition.year}
            {' '}
            {device.vehicle.definition.make}
            {' '}
            {device.vehicle.definition.model}
          </div>
        )}
        <div className="text-xs font-light leading-5 mt-2">
          {device?.serial ? `Serial: ${device.serial}` : 'No serial number'}
        </div>
        <div className={`text-xs font-light leading-5 ${COLORS.text.secondary}`}>
          {getBackendSubscriptionRenewalInfo(status).displayText}
        </div>
        {device?.connection && (
          <div className="text-xs font-light leading-5 mt-1 text-blue-400">
            Connected via
            {' '}
            {device.connection.name}
          </div>
        )}
      </div>
    </li>
  );
}

// Helper function for backend status display
function getStatusDisplay(status: any) {
  const isActive = status.status === 'active' || status.status === 'trialing';
  const isTrialing = status.status === 'trialing';
  const isIncomplete = status.new_status === 'trialing_incomplete';

  let statusText = status.new_status;
  let statusColor = 'text-gray-500';

  if (isActive) {
    statusColor = 'text-green-500';
    if (isTrialing) {
      statusText = 'Trial Active';
    } else {
      statusText = 'Active';
    }
  } else if (isIncomplete) {
    statusColor = 'text-yellow-500';
    statusText = 'Trial Incomplete';
  } else if (status.status === 'canceled') {
    statusColor = 'text-red-500';
    statusText = 'Canceled';
  }

  return { text: statusText, color: statusColor };
}

export function BackendSubscriptions({ statuses }: { statuses: AllSubscriptionStatusesResponse }) {
  const filteredStatuses = featureFlags.useBackendProxy
    ? statuses.filter(status => status.status !== 'canceled' && status.new_status !== 'canceled')
    : statuses;

  if (filteredStatuses.length === 0) {
    return <p>No devices found.</p>;
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
