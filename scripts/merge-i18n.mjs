// usage: node scripts/merge-i18n.mjs <en-fragment.json> <uk-fragment.json>
import { readFileSync, writeFileSync } from 'node:fs';
for (const [lang, frag] of [['en', process.argv[2]], ['uk', process.argv[3]]]) {
  const file = `src/i18n/${lang}.json`;
  let cur = {};
  try { cur = JSON.parse(readFileSync(file, 'utf8')); } catch { /* new */ }
  Object.assign(cur, JSON.parse(readFileSync(frag, 'utf8')));
  writeFileSync(file, JSON.stringify(cur, null, 2) + '\n');
}
