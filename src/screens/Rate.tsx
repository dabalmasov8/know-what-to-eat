import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { go, settings } from '../state';
import { db } from '../db';
import { averageScore } from '../lib/ratings';
import type { Visit } from '../lib/types';
import { Stars } from '../components/Stars';

type Step = 'a' | 'handover' | 'b' | 'done';

export function Rate({ visitId }: { visitId: string }) {
  const names = settings.value!.names;
  const [visit, setVisit] = useState<Visit | null | undefined>(undefined);
  const [step, setStep] = useState<Step>('a');
  const [sa, setSa] = useState(0);
  const [sb, setSb] = useState(0);

  useEffect(() => {
    void db.visits.get(visitId).then((v) => setVisit(v ?? null));
  }, [visitId]);

  if (visit === undefined) return <div class="skeleton" style="height:160px" aria-busy="true" />;
  if (visit === null || (visit.rated && step !== 'done')) {
    return (
      <div class="stack">
        <p>{t('rate.notfound')}</p>
        <button class="btn" onClick={() => go('/')}>{t('place.home')}</button>
      </div>
    );
  }

  async function skip() {
    await db.visits.update(visitId, { skipped: true });
    go('/');
  }

  async function save(finalB: number) {
    await db.transaction('rw', db.ratings, db.visits, async () => {
      await db.ratings.put({ visit_id: visitId, place_id: visit!.place_id, scoreA: sa, scoreB: finalB, avg: averageScore(sa, finalB), created_at: Date.now() });
      await db.visits.update(visitId, { rated: true });
    });
    setStep('done');
  }

  if (step === 'handover') {
    return (
      <div class="stack" style="text-align:center;padding-top:40px">
        <div style="font-size:4rem" aria-hidden="true">📱➡️</div>
        <h1>{t('rate.handover', { name: names[1] })}</h1>
        <button class="btn big block" onClick={() => setStep('b')}>{t('vote.handover.ready', { name: names[1] })}</button>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div class="stack" style="text-align:center;padding-top:24px" role="status">
        <div style="font-size:4rem" aria-hidden="true">⭐</div>
        <h1>{t('rate.result', { avg: averageScore(sa, sb).toFixed(1) })}</h1>
        <p class="muted">{t('rate.result.detail', { a: names[0], sa, b: names[1], sb })}</p>
        <p>{t('rate.saved')}</p>
        <button class="btn big block" onClick={() => go('/')}>{t('place.home')}</button>
      </div>
    );
  }

  const person = step === 'a' ? 0 : 1;
  const value = step === 'a' ? sa : sb;
  return (
    <div class="stack">
      <h1>{t('rate.title', { place: visit.place_name })}</h1>
      <p class="muted small">{t('rate.hint')}</p>
      <h2 style="text-align:center">{t('rate.turn', { name: names[person] })}</h2>
      <Stars value={value} onChange={step === 'a' ? setSa : setSb} />
      <button class="btn big block" disabled={value === 0} onClick={() => (step === 'a' ? setStep('handover') : void save(sb))}>
        {step === 'a' ? t('rate.next') : t('rate.done')}
      </button>
      <div class="row">
        <button class="btn ghost" onClick={() => go('/')}>{t('rate.later')}</button>
        <button class="btn ghost" onClick={() => void skip()}>{t('rate.skip')}</button>
      </div>
    </div>
  );
}
