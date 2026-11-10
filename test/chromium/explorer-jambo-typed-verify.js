/* Chromium verification: EXPLORER'S JAMBO, TYPED (the owner's audit, 9 Nov 2026: "explorers jambo does not take
   instructions well when trying to ask for certain views in the explorer"; then "go ahead and build it")
   ============================================================
   Every check here TYPES into Jambo's box on Explorer and presses Enter, as a person does — the route the older
   Explorer checks never took (they ask as a chip asks, which goes to the free reader). The AI is the test stand-in,
   scripted per request (h.ai.answerWith), so what is measured is HaTi: the route, the check and the map.

   Red at the parent (65bd18c): 1 (the route dropped the lens), 5c (red at 60d5200: one button, "which did you mean?"), 2 (no date-line step), 3 (the number opened the
   paper), 4 (no second ask), 5 (no two-ways buttons), 6 (the grid came with floors and size nobody asked for),
   7 (the tag read "Naivas excluded" and "Eight contracts" was printed), 8 (the set was cleared before the follow-up),
   9 (no undo step). Waits ask for the state, bounded.

   Screenshots go to test/chromium/shots/explorer-jambo-typed/ (or HATI_SHOT_DIR).
   Run: node test/chromium/explorer-jambo-typed-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-jambo-typed');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const ST = ['proc', 'sales', 'mfg', 'dist', 'mktg'], SG = ['Draft', 'Under Review', 'Signed', 'Signed', 'Declined'];
const BOOK = FIXTURES.concat(Array.from({ length: 20 }, (_, i) => {
  const c = fixtureContract('MK-RC' + i, ['Packaging Film Supply', 'Cold Chain Logistics', 'Distributor Agreement', 'Office Lease'][i % 4], ['Naivas', 'Bidco', 'Kenafric', 'Twiga'][i % 4],
    ST[i % 5], ((i * 37) % 90 + 5) * 1e6, SG[i % 5]);
  c.expiry = ['2026-12-31', '2027-03-31', '2027-09-30', '2028-06-30'][i % 4];
  c.metadata = Object.assign({}, c.metadata || {}, { category: ['supplier', 'customer', 'supplier', 'lease'][i % 4] });
  return c;
}));
const ahead = days => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const LINE_DAY = ahead(120);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* THE SCRIPT: what the stand-in answers each typed request with; a second ask carries HaTi's note */
const asked = [];
const SCRIPT = (q, again) => {
  if (q === 'show me the risk lens') return { note: 'Risk lens', answer: 'Risk lens is on.', look: { lens: 'risk' } };
  if (q === 'put a line on the timeline at the end of the period') return { note: 'x', answer: 'Marked the day on the timeline.', view: 'timeline', steps: [{ do: 'dateLine', date: LINE_DAY, time: 'expiry' }] };
  if (q === 'what depends on MK-RC3') return { note: 'x', answer: '', steps: [{ do: 'linked', id: 'MK-RC3' }] };
  if (q === 'show the people lens') return again ? { note: 'x', answer: '', look: { lens: 'people' } } : { note: 'People', answer: '' };
  if (q === 'show me the money lens') return { note: 'x', answer: '', groupBy: 'status' };
  if (q === 'which contracts are single-sourced') return { note: 'Single-sourced', answer: 'These are the parties with no second supplier.' };
  if (q === 'switch to the grid view') return { note: 'x', answer: '', view: 'grid', floorsBy: 'status', columnsBy: 'folder', sizeBy: 'value', groupBy: 'folder' };
  if (q === 'show Naivas only') return { note: 'Naivas excluded', answer: 'Eight contracts sit with Naivas.', where: { counterparty: ['Naivas'] } };
  if (q === 'now only the signed ones') return { note: 'x', answer: '', within: true, where: { status: ['Signed'] } };
  if (q === 'undo that') return { note: 'x', answer: '', steps: [{ do: 'undo' }] };
  return { note: 'x', answer: '' };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  h.ai.answerWith((tool, body) => {
    if (tool !== 'render_graph') return null;
    const msg = String(((body.messages || [])[0] || {}).content || '');
    const m = msg.match(/User request: "([\s\S]*?)"\n\nRules:/); const full = m ? m[1] : '';
    const q = full.split('\n\n')[0], again = /leaves out/.test(full);
    asked.push({ q, again });
    return SCRIPT(q, again);
  });
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(100); }
    return v; };
  /* TYPED, as a person does: the words in the box, Enter, then wait for the answer */
  const type = async q => {
    const n = await page.evaluate(() => intel.history.length);
    await page.fill('#igd-input', q); await page.press('#igd-input', 'Enter');
    await until(k => !intel.busy && intel.history.length >= k + 2, n);
    await page.waitForTimeout(250);
  };
  const fresh = () => page.evaluate(() => { if (hbFace() !== 'explorer') hbSetFace('explorer');
    igRecipeRun({ acts: [{ everything: true }, { landing: true }] }, { noPush: true }); intel.lens = null; intel.tlUntil = null; intel.history = []; intel.recipeStack = [];
    try { igLensPaint(); } catch (_) {} rebuildIntelGraph(); renderIntelDock(); });
  const lastSaid = () => page.evaluate(() => { const m = intel.history.filter(x => x.role === 'assistant').pop(); return m ? String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''; });
  const shot = name => page.screenshot({ path: path.join(OUT, name + '.png') });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-RC7'), null, { timeout: 15000 });
    await page.evaluate(() => { intel.cam = null; intel.tab = 'map'; intel.dockOpen = true; setView('dashboard'); hbSetFace('explorer'); });
    const ready = await until(() => hbFace() === 'explorer' && window.IG && IG.nodes && !!document.getElementById('igd-input') && igTalkFirst());
    check('0 Explorer is up, and words typed in Jambo\'s box go to the AI (igTalkFirst)', !!ready);

    /* ================= 1. THE LENS ARRIVES ================= */
    await fresh(); await type('show me the risk lens');
    const l1 = await until(() => intel.lens === 'risk' ? intel.lens : null);
    check('1 "show me the risk lens" puts the Risk lens on (the route kept it)', l1 === 'risk', l1);
    await shot('1-risk-lens');

    /* ================= 2. A DATE LINE, AS A STEP ================= */
    await fresh(); await type('put a line on the timeline at the end of the period');
    const l2 = await until(d => intel.tlUntil === d && igbCam().view === 4 && IG.tl && IG.tl.until ? { at: intel.tlUntil, n: IG.tl.until.n } : null, LINE_DAY);
    check('2a the date line is drawn on the Timeline at the day Jambo named', !!l2, JSON.stringify(l2));
    const s2 = await lastSaid();
    check('2b HaTi says it in its own words, and Jambo\'s "Marked the day…" is left out', /Timeline|up to|expiry/i.test(s2) && !/Marked the day/.test(s2), s2);
    await shot('2-date-line');

    /* ================= 3. A NUMBER IN A SENTENCE STAYS ON THE MAP ================= */
    await fresh(); await type('what depends on MK-RC3');
    const l3 = await until(() => hbFace() === 'explorer' && intel.lenses.some(l => /MK-RC3/.test(l.label)) ? { face: hbFace(), lens: intel.lenses.map(l => l.label) } : null);
    check('3 "what depends on MK-RC3" stays on Explorer and shows what is tied to it', !!l3, JSON.stringify(l3 || await page.evaluate(() => hbFace())));

    /* ================= 4. THE GAP GOES BACK ONCE ================= */
    await fresh(); asked.length = 0; await type('show the people lens');
    const l4 = await until(() => intel.lens === 'people' ? 'people' : null);
    const tries = asked.filter(a => a.q === 'show the people lens');
    check('4 a reply that left the lens out is sent back ONCE, named, and the lens goes on', l4 === 'people' && tries.length === 2 && tries[1].again, JSON.stringify(tries));

    /* ================= 5. STILL TWO WAYS: THE READER PICKS ================= */
    await fresh(); await type('show me the money lens');
    const c5 = await until(() => { const m = intel.history[intel.history.length - 1]; return m && m.choices ? m.choices.map(c => c.label) : null; });
    const map5 = await page.evaluate(() => ({ group: intel.groupBy, lens: intel.lens }));
    check('5a still left out after the second ask: two buttons, the map unchanged', !!c5 && c5.length === 2 && map5.group === 'folder' && !map5.lens, JSON.stringify({ c5, map5 }));
    await shot('5-two-ways');
    const b5 = await page.$('#ig-dock [data-ig-choice$=":0"]');
    if (b5) await b5.click();
    const l5 = await until(() => intel.lens === 'money' ? 'money' : null);
    check('5b pressing the first does what the words said', l5 === 'money', l5);

    /* ================= 5c. NOTHING TO CHOOSE BETWEEN (the owner's exam, 10 Nov 2026) =================
       the AI's answer does nothing on the map, twice; the free reader read the whole sentence: it is carried out, no question */
    await fresh(); await type('which contracts are single-sourced');
    const l5c = await until(() => { const m = intel.history[intel.history.length - 1]; return m && !intel.busy ? { sole: intel.lenses.some(l => l.kind === 'sole'), choices: !!(m.choices && m.choices.length), said: String(m.text || '').replace(/<[^>]+>/g, ' ').trim() } : null; });
    check('5c "which contracts are single-sourced" with an AI answer that does nothing: lit at once, no "which did you mean?"', !!l5c && l5c.sole && !l5c.choices && !/two ways/.test(l5c.said), JSON.stringify(l5c));

    /* ================= 6. CHANGE ONLY WHAT WAS ASKED ================= */
    await fresh(); await type('switch to the grid view');
    const l6 = await until(() => igbCam().view === 3 ? { floors: intel.floorsBy, cols: intel.columnsBy, size: intel.sizeBy } : null);
    check('6 "switch to the grid view" switches the view and adds no floors, columns or size nobody asked for', !!l6 && !l6.floors && !l6.cols && !l6.size, JSON.stringify(l6));

    /* ================= 7. HaTi NAMES THE SET; A COUNT IN WORDS IS CHECKED ================= */
    await fresh(); await type('show Naivas only');
    const l7 = await until(() => { const l = intel.lenses.find(x => x.action === 'filter'); return l ? { label: l.label, n: l.ids.length } : null; });
    const s7 = await lastSaid();
    check('7a the tag says what the map applied ("Naivas"), never the model\'s "Naivas excluded"', !!l7 && l7.label === 'Naivas', JSON.stringify(l7));
    check('7b "Eight contracts" over a different number shown is not printed', !/Eight/.test(s7), s7);
    await shot('7-honest-tag');

    /* ================= 8. A FOLLOW-UP NARROWS WHAT IS SHOWN ================= */
    await type('now only the signed ones');
    const l8 = await until(() => { const f = intel.lenses.filter(x => x.action === 'filter'); return f.length === 2 ? { labels: f.map(x => x.label), shown: intelActive().ids.size } : null; });
    check('8 "now only the signed ones" narrows inside Naivas (the set was kept for it)', !!l8 && l8.shown > 0, JSON.stringify(l8));

    /* ================= 9. UNDO, TYPED ================= */
    await type('undo that');
    const l9 = await until(() => intel.lenses.filter(x => x.action === 'filter').length === 1 ? intel.lenses.map(x => x.label) : null);
    check('9 "undo that" takes back the last change', !!l9, JSON.stringify(l9));

    check('10 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run itself', false, e && e.stack);
  } finally {
    await browser.close(); await h.stop();
    const failed = results.filter(r => !r.pass);
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    process.exitCode = failed.length ? 1 : 0;
  }
})();
