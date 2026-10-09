import { describe, expect, it } from 'vitest';
import { handle, memoryStore, type Deps, type Env } from '../server/core';
import { mockFetch } from '../server/dev/mock';
import { SEARCH_TEXT_URL } from '../server/google';

const env: Env = { GOOGLE_API_KEY: 'test-key-123', APP_PASSCODE: 'sesame', DAILY_CAP: '6', RATE_LIMIT_PER_MIN: '5' };

function setup(overrides: Partial<Deps> = {}, e: Env = env) {
  let t = Date.parse('2026-10-09T12:00:00Z');
  const calls: { url: string; init?: RequestInit }[] = [];
  const deps: Deps = {
    store: memoryStore(() => t),
    now: () => t,
    fetch: async (i, init) => {
      calls.push({ url: String(i instanceof Request ? i.url : i), init });
      return mockFetch(i, init);
    },
    ...overrides,
  };
  const call = (path: string, body: unknown, headers: Record<string, string> = { 'x-passcode': 'sesame' }, ip = '1.1.1.1') =>
    handle(new Request('http://x' + path, { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': ip, ...headers } }), e, deps);
  return { call, calls, advance: (ms: number) => (t += ms), deps };
}
const places = { lat: 52.2297, lng: 21.0122, radiusKm: 5 };

describe('proxy auth', () => {
  it('rejects missing and wrong passcode without calling Google', async () => {
    const { call, calls } = setup();
    expect((await call('/api/places', places, {})).status).toBe(401);
    expect((await call('/api/places', places, { 'x-passcode': 'nope' })).status).toBe(401);
    expect(calls).toHaveLength(0);
  });
  it('fails closed when no passcode or key is configured', async () => {
    expect((await setup({}, { GOOGLE_API_KEY: 'k' }).call('/api/places', places)).status).toBe(503);
    expect((await setup({}, { APP_PASSCODE: 'p' }).call('/api/places', places, { 'x-passcode': 'p' })).status).toBe(503);
  });
  it('does not count a missing passcode towards the lockout', async () => {
    const { call } = setup({}, { ...env, RATE_LIMIT_PER_MIN: '1000' });
    for (let i = 0; i < 15; i++) expect((await call('/api/places', places, {})).status).toBe(401);
    expect((await call('/api/geocode', { postcode: '00-001', country: 'PL' })).status).toBe(200);
  });
  it('locks an IP after 10 wrong attempts', async () => {
    const { call } = setup({}, { ...env, RATE_LIMIT_PER_MIN: '1000' });
    for (let i = 0; i < 10; i++) await call('/api/places', places, { 'x-passcode': 'bad' + i });
    const r = await call('/api/places', places, { 'x-passcode': 'sesame' });
    expect(r.status).toBe(429);
    expect((await r.json()).error).toBe('locked');
  });
});

describe('proxy rate limit and cap', () => {
  it('limits requests per IP per minute, per IP', async () => {
    const { call, advance } = setup();
    for (let i = 0; i < 5; i++) expect((await call('/api/geocode', { postcode: '00-001', country: 'PL' })).status).toBe(200);
    expect((await call('/api/geocode', { postcode: '00-001', country: 'PL' })).status).toBe(429);
    expect((await call('/api/geocode', { postcode: '00-001', country: 'PL' }, undefined, '2.2.2.2')).status).toBe(200);
    advance(61000);
    expect((await call('/api/geocode', { postcode: '00-001', country: 'PL' })).status).toBe(200);
  });
  it('enforces the daily cap on Google calls and resets next day', async () => {
    const { call, calls, advance } = setup({}, { ...env, RATE_LIMIT_PER_MIN: '1000', DAILY_CAP: '3' });
    expect((await call('/api/places', { ...places, query: 'a1' })).status).toBe(200); // 3 pages = 3 calls (45 fixtures > 40)
    const used = calls.length;
    expect(used).toBeLessThanOrEqual(3);
    const r = await call('/api/places', { ...places, query: 'a2' });
    if (used === 3) {
      expect(r.status).toBe(429);
      expect((await r.json()).error).toBe('daily_cap');
    }
    advance(25 * 3600 * 1000);
    expect((await call('/api/places', { ...places, query: 'a3' })).status).toBe(200);
  });
  it('stops mid-pagination at the cap and flags truncation', async () => {
    const { call } = setup({}, { ...env, RATE_LIMIT_PER_MIN: '1000', DAILY_CAP: '1' });
    const r = await call('/api/places', places);
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.pages).toBe(1);
    expect(body.truncated).toBe(true);
  });
});

describe('proxy behaviour', () => {
  it('paginates up to 3 pages and sends key + field mask only to Google', async () => {
    const { call, calls } = setup({}, { ...env, RATE_LIMIT_PER_MIN: '1000', DAILY_CAP: '100' });
    const body = await (await call('/api/places', places)).json();
    expect(body.pages).toBeGreaterThanOrEqual(2);
    expect(body.places.length).toBeGreaterThan(20);
    const first = calls[0];
    expect(first.url).toBe(SEARCH_TEXT_URL);
    const h = first.init!.headers as Record<string, string>;
    expect(h['X-Goog-Api-Key']).toBe('test-key-123');
    expect(h['X-Goog-FieldMask']).toContain('places.userRatingCount');
    const sent = JSON.parse(String(first.init!.body));
    expect(sent.minRating).toBe(4.5);
    expect(sent.locationRestriction.rectangle).toBeDefined();
    expect(JSON.stringify(body)).not.toContain('test-key-123');
  });
  it('caches identical requests (no second Google call)', async () => {
    const { call, calls } = setup({}, { ...env, RATE_LIMIT_PER_MIN: '1000', DAILY_CAP: '100' });
    await call('/api/geocode', { postcode: '00-001', country: 'PL' });
    await call('/api/geocode', { postcode: '00-001', country: 'PL' });
    expect(calls).toHaveLength(1);
  });
  it('validates input', async () => {
    const { call } = setup({}, { ...env, RATE_LIMIT_PER_MIN: '1000' });
    expect((await call('/api/places', { ...places, radiusKm: 50 })).status).toBe(400);
    expect((await call('/api/places', { ...places, lat: 'x' })).status).toBe(400);
    expect((await call('/api/geocode', { postcode: 'x', country: 'PL' })).status).toBe(400);
    expect((await call('/api/geocode', { postcode: '00-001', country: 'poland' })).status).toBe(400);
  });
  it('maps unknown postcode to 404 and hides upstream errors', async () => {
    const { call } = setup({}, { ...env, RATE_LIMIT_PER_MIN: '1000' });
    const r = await call('/api/geocode', { postcode: '99-999', country: 'PL' });
    expect(r.status).toBe(404);
    const { call: bad } = setup({ fetch: async () => { throw new Error('boom key=test-key-123'); } }, { ...env, RATE_LIMIT_PER_MIN: '1000' });
    const r2 = await bad('/api/geocode', { postcode: '00-002', country: 'PL' });
    expect(r2.status).toBe(500);
    expect(await r2.text()).not.toContain('test-key-123');
  });
});
