/* Chromium verification: CHECK AND REPAIR (the owner's work order, Part 4,
   4 Oct 2026)
   ============================================================
   Copilot is a stub on the route (no key in CI):
     1. it first answers with one good card and one on a date nobody has; the
        good card lands, the bad one goes back ONCE (the retry carries HaTi's
        reason), its fix lands, and the panel says one retry ran;
     2. a card that is wrong twice never reaches the board, and the panel
        says why in one line — no band, no dialog;
     3. no page errors.
   Run: node test/chromium/check-and-repair-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'check-and-repair');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BOOK = [];
for (let k = 0; k < 20; k++){ const c = fixtureContract('MK-' + (700 + k), 'Agreement ' + k, 'Party ' + (k % 4), k % 2 ? 'proc' : 'sales', 1e6, k % 3 ? 'Signed' : 'Draft');
  c.expiry = dayIn(1 + (k % 8), 12); BOOK.push(c); }

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const add = (title, recipe) => ({ do: 'add_card', which: { all: true }, title, recipe });
const BAD = add('Starts by month', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'start' } });

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const sent = []; let plan = null;
  await page.route('**/api/ai/graph', async route => {
    let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (_){ body = {}; }
    sent.push(body);
    const retry = /did not apply these/.test(body.query || '');
    const out = plan(retry);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.assign({ visibleIds: null, where: null, action: 'highlight', groupBy: null, note: '', kind: 'map', sent: 1, total: 1, chart: null }, out)) });
  });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { await page.evaluate(() => { intel.history = []; });
    await page.evaluate(async q => { await intelAsk(q); }, q);
    return until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); return a.length ? a.map(m => String(m.text || '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').trim()).join(' / ') : null; }); };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.recipe = {}; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.evaluate(() => { state.aiConfigured = true; });
    if (!(await page.evaluate(() => typeof hbBoardTakesChecked === 'function'))) throw new Error('the board has no checker');

    /* ================= 1. WRONG, THEN FIXED ================= */
    plan = retry => retry ? { actions: [add('Ends by month', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' } })] }
      : { actions: [add('By stream', { pic: 'ring', split: { by: 'folder' } }), BAD], answer: 'Two cards.' };
    const n0 = sent.length;
    const said1 = await ask('build me two cards about the book');
    await until(() => hbS().panels.length === 2 ? true : null);
    const titles = await page.evaluate(() => hbS().panels.map(p => p.title).sort().join('|'));
    check('1a the good card and the fixed card are on the board; the bad one is not', titles === 'By stream|Ends by month', titles);
    check('1b the bad card went back once, with HaTi\'s reason', sent.length - n0 === 2 && /start date is missing for \d+ of \d+ contracts/.test(sent[sent.length - 1].query || ''), (sent[sent.length - 1] || {}).query);
    check('1c the panel says one retry ran', /One retry ran: 1 card went back to Copilot to be fixed\./.test(said1 || ''), said1);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, '1-fixed.png') });

    /* ================= 2. WRONG TWICE ================= */
    await page.evaluate(() => { const s = hbS(); s.panels = []; hbSave(); hbPaintBoard(); });
    plan = () => ({ actions: [BAD] });
    const n1 = sent.length;
    const said2 = await ask('build me a starts card');
    check('2a only one retry was asked', sent.length - n1 === 2, String(sent.length - n1));
    check('2b nothing wrong reached the board', (await page.evaluate(() => hbS().panels.length)) === 0);
    check('2c the panel says why, in one line', /Could not add “Starts by month”: the start date is missing for \d+ of \d+ contracts\./.test(said2 || ''), said2);
    check('2d no band, no dialog', (await page.evaluate(() => !document.querySelector('.modal-backdrop, [role="dialog"], .band, .notice-band'))));
    await page.screenshot({ path: path.join(OUT, '2-refused.png') });
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
