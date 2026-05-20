import type { ParkingServicesCatalog } from '@/types/parking-assist';
import { describe, expect, it } from 'vitest';
import {
  findCatalogService,
  initialParkingCheckoutSelections,
  isDurationAllowedForCatalogService,
} from './parking-services';

const catalog: ParkingServicesCatalog = {
  services: [
    {
      id: 'parkdetroit',
      label: 'ParkDetroit',
      zoneCodeHint: 'Zone code',
      defaultDurationMinutes: 60,
      durationOptions: [
        { minutes: 60, label: '1 hour' },
        { minutes: 90, label: '1 hour 30 min' },
      ],
    },
  ],
};

describe('parking-services', () => {
  it('defaults to first service and default duration', () => {
    expect(initialParkingCheckoutSelections(catalog, null)).toEqual({
      parkingServiceId: 'parkdetroit',
      durationMinutes: 60,
    });
  });

  it('reuses checkout service and duration when valid', () => {
    expect(
      initialParkingCheckoutSelections(catalog, {
        id: 'c1',
        status: 'failed',
        failureCode: null,
        failureMessage: null,
        flowbirdReference: null,
        amountCents: null,
        currency: null,
        zoneId: 'Z1',
        zoneLabel: 'Z1',
        licensePlate: 'ABC',
        parkingService: 'parkdetroit',
        durationMinutes: 90,
        paidAt: null,
        automationRunId: null,
        createdAt: '',
        updatedAt: '',
      }),
    ).toEqual({
      parkingServiceId: 'parkdetroit',
      durationMinutes: 90,
    });
  });

  it('falls back when checkout duration is not in catalog', () => {
    expect(
      initialParkingCheckoutSelections(catalog, {
        id: 'c1',
        status: 'failed',
        failureCode: null,
        failureMessage: null,
        flowbirdReference: null,
        amountCents: null,
        currency: null,
        zoneId: null,
        zoneLabel: null,
        licensePlate: null,
        parkingService: 'parkdetroit',
        durationMinutes: 120,
        paidAt: null,
        automationRunId: null,
        createdAt: '',
        updatedAt: '',
      }),
    ).toEqual({
      parkingServiceId: 'parkdetroit',
      durationMinutes: 60,
    });
  });

  it('validates duration against catalog entry', () => {
    const entry = findCatalogService(catalog, 'parkdetroit');

    expect(isDurationAllowedForCatalogService(entry, 90)).toBe(true);
    expect(isDurationAllowedForCatalogService(entry, 45)).toBe(false);
  });
});
