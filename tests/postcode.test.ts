import { describe, expect, it } from 'vitest';
import { formatPostcode, isValidPostcode } from '../src/lib/postcode';

describe('postcode validation', () => {
  it('accepts NN-NNN for PL', () => {
    expect(isValidPostcode('00-001', 'PL')).toBe(true);
    expect(isValidPostcode(' 02-495 ', 'PL')).toBe(true);
  });
  it('rejects bad PL postcodes', () => {
    for (const v of ['00001', '0-0001', '00-0011', 'ab-cde', '', '00 001']) expect(isValidPostcode(v, 'PL')).toBe(false);
  });
  it('supports other countries', () => {
    expect(isValidPostcode('10115', 'DE')).toBe(true);
    expect(isValidPostcode('SW1A 1AA', 'GB')).toBe(true);
    expect(isValidPostcode('10-115', 'DE')).toBe(false);
  });
  it('auto-formats PL while typing', () => {
    expect(formatPostcode('00001', 'PL')).toBe('00-001');
    expect(formatPostcode('0', 'PL')).toBe('0');
    expect(formatPostcode('00-0012345', 'PL')).toBe('00-001');
  });
});
