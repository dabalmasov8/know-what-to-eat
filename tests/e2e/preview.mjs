// Captures every screen to e2e-shots/preview/*.png and builds a contact sheet.
import { launch, BASE, answerAll } from './lib.mjs';
const OUT = 'e2e-shots/preview';
const { browser, context, page } = await launch();
const shots = [];
const snap = async (name, full = false) => { await page.waitForTimeout(250); await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full }); shots.push(name); };

await page.goto(BASE); await page.waitForSelector('h1');
await snap('01-home-first-run');
await page.click('text=Set up'); await page.waitForSelector('#nameA');
await snap('02-setup', true);
await page.fill('#nameA', 'Anna'); await page.fill('#nameB', 'Max'); await page.fill('#postcode', '00-001'); await page.fill('#radius', '5');
await page.click('button[type=submit]');
await page.waitForSelector('#passcode');
await snap('03-passcode');
await page.fill('#passcode', 'dev'); await page.click('text=Unlock');
await page.waitForSelector('[data-testid=cuisine-counts]');
await snap('04-discovery-results', true);
await page.click('text=Start choosing'); await page.waitForSelector('text=Anna, your turn');
await snap('05-vote-card');
await answerAll(page, ['Thai', 'Pizza']);
await snap('06-handover');
await page.click('text=I’m Max'); await answerAll(page, ['Thai', 'Pizza']);
await page.waitForSelector('text=Pick randomly among these');
await snap('07-result-several-matches');
await page.click('button.secondary:has-text("Thai")');
await page.waitForSelector('[data-testid=place-card]');
await snap('08-places-list', true);
await page.click('[data-testid=place-card] >> nth=0 >> button.big');
await page.waitForSelector('text=Enjoy your meal');
await snap('09-visit-confirmed');
// no match -> wheel
await page.goto(BASE + '/#/vote'); await page.reload(); await page.waitForSelector('text=Anna, your turn');
await answerAll(page, ['Thai', 'Polish', 'Georgian']); await page.click('text=I’m Max'); await answerAll(page, ['Pizza']);
await page.waitForSelector('text=No match this time');
await snap('10-result-no-match');
await page.click('text=Spin the wheel'); await page.waitForSelector('[data-testid=wheel]');
await snap('11-wheel');
await page.click('button:has-text("Pick for us")'); await page.waitForSelector('[data-testid=winner]');
await snap('12-wheel-winner');
// rating
await page.evaluate(async () => {
  const req = indexedDB.open('food-picker'); const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
  const tx = db.transaction('visits', 'readwrite'); const st = tx.objectStore('visits');
  const all = await new Promise((r) => { const g = st.getAll(); g.onsuccess = () => r(g.result); });
  for (const v of all) { v.created_at -= 3 * 3600000; st.put(v); } await new Promise((r) => (tx.oncomplete = r));
});
await page.goto(BASE + '/#/'); await page.reload(); await page.waitForSelector('text=Rate it');
await snap('13-home-rating-banner');
await page.click('text=Rate it'); await page.waitForSelector('text=Anna, give it');
await page.click('[aria-label="5 of 5 stars"]');
await snap('14-rate-person-a');
await page.click('text=Next'); await snap('15-rate-handover');
await page.click('text=I’m Max'); await page.click('[aria-label="4 of 5 stars"]'); await page.click('text=Save our rating');
await page.waitForSelector('text=Our rating');
await snap('16-rate-result');
await page.goto(BASE + '/#/history'); await page.reload(); await page.waitForSelector('ul li'); await snap('17-history');
await page.goto(BASE + '/#/leaderboard'); await page.reload(); await page.waitForSelector('ol li'); await snap('18-leaderboard');
await page.goto(BASE + '/#/places/thai'); await page.reload(); await page.waitForSelector('[data-testid=place-card]'); await snap('19-places-with-our-rating');
await page.goto(BASE + '/#/settings'); await page.reload(); await page.waitForSelector('text=Your data'); await snap('20-settings-data-privacy', true);
await page.click('button[lang=uk]'); await page.goto(BASE + '/#/'); await page.reload(); await page.waitForSelector('h1'); await snap('21-home-ukrainian');
await page.goto(BASE + '/#/vote'); await page.reload(); await page.waitForSelector('text=твоя черга'); await snap('22-vote-ukrainian');
await page.click('button[lang=en]');
await page.goto(BASE + '/#/discover');
await page.evaluate(() => { indexedDB.open('food-picker').onsuccess = (e) => e.target.result.transaction('area', 'readwrite').objectStore('area').clear(); });
await page.waitForTimeout(300);
await context.setOffline(true); await page.reload(); await page.waitForSelector('.banner.bad'); await snap('23-offline-error');
await context.setOffline(false);

// contact sheet
const sheet = await browser.newPage({ viewport: { width: 1800, height: 900 } });
const imgs = shots.map((n) => `<figure><img src="file://${process.cwd()}/${OUT}/${n}.png"><figcaption>${n}</figcaption></figure>`).join('');
await sheet.setContent(`<body style="margin:0;background:#ddd;font:14px sans-serif"><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;padding:12px">${imgs}</div><style>figure{margin:0;background:#fff;padding:6px;border-radius:8px}img{width:100%;height:480px;object-fit:cover;object-position:top;display:block}figcaption{padding:4px;text-align:center}</style></body>`);
await sheet.waitForTimeout(800);
await sheet.screenshot({ path: `${OUT}/contact-sheet.png`, fullPage: true });
await browser.close();
console.log(shots.length, 'screens');
