# Session Notes

Reverse-chronological log of autonomous work against the product backlog
(`hati-product-backlog (1).md`). One entry per epic/session.

---

## E4 — Kenya playbook engine + clause library

**Done** (new `js/playbook.js`)

- **E4-T1** — Clause library: seeded standard clauses (category, name,
  preferred + fallback wording, guidance) for governing law, payment,
  liability cap, confidentiality, data protection, termination. Admin/Legal
  add/edit/remove in Settings (stored in `state.settings.clauseLibrary`,
  synced via the existing settings API). "Insert clause" in the workspace
  adds the preferred wording as an E2 redline.
- **E4-T2** — Playbook data model: per contract type, positions
  (required/preferred/forbidden, with escalate flag) and numeric ranges
  (payment ≤ 45 days, liability ≥ 12 months). Types extend a `_default`
  baseline; a Settings viewer shows the resolved positions per type.
- **E4-T3** — Seeded Kenya FMCG playbook covering supply/services/lease/NDA
  plus baseline Kenya-specific checks (Kenyan governing law & forum, Data
  Protection Act 2019 / ODPC, stamp duty for leases, KEBS quality).
- **E4-T4** — AI playbook review: `POST /api/ai/playbook` sends the document
  + resolved playbook to Claude → per-clause verdicts (aligned / deviation /
  missing) with verbatim quote, preferred position, and a suggested redline;
  applied via E2's redline mechanism. Fallback: a deterministic heuristic
  (`playbookReviewHeuristic`) that detects foreign law, over-long payment
  terms, missing data-protection/liability/confidentiality etc.
- **E4-T5** — Deviation report: a workspace panel summarising
  deviations/missing with escalate flags; the count also feeds the Home
  Attention banner and is available to E5's approval gate
  (`deviationSummary`).

**Tested.** 20 checks (playbook key mapping, `_default` inheritance,
heuristic review producing aligned/deviation/missing with quotes +
redlines + escalation, deviation summary, clause library seed, insert-
clause → redline+version, workspace panel + run, settings library editor +
playbook viewer). E0 21-check regression green; `/api/ai/playbook`
registered + auth-gated; no page errors. Signing seal untouched.

**Definition of Done** — met: review a supplier contract → aligned/
deviating/missing clauses with quotes → apply a suggested redline as a new
version.

---

## E3 — Renewal calendar & obligation management

**Done** (new `js/obligations.js`, `js/views/calendar.js`)

- **E3-T1** — Calendar view (new "Calendar" nav-rail item): month grid +
  a 60-day agenda showing expiries (red), renewal-decision deadlines
  (gold = expiry − notice period, from E1 metadata) and obligation due
  dates (green), each click-through to its contract, with prev/next/today.
- **E3-T2** — Obligations as records: `c.obligations[]` (desc, due,
  recurring, assignee, status open/done/overdue) with an add/edit UI and a
  renewal-decision banner in a new workspace section.
- **E3-T3** — AI obligation extraction: "Find obligations" runs
  `POST /api/ai/obligations` (Claude proposes obligations with clause
  quotes) in server mode; a regex heuristic (`heuristicObligations`) covers
  payment/notice/reporting/delivery/insurance offline. Proposals go through
  a tick-to-add review — nothing saved without confirmation.
- **E3-T4** — Wiring: `runReminders()` now also fires renewal-decision
  reminders (14/7/1 days before expiry − notice) and one-time
  obligation-overdue emails, reading full JSON for metadata + obligations.
  Home's Attention snapshot gained a banner ("N obligations overdue · M
  renewal decisions due in 30 days") linking to the calendar.
- **E3-T5** — Register saved views: "Expiring ≤ 90 days", "Auto-renewing
  soon", "Overdue obligations".

**Tested.** 15 checks: renewal-decision date math, 4 obligation heuristics,
obState, calendar grid/agenda/nav render, saved-view apply, workspace
obligations section. E0 21-check regression green; server boots and
`/api/ai/obligations` is registered + auth-gated; calendar screenshot
verified (7-col grid, colour-coded events, agenda). Signing seal untouched.

