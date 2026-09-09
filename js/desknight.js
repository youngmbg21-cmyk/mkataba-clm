/* ============================================================
   THE OVERNIGHT DESK (idea 19, owner-ruled 9 Sep 2026 — three kinds)
   ============================================================
   *"HaTi prepares work overnight and you review it in the morning ... Every row
   is a proposal with Review and Discard. Nothing files or sends without a
   person — it is a stack of drafts, not a robot."*

   THE FIVE KINDS IN THE DRAWING BECAME THREE, owner-ruled, and the two that
   went are the two that were already somewhere: briefs for unread contracts are
   the Copilot coverage tile on this same page, and an obligation nobody owns is
   what the Insights obligations tab is built to report. What survives is the
   three where SOMETHING OUTSIDE THE BUILDING IS AFFECTED AND A CLOCK IS
   RUNNING — a renewal closing, a promise they are late on, and paper they sent
   that nobody has read.

   THREE KINDS, NOT THREE ROWS, and the difference is the whole reason it is
   safe to show three. Ranked as one flat list of the best three, a quiet kind
   loses every single morning: a renewal 43 days out and a supplier four days
   late will always outrank the third thing, so it would never draw at all.
   deskShown takes AT MOST ONE OF EACH, so every kind that has something is on
   screen and nothing can be crowded out.

   ---- IT IS A READING. NO STORE, NO ROUTE, NO SWEEP, NO SPEND. ----
   Every qualifying test below is deterministic and answers off the record this
   browser already holds — which is the caller's own folder-scoped bootstrap, so
   the scope holds by construction and there is no second copy of it to keep in
   step. f274 greps this file for api(), fetch( and ai/: there must never be a
   route, because how far behind a company is on its own promises is that
   workspace's business.

   WHAT IS DELIBERATELY NOT BUILT, and it is the half the owner has not ruled
   on: HaTi does not WRITE the renewal memo while nobody is watching. That is
   the one preparation here that would cost a Copilot call with no person behind
   it, and this codebase's own rule is that a metered call naming nobody is
   spending that counts against nobody. So the renewal row carries the facts
   HaTi is certain of — the decision date, the notice period it read out of the
   wording, and the deviations already found on the current paper — plus the
   memo where one is already on the record, and Review opens the card where the
   memo is written on a real person's press. The drafted amendment in the
   approved drawing is not built either, and for the same reason.

   ---- ONE DOOR (owner-asked, and it is why this file exists rather than a
   fourth branch inside Home) ----
   A renewal inside 90 days is ALREADY a row in "Needs your decision", at
   exactly this window. Drawn naively the same contract would say the same thing
   twice, twelve pixels apart. So a contract the desk has prepared something for
   leaves that list: js/views/home.js filters the renewal source by deskCids,
   and only that source, because a colleague waiting on your review is a
   different subject that happens to share a contract.

   ITS OWN FILE, for the reason js/triage.js, js/precedent.js, js/payterms.js
   and js/standards.js all have one: two surfaces read it, and written inside
   either the other would reach it through window on a stage that does not carry
   that view, get undefined, and quietly count zero — the rlPaperFootHtml
   family, which fails in silence with a plausible fallback. */

/* The three kinds, in the order they read. WHAT NEEDS YOU FIRST, WHAT A DATE
   DID BY ITSELF LAST — the alerts panel's own ordering, so the two surfaces
   cannot disagree about what is urgent. A late promise has somebody waiting on
   the far side of it; paper that arrived has been read and nobody has looked;
   a renewal date knows nobody's name. */
const DESK_KINDS = ['chase', 'deviations', 'renewal'];

/* HOW LATE BEFORE A CHASE IS OFFERED. One day, not nought: an obligation due
   today is not late, and offering to chase somebody on the morning of their
   own deadline is the product being rude on the customer's behalf. */
const DESK_CHASE_LATE = 1;

/* ---- DISMISSING A ROW ----
   c.desk is a map from ROW KEY to the day it was put away, and it is ABSENT on
   every record already on file — which is the whole migration story. One shape
   for all three kinds: the key is the kind, or the kind and the obligation
   where a contract can carry several.

   DISMISSED IS DISMISSED. A row put away does not come back tomorrow, because
   the desk's promise is that it is a stack of things prepared ONCE, not a
   queue that nags. Nothing is lost by putting one away: the renewal is still in
   "Needs your decision" and on the Calendar, the late promise is still on the
   Obligations worklist, and the deviations are still on the contract's own
   page. */
