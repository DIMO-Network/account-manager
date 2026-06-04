'use client';

import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';
import { formatParkingTimeRemaining } from '@/utils/parkingSessionExpiry';

type ParkingSessionCountdownProps = {
  expiresAtMs: number;
};

const tickListeners = new Set<() => void>();
let tickIntervalId: ReturnType<typeof setInterval> | null = null;

function subscribeTick(onStoreChange: () => void) {
  tickListeners.add(onStoreChange);
  if (!tickIntervalId) {
    tickIntervalId = setInterval(() => {
      tickListeners.forEach(listener => listener());
    }, 1000);
  }
  return () => {
    tickListeners.delete(onStoreChange);
    if (tickListeners.size === 0 && tickIntervalId) {
      clearInterval(tickIntervalId);
      tickIntervalId = null;
    }
  };
}

function getRemainingMs(expiresAtMs: number) {
  return Math.max(0, expiresAtMs - Date.now());
}

export function ParkingSessionCountdown({ expiresAtMs }: ParkingSessionCountdownProps) {
  const t = useTranslations('Parking');
  const remainingMs = useSyncExternalStore(
    subscribeTick,
    () => getRemainingMs(expiresAtMs),
    () => getRemainingMs(expiresAtMs),
  );

  if (remainingMs <= 0) {
    return null;
  }

  return (
    <p className="text-xs text-green-500 mt-1">
      {t('parking_time_remaining', { time: formatParkingTimeRemaining(remainingMs) })}
    </p>
  );
}
