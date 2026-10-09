import { useEffect, useState } from 'preact/hooks';
import { t, tPlural } from '../i18n';
import { go, settings } from '../state';
import { cuisineCounts, loadAreaPlaces } from '../lib/discovery';
import { CUISINE_BY_ID } from '../lib/cuisine';
import { decide, pickRandom } from '../lib/voting';
import { newSession, saveSession, sessionCuisines } from '../session';
import type { Answers } from '../lib/types';

type Step = 'loading' | 'a' | 'handover' | 'b' | 'result';

export function Vote() {
  const names = settings.value!.names;
  const [step, setStep] = useState<Step>('loading');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [a, setA] = useState<Answers>({});
  const [b, setB] = useState<Answers>({});

  useEffect(() => {
    void loadAreaPlaces().then((places) => {
      const c = cuisineCounts(places);
      setCounts(Object.fromEntries(c.map((x) => [x.id, x.count])));
      const ord = c.map((x) => x.id);
      setOrder(ord);
      if (ord.length > 0) newSession(ord);
      setStep(ord.length > 0 ? 'a' : 'result');
    });
  }, []);

  if (step === 'loading') return <div class="skeleton" style="height:200px" aria-busy="true" />;
  if (order.length === 0) {
    return (
      <div class="stack">
        <p>{t('vote.nocuisines')}</p>
        <button class="btn" onClick={() => go('/discover')}>{t('home.refresh')}</button>
      </div>
    );
  }

  const person = step === 'a' ? 0 : 1;
  const answers = step === 'a' ? a : b;
  const setAnswers = step === 'a' ? setA : setB;

  function answer(yes: boolean) {
    const cuisine = order[i];
    const next = { ...answers, [cuisine]: yes };
    setAnswers(next);
    if (i + 1 < order.length) {
      setI(i + 1);
      return;
    }
    if (step === 'a') {
      void saveSession({ answers: { a: next, b: {} } });
      setStep('handover');
      setI(0);
    } else {
      void saveSession({ answers: { a, b: next } });
      setStep('result');
    }
  }

  if (step === 'handover') {
    return (
      <div class="stack" style="text-align:center;padding-top:40px">
        <div style="font-size:4rem" aria-hidden="true">📱➡️</div>
        <h1>{t('vote.handover.title', { name: names[1] })}</h1>
        <p class="muted">{t('vote.handover.hint')}</p>
        <button class="btn big block" onClick={() => setStep('b')}>{t('vote.handover.ready', { name: names[1] })}</button>
      </div>
    );
  }

  function restart() {
    newSession(order);
    setA({});
    setB({});
    setI(0);
    setStep('a');
  }
  if (step === 'result') return <Result order={order} a={a} b={b} onRestart={restart} />;

  const cuisine = order[i];
  const def = CUISINE_BY_ID[cuisine];
  return (
    <div class="stack">
      <p class="muted" role="status">{names[person]} · {t('vote.progress', { n: i + 1, total: order.length })}</p>
      <h1>{t('vote.turn', { name: names[person] })}</h1>
      <p class="muted small">{t('vote.turn.hint')}</p>
      <div class="card" style="text-align:center;padding:32px 16px" aria-live="polite">
        <div style="font-size:5rem;line-height:1" aria-hidden="true">{def.emoji}</div>
        <div style="font-size:1.8rem;font-weight:800;margin-top:8px">{t(`cuisine.${cuisine}`)}</div>
        <div class="chip" style="margin-top:8px">{tPlural('discover.places', counts[cuisine] ?? 0)}</div>
        <p class="muted" style="margin-top:12px">{t('vote.question')}</p>
      </div>
      <div class="row">
        <button class="btn secondary big grow" onClick={() => answer(false)}>👎 {t('vote.no')}</button>
        <button class="btn big grow" onClick={() => answer(true)}>👍 {t('vote.yes')}</button>
      </div>
      {i > 0 && <button class="btn ghost" onClick={() => setI(i - 1)}>{t('vote.undo')}</button>}
    </div>
  );
}

function Result({ order, a, b, onRestart }: { order: string[]; a: Answers; b: Answers; onRestart: () => void }) {
  const outcome = decide(order, a, b);

  async function choose(cuisine: string, type: 'match' | 'wheel') {
    await saveSession({ result_cuisine: cuisine, result_type: type });
    go(`/places/${cuisine}`);
  }

  if (outcome.type === 'wheel') {
    return (
      <div class="stack" style="text-align:center;padding-top:24px">
        <div style="font-size:4rem" aria-hidden="true">🎡</div>
        <h1>{t('vote.result.nomatch')}</h1>
        <p class="muted">{t('vote.result.nomatch.hint')}</p>
        <button class="btn big block" onClick={() => { sessionCuisines.value = order; go('/wheel'); }}>{t('vote.result.wheel')}</button>
        <button class="btn ghost block" onClick={onRestart}>{t('vote.restart')}</button>
      </div>
    );
  }
  const { matches } = outcome;
  if (matches.length === 1) {
    const c = matches[0];
    return (
      <div class="stack" style="text-align:center;padding-top:24px">
        <div style="font-size:5rem" aria-hidden="true">{CUISINE_BY_ID[c].emoji}</div>
        <h1>{t('vote.result.single', { cuisine: t(`cuisine.${c}`) })}</h1>
        <button class="btn big block" onClick={() => void choose(c, 'match')}>{t('vote.result.find')}</button>
      </div>
    );
  }
  return (
    <div class="stack">
      <h1>{t('vote.result.match')}</h1>
      <p class="muted">{t('vote.result.many')}</p>
      {matches.map((c) => (
        <button key={c} class="btn secondary big block" onClick={() => void choose(c, 'match')}>{CUISINE_BY_ID[c].emoji} {t(`cuisine.${c}`)}</button>
      ))}
      <button class="btn big block" onClick={() => void choose(pickRandom(matches), 'match')}>🎲 {t('vote.result.random')}</button>
    </div>
  );
}

