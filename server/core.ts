import { MAX_PAGES, MAX_RADIUS_KM, MIN_RADIUS_KM } from '../src/lib/constants';
import type { RawPlace } from '../src/lib/types';
import { geocode, GoogleError, searchTextPage } from './google';

export interface Env {
  GOOGLE_API_KEY?: string;
  APP_PASSCODE?: string;
  DAILY_CAP?: string;
  RATE_LIMIT_PER_MIN?: string;
}

/** Minimal key-value store: in-memory for Node/tests, KV on Cloudflare. */
export interface Store {
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttlSeconds: number): Promise<void>;
}

export interface Deps {
  store: Store;
  fetch: typeof fetch;
  now: () => number;
}

export function memoryStore(now: () => number = Date.now): Store {
  const m = new Map<string, { v: string; exp: number }>();
  const live = (k: string) => {
    const e = m.get(k);
    if (e && e.exp > now()) return e;
    m.delete(k);
    return undefined;
  };
  return {
    async incr(key, ttl) {
      const e = live(key);
      const n = (e ? Number(e.v) : 0) + 1;
      m.set(key, { v: String(n), exp: e ? e.exp : now() + ttl * 1000 });
      return n;
    },
    async get(key) {
      return live(key)?.v ?? null;
    },
    async put(key, value, ttl) {
      m.set(key, { v: value, exp: now() + ttl * 1000 });
    },
  };
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
const fail = (error: string, status: number) => json({ error }, status);

function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export async function handle(req: Request, env: Env, deps: Deps): Promise<Response> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/api/')) return fail('not_found', 404);
  if (url.pathname === '/api/health') return json({ ok: true });
  if (req.method !== 'POST') return fail('method_not_allowed', 405);

  const { store, now } = deps;
  const ip = clientIp(req);

  // 1. Per-IP rate limit (applies before auth so brute force and floods are throttled).
  const limit = Number(env.RATE_LIMIT_PER_MIN ?? 30);
  const minute = Math.floor(now() / 60000);
  if ((await store.incr(`rl:${ip}:${minute}`, 120)) > limit) return fail('rate_limited', 429);

  // 2. Shared passcode. Fails closed if the server has none configured.
  const expected = env.APP_PASSCODE;
  if (!expected) return fail('server_not_configured', 503);
  if ((await store.get(`lock:${ip}`)) === '1') return fail('locked', 429);
  const given = req.headers.get('x-passcode') ?? '';
  if (!safeEqual(given, expected)) {
    if ((await store.incr(`af:${ip}`, 900)) >= 10) await store.put(`lock:${ip}`, '1', 900);
    return fail('unauthorized', 401);
  }

  const key = env.GOOGLE_API_KEY;
  if (!key) return fail('server_not_configured', 503);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail('bad_json', 400);
  }

  const cap = Number(env.DAILY_CAP ?? 200);
  const day = new Date(now()).toISOString().slice(0, 10);
  /** Counts one Google call against the daily cap; false when the cap is exhausted. */
  const spend = async () => (await store.incr(`cap:${day}`, 172800)) <= cap;

  const cached = async <T>(cacheKey: string, produce: () => Promise<T>): Promise<T> => {
    const hit = await store.get(`c:${cacheKey}`);
    if (hit) return JSON.parse(hit) as T;
    const v = await produce();
    await store.put(`c:${cacheKey}`, JSON.stringify(v), 600);
    return v;
  };

  try {
    if (url.pathname === '/api/geocode') {
      const { postcode, country } = body;
      if (typeof postcode !== 'string' || postcode.length < 3 || postcode.length > 12) return fail('bad_postcode', 400);
      if (typeof country !== 'string' || !/^[A-Z]{2}$/.test(country)) return fail('bad_country', 400);
      const result = await cached(`geo:${country}:${postcode}`, async () => {
        if (!(await spend())) throw new GoogleError('daily_cap', 429);
        return geocode(deps.fetch, key, postcode, country);
      });
      return json(result);
    }

    if (url.pathname === '/api/places') {
      const { lat, lng, radiusKm } = body;
      const query = typeof body.query === 'string' ? body.query.trim() : 'restaurants';
      const maxPages = Math.min(MAX_PAGES, Math.max(1, Math.floor(Number(body.maxPages ?? MAX_PAGES))));
      if (!isNum(lat) || !isNum(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail('bad_location', 400);
      if (!isNum(radiusKm) || radiusKm < MIN_RADIUS_KM || radiusKm > MAX_RADIUS_KM) return fail('bad_radius', 400);
      if (query.length < 2 || query.length > 60) return fail('bad_query', 400);

      const result = await cached(`pl:${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusKm}:${query}:${maxPages}`, async () => {
        const places: RawPlace[] = [];
        let pages = 0;
        let truncated = false;
        let pageToken: string | undefined;
        while (pages < maxPages) {
          if (!(await spend())) {
            if (pages === 0) throw new GoogleError('daily_cap', 429);
            truncated = true;
            break;
          }
          const page = await searchTextPage(deps.fetch, key, { lat, lng, radiusKm, query, pageToken });
          pages++;
          places.push(...page.places);
          pageToken = page.nextPageToken;
          if (!pageToken) break;
        }
        return { places, pages, truncated };
      });
      return json(result);
    }
  } catch (e) {
    if (e instanceof GoogleError) return fail(e.code, e.status);
    return fail('internal_error', 500); // never echo upstream details (they may contain the key in URLs)
  }
  return fail('not_found', 404);
}
