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
const { startHati, seedWorkspace, fixtureContract, chipEnter } = require('../helpers');

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
    /* RE-POINTED 28 Oct 2026 (owner picked "Door above the box"): with a brain set, every sentence typed is the brain's,
       so the line promises nothing free (igPrePaint, igBoardTalkFirst); it is the box's reading where no key is set */
    const quiet = await page.evaluate(async () => { const i = document.getElementById('igd-input'); i.value = 'contracts by stage'; igPrePaint(); const t = document.getElementById('igd-pre').textContent; i.value = ''; igPrePaint(); return t; });
    check('0 with a brain set, the line promises nothing free', quiet.trim() === '', JSON.stringify(quiet));
    await page.evaluate(() => { state.aiConfigured = false; });
    await page.waitForTimeout(400);
    const b0 = await box(); const board0 = await page.evaluate(() => JSON.stringify(hbS()));
    /* RETIRED 16 Nov 2026 (#762): 1 "the line's room is there before a word is typed" — in the new look the line takes no
       room until it has words (owner, 9 Nov 2026: ONE GAP ABOVE EVERY JAMBO BOX, index.html .igd-foot > .hb-pre:empty) */
    await page.click('#igd-input'); await page.keyboard.type('contracts by stage', { delay: 20 });
    const s2 = await until(() => { const t = document.getElementById('igd-pre').textContent; return /^All contracts: Ring · by stage · count$/.test(t) ? t : null; }); /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */ 
    const board2 = await page.evaluate(() => JSON.stringify(hbS()));
    const b2 = await box();
    await page.screenshot({ path: path.join(OUT, '2-free.png') });
    check('2 the line says what will be drawn, no cost — and the board is untouched', s2 === 'All contracts: Ring · by stage · count' && board2 === board0, JSON.stringify({ s2, same: board2 === board0 }));
    await page.fill('#igd-input', ''); /* a question that fits on ONE line: since the two-row card (20 Oct 2026) words that wrap grow the box on purpose, which is not what this check is about */
    await page.keyboard.type('how fast do we close deals', { delay: 10 });
    const s3 = await until(() => { const t = document.getElementById('igd-pre').textContent; return /Jambo/.test(t) ? t : null; });
    const b3 = await box();
    await page.screenshot({ path: path.join(OUT, '3-copilot.png') });
    check('3 a question Copilot answers says so, with no price', s3 === 'Jambo will read this one', s3);
    /* RE-POINTED 16 Nov 2026 (#762): the line now takes its room when it has words (owner, 9 Nov 2026), from the feed's
       foot — so what must not move is the box and the top of the feed; the line stands one line tall above the box */
    const held = b => JSON.stringify(b.input) === JSON.stringify(b0.input) && b.feed && b0.feed && b.feed[0] === b0.feed[0]
      && (!b.pre || !b.pre[1] || (b.pre[1] === 16 && b.pre[0] + b.pre[1] <= b.input[0]));
    check('4 nothing moved: the box and the feed\'s top hold their places; the line sits one line tall above the box', held(b2) && held(b3), JSON.stringify({ b0, b2, b3 }));
    /* RE-PINNED 28 Oct 2026 ("Door above the box"): the free reader, asked as a chip asks */ await page.fill('#igd-input', 'contracts by stage'); await chipEnter(page, '#igd-input');
    const s5 = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; if (!k) return null; return hbHowWord(hbPlan(hbDigData(k, s.lens))); });
    await page.screenshot({ path: path.join(OUT, '5-asked.png') });
    check('5 asking draws what the line said', s5 === 'Ring · by stage · count', s5);
    check('6 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('stage ran', false, e.message); }
  finally { await browser.close(); await h.stop(); const bad = results.filter(r => !r.pass); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0); }
})();
