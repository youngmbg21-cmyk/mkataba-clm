/* Chromium verification: HOME'S CLAUSES KEEP THEIR COLOUR FILTER (BUGLOG
   11 Oct 2026, fixed 12 Oct). The room's Document tab remembered the Clauses
   list's colour filter across a refresh; on Home's Document it was lost, and
   a filter set on one contract also carried over to the next.

   1 a filter set on Home's Clauses tab comes back after a refresh
   2 another contract opens on All
   Run: node test/chromium/clauses-filter-kept-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const CHIPS = () => [...document.querySelectorAll('#pd-thread [data-th-tone]')]
  .filter(x => x.getAttribute('aria-pressed') === 'true').map(x => x.getAttribute('data-th-tone') || 'all');

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    const [a, b] = [FIXTURES[0].id, FIXTURES[1].id];
    await page.waitForFunction(ids => window.state && ids.every(id => state.contracts.some(c => c.id === id)), [a, b], { timeout: 20000 });
    const openClauses = async id => {
      for (let i = 0; i < 3; i++) {
        await page.evaluate(cid => pdOpenOnHome(cid, 'doc'), id);
        const up = await page.waitForFunction(cid => !!(window.intel && intel.paper && intel.paper.id === cid
          && document.querySelector('#pd-thread [data-th-tone]')), id, { timeout: 6000 }).then(() => true, () => false);
        if (up) return true;
      }
      return false;
    };
    const up = await openClauses(a);
    if (!up) { ok('1 the filter comes back after a refresh', false, 'Clauses never drawn'); ok('2 another contract opens on All', false, 'not reached'); }
    else {
      /* the chip's own press function (a fixture's clauses may carry no marks, which greys the chip) */
      await page.evaluate(cid => docThreadFilterSet(getContract(cid), 'amber'), a);
      const before = await page.evaluate(CHIPS);
      await page.reload({ waitUntil: 'networkidle' });
      const back = await page.waitForFunction(cid => !!(window.intel && intel.paper && intel.paper.id === cid
        && document.querySelector('#pd-thread [data-th-tone]')), a, { timeout: 15000 }).then(() => true, () => false);
      const after = back ? await page.evaluate(CHIPS) : null;
      ok('1 a filter set on Home\'s Clauses comes back after a refresh', before.join() === 'amber' && back && (after || []).join() === 'amber',
        JSON.stringify({ before, after }));
      await openClauses(b);
      const other = await page.evaluate(CHIPS);
      ok('2 another contract opens on All', other.join() === 'all', JSON.stringify(other));
    }
    ok('3 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } finally { await browser.close(); await h.stop(); }
  console.log(`${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
