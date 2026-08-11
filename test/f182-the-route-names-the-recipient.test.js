/* ============================================================
   F182 — the signing route is the newer answer to "who is this for"
   ============================================================
   Reported (Young, 11 Aug 2026): the counterparty signer was named on the
   signing route — Juno Limited's CFO, with her address — the route was saved,
   Share was opened, and the recipient box arrived carrying a DIFFERENT address:
   the one an earlier round had gone to, under a line reading "Filled in from
   the last time you shared this contract."

   Two records of who the counterparty is, and the older one won.

   THE ORDER IS THE WHOLE FIX. Naming a signer is the later, deliberate act —
   somebody sat down and said who executes this agreement and where the link
   reaches them. So the route answers first, then the last link we sent, then
   the address recorded on Key terms. And the dialog SAYS which of the three it
   read, because it was saying "from the last time you shared" over an address
   that had come from somewhere else entirely.

   WHAT DOES NOT MOVE: counterpartyContact. It answers where a ROUND goes — the
   one-press send and the reshare that refreshes the standing link — and a round
   is not a signature. Naming a CFO must not silently re-point a negotiation. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

function core(over = {}) {
  const s = loadViews(['js/richdoc.js', 'js/approvals.js', 'js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
  const me = { id: 'u_w', name: 'Wanjiru Kamau', role: over.role || 'legal', email: 'w@x.co.ke' };
  s.REMOTE = { org: 'Wanjiru Catering Ltd', me, users: [me] };
  s.toast = () => {};
  s.renderAuditSection = () => {}; s.renderSharesSection = () => {}; s.refreshShareOverview = () => {};
  s.renderWorkspace = () => {}; s.setView = () => {};
  Object.assign(s, over);
  return s;
}

/* The reported shape: one earlier share to a gmail address, and a route naming
   the CFO at a different one. */
const GMAIL = 'juno.contracts@gmail.com';
const YAHOO = 'cfo.juno@yahoo.com';
const share = (over = {}) => ({ token: 't1', recipientName: 'Juno Contracts',
  recipientEmail: GMAIL, recipientPhone: null, channel: 'email',
  createdAt: '2026-08-01T08:00:00.000Z', state: 'opened', ...over });

const ROUTE = [
  { id: 'sg_us', party: 'internal', name: 'Wanjiru Kamau', email: 'w@x.co.ke', order: 1, signed: false },
  { id: 'sg_cfo', party: 'counterparty', name: 'Amina Juma', role: 'CFO', email: YAHOO, order: 2, signed: false },
];

const contract = (over = {}) => ({ id: 'MK-1', name: 'Supply Agreement',
  counterparty: 'Juno Limited', status: 'Under Review', value: 1, valueType: 'estimated',
  fields: {}, audit: [], ...over });

