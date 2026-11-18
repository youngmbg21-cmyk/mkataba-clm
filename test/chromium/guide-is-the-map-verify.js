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
    await until(P, () => !!document.getElementById('igd-input'), null, 20000);
    await P.evaluate(() => { state.aiConfigured = true; });
    await P.fill('#igd-input', '?'); await P.press('#igd-input', 'Enter');
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the Guide is drawn by stage (.gdn, GUIDE_NL); a row
       (.gdn-r) holds its page doors (.gdn-go[data-gd-go]) and says their words ("Say “…”", .gdn-say) */
    const open = await until(P, () => typeof panelFace === 'function' && panelFace() === 'guide' && !!document.querySelector('.gdn-r'), null, 8000);
    check(open && brain === 0, '1 "?" opens the Guide, free', { open, calls: brain });
    const rows = await P.evaluate(() => [...document.querySelectorAll('.gdn-r')].map(r => ({ ks: [...r.querySelectorAll('.gdn-go[data-gd-go]')].map(b => b.getAttribute('data-gd-go')), k: (r.querySelector('.gdn-go[data-gd-go]') || { getAttribute: () => '' }).getAttribute('data-gd-go'), w: ((r.querySelector('.gdn-say') || {}).textContent || '').trim() })));
    const said = rows.filter(r => r.w);
    /* every quoted word on a row reads back to one of that row's pages */
    const bad = await P.evaluate(R => R.filter(r => { const ws = [...r.w.matchAll(/“([^”]+)”/g)].map(m => m[1]); return !ws.length || ws.some(w => { const a = jamboPageWordOf(w); return !(a && r.ks.includes(a.place)); }); }).map(r => r.ks.join('+') + ':' + r.w), said);
    check(said.length >= rows.length - 1 && bad.length === 0, '2a every row with a one-word door says it, and the word reads back to that row', { n: rows.length, said: said.length, bad, none: rows.filter(r => !r.w).map(r => r.k) });
    await P.screenshot({ path: path.join(OUT, '1440x780.png') });
    /* the word typed: "negotiations" opens Negotiations */
    const neg = rows.find(r => r.ks.length === 1 && r.k === 'negotiations');
    if (neg){
      await P.evaluate(() => { if (typeof closeContextPanel === 'function') closeContextPanel(); setView('counter'); });
      await until(P, () => !!document.getElementById('igd-input'), null, 8000);
      const w = /“(.+)”/.exec(neg.w)[1];
      await P.fill('#igd-input', w); await P.press('#igd-input', 'Enter');
      check(await until(P, () => typeof guideHereKey === 'function' && guideHereKey() === 'negotiations', null, 8000), '2b the word typed opens that page', { w });
    }
    for (const [ww, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: ww, height: hh });
      /* the Guide is opened unless it already stands on screen (a second open would shut it: press it again and it closes) */
      await P.evaluate(() => { const g = document.querySelector('#context-panel .gdn-r'); const on = !!g && g.getBoundingClientRect().left < innerWidth && g.getBoundingClientRect().width > 0;
        if (typeof openPanel === 'function' && !(typeof panelFace === 'function' && panelFace() === 'guide' && on)) openPanel('guide'); });
      await until(P, () => { const g = document.querySelector('#context-panel .gdn'); if (!g) return false; const r = g.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth + 1 && !document.getAnimations().some(a => a.playState === 'running'); }, null, 4000);
      await until(P, () => !!document.querySelector('.gdn-r .gdn-say'), null, 6000);
      const fit = await P.evaluate(() => { const pn = document.getElementById('context-panel'); const R = pn && pn.getBoundingClientRect();
        const out = [...document.querySelectorAll('.gdn-say')].filter(e => { const r = e.getBoundingClientRect(); return r.right > R.right + 1 || r.height > 22; }).length;
        return { out, side: document.documentElement.scrollWidth > innerWidth, which: [...document.querySelectorAll(".gdn-say")].map(e => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.right), Math.round(R.right), Math.round(r.height)]; }).filter(x => x[1] > x[2] + 1 || x[3] > 22) }; });
      check(fit.out === 0 && !fit.side, `3 ${ww}×${hh}: every word line inside the panel, on one line, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${ww}x${hh}.png`) });
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
