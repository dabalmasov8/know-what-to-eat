import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { go, loadState } from '../state';
import { buildBackup, parseBackup, restoreBackup } from '../lib/backup';
import { requestPersistence } from '../db';
import { getPasscode, setPasscode } from '../lib/api';
import { PasscodeForm } from './ErrorBox';

const FEEDBACK_URL = 'https://github.com/dabalmasov8/know-what-to-eat/issues';

export function DataPanel() {
  const [msg, setMsg] = useState('');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [changePass, setChangePass] = useState(false);

  useEffect(() => {
    void (navigator.storage?.persisted ? navigator.storage.persisted() : Promise.resolve(false)).then(async (p) => setPersisted(p || (await requestPersistence())));
  }, []);

  async function doExport() {
    const blob = new Blob([JSON.stringify(await buildBackup(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `food-picker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function doImport(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      if (!window.confirm(t('data.import.confirm'))) return;
      await restoreBackup(backup);
      await loadState();
      setMsg(t('data.import.ok'));
      go(backup.settings ? '/discover' : '/');
    } catch {
      setMsg(t('data.import.error'));
    }
  }

  return (
    <section class="stack" aria-labelledby="data-h">
      <h2 id="data-h">{t('data.title')}</h2>
      <div class="row">
        <button class="btn secondary" onClick={() => void doExport()}>⬇️ {t('data.export')}</button>
        <label class="btn secondary" style="cursor:pointer">
          ⬆️ {t('data.import')}
          <input type="file" accept="application/json,.json" class="sr-only" onChange={(e) => void doImport(e)} />
        </label>
      </div>
      {msg && <p role="status">{msg}</p>}
      {persisted !== null && <p class="small muted">{persisted ? t('data.persist.yes') : t('data.persist.no')}</p>}
      {getPasscode() !== '' || changePass ? (
        changePass ? <PasscodeForm onDone={() => setChangePass(false)} /> : <button class="btn ghost" onClick={() => { setPasscode(''); setChangePass(true); }}>{t('passcode.reset')}</button>
      ) : null}

      <h2>{t('privacy.title')}</h2>
      <p class="small">{t('privacy.body1')}</p>
      <p class="small">{t('privacy.body2')}</p>
      <p class="small">{t('privacy.body3')}</p>
      <p><a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">{t('feedback.link')}</a></p>
    </section>
  );
}
