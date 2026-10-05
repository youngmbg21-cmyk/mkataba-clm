/* f528 — CHARTS THAT EXPLAIN, PARTS 4 AND 5: DIG DEEPER (THE ANALYST) AND SHOWING THE WORKING
   (Young, 5 Oct 2026, "HaTi Board: Charts That Explain", recommendations 4
   and 5: "analyst mode with one merged Copilot" — "Copilot plans, HaTi
   counts" — and "show the working")
   ============================================================================
     (1) THE ROUTE — POST /api/board/analyst is stateless: the browser's steps
         are rebuilt as tool calls and results, each re-cleaned; at most five
         calculations, then the model MUST finish; a step the board cannot
         run becomes an empty finish; a card or a question is cleaned;
     (2) THE LOOP — each step is HaTi's own arithmetic (the board's planner,
         the answer packs), its fact sheet goes back; the summary keeps only
         sentences whose numbers are on a sheet; bounded;
     (3) SHOWING THE WORKING — the run is a focus card: the question, the
         checked answer, every step with its reading and a door onto the
         contracts it counted, the cards OFFERED (one press adds them through
         the one applier), next questions;
     (4) A PRESS, NEVER BY ITSELF — the button rides under Copilot's board
         answer only, its cost beside it, grey without Copilot; a refresh
         keeps the run (one cut short says so) and reads its lines as words;
     (5) both books.
   Run: node --test test/f528-board-dig-deeper.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

function world(opts = {}){
  const cs = []; let i = 0;
  const add = o => cs.push(Object.assign({ id: 'MK-' + (100 + i), name: 'A ' + i, status: 'Signed', value: 1e6, expiry: mon(6 + (i % 9)), audit: [], metadata: {}, _raisedAt: mon(-30) }, o, { id: 'MK-' + (100 + i++) }));
  for (let k = 0; k < 3; k++) add({ counterparty: 'Juno AB', folder: 'proc', value: 4e6, scan: { findings: [] }, _rk: 'high' });
  for (let k = 0; k < 2; k++) add({ counterparty: 'Naivas', folder: 'sales', value: 2e6, scan: { findings: [] }, _rk: 'low' });
  for (let k = 0; k < 4; k++) add({ counterparty: 'Baltic Oy', folder: 'sales', value: 1e6 });
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = () => 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = () => null; w.paySide = () => null; w.contractExpired = () => false;
  w.currentUser = () => ({ id: 'u1', name: 'Amina', role: 'legal' });
  w.riskOpenOf = c => c && c._rk ? [{ sev: c._rk === 'high' ? 'high' : 'low' }] : [];
  w.API_MODE = () => opts.api !== false;
  w.copilotAvailable = () => opts.live !== false;
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.recipe = {}; s.path = []; s.panels = []; s.digBig = false; s.face = 'board';
  return { w, cs };
}
/* the analyst, played back: each call answers the next scripted step */
function scripted(w, steps){
  const calls = [];
  w.api = async (p, m, body) => { calls.push({ p, m, body: JSON.parse(JSON.stringify(body)) }); const st = steps[Math.min(calls.length - 1, steps.length - 1)]; return { step: st }; };
  return calls;
}

