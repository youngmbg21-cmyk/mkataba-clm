/* ============================================================
   f126 — the read-only copy, with a door on it
   ============================================================
   `POST shares/:token/derive-view` has minted a strictly weaker ticket since
   Stage 8. f123 proves the route thoroughly — a view cannot delegate, a
   signing holder cannot distribute, the child dies with its parent. What no
   test caught, because no test was looking, is that NOTHING EVER CALLED IT.
   The only callers in the repository were f123 and f125. The feature was
   announced in the release notes and was unreachable by a human being: the
   counterparty's lawyer who wants their insurer to read the deal had, as
   before, exactly one thing to hand over — the negotiate link, which carries
   the power to answer in their name.

   So this file is about the door, not the room. The route's judgement is not
   re-tested here and is not re-implemented on the page: `portalCanDerive`
   keeps the button off the pages where the answer is already a 403, so the
   common case is a link rather than a refusal, and everything else is the
   server's to say.

   What must hold:

     · the door is on a live negotiate link, and on nothing else;
     · a cancelled name mints no ticket — a live link nobody wanted is worse
       than no link;
     · the minted link survives the repaints this page does constantly, and a
       reload, because a link the reader has not copied yet is the whole point;
     · a failure puts the button back rather than leaving "Creating…" standing
       over an act that did not happen;
     · and the page says what it is handing over — read-only, expiring, and
       visible to the sender. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');

function contract(over = {}){
  return { id: 'MK-7', name: 'Raw Milk Collection', counterparty: 'Nordfrakt Logistik AB',
    template: 'WH', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], format: 'text',
    redlineText: 'Clause 1 Payment\n\nPayable within thirty (30) days.',
    changes: [{ id: 'CHG-1', clauseId: 'c1', clauseLabel: 'Clause 1 Payment',
      changeType: 'modify', status: 'pending',
      oldText: 'Payable within thirty (30) days.',
      newText: 'Payable within forty-five (45) days.',
      authorSide: 'owner', author: 'Wanjiru Kamau' }], ...over };
}

/* The page as portalEntry renders it for a server-backed link. `answer` is what
   the name prompt returns: a string to name the copy, null for a cancel. */
function open_(opts = {}, answer = 'Nordfrakt insurers', world = {}){
  const p = buildPortal(world);
  const { win } = p;
  win.promptDialog = async () => answer;
  win.navigator.clipboard = { writeText: async () => {} };
  win.renderSharePortal({ kind: 'hati-share', purpose: 'negotiate', purposeChosen: 'negotiate',
    org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau', at: '2026-07-30T09:00:00.000Z',
    contract: contract() },
    { token: 'tok_parent', share: { recipientName: 'Erik Lindqvist' }, purpose: 'negotiate', ...opts });
  return p;
}
const foot = p => p.win.document.getElementById('pt-nego-foot');

/* ============================================================ */
describe('f126a — the door is where the route would say yes, and nowhere else', () => {
  test('THE GAP: a live negotiation link now has one at all', () => {
    /* The whole defect in one assertion. Before this, no page in the product
       contained the string. */
    assert.ok(open_().has('pt-derive'),
      'the counterparty could not reach a feature the release notes announced');
  });

  test('a signing link has none — its holder was asked to sign, not to distribute', () => {
    assert.ok(!open_({ purpose: 'sign' }).has('pt-derive'));
  });

  test('a view link has none — a view cannot delegate', () => {
    /* Privilege laundering: a weaker ticket minting another weaker ticket is
       how a chain outlives the link it came from. The server refuses it; the
       page does not offer it. */
    assert.ok(!open_({ purpose: 'view', viewOnly: true }).has('pt-derive'));
  });

  test('and a spent link has none', () => {
    for (const spent of [{ responded: true }, { superseded: true }])
      assert.ok(!open_(spent).has('pt-derive'), JSON.stringify(spent));
  });

  test('the rule is read from the same facts the server reads', () => {
    /* Stated as a unit test too, because the button's presence is the visible
       half and the rule is the durable one. A missing purpose is a negotiate
       link — the route defaults it the same way. */
    const w = open_().win;
    assert.equal(w.portalCanDerive(), true);
    w.PORTAL_OPTS.purpose = null;
    assert.equal(w.portalCanDerive(), true, 'no stated purpose is a negotiation link');
    w.PORTAL_OPTS.purpose = 'sign';
    assert.equal(w.portalCanDerive(), false);
  });
});

