import { chromium } from 'playwright-core';
export const BASE = process.env.BASE_URL || 'http://localhost:8787';
export async function launch() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'allow' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return { browser, context, page, errors };
}
export function check(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) process.exitCode = 1;
}

/** Fresh setup through the UI against the mock proxy, ending on the discovery results. */
export async function setupApp(page, radius = 5) {
  await page.goto(BASE);
  await page.click('text=Set up');
  await page.fill('#nameA', 'Anna');
  await page.fill('#nameB', 'Max');
  await page.fill('#postcode', '00-001');
  await page.fill('#radius', String(radius));
  await page.click('button[type=submit]');
  await page.waitForSelector('#passcode');
  await page.fill('#passcode', 'dev');
  await page.click('text=Unlock');
  await page.waitForSelector('[data-testid=cuisine-counts]');
}

/** Answer every card for the current person; yesSet = English cuisine labels answered "Yes". */
export async function answerAll(page, yesSet) {
  const seen = [];
  for (;;) {
    const label = await page.textContent('.card >> div:nth-of-type(2)');
    seen.push(label);
    const last = /(\d+) of (\d+)/.exec(await page.textContent('[role=status]'));
    await page.click(yesSet.includes(label) ? 'button:has-text("Yes")' : 'button:has-text("No")');
    if (last[1] === last[2]) break;
  }
  return seen;
}
