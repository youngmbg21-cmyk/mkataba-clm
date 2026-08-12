/* ============================================================
   f113 — three link purposes, three screens, no verb crossing between them
   ============================================================
   W6, and the last piece of X5. The purpose has been stored on the share row
   for a long time and portalNegoPhase has read it for almost as long; what was
   missing was that the RENDER honoured it. So a negotiation link still built a
   sign panel and a signing link still mounted a live workbench, and the two
   purposes blurred into one page that did a bit of both.

   WHY THAT MATTERS IN EACH DIRECTION.

   A signing link is issued when the sender has declared the wording final —
   D1, the owner presses "Issue a signing link" themselves. Mounting the
   workbench live on it left Direct Edit and the send-decisions postbox on the
   page: a second, quieter route back into a negotiation that had been closed,
   reachable by somebody who was asked only to sign.

   A negotiation link is the room, resolved or not, until a signing link
   supersedes it. Rendering a sign panel on it invited a signature on wording
   that was still being argued over.

   WHAT THE SIGNING SCREEN KEEPS, deliberately (D4): a way to look back at what
   was settled, reachable from "Review what changed". Signing on trust, with no
   account of what was agreed, is the thing this product exists to remove — so
   the history is not removed with the verbs.

   WHAT THAT DOOR OPENS CHANGED ON 12 AUG 2026 (owner-asked). It used to unhide
   a read-only mount of the negotiation workbench in the page — the round queue,
   the marked document and the whole Tracked Changes column, under the wording
   being signed, with a strip of dead deal verbs at the foot of it. It now opens
   the Negotiation history dialog: the RECORD of what happened, which is what a
   reader wants at that moment, through the same one function the "Negotiation
   history" button beside it calls. The claim is unchanged and stronger — a
   signing link is never a corridor with no way to look back — and it is now
   made against the dialog rather than against a second working surface. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');

function contract(over = {}){
  return { id: 'MK-1', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], format: 'text',
    redlineText: 'Clause 1 Payment\n\nPayable within thirty (30) days.',
    changes: [{ id: 'CHG-1', clauseId: 'c1', clauseLabel: 'Clause 1 Payment',
      changeType: 'modify', status: 'accepted',
      oldText: 'Payable within thirty (30) days.',
      newText: 'Payable within forty-five (45) days.',
      authorSide: 'owner', author: 'Wanjiru Kamau' }], ...over };
}

function open_(purpose, opts = {}, over = {}){
  const win = buildPortal().win;
  /* purposeChosen, not just purpose: the payload's `purpose` falls back to a
     reading of the change set when nobody stated one, so it is not evidence
     that a link was ISSUED for signature. Only a chosen purpose strips the
     negotiating verbs. */
  win.renderSharePortal({ kind: 'hati-share', purpose, purposeChosen: purpose,
    org: 'Highland Corporate Ltd',
    sharedBy: 'Wanjiru Kamau', at: '2026-07-30T09:00:00.000Z', contract: contract(over) },
    { token: 't', share: { recipientName: 'Erik Lindqvist' }, ...opts });
  const d = win.document;
  return { win, d, has: id => !!d.getElementById(id), html: d.body.innerHTML };
}

/* Every control that signs, and every control that negotiates. Kept as two
   named lists because the claim is symmetric: neither seat may carry the
   other's verbs, and a list per seat is what makes a new control added to one
   of them fail here rather than silently cross over. */
const SIGNING = ['pt-sign', 'pt-otp', 'pt-signature-pad'];
const NEGOTIATING = ['portal-redline', 'portal-plain', 'pt-redline-submit',
  'nego-send-decisions', 'nego-bulk-acc', 'nego-bulk-rej'];

