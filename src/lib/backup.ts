import { db } from '../db';
import type { Rating, Session, Settings, Visit } from './types';

export const BACKUP_VERSION = 1;

export interface Backup {
  app: 'food-picker';
  version: number;
  exported_at: number;
  settings: Settings | null;
  sessions: Session[];
  visits: Visit[];
  ratings: Rating[];
}

/** Places and area are deliberately excluded: they are Google content and are re-fetched after import. */
export async function buildBackup(): Promise<Backup> {
  return {
    app: 'food-picker',
    version: BACKUP_VERSION,
    exported_at: Date.now(),
    settings: (await db.settings.get('main')) ?? null,
    sessions: await db.sessions.toArray(),
    visits: await db.visits.toArray(),
    ratings: await db.ratings.toArray(),
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('not_json');
  }
  if (!isObj(data) || data.app !== 'food-picker' || data.version !== BACKUP_VERSION) throw new Error('wrong_file');
  const arr = (k: string) => {
    const v = data[k];
    if (!Array.isArray(v)) throw new Error('bad_' + k);
    return v;
  };
  const settings = data.settings;
  if (settings !== null) {
    if (!isObj(settings) || settings.id !== 'main' || !Array.isArray(settings.names) || settings.names.length !== 2 || typeof settings.postcode !== 'string') throw new Error('bad_settings');
  }
  const visits = arr('visits');
  for (const v of visits) if (!isObj(v) || typeof v.id !== 'string' || typeof v.place_id !== 'string' || typeof v.created_at !== 'number') throw new Error('bad_visits');
  const ratings = arr('ratings');
  for (const r of ratings) if (!isObj(r) || typeof r.visit_id !== 'string' || typeof r.avg !== 'number' || typeof r.place_id !== 'string') throw new Error('bad_ratings');
  const sessions = arr('sessions');
  for (const s of sessions) if (!isObj(s) || typeof s.id !== 'string') throw new Error('bad_sessions');
  return data as unknown as Backup;
}

/** Replaces settings, sessions, visits and ratings. Cached places/area are cleared (re-fetched next). */
export async function restoreBackup(b: Backup): Promise<void> {
  await db.transaction('rw', [db.settings, db.sessions, db.visits, db.ratings, db.places, db.area], async () => {
    await Promise.all([db.settings.clear(), db.sessions.clear(), db.visits.clear(), db.ratings.clear(), db.places.clear(), db.area.clear()]);
    if (b.settings) await db.settings.put(b.settings);
    await db.sessions.bulkPut(b.sessions);
    await db.visits.bulkPut(b.visits);
    await db.ratings.bulkPut(b.ratings);
  });
}
