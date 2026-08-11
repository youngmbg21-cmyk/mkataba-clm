/* ============================================================
   f127 — the read-only copy, with a door on it
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
     · the minted link is HANDED OVER ONCE, at the moment it is made. It used
       to live in a standing panel under the verbs that survived every repaint
       and a reload. The owner asked for that panel gone (12 Aug 2026), and
       the hand-over moved into a dialog rather than disappearing with it —
       deleting the panel alone would have left a button that creates live,
       owner-revocable access to the contract and shows the presser nothing;
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
/* The one screen a minted link is ever shown on, since the panel went. */
const dlg = p => p.win.document.getElementById('pt-derive-dialog');
const linkBox = p => p.win.document.getElementById('pt-derived-link');

/* ============================================================ */
describe('f127a — the door is where the route would say yes, and nowhere else', () => {
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
describe('f127b — minting one', () => {
  test('it calls the route, with the name the reader gave', async () => {
    const p = open_();
    await p.click('pt-derive');
    const call = p.log.sent[p.log.sent.length - 1];
    assert.match(call.pathname, /shares\/tok_parent\/derive-view$/);
    assert.equal(call.body.name, 'Nordfrakt insurers',
      'the name is what the OWNER sees beside the child in their share panel');
  });

  test('and the link is handed straight to the reader, ready to copy', async () => {
    const p = open_();
    await p.click('pt-derive');
    assert.ok(dlg(p), 'the one screen the link is ever shown on opens by itself');
    const box = linkBox(p);
    assert.ok(box, 'the link is shown');
    assert.equal(box.value, 'https://hati.test/#s=t:tok_child1');
    assert.ok(p.win.document.getElementById('pt-derive-copy'), 'with a copy control');
  });

  test('THE PANEL IS GONE, and the button did not go with it', async () => {
    /* The ask was to remove the standing list at the foot of the strip. The
       trap was that the list was the ONLY place a link was ever drawn, so
       removing it alone would have left "Share a read-only copy" minting real
       tickets in silence. Both halves are asserted together, because either
       one alone is a broken product. */
    const p = open_();
    await p.click('pt-derive');
    assert.equal(p.win.document.getElementById('pt-derive-out'), null,
      'no standing panel under the verbs');
    assert.equal(p.win.document.querySelector('[data-pt-derived]'), null,
      'and no row of it left behind');
    assert.ok(p.win.document.getElementById('pt-derive'),
      'the door that mints one is still there');
    assert.equal(linkBox(p).value, 'https://hati.test/#s=t:tok_child1',
      'and the link it made reached the reader');
  });

  test('CANCELLING THE NAME MINTS NOTHING', async () => {
    /* promptDialog answers null for a cancel and '' for an empty box, and the
       two must not be confused: minting on a cancel leaves a live ticket on
       the server that somebody had just decided against, and no way to tell
       from the page that it exists. */
    const p = open_({}, null);
    await p.click('pt-derive');
    assert.equal(p.derived().length, 0, 'the route was never called');
    assert.equal(dlg(p), null, 'and nothing is handed over');
  });

  test('an unnamed copy is still allowed — an empty box is an answer', async () => {
    const p = open_({}, '');
    await p.click('pt-derive');
    assert.equal(p.derived().length, 1);
  });

  test('two advisers get two DIFFERENT links, each handed over in its turn', async () => {
    const p = open_();
    await p.click('pt-derive');
    const first = linkBox(p).value;
    p.win.document.getElementById('pt-derive-done').click();
    await p.click('pt-derive');
    const second = linkBox(p).value;
    assert.equal(p.derived().length, 2, 'two tickets were minted');
    assert.notEqual(first, second, 'and the second is its own link, not the first again');
  });
});

/* ============================================================ */
describe('f127c — shown once, and the once is protected', () => {
  test('the dialog says out loud that this is the only sight of it', async () => {
    /* The panel used to be a promise that the link could be found again. It
       cannot now, so the screen has to say so rather than let a reader close
       it expecting otherwise. */
    const p = open_();
    await p.click('pt-derive');
    assert.match(dlg(p).textContent, /only time it is shown/i);
  });

  test('a stray click on the backdrop does not throw the link away', async () => {
    /* confirmDialog dismisses on a backdrop click, which is right for a
       question and wrong for the one and only sight of a live ticket. */
    const p = open_();
    await p.click('pt-derive');
    const ov = dlg(p);
    ov.firstElementChild.dispatchEvent(new p.win.Event('click', { bubbles: true }));
    assert.ok(dlg(p), 'still open');
    assert.equal(linkBox(p).value, 'https://hati.test/#s=t:tok_child1');
  });

  test('Done closes it, and nothing of it is left on the page', async () => {
    const p = open_();
    await p.click('pt-derive');
    p.win.document.getElementById('pt-derive-done').click();
    assert.equal(dlg(p), null, 'the dialog is gone');
    assert.equal(p.win.document.getElementById('pt-derive-out'), null,
      'and no panel took its place');
  });

  test('NOTHING ABOUT IT IS KEPT IN THIS BROWSER', async () => {
    /* The list used to be written to localStorage so the panel could survive a
       reload. With the panel gone that store has no reader, and state nothing
       reads but every save writes is how a page rots. The durable record is
       the OWNER's share panel, which lists and revokes every child link. */
    const p = open_({}, 'Nordfrakt insurers', { url: 'https://hati.test/' });
    await p.click('pt-derive');
    const raw = p.win.localStorage.getItem('hati.negoHeld.tok_parent');
    assert.doesNotMatch(String(raw || ''), /tok_child1/,
      'the minted link is not squirrelled away in the reader\'s browser');
  });
});

/* ============================================================ */
describe('f127d — what it says, and what it does when it fails', () => {
  test('the page states the three things a reader is entitled to know', async () => {
    /* Passing on a link believing it private, or permanent, or invisible to
       the sender would be a reader misled by our silence. */
    const p = open_();
    await p.click('pt-derive');
    const said = dlg(p).textContent.replace(/\s+/g, ' ');
    assert.match(said, /cannot accept, reject, propose wording or sign/,
      'what the holder may NOT do');
    assert.match(said, /Access ends/, 'that it expires');
    assert.match(said, /can see it and can withdraw it/,
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
    assert.equal(dlg(p), null, 'and nothing is claimed to exist');
    const btn = p.win.document.getElementById('pt-derive');
    assert.ok(btn && !btn.disabled, 'the door is open again');
    assert.doesNotMatch(btn.textContent, /Creating/);
  });

  test('a response with no link in it is a failure, not a blank row', async () => {
    const p = open_();
    p.win.api = async () => ({ ok: true });
    await p.click('pt-derive');
    assert.equal(dlg(p), null, 'no dialog over a link that does not exist');
    assert.match(p.toastText(), /Could not create|could not be created/i);
  });
});
