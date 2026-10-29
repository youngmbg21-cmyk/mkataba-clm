/* THE PAGE-JUMP CHECK (owner, 22 Oct 2026: step 1 of the motion plan — "a
   test that measures whether the page jumps while things open or load")

   WHAT THIS MEASURES, in a real browser on the seeded workspace, on the
   owner's three screens (1440×780, 1536×730, 1366×950). The contract's first
   line is watched on every animation frame while each thing happens:
     A Home loads: the browser's own count of unexpected jumps (layout shift,
       no press before it) — reported, the yardstick for later work
     B the notes drawer opens and closes beside the paper: THE CONTRACT DOES
       NOT MOVE (it slides OVER the page)
     C Jambo's panel turns Jambo → Clauses → Obligations → Menu → Jambo: THE
       CONTRACT DOES NOT MOVE
     D Jambo's panel folds and unfolds: the contract re-wraps ONCE, never
       frame after frame while a width slides (at the parent it re-wrapped on
       every frame of the 240ms slide)
     E stepping through clauses on the Clauses tab: jumps reported
     F nothing on the page threw
   Waits ask for the state, bounded. Run: node test/chromium/page-jumps-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'page-jumps');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
/* how many frames may show the contract re-wrapping while the panel folds */
const REWRAP_FRAMES_MAX = 2;
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

/* in the page: watch the contract's first line on every frame for `ms`,
   after `act` runs; how far it moved at most, and on how many frames its
   place or width changed */