const deskKeyOf = it => (it && it.ob) ? (it.kind + ':' + it.ob.id) : (it && it.kind) || '';
const deskDismissed = (c, key) => !!(c && c.desk && c.desk[key]);

function deskDismiss(c, key){
  if(!c || !key) return false;
  if(typeof canEdit === 'function' && !canEdit()) return false;
  if(!c.desk || typeof c.desk !== 'object') c.desk = {};
  if(c.desk[key]) return false;
  c.desk[key] = (typeof nowISO === 'function') ? nowISO() : new Date().toISOString();
  if(typeof persist === 'function') persist(c);
  return true;
}

/* THE BOOK THE DESK READS, and it is the live one. An archived or declined
   contract is one nobody is going to act on, so preparing work about it is
   furniture — the same exclusion triageCards and every count on this page
   already make. */
function deskLive(list){
  const cs = Array.isArray(list) ? list
    : ((typeof window !== 'undefined' && window.state && Array.isArray(state.contracts)) ? state.contracts : []);
  return cs.filter(c => c && !c.archived && c.status !== 'Declined');
}

/* ---- THE THREE READINGS ----
   COUNTING IS NOT DRAWING (the Insights panels' rule): this returns plain data
   and not one character of markup. js/views/home.js draws it and works nothing
   out, so the desk and the screens each row leads to cannot come to disagree
   about what was found. */
