/* Chromium verification: THE SPEED BUDGET — A MOVE IS STYLED ONCE
   ============================================================
   The owner, 26 Nov 2026: "please review why hati is slow to respond by a second or two when navigating through the
   workspace", then, on how professional products keep fast: "start both now" (a speed check, and clearing out styling
   nothing uses). Measured that day: most of every move was the browser working out styles again (f1240 fixed the
   worst of it). This check keeps it fixed. It counts, it does not time: a stopwatch on a shared machine wanders by a
   third, but the number of page elements the browser styles again for a move is the same every run.
   For each common move (Board, Contracts, a contract opened, Calendar, Approvals, Settings, back to the Board):
     1. NO WHOLE-PAGE RESTYLE: no style rule makes the browser style the whole page again from <html> down (a :has()
        rule ending on a bare :not() did, on every change in a panel — four to seven times a move before f1240)
     2. THE BUDGET: the elements styled for the move stay under SPEED_BUDGET times the elements on the page (a
        RELATION, not a figure: 4–11 times on 26 Nov 2026; 13–18 on the moves that were slow before f1240)
     3. no page errors
   Red at the parent of f1240 (measured): 1 on all six moves that style anything; 2 on Calendar 17.6, Approvals 15.6,
   Board again 14.5. Waits ask for the state, bounded.
   Run: node test/chromium/speed-budget-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SPEED_BUDGET = 14;
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && state.contracts.length === ids.length
      && ids.every(id => state.contracts.some(c => c && c.id === id)) && state.view === 'dashboard'
      && !document.body.classList.contains('pre-auth') && typeof caGo === 'function' && typeof roomHomeLand === 'function',
    FIXTURES.map(c => c.id), { timeout: 20000 });
    /* the sign-in's own late readings settle before anything is counted */
    await page.waitForTimeout(3000);
    const cdp = await page.context().newCDPSession(page);
    const cid = await page.evaluate(() => (state.contracts.find(c => c && !c.archived) || {}).id);
    check('0. the workspace holds a contract to open', !!cid, String(cid));
    const MOVES = [
      ['Contracts', `caGo({ kind: 'go', place: 'contracts' })`, () => { const e = document.querySelector('#ct-place, .ct-place'); return !!(e && e.getClientRects().length); }],
      ['a contract opened', `roomHomeLand(${JSON.stringify(String(cid))}, { open: true })`, () => { const e = document.querySelector('#ig-paper'); return !!(e && e.getClientRects().length); }],
      ['Calendar', `caGo({ kind: 'go', place: 'calendar' })`, () => typeof hbFace === 'function' && hbFace() === 'calendar'],
      ['Approvals', `caGo({ kind: 'go', place: 'approvals' })`, () => state.view === 'approvals'],
      ['Settings', `caGo({ kind: 'go', place: 'settings' })`, () => state.view === 'team'],
      ['back to the Board', `caGo({ kind: 'go', place: 'board' })`, () => state.view === 'dashboard'],
    ];
    const measure = async js => {
      const evs = []; const on = d => evs.push(...d.value); cdp.on('Tracing.dataCollected', on);
      const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
      await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking', transferMode: 'ReportEvents' });
      await page.evaluate(src => { try { (0, eval)(src); } catch (e) { window.__sbErr = String(e); } }, js);
      await page.waitForTimeout(1800);
      await cdp.send('Tracing.end'); await done; cdp.off('Tracing.dataCollected', on);
      const styled = evs.filter(e => e.name === 'UpdateLayoutTree' && e.ph === 'X').reduce((a, e) => a + ((e.args && e.args.elementCount) || 0), 0);
      const whole = evs.filter(e => /StyleInvalidator/.test(e.name) && e.args && e.args.data
        && /subtree/.test(e.args.data.reason || '') && /^HTML/.test(e.args.data.nodeName || ''));
      const sels = [...new Set(whole.flatMap(e => (e.args.data.selectors || []).map(x => x.selector)))];
      const onPage = await page.evaluate(() => document.getElementsByTagName('*').length);
      return { styled, whole: whole.length, sels, onPage };
    };
    /* a first lap warms every page (its first drawing builds what later visits keep); the second lap is counted */
    for (const [, js, ready] of MOVES){ await page.evaluate(src => { try { (0, eval)(src); } catch (_){} }, js);
      await page.waitForFunction(ready, null, { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(800); }
    for (const [name, js, ready] of MOVES){
      const m = await measure(js);
      const there = await page.evaluate(ready).catch(() => false);
      check(`${name}: the move arrived`, !!there);
      check(`${name}: 1. no rule restyles the whole page`, m.whole === 0,
        m.whole ? `${m.whole} times, by ${m.sels.slice(0, 3).join(' | ')}` : 'none');
      check(`${name}: 2. styled under ${SPEED_BUDGET}× the page`, m.styled <= SPEED_BUDGET * m.onPage,
        `${m.styled} styled · ${m.onPage} on the page · ${(m.styled / Math.max(1, m.onPage)).toFixed(1)}×`);
    }
    check('3. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
