import type { ParkingAssistHistoryItem, ParkingCorporateCheckout } from '@/types/parking-assist';

export function getPaidSessionExpiresAtMs(checkout: ParkingCorporateCheckout): number | null {
  if (!checkout.paidAt || checkout.durationMinutes == null) {
    return null;
  }
  return new Date(checkout.paidAt).getTime() + checkout.durationMinutes * 60_000;
}

export function isActivePaidSession(
  item: ParkingAssistHistoryItem,
  nowMs: number = Date.now(),
): boolean {
  const checkout = item.latestCheckout;
  if (checkout?.status !== 'paid') {
    return false;
  }
  const expiresAtMs = getPaidSessionExpiresAtMs(checkout);
  return expiresAtMs != null && nowMs < expiresAtMs;
}

export function isExpiredPaidSession(
  item: ParkingAssistHistoryItem,
  nowMs: number = Date.now(),
): boolean {
  const checkout = item.latestCheckout;
  if (checkout?.status !== 'paid') {
    return false;
  }
  const expiresAtMs = getPaidSessionExpiresAtMs(checkout);
  return expiresAtMs != null && nowMs >= expiresAtMs;
}

export function partitionParkingHistoryItems(
  items: ParkingAssistHistoryItem[],
  nowMs: number = Date.now(),
): { activeItems: ParkingAssistHistoryItem[]; recentItems: ParkingAssistHistoryItem[] } {
  const activeItems = items.filter(item => isActivePaidSession(item, nowMs));
  const activeIds = new Set(activeItems.map(item => item.session.id));
  const recentItems = items.filter(item => !activeIds.has(item.session.id));
  return { activeItems, recentItems };
}

export function formatParkingTimeRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
