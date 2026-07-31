# MASTER WORK ORDER — Sharing, History & Numbering as one programme

**Project:** HaTi (Mkataba CLM)
**Date:** 2026-07-31
**Status:** Approved plan — no code written
**Combines:** `WORKORDER-view-share-and-history.md` (view-only share link +
negotiation history, work packages WP-1.1 … WP-3.3) and
`WORKORDER-clause-numbering.md` (linked references, renumbering, live
numbering, sub-clauses, phases N1 … N4). Both source documents travel on this
branch alongside this one.

---

## What this document is

The two source work orders were written in separate sessions and are each
complete on their own. This document merges them into **one build programme**:
a single ordered sequence of stages, with the places where the two features
touch each other made explicit and given their own tasks.

**The source documents remain the detailed spec.** Every task keeps its
original ID (WP-1.1, N2-T3, and so on) so nothing needs rewriting. This
document is the conductor's score: it says what plays when, and it adds four
small integration tasks (X1–X4) that exist only because the two features are
being built side by side.

---

## Why these two must be planned together

Read separately, the work orders look independent — one is about who may see a
contract, the other about how its clauses are numbered. They collide in four
specific places, and each collision gets a named task so it cannot be
forgotten:

### X1 — History must name clauses by the number they had *at the time*
The history timeline (WP-2.1) tells a story: "Jane proposed changing Clause
8.2." The numbering work (N2, N3) makes clause numbers *movable*. If Clause
8.2 later becomes Clause 8.1, a timeline that looks up today's number would
silently rewrite the story. **Rule:** every history entry displays the clause
label as it was when the event happened (the label is already captured in the
change record), with the durable clause id underneath for filtering. This is
folded into WP-2.1's spec as a requirement, not an afterthought — it must be
true from the timeline's first render, even though renumbering ships later.
*Size: Small (a rule inside WP-2.1, plus one test: renumber a fixture after
events exist, assert the timeline text is unchanged).*

### X2 — One freeze doctrine, three consumers
Three different features produce a "frozen copy" that must stand on its own
forever: the view-link snapshot (WP-1.3), the exportable history report
(WP-2.4), and the sealed execution copy (N3-T5). The numbering work order
already states the rule for the seal: once numbers are *painted* at render
time rather than stored, any frozen copy must have the printed numbers **baked
in as literal text** — it must verify and read correctly years later with no
dependence on the code that produced it. **Rule:** that bake-in is built once,
as one helper, and all three freeze paths use it. Today (before N3) stored
numbers are literal text so the rule is trivially satisfied; the task
activates in the N3 stage, where the helper is written and all three consumers
are converted and tested together. *Size: Small–Medium, lives inside N3's
second session alongside N3-T5.*

### X3 — Renumbering is a history event
N2-T4 already requires one audit entry summarising a renumbering act. The
timeline (WP-2.1) must render that entry as a first-class story beat:
"David renumbered clauses after the deletion of Clause 9 — 4 headings and
2 cross-references updated (preview confirmed)." **Rule:** the N2 audit
entry's shape is agreed when N2 is built so WP-2.1 can render it without
guessing; if the timeline ships first, it gets the renderer in the same
session N2 lands. *Size: Small.*

### X4 — The viewer allow-list must be re-audited when numbering adds fields
The viewer payload (WP-1.2) is built by allow-list: start from nothing, add
only what the outside advisor may see. The numbering phases add new data to
contracts — reference maps (N1), renumbering plans and audit entries (N2), the
`numbering: 'live'` flag and linked references (N3). None of these are
secrets, but the discipline is the point: **every numbering phase ends with a
re-run of WP-1.2's exclusion test against the real share route**, extended to
assert the new fields appear only if deliberately allow-listed (references and
live numbers: yes, the advisor needs correct numbers; internal plans, audit
entries, review flags: never). *Size: Small, recurring — a checklist line in
each numbering stage and in the final hardening pass.*

---

## Merged ground rules

The two source documents state overlapping doctrines. Merged, the programme
runs on six rules; the source docs carry the detail.

