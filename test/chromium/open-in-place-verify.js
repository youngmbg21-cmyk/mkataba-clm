/* JAMBO'S WORK, "OPEN IN PLACE" (round 23 of the redesign: the owner picked
   "Open in place" by name, 17 Oct 2026; levels "Each person chooses"; the
   button word "Put away"; js/views/counter.js, js/views/jambohouse.js)

   REVERSED 18 Oct 2026 (LAND ON IT; the owner: "when you click on jambos
   work, it should take you to the jambos work card in the board", and
   "remove the in-place list"). WHAT THIS PINS, driven in a real browser on a
   seeded workspace
     1 the Counter's first row is one row with Open, and no list opens in
       place: Open lands on the Board's Jambo's work card, brought into view
       and lit (.is-landed), a button on it ready
     2 the house is one link away, on the card ("The agents")
     3 each person chooses: on the agent's card in the house, "For you"
       offers the company's level and the steps below it, never Just do it;
       Leave it to me takes the agent's piece off the Counter, kept on the
       server (a fresh load still has it); the company's brings it back; the
       route refuses a person's Just do it
     4 Put away takes the piece off the Board's list
     5 the landing holds at the owner's three screens: the card in sight, lit
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
    const landed = () => page.evaluate(() => { const c = document.getElementById('hm-agents'); const r = c ? c.getBoundingClientRect() : null;
      return { view: state.view, face: window.hbFace ? hbFace() : null, card: !!c, lit: !!(c && c.classList.contains('is-landed')),
        inView: !!r && r.top >= -2 && r.top < innerHeight - 40, focus: !!(c && document.activeElement && c.contains(document.activeElement)),
        list: !!document.getElementById('cn-jw-list'), ring: c ? getComputedStyle(c).outlineStyle + ' ' + getComputedStyle(c).outlineWidth : '' }; });

    await signIn();
    await toCounter();

    console.log('\n1 · Open lands on the Board\'s card');
    const ready = await page.evaluate(() => hbAgentsData(null).ready);
    check('1 (setup) Jambo has the lease\'s renewal prepared', ready >= 1, String(ready));
    check('1a the row is one row with Open, nothing drawn in place', await page.evaluate(() => !document.getElementById('cn-jw-list')
      && ((document.querySelector('[data-cn-jw]') || {}).textContent || '').trim() === 'Open'));
    if (await press('[data-cn-jw]', '1b Open')) {
      const L = await until(() => { const c = document.getElementById('hm-agents'); return c && c.classList.contains('is-landed') ? true : null; }, null, 6000);
      const s = await landed();
      check('1b Open lands on the Board\'s Jambo\'s work card', L === true && s.view === 'dashboard' && s.face === 'board' && s.card, JSON.stringify(s));
      /* RE-POINTED 21 Oct 2026 (owner: no light on arrival): in sight and marked, no ring drawn */
      check('1c the card is in sight, no ring drawn', s.inView && s.lit && /^none/.test(s.ring), JSON.stringify(s));
      check('1d a button on it is ready for Enter', s.focus, JSON.stringify(s));
      await shot(page, 'land-on-work-1440x780');
      await page.mouse.click(5, 300);
      const out = await until(() => { const c = document.getElementById('hm-agents'); return c && !c.classList.contains('is-landed') ? true : null; }, null, 3000);
      check('1e the light goes out at the reader\'s next press', !!out);
    }

    console.log('\n5 · the landing holds at the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await toCounter();
      await press('[data-cn-jw]', '5 Open');
      await until(() => { const c = document.getElementById('hm-agents'); return c && c.classList.contains('is-landed') ? true : null; }, null, 6000);
      const s = await landed();
      check(`5 at ${w}×${hh}: the card is in sight and lit, no sideways scroll`, s.inView && s.lit
        && !(await page.evaluate(() => document.scrollingElement.scrollWidth > innerWidth)), JSON.stringify(s));
      await shot(page, `land-on-work-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    console.log('\n2 · the house is one link away');
    if (await press('#hm-agents [data-hb-agents-page]', '2 the house link')) {
      const v = await until(() => state.view === 'jambo' ? 'jambo' : null, null, 5000);
      check('2 the card\'s "The agents" opens Jambo\'s house', v === 'jambo', String(v));
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
    await page.evaluate(() => hbOpenAgent('renew'));
    const before = await until(() => document.querySelector('.hb-ag-works [data-ag-act="away"]') ? hbAgentsData(null).ready : null, null, 6000);
    if (before && await press('.hb-ag-works [data-ag-act="away"]', '4 Put away')) {
      const after = await until(n => hbAgentsData(null).ready < n ? hbAgentsData(null).ready : null, before, 5000);
      check('4 Put away takes the piece off the Board\'s list', after === before - 1, JSON.stringify({ before, after }));
    } else check('4 Put away (no piece with Put away on the Board)', false, String(before));

    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
