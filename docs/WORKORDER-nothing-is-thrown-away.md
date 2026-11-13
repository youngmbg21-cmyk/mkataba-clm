# WORK ORDER — Nothing is thrown away that only needed a word changed

**Status: NOT BUILT. Written 13 Nov 2026 as an overnight autonomous plan, after the flash survey. Nothing in this
order may be built until the owner says go in the chat. Story: MAP-HISTORY "PERFORMANCE — THE BOOK IS WALKED ONCE:
THE REBUILD MEASURE".**

**The owner's words, 13 Nov 2026:**

> "when I pick 'A Where we are page' on the Send screen, the screen flashes and is replaced by a new one, and I can
> no longer go back to 'The contract, round 1'. The same flashing happened before in Jambo's panels. I think it is
> one problem across the whole platform: a press that should only change the words rebuilds the whole page instead."

and then:

> "create an overnight autonomous fix plan to fix all the issues you have identified"

---

## THE ONE RULE THIS ORDER SERVES

**A press that leaves you where you are changes only what differs. It never throws the screen away, and it never
takes with it something you had: words you typed, where you had scrolled, or the way back.**

This is not a new rule. The Board already keeps it (`hbMorph`: the new drawing laid over the old, unchanged pieces
kept). Jambo's panel already keeps half of it (`igDockSame`: nothing changed, nothing written). The paper already
keeps it for one clause (`igPaperPatch`). Six list pages already keep it for a tab press (`listRowsSwapHtml`). This
order carries the same rule to the places that do not have it yet, and then nails it down with a check.

---

## WHAT WAS MEASURED (the evidence this order rests on)

GitHub run 43461225946, 13 Nov 2026, 37 minutes, 1440×780, 41 contracts, 23 pages, by
`test/chromium/_audit/rebuild-measure.js`:

- **995 presses measured. 352 of them rebuilt, flashed or lost something.**
- 204 threw a part of the screen away and built it again · 196 lost something the reader had · 168 flashed or jumped.
- About 2,240 further presses were not reached inside the per-page time cap. **This order fixes what was measured; it
  does not claim the measured list is the whole app.**

The full table is in BUGLOG.md, 13 Nov 2026, "THE FLASH SURVEY, MEASURED".

---

## THE NIGHT'S SHAPE, AND ITS STOP RULES

Six parts, in this order, **each its own branch and its own pull request**. A part that cannot be finished is left
un-pushed and written up; the night moves to the next part. Nothing merges: the owner reads the morning report and
merges.

**The night may:** read, write code, run `npm run lint`, run the named test files, push its branch, open its pull
request, read GitHub's checks on it, and fix what they say.

**The night may NOT, and stops and writes the question down instead:**
- merge anything, or push to main;
- run the full test suite, or any browser check in the chat (browser checks run only on GitHub);
- add a band, strip, notice or banner anywhere (ask first — the standing rule);
- change what a screen SAYS, add a door, or move anything a person presses. **Every part of this order is a fix
  restoring stated behaviour**, so the six questions do not bite; the moment a part looks like it needs a new control
  or new words, that part STOPS and is asked.
- change a record, a route's guard, or anything a contract stores. Not one line of this order touches the record.
- take a part out of order, or start Part D before Part A and the check in Part F are green.

**The morning report** (one page, plain English, no file paths): what each part now does that it did not do last
night, each part's pull request, what GitHub's checks said, what was left alone and why, and the rebuild measure's
new numbers against last night's 352.

---

## PART A — ONE HOME FOR A HALF-TYPED QUESTION

*The biggest finding. It is most of the 196 losses, and the code reading had missed it entirely.*

### What the reader sees today

Type half a question into Jambo's box. Press any of his panel's own controls — **Collapse panel, Pop out, Minimize,
Close, or the ✦ button** — and the words are gone. Measured on the Board, Contracts, Calendar, Explorer, Our paper,
Settings, the paper's three tabs and the Send screen.

### Why (read in the code, to be measured first by A1)

