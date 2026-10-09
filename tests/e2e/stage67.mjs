import { launch, check, setupApp, answerAll, BASE } from './lib.mjs';
const { browser, page, errors } = await launch();
await setupApp(page);

async function pickAndGo(index) {
  await page.goto(BASE + '/#/vote');
  await page.reload();
  await page.waitForSelector('text=Anna, your turn');
  await answerAll(page, ['Thai']);
  await page.click('text=I’m Max');
  await answerAll(page, ['Thai']);
  await page.click('text=Find places');
  await page.waitForSelector('[data-testid=place-card]');
  const name = await page.textContent(`[data-testid=place-card] >> nth=${index} >> h2`);
  await page.click(`[data-testid=place-card] >> nth=${index} >> button.big`);
  await page.waitForSelector('text=Enjoy your meal');
  return name;
}
const backdate = (hours) => page.evaluate(async (h) => {
  const req = indexedDB.open('food-picker');
  const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
  const tx = db.transaction('visits', 'readwrite');
  const st = tx.objectStore('visits');
  const all = await new Promise((r) => { const g = st.getAll(); g.onsuccess = () => r(g.result); });
  for (const v of all) { v.created_at -= h * 3600000; st.put(v); }
  await new Promise((r) => (tx.oncomplete = r));
}, hours);

const first = await pickAndGo(0);
await page.click('text=Back to start');
check('no rating banner right after the visit (2 h delay)', !(await page.isVisible('text=How was')));
await backdate(3);
await page.reload();
await page.waitForSelector(`text=How was ${first}?`);
check('pending-rating banner after the delay', true);
await page.click('text=Rate it');
await page.waitForSelector('text=Anna, give it');
await page.click('[aria-label="5 of 5 stars"]');
await page.click('text=Next');
const hand = await page.textContent('main');
check('handover hides A score', hand.includes('Pass the phone to Max') && !hand.includes('5'));
await page.click('text=I’m Max');
await page.waitForSelector('text=Max, give it');
await page.click('[aria-label="4 of 5 stars"]');
await page.click('text=Save our rating');
await page.waitForSelector('text=Our rating: 4.5 / 5');
check('average saved and shown', true);
await page.click('text=Back to start');
check('banner gone after rating', !(await page.isVisible('text=How was')));

// second visit: skip
const second = await pickAndGo(1);
await backdate(3);
await page.goto(BASE + '/#/');
await page.reload();
await page.waitForSelector(`text=How was ${second}?`);
await page.click('text=Rate it');
await page.click('text=We didn’t go after all');
await page.waitForSelector('text=What shall we eat?');
check('skip removes the banner', !(await page.isVisible('text=How was')));

// leaderboard + history + our rating on the card
await page.click('text=Leaderboard');
await page.waitForSelector('ol li');
const board = await page.textContent('ol');
check('leaderboard shows place, avg 4.5, visit count', board.includes(first) && board.includes('4.5 / 5') && board.includes('1 visit'));
check('skipped visit is not on the leaderboard', !board.includes(second));
await page.screenshot({ path: 'e2e-shots/stage7-board.png' });
await page.click('ol li button');
await page.waitForSelector('[data-testid=place-card]');
check('reopen place shows our rating', (await page.textContent('[data-testid=place-card]')).includes('Our rating 4.5 (1×)'));
await page.goto(BASE + '/#/history');
await page.reload();
await page.waitForSelector('ul li');
const hist = await page.textContent('main');
check('history lists both visits with states', hist.includes(first) && hist.includes(second) && hist.includes('Skipped') && hist.includes('4.5'));
await page.screenshot({ path: 'e2e-shots/stage7-history.png' });

// Our rating on the places list
await page.goto(BASE + '/#/places/thai');
await page.reload();
await page.waitForSelector('[data-testid=place-card]');
check('places list shows our rating', (await page.textContent('main')).includes('Our rating 4.5'));
check('no console errors', errors.filter((e) => !/401/.test(e)).length === 0);
await browser.close();
