import { useEffect } from 'preact/hooks';
import { Shell } from './components/Shell';
import { loadState, ready, route, settings } from './state';
import { t } from './i18n';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { Discover } from './screens/Discover';

export function App() {
  useEffect(() => {
    void loadState();
  }, []);
  if (!ready.value) return <Shell><p>{t('common.loading')}</p></Shell>;
  const r = route.value;
  // First run: everything except setup redirects to setup.
  const needsSetup = !settings.value && r !== '/';
  return (
    <Shell>
      {r === '/setup' || r === '/settings' || needsSetup ? <Setup /> : r === '/discover' ? <Discover /> : <Home />}
    </Shell>
  );
}
