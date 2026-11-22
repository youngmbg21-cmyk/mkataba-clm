# WORK ORDER — Clause numbering to best practice

**Goal:** bring HaTi's clause numbering to parity with Ironclad / Oneflow where
parity is safe, and deliberately not where it isn't. The end state:

- A contract **born in HaTi** (wizard or template) renumbers itself live while
  it is a draft — delete 2.2 and 2.3 is printed as 2.2, instantly, with every
  cross-reference following along.
- An **uploaded** contract never renumbers itself. It gets an explicit,
  previewed `Renumber clauses` action instead.
- An **executed** contract never renumbers, full stop — the lock
  (`negoNumberingLocked`, f98) already exists and every phase below must pass
  through it.

**How to use:** phases in order, N1 → N4. Do not start a phase before the
previous phase's Definition of Done is met. **N1 before N3 is a hard rule, not
a preference** — see "The one ordering rule" below. Same session conventions as
`hati-product-backlog (1).md`: one commit per task, a `SESSION-NOTES.md` entry
per session, tests before commit.

**Status of the ground this builds on (already shipped):**

- Durable clause ids, never derived from position (`js/clausemodel.js`, f40).
- `num`/`title` are presentation, excluded from every hash (f35, f40) — a
  renumbering can never invalidate history or a seal.
- The numbering-gap notice and the execution lock (f98):
  `negoNumberingGaps`, `negoExecuted`, `negoNumberingLocked`,
  `negoNumberingNoticeHtml`.
- Origin is already recorded: `negoIntakePath(c)` returns
  `standard-template` / `custom-template` / `upload` / `unknown`. No new
  bookkeeping is needed to tell the document classes apart.
- `clauseReplaceHeading` — the renumbering primitive. Still has no callers;
  N2 is where it gets its first.

---

## The one ordering rule

**Linked cross-references (N1) ship before anything that moves a number
(N2, N3).** Today a reference like "subject to Clause 9" is plain text. While
numbers never move, a stale reference points at *nothing* — ugly but
detectable. The moment numbers can move, a stale reference points at the
*wrong clause* — invisible, plausible, and lying. Shipping renumbering before
linked references converts today's honest gaps into silent misstatements of
what a contract means. Build the safety net, then let the numbers move.

---

## Doctrine (applies to every phase)

| Document class | Detected by | Draft behaviour | After execution |
|---|---|---|---|
| Born in HaTi | `negoIntakePath(c)` ∈ {standard-template, custom-template} | live auto-numbering (N3) | frozen |
| Uploaded | `negoIntakePath(c) === 'upload'` | literal numbers + gap notice (shipped) + explicit renumber (N2) | frozen |
| Unknown | anything else | treat as uploaded — the cautious reading | frozen |

Origin is decided at intake and **never changes**. An upload negotiated
through six rounds is still an upload: its numbers were the counterparty's
first, and their copies and correspondence cite them.

### Guardrails

1. **Never weaken the seal.** `negoHashInput` excludes num and title today and
   must keep excluding them. But note the inversion in N3: once numbers are
   *painted* rather than stored, the **sealed frozen copy must have the printed
   numbers baked into it as literal text** at freeze time — a sealed document
   must be self-contained and verify forever without the numbering function
   that produced it. This is the single most dangerous edge in the whole work
   order; it gets its own task (N3-T5) and its own tests.
2. **Every gate goes through `negoNumberingLocked(c)`** — never through
   `c.status === 'Signed'` alone. The predicate exists precisely so the seal
   and the execution stamp are never dropped from the test (see the warning
   comment in `negoResolve`).
3. **Uploads: never rewrite stored wording implicitly.** The only thing that
   may change an uploaded document's numbers is the explicit N2 action, with a
   preview, recorded in the audit trail.
4. **Format preservation is a hard requirement, not a nicety.** `8.2(a)`
   renumbered must produce `8.1(a)` — never `8.1. (a)` or `8.1 (a)`. The
   product has already been burned by rebuilt headings inventing punctuation
   (see the literal-heading rule at the redline heading renderer, and B-004's
   whole failure class). Rewrite the numeric token in place; touch nothing
   around it.
