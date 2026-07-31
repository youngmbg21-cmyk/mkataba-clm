# Platform bug review — the second instance of each fault

**What this is.** The last few rounds of fixes each repaired *one* example of a
problem that turns out to exist in several places. This review went looking for
the other examples: same mistake, different screen. It is written for a reader
who does not work on the code.

**Result.** Twelve faults found and proved, twelve fixed. The test suite went
from 1,119 tests passing to 1,151 tests passing, with nothing broken on the way.
Three things were checked, found to be working, and are recorded here so nobody
has to check them again. One is a product decision rather than a bug and is
flagged for a person to make.

Everything below was **reproduced first** — a test written that fails against
the shipped code, describing what a customer would actually see — and only then
fixed. Nothing was changed on suspicion.

---

## The findings, worst first

### 1. One badly typed date switched off every renewal reminder in the workspace

**What a customer sees.** Nothing. That is the problem. Renewal reminder emails
— 90, 60 and 30 days before a contract ends, and again as the notice deadline
approaches — simply stop arriving, for every contract in the workspace, and no
screen anywhere says so. The first anybody hears of it is a contract that
auto-renewed for another year because nobody was told it was coming up.

**What actually happened.** The reminder sweep runs on the server twice a day.
It works out "the decision deadline is the expiry date minus the notice period",
and to do that it has to read the expiry as a real calendar day. Most expiries
are, because the date pickers produce them. But an expiry that came in through a
bulk migration, a Copilot extraction or a typed spreadsheet can read
"30 September 2026" — and asking the computer to do arithmetic on that raises an
error rather than returning a wrong answer.

The sweep is wrapped in a safety net so that a failure cannot take the whole
server down. That net was **empty** — it caught the error and threw it away. So
the sweep died a third of the way through the portfolio, twice a day, forever,
in complete silence. An administrator pressing "run reminders" by hand got a
bare error page with no clue which record was at fault.

This is the *same* fault that was fixed in the browser a few rounds ago
(a bad expiry killed the Home and Calendar screens). The browser was fixed. The
server keeps its own copy of that arithmetic and was never touched.

**Class.** 1 — unguarded data assumptions, compounded by 3 — silent failure
swallowing.

**How it was proved.** `test/f65-server-reminders-survive-bad-dates.test.js`
boots a real server, files one contract whose expiry reads "30 September 2026",
and asks the reminder endpoint to run. Before the fix it answers with a server
error; contracts filed *after* the bad one never get their reminders at all.

**Fixed.** Yes. The server now normalises every expiry and every obligation due
date the same way the browser does, before any arithmetic touches it. A value
that is no kind of date is treated as "we do not know when this ends" — which
every part of the sweep already handles by simply not firing. And the safety net
now writes a line to the server log saying the sweep failed and no reminders
went out, so a silent stoppage cannot happen twice.

---

### 2. The counterparty's link never heard the owner's answer

**What a customer sees.** The counterparty asks for a change to a clause. The
owner opens the negotiation room and accepts it. Days later the counterparty
opens their link again — and their own request is back on the screen marked as
still waiting for the other side. They chase. The owner is certain they
answered. Both are looking at their own screen and both are right.

**What actually happened.** The link a counterparty holds does not read the
contract live; it serves a *copy* taken when the link was made. A previous fix
taught the system to quietly refresh that copy whenever the counterparty's own
answers were applied — so their answers stop being replayed back at them.

The mirror image was never walked. Nothing refreshed the copy when **we**
answered **them**. That refresh was called from exactly one place in the whole
product, and it was the wrong half of the conversation.

**Class.** 6b — stale snapshots.

**How it was proved.** `test/f64-obligation-dates-and-stale-links.test.js` opens
the real owner's negotiation room on a change the counterparty filed, presses
the real Accept button, and checks whether the link catch-up was triggered.
Before the fix it was not — for Accept, for Reject, or for taking one's own
refused request off the table.

**Fixed.** Yes, and deliberately narrowly. Deciding a change or withdrawing a
request now quietly catches the link up. Wording the owner has newly *proposed*
does **not** — pushing that down a live link would change what the reader is
being asked to look at without anybody choosing to send it. Sending stays a
deliberate act.

The catch-up is silent, and the test checks that too: no email, no new share
record, nothing marked as re-sent, and no resetting of whether they have opened
the current wording. That is the approved pattern and it is unchanged.

