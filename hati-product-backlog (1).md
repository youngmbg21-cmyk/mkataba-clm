# HaTi (mkataba-clm) — Product Backlog for Claude Code

**Purpose:** This backlog upgrades HaTi from MVP to a best-in-class CLM for the Kenyan market, closing the gap with Oneflow / Juro / Ironclad on the features that matter, while protecting HaTi's differentiators (Kenya templates, sealed signing, no-login counterparty portal).

**How to use:** Work through epics in order (E0 → E8). Within an epic, complete tasks top to bottom. One epic per overnight session unless tasks are trivially small. Do not start a new epic if the previous epic's Definition of Done is not met.

---

## Global guardrails (apply to every session)

1. **Never weaken the signing seal.** The SHA-256 freeze-and-seal logic, frozen-copy rendering, audit trail, and evidence pack are the product's trust core. Any change touching signing must keep existing seals verifiable. If a task risks this, stop and leave a note instead.
2. **Both modes must keep working.** Server mode (Express + node:sqlite) is primary; static mode (localStorage) must not crash. If a new feature is server-only, degrade gracefully in static mode with a clear "requires server mode" notice.
3. **No new build step.** Keep the vanilla JS + Tailwind CDN, no-bundler approach. Modularization (E0) uses native ES modules only.
4. **No paid dependencies, no native npm dependencies.** Node ≥ 22.5 built-ins preferred.
5. **AI calls go through the existing server-side Anthropic proxy.** Never put the API key in the browser. Every AI feature must have a graceful fallback when no key is set.
6. **Migrations are additive.** New SQLite columns/tables only; never drop or rewrite existing contract data. Write a migration that runs safely on an existing database.
7. **Testing before commit.** Start the server, create a workspace with the 30-contract sample portfolio, and manually exercise the changed feature via the API (curl) plus a smoke check of the affected screens. All 30 sample contracts must still load.
8. **Commit convention:** one commit per task, message format `E{n}-T{n}: short description`. Leave a `SESSION-NOTES.md` entry at repo root summarizing what was done, what was tested, and anything skipped.
9. **Deferred — do not build yet:** mobile-optimized counterparty portal / WhatsApp share flow, Swahili UI, IPRS identity checks, CAK-accredited PKI, M-Pesa billing integration. These are listed at the end for context only.

---

## E0 — Modularize the frontend (prerequisite)

**Why:** `index.html` currently contains the entire frontend. Redlining, playbooks, and workflows will make it unmanageable and make overnight sessions risky (every edit touches everything). Split it so future sessions can work on one area safely.

- **E0-T1.** Extract the "platform core" (storage/auth/mode detection) from `index.html` into `js/core.js` as a native ES module. `index.html` imports it. Zero behavior change.
- **E0-T2.** Extract each primary view into its own module: `js/views/home.js`, `js/views/register.js`, `js/views/queue.js`, `js/views/intelligence.js`, `js/views/settings.js`, `js/views/contract.js` (the contract workspace), `js/views/portal.js` (counterparty portal). Zero behavior change.
- **E0-T3.** Extract shared pieces: `js/components.js` (modals, toasts, tables), `js/api.js` (all fetch calls), `js/templates.js` (Kenyan contract templates), `js/ai.js` (AI scan rules + AI proxy calls).
- **E0-T4.** Static-mode check: opening `index.html` directly must still work. If ES modules break `file://` opening, document that static mode now needs `python3 -m http.server` and update README.

**Definition of Done:** App works identically in server mode; all views render; sample portfolio loads; signing and counterparty share still work end to end.

---

## E1 — AI metadata extraction on upload ("file it for me")

**Why:** Best-in-class platforms (Juro AI Extract, Oneflow AI) auto-extract structured data from uploaded contracts so nobody manually tags a portfolio. HaTi already extracts PDF text client-side and has a Claude proxy — connect the two.

- **E1-T1.** Add a `metadata` concept to contracts (new SQLite columns or a JSON column): counterparty name, contract type, effective date, expiry date, contract value + currency, renewal type (auto-renew / fixed / evergreen), notice period days, governing law, payment terms.
- **E1-T2.** On upload of a received contract, after text extraction, call Claude via the server proxy with a strict JSON-only prompt to extract the fields above, each with a confidence level (high/medium/low). Fallback without an API key: regex/heuristic extraction for dates and obvious values, everything else left blank.
- **E1-T3.** Show a "Review extracted details" confirmation panel before saving — every field editable, low-confidence fields visually flagged. The human always confirms; AI never silently writes metadata.
- **E1-T4.** Use the metadata everywhere: Register gets sortable/filterable columns for expiry, value, counterparty, renewal type; Home KPI ribbon uses real values; folder auto-suggestion based on contract type.
- **E1-T5.** Backfill tool: an admin action "Extract metadata for existing contracts" that runs the same extraction over already-uploaded contracts, one at a time, with the same confirmation step queued for review.

