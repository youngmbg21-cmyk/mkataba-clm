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
   (24 Sep 2026: "Needs your decision" LEFT HOME on the owner's word, so the
   eviction below has no list to act on there; deskCids stays published and
   tested. The reasoning is kept because it is why the rule was right.)
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
/* ---- A FOURTH KIND, AND IT LEADS (S6, 16 Sep 2026) ----
   A notice that is drafted and ready to serve outranks a chase and a memo,
   because it is the only one of the four where DOING NOTHING renews an
   agreement for another year. THE CEILING OF THREE IS UNCHANGED: it competes
   for a place rather than adding one — deskShown still takes at most one of
   each and still stops at three. */
const DESK_KINDS = ['notice', 'chase', 'deviations', 'renewal'];

/* HOW LATE BEFORE A CHASE IS OFFERED. One day, not nought: an obligation due
   today is not late, and offering to chase somebody on the morning of their
   own deadline is the product being rude on the customer's behalf. */
const DESK_CHASE_LATE = 1;

/* ---- DISMISSING A ROW ----
   c.desk is a map from ROW KEY to the put-away, and it is ABSENT on every
   record already on file — which is the whole migration story. One shape for
   every kind: the key is the kind, or the kind and the obligation where a
   contract can carry several. Since 27 Sep 2026 the value says what was put
   away as well as when (`{ at, on }` — see A PUT-AWAY BELONGS TO THE SUBJECT
   IT PUT AWAY, below); a value written before then is a bare moment, and it
   is read by its date.

   DISMISSED IS DISMISSED — for the subject it was about. A row put away does
   not come back tomorrow, because the desk's promise is that it is a stack of
   things prepared ONCE, not a queue that nags. Nothing is lost by putting one
   away: the renewal is still in "Needs your decision" (since 24 Sep 2026: on
   the Map) and on the Calendar, the late promise is still on the
   Obligations worklist, and the deviations are still on the contract's own
   page. */
const deskKeyOf = it => (it && it.ob) ? (it.kind + ':' + it.ob.id) : (it && it.kind) || '';

/* ---- A PUT-AWAY BELONGS TO THE SUBJECT IT PUT AWAY (27 Sep 2026) ----
   Young: "Once you put an item away on 'Prepared for you', it never comes
   back, even for the same contract's renewal next year." The stamp was a
   bare moment filed under the row's KEY, and the key names the KIND —
   'renewal' — never WHICH renewal. So a renewal put away this June was put
   away for every June after it, on a contract that was still running, and
   the same was true of a letter, a fresh reading and a moved deadline.

   THE STAMP NOW SAYS WHAT IT WAS ABOUT — `{ at, on }` — and it holds only
   while the subject is still the same one. The subject is each kind's own
   deadline or reading, read through the reading that already decides it and
   never a second copy of that rule:
   - A RENEWAL AND A NOTICE are about one renewal question: the expiry and
     the notice period, renewalQuestionOf's own shape. That is exactly what a
     recorded renewal DECISION is stamped against — a decision lapses when the
     question moves — and putting a row away is the weaker act of the two, so
     it may not outlive the stronger one. The notice is on the same question
     because it is the letter that answers it.
   - PAPER THEY SENT is about one reading: triage's own `at`. A fresh reading
     of new wording is new work, and it is a new row.
   - A LATE PROMISE is about one due date. Its obligation is already named in
     the key, and a repeating duty opens each next instance under a new id
     (obligationNextInstance), so the date is what tells a MOVED deadline from
     the one that was put away.
   Where a subject cannot be read (no expiry, no reading, no date), it is ''
   and it matches '' — which is the old behaviour, exactly.

   DISMISSED IS DISMISSED — for that subject. The desk is still a stack
   prepared once rather than a queue that nags: nothing comes back tomorrow
   because a day passed, only because the thing it was about has changed. */
