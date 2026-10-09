import { signal } from '@preact/signals';
import type { Area, Settings } from './lib/types';
import { db, getSettings } from './db';
import { setLang } from './i18n';

export const settings = signal<Settings | undefined>(undefined);
export const area = signal<Area | undefined>(undefined);
export const ready = signal(false);

export async function loadState() {
  settings.value = await getSettings();
  area.value = await db.area.get('current');
  if (settings.value) setLang(settings.value.language);
  ready.value = true;
}

export const route = signal(currentHash());

function currentHash() {
  return location.hash.replace(/^#/, '') || '/';
}

export function go(path: string) {
  if (location.hash.replace(/^#/, '') === path) route.value = path;
  else location.hash = path;
}

window.addEventListener('hashchange', () => {
  route.value = currentHash();
  window.scrollTo(0, 0);
});
