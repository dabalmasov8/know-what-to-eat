import { db } from '../db';
import { MIN_RATING, MIN_REVIEWS, PLACE_CACHE_DAYS } from './constants';
import { CUISINE_BY_ID, deriveCuisine, UNKNOWN } from './cuisine';
import { distanceKm } from './geo';
import { geocodePostcode, searchPlaces } from './api';
import type { Area, AreaStats, Place, RawPlace, Settings } from './types';

/** The fixed quality filter. Also enforces the radius, since Text Search only restricts to a bounding box. */
export function qualifies(p: RawPlace, center: { lat: number; lng: number }, radiusKm: number): boolean {
  return (
    (p.rating ?? 0) >= MIN_RATING &&
    (p.ratingCount ?? 0) >= MIN_REVIEWS &&
    distanceKm(center.lat, center.lng, p.lat, p.lng) <= radiusKm
  );
}

export function toPlace(p: RawPlace, now: number, forcedCuisine?: string): Place {
  const derived = deriveCuisine(p);
  return {
    google_place_id: p.id,
    name: p.name,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    rating: p.rating!,
    rating_count: p.ratingCount!,
    website: p.website,
    phone: p.phone,
    maps_uri: p.mapsUri,
    primary_type: p.primaryType,
    cuisine: derived === UNKNOWN && forcedCuisine ? forcedCuisine : derived,
    periods: p.periods,
    utc_offset_minutes: p.utcOffsetMinutes,
    cached_at: now,
  };
}

export function computeStats(found: number, places: Place[], apiCalls: number): AreaStats {
  const unknown = places.filter((p) => p.cuisine === UNKNOWN).length;
  return { found, qualified: places.length, known_cuisine: places.length - unknown, unknown_cuisine: unknown, api_calls: apiCalls };
}

export function cuisineCounts(places: Place[]): { id: string; count: number }[] {
  const m = new Map<string, number>();
  for (const p of places) if (p.cuisine !== UNKNOWN) m.set(p.cuisine, (m.get(p.cuisine) ?? 0) + 1);
  return [...m.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

export function isStale(a: Area | undefined, now = Date.now()): boolean {
  return !a || now - a.fetched_at > PLACE_CACHE_DAYS * 86400000;
}

/** Full discovery: geocode, search (up to 3 pages), filter, derive cuisine, store area + places. */
export async function discoverArea(s: Settings, onStep?: (step: 'geocode' | 'search') => void): Promise<Area> {
  onStep?.('geocode');
  const geo = await geocodePostcode(s.postcode, s.country);
  onStep?.('search');
  const res = await searchPlaces({ lat: geo.lat, lng: geo.lng, radiusKm: s.radius_km });
  const now = Date.now();
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const p of res.places) {
    if (seen.has(p.id) || !qualifies(p, geo, s.radius_km)) continue;
    seen.add(p.id);
    places.push(toPlace(p, now));
  }
  const area: Area = {
    id: 'current',
    postcode: s.postcode,
    country: s.country,
    radius_km: s.radius_km,
    lat: geo.lat,
    lng: geo.lng,
    fetched_at: now,
    place_ids: places.map((p) => p.google_place_id),
    stats: computeStats(res.places.length, places, 1 + res.pages),
  };
  await db.transaction('rw', db.places, db.area, async () => {
    await db.places.clear();
    await db.places.bulkPut(places);
    await db.area.put(area);
  });
  return area;
}

/** One extra targeted call for a cuisine, merged into the cache. */
export async function searchCuisine(cuisineId: string): Promise<{ area: Area; added: number }> {
  const area = await db.area.get('current');
  if (!area) throw new Error('no area');
  const def = CUISINE_BY_ID[cuisineId];
  const res = await searchPlaces({ lat: area.lat, lng: area.lng, radiusKm: area.radius_km, query: `${def.search} restaurant`, maxPages: 1 });
  const now = Date.now();
  const have = new Set(area.place_ids);
  const fresh: Place[] = [];
  for (const p of res.places) {
    if (!qualifies(p, area, area.radius_km)) continue;
    if (have.has(p.id)) {
      const existing = await db.places.get(p.id);
      if (existing && existing.cuisine === UNKNOWN) await db.places.update(p.id, { cuisine: cuisineId });
      continue;
    }
    have.add(p.id);
    fresh.push(toPlace(p, now, cuisineId));
  }
  await db.places.bulkPut(fresh);
  const all = await db.places.bulkGet([...have]);
  const places = all.filter((p): p is Place => !!p);
  const next: Area = {
    ...area,
    place_ids: [...have],
    stats: computeStats(area.stats.found + res.places.length, places, area.stats.api_calls + res.pages),
  };
  await db.area.put(next);
  return { area: next, added: fresh.length };
}

export async function loadAreaPlaces(): Promise<Place[]> {
  const area = await db.area.get('current');
  if (!area) return [];
  return (await db.places.bulkGet(area.place_ids)).filter((p): p is Place => !!p);
}
