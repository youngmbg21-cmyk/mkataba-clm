/* Chromium verification: A QUESTION ON THE BOARD STAYS ON THE BOARD (owner, 24 Oct 2026: "when i write 'what
   should i be concerned with today' in the jambo in this page, i am kicked out and dropped to the home page")
   ============================================================
   Jambo's answer may carry a trip to "needs" (what waits on me). With the Board in front, the Board's own Needs
   you card under Your book is all of it: the trip lands there (hbNeedsOpen), and the answer it was said under
   stays in front in the panel it was asked in (aiGotoRun keeps the conversation). Driven with a scripted model.
     A  asked in the Board's panel: still Home's Board, never the Home page; one chat call
     C  the answer is in the panel, its conversation in front (the server dropped the trip, f873)
     B  "take me to what needs me" still goes: on the Board, to the Board's own Needs you, the line under the answer
     F–G the same question beside Explorer and in the ✦ window off Home stays where it was asked
     D  "needs" typed off the Board (Explorer) still goes to the Home page, as before
     E  photos at the owner's three screens; no page errors
   Run: node test/chromium/question-stays-on-the-board-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'question-stays-on-the-board');
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };

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
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    await page.evaluate(() => { setView('dashboard'); intel.paper = null; hbSetFace('board'); });
    const ready = await until(() => state.view === 'dashboard' && hbS().face === 'board' && !!document.getElementById('igd-input') && !!document.getElementById('hm-agents'));
    check('the Board is in front with its Needs you card', !!ready);

    console.log('\nA–C · a question whose answer takes you to what needs you');
    ai.reset(); ai.script([{ type: 'tool_use', id: 'tu_n', name: 'deliver_answer', input: { answer: 'Three things deserve attention today.', citations: [], goto: { task: 'needs' } } }]);
    await page.fill('#igd-input', 'what should i be concerned with today');
    await page.click('#igd-go');
    const said = await until(() => !intel.busy && /Three things deserve attention/.test((document.getElementById('ig-dock') || {}).innerText || '') ? true : null, null, 10000);
    await page.waitForTimeout(500);
    const A = await page.evaluate(() => ({ view: state.view, face: hbS().face }));
    check('A1 still Home\'s Board, never the Home page', A.view === 'dashboard' && A.face === 'board', JSON.stringify(A));
    check('A2 one chat call', ai.calls.length === 1, `${ai.calls.length}×`);
    const C = await page.evaluate(() => { const t = (document.getElementById('ig-dock') || {}).innerText || ''; return { answer: /Three things deserve attention/.test(t), talk: typeof pdTalkShows === 'function' && pdTalkShows() }; });
    check('C the answer stands in the panel, its conversation in front', !!said && C.answer && C.talk, JSON.stringify(C));
    /* a trip that WAS asked for ("take me to…") still goes — on the Board, to the Board's own Needs you, free */
    ai.reset();
    await page.fill('#igd-input', 'take me to what needs me'); await page.click('#igd-go');
    const B = await until(() => { const r = document.getElementById('hm-agents')?.getBoundingClientRect(); const m = intel.history.slice(-1)[0];
      return !intel.busy && m && String(m.text || '').includes(i18t('ca_go_needs')) && r ? { view: state.view, face: hbS().face, top: Math.round(r.top), bottom: Math.round(r.bottom), h: innerHeight } : null; }, null, 10000);
    check('B1 "take me to what needs me": still the Board, its own Needs you in view, nothing spent', !!B && B.view === 'dashboard' && B.face === 'board' && B.top < B.h && B.bottom > 0 && ai.calls.length === 0, JSON.stringify(B));
    /* Jambo's own trip to it, said under his answer (aiGotoRun): the answer stays in front */
    const B2 = await page.evaluate(() => { intel.history.push({ role: 'user', text: 'where is my list' }, { role: 'assistant', text: 'Your list is beside you.' });
      if (!pdTalkShows()) pdTalkReopen(); const before = pdTalkShows(); aiGotoRun({ task: 'needs' }, 'where is my list');
      const t = (document.getElementById('ig-dock') || {}).innerText || '';
      return { before, talk: pdTalkShows(), view: state.view, face: hbS().face, line: t.includes(i18t('ca_go_needs')), answer: t.includes('Your list is beside you.') }; });
    check('B2 Jambo\'s trip to Needs you on the Board: still the Board, his answer and the line in front', B2.before && B2.talk && B2.view === 'dashboard' && B2.face === 'board' && B2.line && B2.answer, JSON.stringify(B2));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `board-question-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);

    console.log('\nD · off the Board the door still goes to the Home page');
    await page.evaluate(() => { hbSetFace('explorer'); });
    await until(() => hbS().face === 'explorer');
    await page.evaluate(() => hbNeedsOpen());
    const D = await until(() => state.view === 'counter' ? state.view : null);
    check('D "needs" from Explorer opens the Home page', D === 'counter', String(D));

    console.log('\nF–G · the same question on other pages stays where it was asked (the server drops the trip, f873)');
    const askOn = async (where, box, go) => {
      ai.reset(); ai.script([{ type: 'tool_use', id: 'tu_o', name: 'deliver_answer', input: { answer: 'Three things deserve attention today.', citations: [], goto: { task: 'needs' } } }]);
      await page.fill(box, 'what should i be concerned with today'); await page.evaluate(go);
      await until(() => !intel.busy && !ai.busy && ((window.ai && ai.history) || []).some(m => m.role === 'assistant' && /Three things deserve attention/.test(String(m.text || ''))) ? true : null, null, 10000);
      await page.waitForTimeout(600);
      return page.evaluate(() => ({ view: state.view, face: hbS().face }));
    };
    await page.evaluate(() => { setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbS().face === 'explorer' && !!document.getElementById('igd-input'));
    const F = await askOn('explorer', '#igd-input', () => document.getElementById('igd-go').click());
    check('F asked beside Explorer: still Explorer', F.view === 'dashboard' && F.face === 'explorer', JSON.stringify(F));
    await page.evaluate(() => { setView('brain'); if (!(ai.open && ai.win)) openAI(null, { win: true }); });
    await until(() => state.view === 'brain' && !!document.getElementById('ai-input') && document.getElementById('ai-input').getClientRects().length > 0);
    const G = await askOn('brain', '#ai-input', () => aiSubmit());
    check('G asked in the ✦ window off Home: still that page', G.view === 'brain', JSON.stringify(G));

    check('E no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run stopped', false, String(e && e.message || e).slice(0, 200));
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
