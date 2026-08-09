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
  return 'reader';
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
  const mine = deskIsLead(c, me);
  const faces = [_dkFaceHtml(lead.name, true, 0)].join('');
  const who = mine ? i18t('dk_you_lead') : i18t('dk_who_leads', { who: lead.name });
  return `<button type="button" id="dk-chip" class="dk-chip" data-dk-manage="1"
    aria-haspopup="dialog" title="${_dkE(i18t('dk_chip_title', { who: lead.name }))}">
    <span class="dk-faces">${faces}</span>
    <span class="dk-who">${who}</span></button>`;
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

if (typeof document !== 'undefined') deskWireChip();

Object.assign(window, {
  deskInit, deskOf, deskIsOpen, deskLead, deskInitiator, deskIsLead, deskRole,
  deskOpen, deskClaimOnFile,
  deskSeatShowsDesk, deskInitials, deskChipHtml, deskWireChip, deskOpenFromChip,
});
