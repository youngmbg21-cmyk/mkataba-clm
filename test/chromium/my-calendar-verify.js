/* Chromium verification: ONE CALENDAR — CONTRACT DATES AND YOUR OWN
   ============================================================
   Young, 10 Oct 2026 (the "HaTi Proposals" artifact, Part 3): "combine layers
   which looks at monthly view with the week planner to make it one calendar
   ... combine it with the horizon view". At 1440 x 900:
     1. the views are Month · Week · Horizon
     2. + New event writes an event to MY calendar; it shows in the Week at its
        day and hour, and in the Month as a chip
     3. the day's number in the Month opens that week
     4. the layers hide and show: My calendar off takes the event away
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
    /* a day two days ahead on a weekday, and its Monday */
    const D = await page.evaluate(() => {
      const t = new Date(todayISO() + 'T00:00:00'); t.setDate(t.getDate() + 2);
      while (t.getDay() === 0 || t.getDay() === 6) t.setDate(t.getDate() + 1);
      const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { day: iso(t) };
    });
    await page.evaluate(() => setView('calendar'));
    const views = await until(() => { const v = [...document.querySelectorAll('[data-cal-view]')].map(e => e.getAttribute('data-cal-view')); return v.length ? v : null; });
    check('1. the views are Month · Week · Horizon', !!views && views.join(' ') === 'month week horizon', views && views.join(' '));

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
    const blk = await until(id => { const b = document.querySelector(`#cal-week .cal-wk-blk[data-cal-mine="${id}"]`); return b ? { top: Math.round(parseFloat(b.style.top)), text: b.textContent.trim() } : null; }, stored && stored.id);
    check('2. + New event stores it in my calendar and the Week draws it at its hour', !!stored && stored.start === '10:00' && !!blk, JSON.stringify({ stored: !!stored, blk }));
    await page.screenshot({ path: path.join(OUT, '1-week.png') });
    const theirs = await W.unrestricted.json('/api/me/items');
    check('2b. a colleague sees none of it', Array.isArray(theirs.items) && theirs.items.length === 0, String(theirs.items && theirs.items.length));

    /* the Month carries it as a chip; the day's number opens the week */
    await page.evaluate(day => { const d = new Date(day + 'T00:00:00'); calState.ym = { y: d.getFullYear(), m: d.getMonth() }; calSetView('month'); }, D.day);
    const chip = await until(id => !!document.querySelector(`#cal-grid .cal-chip[data-cal-mine="${id}"]`), stored && stored.id);
    check('2c. the Month shows it as a chip of my calendar', !!chip);
    await page.click(`#cal-grid .cal-dn[data-cal-week="${D.day}"]`);
    const wk = await until(() => calView() === 'week' && !!document.getElementById('cal-week'));
    check('3. the day\'s number in the Month opens that week', !!wk);

    /* 4. the layers */
    await page.click('[data-cal-lay="me"]');
    const gone = await until(id => !document.querySelector(`.cal-wk-blk[data-cal-mine="${id}"]`), stored && stored.id);
    await page.click('[data-cal-lay="me"]');
    const back = await until(id => !!document.querySelector(`.cal-wk-blk[data-cal-mine="${id}"]`), stored && stored.id);
    check('4. My calendar off takes the event away, and on brings it back', !!gone && !!back);

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
    const dashed = await page.evaluate(() => { const b = document.querySelector('.cal-wk-blk.is-plan'); return b ? getComputedStyle(b).borderTopStyle : ''; });
    check('5. Copilot\'s suggestions come with Add · Discard and show dashed on the week', !!props && props.every(t => /Add/.test(t) && /Discard/.test(t)) && dashed === 'dashed', JSON.stringify({ props, dashed }));
    check('5b. what did not fit is said', await page.evaluate(() => /did not fit/.test(document.getElementById('cal-plan').textContent)));
    await page.click('.cal-prop [data-cal-plan-add]');
    const added = await until(() => (mineList('event') || []).find(e => e.title === 'Decide MK-A1 notice' && e.source === 'copilot') ? document.querySelector('.cal-prop.is-added [data-cal-plan-undo]') && true : null);
    const solid = await page.evaluate(() => { const ev = mineList('event').find(e => e.title === 'Decide MK-A1 notice'); const b = ev && document.querySelector(`.cal-wk-blk[data-cal-mine="${ev.id}"]`); return b ? getComputedStyle(b).borderLeftStyle + '/' + getComputedStyle(b).borderTopStyle : ''; });
    check('5c. Add stores the block in my calendar and it draws solid (no dashes), with Undo', !!added && solid === 'solid/none', solid);
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
    const note = await until(() => { const n = document.querySelector('#cal-week [data-cal-note]'); return n ? n.textContent.trim() : null; });
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
