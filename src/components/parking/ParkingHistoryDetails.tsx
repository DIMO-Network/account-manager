import type { VehicleDefinitionSummary } from './parkingDisplayHelpers';
import type {
  ParkingAssistHistoryItem,
  ParkingCorporateCheckoutStatus,
  ParkingServicesCatalog,
} from '@/types/parking-assist';
import { getPaidSessionExpiresAtMs } from '@/utils/parkingSessionExpiry';
import {
  formatCheckoutSummaryLine,
  formatHistoryLicensePlate,
  formatHistoryTriggerLocation,
  formatVehicleLine,
  getParkingCheckoutStatusDisplay,
  isCheckoutSummaryStatus,
  resolveCheckoutSummary,
} from './parkingDisplayHelpers';
import { ParkingLocalDateTime } from './ParkingLocalDateTime';
import { ParkingSessionCountdown } from './ParkingSessionCountdown';

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
  showActiveCountdown?: boolean;
  showExpiredBadge?: boolean;
  expiredLabel: string;
  locale: string;
  paidAtLabel: string;
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
  showActiveCountdown = false,
  showExpiredBadge = false,
  expiredLabel,
  locale,
  paidAtLabel,
}: ParkingHistoryDetailsProps) {
  const checkout = item.latestCheckout;
  const expiresAtMs = checkout ? getPaidSessionExpiresAtMs(checkout) : null;
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
        {showExpiredBadge && (
          <span className="text-text-secondary font-normal">
            {' '}
            ·
            {' '}
            {expiredLabel}
          </span>
        )}
      </div>

      <div className="text-base font-medium leading-5">
        {formatVehicleLine(vehicleDefinition, item)}
      </div>

      {showActiveCountdown && expiresAtMs != null && (
        <ParkingSessionCountdown expiresAtMs={expiresAtMs} />
      )}

      <div className="text-xs text-text-secondary mt-1">
        {formatHistoryLicensePlate(item, detailLabels.licensePlateNotSet)}
      </div>

      <div className="text-xs text-text-secondary">
        {formatHistoryTriggerLocation(item, triggerLocation, detailLabels.locationUnknown)}
      </div>

      {checkoutSummary && (
        <>
          <div className="text-xs text-text-secondary">
            {formatCheckoutSummaryLine(checkoutSummary)}
          </div>
          {checkout?.paidAt && (
            <div className="text-xs text-text-secondary">
              {paidAtLabel}
              {': '}
              <ParkingLocalDateTime iso={checkout.paidAt} locale={locale} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
