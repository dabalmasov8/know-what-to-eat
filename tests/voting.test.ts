import { describe, expect, it } from 'vitest';
import { computeMatches, decide, pickRandom, randomIndex, wheelSegments } from '../src/lib/voting';

const order = ['thai', 'pizza', 'polish', 'sushi'];

describe('voting', () => {
  it('matches are the intersection of yes answers, in cuisine order', () => {
    expect(computeMatches(order, { thai: true, pizza: true, sushi: false }, { thai: true, pizza: false, sushi: true })).toEqual(['thai']);
    expect(computeMatches(order, { sushi: true, thai: true }, { sushi: true, thai: true })).toEqual(['thai', 'sushi']);
  });
  it('treats missing answers as no', () => {
    expect(computeMatches(order, { thai: true }, {})).toEqual([]);
  });
  it('wheel uses the union of yes answers when non-empty', () => {
    expect(wheelSegments(order, { thai: true }, { pizza: true })).toEqual(['thai', 'pizza']);
  });
  it('wheel uses all cuisines on no/no', () => {
    expect(wheelSegments(order, { thai: false }, { pizza: false })).toEqual(order);
  });
  it('decide: match vs wheel', () => {
    expect(decide(order, { thai: true, pizza: true }, { pizza: true })).toEqual({ type: 'match', matches: ['pizza'] });
    expect(decide(order, { thai: true }, { sushi: true })).toEqual({ type: 'wheel', segments: ['thai', 'sushi'] });
    expect(decide(order, {}, {})).toEqual({ type: 'wheel', segments: order });
  });
  it('random index stays in range', () => {
    expect(randomIndex(4, () => 0)).toBe(0);
    expect(randomIndex(4, () => 0.9999)).toBe(3);
    expect(randomIndex(4, () => 1)).toBe(3);
    for (let i = 0; i < 200; i++) expect(order).toContain(pickRandom(order));
  });
});