1. **The server refuses; the UI merely hides.** Every restriction is enforced
   in `server/server.js` before any screen work (view tickets: WP-1.1; the
   execution lock: `negoNumberingLocked` on every numbering gate).
2. **Safety nets before moving parts.** The server lock (WP-1.1) ships before
   the rest of Phase A; linked references (N1) ship before anything moves a
   number (N2, N3). Both are hard ordering rules, not preferences.
3. **Frozen things are self-contained** (X2). Snapshots, exports, and sealed
   copies carry their numbers and content as literal text, forever.
4. **Evidence is never rewritten.** History assembles and presents existing
   records; renumbering never touches hashes (`num`/`title` stay excluded
   from `negoHashInput`); nothing prunes or reorders the audit trail.
5. **Additive only.** Migrations via `addColumnIfMissing()`; no
   retro-conversion of existing contracts or uploads; origin
   (`negoIntakePath`) is decided at intake and never changes.
6. **Every package ships with its proving test** (`node --test
   test/*.test.js` plus a Playwright check where the change is visual), and
   its "Done when" from the source document is the gate.

---

## The programme: seven stages

Stages are ordered; a stage may span more than one session. **Every stage
ships real value on its own** — the programme can pause after any stage and
the product is still ahead. Task detail lives in the source documents; sizes
are theirs (S/M/L).

### Stage 1 — Foundations (three independent tracks, parallel-safe)
| Track | Tasks | Size | Why now |
|---|---|---|---|
| A | **WP-1.1** server-enforced `view` ticket | M | The lock on the door; blocks all other view-link work |
| B | **WP-2.2** verified identity on decisions + **WP-2.3** reason nudge | S–M | Capture improvements — good records start accruing from today |
| C | **N1** linked cross-references (T1–T5) | M | The safety net; closes OI-1; hard prerequisite for N2/N3 |

These three touch different parts of the app and can be built in any order or
in parallel sessions. **Done when:** each track's own Definition of Done from
its source document is met.

### Stage 2 — The view-only share link, complete
**WP-1.2** viewer payload allow-list → **WP-1.3** snapshot semantics →
**WP-1.4** viewer page → **WP-1.5** expiry / revoke / OTP / open-tracking.
Roughly two sessions. **Done when:** an outside advisor can open a link, see
the frozen redlined contract with banner and watermark, print it cleanly, and
can do nothing else — proven by route tests and a Playwright check; the owner
sees status and can revoke.

### Stage 3 — The renumber button
**N2** (T1–T5): preview-and-confirm renumbering for any draft,
format-preserving, absent on executed contracts, references repointed in the
same plan. Closes OI-2. Includes **X3**: the audit entry is shaped for the
timeline. One session. **Done when:** N2's Definition of Done — two clicks,
full preview, no path to it on an executed contract.

### Stage 4 — The negotiation history, complete
**WP-2.1** timeline screen (with **X1** baked into its spec) → **WP-2.5**
verify-integrity button → **WP-2.4** exportable report (using the freeze
doctrine — literal text, no live lookups). Roughly two sessions; the timeline
is the Large centerpiece. **Done when:** the fixture contract's multi-round
story renders, filters work, integrity verifies green (and a tampered fixture
reports the break), and the export stands alone for a reader with no login.

### Stage 5 — Live numbering (the Ironclad-parity piece)
**N3** in two sessions, as its work order demands:
- Session one: T1 (the flag) → T2 (one numbering function) → T3 (editing
  keeps working) → T4 (live references).
- Session two: **T5 THE FREEZE** plus **X2** — the bake-in helper is written
  here and wired into all three freeze paths (seal, view snapshot, history
  export), then T6 (template save-time checks) and T7 (round boundaries).
- Ends with an **X4** allow-list re-audit.

**Done when:** N3's Definition of Done, plus: a view link and a history export
made from a live-numbered contract carry literal numbers and are byte-stable
against later renumbering.

