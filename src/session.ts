import { signal } from '@preact/signals';
import { db, uid } from './db';
import type { Answers, Session } from './lib/types';

export const currentSession = signal<Session | null>(null);
/** Cuisine order used for this session (so wheel/results agree with the cards). */
export const sessionCuisines = signal<string[]>([]);

export function newSession(order: string[]): Session {
  const s: Session = { id: uid(), created_at: Date.now(), answers: { a: {}, b: {} }, result_cuisine: null, result_type: null };
  currentSession.value = s;
  sessionCuisines.value = order;
  return s;
}

export async function saveSession(patch: Partial<Pick<Session, 'result_cuisine' | 'result_type'>> & { answers?: { a: Answers; b: Answers } }) {
  const s = currentSession.value;
  if (!s) return;
  const next = { ...s, ...patch };
  currentSession.value = next;
  await db.sessions.put(next);
}
