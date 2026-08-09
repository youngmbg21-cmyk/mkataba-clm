// HaTi — THE NEGOTIATION DESK: who is working this negotiation, and who sends.
/* ============================================================
   THE GAP THIS FILLS

   Two questions stand between a person and a redline today: what is your role
   (Admin, Editor, Viewer) and which value streams can you see. Pass both and
   you may change any wording in any contract in that stream. There is no third
   question, so there is no idea of "this negotiation is Young's".

   In a room of three that is fine. It fails the afternoon two people are
   redrafting the same clause without knowing it, and it fails badly the day
   somebody publishes a round the person actually running the deal never agreed
   to. Nothing in the product stopped either.

   So a negotiation now opens a DESK, and the desk asks the third question:
   ARE YOU ON THIS ONE?

   FOUR SEATS, and the whole design rests on the line between the middle two:

     INITIATOR    whoever started it. Stamped once, never changes, grants
                  nothing. It is history — "where did this come from" a year on.
     LEAD         exactly one, accountable, and the ONLY person who reaches the
                  counterparty. Defaults to the initiator; transferable.
     CONTRIBUTOR  named by the lead. Full hands on our own draft — write
                  redlines, correct anyone's wording, comment, escalate. Nothing
                  they do travels.
     READER       everybody else with stream access. Reads the document, the
                  redlines and the history, has no hands, and has one button:
                  ask to join.

   THE LINE: PROPOSING IS NOT REACHING. A contributor may write anything into
   our draft; only the lead may put it in front of the other side. Every hard
   case — reviewers, handovers, holidays, an admin stepping in — resolves
   against that one sentence.

   IT IS THE REVIEW FEATURE'S OWN WALL, ONE STEP EARLIER. js/review.js already
   narrows a person this way: a reviewer corrects wording but cannot publish a
   round, close one, or answer the counterparty. The desk reuses that posture
   rather than inventing a second one, which is why rlActorHeld — the view-side
   reading FIVE renderers ask — is the place the two meet.

   WHAT THE COUNTERPARTY LEARNS: the lead's name, because a deal has a named
   contact and always has. Nothing else. Not the contributors, not the desk,
   not that a colleague asked to join and was refused. buildSharePayload is an
   allow-list, so that is true by construction — and restated in the tests,
   because "true by construction" holds only until somebody adds a field.

   READING NEVER WRITES. deskInit creates c.desk; only the acts call it. The
   same lesson js/review.js records at reviewInit, and for the same reason: a
   render that stamps an empty object onto every contract anybody looks at
   turns every repaint into a save.
   ============================================================ */

/* ---- EVERY SHELL FUNCTION IS REACHED THROUGH `window`, AND IT HAS TO BE ----
   js/core.js declares its shell as `const currentUser = …`, `const getUsers =
   …`. A `const` at the top of a script is a LEXICAL binding, not a property of
   the global object, so a bare call here resolves to core.js's own copy and can
   never be substituted in a harness. js/review.js carries this warning in
   almost these words, and it is repeated rather than shared because the trap is
   invisible when you fall into it.

   `state` is the opposite case and is left BARE on purpose: it is core.js's
   `const state` and there is no window.state at all, so `window.state && …`
   reads as "no settings" forever — which is exactly how the review gate was
   silently disabled on every workspace that switched it on. */
const _dkNow = () => (window.nowISO ? window.nowISO() : new Date().toISOString());
const _dkMe = () => (window.currentUser ? window.currentUser() : null) || null;
const _dkSay = (msg, kind) => { if (window.toast) window.toast(msg, kind); };
const _dkAudit = (c, action, detail) => { if (window.logAudit) window.logAudit(c, action, detail); };
const _dkSave = c => { if (window.persist) window.persist(c); };
function _dkState(){
  try{ if (typeof state !== 'undefined' && state) return state; }catch(_){}
  return (typeof window !== 'undefined' && window.state) || null;
}
const _dkE = s => String(s == null ? '' : s)
  .replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const _dkIsAdmin = u => { const me = u || _dkMe(); return !!(me && me.role === 'admin'); };
/* A REASON IS A SENTENCE, NOT AN ESSAY. js/review.js learned this when a pasted
   Copilot answer became the banner; the same box, the same cap, before the same
   thing happens to the lead's decisions card. */