function deskSubjectOf(c, key){
  const k = String(key || '');
  const cut = k.indexOf(':');
  const kind = cut < 0 ? k : k.slice(0, cut);
  if(kind === 'renewal' || kind === 'notice'){
    const q = (typeof renewalQuestionOf === 'function') ? renewalQuestionOf(c) : null;
    return (q && q.expiry) ? (q.expiry + '|' + q.notice) : '';
  }
  if(kind === 'deviations'){
    const t = (typeof triageOf === 'function') ? triageOf(c) : null;
    return String((t && t.at) || '');
  }
  if(kind === 'chase'){
    const id = cut < 0 ? '' : k.slice(cut + 1);
    const o = (Array.isArray(c && c.obligations) ? c.obligations : []).find(x => x && String(x.id) === id);
    const due = o ? ((typeof obligationDue === 'function') ? obligationDue(o) : (o.due || '')) : '';
    return String(due || '');
  }
  return '';
}

/* ---- A STAMP WRITTEN BEFORE 27 SEP 2026 IS A BARE MOMENT ----
   Every one already on file says WHEN it was put away and nothing about
   what it was about, and there is no migration: it is read by its date. A
   row can only be put away while it is on screen, so a stamp made before
   this subject's row could first be drawn belongs to an EARLIER one:
   - a renewal or a notice is drawn from the day its window opens,
     RENEWAL_WINDOW_DAYS before the decision date (renewalWindow's own
     arithmetic, which counts to local midnight);
   - paper they sent is drawn from the moment it was read;
   - a late promise is drawn from the day after it fell due (DESK_CHASE_LATE).
   A stamp made on or after that moment is honoured — the safe direction for
   something the reader cleared this time round, and it only mis-reads the
   rare deadline moved WITHIN a window, where the row stays away. One made
   before it is last cycle's, and no longer holds. A moment that cannot be
   read, or a subject with no date to count from, is honoured exactly as it
   always was. */
function deskStampHolds(c, key, stamp){
  const t = Date.parse(String(stamp || ''));
  if(Number.isNaN(t)) return true;
  const k = String(key || '');
  const cut = k.indexOf(':');
  const kind = cut < 0 ? k : k.slice(0, cut);
  const midnight = (iso, plus) => {
    const d = new Date(String(iso) + 'T00:00:00');
    if(Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + plus);
    return d.getTime();
  };
  let from = null;
  if(kind === 'renewal' || kind === 'notice'){
    const by = (typeof renewalDecisionDate === 'function') ? renewalDecisionDate(c) : null;
    const span = (typeof RENEWAL_WINDOW_DAYS === 'number') ? RENEWAL_WINDOW_DAYS : 90;
    if(by) from = midnight(by, -span);
  } else if(kind === 'deviations'){
    const t0 = (typeof triageOf === 'function') ? triageOf(c) : null;
    const read = Date.parse(String((t0 && t0.at) || ''));
    if(!Number.isNaN(read)) from = read;
  } else if(kind === 'chase'){
    const due = deskSubjectOf(c, k);
    if(due) from = midnight(due, DESK_CHASE_LATE);
  }
  return from == null || t >= from;
}

function deskDismissed(c, key){
  const v = (c && c.desk && key) ? c.desk[key] : null;
  if(!v) return false;
  if(typeof v === 'object') return String(v.on == null ? '' : v.on) === deskSubjectOf(c, key);
  return deskStampHolds(c, key, v);
}

/* THE ONE WRITER, and every door still calls it with (contract, key) —
   Home's Put away and Put away all, the Copilot's work page — so none of
   them learns what a subject is. A stamp that is still in force refuses a
   second press; one left over from an earlier subject is replaced. */
