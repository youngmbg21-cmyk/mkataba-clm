/* Chromium verification: EXPLORER STAGE 3 — JAMBO EXPLAINS, HIS WORDS POINT
   ======================================================================
   The owner, 18 Oct 2026: "build all the stages autonomously". Stage 3, as
   drawn: (1) "Explain this view" — Jambo walks the view on screen part by
   part, biggest first, one sentence each, written from the numbers the map
   DREW, each lighting its part; ‹ › and Stop on the head line; free, nothing
   sent; any change to the map ends it. (2) Sentences that point — the names
   of the map's parts in Jambo's own sentence light those parts when pressed,
   and his figures are checked against the figures the map drew.

   Every sentence is measured against the map's own drawing (its hubs, floors,
   cells, strip); the lighting is read off the dots' classes. Jambo's model is
   a scripted stand-in (startScriptedAi): the walk must make NO call to it.

   Red at the parent: no walk is read ("explain this view" goes elsewhere),
   there is no "Explain this view" door, and Jambo's sentence names nothing
   and checks nothing.

   Screenshots go to test/chromium/shots/explorer-stage-three/ (or HATI_SHOT_DIR).
   Run: node test/chromium/explorer-stage-three-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-stage-three');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthEnd = off => { const n = new Date(); n.setHours(0, 0, 0, 0); return iso(new Date(n.getFullYear(), n.getMonth() + off + 1, 0)); };

/* Three streams of different sizes (so "biggest first" has an order to keep),
   liability caps read, payment terms, notice periods and end dates spread. */
