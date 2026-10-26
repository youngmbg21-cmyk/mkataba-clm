/* Chromium verification: JAMBO READS THE HANDBOOK, ON EVERY PAGE (owner, 26 Oct 2026: asked "what is the handbook
   about?" on the Handbook page, Jambo summarised the contracts; "we are looking to address the issue across HaTi
   not just the handbook")
   ============================================================
   Driven with a scripted model, so what the model is handed and what is drawn are read where they land.
     A  the Handbook page: the model is told the rule, the chapter being read and the chapters of the page; the
        search hands it the book's own words; the answer stays in the panel with "Handbook › …" under it; the press
        opens the book
     B  the Obligations page: "what can I do here?" — the model is told the page's chapters (5.1 first); the
        chapter's button lands on 5.1
     C  the ✦ window on Home: a question about a setting ("what does an exchange rate do in hati?") gets the same button, in the window
     D  photos at the owner's three screens; the button is the painted thing, inside the panel, on one line; no errors
   Run: node test/chromium/jambo-reads-the-handbook-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'jambo-reads-the-handbook');
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const search = (words, id) => [{ type: 'tool_use', id: id || 'tu_s', name: 'search_hati', input: { words, kinds: ['guide'] } }];
const deliver = (answer, chapter) => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer, citations: [], goto: { task: 'needs', door: { kind: 'chapter', chapter } } } }];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const waitCalls = async n => { const t0 = Date.now(); while (Date.now() - t0 < 12000 && ai.calls.length < n) await page.waitForTimeout(120); return ai.calls.length >= n; };
    const sent = i => JSON.stringify((ai.calls[i] || {}).body || {});
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    await page.waitForTimeout(500);
    /* the panel's button: painted, inside the panel, on one line */
    const button = sel => page.evaluate(s => {
      const b = [...document.querySelectorAll(s)].filter(x => /^(Handbook|Handboken) › /.test(x.textContent.trim())).pop(); if (!b) return null;
      b.scrollIntoView({ block: 'nearest' });
      const r = b.getBoundingClientRect(), host = b.closest('#ins-panel, #ig-dock, #ai-panel, .ai-win, [data-ai-win]') || document.body, hr = host.getBoundingClientRect();
      const mid = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { text: b.textContent.trim(), inside: r.left >= hr.left - 1 && r.right <= hr.right + 1, oneLine: r.height <= 40, painted: !!mid && (mid === b || b.contains(mid)) };
    }, sel);
    const askPanel = async q => { await page.fill('#jl-q', q); await page.press('#jl-q', 'Enter'); };

    console.log('\nA · the Handbook page');
    await page.evaluate(() => { if (window.ai && ai.open) closeAI(); ai.history = []; hbkOpen('7.4'); });
    await until(() => state.view === 'handbook' && !!document.getElementById('jl-q') ? true : null);
    ai.reset(); ai.script(search('handbook instructions')); ai.script(deliver('The Handbook is HaTi\'s instruction book: 43 chapters in 8 parts, in the order a contract lives.', 'about'));
    await askPanel('what is the handbook about?');
    await waitCalls(2);
    const A = await until(() => { const t = document.querySelector('#jl-feed') ? document.querySelector('#jl-feed').textContent : ''; return /43 chapters in 8 parts/.test(t) ? { view: state.view } : null; });
    check('A1 the model is told the rule (HaTi itself is answered from the Handbook)', /HaTi ITSELF IS ANSWERED FROM THE HANDBOOK/.test(sent(0)));
    check('A2 …the chapter being read, and the chapters of this page', /They are reading the Handbook chapter \\"7\.4 Money: currencies and rates\\"/.test(sent(0)) && /The Handbook chapters that cover this page: 0\.5/.test(sent(0)), (sent(0).match(/They are reading[^.]*\./) || [''])[0]);
    check('A3 the search hands the model the book\'s own words', /The Handbook is HaTi's own instruction book/.test(sent(1)));
    check('A4 the answer stands in the panel, and nobody was moved', !!A && A.view === 'handbook', JSON.stringify(A));
    const bA = await until(() => [...document.querySelectorAll('#ins-panel button, #jl-feed button')].some(x => /^Handbook › /.test(x.textContent.trim())) ? true : null);
    const mA = bA ? await button('#ins-panel button, #jl-feed button') : null;
    check('A5 "Handbook › The Handbook" under the answer: painted, inside the panel, one line', !!mA && /^Handbook › The Handbook$/.test(mA.text) && mA.inside && mA.oneLine && mA.painted, JSON.stringify(mA));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(300);
      const m = await button('#ins-panel button, #jl-feed button'); check(`A6 at ${w}×${hh} the button is inside the panel, one line, painted`, !!m && m.inside && m.oneLine && m.painted, JSON.stringify(m));
      await page.screenshot({ path: path.join(OUT, `A-handbook-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.evaluate(() => { const b = [...document.querySelectorAll('#ins-panel button, #jl-feed button')].filter(x => /^Handbook › /.test(x.textContent.trim())).pop(); if (b) b.click(); });
    const A7 = await until(() => state.view === 'handbook' && hbkPlace().chapter === null ? hbkPlace() : null);
    check('A7 the press opens the book\'s front', !!A7, JSON.stringify(A7));

    console.log('\nB · the Obligations page');
    await page.evaluate(() => { ai.history = []; setView('obligations'); });
    await until(() => state.view === 'obligations' && !!document.getElementById('jl-q') && document.getElementById('jl-q').getClientRects().length > 0 ? true : null);
    ai.reset(); ai.script(search('obligations duties mark done')); ai.script(deliver('Here you see every duty, week by week: 1. Pick a week. 2. Press the one word on a row to do it.', '5.1'));
    await askPanel('what can I do here?');
    await waitCalls(2);
    check('B1 the model is told this page\'s chapters, the owner first', /The Handbook chapters that cover this page: 5\.1 Obligations, week by week; 5\.2/.test(sent(0)), (sent(0).match(/The Handbook chapters that cover this page:[^.]*\./) || [''])[0]);
    const bB = await until(() => [...document.querySelectorAll('#ins-panel button, #jl-feed button')].some(x => /^Handbook › 5\.1 /.test(x.textContent.trim())) ? true : null);
    const mB = bB ? await button('#ins-panel button, #jl-feed button') : null;
    check('B2 "Handbook › 5.1 …" under the answer, painted, inside the panel', !!mB && /^Handbook › 5\.1 Obligations/.test(mB.text) && mB.inside && mB.painted, JSON.stringify(mB));
    await page.screenshot({ path: path.join(OUT, 'B-obligations-1440x780.png') });
    await page.evaluate(() => { const b = [...document.querySelectorAll('#ins-panel button, #jl-feed button')].filter(x => /^Handbook › 5\.1/.test(x.textContent.trim())).pop(); if (b) b.click(); });
    const B3 = await until(() => state.view === 'handbook' && hbkPlace().chapter === '5.1' ? true : null);
    check('B3 the press lands on chapter 5.1', !!B3);

    console.log('\nC · the ✦ window on Home');
    await page.evaluate(() => { ai.history = []; setView('dashboard'); hbSetFace('board'); if (!(ai.open && ai.win)) openAI(null, { win: true }); });
    await until(() => state.view === 'dashboard' && ai.open && !!document.getElementById('ai-input') && document.getElementById('ai-input').getClientRects().length > 0 ? true : null);
    ai.reset(); ai.script(search('exchange rates currency who can change admin')); ai.script(deliver('An exchange rate turns a contract in another currency into the home currency for the totals; only an admin sets one.', '7.4'));
    await page.fill('#ai-input', 'what does an exchange rate do in hati?'); await page.evaluate(() => aiSubmit());
    await waitCalls(2);
    const bC = await until(() => [...document.querySelectorAll('[data-ai-choice], [data-ig-choice]')].some(x => /^Handbook › 7\.4 /.test(x.textContent.trim())) ? true : null);
    const mC = bC ? await button('[data-ai-choice], [data-ig-choice]') : null;
    check('C1 the window\'s answer carries "Handbook › 7.4 …", painted', !!mC && /^Handbook › 7\.4 Money/.test(mC.text) && mC.painted, JSON.stringify(mC));
    check('C2 the rule reached the model from the window too', /HaTi ITSELF IS ANSWERED FROM THE HANDBOOK/.test(sent(0)));
    await page.screenshot({ path: path.join(OUT, 'C-window-1440x780.png') });

    check('D no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { console.error(e); failures++; }
  finally { await browser.close(); await h.stop(); await ai.stop(); }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
