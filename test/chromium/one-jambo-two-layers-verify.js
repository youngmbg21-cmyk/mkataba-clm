/* Chromium verification: ONE JAMBO, TWO LAYERS (owner, 24 Oct 2026: "act first, then explain")
   ============================================================
   The ✦'s window, Home's own box and the panels beside the lists are ONE Jambo
   with two layers: the free readers first (the Board's, the map's, the places,
   the follow-up "them"), the brain for a question — and the same screen in
   both. Driven with a scripted model (startScriptedAi), so what is sent and
   what is drawn are read where they land. Waits ask for the state, bounded.
     A  the window on Home: "show me <party> on the board" draws the party's card on the Board, free, and says the Board's line
     B  "what am i seeing on screen" on Explorer is the map in words, nothing spent
     C  a Board question is the chat's: told the Board as it stands, its answer drawn, a set a door to the Board
     D  act first, then explain: a question the Board only DREW gets Jambo's words under the Board's line — one call
     E  "show them on the board" draws the last answer's set as the Board's found card
     F  off Home: a Board command turns to the Board and draws, free; a question stays where it was asked, in words
     G  the same formatting beside the Board: a table and a tone in the answer are drawn as in the window
     H  photos at the owner's three screens; no page errors
   Run: node test/chromium/one-jambo-two-layers-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'one-jambo-two-layers');
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const deliver = (answer, ids) => [{ type: 'tool_use', id: 'tu_w', name: 'deliver_answer', input: { answer, citations: (ids || []).map(id => ({ id })) } }];

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
    const plain = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const lastTurns = n => page.evaluate(k => (window.ai && ai.history || []).filter(m => m.role === 'assistant').slice(-k).map(m => String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()), n);
    const chatSystem = () => { const c = ai.calls.filter(x => x.body && Array.isArray(x.body.tools) && x.body.tools.some(t => t.name === 'deliver_answer')).slice(-1)[0];
      return c ? JSON.stringify(c.body.system || '') + JSON.stringify(c.body.messages || []) : ''; };
    const waitCalls = async n => { const t0 = Date.now(); while (Date.now() - t0 < 10000 && ai.calls.length < n) await page.waitForTimeout(120); return ai.calls.length >= n; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    await page.waitForTimeout(600);
    /* Home, the Board in front, the window open beside it */
    const toHomeWindow = async face => { await page.evaluate(f => { ai.history = []; setView('dashboard'); intel.paper = null; hbSetFace(f || 'board'); if (!(ai.open && ai.win)) openAI(null, { win: true }); }, face);
      return until(() => state.view === 'dashboard' && ai.open && ai.win && !!document.getElementById('ai-input') && document.getElementById('ai-input').getClientRects().length > 0 && !!document.getElementById('igd-input') && !ai.busy && !intel.busy); };
    const winAsk = async q => { await page.fill('#ai-input', q); await page.evaluate(() => aiSubmit()); };
    const settled = () => until(() => !ai.busy && !intel.busy);

    console.log('\nA · the window on Home draws on the Board, free, and says the Board\'s line');
    check('A · the window is open on Home', !!(await toHomeWindow('board')));
    ai.reset();
    await winAsk('show me naivas supermarkets on the board');
    const A = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; const m = (ai.history || []).filter(x => x.role === 'assistant').slice(-1)[0];
      return k && m ? { key: k, face: s.face, said: String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() } : null; });
    check('A1 the party\'s card is drawn on the Board', !!A && A.face === 'board' && /^(q:|c:)/.test(A.key), JSON.stringify(A));
    check('A2 and the window says the Board\'s own line (the set, Free), not a folder\'s', !!A && /Naivas/i.test(A.said) && /Free/.test(A.said) && !/folder/i.test(A.said), A && A.said);
    check('A3 nothing was spent', ai.calls.length === 0, `${ai.calls.length}×`);

    console.log('\nB · "what am i seeing on screen" on Explorer');
    await toHomeWindow('explorer');
    await until(() => !!document.getElementById('ig-page') && document.getElementById('ig-page').getAttribute('data-hb-side') === 'explorer', null, 10000);
    await page.waitForTimeout(800);
    ai.reset();
    await winAsk('what am i seeing on screen');
    const B = await until(() => { const m = (ai.history || []).filter(x => x.role === 'assistant').slice(-1)[0]; return m ? String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null; });
    const wantB = await page.evaluate(() => { const M = igMapNow(); return M.by ? i18t('ai_here_map_by', { n: M.shown, t: M.total, by: M.by }) : i18t('ai_here_map', { n: M.shown, t: M.total }); });
    check('B1 the map is said in words: how many of how many, grouped by what', !!B && B.includes(wantB), B);
    check('B2 nothing was spent', ai.calls.length === 0, `${ai.calls.length}×`);
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `B-explorer-window-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);

    console.log('\nC · a Board question is the chat\'s, told the Board as it stands');
    await toHomeWindow('board');
    ai.reset(); ai.script(deliver('Naivas Supermarkets is worth the most: SEK 163M over two contracts.', ['MK-B1', 'MK-B2']));
    await winAsk('which customer is worth the most');
    check('C1 the chat was asked once', await waitCalls(1) && ai.calls.length === 1, `${ai.calls.length}×`);
    await settled();
    const sysC = chatSystem();
    check('C2 and told the Board as it stands (Your book, the open card)', /The Board as it stands/.test(sysC) && /Your book \(the six figures at the top\)/.test(sysC), sysC ? 'told' : 'no chat call');
    const C = await until(() => { const m = (ai.history || []).filter(x => x.role === 'assistant').slice(-1)[0]; return m && /worth the most/.test(String(m.text || '')) ? { ids: m.cardIds || [], door: !!document.querySelector('[data-ig-board-go], [data-ai-board-go]') } : null; });
    check('C3 the answer is drawn with its set, and the set is a door to the Board', !!C && C.ids.length === 2 && C.door, JSON.stringify(C));

    console.log('\nD · act first, then explain');
    await toHomeWindow('board');
    ai.reset(); ai.script(deliver('They stall at Naivas Supermarkets: two deals wait on us.'));
    await winAsk('which stalled deals are waiting on us, by counterparty');
    check('D1 the chat was asked once, after the Board drew', await waitCalls(1) && ai.calls.length === 1, `${ai.calls.length}×`);
    await settled();
    const D = await lastTurns(2);
    check('D2 the Board\'s own line stands first (Free), Jambo\'s words under it', D.length === 2 && /Free/.test(D[0]) && /stall at Naivas/.test(D[1]), JSON.stringify(D));
    const dKey = await page.evaluate(() => (hbS().path || []).slice(-1)[0] || '');
    check('D3 and the card is on the Board', /^q:/.test(dKey), dKey);
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `D-board-explain-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);

    console.log('\nE · "show them on the board" is the last answer\'s set');
    await toHomeWindow('board');
    ai.reset(); ai.script(deliver('Two: Refined Sugar Supply and Raw Milk Collection.', ['MK-A1', 'MK-A2']));
    await winAsk('which contracts are in the procurement stream');
    await waitCalls(1); await settled();
    await winAsk('show them on the board');
    const E = await until(() => { const s = hbS(); return s.found && (s.path || []).slice(-1)[0] === 'ls' ? { ids: s.found.ids, title: s.found.title } : null; });
    check('E1 the Board\'s found card holds exactly those two', !!E && JSON.stringify([...E.ids].sort()) === JSON.stringify(['MK-A1', 'MK-A2']), JSON.stringify(E));
    check('E2 nothing more was spent', ai.calls.length === 1, `${ai.calls.length}×`);

    console.log('\nF · off Home: a command turns to the Board; a question stays in words');
    await page.evaluate(() => { setView('brain'); ai.history = []; if (!(ai.open && ai.win)) openAI(null, { win: true }); });
    await until(() => state.view === 'brain' && ai.open && !!document.getElementById('ai-input') && document.getElementById('ai-input').getClientRects().length > 0);
    ai.reset();
    await winAsk('chart value by stream');
    const F1 = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; const m = (ai.history || []).filter(x => x.role === 'assistant').slice(-1)[0];
      return state.view === 'dashboard' && s.face === 'board' && k && m && /Free/.test(String(m.text || '')) ? { key: k } : null; }, null, 10000);
    check('F1 the Board is turned to and the chart drawn, said in the window, free', !!F1 && /^q:/.test(F1.key) && ai.calls.length === 0, JSON.stringify({ F1, calls: ai.calls.length }));
    await page.evaluate(() => { setView('brain'); ai.history = []; if (!(ai.open && ai.win)) openAI(null, { win: true }); });
    await until(() => state.view === 'brain' && ai.open && !!document.getElementById('ai-input') && document.getElementById('ai-input').getClientRects().length > 0);
    ai.reset(); ai.script(deliver('Two end this quarter.'));
    await winAsk('what ends this quarter?');
    await waitCalls(1); await settled();
    const F2 = await page.evaluate(() => ({ view: state.view, said: (ai.history.filter(x => x.role === 'assistant').slice(-1)[0] || {}).text || '' }));
    check('F2 a question asked off Home is answered where it was asked, in words', F2.view === 'brain' && /end this quarter/.test(plain(F2.said)) && ai.calls.length === 1, JSON.stringify({ view: F2.view, calls: ai.calls.length }));

    console.log('\nG · the same formatting beside the Board');
    await toHomeWindow('board');
    await page.evaluate(() => { if (ai.open) closeAI(); });
    ai.reset(); ai.script(deliver('| Counterparty | Terms |\n|---|---|\n| Nordvane | Net 60 |\n| Wilmar | Not specified |\n\n**One** is {!over standard}.'));
    /* act first, then explain, beside the Board: the Board draws the quarter's card, then Jambo's table under it */
    await page.fill('#igd-input', 'what ends this quarter?');
    await page.press('#igd-input', 'Enter');
    await waitCalls(1); await until(() => !intel.busy);
    const G = await page.evaluate(() => ({ table: !!document.querySelector('#igd-feed table.ai-table, #igd-feed .ai-table'), tone: !!document.querySelector('#igd-feed .ai-tone'), bold: !!document.querySelector('#igd-feed .jl-bub strong, #igd-feed .jl-bub b'),
      wide: (() => { const f = document.getElementById('igd-feed'); return f ? f.scrollWidth <= f.clientWidth + 1 : null; })() }));
    check('G1 a table, a tone and bold are drawn in the panel as in the window', G.table && G.tone && G.bold, JSON.stringify(G));
    check('G2 and nothing scrolls sideways', G.wide === true, JSON.stringify(G));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `G-panel-table-${w}x${hh}.png`) }); }

    console.log('\nI · the owner\'s two sentences in the window on Home are the brain\'s (one rule in every box, 24 Oct 2026)');
    await toHomeWindow('board');
    ai.reset(); ai.script(deliver('| Term | Juno LLC |\n|---|---|\n| Net days | 58 |\n\n{!over standard} 58 days is over our 30-day standard.'));
    await winAsk('create a table for juno llc payment terms');
    await waitCalls(1); await settled(); await page.waitForTimeout(400);
    const I1 = await page.evaluate(() => { const m = (ai.history || []).filter(x => x.role === 'assistant').slice(-1)[0];
      return { view: state.view, form: /not created yet/i.test(document.body.innerText), juno: !!m && /Juno/.test(String(m.text || '')), table: !!document.querySelector('#ai-feed .ai-table, #ai-feed table'), tone: !!document.querySelector('#ai-feed .ai-tone'), last: m ? String(m.text || '').replace(/<[^>]+>/g, ' ').slice(0, 80) : null }; });
    I1.calls = ai.calls.length;
    check('I1 "create a table…" opens no New agreement form: the brain answers in the window, one call, as a table with its tone', !!I1 && !I1.form && I1.juno && I1.table && I1.tone && I1.calls === 1, JSON.stringify(I1));
    await settled();
    ai.reset(); ai.script(deliver('The highest risk sits with Nordvane: {-bad} an uncapped liability in §9.'));
    await winAsk('tell me where we have the highest risk');
    await waitCalls(1); await settled(); await page.waitForTimeout(400);
    const I2 = await page.evaluate(() => { const m = (ai.history || []).filter(x => x.role === 'assistant').slice(-1)[0]; const t = m ? String(m.text || '') : '';
      return { nord: /Nordvane/.test(t), pack: /answer pack/i.test(t), tone: !!document.querySelector('#ai-feed .ai-tone'), last: t.replace(/<[^>]+>/g, ' ').slice(0, 80) }; });
    I2.calls = ai.calls.length;
    check('I2 "tell me where…" is never the Board\'s flat pack: the brain answers in the window, one call, with its tone', !!I2 && I2.nord && !I2.pack && I2.calls === 1 && I2.tone, JSON.stringify(I2));
    await settled();
    ai.reset();
    await winAsk('show value by stream on the board');
    await settled(); await page.waitForTimeout(600);
    const I3 = await page.evaluate(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; const m = (ai.history || []).filter(x => x.role === 'assistant').slice(-1)[0]; return { key: k || null, free: !!m && /Free/.test(String(m.text || '')), last: m ? String(m.text || '').replace(/<[^>]+>/g, ' ').slice(0, 80) : null }; });
    I3.calls = ai.calls.length;
    check('I3 and a command still acts at once, free', !!I3.key && /^q:/.test(I3.key) && I3.free && I3.calls === 0, JSON.stringify(I3));

    console.log('\nJ · the window stands beside Home\'s panel, never over it');
    const J = await page.evaluate(() => { const r = el => el && el.getBoundingClientRect(); const p = r(document.getElementById('ai-panel')), d = r(document.getElementById('ig-dock'));
      return p && d ? { pRight: Math.round(p.right), dLeft: Math.round(d.left), pLeft: Math.round(p.left) } : null; });
    check('J the window\'s right edge is left of the panel\'s left edge', !!J && J.pRight <= J.dLeft && J.pLeft >= 0, JSON.stringify(J));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `J-window-beside-${w}x${hh}.png`) }); }

    check('H no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run stopped', false, String(e && e.message || e).slice(0, 200));
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
