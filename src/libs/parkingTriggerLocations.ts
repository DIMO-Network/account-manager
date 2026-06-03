import type { ParkingAssistHistoryItem } from '@/types/parking-assist';
import { getHumanReadableLocationString } from '@/libs/mapboxGeocoding';

import 'server-only';

function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(6)}:${lng.toFixed(6)}`;
}

function formatCoordinateFallback(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export async function resolveTriggerLocationsBySessionId(
  items: ParkingAssistHistoryItem[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const sessionsByCoord = new Map<string, { lat: number; lng: number; sessionIds: string[] }>();

  for (const item of items) {
    const { triggerLatitude: lat, triggerLongitude: lng } = item.session;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const key = coordKey(lat, lng);
    const existing = sessionsByCoord.get(key);
    if (existing) {
      existing.sessionIds.push(item.session.id);
    } else {
      sessionsByCoord.set(key, { lat, lng, sessionIds: [item.session.id] });
    }
  }

  await Promise.all(
    [...sessionsByCoord.values()].map(async ({ lat, lng, sessionIds }) => {
      const readable = await getHumanReadableLocationString(lat, lng);
      const label = readable ?? formatCoordinateFallback(lat, lng);
      for (const sessionId of sessionIds) {
        result.set(sessionId, label);
      }
    }),
  );

  return result;
}
