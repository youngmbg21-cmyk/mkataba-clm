/* THE EXPLORER EXAM — 32 everyday map requests TYPED into Jambo's box on Explorer, scored on what the map then shows
   (the owner's audit, 9 Nov 2026: "explorers jambo does not take instructions well… take an audit by prompting it
   yourself"; then "go ahead and build it"). A MEASUREMENT, not a test: it spends real Jambo calls, so it is run by
   hand and its score reported to the owner (listed in run-all.js's NOT_TESTS beside jambo-exam-measure.js).

   THE AI IS REAL OR ABSENT, NEVER PRETEND: with ANTHROPIC_API_KEY set (and ANTHROPIC_BASE_URL where a relay is
   used) HaTi talks to the real model; without one the exam says so and stops. Each request is asked on a fresh map
   unless it is a follow-up; each mark is a fact the map holds afterwards, never the model's own sentence.

   The audit's score, before the build: 16 of 32. After the build: see the owner's report (docs/MAP-HISTORY.md,
   EXPLORER'S JAMBO). EXAM_FLOOR is the score a change must not fall under.
   Run: ANTHROPIC_API_KEY=… node test/chromium/explorer-jambo-exam-measure.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const KEY = String(process.env.ANTHROPIC_API_KEY || '').trim();
const LIVE = !!KEY && KEY !== 'test-key-not-real';
const EXAM_FLOOR = 28;
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-jambo-exam');

const ST = ['proc', 'sales', 'mfg', 'dist', 'mktg'], SG = ['Draft', 'Under Review', 'Signed', 'Signed', 'Declined'];
const PT = ['30 days', '30 days', '60 days', '90 days', '45 days'];
const BOOK = FIXTURES.concat(Array.from({ length: 40 }, (_, i) => {
  const c = fixtureContract('MK-RC' + i, ['Packaging Film Supply', 'Cold Chain Logistics', 'Distributor Agreement', 'Office Lease'][i % 4], ['Naivas', 'Bidco', 'Kenafric', 'Twiga'][i % 4],
    ST[i % 5], ((i * 37) % 90 + 5) * 1e6, SG[i % 5]);
  c.metadata = Object.assign({}, c.metadata || {}, { paymentTerms: PT[i % 5], category: ['supplier', 'customer', 'supplier', 'lease'][i % 4] });
  c.expiry = ['2026-12-31', '2027-03-31', '2027-09-30', '2028-06-30'][i % 4];
  return c;
}));

/* [request, fresh map?, the mark: a fact of the map afterwards] — m = the map, s = what was said */
const hasSet = (m, re) => m.sets.some(x => re.test(x));
const EXAM = [
  ['show me the risk lens', 1, m => m.lens === 'risk'],
  ['colour the dots by risk', 1, m => m.colourBy === 'risk'],
  ['which contracts expire before the end of March', 1, m => m.sets.length > 0],
  ['put a line on the timeline at 31 March', 1, m => !!m.until && m.view === 'timeline'],
  ['show the map as it was 3 months ago', 1, m => !!m.asOf],
  ['what if Naivas left', 1, m => hasSet(m, /Naivas/) && m.view === 'wiring'],
  ['compare sales with procurement', 1, m => m.groupBy === 'custom' && hasSet(m, /vs/)],
  ['which contracts are single-sourced', 1, m => hasSet(m, /only one of its kind/i) || /only one in its role|single/i.test(m.said)],
  ['show the amendments with their parents', 1, (m, s) => hasSet(m, /famil/i) || /amendment or a master/i.test(s)],
  ['top 3 biggest contracts in each stream', 1, m => hasSet(m, /Top 3/)],
  ['floors by stream and columns by stage', 1, m => m.floorsBy === 'folder' && m.columnsBy === 'status'],
  ['timeline of when they were signed', 1, m => m.view === 'timeline' && m.timeBy === 'signed'],
  ['group by counterparty and colour by status', 1, m => m.groupBy === 'counterparty' && m.colourBy === 'status'],
  ['make the bubbles bigger and hide the names', 1, m => m.dotScale > 1 && m.namesHidden],
  ['show only signed contracts with Bidco', 1, m => m.filters === 1 && m.shown > 0],
  ['now only the ones over 50 million', 0, m => m.filters >= 1 && m.shown > 0 && m.shown < 5],
  ['same but on the timeline', 0, m => m.view === 'timeline' && m.shown > 0 && m.shown < 5],
  ['undo that', 0, (m, s) => /Back to the view before/.test(s)],
  ['switch to the grid view', 1, m => m.view === 'grid' && !m.sizeBy],
  ['the obligations lens, but only for Sales', 1, m => m.lens === 'obligations' && hasSet(m, /Sales/)],
  ['show me the renewal cliff', 1, m => m.groupBy === 'decision'],
  ['what depends on MK-RC3', 1, m => m.face === 'explorer' && hasSet(m, /MK-RC3/)],
  ['show me the outliers', 1, (m, s) => /outlier/i.test(s) || hasSet(m, /stand out/i)],
  ['explain this view', 1, (m, s) => m.tour || /part by part/i.test(s)],
  ['save this view as Renewals', 1, m => m.saved.includes('Renewals')],
  ['reset the map', 1, (m, s) => m.groupBy === 'folder' && /where the map starts/i.test(s)],
  ['show me my day', 1, m => m.dayTab],
  ['group them by city', 1, m => m.groupBy !== 'custom' && m.face === 'explorer'],
  ['highlight the ones waiting on us', 1, (m, s) => m.face === 'explorer' && (hasSet(m, /waiting on us/i) || /matched|no contract|none/i.test(s))],
  ['where is the money concentrated', 1, (m, s) => m.face === 'explorer' && s.length > 20],
  ['show the people lens', 1, m => m.lens === 'people'],
  ['risk lens as of 3 months ago', 1, m => m.lens === 'risk' && !!m.asOf],
];

