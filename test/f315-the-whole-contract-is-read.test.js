/* ============================================================
   f315 — THE PLAIN-ENGLISH EDITION READS THE WHOLE CONTRACT
   ============================================================
   Young, 15 Sep 2026, off a screenshot of the column stopping part way down a
   real agreement:

     "Image 2 shows that the plain english section stopped because the platform
      stopped reading the contract. This should never ever happen as it would
      kill the business proposition ... HaTi has to be able to read any entire
      contract."

   MEASURED on the owner's own paper: 216 clauses, of which 60 were read and the
   foot of the column printed "156 further clauses were not read."

   THE 60 WAS NEVER A PRODUCT LIMIT. It is one model call's own arithmetic —
   8,000 output tokens against about 110 tokens a clause — and the route simply
   sliced the document to fit one call. So the 60 stays as the PAGE and the
   route walks the document a page at a time, merging the answers into one
   edition. What the reader presses, sees and pays for is unchanged in shape:
   one switch, one column, one cache row, one hash over exactly what was read.

   THE FOUR PROPERTIES THIS FILE HOLDS:
     1. every clause is read — the pages cover the list with nothing dropped
        between them and nothing counted as "not read";
     2. a key is the row's address WITHIN ITS PAGE and is offset back, so an
        item's `i` is the global index the browser pairs against. This is the
        one place paging could have reintroduced the 11 Sep fault of a reading
        drawn under the wrong clause, and the echo guard is asked per page;
     3. a page that never answered is counted, said, and NOT cached — the
        cut-short rule, applied to a page;
     4. the total ceiling is still a fact with a number beside it.

   ---- RE-POINTED 6 Oct 2026 (Young: "the translation is supposed to be one
   clause at a time only" / "there should never be an option to translate all
   clauses") ----
   The route now reads exactly ONE named clause per press. What this file
   still holds is the owner's 15 Sep point in the one-clause world: ANY clause
   of an entire contract can be read — the 130th as surely as the first —
   under a key that is its page's own and lands on its global place; a press
   that never answered is said and kept nowhere; a clause read once is never
   paid for again; a clause that moves is the only thing asked again. The
   multi-page claims (every page of a whole press, the first page failing)
   are RETIRED IN PLACE: no press asks for more than one clause.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('./helpers');

const SERVER = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');

/* A long agreement's clause list, in the shape the browser sends. */
const clauses = n => Array.from({ length: n }, (_, k) => ({
  num: String(k + 1),
  heading: `${k + 1}. Clause ${k + 1}`,
  text: `The parties agree the ${k + 1}th thing, in wording long enough to be worth reading.`,
  kind: 'clause',
}));

/* THE STAND-IN READS THE PAGE IT WAS SENT, exactly as the provider does: it
   answers one entry per row, under that row's own key, echoing that row's own
   heading. Anything else and the route's echo guard would refuse it — which is
   the point: the test cannot accidentally pass on a mispaired answer. */
const answerPage = body => {
  const prompt = body.messages[0].content;
  const rows = [...prompt.matchAll(/\[(R\d{1,3})\] (?:CLAUSE|SECTION)[^\n]*\nheading: ([^\n]*)/g)]
    .map(m => ({ key: m[1], heading: m[2] }));
  return { content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings',
    input: { readings: rows.map(r => ({ key: r.key, heading: r.heading,
      plain: `In plain words: ${r.heading}.` })) } }] };
};
const dead = () => 500;