---

### 3. The Register printed the words "Invalid Date" where a date should be

**What a customer sees.** A row in the contract register that looks completely
ordinary, except that the expiry column reads **Invalid Date**. Worse, and
harder to notice: that same contract is missing from "expiring in 30 / 60 /
90 days" on the Home screen, missing from the twelve-month renewal pipeline in
Reports along with all the money attached to it, and sorts to the very bottom of
"expiring soonest" — behind contracts that have no expiry date at all.

**What actually happened.** There is one function every screen goes through to
ask "when does this contract really end" — the file it lives in says so in its
own opening comment. That function was handing back whatever had been typed.
Two of its callers had been taught to tidy the value up; the funnel itself never
was. So each screen made its own mistake with it: the Register printed the
error, and everywhere else it quietly became "not a number", which fails every
comparison and therefore falls out of every list silently.

**Class.** 1 — unguarded data assumptions.

**How it was proved.** `test/f66-effective-expiry-is-a-date.test.js` files a
contract expiring in 45 days with the date written the way a person writes it,
then reads the actual Register cell, the actual Home screen, the actual Reports
model and the actual sort order.

**Fixed.** Yes — one change at the funnel, which fixes all four screens at once,
plus the Copilot chart and the portfolio summary that read through the same
function.

---

### 4. Obligations were invisible on the Calendar, and never went overdue

**What a customer sees.** They ask Copilot to find the obligations in a
contract. It finds them — "pay the quarterly minimum, due 31 March 2027" — and
they are saved. Then: nothing appears on that day in the Calendar, nothing
appears in the "next 60 days" list beside it, the count next to Calendar in the
sidebar does not move, and when 31 March 2027 comes and goes the obligation
still reads **open**. A payment obligation, tracked by the product, that the
product will never once mention again.

**What actually happened.** The expiry field was taught to accept a date written
by a human. The obligation due date is the same kind of field with a different
name and was left exactly as it was — even though the instructions given to
Copilot ask for a machine-readable date and it frequently answers with a human
one, and a migration spreadsheet always does. Nothing crashed here, which is
precisely why nobody noticed: the value simply became "not a number", and
comparisons against that are always false. The obligation is never overdue, and
the calendar cell it belongs in never claims it.

**Class.** 1 — unguarded data assumptions.

**How it was proved.** `test/f64-obligation-dates-and-stale-links.test.js` puts
an obligation due in ten days on a contract with the date written out in words
and renders the real Calendar.

**Fixed.** Yes. Obligation dates now go through the same normaliser the expiry
does, on the calendar grid, in the agenda, in the overdue test and in the
sidebar count.

---

### 5. "Phase 2" was read as 1 February 2001

**What a customer sees.** A contract whose end date was never really filled in —
a migration left it as "Phase 2", or "clause 4.2", or "TBC 2027" — shows up as
having expired twenty-five years ago. It appears in expiry lists, it draws
itself on a calendar in 2001, and its renewal decision date is computed from a
date nobody ever entered. A wrong date stated as fact is worse than a missing
one, because nobody goes looking for it.

**What actually happened.** Found while fixing finding 4, and it was hiding
inside the previous round's fix. The normaliser's rule was "if it does not look
like a standard date, ask the browser to have a go at it". The browser's fallback
parser is extremely willing: it reads "Phase 2" as February 2001 and "clause 4.2"
as 2 April 2001, without complaint.

**Class.** 1 — unguarded data assumptions.

**How it was proved.** Same test file: a list of the phrases that really turn up
in contract metadata, each of which must come back as "we do not know".

**Fixed.** Yes. Only shapes a person actually writes a date in are offered to
the parser now — `30 September 2026`, `September 30, 2026`, `2026/09/30`, and the
standard machine form. Everything else is "we do not know", which every screen
already handles. The same rule is applied on the server.

---

### 6. Copilot reported finished work as still outstanding

**What a customer sees.** They ask Copilot how their portfolio is doing. It
tells them ten obligations are open when they have ticked nine of them off. And
when obligations really are overdue, it says nothing is.

**What actually happened.** Two mistakes in the paragraph Copilot answers
portfolio questions from. It tested completion by looking for a field called
`done` — a field no obligation in this product has ever had; completion is
recorded elsewhere — so *every* obligation ever written passed the filter. And
it tested overdue-ness against the raw due date, so the human-typed dates from
finding 4 never triggered the alarm.

