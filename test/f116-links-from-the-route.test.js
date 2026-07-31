/* ============================================================
   f116 — the signing links come from the route, and a dormant link says so
   ============================================================
   W7, client side. f115 proves the server: binding, dormancy, sequenced
   release. This file proves the two client halves on top of it:

     · issueSigningRouteLinks reads c.signerPlan — the record the owner
       already made of who signs, in order, at which address — and issues one
       bound link per unsigned counterparty signer, instead of opening the
       dialog for the owner to hand-type ONE recipient (W7 fault 2);
     · a dormant bound link renders a WAITING page, not an error page: the
       link is real and will come alive, and a signer told "invalid link"
       phones the sender while one told whose turn it is waits.

   The API is a recorder here, not a live server — what these tests pin is
   what the client ASKS FOR (which signers, which order, which binding), and
   f115 already pins what the server does with it. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { buildPortal } = require('./portalworld');

function loadCore(apiImpl, overrides = {}) {
  const calls = [];
  const w = loadViews(['js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
    updateSidebarCounts() {}, renderWorkspace() {}, setView() {}, renderSignButton() {},
    refreshStats() {},                   // portal.js's, called by flushSaves — not on this stage
    API_MODE: () => true,
    api: async (path, method, body) => { calls.push({ path, method, body });
      return apiImpl ? apiImpl(path, method, body, calls.length) : { ok: true }; },
    ...overrides,
  });
  // signerPlan lives in js/approvals.js, loaded before core in the real app.
  w.signerPlan = c => c.signerPlan || [];
  // currentUser() reads REMOTE.me in API mode; REMOTE lives in js/api.js,
  // which is not on this stage, so the signed-in user is stated directly.
  w.REMOTE = { me: { id: 'u_test', name: 'Wanjiru Kamau', role: 'legal' } };
  return { w, calls };
}

const contract = plan => ({ id: 'MK-1', name: 'Warehousing Agreement',
  counterparty: 'Nordfrakt Logistik AB', template: 'RM', status: 'Under Review',
  folder: 'proc', fields: {}, redlineText: 'Article 1\n\nAgreed wording.', format: 'text',
  comments: [], audit: [], rounds: [], versions: [], signatures: [],
  compliance: { consent: true }, _loaded: true, signerPlan: plan });

describe('f116 — issueSigningRouteLinks asks for the route, in order, bound', () => {
  test('one bound link per unsigned counterparty signer, in route order', async () => {
    const { w, calls } = loadCore((path, m, body, n) =>
      ({ ok: true, token: 't' + n, heldForTurn: n > 1, emailSent: n === 1 }));
    const c = contract([
      // deliberately out of array order — the ROUTE order is the contract
      { id: 'S4', order: 4, party: 'counterparty', name: 'Their FD', email: 'fd@nordfrakt.se' },
      { id: 'S1', order: 1, party: 'internal', name: 'CEO', memberId: 'u1', email: 'ceo@x.co.ke', signed: true },
      { id: 'S3', order: 3, party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
    ]);
    const out = await w.issueSigningRouteLinks(c);
    const shares = calls.filter(x => x.path === 'shares');
    assert.equal(shares.length, 2, 'one request per counterparty signer — the internal signer gets none');
    assert.deepEqual(shares.map(x => x.body.signerId), ['S3', 'S4'], 'issued in route order, not array order');
    assert.deepEqual(shares.map(x => x.body.recipient.email), ['md@nordfrakt.se', 'fd@nordfrakt.se'],
      'each link goes to the address the owner recorded on the route');
    for (const s of shares) {
      assert.equal(s.body.purpose, 'sign');
      assert.equal(s.body.durable, false, 'a signature binds one copy of one text — never a standing link');
      assert.equal(s.body.payload.purpose, 'sign');
    }
    assert.equal(out.links.length, 2);
    const audit = (c.audit || []).map(a => a.detail).join(' ');
    assert.match(audit, /Their MD \(emailed their link\)/);
    assert.match(audit, /Their FD \(link held until their turn\)/,
      'the audit names what went and what is held — "2 links created" hides the sequence');
  });

  test('a signer who has already signed gets no link', async () => {
    const { w, calls } = loadCore(() => ({ ok: true, token: 't' }));
    const c = contract([
      { id: 'S3', order: 3, party: 'counterparty', name: 'Their MD', email: 'md@n.se', signed: true },
      { id: 'S4', order: 4, party: 'counterparty', name: 'Their FD', email: 'fd@n.se' },
    ]);
    await w.issueSigningRouteLinks(c);
    assert.deepEqual(calls.filter(x => x.path === 'shares').map(x => x.body.signerId), ['S4']);
  });

  test('a route missing an address is reported, not guessed at — nothing is sent', async () => {
    const { w, calls } = loadCore(() => ({ ok: true }));
    const c = contract([
      { id: 'S3', order: 3, party: 'counterparty', name: 'Their MD', email: 'md@n.se' },
      { id: 'S4', order: 4, party: 'counterparty', name: 'Their FD', email: '' },
    ]);
    const out = await w.issueSigningRouteLinks(c);
    assert.equal(out.links, undefined);
    assert.equal(out.missingEmails.length, 1);
    assert.equal(out.missingEmails[0].name, 'Their FD');
    assert.equal(calls.filter(x => x.path === 'shares').length, 0,
      'a partial route must not go out — the MD would sign and the FD would be unreachable');
  });

  test('no route, or no counterparty signers, means this is not the path — null', async () => {
    const { w, calls } = loadCore(() => ({ ok: true }));
    assert.equal(await w.issueSigningRouteLinks(contract([])), null);
    assert.equal(await w.issueSigningRouteLinks(contract([
      { id: 'S1', order: 1, party: 'internal', name: 'CEO', memberId: 'u1', email: 'a@b.co' }])), null);
    assert.equal(calls.filter(x => x.path === 'shares').length, 0);
  });

  test('static mode cannot bind links to rows — null, and the dialog remains', async () => {
    const { w } = loadCore(() => ({ ok: true }), { API_MODE: () => false });
    const c = contract([{ id: 'S3', order: 3, party: 'counterparty', name: 'MD', email: 'md@n.se' }]);
    assert.equal(await w.issueSigningRouteLinks(c), null);
  });
});

describe('f116 — a dormant link is a waiting page, not an error page', () => {
  test('waiting on an earlier counterparty signer names them', () => {
    const win = buildPortal().win;
    win.renderSharePortal(null, { dormant: { waitingOnParty: 'counterparty', waitingOn: 'Their MD',
      order: 4, total: 4, contractName: 'Warehousing Agreement', org: 'Highland Corporate Ltd',
      expiresAt: '2026-08-30T00:00:00.000Z' }, token: 't' });
    const d = win.document;
    assert.ok(d.getElementById('pt-dormant'), 'the waiting page');
    const html = d.body.innerHTML;
    assert.match(html, /Not your turn to sign yet/);
    assert.match(html, /Their MD/, 'someone on their own side — named, so they know who to chase');
    assert.match(html, /signer 4 of 4/);
    assert.match(html, /come alive/i, 'the page says it will notice by itself');
    assert.ok(!d.getElementById('pt-sign'), 'nothing to sign');
    assert.ok(!d.getElementById('pt-doc'), 'and none of the contract — the server sent none');
    assert.equal(d.querySelectorAll('button').length, 0, 'nothing to press at all');
  });

  test('an internal holdup is the organisation\'s, not a named stranger', () => {
    const win = buildPortal().win;
    win.renderSharePortal(null, { dormant: { waitingOnParty: 'internal', waitingOn: null,
      contractName: 'Warehousing Agreement', org: 'Highland Corporate Ltd' }, token: 't' });
    const html = win.document.body.innerHTML;
    assert.match(html, /Highland Corporate Ltd.s own signatures are not yet complete/);
  });

  test('the page the turn arrives on replaces the waiting page cleanly', () => {
    const win = buildPortal().win;
    win.renderSharePortal(null, { dormant: { waitingOnParty: 'internal' }, token: 't' });
    assert.ok(win.document.getElementById('pt-dormant'));
    win.renderSharePortal({ kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign',
      org: 'Highland Corporate Ltd', sharedBy: 'Wanjiru Kamau', at: '2026-07-31T09:00:00.000Z',
      contract: { id: 'MK-1', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
        template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
        audit: [], rounds: [], versions: [], signatures: [], comments: [], format: 'text',
        redlineText: 'Clause 1\n\nWording.' } },
      { token: 't', share: { recipientName: 'Their FD' } });
    const d = win.document;
    assert.ok(!d.getElementById('pt-dormant'), 'the waiting page is gone');
    assert.ok(d.getElementById('pt-sign'), 'and the signing page is live');
  });
});
