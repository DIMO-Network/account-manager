export const PARKING_SESSION_DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

/** Format in the runtime's local timezone (use only in the browser). */
export function formatParkingSessionDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, PARKING_SESSION_DATETIME_FORMAT);
}
