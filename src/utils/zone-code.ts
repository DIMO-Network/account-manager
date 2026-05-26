/** Max length for ParkDetroit zone / space codes (matches dimo-app-backend). */
export const MAX_ZONE_CODE_LENGTH = 32;

const ZONE_CODE_PATTERN = /^[A-Z0-9-]+$/;

/**
 * Normalizes a ParkDetroit zone or space code from signage.
 * Trims, removes whitespace, uppercases. Empty input becomes null.
 */
export function normalizeZoneCode(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const normalized = value.trim().replace(/\s+/g, '').toUpperCase();
  if (!normalized) {
    return null;
  }
  if (normalized.length > MAX_ZONE_CODE_LENGTH) {
    return null;
  }
  if (!ZONE_CODE_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

/** True when normalizeZoneCode would return a non-empty string. */
export function hasZoneCode(value: string | null | undefined): boolean {
  return normalizeZoneCode(value) != null;
}
