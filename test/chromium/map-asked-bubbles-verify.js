/* Chromium verification: BIG BUBBLES ONLY WHEN ASKED, NAMES ONLY BESIDE THE
   CONTRACTS (Young, 4 Oct 2026, after five screenshots of a cluttered map)
   ============================================================
     1. a group the map folds by itself draws NO bubble; one a person folds
        does, and a group of one contract never does;
     2. "fold all Juno contracts into one bubble" draws ONE bubble across the
        groups and leaves the grouping alone; pressing it opens it;
     3. customer names stay off the edges of Floors until asked, and edge
        names never sit on each other;
     4. "remove customer names", "the bubbles need to be small", "remove the
        grouping" and "reset" do what they say;
     5. Copilot's map answer carries the look, and a sentence claiming what
        the map did not do is not printed;
     6. a place kept by the older map comes back as the starting view, once;
     7. the board's "Ask Copilot" puts the question in the panel on the page
        and never opens the chat window outside it.
   Waits ask for the state, bounded; a missing feature reports rather than
   times out. Screenshots go to test/chromium/shots/map-asked-bubbles/.
   Run: node test/chromium/map-asked-bubbles-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'map-asked-bubbles');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const NAMES = ['Naivas Supermarkets', 'Kabras Sugar', 'Ramogi Distributors', 'Wilmar East Africa', 'Kevian Kenya', 'Statpack Industries',
  'Apex Logistics', 'Bullion Packaging', 'Chui Foods', 'Senator Transport', 'Wasoko', 'Twiga Foods', 'Bidco Africa', 'Kenafric Industries',
  'Unilever Kenya', 'Safaricom PLC', 'Coast Motors', 'Quickmart', 'Serena Group', 'Nandi Dairy', 'Brookside Dairy', 'Mumias Sugar'];
const BOOK = FIXTURES.concat(NAMES.flatMap((n, i) => Array.from({ length: 1 + (i % 3) }, (_, j) =>
  fixtureContract('MK-B' + i + '-' + j, 'Supply ' + i + '-' + j, n, ['proc', 'sales'][(i + j) % 2], (i + 1) * 1e6, ['Signed', 'Draft', 'Under Review'][(i + j) % 3]))))
  /* Juno sits in two value streams: a bundle must cross them */
  .concat([fixtureContract('MK-J1', 'Juno one', 'Juno Logistics Ltd', 'proc', 2e6, 'Signed'),
    fixtureContract('MK-J2', 'Juno two', 'Juno Logistics Ltd', 'sales', 2e6, 'Signed'),
    fixtureContract('MK-J3', 'Juno three', 'Juno Logistics Ltd', 'sales', 3e6, 'Draft')]);

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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* the folds and fades glide; a reading waits until they have arrived */
  const settled = () => until(() => { const a = IG.hubs.map(h => h.fold).concat(IG.contracts.map(n => n.bd || 0));
    const ok = window._mabLast && a.length === window._mabLast.length && a.every((v, i) => Math.abs(v - window._mabLast[i]) < 1e-3); window._mabLast = a; return ok; }, null, 6000);
  const ask = q => page.evaluate(q => { const p = igRecipeParse(q); if (!p) return null; igRecipeRun(p); return p.acts; }, q);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(n => window.state && state.contracts && state.contracts.length >= n, BOOK.length, { timeout: 20000 });
    await page.evaluate(() => { intel.cam = null; intel.tab = 'map'; intel.folds = {}; setView('intel'); });
    await until(() => window.IG && IG.hubs && IG.hubs.length >= 2);
    await page.evaluate(() => { igSetSpin && igSetSpin(false); });

    /* ================= 1. ONLY AN ASKED FOLD IS A BUBBLE ================= */
    await page.evaluate(() => { intel.groupBy = 'counterparty'; intel.groups = null; intel.folds = {}; rebuildIntelGraph(); });
    await until(() => IG && IG.hubs && IG.hubs.length >= 20);
    await settled();
    const auto = await page.evaluate(() => ({ folded: IG.hubs.filter(h => h.folded).length, bubbles: IG.hubs.filter(h => h._bubR > 2).length }));
    check('1a a crowded map folds its small groups itself and draws no bubble for them', auto.folded > 0 && auto.bubbles === 0,
      `${auto.folded} groups folded by the map; ${auto.bubbles} bubbles drawn`);
    await page.screenshot({ path: path.join(OUT, '1a-crowded-no-bubbles.png') });
    await ask('fold everything');
    await until(() => IG && IG.hubs && IG.hubs.length >= 20);
    await settled();
    const all = await page.evaluate(() => ({
      many: IG.hubs.filter(h => h.kids.length > 1).length, manyB: IG.hubs.filter(h => h.kids.length > 1 && igHubBubbles(h)).length,
      drawn: IG.hubs.filter(h => h._bubR > 2).length,
      oneB: IG.hubs.filter(h => h.kids.length === 1 && h._bubR > 2).map(h => h.label) }));
    /* the brain draws the groups facing the reader; every group of two or more is a bubble, and some are drawn */
    check('1b "fold everything" makes every group of two or more a bubble', all.many > 0 && all.manyB === all.many && all.drawn > 0, `${all.manyB} of ${all.many}; ${all.drawn} facing the reader drawn`);
    check('1c a group of one contract is never a big bubble', all.oneB.length === 0, all.oneB.slice(0, 4).join(', ') || 'none');

    /* ================= 2. A BUNDLE ACROSS GROUPS ========================= */
    await ask('reset');
    await until(() => intel.groupBy === 'folder' && IG && IG.hubs && IG.hubs.length >= 2);
    await ask('fold all Juno contracts into one bubble');
    await settled();
    const bd = await page.evaluate(() => ({ bundles: (intel.bundles || []).map(b => b.label), drawn: (IG._bundles || []).map(b => ({ n: b.n, r: Math.round(b.r) })),
      groupBy: intel.groupBy, hidden: ['MK-J1', 'MK-J2', 'MK-J3'].every(id => { const n = IG.byId[id]; return n && n._fold > .9; }),
      streams: new Set(['MK-J1', 'MK-J2', 'MK-J3'].map(id => IG.byId[id] && IG.byId[id].hub && IG.byId[id].hub.label)).size }));
    check('2a "fold all Juno contracts into one bubble" draws ONE bubble of three', bd.drawn.length === 1 && bd.drawn[0].n === 3 && bd.drawn[0].r > 10, JSON.stringify(bd.drawn));
    check('2b the bundle crosses the groups and the grouping is untouched', bd.streams >= 2 && bd.groupBy === 'folder' && bd.hidden, `${bd.streams} groups · grouped by ${bd.groupBy} · dots gathered: ${bd.hidden}`);
    await page.screenshot({ path: path.join(OUT, '2a-juno-one-bubble.png') });
    const pressed = await page.evaluate(() => { const c = document.querySelector('#ig-bubs .ig-bub-bundle'); if (!c || c.style.display === 'none') return 'no door';
      c.dispatchEvent(new MouseEvent('click', { bubbles: true })); return (intel.bundles || []).length; });
    check('2c pressing the bundle\'s bubble opens it', pressed === 0, String(pressed));

    /* ================= 3. NAMES ON THE EDGES ONLY WHEN ASKED ============= */
    await page.evaluate(() => { intel.groupBy = 'counterparty'; intel.groups = null; intel.folds = {}; igSetView(2); rebuildIntelGraph(); });
    await until(() => igbCam().w[2] > .98);
    await page.waitForTimeout(300);
    const cps = await page.evaluate(() => [...new Set(state.contracts.map(c => String(c.counterparty || '').toUpperCase()))]);
    const edge0 = await page.evaluate(cps => (IG._edge || []).filter(e => cps.some(n => n && n.startsWith(String(e.t).replace(/…$/, '')))).length, cps);
    check('3a on Floors grouped by customer, no customer name is printed on the edge', edge0 === 0, `${edge0} customer names on the edge`);
    await page.screenshot({ path: path.join(OUT, '3a-floors-no-edge-names.png') });
    await ask('show the customer names on the edges');
    await page.waitForTimeout(300);
    const edge1 = await page.evaluate(cps => { const E = IG._edge || []; let clash = 0;
      for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { const A = E[i], B = E[j]; if (A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h) clash++; }
      return { n: E.filter(e => cps.some(n => n && n.startsWith(String(e.t).replace(/…$/, '')))).length, clash, asked: intel.edgeNames }; }, cps);
    check('3b asked for, the customer names are on the edge', edge1.asked === true && edge1.n > 0, `${edge1.n} names`);
    check('3c no two edge names sit on each other', edge1.clash === 0, `${edge1.clash} overlaps`);
    await page.screenshot({ path: path.join(OUT, '3b-floors-edge-names-asked.png') });

    /* ================= 4. THE OWNER'S PHRASINGS ========================= */
    await page.evaluate(() => { igSetView(0); });
    const p1 = await ask('Remove customer names');
    const s1 = await page.evaluate(() => ({ names: intel.names && intel.names.mode, labelBy: intel.labelBy, lenses: intel.lenses.length }));
    check('4a "Remove customer names" hides the names and adds no lens or label setting', s1.names === 'none' && !s1.labelBy && s1.lenses === 0, JSON.stringify({ p1, s1 }));
    await ask('fold everything'); await settled();
    await ask('The bubbles need to be small'); await settled();
    const s2 = await page.evaluate(() => ({ bubbles: IG.hubs.filter(h => h._bubR > 2).length, dot: intel.dotScale }));
    check('4b "The bubbles need to be small" opens the big bubbles and keeps small dots', s2.bubbles === 0 && s2.dot <= 1, JSON.stringify(s2));
    await ask('fold all Juno contracts into one bubble');
    await ask('remove the grouping');
    const s3 = await page.evaluate(() => ({ g: intel.groupBy, b: intel.bundles, f: Object.values(intel.folds || {}).filter(v => v === 'b').length }));
    check('4c "remove the grouping" goes back to value streams with nothing bundled', s3.g === 'folder' && !s3.b && s3.f === 0, JSON.stringify(s3));
    await ask('make the bubbles bigger'); await ask('show the customer names on the edges');
    await ask('reset');
    const s4 = await page.evaluate(() => ({ g: intel.groupBy, d: intel.dotScale, n: intel.names, e: intel.edgeNames, b: intel.bundles }));
    check('4d "reset" lands on the starting view', s4.g === 'folder' && s4.d === 1 && !s4.n && !s4.e && !s4.b, JSON.stringify(s4));

    /* ================= 5. COPILOT'S MAP ANSWER =========================== */
    const c1 = await page.evaluate(() => { intel.history = []; intelGraphApply('Remove customer names', { look: { names: 'none' }, labelBy: 'counterparty', answer: 'I have hidden the customer names.' });
      return { names: intel.names && intel.names.mode, labelBy: intel.labelBy, said: intel.history.map(m => String(m.text)).join(' | ') }; });
    check('5a Copilot\'s look is carried out by the map, never as a label setting', c1.names === 'none' && !c1.labelBy, JSON.stringify(c1));
    const c2 = await page.evaluate(() => { intel.history = []; intelGraphApply('make it nicer', { answer: 'I have hidden the names and grouped everything by customer.' });
      return intel.history.map(m => String(m.text)).join(' | '); });
    check('5b a sentence claiming what the map did not do is not printed', !/hidden|grouped/i.test(c2) && c2.length > 0, c2);

    /* ================= 6. AN OLD PLACE LANDS ON THE STARTING VIEW ======== */
    const c6 = await page.evaluate(() => { intelPlacePut({ tab: 'map', recipe: { lenses: [], groupBy: 'counterparty', folds: { 'counterparty|Juno Logistics Ltd': true }, dotScale: 2 } });
      const a = { g: intel.groupBy, d: intel.dotScale };
      intelPlacePut({ tab: 'map', recipe: { ...igRecipeNow(), groupBy: 'status' } });
      return { old: a, now: intel.groupBy }; });
    check('6a a place kept by the older map comes back as the starting view', c6.old.g === 'folder' && c6.old.d === 1, JSON.stringify(c6.old));
    check('6b a place kept by this map comes back as it was', c6.now === 'status', c6.now);

    /* ================= 7. ASK COPILOT FROM THE BOARD ===================== */
    await page.evaluate(() => { window._outsideChat = 0; window.openAI = () => { window._outsideChat++; }; intel.dockOpen = true;
      const s = hbS(); s.face = 'board'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board'));
    await page.evaluate(() => hbDig('c:MK-J1'));
    const btn = await until(() => !!document.querySelector('[data-hb-ai]'));
    if (!btn) check('7a the board card carries Ask Copilot', false, 'no [data-hb-ai] button');
    else {
      await page.evaluate(() => { const b = document.getElementById('igd-input'); if (b) b.value = ''; document.querySelector('[data-hb-ai]').click(); });
      const r7 = await until(() => { const b = document.getElementById('igd-input'); return b && b.value ? { v: b.value, focus: document.activeElement === b, out: window._outsideChat } : null; }, null, 3000);
      check('7a the question lands in the Copilot panel on the page, with the contract\'s reference', r7 && /MK-J1/.test(r7.v) && r7.out === 0, JSON.stringify(r7));
      check('7b the chat window outside the page is not opened', r7 && r7.out === 0, r7 ? String(r7.out) : 'no question');
      await page.screenshot({ path: path.join(OUT, '7-ask-in-panel.png') });
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('stage ran', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    const bad = results.filter(r => !r.pass);
    console.log(`\n${results.length - bad.length}/${results.length} passed`);
    process.exit(bad.length ? 1 : 0);
  }
})();
