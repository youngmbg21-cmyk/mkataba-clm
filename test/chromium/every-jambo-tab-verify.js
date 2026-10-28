/* Chromium verification: EVERY JAMBO TAB READS WITH THE BRAIN FIRST, AND WORKS ITS PAGE'S OWN CONTROLS
   ============================================================
   The owner, 27 Oct 2026: "roll out the jambo capabilities from the board's jambo to all the jambos across HaTi.
   Then, Teach him to work each page's controls, as he now draws on the Board, separately for each page."
   On every page with Jambo's panel (RE-POINTED 28 Oct 2026, "Door above the box": no Jambo tab, typed on the landing):
     A  "approvals waiting" typed there is a question to the brain — one call, the page stays (no free reader moved it); the
        chat is told the page's OWN controls where the page has a list (THE PAGE'S OWN CONTROLS, deliver_answer.page)
     B  the brain's presses work the page's own controls, said in a line under his words:
        Approvals and Obligations — a tab; the Contracts place and People — the list's search
     C  the Calendar's planner hands words that are not about time to the chat ('elsewhere'), in the one conversation
     D  Explorer's tab asks the map's own brain (render_graph), a contract's Dossier the chat or its wording's
     E  a page's one name, "approvals", moves to Approvals, nothing spent
     H  Home's box (the Counter) typed into is one question to the brain, the Board opening on his tab; a chip stays free
     F  no page errors
   AT THE PARENT (origin/main 422878e) A fails on every page but the Board, B and C fail.
   Run: node test/chromium/every-jambo-tab-verify.js   (HATI_TAB_ONLY=approvals,contracts to run some) */
