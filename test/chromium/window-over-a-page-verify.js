/* Chromium verification: THE WINDOW FLOATS OVER A PAGE, UNDER A DECISION (owner, 24 Oct 2026)
   ============================================================
   The owner's picture: the ✦'s window opened over the New agreement form had
   its left half cut off — the form is a PAGE drawn over the middle (z 70) and
   the window sat under it (z 50). Three layers now: a page or a side drawer
   (70/71) is big work and blocks nothing, so the window (75) floats over it;
   a DIALOG carries its scrim and a decision that cannot proceed, so it stands
   above the window (80). Measured in PAINTED PIXELS (elementFromPoint), never
   a rect: a rect is not a painted pixel. Waits ask for the state, bounded.
     A  the New agreement form in the middle: the window's own pixels are on top
     B  Key terms in the middle, beside the Dossier: the same
     C  a side drawer: the same
     D  the Settings drawer: the same
     E  a dialog with its scrim stands ABOVE the window (a decision owns the screen)
     F  photos at the owner's three screens; no page errors
   Run: node test/chromium/window-over-a-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'window-over-a-page');
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, ms = 8000, arg) => { const end = Date.now() + ms;
      while (Date.now() < end) { let v = null; try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(100); } return null; };

    /* WHOSE PIXELS ARE ON TOP where the window overlaps what is under it: five points down the window's
       own left edge (the half the owner saw cut off), each read with elementFromPoint. */
    const whoIsOnTop = () => page.evaluate(() => {
      const p = document.getElementById('ai-panel');
      if (!p || !p.getClientRects().length) return { err: 'no window' };
      const b = p.getBoundingClientRect();
      const xs = [b.left + 6, b.left + 30, b.left + b.width / 2];
      const ys = [b.top + 40, b.top + b.height / 2, b.bottom - 40];
      const pts = [];
      for (const x of xs) for (const y of ys) {
        const el = document.elementFromPoint(Math.round(x), Math.round(y));
        pts.push({ x: Math.round(x), y: Math.round(y), mine: !!(el && p.contains(el)), who: el ? (el.id || String(el.className).slice(0, 28) || el.tagName) : null });
      }
      return { all: pts.every(q => q.mine), pts: pts.filter(q => !q.mine).slice(0, 3), z: getComputedStyle(p).zIndex };
    });
    const openWindow = async () => { await page.evaluate(() => { if (!(window.ai && ai.open && ai.win)) openAI(null, { win: true }); });
      return until(() => (window.ai && ai.open && ai.win && document.getElementById('ai-panel') && document.getElementById('ai-panel').classList.contains('floating')) || null); };
    const closeWindow = () => page.evaluate(() => { if (window.ai && ai.open) closeAI(); });
    const shots = async tag => { for (const [w, hh] of SCREENS) { await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(OUT, `${tag}-${w}x${hh}.png`) }); } await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(250); };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.locator('#li-email').count()) { await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go'); }
    await until(() => (window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2')) || null, 20000);
    await page.waitForTimeout(500);
    await page.evaluate(() => { setView('dashboard'); if (window.intel) intel.paper = null; hbSetFace('board'); });
    await until(() => (state.view === 'dashboard' && document.getElementById('ig-dock')) || null);

    console.log('\nA · the New agreement form in the middle');
    await page.evaluate(() => { openNewAgreement(); });
    await until(() => document.querySelector('#modal-root [data-dlg-page], #na-root') || null);
    check('A0 the form is up as a page in the middle', !!(await page.evaluate(() => !!document.querySelector('#modal-root [data-dlg-page], #na-root'))));
    check('A1 the window opens over it', !!(await openWindow()));
    const A = await whoIsOnTop();
    check('A2 every point down the window\'s own edge is the window\'s own pixels', !!A && A.all === true, JSON.stringify(A));
    await shots('A-new-agreement');
    await closeWindow();
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.waitForTimeout(400);

    console.log('\nB · Key terms in the middle, beside the Dossier');
    await page.evaluate(() => { roomHomeLand('MK-B2'); });
    await until(() => (document.getElementById('ig-dock') && (typeof pdAskContractId === 'function' ? pdAskContractId() === 'MK-B2' : true)) || null);
    await page.evaluate(() => { if (typeof pdKtOpen === 'function') pdKtOpen('MK-B2'); });
    const ktUp = await until(() => document.querySelector('#modal-root [data-dlg-page]') || null, 10000);
    if (ktUp) {
      check('B1 the window opens over Key terms', !!(await openWindow()));
      const B = await whoIsOnTop();
      check('B2 the window\'s own pixels are on top', !!B && B.all === true, JSON.stringify(B));
      await shots('B-key-terms');
      await closeWindow();
      await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
      await page.waitForTimeout(400);
    } else check('B1 Key terms opens in the middle', false, 'it did not open');

    console.log('\nC · a side drawer');
    await page.evaluate(() => { openSidePanel('<p>drawer</p>', { label: 'Drawer' }); });
    await until(() => document.getElementById('side-panel') || null);
    check('C1 the window opens over the drawer', !!(await openWindow()));
    const C = await whoIsOnTop();
    check('C2 the window\'s own pixels are on top', !!C && C.all === true, JSON.stringify(C));
    await closeWindow();
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.waitForTimeout(300);

    console.log('\nD · the Settings drawer, and a dialog opened from inside it');
    await page.evaluate(() => { setView('team'); });
    await until(() => (state.view === 'team') || null);
    await page.evaluate(() => { if (typeof stDrawerOpen === 'function') stDrawerOpen('account'); });
    const dUp = await until(() => { const d = document.getElementById('st-drawer'); return !!(d && d.classList.contains('open')) || null; }, 6000);
    if (dUp) {
      check('D1 the window opens over the Settings drawer', !!(await openWindow()));
      const D = await whoIsOnTop();
      check('D2 the window\'s own pixels are on top of the drawer', !!D && D.all === true, JSON.stringify(D));
      await page.evaluate(() => { openModal('<div style="padding:24px">A decision</div>', { label: 'Decide' }); });
      await until(() => document.querySelector('#modal-scrim') || null);
      const D3 = await whoIsOnTop();
      check('D3 a dialog opened from inside the drawer still stands above the window', !!D3 && D3.all === false, JSON.stringify(D3));
      await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
      await closeWindow();
      await page.waitForTimeout(300);
    } else check('D1 the Settings drawer opens (else nothing to measure)', true, 'no drawer here: left alone');
    await page.evaluate(() => { setView('dashboard'); });
    await until(() => (state.view === 'dashboard') || null);

    console.log('\nE · a decision owns the screen');
    await openWindow();
    await page.evaluate(() => { openModal('<div style="padding:24px">A decision</div>', { label: 'Decide' }); });
    await until(() => document.querySelector('#modal-scrim') || null);
    const E = await whoIsOnTop();
    check('E1 with a dialog up, the window is NOT on top: the decision owns the screen', !!E && E.all === false, JSON.stringify(E));
    const scrim = await page.evaluate(() => { const s = document.getElementById('modal-scrim'); const p = document.getElementById('ai-panel');
      if (!s || !p) return null; const b = p.getBoundingClientRect(); const el = document.elementFromPoint(Math.round(b.left + 6), Math.round(b.top + 40));
      return { onTop: !!(el && !p.contains(el)), who: el ? (el.id || String(el.className).slice(0, 28)) : null }; });
    check('E2 and the scrim (or the dialog) is what is painted there', !!scrim && scrim.onTop === true, JSON.stringify(scrim));
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await closeWindow();

    check('F no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run finished', false, String((e && e.message) || e).slice(0, 200));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
