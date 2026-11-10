/* THE CALENDAR IS QUICK (owner, 10 Nov 2026: "review why the calendar page is slow"; "go ahead with all four").
   Measured from the code at the parent (b51e05c): every press rebuilt the calendar with its 58 KB stylesheet inside
   it (re-read by the browser each time) and repainted Jambo's panel beside it; opening drew the panel two or three
   times. Driven in a real browser, the new look on, at 1440×780:
     1 · the calendar's stylesheet is in the page ONCE (#cal-css), and the same one survives every press
     2 · a press that only changes what the calendar shows (each tab, All dates | Mine, the days) keeps Jambo's panel
         as it stands: the same panel, not one paint of it
     3 · opening the calendar from the Board paints Jambo's panel at most once
     4 · the panel's Ask box and button kept through those presses are bound once (a second binding would ask twice)
     5 · the agenda still draws its rows, and the calendar is still styled (its head is laid out, not bare)
   Run: node test/chromium/calendar-speed-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
/* the calendar repaints as its own events load: wait (bounded) for 600ms without a repaint of its host */
const settled = P => P.evaluate(() => new Promise(res => { const host = document.getElementById('hb-cal') || document.getElementById('content');
  let t = setTimeout(done, 600); const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(done, 600); });
  const cap = setTimeout(done, 6000); function done(){ mo.disconnect(); clearTimeout(cap); res(true); } if (host) mo.observe(host, { childList: true }); else done(); }));

(async () => {
  const h = await startHati({});
  await seedHandbookWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && Array.isArray(state.contracts) && state.contracts.length), null, 20000);
    await until(P, () => !!document.getElementById('cn-q'), null, 10000); await settled(P);
    await P.evaluate(async () => { const u = currentUser(); u.prefs = u.prefs || {}; u.prefs.newLook = true; newLookApply();
      if (typeof stPrefSet === 'function') try { await stPrefSet('newLook', true); } catch (_) {} });
    /* the Board first, so opening the calendar is a real arrival */
    await P.evaluate(() => { if (typeof hbSetFace === 'function') hbSetFace('board'); });
    await settled(P);

    /* 3 · opening paints the panel at most once */
    const n0 = await P.evaluate(() => (typeof igDockPaintCount === 'function' ? igDockPaintCount() : -1));
    await P.evaluate(() => setView('calendar'));
    const up = await until(P, () => document.querySelectorAll('[data-cal-view]').length >= 4 && !!document.getElementById('cal-plan'), null, 12000);
    await settled(P);
    const n1 = await P.evaluate(() => (typeof igDockPaintCount === 'function' ? igDockPaintCount() : -1));
    check(up, '0 the calendar opens, with Jambo\'s panel beside it');
    check(n0 >= 0 && n1 - n0 <= 1, '3 opening the calendar paints Jambo\'s panel at most once', { before: n0, after: n1, paints: n1 - n0 });

    /* mark what must survive the presses */
    const m0 = await P.evaluate(() => {
      const sheets = [...document.querySelectorAll('style')].filter(s => (s.textContent || '').includes('.cal-page{'));
      if (sheets[0]) sheets[0]._calMark = 1;
      const plan = document.getElementById('cal-plan'); if (plan) plan._calMark = 1;
      return { sheets: sheets.length, id: sheets[0] && sheets[0].id, paints: typeof igDockPaintCount === 'function' ? igDockPaintCount() : -1 };
    });
    check(m0.sheets === 1 && m0.id === 'cal-css', '1a the calendar\'s stylesheet is in the page once', m0);

    const presses = ['[data-cal-view="month"]', '[data-cal-view="week"]', '[data-cal-view="horizon"]', '[data-cal-view="agenda"]',
      '[data-cal-scope="mine"]', '[data-cal-scope="all"]'];
    const pressed = [];
    for (const sel of presses) {
      const el = await P.$(sel); if (!el) { pressed.push(sel + ' missing'); continue; }
      await el.click(); await settled(P); pressed.push(sel);
    }
    const m1 = await P.evaluate(() => {
      const sheets = [...document.querySelectorAll('style')].filter(s => (s.textContent || '').includes('.cal-page{'));
      const plan = document.getElementById('cal-plan');
      return { sheets: sheets.length, same: !!(sheets[0] && sheets[0]._calMark === 1), plan: !!plan, samePanel: !!(plan && plan._calMark === 1),
        paints: typeof igDockPaintCount === 'function' ? igDockPaintCount() : -1, view: typeof calView === 'function' ? calView() : '' };
    });
    check(m1.sheets === 1 && m1.same, '1b the same one stylesheet survives every press', { pressed, ...m1 });
    check(m1.samePanel && m1.paints === m0.paints, '2 a tab or All dates | Mine keeps Jambo\'s panel as it stands (no paint)', { pressed, before: m0.paints, after: m1.paints, samePanel: m1.samePanel });

    /* 4 · the Ask box kept through the presses is the one bound box, bound once (a second binding would ask twice) */
    const s4 = await P.evaluate(() => { const inp = document.getElementById('cal-plan-in'); const go = document.getElementById('cal-plan-go');
      return { box: !!inp, bound: !!(inp && inp._calWired === true), go: !!(go && go._calWired === true) }; });
    check(s4.box && s4.bound && s4.go, '4 the panel\'s Ask box and button are the ones bound once, kept through the presses', s4);

    /* 5 · still drawn and still styled */
    const s5 = await P.evaluate(() => {
      const rows = document.querySelectorAll('#cal-ag .cal-nl-r, #cal-ag .cal-ag-day').length;
      const pg = document.querySelector('.cal-page');
      return { view: calView(), rows, pageFlex: pg ? getComputedStyle(pg).display : '' };
    });
    check(s5.view === 'agenda' && s5.rows > 0 && s5.pageFlex === 'flex', '5 the agenda still draws its rows and the calendar is still styled', s5);

    check(errors.length === 0, 'no page errors', errors.slice(0, 3));
  } catch (e) {
    check(false, 'the run finished', String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
