'use strict';
/* F542 — THE BOARD DRAWS WHAT YOU ASK, HOWEVER YOU SAY IT (Young, 7 Oct 2026,
   docs/WORKORDER-one-build-board-and-panel.md, part A)
     (A1) "value against time left" is the bubbles picture's own words, and
          "of" connects: the recipe reader leaves nothing over.
     (A2) the opening words never decide the road: the five openings read
          alike; a contract is opened by name only with no chart words.
     (A3) on the board an answer with no board actions never reaches the map:
          hbBoardNoMap is asked first in intelGraphAsk.
     (A4) a sentence naming a chart is dropped when no card landed.
     (A5) the server takes the map's fields off a board reply unless the map
          was asked for, and the board prompt shows a picture as add_card. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function region(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && !--d) return src.slice(at, i + 1);
  }
  throw new Error('unbalanced ' + name);
}
const HB = read('js/views/homeboard.js');
const IG = read('js/views/intelligence.js');
const SRV = read('server/server.js');
function board(contracts){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: contracts || [], settings: {}, view: 'dashboard' };
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(HB);
  return w;
}
const PHRASES = ['bubble chart of value against time left', 'value against time left', 'bubbles', 'contracts by stage as a pie',
  'value by stream', 'signed contracts by month with a trend', 'top 5 counterparties by value', 'value by counterparty as a treemap',
  'a pie of payment terms', 'payment terms pie', 'chart of renewals by month'];
const OPEN = ['', 'show me ', 'give me ', 'can you draw ', 'I want to see '];

test('(A1) the bubbles picture\'s own words are read, and nothing is left over', () => {
  const w = board();
  for (const q of ['bubble chart of value against time left', 'value against time left', 'value versus time to expiry', 'a pie of payment terms']){
    const R = w.hbRecipeRead(q);
    assert.ok(R, q + ' is a chart');
    assert.equal(R.left, '', q + ' leaves nothing over: ' + R.left);
  }
  assert.equal(w.hbRecipeRead('value against time left').pic, 'bubbles');
  assert.equal(w.hbRecipeRead('bubble chart of value against time left').measure, 'value');
});

test('(A2) the five openings give the same reading', () => {
  const w = board();
  for (const p of PHRASES){
    const cells = OPEN.map(o => { const A = w.hbAskReadingOf(o + p); return A ? A.road + ':' + JSON.stringify(A.r || A.fu || null) : 'null'; });
    assert.ok(cells.every(c => c === cells[0]), p + ' → ' + cells.join(' | '));
    assert.match(cells[0], /^free:/, p + ' is HaTi\'s own');
  }
});

test('(A2) a contract opens by name only when no chart words are said', () => {
  const w = board([
    { id: 'MK-9', name: 'Cold store lease', counterparty: 'Tundra Cold Chain Ltd', status: 'Signed', folder: 'f', metadata: {} },
    { id: 'MK-8', name: 'Fuel cards', counterparty: 'Savanna Fuels', status: 'Signed', folder: 'f', metadata: {} },
  ]);
  assert.equal(w.hbOpenOne('show me Tundra Cold Chain Ltd').id, 'MK-9');
  assert.equal(w.hbOpenOne('bring up Savanna Fuels').id, 'MK-8');
  assert.equal(w.hbOpenOne('show me Tundra Cold Chain Ltd by month'), null, 'chart words make it a chart');
  assert.equal(w.hbFindContract('show me Tundra Cold Chain Ltd by month'), null);
  assert.equal(w.hbOpenOne('value by stream'), null);
});

test('(A3) on the board, an answer without board actions is read by the board before the map', () => {
  const f = code(region(IG, 'intelGraphAsk'));
  const no = f.indexOf('hbBoardNoMap('), apply = f.indexOf('intelGraphApply(');
  assert.ok(no > 0 && apply > no, 'hbBoardNoMap is asked before intelGraphApply');
  const nm = code(region(HB, 'hbBoardNoMap'));
  assert.match(nm, /hbMapAsked\(/, 'the map, when asked for, keeps its road');
  assert.match(nm, /HB_MAP_FIELDS\.forEach/, 'a set loses the map\'s fields');
  assert.match(nm, /hbBoardApply\(\[\{ do: 'add_card'/, 'a picture HaTi read is a card, through the one writer');
  assert.match(nm, /retry\(HB_NO_MAP_NOTE\)/, 'Copilot is asked once more');
  /* the narrowing does not hang on "show me" */
  assert.doesNotMatch(code(IG), /only\|just\|which\|what\|show me\|among/);
});

test('(A4) a sentence naming a chart is dropped when no card landed', () => {
  const w = board();
  const out = w.hbProseChecked('This bubble chart plots contracts by expiry date. Four contracts end soon.', { nothingDrawn: true });
  assert.doesNotMatch(out.text, /bubble chart/);
  assert.match(out.text, /Four contracts end soon/);
  assert.match(code(region(HB, 'hbBoardAnswer')), /nothingDrawn: !applied\.length/);
});

test('(A5) the server takes the map\'s fields off a board reply unless the map was asked for', () => {
  const mk = new Function(code(region(SRV, 'graphMapAsked')) + '\n' + code(region(SRV, 'graphBoardReplyClean'))
    + '\nreturn { graphMapAsked, graphBoardReplyClean };');
  const env = mk.call(null);
  const GRAPH_MAP_FIELDS = (/const GRAPH_MAP_FIELDS = (\[[^\]]+\])/.exec(SRV) || [])[1];
  assert.ok(GRAPH_MAP_FIELDS, 'one list of the map\'s fields');
  for (const k of ['groupBy', 'floorsBy', 'columnsBy', 'colourBy', 'sizeBy', 'labelBy', 'timeBy', 'view', 'look']) assert.ok(GRAPH_MAP_FIELDS.includes(`'${k}'`), k);
  assert.equal(env.graphMapAsked('bubble chart of value against time left'), false);
  assert.equal(env.graphMapAsked('show these on the map'), true);
  assert.equal(env.graphMapAsked('value by stream as a heat map'), false, 'a heat map is a picture, not the map');
  assert.match(SRV, /res\.json\(graphBoardReplyClean\(\{/);
  assert.match(SRV, /onBoard && !graphMapAsked\(query\)\)\)/);
  assert.match(SRV, /add_card \{which:\{all:true\}, recipe:\{pic:"bubbles", measure:"value"\}\}/, 'the prompt shows a picture answered as a card');
});
