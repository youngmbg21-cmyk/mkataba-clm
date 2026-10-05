/* f500 — PREVIEW BIG BUILDS, AND ONE-PRESS UNDO (the owner's work order,
   Part 5, 4 Oct 2026: "A big build is the owner's choice. Any change can be
   taken back.")

     A. an answer adding two or more cards, or removing any, applies NOTHING
        until pressed; "Add chosen" adds only the ticked ones; one card still
        applies at once;
     B. undo restores exactly the board before, for every kind of change — a
        press, the free reader, Copilot — and changes made in one go are one
        step back; the store keeps ten and survives a reload;
     C. Ctrl/⌘+Z on the board undoes, never inside a box being typed in;
     D. the presses ride as the message's own parts (the panel strips
        buttons from an answer's text). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const tick = () => new Promise(r => setTimeout(r, 1));

function world(){
  const w = buildWorld({ intelView: true }).win;
  const cs = Array.from({ length: 12 }, (_, k) => ({ id: 'MK-' + (100 + k), name: 'A' + k, counterparty: ['Juno AB', 'Naivas', 'Bidco'][k % 3], status: k % 3 ? 'Signed' : 'Draft', value: 1e6, folder: k % 2 ? 'proc' : 'sales', audit: [], metadata: {} }));
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {}; w.hbSave();
  /* these tests name Copilot's cards: the question asked for a board to be built (the honest reply, f511) */
  w.hbBoardApply([], 'build me a dashboard');
  return w;
}
const add = (title, recipe) => ({ do: 'add_card', which: { all: true }, title, recipe: recipe || { pic: 'ring', split: { by: 'folder' } } });
const shape = w => JSON.parse(w.hbShapeOf(w.hbS()));

describe('F500 (A) — a big build waits for the reader', () => {
  test('three cards are offered, nothing applied; Add chosen adds only the ticked', async () => {
    const w = world(); await tick();
    const said = await w.hbBoardTakesChecked({ actions: [add('One'), add('Two'), add('Three')], answer: 'Three views.' });
    const meta = w.hbTakeMeta();
    assert.equal(w.hbS().panels.length, 0, 'nothing applied');
    assert.match(said, /^Copilot proposes 3 changes to the board\. Nothing changes until you choose:/);
    assert.equal(meta.preview.rows.length, 3); assert.equal(meta.preview.adds, true);
    assert.match(meta.preview.rows[0], /^Add “One” — Ring · by value stream · count, 12 contracts$/);
    const out = w.hbPreviewPress(meta.preview.id, 'chosen', [0, 2]);
    assert.deepEqual(Array.from(w.hbS().panels.map(p => p.title)).sort(), ['One', 'Three']);
    assert.match(out.html, /1 was left out, as chosen\./); assert.ok(out.undo > 0, 'the result carries Undo');
    assert.deepEqual(w.hbPreviewPress(meta.preview.id, 'all').html, 'That proposal is no longer open — ask again.', 'a list is pressed once');
  });
  test('a removal is offered too; one card applies at once', async () => {
    const w = world(); await tick();
    w.hbBoardApply([add('Keep')]); await tick();
    const id = w.hbS().panels[0].id;
    await w.hbBoardTakesChecked({ actions: [{ do: 'remove_card', card: id }] });
    const m = w.hbTakeMeta();
    assert.ok(m.preview && !m.preview.adds && /^Remove “Keep”$/.test(m.preview.rows[0]), JSON.stringify(m));
    assert.equal(w.hbS().panels.length, 1, 'not removed yet');
    await w.hbBoardTakesChecked({ actions: [add('Now')] });
    assert.equal(w.hbS().panels.length, 2, 'one card lands at once');
    assert.ok(w.hbTakeMeta().undo > 0, 'with Undo');
  });
});

