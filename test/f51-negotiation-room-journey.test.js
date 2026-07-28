/* f51 — the whole journey, both directions
   ============================================================
   Reported from four screenshots of the counterparty's own screen, and the
   diagnosis for each one is written against the code rather than the picture.

   1. TWO ROWS OF VERBS AT TWO DIFFERENT SCOPES, rendered as equals. The index's
      Accept / Reject / Discuss / Undo act on ONE change; the top bar's verbs
      answer the WHOLE DEAL. Among the top-bar four was "Accept wording", a
      whole-document acceptance inherited from the portal's respond panel:
      pressed with changes still pending it filed an acceptance on nobody's
      behalf. And "Approve & sign" signed nothing — it routed to a panel.

   2. "SEND TO <the owner>" DID NOTHING, for three independent reasons, all of
      them real and all of them fixed here:
        · it was the wrong button — #nego-send is the turn banner's, wired to
          openShareModal, the OWNER's route. On the counterparty's link that
          tried to mint a share link they cannot mint.
        · the right button could not have worked either — portalRespond opens
          with `if(!name) toast('Enter your full name')`, reading #pt-name,
          a field on the page UNDERNEATH the full-window room. Once the room
          became the landing, that box was unreachable and every send failed its
          own first line.
        · and the server rejected it anyway — 'decisions' was missing from the
          /respond action whitelist, so every batch of per-change answers ever
          sent came back 400 Invalid response.

   3. NO WAY OUT, and none wanted. "← Doc" is a breadcrumb to a workspace the
      counterparty does not have. This reverses an assertion f49 made a round
      ago; that test is rewritten there, not worked around here.

   4. READINESS IS SIGNALLED, NEVER INFERRED. Resolving the last change used to
      turn the negotiation link into a signature request. Now a person says so,
      the owner is told in three places, and the owner issues a NEW link — the
      old one is superseded through the mechanism already in place.

   THE JUDGEMENT CALL, recorded because it is scope nobody asked for: gating
   "Ready to sign" on the parties being aligned deadlocks on a single refusal —
   reject one ask and neither side can ever signal. So a refused ask can be
   WITHDRAWN by the side that made it, which is the acknowledgement that settles
   it. Without that the gate is worse than the bug it fixes. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}

/* STEP 1 of the journey — the owner opens a contract and proposes changes. */
async function ownerProposed(nums = ['4', '6']){
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
/* An ask made by THEM, so the owner has something to refuse. */
async function theyProposed(c, win, num = '5'){
  const cl = win.negoClauseList(c).find(x => x.num === num);
  return win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[num].text}</p>`,
    { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS[num].summary });
}

/* STEP 2 — the counterparty opens the link they were sent. Built from a payload
   the product really produces, opened the way portalEntry opens it. */
function theirLink(c, o = {}){
  const p = buildPortal();
  const payload = sharePayloadFor(p, c, {}, { purpose: o.purpose || 'negotiate' });
  p.open(payload, { token: 'tok_test', share: { recipientName: 'recipientName' in o ? o.recipientName : 'Erik Lindqvist' },
    ...(o.opts || {}) });
  const doc = p.win.document;
  /* ROOM FIRST, then the page. The page also mounts a hidden embedded copy of
     the same component (it is what f37 diffs the two sides against), so the
     document carries two elements for several of these ids. The room is the one
     covering the window, and therefore the only one a person can press — so it
     is the one these tests drive. */
  /* Ids are rewritten as attribute selectors for the room-scoped lookup: a
     `#id` selector is answered from the document's id map, so with the same id
     mounted twice it finds the first one and then reports null because that one
     is not inside the room. The product has the same helper, for the same
     reason — js/views/negotiation.js's negoPick. */
  const scoped = sel => sel.replace(/#([\w-]+)/g, '[id="$1"]');
  const $ = sel => {
    const room = doc.querySelector('#nego-room');
    return (room ? room.querySelector(scoped(sel)) : null) || doc.querySelector(sel);
  };
  return { p, win: p.win, payload, $,
    $$: sel => Array.from(doc.querySelectorAll(sel)),
    text: () => doc.body.textContent.replace(/\s+/g, ' '),
    /* Press something in the room and let its handler settle. */
    async press(sel){
      const el = $(sel);
      assert.ok(el, 'missing control: ' + sel);
      assert.ok(!el.disabled, 'control is disabled: ' + sel);
      el.dispatchEvent(new p.win.Event('click', { bubbles: true }));
      /* Generously drained. The handlers are async and some of them chain — a
         dialog, then the response, then the repaint — so a short drain reads
         the page half-way through the act it is asserting about. */
      for (let round = 0; round < 3; round++){
        for (let i = 0; i < 20; i++) await Promise.resolve();
        await new Promise(r => setImmediate(r));
      }
      return el;
    },
    readyBtn: () => $('#nego-cp-ready'),
    why: () => ($('#nego-ready-why') || {}).textContent?.replace(/\s+/g, ' ').trim() || '',
    /* The response IS the body, on every action. Read exactly that, so a
       regression that re-wrapped it would fail here rather than be tolerated. */
    sent: () => p.log.sent.map(x => x.body).filter(Boolean),
    last: () => { const s = p.log.sent; return s.length ? s[s.length - 1].body : null; },
    toasts: () => p.log.toasts.map(t => t.msg).join(' | ') };
}
/* The owner's side of the wire — js/core.js's applyResponse, for real. */
function ownerRecord(){
  const p = buildPortal();
  p.win.promptDialog = async () => '';
  p.win.persist = () => {};
  p.win.saveContract = () => {};
  p.win.renderWorkspace = () => {};
  p.win.setView = () => {};
  p.win.renderNegotiationSection = () => {};
  p.win.renderAuditSection = () => {};
  return p.win;
}
const auditText = c => (c.audit || []).map(e => `${e.action}: ${e.detail}`).join(' | ');

/* ============================================================
   STEP 2 — they land on the room, and there is nothing else
   ============================================================ */
describe('the link they were sent is the room, and the room is all there is', () => {
  test('a negotiation link opens on the room without anyone pressing anything', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    assert.equal(v.win.portalNegoPhase(v.payload).phase, 'negotiate');
    assert.ok(v.$('#nego-room'), 'the full-window room is the landing');
    assert.equal(v.$$('#nego-room .nego-pane').length, 3);
  });

  test('and it stays the room when everything on it is resolved', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirLink(c);
    assert.equal(v.win.portalNegoPhase(v.payload).phase, 'negotiate',
      'the link carries its purpose; the change count does not get a vote');
    assert.ok(v.$('#nego-room'));
  });

  test('there is no exit, no Esc route, and no page behind it', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    assert.equal(v.$('#nego-exit'), null, '"← Doc" points at a workspace they do not have');
    assert.equal(v.$('.nego-exit'), null);
    const ev = new v.win.Event('keydown'); ev.key = 'Escape';
    v.win.document.dispatchEvent(ev);
    assert.ok(v.$('#nego-room'), 'Escape must not empty the window under them');
  });

  /* Everything the card carried was unreachable behind a fixed full-window
     overlay — but it was still in the page: a second "open the room" button and
     a second send a keyboard could tab to, and a second element for every id
     the room uses. */
  test('and nothing of the old lobby is left in the page behind it', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    const doc = v.win.document;
    assert.equal(doc.querySelector('#pt-nego-wrap'), null, 'no card describing the room');
    assert.equal(doc.querySelector('#pt-nego-open'), null, 'no second way into a room they are in');
    assert.equal(doc.querySelector('#pt-nego-send'), null, 'and no second send');
    assert.equal(doc.querySelectorAll('[id="nego-cp-ready"]').length, 1,
      'one Ready to sign in the document, so a press cannot reach a copy of it');
  });

  test('the owner-only controls are still absent, and the bulk verbs still present', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    for (const id of ['nego-copilot', 'nego-save-draft', 'nego-insert-lib'])
      assert.equal(v.$('#nego-room #' + id), null, id + ' is ours');
    assert.equal(v.$('#nego-room #nego-share-link'), null,
      'and Share Link is on neither bar now — see f70');
    assert.ok(v.$('#nego-room #nego-bulk-acc'), '"I agree to all of it" is a real answer');
    assert.ok(v.$('#nego-room #nego-bulk-rej'));
  });

  /* The button that did nothing. It is not disabled or relabelled — it is not
     rendered on their side at all, because minting a share link is not a thing
     a counterparty can do. */
  test('the owner\'s "Send to …" share button is not on their bar', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    assert.equal(v.$('#nego-send'), null,
      'it opened the OWNER\'s share dialog — on their link it could only ever do nothing');
  });

  test('but the owner still has it, on the owner\'s turn', async () => {
    const { win, c } = await ownerProposed();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    assert.ok(win.document.getElementById('nego-send'), 'sending it back is the owner\'s move');
  });
});

