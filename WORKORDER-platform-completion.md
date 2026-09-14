# WORK ORDER — Platform completion (written 14 September 2026)

The owner asked for an audit of where HaTi is still incomplete as a platform,
and for the gaps to become work orders inside the launch plan. This file is
the work orders. The plan, with these slotted into phases and a timeline, is
the "HaTi Launch Planner" artifact; docs/LAUNCH-PLAN.md is its text copy.

Nothing here is coded until the owner names a work order in a session.

## How the audit was done

Thirteen capabilities — the spine (Request, Draft, Negotiate, Approve, Sign,
Store, Perform, Report) and the platform layer (People and access, Data and
operations, Notifications, Integrations, the Phone) — were each checked IN
THE CODE by six parallel readers, one per area, looking for routes, functions
and views, never trusting a document. One claim was found wrong on
verification (that the built-in templates create an empty document; they do
not — the clause builders live in js/views/contract.js) and was dropped.

## What "complete" means for one capability (the definition every work order is held to)

- Works for our own paper, their paper, and an uploaded already-signed contract.
- Works for every seat: admin, editor, viewer, and the counterparty where the act reaches them.
- Works on the desktop shell and on the phone shell.
- The server refuses what the screen refuses (THE SERVER IS THE WALL).
- Every act leaves a line in the record (audit trail, or the workspace log).
- There is a way back on the same screen.
- One browser test walks it, and fails at the parent commit.
- The summary to the owner is plain English with no file paths.

## The three tiers

- Tier 1 — dead ends on the spine. A pilot will walk into these. Built before any pilot. 12 work orders, 21 sessions.
- Tier 2 — what a paying customer expects. Built beside the pilots, ordered by their feedback. 14 work orders, 33 sessions.
- Tier 3 — parity and scale. After revenue. 11 work orders, 28 sessions, plus multi-tenancy, billing, sign-up, an outside audit and the design ladder.

A session is an evening plus the overnight run it starts.

---

## TIER 1 — Complete the spine

### WO-01 A returned round is announced (Negotiate, 1 session)
THE GAP. When the other side sends changes or decisions back, no email goes to anyone (`responseIsWorthEmail` answers false for `changes` and `decisions` on purpose). The owner only finds out by opening HaTi; a desk lead who is away for a week learns nothing.
BUILD. An email to the contract owner and the desk lead (where the desk rule is on), in the recipient's language, carrying the round line `negoRoundLine` already prints on the alert row, and a link built by `contractUrl` that opens the negotiation. One send per round, deduped on the reminders table like every other scheduled mail. Nothing new on the page.
DONE MEANS. Send a round from a test counterparty link; the owner's inbox has the mail within a minute; its link opens the negotiation on the right contract.
TESTS. A server test off `startMailStub`; round-delivery-verify gains the mail.

### WO-02 Approvals are enforced on the server, and approvers are told (Approve, 2 sessions)
THE GAP. `signBlockers` asks the approval chain in the browser; `server/server.js` never does (grep `approvalChain|approvalState` finds nothing there). A raw `PUT /api/contracts/:id` can add a signature and seal with a refused or unfinished chain, and `POST /api/shares/:token/respond` lets the counterparty sign in the same state. No approval email exists; `runReminders` has no approval branch; `approveContract` toasts "next approver notified" and sends nothing.
BUILD. A server twin of `buildApprovalChain` / `approvalState` (reads rules off stored settings, value through the stored currency, the overseer step last) asked as a DIFFERENCE at both signing doors, mirroring `signCapOn` / `signCheckRefusal`. An email when a step becomes a member's (address from the users row, never the body). A reminder branch on day 3 keyed on the reminders table. The toast says what happened.
DONE MEANS. `sim-d-server-attacks.audit.js` gains "sign with an open chain" and reports it refused; an approver receives the mail; the day-3 reminder fires once.
TESTS. The attack file; a server test; f-file for the toast wording.

