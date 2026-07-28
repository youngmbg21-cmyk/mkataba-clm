/* ============================================================
   F82 — the counterparty's page keeps up with the deal
   ============================================================
   The owner's screen has polled for years. It picks up the other side's answers
   within a cycle, and every count and banner on it is live. The counterparty's
   page rendered once, at the moment they opened the link, and then never moved.

   So they sat looking at wording that had been revised, at asks that had
   already been answered, and at a turn banner still telling them it was their
   move — with nothing on the page to say otherwise. The only way out was to
   guess that they should reload.

   That is the last asymmetry between the two screens, and closing it is a READ:
   the same GET the link already answers, on a slow timer. The architecture rule
   this page is built on — a public no-login URL must never MUTATE a contract
   per click — is untouched.

   THE DANGER IS THE CURE. A repaint rebuilds the whole page, so a refresh that
   lands while somebody is half-way through rewriting four clauses would delete
   them — the exact fault fixed in F81, reintroduced by a timer. So the rule has
   three branches and all three are tested here:

     nothing moved            → do nothing at all
     something moved, idle    → repaint, and keep their place on the page
     something moved, working → tell them, and touch nothing

   With one deliberate exception: if the deal has been EXECUTED, or this copy
   superseded, the repaint happens anyway. Everything they are working on has
   just become unsendable, and letting somebody carry on typing into it is the
   worse outcome of the two.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

/* A server answer, in the shape /api/shares/:token returns one. */
function answer(p, over = {}, contractOver = {}) {
  return {
    payload: sharePayloadFor(p, supplyContract(contractOver)),
    responded: false, durable: true, messages: [], prior: null, superseded: null,
    executed: null, emailConfigured: true,
    share: { recipientName: 'Erik Lindqvist', recipientEmail: 'erik@nordkust.se', expiresAt: null },
    ...over };
}

const NEW_WORDING = 'Payment shall be made within sixty (60) days of a valid invoice.';

function rewriteFirstClause(p, text) {
  const btn = p.win.document.querySelector('[data-cl-edit]');
  const i = btn.getAttribute('data-cl-edit');
  btn.dispatchEvent(new p.win.Event('click', { bubbles: true }));
  p.win.document.querySelector(`[data-cl-input="${i}"]`).value = text;
  p.win.document.querySelector(`[data-cl-save="${i}"]`)
    .dispatchEvent(new p.win.Event('click', { bubbles: true }));
  return i;
}

describe('F82 — what a poll decides', () => {
  test('an unchanged copy is not news', () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    const d = answer(p);
    const sig = p.win.portalSignature(d);
    assert.equal(p.win.portalPollDecide(d, sig), 'same',
      'a page that repaints when nothing moved would never stop repainting');
  });

  test('the engagement log ticking is not a change', () => {
    // every open is recorded server-side; the signature must not notice
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    const a = answer(p), b = answer(p);
    assert.equal(p.win.portalSignature(a), p.win.portalSignature(b));
  });

  test('revised wording is a change', () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    const before = p.win.portalSignature(answer(p));
    const after = answer(p, {}, { redlineText: '<h1>SUPPLY</h1><p>Net 60 days.</p>' });
    assert.notEqual(p.win.portalSignature(after), before);
    assert.equal(p.win.portalPollDecide(after, before), 'repaint');
  });

  test('an answered ask is a change, even when the wording has not moved', () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    const base = answer(p);
    const before = p.win.portalSignature(base);
    const moved = JSON.parse(JSON.stringify(base));
    moved.payload.contract.changes = [{ id: 'C1', status: 'accepted', hash: 'h1' }];
    assert.notEqual(p.win.portalSignature(moved), before);
  });

  test('a reply on a thread is a change', () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    const before = p.win.portalSignature(answer(p));
    assert.notEqual(p.win.portalSignature(answer(p, { messages: [{ id: 1, body: 'hi' }] })), before);
  });
});

describe('F82 — a refresh never eats unsent work', () => {
  test('a reader who has rewritten a clause is told, not repainted', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    await p.click('pt-redline');
    rewriteFirstClause(p, NEW_WORDING);
    assert.equal(p.win.portalBusy(), true, 'staged rewrites must count as being mid-task');
    const moved = answer(p, {}, { redlineText: '<h1>SUPPLY</h1><p>Net 60 days.</p>' });
    assert.equal(p.win.portalPollDecide(moved, 'stale-signature'), 'notify');
  });

  test('an open editor counts as working even before anything is typed', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    await p.click('pt-redline');
    assert.equal(p.win.portalBusy(), true);
  });

  test('an idle reader gets the new copy without being asked', () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    assert.equal(p.win.portalBusy(), false);
    const moved = answer(p, {}, { redlineText: '<h1>SUPPLY</h1><p>Net 60 days.</p>' });
    assert.equal(p.win.portalPollDecide(moved, 'stale-signature'), 'repaint');
  });

  test('an executed contract repaints even over unsent work', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    await p.click('pt-redline');
    rewriteFirstClause(p, NEW_WORDING);
    const done = answer(p, { executed: { at: '2026-07-20T09:00:00.000Z' } });
    assert.equal(p.win.portalPollDecide(done, 'stale-signature'), 'repaint',
      'work that can no longer be sent is not work worth protecting');
  });

  test('a superseded copy does the same', () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    const sup = answer(p, { superseded: { at: '2026-07-20T09:00:00.000Z' } });
    assert.equal(p.win.portalPollDecide(sup, 'stale-signature'), 'repaint');
  });

  test('the notice says their work is safe, and offers the refresh', () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    p.win.portalShowUpdatedNotice();
    const html = p.html();
    assert.match(html, /has been updated/i);
    assert.match(html, /unsent work is still here/i,
      'a reader who fears losing their work will not press the button');
    assert.ok(p.has('pt-updated-go'), 'the notice has to carry the way to act on it');
  });

  test('the notice is said once, not once a minute', () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    p.win.portalShowUpdatedNotice();
    p.win.portalShowUpdatedNotice();
    p.win.portalShowUpdatedNotice();
    const n = p.html().split('id="pt-updated"').length - 1;
    assert.equal(n, 1);
  });
});

describe('F82 — the live executed signal reaches the page', () => {
  /* The share endpoint reports execution live, because a signature that lands
     after the link was last refreshed is exactly the case that matters. That
     answer has to reach renderSharePortal, or the live half of F78 is a field
     nobody reads. */
  test('the render options carry it through', () => {
    const p = buildPortal();
    const opts = p.win.portalRenderOpts('tok_1', answer(p, { executed: { at: '2026-07-20T09:00:00.000Z' } }));
    assert.ok(opts.executed && opts.executed.at, 'the server said executed and the page was never told');
  });

  test('and a page built from them closes the negotiation', () => {
    const p = buildPortal();
    const d = answer(p, { executed: { at: '2026-07-20T09:00:00.000Z' } });
    p.win.renderSharePortal(d.payload, p.win.portalRenderOpts('tok_1', d));
    assert.match(p.html(), /executed and sealed/i,
      'the payload had no execution on it, so only the live signal could close this page');
  });

  test('a live contract is untouched by it', () => {
    const p = buildPortal();
    const d = answer(p);
    p.win.renderSharePortal(d.payload, p.win.portalRenderOpts('tok_1', d));
    assert.ok(!/executed and sealed/i.test(p.html()));
  });
});