This one matters more than its size suggests: the model repeats what the
paragraph tells it, in a confident sentence, to a customer who has no way to
check it.

**Class.** 1 — unguarded data assumptions (a field that was assumed to exist).

**How it was proved.** `test/f67-copilot-counts-obligations.test.js` reads the
actual paragraph the product builds.

**Fixed.** Yes — it now asks the same question the rest of the product asks.

---

### 7. The obligations chart drew completed work as outstanding

**What a customer sees.** The same wrong numbers as finding 6, but drawn as a
bar chart. The chart is built from live data specifically so the model cannot
invent it, which means whatever it miscounts is presented as fact.

**What actually happened.** The identical two mistakes, copied into the chart
recipe: the same non-existent `done` field, and the same unnormalised due date —
so overdue obligations left the "Overdue" bar empty.

**Class.** 1 — unguarded data assumptions.

**How it was proved.** Same test file, reading the actual chart data.

**Fixed.** Yes.

---

### 8. Ticking off an obligation left the sidebar number wrong

**What a customer sees.** The number beside **Calendar** in the sidebar counts
obligations due in the next sixty days. Complete the last one and the badge
still reads 1. It goes on reading 1 until the customer happens to navigate
somewhere else and back, at which point it silently corrects itself. A number
that is wrong and then quietly right is worse than one that is simply absent —
nobody knows which reading to believe.

**What actually happened.** That count is recomputed when the screen changes.
All three things that move it — adding an obligation, completing one, removing
one — happen inside the contract workspace, which is not a screen change.

**Class.** 6a — a surface the event never reached.

**How it was proved.** `test/f68-obligation-counts-refresh.test.js` renders the
real obligations panel and presses its real buttons.

**Fixed.** Yes — and the Calendar screen itself repaints too if that is what the
customer is looking at.

---

### 9. The renewal decision deadline was a day early outside London

**What a customer sees.** On a server hosted in Nairobi — the market this
product is built for — the "renewal decision due" email names a deadline one day
earlier than the real one.

**What actually happened.** Found while fixing finding 1, and it is the same
mistake the browser fix called out a round ago. Converting a date to text the
standard way shifts it to London time first, so midnight local becomes the
previous evening, and the day comes out one lower.

**Class.** 1 — unguarded data assumptions.

**How it was proved.** Alongside finding 1: the decision-deadline test asserts
the deadline day itself, not merely that nothing crashed.

**Fixed.** Yes — the server now reads the day where it is standing, matching the
browser.

---

### 10–12. Three more in the same families

These are the remaining halves of fixes above, listed separately because each
would be visible on its own:

- **Milestone reminders skipped in silence.** Even before it crashed, the server
  sweep quietly sent no 90/60/30-day warning at all for any contract whose
  expiry was typed by a human. (Fixed with finding 1.)
- **Overdue obligation notices never sent**, for the same reason, for
  obligations. (Fixed with finding 1.)
- **The empty safety net.** The twice-daily sweep swallowed its own failure
  without a word. It now logs what stopped it. (Fixed with finding 1.)

---

## Checked, and working — recorded so nobody repeats the work

- **Word (.docx) reading.** The reader refuses a file it cannot read, with a
  message a person can act on, rather than storing whatever came out. It cannot
  produce the "stored gibberish" failure the PDF reader had.
- **The negotiation's integrity chain.** Every path that changes a change —
  filing, deciding, editing, inserting — clears the cached "verified" badge, so
  a stale tick cannot outlive the thing it was about.
- **Rich structure in exports and print.** The printed and exported contract
  render the formatted document where one exists, and only fall back to plain
  text where there is genuinely nothing else. This is the flattening fault from
  a previous round, and it is not present here.

## Suspected, not reproduced — no code changed

- **The screen-switch tail.** When a screen fails to draw, the failure is caught
  and reported. The handful of steps that run *after* the drawing — highlighting
  the nav button, updating the sidebar, repainting the activity panel — are not
  inside that net. Reading the code, none of them can realistically fail on bad
  contract data, and no test could be made to fail. Left alone.
- **The share list held in memory.** The negotiation room is handed a copy of
  the contract's share links from a cache that is written when the workspace
  loads and never invalidated. A link revoked in another tab would leave that
  copy stale. No user-visible consequence could be demonstrated. Left alone.

