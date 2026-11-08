/* READS AND COLUMNS AS DRAWN (owner, 8 Nov 2026, over the Reads & Contracts drawing: "From when you are asking for a read
   and how a new column is added during the read and how you remove that column from the contracts list afterwards …
   structure the panel and the top of the page so that the fonts are not too big and they are in a straight line";
   "do not remove the interactive feature in the top right of the side panel"; "in the iPad view, the words are extending
   or overlapping to neighboring columns"). New look on, a folder of 60, at the owner's three screens:
     1 · the folder's top on ONE line, nothing above 15px; "+ Ask a column" a grey pill; the panel: This folder
         (Contracts · Need you · Signed · On paper), then + Ask a column and All your reads
     2 · the ask form: ‹ Overview, your question, the column's name with its hint, First 50 | All 60, Read 50 contracts, Cancel
     3 · while it reads, the reading card with Stop stands at the top of the panel
     4 · read: the column's card — the question, how far and when, Answers (bar and rows with Show), This column (Read the
         rest, Remove column); the column's head "Governing law · 50 of 60 read ⋯" on one line
     5 · ⋯: Sort by this column · Read the other 10 · Rename column · Remove from this list (5b: Rename keeps the new name); Remove → "Column removed · its 50 answers are
         kept in Reads" with Undo; Undo puts it back; the folder's panel lists it under Columns you asked
     6 · Reads: "Reads · 1 question · 50 answers kept" and + Ask a question on one line; All · On a list · Not finished;
         Question · Read · Answers · On the list of · Asked; every cell inside its column; the panel: Where it shows, Read
         the other 10, Delete question
   No word of cost anywhere on these screens. At the parent 1, 2, 4, 5 and 6 fail.
   Run: node test/chromium/reads-and-columns-as-drawn-verify.js (RC_SHOTS=<dir> takes the pictures) */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const SHOTS = process.env.RC_SHOTS || '';
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const COST = /\bcalls?\b|\bfree\b|costs? nothing|spent/i;

