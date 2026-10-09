import type { Answers } from './types';

/** Cuisines (in the given order) both people said yes to. */
export function computeMatches(order: string[], a: Answers, b: Answers): string[] {
  return order.filter((c) => a[c] === true && b[c] === true);
}

/** Wheel segments: union of yes answers if there are any, otherwise every cuisine. */
export function wheelSegments(order: string[], a: Answers, b: Answers): string[] {
  const yes = order.filter((c) => a[c] === true || b[c] === true);
  return yes.length > 0 ? yes : [...order];
}

export type Outcome = { type: 'match'; matches: string[] } | { type: 'wheel'; segments: string[] };

export function decide(order: string[], a: Answers, b: Answers): Outcome {
  const matches = computeMatches(order, a, b);
  return matches.length > 0 ? { type: 'match', matches } : { type: 'wheel', segments: wheelSegments(order, a, b) };
}

/** Unbiased random index using crypto when available. */
export function randomIndex(n: number, rand: () => number = secureRandom): number {
  return Math.min(n - 1, Math.floor(rand() * n));
}

export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

export function pickRandom<T>(items: T[], rand: () => number = secureRandom): T {
  return items[randomIndex(items.length, rand)];
}