`renderIntelDock` already carries the words across a repaint: `_was` / `_keep` / `_focus` / `_sel` are read before
the write and put back after it. That works **only while the box exists on both sides of the write.** Collapse,
Minimize and Close draw a panel with no `#igd-input` in it, so `_keep` is read and then dropped on the floor; Pop out
moves the conversation to the ✦ window, which has its own box and never hears about the first one. The words live in
the box element and nowhere else, so any press that removes or replaces that element ends them.

### The fix — the flow rule's own words: ONE FACT, ONE HOME

The draft question is a fact. It gets a home outside the markup, and every box that asks Jambo reads and writes that
one home.

- **A1 (first, and alone).** Add a browser check `jambo-box-keeps-what-you-typed-verify.js` that types into the box,
  presses Collapse, re-opens, and asserts the words are still there; then the same for Minimize, Close, Pop out, the
  ✦ button, and a face change (Dossier → Clauses). Push it by itself. **GitHub must run it red** — a check that
  passes against the parent is a description, not a check. Its red run is this part's proof.
- **A2.** One store: `jamboDraft()` / `jamboDraftSet(v, sel)` / `jamboDraftClear()`, held per **panel seat**, not per
  page (one conversation, one draft). Kept in memory only — a draft question is not a record and never travels.
- **A3.** `renderIntelDock` reads the draft into the box after the write (replacing `_keep`, which becomes the
  store's writer), and the box's own `input` listener writes the draft on every keystroke along with the caret.
- **A4.** The ✦ chat window's box reads and writes the same store, so Pop out carries the words across.
- **A5.** `jamboDraftClear()` is called at exactly one place: where the question is **used** — `intelAsk` and the
  "ask later" queue. Nowhere else. Sending empties the box; nothing else does.
- **A6.** The other three ask boxes take the same store where they are the same conversation: the list panel's
  (`#jl-q`), Settings' Jambo (`#st-jb-q`), and the Send screen's. **If any of the three turns out to be a different
  conversation, it is LEFT ALONE and named in the report** — never half-joined.

### Tests
- A1's browser check, now green (its own red run on the parent is the proof).
- `node --test --test-reporter=dot test/f<n>-one-home-for-a-draft-question.test.js` — the store is published, the
  box's writer is the only writer, `jamboDraftClear` is called from the asking paths only (grep the sources), and a
  draft never reaches a contract, a share or a payload.

---

## PART B — THE SEND SCREEN KEEPS ITS WAY BACK

*The owner's own fault, reproduced word for word by the measure.*

### What the reader sees today

On the Send screen, **What goes → "A Where we are page"** closes the screen and opens a new one. The measure then
pressed the old choice and reported: *the way back: "The contract, round 1" is no longer offered.* Jambo's panel and
the paper are thrown away with it, and 76% of the page is written again.

A second, same-shaped one: **Change the signers** leaves for the route window and comes back as a new Send screen
carrying only the note and the summary — the To name and address, how it goes, and how long the link works are not
carried.

### Why

Two of the three "What goes" choices turn the letter **in place** (`setKind('history')`, `setKind('contract')`). The
third does not: it calls `openShareModal(c, { ...opts, purpose:'status', resume:{ summary } })`, which builds a whole
new screen. A new screen knows nothing of the old one, so "The contract, round 1" now leads to itself.

A small fix for the way back was drafted in another session and never finished or tested. **It is not trusted: Part B
starts from the code as it now stands on main.**

### The fix

- **B1 (first, and alone).** A browser check `send-screen-keeps-its-way-back-verify.js`: open the Send screen on a
  negotiated contract, type a note, pick "A Where we are page", then press "The contract, round 1" and assert you are
  back on the contract's letter **with the note still in the box**; and that the screen was not closed and reopened
  (the dialog element is the same element). Push alone. **GitHub must run it red.**
- **B2.** "A Where we are page" turns the letter in place, like its two neighbours: `setKind('status')`, with
  whatever the status letter needs to differ carried in that one turn. If the status letter genuinely cannot be a
  turn of the same screen, **B2 STOPS and is asked** — the alternative (carrying a `cameFrom` through a reopen) is a
  second door onto one act and needs the owner's word.
- **B3.** Whatever Part B settles on, **Change the signers takes the same road**, and carries the whole form, not two
  fields of it: To, how it goes, how long the link works, the note and the summary.
- **B4.** The measure is re-run over the Send screen alone (`HATI_RB_ONLY=send`) and the result pasted into the
  report.

### Tests
- B1's check, green.
- `node --test --test-reporter=dot test/f<n>-the-send-screen-turns-in-place.test.js test/f1035-*.test.js` — all three
  "What goes" choices are turns of one screen; no send door reopens the screen; the carried form names every field.

---

## PART C — A POP-UP THAT ONLY CHANGES ITS WORDS IS NOT CLOSED AND OPENED AGAIN

### What the reader sees today

Seven pop-ups rebuild themselves to change a few words. Measured or read:

| The pop-up | The press | What goes |
|---|---|---|
| The History timeline | any filter, and Clear | the whole pop-up, on every change; your place in it |
| Compare versions | after a named snapshot | the pop-up; which two versions you had picked |
| The Obligations review | Add or Cancel on one duty | the review closes, the form opens, a new review opens; your place in the list |
| A template's editor / versions / preview | moving between them | each replaces the other, and the Templates page behind is drawn again |
| New agreement and the + sheet | moving between them | one replaces the other |
| The Negotiations start picker | its own press | itself |

### The fix

- **C1.** One helper beside `openModal`: **`modalSwapBody(html)`** — the open dialog keeps its frame, its focus trap,
  its drag, its opener and its guard, and only its inside is laid over by the Board's own morph (Part D's shared
  `morphInto`). Falls back to `openModal(html)` when no dialog is open, exactly as `shareFillModal` already does.
