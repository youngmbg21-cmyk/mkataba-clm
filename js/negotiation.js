// HaTi — native in-app negotiation: the canonical change model.
// Globals are window-attached like every module (see components.js).
//
// THE PIVOT THIS MODULE EXISTS FOR
//
// Tracking a negotiation used to work cleanly only while the other side worked
// inside HaTi, and it fell apart the moment Word was involved. The split is
// gone: however a contract arrives — a built-in template, a customer's own
// template, or an uploaded .docx — once it is extracted into HaTi, every
// further round happens natively here. Word matters exactly once, to get a
// file's wording IN. It is never again the medium for tracking a change.
//
// WHAT A CHANGE IS, AND WHY IT IS NOT A ROUND
//
// js/versioning.js already models a proposal as a ROUND: one whole-document
// text pair (baseText → proposedText) whose divergences diffBlocks() segments
// into positional ids (b0, b1…). That is the right unit for "review what came
// back", and it stays. It is the wrong unit for a negotiation you can point at:
// b0 in round 3 is a different passage from b0 in round 2, so nothing about a
// block is quotable, addressable or hashable across rounds.
//
// A CHANGE is one CLAUSE's worth of divergence with a stable identity, anchored
// on a durable clause id that lives in the document itself (js/clausemodel.js).
//
// WHAT CHANGED IN THIS MODULE, AND WHY
//
// Four defects, each recorded in BUGLOG with its before-evidence:
//
//   1. Clause identity was fake. Clauses were found by flattening the rich
//      document to text and re-inferring headings with an all-caps heuristic;
//      the prototype's own six-clause contract came back as FOURTEEN nameless
//      fragments with line-index ids. Identity now comes from the DOM and is
//      ASSIGNED, not derived — see js/clausemodel.js.
//   2. Redlines were re-diffed at render time, so the same change could render
//      differently on different days. The ops are computed once, STORED on the
//      record, and rendered from storage — see js/redline.js.
//   3. The hash covered a change but nothing chained one change to the next.
//      Every hash issuance now carries prevChangeHash and verifyChangeChain()
//      recomputes the whole history from stored content.
//   4. Accepting a change round-tripped the document through plain text
//      (negoResolvedText → richFromTextEdit), which is the mechanism behind the
//      B-004 formatting-loss bug. Acceptance now edits the rich DOM by clause
//      id. There is no lossy step left to guard against.
//
// TWO RULES OUTRANK EVERY FEATURE HERE
//
//   1. Silence rejects. A change nobody decided is NOT in the document. The
//      opposite default — a clause quietly entering an agreement because
//      nobody looked at it — is unrecoverable once signed. So the working
//      document is BUILT from the accepted set rather than mutated in place,
//      and rejecting everything reproduces the baseline exactly. That is now
//      asserted at the canonicalRich level, not merely on a text projection.
//
//   2. Nobody rules on their own ask. Enforced in the model, not in the UI, so
//      no new caller can route around it.

/* ---------- clause reading ----------
   The negotiation reads clauses from js/clausemodel.js and nowhere else. There
   is deliberately no second segmentation in this file: the old one existed
   because the model could not read the document it was given, and having two
   answers to "what is a clause" is how a change comes to be filed against a
   passage nobody is looking at. */
const negoClauseLabel = cl => (window.clauseLabel ? clauseLabel(cl) : '');

/* The rich body a negotiation runs on. A contract that is already rich is used
   as it stands; a plain-text one is lifted to the same shape so that every
   intake path converges here — which is what makes the three paths produce one
   normalised document rather than three that merely look alike. */
function negoBodyOf(c){
  if (window.isRich && isRich(c.format) && c.redlineText) return c.redlineText;
  const text = (window.docPlainText ? docPlainText(c) : '') || '';
  return text.trim() ? negoRichFromLines(text) : '';
}
/* The clauses of the round's baseline — what this round's proposals are
   measured against. */
function negoClauseList(c){
  negoInit(c);
  return window.clauseSegment ? clauseSegment(c.negotiation.baselineBody || '') : [];
}
/* ---------- THE FRONT MATTER IS A REGION, NOT A CLAUSE ----------
   (owner-ruled 28 Aug 2026: "editable, recorded as a document change".)
   The title, the kicker above it and the recital under it are the agreement's
   own words and are argued over on real paper, so they are addressable by the
   change model under one reserved id — see CLAUSE_FRONT_ID in js/clausemodel.js
   for why that id can never collide with a document's own.

   IT IS NOT IN negoClauseList AND MUST NOT BE. Every count, the round queue,
   the numbering and the clause index read that list, and a reader must never be
   asked to decide "clause 0". Only the region's own pencil reaches it. */
const negoFrontId = () => (typeof window !== 'undefined' && window.CLAUSE_FRONT_ID) || 'front';
const negoIsFrontId = id => String(id || '') === negoFrontId();
function negoFrontClause(c){
  negoInit(c);
  if (!window.clauseFrontClause) return null;
  try{ return clauseFrontClause(c.negotiation.baselineBody || ''); }catch(_){ return null; }
}
const negoClauseById = (c, id) => (negoIsFrontId(id)
  ? negoFrontClause(c)
  : negoClauseList(c).find(cl => cl.clauseId === id) || null);

/* ---------- THE CLAUSE AS THE PERSON TYPING IS SHOWN IT ----------
   negoClauseList above is the ROUND BASELINE, and it is the right reading for
   anything asking "what did this round start from". It is the WRONG reading
   for the moment somebody edits a clause that has already had a change adopted
   on it, and that mismatch was a reported fault (Young, 15 Aug 2026, MK-311).

   A clause with an adopted change does not read like the baseline any more.
   The document on screen shows the adopted wording, the editor is seeded from
   the document, so a second edit typed into it is an edit of THAT text — and
   measuring it against the baseline anyway produced a diff that re-expressed
   the adopted change as though the author had just made it. Two things fell
   out of that, both visible:

     · The card struck through words nobody had touched — the reported
       screenshot shows exactly this on the new ask's preview.
     · Two accepted changes on one clause could not be told apart from two
       RIVAL proposals for the same words, so negoResolve's guard refused the
       second, in words, on an ordinary act. That refusal is what was reported.

   So a change is measured against what its author was shown. WHERE NOTHING IS
   ADOPTED THE TWO READINGS ARE THE SAME TEXT — which is every clause on every
   contract in its first round, and is why no stored change moves, no
   fingerprint changes and no migration is needed. The cost is paid only on the
   clause that has actually moved under the author's feet.

   The baseline reading is NOT replaced. negoClauseList still answers for the
   round, and negoBuildBody still replays from it. */
function negoClauseNowById(c, clauseId){
  negoInit(c);
  const base = negoClauseById(c, clauseId);
  if (!window.clauseSegment) return base;
  /* Asked before the work is done, not after. Rebuilding the resolved document
     for every edit on every clause would be a full replay to hand back the
     baseline it started from — and this runs on every keystroke-ending save. */
  const moved = (c.changes || []).some(x => x && x.clauseId === clauseId
    && x.status === 'accepted' && x.changeType === 'modify');
  if (!moved) return base;
  let now = null;
  try {
    const resolved = negoResolvedBody(c);
    now = negoIsFrontId(clauseId)
      ? (window.clauseFrontClause ? clauseFrontClause(resolved) : null)
      : (clauseSegment(resolved).find(cl => cl.clauseId === clauseId) || null);
  }
  catch (_){ now = null; }
  return now || base;
}
/* WHAT A CHANGE WAS MEASURED AGAINST, and whether two were measured against the
   same thing. `oldText` has always carried this; until negoClauseNowById above
   it was the round baseline for every change on a clause and therefore said
   nothing. It now separates the two states negoResolve has to tell apart:

     · SAME measured-from text  → the two are RIVALS. Both replay from one
       starting point, so accepting both would let the second silently discard
       the first. This is the state the accept guard exists for.
     · DIFFERENT               → the later one was written on top of the
       earlier, so accepting both is sequential composition — how negotiation
       works — and negoBuildBody's replacement in seq order already produces
       exactly the right wording, because the later body contains the earlier.

   Legacy changes, filed before this existed, all carry the baseline and so all
   compare EQUAL — which keeps the guard exactly as strict as it was for every
   contract already on the table. Nothing is loosened retrospectively. */
const negoMeasuredFrom = ch => String((ch && ch.oldText) == null ? '' : ch.oldText);
const negoMeasuredAlike = (a, b) => negoMeasuredFrom(a) === negoMeasuredFrom(b);

/* ---------- DID THIS CHANGE MOVE THE WORDS? ----------
   Three kinds of ask now file all-keep ops: a formatting-only edit, a heading
   rename, and the two together. A renderer that drew any of them from the ops
   would redraw the clause as its TEXT PROJECTION — flattening the lists,
   emphasis and sub-paragraphs of a clause whose wording nobody touched — so
   both document renderers ask this before they reach for the ops.

   Named once and published, because the two canvases have to agree about it:
   this rulebook's own rule is that the DRAWING may differ between surfaces and
   the READING never may. */
const negoWordsMoved = ch => !!(ch && Array.isArray(ch.ops)
  && ch.ops.some(o => o && o.op !== 'keep'));

/* ---------- WHAT HEADING A CHANGE PROPOSES (owner-asked 28 Aug 2026) ----------
   A clause's heading is part of the document — a contract is cited by those
   strings — so proposing “Charges” where it says “Payment Terms” is a tracked
   change like any other. It rides on the change record's `headingText`, the
   field insertClause has always carried, and NULL means the ask says nothing
   about the heading at all.

   ONE READING, so the paper, the room, the card and the panel cannot come to
   disagree about whether a heading moved. It answers null where the proposed
   heading is the one the clause already carries, which is what makes typing
   the original back a real revision rather than a stale rename left behind. */
function negoHeadingAsk(cl, ch){
  if (!ch || ch.changeType !== 'modify') return null;
  const to = String(ch.headingText == null ? '' : ch.headingText).trim();
  if (!to) return null;
  const from = String((cl && cl.headingText) || '').trim();
  return to === from ? null : { from, to };
}
/* The heading the clause stands with — what a rename is measured against, and
   the same reading the wording itself is measured against (negoClauseNowById:
   baseline plus whatever is adopted on it). */
function negoStandingHeading(c, clauseId){
  const cl = negoClauseNowById(c, clauseId);
  return String((cl && cl.headingText) || '').trim();
}

/* ---------- IS THIS CONTRACT EXECUTED ----------
   One predicate, named, because the answer decides three different things and
   was written out longhand at each of them. An executed record takes no new
   decisions, however it came to be executed — so the test is not `status ===
   'Signed'`. A contract carrying a seal (`hash`) or an execution stamp
   (`execution.at`) is executed whatever its status field says, and reducing
   this to the status alone is exactly the narrowing the signed door in
   negoResolve was written to prevent. */
function negoExecuted(c){
  return !!(c && (c.status === 'Signed' || c.hash || (c.execution && c.execution.at)));
}
/* ---------- WHEN WAS THIS SIGNED — ONE READING (J-5.1) ----------
   IT LIVES HERE, BESIDE negoExecuted, AND THAT IS DELIBERATE. That predicate
   asks the sibling question — HAS this been signed — off the same two stores,
   and this file is on every stage the change model is on. Written in core.js
   it would be a name half the product reaches through `window` on a stage that
   does not carry it, and every caller would fall back to the broken arithmetic
   this repair exists to remove: the rlPaperFootHtml class, in its quietest
   costume. Callers outside this module read it through `window` and fall back
   to NULL, never to a guess.
   `c.signedAt` used to be written by signDocument as fmtDT(at)+' EAT' — the
   words a reader saw, in the reader's own LANGUAGE. That is fine while
   something only ever prints it and fatal the moment anything does arithmetic
   with it, and six things did: the Contracts-signed chart (which returned 0
   for every month), a project's start date, an amendment family's effective
   date, duplicate detection, the server's own copy of the same reading, and —
   worst — the evidence pack, whose exported seal time depended on who pressed
   the button. Measured: slice(0,10) of it is "12 Aug 202", read as a date that
   is the year 202, and in Swedish it is "12 aug. 20".

   THE DAY IS ASKED IN THE SIGNER'S OWN CLOCK, not in UTC. A signing at 01:00
   EAT is 22:00 UTC the previous day, and answering with the UTC day would put
   a contract in the wrong month — the fault the calendar's own `calToday()`
   records. The offset is RECORDED at signing (execution.tzOffsetMin) rather
   than reverse-engineered afterwards.

   FOUR SOURCES, IN THIS ORDER, and every one of them is a fact somebody wrote
   down rather than a guess:
     1  a plain day somebody recorded — paper filing's signedOn, a migration
        manifest's date. It IS the day the parties signed and outranks the day
        the file reached us.
     2  the execution stamp, moved into the signer's own clock.
     3  a display string written before this was a date. Its own words carry
        the local day, which is why this reads the WORDS rather than parsing.
     4  the first `Signed` entry in the audit trail (and `_signedAt`, the
        server's transport field for a light list row).
   Returns an ISO day or null. NEVER a guess: a record that says nothing about
   when it was signed answers null, and every caller draws an em-dash. */
const SIGNED_MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const SIGNED_MONTHS_SV = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
const _sdPlainDay = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s==null?'':s).trim())
  ? String(s).trim().slice(0,10) : null;
/* An ISO instant plus an offset in minutes, as the day it was in that clock. */
function _sdDayAt(iso, offMin){
  const t = Date.parse(String(iso==null?'':iso));
  if(!Number.isFinite(t)) return null;
  const off = Number(offMin);
  return new Date(t + (Number.isFinite(off)?off:0)*60000).toISOString().slice(0,10);
}
/* "12 Aug 2026, 10:00 EAT" / "12 aug. 2026 10:00 EAT" — the local wall clock,
   which is exactly the day we want, so it is read rather than parsed. */
function _sdLegacyDay(s){
  const m = /^(\d{1,2})\s+([^\s.,]{3,})\.?\s+(\d{4})/.exec(String(s==null?'':s).trim());
  if(!m) return null;
  const k = m[2].slice(0,3).toLowerCase();
  const i = SIGNED_MONTHS.indexOf(k) >= 0 ? SIGNED_MONTHS.indexOf(k) : SIGNED_MONTHS_SV.indexOf(k);
  if(i < 0) return null;
  const d = Number(m[1]);
  if(!(d >= 1 && d <= 31)) return null;
  return `${m[3]}-${String(i+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function contractSignedAt(c){
  if(!c) return null;
  const ex = c.execution || null;
  const plain = _sdPlainDay(ex && ex.signedOn) || _sdPlainDay(c.signedAt);
  if(plain) return plain;
  const stamped = _sdDayAt(ex && ex.at, ex && ex.tzOffsetMin);
  if(stamped) return stamped;
  const legacy = _sdLegacyDay(c.signedAt);
  if(legacy) return legacy;
  const trail = Array.isArray(c.audit) ? c.audit : [];
  const e = trail.find(a => a && a.action === 'Signed');
  return _sdDayAt(e && e.at, 0) || _sdDayAt(c._signedAt, 0) || _sdDayAt(c.signedAt, 0) || null;
}
Object.assign(window,{contractSignedAt,SIGNED_MONTHS,SIGNED_MONTHS_SV});

/* ---- AND THE WORDING FREEZES AT THE FIRST SIGNATURE (owner-ruled 14 Aug 2026) ----
   negoExecuted is true when the LAST signer has signed and the seal is taken.
   On a route with more than one signer there is a window between the first
   mark and that moment, and in it the wording could still be changed — so the
   first signer's name ended up on a document they had not seen. What they
   signed is what they were shown; a contract that moves underneath a signature
   is not the contract that was signed.

   ONE PREDICATE, TWO SIGNALS, matching signingLocked in js/approvals.js — which
   already reads both stores for the ROUTE, and for the same reason: a
   counterparty's mark reaches c.signatures only when the owner's browser
   applies it, while an internal signer's lands on the plan row. Reading one
   alone leaves the other half of the window open.

   This is the wording lock ONLY. Numbering, obligations, the audit trail and
   the signature-taking itself are unaffected — the point is that the words
   stop moving, not that the contract stops working. */
function negoAnySignature(c){
  if (!c) return false;
  if (Array.isArray(c.signatures) && c.signatures.length) return true;
  return (Array.isArray(c.signerPlan) ? c.signerPlan : []).some(s => s && s.signed);
}
const negoWordingFrozen = c => negoExecuted(c) || negoAnySignature(c);

/* ---------- THE NUMBERING OF AN EXECUTED CONTRACT IS FINAL ----------
   The same predicate under the name that says WHY it is being asked, because
   this is a different rule from the wording lock even though today they turn on
   the same fact.

   Sealed WORDING must not change because the seal binds it. Sealed NUMBERING
   must not change for a reason the seal knows nothing about: once a contract is
   executed its clause numbers are cited — by every amendment that varies it, by
   correspondence between the parties, and by anyone who ends up arguing about
   it in front of a judge. "Clause 9" in an amendment signed next year means the
   ninth clause of the document as executed, permanently. Tidying 1..8, 10..24
   into 1..23 on a signed agreement silently repoints every one of those
   citations, and does it invisibly, because the wording underneath is right.

   The renumbering action now exists (negoRenumberApply, N2) and asks this
   first — the gate was built and tested before its first caller, deliberately,
   so the caller could not be written without meeting it. Anything else that
   ever rewrites a clause number must ask it too. */
const negoNumberingLocked = c => negoExecuted(c);

/* ---------- HAS THE LIVE DOCUMENT WALKED AWAY FROM THE SEALED ONE ----------
   verifySeal (js/core.js) answers "is the frozen copy intact, and does it still
   hash to the seal". It has never asked the other question: does the wording
   this workspace SHOWS still match the wording that was signed. Those came
   apart the moment an edit could be filed after execution (MK-248) —
   negoCommitBody rewrote the live body while execution.html kept what was
   signed, and because the seal is computed over the frozen copy, verifySeal
   went on reporting the record valid. Nothing anywhere said the two disagreed,
   which makes this the quietest way the product could be wrong.

   REPORTED, NEVER REPAIRED. The obvious "fix" — copy the sealed wording back
   over the live body, or re-seal the live body — is the one thing this must
   never do. Both directions destroy evidence: the first throws away whatever
   was written after signature without anybody reading it, and the second
   quietly certifies wording the parties never signed. A divergence is a fact
   about the record; a human decides what it means.

   COMPARED AS TEXT, not as markup. The frozen copy is html and the live body
   may be text or rich, so a byte comparison would report every executed
   contract as diverged and the warning would mean nothing within a week.
   Reducing both to their words answers the question actually being asked: does
   it still SAY the same thing. Whitespace is normalised for the same reason — a
   reflow is not an edit. */
function negoExecutedText(s){
  const raw = String(s == null ? '' : s);
  const txt = (/<[a-z][\s\S]*>/i.test(raw) && window.richToText) ? richToText(raw) : raw;
  return txt.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}
function executedDivergence(c){
  if (!negoExecuted(c)) return null;
  /* An uploaded contract's evidence is the file itself, hashed at intake. There
     is no sealed HTML rendering to disagree with. */
  if (c && c.upload && (c.upload.fileHash || c.upload.fileId)) return null;
  const sealed = c && c.execution && c.execution.html;
  if (!sealed) return null;                      // nothing frozen to compare against
  const live = (c && (c.redlineText || c.body)) || '';
  if (!live) return null;
  const a = negoExecutedText(sealed), b = negoExecutedText(live);
  if (!a || !b || a === b) return null;
  return { diverged: true, sealedChars: a.length, liveChars: b.length,
    detail: 'The wording shown here is not the wording that was sealed at execution. '
      + 'Nothing has been changed either way — the sealed copy remains the evidence of record. '
      + 'Have someone compare the two before relying on this document.' };
}

/* ---------- GAPS THIS CONTRACT'S OWN DELETIONS LEFT ----------
   Accepting a deletion removes the clause and closes nothing up: a contract
   numbered 1..24 that loses clause 9 reads 1..8, 10..24 (clauseRemove, and the
   rule at the heading renderer that a number the file does not carry is never
   printed). That is the right behaviour and it stays. What was missing is that
   nothing SAID so, and a reader meeting 8 followed by 10 has no way to tell a
   deliberate deletion from a broken document.

   ATTRIBUTED, NEVER SCANNED. The gap is reported only where an accepted
   deleteClause accounts for it. A document that arrived numbered 1, 4, 5, 6, 9,
   12 — the prototype's own contract, and every uploaded extract shaped like it
   — raises nothing here, because we did not make those gaps and have no
   standing to call them faults. This is the whole reason clauseNumberGap
   answers about one number rather than scanning the run.

   IT TIMES ITSELF. An accepted deletion is struck through in the working pane
   and stays in the document until the round closes; only then does
   negoResolvedBody remove it and the baseline move. So `present` is true for
   the whole of that window and nothing is reported — the notice appears when
   the gap does, not when the decision is taken.

   Read from negoAllChanges rather than c.changes: closing the round is what
   creates the gap AND what archives the change that caused it, so the live set
   is empty of exactly the records this needs. */
function negoNumberingGaps(c){
  if (!c) return [];
  negoInit(c);
  const nums = negoClauseList(c).map(cl => cl.num).filter(Boolean);
  const parse = window.clauseParseHeading;
  const gapOf = window.clauseNumberGap;
  if (!parse || !gapOf) return [];
  /* A RECORDED RENUMBERING ANSWERS THE GAPS BEFORE IT. Attribution cuts both
     ways: a gap is reported because an accepted deletion accounts for it, and
     it STOPS being reported because a recorded renumbering (N2) closed the
     run back up — "Clause 9 was deleted and the numbering was not closed up"
     over a run that now reads 1..5 would be the notice lying about the one
     thing it exists to say. Compared by time, off the renumbering's own X3
     audit entry: a deletion decided AFTER the last renumbering opened a gap
     that act never saw, and it still reports. A trailing deletion — the run
     simply ending earlier — keeps reporting too, until a renumbering
     addresses it: the run shows no hole, but the deletion is real news and
     nothing has yet answered it. */
  const lastRenumber = (c.audit || [])
    .filter(a => a && a.data && a.data.kind === 'renumber')
    .map(a => String(a.at || '')).sort().slice(-1)[0] || '';
  const out = [];
  const seen = new Set();
  for (const ch of negoAllChanges(c)){
    if (!ch || ch.changeType !== 'deleteClause' || ch.status !== 'accepted') continue;
    /* The number comes back out of the stored label rather than from a field of
       its own, so this reads correctly on every change ever filed — including
       the ones written before anybody was asking this question. */
    const num = String(parse(ch.clauseLabel || '').num || '');
    if (!num || seen.has(num)) continue;
    if (lastRenumber && String(ch.resolvedAt || '') <= lastRenumber) continue;
    const gap = gapOf(nums, num);
    if (gap.present) continue;
    seen.add(num);
    out.push({ num, label: String(ch.clauseLabel || ''), changeId: ch.id || null,
      before: gap.before, after: gap.after });
  }
  return out.sort((a, b) => String(a.num).localeCompare(String(b.num), undefined, { numeric: true }));
}
/* ---------- REFERENCES THIS CONTRACT'S OWN DELETIONS BROKE ----------
   The same doctrine as negoNumberingGaps above, and for the same reason:
   ATTRIBUTED, NEVER SCANNED.

   A dangling reference on its own is not news. The prototype's contract is an
   extract numbered 1, 4, 5, 6, 9, 12, and an extract cites the parent agreement
   it was cut from — "subject to Clause 2" is a perfectly good sentence in a
   document that has no clause 2 and never did. Reporting every unresolved
   reference lights that document up with faults nobody can fix, and does the
   same to every uploaded contract shaped like it.

   What IS news is a reference whose target was deleted HERE, by an accepted
   deletion this record can point at. Then the document really has changed
   underneath the sentence, and somebody has to decide what the sentence should
   now say.

   REPORTED ON THE CLAUSE THAT CONTAINS THE REFERENCE, not on the deleted one.
   The deleted clause is gone; the surviving clause is the one with a problem in
   it, and it is the one a person has to open and revise.

   Read from negoAllChanges for the reason negoNumberingGaps gives: closing the
   round archives the very change that created the gap.

   ADVISORY. This names a problem. It never edits wording to fix one — repairing
   a reference changes what the contract means, and that is a drafting decision
   with a human's name on it. */
function negoBrokenRefs(c){
  if (!c) return [];
  negoInit(c);
  const resolve = window.clauseResolveRefs;
  const parse = window.clauseParseHeading;
  const norm = window.clauseRefNorm;
  if (!resolve || !parse || !norm) return [];
  const clauses = negoClauseList(c);

  /* The numbers whose clause an accepted deletion took out of this document. */
  const deleted = new Map();
  for (const ch of negoAllChanges(c)){
    if (!ch || ch.changeType !== 'deleteClause' || ch.status !== 'accepted') continue;
    const num = norm(parse(ch.clauseLabel || '').num || '');
    if (num && !deleted.has(num)) deleted.set(num, ch);
  }
  if (!deleted.size) return [];

  const byId = new Map(clauses.map(cl => [cl.clauseId, cl]));
  const out = [];
  const seen = new Set();
  for (const r of resolve(clauses)){
    if (r.state !== 'dangling') continue;
    const ch = deleted.get(r.num);
    if (!ch) continue;                      // dangling, but nothing here deleted it
    const key = r.fromClauseId + '→' + r.num;
    if (seen.has(key)) continue;
    seen.add(key);
    const from = byId.get(r.fromClauseId) || null;
    out.push({
      fromClauseId: r.fromClauseId,
      fromNum: r.fromNum || '',
      fromLabel: from ? (window.clauseLabel ? clauseLabel(from) : (from.headingText || '')) : '',
      num: r.num,
      text: r.text,
      deletedLabel: String(ch.clauseLabel || ''),
      changeId: ch.id || null,
    });
  }
  return out;
}

/* Every reference in the document with its resolution state — the on-demand
   whole-document check (N1-T5), as against the attributed warning above.
   Presented NEUTRALLY by its caller: on an extract, references out to the
   parent agreement are normal and must not be dressed up as faults. */
function negoAllRefs(c){
  if (!c) return [];
  negoInit(c);
  if (!window.clauseResolveRefs) return [];
  const clauses = negoClauseList(c);
  const byId = new Map(clauses.map(cl => [cl.clauseId, cl]));
  return clauseResolveRefs(clauses).map(r => {
    const from = byId.get(r.fromClauseId) || null;
    return { ...r,
      fromLabel: from ? (window.clauseLabel ? clauseLabel(from) : (from.headingText || '')) : '' };
  });
}

/* ---------- RENUMBERING, AS A RECORDED ACT (N2) ----------
   The computation lives in js/clausemodel.js (clauseRenumberPlan) and is pure;
   these three are the contract-shaped door in front of it: whether the door is
   open, what would happen, and the one write.

   WHEN THE DOOR IS OPEN — and this is the decided change-model treatment the
   work order asked for (N2-T4). Renumbering applies DIRECTLY, but only over a
   QUIET TABLE: never on an executed contract, and never while any live change
   is on the table. The quiet-table rule is not caution for its own sake —
   every filed change carries oldText measured against the current baseline and
   renders its redline from it, so rewriting the document underneath pending
   asks would detach every one of them from the wording it cites. Between
   rounds the table is empty by construction (negoAdvanceRound archives the
   decided set), which is exactly when the gap notice appears — the gap only
   opens when the round closes — so the primary flow is never blocked. The
   alternative treatment (filing each heading rename as a tracked change once a
   round has been sent) was considered and rejected: the change model has no
   heading-rename change type, and N headings filed as N fingerprints
   contradicts the order's own "one audit entry summarising the whole act".
   The counterparty is not cut out by this: the renumbered wording becomes the
   baseline their next round opens on, the version list records the act, and
   their standing link shows the result — a renumbering they object to is a
   renumbering they redline like any other wording.

   THE APPLY RECOMPUTES ITS OWN PLAN rather than trusting the one the preview
   showed. Same quiet table, same clauses, same answer — and a plan object
   cannot go stale in a pocket between the preview being painted and the
   button being pressed. */
/* ---------- LIVE NUMBERING (N3) ----------
   A contract born from a template carries `numbering:'live'`, and for it a
   deletion "renumbers" with zero manual steps. THE DECIDED IMPLEMENTATION —
   recorded here because it deliberately differs from the order's sketch of
   numbers-as-render-time-presentation: live numbering is AUTOMATIC
   RENUMBERING AT ROUND BOUNDARIES, through the N2 engine.

   Why not compute numbers at render? T2's own rule decided it: "a number
   computed in two places will eventually disagree in two places". The stored
   document is already the one numbering authority every surface reads — the
   room, the workbench, the Doc page, print, PDF, docx, the portal, the
   Copilot's context strings all render the stored headings — so keeping the
   numbers IN the stored text and closing them up through the one engine that
   already knows how (format-preserving, reference-repointing, id-stable,
   audited) means no surface ever formats its own number, because no surface
   formats a number at all. It also makes X2's freeze rule true by
   construction: the sealed copy, the view-link snapshot and the history
   export carry literal numbers because the document always does, and no
   later change to numbering code can move what a seal covers (N3-T5).

   WHY THE ROUND BOUNDARY (N3-T7): the gap only exists once the round closes
   (the struck-through clause leaves the baseline then), the table is empty
   there by construction (N2's quiet-table rule), and a sent round stays the
   fixed snapshot the counterparty reviewed — numbering shifts BETWEEN
   rounds, never under one.

   UPLOADS CAN NEVER ACQUIRE THIS, even by a crafted flag: the predicate
   refuses them, because an uploaded contract's numbers are the paper's own
   facts. Absence of the flag = literal numbering; nothing retro-converts. */
function negoLiveNumbered(c){
  if (!c || c.numbering !== 'live') return false;
  if (window.isUpload && isUpload(c)) return false;
  if (c.upload || c.source === 'upload') return false;
  return true;
}

function negoRenumberBlocked(c){
  if (!c) return 'locked';
  if (negoNumberingLocked(c)) return 'locked';
  negoInit(c);
  if (negoChanges(c).some(x => x && x.status !== 'superseded')) return 'table';
  return null;
}
/* The computation refuses on an executed contract — not only the UI. A caller
   that never renders a button can still not compute its way past the lock. */
function negoRenumberPlan(c){
  if (!c || negoNumberingLocked(c)) return null;
  if (!window.clauseRenumberPlan) return null;
  return clauseRenumberPlan(negoClauseList(c));
}
function negoRenumberApply(c, opts = {}){
  if (negoRenumberBlocked(c)) return null;
  const plan = negoRenumberPlan(c);
  if (!plan || !plan.changed) return null;
  const n = negoInit(c);
  let body = n.baselineBody;
  for (const h of plan.headings){
    const next = window.clauseReplaceHeading ? clauseReplaceHeading(body, h.clauseId, h.newHeading) : null;
    if (next != null) body = next;
  }
  for (const [id, bodyHtml] of Object.entries(plan.bodies || {})){
    const next = window.clauseReplaceBody ? clauseReplaceBody(body, id, bodyHtml) : null;
    if (next != null) body = next;
  }
  /* The baseline and the live document move together, through the same commit
     path every accepted change uses — two copies of the wording that could
     disagree about the numbering would be worse than the gap. */
  n.baselineBody = body;
  n.baselineText = window.richToText ? richToText(body) : '';
  negoCommitBody(c, body);
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  const moved = plan.headings.map(h => `${h.oldNum}→${h.newNum}`);
  const shown = moved.slice(0, 6).join(', ') + (moved.length > 6 ? ` and ${moved.length - 6} more` : '');
  /* X3: the structured half rides ON the audit entry, so the history timeline
     (WP-2.1) can render the act as a story beat without parsing prose. The
     prose half stays the record a human reads. */
  if (window.logAudit) logAudit(c, 'Renumbered',
    `Clauses renumbered ${opts.auto ? 'automatically — this contract numbers live (N3), so the round closing closed the numbering up' : 'by ' + who} — ${plan.headings.length} heading${plan.headings.length === 1 ? '' : 's'} (${shown})`
    + `; ${plan.refs.length} cross-reference${plan.refs.length === 1 ? '' : 's'} repointed to follow`
    + (plan.untouched.length ? `; ${plan.untouched.length} reference${plan.untouched.length === 1 ? '' : 's'} left untouched (unresolvable)` : '')
    + '. Every clause keeps its id; nothing beyond the numbers changed.',
    who,
    { kind: 'renumber',
      headings: plan.headings.map(h => ({ clauseId: h.clauseId, from: h.oldNum, to: h.newNum })),
      refs: plan.refs.map(r => ({ clauseId: r.clauseId, from: r.from, to: r.to })),
      untouched: plan.untouched.length });
  if (window.captureVersion) captureVersion(c,
    `Clauses renumbered — ${plan.headings.length} heading${plan.headings.length === 1 ? '' : 's'}`,
    who, { auto: true, listed: true });
  return plan;
}

/* ---------- THE NEGOTIATION HISTORY, AS A STORY (WP-2.1) ----------
   One chronological sequence assembled from the change record (live and
   archived rounds), the round closures, and the audit entries that mark acts
   a reader needs in the same story — signing beats (X6: link issued, signature
   recorded, seal, copies) and renumbering acts (X3, read from the entry's
   structured data, never parsed out of prose).

   X1 — LABELS AS OF THE EVENT. Every entry shows the clause label the change
   record STORED when the event happened (ch.clauseLabel), with the durable
   clause id carried underneath for filtering. Never a live lookup of today's
   number: N2 makes numbers movable, and a timeline that looked numbers up
   would silently rewrite its own story every time a document was tidied.

   FILTERS COMBINE, and they are applied here in the model so a test can hold
   them without a DOM: clauseId (the durable id, not the number), actor, side,
   round, outcome. */
function negoTimeline(c, f = {}){
  if (!c) return [];
  negoInit(c);
  const ev = [];
  const otherSide = s => s === 'owner' ? 'counterparty' : 'owner';
  const pushChange = (ch, roundN) => {
    if (!ch || ch.status === 'superseded') return;
    const base = { round: roundN, clauseId: ch.clauseId || null,
      clauseLabel: ch.clauseLabel || ch.clauseId || '', changeId: ch.id || null };
    const sideWord = ch.authorSide === 'owner' ? 'owner side' : 'counterparty';
    ev.push({ ...base, kind: 'proposed', at: ch.createdAt || ch.at || '', actor: ch.author || '',
      side: ch.authorSide || '', outcome: ch.status === 'pending' && !ch.withdrawn ? 'pending' : '',
      text: `${ch.author || 'Someone'} (${sideWord}) proposed #${ch.id} — ${ch.summary || ch.changeType}`,
      note: ch.why || ch.note || null, ch });
    if (ch.status === 'accepted' || ch.status === 'rejected')
      ev.push({ ...base, kind: 'decided', at: ch.resolvedAt || ch.createdAt || '',
        actor: ch.resolvedBy || '', side: otherSide(ch.authorSide), outcome: ch.status,
        text: `${ch.status === 'accepted' ? 'Accepted' : 'Rejected'} by ${ch.resolvedBy || 'the other side'}`
          + `${ch.status === 'accepted' ? ' — merged into the wording' : ch.reply ? ` — “${ch.reply}”` : ''}`,
        reply: ch.reply || null, ch });
    if (ch.withdrawn)
      ev.push({ ...base, kind: 'withdrawn', at: ch.withdrawn.at || '',
        actor: ch.withdrawn.by || '', side: ch.withdrawn.side || ch.authorSide || '',
        outcome: 'withdrawn',
        text: `${ch.withdrawn.by || ch.author || 'The proposer'} withdrew #${ch.id} — the ask came off the table`, ch });
  };
  for (const r of (c.negotiation.rounds || [])){
    for (const ch of (r.changes || [])) pushChange(ch, r.n);
    ev.push({ kind: 'round-closed', at: r.at || '', actor: '', side: '', outcome: '',
      round: r.n, clauseId: null, clauseLabel: '',
      text: `Round ${r.n} closed — the agreed wording became the baseline for round ${r.n + 1}` });
  }
  for (const ch of negoChanges(c)) pushChange(ch, c.negotiation.round);
  /* The beats that come off the audit trail. The prose is the entry's own —
     it was written in the house register at the moment of the act — and the
     kind is read from the action (or, for renumbering, from the X3 data). */
  const SIGNING_ACTS = { 'Shared': 'link', 'Countersigned': 'signature',
    'Signature': 'signature', 'Signed': 'sealed', 'Distributed': 'copies' };
  for (const a of (c.audit || [])){
    if (!a) continue;
    if (a.data && a.data.kind === 'renumber'){
      ev.push({ kind: 'renumbered', at: a.at || '', actor: a.user || '', side: 'owner',
        outcome: '', round: null, clauseId: null, clauseLabel: '',
        text: a.detail || 'Clauses renumbered', data: a.data });
    } else if (SIGNING_ACTS[a.action]){
      ev.push({ kind: SIGNING_ACTS[a.action], at: a.at || '', actor: a.user || '',
        side: '', outcome: '', round: null, clauseId: null, clauseLabel: '',
        text: a.detail || a.action });
    }
  }
  /* Chronological, with arrival order as the tiebreak — two acts in the same
     second keep the order they were recorded in. */
  const idx = new Map(ev.map((e, i) => [e, i]));
  ev.sort((a, b) => String(a.at).localeCompare(String(b.at)) || (idx.get(a) - idx.get(b)));
  return ev.filter(e =>
    (!f.clauseId || e.clauseId === f.clauseId)
    && (!f.actor || e.actor === f.actor)
    && (!f.side || e.side === f.side)
    && (!f.round || e.round === Number(f.round))
    && (!f.outcome || e.outcome === f.outcome));
}

