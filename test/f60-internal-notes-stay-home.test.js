/* F60 — the internal wall, on the real negotiation flow.

   THIS FILE USED TO TEST THE DOC LAB. The lab was a sandbox built to decide one
   question before the product was moved onto it: can a message marked internal
   reach the counterparty? The answer went into the product — the write end in
   js/negotiation.js, the door in buildSharePayload (js/core.js) — and the lab
   was deleted. These assertions moved with the feature, so the property the
   whole experiment turned on is still pinned, now on the code that ships.

   THE PROPERTY IS EXPLICIT ALLOW, and the bug it is written against is a real
   one, from the sample engine that prompted the experiment:

       changes.filter(c => c.visibility !== "internal_draft")

   Nothing in that schema ever sets `visibility`, so the comparison is
   `undefined !== "internal_draft"`, which is true, and every internal draft is
   sent. It fails open, silently, with no error and nothing to notice.

   So the wall is written the other way round at BOTH ends, and both are tested
   here:

     · THE WRITE END (negoPostComment) treats anything that is not exactly
       'shared' as internal. A caller that forgets the field, or misspells it,
       keeps the note at home.
     · THE DOOR (buildSharePayload) carries a thread message only if it says
       'shared'. A field nobody set does not pass.

   A forgotten field means the note stays home, which is the failure you can
   live with. The opposite default publishes a colleague's aside — the
   negotiating ceiling, the walk-away point — to the other side of the table. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

const msg = (text, over = {}) => ({ who: 'Wanjiru Kamau', side: 'owner',
  at: '2026-07-25T09:00:00.000Z', text, ...over });

/* One pending change carrying whatever thread the test wants to push at the
   door. Everything else is the ordinary supply contract the portal tests use. */
function withThread(thread){
  return supplyContract({ changes: [{
    id: 'CHG-001', clauseId: 'c1', clauseLabel: 'Clause 2 · Payment',
    type: 'modify', changeType: 'modify', status: 'pending',
    oldText: 'Payment shall be made within thirty (30) days of a valid invoice.',
    newText: 'Payment shall be made within sixty (60) days of a valid invoice.',
    summary: 'Payment terms extended to Net-60',
    authorSide: 'owner', author: 'Wanjiru Kamau',
    createdAt: '2026-07-01T09:00:00.000Z', thread }] });
}
const threadOut = pay => (pay.contract.changes || [])[0].thread || [];

describe('F60a — the door: only what says "shared" crosses it', () => {
  test('a shared message travels', async () => {
    const p = await buildPortal();
    const out = threadOut(sharePayloadFor(p, withThread([
      msg('Would you take Net-45?', { visibility: 'shared' })])));
    assert.equal(out.length, 1);
    assert.equal(out[0].text, 'Would you take Net-45?');
  });

  test('an internal one does not', async () => {
    const p = await buildPortal();
    const out = threadOut(sharePayloadFor(p, withThread([
      msg('We can go to Net-60 but open at 45.', { visibility: 'internal' })])));
    assert.deepEqual(out, [], 'the negotiating position stayed inside the building');
  });

  test('a message whose visibility was NEVER SET stays home', async () => {
    /* The defect above, asserted from the other side. A field nobody wrote must
       not be read as permission. */
    const p = await buildPortal();
    const out = threadOut(sharePayloadFor(p, withThread([msg('no field at all')])));
    assert.deepEqual(out, [], 'a forgotten field is not consent to publish');
  });

  test('a misspelt or unknown visibility stays home too', async () => {
    const p = await buildPortal();
    for (const v of ['Shared', 'SHARED', 'shared ', 'public', 'internal_draft',
                     '', null, undefined, 0, 1, true, {}]){
      const out = threadOut(sharePayloadFor(p, withThread([
        msg('should not travel', { visibility: v })])));
      assert.deepEqual(out, [],
        `visibility ${JSON.stringify(v)} must not be treated as shared`);
    }
  });

  test('a mixed thread sends only the shared half, in order', async () => {
    const p = await buildPortal();
    const out = threadOut(sharePayloadFor(p, withThread([
      msg('walk away below 5%',      { visibility: 'internal', at: '1' }),
      msg('Would you take Net-45?',  { visibility: 'shared',   at: '2' }),
      msg('check with Ops first',    { at: '3' }),
      msg('Net-45 works for us.',    { visibility: 'shared',   at: '4', side: 'counterparty' }),
    ])));
    assert.deepEqual(out.map(m => m.text),
      ['Would you take Net-45?', 'Net-45 works for us.']);
  });

  test('an empty or absent thread is not an error', async () => {
    /* Lengths rather than deepEqual: the payload is built inside the page's own
       realm, so an array it creates is not reference-equal to one built here
       even when both are empty. */
    const p = await buildPortal();
    assert.equal(threadOut(sharePayloadFor(p, withThread([]))).length, 0);
    assert.equal(threadOut(sharePayloadFor(p, withThread(undefined))).length, 0);
  });

  test('what does travel is stamped shared, so the reader can label it honestly', async () => {
    const p = await buildPortal();
    const out = threadOut(sharePayloadFor(p, withThread([
      msg('Would you take Net-45?', { visibility: 'shared' })])));
    assert.equal(out[0].visibility, 'shared');
    assert.equal(out[0].side, 'owner', 'and who said it, so the bubble sits on the right');
  });

  test('the payload is a copy — mutating it cannot reach back into the contract', async () => {
    const p = await buildPortal();
    const c = withThread([msg('Would you take Net-45?', { visibility: 'shared' })]);
    const out = threadOut(sharePayloadFor(p, c));
    out[0].text = 'REWRITTEN ON THEIR COPY';
    out.push(msg('INVENTED', { visibility: 'shared' }));
    assert.equal(c.changes[0].thread.length, 1, 'the record kept its own thread');
    assert.equal(c.changes[0].thread[0].text, 'Would you take Net-45?');
  });
});

