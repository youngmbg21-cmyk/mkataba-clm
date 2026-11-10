/* THE AGENDA IS QUICK AGAIN (owner, 10 Nov 2026: "the agenda page seems to be slow")
   On Home's Calendar tab, new look, the Agenda:
     1 · opened, it is drawn once (when the person has no events or notes of their own)
     2 · the book "moving" with nothing on screen changed (hbRender, as a save landing or a background refresh does)
         leaves the page's own nodes in place — nothing is drawn again — and the time it takes is printed
     3 · the book really moving (a duty added in the page) draws the page again, the new duty on it
   Run: node test/chromium/calendar-quiet-repaint-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati({});
  await seedHandbookWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && Array.isArray(state.contracts) && state.contracts.length && typeof currentUser === 'function' && currentUser()), null, 20000);
    await P.evaluate(() => { const u = currentUser(); u.prefs = u.prefs || {}; u.prefs.newLook = true; newLookApply(); });
    /* the person's own items are loaded first, so "none of their own" is a fact the check can read */
    await P.evaluate(() => (typeof mineLoad === 'function' ? mineLoad() : null));
    await P.evaluate(() => { calState.view = 'agenda'; setView('calendar'); });
    const on = await until(P, () => !!document.querySelector('#hb-cal .cal-page #cal-ag'), null, 10000);
    check(on, '0 the Agenda is on Home\'s Calendar tab');
    if (on){
      /* 1 · drawn once: a mark on the first page survives the moment the person's own items land */
      await P.evaluate(() => { document.querySelector('#hb-cal .cal-page')._first = 1; });
      await P.waitForTimeout(2000);
      const s1 = await P.evaluate(() => ({ own: (typeof mineList === 'function') ? mineList('event').length + mineList('note').length : -1,
        same: !!(document.querySelector('#hb-cal .cal-page') || {})._first }));
      check(s1.own === 0 ? s1.same : true, '1 opened, it is drawn once (no events or notes of one\'s own)', s1);

      /* 2 · the book "moves" with nothing changed: the page's nodes stay, and the time is printed */
      await P.evaluate(() => { document.querySelector('#hb-cal .cal-page')._mark = 1; });
      const t = await P.evaluate(() => { const ms = []; for (let i = 0; i < 5; i++){ const a = performance.now(); hbRender(); ms.push(Math.round((performance.now() - a) * 10) / 10); } return ms; });
      await P.waitForTimeout(400);
      const kept = await P.evaluate(() => !!(document.querySelector('#hb-cal .cal-page') || {})._mark);
      check(kept, '2 a repaint with nothing changed draws nothing: the page\'s nodes are the same ones', { ms: t });
      console.log('      five quiet repaints took (ms): ' + t.join(', '));

      /* 3 · the book really moves: a duty added in the page (nothing saved) draws it again, the duty on it */
      await P.evaluate(() => { const c = state.contracts.find(x => x.status === 'Signed') || state.contracts[0];
        const d = new Date(todayISO() + 'T00:00:00'); d.setDate(d.getDate() + 3);
        c.obligations = (c.obligations || []).concat([{ id: 'quiet-check', desc: 'Quiet repaint check duty', due: d.toISOString().slice(0, 10) }]); hbRender(); });
      const moved = await until(P, () => { const pg = document.querySelector('#hb-cal .cal-page'); return !!pg && !pg._mark && /Quiet repaint check duty/.test(pg.textContent); }, null, 6000);
      check(moved, '3 the book moved: the page is drawn again with the new duty on it');
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
