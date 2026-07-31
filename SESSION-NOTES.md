# Session Notes

Reverse-chronological log of autonomous work against the product backlog
(`hati-product-backlog (1).md`). One entry per epic/session.

---

## Stage 0 — the execution lock (E1–E5, WORKORDER-execution-lock.md)

**Done** (`js/negotiation.js`, `js/views/negotiation.js`, `js/views/contract.js`,
`js/core.js`, `server/server.js`; new `test/f106` 29 tests and `test/f107` 10;
suite 1853/0, browser 69/69)

MK-248 was reported Executed with a live Save change bar on its clause body, and
the edit filed. negoResolve had carried the signed door for a long time; the
authoring side asked nothing at all, so the real rule was "you may not rule on a
change to a signed agreement, but you may author one".

- **E1** merged `origin/claude/clm-clause-renumbering-4imkqd` rather than writing
  a second `negoExecuted`. That branch already named the predicate, with the
  argument for reading all three signals (status, seal, execution stamp), plus
  `negoNumberingLocked`, `negoNumberingGaps` and f98. One definition, not two
  that agree today. **This also closes the gap recorded in the master work order
  (X0): those helpers were never on `main`.**
- **E2** guards `negoFileChange` at the funnel, not at its callers — the fifth
  caller, the Word-import walk, inherits it without knowing it needs to.
- **E3** `renderRedline` derives `readonly` from `negoExecuted`, which closes
  every `canAct`/`editable` gate at once; the room mount in `contract.js` stops
  asking `status === 'Signed'`; the change index says why it has no verbs.
- **E4** the server guard already existed (`EXECUTED_IMMUTABLE`) — the work
  order was wrong to say the route checked nothing. It had two real gaps: the
  negotiation record (`changes`, `rounds`, `negotiation`, `versions`) was not on
  the list, so a request could leave the sealed wording alone and rewrite the
  story of how the parties reached it; and `isExecutedRow` read two signals
  where the browser reads three (the delete route had already patched the same
  hole locally, which was the tell). Both closed. `SEAL_ACQUIRABLE` keeps
  sealing possible on a signed-but-unsealed record, once.
- **E5** `executedDivergence()` — and the finding that made it necessary:
  **verifySeal never compared the live body to the sealed copy.** It verifies
  the frozen copy against itself, so a post-execution edit left the seal
  reporting valid while the screen showed wording nobody signed. Reports, never
  repairs; both "repairs" destroy evidence.

**Tests rewritten, not worked around.** f52's room helper filed changes onto an
already-Signed contract as setup; its `negoResolve` calls were already silent
no-ops against the signed door, so the acceptances it arranged never existed.
Now it negotiates first and stamps execution after. f102 gave a Signed fixture a
document body by PUT, which the guard correctly refuses — MK-A1 ships with its
body instead (`FIXTURE_BODY_A1` in helpers.js).

**Next:** Stage 1 (WP-1.1 view ticket, N1 linked references, WP-2.2/2.3 capture,
W9 signer identity) per `EXECUTION-PLAN.md`.

---

## Template Library & Document Converter (Runs under TEMPLATE_LIBRARY_BRIEF)

**Done** (all four phases; RECON.md, SUMMARY.md Run 7, BUGLOG.md, LOOP_REPORT.md,
CHECKLIST.md updated; new `js/fieldlib.js`, `js/templateform.js`,
`js/views/templatelib.js`, `js/views/templatebuilder.js`; server: `/api/templates*`,
org branding/profile, portal template-values, save-as-template, upload-convert)

- Versioned, permissioned template library with immutable published versions;
  contracts are independent copies stamped with write-once provenance.
- Manual builder + save-as-template + upload-and-convert (claude-sonnet-4-6,
  forced tool_use, unskippable confirmation screen, no auto-approve).
- Typed fill forms with ONE shared validation registry, owner and portal alike,
  per-field autosave; signing gates on a complete valid form; org letterhead.

**Tested.** f101–f105 (29 new tests); suite 1692/0. Live-model Brut acceptance
(≥24/27) marked NOT RUN — needs a real key.

**Skipped/deferred** per the brief's out-of-scope list: PDF/OCR, clause
library, auto-updating open contracts, cross-org sharing, pricing.
---

## Clause numbering — the gap a deletion leaves, and the lock after signature

