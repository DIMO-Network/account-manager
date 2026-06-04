import type { ParkingAssistHistoryItem } from '@/types/parking-assist';
import { describe, expect, it } from 'vitest';
import {
  formatParkingTimeRemaining,
  getPaidSessionExpiresAtMs,
  isActivePaidSession,
  isExpiredPaidSession,
  partitionParkingHistoryItems,
} from './parkingSessionExpiry';

function historyItem(
  overrides: Partial<ParkingAssistHistoryItem['latestCheckout']> = {},
  sessionId = 'session-1',
): ParkingAssistHistoryItem {
  return {
    session: {
      id: sessionId,
      vehicleTokenId: 1,
      triggeredAt: '2026-06-04T16:09:00.000Z',
      triggerLatitude: null,
      triggerLongitude: null,
      createdAt: '2026-06-04T16:09:00.000Z',
    },
    vehicleDisplayName: null,
    vehicleLicensePlate: null,
    vehicleCountry: null,
    vehicleState: null,
    latestCheckout: {
      id: 'checkout-1',
      status: 'paid',
      failureCode: null,
      failureMessage: null,
      flowbirdReference: null,
      amountCents: null,
      currency: null,
      zoneId: 'ZONE1',
      zoneLabel: 'ZONE1',
      licensePlate: 'ABC',
      parkingService: 'parkmobile',
      durationMinutes: 120,
      paidAt: '2026-06-04T16:13:26.361Z',
      automationRunId: null,
      createdAt: '2026-06-04T16:10:08.487Z',
      updatedAt: '2026-06-04T16:13:26.362Z',
      ...overrides,
    },
  };
}

describe('parkingSessionExpiry', () => {
  it('computes expiry from paidAt and duration in UTC', () => {
    const checkout = historyItem({}).latestCheckout!;
    const expiresAt = getPaidSessionExpiresAtMs(checkout);

    expect(expiresAt).toBe(new Date('2026-06-04T16:13:26.361Z').getTime() + 120 * 60_000);
  });

  it('treats paid session as active before expiry', () => {
    const item = historyItem({});
    const paidAtMs = new Date(item.latestCheckout!.paidAt!).getTime();

    expect(isActivePaidSession(item, paidAtMs + 60_000)).toBe(true);
    expect(isExpiredPaidSession(item, paidAtMs + 60_000)).toBe(false);
  });

  it('treats paid session as expired after duration elapses', () => {
    const item = historyItem({});
    const expiresAtMs = getPaidSessionExpiresAtMs(item.latestCheckout!)!;

    expect(isActivePaidSession(item, expiresAtMs)).toBe(false);
    expect(isExpiredPaidSession(item, expiresAtMs)).toBe(true);
  });

  it('partitions active items out of recent list', () => {
    const active = historyItem({ id: 'active' }, 'session-active');
    const expired = historyItem({ id: 'expired', paidAt: '2020-01-01T00:00:00.000Z' }, 'session-expired');
    const { activeItems, recentItems } = partitionParkingHistoryItems(
      [active, expired],
      new Date('2026-06-04T16:20:00.000Z').getTime(),
    );

    expect(activeItems).toHaveLength(1);
    expect(activeItems[0]?.latestCheckout?.id).toBe('active');
    expect(recentItems).toHaveLength(1);
    expect(recentItems[0]?.latestCheckout?.id).toBe('expired');
  });

  it('formats remaining time', () => {
    expect(formatParkingTimeRemaining(3_661_000)).toBe('1h 1m');
    expect(formatParkingTimeRemaining(125_000)).toBe('2m 5s');
  });
});