/* ---------- THE WHOLE RECORD, VERIFIED IN ONE ANSWER (WP-2.5) ----------
   Three separate facts, asked together because a reader pressing "verify"
   means all of them: the change chain (every fingerprint recomputed from
   stored content, every link checked — verifyChangeChain), the seal (does the
   frozen copy still hash to what the record claims), and the divergence check
   E5 built after finding that verifySeal alone never compared the live body
   to the sealed one. Reported with the FIRST broken link named — "something
   is wrong" is a verdict nobody can act on.

   The answer carries its own timestamp because the export (WP-2.4) embeds it:
   a verification result with no "when" reads as a permanent property of the
   document, and it is a property of the moment it was run. */
async function negoIntegrityReport(c){
  const at = (window.nowISO ? window.nowISO() : new Date().toISOString());
  const chain = await verifyChangeChain(c);
  const executed = negoExecuted(c);
  let seal = null;
  if (executed && c.hash && window.sealString && window.sha256){
    const expect = await sha256(sealString(c));
    seal = expect === c.hash
      ? { ok: true, detail: 'The seal matches the stored record' }
      : { ok: false, detail: 'The seal does NOT match the stored record — the sealed content or the seal itself has been altered' };
  }
  const divergence = executed ? executedDivergence(c) : null;
  const ok = chain.ok && (!seal || seal.ok) && !divergence;
  const firstBroken = !chain.ok
    ? `${chain.failedAt ? '#' + chain.failedAt + ': ' : ''}${chain.detail}`
    : (seal && !seal.ok) ? seal.detail
    : divergence ? divergence.detail : null;
  return { ok, at, chain, seal, divergence, firstBroken,
    detail: ok
      ? `Record verified — ${chain.checked} entr${chain.checked === 1 ? 'y' : 'ies'} recomputed from stored content, no alteration found${seal ? '; the seal matches' : ''}`
      : `Integrity check FAILED — ${firstBroken}` };
}

/* ---------- WHO THE RECORD SAYS DID THIS ----------
   The name a counterparty types into the box is a claim, not a fact, and until
   now it was stored as though it were a fact: "Rejected by Jane Mwangi", with
   nothing anywhere saying whether anybody had checked that Jane sent it. A year
   later the history screen reads that sentence back to an auditor, and its
   whole value rests on the part nobody recorded.

   THE RECORD IS HONEST IN BOTH DIRECTIONS. Where the link was verified by a
   one-time code sent to the invited address, the verified address goes on the
   decision — that is the strongest identity claim the product can make about
   somebody with no account. Where it was not, the record says so plainly rather
   than going quiet, because a name with no qualifier reads as verified to every
   reader who was not there.

   NEVER THE TYPED ADDRESS. A signer who types their own address and gets a code
   has proved control of that mailbox and nothing about who they are; the
   address that means something is the one the owner invited.

   ENCOURAGED, NOT ENFORCED. Nothing here demands verification before somebody
   may answer a clause — putting a mail round trip in front of ordinary
   negotiation is how a link stops being used. It records what happened. */
function negoActorLabel(r, fallback){
  const base = String((r && r.name) || fallback || 'the counterparty').trim()
    + ((r && r.title) ? ', ' + r.title : '');
  if (!r) return base;
  if (r.verified === true && r.verifiedEmail) return `${base} (${r.verifiedEmail}, email-verified)`;
  if (r.verified === true) return `${base} (email-verified)`;
  /* Unverified, and named as such. The invited address is still worth carrying
     — it says who the link was MEANT for, which is exactly the question a
     reader asks next. */
  const sent = (r.invitedEmail || r.email) ? ` — link sent to ${r.invitedEmail || r.email}` : '';
  return `${base} (link holder, unverified${sent})`;
}


/* The clauses of the contract's CURRENT working wording. */
const negoClauses = c => (window.clauseSegment ? clauseSegment(negoBodyOf(c)) : []);

/* ---------- the negotiation record ----------
   c.negotiation holds the BASELINE for the round in flight: the wording both
   sides are measuring this round's proposals against. It is a snapshot of the
   document, not a pointer to a version, for the same reason the round record
   keeps one — a version can be superseded, but what the parties were arguing
   about cannot un-happen.

   The baseline is kept as RICH HTML with clause ids stamped in, so a change can
   be applied to it by id without the document ever passing through plain text.
   baselineText is kept alongside it as the text projection, because the round
   model, the seal and search all read text and none of them should have to
   learn about clauses. */
function negoInit(c, opts = {}){
  c.changes = Array.isArray(c.changes) ? c.changes : [];
  if (!c.negotiation || opts.reset){
    const body = negoStampContract(c);
    c.negotiation = {
      baselineBody: body,
      baselineText: (window.richToText ? richToText(body) : ''),
      baselineFormat: (window.docFormat ? docFormat(c.format) : 'text'),
      round: 1,
      turn: 'owner',
      startedAt: (window.nowISO ? window.nowISO() : new Date().toISOString()),
      seq: 0,
      chainHead: null,
      chainSeq: 0,
      hashV: 2,
    };
  }
  const n = c.negotiation;
  if (typeof n.seq !== 'number') n.seq = 0;
  if (typeof n.round !== 'number') n.round = 1;
  if (typeof n.chainSeq !== 'number') n.chainSeq = 0;
  if (n.chainHead === undefined) n.chainHead = null;
  if (!n.baselineBody) n.baselineBody = negoStampContract(c);
  if (n.baselineText == null) n.baselineText = (window.richToText ? richToText(n.baselineBody) : '');
  return n;
}
/* Stamp durable clause ids into the contract's own body, once, and keep them.
   Writing them back into c.redlineText is the point: the id has to live in the
   document, or it is just another lookaside table that can fall out of step
   with the thing it describes. Idempotent — a second call stamps nothing. */
function negoStampContract(c){
  const body = negoBodyOf(c);
  if (!body.trim()) return '';
  if (!window.clauseStampIds) return body;
  const { html, stamped } = clauseStampIds(body);
  if (stamped && window.isRich && isRich(c.format) && c.redlineText != null) c.redlineText = html;
  return html;
}

/* ---------- keeping an UNTOUCHED baseline current ----------
   The baseline is a snapshot, and during a live round it must be: every filed
   ask is measured against it. But before anything is on the table the snapshot
   can go stale in a way a reader sees as two different contracts — fill the
   key terms on the Doc page after the workbench's first paint and the Doc page
   says "KES 14,500,000" while the redline still shows the blank it froze.

   So an untouched negotiation re-reads its baseline from the document. The
   guards are the point, and every one is load-bearing: any filed change, any
   archived round, any hash issued means the baseline has been MEASURED AGAINST
   and may not move — that is the round model's contract, not an optimisation. */
function negoFreshenBaseline(c){
  const n = negoInit(c);
  if ((c.changes || []).length) return false;         // something is on the table
  if ((n.rounds || []).length || n.round !== 1) return false;  // history exists
  if (n.chainHead) return false;                      // a hash has cited this baseline
  /* THE RE-READ MUST NOT RENAME THE CLAUSES. A template contract stores no body
     of its own, so negoStampContract has nowhere to write its ids back to and
     mints fresh ones every call — which made this function replace the baseline
     on every paint, with a new set of clause ids each time. Any id already given
     to the other side was dead within seconds. See clauseCarryIds. */
  let body = negoStampContract(c);
  if (body && n.baselineBody && window.clauseCarryIds){
    try { body = clauseCarryIds(n.baselineBody, body); } catch (_){ /* keep the fresh stamp */ }
  }
  if (!body || body === n.baselineBody) return false;
  const text = window.richToText ? richToText(body) : '';
  n.baselineBody = body;
  n.baselineText = text;
  n.baselineFormat = (window.docFormat ? docFormat(c.format) : 'text');
  return true;
}

const negoBaseText = c => (negoInit(c).baselineText || '');
const negoBaseBody = c => (negoInit(c).baselineBody || '');
const negoRound = c => negoInit(c).round;
const negoChanges = c => { negoInit(c); return c.changes; };
const negoChangeById = (c, id) => negoChanges(c).find(x => x.id === id) || null;
const negoPending = c => negoChanges(c).filter(x => x.status === 'pending');
const negoOpenChanges = c => negoPending(c);

/* A fingerprint id, allocated once per change and never reused — not even
   after a change is deleted, because a fingerprint that comes back meaning
   something else is worse than no fingerprint. Three digits, as #CHG-012.

   The id names the SLOT; the hash names the CONTENT. Revising a pending change
   keeps the id and issues a new hash, so a precise citation is id@hash. */
function negoNextId(c){
  const n = ++negoInit(c).seq;
  return 'CHG-' + String(n).padStart(3, '0');
}

/* ---------- the hash chain ----------
   What a fingerprint attests to: this contract, this clause, this kind of
   change, these exact words before and after, proposed by this party at this
   moment, following THIS predecessor.

   The canonical string is settled here and stamped with its `hashV` on every
   record, so a future change to it is detectable rather than a silent
   verification failure. v3 fields, in order:

     contractRef | clauseId | changeType | oldText | newText
                 | author | createdAt | prevChangeHash | bodyHtml

   v3 exists because of formatting-only changes: two proposals with identical
   words and different formatting are different asks, and a fingerprint that
   attests to words alone cannot tell them apart. The rich body is hashed AS
   STORED — the verbatim string, never re-sanitised or re-serialised at verify
   time — so a later change to the sanitiser cannot break an old record's own
   verification. (That also means a stored bodyHtml must never be mutated after
   filing; a revision issues a new hash instead.)

   Records written under v2 (no bodyHtml field) keep verifying forever:
   verification recomputes each record with the version it was WRITTEN under,
   read off the record's own hashV stamp. New issuances are always v3.

   Two deliberate exclusions. STATUS is not in it — a change's hash must not
   move when it is accepted, rejected, discussed or reopened, or it could not be
   used to verify the thing it names, and "a decision never moves a hash" is an
   invariant this session inherited and has to keep. NUMBER and TITLE are not in
   it either, because they are presentation: renumbering a contract must not
   invalidate its history.

   Whitespace is NOT normalised. The old v1 input collapsed runs of whitespace
   before hashing, which meant a whitespace-only edit hashed identically to no
   edit at all. The ops carry whitespace exactly (js/redline.js), so the hash
   does too.

   prevChangeHash chains each ISSUANCE to the one before it in CREATION order —
   never status order. A revision of a pending change is an issuance like any
   other, so a revised change's new hash chains onto its own prior wording, and
   every earlier wording stays recoverable from the chain. */
/* ---- v4: THE FIELDS ARE LENGTH-PREFIXED, AND THE MARKS ARE INSIDE ----
   (audit finding 8, 14 Aug 2026.) v2 and v3 joined the fields with '\n' and
   nothing else, and two of those fields are CONTRACT WORDING, which contains
   newlines. So the boundary between "the words before" and "the words after"
   was a character the words themselves could contain, and moving a line break
   across it produced a byte-identical hash input for a genuinely different
   change. Demonstrated: {old:'Payment within 30 days.\nLate fees apply.',
   new:'Payment within 45 days.'} and {old:'Payment within 30 days.',
   new:'Late fees apply.\nPayment within 45 days.'} hashed the same. A
   fingerprint that can attest to two different histories attests to neither.

   THE REMEDY IS THE STANDARD ONE: write each field's length before it, so no
   content can imitate a separator. `12:hello world` cannot be confused with
   anything, whatever `hello world` contains.

   AND `ops` COMES INSIDE. The marks are what the counterparty actually reads —
   the rendered redline — and they travelled in the payload as authoritative
   while sitting outside the attestation entirely, so the visible diff could be
   rewritten without disturbing the fingerprint. Serialised through the same
   length-prefixing rather than JSON, which has its own escaping to reason about.

   OLD RECORDS ARE NOT RECOMPUTED. Every existing fingerprint was issued under
   v2 or v3 and goes on verifying under the version stamped on it — the same
   rule this file already kept for v2 when v3 arrived. Only new issuances are
   v4, and verifyChangeChain reads each record's own stamp. */
/* ---- v5: THE HEADING IS INSIDE IT (owner-asked 28 Aug 2026) ----
   A clause's heading became something a change can move — "3. Payment Terms"
   proposed as "3. Charges" — and a contract is cited by those strings. Left
   outside the attestation the heading would have been the one part of the
   document a change carries and the fingerprint does not: the visible rename
   could be rewritten without disturbing the hash, which is exactly the v4
   argument for bringing `ops` inside, one field along.

   It is written through the same length prefix as everything else, so no
   content can imitate a separator, and it is appended AFTER ops rather than
   spliced between existing fields — a v5 input is a v4 input with one more
   field on the end, which is what keeps the two readings easy to compare.

   NOTHING ALREADY FILED MOVES. Every record keeps the version stamped on it
   and verifies under that version for ever; only new issuances are v5. */
const NEGO_HASH_V = 5;
/* Every format a record on a live contract may legitimately be stamped with.
   A record verifies under the version it was WRITTEN under, forever — bumping
   the format must never accuse an existing contract of tampering. */
const NEGO_HASH_VERIFIES = new Set([2, 3, 4, 5]);
/* length-prefixed, so a field's own content can never look like the separator */
const _lp = s => { const t = String(s == null ? '' : s); return `${t.length}:${t}`; };
const _lpOps = ops => (Array.isArray(ops) ? ops : [])
  .map(o => _lp((o && o.op) || '') + _lp((o && o.text) == null ? '' : o.text)).join('');
function negoHashInput(contractRef, iss){
  const v = Number(iss.hashV) || NEGO_HASH_V;
  const fields = [
    String(contractRef == null ? '' : contractRef),
    String(iss.clauseId || ''),
    String(iss.changeType || ''),
    String(iss.oldText == null ? '' : iss.oldText),
    String(iss.newText == null ? '' : iss.newText),
    String(iss.author || ''),
    String(iss.createdAt || ''),
    String(iss.prevChangeHash || ''),
  ];
  if (v >= 5) return 'hati-change-v5' + fields.map(_lp).join('')
    + _lp(iss.bodyHtml == null ? '' : iss.bodyHtml)
    + _lp(_lpOps(iss.ops))
    + _lp(iss.headingText == null ? '' : iss.headingText);
  if (v === 4) return 'hati-change-v4' + fields.map(_lp).join('')
    + _lp(iss.bodyHtml == null ? '' : iss.bodyHtml)
    + _lp(_lpOps(iss.ops));
  if (v === 3) return ['hati-change-v3', ...fields,
    String(iss.bodyHtml == null ? '' : iss.bodyHtml)].join('\n');
  return ['hati-change-v2', ...fields].join('\n');
}
async function negoHash(contractRef, iss){
  return '0x' + await sha256(negoHashInput(contractRef, iss));
}
/* Take the next link in the chain. The ONLY place a hash is issued, so the
   chain cannot acquire an unlinked member.

   TWO KINDS OF LINK, and the difference is the point:

     · a NEW change chains onto the contract's chain head — the hash issued
       most recently, whatever change it belonged to. That is what puts every
       change in one verifiable creation order.
     · a REVISION of a pending change chains onto THAT CHANGE'S own previous
       hash, not onto the head. A revision is a new wording of an existing ask,
       so its predecessor is the wording it replaced — which is what makes
       "recover this change as it stood two revisions ago" a walk rather than a
       search, and what makes a citation id@hash precise.

   `seq` is stamped on every issuance either way, so creation order survives
   independently of which link was taken, and verifyChangeChain can rebuild
   both expectations from stored content alone. */
