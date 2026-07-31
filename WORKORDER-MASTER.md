# MASTER WORK ORDER — Sharing, History, Numbering & the Counterparty/Signing rework, as one programme

**Project:** HaTi (Mkataba CLM)
**Date:** 2026-07-31 (revised same day to absorb the counterparty/signing order)
**Status:** Approved plan — no code written
**Combines four source work orders, all travelling on this branch:**

0. `WORKORDER-execution-lock.md` — **an executed contract must take no new
   edits** (items **E1 … E5**). Raised 31 Jul 2026 from MK-248; high severity,
   ships before everything else.
1. `WORKORDER-view-share-and-history.md` — view-only share link + negotiation
   history (work packages **WP-1.1 … WP-3.3**)
2. `WORKORDER-clause-numbering.md` — linked references, renumbering, live
   numbering, sub-clauses (phases **N1 … N4**)
3. `WORKORDER-counterparty-parity-and-signing.md` — counterparty screen
   parity and the signing route end to end (work items **W1 … W9**,
   decisions **D1–D5**)

**Pending — logged, not yet sequenced into the stages below:**

4. `WORKORDER-pdf-upload.md` — Phase 2 addendum: PDF and scanned-document
   upload, producing the same field-detection output the Word route produces
   (vision-based extraction, scan warning, forced confidence downgrade on
   number-heavy fields). Its own brief states it **depends on the Template
   Library brief (Phases A–D) being merged and working**, and that it must not
   start if Phase D's Word-upload route is broken or absent. That brief is not
   in this repository, so this work order stays parked here until its
   dependency is present and verified. It is otherwise self-contained (own
   branch `feature/pdf-upload`, own fixtures, own stop conditions) and does not
   interact with Stages 0–9.

---

## What this document is

The three source work orders were written in separate sessions and are each
complete on their own. This document merges them into **one build programme**:
a single ordered sequence of stages, with the places where the features touch
each other made explicit and given their own integration tasks (**X1–X6**).

**The source documents remain the detailed spec.** Every task keeps its
original ID (WP-1.1, N2-T3, W7, and so on) so nothing needs rewriting. This
document is the conductor's score: it says what plays when, and why.

---

## Why these three must be planned together

Read separately, the work orders look independent. They collide in six
specific places; each collision gets a named task so it cannot be forgotten.

### X1 — History must name clauses by the number they had *at the time*
The history timeline (WP-2.1) tells a story: "Jane proposed changing Clause
8.2." The numbering work (N2, N3) makes clause numbers *movable*. If Clause
8.2 later becomes 8.1, a timeline that looks up today's number would silently
rewrite the story. **Rule:** every history entry displays the clause label as
it was when the event happened (already captured in the change record), with
the durable clause id underneath for filtering. Folded into WP-2.1's spec from
its first render. *Size: Small (one rule, one test: renumber a fixture after
events exist, assert the timeline text is unchanged).*

### X2 — One freeze doctrine, three consumers
Three features produce a "frozen copy" that must stand alone forever: the
view-link snapshot (WP-1.3), the exportable history report (WP-2.4), and the
sealed execution copy (N3-T5). The numbering order states the rule for the
seal: once numbers are *painted* at render time, any frozen copy must have the
printed numbers **baked in as literal text**. **Rule:** the bake-in is built
once, as one helper, and all three freeze paths use it. Today (before N3)
stored numbers are literal text, so the rule is trivially satisfied; the task
activates in the N3 stage. *Size: Small–Medium, inside N3's second session.*

### X3 — Renumbering is a history event
N2-T4 requires one audit entry summarising a renumbering act. The timeline
(WP-2.1) must render it as a first-class story beat: "David renumbered clauses
after the deletion of Clause 9 — 4 headings and 2 cross-references updated."
**Rule:** the audit entry's shape is agreed when N2 is built so WP-2.1 renders
it without guessing. *Size: Small.*