### WO-03 Expired, terminated and renewed are real (Perform, 2 sessions)
THE GAP. "Expired" is derived in the browser (`contractExpired`); no sweep writes it, so the database, `GET /api/contracts?status=`, the CSV export and webhooks still say Signed. `Terminated` and `Renewed` appear nowhere. Auto-renewal never moves the expiry forward. An editor can move Under Review back to Draft mid-approval with nothing refusing it.
BUILD. A server sweep beside `runReminders` that writes `status:'Expired'` off `effectiveExpiry` (the shared `effExpiryReader`) with an audit line. A Terminate act (effective date, reason, who, notice served, optional letter from the notice period already extracted), refused on a record under legal hold once WO-23 exists. Auto-renewal roll-forward: where `renewalType` is auto and the notice window has passed, the term moves one period with an audit line and the renewal reminder resets. A status machine: no backwards move while a chain is open. Who may terminate is the owner's decision (see Decisions).
DONE MEANS. A lapsed contract reads Expired in the CSV export; a terminated one shows its date and reason on the head; an auto-renewing one moves its expiry with a line in History.
TESTS. Server sweep test; f-file for the status machine; the register chip.

### WO-04 Obligations on the phone (Perform, 2 sessions)
THE GAP. Reminder emails land on a phone that has no obligations screen: `js/mobile-contract.js` draws doc / terms / hist only, `mNeedsYou` has no obligation row, `M_VIEW_FOR_SCREEN` has no obligations view.
BUILD. An Obligations tab on the phone's contract and a row in the phone's "needs you", both BORROWING `obState`, `obligationBand`, `obligationOwner`, and pressing `toggleObligation` / `obligationMarkDone`. The phone files nothing of its own.
DONE MEANS. Tick an obligation done on a phone; the desktop shows it done with the same completedAt and completedBy.
TESTS. phone-verify gains the tab; f-file greps the mobile files for no `changes.push`.

### WO-05 Value streams live on the server (Store, 1 session)
THE GAP. `addCustomFolder` → `saveCustomFolders` writes `localStorage['hati.v1.folders']`; colleagues never see the stream, and folder-access grants can name an id other browsers do not know.
BUILD. A `folders` setting with its own atomic route (`PUT /api/settings/folders`, admin), the pattern `folder-access` already uses; the built-ins stay literals; the panel's "per-browser" line goes.
DONE MEANS. A stream created on one laptop appears on another sign-in and in the register filter.
TESTS. f-file; settings-tabs-verify.

### WO-06 Invite by email; deactivate a member (People, 2 sessions)
THE GAP. `POST /api/users` needs the admin to type an 8-character password and hand it over. `DELETE /api/users/:id` hard-deletes the row and leaves `c.owner`, `reviewerId`, `overseerId`, `folderAccess` and `signFolders.by` naming somebody who is gone.
BUILD. An invite token mailed to the address (30-minute style like password reset), the person sets their first password. A `status:'suspended'` on the users row that refuses sign-in and drops sessions. A "hand their contracts to X" step in the drawer (owner moved, audit line per contract). Dangling reviewer/overseer/access references cleared on suspend and on delete. The directory shows suspended people greyed.
DONE MEANS. Invite a test address and they set their own password; suspend them; their contracts show a new owner; no approval rule names them.
TESTS. Server tests for invite and suspend; settings-tabs-verify.

### WO-07 Restore a backup onto a server (Data, 2 sessions)
THE GAP. `GET /api/export/workspace.zip` exists; no import exists in server mode (`bk-import` is local-mode only). Recovery is copying `hati.db` by hand.
BUILD. `POST /api/import/workspace` (admin, only on an EMPTY server or with an explicit replace flag) reading the zip HaTi wrote: contracts, files, users (password hashes re-issued as invites), settings. The go-live checklist gains "restore drilled on".
DONE MEANS. Export from one server, restore onto a fresh one, open a contract with its files and audit trail.
TESTS. A server test that round-trips a seeded workspace.

