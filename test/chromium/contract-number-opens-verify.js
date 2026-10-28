/* A CONTRACT NUMBER OPENS THE CONTRACT (owner, 28 Oct 2026, round 17: "Contract numbers should not go to AI brain.
   They should be rule and take you to contracts workspace for the contract in question").
   Typed in a Jambo box, a number on its own lands on that contract's paper with its Dossier, free; a number inside a
   question opens it and asks Jambo there; a number nobody here can open is said so, and nothing moves.
     1 · Home's box: "MK-HB4" alone → MK-HB4's paper, Jambo's brain not asked
     2 · a list's Jambo box (Approvals): "open mk-hb9" → MK-HB9's paper
     3 · "MK-999" → "No contract MK-999 that you can open.", the page stays
     4 · "MK-HB4 when does it end?" → MK-HB4's paper, and the question asked of Jambo there
   Run: node test/chromium/contract-number-opens-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'contract-number-opens');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const still = P => until(P, () => !document.getAnimations().some(a => a.playState === 'running'), null, 4000);

(async () => {
  const h = await startHati({});
  await seedHandbookWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  /* every brain call the page makes is counted at the door */
  let brain = 0; P.on('request', r => { if (/\/api\/ai\/(chat|copilot|ask)/.test(r.url())) brain++; });
  const onPaper = id => until(P, id => typeof deskKeyNow === 'function' && deskKeyNow() === 'c:' + id && !!(window.pdContract && pdContract() && pdContract().id === id), id, 10000);
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && Array.isArray(state.contracts) && state.contracts.length && document.getElementById('cn-q')), null, 20000);
    await P.evaluate(() => { state.aiConfigured = true; });

    /* ---- 1 · Home's box ---- */
    const b0 = brain;
    await P.fill('#cn-q', 'MK-HB4'); await P.press('#cn-q', 'Enter');
    check(await onPaper('MK-HB4'), '1a "MK-HB4" typed on Home lands on its paper with the Dossier beside it');
    await P.waitForTimeout(600);
    check(brain === b0, '1b and Jambo\'s brain was not asked', { calls: brain - b0 });
    await still(P); await P.screenshot({ path: path.join(OUT, '1-home-number.png') });

    /* ---- 2 · a list's Jambo box ---- */
    await P.evaluate(() => setView('approvals'));
    const box = await until(P, () => !!document.getElementById('jl-q'), null, 10000);
    check(box, '2a the Approvals list carries its Jambo box');
    if (box){
      const b1 = brain;
      await P.fill('#jl-q', 'open mk-hb9'); await P.press('#jl-q', 'Enter');
      check(await onPaper('MK-HB9'), '2b "open mk-hb9" typed beside a list lands on MK-HB9\'s paper');
      await P.waitForTimeout(600);
      check(brain === b1, '2c free', { calls: brain - b1 });
    }

    /* ---- 3 · a number nobody here can open ---- */
    await P.evaluate(() => setView('counter'));
    await until(P, () => !!document.getElementById('cn-q'), null, 8000);
    const v0 = await P.evaluate(() => state.view);
    const b2 = brain;
    await P.fill('#cn-q', 'MK-999'); await P.press('#cn-q', 'Enter');
    const said = await until(P, () => [...document.querySelectorAll('[class*=toast]')].some(t => /No contract MK-999 that you can open/.test(t.textContent)), null, 5000);
    check(said, '3a "MK-999" is answered "No contract MK-999 that you can open."');
    await P.waitForTimeout(400);
    check(await P.evaluate(() => state.view) === v0 && brain === b2, '3b nothing moved and nothing was spent', { view: await P.evaluate(() => state.view), calls: brain - b2 });

    /* ---- 4 · a number inside a question ---- */
    await P.fill('#cn-q', 'MK-HB4 when does it end?'); await P.press('#cn-q', 'Enter');
    check(await onPaper('MK-HB4'), '4a "MK-HB4 when does it end?" opens MK-HB4 first');
    const asked = await until(P, () => (window.intel && Array.isArray(intel.history) ? intel.history : []).some(m => m && m.role === 'user' && /when does it end/i.test(String(m.text || ''))), null, 8000);
    check(asked, '4b and asks Jambo the question there, beside it');
    await still(P); await P.screenshot({ path: path.join(OUT, '4-question-there.png') });

    for (const [w, hh] of [[1536, 730], [1366, 950]]){ await P.setViewportSize({ width: w, height: hh }); await still(P); await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) }); }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
