# EXECUTION PLAN — how the work orders get built

**Project:** HaTi (Mkataba CLM)
**Date:** 2026-07-31
**Status:** Plan only — no code written
**Reads with:** `WORKORDER-MASTER.md` (what plays when) and the five source
work orders (the detailed spec). This document is the third layer: **how each
session is actually run** — what it opens with, what it commits, what proves
it, and what makes it stop.

---

## 0. Plain English

The master work order sequences the *features*. This one sequences the
*sessions*: 21 working sessions, each with one job, an entry check before any
code is written, a concrete proof it worked, and a gate it must pass before
the next session starts.

The core discipline: **a session never assumes the ground it stands on
exists.** That rule is here because we already caught one case — the clause
numbering work order relies on an execution-lock helper it calls "already
shipped", and that helper is not in the main codebase. Every session now
verifies its own prerequisites in the code before writing anything.

---

## 1. How a session runs (the standard loop)

Every session below follows the same five beats. Where a session deviates, it
says so explicitly.

### Beat 1 — Open (no code)
1. Read `WORKORDER-MASTER.md`, this plan's entry for the session, the relevant
   source work order section, and the last two `SESSION-NOTES.md` entries.
2. **Verify prerequisites in the code, not in a document.** Grep for every
   function, column, route and test file the session's spec says already
   exists. Anything missing is recorded and either built as part of the session
   (if small and in scope) or raised as a blocker — never assumed.
3. Run `npm test` (and `npm run test:browser` where the session touches
   anything visual) to establish a green baseline. **A session does not start
   on a red suite** — if it is red at open, fixing or documenting that is the
   session.
4. Create the session branch off the current `main` (§2).

### Beat 2 — Build
One task at a time, in the order this plan lists. **One commit per task**, in
the house style: the commit message states what changed and *why*, in the same
register as the codebase's comments.

### Beat 3 — Prove
Each task ships its proving test in the same commit as the change:
- `node --test test/*.test.js` unit and route tests, named
  `fNN-what-it-proves.test.js` per house convention.
- `test/portalworld.js` extended (never forked) for anything on the
  counterparty's page.
- A Chromium check under `test/chromium/` for anything visual — **jsdom has no
  layout engine, which is exactly how a 419px pane survived ~100 green test
  files.** Visual claims need a real browser or they are not proven.

### Beat 4 — Close
- Full suite green: `npm run test:all`.
- Rewrite any comment that argued for behaviour this session reversed. A
  comment contradicting the code is worse than no comment.
- Append a `SESSION-NOTES.md` entry: what was built, what was found, what the
  next session needs to know, and anything the spec got wrong.
- Update `CHECKLIST.md` with the behaviour → proving-test entries.
- Push the branch.

### Beat 5 — Gate
The session's exit gate (listed per session below) must hold. If it does not,
the session ends with a `BUGLOG.md` entry explaining precisely what is not
true yet, and the next session's first job is that gap — not the next feature.

---

## 2. Branch and merge strategy

- One session, one branch, off the latest `main`:
  `claude/<short-task-name>-<suffix>`.
- Never commit to `main` directly. Merge to `main` only when the session's
  exit gate holds and the full suite is green.
- **Sessions in the same stage merge before the next stage starts.** Stage
  boundaries are the integration points; mid-stage branches may stack, but a
  stage never ends with unmerged work.
- **One pre-existing branch must be dealt with early:**
  `origin/claude/clm-clause-renumbering-4imkqd` carries `negoExecuted`,
  `negoNumberingLocked`, `negoNumberingGaps` and the f98 tests that the
  numbering work order treats as shipped ground. Session 1 reconciles it (§4).

---

## 3. Session schedule

21 sessions across the master's ten stages. Sizes are the source documents'.
"Spill" means the session is expected to be tight and may take a second pass —
better planned for than discovered.

---

### STAGE 0 — The execution lock ⚠ (Sessions 1–2)

#### Session 1 — Lock authoring and close the screen
**Tasks:** E1 (name `negoExecuted` once) → E2 (refuse authored changes at
`negoFileChange`) → E3 (workbench renders no edit control when executed).

**Entry check (unusually important here):** confirm the two definitions of
`negoExecuted` — the one this session writes on `main` and the one already on
`origin/claude/clm-clause-renumbering-4imkqd` — will be *the same function*,
not two that happen to agree. Decide now whether to cherry-pick that branch's
helper or write it and rebase the branch onto it; record the decision in
`SESSION-NOTES.md`.

