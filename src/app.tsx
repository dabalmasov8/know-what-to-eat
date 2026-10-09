import { useEffect } from 'preact/hooks';
import { Shell, InstallBanner } from './components/Shell';
import { loadState, ready } from './state';
import { t } from './i18n';

export function App() {
  useEffect(() => {
    void loadState();
  }, []);
  if (!ready.value) return <Shell><p>{t('common.loading')}</p></Shell>;
  return (
    <Shell>
      <h1>{t('app.tagline')}</h1>
      <p class="muted">{t('home.hello')}</p>
      <InstallBanner />
    </Shell>
  );
}
