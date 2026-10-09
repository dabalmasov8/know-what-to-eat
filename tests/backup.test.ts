import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/db';
import { buildBackup, parseBackup, restoreBackup } from '../src/lib/backup';

const settings = { id: 'main' as const, language: 'uk' as const, postcode: '00-001', country: 'PL', radius_km: 3, mode: 'delivery' as const, names: ['A', 'B'] as [string, string], rating_delay_hours: 2 };
const visit = { id: 'v1', place_id: 'p1', place_name: 'Place', cuisine: 'thai', session_id: null, type: 'dine_in' as const, created_at: 5, rated: true, skipped: false };
const rating = { visit_id: 'v1', place_id: 'p1', scoreA: 5, scoreB: 4, avg: 4.5, created_at: 6 };

describe('backup', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
  it('round-trips and excludes Google place content', async () => {
    await db.settings.put(settings);
    await db.visits.put(visit);
    await db.ratings.put(rating);
    await db.places.put({ google_place_id: 'p1', name: 'Place', address: '', lat: 0, lng: 0, rating: 4.6, rating_count: 50, cuisine: 'thai', cached_at: 0 });
    const text = JSON.stringify(await buildBackup());
    expect(text).not.toContain('rating_count');
    await Promise.all(db.tables.map((t) => t.clear()));
    await restoreBackup(parseBackup(text));
    expect(await db.settings.get('main')).toEqual(settings);
    expect(await db.visits.toArray()).toEqual([visit]);
    expect(await db.ratings.toArray()).toEqual([rating]);
    expect(await db.places.count()).toBe(0);
  });
  it('rejects bad files', () => {
    expect(() => parseBackup('nope')).toThrow('not_json');
    expect(() => parseBackup('{"app":"other"}')).toThrow('wrong_file');
    expect(() => parseBackup(JSON.stringify({ app: 'food-picker', version: 1, settings: null, sessions: [], visits: [{ id: 1 }], ratings: [] }))).toThrow('bad_visits');
    expect(() => parseBackup(JSON.stringify({ app: 'food-picker', version: 1, settings: { id: 'x' }, sessions: [], visits: [], ratings: [] }))).toThrow('bad_settings');
  });
});