const DK_WHY_MAX = 300;
const _dkClamp = (s, n) => {
  const t = String(s == null ? '' : s).trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

/* ---------- the store ----------
   ONE object per contract, and every field on it is about people rather than
   wording. The change model neither reads it nor hashes it — same relationship
   `ch.review` has, and for the same reason: a change is evidence, and a desk is
   an internal arrangement that may be rearranged all day without the record of
   what was proposed moving an inch. */
function deskInit(c){
  if (!c) return null;
  if (!c.desk || typeof c.desk !== 'object' || Array.isArray(c.desk)) c.desk = {};
  if (!Array.isArray(c.desk.contributors)) c.desk.contributors = [];
  if (!Array.isArray(c.desk.joinRequests)) c.desk.joinRequests = [];
  return c.desk;
}
/* THE READ, and it is a read. See the header note on reviewInit. */
function deskOf(c){
  return (c && c.desk && typeof c.desk === 'object' && !Array.isArray(c.desk)) ? c.desk : null;
}
/* A desk exists and has not been closed. Absence is meaningful and is NOT an
   error: every contract that existed before this feature has no desk, and no
   desk means the behaviour this product has always had. Nothing is locked
   retroactively — see deskMayRedline. */
function deskIsOpen(c){
  const d = deskOf(c);
  return !!(d && d.leadId && !d.closedAt);
}
function deskLead(c){
  const d = deskOf(c);
  if (!d || !d.leadId) return null;
  return { id: d.leadId, name: d.leadName || '', email: d.leadEmail || null };
}
function deskInitiator(c){
  const d = deskOf(c);
  if (!d || !d.byId) return null;
  return { id: d.byId, name: d.by || '' };
}
/* Matched on ID FIRST and name second — two colleagues with one name is a real
   workspace and a record written before ids were stamped is a real old record,
   so both are tried in the order that cannot be spoofed. Lifted from
   reviewIsReviewer deliberately: one matching rule for the whole product. */
function _dkSamePerson(a, b){
  if (!a || !b) return false;
  if (a.id && b.id) return String(a.id) === String(b.id);
  return !!a.name && String(a.name) === String(b.name);
}
function deskIsLead(c, u){
  const me = u || _dkMe();
  const lead = deskLead(c);
  return !!(me && lead && _dkSamePerson(lead, me));
}

/* ---------- opening it ----------
   THE CLAIM IS THE FIRST ACT, NOT A FORM. A dialog nobody asked for in front of
   the first redline somebody types is a dialog they will learn to dismiss, and
   an ownership model people dismiss is worse than none — it records the wrong
   name with the same confidence as the right one.

   So the desk is claimed by whoever first files a change on our side, through
   negoFileChange, which is the one funnel every authoring path in the product
   converges on: direct edit, the clause library, Copilot, both playbook
   entrances and the Word round-trip. A path that files a change claims the
   desk; there is no second place to remember.

   AND IT CAN BE CLAIMED DELIBERATELY, from the header, by somebody who wants to
   name a different lead before any wording exists. Same function, same audit
   line — the deliberate route just passes a lead. */
function deskOpen(c, o = {}){
  if (!c) return null;
  const me = _dkMe();
  const lead = o.lead || me;
  if (!lead || !lead.id) return null;
  const d = deskInit(c);
  /* ALREADY CLAIMED IS NOT AN ERROR AND MUST NOT BE A SILENT OVERWRITE. Two
     people press at the same moment; the first wins and the second is told who
     leads, rather than quietly taking it from them. */
  if (d.leadId && !d.closedAt) return d;
  const starter = o.by || me || { id: null, name: 'System' };
  /* The initiator is stamped ONCE. Re-opening a closed desk keeps whoever
     started the negotiation in the first place — that is the fact the field
     exists to hold, and rewriting it would make it a duplicate of the lead. */
  if (!d.byId){
    d.by = String(starter.name || 'System');
    d.byId = starter.id || null;
    d.openedAt = _dkNow();
  }
  d.leadId = lead.id;
  d.leadName = String(lead.name || '');
  d.leadEmail = lead.email || null;
  d.leadSince = _dkNow();
  d.closedAt = null;
  _dkAudit(c, 'Negotiation desk',
    `Negotiation opened by ${d.by} — ${d.leadName}${_dkSamePerson(lead, starter) ? '' : ', named by ' + String(starter.name || 'System')} leads it`);
  return d;
}

/* The funnel's hook. Deliberately quiet: it returns the desk or null and says
   nothing to anybody, because filing a redline is the act the person meant to
   perform and a toast about desk bookkeeping on top of it is noise.

   OUR SIDE ONLY. A change arriving from the counterparty — through a link, a
   returned .docx, or typed in on their behalf — is not somebody in this office
   starting work, and letting it claim the desk would hand the negotiation to
   whoever happened to import their response. */
function deskClaimOnFile(c, side){
  if (!c) return null;
  if (side !== 'owner') return null;
  if (deskIsOpen(c)) return deskOf(c);
  const me = _dkMe();
  if (!me || !me.id) return null;
  return deskOpen(c, { lead: me, by: me });
}

/* ---------- the contributors ----------
   A LIST OF PEOPLE, and the only thing on the desk that changes often. Named by
   the lead, and by an admin — see deskMayManage.

   WHAT REMOVAL DOES NOT DO: it does not touch their drafts. The work belongs to
   the desk rather than to the person who typed it, and a removal that deleted
   wording would be the single most damaging thing this feature could do — you
   take somebody off a deal on Friday and lose four clauses of redlining with
   them. They lose the hands; the work stays where it is. */
function deskContributors(c){
  const d = deskOf(c);
  return (d && Array.isArray(d.contributors)) ? d.contributors : [];
}
function deskIsContributor(c, u){
  const me = u || _dkMe();
  if (!me) return false;
  return deskContributors(c).some(p => _dkSamePerson(p, me));
}
/* Lead or contributor: the people with hands on this negotiation. */
function deskIsMember(c, u){
  const me = u || _dkMe();
  return !!(me && (deskIsLead(c, me) || deskIsContributor(c, me)));
}
/* ---------- what seat is this person in ----------
   'lead' | 'contributor' | 'reader', or null meaning THERE IS NO DESK — which
   is not the same as being a reader and must never be flattened into it. No
   desk is every contract written before this feature and every contract nobody
   has started negotiating; it means "the old rules", and the old rules let any
   Editor with stream access work. Returning 'reader' there would lock the whole
   back catalogue on the morning this shipped. */
function deskRole(c, u){
  const me = u || _dkMe();
  if (!me || !deskIsOpen(c)) return null;
  if (deskIsLead(c, me)) return 'lead';
  if (deskIsContributor(c, me)) return 'contributor';
  return 'reader';
}
/* WHO MAY CHANGE THE ROSTER. The lead, because it is their negotiation, and an
   admin, so nothing is stuck when somebody is away — the same two answers
   reviewMayCancel gives, for the same reason. A contributor cannot add another
   contributor: being let in is not the same as being able to let others in, and
   a roster that grows sideways is a roster nobody is accountable for. */
function deskMayManage(c, u){
  const me = u || _dkMe();
  if (!me || !deskIsOpen(c)) return false;
  return _dkIsAdmin(me) || deskIsLead(c, me);
}

/* Who can be put on a desk. Viewers are out — a viewer cannot change wording
   anywhere else in the product, so a contributor's seat they could not use
   would be a promise the screen cannot keep. The lead is out because they are
   already here, and anyone already on the desk is out for the same reason.

   AND THEY MUST BE ABLE TO OPEN THE CONTRACT. A member restricted to other
   value streams never sees this one — the server keeps it out of every query
   they make — so adding them files a name against a document they cannot
   reach. js/review.js refuses the same thing on the same grounds, and the
   server refuses it for both. */
function deskCandidates(c){
  const lead = deskLead(c);
  const on = new Set(deskContributors(c).map(p => String(p.id || p.name)));
  const folder = c && c.folder;
  const reaches = u => {
    if (!folder || typeof window.canAccessFolder !== 'function') return true;
    try{ return canAccessFolder(folder, u); }catch(_){ return true; }
  };
  return (window.getUsers ? window.getUsers() : []).filter(u =>
    u && u.role !== 'viewer'
    && !(lead && String(u.id) === String(lead.id))
    && !on.has(String(u.id))
    && reaches(u));
}
const _dkEmail = s => String(s || '').trim().toLowerCase();
const _dkIsEmailish = s => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(String(s || '').trim());
/* Best matches first. Same scoring as the review's picker and deliberately so —
   two lists of colleagues that ranked differently would read as one of them
   being broken. */
function deskSearchPeople(q, limit, c){
  const all = deskCandidates(c);
  const s = String(q || '').trim().toLowerCase();
  if (!s) return { hits: all.slice(0, limit || 8), total: all.length };
  const score = u => {
    const n = String(u.name || '').toLowerCase(), e = _dkEmail(u.email);
    if (e === s || n === s) return 0;
    if (n.startsWith(s) || e.startsWith(s)) return 1;
    if (n.indexOf(s) >= 0 || e.indexOf(s) >= 0) return 2;
    return 9;
  };
  return (() => {
    const hits = all.map(u => ({ u, r: score(u) })).filter(x => x.r < 9)
      .sort((a, b) => a.r - b.r || String(a.u.name).localeCompare(String(b.u.name)))
      .map(x => x.u);
    return { hits: hits.slice(0, limit || 8), total: hits.length };
  })();
}
/* What a typed string resolves to: { ok, user } or { ok:false, why }, where
   `why` is a sentence and is printed as-is. FIVE refusals with five different
   sentences, because "not a member", "a viewer", "already on this desk", "the
   lead" and "no such person" are five different mistakes and a single grey
   "invalid" tells you which of them you made: none. */
function deskResolvePerson(q, c){
  const raw = String(q || '').trim();
  if (!raw) return { ok: false, why: i18t('dk_pick_someone') };
  const typed = raw.indexOf('<') >= 0 ? raw.slice(raw.indexOf('<') + 1).replace('>', '').trim() : raw;
  const s = typed.toLowerCase();
  const all = (window.getUsers ? window.getUsers() : []);
  let hit = all.find(u => u && _dkEmail(u.email) === s)
    || all.find(u => u && String(u.name || '').trim().toLowerCase() === s);
  if (!hit){
    const near = all.filter(u => u && (String(u.name || '').toLowerCase().indexOf(s) >= 0
      || _dkEmail(u.email).indexOf(s) >= 0));
    if (near.length === 1) hit = near[0];
    else if (near.length > 1) return { ok: false, why: i18t('dk_who_ambiguous', { n: near.length }) };
  }
  if (!hit) return { ok: false,
    why: _dkIsEmailish(typed) ? i18t('dk_who_not_a_member', { email: typed }) : i18t('dk_who_no_match') };
  if (hit.role === 'viewer') return { ok: false, why: i18t('dk_who_is_viewer', { who: hit.name }) };
  if (deskIsLead(c, hit)) return { ok: false, why: i18t('dk_who_is_lead', { who: hit.name }) };
  if (deskIsContributor(c, hit)) return { ok: false, why: i18t('dk_who_already_on', { who: hit.name }) };
  if (c && c.folder && typeof window.canAccessFolder === 'function'){
    let reaches = true;
    try{ reaches = canAccessFolder(c.folder, hit); }catch(_){ reaches = true; }
    if (!reaches) return { ok: false, why: i18t('dk_who_no_stream', { who: hit.name }) };
  }
  return { ok: true, user: hit };
}

function deskAddContributor(c, user, o = {}){
  if (!c || !user || !user.id) return null;
  const actor = o.by || _dkMe();
  if (!o.force && !deskMayManage(c, actor)){
    _dkSay(i18t('dk_only_lead_manages', { who: (deskLead(c) || {}).name || '' }), 'err');
    return null;
  }
  if (deskIsContributor(c, user) || deskIsLead(c, user)) return null;
  const d = deskInit(c);
  const row = { id: user.id, name: String(user.name || ''), email: user.email || null,
    at: _dkNow(), byId: (actor && actor.id) || null, by: String((actor && actor.name) || 'System') };
  d.contributors.push(row);
  /* Answering an outstanding request IS adding them, so the request is settled
     here rather than left to whichever caller happened to know about it. */
  _dkSettleJoin(c, user.id, 'approved', actor);
  _dkAudit(c, 'Negotiation desk',
    `${row.name} added as a contributor by ${row.by}`);
  return row;
}
function deskRemoveContributor(c, userId, o = {}){
  const actor = o.by || _dkMe();
  if (!o.force && !deskMayManage(c, actor)){
    _dkSay(i18t('dk_only_lead_manages', { who: (deskLead(c) || {}).name || '' }), 'err');
    return null;
  }
  const d = deskOf(c);
  if (!d || !Array.isArray(d.contributors)) return null;
  const i = d.contributors.findIndex(p => String(p.id) === String(userId));
  if (i < 0) return null;
  const [gone] = d.contributors.splice(i, 1);
  _dkAudit(c, 'Negotiation desk',
    `${gone.name} removed as a contributor by ${String((actor && actor.name) || 'System')}`
    + ' — their drafts stay on the record');
  return gone;
}

/* ---------- handing over ----------
   THE LEAD MOVES, THE INITIATOR DOES NOT. Who started a negotiation is history;
   who is answerable for it today is a live fact, and conflating them would mean
   the record forgot where the deal came from the first time somebody went on
   leave.

   The outgoing lead stays on the desk as a contributor. They were working this
   an hour ago and almost certainly still have wording in flight; dropping them
   to a reader in the same keystroke would be a second, unasked-for decision. */
function deskHandover(c, user, o = {}){
  if (!c || !user || !user.id) return null;
  const actor = o.by || _dkMe();
  if (!o.force && !deskMayManage(c, actor)){
    _dkSay(i18t('dk_only_lead_manages', { who: (deskLead(c) || {}).name || '' }), 'err');
    return null;
  }
  const d = deskOf(c);
  if (!d || !d.leadId) return null;
  const was = deskLead(c);
  if (String(was.id) === String(user.id)) return null;
  /* The new lead may have been a contributor; they cannot be both. */
  const i = d.contributors.findIndex(p => String(p.id) === String(user.id));
  if (i >= 0) d.contributors.splice(i, 1);
  if (was.id && !deskIsContributor(c, was))
    d.contributors.push({ id: was.id, name: was.name, email: was.email || null,
      at: _dkNow(), by: String((actor && actor.name) || 'System'), wasLead: true });
  d.leadId = user.id;
  d.leadName = String(user.name || '');
  d.leadEmail = user.email || null;
  d.leadSince = _dkNow();
  _dkSettleJoin(c, user.id, 'approved', actor);
  _dkAudit(c, 'Negotiation desk',
    `Lead handed from ${was.name} to ${d.leadName} by ${String((actor && actor.name) || 'System')}`);
  return deskLead(c);
}

/* ---------- asking to join ----------
   A LOCKED SCREEN WITH NO WAY FORWARD IS HOW PEOPLE LEARN TO ROUTE AROUND A
   SYSTEM. They phone the lead, the lead pastes wording into an email, and the
   negotiation leaves the product — which is the fragmentation HaTi exists to
   end. So a reader always has exactly one button, and pressing it puts a
   request where the lead already looks for decisions. */
function deskJoinRequests(c){
  const d = deskOf(c);
  return (d && Array.isArray(d.joinRequests)) ? d.joinRequests : [];
}
function deskJoinPending(c){
  return deskJoinRequests(c).filter(r => r && r.status === 'pending');
}
function deskJoinPendingFor(c, u){
  const me = u || _dkMe();
  if (!me) return null;
  return deskJoinPending(c).find(r => String(r.id) === String(me.id)) || null;
}
function _dkSettleJoin(c, userId, status, actor){
  const d = deskOf(c);
  if (!d || !Array.isArray(d.joinRequests)) return;
  d.joinRequests.forEach(r => {
    if (r && r.status === 'pending' && String(r.id) === String(userId)){
      r.status = status;
      r.settledAt = _dkNow();
      r.settledBy = String((actor && actor.name) || 'System');
    }
  });
}
function deskRequestJoin(c, o = {}){
  const me = o.by || _dkMe();
  if (!me || !me.id) return null;
  if (!deskIsOpen(c)) return null;
  if (deskIsMember(c, me)) return null;
  if (deskJoinPendingFor(c, me)) return null;      // asking twice is still one ask
  const d = deskInit(c);
  const row = { id: me.id, name: String(me.name || ''), email: me.email || null,
    at: _dkNow(), why: String(o.why || '').trim().slice(0, DK_WHY_MAX) || null, status: 'pending' };
  d.joinRequests.push(row);
  _dkAudit(c, 'Negotiation desk',
    `${row.name} asked to join this negotiation${row.why ? `; “${row.why}”` : ''}`);
  return row;
}
function deskDeclineJoin(c, userId, o = {}){
  const actor = o.by || _dkMe();
  if (!o.force && !deskMayManage(c, actor)){
    _dkSay(i18t('dk_only_lead_manages', { who: (deskLead(c) || {}).name || '' }), 'err');
    return null;
  }
  const row = deskJoinPending(c).find(r => String(r.id) === String(userId));
  if (!row) return null;
  _dkSettleJoin(c, userId, 'declined', actor);
  _dkAudit(c, 'Negotiation desk',
    `${row.name}'s request to join was declined by ${String((actor && actor.name) || 'System')}`);
  return row;
}
/* Every contract where somebody is waiting on THIS person to answer a request.
   Read by the dashboard, and by nothing else — a filter over state.contracts,
   which the server has already scoped, so it can only list paper this reader is
   allowed to see. Same shape and same reasoning as reviewInboxFor. */
function deskJoinInboxFor(cs, u){
  const me = u || _dkMe();
  if (!me) return [];
  const out = [];
  (cs || []).forEach(c => {
    if (!deskMayManage(c, me)) return;
    deskJoinPending(c).forEach(r => out.push({ c, req: r }));
  });
  return out;
}

/* ============================================================
   THE SHARED DRAWING

   Built HERE and never in a view. The project's own rule, learned the day
   formatting-only changes shipped: a fix in a shared FUNCTION reaches both
   shells, a fix in a renderer reaches one. The desk is drawn on the contract
   room, on the negotiation workbench and on the phone, and all three call this.
   ============================================================ */

/* ---- WHICH SEATS SEE THE DESK AT ALL ----
   ONE predicate, asked by everything, for the reason reviewSeatShowsReview
   gives in its own words: three separate readings of "is this the counterparty
   looking" is how two of them agree and the third does not.

   The desk is INTERNAL. Who works a negotiation on our side is our business,
   and a chip reading "Grace and 2 others" on the counterparty's page would hand
   them our team structure on every repaint. The lead's NAME travels, once, as
   the named contact on the share payload — that is a deliberate and separate
   act, and it is not this chip. */
function deskSeatShowsDesk(opts){
  if (typeof window !== 'undefined' && window.PORTAL_MODE) return false;
  const o = opts || {};
  if (o.previewing) return false;          // the owner's Counterparty View
  if (o.side === 'counterparty') return false;
  return true;
}

/* Initials, for the face. Two letters, because three is a monogram and one is a
   coincidence. */
function deskInitials(name){
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function _dkFaceHtml(name, isLead, i){
  return `<span class="dk-face${isLead ? ' dk-face-lead' : ''}" title="${_dkE(name)}"
    style="margin-left:${i ? '-7px' : '0'}">${_dkE(deskInitials(name))}</span>`;
}

/* ---- THE WHOLE FEATURE, IN THE HEADER THAT ALREADY EXISTS ----
   Reported as the brief (Young, 09 Aug 2026): "I am concerned about the spacing
   of the page because more information infringes on the contract space leaving
   a user with a cluttered page."

   The instinct with a feature like this is to give it a strip across the top of
   the workbench. That strip would join a queue — the room header, the five
   tabs, the negotiate toolbar, and the review banner — five bands of chrome
   above the first word of the agreement.

   So the rule this is drawn to: A BAND APPEARS ONLY WHEN IT CHANGES WHAT YOU
   CAN DO RIGHT NOW. Who leads a negotiation does not change what you can do. It
   is a fact about the contract, like its value and its stream, and it goes in
   the header where the facts already are — one control, two pixels of height,
   no new row. Being unable to act DOES change what you can do, and that gets a
   band; see deskNoticeHtml, which shares the review banner's single slot rather
   than opening a second one.

   Drawn by roomHeadHtml, so the contract room and the negotiation workbench get
   it from the one function both of them already call. */
function deskChipHtml(c, opts = {}){
  if (!c || !deskSeatShowsDesk(opts)) return '';
  const me = _dkMe();
  if (!me) return '';
  const d = deskOf(c);
  /* NOTHING CLAIMED YET, and this reader could claim it. An empty space where
     the control will be is worse than the control: the person cannot tell
     whether the feature exists. It says what pressing it does. */
  if (!deskIsOpen(c)){
    if (!(window.canEdit ? window.canEdit() : true)) return '';
    if (c.status === 'Signed' || (window.negoExecuted && window.negoExecuted(c))) return '';
    return `<button type="button" id="dk-chip" class="dk-chip dk-chip-empty" data-dk-open="1"
      title="${_dkE(i18t('dk_claim_title'))}">
      <span class="dk-who">${_dkE(i18t('dk_claim'))}</span></button>`;
  }
  const lead = deskLead(c);
  const role = deskRole(c, me);
  const others = deskContributors(c);
  /* THREE FACES AT MOST. A stack of nine avatars is a crowd, not information,
     and the count says the rest in four characters. */
  const shown = [lead].concat(others.slice(0, 2));
  const faces = shown.map((p, i) => _dkFaceHtml(p.name, i === 0, i)).join('')
    + (others.length > 2 ? `<span class="dk-face dk-face-more" style="margin-left:-7px">+${others.length - 2}</span>` : '');
  const who = role === 'lead'
    ? (others.length ? i18t('dk_you_lead_n', { n: others.length }) : i18t('dk_you_lead'))
    : role === 'contributor' ? i18t('dk_you_contribute', { who: lead.name })
    : i18t('dk_who_leads', { who: lead.name });
  const pending = deskMayManage(c, me) ? deskJoinPending(c).length : 0;
  return `<button type="button" id="dk-chip" class="dk-chip" data-dk-manage="1"
    data-dk-role="${_dkE(role || '')}" aria-haspopup="dialog"
    title="${_dkE(i18t('dk_chip_title', { who: lead.name }))}">
    <span class="dk-faces">${faces}</span>
    <span class="dk-who">${who}</span>
    ${pending ? `<span class="dk-pip" title="${_dkE(i18tn('dk_pending_n', pending, { n: pending }))}">${pending}</span>` : ''}
  </button>`;
}

/* ---- THE ONE BAND, AND ONLY WHEN SOMETHING REFUSES ----
   The density rule this feature is drawn to, stated at deskChipHtml: a band
   appears only when it changes what you can do right now. Leading a negotiation
   changes nothing you can do, so a lead and a contributor see NO band at all —
   their state is the chip in the header and the verbs on their own cards.

   A READER is the one seat that needs a sentence, because the page in front of
   them is missing verbs and an unexplained absence reads as a broken page.

   AND IT SHARES THE REVIEW'S SLOT rather than opening a second one. Two stacked
   amber bands above a contract is the clutter this whole design was briefed
   against, so the caller draws the review banner first and this only where that
   came back empty. Most restrictive first: a review hold is a refusal you can
   act on, and it outranks "you are reading". */
function deskNoticeHtml(c, opts = {}){
  if (!c || !deskSeatShowsDesk(opts)) return '';
  if (opts.readonly) return '';
  const me = _dkMe();
  if (!me || !deskIsOpen(c)) return '';
  if (deskIsMember(c, me)) return '';
  const lead = deskLead(c);
  const asked = deskJoinPendingFor(c, me);
  return `<div class="dk-notice" data-dk-notice="reader">
    <span class="dk-notice-tag">${_dkE(i18t('dk_reading_tag'))}</span>
    <span class="dk-notice-txt">${_dkE(i18t('dk_reading', { who: lead.name }))}</span>
    ${asked
      ? `<span class="dk-notice-said">${_dkE(i18t('dk_asked_already'))}</span>`
      : `<button type="button" class="dk-notice-btn" data-dk-join="1">${_dkE(i18t('dk_ask_to_join'))}</button>`}
  </div>`;
}

/* ONE DELEGATED LISTENER on the document, the pattern js/aichart.js uses and
   for the same reason: the chip lives inside a header that several paths
   repaint after the page has wired itself, and an element-bound listener is
   dropped by the first of them. Registered once, at load. */
function deskWireChip(){
  if (typeof document === 'undefined' || document._dkWired) return;
  document._dkWired = true;
  document.addEventListener('click', ev => {
    const el = ev.target && ev.target.closest && ev.target.closest('[data-dk-open],[data-dk-manage]');
    if (!el) return;
    /* The contract the room is open on, resolved the way both views resolve it
       — getContract(state.activeId). A delegated listener has no closure over
       the paint that drew the chip, which is the point of it. */
    const st = _dkState();
    const c = (window.getContract && st) ? window.getContract(st.activeId) : null;
    if (!c) return;
    ev.preventDefault();
    if (el.hasAttribute('data-dk-open')) deskOpenFromChip(c);
    else if (window.openDeskSheet) window.openDeskSheet(c);
  });
  /* The notice band's one button. Delegated for the same reason as the chip —
     it lives inside a pane several paths repaint, and an element-bound listener
     is dropped by the first of them. */
  document.addEventListener('click', ev => {
    const el = ev.target && ev.target.closest && ev.target.closest('[data-dk-join]');
    if (!el) return;
    const st = _dkState();
    const c = (window.getContract && st) ? window.getContract(st.activeId) : null;
    if (!c) return;
    ev.preventDefault();
    if (window.openDeskJoinAsk) window.openDeskJoinAsk(c);
  });
}
/* Claiming from the header. One press, no dialog: the person pressing is the
   person who would have been stamped by their first redline anyway, and asking
   them to confirm their own name is a question with one answer. Naming somebody
   else is the Manage-desk sheet's job, which arrives with the contributors. */
function deskOpenFromChip(c){
  const me = _dkMe();
  if (!me) return;
  if (!deskOpen(c, { lead: me, by: me })) return;
  _dkSave(c);
  _dkSay(i18t('dk_opened_toast'));
  if (window.renderRedline && window.state && window.state.view === 'redline') renderRedline();
  else if (window.renderWorkspace) renderWorkspace();
}

/* ============================================================
   THE DESK SHEET — everything else, off the working screen
   ============================================================
   Adding contributors, handing over, answering a request to join: none of it
   belongs on the page somebody is reading a contract on. It opens over the
   room and takes no permanent space at all, which is the fourth of the seven
   density rules this feature was designed to.

   RV_FLD / RV_LBL rather than a class: js/review.js explains why in its own
   words — `class="ui-input"` is not a class this application defines anywhere,
   and every field that used it rendered as stray text. Quoted from there
   deliberately, so the two dialogs cannot drift apart in appearance. */
const DK_FLD = (typeof window !== 'undefined' && window.RV_FLD) || '';
const DK_LBL = (typeof window !== 'undefined' && window.RV_LBL) || '';

function _dkPersonRow(p, right){
  return `<div class="dk-row">
    <span class="dk-face">${_dkE(deskInitials(p.name))}</span>
    <span class="dk-row-id">
      <span class="dk-row-name">${_dkE(p.name)}</span>
      <span class="dk-row-sub">${_dkE(p.sub || '')}</span>
    </span>
    ${right || ''}</div>`;
}

function deskSheetHtml(c){
  const me = _dkMe();
  const lead = deskLead(c) || { name: '', id: null };
  const d = deskOf(c) || {};
  const may = deskMayManage(c, me);
  const others = deskContributors(c);
  const pending = may ? deskJoinPending(c) : [];
  const when = at => (window.fmtDT ? String(window.fmtDT(at)).slice(0, 24) : String(at || '').slice(0, 10));
  return `
  <div style="padding:18px 20px 16px">
    <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0 0 4px">${_dkE(i18t('dk_sheet_title'))}</h2>
    <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 14px;line-height:1.55">${_dkE(i18t('dk_sheet_sub'))}</p>

    <div style="${DK_LBL}">${_dkE(i18t('dk_lead_label'))}</div>
    ${_dkPersonRow({ name: lead.name, sub: d.by ? i18t('dk_started_by', { who: d.by, when: when(d.openedAt) }) : '' },
      may ? `<button type="button" class="ui-btn" data-dk-handover="1" style="font-size:11px;padding:4px 9px">${_dkE(i18t('dk_handover_btn'))}</button>` : '')}

    <div style="${DK_LBL}margin-top:14px">${_dkE(i18tn('dk_contributors_n', others.length, { n: others.length }))}</div>
    ${others.length ? others.map(p => _dkPersonRow(
        { name: p.name, sub: i18t('dk_added_when', { when: when(p.at) }) },
        may ? `<button type="button" class="ui-btn" data-dk-remove="${_dkE(p.id)}" style="font-size:11px;padding:4px 9px">${_dkE(i18t('dk_remove_btn'))}</button>` : '')).join('')
      : `<p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 6px">${_dkE(i18t('dk_no_contributors'))}</p>`}

    ${may ? `
    <div style="position:relative;margin-top:8px">
      <input id="dk-who" type="text" role="combobox" autocomplete="off" spellcheck="false"
        aria-expanded="false" aria-controls="dk-who-list" aria-autocomplete="list"
        placeholder="${_dkE(i18t('dk_add_ph'))}" style="${DK_FLD}padding-right:30px"/>
      <button type="button" id="dk-who-caret" tabindex="-1" aria-label="${_dkE(i18t('dk_show_all'))}"
        style="position:absolute;right:1px;top:1px;bottom:1px;width:28px;border:0;background:transparent;
        cursor:pointer;color:var(--color-neutral-600);font-size:10px;line-height:1">&#9662;</button>
      <ul id="dk-who-list" role="listbox" hidden
        style="list-style:none;margin:2px 0 0;padding:0;position:absolute;left:0;right:0;top:100%;z-index:5;
        max-height:212px;overflow-y:auto;background:var(--color-surface);border:1px solid var(--color-divider);
        border-radius:6px;box-shadow:var(--shadow-lg)"></ul>
    </div>
    <div id="dk-who-say" style="font-size:11.5px;line-height:1.5;margin-top:5px;color:var(--color-neutral-600)">${_dkE(i18t('dk_add_hint'))}</div>
    <input type="hidden" id="dk-who-id" value=""/>
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button id="dk-add" class="ui-btn">${_dkE(i18t('dk_add_btn'))}</button>
    </div>` : ''}

    ${pending.length ? `
    <div style="${DK_LBL}margin-top:16px">${_dkE(i18tn('dk_requests_n', pending.length, { n: pending.length }))}</div>
    ${pending.map(r => `<div class="dk-row dk-row-ask">
      <span class="dk-face">${_dkE(deskInitials(r.name))}</span>
      <span class="dk-row-id">
        <span class="dk-row-name">${_dkE(r.name)}</span>
        ${r.why ? `<span class="dk-row-sub" title="${_dkE(r.why)}">“${_dkE(_dkClamp(r.why, 120))}”</span>` : ''}
      </span>
      <span style="display:flex;gap:6px;flex:none">
        <button type="button" class="ui-btn ui-btn-primary" data-dk-approve="${_dkE(r.id)}" style="font-size:11px;padding:4px 9px">${_dkE(i18t('dk_approve_btn'))}</button>
        <button type="button" class="ui-btn" data-dk-decline="${_dkE(r.id)}" style="font-size:11px;padding:4px 9px">${_dkE(i18t('dk_decline_btn'))}</button>
      </span></div>`).join('')}` : ''}

    ${''/* ---- WHAT THE OTHER SIDE KNOWS, ON THE PANEL THAT CHANGES IT ----
           Anybody rearranging a desk should be able to see, without leaving
           the panel, exactly what the counterparty has been told. It is the
           one line that stops somebody assuming the other side already knows
           something they do not — which is how a handover becomes a surprise. */}
    <div style="border-top:1px solid var(--color-divider);margin-top:16px;padding-top:11px;
      font-size:11.5px;color:var(--color-neutral-600);line-height:1.55">
      ${_dkE(i18t('dk_cp_knows', { cp: c.counterparty || i18t('dk_the_counterparty'), who: lead.name }))}
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
      <button id="dk-close" class="ui-btn">${_dkE(i18t('dk_done_btn'))}</button>
    </div>
  </div>`;
}

function openDeskSheet(c, opts = {}){
  if (!window.openModal || !c) return;
  const again = () => {
    if (typeof opts.after === 'function') return opts.after();
    if (window.state && window.state.view === 'redline' && window.renderRedline) renderRedline();
    else if (window.renderWorkspace) renderWorkspace();
  };
  const paint = () => {
    window.openModal(deskSheetHtml(c), { maxWidth: '30rem' });
    document.getElementById('dk-close')?.addEventListener('click', () => window.closeModal());
    /* The desk's own rules, the review's widget. See reviewWirePicker's note on
       why the policy is not shared even though the control is. */
    const picker = window.reviewWirePicker
      ? reviewWirePicker(c, { prefix: 'dk', search: deskSearchPeople, resolve: deskResolvePerson })
      : { get: () => null };
    document.getElementById('dk-add')?.addEventListener('click', () => {
      const box = document.getElementById('dk-who');
      const u = picker.get();
      if (!u){
        /* Refused here with the reason, rather than by a grey button: a
           disabled control tells you nothing about which of the five things
           you got wrong. */
        const r = deskResolvePerson(box ? box.value : '', c);
        _dkSay(r.why || i18t('dk_pick_someone'), 'err');
        if (box) box.focus();
        return;
      }
      if (!deskAddContributor(c, u)) return;
      _dkSave(c);
      _dkSay(i18t('dk_added_toast', { who: u.name }));
      paint(); again();
    });
    document.querySelectorAll('[data-dk-remove]').forEach(b => b.addEventListener('click', () => {
      if (!deskRemoveContributor(c, b.getAttribute('data-dk-remove'))) return;
      _dkSave(c); paint(); again();
    }));
    document.querySelectorAll('[data-dk-approve]').forEach(b => b.addEventListener('click', () => {
      const id = b.getAttribute('data-dk-approve');
      const u = (window.getUsers ? getUsers() : []).find(x => x && String(x.id) === String(id));
      if (!u || !deskAddContributor(c, u)) return;
      _dkSave(c);
      _dkSay(i18t('dk_added_toast', { who: u.name }));
      paint(); again();
    }));
    document.querySelectorAll('[data-dk-decline]').forEach(b => b.addEventListener('click', () => {
      if (!deskDeclineJoin(c, b.getAttribute('data-dk-decline'))) return;
      _dkSave(c); paint(); again();
    }));
    document.querySelector('[data-dk-handover]')?.addEventListener('click', () => openDeskHandover(c, { after: again }));
  };
  paint();
}

/* Handing over. Its own dialog rather than a row in the sheet: it is the one
   act here that changes who is answerable, and an irreversible-feeling decision
   deserves a page of its own to be read on. */
function openDeskHandover(c, opts = {}){
  if (!window.openModal || !c) return;
  const lead = deskLead(c) || { name: '' };
  window.openModal(`
    <div style="padding:18px 20px 16px">
      <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0 0 4px">${_dkE(i18t('dk_ho_title'))}</h2>
      <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 14px;line-height:1.55">${_dkE(i18t('dk_ho_sub', { who: lead.name }))}</p>
      <label for="dk-who" style="${DK_LBL}">${_dkE(i18t('dk_ho_new_lead'))}</label>
      <div style="position:relative">
        <input id="dk-who" type="text" role="combobox" autocomplete="off" spellcheck="false"
          aria-expanded="false" aria-controls="dk-who-list" aria-autocomplete="list"
          placeholder="${_dkE(i18t('dk_add_ph'))}" style="${DK_FLD}padding-right:30px"/>
        <button type="button" id="dk-who-caret" tabindex="-1" aria-label="${_dkE(i18t('dk_show_all'))}"
          style="position:absolute;right:1px;top:1px;bottom:1px;width:28px;border:0;background:transparent;
          cursor:pointer;color:var(--color-neutral-600);font-size:10px;line-height:1">&#9662;</button>
        <ul id="dk-who-list" role="listbox" hidden
          style="list-style:none;margin:2px 0 0;padding:0;position:absolute;left:0;right:0;top:100%;z-index:5;
          max-height:212px;overflow-y:auto;background:var(--color-surface);border:1px solid var(--color-divider);
          border-radius:6px;box-shadow:var(--shadow-lg)"></ul>
      </div>
      <div id="dk-who-say" style="font-size:11.5px;line-height:1.5;margin-top:5px;color:var(--color-neutral-600)">${_dkE(i18t('dk_add_hint'))}</div>
      <input type="hidden" id="dk-who-id" value=""/>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:12px 0 0;line-height:1.55">${_dkE(i18t('dk_ho_you_stay'))}</p>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button id="dk-hocancel" class="ui-btn">${_dkE(i18t('act_cancel'))}</button>
        <button id="dk-hook" class="ui-btn ui-btn-primary">${_dkE(i18t('dk_ho_btn'))}</button>
      </div>
    </div>`, { maxWidth: '29rem' });
  const picker = window.reviewWirePicker
    ? reviewWirePicker(c, { prefix: 'dk', search: deskSearchPeople, resolve: deskResolvePerson })
    : { get: () => null };
  document.getElementById('dk-hocancel')?.addEventListener('click', () => window.closeModal());
  document.getElementById('dk-hook')?.addEventListener('click', () => {
    const box = document.getElementById('dk-who');
    const u = picker.get();
    if (!u){
      const r = deskResolvePerson(box ? box.value : '', c);
      _dkSay(r.why || i18t('dk_pick_someone'), 'err');
      return;
    }
    if (!deskHandover(c, u)) return;
    _dkSave(c);
    window.closeModal();
    _dkSay(i18t('dk_handed_toast', { who: u.name }));
    if (typeof opts.after === 'function') opts.after();
  });
}

/* Asking to join, from the notice band. One line of reason, optional — the
   lead answering it wants to know why, and a request with no reason gets
   answered slower than one with a sentence. */
function openDeskJoinAsk(c, opts = {}){
  if (!window.openModal || !c) return;
  const lead = deskLead(c) || { name: '' };
  window.openModal(`
    <div style="padding:18px 20px 16px">
      <h2 style="font-family:var(--font-heading);font-weight:600;font-size:17px;margin:0 0 4px">${_dkE(i18t('dk_join_title'))}</h2>
      <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55">${_dkE(i18t('dk_join_sub', { who: lead.name }))}</p>
      <label for="dk-why" style="${DK_LBL}">${_dkE(i18t('dk_join_why_label'))}</label>
      <textarea id="dk-why" rows="3" maxlength="${DK_WHY_MAX}" style="${DK_FLD}resize:vertical"
        placeholder="${_dkE(i18t('dk_join_why_ph'))}"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button id="dk-jcancel" class="ui-btn">${_dkE(i18t('act_cancel'))}</button>
        <button id="dk-jok" class="ui-btn ui-btn-primary">${_dkE(i18t('dk_join_btn'))}</button>
      </div>
    </div>`, { maxWidth: '28rem' });
  document.getElementById('dk-jcancel')?.addEventListener('click', () => window.closeModal());
  document.getElementById('dk-jok')?.addEventListener('click', () => {
    const why = (document.getElementById('dk-why') || {}).value || '';
    if (!deskRequestJoin(c, { why })) { window.closeModal(); return; }
    _dkSave(c);
    window.closeModal();
    _dkSay(i18t('dk_join_sent', { who: (deskLead(c) || {}).name || '' }));
    if (typeof opts.after === 'function') opts.after();
  });
}

if (typeof document !== 'undefined') deskWireChip();

Object.assign(window, {
  DK_WHY_MAX,
  deskInit, deskOf, deskIsOpen, deskLead, deskInitiator, deskIsLead, deskRole,
  deskOpen, deskClaimOnFile,
  deskContributors, deskIsContributor, deskIsMember, deskMayManage,
  deskCandidates, deskSearchPeople, deskResolvePerson,
  deskAddContributor, deskRemoveContributor, deskHandover,
  deskJoinRequests, deskJoinPending, deskJoinPendingFor, deskRequestJoin,
  deskDeclineJoin, deskJoinInboxFor,
  deskSeatShowsDesk, deskInitials, deskChipHtml, deskNoticeHtml,
  deskWireChip, deskOpenFromChip,
  deskSheetHtml, openDeskSheet, openDeskHandover, openDeskJoinAsk,
});
