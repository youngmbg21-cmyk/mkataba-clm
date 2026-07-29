// HaTi — Doc Lab: a sandbox beside the Doc page, for trying the internal wall
// and the round it lives inside before moving the product onto either.
// Globals are window-attached like every module (see components.js).
//
// WHY THIS IS A SEPARATE PAGE AND NOT A BRANCH OF THE DOC PAGE
//
// The proposal on the table adds two things the product has never had:
//   · visibility — 'internal' | 'shared' — on a conversation, so a team can
//     talk among themselves while a deal is live.
//   · status — 'open' | 'resolved' — plus a link to a change, so a conversation
//     ends when the thing it was about is decided.
//
// Both are cheap to add and expensive to get wrong. Marking a note internal and
// having it reach the counterparty anyway is not a rendering bug, it is a client
// reading our negotiating position. So the approach gets proven somewhere that
// cannot do that damage, and only then moves into js/discuss.js and
// buildSharePayload().
//
// WHY THE LAB EDITS, WHEN THE DOCS PAGE DELIBERATELY DOES NOT
//
// f50 pins the rule for the real product: the Docs page reads, checks and signs
// — wording changes are tracked changes in the negotiation, or they are not
// changes at all. That rule is not under test here and is not weakened here.
//
// What the lab needs is the WHOLE LOOP in one place: change a clause, argue
// about it privately, send it, have the other side decide it, watch the
// conversation close. Half a loop cannot show whether the wall holds, because
// the interesting leaks are at the seams — an unsent draft, a note attached to
// a change that has not gone out yet. So the lab keeps its own copy of the
// document and its own changes, and the contract is never touched.
//
// WHAT MAKES THIS SANDBOX ACTUALLY SAFE
//
//   1. Everything lives in localStorage under one key of its own. Nothing here
//      goes through persist(), so no lab change or message can reach the
//      contract record, the server, or a portal link.
//   2. The lab's document is a COPY, taken once from the contract's working
//      wording. Editing it cannot write back.
//   3. Nothing in here re-implements the real accept/reject model. The rules it
//      does mirror — silence rejects, nobody rules on their own ask — are
//      mirrored because a sandbox that behaved differently from the product
//      would prove nothing about the product.
//
// THE TWO RULES IT COPIES FROM js/negotiation.js, AND WHY
//
//   1. SILENCE REJECTS. The working wording is BUILT from the accepted set on
//      every read, never mutated in place, so rejecting everything reproduces
//      the baseline exactly. The sample engine that prompted this experiment
//      wrote accepted text straight over the clause, which makes the original
//      unrecoverable and "reject" a lie.
//   2. NOBODY RULES ON THEIR OWN ASK. Enforced in labCanDecide, not in the
//      buttons, so a new control cannot route around it.
//
// AND ONE RULE OF ITS OWN
//
//   EXPLICIT ALLOW, twice. A thread travels only if visibility === 'shared'; a
//   change travels only if sent === true. Written the obvious way — "everything
//   not marked internal" — a field nobody set passes, which is exactly the
//   defect in the sample engine: `undefined !== 'internal_draft'` is true, so
//   every internal draft is sent, silently, with no error to notice.

/* ---------- the store ----------
   Its own key, deliberately. A lab that shared the contract record would be one
   forgotten persist() away from writing test wording into a real negotiation. */
const LAB_KEY = 'hati.lab.v1';
const LAB_INTERNAL = 'internal';
const LAB_SHARED   = 'shared';
const LAB_US   = 'owner';
const LAB_THEM = 'counterparty';

/* ---------- the internal sandbox ----------
   Where a team's work sits before it is a position. `internal_draft` is the
   stage everything is born into and it is the one that must never travel.

   It is a SECOND lock, not a replacement for the first. `sent === true` remains
   the wall's authority — that is the property f60 pins and the one the sample
   engine got wrong — and the stage has to agree with it. Two independent
   conditions both saying yes is what makes a forgotten field harmless: a change
   with a stage nobody set still fails the sent test, and a change wrongly
   marked sent still fails the stage test. */
const LAB_STAGE_DRAFT     = 'internal_draft';
const LAB_STAGE_PUBLISHED = 'published';
/* A change that was folded into a published round. It keeps the internal
   micro-history readable without standing as an ask of its own. */
const LAB_STAGE_FOLDED    = 'folded';

function labLoad(){
  try{ return JSON.parse(localStorage.getItem(LAB_KEY) || '{}') || {}; }
  catch(e){ return {}; }
}
function labFor(cid){
  const rec = labLoad()[cid];
  return {
    threads:   (rec && rec.threads)   || [],
    changes:   labMigrateChanges((rec && rec.changes) || []),
    baseHtml:  (rec && rec.baseHtml)  || '',
    nextId:    (rec && rec.nextId)    || 1
  };
}

/* Records written before `stage` existed carry no stage at all, and the share
   filter now requires one. Read as-is they would fail the second lock and a
   negotiation already on the table would silently empty out — the counterparty
   opening their link would find nothing had ever been sent.

   So the stage is derived on read from the field that was authoritative when
   the record was written. This reads the OLD truth rather than assuming the new
   one: sent means published, and everything else is a draft. */
function labMigrateChanges(changes){
  for(const ch of (changes || [])){
    if(!ch || ch.stage) continue;
    ch.stage = ch.sent === true ? LAB_STAGE_PUBLISHED : LAB_STAGE_DRAFT;
  }
  return changes || [];
}
function labPut(cid, lab){
  const all = labLoad();
  all[cid] = { threads: lab.threads || [], changes: lab.changes || [],
    baseHtml: lab.baseHtml || '', nextId: lab.nextId || 1 };
  try{ localStorage.setItem(LAB_KEY, JSON.stringify(all)); }
  catch(e){ if(window.toast) toast('The lab could not save to this browser — it is out of space','err'); }
}
function labClear(cid){
  const all = labLoad(); delete all[cid];
  try{ localStorage.setItem(LAB_KEY, JSON.stringify(all)); }catch(e){}
}
const labUid = p => p + '_' + Math.random().toString(36).slice(2, 9);

/* ============================================================
   THE DOOR — everything this page exists to prove is in these two functions.
   ============================================================ */

/* Threads. Explicit allow: a conversation reaches the other side only by
   saying so. A forgotten field means it stays home, which is the failure you
   can live with. */
function labSharePayload(lab){
  const threads = (lab && lab.threads) || [];
  const changes = (lab && lab.changes) || [];
  return {
    threads: threads
      .filter(t => t.visibility === LAB_SHARED)
      .map(t => ({
        id: t.id, topicLabel: t.topicLabel, changeId: t.changeId || null,
        status: t.status, resolvedAt: t.resolvedAt || null,
        /* The internal NAME of whoever closed it stays behind and the
           organisation speaks instead — the same call buildSharePayload()
           already makes for whoever ruled on a change. */
        resolvedByOrg: t.resolvedBy ? t.resolvedBy.org : null,
        messages: (t.messages || []).map(m => ({
          id: m.id, author: m.author, org: m.org, body: m.body, at: m.at
        }))
      })),
    changes: labShareChanges(changes)
  };
}

/* Changes. Explicit allow again, on a different field: a change is on the
   table only once it has been SENT. A clause you are still drafting is your
   own business, and it is the seam where a wall most easily fails — the note
   is marked internal, but the half-written clause it is about is not. */
function labShareChanges(changes){
  return (changes || [])
    /* BOTH locks, and both of them explicit-allow. `sent === true` is the one
       the wall has always turned on. The stage test is the second: anything
       still in the internal sandbox, anything folded into a published round,
       and anything whose stage was never set at all fails it. A change travels
       only by being named published AND having been sent. */
    .filter(x => x.sent === true && x.stage === LAB_STAGE_PUBLISHED)
    .map(x => ({
      id: x.id, clauseId: x.clauseId, clauseLabel: x.clauseLabel,
      before: x.before, after: x.after,
      side: x.side, author: x.author, status: x.status,
      /* True by construction — nothing unsent is in this list. It travels
         anyway, because the reader's renderer asks, and a field that is absent
         reads as false: the counterparty's copy said "not sent" about the very
         changes they had just been sent. */
      sent: true,
      at: x.at, sentAt: x.sentAt || null,
      /* Who ruled stays behind; that they ruled does not. */
      decidedByOrg: x.decidedBy ? x.decidedBy.org : null,
      decidedAt: x.decidedAt || null,
      /* Tags are an explicit allow INSIDE an explicit allow. A tag is a note
         somebody pinned to a change, and most of them are working notes — "do
         not concede this", "check with Ops" — so the shared ones are named
         individually and everything else stays home by not being listed. */
      tags: (x.tags || [])
        .filter(t => t.visibility === LAB_SHARED)
        .map(t => ({ id: t.id, text: t.text, at: t.at, org: t.org || null,
          visibility: LAB_SHARED }))
    }));
}

/* What was held back, counted rather than described. Shown to the OWNER only,
   so the person testing can see the door did something without the
   counterparty view revealing that anything exists behind it. */
function labWithheld(lab){
  const threads = ((lab && lab.threads) || []).filter(x => x.visibility !== LAB_SHARED);
  const drafts  = ((lab && lab.changes) || []).filter(x => x.sent !== true);
  return {
    threads: threads.length,
    messages: threads.reduce((n, x) => n + ((x.messages || []).length), 0),
    drafts: drafts.length
  };
}

/* ============================================================
   THE WORKING WORDING — built, never mutated
   ============================================================ */

/* What a clause says RIGHT NOW: its baseline wording unless a change to it was
   accepted. Selection, not mutation — which is what makes rejecting everything
   reproduce the baseline exactly, and what keeps the original recoverable
   however many rounds happen on top of it. */
function labClauseText(clause, changes){
  const taken = (changes || []).filter(x => x.clauseId === clause.clauseId && x.status === 'accepted');
  return taken.length ? taken[taken.length - 1].after : clause.text;
}
/* ---------- WHO WROTE IT ----------
   A negotiation is not two people. On one side of it there is a contracts
   manager who drafts, a lawyer who tightens the indemnity, and a commercial
   owner who decides what is worth conceding — and until now every one of them
   filed changes signed with a single flat string. That is enough to print and
   not enough to reason about: you cannot ask "what did Legal change" or "is
   this waiting on an approver" of a sentence.

   So authorship is a RECORD. The string is kept alongside it and kept accurate,
   because it is what the counterparty's copy prints and what the older cards
   already read. */
const LAB_ROLES = { VIEWER: 'viewer', CONTRIBUTOR: 'contributor', APPROVER: 'approver' };
function labAuthorOf(user, side, c){
  const u = user || (window.currentUser ? currentUser() : null) || {};
  const org = side === LAB_THEM
    ? ((c && c.counterparty) || 'The counterparty')
    : (window.FIRST_PARTY || 'This workspace');
  /* Role decides who can publish a round, so an unknown role is the LEAST
     capable one rather than the most. A missing field must not hand someone the
     authority to send wording to the other side. */
  const role = [LAB_ROLES.VIEWER, LAB_ROLES.CONTRIBUTOR, LAB_ROLES.APPROVER]
    .includes(u.labRole) ? u.labRole : LAB_ROLES.CONTRIBUTOR;
  return {
    userId: u.id || u.userId || ('anon:' + (u.name || 'You')),
    name: u.name || 'You',
    organization: org,
    role
  };
}
/* Initials for the pill beside a redline. Two letters at most: it sits inline
   in a document and has to stay smaller than the words around it. */
