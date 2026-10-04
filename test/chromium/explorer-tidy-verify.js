/* Chromium verification: EXPLORER, TIDIED (Young, 3–4 Oct 2026)
   ============================================================
   From two iPad screenshots and the requests that followed:
     1. grouped by customer, forty group cards piled into one heap — a card
        now steps aside to the nearest free place, or is not drawn;
     2. one customer stood twice — names that differ only in capitals or
        spacing are one group, printed in the book's own spelling.
   A book of forty-one customers, measured as drawn. Waits ask for the state,
   bounded; a missing feature reports rather than times out.

   Screenshots go to test/chromium/shots/explorer-tidy/.
   Run: node test/chromium/explorer-tidy-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-tidy');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const NAMES = ['Naivas Supermarkets', 'Kabras Sugar (West Kenya Ltd)', 'Ramogi Distributors Ltd', 'Wilmar East Africa Ltd',
  'Kevian Kenya Ltd', 'Statpack Industries Ltd', 'Apex Logistics & Warehousing Ltd', 'Bullion Packaging', 'Chui Foods Ltd',
  'Senator Transport', 'Wasoko', 'Twiga Foods', 'Bidco Africa', 'Kenafric Industries', 'Unilever Kenya', 'Safaricom PLC',
  'Coast Motors', 'Quickmart', 'Serena Group', 'Nandi Dairy', 'Brookside Dairy', 'Mumias Sugar', 'East African Breweries',
  'Bamburi Cement', 'Crown Paints', 'Sameer Africa', 'Kapa Oil Refineries', 'Pwani Oil', 'Menengai Oil', 'Haco Industries',
  'Elgon Kenya', 'Del Monte Kenya', 'Mabati Rolling Mills', 'Devki Steel', 'Glacier Products', 'Highlands Water',
  'Keroche Breweries', 'Unga Group', 'Capwell Industries', 'Melvins Tea'];
const BOOK = FIXTURES.concat(NAMES.flatMap((n, i) => Array.from({ length: 1 + (i % 4) }, (_, j) =>
  fixtureContract('MK-T' + i + '-' + j, 'Supply ' + i + '-' + j, n, ['proc', 'sales'][(i + j) % 2], (i + 1) * 1e6, ['Signed', 'Draft', 'Under Review'][(i + j) % 3]))))
  /* one party typed three ways: the case and the spacing differ, the name does not */
  .concat([fixtureContract('MK-Y1', 'Juno one', 'Juno Logistics Ltd', 'proc', 2e6, 'Signed'),
    fixtureContract('MK-Y2', 'Juno two', 'Juno Logistics Ltd', 'proc', 2e6, 'Signed'),
    fixtureContract('MK-Y3', 'Juno three', 'juno logistics  ltd ', 'sales', 2e6, 'Draft')]);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(n => window.state && state.contracts && state.contracts.length >= n, BOOK.length, { timeout: 20000 });
    await page.evaluate(() => { intel.cam = null; intel.tab = 'map'; intel.folds = {}; setView('intel'); });
    await until(() => window.IG && IG.hubs && IG.hubs.length >= 3);

    /* ================= 1. CARDS NEVER COVER CARDS ========================== */
    await page.evaluate(() => { intel.groupBy = 'counterparty'; intel.groups = null; intel.folds = {}; igSetSpin && igSetSpin(false); rebuildIntelGraph(); });
    await until(() => IG && IG.hubs && IG.hubs.length >= 40);
    /* the cards fade in; read once every card has settled (none still rising) */
    await until(() => { const a = IG.hubs.map(h => h.vis); const ok = a.every(v => v > 0.98) || (window._tidyLast && a.every((v, i) => Math.abs(v - window._tidyLast[i]) < 1e-3)); window._tidyLast = a; return ok; }, null, 6000);
    await page.waitForTimeout(400);
    const cards = await page.evaluate(() => {
      const shown = IG.hubs.filter(h => h.g && h.g.style.display !== 'none' && h.box)
        .map(h => { const r = h.g.getBoundingClientRect(); return { l: h.label, x: r.left, y: r.top, r: r.right, b: r.bottom }; });
      const clash = [];
      for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
        const A = shown[i], B = shown[j];
        if (A.x < B.r - 1 && B.x < A.r - 1 && A.y < B.b - 1 && B.y < A.b - 1) clash.push(A.l + ' × ' + B.l);
      }
      return { hubs: IG.hubs.length, shown: shown.length, clash };
    });
    check('1a grouped by customer, no group card covers another', cards.shown > 0 && cards.clash.length === 0,
      `${cards.shown} of ${cards.hubs} cards drawn; overlaps: ${cards.clash.slice(0, 4).join('; ') || 'none'}`);
    /* the Brain shows the cards on the side facing the reader; of those, the
       biggest groups are placed first and so always keep theirs */
    const big = await page.evaluate(() => { const f = IG.hubs.filter(h => !h.folded && h.q && h.q[3] > 0.3).slice(0, 5);
      return { n: f.length, drawn: f.filter(h => h.g.style.display !== 'none').map(h => h.label) }; });
    check('1b the five biggest groups facing the reader all keep their card', big.n > 0 && big.drawn.length === big.n, JSON.stringify(big));
    await page.screenshot({ path: path.join(OUT, '1-customers.png') });
    /* turning the map keeps the rule on every frame it is read */
    await page.evaluate(() => { igSetSpin && igSetSpin(true); });
    let worst = 0;
    for (let k = 0; k < 6; k++) {
      await page.waitForTimeout(350);
      worst = Math.max(worst, await page.evaluate(() => {
        const s = IG.hubs.filter(h => h.g && h.g.style.display !== 'none' && h.box).map(h => h.g.getBoundingClientRect());
        let n = 0; for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
          const A = s[i], B = s[j]; if (A.left < B.right - 1 && B.left < A.right - 1 && A.top < B.bottom - 1 && B.top < A.bottom - 1) n++; }
        return n; }));
    }
    await page.evaluate(() => { igSetSpin && igSetSpin(false); });
    check('1c while the map turns, no two cards overlap on any frame read', worst === 0, `worst frame: ${worst} overlap(s)`);

    /* ================= 2. ONE PARTY, ONE GROUP ============================= */
    const juno = await page.evaluate(() => IG.hubs.filter(h => /juno logistics/i.test(h.label)).map(h => ({ l: h.label, n: h.kids.length })));
    check('2a a party typed with different capitals and spacing is ONE group', juno.length === 1 && juno[0].n === 3, JSON.stringify(juno));
    check('2b printed in the spelling most of the book uses', juno.length === 1 && juno[0].l === 'Juno Logistics Ltd', JSON.stringify(juno));
    const twoSpell = await page.evaluate(() => [graphPartyLabel('NAIVAS  supermarkets'), graphPartyLabel('Naivas Supermarket')]);
    check('2c a different spelling stays a different name — HaTi does not guess', twoSpell[0] === 'Naivas Supermarkets' && twoSpell[1] === 'Naivas Supermarket', JSON.stringify(twoSpell));

    /* ================= 3. ONE MENU ON A TOUCH SCREEN ======================
       Chromium has no iPad picker to draw, so what is measured is what raises
       one there: the select taking focus inside a touch, and the touch's own
       end going through. A finger tap must open HaTi's list with neither. */
    const cdp = await ctx.newCDPSession(page);
    const tap = async sel => {
      const r = await page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel);
      if (!r) return false;
      await page.evaluate(() => { window._tEnd = null; document.addEventListener('touchend', e => { window._tEnd = e.defaultPrevented; }, { once: true }); });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(250);
      return true;
    };
    await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    const tapped = await tap('#ig-group');
    const t3 = await page.evaluate(() => ({ menu: !!document.querySelector('.hati-selmenu'),
      focused: document.activeElement === document.getElementById('ig-group'), endRefused: window._tEnd }));
    check('3a a finger on Group by opens HaTi\'s own list', tapped && t3.menu, JSON.stringify(t3));
    check('3b and the select is not focused (on an iPad a focused select IS the second menu)', tapped && !t3.focused, JSON.stringify(t3));
    check('3c and the touch\'s end is refused, so the system picker has nothing to rise from', tapped && t3.endRefused === true, JSON.stringify(t3));
    await page.keyboard.press('Escape');
    /* a mouse still focuses it: the keyboard keeps its arrows and type-ahead */
    await page.click('#ig-group');
    check('3d a mouse press still focuses the select and opens the list', await page.evaluate(() =>
      document.activeElement === document.getElementById('ig-group') && !!document.querySelector('.hati-selmenu')));
    await page.keyboard.press('Escape');

    check('9a no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close(); await h.stop();
    const failed = results.filter(r => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
  }
})();
