/* Chromium verification: ONE CALENDAR — CONTRACT DATES AND YOUR OWN
   ============================================================
   Young, 10 Oct 2026 (the "HaTi Proposals" artifact, Part 3): "combine layers
   which looks at monthly view with the week planner to make it one calendar
   ... combine it with the horizon view". At 1440 x 900:
     1. the views are Month · Week · Horizon
     2. + New event writes an event to MY calendar; it shows in the Week at its
        day and hour, and in the Month as a chip
     3. a day in the Month is chosen and the panel says its dates, the event
        among them (P-14, 23 Nov 2026; it opened that week before)
     4. + Whose: Mine keeps the event, another side takes it away, All
        brings it back (P-14 draws no layer switches)
     5. Copilot's plan (the route stubbed): suggestions are dashed with
        Add · Discard; Add puts the block in the calendar (stored), Undo takes
        it out, Discard leaves a line with Undo
     6. a note's review day shows in My calendar
     7. no page errors
   Waits ask for the state, bounded. Red at main d259278 (1-6).
   Screenshots: test/chromium/shots/my-calendar/ (or HATI_SHOT_DIR).
   Run: node test/chromium/my-calendar-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'my-calendar');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 2, null, { timeout: 20000 });
    /* RE-POINTED 23 Nov 2026 (P-14: the new look's Week is THIS week, Monday to Sunday, as one table): the day is
       tomorrow, or today on a Sunday, so it is always inside the week drawn */
    const D = await page.evaluate(() => {
      const t = new Date(todayISO() + 'T00:00:00'); if (t.getDay() !== 0) t.setDate(t.getDate() + 1);
      const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { day: iso(t) };
    });
    /* RE-POINTED 11 Oct 2026 (Calendar is Home's tab): the server's list lands
       before the tab is asked for, so the start-up's own "back to where you
       were" cannot turn Home back to the Board under the check */
    await page.waitForFunction(() => state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(600);
    await page.evaluate(() => setView('calendar'));
    const views = await until(() => { const v = [...document.querySelectorAll('[data-cal-view]')].filter(e => e.getClientRects().length > 0).map(e => e.getAttribute('data-cal-view')); return v.length ? v : null; });
    /* RE-POINTED 29 Oct 2026 (round 12): the Agenda tab leads Month · Week · Horizon */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the new head draws its own tabs (.cal-nl-tabs);
       the views counted are the ones a person sees (painted), once */
    check('1. the views are Agenda · Month · Week · Horizon', !!views && views.join(' ') === 'agenda month week horizon', views && views.join(' '));

    /* 2. a new event, from the button, on the Week */
    await page.evaluate(day => { calState.wk = day; calSetView('week'); }, D.day);
    await until(() => !!document.getElementById('cal-week'));
    await page.click('#cal-new');
    await until(() => !!document.getElementById('cal-ev-title'));
    await page.fill('#cal-ev-title', 'Prep the AIT renewal call');
    /* HaTi dresses a date box with its own picker (datePickDress), so the
       value is set the way that picker sets it */
    await page.evaluate(day => { for (const [id, v] of [['cal-ev-date', day], ['cal-ev-start', '10:00'], ['cal-ev-end', '11:00']]){
      const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } }, D.day);
    await page.click('#cal-ev-save');
    const stored = await until(() => (mineList('event') || []).find(e => e.title === 'Prep the AIT renewal call') || null);
    /* RE-POINTED 23 Nov 2026 (P-14: the Week is one table): the event is a row of its own, its act opening it
       (data-cal-mine), its badge "Mine", its hour said under its title */
    const blk = await until(id => { const b = document.querySelector(`#cal-week tr.cls-r.is-mine [data-cal-mine="${id}"]`); const r = b && b.closest('tr');
      return r && /10:00/.test(r.textContent) && /Prep the AIT renewal call/.test(r.textContent) ? { text: r.textContent.replace(/\s+/g, ' ').trim() } : null; }, stored && stored.id);
    check('2. + New event stores it in my calendar and the Week draws it at its hour', !!stored && stored.start === '10:00' && !!blk, JSON.stringify({ stored: !!stored, blk }));
    await page.screenshot({ path: path.join(OUT, '1-week.png') });
    const theirs = await W.unrestricted.json('/api/me/items');
    check('2b. a colleague sees none of it', Array.isArray(theirs.items) && theirs.items.length === 0, String(theirs.items && theirs.items.length));

    /* the Month carries it as a chip; the day's number opens the week */
    await page.evaluate(day => { const d = new Date(day + 'T00:00:00'); calState.ym = { y: d.getFullYear(), m: d.getMonth() }; calSetView('month'); }, D.day);
    /* RE-POINTED 23 Nov 2026 (P-14: the month's chips are .cls-ev in their day) */
    const chip = await until(([id, day]) => !!document.querySelector(`#cal-grid .cls-d[data-cal-pick="${day}"] .cls-ev[data-cal-mine="${id}"]`), [stored && stored.id, D.day]);
    check('2c. the Month shows it as a chip of my calendar', !!chip);
    /* RE-POINTED 23 Nov 2026 (P-14: a day press chooses, the panel follows) */
    await page.click(`#cal-grid .cls-d[data-cal-pick="${D.day}"] .cls-n`);
    const chosen = await until(day => { const d = document.querySelector(`#cal-grid .cls-d[data-cal-pick="${day}"]`); const p = document.getElementById('cal-plan');
      return d && d.classList.contains('is-chosen') && calView() === 'month' && p && /Prep the AIT renewal call/.test(p.textContent) ? true : null; }, D.day);
    check('3. a day in the Month is chosen and the panel says its dates, my event among them', !!chosen);
    await page.click('[data-cal-view="week"]');
    await until(() => calView() === 'week' && !!document.getElementById('cal-week'));

    /* 4. RE-POINTED 23 Nov 2026 (P-14 draws no layer switches; + Whose is the one way to narrow): pressed, Whose
       steps to Mine and the event stays (it is mine); another side takes it away and All brings it back. A choice
       with no rows behind it is not offered as a chip (this world has no contract dates this week), so the other
       side is set as the chip's own step sets it */
    const mineKept = await (async () => { const b = await page.$('[data-cal-ls-chip="whose"]'); if (!b) return null; await b.click();
      return until(id => calLsF().whose === 'mine' && !!document.querySelector(`#cal-week [data-cal-mine="${id}"]`), stored && stored.id); })();
    await page.evaluate(() => { calLsF().whose = 'theirs'; calState.scope = 'all'; calLsRepaint(); });
    const gone = await until(id => !!document.getElementById('cal-week') && !document.querySelector(`#cal-week [data-cal-mine="${id}"]`), stored && stored.id);
    await page.evaluate(() => { calLsF().whose = 'all'; calState.scope = 'all'; calLsRepaint(); });
    const back = await until(id => !!document.querySelector(`#cal-week [data-cal-mine="${id}"]`), stored && stored.id);
    check('4. Whose: Mine keeps the event, another side takes it away, All brings it back', !!mineKept && !!gone && !!back, JSON.stringify({ mineKept: !!mineKept, gone: !!gone, back: !!back }));

    /* 5. Copilot's plan, the route stubbed in the page */
    await page.evaluate(day => {
      const real = window.api;
      window.api = async (p, m, b) => {
        if (p === 'ai/plan') return { say: 'Two blocks before your deadlines.', dropped: 1, blocks: [
          { date: day, start: '13:00', end: '14:00', title: 'Decide MK-A1 notice', why: 'The notice deadline is close.', contractId: 'MK-A1' },
          { date: day, start: '15:00', end: '15:30', title: 'Read MK-A2 before signing', why: 'Free after lunch.', contractId: 'MK-A2' }] };
        return real(p, m, b);
      };
    }, D.day);
    await page.click('[data-cal-plan-q="week"]');
    const props = await until(() => { const p = [...document.querySelectorAll('.cal-prop')]; return p.length === 2 ? p.map(x => x.textContent.replace(/\s+/g, ' ').trim()) : null; });
    /* RE-POINTED 23 Nov 2026 (P-14: an offered block is a row on the Week, its badge dashed) */
    const dashed = await until(() => { const b = document.querySelector('#cal-week tr.cls-r.is-plan .cls-b'); return b ? getComputedStyle(b).borderTopStyle : null; });
    check('5. Copilot\'s suggestions come with Add · Discard and show dashed on the week', !!props && props.every(t => /Add/.test(t) && /Discard/.test(t)) && dashed === 'dashed', JSON.stringify({ props, dashed }));
    check('5b. what did not fit is said', await page.evaluate(() => /did not fit/.test(document.getElementById('cal-plan').textContent)));
    await page.click('.cal-prop [data-cal-plan-add]');
    const added = await until(() => (mineList('event') || []).find(e => e.title === 'Decide MK-A1 notice' && e.source === 'copilot') ? document.querySelector('.cal-prop.is-added [data-cal-plan-undo]') && true : null);
    /* RE-POINTED 23 Nov 2026 (P-14): the added block is a row of my calendar, its badge without dashes */
    const solid = await until(() => { const ev = mineList('event').find(e => e.title === 'Decide MK-A1 notice'); const a = ev && document.querySelector(`#cal-week tr.cls-r.is-mine [data-cal-mine="${ev.id}"]`);
      const b = a && a.closest('tr').querySelector('.cls-b'); return b ? getComputedStyle(b).borderTopStyle : null; });
    check('5c. Add stores the block in my calendar and it draws solid (no dashes), with Undo', !!added && solid === 'none', solid);
    await page.screenshot({ path: path.join(OUT, '2-plan.png') });
    await page.click('.cal-prop.is-added [data-cal-plan-undo]');
    const undone = await until(() => !(mineList('event') || []).some(e => e.title === 'Decide MK-A1 notice') ? true : null);
    const srv = await W.admin.json('/api/me/items?kind=event');
    check('5d. Undo takes it out again (on the server too)', !!undone && !srv.items.some(e => e.title === 'Decide MK-A1 notice'));
    await page.click('.cal-prop [data-cal-plan-discard]');
    const disc = await until(() => { const g = document.querySelector('.cal-prop.is-gone'); return g && g.querySelector('[data-cal-plan-undo]') ? g.textContent.replace(/\s+/g, ' ') : null; });
    check('5e. Discard leaves one line with Undo', !!disc, disc);

    /* 6. a note's review day is on my calendar */
    await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'Check the liability cap', reviewBy: D.day } } });
    await page.evaluate(() => mineLoad(true).then(() => renderCalendar()));
    /* RE-POINTED 23 Nov 2026 (P-14): the note's row carries its act (data-cal-note); its words are the row's */
    const note = await until(() => { const n = document.querySelector('#cal-week tr.cls-r.is-note [data-cal-note]'); return n ? n.closest('tr').textContent.replace(/\s+/g, ' ').trim() : null; });
    check('6. a note\'s review day shows in My calendar', !!note && /liability cap/.test(note), note);
    check('7. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run stopped', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
