# PROMPT — FULL END-TO-END VERIFICATION OF HaTi

*Paste everything below the line into a fresh Claude Code session on this
repository. It is written to be given whole; the sections are not optional
extras. Set the MODE line before you send it.*

---

## MODE (set this before sending)

    MODE = fix-small-report-big

`fix-small-report-big` — fix anything small, local and certain; report anything
larger and ask before touching it.
`report-only` — change no product code at all; write the report and stop.
`fix-everything` — fix what you find, however large, and say what you did.

---

## THE JOB

You are verifying **HaTi**, a contract lifecycle management product, end to
end. The goal is not "the tests pass". The goal is that the owner — who is not
a developer and who runs their real contracts through this — can trust that
every feature works, from every chair, on every screen it is drawn on,
including the parts nobody has looked at in weeks.

You are playing the part of a customer using the product for real, and of an
auditor who does not take the product's word for anything.

**Finish the whole sweep.** If one journey is blocked, do every other journey in
full and say plainly at the end what you could not reach and why. Do not
quietly shrink the scope.

---

## GROUND RULES — read these before you touch anything

1. **Read `CLAUDE.md` first, all of it.** It is the rulebook: the design
   decisions, the traps, the reversals, and the reasons. Where the code and
   that file disagree, that disagreement is itself a finding — say so, and say
   which one you believe.
2. **Read the matching section of `docs/MAP-HISTORY.md`** before you change
   anything in an area. It carries the war stories behind each rule.
3. **Do not rewrite the "Bug Fix Rules" section of `CLAUDE.md`** without
   asking. Updating THE MAP to match the code is fine and welcome — say in your
   summary what you changed.
4. **Reproduce before you fix.** Every finding must be reproduced against a
   running product first — a failing assertion, a screenshot, a raw HTTP
   response. A finding you cannot reproduce is a suspicion; label it as one.
5. **Prove it where the user looks.** This app draws the same thing in several
   places (desktop room, contract tab, counterparty page, phone, exports). A
   feature "works" only if it works on every surface that draws it. jsdom
   resolves no CSS: anything about pixels, visibility, size or colour must be
   measured in a real browser.
6. **A control that is rendered, wired and invisible has shipped here before.**
   So has one that is visible and dead. Press things for real and check the
   result changed.
7. **Report in plain English.** The owner is not a developer. No file paths, no
   line numbers, no location lists in the owner-facing summary — plain
   sentences about what happened. A separate technical appendix is fine.
8. **Never make a finding up, and never soften one.** If something is broken,
   say it is broken and show the evidence. If you did not test something, say
   you did not test it.

---

## HOW TO STAND THE PRODUCT UP

There are two modes and both must be exercised — several faults in this
product's history existed in one and not the other.

**Server mode (the real thing).** Use the existing harness:

```js
const { startHati, seedWorkspace, nameASigner } = require('./test/helpers');
const h = await startHati();          // real server, throwaway db, free port
const W = await seedWorkspace(h);     // admin + 3 members + seeded contracts
```

Sign in on a browser as `admin@example.co.ke` / `adminpassword1`.
`seedWorkspace` also creates a folder-restricted member, a member who may not
see values, and an unrestricted member — use all three.

**Browser.** Chromium is already installed. Copy the boot pattern from any file
in `test/chromium/` (`executablePath` falls back to `/opt/pw-browsers/chromium`).
Never run `playwright install`.

**Local mode (no server).** Open `index.html` directly, the way a first-time
visitor does. Records are whole in this mode and light in server mode; that
difference has caused real bugs (see "who raised this survives the list").

**Two seats at once.** The counterparty is not a role — they are a second
browser context with no login, on a real share link. `test/audit/sim-a-four-rounds.audit.js`
shows the shape. Anything you claim about what the counterparty sees must be
seen on their page, and anything you claim never reaches them must be checked
against the **raw share payload off the wire**, not against their screen.

---

## HOW TO SPEND TEST TIME

The full node suite takes about 3½ minutes; each browser file starts a real
Chrome and takes 2–5.