**Proving:** filing a modify / insert / delete against a contract executed by
each of the three signals (`status === 'Signed'`, `c.hash`,
`c.execution.at`) is refused and writes nothing — `changes[]`, `body` and
`versions[]` byte-identical before and after. No edit control in the DOM from
owner, counterparty or portal seats. **Draft contracts wholly unaffected** —
this assertion is written first, because a lock that over-fires is the worse
failure.

**Exit gate:** MK-248 reopened offers no edit control anywhere on the page.

#### Session 2 — The server refuses, and find what is already damaged
**Tasks:** E4 (server-side refusal on `PUT /api/contracts/:id`) → E5
(divergence detection + full test suite).

**Care point:** E4 must be narrow. Executed contracts legitimately keep taking
signatures, engagement stamps and audit appends — only their *sealed content*
is immutable. Follow the money-field and audit-trail guards already in that
same function, which restore protected fields from the stored record rather
than trusting the payload.

**Proving:** a crafted `PUT` altering the body of an executed contract is
refused with the browser bypassed entirely; a signature landing on the signing
route, an engagement stamp and an audit append all still succeed on that same
contract.

**Exit gate:** the execution-lock order's full Definition of Done. Divergence
between live wording and sealed copy is *reported*, never silently repaired.

---

### STAGE 1 — Foundations (Sessions 3–5, order flexible)

#### Session 3 — The view ticket's server lock
**Task:** WP-1.1 (share purpose `view`, centralised guard, viewer payload
route). Size M.

**Proving:** a `view` token fetches the viewer payload; the same token sent to
*every* mutating share route returns 403; creating a view share writes an
audit entry. The guard is **one function** every mutating route calls — a
future route that forgets it is the failure mode being designed out.

**Exit gate:** route tests prove both halves; no mutating route accepts a view
token.

#### Session 4 — Linked cross-references
**Task:** N1 (T1 detection → T2 resolution → T3 attributed report → T4 surface
it → T5 whole-document check). Size M. Closes OI-1.

**Care point:** attribution over scanning. The primary fixture is numbered
1, 4, 5, 6, 9, 12 — a naive scan reports six imaginary faults on it. A
reference to a clause that was never in the document is *not* an error; a
reference whose target was deleted here is.

**Proving:** the extract fixture raises zero attributed warnings; delete
Clause 9, accept, close the round → a clause citing 9 is flagged, naming both
ends; a rejected deletion flags nothing; a self-reference never flags; no N1
function mutates document HTML (assert byte-identical in/out).

**Exit gate:** N1's Definition of Done.

#### Session 5 — Capture improvements and the signer-identity lock
**Tasks:** WP-2.2 (verified identity stamped on counterparty decisions) →
WP-2.3 (decision-reason nudge) → W9 (server refuses a reserved signing step
for the wrong member).

**Why together:** three small independent items, all pure rule-1 hardening or
record quality. WP-2.2 and WP-2.3 ship early deliberately, so good records
start accruing before the history screen exists to display them.

**Care point:** WP-2.2 must never claim verification that did not happen —
unverified decisions are labelled honestly, not left blank and not implied
verified.

**Exit gate:** decisions through a verified link carry the verified email;
unverified ones say so; the server refuses a wrong-member signature regardless
of what the browser sends.

---

### STAGE 2 — The counterparty screen (Sessions 6–7)

#### Session 6 — Measure first, then the full-window shell
**Tasks:** the Chromium visual-parity harness **first**, then W1 (counterparty
negotiation screen becomes the full-window workbench).

**Why the harness first:** the 419px pane survived ~100 green test files
because jsdom cannot see it. The harness that produced the measured evidence
(925px vs 419px, 940px vs 2431px page height) is the only thing that can prove
this session worked. It renders both surfaces from **one** contract record and
fails when the counterparty's pane or page height diverges beyond tolerance.

**Care point:** the layout is persisted per browser under `hati.v1.negoLayout`.
The counterparty's browser must not inherit or write an owner-shaped layout.

**Exit gate:** contract pane within 5% of the owner's at 1440×940;
`document.documentElement.scrollHeight <= window.innerHeight`; both sidebar
tabs fully visible; no `[data-redline-side]`, `[data-rl-back]`, `#nego-exit`
or round control in the counterparty DOM.

