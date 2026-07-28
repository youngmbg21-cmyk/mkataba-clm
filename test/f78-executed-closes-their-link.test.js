/* ============================================================
   F78 — a contract that is executed stops taking answers, on BOTH screens
   ============================================================
   The last act of a deal is a signature. Everything about the product says so:
   the owner's room shows "This contract is executed and sealed. The wording is
   final and read-only", negoResolve refuses to decide a change on an executed
   record, and applyResponse refuses to record a share response against one.

   The counterparty's side of the same moment was never closed.

   THREE FACTS, AND EACH ONE IS A SEPARATE HOLE.

     · THE PAYLOAD DOES NOT CARRY THE EXECUTION. buildSharePayload's allow-list
       has no status field on it, and renderSharePortal then hard-codes
       `status:'Under Review'` onto the contract it builds. So the room's
       executed banner — which is a read of `c.status === 'Signed'` and works
       perfectly on the owner's tab — can never fire on theirs. Their page shows
       a live negotiation over a sealed contract.

     · THE SERVER TAKES THE ANSWER ANYWAY. /api/shares/:token/respond refuses a
       revoked link, an expired link, a spent one-shot link and a superseded
       copy. It never asks whether the contract has been executed. A durable
       negotiation link — the standing channel, the one the counterparty has had
       open in a tab for six rounds — is none of those things, so it takes the
       response and answers 200.

     · AND NOBODY EVER SEES IT. The owner's poller hands every stored response
       to applyResponse, which refuses an executed contract and returns false.
       On false the poller does NOT mark the response applied — by design, so a
       transient failure is retried — so this one is picked up again on the next
       poll, and the next, for ever. Silently: the refusal toast is suppressed
       under `opts.background`.

   Put together: the counterparty spends a round redlining a contract that was
   signed and sealed last Tuesday, presses Send, is told it went, and no human
   being on the other side is ever shown a word of it.

   WHAT SHOULD HAPPEN is what happens on every other dead link. The copy still
   OPENS — they are entitled to read what they were sent — and it says why it
   can no longer be answered.
*/
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

const AT = '2026-07-20T09:00:00.000Z';

/* An executed record, as finalizeExecution leaves one: a seal, an execution
   stamp, a status and both parties' marks. */
const executed = c => ({
  ...c, status: 'Signed', hash: 'a'.repeat(64), signedAt: '20 Jul 2026, 12:00 EAT',
  execution: { at: AT, method: 'session-authenticated', consent: true, textHash: 'b'.repeat(64) },
  signatures: [
    { party: 'first', name: 'Amina Otieno', at: AT, method: 'session-authenticated' },
    { party: 'counterparty', name: 'Erik Lindqvist', at: AT, method: 'share-link' },
  ],
});

const payloadFor = (id, text) => ({
  v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
  at: '2026-07-01T08:00:00.000Z', docHash: 'h1', purpose: 'negotiate',
  contract: { id, name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', value: 4800000, valueType: 'estimated', fields: {},
    redlineText: text, format: 'text', docText: text, versions: [] },
});

const answer = (id, over = {}) => ({ v: 1, kind: 'hati-response', id, action: 'changes',
  name: 'Erik Lindqvist', title: 'Procurement Manager', email: 'erik@nordkust.se',
  comment: 'A point on payment terms.', at: '2026-07-26T10:00:00.000Z', ...over });

describe('F78 — the server closes the link the moment the deal is executed', () => {
  let h, W;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    const live = fixtureContract('MK-X1', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review');
    await W.admin.json('/api/contracts/MK-X1', { method: 'PUT', body: { contract: live, baseVersion: 0 } });
    await W.admin.json('/api/contracts/MK-X2', { method: 'PUT', body: { contract: executed(
      fixtureContract('MK-X2', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review')),
      baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  const share = (id, over = {}) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: payloadFor(id, 'WORDING v1'), channel: 'email', durable: true,
    recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30, ...over } });

  test('a live contract still takes the round — the gate must not close early', async () => {
    const made = await share('MK-X1');
    const r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST', body: answer('MK-X1') });
    assert.equal(r.status, 200, 'a contract still under negotiation answers as it always did');
  });

  test('an executed contract refuses the response instead of storing it', async () => {
    const made = await share('MK-X2');
    const r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST', body: answer('MK-X2') });
    assert.equal(r.status, 409,
      'the counterparty answered a sealed contract and the server took it');
    assert.match(String(r.json && r.json.error), /executed|signed|sealed/i,
      'the refusal has to say WHY, or it reads as a bug on their screen');
  });

  test('a signature from an old link cannot be bolted onto a sealed record', async () => {
    const made = await share('MK-X2');
    const r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST',
      body: answer('MK-X2', { action: 'sign' }) });
    assert.equal(r.status, 409, 'a second execution route stayed open on an executed contract');
  });

  test('opening the link still works, and reports the deal as done', async () => {
    const made = await share('MK-X2');
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.ok(got.payload, 'they are entitled to read the copy they were sent');
    assert.ok(got.executed && got.executed.at,
      'the page has no way to tell the reader the deal is finished');
  });

  test('a live contract is not reported as executed', async () => {
    const made = await share('MK-X1');
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.ok(!got.executed, 'a contract under negotiation must not read as done');
  });
});

describe('F78 — the counterparty page says the deal is done', () => {
  test('the payload carries the execution, so their screen can know', () => {
    const p = buildPortal();
    const pay = sharePayloadFor(p, executed(supplyContract()));
    assert.ok(pay.contract.executed && pay.contract.executed.at,
      'the allow-list drops the one fact that ends the negotiation');
  });

  test('a live contract carries no execution in the payload', () => {
    const p = buildPortal();
    const pay = sharePayloadFor(p, supplyContract());
    assert.ok(!pay.contract.executed, 'an unsigned contract must not read as executed');
  });

  test('their page shows the executed banner, not a live negotiation', () => {
    const p = buildPortal();
    const html = p.open(sharePayloadFor(p, executed(supplyContract())));
    assert.match(html, /executed and sealed/i,
      'the counterparty was shown a live negotiation over a signed contract');
  });

  /* The controls stay on the page and are spent, which is what this page
     already does for a superseded copy and for a link that has been answered.
     A reader whose screen loses its buttons cannot tell "finished" from
     "broken"; one whose buttons are visibly dead can. */
  test('and every control that would submit something is spent', () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, executed(supplyContract())));
    for (const id of ['pt-redline-submit', 'pt-sign', 'pt-accept', 'pt-changes', 'pt-decline']) {
      const el = p.win.document.getElementById(id);
      if (!el) continue;
      assert.equal(el.disabled, true, `"${id}" is still live on an executed contract`);
    }
  });

  test('a live contract keeps every verb it had', () => {
    const p = buildPortal();
    const html = p.open(sharePayloadFor(p, supplyContract()));
    assert.ok(!/executed and sealed/i.test(html), 'a live contract must not claim to be signed');
    const submit = p.win.document.getElementById('pt-redline-submit');
    assert.ok(submit && !submit.disabled, 'the ordinary negotiation route was closed by the fix');
  });
});