/* ============================================================ */
describe('f126b — minting one', () => {
  test('it calls the route, with the name the reader gave', async () => {
    const p = open_();
    await p.click('pt-derive');
    const call = p.log.sent[p.log.sent.length - 1];
    assert.match(call.pathname, /shares\/tok_parent\/derive-view$/);
    assert.equal(call.body.name, 'Nordfrakt insurers',
      'the name is what the OWNER sees beside the child in their share panel');
  });

  test('and the link comes back on the page, ready to copy', async () => {
    const p = open_();
    await p.click('pt-derive');
    const box = p.win.document.querySelector('[data-pt-derived="0"]');
    assert.ok(box, 'the link is shown');
    assert.equal(box.value, 'https://hati.test/#s=t:tok_child1');
    assert.ok(p.win.document.querySelector('[data-pt-derive-copy="0"]'), 'with a copy control');
  });

  test('CANCELLING THE NAME MINTS NOTHING', async () => {
    /* promptDialog answers null for a cancel and '' for an empty box, and the
       two must not be confused: minting on a cancel leaves a live ticket on
       the server that somebody had just decided against, and no way to tell
       from the page that it exists. */
    const p = open_({}, null);
    await p.click('pt-derive');
    assert.equal(p.derived().length, 0);
    assert.equal(p.win.portalDerivedLinks().length, 0);
  });

  test('an unnamed copy is still allowed — an empty box is an answer', async () => {
    const p = open_({}, '');
    await p.click('pt-derive');
    assert.equal(p.derived().length, 1);
  });

  test('two advisers get two links, and the first is not overwritten', async () => {
    const p = open_();
    await p.click('pt-derive');
    await p.click('pt-derive');
    assert.equal(p.win.portalDerivedLinks().length, 2);
    assert.ok(p.win.document.querySelector('[data-pt-derived="0"]'), 'the first is still on the page');
    assert.ok(p.win.document.querySelector('[data-pt-derived="1"]'));
  });
});

/* ============================================================ */
describe('f126c — a link the reader has not copied yet must not vanish', () => {
  test('it survives the footer being rebuilt', async () => {
    /* This footer is rewritten every time a decision is held. Written into the
       DOM once, the link would disappear the moment the reader answered the
       next change — which is exactly when they would be doing both. */
    const p = open_();
    await p.click('pt-derive');
    foot(p).innerHTML = p.win.portalNegoFootHtml({ org: 'Wanjiru Catering Ltd' });
    assert.ok(p.win.document.querySelector('[data-pt-derived="0"]'),
      'the held list is what the footer draws from, not a one-time write');
  });

  test('it is remembered, so a closed tab does not lose it', async () => {
    /* A REAL ORIGIN. The stage runs on an opaque one by default — where
       localStorage throws, which is the counterparty's own situation and what
       the save path is written to survive — so a test that wants to prove
       something WAS written has to ask for a real one (see portalworld). */
    const p = open_({}, 'Nordfrakt insurers', { url: 'https://hati.test/' });
    await p.click('pt-derive');
    assert.ok(p.win.localStorage.getItem('hati.negoHeld.tok_parent'), 'something was written');
    p.win.portalLoadHeld();   // as a fresh tab would
    assert.equal(p.win.portalDerivedLinks().length, 1);
    assert.equal(p.win.portalDerivedLinks()[0].link, 'https://hati.test/#s=t:tok_child1');
  });

  test('and sending your decisions does not throw it away', async () => {
    /* portalDropHeld clears the answers that have just gone. A derived link is
       not a draft — it is a live ticket on the server — and losing the only
       record of one to an unrelated send leaves the reader holding nothing to
       give anybody. */
    const p = open_({}, 'Nordfrakt insurers', { url: 'https://hati.test/' });
    await p.click('pt-derive');
    p.win.portalDropHeld();
    p.win.portalLoadHeld();   // as a fresh tab would
    assert.equal(p.win.portalDerivedLinks().length, 1, 'the ticket outlives the draft');
  });
});

/* ============================================================ */
describe('f126d — what it says, and what it does when it fails', () => {
  test('the page states the three things a reader is entitled to know', async () => {
    /* Passing on a link believing it private, or permanent, or invisible to
       the sender would be a reader misled by our silence. */
    const p = open_();
    await p.click('pt-derive');
    const html = foot(p).innerHTML;
    assert.match(html, /cannot accept, reject, propose wording or sign/,
      'what the holder may NOT do');
    assert.match(html, /Access ends/, 'that it expires');
    assert.match(html, /sender can see .* and can withdraw/,
      'and that the sender sees it and can revoke it');
  });

  test('a refused mint says so and gives the button back', async () => {
    /* The route refuses for reasons this page deliberately does not
       re-implement — a revoked parent, a rate limit. "Creating…" left standing
       over an act that did not happen is the reading that makes somebody press
       it again. */
    const p = open_();
    p.win.api = async () => { throw new Error('This share link is no longer active'); };
    await p.click('pt-derive');
    assert.match(p.toastText(), /no longer active/);
    assert.equal(p.win.portalDerivedLinks().length, 0, 'and nothing is claimed to exist');
    const btn = p.win.document.getElementById('pt-derive');
    assert.ok(btn && !btn.disabled, 'the door is open again');
    assert.doesNotMatch(btn.textContent, /Creating/);
  });

  test('a response with no link in it is a failure, not a blank row', async () => {
    const p = open_();
    p.win.api = async () => ({ ok: true });
    await p.click('pt-derive');
    assert.equal(p.win.portalDerivedLinks().length, 0);
    assert.match(p.toastText(), /Could not create|could not be created/i);
  });
});
