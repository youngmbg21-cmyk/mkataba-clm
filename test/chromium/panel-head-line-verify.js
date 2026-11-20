/* SAP PAGE, LEGORA PANEL (owner's pick by name, 19 Nov 2026; f1107). The line under a side panel's head never
   touches the divider or the window's edge; the page's own line is unchanged.
     1 · at the owner's three screens, on six pages, the panel head's line is PAINTED (read off the screenshot's
         pixels, not the style): ink in its middle, nothing in the 8px next to the divider or next to the edge
     2 · the line fades: its first painted pixel near the start is lighter than its middle
     3 · the page's list line under the filter box is still drawn solid, from the page's words to their end
     4 · nothing scrolls sideways; no page errors
   Red at the parent: 1 and 2 on every page (the line ran from the divider to the edge, solid).
   Run: node test/chromium/panel-head-line-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'panel-head-line');
fs.mkdirSync(OUT, { recursive: true });
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const PAGES = ['approvals', 'register', 'calendar', 'team', 'templates', 'contract'];
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 10000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

/* the darkness (255 - average channel) of every pixel in one row of a clip, read in the page from the screenshot */
async function rowInk(P, clip){
  const b64 = (await P.screenshot({ clip, type: 'png' })).toString('base64');
  return P.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, img.width, 1).data, out = [];
    for (let i = 0; i < d.length; i += 4) out.push(255 - Math.round((d[i] + d[i + 1] + d[i + 2]) / 3));
    return out;
  }, b64);
}

(async () => {
  const h = await startHati(); await seedDiscoverWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [w, hh] of SCREENS){
      const P = await (await browser.newContext({ viewport: { width: w, height: hh } })).newPage();
      const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
      await P.goto(h.base + '/', { waitUntil: 'networkidle' });
      await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
      const ready = await until(P, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 5 && typeof setView === 'function', null, 20000);
      check(ready, `${w}×${hh} signed in with the world`);
      if (!ready){ await P.close(); continue; }
      for (const pg of PAGES){
        await P.evaluate(v => { if (v === 'contract') pdOpenOnHome(state.contracts[0].id, 'job'); else setView(v); }, pg);
        const head = await until(P, () => [...document.querySelectorAll('.jl-head, #ig-dock > .igd-head')].some(e => e.getBoundingClientRect().width > 200), null, 10000);
        if (!head){ check(false, `${w}×${hh} ${pg}: a panel head is drawn`); continue; }
        await P.waitForTimeout(600);
        const r = await P.evaluate(() => { const e = [...document.querySelectorAll('.jl-head, #ig-dock > .igd-head')].find(x => x.getBoundingClientRect().width > 200); const b = e.getBoundingClientRect(); return { x: b.left, y: b.bottom - 1, w: b.width }; });
        const ink = await rowInk(P, { x: Math.round(r.x), y: Math.floor(r.y), width: Math.floor(r.w), height: 1 });
        const n = ink.length, mid = Math.max(...ink.slice(Math.floor(n * 0.35), Math.floor(n * 0.65)));
        const nearDivider = Math.max(...ink.slice(2, 8)), nearEdge = Math.max(...ink.slice(n - 8, n));
        const firstSeen = ink.findIndex((v, i) => i >= 8 && v > 1), early = firstSeen > 0 ? ink[firstSeen] : null;
        check(mid >= 10 && nearDivider <= 2 && nearEdge <= 2, `1 ${w}×${hh} ${pg}: the panel line is painted in its middle and touches neither the divider nor the edge`, { mid, nearDivider, nearEdge });
        check(early != null && early < mid, `2 ${w}×${hh} ${pg}: the line fades in at its start`, { firstSeen, early, mid });
        if (pg === 'approvals'){
          const bar = await P.evaluate(() => { const e = document.querySelector('.apn-bar'); if (!e) return null; const b = e.getBoundingClientRect(), s = getComputedStyle(e); return { x: b.left, y: b.bottom - 1, w: b.width, solid: s.borderBottomStyle === 'solid' && !/, 0\)$/.test(s.borderBottomColor) }; });
          if (!bar) check(false, `3 ${w}×${hh}: the list head is drawn`);
          else {
            /* RE-POINTED 20 Nov 2026: the bar's bottom can sit on a fractional y (1440×780 lands whole, 1536×730 and
               1366×950 do not), and Chromium snaps a 1px border to a whole device row that need not be floor(bottom - 1):
               the one row read there was blank from end to end (lo 0) while the line was drawn one row lower. The line
               is now looked for in the rows round its bottom edge, and the row that carries it must be solid end to end. */
            let lo = -1;
            for (let dy = -2; dy <= 1; dy++){
              const li = await rowInk(P, { x: Math.round(bar.x), y: Math.floor(bar.y) + dy, width: Math.floor(bar.w) - 1, height: 1 });
              lo = Math.max(lo, Math.min(...li.slice(1, li.length - 1)));
            }
            check(bar.solid && lo >= 10, `3 ${w}×${hh}: the page's line under the filter box is still solid from end to end`, { solid: bar.solid, lo });
          }
        }
        await P.screenshot({ path: path.join(OUT, `${w}x${hh}-${pg}.png`) });
      }
      const side = await P.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(side <= 0, `4 ${w}×${hh}: nothing sideways`, side);
      check(errors.length === 0, `4 ${w}×${hh}: no page errors`, errors.join(' | '));
      await P.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
