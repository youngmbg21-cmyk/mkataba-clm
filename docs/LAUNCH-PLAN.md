# HaTi Launch Plan (written 13 September 2026, revised 14 September after the completeness audit)

The live, tickable version is the "HaTi Launch Planner" artifact:
https://claude.ai/code/artifact/6cab3d24-66b8-454f-b4d0-bf7470768e34

The owner's ticks and notes are stored in that artifact's own database
(document `plan/state`). At the start of a session, Claude can read them to
see what is done. This file is the plain-text copy. The work orders named
WO-01 to WO-37 are written out in WORKORDER-platform-completion.md.

## Where HaTi is

Strong: far past MVP; three areas better than most competitors (negotiation,
obligations and renewals, the seal); 6,729 automated checks and 115 browser
check files, all green; the server is the wall with one exception (approvals);
one production dependency; a rulebook that keeps changes narrow.

Holding it back: the spine has dead ends a pilot would walk into; some things
a buyer expects are missing (counterparty record, attachments, invite by email,
admin audit log, restore onto a server); no customer has used it; no launch
market is chosen; the work has been reactive; three features wait on accounts
only the owner can open.

## How a platform gets finished (the method)

The spine: Request -> Draft -> Negotiate -> Approve -> Sign -> Store -> Perform
-> Report. Under it the platform layer: people and access, data and operations,
notifications, integrations, the phone.

1. Name the capabilities once (thirteen). Every idea belongs to exactly one.
2. Define "complete" per capability once: our paper, their paper and uploaded
   signed paper; every seat; desktop and phone; the server refuses what the
   screen refuses; every act leaves a line in the record; a way back; one
   browser test walks it.
3. Audit against the definition, in the code. Redo it once a quarter.
4. One work order closes one capability. Never a screenshot mini-fix.
5. Sequence by dependency: safety, then dead ends (Tier 1), then what a paying
   customer expects (Tier 2), then parity (Tier 3). Pilot feedback reorders
   inside a tier, never across tiers.
6. Declare version 1.0 (the spine complete for one market on a platform layer
   that runs itself) and stop. Everything after is 1.x, pulled forward only by
   a customer's name.

## Completeness map (checked in the code, 14 September 2026)

| Capability | State | What is missing | Work orders |
|---|---|---|---|
| Request | Solid | title and need only; no attachment, need-by, thread | WO-32 |
| Draft | Solid | no table/image/heading in the editor; two template libraries; no duplicate | WO-09, 19, 24 |
| Negotiate | Solid | returned round emails nobody; no upload or colleague on their page; Word import loses tracked changes; no partial accept | WO-01, 08, 20, 25 |
| Approve | Partial | browser-only enforcement; nobody told; no delegate or parallel step | WO-02, 16 |
| Sign | Solid | no decline-a-step or chase; evidence pack is a data file; no public verify | WO-14, 15 |
| Store | Partial | no counterparty record; no attachments; no bulk actions; export has no button; no tags or saved views | WO-10, 11, 13, 18 |
| Perform | Solid | nothing on the phone; Expired never written; no termination or auto-renewal record | WO-03, 04 |
| Report and AI | Solid | few exports; baselines per browser; per-person cap not enforced | WO-21, 26 |
| People and access | Partial | no invite by email; delete leaves roles dangling; no workspace audit log | WO-06, 12 |
| Data and operations | Partial | no restore onto a server; no scheduled backup; one-instance sweeps; secrets in plain text | WO-07, 22, 29, 34 |
| Notifications | Partial | three switches; nothing dismissable; renewal mail to all admins | WO-17 |
| Integrations | Thin | four webhook events, no API, no calendar feed | WO-28 |
| The phone | Partial | reads and decides; cannot author, administer, or see obligations | WO-04, 36 |

## How to work

