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

  test('(1) THE REPORTED CASE: a 130-clause agreement comes back whole, not 60 of it', async () => {
    ai.reset();
    ai.script(answerPage, answerPage, answerPage);
    const list = clauses(130);
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F315-1', clauses: list } });
    const r = out.readings;
    /* AT THE PARENT: items.length is 60 and over is 70. */
    assert.equal(r.items.length, 130, 'every clause has an entry');
    assert.equal(r.over, 0, 'and nothing is reported as left unread');
    assert.equal(r.unmatched, 0, 'nothing failed the pairing guard');
    assert.equal(ai.calls.length, 3, 'read in pages of 60, 60 and 10 — three calls, not one');
  });

  test('(2) a key is the row\'s address IN ITS PAGE, and it is offset back to the whole list', async () => {
    const r = (await W.admin.json('/api/contracts/MK-F315-1'))._readings;
    assert.ok(r, 'the whole edition was cached');
    /* EVERY PAGE ADDRESSES ITS OWN ROWS FROM R0 — the short key space is what
       makes the pairing reliable, and it is what made the offset necessary. */
    /* FOUND BY WHAT IT CARRIES, never by its position in the call log: the pages
       run a few at a time, so which call arrives second is the provider's
       business and not a fact this claim rests on. */
    const second = ai.calls.map(c => c.body.messages[0].content).find(t => /CLAUSE 61\n/.test(t));
    assert.ok(second, 'clause 61 was sent on some page');
    assert.ok(/\[R0\] CLAUSE 61\n/.test(second), 'the page carrying clause 61 opens at R0');
    assert.ok(ai.calls.every(c => !/\[R60\]/.test(c.body.messages[0].content)),
      'no page ever addresses a row beyond its own length');
    /* AND THE ITEM CARRIES THE GLOBAL INDEX, which is what the browser pairs
       against its own sheet. An item filed under its page index would draw
       clause 61's reading under clause 1 — the 11 Sep fault, reintroduced. */
    assert.deepEqual(r.items.map(x => x.i), Array.from({ length: 130 }, (_, k) => k));
    const sixtyOne = r.items.find(x => x.i === 60);
    assert.equal(sixtyOne.heading, '61. Clause 61', 'and it is stamped with its own row');
    assert.match(sixtyOne.plain, /61\. Clause 61/, 'carrying the reading written for it');
  });

  test('(3) a page that never answered is counted, said, and NOT cached', async () => {
    ai.reset();
    ai.script(answerPage, dead, answerPage);
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F315-2', clauses: clauses(130) } });
    const r = out.readings;
    assert.equal(r.items.length, 70, 'the pages that answered are a real part of the document and are kept');
    assert.equal(r.over, 60, 'and the page that did not is counted as unread, with a number beside it');
    const c = await W.admin.json('/api/contracts/MK-F315-2');
    assert.ok(!c._readings, 'a document with a hole in it is not cached, or it is served for the life of the wording');
  });

  test('(4) the first page refusing refuses the press — there is no edition to hand over', async () => {
    ai.reset();
    ai.script(dead, answerPage);
    const r = await W.admin.raw('/api/ai/readings', { method: 'POST', body: { id: 'MK-F315-3', clauses: clauses(80) } });
    assert.equal(r.status, 502, 'the reader is told why rather than shown an empty column');
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

  test('(6) one press, one cache row, one hash over exactly what was read', async () => {
    ai.reset();
    ai.script(answerPage, answerPage);
    const list = clauses(70);
    const first = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F315-4', clauses: list } });
    assert.equal(first.readings.items.length, 70);
    assert.equal(ai.calls.length, 2);
    const again = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F315-4', clauses: list } });
    assert.equal(again.cached, true, 'the same wording is not paid for twice');
    assert.equal(ai.calls.length, 2, 'and the provider is not called again');
    /* THE HASH IS OVER THE WHOLE EDITION, so moving one word anywhere in the
       document re-asks it — the property the key-inside-the-text note relies
       on, kept through paging. */
    const moved = list.slice(); moved[65] = { ...moved[65], text: moved[65].text + ' As amended.' };
    ai.script(answerPage, answerPage);
    const third = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F315-4', clauses: moved } });
    assert.ok(!third.cached, 'a word moved on page two is a different document');
    assert.equal(ai.calls.length, 4);
  });
});
