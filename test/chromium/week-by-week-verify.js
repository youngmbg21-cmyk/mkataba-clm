/* OBLIGATIONS AND THE CALENDAR, "WEEK BY WEEK" (round 16 of the redesign: the
   owner picked "Week by week" by name and said yes to Monday to Friday
   everywhere, the month included, 17 Oct 2026; js/obligations.js
   obWeekGroups, js/views/calendar.js calMoreWeeksHtml, calMonthGridHtml)

   WHAT THIS PINS, driven in a real browser
     1 Obligations: the groups are weeks — Late, This week, Next week (each with
       its Monday-to-Friday dates), then each later week of six folded to one
       line saying what it holds, then Later; a row says its weekday ("Mon 19")
     2 a press on a folded week opens it; "Open every week" opens them all
     3 the Calendar opens on this week by the hour, five more weeks under it,
       one row each, each saying how many dates it holds; a press on a later
       week's day brings that week up by the hour
     4 Monday to Friday everywhere: the month draws five columns, and a
       Saturday's date stands on the Friday before, saying its own day
     5 the owner's three screens: both pages in view, the six weeks whole,
       nothing sideways
   Every date is built from today, so the answer never depends on the day it
   runs. Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/week-by-week-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* obligations placed by the working week they fall in, counted from the
       Monday "this week" names (the next one on a weekend) */
    const D = await page.evaluate(async () => {
      const c = getContract('MK-A2'); if (c._light) await ensureFull(c);
      const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const t = new Date(todayISO() + 'T00:00:00');
      /* RE-POINTED 23 Nov 2026 (P-14, the Calendar the Legora + Stripe way): the Week tab is this week Monday to Sunday
         (calLsWeek), a weekend included — so "this week" is always today's own Monday */
      const mon = new Date(t); mon.setDate(t.getDate() - ((t.getDay() + 6) % 7));
      const at = (w, d) => { const x = new Date(mon); x.setDate(x.getDate() + 7 * w + d); return iso(x); };
      const late = new Date(t); late.setDate(t.getDate() - 3);
      const rows = [[iso(late), 'Check the September invoice'], [at(0, 4), 'Send a current insurance certificate'], [at(0, 5), 'A Saturday promise'],
        [at(1, 1), 'Decide whether to renew the lease'], [at(2, 2), 'Pay the storage fee'], [at(2, 4), 'Probation review'], [at(2, 3), 'Annual price review'],
        [at(4, 0), 'Food safety audit'], [at(12, 2), 'Annual audit']];
      c.obligations = rows.map(([due, desc], i) => ({ id: 'wk' + i, desc, due, party: 'us', recurring: 'none' }));
      persist(c);
      return { sat: at(0, 5), satWord: `${new Date(at(0, 5) + 'T00:00:00').toLocaleDateString(langLocale(), { weekday: 'short' })} ${new Date(at(0, 5) + 'T00:00:00').getDate()}`,
        fri0: at(0, 4), wk2: at(2, 0), mon1: at(1, 0), from: at(0, 0), to: at(0, 6), thenTo: at(5, 6),
        seeded: c.obligations.map(o => ({ id: o.id, due: o.due, desc: o.desc })) };
    });

    /* RETIRED 16 Nov 2026 (#762): sections 1 and 2 (Obligations grouped by week — Late, This week, Next week, the later
       weeks folded to one line, "Open every week") — the new look's Obligations page is the project list (obnRender:
       pills Late · Tracked · Proposals, twenty a page), which draws no week groups; obligations-project-list-verify and
       round5-new-look-verify pin it */

    /* ---- 3 the Calendar's Week: this week as one calm table, the coming weeks folded into one line ----
       RE-POINTED 29 Oct 2026 (round 12, owner's yes): the calendar opens on the Agenda; Week is its own tab
       RE-POINTED 23 Nov 2026 (P-14, owner's "Build P-14": Calendar the Legora + Stripe way on all four tabs): Week is this
       week (Monday to Sunday) as the Agenda's calm table, what is late leading, then the next five weeks folded into ONE
       line counting their dates with "Show them" (the Agenda); the hours grid and the five week rows are gone. The Month is
       a soft SEVEN-day grid (reverses round 16's Monday to Friday there), a weekend's date on its own day. */
    await page.evaluate(() => setView('calendar'));
    await until(() => document.querySelectorAll('[data-cal-view]').length >= 4, null, 10000);
    /* the Agreement chip narrows the page to the contract this stage seeded, so every count below is this stage's own */
    await page.evaluate(() => { const F = calLsF(); F.cid = 'MK-A2'; F.kind = 'all'; F.whose = 'all'; F.show = 'all'; calSetView('week'); });
    await until(() => calView() === 'week' && !!document.querySelector('.cal-page.is-ls #cal-ag .cls-then'), null, 10000);
    const C = await page.evaluate(d => {
      const today = todayISO();
      const rows = [...document.querySelectorAll('.cal-page.is-ls #cal-ag tr.cls-r[data-cal-pick]')].map(r => {
        const k = r.getAttribute('data-cal-pick').split('|'); return { cid: k[0], type: k[1], date: k[2], ob: k[3] || '', day: (r.querySelector('.cls-dt') || {}).textContent || '' }; });
      const ours = rows.filter(r => r.cid === 'MK-A2' && r.type === 'obligation').map(r => r.ob).sort();
      const want = d.seeded.filter(o => o.due < today || (o.due >= d.from && o.due <= d.to)).map(o => o.id).sort();
      /* the coming five weeks: the seeded duties, and this contract's own dates, that fall in them */
      const after = x => x > d.to && x <= d.thenTo;
      const thenWant = d.seeded.filter(o => after(o.due)).length
        + (calEventsOnce() || []).filter(e => e && e.cid === 'MK-A2' && !e.own && !e.done && e.type !== 'obligation' && after(e.date)).length;
      const then = (document.querySelector('.cal-page.is-ls #cal-ag .cls-then-h') || {}).textContent || '';
      const sat = rows.find(r => r.ob === 'wk2');
      return { view: calView(), ours, want, others: rows.filter(r => r.cid !== 'MK-A2').length, then, thenWant,
        satDay: sat ? sat.day : null, satWord: calDateWords(d.sat, { weekday: 'short' }),
        hours: !!document.querySelector('#cal-wk-body .cal-wk-slot'), show: !!document.querySelector('.cal-page.is-ls .cls-then [data-cal-view="agenda"]') };
    }, D);
    check('3a Week is this week as one calm table: what is late, then Monday to Sunday, only the chosen agreement',
      C.view === 'week' && !C.hours && C.ours.join() === C.want.join() && C.others === 0, JSON.stringify({ view: C.view, hours: C.hours, ours: C.ours, want: C.want, others: C.others }));
    check('3b the coming five weeks fold into one line counting their dates',
      new RegExp('· ' + C.thenWant + ' dates?\\b').test(C.then) && C.thenWant >= 4, JSON.stringify({ then: C.then, want: C.thenWant }));
    check('3c this week\'s Saturday promise stands on its own day, saying it', !!C.satDay && C.satDay.startsWith(C.satWord + ' '), JSON.stringify({ day: C.satDay, word: C.satWord }));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'week-by-week-calendar-1440x780.png') });
    if (C.show) await page.click('.cal-page.is-ls .cls-then [data-cal-view="agenda"]');
    const up = await until(() => calView() === 'agenda' && !!document.querySelector('.cal-page.is-ls #cal-ag tr.cls-r[data-cal-pick$="|wk3"]') ? 'agenda' : null);
    check('3d "Show them" on the folded weeks opens the Agenda, the next week\'s date in it', C.show && up === 'agenda', String(up));

    /* ---- 4 the month: seven columns, a weekend's date on its own day ---- */
    await page.evaluate(d => { calState.wk = null; const x = new Date(d.sat + 'T00:00:00'); calState.ym = { y: x.getFullYear(), m: x.getMonth() }; calSetView('month'); }, D);
    await until(() => !!document.querySelector('.cal-page.is-ls #cal-grid .cls-d'), null, 8000);
    const M = await page.evaluate(d => {
      const dow = [...document.querySelectorAll('.cal-page.is-ls #cal-grid .cls-mh')].map(s => s.textContent.trim());
      const cells = document.querySelectorAll('.cal-page.is-ls #cal-grid .cls-d').length;
      const sat = document.querySelector(`.cal-page.is-ls #cal-grid .cls-d[data-cal-pick="${d.sat}"]`);
      return { dow, cells, we: !!sat && sat.classList.contains('is-we'), satHas: !!sat && ([...sat.querySelectorAll('.cls-ev')].some(x => x.getAttribute('title') === 'A Saturday promise') || !!sat.querySelector('.cls-more')) };
    }, D);
    check('4a the month draws seven columns, six weeks of seven, Monday first', M.dow.length === 7 && /^M/.test(M.dow[0]) && /^S/.test(M.dow[6]) && M.cells === 42, JSON.stringify({ dow: M.dow, cells: M.cells }));
    if (M.cells) await page.click(`.cal-page.is-ls #cal-grid .cls-d[data-cal-pick="${D.sat}"]`).catch(() => {});
    const side = await until(() => { const p = document.querySelector('#cal-plan .cls-side'); return p && /A Saturday promise/.test(p.textContent) ? true : null; }, null, 4000);
    check('4b a Saturday\'s date stands on the Saturday itself (a weekend column), and choosing it the panel says it', M.we && M.satHas && !!side, JSON.stringify({ we: M.we, has: M.satHas, side: !!side }));
    await page.evaluate(() => calSetView('week'));
    await until(() => !!document.querySelector('.cal-page.is-ls #cal-ag .cls-then'), null, 6000);

    /* ---- 5 the owner's three screens ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const b = document.getElementById('cal-ls-body'), r = b ? b.getBoundingClientRect() : null;
        const then = document.querySelector('#cal-ls-body .cls-then');
        return { body: !!r && r.bottom <= innerHeight + 1 && r.height >= 100, then: !!then && b.contains(then) && then.getBoundingClientRect().height > 0,
          side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`5 ${w}×${ht}: the week's table and its folded weeks inside the page, room to read, nothing sideways`, F.body && F.then && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `week-by-week-calendar-${w}x${ht}.png`) });
    }
    /* RETIRED 16 Nov 2026 (#762): the three screens on Obligations' "this week" group — no week groups in the new look */
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
