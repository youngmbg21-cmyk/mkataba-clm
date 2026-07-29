/* ============================================================
   F60 — arriving at a negotiation shows what is being negotiated
   ============================================================
   Reported from a screenshot of the negotiation opening on a CLEAN document —
   no marks, no redline, a button reading "Show changes" — with no memory of
   having asked for that.

   TWO FAULTS, and the second is the one that mattered.

   1. TWO BUTTONS SAYING "SHOW CHANGES". The clean-read bar carried its own exit
      and the working pane carried the toggle, a few inches apart, doing exactly
      the same thing — and the one further from the document was the more
      prominent of the two. The bar keeps its sentence, which is the point of
      it ("nothing has been accepted"), and loses its button.

   2. THE MODE OUTLIVED THE ROOM. Clean read and version comparison are both
      LOOKS somebody takes, and both were module state that survived leaving.
      Take a clean read, step out to the Docs page, come back — and the
      negotiation opened with every change invisible. Nothing was broken and
      nothing said so; the screen simply was not the one the reader expected,
      and the single thing they had come to do was the single thing they could
      not see.

   Entering resets to the live round, every time. Repaints do not — a mode that
   switched itself off each time a change was accepted would fight the person
   using it.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-600', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
/* A change on the table, because a negotiation with nothing being negotiated
   cannot show whether it is showing it. */
async function room(nums = ['4']){
  const { win } = buildWorld({ negotiationView: true });
  const c = contract();
  win.negoInit(c);
  const filed = [];
  for (const n of nums){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    filed.push(await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS[n].summary }));
  }
  const enter = () => win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
  const toggle = () => win.document.querySelector('#nego-clean-toggle');
  return { win, c, filed, enter, toggle,
    leave: () => win.closeNegotiationRoom(),
    press: sel => win.document.querySelector(sel).dispatchEvent(new win.Event('click', { bubbles: true })),
    marks: () => win.document.querySelectorAll('.nego-ins, .nego-del').length,
    badges: () => win.document.querySelectorAll('.nego-badge').length };
}
const showChangesButtons = win => Array.from(win.document.querySelectorAll('button'))
  .filter(b => /Show changes/.test(b.textContent));

describe('F60 — one way in and out of clean read, not two', () => {
  test('the bar keeps its warning and loses its button', async () => {
    const r = await room();
    r.win.negoResetView(); r.enter();
    r.press('#nego-clean-toggle');

    const bar = r.win.document.querySelector('#nego-clean-bar');
    assert.ok(bar, 'the bar is still there');
    assert.match(bar.textContent, /Nothing has been accepted/i, 'because the sentence on it is the point');
    assert.equal(r.win.document.querySelector('#nego-clean-exit'), null,
      'and it no longer carries a control of its own');
  });

  test('so "Show changes" appears exactly once on the screen', async () => {
    const r = await room();
    r.win.negoResetView(); r.enter();
    assert.equal(showChangesButtons(r.win).length, 0, 'and not at all before it is on');
    r.press('#nego-clean-toggle');
    assert.equal(showChangesButtons(r.win).length, 1,
      'two buttons a few inches apart doing the same thing is one too many');
  });

  test('the way back is the control that opened it', async () => {
    const r = await room();
    r.win.negoResetView(); r.enter();
    r.press('#nego-clean-toggle');
    assert.equal(r.toggle().textContent.trim(), 'Show changes');
    r.press('#nego-clean-toggle');
    assert.equal(r.win.negoCleanView(), false, 'and it takes you back');
    assert.equal(r.toggle().textContent.trim(), 'Clean Read');
  });
});

describe('F60 — arriving shows the changes', () => {
  test('a first arrival is the redline, with the marks on it', async () => {
    const r = await room();
    r.win.negoResetView(); r.enter();
    assert.equal(r.win.negoCleanView(), false);
    assert.equal(r.toggle().textContent.trim(), 'Clean Read');
    assert.ok(r.marks() > 0, 'the wording being argued about is marked up');
    assert.ok(r.badges() > 0, 'and each change carries its fingerprint');
  });

  /* THE REPORTED FAULT. */
  test('leaving in clean read and coming back shows the changes again', async () => {
    const r = await room();
    r.win.negoResetView(); r.enter();
    r.press('#nego-clean-toggle');
    assert.equal(r.win.negoCleanView(), true, 'a clean read was taken');

    r.leave();
    r.enter();
    assert.equal(r.win.negoCleanView(), false,
      'the first thing a negotiation must show is what is being negotiated');
    assert.equal(r.toggle().textContent.trim(), 'Clean Read');
    assert.ok(r.badges() > 0, 'and every change is on the page again');
  });

  /* Same class of fault, same fix: a look somebody took, outliving the room. */
  test('and a version comparison left open does not follow you back in', async () => {
    const r = await room();
    r.win.negoResetView(); r.enter();
    r.win.negoSetComparePair('baseline', 'baseline');
    r.leave();
    r.enter();
    assert.deepEqual(Array.from(Object.values(r.win.negoComparePair())), ['baseline', 'working'],
      'arriving is the live round, not wherever the last visit was left');
  });

  test('but a repaint keeps the mode — it must not fight the reader', async () => {
    const r = await room();
    r.win.negoResetView(); r.enter();
    r.press('#nego-clean-toggle');
    /* Deciding a change repaints the whole room. Somebody reading the contract
       clean, who accepts something as they read, has not asked to be thrown
       back into the redline. */
    r.press(`[data-nego-card="${r.filed[0].id}"] [data-nego-accept]`);
    assert.equal(r.win.negoCleanView(), true);
    assert.equal(r.toggle().textContent.trim(), 'Show changes');
    assert.equal(r.win.negoChangeById(r.c, r.filed[0].id).status, 'accepted',
      'and the decision still landed');
  });

  test('the counterparty arrives on the changes too', async () => {
    const r = await room();
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'counterparty', by: 'Erik Lindqvist', persist: false });
    r.press('#nego-clean-toggle');
    r.leave();
    r.win.openNegotiationRoom(r.c, { side: 'counterparty', by: 'Erik Lindqvist', persist: false });
    assert.equal(r.win.negoCleanView(), false, 'neither side arrives on a document with no changes on it');
  });
});
