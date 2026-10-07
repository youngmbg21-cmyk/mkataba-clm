/* Chromium verification: THE BOARD ANSWERS THE QUESTION ASKED
   (Young, 4 Oct 2026, over a screenshot of "value by month signed · trend"
   reading "SEK -367.66 → SEK 851.41" on a book of over a billion, and Copilot
   answering "Nothing changed on the map … likely a filtered subset" → "review
   this as a whole and fix it")
   ============================================================
   On Home's board, a book whose money sits in drafts:
     1. "show contract value over time": the headline counts every signed
        contract (the undated in their own "No date" column), the money left
        off is said, no line is drawn through one busy month and no number on
        the chart is below zero;
     2. "why does the dashboard say 851 SEK when we have over 1 billion…" goes
        to Copilot WITH the board (the payload carries what the board shows),
        and the answer prints without "Nothing changed on the map"; a sentence
        with a count the board does not show is left out;
     3. "how much is signed" answers with the money and draws a split that
        splits;
     4. "contracts by owner" says "by owner" under its ring;
     5. no page errors.
   Copilot is a stub on the route (no key in CI). Waits ask for the state.
   Screenshots go to test/chromium/shots/board-answers/.
   Run: node test/chromium/board-answers-the-question-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-answers');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/* the owner's book in small: ten drafts hold the money; six small signings in
   two months carry a date; three executed contracts carry none */
const BOOK = []; let n = 0;
const add = (status, value, o) => { const c = fixtureContract('MK-' + (300 + n), 'Agreement ' + n, ['Juno AB', 'Baltic Oy', 'Nordkraft AB'][n % 3], n % 2 ? 'proc' : 'sales', value, status); n++;
  c.expiry = dayIn(20, 10); Object.assign(c, o || {}); BOOK.push(c); };
for (let k = 0; k < 10; k++) add('Draft', 50e6);
for (let k = 0; k < 4; k++) add('Under Review', 5e6);
/* one long ago, five last month: the owner's shape, one busy month after a long quiet */
for (let k = 0; k < 6; k++) add('Signed', 300, { signedAt: (k ? dayIn(-1, 2 + k) : dayIn(-14, 5)) + 'T10:00:00.000Z' });
for (let k = 0; k < 3; k++) add('Signed', 2e6, { signedAt: null });

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
  /* Copilot on the map's route: what it was sent is kept; it answers about the board */
  const sent = [];
  await page.route('**/api/ai/graph', async route => {
    let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (_){ body = {}; }
    sent.push(body);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      visibleIds: null, where: null, action: 'highlight', badges: null, groupBy: null, groups: null, note: '', kind: 'map', sent: 1, total: 1,
      answer: 'The chart counts only the 9 signed contracts; the 14 contracts not signed yet hold most of the money. 77 contracts were hidden by a filter.' }) });
  });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = q => page.evaluate(async q => { await intelAsk(q); }, q);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.digBig = false; s.recipe = {}; s.screen = 'dark'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.evaluate(() => { state.aiConfigured = true; intel.history = []; });

    /* ================= 1. VALUE OVER TIME ================= */
    await ask('show contract value over time');
    const s1 = await until(() => { const f = document.querySelector('#hb-focus'); if (!f || !f.querySelector('.hb-chart-lead')) return null;
      const svgT = [...f.querySelectorAll('svg text')].map(t => t.textContent);
      return { lead: f.querySelector('.hb-chart-lead').textContent.replace(/\s+/g, ' ').trim(), note: (f.querySelector('.hb-chart-note') || {}).textContent || '',
        line: !!f.querySelector('.hb-sv-trend'), neg: svgT.filter(t => /-\s?\d|−\s?\d/.test(t)), noDate: svgT.some(t => t === 'No date') }; });
    check('1a the headline counts every signed contract, the undated ones too', !!s1 && /^9 contracts · KES 6M/.test(s1.lead) && s1.noDate, JSON.stringify(s1 && { lead: s1.lead, noDate: s1.noDate }));
    check('1b the money left off is said', !!s1 && /14 contracts not signed yet \(KES 520M\) are not drawn\./.test(s1.note), s1 && s1.note);
    check('1c no line through one busy month, and the reason is said', !!s1 && !s1.line && /Not enough history yet for a trend/.test(s1.note), JSON.stringify(s1 && { line: s1.line }));
    check('1d nothing on the chart is below zero', !!s1 && s1.neg.length === 0, JSON.stringify(s1 && s1.neg));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, '1-value-over-time.png') });

    /* ================= 2. WHY DOES IT SAY … ================= */
    await page.evaluate(() => { intel.history = []; });
    const path2 = await page.evaluate(() => JSON.stringify(hbS().path || []));
    await ask('why does the dashboard say 851 SEK when we have over 1 billion sek under management');
    const s2 = await until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); return a.length ? a.map(m => String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).join(' / ') : null; });
    const board = (sent[sent.length - 1] && sent[sent.length - 1].screen && sent[sent.length - 1].screen.board) || '';
    check('2a the question went to Copilot with the board: Your book, the open card, its headline and what is left off', /Your book \(the six figures at the top\)/.test(board) && /Open card: "All contracts"/.test(board) && /Headline over the chart: 9 contracts · KES 6M/.test(board) && /14 contracts not signed yet \(KES 520M\)/.test(board), board.slice(0, 300));
    check('2b the answer is printed without "Nothing changed on the map"', !!s2 && /counts only the 9 signed contracts/.test(s2) && !/Nothing changed on the map/.test(s2), s2);
    check('2c a sentence with a count the board does not show is left out', !!s2 && !/77 contracts/.test(s2), s2);
    /* RE-POINTED 7 Oct 2026 (the one-build work order A2): the opening words
       are read away, so the open card's key no longer carries "show" — the
       claim is that the board did not move */
    check('2d the board is as it was: the question drew no new card', await page.evaluate(p => JSON.stringify(hbS().path || []) === p, path2), await page.evaluate(() => JSON.stringify(hbS().path)));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '2-why-answered.png') });

    /* ================= 3. HOW MUCH IS SIGNED ================= */
    await page.evaluate(() => { intel.history = []; });
    await ask('how much is signed');
    const s3 = await until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); const k = (hbS().path || []).slice(-1)[0];
      if (!a.length || k !== 'q:how much is signed') return null; const D = hbDigData(k, hbS().lens), P = hbPlan(D);
      return { said: String(a[0].text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), pic: P.pic, by: P.split && P.split.by, measure: P.measure }; });
    check('3a "how much is signed" is answered with the money', !!s3 && /: 9 contracts, KES 6M, on the board\./.test(s3.said), s3 && s3.said);
    check('3b and drawn by value, split by something that splits (not one Executed slice)', !!s3 && s3.measure === 'value' && s3.pic === 'blocks' && s3.by !== 'status', JSON.stringify(s3));

    /* ================= 4. BY OWNER ================= */
    await ask('contracts by owner');
    const s4 = await until(() => { const f = document.querySelector('#hb-focus .hb-chart-by'); return f && (hbS().path || []).slice(-1)[0] === 'q:contracts by owner' ? f.textContent.trim() : null; });
    check('4a a ring by owner says "by owner"', s4 === 'by owner', s4);
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
