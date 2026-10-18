/* JAMBO'S WORK, "OPEN IN PLACE" (round 23 of the redesign: the owner picked
   "Open in place" by name, 17 Oct 2026; levels "Each person chooses"; the
   button word "Put away"; js/views/counter.js, js/views/jambohouse.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 the Counter's first row opens where it is: the page stays the Counter,
       one row per prepared piece with Look · its acts · Put away, no filled
       button among them; Look opens the piece's whole body, Hide shuts it;
       Close folds the row back
     2 the house is one link away
     3 each person chooses: on the agent's card in the house, "For you"
       offers the company's level and the steps below it, never Just do it;
       Leave it to me takes the agent's piece off the Counter, kept on the
       server (a fresh load still has it); the company's brings it back; the
       route refuses a person's Just do it
     4 Put away takes the piece off the list
     5 it fits the owner's three screens with the row open
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/open-in-place-verify.js */
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
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
/* the lease ends inside the renewals agent's window, counted from today, so
   the answer never depends on the day this runs */
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const CONTRACTS = [
  H.fixtureContract('MK-OP1', 'Raw milk supply', 'Nandi Dairy', H.FOLDER_A, 12e6, 'Signed'),
  H.fixtureContract('MK-OP2', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
];
CONTRACTS[1].metadata = { ...(CONTRACTS[1].metadata || {}), expiryDate: day(40) };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    const toCounter = async () => { await page.evaluate(() => setView('counter')); return until(() => !!document.getElementById('cn-q') && !!document.querySelector('#cn-needs .cn-jw')); };
    const signIn = async () => {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.length === 2, null, { timeout: 20000 });
    };
    const list = () => page.evaluate(() => { const L = document.getElementById('cn-jw-list');
      return { view: state.view, open: !!L, rows: L ? L.querySelectorAll('[data-cn-ag-item]').length : 0, keys: L ? [...L.querySelectorAll('[data-cn-ag-item]')].map(x => x.getAttribute('data-cn-ag-item')) : [],
        filled: L ? L.querySelectorAll('.ui-btn-primary').length : -1, away: L ? L.querySelectorAll('[data-ag-act="away"]').length : 0,
        look: L ? L.querySelectorAll('[data-cn-look]').length : 0, ready: hbAgentsData(null).ready,
        btn: ((document.querySelector('[data-cn-jw]') || {}).textContent || '').trim() }; });

    await signIn();
    await toCounter();

    console.log('\n1 · the first row opens where it is');
    const ready = await page.evaluate(() => hbAgentsData(null).ready);
    check('1 (setup) Jambo has the lease\'s renewal prepared', ready >= 1, String(ready));
    if (await press('[data-cn-jw]', '1a Open')) {
      const L = await until(() => document.getElementById('cn-jw-list') ? true : (state.view !== 'counter' ? 'left' : null), null, 4000);
      const s = await list();
      check('1a pressing Open keeps the Counter and opens the row in place', L === true && s.view === 'counter', JSON.stringify(s));
      check('1b one row per prepared piece', s.rows === Math.min(s.ready, await page.evaluate(() => window.CN_JW_MAX || 8)) && s.rows >= 1, JSON.stringify(s));
      check('1c each piece has Look and Put away', s.look === s.rows && s.away >= 1, JSON.stringify(s));
      check('1d no filled button among them (one per area)', s.filled === 0, String(s.filled));
      check('1e the row\'s own button now says Close', s.btn === 'Close', s.btn);
      await shot(page, 'open-in-place-1440x780');
      if (await press('[data-cn-look]', '1f Look')) {
        const body = await until(() => { const b = document.querySelector('#cn-jw-list .cn-jw-body'); return b && b.innerText.trim().length > 10 ? b.innerText.trim().slice(0, 60) : null; }, null, 3000);
        check('1f Look opens the piece\'s whole body under its row', !!body, body);
        await press('[data-cn-look]', '1g Hide');
        const shut = await until(() => !document.querySelector('#cn-jw-list .cn-jw-body'), null, 3000);
        check('1g Hide shuts it', !!shut);
      }
    }

    console.log('\n5 · it fits the owner\'s three screens with the row open');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.waitForTimeout(250);
      const fit = await page.evaluate(() => { const L = document.getElementById('cn-jw-list');
        return { open: !!L, sx: document.scrollingElement.scrollWidth > innerWidth,
          past: L ? [...L.querySelectorAll('button, .cn-w b, .cn-w span')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.right > L.getBoundingClientRect().right + 1); }).length : -1 }; });
      check(`5 at ${w}×${hh}: open, no sideways scroll, nothing past the edge`, fit.open && !fit.sx && fit.past === 0, JSON.stringify(fit));
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    console.log('\n2 · the house is one link away');
    if (await press('[data-cn-house]', '2 the house link')) {
      const v = await until(() => state.view === 'jambo' ? 'jambo' : null, null, 5000);
      check('2 the link opens Jambo\'s house', v === 'jambo', String(v));
    }

    console.log('\n3 · each person chooses');
    await page.evaluate(() => setView('jambo'));
    await until(() => !!document.querySelector('[data-jh-agent="renew"]'), null, 8000);
    const picked = await page.evaluate(() => { const el = document.querySelector('[data-jh-ptab="points"]'); if (el) el.click();
      const a = document.querySelector('#jh-rows [data-jh-agent="renew"]'); if (a) a.click(); return !!a; });
    const sel = await until(() => { const s = document.querySelector('[data-jh-lv="renew"]');
      return s ? { opts: [...s.options].map(o => o.value + ':' + o.textContent), label: (s.closest('.jh-lv') || {}).innerText || '' } : null; }, null, 4000);
    check('3a the agent\'s card has "For you"', picked && !!sel && /^For you/.test(sel.label), JSON.stringify(sel));
    check('3b it offers the company\'s level and the step below, never Just do it',
      !!sel && sel.opts.length === 2 && /^:The company.s \(Ask me first\)$/.test(sel.opts[0]) && sel.opts[1] === 'mine:Leave it to me' && !sel.opts.some(o => o.startsWith('auto')), JSON.stringify(sel && sel.opts));
    await shot(page, 'open-in-place-house-1440x780');
    if (sel) {
      await page.selectOption('[data-jh-lv="renew"]', 'mine');
      const kept = await until(() => (currentUser().prefs.agentLevels || {}).renew === 'mine' && agLevelOf('renew') === 'mine', null, 5000);
      check('3c Leave it to me is kept for this person', !!kept);
      await toCounter();
      const s = await page.evaluate(() => ({ ready: hbAgentsData(null).ready, row: (document.querySelector('#cn-needs .cn-jw') || {}).innerText || '' }));
      check('3d the renewal agent prepares nothing on this person\'s Counter', s.ready === 0 && /nothing waiting/.test(s.row), JSON.stringify(s));
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.length === 2, null, { timeout: 20000 });
      const fresh = await until(() => (currentUser().prefs.agentLevels || {}).renew === 'mine' ? 'mine' : null, null, 6000);
      check('3e a fresh load still has it (kept on the server)', fresh === 'mine', String(fresh));
      const refused = await page.evaluate(async () => { try { await api('me/prefs', 'PUT', { agentLevels: { link: 'auto' } }); return 'stored'; } catch (e) { return 'refused'; } });
      check('3f the route refuses a person\'s Just do it', refused === 'refused', refused);
      await page.evaluate(() => agentLevelMineSet('renew', null));
      await toCounter();
      const back = await until(() => hbAgentsData(null).ready >= 1 ? hbAgentsData(null).ready : null, null, 5000);
      check('3g the company\'s level brings the piece back', !!back, String(back));
    }

    console.log('\n4 · Put away');
    await toCounter();
    const opened = await page.evaluate(() => !!document.getElementById('cn-jw-list'));
    if (!opened) await press('[data-cn-jw]', '4 Open');
    const before = await list();
    if (before.away && await press('#cn-jw-list [data-ag-act="away"]', '4 Put away')) {
      const after = await until(n => { const L = document.getElementById('cn-jw-list'); const k = L ? L.querySelectorAll('[data-cn-ag-item]').length : 0; return hbAgentsData(null).ready < n ? { ready: hbAgentsData(null).ready, rows: k } : null; }, before.ready, 5000);
      check('4 Put away takes the piece off the list', !!after && after.ready === before.ready - 1, JSON.stringify({ before: before.ready, after }));
    } else check('4 Put away (no piece with Put away)', false, JSON.stringify(before));

    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
