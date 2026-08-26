# WORK ORDER — clause kinds (option E)

**Raised by:** Young, 26 Aug 2026, off the playbook-scan bug on a lease.
**Status:** **PLAN ONLY — nothing here is built.** Written for a ruling, not
for a branch. Options A, B, C and E's cheap half have shipped; this is what is
left of E and it is the only piece that needs a decision before anyone starts.

---

## The plain-English version, for the owner

Right now, when HaTi checks a contract against Our standards, it has to work
out **which clause each finding belongs to**. It does that by looking for the
sentence Copilot quoted. When it cannot find that sentence exactly, it falls
back to comparing words — and contract clauses share a lot of words.

We already made that fallback much stricter, and it now refuses when it is not
sure. That was the cheap half, and it took the risk off the table.

The full version stops guessing altogether: **every clause gets a kind**
— payment, liability, confidentiality, data protection, termination — and
**every rule already says which kind it governs, because that is its own name.**
A payment rule can then only ever touch a payment clause.

You have already ruled on the one thing that was in doubt: **the kind is never
printed.** Nothing appears on the contract, nothing is added to Our standards,
and there is no new screen. It is arithmetic that happens when a document is
read.

**What is left to decide is only whether to build it.** The section below is
what it would cost and what could go wrong.

---

## Why this exists

Reported 26 Aug 2026: on Clause 2 of an equipment lease, the scan rail listed a
**Data protection** rule and its "Use our standard" struck out the whole
lease-charge sentence and put a data protection paragraph in its place.

Three faults stacked, and A, B and the slice of E have closed all three. What
remains is the one underneath them: **HaTi decides which clause a rule is about
by comparing text, and text comparison has no idea what a clause is for.**

---

## What is already true (do not rebuild it)

Shipped 26 Aug 2026, in the order they landed:

1. **The rail is two lists with two verbs.** A rule that located this clause may
   edit it; a standard the scan found nowhere may only be ADDED as a new clause.
   Neither can reach the other's verb.
2. **The library outranks Copilot.** Three named wordings — `preferred`,
   `fallback`, `draft` — so nothing wears another's name.
3. **The card says what a press takes**, and each verb carries its own cost.
4. **The matcher refuses when it is not sure.** `RL_PB_MATCH_MIN` 0.7,
   `RL_PB_MATCH_LEAD` 0.15, words matched as words. Containment is untouched.
5. **`landing` has three answers** — `edit`, `add`, `unplaced` — and the rail,
   the review modal and `rlFilePlaybookProposal` all ask the one reading.

**So the remaining exposure is narrower than it was.** A rule now lands on a
clause only when the quote is verbatim in it, or when the word overlap is high
AND clear of the runner-up. What clause kinds buy on top of that is the case
where a quote is verbatim in the WRONG clause — boilerplate repeated across a
document — and, more usefully, they make the whole reading explainable instead
of statistical.

---

## The design

### 1. A kind is a fact about a clause, worked out once

`clauseKind(clause)` returns one of `CLAUSE_KINDS` or `null`. Read when the
document is read, alongside the existing clause segmentation, and cached on the
clause the way `clauseId` already is.

`CLAUSE_KINDS` is the same vocabulary the playbook already uses, because that is
what makes step 2 free: `payment`, `liability`, `confidentiality`,
`data-protection`, `termination`, `governing-law`, `quality`, `stamp-duty`.

**`null` IS A REAL ANSWER AND IT IS THE SAFE ONE.** See "What must be true".

### 2. A rule's kind is its own name — there is nothing to configure

Every playbook position already carries a `category`: *Governing law*, *Data
protection*, *Payment terms*, *Liability cap*, *Confidentiality*,
*Termination*, *Quality & rejection*, *Stamp duty*. Those **are** clause kinds.

`ruleKind(position)` maps a category to a kind. No new field, no new setting,
no migration, and nothing for an admin to keep in step. This is what the owner's
"the label should not be visible" ruling bought: it removed a whole screen.

### 3. The kind narrows the match; it does not replace it

`rlPbFindClause` keeps every step it has. The kind is a **filter applied first**:

