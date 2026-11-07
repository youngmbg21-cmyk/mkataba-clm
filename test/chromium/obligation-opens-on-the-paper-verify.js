/* THE NEW LOOK: AN OBLIGATION OPENS ON ITS CONTRACT'S PAPER (the platform review, 6 Nov 2026: the Obligations list's
   open — a double press, Enter — landed on the old narrowed page, with no Jambo panel, an old view inside the new look).
     1 · Obligations (new look): a double press on a duty's row lands on its contract's paper, Jambo's panel on the
         Obligations face with that row open, his box at the foot
     2 · Coming back to Obligations shows the whole list again (no narrowed scope left behind)
     3 · The old look: the narrowed page, as before
   At the parent 1 fails (the narrowed page, no Jambo panel).
   Run: node test/chromium/obligation-opens-on-the-paper-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati();
  await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-A1'), null, 40000);
  await page.evaluate(W.R7_IN_PAGE);
  const rowSel = '#content tbody tr[data-ob-key]';
  const go = async look => { await page.evaluate(async on => { try { closeModal(); } catch (_){} await stPrefSet('newLook', on); newLookApply(); caGo({ kind: 'go', place: 'oblig', cid: null }); }, look);
    return until(page, s => state.view === 'obligations' && !!document.querySelector(s), rowSel, 15000); };

  /* 1 */
  const up = await go(true);
  const key = await page.evaluate(s => { const r = [...document.querySelectorAll(s)].find(x => /Return the pallets/.test(x.textContent)); if (!r) return ''; r.setAttribute('data-pp', '1'); return r.getAttribute('data-ob-key'); }, rowSel);
  if (key) await page.dblclick('[data-pp="1"]');
  const landed = await until(page, () => state.view === 'dashboard' && window.pdContract && pdContract() && pdContract().id === 'MK-A1' && pdOnPaper() && pdTab() === 'oblig', null, 15000);
  await page.waitForTimeout(600);
  const s1 = await page.evaluate(k => ({ view: state.view, tab: pdTab(), box: !!document.querySelector('#ig-dock #igd-input'), rows: document.querySelectorAll('#ig-dock .pd-ob-r, #ig-dock [data-pd-ob-row]').length,
    open: !!document.querySelector('#ig-dock .pd-ob-b'), openSays: ((document.querySelector('#ig-dock .pd-ob-b') || {}).innerText || '').slice(0, 60), narrowed: !!document.querySelector('[data-obw-only-clear]') }), key);
  check('1 · a double press on a duty lands on its paper, the Obligations face with the row open, Jambo\'s box at the foot', up && !!key && landed && s1.box && s1.open && !s1.narrowed, s1);

  /* 2 */
  const back = await go(true);
  const s2 = await page.evaluate(s => ({ rows: document.querySelectorAll(s).length, narrowed: !!document.querySelector('[data-obw-only-clear]'), contracts: new Set([...document.querySelectorAll(s)].map(r => (r.getAttribute('data-ob-key') || '').split('::')[0])).size }), rowSel);
  check('2 · back on Obligations the whole list stands, no narrowed scope', back && !s2.narrowed && s2.contracts >= 2, s2);

  /* 3 */
  const old = await go(false);
  await page.evaluate(s => { const r = [...document.querySelectorAll(s)].find(x => /Return the pallets/.test(x.textContent)); if (r) r.setAttribute('data-pp', '1'); }, rowSel);
  await page.dblclick('[data-pp="1"]').catch(() => {});
  const s3 = await until(page, () => state.view === 'obligations' && !!document.querySelector('[data-obw-only-clear]'), null, 10000);
  check('3 · the old look: the narrowed page, as before', old && s3);

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
