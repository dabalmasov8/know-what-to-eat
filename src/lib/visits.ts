import { db, uid } from '../db';
import type { Mode, Place, Rating, Visit } from './types';
import { currentSession } from '../session';

export async function createVisit(place: Place, type: Mode): Promise<Visit> {
  const v: Visit = {
    id: uid(),
    place_id: place.google_place_id,
    place_name: place.name,
    cuisine: place.cuisine,
    session_id: currentSession.value?.id ?? null,
    type,
    created_at: Date.now(),
    rated: false,
    skipped: false,
  };
  await db.visits.put(v);
  return v;
}

export async function allRatings(): Promise<Rating[]> {
  return db.ratings.toArray();
}
