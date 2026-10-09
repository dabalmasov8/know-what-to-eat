import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const read = (p: string) => readFileSync(p, 'utf8');

describe('product policies', () => {
  const clientFiles = [...walk('src'), 'index.html'];
  it('is light-theme only', () => {
    for (const f of clientFiles.filter((f) => /\.(css|tsx?|html)$/.test(f))) {
      expect(read(f), f).not.toMatch(/prefers-color-scheme/);
    }
    expect(read('index.html')).toContain('<meta name="color-scheme" content="light"');
    expect(read('src/styles.css')).toContain('color-scheme: light');
  });
  it('keeps the API key out of the client source', () => {
    for (const f of clientFiles) {
      expect(read(f), f).not.toMatch(/GOOGLE_API_KEY|AIza[0-9A-Za-z_-]{20,}|import\.meta\.env/);
    }
  });
  it('keeps the API key out of the production bundle', () => {
    if (!existsSync('dist')) return;
    for (const f of walk('dist').filter((f) => /\.(js|html|css|webmanifest)$/.test(f))) {
      expect(read(f), f).not.toMatch(/GOOGLE_API_KEY|AIza[0-9A-Za-z_-]{20,}/);
    }
  });
  it('has no real secrets in .env.example', () => {
    const ex = read('.env.example');
    expect(ex).toContain('GOOGLE_API_KEY=your-google-api-key-here');
    expect(ex).not.toMatch(/AIza/);
  });
  it('mock Google is never imported from production entry points', () => {
    expect(read('server/worker.ts')).not.toMatch(/mock/i);
    expect(read('server/core.ts')).not.toMatch(/mock/i);
    for (const f of clientFiles.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))) expect(read(f), f).not.toMatch(/dev\/mock/);
  });
});
