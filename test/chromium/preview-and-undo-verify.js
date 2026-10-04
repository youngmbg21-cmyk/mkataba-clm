/* Chromium verification: PREVIEW BIG BUILDS, AND ONE-PRESS UNDO (the owner's
   work order, Part 5, 4 Oct 2026)
   ============================================================
   On Home's board; Copilot is a stub on the route (no key in CI):
     1. five cards offered as a list with ticks; nothing on the board;
     2. two unticked, "Add chosen" → exactly the three ticked land; the panel's
        answer becomes what was done, with Undo;
     3. Undo → the board is back as it was (no cards);
     4. a free question, then Ctrl+Z on the board → back again;
     5. a refresh keeps the board and its undo store (the owner's rule);
     6. no page errors.
   Run: node test/chromium/preview-and-undo-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'preview-and-undo');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = [];
for (let k = 0; k < 18; k++){ const c = fixtureContract('MK-' + (800 + k), 'Agreement ' + k, ['Juno AB', 'Naivas', 'Bidco'][k % 3], k % 2 ? 'proc' : 'sales', 1e6, k % 3 ? 'Signed' : 'Draft'); BOOK.push(c); }
const add = (title, recipe) => ({ do: 'add_card', which: { all: true }, title, recipe });
const FIVE = [add('By stage', { pic: 'ring', split: { by: 'status' } }), add('By stream', { pic: 'bars', split: { by: 'folder' } }), add('By party', { pic: 'bars', split: { by: 'counterparty' } }),
  add('Money by stream', { pic: 'blocks', split: { by: 'folder' }, measure: 'value' }), add('Stream and stage', { pic: 'heat', split: { by: 'folder' }, split2: { by: 'status' } })];

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
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/ai/graph', route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ visibleIds: null, where: null, action: 'highlight', groupBy: null, note: '', kind: 'map', sent: 1, total: 1, chart: null, actions: FIVE, answer: 'Five views of the book.' }) }));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const titles = () => page.evaluate(() => hbS().panels.map(p => p.title).sort().join('|'));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.recipe = {}; s.undo = []; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.evaluate(() => { state.aiConfigured = true; intel.history = []; });
    if (!(await page.evaluate(() => typeof hbUndo === 'function'))) throw new Error('the board has no undo');

    /* ================= 1. FIVE OFFERED ================= */
    await page.evaluate(async () => { await intelAsk('build me a board about the book'); });
    const rows = await until(() => { const r = document.querySelectorAll('.hb-pv [data-hb-pv-item]'); return r.length ? r.length : null; });
    check('1a five cards offered as a list with ticks', rows === 5, String(rows));
    check('1b nothing on the board yet', (await page.evaluate(() => hbS().panels.length)) === 0);

    /* ================= 2. UNTICK TWO, ADD CHOSEN ================= */
    await page.evaluate(() => { const r = document.querySelectorAll('.hb-pv [data-hb-pv-item]'); r[1].click(); r[3].click(); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, '1-untick-two.png') });
    await page.click('.hb-pv [data-hb-pv="chosen"]');
    const t2 = await until(() => hbS().panels.length === 3 ? hbS().panels.map(p => p.title).sort().join('|') : null);
    check('2a exactly the three ticked landed', t2 === 'By party|By stage|Stream and stage', t2);
    const ans = await until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant').slice(-1)[0]; return a && !a.preview && document.querySelector('.hb-undo') ? String(a.text).replace(/<br>/g, '\n').replace(/<[^>]+>/g, ' ') : null; });
    check('2b the answer says what was done and offers Undo', /Added “By stage”/.test(ans || '') && /2 were left out, as chosen\./.test(ans || ''), ans);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, '2-three-added.png') });

    /* ================= 3. UNDO ================= */
    await page.click('.hb-undo');
    check('3a Undo puts the board back as it was', await until(() => hbS().panels.length === 0 && !document.querySelector('#hb-board [data-hb-pid]')));

    /* ================= 4. CTRL+Z AFTER A FREE QUESTION ================= */
    await page.evaluate(async () => { await intelAsk('contracts by stream'); });
    await until(() => (hbS().path || []).length === 1 ? true : null);
    await page.click('#hb-board .hb-note').catch(() => {});
    await page.keyboard.press('Control+z');
    check('4a Ctrl+Z on the board undoes the free question\'s card', await until(() => (hbS().path || []).length === 0));
    await page.evaluate(() => { document.querySelector('#igd-input') && document.querySelector('#igd-input').focus(); });
    const u4 = await page.evaluate(() => hbShapeOf(hbS()) + '#' + (hbS().undo || []).length);
    await page.keyboard.type('x'); await page.keyboard.press('Control+z');
    check('4b Ctrl+Z in the question box is the box\'s own: the board is not touched', (await page.evaluate(() => hbShapeOf(hbS()) + '#' + (hbS().undo || []).length)) === u4);

    /* ================= 5. A REFRESH KEEPS IT ================= */
    await page.evaluate(() => { const r = hbBoardApply([{ do: 'add_card', which: { all: true }, title: 'Kept', recipe: { pic: 'ring', split: { by: 'status' } } }]); return r; });
    const n0 = await page.evaluate(() => (hbS().undo || []).length);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0, null, { timeout: 20000 });
    await page.evaluate(() => setView('dashboard'));
    const after = await until(() => document.querySelector('#hb-board [data-hb-pid]') ? { t: hbS().panels.map(p => p.title).join('|'), u: (hbS().undo || []).length } : null, null, 12000);
    check('5a a refresh keeps the board and what can be undone', !!after && after.t === 'Kept' && after.u === n0, JSON.stringify({ after, n0 }));
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
