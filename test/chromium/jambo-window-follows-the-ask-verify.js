/* Chromium verification: THE JAMBO WINDOW FOLLOWS THE ASK
   ============================================================
   The owner, 18 Oct 2026: "are there any other jambos with limitations?" …
   "yes, fix all four". The window behind the top bar's Jambo door (the
   phone's Jambo too), driven through its own box, with the provider scripted
   (startScriptedAi) so what Jambo is SENT is read where it lands:
     1. a question goes with today's day and weekday — the page's own day
     2. "what does the portfolio report say…?" is answered; "build me a
        portfolio health report" opens the report, no model asked
     3. "book a meeting with Naivas on Tuesday at 2pm" opens the Calendar and
        its Jambo is asked the same words; the window says where it went;
        "am I free on Friday afternoon?" goes the same way
     4. with a rewrite card open, a question is answered as a question (the
        card's words beside it, the card still open); "make it shorter" still
        revises the card
     5. the window with the card and an answer, at the owner's three screens:
        it stays inside the page
     6. no page errors
   Waits ask for the state, bounded. Red at main 25f73d70: 1, 2a, 2b, 3a–3d,
   4a, 4b, 4d.
   Screenshots: test/chromium/shots/jambo-window-follows-the-ask/ (or HATI_SHOT_DIR).
   Run: node test/chromium/jambo-window-follows-the-ask-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-window-follows-the-ask');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const deliver = answer => [{ type: 'tool_use', id: 'tu_w', name: 'deliver_answer', input: { answer, citations: [] } }];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const waitCalls = async n => { const t0 = Date.now(); while (Date.now() - t0 < 10000 && ai.calls.length < n) await page.waitForTimeout(120); return ai.calls.length >= n; };
    const chatSystem = () => { const c = ai.calls.filter(x => x.body && Array.isArray(x.body.tools) && x.body.tools.some(t => t.name === 'deliver_answer')).slice(-1)[0];
      return c ? JSON.stringify(c.body.system || '') : ''; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    await page.waitForTimeout(600);
    /* the window opens on a page that is not Home (on Home his own panel takes the ask) */
    const toWindow = async () => { await page.evaluate(() => { setView('approvals'); ai.history = []; openAI(); });
      return until(() => document.getElementById('ai-panel').classList.contains('open') && !!document.getElementById('ai-input') && !ai.busy); };
    const winAsk = async q => { await page.fill('#ai-input', q); await page.evaluate(() => aiSubmit()); };
    const lastSaid = () => page.evaluate(() => { const m = ai.history.filter(x => x.role === 'assistant').slice(-1)[0]; return m ? String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''; });

    console.log('\n1 · the day goes with the question');
    check('1 · the window is open', !!(await toWindow()));
    ai.reset(); ai.script(deliver('Two expire this month.'));
    await winAsk('what expires this month?');
    await waitCalls(1);
    const day = await page.evaluate(() => { const d = todayISO(); return { d, wd: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(d + 'T12:00:00Z').getUTCDay()] }; });
    const sys1 = chatSystem();
    check('1 the chat is told the reader\'s own day and its weekday', sys1.includes(`TODAY: ${day.wd} ${day.d}.`), sys1 ? (sys1.match(/TODAY:[^.]*\./) || ['no TODAY line'])[0] : 'no chat call');
    await until(() => !ai.busy);

    console.log('\n2 · the report opens only when it is asked for');
    await page.evaluate(() => { window.__rep = 0; window.openHealthReport = () => { window.__rep++; return true; }; });
    ai.reset(); ai.script(deliver('It shows four obligations late.'));
    await winAsk('What does the portfolio report say about late obligations?');
    await waitCalls(1); await until(() => !ai.busy);
    const rep1 = await page.evaluate(() => window.__rep);
    check('2a a question about the report is answered, not turned into the report', rep1 === 0 && ai.calls.length === 1, `report opened ${rep1}×, Jambo asked ${ai.calls.length}×`);
    ai.reset();
    await winAsk('Build me a portfolio health report');
    const rep2 = await until(() => window.__rep === 1);
    check('2b asked for by name, the report opens and no model is asked', !!rep2 && ai.calls.length === 0, `report ${rep2 ? 'opened' : 'not opened'}, Jambo asked ${ai.calls.length}×`);

    console.log('\n3 · a booking goes to the Calendar\'s Jambo');
    await page.evaluate(() => {
      const real = window.api; window.__plan = [];
      window.api = async (p, m, b) => { if (p === 'ai/plan'){ window.__plan.push(b && b.ask); return { kind: 'answer', say: 'Tuesday at 14:00 is free.', points: [] }; } return real(p, m, b); };
    });
    await toWindow();
    ai.reset();
    await winAsk('book a meeting with Naivas on Tuesday at 2pm');
    const went = await until(() => calOnScreen() && window.__plan.length ? window.__plan.slice() : null, null, 10000);
    check('3a the Calendar opens and its Jambo is asked the same words', !!went && went[0] === 'book a meeting with Naivas on Tuesday at 2pm', JSON.stringify(went));
    const said3 = await lastSaid();
    const want3 = await page.evaluate(() => i18t('ig_cal_handoff'));
    check('3b the window says where it went', said3 === want3, said3);
    check('3c and the chat was not asked', ai.calls.length === 0, `${ai.calls.length}×`);
    await toWindow();
    await page.evaluate(() => { window.__plan.length = 0; });
    await winAsk('am I free on Friday afternoon?');
    const free = await until(() => calOnScreen() && window.__plan.length ? window.__plan.slice() : null, null, 10000);
    check('3d a question about one\'s own calendar goes there too', !!free && free[0] === 'am I free on Friday afternoon?', JSON.stringify(free));

    console.log('\n4 · a question goes past an open rewrite card');
    await toWindow();
    await page.evaluate(() => { window.__refined = [];
      aiOpenProposal({ proposedText: 'Liability is capped at twice the fees paid in the prior 12 months.', replacing: 'Liability is capped at fees paid.',
        clauseLabel: 'Limitation of liability', advice: 'This doubles the cap.', onRefine: async q => { window.__refined.push(q); return null; } }); });
    const open = await until(() => !!aiActiveProposal());
    check('4 · a card is open', !!open);
    ai.reset(); ai.script(deliver('Three contracts expire this month.'));
    await winAsk('how many contracts expire this month?');
    await waitCalls(1); await until(() => !ai.busy);
    const st = await page.evaluate(() => ({ refined: window.__refined.slice(), stillOpen: !!aiActiveProposal() }));
    const sys4 = chatSystem();
    check('4a the question is answered by Jambo, not made into a rewrite', ai.calls.length === 1 && st.refined.length === 0, JSON.stringify({ asked: ai.calls.length, refined: st.refined }));
    check('4b the card\'s words go with it', sys4.includes('A rewrite card is open in their Jambo window for \\"Limitation of liability\\"'));
    check('4c and the card is still open', st.stillOpen);
    ai.reset();
    await winAsk('make it shorter');
    const ref = await until(() => window.__refined.length ? window.__refined.slice() : null);
    check('4d an instruction still revises the card', !!ref && ref[0] === 'make it shorter' && ai.calls.length === 0, JSON.stringify({ ref, asked: ai.calls.length }));
    await until(() => !ai.busy);

    console.log('\n5 · the window at the owner\'s three screens');
    const fit = [];
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(300);
      fit.push(await page.evaluate(() => { const p = document.getElementById('ai-panel').getBoundingClientRect();
        return { w: innerWidth, h: innerHeight, inside: p.left >= -1 && p.top >= -1 && p.right <= innerWidth + 1 && p.bottom <= innerHeight + 1 }; }));
      await page.screenshot({ path: path.join(OUT, `window-${w}x${hgt}.png`) }); }
    check('5 the window stays inside the page at all three', fit.every(f => f.inside), JSON.stringify(fit));
    check('6 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run stopped', false, e && e.message);
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