async function negoIssue(c, iss, opts = {}){
  const n = negoInit(c);
  negoInvalidateVerification(c);
  iss.prevChangeHash = (opts.revisionOf !== undefined ? opts.revisionOf : n.chainHead) || null;
  iss.seq = ++n.chainSeq;
  iss.hashV = NEGO_HASH_V;
  iss.hash = await negoHash(c.id, iss);
  n.chainHead = iss.hash;
  return iss;
}
/* The abbreviated form the change index shows. The full hash always travels on
   the record and in the title attribute — this is display only. */
const negoShortHash = h => {
  const s = String(h || '');
  return s.length > 20 ? s.slice(0, 10) + '…' + s.slice(-6) : s;
};

/* Every hash issuance this negotiation has ever made, in creation order:
   current wordings, prior revisions of them, and everything archived onto a
   closed round. What verifyChangeChain walks. */
function negoIssuances(c){
  negoInit(c);
  const out = [];
  const take = ch => {
    for (const r of (ch.revisions || [])) out.push({ ...r, id: ch.id, revision: true });
    out.push({ ...ch, revisions: undefined });
  };
  for (const r of (c.negotiation.rounds || [])) for (const ch of (r.changes || [])) take(ch);
  for (const ch of c.changes) take(ch);
  return out.sort((a, b) => (a.seq || 0) - (b.seq || 0));
}
/* ---------- verification ----------
   Recompute every hash from STORED content and check that each links to the one
   before it. This is what makes the prototype's "Verified" pill mean something:
   it rendered unconditionally there, which is the exact fakery the prototype is
   criticised for.

   Reports the FIRST broken link by name rather than a bare false, because
   "something in this history does not verify" is not an actionable statement
   about a legal document. */
async function verifyChangeChain(c){
  negoInit(c);
  const list = negoIssuances(c);
  let prev = null;                       // the hash issued immediately before, in creation order
  let omitted = 0;                       // links this copy was never given (see below)
  const lastOf = new Map();              // and the previous hash of each change's own history
  for (const iss of list){
    /* Each record verifies under the format it was WRITTEN under — v2 records
       predate the rich-body field and must keep verifying after v3 shipped, or
       bumping the format would have silently accused every existing contract
       of tampering. negoHashInput reads the record's own hashV stamp. */
    /* v4 arrived on 14 Aug 2026 (see negoHashInput). The accepted set is now a
       LIST rather than two named versions, so the next format joins it without
       this line having to be rewritten — and, more importantly, so no record
       already on a contract is ever accused of tampering by a build that moved
       on without it. */
    if (!NEGO_HASH_VERIFIES.has(Number(iss.hashV)))
      return { ok: false, checked: list.length, failedAt: iss.id || null, seq: iss.seq || null,
        reason: 'unknown-hash-version',
        detail: `#${iss.id} was written under hash format v${iss.hashV || 1}; this build verifies v${[...NEGO_HASH_VERIFIES].join(', v')}` };
    /* A revision must follow its own previous wording; anything else must
       follow whatever was issued immediately before it. Rebuilt here from the
       stored records rather than trusted, so a reordered or removed issuance
       shows up as a broken link rather than passing quietly. */
    const isRevision = lastOf.has(iss.id);
    const expectPrev = isRevision ? lastOf.get(iss.id) : prev;
    /* A COPY THAT WAS NEVER GIVEN THE WHOLE CHAIN.

       The counterparty's copy carries a change but not the earlier drafts it
       replaced — those are the owner's, and only what was sent is published.
       The chain links a change to the wording it replaced, so the first record
       of a revised change points at a hash this copy does not hold. That is not
       a broken chain; it is a chain seen through a window, and reporting it as
       "the stored wording has been altered" accused the document of something
       nobody had done.

       The payload says how many are missing, so the difference is knowable
       rather than guessed. The link across them is not checked — it cannot be —
       and the verdict says so. Everything else still is: the record's own
       fingerprint is recomputed and matched exactly as before, and a broken
       link the omission does not account for still fails. */
    const notCarried = !isRevision && Number(iss.revisionsOmitted || 0) > 0;
    if (notCarried) omitted += Number(iss.revisionsOmitted);
    else if ((iss.prevChangeHash || null) !== expectPrev)
      return { ok: false, checked: list.length, failedAt: iss.id || null, seq: iss.seq || null,
        reason: 'broken-link',
        detail: isRevision
          ? `#${iss.id} does not follow its own previous wording — a revision is missing from the record`
          : `#${iss.id} does not follow the change before it — the chain was reordered or a link is missing` };
    const expect = await negoHash(c.id, iss);
    if (expect !== iss.hash)
      return { ok: false, checked: list.length, failedAt: iss.id || null, seq: iss.seq || null,
        reason: 'content-altered',
        detail: `#${iss.id} does not match its own fingerprint — the stored wording has been altered since it was filed` };
    prev = iss.hash;
    lastOf.set(iss.id, iss.hash);
  }
  /* Every hash recomputed and every link matched — but on WHAT digest? If
     crypto.subtle was unavailable this whole chain was built and checked with a
     32-bit rolling hash, and "these two weak digests agree" is not evidence
     that the wording is unaltered. Reported as unverifiable, not as verified. */
  if (window.sha256IsReal && !sha256IsReal())
    return { ok: false, checked: list.length, failedAt: null, seq: null,
      reason: 'weak-digest',
      detail: 'This browser has no SHA-256 available (crypto.subtle needs a secure context), '
        + 'so these fingerprints were computed with a weak substitute and cannot be verified. '
        + 'Open this page over https to check the chain.' };
  return { ok: true, checked: list.length, failedAt: null, reason: null,
    omitted, partial: omitted > 0,
    detail: !list.length ? 'nothing filed yet'
      : omitted
        ? `${list.length} change record${list.length === 1 ? '' : 's'} verified against their fingerprints.`
          + ` ${omitted} earlier revision${omitted === 1 ? '' : 's'} ${omitted === 1 ? 'is' : 'are'} not carried by`
          + ` this copy, so the link${omitted === 1 ? '' : 's'} across ${omitted === 1 ? 'it' : 'them'} cannot be`
          + ` checked here. Nothing suggests the wording has been altered.`
        : `${list.length} change record${list.length === 1 ? '' : 's'} verified against their fingerprints` };
}

/* The verification the "Verified" pill reads.
   verifyChangeChain is async — it hashes — and rendering is not, so the result
   is computed once and cached on the record for the render to read. The cache
   is a TRANSIENT: it is never persisted and never trusted across a change, so a
   stale pass cannot outlive the content it was about. negoRefreshVerification
   is called whenever the change set moves. */
const negoVerifyCached = c => (c && c._chainVerify) || null;
async function negoRefreshVerification(c){
  const v = await verifyChangeChain(c);
  try { Object.defineProperty(c, '_chainVerify', { value: v, writable: true, enumerable: false, configurable: true }); }
  catch (_) { c._chainVerify = v; }
  return v;
}
const negoInvalidateVerification = c => { if (c) c._chainVerify = null; };

/* ---------- summarising a change ----------
   The prototype carries a hand-written line ("Payment terms extended from
   Net-30 to Net-45"), and 2.5 says the proposer writes one. Where they do, it
   is used verbatim and never touched.

   Where they skip it, the MECHANICAL diff stands in: what goes, what arrives,
   quoted from the stored ops so the summary quotes the same fragments the
   reviewer sees highlighted. Prose describing a legal change is never
   generated — a machine-invented "liability was relaxed" on a clause that
   tightened it is worse than no summary at all. */
