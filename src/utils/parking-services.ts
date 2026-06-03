import type {
  ParkingCorporateCheckout,
  ParkingService,
  ParkingServiceCatalogEntry,
  ParkingServicesCatalog,
} from '@/types/parking-assist';

export const PARKDETROIT_DURATION_MINUTES_OPTIONS = [60, 75, 90, 105, 120] as const;

export const PARKMOBILE_DURATION_MINUTES_OPTIONS = [
  30,
  40,
  50,
  60,
  70,
  80,
  90,
  100,
  110,
  120,
  130,
  140,
  150,
  160,
  170,
  180,
] as const;

/** All duration minutes that have locale keys under Parking.duration_option_ */
export const PARKING_DURATION_I18N_KEYS = [
  ...new Set([
    ...PARKDETROIT_DURATION_MINUTES_OPTIONS,
    ...PARKMOBILE_DURATION_MINUTES_OPTIONS,
  ]),
].sort((a, b) => a - b) as readonly number[];

export type ParkingDurationMinutes = (typeof PARKING_DURATION_I18N_KEYS)[number];

export function parkingDurationTranslationKey(minutes: number): string {
  return `duration_option_${minutes}`;
}

export function getParkingDurationLabel(
  minutes: number,
  durationLabels: Record<string, string | undefined>,
): string {
  return durationLabels[parkingDurationTranslationKey(minutes)] ?? String(minutes);
}

export function findCatalogService(
  catalog: ParkingServicesCatalog,
  serviceId: ParkingService | null | undefined,
): ParkingServiceCatalogEntry | undefined {
  if (!serviceId) {
    return catalog.services[0];
  }
  return catalog.services.find(service => service.id === serviceId);
}

export function isDurationAllowedForCatalogService(
  entry: ParkingServiceCatalogEntry | undefined,
  durationMinutes: number | null | undefined,
): boolean {
  if (!entry || durationMinutes == null) {
    return false;
  }
  return entry.durationOptions.some(option => option.minutes === durationMinutes);
}

export function getMinimumDurationMinutes(entry: ParkingServiceCatalogEntry): number {
  return Math.min(...entry.durationOptions.map(option => option.minutes));
}

export function getMaximumDurationMinutes(entry: ParkingServiceCatalogEntry): number {
  return Math.max(...entry.durationOptions.map(option => option.minutes));
}

function shouldReuseCheckoutDuration(checkout: ParkingCorporateCheckout | null): boolean {
  if (!checkout) {
    return false;
  }
  return checkout.status === 'pending' || checkout.status === 'running' || checkout.status === 'paid';
}

export function initialParkingCheckoutSelections(
  catalog: ParkingServicesCatalog,
  checkout: ParkingCorporateCheckout | null,
  suggestedParkingServiceId?: ParkingService | null,
): { parkingServiceId: ParkingService; durationMinutes: number } | null {
  const preferredService = checkout?.parkingService ?? suggestedParkingServiceId ?? undefined;
  const entry = findCatalogService(catalog, preferredService);
  if (!entry) {
    return null;
  }

  const fromCheckout = checkout?.durationMinutes;
  const durationMinutes
    = shouldReuseCheckoutDuration(checkout)
      && fromCheckout != null
      && isDurationAllowedForCatalogService(entry, fromCheckout)
      ? fromCheckout
      : getMinimumDurationMinutes(entry);

  return {
    parkingServiceId: entry.id,
    durationMinutes,
  };
}
