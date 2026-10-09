import { useEffect, useState } from 'preact/hooks';
import { t, tPlural } from '../i18n';
import { go } from '../state';
import { db } from '../db';
import { CUISINE_BY_ID } from '../lib/cuisine';
import { leaderboard, type LeaderboardRow } from '../lib/ratings';

export function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  useEffect(() => {
    void (async () => setRows(leaderboard(await db.ratings.toArray(), await db.visits.toArray())))();
  }, []);
  if (!rows) return <div class="skeleton" style="height:120px" aria-busy="true" />;
  return (
    <div class="stack">
      <h1>{t('board.title')}</h1>
      {rows.length === 0 && <div class="banner">{t('board.empty')}</div>}
      <ol style="list-style:none;padding:0;margin:0" class="stack">
        {rows.map((r, i) => (
          <li key={r.place_id}>
            <button class="card block" style="width:100%;text-align:left;font:inherit;cursor:pointer" onClick={() => go(`/place/${r.place_id}`)}>
              <div class="row">
                <span class="chip" aria-label={`#${i + 1}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                <strong class="grow">{CUISINE_BY_ID[r.cuisine]?.emoji ?? '🍽️'} {r.name}</strong>
                <span class="chip ok">⭐ {t('board.avg', { avg: r.avg.toFixed(1) })}</span>
              </div>
              <div class="muted small">{tPlural('board.visits', r.visits)}</div>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
