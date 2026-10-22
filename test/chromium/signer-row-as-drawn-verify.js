/* ============================================================
   THE SIGNER LINE IS THE POP-UP'S DOOR
   ============================================================
   The owner, 21 Oct 2026, picked "The SAP way" for the Signer row (search boxes
   over the directory in the row). The owner, 22 Oct 2026, after the Checklist:
   "the highlighted feature should be deleted because the use for it is in the
   pop up feature for signer." RE-POINTED that day: the row's boxes, its Confirm
   and its "Add or order signers ›" went; the Signer line itself opens the
   signing route editor.

     1  the Signer row carries no box, no <select>, no Confirm
     2  a press on its line opens the signing route editor over the same page;
        a TOUCH press does too (one press, on an iPad as well)
     3  closing it lands back on the Signer line
     4  "Who else is on this agreement" stands right after the signer line
     5  the owner's three screens: the line stands whole, nothing past the panel

     node test/chromium/signer-row-as-drawn-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'signer-row-as-drawn');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };

const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const ID = 'MK-SGR1', THEM = 'Bamburi Cement PLC', OTHER = 'Siginon Group Logistics Ltd';
/* three people the typed word "wan" finds: two at the counterparty, one elsewhere */
const P1 = { name: 'Wanjiru Achieng-Odhiambo', mail: 'wanjiru.achieng@bamburicement.co.ke' };
const P2 = { name: 'Wanjala Mukhwana', mail: 'w.mukhwana@bamburicement.co.ke' };
const P3 = { name: 'Christopher Kiprotich Wanyama', mail: 'christopher.k.wanyama@siginongroup.co.ke' };
const TEXT = ['MUTUAL NON-DISCLOSURE AGREEMENT', '',
  `This agreement is made between Highland Corporate Ltd and ${THEM}.`, '',
  '1. Confidential information', '',
  'Each party shall keep the other party\'s confidential information secret.', '',
  '2. Term', '', 'This agreement runs for two years from the date of signature.'].join('\n');


(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const mk = async (id, name, them, who, body) => {
    const c = Object.assign(fixtureContract(id, name, them, 'legal', 0, 'Under Review', body || TEXT), {
      template: null, owner: { id: me.id, name: me.name }, fields: { value: '' },
      metadata: { value: 0, currency: 'KES', contractType: 'NDA' },
      counterpartyName: who.name, counterpartyEmail: who.mail });
    return W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  };
  const put = await mk(ID, 'Mutual Non-Disclosure Agreement', THEM, P1);
  /* the directory is a reading over the contracts: two more people it then knows */
  const put2 = await mk('MK-SGR2', 'Supply of Aggregate', THEM, P2);
  const put3 = await mk('MK-SGR3', 'Warehousing Services', OTHER, P3);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 }, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    check('0 the three contracts are staged', !!(put && put.ok && put2 && put2.ok && put3 && put3.ok),
      JSON.stringify({ a: put && put.ok, b: put2 && put2.ok, c: put3 && put3.ok }));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, id => window.state && Array.isArray(state.contracts) && state.contracts.some(x => x.id === id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });

    const open = async () => {
      await page.evaluate(() => { if (typeof regPlaceSet === 'function') regPlaceSet({ show: 'list' }); setView('register'); });
      await waitFor(page, () => !!document.querySelector('#ct-place, #reg-root, .reg-card'), 6000);
      await page.evaluate(id => regOpenContract(id), ID);
      await waitFor(page, id => !!document.querySelector(`#pd-glance[data-pd-glance-for="${id}"]`), 12000, ID);
      await page.evaluate(id => { if (typeof pdOpenOnHome === 'function') pdOpenOnHome(id, 'copilot'); }, ID);
      const up = await waitFor(page, () => !!document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]'), 12000);
      await page.evaluate(() => { const r = document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]'); if (r) r.scrollIntoView({ block: 'center' }); });
      await page.evaluate(() => document.fonts.ready); await pause(250);
      return up;
    };
    const ROW = () => { const r = document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]'); if (!r) return null;
      const v = r.querySelector('.pd-ck-v'), dock = document.getElementById('igd-feed'), q = r.getBoundingClientRect();
      const next = r.nextElementSibling;
      return { boxes: r.querySelectorAll('input, textarea').length, selects: r.querySelectorAll('select').length, ok: !!r.querySelector('[data-pd-og-ok]'),
        door: !!r.querySelector('.pd-ck-hd[data-pd-og-route]'), words: (r.querySelector('.pd-ck-hd') || {}).textContent || '',
        whole: !!v && v.scrollWidth <= v.clientWidth + 1, inside: !!dock && q.right <= dock.getBoundingClientRect().right + 1,
        next: next ? next.getAttribute('data-pd-og-row') : null }; };
    check('0b the Signer row is up beside the paper', await open());
    const r0 = await page.evaluate(ROW);
    console.log('\n1 · no boxes on the row');
    check('1 the Signer row carries no box, no <select>, no Confirm', !!r0 && r0.boxes === 0 && r0.selects === 0 && !r0.ok, JSON.stringify(r0));
    console.log('\n2 · its line opens the signing route');
    check('2a its line is the signing route\'s door', !!r0 && r0.door, JSON.stringify(r0));
    await page.click('#ig-dock #pd-og tr[data-pd-og-row="signers"] .pd-ck-hd');
    const route = await waitFor(page, () => !!document.getElementById('sr-win'), 8000);
    check('2b a press opens the signing route editor over the same page', route
      && await page.evaluate(() => !!document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]')));
    console.log('\n3 · closing it lands back on the line');
    await page.click('#sp-cancel').catch(() => {});
    const back = await waitFor(page, () => !document.getElementById('sr-win') && !!document.activeElement && !!document.activeElement.closest
      && !!document.activeElement.closest('#ig-dock #pd-og tr[data-pd-og-row="signers"]'), 8000);
    check('3 closing it lands back on the Signer line', back, await page.evaluate(() => String(document.activeElement && (document.activeElement.className || document.activeElement.tagName))));
    await page.tap('#ig-dock #pd-og tr[data-pd-og-row="signers"] .pd-ck-hd');
    const tapped = await waitFor(page, () => !!document.getElementById('sr-win'), 8000);
    check('2c a touch press opens it too', tapped);
    await page.click('#sp-cancel').catch(() => {});
    await waitFor(page, () => !document.getElementById('sr-win'), 6000);
    console.log('\n4 · who else, right after the signer line');
    check('4 "Who else is on this agreement" stands right after the signer line', !!r0 && r0.next === 'people', JSON.stringify(r0 && r0.next));
    console.log('\n5 · the owner\'s three screens');
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      await open();
      const r = await page.evaluate(ROW);
      check(`5 ${w}x${hh} the Signer line stands whole inside the panel`, !!r && r.whole && r.inside, JSON.stringify(r));
      await page.screenshot({ path: path.join(OUT, `signer-line-${w}x${hh}.png`) });
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
