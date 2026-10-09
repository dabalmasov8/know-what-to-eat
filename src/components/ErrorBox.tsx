import { useState } from 'preact/hooks';
import { t } from '../i18n';
import { ApiError, setPasscode } from '../lib/api';

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const known = ['network', 'unauthorized', 'postcode_not_found', 'rate_limited', 'locked', 'daily_cap', 'server_not_configured'];
    return known.includes(e.code) ? t(`discover.error.${e.code}`) : t('discover.error.other', { code: e.code });
  }
  return t('discover.error.other', { code: 'client' });
}

export function PasscodeForm({ onDone }: { onDone: () => void }) {
  const [v, setV] = useState('');
  return (
    <form
      class="card stack"
      onSubmit={(e) => {
        e.preventDefault();
        setPasscode(v.trim());
        onDone();
      }}
    >
      <h2 style="margin:0">{t('passcode.title')}</h2>
      <p class="muted small">{t('passcode.hint')}</p>
      <label class="field" for="passcode">{t('passcode.label')}</label>
      <input id="passcode" type="password" value={v} autocomplete="current-password" onInput={(e) => setV(e.currentTarget.value)} />
      <button class="btn block" type="submit" disabled={!v.trim()}>{t('passcode.submit')}</button>
    </form>
  );
}