describe('f315 the whole contract is read', () => {
  let h, ai, W;
  const put = id => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
    id, name: 'Master Supply and Distribution Agreement', counterparty: 'Nordvane', folder: FOLDER_A,
    status: 'Under Review', format: 'rich', redlineText: '<h1>Master Supply</h1><h2>1. Clause 1</h2><p>Words.</p>',
    fields: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], searchText: 'supply',
  } } });

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    for (const id of ['MK-F315-1', 'MK-F315-2', 'MK-F315-3', 'MK-F315-4']) await put(id);
  });
  after(async () => { await h.stop(); await ai.stop(); });

  const ask = (id, list, k, extra) => W.admin.json('/api/ai/readings', { method: 'POST', body: { id, clauses: list, only: [k], ...(extra || {}) } });

  test('(1) THE REPORTED CASE, ONE CLAUSE AT A TIME: the 130th clause of a 130-clause agreement is read as surely as the first', async () => {
    ai.reset();
    ai.script(answerPage);
    const out = await ask('MK-F315-1', clauses(130), 129);
    assert.equal(ai.calls.length, 1, 'one call');
    assert.deepEqual(out.readings.items.map(x => x.i), [129], 'and it lands on the clause asked');
    assert.match(out.readings.items[0].plain, /Clause 130/);
  });

  test('(2) a key is the row\'s address IN ITS PAGE, and it is offset back to the whole list', () => {
    const sent = ai.calls[0].body.messages[0].content;
    assert.ok(/\[R0\] CLAUSE 130\n/.test(sent), 'the one clause sent opens at R0');
    assert.equal((sent.match(/\[R\d+\] CLAUSE/g) || []).length, 1, 'and it is the only clause sent');
  });

  test('(3) a press that never answered is refused in words, and nothing is kept', async () => {
    ai.reset();
    ai.script(dead, dead);
    const r = await W.admin.raw('/api/ai/readings', { method: 'POST', body: { id: 'MK-F315-2', clauses: clauses(130), only: [5] } });
    assert.equal(r.status, 502, 'refused');
    assert.ok(r.json && r.json.error, 'with the provider\'s reason');
    const c = await W.admin.json('/api/contracts/MK-F315-2');
    assert.ok(!c._readings, 'and no edition was written');
  });

  test('(4c) a later press for a clause already read asks nothing', async () => {
    ai.reset();
    ai.script(answerPage);
    await ask('MK-F315-3', clauses(80), 61);
    const before = ai.calls.length;
    const again = await ask('MK-F315-3', clauses(80), 61);
    assert.equal(ai.calls.length, before, 'nothing spent');
    assert.ok(again.readings.items.some(x => x.i === 61), 'and the reading is handed back');
  });

  /* RE-POINTED 23 Sep 2026 (Young: "hati seems to not be able to read a long
     contract which is unacceptable"): a page also closes at READ_PAGE_CHARS of
     wording, and the runaway guard is forty pages, not twelve. */
  test('(5) the total ceiling is still a fact, and it is a runaway guard rather than a limit', () => {
    assert.match(SERVER, /const READ_PAGE = 60;/, 'the page is one call\'s own arithmetic');
    assert.match(SERVER, /const READ_PAGE_CHARS = \d+;/, 'and it closes on its wording as well as its count');
    assert.match(SERVER, /const READ_MAX_PAGES = 40;/);
    assert.match(SERVER, /const READ_MAX_CLAUSES = READ_PAGE \* READ_MAX_PAGES;/,
      'and the total is derived from the two, never typed twice');
    assert.match(SERVER, /const READ_AT_ONCE = 3;/, 'a few pages at a time, never all of them at once');
    /* A CAP IS A FACT, NEVER A SILENT TRIM — the standing rule, and `over` is
       still what says it. */
    assert.match(SERVER, /over = all\.length - read;/);
  });

  test('(6) one press, one clause; a clause that moves is the only thing asked again', async () => {
    ai.reset();
    ai.script(answerPage, answerPage);
    const list = clauses(70);
    await ask('MK-F315-4', list, 65);
    assert.equal(ai.calls.length, 1);
    const again = await ask('MK-F315-4', list, 65);
    assert.equal(ai.calls.length, 1, 'the same wording is not paid for twice');
    assert.ok(again.readings.items.some(x => x.i === 65));
    const moved = list.slice(); moved[65] = { ...moved[65], text: moved[65].text + ' As amended.' };
    const third = await ask('MK-F315-4', moved, 65);
    assert.ok(!third.cached, 'moved wording is a different clause');
    assert.equal(ai.calls.length, 2, 'one more call');
    const last = ai.calls[1].body.messages[0].content.split('THE CONTRACT:\n')[1] || '';
    assert.ok(/CLAUSE 66\n/.test(last) && !/CLAUSE 65\n/.test(last) && !/CLAUSE 1\n/.test(last),
      'and that call carried the moved clause alone');
  });
});
