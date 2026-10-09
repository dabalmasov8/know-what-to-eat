import { signal } from '@preact/signals';
import en from './en.json';
import uk from './uk.json';

export type Lang = 'en' | 'uk';
export const LANGS: Lang[] = ['en', 'uk'];
const dicts: Record<Lang, Record<string, string>> = { en, uk };
const LS_KEY = 'fp.lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'en' || saved === 'uk') return saved;
  } catch {
    /* storage unavailable */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('uk') ? 'uk' : 'en';
}

export const lang = signal<Lang>(initialLang());

export function setLang(l: Lang) {
  lang.value = l;
  try {
    localStorage.setItem(LS_KEY, l);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}

/** Translate a key. Reads lang.value so components re-render on language change. */
export function t(key: string, params?: Record<string, string | number>): string {
  let s = dicts[lang.value][key] ?? dicts.en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function tPlural(key: string, n: number, params: Record<string, string | number> = {}): string {
  const rules = new Intl.PluralRules(lang.value);
  const cat = rules.select(n);
  const k = dicts[lang.value][`${key}.${cat}`] ? `${key}.${cat}` : `${key}.other`;
  return t(k, { n, ...params });
}