### X4 — The viewer allow-list is re-audited whenever anything adds fields
The viewer payload (WP-1.2) is built by allow-list: start from nothing, add
only what an outside advisor may see. The numbering phases add data
(reference maps, renumbering plans, the live-numbering flag); the signing work
adds data (signer bindings on shares, per-signer links). **Rule:** every stage
that adds contract or share fields ends by re-running WP-1.2's exclusion test
against the real route, extended to the new fields. The same discipline
applies to `buildSharePayload()` (`js/core.js:1632`), the negotiate link's
existing allow-list. *Size: Small, recurring.*

### X5 — Three link purposes, one router, three clean screens
This is the biggest overlap between orders 1 and 3, and the reason they must
not be built apart. Order 3's **W6** splits the portal's render by link
purpose (`negotiate` → the workbench, `sign` → the signing screen). Order 1's
**WP-1.4** adds a third purpose (`view` → the read-only viewer). These are
**the same job**: one purpose switch in `js/views/portal.js`
(`portalNegoPhase()` already reads the purpose) with three branches, each
screen exposing exactly its own verbs and nothing of the others'.
**Rules:**
- W6 and WP-1.4 are built **in the same stage**, as one routing change with
  three destinations — not two separate rewrites of the same file months
  apart.
- The viewer screen (WP-1.4) is built on the **new full-window shell from
  W1**, never on the old card-in-a-page portal layout that W1/W2 demolish —
  otherwise the viewer is born with the same 419px-pane defects the parity
  order measured, and gets rebuilt twice.
