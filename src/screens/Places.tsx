import { useEffect, useMemo, useState } from 'preact/hooks';
import { t, tPlural } from '../i18n';
import { area, go } from '../state';
import { db } from '../db';
import { isStale } from '../lib/discovery';
import { distanceKm } from '../lib/geo';
import { isOpenNow } from '../lib/hours';
import { placeRatings, type PlaceRating } from '../lib/ratings';
import type { Place, Visit } from '../lib/types';
import { Confirmed, PlaceCard } from '../components/PlaceCard';

type Sort = 'distance' | 'rating';

export function Places({ cuisine }: { cuisine: string }) {
  const a = area.value;
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [ratings, setRatings] = useState<Map<string, PlaceRating>>(new Map());
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('distance');
  const [visit, setVisit] = useState<Visit | null>(null);

  useEffect(() => {
    void (async () => {
      // Local cache only: no API call happens here.
      setPlaces(await db.places.where('cuisine').equals(cuisine).toArray());
      setRatings(placeRatings(await db.ratings.toArray()));
    })();
  }, [cuisine]);

  const list = useMemo(() => {
    if (!places || !a) return [];
    const withKm = places.map((p) => ({ p, km: distanceKm(a.lat, a.lng, p.lat, p.lng) }));
    const filtered = openOnly ? withKm.filter((x) => isOpenNow(x.p.periods, x.p.utc_offset_minutes) !== false) : withKm;
    return filtered.sort((x, y) => {
      if (sort === 'rating') {
        const rx = ratings.get(x.p.google_place_id)?.avg ?? -1;
        const ry = ratings.get(y.p.google_place_id)?.avg ?? -1;
        if (rx !== ry) return ry - rx;
      }
      return x.km - y.km;
    });
  }, [places, a, openOnly, sort, ratings]);

  if (visit) return <Confirmed visit={visit} onHome={() => go('/')} />;
  if (!places || !a) return <div class="skeleton" style="height:180px" aria-busy="true" />;

  return (
    <div class="stack">
      <h1>{t('places.title', { cuisine: t(`cuisine.${cuisine}`) })}</h1>
      {isStale(a) && (
        <div class="banner warn" role="status">
          {t('places.stale')} <button class="btn secondary" onClick={() => go('/discover')}>{t('places.stale.refresh')}</button>
        </div>
      )}
      <div class="row">
        <label class="chip" style="min-height:44px;cursor:pointer">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.currentTarget.checked)} style="width:20px;height:20px;accent-color:#c2410c" /> {t('places.filter.open')}
        </label>
        <div class="seg" role="group" aria-label={t('places.sort')}>
          <button aria-pressed={sort === 'distance'} onClick={() => setSort('distance')}>{t('places.sort.distance')}</button>
          <button aria-pressed={sort === 'rating'} onClick={() => setSort('rating')}>{t('places.sort.rating')}</button>
        </div>
      </div>
      <p class="muted small" role="status">{tPlural('places.count', list.length)}</p>
      {list.length === 0 && <div class="banner">{openOnly && places.length > 0 ? t('places.empty.open') : t('places.empty')}</div>}
      {list.map(({ p, km }) => (
        <PlaceCard key={p.google_place_id} place={p} km={km} ours={ratings.get(p.google_place_id)} onVisit={setVisit} />
      ))}
      <button class="btn ghost block" onClick={() => go('/vote')}>{t('places.another')}</button>
    </div>
  );
}