/* ============================================================
   STEP 3 — deciding changes, one at a time and in bulk
   ============================================================ */
describe('they work through the changes', () => {
  test('Accept, Reject, Discuss and Undo are all on the card', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;
    assert.ok(v.$(`[data-nego-accept="${id}"]`));
    assert.ok(v.$(`[data-nego-reject="${id}"]`));
    assert.ok(v.$(`[data-nego-discuss="${id}"]`));
    await v.press(`[data-nego-accept="${id}"]`);
    assert.ok(v.$(`[data-nego-undo="${id}"]`), 'and every decision is reversible');
  });

  test('a decision is held on the page, and the send appears in the index with it', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    assert.equal(v.$('#nego-send-decisions'), null, 'nothing decided, nothing to send');
    await v.press(`[data-nego-accept="${filed[0].id}"]`);
    const send = v.$('#nego-room .nego-pane.index #nego-send-decisions');
    assert.ok(send, 'the send belongs with the decisions, not in the deal-verb bar');
    assert.match(send.textContent, /Send 1 decision/);
    assert.equal(v.last(), null, 'and nothing has actually left yet');
  });

  test('Accept All answers every one of our asks at once', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    await v.press('#nego-bulk-acc');
    assert.match(v.$('#nego-send-decisions').textContent,
      new RegExp(`Send ${filed.length} decisions`));
  });

  /* THE CONTROLS THAT WERE WIRED TO A HIDDEN COPY. Their page mounts this
     component twice — the room, and the embedded panel the parity test diffs
     against — and every wiring looked its element up with
     document.getElementById, which returns the FIRST match in the document:
     always the hidden one. So on their page the room's bulk verbs, index fold,
     drawer and per-change reply boxes had no handlers on them at all. */
  test('there is only ONE copy of the negotiation on the page, and the verbs reach it', async () => {
    /* This used to assert there were TWO — the room, and a hidden embedded
       mount underneath it — and then prove that a press reached the visible
       one. The right answer was never "make sure the duplicate loses"; it was
       to stop rendering the duplicate. Two copies meant two elements for every
       id the room uses, and portalRespond picked the button it reports
       progress on with getElementById — so "Sending…" was being written onto a
       copy nobody could see. On a negotiation link the room IS the page, so
       the embedded mount is skipped and every id is unique again. */
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    assert.equal(v.$$('[id="nego-bulk-acc"]').length, 1,
      'exactly one negotiation on the page');
    assert.equal(v.$$('[id="nego-cards"]').length, 1, 'and one change index');
    await v.press('#nego-bulk-acc');
    assert.match(v.$('#nego-send-decisions').textContent,
      new RegExp(`Send ${filed.length} decisions`), 'the press must reach the room');
  });

  test('so is the per-change reply box', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;
    await v.press(`[data-nego-discuss="${id}"]`);
    const box = v.$(`[id="nego-ti-${id}"]`);
    assert.ok(box, 'the thread opens in the room');
    box.value = 'Net-45 works for us if delivery stays at 14 days.';
    await v.press(`[data-nego-send="${id}"]`);
    const msg = v.p.log.messages[v.p.log.messages.length - 1];
    assert.ok(msg, 'a comment typed in the room must actually be posted');
    assert.match(msg.body, /Net-45 works for us/);
    /* Down the MESSAGES route, not the response route: a comment changes no
       wording, opens no round and must not close the link. */
    const call = v.p.log.sent[v.p.log.sent.length - 1];
    assert.match(call.pathname, /\/messages$/);
    assert.equal(call.body.author, 'Erik Lindqvist');
    assert.match(call.body.topic, new RegExp('^change:' + id + '$'),
      'attached to the fingerprint it was written about');
  });

  test('and a comment with nobody\'s name on it is not sent', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c, { recipientName: '' });
    const id = filed[0].id;
    await v.press(`[data-nego-discuss="${id}"]`);
    v.$(`[id="nego-ti-${id}"]`).value = 'Who is this from?';
    await v.press(`[data-nego-send="${id}"]`);
    assert.equal(v.p.log.messages.length, 0);
    assert.match(v.toasts(), /Enter your full name/);
  });

  test('and the index fold', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    await v.press('#nego-fold');
    assert.ok(v.$('[id="nego-unfold"]') || v.win.negoLayout().idxOff,
      'folding the index away is a room control, and must act on the room');
  });

  test('Reject All does too, and leaves the deal contested rather than settled', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    v.win.promptDialog = async () => 'Net-30 stands.';
    await v.press('#nego-bulk-rej');
    assert.ok(v.readyBtn().disabled, 'refusing everything is not agreeing to anything');
  });
});