describe('f528 (1) the route: stateless, cleaned, bounded', () => {
  let ai, h, W;
  before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base }); W = await seedWorkspace(h, {}); });
  after(async () => { await h.stop(); await ai.stop(); });
  const tu = (name, input) => [{ type: 'tool_use', id: 'tu_a', name, input }];
  const post = body => W.admin.json('/api/board/analyst', { method: 'POST', body });

  test('the steps so far are rebuilt as tool calls and results; any tool may come next', async () => {
    ai.reset();
    ai.script(tu('pack', { why: 'see the risks', name: 'risks' }));
    const r = await post({ question: 'Why is value at risk up?', guide: 'g', board: 'b', steps: [
      { name: 'calculate', input: { why: 'value by stream', which: { all: true }, recipe: { pic: 'bars', split: 'stream', measure: 'value', bogus: 1 } }, result: 'FACT SHEET — x\n- Contracts on this card: 9' }] });
    assert.deepEqual(r.step, { name: 'pack', input: { why: 'see the risks', name: 'risks' } });
    const body = ai.calls[ai.calls.length - 1].body;
    assert.deepEqual(body.tool_choice, { type: 'any' });
    assert.deepEqual(body.tools.map(t => t.name), ['calculate', 'pack', 'finish']);
    const m = body.messages;
    assert.equal(m.length, 3, 'the question, the step, its result');
    assert.equal(m[1].content[0].type, 'tool_use'); assert.equal(m[1].content[0].name, 'calculate');
    assert.ok(!('bogus' in m[1].content[0].input.recipe), 'a step is re-cleaned before it is replayed');
    assert.equal(m[2].content[0].type, 'tool_result'); assert.match(m[2].content[0].content, /^FACT SHEET/);
    assert.match(m[0].content, /never add, subtract or divide/, 'Copilot plans; HaTi counts');
  });
  test('after five calculations the model must finish', async () => {
    ai.reset();
    ai.script(tu('finish', { summary: 'Done.', cards: [], next: [] }));
    const st = { name: 'calculate', input: { why: 'w', recipe: { pic: 'bars' } }, result: 'r' };
    const r = await post({ question: 'q', steps: [st, st, st, st, st, st, st] });
    const body = ai.calls[ai.calls.length - 1].body;
    assert.deepEqual(body.tool_choice, { type: 'tool', name: 'finish' });
    assert.equal(body.messages.length, 11, 'seven steps sent, five replayed');
    assert.equal(r.step.name, 'finish');
  });
  test('a step the board cannot run becomes an empty finish; a finish is cleaned', async () => {
    ai.reset();
    ai.script(tu('pack', { why: 'w', name: 'everything' }));
    let r = await post({ question: 'q', steps: [] });
    assert.deepEqual(r.step, { name: 'finish', input: { summary: '', cards: [], next: [] } });
    ai.script(tu('finish', { summary: 'Juno <b>leads</b>.', next: ['a', 'b', 'c', 'd'],
      cards: [1, 2, 3, 4].map(n => ({ which: { q: 'Juno' }, recipe: { pic: 'ring', split: 'stage', nope: n }, title: 'Card ' + n })) }));
    r = await post({ question: 'q', steps: [] });
    assert.equal(r.step.input.cards.length, 3);
    assert.ok(!('nope' in r.step.input.cards[0].recipe));
    assert.deepEqual(r.step.input.cards[0].which, { q: 'Juno' });
    assert.equal(r.step.input.next.length, 3);
    assert.ok(!/[<>]/.test(r.step.input.summary), 'no markup survives');
  });
  test('the route is guarded like every Copilot route', () => {
    const src = read('server/server.js');
    assert.match(src, /app\.post\('\/api\/board\/analyst', auth, rlAiLight, aiFeature\('graph'\), aiBudgetGuard, capAiInput, boardAnalystHandler\)/);
    assert.match(src, /anthropicMessages\(key, 'deep', \{[^\n]*tools, tool_choice: must/);
  });
});

describe('f528 (2) the loop: HaTi counts every step; the summary is checked', () => {
  test('calculate and pack run HaTi\'s arithmetic; their fact sheets go back; a foreign number is cut', async () => {
    const { w } = world();
    const calls = scripted(w, [
      { name: 'calculate', input: { why: 'Who holds the value', which: { q: 'Juno' }, recipe: { pic: 'bars', split: { by: 'counterparty' }, measure: 'value' } } },
      { name: 'pack', input: { why: 'The top risks', name: 'risks' } },
      { name: 'finish', input: { summary: 'Juno AB holds most of it. 3 contracts carry a high risk. Prices rose 37% last year.', cards: [{ which: { all: true }, recipe: { pic: 'ring', split: { by: 'folder' } }, title: 'By stream' }], next: ['Which end first?'] } },
    ]);
    const run = await w.hbDigDeeper('Why is so much value at risk?');
    assert.equal(calls.length, 3);
    assert.equal(calls[0].p, 'board/analyst'); assert.equal(calls[0].body.steps.length, 0);
    assert.equal(calls[2].body.steps.length, 2);
    assert.match(calls[1].body.steps[0].result, /^FACT SHEET — /, 'a step\'s result is its fact sheet');
    assert.match(calls[1].body.steps[0].result, /Contracts on this card: 3/, 'the set the analyst named was counted');
    assert.equal(run.state, 'done');
    assert.equal(run.steps.length, 2);
    assert.equal(run.steps[0].n, 3);
    assert.equal(run.steps[1].dig, 'pk:risks');
    assert.match(run.summary, /Juno AB/);
    assert.match(run.summary, /3 contracts/);
    assert.ok(!/37%/.test(run.summary), 'a number on no sheet never reaches the page');
    assert.equal(run.dropped, 1);
    assert.equal(w.hbS().path.slice(-1)[0], 'an:' + run.id, 'the run is the focus card');
  });
  test('the loop is bounded: steps + 1 calls at most, then it stops', async () => {
    const { w } = world();
    const calls = scripted(w, [{ name: 'calculate', input: { why: 'again', recipe: { pic: 'bars' } } }]);
    const run = await w.hbDigDeeper('Keep counting');
    assert.equal(calls.length, w.HB_DD_STEPS + 1);
    assert.equal(run.steps.length, w.HB_DD_STEPS);
    assert.equal(run.state, 'empty');
  });
  test('words HaTi cannot read as a set count nothing, and say so to the analyst', () => {
    const { w } = world();
    const out = w.hbDdCalc({ which: { q: 'zzqx blorp' }, recipe: { pic: 'bars' } }, 'all');
    assert.equal(out.ids.length, 0);
    assert.match(out.say, /could not read/);
  });
  test('a failure is said on the card', async () => {
    const { w } = world();
    w.api = async () => { const e = new Error('provider down'); throw e; };
    const run = await w.hbDigDeeper('Why?');
    assert.equal(run.state, 'err');
    assert.match(run.err, /provider down/);
  });
});

