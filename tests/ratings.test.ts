import { describe, expect, it } from 'vitest';
import { averageScore, leaderboard, pendingVisits, placeRatings } from '../src/lib/ratings';
import { deliveryLinks, telUrl } from '../src/lib/delivery';
import type { Rating, Visit } from '../src/lib/types';

const r = (visit_id: string, place_id: string, a: number, b: number): Rating => ({ visit_id, place_id, scoreA: a, scoreB: b, avg: averageScore(a, b), created_at: 0 });
const v = (id: string, place_id: string, name: string, over: Partial<Visit> = {}): Visit => ({
  id, place_id, place_name: name, cuisine: 'thai', session_id: null, type: 'dine_in', created_at: 1000, rated: false, skipped: false, ...over,
});

describe('ratings', () => {
  it('averages two scores to one decimal', () => {
    expect(averageScore(5, 4)).toBe(4.5);
    expect(averageScore(3, 4)).toBe(3.5);
    expect(averageScore(1, 1)).toBe(1);
    expect(averageScore(5, 5)).toBe(5);
  });
  it('averages a place across visits', () => {
    const m = placeRatings([r('1', 'p', 5, 5), r('2', 'p', 3, 4), r('3', 'q', 2, 2)]);
    expect(m.get('p')).toEqual({ place_id: 'p', avg: 4.3, rated_visits: 2 });
    expect(m.get('q')!.avg).toBe(2);
  });
  it('sorts the leaderboard by average, then rated visits, then name, with visit counts', () => {
    const ratings = [r('1', 'a', 5, 4), r('2', 'b', 5, 4), r('3', 'b', 5, 4), r('4', 'c', 3, 3), r('5', 'd', 5, 5)];
    const visits = [v('1', 'a', 'Alpha'), v('2', 'b', 'Beta'), v('3', 'b', 'Beta'), v('x', 'b', 'Beta', { skipped: true }), v('4', 'c', 'Gamma'), v('5', 'd', 'Delta'), v('6', 'e', 'Unrated')];
    const lb = leaderboard(ratings, visits);
    expect(lb.map((x) => x.name)).toEqual(['Delta', 'Beta', 'Alpha', 'Gamma']);
    expect(lb.find((x) => x.name === 'Beta')).toMatchObject({ visits: 2, rated_visits: 2, avg: 4.5 });
  });
  it('lists pending visits only after the delay and not skipped/rated', () => {
    const visits = [v('1', 'a', 'A', { created_at: 0 }), v('2', 'b', 'B', { created_at: 3 * 3600000 }), v('3', 'c', 'C', { created_at: 0, rated: true }), v('4', 'd', 'D', { created_at: 0, skipped: true })];
    expect(pendingVisits(visits, 2, 2.5 * 3600000).map((x) => x.id)).toEqual(['1']);
    expect(pendingVisits(visits, 2, 6 * 3600000).map((x) => x.id)).toEqual(['1', '2']);
  });
});

describe('delivery links', () => {
  it('builds encoded search fallbacks', () => {
    const l = deliveryLinks('Bar & Grill', '00-001');
    expect(l).toHaveLength(4);
    expect(l[0].url).toContain('Bar%20%26%20Grill%20Wolt%2000-001');
  });
  it('tel urls strip formatting', () => expect(telUrl('22 555-1000')).toBe('tel:225551000'));
});
