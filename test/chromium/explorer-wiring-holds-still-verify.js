/* ============================================================
   THE WIRING GLIDES TO A CHANGE, IT DOES NOT FLASH (owner, 19 Oct 2026)
   ============================================================
   "in the wiring page in explorer, there seems to be a glitch where when you
   change the dynamic, it zooms out and back to normal in like a flash which
   is uncomfortable. Previously it simply just changed to what was asked but
   now it shines then dims as it zooms back down. Fix this"

   A change that gives the map a new layout (a grouping, a narrowing) used to
   start the Wiring again from its seed — every group on a ring, its contracts
   bunched round it — and snap the framing to that bunch, so the picture
   jumped to about twice its size and eased back over a second and a half,
   brightening as the dots crowded. Now the new map starts from the dots on
   screen and the framing is carried, so it glides.
     1  on Wiring, a grouping chosen in the head line's dropdown, one asked
        of Jambo, a narrowing and an Undo each go from the picture before to
        the one they land on without swelling past, or shrinking under, both
        (by more than a fifth) over the next 1.6 s
     2  the same at the owner's three screens
     3  the change still lands: the grouping is the one asked

   Red at the parent: the frames after a grouping swelled to about twice the
   size of the picture before and of the one it landed on.
   Run: node test/chromium/explorer-wiring-holds-still-verify.js */
'use strict';
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const STREAMS = ['proc', 'sales', 'mfg'];
const BOOK = Array.from({ length: 60 }, (_, i) => fixtureContract('MK-W' + i, 'Agreement ' + i,
  'Party ' + String.fromCharCode(65 + (i % 12)) + ' Ltd', STREAMS[i % 3], ((i * 37) % 90 + 5) * 1e6, ['Signed', 'Signed', 'Under Review', 'Draft'][i % 4]));

let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* on Wiring, a change made by `how`, the picture's width on screen frame by frame for 1.6 s */
  const film = how => page.evaluate(async how => {
    const width = () => { const G = IG; if (!G || !G.pj) return null; let lo = 1e9, hi = -1e9;
      G.nodes.forEach(n => { if (n.kind !== 'contract') return; const P = G.pj(n.P || n.W3 || [0, 0, 0]); if (P) { lo = Math.min(lo, P[0]); hi = Math.max(hi, P[0]); } });
      return hi > lo ? hi - lo : null; };
    const before = width(), w = [];
    if (how === 'dropdown') { const s = document.querySelector('#ig-note #ig-group'); s.value = s.value === 'counterparty' ? 'folder' : 'counterparty'; s.dispatchEvent(new Event('change', { bubbles: true })); }
    else if (how === 'undo') intelAsk('undo');
    else intelAsk(how);
    const t0 = performance.now();
    await new Promise(r => { const f = () => { const x = width(); if (x) w.push(x); if (performance.now() - t0 < 1600) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    return { before, first: w[0], end: w[w.length - 1], lo: Math.min(...w), hi: Math.max(...w), groupBy: intel.groupBy, frames: w.length };
  }, how);
  /* the picture goes from where it was to where it lands without swelling
     past, or shrinking under, both (a new grouping may honestly have another shape) */
  const steady = r => !!r && r.before > 0 && r.hi <= 1.2 * Math.max(r.before, r.end) && r.lo >= Math.min(r.before, r.end) / 1.2;
  const say = r => r && JSON.stringify({ before: Math.round(r.before), first: Math.round(r.first), end: Math.round(r.end), lo: Math.round(r.lo), hi: Math.round(r.hi), groupBy: r.groupBy, frames: r.frames });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 20, null, { timeout: 15000 });
    await until(() => state.view === 'counter' || state.view === 'dashboard');
    await page.waitForTimeout(1500);
    await page.evaluate(() => { intel.cam = null; intel.tab = 'map'; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbFace() === 'explorer' && window.IG && IG.nodes && IG.nodes.length > 5 && !!document.querySelector('#ig-note #ig-group'));
    await page.evaluate(() => igSetView(1));
    /* the view glides in and the first layout settles */
    await until(() => igbCam().view === 1 && IG._settle === 0 && intel.cam.w[1] > .99, null, 10000); await page.waitForTimeout(2000);

    /* ================= 1. FOUR WAYS OF CHANGING ================= */
    for (const [how, want, label] of [['dropdown', 'counterparty', 'the head line\'s dropdown (Customer)'], ['group by owner', 'owner', 'Jambo asked to group by owner'],
      ['only signed contracts', 'owner', 'a narrowing (only signed contracts)'], ['undo', 'owner', 'Undo']]) {
      const r = await film(how);
      check(`1 Wiring, ${label}: the picture goes from before to after with no swell or shrink past both`, steady(r) && r.groupBy === want, say(r));
      await page.waitForTimeout(1200);
    }

    /* ================= 2. THE OWNER'S THREE SCREENS ================= */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.waitForTimeout(1500);
      const r = await film('dropdown');
      check(`2 ${w}×${hh} Wiring, the dropdown: no swell or shrink past both`, steady(r), say(r));
      await page.waitForTimeout(1200);
    }
    check('9 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.stack || e.message);
  } finally {
    await browser.close().catch(() => {});
    if (h.stop) await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