**Harness note.** The local Tailwind build now scans `js/**/*.js` too, so
classes introduced only in view modules (e.g. `grid-cols-7`) compile for
screenshots; production uses the Tailwind CDN's runtime JIT and was always
correct.

**Definition of Done** — met: calendar shows sample-portfolio events; an
assigned obligation surfaces in Attention and queues a reminder; saved
views filter.

---

## E2 — Versioning + in-document redlining

**Done** (new module `js/versioning.js`)

- **E2-T1** — Contract versions as records: `c.versions[]` (`n`, `at`, `by`,
  `label`, `text`). `captureVersion()` snapshots the current document text,
  deduped so identical text never spawns a version. Captured at share
  ("Shared for review"), on redline acceptance, at signing ("Signed &
  sealed"), and via a manual "Snapshot current version" button.
- **E2-T2** — Version compare: a hand-written word-level LCS diff
  (`wordDiff`) over whitespace tokens, rendered inline with additions in
  green `<ins>` and deletions in struck red `<del>` (`diffHtml`), plus
  add/remove counts. A Versions panel in the workspace lists every version
  with a per-row "diff" (vs previous) and a "Compare any two…" picker.
- **E2-T3** — Counterparty redlining in the share portal: a "Propose edits
  (redline)" button reveals the document text as an editable textarea; the
  submission is stored as a change-request round carrying `proposedText`
  (their edited text) + `baseText` (what they edited from) — the owner's
  draft is never overwritten.
- **E2-T4** — Owner review: rounds carrying proposed text show a "Review
  redline" action that opens a diff (base → proposal) with Accept / Reject.
  Accepting captures a pre-redline version, adopts the proposed text as
  `c.redlineText`, captures it as a new version attributed to the round,
  and archives the round (extends the existing negotiation archive).
- **E2-T5** — Pre-sign guard: `signDocument` blocks when open proposed
  edits remain; Admin/Legal may override with a confirm (logged as an
  override in the audit trail). Signing seals the latest accepted version.

**Seal integrity (guardrail 1).** `freezeContractHtml` gained a single
additive branch: when `c.redlineText` is set it seals that exact text;
otherwise it behaves exactly as before. Existing seals use the already-
frozen `c.execution.html` and verify unchanged — nothing about the
SHA-256 freeze/hash path changed. A test confirms a new seal covers the
adopted redline text.

**Tested.** 13 unit checks (word diff eq/add/del, diff HTML tags, diff
stats, version capture + dedup, redline accept → version + seal, the
open-redline guard, response round carrying proposedText/baseText) + a
7-step end-to-end UI run (create draft → snapshot → simulated redline
round → review-diff modal → accept → adopted/versioned/closed). Full E0
21-check regression still green; no page errors. Server unchanged — it
stores the response JSON verbatim, so `proposedText`/`baseText` pass
through the existing share flow.

**Definition of Done** — met: owner drafts → shares → counterparty
proposes edits → owner accepts/rejects → version history shows every
round → sign seals the accepted text.

---

## E1 — AI metadata extraction on upload ("file it for me")

**Done**

- **E1-T1** — Metadata concept: contracts carry `c.metadata` (JSON within
  the existing row — additive, works in both modes) with counterparty,
  contractType, effective/expiry dates, value + currency, renewalType
  (auto-renew/fixed/evergreen/unknown), noticePeriodDays, governingLaw,
  paymentTerms, plus a per-field `confidence` map (high/medium/low).
- **E1-T2** — Extraction on upload: new `POST /api/ai/extract` proxies the
  document text to Claude with a strict `file_contract` tool (JSON-only,
  per-field confidence). Client `extractMetadata()` calls it in server
  mode with a key; otherwise a regex/heuristic fallback
  (`heuristicExtract`) pulls dates, KES/USD values, governing law, payment
  terms, notice period and renewal signals — everything else left blank.
- **E1-T3** — Review-and-confirm panel (`openMetaReview`): every field
  editable, low-confidence fields highlighted amber; nothing is saved
  until the human confirms. Wired into the upload flow before the contract
  is persisted; confirmed values fold back into the contract
  (`applyMetadata`) and log an audit entry.
- **E1-T4** — Metadata in the Register: new renewal-type filter and a
  renewal chip on rows; value/expiry/counterparty sorting already existed;
  Home KPIs use the real values that extraction now populates.
- **E1-T5** — Backfill: admin action in Settings ("Extract metadata for
  existing contracts") that walks uploads lacking confirmed metadata one
  at a time, each queued through the same review panel before saving.

**Design notes.** Metadata lives in the contract JSON blob, not new SQL
columns — inherently additive (guardrail 6) and identical in server and
static mode. The uploader's own typed values seed the extraction at high
confidence so the AI/heuristic never downgrades what the human already
stated. The AI-engine Settings card (and thus backfill) is server-mode
only, matching the existing key-storage design; the heuristic path keeps
static-mode uploads working with no key.

**Tested.** 8-case heuristic extraction check on realistic Kenyan supply
text (value, currency, governing law, payment, notice, renewal, expiry,
confidence map) + review-panel confirm + applyMetadata fold-in + register
filter presence — all pass, no page errors. Full E0 21-check regression
suite still green. Server boots; `/api/ai/extract` registered and
auth-gated (401 unauth). Signing seal untouched.

**Definition of Done** — met: upload → confirm extracted fields → contract
carries expiry/value/renewal; register filter works; no-key path uses the
heuristic fallback.

---

## E0 — Modularize the frontend

**Done**

- **E0-T1** — Extracted the platform core (state, Kenyan template/folder
  constants, seed data, persistence, auth, mode detection, signing seal,
  sharing, export, and the counterparty portal) from `index.html` into
  `js/core.js`, loaded as a native ES module.
- **E0-T2** — Extracted each screen into its own module under `js/views/`:
  `home`, `register` (register + folder), `queue` (pipeline),
  `intelligence` (deal map + portfolio intelligence), `settings`
  (team & settings), `contract` (workspace + inbound uploads), `portal`.
- **E0-T3** — Extracted the remaining shared pieces: `js/components.js`
  (icons + shared contract row), `js/templates.js` (template/folder
  constants + seeds), `js/api.js` (fetch layer), `js/ai.js` (scan rule
  engine + assistant). Added `js/app.js` as the single entry module that
  imports everything in original execution order, then wires nav + boot.
  `index.html` now carries no inline application JS — only
  `<script type="module" src="js/app.js">`.
- **E0-T4** — Documented the static-mode change (below); updated README
  quick-start and architecture sections.

**Design decision — window-attached globals.** The app was written
against a single global scope: inline `onclick=` handlers in generated
HTML and free cross-section function calls. ES modules are lexically
scoped, which would break both. Rather than rewrite every call site into
imports/exports (large, risky, and out of scope for a "zero behaviour
change" task), each extracted module attaches its top-level bindings to
`window`: `let` globals become `window.X`; `const`/`function` bindings
are re-exported with `Object.assign(window, {…})`. Modules therefore give
**per-file editing isolation, not scope isolation** — which is what E0
needs so later epics can work on one area safely. A future cleanup can
migrate hot paths to real imports incrementally.

**Static mode now requires an HTTP server.** ES modules are fetched under
CORS, so opening `index.html` from the filesystem (`file://`) is blocked
by the browser ("Cross origin requests are only supported for protocol
schemes: …http, https…"). Static mode must now be served, e.g.
`python3 -m http.server 8000`. Server mode is unaffected — Express already
serves the files over HTTP. README updated to remove the "or just open
index.html" instruction.

**Tested**

- Rebuilt Tailwind locally (CDN is blocked in the sandbox) and ran the
  21-check Portfolio Intelligence Playwright suite against the split
  build — all pass, no page errors.
- Verified every view renders (dashboard, register, pipeline, team,
  contract workspace) and the counterparty portal entry point is defined;
  the 30-contract sample portfolio still loads.
- Confirmed `file://` now fails with the CORS error above (the documented
  static-mode change), while HTTP serving works.

**Skipped / deferred** — none for E0.

**Definition of Done** — met: app works identically in server mode; all
views render; sample portfolio loads; signing and counterparty share
paths intact (portal module + seal logic untouched).
