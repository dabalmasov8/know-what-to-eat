import type { RawPlace } from './types';

const PASS_KEY = 'fp.passcode';

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

export function getPasscode(): string {
  try {
    return localStorage.getItem(PASS_KEY) ?? '';
  } catch {
    return '';
  }
}
export function setPasscode(v: string) {
  try {
    localStorage.setItem(PASS_KEY, v);
  } catch {
    /* ignore */
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-passcode': getPasscode() },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('network', 0);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? 'http_' + res.status, res.status);
  if (!res.headers.get('content-type')?.includes('json')) throw new ApiError('bad_response', res.status);
  return data as T;
}

export const geocodePostcode = (postcode: string, country: string) =>
  post<{ lat: number; lng: number; formatted: string }>('/api/geocode', { postcode, country });

export const searchPlaces = (args: { lat: number; lng: number; radiusKm: number; query?: string; maxPages?: number }) =>
  post<{ places: RawPlace[]; pages: number; truncated: boolean }>('/api/places', args);