#### Session 7 — Delete the duplicates, fix the verbs
**Tasks:** W2 (remove the second and third document surfaces, the respond
aside, the footer) → W4 (carry `noAi` and the empty selection menu through the
move) → W5 (gate the risk-derived bulk verb to the owner; relabel the
counterparty's pair from their seat).

**Two things to confirm before deleting, per the source order's own warnings:**
1. `#portal-plain` is the whole-document rewrite escape hatch. Confirm Direct
   Edit covers that case before removing it; raise it rather than dropping the
   capability silently.
2. `pt-proposed` is the monetary counter-offer field. Confirm it has a home in
   the workbench before the aside goes.

**W3 (counterparty identity) is attempted only if decision D5 is answered.**
If it is still open, this session ships without it and W3 waits — no guessing.

**Exit gate:** exactly one rendering of the contract on the page; no AI, side
toggle, round control or risk-derived verb in their DOM; held-but-unsent work
survives the new mount and a repaint (this has been broken and fixed once
already).

---

### STAGE 3 — Three purposes, three screens (Sessions 8–9)

#### Session 8 — The allow-list and the purpose router
**Tasks:** WP-1.2 (viewer payload built by allow-list) → W6 (purpose routing:
negotiate cannot sign, sign cannot redline).

**Why together:** X5. W6 and WP-1.4 are the same job — one purpose switch with
three destinations. The payload (WP-1.2) lands first because the viewer screen
in Session 9 renders it.

**Proving:** a unit test serialises the viewer payload for a fixture carrying
comments, threads and internal notes, and asserts **none of those strings
appear anywhere** in the payload. Built by adding to an empty object, never by
deleting from the full contract.

**Exit gate:** a negotiation link exposes no signing control at any phase; a
signing link exposes no redline or send-decisions control; a retired link says
plainly that a newer one was sent.

#### Session 9 — The viewer screen, snapshot, and lifecycle (spill likely)
**Tasks:** WP-1.4 (viewer page, built on Session 6's shell — never the old
card-in-a-page layout) → WP-1.3 (snapshot semantics) → WP-1.5 (expiry, revoke,
OTP, open-tracking).

**Proving:** Playwright opens a view link, asserts redline marks are visible,
asserts no editable surface and no action button exists in the DOM, asserts
the banner text. Editing the contract after the link is created does not
change what the link shows.

**Exit gate:** an outside advisor can open the link, read the frozen redlined
contract, print it cleanly, and do nothing else; the owner sees status and can
revoke.

---

### STAGE 4 — The signing route (Sessions 10–11)

#### Session 10 — Bind a share to a signer
**Task:** W7 items 1–3 (bind a share to one row of `c.signerPlan`; generate
links from the route rather than one hand-typed recipient; release them in
sequence, each dormant until the previous signer signs).

**Build the binding first** — everything else in W7 follows from it. The share
side is a real table and needs a column, following the
`addColumnIfMissing('shares', 'purpose', 'TEXT')` precedent; the contract side
is one JSON blob and needs no migration.

**Exit gate:** internal signing completing generates one link per counterparty
signer; signer *n+1*'s link is dead until signer *n* has signed.

#### Session 11 — Record against the right row, then bind the code
**Tasks:** W7 items 4–5 (match an incoming signature to the share's bound
signer, refuse out-of-order rather than misfiling; write the external turn
email) → W8 (the one-time code goes only to the invited address, never a typed
one).

**This session fixes a live data-integrity bug** — today a signature is
stamped on whichever counterparty row is *next*, so if their FD signs before
their MD, it lands on the MD's row.

**W8 ships with W7 and never before it.** W8 removes the informal
forward-the-link handover that works today; W7's recorded route is its
replacement. Flag it in release notes.

**Exit gate:** a `CEO → CFO → their MD → their FD` route runs unattended once
the CFO signs; each signature lands on its own row; out-of-order is refused,
not misfiled; the seal fires on the last; a forwarded link cannot be used by a
third party. The unverified-signature audit path still records honestly when
the workspace cannot send mail at all.

---

### STAGE 5 — The renumber button (Session 12)

#### Session 12 — Explicit, previewed renumbering
**Task:** N2 (T1 computation → T2 reference repointing in the same plan → T3
preview and confirm → T4 apply as the record → T5 the gap notice gains its
button, drafts only). Includes X3: the audit entry is shaped now so the
history timeline can render it without guessing.

**Entry check:** `negoNumberingLocked` must exist — Session 1 built or
reconciled it. If it is somehow absent, that is this session's first job.

**Care point:** format preservation is a hard requirement. `8.2(a)` renumbered
produces `8.1(a)` — never `8.1. (a)`. Rewrite the numeric token in place and
touch nothing around it; the product has been burned by rebuilt headings
inventing punctuation.

**Exit gate:** two clicks to close a gap on a draft with a full preview; an
executed contract offers **no path to it at all** (absent, not disabled);
preview-then-cancel leaves the document byte-identical; ids never move.

---

### STAGE 6 — The negotiation history (Sessions 13–14)

#### Session 13 — The timeline (the Large centrepiece)
**Task:** WP-2.1, with X1 and X6 built into it from the first render:
- **X1:** every entry shows the clause label **as it was when the event
  happened**, with the durable clause id underneath for filtering. Never a
  live lookup of today's number.
- **X6:** signing events (link issued, signer emailed, signature recorded,
  seal fired) render as story beats alongside changes and decisions — which is
  why Stage 4 had to land first.
- **X3:** renumbering acts render as story beats too.

**Proving:** a fixture with multi-round history renders a complete, correctly
ordered timeline; each filter proven by test; **renumber the fixture after the
events exist and assert the timeline text is unchanged** (the X1 test).

**Exit gate:** the screen reads like a story, not a log dump.

#### Session 14 — Verify and export
**Tasks:** WP-2.5 (verify-integrity button) → WP-2.4 (exportable report).

**Proving:** an untampered fixture verifies green; a deliberately tampered
fixture reports the break and identifies the first broken link. The export of
the fixture contains every change and decision, and stands alone for a reader
with no login.

**Exit gate:** the export embeds the verification result and when it was run.

---

### STAGE 7 — Live numbering (Sessions 15–16)

#### Session 15 — Numbers become presentation
**Tasks:** N3-T1 (the flag, set only on new template-born contracts) → T2 (one
numbering function every surface calls) → T3 (editing keeps working) → T4
(references go live).

**T2 is not done while any renderer formats its own number.** Every surface:
room, workbench, Doc page, print, PDF, docx, portal, Copilot context strings.
A number computed in two places will eventually disagree in two places.

**Exit gate:** delete 2.2 in a live contract → 2.3 prints as 2.2 on every
surface in T2's list, each asserted; a pre-existing contract without the flag
is untouched; an upload can never acquire the flag.

#### Session 16 — THE FREEZE (shares a session with nothing that would rush it)
**Tasks:** N3-T5 + X2 → T6 (template save-time checks) → T7 (round
boundaries) → X4 (allow-list re-audit).

**X2 is the point of this session:** the bake-in helper — printed numbers and
linked references written into a frozen copy as literal text — is written
**once** and wired into all three freeze paths: the sealed execution copy, the
view-link snapshot, and the history export. A sealed document must verify
forever, self-contained, with no dependence on the numbering code that
produced it.

**Proving:** execute, verify, then verify again after simulating a
numbering-code change. Include the print/PDF/evidence-pack paths — the page
that most needs to prove what was signed is historically the one that didn't.

**Exit gate:** a view link and a history export made from a live-numbered
contract carry literal numbers and are byte-stable against later renumbering.

---

### STAGE 8 — Extensions (Sessions 17–19)

#### Session 17 — Counterparty-minted view links
**Task:** WP-1.6. A holder of a live `negotiate` token may mint a `view` token
— a strictly weaker ticket, inheriting the parent's expiry ceiling, dying when
the parent is revoked, visible and revocable by the owner.

**Exit gate:** derivation works only from a live negotiate token; revoking the
parent kills the child; the owner can see and revoke child links.

#### Sessions 18–19 — The sub-clause model
**Tasks:** N4-T1 (decide and document the model) + T2 (extend N1 detection,
gap attribution and the N2 renumberer to sub-clause runs) in Session 18; T3
(extend N3 live numbering to sub-clause runs) in Session 19.

**Exit gate:** deleting sub-clause 2.2 in a live contract renumbers 2.3 → 2.2
without touching clause 3; in an uploaded contract it leaves the gap and, if
cited, flags the reference — the same doctrine at every depth.

---

### STAGE 9 — Hardening and release (Sessions 20–21)

#### Session 20 — The adversarial pass
**Task:** WP-3.1, extended across all four built orders. Deliberately attack:
- every mutating route with view / expired / revoked / retired / forged tickets
- renumbering and editing against executed contracts, via crafted requests
  with the browser bypassed
- out-of-order and wrong-member signatures
- one-time codes requested for typed addresses
- the X4 exclusion tests re-run against the **real routes**, not just the
  builders

Everything must fail closed. Rate-limit token guessing and derived-link
creation.

#### Session 21 — Documentation and rollout
**Task:** WP-3.2 + WP-3.3. `CHECKLIST.md` entries for every acceptance in this
plan; `SECURITY.md`, `DESIGN-contract-sharing.md`,
`DESIGN-multi-signature.md` (its Phase-2 hardening is now built — W9),
`OPEN-ISSUES.md` closures for OI-1 and OI-2; release notes flagging W8's
removal of the forward-the-link handover. Staged rollout via the existing
Render pipeline; migrations are additive, so rollback is safe.

---

## 4. Gates between stages

A stage does not close, and the next does not open, until:

| After stage | The gate |
|---|---|
| 0 | No authored change of any type can be filed against an executed contract, from any seat, with the browser bypassed. Drafts unaffected. |
| 1 | The view ticket's server lock holds on every mutating route; N1 flags attributed broken references and invents none; verified identity and reasons are being captured. |
| 2 | The counterparty's pane measures within 5% of the owner's in a real browser, and their page does not scroll. |
| 3 | Three link purposes, three screens, no verb crossing between them. |
| 4 | A multi-signer counterparty route runs unattended and each signature lands on its own row. |
| 5 | A draft's numbering gap closes in two clicks with a full preview; an executed contract has no path to it. |
| 6 | The timeline reads as a story and survives a renumbering unchanged. |
| 7 | Sealed, snapshotted and exported copies of a live-numbered contract all carry literal numbers. |
| 8 | Derived view links are strictly weaker than their parents; sub-clauses behave like clauses at every depth. |
| 9 | Every route fails closed under attack; docs match the code. |

---

## 5. Stop conditions

Stop, write a `BUGLOG.md` entry, and raise it rather than pressing on:

1. **A prerequisite the spec calls shipped is not in the code.** Found once
   already (`negoNumberingLocked`); assume it will happen again.
2. **A test that was green at session start goes red and cannot be fixed
   within the session.** Never work around a failing test by weakening it.
3. **The spec and the code disagree about what exists.** The code wins; the
   work order gets amended.
4. **A deletion would remove a capability with no replacement** — specifically
   `#portal-plain` (whole-document rewrite) and `pt-proposed` (monetary
   counter-offer). Raise rather than drop silently.
5. **Two consecutive passes make no measurable progress on the same task.**
6. **A decision is needed that is the owner's to make** — see §6.

---

## 6. Open questions that block specific sessions

| # | Question | Blocks | If unanswered |
|---|---|---|---|
| **D5** | Is the counterparty's name **identity** (one named person, set once) or **attribution** (asked per action as it circulates their legal team)? Recommendation: split it — relaxed for negotiating, strict for signing (W7/W8 make the strict half true regardless). | W3, in Session 7 | Session 7 ships W2/W4/W5 without it; W3 waits. No guessing. |

Nothing else in the programme is blocked on an answer. Every other decision is
recorded in the master work order's register and can be overturned on request.

---

## 7. Parked — not in the 21 sessions

Two work orders are logged but cannot start yet:

| Work order | Blocked by |
|---|---|
| `WORKORDER-pdf-upload.md` — PDF and scanned-document upload (2–3 sessions) | Its own brief gates it on the Template Library brief (Phases A–D) being merged and working. That brief is not in this repository. |
| Template library fixes (referenced, not present) | The document itself is not in this repository. |

When their dependencies arrive, they slot in as independent tracks — neither
interacts with Stages 0–9.

---

## 8. Summary

| Stage | Sessions | What ships |
|---|---|---|
| 0 ⚠ | 1–2 | Executed contracts become genuinely immutable |
| 1 | 3–5 | The view ticket's lock, linked references, better records, signer enforcement |
| 2 | 6–7 | The counterparty gets a real workbench |
| 3 | 8–9 | Three link purposes, three clean screens; the view-only link works |
| 4 | 10–11 | Multi-signer counterparty signing, correctly attributed and verified |
| 5 | 12 | The renumber button |
| 6 | 13–14 | The negotiation history, verified and exportable |
| 7 | 15–16 | Live numbering with a safe freeze |
| 8 | 17–19 | Derived view links; sub-clauses |
| 9 | 20–21 | Adversarial hardening, docs, rollout |

**21 sessions.** Each stage ships value on its own; the programme can pause at
any stage boundary with the product ahead of where it started.