### WO-08 The other side can return a file and bring a colleague (Negotiate, 2 sessions)
THE GAP. `js/views/portal.js` has no document upload; the returned .docx path is the owner's own import modal. `POST /api/shares/:token/derive-view` mints `purpose:'view'` only, so their colleague is always read-only.
BUILD. An upload on their page (docx / pdf) that goes through `negoImportReturnedDocx`'s reading on the server side of the share and files through `negoFileProposal`, with the guest identity recorded as it is for typed proposals. A "bring a colleague" that mints a second negotiate seat on the same link (their own email code, their own name on every filing), listed on the owner's engagement card.
DONE MEANS. On a test link, upload a .docx and see the redlines filed under the guest's name; invite a second address and comment from it.
TESTS. sim-f-word-import.audit.js gains the portal path; portal-header-verbs-verify.

### WO-09 Duplicate a contract (Draft, 1 session)
THE GAP. No `duplicateContract` anywhere; only a template can be duplicated.
BUILD. One act in the room's More menu and the register's row acts: copies wording, key terms, party, counterparty, stream and letterhead into a new Draft with a new reference; carries no signatures, no negotiation, no obligations' completion, no audit; registers with `roomOpenOnTerms` (an eighth creation site — f170 gains it by name).
DONE MEANS. Duplicate a signed contract; a new Draft opens on Key terms with a new reference and no signatures.
TESTS. f170; a new f-file.

