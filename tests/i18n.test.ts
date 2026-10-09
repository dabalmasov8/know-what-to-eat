import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import uk from '../src/i18n/uk.json';

describe('i18n dictionaries', () => {
  it('have identical key sets', () => {
    expect(Object.keys(uk).sort()).toEqual(Object.keys(en).sort());
  });
  it('have no empty values', () => {
    for (const d of [en, uk]) for (const [k, v] of Object.entries(d)) expect(v, k).not.toBe('');
  });
});