/* global aiWinToggle, closeAI, state, ai, intel, setView, hbSetFace, hbOpenContracts, openNegotiations, openSettingsAt, closeModal, jlToWords, jamboTalkUp, jamboTalkBack, lhControlsNow, LH_PAGES, roomHomeLand */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');
const { navContracts } = require('../nav-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(120); }
  return null;
}
function world(){
  const cs = navContracts();
  const a2 = cs.find(c => c.id === 'MK-A2');
  const at = new Date(Date.now() - 4 * 864e5).toISOString();
  a2.negotiation = { rounds: [{ n: 1 }], turn: 'us', turnAt: at };
  a2.changes = [{ id: 'ch1', clauseId: 'c1', clauseLabel: '3. Payment', status: 'pending', authorSide: 'counterparty', kind: 'edit', at, before: 'thirty', after: 'sixty' }];
  return cs;
}
/* page, how it opens, its panel, its box, the view it must stay on, and what his presses should do there */
const PAGES = [
  ['contracts', 'hbOpenContracts()', '#ig-dock', '#igd-input', 'dashboard', 'search'],
  ['explorer', "setView('dashboard'); hbSetFace('explorer')", '#ig-dock', '#igd-input', 'dashboard', 'map'],
  ['dossier', "roomHomeLand('MK-A2')", '#ig-dock', '#igd-input', 'dashboard', null],
  ['calendar', "setView('calendar')", '#cal-plan', '#cal-plan-in', null, 'elsewhere'],
  ['approvals', "setView('approvals')", '#ins-panel', '#jl-q', 'approvals', null],
  ['obligations', "setView('obligations')", '#ins-panel', '#jl-q', 'obligations', 'tab'],
  ['negotiations', 'openNegotiations()', '#ins-panel', '#jl-q', null, null],
  ['customers', "setView('customers')", '#ins-panel', '#jl-q', 'customers', null],
  ['directory', "setView('directory')", '#ins-panel', '#jl-q', 'directory', 'search'],
  ['intake', "setView('intake')", '#ins-panel', '#jl-q', 'intake', null],
  ['templates', "setView('templates')", '#ins-panel', '#jl-q', 'templates', null],
  ['mynotes', "setView('mynotes')", '#ins-panel', '#jl-q', 'mynotes', null],
  ['reads', "setView('reads')", '#ins-panel', '#jl-q', 'reads', null],
  ['handbook', "setView('handbook')", '#ins-panel', '#jl-q', 'handbook', null],
  ['migration', "setView('migration')", '#mig-side', '#jl-q', 'migration', null],
  ['settings', "setView('team')", '#st-side', '#st-jb-q', 'team', null],
];
const deliver = (answer, extra) => ({ content: [{ type: 'tool_use', id: 'tu_e', name: 'deliver_answer', input: Object.assign({ answer, citations: [] }, extra || {}) }] });
const toolsOf = c => (c && c.body && Array.isArray(c.body.tools)) ? c.body.tools.map(t => t.name) : [];
const sysOf = c => { const s = c && c.body && c.body.system; return Array.isArray(s) ? s.map(b => (b && b.text) || '').join('\n') : String(s || ''); };

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: world(), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1536, height: 730 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && state.contracts && state.contracts.length > 5 && typeof hbOpenContracts === 'function'), null, 20000);
    await P.waitForTimeout(1200);
    const ONLY = process.env.HATI_TAB_ONLY ? process.env.HATI_TAB_ONLY.split(',') : null;
    const open = async (go, host) => {
      await P.evaluate(() => { try { closeModal(); } catch (_){} });
      await P.evaluate(g => { eval(g); }, go);
      const up = await until(P, s => { const e = document.querySelector(s); return e && e.getBoundingClientRect().width > 200; }, host);
      await P.waitForTimeout(700);
      await P.evaluate(() => { try { jlToWords(); } catch (_){} try { if (window.jamboTalkUp && jamboTalkUp()) jamboTalkBack(); } catch (_){} });
      await P.waitForTimeout(300);
      return up;
    };
    const type = async (box, words) => { await P.fill(box, words); await P.press(box, 'Enter'); };
    const settled = () => until(P, () => !(window.ai && ai.busy) && !(window.intel && intel.busy) ? true : null, null, 12000);

    for (const [key, go, host, box, view, does] of PAGES){
      if (ONLY && !ONLY.includes(key)) continue;
      console.log(`\n· ${key}`);
      if (!(await open(go, host))){ check(`${key}: the panel is drawn`, false, host); continue; }
      /* RE-POINTED 28 Oct 2026 (owner picked "Door above the box"): no Jambo tab to press — words typed on the landing
         are the brain's, but a page's one name, so the sentence asked is two words */
      /* what his presses should be on this page, read off the page's own controls */
      const C = await P.evaluate(() => (typeof lhControlsNow === 'function') ? lhControlsNow() : null);
      let page = null, want = null;
      if (does === 'tab' && C){ const S = C.seats[0]; const t = S && S.tabs.find((x, i) => i > 0); if (t){ page = [{ seat: S.seat, do: 'tab', k: t.k }]; want = { seat: S.seat, tab: t.k }; } }
      if (does === 'search' && C){ const S = C.seats.find(x => x.search); if (S){ page = [{ seat: S.seat, do: 'search', words: 'Naivas' }]; want = { seat: S.seat, q: 'Naivas' }; } }
      ai.reset();
      if (does === 'elsewhere') ai.script({ content: [{ type: 'tool_use', id: 'tu_x', name: 'elsewhere', input: { why: 'a page' } }] }, deliver('ANS-' + key));
      else if (does === 'map') ai.script({ content: [{ type: 'tool_use', id: 'tu_g', name: 'render_graph', input: { answer: 'ANS-' + key, note: 'map' } }] });
      else ai.script(deliver('ANS-' + key, page ? { page } : {}));
      const view0 = await P.evaluate(() => state.view);
      await type(box, 'approvals waiting');
      await until(P, () => ai !== undefined, null, 500);
      await settled(); await P.waitForTimeout(700);
      const calls = ai.calls.slice(), view1 = await P.evaluate(() => state.view);
      check(`A ${key}: "approvals waiting" typed is a question to the brain, the page stays`, calls.length >= 1 && view1 === (view || view0), `${calls.length} call(s) · ${view0} → ${view1}`);
      const chat = calls.find(c => toolsOf(c).includes('deliver_answer'));
      if (does === 'elsewhere') check(`C ${key}: the planner hands it to the chat`, calls.length === 2 && toolsOf(calls[0]).includes('elsewhere') && !!chat, calls.map(c => toolsOf(c).slice(0, 3).join('/')).join(' · '));
      if (does === 'map') check(`D ${key}: the map's own brain is asked`, calls.length === 1 && toolsOf(calls[0]).includes('render_graph'), toolsOf(calls[0]).slice(0, 4).join('/'));
      if (C && chat) check(`A2 ${key}: the chat is told the page's own controls`, toolsOf(chat).includes('deliver_answer') && /THE PAGE'S OWN CONTROLS/.test(sysOf(chat)) && !!((chat.body.tools.find(t => t.name === 'deliver_answer') || {}).input_schema || {}).properties.page, C.seats.map(s => s.seat).join(','));
      if (want){
        const got = await until(P, w => { const pg = LH_PAGES[w.seat]; if (!pg) return null;
          if (w.tab) return String(pg.tabNow ? pg.tabNow() : '') === String(w.tab) ? { tab: pg.tabNow() } : null;
          return String(pg.q ? pg.q() : '') === w.q ? { q: pg.q() } : null; }, want, 5000);
        const said = await P.evaluate(s => /Showing|Searched the list/.test((document.querySelector(s) || {}).innerText || ''), host);
        check(`B ${key}: his press worked the page's own ${want.tab ? 'tab' : 'search'}, said under his words`, !!got && said, JSON.stringify({ want, got, said }));
      }
    }

    /* G — THE ✦ WINDOW (owner, 27 Oct 2026: "Go with option 1, AI-first anyway"): typed there, "approvals" is a question
       to the brain, the page stays, and his press works the page's own list */
    console.log('\n· G: the ✦ window');
    if (!ONLY || ONLY.includes('window')){
      await open("setView('obligations')", '#ins-panel');
      await P.evaluate(() => { if (!(window.ai && ai.open && ai.win)) aiWinToggle(); });
      const up = await until(P, () => { const i = document.getElementById('ai-input'); return i && i.offsetParent ? true : null; }, null, 6000);
      const C = await P.evaluate(() => lhControlsNow());
      const S = C && C.seats[0], t = S && S.tabs.find((x, i) => i > 0);
      ai.reset(); ai.script(deliver('ANS-window', t ? { page: [{ seat: S.seat, do: 'tab', k: t.k }] } : {}));
      await type('#ai-input', 'approvals waiting');
      await settled(); await P.waitForTimeout(700);
      const view = await P.evaluate(() => state.view);
      const chat = ai.calls.find(c => toolsOf(c).includes('deliver_answer'));
      check('G1 typed in the ✦ window, "approvals waiting" is one question to the brain, the page stays', !!up && ai.calls.length === 1 && !!chat && view === 'obligations', `${ai.calls.length} call(s) · ${view}`);
      if (t){
        const got = await until(P, w => { const pg = LH_PAGES[w.seat]; return pg && String(pg.tabNow()) === String(w.k) ? true : null; }, { seat: S.seat, k: t.k }, 5000);
        const said = await P.evaluate(() => /Showing/.test((document.getElementById('ai-feed') || {}).innerText || ''));
        check('G2 his press works the page\'s own tab, said under his words in the window', !!got && said, JSON.stringify({ got, said }));
      } else check('G2 the page offered a tab to press', false);
      await P.evaluate(() => { try { if (ai.open) closeAI(); } catch (_){} });
    }

    /* H — HOME'S BOX (owner, 27 Oct 2026: "make the home page box go to AI first too"): typed there, "approvals" is one
       question to the brain, the Board opens on his tab with the answer; a chip pressed keeps its free reader */
    console.log('\n· H: Home\'s box');
    if (!ONLY || ONLY.includes('home')){
      await P.evaluate(() => { try { closeModal(); } catch (_){} setView('counter'); });
      const box = await until(P, () => { const i = document.getElementById('cn-q'); return i && i.offsetParent ? true : null; }, null, 6000);
      ai.reset(); ai.script(deliver('ANS-home'));
      await type('#cn-q', 'approvals waiting');
      await until(P, () => state.view === 'dashboard' ? true : null, null, 6000);
      await settled(); await P.waitForTimeout(700);
      const H = await P.evaluate(() => ({ view: state.view, face: (typeof hbFace === 'function') ? hbFace() : '', talk: !!(window.pdTalkShows && pdTalkShows()), said: /ANS-home/.test((document.getElementById('ig-dock') || {}).innerText || '') }));
      const chat = ai.calls.find(c => toolsOf(c).includes('deliver_answer'));
      check('H1 typed in Home\'s box, "approvals waiting" is one question to the brain; the Board opens on his tab with the answer', !!box && ai.calls.length === 1 && !!chat && H.view === 'dashboard' && H.face === 'board' && H.talk && H.said, `${ai.calls.length} call(s) · ${JSON.stringify(H)}`);
      await P.evaluate(() => { try { closeModal(); } catch (_){} setView('counter'); });
      await until(P, () => { const i = document.getElementById('cn-q'); return i && i.offsetParent ? true : null; }, null, 6000);
      ai.reset();
      await P.click('#cn-page [data-cn-ask="contracts"]');
      const H2 = await until(P, () => (state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'paper') ? true : null, null, 6000);
      check('H2 a chip pressed on Home keeps its free reader: Contracts opens, nothing spent', !!H2 && ai.calls.length === 0, `${!!H2} · ${ai.calls.length}×`);
    }

    console.log('\n· E: Overview keeps its free readers');
    if (!ONLY || ONLY.includes('approvals') || ONLY.includes('overview')){
      await open("setView('obligations')", '#ins-panel');
      ai.reset();
      await type('#jl-q', 'approvals');
      const E = await until(P, () => state.view === 'approvals' ? state.view : null, null, 8000);
      check('E a page\'s one name, "approvals", moves to Approvals, nothing spent', E === 'approvals' && ai.calls.length === 0, `${E} · ${ai.calls.length}×`);
    }
    check('F no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run stopped', false, String(e && e.message || e).slice(0, 300));
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