- **C2.** The History timeline's filters and Clear call `modalSwapBody`, not `openHistoryTimeline`.
- **C3.** Compare versions after a snapshot: `modalSwapBody`, and the two picked versions are carried.
- **C4.** The Obligations review hands to the duty form and back through `modalSwapBody`, keeping the list's place.
- **C5.** The template trio hand to each other through `modalSwapBody`, and **stop redrawing the Templates page
  behind them** — a page behind a dialog nobody looked at does not need drawing.
- **C6.** New agreement ↔ the + sheet: `modalSwapBody`, carrying what was typed in the ask box.
- **C7.** The start picker: `modalSwapBody`.

**Each of C2–C7 is its own commit**, so one that misbehaves can be dropped without losing the rest.

### Tests
- A browser check `a-popup-changes-its-words-verify.js`: for each of the six, type something, press, and assert the
  dialog is the **same element** and what was typed is still there. **Red on the parent first.**
- `node --test --test-reporter=dot test/f<n>-one-popup-one-frame.test.js` — no pop-up builder names itself (the scan
  that found these seven, kept as a test, with a known list that only shrinks).

---

## PART D — A PAGE ASKED TO DRAW ITSELF AGAIN CHANGES ONLY WHAT DIFFERS

*The largest part, and the riskiest. It does not start until A and F are green.*

### What the reader sees today

A press that stays on the page redraws all of it: the Pulse board's columns (about 150 pieces a press), Contracts'
Overview and refresh (127 pieces, and the paper rewritten whole), Settings' People & roles (66), Jambo's house (up to
77), My notes, Discover, Approvals, Obligations, Parties, People, Our paper, Import, the Calendar, the Explorer.
Where you had scrolled goes with it.

### The fix

- **D1.** **Extract the Board's morph into one shared place** — `morphInto(host, html)` in js/components.js, with
  `hbMorph` becoming a one-line caller so the Board's behaviour cannot drift from everyone else's. No behaviour
  change on the Board; its own checks must stay green.
- **D2.** `morphInto` keeps, verbatim from `hbMorph`: a node whose markup is unchanged is kept; a node a painter
  fills itself (`data-hb-own`) keeps its inside; a form control whose shell moved is replaced, never walked into; the
  tail is trimmed. **Any doubt = written whole.**
- **D3.** Three pages only, this night, chosen because they already re-wire after every paint and their losses were
  the heaviest: **the Pulse board, Settings, and My notes.** Each one's whole-page write goes through `morphInto`;
  each is its own commit; each is proved by the measure (`HATI_RB_ONLY=pulse,settings,mynotes`) before and after.
- **D4.** **The rest of the pages are NOT done tonight** and are listed in the report as the next night's work. A
  page whose listeners are bound per paint would keep old nodes and lose its wiring; that is a fault worse than the
  flash, and it is not worth finding at 3am.