/* ============================================================
   STEP 4 — who is answering, asked in the room
   ============================================================ */
describe('their name is collected where the sending happens', () => {
  test('the field is in the room and prefilled from the share\'s recipient', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    const box = v.$('#nego-room #nego-cp-name');
    assert.ok(box, 'the field that gates every send must be on the page that sends');
    assert.equal(box.value, 'Erik Lindqvist');
  });

  test('with nobody named on the share it opens empty, not filled with the company', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c, { recipientName: '' });
    assert.equal(v.$('#nego-cp-name').value, '',
      'filing "Nordfrakt Logistik AB" as the person who answered would be a lie told quietly');
  });

  test('an empty name blocks the send and says where the box is', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c, { recipientName: '' });
    await v.press(`[data-nego-accept="${filed[0].id}"]`);
    await v.press('#nego-send-decisions');
    assert.equal(v.last(), null, 'nothing may be filed without a name against it');
    assert.match(v.toasts(), /Enter your full name — the box is at the top of this page/);
  });

  test('the name typed in the room is the one that travels', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c, { recipientName: '' });
    v.$('#nego-cp-name').value = 'Erik Lindqvist';
    await v.press(`[data-nego-accept="${filed[0].id}"]`);
    await v.press('#nego-send-decisions');
    assert.equal(v.last().name, 'Erik Lindqvist');
  });
});

/* ============================================================
   STEP 5 — the gate, and what it says while it is shut
   ============================================================ */
describe('Ready to sign is gated, visible, and explains itself', () => {
  test('with changes pending it is on the screen, disabled, and names what is outstanding', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    const btn = v.readyBtn();
    assert.ok(btn, 'a control that vanishes teaches nothing');
    assert.equal(btn.disabled, true);
    assert.match(v.why(), /2 changes still waiting on a decision/);
    assert.match(btn.getAttribute('title'), /2 changes still waiting on a decision/);
  });

  test('a refused ask keeps it shut, and says whose move clears it', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik', reply: 'No.' });
    const v = theirLink(c);
    assert.equal(v.readyBtn().disabled, true,
      '"every change has an answer" is not the same as "the parties agree"');
    assert.match(v.why(), /refused ask.* the other side has not withdrawn/);
    assert.ok(v.$(`[data-contested="${filed[1].id}"]`), 'and the card says so where the change is');
  });

  test('every change accepted opens it', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirLink(c);
    assert.equal(v.readyBtn().disabled, false);
    assert.equal(v.$('#nego-ready-why'), null, 'nothing outstanding, nothing to explain');
  });

  /* Comparing two old versions disables the bulk verbs — nothing on that screen
     is a live proposal. It used to empty the whole top bar as well, taking the
     name they had typed with it. */
  test('comparing two versions disables the gate without emptying the bar', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirLink(c);
    v.$('#nego-cp-name').value = 'Erik Lindqvist Jr';
    const opts = v.$$('[data-nego-vsel="left"] option').map(o => o.value);
    const old = opts.find(x => x !== 'baseline' && x !== 'working');
    if (!old) return;                       // no snapshot to compare against
    v.win.negoSetComparePair(old, 'working');
    v.win.openPortalNegoRoom(v.win.portalNegoContract(v.payload), v.payload);
    assert.ok(v.$('#nego-cp-decline'), 'ending a deal has no precondition');
    assert.equal(v.$('#nego-cp-name').value, 'Erik Lindqvist Jr',
      'and who they are does not depend on which version they are reading');
    assert.equal(v.readyBtn().disabled, true);
    assert.match(v.why(), /Not while you are comparing versions/);
  });

  test('a contract with no changes at all is aligned from the start', async () => {
    const v = theirLink(contract());
    assert.ok(v.$('#nego-room'), 'still the room — they were invited to negotiate');
    assert.equal(v.readyBtn().disabled, false,
      'there is nothing to disagree about, so there is nothing to settle first');
  });

  test('the model agrees with the button, and is the thing the button reads', async () => {
    const { win, c, filed } = await ownerProposed();
    assert.equal(win.negoAlignment(c).aligned, false);
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik' });
    assert.equal(win.negoAlignment(c).aligned, false, 'refused is not agreed');
    assert.equal(win.negoAlignment(c).contested.length, 1);
    win.negoWithdraw(c, filed[1].id, { side: 'owner', by: 'Wanjiru Kamau' });
    assert.equal(win.negoAlignment(c).aligned, true, 'withdrawn is settled');
  });
});

/* ============================================================
   STEP 6 — one press, one call
   ============================================================ */
describe('Ready to sign posts the decisions and the readiness together', () => {
  test('one request carries both', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    await v.press('#nego-bulk-acc');
    await v.press('#nego-cp-ready');
    assert.equal(v.sent().length, 1, 'ONE call — not "send, then remember to say you are done"');
    const r = v.last();
    assert.equal(r.action, 'ready');
    assert.equal(r.name, 'Erik Lindqvist');
    assert.equal(r.negoDecisions.length, filed.length);
    assert.ok(r.negoDecisions.every(d => d.status === 'accepted'));
  });

  test('it goes down the existing respond route — no new endpoint', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    await v.press('#nego-bulk-acc');
    await v.press('#nego-cp-ready');
    assert.match(v.p.log.sent[0].pathname, /^shares\/tok_test\/respond$/);
  });

  test('the button reports itself spent, and says nothing was signed', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    await v.press('#nego-bulk-acc');
    await v.press('#nego-cp-ready');
    assert.match(v.readyBtn().textContent, /Sent — they know you are ready/);
    assert.equal(v.readyBtn().disabled, true, 'pressing it again is not a second fact');
    assert.match(v.toasts(), /Nothing is signed yet/);
  });

  test('a readiness signal with no decisions left to send is still a valid signal', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirLink(c);
    await v.press('#nego-cp-ready');
    assert.equal(v.last().action, 'ready');
    assert.equal(v.last().negoDecisions.length, 0, 'they had already answered everything');
  });
});

/* ============================================================
   STEP 7 — it lands on the owner's record, and in three places
   ============================================================ */
