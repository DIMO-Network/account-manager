import { describe, expect, it } from 'vitest';
import { hasZoneCode, normalizeZoneCode } from './zone-code';

describe('normalizeZoneCode', () => {
  it('returns null for empty input', () => {
    expect(normalizeZoneCode(null)).toBeNull();
    expect(normalizeZoneCode('')).toBeNull();
    expect(normalizeZoneCode('   ')).toBeNull();
  });

  it('trims, strips spaces, and uppercases', () => {
    expect(normalizeZoneCode('zone 12')).toBe('ZONE12');
    expect(normalizeZoneCode(' 12345 ')).toBe('12345');
  });

  it('rejects invalid characters and overlong codes', () => {
    expect(normalizeZoneCode('zone_12')).toBeNull();
    expect(normalizeZoneCode('a'.repeat(33))).toBeNull();
  });
});

describe('hasZoneCode', () => {
  it('matches normalizeZoneCode', () => {
    expect(hasZoneCode('ZONE12')).toBe(true);
    expect(hasZoneCode('')).toBe(false);
  });
});