## For a person to decide, not for me

- **Day-first dates from a migration.** `2026/09/30` is understood; `30/09/2026`
  — the way a Kenyan or British spreadsheet writes it — is not, and becomes
  "we do not know". Reading it correctly means deciding whether `03/04/2026` is
  3 April or 4 March, which is a product decision about who this is for and not
  one to take quietly inside a bug fix.

## By design, not a bug

- **Newly proposed wording does not appear on a live counterparty link until it
  is sent.** The quiet catch-up added in finding 2 deliberately excludes it. The
  product's position, stated in several places, is that what the other side is
  asked to look at changes when somebody decides to send it.
- **The counterparty's page does not poll.** Their screen catches up when they
  reload or when a new link arrives. Answering is their act; the page is not
  built to change under them mid-sentence.

---

## Appendix A — every event that changes a contract, and every surface that shows it

Read across: does the event actually reach that surface? **open** means the
surface was already on screen when the event landed.

| Event | Main page | Negotiation room (open) | Counterparty's link | Sidebar counts | Activity panel | Calendar (open) |
|---|---|---|---|---|---|---|
| Counterparty's answer applied (polled) | yes | yes | yes | yes | yes | n/a |
| Counterparty posts a message | yes | yes | reads live, always current | n/a | n/a | n/a |
| Owner accepts / rejects a change | yes | yes | **yes — finding 2** | n/a | n/a | n/a |
| Owner withdraws their own request | yes | yes | **yes — finding 2** | n/a | n/a | n/a |
| Owner proposes new wording | yes | yes | by design, on send | n/a | n/a | n/a |
| Owner posts a message | yes | yes | reads live, always current | n/a | n/a | n/a |
| Round sent / turn handed over | yes | yes | yes, a new link | n/a | n/a | n/a |
| Readiness signalled | yes | yes | yes | n/a | n/a | n/a |
| Signature taken | yes | closes | yes | yes | yes | n/a |
| Obligation added / completed / removed | yes | n/a | n/a | **yes — finding 8** | n/a | **yes — finding 8** |
| Expiry or metadata confirmed | yes | n/a | n/a | yes | yes | on next visit |
| Reminder sweep (server, twice daily) | n/a | n/a | n/a | n/a | n/a | **runs at all — finding 1** |

Bold entries are the cells that were empty before this review.

## Appendix B — every copy of the data, and what keeps it honest

| The copy | What refreshes it when the original changes |
|---|---|
| The counterparty's share link | Their own answers being applied; **now also our decisions and withdrawals** (finding 2). Newly proposed wording, by design, only on a deliberate send. |
| Earlier wording each link carried | Written once, on purpose — it is the history a link is compared against. Never refreshed, correctly. |
| Frozen signed document | Captured at signing and never touched again. That is what "executed" means. |
| Cached "chain verified" result | Cleared by every path that changes a change. Checked; correct. |
| Document preview links (in-browser) | Keyed by the file's own fingerprint, so a new file gets a new one. Correct. |
| Remembered screen preferences | The reader's own, per browser; nothing upstream to follow. |
| The counterparty's unsent answers | Held in their browser against that link, expiring after a month, cleared when sent. Checked; correct. |
| Portfolio totals, share overview, activity feed | Refreshed on a timer and on every screen change. |
| The share list held in memory | **No refresh path.** No demonstrable consequence — recorded above under "suspected". |
| Server's quick-lookup columns (expiry, value, status) | Rewritten every time a contract is saved. |

---

## Five patterns worth adopting, to stop this class coming back

1. **Normalise at the funnel, never at the caller** — one function owns "what
   date is this", and every screen goes through it; a fix applied to two callers
   out of nine is not a fix.
2. **A parser that always succeeds has not validated anything** — accept the
   shapes you mean and answer "unknown" to everything else, because a confident
   wrong date is worse than no date.
3. **When you fix one side of a two-party flow, walk the other side the same
   day** — every fault in this review that mattered most was the mirror image of
   something already fixed.
4. **A copy of the data needs a named owner who refreshes it** — if you cannot
   say in one sentence what brings a cached copy up to date, it is already
   stale.
5. **Never write an empty safety net** — catching an error to keep the process
   alive is right; throwing away what it said is how a feature switches itself
   off for a year without anyone noticing.
