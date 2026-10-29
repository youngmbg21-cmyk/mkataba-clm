/* APPROVE ON THE ROW (round 10, "The Legora way", owner's overnight build of 28 Oct 2026)
   Beside Jambo's panel, the decision sits on the Approvals list: one quiet Approve on each row this reader may decide,
   filled on the chosen row; a press approves that row without choosing it first, and Undo stays in reach.
     1 · every row the admin may decide carries Approve; the chosen row's is filled, the others quiet
     2 · choosing another row moves the fill there
     3 · Approve on a row that is not chosen approves THAT contract (its row then says Approved), and the press did
         not open the contract
     4 · the owner's three screens: the button inside its row, nothing sideways
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
  const btns = () => P.evaluate(() => [...document.querySelectorAll('.ap-table.ap-ins tr[data-ap-row]')].map(tr => {
    const b = tr.querySelector('.ap-ok'); const cs = b && getComputedStyle(b);
    return { id: tr.getAttribute('data-ap-row'), sel: tr.classList.contains('is-sel'), has: !!b, bg: cs ? cs.backgroundColor : null, ink: cs ? cs.color : null };
  }));
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
      let B = await btns();
      const filled = B.filter(b => b.has && b.ink === 'rgb(255, 255, 255)');
      check(B.length >= 2 && B.every(b => b.has), '1a every row the admin may decide carries Approve', B.map(b => b.id + ':' + b.has));
      check(filled.length === 1 && filled[0].sel, '1b the chosen row\'s Approve is filled, the others quiet', B);
      await still(P); await P.screenshot({ path: path.join(OUT, '1440x780.png') });
      await P.click('.ap-table.ap-ins tr[data-ap-row]:nth-child(2) td:first-child');
      await P.waitForTimeout(300);
      B = await btns();
      check(B[1].sel && B[1].ink === 'rgb(255, 255, 255)' && B[0].ink !== 'rgb(255, 255, 255)', '2 choosing another row moves the fill there', B.slice(0, 2));

      /* 3 · Approve on a row not chosen: the third */
      const target = B[2] && B[2].id;
      const v0 = await P.evaluate(() => state.view);
      await P.click(`.ap-table.ap-ins tr[data-ap-row="${target}"] .ap-ok`);
      const done = await until(P, id => { const tr = document.querySelector(`tr[data-ap-row="${id}"] td.ap-wait`); return !!(tr && /Approved/.test(tr.innerText)); }, target, 10000);
      const rowSays = await P.evaluate(id => { const tr = document.querySelector(`tr[data-ap-row="${id}"]`); return tr ? tr.innerText.replace(/\s+/g, ' ') : '(row left the list)'; }, target);
      check(done, '3a Approve on a row that is not chosen approves that contract', { target, rowSays });
      check(await P.evaluate(() => state.view) === v0, '3b and the press did not open the contract', { view: await P.evaluate(() => state.view) });
      await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-approved.png') });
    }
    for (const [w, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh }); await P.waitForTimeout(400); await still(P);
      const fit = await P.evaluate(() => { const b = document.querySelector('.ap-table.ap-ins .ap-ok'); const td = b && b.closest('td'), tr = b && b.closest('tr');
        const r = b && b.getBoundingClientRect(), rr = tr && tr.getBoundingClientRect();
        return { side: document.documentElement.scrollWidth > innerWidth, has: !!b, inside: !!(r && rr && r.right <= rr.right - 8 && r.left >= rr.left), oneLine: !!(r && r.height < 40), td: td ? td.offsetWidth : 0 }; });
      check(fit.has && fit.inside && fit.oneLine && !fit.side, `4 ${w}×${hh}: Approve on one line inside its row, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