function negoSummariseOps(changeType, ops, oldText, newText){
  const trim = (s, n) => {
    const t = String(s || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };
  if (changeType === 'insertClause') return 'New clause added — ' + trim(newText, 70);
  if (changeType === 'deleteClause') return 'Clause deleted — ' + trim(oldText, 70);
  const regions = [];
  let cur = null;
  for (const op of (ops || [])){
    if (op.op === 'keep'){ if (cur){ regions.push(cur); cur = null; } continue; }
    cur = cur || { before: '', after: '' };
    if (op.op === 'del') cur.before += op.text; else cur.after += op.text;
  }
  if (cur) regions.push(cur);
  if (!regions.length) return 'Wording changed — ' + trim(newText, 70);
  const parts = regions.slice(0, 2).map(r => {
    const b = trim(r.before, 34), a = trim(r.after, 34);
    if (b && a) return `“${b}” → “${a}”`;
    if (a) return `added “${a}”`;
    return `removed “${b}”`;
  });
  return parts.join('; ') + (regions.length > 2 ? ` (+${regions.length - 2} more)` : '');
}

/* ---------- filing a change ----------
   ONE function files every change, whichever surface produced it: inline
   editing in the working pane, a returned .docx read by docxExtract, wording
   received outside HaTi and filed under their name, or the owner's own
   proposals. Nothing enters the document here — filing records what was
   PROPOSED, and the wording moves only when a change is accepted.

   1.5, the update-in-place rule: a clause carries at most ONE pending change
   per side per round. Re-editing it re-diffs against the round baseline and
   UPDATES the record — same #CHG id, new ops, new hash chained onto the
   previous revision's hash — so every prior wording stays recoverable from the
   chain. Two live proposals on one clause would make "accept both" mean
   nothing coherent, and the second is plainly the one they mean.

   The one case that is NOT a revision: a new wording arriving after the other
   side has already DECIDED. That is not a correction of an outstanding ask, it
   is a counter-proposal to a settled point, and it gets a new id in the next
   round. Quietly folding it into the decided change would rewrite what the
   other side agreed to. */
/* Whether a text-noop edit genuinely moved the FORMATTING. Only meaningful on
   a rich contract — a plain-text document has no formatting to move, and its
   accept path flattens to text, so a formatting-only ask there would be a
   promise the document cannot keep. The comparison is canonical (attribute
   order, whitespace, empties all normalised), so an editor that merely
   re-serialised the same markup still reads as unchanged. */
function _negoFormattingMoved(c, draft, live){
  if (!draft.bodyHtml) return false;
  if (!(window.isRich && window.canonicalRich && isRich(c.format))) return false;
  const canon = h => { try{ return canonicalRich(String(h || '')); }catch(_){ return String(h || ''); } };
  /* Measured against what the author was shown, for the reason
     negoClauseNowById gives: on a clause carrying an adopted change the
     baseline's markup is not the markup on screen, so comparing to it would
     call an untouched clause a formatting change. */
  const cl = window.negoClauseNowById ? negoClauseNowById(c, draft.clauseId)
    : (window.negoClauseById ? negoClauseById(c, draft.clauseId) : null);
  const base = (cl && cl.bodyHtml) ? canon(cl.bodyHtml) : '';
  if (!base) return false;
  const want = canon(draft.bodyHtml);
  if (want === base) return false;                              // truly nothing changed
  if (live && canon(live.bodyHtml || '') === want) return false; // an empty revision of the live ask
  return true;
}

/* The record's own words for a formatting-only ask. A RECORD, not a label:
   stamped into summaries and audit lines, so it keeps English like every other
   recorded string (roleName vs ROLE_LABEL — same rule). The screens translate
   their own chip through i18t instead. */
const NEGO_FMT_ONLY_SUMMARY = 'Formatting changed — the wording is unchanged';

/* ---- WHY THE LAST FILING OR DECISION WAS REFUSED ----
   Set by the guards below and read by applyResponse, which otherwise reports
   every unfiled proposal as "does not match any clause" — true of an unplaceable
   clause id and untrue of a contract whose wording is frozen, with a remedy the
   reader cannot act on. Per sitting, in memory, overwritten by each refusal: it
   is read immediately by the one caller that asks. */
let negoLastRefusal = null;
async function negoFileChange(c, draft, opts = {}){
  /* ---------- AN EXECUTED CONTRACT TAKES NO NEW CHANGES ----------
     The signed door in negoResolve refused to DECIDE on an executed contract
     and this refused nothing at all, so the product's real rule was: you may
     not rule on a change to a signed agreement, but you may author one. MK-248
     was reported Executed with a live Save change bar on its clause body, and
     it filed.

     What that costs is not a stray record. negoCommitBody rewrites c.body — the
     text the seal was computed over — while execution.html keeps the wording
     that was actually signed, so an edit here walks the live document away from
     the sealed evidence in silence. Afterwards verifySeal reports a break on a
     contract nobody tampered with, or the screen shows wording the evidence
     does not contain. Either way the seal stops meaning what it says, and the
     seal is the whole claim.

     GUARDED AT THE FUNNEL, NOT AT THE CALLERS. negoEditClause, negoInsertClause
     and negoDeleteClause all arrive here; the fourth caller written next year
     will too, and it inherits this without knowing it needs to. Before
     negoInit, because a refusal must not leave initialisation behind as its
     only trace. */
  if (negoWordingFrozen(c)){
    /* ---- QUIET MEANS QUIET, AND THE REASON GOES BACK TO THE CALLER ----
       opts.quiet guarded only logAudit, so this drew a red box even from the
       BACKGROUND POLLER — applyResponse reaches both this and negoResolve with
       quiet:true for exactly this reason and never got it. An owner working
       anywhere in the app got a refusal about a contract they were not looking
       at: the negoSignalReady fault, which this rulebook records as unique and
       is not.
       And the reason is REMEMBERED rather than only shouted, because the
       caller's own message for this case said the wording "does not match any
       clause" — a different and untrue diagnosis, whose stated remedy (fix the
       clause reference) cannot work. The clause matched perfectly; the contract
       is locked because somebody has signed. */
    const why = i18t(negoExecuted(c) ? 'ne_executed_amend' : 'ne_signed_frozen');
    negoLastRefusal = why;
    if (!opts.quiet && window.toast) toast(why, 'err');
    return null;
  }
  negoInit(c);
  const side = opts.side === 'owner' ? 'owner' : 'counterparty';
  /* ---------- STARTING WORK CLAIMS THE NEGOTIATION ----------
     The first change filed on our side opens a desk and records who opened it.
     HERE, in the funnel, for the reason the executed-contract guard above gives
     in its own words: negoEditClause, negoInsertClause and negoDeleteClause all
     arrive here, and so do the routes that skip the wrappers entirely — the
     Copilot shortcut in js/core.js, both playbook entrances and the Word
     round-trip. A claim written into any one of those would be a claim the
     other four never make.

     Quiet by design, and it never refuses: filing a redline is the act the
     person meant to perform, and stage 1 of this feature stamps a name without
     changing what anybody may do. */
  if (window.deskClaimOnFile){ try{ deskClaimOnFile(c, side); }catch(_){} }
  /* ---------- THE OTHER SIDE MAY NOT RENAME OUR CLAUSES ----------
     Owner-ruled 29 Aug 2026. The rename shipped on 28 Aug with no rule about
     seats, and their page mounts the same panel ours does, so until now they
     could propose a new name for a clause of ours.

     A CLAUSE'S NAME IS HOW THE AGREEMENT IS CITED — "subject to Clause 9" —
     and the numbering and the cross-references are ours to keep coherent. What
     is NOT narrowed, and this is the whole width of the rule: their right to
     propose new WORDING is untouched, they still see a rename we propose, and
     they still accept or refuse it like any other change.

     NAMING A CLAUSE THEY ARE PROPOSING IS NOT RENAMING ONE OF OURS, so the
     guard is on `modify` alone. An insertClause carries the heading of a clause
     that does not exist yet; refusing that would leave them able to propose a
     new clause and unable to call it anything.

     AT THE FUNNEL, for the reason the two guards around it already give: the
     Copilot shortcut in core.js, both playbook entrances, the Word round-trip
     and an inbound link all reach this function without passing any screen.
     The name box also stands down on their seat — a control whose only outcome
     is a refusal is furniture — but that is the SIGN and this is the WALL.

     IT DROPS THE RENAME AND KEEPS THE EDIT, rather than refusing the filing:
     the wording they typed is a legitimate ask and throwing it away to punish a
     field they cannot even be shown would cost them work they meant to do. */
  if (side === 'counterparty' && draft && draft.changeType === 'modify'
      && draft.headingText != null) draft = { ...draft, headingText: null };
  /* ---------- AND WHERE THE RULE IS ON, IT REFUSES HERE ----------
     THE LOCK, not the sign. js/views/negotiation.js stops OFFERING the verbs to
     somebody who is only reading, and that is the right thing for a screen to
     do — but a hidden button is a decision about pixels. The side doors this
     codebase already names in its own map (the Copilot shortcut in core.js,
     both playbook entrances, the Word round-trip, an inbound link) reach this
     function without passing any screen at all, and a rule they can walk around
     is decoration.

     AFTER the claim, deliberately: the first person to work an unclaimed
     contract claims it and is then a member, so the rule never refuses the act
     that would have created the desk.

     OUR SIDE ONLY. The counterparty's own proposals arrive through here too and
     have nothing to do with who sits at our desk; their wall is the transport,
     which is a different mechanism. deskMayRedline answers true in PORTAL_MODE
     for the same reason. */
  if (side === 'owner' && window.deskBlockMessage){
    let why = null;
    try{ why = deskBlockMessage(c); }catch(_){ why = null; }
    if (why){
      if (window.toast) toast(why, 'err');
      return null;
    }
  }
  const author = String(opts.author || (side === 'owner'
    ? ((window.currentUser && window.currentUser()?.name) || 'This workspace')
    : (c.counterparty || 'The counterparty'))).trim();
  /* ---- WHO ACTUALLY TYPED IT, WHEN THAT IS NOT WHO IT IS FROM ----

     The workbench is one component with a side flag, so the owner's
     "Counterparty View" is not a preview of their seat — it IS their seat, and
     anything filed from it was recorded in the counterparty's name with
     nothing anywhere saying otherwise. An owner could produce a fingerprinted,
     hash-chained record of the other side asking for something they never
     asked for. On a product whose whole worth is that the negotiation record
     is trustworthy evidence, that is the one thing it must not be able to do
     quietly.

     Entering a change on their behalf is a REAL need — they email a marked-up
     PDF and somebody types it in — so it is not forbidden. It is stamped.

     WORKED OUT HERE, IN THE FUNNEL, AND BY DEFAULT. Every genuine inbound
     route already says where it came from: applyResponse and
     applyNegoProposals set `via` to their link, the Word round-trip to the
     returned file, and the counterparty's own page runs in PORTAL_MODE. So a
     counterparty-side change with no origin, filed on a logged-in workspace,
     was typed by the person sitting there. Defaulting to honesty means a
     future caller that forgets to declare itself gets stamped rather than
     getting anonymity — the failure lands on the safe side. */
  const enteredBy = (side === 'counterparty'
      && !(typeof window !== 'undefined' && window.PORTAL_MODE)
      && !opts.via
      && !opts.enteredBy0
      && (window.currentUser && window.currentUser()?.name))
    ? String(window.currentUser().name).trim()
    : (opts.enteredBy || null);
  const at = opts.at || (window.nowISO ? window.nowISO() : new Date().toISOString());
  const roundN = opts.roundN != null ? opts.roundN : negoRound(c);

  const oldText = String(draft.oldText == null ? '' : draft.oldText);
  const newText = String(draft.newText == null ? '' : draft.newText);
  /* ALIGNED ON LINES FIRST where the engine offers it. A clause is rarely one
     sentence — it is a heading, numbered sub-clauses and lettered
     sub-paragraphs — and aligning words across the whole of it lets the diff
     match "(a)" against an "(a)" three lines away. The reconstruction is exact
     either way; the difference is that the line-aware walk reports the two
     sub-paragraphs nobody touched as untouched, instead of striking them out
     and re-inserting them verbatim.

     This is decided HERE, at the moment of filing, because the ops are the
     record: every later render reads them back rather than re-deriving them,
     so a bad alignment saved now is a bad redline for the life of the change. */
  const ops = (draft.changeType === 'modify' && (window.redlineOpsStructured || window.redlineOps))
    ? (window.redlineOpsStructured ? redlineOpsStructured(oldText, newText) : redlineOps(oldText, newText))
    : draft.changeType === 'insertClause' ? [{ op: 'ins', text: newText }]
    : [{ op: 'del', text: oldText }];

  /* A no-op produces NO record. Saving a clause you looked at and did not
     change must not file a fingerprint against it — an index full of empty
     changes is an index nobody reads.

     UNLESS THE FORMATTING MOVED. The ops are a diff over the TEXT projection,
     and bold, italics, underline and list wrapping do not change the text — so
     for years a formatting-only edit was indistinguishable from no edit at
     all, and File change refused it with a toast nobody saw. The rich forms
     are compared here (canonicalRich: "formatting is part of the document"),
     and an edit whose words are unchanged but whose markup differs from the
     round baseline files as a real change, flagged `formattingOnly` so every
     renderer can say what kind of ask it is. Equal rich forms still refuse —
     that is the true no-op this guard has always existed for. */
  const live = c.changes.find(x => x.clauseId === draft.clauseId
    && x.status === 'pending' && x.authorSide === side && x.roundN === roundN);
  /* ---------- AND WHETHER THE HEADING MOVED (owner-asked 28 Aug 2026) ----------
     A rename is proposed through the SAME funnel and the same record: nothing
     new is minted, `headingText` is the field insertClause has always carried,
     and every guard above — the executed-wording freeze, the desk rule, the
     review gate — applies to it without knowing it needs to.

     NULL MEANS THE FILING SAYS NOTHING ABOUT THE HEADING, which is what every
     caller that predates this passes and is why no existing route changes
     behaviour. A heading equal to the one the clause already carries is stored
     as '' rather than as itself: it is not a rename, and storing it would leave
     a record claiming one.

     THE TEST IS WHETHER THIS FILING MOVES WHAT THE RECORD SAYS, not merely
     whether it differs from the clause. Typing the original heading back over
     a pending rename is a genuine revision — the record has to stop claiming a
     rename — and measuring against the clause alone would have made it a no-op
     and left the stale rename standing. */
  const headStands = draft.changeType === 'modify'
    ? negoStandingHeading(c, draft.clauseId) : '';
  const headAsk = draft.changeType !== 'modify' ? null
    : draft.headingText == null ? null
    : (String(draft.headingText).trim() === headStands ? '' : String(draft.headingText).trim());
  const headingMoved = headAsk != null
    && headAsk !== String((live && live.headingText) || '').trim();
  /* What is written onto the record. A modify uses the normalised reading
     above; every other kind keeps the raw field it always did. */
  const headingText = draft.changeType === 'modify' ? headAsk
    : (draft.headingText != null ? String(draft.headingText) : null);

  let formattingOnly = false;
  const bodyNoop = !!(draft.changeType === 'modify' && window.redlineIsNoop && redlineIsNoop(ops));
  if (bodyNoop){
    formattingOnly = _negoFormattingMoved(c, draft, live);
    /* ---- A HEADING RENAME JOINS THE FORMATTING-ONLY EXEMPTION ----
       It is a real change with no-op body ops, so without this the guard that
       stops a clause somebody merely LOOKED at filing a fingerprint would
       swallow it.
       BOTH HALVES ARE REQUIRED, and the second is what keeps this consistent
       with the wording beside it: the filing must MOVE what the record says
       about the heading, and the record must still be proposing one
       afterwards. So typing the original name back over a pending rename is
       refused with "nothing changed" — exactly as typing the original WORDING
       back over a pending edit already is — rather than leaving a change on the
       column that proposes nothing at all. Taking a rename back is Withdraw,
       which is the verb for it and is on the card. */
    const proposesHeading = headAsk != null ? !!headAsk : !!(live && live.headingText);
    if (!formattingOnly && !(headingMoved && proposesHeading)) return null;
  }
  /* ---- WHAT THE RECORD SAYS ABOUT ITSELF WHERE NOBODY WROTE A SUMMARY ----
     A rename with no wording change must not read "Wording changed — …": that
     is the record stating something untrue about the clause, quietly, for the
     life of the negotiation. English, like every other stamped string here. */
  const headLine = `“${headStands || '—'}” → “${(headAsk || headStands) || '—'}”`;
  const autoSummary = bodyNoop
    ? (formattingOnly
        ? (headingMoved ? `${NEGO_FMT_ONLY_SUMMARY}; heading ${headLine}` : NEGO_FMT_ONLY_SUMMARY)
        : `Heading changed — ${headLine}`)
    : (headingMoved
        ? `${negoSummariseOps(draft.changeType, ops, oldText, newText)}; heading ${headLine}`
        : negoSummariseOps(draft.changeType, ops, oldText, newText));

  if (live){
    /* A revision: same slot, new content, new link in the chain. The previous
       wording is pushed onto revisions[] with its hash intact, which is what
       makes "recover the wording as it stood two revisions ago" a read rather
       than an archaeology exercise. */
    live.revisions = Array.isArray(live.revisions) ? live.revisions : [];
    live.revisions.push({ seq: live.seq, hash: live.hash, hashV: live.hashV,
      prevChangeHash: live.prevChangeHash, clauseId: live.clauseId, changeType: live.changeType,
      oldText: live.oldText, newText: live.newText, author: live.author,
      createdAt: live.createdAt, ops: live.ops, bodyHtml: live.bodyHtml,
      summary: live.summary });
    live.changeType = draft.changeType;
    live.oldText = oldText;
    live.newText = newText;
    live.bodyHtml = draft.bodyHtml != null ? draft.bodyHtml : live.bodyHtml;
    live.headingText = headingText != null ? headingText : live.headingText;
    live.ops = ops;
    /* Recomputed on every revision: a formatting-only ask revised into a
       wording change stops being formatting-only, and the flag must follow. */
    live.formattingOnly = formattingOnly;
    live.createdAt = at;
    live.updatedAt = at;
    /* ---------- WHO ACTUALLY WROTE THE WORDING THAT IS THERE NOW ----------
       A revision keeps the change's id, its slot and its AUTHOR — the ask is
       still the person's who raised it. What it did not keep was any record on
       the change itself of who had rewritten it, so a colleague reviewing a
       redline could open the clause, retype it, and the card would go on
       attributing their words to the original author. The audit line named them
       correctly; the thing anybody actually looks at did not.

       That matters most in exactly the case it was found in: an internal
       reviewer correcting the wording they are being asked to clear. "Who wrote
       this" is not a detail on a document heading for signature.

       Recorded HERE, in the funnel, so every route inherits it — the direct
       edit, the clause library, Copilot, the playbook and the Word round-trip
       all arrive at this line without knowing they need to.

       CLEARED when the author revises their own ask again: the wording is
       theirs once more, and a stale "revised by" would be a claim about the
       present that stopped being true. */
    if (String(author) !== String(live.author)){
      live.revisedBy = author;
      live.revisedAt = at;
    } else {
      delete live.revisedBy;
      delete live.revisedAt;
    }
    live.summary = String(opts.summary || '').trim() || autoSummary;
    await negoIssue(c, live, { revisionOf: live.revisions[live.revisions.length - 1].hash });
    if (window.logAudit) logAudit(c, 'Negotiation',
      `#${live.id} revised by ${author} — “${live.summary}” on ${live.clauseLabel || live.clauseId};` +
      ` revision ${live.revisions.length + 1}, fingerprint ${live.hash},` +
      ` chained onto ${negoShortHash(live.prevChangeHash)} — the previous wording remains on the record`);
    return live;
  }

  const cl = negoClauseById(c, draft.clauseId);
  const ch = {
    id: negoNextId(c),
    clauseId: draft.clauseId,
    changeType: draft.changeType,
    oldText, newText,
    bodyHtml: draft.bodyHtml || null,
    headingText: headingText || null,
    afterClauseId: draft.afterClauseId || null,
    ops,
    hash: null, hashV: NEGO_HASH_V, prevChangeHash: null, seq: 0,
    revisions: [],
    status: 'pending',
    author, authorSide: side,
    /* Null on everything that genuinely came from them — see above. Set only
       when somebody on this workspace typed it wearing their hat. */
    enteredBy: enteredBy || null,
    createdAt: at, updatedAt: at,
    roundN,
    formattingOnly,
    clauseLabel: draft.clauseLabel || negoClauseLabel(cl) || null,
    summary: String(opts.summary || '').trim() || autoSummary,
    note: opts.note || null,
    /* WHY THE ASKER ASKED, IN THEIR OWN WORDS — and deliberately not `note`.
       `note` is provenance: "Copilot — Simplify", written by the
       tool that produced the wording, and it is an internal aside that has
       never crossed the table (f143 holds that line). A reason is the opposite
       kind of thing: a person explaining what they wanted, written to be read
       by the other side. Putting them in one field would either leak which
       clauses a model drafted or silence the reasons — one field cannot mean
       both. */
    why: String(opts.why || '').trim() || null,
    thread: [],
    needsReview: !!draft.needsReview,
    needsReviewWhy: draft.needsReviewWhy || null,
  };
  /* ---- ONE PROPOSAL ON THE TABLE (owner-approved 15 Aug 2026) ----
     A filing on a clause that already carries a pending change the fold above
     did not cover — the other side's ask, or our own from another round — is a
     COUNTER, and the market is unanimous about what a counter does: it takes
     the table, and the earlier proposal becomes history. Word and Google Docs
     make rivals unrepresentable by layering; the CLM platforms (Juro,
     Ironclad, SpotDraft) make the counter the position on the table with the
     prior position kept as a version; nobody draws two rivals as equals with
     independent Accept buttons — which is the state this product was in, and
     it cost the paper one of its tags, the column a working card, and (worst)
     let accept-both silently keep only the second.

     `superseded` is the status every list, count and share payload already
     filter — built long ago and never set by anything until this line. The
     stepped-down ask keeps its hash, its place in the chain and its record;
     the audit trail names both sides of the exchange; and `counterOf` on the
     new change is what the card prints so a replacement is never unexplained.

     INSERTIONS ARE EXEMPT in both directions, deliberately: a proposed new
     clause's id exists only on the proposal, so an edit to it is layered work
     on ground the insertion provides — superseding the insertion would delete
     the ground the edit stands on. Both stay, and the paper's per-clause tag
     list (part A of the same work order) draws them honestly. */
  const rivals = draft.changeType === 'insertClause' ? [] :
    c.changes.filter(x => x && x.clauseId === draft.clauseId && x.status === 'pending'
      && x.changeType !== 'insertClause');
  if (rivals.length){
    const localSide = (typeof window !== 'undefined' && window.PORTAL_MODE) ? 'counterparty' : 'owner';
    /* Read BEFORE the supersession: unsent is a fact about pending asks. */
    const unsentHere = new Set((typeof negoUnsentAsks === 'function'
      ? negoUnsentAsks(c, localSide) : []).map(x => x.id));
    const newest = rivals.slice().sort((a, b) => (a.seq || 0) - (b.seq || 0)).pop();
    for (const r of rivals){
      r.status = 'superseded';
      r.supersededBy = ch.id;
      r.supersededAt = at;
      /* THE OWNER IS TOLD when an arrival set aside their own internal work —
         a draft they never sent was not answered by this counter, it was
         overtaken, and silence here is the "product asserting something the
         person did not do" class of fault. A sent ask needs no notice: the
         counter IS the reply, and the card says so. */
      if (r.authorSide === localSide && side !== localSide && unsentHere.has(r.id)
          && typeof window !== 'undefined' && window.toast)
        toast(i18t('ng_draft_superseded', { old: r.id, label: r.clauseLabel || r.clauseId }));
    }
    ch.counterOf = newest ? newest.id : null;
    if (window.logAudit && !opts.quiet) logAudit(c, 'Negotiation',
      `#${ch.id} supersedes ${rivals.map(x => '#' + x.id).join(', ')} on ` +
      `${ch.clauseLabel || ch.clauseId} — one proposal on the table; the earlier ` +
      `wording stays on the record with its fingerprint`);
  }
  await negoIssue(c, ch);
  c.changes.push(ch);
  if (window.logAudit && !opts.quiet) logAudit(c, 'Negotiation',
    `#${ch.id} proposed by ${author} in round ${roundN} — “${ch.summary}”` +
    ` on ${ch.clauseLabel || ch.clauseId} · fingerprint ${ch.hash}` +
    `${side === 'counterparty' && !enteredBy ? ' (the counterparty\'s wording, recorded in their name)' : ''}` +
    /* The trail must never read as "they asked for this" when somebody here
       typed it. It names both parties to the act: whose ask it is, and whose
       hands entered it. */
    `${enteredBy ? ` — ENTERED BY ${enteredBy} on behalf of ${author}, not received from them` : ''}` +
    `${opts.via ? ` · received via ${opts.via}` : ''}`);
  return ch;
}

/* ---------- the three change types, as callable edits ---------- */

/* An edit to one clause's body, arriving as RICH content from the editor. The
   comparison is against the ROUND BASELINE, not against the working document,
   so re-editing a clause twice in one turn produces one change measuring the
   whole distance travelled rather than two measuring halves of it. */
async function negoEditClause(c, clauseId, newBodyHtml, opts = {}){
  negoInit(c);
  /* NOT the round baseline — the clause as it currently stands, which is what
     the editor was seeded from and therefore what this edit is an edit OF. See
     negoClauseNowById; on a clause with nothing adopted the two are one text. */
  const cl = negoClauseNowById(c, clauseId);
  if (!cl) return null;
  const body = window.sanitizeRich ? sanitizeRich(newBodyHtml) : String(newBodyHtml || '');
  const newText = window.richToText ? richToText(body) : '';
  /* ---- A FRONT-MATTER EDIT MAY NOT CHANGE WHAT THE CLAUSES ARE ----
     A heading pasted into the recital is a NEW CLAUSE as far as the model is
     concerned, and the agreement would re-segment under a reader who was
     correcting a party's name. clauseReplaceFront measures exactly that and
     refuses; the trial is run HERE, at the door, so the reader is told in words
     at the moment they press rather than having the change file, travel, and
     then quietly fail to apply when the round closes. Measured against the
     ROUND BASELINE, because that is what negoBuildBody replays from. */
  if (negoIsFrontId(clauseId) && window.clauseReplaceFront){
    let ok = null;
    try{ ok = clauseReplaceFront(negoBaseBody(c), body); }catch(_){ ok = null; }
    if (ok == null){
      const why = i18t('ne_front_restructures');
      negoLastRefusal = why;
      if (!opts.quiet && window.toast) toast(why, 'err');
      return null;
    }
  }
  /* ---- THE HEADING RIDES WITH THE WORDING (owner-asked 28 Aug 2026) ----
     One editor, one press, one record: the heading is part of the clause the
     reader opened, so renaming it is not a second act with a second door. An
     ABSENT opts.headingText says nothing about the heading, which is what
     every caller written before this passes — so the playbook, the Word round
     trip, Copilot and the clause library all file exactly as they did. */
  return negoFileChange(c, { clauseId, changeType: 'modify',
    oldText: cl.text, newText, bodyHtml: body,
    headingText: opts.headingText == null ? null : String(opts.headingText),
    clauseLabel: negoClauseLabel(cl) }, opts);
}
/* A new clause, placed where it was proposed. `afterClauseId` is the clause it
   follows — null puts it at the top. The id is minted at FILING time and
   written into the document when the change is accepted, so a change and the
   clause it creates are the same clause from the first moment either exists. */
async function negoInsertClause(c, afterClauseId, clause, opts = {}){
  negoInit(c);
  const taken = new Set(negoClauseList(c).map(x => x.clauseId).filter(Boolean));
  for (const x of negoChanges(c)) if (x.clauseId) taken.add(x.clauseId);
  const clauseId = window.clauseNewId ? clauseNewId(taken) : ('cl_' + Date.now().toString(36));
  const body = window.sanitizeRich ? sanitizeRich(clause.bodyHtml || '') : String(clause.bodyHtml || '');
  const newText = window.richToText ? richToText(body) : '';
  const headingText = String(clause.headingText || '').trim();
  return negoFileChange(c, { clauseId, changeType: 'insertClause',
    oldText: '', newText, bodyHtml: body, headingText, afterClauseId: afterClauseId || null,
    clauseLabel: headingText ? negoClauseLabel(clauseParseHeading(headingText)) : 'New clause' }, opts);
}
/* ---- REVISING A CLAUSE YOU PROPOSED (owner-asked 25 Aug 2026: "standard
   clauses added should be editable as well") ----
   A clause added from the playbook or the standards library is filed as an
   insertClause ask, and until now it was the ONE thing on the paper with no way
   back into it: the clause is not in the baseline, so every editing door in the
   product — which resolves its subject with negoClauseById — found nothing and
   stood down. A reader who added a payment-terms clause and wanted to change
   thirty days to forty-five had to withdraw the ask and add it again.

   IT IS THE FUNNEL'S OWN REVISION FOLD, NOT A NEW ACT. negoFileChange already
   revises in place when the same side files again on the same clause in the
   same round — that is what makes a second Direct Edit a revision rather than a
   rival — and an insert is no different. So this files the SAME clauseId back
   through the same funnel: the ask keeps its id, its author and its place in
   the document, its previous wording goes onto revisions[] with its hash
   intact, and a new fingerprint is issued. Every guard the funnel carries —
   the desk rule, the review gate, the executed-wording freeze — applies
   unchanged, because none of them is repeated here.

   IT REFUSES TO CREATE ONE. negoInsertClause mints a fresh clauseId every
   time; this one only ever revises, so it returns null unless there really is
   a pending insert of OUR OWN on that clause to revise. Without that check a
   mistyped id would file a second, invisible clause into the agreement. */
async function negoReviseInsert(c, clauseId, clause, opts = {}){
  negoInit(c);
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const roundN = negoRound(c);
  const live = negoChanges(c).find(x => x && x.clauseId === clauseId
    && x.changeType === 'insertClause' && x.status === 'pending' && !x.withdrawn
    && x.authorSide === side && x.roundN === roundN);
  if (!live) return null;
  const body = window.sanitizeRich ? sanitizeRich(clause.bodyHtml || '') : String(clause.bodyHtml || '');
  const newText = window.richToText ? richToText(body) : '';
  /* The heading is the ask's own unless this call carries a new one — the
     editor writes the wording and never the label, so an absent headingText
     here means "leave it as it is" rather than "clear it". */
  const headingText = clause.headingText != null
    ? String(clause.headingText).trim() : String(live.headingText || '');
  return negoFileChange(c, { clauseId, changeType: 'insertClause',
    oldText: '', newText, bodyHtml: body, headingText,
    afterClauseId: live.afterClauseId || null,
    clauseLabel: headingText ? negoClauseLabel(clauseParseHeading(headingText)) : 'New clause' }, opts);
}
/* A proposed deletion. The wording is NOT removed here and is not removed when
   the change is filed — it is struck through in the working pane and stays in
   the document until someone accepts the deletion. */
async function negoDeleteClause(c, clauseId, opts = {}){
  negoInit(c);
  /* The wording being struck out is the wording on screen, which on a clause
     carrying an adopted change is not the baseline's. Same reading as the edit
     above, and for the same reason. */
  const cl = negoClauseNowById(c, clauseId);
  if (!cl) return null;
  return negoFileChange(c, { clauseId, changeType: 'deleteClause',
    oldText: cl.text, newText: '', clauseLabel: negoClauseLabel(cl) }, opts);
}

/* ---------- a whole proposed document becomes changes ----------
   The route a returned .docx and a pasted redraft arrive by. The comparison is
   per clause, keyed on the durable clause id, which gives all three kinds
   honestly: a clause in both whose wording differs is a modify; one only in the
   proposal is an insertClause; one only in the baseline is a deleteClause.

   Matching by id first and by POSITION second is the part worth stating. A
   document that has been through Word has no clause ids on it — Word does not
   carry our attributes — so the returned text is aligned to the baseline
   clause by clause in document order, and a clause whose wording moved is
   still recognised as the same clause. That is the honest reading of what a
   counterparty who edited our file actually did. */
async function negoFileProposal(c, proposedText, opts = {}){
  negoInit(c);
  const next = String(proposedText == null ? '' : proposedText);
  if (!next.trim()) return [];
  /* Did the proposal arrive as a DOCUMENT or as a text projection? A returned
     .docx and a pasted redraft arrive as text, and text has no list structure
     in it — so a proposal lifted from text must be merged back into the
     baseline clause's own markup rather than used as-is, or accepting it would
     replace an <ol start="3"> with a flat <p> and silently lose the document's
     numbering. That is the B-004 failure class, and this is where it would
     otherwise re-enter through the whole-document route. */
  const fromText = !/<[a-z]/i.test(next);
  const proposedBody = fromText ? negoProposedBodyFromText(c, next) : next;
  const baseClauses = negoClauseList(c);
  const nextClauses = window.clauseSegment ? clauseSegment(proposedBody) : [];
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

  const byId = new Map();
  for (const cl of nextClauses) if (cl.clauseId) byId.set(cl.clauseId, cl);
  /* Clauses the returned document could not be matched to by id, in order —
     the Word case. */
  const loose = nextClauses.filter(cl => !cl.clauseId || !baseClauses.some(b => b.clauseId === cl.clauseId));
  const usedLoose = new Set();

  const filed = [];
  const matchedBase = new Set();
  for (let i = 0; i < baseClauses.length; i++){
    const was = baseClauses[i];
    let now = byId.get(was.clauseId) || null;
    if (!now){
      /* fall back to position among the unmatched, which is how a Word round
         trip has to be read: same slot, possibly reworded */
      const cand = loose[i] !== undefined && !usedLoose.has(i) ? loose[i] : null;
      if (cand){ now = cand; usedLoose.add(i); }
    }
    if (!now) continue;
    matchedBase.add(was.clauseId);
    if (norm(was.text) === norm(now.text)) continue;
    const ch = await negoFileChange(c, { clauseId: was.clauseId, changeType: 'modify',
      oldText: was.text, newText: now.text,
      bodyHtml: fromText ? negoBodyFromText(was.bodyHtml, now.text) : now.bodyHtml,
      clauseLabel: negoClauseLabel(was) },
      /* ---- A REASON IS `why`, NOT `note` ----
         This filed the asker's reason into `note`, and `note` is the field
         this very funnel documents as provenance — "Copilot — Simplify" —
         internal, shown only to the side that wrote it, never crossing the
         table. So a counterparty who typed "Net-60 is our standard payment
         term" had it collected by the portal, carried in the response, matched
         to the right clause by negoNoteFor, and then filed into the one field
         built to be hidden. The card that asks "Why they asked" reads `why`
         alone, so it rendered nothing: the reason survived the entire journey
         and was thrown away at the last step.

         opts.note still passes through as provenance for whatever set it. */
      { ...opts, quiet: true,
        why: negoNoteFor(opts.notes, now.text, was.clauseId) || opts.why || null,
        note: opts.note || null });
    if (ch) filed.push(ch);
  }
  for (let i = 0; i < loose.length; i++){
    if (usedLoose.has(i)) continue;
    const cl = loose[i];
    if (!cl.text.trim()) continue;
    const after = baseClauses[Math.min(i, baseClauses.length) - 1] || null;
    const ch = await negoInsertClause(c, after ? after.clauseId : null,
      { headingText: cl.headingText, bodyHtml: cl.bodyHtml }, { ...opts, quiet: true });
    if (ch) filed.push(ch);
  }
  for (const was of baseClauses){
    if (matchedBase.has(was.clauseId)) continue;
    const ch = await negoDeleteClause(c, was.clauseId, { ...opts, quiet: true });
    if (ch) filed.push(ch);
  }

  if (filed.length && window.logAudit){
    const side = opts.side === 'owner' ? 'owner' : 'counterparty';
    const author = String(opts.author || (side === 'owner'
      ? ((window.currentUser && window.currentUser()?.name) || 'This workspace')
      : (c.counterparty || 'The counterparty'))).trim();
    logAudit(c, 'Negotiation',
      `${filed.length} change${filed.length === 1 ? '' : 's'} proposed by ${author}` +
      ` in round ${negoRound(c)} — ${filed.map(x => '#' + x.id).join(', ')}` +
      `${side === 'counterparty' ? ' (the counterparty\'s wording, recorded in their name)' : ''}` +
      `${opts.via ? ` · received via ${opts.via}` : ''}`);
  }
  return filed;
}

/* ---------- THE RETURNED WORD FILE, WHOLE ----------
   One door for the file a counterparty sends back after marking up our Word
   export: the wording differences arrive as ordinary counterparty changes
   through negoFileProposal — same fingerprints, same cards, same wall — and
   the MARGIN COMMENTS come with them instead of vanishing. docxComments
   reads the part of the file docxExtract never opens; each comment is
   matched to a discussion topic by the wording it was anchored to, because
   the quote is the only thing a Word file and our clause model share.
   Posting the comments is the caller's job (server or local store) — this
   function reads and files, it does not talk to a network. */
async function negoImportReturnedDocx(c, bytes, opts = {}){
  if (!window.docxExtract) throw new Error('The Word reader is not loaded on this page');
  const read = await docxExtract(bytes);
  const text = String((read && read.text) || '');
  if (!text.trim()) throw new Error('That file has no readable wording in it');
  const author = String(opts.author || c.counterparty || 'Counterparty').trim();
  const filed = await negoFileProposal(c, text, { side: 'counterparty', author,
    via: 'a returned Word file' });
  const comments = (window.docxComments ? await docxComments(bytes) : []).map(cm => {
    const t = negoTopicForQuote(c, cm.quote || cm.text);
    return { ...cm, topic: t.topic, topicLabel: t.label };
  });
  return { filed, comments, tracked: (read && read.tracked) || null };
}
/* Which discussion topic a quoted passage belongs to. The same clause keys
   discussTopics hands the composer, derived the same way, so a comment lands
   in the thread the panel already draws for that clause. No match is honest:
   the comment files against the contract generally rather than being dropped
   or pinned to a guess. */
function negoTopicForQuote(c, quote){
  const fallback = { topic: (window.DISCUSS_GENERAL || 'general'), label: null };
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const q = norm(quote);
  if (!q) return fallback;
  /* Containment first; WORD OVERLAP second, because a comment is usually
     anchored on the wording the counterparty CHANGED — which by definition is
     not in our baseline verbatim. The clause it belongs to still shares most
     of its words with the quote, and no other clause does. Below half shared,
     honesty wins: the contract generally, not a guess. */
  const words = s => new Set(norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 3));
  const qw = words(q);
  const lines = String(window.docPlainText ? docPlainText(c) : '').split('\n');
  let best = null, bestScore = 0;
  for (let i = 0; i < lines.length; i++){
    const line = lines[i];
    if (!line.trim()) continue;
    if (window.docLineKind && docLineKind(line) === 'heading') continue;
    const l = norm(line);
    if (!l) continue;
    if (l.includes(q) || q.includes(l)){ best = { line, i }; bestScore = 1; break; }
    if (qw.size){
      const lw = words(l);
      let hit = 0;
      for (const w of qw) if (lw.has(w)) hit++;
      const score = hit / qw.size;
      if (score > bestScore){ bestScore = score; best = { line, i }; }
    }
  }
  if (!best || bestScore < 0.5) return fallback;
  return { topic: window.discussClauseKey ? discussClauseKey(best.line, best.i) : fallback.topic,
    label: window.discussTrim ? discussTrim(best.line, 70) : best.line.slice(0, 70) };
}

/* ---------- WHERE THE NEGOTIATION STARTED ----------
   The round-1 baseline, read from the archive once round 1 has closed and
   from the live baseline while it is still in flight. This is what the
   cumulative redline measures against, and it never moves after the first
   round closes — negoAdvanceRound archived it verbatim. */
function negoOriginalBaselineText(c){
  const n = c && c.negotiation;
  if (!n) return '';
  if (Array.isArray(n.rounds) && n.rounds.length && n.rounds[0].baselineText != null)
    return String(n.rounds[0].baselineText);
  return String(n.baselineText || '');
}
/* Which clauses moved since the original, and how many times — counted from
   the ACCEPTED changes the engine archived, across every round. A clause the
   parties fought over and left alone (rejected, withdrawn) did not move. */
