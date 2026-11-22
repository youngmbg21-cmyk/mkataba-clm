# Work order: the Board's own helpers stay on the Board (23 Oct 2026)

**Status: waiting for the owner's yes.** Nothing here is built until the owner
says so in the chat. Then it is built on one branch, with no merge until the
owner says "merge to main".

## What the owner saw

The owner had a contract's History open on Home (MK-369). Jambo's box offered
"Ready analyst questions" (Concentration, Speed, Pipeline…). Pressing one gave
a black message, "Added to the board: How far contracts get", and nothing
visible happened.

The owner asked: "am i supposed to get the list of predetermined choices to
choose from? … review if this is happening elsewhere".

## Why it happens

A contract opened from the Board is drawn ON the Board face:
- `hbS().face === 'board'`
- `hbS().card` is set, which `bsCardId()` reads.

Several of the Board's own helpers check only `face === 'board'`. So while a
contract is in front, they still behave as if the charts were in front.

Some places already know the difference and are the model to follow:
- `hbBoardHelloOn` checks `bsCardId()`.
- `hbPlaceholder` is already contract-aware: the box reads "Ask about MK-…'s
  history…".

## The five leaks (measured in a browser, 23 Oct 2026, with a contract's History open)

1. **Empty box → the gallery.**
   - Focusing Jambo's empty box lists "Ready analyst questions" and "My
     questions" (`hbAskPopRows`, mode `gallery`).
   - Picking one adds a chart to the Board behind the contract
     (`hbGalleryRun` → `hbAddCard`). Picking one of "My questions"
     (`hbMyqRun`) does the same.
   - The reader sees only the toast.
2. **"/" → the Board's Moves.**
   - After the places list, "/" lists `HB_SLASH`: /compare, /trend, /top,
     /split, /growth, /explain, /whatif, /forecast, /save.
   - /trend fills the box with a chart question.
   - /explain answers "Open a chart first".
3. **"… by " → "Split by".** It offers stage, value stream, counterparty,
   value band… (`hbAskPopRows`, mode `by`).
4. **"… in " → "Period".** It offers the last 12 months, this quarter… (mode
   `in`).
5. **Ctrl/⌘+Z.**
   - The Board's undo runs with a contract in front.
   - It says "Nothing to undo on the board", or quietly undoes a chart change
     the reader cannot see.
   - The Esc handler beside it, which clears an open chart path
     (`s.path = []`), has the same check. It is put right in the same step.

Fine as it is (measured): a real question typed about the contract is
answered about that contract and adds nothing to the Board. Each of the
contract's pages (Overview · Where we are · History) behaves alike, so one
reading covers all three.

## What to build

1. **ONE reading** "the Board itself is in front": `face === 'board'` and no
   contract on it (`!bsCardId()`).
   - Name it once, e.g. `hbBoardInFront()`.
   - Publish it, and use it at every place above.
   - Do not copy the condition five times.
2. **While a contract is in front:**
   - The empty box shows nothing.
   - "/" shows the places only, as it does on the Workspace face today.
   - No "Split by" or "Period" pop-up.
   - Ctrl/⌘+Z and that Esc do nothing (no toast).
3. **On the Board itself:** everything works exactly as today.
4. **A gallery pick on the Board brings its new chart into view**, landed
   through `landOn`, with no light (the 21 Oct ruling). Then the "Added to the
   board" message matches what the reader sees. "My questions" do the same.
5. **Before building,** grep homeboard.js for every other `face === 'board'`
   or `face !== 'board'` check (about 38). For each, decide whether it is
   about "the charts are in front" or "the Board face is up".
   - Change only the first kind, and only where the reader can feel it.
   - Any doubtful one is a BUGLOG line, not a fix.

No new band, no new door, no new words. The Six Questions change nothing here:
this restores what the screen already promises.

## Tests

- **New:** `test/chromium/board-helpers-stay-on-the-board-verify.js`. With a
  contract brought up (`hbStripBring(id,'hist')`, then 'ov' and 'where'):
  - the empty box gives no gallery;
  - "/" gives no Moves;
  - "by" and "in" give no pop-up;
  - Ctrl+Z gives no toast and does not change `hbS().panels`;
  - a gallery pick is impossible.
- **The same check on the Board itself:**
  - all four pop-ups still appear;
  - a gallery pick adds one chart and that chart is in view.
- **Prove the new check:** run it against unmodified main; the contract half
  must fail there.
- **Re-point, never skip,** any existing check that pinned the old behaviour.
  Candidates: home-board-verify, board-copilot-and-analyst-verify,
  jambo-words-verify, f658, f672.
- **Run the Home area's tests** from docs/MAP-TESTS.md, plus `npm run lint` at
  zero errors.
- **Photograph** at 1440×780, 1536×730 and 1366×950.
- **THE MAP:** one line under "HOME — THE BOARD AND THE MAP" naming the
  reading. The story goes to MAP-HISTORY.
