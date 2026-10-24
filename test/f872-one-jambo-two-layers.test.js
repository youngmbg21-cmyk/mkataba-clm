/* f872 — ONE JAMBO, TWO LAYERS (owner, 24 Oct 2026: "act first, then explain")

   The ✦'s window, Home's own box and the panels beside the lists are one Jambo with two layers: the free readers
   first (the Board's, the map's, the places, the follow-up "them"), the brain for a question — and every box tells
   the brain what is on the screen (Home's face, the Board as it stands, the map as drawn).
     1 · the Board's reader: "show me juno llc on the board" is Juno LLC, drawn, with the face turned first
     2 · the free reader steps aside for the Board: a party named with the board is never their folder
     3 · "show them on the board": the last answer's set is read before every other reader
     4 · the screen's sentence to the model carries the map and the Board, the same on both hosts
     5 · "what am I looking at", said another way; never "explain …" (the map's own tour)
     6 · act first, then explain: a drawn question gets the brain's words; a count's answer is the count
     7 · the window on Home hands its words to Home's own box; off Home a command turns to the Board, a question stays
     8 · a Board question is the chat's (told the Board), a "why does the board say…" the Board's own checked answer
   At the parent every check but 5's "explain" guard fails.

   Run: node --test test/f872-one-jambo-two-layers.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ---- the free reader, run as the page runs it (the stage f869 (7) uses) ---- */
