export type Mode = 'dine_in' | 'delivery';

export interface Settings {
  id: 'main';
  language: 'en' | 'uk';
  postcode: string;
  country: string;
  radius_km: number;
  mode: Mode;
  names: [string, string];
  rating_delay_hours: number;
}

export interface OpeningPeriod {
  open: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

/** Normalised place as returned by the proxy. */
export interface RawPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  ratingCount?: number;
  website?: string;
  phone?: string;
  mapsUri?: string;
  primaryType?: string;
  types: string[];
  summary?: string;
  periods?: OpeningPeriod[];
  utcOffsetMinutes?: number;
}

export interface Place {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  rating_count: number;
  website?: string;
  phone?: string;
  maps_uri?: string;
  primary_type?: string;
  cuisine: string; // cuisine id, or 'unknown'
  periods?: OpeningPeriod[];
  utc_offset_minutes?: number;
  cached_at: number;
}

export interface AreaStats {
  found: number;
  qualified: number;
  known_cuisine: number;
  unknown_cuisine: number;
  api_calls: number;
}

export interface Area {
  id: 'current';
  postcode: string;
  country: string;
  radius_km: number;
  lat: number;
  lng: number;
  fetched_at: number;
  place_ids: string[];
  stats: AreaStats;
}

export type Answers = Record<string, boolean>;

export interface Session {
  id: string;
  created_at: number;
  answers: { a: Answers; b: Answers };
  result_cuisine: string | null;
  result_type: 'match' | 'wheel' | null;
}

export interface Visit {
  id: string;
  place_id: string;
  place_name: string; // snapshot so history survives cache expiry
  cuisine: string;
  session_id: string | null;
  type: Mode;
  created_at: number;
  rated: boolean;
  skipped: boolean;
}

export interface Rating {
  visit_id: string;
  place_id: string;
  scoreA: number;
  scoreB: number;
  avg: number;
  created_at: number;
}
