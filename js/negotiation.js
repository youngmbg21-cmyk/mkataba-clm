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
const negoClauseById = (c, id) => negoClauseList(c).find(cl => cl.clauseId === id) || null;

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
      note: ch.note || null, ch });
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
  const body = negoStampContract(c);
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

   The canonical string is settled here and stamped `hashV: 2` on every record,
   so a future change to it is detectable rather than a silent verification
   failure. Its fields, in order:

     contractRef | clauseId | changeType | oldText | newText
                 | author | createdAt | prevChangeHash

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
const NEGO_HASH_V = 2;
function negoHashInput(contractRef, iss){
  return ['hati-change-v2',
    String(contractRef == null ? '' : contractRef),
    String(iss.clauseId || ''),
    String(iss.changeType || ''),
    String(iss.oldText == null ? '' : iss.oldText),
    String(iss.newText == null ? '' : iss.newText),
    String(iss.author || ''),
    String(iss.createdAt || ''),
    String(iss.prevChangeHash || ''),
  ].join('\n');
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
    if (iss.hashV !== NEGO_HASH_V)
      return { ok: false, checked: list.length, failedAt: iss.id || null, seq: iss.seq || null,
        reason: 'unknown-hash-version',
        detail: `#${iss.id} was written under hash format v${iss.hashV || 1}; this build verifies v${NEGO_HASH_V}` };
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
  if (negoExecuted(c)){
    if (window.toast) toast('This contract is executed — record an amendment instead', 'err');
    return null;
  }
  negoInit(c);
  const side = opts.side === 'owner' ? 'owner' : 'counterparty';
  const author = String(opts.author || (side === 'owner'
    ? ((window.currentUser && window.currentUser()?.name) || 'This workspace')
    : (c.counterparty || 'The counterparty'))).trim();
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
     changes is an index nobody reads. */
  if (draft.changeType === 'modify' && window.redlineIsNoop && redlineIsNoop(ops)) return null;

  const live = c.changes.find(x => x.clauseId === draft.clauseId
    && x.status === 'pending' && x.authorSide === side && x.roundN === roundN);

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
    live.headingText = draft.headingText != null ? draft.headingText : live.headingText;
    live.ops = ops;
    live.createdAt = at;
    live.updatedAt = at;
    live.summary = String(opts.summary || '').trim() || negoSummariseOps(draft.changeType, ops, oldText, newText);
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
    headingText: draft.headingText || null,
    afterClauseId: draft.afterClauseId || null,
    ops,
    hash: null, hashV: NEGO_HASH_V, prevChangeHash: null, seq: 0,
    revisions: [],
    status: 'pending',
    author, authorSide: side,
    createdAt: at, updatedAt: at,
    roundN,
    clauseLabel: draft.clauseLabel || negoClauseLabel(cl) || null,
    summary: String(opts.summary || '').trim() || negoSummariseOps(draft.changeType, ops, oldText, newText),
    note: opts.note || null,
    thread: [],
    needsReview: !!draft.needsReview,
    needsReviewWhy: draft.needsReviewWhy || null,
  };
  await negoIssue(c, ch);
  c.changes.push(ch);
  if (window.logAudit && !opts.quiet) logAudit(c, 'Negotiation',
    `#${ch.id} proposed by ${author} in round ${roundN} — “${ch.summary}”` +
    ` on ${ch.clauseLabel || ch.clauseId} · fingerprint ${ch.hash}` +
    `${side === 'counterparty' ? ' (the counterparty\'s wording, recorded in their name)' : ''}` +
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
  const cl = negoClauseById(c, clauseId);
  if (!cl) return null;
  const body = window.sanitizeRich ? sanitizeRich(newBodyHtml) : String(newBodyHtml || '');
  const newText = window.richToText ? richToText(body) : '';
  return negoFileChange(c, { clauseId, changeType: 'modify',
    oldText: cl.text, newText, bodyHtml: body, clauseLabel: negoClauseLabel(cl) }, opts);
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
/* A proposed deletion. The wording is NOT removed here and is not removed when
   the change is filed — it is struck through in the working pane and stays in
   the document until someone accepts the deletion. */
async function negoDeleteClause(c, clauseId, opts = {}){
  negoInit(c);
  const cl = negoClauseById(c, clauseId);
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
      { ...opts, note: negoNoteFor(opts.notes, now.text, was.clauseId) || opts.note || null, quiet: true });
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
    const next = clauseReplaceBody(body, ch.clauseId, ch.bodyHtml || `<p>${_negoEsc(ch.newText)}</p>`);
    if (next != null) body = next;
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
  /* Read the permission through `window` deliberately, not as a bare call.
     js/core.js declares `const canEdit = …`, which is a LEXICAL binding rather
     than a property of the global object — so a bare `canEdit()` here resolves
     to that binding and cannot be substituted, while `window.canEdit` is the
     name every other module reaches this function by. */
  if (!opts.side && typeof window.canEdit === 'function' && !window.canEdit()){
    if (window.toast) toast('Viewers cannot decide changes', 'err');
    return null;
  }
  /* NOBODY RULES ON THEIR OWN ASK. Enforced here, in the model, and not only in
     the UI — a side that could accept its own proposal could adopt wording the
     other party never saw. */
  if (opts.side && opts.side === ch.authorSide && status !== 'pending'){
    if (window.toast) toast('You cannot decide your own proposal', 'err');
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
  if (negoExecuted(c)){
    if (window.toast) toast('This contract is executed — record an amendment instead', 'err');
    return null;
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
    if (window.toast) toast('Only a refused ask can be withdrawn', 'err');
    return null;
  }
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  if (side !== ch.authorSide){
    if (window.toast) toast('Only the side that asked for this can withdraw it', 'err');
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
    if (window.toast) toast('Only the side that drafted this can retract it', 'err');
    return null;
  }
  if (ch.status !== 'pending'){
    if (window.toast) toast('This change already has an answer, so it can\'t be retracted', 'err');
    return null;
  }
  if (!negoUnsentAsks(c, side).some(x => x && x.id === id)){
    if (window.toast) toast('This change has already been sent, so it can\'t be retracted', 'err');
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
  const msg = { who, side, visibility,
    at: (window.nowISO ? window.nowISO() : new Date().toISOString()),
    text: body.slice(0, 2000), atHash: ch.hash || null };
  ch.thread.push(msg);
  if (window.logAudit) logAudit(c, 'Negotiation',
    `${visibility === 'shared' ? 'Comment' : 'Internal note'} posted on #${ch.id} by ${who}`
    + ` — the contract is unchanged and no round was opened`
    + (visibility === 'shared' ? '' : '; it stays inside this organisation'));
  return msg;
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
  if (!a.aligned){
    if (window.toast) toast('Not everything is settled yet — ' + negoAlignmentWhy(c, side), 'err');
    return null;
  }
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
  if (alreadyTheirs && !negoUnsentAsks(c, mine).length) return null;
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
function negoUnsentAsks(c, side){
  const me = side === 'counterparty' ? 'counterparty' : 'owner';
  const at = (c && c.negotiation && c.negotiation.turnAt) || null;
  /* Measured against a hand-over that actually happened. With no `turnAt` at
     all nothing has ever been sent, and "unsent" is not the useful fact about
     the round — it is simply somebody's turn, and the turn already says so.
     Reading a missing turnAt as "everything is unsent" also mislabels the other
     side's asks: a change of theirs is on our record only because it was sent
     to us, whatever the turn stamp says. */
  return negoPending(c).filter(x => x && x.authorSide === me
    && (at ? String(x.createdAt || '') > String(at)
           /* Nothing has ever been handed over. Our own pending asks are
              therefore unsent — the first round is unsent work like any other.
              Theirs are not: a change of theirs is on our record only because
              it was sent to us, whatever the turn stamp says. */
           : me === 'owner'));
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
  const n = c.negotiation.round;
  c.negotiation.rounds = Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds : [];
  c.negotiation.rounds.push({ n, at: (window.nowISO ? window.nowISO() : new Date().toISOString()),
    baselineBody: c.negotiation.baselineBody,
    baselineText: c.negotiation.baselineText,
    changes: decided.map(x => ({ ...x, thread: (x.thread || []).slice(),
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

if (typeof window !== 'undefined') Object.assign(window, {
  negoClauseLabel, negoClauses, negoClauseList, negoClauseById, negoBodyOf,
  negoExecuted, negoNumberingLocked, negoNumberingGaps, executedDivergence, negoExecutedText,
  negoBrokenRefs, negoAllRefs, negoActorLabel,
  negoRenumberBlocked, negoRenumberPlan, negoRenumberApply, negoTimeline, negoIntegrityReport, negoLiveNumbered,
  negoInit, negoStampContract, negoFreshenBaseline, negoBaseText, negoBaseBody, negoRound,
  negoChanges, negoChangeById, negoPending, negoOpenChanges,
  negoNextId, negoHashInput, negoHash, negoIssue, negoIssuances, negoShortHash,
  verifyChangeChain, negoVerifyCached, negoRefreshVerification, negoInvalidateVerification, NEGO_HASH_V,
  negoSummariseOps, negoFileChange, negoEditClause, negoInsertClause, negoDeleteClause,
  negoNoteFor, negoProposedBodyFromText, negoBodyFromText, negoFileProposal, negoResolvedBody, negoResolvedText, negoCommitBody, negoCommitText,
  negoResolve, negoResolveAll, negoWithdraw, negoUnwithdraw, negoRetractDraft,
  negoNormalizeText, negoFindPassage, negoResolvePassage, negoPassageIsWhole,
  negoPostComment, negoCommentIsStale, negoTopicFor, negoThreadOf, negoMergedThread, negoThreadUnread,
  negoBuildBody, negoCleanBody, negoCleanText,
  negoProgress, negoReadyToSign, negoOpenPoints,
  negoAlignment, negoAlignmentWhy, negoSigningBlockers, negoSignalReady, negoReadySignal, negoSideSigned,
  negoChangeSummary, negoCopilotContext, NEGO_CTX_CHARS,
  negoCopilotRecord, NEGO_COPILOT_CAP,
  negoVersionOptions, negoVersionChoices, negoVersionByKey, negoVersionRound,
  negoIsLivePair, negoCompareVersions,
  negoTurn, negoHandOver, negoTurnBanner, negoUnsentAsks,
  negoAdvanceRound, negoAllChanges, negoRevisionAt,
  negoChangeHtml, negoDiffHtml,
  negoIntakePath, negoNormalizeDocument, negoRichFromLines, negoMigrate });
if (typeof module !== 'undefined' && module.exports) module.exports = {
  negoHashInput, negoShortHash };