function negoClauseJourney(c){
  const all = (typeof negoAllChanges === 'function') ? negoAllChanges(c) : [];
  const map = new Map();
  for (const ch of all){
    if (!ch || ch.status !== 'accepted') continue;
    const k = String(ch.clauseLabel || ch.clauseId || '').trim() || '(unlabelled)';
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
}

/* A proposal that arrived as TEXT, lifted back into a document.

   THIS IS THE FIX FOR THE PHANTOM-CHANGE BUG (B-010). It matters which way the
   lift is done, and the obvious way is wrong.

   negoRichFromLines() builds a document from nothing but the lines, and it has
   to decide what is a heading from the text alone — so it promotes any line in
   CAPITALS. In a real contract the signature block and the schedule titles are
   in capitals on their own lines:

       BUYER: SUPPLIER:
       SCHEDULE A: MATERIAL SPECIFICATIONS

   In the SOURCE document those are paragraphs inside the miscellaneous clause.
   Lifted from text they become HEADINGS, which opens clauses the baseline does
   not have — so the clause they were sitting in appears truncated (a phantom
   deletion) and each promoted line appears as a brand-new clause (a phantom
   insertion). Opening a contract and touching nothing produced a screen full of
   changes nobody had made.

   The baseline is right there and already knows the answer. richFromTextEdit()
   maps the new lines onto the baseline's OWN block structure — a paragraph
   stays a paragraph, a list item stays a list item — and verifies its own
   output before returning it. So the proposal is segmented exactly as the
   baseline is, and only wording that genuinely moved can register as a change.

   negoRichFromLines stays as the fallback for the one case it is right for: a
   document that has no prior structure to preserve, either because there is no
   baseline yet or because the edit changed the shape so much that the mapping
   could not be verified. */
function negoProposedBodyFromText(c, text){
  const base = negoBaseBody(c);
  if (base && base.trim() && window.richFromTextEdit){
    const merged = richFromTextEdit(base, text);
    if (merged) return merged;
  }
  return negoRichFromLines(text);
}

/* The reason a counterparty gave for ONE clause, matched to the change filed
   for that clause. Keyed on the wording they annotated — a reply composed
   against a text projection carries no clause ids — with the clause id accepted
   too, for callers that do have one. Substring matching is allowed in one
   direction only: a note written about a whole clause still belongs to it when
   the clause is one line of a longer block. */
function negoNoteFor(notes, text, clauseId){
  if (!notes) return null;
  if (clauseId && notes[clauseId]) return notes[clauseId];
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const want = norm(text);
  if (!want) return null;
  if (notes[want]) return notes[want];
  for (const k of Object.keys(notes)){
    const kk = norm(k);
    if (kk && (want.includes(kk) || kk.includes(want))) return notes[k];
  }
  return null;
}

/* Put edited TEXT back into a clause's own markup.
   richFromTextEdit() maps the new lines onto the existing block structure and
   VERIFIES its own output's text projection against what was asked for; it
   returns null rather than guess. Where it can do the job, the clause keeps its
   list, its numbering and its inline marks. Where it cannot, the clause falls
   back to paragraphs — and only that clause, not the document. */
function negoBodyFromText(oldBodyHtml, newText){
  if (window.richFromTextEdit && oldBodyHtml){
    const merged = richFromTextEdit(oldBodyHtml, newText);
    if (merged) return merged;
  }
  return String(newText || '').split('\n').filter(l => l.trim())
    .map(l => `<p>${_negoEsc(l.trim())}</p>`).join('');
}

/* ---------- the working document ----------
   negoResolvedBody BUILDS the document from the accepted set. It does not
   mutate a document and hope: rejecting every change reproduces the baseline
   exactly, and because this works on the rich DOM that equality holds at the
   canonicalRich level rather than only on a text projection.

   A PENDING change is not in the document. It is drawn as a redline over it
   (from the STORED ops) so the reviewer sees what is being asked for, but the
   words are still the baseline's until someone says yes.

   Order is deliberate. Modifications first, then insertions, then deletions:
   an insertion anchored on a clause that is also being deleted still lands in
   the position it was proposed for, rather than falling off the end of the
   document because its anchor evaporated. */
function negoResolvedBody(c){ return negoBuildBody(c, x => x.status === 'accepted'); }
/* ---------- the document as it would read if everything were agreed ----------
   THE SAME BUILDER, over the accepted set PLUS the pending one.

   Reading a redline and reading a contract are two different acts, and the room
   only supported the first. Every screen in it draws what is being asked for —
   struck-through wording, inserted wording, a fingerprint in the margin — which
   is exactly right for deciding a change and exactly wrong for the question
   everybody asks next: what does this actually say if we agree to all of it?
   Answering it meant accepting every change to see, which is a decision, not a
   look.

   So this is a READ and nothing else: it builds a document, writes nothing, and
   the changes stay pending. A refused ask is not in it — silence still rejects,
   and a rejected change is settled, not outstanding.

   Withdrawn asks are excluded for the same reason: the side that made them has
   taken them off the table, so a document that assumed them would be assuming
   agreement to wording nobody is asking for any more. */
function negoCleanBody(c){
  return negoBuildBody(c, x => x.status === 'accepted'
    || (x.status === 'pending' && !x.withdrawn));
}
const negoCleanText = c => (window.richToText ? richToText(negoCleanBody(c)) : '');
function negoBuildBody(c, take){
  negoInit(c);
  let body = negoBaseBody(c);
  if (!window.clauseReplaceBody) return body;
  const accepted = negoChanges(c).filter(x => x.status !== 'superseded' && take(x))
    .slice().sort((a, b) => (a.seq || 0) - (b.seq || 0));

  for (const ch of accepted){
    if (ch.changeType !== 'modify') continue;
    /* A change that arrived without markup (an AI draft, an old payload) used
       to materialise as one flat escaped <p> — accepting it silently stripped
       the clause's lists and numbering. The honest reading is a MERGE: the
       new wording laid into the clause's own current markup, the same
       richFromTextEdit path every text proposal already takes. The flat <p>
       remains only as the last resort when there is nothing to merge into. */
    let replacement = ch.bodyHtml;
    if (!replacement){
      const was = clauseSegment(body).find(cl => cl.clauseId === ch.clauseId);
      replacement = (was && was.bodyHtml && typeof negoBodyFromText === 'function')
        ? negoBodyFromText(was.bodyHtml, ch.newText)
        : `<p>${_negoEsc(ch.newText)}</p>`;
    }
    /* ---- THE FRONT MATTER IS WRITTEN BACK AS A REGION ----
       Its blocks are the document's own words above the first clause, so they
       are replaced whole rather than by clause id. clauseReplaceFront refuses
       (null) any replacement that would change what the clauses ARE, and the
       refusal is honoured here in the safe direction: the region simply does
       not move, so the document is never left re-segmented. The filing door
       refuses in words long before this, so a reader never meets the silence. */
    const next = negoIsFrontId(ch.clauseId)
      ? (window.clauseReplaceFront ? clauseReplaceFront(body, replacement) : null)
      : clauseReplaceBody(body, ch.clauseId, replacement);
    if (next != null) body = next;
    /* ---- AND ITS HEADING, WHERE THE ASK RENAMED ONE ----
       clauseReplaceHeading keeps the element, its rank and its id and rewrites
       only the words, so a renamed clause is the same clause: every change
       already filed against it goes on pointing at it, and the ids the other
       side holds still resolve. A change that proposes no rename carries no
       headingText and this does nothing at all. */
    if (ch.headingText && window.clauseReplaceHeading){
      const withHead = clauseReplaceHeading(body, ch.clauseId, ch.headingText);
      if (withHead != null) body = withHead;
    }
  }
  for (const ch of accepted){
    if (ch.changeType !== 'insertClause') continue;
    const has = clauseSegment(body).some(cl => cl.clauseId === ch.clauseId);
    if (has) continue;
    let out = clauseInsert(body, ch.afterClauseId, { clauseId: ch.clauseId,
      headingText: ch.headingText || '', bodyHtml: ch.bodyHtml || `<p>${_negoEsc(ch.newText)}</p>` });
    if (!out){
      /* The clause it was to follow is gone — accepted for deletion in an
         earlier round, most likely. It goes to the end of the document and the
         record says so, rather than being dropped for want of an anchor. */
      const last = clauseSegment(body).slice(-1)[0];
      out = clauseInsert(body, last ? last.clauseId : null, { clauseId: ch.clauseId,
        headingText: ch.headingText || '', bodyHtml: ch.bodyHtml || `<p>${_negoEsc(ch.newText)}</p>` });
    }
    if (out) body = out.html;
  }
  for (const ch of accepted){
    if (ch.changeType !== 'deleteClause') continue;
    const next = clauseRemove(body, ch.clauseId);
    if (next != null) body = next;
  }
  return body;
}
const _negoEsc = s => String(s == null ? '' : s).replace(/[&<>]/g,
  ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
/* The text projection of the resolved document. Kept because the round model,
   the seal, search and the Copilot all read text — but it is now a READ of the
   rich document rather than the medium the document travels through. */
const negoResolvedText = c => (window.richToText ? richToText(negoResolvedBody(c)) : '');

/* Write the resolved document back into the contract.
   THIS IS 1.6, AND IT IS THE POINT. A rich contract is written as rich: the
   clause's body blocks were replaced in place, by id, on the DOM. There is no
   text round trip, so richFromTextEdit is never called, so the B-004
   formatting-loss failure class cannot occur — it is retired rather than
   guarded against. A plain-text contract is written as text, exactly as
   before. */
function negoCommitBody(c, body){
  const wasRich = !!(window.isRich && isRich(c.format) && c.redlineText != null);
  const text = window.richToText ? richToText(body) : '';
  if (wasRich){
    c.redlineText = window.sanitizeRich ? sanitizeRich(body) : body;
  } else {
    c.redlineText = text;
  }
  if (c.upload && window.isUpload && window.isUpload(c)){
    c.upload.extractedText = text;
    c.upload.textChars = text.length;
  }
  return { flattened: false, text };
}
/* Kept for callers that still speak text (the round model). */
function negoCommitText(c, text){
  const wasRich = !!(window.isRich && isRich(c.format) && c.redlineText);
  let flattened = false;
  if (wasRich && window.richFromTextEdit){
    const merged = richFromTextEdit(c.redlineText, text);
    if (merged) c.redlineText = merged;
    else { c.redlineText = text; c.format = window.TEXT_FORMAT || 'text'; flattened = true; }
  } else {
    c.redlineText = text;
    if (wasRich){ c.format = window.TEXT_FORMAT || 'text'; flattened = true; }
  }
  if (c.upload && window.isUpload && window.isUpload(c)){
    c.upload.extractedText = text;
    c.upload.textChars = text.length;
  }
  return { flattened };
}

/* ---------- deciding a change ----------
   Accept merges that one clause into the document. Reject leaves the clause at
   the baseline and the ask becomes an open point. Reopen puts it back to
   pending. All three are reversible, all three are recorded with the RIGHT
   author — the person deciding is not the person who proposed — and none of
   them moves a hash. */
function negoResolve(c, id, status, opts = {}){
  negoInit(c);
  const ch = negoChangeById(c, id);
  if (!ch) return null;
  if (!['pending', 'accepted', 'rejected'].includes(status)) return null;
  /* A superseded change is off the table — a counter took its place — and a
     thing that is not on the table takes no decision, in either direction. Its
     record is not rewritten and its verbs are not drawn; this line is for the
     callers that arrive by id (an old link's held decision, a replayed
     response code) after the table has moved. Quiet, like the other
     cannot-apply returns here: the surfaces that could ask already show why. */
  if (ch.status === 'superseded') return null;
  /* Read the permission through `window` deliberately, not as a bare call.
     js/core.js declares `const canEdit = …`, which is a LEXICAL binding rather
     than a property of the global object — so a bare `canEdit()` here resolves
     to that binding and cannot be substituted, while `window.canEdit` is the
     name every other module reaches this function by. */
  if (!opts.side && typeof window.canEdit === 'function' && !window.canEdit()){
    if (window.toast) toast(i18t('ne_viewers_no_decide'), 'err');
    return null;
  }
  /* NOBODY RULES ON THEIR OWN ASK. Enforced here, in the model, and not only in
     the UI — a side that could accept its own proposal could adopt wording the
     other party never saw. */
  if (opts.side && opts.side === ch.authorSide && status !== 'pending'){
    if (window.toast) toast(i18t('ne_not_own_proposal'), 'err');
    return null;
  }
  /* THE SIGNED DOOR, inlined when the Word round trip was removed. It used to
     live in js/wordflow.js as wordDoorClosed(), and losing that file would have
     quietly reduced this to `status === 'Signed'` — dropping the seal and the
     execution stamp from the test. An executed record takes no new decisions,
     however it came to be executed.

     Now asked through negoExecuted, which is that same test under a name. The
     numbering lock reads the identical fact and had no business writing the
     expression out a second time — two copies is how one of them comes to be
     the narrowed version this comment exists to warn about. */
  if (negoWordingFrozen(c)){
    /* ---- QUIET MEANS QUIET, AND THE REASON GOES BACK TO THE CALLER ----
       opts.quiet guarded only logAudit, so this drew a red box even from the
       BACKGROUND POLLER — applyResponse reaches both this and negoResolve with
       quiet:true for exactly this reason and never got it. An owner working
       anywhere in the app got a refusal about a contract they were not looking
       at: the negoSignalReady fault, which this rulebook records as unique and
       is not.
       And the reason is REMEMBERED rather than only shouted, because the
       caller's own message for this case said the wording "does not match any
       clause" — a different and untrue diagnosis, whose stated remedy (fix the
       clause reference) cannot work. The clause matched perfectly; the contract
       is locked because somebody has signed. */
    const why = i18t(negoExecuted(c) ? 'ne_executed_amend' : 'ne_signed_frozen');
    negoLastRefusal = why;
    if (!opts.quiet && window.toast) toast(why, 'err');
    return null;
  }
  /* ---- NO SECOND ACCEPTANCE SILENTLY DISCARDS A FIRST (15 Aug 2026) ----
     Two rivals measured against the same baseline replay in sequence when the
     agreed wording is rebuilt, so accepting the second used to overwrite the
     first — two "accepted" entries in the history, one wording in the
     contract, nothing said anywhere. The whole market refuses this state: Git
     makes it a conflict a human must resolve, and Word's Combine literally
     halts with "choose which set to keep". With the supersede-on-counter rule
     in the funnel this cannot arise on new work; this guard is for contracts
     that already hold rivals, and it refuses IN WORDS, naming the way out.
     SAME ROUND ONLY: a later round's ask measures the updated clause, so
     cross-round acceptance is sequential composition — how negotiation works —
     and must never be caught. Rejecting stays free: a refusal composes with
     anything. */
  /* ---- AND IT ASKS ABOUT THE WORDS, NOT ABOUT THE CLAUSE (15 Aug 2026) ----
     As first written this refused ANY second acceptance on a clause, and the
     note beside it said the state "cannot arise on new work" because a newly
     filed change supersedes an older rival. That was wrong in one word:
     supersession reaches a change still AWAITING AN ANSWER, never an adopted
     one. So the ordinary act of adopting a change and then editing another part
     of the same clause walked straight into a guard its author expected almost
     never to fire, and was refused. Reported on MK-311.

     The real question is not "is another change adopted here" but "were these
     two measured against the same wording" — see negoMeasuredAlike. Two
     measured from one starting point are rivals and the refusal stands. One
     measured against a text that already contains the other was written on top
     of it, and negoBuildBody's replacement in seq order composes them
     correctly with no change of its own. Legacy changes all carry the baseline
     and so all still compare alike: nothing already on the table is loosened. */
  if (status === 'accepted' && ch.changeType !== 'insertClause'){
    const adopted = c.changes.find(x => x && x !== ch && x.clauseId === ch.clauseId
      && x.status === 'accepted' && x.changeType !== 'insertClause'
      && (x.roundN || 1) === (ch.roundN || 1)
      && negoMeasuredAlike(x, ch));
    if (adopted){
      if (window.toast) toast(i18t('ng_accept_blocked_adopted', { id: adopted.id }), 'err');
      return null;
    }
  }
  /* ---- AND THE MIRROR OF IT: YOU CANNOT PULL THE FLOOR OUT ----
     The rule above lets a change be adopted on top of an adopted one. That
     makes the earlier one LOAD-BEARING: the later change's stored body was
     written over it and carries its wording inside, so reopening the earlier
     one alone would leave that wording standing in the contract with nothing
     adopted behind it — the record saying one thing and the document another,
     which is the whole class of fault the accept guard exists to prevent, let
     in through the other door.

     So the way back is taken in order: reopen or refuse what was built on top
     first. Only for a change something was ACTUALLY built on — a lone adopted
     change, or two rivals measured alike, reopen freely as they always have. */
  if (status === 'pending' && ch.status === 'accepted' && ch.changeType !== 'insertClause'){
    const built = c.changes.find(x => x && x !== ch && x.clauseId === ch.clauseId
      && x.status === 'accepted' && x.changeType !== 'insertClause'
      && (x.roundN || 1) === (ch.roundN || 1)
      && (x.seq || 0) > (ch.seq || 0)
      && !negoMeasuredAlike(x, ch));
    if (built){
      if (window.toast) toast(i18t('ng_reopen_blocked_downstream', { id: built.id }), 'err');
      return null;
    }
  }
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  const prev = ch.status;
  if (prev === status) return ch;

  negoInvalidateVerification(c);
  ch.status = status;
  /* A withdrawal answers ONE rejection. Rule on the change again — reopen it,
     accept it, refuse it afresh — and the acknowledgement is about a decision
     that no longer stands, so it goes with it. Leaving it would let a stale
     withdrawal report the parties as aligned over a live disagreement. */
  if (ch.withdrawn) ch.withdrawn = null;
  ch.resolvedBy = status === 'pending' ? null : who;
  ch.resolvedAt = status === 'pending' ? null : (window.nowISO ? window.nowISO() : new Date().toISOString());
  ch.reply = String(opts.reply || ch.reply || '').slice(0, 2000) || null;

  negoCommitBody(c, negoResolvedBody(c));

  const verb = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'reopened';
  if (window.logAudit) logAudit(c, 'Negotiation',
    `#${ch.id} ${verb} by ${who} — “${ch.summary}” on ${ch.clauseLabel || ch.clauseId},` +
    ` proposed by ${ch.author}` +
    `${status === 'accepted' ? ` · merged into the clean text · fingerprint ${ch.hash}` : ''}` +
    `${status === 'rejected' ? ' · the clause stays at the baseline and the ask travels back as an open point' : ''}` +
    `${status === 'pending' ? ` (was ${prev})` : ''}`);
  if (window.captureVersion && status !== 'pending')
    captureVersion(c, `#${ch.id} ${verb} — ${ch.clauseLabel || ch.clauseId}`, who, { auto: true });
  c.lastAction = window.todayStr ? window.todayStr() : c.lastAction;
  return ch;
}
/* Accept or reject everything still undecided, in one pass. Nothing pending is
   not an error and not a no-op dressed as success — it says so. */
function negoResolveAll(c, status, opts = {}){
  const pending = negoPending(c);
  if (!pending.length) return [];
  const out = [];
  for (const ch of pending){ if (negoResolve(c, ch.id, status, opts)) out.push(ch); }
  return out;
}

/* ---------- withdrawing an ask ----------
   THE DEADLOCK THIS EXISTS TO BREAK.

   "Ready to sign" is gated on the parties being aligned, and a rejected change
   is not agreement — it is one side asking for something and the other side
   saying no. If "aligned" meant only "nothing pending", a refusal would count
   as settled and the button would go green over a live disagreement. If it
   meant "everything accepted", a single refusal would block signature forever
   and neither party could ever get out, which is worse than the bug it fixes.

   So a rejected change is settled when THE PARTY WHO ASKED accepts the refusal
   and takes the ask off the table. That is this verb. It is an acknowledgement,
   not a second rejection: the change keeps its status, its author, its
   fingerprint and its reply, and the record still reads "proposed, refused,
   and the proposer let it go" rather than pretending the ask never happened.

   Only the proposer may press it. A side that could withdraw the OTHER side's
   ask could clear the board of every objection raised against its own wording
   and then report the deal as aligned — the same class of thing negoResolve's
   "nobody rules on their own ask" rule exists to prevent, in the other
   direction. */
function negoWithdraw(c, id, opts = {}){
  negoInit(c);
  const ch = negoChangeById(c, id);
  if (!ch) return null;
  if (ch.status !== 'rejected'){
    if (window.toast) toast(i18t('ne_only_refused_withdraw'), 'err');
    return null;
  }
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  if (side !== ch.authorSide){
    if (window.toast) toast(i18t('ne_only_asker_withdraw'), 'err');
    return null;
  }
  if (ch.withdrawn) return ch;                    // idempotent; pressing twice is not two events
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  ch.withdrawn = { by: who, side, at: (window.nowISO ? window.nowISO() : new Date().toISOString()) };
  if (window.logAudit) logAudit(c, 'Negotiation',
    `#${ch.id} withdrawn by ${who} — “${ch.summary}” was refused and the side that asked for it has`
    + ` accepted the refusal; the point is no longer outstanding between the parties`);
  c.lastAction = window.todayStr ? window.todayStr() : c.lastAction;
  return ch;
}
/* Put a withdrawn ask back on the table. The counterpart to the verb above, for
   the same reason every other decision on this screen is reversible: a control
   that cannot be undone is one people are afraid to press. */
function negoUnwithdraw(c, id, opts = {}){
  const ch = negoChangeById(c, id);
  if (!ch || !ch.withdrawn) return null;
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  if (side !== ch.authorSide) return null;
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  ch.withdrawn = null;
  if (window.logAudit) logAudit(c, 'Negotiation',
    `#${ch.id} put back on the table by ${who} — the withdrawal was undone and the refused ask is outstanding again`);
  return ch;
}

/* ---------- retracting an unsent draft ----------
   Withdraw (above) is for an ask the other side has seen and refused; this is
   for one they have never seen. Until the round is handed over a draft exists
   only on its author's desk, so taking it back removes the record outright —
   there is nothing to acknowledge and nobody to notify. A sent or decided
   change is refused here for the same reason Redline.removeChange refuses
   them: deleting what the other side is relying on rewrites history. */
function negoRetractDraft(c, id, opts = {}){
  negoInit(c);
  const ch = negoChangeById(c, id);
  if (!ch) return null;
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  if (ch.authorSide !== side){
    if (window.toast) toast(i18t('ne_only_drafter_retract'), 'err');
    return null;
  }
  if (ch.status !== 'pending'){
    if (window.toast) toast(i18t('ne_retract_decided'), 'err');
    return null;
  }
  /* ---- WHAT COUNTS AS UNSENT IS THE CALLER'S ANSWER WHERE IT HAS ONE ----
     (owner-reported, 15 Aug 2026 — OI-6, and reproduced before it was touched.)

     negoUnsentAsks measures against the turn stamp, which is the right reading
     on our own record and the wrong one on the counterparty's page. Their copy
     is rebuilt from a share payload on every repaint and holds its own drafts
     in a store of its own; and before the first hand-over there is no turn
     stamp at all, at which point that function answers "nothing on THIS side is
     unsent" for the counterparty by construction. So this refused every draft
     they had ever written — the card drew a Retract button (the page knew the
     draft was unsent) and pressing it produced "this change has already been
     sent", over a change that had never left their browser. Two readings of one
     fact, disagreeing, with the untrue one doing the talking.

     The page holding the drafts is the authority on which of them have gone, so
     it may say. Absent, the model answers as it always has — which is every
     caller on our own side, unchanged. */
  const given = opts.unsentIds;
  const unsent = (given instanceof Set) ? given
    : Array.isArray(given) ? new Set(given.map(String)) : null;
  const isUnsent = unsent ? unsent.has(String(id))
    : negoUnsentAsks(c, side).some(x => x && x.id === id);
  if (!isUnsent){
    if (window.toast) toast(i18t('ne_retract_already_sent'), 'err');
    return null;
  }
  const i = c.changes.findIndex(x => x && x.id === id);
  if (i < 0) return null;
  c.changes.splice(i, 1);
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  if (window.logAudit) logAudit(c, 'Negotiation',
    `#${ch.id} retracted by ${who} — “${ch.summary || ch.clauseLabel || ch.clauseId}” was never sent, so nothing was withdrawn from anyone`);
  c.lastAction = window.todayStr ? window.todayStr() : c.lastAction;
  return ch;
}

/* ---------- finding a highlighted passage in a clause ----------
   What the browser hands back from a selection is not byte-for-byte what the
   clause model stores: rendering puts line breaks between sub-clauses,
   typography turns straight quotes smart, and pasted wording carries
   non-breaking and zero-width characters. An exact indexOf over that said
   "couldn't be matched" about a passage any reader could see was there.

   The MATCH is tolerant, the ANSWER is exact. Both sides are normalised —
   smart quotes straightened, zero-width characters stripped, whitespace runs
   collapsed to one space — and an index map is kept for the clause while it
   normalises, so a hit comes back as REAL offsets into the clause's stored
   text. A splice at those offsets touches exactly the wording that was
   chosen, never a normalised approximation of it. */
function negoNormChar(ch){
  if (/[“”„«»]/.test(ch)) return '"';   // smart double quotes
  if (/[‘’‚]/.test(ch)) return "'";               // smart single quotes
  if (/[\u200B-\u200D\uFEFF]/.test(ch)) return '';              // zero-width characters
  if (/\s/.test(ch)) return ' ';                                 // \s covers NBSP too
  return ch;
}
function negoNormalizeText(s){
  let out = '';
  for (const ch of String(s == null ? '' : s)){
    const n = negoNormChar(ch);
    if (n === ' ' && (out === '' || out.endsWith(' '))) continue;
    out += n;
  }
  return out.trim();
}
/* Every place a passage occurs, in order. Overlapping occurrences count — the
   scan resumes one character on, not one match on — because the DOM side counts
   the same way, and an occurrence INDEX is only meaningful if both ends of the
   comparison agree on what counts as an occurrence. */
function _negoAllIndexOf(hay, needle){
  const out = [];
  if (!needle) return out;
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + 1)) out.push(i);
  return out;
}
/* ---------- THE LIST MARKER THE DOCUMENT PRINTS AND THE SCREEN DOES NOT ----
   richToText writes a clause's list markers into the stored text — "a. ", "2.1.
   ", "• " — because the projection has to read like the paper it came from. The
   browser draws those markers as ::marker pseudo-elements, which are not text
   and are not in what a selection hands back. So a lawyer who highlights across
   two lettered sub-clauses produces "deliver X deliver Y" while the clause
   stores "a. deliver X b. deliver Y", and an honest match over the two finds
   nothing. Lettered and numbered sub-clauses are how contracts are written, so
   this was most of a working day's selections.

   A marker is only a marker at the head of a line. Mid-sentence "(a)" is
   wording — a cross-reference to a sub-clause — and must never be skipped. */
const NEGO_MARKER_RE = /^[ \t]*(?:[•·▪]|\(?(?:[0-9]+(?:\.[0-9]+)*|[a-zA-Z]|[ivxlcdmIVXLCDM]+)[.)])[ \t]+/;
/* The clause flattened for comparison, with an index map home. `dropMarkers`
   additionally skips the line-leading markers above, so a selection that never
   contained them can still be located. The map means the ANSWER is still exact:
   whatever was skipped to find the passage, the offsets returned index the
   stored text and a splice at them touches only the chosen wording. */
function _negoFlatten(H, dropMarkers){
  let text = '';
  const map = [];                                 // flat index → index into H
  let atLineStart = true;
  for (let i = 0; i < H.length; i++){
    if (dropMarkers && atLineStart){
      const m = NEGO_MARKER_RE.exec(H.slice(i));
      if (m){ i += m[0].length - 1; atLineStart = false; continue; }
    }
    const ch = H[i];
    if (ch === '\n') atLineStart = true;
    else if (!/\s/.test(ch)) atLineStart = false;
    const n = negoNormChar(ch);
    if (!n) continue;
    if (n === ' ' && (text === '' || text.endsWith(' '))) continue;
    text += n; map.push(i);
  }
  return { text, map };
}
/* WHICH occurrence of the passage was pointed at. A clause can say "thirty (30)
   days" twice — once for invoices and once for cure periods — and a match that
   always answers the first one files a redline against wording nobody selected,
   silently, because the offsets it returns are perfectly valid. The caller that
   holds a live DOM Range knows which one it was; `opts.occurrence` is how it
   says so. Out of range falls back to the first, which is what this always did.

   `opts.occurrence` is counted on what the SCREEN shows, and the strategies
   below run over what the RECORD stores; the two can disagree about how many
   times a phrase appears (a clause under redline shows struck wording twice
   over). So the index is a preference, never a requirement. */
function negoFindPassage(hay, needle, opts){
  const H = String(hay == null ? '' : hay), N = String(needle == null ? '' : needle);
  if (!N.trim()) return null;
  const nth = Math.max(0, Math.floor(Number((opts && opts.occurrence) || 0)) || 0);
  const pick = list => (list.length ? (nth < list.length ? list[nth] : list[0]) : -1);

  const exact = pick(_negoAllIndexOf(H, N));      // cheap, and offsets fall straight out
  if (exact >= 0) return { start: exact, end: exact + N.length };
  const want = negoNormalizeText(N);
  if (!want) return null;
  /* Typography first, markers only if that fails: dropping markers widens the
     hay, and a passage that matched without doing so matched more exactly. */
  for (const dropMarkers of [false, true]){
    const flat = _negoFlatten(H, dropMarkers);
    const at = pick(_negoAllIndexOf(flat.text, want));
    if (at >= 0) return { start: flat.map[at], end: flat.map[at + want.length - 1] + 1 };
  }
  return null;
}

/* ---------- THE PASSAGE, AS THE SCREEN HANDED IT OVER ----------
   A selection is captured from a live DOM Range and spent later — after a round
   trip to a model, and on the workbench after a conversation that can run for
   minutes. What travels between is this object, and it carries CANDIDATE
   READINGS of the same highlight rather than one string, because the screen and
   the record legitimately disagree about what the clause says:

     as shown  — every word under the highlight. Right for a clean clause, and
                 right for the prompt and the quote the reader is shown.
     baseline  — struck wording kept, inserted wording dropped. What the round
                 baseline holds for a clause carrying a change, decided or not:
                 negoResolve commits to the working body and leaves the round
                 baseline where it was, so the clause the model stores is still
                 the pre-change one.
     current   — struck wording dropped, inserted wording kept. The reading that
                 answers once a baseline has been freshened past the change.

   Trying all three is what stopped a settled redline — accepted last week,
   nothing pending anywhere near it — from being refused as unmatchable, and it
   is why the refusal that remains can be trusted. */
function negoResolvePassage(clauseText, passage, opts){
  const T = String(clauseText == null ? '' : clauseText);
  if (!passage) return null;
  const p = typeof passage === 'string' ? { text: passage } : passage;
  const seen = new Set();
  const tries = [p.text, ...(Array.isArray(p.readings) ? p.readings : [])]
    .map(s => String(s == null ? '' : s))
    .filter(s => s.trim() && !seen.has(s) && seen.add(s));
  const occurrence = (opts && opts.occurrence != null) ? opts.occurrence : p.occurrence;
  for (const needle of tries){
    const hit = negoFindPassage(T, needle, { occurrence });
    if (hit) return { start: hit.start, end: hit.end, needle };
  }
  return null;
}
/* Is this highlight the whole clause? Asked on every reading, and tolerant of
   typography on both sides — otherwise "rephrase this clause" from a heading
   down is a whole-clause rewrite the matcher would have to find inside itself. */
function negoPassageIsWhole(clauseText, passage){
  const T = String(clauseText == null ? '' : clauseText);
  const p = typeof passage === 'string' ? { text: passage } : (passage || {});
  const all = [p.text, ...(Array.isArray(p.readings) ? p.readings : [])];
  const want = negoNormalizeText(T);
  return all.some(s => s != null && String(s).trim()
    && (String(s).trim() === T.trim() || negoNormalizeText(s) === want));
}