describe('F500 (B) — undo restores exactly the board before', () => {
  test('a press, the free reader, Copilot, a removal, an arrangement: each one step back', async () => {
    const w = world(); await tick();
    const states = [shape(w)];
    w.hbBoardApply([add('A'), add('B')]); await tick(); states.push(shape(w));            /* Copilot, two cards in one go */
    w.hbRecipeSet(w.hbS().panels[0].key, 'pic', 'bars'); await tick(); states.push(shape(w)); /* a press */
    w.hbAsk('Juno contracts by stream'); await tick(); states.push(shape(w));             /* the free reader */
    w.hbArrange([w.hbS().panels[0].id], {}); await tick(); states.push(shape(w));          /* arrange */
    w.hbPanelAct(w.hbS().panels[1].id, 'x'); await tick(); states.push(shape(w));          /* remove */
    for (let i = states.length - 2; i >= 0; i--){
      assert.ok(w.hbUndo(), 'undo step ' + i);
      assert.deepEqual(shape(w), states[i], 'exactly the board before, step ' + i);
    }
    assert.equal(w.hbUndo(), false, 'nothing left to undo');
  });
  test('an answer\'s Undo goes back to before that answer, even past later steps', async () => {
    const w = world(); await tick();
    const before = shape(w);
    w.hbAsk('Juno contracts by stream'); const n = w.hbTakeMeta().undo; await tick();
    w.hbRecipeSet('q:Juno contracts by stream', 'pic', 'bars'); await tick();
    assert.ok(n > 0);
    assert.ok(w.hbUndo(n));
    assert.deepEqual(shape(w), before);
  });
  test('ten kept, and a reload keeps them', async () => {
    const w = world(); await tick();
    for (let i = 0; i < 13; i++){ w.hbRecipeSet('q:contracts by stream', 'order', 'top:' + (i + 1)); await tick(); }
    assert.equal(w.hbS().undo.length, 10);
    const me = w.currentUser; w.currentUser = () => ({ id: 'u_other' }); w.hbS(); w.currentUser = me;
    assert.equal(w.hbS().undo.length, 10, 'read back from this person\'s own board');
    assert.ok(w.hbUndo()); assert.equal(w.hbS().recipe['q:contracts by stream'].top, 12);
  });
});

describe('F500 (C, D) — Ctrl/⌘+Z, and the presses the panel draws', () => {
  test('Ctrl+Z undoes on the board, not in a box being typed in', async () => {
    const w = world(); await tick();
    w.hbBoardApply([add('Z')]); await tick();
    w.document.body.innerHTML = '<input id="box"><div id="hb-board"></div>';
    w.toast = () => {};
    const key = target => w.hbOnKey({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, target, preventDefault(){} });
    key(w.document.getElementById('box'));
    assert.equal(w.hbS().panels.length, 1, 'typing keeps its own undo');
    key(w.document.body);
    assert.equal(w.hbS().panels.length, 0, 'the board stepped back');
  });
  test('the panel draws the ticks and Undo from the message\'s own parts', () => {
    const src = read('js/views/intelligence.js');
    assert.match(src, /m\.preview&&typeof window\.hbPreviewHtml==='function'\)\?hbPreviewHtml\(m\.preview\)/);
    assert.match(src, /m\.undo&&typeof window\.hbUndoHtml==='function'\)\?hbUndoHtml\(m\.undo\)/);
    assert.match(src, /hbTakeMeta\(\):\{\}\)\); renderIntelDock\(\); return; \}/, 'the free reader\'s answer carries them');
    const w = world();
    assert.match(w.hbPreviewHtml({ id: 'pv1', adds: true, rows: ['Add “<b>x</b>”'] }), /&lt;b&gt;x&lt;\/b&gt;/, 'a row is text, never markup');
  });
  test('one writer of the undo store', () => {
    const src = read('js/views/homeboard.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.equal((src.match(/s\.undo\s*=(?!=)/g) || []).length, 3, 'hbUndoMark adds, hbUndo steps back, and the loader reads it back');
    assert.match(src, /if \(v && Array\.isArray\(v\.undo\)\) s\.undo = v\.undo\.filter/);
    const i = src.indexOf('function hbSave('); assert.match(src.slice(i, i + 200), /hbUndoMark\(s\)/);
  });
});
