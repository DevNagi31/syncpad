import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:3020';
const OUT = 'docs/screenshots';
const VW = 1440, VH = 900;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--autoplay-policy=no-user-gesture-required',
    '--no-sandbox',
    '--hide-scrollbars',
    `--window-size=${VW},${VH}`,
  ],
  defaultViewport: { width: VW, height: VH, deviceScaleFactor: 2 },
});

async function newPage() {
  const p = await browser.newPage();
  await p.setViewport({ width: VW, height: VH, deviceScaleFactor: 2 });
  return p;
}

async function typeInto(page, text) {
  await page.waitForSelector('.cm-content', { timeout: 15000 });
  await page.click('.cm-content');
  await page.keyboard.type(text, { delay: 4 });
}

// 1) Landing — let the video + entrance animations settle
{
  const page = await newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await sleep(4000);
  await page.screenshot({ path: `${OUT}/01_landing.png` });
  await page.close();
  console.log('✓ 01_landing.png');
}

// 2) Editor — fresh doc with a representative Markdown sample
{
  const page = await newPage();
  await page.goto(`${BASE}/doc/demo-editor`, { waitUntil: 'networkidle2' });
  await typeInto(
    page,
    `# Meeting Notes\n\n## Agenda\n- Ship the CRDT sync layer\n- Review offline persistence\n- Demo the live preview\n\n> SyncPad converges to the **same state** on every replica.\n\n\`\`\`ts\nconst ydoc = new Y.Doc();\nydoc.getText('content');\n\`\`\`\n`
  );
  await sleep(1200);
  await page.screenshot({ path: `${OUT}/02_editor.png` });
  await page.close();
  console.log('✓ 02_editor.png');
}

// 3) Two-tab merge — two pages on the same doc, edits converge over SSE
{
  const doc = `merge-${Date.now()}`;
  const a = await newPage();
  const b = await newPage();
  await a.goto(`${BASE}/doc/${doc}`, { waitUntil: 'networkidle2' });
  await b.goto(`${BASE}/doc/${doc}`, { waitUntil: 'networkidle2' });
  await sleep(1500); // let both connect to SSE

  await typeInto(a, `# Shared Document\n\nWritten from tab A.\n`);
  await sleep(1000);
  await typeInto(b, `\nAnd this line came from tab B — no conflict.\n`);
  await sleep(2500); // allow convergence both ways

  // Screenshot tab A: it should now show both A's and B's contributions
  await a.bringToFront();
  await a.screenshot({ path: `${OUT}/03_two_tab_merge.png` });
  await a.close();
  await b.close();
  console.log('✓ 03_two_tab_merge.png');
}

await browser.close();
console.log('done');
