import { describe, expect, it } from 'vitest';
import { deriveCuisine, UNKNOWN } from '../src/lib/cuisine';

const p = (name: string, primaryType?: string, types: string[] = [], summary?: string) => ({ name, primaryType, types, summary });

describe('deriveCuisine', () => {
  it('uses primaryType first', () => {
    expect(deriveCuisine(p('X', 'italian_restaurant', ['restaurant']))).toBe('italian');
    expect(deriveCuisine(p('X', 'sushi_restaurant'))).toBe('japanese');
    expect(deriveCuisine(p('X', 'pizza_restaurant', ['italian_restaurant']))).toBe('pizza');
  });
  it('falls back to other types in order', () => {
    expect(deriveCuisine(p('X', 'restaurant', ['food', 'thai_restaurant']))).toBe('thai');
  });
  it('prefers Google types over keywords', () => {
    expect(deriveCuisine(p('Pierogi Palace', 'italian_restaurant'))).toBe('italian');
  });
  it('uses keywords for cuisines without a Google type', () => {
    expect(deriveCuisine(p('Pierogarnia Babcia', 'restaurant'))).toBe('polish');
    expect(deriveCuisine(p('Gruzińska Chinkalnia', 'restaurant'))).toBe('georgian');
    expect(deriveCuisine(p('Tbilisi House', 'restaurant'))).toBe('georgian');
    expect(deriveCuisine(p('Some Place', 'restaurant', [], 'Georgian khinkali and khachapuri.'))).toBe('georgian');
    expect(deriveCuisine(p('Bar Mleczny Polonia', 'restaurant'))).toBe('polish');
    expect(deriveCuisine(p('Kebab u Alego', 'restaurant'))).toBe('kebab');
  });
  it('matches whole-word keywords only where marked', () => {
    expect(deriveCuisine(p('Phoenix Telephone Cafe', 'cafe'))).toBe(UNKNOWN);
    expect(deriveCuisine(p('Pho 24', 'restaurant'))).toBe('vietnamese');
  });
  it('returns unknown otherwise', () => {
    expect(deriveCuisine(p('Restauracja Pod Lipami', 'restaurant'))).toBe(UNKNOWN);
    expect(deriveCuisine(p('Café Nowy Świat', 'cafe', ['bakery']))).toBe(UNKNOWN);
  });
});
