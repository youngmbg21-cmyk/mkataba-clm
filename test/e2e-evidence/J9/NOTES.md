# J9 — Dates, promises and nudges — audit notes

Scope: obligation nudges (WO-1), the renewal adviser (W2-4), daily/weekly briefs
(WO-3), the family-aware term arithmetic shared between the two sweeps
(effExpiryReader), and (time-permitting) the calendar-day-is-a-door browser
feature. Every claim below was reproduced against a real running server
(`test/helpers.js`'s `startHati`/`startHatiWithMail`) or, for pure client-side
functions, against the real module code loaded into a jsdom stage
(`test/world.js`'s `buildWorld`) — never against a paraphrase of the code.

All raw output is in `run.log`. Every finding below is **PASS** — nothing in
this batch was found Broken, Lying, Unreachable or Confusing. That is itself
the finding: the four features this brief was asked to stress (WO-1, W2-4,
WO-3, and the shared arithmetic) are unusually well covered by the existing
suite (f212, f214, f219, f65), and every gap I found in that coverage closed
cleanly when reproduced directly.

---

## 1. Obligation nudges reach the assignee (existing test: `f212`)

Ran `test/f212-the-nudge-reaches-the-assignee.test.js` as-is (9/9 pass). It
already covers, live against a mail-stub server:
- 7-days-before / on-the-day / day-after, each exactly once, to the resolved
  member's own stored address, in their own language (Swedish subjects
  verified: `Förfaller om 7 dagar`, `Försenat`).
- Admins silent until day −4 ("still open three days later"), and the
  escalation names the member by name in the body.
- Running the sweep twice re-sends nothing (dedupe).
- Assignee written as an email address resolves the same member.
- A name matching nobody keeps the byte-identical legacy admin mail
  (`/^Obligation overdue: /`) — this is f65's own pinned wording.
- An assignee written as a free-text OUTSIDE address (`stranger@elsewhere.example`)
  is never mailed — reproduces the open-relay rule live (`mail.sent.some(m
  => m.to === 'stranger@elsewhere.example')` is false).
- A refusing mail provider leaves the sweep alive (`200`) and the outbox
  honestly records the attempt as NOT sent.

**Verdict: PASS.** No gap found worth a separate reproduction; I ran it
rather than re-deriving it, since re-deriving would just be a paraphrase.

Command: `node --test test/f212-the-nudge-reaches-the-assignee.test.js`
Evidence: `run.log`, section "f212".

---

## 2. The renewal adviser — `renewalWindow` / `renewalInForce` / `predatesRecord`

`f219` (14 tests, ran as-is, all pass) covers the AI/model side thoroughly
(signals computed server-side, cached, forged-record-ignored, stripped from
share payloads, editor-and-up + scope-checked, metered under its own name)
but only proves the STATUS-gating rules (`renewalInForce`, draft/declined/
archived/amendment exclusion, `predatesRecord`) by **regex over the source
text** — it never actually calls `renewalWindow(c)` with contracts in each of
those states. I closed that gap with a live call into the real function.

**What I did:** `test/e2e-evidence/J9/j9-02-renewal-window-statuses.js` loads
`js/obligations.js` + `js/family.js` for real via `test/world.js`'s
`buildWorld({family:true, obligations:true})` (a jsdom stage, not a
paraphrase — the actual `renewalWindow`/`effectiveExpiry`/`negoExecuted`
chain runs), and calls `win.renewalWindow(c)` directly against six shapes:

| status of `c`                                   | expected  | got                        |
|--------------------------------------------------|-----------|----------------------------|
| `Draft`                                           | `null`    | `null` — PASS              |
| `Declined`                                        | `null`    | `null` — PASS              |
| `Signed` but `archived:{...}`                     | `null`    | `null` — PASS              |
| `Signed` with `parentId` set (an amendment)       | `null`    | `null` — PASS              |
| `Under Review`                                    | `null`    | `null` — PASS              |
| `Signed`, no negotiation trail, only `migration`  | offered   | `{inWindow:true,...}` — PASS |
| (executed OUTSIDE HaTi)                           |           |                            |

Then a second block proves the **traceability and predates-vs-missed split**
that the owner specifically asked for (20 Aug 2026, "state the contract says
so and so"):
- `decideBy` is exactly `expiry(75d out) − notice(30d) = 45d out`, both
  numbers read straight back off the fixture — PASS.
- A notice period so large that subtracting it from the expiry lands before
  the contract's own first audit entry ("filed" date) reports
  `predatesRecord:true, missed:false` — PASS. (Filed 5 days ago, expiry 30
  days out, notice 200 days — decideBy lands ~6 months in the past, well
  before the 5-day-old filing.)
- A genuinely passed deadline on a contract filed long ago reports
  `missed:true, predatesRecord:false` — PASS.

The **quote-vs-"where it's recorded"** half of the claim (span present →
quotes `metadata.sourceSpans.noticePeriodDays` verbatim; span absent → says
where the number is recorded, never fabricates quotation marks) is proven in
`f219` by slicing `renewalCardHtml`'s real source and asserting the exact
branches (`rn_from_quote`/`rn_from_terms`, `const quote=span?...` — never
`quote?''`). I did not additionally render `renewalCardHtml` in a browser —
that would require loading `js/ai.js` into a stage (it is not one of
`test/world.js`'s optional modules) — so I am treating the render-level claim
as **verified by source inspection, not by live DOM output**. Said plainly:
I did not screenshot or DOM-read the actual card text.

**Verdict: PASS** on every claim I could reproduce live; one sub-claim (the
rendered HTML wording) rests on `f219`'s existing regex-on-source check
rather than a fresh live render — noted as a gap in MY coverage, not a
product fault.

Command: `node test/e2e-evidence/J9/j9-02-renewal-window-statuses.js`
Evidence: `run.log`, section "J9-02".

---

## 3. Daily and weekly briefs

`f214` (10 tests, ran as-is, all pass) is thorough: personal vs admin split,
folder scope (the restricted member's brief is proven NOT to contain
"Naivas" — folder B's own counterparty name — which is exactly the MK-B1/
MK-B2 leak this task asked me to rule out; I did not need a second
reproduction since the seeded fixtures already include MK-B1/MK-B2 and the
assertion is on their marker text), all three cadences, `briefEvery`
refused outside the three values (400), the legacy `dailyBrief===false`
migration, weekly saying "this week" and never "today", and a refusing
provider leaving the sweep alive with an honest (unsent) outbox row.

Three things the task asked for were NOT in `f214` and I closed them with
live reproductions:

**3a. `POST /api/daily-brief/run` and `/api/reminders/run` are admin-only.**
Both routes carry the `admin` middleware in `server/server.js` (grep-
confirmed), and I proved it live: admin → 200, two different non-admin
("legal" role) accounts → 403 on both routes.
`test/e2e-evidence/J9/j9-03c-admin-only-run-routes.js` — PASS.

**3b. Daily and weekly genuinely do not share a dedupe row.** `f214` proves
each cadence in isolation but never proves that switching cadences the SAME
day doesn't get silently swallowed by the other cadence's already-burned
key. I sent `novalues` a daily brief, confirmed a same-day re-run is
deduped, then switched them to `weekly` (same day) and re-ran: they got a
weekly brief immediately (`"What needs you at HaTi this week (1)"`), proving
the `daily:<user>:<day>` and `weekly:<user>:<monday>` rkeys are genuinely
independent rather than colliding.
`test/e2e-evidence/J9/j9-03b-daily-weekly-no-shared-dedupe.js` — PASS.

**3c. A quiet day burns no dedupe row (the "item landing later the same day
must still brief" claim).** Server code confirms this structurally
(`if (!total) continue;` sits BEFORE the `INSERT INTO reminders` — a quiet
member's rkey is never written), and I proved it live: `novalues` gets a
quiet first run (nothing sent), then I stage an obligation for them and
re-run the SAME sweep the same "day" — they get exactly one brief
containing the new item.
`test/e2e-evidence/J9/j9-03d-quiet-day-burns-nothing.js` — PASS.

**3d. "A server down on Monday still sends Tuesday, not losing the week."**
This needs manipulating which calendar day the server itself believes it is
(`aiToday()` reads real wall-clock time via a fixed `Intl` timezone with no
test hook to override it), so I could not reproduce it end-to-end against a
running sweep without faking system time — I did not do that (out of scope
for a safe audit: system-clock manipulation on a shared box). Instead I
proved the underlying pure function (`briefWeekOf`, copied verbatim as a
read-out, not a reimplementation) algebraically: `briefWeekOf('2026-08-18')`
(a Tuesday) returns the SAME Monday as `briefWeekOf('2026-08-17')` (that
week's Monday) and `briefWeekOf('2026-08-23')` (that week's Sunday) — one key
for the whole week, regardless of which day inside it the sweep actually
runs — while the following Monday gets a genuinely new key.
`test/e2e-evidence/J9/j9-03-briefweekof.js` — PASS on the algebra; **NOT
reproduced end-to-end against the live daily-brief sweep with a faked
system clock** — flagging this honestly rather than overclaiming.

**Verdict: PASS** on every claim, with the one honest exception (3d) noted
as unreproduced end-to-end (only proven at the pure-function level).

Commands:
`node --test test/f214-the-daily-brief.test.js`
`node test/e2e-evidence/J9/j9-03c-admin-only-run-routes.js`
`node test/e2e-evidence/J9/j9-03b-daily-weekly-no-shared-dedupe.js`
`node test/e2e-evidence/J9/j9-03d-quiet-day-burns-nothing.js`
`node test/e2e-evidence/J9/j9-03-briefweekof.js`
Evidence: `run.log`, sections "f214", "J9-03c", "J9-03b", "J9-03d", "J9-03".

---

## 4. The family term arithmetic is shared (`effExpiryReader`)

Neither `f212`, `f214`, `f219` nor `f65` actually exercises `runReminders()`
against a parent contract carrying an amendment — `f219` only proves this at
the `renewalWindow`/client-reading level, and CLAUDE.md is explicit that
`effExpiryReader` is the SAME implementation the reminder sweep and the
daily-brief sweep both call (server/server.js line ~8433, "since WO-3 shared
by BOTH sweeps... ONE implementation on purpose").

I reproduced the reminder-sweep half live: a parent contract whose OWN
stated expiry (200 days out) matches no milestone, carrying a **SIGNED**
amendment (`relation:'amendment', status:'Signed'`) that sets the term to 60
days out (a milestone) — the sweep fires `"Renewal in 60 days:
...MK-FAM-P"` on the PARENT's id, using the amendment's date. A second
parent with a **DRAFT** amendment setting a would-be-milestone term (30
days) fires nothing at all — the draft is correctly ignored and the
parent's own 210-day (no-milestone) expiry governs.

`test/e2e-evidence/J9/j9-04-family-expiry-shared.js` — PASS, both halves.

Since both sweeps call the identical `effExpiryReader(rows, parsed)` (one
function, both call sites read from it, confirmed by reading the source —
`server.js:8465` for `runReminders`, `server.js:8624` for
`runDailyBriefs`), and `f219` already proves the SAME rule holds for
`renewalWindow`'s client-side twin, I did not additionally reproduce the
daily-brief admin "expiry inside 30 days" item moving with a signed
amendment — that would exercise the identical code path a second time. I
consider this covered by construction (one shared function, proven correct
at the point both callers read it) plus source confirmation that both
call sites use it, rather than by two independent live reproductions.

**Verdict: PASS.**

Command: `node test/e2e-evidence/J9/j9-04-family-expiry-shared.js`
Evidence: `run.log`, section "J9-04".

---

## 5. The calendar — a day is a door (browser)

Ran the EXISTING browser file `test/chromium/calendar-day-verify.js`
end-to-end in real Chromium (`/opt/pw-browsers/chromium`) against a live
server and a real signed-in session — did not write a new one, since this
file already measures exactly what the task asked for: a day box is
pressable and an empty day is not; the chips inside a day are plain
`<span>`s with no `data-sel`, no button role, and no keyboard stop of their
own (`0 data-sel, 0 button(s)`, `0 focusable inside, cell tabindex=0`); a
press anywhere in a many-contract day (including on a chip) lands on the
register narrowed to that day's contracts with the narrowing named and a way
back; a one-contract day opens that contract directly, from the cell OR its
chip; a contract that puts two marks on one day (expiry + renewal decision)
is still counted once; and the agenda list beside the calendar still opens
its own named contract. **23/23 checks passed**, no page errors.

**Verdict: PASS.**

Command: `node test/chromium/calendar-day-verify.js`
Evidence: `run.log`, section "calendar-day-verify.js (browser)".

---

## What I did NOT test

- **The weekly "Monday missed, Tuesday catches up" claim end-to-end against a
  live sweep** — only proven algebraically at the pure-function level (see
  3d). Reproducing it live would require faking the server's wall-clock day,
  which I chose not to do.
- **`renewalCardHtml`'s actual rendered output** (the quote/no-quote wording,
  `predatesRecord`/`missed` sentence choice) as DOM text — I proved the
  underlying `renewalWindow` fields feeding it are correct, and relied on
  `f219`'s existing source-regex checks for the render layer itself, rather
  than loading `js/ai.js` into a stage to render it.
- **Anything about `js/views/calendar.js`'s agenda list beyond what
  `calendar-day-verify.js` already measures** — I ran the existing file, not
  a new exploration of the calendar screen.
- **Non-English/Swedish languages beyond what f212/f214/f219 already assert**
  — I did not add a third language or probe every string pair myself.
- **Concurrent/racing sweep runs** (e.g. two admins pressing "run" at once) —
  out of scope for this pass.
- **The webhook (`obligation.due`) side-channel** that rides the obligation
  "today" nudge's dedupe — noted in the source (`webhookQueue('obligation.due', ...)`
  inside the `od===0` branch) but not independently verified.