**Done** (`js/clausemodel.js`, `js/negotiation.js`, `js/views/negotiation.js`;
new `test/f98-numbering-gaps-and-the-lock.test.js`, 25 tests; no server changes)

Deleting a clause takes its heading and body out and closes nothing up, so a
contract that loses clause 9 reads 1..8, 10..24. That behaviour is right and
stays — a number is the text the file carries, and printing one it does not
carry is a renumbering however small. What was missing is that nothing said so,
and a lawyer meeting 8 followed by 10 reads a mangled document.

- **`clauseNumberGap(nums, num)`** — is one number missing, and what are its
  nearest siblings. Sibling-aware and depth-aware: `8.2` is missing from a
  document carrying `8.1` and `8.3`, is not missing from one carrying only `8`
  and `9`, and `12` never answers for `1.2`. Numeric ordering throughout, so the
  notice cannot print its own sentence backwards.
- **`negoNumberingGaps(c)`** — the gaps this contract's own deletions made.
  Attributed to an accepted `deleteClause`, never scanned for. Read from
  `negoAllChanges`, not `c.changes`: closing the round both creates the gap and
  archives the change that caused it, so the live set is empty of exactly the
  records this needs. It times itself — an accepted deletion is struck through
  and stays in the document until the round closes, so nothing is announced
  before the hole exists.
- **`negoExecuted(c)` / `negoNumberingLocked(c)`** — the execution test
  (`status === 'Signed' || hash || execution.at`) had been written out longhand
  in `negoResolve` with a comment warning that narrowing it to the status alone
  would drop the seal. The numbering lock needed the same fact, so it is now one
  named predicate and `negoResolve` calls it rather than a second copy.
- **The notice** — in the room's working pane and on the redline workbench,
  inside the document above the first clause. Deliberately NOT in the banner
  slot: that slot answers one question (where does this stand?) with one answer
  at a time, and f52 exists because it used to stack.

**Why no scan for skipped numbers.** The obvious implementation is wrong on the
product's own primary fixture. The prototype's contract is numbered 1, 4, 5, 6,
9, 12 because it is an extract of a longer agreement, and `clausefixtures.js`
keeps it that way so nothing can treat a number as an index. A scan reports six
faults on a perfectly good document and would do the same to every uploaded
contract shaped like it. `f98` holds that line explicitly.

**Why the notice offers no button.** Closing the gap is a renumbering, and a
renumbering is a deliberate act — telling somebody what happened is not the same
as inviting them to undo it. A notice that quietly offers the undo is how a
contract gets renumbered by somebody who thought they were tidying.

**The lock.** Once a contract is executed its clause numbers are cited by every
amendment that varies it and by anyone arguing about it afterwards, so tidying
1..8, 10..24 into 1..23 repoints all of that silently. The notice switches voice
at execution — "the gap stays exactly where it is" rather than "renumbering is a
separate, deliberate act" — and `negoNumberingLocked` is the gate any future
renumbering must pass. There is no renumbering action yet;
`clauseReplaceHeading` is the primitive it will be built on and still has no
callers. The gate is written and tested ahead of it on purpose.

**Not built:** the `Renumber clauses` action itself (preview, format-preserving,
hierarchy-aware) — steps 2 to 4 of OI-2 in `OPEN-ISSUES.md`. Cross-references to
a deleted clause are still not detected at all — OI-1, untouched.

**1774 tests, 0 failures.** `f98` is new (25 tests). No existing assertion
needed changing.

---

## AI assistant chrome — delete history, minimize, unread glow

**Done** (`js/ai.js`, `js/components.js`, `index.html`; no server changes)

- **Delete conversation** — a trash button in the assistant header wipes
  `ai.history` (behind a native confirm) and re-seeds the greeting, with a
  "Conversation deleted" toast.
- **Minimize** — a minus button hides the panel without closing the
  conversation. A small gold dot appears on the rail launcher so you can
  see the assistant is parked, not gone.
- **Unread glow** — if an answer arrives while the panel is not open
  (minimized *or* closed mid-thinking), the launcher dot pulses
  (`aiPulse` keyframe ring). Opening the panel clears both the dot and
  the glow; the answer is waiting in the feed.
- New `trash`/`minus` icons in the shared ICONS map; state lives on the
  existing `ai` object (`minimized`, `unread`) — additive only, and the
  intel-page dock is untouched.

