'use strict';
/* notebook-verify — THE NOTEBOOK, THE LEGORA + STRIPE WAY (owner's pick, 23 Nov 2026; f1198 pins the server and the words).
   Driven where the reader looks, on the round 7 world as its admin:
   1  "notebook" typed into the one door opens the page: tabs with their counts, one calm table
   2  a row says the words Jambo last quoted and their section, its kind and status as soft badges
   3  a row's first press CHOOSES it (Jambo's panel: the quote, Where I quote it, Open); the second OPENS it in the middle,
      the quoted section marked; ‹ Notebook comes back to the list
   4  a document past twelve months says Check due, and Mark checked sits in its row; pressed, Up to date; Undo puts it back
   5  + Add a document opens HaTi's one edit pop-up: File · Name · Kind · Shelf · In force from
   Each half guarded: a missing feature reports, it does not time out. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { DatabaseSync } = require('node:sqlite');
const { startHati } = require('../helpers');
const W = require('../round7-world');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const GDPR = ['GENERAL DATA PROTECTION REGULATION', 'Article 28', 'Processor', '3. Processing by a processor shall be governed by a contract that is binding on the processor.',
  'Article 33', 'Notification of a personal data breach', '1. The controller shall notify the breach not later than 72 hours after having become aware of it.'].join('\n');
const DPA = ['THE DATA PROTECTION ACT, 2019', 'Section 48', 'A data controller may transfer personal data to another country only where safeguards are proved.', 'Section 49', 'Safeguards before transfer.'].join('\n');
(async () => {
  const h = await startHati(); await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const us = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; us.on('pageerror', e => errors.push(e.message));
  try {
    await us.goto(h.base + '/', { waitUntil: 'networkidle' });
    await us.fill('#li-email', 'admin@example.co.ke'); await us.fill('#li-pass', 'adminpassword1'); await us.click('#li-go');
    await until(us, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
    await us.evaluate(W.R7_IN_PAGE);
    const made = await us.evaluate(async ([g, d]) => { if (typeof api !== 'function') return null;
      try { const a = await api('notebook', 'POST', { shelf: 'company', name: 'GDPR', kind: 'law', inForce: '2018-05-25', text: g });
        const b = await api('notebook', 'POST', { shelf: 'company', name: 'Data Protection Act, 2019', kind: 'law', text: d });
        return [a.doc.id, b.doc.id]; } catch (e) { return null; } }, [GDPR, DPA]);
    if (made){
      /* what Jambo quoted, and a check a year and more old: written as the server would keep them */
      const db = new DatabaseSync(h.dataDir + '/hati.db');
      const put = (id, f) => { const r = db.prepare('SELECT json FROM notebook_docs WHERE id=?').get(id); db.prepare('UPDATE notebook_docs SET json=? WHERE id=?').run(JSON.stringify({ ...JSON.parse(r.json), ...f }), id); };
      put(made[0], { quoted: 3, bySec: { 'Art. 28(3)': 3 }, last: { n: 'Art. 28(3)', words: 'Processing by a processor shall be governed by a contract', at: new Date().toISOString() } });
      put(made[1], { checkedAt: '2024-01-15T09:00:00Z', quoted: 1, bySec: { 's. 48': 1 }, last: { n: 's. 48', words: 'A data controller may transfer personal data to another country only where safeguards are proved.', at: new Date().toISOString() } });
      db.close();
    }
    check('0 the notebook routes take a document', !!made);
    const opened = await us.evaluate(() => { if (typeof caGo !== 'function') return false; return caGo({ kind: 'go', place: 'notebook' }) !== false; });
    const listed = opened && await until(us, () => document.querySelectorAll('#nb-page [data-nb-row]').length === 2, null, 12000);
    const tabs = listed ? await us.evaluate(() => [...document.querySelectorAll('[data-nb-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim())) : null;
    check('1 "notebook" opens the page: tabs with their counts, one table', !!(listed && tabs && tabs.join('|') === 'All 2|Company 2|Mine 0'), JSON.stringify(tabs));
    const rowOf = name => us.evaluate(n => { const r = [...document.querySelectorAll('#nb-page [data-nb-row]')].find(x => x.querySelector('b') && x.querySelector('b').textContent === n);
      return r ? { id: r.getAttribute('data-nb-row'), t: r.innerText.replace(/\s+/g, ' ').trim(), badges: [...r.querySelectorAll('.hbkn-bd')].map(b => b.textContent) } : null; }, name);
    const g = listed ? await rowOf('GDPR') : null;
    check('2 a row: the quoted words with their section, kind and status as soft badges', !!(g && /Art\. 28\(3\) “Processing by a processor/.test(g.t) && g.badges.join('|') === 'Law|Up to date'), JSON.stringify(g));
    if (g){
      await us.click(`[data-nb-row="${g.id}"]`);
      const chose = await until(us, () => { const p = document.getElementById('ins-panel'); return !!(p && p.querySelector('[data-nb-open]') && /Where I quote it/.test(p.innerText) && /Processing by a processor/.test(p.innerText)); });
      check('3a the first press chooses it: the panel says the quote, Where I quote it, Open', chose);
      await us.click(`[data-nb-row="${g.id}"]`);
      const read = await until(us, () => !!document.querySelector('#nb-read .nb-s.is-quoted[data-nb-sec="Art. 28(3)"]'), null, 8000);
      check('3b the second press opens it in the middle, the quoted section marked', read);
      if (read){ await us.click('[data-nb-back]'); }
      check('3c ‹ Notebook comes back to the list', read && await until(us, () => !!document.querySelector('#nb-page [data-nb-row]') && !document.getElementById('nb-read')));
    }
    const d = listed ? await rowOf('Data Protection Act, 2019') : null;
    const due = !!(d && d.badges.includes('Check due') && /Mark checked/.test(d.t));
    check('4a past twelve months: Check due, and Mark checked in its row', due, JSON.stringify(d));
    if (due){
      await us.click(`[data-nb-row="${d.id}"] [data-nb-check]`);
      const ok = await until(us, i => { const r = document.querySelector(`[data-nb-row="${i}"]`); return !!(r && /Up to date/.test(r.innerText)); }, d.id);
      check('4b pressed: Up to date', ok);
      const undo = ok && await until(us, () => [...document.querySelectorAll('#toast-root button')].some(b => /Undo/.test(b.textContent)), null, 4000);
      if (undo) await us.evaluate(() => [...document.querySelectorAll('#toast-root button')].find(b => /Undo/.test(b.textContent)).click());
      check('4c Undo puts the old check back', undo && await until(us, i => { const r = document.querySelector(`[data-nb-row="${i}"]`); return !!(r && /Check due/.test(r.innerText)); }, d.id));
    }
    const add = await us.$('#nb-add');
    if (add) await add.click();
    const form = add && await until(us, () => !!document.getElementById('nb-add-form'));
    const rows = form ? await us.evaluate(() => [...document.querySelectorAll('#nb-add-form .lgp-k')].map(x => x.textContent)) : null;
    check('5 + Add a document opens the one edit pop-up: File · Name · Kind · Shelf · In force from', !!(rows && rows.join('|') === 'File|Name|Kind|Shelf|In force from'), JSON.stringify(rows));
    check('no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) { check('the run completed', false, e.message); }
  finally { await browser.close(); await h.stop(); }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
