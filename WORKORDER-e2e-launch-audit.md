# WORKORDER — the end-to-end launch audit (owner-asked 20 Aug 2026)

**The owner's ask, in their own words:** test the end-to-end usage of HaTi to
ensure it works so well that it is ready for launch. The goal is to ensure the
platform will not fail if it were used by SMEs for daily execution. Where a
failure or a bug is discovered, note it in a summary for review.

**This is an autonomous overnight run.** The owner is asleep. Never wait on an
answer, never ask a question — where a judgement call comes up, make the
conservative call and record it in the report so the owner can overrule it in
the morning.

## The one rule of this run

**FIND AND REPORT. NEVER FIX.** Product code is not touched. The deliverable is
`AUDIT-E2E-REPORT.md` — a plain-English summary a non-developer reads over
coffee — committed and pushed to the designated branch, and nothing else is
committed. If a fault is so severe it blocks the rest of the audit, note it,
work around it, and keep going; still do not fix it. (The reasoning: a fix made
at 3am without the owner's eyes on it is a change nobody approved, and this
codebase's own rulebook says every fix must find every place the thing appears —
that is daytime work.)

## Out of scope — owner-ruled, for a later stage

- **BankID / national eID**: the assurance ladder's `national-eid` rung, any
  broker integration, and any finding of the shape "eID is not available" —
  it is declared unavailable on purpose.
- **The SHA / cryptographic seal layer**: the SHA-256 document seal, seal
  verification (`verifySeal`), the evidence-pack digest and the weak-seal
  messaging. Ordinary signing IS in scope — routes, links, codes, caps, order,
  the execution lock; only the crypto-seal verification layer is excluded.
- **Features the map records as blocked on the owner's own accounts**:
  WhatsApp Business API, Google sign-in. Their absence is by design.

## Before accusing anything — the false-alarm walls

1. **Read the map first**: `CLAUDE.md` end to end, `OPEN-ISSUES.md`, and the
   tail of `BUGLOG.md`. Many behaviours that look odd are deliberate and
   documented (a Viewer who cannot press things, a counterparty who never
   learns a review exists, a prefill that refuses to guess). A documented
   deliberate behaviour is not a bug; if it still seems wrong for an SME, file
   it under "worth a conversation", never under bugs.
