# WORK ORDER — Plain reads one clause and always answers; the open clause rises to the top of the list

**Status: DONE (built 6 Oct 2026 on the owner's "Go, build all three parts").
Written the same day from two owner reports over screenshots of the Clauses
drawer (the Thread) on the Document tab. Tests: f536 (new) and
test/chromium/thread-verify.js 1e, 8a–8e. Story in docs/MAP-HISTORY.md under
"THE THREAD — PLAIN READS ONE CLAUSE, ONLY, AND SAYS WHY". The live server's
log was not available to read, so the cause was confirmed by reproducing it
(f536 (A) red at unmodified main) rather than off the owner's own records.**

Three parts. Part 1 and Part 2 belong together (both are about Plain); Part 3
stands on its own.

---

## Where things stand (read before touching anything)

- Read CLAUDE.md, then grep docs/MAP-HISTORY.md for these headings and read
  each section in full:
  - "THE THREAD — THE DOCUMENT TAB'S ONE CARD FOR READING A CLAUSE"
  - "THE THREAD — A DRAWER OVER FORM & LINKS" (Plain always answers is in here)
  - "PLAIN ENGLISH READS IN THE BACKGROUND, A CLAUSE AT A TIME"
  - "PLAIN ENGLISH BESIDE THE CONTRACT" and the sections after it
  - in server/server.js, the comment "THE ECHO IS A SENSE CHECK, NOT A SPELLING
    TEST" (23 Sep 2026) over `readEchoWords`
  - the plain-English history: docs/WORKORDER-plain-english-four-reports.md
- All three parts change what the drawer SAYS or how it MOVES, so the SIX
  QUESTIONS are run before any code. None adds a band, strip or tip. None
  moves the contract.

---

## Part 1 — "Could not read" on a clause Copilot DID read

**The owner's words, 6 Oct 2026** (over "3.4 Termination for Change of
Control. · 1 to look at · Could not read"):

> "Hati keeps having a hard time translating a clause to plain english. Review
> why that is." … "the translation is supposed to be one clause at a time only."

### The finding (measured in the code, nothing changed)

Plain already asks Copilot about ONE clause. The fault is in what HaTi does
with the answer.

- Copilot is asked to copy the clause's heading back with its reading, so HaTi
  can be sure the reading belongs to that clause (`readEchoJudge`, server).
- HaTi compares that copied heading against EVERY heading in the contract (170
  here), not just the one clause it asked about.
- The comparison (`readEchoScore`) divides the shared words by the SHORTER of
  the two headings. A short heading whose few words all appear inside the
  copied one scores a perfect 1.0.
- So when Copilot copies the heading exactly, the reading lands. When it
  tidies one word, another clause's short heading "wins", HaTi calls it a
  "shift" and throws the reading away. The second automatic try uses the same
  check and fails the same way. The row then says "Could not read".

Run against the screenshot's own headings plus a short "Change of Control"
heading (as a definitions clause would have):

| Copilot's copy of the heading            | Today       |
|------------------------------------------|-------------|
| 3.4 Termination for Change of Control.   | kept        |
| 3.4 Termination **on** Change of Control | THROWN AWAY |
| Termination **upon a** Change of Control | THROWN AWAY |

Not yet confirmed on the owner's live contract. The server writes one log
line per throw-away (`[readings] <id>: N of M entries refused: R… echoed "…"
wanted "…"`), and the record carries `_readings.failed`. Read those first if
they can be had; if they show a different cause, stop and tell the owner
before building.

### What to build

1. **One clause asked, one clause answered.** When Plain asks about one
   clause, there is nothing to mix it up with: the answer IS that clause's
   reading. Pair it by the key alone; the heading copy is not a reason to throw
   it away. (A page of several clauses is gone with Part 2, so the
   "which row on this page" check has nothing left to guard. If any
   several-clause path survives, compare only within the clauses asked, never
   the whole contract, and stop a short heading winning by containment.)
2. **An empty answer is still asked once more** (today's rule stays). Still
   empty after that → "Could not read".
3. **"Could not read" says WHY, in plain words**, from what the server already
   knows: Copilot gave an empty answer · Copilot is not connected / out of
   budget · the provider failed · (only if a several-clause path survives) the
   answer could not be placed. The row's Plain asks again, as today. No new
   band: the reason replaces today's one sentence in the open row.
4. **A row is never marked "Could not read" when nothing was asked.** Today
   the press's tidy-up marks the row even when the press returned early
   because another reading was running. Mark only rows the server actually
   answered about.

### Tests

- A node file (next free f-number): `readEchoJudge`/pairing on a one-clause
  ask keeps a reading whose heading copy is reworded, with a short heading
  elsewhere in the list (red at the parent — prove it at unmodified main); an
  empty answer is asked again once then reported with its reason; a press
  that asked nothing marks nothing.
- thread-verify: a stubbed Copilot that rewords the heading → the reading
  draws under 3.4, no "Could not read".

---

## Part 2 — Remove "All N clauses in plain English"

**The owner's words, 6 Oct 2026:** *"there should never be an option to
translate all clauses so please delete."*

### What to build

- Remove the button from the open row (`data-th-explain-all`, `.doc-th-all`)
  and its press handler. The `th_explain_all_*` / "All N clauses" keys go
  INERT in both books (never deleted — see the duplicate-key lesson).
- **The server refuses a whole-contract reading**: `/api/ai/readings` reads
  only the clauses named in `only`; a request naming none is refused with a
  plain sentence. This is the wall — the browser is cosmetics. Confirm there
  is no other caller first (today `docReadRun` is the only one; grep phone
  files, Copilot tools, agents and the background reading too).
- "one short reading" beside Plain stays.
- Tell the owner in the summary: with this gone, nothing in HaTi reads a whole
  contract into plain English any more.

### Tests

Re-point in place (mark "RE-POINTED <date>"): f507, thread-verify,
reading-in-the-background-verify, five-screenshots-verify — each asserts the
button or a whole read today. New claim: no `data-th-explain-all` drawn; a
POST without `only` is refused.

---

## Part 3 — Stepping to the next clause brings it to the TOP of the list

**The owner's words, 6 Oct 2026** (over "5.9 Interests on late payments."
opened near the bottom of the drawer, with an arrow pointing up):

> "when I am reviewing the scans, when i click on the next topic, it should go
> to the top pushing all the ones before it up the scroll so it is then the
> first one."

### The finding

`docThreadFill` moves the drawer's list ONLY when the newly opened row is out
of sight (above the top, or within 120px of the bottom), and then puts it 40px
below the top. A row that is already visible but low down stays where it is,
so stepping with › walks the open row down the drawer and its reading opens
below the fold.

### What to build

- Whenever the OPEN row changes — a press on a row, ‹ or ›, a risk door
  landing, the paper's scroll moving the line — the list glides so the open
  row's head sits at the TOP of the list (just under the drawer's head and
  colour filter), with the rows before it scrolled up out of sight.
- The last few rows that cannot reach the top (the list is too short below
  them) go as high as the list allows — never padding added to fake it.
- Smooth glide; instant under reduced motion (`docThreadReduce`). A reading
  that lands inside the open row never moves the list (today's
  `_docThreadRevealed` rule stays).
- The paper keeps doing what it does today (its clause glides to the 24px
  line). Only the drawer's list changes.
- Same on the phone? The phone does not draw the Thread — confirm, and say so.

### Tests

- thread-verify: open row 6, press › → row 7's head is at the list's top
  (measured with getBoundingClientRect against the list, within 2px); the
  same for a press on a row that was already visible low in the list; the last
  row goes as high as it can. Prove each red at unmodified main.

---

## Not in this order (BUGLOG lines if met, never fixes)

- Anything about the Worth a look marks, the brief, or the filter counts.
- The paper's own scroll behaviour.