function navStage(){
  const contracts = [{ id: 'MK-A1', contractNo: 'MK-A1', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', status: 'Signed', folder: 'proc' },
    { id: 'MK-D2', contractNo: 'MK-D2', name: 'Office Lease — Westlands', counterparty: 'Westlands Towers', status: 'Signed', folder: 'corp' },
    { id: 'MK-C2', contractNo: 'MK-C2', name: 'Cold Chain Haulage', counterparty: 'Juno Logistics', status: 'Draft', folder: 'dist' },
    { id: 'MK-C1', contractNo: 'MK-C1', name: 'Warehousing', counterparty: 'Juno Logistics', status: 'Signed', folder: 'dist' }];
  const ctx = { state: { contracts, view: 'dashboard', settings: {} }, getUsers: () => [{ id: 'u1', name: 'Amina Otieno' }],
    isAdmin: () => true, i18t: k => k, getContract: id => contracts.find(c => c.id === id),
    caContractOf: t => { const m = /mk-[a-z0-9]+/i.exec(t); if (!m) return null; const c = contracts.find(x => x.id.toLowerCase() === m[0].toLowerCase()); return c ? { c } : { miss: m[0].toUpperCase() }; },
    FOLDERS: { proc: { id: 'proc', name: 'Procurement' }, corp: { id: 'corp', name: 'Corporate' }, dist: { id: 'dist', name: 'Distribution' } }, STREAM_SHORT: {},
    tplPageRows: () => [] };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(R('js/hatisearch.js'), ctx);
  vm.runInContext(R('js/navmap.js'), ctx);
  return ctx;
}
/* a function's own text, run alone with what it reads given */
function fnOf(src, name, extra){
  const i = src.indexOf(`function ${name}(`); assert.ok(i > 0, `${name} is defined`);
  const body = src.slice(i, src.indexOf('\n}\n', i) + 3);
  const ctx = Object.assign({ console }, extra || {}); ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(body, ctx);
  return ctx[name];
}
const HB = R('js/views/homeboard.js'), IG = R('js/views/intelligence.js'), AI = R('js/ai.js'), CA = R('js/copilotacts.js'), SV = R('server/server.js');

describe('f872 (1) the Board\'s reader: a thing named with the board is that thing, on the Board', () => {
  test('hbBoardRest takes the board words off and keeps what is asked; lead words alone are nothing', () => {
    const rest = fnOf(HB, 'hbBoardRest', { HB_BOARD_WORDS_RE: /\b(?:on|onto|to|in|på|till|i)?\s*(?:the\s+)?(?:board|dashboard|tavlan)\b/gi,
      HB_BOARD_LEAD_RE: /^(?:show|show me|put|take me|go|back|open|visa|ta mig|gå|tillbaka|me|us|please|snälla)(?:\s+(?:show|me|us|please|snälla|to|back))*$/i });
    assert.equal(rest('show me juno llc on the board'), 'show me juno llc');
    assert.equal(rest('put the naivas contracts on the board'), 'put the naivas contracts');
    assert.equal(rest('back to the board'), '');
    assert.equal(rest('board'), '');
    assert.equal(rest('visa juno llc på tavlan'), 'visa juno llc');
  });
  test('hbParse reads the rest as its own ask and marks the act toBoard; hbAsk turns to the Board first', () => {
    const i = HB.indexOf('function hbParse('); const body = HB.slice(i, HB.indexOf('\n}\n', i));
    assert.ok(/const rest = hbBoardRest\(q\);[\s\S]*return Object\.assign\(\{ toBoard: true \}, r2\)/.test(body), 'the rest is read, the act carries toBoard');
    assert.ok(/if \(s\.length < 40\) return \{ act: 'face', face: 'board' \}/.test(body), 'bare "board" still turns the face');
    const a = HB.indexOf('function hbAsk('); const ask = HB.slice(a, HB.indexOf('\n}\n', a));
    assert.ok(ask.includes("if (r.toBoard && s.face !== 'board') hbSetFace('board');"), 'hbAsk turns to the Board first');
    const r = HB.indexOf('function hbAskReadingOf('); const rd = HB.slice(r, HB.indexOf('\n}\n', r));
    assert.ok(rd.includes('|| r.toBoard ||'), 'a toBoard act passes the map-side wall');
  });
});

describe('f872 (2) the free reader steps aside for the Board', () => {
  const N = navStage();
  test('a party named with the board, the map or Explorer is never their folder', () => {
    assert.equal(N.navRead('show me juno logistics on the board', { box: 'window' }), null);
    assert.equal(N.navRead('juno logistics on the map', { box: 'window' }), null);
  });
  test('…and alone, or with "folder", it still is', () => {
    const a = N.navRead('juno logistics folder', { box: 'window' });
    assert.ok(a && a.nav && a.nav.k === 'party', JSON.stringify(a));
  });
});

describe('f872 (3) "show them on the board" is the last answer\'s set', () => {
  const stage = history => fnOf(CA, 'caReadThese', {
    CA_THESE_RE: /(?<![\p{L}])(?:them|these|those|these ones|those ones|dem|dessa|de där|de)(?![\p{L}])/iu,
    CA_THESE_PLACE: [['board', /(?<![\p{L}])(?:board|dashboard|tavlan)(?![\p{L}])/iu], ['explorer', /(?<![\p{L}])(?:map|explorer|kartan|utforskaren)(?![\p{L}])/iu], ['contracts', /(?<![\p{L}])(?:contracts page|contracts list|the list|as a list|avtalslistan|listan)(?![\p{L}])/iu]],
    caLastSet: fnOf(CA, 'caLastSet', { intel: { history }, getContract: id => ({ id }) }),
    _caT: (k, v) => k + ':' + JSON.stringify(v) });
  test('the chat\'s set, a list it drew, a narrowing\'s ids: the newest wins', () => {
    const read = stage([{ role: 'assistant', text: 'old', cardIds: ['MK-X'] }, { role: 'user', text: 'q' }, { role: 'assistant', text: 'two', cardIds: ['MK-A1', 'MK-A2'] }]);
    const a = read('show them on the board');
    assert.deepEqual([a.place, a.narrow.ids, a.narrow.these], ['board', ['MK-A1', 'MK-A2'], true]);
    assert.equal(stage([{ role: 'assistant', listIds: ['MK-1', 'MK-2', 'MK-3'], listTitle: 'late' }])('put these on the map').narrow.what, 'late');
    assert.equal(stage([{ role: 'assistant', act: { kind: 'go', narrow: { ids: ['MK-9'], what: 'Juno' } } }])('visa dem på tavlan').narrow.n, 1);
  });
  test('no set behind it, or no place named, and the words are somebody else\'s', () => {
    assert.equal(stage([{ role: 'assistant', text: 'words only' }])('show them on the board'), null);
    assert.equal(stage([{ role: 'assistant', cardIds: ['MK-A1'] }])('show them'), null);
    assert.equal(stage([{ role: 'assistant', cardIds: ['MK-A1'] }])('show the board'), null);
  });
  test('it is read before every other reader, and the Board draws the set as its found card', () => {
    const i = CA.indexOf('function caUnderstand('); const u = CA.slice(i, i + 1500);
    assert.ok(u.indexOf('caReadThese(t)') > 0 && u.indexOf('caReadThese(t)') < u.indexOf('navRead(t, { box })'), 'these before the free reader');
    const g = CA.indexOf('function caGoNarrowed('); const go = CA.slice(g, CA.indexOf('\n}\n', g));
    assert.ok(/if \(!rest && ids && ids\.length && typeof hbShowFound === 'function'\)/.test(go), 'a bare set is the Board\'s found card');
    assert.ok(go.includes('_caBoardSaid = hbAsk(rest)'), 'the Board\'s own line is kept for the host');
  });
});

describe('f872 (4) the screen\'s sentence carries the map and the Board, the same on both hosts', () => {
  const serverSays = p => { const i = SV.indexOf('function pageSays('); const body = SV.slice(i, SV.indexOf('\n}\n', i) + 2); return vm.runInNewContext(body + '\npageSays(P);', { P: p }); };
  const mineSays = p => { const i = AI.indexOf('function aiPageSays('); const body = AI.slice(i, AI.indexOf('\n}\n', i) + 2); return vm.runInNewContext(body + '\naiPageSays(P);', { P: p }); };
  test('Explorer: the map as drawn', () => {
    const page = { view: 'dashboard', name: 'Explorer (the map of the book)', face: 'explorer', map: '12 of 187 contracts drawn; grouped by value stream; floors by stage' };
    const a = mineSays(page), b = serverSays(page);
    assert.ok(/The map shows: 12 of 187 contracts drawn; grouped by value stream; floors by stage\./.test(a), a);
    assert.equal(a, b);
  });
  test('the Board: as it stands, and the model told to answer from it', () => {
    const page = { view: 'dashboard', name: 'Home (the Board)', face: 'board', board: 'Your book (the six figures at the top): 10 live contracts.\nOpen card: "Naivas".' };
    const a = mineSays(page), b = serverSays(page);
    assert.ok(a.includes('The Board as it stands:\nYour book (the six figures at the top): 10 live contracts. Open card: "Naivas".\nAnswer from these numbers when the question is about the Board. '), a);
    assert.equal(a, b);
  });
  test('aiPageContext names the face and borrows the two readings, never counting itself', () => {
    const i = AI.indexOf('function aiPageContext('); const body = AI.slice(i, AI.indexOf('\n}\n', i));
    for (const need of ["if (view === 'dashboard')", 'hbFace()', 'hbBoardNow()', 'igMapNow()', 'AI_HOME_FACE_NAMES[face]']) assert.ok(body.includes(need), need);
    const m = IG.indexOf('function igMapNow('); const map = IG.slice(m, IG.indexOf('\n}\n', m));
    assert.ok(map.includes('buildGraphModel()') && map.includes('igBookTotal()') && map.includes('igRecipeSays()'), 'the map\'s own readings');
  });
});

describe('f872 (5) "what am I looking at", said another way', () => {
  const re = vm.runInNewContext(AI.slice(AI.indexOf('const AI_HERE_ASK_RE='), AI.indexOf('\n', AI.indexOf('const AI_HERE_ASK_RE='))) + '\nAI_HERE_ASK_RE');
  test('seen, looking at, on my screen, this view, describe this page, where am I — in both languages', () => {
    for (const q of ['what am i seeing on screen', 'What am I looking at?', 'what is on my screen', 'what does this view show', 'describe this page', 'where am I', 'vad ser jag på skärmen', 'vad visas på skärmen'])
      assert.ok(re.test(q), q);
  });
  test('"explain what I am looking at" is the map\'s own tour, not this', () => {
    assert.ok(!re.test('explain what I am looking at'));
    assert.ok(!re.test('what am I looking at in clause 7'));
  });
});

describe('f872 (6) act first, then explain', () => {
  /* ONE RULE (owner, 24 Oct 2026): a command is never explained, a brain-verb sentence never drawn; a question the Board drew is always explained */
  const rule = (ai, wh) => fnOf(IG, 'igAskThenExplain', { caAiFirst: () => ai, CA_WH_Q: wh, hbCommandAsk: q => !wh.test(q) && !/\?\s*$/.test(q) && !/^tell/i.test(q), hbBrainVerb: q => /^tell/i.test(q) });
  const WH = /^\s*(which|what|whats|who|whos|whom|whose|when|why|how (many|much|long|often|do|does|can)|does|do|did|is|are|can|could|should|vilk\w*|vad|vem|när|varför|hur)\b/i;
  test('a question the Board only DREW (a q: card, a follow-up) gets Jambo\'s words', () => {
    const r = rule(true, WH);
    assert.equal(r('what ends this quarter', { road: 'free', kind: 'dig', r: { key: 'q:what ends this quarter' } }), true);
    assert.equal(r('where is my biggest concern as far as payment terms?', { road: 'free', kind: 'dig', r: { key: 'q:…' } }), true);
    assert.equal(r('and by counterparty?', { road: 'free', kind: 'follow' }), true);
  });
  test('a command, a figure\'s own answer, a verified view, no engine: the Board\'s line is the answer; a count the Board drew is explained too', () => {
    const r = rule(true, WH);
    assert.equal(r('chart value by stream', { road: 'free', kind: 'dig', r: { key: 'q:chart value by stream' } }), false);
    assert.equal(r('how many live contracts do we have', { road: 'free', kind: 'dig', r: { key: 'f:live' } }), false);
    assert.equal(r('how many contracts have value between 2 million and 40 million?', { road: 'free', kind: 'dig', r: { key: 'q:…' } }), true);
    assert.equal(r('tell me where we have the highest risk', { road: 'free', kind: 'dig', r: { key: 'q:…' } }), false);
    assert.equal(r('what is our exposure', { road: 'free', kind: 'verified' }), false);
    assert.equal(rule(false, WH)('what ends this quarter', { road: 'free', kind: 'dig', r: { key: 'q:x' } }), false);
  });
  test('the explain call puts the question last again, never stored twice', () => {
    const i = IG.indexOf('async function intelChatAsk('); const body = IG.slice(i, IG.indexOf('\n}\n', i));
    assert.ok(body.includes("if(opts&&opts.explain&&(!msgs.length||msgs[msgs.length-1].role!=='user')) msgs.push({ role:'user', content:String(q) });"));
    assert.ok(IG.includes("await intelChatAsk(q, { explain:true })"));
    assert.ok(AI.includes("const noEcho=_aiNoEchoOnce; _aiNoEchoOnce=false;") && AI.includes("if(!noEcho) aiPush('user',{text:esc(q), raw:q});"), 'the window\'s explain asks without an echo');
    assert.ok(AI.includes("_aiNoEchoOnce=true; return aiAskWords(q);"));
  });
});

describe('f872 (7) one reader: the window on Home, the Board off Home', () => {
  test('on Home the window hands its words to Home\'s own box, and the one conversation shows the turn', () => {
    const i = AI.indexOf('async function aiSubmit('); const body = AI.slice(i, AI.indexOf('\nasync function aiAskWords(', i));
    assert.ok(body.includes("if(!cardOwns && homeCmd && typeof window.intelAsk==='function' && document.getElementById('igd-input'))"), 'a command (or a question the Board can draw) is handed to Home\'s box');
    assert.ok(body.includes("hbCommandAsk(q))||(typeof window.hbDrawAsk==='function'&&hbDrawAsk(q))||(typeof window.caReadThese==='function'&&!!caReadThese(q))"));
    assert.ok(body.includes('await intelAsk(q, { fromWindow:true })'));
  });
  test('off Home a Board command turns to the Board and draws; a question is never moved', () => {
    const i = AI.indexOf('async function aiSubmit('); const body = AI.slice(i, AI.indexOf('\nasync function aiAskWords(', i));
    assert.ok(body.includes("A=hbAskReadingOf(q,'board')"));
    assert.ok(body.includes("const isCmd=(typeof window.hbCommandAsk==='function')&&hbCommandAsk(q);") && body.includes("if(isCmd&&A&&A.road==='free'){"), 'a command only; a question is never moved');
    assert.ok(body.includes("caHomeFace('board');"));
  });
  test('a set the window\'s answer names is a door to the Board (the one door, hbShowFound)', () => {
    assert.ok(AI.includes('data-ai-board-go="${i}"'));
    assert.ok(/data-ai-board-go\]'\); if\(!b\) return;[\s\S]*hbShowFound\(ids, title\)/.test(AI));
  });
  test('a page asked by name leaves the Board ("obligations page"); a bare word stays the Board\'s', () => {
    const i = CA.indexOf('function caPlaceOf('); const body = CA.slice(i, CA.indexOf('\n}\n', i));
    assert.ok(body.includes('const tailed = CA_PLACE_TAIL.test('));
    assert.ok(body.includes("if (!tailed && caOnBoard() && typeof hbParse === 'function')"));
  });
});

describe('f872 (8) a Board question is the chat\'s, told the Board; "why does the board say…" stays checked', () => {
  test('the routing, and the context the panel sends', () => {
    const i = IG.indexOf('async function intelAsk('); const body = IG.slice(i, IG.indexOf('\n}\n', i));
    assert.ok(body.includes('else if(boardQ&&!boardWhy)                          await intelChatAsk(q);'));
    assert.ok(body.includes('boardWhy=!!(A0&&A0.why)'));
    const c = IG.indexOf('async function intelChatAsk('); const chat = IG.slice(c, IG.indexOf('\n}\n', c));
    assert.ok(chat.includes("ctx=Object.assign(aiChatContext(), { view:'intel' })"), 'the same context the window sends');
  });
  test('the words live in both books', () => {
    const I = R('js/i18n.js');
    for (const k of ['ai_here_map', 'ai_here_map_by', 'ai_here_map_says', 'ai_here_board_card', 'ai_here_board_none', 'ca_and_these', 'ca_these_what'])
      assert.equal((I.match(new RegExp(`^\\s+${k}: `, 'gm')) || []).length, 2, k);
  });
});

describe('f872 (9) one rule in every box (owner, 24 Oct 2026, "give all the jambos the ability")', () => {
  const reOf = (src, name) => { const m = src.match(new RegExp('const ' + name + ' = (/[\\s\\S]*?/[a-z]*);')); assert.ok(m, name + ' is defined'); return vm.runInNewContext(m[1]); };
  test('"tell me…", "create a table…" are the brain\'s: a brain verb, never a draft', () => {
    const VERB = reOf(HB, 'HB_BRAIN_VERB_RE'), AN = reOf(CA, 'CA_DRAFT_ANALYSIS');
    for (const q of ['tell me where we have the highest risk', 'create a table for juno llc payment terms', 'explain the payment terms', 'berätta var risken är störst']) assert.ok(VERB.test(q), q);
    for (const q of ['show value by stream on the board', 'chart value by stream', 'open contracts', 'what ends this quarter?']) assert.ok(!VERB.test(q), q);
    for (const q of ['create a table for juno llc payment terms', 'make me a chart of renewals', 'build a quick list of the late ones', 'skapa en tabell över betalningsvillkor']) assert.ok(AN.test(q), q);
    for (const q of ['draft an NDA with Volvo', 'create a distributor agreement with Juno']) assert.ok(!AN.test(q), q);
  });
  test('the readers are published and asked where the words arrive', () => {
    assert.ok(/Object\.assign\(window, \{[^}]*hbCommandAsk, hbDrawAsk/.test(HB) && HB.includes('hbChartWords'));
    assert.ok(CA.includes('Object.assign(window, { CA_DRAFT_ANALYSIS,') && CA.includes('if (CA_DRAFT_ANALYSIS.test(t)) return false;'));
    const i = IG.indexOf('async function intelAsk('); const body = IG.slice(i, IG.indexOf('\n}\n', i));
    assert.ok(body.includes("const boardCmd=(typeof window.hbCommandAsk==='function')?hbCommandAsk(q):false;"));
    assert.ok(body.includes("const boardDraw=!boardCmd&&(typeof window.hbDrawAsk==='function')&&hbDrawAsk(q);"));
    assert.ok(body.includes("(boardCmd||boardDraw) && typeof window.hbAsk==='function'"), 'the Board acts on a command or a drawable question only');
    assert.ok(body.includes("const boardQ=igBoardNow()&&!boardCmd&&!boardDraw&&"), 'everything else on the Board is the chat\'s');
  });
  test('the window\'s first open stands beside Home\'s panel, and its answers carry their contracts', () => {
    assert.ok(AI.includes("const d = document.getElementById('ig-dock');") && AI.includes('function aiFloatBeside()'));
    assert.ok(AI.includes('return choices.length?{ text, cards:extra, cardIds, choices }:{ text, cards:extra, cardIds };'));
    assert.ok(IG.includes("if(typeof window.aiFloatBeside==='function'){ try{ aiFloatBeside(); }catch(_){}"));
  });
});
