import type { VehicleDefinitionSummary } from './parkingDisplayHelpers';
import type {
  ParkingAssistHistoryItem,
  ParkingCorporateCheckoutStatus,
  ParkingServicesCatalog,
} from '@/types/parking-assist';
import {
  formatCheckoutSummaryLine,
  formatHistoryLicensePlate,
  formatHistoryTriggerLocation,
  formatVehicleLine,
  getParkingCheckoutStatusDisplay,
  isCheckoutSummaryStatus,
  resolveCheckoutSummary,
} from './parkingDisplayHelpers';

type ParkingHistoryDetailsProps = {
  item: ParkingAssistHistoryItem;
  statusLabels: Record<ParkingCorporateCheckoutStatus, string>;
  noCheckoutLabel: string;
  vehicleDefinition?: VehicleDefinitionSummary;
  triggerLocation?: string;
  detailLabels: {
    locationUnknown: string;
    licensePlateNotSet: string;
  };
  parkingServicesCatalog: ParkingServicesCatalog;
  durationLabels: Record<string, string>;
};

export function ParkingHistoryDetails({
  item,
  statusLabels,
  noCheckoutLabel,
  vehicleDefinition,
  triggerLocation,
  detailLabels,
  parkingServicesCatalog,
  durationLabels,
}: ParkingHistoryDetailsProps) {
  const checkout = item.latestCheckout;
  const checkoutSummary = checkout && isCheckoutSummaryStatus(checkout.status)
    ? resolveCheckoutSummary(checkout, parkingServicesCatalog, durationLabels)
    : null;

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
        {formatHistoryLicensePlate(item, detailLabels.licensePlateNotSet)}
      </div>

      <div className="text-xs text-text-secondary">
        {formatHistoryTriggerLocation(item, triggerLocation, detailLabels.locationUnknown)}
      </div>

      {checkoutSummary && (
        <div className="text-xs text-text-secondary">
          {formatCheckoutSummaryLine(checkoutSummary)}
        </div>
      )}
    </div>
  );
}
