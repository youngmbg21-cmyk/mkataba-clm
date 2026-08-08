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
function reviewOpenOf(c){
  const rs = reviewRequests(c);
  for (let i = rs.length - 1; i >= 0; i--) if (rs[i] && rs[i].status === 'open') return rs[i];
  return null;
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
  const ours = (window.negoUnsentAsks ? window.negoUnsentAsks(c, 'owner') : []).slice();
  const theirs = (window.negoPending ? window.negoPending(c) : [])
    .filter(x => x && x.authorSide === 'counterparty');
  return { ours, theirs, all: ours.concat(theirs) };
}
const reviewSideOf = ch => (ch && ch.authorSide === 'counterparty') ? 'theirs' : 'ours';

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
/* What a send would actually carry: our unsent asks, minus what is held. */
function reviewSendable(c){
  const held = reviewHeldIds(c);
  return (window.negoUnsentAsks ? window.negoUnsentAsks(c, 'owner') : []).filter(x => !held.has(x.id));
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
/* Who can be asked. Viewers are excluded because a viewer cannot decide
   anything anywhere else in the product either, and a review they could not act
   on would be a request into a void. Yourself is excluded for the reason the
   change model already states in its own words: nobody rules on their own ask. */
function reviewCandidates(){
  const me = _rvMe();
  return (window.getUsers ? window.getUsers() : [])
    .filter(u => u && u.role !== 'viewer' && !(me && String(u.id) === String(me.id)));
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
function reviewSearchPeople(q, limit){
  const all = reviewCandidates();
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
function reviewResolvePerson(q){
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
  return { ok: true, user: hit };
}

/* ---------- asking ---------- */
function reviewAsk(c, o = {}){
  reviewInit(c);
  if (reviewOpenOf(c)){ _rvSay(i18t('rv_already_open'), 'err'); return null; }
  const who = o.reviewer || {};
  const name = String(who.name || '').trim();
  if (!name){ _rvSay(i18t('rv_pick_someone'), 'err'); return null; }
  const scope = reviewScope(c);
  if (!scope.all.length){ _rvSay(i18t('rv_nothing_to_review'), 'err'); return null; }
  const me = _rvMe();
  const rv = {
    id: 'REV-' + (c.review.requests.length + 1),
    at: _rvNow(),
    by: String(o.by || (me && me.name) || 'System'),
    byId: (me && me.id) || null,
    reviewer: { id: who.id || null, name, email: who.email || null },
    note: String(o.note || '').trim() || null,
    due: String(o.due || '').trim() || null,
    /* WHAT WAS IN FRONT OF THEM WHEN THEY WERE ASKED. Recorded because the set
       moves: a change filed after the request is not something the reviewer was
       ever shown, and a review that silently swallowed it would let anybody
       slip wording past an open review by writing it a minute late. The gate
       reads the LIVE set and requires a verdict on all of it, so a late arrival
       shows up as unreviewed rather than as cleared. */
    changeIds: scope.all.map(x => x.id),
    status: 'open',
    returnedAt: null, returnedBy: null, returnedNote: null,
  };
  c.review.requests.push(rv);
  _rvAudit(c, 'Internal review',
    `Internal review requested from ${rv.reviewer.name} by ${rv.by} — ${scope.ours.length} of our unsent change(s)`
    + ` and ${scope.theirs.length} of theirs in scope${rv.due ? `, due ${rv.due}` : ''}`
    + `${rv.note ? `; “${rv.note}”` : ''}`);
  return rv;
}
function reviewCancel(c, o = {}){
  const rv = reviewOpenOf(c);
  if (!rv) return null;
  rv.status = 'cancelled';
  rv.returnedAt = _rvNow();
  const by = String(o.by || (_rvMe() && _rvMe().name) || 'System');
  _rvAudit(c, 'Internal review',
    `Internal review ${rv.id} cancelled by ${by} — it was with ${rv.reviewer.name}`);
  return rv;
}

/* ---------- marking one change ---------- */
function reviewMark(c, changeId, verdict, o = {}){
  const rv = reviewOpenOf(c);
  if (!rv){ _rvSay(i18t('rv_no_open_review'), 'err'); return null; }
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
  const rv = reviewOpenOf(c);
  if (!rv){ _rvSay(i18t('rv_no_open_review'), 'err'); return null; }
  const actor = o.by ? { name: o.by, id: o.byId || null } : _rvMe();
  if (!o.force && !reviewIsReviewer(rv, actor)){
    _rvSay(i18t('rv_only_reviewer', { who: rv.reviewer.name }), 'err');
    return null;
  }
  const scope = reviewScope(c);
  const unmarked = scope.ours.filter(x => !reviewOn(x));
  if (unmarked.length){
    _rvSay(i18tn('rv_mark_all_first', unmarked.length, { n: unmarked.length }), 'err');
    return null;
  }
  rv.status = 'returned';
  rv.returnedAt = _rvNow();
  rv.returnedBy = String((actor && actor.name) || 'System');
  rv.returnedNote = String(o.note || '').trim() || null;
  const cleared = scope.ours.filter(reviewCleared).length;
  const held = scope.ours.filter(reviewHeld).length;
  const advised = scope.theirs.filter(x => reviewOn(x)).length;
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
  return { on: !!g.on, when, value: Number(g.value || 0) };
}
function saveReviewGateCfg(g){
  const st = _rvState();
  if (!st) return null;
  st.settings = st.settings || {};
  st.settings.reviewGate = { on: !!g.on,
    when: ['always', 'deviation', 'value'].includes(g.when) ? g.when : 'deviation',
    value: Number(g.value || 0) };
  if (window.saveSettings) window.saveSettings();
  return st.settings.reviewGate;
}
function reviewGateApplies(c){
  const cfg = reviewGateCfg();
  if (!cfg.on) return false;
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
  const open = reviewOpenOf(c);
  const base = { held, sendable, unsent, open, unreviewed: [] };
  /* Nothing of ours is waiting to go, so there is nothing for a gate to hold.
     Handing the contract back with no asks outstanding is a legitimate move and
     always has been. */
  if (!unsent.length) return { ...base, required: false, ok: true, reason: 'nothing-unsent' };
  const required = reviewGateApplies(c);
  const unreviewed = sendable.filter(x => !reviewCleared(x));
  if (!required) return { ...base, unreviewed, required: false, ok: true, reason: 'not-required' };
  if (!sendable.length) return { ...base, unreviewed, required: true, ok: false, reason: 'all-held' };
  if (open) return { ...base, unreviewed, required: true, ok: false, reason: 'with-reviewer' };
  if (unreviewed.length) return { ...base, unreviewed, required: true, ok: false,
    reason: reviewRequests(c).length ? 'not-cleared' : 'never-requested' };
  return { ...base, unreviewed, required: true, ok: true, reason: 'cleared' };
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
      who: (g.held[0] && g.held[0].review && g.held[0].review.by) || i18t('rv_your_reviewer') });
  if (g.reason === 'with-reviewer')
    return i18t('rv_gate_with_reviewer', { who: (g.open && g.open.reviewer.name) || i18t('rv_your_reviewer') });
  if (g.reason === 'never-requested')
    return i18tn('rv_gate_never_requested', g.unreviewed.length, { n: g.unreviewed.length });
  return i18tn('rv_gate_not_cleared', g.unreviewed.length, { n: g.unreviewed.length });
}

/* ---------- what to say about it ----------
   ONE reading of the state, handed to every screen that draws a banner. The
   phone, the workbench, the contract room and the readiness panel all print
   this; a second opinion anywhere would be a screen that disagrees with the
   screen next to it about whether the boss has answered. */
function reviewState(c){
  const open = reviewOpenOf(c);
  const last = reviewLastOf(c);
  const scope = reviewScope(c);
  const me = _rvMe();
  const gate = reviewGate(c);
  if (open){
    const mine = reviewIsReviewer(open, me);
    const marked = scope.ours.filter(x => reviewOn(x)).length + scope.theirs.filter(x => reviewOn(x)).length;
    return { phase: mine ? 'yours' : 'waiting', rv: open, mine, gate,
      total: scope.all.length, marked, scope,
      overdue: !!(open.due && String(open.due) < String((window.todayStr && new Date().toISOString().slice(0, 10)) || new Date().toISOString().slice(0, 10))) };
  }
  if (last && last.status === 'returned')
    return { phase: 'returned', rv: last, mine: false, gate, scope,
      total: scope.all.length, marked: scope.all.filter(x => reviewOn(x)).length };
  return { phase: 'none', rv: last || null, mine: false, gate, scope,
    total: scope.all.length, marked: 0 };
}

/* Contracts sitting on this person's desk. Read by the dashboard, and by
   nothing else — it is a filter over state.contracts, which the server has
   already scoped, so it can only ever list paper the reader may see. */
function reviewInboxFor(cs, u){
  const me = u || _rvMe();
  if (!me) return [];
  return (cs || []).filter(c => {
    const rv = reviewOpenOf(c);
    return !!rv && reviewIsReviewer(rv, me);
  }).map(c => ({ c, rv: reviewOpenOf(c), st: reviewState(c) }));
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
function reviewChipHtml(ch, opts){
  if (!reviewSeatShowsReview(opts)) return '';
  const v = reviewOn(ch);
  if (!v) return '';
  const stale = reviewStale(ch);
  const tone = v.verdict === 'held' ? 'ruby'
    : v.verdict === 'cleared' ? 'green' : 'slate';
  const bg = { ruby: 'var(--st-ruby-bg)', green: 'var(--st-green-bg)', slate: 'var(--color-bg)' }[tone];
  const fg = { ruby: 'var(--st-ruby-fg)', green: 'var(--st-green-fg)', slate: 'var(--color-neutral-700)' }[tone];
  const word = reviewVerdictLabel(v.verdict);
  const title = `${word} — ${v.by}${v.note ? ': ' + v.note : ''}`;
  return `<span class="rv-chip" data-rv-chip="${_rvE(ch.id)}" data-rv-verdict="${_rvE(v.verdict)}"${
    stale ? ' data-rv-stale="1"' : ''}
    title="${_rvE(title)}"
    style="display:inline-flex;align-items:center;gap:4px;font-size:9.5px;font-weight:700;letter-spacing:.04em;
    text-transform:uppercase;border-radius:4px;padding:2px 6px;background:${bg};color:${fg};border:1px solid currentColor">
    <span aria-hidden="true">${v.verdict === 'held' ? '&#9209;' : v.verdict === 'cleared' ? '&#10003;' : '&#128172;'}</span>
    ${_rvE(word)}${stale ? ` · ${_rvE(i18t('rv_moved_since'))}` : ''}</span>`;
}

/* The reviewer's verbs, on the reviewer's screen only. Everyone else sees the
   chip above and nothing to press: a card that offers a verdict to somebody
   whose verdict the model will refuse is a card that lies. */
function reviewVerbsHtml(c, ch, opts = {}){
  if (!reviewSeatShowsReview(opts)) return '';
  const st = reviewState(c);
  if (!st.rv || st.phase !== 'yours') return '';
  const scope = reviewScope(c);
  const inScope = scope.all.some(x => x.id === ch.id);
  if (!inScope) return '';
  const cur = reviewOn(ch);
  const on = v => cur && cur.verdict === v;
  const btn = (v, cls, label, title) => `<button type="button" class="rv-btn ${cls}"
    data-rv-mark="${_rvE(ch.id)}" data-rv-verdict="${_rvE(v)}" aria-pressed="${on(v) ? 'true' : 'false'}"
    title="${_rvE(title)}"
    style="font:inherit;font-size:10.5px;font-weight:700;cursor:pointer;border-radius:5px;padding:3px 8px;
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
    <span style="font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-600)">${_rvE(i18t('rv_your_verdict'))}</span>
    ${verbs.join('')}
    <button type="button" class="rv-btn rv-note" data-rv-note="${_rvE(ch.id)}"
      title="${_rvE(i18t('rv_note_title'))}"
      style="font:inherit;font-size:10.5px;font-weight:600;cursor:pointer;border-radius:5px;padding:3px 8px;
      border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-neutral-700)">${_rvE(i18t('rv_note_btn'))}</button>
  </div>`;
}

/* The banner. Four states, and each one names the person it is waiting on —
   "in review" with no name is the status flip this feature exists to replace. */
function reviewBannerHtml(c, opts = {}){
  if (!c || !reviewSeatShowsReview(opts)) return '';
  const st = reviewState(c);
  if (st.phase === 'none' && !st.gate.required) return '';
  const wrap = (tone, body) => {
    const bg = { amber: 'var(--st-amber-bg)', green: 'var(--st-green-bg)', ruby: 'var(--st-ruby-bg)' }[tone];
    const fg = { amber: 'var(--st-amber-fg)', green: 'var(--st-green-fg)', ruby: 'var(--st-ruby-fg)' }[tone];
    const ln = { amber: 'var(--st-amber-line)', green: 'var(--st-green-line)', ruby: 'var(--st-ruby-line)' }[tone];
    return `<div class="rv-banner" data-rv-banner="${_rvE(st.phase)}"
      style="display:flex;align-items:flex-start;gap:10px;padding:10px 13px;margin:0 0 10px;border-radius:9px;
      border:1px solid ${ln};background:${bg};color:${fg};font-size:11.5px;line-height:1.5">${body}</div>`;
  };
  const act = (id, label) => `<button type="button" data-rv-act="${id}"
    style="flex:none;font:inherit;font-size:11px;font-weight:700;cursor:pointer;border-radius:6px;padding:4px 10px;
    border:1.5px solid currentColor;background:transparent;color:inherit">${_rvE(label)}</button>`;

  if (st.phase === 'yours'){
    const left = st.total - st.marked;
    return wrap('amber', `<span style="flex:1;min-width:0">
      <b>${_rvE(i18t('rv_banner_yours', { who: st.rv.by }))}</b>
      ${_rvE(st.rv.note ? '“' + st.rv.note + '” ' : '')}${_rvE(i18tn('rv_banner_yours_sub', left, { n: left, total: st.total }))}
      ${st.rv.due ? `<b>${_rvE(i18t('rv_due', { when: st.rv.due }))}</b>` : ''}</span>
      ${act('rv-return', i18t('rv_return_btn'))}`);
  }
  if (st.phase === 'waiting'){
    return wrap('amber', `<span style="flex:1;min-width:0">
      <b>${_rvE(i18t('rv_banner_waiting', { who: st.rv.reviewer.name }))}</b>
      ${_rvE(i18tn('rv_banner_waiting_sub', st.total, { n: st.total, when: reviewWhen(st.rv.at) }))}
      ${st.rv.due ? `<b>${_rvE(i18t('rv_due', { when: st.rv.due }))}</b>` : ''}
      ${st.gate.required ? `<span style="display:block;margin-top:3px">${_rvE(i18t('rv_gate_holds_send'))}</span>` : ''}</span>
      ${act('rv-cancel', i18t('rv_cancel_btn'))}`);
  }
  if (st.phase === 'returned'){
    const t = st.rv.tally || { cleared: 0, held: 0, advised: 0 };
    const tone = t.held ? 'ruby' : 'green';
    return wrap(tone, `<span style="flex:1;min-width:0">
      <b>${_rvE(i18t('rv_banner_returned', { who: st.rv.returnedBy || st.rv.reviewer.name }))}</b>
      ${_rvE(i18t('rv_banner_returned_sub', { cleared: t.cleared, held: t.held, advised: t.advised }))}
      ${st.rv.returnedNote ? `<span style="display:block;margin-top:3px">“${_rvE(st.rv.returnedNote)}”</span>` : ''}</span>
      ${act('rv-ask', i18t('rv_ask_again_btn'))}`);
  }
  /* Nothing has been asked and the gate wants something asked. */
  return wrap('amber', `<span style="flex:1;min-width:0">
    <b>${_rvE(i18t('rv_banner_gate'))}</b> ${_rvE(reviewGateMessage(c) || '')}</span>
    ${act('rv-ask', i18t('rv_ask_btn'))}`);
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
const RV_FLD = 'width:100%;min-height:34px;border:1px solid var(--color-divider);'
  + 'background:var(--color-surface);border-radius:4px;padding:8px 10px;font-size:12.5px;'
  + 'font-family:var(--font-body);color:var(--color-text);outline:none;line-height:1.5;';
const RV_LBL = 'display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);'
  + 'margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;';

/* One row of the picker's list. Name, address and role — the address because it
   is what disambiguates two people with one name, and because it is what the
   person searching usually has in front of them. */
function reviewPersonRowHtml(u, active){
  return `<li role="option" id="rv-opt-${_rvE(u.id)}" aria-selected="${active ? 'true' : 'false'}"
    data-rv-pick="${_rvE(u.id)}"
    style="display:flex;gap:9px;align-items:baseline;padding:7px 11px;cursor:pointer;
    background:${active ? 'var(--color-accent-100)' : 'transparent'}">
    <span style="flex:none;font-size:12.5px;font-weight:600;color:var(--color-text)">${_rvE(u.name)}</span>
    <span style="flex:1;min-width:0;font-size:11px;font-family:var(--font-mono);color:var(--color-neutral-600);
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_rvE(u.email || '')}</span>
    <span style="flex:none;font-size:10px;color:var(--color-neutral-500)">${
      _rvE(u.role ? (window.roleName ? window.roleName(u.role) : u.role) : '')}</span>
  </li>`;
}

/* The list panel, rebuilt on every keystroke. Capped, and it SAYS it is capped:
   a list silently cut at eight reads as "those are all the matches". */
function reviewPickerListHtml(q, activeId){
  const r = reviewSearchPeople(q, 8);
  if (!r.hits.length)
    return `<li style="padding:9px 11px;font-size:11.5px;color:var(--color-neutral-600)">${
      _rvE(_rvIsEmailish(q) ? i18t('rv_who_not_a_member', { email: String(q).trim() }) : i18t('rv_who_no_match'))}</li>`;
  const more = r.total - r.hits.length;
  return r.hits.map(u => reviewPersonRowHtml(u, String(u.id) === String(activeId))).join('')
    /* STICKY, because it is a promise about the list rather than a row in it.
       Left in the normal flow it sat below eight rows in a scrolling box — so
       the one line telling you there are three hundred more people required
       scrolling to find, which is the exact failure it exists to prevent. */
    + (more > 0 ? `<li style="position:sticky;bottom:0;padding:7px 11px;font-size:11px;
        color:var(--color-neutral-600);background:var(--color-bg);
        border-top:1px solid var(--color-divider)">${_rvE(i18tn('rv_who_more', more, { n: more }))}</li>` : '');
}

function reviewAskModalHtml(c){
  const scope = reviewScope(c);
  const people = reviewCandidates();
  const today = new Date(); today.setDate(today.getDate() + 2);
  const due = today.toISOString().slice(0, 10);
  const row = ch => `<li style="display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px solid var(--color-divider)">
    <span style="flex:none;font-family:var(--font-mono);font-size:9.5px;font-weight:700;border:1.5px solid var(--color-accent);
      color:var(--color-accent);border-radius:99px;padding:1px 6px;margin-top:1px">#${_rvE(ch.id)}</span>
    <span style="flex:1;min-width:0">
      <span style="display:block;font-size:11.5px;font-weight:600;line-height:1.4">${_rvE(ch.summary || '')}</span>
      <span style="display:block;font-size:10.5px;color:var(--color-neutral-600)">${_rvE(ch.clauseLabel || ch.clauseId || '')}</span>
    </span></li>`;
  return `
  <div style="padding:18px 20px 16px">
    <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0 0 4px">${_rvE(i18t('rv_modal_title'))}</h2>
    <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 14px;line-height:1.55">${_rvE(i18t('rv_modal_sub'))}</p>

    ${people.length ? `
    <div style="margin-bottom:12px">
      <label for="rv-who" style="${RV_LBL}">${_rvE(i18t('rv_who'))}</label>
      <div style="position:relative">
        <input id="rv-who" type="text" role="combobox" autocomplete="off" spellcheck="false"
          aria-expanded="false" aria-controls="rv-who-list" aria-autocomplete="list"
          placeholder="${_rvE(i18t('rv_who_ph'))}"
          style="${RV_FLD}padding-right:30px"/>
        <button type="button" id="rv-who-caret" tabindex="-1" aria-label="${_rvE(i18t('rv_who_show_all'))}"
          style="position:absolute;right:1px;top:1px;bottom:1px;width:28px;border:0;background:transparent;
          cursor:pointer;color:var(--color-neutral-600);font-size:10px;line-height:1">&#9662;</button>
        <ul id="rv-who-list" role="listbox" hidden
          style="list-style:none;margin:2px 0 0;padding:0;position:absolute;left:0;right:0;top:100%;z-index:5;
          max-height:212px;overflow-y:auto;background:var(--color-surface);border:1px solid var(--color-divider);
          border-radius:6px;box-shadow:var(--shadow-lg)"></ul>
      </div>
      <div id="rv-who-say" style="font-size:11.5px;line-height:1.5;margin-top:5px;color:var(--color-neutral-600)">${
        _rvE(i18t('rv_who_hint'))}</div>
      <input type="hidden" id="rv-who-id" value=""/>
    </div>` : `<div style="font-size:11.5px;color:var(--st-amber-fg);background:var(--st-amber-bg);
      border:1px solid var(--st-amber-line);border-radius:7px;padding:9px 11px;margin-bottom:12px;line-height:1.5">${_rvE(i18t('rv_no_colleagues'))}</div>`}

    <label for="rv-note" style="${RV_LBL}">${_rvE(i18t('rv_note_label'))}</label>
    <textarea id="rv-note" rows="3" style="${RV_FLD}margin-bottom:12px;resize:vertical"
      placeholder="${_rvE(i18t('rv_note_ph'))}"></textarea>

    <label for="rv-due" style="${RV_LBL}">${_rvE(i18t('rv_due_label'))}</label>
    <input id="rv-due" type="date" value="${_rvE(due)}" style="${RV_FLD}margin-bottom:12px"/>

    ${(window.API_MODE && window.API_MODE()) ? `<label style="display:flex;gap:8px;align-items:flex-start;font-size:11.5px;color:var(--color-neutral-700);margin-bottom:14px;cursor:pointer">
      <input id="rv-email" type="checkbox" checked style="margin-top:2px"/>
      <span>${_rvE(i18t('rv_email_them'))}</span></label>` : ''}

    <div style="border:1px solid var(--color-divider);border-radius:8px;padding:11px 13px;background:var(--color-bg);margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:6px">${_rvE(i18t('rv_in_scope'))}</div>
      ${scope.ours.length ? `<div style="font-size:11px;font-weight:700;color:var(--color-text);margin:4px 0 2px">${_rvE(i18tn('rv_scope_ours', scope.ours.length, { n: scope.ours.length }))}</div>
        <ul style="list-style:none;margin:0;padding:0">${scope.ours.map(row).join('')}</ul>` : ''}
      ${scope.theirs.length ? `<div style="font-size:11px;font-weight:700;color:var(--color-text);margin:9px 0 2px">${_rvE(i18tn('rv_scope_theirs', scope.theirs.length, { n: scope.theirs.length }))}</div>
        <ul style="list-style:none;margin:0;padding:0">${scope.theirs.map(row).join('')}</ul>` : ''}
      ${!scope.all.length ? `<div style="font-size:11.5px;color:var(--color-neutral-700)">${_rvE(i18t('rv_nothing_to_review'))}</div>` : ''}
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button id="rv-cancel-modal" class="ui-btn">${_rvE(i18t('act_cancel'))}</button>
      <button id="rv-send" class="ui-btn ui-btn-primary"${(!people.length || !scope.all.length) ? ' disabled' : ''}>${_rvE(i18t('rv_send_btn'))}</button>
    </div>
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
function reviewWirePicker(){
  const box = document.getElementById('rv-who');
  const list = document.getElementById('rv-who-list');
  const say = document.getElementById('rv-who-say');
  const hid = document.getElementById('rv-who-id');
  const caret = document.getElementById('rv-who-caret');
  if (!box || !list) return { get: () => null };

  let pick = null, active = null, open = false;

  const paint = () => {
    list.innerHTML = reviewPickerListHtml(box.value, active);
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
    const r = reviewResolvePerson(box.value);
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
    const hits = reviewSearchPeople(box.value, 8).hits;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp'){
      ev.preventDefault();
      if (!hits.length) return;
      open = true;
      const at = hits.findIndex(u => String(u.id) === String(active));
      const next = ev.key === 'ArrowDown'
        ? (at < 0 ? 0 : Math.min(at + 1, hits.length - 1))
        : (at <= 0 ? 0 : at - 1);
      active = hits[next].id;
      box.setAttribute('aria-activedescendant', 'rv-opt-' + active);
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
  window.openModal(reviewAskModalHtml(c), { maxWidth: '34rem' });
  const done = () => { if (typeof opts.after === 'function') opts.after(); };
  const picker = reviewWirePicker();
  document.getElementById('rv-cancel-modal')?.addEventListener('click', () => window.closeModal());
  document.getElementById('rv-send')?.addEventListener('click', async () => {
    const box = document.getElementById('rv-who');
    const u = picker.get();
    if (!u){
      /* Refused HERE, with the reason, rather than by a disabled button. A
         button that is simply grey tells you nothing about which of the four
         things you got wrong. */
      const r = reviewResolvePerson(box ? box.value : '');
      _rvSay(r.why || i18t('rv_pick_someone'), 'err');
      if (box) box.focus();
      return;
    }
    const note = (document.getElementById('rv-note') || {}).value || '';
    const dueV = (document.getElementById('rv-due') || {}).value || '';
    const rv = reviewAsk(c, { reviewer: u || {}, note, due: dueV });
    if (!rv) return;
    _rvSave(c);
    window.closeModal();
    /* THE EMAIL IS A COURTESY AND THE RECORD IS NOT. The request is filed
       whatever the mail provider does — a failed send must never lose the
       review — so this runs after the record exists and its failure is reported
       rather than thrown. */
    const wantMail = !!(document.getElementById('rv-email') || {}).checked;
    let mailed = false;
    if (wantMail && window.API_MODE && window.API_MODE() && window.api){
      try{
        const r = await window.api('contracts/' + c.id + '/review-request', 'POST', {
          reviewerId: (u && u.id) || null, reviewerEmail: (u && u.email) || null,
          note, due: dueV, reviewId: rv.id });
        mailed = !!(r && r.emailSent);
      }catch(_){ mailed = false; }
    }
    _rvSay(mailed ? i18t('rv_sent_mailed', { who: rv.reviewer.name })
      : i18t('rv_sent_quiet', { who: rv.reviewer.name }));
    done();
  });
}

function openReviewReturnModal(c, opts = {}){
  if (!window.openModal) return;
  const scope = reviewScope(c);
  const cleared = scope.ours.filter(reviewCleared).length;
  const held = scope.ours.filter(reviewHeld).length;
  const advised = scope.theirs.filter(x => reviewOn(x)).length;
  const unmarked = scope.ours.filter(x => !reviewOn(x)).length;
  window.openModal(`
    <div style="padding:18px 20px 16px">
      <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0 0 4px">${_rvE(i18t('rv_return_title'))}</h2>
      <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55">${_rvE(i18t('rv_return_sub'))}</p>
      <div style="border:1px solid var(--color-divider);border-radius:8px;padding:11px 13px;background:var(--color-bg);margin-bottom:12px;font-size:12px;line-height:1.7">
        <div><b>${cleared}</b> ${_rvE(i18t('rv_tally_cleared'))}</div>
        <div><b>${held}</b> ${_rvE(i18t('rv_tally_held'))}</div>
        <div><b>${advised}</b> ${_rvE(i18t('rv_tally_advised'))}</div>
        ${unmarked ? `<div style="color:var(--st-ruby-fg);margin-top:5px"><b>${unmarked}</b> ${_rvE(i18t('rv_tally_unmarked'))}</div>` : ''}
      </div>
      <label style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${_rvE(i18t('rv_return_note_label'))}</label>
      <textarea id="rv-rnote" rows="3" style="${RV_FLD}margin-bottom:14px;resize:vertical" placeholder="${_rvE(i18t('rv_return_note_ph'))}"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="rv-rcancel" class="ui-btn">${_rvE(i18t('act_cancel'))}</button>
        <button id="rv-rok" class="ui-btn ui-btn-primary"${unmarked ? ' disabled' : ''}>${_rvE(i18t('rv_return_btn'))}</button>
      </div>
    </div>`, { maxWidth: '30rem' });
  document.getElementById('rv-rcancel')?.addEventListener('click', () => window.closeModal());
  document.getElementById('rv-rok')?.addEventListener('click', () => {
    const note = (document.getElementById('rv-rnote') || {}).value || '';
    const rv = reviewReturn(c, { note });
    if (!rv) return;
    _rvSave(c);
    window.closeModal();
    _rvSay(i18t('rv_returned_toast', { who: rv.by }));
    if (typeof opts.after === 'function') opts.after();
  });
}

function openReviewNoteModal(c, changeId, opts = {}){
  if (!window.openModal) return;
  const ch = (window.negoChangeById ? window.negoChangeById(c, changeId) : null);
  const cur = ch && reviewOn(ch);
  window.openModal(`
    <div style="padding:18px 20px 16px">
      <h2 style="font-family:var(--font-heading);font-weight:600;font-size:17px;margin:0 0 4px">${_rvE(i18t('rv_note_title_modal', { id: changeId }))}</h2>
      <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55">${_rvE(i18t('rv_note_sub'))}</p>
      <textarea id="rv-cnote" rows="4" style="${RV_FLD}margin-bottom:14px;resize:vertical">${_rvE((cur && cur.note) || '')}</textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="rv-ccancel" class="ui-btn">${_rvE(i18t('act_cancel'))}</button>
        <button id="rv-cok" class="ui-btn ui-btn-primary">${_rvE(i18t('act_save'))}</button>
      </div>
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
    const act = ev.target.closest && ev.target.closest('[data-rv-act]');
    if (act){
      ev.preventDefault(); ev.stopPropagation();
      const what = act.getAttribute('data-rv-act');
      if (what === 'rv-ask') openReviewAskModal(c, { after: again });
      else if (what === 'rv-return') openReviewReturnModal(c, { after: again });
      else if (what === 'rv-cancel'){
        if (reviewCancel(c)){ _rvSave(c); _rvSay(i18t('rv_cancelled_toast')); again(); }
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
  reviewAsk, reviewCancel, reviewMark, reviewReturn,
  reviewGateCfg, saveReviewGateCfg, reviewGateApplies, reviewGate, reviewGateMessage,
  reviewState, reviewInboxFor, reviewWhen,
  reviewSeatShowsReview, reviewChipHtml, reviewVerbsHtml, reviewBannerHtml,
  reviewSearchPeople, reviewResolvePerson, reviewPersonRowHtml, reviewPickerListHtml,
  RV_FLD, RV_LBL, reviewWirePicker,
  reviewAskModalHtml, openReviewAskModal, openReviewReturnModal, openReviewNoteModal,
  reviewWireCards,
});