- Monday, 20 minutes: pick at most three steps or work orders from the current phase; P0s first.
- Each session: one step, one prompt (the session recipe on the planner).
- Friday, 20 minutes: tick what shipped, sort the Inbox (P0 / P1 / P2 / Won't), write one line of what a real person taught you.
- At most one fix session a week.

## Phases (sessions; one session = an evening plus the overnight run)

### Phase 0 - Stop and steady (2)
0.1 Feature freeze (work orders are not new features). 0.2 Pick the market.
0.3 Name three pilot companies. 0.4 Inbox and rhythm. 0.5 Sort the screenshot
pile (1). 0.6 A plain-English map of every screen (Claude, 1).

### Phase 1 - Safe for real contracts (8)
1.1 Nightly backup off the server (1). 1.2 Uptime and error alerts (1).
1.3 Production settings on a real address (1). 1.4 Security re-check (1).
1.5 The test list tells the truth; lockfile committed (1). 1.6 Legal paperwork
for the market (1). 1.7 Retire static mode for customers (1). 1.8 Promise page (1).

### Phase 2 - Complete the spine, Tier 1 (21)
WO-01 Returned round announced (1). WO-02 Approvals enforced on the server and
approvers told (2). WO-03 Expired, terminated, renewed are real (2). WO-04
Obligations on the phone (2). WO-05 Value streams on the server (1). WO-06
Invite by email; deactivate (2). WO-07 Restore onto a server (2). WO-08 Their
page: upload a file, bring a colleague (2). WO-09 Duplicate a contract (1).
WO-10 Related documents (2). WO-11 Bulk actions and the export door (2).
WO-12 Workspace audit log (2).

### Phase 3 - Golden path and pilots (9)
3.1 Write the golden path as one browser test (1). 3.2 Walk it yourself (1).
3.3 Clear its P0s (2). 3.4 Onboard pilot 1 (1). 3.5 Run pilot 1 three weeks (2).
3.6 Scorecard every Friday. 3.7 Counterparty page on a phone (1). 3.8 Pilots 2 and 3 (1).

### Phase 4 - Finish the platform, Tier 2 (33; beside phases 3 and 5 by default)
WO-13 Counterparty record (4). WO-14 Proof that travels: PDF pack, public
verify, certificate (3). WO-15 Signing verbs (2). WO-16 Approval verbs (2).
WO-17 Notification control (2). WO-18 Saved views, tags, wording search (2).
WO-19 Editor: table, image, heading, alignment; Word export with letterhead (2).
WO-20 Word import keeps tracked changes (4). WO-21 The reports people ask for (2).
WO-22 Second wall on the server (1). WO-23 Retention, legal hold, subject access (2).
WO-24 One template library (4). WO-25 Partial accept and a merge path (2).
WO-26 Per-person Copilot cap; stale readings (1).

### Phase 5 - Charge money (7)
5.1 Price. 5.2 Bill by hand. 5.3 New-customer runbook (2). 5.4 Landing page (1).
5.5 Demo script (1). 5.6 Convert a pilot (1). 5.7 Ten-customers list (1).

### Phase 6 - Needs the owner's signature (10; beside phase 5)
6.1 Identity for signing: BankID broker or the Kenya ruling (2). 6.2 Google
sign-in (1). 6.3 WhatsApp (2). 6.4 Open rulings. 6.5 Counterparty signing walk (2).
6.6 Accuracy on local paper (1).

### Phase 7 - Parity and scale, Tier 3 (39, no dates)
7.1 Decide multi-tenancy. WO-27 Guest accounts (4). WO-28 API, webhook log,
calendar feed (4). WO-29 Two-server readiness (2). WO-30 Past 5,000 contracts (2).
WO-31 Help, tour, changelog, status (2). WO-32 Richer requests (2). WO-33
Migration as a server job (2). WO-34 Secrets encrypted (1). WO-35 Clause
versions and ladders (2). WO-36 Admin and authoring on the phone (4). WO-37
Swahili (3). 7.2 Multi-tenancy (4). 7.3 Billing (3). 7.4 Public sign-up (1).
7.5 Outside audit (1). 7.6 Design-debt ladder (2).

## Timeline (three sessions a week, from 14 September 2026)

Sell after Tier 1 (recommended): phase 0 to 21 Sep; phase 1 to 10 Oct; phase 2
to 28 Nov; phase 3 to 19 Dec; phase 5 to 4 Jan 2027 (first paying customer);
Tier 2 runs beside phases 3 and 5 and lands mid-February 2027; phase 7 from then.
47 sessions to the first invoice, about 16 weeks.

Finish Tier 2 first: the first invoice moves to about 22 March 2027; 80
sessions, about 27 weeks.

## Decisions and accounts only the owner can provide

Which market; sell after Tier 1 or finish Tier 2 first; BankID broker (if
Sweden); WhatsApp Business provider; Google sign-in credentials; who may
restate a currency before signing; overnight renewal-memo spend; the per-person
Copilot cap rulings; who may terminate a contract; keep or retire static mode;
three to five redacted real contracts for the scorecard; the parked Swedish
terms (if Sweden); the five design rulings.

## Parked, on purpose

The earlier plan's Group 6 as one piece (now split into WO-20 and 6.1); a code
before a guest's first Send; form fields on the paper; moving spots after a
link went out; the retired Redline Co-Pilot band; Edit with Copilot across two
clauses; PDF heading guesses; the template baseline per version; the second PDF
reader; on-time by counterparty; committed-against-paid and a paid state;
loading skeletons; OCR from outside CDNs; obligations on the counterparty's
page; the phone's archive act; a workspace rules page.
