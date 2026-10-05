/* Chromium verification: SEE IT WHILE YOU TYPE (work order "the board that
   answers right", Part 10, 5 Oct 2026; screen 6 of the sketches)
   ============================================================
     1. on Home's board the ask area holds the line's room before a word is
        typed;
     2. typing "contracts by stage" says, after the pause, what will be drawn
        and that it is free — and nothing on the board changed;
     3. typing a question HaTi hands on says "Copilot will read this one";
     4. the panel, the box and the feed above it did not move or change size;
     5. asking it draws what the line said;
     6. no page errors.
   Run: node test/chromium/see-it-while-you-type-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'see-it-while-you-type');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = ['Draft', 'Under Review', 'Signed', 'Signed'].map((st, i) => fixtureContract('MK-' + (660 + i), 'Agreement ' + i, ['Juno AB', 'Baltic Oy'][i % 2], i % 2 ? 'proc' : 'sales', 1e6, st));
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now(); while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(100); } return v; };
  const box = () => page.evaluate(() => { const r = el => { const b = el && el.getBoundingClientRect(); return b ? [Math.round(b.top), Math.round(b.height)] : null; };
    return { input: r(document.getElementById('igd-input')), pre: r(document.getElementById('igd-pre')), feed: r(document.getElementById('igd-feed')) }; });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && state.contracts.length === ids.length && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.screen = 'dark'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('igd-pre') && document.getElementById('hb-board') ? true : null);
    await page.waitForTimeout(400);
    const b0 = await box(); const board0 = await page.evaluate(() => JSON.stringify(hbS()));
    check('1 the line\'s room is there before a word is typed', !!b0.pre && b0.pre[1] === 16, JSON.stringify(b0));
    await page.click('#igd-input'); await page.keyboard.type('contracts by stage', { delay: 20 });
    const s2 = await until(() => { const t = document.getElementById('igd-pre').textContent; return / · Free$/.test(t) ? t : null; });
    const board2 = await page.evaluate(() => JSON.stringify(hbS()));
    const b2 = await box();
    await page.screenshot({ path: path.join(OUT, '2-free.png') });
    check('2 the line says what will be drawn, free — and the board is untouched', s2 === 'All contracts: Ring · by stage · count · Free' && board2 === board0, JSON.stringify({ s2, same: board2 === board0 }));
    await page.fill('#igd-input', ''); await page.keyboard.type('how quickly do we close deals in each stream', { delay: 10 });
    const s3 = await until(() => { const t = document.getElementById('igd-pre').textContent; return /Copilot/.test(t) ? t : null; });
    const b3 = await box();
    await page.screenshot({ path: path.join(OUT, '3-copilot.png') });
    check('3 a question Copilot answers says so, with no price', s3 === 'Copilot will read this one', s3);
    check('4 nothing moved: the box, the line and the feed hold their places', JSON.stringify(b0) === JSON.stringify(b2) && JSON.stringify(b0) === JSON.stringify(b3), JSON.stringify({ b0, b2, b3 }));
    await page.fill('#igd-input', 'contracts by stage'); await page.keyboard.press('Enter');
    const s5 = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; if (!k) return null; return hbHowWord(hbPlan(hbDigData(k, s.lens))); });
    await page.screenshot({ path: path.join(OUT, '5-asked.png') });
    check('5 asking draws what the line said', s5 === 'Ring · by stage · count', s5);
    check('6 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('stage ran', false, e.message); }
  finally { await browser.close(); await h.stop(); const bad = results.filter(r => !r.pass); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0); }
})();
