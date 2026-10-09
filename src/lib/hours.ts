import type { OpeningPeriod } from './types';

const WEEK = 7 * 24 * 60;
const at = (p: { day: number; hour: number; minute: number }) => p.day * 1440 + p.hour * 60 + p.minute;

/** Is the place open at `nowMs`? Uses the weekly periods and the place's UTC offset. undefined = unknown. */
export function isOpenNow(periods: OpeningPeriod[] | undefined, utcOffsetMinutes: number | undefined, nowMs = Date.now()): boolean | undefined {
  if (!periods || periods.length === 0) return undefined;
  const local = new Date(nowMs + (utcOffsetMinutes ?? 0) * 60000);
  const t = local.getUTCDay() * 1440 + local.getUTCHours() * 60 + local.getUTCMinutes();
  for (const p of periods) {
    if (!p.close) return true; // open 24/7
    const open = at(p.open);
    let close = at(p.close);
    if (close <= open) close += WEEK;
    if ((t >= open && t < close) || (t + WEEK >= open && t + WEEK < close)) return true;
  }
  return false;
}
