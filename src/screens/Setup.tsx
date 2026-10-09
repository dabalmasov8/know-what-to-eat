import { useState } from 'preact/hooks';
import { t, lang } from '../i18n';
import { COUNTRIES, formatPostcode, isValidPostcode, ruleFor } from '../lib/postcode';
import { DEFAULT_RADIUS_KM, DEFAULT_RATING_DELAY_HOURS, MAX_RADIUS_KM, MIN_RADIUS_KM } from '../lib/constants';
import type { Mode, Settings } from '../lib/types';
import { requestPersistence, saveSettings } from '../db';
import { area, go, settings } from '../state';

export function Setup() {
  const cur = settings.value;
  const [nameA, setNameA] = useState(cur?.names[0] ?? '');
  const [nameB, setNameB] = useState(cur?.names[1] ?? '');
  const [country, setCountry] = useState(cur?.country ?? 'PL');
  const [postcode, setPostcode] = useState(cur?.postcode ?? '');
  const [radius, setRadius] = useState(cur?.radius_km ?? DEFAULT_RADIUS_KM);
  const [mode, setMode] = useState<Mode>(cur?.mode ?? 'dine_in');
  const [delay, setDelay] = useState(cur?.rating_delay_hours ?? DEFAULT_RATING_DELAY_HOURS);
  const [submitted, setSubmitted] = useState(false);

  const postcodeOk = isValidPostcode(postcode, country);
  const namesOk = nameA.trim() !== '' && nameB.trim() !== '';

  async function submit(e: Event) {
    e.preventDefault();
    setSubmitted(true);
    if (!postcodeOk || !namesOk) return;
    const next: Settings = {
      id: 'main',
      language: lang.value,
      postcode: postcode.trim().toUpperCase(),
      country,
      radius_km: radius,
      mode,
      names: [nameA.trim(), nameB.trim()],
      rating_delay_hours: Math.max(0, Number(delay) || 0),
    };
    await saveSettings(next);
    void requestPersistence();
    settings.value = next;
    const a = area.value;
    const sameArea = a && a.postcode === next.postcode && a.country === next.country && a.radius_km === next.radius_km;
    go(sameArea ? '/' : '/discover');
  }

  return (
    <form onSubmit={submit} noValidate class="stack">
      <h1>{cur ? t('setup.title.edit') : t('setup.title')}</h1>

      <fieldset style="border:0;padding:0;margin:0">
        <legend class="field">{t('setup.names')}</legend>
        <label class="field" for="nameA">{t('setup.nameA')}</label>
        <input id="nameA" type="text" value={nameA} maxLength={24} placeholder={t('setup.nameA.placeholder')} onInput={(e) => setNameA(e.currentTarget.value)} autocomplete="off" />
        <label class="field" for="nameB">{t('setup.nameB')}</label>
        <input id="nameB" type="text" value={nameB} maxLength={24} placeholder={t('setup.nameB.placeholder')} onInput={(e) => setNameB(e.currentTarget.value)} autocomplete="off" />
        {submitted && !namesOk && <p class="err" role="alert">{t('setup.name.required')}</p>}
      </fieldset>

      <div>
        <label class="field" for="country">{t('setup.country')}</label>
        <select id="country" value={country} onChange={(e) => { setCountry(e.currentTarget.value); setPostcode(''); }}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{t(`country.${c.code}`)}</option>)}
        </select>
        <label class="field" for="postcode">{t('setup.postcode')}</label>
        <input id="postcode" type="text" inputMode={country === 'GB' ? 'text' : 'numeric'} autocomplete="postal-code" value={postcode} placeholder={ruleFor(country).example}
          aria-invalid={submitted && !postcodeOk} aria-describedby="pc-err"
          onInput={(e) => setPostcode(formatPostcode(e.currentTarget.value, country))} />
        <div id="pc-err">{submitted && !postcodeOk && <p class="err" role="alert">{t('setup.postcode.invalid', { example: ruleFor(country).example })}</p>}</div>
      </div>

      <div>
        <label class="field" for="radius">{t('setup.radius')}: <strong>{t('setup.radius.value', { km: radius })}</strong></label>
        <input id="radius" type="range" min={MIN_RADIUS_KM} max={MAX_RADIUS_KM} step={1} value={radius} onInput={(e) => setRadius(Number(e.currentTarget.value))} />
      </div>

      <div>
        <div class="field" id="mode-label">{t('setup.mode')}</div>
        <div class="seg full" role="group" aria-labelledby="mode-label">
          {(['dine_in', 'delivery'] as Mode[]).map((m) => (
            <button type="button" key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{t(`setup.mode.${m}`)}</button>
          ))}
        </div>
      </div>

      {cur && (
        <div>
          <label class="field" for="delay">{t('setup.delay')}</label>
          <input id="delay" type="text" inputMode="numeric" value={delay} onInput={(e) => setDelay(Number(e.currentTarget.value.replace(/\D/g, '')) || 0)} />
        </div>
      )}

      <button class="btn big block" type="submit">{cur ? t('setup.save.edit') : t('setup.save')}</button>
    </form>
  );
}
