/* Chromium verification: NOTHING IN THE PLAIN ENGLISH COLUMN IS DRAWN ON TOP OF ANYTHING ELSE — RETIRED
   ============================================================
   RETIRED IN PLACE 5 Oct 2026 (the Thread). The fault this file guarded (the "Reading…" lines drawn over a copy of the wording when a later page landed first) was a fault of the COLUMN: a mirror of the paper pushed down entry by entry. The Thread draws no mirror — each clause is a row and the reading sits inside the open row — so there is nothing to overlap. What survives (a page that lands first does not scramble the rows; a row still to come says Reading… on its own row) is driven in reading-in-the-background-verify.js.

   WHAT IS LEFT TO PROVE here is the retirement itself, on the real page —
   a build that still drew the old surface would pass thread-verify.js's
   positive claims and this file is the one that says the old thing is GONE.
   The Thread's own claims live in test/chromium/thread-verify.js and f507.
   Run: node test/chromium/plain-english-no-overlap-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
    await page.evaluate(() => { const c = state.contracts.find(x => x.status === 'Under Review') || state.contracts[0]; openWorkspace(c.id); });
    await page.waitForTimeout(1000);
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const got = await page.evaluate(() => ({
      gone: ['#doc-read', '.doc-read-wait', '.doc-read-note', '[data-doc-read]'].map(s => [s, !document.querySelector(s)]),
      thread: !!document.getElementById('doc-thread') && !document.getElementById('doc-thread').hidden
        && document.querySelectorAll('#doc-thread .doc-th-row').length > 0,
      names: ['docViewSet', 'docViewMode', 'docReadSet', 'docReadFlags', 'renderChecksCard', 'renderFeed'].filter(n => typeof window[n] === 'function'),
    }));
    for (const [sel, gone] of got.gone) check('the old surface is gone from the page: ' + sel, gone, gone ? 'absent' : 'still drawn');
    check('its doors are published no more', got.names.length === 0, got.names.join(', ') || 'none');
    check('and the Thread stands where it was', got.thread, got.thread ? 'drawn with rows' : 'no thread');
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
