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

   ---- RE-POINTED 6 Oct 2026 (Young: "the translation is supposed to be one
   clause at a time only") ----
   The route now reads exactly ONE named clause per press, so a page holds one
   row and cannot be misfiled: whatever comes back is the answer to that
   clause, and it lands there and NOWHERE ELSE — which is the wall these claims
   always stood for. The whole-page shift, quarter-misfiled and partial
   claims are RETIRED IN PLACE (a page of several rows is no longer asked);
   (R) proves the judge that guarded them now asks only among a page's own
   rows, and is not asked at all of a page of one.

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

const fs = require('node:fs');
const path = require('node:path');
const SERVER = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');

describe('f300 one clause asked, one clause answered — and never filed under another', () => {
  let h, ai, W;
  const put = id => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
    id, name: 'Packaging Supply Agreement', counterparty: 'Nordkust', folder: FOLDER_A,
    status: 'Draft', redlineText: '<h1>Packaging Supply Agreement</h1><h2>1. Scope of Supply</h2><p>The Supplier shall manufacture.</p>',
    fields: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], searchText: 'packaging',
  } } });
  const ask = (id, k, extra) => W.admin.json('/api/ai/readings', { method: 'POST', body: { id, clauses: CLAUSES, only: [k], ...(extra || {}) } });

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    for (const id of ['MK-F300-1', 'MK-F300-2', 'MK-F300-5', 'MK-F300-8']) await put(id);
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('(1) THE OBSERVED FAULT CANNOT LAND: an entry under the next row\'s key is the answer to the one clause asked, filed there and nowhere else', async () => {
    ai.script(tu({ readings: [shifted(0)] }));
    const out = await ask('MK-F300-1', 0);
    const items = out.readings.items;
    assert.deepEqual(items.map(x => x.i), [0], 'only the clause asked carries a reading');
    assert.match(items[0].plain, /about clause 1/, 'and it is that clause\'s own reading');
    assert.equal(items[0].heading, CLAUSES[0].heading, 'drawn under OUR heading');
  });

  test('(1b) one row is sent, addressed by an opaque key inside the hashed text', () => {
    const call = ai.calls[ai.calls.length - 1];
    const prompt = call.body.messages[0].content;
    assert.equal((prompt.match(/\[R\d+\] (?:CLAUSE|SECTION)/g) || []).length, 1, 'one clause, by itself');
    assert.ok(/\[R0\] CLAUSE/.test(prompt), 'addressed R0');
    assert.ok(!/\n\[0\] /.test(prompt) && !/^\[0\] /m.test(prompt), 'never by a bare integer a clause number could be mistaken for');
    assert.ok(/The key in brackets is the row's address for your answer\. It is not the clause number, which is part of the heading and is the contract's own\./.test(prompt));
    const tool = call.body.tools[0];
    assert.equal(tool.input_schema.properties.readings.items.properties.i, undefined, 'the integer field is gone');
    assert.deepEqual(tool.input_schema.properties.readings.items.required, ['key', 'heading', 'plain']);
  });

  test('(2) THE OWNER\'S REPORT, 6 Oct 2026: an echo one word off is not thrown away for a short heading elsewhere', async () => {
    const SHORT = [...CLAUSES, { heading: '5. Approvals', text: 'Approvals are given in writing.' }];
    ai.script(tu({ readings: [{ key: 'R0', heading: '3. Approval and Media', plain: PLAIN[2] }] }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F300-2', clauses: SHORT, only: [2] } });
    assert.deepEqual(out.readings.items.map(x => x.i), [2], 'it lands on clause 3, the one asked');
    assert.ok(!(Number(out.readings.unmatched) > 0), 'nothing refused');
  });

  test('(5) REVERSED: on a one-clause page the key is not what pairs it — even the clause number lands on the clause asked', async () => {
    ai.script(tu({ readings: [{ key: '3', heading: CLAUSES[2].heading, plain: PLAIN[2] }] }));
    const out = await ask('MK-F300-5', 2);
    assert.deepEqual(out.readings.items.map(x => x.i), [2]);
  });

  test('(6c) the heading the model is asked to copy sits on its own line, so "copy it" has one reading', async () => {
    ai.script(tu({ readings: [right(0)] }));
    await ask('MK-F300-8', 0);
    const sent = ai.calls[ai.calls.length - 1].body.messages[0].content;
    assert.match(String(sent), /\[R0\] CLAUSE\nheading: 1\. Scope of Supply\n/, 'the label on one line, the heading on the next');
    assert.match(sent, /the line that begins "heading:"/, 'and the rule names that line');
  });

  test('(R) RETIREMENT PROOF: the echo judge is asked only of a page of several, and only among that page\'s own rows', () => {
    assert.match(SERVER, /const solo = pg\.rows\.length === 1;/);
    assert.match(SERVER, /if \(!solo && readEchoJudge\(r && r\.heading, pg\.rows, k\) === 'shift'\)/);
    assert.ok(!/readEchoJudge\(r && r\.heading, list, i\)/.test(SERVER), 'never against the whole contract');
  });
});
