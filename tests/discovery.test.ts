import { describe, expect, it } from 'vitest';
import { computeStats, cuisineCounts, isStale, qualifies, toPlace } from '../src/lib/discovery';
import { MIN_RATING, MIN_REVIEWS } from '../src/lib/constants';
import type { RawPlace } from '../src/lib/types';

const center = { lat: 52.2297, lng: 21.0122 };
const base: RawPlace = { id: 'a', name: 'A', address: '', lat: center.lat, lng: center.lng, rating: 4.6, ratingCount: 100, types: [] };

describe('quality filter', () => {
  it('uses the fixed constants', () => {
    expect(MIN_RATING).toBe(4.5);
    expect(MIN_REVIEWS).toBe(30);
  });
  it('accepts the boundary values', () => {
    expect(qualifies({ ...base, rating: 4.5, ratingCount: 30 }, center, 2)).toBe(true);
  });
  it('rejects low rating, few reviews and missing data', () => {
    expect(qualifies({ ...base, rating: 4.4 }, center, 2)).toBe(false);
    expect(qualifies({ ...base, ratingCount: 29 }, center, 2)).toBe(false);
    expect(qualifies({ ...base, rating: 5, ratingCount: 3 }, center, 2)).toBe(false);
    expect(qualifies({ ...base, rating: undefined }, center, 2)).toBe(false);
    expect(qualifies({ ...base, ratingCount: undefined }, center, 2)).toBe(false);
  });
  it('enforces the radius (bounding box corners are outside the circle)', () => {
    const corner = { ...base, lat: center.lat + 1.9 / 111.32, lng: center.lng + 1.9 / (111.32 * Math.cos((center.lat * Math.PI) / 180)) };
    expect(qualifies(corner, center, 2)).toBe(false); // ~2.7 km away
    expect(qualifies(corner, center, 3)).toBe(true);
  });
});

describe('stats and counts', () => {
  it('counts cuisines and unknowns', () => {
    const mk = (id: string, name: string, primaryType?: string) => toPlace({ ...base, id, name, primaryType }, 0);
    const places = [mk('1', 'x', 'thai_restaurant'), mk('2', 'y', 'thai_restaurant'), mk('3', 'z', 'pizza_restaurant'), mk('4', 'Nothing')];
    expect(cuisineCounts(places)).toEqual([{ id: 'thai', count: 2 }, { id: 'pizza', count: 1 }]);
    expect(computeStats(9, places, 3)).toEqual({ found: 9, qualified: 4, known_cuisine: 3, unknown_cuisine: 1, api_calls: 3 });
  });
  it('forced cuisine only fills unknowns', () => {
    expect(toPlace({ ...base, name: 'Mystery' }, 0, 'georgian').cuisine).toBe('georgian');
    expect(toPlace({ ...base, name: 'Mystery', primaryType: 'thai_restaurant' }, 0, 'georgian').cuisine).toBe('thai');
  });
  it('staleness after 7 days', () => {
    const area = { fetched_at: 0 } as never;
    expect(isStale(area, 6 * 86400000)).toBe(false);
    expect(isStale(area, 8 * 86400000)).toBe(true);
    expect(isStale(undefined)).toBe(true);
  });
});
