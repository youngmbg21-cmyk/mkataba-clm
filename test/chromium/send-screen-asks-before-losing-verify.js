/* ============================================================
   THE SEND SCREEN ASKS BEFORE A TYPED NOTE IS LOST (22 Oct 2026, the bug log:
   "pressing another desk tab while the send screen is up closes it without
   asking, so a typed note is lost")
   ============================================================
   Driven in a real browser, with presses:
     1  nothing typed: Cancel closes at once, no question
     2  a note typed, the bar's HaTi pressed: "Leave without sending?" asks;
        Keep writing leaves the screen up with the note whole
     3  asked again, Discard the note: the screen goes and Home comes up
     4  a note typed, Cancel asks too
     5  the owner's three screens: the question stands whole, nothing sideways
   Red at the parent: the bar closed the screen with no question.
     node test/chromium/send-screen-asks-before-losing-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const ID = 'MK-SA1';
const NOTE = 'Please look at clause 2 before Friday.';

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const c = Object.assign(fixtureContract(ID, 'Packaging Supply', 'Kabras Sugar Ltd', 'proc', 1200000, 'Under Review',
    'PACKAGING SUPPLY AGREEMENT\n\n1. Supply\n\nThe Supplier supplies cartons.\n\n2. Payment\n\nInvoices are payable within 30 days.'), {
    counterpartyEmail: 'legal@kabras.example' });
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const click = sel => page.click(sel, { timeout: 3000 }).then(() => true, () => false);
  const openSend = async () => {
    await page.evaluate(id => { pdOpenOnHome(id, 'copilot'); }, ID);
    await waitFor(page, id => window.intel && intel.paper && intel.paper.id === id && !!document.getElementById('ig-canvas'), 10000, ID);
    await page.evaluate(id => openShareModal(getContract(id)), ID);
    return waitFor(page, () => !!document.querySelector('#sh-letter') && !!document.getElementById('sh-summary') && !!document.getElementById('share-close'), 10000);
  };
  const asked = () => waitFor(page, () => { const d = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].find(x => /Leave without sending\?/.test(x.textContent));
    return d ? d.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) : null; }, 3000);
  const pressIn = async re => page.evaluate(src => { const b = [...document.querySelectorAll('button')].find(x => new RegExp(src).test(x.textContent.trim()) && x.getClientRects().length);
    if (b) b.click(); return !!b; }, re);
  try {
    check('0 the contract is staged', !!(put && put.ok));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await click('#li-go');
    await waitFor(page, id => window.state && state.contracts && state.contracts.some(x => x.id === id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });

    console.log('\n1 · nothing typed');
    const up1 = await openSend();
    await click('#share-close');
    const gone1 = await waitFor(page, () => !document.querySelector('#sh-letter'), 3000);
    check('1 with nothing typed, Cancel closes at once and asks nothing', !!up1 && !!gone1 && !(await page.evaluate(() => /Leave without sending/.test(document.body.textContent))));

    console.log('\n2 · a note typed, the bar pressed');
    await openSend();
    await page.fill('#sh-summary', NOTE);
    await click('#dk-mark');
    const q2 = await asked();
    check('2a the bar asks "Leave without sending?" before the note is lost', !!q2, q2);
    await pressIn('^Keep writing$');
    const kept = await waitFor(page, () => { const t = document.getElementById('sh-summary'); return t && document.querySelector('#sh-letter') ? t.value : null; }, 3000);
    check('2b Keep writing leaves the screen up with the note whole', kept === NOTE, JSON.stringify(kept));

    console.log('\n3 · discard');
    await click('#dk-mark');
    await asked();
    await pressIn('^Discard the note$');
    const home = await waitFor(page, () => !document.querySelector('#sh-letter') && state.view === 'counter' ? true : null, 5000);
    check('3 Discard the note puts the screen away and Home comes up', !!home);

    console.log('\n4 · Cancel with a note typed');
    await openSend();
    await page.fill('#sh-summary', NOTE);
    await click('#share-close');
    const q4 = await asked();
    check('4 Cancel asks too once a note is typed', !!q4, q4);
    await pressIn('^Keep writing$');

    console.log('\n5 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await click('#dk-mark');
      await asked();
      const m = await page.evaluate(() => { const d = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].find(x => /Leave without sending\?/.test(x.textContent));
        const r = d && d.getBoundingClientRect(); return { whole: !!r && r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1, side: document.documentElement.scrollWidth > innerWidth + 1 }; });
      check(`5 ${w}x${hh}: the question stands whole, nothing sideways`, m.whole && !m.side, JSON.stringify(m));
      await pressIn('^Keep writing$');
      await pause(200);
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
