/* Chromium verification: EXPLORER'S CARD — ONE "OPEN", AND COMPARE IN TWO PRESSES
   ============================================================
   Owner, 23 Oct 2026: "Analyze contract and Workspace seem to have the same
   function. Compare does not seem to work very well." Ruled: merge the two into
   one Open; Compare always shows the side-by-side table, free; comparing what
   the contracts SAY is one press with its cost said first; every word in both
   books; picking two is easy.
     1  the card carries Open (filled) and Compare; no Analyze contract
     2  Open lands on Workspace with that contract
     3  Compare picks; another card's button reads "Compare with MK-…" and runs it
     4  the table is drawn at once and asks Jambo nothing
     5  "Compare the wording with Jambo" says its cost before the press; pressed,
        Jambo is asked once and its table is drawn
     6  in Swedish the card and the table read Swedish
   Red at the parent: 1, 3, 4, 5 and 6 fail (three doors, a tray to press, Jambo
   asked first, English words).
     node test/chromium/explorer-open-compare-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-open-compare');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
/* THE COUNT IS HONEST ONLY WHEN NOTHING IS IN FLIGHT (24 Oct 2026): a call the ARRIVAL read started (the Open
   press lands a contract on Workspace -> triageAndPaint) reaches the stub when it reaches it, so on a slow runner
   it was counted against the next step and "drawing it asked Jambo nothing" read 1. Wait for quiet, bounded,
   then clear: a wait asks for the state, never a fixed pause. */
