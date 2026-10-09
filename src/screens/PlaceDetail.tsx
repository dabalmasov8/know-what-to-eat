import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { area, go, settings } from '../state';
import { db } from '../db';
import { distanceKm } from '../lib/geo';
import { deliveryLinks, mapsUrl } from '../lib/delivery';
import { placeRatings, type PlaceRating } from '../lib/ratings';
import type { Place, Visit } from '../lib/types';
import { Confirmed, PlaceCard } from '../components/PlaceCard';

export function PlaceDetail({ id }: { id: string }) {
  const [state, setState] = useState<{ place?: Place; visit?: Visit; ours?: PlaceRating } | null>(null);
  const [done, setDone] = useState<Visit | null>(null);
  useEffect(() => {
    void (async () => {
      const place = await db.places.get(id);
      const visit = (await db.visits.where('place_id').equals(id).toArray()).sort((a, b) => b.created_at - a.created_at)[0];
      const ours = placeRatings(await db.ratings.where('place_id').equals(id).toArray()).get(id);
      setState({ place, visit, ours });
    })();
  }, [id]);
  if (done) return <Confirmed visit={done} onHome={() => go('/')} />;
  if (!state) return <div class="skeleton" style="height:160px" aria-busy="true" />;
  const a = area.value;
  if (state.place) {
    const p = state.place;
    return <PlaceCard place={p} km={a ? distanceKm(a.lat, a.lng, p.lat, p.lng) : undefined} ours={state.ours} onVisit={setDone} />;
  }
  // Not in the (expired / re-fetched) cache: offer plain links built from the visit snapshot.
  const name = state.visit?.place_name ?? '';
  return (
    <div class="stack">
      <h1>{name}</h1>
      <div class="banner warn">{t('place.notfound')}</div>
      <div class="row">
        <a class="btn secondary" href={mapsUrl({ name, google_place_id: id })} target="_blank" rel="noopener noreferrer">📍 {t('place.maps')}</a>
        {deliveryLinks(name, settings.value?.postcode ?? '').map((d) => <a key={d.id} class="btn ghost" href={d.url} target="_blank" rel="noopener noreferrer">{d.label}</a>)}
      </div>
      <button class="btn block" onClick={() => go('/discover')}>{t('places.stale.refresh')}</button>
    </div>
  );
}