**Tested** — 14-check Playwright suite (open/minimize/reopen, unread flag
+ pulse when an answer lands minimized, glow cleared on reopen with the
answer in the feed, delete resets to greeting, close shows no dot,
close-during-pending also glows; no page errors) plus the standing
21-check Portfolio Intelligence regression — all green.

**Skipped / deferred** — the guide-book page / platform-guide mode, per
the user ("we will add a guide book page later").

---

## E8 — Commercial hardening (server-side)

**Done** (all in `server/server.js`; docs `DEPLOYMENT.md`,
`MULTITENANCY-NOTES.md`)

- **E8-T1** — Rate limiting: an in-memory sliding-window limiter (no deps)
  guards auth/setup/reset (10 / 15 min), share OTP (8 / 15 min) and share
  responses (30 / 15 min); excess → `429` with `Retry-After`. Verified: 10
  rapid bad logins then `429`.
- **E8-T2** — Security headers on every response (`X-Content-Type-Options`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`,
  and HSTS when TLS). Cookies gain `Secure` when `HTTPS=true`/`TRUST_PROXY`.
  `DEPLOYMENT.md` documents running behind Caddy/nginx with TLS + systemd.
  Verified: headers present; `Secure` + HSTS appear under `HTTPS=true`.
- **E8-T3** — Session hardening: additive `expires_at`/`last_seen`/`ip`/`ua`
  columns; 30-day absolute expiry enforced in `auth`; login rotates to a
  fresh token; `GET /api/sessions` + `DELETE /api/sessions/:id` power an
  "Active sessions" list with revoke in Team & Settings.
- **E8-T4** — Workspace export: `GET /api/export/workspace.zip` (admin)
  streams a real ZIP (hand-rolled with built-in `zlib` deflate + CRC32, no
  deps) containing `workspace.json`, `contracts.json` (with versions/audit/
  redlines), `users.json` (no password hashes) and uploaded `files/`.
  Restore documented in `DEPLOYMENT.md`. Verified: valid zip extracts, JSON
  parses, no salt/hash leak.
- **E8-T5** — Multi-tenancy groundwork: additive `org_id` column
  (`ws_default`) on `contracts`/`users`; `MULTITENANCY-NOTES.md` describes
  exactly what remains (thread org_id through every query, per-tenant
  settings, provisioning) and explicitly does **not** enable multi-org
  signup or billing.

**Tested.** Live server: all security headers present; `Secure`+HSTS under
`HTTPS=true`; rate limiter trips to 429; sessions list/revoke; workspace
zip is a valid archive that extracts with contracts + hash-free users. E0
21-check regression green; settings render with no page errors. Signing
seal untouched.

**Definition of Done** — met: brute-force logins are throttled; deployment
doc exists; a full workspace export is produced and extracts cleanly.

---

## E7 — Analytics & reporting

**Done** (new `js/views/reports.js`; `GET /api/analytics`)

- **E7-T1** — Lifecycle events derived from the existing audit trail
  (`lifecycleEvents`, `firstAuditAt`) — Created/Uploaded → … → Signed —
  reused rather than duplicated.
- **E7-T2** — A Reports view (new nav-rail item) with decision-grade
  metrics: average cycle time draft→signed (from audit timestamps), average
  age in each open stage, negotiation rounds per contract type, portfolio
  value by value-stream and by top counterparty, and the renewal-pipeline
  value for each of the next 12 months — rendered as clean CSS bar charts
  (no chart library, no build step). A server `GET /api/analytics` does the
  value-by-folder/party/status and pipeline aggregates in SQL over indexed
  columns so they stay fast at 1,200+ contracts.
- **E7-T3** — CSV export of the report tables (metrics, value by stream,
  top counterparties, renewal pipeline), reusing the existing download
  helper.

**Tested.** 10 client checks (cycle-time ≈7d from seeded audit, value-by-
folder, ranked counterparties, pipeline months, rounds-by-type, view
render, bar charts, CSV download) + live server run confirming
`/api/analytics` returns byStatus/byFolder/byParty/pipeline SQL aggregates.
Reports screenshot verified. E0 21-check regression green; no page errors.

**Definition of Done** — met: reports render from the sample portfolio in
well under a second and export to CSV.

---

## E6 — Search, templates & self-serve creation

**Done** (new `js/wizard.js`; server search endpoints)

- **E6-T1** — Server-side full-text search (SQLite FTS5, confirmed available
  in node:sqlite). A `contracts_fts` virtual table is kept in sync on every
  upsert and back-filled on boot; the search body is built from names,
  parties, field values, uploaded text, accepted redlines, metadata and
  obligations — no client change needed. `GET /api/search` returns hits with
  `snippet()` previews (prefix MATCH, punctuation-sanitised, bm25-ranked),
  with a LIKE fallback if FTS were ever unavailable. The Register search box
  shows a live full-text dropdown with highlighted snippets in server mode.
- **E6-T2** — AI semantic search ("Ask your portfolio"): FTS gathers
  candidates, their text is sent to `POST /api/ai/search`, and Claude answers
  with quoted evidence per contract. Fallback: plain FTS results / a
  needs-key message.
- **E6-T3** — Template variables: `templateVars(tid)` exposes a named,
  Kenyan-defaulted variable set per template (counterparty, value, start/
  end dates, a template-specific primary field, payment terms) mapped onto
  the existing docBody fields.
- **E6-T4** — Guided creation wizard: pick a template → short form → a filled
  draft in under a minute. Role gating (`templateAllowedForRole`,
  `state.settings.templateRoles`) — viewers never create; Admin sees all;
  Legal sees all unless a template is restricted. Wired as "Guided setup" in
  the New-contract menu, which is itself now role-filtered.

**Tested.** Live server run: setup → create an upload with clause text →
FTS finds words *inside the body* ("temperature", "convenience") and by
party, with highlighted snippets; `/api/ai/search` returns needs-key
without a key. 8 client checks (template variables incl. NDA-no-value,
role gating for viewer/admin/legal + restriction, wizard form → filled
draft, guided-setup menu). E0 21-check regression green; no page errors.
Signing seal untouched.

**Definition of Done** — met: full-text search finds a phrase inside a
contract body; the wizard produces a filled supplier draft in under a
minute.

---

## E5 — Approval workflows & multi-signer signing

**Done** (new `js/approvals.js`)

- **E5-T1** — Rule-based approval builder in Settings: "IF condition THEN
  approver" rules with conditions (value ≥ threshold, folder, type contains,
  foreign governing law, playbook deviation present) and approvers (any
  Admin, any Legal, or a named member), each with an order for sequential
  chains (e.g. Finance then Legal). The legacy single spend-threshold is
  migrated into a default rule automatically.
- **E5-T2** — Approval run: `approvalState()` evaluates matching rules into
  an ordered chain, exposes the next pending step and whether the current
  user may approve it; signing is blocked until every step is approved. The
  workspace sign area shows the chain with per-step status and approve/
  reject controls. Rebuilds when the value changes (a redline/negotiation
  voids prior approvals).
- **E5-T3** — Multiple signers with order: a signer plan
  (`c.signerPlan[]`, internal or counterparty, sequenced). Internal signers
  sign in-app in turn; a counterparty turn points to the share link. The
  freeze + SHA-256 seal is applied only when the final signature lands, and
  every signer is recorded in `c.signatures` (so the evidence pack lists
  them all).
- **E5-T4** — Engagement tracking: a new `engagement` table logs every
  share-link open (time, IP, user-agent — server-side only, no third-party
  analytics); `GET /api/contracts/:id/engagement` feeds a "Counterparty
  activity" timeline in the workspace.

**Seal integrity.** Multi-signer only defers *when* the existing freeze +
`sealString` hash runs (to the last signer); the freeze/hash logic itself
is unchanged, and single-signer contracts seal exactly as before. E2's
pre-sign redline guard still runs.

**Tested.** 14 checks (legacy migration, ruleMatches for value/folder/
foreignLaw/deviation, two-step sequential chain build + approve + role-
gated next step, multi-signer nextSigner/allSigned) + a clean-session run
(add-rule editor → save → workspace approval panel + multi-signer link).
E0 21-check regression green; `/api/contracts/:id/engagement` auth-gated;
server boots with the additive `engagement` table; no page errors.

**Definition of Done** — met: a high-value contract with a deviation routes
through an ordered chain, collects signatures in order, evidence lists
every signer, and the activity timeline shows opens.

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
