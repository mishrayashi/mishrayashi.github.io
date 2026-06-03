// One-off: capture fresh desktop + mobile screenshots of the live dev site
// for the PWA preview images. Drives the system-installed Chrome via
// playwright-core (no bundled browser download). Run with the dev server up.
import { chromium } from 'playwright-core';
import { existsSync } from 'fs';

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = CHROME_CANDIDATES.find(existsSync);
if (!executablePath) { console.error('No Chrome/Edge found'); process.exit(1); }

const BASE = 'http://localhost:5173';
const OUT = 'client/public/screenshots';

const shots = [
  { name: 'desktop-wide.png', width: 1280, height: 800, hash: '#gui' },
  { name: 'mobile-narrow.png', width: 375, height: 812, hash: '#gui' },
];

const browser = await chromium.launch({ executablePath, headless: true });
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${s.hash}`, { waitUntil: 'networkidle', timeout: 30000 });
  // Wait for the visitor's name to actually render (data loaded + hero in).
  try {
    await page.getByText(/YASHI MISHRA/i).first().waitFor({ timeout: 15000 });
  } catch { /* fall through — capture whatever rendered */ }
  await page.waitForTimeout(2500); // let Framer Motion settle
  await page.screenshot({ path: `${OUT}/${s.name}` });
  console.log(`captured ${s.name} (${s.width}x${s.height})`);
  await ctx.close();
}
await browser.close();
console.log('done');
