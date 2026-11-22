/* APPROVE IN THE PANEL (P-30, owner's pick 20 Nov 2026: "the row keeps ONLY See it in the paper ›"; REVERSES round
   10's "Approve on the row", whose claims this file used to hold)
     1 · no row carries Approve or Decline; every row ends in "See it in the paper ›"
     2 · choosing a row puts its Approve (black) and Decline in the side panel
     3 · the panel's Approve approves THAT contract and the press did not open the contract
     4 · the owner's three screens: the paper link inside its row, nothing sideways
   Run: node test/chromium/approve-on-row-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'approve-on-row');
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
  /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the list is the new look's table (.apn-table), its
     row's Approve is .apn-ok, the row's last column says how it stands (td.apn-wait / td.apn-acts) */
  const btns = () => P.evaluate(() => [...document.querySelectorAll('.ap-table.ap-ins tr[data-ap-row][data-ap-kind="approval"]')].map(tr => ({
    id: tr.getAttribute('data-ap-row'), sel: tr.classList.contains('is-sel'), has: !!tr.querySelector('[data-ap-approve], [data-ap-refuse], .apn-ok'), peek: !!tr.querySelector('[data-apn-peek]') })));
  const panel = () => P.evaluate(() => { const p = document.getElementById('ins-panel'); const a = p && p.querySelector('[data-apn-act="approve"]'), d = p && p.querySelector('[data-apn-act="refuse"]');
    return { approve: !!a, black: !!a && getComputedStyle(a).color === 'rgb(255, 255, 255)', decline: !!d, id: a ? a.getAttribute('data-id') : null }; });
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && Array.isArray(state.contracts) && state.contracts.length), null, 20000);
    await P.evaluate(() => setView('approvals'));
    const ok = await until(P, () => document.querySelectorAll('.ap-table.ap-ins tr[data-ap-row]').length >= 2, null, 10000);
    check(ok, '0 the Approvals list stands beside its panel');
    if (ok){
      await P.click('.ap-table.ap-ins tr[data-ap-row] td:first-child');
      await until(P, () => !!document.querySelector('.ap-table.ap-ins tr.is-sel'), null, 4000);
      const B = await btns();
      check(B.length >= 2 && B.every(b => !b.has && b.peek), '1 no row carries Approve or Decline; each ends in the paper link', B);
      await still(P); await P.screenshot({ path: path.join(OUT, '1440x780.png') });
      const target = (B[1] || B[0] || {}).id;
      await P.click(`.ap-table.ap-ins tr[data-ap-row="${target}"] td:first-child`);
      await until(P, id => { const a = document.querySelector('#ins-panel [data-apn-act="approve"]'); return !!a && a.getAttribute('data-id') === id; }, target, 6000);
      const Pn = await panel();
      check(Pn.approve && Pn.black && Pn.decline && Pn.id === target, '2 the chosen row\'s Approve (black) and Decline are in the side panel', Pn);
      const v0 = await P.evaluate(() => state.view);
      await P.click('#ins-panel [data-apn-act="approve"]');
      { const ok = await P.waitForSelector('#prompt-overlay #pd-ok', { timeout: 4000 }).catch(() => null); if (ok) await ok.click(); } /* a yes offers an optional note (17 Nov 2026) */
      const done = await until(P, id => { const c = getContract(id); const ch = (c && c.approvalChain) || [];
        return ch.some(x => x && x.status === 'approved'); }, target, 10000);
      check(done, '3a the panel\'s Approve approves that contract', { target });
      check(await P.evaluate(() => state.view) === v0, '3b and the press did not open the contract', { view: await P.evaluate(() => state.view) });
      await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-approved.png') });
    }
    for (const [w, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh }); await P.waitForTimeout(400); await still(P);
      const fit = await P.evaluate(() => { const b = document.querySelector('.ap-table.ap-ins [data-apn-peek]'); const tr = b && b.closest('tr');
        const r = b && b.getBoundingClientRect(), rr = tr && tr.getBoundingClientRect();
        return { side: document.documentElement.scrollWidth > innerWidth, has: !!b, inside: !!(r && rr && r.right <= rr.right && r.left >= rr.left), oneLine: !!(r && r.height < 40) }; });
      check(fit.has && fit.inside && fit.oneLine && !fit.side, `4 ${w}×${hh}: the paper link on one line inside its row, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
