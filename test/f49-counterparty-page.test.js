/* f49 — the link IS the negotiation, until it is the signature
   ============================================================
   Reported with two screenshots.

   The first: the counterparty's link opened on a card containing a preview of
   the negotiation squeezed into a third of the width, behind a button marked
   "Open the negotiation room". They had been sent a lobby, not a document. It
   should look and feel exactly like the negotiation page the owner reads —
   same panes, same spacing, same navigation — apart from the things that are
   ours and not theirs.

   The second: when everything is agreed, or nothing was ever proposed, three
   panes of a resolved change index is a diff of nothing. Then the link should
   be the clean document and the signing panel.

   So the contract decides which screen the link is, not a button:

     changes outstanding  → the negotiation room, opened as the page
     nothing outstanding  → ready to sign, with the history still reachable

   REVISED, and three tests below are rewritten rather than worked around.
   "Nothing outstanding → ready to sign" was an INFERENCE, and it made a
   decision that is not arithmetic's to make: resolve the last change — even by
   refusing it — and the room the counterparty had been negotiating in silently
   became a request for their signature, with nobody having said the deal was
   done. Worse, the same reading turned a first-draft contract sent out clean
   into a signing request, so a counterparty invited to negotiate one had
   nowhere to propose anything.

   The rule now:

     the link carries its PURPOSE, set by the sender
     purpose 'negotiate' → the room, every time, however much is outstanding
     purpose 'sign'      → the clean document and the respond panel
     readiness is SIGNALLED by a person, never inferred from a count
     the owner answers that signal by issuing a NEW link, which supersedes
       the old one through the mechanism already in place

   A link created before purposes existed still opens on exactly the screen it
   opened on yesterday — the old reading is the fallback, and the tests for it
   are kept below under that name.

   WHAT THEY DELIBERATELY DO NOT GET, and why each one:
     Ask Copilot    — reads our whole portfolio and our playbook
     Save Draft     — our draft state, meaningless outside the workspace
     Share Link     — a counterparty who can re-share has published our contract
     Insert clause  — our clause library IS our negotiating position
     the workspace breadcrumb, template code and folder — our filing structure
     "Email: Not Configured" — our server's setup
     "Last seen"    — us watching THEM; none of their business
   Everything needed to read, judge, propose and answer stays. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const F = require('./clausefixtures.js');

const own = xs => Array.from(xs);

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
/* The owner's contract with asks on the table, built through the real model. */
async function negotiated(nums = ['4', '6']){
  const { win } = buildWorld({ negotiationView: true });
  const c = contract();
  win.negoInit(c);
  const filed = [];
  for (const n of nums){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    filed.push(await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'owner', author: 'Wanjiru Kamau', summary: F.PROTO_ASKS[n].summary }));
  }
  return { win, c, filed };
}
/* Their page, built from a payload the product really produced. */
function theirPage(c, o = {}){
  const p = buildPortal();
  const payload = sharePayloadFor(p, c, o.who || {}, o.purpose ? { purpose: o.purpose } : undefined);
  p.open(payload, o.opts || {});
  return { p, win: p.win, payload,
    $: sel => p.win.document.querySelector(sel),
    $$: sel => Array.from(p.win.document.querySelectorAll(sel)),
    text: () => p.win.document.body.textContent.replace(/\s+/g, ' ') };
}

