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

/* ============================================================
   f116 (W7 fault 5) — a held link is not a delivery failure
   ============================================================
   REPORTED 12 Aug 2026, with a screenshot: pressing "Send by email" for a
   counterparty signer who is SECOND on the route produced an amber box —

     "Not delivered — the mail provider refused it. The link was created and is
      safe to send another way, but <address> has not received anything. No
      reason was given."

   Nothing was refused. Nothing was attempted. A bound signing link whose turn
   has not come is created, parked, and emailed by the server the moment the
   signer before it finishes — which is what then happened. The behaviour was
   right and only the sentence was wrong.

   THE PROOF THAT NOTHING WAS ATTEMPTED, so nobody re-argues it: sendEmail
   always carries the provider's own sentence back on a refusal, and falls back
   to "Resend rejected this message (<status>)" when the provider says nothing.
   A refusal can never come back blank, so a blank reason can only mean no
   attempt was made.

   These are the source-level halves — that the fact is on the wire, that the
   dialog reads it, and that the branches stay in the one order that works.
   What the BOX SAYS is a claim about pixels and lives in
   test/chromium/held-link-verify.js: every assertion here passed while the
   screen was lying. */
describe('f116 (W7 fault 5) — a held link is never reported as a refusal', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const core = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
  const srv = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
  /* The chain of outcomes inside doSend, as source. */
  const chain = core.slice(core.indexOf("if(ch==='email'){", core.indexOf('const doSend=')),
    core.indexOf("} else if(ch==='whatsapp'){"));

  test('the dialog has an outcome of its own for a held link', () => {
    assert.match(chain, /else if\(r\.heldForTurn\)\{/,
      'heldForTurn must be a branch, not something that falls into the refusal');
    assert.match(chain, /co_link_held/, 'and it says the link is held, not refused');
  });

  test('and it READS the fact rather than working it out again', () => {
    /* The route that decides to hold is the only thing that should decide what
       we say about it. A second computation here is a second thing to keep in
       step with it. */
    assert.ok(!/signerPlan|signerTurn|\.order\s*<|signed/.test(chain),
      'the dialog must not re-derive whose turn it is');
    assert.match(chain, /r\.heldFor/, 'who we are waiting on is read off the reply too');
  });

  test('the branch order that already had one bug in it is preserved', () => {
    /* alreadySentAt is checked BEFORE the refusal branch because of the false
       "Not delivered" of 02 Aug 2026. The new branch goes between them: after
       the two that mean "something did go out", before the refusal. */
    const at = s => chain.indexOf(s);
    assert.ok(at('r.emailSent') > -1 && at('r.alreadySentAt') > -1
      && at('r.heldForTurn') > -1 && at('r.emailConfigured') > -1, 'all four branches present');
    assert.ok(at('r.emailSent') < at('r.alreadySentAt'), 'sent first');
    assert.ok(at('r.alreadySentAt') < at('r.heldForTurn'), 'already-sent still beats the new branch');
    assert.ok(at('r.heldForTurn') < at('r.emailConfigured'), 'and held beats the refusal');
  });

  test('the invented reason is gone, because it described an impossible state', () => {
    /* sendEmail guarantees a sentence on every real refusal. Once a
       non-attempt stops being reported as one, "No reason was given" describes
       a state that cannot occur. */
    /* The RENDERED form — the ternary's else-half — not the phrase wherever it
       appears: the note above the fixed branch quotes the old sentence on
       purpose, and a test that cannot tell a quotation from the thing itself
       would forbid writing down why the change was made. */
    assert.ok(!/:' No reason was given\.'/.test(core),
      'a refusal always carries a reason; the fabricated fallback must not survive');
    assert.match(srv, /Resend rejected this message/,
      'and that guarantee is the thing this rests on');
  });

  test('a real refusal is still reported as one', () => {
    assert.match(chain, /else if\(r\.emailConfigured\)\{/, 'the refusal branch survives');
    assert.match(chain, /co_not_delivered/);
    assert.match(chain, /esc\(r\.emailError\)/, 'and it quotes the provider\'s own sentence');
  });

  test('the URL is withheld from the held box, and says where it lives', () => {
    /* "Safe to send another way" is the part that did harm: a held link opens
       a dormant waiting page, so a recipient handed it early meets a holding
       screen and concludes the link is broken. Not withheld silently — the
       Shares panel is the durable record and the box says so. */
    const held = chain.slice(chain.indexOf('else if(r.heldForTurn)'), chain.indexOf('else if(r.emailConfigured)'));
    assert.ok(!/\$\{link\}/.test(held), 'the held box does not hand over the URL');
    assert.match(held, /co_link_held_where/, 'it says where the link is instead');
  });

  test('the server carries who we are waiting on, so the browser need not guess', () => {
    assert.match(srv, /if \(heldForTurn && turn\.waitingOn\)/);
    assert.match(srv, /heldFor: heldFor \|\| undefined/, 'on the fresh POST');
    assert.match(srv, /signerId, heldForTurn, heldFor,/, 'and on the reused-bound-link branch');
  });

  test('a deliberately quiet round is not a refusal either', () => {
    /* The same lie, second place: a round published onto a standing link sends
       nothing ON PURPOSE, and both resend paths fell through to
       reshareNotSentModal, which blamed the provider. The contract page's own
       toast had been saying this correctly all along. */
    /* The trailing semicolon is what separates a CALL from the declaration —
       `function reshareNotSentModal(c, out, who){` carries the same substring
       and is not a caller. */
    const callers = core.split('reshareNotSentModal(c, out, who);');
    assert.equal(callers.length, 3, 'both callers are still there, and only those two');
    /* A generous window: one caller has the WhatsApp branch between its quiet
       check and the fall-through, and the point is that quiet is checked
       somewhere in the same chain — not how many branches sit after it. */
    for (const before of callers.slice(0, -1))
      assert.match(before.slice(-1200), /out\.quiet/,
        'each caller must check quiet before falling through to the modal');
    assert.match(core, /co_round_on_standing_link/);
  });
});

/* ---- STILL OUTSTANDING: THE BOX ITSELF ----
   The work order asked for the pixels — a check that presses Send and reads
   the sentence out of the result box. It is not here, and that is a gap rather
   than a decision.

   Two attempts failed for the same reason, and the reason is worth recording
   so the next person does not spend the afternoon I did. The box is built
   inside doSend, which is a closure in openShareModal — there is no way to ask
   for it directly, so it has to be driven through the dialog. Driving it means
   getting past a three-step form and then the address echo, the explicit
   confirmation a binding signing link asks for before it posts. That gate
   cannot be stubbed: confirmDialog is a top-level function in js/core.js, a
   LEXICAL binding, so assigning window.confirmDialog does nothing (the trap
   THE MAP records against currentUser and friends). Pressing its own #cf-ok
   is the only way through it, and in both a real browser and jsdom the send
   never reached that overlay — no toast, no request, the button left reading
   "Sending…".

   What IS covered above: which branch is written, the order they are tested in,
   the words each one uses, and that the URL is withheld from the held one. What
   is NOT covered is that the held branch is the one a real press lands on. */
