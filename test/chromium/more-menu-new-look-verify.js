/* THE NEW LOOK: EVERY ROW OF THE PAPER'S MORE MENU DOES SOMETHING (owner, 6 Nov 2026: "fix the More menu"). The More menu
   (#ig-actions → #pd-acts-pop) presses the very row it copies, in the Dossier's unseen fold of the room's rows; only the
   old Dossier drew that fold (pdNextUpHtml), so in the new look every row pressed nothing. pdMenuRowsHtml draws the same
   rows, never shown, beside the new look's Dossier, wired by the dock's own pass.
     1 · Every row in the More menu moves something: a page, a dialog, a window, a download, a new tab or Redlines
     2 · Edit clause opens Redlines and the clause editor
     3 · Negotiation memo opens the close plan (the memo's one door in the new look)
     4 · The unseen rows are never shown
   At the parent 1–3 fail: every row is dead in the new look.
   Run: node test/chromium/more-menu-new-look-verify.js */
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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  let downloads = 0, popups = 0;
  page.on('download', () => { downloads++; });
  ctx.on('page', () => { popups++; });
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
  await page.evaluate(W.R7_IN_PAGE);
  /* the browser's print window cannot be watched headless: a print is counted where it is asked for */
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); window.print = () => { window._printed = (window._printed || 0) + 1; }; });
  const land = async () => {
    await page.evaluate(() => { const o = document.getElementById('confirm-overlay'); if (o) o.remove(); const e = document.getElementById('end-overlay'); if (e) e.remove();
      try { if (window.pdMidUp && pdMidUp()) pdMidClose(); closeModal(); } catch (_){} if (window.pdRedAway) try { pdRedAway(); } catch (_){} roomHomeLand('MK-IT'); });
    return until(page, () => window.pdContract && pdContract() && pdContract().id === 'MK-IT' && pdOnPaper() && !!document.getElementById('ig-actions') && !(window.pdRedShows && pdRedShows()), null, 15000);
  };
  const state = () => page.evaluate(() => ({ modal: ((document.getElementById('modal-root') || {}).innerText || '').length,
    overlays: [...document.body.children].filter(e => /overlay/.test(e.id) && e.getClientRects().length).map(e => e.id).join(','),
    red: !!(window.pdRedShows && pdRedShows()), view: state.view, printed: window._printed || 0,
    mid: (() => { const d = document.querySelector('#modal-root [data-deal-mid]'); return d ? 'deal:' + d.getAttribute('data-deal-mid') : ''; })() }));
  await land();
  const names = await page.evaluate(async () => { document.getElementById('ig-actions').click(); await new Promise(r => setTimeout(r, 400));
    const n = [...document.querySelectorAll('#pd-acts-pop [data-pd-acts-go]')].filter(b => !b.disabled).map(b => b.textContent.trim()); document.getElementById('ig-actions').click(); return n; });
  const unseen = await page.evaluate(() => { const r = document.querySelector('#ig-dock .pd-nx-rows'); return !!r && !r.getClientRects().length; });
  const dead = [], seen = {};
  /* Edit clause last: the clause editor it opens fills the window */
  for (const nm of names.slice().sort((a, b) => /Edit clause/.test(a) - /Edit clause/.test(b))){
    await land();
    const before = await state(); const d0 = downloads, p0 = popups;
    await page.click('#ig-actions');
    await until(page, () => !!document.querySelector('#pd-acts-pop [data-pd-acts-go]'), null, 5000);
    await page.evaluate(nm => { const b = [...document.querySelectorAll('#pd-acts-pop [data-pd-acts-go]')].find(x => x.textContent.trim() === nm); if (b) b.click(); }, nm);
    await until(page, ([b, d0, p0]) => { const a = { modal: ((document.getElementById('modal-root') || {}).innerText || '').length,
      overlays: [...document.body.children].filter(e => /overlay/.test(e.id) && e.getClientRects().length).map(e => e.id).join(','), red: !!(window.pdRedShows && pdRedShows()) };
      return a.modal !== b.modal || a.overlays !== b.overlays || a.red !== b.red || (window._printed || 0) !== b.printed; }, [before, d0, p0], 5000);
    await page.waitForTimeout(400);
    const after = await state();
    const moved = JSON.stringify(after) !== JSON.stringify(before) || downloads > d0 || popups > p0;
    seen[nm] = { after, dl: downloads > d0, tab: popups > p0 };
    if (!moved) dead.push(nm);
  }
  check('1 · every row in the More menu does something', names.length >= 6 && dead.length === 0, { names, dead });
  check('4 · the unseen rows are never shown', unseen);
  const ed = Object.keys(seen).find(k => /Edit clause/.test(k));
  check('2 · Edit clause opens Redlines and the clause editor', !!ed && seen[ed].after.red, ed ? seen[ed] : 'no row');
  const mm = Object.keys(seen).find(k => /Negotiation memo/.test(k));
  check('3 · Negotiation memo opens the close plan', !!mm && /^deal:/.test(seen[mm].after.mid), mm ? seen[mm] : 'no row');

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
