import { useState } from 'preact/hooks';
import { t } from '../i18n';
import { settings } from '../state';
import { CUISINE_BY_ID } from '../lib/cuisine';
import { deliveryLinks, mapsUrl, telUrl } from '../lib/delivery';
import { isOpenNow } from '../lib/hours';
import { createVisit } from '../lib/visits';
import type { Place, Visit } from '../lib/types';
import type { PlaceRating } from '../lib/ratings';

export function dist(km: number): string {
  return km < 1 ? t('place.distance.m', { n: Math.max(10, Math.round(km * 100) * 10) }) : t('place.distance.km', { n: km.toFixed(1) });
}

export function PlaceCard({ place, km, ours, onVisit }: { place: Place; km?: number; ours?: PlaceRating; onVisit: (v: Visit) => void }) {
  const mode = settings.value!.mode;
  const [busy, setBusy] = useState(false);
  const open = isOpenNow(place.periods, place.utc_offset_minutes);
  const postcode = settings.value!.postcode;
  const cuisine = CUISINE_BY_ID[place.cuisine];

  async function choose() {
    if (busy) return;
    setBusy(true);
    onVisit(await createVisit(place, mode));
  }

  const links = (
    <div class="row">
      {place.website && <a class="btn secondary" href={place.website} target="_blank" rel="noopener noreferrer">🌐 {t('place.website')}</a>}
      {place.phone && <a class="btn secondary" href={telUrl(place.phone)}>📞 {t('place.call')}</a>}
      <a class="btn secondary" href={mapsUrl({ name: place.name, google_place_id: place.google_place_id })} target="_blank" rel="noopener noreferrer">📍 {t('place.maps')}</a>
    </div>
  );
  const delivery = (
    <div>
      <p class="small muted" style="margin:4px 0">{t('place.delivery')}</p>
      <div class="row">
        {deliveryLinks(place.name, postcode).map((d) => (
          <a key={d.id} class="btn ghost" href={d.url} target="_blank" rel="noopener noreferrer">{d.label}</a>
        ))}
      </div>
    </div>
  );

  return (
    <article class="card stack" data-testid="place-card" aria-label={place.name}>
      <div>
        <h2 style="margin:0">{place.name}</h2>
        <p class="muted small" style="margin:2px 0">{place.address}</p>
        {cuisine && <p class="muted small" style="margin:2px 0">{cuisine.emoji} {t('place.cuisine', { cuisine: t(`cuisine.${place.cuisine}`) })}</p>}
      </div>
      <div class="row">
        {km !== undefined && <span class="chip">📏 {dist(km)}</span>}
        <span class="chip">⭐ {t('place.google', { rating: place.rating.toFixed(1), count: place.rating_count })}</span>
        {ours ? <span class="chip ok">❤️ {t('place.ours', { rating: ours.avg.toFixed(1), n: ours.rated_visits })}</span> : <span class="chip">{t('place.ours.none')}</span>}
        {open === true && <span class="chip ok">{t('place.open')}</span>}
        {open === false && <span class="chip bad">{t('place.closed')}</span>}
      </div>
      {mode === 'delivery' ? <>{delivery}{links}</> : <>{links}{delivery}</>}
      <button class="btn big block" disabled={busy} onClick={() => void choose()}>
        {mode === 'delivery' ? t('place.ordering') : t('place.going')}
      </button>
    </article>
  );
}

export function Confirmed({ visit, onHome }: { visit: Visit; onHome: () => void }) {
  return (
    <div class="stack" style="text-align:center;padding-top:40px" role="status">
      <div style="font-size:4rem" aria-hidden="true">{visit.type === 'delivery' ? '🛵' : '🍴'}</div>
      <h1>{t(`place.confirmed.${visit.type}`, { name: visit.place_name })}</h1>
      <p class="muted">{t('place.confirmed.hint')}</p>
      <button class="btn big block" onClick={onHome}>{t('place.home')}</button>
    </div>
  );
}

