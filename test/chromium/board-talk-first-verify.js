/* Chromium verification: THE BOARD'S JAMBO TAB READS WITH THE BRAIN FIRST (owner, 26 Oct 2026, a trial on the Board)
   ============================================================
   Beside the Board the panel has two tabs. Overview keeps the free readers as they were; words typed while the
   Jambo tab is open go straight to the chat (igBoardTalkFirst), no word list first. Driven with a scripted model,
   so what is sent and what lands are read where the reader looks. Waits ask for the state, bounded.
     A  Overview: "approvals" is a place word — it moves there, free, as before
     B  Jambo tab: the gate is on, and the line above the box promises no free move while a sentence is typed
     K  Jambo tab: "approvals", a short command, goes to the AI too; its goto moves the reader there
     L  Jambo tab: "where do i change the language…" — the AI lands on that spot in Settings
     C  Jambo tab: a question goes to the chat once, the Board stays in front, the answer stands under his tab
     D  Jambo tab: a long sentence asking the way — the AI's own door takes the reader there (goto)
     E  Jambo tab: a follow-up carries the conversation (the earlier turns travel with it)
     F  photos at the owner's three screens; no page errors
   At the parent A passes and B–L fail (the free readers answer first, nothing is sent).
   Run: node test/chromium/board-talk-first-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'board-talk-first');
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const deliver = (answer, goto) => [{ type: 'tool_use', id: 'tu_t', name: 'deliver_answer', input: Object.assign({ answer, citations: [] }, goto ? { goto } : {}) }];

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
    const chatCalls = () => ai.calls.filter(x => x.body && Array.isArray(x.body.tools) && x.body.tools.some(t => t.name === 'deliver_answer'));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    const toBoard = async () => { await page.evaluate(() => { setView('dashboard'); intel.paper = null; intel.history = []; hbSetFace('board'); if (!intel.dockOpen){ intel.dockOpen = true; renderIntelDock(); } });
      return until(() => state.view === 'dashboard' && hbS().face === 'board' && !!document.getElementById('igd-input') && !intel.busy); };
    const toTalk = async () => { const on = await page.evaluate(() => typeof pdTalkShows === 'function' && pdTalkShows());
      if (!on) await page.click('#ig-dock [data-pd-talk]');
      return until(() => typeof pdTalkShows === 'function' && pdTalkShows() && !!document.getElementById('igd-input')); };
    const ask = async q => { await page.fill('#igd-input', q); await page.click('#igd-go'); };

    console.log('\nA · Overview keeps the free readers');
    check('A0 the Board is in front, Overview showing', !!(await toBoard()) && !(await page.evaluate(() => pdTalkShows())));
    ai.reset();
    await ask('approvals');
    const A = await until(() => state.view !== 'dashboard' ? state.view : null, null, 8000);
    check('A1 "approvals" on Overview moves to Approvals, nothing spent', !!A && /approv/i.test(A) && chatCalls().length === 0, `${A} · ${ai.calls.length}×`);

    console.log('\nB · the Jambo tab: the gate is on, the line promises no free move');
    await toBoard();
    check('B0 the Jambo tab is open', !!(await toTalk()));
    check('B1 the brain reads first here (igBoardTalkFirst)', await page.evaluate(() => typeof igBoardTalkFirst === 'function' && igBoardTalkFirst() === true));
    await page.fill('#igd-input', 'i keep losing track of which approvals are stuck with finance');
    await page.evaluate(() => { const i = document.getElementById('igd-input'); i.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(900);
    const pre = await page.evaluate(() => (document.getElementById('igd-pre') || {}).textContent || '');
    check('B2 the line above the box promises nothing', pre.trim() === '', JSON.stringify(pre));
    await page.fill('#igd-input', '');

    console.log('\nK · a short command on the Jambo tab is the AI\'s too, and its goto moves the reader');
    ai.reset(); ai.script(deliver('Taking you to Approvals.', { task: 'approvals' }));
    await ask('approvals');
    const K = await until(() => state.view !== 'dashboard' ? state.view : null, null, 10000);
    check('K1 one chat call, and the AI\'s door moved the reader to Approvals', chatCalls().length === 1 && !!K && /approv/i.test(K), `${K} · ${chatCalls().length}×`);
    await toBoard(); await toTalk();

    console.log('\nL · the AI lands on one spot in Settings');
    ai.reset(); ai.script(deliver('Your language is in Settings, under You. Taking you there.', { task: 'lang', door: { kind: 'you', key: 'lang' } }));
    await ask('where do i change the language hati speaks to me in');
    const L = await until(() => state.view !== 'dashboard' ? { view: state.view, lang: !!document.querySelector('[data-st-card="lang"], #st-lang, [data-st-row="lang"], select[name="lang"], #st-you-lang') } : null, null, 10000);
    check('L1 one chat call, and the reader is in Settings', chatCalls().length === 1 && !!L && /team|settings/i.test(L.view), JSON.stringify(L));
    await toBoard(); await toTalk();

    console.log('\nC · a question on the Jambo tab is the chat\'s');
    ai.reset(); ai.script(deliver('Approvals is where requests for a yes wait. Three wait on you now.'));
    await ask('why do approvals keep getting stuck with finance?');
    const C = await until(() => !intel.busy && /Three wait on you/.test((document.getElementById('ig-dock') || {}).innerText || '') ? { view: state.view, face: hbS().face, talk: pdTalkShows() } : null, null, 10000);
    check('C1 the chat was asked once', chatCalls().length === 1, `${chatCalls().length}×`);
    check('C2 the Board stays in front and the answer stands under his tab', !!C && C.view === 'dashboard' && C.face === 'board' && C.talk, JSON.stringify(C));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `C-jambo-tab-answer-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);

    console.log('\nE · a follow-up carries the conversation');
    ai.reset(); ai.script(deliver('The oldest has waited nine days.'));
    await ask('which has waited longest?');
    await until(() => !intel.busy && /nine days/.test((document.getElementById('ig-dock') || {}).innerText || '') ? true : null, null, 10000);
    const sent = JSON.stringify((chatCalls().slice(-1)[0] || {}).body || {});
    check('E1 the earlier question and answer travel with it', /stuck with finance/.test(sent) && /Three wait on you/.test(sent), sent ? 'carried' : 'no call');

    console.log('\nD · the AI takes the reader there');
    ai.reset(); ai.script(deliver('Our standards are on Our paper. Taking you there.', { task: 'standards' }));
    await ask('i need the page where we keep our standard clauses for suppliers');
    const D = await until(() => state.view !== 'dashboard' ? state.view : null, null, 10000);
    check('D1 one chat call, and the reader is moved by the AI\'s door', chatCalls().length === 1 && !!D, `${D} · ${chatCalls().length}×`);

    /* "CONTACTS" IS PEOPLE (owner, 27 Oct 2026: "when i type contacts in the jambo or take me to contacts, it instead
       takes me to contracts") — on both tabs */
    console.log('\nG · "take me to contacts" is People, never Contracts');
    await toBoard();
    if (await page.evaluate(() => pdTalkShows())) await page.click('#ig-dock [data-pd-talk]');
    ai.reset();
    await ask('take me to contacts');
    const G = await until(() => state.view !== 'dashboard' ? state.view : null, null, 8000);
    check('G1 under Overview it opens People, nothing spent', G === 'directory' && chatCalls().length === 0, `${G} · ${ai.calls.length}×`);
    await toBoard(); await toTalk();
    ai.reset(); ai.script(deliver('Taking you to People.', { task: 'people' }));
    await ask('take me to contacts');
    await until(() => chatCalls().length >= 1 ? true : null, null, 10000);
    const taskDesc = (() => { const c = chatCalls().slice(-1)[0]; const t = c && (c.body.tools || []).find(x => x.name === 'deliver_answer');
      const g = t && t.input_schema && t.input_schema.properties && t.input_schema.properties.goto; return (g && g.properties && g.properties.task && g.properties.task.description) || ''; })();
    check('G2 on the Jambo tab the AI is told People\'s words, "contacts" among them, and not to read one as a slip', /people \(colleagues, contacts/.test(taskDesc) && /never a misspelling/.test(taskDesc), taskDesc.slice(0, 120));
    const G3 = await until(() => state.view !== 'dashboard' ? state.view : null, null, 10000);
    check('G3 and its door lands on People', G3 === 'directory', G3);

    check('F no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run stopped', false, String(e && e.message || e).slice(0, 200));
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
