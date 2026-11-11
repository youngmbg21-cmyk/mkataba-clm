/* THE ANALYST EXAM — a procurement analyst's requests TYPED into Jambo on the Board and on Explorer, to the REAL
   model (owner, 10 Nov 2026: "create analytical tests for each related to ranking by different metrics and
   dimensions… imagine I am a procurement analyst"). A MEASUREMENT, not a test: it spends real Jambo calls, so it is
   run by hand and read by a person (listed in run-all.js's NOT_TESTS). It records, per request, what the model
   answered, what the page then shows and what was said; the scorecard is in docs/MAP-HISTORY.md (INSIGHTS, THE
   ANALYST EXAM). The book is built so count and value rank differently (Juno many small, Nordvane one huge).
   Run: PAGE=board|explorer ANTHROPIC_API_KEY=… node test/chromium/analyst-exam-measure.js */
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const PAGE = process.env.PAGE || 'board';
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'analyst-exam', PAGE); fs.mkdirSync(OUT, { recursive: true });
/* a book where count and value rank differently: Juno many small, Nordvane one huge */
const P = [['Juno Ltd', 12, 2], ['Kevian', 9, 6], ['Bidco', 7, 14], ['Naivas', 6, 20], ['Twiga', 5, 9], ['Kenafric', 4, 30], ['Wilmar', 2, 95], ['Nordvane', 1, 185], ['Carrefour', 3, 26], ['Brookside', 3, 11]];
const ST = ['proc', 'sales', 'mfg', 'dist', 'mktg'], SG = ['Draft', 'Under Review', 'Signed', 'Signed', 'Signed', 'Declined'];
const PT = ['30 days', '45 days', '60 days', '90 days'], NM = ['Packaging Film Supply', 'Cold Chain Logistics', 'Raw Sugar Supply', 'Office Lease', 'Distributor Agreement', 'Maintenance Services'];
const BOOK = []; let k = 0;
P.forEach(([name, n, v], pi) => { for (let i = 0; i < n; i++, k++) {
  const c = fixtureContract('MK-' + (100 + k), NM[k % 6], name, ST[(pi + i) % 5], (v + (i % 3)) * 1e6, SG[k % 6]);
  c.metadata = Object.assign({}, c.metadata || {}, { paymentTerms: PT[(pi + i) % 4], category: ['supplier', 'supplier', 'customer', 'lease', 'customer', 'supplier'][k % 6] });
  const y = 2026 + (k % 3), m = String(1 + (k * 5) % 12).padStart(2, '0'); c.expiry = `${y + 1}-${m}-28`;
  BOOK.push(c); } });
