# OPEN ISSUES

Known defects and gaps that are **not yet fixed**. One entry per issue, newest
at the bottom. When an issue is fixed, move it to `BUGLOG.md` (which is a record
of fixes) and delete it from here.

---

## OI-1. A cross-reference to a deleted clause is never flagged

**Status:** open · **Area:** `js/negotiation.js`, `js/clausemodel.js` · **Severity:** high

**What is wrong.** Nothing in the codebase detects internal cross-references.
Grepping for `cross-ref` / `crossRef` finds three passing mentions in comments
(`js/negotiation.js:1054`, `js/views/doclab.js:1224`, `js/docx.js:419`) and no
implementation anywhere.

So when a `deleteClause` change is accepted and `negoApply` calls
`clauseRemove(body, ch.clauseId)` (`js/negotiation.js:783-785`), a surviving
clause reading *"subject to the terms of Clause 9"* is left pointing at a clause
that no longer exists. No warning, no flag, no entry in the change record. The
sentence stays in the executed document and reads as valid.

**What is NOT wrong — and why this is the milder half of the problem.** Because
clause numbers are literal text lifted from the heading and are never
recomputed from position (see `clauseParseHeading`, and the rule stated at
`js/views/negotiation.js:6101`), deleting Clause 9 does not shift Clause 10 into
its place. A cross-reference therefore never silently *repoints at the wrong
clause*, which is the worse failure mode. It points at nothing. That is
detectable; a wrong-but-plausible reference is not.

**Why it has to be a warning, not an auto-fix.** Silently rewriting the words of
a clause to repair a reference changes what the contract means. Every serious
CLM flags and asks. The same reasoning already governs the merge refusal at
`js/views/negotiation.js:5311`.

**Sketch of the fix.**

1. On accepting a `deleteClause` — and again on demand for a whole document —
   scan the remaining clause text for references, using the number formats
   `clauseParseHeading` already knows: `Clause 9`, `Article 9`, `Section 9.2`,
   `clause 8.2(a)`, `§9`.
2. Resolve each reference against the `num` of the surviving clauses.
3. Any reference resolving to nothing raises a warning on the clause that
   *contains* the reference — not on the deleted one — naming both, e.g.
   *"Clause 15 refers to Clause 9, which has been deleted."*
4. The warning is advisory. It never edits wording. Whoever is negotiating
   either revises the referring clause (an ordinary tracked change, so the other
   side sees it) or dismisses the warning.

**Depends on nothing.** This is additive and touches no existing behaviour: it
reads the resolved document and produces warnings. No change to the change
model, the seal, the diff engine or `richToText`.

**Related but separate:** deleting a clause leaves a gap in the visible numbering
(1..8, 10, 11...). That is deliberate — see OI-2 — and fixing it does not fix
this issue. A renumbered document has *more* broken references, not fewer,
because references to clauses that still exist also go stale.

---

## OI-2. Deleting a clause leaves a visible gap in the numbering, with nothing said about it

**Status:** partly done — the notice and the lock have shipped; the renumberer has not.
**Area:** `js/clausemodel.js`, `js/negotiation.js`, `js/views/negotiation.js` · **Severity:** medium

**Shipped** (`f98`, 25 tests):

- `clauseNumberGap(nums, num)` — is one number missing from the run its siblings
  form, and what sits either side of it. Sibling-aware, so `8.2` is compared
  against `8.1`/`8.3` and never against `8` or `9`.
- `negoNumberingGaps(c)` — the gaps this contract's own accepted deletions
  account for, read from `negoAllChanges` because closing the round is what both
  creates the gap and archives the change that caused it.
- `negoExecuted(c)` / `negoNumberingLocked(c)` — the execution predicate, named
  once. `negoResolve`'s inlined copy now calls it.
- `negoNumberingNoticeHtml` — drawn in the room's working pane and on the
  redline workbench, amber on a draft and slate once executed.

**Deliberately NOT scanned for skipped numbers.** The prototype's own contract is
numbered 1, 4, 5, 6, 9, 12 because it is an extract, and `clausefixtures.js`
keeps it that way on purpose. A scan reports six faults on it and would do the
same to every uploaded contract shaped like it. The gap is reported only where an
accepted `deleteClause` accounts for it.

**Still open — steps 2 to 4 of the sketch below: the renumberer itself.** There
is no `Renumber clauses` action. `clauseReplaceHeading` remains the primitive it
will be built on and still has no callers. `negoNumberingLocked` is the gate that
action must pass; it is written and tested ahead of the thing it gates,
deliberately, so it cannot be forgotten at the time.

---

### Original write-up, kept for the parts not yet built

**What is wrong.** `clauseRemove` takes out the heading and body and closes
nothing. A contract numbered 1..24 that loses Clause 9 renders as
1..8, 10..24. Nothing in the UI acknowledges the gap, so a reader's first
reading is that the document is defective.

**Why the current behaviour is right as far as it goes.** Numbers are the text
the file actually carried. Rebuilding them from `num` + `title` is what produced
`"1.1. Definitions"` (a full stop nobody typed) and `"8.2. (a)"` from
`"8.2(a)"` — recorded at `js/views/negotiation.js:6096-6101`. A contract is
cited by those exact strings. Printing a number the source file does not contain
is a renumbering however small, so the literal heading is used and left alone.
That rule stays.

**What is missing is the deliberate act.** Renumbering should be possible, just
never a side effect.

**Sketch of the fix.**

1. **Detect and say so.** Where the surviving `num` values are not consecutive,
   show a notice on the document: *"Clause numbering has gaps — 9 is missing."*
   This alone converts a bug-looking document into an intentional one.
2. **Offer an explicit `Renumber clauses` action** beside the notice. It
   previews every heading it would change, old → new, and applies only on
   confirmation. Each rewritten heading goes through `clauseReplaceHeading` as
   an ordinary tracked change, so the other side sees the renumbering and no id
   moves (`f40`: *renumbering the whole contract moves no id*).
3. **Never renumber automatically on accept.** Auto-renumbering every accepted
   deletion floods the version comparison — one deletion would report fifteen
   changed headings — and moves numbers under a counterparty who is mid-review
   and citing them in correspondence.
4. **Two hard constraints on the renumberer.**
   - It rewrites only the numeric part and preserves the exact separator and
     shape the heading carried. `8.2(a)` becomes `8.1(a)`, never `8.1. (a)`.
   - It is hierarchy-aware. Deleting `1.1(b)` renumbers `(c)` to `(b)` and must
     not touch Clause 2.
5. **Lock it after signature.** A signed contract's numbers are cited by
   amendments and by any dispute, so they must never move. Once a contract is
   sealed, `Renumber clauses` is unavailable, and a deletion in a later
   amendment is marked `9. [Intentionally left blank]` rather than closing the
   gap — the standard drafting convention, and it also leaves any surviving
   reference to Clause 9 pointing at something that explains itself.

**Suggested order.** Ship step 1 and the post-signature lock first — they are
small and remove the "this looks broken" reading. The nested renumberer in
steps 2–4 is the larger piece and can follow.