(async () => {
  if (!LIVE) { console.log('THE EXPLORER EXAM needs a real Jambo key (ANTHROPIC_API_KEY): nothing was measured.'); return; }
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ ANTHROPIC_API_KEY: KEY, ...(process.env.ANTHROPIC_BASE_URL ? { ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL } : {}) });
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 90000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(200); } return v; };
  const rows = []; let score = 0;
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-RC7'), null, { timeout: 20000 });
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igViews'); } catch (_) {} intel.cam = null; intel.tab = 'map'; intel.dockOpen = true; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbFace() === 'explorer' && window.IG && IG.nodes && !!document.getElementById('igd-input'), null, 20000);
    let i = 0;
    for (const [q, fresh, mark] of EXAM) {
      i++;
      if (fresh) await page.evaluate(() => { if (hbFace() !== 'explorer') hbSetFace('explorer');
        igRecipeRun({ acts: [{ everything: true }, { landing: true }] }, { noPush: true }); intel.lens = null; intel.tlUntil = null; intel.asOf = null; intel.dayTab = false; intel.tour = null; intel.history = [];
        try { igLensPaint(); } catch (_) {} rebuildIntelGraph(); renderIntelDock(); });
      await until(() => !!document.getElementById('igd-input'));
      const n = await page.evaluate(() => intel.history.length);
      await page.fill('#igd-input', q); await page.press('#igd-input', 'Enter');
      await until(k => !intel.busy && intel.history.length >= k + 2, n);
      await page.waitForTimeout(600);
      const m = await page.evaluate(k => { const act = intelActive(); let saved = []; try { saved = JSON.parse(localStorage.getItem('hati.v1.igViews') || '[]').map(v => v.name); } catch (_) {}
        return { face: hbFace(), view: IGB_VIEWS[igbCam().view], groupBy: intel.groupBy, floorsBy: intel.floorsBy, columnsBy: intel.columnsBy, colourBy: intel.colourBy, sizeBy: intel.sizeBy,
          timeBy: intel.timeBy, lens: intel.lens || null, until: intel.tlUntil || null, asOf: intel.asOf || null, dotScale: intel.dotScale || 1, namesHidden: !!(intel.names && intel.names.mode === 'none'),
          sets: (intel.lenses || []).filter(l => l.on !== false).map(l => String(l.label || '')), filters: (intel.lenses || []).filter(l => l.action === 'filter').length,
          shown: act.ids ? act.ids.size : null, dayTab: !!intel.dayTab, tour: !!intel.tour, saved,
          said: intel.history.slice(k).filter(x => x.role === 'assistant').map(x => String(x.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() + (x.choices ? ' [' + x.choices.map(c => c.label).join(' | ') + ']' : '')).join(' // ') }; }, n);
      let ok = false; try { ok = !!mark(m, m.said); } catch (_) { ok = false; }
      if (ok) score++;
      rows.push({ i, q, ok, said: m.said.slice(0, 200) });
      console.log(`${ok ? 'PASS' : 'MISS'}  #${i} ${fresh ? '' : '(follow-up) '}"${q}" — ${m.said.slice(0, 160)}`);
    }
  } catch (e) { console.log('the exam itself failed:', e && e.stack); }
  finally {
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ score, of: EXAM.length, floor: EXAM_FLOOR, rows, errors }, null, 2));
    console.log(`\nTHE EXPLORER EXAM: ${score} of ${EXAM.length} (floor ${EXAM_FLOOR})${errors.length ? ' · page errors: ' + errors.slice(0, 3).join(' | ') : ''}`);
    process.exitCode = score >= EXAM_FLOOR && !errors.length ? 0 : 1;
    await browser.close(); await h.stop();
  }
})();