/* ---------- talking about a change ----------
   The light channel, attached to one fingerprint. It opens no round, captures
   no version and moves no wording — the same guarantee js/discuss.js makes for
   a clause, made for a change.

   Each comment is stamped with the hash CURRENT WHEN IT WAS WRITTEN. A thread
   outlives the wording it is about: revise a pending change and yesterday's
   objection may be about text that no longer exists. Stamping lets the thread
   say so ("written against an earlier revision") instead of silently
   presenting an old argument as if it were about today's words. */
/* ---------- WHO MAY BE TAGGED, PER ROOM (owner-asked 2 Sep 2026) ----------

   *"have the ability to tag parties in the comments using the @ feature. Only
   those allowed to edit or review the contract can be tagged internally and
   only the parties allowed to edit the contract at the counterparty can be
   tagged in the external part."*

   THE TWO POPULATIONS ARE DISJOINT BY CONSTRUCTION, and that is the whole
   safety argument rather than a filter anybody has to remember: the internal
   room offers COLLEAGUES and the external room offers people at the OTHER
   side, so a colleague's name cannot reach a note that travels. The picker is
   the sign; negoPostComment below is the wall, and it asks this same function.

   IT IS A READING AND ADDS NO STORE. Both halves are worked out from records
   the contract already carries, so there is no roster to maintain and nothing
   to migrate.

   INTERNAL — reviewCandidates, which is ALREADY this product's answer to
   "which colleagues may act on this contract": non-viewers, inside the
   contract's own folder scope, and not yourself. A viewer can neither edit nor
   review, and somebody who cannot see the stream cannot be sent to it. WHERE
   THAT FUNCTION IS NOT LOADED THIS ANSWERS NOTHING rather than falling back to
   a list of its own — a tag list that quietly includes people who may not be
   tagged is worse than no tag list, and a second reading of "who may act here"
   is how the two come to disagree.

   EXTERNAL — the people at the other side THIS RECORD KNOWS BY NAME: the
   counterparty rows on the signing route, and the contact recorded on the
   contract. We cannot know more than that, and inventing more would be the
   product asserting something about their organisation that nobody here has
   been told. */
function negoTagPeople(c, room, opts = {}){
  if (!c) return [];
  const ext = room === 'external';
  const seen = new Set();
  const out = [];
  const push = (id, name, email) => {
    const nm = String(name || '').trim();
    if (!nm) return;
    const key = nm.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id: id || null, name: nm, email: String(email || '').trim() });
  };
  if (!ext){
    /* THE ONE READING, ASKED THROUGH window BECAUSE IT LIVES IN js/review.js —
       and answering NOTHING where it is absent, which is the safe direction. */
    const fn = (typeof window !== 'undefined') && window.reviewCandidates;
    if (typeof fn !== 'function') return [];
    let list = [];
    try { list = fn(c) || []; } catch (e){ return []; }
    for (const u of list) push(u && u.id, u && u.name, u && u.email);
    return out;
  }
  const plan = (typeof window !== 'undefined' && typeof window.signerPlan === 'function')
    ? (window.signerPlan(c) || []) : (c.signerPlan || []);
  for (const row of plan)
    if (row && row.party === 'counterparty') push(row.id, row.name, row.email);
  push(null, c.counterpartyName, c.counterpartyEmail);
  return out;
}
/* WHICH OF THOSE PEOPLE A PIECE OF TEXT ACTUALLY NAMES. Matched against the
   room's own population rather than against a pattern, so a bare "@someone"
   nobody here can tag is ordinary text and stays ordinary text — there is no
   way to type a mention of a person the room does not offer. Longest name
   first, or "@Amina" would claim the mention meant for "@Amina Wanjiru". */
function negoMentionsIn(text, people){
  const t = String(text || '');
  const out = [];
  const seen = new Set();
  for (const p of (people || []).slice().sort((a, b) =>
      String(b.name).length - String(a.name).length)){
    const nm = String(p.name || '').trim();
    if (!nm || seen.has(nm.toLowerCase())) continue;
    const at = t.toLowerCase().indexOf('@' + nm.toLowerCase());
    if (at < 0) continue;
    seen.add(nm.toLowerCase());
    out.push({ id: p.id || null, name: nm });
  }
  return out;
}
function negoPostComment(c, id, text, opts = {}){
  const ch = negoChangeById(c, id);
  if (!ch) return null;
  const body = String(text == null ? '' : text).trim();
  if (!body) return null;
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const who = String(opts.author || (side === 'counterparty'
    ? (c.counterparty || 'The counterparty')
    : ((window.currentUser && window.currentUser()?.name) || 'This workspace'))).trim();
  ch.thread = Array.isArray(ch.thread) ? ch.thread : [];
  /* WHO THIS IS FOR, and the default is the safe one.

     'shared' means it also goes out on the discussion channel and the other
     side reads it. 'internal' means it stays on this record: ch.thread is not
     in the share payload (buildSharePayload, js/core.js) and never has been, so
     an internal note reaches nobody by simply not being posted — there is no
     filter here to get wrong, which is the point.

     Anything that is not exactly 'shared' is internal. A caller that forgets
     the field, or passes something misspelt, keeps the note at home; the
     opposite default would publish a colleague's aside to the counterparty. */
  const visibility = opts.visibility === 'shared' ? 'shared' : 'internal';
  /* THE WRITER'S ID RIDES BESIDE THEIR NAME, and it is what lets the three
     acts below answer "is this yours" without matching on a name alone. The
     name still has to stay: it survives an account being deleted, which is the
     same reasoning that keeps both halves on a contract's owner. Absent on
     every note already on file, so the reading below falls back to the name and
     nothing needs migrating. It travels nowhere — ch.thread is not in the share
     payload, and the channel post beside it carries author and body only. */
  const me = (side === 'owner' && window.currentUser && window.currentUser()) || null;
  const byId = (me && me.id
    && String(who).trim().toLowerCase() === String(me.name || '').trim().toLowerCase())
    ? me.id : null;
  /* ---- WHO WAS TAGGED, AND THE ROOM DECIDES WHO MAY BE ----
     THE WALL, not the sign. The picker only ever offers the room's own people;
     this is what makes that true of the RECORD as well, so a mention that
     reached here any other way — a caller passing its own list, an older path,
     a hand-built object — is dropped rather than stored. Resolved from the
     TEXT against negoTagPeople, so what is filed is exactly what the note
     visibly says, and a name nobody in this room can be tagged by stays
     ordinary text.
     ABSENT WHERE NOBODY WAS TAGGED: every note already on file carries no
     `mentions` key, and none is written for a note that names nobody, so there
     is nothing to migrate and no reading anywhere answers differently. */
  const people = (typeof negoTagPeople === 'function')
    ? negoTagPeople(c, visibility === 'shared' ? 'external' : 'internal', opts) : [];
  const mentions = (typeof negoMentionsIn === 'function')
    ? negoMentionsIn(body, people) : [];
  const msg = { who, byId, side, visibility,
    at: (window.nowISO ? window.nowISO() : new Date().toISOString()),
    text: body.slice(0, 2000), atHash: ch.hash || null };
  if (mentions.length) msg.mentions = mentions;
  ch.thread.push(msg);
  if (window.logAudit) logAudit(c, 'Negotiation',
    `${visibility === 'shared' ? 'Comment' : 'Internal note'} posted on #${ch.id} by ${who}`
    + ` — the contract is unchanged and no round was opened`
    + (visibility === 'shared' ? '' : '; it stays inside this organisation'));
  return msg;
}

/* ---------- YOUR OWN NOTE ON A CHANGE (owner-ruled 31 Aug 2026) ----------

   A note tied to a redline is an ORDINARY INTERNAL MESSAGE on the change's own
   thread. No new store, no new field on the change, no migration — which is
   what keeps every screen that already reads a thread reading this one for
   free. What these three acts add is the one thing a thread has never allowed:
   changing or removing something you wrote.

   THEY ARE NARROW, AND EACH NARROWING IS A DIFFERENT PROMISE.

   INTERNAL ONLY, and this is the load-bearing one. A 'shared' message has GONE:
   it travelled on the discussion channel and the other side is holding a copy
   that nothing here can reach. Rewriting our half would leave two records of
   one sentence disagreeing, and deleting it would take it off our screen while
   it stayed on theirs — which is worse than not offering the verb at all,
   because from this chair it looks as though it worked.

   OUR SIDE ONLY. The counterparty's page is assembled from a share payload and
   thrown away on the next repaint; it has no thread of its own to edit, and
   `ch.thread` is not in that payload, so their seat cannot reach these at all.

   YOUR OWN WORDS ONLY. A colleague's note is a colleague's. There is no
   supervisory edit here and an admin gets no exception — the thread is a record
   of who said what, and an edit nobody can attribute is worse than the sentence
   somebody wanted changed.

   AND THE THREAD IS STILL APPEND-ONLY FOR EVERYBODY ELSE: every one of these
   refuses rather than falling back to something quieter, and each writes an
   audit line, so a note that was changed or taken away leaves a trail even
   though the sentence itself does not.

   THE LOCAL STORE IS WHAT THEY READ, deliberately: `ch.thread` rather than
   negoMergedThread. A merged thread carries the channel's messages too, and
   those are 'shared' by definition and belong to a store this cannot write to.
   Reading the local half means an unwritable message is not on the list rather
   than on the list and refused. */

/* ---- HAS IT ACTUALLY GONE? (owner-ruled 1 Sep 2026) ----
   A note is EXTERNAL the moment it is written — that is which room it belongs
   to and who it is for. Whether it has REACHED them is a different fact, and
   this product has learned three times over that the two must not be one:
   with no mail provider, outside API mode, or on a refusal, an external note
   sits on our record having travelled nowhere.

   `sentAt` is stamped by whatever succeeded in delivering it, and this is the
   one reading of it. AN OLDER MESSAGE CARRIES NONE, so it answers "not
   delivered" — which is the safe direction: it makes the note editable rather
   than claiming it reached somebody. */
const negoNoteDelivered = m => !!(m && m.sentAt);
/* Is this message one this reader may change? The id first, the name second —
   the reading obligationRecipient already uses, for the same reason: an id
   survives a rename, a name survives the account being deleted.

   A NOTE THAT HAS GONE IS NOT YOURS ANY MORE, and that is the load-bearing
   half: the other side is holding a copy nothing here can reach, so rewriting
   our half would leave two records of one sentence disagreeing and deleting it
   would take it off our screen while it stayed on theirs. ONE THAT HAS NOT GONE
   STILL IS — an external note the channel never carried is a sentence nobody
   else has read, and refusing to let its writer correct it would be a rule
   protecting nothing. */
function negoNoteIsMine(msg, user){
  if (!msg || negoNoteDelivered(msg)) return false;
  if ((msg.side || 'owner') !== 'owner') return false;
  const u = user || (window.currentUser && window.currentUser()) || null;
  if (!u) return false;
  if (msg.byId && u.id) return msg.byId === u.id;
  const a = String(msg.who || '').trim().toLowerCase();
  const b = String(u.name || '').trim().toLowerCase();
  return !!a && a === b;
}
/* The note this reader wrote on this change, or null. NEWEST wins, because the
   dialog asks one question — "is there a note here to change?" — and a reader
   who has written twice means the second one. */
function negoMyNote(c, ch, user){
  const own = (ch && Array.isArray(ch.thread)) ? ch.thread : [];
  for (let i = own.length - 1; i >= 0; i--) if (negoNoteIsMine(own[i], user)) return own[i];
  return null;
}
/* Find the message on the record, by identity where we can and by content
   where we cannot: a caller may be holding a copy that came back through a
   merge or a repaint rather than the object on the thread itself. */
function _negoNoteAt(ch, msg){
  const own = (ch && Array.isArray(ch.thread)) ? ch.thread : [];
  let i = own.indexOf(msg);
  if (i >= 0) return i;
  if (!msg) return -1;
  for (let j = own.length - 1; j >= 0; j--){
    const m = own[j];
    if (m && m.at === msg.at && String(m.text || '') === String(msg.text || '')
      && String(m.who || '') === String(msg.who || '')) return j;
  }
  return -1;
}
function negoEditNote(c, ch, msg, text){
  const i = _negoNoteAt(ch, msg);
  if (i < 0) return null;
  const m = ch.thread[i];
  if (negoNoteDelivered(m)){
    if (window.toast) toast(i18t('ng_note_sent'), 'err');
    return null;
  }
  if (!negoNoteIsMine(m)){
    if (window.toast) toast(i18t('ng_note_not_yours'), 'err');
    return null;
  }
  const body = String(text == null ? '' : text).trim();
  if (!body) return negoDeleteNote(c, ch, m);
  if (body === String(m.text || '')) return m;
  m.text = body.slice(0, 2000);
  /* THE HASH IS RE-STAMPED, because the note is being written NOW: leaving
     yesterday's stamp on today's sentence would have the thread announce it as
     "written against an earlier revision" when it was not. */
  m.atHash = ch.hash || null;
  m.editedAt = (window.nowISO ? window.nowISO() : new Date().toISOString());
  if (window.logAudit) logAudit(c, 'Negotiation',
    `${m.visibility === 'shared' ? 'Note' : 'Internal note'} on #${ch.id} edited by ${m.who}`
    + ` — the contract is unchanged and nothing was sent`);
  return m;
}
function negoDeleteNote(c, ch, msg){
  const i = _negoNoteAt(ch, msg);
  if (i < 0) return false;
  const m = ch.thread[i];
  if (negoNoteDelivered(m)){
    if (window.toast) toast(i18t('ng_note_sent'), 'err');
    return false;
  }
  if (!negoNoteIsMine(m)){
    if (window.toast) toast(i18t('ng_note_not_yours'), 'err');
    return false;
  }
  ch.thread.splice(i, 1);
  if (window.logAudit) logAudit(c, 'Negotiation',
    `${m.visibility === 'shared' ? 'Note' : 'Internal note'} on #${ch.id} removed by ${m.who}`
    + ` — the contract is unchanged and nothing was sent`);
  return true;
}
/* Is this comment about wording that has since been revised? A read, never a
   stored flag, so it cannot disagree with the change it describes. */
const negoCommentIsStale = (ch, msg) => !!(ch && msg && msg.atHash && ch.hash && msg.atHash !== ch.hash);
/* The topic key a change's thread shares with js/discuss.js. */
const negoTopicFor = ch => ch ? ('change:' + ch.id) : null;

/* ---------- ONE THREAD PER CHANGE, OUT OF TWO STORES ----------

   A comment on a fingerprint has always had two places to live, and each side
   was reading only one of them.

     ch.thread          — written by negoPostComment, onto the contract record
                          the screen is reading. The owner's record IS the
                          contract, so their own comments landed here and stayed.
     share_messages     — the discussion channel, keyed by topic. The
                          counterparty's copy of the contract is assembled from
                          a share payload and thrown away on the next repaint,
                          so their replies cannot be written to it and go here
                          instead, under topic `change:<id>`.

   The card rendered ch.thread and nothing else. So the owner asked for input on
   a change, the counterparty answered, the answer was filed — correctly, and
   visibly in the discussion panel — and the card that asked the question showed
   no reply at all. Each side could see its own half of a conversation and
   neither could see the other's.

   This is the read that puts them back together. It merges, it does not move
   anything: both stores keep exactly what they held, and the ordering is by
   time so an exchange reads in the order it happened.

   Identical text from the same side in both stores is ONE message, not two —
   the owner's comments are written to the thread and posted to the channel, so
   without this every one of them would appear twice on their own screen.

   `extra` is passed rather than only read off the record, because the two sides
   hold that list in different places: the owner keeps it on `c._messages`, and
   the counterparty's page has no contract to keep anything on — its copy is
   rebuilt from the share payload on every repaint, so the list lives on the
   page (PORTAL_OPTS.messages) and is handed in. */
function negoMergedThread(c, ch, extra){
  const own = (ch && Array.isArray(ch.thread)) ? ch.thread : [];
  const all = Array.isArray(extra) ? extra
    : ((c && Array.isArray(c._messages)) ? c._messages : []);
  if (!ch || !all.length) return own;
  const topic = negoTopicFor(ch);
  /* THE TIMESTAMP IS DELIBERATELY NOT IN THE KEY, and leaving it in would put
     every one of the owner's own comments on the screen twice. A comment they
     post is written to `ch.thread` stamped by their browser and posted to the
     channel stamped by the server — same words, same author, same side, two
     clocks. Author, side and wording identify a message; the moment it was
     recorded identifies which copy of it you are holding. */
  const key = m => `${m.side || ''}|${String(m.who || '').trim()}|${String(m.text || '').replace(/\s+/g, ' ').trim()}`;
  const have = new Set(own.map(key));
  const extras = [];
  for (const m of all){
    if (!m || String(m.topic || '') !== topic) continue;
    /* A message from the discussion channel is SHARED by definition: it
       travelled. Stamping it here means the badge on a merged thread is right
       for both stores rather than only for the half written locally. */
    const one = { who: m.author, side: m.side, at: m.at, text: m.body, atHash: null,
      visibility: 'shared' };
    if (have.has(key(one))) continue;
    have.add(key(one));
    extras.push(one);
  }
  if (!extras.length) return own;
  return own.concat(extras)
    .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
}
/* The name this was introduced under, kept: it reads better at the call sites
   that only ever have the record to go on. */
const negoThreadOf = (c, ch) => negoMergedThread(c, ch);

/* ---------- IS SOMEBODY WAITING ON AN ANSWER? ----------
   Unread means two things at once, and both have to be true: the last word in
   the thread is THEIRS, and it arrived after the last time this reader opened
   that thread. Either half alone is wrong — "the last word is theirs" nags for
   ever once you have read it and decided not to reply, and "newer than last
   opened" lights up over your own comment.

   `seenAt` is the reader's own record of when they last opened this thread. It
   is a local fact about a person, not a fact about the agreement, so it is kept
   in localStorage per reader and never travels with the contract. */
function negoThreadUnread(msgs, side, seenAt){
  const list = Array.isArray(msgs) ? msgs : [];
  if (!list.length) return false;
  const last = list[list.length - 1];
  if (!last || last.side === side) return false;           // our own word is last
  if (!seenAt) return true;                                // never opened
  return String(last.at || '') > String(seenAt);
}

/* ---------- progress, and the one transition out ---------- */
function negoProgress(c){
  const live = negoChanges(c).filter(x => x.status !== 'superseded');
  const total = live.length;
  const done = live.filter(x => x.status !== 'pending').length;
  return { total, done, pending: total - done,
    pct: total ? Math.round((done / total) * 100) : 0 };
}
/* Ready to sign means every change on the table has an answer and there is at
   least one thing that was actually negotiated. It is a READ of the change set,
   never a stored flag — a flag could disagree with the changes it claims to
   summarise, and on this screen that disagreement would be an invitation to
   sign something nobody had finished arguing about. */
function negoReadyToSign(c){
  const p = negoProgress(c);
  return p.total > 0 && p.pending === 0;
}
/* ---------- are the parties actually aligned? ----------
   What gates "Ready to sign", and a stricter question than negoReadyToSign
   above. That one asks whether every change has AN ANSWER, which is the right
   question for "is this round finished". This one asks whether the answers
   amount to AGREEMENT, which is the only honest basis for telling someone a
   contract is ready to be signed.

   The two differ on exactly one case, and it is the case that matters: a
   refused ask. It has an answer, so the round is finished; it is not agreement,
   so the deal is not. It stops being outstanding when the side that asked for
   it withdraws it — see negoWithdraw.

     pending                       → outstanding: nobody has answered
     rejected, not withdrawn       → contested: answered, and the answer was no
     rejected, withdrawn           → settled: the asker let it go
     accepted                      → settled: it is in the wording

   A contract with no changes at all is aligned. There is nothing to disagree
   about, and a first-draft contract sent out clean is the commonest signing
   case there is — refusing to call that aligned would gate the button on a
   negotiation that never happened.

   A READ of the change set, never a stored flag, for the same reason
   negoReadyToSign is: a flag could disagree with the changes it claims to
   summarise, and on this button that disagreement is an invitation to sign
   something nobody had finished arguing about. */
function negoAlignment(c){
  /* Reads c.changes DIRECTLY rather than through negoChanges, which calls
     negoInit and would create a negotiation record — and stamp clause ids into
     the document — on any contract merely asked the question. The dashboard
     asks it of every contract in the portfolio, most of them loaded as
     summaries with their bodies stripped, and a read must not write. */
  const live = (Array.isArray(c && c.changes) ? c.changes : []).filter(x => x && x.status !== 'superseded');
  const pending = live.filter(x => x.status === 'pending');
  const contested = live.filter(x => x.status === 'rejected' && !x.withdrawn);
  return { aligned: !pending.length && !contested.length,
    total: live.length, pending, contested,
    outstanding: pending.concat(contested) };
}
/* ---------- WHAT MUST BE SETTLED BEFORE ANYTHING IS SEALED ----------

   The gate in front of every signature, and the one place both generations of
   the negotiation are asked at once.

   The signing panel has refused to seal over an unresolved redline since E2,
   and it asked `unresolvedRedlines()` — which counts open ROUNDS carrying
   proposed text. That was the whole negotiation once. It is not now: the room
   works change by change on `c.changes`, and a counterparty answering through
   the room creates NO ROUND AT ALL. So the old gate reported nothing
   outstanding over a contract with four unanswered changes on it, and the
   signature went on. A contract was frozen, sealed with a tamper-evident
   fingerprint and distributed to both parties as their record of the deal,
   while a change was still being argued about.

   Both states in the change model stop a signature, and the second is the one
   that gets missed: a REFUSED ask nobody has withdrawn has an answer, so the
   round is finished — but it is not agreement, and sealing over it records
   agreement where there is a live disagreement. That distinction is
   negoAlignment's, and it is deliberately not re-derived here.

   Returns plain sentences a person can act on, because whatever refuses a
   signature has to say what would clear it. */
function negoSigningBlockers(c){
  const out = [];
  const rounds = (window.unresolvedRedlines ? unresolvedRedlines(c) : 0);
  if (rounds) out.push(`${rounds} proposed edit${rounds === 1 ? '' : 's'} from the counterparty`
    + ` ${rounds === 1 ? 'is' : 'are'} still open`);
  const a = negoAlignment(c);
  if (a.pending.length) out.push(`${a.pending.length} change${a.pending.length === 1 ? '' : 's'}`
    + ` ${a.pending.length === 1 ? 'has' : 'have'} not been answered`
    + ` (${a.pending.map(x => '#' + x.id).join(', ')})`);
  if (a.contested.length) out.push(`${a.contested.length} refused ask${a.contested.length === 1 ? '' : 's'}`
    + ` ${a.contested.length === 1 ? 'is' : 'are'} still outstanding — the side that asked has not withdrawn`
    + ` ${a.contested.length === 1 ? 'it' : 'them'} (${a.contested.map(x => '#' + x.id).join(', ')})`);
  /* ---- AND CLOSING THE ROUND DOES NOT SETTLE A REFUSAL (audit finding 6) ----
     negoAlignment reads the LIVE c.changes, which negoAdvanceRound empties: it
     refuses to close over anything still pending, but a refused counterparty
     ask is not pending — it is decided — so it archived cleanly and took the
     block with it. The contract then reported aligned and could be signed over
     a disagreement the other side never withdrew, which is the exact state the
     line above exists to prevent. The refuser settled it by closing the round;
     only the asker's withdrawal is supposed to do that (see negoWithdraw).

     negoOpenPoints is that question asked across ALL rounds — it reads
     negoAllChanges, skips anything withdrawn, and skips anything whose wording
     ended up in the document anyway, so a point that was really resolved does
     not come back. It was computed and had no reader in the product; this is
     the reader. Live ones are already named above, so only the archived
     remainder is added and the two cannot double-count. */
  const seen = new Set(a.contested.map(x => String(x.id)));
  const buried = (window.negoOpenPoints ? negoOpenPoints(c) : [])
    .filter(p => p && !seen.has(String(p.id)));
  if (buried.length) out.push(`${buried.length} refused ask${buried.length === 1 ? '' : 's'}`
    + ` from an earlier round ${buried.length === 1 ? 'is' : 'are'} still outstanding —`
    + ` closing a round does not withdraw ${buried.length === 1 ? 'it' : 'them'}`
    + ` (${buried.map(x => '#' + x.id).join(', ')})`);
  return out;
}
/* What is stopping this, in words, for the disabled button to say. Never
   "not ready yet": a control that refuses without saying why teaches nothing,
   and the reader is the one person who can clear it. */
function negoAlignmentWhy(c, side){
  const a = negoAlignment(c);
  if (a.aligned) return '';
  const me = side === 'counterparty' ? 'counterparty' : 'owner';
  const bits = [];
  if (a.pending.length)
    bits.push(`${a.pending.length} change${a.pending.length === 1 ? '' : 's'} still waiting on a decision`);
  if (a.contested.length){
    const mine = a.contested.filter(x => x.authorSide === me).length;
    const theirs = a.contested.length - mine;
    if (mine) bits.push(`${mine} of your asks refused — withdraw ${mine === 1 ? 'it' : 'them'} or keep negotiating`);
    if (theirs) bits.push(`${theirs} refused ask${theirs === 1 ? '' : 's'} the other side has not withdrawn`);
  }
  return bits.join(' · ');
}

/* ---------- signalling readiness ----------
   A SIGNAL, NEVER AN INFERENCE. The old rule read the change set and decided
   for the reader that they were ready — resolve the last change and the link
   silently became a signature request. Nobody said they were ready; the
   arithmetic said it for them.

   So readiness is a thing a person does, recorded with who did it, when, and
   which side they were on. The gate above decides whether they MAY press it;
   pressing it is still theirs. It changes no wording, opens no round and signs
   nothing — it tells the other side the deal is done being argued about, and
   the other side is the one who issues the signing link. */
