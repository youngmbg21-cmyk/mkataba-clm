/* THE NEW LOOK: THE MEMO LIVES IN THE CLOSE PLAN (owner picked "Inside the close plan", 6 Nov 2026). The memo and the
   Deal page said the same open points; the memo's own side panel is not opened in the new look.
     1 · Negotiation memo (the paper's More menu) opens the close plan (Deal) in the middle, not the old memo side panel
     2 · Deal's head line carries Copy as memo and Send to a colleague
     3 · Send to a colleague sends what Copy as memo copies (the close plan's words), to the colleague picked
     4 · After sending, the reader is back on Deal
     5 · The new look off: the old memo side panel, as before
   At the parent 1–4 fail: the memo side panel opens; Deal has no Send to a colleague.
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
  const sent = [];
  page.on('request', r => { if (/\/api\/contracts\/[^/]+\/memo$/.test(r.url()) && r.method() === 'POST'){ try { sent.push(JSON.parse(r.postData() || '{}')); } catch (_){} } });
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
  const deal = await until(page, () => !!document.querySelector('#modal-root [data-deal-mid="MK-IT"]'), null, 8000);
  const s1 = await page.evaluate(() => ({ side: !!document.querySelector('#side-panel #ng-memo-copy') }));
  check('1 · Memo opens the close plan in the middle, not the memo side panel', btn && deal && !s1.side, { btn, deal, ...s1 });

  /* 2 · Copy as memo and Send to a colleague on Deal's head line */
  const s2 = await page.evaluate(() => { const cr = document.querySelector('#modal-root [data-dlg-page] .dlg-pg-crumb');
    return { copy: !!(cr && cr.querySelector('#deal-memo')), send: !!(cr && cr.querySelector('#deal-memo-send')), words: cr ? cr.innerText.replace(/\s+/g, ' ') : '' }; });
  check('2 · Deal carries Copy as memo and Send to a colleague', s2.copy && s2.send && /Copy as memo/.test(s2.words) && /Send to a colleague/.test(s2.words), s2);

  /* 3 · send: what Copy copies */
  const copied = await page.evaluate(() => dealPlanMemoText(getContract('MK-IT')));
  if (s2.send) await page.click('#modal-root #deal-memo-send');
  const dlg = await until(page, () => !!document.getElementById('ng-memo-go'), null, 8000);
  /* a colleague who may see this contract (one who may not is refused, rightly, by the route) */
  const who = await page.evaluate(() => { const sel = document.getElementById('ng-memo-who'); if (!sel) return '';
    const o = [...sel.options].find(x => !/Restricted/i.test(x.textContent)) || sel.options[0]; sel.value = o.value; return o.value; });
  if (dlg) await page.click('#ng-memo-go');
  await until(page, () => false, null, 1500);
  const body = sent[0] || {};
  check('3 · Send to a colleague sends the close plan\'s words to the colleague picked', dlg && !!who && body.toId === who && Array.isArray(body.lines) && body.lines.join('\n') === copied && /^Deal/.test(copied),
    { dlg, who, to: body.toId, first: (body.lines || [])[0], copiedFirst: copied.split('\n')[0] });

  /* 4 · back on Deal */
  const back = await until(page, () => !!document.querySelector('#modal-root [data-deal-mid="MK-IT"]'), null, 8000);
  check('4 · after sending, back on Deal', back, await page.evaluate(() => ({ mid: window.pdMidUp ? pdMidUp() : null, dlg: !!document.querySelector('#modal-root [role="dialog"]'), go: !!document.getElementById('ng-memo-go'), err: (document.getElementById('ng-memo-err') || {}).textContent || '', paper: pdOnPaper(), may: pdMidMay(), root: (document.getElementById('modal-root') || {}).innerHTML.length })));

  /* 5 · the new look off */
  await page.evaluate(async () => { if (window.pdMidUp && pdMidUp()) pdMidClose(); await stPrefSet('newLook', false); newLookApply(); openNegoMemo(getContract('MK-IT')); });
  const old = await until(page, () => !!document.querySelector('#side-panel #ng-memo-copy'), null, 8000);
  check('5 · the new look off: the old memo side panel, as before', old);

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
