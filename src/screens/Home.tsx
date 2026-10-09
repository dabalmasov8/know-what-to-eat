import { useEffect, useState } from 'preact/hooks';
import { t, tPlural } from '../i18n';
import { InstallBanner } from '../components/Shell';
import { area, go, settings } from '../state';
import { db } from '../db';
import { pendingVisits } from '../lib/ratings';
import type { Visit } from '../lib/types';

export function Home() {
  const s = settings.value;
  const [pending, setPending] = useState<Visit[]>([]);
  useEffect(() => {
    if (!s) return;
    void db.visits.toArray().then((v) => setPending(pendingVisits(v, s.rating_delay_hours)));
  }, [s]);

  if (!s) {
    return (
      <div class="stack">
        <h1>{t('app.tagline')}</h1>
        <p class="muted">{t('home.intro')}</p>
        <button class="btn big block" onClick={() => go('/setup')}>{t('home.setup.cta')}</button>
        <InstallBanner />
      </div>
    );
  }
  const next = pending[0];
  return (
    <div class="stack">
      {next && (
        <div class="banner" role="region" aria-label={t('rate.banner', { place: next.place_name })}>
          <strong>⭐ {t('rate.banner', { place: next.place_name })}</strong>
          {pending.length > 1 && <p class="small muted" style="margin:2px 0">{tPlural('rate.banner.more', pending.length - 1)}</p>}
          <div class="row" style="margin-top:8px">
            <button class="btn" onClick={() => go(`/rate/${next.id}`)}>{t('rate.banner.cta')}</button>
          </div>
        </div>
      )}
      <h1>{t('app.tagline')}</h1>
      <p class="muted">{t('home.area', { postcode: s.postcode, km: s.radius_km, mode: t(`setup.mode.${s.mode}`) })}</p>
      {area.value ? (
        <button class="btn big block" onClick={() => go('/vote')}>{t('home.start')}</button>
      ) : (
        <button class="btn big block" onClick={() => go('/discover')}>{t('home.refresh')}</button>
      )}
      <div class="row">
        <button class="btn secondary grow" onClick={() => go('/history')}>🕑 {t('nav.history')}</button>
        <button class="btn secondary grow" onClick={() => go('/leaderboard')}>🏆 {t('nav.board')}</button>
      </div>
      <InstallBanner />
    </div>
  );
}