describe('f528 (3) showing the working: the run\'s card', () => {
  test('question, checked answer, every step with its door, cards offered, next questions', async () => {
    const { w } = world();
    scripted(w, [
      { name: 'calculate', input: { why: 'Who holds the value', which: { q: 'Juno' }, recipe: { pic: 'bars', split: { by: 'counterparty' }, measure: 'value' } } },
      { name: 'finish', input: { summary: 'Juno AB holds it.', cards: [{ which: { all: true }, recipe: { pic: 'ring', split: { by: 'folder' } }, title: 'By stream' }], next: ['Which end first?'] } },
    ]);
    const run = await w.hbDigDeeper('Who holds the value?');
    const D = w.hbDigData('an:' + run.id, 'all');
    assert.equal(D.kind, 'analyst');
    const html = w.hbDigBodyHtml(D, 'all', false);
    const doc = new w.DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    assert.equal(doc.querySelector('.hb-dd-q').textContent, 'Who holds the value?');
    assert.match(doc.querySelector('.hb-why-b').textContent, /Juno AB holds it/);
    assert.equal(doc.querySelectorAll('.hb-dd-step').length, 1);
    const door = doc.querySelector('.hb-dd-step [data-hb-open]');
    assert.equal(door.getAttribute('data-hb-open').split(',').length, 3, 'the step\'s door opens the contracts it counted');
    assert.match(door.textContent, /3/);
    assert.match(doc.querySelector('.hb-dd-step').textContent, /Why: Who holds the value/);
    assert.ok(doc.querySelector('[data-hb-dd-add="' + run.id + '"]'), 'the cards are offered, not drawn');
    assert.equal(w.hbS().panels.length, 0);
    assert.equal(doc.querySelectorAll('[data-hb-next]').length, 1);
  });
  test('one press adds the offered cards through the one applier, once', async () => {
    const { w } = world();
    scripted(w, [{ name: 'finish', input: { summary: 'Fine.', cards: [{ which: { all: true }, recipe: { pic: 'ring', split: { by: 'folder' } } }, { which: { all: true }, recipe: { pic: 'bars', split: { by: 'counterparty' } } }], next: [] } }]);
    const run = await w.hbDigDeeper('Show me');
    const r = w.hbDdAddCards(run.id);
    assert.ok(r && r.did.length === 2);
    assert.equal(w.hbS().panels.length, 2);
    assert.equal(w.hbDdAddCards(run.id), null, 'a second press adds nothing');
    assert.ok(w.hbS().undo.length >= 1, 'the cards can be undone like any board change');
  });
});

describe('f528 (4) a press, never by itself', () => {
  test('the button: under a Copilot board answer, cost beside it, grey without Copilot', () => {
    let { w } = world();
    const on = w.hbDeeperHtml('Why?');
    assert.match(on, /data-hb-deeper="Why\?"/);
    assert.match(on, /up to 5 steps/);
    assert.ok(!/disabled/.test(on));
    ({ w } = world({ live: false }));
    assert.match(w.hbDeeperHtml('Why?'), /disabled/);
    w.hbS().face = 'map';
    assert.equal(w.hbDeeperHtml('Why?'), '', 'the map has no analyst');
    const intel = read('js/views/intelligence.js');
    assert.match(intel, /text:said\+igNoticeHtml\(res\.notice\), deeper:q/, 'it rides under Copilot\'s board answer');
    assert.match(intel, /m\.deeper&&!m\.err&&typeof window\.hbDeeperHtml==='function'\)\?hbDeeperHtml\(m\.deeper\)/, 'drawn by the panel, beside Undo and the marks');
    const hb = read('js/views/homeboard.js').replace(/\/\*[\s\S]*?\*\//g, '');
    const calls = (hb.match(/hbDigDeeper\(/g) || []).length;
    assert.equal(calls, 2, 'defined once, called once: from the press');
  });
  test('a refresh keeps the run; one cut short says so; its lines come back as words', () => {
    const { w } = world();
    const s = w.hbS();
    s.an = { r1: { id: 'r1', q: 'Why?', state: 'busy', steps: [{ name: 'calculate', title: 'T', lines: ['<img src=x onerror=alert(1)>Juno <b>leads</b>'], ids: ['MK-100'], n: 1 }], cards: [], next: [] } };
    w.hbSave();
    /* a refresh: the board is read again from this person's own record */
    const me = w.currentUser; w.currentUser = () => ({ id: 'u2' }); w.hbS(); w.currentUser = me;
    const run = w.hbDdRun('r1');
    assert.equal(run.state, 'err');
    assert.match(run.err, /refreshed/);
    assert.ok(!/</.test(run.steps[0].lines[0]), 'a stored line is never markup');
    assert.match(run.steps[0].lines[0], /Juno leads/);
  });
});

describe('f528 (5) both books', () => {
  test('every hb_dd_ key is in both books', () => {
    const I18N = read('js/i18n.js');
    const keys = [...new Set((I18N.match(/^    hb_dd_\w+:/gm) || []).map(x => x.trim()))];
    assert.ok(keys.length >= 15, keys.join(','));
    keys.forEach(k => assert.equal((I18N.match(new RegExp('^    ' + k, 'gm')) || []).length, 2, k));
  });
});
