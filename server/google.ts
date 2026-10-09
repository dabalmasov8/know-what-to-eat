import type { OpeningPeriod, RawPlace } from '../src/lib/types';
import { MIN_RATING } from '../src/lib/constants';

export const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
export const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';

/**
 * Field mask: rating, counts, types, website, phone, hours and summary push the request into
 * the Places "Enterprise" SKU. Accepted: discovery runs once per area, not per session.
 */
export const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.primaryType',
  'places.types',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.googleMapsUri',
  'places.editorialSummary',
  'places.regularOpeningHours',
  'places.utcOffsetMinutes',
  'nextPageToken',
].join(',');

interface GPlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  types?: string[];
  websiteUri?: string;
  nationalPhoneNumber?: string;
  googleMapsUri?: string;
  editorialSummary?: { text?: string };
  regularOpeningHours?: { periods?: OpeningPeriod[] };
  utcOffsetMinutes?: number;
}

export function parsePlace(p: GPlace): RawPlace | null {
  if (!p.id || !p.displayName?.text || p.location?.latitude == null || p.location.longitude == null) return null;
  return {
    id: p.id,
    name: p.displayName.text,
    address: p.formattedAddress ?? '',
    lat: p.location.latitude,
    lng: p.location.longitude,
    rating: p.rating,
    ratingCount: p.userRatingCount,
    website: p.websiteUri,
    phone: p.nationalPhoneNumber,
    mapsUri: p.googleMapsUri,
    primaryType: p.primaryType,
    types: p.types ?? [],
    summary: p.editorialSummary?.text,
    periods: p.regularOpeningHours?.periods,
    utcOffsetMinutes: p.utcOffsetMinutes,
  };
}

/** Text Search only supports a rectangle restriction, so we bound the circle and filter by distance client-side. */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const dLat = radiusKm / 111.32;
  const dLng = radiusKm / (111.32 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  return {
    low: { latitude: lat - dLat, longitude: lng - dLng },
    high: { latitude: lat + dLat, longitude: lng + dLng },
  };
}

export class GoogleError extends Error {
  constructor(
    public code: string,
    public status = 502,
  ) {
    super(code);
  }
}

export async function geocode(fetchFn: typeof fetch, key: string, postcode: string, country: string) {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('components', `postal_code:${postcode}|country:${country}`);
  url.searchParams.set('key', key);
  const res = await fetchFn(url);
  if (!res.ok) throw new GoogleError('geocode_http_' + res.status);
  const body = (await res.json()) as {
    status: string;
    results?: { formatted_address?: string; geometry?: { location?: { lat: number; lng: number } } }[];
  };
  if (body.status === 'ZERO_RESULTS') throw new GoogleError('postcode_not_found', 404);
  if (body.status !== 'OK' || !body.results?.[0]?.geometry?.location) throw new GoogleError('geocode_' + body.status.toLowerCase());
  const r = body.results[0];
  return { lat: r.geometry!.location!.lat, lng: r.geometry!.location!.lng, formatted: r.formatted_address ?? postcode };
}

export interface SearchPageResult {
  places: RawPlace[];
  nextPageToken?: string;
}

export async function searchTextPage(
  fetchFn: typeof fetch,
  key: string,
  args: { lat: number; lng: number; radiusKm: number; query: string; pageToken?: string },
): Promise<SearchPageResult> {
  const body: Record<string, unknown> = {
    textQuery: args.query,
    includedType: 'restaurant',
    minRating: MIN_RATING,
    pageSize: 20,
    locationRestriction: { rectangle: boundingBox(args.lat, args.lng, args.radiusKm) },
  };
  if (args.pageToken) body.pageToken = args.pageToken;
  const res = await fetchFn(SEARCH_TEXT_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELD_MASK },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new GoogleError('places_http_' + res.status);
  const json = (await res.json()) as { places?: GPlace[]; nextPageToken?: string };
  const places = (json.places ?? []).map(parsePlace).filter((p): p is RawPlace => p !== null);
  return { places, nextPageToken: json.nextPageToken };
}
