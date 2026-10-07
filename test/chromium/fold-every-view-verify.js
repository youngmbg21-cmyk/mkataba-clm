/* Chromium verification: EXPLORER — FOLD ALL IN EVERY VIEW (CELL BUBBLES)
   ============================================================
   Young, 6 Oct 2026: "fold all only works in the brain and wiring tabs but it
   should work across all of them." Picked by name: CELL BUBBLES.

   On Home's Explorer, in Floors, Grid and Timeline, each a real press:
     1. Fold all → every dot is folded away, bubbles are PAINTED (the canvas
        pixel at a bubble's middle, and the press target there is the bubble),
        one per cell, and the button reads Open all.
     2. A press on ONE bubble brings back only its dots.
     3. A view switch keeps the fold.
     4. Open all brings every dot back.
   Photographed folded and open at desktop width and at 1024px.
   Red at the parent: Fold all in these views changes nothing but its words.

   Screenshots go to HATI_SHOT_DIR (or test/chromium/shots/fold-every-view/).
   Run: node test/chromium/fold-every-view-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');
const STREAMS = ['proc', 'sales', 'mfg', 'dist', 'mktg'], STAGES = ['Draft', 'Under Review', 'Signed', 'Signed', 'Declined'];
const NAMES = ['Packaging Film Supply', 'Cold Chain Logistics', 'Distributor Agreement', 'Office Lease', 'Audit Engagement', 'Media Buying'];
/* end dates spread from TODAY over two years (never fixed dates), every
   seventh with none: the timeline's stretches and its no-date strip */
