/* CALENDAR AS AN AGENDA (round 12, "The Legora way", owner's overnight build of 28 Oct 2026)
   A tab beside Month · Week · Horizon: the next ninety days as a quiet dated list.
     1 · the calendar still opens on Week (round 16's landing kept); Agenda is the first tab
     2 · Agenda lists every contract date of the next 90 days the screen may draw, by day, each with its mark, its
         contract and one word to press; a run of weeks with nothing due is ONE line; the foot counts the dates
     3 · a row's Open lands on that contract
     4 · the tab is kept across a refresh
     5 · the owner's three screens: every row on one line inside the card, nothing sideways
   Run: node test/chromium/calendar-agenda-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'calendar-agenda');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const still = P => until(P, () => !document.getAnimations().some(a => a.playState === 'running'), null, 4000);
/* the calendar repaints as its own events load: wait (bounded) for 600ms without a repaint of its host */
const settled = P => P.evaluate(() => new Promise(res => { const host = document.getElementById('hb-cal') || document.getElementById('content');
  let t = setTimeout(done, 600); const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(done, 600); });
  const cap = setTimeout(done, 6000); function done(){ mo.disconnect(); clearTimeout(cap); res(true); } mo.observe(host, { childList: true }); }));

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
    /* Home's first paint finishes before the calendar is asked for, or it paints over it */
    await until(P, () => !!document.getElementById('cn-q'), null, 10000); await settled(P);
    await P.evaluate(() => setView('calendar'));
    const seg = await until(P, () => document.querySelectorAll('[data-cal-view]').length >= 4, null, 10000);
    const s1 = await P.evaluate(() => ({ view: calView(), tabs: [...document.querySelectorAll('[data-cal-view]')].map(x => x.getAttribute('data-cal-view')) }));
    /* RE-POINTED 29 Oct 2026 (round 12's last part, owner's yes): the calendar opens on the Agenda, its first tab */
    check(seg && s1.view === 'agenda' && s1.tabs[0] === 'agenda' && s1.tabs.join() === 'agenda,month,week,horizon', '1 it opens on the Agenda, its first tab', s1);

    await settled(P);
    await P.click('[data-cal-view="agenda"]');
    const on = await until(P, () => !!document.querySelector('#cal-ag .cal-ag-day'), null, 8000);
    const A = await P.evaluate(() => {
      const want = calUpcoming(calVisible(calendarEvents()), CAL_AGENDA_VIEW_DAYS).map(e => e.cid + '@' + e.date).sort();
      const got = [...document.querySelectorAll('#cal-ag .cal-ag-ev[data-cal-ag]')].map(r => r.getAttribute('data-cal-ag') + '@' + r.closest('.cal-ag-day').querySelector('.cal-ag-d b').textContent);
      const rows = [...document.querySelectorAll('#cal-ag .cal-ag-ev[data-cal-ag]')];
      const none = [...document.querySelectorAll('#cal-ag .cal-ag-day.is-none')];
      const days = [...document.querySelectorAll('#cal-ag .cal-ag-day')];
      let twoNoneInARow = false; days.forEach((d, i) => { if (i && d.classList.contains('is-none') && days[i - 1].classList.contains('is-none')) twoNoneInARow = true; });
      return { want: want.length, got: got.length, eachHas: rows.every(r => r.querySelector('.cal-ag-k') && r.querySelector('.cal-ag-a') && r.querySelector('.cal-ag-s')),
        none: none.length, twoNoneInARow, foot: (document.querySelector('#cal-ag .cal-ag-ft') || {}).textContent || '' };
    });
    check(on && A.want > 0 && A.got === A.want && A.eachHas, '2a every date of the next 90 days is a row with its mark, contract and one word', A);
    check(A.none >= 1 && !A.twoNoneInARow, '2b a run of empty weeks is one line', A);
    check(new RegExp('^' + A.want + ' dates? in the next 90 days$').test(A.foot.trim()), '2c the foot counts the dates', A.foot);
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780.png') });

    /* 4 · the tab survives a refresh (before 3 leaves the page) */
    await P.evaluate(() => { if (typeof placeSave === 'function') placeSave(); });
    await P.reload({ waitUntil: 'networkidle' });
    await until(P, () => !!(window.state && Array.isArray(state.contracts) && state.contracts.length), null, 20000);
    const kept = await until(P, () => typeof calView === 'function' && calView() === 'agenda' && !!document.querySelector('#cal-ag'), null, 10000);
    check(kept, '4 a refresh lands on the Agenda again');

    /* 3 · Open lands on that contract */
    const first = await P.evaluate(() => { const b = document.querySelector('#cal-ag .cal-ag-a:not([data-cal-act])'); return b ? b.getAttribute('data-cal-ct') : null; });
    if (first){
      await P.click(`#cal-ag .cal-ag-a[data-cal-ct="${first}"]:not([data-cal-act])`);
      const landed = await until(P, id => (window.pdContract && pdContract() && pdContract().id === id) || (state.activeId === id && state.view !== 'calendar'), first, 10000);
      check(landed, '3 a row\'s Open lands on that contract', { first, view: await P.evaluate(() => state.view) });
      await P.evaluate(() => { setView('calendar'); });
      await until(P, () => !!document.querySelector('#cal-ag'), null, 8000);
    } else check(false, '3 a row with Open to press');

    for (const [w, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh }); await P.waitForTimeout(300); await still(P);
      const fit = await P.evaluate(() => { const card = document.querySelector('#cal-ag'); const cr = card && card.getBoundingClientRect();
        const bad = [...document.querySelectorAll('#cal-ag .cal-ag-ev')].filter(r => { const b = r.getBoundingClientRect(); return b.height > 30 || b.right > cr.right + 1; }).length;
        return { side: document.documentElement.scrollWidth > innerWidth, bad }; });
      check(!fit.side && fit.bad === 0, `5 ${w}×${hh}: each row on one line inside the card, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
