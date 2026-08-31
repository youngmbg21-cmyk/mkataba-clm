# K — TWO REDS, AND ONE OF THEM IS A DISAGREEMENT

**NOTHING IN THIS FILE IS BUILT UNTIL THE OWNER SAYS SO.**

Owner-asked 31 Aug 2026, off the two items reported at the end of the J-5
build:

> *"fix these — One test can never pass again. The Calendar's own check asks
> whether a shared summary contains a date in 'August 2026, the 20th to the
> 29th'. Today is the 31st, so a list of what is coming up can never contain
> one. It went permanently red on about the 30th, before this work, and it
> will stay red until somebody rewrites that one line. It is the same fault
> the rulebook already records elsewhere: a test whose answer depends on the
> day it runs. — The rulebook and the code disagree about one tile. It says
> Home's Turnaround card opens the contracts signed in the last ninety days;
> the code opens all signed contracts. One of the two is wrong and I have not
> touched either."*

**TWO JOBS AND THEY ARE NOT THE SAME SHAPE.** K-1 is a test correcting itself
and touches no product code. K-2 is a real disagreement about what a number on
Home means, and **it cannot be built without the owner ruling on one
question** — which is set out under its own heading below.

---

## K-1 — A CALENDAR TEST THAT CAN NEVER PASS AGAIN

### THE FAULT, MEASURED

`test/chromium/calendar-redesign-verify.js` seeds its whole book from **four
pinned calendar dates** — `2026-08-25`, `2026-08-28`, `2026-09-10`,
`2026-09-02` — and then asks two questions that are about **today**:

- **Check 8, "carrying the dates the reader was looking at"**, asserts the
  shared summary's mail body matches `/2026-08-2\d/`. The panel it is reading
  lists what is coming up in the next fourteen days. On 31 Aug 2026 the two
  August dates are in the PAST, so the body carries `2026-09-02` and
  `2026-09-10` and can never carry an August one again. **This is the failure
  the owner reported.**
- **Check 5's scope switch** counts `.cal-chip` before and after narrowing to
  *Mine* and asserts the second number is smaller. The chips come off the month
  the grid opens on, which is TODAY's month. **From October 2026 all four
  pinned dates are behind us, the grid draws no chips at all, and `0 < 0` is
  false.** So the file does not merely have one bad line — it has a fixture
  that will take more checks with it as the calendar moves.

**THE FILE ALREADY KNOWS THE LESSON AND APPLIED IT ONCE.** Its own horizon
fixture is built ten months out **counted from today**, under a comment saying
in so many words: *"counted from TODAY rather than typed, so this fixture
cannot go stale the way a pinned calendar date does."* The four dates above
were simply never given the same treatment.

**AND THE RULEBOOK RECORDS THIS EXACT FAULT ALREADY**, under *A TEST WHOSE
ANSWER DEPENDS ON THE DAY IT RUNS IS WORSE THAN NO TEST* (f183, 21 Aug 2026):
a fixture that carried a calendar claim was measured **broken on 264 days of
730**, and the correction was to build such dates from a helper rather than by
counting from today. This is the same fault in the same shape, and the reason
it matters is the one recorded there: **a red run nobody can trust teaches the
reader to discount red runs, which is how a real failure gets waved through.**

### WHAT TO BUILD

1. **THE DATES BECOME OFFSETS FROM TODAY, NOT LITERALS.** Two comfortably
   inside the agenda's default fortnight, two outside it but inside the month
   on screen, so both the panel and the grid have something to draw on any day
   of any year. The existing `monthSpan(off)` helper is the precedent for
   anything that must sit inside one calendar month.
2. **CHECK 8 ASSERTS THE RELATION, NOT A MONTH.** The claim it exists to make
   is *what leaves the page is what is on it* — so it should read the dates the
   PANEL is showing and require the mail body to carry them. Pinned to a
   literal month it is a description of one August; read off the panel it is
   the claim, and it costs nothing at the next calendar change. **Pin the
   relation, not the number** — the rulebook's own words, paid for four times
   in the J-5 build alone.
3. **THE SCOPE-SWITCH CHECK NEEDS CHIPS TO EXIST BEFORE IT COUNTS THEM.** It
   should refuse to pass on `before === 0` rather than comparing two zeros —
   a check that cannot fail is not a check.
4. **THE WHOLE FILE IS SWEPT, not the one reported line.** Any other assertion
   resting on a pinned date joins the same correction.

### PROVE IT, DO NOT ASSERT IT

The fixture must be run at **several simulated dates** and come back green at
each — the f183 correction's own standard, which re-ran the suite at four
simulated dates before it was believed. Note that file's recorded limit while
doing it: **faking node's clock does not move the browser's**, so a simulated
date has to be set where the page can see it.

### ACCEPTANCE

1. Not one calendar date in the file is a literal; every one is derived from
   today.
2. Check 8 reads the dates off the panel and requires the mail to carry them —
   and **fails** if the mail carries none.
3. The scope-switch check fails on a book with no chips rather than passing on
   two zeros.
4. The file is green today, and green at simulated dates spread across a year.
5. **No product code changes.** This is a test correcting itself; if a product
   fault falls out of the sweep it is reported, not fixed here.

---

## K-2 — WHAT DOES "AVG TURNAROUND TIME" MEAN?