- The acceptance line covers all three: a negotiate link cannot sign or grant
  view-tickets beyond WP-1.6's rules; a sign link cannot redline; a view link
  can do nothing at all (WP-1.1's server lock underneath).
*Size: absorbed into W6 + WP-1.4; the rule costs nothing, ignoring it costs a
rebuild.*

### X0 — Nothing is built on a record that can still move
The execution-lock order (E1–E5) is not merely first by severity; three later
stages *assume* it. The numbering phases require a `negoNumberingLocked(c)`
gate that, on `main`, **does not exist** — the predicate lives only on the
unmerged branch `origin/claude/clm-clause-renumbering-4imkqd`, and no
`test/f98-*` file exists on `main` (see the execution-lock order §2.6). **E1**
builds that predicate on `main`, which is why it is a prerequisite of N2/N3
rather than a parallel concern. The history stages (WP-2.1, WP-2.4) present
the record as evidence, and the view-link snapshot (WP-1.3) freezes it — both
are worth less than nothing if the record underneath them can still be
rewritten after execution. **Rule:** Stage 0 completes before any other stage
starts, and when the numbering branch merges, its `negoExecuted` /
`negoNumberingLocked` must be the *same* definition E1 built, not a second one
that happens to agree. *Size: the rule is free; E1–E5 are their own order.*

### X6 — Signatures must land on the right row *before* history presents them
Order 3 documents a **live data-integrity bug** (W7, fault 3): an incoming
counterparty signature is stamped on whichever signer row is *next*, not the
row the link was issued for — so if two of their signers respond out of
order, the official running order records the wrong person in the wrong slot.
Order 1's history timeline (WP-2.1) and export (WP-2.4) present the record as
evidence, and "history is evidence" is a merged ground rule. **Rule:** the
signer-binding fix (W7 items 1 and 4 — bind each share to one signer row,
record against the bound row, refuse out-of-order) ships **before** the
history timeline ships, so the story HaTi confidently narrates is true.
Signing events (link issued, signer emailed, signature recorded, seal fired)
then appear in the timeline as story beats alongside changes and decisions.
*Size: the fix is W7's; the ordering rule and the timeline's signing renderer
are Small.*

---

## Merged ground rules

The source documents state overlapping doctrines. Merged, the programme runs
on seven rules; the source docs carry the detail.

1. **The server refuses; the UI merely hides.** Every restriction is enforced
   in `server/server.js` before any screen work: the execution lock (E2/E4 —
   currently enforced in *neither* place, which is what MK-248 exposed), view
   tickets (WP-1.1), reserved signing steps (W9), one-time codes bound to the
   invited address (W8).
2. **Safety nets before moving parts.** The server lock (WP-1.1) before the
   rest of the view link; linked references (N1) before anything moves a
   number (N2, N3); signer binding (W7) before address-bound codes (W8) and
   before history presents the signing record (X6). Hard rules, not
   preferences.
3. **Frozen things are self-contained** (X2). Snapshots, exports, and sealed
   copies carry their numbers and content as literal text, forever.
4. **Evidence is never rewritten — and never mis-filed.** An executed contract
   takes no new edits, from any seat, however it came to be executed (E1–E4);
   history assembles existing records; renumbering never touches hashes;
   nothing prunes or reorders the audit trail; a signature lands on the row it
   belongs to or is refused (never silently re-attributed). Where evidence has
   *already* diverged, it is reported to a human, never silently repaired
   (E5).
5. **The wall holds.** Internal threads, notes, unsent drafts, playbook and
   risk signals never reach the counterparty — and nothing on their screen
   may reveal that held-back items exist. The viewer allow-list (WP-1.2), the
   negotiate payload, the no-AI rules (W4), and the owner-only risk verbs
   (W5/D2) are all faces of this one rule.
6. **Additive only.** Migrations via the `addColumnIfMissing()` pattern; no
   retro-conversion; origin decided at intake and never changed; no bundler,
   no framework — match the house style, including its load-bearing comments.
7. **Every package ships with its proving test** (`node --test
   test/*.test.js`, jsdom via `test/portalworld.js` where relevant, plus a
   Chromium check where the change is visual — jsdom has no layout engine,
   which is exactly how a 419px pane survived ~100 green tests). The source
   document's "Done when" / acceptance is the gate.

---

## The programme: ten stages

Stages are ordered; a stage may span more than one session. **Every stage
ships real value on its own** — the programme can pause after any stage and
the product is still ahead. Task detail lives in the source documents.

### Stage 0 — The execution lock ⚠ ships first, before anything else
**E1** name the `negoExecuted` predicate once → **E2** refuse authored changes
at `negoFileChange` (the fix that closes the report) → **E3** the workbench
renders no edit control on an executed contract → **E4** the server refuses a
sealed-content write → **E5** detect-and-report already-damaged contracts,
plus the proving tests.

One session, two at most. **Done when:** the execution-lock order's Definition
of Done — no authored change of any type can be filed against an executed
contract from any seat, the server refuses with the browser bypassed, draft
contracts are demonstrably unaffected, and MK-248 reopened offers no edit
control anywhere on the page.

*Why it is Stage 0 and not a track inside Stage 1:* see **X0**. Every later
stage either presents this record as evidence, freezes a copy of it, or gates
on the predicate E1 builds.

### Stage 1 — Foundations (four independent tracks, parallel-safe)
| Track | Tasks | Size | Why now |
|---|---|---|---|
| A | **WP-1.1** server-enforced `view` ticket | M | The lock on the door; blocks all later view-link work |
| B | **WP-2.2** verified identity on decisions + **WP-2.3** reason nudge | S–M | Capture improvements — good records start accruing from today |
| C | **N1** linked cross-references (T1–T5) | M | The safety net; closes OI-1; hard prerequisite for N2/N3 |
| D | **W9** server-side signer-identity enforcement | S | Independent, small, pure rule-1 hardening; the source order says "ship it whenever" — whenever is now |

**Done when:** each track's own Definition of Done is met.

### Stage 2 — The counterparty screen becomes the real workbench (order 3, Unit A)
**W1** full-window shell → **W2** delete the duplicate document surfaces →
**W4** no-AI carried through → **W5** bulk verbs fixed for their seat →
**W3** identity field *(blocked on decision D5 — build around it and stop
there if unanswered)*. Includes the **Chromium visual parity harness**
(order 3 §6.3), committed as part of this stage.
Roughly two sessions. **Done when:** order 3's Unit A acceptance — pane
within 5% of the owner's, page doesn't scroll, one document surface, no
signing/AI/round/risk controls in their DOM, held-but-unsent work survives.

*Why before the view link's screen:* the viewer page (WP-1.4) must be born on
this new shell, not the demolished one (X5).

### Stage 3 — Three purposes, three screens; the view link complete
**X5** purpose routing: **W6** (negotiate cannot sign, sign cannot redline;
signing screen with D4's read-only settled history; retirement notice
verified) together with **WP-1.4** (the viewer screen on the new shell) —
plus **WP-1.2** viewer payload allow-list → **WP-1.3** snapshot semantics →
**WP-1.5** expiry / revoke / OTP / open-tracking.
Roughly two sessions. **Done when:** the three-purpose acceptance in X5 holds
under route tests and a Playwright/Chromium check; an outside advisor can
open a view link, see the frozen redlined contract, print it cleanly, and do
nothing else; the owner sees status and can revoke.

### Stage 4 — The signing route end to end (order 3, Unit B core)
**W7** signer binding, per-signer links generated from the route, sequenced
release, recording against the bound row, external turn email → **W8**
one-time code sent only to the invited address (**ships with W7, never
before it** — it removes the informal forward-the-link handover, and W7's
recorded route is its replacement; flag in release notes).
Roughly two sessions. **Done when:** order 3's W7/W8 acceptance — a
CEO → CFO → their MD → their FD route runs unattended, each signature on its
own row, out-of-order refused, seal fires on the last, forwarded links
unusable by third parties.

*Why before history:* X6 — the timeline must not narrate a signing record the
system was still mis-filing.

### Stage 5 — The renumber button
**N2** (T1–T5): preview-and-confirm renumbering for any draft,
format-preserving, absent on executed contracts, references repointed in the
same plan. Closes OI-2. Includes **X3** (audit entry shaped for the
timeline). One session. **Done when:** N2's Definition of Done.

### Stage 6 — The negotiation history, complete
**WP-2.1** timeline screen (with **X1** and the **X6** signing-events
renderer baked into its spec) → **WP-2.5** verify-integrity button →
**WP-2.4** exportable report (freeze doctrine — literal text, no live
lookups). Roughly two sessions; the timeline is the Large centerpiece.
**Done when:** the fixture contract's multi-round story — changes, decisions,
renumberings, signatures — renders and filters correctly; integrity verifies
green (a tampered fixture reports the break); the export stands alone for a
reader with no login.

### Stage 7 — Live numbering (the Ironclad-parity piece)
**N3** in two sessions, as its work order demands:
- Session one: T1 (the flag) → T2 (one numbering function) → T3 (editing
  keeps working) → T4 (live references).
- Session two: **T5 THE FREEZE** plus **X2** — the bake-in helper written
  here and wired into all three freeze paths (seal, view snapshot, history
  export) — then T6 (template save-time checks) and T7 (round boundaries).
- Ends with an **X4** allow-list re-audit.
**Done when:** N3's Definition of Done, plus: a view link and a history
export made from a live-numbered contract carry literal numbers and are
byte-stable against later renumbering.

### Stage 8 — Extensions
| Task | Size | Notes |
|---|---|---|
| **WP-1.6** counterparty-minted view links | M | Derived tickets — strictly weaker, inherit expiry, die with the parent, owner-visible and revocable. The mint button lives in the counterparty chrome W1 built; another reason Stage 2 precedes it |
| **N4** sub-clause model (T1–T3) | L | The honest hard part; extends N1–N3 to every depth; deliberately last |

Independent of each other; either can ship first or be deferred.

### Stage 9 — Hardening and release (one combined pass)
**WP-3.1** adversarial pass, extended across all three orders: every mutating
route replayed with view / expired / revoked / retired / forged tickets;
renumbering attempted on executed contracts; out-of-order and
wrong-member signatures replayed against the server; codes requested for
typed addresses; the **X4** exclusion tests re-run against the real routes
one final time. **WP-3.2** docs: `CHECKLIST.md` entries for every acceptance
above; `SECURITY.md`, `DESIGN-contract-sharing.md`,
`DESIGN-multi-signature.md` (its Phase-2 hardening is now built, W9),
`OPEN-ISSUES.md` closures; release notes flagging W8's behaviour change.
**WP-3.3** staged rollout via the existing Render pipeline — additive
migrations, safe rollback.

---

## Sequence at a glance

| # | Stage | Contents | Sessions (est.) | Hard dependencies |
|---|---|---|---|---|
| **0** | **Execution lock ⚠** | **E1 → E2 → E3 · E4 · E5** | **1–2** | **— (blocks all)** |
| 1 | Foundations | WP-1.1 · WP-2.2 + 2.3 · N1 · W9 | 2–3 | Stage 0 |
| 2 | Counterparty workbench | W1 → W2, W4, W5 (+ W3 if D5 answered) + Chromium parity harness | 2 | — |
| 3 | Three screens + view link | X5: W6 + WP-1.4 · WP-1.2 → 1.3 → 1.5 | 2 | WP-1.1, Stage 2 |
| 4 | Signing route | W7 → W8 (together, W7 first) | 2 | W9 helpful; Stage 3's W6 |
| 5 | Renumber button | N2 (+ X3) | 1 | N1 |
| 6 | History | WP-2.1 (+ X1, X6) → 2.5 → 2.4 | 2 | WP-2.2/2.3, W7 (X6), N2 audit shape (X3) |
| 7 | Live numbering | N3 (+ X2, X4) | 2 | N1, N2; WP-1.3 & WP-2.4 existing (X2 wiring) |
| 8 | Extensions | WP-1.6 · N4 | 2–3 | Stages 1–5 as per source docs |
| 9 | Hardening & release | WP-3.1–3.3 (+ X4 final) | 1 | everything |

**Total: roughly 17–21 sessions.** One phase per session at most; N3's freeze
session shares a session with nothing that would rush it.

Some stages can swap or interleave (2↔1 tracks, 4↔5) — the unbreakable
orderings are: **Stage 0 before everything** (X0); WP-1.1 before the rest of
the view link; Stage 2 before
WP-1.4; W6 and WP-1.4 together (X5); N1 → N2 → N3, N4 last among numbering;
W7 before W8; W7 before WP-2.1 ships (X6); X1 present from WP-2.1's first
render; X2 complete before any live-numbered contract is sealed, snapshotted,
or exported; hardening last.

---

## Decision register (merged; flag any to overturn)

From the sharing/history order:
1. View links show a **snapshot**, not the live contract.
2. The advisor has **no feedback channel inside HaTi** in v1.
3. Decision reasons are **encouraged, never mandatory**.
4. Export format is **print-optimized HTML → PDF** first; DOCX later.
5. Counterparty-minted links ship **after** the core view link.

From the numbering order:
6. Uploaded contracts **never renumber themselves**; executed contracts never
   renumber by any path.
7. Live numbering applies only to contracts **born in HaTi after N3 lands**.
8. Format preservation is a hard requirement (`8.2(a)` → `8.1(a)`).
9. Warnings advise; nothing auto-edits legal wording, ever.

From the counterparty/signing order (locked — D1–D4):
10. **The signing email is owner-initiated** — "Ready to sign" is a signal,
    not a trigger.
11. **`Accept All Non-Risk` is owner-only**; the counterparty gets a plain
    `Accept all` (their screen never reveals our risk scoring).
12. **Decline stays on the counterparty's negotiation screen**, reason
    required.
13. **The signing screen keeps a read-only view of what was settled.**

From the execution-lock order:
19. **The lock guards the funnel, not the callers** — one refusal in
    `negoFileChange` covers modify/insert/delete, so a fourth caller added
    later cannot miss it.
20. **Both the lock and the sign** ship together (E2 *and* E3): a server that
    refuses without a screen that stops offering is a button that errors at a
    user who should never have seen it.
21. **Executed ≠ frozen record.** Signatures, engagement stamps and audit
    appends still land on an executed contract; only its *sealed content* is
    immutable (E4).
22. **Damaged records are reported, never auto-repaired** (E5).

New in this master order:
14. History displays **labels as of the event** (X1), never today's numbers.
15. Frozen copies share **one bake-in helper** (X2).
16. Allow-lists are **re-audited after every stage that adds fields** (X4).
17. **One purpose router, three screens** — W6 and WP-1.4 built together, the
    viewer on W1's shell (X5).
18. **Signer binding ships before history presents the signing record** (X6).

### ✅ ANSWERED — D5, by the owner, 31 Jul 2026

**Question:** is the counterparty's name identity or attribution?

**Answer given:** *"The owner sets emails of who will be signing the contract,
sends a link to counterparty 1, and after they sign an automated new link goes
to the next party in the list of signers, and so on."*

**What that settles.** Signing is **strict identity**, exactly as W7/W8
specify: the owner names the signers and their email addresses up front; each
signer gets their own link; a link belongs to one row of the signing route;
the next link is released automatically when the previous signer signs; and
the one-time code goes only to the address the owner invited (W8). This is not
a new design — it is the confirmation that W7's sequenced release and W8's
address binding are what the owner wants, and they are now specified behaviour
rather than a proposal.

**What it leaves as recommended.** The answer is about signing. **Negotiation**
stays relaxed per the source order's recommendation — pre-fill the name from
the share's named recipient, let them correct it, let anyone on their side pick
up the work. A redline attributed to the wrong lawyer is annoying; a signature
attributed to the wrong director is not, and W7/W8 make the strict half true
regardless of how the relaxed half behaves.

**W3 is therefore unblocked** and builds the relaxed half in Stage 2.

## Out of scope (union of all three source documents)

Live-updating view links; advisor commenting mode; multi-tenancy changes;
renumbering anything executed by any path; retro-converting existing
contracts or uploads; auto-fixing references without preview and
confirmation; OCR/import-time "upgrade this upload"; the shared redline panes
(`redlinePanesHtml()` — correct, untouched); the negotiation engine, change
model, hash chain, and wall internals; the owner's workbench chrome;
PDF-attachment distribution; any change to how the seal is computed or
verified (baking *inputs* at freeze time per X2 is rendering, not seal math).

## Programme-wide risks (beyond each order's own list)

| Risk | Handling |
|---|---|
| Three orders touching `js/views/portal.js` in sequence | Stage order (2 → 3) exists precisely so the file is demolished once and rebuilt once; X5 forbids parallel rewrites |
| W8 removes forward-the-link handover customers may use today | W7 ships first as the replacement; release notes flag it (order 3 §8) |
| History ships before signing attribution is fixed | Forbidden by X6 |
| A stage adds fields the viewer payload silently inherits | Impossible by construction (allow-list) but verified anyway — X4 re-audit per stage |
| Session drift across a long programme | One phase per session max; `SESSION-NOTES.md` entry per session; the next session reads this document, the relevant source order, and the previous notes before writing code |
| A source order assumes shipped ground that is not on `main` | Found once already: `negoNumberingLocked` / f98 exist only on an unmerged branch (X0). Before starting any stage, verify its stated prerequisites exist in the code rather than in a document — the numbering order is otherwise accurate, so check, don't assume it is wrong either |
| The execution lock over-fires and freezes drafts | E5's test suite asserts draft contracts are wholly unaffected; this is the regression that would hurt most, so it is tested first, not last |

## Session conventions

As in `hati-product-backlog (1).md` and all three source orders: one commit
per task, a `SESSION-NOTES.md` entry per session, tests green before commit
(`npm run test:all` where the browser harness applies), comments that argued
for a removed shape rewritten rather than left contradicting the code, and do
not start a stage before the previous stage's Definition of Done is met
(within Stage 1, the four tracks gate independently).
