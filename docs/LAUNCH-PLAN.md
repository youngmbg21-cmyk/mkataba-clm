# HaTi Launch Plan (written 13 September 2026)

The live, tickable version is the "HaTi Launch Planner" artifact:
https://claude.ai/code/artifact/6cab3d24-66b8-454f-b4d0-bf7470768e34

The owner's ticks and notes are stored in that artifact's own database
(document `plan/state`). At the start of a session, Claude can read them to
see what is done. This file is the plain-text copy of the same plan.

## Where HaTi is

Strong: far past MVP; 6,729 automated checks and 115 browser check files, all
green; the server is the wall (two audits in August, 0 of 18 attacks succeed,
the July report's seven serious holes are closed); one production dependency,
no build step; a rulebook that keeps changes narrow.

Holding it back: no customer has used it; no launch market chosen (the code
does Kenya and Sweden, but signing identity, paperwork, price and sales are
one-market jobs); backups are manual and nothing watches the server; the work
is reactive (screenshot rounds); three features wait on accounts only the owner
can open (BankID broker, WhatsApp Business, Google sign-in); about 138,000
lines of code for one part-time owner.

The one change: start every session from the plan, never from a screenshot.
Screenshots go into an Inbox and are sorted once a week (P0 / P1 / P2 / Won't).
At most one fix session a week; the rest move a step on the plan.

## How to work

- Monday, 20 minutes: pick at most three steps from the current phase; P0s first.
- Each session: one step, one prompt (the session recipe in the planner).
- Friday, 20 minutes: tick what shipped, sort the Inbox, write one line of what a real person taught you.

Inbox sort: P0 = a pilot cannot finish the golden path, data at risk, or a
leak (this week). P1 = wrong but there is a way round (before the first paying
customer). P2 = nicer (after the first paying customer). Won't = one line in
BUGLOG under "Noticed, not fixed".

## Phases (effort in sessions; one session = an evening plus the overnight run)

### Phase 0 - Stop and steady (2 sessions, one week)
0.1 Declare a feature freeze until a pilot has used HaTi for two weeks. (you)
0.2 Pick the launch market: Kenya or Sweden. (you)
0.3 Name three companies to ask to pilot. (you)
0.4 Set up the Inbox and the weekly rhythm. (you)
0.5 Empty the screenshot pile into the Inbox and sort it. (you + Claude, 1)
0.6 A one-page plain-English map of every screen. (Claude, 1)

### Phase 1 - Safe for real contracts (8 sessions, about three weeks)
1.1 Automatic nightly backup off the server, and one practised restore. (both, 2)
1.2 Uptime and error alerts to the owner's phone. (both, 1)
1.3 Production settings on a real address: domain, APP_URL, HTTPS, email from own domain, Copilot spend ceiling. (both, 1)
1.4 Security re-check: the July report's seven findings as tests, plus the attack file; a one-page dated note. (Claude, 1)
1.5 The test list tells the truth: every red browser file fixed, ruled, or listed with a reason; lockfile committed. (Claude, 1)
1.6 Legal paperwork for the launch market: privacy policy, terms, DPA, retention statement (ODPC or GDPR). (you, 1)
1.7 Retire the no-login static mode for customers. (Claude, 1)
1.8 A customer-facing promise page from SECURITY.md. (both, 1)

### Phase 2 - The golden path and the first pilots (9 sessions, about three weeks, then pilots run alongside phase 3)
2.1 Write the golden path (create workspace, upload five contracts, see obligations and renewals, send one to a counterparty, get a change back, sign); Claude makes it one browser test. (both, 1)
2.2 Walk it yourself on the live site with realistic contracts; every stumble is a P0. (you, 1)
2.3 Clear the golden-path P0s only. (Claude, 2)
2.4 Onboard pilot 1 (thirty-minute call, bulk migration, DPA first). (you, 1)
2.5 Run pilot 1 for three weeks: one call a week, three questions. (you, 2)
2.6 Keep the scorecard: contracts uploaded, obligations dated, reminders sent, links sent, signatures done, every Friday. (you)
2.7 Fix the counterparty's page on a phone (the tap-to-select menu is recorded broken). (Claude, 1)
2.8 Onboard pilots 2 and 3. (you, 1)

### Phase 3 - Charge money (7 sessions, about three weeks, overlapping the pilots)
3.1 Set the price: per workspace per month, checks included, Copilot on the paid tier. (you)
3.2 Bill by hand first: an invoice or a payment link; no billing code yet. (you)
3.3 The "new customer in thirty minutes" runbook: one process per customer, scripted. (Claude, 2)
3.4 One landing page with a book-a-demo button. (both, 1)
3.5 A fifteen-minute demo script and one recording. (both, 1)
3.6 Convert a pilot to a paying customer, or write down the reason why not. (you, 1)
3.7 The ten-customers list: seven names with a next action each. (you, 1)

### Phase 4 - The things that need the owner's signature (10 sessions, runs beside phase 3)
4.1 Identity for signing: Sweden = BankID broker account (Criipto / Signicat / ZealiD; the rung is built); Kenya = decide IPRS/PKI or state the launch tier on the promise page. (both, 2)
4.2 Sign in with Google (credentials from the owner). (both, 1)
4.3 WhatsApp notifications (Business API provider account). (both, 2)
4.4 Rule on the open rulings (see Decisions). (you)
4.5 The counterparty's guided signing walk. (Claude, 2)
4.6 Copilot spend per person with a cap (two rulings needed). (Claude, 1)
4.7 Accuracy scorecard on the launch market's own paper (3-5 redacted real agreements). (both, 1)

### Phase 5 - Past ten customers (12+ sessions, no dates on purpose)
5.1 Decide multi-tenant versus one process per customer, on evidence. (you)
5.2 Multi-tenancy if 5.1 says so (tenant id through every query; an attack file proves isolation). (Claude, 4)
5.3 Billing inside the product. (Claude, 3)
5.4 Public sign-up. (Claude, 1)
5.5 An outside security audit. (you, 1)
5.6 The design-debt ladder from the UI audit, one phase a fortnight in the gaps. (Claude, 2)
5.7 Integrations and Swahili, only with a customer's name beside each. (both, 1)

## Timeline (at three sessions a week, from 14 September 2026)

- Phase 0: 14-21 Sep. Phase 1: 21 Sep - 10 Oct. Phase 2: 10-31 Oct.
- Phase 3: 31 Oct - 16 Nov (first paying customer, if a pilot converts).
- Phase 4: beside phase 3, 31 Oct - 23 Nov. Phase 5: from 23 Nov, open.
- 36 sessions to the first paying customer, about 12 weeks. At two sessions a week it is about 18 weeks; at four, about 9.

## Decisions and accounts only the owner can provide

- Which market launches first (recommend: the one where you can call three companies this month).
- BankID broker account, if Sweden (apply in phase 1; approval takes weeks).
- WhatsApp Business API provider (Kenya early; Sweden later).
- Google sign-in credentials (half an hour; do it in phase 1).
- Who may restate a contract's currency before signing (recommend: frozen once out for signature).
- Whether HaTi may spend Copilot money overnight on renewal memos (recommend: yes under the existing ceiling, off by default).
- Per-person Copilot cap: what happens at the cap, are admins exempt.
- Keep the static mode for demos or retire it (recommend: behind a setting, demos only).
- Three to five redacted real contracts from the market for the accuracy scorecard.
- Review the parked Swedish terms (only if Sweden).
- The five design rulings the UI audit left open (leave until a customer comments).

## Parked, on purpose

Group 6 of the build plan (Word round-trip and BankID) by the owner's word;
a one-time code before a guest's first Send; server-side enforcement of
reserved signing steps; form fields on the paper; moving spots after a link
went out; phone signing; the retired Redline Co-Pilot band; Edit with Copilot
across two clauses; PDF heading guesses from font size; the template baseline
per version; the second PDF reader with no caller; on-time reporting by
counterparty; committed-against-paid and a paid state on the chain; multi-
tenancy; in-product billing and public sign-up; loading skeletons; per-browser
custom value streams; OCR from outside CDNs; the counterparty's signing walk;
obligations on the counterparty's page; the phone's archive act; a workspace
rules page; editing in the People directory.
