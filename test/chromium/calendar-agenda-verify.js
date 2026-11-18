/* CALENDAR AS AN AGENDA (round 12, "The Legora way", owner's overnight build of 28 Oct 2026)
   A tab beside Month · Week · Horizon: the next ninety days as a quiet dated list.
     1 · the calendar still opens on Week (round 16's landing kept); Agenda is the first tab
     2 · Agenda lists every contract date of the next 90 days the screen may draw, by day, each with its mark, its
         contract and one word to press; a run of weeks with nothing due is ONE line; the foot counts the dates
     3 · a row's Open lands on that contract
     4 · the tab is kept across a refresh
     5 · the owner's three screens: every row on one line inside the card, nothing sideways
     6 · a long agenda scrolls (new look, 1536×730): its foot comes into sight, the tabs stay put
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
    await until(P, () => !!document.getElementById('igd-input'), null, 10000); await settled(P);
    await P.evaluate(() => setView('calendar'));
    const seg = await until(P, () => document.querySelectorAll('[data-cal-view]').length >= 4, null, 10000);
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the tabs a person sees are the new head's
       (.cal-nl-tabs); the old segmented row is still in the markup, hidden */
    const s1 = await P.evaluate(() => ({ view: calView(), tabs: [...document.querySelectorAll('.cal-nl-tabs [data-cal-view]')].map(x => x.getAttribute('data-cal-view')) }));
    /* RE-POINTED 29 Oct 2026 (round 12's last part, owner's yes): the calendar opens on the Agenda, its first tab */
    check(seg && s1.view === 'agenda' && s1.tabs[0] === 'agenda' && s1.tabs.join() === 'agenda,month,week,horizon', '1 it opens on the Agenda, its first tab', s1);

    await settled(P);
    await P.click('.cal-nl-tabs [data-cal-view="agenda"]');
    /* RE-POINTED 16 Nov 2026 (#762): the new look's Agenda (calAgendaNlHtml) is one row per DAY (data-cal-ag-day): its
       kind mark, the day's dates in words, the first one's contract under them and one word to press; a run of empty
       weeks is one quiet row (.is-none, no day of its own) */
    const on = await until(P, () => !!document.querySelector('#cal-ag .cal-nl-r[data-cal-ag-day]'), null, 8000);
    const A = await P.evaluate(() => {
      const T = todayISO();
      const want = [...new Set(calUpcoming(calVisible(calendarEvents()), CAL_AGENDA_VIEW_DAYS).map(e => e.date))].filter(d => d !== T).sort();
      const rows = [...document.querySelectorAll('#cal-ag .cal-nl-r[data-cal-ag-day]')].filter(r => r.getAttribute('data-cal-ag-day') !== T);
      const got = rows.map(r => r.getAttribute('data-cal-ag-day')).sort();
      const all = [...document.querySelectorAll('#cal-ag .cal-nl-r')];
      const weeks = all.filter(r => r.classList.contains('is-none') && !r.hasAttribute('data-cal-ag-day'));
      let twoNoneInARow = false; all.forEach((d, i) => { if (i && weeks.includes(d) && weeks.includes(all[i - 1])) twoNoneInARow = true; });
      return { want: want.length, got: got.length, same: JSON.stringify(want) === JSON.stringify(got),
        eachHas: rows.every(r => r.querySelector('.cal-kind') && r.querySelector('.cal-nl-t small') && r.querySelector('.cal-nl-a .cal-nl-go')),
        none: weeks.length, twoNoneInARow };
    });
    check(on && A.want > 0 && A.same && A.eachHas, '2a every date of the next 90 days is a row with its mark, contract and one word', A);
    check(A.none >= 1 && !A.twoNoneInARow, '2b a run of empty weeks is one line', A);
    /* RETIRED 16 Nov 2026 (#762): 2c "the foot counts the dates" — the new look's Agenda draws no foot (calAgendaNlHtml) */
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780.png') });

    /* 4 · the tab survives a refresh (before 3 leaves the page) */
    await P.evaluate(() => { if (typeof placeSave === 'function') placeSave(); });
    await P.reload({ waitUntil: 'networkidle' });
    await until(P, () => !!(window.state && Array.isArray(state.contracts) && state.contracts.length), null, 20000);
    const kept = await until(P, () => typeof calView === 'function' && calView() === 'agenda' && !!document.querySelector('#cal-ag .cal-nl'), null, 10000);
    check(kept, '4 a refresh lands on the Agenda again');

    /* 3 · Open lands on that contract */
    const first = await P.evaluate(() => { const b = document.querySelector('#cal-ag .cal-nl-go[data-cal-ct]:not([data-cal-act])'); return b ? b.getAttribute('data-cal-ct') : null; });
    if (first){
      await P.click(`#cal-ag .cal-nl-go[data-cal-ct="${first}"]:not([data-cal-act])`);
      const landed = await until(P, id => (window.pdContract && pdContract() && pdContract().id === id) || (state.activeId === id && state.view !== 'calendar'), first, 10000);
      check(landed, '3 a row\'s Open lands on that contract', { first, view: await P.evaluate(() => state.view) });
      /* RE-POINTED 18 Nov 2026 (#762): the landing is let finish (on the paper, bounded) before the Calendar is asked for
         again — a quicker return was overtaken by the landing, which put the contract's Cover over the Calendar and 6b
         wheeled the Cover (traced: "under": "cv-notes") */
      await until(P, id => window.pdContract && pdContract() && pdContract().id === id && typeof hbFace === 'function' && hbFace() === 'paper', first, 10000);
      await until(P, () => !!document.querySelector('.cv-page'), null, 5000);
      await P.evaluate(() => { setView('calendar'); });
      await until(P, () => !!document.querySelector('#cal-ag'), null, 8000);
    } else check(false, '3 a row with Open to press');

    for (const [w, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh }); await P.waitForTimeout(300); await still(P);
      const fit = await P.evaluate(() => { const card = document.querySelector('#cal-ag'); const cr = card && card.getBoundingClientRect();
        /* RE-POINTED 16 Nov 2026 (#762): a new-look row is two lines by drawing (the dates, the contract under them):
           each of its lines on ONE line, the row inside the card */
        const one = el => { if (!el) return true; const lh = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.5; return el.getBoundingClientRect().height < lh * 1.6; };
        const bad = [...document.querySelectorAll('#cal-ag .cal-nl-r')].filter(r => { const b = r.getBoundingClientRect(); return !one(r.querySelector('.cal-nl-t b')) || !one(r.querySelector('.cal-nl-t small')) || (r.querySelector('.cal-nl-go') && r.querySelector('.cal-nl-go').getBoundingClientRect().height >= 40) || b.right > cr.right + 1; }).length;
        return { side: document.documentElement.scrollWidth > innerWidth, bad }; });
      check(!fit.side && fit.bad === 0, `5 ${w}×${hh}: each row on one line inside the card, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    /* 6 · THE AGENDA SCROLLS (owner, 10 Nov 2026: "I am unable to scroll in the calendar page"): with more dates than
       the window holds, in the new look at the shortest screen, a wheel over the list moves it and its foot comes into
       sight under the pointer, while the head with its tabs stays where it was */
    await P.setViewportSize({ width: 1536, height: 730 });
    await P.evaluate(async () => { const u = currentUser(); u.prefs = u.prefs || {}; u.prefs.newLook = true; newLookApply();
      /* eighteen more dated duties on a signed contract, in this page only (nothing saved): more than the window holds */
      const t0 = new Date(todayISO() + 'T00:00:00'), c = state.contracts.find(x => x.status === 'Signed') || state.contracts[0];
      c.obligations = (c.obligations || []).slice();
      for (let i = 0; i < 18; i++){ const d = new Date(t0); d.setDate(d.getDate() + 2 + i * 4);
        c.obligations.push({ id: 'agscroll' + i, desc: 'Agenda scroll check ' + (i + 1), due: d.toISOString().slice(0, 10) }); }
      calState.view = 'agenda'; renderCalendar(); });
    await until(P, () => document.querySelectorAll('#cal-ag .cal-nl-r').length >= 18, null, 8000); await settled(P); await still(P);
    const before = await P.evaluate(() => { const R = document.querySelectorAll('#cal-ag .cal-nl-r'), ft = R[R.length - 1], tab = document.querySelector('[data-cal-view="agenda"]');
      return { ftTop: ft ? Math.round(ft.getBoundingClientRect().top) : null, tabTop: tab ? Math.round(tab.getBoundingClientRect().top) : null, h: innerHeight }; });
    /* RE-POINTED 18 Nov 2026 (#762): the pointer is put on a row of the list that is painted where it is (GitHub's run once
       wheeled over something else and nothing moved); what stands under it is reported with the result */
    const box = await P.evaluate(() => { const ag = document.querySelector('#cal-ag'), r = ag.getBoundingClientRect();
      const row = [...ag.querySelectorAll('.cal-nl-r')].find(x => { const q = x.getBoundingClientRect(); if (q.top < 0 || q.bottom > innerHeight - 40) return false;
        const hit = document.elementFromPoint(Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2)); return !!hit && x.contains(hit); });
      const q = row ? row.getBoundingClientRect() : r;
      const x = Math.round(q.left + q.width / 2), y = Math.round(row ? q.top + q.height / 2 : Math.min(r.top + 200, innerHeight - 100));
      const hit = document.elementFromPoint(x, y); return { x, y, onRow: !!row, under: hit ? (hit.id || hit.className || hit.tagName).toString().slice(0, 60) : null }; });
    await P.mouse.move(box.x, box.y);
    /* RE-POINTED 18 Nov 2026 (#762): on a slow runner a late repaint could swallow the first wheels (GitHub saw the foot not
       move at all), so the wheel turns again while the foot is not yet in sight, bounded — still only the wheel moves it */
    const footSeen = () => P.evaluate(() => { const R = document.querySelectorAll('#cal-ag .cal-nl-r'), ft = R[R.length - 1]; const r = ft && ft.getBoundingClientRect();
      const hit = r ? document.elementFromPoint(Math.round(r.left + 8), Math.round(r.top + r.height / 2)) : null; return !!(r && r.bottom <= innerHeight && hit && ft.contains(hit)); });
    for (let round = 0; round < 4; round++){
      await P.mouse.move(box.x, box.y);
      for (let i = 0; i < 12; i++){ await P.mouse.wheel(0, 400); await P.waitForTimeout(60); }
      await P.waitForTimeout(400);
      if (await footSeen()) break;
    }
    const after = await P.evaluate(() => { const R = document.querySelectorAll('#cal-ag .cal-nl-r'), ft = R[R.length - 1], tab = document.querySelector('[data-cal-view="agenda"]');
      const r = ft && ft.getBoundingClientRect(); const hit = r ? document.elementFromPoint(Math.round(r.left + 8), Math.round(r.top + r.height / 2)) : null;
      return { ftTop: r ? Math.round(r.top) : null, ftSeen: !!(r && r.bottom <= innerHeight && hit && ft.contains(hit)), tabTop: tab ? Math.round(tab.getBoundingClientRect().top) : null }; });
    check(before.ftTop != null && before.ftTop > before.h, '6a the long agenda runs past the window (the case being checked)', before);
    check(after.ftSeen && after.tabTop === before.tabTop, '6b a wheel over the list scrolls it to its foot; the tabs stay put', { before, after, box });
    await P.screenshot({ path: path.join(OUT, 'scrolled-1536x730.png') });
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