function negoSignalReady(c, opts = {}){
  negoInit(c);
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const a = negoAlignment(c);
  /* ---- THE REFUSAL SAYS NOTHING, AND THE CALLER SPEAKS ----
     (owner-reported 23 Aug 2026: "the bottom right says something needs to be
     settled when there were absolutely nothing negotiated ... it keeps popping
     up.")

     This drew a toast, from inside the MODEL, unguarded. Its one caller is
     applyResponse's readiness branch, which runs from the BACKGROUND POLLER —
     so a stale readiness claim retried on every beat put a red box on whatever
     page the reader happened to be standing on, about a contract they were not
     looking at. Measured on a real server: four polls, four boxes, on Insights.

     THE SENTENCE IS NOT LOST — the caller already had its own, guarded by
     `!opts.background`, and that is the one place that knows whether a person
     is watching. A model function that draws is a model function that draws in
     the background, and this is the second time that has cost this product a
     report; a refusal returns null and the caller decides what to say about it.

     THE COUNTERPARTY'S OWN PAGE NEEDS NOTHING HERE: its Ready button is
     disabled while anything is unsettled (see readyOk in js/views/portal.js),
     with the reason on its own tooltip, so nobody can press into this refusal
     from a screen. */
  if (!a.aligned) return null;
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name)
    || (side === 'counterparty' ? (c.counterparty || 'The counterparty') : 'This workspace'));
  const n = c.negotiation;
  n.ready = (n.ready && typeof n.ready === 'object') ? n.ready : {};
  const sig = { by: who, side, at: opts.at || (window.nowISO ? window.nowISO() : new Date().toISOString()),
    email: opts.email || null, round: n.round || 1,
    changes: a.total, accepted: negoChanges(c).filter(x => x.status === 'accepted').length,
    withdrawn: negoChanges(c).filter(x => x.withdrawn).length };
  n.ready[side] = sig;
  if (window.logAudit) logAudit(c, 'Ready to sign',
    `${who} signalled that ${side === 'counterparty' ? 'the counterparty' : 'this workspace'} is ready to sign`
    + ` — round ${sig.round}, ${sig.changes} change${sig.changes === 1 ? '' : 's'} settled`
    + `${sig.accepted ? ` (${sig.accepted} adopted into the wording)` : ''}`
    + `${sig.withdrawn ? `, ${sig.withdrawn} ask${sig.withdrawn === 1 ? '' : 's'} withdrawn` : ''}`
    + '. Nothing has been signed — a signing link has still to be issued.');
  c.lastAction = window.todayStr ? window.todayStr() : c.lastAction;
  return sig;
}
/* Who has signalled, read back. `null` rather than a made-up default, so a
   caller cannot mistake "nobody has said so" for "they said no".

   `stale` is COMPUTED, never stored. A readiness signal describes a change set
   at a moment: everything settled, nothing contested. Propose a new ask after
   it, reopen a decided one, or refuse something afresh, and the signal is still
   a true record of what was said and no longer a true description of where the
   deal stands. Deleting it would erase the fact that it was given; leaving it
   unqualified would have the owner issue a signing link for a contract that had
   gone back into negotiation. So it is kept, and marked. */
/* Has this side actually signed? The counterparty's marks are `counterparty`
   and `external`; everything else on the list is ours. Mirrors signedParties()
   on the server and cpSigned in the workspace's action bar, which had this
   right long before the readiness strip did. */
const negoSideSigned = (c, side) => {
  const sigs = Array.isArray(c && c.signatures) ? c.signatures : [];
  const theirs = s => !!s && (s.party === 'counterparty' || s.party === 'external');
  return side === 'counterparty' ? sigs.some(theirs) : sigs.some(s => s && !theirs(s));
};
/* A SIGNAL OF INTENT, SUPERSEDED BY THE ACT.

   This returned the signal for as long as the record carried it, and the four
   surfaces that read it all stood down on the same condition: the whole
   contract reaching "Executed". Between the first signature and the last, the
   contract is still "Under Review" — so a counterparty who had signed was
   shown, in bold, "Nothing is signed yet", next to their own signature.

   Once a side has signed, their signature is the live fact about them and it
   says more than the signal did. Retired here rather than at each surface,
   because there were four of them: the strip on the Docs page, the banner in
   the room, the same banner on their own page, and the dashboard's count of
   contracts waiting for a signature. */
const negoReadySignal = (c, side) => {
  const n = (c && c.negotiation && c.negotiation.ready) || null;
  if (!n) return null;
  const s = side === 'counterparty' ? 'counterparty' : 'owner';
  const sig = n[s] || null;
  if (!sig) return null;
  if (negoSideSigned(c, s)) return null;
  return { ...sig, stale: !negoAlignment(c).aligned };
};
/* Points the counterparty raised that were refused, and are therefore still
   live between the parties. A rejected change that simply vanishes from the
   document reads as agreement, and it is not.

   Two things this has to get right, and openPointsFor() in js/versioning.js
   already worked both out for the round model — the reasoning is the same here
   and is deliberately not re-derived:

     · It spans EVERY round, not the one in flight. A refusal in round 1 is
       still a refusal in round 5.
     · A point stops being open in TWO ways: the wording they asked for is in
       the document anyway (they got it, by whatever route), or the wording it
       was measured AGAINST is gone (the clause has been renegotiated since, so
       the old ask is about a passage that no longer exists). */
function negoOpenPoints(c){
  const live = String((window.docPlainText ? docPlainText(c) : '') || '').replace(/\s+/g, ' ');
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const out = [];
  for (const x of negoAllChanges(c)){
    if (x.status !== 'rejected' || x.authorSide !== 'counterparty') continue;
    /* A withdrawn ask is not an open point. They asked, we said no, and they
       accepted that — listing it as still live between the parties would
       contradict the acknowledgement they gave. */
    if (x.withdrawn) continue;
    const want = norm(x.newText), had = norm(x.oldText);
    if (want && live.includes(want)) continue;      // they got it in the end
    if (had && !live.includes(had)) continue;       // the clause has moved on since
    out.push({ id: x.id, clauseId: x.clauseId, clauseLabel: x.clauseLabel || null,
      round: x.roundN || null, before: x.oldText, after: x.newText,
      ask: x.note || null, reason: x.reply || null, by: x.author, at: x.resolvedAt || null });
  }
  return out;
}

/* ---------- what changed, as a summary a person can read ----------
   What the Share dialog puts in front of the sender before it sends anything,
   and what travels to the counterparty alongside the link.

   Every line is QUOTED FROM THE RECORD, never composed. A change's summary is
   either the sentence the proposer typed or the mechanical "what goes → what
   arrives" built from its stored ops — the same text the change index shows.
   Machine-written prose about a legal change ("liability was relaxed") is the
   one thing this must not produce, because a reader would act on it.

   Only changes still on the table are listed. A decided change is history, and
   history is what the version list is for. */
function negoChangeSummary(c){
  negoInit(c);
  const live = negoChanges(c).filter(x => x.status !== 'superseded');
  const label = ch => ch.clauseLabel || ch.clauseId || 'this contract';
  const kind = ch => ch.changeType === 'insertClause' ? 'New clause'
    : ch.changeType === 'deleteClause' ? 'Deletion' : 'Amended';
  const lines = live.map(ch => ({
    id: ch.id, status: ch.status, changeType: ch.changeType,
    clause: label(ch), kind: kind(ch), summary: ch.summary || '',
    author: ch.author, mine: ch.authorSide === 'owner',
    text: `#${ch.id} · ${label(ch)} — ${ch.summary || kind(ch)}`,
  }));
  const pending = lines.filter(x => x.status === 'pending').length;
  const accepted = lines.filter(x => x.status === 'accepted').length;
  const rejected = lines.filter(x => x.status === 'rejected').length;
  return {
    round: negoRound(c),
    total: lines.length, pending, accepted, rejected,
    lines,
    /* The plain-text form that goes into an email body. Built here rather than
       at the send site so the dialog and the message cannot disagree about what
       was said to have changed. */
    text: lines.length
      ? `Round ${negoRound(c)} — ${lines.length} change${lines.length === 1 ? '' : 's'} on the table`
        + `${pending ? `, ${pending} awaiting a decision` : ''}:\n`
        + lines.map(x => `  • ${x.text}`).join('\n')
      : `Round ${negoRound(c)} — no changes have been proposed yet. The document is as it stands.`,
  };
}

/* ---------- what Copilot is told about this page ----------
   The room opens HaTi's OWN Copilot panel — same markup, same behaviour, same
   engine — so nothing here builds a chat surface. What it builds is the
   CONTEXT: this contract, this round, these clauses, these changes, so an
   answer is about the negotiation on the screen rather than about contracts in
   general. js/ai.js merges it in aiChatContext() when the room is open.

   Nothing here edits the document, and nothing downstream can: the context is a
   read. A suggestion is text a person reads and may then act on, and acting on
   it goes through negoEditClause like any other edit, filed in that person's
   name. A machine quietly altering a legal instrument is the failure this
   module exists to prevent.

 Capped, because a schedule can be
   thousands of words and a request that never returns is worse than one that
   answers from slightly less. The changes are the part that matters and they
   are sent in full. */
const NEGO_CTX_CHARS = 24000;
function negoCopilotContext(c){
  negoInit(c);
  const clip = (s, n) => { const t = String(s || ''); return t.length > n ? t.slice(0, n) + '…[truncated]' : t; };
  return {
    surface: 'negotiation-room',
    contractId: c.id || null,
    name: c.name || null,
    counterparty: c.counterparty || null,
    round: negoRound(c),
    turn: negoTurn(c),
    readyToSign: negoReadyToSign(c),
    clauses: negoClauseList(c).map(cl => ({ id: cl.clauseId, label: negoClauseLabel(cl),
      text: clip(cl.text, 2000) })),
    changes: negoChanges(c).filter(x => x.status !== 'superseded').map(ch => ({
      id: ch.id, clause: ch.clauseLabel || ch.clauseId, type: ch.changeType,
      status: ch.status, summary: ch.summary, author: ch.author,
      currentWording: clip(ch.oldText, 1200), proposedWording: clip(ch.newText, 1200) })),
    workingText: clip(negoResolvedText(c), NEGO_CTX_CHARS),
  };
}

/* The negotiation record, reduced to what an ANSWER can be built from.

   This is the twin of copilotNegotiation() in server/server.js. There are two
   because the server is a standalone Node process that loads none of these
   modules, and the browser-direct (BYOK) Copilot never reaches the server at
   all — so both engines have to be able to describe a negotiation, and they
   have to describe it the SAME way or an answer would depend on which brain
   happened to be configured. f47 asserts the two field sets match exactly;
   that test is the thing keeping them honest.

   Every field is a READ of what the parties actually did. Nothing here is an
   opinion about the contract: Copilot reports the record and the judgement
   stays with the reader. */
const NEGO_COPILOT_CAP = 60;
function negoCopilotRecord(c){
  const n = c && c.negotiation;
  const live = Array.isArray(c && c.changes) ? c.changes.filter(x => x && x.status !== 'superseded') : [];
  const rounds = (n && Array.isArray(n.rounds)) ? n.rounds : [];
  const archived = rounds.reduce((acc, r) =>
    acc.concat((r.changes || []).map(x => ({ ...x, roundN: r.n }))), []);
  const all = archived.concat(live);
  if (!n && !all.length) return { active: false, changes: [] };

  const clip = (v, k) => { const t = String(v || ''); return t.length > k ? t.slice(0, k) + '…' : t; };
  const one = x => ({
    id: x.id, round: x.roundN || null, clause: x.clauseLabel || x.clauseId || '',
    type: x.changeType || x.type || 'modify', status: x.status || 'pending',
    proposedBy: x.author || '', side: x.authorSide || '',
    summary: clip(x.summary, 200),
    decidedBy: x.resolvedBy || null, decidedAt: x.resolvedAt || null,
    reasonGiven: clip(x.reply || x.note || '', 300) || null,
    currentWording: clip(x.oldText, 600), proposedWording: clip(x.newText, 600),
  });
  const byStatus = k => all.filter(x => (x.status || 'pending') === k).length;
  const versions = Array.isArray(c.versions) ? c.versions : [];
  return {
    active: true,
    round: (n && n.round) || 1,
    turn: (n && n.turn) || 'owner',
    roundsClosed: rounds.length,
    totalChanges: all.length,
    pending: byStatus('pending'), accepted: byStatus('accepted'), rejected: byStatus('rejected'),
    readyToSign: all.length > 0 && byStatus('pending') === 0,
    /* Newest first, so a cap drops the oldest rather than the freshest — and
       the count of what was dropped travels, so a truncated list can never be
       mistaken for a complete one. */
    changes: all.slice(-NEGO_COPILOT_CAP).reverse().map(one),
    changesOmitted: Math.max(0, all.length - NEGO_COPILOT_CAP),
    versionCount: versions.length,
    versions: versions.slice(-20).reverse().map(v => ({ n: v.n, at: v.at || null,
      by: v.by || '', label: clip(v.label, 120) })),
  };
}

/* ---------- looking at any two versions ----------
   The two panes were fixed: this round's baseline on the left, this round's
   working copy on the right. That is the right default and it is not the only
   question people have. "What did this clause say before we conceded it in
   round 2" is answerable from the version list, and was not reachable.

   Every snapshot the contract carries is offered — the live pair plus every
   captureVersion() record — and any two can be put side by side.

   ONE RULE governs what happens then, and it is the reason this is not simply
   a rendering change: a comparison of two OLD versions is HISTORY. The
   fingerprints on the right belong to the round in flight; the differences
   between v2 and v5 are not proposals and there is nobody to accept them. So
   picking anything other than the live pair puts the screen in a read-only
   comparison, and says so. Offering Accept on a difference nobody proposed
   would be inventing a decision. */
/* The comparison key for "is this the same document?". Whitespace-insensitive,
   because two snapshots of one wording taken through different paths differ by
   line breaks and by nothing a reader would call a version. */
const _negoSameDoc = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

/* WHICH ROUND A SNAPSHOT BELONGS TO.
   Stamped at capture from now on. Contracts negotiated before that stamp
   existed carry nothing, so the round is read off the clock instead: a snapshot
   taken before round 1 closed belongs to round 1, one taken before round 2
   closed belongs to round 2, and so on. Anything that still cannot be placed
   falls into the round in flight, which is where an unplaceable snapshot is
   least surprising and never invents a round that is not on the list. */
function negoVersionRound(c, v){
  const cur = negoRound(c);
  const closed = Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds : [];
  let r = (v && typeof v.roundN === 'number' && v.roundN > 0) ? v.roundN : null;
  if (r == null && v && v.at){
    const at = Date.parse(v.at);
    if (!isNaN(at)){
      for (const cr of closed){
        const closedAt = Date.parse(cr.at || '');
        if (isNaN(closedAt) || at <= closedAt){ r = cr.n; break; }
      }
    }
  }
  if (r == null) r = cur;
  return Math.max(1, Math.min(r, cur));
}

function negoVersionOptions(c){
  negoInit(c);
  const cur = negoRound(c);
  const closed = Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds : [];
  /* ROUND FIRST, THING SECOND — "Round 2 - Baseline", not "Original Baseline ·
     round 2". The old names described the pane and buried the round at the end
     of the line, so a list spanning three rounds read as a pile of similar
     phrases and the one fact that ordered it was the last thing on each row.
     The V numbers restart with each round for the same reason: "Round 2 - V1"
     is the first snapshot of round 2, which is the question people ask. The
     snapshot's own number in the version history travels in `sub`, so nothing
     is renamed out of existence — see negoCompareDocHtml, which prints it. */
  const versionsIn = round => {
    const out = [];
    for (const v of (window.listedVersions ? listedVersions(c) : (c.versions || []))){
      if (negoVersionRound(c, v) !== round) continue;
      const body = v.body != null && String(v.body).trim()
        ? String(v.body)
        : negoRichFromLines(v.text || '');
      const named = v.label && v.label !== 'Saved' ? ` · ${v.label}` : '';
      out.push({ key: 'v' + v.n, kind: 'version', n: v.n, roundN: round,
        label: `Round ${round} - V${out.length + 1}${named}`,
        sub: [`v${v.n} in the version history`, v.by, v.at ? String(v.at).slice(0, 10) : null]
          .filter(Boolean).join(' · '),
        body, text: v.text || '' });
    }
    return out;
  };
  /* OLDEST FIRST, top to bottom. The list reads as the sequence the document
     actually went through — every closed round in order, then the wording this
     round started from, then each saved version in the order it was taken, then
     what is on the table now — rather than the newest-first order it had, which
     put the original at the bottom of a list whose first entry changed every
     round, so "which one did we start from" was answered by a different row
     each time. */
  const out = [];
  /* THE ROUNDS THAT ARE OVER. Their wording was stored the moment each round
     closed and was then unreachable from this screen: the selector offered the
     live pair and nothing else, so "what did we start from before we conceded
     that in round 1" had no answer here at all, on a negotiation whose whole
     record was sitting in the contract.

     A closed round's WORKING version is deliberately not a separate entry —
     it is word for word the next round's baseline, which is the row directly
     below it. Two rows, one document, is the noise the choices list exists to
     keep out. */
  for (const r of closed){
    /* The body if the record has one, lifted from the text if it does not — a
       link made before closed rounds travelled carries neither, and a row that
       selects an empty document is worse than no row. */
    out.push({ key: `round${r.n}-baseline`, kind: 'round', roundN: r.n,
      label: `Round ${r.n} - Baseline`,
      sub: `the wording round ${r.n} was measured against`,
      body: (r.baselineBody && String(r.baselineBody).trim())
        ? String(r.baselineBody)
        : negoRichFromLines(r.baselineText || ''),
      text: r.baselineText || '' });
    out.push(...versionsIn(r.n));
  }
  const baseline = {
    key: 'baseline', kind: 'live', roundN: cur,
    label: `Round ${cur} - Baseline`,
    sub: cur > 1
      ? `the wording round ${cur - 1} ended on — what this round is measured against`
      : 'the wording this round is measured against',
    body: negoBaseBody(c), text: negoBaseText(c),
  };
  const working = {
    key: 'working', kind: 'live', roundN: cur,
    label: `Round ${cur} - Working Version`,
    sub: 'proposed redline',
    body: negoResolvedBody(c), text: negoResolvedText(c),
  };
  out.push(baseline, ...versionsIn(cur), working);
  return out;
}

/* ---- WHAT THE DROPDOWN OFFERS, AND WHY IT IS NOT EVERYTHING ----

   Every milestone the product passes takes a snapshot: the template being
   applied, each hand-over, each round closing, the send, the signature. All of
   them are real records and all of them belong in the version history — but a
   pane selector is not the version history. It asks "which two documents do you
   want side by side", and two entries holding WORD FOR WORD the same document
   are not two answers to it.

   That is not hypothetical. A contract opened for the first time offered three
   choices — Original Baseline, Working Version, and `v1 · Template "WH"` — of
   which the first and the third were the identical document under two names.
   One round of negotiation added more of exactly that kind, and the list became
   something to pick through rather than read.

   So a version is OFFERED only when it says something no entry above it already
   says. Nothing is renamed, merged or thrown away: negoVersionOptions still
   returns every one of them, which is what negoVersionByKey resolves against
   and what the version history panel reads — a key that used to work still
   works, it simply is not on the menu when a clearer name for the same document
   already is. */
function negoVersionChoices(c, keep){
  const all = negoVersionOptions(c);
  const wanted = new Set([].concat(keep || []).filter(Boolean));
  const seen = new Set();
  /* THE LIVE PAIR WINS A TIE, wherever it sits in the list. First-seen-keeps-it
     is the right rule between two archived entries, but not against the two
     rows that are always on the menu: a round CLOSING makes its wording the
     next round's baseline, so "Round 1 - V1 · Round 1 closed" and
     "Round 2 - Baseline" are word for word the same document, every time. The
     live row cannot be dropped, so without this both appear and the list is
     back to naming one document twice — the exact thing it exists to prevent,
     arriving through the entries that were added to make history reachable. */
  for (const o of all) if (o.kind === 'live'){
    const k = _negoSameDoc(o.text || '');
    if (k) seen.add(k);
  }
  const out = [];
  for (const o of all){
    const key = _negoSameDoc(o.text || '');
    /* The live pair is always on the menu — they are the two panes' home
       position, and a selector you cannot get back to the live round from is
       the trap the compare bar exists to prevent. So is anything currently
       selected: a <select> whose own value is missing from its options renders
       as blank or silently reassigns itself. */
    if (o.kind === 'live' || wanted.has(o.key) || !key || !seen.has(key)) out.push(o);
    if (key) seen.add(key);
  }
  return out;
}
const negoVersionByKey = (c, key) => negoVersionOptions(c).find(v => v.key === key) || null;
/* Is this pair the live negotiation, or a look back at history? */
const negoIsLivePair = (left, right) =>
  (left || 'baseline') === 'baseline' && (right || 'working') === 'working';

/* Two versions, compared clause by clause.
   Clause ids are durable and live in the document, so a clause can be followed
   across versions even when it has been renumbered or had clauses inserted
   above it — which is exactly what makes this comparison meaningful rather
   than a line-by-line guess. A clause present in one side only is reported as
   added or removed rather than silently skipped. */
