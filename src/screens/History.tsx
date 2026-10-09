import { useEffect, useState } from 'preact/hooks';
import { lang, t } from '../i18n';
import { go } from '../state';
import { db } from '../db';
import { CUISINE_BY_ID } from '../lib/cuisine';
import type { Rating, Visit } from '../lib/types';

export function History() {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map());
  useEffect(() => {
    void (async () => {
      setVisits((await db.visits.toArray()).sort((a, b) => b.created_at - a.created_at));
      setRatings(new Map((await db.ratings.toArray()).map((r) => [r.visit_id, r])));
    })();
  }, []);
  if (!visits) return <div class="skeleton" style="height:120px" aria-busy="true" />;
  const fmt = new Intl.DateTimeFormat(lang.value, { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <div class="stack">
      <h1>{t('history.title')}</h1>
      {visits.length === 0 && <div class="banner">{t('history.empty')}</div>}
      <ul style="list-style:none;padding:0;margin:0" class="stack">
        {visits.map((v) => {
          const r = ratings.get(v.id);
          return (
            <li key={v.id}>
              <button class="card block" style="width:100%;text-align:left;font:inherit;cursor:pointer" onClick={() => go(`/place/${v.place_id}`)}>
                <div class="row">
                  <strong class="grow">{CUISINE_BY_ID[v.cuisine]?.emoji ?? '🍽️'} {v.place_name}</strong>
                  {r && <span class="chip ok">⭐ {r.avg.toFixed(1)}</span>}
                  {v.skipped && <span class="chip">{t('history.skipped')}</span>}
                  {!r && !v.skipped && <span class="chip">{t('history.pending')}</span>}
                </div>
                <div class="muted small">{fmt.format(v.created_at)} · {t(`history.type.${v.type}`)}</div>
              </button>
              {!r && !v.skipped && <button class="btn secondary" style="margin-top:6px" onClick={() => go(`/rate/${v.id}`)}>{t('history.rate')}</button>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
