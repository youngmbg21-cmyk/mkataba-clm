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
      const mon = new Date(t); if (t.getDay() === 6) mon.setDate(t.getDate() + 2); else if (t.getDay() === 0) mon.setDate(t.getDate() + 1); else mon.setDate(t.getDate() - ((t.getDay() + 6) % 7));
      const at = (w, d) => { const x = new Date(mon); x.setDate(x.getDate() + 7 * w + d); return iso(x); };
      const late = new Date(t); late.setDate(t.getDate() - 3);
      const rows = [[iso(late), 'Check the September invoice'], [at(0, 4), 'Send a current insurance certificate'], [at(0, 5), 'A Saturday promise'],
        [at(1, 1), 'Decide whether to renew the lease'], [at(2, 2), 'Pay the storage fee'], [at(2, 4), 'Probation review'], [at(2, 3), 'Annual price review'],
        [at(4, 0), 'Food safety audit'], [at(12, 2), 'Annual audit']];
      c.obligations = rows.map(([due, desc], i) => ({ id: 'wk' + i, desc, due, party: 'us', recurring: 'none' }));
      persist(c);
      return { sat: at(0, 5), satWord: `${new Date(at(0, 5) + 'T00:00:00').toLocaleDateString(langLocale(), { weekday: 'short' })} ${new Date(at(0, 5) + 'T00:00:00').getDate()}`,
        fri0: at(0, 4), wk2: at(2, 0), mon1: at(1, 0) };
    });

    /* ---- 1 Obligations, week by week ---- */
    await page.evaluate(() => setView('obligations'));
    await until(() => document.querySelectorAll('.ob-lt tr.ins-grp').length >= 4, null, 10000);
    const READ = () => [...document.querySelectorAll('.ob-lt tr.ins-grp')].map(g => ({ k: g.getAttribute('data-ob-week'),
      word: ((g.querySelector('.ob-wk-fold') || g.querySelector('.ins-g') || {}).textContent || '').replace(/\d+$/, '').trim(),
      rng: (g.querySelector('.ob-wk-rng') || {}).textContent || '', shut: g.classList.contains('is-shut'),
      said: (g.querySelector('.ob-wk-said') || {}).textContent || '',
      rows: (() => { const out = []; let n = g.nextElementSibling; while (n && !n.classList.contains('ins-grp')) { out.push({ hidden: n.hidden, day: ((n.querySelector('.obw-late-when b') || n.querySelector('td:nth-child(3) .ins-c2 b') || n.querySelector('td b') || {}).textContent || '') }); /* RE-POINTED 28 Oct 2026 (THE LIST LANGUAGE): the duty leads, the day is the Due column's */ n = n.nextElementSibling; } return out; })() }));
    const G = await page.evaluate(READ);
    const by = k => G.find(g => g.k === k) || {};
    check('1a the groups are weeks, in order: Late, This week, Next week, the later weeks, Later',
      JSON.stringify(G.map(g => g.k)) === JSON.stringify(['overdue', 'w0', 'w1', 'w2', 'w4', 'later']), JSON.stringify(G.map(g => g.k)));
    check('1b This week and Next week say their Monday-to-Friday dates; Late says "Late"',
      /^Late/.test(by('overdue').word) && /^This week/.test(by('w0').word) && /\d+–\d+|–/.test(by('w0').rng) && /^Next week/.test(by('w1').word) && !!by('w1').rng, JSON.stringify(G.map(g => [g.word, g.rng])));
    check('1c a later week is folded to one line saying what it holds; its rows hidden; this week open',
      by('w2').shut && /Pay the storage fee · Annual price review · \+1 more/.test(by('w2').said) && by('w2').rows.every(r => r.hidden) && !by('w0').shut && by('w0').rows.every(r => !r.hidden), JSON.stringify(by('w2')));
    check('1d a row says its weekday ("Mon 19"); a Saturday promise stays in its own week with its own day',
      by('w0').rows.some(r => r.day === D.satWord) && by('w0').rows.every(r => /^\S+ \d+$/.test(r.day)), JSON.stringify(by('w0').rows));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'week-by-week-obligations-1440x780.png') });

    /* ---- 2 the folds ---- */
    await page.click('[data-obw-week="w2"]');
    const W2 = await until(() => { const g = document.querySelector('.ob-lt tr.ins-grp[data-ob-week="w2"]'); if (!g || g.classList.contains('is-shut')) return null;
      let n = g.nextElementSibling, open = 0; while (n && !n.classList.contains('ins-grp')) { if (!n.hidden) open++; n = n.nextElementSibling; } return { open }; });
    check('2a a press on a folded week opens it', !!W2 && W2.open === 3, JSON.stringify(W2));
    await page.click('[data-obw-weeks]');
    const ALL = await until(() => { const b = document.querySelector('[data-obw-weeks]'); if (!b || b.getAttribute('aria-pressed') !== 'true') return null;
      return { hidden: document.querySelectorAll('.ob-lt tbody tr[hidden]').length, word: b.textContent.trim() }; });
    check('2b "Open every week" opens them all, and turns to fold them again', !!ALL && ALL.hidden === 0 && /Fold/.test(ALL.word), JSON.stringify(ALL));
    await page.click('[data-obw-weeks]');

    /* ---- 3 the Calendar opens on this week and five more ---- */
    await page.evaluate(() => setView('calendar'));
    await until(() => !!document.querySelector('#cal-week #cal-wk-more'), null, 10000);
    const C = await page.evaluate(d => {
      const rows = [...document.querySelectorAll('#cal-wk-more .cal-wkm-row')];
      const fri = [...document.querySelectorAll('.cal-wk-alls .cal-wk-all')][4];
      return { view: calView(), hours: !!document.querySelector('#cal-wk-body .cal-wk-slot'), rows: rows.length,
        labels: rows.map(r => (r.querySelector('.cal-wkm-lab span') || {}).textContent || ''),
        days: rows[0] ? rows[0].querySelectorAll('.cal-wkm-d').length : 0,
        sat: fri ? [...fri.querySelectorAll('.cal-chip')].map(x => x.textContent) : [], satWord: d.satWord,
        wk2: rows[1] ? rows[1].getAttribute('data-cal-wkm') : '' };
    }, D);
    check('3a it opens on this week by the hour, five more weeks under it, Monday to Friday',
      C.view === 'week' && C.hours && C.rows === 5 && C.days === 5, JSON.stringify({ view: C.view, hours: C.hours, rows: C.rows, days: C.days }));
    /* RE-POINTED 18 Oct 2026 (lane A4, round 16 as drawn: "26–30 Oct · 3 due"):
       a week whose dates are all work owed says "N due", else "N dates" */
    check('3b each later week says how many dates it holds', C.labels[1] === '3 due' && C.labels[0] === '1 due' && C.labels[2] === 'nothing due', JSON.stringify(C.labels));
    check('3c this week\'s Saturday promise stands on the Friday, saying its own day', C.sat.some(t => t.startsWith(C.satWord + ' · ')), JSON.stringify(C.sat));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'week-by-week-calendar-1440x780.png') });
    await page.click(`#cal-wk-more .cal-wkm-d[data-cal-week="${D.wk2}"]`);
    const up = await until(d => { const a = calWeekStart(); const iso = `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, '0')}-${String(a.getDate()).padStart(2, '0')}`;
      return calView() === 'week' && iso === d && !!document.querySelector('#cal-wk-body .cal-wk-slot') ? iso : null; }, D.wk2);
    check('3d a press on a later week\'s day brings that week up by the hour', up === D.wk2, String(up));

    /* ---- 4 Monday to Friday on the month ---- */
    /* the month that holds the Saturday: its Friday before carries it (a
       greyed Friday where that Saturday is the 1st) */
    await page.evaluate(d => { calState.wk = null; const x = new Date(d.sat + 'T00:00:00'); calState.ym = { y: x.getFullYear(), m: x.getMonth() }; calSetView('month'); }, D);
    await until(() => !!document.getElementById('cal-grid'), null, 8000);
    const M = await page.evaluate(d => {
      const dow = [...document.querySelectorAll('.cal-grid .cal-dow span')].map(s => s.textContent.trim());
      const cells = document.querySelectorAll('#cal-grid .cal-day').length;
      const fri = document.querySelector(`#cal-grid .cal-day[data-cal-week="${d.fri0}"]`);
      return { dow, cells, fri: fri ? [...fri.querySelectorAll('.cal-chip')].map(x => x.textContent) : null };
    }, D);
    check('4a the month draws Monday to Friday, six weeks of five', M.dow.length === 5 && /^M/.test(M.dow[0]) && /^F/.test(M.dow[4]) && M.cells === 30, JSON.stringify({ dow: M.dow, cells: M.cells }));
    check('4b a Saturday\'s date stands on the Friday before, saying its own day', !!M.fri && M.fri.some(t => t.startsWith(D.satWord + ' · ')), JSON.stringify(M.fri));
    await page.evaluate(() => calSetView('week'));

    /* ---- 5 the owner's three screens ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const more = r('#cal-wk-more'), body = r('#cal-wk-body');
        return { weeks: !!more && more.bottom <= innerHeight + 1, hours: !!body && body.height >= 100, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`5 ${w}×${ht}: the calendar's six weeks whole, the hours room to read, nothing sideways`, F.weeks && F.hours && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `week-by-week-calendar-${w}x${ht}.png`) });
    }
    await page.evaluate(() => setView('obligations'));
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const g = document.querySelector('.ob-lt tr.ins-grp[data-ob-week="w0"]'), p = document.getElementById('ins-panel');
        return { week: !!g && g.getBoundingClientRect().bottom <= innerHeight, panel: !!p && p.getBoundingClientRect().right <= innerWidth + 1, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`5 ${w}×${ht}: Obligations' this week and its panel in view, nothing sideways`, F.week && F.panel && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `week-by-week-obligations-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
