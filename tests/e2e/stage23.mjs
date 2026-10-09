import { launch, check, setupApp, answerAll, BASE } from './lib.mjs';
const { browser, page, errors } = await launch();
await setupApp(page);
await page.click('text=Start choosing');
await page.waitForSelector('text=Anna, your turn');
const cards = await answerAll(page, ['Thai']);
check('A answered all cards', cards.length >= 10);
const handover = await page.textContent('main');
check('handover hides answers and cuisine names', handover.includes('Pass the phone to Max') && !handover.includes('Thai'));
await page.click('text=I’m Max');
await page.waitForSelector('text=Max, your turn');
await answerAll(page, ['Thai', 'Pizza']);
await page.waitForSelector('text=You both said yes to Thai');
check('single match found', true);
await page.screenshot({ path: 'e2e-shots/stage2-match.png' });

// Several matches
await page.goto(BASE + '/#/vote');
await page.reload();
await page.waitForSelector('text=Anna, your turn');
await answerAll(page, ['Thai', 'Pizza', 'Polish']);
await page.click('text=I’m Max');
await answerAll(page, ['Thai', 'Pizza', 'Indian']);
await page.waitForSelector('text=Pick randomly among these');
const matchBtns = await page.$$eval('main button.secondary', (b) => b.map((x) => x.textContent));
check('several matches listed (Thai, Pizza)', matchBtns.length === 2);
await page.click('text=Pick randomly among these');
await page.waitForURL(/#\/places\/(thai|pizza)$/);
check('random pick routes to places', true);
const sessions = await page.evaluate(async () => {
  const req = indexedDB.open('food-picker');
  const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
  return await new Promise((r) => { const g = db.transaction('sessions').objectStore('sessions').getAll(); g.onsuccess = () => r(g.result); });
});
check('sessions saved with result', sessions.length >= 2 && sessions.some((s) => s.result_type === 'match' && s.result_cuisine));

// No match -> wheel (union of yes = Thai, Polish, Pizza)
await page.goto(BASE + '/#/vote');
await page.reload();
await page.waitForSelector('text=Anna, your turn');
await answerAll(page, ['Thai', 'Polish']);
await page.click('text=I’m Max');
await answerAll(page, ['Pizza']);
await page.waitForSelector('text=No match this time');
await page.click('text=Spin the wheel');
await page.waitForSelector('[data-testid=wheel]');
const segs = await page.$$eval('[data-testid=wheel] g g text:nth-of-type(2)', (t) => t.map((x) => x.textContent));
check('wheel segments = union of yes answers', segs.sort().join() === ['Pizza', 'Polish', 'Thai'].sort().join());
await page.click('button:has-text("Spin")');
const t0 = Date.now();
await page.waitForSelector('[data-testid=winner]', { timeout: 9000 });
check('spin animates ~5s then shows winner', Date.now() - t0 > 3500);
const winner = await page.textContent('[data-testid=winner] strong');
check('winner is one of the segments', ['Pizza', 'Polish', 'Thai'].some((w) => winner.includes(w)));
await page.screenshot({ path: 'e2e-shots/stage3-wheel.png' });

// No/no -> wheel with ALL cuisines; "Pick for us" with reduced motion is instant
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(BASE + '/#/vote');
await page.reload();
await page.waitForSelector('text=Anna, your turn');
await answerAll(page, []);
await page.click('text=I’m Max');
await answerAll(page, []);
await page.click('text=Spin the wheel');
await page.waitForSelector('[data-testid=wheel]');
const all = await page.$$eval('[data-testid=wheel] g g text:nth-of-type(1)', (t) => t.length);
check('no/no wheel has all cuisines', all >= 10);
await page.click('button:has-text("Pick for us")');
await page.waitForSelector('[data-testid=winner]', { timeout: 1000 });
check('pick for us is instant', true);
await page.screenshot({ path: 'e2e-shots/stage3-wheel-all.png' });
check('no console errors', errors.filter((e) => !/401/.test(e)).length === 0);
await browser.close();