- Where the rule has a kind AND the document has clauses of that kind, only
  those clauses are considered.
- Where either side is unknown, the search is exactly what it is today.

That ordering is the whole safety argument: the kind can only ever *remove*
wrong candidates, never introduce a new way to be wrong.

---

## What must be true

These are the acceptance conditions, not aspirations.

1. **NOTHING IS PRINTED.** No chip on the paper, no fact row entry, no setting,
   no new screen. Owner-ruled 26 Aug 2026. A build that adds one has failed.
2. **UNSURE HOLDS NOTHING BACK.** Where a clause's kind is `null`, or a rule's
   kind is unknown, the match behaves exactly as it does today. **A bad guess
   must never make a finding quietly vanish** — that is the mirror of the
   reported bug and it is the one way this feature could do harm.
3. **IT ONLY EVER NARROWS.** The kind removes candidates before the existing
   search runs. It may not promote a clause the current matcher would reject.
4. **NO NEW STORE AND NO ROUTE.** The kind is derived, cached in memory with the
   clause, and never persisted — so there is nothing to migrate, nothing to
   invalidate, and no field that can go stale against re-read wording.
5. **THE THREE LANDINGS ARE UNCHANGED.** `edit` / `add` / `unplaced` keep their
   meanings and their three consumers.

---

## How the kind is read — and the honest problem with it

Two candidates, and this is the real decision inside the decision:

**(a) Deterministic, from the heading and cue words.** Free, instant, offline,
and checkable — the same shape as `playbookReviewHeuristic`. It will be right on
a headed contract ("2. LEASE CHARGES", "8. CONFIDENTIALITY") and blank on an
unheaded wall of paragraphs, which is what an uploaded scan often is. Blank is
safe (condition 2), so it degrades to today.

**(b) Ask Copilot once per document.** Better on unheaded paper. Costs money per
contract, needs a key, adds a failure mode, and — the part that matters — makes
the kind a second model judgement sitting *underneath* the model judgement it is
meant to police.

**Recommendation: (a), and only (a).** The point of this feature is to replace a
guess with arithmetic. Replacing it with a different guess buys much less than
it looks, and it cannot be checked. If (a) proves too blank on real uploads,
that is a measurement worth taking before spending on (b).

---

## Size

Smaller than it was before the owner's ruling, because the visible half was most
of it.

| Piece | Size |
|---|---|
| `CLAUSE_KINDS` + `clauseKind()` + its cue table | half a day |
| `ruleKind()` from the existing categories | an hour |
| The filter inside `rlPbFindClause` | an hour |
| Tests, both node and browser | half a day |

**Call it a day and a half**, against "days, not an evening" before the ruling.

---

## What is deliberately NOT in this

- **No clause-kind UI of any sort.** Ruled.
- **No per-workspace kind vocabulary.** The playbook's categories are the list.
- **No re-typing of existing contracts.** The kind is derived on read, so every
  contract gets it the next time it is opened, and nothing is backfilled.
- **No use of the kind anywhere but the playbook match.** It is tempting to
  reach for it in search, in the register, in the clause library. Not in this
  work order — each of those is its own decision with its own visible surface,
  and this one has been ruled invisible.

---

## Tests

- **f131** — the kind narrows and never promotes; an unknown kind behaves as
  today; the three landings unchanged.
- **A new section, or f131 extended** — `clauseKind` on a headed contract, on an
  unheaded one, and on the lease that produced the report.
- **The measurement that matters, and it is not a unit test:** run the kind
  reader over `sample-contracts/` and print what it types and what it leaves
  blank. If it is blank on most real paper, (a) is not enough and that is worth
  knowing before the filter is trusted.

---

## The question for the owner

**Build it, or leave it?**

The honest case for leaving it: the slice already shipped took the reported risk
off the table, and what remains is the narrower case of boilerplate repeated
across a document. The honest case for building it: the reading stops being
statistical and starts being explainable, and every later feature that wants to
know what a clause is for gets it free.

Either answer is defensible. Nothing else is blocked on it.
