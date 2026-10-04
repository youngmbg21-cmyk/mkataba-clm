/* Chromium verification: COPILOT PRESSES THE BOARD'S BUTTONS, SEVERAL AT ONCE
   (the owner's work order, Part 2, 4 Oct 2026)
   ============================================================
   On Home's board, asked in the panel on the page; Copilot is a stub on the
   route (no key in CI) answering with the board's own actions:
     1. "build me a renewals dashboard" → five actions → five cards on the
        board, each drawn with its own picture, in the order asked; the panel
        says each thing it did, then Copilot's sentence; the map is untouched;
     2. the question went to Copilot with every card's ref;
     3. "turn the Juno card into something round" → change_card by the card's name → that card
        alone is a ring now;
     4. a reload keeps the five cards;
     5. no page errors.
   Waits ask for the state. Screenshots go to test/chromium/shots/copilot-builds/.
   Run: node test/chromium/copilot-builds-the-board-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'copilot-builds');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BOOK = []; let n = 0;
const CPS = ['Juno AB', 'Naivas Supermarkets', 'Juno AB', 'Bidco', 'Sendy'];
const add = (status, o) => { const c = fixtureContract('MK-' + (600 + n), 'Agreement ' + n, CPS[n % CPS.length], n % 2 ? 'proc' : 'sales', 1e6 * (1 + (n % 4)), status); n++;
  c.expiry = dayIn(1 + (n % 11), 12); Object.assign(c, o || {}); BOOK.push(c); };
for (let k = 0; k < 24; k++) add('Signed', { signedAt: dayIn(-1 - (k % 14), 8) + 'T10:00:00.000Z' });
for (let k = 0; k < 5; k++) add('Draft');

const DASH = [
  { do: 'add_card', which: { all: true }, recipe: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, window: { next: 12, unit: 'm', date: 'end' } }, title: 'Ending, next 12 months' },
  { do: 'add_card', which: { q: 'Juno contracts' }, recipe: { pic: 'bars', split: { by: 'status' } }, title: 'Juno by stage' },
  { do: 'add_card', which: { all: true }, recipe: { pic: 'bars', split: { by: 'counterparty' }, top: 3, sort: { by: 'count', dir: 'down' } }, title: 'Top 3 counterparties' },
  { do: 'add_card', which: { q: 'signed contracts' }, recipe: { pic: 'heat', split: { by: 'folder' }, split2: { by: 'counterparty' } }, title: 'Signed by stream and party' },
  { do: 'add_card', which: { all: true }, recipe: { pic: 'blocks', split: { by: 'folder' }, measure: 'value' }, title: 'Value by stream' }];

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
  const sent = []; let reply = null;
  await page.route('**/api/ai/graph', async route => {
    let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (_){ body = {}; }
    sent.push(body);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.assign({
      visibleIds: null, where: null, action: 'highlight', badges: null, groupBy: null, groups: null, note: '', kind: 'map', sent: 1, total: 1, chart: null }, reply)) });
  });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { await page.evaluate(() => { intel.history = []; });
    await page.evaluate(async q => { await intelAsk(q); }, q);
    return until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); return a.length ? a.map(m => String(m.text || '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').trim()).join(' / ') : null; }); };
  const cards = () => page.evaluate(() => [...document.querySelectorAll('#hb-board [data-hb-pid]')].map(el => {
    const p = hbS().panels.find(x => x.id === el.getAttribute('data-hb-pid')) || {};
    const svg = el.querySelector('svg.hb-svg'); return { id: p.id, key: p.key, title: (el.querySelector('.hb-ct') || {}).textContent, svg: svg ? svg.getAttribute('class') : null, bars: !!el.querySelector('.hb-chart-bars') };
  }));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.digBig = false; s.recipe = {}; s.screen = 'dark'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.evaluate(() => { state.aiConfigured = true; });
    if (!(await page.evaluate(() => typeof hbBoardApply === 'function'))) throw new Error('the board has no applier');

    /* ================= 1. FIVE CARDS IN ONE ANSWER ================= */
    const map0 = await page.evaluate(() => JSON.stringify({ g: intel.groupBy, l: (intel.lenses || []).filter(l => !l.hb).length }));
    reply = { actions: DASH, answer: 'A renewals board: what ends when, who it is with, and the money.' };
    const said1 = await ask('build me a renewals dashboard');
    const c1 = await until(() => { const s = hbS(); return s.panels.length === 5 && document.querySelectorAll('#hb-board [data-hb-pid]').length === 5 ? true : null; });
    const list = await cards();
    check('1a five actions built five cards', !!c1 && list.length === 5, JSON.stringify(list.map(x => x.title)));
    check('1b in the order asked, top first', list.map(x => x.title).join('|') === DASH.map(a => a.title).join('|'), list.map(x => x.title).join(' | '));
    check('1c each drawn with its own picture', list.length === 5 && /hb-cols/.test(list[0].svg || '') && list[1].bars && list[2].bars && /hb-heat/.test(list[3].svg || '') && /hb-blocks/.test(list[4].svg || ''), JSON.stringify(list.map(x => x.svg || (x.bars ? 'bars' : null))));
    check('1d the panel says each thing done, then Copilot\'s sentence', (said1 || '').split('\n').filter(l => /^Added “/.test(l.trim())).length === 5 && /A renewals board: what ends when/.test(said1 || ''), said1);
    check('1e the map is untouched', (await page.evaluate(() => JSON.stringify({ g: intel.groupBy, l: (intel.lenses || []).filter(l => !l.hb).length }))) === map0, map0);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '1-five-cards.png'), fullPage: false });
    await page.evaluate(() => { const h = document.getElementById('hb-board'); h.scrollTop = h.scrollHeight; });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '1-five-cards-lower.png') });

    /* ================= 2. COPILOT WAS SHOWN THE BOARD'S CARDS ================= */
    reply = { actions: [{ do: 'change_card', card: 'Juno by stage', recipe: { pic: 'ring' } }], answer: '' };
    await ask('turn the Juno card into something round');
    const board = (sent[sent.length - 1] && sent[sent.length - 1].screen && sent[sent.length - 1].screen.board) || '';
    const ids = list.map(x => x.id);
    const guide = (sent[sent.length - 1] && sent[sent.length - 1].screen && sent[sent.length - 1].screen.guide) || '';
    check('2b and with the data guide: what each field holds', /^Data guide/.test(guide) && /Signing date \(date signed\): \d+ of \d+ signed have one/.test(guide), guide.split('\n').slice(0, 3).join(' | '));
    check('2a the question went with every card\'s ref', ids.length === 5 && ids.every(id => board.includes(id + ': ')) && /Cards on the board, top first/.test(board), board.split('\n').filter(l => /Cards on the board/.test(l)).join(' ').slice(0, 300));

    /* ================= 3. ONE CARD CHANGED BY ITS NAME ================= */
    const c3 = await until(() => { const p = hbS().panels.find(x => x.title === 'Juno by stage'); const el = p && document.querySelector(`[data-hb-pid="${p.id}"] svg.hb-ring`);
      return el ? { pic: hbPlan(hbDigData(p.key, hbS().lens)).pic, others: hbS().panels.filter(x => x !== p).map(x => hbPlan(hbDigData(x.key, hbS().lens)).pic).sort().join(',') } : null; });
    check('3a that card alone is a ring now', !!c3 && c3.pic === 'ring' && c3.others === 'bars,blocks,cols,heat', JSON.stringify(c3));

    /* ================= 4. A RELOAD KEEPS THEM ================= */
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0, null, { timeout: 20000 });
    await page.evaluate(() => setView('dashboard'));
    const c4 = await until(() => document.querySelectorAll('#hb-board [data-hb-pid]').length === 5 ? [...document.querySelectorAll('#hb-board [data-hb-pid] .hb-ct')].map(x => x.textContent).join('|') : null, null, 12000);
    check('4a a reload keeps the five cards and their names', c4 === DASH.map(a => a.title).join('|'), c4);
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