**Definition of Done:** Upload a sample PDF → confirm extracted fields → contract appears in Register with correct expiry/value; filters work; no key = heuristic fallback works.

---

## E2 — Versioning + in-document redlining

**Why:** This is the single biggest gap vs Oneflow/Juro/Ironclad. Change-requests-with-counters is comments; the market standard is tracked edits in the document with accept/reject and version compare.

- **E2-T1.** Contract versions as first-class records: every save of a draft creates a numbered version (author, timestamp). List versions in the contract workspace.
- **E2-T2.** Version compare view: pick any two versions → side-by-side or inline diff with additions highlighted green, deletions struck-through red. Implement a word-level diff in vanilla JS (no heavy libraries; a small self-written LCS diff is fine).
- **E2-T3.** Counterparty redlining in the share portal: instead of (or in addition to) structured change requests, the counterparty can propose text edits to specific clauses. Their proposal is stored as a "proposed version," never overwriting the owner's draft.
- **E2-T4.** Owner review screen: see each proposed edit in diff form, Accept / Reject / Modify per edit. Accepting creates a new version attributed to the negotiation round. Every round remains archived (extend the existing negotiation archive).
- **E2-T5.** Guard rail: signing always seals the latest accepted version; the frozen-copy logic is untouched. Add a pre-sign check that there are no unresolved proposed edits (warn, allow override by Admin/Legal).

**Definition of Done:** Full loop works: owner drafts → shares → counterparty proposes edits → owner accepts some, rejects others → version history shows every round → sign → seal verifies.

---

## E3 — Renewal calendar & obligation management

**Why:** Reminders exist (90/60/30) but leaders treat renewals/obligations as a workflow: calendar view of lifecycle events, extracted obligations turned into assignable tasks. For a Kenyan CFO, "never miss a notice deadline" is the strongest pitch.

- **E3-T1.** New **Calendar** view (add to the icon rail): month grid + agenda list showing expiries, auto-renewal decision deadlines (expiry minus notice period, from E1 metadata), and obligation due dates. Click-through to the contract.
- **E3-T2.** Obligations as records: per contract, a list of obligations (description, due date, recurring or one-off, assigned member, status open/done/overdue). Manual add/edit UI in the contract workspace.
- **E3-T3.** AI obligation extraction: for uploaded/received contracts, a "Find obligations" action that sends the text to Claude and proposes obligations (payment milestones, notice deadlines, deliverables, reporting duties) with clause quotes — human confirms before saving. Fallback without key: skip with notice.
- **E3-T4.** Wire obligations and renewal decision dates into the existing reminder email system and the Home "Attention" snapshot ("3 obligations overdue, 2 renewal decisions due in 30 days").
- **E3-T5.** Register filter presets / saved views: "Expiring in 90 days," "Auto-renewing soon," "Overdue obligations."

**Definition of Done:** Calendar shows sample-portfolio events; an obligation assigned to a member appears in Attention and triggers a reminder in the outbox; saved views filter correctly.

---

## E4 — Kenya playbook engine + clause library

**Why:** The frontier feature (Ironclad Jurist-style): review incoming paper against *your* preferred and fallback positions, not just generic rules. A pre-built Kenya FMCG playbook combines HaTi's local moat with the AI trend. This upgrades the existing rule-engine scan.

