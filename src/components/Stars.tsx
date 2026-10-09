import { t } from '../i18n';

export function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div class="row" role="radiogroup" aria-label="1-5" style="justify-content:center;gap:6px">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t('rate.star', { n })}
          onClick={() => onChange(n)}
          style={`width:56px;height:56px;border-radius:14px;border:2px solid ${value >= n ? '#c2410c' : '#ead9c6'};background:${value >= n ? '#ffe8d6' : '#fff'};font-size:1.7rem;cursor:pointer;line-height:1`}
        >
          {value >= n ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}
