import type {
  ParkingCorporateCheckout,
  ParkingService,
  ParkingServiceCatalogEntry,
  ParkingServicesCatalog,
} from '@/types/parking-assist';

export const PARKING_DURATION_I18N_KEYS = [60, 75, 90, 105, 120] as const;

export type ParkingDurationMinutes = (typeof PARKING_DURATION_I18N_KEYS)[number];

export function parkingDurationTranslationKey(minutes: number): string {
  return `duration_option_${minutes}`;
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
    = fromCheckout != null && isDurationAllowedForCatalogService(entry, fromCheckout)
      ? fromCheckout
      : entry.defaultDurationMinutes;

  return {
    parkingServiceId: entry.id,
    durationMinutes,
  };
}
