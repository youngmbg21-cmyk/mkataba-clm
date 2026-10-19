/* ============================================================
   SEGMENT THE CONTRACTS ANY WAY, ON ANY VIEW (owner, 19 Oct 2026)
   ============================================================
   "see that a user can segment the contracts whoever they want and in any
   screen. Currently, per the prompts to explorer in the image attached, it is
   not working accordingly" — the image: "now group the contracts by
   customers" gave a Customers-only filter (2 of 189), "group the contracts by
   ownership" and "who are the parties to these contracts" did not group, on
   the Floors view.
     1  on every view (Brain, Wiring, Floors, Grid, Timeline), in English and
        in Swedish, a request to group — "now group … by customers", "… by
        ownership", "who are the parties to these contracts", "who owns these
        contracts" — groups the whole book by that fact: nothing is filtered
        away, the view stays, and the view's own axis shows the grouping
        (Floors' floors, the Grid's columns, the Timeline's lanes)
     2  a fact with more values than a view has room for keeps its biggest
        groups and puts the rest in ONE bucket that says so ("Other (29
        more)") — never under the last shown name — on the floors, the
        columns and the lanes; every contract counted once
     3  "group by customer and show the names on the edges" does both; floors
        named in the same ask keep their own fact
     4  the head line's Group by dropdown moves Floors' floors too
     5  the Other floor fits the owner's three screens

   Red at the parent: the image's three asks did not group (a filter, nothing,
   nothing); past ten floors the rest stood on the tenth floor under its name;
   the Grid drew 38 columns over each other; the two-part ask only grouped.
   Screenshots go to test/chromium/shots/explorer-segment-any-view/.
   Run: node test/chromium/explorer-segment-any-view-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-segment-any-view');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* a book of 90 contracts over 38 parties (A–Z, then twelve more ending in X), three streams */
const STREAMS = ['proc', 'sales', 'mfg'];
const BOOK = Array.from({ length: 90 }, (_, i) => fixtureContract('MK-S' + i, 'Agreement ' + i,
  'Party ' + String.fromCharCode(65 + (i % 26)) + (i % 30 >= 26 ? 'X' : '') + ' Ltd', STREAMS[i % 3],
  ((i * 37) % 90 + 5) * 1e6, ['Signed', 'Signed', 'Under Review', 'Draft'][i % 4]));
const VIEW = ['Brain', 'Wiring', 'Floors', 'Grid', 'Timeline'];
const ASKS = {
  en: [['now group the contracts by customers', 'counterparty'], ['group the contracts by ownership', 'owner'],
    ['who are the parties to these contracts', 'counterparty'], ['who owns these contracts', 'owner']],
  sv: [['nu gruppera avtalen efter kunderna', 'counterparty'], ['gruppera avtalen efter ägarna', 'owner'],
    ['vilka är parterna i dessa avtal', 'counterparty'], ['vem äger dessa avtal', 'owner']],
};
const OTHER = { en: /^Other \(\d+ more\)$/, sv: /^Övriga \(\d+ till\)$/ };

