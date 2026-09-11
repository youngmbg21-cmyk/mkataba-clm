/* f300 — THE PLAIN ENGLISH EDITION IS ONE CLAUSE OUT ON THE COMPANY STANDARDS
   (C-6, owner-reported 11 Sep 2026)

   "In two different company standard contracts, the plain english has failed
   to pick up on the first clause. This was previously not an issue."

   What the screenshots showed, read closely: not a missing first clause but
   EVERY reading one clause too low. The route numbered its rows [0] … [n-1]
   and every row's heading also begins with a number — the clause's own, one
   higher. A model that numbered from one answered the entry it MEANT for
   clause 1 under i:1; the server stamped it with row 1's heading; the
   browser's guard compared that stamped heading with the same list's row 1
   and was satisfied by construction. Row 0 empty, the last entry out of range
   and dropped, every other reading under the clause after its own — and the
   whole thing CACHED for the life of the wording.

   These claims are asked of the ROUTE with the scripted provider. Every
   scripted entry carries BOTH the old `i` and the new `key`, on purpose: run
   against the parent commit the same script produces the shifted pairing,
   which is what proves (1) is a net rather than a description.

   Run: node --test test/f300-readings-pair-on-the-heading.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('./helpers');

const tu = input => [{ type: 'tool_use', id: 'tu_f300', name: 'clause_readings', input }];

/* THE REPORTED SHAPE: a clause number at the head of every heading, one higher
   than the row's own index. The Packaging Supply Agreement's first four. */
const CLAUSES = [
  { heading: '1. Scope of Supply', text: 'The Supplier shall manufacture and supply packaging that matches the approved artwork.' },
  { heading: '2. Price & Contract Value', text: 'The estimated annual contract value is stated in Schedule 1 and reviewed yearly.' },
  { heading: '3. Approvals & Media', text: 'Every artwork change is approved in writing by the Buyer before print.' },
  { heading: '4. Term', text: 'This agreement runs for two (2) years from the effective date.' },
];
const PLAIN = [
  'You (the Supplier) must make and deliver packaging that matches the artwork the Buyer approved. This is about clause 1.',
  'The yearly value is in Schedule 1 and is looked at again each year. This is about clause 2.',
  'The Buyer must approve every artwork change in writing before anything is printed. This is about clause 3.',
  'The agreement lasts two years from the day it starts. This is about clause 4.',
];
/* An entry addressed to row k, echoing row k's own heading. */
const right = k => ({ i: k, key: 'R' + k, heading: CLAUSES[k].heading, plain: PLAIN[k] });
/* THE FAULT AS OBSERVED: the entry the model MEANT for row k — it echoes row
   k's heading and translates row k's wording — arrives under row k+1's key. */
const shifted = k => ({ i: k + 1, key: 'R' + (k + 1), heading: CLAUSES[k].heading, plain: PLAIN[k] });

