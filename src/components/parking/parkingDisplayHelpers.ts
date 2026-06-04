import type {
  ParkingAssistHistoryItem,
  ParkingAssistSessionDetail,
  ParkingCorporateCheckout,
  ParkingCorporateCheckoutStatus,
  ParkingServicesCatalog,
} from '@/types/parking-assist';
import { findCatalogService, getParkingDurationLabel } from '@/utils/parking-services';

export type VehicleDefinitionSummary = {
  year?: number | null;
  make?: string | null;
  model?: string | null;
};

function formatYearMakeModel(definition: VehicleDefinitionSummary): string | null {
  const { year, make, model } = definition;
  if (!make || !model) {
    return null;
  }
  return year ? `${year} ${make} ${model}` : `${make} ${model}`;
}

const PARKING_STATUS_TEXT_COLORS: Record<ParkingCorporateCheckoutStatus, string> = {
  pending: 'text-yellow-500',
  running: 'text-blue-500',
  paid: 'text-green-500',
  failed: 'text-red-500',
  cancelled: 'text-text-secondary',
};

const PARKING_STATUS_INDICATOR_COLORS: Record<ParkingCorporateCheckoutStatus, string> = {
  pending: 'bg-yellow-500',
  running: 'bg-blue-500',
  paid: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500',
};

const NO_CHECKOUT_TEXT_COLOR = 'text-text-secondary';
const NO_CHECKOUT_INDICATOR_COLOR = 'bg-gray-500';

export function getParkingCheckoutStatusDisplay(
  status: ParkingCorporateCheckoutStatus | null | undefined,
  statusLabels: Record<ParkingCorporateCheckoutStatus, string>,
  noCheckoutLabel: string,
): { text: string; color: string; indicatorColor: string } {
  if (!status) {
    return {
      text: noCheckoutLabel,
      color: NO_CHECKOUT_TEXT_COLOR,
      indicatorColor: NO_CHECKOUT_INDICATOR_COLOR,
    };
  }

  return {
    text: statusLabels[status],
    color: PARKING_STATUS_TEXT_COLORS[status],
    indicatorColor: PARKING_STATUS_INDICATOR_COLORS[status],
  };
}

export function formatVehicleLine(
  definition: VehicleDefinitionSummary | undefined,
  item: Pick<ParkingAssistHistoryItem, 'vehicleDisplayName' | 'session'>,
): string {
  const ymm = definition ? formatYearMakeModel(definition) : null;
  if (ymm) {
    return ymm;
  }
  return item.vehicleDisplayName ?? `Vehicle ${item.session.vehicleTokenId}`;
}

export function formatSessionVehicleLine(
  definition: VehicleDefinitionSummary | undefined,
  detail: Pick<ParkingAssistSessionDetail, 'vehicleDisplayName' | 'session'>,
): string {
  const ymm = definition ? formatYearMakeModel(definition) : null;
  if (ymm) {
    return ymm;
  }
  return detail.vehicleDisplayName ?? `Vehicle ${detail.session.vehicleTokenId}`;
}

export function formatLicensePlateDisplay(
  plate: string | null | undefined,
  state: string | null | undefined,
  notSetLabel: string,
): string {
  const trimmed = plate?.trim();
  if (!trimmed) {
    return notSetLabel;
  }
  const trimmedState = state?.trim();
  if (trimmedState) {
    return `${trimmed} - ${trimmedState}`;
  }
  return trimmed;
}

export type CheckoutSummary = {
  parkingServiceLabel: string;
  durationLabel: string | null;
  zoneDisplay: string | null;
};

export function isCheckoutSummaryStatus(status: ParkingCorporateCheckoutStatus | undefined): boolean {
  return status === 'pending' || status === 'running' || status === 'paid';
}

export function resolveCheckoutSummary(
  checkout: ParkingCorporateCheckout,
  catalog: ParkingServicesCatalog,
  durationLabels: Record<string, string | undefined>,
): CheckoutSummary {
  const serviceEntry = findCatalogService(catalog, checkout.parkingService);
  const durationLabel = checkout.durationMinutes == null
    ? null
    : getParkingDurationLabel(checkout.durationMinutes, durationLabels);

  return {
    parkingServiceLabel: serviceEntry?.label ?? checkout.parkingService,
    durationLabel,
    zoneDisplay: checkout.zoneLabel ?? checkout.zoneId,
  };
}

export function formatHistoryLicensePlate(
  item: Pick<ParkingAssistHistoryItem, 'vehicleLicensePlate' | 'vehicleState' | 'latestCheckout'>,
  notSetLabel: string,
): string {
  const plate = item.vehicleLicensePlate ?? item.latestCheckout?.licensePlate ?? null;
  return formatLicensePlateDisplay(plate, item.vehicleState, notSetLabel);
}

export function formatHistoryTriggerLocation(
  item: Pick<ParkingAssistHistoryItem, 'session'>,
  triggerLocation: string | undefined,
  unknownLabel: string,
): string {
  if (triggerLocation) {
    return triggerLocation;
  }

  const { triggerLatitude: lat, triggerLongitude: lng } = item.session;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  return unknownLabel;
}

export function formatCheckoutSummaryLine(summary: CheckoutSummary): string {
  return [
    summary.parkingServiceLabel,
    summary.durationLabel,
    summary.zoneDisplay,
  ]
    .filter((part): part is string => Boolean(part))
    .join(', ');
}
