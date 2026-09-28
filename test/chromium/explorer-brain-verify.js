/* Chromium verification: EXPLORER — THE BRAIN DRAWING
   ============================================================
   The owner, 28 Sep 2026, of the approved design: "Built it but start from the
   latest main." Brain, Wiring and Floors views that glide; dragging with the
   mouse turns EVERY view; bundles are cards that fold; every contract a dot
   with small words beside it; and "remove all these filters. the idea is the
   filters should come from asking a question in copilot".

   Every claim is a real press, a real drag or painted pixels: a view is proved
   by its weight settling and its words moving, a turn by a real mouse drag, a
   fold by a real click on the card and the dots gathering, a key by pressing
   it and nothing narrowing. Waits ask for the state, bounded.
   Red at the parent (b2166ade): there is no canvas, no view bar, no fold, and
   a legend press narrows the map.

   Screenshots go to test/chromium/shots/explorer-brain/ (or HATI_SHOT_DIR).
   Run: node test/chromium/explorer-brain-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');
/* A BOOK BIG ENOUGH TO LOOK LIKE ONE, seeded on the server (a copy pushed in
   the page is replaced by the next list refresh): five streams, every stage,
   and one contract (MK-BR7) twelve times the size of its neighbours. */
const STREAMS = ['proc', 'sales', 'mfg', 'dist', 'mktg'], STAGES = ['Draft', 'Under Review', 'Signed', 'Signed', 'Declined'];
const NAMES = ['Packaging Film Supply', 'Cold Chain Logistics', 'Distributor Agreement', 'Office Lease', 'Audit Engagement', 'Media Buying', 'Retail Listing', 'IT Support'];
const BOOK = FIXTURES.concat(Array.from({ length: 40 }, (_, i) => fixtureContract('MK-BR' + i, NAMES[i % NAMES.length], ['Naivas', 'Bidco', 'Kenafric', 'Twiga'][i % 4],
  STREAMS[i % STREAMS.length], ((i * 37) % 90 + 5) * 1e6 * (i === 7 ? 12 : 1), STAGES[i % STAGES.length])));

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-brain');
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
  /* Ask for a state, bounded: returns the last value either way, so a build
     without the feature REPORTS instead of timing out the file. */
  const until = async (fn, arg, ms = 6000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    /* Signed in means the SEEDED book is loaded (before that the page holds a
       demo book behind the sign-in screen). */
    await page.waitForFunction(() => typeof setView === 'function' && window.state && state.contracts && state.contracts.some(c => c.id === 'MK-BR7'), null, { timeout: 15000 });
    await page.evaluate(() => {
      intel.cam = null; intel.folds = {}; intel.lenses = []; intel.groups = null; intel.groupBy = 'folder'; intel.colourBy = null; intel.sizeBy = null; intel.walk = null;
      intel.tab = 'map'; setView('intel');
    });
    await until(() => window.IG && IG.hubs && IG.hubs.length >= 3);

    /* ================= 1. THE STAGE ======================================== */
    const stage = await page.evaluate(() => {
      const w = document.getElementById('ig-gwrap'), cv = document.getElementById('ig-cv'), svg = document.getElementById('ig-svg');
      const r = w.getBoundingClientRect(), c = cv && cv.getBoundingClientRect();
      /* painted pixels on the canvas: count non-transparent samples */
      let lit = 0; try { const x = cv.getContext('2d'), d = x.getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) lit++; } catch (_) { lit = -1; }
      return { cls: w.className, canvas: !!cv && Math.abs(c.width - r.width) < 2 && Math.abs(c.height - r.height) < 2, under: !!cv && !!svg && (cv.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING) > 0,
        lit, bg: getComputedStyle(w).backgroundImage.slice(0, 15), views: [...document.querySelectorAll('[data-ig-view]')].map(b => b.textContent.trim()),
        fold: !!document.getElementById('ig-foldall'), oldHint: /Drag nodes/.test(document.getElementById('content').textContent) };
    });
    check('1a the map is one dark stage with a canvas under the nodes, the full size of the stage', /ig-brain/.test(stage.cls) && stage.canvas && stage.under && /gradient/.test(stage.bg), JSON.stringify(stage));
    check('1b the canvas is painted — the brain\'s tissue and the dots are pixels', stage.lit > 50, stage.lit);
    /* Five views since the view recipe (explorer-recipe-verify): Grid and Timeline joined. */
    check('1c the stage carries Brain · Wiring · Floors · Grid · Timeline, the zoom and Fold all, and no "drag nodes" hint', stage.views.join('|') === 'Brain|Wiring|Floors|Grid|Timeline' && stage.fold && !stage.oldHint, JSON.stringify(stage.views));
    /* every contract has small words where they fit — measured as painted */
    const words = await page.evaluate(() => {
      const tags = IG.contracts.filter(n => n.tag.style.display !== 'none');
      const painted = tags.filter(n => { const r = n.tag.getBoundingClientRect(); const e = document.elementFromPoint(r.left + 8, r.top + 6); return e && n.g.contains(e); });
      const one = tags[0];
      const r0 = one && one.tag.getBoundingClientRect(), e0 = one && document.elementFromPoint(r0.left + 8, r0.top + 6);
      return { shown: tags.length, painted: painted.length, total: IG.contracts.length, text: one ? one.tag.textContent.replace(/\s+/g, ' ').trim() : '', hit: e0 ? e0.tagName + '.' + (e0.getAttribute('class') || '') + '#' + e0.id : null };
    });
    check('1d contracts carry their number, name and value beside the dot, painted on top', words.shown >= 8 && words.painted >= Math.min(8, words.shown) - 1 && /MK-/.test(words.text) && /KES/.test(words.text), JSON.stringify(words));
    await page.screenshot({ path: path.join(OUT, '1-brain.png') });

    /* ================= 2. THE THREE VIEWS GLIDE ============================= */
    for (const [i, name] of [[1, 'wiring'], [2, 'floors'], [0, 'brain']]) {
      const before = await page.evaluate(() => IG.contracts.slice(0, 6).map(n => n.q.slice(0, 2).map(Math.round)));
      await page.click(`[data-ig-view="${i}"]`);
      const mid = await page.evaluate(k => intel.cam.w[k], i);
      const settled = await until(k => intel.cam.w[k] > 0.97 ? intel.cam.w[k] : 0, i);
      const after = await page.evaluate(() => IG.contracts.slice(0, 6).map(n => n.q.slice(0, 2).map(Math.round)));
      const pressed = await page.evaluate(k => document.querySelector(`[data-ig-view="${k}"]`).getAttribute('aria-pressed'), i);
      check(`2${'abc'[[1, 2, 0].indexOf(i)]} ${name}: the view glides there (not a jump), the dots move, and its button says pressed`,
        mid < 0.9 && settled > 0.97 && JSON.stringify(before) !== JSON.stringify(after) && pressed === 'true', JSON.stringify({ mid: +mid.toFixed(2), settled, pressed }));
      await page.screenshot({ path: path.join(OUT, `2-${name}.png`) });
    }

    /* ================= 3. A DRAG TURNS EVERY VIEW =========================== */
    for (const [i, key] of [[0, 'rot'], [1, 'rotW'], [2, 'rotL']]) {
      await page.click(`[data-ig-view="${i}"]`); await until(k => intel.cam.w[k] > 0.97, i);
      const box = await page.evaluate(() => { const r = document.getElementById('ig-gwrap').getBoundingClientRect(); return { x: r.left + 60, y: r.top + 60 }; });
      const r0 = await page.evaluate(k => intel.cam[k], key);
      await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 120, box.y + 10, { steps: 10 }); await page.mouse.up();
      const r1 = await page.evaluate(k => intel.cam[k], key);
      /* the brain also turns slowly by itself; a 120px drag is ~0.72 rad, far past that drift */
      check(`3${'abc'[i]} a real mouse drag turns the ${['Brain', 'Wiring', 'Floors'][i]} view, the side facing you following the mouse`, r0 - r1 > 0.5, `${r0.toFixed(2)} → ${r1.toFixed(2)}`);
    }
    await page.dblclick('#ig-svg', { position: { x: 30, y: 30 } });
    const faced = await page.evaluate(() => ({ rotL: intel.cam.rotL, tiltL: intel.cam.tiltL, zoom: intel.cam.zoom }));
    check('3d a double-click faces the view again', faced.rotL === 0 && faced.tiltL === 0 && faced.zoom === 1, JSON.stringify(faced));
    await page.click('[data-ig-zoom="in"]'); await page.click('[data-ig-zoom="in"]');
    const zv = await page.evaluate(() => ({ z: intel.cam.zoom, t: document.getElementById('ig-zv').textContent }));
    check('3e the zoom buttons zoom, and the readout says by how much', zv.z > 1.3 && zv.t === Math.round(zv.z * 100) + '%', JSON.stringify(zv));
    await page.dblclick('#ig-svg', { position: { x: 30, y: 30 } });

    /* ================= 4. A CARD FOLDS; NOTHING ON THE MAP IS A FILTER ===== */
    await page.click('[data-ig-view="1"]'); await until(() => intel.cam.w[1] > 0.97);
    const hub = await page.evaluate(() => { const g = document.getElementById('ig-gwrap').getBoundingClientRect();
      const hb = IG.hubs.filter(h => h.box && !h.folded && h.kids.length >= 3).sort((a, b) => b.kids.length - a.kids.length)[0]; if (!hb) return null;
      return { label: hb.label, kids: hb.kids.length, x: g.left + hb.box.x + 40, y: g.top + hb.box.y + 12, shown: IG.contracts.length }; });
    if (hub) {
      const under = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return !!(e && e.closest('.ig-hub')); }, hub);
      await page.mouse.click(hub.x, hub.y);
      const gathered = await until(l => { const hb = IG.hubs.find(h => h.label === l); return hb && hb.folded && hb.fold > 0.95 && hb.kids.every(n => n.g.style.display === 'none') ? true : false; }, hub.label);
      const after = await page.evaluate(l => ({ lenses: intel.lenses.length, shown: IG.contracts.length, chev: IG.hubs.find(h => h.label === l).g.getAttribute('aria-expanded') }), hub.label);
      check('4a a real click on a card folds its contracts into it — the dots gather and their words go', under && gathered === true && after.chev === 'false', JSON.stringify({ under, gathered, chev: after.chev }));
      check('4b and it narrows nothing: no lens, the same contracts on the map', after.lenses === 0 && after.shown === hub.shown, JSON.stringify(after));
      await page.screenshot({ path: path.join(OUT, '4-folded.png') });
      await page.mouse.click(hub.x, hub.y);
      const reopened = await until(l => { const hb = IG.hubs.find(h => h.label === l); return hb && !hb.folded && hb.fold < 0.05; }, hub.label);
      check('4c a second click opens it again', reopened === true);
    } else check('4a a card to fold', false, 'no open card with three or more contracts');
    await page.click('#ig-foldall');
    const allFolded = await until(() => IG.hubs.every(h => h.folded) ? document.getElementById('ig-foldall').textContent : '');
    check('4d Fold all folds every card, and the button then offers to open them all', !!allFolded && /Open all/.test(allFolded), allFolded);
    await page.click('#ig-foldall'); await until(() => IG.hubs.every(h => !h.folded));
    await page.evaluate(() => { const b = document.querySelector('#ig-legend [data-ig-legend-fold]'); if (b && b.getAttribute('aria-expanded') === 'false') b.click(); });
    const legendRow = await page.$('#ig-legend [data-igstatus="Draft"]');
    if (legendRow) { await legendRow.click(); await legendRow.click(); }
    const afterLegend = await page.evaluate(() => ({ lenses: intel.lenses.length, tag: (document.querySelector('#ig-legend [data-igstatus="Draft"]') || {}).tagName }));
    check('4e the legend is a key: pressing a status row twice narrows nothing, and the row is not a button', !!legendRow && afterLegend.lenses === 0 && afterLegend.tag === 'DIV', JSON.stringify(afterLegend));

    /* ================= 5. COPILOT STEERS THE MAP ============================ */
    await page.click('[data-ig-view="0"]');
    await page.evaluate(async () => { await intelAsk('Colour by status and size by nothing'); });
    await page.evaluate(async () => { await intelAsk('Colour by payment terms'); });
    const coloured = await until(() => { const lg = document.getElementById('ig-legend'); return IG.colourKey === 'payterms' && lg && /payment terms/i.test(lg.textContent) ? { note: document.getElementById('ig-note').textContent.replace(/\s+/g, ' ').trim(), rows: lg.querySelectorAll('[data-ig-colour]').length } : null; });
    check('5a "colour by payment terms": the dots take the colours, the legend says what they mean, the head line says it was applied', !!coloured && coloured.rows >= 1 && /coloured by payment terms/.test(coloured.note), JSON.stringify(coloured));
    await page.evaluate(async () => { await intelAsk('Which contracts are outliers?'); });
    const outl = await until(() => { const l = intel.lenses.find(x => x.action === 'highlight'); if (!l) return null; const n = IG.contracts.find(c => c.badge);
      return { ids: l.ids, badge: n && n.badge, words: n ? n.tag.textContent : '', open: !!document.querySelector('#ig-dock [data-ig-list]') }; });
    check('5b "outliers": the big one in its stream is ringed with its reason in words, and the answer opens on the Contracts page', !!outl && outl.ids.includes('MK-BR7') && /median value/.test(outl.badge || '') && /median value/.test(outl.words) && outl.open, JSON.stringify(outl));
    await page.screenshot({ path: path.join(OUT, '5-outliers.png') });
    await page.evaluate(async () => { await intelAsk('walk me through them one by one'); });
    /* "them" is what the map has highlighted — here the outliers — so the walk
       visits exactly those, numbered, and the head line says where it is. */
    const walk = await until(() => { const n = document.getElementById('ig-note'); const lit = IG.contracts.filter(c => c._lit >= 0).length, hl = intel.lenses.find(x => x.action === 'highlight');
      return intel.walk && lit >= 1 && lit === intel.walk.ids.length && /Walking \d+ of \d+/.test(n.textContent) ? { lit, ids: intel.walk.ids, same: !!hl && JSON.stringify(intel.walk.ids.slice().sort()) === JSON.stringify(hl.ids.slice().sort()), note: n.textContent.replace(/\s+/g, ' ').trim(), first: (IG.byId[intel.walk.ids[0]].walkNo || {}).textContent } : null; }, null, 9000);
    check('5c "walk me through them": the pulse visits the highlighted set one by one, numbered, and the head line says where it is', !!walk && walk.same && /^1\s/.test(walk.first || '') && /Walking \d+ of \d+/.test(walk.note), JSON.stringify(walk));
    /* and with nothing highlighted, the walk covers what the map shows */
    await page.evaluate(async () => { intel.lenses = []; intel.walk = null; rebuildIntelGraph(); await intelAsk('walk me through them one by one'); });
    const walkAll = await until(() => intel.walk && IG.contracts.filter(c => c._lit >= 0).length >= 2 ? { n: intel.walk.ids.length, max: GRAPH_WALK_MAX, said: /the first \d+ of \d+/.test(intel.history[intel.history.length - 1].text) } : null, null, 9000);
    check('5c2 with nothing highlighted, the walk covers what the map shows, capped and said', !!walkAll && walkAll.n === walkAll.max && walkAll.said, JSON.stringify(walkAll));
    await page.screenshot({ path: path.join(OUT, '5-walk.png') });
    const stopped = await page.evaluate(() => { const b = document.getElementById('ig-walk-stop'); if (b) b.click(); return !intel.walk; });
    check('5d Stop ends the walk', stopped);
    if (await page.$('#ig-clear')) await page.click('#ig-clear');
    const everything = await until(() => intel.lenses.length === 0 && !intel.groups && !document.getElementById('ig-clear') ? IG.contracts.length : 0);
    check('5e Show everything takes every cut off and the way back goes with it', everything >= 40, everything);
    check('5f no page errors', errors.length === 0, JSON.stringify(errors.slice(0, 3)));
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
