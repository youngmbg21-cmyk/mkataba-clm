/* ============================================================
   f112 — the viewer's screen: it shows, and there is nothing on it to press
   ============================================================
   WP-1.4, and the view branch of the one purpose router (X5). The server half
   is f108: the payload is built by allow-list and every mutating route refuses
   a view token. This is the page that payload lands on.

   BUILT SEPARATELY, NOT HIDDEN. The obvious implementation is the negotiate
   page with its controls hidden, and it is wrong twice over. Hidden controls
   keep their ids, their handlers and their tab stops — a keyboard reaches them
   and the DOM still carries them. And the next person to add a control to the
   shared page adds it to this reader's copy too, without ever knowing they
   did. This screen is assembled from the viewer payload and there is nothing
   on it to hide, because nothing was put on it.

   IT SAYS WHAT IT IS, TWICE — a banner naming who shared it and when it was
   frozen, and a watermark that survives the reader printing it and handing the
   paper to somebody else. A read-only copy that looks like the live contract
   is eventually read as the live contract. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');

const VIEW_PAYLOAD = {
  kind: 'hati-share', purpose: 'view', viewOnly: true, org: 'Highland Corporate Ltd',
  asOf: '2026-07-30T09:00:00.000Z', round: 2,
  contract: {
    id: 'MK-V1', name: 'Warehousing Services Agreement', counterparty: 'Brut Africa Ltd',
    format: 'text', redlineText: 'Article 1 Payment\n\nPayable within thirty (30) days.',
    changes: [{ id: 'CHG-001', clauseId: 'cl-1', clauseLabel: 'Article 1 Payment',
      changeType: 'modify', status: 'pending',
      oldText: 'Payable within thirty (30) days.',
      newText: 'Payable within sixty (60) days.',
      ops: [{ op: 'del', text: 'thirty (30)' }, { op: 'ins', text: 'sixty (60)' }] }],
  },
};

function viewer(over = {}){
  const P = buildPortal();
  const win = P.win;
  win.renderSharePortal({ ...VIEW_PAYLOAD, ...over },
    { viewOnly: true, share: { recipientName: 'Outside Advisor',
      recipientEmail: 'advisor@example.co.ke' } });
  return { win, html: win.document.getElementById('share-root').innerHTML };
}

describe('f112 — the viewer screen', () => {
  test('it shows the wording', () => {
    const { html } = viewer();
    assert.match(html, /thirty \(30\) days/);
    assert.match(html, /Warehousing Services Agreement/);
  });

  test('the marks are painted — showing them is the point of the link', () => {
    const { html } = viewer();
    assert.match(html, /hati-(ins|del)/,
      'an advisor is being asked what they think of the REDLINED text');
    assert.match(html, /sixty \(60\)/);
  });

  test('the banner names who shared it and when it was frozen', () => {
    const { html } = viewer();
    assert.match(html, /Highland Corporate Ltd/);
    assert.match(html, /Round 2/);
    assert.match(html, /cannot edit it, respond to it or sign it/i);
  });

  test('it carries a watermark, so a printed copy still says what it is', () => {
    const { html } = viewer();
    assert.match(html, /data-mark="advisor@example\.co\.ke"/);
  });

  test('with no recipient email it still watermarks', () => {
    const P = buildPortal();
    P.win.renderSharePortal(VIEW_PAYLOAD, { viewOnly: true, share: {} });
    assert.match(P.win.document.getElementById('share-root').innerHTML,
      /data-mark="CONFIDENTIAL — VIEW ONLY"/);
  });

  /* ---------- the claim that matters ---------- */
  test('there is nothing on the page to press', () => {
    const { win, html } = viewer();
    const doc = win.document;
    assert.equal(doc.querySelectorAll('button').length, 0, 'no buttons at all');
    assert.equal(doc.querySelectorAll('input,textarea,select').length, 0, 'no fields');
    assert.equal(doc.querySelectorAll('[contenteditable="true"]').length, 0, 'nothing editable');
    for (const id of ['pt-name', 'pt-sign', 'pt-accept', 'pt-changes', 'pt-decline',
      'portal-redline', 'portal-plain', 'pt-doc', 'nego-send', 'nego-send-decisions',
      'nego-copilot', 'nego-bulk-acc'])
      assert.equal(doc.getElementById(id), null, `#${id} must not exist on a view link`);
    /* Matched against the respond panel's actual heading, not the bare words
       "respond to" — the banner legitimately contains them, in the sentence
       telling the reader they cannot respond. A test that fires on the copy
       explaining the rule is a test that gets loosened until it fires on
       nothing. */
    assert.ok(!/Propose your edits/i.test(html));
    assert.ok(!/Respond to Highland Corporate Ltd/i.test(html));
  });

  test('the negotiate page, by contrast, does render those — so the test proves something', () => {
    const P = buildPortal();
    P.win.renderSharePortal({ ...VIEW_PAYLOAD, purpose: 'negotiate', viewOnly: false,
      sharedBy: 'Wanjiru Kamau', at: '2026-07-30T09:00:00.000Z' },
      { token: 'tok', share: {} });
    const doc = P.win.document;
    assert.ok(doc.querySelectorAll('button').length > 0,
      'if the negotiate page had no buttons either, the assertion above would be vacuous');
  });

  test('the phase router sends a view link to the viewer, whichever flag it carries', () => {
    const P = buildPortal();
    assert.equal(P.win.portalNegoPhase({ purpose: 'view', contract: { changes: [] } }).phase, 'view');
    assert.equal(P.win.portalNegoPhase({ viewOnly: true, contract: { changes: [] } }).phase, 'view');
    assert.equal(P.win.portalNegoPhase({ purpose: 'negotiate', contract: { changes: [] } }).phase, 'negotiate');
  });

  test('a print stylesheet exists, because printing is what an advisor does', () => {
    const { win } = viewer();
    const css = win.document.getElementById('pv-style').textContent;
    assert.match(css, /@media print/);
    assert.match(css, /\.pv-banner[^}]*display:none/,
      'the chrome comes off the printed page; the watermark and the marks stay');
  });
});
