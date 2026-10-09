import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import { go } from '../state';
import { currentSession, saveSession, sessionCuisines } from '../session';
import { CUISINE_BY_ID } from '../lib/cuisine';
import { randomIndex, secureRandom, wheelSegments } from '../lib/voting';
import { targetRotation } from '../lib/wheel';

const COLORS = ['#ffd9b3', '#fff3b0', '#cdeac0', '#bde0fe', '#d7c6ff', '#ffc8dd'];
const SPIN_MS = 5000;

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

export function Wheel() {
  const s = currentSession.value;
  const order = sessionCuisines.value;
  const segs = s ? wheelSegments(order, s.answers.a, s.answers.b) : [];
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [animate, setAnimate] = useState(true);
  const timer = useRef<number>(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!s || segs.length === 0) {
    return (
      <div class="stack">
        <p>{t('wheel.nosession')}</p>
        <button class="btn" onClick={() => go('/vote')}>{t('wheel.start')}</button>
      </div>
    );
  }
  const n = segs.length;
  const slice = 360 / n;

  function spin(instant: boolean) {
    if (spinning || winner) return;
    const idx = randomIndex(n);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const jitter = secureRandom() * 2 - 1;
    const rot = targetRotation(idx, n, 5, jitter);
    const quick = instant || reduced;
    setAnimate(!quick);
    setRotation(rot);
    setSpinning(!quick);
    const finish = () => {
      setSpinning(false);
      setWinner(segs[idx]);
      void saveSession({ result_cuisine: segs[idx], result_type: 'wheel' });
    };
    if (quick) finish();
    else timer.current = window.setTimeout(finish, SPIN_MS + 100);
  }

  const labelFont = n > 14 ? 0 : n > 9 ? 7 : 9;
  return (
    <div class="stack" style="text-align:center">
      <h1>{t('wheel.title')}</h1>
      <p class="muted">{t('wheel.hint', { n })}</p>
      <div style="position:relative;max-width:340px;margin:0 auto" role="img" aria-label={t('wheel.aria', { n })}>
        <div aria-hidden="true" style="position:absolute;left:50%;top:-6px;transform:translateX(-50%);z-index:2;font-size:2rem;line-height:1;color:#c2410c;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))">▼</div>
        <svg viewBox="-100 -100 200 200" style={`width:100%;display:block;transform:rotate(${rotation}deg);transition:${animate ? `transform ${SPIN_MS}ms cubic-bezier(0.12,0.7,0.1,1)` : 'none'}`} data-testid="wheel">
          <circle r="99" fill="#fff" stroke="#c2410c" stroke-width="2" />
          {segs.map((c, i) => {
            const a0 = i * slice;
            const a1 = (i + 1) * slice;
            const [x0, y0] = polar(98, a0);
            const [x1, y1] = polar(98, a1);
            const mid = a0 + slice / 2;
            const [tx, ty] = polar(n > 14 ? 76 : 62, mid);
            const fill = i === n - 1 && n > 1 && i % COLORS.length === 0 ? COLORS[3] : COLORS[i % COLORS.length];
            const path = n === 1 ? 'M0 -98 A98 98 0 1 1 -0.01 -98 Z' : `M0 0 L${x0} ${y0} A98 98 0 ${slice > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
            return (
              <g key={c}>
                <path d={path} fill={fill} stroke="#fff" stroke-width="1" />
                <g transform={`translate(${tx} ${ty}) rotate(${mid < 180 ? mid - 90 : mid + 90})`}>
                  <text text-anchor="middle" font-size={n > 14 ? 13 : 14} dy="-1">{CUISINE_BY_ID[c].emoji}</text>
                  {labelFont > 0 && <text text-anchor="middle" font-size={labelFont} dy="10" fill="#2b2118" font-weight="700">{t(`cuisine.${c}`).split(' / ')[0]}</text>}
                </g>
              </g>
            );
          })}
          <circle r="9" fill="#c2410c" />
        </svg>
      </div>

      <div aria-live="assertive" style="min-height:3.5rem">
        {winner && (
          <div class="card" style="border-color:#c2410c;border-width:2px" data-testid="winner">
            <div style="font-size:2.4rem" aria-hidden="true">{CUISINE_BY_ID[winner].emoji}</div>
            <strong style="font-size:1.4rem">{t('wheel.winner', { cuisine: t(`cuisine.${winner}`) })}</strong>
          </div>
        )}
      </div>

      {winner ? (
        <button class="btn big block" onClick={() => go(`/places/${winner}`)}>{t('wheel.find')}</button>
      ) : (
        <div class="row">
          <button class="btn big grow" disabled={spinning} onClick={() => spin(false)}>{spinning ? t('wheel.spinning') : `🎡 ${t('wheel.spin')}`}</button>
          <button class="btn secondary big grow" disabled={spinning} onClick={() => spin(true)}>{t('wheel.pick')}</button>
        </div>
      )}
    </div>
  );
}