describe('F182 — which record answers "who is this for"', () => {
  test('the signing route beats the last share AND the recorded address', () => {
    const s = core();
    const c = contract({ counterpartyEmail: GMAIL, signerPlan: ROUTE });
    const pre = s.shareModalPrefill([share()], c);
    assert.equal(pre.email, YAHOO, 'the route is the newer, deliberate answer');
    assert.equal(pre.name, 'Amina Juma');
    assert.equal(pre.source, 'route');
    assert.equal(pre.signerId, 'sg_cfo', 'the row it came from travels with it');
  });

  test('with no route the last share still answers, and says so', () => {
    const s = core();
    const pre = s.shareModalPrefill([share()], contract({ counterpartyEmail: 'old@juno.co.ke' }));
    assert.equal(pre.email, GMAIL);
    assert.equal(pre.source, 'last');
  });

  test('with neither, the address on Key terms answers — and is named as that', () => {
    const s = core();
    const pre = s.shareModalPrefill([], contract({ counterpartyEmail: 'terms@juno.co.ke' }));
    assert.equal(pre.email, 'terms@juno.co.ke');
    assert.equal(pre.source, 'record',
      'it was claiming to come from the last share, which had never happened');
  });

  test('nothing at all is still blank, with no sentence over it', () => {
    const s = core();
    const pre = s.shareModalPrefill([], contract());
    assert.equal(pre.email, '');
    assert.equal(pre.source, '');
    assert.equal(s.sharePrefillNote(pre), '');
  });

  test('only a COUNTERPARTY row can fill the box — an internal signer never gets a link', () => {
    const s = core();
    const c = contract({ signerPlan: [
      { id: 'sg_us', party: 'internal', name: 'Wanjiru Kamau', email: 'w@x.co.ke', order: 1, signed: false }] });
    assert.equal(s.shareRouteRecipient(c), null);
    assert.equal(s.shareModalPrefill([], c).source, '');
  });

  test('a signer who has already signed does not answer', () => {
    const s = core();
    const c = contract({ counterpartyEmail: GMAIL, signerPlan: [
      { id: 'sg_cfo', party: 'counterparty', name: 'Amina Juma', email: YAHOO, order: 1, signed: true }] });
    assert.equal(s.shareRouteRecipient(c), null);
    assert.equal(s.shareModalPrefill([], c).email, GMAIL);
  });

  test('a row with no address cannot fill a box — the next one in turn does', () => {
    const s = core();
    const c = contract({ signerPlan: [
      { id: 'sg_a', party: 'counterparty', name: 'No Address', email: '', order: 1, signed: false },
      { id: 'sg_b', party: 'counterparty', name: 'Amina Juma', email: YAHOO, order: 2, signed: false }] });
    assert.equal(s.shareRouteRecipient(c).email, YAHOO);
  });

  test('and it is the signer whose TURN it is, not whoever is listed first', () => {
    const s = core();
    const c = contract({ signerPlan: [
      { id: 'sg_second', party: 'counterparty', name: 'Second', email: 'second@juno.co.ke', order: 9, signed: false },
      { id: 'sg_first', party: 'counterparty', name: 'First', email: 'first@juno.co.ke', order: 2, signed: false }] });
    assert.equal(s.shareRouteRecipient(c).signerId, 'sg_first');
  });
});