const B = [
  ['show me the top 4 customers with the highest number of contracts', 1],
  ['you are showing me 5 instead of 4', 0],
  ['top 5 suppliers by total contract value', 1],
  ['make it a bar chart', 0],
  ['now by number of contracts instead', 0],
  ['sort it from lowest to highest', 0],
  ['which value stream has the most money under contract', 1],
  ['rank the value streams by number of contracts', 1],
  ['contract value by counterparty as a pie chart', 1],
  ['show spend by payment terms', 1],
  ['how many contracts expire each quarter next year', 1],
  ['value of contracts expiring by month for the next 12 months', 1],
  ['average contract value by value stream', 1],
  ['compare suppliers and customers by total value', 1],
  ['contracts by stage and value stream', 1],
  ['show a heatmap of value stream against payment terms', 1],
  ['bottom 3 counterparties by value', 1],
  ['what share of total value does each stream hold', 1],
  ['top 3 counterparties by value in procurement only', 1],
  ['show me only signed contracts by counterparty, top 5 by count', 1],
  ['which suppliers have the longest payment terms', 1],
  ['who are my biggest suppliers', 1],
  ['draw a table of counterparties with their count and total value', 1],
  ['show count and value side by side for each stream', 1],
  ['contracts by type', 1],
  ['top 10 contracts by value', 1],
  ['remove that chart', 0],
  ['where is my concentration risk', 1],
  ['show renewals due in the next 90 days by stream', 1],
  ['number of contracts per owner', 1],
];
const E = [
  ['show me the top 3 streams by value', 1],
  ['rank them from left to right by highest to lowest value', 0],
  ['now colour them by stage', 0],
  ['top 4 customers by number of contracts', 1],
  ['top 5 counterparties by value', 1],
  ['show only those on the grid', 0],
  ['order the columns from biggest to smallest', 1],
  ['group by counterparty and sort the groups by total value', 1],
  ['the 3 smallest value streams', 1],
  ['top 2 contracts in each value stream by value', 1],
  ['which counterparty has the most contracts', 1],
  ['show suppliers only, grouped by payment terms', 1],
  ['size the dots by value and colour by payment terms', 1],
  ['stage against value stream as a grid', 1],
  ['show contracts over 20 million', 1],
  ['of those, only procurement', 0],
  ['rank them by value', 0],
  ['which contracts expire next year', 1],
  ['show them on a timeline by expiry', 0],
  ['top 3 stages by number of contracts', 1],
  ['group by contract type and show the 3 biggest types', 1],
  ['show me where the money is concentrated', 1],
  ['hide the declined ones', 1],
  ['top 5 suppliers by value', 1],
  ['compare Juno with Nordvane', 1],
  ['payment terms on the floors, value streams as columns', 1],
  ['only the top 3 parties by open obligations', 1],
  ['sort the contracts by renewal date', 1],
  ['top 3 owners by value', 1],
  ['show the biggest 3 value streams and the top 2 contracts in each', 1],
];
const ASKS = PAGE === 'board' ? B : E;
(async () => {
  const h = await startHati({ ANTHROPIC_API_KEY: process.env.HATI_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL, HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let lastAi = [];
  page.on('response', async r => { if (/\/api\/ai\/(graph|chat|ask)/.test(r.url())) { try { const b = await r.json(); lastAi.push({ url: r.url().replace(/^.*\/api\//, ''), body: Object.fromEntries(Object.entries(b || {}).filter(([k, v]) => v != null && v !== '' && v !== false && !['sent', 'total', 'usage', 'notice', 'cost', 'kind'].includes(k) && !(Array.isArray(v) && !v.length))) }); } catch (_) {} } });
  const until = async (fn, arg, ms = 60000) => { let v; const t0 = Date.now(); while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(150); } return v; };
  const snap = () => page.evaluate(pg => {
    const txt = el => el ? el.innerText.replace(/\s+/g, ' ').trim() : null;
    if (pg === 'board') { const key = hbOpenListKey(), D = key ? hbDigData(key, hbS().lens) : null; let plan = null; try { plan = D ? hbCardClean(hbPlan(D)) : null; } catch (_) {}
      return { key, plan, card: (txt(document.getElementById('hb-focus')) || '').slice(0, 700) }; }
    const act = intelActive(), cols = [...document.querySelectorAll('#ig-gwrap text, #ig-gwrap .igb-edge')].length;
    const per = {}; (state.contracts || []).forEach(c => { if (act.ids && act.action === 'filter' && !act.ids.has(c.id)) return; const g = groupLabelOf(c, intel.columnsBy || intel.groupBy, intel.groups); per[g] = (per[g] || 0) + 1; });
    return { view: IGB_VIEWS[igbCam().view], groupBy: intel.groupBy, floorsBy: intel.floorsBy, columnsBy: intel.columnsBy, colourBy: intel.colourBy, sizeBy: intel.sizeBy, timeBy: intel.timeBy, sortBy: intel.sortBy, lens: intel.lens || null,
      lenses: (intel.lenses || []).filter(l => l.on).map(l => `${l.label} (${l.action}, ${(l.ids || []).length})`), shown: act.ids ? act.ids.size : null, groups: per,
      order: (window.IG && IG.grid && IG.grid.cols ? IG.grid.cols.map(c => c.label || c.key || c) : null) };
  }, PAGE);
  const out = [];
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 40, null, { timeout: 20000 });
    await page.evaluate(async pg => { await stPrefSet('newLook', true); newLookApply(); intel.cam = null; intel.tab = 'map'; intel.dockOpen = true; setView('dashboard'); hbSetFace(pg === 'board' ? 'board' : 'explorer'); }, PAGE);
    await until(() => !!document.getElementById('igd-input'), null, 20000);
    let i = 0;
    for (const [q, fresh] of ASKS) {
      i++;
      if (fresh) await page.evaluate(pg => { if (pg === 'board') { setView('dashboard'); intel.paper = null; hbSetFace('board'); const s = hbS(); s.path = []; intel.history = []; intel.lenses = []; intel.dockOpen = true; try { hbPaintBoard(); } catch (_) {} renderIntelDock(); }
        else { if (hbFace() !== 'explorer') hbSetFace('explorer'); igRecipeRun({ acts: [{ everything: true }, { landing: true }] }, { noPush: true }); intel.lens = null; intel.history = []; intel.recipeStack = []; rebuildIntelGraph(); renderIntelDock(); } }, PAGE);
      await until(pg => !!document.getElementById('igd-input') && (pg !== 'board' || hbFace() === 'board'), PAGE, 8000);
      const n = await page.evaluate(() => intel.history.length); lastAi = [];
      await page.fill('#igd-input', q); await page.press('#igd-input', 'Enter');
      await until(k => !intel.busy && intel.history.length >= k + 2, n);
      await page.waitForTimeout(900);
      const after = await snap();
      const said = await page.evaluate(k => intel.history.slice(k).filter(m => m.role === 'assistant').map(m => String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400) + (m.choices ? ' [choices: ' + m.choices.map(c => c.label).join(' | ') + ']' : '')).join(' // '), n);
      const face = await page.evaluate(() => hbFace());
      const row = { i, q, fresh: !!fresh, face, ai: lastAi.slice(), after, said }; out.push(row);
      console.log(`\n#${i} ${fresh ? '' : '(follow-up) '}"${q}"\n  FACE ${face}\n  AI:   ${JSON.stringify(row.ai).slice(0, 900)}\n  NOW:  ${JSON.stringify(after).slice(0, 1100)}\n  SAID: ${said}`);
      await page.screenshot({ path: path.join(OUT, String(i).padStart(2, '0') + '.png') });
    }
  } catch (e) { console.log('FAILED', e && e.stack); }
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ errors, out }, null, 2));
  console.log('\npage errors:', errors.slice(0, 10));
  await browser.close(); await h.stop();
})();
