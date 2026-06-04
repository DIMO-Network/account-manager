'use client';

import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';
import { COLORS, RESPONSIVE } from '@/utils/designSystem';
import { formatParkingTimeRemaining } from '@/utils/parkingSessionExpiry';

const PAID_DURATION_VALUE_STYLE = 'font-medium text-base leading-5 text-green-500';
const EXPIRED_VALUE_STYLE = 'font-medium text-base leading-5 text-text-secondary';
const HINT_STYLE = `${COLORS.text.secondary} leading-relaxed ${RESPONSIVE.text.body}`;

type ParkingSessionPaidDurationStatusProps = {
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

export function ParkingSessionPaidDurationStatus({ expiresAtMs }: ParkingSessionPaidDurationStatusProps) {
  const t = useTranslations('Parking');
  const remainingMs = useSyncExternalStore(
    subscribeTick,
    () => getRemainingMs(expiresAtMs),
    () => getRemainingMs(expiresAtMs),
  );

  if (remainingMs > 0) {
    return (
      <div className="leading-relaxed">
        <p className={PAID_DURATION_VALUE_STYLE}>{t('parking_session_active')}</p>
        <p className={PAID_DURATION_VALUE_STYLE}>
          {t('parking_time_remaining', { time: formatParkingTimeRemaining(remainingMs) })}
        </p>
        <p className={`${HINT_STYLE} mt-2`}>{t('parking_session_active_hint')}</p>
      </div>
    );
  }

  return (
    <div className="leading-relaxed">
      <p className={EXPIRED_VALUE_STYLE}>{t('parking_session_expired')}</p>
      <p className={`${HINT_STYLE} mt-2`}>{t('parking_session_expired_hint')}</p>
    </div>
  );
}