describe('f300 the readings pair on the heading, never on a number a clause could carry', () => {
  let h, ai, W;
  const put = (id, extra = {}) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
    id, name: 'Packaging Supply Agreement', counterparty: 'Nordkust', folder: FOLDER_A,
    status: 'Draft', redlineText: '<h1>Packaging Supply Agreement</h1><h2>1. Scope of Supply</h2><p>The Supplier shall manufacture.</p>',
    fields: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], searchText: 'packaging',
    ...extra,
  } } });

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    await put('MK-F300-1');
    await put('MK-F300-2');
    await put('MK-F300-3');
    await put('MK-F300-4');
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('(1) THE OBSERVED FAULT: keys one row high draw nothing under the wrong clause, are counted, refused whole, and cached nowhere', async () => {
    ai.script(tu({ readings: CLAUSES.map((_, k) => shifted(k)) }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F300-1', clauses: CLAUSES } });
    const items = out.readings.items;
    /* Against the parent this is where it fails: items[0] is {i:1, plain about
       clause 1} — clause 1's reading stamped with "2. Price & Contract Value". */
    const wrong = items.find(x => x.i === 1 && /about clause 1/.test(x.plain));
    assert.equal(wrong, undefined, 'clause 1’s reading is never filed under clause 2');
    assert.equal(items.length, 0, 'nothing in a wholly shifted answer can be paired');
    assert.equal(out.readings.unmatched, 4, 'every entry that failed is counted — the three whose echo disagreed and the one out of range');
    assert.equal(out.readings.partial, true, 'and the answer is handed over as partial');
    const c = await W.admin.json('/api/contracts/MK-F300-1');
    assert.ok(!c._readings, 'NOTHING was written to clause_readings — a misfiled reading served for the life of the wording is the worst outcome');
  });

  test('(1b) what the route sent carries the opaque key inside the hashed text, so every stale pairing is re-asked by construction', () => {
    const call = ai.calls[ai.calls.length - 1];
    const prompt = call.body.messages[0].content;
    assert.ok(/\[R0\] SECTION|\[R0\] CLAUSE/.test(prompt), 'rows are addressed R0 … Rn-1');
    assert.ok(/\[R3\] CLAUSE/.test(prompt));
    assert.ok(!/\n\[0\] /.test(prompt) && !/^\[0\] /m.test(prompt), 'and never by a bare integer a clause number could be mistaken for');
    assert.ok(/The key in brackets is the row's address for your answer\. It is not the clause number, which is part of the heading and is the contract's own\./.test(prompt),
      'the prompt says it once, plainly');
    const tool = call.body.tools[0];
    assert.equal(tool.input_schema.properties.readings.items.properties.key.type, 'string');
    assert.equal(tool.input_schema.properties.readings.items.properties.i, undefined, 'the integer field is gone');
    assert.deepEqual(tool.input_schema.properties.readings.items.required, ['key', 'heading', 'plain']);
  });

  test('(2) right keys with one wrong echoed heading: that row is dropped and counted, the rest pair, and the reading is kept', async () => {
    ai.script(tu({ readings: [right(0), right(1), { ...right(2), heading: 'Approvals and media' }, right(3)] }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F300-2', clauses: CLAUSES } });
    const items = out.readings.items;
    assert.deepEqual(items.map(x => x.i).sort(), [0, 1, 3], 'three paired, the mismatched one gone');
    assert.ok(!items.find(x => x.i === 2), 'an echo that names a different heading pairs with nothing');
    assert.equal(items.find(x => x.i === 3).heading, '4. Term', 'the heading STORED is still our own list’s');
    assert.equal(out.readings.unmatched, 1);
    assert.equal(out.readings.partial, false, 'one of four is exactly a quarter, and a quarter is not MORE than a quarter');
    const c = await W.admin.json('/api/contracts/MK-F300-2');
    assert.equal(c._readings && c._readings.items.length, 3, 'a reading below the line is cached, with its count');
    assert.equal(c._readings.unmatched, 1, 'and the count rides with it, so the column can still say so');
  });

  test('(2b) more than a quarter — two of four — is refused whole: the pairs that held are handed over, nothing is kept', async () => {
    ai.script(tu({ readings: [right(0), right(1), shifted(2), shifted(3)] }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F300-3', clauses: CLAUSES } });
    assert.deepEqual(out.readings.items.map(x => x.i), [0, 1], 'what could be paired still comes back');
    assert.equal(out.readings.unmatched, 2);
    assert.equal(out.readings.partial, true);
    const c = await W.admin.json('/api/contracts/MK-F300-3');
    assert.ok(!c._readings, 'and the table stays empty');
  });

  test('(3) the echo is compared after the browser’s own folding — case and whitespace do not fail a row', async () => {
    ai.script(tu({ readings: [
      { ...right(0), heading: '  1.   scope OF supply ' },
      { ...right(1), heading: CLAUSES[1].heading.toUpperCase() },
      right(2), right(3),
    ] }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F300-4', clauses: CLAUSES } });
    assert.deepEqual(out.readings.items.map(x => x.i).sort(), [0, 1, 2, 3]);
    assert.equal(out.readings.unmatched, 0);
    assert.equal(out.readings.partial, false);
  });

  test('(4) a row with no heading pairs on its key plus the first eight words of its wording echoed', async () => {
    const bare = [
      { heading: '', text: 'The Supplier shall deliver each consignment to the plant named in the order, carriage paid.' },
      { heading: '', text: 'The Buyer shall inspect each consignment within three days of its arrival at the plant.' },
    ];
    ai.script(tu({ readings: [
      { i: 0, key: 'R0', heading: 'The Supplier shall deliver each consignment to the', plain: 'The supplier brings each delivery to the plant.' },
      { i: 1, key: 'R1', heading: 'The Buyer shall inspect each consignment within three days', plain: 'You have three days to check each delivery.' },
    ] }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F300-4', clauses: bare, force: true } });
    assert.deepEqual(out.readings.items.map(x => x.i), [0], 'eight words pair; nine do not — the echo is exact after folding');
    assert.equal(out.readings.unmatched, 1);
  });

  test('(5) a key that is not exactly R<n> — the clause number itself, a bare integer, a stray word — resolves to nothing', async () => {
    ai.script(tu({ readings: [
      { i: 0, key: '1', heading: CLAUSES[0].heading, plain: PLAIN[0] },
      { i: 1, key: 1, heading: CLAUSES[1].heading, plain: PLAIN[1] },
      { i: 2, key: 'row R2', heading: CLAUSES[2].heading, plain: PLAIN[2] },
      { i: 3, key: 'R3', heading: CLAUSES[3].heading, plain: PLAIN[3] },
    ] }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F300-4', clauses: CLAUSES, force: true } });
    assert.deepEqual(out.readings.items.map(x => x.i), [3]);
    assert.equal(out.readings.unmatched, 3);
    assert.equal(out.readings.partial, true);
  });
});
