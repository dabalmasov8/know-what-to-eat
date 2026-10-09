import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import uk from '../src/i18n/uk.json';

describe('i18n dictionaries', () => {
  // Plural forms differ per language (EN: one/other, UK: one/few/many/other), so compare base keys.
  const base = (d: Record<string, string>) => [...new Set(Object.keys(d).map((k) => k.replace(/\.(zero|one|two|few|many|other)$/, '')))].sort();
  it('have identical key sets', () => {
    expect(base(uk)).toEqual(base(en));
  });
  it('define the plural forms each language needs', () => {
    for (const [d, forms] of [[en, ['one', 'other']], [uk, ['one', 'few', 'many', 'other']]] as const) {
      const bases = new Set(Object.keys(d).filter((k) => /\.one$/.test(k)).map((k) => k.replace(/\.[a-z]+$/, '')));
      for (const b of bases) for (const f of forms) expect(d[`${b}.${f}` as keyof typeof d], `${b}.${f}`).toBeDefined();
    }
  });
  it('have no empty values', () => {
    for (const d of [en, uk]) for (const [k, v] of Object.entries(d)) expect(v, k).not.toBe('');
  });
});
