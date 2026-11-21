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
    /* RE-POINTED 21 Nov 2026 (P-38, owner: "delete the guide since we have the nav panel"): "?" opens the nav panel at
       the left — the Guide's pages by stage; the Guide face and its "Say “…”" lines went with it */
    const open = await until(P, () => !!document.querySelector('#cmd-palette.is-left .lp-p'), null, 8000);
    check(open && brain === 0, '1 "?" opens the nav panel with every page, free', { open, calls: brain });
    await P.screenshot({ path: path.join(OUT, '1440x780.png') });
    await P.keyboard.press('Escape');
    /* the word typed: "negotiations" opens Negotiations */
    await P.evaluate(() => { if (typeof closeContextPanel === 'function') closeContextPanel(); setView('counter'); });
    await until(P, () => !!document.getElementById('igd-input'), null, 8000);
    await P.fill('#igd-input', 'negotiations'); await P.press('#igd-input', 'Enter');
    check(await until(P, () => typeof guideHereKey === 'function' && guideHereKey() === 'negotiations', null, 8000), '2b the word typed opens that page', { w: 'negotiations' });
    for (const [ww, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: ww, height: hh });
      await P.evaluate(() => { if (!document.getElementById('cmd-palette')) openPanel('guide'); });
      await until(P, () => !!document.querySelector('#cmd-palette.is-left .lp-p') && !document.getAnimations().some(a => a.playState === 'running'), null, 4000);
      const fit = await P.evaluate(() => { const sh = document.querySelector('#cmd-palette .lp-sheet').getBoundingClientRect();
        const out = [...document.querySelectorAll('#cmd-palette .lp-p')].filter(e => { const r = e.getBoundingClientRect(); return r.right > sh.right + 1; }).length;
        return { out, side: document.documentElement.scrollWidth > innerWidth }; });
      check(fit.out === 0 && !fit.side, `3 ${ww}×${hh}: every page row inside the nav panel, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${ww}x${hh}.png`) });
      await P.keyboard.press('Escape');
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