const pad = n => String(n).padStart(2, '0');
const mon = off => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, 15); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-15'; };
const BOOK = FIXTURES.concat(Array.from({ length: 36 }, (_, i) => Object.assign(fixtureContract('MK-FV' + i, NAMES[i % NAMES.length], ['Naivas', 'Bidco', 'Kenafric', 'Twiga'][i % 4],
  STREAMS[i % STREAMS.length], ((i * 37) % 90 + 5) * 1e6, STAGES[(i * 3 + Math.floor(i / 5)) % STAGES.length]), { expiry: i % 7 === 6 ? '' : mon((i * 5) % 24 + 1) })));

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'fold-every-view');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

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
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 6000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* what the stage shows in view v: dots still drawn, bubbles drawn, cells,
     and a bubble's middle in page pixels with what is painted / pressed there */
  const look = v => page.evaluate(v => {
    const G = window.IG; if (!G || !G.contracts) return null;
    const svg = document.getElementById('ig-svg').getBoundingClientRect(), cv = document.getElementById('ig-cv');
    const cells = (G._cells || []).slice().sort((a, b) => b.r - a.r);
    const b = cells.find(x => x.c.kids.length > 1) || cells[0];
    let px = null, hit = null;
    if (b){ const dpr = cv.width / cv.clientWidth; try { px = cv.getContext('2d').getImageData(Math.round(b.x * dpr), Math.round(b.y * dpr), 1, 1).data[3]; } catch (_) { px = -1; }
      const e = document.elementFromPoint(svg.left + b.x, svg.top + b.y); hit = e ? (e.getAttribute('class') || e.tagName) : null; }
    return { dots: G.contracts.filter(n => n._fold < .95).length, total: G.contracts.length, drawn: cells.length,
      size: G.cellsBy && G.cellsBy[v] ? G.cellsBy[v].size : -1, btn: (document.getElementById('ig-foldall') || {}).textContent,
      at: b ? { x: svg.left + b.x, y: svg.top + b.y, key: b.c.k, n: b.c.kids.length } : null, px, hit };
  }, v);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof setView === 'function' && window.state && state.contracts && state.contracts.some(c => c.id === 'MK-FV7'), null, { timeout: 15000 });
    await page.evaluate(() => {
      intel.cam = null; intel.folds = {}; intel.cellOpen = {}; intel.lenses = []; intel.groups = null; intel.groupBy = 'folder'; intel.walk = null; intel.timeBy = 'expiry';
      setView('dashboard'); if (typeof hbSetFace === 'function') hbSetFace('explorer');
    });
    const up = await until(() => window.IG && IG.hubs && IG.hubs.length >= 3 && !!document.getElementById('ig-foldall'));
    check('0 Home\'s Explorer is up with Fold all on the stage', !!up);
    await page.evaluate(() => { if (typeof igSetSpin === 'function') igSetSpin(false); });

    const VIEWS = [[2, 'floors'], [3, 'grid'], [4, 'timeline']];
    for (let k = 0; k < VIEWS.length; k++){
      const [v, name] = VIEWS[k];
      await page.click(`[data-ig-view="${v}"]`);
      await until(i => intel.cam.w[i] > 0.98, v);
      if (k === 0){
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT, `${name}-open-1500.png`) });
        await page.click('#ig-foldall');
      }
      /* folded (by the button on the first view; kept from it on the others) */
      const folded = await until(i => window.IG && IG.contracts.every(n => n._fold > .95) && (IG._cells || []).length ? 1 : 0, v);
      await page.waitForTimeout(300);
      const L = await look(v);
      check(`${name} 1 ${k ? 'the fold is KEPT after the switch' : 'Fold all'}: every dot folded away`, folded && L && L.dots === 0, JSON.stringify(L && { dots: L.dots, total: L.total }));
      check(`${name} 2 one bubble per cell is drawn, and the button reads Open all`, L && L.drawn === L.size && L.size > 0 && /Open all/.test(L.btn || ''), JSON.stringify(L && { drawn: L.drawn, size: L.size, btn: L.btn }));
      check(`${name} 3 the bubble is painted and is what a press there reaches`, L && L.px > 0 && /ig-bub-cell/.test(L.hit || ''), JSON.stringify(L && { px: L.px, hit: L.hit }));
      await page.screenshot({ path: path.join(OUT, `${name}-folded-1500.png`) });
      /* press ONE bubble */
      if (L && L.at){
        await page.mouse.click(L.at.x, L.at.y);
        const one = await until(key => { const G = window.IG; const c = G && G.cellsBy && [...G.cellsBy[intel.cam.view].values()].find(x => x.k === key);
          if (!c) return 0; const back = G.contracts.filter(n => n._fold < .05); return back.length === c.kids.length && back.every(n => c.kids.includes(n)) ? back.length : 0; }, L.at.key);
        check(`${name} 4 a press on one bubble brings back only its ${L.at.n} dots`, one === L.at.n, String(one));
        const btn = await page.evaluate(() => document.getElementById('ig-foldall').textContent);
        check(`${name} 5 with one bubble open the button offers Fold all again`, /Fold all/.test(btn), btn);
        await page.screenshot({ path: path.join(OUT, `${name}-one-open-1500.png`) });
      } else check(`${name} 4 a bubble to press`, false, 'none drawn');
    }
    /* Open all */
    await page.click('#ig-foldall'); // fold the opened timeline bubble back
    await until(() => document.getElementById('ig-foldall').textContent.includes('Open all'));
    await page.click('#ig-foldall');
    const open = await until(() => window.IG && IG.contracts.every(n => n._fold < .05) && !(IG._cells || []).length ? 1 : 0);
    check('6 Open all brings every dot back and draws no bubble', !!open);
    await page.screenshot({ path: path.join(OUT, 'timeline-open-1500.png') });
    /* Brain still folds into its groups' bubbles */
    await page.click('[data-ig-view="0"]'); await until(() => intel.cam.w[0] > 0.98);
    await page.click('#ig-foldall');
    const brain = await until(() => window.IG && IG.hubs.filter(h => h._bubR > 2).length);
    check('7 Brain still folds into one bubble per group', brain >= 3, String(brain));
    await page.click('#ig-foldall');

    /* 1024px: the same, photographed */
    await page.setViewportSize({ width: 1024, height: 768 });
    for (const [v, name] of [[2, 'floors'], [3, 'grid'], [4, 'timeline']]){
      await page.click(`[data-ig-view="${v}"]`).catch(() => {});
      await until(i => intel.cam.w[i] > 0.98, v);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, `${name}-open-1024.png`) });
      const t = await page.evaluate(() => document.getElementById('ig-foldall').textContent);
      if (/Fold all/.test(t)) await page.click('#ig-foldall');
      const f = await until(() => window.IG && IG.contracts.every(n => n._fold > .95) && (IG._cells || []).length ? (IG._cells || []).length : 0);
      check(`1024 ${name}: Fold all folds it at the narrower width`, f > 0, String(f));
      await page.screenshot({ path: path.join(OUT, `${name}-folded-1024.png`) });
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})();
