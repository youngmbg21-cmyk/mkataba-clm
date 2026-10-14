/* ============================================================
   A DOOR LOOKS LIKE A DOOR, AND CANCEL UNDOES (owner, 13 Oct 2026)
   ============================================================
   "add a cancel button to image 1 and make the deal, region, clause and
   words buttons to click on since it is simply not clear that you have doors
   to those tabs ... you should have a button directing you to click on the
   respective clauses otherwise you would not know that it is a door to the
   clause." Cancel: the owner picked "Undo and close".

   A  Complete the details: Cancel is the last button in the foot; it puts
      back what the boxes held when the page opened and closes the page;
      "Save and finish later" still keeps what was typed.
   B  (retired 13 Oct 2026: the Breakdown face was deleted by the owner; its
      reading is drawn on Document → Clauses, see stakes-verify.js)

     node test/chromium/doors-look-like-doors-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'doors-look-like-doors');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, arg, ms = 8000) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const deal = (id, name) => ({ id, contractNo: id, name, counterparty: 'Juno Limited', folder: 'proc', value: 900000, valueType: 'standard',
  status: 'Under Review', template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'KES' }, comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }], changes: [],
  body: '<h2>1. Term</h2><p>' + 'The agreement runs for two years from signature. '.repeat(6) + '</p><h2>2. Payment</h2><p>'
    + 'Invoices are paid within thirty days of receipt. '.repeat(6) + '</p>' });

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [deal('MK-B1', 'Haulage One')], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => typeof getContract === 'function' && !!getContract('MK-B1'), null, 15000);

    /* ===== A. COMPLETE THE DETAILS: CANCEL ===== */
    await page.evaluate(() => { setView('register'); openNewAgreement({ pick: { kind: 'tid', id: 'RM' } }); });
    await waitFor(page, () => !!document.getElementById('wz-counterparty'));
    await page.fill('#wz-counterparty', 'Original Ltd');
    await page.click('#na-create');
    /* A new draft lands beside the paper on Home now (the one-page Home plan,
       stage 2, 14 Oct 2026); the full page is the Details tab's own "Open the
       full form", pressed here as a reader in the room presses it. */
    await waitFor(page, () => !!document.getElementById('pd-fillface'), null, 10000);
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
       Details tab went home, and with it its "Open the full form" press
       ([data-det-full]) — Jambo's Fill in face draws no such door. The page
       itself is unchanged, so it is opened here by its own one door,
       openCompleteDetails, as A3 below already does. */
    await page.evaluate(() => { const i = intel.paper.id; openCompleteDetails(getContract(i)); });
    const cd = await waitFor(page, () => !!document.getElementById('cd-page'), null, 10000);
    const foot = cd ? await page.evaluate(() => [...document.querySelectorAll('#cd-page .cd-foot button')].map(b => b.id)) : [];
    check('A1 Complete the details has a Cancel, the last button in its foot', foot[foot.length - 1] === 'cd-cancel', JSON.stringify(foot));
    const id = await page.evaluate(() => state.activeId);
    const cp = '#cd-page [data-cd-key="counterparty"] input', val = '#cd-page [data-cd-key="value"] input';
    if (cd) {
      await page.fill(cp, 'Changed AB'); await page.press(cp, 'Tab');
      await page.fill(val, '5000'); await page.press(val, 'Tab');
      await pause(300);
      const typed = await page.evaluate(i => { const c = getContract(i); return { cp: c.counterparty, v: Number(c.value) }; }, id);
      await page.screenshot({ path: path.join(OUT, '01-complete-typed.png') });
      await page.click('#cd-cancel');
      await waitFor(page, () => !document.getElementById('cd-page'));
      await pause(300);
      const after = await page.evaluate(i => { const c = getContract(i); return { cp: c.counterparty, v: Number(c.value) || 0, open: !!document.getElementById('cd-page') }; }, id);
      check('A2 Cancel puts back what the boxes held and closes the page',
        typed.cp === 'Changed AB' && typed.v === 5000 && after.cp === 'Original Ltd' && after.v === 0 && !after.open,
        `typed ${JSON.stringify(typed)} → after ${JSON.stringify(after)}`);
      await page.evaluate(i => openCompleteDetails(getContract(i)), id);
      await waitFor(page, () => !!document.getElementById('cd-page'));
      await page.fill(val, '7000'); await page.press(val, 'Tab'); await pause(200);
      await page.click('#cd-later'); await pause(300);
      const kept = await page.evaluate(i => Number(getContract(i).value) || 0, id);
      check('A3 "Save and finish later" still keeps what was typed', kept === 7000, `value ${kept}`);
    }

    /* ===== B. THE BREAKDOWN PANEL — RETIRED 13 Oct 2026 =====
       The owner deleted Home's Breakdown face ("You were also supposed to
       delete breakdown"); its reading is drawn on Document → Clauses and is
       checked by stakes-verify.js. */

    check('9 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.log('FAIL  the run threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