### WO-10 Related documents on a contract (Store, 2 sessions)
THE GAP. `POST /api/files` and `c.documents[]` exist; the only writer is `attachPaperSignature`. No UI attaches a PO, a certificate, a notice letter.
BUILD. A Documents card on the Key terms side column (below the family card): attach (type allow-list, per-file cap, the storage ceiling asked), list with who and when, open, remove (refused on a sealed record's frozen copy; the sealed copy itself never changes). `fileInScope` already authorises reads. Never travels to the counterparty.
DONE MEANS. Attach a PDF to a signed contract, see it in the list, download it from another sign-in.
TESTS. Server tests; a browser file for the card.

### WO-11 Bulk actions and the export door (Store, 2 sessions)
THE GAP. The Contracts table has no selection column (`REG_STATE_DEF.sel` exists, unused); `GET /api/export/contracts.csv` has no button anywhere; `regExportCsv` has no caller.
BUILD. A selection column with select-all-on-page; archive, re-stream (admin, through the same server difference guard as `wireKtFolder`), re-owner, export selected; the CSV door back in the page acts. Every bulk act writes one audit line per contract.
DONE MEANS. Select five contracts, move them to a stream, export them as CSV.
TESTS. contracts-page-verify; f-file for the guard.

### WO-12 A workspace audit log (People, 2 sessions)
THE GAP. Role changes, folder access, sign caps, member removal, settings edits, webhook creation and exports are written nowhere.
BUILD. One append-only `workspace_log` table (who, what, target, before/after where small, when, IP) written by every admin route; a read-only page under Settings → Platform with filters and CSV export; nothing on the phone in v1.0.
DONE MEANS. Change a role; the log shows who, what, when; the row cannot be edited or deleted through any route.
TESTS. Server tests; settings-tabs-verify.

---

## TIER 2 — Finish the platform

### WO-13 The counterparty is a record (Store, 4 sessions)
THE GAP. `contracts.counterparty` is a text column; no address, registration number or contacts; "Naivas Ltd" and "Naivas Limited" are two parties; `normParty` is used only during import.
BUILD. A `parties` table (name, aliases, registration number, address, contacts); a merge act; a party page (every contract, exposure through `fxHome`, on-time history); the graph's party hub, the signer route and the share dialog read it; the register filters by it. Existing contracts link by folded name with a review list for the ambiguous ones.
DONE MEANS. Open a party page and see its contracts and total value; merge two spellings into one and see both contracts under it.

### WO-14 Proof that travels (Sign, 3 sessions)
THE GAP. `downloadEvidence` is a JSON file reachable only inside the workspace; no server verify route exists; no certificate of completion; the signer never receives a copy.
BUILD. A PDF evidence pack and certificate (each signer, code verified, IP, device, assurance rung, seal, timestamps in the signer's clock); `GET /verify/:hash` public, no login, answering only "this seal is known and unbroken"; the signer's completion mail carries the certificate.
DONE MEANS. A stranger holding the PDF verifies it on the public page without logging in.

### WO-15 Signing verbs: decline a step, chase a signer, sign in any order (Sign, 2 sessions)
THE GAP. An internal signer has no decline; `runShareNudges` nudges once and only where the link was never opened; the route is strictly sequential.
BUILD. Decline-a-step with a reason (recorded on the row, the owner told, the round not ended); chase-a-signer (like the obligation chase, address off the stored route); a parallel group in the route editor, honoured by `signerTurn`.
DONE MEANS. On a test route: decline a step, chase a stalled signer, and two parallel signers finish in either order, each act with its audit line.

### WO-16 Approval verbs: send, delegate, any-one-of (Approve, 2 sessions)
THE GAP. No delegation code; no explicit send-for-approval act; one approver per step.
BUILD. Delegate or alternate (recorded, both names on the chain); a Send for approval act that shows the chain and tells the first approver (rides WO-02's mail); an "any one of" step.
DONE MEANS. Delegate a step to a colleague on leave; they approve; the chain shows both names.

### WO-17 Notifications a person controls (Notify, 2 sessions)
THE GAP. `PUT /api/me/prefs` accepts three switches; no per-kind opt-out, no follow, no dismiss or snooze (no `dismissAlert` exists); renewal mail goes to all admins, not `c.owner`.
BUILD. Per-kind preferences on the You tab; follow/unfollow a contract; read and snooze state on the bell (per person, on the server); owner-first routing for renewal mail with admins as fallback.
DONE MEANS. A member turns off obligation mail and receives none; the owner alone gets the renewal mail; a dismissed alert stays dismissed on another device.

### WO-18 Saved views, tags, and searching the wording (Store, 2 sessions)
THE GAP. `REG_VIEWS` is seven fixed filters; no tags; FTS is palette-only (8 hits) and cannot be filtered, sorted or exported.
BUILD. Named saved views (own and shared, on the server); `tags[]` on a contract with a filter; a search mode on the Contracts page that runs `GET /api/search` and hands the ids to `regShowOnly` so every filter, sort and export applies.
DONE MEANS. Search a phrase, narrow by stream, tag the results, export the list.

### WO-19 The editor can do what Word can (Draft, 2 sessions)
THE GAP. No table, image, heading or alignment on the writing bar (`insertTable` does not exist; IMG is dropped by the sanitiser); the .docx writer carries no header, footer or image; page size and margins are literals in `DOCX_SECT`.
BUILD. The four tools on `RICH_BAR_TOOLS` (image through the files table, sized, allowed by the sanitiser as a src on our own route only); headers, footers and images in `docxExportTracked`; page setup on the design step.
DONE MEANS. Insert a table and a logo, export to Word, open it and see both under the letterhead.

### WO-20 Their Word file comes back with its tracked changes (Negotiate, 4 sessions)
THE GAP. `negoImportReturnedDocx` uses `docxExtract` (final text), re-diffs against our baseline, matches clauses by position as a fallback; authorship, dates and formatting are lost.
BUILD. Read `w:ins`/`w:del` with author and date through `docxExtractRich`; file each as an ask in the author's name with its date; match clauses by stamped id, then heading, before position; keep tables and levels through the rich path; comments as today.
DONE MEANS. A file with two tracked edits and a comment imports as two asks in their names, with the comment attached and the table intact.

### WO-21 The reports people ask for (Report, 2 sessions)
THE GAP. No expiring-in-90-days list export, no contracts by counterparty, no on-time by owner, no cycle time by type, no approval turnaround; `wkSnapshots` and `hati.v1.monthlySnaps` live in localStorage; no disclaimer on the health report, weekly review or monthly mail.
BUILD. The five reports with CSV export on the Reports page; snapshots in a server table with a backfill; approval timings recorded from WO-02 on; the "not legal advice" line on the three documents that leave the product.
DONE MEANS. Each report exports; the weekly review compares against last week on a new laptop.

### WO-22 A second wall on the server (Data, 1 session)
THE GAP. `sanitizeRich` is browser-only; no Origin/Referer check on writes; uploads have no MIME allow-list or per-file cap beyond the 15 MB body.
BUILD. A server-side sanitiser at the write (the same allow-list, shared as a module both hosts load); an Origin check on mutating routes; an allow-list and a per-file cap with a sentence.
DONE MEANS. A raw write with a script tag is stripped; a wrong-origin write is refused; a 40 MB file is refused with a sentence.

### WO-23 Retention, legal hold, and one person's data (Data, 2 sessions)
THE GAP. No retention rule, no `legalHold`, no per-contract bundle, no subject-access query.
BUILD. A retention setting (years after expiry) with a flag-then-delete sweep that writes to the workspace log; a hold flag that blocks delete, archive-silence and the retention sweep; a per-contract export (record, versions, files, trail) as a zip; "everything about this address" across users, signers, contacts and messages.
DONE MEANS. Hold a contract and try to delete it; export one contract as a bundle; list everything held about one email address.

### WO-24 One template library (Draft, 4 sessions)
THE GAP. `state.settings.customTemplates` (a blob) and the relational `templates` library coexist with different versioning and permissions; `templateRoles` is browser-only; required fields are not validated on `PUT /api/contracts/:id`.
BUILD. Migrate blob templates into the library once; retire the blob writers; enforce template roles at `POST /api/templates/:id/contracts` and on the contract save; run `fieldLibValidate` on the owner's save.
DONE MEANS. A template limited to one role cannot be used by another even by a raw save; a required blank refuses to save empty.

### WO-25 Half a change, and a merge path (Negotiate, 2 sessions)
THE GAP. `negoResolve` is whole-card; the Open Points reply box is dead (`canReply = false`); a 409 tells the person to reload and redo.
BUILD. Accept by paragraph (the retired `applyBlockDecisions` shape brought into the current model as a partial acceptance that files the rest as a counter); the reply box wired to the notes thread; a 409 that keeps the draft in the box and reloads the record under it.
DONE MEANS. Accept two of three paragraphs; reply on an open point; a conflict keeps the draft.

### WO-26 Copilot spend per person, and stale readings (Report, 1 session)
THE GAP. `aiBudgetGuard` enforces the workspace cap only; `copilotCoverage().stale` counts and nothing acts; the AI trace excludes extraction and draft-from-a-sentence.
BUILD. A per-person daily cap with a notice at 80% (the two open rulings from the owner); stale readings offered as a row on Home's prepared work; trace the two missing surfaces.
DONE MEANS. A member at their cap sees why; an amended contract shows "read again"; the trace names a drafted clause.

---

## TIER 3 — Parity and scale

### WO-27 Guest accounts for counterparties (4) — a login for the other side, every deal with you in one place.
### WO-28 A public API, webhook history, and a calendar feed (4) — API keys, more events, a delivery log with redelivery, a subscribable calendar address.
### WO-29 Ready for two servers (2) — a run lock on the sweeps, shared rate limits, structured logs, error reporting.
### WO-30 Past 5,000 contracts (2) — server-side paging for the register and every metric.
### WO-31 Help, tour, changelog, status page (2).
### WO-32 Richer requests (2) — attachment, need-by, value, thread, ageing.
### WO-33 Migration as a server job (2) — resumable, a whole folder at once.
### WO-34 Secrets encrypted at rest (1) — the Copilot key and webhook secrets.
### WO-35 Clause library with versions and fallback ladders (2).
### WO-36 Admin and authoring on the phone (4).
### WO-37 Swahili interface (3).

Plus, already in the plan: multi-tenancy (decide at customer eight), billing in the product, public sign-up, an outside security audit, the design-debt ladder.

---

## Decisions the work orders need from the owner

- WO-03: who may terminate a contract, and whether it needs an approval. Recommendation: editors and admins, reason required, owner emailed, no chain in v1.0.
- WO-26: what happens at a person's cap; are admins exempt. Recommendation: refuse with the reason on the control; admins not exempt, may raise their own.
- The order: sell after Tier 1, or finish Tier 2 first. Recommendation: sell after Tier 1.

## Noticed during the audit, not taken up as work orders

- Copilot's chat memory does not survive a reload.
- A Viewer sees Home tiles that can never be theirs (no role-shaped Home).
- Intake decisions carry one note, no thread (folded into WO-32).
- The evidence pack names the weakest assurance rung; fine, said here so nobody "fixes" it.