function labInitials(name){
  const parts = String(name == null ? '' : name).trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '??';
  if(parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
const labAuthorName = ch => (ch && ch.authorRef && ch.authorRef.name)
  || (typeof (ch && ch.author) === 'string' ? ch.author.split(' · ')[0] : '') || 'Someone';

/* ---------- the stack on a clause ----------
   Every pending change on one clause from one side, oldest first. More than one
   means two colleagues have both worked on it, and the chain of parentChangeId
   is the internal micro-history of how the wording got where it is. */
function labStackOn(changes, clauseId, side){
  return (changes || []).filter(x => x.clauseId === clauseId && x.status === 'pending'
    && (x.sent === true || x.side === side));
}
/* The one change still awaiting a decision on a clause, as a given side can see
   it — the HEAD of the stack, which is the newest wording rather than the
   oldest. An unsent draft is visible only to the side that wrote it.

   Head, not first, and this matters the moment a second colleague edits: the
   first entry is where the clause started this round, and rendering that would
   show a reader the wording before their own team's latest pass. */
function labPendingOn(changes, clauseId, side){
  const stack = labStackOn(changes, clauseId, side);
  return stack.length ? stack[stack.length - 1] : null;
}
/* THE WORDING A NEW EDIT LANDS ON — which is not the same thing as the wording
   the clause currently HAS.

   A clause under an undecided change reads, on screen, as a redline: kept words,
   inserted words, struck-through words. The words a person is looking at and
   would act on are the PROPOSED ones — the clause as it would read if the
   pending change were accepted. Anchoring a rewrite to the baseline instead
   would refuse every edit to a clause with an open ask, which is precisely the
   clause most likely to need one more pass.

   So: propose against `working`, but file against `base`. The change's own
   before/after stays a diff from the settled baseline however many revisions it
   takes, which is what keeps rejecting it a clean return to the original. */
function labWorkingText(clause, changes, side){
  const base = labClauseText(clause, changes);
  const pending = labPendingOn(changes, clause.clauseId, side);
  return { base, working: pending ? pending.after : base, pending };
}

/* ---------- IS THIS CLAUSE STILL OURS ALONE? ----------
   The question that decides whether struck-out wording can be rewritten.

   A deletion in an UNSENT draft is a proposal we have not made yet. Nobody
   outside this office has seen it, nothing depends on it, and changing our mind
   about it — "actually, don't cut that, replace it" — is ordinary drafting.
   Refusing it forces a person to discard their own draft to alter their own
   draft, which is the bug this rule exists to remove.

   A deletion that has been SENT is a different object entirely. The
   counterparty has read it, may have answered it, and may be relying on it. It
   is a position, and positions are withdrawn or superseded openly rather than
   quietly rewritten underneath the person answering them.

   The test runs over the WHOLE VISIBLE STACK, not just its head. A colleague
   can stack an unsent pass on top of an ask that already went out; the head is
   then unsent while the deletion under it is very much on the table. Asking
   only the head would call that clause private when it is not. */
function labDraftOnlyStack(changes, clauseId, side){
  const stack = labStackOn(changes, clauseId, side);
  if(!stack.length) return false;
  return stack.every(x => x.sent !== true
    && x.status === 'pending'
    && x.stage === LAB_STAGE_DRAFT);
}

/* Where a rewrite of struck-out wording should be placed, or null if it should
   not be allowed at all.

   Returns the seam the deleted run left in the working text. Splicing there
   turns a bare deletion into a replacement: the wording still goes, and the new
   wording arrives where it was — which is what a person selecting struck text
   and asking for a rewrite is asking for. */
function labStruckTarget(base, working, text, changes, clauseId, side, hint){
  if(working === base) return null;                 // nothing is struck
  if(!window.redlineDeletionCovering) return null;  // engine too old to place it
  if(!labDraftOnlyStack(changes, clauseId, side)) return null;
  const span = redlineDeletionCovering(base, working, text, hint);
  return span ? { at: span.at, span } : null;
}

/* WHICH OCCURRENCE OF THE SELECTED WORDING THE PERSON ACTUALLY POINTED AT.

   Splicing by string — working.replace(text, …) — always hits the FIRST match,
   and clause wording repeats. "within thirty (30) days" can appear twice in one
   payment clause, once for invoices and once for the cure period. Select the
   second, and a string splice rewrites the first: the wrong sentence changes,
   the right one does not, and the redline looks plausible either way. Nobody
   proposed that edit. It is the same failure the selection guard exists to
   prevent, arriving through a different door.

   So the caller supplies a HINT — roughly where in the working text the
   selection began, measured off the DOM — and this picks the occurrence nearest
   to it. Nearest rather than exact on purpose: the hint is reconstructed from a
   marked-up rendering, so it can drift by a few characters around whitespace,
   and being approximately right is enough to tell two occurrences apart while
   staying immune to that drift. With one occurrence the hint cannot change the
   answer at all. */
function labPickOccurrence(haystack, needle, hint){
  const h = String(haystack == null ? '' : haystack);
  const n = String(needle == null ? '' : needle);
  if(!n) return -1;
  const want = (typeof hint === 'number' && isFinite(hint)) ? hint : 0;
  let best = -1, bestGap = Infinity;
  for(let i = h.indexOf(n); i !== -1; i = h.indexOf(n, i + 1)){
    const gap = Math.abs(i - want);
    if(gap < bestGap){ bestGap = gap; best = i; }
    /* Past the hint the gap only grows, so the first non-improvement is the
       answer. */
    else if(i > want) break;
  }
  return best;
}

/* The hint itself: where a DOM position falls in the WORKING text.

   The rendering is a redline, so what is on screen is not the string a splice
   will run against. Struck-through wording is on the page and is not in the
   working text, so it must count for nothing; and each line is its own block
   element, so the newline between two lines exists in the string but appears in
   the DOM only as a block boundary. Walking the text nodes with those two rules
   reconstructs the offset.

   It is deliberately forgiving. An empty line the renderer drops, or a stray
   space, shifts the count slightly — and slightly is fine, because the only
   thing the number has to do is tell one occurrence of a phrase from another. */
function labWorkingOffset(host, node, nodeOffset){
  if(!host || !node) return 0;
  const upTo = (el, test) => {
    for(let p = el; p && p !== host; p = p.parentElement) if(test(p)) return p;
    return null;
  };
  const blockOf = el => upTo(el, p => /^(P|H[1-6]|DIV|LI|BLOCKQUOTE|TR)$/.test(p.tagName || '')) || host;
  const struck = el => !!upTo(el, p => p.tagName === 'DEL'
    || (p.classList && p.classList.contains('lab-del')));

  let seen = 0, lastBlock = null, found = null;
  const walk = n => {
    if(found !== null) return;
    if(n.nodeType === 3){
      const parent = n.parentElement;
      const counts = !struck(parent);
      if(counts){
        const blk = blockOf(parent);
        if(lastBlock && blk !== lastBlock) seen += 1;      // the newline between two lines
        lastBlock = blk;
      }
      if(n === node){
        found = seen + (counts ? Math.min(nodeOffset || 0, (n.nodeValue || '').length) : 0);
        return;
      }
      if(counts) seen += (n.nodeValue || '').length;
      return;
    }
    /* A range can start on an ELEMENT, where the offset is a child index rather
       than a character index. Count the children it sits after. */
    if(n === node){
      const kids = n.childNodes || [];
      for(let i = 0; i < Math.min(nodeOffset || 0, kids.length); i++){
        walk(kids[i]);
        if(found !== null) return;
      }
      found = seen;
      return;
    }
    for(const kid of (n.childNodes || [])){
      walk(kid);
      if(found !== null) return;
    }
  };
  walk(host);
  return found === null ? seen : found;
}
/* Can this side decide this change? Two conditions, both in the model rather
   than in the buttons so a new control cannot route around them. */
function labCanDecide(change, side){
  if(!change || change.status !== 'pending') return false;
  if(change.sent !== true) return false;          // not on the table yet
  return change.side !== side;                    // nobody rules on their own ask
}

function labFileChange(lab, opts){
  const before = String(opts.before == null ? '' : opts.before);
  const after  = String(opts.after == null ? '' : opts.after);
  if(!after.trim() || after.trim() === before.trim()) return null;
  const authorRef = opts.authorRef || null;
  /* THE HEAD OF THIS SIDE'S STACK on the clause. Whether a new pass revises it
     or stacks on top of it turns on one question: is this the same person? */
  const stack = (lab.changes || []).filter(x => x.clauseId === opts.clauseId
    && x.status === 'pending' && x.side === opts.side);
  const live = stack.length ? stack[stack.length - 1] : null;

  /* SAME HAND — a revision. Coming back to wording you yourself put on the
     table is not a second opinion, it is you changing your mind, and recording
     it as two asks would put a disagreement in the history that never happened. */
  const sameHand = live && authorRef && live.authorRef
    ? live.authorRef.userId === authorRef.userId
    : (live && !authorRef);
  if(live && sameHand){
    live.after = after;
    live.at = nowISO();
    live.revised = (live.revised || 0) + 1;
    if(live.sent) live.sent = false;              // a revised ask goes back in hand
    live.stage = live.sent ? live.stage : LAB_STAGE_DRAFT;
    return live;
  }
  /* ANOTHER HAND — a stacked sub-change. Overwriting the colleague's ask, which
     is what the single-live-change rule used to do, silently erased the fact
     that somebody else had already taken a view on this clause. The lawyer
     tightening the contracts manager's wording is a different event from the
     contracts manager rewriting it, and the difference is exactly what an
     approver needs to see before it goes out.

     The chain is INTERNAL. It is folded into one clean diff at publish, so
     stacking costs the counterparty nothing — they were never going to be shown
     our drafting argument. */
  const ch = {
    id: 'L-' + String(lab.nextId++).padStart(3, '0'),
    clauseId: opts.clauseId,
    clauseLabel: opts.clauseLabel || opts.clauseId,
    before, after,
    side: opts.side,
    author: opts.author,
    authorRef,
    /* What this is stacked on, and how deep. Depth is stored rather than walked
       so a card can say "3rd pass" without rebuilding the chain to find out. */
    parentChangeId: live ? live.id : null,
    depth: live ? ((live.depth || 0) + 1) : 0,
    status: 'pending', sent: false,
    stage: LAB_STAGE_DRAFT,
    at: nowISO()
  };
  lab.changes.push(ch);
  return ch;
}

/* The chain behind a change, oldest first, including the change itself. Bounded
   rather than trusting the links: a corrupted record that pointed at itself
   would otherwise hang the page that tried to draw its history. */
function labChainOf(changes, id){
  const byId = new Map((changes || []).map(x => [x.id, x]));
  const out = [];
  const seen = new Set();
  let cur = byId.get(id);
  while(cur && !seen.has(cur.id) && out.length < 200){
    seen.add(cur.id);
    out.unshift(cur);
    cur = cur.parentChangeId ? byId.get(cur.parentChangeId) : null;
  }
  return out;
}
/* ---------- a note pinned to a change ----------
   Distinct from a thread: a thread is a conversation with turns, a tag is one
   short label somebody stuck on a change so the next reader sees it. Both
   carry a visibility and both honour the same wall.

   INTERNAL IS THE DEFAULT, and anything that is not exactly LAB_SHARED is
   internal. A caller that forgets the field, or misspells it, keeps the note at
   home; the opposite default would publish a working note to the counterparty. */
function labTagChange(lab, changeId, text, opts = {}){
  const ch = (lab.changes || []).find(x => x.id === changeId);
  const body = String(text == null ? '' : text).trim();
  if(!ch || !body) return null;
  ch.tags = Array.isArray(ch.tags) ? ch.tags : [];
  const tag = {
    id: 'TG-' + String((lab.nextTag = (lab.nextTag || 0) + 1)).padStart(3, '0'),
    text: body.slice(0, 400),
    visibility: opts.visibility === LAB_SHARED ? LAB_SHARED : LAB_INTERNAL,
    at: nowISO(),
    author: (opts.author || (window.currentUser && currentUser()?.name) || 'You'),
    /* WHICH SIDE WROTE IT, recorded at the moment it is written rather than
       inferred later from the organisation string. The colour a reader uses to
       tell a colleague's note from the counterparty's turns on this, and a
       guess made at render time would be wrong the first time an organisation
       was renamed. */
    side: opts.side === LAB_THEM ? LAB_THEM : LAB_US,
    org: opts.org || (window.FIRST_PARTY || 'This workspace')
  };
  ch.tags.push(tag);
  return tag;
}
/* One note, coloured by the hand that wrote it. The tone comes from discuss.js
   so the lab and the product cannot drift into two different colour schemes for
   the same distinction. */
function labTagHtml(t, opts){
  const external = !!(opts && opts.external);
  const tone = window.discussNoteTone
    ? discussNoteTone(t, LAB_US)
    : { classes: 'note-bubble note-owner', style: '', label: t.visibility === LAB_SHARED ? '🌐 Shared' : '🔒 Internal Note' };
  /* Visibility is a SEPARATE mark from authorship — who can see it is not who
     wrote it, and one badge cannot honestly carry both. */
  const vis = t.visibility === LAB_SHARED ? '🌐 Shared' : '🔒 Internal';
  return `<span class="lab-tag ${tone.classes}${t.visibility === LAB_SHARED ? ' is-shared' : ' is-internal'}"
    style="${tone.style}">
    <span class="lab-tagwho">${tone.label}</span>
    <span class="lab-tagvis" title="${t.visibility === LAB_SHARED ? 'Travels with the change when it is sent' : 'Never leaves this organisation'}">${vis}</span>
    ${esc(t.text)}
    ${external || !opts || !opts.changeId ? '' : `<button type="button" class="lab-tag-x" data-lab-untag="${esc(opts.changeId)}|${esc(t.id)}" title="Remove this note" aria-label="Remove this note">×</button>`}
  </span>`;
}

function labUntagChange(lab, changeId, tagId){
  const ch = (lab.changes || []).find(x => x.id === changeId);
  if(!ch || !Array.isArray(ch.tags)) return false;
  const n = ch.tags.length;
  ch.tags = ch.tags.filter(t => t.id !== tagId);
  return ch.tags.length !== n;
}

/* Sending ONE change: the single-clause form of publishing. It moves the change
   out of the internal sandbox, which is what actually puts it on the table —
   marking it sent without moving the stage would leave it failing the second
   lock and invisible to the side it was sent to. */
function labSendChange(lab, id){
  const ch = lab.changes.find(x => x.id === id);
  if(!ch || ch.sent === true || ch.status !== 'pending') return null;
  ch.sent = true; ch.sentAt = nowISO();
  ch.stage = LAB_STAGE_PUBLISHED;
  return ch;
}

/* ---------- PUBLISH ROUND / SEND TURN ----------
   The team's internal argument is not the offer.

   Three colleagues passing a clause between them leaves three stacked changes,
   and sending them as they are hands the counterparty our drafting history:
   what Legal wanted before Commercial overruled it, and in what order. That is
   a negotiating position given away for nothing, and it is also just noise —
   they have to answer one question, which is what the clause says now.

   So publishing COLLAPSES each clause's stack into one change measured from the
   last counterparty baseline: the head's wording, the whole team's authorship,
   one diff. The ancestors stay in the record marked folded, so the internal
   history is still readable at home and travels nowhere.

   Nothing is decided here and nothing is rewritten — the wording that goes out
   is the head's wording, unchanged. */
function labPublishRound(lab, side, user, c){
  const changes = lab.changes || [];
  const clauses = [];
  for(const ch of changes){
    if(ch.status !== 'pending' || ch.side !== side || ch.sent === true) continue;
    if(!clauses.includes(ch.clauseId)) clauses.push(ch.clauseId);
  }
  const published = [], folded = [];
  for(const clauseId of clauses){
    const stack = changes.filter(x => x.clauseId === clauseId && x.status === 'pending'
      && x.side === side && x.sent !== true);
    if(!stack.length) continue;
    const head = stack[stack.length - 1];
    /* MEASURED FROM THE BASELINE, not from the previous draft. The stack's
       first entry already carries it — every change in the chain was filed as a
       diff from the settled wording — so the head's `before` is right as it
       stands and the collapse is a matter of retiring the others. */
    const hands = [];
    for(const s of stack){
      const nm = labAuthorName(s);
      if(nm && !hands.includes(nm)) hands.push(nm);
    }
    head.sent = true;
    head.sentAt = nowISO();
    head.stage = LAB_STAGE_PUBLISHED;
    head.roundHands = hands;
    head.foldedFrom = stack.slice(0, -1).map(s => s.id);
    head.publishedBy = { name: (user && user.name) || 'You',
      org: side === LAB_THEM ? ((c && c.counterparty) || 'The counterparty')
        : (window.FIRST_PARTY || 'This workspace') };
    for(const s of stack.slice(0, -1)){
      /* Folded, not deleted. "Legal asked for X and it was overtaken" is worth
         keeping; it is simply not an ask any more, so it leaves the pending set
         and stops being something the other side could decide. */
      s.status = 'folded';
      s.stage = LAB_STAGE_FOLDED;
      s.foldedInto = head.id;
      s.foldedAt = nowISO();
      folded.push(s.id);
    }
    published.push(head.id);
  }
  return { published, folded, clauses: clauses.length };
}
function labDecide(lab, id, decision, user, side){
  const ch = lab.changes.find(x => x.id === id);
  if(!labCanDecide(ch, side)) return null;
  ch.status = decision === 'accepted' ? 'accepted' : 'rejected';
  ch.decidedAt = nowISO();
  ch.decidedBy = { name: (user && user.name) || 'You',
    org: side === LAB_US ? (window.FIRST_PARTY || 'This workspace') : 'The counterparty' };
  ch.closedThreads = labResolveLinked(lab, id, user, side);
  return ch;
}

/* ---------- auto-resolve ----------
   A conversation pinned to a change ends when the change is decided, and says
   who ended it. Accepting and rejecting both close it — the question "are we
   taking sixty days?" is answered either way. */
function labResolveLinked(lab, changeId, user, side){
  let n = 0;
  for(const t of lab.threads){
    if(t.changeId === changeId && t.status === 'open'){
      t.status = 'resolved';
      t.resolvedAt = nowISO();
      t.resolvedBy = { name: (user && user.name) || 'System',
        org: side === LAB_THEM ? 'The counterparty' : (window.FIRST_PARTY || 'This workspace') };
      n++;
    }
  }
  return n;
}

/* ============================================================
   THE LAB'S COPY OF THE DOCUMENT
   ============================================================ */

/* Taken once, from the contract's working wording, and kept. Re-reading the
   contract on every render would mean the lab quietly changed underneath a
   test in progress; and a copy is the only thing that makes editing safe. */
/* Ids are STAMPED into the copy as it is taken, not derived from it later.
   A clause the lab cannot address by id is a clause the lab cannot edit, and
   the working wording of a contract that has never been through a negotiation
   carries no ids at all — which is most of them. This is the same call
   js/negotiation.js makes when it opens a round, for the same reason. */
function labBaseline(c, lab){
  if(lab.baseHtml) return lab.baseHtml;
  const body = window.negoBodyOf ? negoBodyOf(c) : '';
  // clauseStampIds returns { html, stamped, headingless } — the html, not the record
  const stamped = (body && window.clauseStampIds) ? clauseStampIds(body) : null;
  lab.baseHtml = (stamped && stamped.html) || body || '';
  return lab.baseHtml;
}
function labClausesOf(lab){
  if(!lab.baseHtml || !window.clauseSegment) return [];
  try{ return clauseSegment(lab.baseHtml) || []; }catch(e){ return []; }
}
function labTopics(lab){
  const out = [{ value: 'general', label: 'The contract generally' }];
  for(const ch of lab.changes)
    out.push({ value: 'change:' + ch.id, changeId: ch.id,
      label: `Change ${ch.id} — ${ch.clauseLabel}` });
  return out;
}

/* ---------- seeding ----------
   An empty page tests nothing, and hand-typing four messages before every trial
   is how a sandbox stops being used. Wiped by the same button that clears the
   lab. */
function labSeed(c, lab){
  const clauses = labClausesOf(lab);
  if(!clauses.length) return false;
  const target = clauses[clauses.length - 1];
  const cp = c.counterparty || 'the counterparty';
  const ch = labFileChange(lab, {
    clauseId: target.clauseId,
    clauseLabel: window.clauseLabel ? clauseLabel(target) : (target.headingText || target.clauseId),
    before: target.text,
    after: target.text.replace(/\bthirty \(30\) days\b/i, 'sixty (60) days')
         + (/(thirty \(30\) days)/i.test(target.text) ? '' : ' Either party may terminate on sixty (60) days written notice.'),
    side: LAB_THEM, author: 'Amina Wanjiru · ' + cp,
    authorRef: { userId: 'cp:amina', name: 'Amina Wanjiru', organization: cp,
      role: LAB_ROLES.APPROVER }
  });
  if(ch) labSendChange(lab, ch.id);
  const at = nowISO();
  lab.threads.push(
    { id: labUid('th'), visibility: LAB_SHARED, status: 'open',
      changeId: ch ? ch.id : null,
      topicLabel: ch ? `Change ${ch.id} — ${ch.clauseLabel}` : 'The contract generally',
      messages: [{ id: labUid('m'), author: 'Amina Wanjiru', org: cp, at,
        body: 'The longer notice period gives us time to re-tender if it comes to that. Nothing else on this clause.' }] },
    { id: labUid('th'), visibility: LAB_INTERNAL, status: 'open',
      changeId: ch ? ch.id : null,
      topicLabel: ch ? `Change ${ch.id} — ${ch.clauseLabel}` : 'The contract generally',
      messages: [{ id: labUid('m'), author: 'Sarah Chen', org: window.FIRST_PARTY || 'Us', at,
        body: 'This one is free to give — it matches our standard SLA. Take it, but hold the cure period where it is. If they come back on cure, that is the one to trade.' }] },
    { id: labUid('th'), visibility: LAB_INTERNAL, status: 'open',
      changeId: null, topicLabel: 'The contract generally',
      messages: [{ id: labUid('m'), author: 'David Otieno', org: window.FIRST_PARTY || 'Us', at,
        body: 'Finance want the value re-checked before we close this round. Do not send anything back until Thursday.' }] }
  );
  return true;
}

/* ============================================================
   RENDERING
   ============================================================ */
const LAB_CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:6px';
const LAB_H6   = 'margin:0;font-size:10px;font-weight:600;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:.1em';
const LAB_GOLD = '#8a6a2a';

function labChip(text, kind){
  const pal = {
    internal: `background:#f4ecd8;color:${LAB_GOLD};border:1px solid rgba(138,106,42,.28)`,
    shared:   'background:var(--color-accent-100);color:var(--color-accent-800);border:1px solid var(--color-accent-300)',
    open:     'background:var(--color-bg);color:var(--color-neutral-700);border:1px solid var(--color-divider)',
    good:     'background:#e6f1ec;color:#1e6b4d;border:1px solid rgba(30,107,77,.25)',
    bad:      'background:#f9ecea;color:#8f322b;border:1px solid rgba(143,50,43,.22)',
    draft:    `background:transparent;color:${LAB_GOLD};border:1px dashed rgba(138,106,42,.5)`,
    quiet:    'background:transparent;color:var(--color-neutral-600);border:1px solid var(--color-divider)'
  }[kind] || '';
  return `<span class="badge" style="${pal}">${esc(text)}</span>`;
}
/* ---------- the redline, with the clause's shape left on it ----------
   A clause is a heading, numbered sub-clauses and lettered sub-paragraphs, and
   that shape is how a reader finds 7.1(b). Diffing it as one string and printing
   the result in one block collapses the sub-list into "(a) … (b) … (c) …" run
   together — in the one view where somebody is deciding about it.

   redlineOpsStructured aligns LINES first and words only inside a matched line,
   so a sub-paragraph nobody touched is reported as untouched rather than struck
   out and re-inserted verbatim. redlineOpsBlocksHtml then gives each line its
   own block. Both degrade to the flat renderer where the engine is older. */
/* The same redline, with each insertion marked with the colleague who wrote it,
   for a clause more than one hand has been on. Internal only — the counterparty
   is shown one diff by design and our drafting order is not theirs to read.
   Falls back to the plain redline wherever attribution is unavailable or the
   clause has a single author, because a chain of one has nothing to attribute. */
function labRedlineAttributedHtml(changes, head){
  const chain = labChainOf(changes, head && head.id);
  if(chain.length < 2 || !window.redlineAttributeOps || !window.redlineOpsBlocksHtml)
    return labRedlineHtml(head.before, head.after);
  const steps = chain.map(s => ({ text: s.after, author: s.authorRef || { name: labAuthorName(s) } }));
  const ops = redlineAttributeOps(chain[0].before, steps);
  return `<div class="lab-redline">${redlineOpsBlocksHtml(ops,
    { insClass: 'lab-ins', delClass: 'lab-del', attributed: true })}</div>`;
}

function labRedlineHtml(before, after){
  if(window.redlineOpsStructured && window.redlineOpsBlocksHtml){
    const ops = redlineOpsStructured(before, after);
    return `<div class="lab-redline">${redlineOpsBlocksHtml(ops,
      { insClass: 'lab-ins', delClass: 'lab-del' })}</div>`;
  }
  if(window.redlineOps && window.redlineOpsHtml){
    const ops = redlineOps(before, after);
    return redlineOpsHtml(ops, { insClass: 'lab-ins', delClass: 'lab-del' });
  }
  return `<span class="lab-del">${esc(before)}</span> <span class="lab-ins">${esc(after)}</span>`;
}
/* A clause NOBODY has changed keeps its shape too. Printing it through esc()
   into a single div flattened every numbered sub-clause in the document, so the
   structure appeared only where there happened to be a redline. */
function labCleanHtml(text){
  if(window.redlineOpsBlocksHtml)
    return `<div class="lab-redline">${redlineOpsBlocksHtml([{ op: 'keep', text: String(text == null ? '' : text) }])}</div>`;
  return esc(text);
}

/* ============================================================
   WHICH CHANGE THE READER SINGLED OUT
   ============================================================
   Module-level beside the lab's other view state: it is where the reader is
   looking, not anything about the contract, so it must never reach storage or
   the share payload. */
let _labLinked = null;
let _labOnly = false;

/* ---------- is this change safe to accept without reading it? ----------
   "Accept all non-risk redlines" moves wording without a person reading each
   one, so what counts as risk decides how much one click can do. The test is
   deliberately INCLUSIVE — anything that trips any signal is held for a human,
   and anything unclassifiable counts as risk. A check that fails to run must
   not read as "nothing to worry about". */
function labRiskOf(c, ch, side){
  const why = [];
  if(!ch || ch.status !== 'pending') return { risky:true, why:['not awaiting a decision'] };
  const hay = `${ch.before || ''}\n${ch.after || ''}`.toLowerCase();
  const label = String(ch.clauseLabel || '').toLowerCase();
  const before = String(ch.before || '').trim(), after = String(ch.after || '').trim();
  if(!before) why.push('adds a whole clause');
  if(!after) why.push('removes a whole clause');
  /* A rewrite rather than an amendment: past roughly half the wording, this is
     not "the same clause with a change in it" and deserves a reader. */
  if(before && after){
    const bw = before.split(/\s+/).length, aw = after.split(/\s+/).length;
    if(Math.abs(aw - bw) / Math.max(bw, 1) > 0.5) why.push('rewrites most of the clause');
  }
  try{
    for(const v of (((c && c.playbook) || {}).verdicts || [])){
      if(v.status !== 'deviation') continue;
      const q = String(v.quote || '').toLowerCase().trim();
      const cat = String(v.category || '').toLowerCase().trim();
      if((q && q.length > 6 && hay.includes(q)) || (cat && label.includes(cat)))
        why.push(`playbook deviation — ${v.category || 'flagged'}`);
    }
  }catch(e){ why.push('the playbook could not be read'); }
  try{
    const scan = (c && c.scan) || {};
    const dismissed = new Set(scan.dismissed || []);
    for(const f of (scan.findings || [])){
      if(dismissed.has(f.id)) continue;
      const q = String((window.findingQuote ? findingQuote(f) : f.quote) || '').toLowerCase().trim();
      if(q && q.length > 6 && hay.includes(q))
        why.push(`open finding — ${f.title || f.kind || 'risk'}`);
    }
  }catch(e){ why.push('the scan could not be read'); }
  return { risky: why.length > 0, why };
}
/* Split the pending set the way the two batch buttons need it. An ask of ours
   is deliberately not counted as risk — labCanDecide already refuses to let a
   side rule on its own proposal, and double-counting it would have the preview
   claim a change was dangerous when it was merely not ours to take. */
function labBatchSplit(c, lab, side){
  const pending = (lab.changes || []).filter(x => x.status === 'pending');
  const clear = [], held = [], theirs = [];
  for(const ch of pending){
    if(labCanDecide(ch, side)) theirs.push(ch);
    const r = labRiskOf(c, ch, side);
    if(r.risky) held.push({ ch, why: r.why });
    else if(labCanDecide(ch, side)) clear.push(ch);
  }
  return { pending, clear, held, theirs };
}

/* ---------- the four things a person wants done to wording ----------
   Defined here rather than borrowed from the negotiation tab: the lab has to
   keep working if that tab is ever removed. */
const LAB_AI_ACTIONS = [
  { id:'advantage', label:'🛡️ Rephrase for Buyer Advantage',
    ask:'Rewrite this contract wording so it is more favourable to the party I act for, while staying commercially reasonable and enforceable under Kenyan law.' },
  { id:'playbook', label:'⚖️ Align with Corporate Playbook',
    ask:'Rewrite this contract wording so it matches our corporate playbook position. If the playbook has a preferred formulation for this category, use it.' },
  { id:'shorten', label:'✂️ Shorten & Simplify',
    ask:'Rewrite this contract wording more concisely and in plainer language, without changing its legal effect. Keep defined terms exactly as they are.' },
  /* Not an AI action at all, and deliberately in the same menu: the thing a
     reader most often wants to do with a passage they have just read is say
     something about it, and making them leave the selection to do that is how
     a note ends up attached to the wrong clause. */
  { id:'tag', label:'🏷️ Tag with Internal Note', tag:true }
];
const labKillSel = () => document.querySelectorAll('.lab-selmenu').forEach(n => n.remove());
const labKillPop = () => document.querySelectorAll('.lab-aipop').forEach(n => n.remove());

/* ---------- THE SELECTION, HELD ON PURPOSE ----------
   The flashing menu was one bug wearing three coats.

   FIRST, the selection was read on the same tick as the event. A mouseup at the
   end of a drag fires before the browser has settled the range it implies, so
   the read either found a collapsed selection or the previous one, and the menu
   opened, closed and reopened as the reader let go.

   SECOND, nothing kept it. Every consumer went back to window.getSelection(),
   and the moment focus moved to a control in the popover — a textarea most of
   all — the document selection collapsed and took the coordinates with it. The
   menu was positioned against a rectangle that no longer existed.

   THIRD, the dismiss listener could not tell "clicked away" from "clicked the
   thing I just opened", so pressing a button inside the popover raced the
   handler that removes it.

   So the range is CLONED and stored the instant it is stable. A cloned range
   survives the live selection being collapsed by a focus change, which is what
   makes the popover's own controls safe to use. Everything downstream reads
   this record, never the live selection. */
let _labSel = null;
function labClearSel(){ _labSel = null; }
/* The live context the once-bound document listeners read, refreshed on every
   wire. Binding them per-wire instead stacked a fresh pair on every repaint. */
let _labCtx = null;
let _labDismissWired = false;

/* Read the live selection into that record, or clear it. Returns the record so
   a caller can act on it directly. */
function labCaptureSel(canvas){
  const sel = window.getSelection && window.getSelection();
  if(!sel || sel.isCollapsed || sel.rangeCount < 1){ _labSel = null; return null; }
  let range;
  try{ range = sel.getRangeAt(0); }catch(_){ _labSel = null; return null; }
  const raw = String(sel.toString() || '');
  const text = raw.trim();
  if(text.length < 3){ _labSel = null; return null; }
  /* THE RANGE'S START, not the selection's anchor. Dragging right-to-left puts
     the anchor at the END of the passage, and an offset measured from there
     would point past the words it is meant to locate. */
  const node = range.startContainer;
  const el = node && (node.nodeType === 1 ? node : node.parentElement);
  const host = el && el.closest && el.closest('[data-lab-clause]');
  if(!host || (canvas && !canvas.contains(host))){ _labSel = null; return null; }
  const rect = range.getBoundingClientRect();
  if(!rect || (!rect.width && !rect.height)){ _labSel = null; return null; }
  _labSel = {
    /* cloneRange() is the whole point: this survives the live selection being
       destroyed by focus moving into the popover. */
    range: range.cloneRange(),
    text, raw, host,
    clauseId: host.getAttribute('data-lab-clause'),
    startNode: node, startOffset: range.startOffset,
    /* Copied out of the live rect rather than held as a reference, because a
       DOMRect read later from a collapsed range is all zeroes. */
    rect: { top: rect.top, bottom: rect.bottom, left: rect.left,
      right: rect.right, width: rect.width, height: rect.height }
  };
  return _labSel;
}
/* Anchored to the selection's own rectangle and clamped to the viewport, so a
   clause selected at the bottom of the window does not put its menu off-screen. */
function labAnchor(rect, w, h){
  const pad = 10;
  const left = Math.min(Math.max(pad, rect.left + (rect.width / 2) - (w / 2)), window.innerWidth - w - pad);
  /* ABOVE the selected text, which is where a reader's eye already is and where
     the menu cannot cover the words the next decision is about. It flips below
     only when there is genuinely no room above — a clause selected at the very
     top of the window — rather than as the default. */
  let top = rect.top - h - 8;
  if(top < pad) top = Math.min(rect.bottom + 8, window.innerHeight - h - pad);
  return { left: Math.max(pad, left), top: Math.max(pad, top) };
}

/* Ask the Copilot for wording, then hand it to the person to finish.

   The model's answer is a DRAFT IN A TEXTAREA, not a verdict. Two reasons, and
   the second is the one that matters. A model gets contract wording nearly
   right and wrong in one specific place — a defined term, a cross-reference, a
   number — and a proposal you can only accept or reject whole forces a person
   to throw away four good sentences to fix one word. And a redline is signed by
   whoever files it: making the wording editable before it is filed is what
   keeps the authorship honest.

   The preview under the box is live. Every keystroke re-renders the redline
   that WOULD be filed against the clause as it currently stands, so a person is
   never applying wording they have not seen marked up.

   Nothing moves until Apply Redline. Discard, Escape and clicking away all
   leave the document untouched. */
async function labAiPropose(ctx){
  const { c, lab, action, text, clause, rect, side, again } = ctx;
  labKillPop();
  const pop = document.createElement('div');
  pop.className = 'lab-aipop';
  /* One id, because there is only ever one of these open and the dismiss rule
     names it. labKillPop() removes any stragglers before this is appended, so
     the id cannot be duplicated. */
  pop.id = 'ai-copilot-popover';
  pop.setAttribute('role','dialog');
  pop.setAttribute('aria-label', action.label.replace(/^\S+\s/, ''));
  pop.innerHTML = `<header><span style="flex:1">${esc(action.label)}</span>
      <button class="ui-btn" data-ai-x style="font-size:11px;padding:3px 9px">Close</button></header>
    <div class="lab-aiwait"><span class="lab-aispin"></span>Reading the clause…</div>`;
  /* EVENTS INSIDE THE POPOVER STOP HERE. The dismiss listener is on the
     document in the capture phase, so without this it runs BEFORE the button
     that was actually pressed — the popover is removed and the click lands on
     nothing. Typing in the textarea is the same story: a mousedown to place the
     cursor would close the box being typed into. */
  for(const evt of ['mousedown', 'mouseup', 'click']){
    pop.addEventListener(evt, e => { e.stopPropagation(); }, true);
  }
  document.body.appendChild(pop);
  const place = () => {
    const b = pop.getBoundingClientRect();
    const at = labAnchor(rect, b.width, b.height);
    pop.style.left = at.left + 'px'; pop.style.top = at.top + 'px';
  };
  place();
  pop.querySelector('[data-ai-x]').addEventListener('click', () => pop.remove());
  const fail = msg => {
    pop.querySelector('.lab-aiwait')?.remove();
    const d = document.createElement('div');
    d.style.cssText = 'padding:14px;font-size:12.5px;line-height:1.6;color:#8f322b';
    d.textContent = msg;
    pop.insertBefore(d, pop.querySelector('header').nextSibling);
    place();
  };
  if(!window.copilotAvailable || !copilotAvailable()){
    fail('The Copilot is not connected on this workspace yet, so there is nothing to ask. Connect it under Team & Settings and try again — the wording you selected is untouched.');
    return;
  }
  /* THE SELECTION HAS TO BE FINDABLE IN THE WORDING IT WOULD REPLACE, and this
     is checked before a single token is spent. The old fallback for a miss was
     to replace the whole clause, which loses wording nobody agreed to lose.

     `working` is the clause as it would read if the pending change were
     accepted — so wording a person added in an earlier pass can be rewritten
     again without first deciding the ask. What still cannot be placed is a
     selection that CROSSES THE SEAM of a redline: picking up a struck-through
     word together with the word that replaced it produces a string that exists
     in neither version, and there is no honest place to put an answer back. */
  const base = clause.text;
  const working = clause.working == null ? base : clause.working;
  const pendingOn = clause.pending || null;
  /* Not "is this string present" but "WHICH ONE OF THEM DID YOU MEAN" — the
     answer is an offset, and everything downstream splices at it. */
  let at = labPickOccurrence(working, text, ctx.hint);
  /* How the splice behaves. REPLACE swaps the selected wording for the new
     wording. RESTORE is for a passage already marked for deletion in our own
     unsent draft: the run stays struck and the new wording lands at the seam it
     left, which turns a bare cut into a replacement. */
  let mode = 'replace', spliceLen = text.length;
  let struck = null;
  if(at < 0){
    struck = labStruckTarget(base, working, text, lab.changes, clause.clauseId, side, ctx.hint);
    if(struck){
      mode = 'restore';
      at = struck.at;
      spliceLen = 0;                    // the wording is already gone; this inserts
    }
  }
  if(at < 0){
    /* Three ways to miss, and they are not the same problem to the person
       holding the mouse. Saying "that spans a change" to someone who selected
       wording already struck out sends them looking for a seam that is not
       there. */
    const isStruck = working !== base && base.includes(text);
    fail(isStruck
      /* Reached only once the draft is on the table. While it is ours the
         branch above handles it, so this now says the thing that is actually
         true — it is not that struck wording cannot be rewritten, it is that
         THIS struck wording has already been shown to somebody. */
      /* Not esc()'d — fail() writes textContent, so escaping here would put a
         literal &amp; on the screen for a counterparty called "Björn & Co". */
      ? `That wording is struck out by ${pendingOn ? pendingOn.id : 'a change'}, which has already gone to ${c.counterparty || 'the counterparty'}. Rewriting it underneath them would change a question they are part-way through answering. Withdraw or supersede ${pendingOn ? pendingOn.id : 'it'} first. Nothing was changed.`
      : working !== base
        ? 'That selection crosses a redline — it picks up both struck-through wording and the wording that replaced it, so it matches no version of the clause. Select inside the wording as it would read once the pending change is accepted. Nothing was changed.'
        : 'That selection could not be found in the clause — it reaches outside the clause body or spans wording that is marked up rather than written, so a rewrite has nowhere to go back to. Nothing was changed.');
    return;
  }
  const pbLine = (() => {
    try{
      const v = (((c && c.playbook) || {}).verdicts || []).filter(x => x.status === 'deviation');
      return v.length ? `Our playbook flags this contract for: ${v.map(x => x.category).join(', ')}.` : '';
    }catch(_){ return ''; }
  })();
  const messages = [{ role:'user', content:
    `${action.ask}\n\nYou are helping negotiate a contract governed by Kenyan law. `
    + `The party I act for is ${side === LAB_THEM ? (c.counterparty || 'the counterparty') : (window.FIRST_PARTY || 'us')}. `
    + (pbLine ? pbLine + ' ' : '')
    + `\n\nThe selected wording is:\n"""\n${text}\n"""\n\n`
    + 'Reply with the replacement wording for the selected passage and nothing else. No preamble, no quotation marks, no commentary.' }];
  let raw;
  try{
    const res = await copilotAsk(messages, window.buildAssistantContext ? buildAssistantContext() : null);
    raw = typeof res === 'string' ? res
      : (res && (res.text || res.answer || res.content || res.reply || res.message)) || '';
    raw = String(raw || '');
  }catch(err){
    fail(`The Copilot could not answer: ${(err && err.message) || err}. Nothing was changed.`);
    return;
  }
  if(!pop.isConnected) return;                     // closed while it was thinking
  if(!raw.trim()){ fail('The Copilot returned nothing usable. Nothing was changed.'); return; }
  /* A model that wrapped its answer in quotes or a fence is answering the
     question; it is not proposing quotation marks into the contract. */
  const suggestion = raw.trim().replace(/^```[a-z]*\s*/i,'').replace(/```\s*$/,'').trim()
    .replace(/^["“]([\s\S]*)["”]$/,'$1').trim();

  pop.querySelector('.lab-aiwait')?.remove();
  const body = document.createElement('div');
  body.className = 'lab-aibody';
  body.innerHTML = `
    <label class="lab-ailabel" for="lab-ai-text">Suggested wording — edit it before you apply</label>
    <textarea id="lab-ai-text" class="ai-suggestion-editor lab-aitext w-full p-2 border rounded text-sm mb-2"
      spellcheck="true" rows="4"></textarea>
    <div class="lab-aisub">${mode === 'restore' ? 'In place of wording your draft currently deletes' : 'Replacing'}: <i>${esc(text.length > 90 ? text.slice(0,89) + '…' : text)}</i></div>
    ${mode === 'restore'
      ? `<div class="lab-aistack">${esc(pendingOn ? pendingOn.id : 'Your draft')} currently cuts this wording. Applying turns that cut into a replacement — the old wording still goes, and this takes its place. Nothing has been sent, so ${esc(c.counterparty || 'the counterparty')} has seen neither.${
          /* THE SPLICE ONLY EVER INSERTS. Where the draft already replaced this
             passage, the replacement stays and the new wording joins it, which
             is rarely what was meant — so say so, and point at the route that
             does the right thing. Selecting the green wording puts this back on
             the ordinary replace path, where the stand-in is what gets
             rewritten. Guessing instead would mean deleting wording the person
             did not select, and a wrong guess drops words from a contract. */
          struck && struck.span && struck.span.at !== struck.span.seam
            ? ` <b>Your draft already replaces this passage.</b> The new wording will be added alongside that replacement rather than instead of it — to rewrite the replacement itself, discard this and select the green wording.`
            : ''}</div>`
      : working === base ? ''
      : `<div class="lab-aistack">Stacking on ${esc(pendingOn ? pendingOn.id : 'the pending change')} — the redline below is measured from the settled baseline, so it shows that change and this one together.</div>`}
    <div class="lab-ailabel" style="margin-top:11px">How the clause would read</div>
    <div class="lab-aipreview" id="lab-ai-preview"></div>`;
  pop.insertBefore(body, pop.querySelector('header').nextSibling);
  const foot = document.createElement('footer');
  foot.innerHTML = `<button class="ui-btn ui-btn-primary" data-ai-apply style="font-size:12px">Apply Redline</button>
    <button class="ui-btn" data-ai-discard style="font-size:12px">Discard</button>
    <span style="flex:1"></span>
    <span class="lab-aistate" data-ai-state>Nothing has changed yet</span>`;
  pop.appendChild(foot);

  const box = pop.querySelector('#lab-ai-text');
  const preview = pop.querySelector('#lab-ai-preview');
  const applyBtn = foot.querySelector('[data-ai-apply]');
  /* The replacement lands in `working`; the redline is drawn from `base`. Where
     there is no pending change the two are the same string and this is the
     plain case.

     SPLICED AT AN OFFSET, not by String.replace. Two reasons, and both of them
     put wrong words into a contract. replace() takes the first match, which is
     the wrong sentence whenever the selected phrase repeats in the clause; and
     a replacement passed as a STRING has $&, $`, $' and $$ expanded inside it,
     so wording reading "a deposit of US$$500" would be filed as "US$500" —
     money altered by a substitution nobody wrote. slice() around a known index
     has neither behaviour. */
  const proposedFrom = v => {
    const t = String(v == null ? '' : v).trim();
    return t ? working.slice(0, at) + t + working.slice(at + spliceLen) : working;
  };
  const refresh = () => {
    const proposed = proposedFrom(box.value);
    const typed = !!box.value.trim();
    /* Two separate questions, and conflating them is what would let a person
       file a revision that revises nothing. Did the edit MOVE anything off the
       wording already on the table? And is there a redline against the baseline
       left to file at all? Apply needs both to be yes. */
    const moved   = typed && proposed !== working;
    const filable = proposed !== base;
    preview.innerHTML = moved && filable
      ? labRedlineHtml(base, proposed)
      : `<div class="lab-aiempty">${
          !typed ? 'Write a replacement above to see the redline.'
          : !moved ? (working === base
              ? 'That is the wording the clause already has — there is nothing to file.'
              : 'That is the wording already on the table — there is nothing new to file.')
          : 'That takes the clause back to its original wording. A redline cannot say “no change”, so withdraw the pending change instead of filing this.'}</div>`;
    applyBtn.disabled = !(moved && filable);
    place();
  };
  box.value = suggestion;
  box.addEventListener('input', refresh);
  refresh();
  box.focus();
  box.setSelectionRange(box.value.length, box.value.length);

  foot.querySelector('[data-ai-discard]').addEventListener('click', () => pop.remove());
  applyBtn.addEventListener('click', () => {
    const proposed = proposedFrom(box.value);
    if(proposed === base || proposed === working) return;
    /* Filed as an ordinary tracked change — same model, same id series, same
       card in the list. A suggestion that arrived from a model, and was then
       edited by a person, is not a different KIND of change. The author line
       records both hands.

       `before` is the BASELINE, not the wording this edit was written on top of.
       A clause revised three times still holds one change measured from the
       settled text, so rejecting it returns the original exactly. */
    const edited = box.value.trim() !== suggestion;
    const authorRef = labAuthorOf(window.currentUser ? currentUser() : null, side, c);
    /* Which record this lands on is decided by labFileChange, on the rule it
       has always used: the same hand revises its own ask, a different hand
       stacks. Restoring struck wording is not an exception to that — it is the
       same person editing the same draft, so it revises L-001 in place and the
       card, its notes and its threads all survive. */
    const wasOn = pendingOn ? pendingOn.id : null;
    const ch = labFileChange(lab, { clauseId: clause.clauseId, clauseLabel: clause.label,
      before: base, after: proposed, side, authorRef,
      author: `${authorRef.name} · Copilot (${action.label.replace(/^\S+\s/,'')})${edited ? ', edited' : ''}` });
    pop.remove();
    if(!ch){ if(window.toast) toast('That wording matches the clause already — nothing filed'); return; }
    labPut(c.id, lab);
    if(window.toast) toast(
      ch.parentChangeId
        ? `${ch.id} filed on top of ${ch.parentChangeId} — ${labAuthorName(ch)}'s pass over a colleague's wording`
      /* Said plainly, because the record the person was looking at is the one
         that moved and they should not have to go and check. */
      : mode === 'restore' && wasOn === ch.id
        ? `${ch.id} updated — that cut is now a replacement, and the new wording sits where the old wording was`
      : mode === 'restore'
        ? `${ch.id} filed — that cut is now a replacement`
        : `${ch.id} filed as a draft redline${edited ? ' (you edited the suggestion)' : ''} — it is yours until you send it`);
    if(typeof again === 'function') again();
  });
  place();
}

/* The floating menu itself, built once and opened from two places: a text
   selection, and the clause toolbar's AI Assist (where the passage is the whole
   clause). One builder means the two entry points can never drift into offering
   different verbs for the same job. */
function labSelMenu(ctx){
  const { text, clause, rect, c, lab, side, again } = ctx;
  labKillSel();
  const menu = document.createElement('div');
  menu.className = 'lab-selmenu';
  menu.setAttribute('role','menu');
  menu.innerHTML = `<div class="lab-selhead">${ctx.whole ? 'This clause' : 'Selected wording'}</div>
    <div class="lab-selquote">${esc(text.length > 66 ? text.slice(0,65) + '…' : text)}</div>
    ${LAB_AI_ACTIONS.map(a => `<button type="button" role="menuitem" data-lab-ai="${a.id}">${esc(a.label)}</button>`).join('')}`;
  document.body.appendChild(menu);
  const box = menu.getBoundingClientRect();
  const at = labAnchor(rect, box.width, box.height);
  menu.style.left = at.left + 'px'; menu.style.top = at.top + 'px';
  menu.querySelectorAll('[data-lab-ai]').forEach(btn => btn.addEventListener('mousedown', ev => {
    /* mousedown, not click: clicking first collapses the selection, and the
       proposal needs the words that were chosen. */
    ev.preventDefault(); ev.stopPropagation();
    const action = LAB_AI_ACTIONS.find(a => a.id === btn.getAttribute('data-lab-ai'));
    labKillSel();
    if(!action) return;
    if(action.tag){
      const live = (lab.changes || []).find(x => x.clauseId === clause.clauseId && x.status === 'pending');
      labNoteCompose({ c, lab, side, changeId: live ? live.id : null, rect, again, quote: text });
      return;
    }
    labAiPropose({ c, lab, action, text, clause, rect, side, again, hint: ctx.hint });
  }));
  return menu;
}

/* The note composer, for "🏷️ Tag with Internal Note" and for the clause
   toolbar's Add Note/Tag. A note needs somewhere to live, and the thing it is
   about is a CHANGE — so where a clause has no change on it yet, this says so
   rather than inventing one. Filing an empty change to hang a note on would put
   a fingerprint in the index that nobody proposed. */
function labNoteCompose(ctx){
  const { c, lab, changeId, rect, again, quote } = ctx;
  labKillPop();
  const pop = document.createElement('div');
  pop.className = 'lab-notepop';
  pop.setAttribute('role','dialog');
  pop.setAttribute('aria-label','Attach a note');
  if(!changeId){
    pop.innerHTML = `<div style="font-size:12.5px;line-height:1.6">
      There is no change on this clause yet, so there is nothing to pin a note to.
      Propose a change first — with <b>Direct Edit</b> or an AI action — and the note can go on it.
      </div><div style="display:flex;justify-content:flex-end"><button class="ui-btn" data-note-x style="font-size:12px">Close</button></div>`;
  } else {
    pop.innerHTML = `
      <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">Note on ${esc(changeId)}</div>
      ${quote ? `<div style="font-size:11px;font-style:italic;color:var(--color-neutral-600);line-height:1.5">“${esc(quote.length > 110 ? quote.slice(0,109) + '…' : quote)}”</div>` : ''}
      <textarea data-note-text placeholder="What should the next reader know?" spellcheck="true"></textarea>
      <div style="display:flex;gap:0;border:1px solid var(--color-divider);border-radius:5px;overflow:hidden">
        <button type="button" class="ui-btn" data-note-vis="${LAB_INTERNAL}" aria-pressed="true"
          style="flex:1;border:0;border-radius:0;font-size:11.5px;background:#f4ecd8;color:${LAB_GOLD};font-weight:600">🔒 Internal</button>
        <button type="button" class="ui-btn" data-note-vis="${LAB_SHARED}" aria-pressed="false"
          style="flex:1;border:0;border-left:1px solid var(--color-divider);border-radius:0;font-size:11.5px">🌐 Share</button>
      </div>
      <div data-note-hint style="font-size:11px;line-height:1.5;color:${LAB_GOLD}">Stays inside ${esc(window.FIRST_PARTY || 'your organisation')}. It is not in the share payload.</div>
      <div style="display:flex;gap:7px;justify-content:flex-end">
        <button class="ui-btn ui-btn-primary" data-note-save style="font-size:12px">Attach note</button>
        <button class="ui-btn" data-note-x style="font-size:12px">Cancel</button>
      </div>`;
  }
  document.body.appendChild(pop);
  const b = pop.getBoundingClientRect();
  const at = labAnchor(rect, b.width, b.height);
  pop.style.left = at.left + 'px'; pop.style.top = at.top + 'px';
  pop.querySelector('[data-note-x]').addEventListener('click', () => pop.remove());
  if(!changeId) return;
  let vis = LAB_INTERNAL;
  pop.querySelectorAll('[data-note-vis]').forEach(btn => btn.addEventListener('click', () => {
    vis = btn.getAttribute('data-note-vis');
    pop.querySelectorAll('[data-note-vis]').forEach(o => {
      const on = o === btn;
      o.setAttribute('aria-pressed', String(on));
      o.style.background = on ? (vis === LAB_SHARED ? '#e0e7ff' : '#f4ecd8') : '';
      o.style.color = on ? (vis === LAB_SHARED ? '#3730a3' : LAB_GOLD) : '';
      o.style.fontWeight = on ? '600' : '';
    });
    const hint = pop.querySelector('[data-note-hint]');
    hint.textContent = vis === LAB_SHARED
      ? `${c.counterparty || 'The counterparty'} will be able to read this once the change is sent.`
      : `Stays inside ${window.FIRST_PARTY || 'your organisation'}. It is not in the share payload.`;
    hint.style.color = vis === LAB_SHARED ? '#3730a3' : LAB_GOLD;
  }));
  const save = () => {
    const t = pop.querySelector('[data-note-text]').value;
    if(!String(t || '').trim()){ if(window.toast) toast('Write the note first', 'err'); return; }
    const tag = labTagChange(lab, changeId, t, { visibility: vis, side: ctx.side });
    pop.remove();
    if(!tag) return;
    labPut(c.id, lab);
    if(window.toast) toast(vis === LAB_SHARED
      ? `Note attached to ${changeId} — it travels with the change when you send it`
      : `Internal note attached to ${changeId} — it stays inside ${window.FIRST_PARTY || 'this organisation'}`);
    if(typeof again === 'function') again();
  };
  pop.querySelector('[data-note-save]').addEventListener('click', save);
  pop.querySelector('[data-note-text]').focus();
}

/* ---------- the change tag that rides with the diff ----------
   Every redline in the text carries the id of the change it belongs to, inline
   and clickable, so a reader looking at marked-up wording can get to the
   argument about it without hunting the sidebar for a matching card. */
function labChangeTagHtml(id, extra){
  return `<span class="change-tag-badge bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded cursor-pointer ml-1"
    data-change-id="${esc(id)}" role="button" tabindex="0"
    aria-label="Show the discussion on change ${esc(id)}"
    title="Jump to ${esc(id)} in the sidebar">#${esc(id)}${extra ? esc(extra) : ''}</span>`;
}

/* ---------- whose hand is on this redline ----------
   Initials, not a name: it sits inline beside contract wording, where a full
   name would compete with the clause for the reader's eye. The name is in the
   title and in the aria-label, so it costs a hover or a screen reader nothing.

   Its whole job is to answer "who is asking for this" at a glance on a clause
   three colleagues have touched. */
function labAuthorPillHtml(ch, opts){
  const name = labAuthorName(ch);
  const ref = ch && ch.authorRef;
  if(!name || name === 'Someone') return '';
  const role = ref && ref.role ? ref.role : '';
  const org = (ref && ref.organization) || '';
  const depth = (opts && opts.depth) || ch.depth || 0;
  return `<span class="lab-authorpill${depth ? ' is-stacked' : ''}"
    title="${esc(name)}${org ? ' · ' + esc(org) : ''}${role ? ' · ' + esc(role) : ''}${
      depth ? ` · pass ${depth + 1} on this clause` : ''}"
    aria-label="Proposed by ${esc(name)}${role ? ', ' + esc(role) : ''}">${esc(labInitials(name))}${
      depth ? `<span class="lab-pilldepth">${depth + 1}</span>` : ''}</span>`;
}

/* The internal micro-history of a clause, as a line of pills. Shown only where
   there is more than one hand on it — a single author needs no chain drawn. */
function labStackTrailHtml(changes, headId){
  const chain = labChainOf(changes, headId);
  if(chain.length < 2) return '';
  return `<div class="lab-stacktrail" aria-label="Internal drafting history for this clause">
    <span class="lab-stacklabel">🔒 Internal drafting history</span>
    ${chain.map((s, i) => `<span class="lab-stackstep">
      ${labAuthorPillHtml(s, { depth: 0 })}<span class="lab-stackid">${esc(s.id)}</span>${
        i < chain.length - 1 ? '<span class="lab-stackarrow">→</span>' : ''}</span>`).join('')}
  </div>`;
}

/* ---------- one clause, one frame ----------
   Each clause is its own container with its own border, its own hover state and
   its own toolbar. That is not decoration: a contract is argued clause by
   clause, and a frame is what makes "this clause" a thing the eye and the
   pointer can both address. The toolbar sits with the clause it acts on, so an
   AI action or a note can never be filed against a clause the writer was not
   looking at.

   The utility class names are the ones the spec asks for, and .clause-frame
   carries the same look in this file's own CSS — so the frame holds whether or
   not a utility framework is on the page. */
function labDocHtml(c, lab, side, external){
  const clauses = labClausesOf(lab);
  if(!clauses.length)
    return `<p style="font-size:12.5px;color:var(--color-neutral-600);line-height:1.6">This contract has no clause structure the lab can read yet. Open it on the Doc page first, or try one with drafted wording.</p>`;
  const changes = external ? labShareChanges(lab.changes) : lab.changes;
  return clauses.map(cl => {
    const label = window.clauseLabel ? clauseLabel(cl) : (cl.headingText || cl.clauseId);
    const now = labClauseText(cl, changes);
    const pending = labPendingOn(changes, cl.clauseId, side);
    const body = pending
      ? (external ? labRedlineHtml(pending.before, pending.after)
                  : labRedlineAttributedHtml(lab.changes, pending))
      : labCleanHtml(now);
    /* THE COUNTERPARTY GETS NO TOOLBAR. Their view is a picture of what was
       sent; every one of these verbs ends in something being written to a lab
       they do not own. */
    const tools = external ? '' : `
      <div class="clause-tools">
        <button type="button" class="clause-tool" data-lab-assist="${esc(cl.clauseId)}"
          title="Run an AI action on this clause">🪄 AI Assist</button>
        <button type="button" class="clause-tool" data-lab-note="${esc(cl.clauseId)}"
          title="Attach an internal or shared note to this clause">💬 Add Note/Tag</button>
        <button type="button" class="clause-tool" data-lab-edit="${esc(cl.clauseId)}"
          title="Edit this clause's wording directly">✏️ Direct Edit</button>
      </div>`;
    /* NOTES BELONG TO THE CHANGE, AND ARE DRAWN ONCE — on the change's card in
       the sidebar, not here as well.

       Printing them under the clause too seemed helpful and was not: a note is
       attached to a change, the change already has a card, and the same words
       appearing in two places reads as two notes. The reader then has to work
       out whether the document copy and the sidebar copy are the same thing,
       which is exactly the doubt a contract screen must not create.

       What stays on the clause is the #L-002 badge, which is a POINTER rather
       than a copy — one click and the sidebar scrolls to the card and lights
       it. The link is the connection; the duplicate was noise. */
    return `
    <div class="clause-frame bg-white border border-slate-200 rounded-lg p-4 mb-4 shadow-sm hover:border-indigo-300 transition-all"
      data-clause-id="${esc(cl.clauseId)}" data-lab-clause="${esc(cl.clauseId)}"
      data-lab-clause-label="${esc(label)}">
      <div class="clause-head">
        <span class="clause-title">${esc(label)}</span>
        ${pending ? labChangeTagHtml(pending.id, pending.sent ? '' : ' · draft') : ''}
        ${pending && !external ? labAuthorPillHtml(pending) : ''}
        ${tools}
      </div>
      <div class="clause-body">${body}</div>
      ${external ? '' : labStackTrailHtml(lab.changes, pending && pending.id)}
    </div>`;
  }).join('');
}

function labChangeCardHtml(ch, side, external){
  const mine = ch.side === side;
  const canDecide = !external && labCanDecide(ch, side);
  return `
  <div class="lab-card${ch.id === _labLinked ? ' is-linked' : ''}" data-lab-card="${esc(ch.id)}"
    style="border:1px solid var(--color-divider);background:var(--color-bg);border-radius:6px;padding:11px 13px;display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="font-family:var(--font-mono);font-size:11.5px;color:var(--color-neutral-700)">${esc(ch.id)}</span>
      ${labChip(ch.clauseLabel, 'quiet')}
      ${ch.status === 'accepted' ? labChip('Accepted', 'good')
        : ch.status === 'rejected' ? labChip('Rejected', 'bad')
        : ch.status === 'folded' ? labChip('Folded into ' + (ch.foldedInto || 'a round'), 'quiet')
        : ch.sent ? labChip('Awaiting a decision', 'open') : labChip('Not sent', 'draft')}
      ${external ? '' : labAuthorPillHtml(ch)}
    </div>
    <div style="font-size:12.5px;line-height:1.6">${labRedlineHtml(ch.before, ch.after)}</div>
    <div style="font-size:10.5px;color:var(--color-neutral-500)">${esc(ch.author)}${ch.revised ? ' · revised ' + ch.revised + '×' : ''}${
      /* Named on the card that went out, because "who is behind this wording"
         is a different question from "who typed it" once a team has passed a
         clause around, and an approver signing off wants both. */
      !external && Array.isArray(ch.roundHands) && ch.roundHands.length > 1
        ? ' · consolidated from ' + esc(ch.roundHands.join(', ')) : ''}${
      !external && ch.parentChangeId ? ' · stacked on ' + esc(ch.parentChangeId) : ''}</div>
    ${(Array.isArray(ch.tags) && ch.tags.length) ? `<div style="display:flex;flex-wrap:wrap;gap:5px">${
      /* changeId, so the × to remove a note lives here now. It used to be on
         the document copy only, and deleting that copy would otherwise have
         taken the only way to take a note off with it. */
      ch.tags.map(t => labTagHtml(t, { external, changeId: ch.id })).join('')}</div>` : ''}
    ${external ? '' : `<div><button class="ui-btn" data-lab-tagadd="${esc(ch.id)}" style="font-size:10.5px;padding:3px 8px">💬 Add note</button></div>`}
    ${ch.decidedAt ? `<div style="font-size:10.5px;color:var(--color-neutral-600)">Decided by ${esc(
      /* Their copy names the ORGANISATION — decidedByOrg is the only name in
         the payload — and ours names the colleague. Reading decidedBy.name on
         their side found nothing and printed "someone". */
      (external ? ch.decidedByOrg : (ch.decidedBy && ch.decidedBy.name)) || 'the other side')}${
      ch.closedThreads ? ` · ${ch.closedThreads} thread${ch.closedThreads === 1 ? '' : 's'} closed with it` : ''}</div>` : ''}
    ${external || ch.status !== 'pending' ? '' : `<div style="display:flex;gap:6px;flex-wrap:wrap">
      ${!ch.sent && mine ? `<button class="ui-btn ui-btn-primary" data-lab-send="${esc(ch.id)}" style="font-size:11px;padding:4px 10px">Send it</button>` : ''}
      ${canDecide ? `<button class="ui-btn" data-lab-accept="${esc(ch.id)}" style="font-size:11px;padding:4px 10px">Accept</button>
        <button class="ui-btn" data-lab-reject="${esc(ch.id)}" style="font-size:11px;padding:4px 10px">Reject</button>` : ''}
      ${ch.sent && mine ? `<span style="font-size:11px;color:var(--color-neutral-600);align-self:center">Yours — the other side decides this one.</span>` : ''}
    </div>`}
  </div>`;
}

function labThreadHtml(t, opts){
  const owner = !!(opts && opts.owner);
  const internal = t.visibility === LAB_INTERNAL;
  const resolved = t.status === 'resolved';
  /* THE SAME COLOUR RULE THE CANVAS USES, so a note does not change identity
     between the clause it is about and the thread it lives in. A message with
     no side recorded is matched against the organisation, which is how the
     lab's seeded conversations identify themselves. */
  const msgs = (t.messages || []).map(m => {
    const side = m.side || ((m.org && window.FIRST_PARTY && m.org !== window.FIRST_PARTY)
      ? LAB_THEM : LAB_US);
    const tone = window.discussNoteTone
      ? discussNoteTone({ side, visibility: t.visibility }, LAB_US)
      : { style: '', label: '' };
    return `
    <div class="lab-msg" style="${tone.style}">
      <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:600">${esc(m.author)}</span>
        <span style="font-size:10.5px;opacity:.75">· ${esc(m.org || '')}</span>
        ${tone.label ? `<span class="lab-tagwho">${tone.label}</span>` : ''}
      </div>
      <div style="font-size:12.5px;line-height:1.6">${esc(m.body)}</div>
      <div style="font-size:10px;opacity:.7">${esc(fmtDT(m.at))}</div>
    </div>`;
  }).join('');
  return `
  <div class="lab-thread${t.changeId && t.changeId === _labLinked ? ' is-linked' : ''}" data-lab-thread="${esc(t.id)}"${
    t.changeId ? ` data-lab-thread-change="${esc(t.changeId)}"` : ''} style="border:1px solid ${internal ? 'rgba(138,106,42,.35)' : 'var(--color-divider)'};background:${internal ? '#faf5e9' : 'var(--color-surface)'};border-radius:6px;padding:11px 13px;display:flex;flex-direction:column;gap:9px;${resolved ? 'opacity:.66' : ''}">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      ${''/* SPELT OUT, not abbreviated. "Internal" and "Shared" read as
             categories; a person scanning a thread needs to know at a glance
             whether the other side can see it, and the cost of guessing wrong
             is saying something to a room you thought was empty. */}
      ${internal ? labChip('🔒 Internal Only', 'internal') : labChip('🌐 Shared with Counterparty', 'shared')}
      ${resolved ? labChip('Resolved', 'good') : labChip('Open', 'open')}
      ${t.changeId ? labChip('on ' + t.changeId, 'quiet') : ''}
    </div>
    <div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">${esc(t.topicLabel || 'The contract generally')}</div>
    ${msgs}
    ${resolved ? `<div style="font-size:10.5px;color:#1e6b4d">Closed${t.resolvedAt ? ' on ' + esc(fmtDT(t.resolvedAt)) : ''}${
      owner && t.resolvedBy ? ' by ' + esc(t.resolvedBy.name) : (t.resolvedByOrg ? ' by ' + esc(t.resolvedByOrg) : '')}</div>` : ''}
    ${owner && !resolved ? `<div><button class="ui-btn" data-lab-resolve="${esc(t.id)}" style="font-size:11px;padding:4px 10px">Mark resolved</button></div>` : ''}
  </div>`;
}

/* ---------- which mode the lab is in, and the two batch actions ----------
   Two states that look almost identical and mean opposite things:

     INTERNAL SANDBOX DRAFTING — drafts of ours that have not been sent. The
     other side cannot see them, cannot answer them, and does not know they
     exist. Work in progress, on our desk.

     COUNTERPARTY PUBLISHED ROUND — what was sent is on their table. It can be
     answered, and every word of it has left the building.

   The lab already kept the distinction in the data (`ch.sent`, and the
   counterparty view) but never named it, so it was legible only by reading the
   chips on individual cards. */
function labModeBannerHtml(c, lab, side, external){
  const pending = (lab.changes || []).filter(x => x.status === 'pending');
  const unsent  = pending.filter(x => !x.sent && x.side === side);
  const split   = labBatchSplit(c, lab, side);
  const other   = esc(c.counterparty || 'the counterparty');
  if(external) return `
    <div class="lab-mode is-published" role="status">
      <b>🌐 Counterparty published round</b>
      <span style="flex:1;min-width:180px">This is their view. Everything on it has been sent; nothing private is here, because internal work was never put in the object this page renders.</span>
    </div>`;
  /* How many clauses the round would actually cover, as against how many drafts
     it holds. Those differ the moment two colleagues work on the same clause,
     and the difference is the whole point of consolidating: six drafts can be
     three questions. */
  const roundClauses = [];
  for(const d of unsent) if(!roundClauses.includes(d.clauseId)) roundClauses.push(d.clauseId);
  const stacked = unsent.length - roundClauses.length;
  const banner = unsent.length ? `
    <div class="lab-mode is-sandbox" role="status">
      <b>🔒 Internal sandbox drafting</b>
      <span style="flex:1;min-width:180px">${unsent.length} draft${unsent.length === 1 ? '' : 's'} still on your desk${
        stacked > 0 ? `, across ${roundClauses.length} clause${roundClauses.length === 1 ? '' : 's'} — ${stacked} ${stacked === 1 ? 'is a colleague stacking on' : 'are colleagues stacking on'} another's wording` : ''}. ${other} cannot see ${unsent.length === 1 ? 'it' : 'them'} and cannot answer until you send.</span>
      <button class="ui-btn ui-btn-primary" id="lab-publish-round"
        style="font-size:11.5px;padding:4px 11px"
        title="Collapses each clause's internal stack into one clean diff from the last agreed wording, and sends the lot as one turn">📤 Publish Round${
          roundClauses.length ? ` (${roundClauses.length} clause${roundClauses.length === 1 ? '' : 's'})` : ''}</button>
    </div>` : `
    <div class="lab-mode is-published" role="status">
      <b>🌐 Counterparty published round</b>
      <span style="flex:1;min-width:180px">Everything on the table has been sent to ${other}. Nothing here is private.</span>
    </div>`;
  /* The two batch actions live in the same banner, because what they do depends
     entirely on which of the two states you are in. */
  const acts = (split.clear.length || split.theirs.length) ? `
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px">
      <button class="ui-btn" id="lab-batch-acc"${split.clear.length ? '' : ' disabled'}
        style="font-size:11.5px;padding:4px 11px;border-color:#1e6b4d;color:#1e6b4d"
        title="Accepts only the pending changes that trip no playbook, scan or rewrite signal — the rest are held back for you to read">Accept All Non-Risk Redlines${split.clear.length ? ` (${split.clear.length})` : ''}</button>
      <button class="ui-btn" id="lab-batch-rej"${split.theirs.length ? '' : ' disabled'}
        style="font-size:11.5px;padding:4px 11px;border-color:#b0453c;color:#b0453c"
        title="Rejects every pending change proposed by the other side. Your own drafts are untouched.">Reject All Counterparty Redlines${split.theirs.length ? ` (${split.theirs.length})` : ''}</button>
      ${split.held.length ? `<span style="font-size:11px;color:${LAB_GOLD};align-self:center">${split.held.length} held back for a person</span>` : ''}
    </div>` : '';
  return banner.replace('</div>', acts + '</div>');
}

/* The bar that says the discussion is showing one change out of many, and the
   way back. Clicking a fingerprint always HIGHLIGHTS its thread; narrowing the
   list to it is a second, explicit, reversible press — a reader who clicks
   L-002 to read it and then goes looking for L-003 must still find it. */
function labVisibleThreads(threads){
  if(_labOnly && _labLinked && threads.some(t => t.changeId === _labLinked))
    return threads.filter(t => t.changeId === _labLinked);
  return threads;
}
function labLinkedBarHtml(threads){
  if(!_labLinked) return '';
  const n = threads.filter(t => t.changeId === _labLinked).length;
  return `<div class="lab-filterbar" role="status" style="margin-bottom:9px">
    <span style="flex:1;min-width:0">${_labOnly
      ? `Showing the ${n} thread${n === 1 ? '' : 's'} on <b>${esc(_labLinked)}</b>.`
      : (n ? `<b>${esc(_labLinked)}</b> — ${n} thread${n === 1 ? '' : 's'} highlighted below.`
           : `<b>${esc(_labLinked)}</b> has no conversation on it yet.`)}</span>
    ${n ? `<button type="button" id="lab-only">${_labOnly ? 'Show all threads' : 'Show only this one'}</button>` : ''}
    <button type="button" id="lab-unlink">Clear</button>
  </div>`;
}

function renderDocLab(){
  const content = document.getElementById('content');
  const c = getContract(state.activeId);

  if(!c){
    content.innerHTML = `
    <div class="view-enter" style="display:grid;place-items:center;min-height:60vh;padding:32px">
      <div style="text-align:center;max-width:420px">
        <h3 style="font-size:17px;margin:0 0 6px">No contract open</h3>
        <p style="font-size:13px;line-height:1.6;color:var(--color-neutral-700);margin:0 0 16px">The Doc Lab works on whichever contract is open, so open one from the register first. Nothing you do in the lab touches the contract itself.</p>
        <button class="ui-btn ui-btn-primary" onclick="setView('register')">Open the register</button>
      </div>
    </div>`;
    return;
  }
  if(window.API_MODE && API_MODE() && !c._loaded && window.ensureFull){
    content.innerHTML = `<div class="view-enter" style="display:grid;place-items:center;min-height:50vh;font-size:13px;color:var(--color-neutral-600)">Loading contract…</div>`;
    ensureFull(c).then(() => { if(state.activeId === c.id && state.view === 'doclab') renderDocLab(); }).catch(() => {});
    return;
  }

  const lab = labFor(c.id);
  const hadBase = !!lab.baseHtml;
  labBaseline(c, lab);
  if(!hadBase && lab.baseHtml) labPut(c.id, lab);

  const external = state.labView === 'external';
  const side = external ? LAB_THEM : (state.labSide === LAB_THEM ? LAB_THEM : LAB_US);
  const held = labWithheld(lab);
  const payload = labSharePayload(lab);
  const threadsToDraw = external ? payload.threads : lab.threads;
  const changesToDraw = external ? payload.changes : lab.changes;

  content.innerHTML = `
  <style>
    .lab-ins{color:#1e6b4d;background:rgba(46,135,99,.12);border-radius:2px;padding:0 2px;font-weight:600;text-decoration:none}
    .lab-del{color:#8f322b;background:rgba(176,69,60,.10);border-radius:2px;padding:0 2px;text-decoration:line-through}

    /* THE CLAUSE KEEPS ITS SHAPE. Each line of a clause is its own block, so
       pre-wrap is off inside one — the blocks carry the breaks now. The hanging
       indent pulls "7.1" and "(b)" into the gutter and hangs the wrapped wording
       under the first word rather than under the margin, which is how a contract
       is set on paper. */
    .lab-redline .rl-line{margin:0 0 7px;white-space:normal}
    .lab-redline .rl-line:last-child{margin-bottom:0}
    .lab-redline .rl-heading{font-weight:700;font-size:13.5px;margin:11px 0 6px}
    .lab-redline .rl-heading:first-child{margin-top:0}
    .lab-redline .rl-hang{padding-left:2.6em;text-indent:-2.6em}
    .lab-redline .rl-clause{margin-top:9px}
    /* A line that arrived or went whole is marked in the margin as well as in
       colour, so the two stay distinguishable in print and to a reader who
       cannot separate the reds from the greens. */
    .lab-redline .rl-line-ins,.lab-redline .rl-line-del{position:relative}
    .lab-redline .rl-line-ins::before{content:"+";position:absolute;left:-1.1em;
      color:#1e6b4d;font-weight:700;text-indent:0}
    .lab-redline .rl-line-del::before{content:"−";position:absolute;left:-1.1em;
      color:#8f322b;font-weight:700;text-indent:0}

    /* ---- ONE CLAUSE, ONE FRAME ----
       The utility class names on the element are the ones the spec asks for.
       These rules carry the same look independently, so the frame does not
       vanish if a utility framework fails to load — which is exactly what
       happens on this app's offline stage. */
    .clause-frame{background:var(--color-surface);border:1px solid var(--color-divider);
      border-radius:8px;padding:16px 18px;margin:0 0 16px;box-shadow:var(--shadow-sm);
      transition:border-color .16s ease, box-shadow .16s ease;position:relative}
    .clause-frame:hover{border-color:#a5b4fc}
    .clause-frame:focus-within{border-color:#6366f1}
    .clause-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 9px}
    .clause-title{font-size:13.5px;font-weight:700;color:var(--color-neutral-900)}
    .clause-body{font-size:14px;line-height:1.72}

    /* The toolbar sits top-right of its own frame and stays out of the way
       until the clause is hovered or something in it has focus — a document
       with forty clauses must not read as forty rows of buttons. It is fully
       visible on keyboard focus, so it is never unreachable without a pointer. */
    .clause-tools{margin-left:auto;display:flex;gap:5px;flex-wrap:wrap;
      opacity:0;transition:opacity .16s ease}
    .clause-frame:hover .clause-tools,
    .clause-frame:focus-within .clause-tools{opacity:1}
    @media (hover:none){ .clause-tools{opacity:1} }
    .clause-tool{font:inherit;font-size:11px;line-height:1;cursor:pointer;white-space:nowrap;
      border:1px solid var(--color-divider);background:var(--color-bg);
      color:var(--color-neutral-700);border-radius:5px;padding:5px 8px}
    .clause-tool:hover{border-color:#6366f1;color:#4338ca;background:#eef2ff}

    /* ---- the change tag that rides with the diff ---- */
    .change-tag-badge{display:inline-block;font-family:var(--font-mono);font-size:10.5px;
      line-height:1.5;padding:2px 7px;border-radius:5px;cursor:pointer;
      background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe}
    .change-tag-badge:hover{background:#c7d2fe}
    .change-tag-badge[aria-pressed="true"]{background:#4338ca;border-color:#4338ca;color:#fff}

    /* ---- notes pinned to a change ---- */
    .clause-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;
      padding-top:9px;border-top:1px dashed var(--color-divider)}
    /* A note is a BUBBLE now, not a pill: it carries two marks and a body, and
       the rounded-pill shape stopped fitting the moment there was more than one
       word in it. */
    .lab-tag{display:inline-flex;align-items:center;gap:6px;font-size:11px;line-height:1.5;
      border-radius:7px;padding:5px 9px;max-width:100%;flex-wrap:wrap}
    /* WHO WROTE IT — the colour, set inline from discussNoteTone so the lab and
       the product cannot drift apart. These are the fallback for a page where
       that module did not load. */
    .lab-tag.note-owner{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a}
    .lab-tag.note-counterparty{background:#fffbeb;border:1px solid #fde68a;color:#78350f}
    .lab-tagwho{font-weight:700;font-size:9.5px;letter-spacing:.04em;white-space:nowrap;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    /* WHO CAN SEE IT — a separate mark, because visibility and authorship are
       independent and one badge cannot honestly carry both. */
    .lab-tagvis{font-size:9px;letter-spacing:.04em;border-radius:999px;padding:1px 6px;
      white-space:nowrap;background:rgba(255,255,255,.65);border:1px solid rgba(0,0,0,.09);
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    /* Kept for the older callers and for the counterparty's copy, which has no
       authorship to colour by. */
    .lab-tag.is-internal:not(.note-owner):not(.note-counterparty){background:#f4ecd8;color:#7d5a14;border:1px solid rgba(138,106,42,.32)}
    .lab-tag.is-shared:not(.note-owner):not(.note-counterparty){background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe}

    /* ---- whose hand is on a redline ---- */
    .lab-authorpill{display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);
      font-size:9.5px;font-weight:700;letter-spacing:.03em;border-radius:999px;padding:2px 7px;
      background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe;white-space:nowrap}
    /* A stacked pass is marked, because "the third person to touch this clause"
       is a different thing to read than "the author". */
    .lab-authorpill.is-stacked{background:#ede9fe;border-color:#ddd6fe;color:#5b21b6}
    .lab-pilldepth{font-size:8.5px;opacity:.8}
    .lab-stacktrail{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:9px;
      padding:6px 9px;border-radius:6px;background:#faf7ef;border:1px dashed rgba(138,106,42,.3)}
    .lab-stacklabel{font-size:9.5px;font-weight:700;letter-spacing:.05em;color:#7d5a14;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    .lab-stackstep{display:inline-flex;align-items:center;gap:5px}
    .lab-stackid{font-family:var(--font-mono);font-size:9.5px;color:var(--color-neutral-600)}
    .lab-stackarrow{color:var(--color-neutral-500);font-size:10px}
    /* A message in a thread, tinted by the side that wrote it — the same rule
       the notes on the canvas use, so one note reads as one thing wherever a
       reader meets it. */
    .lab-msg{display:flex;flex-direction:column;gap:3px;border-radius:6px;padding:7px 9px}
    /* The initials welded to an insertion in the document itself. Superscript
       and half-opacity: present for anyone looking for it, invisible to anyone
       reading the clause for what it says. */
    .rl-authormark{font-family:var(--font-mono);font-size:8px;vertical-align:super;
      margin-left:2px;opacity:.65;letter-spacing:.02em}
    .lab-tag-x{border:0;background:none;cursor:pointer;font:inherit;font-size:13px;
      line-height:1;padding:0 1px;color:inherit;opacity:.55}
    .lab-tag-x:hover{opacity:1}

    /* ---- the note composer ---- */
    .lab-notepop{position:fixed;z-index:82;width:min(380px,calc(100vw - 32px));border-radius:10px;
      background:var(--color-surface);border:1px solid var(--color-divider);
      box-shadow:0 18px 44px -12px rgba(20,32,48,.42);padding:13px 15px;
      display:flex;flex-direction:column;gap:9px}
    .lab-notepop textarea{width:100%;min-height:74px;resize:vertical;font:inherit;font-size:12.5px;
      line-height:1.55;padding:8px 10px;border-radius:6px;border:1px solid var(--color-divider);
      background:var(--color-bg);color:var(--color-neutral-800)}

    /* ---- the selection menu ---- */
    .lab-selmenu{position:fixed;z-index:80;display:flex;flex-direction:column;gap:1px;
      min-width:246px;padding:5px;border-radius:9px;background:var(--color-surface);
      border:1px solid var(--color-divider);box-shadow:0 12px 32px -8px rgba(20,32,48,.34)}
    .lab-selmenu button{display:block;width:100%;text-align:left;font:inherit;font-size:12.5px;
      color:var(--color-neutral-800);background:none;border:0;border-radius:6px;padding:7px 9px;cursor:pointer}
    .lab-selmenu button:hover,.lab-selmenu button:focus-visible{background:var(--color-neutral-100)}
    .lab-selhead{font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;
      color:var(--color-neutral-500);padding:5px 9px 3px}
    .lab-selquote{font-size:11px;color:var(--color-neutral-600);padding:0 9px 6px;font-style:italic;
      max-width:246px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

    /* ---- the AI proposal popover ---- */
    .lab-aipop{position:fixed;z-index:81;width:min(470px,calc(100vw - 32px));border-radius:10px;
      background:var(--color-surface);border:1px solid var(--color-divider);
      box-shadow:0 20px 46px -12px rgba(20,32,48,.42);overflow:hidden}
    .lab-aipop header{display:flex;align-items:center;gap:8px;padding:11px 14px;
      border-bottom:1px solid var(--color-divider);background:var(--color-bg);font-size:12.5px;font-weight:700}
    .lab-aibody{padding:12px 14px;max-height:42vh;overflow:auto;font-family:var(--font-doc);
      font-size:13px;line-height:1.68}
    .lab-aipop footer{display:flex;gap:8px;align-items:center;padding:10px 14px;
      border-top:1px solid var(--color-divider);background:var(--color-bg);flex-wrap:wrap}
    .lab-aiwait{display:flex;align-items:center;gap:9px;padding:16px 14px;font-size:12.5px;
      color:var(--color-neutral-600)}
    .lab-aispin{width:14px;height:14px;border-radius:50%;flex:none;border:2px solid var(--color-divider);
      border-top-color:var(--color-neutral-700);animation:lab-spin .8s linear infinite}
    @keyframes lab-spin{to{transform:rotate(360deg)}}

    /* ---- the editable AI proposal ---- */
    .lab-ailabel{display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;
      color:var(--color-neutral-500);margin:0 0 5px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    .lab-aitext{width:100%;min-height:88px;resize:vertical;font-family:var(--font-doc);
      font-size:13px;line-height:1.6;padding:9px 11px;border-radius:6px;
      border:1px solid var(--color-divider);background:var(--color-bg);color:var(--color-neutral-900)}
    .lab-aitext:focus{outline:2px solid #6366f1;outline-offset:1px;border-color:#6366f1}
    .lab-aisub{font-size:11px;color:var(--color-neutral-600);margin-top:6px;line-height:1.5;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    .lab-aipreview{border:1px solid var(--color-divider);border-radius:6px;padding:11px 13px;
      background:var(--color-bg);max-height:190px;overflow:auto}
    .lab-aiempty{font-size:12px;color:var(--color-neutral-600);line-height:1.55;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    /* Says out loud that this edit is being written on top of an undecided one,
       because the redline underneath will show both and a reader who did not
       expect that would read someone else's wording as their own. */
    .lab-aistack{font-size:11px;line-height:1.5;margin-top:7px;padding:6px 9px;border-radius:5px;
      background:#f4ecd8;color:#8a6d1f;border:1px solid #e3d3a8;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    .lab-aistate{font-size:10.5px;color:var(--color-neutral-500)}
    .lab-aipop footer .ui-btn[disabled]{opacity:.45;cursor:not-allowed}

    /* ---- a change badge in the document, and the thread it points at ---- */
    .lab-badge{font-family:var(--font-mono);font-size:10.5px;border-radius:999px;padding:2px 9px;
      cursor:pointer;border:1px solid var(--color-divider);background:var(--color-bg);
      color:var(--color-neutral-700)}
    .lab-badge:hover{border-color:#8a6a2a;color:#8a6a2a}
    .lab-badge[aria-pressed="true"]{background:#8a6a2a;border-color:#8a6a2a;color:#fff}
    .lab-thread.is-linked,.lab-card.is-linked{box-shadow:0 0 0 3px rgba(99,102,241,.42);
      border-color:#6366f1 !important}
    .lab-filterbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:11.5px;
      padding:7px 11px;border-radius:6px;background:#fdf6e7;border:1px solid #e0c48a;color:#7d5a14}
    .lab-filterbar button{font:inherit;font-size:11px;font-weight:600;cursor:pointer;
      border:1px solid #d8bd86;background:#fff;color:#7d5a14;border-radius:5px;padding:3px 9px}

    /* ---- which mode the lab is in ---- */
    .lab-mode{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;
      padding:9px 14px;border-radius:6px;border:1px solid var(--color-divider)}
    .lab-mode.is-sandbox{border-left:4px solid #8a6a2a;background:#fffdf7;color:#7d5a14}
    .lab-mode.is-published{border-left:4px solid #33475c;background:#f5f8fb;color:var(--color-neutral-800)}
    .lab-mode b{font-size:12.5px}
  </style>
  <div class="view-enter" style="padding:14px 16px 24px;display:flex;flex-direction:column;gap:12px">

    <section style="${LAB_CARD};padding:12px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div style="min-width:0;flex:1">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <h3 style="font-size:16px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</h3>
          ${labChip('Sandbox', 'internal')}
        </div>
        <div style="font-size:11px;color:var(--color-neutral-600);margin-top:2px">${esc(c.id)}${c.counterparty ? ' · ' + esc(c.counterparty) : ''} — a copy of the document you can edit freely. Nothing here is saved to the contract or sent anywhere.</div>
      </div>
      ${external ? '' : `
      <div style="display:inline-flex;border:1px solid var(--color-divider);border-radius:5px;overflow:hidden;flex:none">
        <button id="lab-side-us" class="ui-btn" style="border:0;border-radius:0;font-size:12px;${side === LAB_US ? 'background:var(--color-neutral-800);color:#fff' : ''}">Acting as us</button>
        <button id="lab-side-them" class="ui-btn" style="border:0;border-left:1px solid var(--color-divider);border-radius:0;font-size:12px;${side === LAB_THEM ? 'background:var(--color-neutral-800);color:#fff' : ''}">Acting as them</button>
      </div>`}
      <div style="display:inline-flex;border:1px solid var(--color-divider);border-radius:5px;overflow:hidden;flex:none">
        <button id="lab-int" class="ui-btn" style="border:0;border-radius:0;font-size:12px;${external ? '' : 'background:var(--color-accent);color:#fff'}">Your workspace</button>
        <button id="lab-ext" class="ui-btn" style="border:0;border-left:1px solid var(--color-divider);border-radius:0;font-size:12px;${external ? 'background:var(--color-accent);color:#fff' : ''}">Counterparty's view</button>
      </div>
    </section>

    ${external ? `
    <section style="${LAB_CARD};padding:11px 16px;background:var(--color-accent-100);border-color:var(--color-accent-300)">
      <div style="font-size:12px;line-height:1.6;color:var(--color-accent-900)">
        Drawn from what <code style="font-family:var(--font-mono);font-size:11px">labSharePayload()</code> returned — <b>${payload.changes.length} change${payload.changes.length === 1 ? '' : 's'}</b> and <b>${payload.threads.length} thread${payload.threads.length === 1 ? '' : 's'}</b>.
        Internal notes and unsent drafts are not hidden here; they were never put in the object this page is rendering.
      </div>
    </section>` : ((held.threads || held.drafts) ? `
    <section style="${LAB_CARD};padding:11px 16px;border-left:3px solid ${LAB_GOLD}">
      <div style="font-size:12px;line-height:1.6;color:var(--color-neutral-800)">
        Staying behind if this were shared right now: <b>${held.threads} internal thread${held.threads === 1 ? '' : 's'}</b> (${held.messages} message${held.messages === 1 ? '' : 's'})${held.drafts ? ` and <b>${held.drafts} unsent draft change${held.drafts === 1 ? '' : 's'}</b>` : ''}. Switch to the counterparty's view to check.
      </div>
    </section>` : '')}

    ${labModeBannerHtml(c, lab, side, external)}

    <div style="display:grid;grid-template-columns:minmax(0,1.25fr) minmax(330px,1fr);gap:12px;align-items:start">

      <section style="${LAB_CARD};padding:18px 22px 26px;min-width:0">
        <h6 style="${LAB_H6};margin-bottom:14px">Working document${external ? ' · as they see it' : ' · the lab’s own copy'}</h6>
        <div id="lab-canvas" class="document-canvas" style="font-family:var(--font-doc);color:var(--color-doc-text)">${labDocHtml(c, lab, side, external)}</div>
      </section>

      <div style="display:flex;flex-direction:column;gap:12px;min-width:0">

        <section style="${LAB_CARD};padding:14px 16px">
          <h6 style="${LAB_H6};margin-bottom:10px">Changes${external ? ' on the table' : ''}</h6>
          ${changesToDraw.length
            ? `<div style="display:flex;flex-direction:column;gap:8px">${changesToDraw.map(ch => labChangeCardHtml(ch, side, external)).join('')}</div>`
            : `<div style="font-size:12px;color:var(--color-neutral-600);line-height:1.6">${external
                ? 'Nothing has been sent to them yet.'
                : 'No changes yet. Use <b>Change this clause</b> in the document, or seed a round below.'}</div>`}
        </section>

        <section style="${LAB_CARD};padding:14px 16px">
          <h6 style="${LAB_H6};margin-bottom:10px">Discussion${external ? ' · as they see it' : ''}</h6>
          ${labLinkedBarHtml(threadsToDraw)}
          ${threadsToDraw.length
            ? `<div style="display:flex;flex-direction:column;gap:9px">${labVisibleThreads(threadsToDraw).map(t => labThreadHtml(t, { owner: !external })).join('')}</div>`
            : `<div style="font-size:12px;color:var(--color-neutral-600);line-height:1.6">${external
                ? 'Nothing has been shared with them yet.'
                : 'No threads yet. Write one below, or seed a round.'}</div>`}
        </section>

        ${external ? `
        <section style="${LAB_CARD};padding:14px 16px">
          <div style="font-size:12px;line-height:1.6;color:var(--color-neutral-700)">A counterparty has no composer for internal notes, because internal is not a thing that exists on their side of the wall.</div>
        </section>` : `
        <section style="${LAB_CARD};padding:14px 16px;display:flex;flex-direction:column;gap:10px">
          <h6 style="${LAB_H6}">Write a message</h6>

          <div style="display:flex;gap:0;border:1px solid var(--color-divider);border-radius:5px;overflow:hidden">
            <button id="lab-vis-int" class="ui-btn" style="flex:1;border:0;border-radius:0;font-size:12px;background:#f4ecd8;color:${LAB_GOLD};font-weight:600">Internal note</button>
            <button id="lab-vis-sh" class="ui-btn" style="flex:1;border:0;border-left:1px solid var(--color-divider);border-radius:0;font-size:12px">Send to ${esc(c.counterparty || 'the counterparty')}</button>
          </div>
          <input type="hidden" id="lab-vis" value="${LAB_INTERNAL}"/>
          <div id="lab-vis-note" style="font-size:11px;line-height:1.5;color:${LAB_GOLD}">This will stay inside ${esc(window.FIRST_PARTY || 'your organisation')}. It is not in the share payload.</div>

          <label style="display:block">
            <span style="font-size:10.5px;color:var(--color-neutral-600)">About</span>
            <select id="lab-topic" style="width:100%;font:inherit;font-size:12px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:7px 9px;color:inherit;margin-top:3px">
              ${labTopics(lab).map(t => `<option value="${esc(t.value)}">${esc(t.label)}</option>`).join('')}
            </select>
          </label>

          <textarea id="lab-body" rows="3" placeholder="What do you want to say?" style="width:100%;font:inherit;font-size:12.5px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:8px 10px;color:inherit;resize:vertical"></textarea>

          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="lab-send-msg" class="ui-btn ui-btn-primary" style="font-size:12px">Post to the lab</button>
            <button id="lab-seed" class="ui-btn" style="font-size:12px">Seed a round</button>
            <button id="lab-clear" class="ui-btn" style="font-size:12px">Clear the lab</button>
          </div>
        </section>`}

      </div>
    </div>

    <section style="${LAB_CARD};padding:14px 18px">
      <h6 style="${LAB_H6};margin-bottom:8px">What this page is proving</h6>
      <div style="font-size:12.5px;line-height:1.7;color:var(--color-neutral-800);max-width:78ch">
        The counterparty column is rendered <b>from</b> the object <code style="font-family:var(--font-mono);font-size:11px">labSharePayload()</code> hands back, not from the full list with the internal material styled out of sight. If the filter were wrong the material would appear here, because there would be nothing left to hide it.
        Two fields decide what travels, and both are explicit allow: a thread goes only if its visibility says <code style="font-family:var(--font-mono);font-size:11px">shared</code>, a change only once it has been sent. A field nobody set means it stays home.
        The wording is rebuilt from the accepted changes on every read rather than written over the clause, so rejecting everything reproduces the original exactly — and the side that proposed a change cannot be the side that accepts it.
      </div>
    </section>

  </div>`;

  wireDocLab(c, lab, side, external);
}

function wireDocLab(c, lab, side, external){
  const againLab = () => renderDocLab();

  /* ---------- an inline change tag points at its card and its argument ----------
     Clicking the badge beside a redline scrolls the sidebar to the matching
     change card and lights it, along with any threads pinned to that change.
     Clicking the same badge again clears it, so the link is never a state
     somebody can be stuck in without knowing why.

     Scrolled AFTER the repaint, because the repaint rebuilds the very nodes
     being scrolled to — doing it the other way round scrolls to a node that is
     about to be thrown away. */
  const linkTo = id => {
    if(_labLinked === id){ _labLinked = null; _labOnly = false; }
    else _labLinked = id;
    againLab();
    if(!_labLinked) return;
    const card = document.querySelector(`[data-lab-card="${_labLinked}"]`);
    const thread = document.querySelector(`[data-lab-thread-change="${_labLinked}"]`);
    (card || thread)?.scrollIntoView({ block:'center', behavior:'smooth' });
  };
  document.querySelectorAll('.change-tag-badge[data-change-id]').forEach(b => {
    const go = e => { e.stopPropagation(); linkTo(b.getAttribute('data-change-id')); };
    b.addEventListener('click', go);
    /* It is a span with role=button, so the keyboard has to be given the same
       verb the pointer has. */
    b.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(e); }
    });
  });

  /* ---------- the per-clause toolbar ----------
     Each button acts on the clause whose frame it sits in, so an action can
     never be filed against a clause the writer was not looking at. */
  const clauseCtx = clauseId => {
    const cl = labClausesOf(lab).find(x => x.clauseId === clauseId);
    if(!cl) return null;
    const host = document.querySelector(`[data-clause-id="${clauseId}"]`);
    const { base, working, pending } = labWorkingText(cl, lab.changes, side);
    return { clauseId, label: (host && host.getAttribute('data-lab-clause-label')) || clauseId,
      text: base, working, pending };
  };
  document.querySelectorAll('[data-lab-assist]').forEach(b => b.addEventListener('click', () => {
    const clause = clauseCtx(b.getAttribute('data-lab-assist'));
    if(!clause) return;
    const rect = b.getBoundingClientRect();
    /* No selection, so the whole clause is the passage — and the passage is the
       clause as it would READ, pending change included, because that is the
       wording on screen. Offering the same menu keeps one mental model: pick a
       passage, pick an action. */
    labSelMenu({ c, lab, side, again: againLab, rect, clause, text: clause.working, whole: true });
  }));
  document.querySelectorAll('[data-lab-note]').forEach(b => b.addEventListener('click', () => {
    const clauseId = b.getAttribute('data-lab-note');
    const live = (lab.changes || []).find(x => x.clauseId === clauseId && x.status === 'pending');
    labNoteCompose({ c, lab, side, changeId: live ? live.id : null,
      rect: b.getBoundingClientRect(), again: againLab });
  }));
  document.querySelectorAll('[data-lab-tagadd]').forEach(b => b.addEventListener('click', () => {
    labNoteCompose({ c, lab, side, changeId: b.getAttribute('data-lab-tagadd'),
      rect: b.getBoundingClientRect(), again: againLab });
  }));
  document.querySelectorAll('[data-lab-untag]').forEach(b => b.addEventListener('click', () => {
    const [changeId, tagId] = String(b.getAttribute('data-lab-untag')).split('|');
    if(labUntagChange(lab, changeId, tagId)){ labPut(c.id, lab); againLab(); }
  }));

  document.getElementById('lab-only')?.addEventListener('click', () => { _labOnly = !_labOnly; againLab(); });
  document.getElementById('lab-unlink')?.addEventListener('click', () => { _labLinked = null; _labOnly = false; againLab(); });

  /* ---------- the two batch actions ----------
     Neither is "do it to everything". Accept takes only what trips no risk
     signal and says what it held back; reject takes only the other side's asks,
     because sweeping away our own drafts would be a bulk route around "nobody
     rules on their own proposal". */
  const batch = kind => {
    const split = labBatchSplit(c, lab, side);
    const take = kind === 'accept' ? split.clear : split.theirs;
    if(!take.length){
      if(window.toast) toast(kind === 'accept'
        ? `Nothing accepted automatically — all ${split.held.length} pending change${split.held.length === 1 ? '' : 's'} tripped a risk signal, so each one needs a person`
        : 'No changes from the other side are pending', 'err');
      return;
    }
    let done = 0;
    for(const ch of take)
      if(labDecide(lab, ch.id, kind === 'accept' ? 'accepted' : 'rejected',
        window.currentUser ? currentUser() : null, side)) done++;
    labPut(c.id, lab);
    /* WHAT WAS HELD BACK IS SAID, every time. A batch that silently took four
       of six reads as though it took all six, and the two left behind are
       exactly the ones that needed a person to look at them. */
    if(window.toast) toast(kind === 'accept'
      ? `${done} change${done === 1 ? '' : 's'} accepted`
        + (split.held.length ? ` · ${split.held.length} held back: ${split.held.slice(0,3).map(h => h.ch.id + ' (' + h.why[0] + ')').join(', ')}${split.held.length > 3 ? '…' : ''}` : '')
      : `${done} change${done === 1 ? '' : 's'} rejected — those clauses revert to the baseline`);
    againLab();
  };
  document.getElementById('lab-batch-acc')?.addEventListener('click', () => batch('accept'));
  document.getElementById('lab-batch-rej')?.addEventListener('click', () => batch('reject'));

  /* ---- publish the round ----
     One turn, one diff per clause, whatever the internal history behind it. */
  document.getElementById('lab-publish-round')?.addEventListener('click', () => {
    const out = labPublishRound(lab, side, u(), c);
    if(!out.published.length){
      if(window.toast) toast('Nothing to publish — no drafts of yours are waiting', 'err');
      return;
    }
    save(); repaint();
    if(window.toast) toast(out.folded.length
      /* WHAT WAS FOLDED IS SAID. A round that quietly collapsed six drafts into
         three reads as though three were all there ever was, and somebody's
         work would look like it had vanished. */
      ? `Round published — ${out.published.length} clause${out.published.length === 1 ? '' : 's'} sent, ${out.folded.length} internal draft${out.folded.length === 1 ? '' : 's'} folded into ${out.published.length === 1 ? 'it' : 'them'} and kept at home`
      : `Round published — ${out.published.length} change${out.published.length === 1 ? '' : 's'} on ${esc(c.counterparty || 'the counterparty')}'s table`);
  });

  /* ---------- highlight a passage, ask for something to be done to it ----------
     Offered on the lab's own copy only. The counterparty's view is a read-only
     picture of what was sent, so a menu there would end at a proposal nobody is
     in a position to file.

     Bound on mouseup and on keyup rather than on selectionchange: the latter
     fires on every character of a drag and would flicker a menu under the
     pointer the whole way across the clause. */
  if(!external){
    /* Opened from the STORED selection, never from the live one. By the time a
       menu button is pressed the document selection may well be gone. */
    const openSel = () => {
      const canvas = document.getElementById('lab-canvas');
      const s = labCaptureSel(canvas);
      if(!s){ labKillSel(); return; }
      const cl = labClausesOf(lab).find(x => x.clauseId === s.clauseId);
      if(!cl){ labKillSel(); return; }
      const { base, working, pending } = labWorkingText(cl, lab.changes, side);
      const clause = { clauseId: s.clauseId,
        label: s.host.getAttribute('data-lab-clause-label') || s.clauseId,
        text: base, working, pending };
      /* Where this selection starts in the working text, so a phrase that
         appears twice in the clause is rewritten where it was pointed at. The
         leading whitespace trimmed off the text is added back, because the
         offset has to describe the trimmed string. */
      const hint = labWorkingOffset(s.host.querySelector('.clause-body') || s.host,
        s.startNode, s.startOffset) + (s.raw.length - s.raw.replace(/^\s+/, '').length);
      labSelMenu({ c, lab, side, again: againLab, rect: s.rect, clause, text: s.text, hint });
    };
    const canvas = document.getElementById('lab-canvas');
    if(canvas){
      /* TEN MILLISECONDS, and the number is doing work. mouseup fires before
         the browser has finished settling the range the drag implies, so a
         same-tick read gets a collapsed selection or the previous one — which
         is what made the menu flash. A macrotask is enough for the range to
         stabilise and is still faster than the eye. */
      /* A MOUSEUP ON A CONTROL IS NOT A SELECTION GESTURE, and treating it as
         one is what made the clause toolbar's AI Assist flash and vanish.

         The toolbar sits inside the canvas, so pressing it fires this handler
         too. Ten milliseconds later openSel looked for a selection, found none
         — a click collapses one — and dismissed the menu that the button's own
         click handler had just opened. The menu appeared and was removed by the
         gesture that asked for it. At the old zero-delay this was a race
         between two tasks that the menu sometimes won; making the delay long
         enough to be correct for selections made it reliably lose.

         So the gesture is read first: pressing a button, a badge, a link or a
         field is somebody operating the page, not selecting words in it. */
      const fromControl = t => !!(t && t.closest && t.closest(
        '.clause-tools, .clause-tool, .change-tag-badge, .lab-selmenu, ' +
        '#ai-copilot-popover, [data-lab-editor], button, a, input, textarea, select'));
      canvas.addEventListener('mouseup', e => {
        if(fromControl(e.target)) return;
        setTimeout(openSel, 10);
      });
      canvas.addEventListener('keyup', e => {
        if(!(e.shiftKey || e.key === 'Shift')) return;
        /* Shift-selecting inside the Direct Edit box is editing that box, not
           selecting document text. */
        if(fromControl(e.target)) return;
        setTimeout(openSel, 10);
      });
    }
    /* ---- dismissal, bound ONCE for the life of the page ----
       These used to be added on every wire, so a page repainted twenty times
       carried twenty copies of each, and every one of them raced the others to
       remove the menu. They read the live context out of _labCtx instead of
       closing over the one they were created with. */
    _labCtx = { c, lab, side };
    if(!_labDismissWired){
      _labDismissWired = true;
      document.addEventListener('mousedown', e => {
        const t = e.target;
        const inside = sel => !!(t && t.closest && t.closest(sel));
        /* THE MENU goes on any click that is not on the menu itself or on the
           popover it opens — including a click back into the document, which is
           the start of a new selection. */
        if(!inside('.lab-selmenu') && !inside('#ai-copilot-popover')) labKillSel();
        /* THE POPOVER is stickier, and deliberately so. It holds wording the
           person has been editing by hand, so clicking back into the document
           to re-read the clause must not throw that away. It closes only on a
           click outside BOTH the canvas and itself — or on Discard, Close or
           Escape, which are the ways to say so on purpose. */
        if(!inside('.document-canvas') && !inside('#ai-copilot-popover')
          && !inside('.lab-selmenu')) labKillPop();
      }, true);
      document.addEventListener('keydown', e => {
        if(e.key === 'Escape'){ labKillSel(); labKillPop(); labClearSel(); }
      });
    }
  }

  const on = (id, fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
  const save = () => labPut(c.id, lab);
  const repaint = () => renderDocLab();
  const u = () => currentUser();

  on('lab-int', () => { state.labView = 'internal'; repaint(); });
  on('lab-ext', () => { state.labView = 'external'; repaint(); });
  on('lab-side-us',   () => { state.labSide = LAB_US;   repaint(); });
  on('lab-side-them', () => { state.labSide = LAB_THEM; repaint(); });

  /* ---- editing a clause ---- */
  document.querySelectorAll('[data-lab-edit]').forEach(b => b.addEventListener('click', () => {
    const clauseId = b.getAttribute('data-lab-edit');
    const cl = labClausesOf(lab).find(x => x.clauseId === clauseId);
    if(!cl) return;
    const changes = lab.changes;
    const live = labPendingOn(changes, clauseId, side);
    const current = live ? live.after : labClauseText(cl, changes);
    const label = window.clauseLabel ? clauseLabel(cl) : (cl.headingText || clauseId);
    const host = b.closest('[data-lab-clause]');
    if(!host || host.querySelector('[data-lab-editor]')) return;
    const box = document.createElement('div');
    box.setAttribute('data-lab-editor', '1');
    box.style.cssText = 'margin-top:8px;display:flex;flex-direction:column;gap:7px';
    box.innerHTML = `
      <div style="font-size:10.5px;color:var(--color-neutral-600)">Rewrite ${esc(label)} as ${side === LAB_US ? esc(window.FIRST_PARTY || 'us') : esc(c.counterparty || 'the counterparty')}. Nothing moves until the other side accepts it.</div>
      <textarea rows="5" style="width:100%;font:inherit;font-size:12.5px;font-family:var(--font-doc);border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:8px 10px;color:inherit;resize:vertical"></textarea>
      <div style="display:flex;gap:7px"><button class="ui-btn ui-btn-primary" data-lab-save style="font-size:11.5px">Propose it</button><button class="ui-btn" data-lab-cancel style="font-size:11.5px">Cancel</button></div>`;
    host.appendChild(box);
    const ta = box.querySelector('textarea');
    ta.value = current; ta.focus();
    box.querySelector('[data-lab-cancel]').addEventListener('click', () => box.remove());
    box.querySelector('[data-lab-save]').addEventListener('click', () => {
      const authorRef = labAuthorOf(u(), side, c);
      const ch = labFileChange(lab, {
        clauseId, clauseLabel: label,
        before: labClauseText(cl, lab.changes),
        after: ta.value,
        side, authorRef,
        author: authorRef.name + ' · ' + authorRef.organization
      });
      if(!ch){ if(window.toast) toast('Nothing changed in that clause', 'err'); return; }
      save(); repaint();
      if(window.toast) toast(ch.parentChangeId
        ? `${ch.id} filed on top of ${ch.parentChangeId} — it stacks on a colleague's ask rather than replacing it`
        : `${ch.id} filed — it is yours until you send it`);
    });
  }));

  /* ---- sending and deciding ---- */
  document.querySelectorAll('[data-lab-send]').forEach(b => b.addEventListener('click', () => {
    const ch = labSendChange(lab, b.getAttribute('data-lab-send'));
    if(!ch) return;
    save(); repaint();
    if(window.toast) toast(`${ch.id} sent — it is on the other side's table now`);
  }));
  const decide = (id, decision) => {
    const ch = labDecide(lab, id, decision, u(), side);
    if(!ch){ if(window.toast) toast('You cannot decide your own ask — switch sides to answer it', 'err'); return; }
    save(); repaint();
    if(window.toast) toast(ch.closedThreads
      ? `${ch.id} ${decision}, and ${ch.closedThreads} linked thread${ch.closedThreads === 1 ? '' : 's'} closed with it`
      : `${ch.id} ${decision}`);
  };
  document.querySelectorAll('[data-lab-accept]').forEach(b =>
    b.addEventListener('click', () => decide(b.getAttribute('data-lab-accept'), 'accepted')));
  document.querySelectorAll('[data-lab-reject]').forEach(b =>
    b.addEventListener('click', () => decide(b.getAttribute('data-lab-reject'), 'rejected')));

  /* ---- messages ---- */
  const visIn = document.getElementById('lab-vis');
  const note  = document.getElementById('lab-vis-note');
  const bInt  = document.getElementById('lab-vis-int');
  const bSh   = document.getElementById('lab-vis-sh');
  function setVis(v){
    if(!visIn) return;
    visIn.value = v;
    const isInt = v === LAB_INTERNAL;
    if(bInt){ bInt.style.background = isInt ? '#f4ecd8' : ''; bInt.style.color = isInt ? LAB_GOLD : ''; bInt.style.fontWeight = isInt ? '600' : ''; }
    if(bSh){ bSh.style.background = isInt ? '' : 'var(--color-accent)'; bSh.style.color = isInt ? '' : '#fff'; bSh.style.fontWeight = isInt ? '' : '600'; }
    if(note){
      note.style.color = isInt ? LAB_GOLD : 'var(--color-accent-800)';
      note.textContent = isInt
        ? `This will stay inside ${window.FIRST_PARTY || 'your organisation'}. It is not in the share payload.`
        : `This goes to ${c.counterparty || 'the counterparty'} the next time the contract is shared.`;
    }
  }
  if(bInt) bInt.addEventListener('click', () => setVis(LAB_INTERNAL));
  if(bSh)  bSh.addEventListener('click', () => setVis(LAB_SHARED));

  on('lab-send-msg', () => {
    const body = (document.getElementById('lab-body') || {}).value || '';
    if(!body.trim()){ if(window.toast) toast('Write the message first', 'err'); return; }
    const sel = document.getElementById('lab-topic');
    const topic = labTopics(lab).find(t => t.value === (sel ? sel.value : 'general')) || { label: 'The contract generally' };
    lab.threads.push({
      id: labUid('th'),
      visibility: (visIn && visIn.value) === LAB_SHARED ? LAB_SHARED : LAB_INTERNAL,
      status: 'open',
      changeId: topic.changeId || null,
      topicLabel: topic.label,
      messages: [{ id: labUid('m'), author: (u() && u().name) || 'You',
        org: side === LAB_US ? (window.FIRST_PARTY || 'Us') : (c.counterparty || 'Them'),
        body: body.trim(), at: nowISO() }]
    });
    save(); repaint();
  });

  document.querySelectorAll('[data-lab-resolve]').forEach(b => b.addEventListener('click', () => {
    const t = lab.threads.find(x => x.id === b.getAttribute('data-lab-resolve'));
    if(!t) return;
    t.status = 'resolved'; t.resolvedAt = nowISO();
    t.resolvedBy = { name: (u() && u().name) || 'You',
      org: side === LAB_THEM ? 'The counterparty' : (window.FIRST_PARTY || 'This workspace') };
    save(); repaint();
  }));

  on('lab-seed',  () => {
    if(!labSeed(c, lab)){ if(window.toast) toast('This contract has no clauses the lab can read', 'err'); return; }
    save(); repaint();
  });
  on('lab-clear', () => { labClear(c.id); repaint(); });
}

if (typeof window !== 'undefined') Object.assign(window, {
  LAB_KEY, LAB_INTERNAL, LAB_SHARED, LAB_US, LAB_THEM,
  labLoad, labFor, labPut, labClear, labUid,
  labSharePayload, labShareChanges, labWithheld,
  LAB_STAGE_DRAFT, LAB_STAGE_PUBLISHED, LAB_STAGE_FOLDED, LAB_ROLES,
  labClauseText, labWorkingText, labPickOccurrence, labWorkingOffset,
  labPendingOn, labStackOn, labCanDecide, labMigrateChanges,
  labDraftOnlyStack, labStruckTarget,
  labAuthorOf, labInitials, labAuthorName, labChainOf, labPublishRound,
  labAuthorPillHtml, labStackTrailHtml, labTagHtml, labRedlineAttributedHtml,
  labCaptureSel, labClearSel,
  labFileChange, labSendChange, labDecide, labResolveLinked,
  labTagChange, labUntagChange,
  labBaseline, labClausesOf, labTopics, labSeed,
  renderDocLab, wireDocLab
});
