#!/usr/bin/env node
/* ============================================================
   COLLISION SWEEP — C8: A COUNTER LANDS ON A CHANGE THAT IS OUT FOR REVIEW
   ============================================================
   THE COLLISION, and both acts are allowed:

     · WE file an ask on clause 3 and send it to a colleague by name
       (js/review.js reviewAsk). It sits with them, undecided.
     · THE COUNTERPARTY files their own proposal on the SAME clause. Since the
       "one proposal on the table" rule merged (15 Aug 2026), negoFileChange
       steps our ask down to `superseded` the moment their counter lands.

   The change the reviewer was asked about leaves the table while they are
   holding it. This interaction was CREATED by that fix; nothing existed to
   probe before it.

   WHAT IS STAGED, AND WHERE:
     · the browser-shaped stage (test/world.js) for BOTH chairs — the requester
       and the reviewer each get their own window with their own signed-in
       person, and every reading is the product's own function, not a copy
     · a REAL server (test/helpers.js) for the structural guards, the send wall
       on POST /api/shares, and the verdict guard on PUT /api/contracts/:id

   EVERY ARMED STATE IS READ BACK BEFORE ANYTHING IS JUDGED — the review's id
   and status, the change's status, the supersession's two links, the version
   the server holds. An attack that fails to arm reads exactly like one that
   succeeds.

   Run:  node test/audit/collisions/c8-counter-lands-on-a-review.js
*/
const { startHati, seedWorkspace } = require('../../helpers');
const { buildWorld } = require('../../world');

let pass = 0, fail = 0;
const P = (ok, msg, extra) => {
  if (ok) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '\n        ' + extra : '')); }
};
const NOTE = m => console.log('  ·   ' + m);
const HEAD = m => console.log('\n=== ' + m + ' ===');
const clone = o => JSON.parse(JSON.stringify(o));
const text = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const BODY =
  '<h1>Mutual Non-Disclosure Agreement</h1><p>Between Highland Corporate Ltd and Juno Limited.</p>'
  + '<h2>1 · Purpose</h2><p>The purpose is evaluation of a possible transaction.</p>'
  + '<h2>2 · Term</h2><p>This agreement runs for two (2) years.</p>'
  + '<h2>3 · Confidentiality</h2><p>Each party keeps the other information secret.</p>'
  + '<h2>4 · Governing law</h2><p>This agreement is governed by the laws of Kenya.</p>';

/* The three people. REQ raises the ask and asks for a review; REV is the
   colleague asked by name; BOSS is an uninvolved admin (the visibility walk). */
const REQ  = { id: 'u_req', name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@example.co.ke' };
const REV  = { id: 'u_rev', name: 'Achieng Otieno', role: 'legal', email: 'achieng@example.co.ke' };
const BOSS = { id: 'u_adm', name: 'Amina Otieno',   role: 'admin', email: 'admin@example.co.ke' };
const TEAM = [REQ, REV, BOSS];

function world(user, over = {}) {
  const w = buildWorld({ user, negotiationView: true, contractView: true });
  w.win.state = { settings: Object.assign({}, over.settings), contracts: [] };
  w.win.getUsers = () => TEAM;
  w.win.userById = id => TEAM.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  for (const k of ['persist', 'saveContract', 'renderWorkspace', 'renderRedline', 'setView'])
    w.win[k] = () => {};
  return w;
}

const contract = (id) => ({
  id, name: 'Mutual NDA', counterparty: 'Juno Limited', party: 'Highland Corporate Ltd',
  status: 'Under Review', folder: 'proc', template: 'ND', value: 0, valueType: 'none',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [],
  comments: [], obligations: [], expiry: '2027-06-30',
  redlineText: BODY, format: 'rich',
});

const chOf = (c, id) => (c.changes || []).find(x => x.id === id) || null;

/* File one ask on a numbered clause, through the real funnel. */
async function ask(win, c, num, body, opts) {
  const cl = win.negoClauseList(c).find(x => String(x.num) === String(num));
  if (!cl) throw new Error('harness: no clause ' + num + ' on the fixture');
  return win.negoEditClause(c, cl.clauseId, body, Object.assign({ side: 'owner' }, opts));
}
/* Their counter on the same clause, arriving down their link (so `via` is set
   and the funnel does not stamp an enteredBy — this really is their wording). */
async function counter(win, c, num, body) {
  const cl = win.negoClauseList(c).find(x => String(x.num) === String(num));
  const newText = win.richToText ? win.richToText(body) : body;
  return win.negoFileChange(c, {
    clauseId: cl.clauseId, changeType: 'modify', oldText: cl.text, newText,
    bodyHtml: body, clauseLabel: cl.label || null,
  }, { side: 'counterparty', author: 'Juno Limited', via: 'their negotiation link' });
}

async function putContract(client, c, baseVersion) {
  const body = clone(c);
  for (const k of ['_v', '_light', '_loaded', '_persisted', '_raisedBy', '_raisedAt',
    '_signedAt', '_lastAuditAt', '_chainVerify']) delete body[k];
  return client.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: body, baseVersion } });
}

