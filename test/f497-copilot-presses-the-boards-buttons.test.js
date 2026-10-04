/* f497 — COPILOT PRESSES THE BOARD'S BUTTONS, SEVERAL AT ONCE (the owner's
   work order, Part 2, 4 Oct 2026; the CopilotKit pattern: the copilot acts
   through the app's own controls)

   "Build me a renewals dashboard" becomes four or five cards in one answer.
   On the board Copilot is handed the board's own buttons — add_card,
   change_card, remove_card, arrange, name_card, filter_board — and answers
   with a LIST; ONE applier (hbBoardApply) presses them in order, each through
   the writer a press uses, and says what it did in HaTi's words.

     A. the tools the server gives the model are the applier's, word for word;
     B. every action goes through a press's own writer (a source sweep);
     C. several actions apply in order, and each is said;
     D. what the board cannot do is said, never done half;
     E. Copilot's cards are kept with the board and described to Copilot by
        their refs. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

function book(){
  const cs = [];
  const cps = ['Juno AB', 'Naivas', 'Juno AB', 'Bidco', 'Sendy', 'Juno AB'];
  for (let k = 0; k < 18; k++) cs.push({ id: 'MK-' + (100 + k), name: 'Agreement ' + k, counterparty: cps[k % cps.length], status: k % 4 ? 'Signed' : 'Draft', value: 1e6 * (1 + k % 3),
    folder: k % 2 ? 'proc' : 'sales', expiry: mon(1 + (k % 9)), signedAt: k % 4 ? mon(-1 - (k % 10), 10) : null, audit: [], metadata: {} });
  return cs;
}
function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: book(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {};
  return w;
}
const J = x => JSON.parse(JSON.stringify(x));
const SERVER = read('server/server.js');
const fnOf = name => { const i = SERVER.indexOf('function ' + name + '('); return SERVER.slice(i, SERVER.indexOf('\n}\n', i) + 2); };
const serverClean = list => {
  const consts = SERVER.split('\n').filter(l => /^const GRAPH_(CHART|BOARD)_[A-Z_]+ = /.test(l) && !/_PROPS|_SCHEMA/.test(l)).join('\n');
  return vm.runInNewContext(`${consts}\n${fnOf('graphChartSplit')}\n${fnOf('graphChartClean')}\n${fnOf('graphBoardActionsClean')}\ngraphBoardActionsClean(L);`, { L: list });
};

describe('F497 (A) — the tools the model is given are the applier\'s', () => {
  test('one list of actions, both sides', () => {
    const w = world();
    const arr = /const GRAPH_BOARD_ACTIONS = (\[[^\]]*\])/.exec(SERVER);
    assert.ok(arr, 'the server names the board\'s actions');
    assert.deepEqual(JSON.parse(arr[1].replace(/'/g, '"')), Array.from(w.HB_BOARD_ACTIONS));
    assert.match(SERVER, /do: \{ type: 'string', enum: GRAPH_BOARD_ACTIONS \}/, 'the schema\'s words are the list');
    assert.match(SERVER, /recipe: \{ type: 'object'[^}]*properties: GRAPH_CHART_PROPS \}/, 'a card\'s recipe is the one recipe language');
    assert.equal(Number(/GRAPH_BOARD_ACTIONS_MAX = (\d+)/.exec(SERVER)[1]), w.HB_ACTIONS_MAX);
  });
  test('on the board the model gets the actions instead of the single chart', () => {
    assert.match(SERVER, /\.\.\.\(onBoard \? \{ actions: GRAPH_BOARD_ACTIONS_SCHEMA[,}]/);
    assert.match(SERVER, /\} : \{ chart: \{ type: 'object', description: 'Fill ONLY when the request asks for a picture/, 'off the board, the one chart as before');
    assert.match(SERVER, /actions: onBoard \? graphBoardActionsClean\(out\.actions\) : null/);
    assert.match(SERVER, /add_card \{which, recipe, title\}/, 'the board\'s job names its buttons');
  });
  test('what the server cleans, the browser applies whole; junk is dropped on both sides', () => {
    const w = world();
    const said = [{ do: 'add_card', which: { q: 'Juno contracts' }, recipe: { pic: 'stack', split: 'month', date: 'signed', split2: 'stream' }, title: 'Juno <i>by month</i>' },
      { do: 'change_card', card: 'open', recipe: { pic: 'ring' } }, { do: 'launch_rockets' }, { do: 'arrange', order: ['p1', 7], sizes: { p1: 'big', p2: 'huge' } }];
    const S = J(serverClean(said));
    assert.deepEqual(S, [
      { do: 'add_card', which: { q: 'Juno contracts' }, recipe: { pic: 'stack', split: { by: 'date', unit: 'm', date: 'signed' }, split2: { by: 'folder' } }, title: 'Juno i by month /i' },
      { do: 'change_card', card: 'open', recipe: { pic: 'ring' } },
      { do: 'arrange', order: ['p1'], sizes: { p1: 'big' } }]);
    S.forEach(a => assert.deepEqual(J(w.hbActionClean(a)), a, 'the browser keeps ' + a.do + ' whole'));
    assert.equal(w.hbActionClean({ do: 'launch_rockets' }), null);
  });
});

describe('F497 (B) — every action goes through a press\'s own writer', () => {
  test('the applier writes nothing itself', () => {
    const src = read('js/views/homeboard.js').replace(/\/\*[\s\S]*?\*\//g, '');
    const i = src.indexOf('function hbBoardApply('), body = src.slice(i, src.indexOf('\n}\n', i));
    assert.doesNotMatch(body, /s\.panels\.(?:splice|push|shift)|s\.path\s*=|\.big\s*=|s\.recipe\[|\.title\s*=/, 'no write of its own');
    ['hbAddCard(', 'hbCardEdit(', 'hbPanelAct(', 'hbCrumb(', 'hbArrange(', 'hbPanelName(', 'hbDig(', 'hbCardSet('].forEach(f => assert.ok(body.includes(f), 'it presses through ' + f));
  });
  test('a press uses the same writers', () => {
    const src = read('js/views/homeboard.js');
    const i = src.indexOf('function hbOnClick('), body = src.slice(i, src.indexOf('\nfunction hbOnSubmit(', i));
    assert.match(body, /if \(hbPanelAct\(pid, act\)\) hbPaintBoard\(\);/, 'a panel\'s buttons');
    assert.match(body, /hbCrumb\(i\);/, 'the trail');
    const k = src.indexOf('function hbAddCard('), add = src.slice(k, src.indexOf('\n}\n', k));
    assert.match(add, /hbCardSet\(p\.key, clean, \{ seed: true \}\)/, 'a new card\'s recipe goes through the one writer');
    const t = src.indexOf('function hbBoardTakes('), takes = src.slice(t, src.indexOf('\n}\n', t));
    assert.match(takes, /hbBoardApply\(actions\)/, 'the single-chart answer is not a second road');
  });
});

describe('F497 (C) — several actions apply in order, each said', () => {
  test('a renewals dashboard in one answer', () => {
    const w = world();
    const res = { answer: 'Here is a renewals board.', actions: [
      { do: 'add_card', which: { all: true }, recipe: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, window: { next: 6, unit: 'm', date: 'end' } }, title: 'Ending, next 6 months' },
      { do: 'add_card', which: { q: 'Juno contracts' }, recipe: { pic: 'ring', split: { by: 'status' } }, title: 'Juno by stage' },
      { do: 'add_card', which: { all: true }, recipe: { pic: 'bars', split: { by: 'counterparty' }, top: 3, sort: { by: 'count', dir: 'down' } }, title: 'Top counterparties' },
      { do: 'add_card', which: { q: 'signed contracts' }, recipe: { pic: 'heat', split: { by: 'folder' }, split2: { by: 'counterparty' } }, title: 'Signed by stream and party' },
      { do: 'add_card', which: { all: true }, recipe: { pic: 'blocks', split: { by: 'folder' }, measure: 'value' }, title: 'Value by stream' }] };
    const said = w.hbBoardTakes(res).replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
    const s = w.hbS();
    assert.equal(s.panels.length, 5, 'five cards');
    assert.deepEqual(J(s.panels.slice().reverse().map(p => p.title)), res.actions.map(a => a.title), 'in the order asked, top first (the board draws its last first)');
    s.panels.forEach(p => { assert.match(p.key, /^cd:/); assert.ok(w.hbDigData(p.key, 'all'), 'each card counts its own set'); });
    const lines = said.split('\n');
    assert.equal(lines.filter(l => /^Added “/.test(l)).length, 5, said);
    assert.match(lines[lines.length - 1], /Here is a renewals board\./, 'Copilot\'s own sentence comes last');
    const top = s.panels.slice().reverse();
    const juno = w.hbDigData(top[1].key, 'all');
    assert.equal(juno.n, 9, 'the set is read from the plain words, by the map\'s own reader');
    const P = w.hbPlan(w.hbDigData(top[0].key, 'all'));
    assert.deepEqual(J(P.window), { next: 6, unit: 'm', date: 'end' });
  });
  test('change, name, arrange, remove and filter, in order', () => {
    const w = world();
    w.hbBoardApply([{ do: 'add_card', which: { all: true }, recipe: { pic: 'ring', split: { by: 'status' } }, title: 'A' },
      { do: 'add_card', which: { all: true }, recipe: { pic: 'bars', split: { by: 'folder' } }, title: 'B' }]);
    const s = w.hbS(), [a, b] = s.panels.slice().reverse();
    const r = w.hbBoardApply([
      { do: 'change_card', card: b.id, recipe: { split: { by: 'counterparty' }, top: 2 } },
      { do: 'name_card', card: a.id, title: 'Stages' },
      { do: 'arrange', order: [a.id, b.id], sizes: { [a.id]: 'big' } },
      { do: 'filter_board', which: { q: 'Juno contracts' } },
      { do: 'remove_card', card: 'B' }]);
    assert.deepEqual(J(r.refused), []);
    assert.equal(r.did.length, 5, r.did.join(' | '));
    assert.match(r.did[0], /^Changed “B”: now Bars · by counterparty/);
    assert.equal(a.title, 'Stages'); assert.equal(s.recipe[a.key].title, 'Stages', 'the recipe carries the name');
    assert.equal(a.big, true);
    assert.equal(w.hbCountKey(), 'q:Juno contracts', 'the board counts Juno');
    assert.ok(!s.panels.includes(b), 'B is gone');
    w.hbBoardApply([{ do: 'filter_board', which: { all: true } }]);
    assert.equal(w.hbCountKey(), null, 'and counts everything again');
  });
  test('the open chart is changed in place, as a press would', () => {
    const w = world();
    w.hbDig('q:Juno contracts by stage', false);
    const r = w.hbBoardApply([{ do: 'change_card', card: 'open', recipe: { pic: 'bars', split: { by: 'folder' } } }]);
    assert.match(r.did[0], /^Changed the open chart, “.+”: now Bars · by value stream/);
    assert.equal(w.hbS().recipe['q:Juno contracts by stage'].pic, 'bars');
  });
});

describe('F497 (D) — what the board cannot do is said', () => {
  test('an unknown step, a missing card, a ready-made panel, words naming nothing', () => {
    const w = world();
    w.hbAddPanel('obl');
    const obl = w.hbS().panels[0];
    const r = w.hbBoardApply([{ do: 'launch' }, { do: 'remove_card', card: 'p99' }, { do: 'change_card', card: obl.id, recipe: { pic: 'ring' } },
      { do: 'filter_board', which: { q: 'zzqx blorp' } }, { do: 'name_card', card: obl.id, title: 'Late' }]);
    assert.equal(r.did.length, 0);
    assert.match(r.refused.join(' | '), /Left out a step the board does not have\. \| There is no card “p99” on the board\. \| .+ is a ready-made panel/);
    assert.match(r.refused.join(' | '), /Could not tell which contracts “zzqx blorp” means/);
    assert.equal(w.hbCountKey(), null, 'the board was left as it was');
  });
  test('more steps than the board takes at once: the rest is said', () => {
    const w = world();
    const many = Array.from({ length: 14 }, (_, i) => ({ do: 'add_card', which: { all: true }, recipe: { pic: 'ring' }, title: 'C' + i }));
    const r = w.hbBoardApply(many);
    assert.match(r.refused[0], /Only the first 12 of 14 steps were done\./);
  });
});

describe('F497 (E) — Copilot\'s cards are kept with the board and described by ref', () => {
  test('a reload keeps the card, its set and its recipe', () => {
    const w = world();
    w.hbBoardApply([{ do: 'add_card', which: { q: 'Juno contracts' }, recipe: { pic: 'stack', split: { by: 'date', unit: 'q', date: 'signed' }, split2: { by: 'status' } }, title: 'Juno quarters' }]);
    const before = w.hbS().panels[0];
    /* a real reload: the board is read again from what this person's browser kept */
    const me = w.currentUser; w.currentUser = () => ({ id: 'u_other' }); w.hbS(); w.currentUser = me;
    const p = w.hbS().panels[0];
    assert.notEqual(p, before, 'read again, not the same object');
    assert.deepEqual(J({ key: p.key, which: p.which, title: p.title, pic: p.recipe.pic }), J({ key: before.key, which: { q: 'Juno contracts' }, title: 'Juno quarters', pic: 'stack' }));
    assert.equal(w.hbDigData(p.key, 'all').n, 9);
  });
  test('the board Copilot is shown names every card by its ref', () => {
    const w = world();
    w.hbBoardApply([{ do: 'add_card', which: { all: true }, recipe: { pic: 'ring', split: { by: 'status' } }, title: 'Stages' }]);
    w.hbDig('q:Juno contracts by month', false);
    const now = w.hbBoardNow();
    const p = w.hbS().panels[0];
    assert.match(now, new RegExp('Cards on the board, top first \\(ref: name — settings\\): ' + p.id + ': Stages — 18 contracts; pic=ring; split=stage'));
    assert.match(now, /The open chart is ref "open"\./);
  });
});