describe('the owner receives it', () => {
  async function delivered(){
    const { win, c, filed } = await ownerProposed();
    const rec = ownerRecord();
    const res = { v: 1, kind: 'hati-response', id: c.id, action: 'ready',
      name: 'Erik Lindqvist', title: 'Procurement Manager', email: 'erik@nordfrakt.se', comment: '',
      negoDecisions: filed.map(f => ({ id: f.id, status: 'accepted', reply: null })),
      at: '2026-07-27T10:00:00Z' };
    const ok = await rec.applyResponse(c, res, { background: true });
    return { win, rec, c, filed, ok };
  }

  test('the decisions are filed through negoResolve, and the wording moves', async () => {
    const { rec, c, filed, ok } = await delivered();
    assert.equal(ok, true);
    for (const f of filed) assert.equal(rec.negoChangeById(c, f.id).status, 'accepted');
    assert.match(rec.docPlainText(c), /forty-five \(45\)/, 'an acceptance is a merge, not a note');
  });

  test('the readiness is recorded with who, when and which side', async () => {
    const { rec, c } = await delivered();
    const sig = rec.negoReadySignal(c, 'counterparty');
    assert.ok(sig, 'a signal, stored — not re-derived from the change count');
    assert.equal(sig.by, 'Erik Lindqvist, Procurement Manager');
    assert.equal(sig.side, 'counterparty');
    assert.equal(sig.at, '2026-07-27T10:00:00Z');
    assert.equal(rec.negoReadySignal(c, 'owner'), null, 'and only the side that sent it');
  });

  /* The turn moved to them when the round was sent. Nothing moved it back when
     they answered, so the owner's banner went on reading "Waiting on Nordfrakt"
     over a contract Nordfrakt had already replied to. */
  test('answering hands the turn back, so the banner stops waiting on them', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoHandOver(c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    assert.equal(win.negoTurn(c), 'counterparty');
    const rec = ownerRecord();
    await rec.applyResponse(c, { v: 1, kind: 'hati-response', id: c.id, action: 'decisions',
      name: 'Erik Lindqvist', negoDecisions: filed.map(f => ({ id: f.id, status: 'accepted' })),
      at: '2026-07-27T10:00:00Z' }, { background: true });
    assert.equal(rec.negoTurn(c), 'owner', 'an answer IS the hand-back');
    assert.equal(win.negoTurnBanner(c, 'owner').mine, true);
  });

  test('and a readiness signal does the same', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoHandOver(c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    const rec = ownerRecord();
    await rec.applyResponse(c, { v: 1, kind: 'hati-response', id: c.id, action: 'ready',
      name: 'Erik Lindqvist', negoDecisions: [], at: '2026-07-27T10:00:00Z' }, { background: true });
    assert.equal(rec.negoTurn(c), 'owner');
  });

  test('asking a contract whether it is aligned does not write to it', async () => {
    const { win } = await ownerProposed();
    /* The dashboard asks this of every contract in the portfolio, most of them
       loaded as summaries with their bodies stripped. A read that created a
       negotiation record — or stamped clause ids into a document — would be a
       write dressed as a question. */
    const light = { id: 'MK-LIGHT', name: 'Summary only', status: 'Under Review' };
    assert.equal(win.negoAlignment(light).aligned, true);
    assert.equal(light.negotiation, undefined, 'nothing was created');
    assert.equal(light.changes, undefined);
  });

  test('the audit says what happened and, plainly, what did not', async () => {
    const { c } = await delivered();
    const t = auditText(c);
    assert.match(t, /Ready to sign: Erik Lindqvist, Procurement Manager signalled ready to sign/);
    assert.match(t, /Nothing is signed/);
    assert.match(t, /issue a signing link/);
  });

  test('SURFACE 1 — a banner in the negotiation room, with the owner\'s verb on it', async () => {
    const { win, c } = await delivered();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const box = win.document.getElementById('nego-ready-signal');
    assert.ok(box, 'the room the owner was reading must say so');
    assert.match(box.textContent.replace(/\s+/g, ' '), /Erik Lindqvist.*signalled.*ready to sign/);
    assert.match(box.textContent, /Nothing is signed yet/);
    assert.ok(win.document.getElementById('nego-issue-signing'),
      'and the next act is the owner\'s, so the verb is here');
  });

  test('SURFACE 2 — a strip on the Docs page, where somebody who stopped opening the room will see it', async () => {
    const { c } = await delivered();
    const { win } = buildWorld({ contractView: true });
    win.negoInit(c);
    const html = win.readyToSignStrip(c);
    assert.match(html, /Ready to sign/);
    assert.match(html, /Erik Lindqvist/);
    assert.match(html, /Nothing is signed yet/);
    assert.match(html, /Issue a signing link/);
  });

  test('SURFACE 2 goes quiet once the contract is signed or declined', async () => {
    const { c } = await delivered();
    const { win } = buildWorld({ contractView: true });
    assert.equal(win.readyToSignStrip({ ...c, status: 'Signed' }), '');
    assert.equal(win.readyToSignStrip({ ...c, status: 'Declined' }), '');
    assert.equal(win.readyToSignStrip(contract()), '', 'and says nothing when nobody has signalled');
  });

  /* The dashboard proper needs the whole application shell to boot — metrics,
     risk scoring, the family model — so what is driven here is the pair the
     surface is built from. The Chromium pass measures it on a real page. */
  test('SURFACE 3 — the waiting-on-you card picks it up', async () => {
    const { c } = await delivered();
    const { win } = buildWorld({ homeView: true });
    const items = win.readyToSignItems([c, contract({ id: 'MK-QUIET' })]);
    assert.equal(items.length, 1, 'only contracts somebody has actually signalled on');
    assert.equal(items[0].c.id, c.id);
    assert.equal(items[0].sig.by, 'Erik Lindqvist, Procurement Manager');
  });

  test('SURFACE 3 says ready to sign, and says nothing is signed', async () => {
    const { c } = await delivered();
    const { win } = buildWorld({ homeView: true });
    const html = win.readyToSignRowsHtml(win.readyToSignItems([c]));
    assert.match(html, /Ready to sign — issue a signing link/);
    assert.match(html, /Erik Lindqvist, Procurement Manager signalled ready — nothing is signed yet/);
    assert.match(html, /data-sel="MK-191"/, 'and it opens the contract it is about');
  });

  test('SURFACE 3 drops a contract that has since been signed or declined', async () => {
    const { c } = await delivered();
    const { win } = buildWorld({ homeView: true });
    assert.equal(win.readyToSignItems([{ ...c, status: 'Signed' }]).length, 0);
    assert.equal(win.readyToSignItems([{ ...c, status: 'Declined' }]).length, 0);
    assert.equal(win.readyToSignRowsHtml([]), '', 'and renders nothing at all when there is nothing');
  });

  /* The gate is enforced on both sides of the wire. Their page disables the
     button; a response is a public POST and the page that sent it is not ours. */
  test('a readiness claim the change set does not support is refused', async () => {
    const { c, filed } = await ownerProposed();
    const rec = ownerRecord();
    const res = { v: 1, kind: 'hati-response', id: c.id, action: 'ready', name: 'Erik Lindqvist',
      negoDecisions: [{ id: filed[0].id, status: 'accepted' }], at: '2026-07-27T10:00:00Z' };
    const ok = await rec.applyResponse(c, res, { background: true });
    assert.equal(rec.negoReadySignal(c, 'counterparty'), null,
      'one change is still pending — the contract checks the claim, it does not believe it');
    assert.equal(rec.negoChangeById(c, filed[0].id).status, 'accepted',
      'but the decision they DID send is still filed — it was true');
    assert.match(auditText(c), /signalled ready to sign, but this contract is not settled/);
    assert.match(auditText(c), /1 decision sent with it was applied/);
    /* Handled, not failed: an unhandled response is re-fetched and re-applied
       by the poller on every cycle, so a claim that can never succeed would be
       retried forever. */
    assert.equal(ok, true, 'something landed, so the response is done with');
  });

  test('and a readiness claim carrying nothing at all is simply not applied', async () => {
    const { c } = await ownerProposed();
    const rec = ownerRecord();
    const ok = await rec.applyResponse(c, { v: 1, kind: 'hati-response', id: c.id, action: 'ready',
      name: 'Erik Lindqvist', negoDecisions: [], at: '2026-07-27T10:00:00Z' }, { background: true });
    assert.equal(ok, false, 'nothing true arrived with it');
    assert.equal(rec.negoReadySignal(c, 'counterparty'), null);
  });
});

