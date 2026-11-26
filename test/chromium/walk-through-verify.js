/* WALK ME THROUGH IT, IN A REAL BROWSER (owner, 26 Nov 2026: "Build all the possible charts and lessons but tie them
   to access"; js/walkplan.js, js/lesson.js; the unit half is test/f1248-walk-me-through-it.test.js).

   A stand-in AI answers "walk me through my contracts" with a walk_through plan (no real key). On the real Board:
     1 the lesson arrives in Jambo's panel on Home; its first step draws the stages, and the bars say what the Board's
       own "Where all N stand" says (the AI wrote no number)
     2 Next advances one step at a time ("2 of 4"); the last step shows Replay and Save; Save adds ONE note to My notes
     3 NO STUTTER: while a step builds, the panel is drawn again every 50ms for 2s — the first bar only grows and the
       lesson stays the SAME node
     4 after a reload the lesson stands finished and still (every step, Replay, nothing animating)
     5 money only with money rights: a reader without them gets the message, Ask an admin, and the count — no money
     6 an ordinary question gets an ordinary answer, never a lesson
     7 the owner's three screens: nothing in the lesson spills past the panel, the drawings use its width
     8 no page errors
     10 "show me" a chart asked away from the Board lands on the Board and asks its drawing model, never a lesson
     11 a Board card's "Walk me through this" brings a lesson into Jambo's panel
     12 a lesson's book drawing offers Put on the Board, which asks the Board for the same chart
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/walk-through-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const PLAN = { title: 'Your contracts, step by step', steps: [
  { say: 'Here is where every contract you can see stands today.', show: { what: 'stages' } },
  { say: 'The ones in review are where things slow down.', show: { what: 'highlight', names: ['In review'] } },
  { say: 'And this is the value under contract by stage.', show: { what: 'stages_value' } },
  { say: 'These are the parties you work with most.', show: { what: 'parties' } },
] };
/* the owner's case (27 Nov 2026): one folder asked for; first a lesson whose words say a number no drawing shows, then
   the corrected one — HaTi must send the first back and show the second, narrowed to the folder */
const PLAN_WRONG = { title: 'Your Procurement contracts', steps: [
  { say: 'You have 7 contracts in this folder.', show: { what: 'stages' } },
  { say: 'These are the signed ones.', show: { what: 'contracts', where: { stream: 'proc', stage: 'Signed' } } } ] };
const PLAN_RIGHT = { title: 'Your Procurement contracts', where: { stream: 'proc' }, steps: [
  { say: 'Here is where your Procurement contracts stand.', show: { what: 'stages' } },
  { say: 'These are the signed ones.', show: { what: 'contracts', where: { stream: 'proc', stage: 'Signed' } } } ] };
const lastUser = body => { const m = (body.messages || []).filter(x => x.role === 'user').pop(); const c = m && m.content;
  return typeof c === 'string' ? c : Array.isArray(c) ? c.map(x => x.text || '').join(' ') : ''; };