5. **Warnings advise, never auto-edit.** A broken or ambiguous reference is
   flagged for a human. Rewriting legal wording to repair a reference changes
   what the contract means and is never done silently.
6. **No retro-conversion.** Existing contracts keep the numbering model they
   were created under. New behaviour applies to contracts created after the
   feature lands (N3-T1's flag). Migrations are additive, per the global
   backlog guardrails.
7. **Attribution over scanning.** The shipped gap notice only reports gaps an
   accepted deletion accounts for, because the primary fixture is numbered
   1, 4, 5, 6, 9, 12 and a scan reports six imaginary faults on it. N1
   inherits the same doctrine: a reference to a clause that was *never in the
   document* (an extract citing clause 2 of the parent agreement) is not an
   error to shout about; a reference whose target *was deleted here* is.

---

## N1 — Linked cross-references (closes OI-1)

**Why first:** the safety net everything else stands on, and it ships value on
its own — it is the "warn when a deletion breaks a reference" feature already
logged as OI-1 in `OPEN-ISSUES.md`.

- **N1-T1. Reference detection.** A pure function (suggested home:
  `js/clausemodel.js` or a new `js/clauserefs.js`) that scans clause text for
  references, using the same number grammar `clauseParseHeading` already
  knows: `Clause 9`, `clause 9.2`, `Section 4`, `Article 7`, `Art. 3`,
  `Sec. 2.1`, `§9`, plus sub-paragraph forms `8.2(a)`. Returns, per clause:
  the literal matched text, the number it names, and the character span.
  Ranges ("Clauses 4 to 6", "Clauses 4–6") detected as two endpoints.
  Case-insensitive. No DOM mutation, no storage — a read.
- **N1-T2. Resolution.** Resolve each detected reference against the `num`
  values of the document's own clauses → `resolved` (target clauseId),
  `dangling` (no clause carries that number), `self` (a clause citing
  itself — legal, common, never flagged). Sibling/depth rules as in
  `clauseNumberGap`: `12` never resolves against `1.2`.
- **N1-T3. Broken-reference report, attributed.**
  `negoBrokenRefs(c)`: dangling references whose target number matches an
  **accepted `deleteClause`** (same read as `negoNumberingGaps` — via
  `negoAllChanges`, because round-close archives the change that made the
  gap). Reported on the clause that *contains* the reference, naming both
  ends: "Clause 15 refers to Clause 9, which was deleted."
- **N1-T4. Surface it.** A warning chip on the referring clause in the room's
  working pane and on the redline workbench, plus a line appended to the
  existing gap notice when both fire ("…and 1 clause still refers to it").
  Advisory only — the human either revises the referring clause (an ordinary
  tracked change the other side sees) or leaves it. No auto-rewrite, no
  button that edits wording.
- **N1-T5. On-demand whole-document check.** A "Check references" action
  (Doc page / room toolbar) that lists every reference and its resolution
  state, including dangling ones that are *not* attributed to a deletion —
  presented neutrally ("refers to a clause not in this document"), because on
  an extract that is normal, not a fault.

**Tests (new f-file):** detection grammar incl. `8.2(a)` and ranges; the
extract fixture (1, 4, 5, 6, 9, 12) raises zero attributed warnings; delete 9
→ accepted → round closed → a clause citing 9 is flagged and the flag names
both clauses; a rejected deletion flags nothing; a self-reference never
flags; the report appears on the *referring* clause, not the deleted one; no
function in N1 mutates document HTML (assert byte-identical in/out).

**Definition of Done:** deleting Clause 9 from the prototype contract, where
another clause cites it, produces a visible, attributed warning on the citing
clause in both canvases — and the same document *without* the deletion
produces nothing anywhere. All existing tests still pass.

---

## N2 — Explicit `Renumber clauses` (closes the rest of OI-2)

**Scope:** any *draft*, any origin. This is the manual tool; it is also the
engine N3 reuses. Gated by `negoNumberingLocked` — on an executed contract the
action is absent (not disabled with a tooltip: absent).

- **N2-T1. The renumbering computation.** Pure function: given the clause
  list, propose new numbers closing the gaps — `1, 4, 5, 6, 12` → `1, 2, 3,
  4, 5`. Hierarchy-aware within a family: deleting `1.1(b)` proposes `(c)` →
  `(b)` and proposes nothing for Clause 2. Format-preserving per guardrail 4:
  the numeric token is replaced inside the heading string; every separator,
  space and parenthesis the heading carried stays. Returns a plan:
  `[{clauseId, oldNum, newNum, oldHeading, newHeading}]` — no writes.
- **N2-T2. Reference repointing in the same plan.** Run N1 detection over the
  document; every reference that resolves to a renumbered clause gets a
  planned text edit (`"Clause 9"` → `"Clause 5"`), listed alongside the
  heading changes. A dangling reference is listed as *unresolvable — will not
  be touched*. This is the reason N1 is a dependency and not a nicety.
- **N2-T3. Preview and confirm.** A dialog showing every heading old → new
  and every reference old → new, with nothing applied until confirmed.
  Nothing outside the plan is ever touched.
- **N2-T4. Apply as the record.** Headings via `clauseReplaceHeading` (its
  first caller), reference edits via the clause-body edit path. Decide and
  document the change-model treatment: within the owner's own unsent
  drafting, apply directly with an audit entry; once a round has been sent,
  file as tracked changes so the counterparty sees the renumbering as a
  proposal like any other (the merge-refusal comment at
  `js/views/negotiation.js` already establishes that renumbering an
  instrument cited by its numbers is a deliberate act the other side
  ratifies). One audit entry summarising the whole act either way.
- **N2-T5. The gap notice offers the door — on drafts only.** With N2 built,
  the shipped notice may gain its one button: `Renumber clauses…`, opening
  the N2 preview. Locked contracts keep the buttonless notice — the f98 test
  asserting no button on an executed contract must keep passing (adjust the
  draft-side assertion deliberately, in the same commit, with a comment).

**Tests:** `8.2(a)` → `8.1(a)` exactly; extract renumbers 1..6 and its
cross-references follow; sub-family isolation (renumber inside clause 1 moves
nothing in clause 2); executed contract: computation refuses, UI absent;
preview-then-cancel leaves the document byte-identical; ids never move (reuse
the f40 assertion pattern); audit entry present.

**Definition of Done:** a user can close the gap on a draft in two clicks with
a full preview; an executed contract offers no path to it; 100% of moved
references are shown in the preview before anything is written.

---

## N3 — Live numbering for HaTi-born contracts

**Scope:** contracts created from the wizard / standard templates / custom
templates, **created after this phase lands**. Uploads never enter this path.
This is the Ironclad-parity phase: numbers become presentation computed at
render, so deletion "renumbers" without any rewriting step at all.

- **N3-T1. The flag.** New contracts from the template paths carry an
  explicit marker (e.g. `numbering: 'live'`) set at creation. Absence of the
  flag = literal numbering, so every existing contract and every upload is
  automatically excluded. No retro-conversion (guardrail 6).
- **N3-T2. One numbering function.** A single function computes the printed
  number for every clause from document order. Every surface calls it — the
  room, the workbench, the Doc page, print, PDF export, docx export, the
  counterparty portal, the Copilot's context strings. A number computed in
  two places will eventually disagree in two places; this task is not done
  while any renderer formats its own.
- **N3-T3. Editing keeps working.** Filing changes, redlines, version
  compare, and the change model all currently read headings that contain
  numbers. Audit every consumer of `headingText` / `num` for assumptions
  that the number is stored text. `clauseLabel` already rebuilds labels per
  render — extend rather than fork.
- **N3-T4. References go live too.** In live-numbered contracts, references
  inserted via HaTi (Copilot drafting, templates) are stored as links to
  clause ids and *printed* through the same numbering function. Typed-by-hand
  references are detected (N1) and offered a one-click "link this reference"
  upgrade. Delete a clause → its number vanishes from the run, every linked
  reference reprints correctly, and any reference to the deleted clause
  flags via N1.
- **N3-T5. THE FREEZE.** At execution, the frozen copy (`execution.html` and
  everything the seal binds) is rendered with all live numbers and linked
  references **baked in as literal text**, then sealed. A sealed document
  must verify forever, self-contained, with no dependence on the numbering
  code that produced it — and re-running the numbering function years later
  against a moved codebase must not be able to change what the seal covers.
  Test this against `verifySeal` explicitly, including the
  print/PDF/evidence-pack paths (f52's lesson: the page that most needs to
  prove what was signed is the one that historically didn't).
- **N3-T6. Template save-time checks.** When a custom template is saved
  (typed or uploaded as a template), numbering is validated once, at the
  mould: a gap ("this template skips clause 7 — deliberate?") is queried at
  save time; the template's number *style* (`Clause 4 ·` vs `4.` vs
  `8.2(a)`) is captured so the numbering function reproduces the house
  style, not HaTi's. Asking once, of the template's owner, instead of
  guessing later on a live deal.
- **N3-T7. Round boundaries.** Numbering may shift freely while the owner
  drafts; each **sent** round is the fixed snapshot the counterparty reviews
  (the round system already stores per-round bodies — verify the numbering
  is stable within a sent round's rendering and changes only across rounds).
  The comparison view must show a renumbered-but-unreworded clause as
  *followed*, not changed — f46 already asserts this for the literal model;
  extend it to the live model.

**Tests:** delete 2.2 in a live contract → 2.3 prints as 2.2 everywhere
(every surface in N3-T2's list asserted); linked references reprint; seal
round-trip — execute, verify, verify again after simulating a numbering-code
change; a pre-existing contract without the flag is untouched by all of it;
an upload can never acquire the flag; template gap prompt fires at save, not
at generation.

**Definition of Done:** on a fresh wizard contract, deleting a clause
renumbers the document and its references live on every surface with zero
manual steps; executing it produces a sealed copy whose numbers are literal
text and whose seal verifies; nothing about any existing contract, any
upload, or any archived round changes behaviour.

---

## N4 — Sub-clause model (the honest hard part; do last)

Today the clause model reads a sub-heading inside a clause as part of that
clause's **body** — deliberately ("a sub-heading is a label on a term, not a
second term"). So 2.2 is wording inside clause 2, not an addressable unit:
deleting it is a modify, the gap notice doesn't fire on it, and live
numbering (N3) covers top-level clauses only until this phase.

- **N4-T1.** Decide and document the model: probably numbered blocks *within*
  a clause body (addressable for numbering and references, but not separate
  negotiation units — one clause, one badge, one decision stays true).
- **N4-T2.** Extend N1 detection/resolution, the f98 gap attribution, and the
  N2 renumberer to sub-clause runs (the sibling rules in `clauseNumberGap`
  already speak this grammar).
- **N4-T3.** Extend N3 live numbering to sub-clause runs in born-in-HaTi
  contracts.

**Definition of Done:** deleting sub-clause 2.2 in a live contract renumbers
2.3 → 2.2 without touching clause 3; in an uploaded contract it leaves the
gap and (if cited) flags the reference — the same doctrine at every depth.

---

## Explicitly out of scope

- Renumbering anything executed, ever, by any path. Amendments to signed
  contracts follow drafting convention (`9. [Intentionally left blank]`) —
  authored by humans, in the amendment document, not by this system.
- Retro-converting existing contracts or uploads to live numbering.
- Auto-*fixing* any reference without a preview and a confirmation.
- OCR/import-time conversion of uploaded documents' typed numbers into live
  numbering ("upgrade this upload") — revisit only after N3 has soaked.

## Sizing and sequence

| Phase | Size | Depends on | Ships value alone? |
|---|---|---|---|
| N1 references | M | — | Yes — closes OI-1 |
| N2 explicit renumber | M | N1 | Yes — closes OI-2 |
| N3 live numbering | L | N1, N2 | Yes — the parity feature |
| N4 sub-clauses | L | N1–N3 | Extends all three |

One phase per session at most; N3 is likely two (T1–T4, then T5–T7 — the
freeze work is separate and must not share a session with anything that would
rush it).
