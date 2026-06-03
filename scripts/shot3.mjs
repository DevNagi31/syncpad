import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:3020';
const VW = 1440, VH = 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--hide-scrollbars', `--window-size=${VW},${VH}`],
  defaultViewport: { width: VW, height: VH, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 2 });
await page.goto(`${BASE}/doc/welcome`, { waitUntil: 'networkidle2' });
await page.waitForSelector('.cm-content', { timeout: 20000 });
await page.click('.cm-content');

// A document that has converged from two concurrent editors.
const text = `# Shared Document

Both tabs edited this concurrently — every replica converged to identical bytes.

## From tab A
- Designed the CRDT sync layer
- Added offline persistence in IndexedDB

## From tab B
- Wired up the SSE provider
- Built the live Markdown preview

> No locks. No last-writer-wins. The edits merged with **no conflict**.
`;
await page.keyboard.type(text, { delay: 6 });
await sleep(1500);
await page.screenshot({ path: 'docs/screenshots/03_two_tab_merge.png' });
console.log('✓ 03_two_tab_merge.png');
await browser.close();
