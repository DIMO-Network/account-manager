import type { BackendSubscription, DeviceInfo } from '@/types/subscription';
import { COLORS } from '@/utils/designSystem';
import { getBackendSubscriptionRenewalInfo, getDeviceDisplayName, getStatusDisplay } from '../utils/subscriptionDisplayHelpers';

type BackendSubscriptionDetailsProps = {
  status: BackendSubscription;
  device: DeviceInfo | null;
};

export function BackendSubscriptionDetails({ status, device }: BackendSubscriptionDetailsProps) {
  if (!device) {
    return null;
  }

  return (
    <div className="px-4 py-3">
      <div className={`text-xs font-light leading-5 ${getStatusDisplay(status).color}`}>
        {getStatusDisplay(status).text}
      </div>

      {device.vehicle?.definition
        ? (
            <div className="text-base font-medium leading-5">
              {device.vehicle.definition.year}
              {' '}
              {device.vehicle.definition.make}
              {' '}
              {device.vehicle.definition.model}
            </div>
          )
        : (
            <div className="text-base font-medium leading-5">
              {getDeviceDisplayName(device)}
              {' '}
              {device.vehicle ? '(Detached)' : '(No Vehicle)'}
            </div>
          )}

      <div className="text-xs text-text-secondary mt-1">
        {device?.serial
          ? `Serial: ${device.serial}`
          : device.vehicle?.tokenId
            ? `Vehicle ID: ${device.vehicle.tokenId}`
            : 'N/A'}
      </div>

      {/* Show connection info only when there's an active vehicle connection */}
      {device.vehicle?.definition && (
        device?.connection
          ? (
              <div className="text-xs text-text-secondary">
                Connected via
                {' '}
                {device.connection.name}
              </div>
            )
          : device?.manufacturer?.name
            ? (
                <div className="text-xs text-text-secondary">
                  Connected via
                  {' '}
                  {device.manufacturer.name}
                </div>
              )
            : null
      )}

      {/* Only show renewal info for non-canceled subscriptions */}
      {status.status !== 'canceled' && (
        <div className={`text-xs text-text-secondary ${COLORS.text.secondary}`}>
          {getBackendSubscriptionRenewalInfo(status).displayText}
        </div>
      )}
    </div>
  );
}
