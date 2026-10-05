/* f499 — CHECK AND REPAIR (the owner's work order, Part 4, 4 Oct 2026; the
   LIDA pattern: "Nothing wrong reaches the board quietly")

     A. ONE checker finds each problem, in plain words;
     B. a card that fails is NOT applied; the good ones are;
     C. what fails goes back to Copilot ONCE and only once, the retry is said,
        and what still fails is said in one line each;
     D. the free reader's cards go through the same checker: no retry, the
        same line. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

function book(){
  const cs = [];
  /* 30 counterparties, signing dates for a few only, no start dates at all */
  for (let k = 0; k < 40; k++) cs.push({ id: 'MK-' + (100 + k), name: 'A' + k, counterparty: 'Party ' + (k % 30), status: k % 4 ? 'Signed' : 'Draft', value: 1e6,
    folder: k % 2 ? 'proc' : 'sales', expiry: mon(1 + (k % 9)), signedAt: k % 4 && k < 8 ? mon(-1 - k, 10) : null, audit: [], metadata: {} });
  return cs;
}
function world(opts){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: book(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  if (opts && opts.noMoney) w.canViewValues = () => false;
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {};
  /* these tests name Copilot's cards: the question asked for a board to be built (the honest reply, f511) */
  w.hbBoardApply([], 'build me a dashboard');
  return w;
}
const kinds = (w, a) => Array.from(w.hbActionCheck(a)).map(p => p.k);
const add = (recipe, which, title) => ({ do: 'add_card', which: which || { all: true }, recipe, title: title || 'T' });

describe('F499 (A) — each problem is found, in plain words', () => {
  test('empty set, mostly empty date, too many groups, no history, unknown words, a picture that cannot show it', () => {
    const w = world();
    assert.deepEqual(kinds(w, add({ pic: 'ring' }, { q: 'zzqx blorp' })), ['which']);
    assert.deepEqual(kinds(w, add({ pic: 'cols', split: { by: 'date', unit: 'm', date: 'start' } })), ['date']);
    const d = Array.from(w.hbActionCheck(add({ pic: 'cols', split: { by: 'date', unit: 'm', date: 'start' } })))[0].say;
    assert.match(d, /^the start date is missing for 34 of 40 contracts$/);
    assert.deepEqual(kinds(w, add({ pic: 'bars', split: { by: 'counterparty' } })), ['groups']);
    assert.deepEqual(kinds(w, add({ pic: 'bars', split: { by: 'counterparty' }, top: 10 })), [], 'a top N makes it readable');
    assert.ok(kinds(w, add({ pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, trend: true, window: { next: 2, unit: 'm', date: 'end' } })).includes('trend'));
    assert.ok(kinds(w, add({ pic: 'ring', colour: 'neon' })).includes('unknown'));
    assert.ok(kinds(w, add({ pic: 'ring', split: { by: 'date', unit: 'm', date: 'end' } })).includes('pic'));
    assert.ok(kinds(w, add({ pic: 'ring', split: { by: 'folder' }, window: { last: 1, unit: 'm', date: 'created' } })).includes('period'));
    assert.deepEqual(kinds(w, add({ pic: 'ring', split: { by: 'folder' } })), [], 'a good card passes');
  });
  test('money a reader may not see', () => {
    const w = world({ noMoney: true });
    assert.ok(kinds(w, add({ pic: 'bars', split: { by: 'folder' }, measure: 'value' })).includes('money'));
  });
});

describe('F499 (B, C) — a failing card is not applied; the retry runs once', () => {
  test('one good, one bad: the good is added, the bad goes back once and its fix is added', async () => {
    const w = world(); let calls = 0, note = '';
    const res = { answer: 'Two cards.', actions: [add({ pic: 'ring', split: { by: 'folder' } }, null, 'Streams'), add({ pic: 'cols', split: { by: 'date', unit: 'm', date: 'start' } }, null, 'Starts')] };
    const said = await w.hbBoardTakesChecked(res, async n => { calls++; note = n; return { actions: [add({ pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' } }, null, 'Ends')] }; });
    assert.equal(calls, 1, 'one retry');
    assert.match(note, /did not apply these/); assert.match(note, /"Starts"/); assert.match(note, /start date is missing for 34 of 40/);
    assert.doesNotMatch(note, /"Streams"/, 'the good card is not sent back');
    assert.match(said.replace(/<[^>]+>/g, ' '), /One retry ran: 1 card went back to Copilot to be fixed\./);
    /* two cards from one answer are a preview (work order Part 5): nothing lands until pressed */
    assert.equal(w.hbS().panels.length, 0);
    const id = w.hbTakeMeta().preview.id;
    w.hbPreviewPress(id, 'all');
    assert.deepEqual(Array.from(w.hbS().panels.map(p => p.title)).sort(), ['Ends', 'Streams']);
  });
  test('a card that fails twice is not applied, and is said in one line', async () => {
    const w = world(); let calls = 0;
    const res = { actions: [add({ pic: 'cols', split: { by: 'date', unit: 'm', date: 'start' } }, null, 'Starts')] };
    const said = (await w.hbBoardTakesChecked(res, async () => { calls++; return { actions: [add({ pic: 'bars', split: { by: 'counterparty' } }, null, 'Parties')] }; })).replace(/<[^>]+>/g, ' ');
    assert.equal(calls, 1, 'never a second retry');
    assert.equal(w.hbS().panels.length, 0, 'nothing wrong reached the board');
    assert.match(said, /One retry ran/);
    assert.match(said, /Could not add “Parties”: it has 30 groups, too many to read/);
  });
  test('a retry that fails to come back says the first problem', async () => {
    const w = world();
    const said = (await w.hbBoardTakesChecked({ actions: [add({ pic: 'cols', split: { by: 'date', unit: 'm', date: 'start' } }, null, 'Starts')] }, async () => { throw new Error('down'); })).replace(/<[^>]+>/g, ' ');
    assert.match(said, /Could not add “Starts”: the start date is missing/);
    assert.equal(w.hbS().panels.length, 0);
  });
  test('the panel asks once more through the same route, and only on the board', () => {
    const src = read('js/views/intelligence.js');
    assert.match(src, /const retry=payload\?\(note=>api\('ai\/graph','POST',Object\.assign\(\{\},payload,\{ query:q\+'\\n\\n'\+note, screen:graphAskScreen\(\) \}\)\)\):null;/);
    assert.match(src, /await hbBoardTakesChecked\(res,retry,q\)/);
  });
});

describe('F499 (D) — the free reader\'s cards: the same checker, no retry', () => {
  test('a card on a mostly empty date is drawn, and the line says why', () => {
    const w = world();
    const said = w.hbAsk('contracts by month by start date').replace(/<[^>]+>/g, ' ');
    assert.match(said, /Drawn, but the start date is missing for \d+ of \d+ contracts\./);
    assert.match(said, /Free/);
  });
  test('a good card says nothing more', () => {
    const w = world();
    assert.doesNotMatch(w.hbAsk('contracts by stream').replace(/<[^>]+>/g, ' '), /Drawn, but/);
  });
});
