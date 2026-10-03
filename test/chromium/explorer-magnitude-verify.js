/* Chromium verification: EXPLORER — A FINGER TURNS IT, AND EVERY VIEW SHOWS THE WHOLE BOOK
   ============================================================
   Young, 28 Sep 2026: "It seems all pages in explore have the same issue with
   trying to rotate and spin the screen. But i wonder if it just my iPad so
   please review. Also, brain and wiring seem to show a lot more contracts on
   the screen at a time especially when i am looking at 179 contracts in my
   portfolio. The other screens do not seem to show the magnitude of the
   portfolio."

   A book of 179 contracts with the facts spread the way a real one is (stages
   across every stream, expiry dates over three years, a quarter-end crowd),
   driven with the browser's own TOUCH input and measured as drawn: whether
   fingers turn the map (one, two twisting, one of two lifting, after a lift
   the page never heard), how many contracts each view draws, how far each
   floor's contracts spread, whether a crowd on one date is one dot or many,
   and what the head line says when the map's own limit bites. Waits ask for
   the state, bounded; a view is read once every dot has glided home.

   Red at 47b48c1c (the parent) on 1b, 1c, 1d, 2a–2d and 3b: a finger whose
   lift was lost turned every later drag into a pinch, two fingers only
   zoomed, a lifted finger stopped the turn, 120 of 179 contracts were drawn
   with nothing saying so, each floor's contracts sat in thin piles (33–45% of
   the stage against 53–72% now), a quarter-end crowd stacked on one spot.
   1a, 3a and 9a pass there too — they are what must not change. Section 4
   (every view moves; Turning / Still) is red there on 4a and 4c–4g; 4b, the
   Brain's own turn, is what must not change. Section 5 (the head line rides
   the stage) is red at 2af16743.

   The stage already had touch-action:none before this; what a Safari on an
   iPad does beyond that cannot be driven from Chromium, so these claims
   stage the finger sequences an iPad produces, not Safari itself.

   Screenshots go to test/chromium/shots/explorer-magnitude/.
   Run: node test/chromium/explorer-magnitude-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-magnitude');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const N = 179 - FIXTURES.length;
const ST = ['proc', 'sales', 'mfg', 'dist', 'mktg'], SG = ['Draft', 'Under Review', 'Signed', 'Signed', 'Declined', 'Signed', 'Under Review'];
const BOOK = FIXTURES.concat(Array.from({ length: N }, (_, i) => {
  const c = fixtureContract('MK-M' + i, ['Packaging Film Supply', 'Cold Chain Logistics', 'Distributor Agreement', 'Office Lease'][i % 4], ['Naivas', 'Bidco', 'Kenafric', 'Twiga', 'Unilever', 'Safaricom'][i % 6],
    ST[i % 5], ((i * 37) % 90 + 5) * 1e6, SG[(i * 3) % 7]);
  /* a quarter-end crowd: every fourth contract ends on the same day */
  c.expiry = i % 4 === 0 ? '2027-03-31' : new Date(Date.UTC(2026, 9, 1) + ((i * 97) % 1100) * 864e5).toISOString().slice(0, 10);
  return c;
}));

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
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* a view is read once the camera is on it AND every dot has glided onto its place */
  const view = async v => { await page.click(`[data-ig-view="${v}"]`); await until(k => intel.cam.w[k] > 0.995, v);
    await until(k => { const P = ['A', 'W3', 'L', 'G', 'T'][k], T = ['At', 'W3', 'Lt', 'Gt', 'Tt'][k];
      return IG.nodes.filter(n => n.kind === 'contract').every(n => !n[T] || Math.hypot(n[P][0] - n[T][0], n[P][1] - n[T][1], n[P][2] - n[T][2]) < .002); }, v); };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(n => window.state && state.contracts && state.contracts.length >= n, 179, { timeout: 20000 });
    await page.evaluate(() => { intel.cam = null; intel.tab = 'map'; setView('intel'); });
    await until(() => window.IG && IG.hubs && IG.hubs.length >= 3);

    /* ================= 1. FINGERS TURN EVERY VIEW ============================
       Driven as real touches (the browser's own touch input), not mouse events. */
    const cdp = await ctx.newCDPSession(page);
    const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i + 1 })) });
    const mid = () => page.evaluate(() => { const r = document.getElementById('ig-gwrap').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const KEY = ['rot', 'rotW', 'rotL', 'rotG', 'rotT'];
    const turned = [];
    for (const v of [0, 1, 2, 3, 4]) {
      await view(v);
      const box = await mid(), c0 = await page.evaluate(k => intel.cam[k], KEY[v]);
      await T('touchStart', [[box.x, box.y]]);
      for (let i = 1; i <= 12; i++) { await T('touchMove', [[box.x + i * 10, box.y + i * 3]]); await page.waitForTimeout(16); }
      await T('touchEnd', []);
      await page.waitForTimeout(200);
      turned.push(Math.abs((await page.evaluate(k => intel.cam[k], KEY[v])) - c0) > 0.3);
    }
    check('1a one finger dragged across the stage turns every one of the five views', turned.every(Boolean), JSON.stringify(turned));
    await view(2);
    /* a finger whose lift the page never heard (a system gesture took it) */
    await page.evaluate(() => { (window._igTouch || (window._igTouch = new Map())).set(987, [10, 10]); });
    { const box = await mid(), c0 = await page.evaluate(() => intel.cam.rotL), z0 = await page.evaluate(() => intel.cam.zoom);
      await T('touchStart', [[box.x, box.y]]);
      for (let i = 1; i <= 12; i++) { await T('touchMove', [[box.x + i * 10, box.y]]); await page.waitForTimeout(16); }
      await T('touchEnd', []); await page.waitForTimeout(200);
      const r = await page.evaluate(() => ({ rotL: intel.cam.rotL, zoom: intel.cam.zoom }));
      check('1b after a lift the page never heard, the next one-finger drag still turns the map (it used to be read as a pinch, and the map stuck until a reload)', Math.abs(r.rotL - c0) > 0.3 && Math.abs(r.zoom - z0) < 0.01, JSON.stringify({ c0, ...r, z0 })); }
    /* two fingers twisting a quarter turn about the middle */
    { const box = await mid(), c0 = await page.evaluate(() => intel.cam.rotL), R = 90;
      const at = t => [[box.x + R * Math.cos(t), box.y + R * Math.sin(t)], [box.x - R * Math.cos(t), box.y - R * Math.sin(t)]];
      await T('touchStart', at(0));
      for (let i = 1; i <= 12; i++) { await T('touchMove', at(i * Math.PI / 24)); await page.waitForTimeout(16); }
      /* then one finger lifts and the other keeps going */
      const keep = at(Math.PI / 2)[0], c1 = await page.evaluate(() => intel.cam.rotL);
      await T('touchMove', [keep]);
      for (let i = 1; i <= 10; i++) { await T('touchMove', [[keep[0] + i * 10, keep[1]]]); await page.waitForTimeout(16); }
      await T('touchEnd', []); await page.waitForTimeout(200);
      const c2 = await page.evaluate(() => intel.cam.rotL);
      check('1c two fingers twisting on the stage spin the view', Math.abs(c1 - c0) > 0.3, JSON.stringify({ c0, c1 }));
      check('1d and when one of the two lifts, the finger still down carries on turning it', Math.abs(c2 - c1) > 0.3, JSON.stringify({ c1, c2 })); }
    await page.evaluate(() => { const c = intel.cam; c.rot = -1.4; ['rotW', 'rotL', 'rotG', 'rotT', 'tiltW', 'tiltL', 'tiltG', 'tiltT', 'tiltOff'].forEach(k => { c[k] = 0; }); });

    /* ================= 2. EVERY VIEW DRAWS THE WHOLE BOOK ==================== */
    const drawn = await page.evaluate(() => ({ book: state.contracts.length, drawn: IG.nodes.filter(n => n.kind === 'contract').length }));
    check('2a all 179 contracts are on the map, in every view (it used to stop at 120 without a word)', drawn.book === 179 && drawn.drawn === 179, JSON.stringify(drawn));
    await view(2);
    /* how much of the floor's width its contracts cover, as drawn */
    const fl = await page.evaluate(() => {
      const stage = document.getElementById('ig-gwrap').getBoundingClientRect(), by = {};
      IG.nodes.filter(n => n.kind === 'contract').forEach(n => { const r = (n.g.querySelector('circle') || n.g).getBoundingClientRect(); if (!r.width) return; const x = r.left + r.width / 2; (by[n._floor] || (by[n._floor] = [])).push(x); });
      return Object.values(by).filter(xs => xs.length >= 10).map(xs => Math.round((Math.max(...xs) - Math.min(...xs)) / stage.width * 100));
    });
    check('2b on the Floors, each floor\'s contracts spread across most of the floor, not a few thin piles', fl.length >= 3 && fl.every(p => p >= 50), JSON.stringify(fl) + ' % of the stage width');
    await page.screenshot({ path: path.join(OUT, '2b-floors.png') });
    await page.evaluate(() => { intel.timeBy = 'expiry'; rebuildIntelGraph(); });
    await view(4);
    /* the quarter-end crowd: how many of its contracts have a spot of their own */
    const tl = await page.evaluate(() => {
      const crowd = IG.nodes.filter(n => n.kind === 'contract' && n.c && n.c.expiry === '2027-03-31');
      /* the DOT itself — the group's box would include its name label */
      const pts = crowd.map(n => { const r = (n.g.querySelector('circle') || n.g).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, n.hub]; });
      const own = pts.filter((p, i) => pts.every((q, j) => i === j || q[2] !== p[2] || Math.hypot(p[0] - q[0], p[1] - q[1]) >= 5)).length;
      return { crowd: crowd.length, own };
    });
    check('2c on the Timeline, forty contracts ending on the same day are forty dots, each with a spot of its own', tl.crowd >= 40 && tl.own === tl.crowd, JSON.stringify(tl));
    await page.screenshot({ path: path.join(OUT, '2c-timeline.png') });
    await view(3);
    const gc = await page.evaluate(() => Object.values(IG.grid.cells).reduce((a, c) => a + c.n, 0));
    check('2d the Grid counts every contract into its cells', gc === 179, gc);

    /* ================= 3. THE MAP'S OWN LIMIT IS SAID ======================== */
    const note0 = await page.evaluate(() => document.getElementById('ig-note').textContent.replace(/\s+/g, ' '));
    check('3a with the whole book on the map, the head line says nothing about a limit', !/largest of/.test(note0), note0.slice(0, 120));
    /* a bigger book, lent to this page only: copies of the contracts already here, never saved */
    const big = await page.evaluate(() => { const add = state.contracts.slice(0, 150).map((c, i) => ({ ...c, id: 'MK-X' + i })); state.contracts.push(...add); rebuildIntelGraph(); updateIntelNote();
      return { book: state.contracts.length, drawn: IG.nodes.filter(n => n.kind === 'contract').length, cap: INTEL_CAP, note: document.getElementById('ig-note').textContent.replace(/\s+/g, ' ') }; });
    check('3b past the limit the map draws the largest and the head line says so, with both numbers', big.drawn === big.cap && big.book > big.cap && big.note.includes(`Drawing the ${big.cap} largest of ${big.book} by value`), JSON.stringify(big).slice(0, 200));
    await page.screenshot({ path: path.join(OUT, '3b-limit-said.png') });

    /* ================= 4. EVERY VIEW MOVES, AND ONE BUTTON STILLS IT =========
       Young, 28 Sep 2026: "Why are floor, grid and timeline not on a moving
       state at all times? Floor should be spinning just like brain and the
       others should be moving. Also add a turning/still button like in the
       brain page." Measured with the pointer OFF the map (pointing at it
       holds it, as on the Brain) — on the camera, and on a dot as drawn. */
    await page.evaluate(() => { state.contracts = state.contracts.filter(c => !/^MK-X/.test(c.id)); rebuildIntelGraph(); });
    await page.mouse.move(2, 2);
    const dotAt = () => page.evaluate(() => { const n = IG.nodes.find(x => x.kind === 'contract' && x.g.getBoundingClientRect().width); const r = n.g.querySelector('circle').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; });
    const moves = async (v, key) => { await view(v); const a = await page.evaluate(k => intel.cam[k] || 0, key), d0 = await dotAt(); await page.waitForTimeout(1500);
      const b = await page.evaluate(k => intel.cam[k] || 0, key), d1 = await dotAt(); return { moved: Math.abs(b - a) > 0.02, dot: Math.hypot(d1[0] - d0[0], d1[1] - d0[1]) >= 2, a: +a.toFixed(3), b: +b.toFixed(3), d0, d1 }; };
    const sp = await page.evaluate(() => { const b = document.getElementById('ig-spin'); return b ? { text: b.textContent.trim(), pressed: b.getAttribute('aria-pressed') } : null; });
    check('4a the view bar carries the Brain page\'s button, and at rest it says Turning', !!sp && sp.text === 'Turning' && sp.pressed === 'true', JSON.stringify(sp));
    await (await page.$('.ig-viewbar')).screenshot({ path: path.join(OUT, '4a-turning-button.png') });
    const mB = await moves(0, 'rot'), mF = await moves(2, 'rotL'), mG = await moves(3, 'rotG'), mT = await moves(4, 'rotT');
    check('4b the Brain still turns by itself', mB.moved && mB.dot, JSON.stringify(mB));
    check('4c the Floors now turn by themselves, like the Brain', mF.moved && mF.dot, JSON.stringify(mF));
    /* all the way round (29 Sep 2026: "Make grid and timeline spin fully too"): the same steady turn as the Brain, one way — not a sway that stops and comes back */
    const sameTurn = m => m.moved && m.dot && Math.sign(m.b - m.a) === Math.sign(mB.b - mB.a) && Math.abs((m.b - m.a) / (mB.b - mB.a)) > 0.6 && Math.abs((m.b - m.a) / (mB.b - mB.a)) < 1.6;
    check('4d the Grid turns by itself, all the way round at the Brain\'s own rate', sameTurn(mG), JSON.stringify(mG));
    check('4e the Timeline turns by itself, all the way round at the Brain\'s own rate', sameTurn(mT), JSON.stringify(mT));
    if (!sp) { check('4f pressed, it says Still, and the Timeline and the Floors hold still', false, 'there is no Turning button'); check('4g pressed again, it says Turning and the Floors turn again', false, 'there is no Turning button'); }
    else {
    await page.click('#ig-spin');
    const st = await page.evaluate(() => { const b = document.getElementById('ig-spin'); return { text: b.textContent.trim(), pressed: b.getAttribute('aria-pressed') }; });
    await page.mouse.move(2, 2);
    const sT = await moves(4, 'rotT'), sF = await moves(2, 'rotL');
    check('4f pressed, it says Still, and the Timeline and the Floors hold still', st.text === 'Still' && st.pressed === 'false' && !sT.moved && !sT.dot && !sF.moved && !sF.dot, JSON.stringify({ st, sT, sF }));
    await page.click('#ig-spin'); await page.mouse.move(2, 2);
    const again = await moves(2, 'rotL');
    check('4g pressed again, it says Turning and the Floors turn again', again.moved && (await page.evaluate(() => document.getElementById('ig-spin').textContent.trim())) === 'Turning', JSON.stringify(again));
    }

    /* ================= 5. THE HEAD LINE RIDES THE STAGE =======================
       Young, 29 Sep 2026, off a screenshot with the "Grouped by value stream"
       row ringed: "remove the space in the highlighted area and give it to the
       dark screen." */
    /* the head row is Home's own on the map's page since 3 Oct 2026 (#hb-head) */
    const hl = await page.evaluate(() => { const r = id => document.getElementById(id).getBoundingClientRect(), head = (document.getElementById('ig-head') || document.getElementById('hb-head')).getBoundingClientRect(), st = r('ig-gwrap'), n = r('ig-note');
      const note = document.getElementById('ig-note'), b = note.querySelector('b');
      return { headBottom: Math.round(head.bottom), stageTop: Math.round(st.top), inStage: n.left >= st.left && n.top >= st.top && n.right <= st.right && n.bottom <= st.bottom, text: note.textContent.replace(/\s+/g, ' ').trim().slice(0, 60), boldCol: b ? getComputedStyle(b).color : null }; });
    check('5a the dark map starts straight under the tab row — the head line\'s row is the map\'s now', Math.abs(hl.stageTop - hl.headBottom) <= 1, JSON.stringify(hl));
    check('5b the head line is still there, in the map\'s top corner, its words light on the dark', hl.inStage && /Grouped by/.test(hl.text) && hl.boldCol === 'rgb(255, 255, 255)', JSON.stringify(hl));
    await page.screenshot({ path: path.join(OUT, '5-head-line-on-the-stage.png') });
    check('9a no page errors', errors.length === 0, JSON.stringify(errors.slice(0, 3)));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop?.();
    const bad = results.filter(r => !r.pass);
    console.log(`\n${results.length - bad.length}/${results.length} passed`);
    if (bad.length) { console.log('FAILED:'); bad.forEach(r => console.log('  - ' + r.name)); }
    process.exit(bad.length ? 1 : 0);
  }
})();