const quietThenReset = async (ai, ms = 700, max = 8000) => { const end = Date.now() + max; let n = ai.calls.length, since = Date.now();
  while (Date.now() < end){ await pause(100); if (ai.calls.length !== n){ n = ai.calls.length; since = Date.now(); continue; } if (Date.now() - since >= ms) break; }
  ai.reset(); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const explorerCard = async id => {
    await page.evaluate(() => { if (hbFace() !== 'explorer') hbSetFace('explorer'); });
    await waitFor(page, () => !!document.getElementById('ig-dock'), 8000);
    await page.evaluate(x => { intel.busy = false; igExplain(x); }, id);
    return waitFor(page, x => !!document.querySelector(`#ig-dock [data-ig-hoverid="${x}"] [data-ig-cmp]`), 10000, id);
  };
  const cardOf = id => page.evaluate(x => { const box = document.querySelector(`#ig-dock [data-ig-hoverid="${x}"]`); if (!box) return null;
    const ws = box.querySelector('[data-ig-ws]'), cmp = box.querySelector('[data-ig-cmp]');
    return { analyze: !!box.querySelector('[data-ig-analyze]'), open: ws && ws.textContent.trim(), filled: !!(ws && ws.classList.contains('ui-btn-primary')),
      cmp: cmp && cmp.textContent.trim(), buttons: box.querySelectorAll('button.ui-btn').length }; }, id);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => typeof getContract === 'function' && !!getContract('MK-A1') && !!getContract('MK-A2'), 15000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en') langSet('en'); setView('dashboard'); });
    const A = 'MK-A1', B = 'MK-A2';
    const refOf = id => page.evaluate(x => contractRef(getContract(x)), id);
    const refA = await refOf(A), refB = await refOf(B);

    console.log('\n1 · the card');
    await explorerCard(A);
    const c1 = await cardOf(A);
    check('1 the card carries Open (filled) and Compare, and no Analyze contract', !!c1 && !c1.analyze && c1.open === 'Open' && c1.filled && c1.cmp === 'Compare' && c1.buttons === 2, JSON.stringify(c1));
    await waitFor(page, x => { const b = document.querySelector(`#ig-dock [data-ig-hoverid="${x}"] [data-ig-ws]`); if (!b) return false;
      const r = b.getBoundingClientRect(), at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(at && b.contains(at)); }, 4000, A);
    await pause(400);   /* the panel's crossfade */
    await page.screenshot({ path: path.join(OUT, '1-card.png') });

    console.log('\n2 · Open');
    await page.click(`#ig-dock [data-ig-hoverid="${A}"] [data-ig-ws]`);
    const landed = await waitFor(page, x => hbFace() === 'paper' && ((window.intel && intel.paper && intel.paper.id === x) || (typeof pdAskContractId === 'function' && pdAskContractId() === x)) ? hbFace() : null, 8000, A);
    check('2 Open lands on Workspace with that contract', !!landed, String(landed));

    console.log('\n3 · Compare in two presses');
    await page.evaluate(() => { intel.compareSel = []; intel.history.length = 0; });
    await explorerCard(A);
    await page.click(`#ig-dock [data-ig-hoverid="${A}"] [data-ig-cmp]`);
    const picked = await waitFor(page, x => { const b = document.querySelector(`#ig-dock [data-ig-hoverid="${x}"] [data-ig-cmp]`);
      const tray = document.querySelector('#igd-cmp-clear'); return b && /Picked/.test(b.textContent) && tray ? tray.parentElement.textContent.replace(/\s+/g, ' ').trim() : null; }, 4000, A);
    check('3a the first press picks it and says so, with what to do next', !!picked && picked.includes(refA) && /Compare with/.test(picked), picked);
    await explorerCard(B);
    const c3 = await cardOf(B);
    check('3b another card\'s button reads "Compare with ' + refA + '"', !!c3 && c3.cmp === `Compare with ${refA}`, JSON.stringify(c3));
    await quietThenReset(ai);
    await page.click(`#ig-dock [data-ig-hoverid="${B}"] [data-ig-cmp]`);

    console.log('\n4 · the table, free');
    const table = await waitFor(page, () => { const t = [...document.querySelectorAll('#ig-dock table')].pop(); if (!t) return null;
      const ask = document.querySelector('#ig-dock [data-ig-cmp-ask]');
      return { heads: [...t.querySelectorAll('th')].map(x => x.textContent.trim()).filter(Boolean), rows: [...t.querySelectorAll('tbody tr td:first-child')].map(x => x.textContent.trim()),
        ask: ask && ask.textContent.trim(), cost: ask && ask.parentElement.textContent.replace(/\s+/g, ' ').trim(), tray: !!document.getElementById('igd-cmp-clear') }; }, 6000);
    check('4a the side-by-side table is drawn at once, both contracts, the record\'s rows', !!table && table.heads.join() === [refA, refB].join() && table.rows.includes('Value') && table.rows.includes('Expiry'), JSON.stringify(table));
    check('4b drawing it asked Jambo nothing', ai.calls.length === 0, String(ai.calls.length));
    check('4c the pick is spent: no tray left', !!table && !table.tray);
    await page.screenshot({ path: path.join(OUT, '4-table.png') });

    console.log('\n5 · the wording, on a press, cost first');
    check('5a "Compare the wording with Jambo" stands under the table with its cost said', !!table && table.ask === 'Compare the wording with Jambo'
      && /One question to Jambo\. It sends the wording of/.test(table.cost) && table.cost.includes(refA) && table.cost.includes(refB), table && table.cost);
    ai.script([{ type: 'tool_use', id: 'tu_c', name: 'deliver_answer', input: { answer: 'They differ most on payment.', citations: [{ id: A }, { id: B }],
      compare: { columns: [{ id: A, label: refA }, { id: B, label: refB }], rows: [{ label: 'Payment terms', cells: ['30 days', '14 days'] }], verdict: 'Payment differs.' } } }]);
    await page.click('#ig-dock [data-ig-cmp-ask]');
    const worded = await waitFor(page, () => !intel.busy && [...document.querySelectorAll('#ig-dock table')].some(t => /Payment terms/.test(t.textContent)), 15000);
    const asked = ai.calls.map(c => JSON.stringify(c.body.messages || '')).join(' ');
    check('5b pressed, Jambo is asked to compare the WORDING, and its table is drawn', !!worded && /actually SAY/.test(asked), `calls ${ai.calls.length}`);
    check('5c the press is spent: it does not stand under the first table any more', await page.evaluate(() => !document.querySelector('#ig-dock [data-ig-cmp-ask]')));
    await page.screenshot({ path: path.join(OUT, '5-wording.png') });

    console.log('\n6 · Swedish');
    await page.evaluate(() => { langSet('sv'); intel.compareSel = []; intel.history.length = 0; });
    await explorerCard(A);
    const sv = await cardOf(A);
    check('6a in Swedish the card reads Öppna · Jämför', !!sv && sv.open === 'Öppna' && sv.cmp === 'Jämför', JSON.stringify(sv));
    await page.evaluate(([a, b]) => intelRunCompare([a, b]), [A, B]);
    const svRows = await waitFor(page, () => { const t = [...document.querySelectorAll('#ig-dock table')].pop(); return t ? [...t.querySelectorAll('tbody tr td:first-child')].map(x => x.textContent.trim()) : null; }, 4000);
    check('6b and the table\'s rows read Swedish', !!svRows && svRows.includes('Värde') && svRows.includes('Upphör'), JSON.stringify(svRows));
    await page.evaluate(() => langSet('en'));
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {}); await ai.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
