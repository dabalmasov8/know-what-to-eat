import type { ComponentChildren } from 'preact';
import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { LANGS, lang, setLang, t } from '../i18n';
import { settings } from '../state';
import { saveSettings } from '../db';

export const online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);

interface BIPEvent extends Event {
  prompt(): Promise<void>;
}
const installEvent = signal<BIPEvent | null>(null);
const installDismissed = signal(false);

export function LangSwitch() {
  return (
    <div class="seg" role="group" aria-label={t('lang.label')}>
      {LANGS.map((l) => (
        <button
          key={l}
          aria-pressed={lang.value === l}
          lang={l}
          onClick={() => {
            setLang(l);
            if (settings.value) {
              settings.value = { ...settings.value, language: l };
              void saveSettings(settings.value);
            }
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function InstallBanner() {
  if (installDismissed.value || isStandalone()) return null;
  const ev = installEvent.value;
  if (!ev && !isIos()) return null;
  return (
    <div class="banner" role="region" aria-label={t('install.title')}>
      <strong>{t('install.title')}</strong>
      <p class="small">{ev ? t('install.body') : t('install.ios')}</p>
      <div class="row">
        {ev && (
          <button class="btn" onClick={() => void ev.prompt().then(() => (installEvent.value = null))}>
            {t('install.button')}
          </button>
        )}
        <button class="btn ghost" onClick={() => (installDismissed.value = true)}>
          {t('install.dismiss')}
        </button>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ComponentChildren }) {
  useEffect(() => {
    const on = () => (online.value = true);
    const off = () => (online.value = false);
    const bip = (e: Event) => {
      e.preventDefault();
      installEvent.value = e as BIPEvent;
    };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    window.addEventListener('beforeinstallprompt', bip);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('beforeinstallprompt', bip);
    };
  }, []);
  return (
    <>
      <header class="top">
        <a class="brand" href="#/">🍽️ {t('app.name')}</a>
        <div class="row">
          <LangSwitch />
          {settings.value && (
            <a class="btn ghost" href="#/settings" aria-label={t('nav.settings')}>
              ⚙️
            </a>
          )}
        </div>
      </header>
      {!online.value && (
        <div class="banner warn" role="status" style="margin:0 16px">
          {t('offline.banner')}
        </div>
      )}
      <main>{children}</main>
    </>
  );
}
