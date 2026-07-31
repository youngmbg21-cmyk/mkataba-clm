# Work Order — View-Only Redline Sharing & Negotiation History

**Project:** HaTi (Mkataba CLM)
**Date:** 2026-07-31
**Status:** Approved for build — no code written yet
**Related docs:** `DESIGN-contract-sharing.md`, `DESIGN-rich-documents.md`, `RECON.md`, `SECURITY.md`, `CHECKLIST.md`

---

## What we are building, in one paragraph each

**Feature A — View-only redline share.** A third kind of share link (alongside today's "negotiate" and "sign" links) that lets the owner *or* the counterparty show the contract, with its redlines painted in, to an outside advisor. The advisor can look but cannot touch: no accept/reject, no editing, no comment threads, no internal notes. Read-only is enforced by the server, not by hiding buttons.

**Feature B — Negotiation History.** A per-contract "flight recorder playback": one filterable timeline screen and one exportable report that answers, a year from now, "who requested, accepted, or rejected what, when, and why." Almost all of this data is already captured (`c.changes[]`, `c.audit[]`, `c.versions[]`, the hash chain); this feature is assembly and presentation, plus a few small capture improvements (verified identity on counterparty decisions, decision reasons).

---

## Ground rules for the whole work order

1. **Server-side enforcement first.** Every restriction in Feature A must be checked in `server/server.js` before any UI work begins. Hiding a button is cosmetics; refusing the request is security.
2. **Strip before serve.** The viewer payload is built by an allow-list (start from nothing, add only what the viewer may see) — never by deleting fields from the full contract.
3. **No new architecture.** Reuse the `shares` table, the portal entry flow, the stored redline ops, and the existing audit/version/hash machinery. Additive-only migrations via the existing `addColumnIfMissing()` pattern.
4. **History is evidence.** Nothing in Feature B may rewrite, prune, or reorder existing records. The server's existing "re-merge dropped audit entries" defense (`server/server.js:1426-1435`) stays authoritative.
5. **Every work package ships with tests** following the house convention: `node --test test/*.test.js` unit/route tests plus a Playwright browser check where the change is visual (see `CHECKLIST.md` for the behavior → proving-test pattern).

---

## Phase 1 — View-only share link (Feature A)

### WP-1.1 New share purpose `view` with server-enforced read-only
**Size: Medium. Blocks everything else in Phase 1.**

- Extend the `shares` table `purpose` values from `negotiate | sign` to include `view`. No schema change needed beyond accepting the new value; audit every place `purpose` is read.
- `POST /api/shares` (create, ~`server/server.js:2865`): accept `purpose: 'view'` from authenticated editors. Validate expiry (default 30 days, owner can shorten/lengthen), optional OTP requirement, recipient name/email.
- **The lock:** every mutating share route — `respond`, `messages`, `payload` update, `template-values`, and any future ones — must check the token's purpose and return 403 for `view` tokens. Centralize this in one guard function so a future route can't forget it.
- `GET /api/shares/:token` (public, ~`server/server.js:3069`): for `view` tokens, return the **viewer payload** (WP-1.2), never the negotiate payload.

**Done when:** a `view` token can fetch the viewer payload; the same token sent to every mutating route gets 403; route tests prove both; creating a `view` share writes a `logAudit` entry on the contract ("View-only link created for <recipient> by <user>").

### WP-1.2 Viewer payload builder (allow-list)
**Size: Medium.**

- New server-side builder producing only: contract name, counterparty name, round number, "as of" date, the document body, and the redline ops needed to paint insertions/deletions (`hati-ins`/`hati-del` rendering from `js/redline.js`).
- **Explicitly excluded:** `c.comments[]`, `share_messages`, per-change `thread[]`, `note`, `needsReview*`, internal discussion (`discuss.js` content), contract value if `can_view_values` semantics say so, signatures panel, audit trail, versions list, and any other field not on the allow-list.
- Include change outcome status (accepted/rejected/pending) only as visual redline state — not the resolver names or reasons (those belong to Feature B, internal side).

**Done when:** a unit test serializes the viewer payload for a fixture contract with comments, threads, and notes, and asserts none of those strings appear anywhere in the payload.

### WP-1.3 Snapshot semantics
**Size: Small.**

- Decision (recommended and assumed here): **snapshot by default.** At link creation, capture the contract body + redline ops as of that moment (reuse `captureVersion()` / `share_payload_history` machinery) and serve that frozen copy for the life of the link.
- Show "As of <date>, Round <n>" prominently in the viewer (WP-1.4).
- Optional later toggle for "live" links — out of scope for this work order.

**Done when:** editing the contract after a view link is created does not change what the link shows; test proves it.

### WP-1.4 Viewer page (read-only portal)
**Size: Medium.**

- New render path in `js/views/portal.js` triggered when the fetched share has `purpose: 'view'` — same `#share=<token>` entry flow (`js/app.js:633-638`), different screen.
- Content: banner ("Read-only copy shared by <owner org> on <date> — Round <n>. You cannot edit or respond here."), contract body with redlines rendered via the existing `redlineOpsHtml()` / structured render helpers, nothing else.
- No contenteditable anywhere on this screen; no accept/reject/comment UI is ever rendered (defense in depth on top of WP-1.1's server lock).
- Light diagonal watermark with the recipient email (when known) or "CONFIDENTIAL — VIEW ONLY".
- Print stylesheet so "print to PDF" from the browser produces a clean copy (this is the advisor's likely workflow).

**Done when:** Playwright check opens a view link, asserts redline marks are visible, asserts no editable surface / no action buttons exist in the DOM, and asserts the banner text.

### WP-1.5 Lifecycle: expiry, revoke, OTP, open-tracking
**Size: Small (mostly wiring existing pieces).**

- Expiry: reuse `expires_at`; expired view links show a polite "this link has expired — ask the sender for a fresh one" page.
- Revoke: reuse `/api/shares/:token/revoke`; surface view links in the owner's existing shares overview UI with a revoke button and status (sent / opened / expired / revoked).
- OTP: reuse `share_otp` flow as an owner-chosen toggle at creation ("Require email verification").
- Engagement: every open of a view link writes to the `engagement` table (kind, timestamp, ip/ua) and stamps `first_opened_at`, so the owner sees "opened Tuesday 3pm".

**Done when:** overview lists view links with live status; revoked and expired tokens get the friendly denial page; opens appear in engagement; tests cover expiry and revocation paths.

### WP-1.6 Counterparty-minted view links (derived tickets)
**Size: Medium. Can ship after 1.1–1.5.**

- A holder of a valid `negotiate` token may create a `view` token for the same contract — a strictly weaker ticket derived from theirs. New public route on the negotiate token (e.g. share-scoped "create view link"), rate-limited, recorded with `created_by = share:<parent token>` and logged to the contract audit trail ("Counterparty created a view-only link for <recipient>").
- The derived link inherits the parent's expiry ceiling (can be shorter, never longer) and dies automatically if the parent negotiate link is revoked.
- Owner sees counterparty-minted links in the shares overview and can revoke them.

**Done when:** derivation works only from a live negotiate token; revoking the parent kills the child; owner can see and revoke child links; all proven by route tests.

---

## Phase 2 — Negotiation History (Feature B)

### WP-2.1 History timeline screen
**Size: Large. The centerpiece.**

- New internal view (owner side, all logged-in roles including `viewer` — it's read-only by nature) reachable from the contract screen: one chronological timeline assembled from `c.changes[]` (including archived rounds under `c.negotiation.rounds`), `c.audit[]`, `c.versions[]`, and share lifecycle events.
- Each change entry shows: round, date, clause label, proposer + side, exact before/after text (rendered as a redline), outcome, resolver + side, resolution date, stated reason, and links to any per-change thread (internal eyes only).
- Filters: by clause, by person, by side, by round, by outcome (accepted / rejected / pending / withdrawn). Filters combine.
- Plain-language event sentences ("Jane (counterparty) proposed…", "Rejected by David on…") — the screen should read like a story, not a log dump.

**Done when:** a fixture contract with multi-round history renders a complete, correctly ordered timeline; each filter is proven by test; Playwright check confirms the screen renders and filters.

### WP-2.2 Verified identity stamped onto counterparty decisions
**Size: Small–Medium. Capture improvement — do early so history accrues.**

- When a counterparty acts through an OTP-verified share link, stamp the verified email onto the resulting records: the change's `author` / `resolvedBy` fields and the audit entries, e.g. "jane@acme.com (email-verified)".
- When the link was not OTP-verified, stamp honestly: "link holder (unverified) — <recipient email on link>". Never claim verification that didn't happen.
- Add an owner-side setting/nudge: "Require email verification for negotiation links on this contract."

**Done when:** decisions made through a verified link carry the verified email in `resolvedBy`/audit; unverified decisions are labeled unverified; tests cover both paths.

### WP-2.3 Decision-reason nudge
**Size: Small.**

- On reject (and optionally accept), the resolve UI prompts: "Add a note explaining why (recommended)". Never mandatory — friction kills adoption — but the field is front and center, and the stored reason lands on the change record (existing `note`/`reply` fields) and in the timeline.

**Done when:** a reason entered at resolve time appears on the change record and in the WP-2.1 timeline.

### WP-2.4 Exportable history report
**Size: Medium.**

- "Export history" button on the timeline screen producing a self-contained document for people with no HaTi login (auditor, counsel, court).
- Format: print-optimized HTML (browser print-to-PDF), consistent with the app's zero-dependency stance; optionally a DOCX flavor later via the existing hand-rolled `js/docx.js` machinery.
- Contents: contract identity header, party names, full ordered timeline (same data as WP-2.1, all filters off), each change as a rendered redline, resolver identities with verification labels, and an integrity statement (WP-2.5 result + generation timestamp + contract hash/seal).

**Done when:** export of the fixture contract produces a complete standalone report; a test asserts every change and decision appears in it.

### WP-2.5 "Verify integrity" surfaced
**Size: Small.**

- Button on the timeline screen running the existing `verifyChangeChain()` and seal checks, displaying "✓ Record verified — no entries altered since creation" or a clear failure with the first broken link identified.
- The export report (WP-2.4) embeds the verification result and when it was run.

**Done when:** an untampered fixture verifies green; a deliberately tampered fixture (test-only) reports the break; both proven by test.

---

## Phase 3 — Hardening and release

### WP-3.1 Security review pass
**Size: Small–Medium.**

- Adversarial route testing: replay every mutating route with a `view` token, an expired token, a revoked token, and a forged token; all must fail closed.
- Confirm the viewer payload leaks nothing (re-run WP-1.2's exclusion test against the *real* route, not just the builder).
- Rate-limit token-guessing and derived-link creation.
- Update `SECURITY.md` with the new share purpose and its guarantees.

### WP-3.2 Documentation and checklist
**Size: Small.**

- Add behaviors → proving-tests entries to `CHECKLIST.md` for every "Done when" above.
- Update `DESIGN-contract-sharing.md` with the `view` purpose and derived-ticket rules; short user-facing help text for the share dialog.

### WP-3.3 Rollout
**Size: Small.**

- Ship Phase 1 first (WP-1.1 → 1.5), then WP-2.2 (so trustworthy identity starts accruing immediately), then the rest of Phase 2, then WP-1.6.
- Deploy via existing Render pipeline; migrations are additive-only, so no downtime and rollback is safe.

---

## Build order and dependencies (summary)

| Order | Work package | Depends on | Size |
|---|---|---|---|
| 1 | WP-1.1 Server-enforced `view` purpose | — | M |
| 2 | WP-1.2 Viewer payload allow-list | 1.1 | M |
| 3 | WP-1.3 Snapshot semantics | 1.2 | S |
| 4 | WP-1.4 Viewer page | 1.2 | M |
| 5 | WP-1.5 Expiry / revoke / OTP / tracking | 1.1 | S |
| 6 | WP-2.2 Verified identity on decisions | — (parallel-safe) | S–M |
| 7 | WP-2.3 Decision-reason nudge | — | S |
| 8 | WP-2.1 History timeline screen | 2.2, 2.3 helpful | L |
| 9 | WP-2.5 Verify-integrity button | 2.1 | S |
| 10 | WP-2.4 Exportable report | 2.1, 2.5 | M |
| 11 | WP-1.6 Counterparty-minted view links | 1.1–1.5 | M |
| 12 | WP-3.1–3.3 Hardening, docs, rollout | all | S–M |

## Decisions taken in this work order (flag if you disagree)

1. View links show a **snapshot**, not the live contract.
2. The advisor has **no feedback channel inside HaTi** in v1 (input returns via the sharer, outside the system).
3. Decision reasons are **encouraged, never mandatory**.
4. Export format is **print-optimized HTML → PDF** first; DOCX later.
5. Counterparty-minted links (WP-1.6) ship **after** the core view link, not with it.

## Out of scope

- Live-updating view links; advisor commenting/suggestion mode; multi-tenancy changes; any modification to the negotiate or sign flows beyond identity stamping (WP-2.2).