const ST = ['proc', 'proc', 'proc', 'sales', 'sales', 'mfg'], LC = ['capped', 'uncapped', 'capped', 'unclear', 'capped'];
const TERMS = ['Net 30', 'Net 60', 'Net 45', '90 days'];
const BOOK = Array.from({ length: 36 }, (_, i) => {
  const c = fixtureContract('MK-W' + i, ['Freight Services', 'Retail Supply', 'Component Supply'][i % 3] + ' ' + i, ['Kipande', 'Savanna', 'Mvua', 'Tausi'][i % 4],
    ST[i % 6], ((i * 37) % 90 + 5) * 1e6, ['Signed', 'Signed', 'Under Review', 'Draft'][i % 4]);
  c.metadata = Object.assign({}, c.metadata || {}, { category: i % 2 ? 'supplier' : 'customer', liabilityCapped: LC[i % 5], paymentTerms: TERMS[i % 4], noticePeriodDays: [30, 60, 90][i % 3] });
  c.expiry = monthEnd(2 + (i % 15));
  return c;
});

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' ')));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { const n = await page.evaluate(() => intel.history.length);
    /* RE-PINNED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"): everything typed on a Jambo tab goes to the AI (igTalkFirst); this check is about the free readers, so it types under Overview — an answer turns the panel to his tab, and one press on it turns back */
    await page.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows()) { if (typeof pdTalkBack === 'function') pdTalkBack(); } }); /* asked as a chip asks: typed words are the brain's (Door above the box, 28 Oct 2026) */ await page.evaluate(w => intelAsk(w), q);
    await until(k => !intel.busy && intel.history.length >= k + 2, n); await page.waitForTimeout(300); };
  const settle = v => until(k => intel.cam && intel.cam.w[k] > 0.97, v);
  /* a press on something the page may not have reports, never times out (a missing feature reads red) */
  const press = async sel => { if (await page.locator(sel).count()) { await page.click(sel); return true; } return false; };
  /* the walk as drawn: its sentences, which one is lit, the head line */
  const tour = () => page.evaluate(() => ({
    on: !!intel.tour, at: intel.tour ? intel.tour.at : null,
    says: [...document.querySelectorAll('#ig-dock [data-ig-tour-go]')].map(b => b.textContent.trim()),
    lit: [...document.querySelectorAll('#ig-dock [data-ig-tour-go].is-on')].map(b => Number(b.getAttribute('data-ig-tour-go'))),
    head: (document.getElementById('ig-note') || {}).textContent || '' }));
  /* which contracts the map has lit (hi) and dimmed (dim) */
  const lights = () => page.evaluate(() => { const c = IG.nodes.filter(n => n.kind === 'contract');
    return { hi: c.filter(n => n.g.classList.contains('hi')).map(n => n.id).sort(), dim: c.filter(n => n.g.classList.contains('dim')).length, all: c.length }; });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-W7'), null, { timeout: 15000 });
    await until(() => state.view === 'counter', null, 10000);
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igViews'); } catch (_) {} state.aiConfigured = true; intel.cam = null; intel.tab = 'map'; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbFace() === 'explorer' && window.IG && IG.hubs && IG.hubs.length >= 3 && !!document.getElementById('igd-input'));
    await page.evaluate(() => igSetView(0)); await settle(0);

    /* ================= 1. EXPLAIN THIS VIEW: THE BRAIN ======================= */
    ai.reset();
    await ask('explain this view');
    const t1 = await tour();
    const hubs = await page.evaluate(() => IG.hubs.filter(h => h.kind === 'hub' && h.kids && h.kids.length).map(h => ({ label: String(h.label), n: h.kids.length, ids: h.kids.map(k => k.id).sort() })).sort((a, b) => b.n - a.n));
    const total = await page.evaluate(() => IG.nodes.filter(n => n.kind === 'contract').length);
    check('1a "explain this view" walks the Brain: the whole first, then the groups, biggest first — and asks Jambo\'s model nothing',
      t1.on && t1.says.length === Math.min(5, hubs.length + 1) && ai.calls.length === 0, JSON.stringify({ says: t1.says, calls: ai.calls.length }));
    check('1b the first sentence counts what the map holds and its groups; each part names a group with its own count, in the order drawn',
      t1.says[0] && t1.says[0].startsWith(`${total} contracts, grouped by value stream into ${hubs.length} groups`)
      && hubs.slice(0, t1.says.length - 1).every((g, k) => t1.says[k + 1].startsWith(`${g.label}: ${g.n} contracts`)),
      JSON.stringify({ first: t1.says[0], hubs: hubs.map(g => g.label + ' ' + g.n) }));
    check('1c the head line says where the walk is, with ‹ › and Stop', /Explaining this view · 1 of \d/.test(t1.head) && await page.evaluate(() => !!document.getElementById('ig-tour-next') && !!document.getElementById('ig-tour-stop')), t1.head.slice(0, 160));
    await press('#ig-dock [data-ig-tour-go="2"]');
    const l1 = await lights(), t1b = await tour();
    check('1d pressing a sentence lights its group on the map and dims the rest; the head line follows',
      t1b.at === 2 && t1b.lit.join() === '2' && JSON.stringify(l1.hi) === JSON.stringify(hubs[1].ids) && l1.dim === l1.all - hubs[1].ids.length && /2|3 of/.test(t1b.head),
      JSON.stringify({ at: t1b.at, hi: l1.hi.length, want: hubs[1].ids.length, dim: l1.dim, all: l1.all }));
    await page.screenshot({ path: path.join(OUT, '1-brain-walk.png') });
    await press('#ig-tour-next');
    const t1c = await tour();
    await press('#ig-tour-prev'); await press('#ig-tour-prev');
    const t1d = await tour();
    check('1e › moves on a part, ‹ goes back', t1c.at === 3 && t1d.at === 1, JSON.stringify({ next: t1c.at, back: t1d.at }));
    await press('#ig-tour-stop');
    const t1e = await tour(), l1e = await lights();
    check('1f Stop ends it and the map is whole again', !t1e.on && l1e.hi.length === 0 && l1e.dim === 0 && !/Explaining/.test(t1e.head), JSON.stringify({ on: t1e.on, hi: l1e.hi.length, dim: l1e.dim }));
    await ask('explain this view');
    await ask('colour by stage');
    check('1g any change to the map ends the walk (its sentences would describe a map that is gone)', !(await tour()).on);

    /* ================= 2. FLOORS, GRID, TIMELINE ============================== */
    await ask('floors by payment terms'); await settle(2);
    await page.evaluate(() => { state.settings = state.settings || {}; state.settings.payTargets = { customer: 45, supplier: 45 }; rebuildIntelGraph(); });
    await ask('explain this view');
    const t2 = await tour();
    const fl = await page.evaluate(() => IG.floors.filter(f => f.n).map(f => ({ label: String(f.label), n: f.n, over: f.over })).sort((a, b) => b.n - a.n));
    check('2a on Floors it names the fact and the floors, then each floor biggest first, with how many are over our payment standard',
      /^Floors by payment terms: \d+ floors?, \d+ contracts?\./.test(t2.says[0] || '')
      && fl.slice(0, t2.says.length - 1).every((f, k) => t2.says[k + 1].startsWith(`${f.label}: ${f.n} contract`) && (!f.over || t2.says[k + 1].includes(`${f.over} ${f.over === 1 ? 'is' : 'are'} over our payment standard`))),
      JSON.stringify({ says: t2.says, fl }));
    await page.screenshot({ path: path.join(OUT, '2-floors-walk.png') });
    await ask('streams against liability cap'); await settle(3);
    await ask('explain this view');
    const t3 = await tour();
    const cells = await page.evaluate(() => Object.values(IG.grid.cells).filter(c => c.n).map(c => ({ col: String(IG.cols[c.ci].label), row: String(IG.floors[c.fi].label), n: c.n })).sort((a, b) => b.n - a.n));
    check('2b on the Grid the parts are its cells, fullest first, and an amber cell is said to need attention',
      /across, .* down: \d+ cells? hold contracts/.test(t3.says[0] || '') && cells.slice(0, t3.says.length - 1).every((c, k) => t3.says[k + 1].startsWith(`${c.col} × ${c.row}: ${c.n} contract`))
      && t3.says.slice(1).filter(s => / × Liability uncapped:/.test(s)).every(s => /needs attention/.test(s)),
      JSON.stringify({ says: t3.says }));
    await page.evaluate(() => { intel.floorsBy = null; intel.columnsBy = null; rebuildIntelGraph(); igSetView(4); }); await settle(4);
    await ask('explain this view');
    const t4 = await tour();
    const tl = await page.evaluate(() => ({ undated: IG.tl.undated, strip: IG.tl.strip.map(s => s.n).sort((a, b) => b - a) }));
    check('2c on the Timeline it says what is dated and what is not, then the busiest stretches first, each with its own count',
      new RegExp(`^Along the renewal decision date: \\d+ contracts? dated, ${tl.undated} with no date\\.`).test(t4.says[0] || '')
      && tl.strip.slice(0, t4.says.length - 1).every((n, k) => new RegExp(`: ${n} contracts?\\.`).test(t4.says[k + 1])),
      JSON.stringify({ says: t4.says, strip: tl.strip }));
    await page.screenshot({ path: path.join(OUT, '3-timeline-walk.png') });
    await press('#ig-tour-stop');

    /* ================= 3. THE DOOR UNDER THE LATEST ANSWER ==================== */
    await page.evaluate(() => igSetView(0)); await settle(0);
    await ask('group by stage');
    const d3 = await page.evaluate(() => { const b = document.querySelectorAll('#ig-dock [data-ig-tour-open]'); return { n: b.length, last: b.length ? b[b.length - 1].getAttribute('data-ig-tour-open') === String(intel.history.length - 1) : false }; });
    check('3a "Explain this view" sits under the latest answer only', d3.n === 1 && d3.last, JSON.stringify(d3));
    await press('#ig-dock [data-ig-tour-open]');
    const t5 = await tour(), w5 = await page.evaluate(() => graphGroupingWord('status'));
    check('3b pressing it starts the walk of the view on screen', t5.on && t5.says.length >= 2 && (t5.says[0] || '').includes('grouped by ' + w5), JSON.stringify(t5.says.slice(0, 2)));
    await press('#ig-tour-stop');

    /* ================= 4. SENTENCES THAT POINT ================================ */
    await ask('group by value stream');
    const g4 = await page.evaluate(() => IG.hubs.filter(h => h.kind === 'hub' && h.kids && h.kids.length).map(h => ({ label: String(h.label), n: h.kids.length, ids: h.kids.map(k => k.id).sort() })).sort((a, b) => b.n - a.n));
    ai.reset();
    ai.script({ content: [{ type: 'tool_use', id: 'tu_p1', name: 'render_graph', input: { groupBy: 'folder', note: 'By stream',
      answer: `${g4[0].label} carries the most, ${g4[0].n} contracts, while ${g4[1].label} holds ${g4[1].n} and the rest is worth KES 999M.` } }] });
    const n4 = await page.evaluate(() => intel.history.length);
    await page.fill('#igd-input', 'Which stream carries the most weight right now?'); await page.click('#igd-go');
    await until(k => !intel.busy && intel.history.length >= k + 2 && !!document.querySelector('#ig-dock .ig-point'), n4, 10000);
    const p4 = await page.evaluate(() => ({ points: [...document.querySelectorAll('#ig-dock .ig-point')].map(b => b.getAttribute('data-ig-point')),
      figs: (document.querySelector('#ig-dock [data-ig-figs]') || {}).textContent || '', off: !!document.querySelector('#ig-dock .igd-figs.is-off') }));
    check('4a the names of the map\'s parts in Jambo\'s sentence become presses', ai.calls.length >= 1 && p4.points.includes(g4[0].label) && p4.points.includes(g4[1].label), JSON.stringify({ calls: ai.calls.length, p4 }));
    check('4b his figures are checked against the map: the two counts match, the money the map never drew does not, and that is said',
      p4.figs === '2 of 3 figures match the map' && p4.off, JSON.stringify(p4));
    await press(`#ig-dock .ig-point[data-ig-point="${g4[1].label}"]`);
    const l4 = await lights();
    check('4c pressing a name lights that group on the map', JSON.stringify(l4.hi) === JSON.stringify(g4[1].ids) && l4.dim === l4.all - g4[1].ids.length, JSON.stringify({ hi: l4.hi.length, want: g4[1].ids.length }));
    await page.screenshot({ path: path.join(OUT, '4-sentences-point.png') });
    await press(`#ig-dock .ig-point[data-ig-point="${g4[1].label}"]`);
    const l4b = await lights();
    check('4d pressed again, it lets go', l4b.hi.length === 0 && l4b.dim === 0, JSON.stringify(l4b));
    ai.script({ content: [{ type: 'tool_use', id: 'tu_p2', name: 'render_graph', input: { groupBy: 'folder', note: 'By stream',
      answer: `${g4[0].label} carries the most with ${g4[0].n} contracts; ${g4[1].label} follows with ${g4[1].n}.` } }] });
    const n5 = await page.evaluate(() => intel.history.length);
    await page.fill('#igd-input', 'And which stream follows it in weight?'); await page.click('#igd-go');
    await until(k => !intel.busy && intel.history.length >= k + 2, n5, 10000);
    const f5 = await until(() => { const all = document.querySelectorAll('#ig-dock [data-ig-figs]'); return all.length >= 2 ? all[all.length - 1].textContent : null; }, null, 4000);
    check('4e when every figure is one the map drew, it says so', f5 === '✓ 2 figures match the map', String(f5));

    check('5a no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' ') : String(e));
  } finally {
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
