import type { ParkingServicesCatalog } from '@/types/parking-assist';
import { describe, expect, it } from 'vitest';
import {
  findCatalogService,
  getParkingDurationLabel,
  initialParkingCheckoutSelections,
  isDurationAllowedForCatalogService,
  parkingDurationTranslationKey,
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
    {
      id: 'parkmobile',
      label: 'ParkMobile',
      zoneCodeHint: 'Zone code',
      defaultDurationMinutes: 60,
      durationOptions: [
        { minutes: 30, label: '30 min' },
        { minutes: 60, label: '1 hour' },
        { minutes: 100, label: '1 hour 40 min' },
      ],
    },
    {
      id: 'parkferndale',
      label: 'ParkFerndale',
      zoneCodeHint: 'Zone code',
      defaultDurationMinutes: 60,
      durationOptions: [
        { minutes: 30, label: '30 min' },
        { minutes: 60, label: '1 hour' },
        { minutes: 90, label: '1 hour 30 min' },
        { minutes: 120, label: '2 hours' },
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
      durationMinutes: 60,
    });
  });

  it('reuses checkout duration for active checkouts', () => {
    expect(
      initialParkingCheckoutSelections(catalog, {
        id: 'c1',
        status: 'pending',
        failureCode: null,
        failureMessage: null,
        flowbirdReference: null,
        amountCents: null,
        currency: null,
        zoneId: 'Z1',
        zoneLabel: 'Z1',
        licensePlate: 'ABC',
        parkingService: 'parkmobile',
        durationMinutes: 100,
        paidAt: null,
        automationRunId: null,
        createdAt: '',
        updatedAt: '',
      }),
    ).toEqual({
      parkingServiceId: 'parkmobile',
      durationMinutes: 100,
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

  it('uses suggested parking service when no checkout exists', () => {
    expect(initialParkingCheckoutSelections(catalog, null, 'parkmobile')).toEqual({
      parkingServiceId: 'parkmobile',
      durationMinutes: 30,
    });
  });

  it('defaults duration to the minimum allowed for the selected service', () => {
    expect(initialParkingCheckoutSelections(catalog, null, 'parkdetroit')).toEqual({
      parkingServiceId: 'parkdetroit',
      durationMinutes: 60,
    });
  });

  it('resolves ParkMobile duration labels from locale map', () => {
    const durationLabels = {
      [parkingDurationTranslationKey(30)]: '30 minutes',
      [parkingDurationTranslationKey(50)]: '50 minutes',
      [parkingDurationTranslationKey(70)]: '1 hour 10 minutes',
      [parkingDurationTranslationKey(100)]: '1 hour 40 minutes',
      [parkingDurationTranslationKey(180)]: '3 hours',
    };

    expect(getParkingDurationLabel(30, durationLabels)).toBe('30 minutes');
    expect(getParkingDurationLabel(70, durationLabels)).toBe('1 hour 10 minutes');
    expect(getParkingDurationLabel(100, durationLabels)).toBe('1 hour 40 minutes');
    expect(getParkingDurationLabel(180, durationLabels)).toBe('3 hours');
  });

  it('prefers checkout parking service over suggestion', () => {
    expect(
      initialParkingCheckoutSelections(
        catalog,
        {
          id: 'c2',
          status: 'pending',
          failureCode: null,
          failureMessage: null,
          flowbirdReference: null,
          amountCents: null,
          currency: null,
          zoneId: null,
          zoneLabel: null,
          licensePlate: null,
          parkingService: 'parkdetroit',
          durationMinutes: 60,
          paidAt: null,
          automationRunId: null,
          createdAt: '',
          updatedAt: '',
        },
        'parkmobile',
      ),
    ).toEqual({
      parkingServiceId: 'parkdetroit',
      durationMinutes: 60,
    });
  });

  it('defaults ParkMobile to 30 minutes after a failed checkout', () => {
    expect(
      initialParkingCheckoutSelections(catalog, {
        id: 'c3',
        status: 'failed',
        failureCode: null,
        failureMessage: null,
        flowbirdReference: null,
        amountCents: null,
        currency: null,
        zoneId: 'Z1',
        zoneLabel: 'Z1',
        licensePlate: 'ABC',
        parkingService: 'parkmobile',
        durationMinutes: 60,
        paidAt: null,
        automationRunId: null,
        createdAt: '',
        updatedAt: '',
      }),
    ).toEqual({
      parkingServiceId: 'parkmobile',
      durationMinutes: 30,
    });
  });

  it('uses suggested ParkFerndale service and minimum duration', () => {
    expect(initialParkingCheckoutSelections(catalog, null, 'parkferndale')).toEqual({
      parkingServiceId: 'parkferndale',
      durationMinutes: 30,
    });
  });

  it('validates ParkFerndale duration options', () => {
    const entry = findCatalogService(catalog, 'parkferndale');

    expect(isDurationAllowedForCatalogService(entry, 120)).toBe(true);
    expect(isDurationAllowedForCatalogService(entry, 45)).toBe(false);
  });
});