(async () => {
  const h = await startHati();
  try {
    /* ================================================================
       PART 1 — THE BROWSER STAGE: BOTH CHAIRS
       ================================================================ */
    HEAD('ARM — our ask is filed and a colleague is asked by name');
    const wReq = world(REQ);
    const wRev = world(REV);
    const wAdm = world(BOSS);
    const c = contract('MK-C8');
    wReq.win.negoInit(c);

    const A = await ask(wReq.win, c, '3',
      '<p>Each party keeps the other information secret for five (5) years.</p>',
      { author: REQ.name, summary: 'five-year confidentiality tail' });
    P(!!A && A.status === 'pending' && A.authorSide === 'owner',
      `armed: our ask ${A && A.id} is pending on ${A && A.clauseId} (${A && A.clauseLabel})`);
    const ASK = A.id;

    const unsent0 = wReq.win.negoUnsentAsks(c, 'owner').map(x => x.id);
    P(unsent0.length === 1 && unsent0[0] === ASK,
      `armed: ${ASK} counts as UNSENT (negoUnsentAsks → ${JSON.stringify(unsent0)})`);

    const rv = wReq.win.reviewAsk(c, { reviewer: REV, ids: [ASK], note: 'Is five years defensible?' });
    P(!!rv && rv.status === 'open' && rv.reviewer.name === REV.name
      && rv.changeIds.length === 1 && String(rv.changeIds[0]) === ASK,
      `armed: review ${rv && rv.id} OPEN with ${rv && rv.reviewer.name}, covering ${JSON.stringify(rv && rv.changeIds)}`);
    const RVID = rv.id;

    P(wReq.win.reviewOpenList(c).length === 1 && !wReq.win.reviewSpent(c, rv),
      'armed: reviewOpenList sees exactly one open review and it is NOT spent');

    /* --- the reviewer's chair, before the collision --- */
    const heldBefore = wRev.win.reviewActorHeld(c);
    const mineBefore = wRev.win.reviewMyChangeIds(c);
    const stRevBefore = wRev.win.reviewState(c);
    P(!!heldBefore && heldBefore.length === 1 && !!mineBefore && mineBefore.has(ASK)
      && stRevBefore.phase === 'yours',
      `armed (reviewer's chair): narrowed — reviewActorHeld=[${heldBefore && heldBefore.map(r => r.id)}], `
      + `reviewMyChangeIds={${mineBefore ? [...mineBefore].join(',') : 'null'}}, phase='${stRevBefore.phase}'`);
    const bannerRevBefore = wRev.win.reviewBannerHtml(c, { side: 'owner' });
    P(/CHG-|verdict|review/i.test(text(bannerRevBefore)) && text(bannerRevBefore).length > 0,
      'armed (reviewer\'s chair): the banner draws a row — "' + text(bannerRevBefore).slice(0, 110) + '"');
    const inboxBefore = wRev.win.reviewInboxFor([c], REV);
    P(inboxBefore.length === 1,
      `armed (reviewer's chair): the contract sits on their desk (reviewInboxFor → ${inboxBefore.length})`);
    const cardsRevBefore = wRev.win.redlineChangeCardsHtml(c, { side: 'owner' });
    P(cardsRevBefore.indexOf(ASK) >= 0,
      `armed (reviewer's chair): ${ASK} is drawn in their narrowed column`);
    const withheldBefore = [...wReq.win.reviewWithheldIds(c)];
    P(withheldBefore.length === 1 && withheldBefore[0] === ASK,
      `armed: the ask is withheld from any send while it is out (reviewWithheldIds → ${JSON.stringify(withheldBefore)})`);

    /* --- the shape the work order describes, and why it is not the reachable
           one: a SENT ask cannot be put into a review at all --- */
    HEAD('BOUNDARY — "filed and sent" cannot be the armed state; reviewScope only offers UNSENT asks');
    {
      const wX = world(REQ);
      const cx = contract('MK-C8X');
      wX.win.negoInit(cx);
      const ax = await ask(wX.win, cx, '3', '<p>Secret for five (5) years.</p>', { author: REQ.name });
      cx.negotiation.turnAt = new Date(Date.now() + 1000).toISOString();   // the round has gone
      const unsentX = wX.win.negoUnsentAsks(cx, 'owner').map(x => x.id);
      P(unsentX.length === 0,
        `armed: with a turn stamp after the ask, ${ax.id} is no longer unsent (negoUnsentAsks → [])`);
      wX.log.toasts.length = 0;
      const rvx = wX.win.reviewAsk(cx, { reviewer: REV, ids: [ax.id] });
      P(rvx === null && /nothing/i.test(wX.toastText()),
        'UNREACHABLE: a sent ask cannot be reviewed — reviewAsk refuses in words: "'
        + wX.toastText() + '"');
      NOTE('so the only reachable arming of C8 is an UNSENT ask out for review, which is what is staged above');
    }

    /* --- THE COLLISION --- */
    HEAD('COLLISION — their counter lands on the same clause');
    wReq.log.toasts.length = 0;
    const auditBefore = (c.audit || []).length;
    const B = await counter(wReq.win, c, '3',
      '<p>Each party keeps the other information secret for two (2) years.</p>');
    const askAfter = chOf(c, ASK);
    P(!!B && B.authorSide === 'counterparty' && askAfter.status === 'superseded'
      && String(askAfter.supersededBy) === String(B.id) && String(B.counterOf) === String(ASK),
      `armed: ${B && B.id} took the table — ${ASK}.status='${askAfter.status}', `
      + `supersededBy=${askAfter.supersededBy}, ${B && B.id}.counterOf=${B && B.counterOf}`);
    const COUNTER = B.id;

    P(wReq.win.reviewInPlay(c, rv).length === 0 && wReq.win.reviewSpent(c, rv) === true,
      'armed: the review is now SPENT (reviewInPlay → 0, reviewSpent → true) while rv.status is still "'
      + rv.status + '"');

    /* ================================================================
       PART 2 — WAS ANYBODY TOLD
       ================================================================ */
    HEAD('THE REQUESTER\'S CHAIR — they asked a colleague and the question evaporated');
    const toastsReq = wReq.log.toasts.map(t => t.msg);
    NOTE('toasts in the requester\'s browser as the counter landed: ' + JSON.stringify(toastsReq));
    P(toastsReq.some(m => /set aside|took the table/i.test(m)),
      'the owner IS told their unsent draft was set aside (ng_draft_superseded)');
    P(!toastsReq.some(m => new RegExp(REV.name, 'i').test(m) || /review/i.test(m)),
      'NOT SAID: no toast mentions the review or the colleague holding it — the one sentence '
      + 'the requester gets is about their DRAFT, not about the person they asked',
      JSON.stringify(toastsReq));

    const newAudit = (c.audit || []).slice(auditBefore).map(e => `${e.action}: ${e.detail}`);
    NOTE('audit lines written by the collision:\n        ' + newAudit.join('\n        '));
    P(newAudit.some(l => /supersedes/.test(l)),
      'the supersession is on the record and names both changes');
    P(!newAudit.some(l => /internal review|REV-/i.test(l)),
      'NOT SAID: no audit line records that ' + RVID + ' was overtaken — the trail says the ask '
      + 'was superseded and says nothing about the review it was sitting in',
      JSON.stringify(newAudit));

    const stReqAfter = wReq.win.reviewState(c);
    const bannerReqAfter = wReq.win.reviewBannerHtml(c, { side: 'owner' });
    P(stReqAfter.phase === 'none' && stReqAfter.open.length === 0 && text(bannerReqAfter) === '',
      `the requester's banner row is gone with no farewell: phase='${stReqAfter.phase}', `
      + `open=${stReqAfter.open.length}, banner=${JSON.stringify(text(bannerReqAfter))}`);

    wReq.log.toasts.length = 0;
    const cancelled = wReq.win.reviewCancel(c, {});
    P(cancelled === null,
      'the requester can no longer CANCEL the review they raised (reviewCancel → null)');
    P(wReq.toastText() === '',
      'AND THE REFUSAL IS SILENT: reviewCancel returns null with no toast at all '
      + '(the "which review?" message is only reached when more than one is open)',
      JSON.stringify(wReq.log.toasts));
    P(wReq.win.reviewCardCancelHtml(c, chOf(c, ASK), { side: 'owner' }) === ''
      && wReq.win.reviewCardCancelHtml(c, chOf(c, COUNTER), { side: 'owner' }) === '',
      'EVERY PRESS LANDS, by absence: the card Cancel is not drawn on either change afterwards, so '
      + 'the silent refusal above is a dead end in the model rather than a dead button on a screen');

    HEAD('THE REVIEWER\'S CHAIR — the clause left the table while they held it');
    const heldAfter = wRev.win.reviewActorHeld(c);
    const mineAfter = wRev.win.reviewMyChangeIds(c);
    const stRevAfter = wRev.win.reviewState(c);
    P(heldAfter === null && mineAfter === null,
      'the narrowing IS lifted correctly: reviewActorHeld → null, reviewMyChangeIds → null '
      + '(they get the whole round back)');
    P(stRevAfter.phase === 'none' && wRev.win.reviewOpenList(c).length === 0,
      `their posture is now phase='${stRevAfter.phase}' with 0 open reviews`);
    const bannerRevAfter = wRev.win.reviewBannerHtml(c, { side: 'owner' });
    P(text(bannerRevAfter) === '',
      'their banner row simply vanishes — nothing says the job was overtaken: banner='
      + JSON.stringify(text(bannerRevAfter)));
    const inboxAfter = wRev.win.reviewInboxFor([c], REV);
    P(inboxAfter.length === 0,
      'the contract leaves their dashboard desk silently (reviewInboxFor → 0)');
    const cardsRevAfter = wRev.win.redlineChangeCardsHtml(c, { side: 'owner' });
    const cardOf = (html, id) => html.indexOf(`data-nego-card="${id}"`) >= 0;
    P(!cardOf(cardsRevAfter, ASK) && cardOf(cardsRevAfter, COUNTER),
      `their column empties of ${ASK} and now shows the counter ${COUNTER} instead — the card they `
      + 'were asked to rule on is gone from the screen with no marker',
      `cards drawn: ${(cardsRevAfter.match(/data-nego-card="[^"]+"/g) || []).join(', ')}`);
    P(/Counters\s*#?CHG-001/i.test(text(cardsRevAfter)),
      'PARTIAL MITIGATION: the counter\'s own card carries the "Counters #' + ASK + '" line, so the id '
      + 'is on screen — but it says nothing about a review, and reads identically to every other '
      + 'counter on the contract');

    wRev.log.toasts.length = 0;
    const marked = wRev.win.reviewMark(c, ASK, 'held', { note: 'too long' });
    P(marked === null && /no internal review is open/i.test(wRev.toastText()),
      'a verdict can no longer be recorded: reviewMark → null, "' + wRev.toastText() + '"');

    wRev.log.toasts.length = 0;
    const returned = wRev.win.reviewReturn(c, {});
    P(returned === null && /no internal review is open/i.test(wRev.toastText()),
      'AND THEY CANNOT HAND BACK: reviewReturn → null, "' + wRev.toastText() + '" — so '
      + RVID + ' stays status="' + rv.status + '" on the record for ever');
    P(rv.status === 'open',
      `one question, one answer: the stored review still reads status='${rv.status}' although every `
      + 'screen has stopped drawing it and nobody can close it');

    /* what the toolbar's one review button now offers the reviewer */
    P(wRev.win.reviewState(c).phase !== 'yours',
      'the toolbar\'s review button reads reviewState().phase — no longer "yours", so it silently '
      + 'stops being a hand-back door and becomes "ask for a review" instead');

    /* the reviewer's own browser, if it is the one that applies the inbound counter */
    HEAD('THE REVIEWER\'S OWN BROWSER, applying the same counter');
    {
      const wR2 = world(REV);
      const c2 = contract('MK-C8B');
      wR2.win.negoInit(c2);
      const a2 = await ask(wR2.win, c2, '3', '<p>Secret for five (5) years.</p>', { author: REQ.name });
      const rv2 = wR2.win.reviewAsk(c2, { reviewer: REV, by: REQ.name, byId: REQ.id, ids: [a2.id] });
      P(!!rv2 && wR2.win.reviewActorHeld(c2) !== null,
        `armed: ${rv2 && rv2.id} open with ${REV.name}, who is narrowed on this contract`);
      wR2.log.toasts.length = 0;
      await counter(wR2.win, c2, '3', '<p>Secret for two (2) years.</p>');
      const t2 = wR2.log.toasts.map(x => x.msg);
      NOTE('toasts in the REVIEWER\'s browser: ' + JSON.stringify(t2));
      P(t2.some(m => /your unsent draft/i.test(m)),
        'the reviewer gets the same sentence, and it calls the ask "YOUR unsent draft" — it was '
        + REQ.name + '\'s ask, handed to them to rule on',
        JSON.stringify(t2));
      P(!t2.some(m => /review/i.test(m)),
        'nothing tells the reviewer that the thing they were asked to rule on is what just went');
    }

    /* ================================================================
       PART 3 — DOES A HELD VERDICT LEAK
       ================================================================ */
    HEAD('A HELD VERDICT ON A SUPERSEDED CHANGE — does it still block a send');
    const wReq3 = world(REQ);
    const wRev3 = world(REV);
    const c3 = contract('MK-C8H');
    wReq3.win.negoInit(c3);
    const a3 = await ask(wReq3.win, c3, '3', '<p>Secret for five (5) years.</p>', { author: REQ.name });
    const b3 = await ask(wReq3.win, c3, '2', '<p>This agreement runs for three (3) years.</p>', { author: REQ.name });
    const rv3 = wReq3.win.reviewAsk(c3, { reviewer: REV, ids: [a3.id] });
    const held3 = wRev3.win.reviewMark(c3, a3.id, 'held', { note: 'five years is too long to promise' });
    P(!!held3 && held3.review.verdict === 'held' && held3.review.by === REV.name,
      `armed: ${a3.id} is HELD by ${REV.name} in ${rv3.id} (verdict recorded on the change)`);
    const heldIds3 = [...wReq3.win.reviewHeldIds(c3)];
    P(heldIds3.length === 1 && heldIds3[0] === a3.id,
      `armed: reviewHeldIds → ${JSON.stringify(heldIds3)} — the hold is real and the send would strip it`);
    const sendable3before = wReq3.win.reviewSendable(c3).map(x => x.id);
    P(sendable3before.length === 1 && sendable3before[0] === b3.id,
      `armed: only ${b3.id} would travel (reviewSendable → ${JSON.stringify(sendable3before)})`);

    const b3c = await counter(wReq3.win, c3, '3', '<p>Secret for two (2) years.</p>');
    P(chOf(c3, a3.id).status === 'superseded' && !!chOf(c3, a3.id).review
      && chOf(c3, a3.id).review.verdict === 'held',
      `collision armed: ${a3.id} is superseded by ${b3c.id} AND still carries the held verdict on its record`);
    const heldIds3after = [...wReq3.win.reviewHeldIds(c3)];
    const withheld3after = [...wReq3.win.reviewWithheldIds(c3)];
    P(heldIds3after.length === 0 && withheld3after.length === 0,
      `SOUND: the dead hold does not leak — reviewHeldIds → ${JSON.stringify(heldIds3after)}, `
      + `reviewWithheldIds → ${JSON.stringify(withheld3after)} (negoPending drops 'superseded', so a `
      + 'verdict on a change that left the table cannot block anything)');
    const sendable3after = wReq3.win.reviewSendable(c3).map(x => x.id);
    P(sendable3after.length === 1 && sendable3after[0] === b3.id,
      `and the send is exactly as free as it should be: reviewSendable → ${JSON.stringify(sendable3after)}`);

    HEAD('THE ORDINARY SEQUENCE — ask · review · PUBLISH THE ROUND · their counter');
    /* The staging above never published a round, so the ask was still "unsent"
       when the counter landed and the ng_draft_superseded toast could fire. The
       ordinary sequence is not that: you redline, you send the round for review,
       you PUBLISH what is clear, and their answer comes back. Publishing calls
       negoHandOver, which stamps negotiation.turnAt — and negoUnsentAsks
       measures createdAt against that stamp, so an ask that was HELD BACK from
       the publish still stops counting as unsent. */
    {
      const wq = world(REQ);
      const wr = world(REV);
      const cs = contract('MK-C8T');
      wq.win.negoInit(cs);
      const s1c = await ask(wq.win, cs, '3', '<p>Secret for five (5) years.</p>', { author: REQ.name });
      const s2c = await ask(wq.win, cs, '2', '<p>This agreement runs for three (3) years.</p>', { author: REQ.name });
      const rvs = wq.win.reviewAsk(cs, { reviewer: REV, ids: [s1c.id] });
      P(!!rvs && [...wq.win.reviewWithheldIds(cs)].join() === s1c.id,
        `armed: ${s1c.id} out for review with ${REV.name} and withheld from the send; ${s2c.id} free`);

      const handed = wq.win.negoHandOver(cs, { to: 'counterparty', by: REQ.name });
      P(!!handed && !!cs.negotiation.turnAt,
        `armed: the round is PUBLISHED — negoHandOver stamped turnAt=${cs.negotiation.turnAt}`);
      P(chOf(cs, s1c.id).status === 'pending' && wq.win.reviewOpenList(cs).length === 1
        && wr.win.reviewActorHeld(cs) !== null,
        `armed: ${s1c.id} is STILL pending, ${rvs.id} is STILL open, and ${REV.name} is still narrowed `
        + '— publishing did not send it, the wall held');

      const unsentNow = wq.win.negoUnsentAsks(cs, 'owner').map(x => x.id);
      P(unsentNow.length === 0,
        `SIDE EFFECT OF THE TURN STAMP: negoUnsentAsks → ${JSON.stringify(unsentNow)} — the ask that was `
        + 'held back now reads as sent, because unsent is measured against turnAt and its createdAt is older');
      const withheldNow = [...wq.win.reviewWithheldIds(cs)];
      P(withheldNow.length === 0,
        `AND THE HOLD STOPS HOLDING: reviewWithheldIds → ${JSON.stringify(withheldNow)} — a change the `
        + 'counterparty has never seen is no longer withheld from the NEXT send, although the review is '
        + 'still open on it. Pre-existing (turnAt, not the redlines fix), but it decides what C8 does next.');

      wq.log.toasts.length = 0; wr.log.toasts.length = 0;
      await counter(wq.win, cs, '3', '<p>Secret for two (2) years.</p>');
      P(chOf(cs, s1c.id).status === 'superseded' && wq.win.reviewSpent(cs, rvs) === true,
        `collision armed: ${s1c.id} superseded, ${rvs.id} spent`);
      P(wq.toastText() === '' && wr.toastText() === '',
        'THE SHARPEST FORM OF THE FINDING: in the ordinary sequence NOBODY is told anything at all — '
        + `no toast in the requester's browser (${JSON.stringify(wq.log.toasts.map(t => t.msg))}) and none `
        + `in the reviewer's (${JSON.stringify(wr.log.toasts.map(t => t.msg))}), because `
        + 'ng_draft_superseded is gated on the ask still being unsent',
        JSON.stringify({ requester: wq.log.toasts, reviewer: wr.log.toasts }));
      const aud = (cs.audit || []).map(e => e.detail).slice(-3);
      P(aud.some(d => /supersedes/.test(d)) && !aud.some(d => /internal review/i.test(d)),
        'the only trace is the ordinary supersession line; the review is not mentioned',
        JSON.stringify(aud));
      P(text(wr.win.reviewBannerHtml(cs, { side: 'owner' })) === ''
        && wr.win.reviewInboxFor([cs], REV).length === 0
        && wr.win.reviewActorHeld(cs) === null,
        'and the reviewer\'s row, desk entry and narrowing all end in the same silence');
    }

    HEAD('PARTIAL SPEND — a review of TWO clauses loses ONE of them');
    {
      const wq = world(REQ);
      const wr = world(REV);
      const cp = contract('MK-C8P');
      wq.win.negoInit(cp);
      const p1 = await ask(wq.win, cp, '3', '<p>Secret for five (5) years.</p>', { author: REQ.name });
      const p2 = await ask(wq.win, cp, '2', '<p>This agreement runs for three (3) years.</p>', { author: REQ.name });
      const rvp = wq.win.reviewAsk(cp, { reviewer: REV, ids: [p1.id, p2.id] });
      const prog0 = wq.win.reviewProgress(cp, rvp);
      P(!!rvp && rvp.changeIds.length === 2 && prog0.total === 2,
        `armed: ${rvp.id} covers TWO clauses (${rvp.changeIds.join(', ')}), progress says ${prog0.marked} of ${prog0.total}`);
      const ban0 = text(wr.win.reviewBannerHtml(cp, { side: 'owner' }));
      P(/2 of 2|2 still/i.test(ban0),
        'armed (reviewer): the banner says "' + ban0.slice(0, 90) + '"');
      const myIds0 = [...wr.win.reviewMyChangeIds(cp)].sort();
      P(myIds0.length === 2, `armed (reviewer): their column is narrowed to ${JSON.stringify(myIds0)}`);

      wr.log.toasts.length = 0; wq.log.toasts.length = 0;
      await counter(wq.win, cp, '3', '<p>Secret for two (2) years.</p>');
      const prog1 = wq.win.reviewProgress(cp, rvp);
      const myIds1 = [...wr.win.reviewMyChangeIds(cp)].sort();
      P(prog1.total === 1 && chOf(cp, p1.id).status === 'superseded',
        `THE COUNT SHRINKS UNDER THEM: progress ${prog0.total} → ${prog1.total} while the review stays `
        + `OPEN and ${p1.id} is now '${chOf(cp, p1.id).status}'`);
      P(myIds1.length === 2 && myIds1.join(',') === myIds0.join(','),
        `AND THE NARROWING SET DOES NOT FOLLOW: reviewMyChangeIds still returns ${JSON.stringify(myIds1)} `
        + '— it reads rv.changeIds raw, not reviewInPlay. Harmless today because redlineCardIds also '
        + 'filters on status, so no card is drawn for the superseded id; but the two readings disagree.',
        JSON.stringify({ before: myIds0, after: myIds1 }));
      const cardsP = wr.win.redlineChangeCardsHtml(cp, { side: 'owner' });
      P(cardsP.indexOf(`data-nego-card="${p1.id}"`) < 0 && cardsP.indexOf(`data-nego-card="${p2.id}"`) >= 0,
        'the column really does drop the superseded card and keep the survivor: '
        + (cardsP.match(/data-nego-card="[^"]+"/g) || []).join(', '));
      const ban1 = text(wr.win.reviewBannerHtml(cp, { side: 'owner' }));
      P(/1 of 1|1 still/i.test(ban1) && /CHG-001/.test(ban1),
        'THE BANNER NOW CONTRADICTS ITSELF: "' + ban1.slice(0, 95) + '" — it still NAMES both '
        + 'CHG-001 and CHG-002 (reviewTagsFor reads rv.changeIds raw) while counting only "1 of 1", '
        + 'and there is no card on screen for the id it names');
      /* the hand-back still works here, and its tally forgets the lost clause */
      const marked2 = wr.win.reviewMark(cp, p2.id, 'cleared', {});
      const back = wr.win.reviewReturn(cp, {});
      P(!!marked2 && !!back && back.status === 'returned'
        && back.tally.cleared === 1 && back.tally.held === 0,
        `the hand-back succeeds on the survivor and its tally reads ${JSON.stringify(back && back.tally)} — `
        + 'the superseded clause is absent from the summary the requester reads');
      const rline = (cp.audit || []).map(e => e.detail).find(d => /returned by/.test(d));
      P(!!rline && !/CHG-001/.test(rline),
        'the returned audit line — "' + String(rline).slice(0, 120) + '" — names no loss');
    }

    HEAD('A CLEARED VERDICT THAT NEVER TRAVELS — the "recorded yes" yardstick');
    {
      const wq = world(REQ);
      const wr = world(REV);
      const cy = contract('MK-C8Y');
      wq.win.negoInit(cy);
      const y1 = await ask(wq.win, cy, '3', '<p>Secret for five (5) years.</p>', { author: REQ.name });
      wq.win.reviewAsk(cy, { reviewer: REV, ids: [y1.id] });
      const cleared = wr.win.reviewMark(cy, y1.id, 'cleared', { note: 'fine to send' });
      P(!!cleared && cleared.review.verdict === 'cleared',
        `armed: ${y1.id} is CLEARED TO SEND by ${REV.name}`);
      const line = (cy.audit || []).map(e => e.detail).find(d => /cleared to send/.test(d));
      P(!!line, 'armed: the trail records it — "' + String(line).slice(0, 100) + '"');
      await counter(wq.win, cy, '3', '<p>Secret for two (2) years.</p>');
      P(chOf(cy, y1.id).status === 'superseded' && wq.win.reviewSendable(cy).length === 0,
        `collision armed: ${y1.id} is superseded and reviewSendable is now empty — the wording that was `
        + 'cleared to send will never be sent');
      const later = (cy.audit || []).map(e => `${e.action}: ${e.detail}`).slice(-2);
      P(!later.some(l => /cleared/i.test(l)),
        'and nothing revisits the clearance: the record holds "cleared to send" beside "superseded" '
        + 'with no line joining them',
        JSON.stringify(later));
    }

    /* ================================================================
       PART 4 — THE COUNTERPARTY LEARNS NOTHING
       ================================================================ */
    HEAD('THE WALL — the counterparty never learns a review happened');
    P(wReq.win.reviewSeatShowsReview({ side: 'counterparty' }) === false
      && wReq.win.reviewSeatShowsReview({ readonly: true }) === false,
      'reviewSeatShowsReview still refuses the counterparty seat and a read-only mount');

    /* ================================================================
       PART 5 — THE SERVER
       ================================================================ */
    HEAD('SERVER — a real workspace, a real stored contract, real guards');
    const ws = await seedWorkspace(h);
    const admin = ws.admin;                                // Amina Otieno, admin
    const mk = async (name, email) => {
      const created = await admin.json('/api/users', { method: 'POST', body: {
        name, email, role: 'legal', password: 'temporary-pass-1' } });
      const cl = h.client(email);
      await cl.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
      await cl.json('/api/password/change', { method: 'POST', body: {
        current: 'temporary-pass-1', password: 'their-own-pass-9' } });
      return { client: cl, user: created.user };
    };
    const sReq = await mk(REQ.name, REQ.email);
    const sRev = await mk(REV.name, REV.email);
    NOTE(`server members: requester id=${sReq.user.id}, reviewer id=${sRev.user.id}, admin id=?`);

    /* Re-stage the collision on a contract whose review names the REAL server
       user ids, so rvIsReviewer/rvIsRequester match a real session. */
    const stageServer = async (id) => {
      const w = world({ id: sReq.user.id, name: REQ.name, role: 'legal', email: REQ.email });
      const cc = contract(id);
      w.win.negoInit(cc);
      const ax = await ask(w.win, cc, '3', '<p>Secret for five (5) years.</p>',
        { author: REQ.name });
      const r = w.win.reviewAsk(cc, {
        reviewer: { id: sRev.user.id, name: REV.name, email: REV.email }, ids: [ax.id] });
      return { w, c: cc, ask: ax, rv: r };
    };

    /* ---- 5a. the wall is UP before the collision ---- */
    const s1 = await stageServer('MK-C8S1');
    let r1 = await putContract(sReq.client, s1.c, 0);
    P(r1.status === 200, `armed: the collided-before state stored (PUT → ${r1.status})`);
    let stored = await sReq.client.json('/api/contracts/MK-C8S1');
    P(stored.review && stored.review.requests.length === 1
      && stored.review.requests[0].status === 'open'
      && stored.changes.length === 1 && stored.changes[0].status === 'pending',
      `armed on the SERVER: review ${stored.review.requests[0].id} open with `
      + `${stored.review.requests[0].reviewer.name}, ${stored.changes[0].id} pending, version _v=${stored._v}`);

    const mkPayload = (cid, changes) => ({ kind: 'hati-share', purpose: 'negotiate',
      contract: { id: cid, name: 'Mutual NDA', counterparty: 'Juno Limited', changes } });

    let sendAsRev = await sRev.client.raw('/api/shares', { method: 'POST', body: {
      payload: mkPayload('MK-C8S1', [{ id: s1.ask.id, status: 'pending' }]),
      recipient: { name: 'Erik', email: 'erik@juno.test' }, channel: 'link',
      durable: true, purpose: 'negotiate', expiryDays: 30 } });
    P(sendAsRev.status === 403 && /reviewing/i.test(String(sendAsRev.json && sendAsRev.json.error)),
      `armed: while the review is live the SERVER refuses the reviewer's send — ${sendAsRev.status} `
      + `"${sendAsRev.json && sendAsRev.json.error}"`);

    let sendAsReq = await sReq.client.raw('/api/shares', { method: 'POST', body: {
      payload: mkPayload('MK-C8S1', [{ id: s1.ask.id, status: 'pending' }]),
      recipient: { name: 'Erik', email: 'erik@juno.test' }, channel: 'link',
      durable: true, purpose: 'negotiate', expiryDays: 30 } });
    P(sendAsReq.status === 200 && sendAsReq.json.withheldByReview === 1,
      `armed: the requester's send goes but the out-for-review ask is STRIPPED — `
      + `withheldByReview=${sendAsReq.json && sendAsReq.json.withheldByReview}`);

    /* ---- 5b. the collision, saved by the requester ---- */
    const cS1 = clone(stored);
    delete cS1._v;
    {
      const w = world({ id: sReq.user.id, name: REQ.name, role: 'legal', email: REQ.email });
      w.win.negoInit(cS1);
      const bb = await counter(w.win, cS1, '3', '<p>Secret for two (2) years.</p>');
      NOTE(`the counter filed for the server stage is ${bb.id}`);
    }
    r1 = await putContract(sReq.client, cS1, stored._v);
    P(r1.status === 200, `the collided save is accepted (PUT → ${r1.status})`);
    stored = await sReq.client.json('/api/contracts/MK-C8S1');
    const askS = stored.changes.find(x => x.id === s1.ask.id);
    P(askS.status === 'superseded' && stored.review.requests[0].status === 'open',
      `armed on the SERVER: ${askS.id} is superseded and ${stored.review.requests[0].id} still reads `
      + `status='${stored.review.requests[0].status}'`);

    /* ---- 5c. the narrowing lifts at the send wall ---- */
    sendAsRev = await sRev.client.raw('/api/shares', { method: 'POST', body: {
      payload: mkPayload('MK-C8S1', [{ id: 'CHG-002', status: 'pending' }]),
      recipient: { name: 'Erik', email: 'erik@juno.test' }, channel: 'link',
      durable: true, purpose: 'negotiate', expiryDays: 30 } });
    P(sendAsRev.status === 200,
      `SOUND: the spent review no longer holds the reviewer — their send is accepted (${sendAsRev.status}), `
      + 'because rvActorHeld skips a spent review');
    P(!sendAsRev.json || !sendAsRev.json.withheldByReview,
      `and nothing is withheld any more (withheldByReview=${sendAsRev.json && sendAsRev.json.withheldByReview})`);

    /* ---- 5d. the structural guards still read the RAW open list ---- */
    HEAD('SERVER — the spent review stays structurally locked (deliberate, per the rulebook)');
    const base = await sReq.client.json('/api/contracts/MK-C8S1');
    const V = base._v;

    const attempt = async (client, mutate, label) => {
      const body = clone(base); delete body._v;
      mutate(body);
      const r = await putContract(client, body, V);
      return { r, label };
    };

    let t = await attempt(sReq.client, b => { b.review.requests = []; }, 'removal');
    P(t.r.status === 403 && /cannot be removed/i.test(String(t.r.json && t.r.json.error)),
      `DELIBERATE: the spent review cannot be dropped from the record — ${t.r.status} `
      + `"${t.r.json && t.r.json.error}"`);

    t = await attempt(sReq.client, b => { b.review.requests[0].changeIds = ['CHG-002']; }, 're-point');
    P(t.r.status === 403 && /cannot be edited/i.test(String(t.r.json && t.r.json.error)),
      `DELIBERATE: its scope cannot be re-pointed at the live counter — ${t.r.status} `
      + `"${t.r.json && t.r.json.error}"`);

    t = await attempt(sReq.client, b => {
      b.review.requests[0].reviewer = { id: sReq.user.id, name: REQ.name, email: REQ.email };
    }, 're-reviewer');
    P(t.r.status === 403 && /reviewer cannot be changed/i.test(String(t.r.json && t.r.json.error)),
      `DELIBERATE: its reviewer cannot be changed — ${t.r.status} "${t.r.json && t.r.json.error}"`);

    /* a verdict on the superseded change, by somebody who is not the reviewer */
    t = await attempt(sReq.client, b => {
      const ch = b.changes.find(x => x.id === s1.ask.id);
      ch.review = { verdict: 'cleared', by: REQ.name, byId: sReq.user.id,
        at: new Date().toISOString(), hash: ch.hash, reviewId: 'REV-1' };
    }, 'verdict by the requester');
    P(t.r.status === 403 && /can rule on/i.test(String(t.r.json && t.r.json.error)),
      `DELIBERATE: only the named reviewer may still rule on the superseded change — ${t.r.status} `
      + `"${t.r.json && t.r.json.error}"`);

    /* the reviewer CAN still write a verdict on it (raw open list) — harmless,
       but worth pinning: the browser refuses to produce this save at all */
    t = await attempt(sRev.client, b => {
      const ch = b.changes.find(x => x.id === s1.ask.id);
      ch.review = { verdict: 'held', by: REV.name, byId: sRev.user.id,
        at: new Date().toISOString(), hash: ch.hash, reviewId: 'REV-1' };
    }, 'verdict by the reviewer');
    P(t.r.status === 200,
      `ASYMMETRY: the SERVER still accepts a verdict from the named reviewer on the superseded `
      + `change (${t.r.status}) while the BROWSER refuses to record one ("No internal review is open"). `
      + 'Harmless — a verdict on a non-pending change is filtered out of every withheld set — but the '
      + 'two sides disagree about whether the act exists.');
    if (t.r.status === 200) {
      const after = await sReq.client.json('/api/contracts/MK-C8S1');
      const ch = after.changes.find(x => x.id === s1.ask.id);
      const send = await sReq.client.raw('/api/shares', { method: 'POST', body: {
        payload: mkPayload('MK-C8S1', [{ id: 'CHG-002', status: 'pending' }]),
        recipient: { name: 'Erik', email: 'erik@juno.test' }, channel: 'link',
        durable: true, purpose: 'negotiate', expiryDays: 30 } });
      P(send.status === 200 && !send.json.withheldByReview,
        `and it blocks nothing: the stored change carries review.verdict='${ch.review.verdict}' yet the `
        + `next send is clean (${send.status}, withheldByReview=${send.json && send.json.withheldByReview})`);
    }

    /* ---- 5e. what the server WOULD accept that the browser will not produce ---- */
    HEAD('SERVER — the two ways out the browser has closed');
    {
      const s2 = await stageServer('MK-C8S2');
      let r = await putContract(sReq.client, s2.c, 0);
      P(r.status === 200, 'armed: a second contract stored with an open review');
      let st2 = await sReq.client.json('/api/contracts/MK-C8S2');
      const c2s = clone(st2); delete c2s._v;
      {
        const w = world({ id: sReq.user.id, name: REQ.name, role: 'legal', email: REQ.email });
        w.win.negoInit(c2s);
        await counter(w.win, c2s, '3', '<p>Secret for two (2) years.</p>');
      }
      r = await putContract(sReq.client, c2s, st2._v);
      P(r.status === 200 && (await sReq.client.json('/api/contracts/MK-C8S2'))
        .changes.find(x => x.id === s2.ask.id).status === 'superseded',
        'armed: the review on MK-C8S2 is spent (its one change is superseded)');
      st2 = await sReq.client.json('/api/contracts/MK-C8S2');

      const handBack = clone(st2); delete handBack._v;
      handBack.review.requests[0].status = 'returned';
      handBack.review.requests[0].returnedAt = new Date().toISOString();
      handBack.review.requests[0].returnedBy = REV.name;
      const rb = await putContract(sRev.client, handBack, st2._v);
      P(rb.status === 200,
        `the SERVER would accept the reviewer handing the spent review back (${rb.status}) — but `
        + 'js/review.js reviewReturn refuses to build that save, so no screen in the product can '
        + 'reach this state');

      const s3 = await stageServer('MK-C8S3');
      await putContract(sReq.client, s3.c, 0);
      let st3 = await sReq.client.json('/api/contracts/MK-C8S3');
      const c3s = clone(st3); delete c3s._v;
      {
        const w = world({ id: sReq.user.id, name: REQ.name, role: 'legal', email: REQ.email });
        w.win.negoInit(c3s);
        await counter(w.win, c3s, '3', '<p>Secret for two (2) years.</p>');
      }
      await putContract(sReq.client, c3s, st3._v);
      st3 = await sReq.client.json('/api/contracts/MK-C8S3');
      const cancel = clone(st3); delete cancel._v;
      cancel.review.requests[0].status = 'cancelled';
      cancel.review.requests[0].returnedAt = new Date().toISOString();
      const rc = await putContract(sReq.client, cancel, st3._v);
      P(rc.status === 200,
        `the SERVER would likewise accept the requester cancelling it (${rc.status}) — and js/review.js `
        + 'reviewCancel returns null in silence, so again no screen can');
    }

    /* ---- 5f. the OTHER direction: our counter supersedes THEIR ask, filed by
             the narrowed reviewer. The 'superseding is filing, not answering'
             carve-out is what keeps this from being a 403. ---- */
    HEAD('SERVER — the mirror case: OUR counter supersedes THEIR ask, filed by a narrowed reviewer');
    {
      const w = world({ id: sRev.user.id, name: REV.name, role: 'legal', email: REV.email });
      const cc = contract('MK-C8S4');
      w.win.negoInit(cc);
      /* their ask arrives first */
      const theirs = await counter(w.win, cc, '3', '<p>Secret for one (1) year.</p>');
      /* a colleague asks THIS person to advise on it */
      const rvx = w.win.reviewAsk(cc, {
        reviewer: { id: sRev.user.id, name: REV.name, email: REV.email },
        by: REQ.name, byId: sReq.user.id, ids: [theirs.id] });
      P(!!rvx && rvx.changeIds.length === 1 && String(rvx.changeIds[0]) === theirs.id,
        `armed: ${rvx && rvx.id} asks ${REV.name} to advise on THEIR ask ${theirs.id}`);
      let r = await putContract(sReq.client, cc, 0);
      P(r.status === 200, `armed: stored (PUT → ${r.status})`);
      const st = await sReq.client.json('/api/contracts/MK-C8S4');
      P(st.changes[0].status === 'pending' && st.review.requests[0].status === 'open',
        `armed on the SERVER: ${st.changes[0].id} pending (theirs), review open with the reviewer`);

      const next = clone(st); delete next._v;
      const w2 = world({ id: sRev.user.id, name: REV.name, role: 'legal', email: REV.email });
      w2.win.negoInit(next);
      const ours = await ask(w2.win, next, '3', '<p>Secret for four (4) years.</p>', { author: REV.name });
      P(next.changes.find(x => x.id === theirs.id).status === 'superseded'
        && String(ours.counterOf) === String(theirs.id),
        `armed: the narrowed reviewer's own counter ${ours.id} superseded THEIR ask ${theirs.id}`);
      r = await putContract(sRev.client, next, st._v);
      P(r.status === 200,
        `SOUND and DELIBERATE: the save is accepted (${r.status}) — the guard's carve-out `
        + '("superseding is filing, not answering") is what stops a 403 here');
    }

    /* ---- 5g. does the SERVER agree that a published round un-holds a change
             that never travelled? (the side effect measured in the browser
             above, confirmed at the wall that actually strips) ---- */
    HEAD('SERVER — the turn stamp, confirmed at the wall');
    {
      const w = world({ id: sReq.user.id, name: REQ.name, role: 'legal', email: REQ.email });
      const ct = contract('MK-C8S5');
      w.win.negoInit(ct);
      const t1 = await ask(w.win, ct, '3', '<p>Secret for five (5) years.</p>', { author: REQ.name });
      const t2 = await ask(w.win, ct, '2', '<p>Three (3) years.</p>', { author: REQ.name });
      w.win.reviewAsk(ct, {
        reviewer: { id: sRev.user.id, name: REV.name, email: REV.email }, ids: [t1.id] });
      let r = await putContract(sReq.client, ct, 0);
      P(r.status === 200, 'armed: stored with one ask out for review and one free');
      let s = await sReq.client.json('/api/contracts/MK-C8S5');
      let send = await sReq.client.raw('/api/shares', { method: 'POST', body: {
        payload: mkPayload('MK-C8S5', [{ id: t1.id, status: 'pending' }, { id: t2.id, status: 'pending' }]),
        recipient: { name: 'Erik', email: 'erik@juno.test' }, channel: 'link',
        durable: true, purpose: 'negotiate', expiryDays: 30 } });
      P(send.status === 200 && send.json.withheldByReview === 1,
        `armed: the SERVER strips the out-for-review ask on the first send (withheldByReview=`
        + `${send.json && send.json.withheldByReview})`);

      const ct2 = clone(s); delete ct2._v;
      const w2 = world({ id: sReq.user.id, name: REQ.name, role: 'legal', email: REQ.email });
      w2.win.negoInit(ct2);
      w2.win.negoHandOver(ct2, { to: 'counterparty', by: REQ.name });
      r = await putContract(sReq.client, ct2, s._v);
      P(r.status === 200 && !!(await sReq.client.json('/api/contracts/MK-C8S5')).negotiation.turnAt,
        'armed: the published round is stored, turnAt is on the record');
      send = await sReq.client.raw('/api/shares', { method: 'POST', body: {
        payload: mkPayload('MK-C8S5', [{ id: t1.id, status: 'pending' }, { id: t2.id, status: 'pending' }]),
        recipient: { name: 'Erik', email: 'erik@juno.test' }, channel: 'link',
        durable: true, purpose: 'negotiate', expiryDays: 30 } });
      P(send.status === 200 && !send.json.withheldByReview,
        `CONFIRMED AT THE WALL: the SECOND send carries ${t1.id} through — withheldByReview=`
        + `${send.json && send.json.withheldByReview} — the server's rvUnsentOurs repeats the same `
        + 'turnAt arithmetic, so browser and server agree and the wording out for review would '
        + 'actually reach the counterparty. Pre-existing, adjacent to C8, reported as its own thing.');
    }

    /* ================================================================
       PART 6 — THE GENUINE INBOUND ROAD
       ================================================================
       Everything above files the counter through negoFileChange directly, which
       IS the product's one funnel — but the road a real counter travels is a
       live share link, POST /api/shares/:token/respond, and the owner's own
       applyResponse. Driven for real here so the supersession-under-review is
       not a claim about a function call. */
    HEAD('THE REAL ROAD — their counter arrives down a live negotiate link');
    {
      const { buildPortal } = require('../../portalworld');
      const p = buildPortal({ url: 'https://hati.test/' });
      for (const k of ['persist', 'saveContract', 'renderWorkspace', 'renderRedline', 'setView',
        'renderNegotiationSection', 'renderAuditSection', 'renderSharesSection', 'refreshShareOverview'])
        p.win[k] = () => {};
      p.win.promptDialog = async () => '';

      const wl = world({ id: sReq.user.id, name: REQ.name, role: 'legal', email: REQ.email });
      const cl = contract('MK-C8L');
      wl.win.negoInit(cl);
      const la = await ask(wl.win, cl, '3', '<p>Secret for five (5) years.</p>', { author: REQ.name });
      const lrv = wl.win.reviewAsk(cl, {
        reviewer: { id: sRev.user.id, name: REV.name, email: REV.email }, ids: [la.id] });
      const targetClause = wl.win.negoClauseList(cl).find(x => String(x.num) === '3');
      P(!!lrv && lrv.status === 'open' && chOf(cl, la.id).status === 'pending',
        `armed: ${la.id} pending on ${targetClause.clauseId}, out for review as ${lrv.id} with ${REV.name}`);

      let r = await putContract(sReq.client, cl, 0);
      P(r.status === 200, `armed: stored (PUT → ${r.status})`);

      const docHash = await p.win.sha256(p.win.canonicalDoc(cl));
      const payload = p.win.buildSharePayload(cl, docHash,
        { org: 'Highland Corporate Ltd', sharedBy: REQ.name });
      payload.purpose = 'negotiate';
      const link = await sReq.client.json('/api/shares', { method: 'POST', body: {
        payload, recipient: { name: 'Erik Lindqvist', email: 'erik@juno.test' },
        channel: 'link', durable: true, purpose: 'negotiate', expiryDays: 30 } });
      P(!!link.token && link.withheldByReview === 1,
        `armed: a real durable link is minted and the SERVER strips the out-for-review ask on the way `
        + `out (withheldByReview=${link.withheldByReview}) — so the counterparty never saw ${la.id}`);

      const pub = h.client('public');
      await pub.json('/api/shares/' + link.token + '/respond', { method: 'POST', body: {
        kind: 'hati-response', action: 'decisions', id: 'MK-C8L', name: 'Erik Lindqvist',
        at: new Date().toISOString(), docHash,
        negoDecisions: [],
        negoProposed: [{ id: 'cp-1', clauseId: targetClause.clauseId, changeType: 'modify',
          oldText: targetClause.text,
          newText: String(targetClause.text).replace(/secret\.?$/i, 'secret for two (2) years.'),
          clauseLabel: targetClause.label || null, why: 'Two years is our standard tail.' }] } });
      const queued = (await sReq.client.json('/api/shares/pending'))
        .filter(x => x.response && x.response.id === 'MK-C8L');
      P(queued.length === 1 && queued[0].response.negoProposed.length === 1,
        `armed: ONE real response is waiting on the owner's queue, carrying their counter`);

      const rec = await sReq.client.json('/api/contracts/MK-C8L');
      rec._loaded = true;
      const applied = await p.win.applyResponse(rec, queued[0].response, { background: true });
      const theirNew = (rec.changes || []).filter(x => x.authorSide === 'counterparty');
      const oursNow = chOf(rec, la.id);
      P(applied === true && theirNew.length === 1 && oursNow.status === 'superseded'
        && String(oursNow.supersededBy) === String(theirNew[0].id),
        `THE COLLISION HAPPENS ON THE REAL ROAD: applyResponse filed ${theirNew[0] && theirNew[0].id} `
        + `and stepped ${la.id} down to '${oursNow.status}' (supersededBy=${oursNow.supersededBy})`);

      const wrl = world({ id: sRev.user.id, name: REV.name, role: 'legal', email: REV.email });
      P(wrl.win.reviewSpent(rec, rec.review.requests[0]) === true
        && wrl.win.reviewActorHeld(rec) === null
        && text(wrl.win.reviewBannerHtml(rec, { side: 'owner' })) === '',
        'and the reviewer\'s chair goes quiet exactly as staged above: spent=true, '
        + 'reviewActorHeld=null, banner=""');

      r = await putContract(sReq.client, rec, rec._v);
      P(r.status === 200,
        `the owner's browser saves the applied round back and the server takes it (${r.status}) — the `
        + 'collided state is now the stored state');
      const finalRec = await sReq.client.json('/api/contracts/MK-C8L');
      P(finalRec.review.requests[0].status === 'open'
        && finalRec.changes.find(x => x.id === la.id).status === 'superseded',
        `FINAL STORED STATE: ${finalRec.review.requests[0].id} status='`
        + `${finalRec.review.requests[0].status}', ${la.id} status='`
        + `${finalRec.changes.find(x => x.id === la.id).status}' — an open review nobody can close, `
        + 'over a change nobody can rule on');
    }

    HEAD('RESULT');
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exitCode = fail ? 1 : 0;
  } catch (e) {
    console.log('HARNESS ERROR  ' + (e && e.stack || e));
    process.exitCode = 2;
  } finally {
    await h.stop();
  }
})();