- While working: run only the files the feature's own `CLAUDE.md` section names
  (`node --test test/<file>.test.js`).
- The full suite runs **once, when you believe you are finished** — and again
  only if that run found something to fix.
- One browser file per screen you touched, and only that screen. Re-run a
  browser file only after changing what it measures.
- Your own end-to-end walking is *in addition to* the suite, not instead of it.
  The suite proves the rules; you are proving the journeys.

---

## HELPERS — WHAT MAY BE SHARED OUT, AND WHAT MAY NOT

You may hand some of this work to subagents running in parallel. Doing so is
optional; doing it wrongly is worse than not doing it at all, because the
faults that matter most in this product are **two screens disagreeing with each
other**, and a helper only ever sees its own half.

**May be delegated, up to four at a time:**
- The five scripted audit simulations in `test/audit/` (J13's scripted half).
- J12 — languages, markets, screen widths, the phone, dark theme.
- J11 — insights, reports, charts, the weekly review, the health report.
- J10 — intake requests, the archive shelf, webhooks, Copilot spend.
- J1's role-and-permission attacks at the API.
- J2's walk of the twelve built-in templates.
- J9's date arithmetic — obligations, reminders, briefs.

**You walk these yourself, sequentially, holding the whole picture:**
- J5, the negotiation from both seats.
- J8, the family — a signed amendment has to move the same date on the family
  card, Key terms, the register, the calendar, the dashboard, the reminder
  email and the daily brief. Split that across helpers and each reports a pass
  on its own half while the product as a whole is wrong.
- J7, approvals, signing and the execution lock.
- J6, the internal review wall.
- J3, imported paper.
- J14, the record and the seal.
- **Every cross-journey check** — anything of the form "this must say the same
  thing on that screen and in that email".

**Evidence, or it did not happen.** Each helper writes into
`test/e2e-evidence/<journey>/`: screenshots, a log of what it actually pressed,
the raw output of anything it ran, and a runnable reproduction for every
finding it claims. You read the evidence rather than the helper's summary. **A
"pass" with nothing behind it is recorded as NOT TESTED, not as a pass** — a
helper that skimmed and a helper that verified read identically otherwise, and
this is the whole reason the rule exists.

**A helper never changes product code.** It reports; you fix. One hand has to
own "fix it everywhere it appears", or a fix lands on one of the three screens
that draw the thing.

**Four browser journeys at once is the ceiling.** Each one starts a real Chrome;
past four they compete for the machine and everything gets slower, not faster.
The scripted audit simulations are cheap and can run alongside.

**The speed is not the point.** Parallelism here is worth having because the
mechanical sweeps — widths, languages, the audit scripts — are the ones that
get done last and quickly when they sit at the bottom of a long queue. If the
choice is between running them properly with helpers and running them badly
alone, use helpers. If it is between helpers and doing the interlinked
journeys properly yourself, do those yourself.

---

## THE JOURNEYS

Walk each one as a person, not as a test runner. For each, the question is
always the same three: **does it do what it says, does it say what it does, and
does it say the same thing on every screen that draws it.**

### J1 · Arriving, and who may do what
- First-run setup, sign in, the go-live checklist on Build & Launch (every row
  is meant to be a door that lands somewhere real).
- All four roles: admin, editor, viewer, and a folder-restricted member. For
  each: what they can see, what they can press, what refuses them, and whether
  the refusal is in *words on the screen* rather than a silent nothing.
- Two-step sign-in: enrol, sign in with a code, use a recovery code, turn it
  off, and the admin's lost-phone rescue.
- Sign-in rate limiting must count wrong guesses, not people arriving — ten
  colleagues typing the right password from one address must all get in.

### J2 · Raising a contract, every way there is
There are seven creation sites (wizard, built-in template, library template,
versioned library, clause library, "Draft new agreement" in the room, migration
importer) plus the amendment writer. For each: the contract is created, it is
stamped with an owner, and it opens on the tab the rules say it should.
- Every one of the twelve built-in templates: create it, fill it, read the
  paper, and check every field the form asks for actually appears on that
  template's own document.
- The template picker opens on streams, with unassigned templates under Other.

### J3 · Paper that came from outside
- Upload a third-party **.docx** with real text: the "who are we" question, the
  reading quality, the file strip, download the original, re-read it.
- Upload a **PDF**: it keeps its file preview, and nothing pretends to have
  read text it has not.
- The reader's text-size stepper must reach an uploaded contract's wording,
  not just a template's.
- Import a counterparty's marked-up Word file back in, and check the changes
  land against the right clauses with their margin comments.
- The **paste-a-response-code** path, for a counterparty with no way to reach
  the server: they must be able to record decisions and hand back a code, and
  the owner must be able to paste it in.

### J4 · Key terms, money, and filing
- Every Key terms row, on a draft and on a signed contract (most rows stand
  down when signed; the stream picker and obligations deliberately do not).
- **Money in its own currency**: a contract in USD, one in EUR, one in the
  workspace currency. Its own page prints its own currency; every figure that
  adds contracts up converts, and where no rate is on file the figure says what
  it left out rather than silently trimming. Set a rate through the picker.
- Signing caps and per-folder signing rights: warn-only until the workspace
  switch is on, then refuse in words, and never for an admin.
- An admin re-files a contract to another stream: the confirm says who gains
  and loses sight of it, and an editor is refused at the server.

### J5 · The negotiation, both seats, end to end
This is the largest surface in the product. Play a real four-round negotiation
with a second browser as the counterparty.
- Open the clause panel from the pencil on a clause. Write a change in the
  panel, save it with a reason, file it. Check the paper, the card, the count,
  and the audit trail all agree.
- The card is a routing row; the panel is where the wording, the reason, the
  history and the reply box live. Check nothing is orphaned.
- **A card's Send sends that card and nothing else**; the batch doors send
  everything held back.
- Counters and supersession: their counter takes the table, our superseded
  draft says so, the accepted-rival guard refuses in words, and the way out it
  names (Reopen) is actually reachable.
- Accept, reject with a reason, withdraw, reopen — from the seat that is
  allowed to do each, and refused from the seat that is not.
- The document must always tell the truth: what is adopted is what is drawn.
- Live-link catch-up: an answer reaches their copy; proposed wording waits for
  the round to be published.
- Publish a round, close a round, and check the tally and the history.
- Their page's reading modes (Redlined / As agreed / With changes), their bell,
  their exports.
- Discussion notes on a change, internal versus shared, and the defaults on
  each seat.
- Selection on the paper: it must copy and it must not offer edits.

### J6 · The colleague in the loop
- Internal review: ask a named colleague, hold a change, correct wording, hand
  back, cancel, and two reviews at once.
- A held change must never travel — check the raw payload.
- The counterparty must never learn a review happened — no verdict, no name, no
  existence. Check the payload and their screen and their exports.
- The negotiation desk: lead, contributor, reader, ask-to-join; the desk gates
  redlining and sending and must never gate signing.
- The email that tells the reviewer must say honestly whether it went, queued,
  or was refused.

### J7 · Approvals, signing, and the lock
- Approval rules, the overseen-by step, and a rule that fires on value.
- Name signers on both sides — that is what opens signing — then issue a
  signing link, sign as the counterparty, countersign in-app, and check the
  order is honoured and the internal signer is told when it is their turn.
- The signature assurance ladder: what each signature proves, stamped at the
  moment and never derived afterwards.
- Once anyone has signed, the route is shut and the wording is frozen. Try to
  get past it **from the API as well as the screen** — the road with no button
  on it is the one that matters.
- The evidence pack, the seal, and Verify integrity.

### J8 · THE FAMILY — amendments, addendums, annexes and the rest
*(The owner asked for this one by name. Do it properly.)*

HaTi files seven kinds of related document: **amendment, addendum, variation,
renewal, statement of work, annex, side letter.** Four of them can move the
term: amendment, variation, renewal, addendum.

- Create **each of the seven** against a signed parent, from the Agreement
  family card. For each: the name and its number are right for that kind
  ("Addendum No. 2" must not count amendments), the body is written (skeleton
  or blank), the recitals name the parent and its real date, the counterparty,
  party, stream and letterhead are carried, and the value, dates, obligations
  and signers are deliberately **not** carried.
- **Link an existing document** as a child, and unlink it. Link a standalone to
  a parent. Check a master cannot be filed under a child, a document cannot be
  its own parent, no cycles, and only one level deep.
- **The term.** A *draft* amendment must not move the parent's end date; a
  *signed* one must. The proposed date shows beside the live one in amber until
  it is executed. Check this reaches: the family card, Key terms, the register
  row, the calendar, the dashboard, the renewal reminder email and the daily
  brief — a reminder that disagrees with the screen is the worst half to miss.
- Sign an amendment through the real signing route, then re-check every one of
  those surfaces.
- An archived executed amendment still sets its parent's term.
- A declined child keeps its number.
- Children must not count as separate agreements in the KPIs, and their renewal
  reminder fires on the parent.
- **Ask the question the product may not have an answer to:** a customer who
  says "appendix" — what do they file it as? Is `annex` presented clearly
  enough for them to find it, in both languages? If the answer is "they would
  guess wrong", that is a finding worth reporting even though nothing is broken.
- Negotiate an amendment (it is a contract like any other), share it, and
  execute it.

### J9 · Dates, promises and nudges
- Obligations: create, assign to a member, complete, overdue. The nudge must
  reach the person responsible at 7 days, on the day, and the day after, in
  their own language, and only escalate to admins as the rules say.
- The renewal adviser card: only for an agreement actually in force, the date
  it counted back from, the notice period, the phrase it read that period out
  of, and a deadline older than the record reported as predating rather than
  as a miss.
- The calendar: a day is a door; the chips are not.
- Daily and weekly briefs: all three cadences, a quiet day sending nothing, and
  the weekly keyed on its Monday.

### J10 · The newer doors
- Intake requests: a viewer raises one, an editor accepts, declines with a
  reason, and marks done; the requester is told each time and never told about
  their own act. A viewer still cannot draft.
- The archive shelf: an archived contract is off every default list, count,
  sweep and dashboard slice, still findable in search, and still Signed.
- Webhooks out: subscribe, receive the four events, check the payload carries
  ids and never names or titles, and that a private or looped-back address is
  refused.
- Copilot spend by person, and the workspace ceiling.

### J11 · The thinking surfaces
- Copilot: chat, clause proposals, the redline co-pilot band (every row's
  button must be a card's own control), the contract brief, ask-your-book from
  the palette, precedent memory.
- Insights: all three tabs, every panel, and the exclusions each panel reports.
- Reports, the weekly review document, the portfolio health report.
- Charts: ask for a named shape and get that shape, with the numbers unmoved.
- With **no AI key configured**, every one of these must say so honestly and
  never present a dead press.

### J12 · The same product in every window
- Both languages, end to end — and remember the contract's own words are never
  translated, months follow the reader's language, and numbers follow the
  market.
- Both markets (Kenya and Sweden), including Swedish buttons over Kenyan
  contracts.
- Widths: 1920, 1500, 1440, 1366, 1280, 1024, and the phone at 390. The
  sidebar floats below 1500 and must not squeeze the page.
- Dark theme on every screen you visit.
- The phone shell: home, contracts, negotiate, approvals, the contract screen,
  the share sheet, people. It files no changes of its own — check it still
  doesn't.

### J13 · The adversary
Run the four audit simulations and read what they say:

    node test/audit/sim-a-four-rounds.audit.js
    node test/audit/sim-bc-amendment-and-people.audit.js
    node test/audit/sim-d-server-attacks.audit.js
    node test/audit/sim-e-email-live.audit.js
    node test/audit/sim-f-word-import.audit.js

`sim-d` reports **0 of 18** attacks succeeding and must go on doing so. Then go
further yourself: take a real editor's and a real viewer's session and attack
every route that should refuse them — status changes on executed contracts,
folder moves, signature recording, review verdicts, roster edits, admin-only
fields in their own bootstrap. **An attack that fails to arm reads exactly like
one that succeeds**, so assert the state you created before you attack it.

### J14 · The record
- History timeline from both chairs, its filters, its export and its print.
- Verify integrity across the whole book (read-only; it repairs nothing).
- Word and PDF exports from both seats, and the read-only copy.
- Every audit line: is it in English, does it name the person, and is it true?

---

## WHAT COUNTS AS A FINDING

Rank everything you find:

- **Broken** — it does not do what it says. Evidence: the reproduction.
- **Lying** — it does what it says somewhere and says something different
  somewhere else (the card and the paper disagree; the email and the screen
  disagree; the phone and the laptop disagree). This product's worst historical
  faults are all in this class. Treat it as seriously as Broken.
- **Unreachable** — a refusal whose stated remedy cannot be pressed; a control
  drawn but dead; a door that leads nowhere.
- **Confusing** — it works, and a real customer would still get it wrong.
  Report it, do not fix it without asking.

**Known and not regressions** — do not report these as new:
- `theme-tokens-verify` scores 20/40 against a stale recorded baseline; the
  twenty passing checks are the ones that matter.
- `standard-paper-verify` and `six-round-audit` press a retired clause tool row
  and were already failing before the current work.
If you find a *different* reason those files fail, that is new — say so.

---

## WHAT TO DO WITH WHAT YOU FIND

Under `fix-small-report-big` (the default):

- **Fix** what is small, local and certain — and fix it *everywhere it appears*.
  This app draws the same thing in several places; a fix in one renderer is not
  a fix. Before writing any code, find every place the thing you are changing
  appears. Do that thoroughly and internally; do not list the locations back.
- **Prove the fix** the way you proved the fault, then run the test files that
  feature's own rulebook section names.
- **Report and ask** for anything architectural, anything touching money,
  signatures, permissions or what travels to the counterparty, and anything you
  are less than certain about.
- **Never** skip, disable or loosen a test to make something pass. If a test is
  wrong, say so in words and show why.
- If you deliberately leave something alone, that decision must reach the owner
  in plain English — never silently.

---

## THE REPORT

Write `E2E-VERIFICATION-REPORT.md` in the repository root, in this order:

1. **The one-paragraph answer.** Can the owner trust this product today? Yes,
   yes-with-caveats, or no — and why, in plain English.
2. **What is broken**, worst first. Each one: what a person would see, when it
   happens, how bad it is, and whether it is fixed now.
3. **What is fixed in this pass**, in plain sentences.
4. **What I found and did not fix**, and why — with what you recommend.
5. **What I could not test**, and what would be needed to test it. Be honest
   and specific; an untested area silently omitted is the one thing that
   destroys the value of this whole exercise.
6. **The coverage table** — every journey J1–J14, what you actually walked,
   the result, and **who walked it**: you, or a named helper. A journey walked
   by a helper whose evidence you could not check is listed as NOT TESTED.
7. **Technical appendix** — reproductions, commands, and test output. Paths and
   line numbers belong here and nowhere else.

Then write the owner a **short plain-English summary in chat**: what works,
what does not, what you fixed, what you left alone and why, and what you were
unsure about. No file paths, no line numbers.

---

## FINISHING

1. Run the full node suite once: `npm test`. If it finds something, fix it and
   run it once more — that is two runs on a bad day, one on a good one.
2. Run every browser file for a screen you changed.
3. Update `CLAUDE.md`'s MAP where the code has moved away from it, and say in
   your summary what you changed there.
4. Commit on the branch you were told to work on, with a clear message, and
   push with `git push -u origin <branch>`. Retry a network failure up to four
   times with backoff. Do not open a pull request unless you are asked to.

**Do not report this task complete until you have actually walked every journey
above.** If you run out of room, say exactly where you stopped and what is left
— an honest partial sweep is worth a great deal, and a claimed complete one
that isn't is worth less than nothing.
