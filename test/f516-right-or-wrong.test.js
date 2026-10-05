/* f516 — RIGHT OR WRONG, AND THE REVIEW RECORD (work order "the board that
   answers right", Part 6, 5 Oct 2026; screen 4 of the sketches)

     A. the route: any signed-in person may mark; the person is the session's,
        never the body's; no contract text is kept beyond the reply; a day's
        marks are capped; only an admin reads the list or settles a row;
     B. two marks at the foot of every board reply; one press, once; "Wrong"
        says so in one quiet line and sends the question, the recipe drawn
        and the reply; "Right" is kept quietly. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');
const { read, strip, J, boardWorld, openKey } = require('./board-world');

describe('F516 (A) — the record', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { contracts: [] }); });
  after(async () => { await h.stop(); });
  test('a person marks a reply wrong; the server names them', async () => {
    const r = await W.unrestricted.json('/api/board/feedback', { method: 'POST', body: { kind: 'wrong', q: 'payment terms for suppliers', recipe: { pic: 'ring', split: { by: 'status' } }, said: '<b>All contracts</b>: 9', by_name: 'Somebody Else', by_id: 'u_admin' } });
    assert.ok(r.ok && /^BF-/.test(r.id));
    const list = await W.admin.json('/api/board/feedback');
    const row = list.rows.find(x => x.id === r.id);
    assert.equal(row.by, 'Unrestricted Legal', 'the session\'s person, never the body\'s');
    assert.equal(row.said, 'All contracts : 9', 'the reply as plain words');
    assert.ok(!/</.test(row.said), 'no markup is kept');
    assert.deepEqual(row.recipe, { pic: 'ring', split: { by: 'status' } });
    assert.equal(row.state, 'open'); assert.equal(list.week.wrong, 1);
  });
  test('every kind is accepted; anything else is refused', async () => {
    for (const kind of ['right', 'fix', 'disconnect']) assert.ok((await W.unrestricted.json('/api/board/feedback', { method: 'POST', body: { kind, q: 'x' } })).ok, kind);
    const bad = await W.unrestricted.raw('/api/board/feedback', { method: 'POST', body: { kind: 'praise' } });
    assert.equal(bad.status, 400);
  });
  test('only an admin reads the list or settles a row', async () => {
    assert.equal((await W.unrestricted.raw('/api/board/feedback')).status, 403);
    const id = (await W.admin.json('/api/board/feedback')).rows[0].id;
    assert.equal((await W.unrestricted.raw('/api/board/feedback/' + id, { method: 'PATCH', body: { state: 'kept' } })).status, 403);
    const r = await W.admin.json('/api/board/feedback/' + id, { method: 'PATCH', body: { state: 'kept' } });
    assert.equal(r.row.state, 'kept');
    assert.equal((await W.admin.raw('/api/board/feedback/' + id, { method: 'PATCH', body: { state: 'deleted' } })).status, 400);
  });
  test('a recipe too big, or not an object, is not kept', async () => {
    const r = await W.unrestricted.json('/api/board/feedback', { method: 'POST', body: { kind: 'wrong', q: 'x', recipe: { big: 'x'.repeat(4000) } } });
    const row = (await W.admin.json('/api/board/feedback')).rows.find(x => x.id === r.id);
    assert.equal(row.recipe, null);
  });
});

describe('F516 (B) — the marks', () => {
  const setup = () => {
    const w = boardWorld(); const sent = [];
    w.hbFeedbackSend = rec => { sent.push(J(rec)); return rec; }; w.eval('hbFeedbackSend = window.hbFeedbackSend');
    w.hbAsk('contracts by stage');
    w.intel.history.push({ role: 'user', text: 'contracts by stage' });
    w.intel.history.push({ role: 'assistant', text: 'All contracts: 32 contracts, on the board.', boardReply: true, reading: { key: openKey(w), at: Date.now(), words: {} } });
    return { w, sent, i: w.intel.history.length - 1 };
  };
  test('two marks on a board reply; none on a reply that is not the board\'s', () => {
    const { w, i } = setup();
    const html = w.hbMarksHtml(i, w.intel.history[i]);
    assert.match(html, /data-hb-fb="\d+:right"/); assert.match(html, /data-hb-fb="\d+:wrong"/);
    assert.equal(w.hbMarksHtml(0, { text: 'x' }), '');
  });
  test('"Wrong": sent once, with the question and the recipe drawn, and one quiet line', () => {
    const { w, sent, i } = setup();
    assert.equal(w.hbMarkPress(i, 'wrong'), true);
    assert.equal(w.hbMarkPress(i, 'wrong'), false, 'a second press does nothing');
    assert.equal(w.hbMarkPress(i, 'right'), false);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].kind, 'wrong'); assert.equal(sent[0].q, 'contracts by stage');
    assert.deepEqual(sent[0].recipe.split, { by: 'status' });
    const html = w.hbMarksHtml(i, w.intel.history[i]);
    assert.match(html, /Sent to your admins to look at\. Nothing on the board changed\./);
    assert.match(html, /disabled/);
  });
  test('"Right" is kept quietly', () => {
    const { w, sent, i } = setup();
    w.hbMarkPress(i, 'right');
    assert.equal(sent[0].kind, 'right');
    assert.ok(!/Sent to your admins/.test(w.hbMarksHtml(i, w.intel.history[i])));
  });
  test('the panel draws the marks and both roads carry them (source)', () => {
    const src = strip(read('js/views/intelligence.js'));
    assert.match(src, /hbMarksHtml\(i,m\)/);
    assert.match(src, /rdOf\(\), typeof window\.hbBoardReplyMeta==='function'\?hbBoardReplyMeta\(\):\{\}\)\)/);
    assert.match(src, /last\.boardReply=true;/);
  });
});