/* ============================================================
   STEP 8 & 9 — the signing link, and the old one going quiet
   ============================================================ */
describe('signing arrives on a new link', () => {
  /* STEP 1 and STEP 8 meet here: the sender states what the link is for when
     they create it, and that statement is what the reader's page obeys. */
  test('the purpose the sender chose is what the payload carries', async () => {
    const { c } = await ownerProposed();
    const w = buildPortal().win;
    const who = { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' };
    assert.equal(w.buildSharePayload(c, 'h', who, { purpose: 'negotiate' }).purpose, 'negotiate');
    assert.equal(w.buildSharePayload(c, 'h', who, { purpose: 'sign' }).purpose, 'sign');
    assert.equal(w.buildSharePayload(c, 'h', who, { purpose: 'nonsense' }).purpose, 'negotiate',
      'an unrecognised purpose falls back rather than inventing a third screen');
  });

  test('and with no purpose stated it falls back to the old reading, so old links still work', async () => {
    const { c } = await ownerProposed();
    const w = buildPortal().win;
    const who = { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' };
    assert.equal(w.buildSharePayload(c, 'h', who).purpose, 'negotiate', 'changes on the table');
    assert.equal(w.buildSharePayload(contract(), 'h', who).purpose, 'sign', 'nothing proposed');
  });

  test('a withdrawal travels in the payload, so the gate reads the same on both sides', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik' });
    win.negoWithdraw(c, filed[1].id, { side: 'owner', by: 'Wanjiru Kamau' });
    const v = theirLink(c);
    assert.ok(v.payload.contract.changes.find(x => x.id === filed[1].id).withdrawn,
      'without it their copy would refuse over a point we had already let go');
    assert.equal(v.readyBtn().disabled, false);
    assert.ok(v.$(`[data-withdrawn="${filed[1].id}"]`), 'and their card says so');
  });

  test('a signing link opens on the document and the respond panel, not the room', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirLink(c, { purpose: 'sign' });
    assert.equal(v.win.portalNegoPhase(v.payload).phase, 'sign');
    assert.equal(v.$('#nego-room'), null);
    assert.ok(v.$('#pt-doc') && v.$('#pt-name'));
    assert.ok(v.$('#pt-sign'), 'the existing respond panel — no signing is built here');
  });

  test('the superseded negotiation link opens on neither the room nor a sign prompt', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c, { opts: { superseded: { at: '2026-07-27T11:00:00Z' } } });
    assert.equal(v.win.portalNegoPhase(v.payload).phase, 'read',
      'a spent copy is for reading — it can neither negotiate nor sign');
    assert.equal(v.$('#nego-room'), null);
  });

  test('and it cannot answer, even though it still opens', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c, { opts: { superseded: { at: '2026-07-27T11:00:00Z' } } });
    assert.equal(v.$('#nego-cp-ready'), null);
    assert.match(v.text(), /read-only|no longer/i);
  });
});

/* ============================================================
   IN REVERSE — a refusal, and the deadlock it would otherwise cause
   ============================================================ */