function deskDismiss(c, key){
  if(!c || !key) return false;
  if(typeof canEdit === 'function' && !canEdit()) return false;
  if(!c.desk || typeof c.desk !== 'object') c.desk = {};
  if(deskDismissed(c, key)) return false;
  c.desk[key] = { at: (typeof nowISO === 'function') ? nowISO() : new Date().toISOString(),
    on: deskSubjectOf(c, key) };
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
    /* THE OBLIGATION FIRST, THE CONTRACT SECOND — obligationBlocked(o, c),
       the order every other caller in the product uses (27 Sep 2026: Young,
       "fix the two problems you found"). This line read (c, o), so the reading
       looked for a payment-chain pointer ON THE CONTRACT, found none, and
       answered "not held" for every step: a late step whose earlier payment
       had not happened yet was offered for chasing on Home's desk and on the
       Copilot's work page. The guard existed and never once fired — the
       always-false costume of this codebase's commonest fault. */
    for(const o of (Array.isArray(c.obligations) ? c.obligations : [])){
      if(!o || o.chasedAt) continue;
      if(typeof obligationIsTheirs === 'function' && !obligationIsTheirs(o)) continue;
      if(typeof obState === 'function' ? obState(o) !== 'overdue' : true) continue;
      if(typeof obligationBlocked === 'function' && obligationBlocked(o, c)) continue;
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

    /* ---- 4. A NOTICE DRAFTED AND READY TO SERVE ----
       It qualifies only where the letter can actually be written — noticeDraft
       refuses rather than guesses, and a row offering a letter HaTi cannot
       compose would be a dead press. Read through `window` with a guard: this
       file draws on stages where js/notice.js is not loaded, and there the
       desk simply has three kinds, exactly as it did.

       ONLY WHILE THE DECISION IS STILL LIVE. Past the decision date the
       letter is still drafted (a late notice is often still worth sending)
       and the DIALOG says so, but the desk stops leading with it — a morning
       list is about what can still be changed today. */
    /* WHETHER THE LETTER IS READY AND WHETHER ITS ROW WAS PUT AWAY ARE TWO
       FACTS, and the renewal row below needs the first one (27 Sep 2026).
       It used to ask only whether a notice ROW had been pushed — and a row
       put away is never pushed — so see `noticeReady` there. */
    let noticeReady = false;
    if(typeof noticeDraft === 'function'){
      const nd = noticeDraft(c);
      if(nd && nd.ok && !nd.late && !nd.predatesRecord){
        noticeReady = true;
        const it = { kind:'notice', cid:c.id, c, days:nd.days, urgent:nd.days<=14,
          who:c.counterparty||'', noticeKind:nd.kind, by:nd.decideBy, ends:nd.expiry,
          notice:nd.notice };
        it.key = deskKeyOf(it);
        if(!deskDismissed(c, it.key)) out.push(it);
      }
    }

    /* ---- 3. A RENEWAL DECISION CLOSING ----
       renewalWindow is the product's ONE reading of this and carries every
       refusal with it — an amendment never renews itself, a draft is not up for
       renewal, only an agreement actually in force is, and a deadline older
       than the record is reported as predating rather than as a miss. A second
       copy of any of that here is how the desk and the renewal card would come
       to disagree about the same contract. */
    /* ---- ONE CONTRACT, ONE ROW ABOUT ITS RENEWAL DECISION (16 Sep 2026) ----
       The notice row and the renewal row are the same deadline said twice: one
       says the decision is closing, the other says the letter that acts on it
       is written. Drawn together they would put two rows about one contract on
       a desk of three, pushing a genuinely different kind off it — which is
       exactly the crowding deskShown exists to prevent.
       THE SHARPER ONE WINS, and it is the one carrying the act. */
    /* ---- AND PUTTING IT AWAY PUTS THE SUBJECT AWAY (27 Sep 2026) ----
       Young: "fix the two problems you found". This asked whether a notice
       row was IN `out`, and a notice put away is never pushed there — so
       pressing Put away on the letter brought the plain renewal row back in
       its place, about the very contract the reader had just cleared off the
       desk (Home's Prepared for you and the Copilot's work page both read
       this). The two rows are one subject, so:
       - the renewal row stands down wherever the letter is READY, drawn or
         put away — the sharper form wins even when it is not on screen;
       - and wherever the letter was PUT AWAY at all, even once it has stopped
         being ready (its decision date passing is exactly when the renewal
         row would otherwise walk back in). DISMISSED IS DISMISSED.
       Nothing is lost: the decision is still on the Map, the Calendar and
       the contract's own renewal card (and on Home's own list for the
       contract's owner), as for every row put away. The key is deskKeyOf's
       own, never a second spelling of it.
       AND ONLY FOR THIS RENEWAL (27 Sep 2026): deskDismissed asks whether the
       letter put away was about the SAME renewal question, so a letter put
       away last year stands nothing down this year. */
    const hasNotice = noticeReady || deskDismissed(c, deskKeyOf({ kind:'notice' }));
    const w = (typeof renewalWindow === 'function') ? renewalWindow(c) : null;
    /* A RENEWAL THAT HAS BEEN ANSWERED IS NOT WORK PREPARED FOR ANYBODY (16 Sep
       2026). The answer rides on renewalWindow for exactly this reason — the
       desk keeps no copy of the rule, it reads the same word the card does. */
    if(w && w.inWindow && !w.decided && !hasNotice){
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
/* ---- THE CEILING IS THREE, AND SINCE 16 SEP 2026 IT HAS TO SAY SO ----
   With three kinds, "at most one of each" and "at most three" were the same
   sentence and the cap never had to be written down. A fourth kind (the
   notice) separates them: without this number the desk would quietly grow to
   four rows, which is exactly the weight HaTi's Next Fifteen promises Home
   will not gain. The kinds compete for a place rather than adding one, and
   DESK_KINDS' own order is what decides which ones get in. */
const DESK_MAX = 3;
function deskShown(items){
  const seen = new Set(), out = [];
  for(const it of (items || [])){
    if(seen.has(it.kind)) continue;
    seen.add(it.kind); out.push(it);
    if(out.length >= DESK_MAX) break;
  }
  return out;
}

/* THE CONTRACTS THE DESK IS SHOWING — the one-door reading, asked by Home so a
   contract cannot be listed twice on one page.

   IT READS WHAT IS ON SCREEN, AND THAT REVERSES THIS FUNCTION'S FIRST RULE
   (Young reported it 9 Sep 2026, off the sub-line: "it says 2 of 9 but does it
   mean copilot prepared 9 in total and if so, where is the rest of the 9?").
   It was handed the WHOLE list, on the reasoning that a renewal held back by
   the cap "is still one the desk is going to offer". THE CONCLUSION DID NOT
   FOLLOW FROM THE PREMISE: the desk shows at most ONE renewal, so on a book
   with five due, one was on the desk and the other four were struck out of
   "Needs your decision" and appeared NOWHERE — Home showing LESS than before
   this feature existed, which is the fault the one-door rule exists to
   prevent, pointing the other way.

   So the CALLER decides what it names, and Home passes the rows it is actually
   drawing. The only cost is that a renewal moves out of the list below on the
   morning it is promoted to the desk, which is the whole point of promoting
   it. */
/* WHICH RENEWALS THE DESK HAS ALREADY TAKEN. Home strikes these out of "Needs
   your decision", so the same contract is never on both lists.
   THE NOTICE COUNTS TOO (16 Sep 2026): it is a row about that contract's
   renewal decision — the sharper form of it — so a reader who has the letter
   in front of them does not also need the decision repeated one section down.
   Left out, the two rows this change made mutually exclusive would each fail
   to evict and the contract would be on both lists again. */
function deskCids(items){
  const s = new Set();
  for(const it of (items || [])) if(it.kind === 'renewal' || it.kind === 'notice') s.add(it.cid);
  return s;
}

Object.assign(window, { DESK_KINDS, DESK_MAX, DESK_CHASE_LATE, deskKeyOf, deskSubjectOf, deskDismissed, deskDismiss,
  deskLive, deskItems, deskShown, deskCids });
