/* ============================================================
   "WHO ELSE IS ON THIS AGREEMENT" — ITS TWO WAYS IN, ONE DOOR
   (owner, 21 Oct 2026: "put it in Key terms and dossier")
   ============================================================
   Since the Board's card reads (20 Oct, the Legora way) the people list had
   no door on a computer. Now Key terms' row and a Dossier line both open the
   same pop-up (pdPeopleOpen), the list's own builder and wire inside it.
   Driven in a real browser, with presses:
     1  the Dossier's line names who is on it; its button opens the list
     2  + Add someone, a name and an email typed: saved to the record (read
        back from the server), the line counts the new person
     3  Key terms' row says who; Change opens the same list; Done brings
        Key terms back to the middle
     4  the owner's three screens: the pop-up whole, nothing sideways
   Red at the parent: neither the row nor the line exists.
     node test/chromium/who-else-doors-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'who-else-doors');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const ID = 'MK-WE1';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const c = Object.assign(fixtureContract(ID, 'Warehouse Lease', 'Mombasa Storage Ltd', 'proc', 2400000, 'Under Review',
    'WAREHOUSE LEASE\n\n1. Premises\n\nThe Landlord lets the warehouse.\n\n2. Rent\n\nRent is payable monthly.'), {
    counterpartyEmail: 'legal@mombasa-storage.example' });
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const click = sel => page.click(sel, { timeout: 3000 }).then(() => true, () => false);
  try {
    check('0 the contract is staged', !!(put && put.ok));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await click('#li-go');
    await waitFor(page, id => window.state && state.contracts && state.contracts.some(x => x.id === id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });
    await page.evaluate(id => pdOpenOnHome(id, 'copilot'), ID);
    const fold = await waitFor(page, () => !!document.querySelector('#ig-dock [data-ds-fold="people"]'), 12000);

    console.log('\n1 · the Dossier line');
    const line = await page.evaluate(() => { const f = document.querySelector('#ig-dock [data-ds-fold="people"]'); if (!f) return null; f.open = true;
      return { head: f.querySelector('summary').textContent.replace(/\s+/g, ' ').trim(), btn: (f.querySelector('[data-pd-people]') || {}).textContent || '' }; });
    check('1a the Dossier has a "Who else is on this agreement" line with its count', !!fold && !!line && /^Who else is on this agreement\s*\d+$/.test(line.head), JSON.stringify(line));
    const n0 = line ? Number(line.head.replace(/\D+/g, '')) : -1;
    const opened = (await click('#ig-dock [data-ds-fold="people"] [data-pd-people]')) && await waitFor(page, () => !!document.querySelector('[role="dialog"] #pd-ppl [data-pt-add]'), 5000);
    check('1b its button opens the list in a pop-up over the page', !!opened);
    await page.screenshot({ path: path.join(OUT, 'from-dossier-1440x780.png') });

    console.log('\n2 · add someone');
    let saved = null;
    if (opened){
      await click('#pd-ppl [data-pt-add]');
      const form = await waitFor(page, () => !!document.querySelector('#pd-ppl .pt-dir-form [data-pt-f="name"]'), 4000);
      if (form){
        await page.fill('#pd-ppl .pt-dir-form [data-pt-f="name"]', 'Halima Noor');
        await page.fill('#pd-ppl .pt-dir-form [data-pt-f="email"]', 'halima@mombasa-storage.example');
        await page.press('#pd-ppl .pt-dir-form [data-pt-f="email"]', 'Tab');
      }
      await click('[data-pd-ppl-done]');
      await waitFor(page, () => !document.querySelector('[role="dialog"] #pd-ppl'), 4000);
      await page.evaluate(() => typeof flushSaves === 'function' ? flushSaves() : null).catch(() => {});
      saved = await waitFor(page, async id => { const r = await fetch('/api/contracts/' + id, { credentials: 'same-origin' }).then(x => x.json()).catch(() => null);
        const c2 = r && (r.contract || r); const p = c2 && (c2.participants || []).find(x => x && x.email === 'halima@mombasa-storage.example'); return p ? p.name : null; }, 8000, ID);
    }
    check('2a the person typed in is saved on the record (read back from the server)', saved === 'Halima Noor', String(saved));
    const n1 = await waitFor(page, () => { const f = document.querySelector('#ig-dock [data-ds-fold="people"] summary'); return f ? Number(f.textContent.replace(/\D+/g, '')) : null; }, 4000);
    check('2b the Dossier line counts them', n1 === n0 + 1, `${n0} → ${n1}`);

    console.log('\n3 · Key terms');
    await page.evaluate(id => pdKtMid(id), ID);
    const row = await waitFor(page, () => { const r = document.querySelector('[data-pd-mid-kt] tr[data-pd-og-row="people"]'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; }, 6000);
    check('3a Key terms has a "Who else" row naming the person', !!row && /Who else is on this agreement/.test(row) && /Halima Noor/.test(row), row);
    const fromKt = (await click('[data-pd-mid-kt] tr[data-pd-og-row="people"] [data-pd-people]')) && await waitFor(page, () => !!document.querySelector('[role="dialog"] #pd-ppl'), 5000);
    check('3b Change opens the same list', !!fromKt && await page.evaluate(() => /Halima Noor/.test(document.getElementById('pd-ppl').textContent)));
    await click('[data-pd-ppl-done]');
    const back = await waitFor(page, () => !document.querySelector('#pd-ppl') && !!document.querySelector('[data-pd-mid-kt] tr[data-pd-og-row="people"]'), 5000);
    check('3c Done brings Key terms back to the middle, on its row', !!back);

    console.log('\n4 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.evaluate(id => pdPeopleOpen(id, 'dossier'), ID);
      await waitFor(page, () => !!document.querySelector('[role="dialog"] #pd-ppl'), 4000);
      await pause(250);
      const m = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'), r = d && d.getBoundingClientRect(), b = document.querySelector('[data-pd-ppl-done]'), br = b && b.getBoundingClientRect();
        return { whole: !!r && r.top >= 0 && r.bottom <= innerHeight + 1, done: !!br && br.bottom <= innerHeight && br.height > 0, side: document.documentElement.scrollWidth > innerWidth + 1 }; });
      check(`4 ${w}x${hh}: the pop-up stands whole with Done in reach, nothing sideways`, m.whole && m.done && !m.side, JSON.stringify(m));
      await page.screenshot({ path: path.join(OUT, `popup-${w}x${hh}.png`) });
      await page.evaluate(() => closeModal());
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
