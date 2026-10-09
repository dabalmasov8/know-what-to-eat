import { useEffect, useState } from 'preact/hooks';
import { t, tPlural } from '../i18n';
import { area, go, settings } from '../state';
import { cuisineCounts, discoverArea, isStale, loadAreaPlaces, searchCuisine } from '../lib/discovery';
import { CUISINES, CUISINE_BY_ID } from '../lib/cuisine';
import { MIN_RATING, MIN_REVIEWS, MIN_USEFUL_PLACES } from '../lib/constants';
import { ApiError } from '../lib/api';
import type { Place } from '../lib/types';
import { errorMessage, PasscodeForm } from '../components/ErrorBox';

type Phase = 'geocode' | 'search' | 'done' | 'error';

export function Discover() {
  const s = settings.value!;
  const [phase, setPhase] = useState<Phase>('geocode');
  const [err, setErr] = useState<unknown>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [pick, setPick] = useState('polish');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function run(force = false) {
    const a = area.value;
    const fresh = a && a.postcode === s.postcode && a.country === s.country && a.radius_km === s.radius_km && !isStale(a);
    try {
      if (!fresh || force) {
        setPhase('geocode');
        area.value = await discoverArea(s, (step) => setPhase(step));
      }
      setPlaces(await loadAreaPlaces());
      setPhase('done');
    } catch (e) {
      setErr(e);
      setPhase('error');
    }
  }
  useEffect(() => {
    void run();
  }, []);

  async function specific() {
    setBusy(true);
    setNote('');
    try {
      const r = await searchCuisine(pick);
      area.value = r.area;
      setPlaces(await loadAreaPlaces());
      setNote(r.added > 0 ? tPlural('discover.specific.added', r.added) : t('discover.specific.none'));
    } catch (e) {
      setErr(e);
      setPhase('error');
    }
    setBusy(false);
  }

  if (phase === 'error') {
    const unauthorized = err instanceof ApiError && err.code === 'unauthorized';
    return (
      <div class="stack">
        <h1>{t('discover.title')}</h1>
        {unauthorized ? <PasscodeForm onDone={() => void run(true)} /> : <div class="banner bad" role="alert">{errorMessage(err)}</div>}
        <div class="row">
          {!unauthorized && <button class="btn" onClick={() => void run(true)}>{t('common.retry')}</button>}
          <button class="btn ghost" onClick={() => go('/settings')}>{t('discover.change')}</button>
        </div>
      </div>
    );
  }

  if (phase !== 'done') {
    return (
      <div class="stack" aria-busy="true">
        <h1>{t('discover.title')}</h1>
        <p role="status">{t(`discover.step.${phase}`)}</p>
        {[80, 60, 70, 50].map((w, i) => <div key={i} class="skeleton" style={`width:${w}%`} />)}
      </div>
    );
  }

  const a = area.value!;
  const counts = cuisineCounts(places);
  const few = places.length < MIN_USEFUL_PLACES;
  return (
    <div class="stack">
      <h1>{t('discover.done.title')}</h1>
      <p>{t('discover.summary', { qualified: a.stats.qualified, rating: MIN_RATING, reviews: MIN_REVIEWS })}</p>
      <p class="muted small">{t('discover.found', { found: a.stats.found, unknown: a.stats.unknown_cuisine, calls: a.stats.api_calls })}</p>
      {few && (
        <div class="banner warn" role="status">
          {places.length === 0 ? t('discover.sparse.none') : t('discover.sparse', { n: places.length })}
          {' '}
          <button class="btn secondary" onClick={() => go('/settings')}>{t('discover.change')}</button>
        </div>
      )}
      {counts.length > 0 && (
        <>
          <h2>{t('discover.cuisines')}</h2>
          <ul class="stack" style="list-style:none;padding:0;margin:0" data-testid="cuisine-counts">
            {counts.map((c) => (
              <li key={c.id} class="row card" style="padding:10px 14px">
                <span aria-hidden="true">{CUISINE_BY_ID[c.id].emoji}</span>
                <span class="grow">{t(`cuisine.${c.id}`)}</span>
                <span class="chip">{tPlural('discover.places', c.count)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2>{t('discover.specific')}</h2>
      <p class="muted small">{t('discover.specific.hint')}</p>
      <div class="row">
        <select class="grow" aria-label={t('discover.specific')} value={pick} onChange={(e) => setPick(e.currentTarget.value)} style="width:auto;flex:1">
          {CUISINES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {t(`cuisine.${c.id}`)}</option>)}
        </select>
        <button class="btn secondary" disabled={busy} onClick={() => void specific()}>{t('discover.specific.go')}</button>
      </div>
      {note && <p role="status">{note}</p>}
      {counts.length > 0 && <button class="btn big block" onClick={() => go('/vote')}>{t('discover.continue')}</button>}
    </div>
  );
}
