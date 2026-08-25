// HaTi — INTERNAL REVIEW: the step between writing a redline and sending it.
/* ============================================================
   THE GAP THIS FILLS

   A change written in the negotiation room used to be live the instant it was
   filed: pending, visible, and one press of Send away from the other side. The
   only thing standing between a junior's wording and the counterparty's inbox
   was the junior remembering to ask somebody.

   Every mature CLM answers this the same way, and the answer is one idea:
   PROPOSED AND SENT ARE TWO DIFFERENT STATES OF THE SAME REDLINE. What you
   write sits in a working state that is invisible outside this company. Sending
   is a separate, deliberate act that publishes a package. Everything internal —
   the note your boss left, the wording they killed, the counter-draft they
   wrote over yours — happens in the gap between those two states, and NONE of
   it travels.

   HaTi already had the gap and did not use it. negoUnsentAsks has always known
   which of our asks the other side has never seen; it is measured against the
   turn stamp and it is the population this whole module governs. An ask that
   has already left the building cannot be held back by anybody, and this module
   never pretends otherwise — you cannot un-send a redline, so a review that
   claimed to hold one would be lying.

   THREE THINGS LIVE HERE

   1. THE REQUEST — a named person, a note, a due date. Not a status flip: a
      status flip tells nobody, which is exactly how the old "Send for review"
      button ended up meaning nothing.

   2. THE VERDICT, PER CHANGE — cleared or held on our own asks; advice on
      theirs. A held ask is excluded from the package, so an internal refusal
      never reaches the counterparty in any form.

   3. THE GATE — an optional rule that locks the outbound send until the review
      clears. The approval chain already gates SIGNING; this gates SENDING,
      which is the earlier and, for a redline, the only moment that matters.

   WHY IT IS ITS OWN FILE AND NOT PART OF negotiation.js: the change model is
   evidence — fingerprinted, hash-chained, shown to both parties. A review is
   the opposite kind of record: internal, revocable, and about people rather
   than wording. The only place the two meet is `ch.review`, which is a plain
   annotation the change model neither reads nor hashes.

   WHAT NEVER TRAVELS: `ch.review`, `c.review`, and every name inside them.
   buildSharePayload is an allow-list, so this is true by construction — it is
   restated in the tests because "true by construction" is only true until
   somebody adds a field.
   ============================================================ */

/* Verdicts. TWO VOCABULARIES, because the reviewer is answering two different
   questions and one word cannot mean both.

   On OUR ask, the reviewer is a gatekeeper: this wording either goes to the
   counterparty or it does not. Cleared and held are decisions with an effect.

   On THEIRS, the reviewer has no gate to keep — the ask is already on our
   table, sent by the other side, and only the person deciding it can accept or
   reject it. So the verdict is ADVICE, it is recorded as advice, and it changes
   nothing by itself. Calling that "approved" would have been the more natural
   word and the more dangerous one: it reads like a decision and is not. */
const REVIEW_VERDICTS_OURS = ['cleared', 'held'];
const REVIEW_VERDICTS_THEIRS = ['advise-accept', 'advise-reject', 'advise-discuss'];
const REVIEW_VERDICTS = REVIEW_VERDICTS_OURS.concat(REVIEW_VERDICTS_THEIRS);
const reviewVerdictIsAdvice = v => REVIEW_VERDICTS_THEIRS.includes(String(v || ''));

/* The RECORD's words for each verdict — English, always, like ROLE_LABEL and
   for the same reason: these are stamped into audit lines and a record that
   shifts language under a later reader is not a record. The SCREEN's words are
   reviewVerdictLabel() below, which reads the dictionary. */
const REVIEW_VERDICT_RECORD = {
  cleared: 'cleared to send',
  held: 'held back',
  'advise-accept': 'advises accepting',
  'advise-reject': 'advises rejecting',
  'advise-discuss': 'advises discussing',
};
function reviewVerdictLabel(v){
  const k = { cleared: 'rv_v_cleared', held: 'rv_v_held', 'advise-accept': 'rv_v_adv_accept',
    'advise-reject': 'rv_v_adv_reject', 'advise-discuss': 'rv_v_adv_discuss' }[String(v || '')];
  return k ? i18t(k) : '';
}

/* ---- EVERY SHELL FUNCTION IS REACHED THROUGH `window`, AND IT HAS TO BE ----

   js/core.js declares its shell as `const currentUser = …`, `const getUsers =
   …`, `const canEdit = …`. A `const` at the top of a script is a LEXICAL
   binding, not a property of the global object — so a bare `currentUser()` in
   this file resolves to core.js's binding and can never be substituted, while
   `window.currentUser` is the name every other module reaches it by. The two
   are the same function in the running app and DIFFERENT in any harness that
   stands one of them in, which is where this bit me: a guard reading
   `window.currentUser && currentUser()` passed its own check and then called
   the wrong one. js/views/negotiation.js already carries this warning about
   canEdit, in almost these words.

   `state` is the opposite case and is left bare on purpose: it is core.js's
   `const state` and there IS no window.state, so `window.state && …` — which
   is what this file said at first — read as "no settings" forever and quietly
   disabled the gate on every workspace that turned it on. */
const _rvNow = () => (window.nowISO ? window.nowISO() : new Date().toISOString());
const _rvMe = () => (window.currentUser ? window.currentUser() : null) || null;
const _rvSay = (msg, kind) => { if (window.toast) window.toast(msg, kind); };
/* The settings object, whichever way this context holds it. */
function _rvState(){
  try{ if (typeof state !== 'undefined' && state) return state; }catch(_){}
  return (typeof window !== 'undefined' && window.state) || null;
}
const _rvAudit = (c, action, detail) => { if (window.logAudit) window.logAudit(c, action, detail); };
const _rvSave = c => { if (window.persist) window.persist(c); };
const _rvE = s => String(s == null ? '' : s)
  .replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/* A NOTE IS A SENTENCE, NOT AN ESSAY. Nothing bounded this, and a whole Copilot
   answer pasted into the box became the banner — a wall of amber text above the
   contract somebody was trying to read. Stored capped, drawn shorter still, and
   the full text is always on hover and in the hand-back dialog. */