### WHAT WAS MEASURED, AND THE RULEBOOK IS WRONG TWICE

The rulebook says, under *THE HOME PAGE IS THE ENTERPRISE DESIGN*:

> *"Turnaround, which looked like it had no list at all being an average, opens
> the contracts signed in the last ninety days, which are the ones the average
> is made of."*

**Measured against the code, there is no ninety-day window anywhere.**

- **THE NUMBER** is the average of *days from raised to signed* over **every
  contract whose status is Signed** and for which both dates can be read.
  Contracts missing either date are dropped.
- **THE DESTINATION** is the register narrowed to `stage: 'Signed'` — **every**
  signed contract, dropped ones included.
- So the sentence is wrong about the list AND wrong about the number.

**THERE IS STILL A REAL MISMATCH UNDERNEATH IT, AND IT IS VISIBLE ON SCREEN.**
The tile prints its own sample size — *"N signed sampled"* — so a workspace
where some signed contracts carry no readable dates shows a tile reading, say,
*"12 signed sampled"* whose press opens a list of twenty rows. **The number and
the list do not match**, which is the rule this tile's own entry in the
rulebook states in capitals. That is true whichever way the ninety-day question
is answered.

### THE DECISION THE OWNER HAS TO MAKE

**Is "Avg turnaround time" a figure for the whole book, or for recent work?**

This is not a code question and it changes a number on Home, so it is put here
rather than guessed at:

- **OPTION A — RECENT WORK (a ninety-day window).** The number becomes the
  average over contracts signed in the last ninety days, and the press opens
  exactly those. **FOR:** it is what the rulebook sentence describes, so
  somebody may well have decided it once; and a lifetime average is a figure
  that stops moving — after two hundred contracts one slow deal cannot shift
  it, so it stops being something anybody can act on. **AGAINST:** the figure
  on Home changes the day it ships, and a small workspace with nothing signed
  in ninety days would see an em-dash where a number used to be.
- **OPTION B — THE WHOLE BOOK (leave the number alone).** The rulebook sentence
  is corrected instead, and the destination is narrowed to the contracts the
  average was actually made of. **FOR:** nothing anybody is reading changes;
  the mismatch above still closes. **AGAINST:** it keeps a number that barely
  moves, and it means the rulebook sentence was describing an intention that
  was never built.
- **OPTION C — BOTH, SAID PLAINLY.** Keep the whole-book average and print the
  window on the tile's own sub-line, so the figure explains itself. **AGAINST:**
  it does not answer the useful question, only labels the less useful one.

**RECOMMENDED: OPTION A**, and the reason is not the rulebook — it is that a
turnaround figure exists to tell you whether the team is getting faster, and an
average over all history cannot answer that. **But it is the owner's call**,
because it is a number on the first screen of the product and the owner may
have been reading it as a lifetime figure on purpose. **Nothing is built until
that ruling comes.**

### WHAT TO BUILD, ONCE THE OWNER HAS RULED

**UNDER EVERY OPTION:**

1. **ONE READING, ASKED TWICE.** Whatever the population is, the tile's number
   and the tile's destination read the SAME list — computed once and handed to
   both. Two copies of "which contracts count" is exactly how these two came
   apart, and it is this codebase's most-recorded defect class.
2. **THE RULEBOOK SENTENCE IS CORRECTED IN PLACE**, never deleted, and says
   which way it was settled and why. A rule that misdescribes the code is worse
   than no rule — the rulebook's own words about the negotiation desk.
3. **`contractSignedAt` IS THE DATE**, the one reading built in J-5.1. Nothing
   here works a signed date out for itself.
4. **A tile counting zero is not a door** — the existing rule, and Option A can
   produce a zero where the whole-book figure never did. It must be checked
   rather than assumed to be inherited.

**ADDITIONALLY UNDER OPTION A:**

5. The window is **one named constant**, and the tile's sub-line says it, so the
   figure and its own description cannot drift.
6. The em-dash case (nothing signed in the window) is drawn and is not a door.

### WHAT IS DELIBERATELY NOT IN THIS JOB

- **The other twelve tiles.** Only Turnaround was reported and only Turnaround
  was measured. If the same "number and list disagree" fault sits on another
  one, it is a line in BUGLOG and a separate job — the Scope rules govern.
- **Reports' own cycle-time figure.** It is a different screen with a different
  reading, and nobody has said the two disagree. Checking whether they do is
  worth doing and is not this.

### ACCEPTANCE

1. The tile's number and the list its press opens are built from **one**
   population, proved by a test that fails if a contract is in one and not the
   other.
2. Pressing the tile lands on a register showing exactly that many rows —
   driven in a browser, counted, not inferred from the code.
3. The rulebook sentence matches the code, and says which way it was settled.
4. Under Option A: a workspace with nothing signed inside the window draws an
   em-dash and no arrow, and the press does nothing.
5. Nothing else on Home moves — the other tiles' figures asserted unchanged.

---

## OUT OF SCOPE FOR K, SAID OUT LOUD

- **The other five red browser files.** Every one was proved to pre-date the
  J-5 work by running it against the parent commit; each is somebody's open
  job and none is this one.
- **`templates--light` on the colour census.** Same: proved pre-existing, and
  deliberately left red rather than buried when the census was re-recorded.
- **The four duplicate dictionary keys the proofreader reports.** Pre-existing,
  reported, not fixed.