function deskItems(list){
  const cs = deskLive(list);
  const out = [];
  const dU = d => (typeof daysUntil === 'function') ? daysUntil(d) : null;

  for(const c of cs){
    /* ---- 1. A PROMISE THEY ARE LATE ON, WITH THE CHASE READY ----
       THEIRS ONLY, which is the chase route's own refusal rather than a second
       opinion: chasing is what you do about a duty on the other side, and ours
       is work rather than a message. Not one already chased — the record says
       somebody has knocked, and knocking again the next morning is the product
       nagging on the customer's behalf. Not one held back by a step before it
       in a payment chain, because nobody could have done it yet. */
    for(const o of (Array.isArray(c.obligations) ? c.obligations : [])){
      if(!o || o.chasedAt) continue;
      if(typeof obligationIsTheirs === 'function' && !obligationIsTheirs(o)) continue;
      if(typeof obState === 'function' ? obState(o) !== 'overdue' : true) continue;
      if(typeof obligationBlocked === 'function' && obligationBlocked(c, o)) continue;
      const due = (typeof obligationDue === 'function') ? obligationDue(o) : (o.due || null);
      const late = due ? -(dU(due) || 0) : 0;
      if(!(late >= DESK_CHASE_LATE)) continue;
      const it = { kind:'chase', cid:c.id, c, ob:o, days:late, urgent:true,
        who: c.counterparty || '', what: o.desc || '',
        /* NOWHERE TO WRITE IS A FACT THE ROW CARRIES, not a refusal it
           discovers after the press. The route reads the address off the
           stored contract and answers plainly where there is none; saying so
           here is the same fact, before somebody presses Send. */
        noAddress: !/.+@.+\..+/.test(String(c.counterpartyEmail || '').trim()) };
      it.key = deskKeyOf(it);
      if(!deskDismissed(c, it.key)) out.push(it);
    }

    /* ---- 2. PAPER THEY SENT, READ, AND NOBODY HAS LOOKED ----
       This is not auto-triage's card coming back to Home — that card is four
       tiles and lives on the contract, owner-ruled, and this is ONE row saying
       a contract arrived with something in it and pressing it goes there. It
       exists because of the gap that ruling left: upload a contract, walk away,
       and nothing ever mentions it again.

       IT QUALIFIES ONLY WHERE NOBODY HAS LOOKED, so acknowledging the strip on
       the contract clears this too — one fact, two ways to say yes — and it can
       never be a second copy of a card somebody has already read. */
    const t = (typeof triageOf === 'function') ? triageOf(c) : null;
    const pb = t && t.steps && t.steps.playbook;
    if(pb && pb.ok){
      const n = (pb.dev || 0) + (pb.miss || 0);
      const seen = (typeof triageSeen === 'function') ? triageSeen(c) : false;
      const it = { kind:'deviations', cid:c.id, c, n, urgent:false,
        who: c.counterparty || '', cats: Array.isArray(pb.cats) ? pb.cats : [],
        at: t.at || '' };
      it.key = deskKeyOf(it);
      if(n > 0 && !seen && !deskDismissed(c, it.key)) out.push(it);
    }

    /* ---- 3. A RENEWAL DECISION CLOSING ----
       renewalWindow is the product's ONE reading of this and carries every
       refusal with it — an amendment never renews itself, a draft is not up for
       renewal, only an agreement actually in force is, and a deadline older
       than the record is reported as predating rather than as a miss. A second
       copy of any of that here is how the desk and the renewal card would come
       to disagree about the same contract. */
    const w = (typeof renewalWindow === 'function') ? renewalWindow(c) : null;
    if(w && w.inWindow){
      const prep = c._renewalPrep
        || ((c._renewalAdvice && c._renewalAdvice.data) ? (c._renewalAdvice.overnight ? 'night' : 'you') : '');
      const it = { kind:'renewal', cid:c.id, c, days:w.days, w,
        urgent: w.missed || w.days <= 30, who: c.counterparty || '',
        /* WHAT IS ALREADY PREPARED, and each is a fact on the record rather
           than a promise: the memo where one has been written, and the
           deviations where the paper has been checked. Absent, the row says
           nothing about them — it never claims a reading that has not
           happened.

           AND IT SAYS WHO WROTE THE NOTE. `prepared` is true only where HaTi
           wrote it unprompted, which since 9 Sep 2026 it does for a contract
           that has an owner to charge the Copilot call to. A note waiting for
           you and a note you asked for are different facts, so the row states
           which rather than printing one sentence over both.

           THE LIGHT LIST'S WORD IS ASKED FIRST. `_renewalPrep` is that word
           ('night' | 'you'); `_renewalAdvice` is the whole memo and rides only
           a single contract's own GET. Home reads the light list, so built on
           the memo alone this line was right in local mode and could never draw
           in server mode — the recorded defect class (the dashboard's
           raised-by-me, Reports' cycle time). */
        memo: !!prep, prepared: prep === 'night',
        flags: (pb && pb.ok) ? ((pb.dev || 0) + (pb.miss || 0)) : null };
      it.key = deskKeyOf(it);
      if(!deskDismissed(c, it.key)) out.push(it);
    }
  }

  /* WITHIN A KIND, THE ONE THAT MATTERS MOST LEADS: the latest promise, the
     most findings, the soonest decision. Ties keep the book's own order, which
     is a stable sort in every browser this runs in. */
  /* THE ORDER IS DESK_KINDS' OWN, read rather than restated. Written out here
     as a second table it would be two statements of one order, and the day a
     kind is added or moved they would disagree about which leads. */
  const rank = k => DESK_KINDS.indexOf(k);
  return out.sort((a, b) => {
    if(a.kind !== b.kind) return rank(a.kind) - rank(b.kind);
    if(a.kind === 'chase') return (b.days || 0) - (a.days || 0);
    if(a.kind === 'deviations') return (b.n || 0) - (a.n || 0);
    return (a.days || 0) - (b.days || 0);
  });
}

/* ---- WHAT IS ON SCREEN: AT MOST ONE OF EACH KIND ----
   Three things, which is what was asked for, and the cap is what makes them
   READ rather than skimmed. A flat top-three would let one kind take all three
   places; one of each cannot. */
function deskShown(items){
  const seen = new Set(), out = [];
  for(const it of (items || [])){
    if(seen.has(it.kind)) continue;
    seen.add(it.kind); out.push(it);
  }
  return out;
}

/* THE CONTRACTS THE DESK HAS PREPARED SOMETHING FOR — the one-door reading,
   asked by Home so a contract cannot be listed twice on one page. It reads the
   WHOLE list rather than the shown three: a renewal held back by the cap is
   still one the desk is going to offer, and dropping it from both places would
   lose it altogether. */
function deskCids(items){
  const s = new Set();
  for(const it of (items || [])) if(it.kind === 'renewal') s.add(it.cid);
  return s;
}

Object.assign(window, { DESK_KINDS, DESK_CHASE_LATE, deskKeyOf, deskDismissed, deskDismiss,
  deskLive, deskItems, deskShown, deskCids });