(async () => {
  const h = await startHati();
  const cs = []; const P = ['Juno LLC', 'Saw Sawa LLC', 'Delta LLC', 'Jumenza LLC', 'Bull', 'Nandi Dairy'];
  for (let i = 0; i < 60; i++) cs.push(fixtureContract('MK-' + (300 + i), i % 3 ? 'Mutual Non-Disclosure' : 'Warehousing Logistics Agreement', P[i % 6], 'proc', i % 2 ? 0 : 800000 * (i + 1),
    i % 2 ? 'Drafting' : 'Under Review', '1. Governing law\nThis agreement is governed by the laws of ' + (i % 4 ? 'Kenya' : 'Sweden') + '.\n\n2. Payment\nInvoices are paid within 30 days.'));
  await seedWorkspace(h, { contracts: cs });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, VW, VH] of [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]]){
      const page = await browser.newPage({ viewport: { width: VW, height: VH } });
      const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
      const shot = async n => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/rc-${n}-${nm}.png` }); };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => typeof currentUser === 'function' && !!currentUser() && typeof setView === 'function' && state.contracts.length >= 60, null, 40000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); regPlaceSet({ show: 'list' }); setView('register'); });
      await until(page, () => [...document.querySelectorAll('[data-ctf-folder]')].some(b => /Procurement/.test(b.innerText)), null, 15000);
      await page.evaluate(() => { const b = [...document.querySelectorAll('[data-ctf-folder]')].find(x => /Procurement/.test(x.innerText)); if (b) b.click(); });
      await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]') && !!document.querySelector('.rfp-panel.is-drawn'), null, 15000);
      await page.evaluate(() => document.fonts && document.fonts.ready);

      /* 1 · the top and the folder's panel */
      const T = await page.evaluate(() => { const top = document.querySelector('#ct-place .ct-top');
        const parts = [...top.querySelectorAll('.ctf-back, .ctf-crumb, .ct-h, .ct-facts')].filter(e => e.getBoundingClientRect().width);
        const cy = parts.map(e => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; }), mids = Math.max(...cy) - Math.min(...cy) <= 4 ? 1 : 2;
        const ac = document.querySelector('#ct-place .ac-btn'), p = document.querySelector('.rfp-panel.is-drawn');
        return { mids, big: parts.filter(e => parseFloat(getComputedStyle(e).fontSize) > 15).map(e => e.className), crumb: (top.querySelector('.ctf-crumb') || {}).textContent,
          pill: !!ac && getComputedStyle(ac).backgroundColor !== 'rgba(0, 0, 0, 0)' && getComputedStyle(ac).textDecorationLine === 'none', panel: p ? p.innerText : '' }; });
      check(`${nm} 1 the top on one line, nothing above 15px, "/" between; Ask a column a pill; the panel This folder · + Ask a column · All your reads`,
        T.mids === 1 && !T.big.length && T.crumb === '/' && T.pill && /THIS FOLDER[\s\S]*Contracts\s*60[\s\S]*Need you[\s\S]*Signed[\s\S]*On paper/i.test(T.panel) && /\+ Ask a column/.test(T.panel) && /All your reads/.test(T.panel) && !COST.test(T.panel), T);
      await shot('1-rest');

      /* 2 · the form */
      await page.evaluate(() => askColOpen({ question: 'What are the governing laws?', name: 'Governing law' }));
      await until(page, () => !!document.querySelector('.ac-nl-form'), null, 8000);
      const F = await page.evaluate(() => { const f = document.querySelector('.ac-nl-form'); if (!f) return null;
        return { text: f.innerText, name: (document.getElementById('ac-name') || {}).value, opts: [...f.querySelectorAll('.ac-nl-opt')].map(b => b.textContent.trim()),
          go: (f.querySelector('[data-ac-ask]') || {}).textContent, lit: !!document.querySelector('#ct-place .ac-btn.is-open') }; });
      check(`${nm} 2 the form as drawn: ‹ Overview, your question, the column's name and its hint, First 50 | All 60, Read 50 contracts · Cancel; the pill lit`,
        !!F && /‹ Overview/.test(F.text) && /YOUR QUESTION/i.test(F.text) && /COLUMN NAME/i.test(F.text) && /Read from your question/.test(F.text) && F.name === 'Governing law'
        && JSON.stringify(F.opts) === '["First 50","All 60"]' && F.go === 'Read 50 contracts' && /Cancel/.test(F.text) && F.lit && !COST.test(F.text), F);
      await shot('2-form');

      /* 3 · the reading card with Stop */
      await page.click('.ac-nl-form [data-ac-ask]');
      const reading = await until(page, () => !!document.querySelector('#ig-dock .ac-dk-card [data-ac-stop]') || !!document.querySelector('.ac-nl-done'), null, 15000);
      await shot('3-reading');
      check(`${nm} 3 while it reads, the reading card with Stop (or the read already done)`, reading);

      /* 4 · the column's card and its head */
      const done = await until(page, () => !!document.querySelector('.ac-nl-done') && !(window.AC && AC.busy), null, 60000);
      const D = done ? await page.evaluate(() => { const c = document.querySelector('.ac-nl-done'), th = document.querySelector('th.ac-th.is-nl');
        const line = th ? [...th.querySelectorAll('.ac-th-w, .reg-th-sub, .ac-th-more')].map(e => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; }) : [];
        return { text: c.innerText, bar: !!c.querySelector('.ac-gbar'), th: th ? th.innerText.replace(/\s+/g, ' ').trim() : '', more: !!(th && th.querySelector('[data-ac-thmore] svg')), oneLine: line.length === 3 && Math.max(...line) - Math.min(...line) <= 4 }; }) : null;
      check(`${nm} 4 read: the column's card (the question, how far and when, Answers with Show, This column) and its head on one line`,
        !!D && /What are the governing laws\?/.test(D.text) && /50 of 60 read · finished/.test(D.text) && D.bar && /ANSWERS[\s\S]*Show/i.test(D.text)
        && /Not read yet[\s\S]*10 contracts[\s\S]*Read the rest/.test(D.text) && /Remove column/.test(D.text) && /^Governing law · 50 of 60 read$/.test(D.th) && D.more && D.oneLine && !COST.test(D.text), D);
      await shot('4-done');

      /* 5 · the head's menu, Remove and Undo */
      await page.click('[data-ac-thmore]');
      const M = await page.evaluate(() => [...document.querySelectorAll('#ac-th-menu .ac-thm-i')].map(b => b.textContent.trim()));
      await shot('5-menu');
      await page.click('#ac-th-menu [data-ac-remove]');
      const gone = await until(page, () => !document.querySelector('th.ac-th') && /Column removed · its 50 answers are kept in Reads/.test((document.getElementById('toast-root') || {}).textContent || ''), null, 8000);
      const listed = await until(page, () => /COLUMNS YOU ASKED[\s\S]*Governing law[\s\S]*not on this list[\s\S]*Add to list/i.test((document.querySelector('.rfp-panel.is-drawn') || {}).innerText || ''), null, 8000);
      await shot('6-removed');
      await page.evaluate(() => { const b = [...document.querySelectorAll('#toast-root [data-toast-act]')].pop(); if (b) b.click(); });
      const back = await until(page, () => !!document.querySelector('th.ac-th'), null, 8000);
      check(`${nm} 5 ⋯: Sort · Read the other 10 · Rename column · Remove from this list; Remove says the answers are kept, with Undo; the panel lists it; Undo puts it back`,
        JSON.stringify(M) === '["Sort by this column","Read the other 10","Rename column","Remove from this list"]' && gone && listed && back, { M, gone, listed, back });

      /* 5b · Rename (owner, 8 Nov 2026: "Add rename"): the box holds the name; the new name stands on the head and in the panel */
      await page.click('[data-ac-thmore]'); await page.click('#ac-th-menu [data-ac-rename]');
      const box = await until(page, () => (document.getElementById('pd-input') || {}).value === 'Governing law', null, 8000);
      if (box){ await page.fill('#pd-input', 'Which law'); await page.click('#pd-ok'); }
      const renamed = box && await until(page, () => /^Which law/.test(((document.querySelector('th.ac-th.is-nl .ac-th-w') || {}).textContent || '').trim()), null, 8000);
      const kept = await page.evaluate(async () => { const r = await api('columns'); return ((r && r.asks) || []).some(a => a.name === 'Which law'); });
      check(`${nm} 5b Rename: the box holds the name; "Which law" stands on the column's head and is kept on the server`, box && renamed && kept, { box, renamed, kept });
      await page.evaluate(async () => { const id = Object.keys(AC.asks).find(k => AC.asks[k].name === 'Which law'); if (id) await api('columns/' + id + '/name', 'POST', { name: 'Governing law' }); if (id) AC.asks[id].name = 'Governing law'; });

      /* 6 · Reads */
      await page.evaluate(() => setView('reads'));
      await until(page, () => !!document.querySelector('.rdn-table.rdn2 tbody tr[data-rd-row]') && /Where it shows/i.test((document.getElementById('ins-panel') || {}).innerText || ''), null, 15000);
      const R = await page.evaluate(() => { const hd = document.querySelector('.rdn-head');
        const mids = [...hd.querySelectorAll('.ctf-h, .ctf-hf, .rdn-ask')].map(e => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; });
        const spill = [...document.querySelectorAll('.rdn-table.rdn2 td, .rdn-table.rdn2 th')].filter(td => [...td.querySelectorAll('*')].concat([td]).some(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow === 'visible')).length;
        const out = [...document.querySelectorAll('.rdn-table.rdn2 td, .rdn-table.rdn2 th')].filter(td => { const r = td.getBoundingClientRect(); return [...td.querySelectorAll('*')].some(e => { const x = e.getBoundingClientRect(); return x.width && (x.right > r.right + 1 || x.left < r.left - 1); }); }).length;
        return { head: hd.innerText.replace(/\s+/g, ' ').trim(), oneLine: Math.max(...mids) - Math.min(...mids) <= 4, tabs: [...document.querySelectorAll('[data-rdn-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
          cols: [...document.querySelectorAll('.rdn-table.rdn2 thead th')].map(t => t.textContent.trim()), out, spill, panel: document.getElementById('ins-panel').innerText, page: document.getElementById('rd-page').innerText }; });
      check(`${nm} 6 Reads as drawn: one top line, All · On a list · Not finished, the five columns, nothing out of its cell; the panel's Where it shows, Read the other 10, Delete question`,
        /^Reads 1 question · 50 answers kept \+ Ask a question$/.test(R.head) && R.oneLine && R.tabs.map(t => t.replace(/ \d+$/, '')).join('|') === 'All|On a list|Not finished'
        && R.cols.join('|') === 'Question|Read|Answers|On the list of|Asked' && R.out === 0 && /WHERE IT SHOWS/i.test(R.panel) && /Read the other 10/.test(R.panel) && /Delete question/.test(R.panel)
        && !COST.test(R.panel + R.page), { head: R.head, oneLine: R.oneLine, tabs: R.tabs, cols: R.cols, out: R.out, panel: R.panel.slice(0, 300) });
      await shot('7-reads');
      check(`${nm} 7 no page errors`, !errs.length, errs);
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
