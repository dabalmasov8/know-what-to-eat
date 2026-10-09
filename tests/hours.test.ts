import { describe, expect, it } from 'vitest';
import { isOpenNow } from '../src/lib/hours';

const daily = Array.from({ length: 7 }, (_, d) => ({ open: { day: d, hour: 11, minute: 0 }, close: { day: d, hour: 22, minute: 0 } }));
// 2026-10-07 is a Wednesday. UTC offset 120 => local = UTC+2
const at = (iso: string) => Date.parse(iso);

describe('isOpenNow', () => {
  it('open within hours (applies utc offset)', () => {
    expect(isOpenNow(daily, 120, at('2026-10-07T10:00:00Z'))).toBe(true); // 12:00 local
    expect(isOpenNow(daily, 120, at('2026-10-07T08:30:00Z'))).toBe(false); // 10:30 local
    expect(isOpenNow(daily, 120, at('2026-10-07T20:30:00Z'))).toBe(false); // 22:30 local
  });
  it('handles 24/7 and overnight periods', () => {
    expect(isOpenNow([{ open: { day: 0, hour: 0, minute: 0 } }], 0, at('2026-10-07T03:00:00Z'))).toBe(true);
    const night = [{ open: { day: 6, hour: 20, minute: 0 }, close: { day: 0, hour: 2, minute: 0 } }];
    expect(isOpenNow(night, 0, at('2026-10-11T01:00:00Z'))).toBe(true); // Sunday 01:00
    expect(isOpenNow(night, 0, at('2026-10-11T03:00:00Z'))).toBe(false);
  });
  it('week wrap: Saturday night to Sunday', () => {
    const p = [{ open: { day: 6, hour: 22, minute: 0 }, close: { day: 0, hour: 3, minute: 0 } }];
    expect(isOpenNow(p, 0, at('2026-10-10T23:00:00Z'))).toBe(true); // Saturday 23:00
  });
  it('unknown without data', () => {
    expect(isOpenNow(undefined, 0)).toBeUndefined();
    expect(isOpenNow([], 0)).toBeUndefined();
  });
});