### Stage 6 — Extensions
| Task | Size | Notes |
|---|---|---|
| **WP-1.6** counterparty-minted view links | M | Derived tickets — strictly weaker, inherit expiry, die with the parent, owner-visible and revocable |
| **N4** sub-clause model (T1–T3) | L | The honest hard part; extends N1–N3 to every depth; deliberately last |

Independent of each other; either can ship first or be deferred.

### Stage 7 — Hardening and release (one combined pass)
**WP-3.1** adversarial security pass, extended to the numbering surfaces:
every mutating route replayed with view / expired / revoked / forged tickets;
renumbering attempted on executed contracts and via forged requests; the
**X4** exclusion test re-run against the real routes one final time.
**WP-3.2** docs: `CHECKLIST.md` entries for every "Done when" above,
`SECURITY.md` and `DESIGN-contract-sharing.md` updates, `OPEN-ISSUES.md`
closures for OI-1/OI-2. **WP-3.3** staged rollout via the existing Render
pipeline — additive migrations, safe rollback.

---

## Sequence at a glance

| # | Stage | Contents | Sessions (est.) | Hard dependencies |
|---|---|---|---|---|
| 1 | Foundations | WP-1.1 · WP-2.2 + 2.3 · N1 | 2–3 | — |
| 2 | View link | WP-1.2 → 1.3 → 1.4 → 1.5 | 2 | WP-1.1 |
| 3 | Renumber button | N2 (+ X3) | 1 | N1 |
| 4 | History | WP-2.1 (+ X1) → 2.5 → 2.4 | 2 | WP-2.2/2.3 (helpful), N2 audit shape for X3 |
| 5 | Live numbering | N3 (+ X2, X4) | 2 | N1, N2, WP-1.3 & WP-2.4 existing (for X2 wiring) |
| 6 | Extensions | WP-1.6 · N4 | 2–3 | 1–5 as per source docs |
| 7 | Hardening & release | WP-3.1–3.3 (+ X4 final) | 1 | everything |

**Total: roughly 12–14 sessions.** One phase per session at most; N3's freeze
session shares a session with nothing that would rush it.

Stages 2/3 and 3/4 can swap or interleave if a session's context favors it —
the only unbreakable orderings are: WP-1.1 before the rest of the view link;
N1 before N2 before N3; N4 last among numbering; X1 present from WP-2.1's
first render; X2 complete before any live-numbered contract can be sealed,
snapshotted, or exported; hardening last.

---

## Decision register (merged; flag any to overturn)

From the sharing/history order:
1. View links show a **snapshot**, not the live contract.
2. The advisor has **no feedback channel inside HaTi** in v1.
3. Decision reasons are **encouraged, never mandatory**.
4. Export format is **print-optimized HTML → PDF** first; DOCX later.
5. Counterparty-minted links ship **after** the core view link.

From the numbering order:
6. Uploaded contracts **never renumber themselves** — explicit, previewed
   action only; executed contracts never renumber by any path.
7. Live numbering applies only to contracts **born in HaTi after N3 lands** —
   no retro-conversion.
8. Format preservation is a hard requirement (`8.2(a)` → `8.1(a)`, never
   `8.1. (a)`).
9. Warnings advise; nothing auto-edits legal wording, ever.

New in this master order:
10. History displays **labels as of the event** (X1), never today's numbers.
11. Frozen copies (seal, snapshot, export) share **one bake-in helper** (X2).
12. The viewer allow-list is **re-audited after every numbering phase** (X4).

## Out of scope (union of both source documents)

Live-updating view links; advisor commenting mode; multi-tenancy changes;
renumbering anything executed by any path; retro-converting existing
contracts or uploads; auto-fixing references without preview and
confirmation; OCR/import-time "upgrade this upload" conversion; any change to
the negotiate or sign flows beyond identity stamping (WP-2.2).

## Session conventions

As in `hati-product-backlog (1).md` and both source orders: one commit per
task, a `SESSION-NOTES.md` entry per session, tests green before commit, and
do not start a stage before the previous stage's Definition of Done is met
(within Stage 1, the three tracks gate independently).