2. **The known-stale list** (recorded in CLAUDE.md — report these as "known,
   recorded", not as new findings, unless their numbers have moved further):
   `theme-tokens-verify` scores 20/40 against a stale baseline;
   `standard-paper-verify` and `six-round-audit` fail for recorded
   pre-existing reasons (16 Aug handoff).
3. **An attack that fails to arm reads exactly like one that succeeds** (the
   D1/H2 lesson in the map). Before testing a guard, assert the state you
   created actually exists. A test that mis-drives the product proves nothing
   about the product.
4. **A finding counts only when reproduced twice**, from a fresh server, and
   the report carries the exact reproduction so the fix session can replay it.
5. **Test where the USER looks.** A wrong number on a dashboard is a finding
   even when the arithmetic function passes its unit test.

## What to run

Work from `/home/user/mkataba-clm`. Everything below runs offline — the test
harness (`test/helpers.js`) boots a real server on a throwaway SQLite file,
stands in for the Anthropic API and queues mail to the outbox; nothing reaches
the network. Scratch scripts go in a temp directory, never in the repo.

**A. The whole node suite, once**: `npm test` (~3.5 minutes). Record every
failing file and the failing assertion's words.

**B. The browser journey files** (`node test/chromium/<file>.js` — each starts
a real Chrome, 2–5 minutes each). These are the product's own record of what
the owner approved on screen; a regression here is a regression an SME will
see. Run at least: negotiations-door, sign-links, signers-and-party,
amendment-journey, upload-party, share-recipient, refile-a-contract,
clause-door, redline, parity, portal-header-verbs, counterparty-reading-and-more,
counterparty-bell, settled-ask-reopen, reopen-a-refusal, competing-redlines,
copilot-band, queue-overlay, home-pipeline-ring, kpi-four, nav-floats,
alerts-and-activity, settings-tabs, settings-holds-still, people-directory,
calendar-day, insights-panels, phone, laptops, history-head, live,
paper-grows, control-row-folds, term-and-fields, nda-carries-no-money,
readonly-copy, derive-dialog, document-ask-copilot, playbook-opens-read,
queue-overlay, newcontract.

**C. The recorded audit simulations**: `node test/audit/sim-*.audit.js`.
`sim-d-server-attacks` must still report **0 of 18** attacks succeeding.

**D. Fresh SME day-in-the-life journeys** — the heart of this audit. Drive a
real server through `test/helpers.js` (`startHati()`, `seedWorkspace()`,
`startMailStub()`/`startHatiWithMail()`, `nameASigner()`, the cookie-holding
`Client`). Read the helper before using it. The journeys, each from the seat of
the person living it:

1. **The first day.** Set up a workspace, invite an admin, an editor and a
   viewer, sign each in, give the editor a restricted stream list. Pass: each
   role sees exactly what the map promises (folder scope holds both ways, the
   directory is readable by all, admin-only facts never reach a non-admin's
   browser payload).
2. **A contract is born.** Create a draft from a template, fill Key terms,
   set the party and a value. Pass: the draft opens on Key terms, the document
   states what the record states (term, party, money), nothing crashes.
3. **Paper arrives from outside.** Upload a third-party .docx. Pass: the
   upload asks who we are, the Document tab draws the wording as a page (no
   crash, no "OURS is not defined" class of fault), re-read works.
4. **The negotiation.** File redlines, send a round on a share link, open the
   link as the counterparty, accept / reject / counter, send back, publish the
   next round. Pass: every change lands where it was filed, decisions travel,
   a counter supersedes cleanly, "waiting on them" is only said when true,
   nothing is lost between seats.
5. **The colleague check.** Turn the internal review gate on, ask a colleague,
   try to send while held. Pass: a held change never travels (client AND raw
   server request), verdicts and hand-backs work, the counterparty never
   learns a review existed.
6. **The signature.** Name signers both sides, walk the approval chain, the
   internal signer's turn email, the counterparty's code, sign to execution.
   Pass: the route enforces order, the cap and per-folder signing rights bind
   (converted like-with-like), the wording freezes at the first signature, an
   executed record refuses edits — through raw requests, not just the screens.
7. **Money tells one truth.** Set contracts in foreign currencies, set and
   miss FX rates. Pass: a contract prints its own currency, aggregates convert
   or say what was left out, nothing silently sums apples into oranges.
8. **The promises.** Create obligations with assignees and due dates, run the
   reminder sweep with a mail stub that can refuse. Pass: the right person is
   nudged at the right times, "sent" is only said when sent, a dead provider
   leaves an honest record, daily/weekly brief cadence obeys each person's
   setting.
9. **The working day around it.** Dashboard counts, the alerts bell, the
   calendar, search and the palette, reports. Pass: every count agrees with
   the register's truth (the same book counted the same way), every alert is a
   door that opens on the thing it names.
10. **The family.** Create an amendment from a parent, decline one, execute
    one, archive a contract. Pass: only an executed amendment moves the term,
    the proposal is still stated, an archived contract leaves every default
    list and count but is still findable, reminders agree with the screens.
11. **The front door.** File an intake request as a viewer, decline one and
    accept one as an editor. Pass: asking grants nothing, the requester is
    told of decisions, accepting mints the contract through the ordinary path.
12. **The walls.** As each seat, attempt what that seat must not do — a viewer
    writing, an editor moving folders or granting caps, a counterparty
    reading internal facts, a share payload leaking held changes, reviews,
    resolvedBy or admin-only fields. Drive the SERVER with raw requests, since
    the browser's copy is cosmetics. Pass: every wall from the map holds.
13. **Two languages, one market.** Flip a reader to Swedish over the same
    workspace. Pass: platform words follow the reader, contract text never
    translates, months follow the language, money follows the market.

Also worth a light pass: the phone shell (via the browser files), the Requests
door, two-step sign-in enrolment/refusal (TOTP — in scope; it is not BankID),
and the sign-in rate limiter counting failures rather than people.

## Severity, and the verdict

- **Blocker** — daily execution fails, data lies, or money/permissions leak.
  An SME hits it in week one.
- **Major** — a common journey breaks or misleads but has a workaround.
- **Minor** — friction, a wrong word, a dead press with a nearby live one.
- **Cosmetic** — looks, spacing, tone.

The report opens with one verdict: **READY**, **READY ONCE THE BLOCKERS ARE
FIXED**, or **NOT READY**, and says in one paragraph why.

## The report — `AUDIT-E2E-REPORT.md`

Written for the owner: plain English, short sentences, no file paths or line
numbers in the body (the technical appendix at the bottom is the one place
commands, file names and reproductions belong — the fix session needs them).
Sections, in order: the verdict · what was tested (and what was not, said
honestly) · blockers · majors · minors and cosmetic · "deliberate but worth a
conversation" · known recorded issues confirmed unchanged · the technical
appendix. Every finding: what happens, where the user sees it, how bad it is,
and how sure the audit is. Commit the report to the designated branch and push;
retry pushes up to 4 times with backoff on network failure.
