import { COLORS } from '@/utils/designSystem';
import { getBackendSubscriptionRenewalInfo } from '@/utils/subscriptionHelpers';
import { getDeviceDisplayName, getStatusDisplay } from './utils/subscriptionDisplayHelpers';

type SubscriptionItemDetailsProps = {
  status: any;
  device: any;
};

export function SubscriptionItemDetails({ status, device }: SubscriptionItemDetailsProps) {
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
              (Detached)
            </div>
          )}

      <div className="text-xs font-light leading-5 mt-1">
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
  );
}