describe('f113 — a negotiation link cannot sign', () => {
  test('no signing control at any phase', () => {
    const v = open_('negotiate');
    for (const id of SIGNING)
      assert.ok(!v.has(id), `#${id} must not be on a negotiation link`);
  });

  test('and it still IS the workbench', () => {
    const v = open_('negotiate');
    assert.ok(v.has('pw-page'), 'the full-window workbench');
    assert.ok(v.has('pt-nego'), 'with the shared component mounted');
    /* The name box that used to stand here is gone (owner-asked, 12 Aug 2026:
       the header carries verbs now, not fields). What gated every send was the
       NAME, not the box — the page reads it off the reader's remembered answer
       or off whoever the link was addressed to, and asks once if neither
       exists. So the claim moved to the verb the box used to gate. */
    assert.ok(v.has('pt-nego-ready'), 'and the deal verbs a negotiation link carries');
  });

  test('even with every change resolved, it does not become a signing page', () => {
    /* The phase used to be inferred from the change set, and the arithmetic
       made a decision that is not arithmetic's to make: resolve the last
       change — even by REFUSING it — and the room became a request for a
       signature, with nobody having said the deal was done. */
    const v = open_('negotiate');
    assert.equal(v.win.portalNegoPhase({ purpose: 'negotiate',
      contract: { changes: [{ id: 'x', status: 'rejected' }] } }).phase, 'negotiate');
    for (const id of SIGNING) assert.ok(!v.has(id));
  });
});

describe('f113 — a signing link cannot redline', () => {
  test('no redline, no Direct Edit, no send-decisions', () => {
    const v = open_('sign');
    for (const id of NEGOTIATING)
      assert.ok(!v.has(id), `#${id} must not be on a signing link`);
    assert.ok(!/Direct Edit/.test(v.html),
      'a signing link must not offer a way back into the negotiation it closed');
  });

  test('but it DOES show what was settled — as the record (D4)', () => {
    const v = open_('sign');
    assert.ok(v.has('pt-nego-open'),
      'signing on trust with no account of what was agreed is what this product removes');
    assert.ok(v.has('pt-doc'), 'and the wording being signed is on the page');
    assert.ok(!v.has('pt-nego'),
      'and no read-only workbench mounts under it — the space is the wording’s');
    assert.ok(!v.has('pt-nego-foot'),
      'nor the deal verbs that rode with it');
  });

  test('and the door opens the history, not a second workbench', () => {
    const v = open_('sign');
    v.d.getElementById('pt-nego-open').click();
    assert.ok(v.d.getElementById('history-timeline'),
      '"Review what changed" opens the Negotiation history — the same screen #pt-hist opens');
    assert.equal(v.d.getElementById('pt-nego'), null,
      'and mounts no workbench on the way');
  });

  test('the signing screen still says why the wording cannot be changed here', () => {
    const v = open_('sign');
    /* The read-only panel used to carry this sentence at #nego-readonly-why,
       and the panel is gone — so the fact has to be findable somewhere else
       before the slot is deleted. It is: the "Not ready to sign?" list says a
       signing link cannot be redlined and what the sender will do instead. */
    assert.match(v.html.replace(/\s+/g, ' '),
      /sent to you for signature, so the wording cannot be edited on it/i,
      'a reader who wants a change must be told what to do, not left guessing');
  });

  test('and it keeps the controls signing actually needs', () => {
    const v = open_('sign');
    assert.ok(v.has('pt-sign'));
    assert.ok(v.has('pt-name'), 'the signer names themselves on the respond panel');
  });
});

describe('f113 — a retired negotiation link says so, and offers nothing', () => {
  test('a superseded copy can neither negotiate nor sign', () => {
    const v = open_('negotiate', { superseded: { at: '2026-07-31T11:00:00.000Z',
      reason: 'signing-link-issued' } });
    assert.equal(v.win.portalNegoPhase({ purpose: 'negotiate', contract: contract() }).phase,
      'read', 'a spent copy is for reading');
    for (const id of SIGNING) assert.ok(!v.has(id), `#${id} on a retired link`);
    assert.ok(!v.has('nego-send-decisions'), 'and no way to answer on it');
  });

  test('the three purposes are three distinct screens', () => {
    const negotiate = open_('negotiate'), sign = open_('sign');
    const view = buildPortal().win;
    view.renderSharePortal({ kind: 'hati-share', purpose: 'view', viewOnly: true,
      org: 'Highland Corporate Ltd', asOf: '2026-07-30T09:00:00.000Z', round: 1,
      contract: contract() }, { viewOnly: true, share: {} });
    assert.ok(negotiate.has('pw-page') && !negotiate.has('pt-sign'));
    assert.ok(sign.has('pt-sign') && !sign.has('pw-page'));
    assert.ok(view.document.getElementById('share-root').innerHTML.includes('pv-sheet'));
    assert.equal(view.document.querySelectorAll('button').length, 0);
  });
});
