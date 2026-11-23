'use strict';
/* duties-card-verify — THE DUTIES CARD ON THE DOSSIER (owner's pick "Its own card", 23 Nov 2026; f1184 pins the source).
   Driven where the reader looks, on the practice SaaS paper (MK-IT, round 7's world):
   1  unread: the card says Jambo has not read the paper, and offers Read the paper
   2  Jambo's three duties found: "3 found by Jambo · None added to your duties yet · Review", under Where the deal stands,
      above the facts
   3  Review opens the existing review page (Proposed obligations)
   4  once added: "3 duties", and its press opens the contract's duty list
   Each half guarded: a missing feature reports, it does not time out. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../round7-world');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const FOUND = [
  { desc: 'Deliver the Services at the agreed service levels', quote: 'The Supplier shall deliver the Services.', clause: '1', party: 'them', kind: 'standing' },
  { desc: 'Pay each correct invoice within 30 days', quote: 'Customer shall pay each correct invoice within 30 days of receipt.', clause: '5', party: 'us', kind: 'event' },
  { desc: 'Tell the other side of a data breach within 72 hours', quote: 'notify the other of a breach within seventy-two (72) hours', clause: '12', party: 'both', kind: 'event' } ];
(async () => {
  const h = await startHati(); await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const us = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; us.on('pageerror', e => errors.push(e.message));
  const cardText = () => us.evaluate(() => { const e = document.querySelector('#ig-dock [data-pd2-dtc]'); return e ? { k: e.getAttribute('data-pd2-dtc'), t: e.innerText.replace(/\s+/g, ' ').trim() } : null; });
  const open = async () => { await us.evaluate(() => pdOpenOnHome('MK-IT', 'open')); return until(us, () => !!document.querySelector('#ig-dock [data-pd2-dtc]'), null, 12000); };
  try {
    await us.goto(h.base + '/', { waitUntil: 'networkidle' });
    await us.fill('#li-email', 'admin@example.co.ke'); await us.fill('#li-pass', 'adminpassword1'); await us.click('#li-go');
    await until(us, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
    await us.evaluate(W.R7_IN_PAGE);
    const o1 = await open(); const c1 = o1 ? await cardText() : null;
    check('1 unread: the card offers Read the paper', !!(c1 && c1.k === 'unread' && /Read the paper/.test(c1.t)), JSON.stringify(c1));
    await us.evaluate(async F => { const c = getContract('MK-IT'); if (window.ensureFull) await ensureFull(c);
      c.triage = { at: new Date().toISOString(), by: 'Amina', steps: { oblig: { ok: true, found: F } } }; if (window.persist) await persist(c); if (window.flushSaves) await flushSaves(); }, FOUND);
    await open(); const c2 = await cardText();
    check('2a found: "3 found by Jambo · None added to your duties yet · Review"', !!(c2 && c2.k === 'review' && /3 found by Jambo/.test(c2.t) && /None added/.test(c2.t) && /Review/.test(c2.t)), JSON.stringify(c2));
    const order = await us.evaluate(() => { const d = document.querySelector('#ig-dock [data-pd2-dl-open]'), k = document.querySelector('#ig-dock [data-pd2-dtc]'), f = document.querySelector('#ig-dock .pd2-facts');
      return !!(d && k && f && (d.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING) && (k.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING)); });
    check('2b it sits under Where the deal stands and above the facts', order);
    if (c2) await us.click('#ig-dock [data-pd2-dtc]');
    const p3 = await until(us, () => /Proposed obligations/.test(document.body.innerText), null, 8000);
    check('3 Review opens the existing review page', p3);
    await us.evaluate(async () => { const c = getContract('MK-IT'); if (typeof closeModal === 'function') closeModal();
      for (const o of triageHeldObligations(c)) obAddFound(c, o, o.party === 'them' ? 'them' : 'us');
      if (window.persist) await persist(c); if (window.flushSaves) await flushSaves(); });
    await open(); const c4 = await cardText();
    check('4a added: the card says 3 duties', !!(c4 && c4.k === 'list' && /3 duties/.test(c4.t)), JSON.stringify(c4));
    if (c4) await us.click('#ig-dock [data-pd2-dtc]');
    const p4 = await until(us, () => typeof pdTab === 'function' && pdTab() === 'oblig', null, 6000);
    check('4b its press opens the contract\'s duty list', p4);
    check('no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) { check('the run completed', false, e.message); }
  finally { await browser.close(); await h.stop(); }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