let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* a fresh panel on the recipe the page opened with, on view v */
  const fresh = v => page.evaluate(([k, R]) => { intel.history = []; intel.tour = null; intel.busy = false; igRecipeSet(R); intel.lenses = [];
    rebuildIntelGraph(); igSetView(k); renderIntelDock(); }, [v, R0]);
  const ask = async q => { const n = await page.evaluate(() => intel.history.length);
    await page.evaluate(t => intelAsk(t), q);
    await until(k => !intel.busy && intel.history.length >= k + 1, n); await page.waitForTimeout(200); };
  /* what the map draws now: the grouping, the view, the axes, what is filtered */
  const seen = () => page.evaluate(() => { const kids = IG.nodes.filter(n => n.kind === 'contract');
    const cnt = a => { const m = {}; kids.forEach(n => { const i = a(n); m[i] = (m[i] || 0) + 1; }); return m; };
    return { view: igbCam().view, groupBy: intel.groupBy, lensesOn: intel.lenses.filter(l => l.on).length, drawn: kids.length,
      floorKey: IG.floorKey, colKey: IG.colKey, hubs: IG.hubs.length,
      floors: (IG.floors || []).map(f => f.label), cols: (IG.cols || []).map(c => c.label), lanes: IG.tl ? IG.tl.lanes.map(l => l.label) : [],
      onFloor: cnt(n => n._floor), onCol: cnt(n => n._col), edgeNames: intel.edgeNames === true, edge: (IG._edge || []).map(e => e.t) }; });
  let R0 = null;
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 50, null, { timeout: 15000 });
    await until(() => state.view === 'counter' || state.view === 'dashboard');
    await page.waitForTimeout(1500);
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igViews'); } catch (_) {} intel.cam = null; intel.tab = 'map'; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbFace() === 'explorer' && window.IG && IG.hubs && IG.hubs.length >= 2 && !!document.getElementById('igd-input'));
    R0 = await page.evaluate(() => igRecipeNow());
    const all = (await seen()).drawn;

    /* ================= 1. EVERY VIEW, BOTH LANGUAGES ================= */
    for (const lang of ['en', 'sv']) {
      await page.evaluate(L => { langSet(L); renderIntel(); }, lang);
      await until(() => hbFace() === 'explorer' && !!document.getElementById('igd-input'));
      for (let v = 0; v < 5; v++) for (const [q, fact] of ASKS[lang]) {
        await fresh(v); await page.waitForTimeout(150);
        await ask(q);
        const s = await seen();
        const axis = v === 2 ? s.floorKey === fact : v === 3 ? (s.colKey === fact || s.hubs < 2) : true;
        check(`1-${lang} ${VIEW[v]} "${q}" groups the whole book by ${fact}, on this view`,
          s.groupBy === fact && s.lensesOn === 0 && s.drawn === all && s.view === v && axis,
          JSON.stringify({ view: s.view, groupBy: s.groupBy, lensesOn: s.lensesOn, drawn: s.drawn, floorKey: s.floorKey, colKey: s.colKey }));
      }
    }
    await page.evaluate(() => { langSet('en'); renderIntel(); });
    await until(() => hbFace() === 'explorer' && !!document.getElementById('igd-input'));

    /* ================= 2. PAST THE ROOM, ONE BUCKET THAT SAYS SO ================= */
    for (const lang of ['en', 'sv']) {
      await page.evaluate(L => { langSet(L); renderIntel(); }, lang);
      await until(() => hbFace() === 'explorer' && !!document.getElementById('igd-input'));
      for (const v of [2, 3, 4]) {
        await fresh(v); await page.waitForTimeout(150);
        await ask(ASKS[lang][0][0]);
        const s = await seen();
        const party = await page.evaluate(() => { const m = {}; IG.nodes.filter(n => n.kind === 'contract').forEach(n => { m[n.id] = { f: n._floor, c: n._col, p: (n.c && n.c.counterparty) || '' }; }); return m; });
        const labels = v === 2 ? s.floors : v === 3 ? s.cols : s.lanes;
        const restAt = labels.findIndex(l => OTHER[lang].test(String(l)));
        const restN = restAt >= 0 ? Number(String(labels[restAt]).match(/\d+/)[0]) : -1;
        const named = labels.filter((l, i) => i !== restAt);
        let wrong = 0;
        if (v !== 4) Object.values(party).forEach(x => { const i = v === 2 ? x.f : x.c; if (i !== restAt && labels[i] !== x.p) wrong++; });
        const sum = v === 2 ? Object.values(s.onFloor).reduce((a, b) => a + b, 0) : v === 3 ? Object.values(s.onCol).reduce((a, b) => a + b, 0) : s.drawn;
        const max = v === 2 ? 10 : 14;
        check(`2-${lang} ${VIEW[v]} by customer: at most ${max}, the rest in one "${lang === 'en' ? 'Other (N more)' : 'Övriga (N till)'}" that counts them, every contract once and under its own name`,
          labels.length <= max && restAt >= 0 && restN === s.hubs - named.length && wrong === 0 && sum === all,
          JSON.stringify({ n: labels.length, rest: labels[restAt], hubs: s.hubs, named: named.length, wrong, sum, all }));
      }
    }
    await page.evaluate(() => { langSet('en'); renderIntel(); });
    await until(() => hbFace() === 'explorer' && !!document.getElementById('igd-input'));

    /* ================= 3. GROUP AND NAME THE EDGES, IN ONE ASK ================= */
    for (const [q, word] of [['group the contracts by customers and show the names on the edges', 'PARTY A LTD'], ['gruppera efter kund och visa namnen på kanterna', 'PARTY A LTD']]) {
      await fresh(2); await page.waitForTimeout(150);
      await ask(q); await page.waitForTimeout(1500);
      const s = await seen();
      check(`3 "${q}" groups by customer AND names the floors`, s.groupBy === 'counterparty' && s.edgeNames && s.floorKey === 'counterparty' && s.edge.includes(word),
        JSON.stringify({ groupBy: s.groupBy, edgeNames: s.edgeNames, floorKey: s.floorKey, edge: s.edge.slice(0, 4) }));
    }

    /* floors named in the same ask keep their fact; the grouping takes the columns */
    await fresh(2); await page.waitForTimeout(150);
    await ask('floors by risk and group by customer');
    { const s = await seen(); check('3c Floors "floors by risk and group by customer": the floors stay by risk, the grouping is customer',
      s.floorKey === 'risk' && s.groupBy === 'counterparty', JSON.stringify({ floorKey: s.floorKey, groupBy: s.groupBy })); }

    /* ================= 4. THE HEAD LINE'S DROPDOWN MOVES THE FLOORS ================= */
    await fresh(2); await page.waitForTimeout(300);
    const dd = await page.evaluate(() => { const s = document.querySelector('#ig-note #ig-group'); if (!s) return null;
      s.value = 'owner'; s.dispatchEvent(new Event('change', { bubbles: true })); return true; });
    await page.waitForTimeout(400);
    { const s = await seen(); check('4 Floors: choosing Owner in the head line\'s Group by makes the floors owners', !!dd && s.groupBy === 'owner' && s.floorKey === 'owner',
      JSON.stringify({ dropdown: !!dd, groupBy: s.groupBy, floorKey: s.floorKey })); }

    /* ================= 5. THE OWNER'S THREE SCREENS ================= */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await fresh(2); await page.waitForTimeout(150);
      await ask('group the contracts by customers and show the names on the edges'); await page.waitForTimeout(1800);
      const s = await seen();
      const fits = await page.evaluate(() => { const cv = document.querySelector('#ig-page canvas'); if (!cv) return null; const r = cv.getBoundingClientRect();
        const e = (IG._edge || []).find(x => /^OTHER \(/.test(x.t)); return e ? { inside: e.x >= -1 && e.y >= -1 && e.x + e.w <= r.width + 1 && e.y + e.h <= r.height + 1 } : { inside: false, missing: true }; });
      check(`5 ${w}×${hh} Floors: the "Other" floor is named and on the stage`, !!fits && fits.inside && s.floors.some(l => OTHER.en.test(l)), JSON.stringify(fits));
      await page.screenshot({ path: path.join(OUT, `${w}x${hh}-floors-other.png`) });
    }
    check('9 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.stack || e.message);
  } finally {
    await browser.close().catch(() => {});
    if (h.stop) await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
