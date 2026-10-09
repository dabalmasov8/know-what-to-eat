// Cloudflare Worker entry: /api/* is handled here, everything else is served from the static assets binding.
import { handle, type Env, type Store } from './core';

interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}
interface WorkerEnv extends Env {
  STATE: KV;
  ASSETS: { fetch(req: Request): Promise<Response> };
}

/** KV is eventually consistent and has no atomic increment: fine for a personal-use limiter. */
function kvStore(kv: KV): Store {
  return {
    async incr(key, ttl) {
      const n = Number((await kv.get(key)) ?? 0) + 1;
      await kv.put(key, String(n), { expirationTtl: Math.max(60, ttl) });
      return n;
    },
    get: (key) => kv.get(key),
    put: (key, value, ttl) => kv.put(key, value, { expirationTtl: Math.max(60, ttl) }),
  };
}

export default {
  async fetch(req: Request, env: WorkerEnv): Promise<Response> {
    if (new URL(req.url).pathname.startsWith('/api/')) {
      return handle(req, env, { store: kvStore(env.STATE), fetch: (i, init) => fetch(i, init), now: Date.now });
    }
    return env.ASSETS.fetch(req);
  },
};