describe('while there is something to negotiate, the link is the room', () => {
  test('the phase is read from the changes, not from a button', async () => {
    const { win, c } = await negotiated();
    const v = theirPage(c);
    const phase = v.win.portalNegoPhase(v.payload);
    assert.equal(phase.phase, 'negotiate');
    assert.equal(phase.pending, 2);
  });

  test('the room opens as the page, without anyone pressing anything', async () => {
    const { c } = await negotiated();
    const v = theirPage(c);
    assert.ok(v.$('#nego-room'), 'the full-window room must be what they land on');
    assert.ok(v.$('#nego-room .nego-pane.baseline'), 'both documents');
    assert.ok(v.$('#nego-room .nego-pane.working'));
    assert.ok(v.$('#nego-room .nego-pane.index'), 'and the change index');
  });

  test('it is the same component the owner reads, at the same size', async () => {
    const { c } = await negotiated();
    const v = theirPage(c);
    const css = v.win.document.getElementById('nego-style').textContent;
    assert.match(css, /\.nego-room\{position:fixed;inset:0/,
      'the same full-window rule — not a panel in a column');
    assert.equal(v.$$('#nego-room .nego-pane').length, 3, 'three panes, as the owner has');
    assert.ok(v.$('#nego-rz-a') && v.$('#nego-rz-b'),
      'and the same draggable dividers, so the spacing is theirs to set too');
  });

  test('every fingerprint and its wording is on their screen', async () => {
    const { c, filed } = await negotiated();
    const v = theirPage(c);
    for (const ch of filed)
      assert.ok(v.$(`#nego-room [data-badge="${ch.id}"]`), `${ch.id} must be on their page`);
    assert.match(v.$('#nego-room .nego-pane.working').textContent, /forty-five \(45\)/);
    assert.match(v.$('#nego-room .nego-pane.baseline').textContent, /thirty \(30\)/);
  });

  test('they can decide our asks, and discuss them', async () => {
    const { c, filed } = await negotiated();
    const v = theirPage(c);
    assert.ok(v.$(`#nego-room [data-nego-accept="${filed[0].id}"]`), 'Accept is theirs to press');
    assert.ok(v.$(`#nego-room [data-nego-reject="${filed[0].id}"]`));
    assert.ok(v.$(`#nego-room [data-nego-discuss="${filed[0].id}"]`));
  });

  test('and propose their own — the clause tools are on their side too', async () => {
    const { c } = await negotiated();
    const v = theirPage(c);
    assert.ok(v.$$('#nego-room .nego-pane.working [data-nego-edit]').length,
      'proposing wording is the whole point of sending them the link');
    assert.ok(v.$$('#nego-room [data-nego-del]').length);
  });

  /* REWRITTEN, and it reverses what this file asserted a round ago: "leaving
     the room lands on their page and does not snap shut again".

     That was true while the room was a mode entered from a portal page. It
     stopped being true the moment the room became the LANDING — there is no
     page underneath, no workspace, no Doc to go back to. "← Doc" left them
     staring at an empty shell, and Esc did the same thing by accident. The room
     is not a mode they entered; it is the page they were sent. */
  test('there is no way out, because there is nowhere to go', async () => {
    const { c } = await negotiated();
    const v = theirPage(c, { purpose: 'negotiate' });
    assert.ok(v.$('#nego-room'), 'the room is the page');
    assert.equal(v.$('#nego-room #nego-exit'), null,
      '"← Doc" is a breadcrumb to a workspace they do not have');
    assert.equal(v.$('#nego-room .nego-exit'), null, 'and no other exit affordance');
    const crumbs = v.$('#nego-room .nego-crumbs').textContent;
    assert.ok(!/Doc/.test(crumbs), 'nor the word, which would read as a route');
  });

  test('Escape does not empty the window under them', async () => {
    const { c } = await negotiated();
    const v = theirPage(c, { purpose: 'negotiate' });
    const ev = new v.win.Event('keydown');
    ev.key = 'Escape';
    v.win.document.dispatchEvent(ev);
    assert.ok(v.$('#nego-room'), 'still there — Esc is not registered on their side at all');
  });

  test('the OWNER keeps both, because the owner has a workspace behind the room', async () => {
    const { win, c } = await negotiated();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    assert.ok(win.document.getElementById('nego-exit'), 'the breadcrumb out');
    win.closeNegotiationRoom();
    assert.equal(win.document.getElementById('nego-room'), null);
  });
});

describe('what is ours stays ours', () => {
  test('none of the owner-only controls reach their screen', async () => {
    const { c } = await negotiated();
    const v = theirPage(c);
    for (const [id, why] of [
      ['nego-copilot', 'Copilot reads our whole portfolio and our playbook'],
      ['nego-save-draft', 'our draft state means nothing to them'],
      ['nego-share-link', 'a counterparty who can re-share has published our contract'],
      ['nego-insert-lib', 'our clause library is our negotiating position'],
    ]) assert.equal(v.$('#nego-room #' + id), null, `${id} must not be on their page — ${why}`);
  });

  /* Nearly removed, and it would have been wrong. */
  test('but they DO get the bulk verbs — those act on OUR asks', async () => {
    const { c } = await negotiated();
    const v = theirPage(c);
    assert.ok(v.$('#nego-room #nego-bulk-acc'),
      '"I agree to all of it" is a real answer; withholding the button withholds '
      + 'nothing but their time');
    assert.ok(v.$('#nego-room #nego-bulk-rej'));
  });

  test('our filing structure is not on their breadcrumb', async () => {
    const { c } = await negotiated();
    const v = theirPage(c);
    const crumbs = v.$('#nego-room .nego-crumbs').textContent.replace(/\s+/g, ' ');
    assert.ok(!/Contract Workspace/.test(crumbs), 'they are not in our workspace');
    assert.ok(!/\bWH\b/.test(crumbs), 'our template code is filing, not contract');
    assert.match(crumbs, /Warehousing and Logistics Services Agreement/,
      'what they see is the contract they were sent');
  });

  test('the status strip drops our ops config and our watching of them', async () => {
    const { c } = await negotiated();
    const v = theirPage(c);
    const strip = v.$('#nego-room #nego-status').textContent.replace(/\s+/g, ' ');
    assert.ok(!/Email:/.test(strip), 'our mail configuration is ours');
    assert.ok(!/Last seen/.test(strip), 'a reader should not be shown a log of their own visits');
    assert.match(strip, /Round 1/, 'the negotiation facts stay on both sides');
    assert.match(strip, /Resolved:/);
  });

  test('the owner still has every one of those', async () => {
    const { win, c } = await negotiated();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const d = win.document;
    for (const id of ['nego-copilot', 'nego-save-draft', 'nego-insert-lib'])
      assert.ok(d.getElementById(id), `${id} must still be on the owner's bar`);
    /* Share Link left the bar in f70 — for both sides, and for a different
       reason than the one this suite is about: it was a second way to do
       what "Send to <them>" already does. Distribution is still ours. */
    assert.equal(d.getElementById('nego-share-link'), null);
    assert.match(d.getElementById('nego-status').textContent, /Email:/);
    assert.match(d.querySelector('.nego-crumbs').textContent, /Contract Workspace/);
  });
});

describe('a SIGNING link is the signature — and it is a different link', () => {
  test('a signing link opens on the document and the respond panel', () => {
    const v = theirPage(contract(), { purpose: 'sign' });
    assert.equal(v.win.portalNegoPhase(v.payload).phase, 'sign');
    assert.equal(v.$('#nego-room'), null, 'no negotiation room — this link is not a negotiation');
    assert.ok(v.$('#pt-doc'), 'the clean document');
    assert.ok(v.$('#pt-sign') || v.$('#pt-name'), 'and the respond/sign panel');
  });

  /* REWRITTEN. This used to read "every change resolved also opens on the
     signing view" — the inference. Resolving the last change is not the same
     act as saying the deal is done, and a link that changed character
     underneath its reader told them it was, on their behalf. */
  test('every change resolved does NOT turn the negotiation link into a signature request', async () => {
    const { win, c, filed } = await negotiated();
    for (const ch of filed)
      win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });
    const v = theirPage(c, { purpose: 'negotiate' });
    assert.equal(v.win.portalNegoPhase(v.payload).phase, 'negotiate',
      'a negotiation link is the room, resolved or not');
    assert.ok(v.$('#nego-room'), 'and the room is still what they land on');
    assert.equal(v.$('#pt-agreed'), null, 'nothing tells them to sign — nobody has said so');
  });

  /* REWRITTEN for the same reason: a contract with nothing on the table is not
     evidence that anyone wants a signature. It is the ordinary shape of a first
     draft sent out for negotiation, and the reader needs somewhere to propose. */
  test('a negotiation link with nothing on the table is still the room', () => {
    const v = theirPage(contract(), { purpose: 'negotiate' });
    assert.equal(v.win.portalNegoPhase(v.payload).phase, 'negotiate');
    assert.ok(v.$('#nego-room'), 'they were invited to negotiate; give them the room');
    assert.ok(v.$$('#nego-room .nego-pane.working [data-nego-edit]').length,
      'with the clause tools, so there is something to do here');
  });

  test('a signing link accounts for what was settled rather than asking them to sign on trust', async () => {
    const { win, c, filed } = await negotiated(['4', '5', '6']);
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoResolve(c, filed[1].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoResolve(c, filed[2].id, 'rejected', { side: 'counterparty', by: 'Erik' });
    const v = theirPage(c, { purpose: 'sign' });
    const t = v.$('#pt-agreed').textContent.replace(/\s+/g, ' ');
    assert.match(t, /All 3 changes .* resolved/);
    assert.match(t, /2 adopted into the wording/);
    assert.match(t, /1 not taken/);
  });

  test('a contract nobody proposed anything on says exactly that', () => {
    const v = theirPage(contract(), { purpose: 'sign' });
    const box = v.$('#pt-agreed');
    assert.ok(box);
    assert.match(box.textContent, /No changes were proposed/);
    assert.equal(v.$('#pt-nego-open'), null, 'and offers no history, because there is none');
  });

  test('the history stays reachable when there IS one', async () => {
    const { win, c, filed } = await negotiated();
    for (const ch of filed)
      win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirPage(c, { purpose: 'sign' });
    assert.ok(v.$('#pt-nego-open'), 'signing must not be a corridor with no way to look back');
    assert.match(v.$('#pt-nego-open').textContent, /Review what changed/);
  });

  /* And the room they reach that way DOES have a way out, unlike the one a
     negotiation link lands them in. It is a mode they entered from a page that
     still exists — the difference the whole exit rule turns on. */
  test('the room reached from a signing link can be left again', async () => {
    const { win, c, filed } = await negotiated();
    for (const ch of filed)
      win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirPage(c, { purpose: 'sign' });
    v.$('#pt-nego-open').dispatchEvent(new v.win.Event('click', { bubbles: true }));
    assert.ok(v.$('#nego-room'), 'it opens');
    assert.ok(v.$('#nego-room #nego-exit'), 'and it can be left, because there is a page behind it');
  });

  test('the signing verbs are on the page — one act, the rest behind a door', async () => {
    /* There were five, rendered as equals: Approve & sign, Accept the wording
       (without signing), Propose edits (redline), Request changes, Decline.
       Three of them are the same sentence in a first-time reader's head, and
       every one was named after what the system does rather than what the
       person does. The link already knows it is for signing, so that is the
       button; the other four keep their ids and their behaviour behind one
       line of plain English, each relabelled as an act. */
    const v = theirPage(contract(), { purpose: 'sign' });
    const t = v.text();
    assert.ok(t.includes('Sign this contract'), 'the one act the link is for');
    assert.ok(t.includes('Not ready to sign?'), 'and a way to the alternatives');
    const others = v.$('#pt-other');
    assert.ok(others, 'the alternatives are on the page');
    assert.ok(others.className.includes('hidden'), 'but not competing with the signature');
    for (const id of ['pt-accept', 'pt-redline', 'pt-changes', 'pt-decline'])
      assert.ok(v.$('#' + id), `${id} must still exist and still work`);
    for (const label of ['Change the wording yourself', 'Tell them what you want changed',
                         'Decline this contract'])
      assert.ok(others.textContent.includes(label), `"${label}" names the act, not the mechanism`);
  });

  /* The fallback, kept because links created before purposes existed are still
     in people's inboxes. They open on exactly the screen they opened on
     yesterday, inferred from the change set — and that is the ONLY place the
     inference survives. */
  test('a link with no purpose at all still opens the way it used to', async () => {
    const clean = theirPage(contract());
    assert.equal(clean.win.portalNegoPhase(clean.payload).phase, 'sign',
      'no changes, no purpose — the old reading said sign, and still does');
    const { c } = await negotiated();
    const live = theirPage(c);
    assert.equal(live.win.portalNegoPhase(live.payload).phase, 'negotiate',
      'changes outstanding, no purpose — the room, as before');
  });
});


describe('a spent link is history, and history is not signable', () => {
  test('a superseded copy opens on neither the room nor a sign prompt', async () => {
    const { c } = await negotiated();
    const p = buildPortal();
    const payload = sharePayloadFor(p, c);
    p.open(payload, { superseded: true });
    assert.equal(p.win.portalNegoPhase(payload).phase, 'read',
      'an outdated copy is for reading — it can neither negotiate nor sign');
    assert.equal(p.win.document.getElementById('nego-room'), null);
  });
});