describe('the single-rejection deadlock, and the verb that clears it', () => {
  test('they refuse one of our asks; neither side can signal', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik', reply: 'Net-30 stands.' });
    assert.equal(win.negoProgress(c).pending, 0, 'every change HAS an answer');
    assert.equal(win.negoAlignment(c).aligned, false, 'and the parties still do not agree');
    assert.equal(win.negoSignalReady(c, { side: 'counterparty', by: 'Erik' }), null,
      'so nobody may signal — this is the deadlock, and it is correct until somebody moves');
  });

  test('the ask was OURS, so the withdrawal is ours to make', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik' });
    assert.equal(win.negoWithdraw(c, filed[1].id, { side: 'counterparty', by: 'Erik' }), null,
      'a side that could withdraw the OTHER side\'s ask could clear every objection to its own wording');
    assert.ok(win.negoWithdraw(c, filed[1].id, { side: 'owner', by: 'Wanjiru Kamau' }));
    assert.equal(win.negoAlignment(c).aligned, true);
    assert.ok(win.negoSignalReady(c, { side: 'owner', by: 'Wanjiru Kamau' }));
  });

  test('withdrawing keeps the refusal on the record — it is not a deletion', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik', reply: 'No.' });
    win.negoWithdraw(c, filed[1].id, { side: 'owner', by: 'Wanjiru Kamau' });
    const ch = win.negoChangeById(c, filed[1].id);
    assert.equal(ch.status, 'rejected', 'they refused it, and that stays true');
    assert.equal(ch.withdrawn.by, 'Wanjiru Kamau');
    assert.match(auditText(c), /withdrawn by Wanjiru Kamau.*accepted the refusal/);
  });

  test('the button is on the proposer\'s card, and only there', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik' });
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const d = win.document;
    assert.ok(d.querySelector(`[data-nego-withdraw="${filed[1].id}"]`), 'ours, refused — ours to withdraw');
    assert.equal(d.querySelector(`[data-nego-withdraw="${filed[0].id}"]`), null,
      'accepted asks have nothing to withdraw');
  });

  test('and it is reversible, like every other decision on this screen', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik' });
    win.negoWithdraw(c, filed[1].id, { side: 'owner', by: 'Wanjiru Kamau' });
    assert.ok(win.negoUnwithdraw(c, filed[1].id, { side: 'owner', by: 'Wanjiru Kamau' }));
    assert.equal(win.negoAlignment(c).aligned, false, 'back on the table, back to contested');
  });

  test('reopening the change drops a withdrawal that was about the old answer', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik' });
    win.negoWithdraw(c, filed[1].id, { side: 'owner', by: 'Wanjiru Kamau' });
    win.negoResolve(c, filed[1].id, 'pending', { side: 'counterparty', by: 'Erik' });
    assert.equal(win.negoChangeById(c, filed[1].id).withdrawn, null,
      'a stale acknowledgement would report agreement over a live disagreement');
  });

  test('a withdrawn ask stops being an open point', async () => {
    const { win, c } = await ownerProposed();
    const theirs = await theyProposed(c, win);
    win.negoResolve(c, theirs.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau', reply: 'No.' });
    assert.equal(win.negoOpenPoints(c).length, 1, 'refused, and still between the parties');
    win.negoWithdraw(c, theirs.id, { side: 'counterparty', by: 'Erik Lindqvist' });
    assert.equal(win.negoOpenPoints(c).length, 0, 'they let it go; saying otherwise contradicts them');
  });
});