describe('F60b — the write end defaults to home', () => {
  /* The safe default runs the other way here from the way it runs at the read
     end. An ABSENT visibility on a message already on the record is read as
     shared when the bubble is drawn (js/discuss.js) — every message written
     before the field existed did travel, so reading a missing value as internal
     would relabel the entire history of every contract as private. But a
     message being WRITTEN now gets the opposite default, because this is the
     end where a forgotten field could still cause a leak. */
  async function filed(opts){
    const p = await buildPortal();
    const c = withThread([]);
    const m = p.win.negoPostComment(c, 'CHG-001', 'the note', opts);
    return { c, m, p };
  }

  test('no visibility given is filed internal', async () => {
    const { m } = await filed({ side: 'owner', author: 'Wanjiru Kamau' });
    assert.equal(m.visibility, 'internal');
  });

  test('a misspelt visibility is filed internal', async () => {
    for (const v of ['Shared', 'SHARED', 'public', 'shared ']){
      const { m } = await filed({ side: 'owner', author: 'Wanjiru Kamau', visibility: v });
      assert.equal(m.visibility, 'internal', `${JSON.stringify(v)} is not "shared"`);
    }
  });

  test('only the exact word ships it', async () => {
    const { m } = await filed({ side: 'owner', author: 'Wanjiru Kamau', visibility: 'shared' });
    assert.equal(m.visibility, 'shared');
  });

  test('and a note filed with no visibility never reaches the door', async () => {
    /* The two ends, joined: write it the careless way, then send. */
    const p = await buildPortal();
    const c = withThread([]);
    p.win.negoPostComment(c, 'CHG-001', 'our ceiling is Net-60', { side: 'owner' });
    assert.deepEqual(threadOut(sharePayloadFor(p, c)), []);
  });
});

describe('F60c — the aside and the ruling name stay behind', () => {
  /* Two more things the wall holds back, both for the same reason a thread is
     held back: they are ours, and knowing them changes what the other side
     would do. */
  test('our own provenance note does not cross the table', async () => {
    const p = await buildPortal();
    const c = withThread([]);
    c.changes[0].note = 'Copilot — Explain Legal Risk';
    const out = (sharePayloadFor(p, c).contract.changes || [])[0];
    assert.equal(out.note, null,
      'telling them which of our clauses a model drafted, and which one we felt '
      + 'exposed on, is negotiation-sensitive twice over');
  });

  test('but THEIR own note comes back to them — they wrote it', async () => {
    const p = await buildPortal();
    const c = withThread([]);
    c.changes[0].authorSide = 'counterparty';
    c.changes[0].note = 'their own aside';
    const out = (sharePayloadFor(p, c).contract.changes || [])[0];
    assert.equal(out.note, 'their own aside');
  });

  test('the asker\'s stated reason travels whichever side wrote it', async () => {
    /* `why` is typed under a label promising the other side will read it. A
       reason the recipient cannot see is a reason that does nothing. */
    const p = await buildPortal();
    const c = withThread([]);
    c.changes[0].why = 'Our finance cycle runs monthly.';
    const out = (sharePayloadFor(p, c).contract.changes || [])[0];
    assert.equal(out.why, 'Our finance cycle runs monthly.');
  });
});
