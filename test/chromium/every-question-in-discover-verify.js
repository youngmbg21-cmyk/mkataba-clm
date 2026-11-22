/* EVERY QUESTION IS ASKED IN DISCOVER (owner, 22 Nov 2026: "There is not asking a column again only the features related
   to discovery"). Ask a column is deleted; the presses that went on to its form on the Contracts list land on Discover's
   own New read instead, and Contracts draws no question column. At the owner's three screens:
     1 · Ask again on a read's table lands on Discover's New read with that read's question in the box; Contracts is
         never opened on the way (no setView('register'))
     2 · the narrow list's button says "New read" (Discover's word), never "Ask a column", and opens New read
     3 · Contracts draws no question column, even with a question id still in the list's state (a saved view, a refresh)
   At the parent (main d43c5cd) 1, 2 and 3 fail: Ask again went to Contracts and its form, the narrow button said "Ask a
   column", and the list drew the question's column.
   Run: node test/chromium/every-question-in-discover-verify.js (EQD_SHOTS=<dir> takes the pictures) */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const SHOTS = process.env.EQD_SHOTS || '';
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const Q = 'Which country\'s law governs this contract?';

(async () => {
  const h = await startHati();
  const cs = []; const P = ['Juno LLC', 'Saw Sawa LLC', 'Delta LLC', 'Nandi Dairy'];
  for (let i = 0; i < 12; i++) cs.push(fixtureContract('EQ-' + (100 + i), 'Mutual Non-Disclosure', P[i % 4], 'proc', 0, 'Drafting',
    '1. Governing law\nThis agreement is governed by the laws of ' + (i % 3 ? 'Kenya' : 'Sweden') + '.\n\n2. Payment\nInvoices are paid within 30 days.'));
  await seedWorkspace(h, { contracts: cs });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  let askId = '';
  try {
    for (const [nm, VW, VH] of [['1440x780', 1440, 780], ['1536x730', 1536, 730], ['1366x950', 1366, 950]]){
      const page = await browser.newPage({ viewport: { width: VW, height: VH } });
      const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
      const shot = async n => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${n}-${nm}.png` }); };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => typeof currentUser === 'function' && !!currentUser() && typeof setView === 'function' && state.contracts.length >= 12, null, 40000);
      if (!askId) askId = await page.evaluate(q => api('ai/column', 'POST', { question: q, name: 'Governing law', ids: state.contracts.slice(0, 6).map(c => c.id) }).then(r => r && r.ask && r.ask.id), Q);
      /* every view the app is sent to from here on is written down: Contracts must never be one of them */
      await page.evaluate(() => { const sv = window.setView; window.__views = []; window.setView = function(v, ...rest){ window.__views.push(v); return sv.call(this, v, ...rest); }; });

      /* 1 · Ask again on the read's table */
      await page.evaluate(() => setView('reads'));
      await until(page, () => !!document.querySelector('#rd-page.dsn-page tr[data-dsn-run]'), null, 15000);
      await page.evaluate(id => { window.__views = []; readsTableOpen('ask:' + id); }, askId);
      const table = await until(page, () => !!document.querySelector('#rd-page [data-rdt-again]'), null, 15000);
      if (table) await page.click('#rd-page [data-rdt-again]');
      const landed = table && await until(page, q => state.view === 'reads' && !!document.querySelector('#rd-page[data-dsn-screen="new"]')
        && ((document.getElementById('dsc-q') || {}).value || '') === q, Q, 8000);
      const A = await page.evaluate(() => ({ view: state.view, views: window.__views.slice(), q: (document.getElementById('dsc-q') || {}).value || '',
        screen: (document.querySelector('#rd-page') || {}).getAttribute ? document.querySelector('#rd-page').getAttribute('data-dsn-screen') : '' }));
      await page.waitForTimeout(400);
      await shot('ask-again-new-read');
      check(`${nm} 1 Ask again on a read's table lands on Discover's New read with its question in the box; Contracts never opened`,
        table && landed && !A.views.includes('register') && A.view === 'reads', A);

      /* 2 · the narrow list's button */
      await page.evaluate(() => { insForce(false); discoverOpen(); });
      const narrow = await until(page, () => !!document.querySelector('#rd-page #rd-ask'), null, 10000);
      const label = narrow ? await page.evaluate(() => document.getElementById('rd-ask').innerText.trim()) : '';
      await shot('narrow-new-read-button');
      let opened = false;
      if (narrow){ await page.evaluate(() => { window.__views = []; }); await page.click('#rd-page #rd-ask');
        opened = await until(page, () => state.view === 'reads' && !!document.querySelector('#rd-page[data-dsn-screen="new"] #dsc-q'), null, 8000); }
      const V2 = await page.evaluate(() => window.__views.slice());
      check(`${nm} 2 the narrow list's button says "New read", never "Ask a column", and opens New read`,
        narrow && label === 'New read' && opened && !V2.includes('register'), { label, opened, views: V2 });
      await page.evaluate(() => insForce(null));

      /* 3 · Contracts draws no question column, even with the question still in the list's state */
      await page.evaluate(id => { regPlaceSet({ show: 'list' }); if (typeof regFoldersShut === 'function') regFoldersShut(); regState().ask = [id]; regState().only = null; setView('register'); }, askId);
      await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]'), null, 15000);
      if (await page.$('[data-ctf-show="list"]') && !(await page.$('#reg-tbody tr[data-row]'))) await page.click('[data-ctf-show="list"]').catch(() => {});
      await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]'), null, 10000);
      await page.waitForTimeout(600);
      const C = await page.evaluate(() => ({ th: document.querySelectorAll('th.ac-th, th[data-ac-th]').length, td: document.querySelectorAll('td.ac-cell').length,
        heads: [...document.querySelectorAll('.reg-table thead th')].map(x => x.innerText.trim()).filter(Boolean), rows: document.querySelectorAll('#reg-tbody tr[data-row]').length }));
      await shot('contracts-no-question-column');
      check(`${nm} 3 Contracts draws no question column, with a question still in the list's state`, C.rows > 0 && C.th === 0 && C.td === 0 && !C.heads.includes('Governing law'), C);
      check(`${nm} no page errors`, !errs.length, errs);
      await page.close();
    }
  } catch (e) { check('the run itself', false, String(e && e.stack || e).slice(0, 400)); }
  finally { await browser.close(); await h.stop(); }
  console.log(`\n${fails ? fails + ' FAILED' : 'ALL PASS'}`);
  process.exit(fails ? 1 : 0);
})();
