/* Chromium verification: COPILOT ACCURACY (work order "the board that answers
   right", Part 7, 5 Oct 2026; screen 0 of the sketches)
   ============================================================
   With a stand-in Copilot that answers every question with one ring by stage:
     1. a weekly run (pressed through the admin route) is recorded;
     2. Settings › Platform settings › Copilot accuracy shows three tiles —
        the free reader's book, Copilot's score, disconnects this week;
     3. Copilot's misses are listed, each with "Add a word";
     4. a reply somebody marked wrong is listed; "Keep as a test" settles it
        and it leaves the list;
     5. no page errors.
   Run: node test/chromium/copilot-accuracy-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, startScriptedAi, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'copilot-accuracy');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const ring = { content: [{ type: 'tool_use', id: 'tu', name: 'render_graph', input: { actions: [{ do: 'add_card', which: 'all', recipe: { pic: 'ring', split: 'stage' } }], note: 'x' } }] };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, ANTHROPIC_API_KEY: 'test-key-not-real' });
  const W = await seedWorkspace(h, { contracts: [fixtureContract('MK-700', 'Agreement', 'Juno AB', 'sales', 1e6, 'Draft')], approvalRules: [] });
  for (let i = 0; i < 80; i++) ai.script(ring);
  const run = await W.admin.json('/api/board/accuracy/run', { method: 'POST', body: {} });
  check('1 a run is recorded', run && run.total > 0 && run.asked === run.total, JSON.stringify({ total: run.total, hits: run.hits }));
  await W.unrestricted.json('/api/board/feedback', { method: 'POST', body: { kind: 'wrong', q: 'payment terms for suppliers', recipe: { pic: 'ring', split: { by: 'status' }, measure: 'count' }, said: 'All contracts: 9 contracts' } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now(); while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && typeof isAdmin === 'function' && isAdmin(), null, { timeout: 20000 });
    await page.evaluate(() => openSettingsAt('platform', 'boardaccuracy'));
    const s2 = await until(() => { const h = document.getElementById('st-acc'); if (!h || !h.textContent.trim()) return null; const tiles = [...h.firstElementChild.children].map(t => t.textContent.replace(/\s+/g, ' ').trim()); return { tiles, sub: (document.getElementById('st-acc-sub') || {}).textContent }; });
    await page.screenshot({ path: path.join(OUT, '2-drawer.png') });
    check('2 three tiles: the free reader\'s book, Copilot\'s score, disconnects', !!s2 && s2.tiles.length === 3 && /Free reader/.test(s2.tiles[0]) && new RegExp('Copilot · ' + run.hits + ' of ' + run.asked + ' right').test(s2.tiles[1]) && /Disconnects/.test(s2.tiles[2]) && /every Monday/.test(s2.sub), JSON.stringify(s2));
    const s3 = await page.evaluate(() => { const h = document.getElementById('st-acc'); return { words: h.querySelectorAll('[data-acc-word]').length, text: h.textContent }; });
    check('3 Copilot\'s misses are listed, each with "Add a word"', s3.words >= Math.min(30, run.total - run.hits) && /Copilot misses/.test(s3.text), s3.words);
    const s4 = await page.evaluate(() => !!document.querySelector('[data-acc-keep]') && /payment terms for suppliers/.test(document.getElementById('st-acc').textContent));
    await page.click('[data-acc-keep]');
    const s4b = await until(() => { const t = document.getElementById('st-acc').textContent; return !/“payment terms for suppliers”/.test(t) && /1 question is kept as a test/.test(t) ? true : null; });
    await page.screenshot({ path: path.join(OUT, '4-kept.png') });
    check('4 a reply marked wrong is listed, and "Keep as a test" settles it', s4 && s4b, `${s4} ${s4b}`);
    check('5 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('stage ran', false, e.message); }
  finally { await browser.close(); await h.stop(); await ai.stop(); const bad = results.filter(r => !r.pass); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0); }
})();
