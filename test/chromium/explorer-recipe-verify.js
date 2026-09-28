/* Chromium verification: EXPLORER — THE VIEW RECIPE
   ============================================================
   Young, 28 Sep 2026, off a screenshot where "divide the floors by payment
   terms" was answered as a reading of one contract: "copilot has
   limitations… Let's go with this" — one recipe for everything the map
   shows, one list of facts usable in every role, Copilot deciding instead of
   word lists, asking back, follow-ups and undo, a grid and a timeline, saved
   views, and a phrase book.

   Every claim here is a real sentence typed into the panel and a real press,
   measured as what the map now holds and draws. Waits ask for the state,
   bounded. Red at the parent (b2586354): the question reaches no floors,
   there is no grid, timeline, undo, ask-back or saved view.

   Screenshots go to test/chromium/shots/explorer-recipe/ (or HATI_SHOT_DIR).
   Run: node test/chromium/explorer-recipe-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-recipe');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
/* A book with the facts the recipe reads: payment terms, liability caps,
   governing law and expiry dates, over five streams and every stage. */
const ST = ['proc', 'sales', 'mfg', 'dist', 'mktg'], SG = ['Draft', 'Under Review', 'Signed', 'Signed', 'Declined'];
const PT = ['30 days', '30 days', '60 days', '90 days', '45 days'], LC = ['capped', 'uncapped', 'capped', 'unclear', 'capped'], GL = ['Kenya', 'Kenya', 'England', 'Sweden', 'Kenya'];
const BOOK = FIXTURES.concat(Array.from({ length: 40 }, (_, i) => {
  const c = fixtureContract('MK-RC' + i, ['Packaging Film Supply', 'Cold Chain Logistics', 'Distributor Agreement', 'Office Lease'][i % 4], ['Naivas', 'Bidco', 'Kenafric', 'Twiga'][i % 4],
    ST[i % 5], ((i * 37) % 90 + 5) * 1e6, SG[i % 5]);
  c.metadata = Object.assign({}, c.metadata || {}, { paymentTerms: PT[i % 5], liabilityCapped: LC[(i * 3) % 5], governingLaw: GL[(i * 7) % 5] });
  c.expiry = ['2026-12-31', '2027-03-31', '2027-09-30', '2028-06-30'][i % 4];
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
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 7000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* typed and sent as a reader does, then waited on until the panel answers */
  const ask = async q => { const n = await page.evaluate(() => intel.history.length);
    await page.fill('#igd-input', q); await page.click('#igd-go');
    await until(k => !intel.busy && intel.history.length >= k + 2, n); await page.waitForTimeout(300); };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-RC7'), null, { timeout: 15000 });
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igViews'); } catch (_) {} intel.cam = null; intel.tab = 'map'; setView('intel'); });
    await until(() => window.IG && IG.hubs && IG.hubs.length >= 3);

    /* ================= 1. THE QUESTION THAT STARTED IT ======================= */
    await ask('divide the floors by payment terms');
    const f1 = await until(() => intel.cam.w[2] > 0.95 && IG.floors ? { floorsBy: intel.floorsBy, floors: IG.floors.map(f => f.label), note: document.getElementById('ig-note').textContent.replace(/\s+/g, ' ').trim(), said: intel.history[intel.history.length - 1].text } : null);
    check('1a "divide the floors by payment terms" makes the floors the payment-terms bands, in order, on the Floors view', !!f1 && f1.floorsBy === 'payterms' && f1.floors[0] === '0–30 days' && f1.floors.includes('No payment terms') && f1.floors[f1.floors.length - 1] === 'No payment terms', JSON.stringify(f1 && f1.floors));
    check('1b the head line reads the recipe back, and the answer says what was done', !!f1 && /floors by payment terms/.test(f1.note) && /Floors by payment terms/.test(f1.said), f1 && f1.note);
    check('1c and it spent nothing: no Copilot call was made for it', !!f1 && !/Copilot error|needs an API key/.test(f1.said));
    await page.screenshot({ path: path.join(OUT, '1-floors-by-payment-terms.png') });

    /* ================= 2. THE GRID ============================================ */
    await ask('streams against stages');
    const g = await until(() => intel.cam.w[3] > 0.95 ? { cols: IG.cols.map(c => c.label), rows: IG.floors.map(f => f.label), cells: Object.values(IG.grid.cells).reduce((a, c) => a + c.n, 0), total: IG.contracts.length } : null);
    check('2a "streams against stages" draws the grid: streams across, stages down, and every contract in exactly one cell', !!g && g.cols.length >= 5 && g.rows.length === 4 && g.cells === g.total, JSON.stringify(g));
    check('2b the Grid button says it is the view showing', await page.evaluate(() => document.querySelector('[data-ig-view="3"]').getAttribute('aria-pressed') === 'true'));
    await page.screenshot({ path: path.join(OUT, '2-grid.png') });

    /* ================= 3. THE TIMELINE ======================================== */
    await ask('timeline by expiry');
    const t = await until(() => intel.cam.w[4] > 0.95 ? { key: IG.tl.key, ticks: IG.tl.ticks.length, lanes: IG.tl.lanes.length, undated: IG.tl.undated } : null);
    check('3a "timeline by expiry" lays the contracts along their expiry dates, one lane per group, with dates on the axis', !!t && t.key === 'expiry' && t.ticks >= 3 && t.lanes >= 3, JSON.stringify(t));
    await page.screenshot({ path: path.join(OUT, '3-timeline.png') });

    /* ================= 4. ASK BACK, AND UNDO ================================== */
    const before = await page.evaluate(() => intel.recipeStack.length);
    await ask('payment terms');
    const ab = await page.evaluate(() => [...document.querySelectorAll('#ig-dock [data-ig-choice]')].map(b => b.textContent.trim()));
    check('4a an unclear request answers with presses, and changes nothing', ab.length === 3 && /Floors by payment terms/.test(ab.join('|')) && (await page.evaluate(() => intel.recipeStack.length)) === before, JSON.stringify(ab));
    await page.screenshot({ path: path.join(OUT, '4-ask-back.png') });
    const btn = await page.$('#ig-dock [data-ig-choice$=":2"]');
    if (btn) await btn.click();
    const col = await until(() => intel.colourBy === 'payterms' ? intel.colourBy : null);
    check('4b pressing "Coloured by payment terms" does it', col === 'payterms', col);
    await page.click('#ig-undo');
    const undone = await until(() => intel.colourBy == null ? 'undone' : null);
    check('4c Undo on the head line takes it back', undone === 'undone');

    /* ================= 5. FOLLOW-UPS ========================================== */
    await ask('only Sales');
    const s1 = await page.evaluate(() => intelActive().ids ? intelActive().ids.size : 0);
    await ask('of those, only the ones in review');
    const s2 = await page.evaluate(() => ({ n: intelActive().ids ? intelActive().ids.size : 0, all: [...(intelActive().ids || [])].every(id => { const c = getContract(id); return c.status === 'Under Review' && c.folder === 'sales'; }) }));
    check('5a "of those, only the ones in review" narrows what is showing instead of starting again', s1 > s2.n && s2.n >= 1 && s2.all, JSON.stringify({ s1, s2 }));
    await ask('show everything');

    /* ================= 6. SAVED VIEWS ========================================= */
    await ask('floors by governing law');
    await ask('save this view as Law floors');
    const chip = await until(() => { const b = document.querySelector('#ig-dock [data-ig-saved="Law floors"]'); return b ? b.textContent.trim() : null; });
    check('6a "save this view as Law floors" keeps it, and a press on its chip is there', chip === 'Law floors', chip);
    await ask('floors by owner');
    await page.click('#ig-dock [data-ig-saved="Law floors"]');
    const back = await until(() => intel.floorsBy === 'law' ? intel.floorsBy : null);
    check('6b pressing the saved view brings its recipe back', back === 'law', back);
    await page.screenshot({ path: path.join(OUT, '6-saved-view.png') });

    /* ================= 7. A WORDING QUESTION IS NOT THE MAP'S ================ */
    const map0 = await page.evaluate(() => JSON.stringify({ f: intel.floorsBy, g: intel.groupBy, l: intel.lenses.length }));
    await page.evaluate(async () => { await intelMapLocal('What does MK-A1 say about liability?').then(r => { window._igLocal = r; }); });
    const loc = await page.evaluate(() => window._igLocal);
    const map1 = await page.evaluate(() => JSON.stringify({ f: intel.floorsBy, g: intel.groupBy, l: intel.lenses.length }));
    check('7a a question about what a contract says is passed on untouched by the reader, and the map does not move', loc === null && map0 === map1, JSON.stringify({ loc, map0, map1 }));
    check('7b no page errors', errors.length === 0, JSON.stringify(errors.slice(0, 3)));
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