function negoCompareVersions(c, leftKey, rightKey){
  const left = negoVersionByKey(c, leftKey || 'baseline');
  const right = negoVersionByKey(c, rightKey || 'working');
  if (!left || !right) return null;
  const seg = html => (window.clauseSegment ? clauseSegment(html || '') : []);
  const L = seg(left.body), R = seg(right.body);
  const byId = list => { const m = new Map(); for (const cl of list) if (cl.clauseId) m.set(cl.clauseId, cl); return m; };
  let lMap = byId(L), rMap = byId(R);

  /* MATCHING TWO SNAPSHOTS THAT DO NOT SHARE CLAUSE IDS.

     A clause is normally matched to its earlier self by the durable id stamped
     into the document. Older snapshots have none: an id is stamped when the
     negotiation starts, so anything captured before that — the template being
     applied, the first share — carries an unstamped body. Matching on id alone
     then found NOTHING in common and reported the two versions as a complete
     replacement: every clause Removed, every clause Added, on two documents
     that differ by one sentence. That is not a diff, it is a failure to
     compare, and it looked like the contract had been rewritten.

     Where the ids do not meet, fall back to what a reader would use: the
     clause's heading, and failing that its position. Both sides get a synthetic
     key so the rest of this function is unchanged — it still matches by key,
     the key is simply derived rather than stored. */
  const overlap = [...rMap.keys()].filter(k => lMap.has(k)).length;
  if (!overlap && (L.length || R.length)){
    const norml = cl => String(negoClauseLabel(cl) || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const keyed = list => {
      const used = new Map();
      return list.map((cl, i) => {
        const h = norml(cl);
        const base = h ? 'h:' + h : 'p:' + i;
        const n = (used.get(base) || 0) + 1;
        used.set(base, n);
        return { ...cl, clauseId: n > 1 ? `${base}#${n}` : base };
      });
    };
    const L2 = keyed(L), R2 = keyed(R);
    L.length = 0; L.push(...L2);
    R.length = 0; R.push(...R2);
    lMap = byId(L); rMap = byId(R);
  }
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

  const rows = [];
  const seen = new Set();
  for (const cl of R){
    const was = cl.clauseId ? lMap.get(cl.clauseId) : null;
    if (was) seen.add(cl.clauseId);
    if (!was){
      rows.push({ clauseId: cl.clauseId, label: negoClauseLabel(cl), state: 'added',
        ops: [{ op: 'ins', text: cl.text }], oldText: '', newText: cl.text });
      continue;
    }
    if (norm(was.text) === norm(cl.text)){
      rows.push({ clauseId: cl.clauseId, label: negoClauseLabel(cl), state: 'same',
        ops: [{ op: 'keep', text: cl.text }], oldText: was.text, newText: cl.text });
      continue;
    }
    rows.push({ clauseId: cl.clauseId, label: negoClauseLabel(cl), state: 'changed',
      ops: (window.redlineOps ? redlineOps(was.text, cl.text) : []),
      oldText: was.text, newText: cl.text });
  }
  for (const cl of L){
    if (!cl.clauseId || seen.has(cl.clauseId)) continue;
    rows.push({ clauseId: cl.clauseId, label: negoClauseLabel(cl), state: 'removed',
      ops: [{ op: 'del', text: cl.text }], oldText: cl.text, newText: '' });
  }
  const moved = rows.filter(r => r.state !== 'same');
  return { left, right, rows, moved: moved.length,
    live: negoIsLivePair(left.key, right.key),
    summary: moved.length
      ? `${moved.length} clause${moved.length === 1 ? '' : 's'} differ between ${left.label} and ${right.label}`
      : `${left.label} and ${right.label} say the same thing` };
}

/* ---------- the turn model ----------
   Whose move it is. Built on the existing share/response routes — no new
   endpoints, no websockets — because a public no-login URL that mutates a
   contract per click must not exist. */
function negoTurn(c){ return negoInit(c).turn === 'counterparty' ? 'counterparty' : 'owner'; }
function negoHandOver(c, opts = {}){
  const n = negoInit(c);
  const to = opts.to === 'owner' ? 'owner' : 'counterparty';
  /* ---- THE TURN AND THE SEND ARE TWO FACTS, NOT ONE ----
     `turn` is whose move it is. `turnAt` is when work last left our desk — and
     it is the ONLY thing that decides whether an ask has been sent
     (negoUnsentAsks measures against it). Refusing to act when the turn is
     already theirs conflated the two, and the dead end it produced was real:

       the counterparty answers a round and hands back  → turn = owner
       then raises two more asks of their own           → still turn = owner
       and presses Send                                 → "It is already their
                                                          turn", nothing sent

     Their drafts had nowhere to go for the rest of the negotiation unless the
     owner happened to move first. The owner's side had the same trap through
     the share path. So a hand-over to a side that already holds the turn still
     SENDS, when there is something of ours to send — the turn does not move,
     because it is already there, but the work leaves and `turnAt` records it.

     With nothing unsent it stays a no-op, which is the idempotency the share
     path relies on: two callers may both hand over after one send, and the
     second must not stamp again. */
  const alreadyTheirs = n.turn === to;
  const mine = to === 'owner' ? 'counterparty' : 'owner';
  /* opts.sentAnyway: the caller just RELEASED a solo send's hold, so drafts
     that really did travel in this batch read as already-sent to the
     arithmetic (their createdAt predates the last stamp). The idempotency
     this guard exists for is untouched — a second caller after one send
     passes no such flag and still no-ops. */
  if (alreadyTheirs && !negoUnsentAsks(c, mine).length && !opts.sentAnyway) return null;
  n.turn = to;
  n.turnAt = (window.nowISO ? window.nowISO() : new Date().toISOString());
  const by = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  /* Every turn close snapshots a version, so version compare keeps working and
     the history reads as a sequence of hand-offs rather than a pile of edits. */
  /* LISTED, and it has to be. A hand-over is the one moment in a negotiation
     that a person can name afterwards — "the draft we sent them on Tuesday",
     "what came back". Filed unlisted, a negotiation conducted entirely through
     tracked changes in the room produced a version list reading "0 versions",
     so there was nothing to compare and nothing to go back to unless somebody
     had remembered to press Snapshot before every send. The per-change copies
     stay unlisted; these are the milestones, one per turn. */
  const whom = to === 'counterparty' ? (c.counterparty || 'the counterparty') : 'the owner';
  if (window.captureVersion) captureVersion(c, `Round ${n.round} — sent to ${whom}`, by, { auto: true, listed: true });
  /* Named for what happened. A second batch sent while the turn was already
     theirs is not "the turn was handed over" — it was already there — and an
     audit line claiming otherwise misreads the negotiation for anyone
     reconstructing it later. */
  if (window.logAudit) logAudit(c, 'Negotiation', alreadyTheirs
    ? `Further changes sent to ${whom} by ${by} in round ${n.round} — it was already their turn`
    : `Turn handed to ${to} by ${by} in round ${n.round} — ${negoPending(c).length} change(s) awaiting a decision`);
  return { turn: to, at: n.turnAt, moved: !alreadyTheirs };
}
/* The banner both sides read. A READ of the change set and the turn, so it can
   never claim a state the record does not support. */
/* ASKS OF OURS THE OTHER SIDE HAS NEVER BEEN SHOWN.

   A change is handed over by sending the round, and `turnAt` records when that
   last happened. Anything of ours still pending and filed SINCE then has not
   left the building — nobody on the other side can answer it, because they have
   not seen it.

   This exists because the owner had the same dead end the counterparty's page
   was fixed for: propose something after handing over, and the change was
   filed, pending, with no send anywhere in the room. It waited for THEM to
   answer before we were allowed to tell them what we had asked. */
/* ---- DRAFTS THE SENDER CHOSE TO KEEP BACK (owner-asked 16 Aug 2026) ----
   A card's Send used to be a proxy onto the batch postbox — press one, publish
   everything — which the owner reported as a bug: "if I click on one card to
   send, it sends all the cards." Sending ONE change means the others must
   still read as unsent afterwards, and `turnAt` cannot say that: it is one
   timestamp for the whole desk, so the moment a solo send moves it, every
   older draft would silently flip to "Sent" without ever leaving.

   So the choice is its own record: negotiation.holdIds — the ids of our own
   drafts deliberately kept back from a send. It is read SELF-CLEANING (only
   ids that are still our own pending asks count; a decided, withdrawn or
   superseded change falls out on its own), folded into buildSharePayload's
   held-back set unconditionally exactly as the review's holds are, and
   CLEARED by the batch doors ("Send all N", Publish Round) before they press
   the postbox — a batch door means "send everything", including what a solo
   send once kept back. */
function negoHeldBackIds(c){
  const raw = (c && c.negotiation && Array.isArray(c.negotiation.holdIds))
    ? c.negotiation.holdIds : [];
  if (!raw.length) return [];
  const mine = new Set(negoPending(c).filter(x => x && x.authorSide === 'owner').map(x => x.id));
  return raw.filter(id => mine.has(id));
}
/* Keep back every unsent owner draft EXCEPT the one being sent. Called by the
   per-card send immediately before it presses the one postbox, so the round
   that goes out carries exactly the chosen change. */
function negoHoldOthers(c, keepId){
  const n = negoInit(c);
  const keep = String(keepId == null ? '' : keepId);
  n.holdIds = negoUnsentAsks(c, 'owner').map(x => x.id).filter(id => id !== keep);
  return n.holdIds.length;
}
/* A batch door means "send everything". Nothing else may clear the list — a
   hold that evaporated on a repaint would re-create the reported bug. */
function negoReleaseHold(c){
  if (c && c.negotiation && Array.isArray(c.negotiation.holdIds) && c.negotiation.holdIds.length){
    c.negotiation.holdIds = [];
    return true;
  }
  return false;
}
function negoUnsentAsks(c, side){
  const me = side === 'counterparty' ? 'counterparty' : 'owner';
  const at = (c && c.negotiation && c.negotiation.turnAt) || null;
  /* A draft deliberately kept back by a solo send stays unsent whatever the
     turn stamp says — see negoHeldBackIds above. Owner side only: the list is
     only ever written on the owner's desk. */
  const hb = me === 'owner' ? new Set(negoHeldBackIds(c)) : null;
  /* Measured against a hand-over that actually happened. With no `turnAt` at
     all nothing has ever been sent, and "unsent" is not the useful fact about
     the round — it is simply somebody's turn, and the turn already says so.
     Reading a missing turnAt as "everything is unsent" also mislabels the other
     side's asks: a change of theirs is on our record only because it was sent
     to us, whatever the turn stamp says. */
  return negoPending(c).filter(x => x && x.authorSide === me
    && ((hb && hb.has(x.id))
      || (at ? String(x.createdAt || '') > String(at)
           /* Nothing has ever been handed over. Our own pending asks are
              therefore unsent — the first round is unsent work like any other.
              Theirs are not: a change of theirs is on our record only because
              it was sent to us, whatever the turn stamp says. */
           : me === 'owner')));
}
function negoTurnBanner(c, side){
  negoInit(c);
  const me = side === 'counterparty' ? 'counterparty' : 'owner';
  const turn = negoTurn(c);
  const other = me === 'owner' ? (c.counterparty || 'the counterparty') : ((window.FIRST_PARTY) || 'the owner');
  const mine = negoPending(c).filter(x => x.authorSide !== me).length;
  if (turn === me)
    return { mine: true, unsent: 0, text: mine
      ? `Your turn — ${mine} change${mine === 1 ? '' : 's'} to review`
      : 'Your turn — propose changes or send it back' };
  const sent = c.negotiation.turnAt || null;
  /* AND "WAITING ON THEM" HAS TO BE TRUE TO BE SAID. With an ask of ours they
     have never seen, it is not: they are not the hold-up on a change nobody has
     shown them. The wait is stated as what it is, and the send that clears it
     is offered beside it. */
  const unsent = negoUnsentAsks(c, me).length;
  if (unsent) return { mine: false, unsent, sentAt: sent,
    text: `${unsent} change${unsent === 1 ? '' : 's'} you have not sent yet`
      + ` — ${other} cannot answer ${unsent === 1 ? 'it' : 'them'} until you do` };
  return { mine: false, unsent: 0, sentAt: sent, text: `Waiting on ${other}${sent ? '' : ''}` };
}

/* ---------- advancing the round ----------
   The resolved wording becomes the baseline the NEXT round is measured
   against, and the decided changes are archived onto the round record so the
   history reads as a sequence of decisions rather than one ever-growing pile.
   The archived records keep their hashes and their revisions, which is what
   lets verifyChangeChain walk a six-round history. */
function negoAdvanceRound(c, opts = {}){
  negoInit(c);
  const p = negoProgress(c);
  if (p.pending) return null;                 // an undecided change is not history yet
  const decided = negoChanges(c).filter(x => x.status === 'accepted' || x.status === 'rejected');
  if (!decided.length) return null;
  /* Superseded asks are ARCHIVED BESIDE the decided ones, not dropped: a
     countered proposal is history with a fingerprint on it, and `c.changes = []`
     below would otherwise erase it from the record at the exact moment the
     round that superseded it closed. They do not gate the close and do not
     count in the tally — nobody decided them; the table moved past them. */
  const settled = decided.concat(negoChanges(c).filter(x => x.status === 'superseded'));
  const n = c.negotiation.round;
  c.negotiation.rounds = Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds : [];
  c.negotiation.rounds.push({ n, at: (window.nowISO ? window.nowISO() : new Date().toISOString()),
    baselineBody: c.negotiation.baselineBody,
    baselineText: c.negotiation.baselineText,
    changes: settled.map(x => ({ ...x, thread: (x.thread || []).slice(),
      revisions: (x.revisions || []).slice() })) });
  const body = negoResolvedBody(c);
  c.negotiation.baselineBody = body;
  c.negotiation.baselineText = (window.richToText ? richToText(body) : '');
  c.negotiation.baselineFormat = (window.docFormat ? docFormat(c.format) : 'text');
  c.negotiation.round = n + 1;
  c.changes = [];                             // the archived set lives on the round
  /* A round closing makes the agreed wording the new baseline — that is an
     update to the contract, so it is listed even though nobody asked for it. */
  if (window.captureVersion) captureVersion(c, `Round ${n} closed`, opts.by
    || (window.currentUser && window.currentUser()?.name) || 'System',
    /* Stamped with the round that CLOSED, not the one starting. The counter
       above has already moved, and a snapshot named "Round 1 closed" filed
       under round 2 would be the one entry in the list nobody could place. */
    { auto: true, listed: true, roundN: n });
  if (window.logAudit) logAudit(c, 'Negotiation',
    `Round ${n} closed by ${opts.by || (window.currentUser && window.currentUser()?.name) || 'System'}` +
    ` — ${decided.filter(x => x.status === 'accepted').length} of ${decided.length} changes adopted;` +
    ` the agreed wording is now the baseline for round ${n + 1}`);
  /* N3: a live-numbered contract closes its numbering up HERE, with zero
     manual steps — the round boundary is the one moment the table is quiet by
     construction and the counterparty's sent snapshot is behind us. The N2
     engine does the work (format-preserving, references repointed, ids fixed,
     one audited act), so the numbers stay literal text in the stored document
     and every surface — and every freeze path — reads the same run. A literal
     contract is untouched: it gets the gap notice and the button instead. */
  if (negoLiveNumbered(c) && !negoNumberingLocked(c)){
    try{ negoRenumberApply(c, { by: opts.by, auto: true }); }catch(_){ /* the round is closed either way */ }
  }
  return c.negotiation.rounds[c.negotiation.rounds.length - 1];
}
/* Every change this negotiation has ever carried, live and archived, newest
   round last. What the history panel and the evidence pack read. */
function negoAllChanges(c){
  negoInit(c);
  const out = [];
  for (const r of (c.negotiation.rounds || [])) out.push(...(r.changes || []).map(x => ({ ...x, roundN: r.n })));
  out.push(...negoChanges(c).filter(x => x.status !== 'superseded'));
  return out;
}
/* A change's wording as it stood at a given hash — the prior revisions being
   recoverable is what makes update-in-place safe. */
function negoRevisionAt(c, id, hash){
  const ch = negoAllChanges(c).find(x => x.id === id);
  if (!ch) return null;
  if (ch.hash === hash) return { ...ch, current: true };
  const r = (ch.revisions || []).find(x => x.hash === hash);
  return r ? { ...r, id, current: false } : null;
}

/* ---------- the redline, as HTML ----------
   RENDERED FROM THE STORED OPS. Never re-diffed. What a reviewer sees is a
   picture of the record, so what was reviewed is provably what was decided on
   — the property that was missing when the diff algorithm changed mid-session
   and the same change started rendering differently on different days. */
function negoChangeHtml(ch, opts = {}){
  if (!ch) return '';
  if (Array.isArray(ch.ops) && ch.ops.length && window.redlineOpsHtml)
    return redlineOpsHtml(ch.ops, opts);
  const e = window.esc || _negoEsc;
  return e(ch.newText || '');
}
/* Kept for callers that hold two strings and no record (the compare surfaces).
   New code files a change and renders its ops. */
function negoDiffHtml(oldText, newText){
  return window.redlineOps ? redlineOpsHtml(redlineOps(oldText, newText)) : _negoEsc(newText);
}

/* ---------- intake normalisation ----------
   The three ways a contract becomes negotiable, converging on ONE shape. This
   is the function that makes the pivot true: after it runs, nothing downstream
   can tell which route the contract arrived by.

     1. standard template  — drafted in the wizard from js/templates.js
     2. custom/user template — state.settings.customTemplates, js/views/library.js
     3. uploaded Word file — docxExtract() in js/docx.js, the one and only place
        Word's format matters from here on

   Returns a descriptor of the normalised document. It does NOT invent wording:
   a contract with no body yet is reported as such rather than given one. */
function negoIntakePath(c){
  if (window.isUpload && window.isUpload(c)) return 'upload';
  if (c.templateId && window.customTemplates && customTemplates().some(t => t.id === c.templateId)) return 'custom-template';
  if (c.templateId) return 'custom-template';
  if (c.template && window.TEMPLATES && TEMPLATES[c.template]) return 'standard-template';
  return c.template ? 'standard-template' : 'unknown';
}
/* Extracted Word text → a rich document, ONE BLOCK PER LINE.
   docxExtract emits one line per Word paragraph, and a Word paragraph is a
   block, so this mapping is a faithful reading rather than a guess. It is also
   the only mapping that survives being negotiated: textToRich() splits on BLANK
   lines, and extracted Word text has none, so a whole contract became a single
   <p> and rewriting one line took the other clauses with it.

   The first heading line is the document's title (<h1>); later ones are section
   headings (<h2>). docLineKind() decides which lines are headings. */
/* STRUCTURE COMES FROM THE WORDING, NOT FROM THE LINE BREAKS.

   This used to emit one <p> per line of the source text, which is only correct
   if every line of the source is a paragraph. Neither intake path produces
   that. The structured PDF reader emits one line per VISUAL line, so a sentence
   that wrapped three times became three paragraphs and "1. Services" became
   body text; the fallback scrape emitted no line breaks at all, so the entire
   agreement became a single paragraph with its page footers inside it.

   docRichFromText reads the numbering, the bullet marks and the capitalisation
   the contract already uses to say what its own parts are, and treats the line
   breaks as what they are — where the page happened to end. Kept as a named
   function because the whole intake path calls it by this name. */
function negoRichFromLines(text){
  if (window.docRichFromText) return docRichFromText(text);
  const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let seenTitle = false;
  return String(text == null ? '' : text).split('\n').map(line => {
    const t = line.trim();
    if (!t) return '';
    const kind = window.docLineKind ? docLineKind(t) : 'text';
    if (kind !== 'heading') return `<p>${e(t)}</p>`;
    if (!seenTitle){ seenTitle = true; return `<h1>${e(t)}</h1>`; }
    return `<h2>${e(t)}</h2>`;
  }).filter(Boolean).join('');
}
function negoNormalizeDocument(c, opts = {}){
  const path = negoIntakePath(c);
  /* An uploaded document's wording lives in upload.extractedText until someone
     edits it. Lifting it into the rich model here — once, at intake — is what
     lets it be negotiated clause by clause like anything else. */
  if (path === 'upload' && c.redlineText == null){
    const text = (c.upload && c.upload.extractedText) || '';
    if (text.trim()){
      c.redlineText = negoRichFromLines(text);
      c.format = window.RICH_FORMAT || 'rich';
    }
  }
  negoInit(c, opts);
  negoMigrate(c);
  const body = negoBodyOf(c);
  const text = (window.docPlainText ? docPlainText(c) : '') || '';
  return {
    path,
    format: (window.docFormat ? docFormat(c.format) : 'text'),
    rich: !!(window.isRich && isRich(c.format)),
    text,
    body,
    clauses: negoClauses(c),
    changes: negoChanges(c),
    round: negoRound(c),
    turn: negoTurn(c),
    baselineText: negoBaseText(c),
    baselineBody: negoBaseBody(c),
    empty: !text.trim(),
  };
}

/* ---------- migration ----------
   Contracts that predate this model carry changes keyed to line strings
   (`clause:#3`) rather than to clause ids. Their clause ids are stamped on
   first open by negoInit; this re-keys the changes.

   Each old change is matched by its `oldText` against the clause bodies of the
   baseline. Anything that matches is re-anchored and carries on. Anything that
   does NOT match is flagged `needsReview` and left visible — never silently
   dropped, because a dropped change is an ask that quietly stops being asked,
   which is the one failure this whole model exists to prevent.

   A contract with nothing pending migrates with nothing to do. */
function negoMigrate(c){
  negoInit(c);
  const changes = c.changes || [];
  if (!changes.length) return { migrated: 0, flagged: 0, already: true };
  const stale = changes.filter(x => !x.hashV || x.hashV < NEGO_HASH_V
    || !/^cl_/.test(String(x.clauseId || '')));
  if (!stale.length) return { migrated: 0, flagged: 0, already: true };

  const clauses = negoClauseList(c);
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const byText = new Map();
  for (const cl of clauses) byText.set(norm(cl.text), cl);

  let migrated = 0, flagged = 0;
  for (const x of stale){
    const want = norm(x.oldText || x.newText);
    let cl = byText.get(want) || null;
    if (!cl && want) cl = clauses.find(k => norm(k.text).includes(want) || want.includes(norm(k.text))) || null;
    /* The change record shape moves too: type → changeType, and the ops it
       never had are computed once, here, from the wording it does have. */
    if (!x.changeType) x.changeType = x.type === 'insert' ? 'insertClause'
      : x.type === 'delete' ? 'deleteClause' : 'modify';
    if (!Array.isArray(x.ops) || !x.ops.length)
      x.ops = x.changeType === 'modify' && window.redlineOps
        ? redlineOps(x.oldText || '', x.newText || '')
        : x.changeType === 'insertClause' ? [{ op: 'ins', text: x.newText || '' }]
        : [{ op: 'del', text: x.oldText || '' }];
    if (cl){
      x.clauseId = cl.clauseId;
      x.clauseLabel = x.clauseLabel || negoClauseLabel(cl);
      x.needsReview = false;
      migrated++;
    } else {
      /* Kept, shown, and marked. The wording is still on the record; what is
         lost is only the certainty about WHICH clause it belongs to, and that
         is exactly what a human is being asked to restore. */
      x.needsReview = true;
      x.needsReviewWhy = 'This change was filed before clauses had durable ids, and its original '
        + 'wording no longer matches any clause in the document. It has been kept for review — '
        + 'confirm which clause it belongs to before deciding it.';
      flagged++;
    }
  }
  if (window.logAudit && (migrated || flagged)) logAudit(c, 'Negotiation',
    `Clause identity migrated — ${migrated} change${migrated === 1 ? '' : 's'} re-anchored to durable clause ids`
    + (flagged ? `; ${flagged} could not be matched and ${flagged === 1 ? 'is' : 'are'} flagged for review (none dropped)` : ''));
  return { migrated, flagged, already: false };
}

/* ---- "WAITING ON THEM" HAS TO BE TRUE BEFORE IT IS SAID ----
   (owner-reported on MK-255, 13 Aug 2026.) We refused a change the
   counterparty had raised. Their card read "Refused · waiting on them", the
   negotiations list banded the whole agreement under "With the other side",
   and the row pill said the same — and the change was not on their copy at
   all. So the product asserted a wait against somebody who could not see the
   thing they were supposedly holding up, and the deal simply stopped.

   THE MODEL IS THE TURN BANNER, which has refused to make this claim about
   our own unsent asks since it was written: it states the wait as what it
   actually IS and offers the send beside it. Copy the honesty, not the code.

   WHAT CAN HONESTLY BE ASKED, and it is less than it looks. Nothing records
   WHEN their copy was last refreshed — the silent catch-up deliberately does
   not stamp the share when it succeeds — so "have they seen THIS refusal"
   cannot be answered exactly. Three options were weighed and A was chosen:

     A  claim it only where a STANDING LINK EXISTS; otherwise say the truth,
        that they have no live copy, and offer the send.        <- BUILT
     B  also use whether they have opened it since.             <- refused
     C  stamp the contract when a payload refresh succeeds.     <- not now

   B IS WORSE THAN IT LOOKS and is the one to argue with later: "they opened
   it" is true of a link opened last week, before this refusal existed, so it
   would replace one untruth with a subtler one — a card reading "opened" that
   the reader takes to mean "seen this". If more precision is ever wanted, C is
   the honest upgrade, not B.

   THREE ANSWERS, NOT TWO, and the third is the whole safety of this. An empty
   share cache means "nobody has asked" as often as it means "there is
   nothing", and reading the first as the second would invent a NEW untruth to
   replace the old one. 'unknown' says nothing and changes nothing.

   shareIsStanding / standingShares (js/core.js) is the ONE predicate for
   "durable, not revoked, not expired" — it is the client's reading of what the
   payload-refresh route will actually accept. NOTE FOR THE NEXT READER: the
   work order for this change said that test was still written out inline in
   two places and asked for it to be named once. It was already named, on 12
   August, by the MK-255 fix — both callers ask the one predicate, and there is
   no third copy to fold in. Nothing to do, said out loud rather than silently
   skipped. */
function negoTheirCopy(c){
  if (typeof window === 'undefined') return 'unknown';
  /* Their own page has no view of our links at all, and never should — asking
     from that seat could only ever produce a guess. */
  if (window.PORTAL_MODE) return 'unknown';
  if (!window.sharesKnown || !window.standingShares) return 'unknown';
  if (!sharesKnown(c)) return 'unknown';
  return standingShares(cachedShares(c)).length ? 'live' : 'none';
}

/* ---- A NAME ON A CARD IS A GLANCE, NOT A RECORD (owner-asked, 13 Aug 2026) ----
   "Young Mbagaya" becomes "Young M." — first name, then the initial of the
   surname. ONE function, reached by every card that needs it, because the
   alternative is the rule copied into two renderers and drifting apart the
   first time either is touched.

   IT LIVES WITH THE CHANGE MODEL, not with the app shell, and that placement
   was chosen twice. It belongs to the CARD, and every surface that draws a
   card — both card renderers, the review chip, the desk's drafted-by line,
   the counterparty's page and the phone — already stands on this module. In
   the shell it was invisible to every harness that mounts a card without a
   shell, so the shortening silently did nothing there: a feature nothing can
   test. Declared with `function` deliberately — that is what puts it on
   `window`, which is how the other modules reach it; a `const` would be a
   lexical binding nobody else can see, a trap this project has hit before.

   CARDS ONLY, and the boundary matters. The audit trail, the emails, the
   reviewer picker, the signing route and the approval chain all keep the
   whole name: a record and a chooser have to be unambiguous, and "Young M."
   in a list of six colleagues is a guess. A card is read at a glance, in a
   column 285px wide, beside a status and an id.

   NOTHING IS LOST, because every caller keeps the full name in the hover text
   of the line it shortens.

   FOUR SHAPES THAT MUST COME OUT SENSIBLY:
     · nothing at all → nothing at all, never " ." ;
     · one word ("Legal", "Copilot") → itself: there is no surname to cut;
     · already an initial ("Young M.") → itself, with one dot rather than two;
     · THE NAME THAT IS A COMPANY. A counterparty who files under their own
       company name gives us "Nordfrakt Logistik AB" in the author field, and
       initialling that produces "Nordfrakt L.", which is not a shortening of
       anything — it is a different company. So a caller that knows the
       organisation passes it, and a name equal to it comes back whole;
     · AND THE NAME THAT IS ALREADY A LINE. Some records carry an author
       written as "Erik Lindqvist · Nordfrakt Logistik AB" — a person and
       their company already joined with the same separator the card's meta
       line uses. Initialling that reads the company's last word as a surname
       and produces "Erik A.", which is nobody. Anything carrying the
       separator is a composed label rather than a person's name and comes
       back whole. */
function cardName(name, org){
  const full = String(name == null ? '' : name).trim().replace(/\s+/g, ' ');
  if (!full) return '';
  if (full.includes('\u00b7')) return full;
  if (org && full.toLowerCase() === String(org).trim().toLowerCase()) return full;
  const parts = full.split(' ');
  if (parts.length < 2) return full;
  const letter = [...parts[parts.length - 1]][0] || '';
  /* A surname that does not start with a letter is not one we can initial —
     "Young (Legal)" and the like come back whole rather than as "Young (." */
  if (!/\p{L}/u.test(letter)) return full;
  return parts[0] + ' ' + letter.toUpperCase() + '.';
}

/* Read at press time, never cached: a getter, because the value changes on every
   refusal and a copied snapshot would report the wrong one. */
if (typeof window !== 'undefined' && !Object.getOwnPropertyDescriptor(window,'negoLastRefusal'))
  Object.defineProperty(window, 'negoLastRefusal', { get: () => negoLastRefusal, configurable: true });
if (typeof window !== 'undefined') Object.assign(window, {
  cardName, negoTheirCopy,
  negoClauseLabel, negoClauses, negoClauseList, negoClauseById, negoClauseNowById,
  negoMeasuredFrom, negoMeasuredAlike, negoBodyOf,
  negoWordsMoved, negoHeadingAsk, negoStandingHeading, negoFrontClause, negoIsFrontId,
  negoExecuted, negoNumberingLocked, negoNumberingGaps, executedDivergence, negoExecutedText,
  negoBrokenRefs, negoAllRefs, negoActorLabel,
  negoRenumberBlocked, negoRenumberPlan, negoRenumberApply, negoTimeline, negoIntegrityReport, negoLiveNumbered,
  negoAnySignature, negoWordingFrozen, negoInit, negoStampContract, negoFreshenBaseline, negoBaseText, negoBaseBody, negoRound,
  negoChanges, negoChangeById, negoPending, negoOpenChanges,
  negoNextId, negoHashInput, negoHash, negoIssue, negoIssuances, negoShortHash,
  verifyChangeChain, negoVerifyCached, negoRefreshVerification, negoInvalidateVerification,
  NEGO_HASH_V, NEGO_HASH_VERIFIES,
  negoSummariseOps, negoFileChange, negoEditClause, negoInsertClause, negoReviseInsert, negoDeleteClause,
  negoNoteFor, negoProposedBodyFromText, negoBodyFromText, negoFileProposal, negoResolvedBody, negoResolvedText, negoCommitBody, negoCommitText,
  negoImportReturnedDocx, negoTopicForQuote, negoOriginalBaselineText, negoClauseJourney,
  negoResolve, negoResolveAll, negoWithdraw, negoUnwithdraw, negoRetractDraft,
  negoNormalizeText, negoFindPassage, negoResolvePassage, negoPassageIsWhole,
  negoPostComment, negoTagPeople, negoMentionsIn, negoCommentIsStale, negoTopicFor, negoThreadOf, negoMergedThread, negoThreadUnread,
  negoNoteIsMine, negoMyNote, negoEditNote, negoDeleteNote, negoNoteDelivered,
  negoBuildBody, negoCleanBody, negoCleanText,
  negoProgress, negoReadyToSign, negoOpenPoints,
  negoAlignment, negoAlignmentWhy, negoSigningBlockers, negoSignalReady, negoReadySignal, negoSideSigned,
  negoChangeSummary, negoCopilotContext, NEGO_CTX_CHARS,
  negoCopilotRecord, NEGO_COPILOT_CAP,
  negoVersionOptions, negoVersionChoices, negoVersionByKey, negoVersionRound,
  negoIsLivePair, negoCompareVersions,
  negoTurn, negoHandOver, negoTurnBanner, negoUnsentAsks,
  negoHeldBackIds, negoHoldOthers, negoReleaseHold,
  negoAdvanceRound, negoAllChanges, negoRevisionAt,
  negoChangeHtml, negoDiffHtml,
  negoIntakePath, negoNormalizeDocument, negoRichFromLines, negoMigrate });
if (typeof module !== 'undefined' && module.exports) module.exports = {
  negoHashInput, negoShortHash };
