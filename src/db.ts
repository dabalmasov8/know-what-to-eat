import Dexie, { type Table } from 'dexie';
import type { Area, Place, Rating, Session, Settings, Visit } from './lib/types';

export class FoodDB extends Dexie {
  settings!: Table<Settings, string>;
  sessions!: Table<Session, string>;
  area!: Table<Area, string>;
  places!: Table<Place, string>;
  visits!: Table<Visit, string>;
  ratings!: Table<Rating, string>;

  constructor(name = 'food-picker') {
    super(name);
    this.version(1).stores({
      settings: 'id',
      sessions: 'id, created_at',
      area: 'id',
      places: 'google_place_id, cuisine, cached_at',
      visits: 'id, place_id, created_at, rated',
      ratings: 'visit_id, place_id',
    });
  }
}

export const db = new FoodDB();

export async function getSettings(): Promise<Settings | undefined> {
  return db.settings.get('main');
}

export async function saveSettings(s: Settings): Promise<void> {
  await db.settings.put(s);
}

export function uid(): string {
  return crypto.randomUUID();
}

/** Ask the browser not to evict our data. Safe to call repeatedly. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}
