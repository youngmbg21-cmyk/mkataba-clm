/* ============================================================
   f139 — what the sender picked in the dialog is what the link is
   ============================================================
   Reported from the field (Young, 02 Aug 2026): a contract sent to a
   counterparty to BEGIN a negotiation arrived on their side read-only. The
   panel said "This is the agreed wording, shown so you can see what changed
   before you sign. The negotiation is closed on this link" — on round 1, with
   nothing proposed by anybody. Direct Edit was gone, so the counterparty could
   not redline at all until the owner had first proposed a change of their own
   and sent again.

   THE MECHANISM. The share payload carries two fields, and they mean different
   things on purpose (buildSharePayload):

     purpose        — which SCREEN to open. Falls back to a reading of the
                      change set when nobody stated one, so an old link still
                      opens on something sensible.
     purposeChosen  — what the SENDER actually picked. Never inferred. W6 reads
                      only this one when it strips the negotiating verbs off a
                      signing link, precisely so it cannot take Direct Edit away
                      from a link nobody issued for signature.

   The payload was built once, before the dialog opened, from
   defaultSharePurpose(c) — which is 'sign' for a clean contract, because most
   contracts go out to be signed. The purpose picker then moved `purpose` and
   left `purposeChosen` on the default. So picking Negotiate on a round-1
   contract sent purpose:'negotiate' with purposeChosen:'sign', and
   portalIssuedForSigning — which trusts purposeChosen and is right to — closed
   the negotiation on a link that was opened to start one.

   It healed itself once the owner proposed something, because then the default
   agreed with the picker. That is exactly the reported shape: "they cannot
   begin redlining until I send my redline as an owner."

   What is pinned here is the whole path, in the product's own code: press
   Negotiate, press Send, take the payload the server was actually given, and
   open the counterparty's real page on it. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');

/* Round one. Nothing has been proposed by anybody — the state
   defaultSharePurpose answers 'sign' for, and the state the report came from. */
const cleanContract = (over = {}) => ({
  id: 'MK-278', name: 'Mutual Non-Disclosure Agreement', counterparty: 'Juno Limited',
  template: 'NDA', status: 'Draft', folder: 'corp', fields: {}, metadata: {},
  audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 0, valueType: 'none', format: 'rich',
  redlineText: '<h1>MUTUAL NON-DISCLOSURE AGREEMENT</h1>'
    + '<h2>1. Purpose</h2><p>The Parties wish to explore a potential business relationship.</p>'
    + '<h2>2. Term</h2><p>This Agreement shall remain in force for 3 years from the effective date.</p>',
  ...over });

/* The owner's dialog, opened for real in a real DOM against a stubbed server.
   Every share request the dialog makes is captured, so a test can read the
   payload the counterparty would actually be served. */
async function shareDialog(c, over = {}) {
  const p = buildPortal({ url: 'http://localhost/hati/' });
  const win = p.win;
  const posted = [];
  /* Share is an owner action and the portal stage boots anonymous. js/core.js
     declares currentUser as a lexical `const`, so the session is seeded where
     core.js actually reads it rather than assigned over the top (see f42). */
  const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
  win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
  win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
  win.API_MODE = () => true;
  win.api = async (pathname, method, body) => {
    if (/\/shares$/.test(String(pathname)) && String(method || 'GET') === 'GET') return { shares: [] };
    if (String(pathname) === 'shares' && method === 'POST') {
      posted.push(body);
      return { ok: true, token: 'tok_new', link: 'https://hati.test/#s=t:tok_new',
        emailSent: true, emailConfigured: true, expiresAt: '2026-08-16T00:00:00.000Z' };
    }
    return {};
  };
  win.persist = () => {}; win.renderAuditSection = () => {};
  win.renderSharesSection = () => {}; win.refreshShareOverview = () => {};
  win.confirmDialog = async () => true;
  Object.assign(win, over);
  await win.openShareModal(c);
  const root = win.document.getElementById('modal-root');
  const $ = sel => root.querySelector(sel);
  return {
    win, root, $, posted,
    pick(purpose) {
      const b = root.querySelector(`[data-share-purpose="${purpose}"]`);
      assert.ok(b, `the dialog must offer "${purpose}"`);
      b.dispatchEvent(new win.Event('click', { bubbles: true }));
    },
    async send(email = 'erik@juno.example') {
      $('#share-next').dispatchEvent(new win.Event('click', { bubbles: true }));
      $('#sh-email').value = email;
      $('#share-send').dispatchEvent(new win.Event('click', { bubbles: true }));
      for (let i = 0; i < 12; i++) await Promise.resolve();
      await new Promise(r => setImmediate(r));
    },
  };
}