const RV_NOTE_MAX = 600;
const _rvClamp = (s, n) => {
  const t = String(s == null ? '' : s).trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

/* ---------- the store ----------
   A LIST, not a single field. A contract is reviewed more than once — round 2
   goes back to the same person — and a single slot would overwrite the record
   of what was said the first time. The open one is whichever is still open;
   there is at most one, enforced in reviewAsk. */
function reviewInit(c){
  if (!c) return null;
  if (!c.review || typeof c.review !== 'object' || Array.isArray(c.review)) c.review = { requests: [] };
  if (!Array.isArray(c.review.requests)) c.review.requests = [];
  return c.review;
}
/* READING NEVER WRITES. reviewInit creates `c.review` where it is missing, and
   for a while every read went through it — so merely PAINTING a screen stamped
   an empty review object onto the contract. F59 caught it, in a test written
   for something else entirely: "rendering the room writes nothing, and
   re-opening a decision must not either". That test is right about more than
   its own subject. A render that mutates the record turns every repaint into a
   save, makes "has this contract changed?" unanswerable, and would have shipped
   `review:{requests:[]}` onto every contract anybody ever looked at.

   So the read is a read. Only reviewAsk and reviewMark — the two acts that
   genuinely add something — initialise. */
function reviewRequests(c){
  return (c && c.review && Array.isArray(c.review.requests)) ? c.review.requests : [];
}
/* ---------- MORE THAN ONE REVIEW AT A TIME ----------
   This was one open review per contract, and that was the wrong shape for how
   the work is actually done. You read a contract from the top; clause 5 wants
   somebody in sales to look at it, so it goes to sales THEN — and twenty
   minutes later clause 10 wants procurement, who have nothing to do with sales
   and should not wait for them. Making the second ask cancel or join the first
   forces the reader to hold the whole document in their head and escalate once,
   at the end, which is exactly the batch habit this feature was meant to
   replace (Young, 09 Aug 2026).

   So: several reviews may be open at once, each with its own reviewer, its own
   set of changes and its own hand-back. A CHANGE BELONGS TO AT MOST ONE — two
   people ruling on one clause has no coherent answer, and reviewAsk refuses it
   rather than picking a winner.

   `reviewOpenOf` survives as "the most recent open one" for the few callers
   that genuinely want a single answer; everything that reasons about a
   PARTICULAR change asks reviewOpenFor instead. */
/* ---------- WHAT A REVIEW IS STILL ABOUT ----------
   THE ONE POPULATION, and everything that counts a review counts THIS.

   Reported from the field (Young, 09 Aug 2026), off a screenshot of three
   yellow rows: "once a reviewer has sent back feedback and an issue is closed
   these banners should disappear completely as they serve no purpose but taking
   up space". Two of those rows read “CHG-003 0 of 0 still need your verdict”,
   which is not a sentence anybody can act on — the changes had been decided and
   were in the round history, so there was no card to press, no verdict to give
   and no way to make the row go away.

   It happened because "what is left in this review" was measured over
   negoUnsentAsks — our own asks the other side has NEVER SEEN. That population
   is right for the send (a hold cannot recall wording the counterparty already
   holds) and wrong for the reviewer, and it empties for two quite different
   reasons: the change was decided (genuinely finished), or the round was merely
   handed over (still pending, still rulable, still very much their job). The
   first left a dead row nagging for ever; the second printed 0 of 0 over a
   change the reviewer could still open and rule on.

   So a review is about its own changes that are STILL ON THE TABLE — pending,
   undecided, whoever has seen them. Read off c.changes rather than through the
   negotiation module, so it answers the same on a page that has not loaded one
   and matches the server's rvInPlay word for word. */
function reviewInPlay(c, rv){
  const ids = new Set((((rv && rv.changeIds) || [])).map(String));
  if (!ids.size) return [];
  return (Array.isArray(c && c.changes) ? c.changes : [])
    .filter(x => x && ids.has(String(x.id)) && String(x.status || 'pending') === 'pending');
}
/* ---------- A REVIEW WITH NOTHING LEFT IN IT IS OVER ----------
   Nobody closed it, so the record still says open — but every clause it covered
   has been decided or retracted, and there is nothing left for anyone to do
   about it. It must therefore stop being drawn, stop appearing on the
   reviewer's desk, and above all stop NARROWING them: the reported screen had a
   colleague locked out of the round, their card column emptied, by two asks
   that had been overtaken by events days earlier.

   The record is NOT rewritten. Reading must not write (see reviewInit), the
   audit trail already carries the request, and a review that was overtaken
   rather than answered should read that way in the history. The screens simply
   stop asking about it. */
function reviewSpent(c, rv){
  if (!rv || rv.status !== 'open') return false;
  if (!Array.isArray(rv.changeIds) || !rv.changeIds.length) return false;
  return reviewInPlay(c, rv).length === 0;
}
function reviewOpenList(c){
  return reviewRequests(c).filter(r => r && r.status === 'open' && !reviewSpent(c, r));
}
function reviewOpenOf(c){
  const open = reviewOpenList(c);
  return open.length ? open[open.length - 1] : null;
}
/* The review this change is sitting in, or null. The one function that makes
   "several at once" safe: every verdict, every badge and every refusal is
   decided per change rather than per contract. */
function reviewOpenFor(c, ch){
  if (!ch) return null;
  return reviewOpenList(c).find(r => (r.changeIds || []).some(id => String(id) === String(ch.id))) || null;
}
/* The open reviews this person is the named reviewer of. */
function reviewMineOpen(c, u){
  const me = u || _rvMe();
  return reviewOpenList(c).filter(r => reviewIsReviewer(r, me));
}
function reviewLastOf(c){ const rs = reviewRequests(c); return rs.length ? rs[rs.length - 1] : null; }

/* ---------- what a review is ABOUT ----------
   Two populations, and the difference is not cosmetic.

   OURS is negoUnsentAsks — our own pending asks the counterparty has never been
   shown. This is the set the reviewer can actually govern, because it is the
   set that has not left yet.

   THEIRS is their pending asks, undecided. The reviewer cannot decide them (the
   change model forbids ruling on your own side's behalf from a review, and
   quite apart from that a recommendation is not a ruling) — but "look at what
   they are asking for before I answer" is half of why anyone escalates a
   contract in the first place, so leaving it out would have made the feature
   answer only half the question that was asked of it. */
function reviewScope(c){
  /* ALREADY OUT IS NOT AVAILABLE. With several reviews able to run at once, the
     dialog must offer only what is still free — a change sitting with sales
     cannot also go to procurement, and listing it would invite exactly that. */
  const free = x => !reviewInOpen(c, x);
  const ours = (window.negoUnsentAsks ? window.negoUnsentAsks(c, 'owner') : []).filter(free);
  const theirs = (window.negoPending ? window.negoPending(c) : [])
    .filter(x => x && x.authorSide === 'counterparty' && free(x));
  return { ours, theirs, all: ours.concat(theirs) };
}
const reviewSideOf = ch => (ch && ch.authorSide === 'counterparty') ? 'theirs' : 'ours';

/* ---------- IS THIS ONE ACTUALLY OUT ----------
   Since a review is a chosen subset, "a review is open" and "this change is in
   it" stopped being the same question. Everything that used to ask the first
   and mean the second asks this instead: the verdict buttons, the hand-back,
   the card's badge and the send warning.

   reviewOutFor returns the reviewer's NAME rather than a boolean, because every
   caller wants to say who — "with Achieng" is the useful sentence and "under
   review" is not. */
function reviewInOpen(c, ch){ return !!reviewOpenFor(c, ch); }
/* Out, and not yet answered. A change the reviewer has already ruled on is not
   waiting on them any more, so it stops wearing the badge the moment they
   decide — the hold or the clearance says where it stands from then on. */
function reviewOutFor(c, ch){
  if (reviewOn(ch)) return null;
  const rv = reviewOpenFor(c, ch);
  return (rv && rv.reviewer && rv.reviewer.name) || null;
}
/* THE SAME QUESTION, ASKED BY A SCREEN. "Is this change out" is everybody's
   business — it governs whether the round can be sent. WHO is holding it is the
   business of the two people in that review and of an admin, so this returns
   the name only to them and null to everyone else. Declared here and defined
   after reviewMaySee, which needs the identity helpers below. */
function reviewOutNameFor(c, ch, u){
  const name = reviewOutFor(c, ch);
  if (!name) return null;
  return reviewMaySee(reviewOpenFor(c, ch), u) ? name : null;
}
/* And for a verdict already given: the reviewer's name, or null. */
function reviewVerdictByFor(ch, u, c){
  const v = reviewOn(ch);
  if (!v) return null;
  const rv = c ? (reviewRequests(c) || []).find(r => r && r.id === v.reviewId) : null;
  /* An older record carries no reviewId. Fall back to the name on the verdict
     and show it only to an admin — a stored verdict must not become the way
     round the rule. */
  if (!rv) return _rvIsAdmin(u) ? (v.by || null) : null;
  return reviewMaySee(rv, u) ? (v.by || null) : null;
}
/* Our own unsent asks currently sitting with somebody. What the send warning
   counts, and what the card's amber edge is drawn from. */
function reviewAwaiting(c){
  return (window.negoUnsentAsks ? window.negoUnsentAsks(c, 'owner') : [])
    .filter(x => !!reviewOutFor(c, x));
}

/* ---------- reading a verdict ----------
   STALENESS IS THE WHOLE SAFETY ARGUMENT. An approver's yes is given to
   particular wording, and js/approvals.js already learned this the hard way:
   a sign-off that outlives the thing it was given for is worse than no sign-off,
   because it is a claim nobody made. The change model hands us the stamp for
   free — every change carries a fingerprint over its own wording, and a
   revision re-hashes it — so "has this moved since it was looked at" is a
   string comparison rather than a judgement.

   AND THE TWO VERDICTS FAIL IN OPPOSITE DIRECTIONS, deliberately:

   - a stale CLEAR is not a clear. The reviewer approved words that are no
     longer there, so the gate treats the ask as unreviewed and it goes back.
   - a stale HOLD is still a hold. Somebody said this must not go out; a revision
     by the person who wrote it is not permission to overrule them. The card
     says the wording has moved and asks for another look, and the ask stays
     behind the wall until the reviewer themselves lifts it.

   Both directions are the same principle: when in doubt, nothing leaves. */
function reviewOn(ch){ return (ch && ch.review && ch.review.verdict) ? ch.review : null; }
function reviewStale(ch){
  const v = reviewOn(ch);
  if (!v || !v.hash || !ch.hash) return false;
  return String(v.hash) !== String(ch.hash);
}
function reviewCurrent(ch){ const v = reviewOn(ch); return (v && !reviewStale(ch)) ? v : null; }
function reviewHeld(ch){ const v = reviewOn(ch); return !!(v && v.verdict === 'held'); }
function reviewCleared(ch){ const v = reviewCurrent(ch); return !!(v && v.verdict === 'cleared'); }

/* THE IDS THAT MUST NOT TRAVEL. Read by buildSharePayload, by the send button's
   count, and by the card that draws the hold — one answer, three readers, so
   they cannot disagree about what is going out.

   Held is only meaningful on an UNSENT ask. Once wording is with the other
   side, holding it back is not a thing the world permits, and a set that
   claimed otherwise would quietly delete a change from a payload the
   counterparty already holds — which reads to them as us rewriting history. */
function reviewHeldIds(c){
  const out = new Set();
  for (const x of (window.negoUnsentAsks ? window.negoUnsentAsks(c, 'owner') : []))
    if (reviewHeld(x)) out.add(x.id);
  return out;
}
/* ---------- EVERYTHING THAT STAYS BEHIND ----------
   TWO REASONS, ONE ANSWER. A change is kept out of a send either because the
   reviewer held it, or because it is still sitting with them unanswered — and
   the payload cannot tell those apart, nor should it have to. Sending wording
   while a colleague is midway through reading it makes the review pointless:
   their verdict arrives the next morning about something the counterparty has
   already seen.

   This is what buildSharePayload subtracts. reviewHeldIds stays separate
   because the SCREENS do need to tell the two apart — held is a refusal and
   wears ruby, waiting is in flight and wears amber. */
function reviewWithheldIds(c){
  const out = reviewHeldIds(c);
  for (const x of reviewAwaiting(c)) out.add(x.id);
  return out;
}
/* What a send would actually carry. */
function reviewSendable(c){
  const back = reviewWithheldIds(c);
  return (window.negoUnsentAsks ? window.negoUnsentAsks(c, 'owner') : []).filter(x => !back.has(x.id));
}

/* ---------- who may act ----------
   Matched on ID FIRST and name second. Two people called the same thing is a
   real workspace, and an id that has not been recorded is a real old record —
   so both are tried, in the order that cannot be spoofed. */
function reviewIsReviewer(rv, u){
  const me = u || _rvMe();
  if (!rv || !me) return false;
  const r = rv.reviewer || {};
  if (r.id && me.id) return String(r.id) === String(me.id);
  return !!r.name && String(r.name) === String(me.name);
}
function reviewIsRequester(rv, u){
  const me = u || _rvMe();
  if (!rv || !me) return false;
  if (rv.byId && me.id) return String(rv.byId) === String(me.id);
  return !!rv.by && String(rv.by) === String(me.name);
}
const _rvIsAdmin = u => { const me = u || _rvMe(); return !!(me && me.role === 'admin'); };

/* ---------- A REVIEW IS NOT PUBLIC INSIDE THE COMPANY ----------
   Reported from the field (Young, 09 Aug 2026): a colleague asked to look at
   one clause could read every open review on the contract — who else was
   reviewing, what they were sent, when it was due — and could press Cancel on
   any of them.

   Escalating a clause is an act with politics in it. "Legal are looking at the
   indemnity" is the requester's information to share or not, and a second
   reviewer has no business learning it just because they were handed a
   different clause. So a review is visible to the two people in it and to an
   admin, and to nobody else.

   WHAT EVERYBODY ELSE STILL SEES. That a change is held, or out — because that
   governs whether it can be sent and anyone working the contract needs it —
   but not a name. reviewChipHtml drops the name rather than the chip. */
function reviewMaySee(rv, u){
  const me = u || _rvMe();
  if (!rv || !me) return false;
  return _rvIsAdmin(me) || reviewIsReviewer(rv, me) || reviewIsRequester(rv, me);
}
/* YOU RAISED IT, SO YOU CAN WITHDRAW IT — and an admin can, so nothing is stuck
   when somebody is away. A reviewer cannot cancel their way out of a job, and
   emphatically cannot cancel somebody else's. Checked in the model and not only
   by hiding the button: there was no check here at all. */
function reviewMayCancel(rv, u){
  const me = u || _rvMe();
  if (!rv || !me) return false;
  return _rvIsAdmin(me) || reviewIsRequester(rv, me);
}

/* ---------- WHILE YOUR REVIEW IS OPEN, YOU ARE A REVIEWER ----------
   Asked for by name (Young, 09 Aug 2026): "my responsibility is only related to
   the one clause I need to provide feedback for", and today the person asked
   keeps every ordinary power — they can publish the round, answer the
   counterparty and send the very wording somebody else is still reading.

   So being asked NARROWS you on that contract, for as long as the ask is open:
   rule on your own clauses, correct that wording, and nothing that reaches the
   counterparty. Handing back returns everything, which is what makes this
   bearable — it is a posture, not a demotion.

   Returns the open reviews this person owes a verdict on, or null. */
function reviewActorHeld(c, u){
  const me = u || _rvMe();
  if (!c || !me) return null;
  const mine = reviewMineOpen(c, me);
  return mine.length ? mine : null;
}
const reviewActorIsHeld = (c, u) => !!reviewActorHeld(c, u);
/* THE CHANGES THIS PERSON WAS ACTUALLY HANDED, across every review open with
   them — or null when they are not reviewing anything here, which means "no
   narrowing, show them the round".

   Asked for by name (Young, 09 Aug 2026): "as someone who has been handed a
   redline to review internally, I should only be able to see the card that has
   been forwarded to me, not all the cards in the negotiation tracker." The
   DOCUMENT is untouched — you cannot judge a clause you are not allowed to
   read, and they had access to this contract before anybody asked them. It is
   the change list that narrows, because that list is the round's work and the
   round is not their job. */
function reviewMyChangeIds(c, u){
  const mine = reviewActorHeld(c, u);
  if (!mine) return null;
  const ids = new Set();
  mine.forEach(rv => (rv.changeIds || []).forEach(id => ids.add(String(id))));
  return ids;
}
/* The refusal in one sentence, or null. Every door that puts wording in front
   of the counterparty prints exactly this, so they cannot each invent their own
   account of the same rule. */
function reviewActorBlockMessage(c, u){
  const mine = reviewActorHeld(c, u);
  if (!mine) return null;
  const n = mine.reduce((a, rv) => a + (rv.changeIds || []).length, 0);
  return i18tn('rv_actor_locked', n, { n, who: mine[0].by });
}

/* Who can be asked. Viewers are excluded because a viewer cannot decide
   anything anywhere else in the product either, and a review they could not act
   on would be a request into a void. Yourself is excluded for the reason the
   change model already states in its own words: nobody rules on their own ask.

   AND THEY MUST BE ABLE TO OPEN THE CONTRACT. A member restricted to other
   value streams cannot see this one at all — the server keeps it out of their
   register — so a request posted to them is a request into a void of a
   different kind, and a worse one: only the named reviewer can lift a hold, so
   the send sits behind a wall whose only key belongs to somebody who cannot
   reach the door. The server refuses the same thing on the same grounds. */
function reviewCandidates(c){
  const me = _rvMe();
  const folder = c && c.folder;
  const reaches = u => {
    if (!folder || typeof window.canAccessFolder !== 'function') return true;
    try{ return canAccessFolder(folder, u); }catch(_){ return true; }
  };
  return (window.getUsers ? window.getUsers() : [])
    .filter(u => u && u.role !== 'viewer' && !(me && String(u.id) === String(me.id)) && reaches(u));
}

/* ---------- FINDING A COLLEAGUE IN A COMPANY OF HUNDREDS ----------

   A dropdown is a list you scroll, and a list you scroll stops working at about
   thirty people. It shipped as one, and on a real workspace that is a control
   you cannot use: the person you want is somewhere in the middle of four
   hundred names, and the field gives you no way to say who.

   So the field TAKES TYPING, and typing is matched against the name AND the
   address — because half the time what you have in your hand is an email
   somebody sent you, not a spelling of their name.

   WHY THE ANSWER MUST STILL BE A COLLEAGUE, and not simply whatever address was
   typed. A review is not a message; it is a person who can clear or hold each
   change, and a hold that only they can lift. Post it to somebody with no seat
   in this workspace and the wording sits behind a wall nobody can open, with
   the send gate holding it there — a deadlock created by a typo. The server
   refuses the same thing for the same reason, so the two agree.

   The refusals are therefore specific: an address nobody here holds, a viewer
   who could not rule if they wanted to, and your own name are three different
   mistakes and each one says which it is. */
const _rvEmail = s => String(s || '').trim().toLowerCase();
const _rvIsEmailish = s => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(String(s || '').trim());

/* The list under the field: everyone who matches, best first. Capped by the
   caller, which also says how many were left out — a silent truncation reads as
   "that is everybody" when it is not. */
function reviewSearchPeople(q, limit, c){
  const all = reviewCandidates(c);
  const s = String(q || '').trim().toLowerCase();
  if (!s) return { hits: all.slice(0, limit || 8), total: all.length };
  const score = u => {
    const n = String(u.name || '').toLowerCase(), e = _rvEmail(u.email);
    if (e === s || n === s) return 0;                       // exact
    if (n.startsWith(s) || e.startsWith(s)) return 1;       // begins with
    if (n.indexOf(s) >= 0 || e.indexOf(s) >= 0) return 2;   // contains
    return 9;
  };
  const hits = all.map(u => ({ u, r: score(u) })).filter(x => x.r < 9)
    .sort((a, b) => a.r - b.r || String(a.u.name).localeCompare(String(b.u.name)))
    .map(x => x.u);
  return { hits: hits.slice(0, limit || 8), total: hits.length };
}

/* What a typed string resolves to. Returns { ok, user } or { ok:false, why },
   where `why` is a sentence rather than a code — it is printed as-is. */
function reviewResolvePerson(q, c){
  const raw = String(q || '').trim();
  if (!raw) return { ok: false, why: i18t('rv_pick_someone') };
  /* Accept what the list itself puts in the box ("Name — address"), so a value
     that was chosen and then re-read still resolves. */
  const typed = raw.indexOf('<') >= 0 ? raw.slice(raw.indexOf('<') + 1).replace('>', '').trim() : raw;
  const s = typed.toLowerCase();
  const all = (window.getUsers ? window.getUsers() : []);
  const me = _rvMe();
  let hit = all.find(u => u && _rvEmail(u.email) === s)
    || all.find(u => u && String(u.name || '').trim().toLowerCase() === s);
  if (!hit){
    /* One unambiguous partial match is a match. Two are a question. */
    const near = all.filter(u => u && (String(u.name || '').toLowerCase().indexOf(s) >= 0
      || _rvEmail(u.email).indexOf(s) >= 0));
    if (near.length === 1) hit = near[0];
    else if (near.length > 1) return { ok: false, why: i18t('rv_who_ambiguous', { n: near.length }) };
  }
  if (!hit) return { ok: false,
    why: _rvIsEmailish(typed) ? i18t('rv_who_not_a_member', { email: typed }) : i18t('rv_who_no_match') };
  if (me && String(hit.id) === String(me.id)) return { ok: false, why: i18t('rv_who_is_you') };
  if (hit.role === 'viewer') return { ok: false, why: i18t('rv_who_is_viewer', { who: hit.name }) };
  /* A FIFTH REFUSAL, and the one with a deadlock behind it: somebody who cannot
     open this contract at all. Only the named reviewer can lift a hold, so a
     request posted to them leaves the wording behind a wall with no key on this
     side of it. Answerable only where this browser knows their scope — an
     admin's does; the server refuses the same thing for everyone else. */
  if (c && c.folder && typeof window.canAccessFolder === 'function'){
    let reaches = true;
    try{ reaches = canAccessFolder(c.folder, hit); }catch(_){ reaches = true; }
    if (!reaches) return { ok: false, why: i18t('rv_who_no_stream', { who: hit.name }) };
  }
  return { ok: true, user: hit };
}

/* ---------- asking ---------- */
function reviewAsk(c, o = {}){
  reviewInit(c);
  /* THE ONE-AT-A-TIME RULE IS GONE. It made you read the whole contract, hold
     every worry in your head and escalate once at the end — the batch habit
     this feature exists to replace. Clause 5 goes to sales while you are still
     reading; clause 10 goes to procurement twenty minutes later; neither waits
     for the other. What is still refused is one CHANGE in two reviews, which
     reviewScope enforces by not offering it. */
  const who = o.reviewer || {};
  const name = String(who.name || '').trim();
  if (!name){ _rvSay(i18t('rv_pick_someone'), 'err'); return null; }
  const scope = reviewScope(c);
  if (!scope.all.length){ _rvSay(i18t('rv_nothing_to_review'), 'err'); return null; }
  /* ---- WHICH CHANGES, NOT ALL OF THEM ----
     A review used to sweep in everything outstanding, which is wrong about how
     people actually escalate: you are uneasy about the indemnity, not about all
     five redlines, and sending the other four with it stops the rest of the
     round for no reason. So the caller names the ids; the default stays
     everything, because that IS the common case and a dialog that starts with
     nothing ticked makes you do work to get back to it.

     Filtered against the live scope rather than trusted: an id that is not
     outstanding cannot be reviewed, whatever the caller believes. */
  const want = Array.isArray(o.ids) && o.ids.length ? new Set(o.ids.map(String)) : null;
  const chosen = want ? scope.all.filter(x => want.has(String(x.id))) : scope.all;
  if (!chosen.length){ _rvSay(i18t('rv_pick_changes'), 'err'); return null; }
  const me = _rvMe();
  const rv = {
    id: 'REV-' + (c.review.requests.length + 1),
    at: _rvNow(),
    by: String(o.by || (me && me.name) || 'System'),
    byId: (me && me.id) || null,
    reviewer: { id: who.id || null, name, email: who.email || null },
    note: _rvClamp(o.note, RV_NOTE_MAX) || null,
    due: String(o.due || '').trim() || null,
    /* WHAT WAS IN FRONT OF THEM WHEN THEY WERE ASKED. Recorded because the set
       moves: a change filed after the request is not something the reviewer was
       ever shown, and a review that silently swallowed it would let anybody
       slip wording past an open review by writing it a minute late. The gate
       reads the LIVE set and requires a verdict on all of it, so a late arrival
       shows up as unreviewed rather than as cleared. */
    changeIds: chosen.map(x => x.id),
    status: 'open',
    returnedAt: null, returnedBy: null, returnedNote: null,
  };
  c.review.requests.push(rv);
  const chOurs = chosen.filter(x => reviewSideOf(x) === 'ours').length;
  _rvAudit(c, 'Internal review',
    `Internal review requested from ${rv.reviewer.name} by ${rv.by} — ${chOurs} of our unsent change(s)`
    + ` and ${chosen.length - chOurs} of theirs in scope`
    + `${chosen.length < scope.all.length ? ` (${scope.all.length - chosen.length} outstanding change(s) deliberately left out)` : ''}`
    + `${rv.due ? `, due ${rv.due}` : ''}`
    + `${rv.note ? `; “${rv.note}”` : ''}`);
  return rv;
}
/* ============================================================
   DID THE COLLEAGUE ACTUALLY GET TOLD
   ============================================================
   THE OUTCOME USED TO BE A TOAST, and a toast is gone in seconds. The requester
   was left with no durable answer to the one question that decides whether they
   need to walk over and say something: is it in their inbox or not? Worse, the
   three ways it can fail to arrive look identical from that chair — email is not
   configured on this server at all (there is an internal outbox for exactly that
   case), the tick-box was cleared, or the provider refused the message. The two
   REFUSALS the server makes before it ever sends — not a member of this
   workspace, and no access to this contract's value stream — are their own
   errors and already say so in words; they come through here as a named failure
   rather than as silence.

   So the answer is recorded twice, in the two places that outlive a toast: on
   the review itself (rv.notice, which the banner and the card read) and in the
   audit trail. THE RECORD MUST SURVIVE A DEAD MAIL PROVIDER — the request is
   filed whatever the provider does, deliberately, and that rule is untouched:
   this runs after reviewAsk has already returned a review. */
const RV_DELIVERY = {
  sent:      { tone: 'green', k: 'rv_deliv_sent' },
  outbox:    { tone: 'amber', k: 'rv_deliv_outbox' },
  refused:   { tone: 'ruby',  k: 'rv_deliv_refused' },
  'not-asked': { tone: 'gray', k: 'rv_deliv_not_asked' },
};
function reviewNoteDelivery(c, rv, n){
  if (!c || !rv) return null;
  const o = n || {};
  const kind = o.sent ? 'sent'
    : !o.wanted ? 'not-asked'
    : o.outbox ? 'outbox'
    : 'refused';
  rv.notice = { kind, at: _rvNow(), to: o.to || rv.reviewer.email || null,
    why: _rvClamp(o.why, 300) || null };
  _rvAudit(c, 'Internal review', kind === 'sent'
    ? `Email sent to ${rv.reviewer.name}${rv.notice.to ? ` at ${rv.notice.to}` : ''} about ${rv.id}`
    : kind === 'not-asked'
      ? `No email was sent to ${rv.reviewer.name} about ${rv.id} — the requester chose to tell them themselves`
      : kind === 'outbox'
        ? `No email left this server for ${rv.reviewer.name} about ${rv.id} — email is not configured here, so the message is in the internal outbox`
        : `The email to ${rv.reviewer.name} about ${rv.id} was not delivered${rv.notice.why ? ` — ${rv.notice.why}` : ''}`);
  return rv.notice;
}
/* What the screens print. Returns null on an older review that was filed before
   any of this existed — an absent record is "we do not know", which is a
   different thing from "it failed", and printing the second would be inventing
   a fact. */
function reviewDeliveryState(rv){
  const n = rv && rv.notice;
  if (!n || !RV_DELIVERY[n.kind]) return null;
  const d = RV_DELIVERY[n.kind];
  return { kind: n.kind, tone: d.tone, at: n.at, to: n.to, why: n.why,
    text: i18t(d.k, { who: (rv.reviewer && rv.reviewer.name) || '', to: n.to || '' }) };
}
/* Cancel a NAMED review. With several open, "cancel the review" is ambiguous
   and picking the latest would quietly kill the wrong person's. */
function reviewCancel(c, o = {}){
  const open = reviewOpenList(c);
  const rv = o.reviewId ? open.find(r => r.id === o.reviewId) : (open.length === 1 ? open[0] : null);
  if (!rv){ if (open.length > 1) _rvSay(i18t('rv_which_review'), 'err'); return null; }
  /* YOU RAISED IT OR YOU RUN THE PLACE. There was no check here at all, so a
     colleague asked to look at one clause could withdraw somebody else's
     escalation — including the requester's, on a clause they were never shown.
     See reviewMayCancel. */
  const actor = o.by ? { name: o.by, id: o.byId || null, role: o.role } : _rvMe();
  if (!o.force && !reviewMayCancel(rv, actor)){
    _rvSay(i18t('rv_only_requester_cancels', { who: rv.by }), 'err');
    return null;
  }
  rv.status = 'cancelled';
  rv.returnedAt = _rvNow();
  const by = String(o.by || (_rvMe() && _rvMe().name) || 'System');
  _rvAudit(c, 'Internal review',
    `Internal review ${rv.id} cancelled by ${by} — it was with ${rv.reviewer.name}`);
  return rv;
}

/* ---------- marking one change ---------- */
function reviewMark(c, changeId, verdict, o = {}){
  const chFor = (window.negoChangeById ? window.negoChangeById(c, changeId) : null)
    || (c.changes || []).find(x => x && x.id === changeId);
  /* THE REVIEW THIS CHANGE IS IN, not "the" review. With several open, asking
     the contract for its review picks an arbitrary one, and the reviewer check
     below would then test the wrong person. */
  const rv = reviewOpenFor(c, chFor);
  if (!rv){
    /* TWO DIFFERENT REFUSALS. "No review is open" and "this change was not in
       the review you were asked about" are different mistakes, and the second
       is the one a reviewer with two contracts open actually makes. */
    _rvSay(reviewOpenList(c).length
      ? i18t('rv_not_in_review', { id: changeId })
      : i18t('rv_no_open_review'), 'err');
    return null;
  }
  const actor = o.by ? { name: o.by, id: o.byId || null } : _rvMe();
  /* THE REVIEWER, AND NOBODY ELSE. Not a UI courtesy: a verdict is the thing
     the gate reads, so anyone who could write one could clear their own wording
     and send it. The room's own rule in one more place — nobody rules on their
     own ask. */
  if (!o.force && !reviewIsReviewer(rv, actor)){
    _rvSay(i18t('rv_only_reviewer', { who: rv.reviewer.name }), 'err');
    return null;
  }
  const ch = (window.negoChangeById ? window.negoChangeById(c, changeId) : null)
    || (window.negoAllChanges ? window.negoAllChanges(c).find(x => x.id === changeId) : null);
  if (!ch) return null;
  /* The "not in this review" guard now lives at the top: reviewOpenFor either
     finds the review this change belongs to or there is nothing to rule on. */
  const side = reviewSideOf(ch);
  const allowed = side === 'ours' ? REVIEW_VERDICTS_OURS : REVIEW_VERDICTS_THEIRS;
  if (!allowed.includes(String(verdict))){
    _rvSay(side === 'ours' ? i18t('rv_verdict_ours_only') : i18t('rv_verdict_theirs_only'), 'err');
    return null;
  }
  /* Written onto the LIVE record, found through the change model rather than
     through the copy negoAllChanges hands back — that one is a spread, and a
     verdict written into a copy is a verdict nobody ever reads again. */
  const live = (window.negoChangeById ? window.negoChangeById(c, changeId) : null)
    || (c.changes || []).find(x => x && x.id === changeId);
  if (!live) return null;
  live.review = {
    verdict: String(verdict),
    note: String(o.note || '').trim() || null,
    by: String((actor && actor.name) || 'System'),
    byId: (actor && actor.id) || null,
    at: _rvNow(),
    /* The wording this verdict was given for. See reviewStale. */
    hash: live.hash || null,
    reviewId: rv.id,
  };
  _rvAudit(c, 'Internal review',
    `#${live.id} ${REVIEW_VERDICT_RECORD[verdict]} by ${live.review.by} in internal review ${rv.id}`
    + ` — “${live.summary || live.clauseLabel || live.clauseId}”`
    + `${live.review.note ? `; “${live.review.note}”` : ''}`);
  return live;
}

/* ---------- handing it back ----------
   A review is finished when the reviewer says it is, not when the last card
   happens to be marked: "I looked at all of it and here is what I think" is an
   act, and it is the thing the requester is waiting for.

   IT REFUSES TO BE FINISHED EARLY on our own asks, because those are the ones
   with a gate behind them. An unmarked ask of ours would sail through a
   "completed" review having been looked at by nobody. Advice on their asks is
   optional by design — a reviewer with nothing to add about the counterparty's
   wording should not have to invent something to close the review. */
function reviewReturn(c, o = {}){
  const actor = o.by ? { name: o.by, id: o.byId || null } : _rvMe();
  /* MINE, unless one is named. A reviewer hands back their own; they cannot
     close somebody else's, and with two open the contract cannot guess. */
  const open = reviewOpenList(c);
  const mine = open.filter(r => reviewIsReviewer(r, actor));
  const rv = o.reviewId ? open.find(r => r.id === o.reviewId)
    : (mine.length === 1 ? mine[0] : (open.length === 1 ? open[0] : null));
  if (!rv){
    _rvSay(open.length > 1 ? i18t('rv_which_review') : i18t('rv_no_open_review'), 'err');
    return null;
  }
  if (!o.force && !reviewIsReviewer(rv, actor)){
    _rvSay(i18t('rv_only_reviewer', { who: rv.reviewer.name }), 'err');
    return null;
  }
  /* THE REVIEW'S OWN SET, not everything outstanding. A change filed after the
     request, or one deliberately left out of it, was never in front of this
     reviewer — refusing to let them finish because of it would be asking them
     to rule on wording nobody showed them. */
  /* Counted over what is still ON THE TABLE, which is the same population the
     banner counts — the two must not disagree about what still wants a verdict,
     or the row nags for an answer the hand-back does not want and lets through
     an answer the row never asked for. See reviewInPlay. */
  const inRv = reviewInPlay(c, rv);
  const ourIn = inRv.filter(x => reviewSideOf(x) === 'ours');
  const unmarked = ourIn.filter(x => !reviewOn(x));
  if (unmarked.length){
    _rvSay(i18tn('rv_mark_all_first', unmarked.length, { n: unmarked.length }), 'err');
    return null;
  }
  rv.status = 'returned';
  rv.returnedAt = _rvNow();
  rv.returnedBy = String((actor && actor.name) || 'System');
  rv.returnedNote = String(o.note || '').trim() || null;
  const cleared = ourIn.filter(reviewCleared).length;
  const held = ourIn.filter(reviewHeld).length;
  const advised = inRv.filter(x => reviewSideOf(x) === 'theirs' && reviewOn(x)).length;
  rv.tally = { cleared, held, advised };
  _rvAudit(c, 'Internal review',
    `Internal review ${rv.id} returned by ${rv.returnedBy} to ${rv.by}`
    + ` — ${cleared} cleared to send, ${held} held back, ${advised} of the counterparty's asks advised on`
    + `${rv.returnedNote ? `; “${rv.returnedNote}”` : ''}`);
  return rv;
}

/* ---------- the gate ----------
   THE SETTING IS THE POINT, not the lock. Routing everything to the boss is how
   a review step becomes something people work around; routing the exceptions is
   how it becomes something they use. So the condition is the same vocabulary
   the approval rules already speak — always, only where the playbook was
   deviated from, or only above a value — and the default is OFF, because a gate
   nobody asked for that appears after an update is a product that broke. */
const REVIEW_GATE_DEFAULT = { on: false, when: 'deviation', value: 0 };
function reviewGateCfg(){
  const st = _rvState();
  const s = (st && st.settings) || {};
  const g = (s.reviewGate && typeof s.reviewGate === 'object') ? s.reviewGate : {};
  const when = ['always', 'deviation', 'value'].includes(g.when) ? g.when : REVIEW_GATE_DEFAULT.when;
  /* Whether somebody joining the workspace arrives CHECKED. Default true, and
     the default is what makes the per-person flag safe to ship: see
     reviewChecked below. */
  return { on: !!g.on, when, value: Number(g.value || 0), newChecked: g.newChecked !== false };
}
function saveReviewGateCfg(g){
  const st = _rvState();
  if (!st) return null;
  st.settings = st.settings || {};
  st.settings.reviewGate = { on: !!g.on,
    when: ['always', 'deviation', 'value'].includes(g.when) ? g.when : 'deviation',
    value: Number(g.value || 0),
    newChecked: g.newChecked === undefined ? reviewGateCfg().newChecked : !!g.newChecked };
  if (window.saveSettings) window.saveSettings();
  return st.settings.reviewGate;
}
/* ---- WHO IS CHECKED, AND BY WHOM ----
   The gate used to be one workspace-wide answer: either everybody's wording was
   looked at before it travelled or nobody's was. That is the wrong shape for
   why anybody turns it on — a firm checks the new joiner and the contractor,
   not the head of legal — and it made the switch an all-or-nothing decision
   most workspaces answered "off".

   THE MASTER SWITCH STILL DECIDES WHETHER ANY OF IT HAPPENS. Under it, each
   person carries their own flag, and the ABSENCE of that flag means CHECKED.
   That default is the whole migration: a workspace with the gate already on
   keeps behaving exactly as it did this morning, because every existing record
   is absent, and one that has it off is untouched either way. Turning somebody
   OFF is a decision an admin makes on purpose, one person at a time.

   A NAMED REVIEWER IS A CONVENIENCE, NOT A RULE. It fills the ask dialog's
   picker in for you; it does not restrict who may be asked, because the person
   who should look at a payment clause is not always the person who should look
   at an indemnity, and a hard binding would make the common case slower rather
   than the rare case safer. */
function reviewChecked(u){
  if (!u) return true;                     // nobody named = the old behaviour
  return u.reviewChecked !== false;
}
function reviewStandingReviewerFor(u){
  const id = u && u.reviewerId;
  if (!id) return null;
  const found = (window.getUsers ? window.getUsers() : []).find(x => x && String(x.id) === String(id));
  return found || null;
}
/* Who the workspace has taken OFF the check, named rather than counted — the
   settings panel prints this and an admin acts on names. */
function reviewUncheckedPeople(){
  return ((window.getUsers ? window.getUsers() : []) || []).filter(u => u && u.reviewChecked === false);
}
function reviewGateApplies(c, u){
  const cfg = reviewGateCfg();
  if (!cfg.on) return false;
  /* ONE ADDITIONAL QUESTION, ASKED IN THE PREDICATE rather than forked into
     every enforcement point. reviewGate, reviewSendBlock, contractReadiness,
     the banners and the server's own rvGateApplies all inherit it by reading
     this — a gate enforced in one place and not the other is how a live primary
     button ends up over a press that cannot work. */
  const who = (u === undefined) ? _rvMe() : u;
  if (!reviewChecked(who)) return false;
  if (cfg.when === 'always') return true;
  if (cfg.when === 'value') return Number((c && c.value) || 0) >= Number(cfg.value || 0);
  /* The playbook's own reading, borrowed rather than re-derived: js/approvals.js
     already answers "has this contract deviated" for the approval rules, and two
     answers to one question is how they come to disagree. */
  return !!(window.contractHasDeviation && window.contractHasDeviation(c));
}

/* Everything a screen needs to know about whether this contract may send, in
   one read. `ok` is the only thing a caller has to obey; the rest is so the
   refusal can be explained in a sentence instead of a shrug. */
function reviewGate(c){
  const unsent = (window.negoUnsentAsks ? window.negoUnsentAsks(c, 'owner') : []);
  const held = unsent.filter(reviewHeld);
  const sendable = unsent.filter(x => !reviewHeld(x));
  const open = reviewOpenList(c);
  const base = { held, sendable, unsent, open, unreviewed: [] };
  /* Nothing of ours is waiting to go, so there is nothing for a gate to hold.
     Handing the contract back with no asks outstanding is a legitimate move and
     always has been. */
  if (!unsent.length) return { ...base, required: false, ok: true, reason: 'nothing-unsent' };
  const required = reviewGateApplies(c);
  const unreviewed = sendable.filter(x => !reviewCleared(x));
  if (!required) return { ...base, unreviewed, required: false, ok: true, reason: 'not-required' };
  if (!sendable.length) return { ...base, unreviewed, required: true, ok: false, reason: 'all-held' };
  /* "With a reviewer" now means THESE changes are with one, not merely that
     some review is open somewhere on the contract. With a chosen subset the two
     came apart: a review of the indemnity alone would otherwise have locked the
     payment terms nobody had asked about, which is exactly the over-reach the
     subset exists to end. */
  if (open.length && sendable.some(x => reviewOutFor(c, x)))
    return { ...base, unreviewed, required: true, ok: false, reason: 'with-reviewer' };
  if (unreviewed.length) return { ...base, unreviewed, required: true, ok: false,
    reason: reviewRequests(c).length ? 'not-cleared' : 'never-requested' };
  return { ...base, unreviewed, required: true, ok: true, reason: 'cleared' };
}
/* ---------- A WARNING IS NOT A REFUSAL ----------
   With the rule switched OFF, sending wording that is sitting with a colleague
   is allowed — it is your contract and your call. It is also almost always a
   mistake, and one nobody notices: the review comes back the next morning with
   a verdict on wording the counterparty has already read.

   So the send asks. It says how many and who, and it offers the useful third
   option rather than only yes and no — send the rest and leave the ones being
   looked at behind. Where the rule is ON this never runs, because the gate has
   already refused; two different mechanisms for one fact would be two mechanisms
   to keep in step.

   Returns null when there is nothing to warn about. */
/* "Achieng Otieno", "Achieng Otieno and John Wayne", "Achieng Otieno, John
   Wayne and 2 others" — because with several reviews open every sentence that
   used to name one person now has to name a list without becoming a list. */
function reviewNames(list){
  const names = [...new Set(list.filter(Boolean))];
  if (!names.length) return i18t('rv_your_reviewer');
  if (names.length === 1) return names[0];
  if (names.length === 2) return i18t('rv_two_names', { a: names[0], b: names[1] });
  return i18t('rv_many_names', { a: names[0], b: names[1], n: names.length - 2 });
}
/* Who is holding our unsent wording right now — named only where this reader is
   entitled to the name. reviewNames already falls back to "your reviewer" on an
   empty list, so a reader outside every open review gets a sentence that is
   true, useful and carries nobody's name. */
function reviewWaitingOn(c){
  return reviewNames(reviewAwaiting(c).map(x => reviewOutNameFor(c, x)));
}
function reviewSendWarning(c){
  const waiting = reviewAwaiting(c);
  if (!waiting.length) return null;
  const held = reviewHeldIds(c);
  const rest = (window.negoUnsentAsks ? window.negoUnsentAsks(c, 'owner') : [])
    .filter(x => !held.has(x.id) && !reviewOutFor(c, x));
  const who = reviewWaitingOn(c);
  return {
    n: waiting.length,
    who,
    ids: waiting.map(x => x.id),
    restIds: rest.map(x => x.id),
    text: i18tn('rv_warn_waiting', waiting.length, { n: waiting.length, who, rest: rest.length }),
  };
}

/* The refusal in one sentence, or null when there is nothing to refuse. Every
   send door calls this and prints exactly what it returns, so the workbench,
   the share dialog and the readiness panel cannot each invent their own account
   of the same rule. */
function reviewGateMessage(c){
  const g = reviewGate(c);
  if (g.ok) return null;
  if (g.reason === 'all-held')
    return i18tn('rv_gate_all_held', g.held.length, { n: g.held.length,
      who: reviewVerdictByFor(g.held[0], null, c) || i18t('rv_your_reviewer') });
  if (g.reason === 'with-reviewer')
    return i18t('rv_gate_with_reviewer', { who: reviewWaitingOn(c) });
  if (g.reason === 'never-requested')
    return i18tn('rv_gate_never_requested', g.unreviewed.length, { n: g.unreviewed.length });
  return i18tn('rv_gate_not_cleared', g.unreviewed.length, { n: g.unreviewed.length });
}

/* ---------- what to say about it ----------
   ONE reading of the state, handed to every screen that draws a banner. The
   phone, the workbench, the contract room and the readiness panel all print
   this; a second opinion anywhere would be a screen that disagrees with the
   screen next to it about whether the boss has answered. */
/* How many of a given review's changes still want an answer. Counted over the
   review's OWN ids rather than over what is outstanding on the contract — with
   several open, the contract's total is nobody's total.

   AND OVER WHAT IS STILL ON THE TABLE, not over what is still unsent. Those are
   different sets the moment a round is handed over, and counting the wrong one
   printed "0 of 0 still need your verdict" over a change the reviewer could
   open, read and rule on. See reviewInPlay. */
function reviewProgress(c, rv){
  const all = reviewInPlay(c, rv);
  const marked = all.filter(x => reviewOn(x)).length;
  return { total: all.length, marked, left: all.length - marked };
}
const _rvToday = () => new Date().toISOString().slice(0, 10);

/* THE STATE IS NOW A LIST, and the phase is about the READER rather than about
   the contract. With reviews running in parallel a contract can be waiting on
   two people while this reader owes a verdict on a third — "the phase" stopped
   being a single fact. So: `mine` is what this person has to answer, `waiting`
   is what is out with others, and `phase` names whichever of those the banner
   should lead with. `rv` is kept pointing at the first of the leading group so
   the callers that only ever wanted one review still read correctly. */
function reviewState(c){
  const open = reviewOpenList(c);
  const last = reviewLastOf(c);
  const scope = reviewScope(c);
  const me = _rvMe();
  const gate = reviewGate(c);
  const mineList = open.filter(r => reviewIsReviewer(r, me));
  const waitingList = open.filter(r => !reviewIsReviewer(r, me));
  const base = { open, mine: mineList, waiting: waitingList, gate, scope,
    progress: rv => reviewProgress(c, rv) };
  if (mineList.length){
    const rv = mineList[0];
    const p = reviewProgress(c, rv);
    return { ...base, phase: 'yours', rv, total: p.total, marked: p.marked,
      overdue: !!(rv.due && String(rv.due) < _rvToday()) };
  }
  if (waitingList.length){
    const rv = waitingList[0];
    const n = waitingList.reduce((a, r) => a + reviewProgress(c, r).total, 0);
    return { ...base, phase: 'waiting', rv, total: n, marked: 0,
      overdue: waitingList.some(r => r.due && String(r.due) < _rvToday()) };
  }
  if (last && last.status === 'returned')
    return { ...base, phase: 'returned', rv: last,
      total: scope.all.length, marked: scope.all.filter(x => reviewOn(x)).length };
  return { ...base, phase: 'none', rv: last || null, total: scope.all.length, marked: 0 };
}

/* Contracts sitting on this person's desk. Read by the dashboard, and by
   nothing else — it is a filter over state.contracts, which the server has
   already scoped, so it can only ever list paper the reader may see. */
function reviewInboxFor(cs, u){
  const me = u || _rvMe();
  if (!me) return [];
  return (cs || []).filter(c => {
    return reviewOpenList(c).some(rv => reviewIsReviewer(rv, me));
  }).map(c => ({ c, rv: reviewMineOpen(c, me)[0] || reviewOpenOf(c), st: reviewState(c) }));
}

/* ============================================================
   THE SHARED DRAWING

   Both change-card renderers call these, and so does the phone. The project's
   own rule, learned the day formatting-only changes shipped: a fix in a shared
   FUNCTION reaches both shells, a fix in a renderer reaches one. The review
   badge and the reviewer's verbs are therefore built HERE and never in a view.
   ============================================================ */

/* ---- WHICH SEATS MAY SEE ANY OF THIS ----
   ONE predicate, asked by the chip, the verbs and the banner alike, because
   three separate readings of "is this the counterparty looking" is how two of
   them end up agreeing and the third does not.

   THREE LOCKS, and none of them is redundant. `readonly` covers the executed
   contract and the spent link. `side === 'counterparty'` covers the owner's own
   Counterparty View, which is a window onto their seat and mounts read-only —
   but a future mount that forgets the flag must still be walled. PORTAL_MODE
   covers the counterparty's real page, which is a different origin with a
   different payload and should never have reached here at all.

   What is behind the wall is not just the reviewer's name. It is the EXISTENCE
   of a hold: "we are arguing internally about clause 6" is worth money to the
   other side, and a chip reading "Held back" would say it on every repaint. */
function reviewSeatShowsReview(opts){
  if (typeof window !== 'undefined' && window.PORTAL_MODE) return false;
  const o = opts || {};
  if (o.readonly) return false;
  if (o.side === 'counterparty') return false;
  return true;
}

/* The badge a change wears once somebody has ruled on it. Tone carries the
   meaning for a glance; the words carry it for everyone else. */
/* ---------- WAITING IS NOT REFUSED ----------
   Asked for as "turn it red". Red is the wrong colour, and the reason is worth
   writing down: everywhere else in this product ruby means REFUSED — a rejected
   ask, a contested clause, a change your reviewer HELD. A change merely sitting
   with somebody is not a refusal; it is in flight, and it may well come back
   cleared.

   Paint both states red and the one that matters disappears into the one that
   does not: the card your boss actually stopped looks identical to the four
   they have not opened yet. So waiting takes amber — the colour this app
   already uses for "something is pending on this", and the colour the review
   banner above it is already wearing — and ruby stays reserved for a hold.
   Two states, two colours, and the difference is the whole point. */
function reviewChipHtml(ch, opts, c){
  if (!reviewSeatShowsReview(opts)) return '';
  /* OUT IS EVERYBODY'S BUSINESS; WHO HAS IT IS NOT. A colleague working this
     contract needs to know a change cannot be sent yet. Learning that Legal
     specifically are on it is the requester's information to give. So the chip
     stays and the name drops out for anyone who is not in that review. */
  const out = c ? reviewOutFor(c, ch) : null;
  if (out){
    const named = c ? reviewOutNameFor(c, ch) : null;
    return `<span class="rv-chip" data-rv-chip="${_rvE(ch.id)}" data-rv-verdict="waiting"
    title="${_rvE(named ? i18t('rv_waiting_title', { who: named }) : i18t('rv_waiting_title_anon'))}"
    style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;letter-spacing:.01em;
    border-radius:0;padding:2px 7px;background:var(--st-amber-bg);
    color:var(--st-amber-fg);border:1px solid currentColor">
    ${''/* A NAME ON A CARD IS A GLANCE (13 Aug 2026) — cardName, js/core.js,
           the same function the card's own status slot and meta line use. The
           whole name is in this chip's title, one attribute above. */}
    <span aria-hidden="true">&#8987;</span> ${_rvE(named
      ? i18t('rv_with_who', { who: window.cardName ? cardName(named) : named })
      : i18t('rv_out_for_review'))}</span>`;
  }
  const v = reviewOn(ch);
  if (!v) return '';
  const stale = reviewStale(ch);
  const tone = v.verdict === 'held' ? 'ruby'
    : v.verdict === 'cleared' ? 'green' : 'slate';
  const bg = { ruby: 'var(--st-ruby-bg)', green: 'var(--st-green-bg)', slate: 'var(--color-bg)' }[tone];
  const fg = { ruby: 'var(--st-ruby-fg)', green: 'var(--st-green-fg)', slate: 'var(--color-neutral-700)' }[tone];
  const word = reviewVerdictLabel(v.verdict);
  /* Same rule for a verdict already given: the word, always; the name and the
     reviewer's note, only to the two people in that review and to an admin. */
  const by = c ? reviewVerdictByFor(ch, null, c) : null;
  /* The TITLE keeps the whole name, and it is the only place a name appears
     in this branch of the chip — the visible text is the verdict word alone,
     so there is nothing here to shorten. */
  const title = by ? `${word} — ${by}${v.note ? ': ' + v.note : ''}` : word;
  return `<span class="rv-chip" data-rv-chip="${_rvE(ch.id)}" data-rv-verdict="${_rvE(v.verdict)}"${
    stale ? ' data-rv-stale="1"' : ''}
    title="${_rvE(title)}"
    style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;letter-spacing:.01em;
    border-radius:0;padding:2px 7px;background:${bg};color:${fg};border:1px solid currentColor">
    <span aria-hidden="true">${v.verdict === 'held' ? '&#9209;' : v.verdict === 'cleared' ? '&#10003;' : '&#128172;'}</span>
    ${_rvE(word)}${stale ? ` · ${_rvE(i18t('rv_moved_since'))}` : ''}</span>`;
}

/* The reviewer's verbs, on the reviewer's screen only. Everyone else sees the
   chip above and nothing to press: a card that offers a verdict to somebody
   whose verdict the model will refuse is a card that lies. */
function reviewVerbsHtml(c, ch, opts = {}){
  if (!reviewSeatShowsReview(opts)) return '';
  /* THE REVIEW THIS CHANGE IS IN, AND IT MUST BE MINE. Asking "is a review of
     mine open" and then "is this change in ANY open review" are two true
     statements that together say something false: with sales and procurement
     both reviewing, sales was drawn the verdict buttons on procurement's
     clause. reviewMark refused the press, so nothing was ever written — but a
     button that cannot work is a card that lies, which is what the comment
     above already said. */
  const rv = reviewOpenFor(c, ch);
  if (!rv || !reviewIsReviewer(rv)) return '';
  const cur = reviewOn(ch);
  const on = v => cur && cur.verdict === v;
  const btn = (v, cls, label, title) => `<button type="button" class="rv-btn ${cls}"
    data-rv-mark="${_rvE(ch.id)}" data-rv-verdict="${_rvE(v)}" aria-pressed="${on(v) ? 'true' : 'false'}"
    title="${_rvE(title)}"
    style="font:inherit;font-size:12px;font-weight:700;cursor:pointer;border-radius:0;padding:3px 8px;
    border:1.5px solid ${on(v) ? 'currentColor' : 'var(--color-divider)'};
    background:${on(v) ? 'color-mix(in srgb,currentColor 12%,transparent)' : 'var(--color-surface)'};
    color:${cls === 'rv-hold' ? 'var(--st-ruby-fg)' : cls === 'rv-clear' ? 'var(--st-green-fg)' : 'var(--color-neutral-700)'}">${_rvE(label)}</button>`;
  const verbs = reviewSideOf(ch) === 'ours'
    ? [btn('cleared', 'rv-clear', i18t('rv_v_cleared'), i18t('rv_clear_title')),
       btn('held', 'rv-hold', i18t('rv_v_held'), i18t('rv_hold_title'))]
    : [btn('advise-accept', 'rv-adv', i18t('rv_v_adv_accept'), i18t('rv_advice_title')),
       btn('advise-reject', 'rv-adv', i18t('rv_v_adv_reject'), i18t('rv_advice_title')),
       btn('advise-discuss', 'rv-adv', i18t('rv_v_adv_discuss'), i18t('rv_advice_title'))];
  return `<div class="rv-verbs" data-rv-for="${_rvE(ch.id)}"
    style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-top:7px;padding-top:7px;border-top:1px dashed var(--color-divider)">
    <span style="font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600)">${_rvE(i18t('rv_your_verdict'))}</span>
    ${verbs.join('')}
    <button type="button" class="rv-btn rv-note" data-rv-note="${_rvE(ch.id)}"
      title="${_rvE(i18t('rv_note_title'))}"
      style="font:inherit;font-size:12px;font-weight:600;cursor:pointer;border-radius:0;padding:3px 8px;
      border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-neutral-700)">${_rvE(i18t('rv_note_btn'))}</button>
  </div>`;
}

/* ---- CANCEL, WHERE THE CHANGE IS (12 Aug 2026) ----
   THE VERB WAS NEVER MISSING; IT WAS UNFINDABLE. Cancel has always lived in the
   review notice, and since 10 August every notice on that page arrives FOLDED
   behind a bell in the bottom-right corner. So a requester looking at a change
   their colleague is sitting on had a button that existed and effectively could
   not be found, and the review read as one that could not be called off.

   Two answers, both taken, because they cover different moments. The stack now
   arrives UNFOLDED while a review is actually in play (see reviewWantsAttention
   and rlNoticesFolded), so the banner's own Cancel is on screen without a
   press; and the change card carries its own, beside the status that says why
   it cannot be sent — which is where somebody is standing when they decide the
   escalation was a mistake.

   FOUR RULES CARRIED OVER WHOLE, and each is load-bearing:
     · REQUESTER OR ADMIN ONLY. reviewMayCancel is the one predicate, and a
       reviewer must never be offered a Cancel for a review they were asked to
       carry out.
     · IT NAMES WHICH REVIEW, by the CHANGE ids it covers — reviewTagsFor, which
       says "CHG-017" rather than "REV-2", because REV-2 is an internal handle
       nobody outside this file has ever seen.
     · IT SAYS WHAT CANCELLING COSTS before the press, not after: the reviewer
       may already have cleared or held clauses, and those verdicts go with the
       review.
     · THE COUNTERPARTY MUST NEVER LEARN A REVIEW HAPPENED. reviewSeatShowsReview
       is the one predicate for that question and this asks it first, like every
       other surface in this file. */
function reviewCardCancelHtml(c, ch, opts = {}){
  if (!reviewSeatShowsReview(opts)) return '';
  const rv = reviewOpenFor(c, ch);
  if (!rv || !reviewMayCancel(rv)) return '';
  return `<button type="button" class="rl-rej rv-cancel-card" data-rv-cancel="${_rvE(rv.id)}"
    title="${_rvE(i18t('rv_cancel_card_title', { who: rv.reviewer.name, ids: reviewTagsFor(rv) }))}"
    >${_rvE(i18t('rv_cancel_btn'))}</button>`;
}
/* What cancelling costs, in the reviewer's own numbers, asked before the press.
   Returns the sentence; the caller puts it in a confirm. */
function reviewCancelCost(c, rv){
  const p = reviewProgress(c, rv);
  const done = Math.max(0, (p.total || 0) - (p.left || 0));
  return i18t('rv_cancel_cost', { who: rv.reviewer.name,
    ids: reviewTagsFor(rv), done, total: p.total || 0 });
}
/* IS A REVIEW ASKING FOR THIS READER'S ATTENTION RIGHT NOW — the predicate the
   notice stack asks to decide whether to arrive open. Only reviews still IN
   PLAY: a review that came back days ago is news, and news folds. */
function reviewWantsAttention(c){
  if (!c || !reviewSeatShowsReview({})) return false;
  try{
    const st = reviewState(c);
    if (st.mine && st.mine.length) return true;
    return !!(st.waiting || []).filter(rv => reviewMaySee(rv)).length;
  }catch(_){ return false; }
}
/* The banner. Four states, and each one names the person it is waiting on —
   "in review" with no name is the status flip this feature exists to replace. */
/* ---- CLEARED FOR THIS SITTING, NOT FOR GOOD ----
   Reported from the field (Young, 09 Aug 2026): with two reviews open the
   banner takes a third of the workbench, above the contract you are trying to
   read. So it clears — and it clears for the session only, in memory, so a
   refresh brings it back and nothing about the state is ever permanently
   hidden. There is always a way to clear it again.

   Kept per contract: clearing the notice on one agreement says nothing about
   the next one. Not persisted anywhere on purpose — a dismissal that outlives
   the tab is how somebody stops being told their colleague is holding wording,
   for weeks, and never finds out why the send is refusing. */
const _rvCleared = new Set();
function reviewBannerCleared(c){ return !!(c && _rvCleared.has(String(c.id))); }
function reviewClearBanner(c){ if (c) _rvCleared.add(String(c.id)); }
function reviewUnclearBanner(c){ if (c) _rvCleared.delete(String(c.id)); }

function reviewBannerHtml(c, opts = {}){
  if (!c || !reviewSeatShowsReview(opts)) return '';
  if (reviewBannerCleared(c)) return '';
  const st = reviewState(c);

  /* ---- THE BANNER IS A LIST OF ROWS, NOT A STATE MACHINE ----
     It used to branch: one phase won, and everything the reader also needed to
     know was thrown away with the branches that lost. That is how a reviewer
     who had just handed a review back was shown nothing at all if a colleague
     still had one open — and, when nothing else was open, was shown the
     REQUESTER's banner about themselves, in the third person, with the
     requester's "Ask again" on it. Reported as exactly that (Young, 09 Aug
     2026): the states were checked one at a time, and the reader was not.

     So the question is asked once per row and always from the reader's chair:
     what do I owe, what am I waiting on, what came back to me, what was taken
     off me. A reader with none of those gets no banner. */
  const rows = [];
  let tone = 'amber';
  const act = (id, label) => `<button type="button" data-rv-act="${id}"
    style="flex:none;font:inherit;font-size:12px;font-weight:700;cursor:pointer;border-radius:0;padding:4px 10px;
    border:1.5px solid currentColor;background:transparent;color:inherit">${_rvE(label)}</button>`;
  const line = (body, button) => `<div style="display:flex;align-items:flex-start;gap:10px;width:100%">
    <span style="flex:1;min-width:0">${body}</span>${button || ''}</div>`;

  /* 1. WHAT I OWE A VERDICT ON. No button: the toolbar is the one hand-back
     door and it asks which review — see openReviewReturnPicker. */
  for (const rv of st.mine){
    const p = st.progress(rv);
    rows.push(line(`<b>${_rvE(i18t('rv_banner_yours', { who: rv.by }))}</b>
      <span style="font-family:var(--font-mono);font-size:12px;opacity:.85">${_rvE(reviewTagsFor(rv))}</span>
      ${rv.note ? `<span title="${_rvE(rv.note)}">“${_rvE(_rvClamp(rv.note, 120))}” </span>` : ''}${
        _rvE(i18tn('rv_banner_yours_sub', p.left, { n: p.left, total: p.total }))}
      ${rv.due ? `<b>${_rvE(i18t('rv_due', { when: rv.due }))}</b>` : ''}`));
  }
  /* 2. WHAT IS OUT WITH SOMEBODY ELSE — only the ones I am entitled to know
     about, and the Cancel only where I could actually use it. */
  for (const rv of st.waiting){
    if (!reviewMaySee(rv)) continue;
    const p = st.progress(rv);
    /* ---- AND WHETHER THEY WERE ACTUALLY TOLD ----
       Recorded on the review when it was raised (reviewNoteDelivery) rather
       than shouted once in a toast and lost. Silent on an older review that
       carries no record: "we do not know" is a different fact from "it failed",
       and printing the second would be inventing one. */
    const d = reviewDeliveryState(rv);
    const dline = d ? `<span style="display:block;margin-top:2px;opacity:.9">${
      d.kind === 'sent' ? '&#9993;' : '&#9888;'} ${_rvE(d.text)}${
      d.why ? ` <span style="opacity:.8">&mdash; ${_rvE(d.why)}</span>` : ''}</span>` : '';
    rows.push(line(`<b>${_rvE(i18t('rv_banner_waiting', { who: rv.reviewer.name }))}</b>
      <span style="font-family:var(--font-mono);font-size:12px;opacity:.85">${_rvE(reviewTagsFor(rv))}</span>
      ${_rvE(i18tn('rv_banner_waiting_sub', p.total, { n: p.total, when: reviewWhen(rv.at) }))}
      ${rv.due ? `<b>${_rvE(i18t('rv_due', { when: rv.due }))}</b>` : ''}${dline}`,
      reviewMayCancel(rv) ? act('rv-cancel:' + rv.id, i18t('rv_cancel_btn')) : ''));
  }
  /* 3. WHAT CAME BACK, or was taken off me. The most recent closed review this
     reader is actually in — a colleague outside it is told nothing, which is
     the same rule the open rows follow.

     AND NEWS STOPS BEING NEWS. Reported from the field (Young, 09 Aug 2026): a
     "X withdrew the review they asked you for" row was still sitting on the
     workbench long after every clause it covered had been decided and closed —
     "they serve no purpose but taking up space". It is worth saying while there
     is still something to do about it: a hand-back is the requester's cue to
     act on the wording, and a withdrawal explains why a reviewer's column just
     un-narrowed. Once the clauses themselves are off the table both sentences
     are about a job nobody can do any more, and the history is where a finished
     job belongs. So the row lives exactly as long as its subject does. */
  const closed = reviewRequests(c).filter(r =>
    r && r.status !== 'open' && reviewMaySee(r) && reviewInPlay(c, r).length);
  const news = closed.length ? closed[closed.length - 1] : null;
  if (news && news.status === 'returned'){
    const t = news.tally || { cleared: 0, held: 0, advised: 0 };
    if (t.held) tone = 'ruby'; else if (!rows.length) tone = 'green';
    const sub = `${_rvE(i18t('rv_banner_returned_sub', { cleared: t.cleared, held: t.held, advised: t.advised }))}
      ${news.returnedNote ? `<span style="display:block;margin-top:3px">“${_rvE(_rvClamp(news.returnedNote, 240))}”</span>` : ''}`;
    /* THE REVIEWER IS TOLD NOTHING, because there is nothing to tell them: they
       did this, they were toasted at the time, and a permanent notice about a
       finished job — one that does not even say which clauses it covered — is
       the definition of noise. Asked for by name (Young, 09 Aug 2026): "just
       delete it completely." The news belongs to the person who is now waiting
       to act on it. */
    if (!(reviewIsReviewer(news) && !reviewIsRequester(news)))
      rows.push(line(`<b>${_rvE(i18t('rv_banner_returned', { who: news.returnedBy || news.reviewer.name }))}</b> ${sub}`,
        act('rv-ask', i18t('rv_ask_again_btn'))));
  }
  /* A WITHDRAWN REVIEW LEAVES NO PHASE BEHIND. The people who cancelled it need
     no notice; the person it was taken from does — otherwise their column
     quietly un-narrows and nothing anywhere says why. */
  if (news && news.status === 'cancelled' && reviewIsReviewer(news) && !reviewIsRequester(news))
    rows.push(line(`<b>${_rvE(i18t('rv_banner_cancelled_you', { who: news.by }))}</b>`));

  /* 4. AND THE GATE, when it wants a review nobody has asked for yet. */
  if (!rows.length && st.gate.required && !st.open.length)
    rows.push(line(`<b>${_rvE(i18t('rv_banner_gate'))}</b> ${_rvE(reviewGateMessage(c) || '')}`,
      act('rv-ask', i18t('rv_ask_btn'))));
  else if (st.gate.required && st.waiting.filter(rv => reviewMaySee(rv)).length)
    rows.push(`<span style="font-size:12px">${_rvE(i18t('rv_gate_holds_send'))}</span>`);

  if (!rows.length) return '';
  const bg = { amber: 'var(--st-amber-bg)', green: 'var(--st-green-bg)', ruby: 'var(--st-ruby-bg)' }[tone];
  const fg = { amber: 'var(--st-amber-fg)', green: 'var(--st-green-fg)', ruby: 'var(--st-ruby-fg)' }[tone];
  const ln = { amber: 'var(--st-amber-line)', green: 'var(--st-green-line)', ruby: 'var(--st-ruby-line)' }[tone];
  return `<div class="rv-banner" data-rv-banner="${_rvE(st.phase)}"
    style="display:flex;align-items:flex-start;gap:10px;padding:10px 13px;margin:0 0 10px;border-radius:0;
    border:1px solid ${ln};background:${bg};color:${fg};font-size:13px;line-height:1.5">
    <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:9px">${rows.join('')}</span>
    <button type="button" data-rv-act="rv-clear" aria-label="${_rvE(i18t('rv_clear_banner'))}"
      title="${_rvE(i18t('rv_clear_banner'))}"
      style="flex:none;align-self:flex-start;font:inherit;font-size:15px;line-height:1;cursor:pointer;
      border:0;background:transparent;color:inherit;opacity:.65;padding:1px 2px;margin:-1px -3px 0 2px">&times;</button></div>`;
}
function reviewWhen(at){
  if (!at) return '';
  try{ return window.fmtDT ? window.fmtDT(at) : String(at).slice(0, 10); }catch(_){ return String(at).slice(0, 10); }
}

/* ============================================================
   THE SCREENS' OWN ACTS — one modal, one wiring, called from everywhere
   ============================================================ */

/* ---- THE FIELDS LOOK LIKE FIELDS ----
   These carried `class="ui-input"`, which is not a class this application
   defines anywhere — so every input and select in this feature rendered with
   the browser's own bare styling, and the reviewer picker in particular read as
   a line of text somebody had left lying on the dialog rather than the one
   control the whole dialog exists to set. Reported from the field as "the field
   to choose who to send it to is too hidden", which is exactly what it was.

   The real styles are core.js's own FLD/LBL, quoted here rather than imported:
   they are two string constants declared inside openShareModal and not exported,
   and a copy that says where it came from is better than a shared token nobody
   can find. If the share dialog's fields are restyled, restyle these. */
/* These were a deliberate COPY of core.js's FLD/LBL, with a note saying to
   restyle them together — and they had already drifted 2px from what they
   quoted. Both now read the same tokens, so the copy cannot drift again. */
const RV_FLD = 'width:100%;min-height:var(--field-h);border:1px solid var(--field-line);background:var(--color-surface);border-radius:0;padding:var(--field-pad-y) var(--field-pad-x);font-size:var(--field-size);font-family:var(--font-body);color:var(--color-text);line-height:var(--field-lh);';
const RV_LBL = 'display:block;font-size:var(--field-label-size);font-weight:var(--field-label-weight);color:var(--color-neutral-600);margin-bottom:var(--field-label-gap);font-family:var(--font-body);letter-spacing:var(--ls-base);';

/* ---- AND THE DIALOGS LOOK LIKE THE PRODUCT'S DIALOGS ----
   Eight of them across this file and js/desk.js opened as a heading, a grey
   sentence and a stack of fields on plain white. Reported beside a screenshot
   of the share dialog (Young, 10 Aug 2026): "add some light color and
   character to the pop ups ... They are currently very bland."

   ONE head, built here and called from both files, for the reason the map
   opens with: eight dialogs dressed eight times is six that get updated and
   two that do not. The classes are defined in index.html — and they are real
   classes, which is the other lesson this feature learned the hard way with
   `ui-input`.

   The glyph is an EMOJI rather than an icon set, because icon() is core.js's
   and this file is loaded on stages that do not have it. */
function reviewDialogHeadHtml(glyph, title, sub){
  return `<div class="rvd-head">
    <span class="rvd-ico" aria-hidden="true">${glyph}</span>
    <span class="rvd-htxt">
      <h2 class="rvd-title">${_rvE(title)}</h2>
      ${sub ? `<p class="rvd-sub">${_rvE(sub)}</p>` : ''}
    </span>
  </div>`;
}

/* One row of the picker's list. Name, address and role — the address because it
   is what disambiguates two people with one name, and because it is what the
   person searching usually has in front of them. */
/* `prefix` so the desk's picker can reuse the row without borrowing the
   review's element ids — two lists on two dialogs must not answer to the same
   aria-activedescendant. */
function reviewPersonRowHtml(u, active, prefix){
  return `<li role="option" id="${_rvE(prefix || 'rv')}-opt-${_rvE(u.id)}" aria-selected="${active ? 'true' : 'false'}"
    data-rv-pick="${_rvE(u.id)}"
    style="display:flex;gap:9px;align-items:baseline;padding:7px 11px;cursor:pointer;
    background:${active ? 'var(--color-accent-100)' : 'transparent'}">
    <span style="flex:none;font-size:14px;font-weight:600;color:var(--color-text)">${_rvE(u.name)}</span>
    <span style="flex:1;min-width:0;font-size:12px;font-family:var(--font-mono);color:var(--color-neutral-600);
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_rvE(u.email || '')}</span>
    <span style="flex:none;font-size:12px;color:var(--color-neutral-500)">${
      _rvE(u.role ? (window.roleName ? window.roleName(u.role) : u.role) : '')}</span>
  </li>`;
}

/* The list panel, rebuilt on every keystroke. Capped, and it SAYS it is capped:
   a list silently cut at eight reads as "those are all the matches". */
function reviewPickerListHtml(q, activeId, c, cfg = {}){
  const r = (cfg.search || reviewSearchPeople)(q, 8, c);
  const prefix = cfg.prefix || 'rv';
  if (!r.hits.length)
    return `<li style="padding:9px 11px;font-size:13px;color:var(--color-neutral-600)">${
      _rvE(_rvIsEmailish(q) ? i18t('rv_who_not_a_member', { email: String(q).trim() }) : i18t('rv_who_no_match'))}</li>`;
  const more = r.total - r.hits.length;
  return r.hits.map(u => reviewPersonRowHtml(u, String(u.id) === String(activeId), prefix)).join('')
    /* STICKY, because it is a promise about the list rather than a row in it.
       Left in the normal flow it sat below eight rows in a scrolling box — so
       the one line telling you there are three hundred more people required
       scrolling to find, which is the exact failure it exists to prevent. */
    + (more > 0 ? `<li style="position:sticky;bottom:0;padding:7px 11px;font-size:12px;
        color:var(--color-neutral-600);background:var(--color-bg);
        border-top:1px solid var(--color-divider)">${_rvE(i18tn('rv_who_more', more, { n: more }))}</li>` : '');
}

function reviewAskModalHtml(c, opts = {}){
  const scope = reviewScope(c);
  /* Opened from a card: that change is the one ticked, and the others are
     offered unticked in case the reader wants to add to it. */
  const pre = Array.isArray(opts.ids) && opts.ids.length ? new Set(opts.ids.map(String)) : null;
  const on = ch => !pre || pre.has(String(ch.id));
  const people = reviewCandidates(c);
  const today = new Date(); today.setDate(today.getDate() + 2);
  const due = today.toISOString().slice(0, 10);
  /* ---- ONE TICK PER CHANGE ----
     Everything starts ticked, because "all of it" is the common case and a
     dialog that opens empty makes you work to get back to the default. What
     matters is that unticking is possible at all: you are uneasy about the
     indemnity, not about all five redlines, and a review that dragged the other
     four along stops the rest of the round for no reason. */
  const row = ch => `<li style="display:flex;gap:9px;align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--color-divider)">
    <input type="checkbox" class="rv-pickch" data-rv-ch="${_rvE(ch.id)}"${on(ch) ? ' checked' : ''}
      aria-label="${_rvE(i18t('rv_include_aria', { id: ch.id }))}" style="margin-top:3px;flex:none"/>
    <span style="flex:none;font-family:var(--font-mono);font-size:12px;font-weight:700;border:1.5px solid var(--color-accent);
      color:var(--color-accent);border-radius:0;padding:1px 6px;margin-top:1px">#${_rvE(ch.id)}</span>
    <span style="flex:1;min-width:0">
      <span style="display:block;font-size:13px;font-weight:600;line-height:1.4">${_rvE(ch.summary || '')}</span>
      <span style="display:block;font-size:12px;color:var(--color-neutral-600)">${_rvE(ch.clauseLabel || ch.clauseId || '')}</span>
    </span></li>`;
  return `
  ${reviewDialogHeadHtml('&#128100;', i18t('rv_modal_title'), i18t('rv_modal_sub'))}
  <div class="rvd-body">

    ${people.length ? `
    <div style="margin-bottom:12px">
      <label for="rv-who" style="${RV_LBL}">${_rvE(i18t('rv_who'))}</label>
      <div style="position:relative">
        ${''/* PREFILLED FROM THE ASKER'S OWN STANDING REVIEWER, where an admin
               has named one. It is a convenience and not a binding: the box is
               ordinary text and resolves whatever is typed over it, so naming
               a reviewer makes the common case one press shorter without ever
               making the uncommon one impossible. */}
        <input id="rv-who" type="text" role="combobox" autocomplete="off" spellcheck="false"
          aria-expanded="false" aria-controls="rv-who-list" aria-autocomplete="list"
          value="${_rvE((()=>{ const st=reviewStandingReviewerFor(_rvMe());
            return st ? (st.email ? st.name + ' <' + st.email + '>' : st.name) : ''; })())}"
          placeholder="${_rvE(i18t('rv_who_ph'))}"
          style="${RV_FLD}padding-right:30px"/>
        <button type="button" id="rv-who-caret" tabindex="-1" aria-label="${_rvE(i18t('rv_who_show_all'))}"
          style="position:absolute;right:1px;top:1px;bottom:1px;width:28px;border:0;background:transparent;
          cursor:pointer;color:var(--color-neutral-600);font-size:12px;line-height:1">&#9662;</button>
        <ul id="rv-who-list" role="listbox" hidden
          style="list-style:none;margin:2px 0 0;padding:0;position:absolute;left:0;right:0;top:100%;z-index:5;
          max-height:212px;overflow-y:auto;background:var(--color-surface);border:1px solid var(--color-divider);
          border-radius:0;box-shadow:var(--shadow-lg)"></ul>
      </div>
      <div id="rv-who-say" style="font-size:13px;line-height:1.5;margin-top:5px;color:var(--color-neutral-600)">${
        _rvE(i18t('rv_who_hint'))}</div>
      <input type="hidden" id="rv-who-id" value=""/>
    </div>` : `<div style="font-size:13px;color:var(--st-amber-fg);background:var(--st-amber-bg);
      border:1px solid var(--st-amber-line);border-radius:0;padding:9px 11px;margin-bottom:12px;line-height:1.5">${_rvE(i18t('rv_no_colleagues'))}</div>`}

    <label for="rv-note" style="${RV_LBL}">${_rvE(i18t('rv_note_label'))}</label>
    <textarea id="rv-note" rows="3" style="${RV_FLD}margin-bottom:12px;resize:vertical"
      placeholder="${_rvE(i18t('rv_note_ph'))}"></textarea>

    <label for="rv-due" style="${RV_LBL}">${_rvE(i18t('rv_due_label'))}</label>
    <input id="rv-due" type="date" value="${_rvE(due)}" style="${RV_FLD}margin-bottom:12px"/>

    ${(window.API_MODE && window.API_MODE()) ? `<label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--color-neutral-700);margin-bottom:14px;cursor:pointer">
      <input id="rv-email" type="checkbox" checked style="margin-top:2px"/>
      <span>${_rvE(i18t('rv_email_them'))}</span></label>` : ''}

    <div style="border:1px solid var(--color-divider);border-radius:0;padding:11px 13px;background:var(--color-bg);margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="flex:1;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600)">${_rvE(i18t('rv_in_scope'))}</span>
        ${scope.all.length > 1 ? `<button type="button" id="rv-pick-all"
          style="border:0;background:none;padding:0;font:inherit;font-size:12px;font-weight:600;
          color:var(--color-accent);cursor:pointer;text-decoration:underline;text-underline-offset:2px">${_rvE(i18t('rv_pick_none'))}</button>` : ''}
      </div>
      ${scope.ours.length ? `<div style="font-size:12px;font-weight:700;color:var(--color-text);margin:4px 0 2px">${_rvE(i18tn('rv_scope_ours', scope.ours.length, { n: scope.ours.length }))}</div>
        <ul style="list-style:none;margin:0;padding:0">${scope.ours.map(row).join('')}</ul>` : ''}
      ${scope.theirs.length ? `<div style="font-size:12px;font-weight:700;color:var(--color-text);margin:9px 0 2px">${_rvE(i18tn('rv_scope_theirs', scope.theirs.length, { n: scope.theirs.length }))}</div>
        <ul style="list-style:none;margin:0;padding:0">${scope.theirs.map(row).join('')}</ul>` : ''}
      ${!scope.all.length ? `<div style="font-size:13px;color:var(--color-neutral-700)">${_rvE(i18t('rv_nothing_to_review'))}</div>` : ''}
    </div>
  </div>
  <div class="rvd-foot">
    <button id="rv-cancel-modal" class="ui-btn">${_rvE(i18t('act_cancel'))}</button>
    <button id="rv-send" class="ui-btn ui-btn-primary"${(!people.length || !scope.all.length) ? ' disabled' : ''}>${_rvE(i18t('rv_send_btn'))}</button>
  </div>`;
}

/* ---- WIRING THE PICKER ----
   A combobox rather than a <select>, for the reason above: a list you scroll is
   a list that stops working at about thirty people. Everything here is in
   service of one sentence — you can type, and what you type is matched against
   names and addresses alike.

   THE RESOLUTION IS SEPARATE FROM THE TYPING. The box holds whatever the person
   wrote; `pick` holds who that actually is, and it is recomputed on every
   keystroke rather than only when an option is clicked. So pasting a whole
   address and pressing Send works without ever opening the list, which is how
   most people who have the address in their hand will use it. */
/* ---- ONE COMBOBOX, TWO DIALOGS ----
   The negotiation desk needs the same control for the same reason — find one
   colleague among hundreds, by name or by a pasted address — and a second copy
   of ninety lines of keyboard handling is two copies to keep in step. So the
   ids and the two questions it asks (who matches, and what does this string
   resolve to) are parameters, and the defaults are exactly what this file
   already did: prefix `rv`, reviewSearchPeople, reviewResolvePerson.

   The RULES stay with the caller, because they are genuinely different. A
   reviewer may not be yourself; a desk lead usually IS. A reviewer must not be
   a viewer; nor must a contributor, but a contributor must also not already be
   on the desk. Sharing the widget and sharing the policy are different things
   and only the first one is safe. */
function reviewWirePicker(c, cfg = {}){
  const p = cfg.prefix || 'rv';
  const search = cfg.search || reviewSearchPeople;
  const resolve = cfg.resolve || reviewResolvePerson;
  const box = document.getElementById(p + '-who');
  const list = document.getElementById(p + '-who-list');
  const say = document.getElementById(p + '-who-say');
  const hid = document.getElementById(p + '-who-id');
  const caret = document.getElementById(p + '-who-caret');
  if (!box || !list) return { get: () => null };

  let pick = null, active = null, open = false;

  const paint = () => {
    list.innerHTML = reviewPickerListHtml(box.value, active, c, cfg);
    list.hidden = !open;
    box.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  const tell = () => {
    /* An empty box is not an error — it is a box nobody has filled in yet, and
       shouting at somebody before they have typed is how a form feels hostile. */
    if (!String(box.value || '').trim()){
      pick = null; hid.value = '';
      say.textContent = i18t('rv_who_hint');
      say.style.color = 'var(--color-neutral-600)';
      return;
    }
    const r = resolve(box.value, c);
    pick = r.ok ? r.user : null;
    hid.value = r.ok ? r.user.id : '';
    say.textContent = r.ok ? i18t('rv_who_ok', { who: r.user.name, email: r.user.email || '' }) : r.why;
    say.style.color = r.ok ? 'var(--st-green-fg)' : 'var(--st-amber-fg)';
  };
  const choose = id => {
    const u = (window.getUsers ? window.getUsers() : []).find(x => x && String(x.id) === String(id));
    if (!u) return;
    box.value = u.email ? (u.name + ' <' + u.email + '>') : u.name;
    active = u.id; open = false;
    tell(); paint(); box.focus();
  };

  box.addEventListener('input', () => { open = true; active = null; tell(); paint(); });
  box.addEventListener('focus', () => { open = true; paint(); });
  caret?.addEventListener('click', () => { open = !open; paint(); if (open) box.focus(); });
  list.addEventListener('mousedown', ev => {
    /* mousedown, not click: the box's blur would close the list out from under
       the pointer before a click ever landed. */
    const li = ev.target.closest && ev.target.closest('[data-rv-pick]');
    if (!li) return;
    ev.preventDefault();
    choose(li.getAttribute('data-rv-pick'));
  });
  box.addEventListener('blur', () => { setTimeout(() => { open = false; paint(); }, 120); });
  box.addEventListener('keydown', ev => {
    const hits = search(box.value, 8, c).hits;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp'){
      ev.preventDefault();
      if (!hits.length) return;
      open = true;
      const at = hits.findIndex(u => String(u.id) === String(active));
      const next = ev.key === 'ArrowDown'
        ? (at < 0 ? 0 : Math.min(at + 1, hits.length - 1))
        : (at <= 0 ? 0 : at - 1);
      active = hits[next].id;
      box.setAttribute('aria-activedescendant', p + '-opt-' + active);
      paint();
      return;
    }
    if (ev.key === 'Enter'){
      /* Enter takes the highlighted row, or the only match, and otherwise does
         nothing — it must not submit a dialog whose main field is unresolved. */
      const target = active ? active : (hits.length === 1 ? hits[0].id : null);
      if (target){ ev.preventDefault(); choose(target); }
      return;
    }
    if (ev.key === 'Escape' && open){
      /* Closes the LIST, not the dialog. The application's own Escape handler is
         on the document and would otherwise throw away everything typed. */
      ev.stopPropagation(); ev.preventDefault();
      open = false; paint();
    }
  });

  tell(); paint();
  return { get: () => pick };
}

function openReviewAskModal(c, opts = {}){
  if (!window.openModal) return;
  window.openModal(reviewAskModalHtml(c, opts), { maxWidth: '34rem' });
  const done = () => { if (typeof opts.after === 'function') opts.after(); };
  const picker = reviewWirePicker(c);
  /* The chosen ids, and the button that says how many. Recounted on every tick
     so the verb always names what pressing it will actually do. */
  const boxes = () => [...document.querySelectorAll('.rv-pickch')];
  const chosen = () => boxes().filter(b => b.checked).map(b => b.getAttribute('data-rv-ch'));
  const sendBtn = document.getElementById('rv-send');
  const allBtn = document.getElementById('rv-pick-all');
  const recount = () => {
    const n = chosen().length, all = boxes().length;
    if (sendBtn){
      sendBtn.textContent = n && n < all
        ? i18tn('rv_send_n_btn', n, { n })
        : i18t('rv_send_btn');
      sendBtn.disabled = !n || !all;
    }
    if (allBtn) allBtn.textContent = n === all ? i18t('rv_pick_none') : i18t('rv_pick_all');
  };
  boxes().forEach(b => b.addEventListener('change', recount));
  allBtn?.addEventListener('click', () => {
    const on = chosen().length !== boxes().length;
    boxes().forEach(b => { b.checked = on; });
    recount();
  });
  recount();
  document.getElementById('rv-cancel-modal')?.addEventListener('click', () => window.closeModal());
  document.getElementById('rv-send')?.addEventListener('click', async () => {
    const box = document.getElementById('rv-who');
    const u = picker.get();
    if (!u){
      /* Refused HERE, with the reason, rather than by a disabled button. A
         button that is simply grey tells you nothing about which of the four
         things you got wrong. */
      const r = reviewResolvePerson(box ? box.value : '', c);
      _rvSay(r.why || i18t('rv_pick_someone'), 'err');
      if (box) box.focus();
      return;
    }
    const note = (document.getElementById('rv-note') || {}).value || '';
    const dueV = (document.getElementById('rv-due') || {}).value || '';
    const rv = reviewAsk(c, { reviewer: u || {}, note, due: dueV, ids: chosen() });
    if (!rv) return;
    _rvSave(c);
    window.closeModal();
    /* THE EMAIL IS A COURTESY AND THE RECORD IS NOT. The request is filed
       whatever the mail provider does — a failed send must never lose the
       review — so this runs after the record exists and its failure is reported
       rather than thrown.

       WHAT IT REPORTS IS NOW A REASON, not a shrug. The three ways nothing
       arrives are told apart and written down: the tick-box was cleared, the
       server has no mail provider configured (the message is in its own
       outbox), or a provider refused it and said why. A refusal the SERVER made
       before sending — not a member, no access to this value stream — arrives
       as a thrown error carrying its own sentence, and that sentence is what
       gets filed. See reviewNoteDelivery. */
    const wantMail = !!(document.getElementById('rv-email') || {}).checked;
    let out = { wanted: wantMail, sent: false, outbox: false, to: (u && u.email) || null, why: null };
    if (wantMail && window.API_MODE && window.API_MODE() && window.api){
      try{
        const r = await window.api('contracts/' + c.id + '/review-request', 'POST', {
          reviewerId: (u && u.id) || null, reviewerEmail: (u && u.email) || null,
          note, due: dueV, reviewId: rv.id });
        out = { wanted: true, sent: !!(r && r.emailSent),
          outbox: !!(r && r.outbox), to: (r && r.to) || out.to,
          why: (r && r.emailError) || null };
      }catch(e){
        out.why = String((e && (e.message || e.error)) || e || '').slice(0, 300) || null;
      }
    } else if (wantMail){
      /* Local (single-device) mode: there is no server to send from, and saying
         "it is in their inbox" there would be the cheerful lie this whole
         change exists to remove. */
      out.outbox = true;
    }
    const notice = reviewNoteDelivery(c, rv, out);
    _rvSave(c);
    const st = reviewDeliveryState(rv);
    _rvSay(notice && notice.kind === 'sent'
      ? i18t('rv_sent_mailed', { who: rv.reviewer.name })
      : `${i18t('rv_sent_quiet', { who: rv.reviewer.name })} ${(st && st.text) || ''}`.trim(),
      notice && notice.kind === 'refused' ? 'err' : undefined);
    done();
  });
}

/* ---- THE TOOLBAR'S DOOR OPENS ON A CHOICE ----
   Asked for directly (Young, 10 Aug 2026): pressing "Internal review" should
   start the internal collaboration, and there are two ways a colleague joins
   one — as a CONTRIBUTOR (the desk: they redline alongside you for the whole
   negotiation) or as a REVIEWER (the ask: they rule on named changes and hand
   them back). Two different features answer those, and burying one behind the
   other made the desk invisible from the one button labelled with the word
   people reach for.

   So the door asks. Two options, each saying in a sentence what it does, and
   the existing dialogs unchanged behind them. The hand-back posture is NOT
   routed through here — a reviewer pressing the same button is returning a
   job, not starting one, and a chooser in front of that is a question with one
   answer. The per-card ask (data-rl-ask-review) stays direct for the same
   reason: it is scoped to the change under your eye, and the desk has nothing
   to say about a single clause.

   ON A STAGE WITHOUT THE DESK MODULE there is nothing to choose between, so
   the door falls straight through to the ask dialog — which is also what every
   caller written before this did. */
function openReviewEntryChooser(c, opts = {}){
  if (!window.openModal || !c) return;
  if (!window.openDeskSheet){ openReviewAskModal(c, opts); return; }
  const opt = (act, glyph, label, sub) => `
    <button type="button" data-rv-entry="${_rvE(act)}" class="rvd-opt">
      <b>${glyph} ${_rvE(label)}</b>
      <span>${_rvE(sub)}</span>
    </button>`;
  window.openModal(`
    ${reviewDialogHeadHtml('&#128100;', i18t('rv_entry_title'), i18t('rv_entry_sub'))}
    <div class="rvd-body">
      ${opt('desk', '&#128101;', i18t('rv_entry_desk'), i18t('rv_entry_desk_sub'))}
      ${opt('ask', '&#128172;', i18t('rv_entry_ask'), i18t('rv_entry_ask_sub'))}
    </div>
    <div class="rvd-foot">
      <button id="rv-entry-cancel" class="ui-btn">${_rvE(i18t('act_cancel'))}</button>
    </div>`, { maxWidth: '26rem' });
  document.getElementById('rv-entry-cancel')?.addEventListener('click', () => window.closeModal());
  document.querySelectorAll('[data-rv-entry]').forEach(b => b.addEventListener('click', () => {
    if (b.getAttribute('data-rv-entry') === 'desk'){
      /* Nobody has claimed the desk yet → pressing "assign contributors" IS
         claiming it. The sheet needs a lead to hang the roster on, and the
         person pressing is exactly who their first redline would have stamped
         — the same one-press rule deskOpenFromChip states for the header. */
      if (window.deskIsOpen && !deskIsOpen(c) && window.deskOpenFromChip) deskOpenFromChip(c);
      openDeskSheet(c, { after: opts.after });
      return;
    }
    openReviewAskModal(c, opts);
  }));
}

/* ---- ONE DOOR, AND IT ASKS WHICH ----
   Two reviews open with the same person drew two rows, each with its own
   "Hand it back", and a third copy sat in the toolbar: three controls, two of
   them identical, for a question the screen never actually put. Asked for
   directly (Young, 09 Aug 2026): one hand-back, and if there is more than one
   review it asks which — named by the changes in it, because "REV-2" means
   nothing to a reader and "CHG-017" is what is printed on the card.

   With exactly one review of theirs open this step does not appear at all; the
   question would be rhetorical. */
function reviewTagsFor(rv){
  const ids = (rv && rv.changeIds || []).map(String);
  if (!ids.length) return i18t('rv_pick_nothing_left');
  return ids.join(', ');
}
function openReviewReturnPicker(c, opts = {}){
  if (!window.openModal) return;
  const mine = reviewMineOpen(c);
  if (mine.length <= 1){ openReviewReturnModal(c, { ...opts, reviewId: mine[0] && mine[0].id }); return; }
  const row = rv => {
    const p = reviewProgress(c, rv);
    return `<button type="button" data-rv-pick-return="${_rvE(rv.id)}"
      style="display:block;width:100%;text-align:left;font:inherit;cursor:pointer;margin-bottom:8px;
      border:1px solid var(--color-divider);border-radius:0;padding:10px 12px;background:var(--color-surface)">
      <span style="display:block;font-size:14px;font-weight:700;font-family:var(--font-mono);color:var(--accent-ink)">${_rvE(reviewTagsFor(rv))}</span>
      <span style="display:block;font-size:13px;color:var(--color-neutral-700);margin-top:3px;line-height:1.5">
        ${_rvE(i18t('rv_pick_from', { who: rv.by }))}${rv.due ? ' · ' + _rvE(i18t('rv_due', { when: rv.due })) : ''}
        · ${_rvE(i18tn('rv_pick_left', p.left, { n: p.left, total: p.total }))}</span>
      ${rv.note ? `<span style="display:block;font-size:12px;color:var(--color-neutral-600);margin-top:4px;
        overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical"
        title="${_rvE(rv.note)}">“${_rvE(_rvClamp(rv.note, 240))}”</span>` : ''}
    </button>`;
  };
  window.openModal(`
    ${reviewDialogHeadHtml('&#128229;', i18t('rv_pick_title'), i18t('rv_pick_sub'))}
    <div class="rvd-body">
      ${mine.map(row).join('')}
    </div>
    <div class="rvd-foot">
      <button id="rv-pcancel" class="ui-btn">${_rvE(i18t('act_cancel'))}</button>
    </div>`, { maxWidth: '30rem' });
  document.getElementById('rv-pcancel')?.addEventListener('click', () => window.closeModal());
  document.querySelectorAll('[data-rv-pick-return]').forEach(b =>
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-rv-pick-return');
      window.closeModal();
      openReviewReturnModal(c, { ...opts, reviewId: id });
    }));
}

function openReviewReturnModal(c, opts = {}){
  if (!window.openModal) return;
  /* THIS review's tally, not the contract's. reviewScope answers "what is still
     free to ask about" and would count nothing at all here. */
  const open = reviewOpenList(c);
  const rv = opts.reviewId ? open.find(r => r.id === opts.reviewId)
    : (reviewMineOpen(c)[0] || (open.length === 1 ? open[0] : null));
  if (!rv){ _rvSay(open.length > 1 ? i18t('rv_which_review') : i18t('rv_no_open_review'), 'err'); return; }
  const ids = new Set((rv.changeIds || []).map(String));
  const inRv = ((window.negoUnsentAsks ? window.negoUnsentAsks(c, 'owner') : [])
    .concat((window.negoPending ? window.negoPending(c) : []).filter(x => x && x.authorSide === 'counterparty')))
    .filter(x => ids.has(String(x.id)));
  const ourIn = inRv.filter(x => reviewSideOf(x) === 'ours');
  const cleared = ourIn.filter(reviewCleared).length;
  const held = ourIn.filter(reviewHeld).length;
  const advised = inRv.filter(x => reviewSideOf(x) === 'theirs' && reviewOn(x)).length;
  const unmarked = ourIn.filter(x => !reviewOn(x)).length;
  window.openModal(`
    ${reviewDialogHeadHtml('&#128229;', i18t('rv_return_title'), i18t('rv_return_sub'))}
    <div class="rvd-body">
      <div style="border:1px solid var(--color-divider);border-radius:0;padding:11px 13px;background:var(--color-bg);margin-bottom:12px;font-size:13px;line-height:1.7">
        <div><b>${cleared}</b> ${_rvE(i18t('rv_tally_cleared'))}</div>
        <div><b>${held}</b> ${_rvE(i18t('rv_tally_held'))}</div>
        <div><b>${advised}</b> ${_rvE(i18t('rv_tally_advised'))}</div>
        ${unmarked ? `<div style="color:var(--st-ruby-fg);margin-top:5px"><b>${unmarked}</b> ${_rvE(i18t('rv_tally_unmarked'))}</div>` : ''}
      </div>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${_rvE(i18t('rv_return_note_label'))}</label>
      <textarea id="rv-rnote" rows="3" style="${RV_FLD}resize:vertical" placeholder="${_rvE(i18t('rv_return_note_ph'))}"></textarea>
    </div>
    <div class="rvd-foot">
      <button id="rv-rcancel" class="ui-btn">${_rvE(i18t('act_cancel'))}</button>
      <button id="rv-rok" class="ui-btn ui-btn-primary"${unmarked ? ' disabled' : ''}>${_rvE(i18t('rv_return_btn'))}</button>
    </div>`, { maxWidth: '30rem' });
  document.getElementById('rv-rcancel')?.addEventListener('click', () => window.closeModal());
  document.getElementById('rv-rok')?.addEventListener('click', () => {
    const note = (document.getElementById('rv-rnote') || {}).value || '';
    const done = reviewReturn(c, { note, reviewId: rv.id });
    if (!done) return;
    _rvSave(c);
    window.closeModal();
    _rvSay(i18t('rv_returned_toast', { who: done.by }));
    if (typeof opts.after === 'function') opts.after();
  });
}

function openReviewNoteModal(c, changeId, opts = {}){
  if (!window.openModal) return;
  const ch = (window.negoChangeById ? window.negoChangeById(c, changeId) : null);
  const cur = ch && reviewOn(ch);
  window.openModal(`
    ${reviewDialogHeadHtml('&#9998;', i18t('rv_note_title_modal', { id: changeId }), i18t('rv_note_sub'))}
    <div class="rvd-body">
      <textarea id="rv-cnote" rows="4" style="${RV_FLD}resize:vertical">${_rvE((cur && cur.note) || '')}</textarea>
    </div>
    <div class="rvd-foot">
      <button id="rv-ccancel" class="ui-btn">${_rvE(i18t('act_cancel'))}</button>
      <button id="rv-cok" class="ui-btn ui-btn-primary">${_rvE(i18t('act_save'))}</button>
    </div>`, { maxWidth: '28rem' });
  document.getElementById('rv-ccancel')?.addEventListener('click', () => window.closeModal());
  document.getElementById('rv-cok')?.addEventListener('click', () => {
    const note = (document.getElementById('rv-cnote') || {}).value || '';
    /* A note without a verdict is still a note. Where the reviewer has already
       ruled, the ruling stands and only the words change — re-marking with the
       same verdict would re-stamp the hash and quietly un-stale a verdict the
       wording had moved out from under. */
    if (ch && reviewOn(ch)){ ch.review.note = String(note).trim() || null; }
    else if (ch){ reviewMark(c, changeId, reviewSideOf(ch) === 'ours' ? 'held' : 'advise-discuss', { note }); }
    _rvSave(c);
    window.closeModal();
    if (typeof opts.after === 'function') opts.after();
  });
}

/* ---------- ONE wiring, called by every screen that draws the cards ----------
   Delegated from the host, so a repaint cannot leave a dead listener behind and
   a new card cannot arrive unwired. */
function reviewWireCards(c, host, opts = {}){
  if (!host || host.dataset.rvWired === c.id) return;
  host.dataset.rvWired = c.id;
  const again = () => { if (typeof opts.repaint === 'function') opts.repaint(); };
  host.addEventListener('click', ev => {
    const mark = ev.target.closest && ev.target.closest('[data-rv-mark]');
    if (mark){
      ev.preventDefault(); ev.stopPropagation();
      const id = mark.getAttribute('data-rv-mark');
      const v = mark.getAttribute('data-rv-verdict');
      if (reviewMark(c, id, v)){ _rvSave(c); again(); }
      return;
    }
    const note = ev.target.closest && ev.target.closest('[data-rv-note]');
    if (note){
      ev.preventDefault(); ev.stopPropagation();
      openReviewNoteModal(c, note.getAttribute('data-rv-note'), { after: again });
      return;
    }
    /* ---- THE CARD'S OWN CANCEL ----
       Same act as the banner's, one confirm in front of it: a reviewer may
       already have cleared or held clauses, and a press that silently threw
       that away would be the second time this feature lost somebody's work.
       The model refuses again underneath (reviewCancel checks reviewMayCancel),
       so a button drawn where it should not be still cannot act. */
    const cxl = ev.target.closest && ev.target.closest('[data-rv-cancel]');
    if (cxl){
      ev.preventDefault(); ev.stopPropagation();
      const reviewId = cxl.getAttribute('data-rv-cancel');
      const rv = reviewOpenList(c).find(r => r.id === reviewId);
      if (!rv) return;
      const go = ok => { if (!ok) return;
        if (reviewCancel(c, { reviewId })){ _rvSave(c); _rvSay(i18t('rv_cancelled_toast')); again(); } };
      if (window.confirmDialog){
        window.confirmDialog({ title: i18t('rv_cancel_confirm_title'),
          message: reviewCancelCost(c, rv),
          /* NOT rv_cancel_btn. That word was trimmed to "Cancel" on 13 Aug
             2026 for the CARD, where it sits beside a change and reads
             correctly. Here it would sit opposite "Leave it with them" and
             read as this dialog's own dismiss — two ways of saying no, one of
             which cancels a colleague's review. The long form stays on this
             one door. */
          confirmLabel: i18t('rv_cancel_confirm_do'), cancelLabel: i18t('rv_cancel_keep'),
          danger: true }).then(go);
      } else go(true);
      return;
    }
    const act = ev.target.closest && ev.target.closest('[data-rv-act]');
    if (act){
      ev.preventDefault(); ev.stopPropagation();
      /* "rv-cancel:REV-2" — the verb and the review it acts on. With several
         open, a bare verb would act on whichever one the code happened to find
         first, which is how you cancel the wrong person's review. */
      const raw = act.getAttribute('data-rv-act');
      const cut = raw.indexOf(':');
      const what = cut < 0 ? raw : raw.slice(0, cut);
      const reviewId = cut < 0 ? null : raw.slice(cut + 1);
      if (what === 'rv-clear'){ reviewClearBanner(c); again(); }
      else if (what === 'rv-ask') openReviewAskModal(c, { after: again });
      else if (what === 'rv-return') openReviewReturnPicker(c, { reviewId, after: again });
      else if (what === 'rv-cancel'){
        if (reviewCancel(c, { reviewId })){ _rvSave(c); _rvSay(i18t('rv_cancelled_toast')); again(); }
      }
    }
  });
}

Object.assign(window, {
  REVIEW_VERDICTS, REVIEW_VERDICTS_OURS, REVIEW_VERDICTS_THEIRS, REVIEW_VERDICT_RECORD,
  REVIEW_GATE_DEFAULT, reviewVerdictIsAdvice, reviewVerdictLabel,
  reviewInit, reviewRequests, reviewOpenOf, reviewLastOf, reviewScope, reviewSideOf,
  reviewOn, reviewStale, reviewCurrent, reviewHeld, reviewCleared, reviewHeldIds, reviewSendable,
  reviewIsReviewer, reviewIsRequester, reviewCandidates,
  reviewMaySee, reviewMayCancel, reviewOutNameFor, reviewVerdictByFor,
  reviewActorHeld, reviewActorIsHeld, reviewActorBlockMessage, reviewMyChangeIds,
  reviewOpenList, reviewOpenFor, reviewMineOpen, reviewNames, reviewWaitingOn,
  reviewInPlay, reviewSpent,
  reviewInOpen, reviewOutFor, reviewAwaiting, reviewSendWarning, reviewWithheldIds,
  reviewAsk, reviewCancel, reviewMark, reviewReturn,
  reviewNoteDelivery, reviewDeliveryState,
  reviewCardCancelHtml, reviewCancelCost, reviewWantsAttention,
  reviewGateCfg, saveReviewGateCfg, reviewGateApplies, reviewGate, reviewGateMessage,
  reviewChecked, reviewStandingReviewerFor, reviewUncheckedPeople,
  reviewState, reviewProgress, reviewInboxFor, reviewWhen,
  reviewSeatShowsReview, reviewChipHtml, reviewVerbsHtml, reviewBannerHtml,
  reviewBannerCleared, reviewClearBanner, reviewUnclearBanner,
  reviewSearchPeople, reviewResolvePerson, reviewPersonRowHtml, reviewPickerListHtml,
  RV_FLD, RV_LBL, reviewWirePicker,
  reviewDialogHeadHtml,
  reviewAskModalHtml, openReviewAskModal, openReviewEntryChooser,
  openReviewReturnModal, openReviewReturnPicker,
  reviewTagsFor, openReviewNoteModal,
  reviewWireCards,
});