### Tests
- The Board's own checks, green and unchanged (D1 is a refactor, so this is the proof it changed nothing).
- A browser check `a-page-redraw-keeps-your-place-verify.js` over the three pages: scroll, press, assert the scroll
  stands and the pressed row is still the pressed row. **Red on the parent first.**
- `node --test --test-reporter=dot test/f<n>-one-morph.test.js` — one morph, published once, `hbMorph` delegates.

---

## PART E — THE BOXES ON A PAGE KEEP WHAT WAS TYPED

*Four measured losses that Part A does not cover, because they are not Jambo's box.*

- **E1. My notes.** Write a note, press Overview or Collapse panel, and the note's **title and body** are gone. The
  note draft gets the same treatment as Part A's: one home, read back after a paint. **This is the worst of the four
  — it is a person's own words.**
- **E2. Discover.** "Ask 41 contracts" wipes the question just typed. The question is **used** by that press, so it
  may legitimately leave the box — but only after the read has started, and it must come back if the read refuses.
- **E3. The paper.** The bell's Open loses what was typed into **"who signs for us"** and **"who signs for them"**,
  and rebuilds four parts at once. The two boxes keep their words; the four-part rebuild is Part D's and is only
  named here.
- **E4. The Send screen.** "A colleague instead" / "Someone outside instead" loses the colleague's name typed.

### Tests
A browser check `the-boxes-keep-what-you-typed-verify.js`, one case each. **Red on the parent first.**

---

## PART F — THE CHECK THAT STOPS IT COMING BACK

*Built early — straight after Part A — because every later part needs it as its proof.*

- **F1.** `test/chromium/nothing-is-thrown-away-verify.js`, a **check, not a measure**: it uses the rebuild measure's
  own marking trick on a short, fixed list of presses (the ones this order fixes, plus one press per page that is
  already right), and fails when a press that leaves you where you are replaces a whole part or loses what was typed.
- **F2.** A known list `test/thrown-away-known.json` of what is still wrong on the night it is written. **It may only
  shrink.** A press that comes off the list and breaks again fails the build.
- **F3.** It joins `run-all.js`, so GitHub runs it on every pull request.

### The measure's own two corrections (F4, small, do them here)

- **F4a.** A press that **uses** the typed words (Ask, Send to Jambo, Ask N contracts) empties the box on purpose.
  The measure counted those as losses. It must not.
- **F4b.** A press during the run switched the app to Swedish, so later rows were measured with Swedish labels. The
  measure sets the language once at the start and puts it back if a press moves it.

---

## THE ORDER OF THE NIGHT

| | Part | Why here | May run alone overnight |
|---|---|---|---|
| 1 | **A1** then **F1–F2** | the checks must be red before anything is built | yes |
| 2 | **A2–A6** | the biggest win, and the smallest change | yes |
| 3 | **B1–B4** | the owner's own fault; stops at B2 if the letter cannot turn in place | yes, with its stop |
| 4 | **E1–E4** | four small, separate box fixes | yes |
| 5 | **C1–C7** | one helper, six callers, each its own commit | yes |
| 6 | **D1–D3** | a refactor plus three pages, proved by the measure both ways | **only if 1–5 are green** |
| 7 | **F4**, then the measure re-run whole, then the report | the night's own proof | yes |

**If the night runs out of time, it stops at the end of whatever part it is in, pushes that part, and reports.** A
part half-built is never pushed.

---

## WHAT THIS ORDER DELIBERATELY DOES NOT DO

- It does not touch the pages in Part D4 — the Explorer, the Calendar, Contracts, Approvals, Obligations, Parties,
  People, Requests, Import, Our paper, Jambo's house, the Handbook. Their losses are real and measured; they wait
  for a second night, once the three pages in D3 have proved the shared morph in the owner's hands.
- It does not touch the Dossier's top card, which swaps whole when one word differs. Small, and it costs the reader
  nothing measurable.
- It does not remove the old look, the Lifeline strip's remains, or anything else noticed on the way. Those are
  BUGLOG lines.
- It changes nothing a person presses, nothing a screen says, and nothing a contract stores.
