import type { Rating, Visit } from './types';

export const averageScore = (a: number, b: number) => Math.round(((a + b) / 2) * 10) / 10;

export interface PlaceRating {
  place_id: string;
  avg: number; // mean of the visit averages, 1 decimal
  rated_visits: number;
}

export function placeRatings(ratings: Rating[]): Map<string, PlaceRating> {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const r of ratings) {
    const e = acc.get(r.place_id) ?? { sum: 0, n: 0 };
    e.sum += r.avg;
    e.n += 1;
    acc.set(r.place_id, e);
  }
  return new Map([...acc].map(([id, e]) => [id, { place_id: id, avg: Math.round((e.sum / e.n) * 10) / 10, rated_visits: e.n }]));
}

export interface LeaderboardRow extends PlaceRating {
  name: string;
  cuisine: string;
  visits: number; // all visits, rated or not, excluding skipped
}

/** Best average first; ties by more rated visits, then name. Only places with at least one rating. */
export function leaderboard(ratings: Rating[], visits: Visit[]): LeaderboardRow[] {
  const pr = placeRatings(ratings);
  const info = new Map<string, { name: string; cuisine: string; visits: number; at: number }>();
  for (const v of visits) {
    if (v.skipped) continue;
    const e = info.get(v.place_id);
    if (!e) info.set(v.place_id, { name: v.place_name, cuisine: v.cuisine, visits: 1, at: v.created_at });
    else {
      e.visits += 1;
      if (v.created_at > e.at) Object.assign(e, { name: v.place_name, at: v.created_at });
    }
  }
  const rows: LeaderboardRow[] = [];
  for (const [id, r] of pr) {
    const i = info.get(id);
    if (!i) continue;
    rows.push({ ...r, name: i.name, cuisine: i.cuisine, visits: i.visits });
  }
  return rows.sort((a, b) => b.avg - a.avg || b.rated_visits - a.rated_visits || a.name.localeCompare(b.name));
}

/** Visits waiting for a rating: not rated, not skipped, older than the configured delay. */
export function pendingVisits(visits: Visit[], delayHours: number, now = Date.now()): Visit[] {
  return visits
    .filter((v) => !v.rated && !v.skipped && now - v.created_at >= delayHours * 3600000)
    .sort((a, b) => a.created_at - b.created_at);
}