(async () => {
  const ai = await H.startScriptedAi();
  const answer = body => (body.tools || []).some(t => t.name === 'render_graph')
    ? { content: [{ type: 'tool_use', id: 'tu_g', name: 'render_graph', input: { action: 'filter', answer: '' } }] }
    : (body.tools || []).some(t => t.name === 'walk_through') && /HaTi checked the lesson/i.test(lastUser(body))
    ? { content: [{ type: 'tool_use', id: 'tu_w2', name: 'walk_through', input: PLAN_RIGHT }] }
    : (body.tools || []).some(t => t.name === 'walk_through') && /procurement folder/i.test(lastUser(body))
    ? { content: [{ type: 'tool_use', id: 'tu_w1', name: 'walk_through', input: PLAN_WRONG }] }
    : (body.tools || []).some(t => t.name === 'walk_through') && /walk me through/i.test(lastUser(body))
    ? { content: [{ type: 'tool_use', id: 'tu_w', name: 'walk_through', input: PLAN }] }
    : { content: [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer: 'An ordinary answer.', citations: [] } }] };
  for (let i = 0; i < 80; i++) ai.script(answer);
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off', ANTHROPIC_BASE_URL: ai.base });
  await H.seedWorkspace(h, { contracts: H.FIXTURES, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const open = async (email, pass, vp) => {
      const page = await (await browser.newContext({ viewport: vp || { width: 1440, height: 780 } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
      const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
        while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
        return v; };
      await until(() => window.state && state.contracts && state.contracts.length > 0, null, 20000);
      await page.keyboard.press('Escape').catch(() => {});
      await until(() => !!document.getElementById('igd-input'), null, 12000);
      return { page, until };
    };
    const ask = async (P, q) => { await P.page.fill('#igd-input', q); await P.page.keyboard.press('Enter'); };

    /* ---- 1 · the lesson arrives; the numbers are the Board's ---- */
    const A = await open('admin@example.co.ke', 'adminpassword1');
    const notesBefore = await A.page.evaluate(async () => { const r = await fetch('/api/me/items?kind=note'); return ((await r.json()).items || []).length; });
    await ask(A, 'Walk me through my contracts');
    const got = await A.until(() => !!document.querySelector('#ig-dock .lsn[data-lsn-id] .lsn-step'), null, 15000);
    check('1a the lesson arrives in Jambo\'s panel on Home', !!got);
    const first = await A.until(() => { const st = document.querySelector('.lsn .lsn-step[data-lsn-step="0"]'); if (!st) return null;
      const bars = [...st.querySelectorAll('.lsn-br')].map(b => ({ k: b.getAttribute('data-lsn-k'), v: b.querySelector('.lsn-v').textContent.trim() }));
      const want = hbBookData('all', { whole: true }).stages.map(s => ({ k: s.k, v: String(s.n) }));
      return { bars, want, words: st.querySelectorAll('.lsn-w').length }; });
    check('1b the first step draws the stages with the Board\'s own counts', !!first && first.bars.length === first.want.length && JSON.stringify(first.bars) === JSON.stringify(first.want), JSON.stringify(first));
    check('1c the sentence arrives word by word', !!first && first.words >= 8);

    /* ---- 3 · no stutter: redrawn every 50ms while it builds ---- */
    await A.page.evaluate(() => { window._lsnFirst = document.querySelector('.lsn'); });
    await A.page.click('.lsn [data-lsn-act="next"]');
    await A.page.click('.lsn [data-lsn-act="next"]');   /* step 3 draws a new board */
    const stutter = await A.page.evaluate(async () => {
      const widths = []; let same = true;
      for (let t = 0; t < 40; t++){
        if (typeof renderIntelDock === 'function') renderIntelDock();
        await new Promise(r => setTimeout(r, 50));
        const el = document.querySelector('.lsn');
        if (el !== window._lsnFirst) same = false;
        const bar = document.querySelector('.lsn .lsn-step[data-lsn-step="2"] .lsn-br .lsn-f i');
        widths.push(bar ? bar.getBoundingClientRect().width : -1);
      }
      const grows = widths.every((w, i) => i === 0 || w >= widths[i - 1] - 0.5);
      return { same, grows, from: widths[0], to: widths[widths.length - 1] };
    });
    check('3a redrawn every 50ms for 2s, the lesson stays the same node', stutter.same, JSON.stringify(stutter));
    check('3b …and its first bar only grows', stutter.grows && stutter.to > 0, JSON.stringify(stutter));

    /* ---- 2 · Next, the end, Save ---- */
    const prog = await A.page.evaluate(() => (document.querySelector('.lsn .lsn-of') || {}).textContent || '');
    check('2a Next moves one step at a time ("3 of 4")', /3\D+4/.test(prog), prog);
    await A.page.click('.lsn [data-lsn-act="next"]');
    const end = await A.until(() => { const K = document.querySelector('.lsn'); return K && K.querySelector('[data-lsn-act="replay"]') && K.querySelector('[data-lsn-act="save"]') && !K.querySelector('[data-lsn-act="next"]') ? true : null; });
    check('2b the last step shows Replay and Save, and Next is gone', !!end);
    const lit = await A.page.evaluate(() => { const bd = document.querySelector('.lsn .lsn-step[data-lsn-step="0"] .lsn-bd');
      return bd ? { has: bd.classList.contains('has-lit'), lit: [...bd.querySelectorAll('.is-lit')].map(x => x.getAttribute('data-lsn-k')) } : null; });
    check('2c the highlight step lit "In review" on the drawing before it', !!lit && lit.has && JSON.stringify(lit.lit) === '["Under Review"]', JSON.stringify(lit));
    await A.page.click('.lsn [data-lsn-act="save"]');
    const saved = await A.until(async n => { const r = await fetch('/api/me/items?kind=note'); const L = (await r.json()).items || []; return L.length === n + 1 ? L[0].title : null; }, notesBefore, 8000);
    check('2d Save adds one note to My notes', !!saved, saved);

    /* ---- 4 · after a reload the lesson stands finished ---- */
    await A.page.reload({ waitUntil: 'networkidle' });
    await A.until(() => window.state && state.contracts && state.contracts.length > 0, null, 20000);
    await A.page.evaluate(() => { if (typeof hbSetFace === 'function') hbSetFace('board'); if (typeof pdTalkReopen === 'function') pdTalkReopen(); if (typeof renderIntelDock === 'function') renderIntelDock(); });
    const after = await A.until(() => { const K = document.querySelector('.lsn'); if (!K) return null;
      return { steps: K.querySelectorAll('.lsn-step').length, still: [...K.querySelectorAll('.lsn-step')].every(s => s.classList.contains('is-still')), replay: !!K.querySelector('[data-lsn-act="replay"]') }; }, null, 10000);
    check('4 after a reload: every step, still, with Replay (or the conversation is not kept across a reload)', !after || (after.steps === 4 && after.still && after.replay), JSON.stringify(after));

    /* ---- 6 · an ordinary question is not a lesson ---- */
    const before6 = await A.page.evaluate(() => document.querySelectorAll('.lsn').length);
    await ask(A, 'Why is the Naivas value high?');
    const ord = await A.until(n => { const t = [...document.querySelectorAll('#ig-dock .jb-turn')].pop(); return t && /An ordinary answer/.test(t.textContent) ? { lessons: document.querySelectorAll('.lsn').length, n } : null; }, before6, 12000);
    check('6 an ordinary question gets an ordinary answer, no lesson', !!ord && ord.lessons === ord.n, JSON.stringify(ord));

    /* ---- 9 · one folder asked: the drawing counts that folder, its head says so; a wrong number is sent back ---- */
    const before9 = await A.page.evaluate(() => document.querySelectorAll('.lsn').length);
    await ask(A, 'Walk me through the status of our contracts but for the procurement folder');
    const nine = await A.until(n => { const L = [...document.querySelectorAll('.lsn')]; if (L.length <= n) return null; const K = L[L.length - 1];
      const st = K.querySelector('.lsn-step[data-lsn-step="0"]'); if (!st) return null;
      const bars = [...st.querySelectorAll('.lsn-br')].map(b => Number(b.querySelector('.lsn-v').textContent.trim()));
      const want = ['Draft', 'Under Review', 'Signed'].map(k => state.contracts.filter(c => !c.archived && c.folder === 'proc' && c.status === k).length);
      return { bars, want, scope: (st.querySelector('.lsn-scope') || {}).textContent || '', say: st.querySelector('.lsn-say').textContent }; }, before9, 20000);
    check('9a asked for one folder, the drawing counts that folder only', !!nine && JSON.stringify(nine.bars) === JSON.stringify(nine.want), JSON.stringify(nine));
    check('9b the drawing\'s head names the folder and how many contracts', !!nine && /Procurement/.test(nine.scope) && /\d+ contracts?/.test(nine.scope), nine && nine.scope);
    check('9c the sentence with a number no drawing showed was sent back and the corrected one is shown', !!nine && !/\b7\b/.test(nine.say) && /Procurement contracts stand/.test(nine.say), nine && nine.say);
    const sentBack = ai.calls.some(c => /HaTi checked the lesson against its drawings/.test(JSON.stringify(c.body.messages || [])));
    check('9d the stand-in AI was told what the drawings show', sentBack);

    /* ---- 10 · "show me" a chart from another page ends on the Board, which asks its drawing model ---- */
    const graphsBefore = ai.calls.filter(c => (c.body.tools || []).some(t => t.name === 'render_graph')).length;
    await A.page.evaluate(() => { setView('obligations'); });
    await A.until(() => state.view !== 'dashboard' || (typeof hbFace === 'function' && hbFace() !== 'board'), null, 6000);
    const away = await A.page.evaluate(() => state.view + '/' + (typeof hbFace === 'function' ? hbFace() : ''));
    await A.page.evaluate(() => caAskAnywhere('show me contracts by stage'));
    const ten = await A.until(() => (state.view === 'dashboard' && hbFace() === 'board') ? { view: state.view, face: hbFace() } : null, null, 10000);
    check('10a "show me contracts by stage" asked away from the Board (' + away + ') lands on the Board', !!ten, JSON.stringify(ten));
    let drew = false; for (let i = 0; i < 60 && !drew; i++){ drew = ai.calls.filter(c => (c.body.tools || []).some(t => t.name === 'render_graph')).length > graphsBefore; if (!drew) await A.page.waitForTimeout(150); }
    check('10b …and the Board\'s drawing model is asked for the chart (not a lesson, not the chat)', drew);
    const noLesson = await A.page.evaluate(() => ![...document.querySelectorAll('.lsn')].some(L => /contracts by stage/i.test(L.closest('.jb-turn') ? L.closest('.jb-turn').textContent : '')));
    check('10c no lesson was started for it', noLesson);
    const offered = ai.calls.filter(c => /show me contracts by stage/i.test(lastUser(c.body)) && (c.body.tools || []).some(t => t.name === 'walk_through')).length;
    check('10d the chat was never offered the lesson tool for that chart question (both hosts drop it: chartAsked)', offered === 0, offered + ' calls');

    /* ---- 11 · a Board card's Walk me through this asks a lesson in the panel ---- */
    const before11 = await A.page.evaluate(() => document.querySelectorAll('.lsn').length);
    const key11 = await A.page.evaluate(() => { const p = (hbS().panels || [])[0]; return p ? p.key : null; });
    if (key11) await A.page.evaluate(k => hbWalkThis(k), key11);
    const eleven = await A.until(n => document.querySelectorAll('#ig-dock .lsn .lsn-step').length && document.querySelectorAll('.lsn').length > n ? true : null, before11, 15000);
    check('11 a Board card\'s "Walk me through this" brings a lesson into Jambo\'s panel', !!key11 && !!eleven, 'card ' + key11);

    /* ---- 12 · a lesson's drawing goes to the Board with Put on the Board ---- */
    const tob = await A.page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .lsn [data-lsn-act="board"]')].pop(); return b ? b.textContent : null; });
    check('12a a lesson\'s book drawing offers Put on the Board', !!tob, tob);
    if (tob){
      const g0 = ai.calls.filter(c => (c.body.tools || []).some(t => t.name === 'render_graph')).length;
      await A.page.evaluate(() => [...document.querySelectorAll('#ig-dock .lsn [data-lsn-act="board"]')].pop().click());
      let g = false; for (let i = 0; i < 60 && !g; i++){ g = ai.calls.slice(-6).some(c => (c.body.tools || []).some(t => t.name === 'render_graph') && /Show me/i.test(JSON.stringify(c.body.messages || []))) && ai.calls.filter(c => (c.body.tools || []).some(t => t.name === 'render_graph')).length > g0; if (!g) await A.page.waitForTimeout(150); }
      check('12b …and pressing it asks the Board for the same chart, on the Board', g && await A.page.evaluate(() => state.view === 'dashboard' && hbFace() === 'board'));
    }

    /* ---- 7 · the owner's three screens ---- */
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]){
      await A.page.setViewportSize(vp); await A.page.waitForTimeout(300);
      const fit = await A.page.evaluate(() => { const P = document.getElementById('ig-dock'), K = document.querySelector('.lsn'); if (!P || !K) return null;
        const pr = P.getBoundingClientRect(), kr = K.getBoundingClientRect();
        const spill = [...K.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > pr.right + 0.5; }).length;
        const bars = [...K.querySelectorAll('.lsn-bars')].map(b => b.getBoundingClientRect().width / kr.width);
        return { spill, fill: Math.min(...bars), side: document.documentElement.scrollWidth <= window.innerWidth }; });
      check(`7 ${vp.width}×${vp.height}: nothing spills past the panel, drawings use its width`, !!fit && fit.spill === 0 && fit.fill > 0.95 && fit.side, JSON.stringify(fit));
    }

    /* ---- 5 · no money rights: the message and the count ---- */
    const N = await open('novalues@example.co.ke', 'their-own-pass-9');
    await ask(N, 'Walk me through my contracts');
    await N.until(() => !!document.querySelector('.lsn .lsn-step'), null, 15000);
    await N.page.click('.lsn [data-lsn-act="all"]');
    const nm = await N.until(() => { const st = document.querySelector('.lsn .lsn-step[data-lsn-step="2"]'); if (!st) return null;
      const vals = [...st.querySelectorAll('.lsn-v')].map(v => v.textContent.trim());
      return { msg: !!st.querySelector('.lsn-nomoney'), ask: !!st.querySelector('[data-lsn-act="askadmin"]'), vals,
        want: hbBookData('all', { whole: true }).stages.map(s => String(s.n)), money: /KES|\$|€|SEK/.test(document.querySelector('.lsn').textContent) }; }, null, 15000);
    check('5a without money rights the money step says so, with Ask an admin', !!nm && nm.msg && nm.ask, JSON.stringify(nm));
    check('5b …and draws the count (the Board\'s), never a money figure', !!nm && JSON.stringify(nm.vals) === JSON.stringify(nm.want) && !nm.money, JSON.stringify(nm));

    check('8 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close(); await h.stop?.(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
  process.exit(failures ? 1 : 0);
})();