describe('f139 — the picker writes both fields, not one of them', () => {
  test('a clean contract defaults to Sign — the state the report came from', async () => {
    const d = await shareDialog(cleanContract());
    assert.equal(d.win.defaultSharePurpose(cleanContract()), 'sign',
      'most contracts go out to be signed; this is the default the picker has to override');
  });

  test('picking Negotiate sends purposeChosen:negotiate, not the default', async () => {
    const d = await shareDialog(cleanContract());
    d.pick('negotiate');
    await d.send();
    assert.equal(d.posted.length, 1, 'one link went out');
    const payload = d.posted[0].payload;
    assert.equal(payload.purpose, 'negotiate');
    assert.equal(payload.purposeChosen, 'negotiate',
      'purposeChosen is what W6 reads — left on the default it closes a negotiation nobody closed');
    assert.equal(d.posted[0].purpose, 'negotiate', 'and the share row agrees with the payload');
  });

  test('picking Sign still sends a signing link', async () => {
    const d = await shareDialog(cleanContract());
    d.pick('sign');
    await d.send();
    const payload = d.posted[0].payload;
    assert.equal(payload.purpose, 'sign');
    assert.equal(payload.purposeChosen, 'sign');
  });

  test('picking Negotiate then changing back to Sign leaves no negotiate residue', async () => {
    const d = await shareDialog(cleanContract());
    d.pick('negotiate');
    d.pick('sign');
    await d.send();
    assert.equal(d.posted[0].payload.purposeChosen, 'sign',
      'the last press is the choice — both fields follow it every time');
  });
});

describe('f139 — and the counterparty can redline on round one', () => {
  /* The payload the dialog actually produced, opened on the real counterparty
     page. Nothing is hand-written between the two halves: this is what would
     have been served from the shares table. */
  async function counterpartyPageFor(purpose) {
    const d = await shareDialog(cleanContract());
    d.pick(purpose);
    await d.send();
    const payload = d.posted[0].payload;
    const p = buildPortal();
    p.win.renderSharePortal(payload, { token: 'tok_new', share: { recipientName: 'Erik Lindqvist' },
      purpose: d.posted[0].purpose, emailConfigured: true });
    return { p, payload, html: p.win.document.body.innerHTML };
  }

  test('a negotiation link opens the workbench with its verbs', async () => {
    const v = await counterpartyPageFor('negotiate');
    assert.equal(v.p.win.portalIssuedForSigning(v.payload), false,
      'nobody issued this for signature');
    assert.ok(v.p.win.document.getElementById('pt-nego'), 'the shared workbench is mounted');
    assert.ok(/Direct Edit/.test(v.html),
      'the counter-proposal route — this is what a counterparty could not reach');
    assert.ok(!/negotiation is closed on this link/i.test(v.html),
      'a round-one negotiation link must never say the negotiation is closed');
  });

  test('a signing link still closes the negotiation, as W6 intends', async () => {
    const v = await counterpartyPageFor('sign');
    assert.equal(v.p.win.portalIssuedForSigning(v.payload), true);
    assert.ok(!/Direct Edit/.test(v.html),
      'a link issued for signature keeps no way back into a closed negotiation');
  });
});
