/* ============================================================
   THE CONTRACT'S VIEWS ON THE BOARD ARE GONE (owner, 15 Oct 2026: "the whole
   page needs to go as they are redundant and already included in other
   pages. History is in the board contract card, obligations has its own
   panel and your book is useless"; then "Obligations page, filtered").
   ============================================================
   Was stage 4 of the one-page Home plan (Your book · Deal board · Obligations
   · History, with Print · Share · Download). This file now pins the removal
   and where each old door lands, in a real browser:
     1  with a contract on the paper the Board draws no switch and no view
     2  the old Obligations door opens the Obligations page narrowed to the
        contract — its own table (tabs, amounts, panel) and a chip back
     3  the old History door opens the History page of the Board's contract card
     4  any other old door (Deal board) opens the card's Where we are
     5  Jambo's words: no "deal board" place; "history" opens the card
   AT THE PARENT 1–4 FAIL: the switch and the views are drawn there.
     node test/chromium/board-views-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-views');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const check = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = (page, fn, ms = 8000, arg) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await (await browser.newContext({ viewport: { width: 1536, height: 730 } })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B1'), 20000);
    const ID = 'MK-B1';

    /* 1 no switch, with a contract on the paper */
    await page.evaluate(id => { setView('dashboard'); igAnalyze(id); }, ID);
    await waitFor(page, () => window.intel && intel.paper && intel.paper.id === 'MK-B1', 8000);
    await page.evaluate(() => hbSetFace('board'));
    await waitFor(page, () => hbFace() === 'board', 6000);
    await page.waitForTimeout(600);
    const sw = await page.evaluate(() => ({ seg: !!document.querySelector('.hb-cv-seg, [data-hb-cv]'), body: !!document.querySelector('#hb-cv-body') }));
    check('1 with a contract on the paper the Board draws no switch and no view', !sw.seg && !sw.body, JSON.stringify(sw));

    /* 2 Obligations → the Obligations page, narrowed */
    await page.evaluate(async id => { const c = getContract(id); if (typeof ensureFull === 'function') await ensureFull(c);
      c.obligations = [{ id: 'bv1', desc: 'Monthly volume report', due: '2026-01-05', status: 'open', party: 'ours' },
        { id: 'bv2', desc: 'Deliver insurance certificate', due: '2099-01-05', status: 'open', party: 'theirs' }]; persist(c); }, ID);
    await page.waitForTimeout(800);
    await page.evaluate(id => hbOpenView(id, 'oblig'), ID);
    const ob = await waitFor(page, id => state.view === 'obligations' && !!document.querySelector(`#obw-one-host[data-ins-cid="${id}"]`) && !!document.querySelector('#obw-only'), 8000, ID);
    const obd = await page.evaluate(() => ({ view: state.view, rows: document.querySelectorAll('#obw-one-host [data-ins-row], #obw-one-host .obt-row').length, chip: (document.querySelector('#obw-only') || {}).textContent || '' }));
    check('2 the old Obligations door opens the Obligations page narrowed to the contract, its own table and a chip back', ob && obd.rows === 2, JSON.stringify(obd));
    await page.screenshot({ path: path.join(OUT, '2-obligations-page.png') });
    await page.click('#obw-only [data-obw-only-clear]').catch(() => {});
    const cleared = await waitFor(page, () => state.view === 'obligations' && !document.querySelector('#obw-one-host'), 6000);
    check('2b the chip\'s × goes back to every contract\'s obligations', cleared);

    /* 3 History → the card's History page */
    await page.evaluate(id => hbOpenView(id, 'hist'), ID);
    check('3 the old History door opens the History page of the Board\'s contract card',
      await waitFor(page, id => state.view === 'dashboard' && !!document.querySelector(`#bs-strip-${id} [data-bs-host="hist"]`), 8000, ID));

    /* 4 anything else → Where we are */
    await page.evaluate(id => hbOpenView(id, 'deal'), ID);
    check('4 the old Deal board door opens the card\'s Where we are',
      await waitFor(page, id => { const s = document.querySelector('#bs-strips > .bs-strip'); return state.view === 'dashboard' && !!s && s.getAttribute('data-bs-id') === id && s.getAttribute('data-bs-on') === 'where'; }, 8000, ID));

    /* 5 Jambo's words */
    const words = await page.evaluate(() => ({ deal: ((typeof caActOf === 'function' && caActOf('deal board')) || {}).place || null }));
    check('5 "deal board" is no longer one of Jambo\'s places', words.deal !== 'deal', JSON.stringify(words));

    check('6 no page errors', errs.length === 0, errs.slice(0, 2).join(' | ') || null);
  } catch (e) { fail++; console.log('FAIL  the run completed — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
