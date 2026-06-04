'use client';

import { useHydrated } from '@/hooks/useHydrated';
import { formatParkingSessionDateTime } from './parkingDateTime';

type ParkingLocalDateTimeProps = {
  iso: string;
  locale: string;
  className?: string;
};

export function ParkingLocalDateTime({ iso, locale, className }: ParkingLocalDateTimeProps) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <span
        className={`inline-block h-5 min-w-[9rem] animate-pulse rounded bg-gray-900 ${className ?? ''}`}
        aria-hidden
      />
    );
  }

  return (
    <span className={className}>
      {formatParkingSessionDateTime(iso, locale)}
    </span>
  );
}
