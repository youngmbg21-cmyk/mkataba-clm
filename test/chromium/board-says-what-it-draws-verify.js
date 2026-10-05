/* Chromium verification: THE BOARD DRAWS WHAT IT SAYS
   (the owner's two screenshots, 5 Oct 2026: "Fix these disconnects")
   ============================================================
   On Home's board, a book with payment terms and two archived contracts:
     1. "Show me the payment terms in pie chart" draws a ring of the payment
        terms ("0–30 days", "46–60 days", "No payment terms read"), and the
        answer says "by payment terms";
     2. "payment terms by stage as a pie": the measure is average payment
        days, so bars are drawn and Ring is greyed in the Picture menu;
     3. "contracts by counterparty" then "Show them in graph" redraws the
        SAME card as bars, by counterparty — no new card, nothing sent to
        Copilot;
     4. Explorer's "Showing n of N" counts the book the board counts (the
        archived left out);
     5. no page errors.
   Copilot is a stub on the route (no key in CI); nothing should reach it.
   Screenshots go to test/chromium/shots/board-says/.
   Run: node test/chromium/board-says-what-it-draws-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-says');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BOOK = []; let n = 0;
const add = (status, terms, o) => { const c = fixtureContract('MK-' + (400 + n), 'Agreement ' + n, ['Juno AB', 'Baltic Oy', 'Nordkraft AB'][n % 3], n % 2 ? 'proc' : 'sales', 2e6, status); n++;
  c.expiry = dayIn(20, 10); c.metadata = Object.assign({}, c.metadata, terms ? { paymentTerms: terms, category: 'supplier' } : {}); Object.assign(c, o || {}); BOOK.push(c); };
for (let k = 0; k < 4; k++) add('Signed', '30 days');
for (let k = 0; k < 3; k++) add('Under Review', '60 days');
for (let k = 0; k < 2; k++) add('Draft', null);
for (let k = 0; k < 2; k++) add('Signed', '30 days', { archived: true });

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
    const body = route.request().postData() || ''; sent.push(body);
    /* the screenshot's "top 10 by value": Copilot names a set, HaTi counts it */
    const top = /top 2/.test(body) ? BOOK.filter(c => !c.archived).slice(0, 2).map(c => c.id) : null;
    /* THE HONEST REPLY (f511): Copilot names a set with a stray note and a
       count of the whole store — HaTi must name it and count it itself */
    if (/our CFO cares about/.test(body)){
      const big = BOOK.filter(c => !c.archived).slice(0, 5).map(c => c.id);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ visibleIds: big, where: null, action: 'filter', note: 'Largest deals · as graph', kind: 'map', sent: 1, total: 1, answer: 'Showing 10 of 181 contracts by value.' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ visibleIds: top, where: null, action: 'filter', note: top ? 'Top 2 by value' : '', kind: 'map', sent: 1, total: 1, answer: '' }) });
  });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = q => page.evaluate(async q => { intel.history = []; await intelAsk(q); }, q);
  const lastSaid = () => until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); return a.length ? String(a[a.length - 1].text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null; });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.digBig = false; s.recipe = {}; s.screen = 'dark'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.evaluate(() => { state.aiConfigured = true; intel.history = []; });

    /* ================= 1. PAYMENT TERMS IN A PIE ================= */
    await ask('Show me the payment terms in pie chart');
    const s1 = await until(() => { const svg = document.querySelector('#hb-focus svg.hb-ring'); if (!svg) return null;
      return { aria: svg.getAttribute('aria-label'), texts: [...svg.querySelectorAll('text')].map(t => t.textContent.trim()) }; });
    const said1 = await lastSaid();
    await page.screenshot({ path: path.join(OUT, '1-payment-terms-pie.png') });
    check('1a a ring is drawn "by payment terms"', !!s1 && s1.aria === 'by payment terms', s1 && s1.aria);
    check('1b its slices are the payment terms', !!s1 && ['0–30 days', '46–60 days', 'No payment terms read'].every(x => s1.texts.includes(x)), s1 && s1.texts.join(' | '));
    check('1c the answer says what is drawn', /by payment terms/.test(said1 || ''), said1);

    /* ================= 2. AN AVERAGE IS NEVER A RING ================= */
    await ask('payment terms by stage as a pie');
    const s2 = await until(() => { const k = (hbS().path || []).slice(-1)[0]; if (k !== 'q:payment terms by stage as a pie') return null;
      const D = hbDigData(k, hbS().lens), P = hbPlan(D), ring = hbRcOptions('pic', P, D).find(o => o.v === 'ring');
      return { pic: P.pic, measure: P.measure, bars: !!document.querySelector('#hb-focus .hb-chart-bars'), ringOn: ring.on, why: ring.why }; });
    await page.screenshot({ path: path.join(OUT, '2-average-as-bars.png') });
    check('2a average payment days by stage is drawn as bars', !!s2 && s2.pic === 'bars' && s2.measure === 'payDays' && s2.bars, JSON.stringify(s2));
    check('2b Ring is greyed with the reason', !!s2 && s2.ringOn === false && /average/.test(s2.why), s2 && s2.why);

    /* ================= 3. "SHOW THEM IN GRAPH" ================= */
    await ask('contracts by counterparty');
    await until(() => (hbS().path || []).slice(-1)[0] === 'q:contracts by counterparty' ? true : null);
    const depth = await page.evaluate(() => (hbS().path || []).length);
    const before = sent.length;
    await ask('Show them in graph');
    const s3 = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; const P = hbPlan(hbDigData(k, s.lens));
      return P.pic === 'bars' && document.querySelector('#hb-focus .hb-chart-bars') ? { k, n: s.path.length, by: P.split && P.split.by } : null; });
    const said3 = await lastSaid();
    await page.screenshot({ path: path.join(OUT, '3-show-them-in-graph.png') });
    check('3a the same card, by counterparty, now bars', !!s3 && s3.k === 'q:contracts by counterparty' && s3.n === depth && s3.by === 'counterparty', JSON.stringify(s3));
    check('3b nothing went to Copilot', sent.length === before, sent.length - before);
    check('3c the answer says what changed', /Bars · by counterparty/.test(said3 || ''), said3);

    /* ================= 4. ONE BOOK ================= */
    await ask('top 2 by value');
    const said4 = await until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); const t = a.map(m => String(m.text || '').replace(/<[^>]+>/g, ' ')).join(' '); return /contracts, on the board/.test(t) ? t.replace(/\s+/g, ' ').trim() : null; });
    const live = BOOK.filter(c => !c.archived).length;
    await page.screenshot({ path: path.join(OUT, '4-showing-n-of-the-book.png') });
    /* on the board the reply is HaTi's own (the honest reply, f511): the count of what is drawn */
    check('4a the reply counts what the board draws (archived left out)', /^Top 2 by value: 2 contracts, on the board\./.test(said4 || '') && live === 9, said4);
    /* on Explorer the map's own line stays: "Showing n of N", N the book without the archived */
    await page.evaluate(() => { hbSetFace('explorer'); });
    await ask('top 2 by value');
    const said4b = await until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); const t = a.map(m => String(m.text || '').replace(/<[^>]+>/g, ' ')).join(' '); return /Showing \d+ of \d+/.test(t) ? t.replace(/\s+/g, ' ').trim() : null; });
    check('4b on Explorer, "Showing n of N" counts the book the board counts', new RegExp('Showing 2 of ' + live + '\\b').test(said4b || ''), said4b);
    await page.evaluate(() => { hbSetFace('board'); });

    /* ================= 5. THE HONEST REPLY (f511) ================= */
    await page.evaluate(() => { const s = hbS(); s.path = []; s.panels = []; hbSave(); hbPaintBoard(); });
    await ask('the deals our CFO cares about');
    const s5 = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; if (k !== 'ls') return null;
      const a = (intel.history || []).filter(m => m.role === 'assistant');
      return { crumb: hbCrumbOf(k, s.lens), lenses: (intel.lenses || []).map(l => l.label), said: a.length ? String(a[a.length - 1].text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '' }; });
    await page.screenshot({ path: path.join(OUT, '5-honest-reply.png') });
    check('5a the set is named by the question, never by Copilot\'s note', !!s5 && s5.crumb === 'The deals our CFO cares about' && !s5.lenses.some(l => /as graph/.test(l)), JSON.stringify(s5));
    check('5b the reply is HaTi\'s count of what is drawn, not Copilot\'s "181"', !!s5 && /^The deals our CFO cares about: 5 contracts, on the board\. Drawn as /.test(s5.said) && !/181/.test(s5.said), s5 && s5.said);
    await ask('By counterparty');
    await ask('Show them in graph');
    const s5c = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; const P = hbPlan(hbDigData(k, s.lens));
      const a = (intel.history || []).filter(m => m.role === 'assistant');
      return P.pic === 'bars' && document.querySelector('#hb-focus .hb-chart-bars') ? { k, crumb: hbCrumbOf(k, s.lens), by: P.split && P.split.by, said: a.length ? String(a[a.length - 1].text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '' } : null; });
    await page.screenshot({ path: path.join(OUT, '5-show-them-in-graph.png') });
    check('5c "By counterparty" then "Show them in graph": the same card, its name kept, bars by counterparty, and the count said', !!s5c && s5c.k === 'ls' && s5c.crumb === 'The deals our CFO cares about' && s5c.by === 'counterparty' && /5 contracts\./.test(s5c.said), JSON.stringify(s5c));
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