/* THE MIRROR — we refuse one of THEIRS, and they clear it from their link. */
describe('the mirror: we refuse their ask, and they withdraw it', () => {
  test('their card carries the withdrawal on their side of the glass', async () => {
    const { win, c } = await ownerProposed([]);
    const theirs = await theyProposed(c, win);
    win.negoResolve(c, theirs.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau', reply: 'No.' });
    const v = theirLink(c);
    assert.equal(v.readyBtn().disabled, true, 'their own refused ask blocks them too');
    assert.match(v.why(), /1 of your asks refused — withdraw it or keep negotiating/);
    assert.ok(v.$(`[data-nego-withdraw="${theirs.id}"]`));
  });

  test('pressing it clears the gate and travels with the readiness signal', async () => {
    const { win, c } = await ownerProposed([]);
    const theirs = await theyProposed(c, win);
    win.negoResolve(c, theirs.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau', reply: 'No.' });
    const v = theirLink(c);
    await v.press(`[data-nego-withdraw="${theirs.id}"]`);
    assert.equal(v.readyBtn().disabled, false, 'nothing is outstanding now');
    await v.press('#nego-cp-ready');
    assert.deepEqual(Array.from(v.last().negoWithdrawn), [theirs.id],
      'a withdrawal that never left the browser is a deadlock they think they cleared');
  });

  test('the owner\'s record applies it, and only for asks that are theirs', async () => {
    const { win, c } = await ownerProposed([]);
    const theirs = await theyProposed(c, win);
    win.negoResolve(c, theirs.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
    const rec = ownerRecord();
    const res = { v: 1, kind: 'hati-response', id: c.id, action: 'ready', name: 'Erik Lindqvist',
      negoDecisions: [], negoWithdrawn: [theirs.id], at: '2026-07-27T10:00:00Z' };
    assert.equal(await rec.applyResponse(c, res, { background: true }), true);
    assert.ok(rec.negoChangeById(c, theirs.id).withdrawn);
    assert.ok(rec.negoReadySignal(c, 'counterparty'));
  });

  test('and refuses a withdrawal of one of OUR asks arriving from their link', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoResolve(c, filed[1].id, 'rejected', { side: 'counterparty', by: 'Erik' });
    const rec = ownerRecord();
    const res = { v: 1, kind: 'hati-response', id: c.id, action: 'ready', name: 'Erik Lindqvist',
      negoDecisions: [], negoWithdrawn: [filed[1].id], at: '2026-07-27T10:00:00Z' };
    assert.equal(await rec.applyResponse(c, res, { background: true }), false,
      'clearing our own objection on our behalf would let one side declare the deal aligned');
    assert.equal(rec.negoChangeById(c, filed[1].id).withdrawn, undefined);
  });
});

/* ============================================================
   The awkward cases, tested because they are where this breaks
   ============================================================ */
describe('the awkward cases', () => {
  /* THIS STAGE HAS NO ORIGIN, so every localStorage call in it throws — which
     is a fair stand-in for private browsing, a locked-down device or a full
     quota. On a browser that CAN remember, an unsent answer now survives the
     reload; see f63. What must hold either way is the line below: the page
     never claims an answer has travelled when it has not. */
  test('an unsent decision is never reported as having travelled', async () => {
    const { c, filed } = await ownerProposed();
    const v1 = theirLink(c);
    await v1.press(`[data-nego-accept="${filed[0].id}"]`);
    assert.match(v1.$('#nego-send-decisions').parentElement.textContent.replace(/\s+/g, ' '),
      /Nothing has reached .* yet/, 'the page never claims a decision has travelled');
    assert.ok(v1.$(`[data-unsent="${filed[0].id}"]`), 'and the card itself says so');
    // and where the browser cannot remember, the answer is simply not there
    const v2 = theirLink(c);
    assert.equal(v2.$('#nego-send-decisions'), null,
      'nothing half-answered is left behind claiming to be ready to send');
    assert.equal(v2.$(`[data-nego-accept="${filed[0].id}"]`) != null, true,
      'the change is an open question again rather than a silent half-answer');
  });

  /* The send succeeds, the room repaints — and the room repaints from a payload
     snapshotted before the decisions existed. Without remembering them, every
     card went back to "pending" with Accept and Reject on it a moment after
     they had answered and sent, which reads as the send having done nothing. */
  test('sent decisions stay answered on their screen, and say they were sent', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    await v.press('#nego-bulk-acc');
    await v.press('#nego-send-decisions');
    assert.equal(v.last().action, 'decisions');
    for (const f of filed){
      assert.ok(v.$(`[data-sent="${f.id}"]`), `#${f.id} must still read as answered and sent`);
      assert.equal(v.$(`[data-nego-undo="${f.id}"]`), null,
        'and it is not theirs to un-decide — the other side is holding that answer');
    }
    assert.equal(v.$('#nego-send-decisions'), null, 'with nothing left waiting to go');
  });

  /* Still allowed, and now a DELIBERATE act rather than the default state of
     the card. Accept and Reject used to stay on a sent decision, so pressing
     Send made the verbs reappear a moment later and there was no way to tell
     from the card whether anything had gone — while the owner's copy of the
     same change settled. See f59: the two sides render the same. */
  test('but changing their mind is still allowed, behind Change decision', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    await v.press('#nego-bulk-acc');
    await v.press('#nego-send-decisions');
    assert.equal(v.$(`[data-nego-reject="${filed[0].id}"]`), null,
      'a sent decision is a decision, not a question still on the table');

    await v.press(`[data-nego-redecide="${filed[0].id}"]`);
    v.win.promptDialog = async () => 'On reflection, no.';
    await v.press(`[data-nego-reject="${filed[0].id}"]`);
    assert.ok(v.$('#nego-send-decisions'), 'a new answer is a new thing to send');
    await v.press('#nego-send-decisions');
    const d = v.last().negoDecisions.find(x => x.id === filed[0].id);
    assert.equal(d.status, 'rejected');
  });

  test('a refresh AFTER sending shows the decisions as filed, from the payload', async () => {
    const { win, c, filed } = await ownerProposed();
    // what applyResponse did on the owner's side is what the next payload carries
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirLink(c);
    assert.equal(v.$(`[data-nego-accept="${filed[0].id}"]`), null, 'answered, and it stays answered');
    assert.equal(v.readyBtn().disabled, false);
  });

  test('reopening the link after signalling readiness still opens the room', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoSignalReady(c, { side: 'counterparty', by: 'Erik Lindqvist' });
    const v = theirLink(c);
    assert.ok(v.$('#nego-room'), 'until a signing link exists, this link is what they have');
    assert.ok(v.$('#nego-ready-signal'), 'and it tells them where the deal stands');
    const banner = v.$('#nego-ready-signal').textContent.replace(/\s+/g, ' ');
    assert.match(banner, /You signalled ready to sign/);
    assert.match(banner, /will send a signing link when they are ready/,
      'and what happens next, which is not theirs to do');
  });

  test('Decline is available at every stage, including with everything outstanding', async () => {
    const { win, c, filed } = await ownerProposed();
    const fresh = theirLink(c);
    assert.ok(fresh.$('#nego-cp-decline') && !fresh.$('#nego-cp-decline').disabled,
      'ending a deal has no per-change equivalent and no precondition');
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const mid = theirLink(c);
    assert.ok(!mid.$('#nego-cp-decline').disabled);
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const done = theirLink(c);
    assert.ok(!done.$('#nego-cp-decline').disabled);
  });

  /* Declining requires a reason, and the box it was read from is on the page
     UNDERNEATH the room — the same trap that made the name check unpassable.
     The requirement is right; what was missing was anywhere to satisfy it. */
  test('declining from the room asks for the reason IN the room', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    const asked = [];
    v.win.promptDialog = async o => { asked.push(o); return 'The liability cap is below our board mandate.'; };
    await v.press('#nego-cp-decline');
    assert.equal(asked.length, 1, 'it must ask, not fail on a field they cannot reach');
    assert.match(asked[0].message, /ends the negotiation/);
    assert.equal(v.last().action, 'decline');
    assert.equal(v.last().comment, 'The liability cap is below our board mandate.');
  });

  test('cancelling the prompt sends nothing at all', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    v.win.promptDialog = async () => null;
    await v.press('#nego-cp-decline');
    assert.equal(v.last(), null, 'ending a deal must not be one misplaced click away');
  });

  test('and an empty reason is refused, because a refusal nobody understands comes back', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c);
    v.win.promptDialog = async () => '   ';
    await v.press('#nego-cp-decline');
    assert.equal(v.last(), null);
    assert.match(v.toasts(), /A reason is required to decline/);
  });

  /* A signal describes a change set at a moment. Reopen something after it and
     it stays a true record of what was said and stops being a true description
     of where the deal is. */
  test('a signal the change set has moved past is marked stale, not deleted', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoSignalReady(c, { side: 'counterparty', by: 'Erik Lindqvist' });
    assert.equal(win.negoReadySignal(c, 'counterparty').stale, false);
    win.negoResolve(c, filed[0].id, 'pending', { side: 'counterparty', by: 'Erik' });
    const sig = win.negoReadySignal(c, 'counterparty');
    assert.ok(sig, 'they said it, and that stays on the record');
    assert.equal(sig.stale, true, 'and it no longer describes where the deal stands');
  });

  test('a stale signal withdraws the invitation to issue a signing link', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    win.negoSignalReady(c, { side: 'counterparty', by: 'Erik Lindqvist' });
    win.negoResolve(c, filed[0].id, 'pending', { side: 'counterparty', by: 'Erik' });

    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const box = win.document.getElementById('nego-ready-signal');
    assert.ok(box, 'still shown — hiding it would lose the fact they said it');
    assert.match(box.textContent.replace(/\s+/g, ' '), /no longer describes where the deal stands/);
    assert.equal(win.document.getElementById('nego-issue-signing'), null,
      'and the next step is not offered for a contract that has gone back into negotiation');

    const cv = buildWorld({ contractView: true }).win;
    const strip = cv.readyToSignStrip(c);
    assert.match(strip, /data-stale="1"/);
    assert.ok(!/Issue a signing link/.test(strip));

    const hv = buildWorld({ homeView: true }).win;
    assert.equal(hv.readyToSignItems([c]).length, 0,
      'and it drops off a list whose one instruction is "issue a signing link"');
  });

  /* A send that did not happen must not look like one that did. This is the
     failure the whole session is about, in its most direct form. */
  test('a failed send says so, and keeps the decisions to try again', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    v.win.api = async () => { throw new Error('Network unreachable'); };
    await v.press('#nego-bulk-acc');
    await v.press('#nego-send-decisions');
    assert.match(v.toasts(), /Network unreachable/);
    assert.ok(v.$('#nego-send-decisions'), 'the decisions are still there to send');
    for (const f of filed)
      assert.equal(v.$(`[data-sent="${f.id}"]`), null, 'and nothing is marked as having travelled');
  });

  test('a failed readiness signal leaves the button pressable', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirLink(c);
    v.win.api = async () => { throw new Error('Network unreachable'); };
    await v.press('#nego-cp-ready');
    assert.match(v.toasts(), /Network unreachable/);
    assert.equal(v.readyBtn().disabled, false, 'they must be able to try again');
    assert.match(v.readyBtn().textContent, /Ready to sign/, 'and it must not claim to have been sent');
  });

  /* A screen with no verbs and no explanation is a screen someone hunts for a
     button on. Each of the three ways a copy goes read-only is a different fact
     about their link, and the room says which. */
  test('a copy with no channel back offers no verbs, and says why', async () => {
    const { win, c, filed } = await ownerProposed();
    for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const v = theirLink(c, { opts: { token: null } });
    assert.equal(v.$('#nego-cp-ready'), null);
    assert.match(v.$('#nego-readonly-why').textContent, /no channel back/);
  });

  test('and a superseded one says THAT, rather than the same shrug', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c, { purpose: 'sign', opts: { superseded: { at: '2026-07-27T11:00:00Z' } } });
    /* Superseded lands on the reading view, so the room is reached from
       "Review what changed" — and it too must account for itself. */
    v.$('#pt-nego-open')?.dispatchEvent(new v.win.Event('click', { bubbles: true }));
    const why = v.$('#nego-readonly-why');
    if (why) assert.match(why.textContent, /superseded/);
    else assert.match(v.text(), /read-only|no longer|superseded/i);
  });

  test('a read-only copy offers no verbs, and the room does not open over it', async () => {
    const { c } = await ownerProposed();
    const v = theirLink(c, { opts: { responded: true } });
    assert.equal(v.$('#nego-room'), null);
    assert.equal(v.$('#nego-cp-ready'), null);
  });
});

