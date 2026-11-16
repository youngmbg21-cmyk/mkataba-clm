/* THE MEMO'S OWN PANEL AGAIN (owner, 16 Nov 2026, f1084: the close plan that carried the memo in the new look is
   removed; was "THE MEMO LIVES IN THE CLOSE PLAN", owner picked 6 Nov 2026). The file keeps its name for its history.
     1 · Negotiation memo (the paper's More menu) opens the memo side panel in the new look, no close plan in the middle
     5 · The new look off: the old memo side panel, as before
   At the parent 1 fails: the memo opened the close plan (Deal) in the middle.
   Run: node test/chromium/memo-in-close-plan-verify.js */
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
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
  await page.evaluate(W.R7_IN_PAGE);
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand('MK-IT'); });
  await until(page, () => window.pdContract && pdContract() && pdContract().id === 'MK-IT' && pdOnPaper() && !!document.getElementById('ig-actions'), null, 15000);
  /* 1 · Negotiation memo, in the paper's More menu (the row presses the room's own row: pdMenuRowsHtml) */
  await page.click('#ig-actions');
  const btn = await until(page, () => [...document.querySelectorAll('#pd-acts-pop [data-pd-acts-go]')].some(b => /Negotiation memo/.test(b.textContent)), null, 8000);
  if (btn) await page.evaluate(() => [...document.querySelectorAll('#pd-acts-pop [data-pd-acts-go]')].find(b => /Negotiation memo/.test(b.textContent)).click());
  const side = await until(page, () => !!document.querySelector('#side-panel #ng-memo-copy'), null, 8000);
  const s1 = await page.evaluate(() => ({ deal: !!document.querySelector('[data-deal-mid], [data-rl-deal]') }));
  check('1 · Memo opens the memo side panel, no close plan in the middle', btn && side && !s1.deal, { btn, side, ...s1 });

  /* 5 · the new look off */
  await page.evaluate(async () => { if (window.pdMidUp && pdMidUp()) pdMidClose(); await stPrefSet('newLook', false); newLookApply(); openNegoMemo(getContract('MK-IT')); });
  const old = await until(page, () => !!document.querySelector('#side-panel #ng-memo-copy'), null, 8000);
  check('5 · the new look off: the old memo side panel, as before', old);

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
