/* THE ONE SHEET OWNS THE PANEL (owner, 28 Oct 2026, relayed from the "Email page redesign" session)
   New agreement started while another contract's Redlines were up beside the paper kept that contract's tabs, its
   Redlines and "Risks to look at" beside the uncreated agreement.
     1 · MK-A2's Redlines face up; New agreement opens: the panel shows the sheet's guide and the box, no contract
         tabs (no Dossier · Clauses · Redlines), no Redlines column or Risks
     2 · Cancel: MK-A2's paper is back with its tabs and its Redlines face, as they were
     3 · the same over the Dossier face; and the owner's three screens: the guide inside the panel
   Run: node test/chromium/new-agreement-owns-the-panel-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'new-agreement-owns-the-panel');
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
  const panel = () => P.evaluate(() => { const d = document.getElementById('ig-dock'); if (!d) return null;
    return { tabs: [...d.querySelectorAll('.pd-tab[data-pd-tab]')].map(t => t.getAttribute('data-pd-tab')), red: !!d.querySelector('.rl-card-d, #rl-risks'),
      guide: /New agreement beside me/.test(d.innerText), box: !!d.querySelector('#igd-input'), sheet: !!document.querySelector('#na-root.na-one') }; });
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!document.getElementById('cn-q'), null, 20000);
    await P.evaluate(() => pdOpenOnHome('MK-A2', 'copilot'));
    await until(P, () => !!(window.pdContract && pdContract() && pdContract().id === 'MK-A2'), null, 8000);
    await P.evaluate(() => pdRedOpen('MK-A2'));
    const redUp = await until(P, () => !!document.querySelector('#ig-dock .rl-card-d'), null, 10000);
    check(redUp, '0 MK-A2\'s Redlines face is up beside its paper');

    await P.evaluate(() => openNewAgreement());
    await until(P, () => !!document.querySelector('#na-root.na-one'), null, 8000);
    await until(P, () => /New agreement beside me/.test((document.getElementById('ig-dock') || {}).innerText || ''), null, 6000);
    const A = await panel();
    check(!!A && A.sheet && A.guide && A.box && !A.red && !A.tabs.some(t => ['facts', 'clauses', 'red', 'copilot_d', 'dossier'].includes(t)) && A.tabs.length <= 1,
      '1 beside the sheet: the guide and the box, no contract tabs, no Redlines or Risks', A);
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-over-redlines.png') });
    for (const [w, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh }); await P.waitForTimeout(200); await still(P);
      const fit = await P.evaluate(() => { const d = document.getElementById('ig-dock'), R = d.getBoundingClientRect(); return { side: document.documentElement.scrollWidth > innerWidth, inView: R.right <= innerWidth + 1 && R.left >= 0 }; });
      check(!fit.side && fit.inView, `3a ${w}×${hh}: the guide's panel inside the window, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    await P.setViewportSize({ width: 1440, height: 780 });

    /* Cancel: the way out without a draft */
    await P.click('#dk-back');
    await until(P, () => !document.querySelector('#na-root.na-one'), null, 6000);
    const back = await until(P, () => !!document.querySelector('#ig-dock .rl-card-d') && !!(window.pdContract && pdContract() && pdContract().id === 'MK-A2'), null, 8000);
    const B = await panel();
    check(back && B && B.tabs.length >= 3 && B.red, '2 Cancel: MK-A2 back with its tabs and its Redlines face', B);

    /* over the Dossier face too */
    await P.evaluate(() => pdOpenOnHome('MK-A2', 'copilot'));
    await until(P, () => !document.querySelector('#ig-dock .rl-card-d'), null, 6000);
    await P.evaluate(() => openNewAgreement());
    await until(P, () => !!document.querySelector('#na-root.na-one'), null, 8000);
    await until(P, () => /New agreement beside me/.test((document.getElementById('ig-dock') || {}).innerText || ''), null, 6000);
    const C = await panel();
    check(!!C && C.guide && C.tabs.length <= 1, '3b over the Dossier: the guide, no contract tabs', C);
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