/* ============================================================
   The wire, against the real server
   ============================================================ */
describe('the response route, against the real server', () => {
  let h, W;
  const DOC = 'WORDING v1';
  const payload = (id, purpose) => ({
    v: 1, kind: 'hati-share', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
    at: new Date().toISOString(), docHash: 'h1', purpose,
    contract: { id, name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
      template: 'RM', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } });
  const mk = (id, purpose, over = {}) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: payload(id, purpose), channel: 'link', purpose,
    recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30, ...over } });

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    for (const id of ['MK-J1', 'MK-J2', 'MK-J3', 'MK-J4']) {
      const c = fixtureContract(id, 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review');
      await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    }
  });
  after(async () => { await h.stop(); });

  /* THE THIRD FAULT behind "Send did nothing", and the quietest: the portal had
     been posting action:'decisions' for a whole release, and this whitelist did
     not contain it. Every batch of per-change answers came back 400. */
  test('a decisions response is accepted, where it used to be 400 Invalid response', async () => {
    const s = await mk('MK-J1', 'negotiate', { durable: true });
    const r = await W.admin.raw('/api/shares/' + s.token + '/respond', { method: 'POST',
      body: { v: 1, kind: 'hati-response', id: 'MK-J1', action: 'decisions', name: 'Erik Lindqvist',
        negoDecisions: [{ id: 'CHG-001', status: 'accepted' }], at: new Date().toISOString() } });
    assert.equal(r.status, 200, r.json && r.json.error);
  });

  test('a readiness response is accepted too, and carries its decisions with it', async () => {
    const s = await mk('MK-J1', 'negotiate', { durable: true });
    const r = await W.admin.raw('/api/shares/' + s.token + '/respond', { method: 'POST',
      body: { v: 1, kind: 'hati-response', id: 'MK-J1', action: 'ready', name: 'Erik Lindqvist',
        negoDecisions: [{ id: 'CHG-001', status: 'accepted' }], at: new Date().toISOString() } });
    assert.equal(r.status, 200, r.json && r.json.error);
    const pending = await W.admin.json('/api/shares/pending');
    assert.ok(pending.some(x => x.response && x.response.action === 'ready'),
      'and it reaches the owner through the route that already existed');
  });

  test('the link remembers what it is for', async () => {
    const s = await mk('MK-J2', 'negotiate');
    const got = await W.admin.json('/api/shares/' + s.token);
    assert.equal(got.payload.purpose, 'negotiate');
    const list = await W.admin.json('/api/contracts/MK-J2/shares');
    assert.equal(list.shares[0].purpose, 'negotiate');
  });

  /* Supersession, using the mechanism already in place. The wording is
     IDENTICAL at this moment — that is the point, the parties agreed on it — so
     the existing text comparison would have left both links live. */
  test('issuing a signing link supersedes the negotiation link it replaces', async () => {
    const nego = await mk('MK-J3', 'negotiate');
    let got = await W.admin.json('/api/shares/' + nego.token);
    assert.equal(got.superseded, null, 'live, on its own');
    await mk('MK-J3', 'sign');
    got = await W.admin.json('/api/shares/' + nego.token);
    assert.ok(got.superseded, 'the negotiation is over; this link no longer speaks for the deal');
    assert.equal(got.superseded.reason, 'signing-link-issued');
  });

  test('a superseded negotiation link still OPENS, and can no longer answer', async () => {
    const nego = await mk('MK-J4', 'negotiate');
    await mk('MK-J4', 'sign');
    const open = await W.admin.raw('/api/shares/' + nego.token);
    assert.equal(open.status, 200, 'they are entitled to see what they were sent');
    const r = await W.admin.raw('/api/shares/' + nego.token + '/respond', { method: 'POST',
      body: { v: 1, kind: 'hati-response', id: 'MK-J4', action: 'ready', name: 'Erik Lindqvist',
        negoDecisions: [], at: new Date().toISOString() } });
    assert.equal(r.status, 409);
    assert.match(r.json.error, /signing link was issued/);
  });

  test('and a DURABLE negotiation link is retired the same way', async () => {
    const nego = await mk('MK-J2', 'negotiate', { durable: true });
    await mk('MK-J2', 'sign');
    const got = await W.admin.json('/api/shares/' + nego.token);
    assert.ok(got.superseded,
      'a durable link is exempt from the WORDING rule because it is refreshed in place; '
      + 'purpose is not something refreshing can fix');
  });

  test('the signing link itself is not superseded by the negotiation link it replaced', async () => {
    const signing = await mk('MK-J3', 'sign');
    const got = await W.admin.json('/api/shares/' + signing.token);
    assert.equal(got.superseded, null);
  });
});
