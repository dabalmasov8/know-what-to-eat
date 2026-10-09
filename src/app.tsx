import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Shell } from './components/Shell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DataPanel } from './components/DataPanel';
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

function screen(r: string): ComponentChildren {
  // First run: everything except the home page leads to setup.
  if (!settings.value && r !== '/') return <Setup />;
  if (r === '/setup') return <Setup />;
  if (r === '/settings') return <><Setup /><DataPanel /></>;
  if (r === '/discover') return <Discover />;
  if (r === '/vote') return <Vote />;
  if (r === '/wheel') return <Wheel />;
  if (r === '/history') return <History />;
  if (r === '/leaderboard') return <Leaderboard />;
  if (r.startsWith('/rate/')) return <Rate visitId={r.slice(6)} />;
  if (r.startsWith('/place/')) return <PlaceDetail id={r.slice(7)} />;
  if (r.startsWith('/places/')) return <Places cuisine={r.slice(8)} />;
  return <Home />;
}

export function App() {
  useEffect(() => {
    void loadState();
  }, []);
  if (!ready.value) return <Shell><p>{t('common.loading')}</p></Shell>;
  const r = route.value;
  return (
    <Shell>
      <ErrorBoundary key={r}>{screen(r)}</ErrorBoundary>
    </Shell>
  );
}
