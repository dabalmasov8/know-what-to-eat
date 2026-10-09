import { useEffect } from 'preact/hooks';
import { Shell } from './components/Shell';
import { loadState, ready, route, settings } from './state';
import { t } from './i18n';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { Discover } from './screens/Discover';
import { Vote } from './screens/Vote';
import { Wheel } from './screens/Wheel';
import { Places } from './screens/Places';
import { Rate } from './screens/Rate';
import { History } from './screens/History';
import { Leaderboard } from './screens/Leaderboard';
import { PlaceDetail } from './screens/PlaceDetail';

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
      {r === '/setup' || r === '/settings' || needsSetup ? <Setup /> : r === '/discover' ? <Discover /> : r === '/vote' ? <Vote /> : r === '/wheel' ? <Wheel /> : r === '/history' ? <History /> : r === '/leaderboard' ? <Leaderboard /> : r.startsWith('/rate/') ? <Rate visitId={r.slice(6)} key={r} /> : r.startsWith('/place/') ? <PlaceDetail id={r.slice(7)} key={r} /> : r.startsWith('/places/') ? <Places cuisine={r.slice(8)} key={r} /> : <Home />}
    </Shell>
  );
}