describe('F182 — the dialog says where the box was filled from', () => {
  async function open(c, shares) {
    let modalHtml = '';
    const s = core({
      openModal: html => { modalHtml = String(html); return { innerHTML: '' }; },
      api: async (p) => (/\/shares$/.test(p) ? { shares } : {}),
      ensureFull: async () => {}, captureVersion: () => null, persist: () => {},
      sha256: async () => 'h'.repeat(64),
      buildSharePayload: () => ({ v: 1, kind: 'hati-share' }),
      contractReadiness: () => [], readinessPanelHtml: () => '',
      isUpload: () => false,
    });
    await s.openShareModal(c);
    return { s, modalHtml };
  }

  test('the reported case: the route wins in the actual markup', async () => {
    const { modalHtml } = await open(
      contract({ counterpartyEmail: GMAIL, signerPlan: ROUTE }), [share()]);
    assert.match(modalHtml, new RegExp(`value="${YAHOO.replace('.', '\\.')}"`),
      "the route's address must be the one in the box");
    assert.ok(!modalHtml.includes(GMAIL), 'the older address must not be prefilled anywhere');
    assert.match(modalHtml, /Filled in from the signing route/);
    assert.ok(!/Filled in from the last time you shared/.test(modalHtml),
      'the sentence must not claim a source the address did not come from');
    assert.match(modalHtml, /data-prefill-src="route"/);
  });

  test('and the signer row it came from opens already chosen, so the link binds', async () => {
    const { modalHtml } = await open(
      contract({ counterpartyEmail: GMAIL, signerPlan: ROUTE }), [share()]);
    /* shareSignerRowsHtml flags the chosen row with "this link" and rings it in
       the accent colour; nothing else on the row carries either. */
    const at = modalHtml.indexOf('data-share-signer="sg_cfo"');
    assert.ok(at > -1, 'the counterparty signer must be offered as a row at all');
    const row = modalHtml.slice(at, modalHtml.indexOf('</button>', at));
    assert.match(row, /this link/i,
      'the row the address came from must be the row the link is bound to');
    assert.match(row, /border:1px solid var\(--color-accent\)/,
      'and it must LOOK chosen — a binding nobody can see is not a binding they can undo');
  });

  test('the old sentence still stands where it is true', async () => {
    const { modalHtml } = await open(contract(), [share()]);
    assert.match(modalHtml, /Filled in from the last time you shared/);
    assert.match(modalHtml, /data-prefill-src="last"/);
  });

  test('an address off Key terms is named as that, not as a share that never happened', async () => {
    const { modalHtml } = await open(contract({ counterpartyEmail: 'terms@juno.co.ke' }), []);
    assert.match(modalHtml, /Filled in from the contact recorded on this contract/);
    assert.match(modalHtml, /data-prefill-src="record"/);
  });

  test('a quote in a signer name cannot break out of the recipient input', async () => {
    const { modalHtml } = await open(contract({ signerPlan: [
      { id: 'sg_x', party: 'counterparty', name: 'Amina" onfocus="alert(1)',
        email: YAHOO, order: 1, signed: false }] }), []);
    /* The name now reaches an ATTRIBUTE it never reached before, so it is
       checked at the attribute rather than over the whole document — the row
       below prints the same characters in a text node, where they are just
       characters. */
    const box = modalHtml.slice(modalHtml.indexOf('id="sh-name"'));
    assert.match(box.slice(0, 200), /value="Amina&quot; onfocus=&quot;alert\(1\)"/,
      'a stored name must not escape its attribute');
  });
});

describe('F182 — what the route does NOT move', () => {
  test('the standing negotiation channel is not re-pointed at a signer', () => {
    const s = core();
    const c = contract({ counterpartyEmail: GMAIL, signerPlan: ROUTE });
    assert.equal(s.counterpartyContact(c, [share()]).email, GMAIL,
      'a round goes where rounds have been going');
    assert.equal(s.counterpartyContact(c, []).email, GMAIL);
  });

  test('a contract with a route and nothing else still has no round channel', () => {
    const s = core();
    assert.equal(s.counterpartyContact(contract({ signerPlan: ROUTE }), []), null,
      'the send falls through to the dialog, which shows the address before it goes');
  });

  test('the reshare still sends to the person we have been negotiating with', async () => {
    const posted = [];
    const s = core({
      api: async (p, m, body) => {
        if (/\/shares$/.test(p) && !m) return { shares: [share()] };
        if (p === 'shares' && m === 'POST') { posted.push(body); return { token: 'n', emailSent: true, emailConfigured: true }; }
        return {};
      },
      ensureFull: async () => {}, persist: () => {}, sha256: async () => 'h'.repeat(64),
      captureVersion: () => ({ n: 2 }), buildSharePayload: () => ({ v: 1, kind: 'hati-share' }),
    });
    const c = contract({ counterpartyEmail: GMAIL, signerPlan: ROUTE, rounds: [] });
    await s.reshareToLastRecipient(c, { purpose: 'negotiate' });
    assert.equal(posted.length, 1);
    assert.equal(posted[0].recipient.email, GMAIL,
      'naming a signer must not move a live negotiation to them');
  });

  test('naming a signer does not rewrite the address on Key terms', () => {
    const s = core();
    const c = contract({ counterpartyEmail: GMAIL, signerPlan: ROUTE });
    s.shareModalPrefill([], c);
    s.shareRouteRecipient(c);
    assert.equal(c.counterpartyEmail, GMAIL,
      'an address somebody typed is somebody decision — reading must not write');
  });
});