- **E4-T1.** Clause library: a managed list of standard clauses (name, category, preferred wording, fallback wording, guidance note), seeded from the existing Kenyan templates. Admin/Legal can add and edit. "Insert clause" action in the contract editor.
- **E4-T2.** Playbook data model: per contract type, a set of positions — for each clause category: required/forbidden/preferred, acceptable ranges (e.g., payment terms ≤ 45 days, liability cap ≥ 12 months' fees), escalation flag (deviation requires Legal approval).
- **E4-T3.** Ship a seeded **Kenya FMCG playbook** covering the six value streams in the sample portfolio (supply, co-packing, warehousing/cold-chain, distribution, retail listing, marketing, NDA, lease, professional services), including existing Kenya-specific checks (stamp duty, foreign governing law, data protection/ODPC).
- **E4-T4.** AI playbook review: replace/augment the current AI review checklist — send document text + relevant playbook to Claude; output per-clause verdicts (aligned / deviation / missing) with the clause quoted verbatim, the playbook position, and a suggested redline in HaTi's preferred wording. Human applies suggestions via E2's version mechanism. Fallback without key: current rule engine, relabeled as "basic scan."
- **E4-T5.** Deviation report on the contract: a summary panel ("2 deviations, 1 missing clause") that feeds the approval gate (see E5) and the Home attention snapshot.

**Definition of Done:** Upload a sample supplier contract → playbook review lists aligned/deviating/missing clauses with quotes → one suggested redline can be applied as a new version.

---

## E5 — Approval workflows & multi-signer signing

**Why:** One spend threshold is not enough. Real orgs need conditional routing and multiple signers in sequence — both are table stakes in Oneflow.

- **E5-T1.** Rule-based approval builder in Team & Settings: simple "IF condition THEN approver" rules. Conditions available: contract value threshold, contract type, folder, foreign governing law flag, playbook deviation present (from E4). Approvers: named member or role. Support sequential chains (Finance then Legal).
- **E5-T2.** Approval run: when a contract moves toward signing, evaluate rules, create an approval chain, notify approvers (existing email system), show chain status on the contract (pending/approved/rejected per step, with comments). Signing is blocked until the chain completes; keep the existing spend gate as a migrated default rule.
- **E5-T3.** Multiple signers per side with signing order: define signers (internal members and/or counterparty contacts) and their sequence. Each counterparty signer gets their own one-time share/OTP flow; the seal is applied once when the final signature lands, and the evidence pack lists every signer with identity/method/time/IP.
- **E5-T4.** Engagement tracking on share links: log every open (timestamp, user-agent, IP) and show a "Counterparty activity" timeline on the contract ("Opened 3 times, last viewed yesterday 14:32"). No third-party analytics; server-side logging only.

**Definition of Done:** A contract over the threshold with a playbook deviation routes Finance → Legal, then collects two counterparty signatures in order; evidence pack shows both; activity timeline shows opens.

---

## E6 — Search, templates & self-serve creation

**Why:** Makes the repository usable at scale and lets non-legal users self-serve — how CLMs free up legal teams.

- **E6-T1.** Server-side full-text search across contract bodies and metadata (SQLite FTS5). Register search box upgrades from filter-only to full-text with snippet previews.
- **E6-T2.** AI semantic search ("Ask your portfolio"): a search-bar mode that sends the question plus candidate FTS matches to Claude to answer questions like "which contracts let the counterparty terminate without cause?" — returns contract list with quoted evidence. Fallback: plain FTS results.
- **E6-T3.** Template variables: mark fields in the Kenyan templates as variables ({{counterparty_name}}, {{contract_value}}, {{start_date}}, {{duration}}, {{payment_terms}}). Rendering fills them in.
- **E6-T4.** Guided creation ("New contract" wizard): pick a template → answer a short form (the variables, with sensible Kenyan defaults) → get a completed draft. Viewer role still cannot create; Admin/Legal can mark which templates are open to which roles.

**Definition of Done:** Full-text search finds a phrase inside a sample contract body; the wizard produces a filled supplier agreement draft in under a minute.

---

## E7 — Analytics & reporting

**Why:** Leaders surface cycle times, bottlenecks, and portfolio value. HaTi has KPI tiles; this makes them decision-grade.

- **E7-T1.** Event log for lifecycle transitions (created, sent, first counterparty open, negotiation rounds, approved, signed) — reuse audit trail entries where they exist.
- **E7-T2.** Analytics panel on Home (or a Reports tab): average cycle time draft→signed, time stuck per stage, negotiation rounds per contract type, portfolio value by folder/counterparty, renewal pipeline value next 12 months. SQL aggregates only; keep it fast at 1,200+ contracts.
- **E7-T3.** CSV export of any analytics table (reuse the existing bulk CSV export machinery).

**Definition of Done:** Reports render from the sample portfolio in under a second and export to CSV.

---

## E8 — Commercial hardening (server-side, no billing yet)

**Why:** Pre-revenue must-fixes already acknowledged in SECURITY.md. Billing/M-Pesa and multi-tenant SaaS packaging need human decisions — prepare the ground, don't finish it autonomously.

- **E8-T1.** Rate limiting on auth, OTP, and share endpoints (simple in-memory or SQLite-backed counters; no new dependencies).
- **E8-T2.** Security headers + HTTPS-readiness: helmet-style headers hand-rolled, secure cookie flags behind a `TRUST_PROXY`/`HTTPS=true` env var, and a `DEPLOYMENT.md` describing running behind Caddy/nginx with TLS.
- **E8-T3.** Session hardening: session expiry + rotation on login, and an "Active sessions" list with revoke in Team & Settings.
- **E8-T4.** Backup/export: admin action to download a full workspace export (contracts, versions, files, audit trails) as a zip; document restore.
- **E8-T5.** Groundwork only for multi-tenancy: add `organization_id` scoping to all queries if not already strict, and write `MULTITENANCY-NOTES.md` describing what remains. **Do not** build signup-for-multiple-orgs or billing.

**Definition of Done:** Brute-force attempts get throttled; deployment doc exists; workspace export restores cleanly on a fresh server.

---

## Deferred (do NOT build in overnight sessions)

- Mobile-optimized counterparty portal + WhatsApp-friendly share flow *(owner will schedule separately)*
- Swahili UI toggle
- IPRS identity verification; CAK-accredited PKI signatures
- M-Pesa / card billing (Pesapal / Flutterwave) and public multi-tenant signup
- Third-party integrations (CRM, Slack, ERP) — revisit after E1–E6 land