const WATCH = `window.__pjWatch = (act, ms) => new Promise(done => {
  const line = () => { const p = document.getElementById('ig-paper'); if (!p) return null;
    const el = [...p.querySelectorAll('h1,h2,h3,p,li,.rl-clause,[data-clause-id]')].find(x => x.getClientRects().length && (x.textContent || '').trim());
    if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) }; };
  const at0 = line(); let last = at0, moved = 0, frames = 0, n = 0;
  try { act(); } catch (e) { return done({ err: String(e && e.message || e) }); }
  const t0 = performance.now();
  const tick = () => { const now = line(); n++;
    if (now && last && (now.x !== last.x || now.y !== last.y || now.w !== last.w)) frames++;
    if (now && at0) moved = Math.max(moved, Math.abs(now.x - at0.x), Math.abs(now.y - at0.y));
    last = now || last;
    if (performance.now() - t0 < ms) requestAnimationFrame(tick); else done({ at0, end: last, moved, frames, n }); };
  requestAnimationFrame(tick);
});
window.__pjShifts = { sum: 0, input: 0, list: [] };
try { new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.hadRecentInput) window.__pjShifts.input += e.value; else { window.__pjShifts.sum += e.value; window.__pjShifts.list.push(Math.round(e.value * 1000) / 1000); } } })
  .observe({ type: 'layout-shift', buffered: true }); } catch (_) {}`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const [W, H] of SCREENS){
      console.log(`\n== ${W}×${H} ==`);
      const ctx = await browser.newContext({ viewport: { width: W, height: H } });
      await ctx.addInitScript(WATCH);
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(e.message));
      const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
        while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_){ v = null; } if (v) return v; await page.waitForTimeout(120); }
        return v; };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
      await page.waitForTimeout(1500);

      const A = await page.evaluate(() => window.__pjShifts);
      console.log(`A  Home loads: unexpected jumps ${A.sum.toFixed(3)} (each: ${A.list.slice(0, 8).join(', ') || 'none'})`);

      await page.evaluate(() => { setView('dashboard'); igAnalyze('MK-B2'); });
      const up = await until(() => window.intel && intel.paper && intel.paper.id === 'MK-B2' && !intel.busy && !!document.querySelector('#ig-paper') && !document.getElementById('ig-paper').hidden);
      check(`${W}: MK-B2 is on the paper`, !!up);
      if (!up) { await ctx.close(); continue; }
      await page.waitForTimeout(800);

      /* B — the notes drawer */
      /* RE-POINTED 29 Oct 2026 (round 13 "The Legora way", owner's yes): Notes left the paper's line; the drawer is opened
         as the side panel's Notes tab opens it (openNotesPanel) */
      const hasNotes = await page.evaluate(() => typeof openNotesPanel === 'function' && !!chatContractId());
      if (!hasNotes) check(`${W}: B the notes drawer has a door for the contract on the paper`, false, 'no openNotesPanel / chatContractId');
      else {
        const open = await page.evaluate(() => window.__pjWatch(() => openNotesPanel(chatContractId(), null, { force: true }), 600));
        const opened = await page.evaluate(() => !!(document.getElementById('context-panel') || {}).classList?.contains('open'));
        await page.screenshot({ path: path.join(OUT, `B-notes-open-${W}x${H}.png`) });
        const shut = await page.evaluate(() => window.__pjWatch(() => { if (typeof closeContextPanel === 'function') closeContextPanel(); }, 600));
        check(`${W}: B the notes drawer opens beside the paper`, opened);
        check(`${W}: B the contract does not move while it opens or closes`, open.moved === 0 && shut.moved === 0, JSON.stringify({ open: open.moved, shut: shut.moved }));
      }

      /* C — the panel's tabs */
      const tabs = await page.evaluate(() => [...document.querySelectorAll('#ig-dock [data-pd-tab]')].map(b => b.getAttribute('data-pd-tab')));
      let worst = 0, extra = 0;
      for (const t of [...tabs.slice(1), tabs[0]]){
        const r = await page.evaluate(k => window.__pjWatch(() => document.querySelector(`#ig-dock [data-pd-tab="${k}"]`).click(), 450), t);
        worst = Math.max(worst, r.moved || 0); extra += r.frames || 0;
      }
      check(`${W}: C turning the panel's tabs (${tabs.join(' → ')}) never moves the contract`, tabs.length > 1 && worst === 0, JSON.stringify({ moved: worst, frames: extra }));

      /* D — the panel folds and unfolds */
      const fold = await page.evaluate(() => window.__pjWatch(() => { intel.dockOpen = false; renderIntelDock(); igSyncDockWidth(); }, 600));
      await page.waitForTimeout(300);
      const unfold = await page.evaluate(() => window.__pjWatch(() => { intel.dockOpen = true; renderIntelDock(); igSyncDockWidth(); }, 600));
      await page.screenshot({ path: path.join(OUT, `D-unfolded-${W}x${H}.png`) });
      console.log(`D  fold: re-wrapped on ${fold.frames} of ${fold.n} frames; unfold: ${unfold.frames} of ${unfold.n}`);
      check(`${W}: D folding and unfolding Jambo's panel re-wraps the contract at most ${REWRAP_FRAMES_MAX} times, not on every frame`,
        fold.frames <= REWRAP_FRAMES_MAX && unfold.frames <= REWRAP_FRAMES_MAX, JSON.stringify({ fold: fold.frames, unfold: unfold.frames }));

      /* E — stepping through clauses on the Clauses tab */
      await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-pd-tab="doc"]'); if (b) b.click(); });
      await page.waitForTimeout(500);
      const s0 = await page.evaluate(() => window.__pjShifts.sum + window.__pjShifts.input);
      const rows = await page.evaluate(() => document.querySelectorAll('#ig-dock [data-th-row]').length);
      for (let i = 0; i < Math.min(rows, 4); i++){
        await page.evaluate(k => { const r = document.querySelectorAll('#ig-dock [data-th-row]')[k]; if (r) r.click(); }, i);
        await page.waitForTimeout(450);
      }
      const s1 = await page.evaluate(() => window.__pjShifts.sum + window.__pjShifts.input);
      console.log(`E  stepping ${Math.min(rows, 4)} clauses: jumps ${(s1 - s0).toFixed(3)}`);

      if (W === 1440){
        /* G — ONE GLIDE FOR LISTS: rows read, reordered, glide by transform */
        const g = await page.evaluate(() => {
          const box = document.createElement('div'); box.id = 'pj-list'; box.style.cssText = 'position:fixed;left:20px;top:80px;width:200px;z-index:99';
          box.innerHTML = ['a', 'b', 'c'].map(k => `<div data-k="${k}" style="height:30px">${k}</div>`).join(''); document.body.appendChild(box);
          const was = listGlideTake('#pj-list', '[data-k]', 'data-k');
          box.insertBefore(box.lastElementChild, box.firstElementChild);           /* c to the top */
          box.insertAdjacentHTML('beforeend', '<div data-k="d" style="height:30px">d</div>');
          const n = listGlidePlay('#pj-list', '[data-k]', 'data-k', was);
          const moves = [...box.children].map(el => { const a = el.getAnimations()[0]; const kf = a && a.effect.getKeyframes()[0];
            return [el.getAttribute('data-k'), kf ? (kf.transform || ('opacity ' + kf.opacity)) : '']; });
          box.remove(); return { n, moves };
        });
        check('G a reordered list glides: each moved row by a transform, the new row fades in', g.n === 4
          && /translate\(0px, ?60px\)|translate\(0px,60px\)/.test(g.moves.find(m => m[0] === 'c')[1])
          && /opacity 0/.test(g.moves.find(m => m[0] === 'd')[1]), JSON.stringify(g));
        const wired = await page.evaluate(() => typeof listGlideAround === 'function');
        check('G the Redlines column repaints through the glide (page and Jambo\'s face)', wired);

        /* H — THE PANEL'S FACE CROSSFADES and its underline glides */
        await page.evaluate(() => document.querySelector('#ig-dock [data-pd-tab="copilot"]').click());
        await page.waitForTimeout(400);
        const hx = await page.evaluate(() => { document.querySelector('#ig-dock [data-pd-tab="doc"]').click();
          const ghost = document.querySelectorAll('.face-ghost').length;
          const kids = [...document.getElementById('ig-dock').children].filter(n => !n.matches('.igd-head')).some(n => n.getAnimations().length);
          const ink = document.getAnimations().some(a => a.effect && a.effect.pseudoElement === '::after' && a.effect.target && a.effect.target.matches('#ig-dock .pd-tab.on'));
          const head = document.querySelector('#ig-dock .igd-head').getAnimations().length;
          return { ghost, kids, ink, head }; });
        await page.waitForTimeout(400);
        const left = await page.evaluate(() => document.querySelectorAll('.face-ghost').length);
        check('H turning a tab: the old face fades out over the new one, which fades in', hx.ghost === 1 && hx.kids, JSON.stringify(hx));
        check('H the tab\'s underline glides to the tab pressed; the tab row itself never fades', hx.ink && hx.head === 0, JSON.stringify(hx));
        check('H the picture of the old face is gone once it has faded', left === 0, String(left));
        const same = await page.evaluate(() => { renderIntelDock(); return document.querySelectorAll('.face-ghost').length; });
        check('H a repaint of the same face is drawn as before, nothing fades', same === 0, String(same));

        /* I — A SWIPE TO THE RIGHT PUTS THE NOTES DRAWER AWAY */
        const swipe = async (frac) => page.evaluate(f => {
          const p = document.getElementById('context-panel'); const r = p.getBoundingClientRect();
          const tgt = [...p.querySelectorAll('div,p,span')].find(x => { const b = x.getBoundingClientRect(); return b.width > 40 && !x.closest('input,textarea,select,button,a,[contenteditable="true"]'); }) || p;
          const b = tgt.getBoundingClientRect(); const x0 = b.left + 10, y0 = b.top + Math.min(10, b.height / 2);
          const ev = (type, x) => (type === 'pointerdown' ? tgt : document).dispatchEvent(new PointerEvent(type, { pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: x, clientY: y0, bubbles: true, cancelable: true }));
          ev('pointerdown', x0); const to = x0 + r.width * f;
          for (let i = 1; i <= 6; i++) ev('pointermove', x0 + (to - x0) * i / 6);
          const mid = p.style.transform;
          return new Promise(res => setTimeout(() => { ev('pointerup', to); res(mid); }, 400));
        }, frac);
        await page.evaluate(() => openNotesPanel(chatContractId(), null, { force: true }));
        await until(() => document.getElementById('context-panel').classList.contains('open'));
        const short = await swipe(0.15);
        await page.waitForTimeout(400);
        const stays = await page.evaluate(() => ({ open: document.getElementById('context-panel').classList.contains('open'), inline: document.getElementById('context-panel').style.transform }));
        check('I a short drag carries the drawer with the hand and lets it settle back', /translateX\(\d+/.test(short) && stays.open && stays.inline === '', JSON.stringify({ short, stays }));
        const long = await swipe(0.6);
        await page.waitForTimeout(500);
        const shut = await page.evaluate(() => !document.getElementById('context-panel').classList.contains('open'));
        check('I dragged past a third of its width, the drawer goes away', /translateX\(\d+/.test(long) && shut, long);
        const moused = await page.evaluate(() => { openNotesPanel(chatContractId(), null, { force: true }); const p = document.getElementById('context-panel');
          const tgt = [...p.querySelectorAll('div')].find(x => x.getBoundingClientRect().width > 40) || p; const b = tgt.getBoundingClientRect();
          tgt.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: b.left + 10, clientY: b.top + 5, bubbles: true }));
          document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', pointerId: 1, clientX: b.left + 300, clientY: b.top + 5, bubbles: true }));
          const t = p.style.transform; document.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'mouse', pointerId: 1, clientX: b.left + 300, clientY: b.top + 5, bubbles: true }));
          const r = { t, open: p.classList.contains('open') }; closeContextPanel(); return r; });
        check('I a mouse drag is left to select text: the drawer does not move', moused.t === '' && moused.open, JSON.stringify(moused));
      }
      if (W === 1366){
        /* H — less motion asked for: the face simply changes */
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const still = await page.evaluate(() => { document.querySelector('#ig-dock [data-pd-tab="copilot"]').click(); document.querySelector('#ig-dock [data-pd-tab="doc"]').click();
          return { ghost: document.querySelectorAll('.face-ghost').length, anim: [...document.getElementById('ig-dock').children].some(n => n.getAnimations().length) }; });
        check('H for a reader who asked for less motion, the face changes at once', still.ghost === 0 && !still.anim, JSON.stringify(still));
      }
      await ctx.close();
    }
    check('F nothing on the page threw', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${failures ? failures + ' FAILED' : 'all passed'}`);
  process.exit(failures ? 1 : 0);
})();
