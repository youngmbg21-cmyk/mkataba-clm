/* f407 — DISCARD THROWS AWAY WHAT IS UNSENT, NEVER WHAT WAS SENT
   (the owner's list, 27 Sep 2026)

   "If you revise a change you have already sent, HaTi treats it as unsent.
   Pressing Discard then deletes it completely and writes 'never sent' in the
   audit trail — even though the other side has a copy."

   A revision is filed at its own moment, so the change reads as unsent — and
   of the REVISION that is true. What had gone out is the wording before it.
   negoRetractDraft (js/negotiation.js) now discards only what is unsent: the
   revisions filed since the last hand-over go, and the version that was on
   the table comes back exactly as it was filed, with its own fingerprint
   (negoSentVersionOf is the one reading of which version that is). A change
   that was never sent is discarded whole, as before.

   Driven through the one funnel every route uses. Red at the parent (3ee647b):
   (1)(2)(3)(5). (4) is the CONTROL that a never-sent draft still goes whole. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world.js');

const RICH = [
  '<h2>1. Payment</h2>',
  '<p>Payment shall be made within thirty (30) days of invoice.</p>',
  '<h2>2. Insurance</h2>',
  '<p>The Supplier shall maintain cover of not less than KES 20,000,000.</p>',
].join('');
const tick = () => new Promise(r => setTimeout(r, 12));

async function sentThenRevised() {
  const w = buildWorld({ negotiationView: true, contractView: true });
  const win = w.win;
  const c = supplyContract({ redlineText: RICH, format: 'rich' });
  win.negoInit(c);
  const [a, b] = win.negoClauseList(c).map(x => x.clauseId);
  const ours = await win.negoEditClause(c, a, '<p>Payment shall be made within forty-five (45) days of invoice.</p>',
    { side: 'owner', author: 'Amina Otieno' });
  const sent = { hash: ours.hash, newText: ours.newText, createdAt: ours.createdAt, seq: ours.seq };
  await tick();
  win.negoHandOver(c, { to: 'counterparty', by: 'Amina Otieno' });
  await tick();
  await win.negoEditClause(c, a, '<p>Payment shall be made within sixty (60) days of invoice.</p>',
    { side: 'owner', author: 'Amina Otieno' });
  return { win, c, a, b, ours, sent };
}

test('f407 (1) GATE and fault: the revised change reads as unsent — and Discard keeps it on the record', async () => {
  const { win, c, ours } = await sentThenRevised();
  /* JOINED, never deepEqual: an array born inside the page stage has that
     realm's Array.prototype, and two identical lists then compare unequal. */
  assert.equal(win.negoUnsentAsks(c, 'owner').map(x => x.id).join(','), ours.id, 'STAGE: the revision is unsent');
  const out = win.negoRetractDraft(c, ours.id, { side: 'owner', by: 'Amina Otieno' });
  assert.ok(out, 'the press is answered');
  assert.ok(c.changes.some(x => x.id === ours.id), 'the change the other side holds is still on the record');
});

test('f407 (2) the wording that was sent comes back exactly, with its own fingerprint, and reads as sent again', async () => {
  const { win, c, ours, sent } = await sentThenRevised();
  win.negoRetractDraft(c, ours.id, { side: 'owner', by: 'Amina Otieno' });
  const ch = c.changes.find(x => x.id === ours.id);
  assert.ok(ch, 'on the record');
  assert.equal(ch.newText, sent.newText, 'the forty-five days they hold');
  assert.equal(ch.hash, sent.hash, 'its own fingerprint');
  assert.equal(ch.createdAt, sent.createdAt);
  assert.equal(ch.status, 'pending', 'still an open ask');
  assert.equal((ch.revisions || []).length, 0, 'the unsent revision is gone');
  assert.equal(win.negoUnsentAsks(c, 'owner').map(x => x.id).join(','), '', 'nothing reads as unsent any more');
  assert.equal(win.negoRetractDraft(c, ours.id, { side: 'owner', by: 'Amina Otieno' }), null,
    'and a second Discard is refused, because what is left WAS sent');
});

test('f407 (3) the trail never says "never sent" about a change the other side holds', async () => {
  const { win, c, ours } = await sentThenRevised();
  win.negoRetractDraft(c, ours.id, { side: 'owner', by: 'Amina Otieno' });
  const last = (c.audit || []).slice(-1)[0] || {};
  assert.ok(!/was never sent/.test(last.detail || ''), last.detail);
  assert.match(last.detail || '', /discarded the revision that had not been sent/);
  assert.match(last.detail || '', /stands again/);
});

test('f407 (4) CONTROL: a draft that was never sent is still discarded whole, with the old sentence', async () => {
  const w = buildWorld({ negotiationView: true, contractView: true });
  const win = w.win;
  const c = supplyContract({ redlineText: RICH, format: 'rich' });
  win.negoInit(c);
  const a = win.negoClauseList(c)[0].clauseId;
  const d = await win.negoEditClause(c, a, '<p>Payment shall be made within forty-five (45) days of invoice.</p>', { side: 'owner', author: 'Amina Otieno' });
  await tick();
  await win.negoEditClause(c, a, '<p>Payment shall be made within sixty (60) days of invoice.</p>', { side: 'owner', author: 'Amina Otieno' });
  assert.ok(win.negoRetractDraft(c, d.id, { side: 'owner', by: 'Amina Otieno' }));
  assert.ok(!c.changes.some(x => x.id === d.id), 'off the record');
  assert.match((c.audit || []).slice(-1)[0].detail, /was never sent/);
});

test('f407 (5) the fingerprint chain still verifies afterwards — and after a later filing chains onto what is left', async () => {
  const { win, c, b, ours } = await sentThenRevised();
  win.negoRetractDraft(c, ours.id, { side: 'owner', by: 'Amina Otieno' });
  let v = await win.verifyChangeChain(c);
  assert.equal(v.ok, true, JSON.stringify(v));
  await win.negoEditClause(c, b, '<p>The Supplier shall maintain cover of not less than KES 30,000,000.</p>', { side: 'owner', author: 'Amina Otieno' });
  v = await win.verifyChangeChain(c);
  assert.equal(v.ok, true, JSON.stringify(v));
});
