// Renders public/icon.svg to the PNG icons using the preinstalled Chromium.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const svg = readFileSync('public/icon.svg', 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
async function render(size, file, pad = 0) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = size - pad * 2;
  await page.setContent(`<body style="margin:0;background:#e8590c"><div style="padding:${pad}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body>`);
  await page.screenshot({ path: file });
  await page.close();
}
await render(192, 'public/icon-192.png');
await render(512, 'public/icon-512.png');
await render(512, 'public/icon-maskable-512.png', 64);
await render(180, 'public/apple-touch-icon.png');
await browser.close();
