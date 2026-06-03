import type { VehicleDefinitionSummary } from './parkingDisplayHelpers';
import type { ParkingAssistHistoryItem, ParkingCorporateCheckoutStatus } from '@/types/parking-assist';
import {
  formatLicensePlateLine,
  formatTriggerLocationLine,
  formatVehicleLine,
  getParkingCheckoutStatusDisplay,
} from './parkingDisplayHelpers';

type ParkingHistoryDetailsProps = {
  item: ParkingAssistHistoryItem;
  statusLabels: Record<ParkingCorporateCheckoutStatus, string>;
  noCheckoutLabel: string;
  vehicleDefinition?: VehicleDefinitionSummary;
  triggerLocation?: string;
  detailLabels: {
    locationPrefix: string;
    locationUnknown: string;
    licensePlatePrefix: string;
    licensePlateNotSet: string;
  };
};

export function ParkingHistoryDetails({
  item,
  statusLabels,
  noCheckoutLabel,
  vehicleDefinition,
  triggerLocation,
  detailLabels,
}: ParkingHistoryDetailsProps) {
  const statusDisplay = getParkingCheckoutStatusDisplay(
    item.latestCheckout?.status,
    statusLabels,
    noCheckoutLabel,
  );

  return (
    <div className="px-4 py-3">
      <div className={`text-xs font-light leading-5 ${statusDisplay.color}`}>
        {statusDisplay.text}
      </div>

      <div className="text-base font-medium leading-5">
        {formatVehicleLine(vehicleDefinition, item)}
      </div>

      <div className="text-xs text-text-secondary mt-1">
        {formatTriggerLocationLine(item, triggerLocation, {
          prefix: detailLabels.locationPrefix,
          unknown: detailLabels.locationUnknown,
        })}
      </div>

      <div className="text-xs text-text-secondary">
        {formatLicensePlateLine(item, {
          prefix: detailLabels.licensePlatePrefix,
          notSet: detailLabels.licensePlateNotSet,
        })}
      </div>
    </div>
  );
}
