/* ============================================================
   F26 — one Word control, and a pause you can see
   ============================================================
   Two controls on the same screen both said "Word". The toolbar one just
   downloaded. The one in the panel below downloaded AND froze online editing —
   silently, with no explanation and no obvious way back. Same word, same
   screen, different consequences.

   The pause itself is worth keeping: edits made in HaTi while a copy is out in
   Word would collide with the wording coming back. So it stays — as a choice,
   stated in words, attached to the one button that causes it. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');

describe('F26 — there is only one download control', () => {
  let w;
  before(() => { w = buildWorld(); });

  test('the Word panel no longer offers its own download', () => {
    const html = w.win.wordControlsHtml(supplyContract());
    assert.ok(!/data-word-out/.test(html),
      'the second "Word" control is what made the pause unexplainable');
    assert.ok(!/Download \.docx for Word review/.test(html));
  });

  test('the panel still does its own job — the return trip', () => {
    const html = w.win.wordControlsHtml(supplyContract());
    assert.match(html, /data-word-return/, 'uploading the marked-up copy belongs here');
    assert.match(html, /Upload returned \.docx/);
  });

  test('and it points at where the download now lives', () => {
    const html = w.win.wordControlsHtml(supplyContract());
    assert.match(html, /toolbar/i, 'a person who looked for the old button must be told where it went');
  });
});

describe('F26 — the pause is a choice', () => {
  // a fresh world per test: the recorders accumulate, and a toast from an
  // earlier case would otherwise satisfy a later assertion
  let w;
  const fresh = () => (w = buildWorld());

  test('choosing it pauses editing, exactly as before', async () => {
    const c = supplyContract(); fresh();
    await w.win.startWordReview(c, null, { lock: true });
    assert.equal(w.win.wordReviewOut(c), true, 'a copy is out — editing is held');
    assert.match(c.audit[c.audit.length - 1].detail, /online editing paused/);
  });

  test('declining it downloads without freezing the document', async () => {
    const c = supplyContract(); fresh();
    await w.win.startWordReview(c, null, { lock: false });
    assert.equal(w.win.wordReviewOut(c), false, 'she asked to keep editing');
    assert.match(c.audit[c.audit.length - 1].detail, /online editing left open/);
    assert.match(w.toastText(), /keep editing/i);
  });

  test('the default is still to pause — it is the safer of the two', async () => {
    const c = supplyContract(); fresh();
    await w.win.startWordReview(c, null);
    assert.equal(w.win.wordReviewOut(c), true);
  });

  test('a paused document can still be released, as it always could', async () => {
    const c = supplyContract(); fresh();
    await w.win.startWordReview(c, null, { lock: true });
    w.win.cancelWordReview(c);
    assert.equal(w.win.wordReviewOut(c), false);
    assert.match(c.audit[c.audit.length - 1].detail, /cancelled/i);
  });

  test('either way she gets a real Word file', async () => {
    const c = supplyContract(); fresh();
    await w.win.startWordReview(c, null, { lock: false });
    const dl = w.log.downloads[w.log.downloads.length - 1];
    assert.ok(dl, 'a download must have happened');
    const back = await w.win.docxExtract(dl.bytes);
    assert.match(back.text, /RAW MATERIAL SUPPLY AGREEMENT/);
    assert.ok(back.text.split('\n').filter(Boolean).length > 3, 'and it must keep its shape');
  });

  test('an executed contract exports nothing new', async () => {
    const c = supplyContract({ status: 'Signed', hash: 'a'.repeat(64) }); fresh();
    await w.win.startWordReview(c, null, { lock: true });
    assert.equal(w.win.wordReviewOut(c), false);
    assert.match(w.toastText(), /executed/i);
  });
});
