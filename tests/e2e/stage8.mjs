import { readFileSync } from 'node:fs';
import { launch, check, setupApp, answerAll, BASE } from './lib.mjs';
const axeSrc = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const { browser, context, page, errors } = await launch();
await setupApp(page);

async function axe(name) {
  await page.addScriptTag({ content: axeSrc });
  const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`));
  check(`a11y (axe wcag2aa) ${name}`, res.length === 0);
  if (res.length) console.log('   ', res);
}
async function targets(name) {
  const small = await page.evaluate(() => [...document.querySelectorAll('button, a.btn, a.brand, select, input:not(.sr-only):not([type=hidden]):not([type=checkbox])')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44) && !e.closest('.sr-only'); }).map((e) => `${e.tagName}.${e.className}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)} ${e.textContent.slice(0, 15)}`));
  check(`tap targets >= 44px ${name}`, small.length === 0);
  if (small.length) console.log('   ', small);
}

await axe('discover'); await targets('discover');
await page.click('text=Start choosing');
await page.waitForSelector('text=Anna, your turn');
await axe('vote'); await targets('vote');
await answerAll(page, ['Thai']);
await page.click('text=I’m Max');
await answerAll(page, ['Pizza']);
await page.click('text=Spin the wheel');
await page.waitForSelector('[data-testid=wheel]');
await axe('wheel'); await targets('wheel');
await page.click('text=Pick for us');
await page.click('text=Find places');
await page.waitForSelector('[data-testid=place-card]');
await axe('places'); await targets('places');
await page.click('[data-testid=place-card] >> nth=0 >> button.big');
await page.click('text=Back to start');
await axe('home'); await targets('home');
await page.goto(BASE + '/#/settings'); await page.reload();
await page.waitForSelector('text=Your data');
await axe('settings'); await targets('settings');
check('privacy note present', (await page.textContent('main')).includes('postcode, radius and search text go to this app’s server'));
check('persistence requested/reported', /Storage is protected|may clear this data/.test(await page.textContent('main')));
await page.goto(BASE + '/#/history'); await page.reload();
await page.waitForSelector('ul li');
await axe('history'); await targets('history');
await page.goto(BASE + '/#/leaderboard'); await page.reload();
await page.waitForSelector('text=Leaderboard');
await axe('leaderboard (empty)');

// Export / import round trip
await page.goto(BASE + '/#/settings'); await page.reload();
await page.waitForSelector('text=Export backup');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=Export backup')]);
const path = await dl.path();
const backup = JSON.parse(readFileSync(path, 'utf8'));
check('export has settings + visits, no Google place data', backup.settings.postcode === '00-001' && backup.visits.length === 1 && !JSON.stringify(backup).includes('rating_count'));
await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('food-picker'); q.onsuccess = r; q.onblocked = r; q.onerror = r; }));
await page.reload();
await page.waitForTimeout(300);
await page.goto(BASE + '/#/');
// Settings are gone: go through setup page to reach the importer? The importer lives in settings, so use a fresh state with settings re-created.
await page.reload();
check('data really wiped before import', (await page.textContent('main')).includes('Set up'));
await page.click('text=Set up');
await page.fill('#nameA', 'X'); await page.fill('#nameB', 'Y'); await page.fill('#postcode', '00-002');
await page.click('button[type=submit]');
await page.waitForSelector('#passcode, [data-testid=cuisine-counts]');
await page.goto(BASE + '/#/settings'); await page.reload();
await page.waitForSelector('text=Export backup');
page.on('dialog', (d) => d.accept());
await page.setInputFiles('input[type=file]', path);
await page.waitForSelector('text=Backup restored, text=Finding great places, text=Here’s what’s nearby, #passcode', { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(500);
const restored = await page.evaluate(async () => {
  const req = indexedDB.open('food-picker');
  const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
  const get = (s) => new Promise((r) => { const g = db.transaction(s).objectStore(s).getAll(); g.onsuccess = () => r(g.result); });
  return { settings: await get('settings'), visits: await get('visits') };
});
check('import restores settings and visits', restored.settings[0]?.postcode === '00-001' && restored.visits.length === 1);

// Bad file
await page.goto(BASE + '/#/settings'); await page.reload();
await page.waitForSelector('text=Export backup');
await page.setInputFiles('input[type=file]', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
await page.waitForSelector('text=isn’t a valid Food Picker backup');
check('invalid backup rejected with message', true);

// Offline: discovery shows a clear error
await page.goto(BASE + '/#/discover');
await context.setOffline(true);
await page.evaluate(() => { indexedDB.open('food-picker').onsuccess = (e) => { const tx = e.target.result.transaction('area', 'readwrite'); tx.objectStore('area').clear(); }; });
await page.waitForTimeout(300);
await page.reload();
await page.waitForSelector('.banner.bad', { timeout: 8000 });
check('offline discovery shows network error + retry', (await page.textContent('main')).includes('Can’t reach the server') && (await page.isVisible('text=Try again')));
await page.screenshot({ path: 'e2e-shots/stage8-offline.png' });
await context.setOffline(false);
check('no unexpected console errors', errors.filter((e) => !/401|ERR_INTERNET_DISCONNECTED|Failed to load resource|net::/.test(e)).length === 0);
if (errors.length) console.log(errors.slice(0, 5));
await browser.close();
