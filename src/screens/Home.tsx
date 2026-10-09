import { t } from '../i18n';
import { InstallBanner } from '../components/Shell';
import { area, go, settings } from '../state';

export function Home() {
  const s = settings.value;
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
  return (
    <div class="stack">
      <h1>{t('app.tagline')}</h1>
      <p class="muted">{t('home.area', { postcode: s.postcode, km: s.radius_km, mode: t(`setup.mode.${s.mode}`) })}</p>
      {area.value ? (
        <button class="btn big block" onClick={() => go('/vote')}>{t('home.start')}</button>
      ) : (
        <button class="btn big block" onClick={() => go('/discover')}>{t('home.refresh')}</button>
      )}
      <InstallBanner />
    </div>
  );
}
