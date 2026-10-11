/* THE SIDE LIST'S COLUMNS NEVER PRINT OVER EACH OTHER (owner, 11 Oct 2026,
   docs/WORKORDER-four-builds.md item 4: "SEK 15.20M" ran into "In Review").

   Value and Stage never wrap, so a fixed share of the table let a long value
   spill into the next column. The table now sizes itself. This check opens the
   Board's side list from a figure, puts the longest value and stage the
   owner saw into its rows, and asks that no cell's words reach past its own
   cell. The same is asked of the Approvals table, whose head "Counterparty and
   agreement" ran into "Rule". */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'side-list-columns');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

/* every pair of neighbouring cells whose words reach past the left one's edge,
   where nothing clips them */
const SPILLS = sel => { const out = [];
  document.querySelectorAll(sel).forEach(t => t.querySelectorAll('tr').forEach(tr => {
    const c = [...tr.children];
    for (let i = 0; i < c.length - 1; i++) { const a = c[i];
      if (!a.textContent.trim() || !c[i + 1].textContent.trim()) continue;
      if (getComputedStyle(a).overflowX !== 'visible') continue;
      const r = document.createRange(); r.selectNodeContents(a);
      if (r.getBoundingClientRect().right > a.getBoundingClientRect().right + 1)
        out.push(a.textContent.trim().slice(0, 30) + ' | ' + c[i + 1].textContent.trim().slice(0, 20)); } }));
  return out; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    await page.evaluate(() => setView('dashboard'));

    /* 1. the side list */
    const fig = await until(page, () => !!document.querySelector('.hb-fig-main[data-hb-dig="f:live"]'), null, 10000);
    if (fig) await page.click('.hb-fig-main[data-hb-dig="f:live"]');
    const open = fig && await until(page, () => document.querySelectorAll('.hb-sheet-t tbody tr').length > 0);
    ok('1a a figure opens the side list with its rows', open);
    if (open) {
      await page.evaluate(() => document.querySelectorAll('.hb-sheet-t tbody tr').forEach((tr, i) => {
        tr.children[3].textContent = i % 2 ? 'SEK 15.20M' : 'KES 600M';
        tr.children[4].textContent = i % 2 ? 'In Review' : 'Executed'; }));
      const s = await page.evaluate(SPILLS, '.hb-sheet-t');
      ok('1b no value or stage prints over its neighbour', s.length === 0, s.slice(0, 3).join(' · ') || null);
      await page.screenshot({ path: path.join(OUT, '1-side-list.png') });
    }

    /* 2. the Approvals table, the same pattern */
    await page.evaluate(() => setView('approvals'));
    const ap = await until(page, () => !!document.querySelector('.ap-ins thead th'));
    ok('2a the Approvals table is drawn', ap);
    if (ap) { const s = await page.evaluate(SPILLS, '.ap-ins');
      ok('2b no heading or cell on Approvals prints over its neighbour', s.length === 0, s.slice(0, 3).join(' · ') || null); }
    ok('3 no page errors', errs.length === 0, errs.slice(0, 2).join(' | ') || null);
  } catch (e) { fail++; console.log('FAIL  the check threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
