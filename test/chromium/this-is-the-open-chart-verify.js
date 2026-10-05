/* Chromium verification: "THIS" IS THE OPEN CHART, AND COPILOT PRESSES THE
   BOARD'S BUTTONS (Young, 4 Oct 2026: "build 1 and 2")
   ============================================================
   On Home's board, asked in the panel on the page:
     1. "Juno contracts signed by quarter" opens a card; "make it monthly"
        changes THAT card (same card, monthly, still by signing date) and the
        panel says so;
     2. "as a pie" draws it as a ring;
     3. "signed contracts by stream", then "only Naivas" narrows it — a card
        nested under it in the trail, Naivas's contracts only;
     4. a follow-up HaTi cannot read goes to Copilot WITH the open chart's
        settings; Copilot's chart-only answer (target "open") is applied to
        the open chart, the panel says what changed, the map is untouched and
        "Nothing changed on the map" is not said;
     5. no page errors.
   Copilot is a stub on the route (no key in CI). Waits ask for the state.
   Screenshots go to test/chromium/shots/this-is-the-open-chart/.
   Run: node test/chromium/this-is-the-open-chart-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'this-is-the-open-chart');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BOOK = []; let n = 0;
const add = (cp, status, o) => { const c = fixtureContract('MK-' + (400 + n), 'Agreement ' + n, cp, n % 2 ? 'proc' : 'sales', 2e6 + n * 1e5, status); n++;
  c.expiry = dayIn(8 + (n % 10), 10); Object.assign(c, o || {}); BOOK.push(c); };
for (let k = 0; k < 8; k++) add('Juno AB', 'Signed', { signedAt: dayIn(-1 - k, 10) + 'T10:00:00.000Z' });
for (let k = 0; k < 6; k++) add('Naivas Supermarkets', 'Signed', { signedAt: dayIn(-2 - k, 12) + 'T10:00:00.000Z' });
for (let k = 0; k < 4; k++) add('Baltic Oy', 'Draft');

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
  const sent = [];
  await page.route('**/api/ai/graph', async route => {
    let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (_){ body = {}; }
    sent.push(body);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      visibleIds: null, where: null, action: 'highlight', badges: null, groupBy: null, groups: null, note: '', kind: 'map', sent: 1, total: 1,
      chart: { pic: 'bars', split: { by: 'counterparty' }, target: 'open' },
      answer: 'Drawn as bars by counterparty, largest first.' }) });
  });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* asked the way the reader asks: typed into the panel's box and sent */
  const ask = async q => { await page.evaluate(() => { intel.history = []; });
    await page.evaluate(async q => { await intelAsk(q); }, q);
    return until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); return a.length ? a.map(m => String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).join(' / ') : null; }); };
  const card = () => page.evaluate(() => { const s = hbS(); const k = (s.path || []).slice(-1)[0]; if (!k) return null; const D = hbDigData(k, s.lens); if (!D || D.kind !== 'list') return { k };
    const P = hbPlan(D); const f = document.querySelector('#hb-focus');
    return { k, n: D.n, depth: s.path.length, pic: P.pic, split: P.split ? Object.assign({}, P.split) : null, measure: P.measure, trend: !!P.trend,
      trail: f ? [...f.querySelectorAll('.hb-trail button, .hb-trail [aria-current]')].map(b => b.textContent.trim()) : [], ring: !!(f && f.querySelector('svg.hb-ring')) }; });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.digBig = false; s.recipe = {}; s.screen = 'dark'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.evaluate(() => { state.aiConfigured = true; });

    /* ================= 1. MAKE IT MONTHLY ================= */
    await ask('Juno contracts signed by quarter');
    const c0 = await card();
    const said1 = await ask('make it monthly');
    const c1 = await card();
    check('1a "make it monthly" changes the open card, not a new one', !!c0 && !!c1 && c1.k === c0.k && c1.depth === 1, JSON.stringify({ c0: c0 && c0.k, c1: c1 && c1.k }));
    check('1b monthly, still by the signing date', !!c1 && c1.split && c1.split.by === 'date' && c1.split.unit === 'm' && c1.split.date === 'signed', JSON.stringify(c1 && c1.split));
    check('1c the panel says what changed, free', /^Changed the open chart, “.+”: now .+ · by month · signed · count\./.test(said1 || '') && /Free/.test(said1 || ''), said1);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '1-made-monthly.png') });

    /* ================= 2. AS A PIE ================= */
    await ask('as a pie');
    const c2 = await until(() => { const f = document.querySelector('#hb-focus svg.hb-ring'); return f ? true : null; });
    const p2 = await card();
    check('2a "as a pie" draws the same card as a ring', !!c2 && p2.k === c0.k && p2.pic === 'ring', JSON.stringify(p2));

    /* ================= 3. ONLY NAIVAS ================= */
    await ask('signed contracts by stream');
    const c3a = await card();
    const said3 = await ask('only Naivas');
    const c3 = await card();
    check('3a "only Naivas" narrows the open card: nested under it, Naivas only', !!c3 && c3.depth === 2 && /^qn:/.test(c3.k) && c3.n === 6 && c3a && c3a.n === 14, JSON.stringify({ before: c3a && c3a.n, c3 }));
    check('3b the trail reads Board › the card › Naivas', !!c3 && c3.trail.length >= 3 && /Naivas/.test(c3.trail[c3.trail.length - 1]), JSON.stringify(c3 && c3.trail));
    check('3c and the panel says how many', /: 6 contracts, on the board\./.test(said3 || ''), said3);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '3-only-naivas.png') });

    /* ================= 4. COPILOT PRESSES THE BUTTONS ================= */
    await ask('Juno contracts by stage');
    const c4a = await card();
    const map0 = await page.evaluate(() => JSON.stringify({ g: intel.groupBy, l: (intel.lenses || []).filter(l => !l.hb).length }));
    const said4 = await ask('make this look like a league table of our partners');
    const c4 = await card();
    const board = (sent[sent.length - 1] && sent[sent.length - 1].screen && sent[sent.length - 1].screen.board) || '';
    check('4a Copilot was asked with the open chart\'s settings in its own words', /Open chart settings \(chart\{\} words\): pic=ring; split=stage; measure=count; trend=off\./.test(board), board.split('\n').filter(l => /Open chart/.test(l)).join(' | '));
    check('4b Copilot\'s chart-only answer changed the open chart', !!c4 && c4.k === c4a.k && c4.pic === 'bars' && c4.split && c4.split.by === 'counterparty', JSON.stringify({ a: c4a && c4a.k, c4 }));
    /* the honest reply (f511): HaTi's line and the count; Copilot's own sentence is for why-questions only */
    check('4c the panel says what changed and how many, and not "Nothing changed on the map"', /^Changed the open chart, “.+”: now Bars · by counterparty · count\. \d+ contracts\./.test(said4 || '') && !/Drawn as bars by counterparty/.test(said4 || '') && !/Nothing changed on the map/.test(said4 || ''), said4);
    check('4d the map is as it was', (await page.evaluate(() => JSON.stringify({ g: intel.groupBy, l: (intel.lenses || []).filter(l => !l.hb).length }))) === map0, map0);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '4-copilot-pressed.png') });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('stage ran', false, e.message + (errors.length ? ' | page errors: ' + errors.slice(0, 3).join(' | ') : ''));
  } finally {
    await browser.close(); await h.stop();
    const bad = results.filter(r => !r.pass);
    console.log(`\n${results.length - bad.length}/${results.length} passed`);
    process.exit(bad.length ? 1 : 0);
  }
})();
