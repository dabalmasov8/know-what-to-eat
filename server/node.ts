// Plain Node server: serves ./dist and /api/*. Used for local dev, e2e tests and any Node host.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { handle, memoryStore, type Env } from './core';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

const env: Env & { MOCK_GOOGLE?: string } = { ...process.env };
let googleFetch: typeof fetch = (i, init) => fetch(i, init);
if (env.MOCK_GOOGLE === '1') {
  const { mockFetch } = await import('./dev/mock');
  googleFetch = mockFetch;
  env.GOOGLE_API_KEY ||= 'mock-key';
  env.APP_PASSCODE ||= 'dev';
  console.log('[food-picker] MOCK_GOOGLE=1: using fixtures, passcode "dev" unless APP_PASSCODE is set');
}

const store = memoryStore();
const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    if (!headers.has('x-forwarded-for')) headers.set('x-forwarded-for', req.socket.remoteAddress ?? 'unknown');
    const request = new Request(url, { method: req.method, headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined });
    const r = await handle(request, env, { store, fetch: googleFetch, now: Date.now });
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  let file = normalize(join(root, url.pathname));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(root, 'index.html'); // SPA fallback
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': file.endsWith('sw.js') ? 'no-cache' : 'public, max-age=3600' });
    res.end(data);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`[food-picker] http://localhost:${port}`));
