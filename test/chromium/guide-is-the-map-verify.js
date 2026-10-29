/* THE GUIDE IS THE MAP (round 7, "The Legora way", owner's overnight build of 28 Oct 2026)
     1 · "?" typed in Home's box opens the Guide, free
     2 · every Guide row with a one-word door says it ("Say “negotiations”"), and that word, typed, opens that row's page
     3 · the owner's three screens: every row's words inside the panel, nothing sideways
   Run: node test/chromium/guide-is-the-map-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'guide-is-the-map');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati({});
  await seedHandbookWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  let brain = 0; P.on('request', r => { if (/\/api\/ai\/(chat|copilot|ask)/.test(r.url())) brain++; });
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!document.getElementById('cn-q'), null, 20000);
    await P.evaluate(() => { state.aiConfigured = true; });
    await P.fill('#cn-q', '?'); await P.press('#cn-q', 'Enter');
    const open = await until(P, () => typeof panelFace === 'function' && panelFace() === 'guide' && !!document.querySelector('.gd-row'), null, 8000);
    check(open && brain === 0, '1 "?" opens the Guide, free', { open, calls: brain });
    const rows = await P.evaluate(() => [...document.querySelectorAll('.gd-row')].map(r => ({ k: r.getAttribute('data-gd-go'), w: ((r.querySelector('.gd-word') || {}).textContent || '').trim() })));
    const said = rows.filter(r => r.w);
    const bad = await P.evaluate(R => R.filter(r => { const m = /“(.+)”/.exec(r.w); const a = m && jamboPageWordOf(m[1]); return !(a && a.place === r.k); }).map(r => r.k + ':' + r.w), said);
    check(said.length >= rows.length - 1 && bad.length === 0, '2a every row with a one-word door says it, and the word reads back to that row', { n: rows.length, said: said.length, bad, none: rows.filter(r => !r.w).map(r => r.k) });
    await P.screenshot({ path: path.join(OUT, '1440x780.png') });
    /* the word typed: "negotiations" opens Negotiations */
    const neg = rows.find(r => r.k === 'negotiations');
    if (neg){
      await P.evaluate(() => { if (typeof closeContextPanel === 'function') closeContextPanel(); setView('counter'); });
      await until(P, () => !!document.getElementById('cn-q'), null, 8000);
      const w = /“(.+)”/.exec(neg.w)[1];
      await P.fill('#cn-q', w); await P.press('#cn-q', 'Enter');
      check(await until(P, () => typeof guideHereKey === 'function' && guideHereKey() === 'negotiations', null, 8000), '2b the word typed opens that page', { w });
    }
    for (const [ww, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: ww, height: hh });
      await P.evaluate(() => { if (typeof openPanel === 'function') openPanel('guide'); });
      await until(P, () => !!document.querySelector('.gd-row .gd-word'), null, 6000);
      const fit = await P.evaluate(() => { const pn = document.getElementById('context-panel'); const R = pn && pn.getBoundingClientRect();
        const out = [...document.querySelectorAll('.gd-word')].filter(e => { const r = e.getBoundingClientRect(); return r.right > R.right + 1 || r.height > 22; }).length;
        return { out, side: document.documentElement.scrollWidth > innerWidth }; });
      check(fit.out === 0 && !fit.side, `3 ${ww}×${hh}: every word line inside the panel, on one line, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${ww}x${hh}.png`) });
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
