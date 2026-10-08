/* Chromium verification: EXPLORER, TIDIED (Young, 3–4 Oct 2026)
   ============================================================
   From two iPad screenshots and the requests that followed:
     1. grouped by customer, forty group cards piled into one heap — a card
        now steps aside to the nearest free place, or is not drawn;
     2. one customer stood twice — names that differ only in capitals or
        spacing are one group, printed in the book's own spelling.
   A book of forty-one customers, measured as drawn. Waits ask for the state,
   bounded; a missing feature reports rather than times out.

   Screenshots go to test/chromium/shots/owners-fifteen/.
   Run: node test/chromium/owners-fifteen-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'owners-fifteen');
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

    /* ================= 4–7. THE MAP'S LOOK, ASKED FOR IN WORDS ============== */
    const askMap = async q => { await page.fill('#igd-input', q); await page.keyboard.press('Enter'); await page.waitForTimeout(500); };
    const shown = () => page.evaluate(() => ({
      tags: IG.contracts.filter(n => n.tag && n.tag._disp !== 'none' && n.g.style.display !== 'none').map(n => n.id),
      nums: IG.contracts.filter(n => n.num && n.num._disp !== 'none' && n.g.style.display !== 'none').map(n => n.id),
      cards: IG.hubs.filter(h => h.g.style.display !== 'none').map(h => h.label) }));
    await page.evaluate(() => { intel.groupBy = 'counterparty'; intel.folds = {}; intel.names = null; intel.dotScale = 1; rebuildIntelGraph(); });
    await until(() => IG && IG.hubs && IG.hubs.length >= 40);
    await page.waitForTimeout(600);
    const before = await shown();
    await askMap('hide the names');
    await page.waitForTimeout(400);
    const none = await shown();
    check('4a "hide the names": no contract\'s name or number and no group card is drawn — only the bubbles', before.tags.length + before.nums.length > 0 && before.cards.length > 0
      && none.tags.length === 0 && none.nums.length === 0 && none.cards.length === 0, JSON.stringify({ before: [before.tags.length, before.nums.length, before.cards.length], after: [none.tags.length, none.nums.length, none.cards.length] }));
    check('4b and the head line says so', await page.evaluate(() => /names hidden/i.test((document.getElementById('ig-note') || {}).textContent || '')));
    await page.screenshot({ path: path.join(OUT, '4-names-hidden.png') });
    await askMap('show the names again');
    await page.waitForTimeout(400);
    const again = await shown();
    check('4c "show the names again" brings them back', again.tags.length + again.nums.length > 0 && again.cards.length > 0, JSON.stringify([again.tags.length, again.nums.length, again.cards.length]));
    await askMap('only show names for Juno Logistics');
    await page.waitForTimeout(1200);
    const only = await shown();
    const rule = await page.evaluate(() => { const R = igNamesRule(); return R && R.set ? [...R.set].sort() : null; });
    check('5a "only show names for Juno Logistics": the rule names Juno\'s three, every name drawn is Juno\'s, and only Juno\'s card stands',
      JSON.stringify(rule) === JSON.stringify(['MK-Y1', 'MK-Y2', 'MK-Y3']) && only.tags.concat(only.nums).length > 0 && only.tags.concat(only.nums).every(id => /^MK-Y/.test(id))
      && only.cards.length >= 1 && only.cards.every(l => /juno/i.test(l)), JSON.stringify({ rule, only }));
    await askMap('show the names again');
    const r0 = await page.evaluate(() => { const n = IG.contracts.find(x => x._r > 0); return n ? { id: n.id, r: n._r } : null; });
    await askMap('make the bubbles bigger');
    await page.waitForTimeout(300);
    const r1 = await page.evaluate(id => { const n = IG.contracts.find(x => x.id === id); return n ? n._r : null; }, r0 && r0.id);
    check('6a "make the bubbles bigger": every bubble grows by half', !!r0 && r1 / r0.r > 1.4 && r1 / r0.r < 1.6, JSON.stringify({ r0, r1 }));
    await askMap('smaller bubbles');
    await page.waitForTimeout(300);
    const r2 = await page.evaluate(id => { const n = IG.contracts.find(x => x.id === id); return n ? n._r : null; }, r0 && r0.id);
    check('6b "smaller bubbles" takes it back', !!r0 && Math.abs(r2 / r0.r - 1) < .05, JSON.stringify({ r0, r2 }));
    await askMap('show each customer as one bubble');
    const folded = await until(() => IG && intel.groupBy === 'counterparty' && IG.hubs.length >= 40 && IG.hubs.every(h => h.folded) && IG.hubs.filter(h => h._bubR > 2).length > 0, null, 8000);
    await page.waitForTimeout(900);
    const bub = await page.evaluate(() => {
      const big = IG.hubs.slice().sort((a, b) => b.kids.length - a.kids.length);
      const drawn = IG.hubs.filter(h => h._bubR > 2);
      /* no card covers any bubble (its own or another group's) */
      const covered = [];
      IG.hubs.filter(h => h.box && h.g.style.display !== 'none').forEach(h => drawn.forEach(o => {
        const c = o._bq || o.q, cx = Math.max(h.box.x, Math.min(c[0], h.box.x + h.box.w)), cy = Math.max(h.box.y, Math.min(c[1], h.box.y + h.box.h));
        if (Math.hypot(cx - c[0], cy - c[1]) < o._bubR - 2) covered.push(h.label + ' on ' + o.label); }));
      const top = big.find(h => h._bubR > 2), small = big.slice().reverse().find(h => h._bubR > 2);
      return { drawn: drawn.length, covered, top: top && [top.label, top.kids.length, Math.round(top._bubR)], small: small && [small.label, small.kids.length, Math.round(small._bubR)] };
    });
    check('7a "show each customer as one bubble": grouped by customer, every group folded, the bubbles drawn', !!folded && bub.drawn > 0, JSON.stringify(bub));
    check('7b a bigger group is a bigger bubble', !!bub.top && !!bub.small && (bub.top[1] === bub.small[1] || bub.top[2] > bub.small[2]), JSON.stringify(bub));
    check('7c no card is drawn over a bubble — its own or another group\'s', bub.covered.length === 0, JSON.stringify(bub.covered));
    await page.screenshot({ path: path.join(OUT, '7-one-bubble-per-customer.png') });
    /* a bubble is a door: it names its group, and a press opens it */
    const door = await page.evaluate(() => { const h = IG.hubs.find(x => x._bubR > 8 && x.bubEl && x.bubEl.style.display !== 'none');
      if (!h) return null; const r = h.bubEl.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, at = document.elementFromPoint(x, y);
      return { label: h.label, title: (h.bubEl.querySelector('title') || {}).textContent || '', x, y, mine: at === h.bubEl }; });
    check('7f a bubble names its group when pointed at', !!door && door.title.indexOf(door.label) === 0, JSON.stringify(door));
    if (door && door.mine){
      await page.mouse.click(door.x, door.y);
      check('7g and a press on the bubble opens that group', await until(l => { const h = IG.hubs.find(x => x.label === l); return h && !h.folded; }, door.label, 3000), door.label);
    } else check('7g and a press on the bubble opens that group', false, 'no uncovered bubble to press: ' + JSON.stringify(door));
    const foldedBefore = await page.evaluate(() => IG.hubs.filter(h => h.folded).map(h => h.label).sort().join('|'));
    await askMap('open everything');
    check('7d "open everything" spreads every group again', await until(() => IG.hubs.every(h => !h.folded), null, 4000));
    await askMap('undo');
    check('7e and undo puts back exactly the folds it had', await until(f => IG.hubs.filter(h => h.folded).map(h => h.label).sort().join('|') === f, foldedBefore, 4000));
    await askMap('open everything');

    /* ================= 13. ANALYZE CONTRACT, EASY TO REACH ================= */
    await page.evaluate(() => { intel.paper = null; const st = hbS(); st.face = 'board'; hbSave(); setView('dashboard'); });
    await until(() => hbS().face === 'board' && document.querySelectorAll('#hb-board .hb-fig').length === 6);
    await page.fill('#igd-input', 'bring up MK-A2'); await page.keyboard.press('Enter');
    const cardBtn = await until(() => !!document.querySelector('#hb-focus [data-hb-analyze="MK-A2"]'));
    check('13a the Board\'s contract card carries "Analyze contract"', !!cardBtn,
      await page.evaluate(() => [...document.querySelectorAll('#hb-focus .hb-acts button')].map(b => b.textContent.trim()).join(' | ')));
    if (cardBtn) await page.click('#hb-focus [data-hb-analyze="MK-A2"]');
    /* the paper has its own side on Home (Young, 7–8 Oct 2026: Board · Paper · Explorer) — hbAnalyze lands there */
    const up = await until(() => { const p = document.getElementById('ig-paper'); return hbS().face === 'paper' && intel.paper && intel.paper.id === 'MK-A2' && p && !p.hidden && !!p.querySelector('.pg-sheet'); }, null, 10000);
    check('13b pressed, Home\'s Paper side opens with that contract\'s paper up', !!up);
    check('13c and the question box is ready for the first question', await until(() => document.activeElement && document.activeElement.id === 'igd-input', null, 3000));
    await page.screenshot({ path: path.join(OUT, '13-analyze-from-board.png') });
    /* asked in words, from the board */
    await page.evaluate(() => { intel.paper = null; igPaintPaper(); hbSetFace('board'); });
    await until(() => hbS().face === 'board');
    await page.fill('#igd-input', 'let me ask questions about MK-A2'); await page.keyboard.press('Enter');
    const said = await until(() => { const p = document.getElementById('ig-paper'); return hbS().face === 'paper' && intel.paper && intel.paper.id === 'MK-A2' && p && !p.hidden; }, null, 10000);
    check('13d "let me ask questions about MK-A2" opens the same paper, spending nothing', !!said,
      await page.evaluate(() => (document.querySelector('#igd-feed .hb-cost') || {}).textContent || ''));
    /* a finger: a bigger target, and a wobble is still a press */
    await page.evaluate(() => { intel.paper = null; igPaintPaper(); hbSetFace('explorer'); igSetSpin && igSetSpin(false); });
    await until(() => hbS().face === 'explorer' && IG && IG.contracts && IG.contracts.length > 0, null, 8000);
    const coarse = await page.evaluate(() => igTapCoarse());
    /* a dot nothing else is drawn over, so the press is the dot's to answer —
       read once the map has stopped gliding (two reads 300ms apart agree) */
    let still = false;
    for (let k = 0; k < 20 && !still; k++){
      const a = await page.evaluate(() => IG.contracts.slice(0, 20).map(n => n.q ? Math.round(n.q[0]) + ',' + Math.round(n.q[1]) : '').join('|'));
      await page.waitForTimeout(300);
      const b = await page.evaluate(() => IG.contracts.slice(0, 20).map(n => n.q ? Math.round(n.q[0]) + ',' + Math.round(n.q[1]) : '').join('|'));
      still = a === b;
    }
    const dot = await until(() => { if (!IG || !IG.contracts) return null;
      for (const n of IG.contracts){ if (!(n._fold < .5) || n.g.style.display === 'none' || !n.hitEl) continue;
        const r = n.hitEl.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, at = document.elementFromPoint(x, y);
        if (at && n.g.contains(at)) return { id: n.id, x, y, d: Math.round(r.width) }; }
      return null; });
    check('13e on a touch screen each dot answers across a 44px target', !!dot && (coarse ? dot.d >= 44 : true), JSON.stringify({ coarse, dot }));
    if (dot){
      await page.evaluate(() => { intel.history = []; });
      const cdp14 = await ctx.newCDPSession(page);
      await cdp14.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: dot.x, y: dot.y, id: 1 }] });
      await cdp14.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: dot.x + 5, y: dot.y + 4, id: 1 }] });
      await cdp14.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const opened = await until(id => (intel.history || []).some(m => m.explainId === id), dot.id, 3000);
      check('13f a press that wobbles by a few pixels still opens the contract\'s card, and does not turn the map', !!opened, JSON.stringify(dot));
    }

    /* ================= 14. BACK TO DOCUMENT, IN A RING ===================== */
    await page.evaluate(() => { const c = state.contracts.find(x => x.id === 'MK-A2'); if (c && typeof negoInit === 'function') negoInit(c); openRedlineWorkbench('MK-A2', { blanksAsked: true }); });
    const back = await until(() => { const b = document.querySelector('#shell-title [data-back="contract"]'); if (!b) return null;
      const ring = b.querySelector('.crumb-ring'), word = b.querySelector('.crumb-back-word'); if (!ring || !word) return null;
      const cs = getComputedStyle(ring), r = ring.getBoundingClientRect(), svg = ring.querySelector('svg');
      return { style: cs.borderTopStyle, width: parseFloat(cs.borderTopWidth), radius: cs.borderTopLeftRadius, w: Math.round(r.width), h: Math.round(r.height),
        arrowInside: !!svg, word: word.textContent.trim(), wordRight: word.getBoundingClientRect().left >= r.right, label: b.getAttribute('aria-label') }; });
    check('14a the way back is a ring round the arrow (style AND width, never width alone)', !!back && back.style === 'solid' && back.width >= 1
      && back.radius === '50%' && back.w === back.h && back.arrowInside, JSON.stringify(back));
    check('14b "Back to Document" stands beside it, and the label says the same', !!back && back.word === 'Back to Document' && back.wordRight && back.label === 'Back to Document', JSON.stringify(back));
    await page.screenshot({ path: path.join(OUT, '14-back-to-document.png'), clip: { x: 0, y: 0, width: 1180, height: 120 } });
    await page.click('#shell-title [data-back="contract"]').catch(() => {});
    const docs = await until(() => state.view === 'workspace' && !!document.querySelector('#ws-tabs [data-room-tab="docs"][aria-selected="true"]'));
    check('14c pressed, it lands on the contract\'s Document tab', !!docs,
      await page.evaluate(() => state.view + ' · ' + ((document.querySelector('#ws-tabs [aria-selected="true"]') || {}).textContent || '')));

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
