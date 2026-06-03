import type { ParkingAssistHistoryItem, ParkingCorporateCheckoutStatus } from '@/types/parking-assist';

export type VehicleDefinitionSummary = {
  year?: number | null;
  make?: string | null;
  model?: string | null;
};

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
  const { year, make, model } = definition ?? {};
  if (year && make && model) {
    return `${year} ${make} ${model}`;
  }
  return item.vehicleDisplayName ?? `Vehicle ${item.session.vehicleTokenId}`;
}

export function formatLicensePlateLine(
  item: Pick<ParkingAssistHistoryItem, 'vehicleLicensePlate' | 'vehicleState' | 'latestCheckout'>,
  labels: { prefix: string; notSet: string },
): string {
  const plate = item.vehicleLicensePlate?.trim() || item.latestCheckout?.licensePlate?.trim();
  if (!plate) {
    return `${labels.prefix}: ${labels.notSet}`;
  }
  const state = item.vehicleState?.trim();
  if (state) {
    return `${labels.prefix}: ${plate} - ${state}`;
  }
  return `${labels.prefix}: ${plate}`;
}

export function formatSessionDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTriggerLocationLine(
  item: Pick<ParkingAssistHistoryItem, 'session'>,
  triggerLocation: string | undefined,
  labels: { prefix: string; unknown: string },
): string {
  if (triggerLocation) {
    return `${labels.prefix}: ${triggerLocation}`;
  }

  const { triggerLatitude: lat, triggerLongitude: lng } = item.session;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${labels.prefix}: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  return `${labels.prefix}: ${labels.unknown}`;
}
