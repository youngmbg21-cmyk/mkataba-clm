# WORK ORDER — Home is quick, and a board dropdown is never behind a card

**Status: WRITTEN 8 Oct 2026. NOT BUILT.** Owner: *"yes fix all three and this
issue where the drop down goes behind the cards. Do not fix yet but add all to
a work order"*. Build only when the owner says so.

**What the owner asked for, in their words, before this:**
*"please check why there is a lag when i try to get into the home page and also
in navigating between the tabs in the home page"*. The check was made, and the
owner said yes to the three fixes proposed (Parts 1–3). Part 4 is the
dropdown in their screenshot: on the Board, the open SPLIT list of the card
"Show me the number of contracts drafted the last 4 months" ran down over
the card below it ("Payment terms against our standard"). The card below was
drawn ON TOP of the list, so its words ("Show these on the map",
"WHAT THIS SHOWS") showed through and the lower choices could not be pressed.

**THE GOAL IN ONE LINE:** nothing on Home freezes the screen for longer than a
person notices (about 0.1 s). Same pictures, same numbers, same doors. Only
the speed changes, and the dropdown sits on top.

---

## What was measured (8 Oct 2026, main at 0fc3b49)

Measured in Chromium at 1440×900 on the sample workspace (30 contracts), then
with the book copied up to 430. A "freeze" is a browser long task (50 ms or
more). Opening Home asks the server for NOTHING, so all of the lag is in the
browser. The Lifted panel merged the same day is not a cause.

| Act | Freeze, 30 contracts | Freeze, 430 contracts |
|---|---|---|
| Contracts page → Home | 144 ms | 244–355 ms |
| Home: → Paper or → Board | 80–110 ms | 120–160 ms |
| Home: → Explorer | 379 ms | **1,156–1,222 ms**, then many 50–90 ms freezes |
| Sitting still on Explorer | busy 2.3 s of every 4 s | worse |
| Sitting still on Board or Paper | 0 | 0 |

Where the time went (CPU profile, names to grep, never trust a line number):
- **Every face switch rebuilds all of Home.** `hbSetFace` → `hbMount` →
  `renderIntel` rebuilds the whole page HTML, the Copilot panel
  (`renderIntelDock`) and the board (`hbAfterMount` → `hbPaintBoard`). Then
  `hbSetFace` calls `renderIntelDock` AGAIN. That makes two full panel builds
  per press (20–100 ms of own time each).
- **Explorer re-lays its map on every arrival.** `rebuildIntelGraph` →
  `makeIntelGraph`, then `for (i < 220) igTick()`. `igTick` compares every
  node with every other node, so its cost grows with the square of the
  book: 688 ms of the 1.1 s freeze at 430 contracts.
- **Explorer never rests.** The `loop` in `renderIntel` runs `igRender` on
  every frame while the map shows (`igTick` on every fourth frame even off
  the Wiring view). `igRender` reads `IG.svg.getBoundingClientRect()` every
  frame AFTER `igbPlace` has written to the page, so each frame forces a full
  layout: 336 ms of `getBoundingClientRect` in 1.8 s. `igbDraw` repaints the
  whole canvas every frame even when nothing moved.
- **Entering Home builds everything at once.** `setView` → `renderDashboard`
  → `hbRender` → `hbBoardHtml` (81 ms at 430), with the Insights shelf worked
  out inside the same press (`hbInsChart` → `hbInsCandidate`, 35–51 ms). Then
  `scrollTo` and `syncViewHeight` make the browser measure the page twice
  more (about 55 ms).

---

## Before anything: read, and find every place

Read CLAUDE.md, then grep docs/MAP-HISTORY.md for these headings and read
each in full: "HOME — THE BOARD AND THE MAP", "HOME FIRST", "INSIGHTS",
"PERFORMANCE — THE BOOK IS WALKED ONCE", "A REFRESH LANDS AT THE SAME SPOT",
"AN OPEN DROPDOWN IS ON THE SCREEN" (in homeboard.js) and "THE LANES, AND THE
PAPER'S PANEL LIFTED".

**DUPLICATION WARNING (Bug Fix Rule 1).** `renderIntel` draws BOTH Home
(`onHome`) and the Insights page's map. The Explorer canvas (`IG`,
`igRender`, `igbDraw`) is the same on Home's Explorer and on Insights. The
board's dropdowns are ONE builder (`.hb-rmenu`, placed by `hbRcMenuPlace`)
used by every board card (Contracts, Split, Picture, Measure, More). Fix
each part everywhere it is drawn, or tell the owner in plain English which
place was left and why.

**WHAT MUST NOT CHANGE.** Every picture, number, door, word and colour on
Home stays as it is. Rules that still bite:
- A REFRESH LANDS AT THE SAME SPOT: the face, the board's scroll and an open
  card come back after a refresh (`placeSave` / `placeResume`).
- The Paper keeps the paper's width and the Lifted panel (home-first 3d,
  3a2–3a4).
- READING MUST NOT WRITE: nothing new may save to the record.
- NO NEW BAND: no "loading" strip. A part not drawn yet shows its own resting
  state, in place.

---

## Part 1 — Explorer: keep the map, let it rest (the biggest win)

1. **Keep the laid-out map between visits.** Build the graph model and run
   the 220 settling steps only when what it draws has changed: the book,
   the grouping, the lens or Copilot's grouping. Leaving for Board and coming
   back reuses the settled map and the camera. Key the kept map on a cheap
   fingerprint (contract ids + updated times + `intel.groupBy` +
   `intel.groups` + the active lens). Never key it on the page's height.
2. **Settle off the press.** When the map MUST be rebuilt, draw the first
   frame at once from the kept or rough positions, and run the settling steps
   in small slices across the next frames (or in idle time). The press never
   waits for 220 rounds.
3. **Stop drawing when nothing moves.** The frame loop pauses when the map
   has settled, the camera is still, no glide or fold is running and the
   pointer is not on the map. It wakes on any press, drag, wheel, hover,
   view change, fold, lens or new answer. The gentle drift on the Wiring view
   may stay, but at a low frame rate, and only while the map is on screen
   and the tab is visible.
4. **Measure the canvas once, not every frame.** Read the size of `IG.svg`
   in a ResizeObserver (and on the view change), never inside `igRender`
   after a write.
5. **Leaving stops the loop at once.** No frame of the map is drawn after
   Board or Paper is showing.

Accept: at 430 contracts, the switch to Explorer freezes for less than
100 ms the second time and less than 300 ms the first time, and sitting on a
settled Explorer for 4 s keeps the browser busy for less than 200 ms. Every
explorer-* and analyze-on-the-graph verify file stays as it is today (green
or on KNOWN_RED for the same reason).

---

## Part 2 — Switching Board · Paper · Explorer: swap one part, build the panel once

1. **The face switch repaints only what differs.** The head row, the ask box,
   the Copilot panel and the page frame stay. Only the stage shows the other
   face, and the head's face buttons repaint in place (`hbPaintHead` already
   exists for this). Board's cards are not rebuilt by switching to Paper and
   back unless something they show has changed.
2. **The Copilot panel is built once per switch, or not at all.** Remove the
   double `renderIntelDock`. Only what changes with the face is repainted:
   the head's tabs (Copilot alone off the Paper, the contract's tabs on it,
   `data-pd-head`) and the ask box's "about".
3. Keyboard focus stays on the pressed face button (today's rule in
   `hbSetFace`).

Accept: at 430 contracts every switch between Board and Paper freezes for
less than 60 ms. home-first, copilot-door, copilot-jobs, read-then-ask,
deal-on-the-paper and the board-* verify files keep their results.

---

## Part 3 — Opening Home: the board first, the shelf a moment later

1. **Draw the board's frame and its cards first.** The Insights shelf
   (`hbInsChart` and its candidates) is worked out just after the first
   paint, and dropped into its own place. That place keeps its height while
   it waits, so nothing on the page jumps (no new band, no "loading" words).
2. **Measure once.** Fold `scrollTo` and `syncViewHeight` into one read
   after the paint, so the page is measured once, not twice.
3. **Remember the expensive readings for the sitting.** The once-a-day
   Insights reading (`hbInsightsToday`) and the board's candidates are kept
   until the book changes, so a second visit to Home in the same sitting
   does not redo them.

Accept: at 430 contracts, Contracts page → Home freezes for less than 150 ms,
and the second visit for less than 100 ms. home-page, insights-shelf and
pointer-only verify files keep their results. A refresh still lands on the
same face, scroll and open card.

---

## Part 4 — A board dropdown is always on top of the cards

**What is wrong.** A card's dropdown list (`.hb-rmenu`, placed by
`hbRcMenuPlace`) opens downward over the next card, but the next card is
painted above it. The likely cause is that each card makes its own layer, so
a later card stacks over an earlier card's list whatever the list's z-index
is. Triggers include a transform, an opacity animation from `hbMorph`, a
backdrop-filter, `contain`, or `isolation`. MEASURE it first, in a browser:
open the SPLIT list on a card with a card below it, and read
`document.elementFromPoint` at the middle of a covered choice. Today it
returns the lower card, not the list.

**The fix** (by scope, never `!important`, per the standing lessons):
- While its list is open, the card's layer is raised above its neighbours
  (for example the open card's root gets a higher stacking level). Or, if the
  card must keep its own layer, the open list is drawn in the board's top
  layer instead and placed against the button.
- `hbRcMenuPlace` keeps working (it opens upward where there is more room
  above, and its height never passes the room it has). If the list moves to
  a top layer, it must still follow the button on scroll and close on scroll
  or Esc, as today.
- **Every board dropdown, not only SPLIT:** CONTRACTS, SPLIT, PICTURE,
  MEASURE, More and the card's own menus. Check the same fault on the other
  pages that draw `.hb-rmenu` or a list inside a card (the Explorer's view
  bar, the Insights tabs), and fix each one or name it to the owner.

Accept: on a board with two cards stacked, the open SPLIT list of the upper
card is the element under the pointer at every choice it shows
(`elementFromPoint`), in light and dark, at 1440 and 1100 wide. Pressing
the lowest visible choice applies it.

---

## Tests to add (each run at unmodified main first: it must FAIL there)

- **home-speed-verify** (new, Chromium). Seeds the sample book and copies it
  to 430 contracts in the page, as the measuring script did. It asserts:
  - the long-task totals in Parts 1–3;
  - the busy time while sitting on a settled Explorer;
  - that no `igRender` frame runs while Board shows.

  Every limit is a RELATION with headroom for CI's slower machine (for
  example "the second Explorer arrival costs under a third of the first",
  and "sitting still costs under 5% of the time"). Bare millisecond limits
  that fail on a slow runner are not allowed. Each wait asks for the state,
  bounded, and never pauses for a fixed time.
- **board-dropdown-on-top-verify** (new, Chromium): Part 4's acceptance, for
  every dropdown on a card that has a card below it.
- A unit test pinning the kept-map rule (Part 1.1). The same fingerprint
  gives the same kept map, and a changed book, grouping or lens gives a new
  one.

The measuring script used for the numbers above is reproduced in
MAP-HISTORY under this order's heading when it is built.

---

## When it is built

- CLAUDE.md MAP: the HOME and INSIGHTS sections gain one line each naming the
  kept map, the resting loop and the one-part face switch. PERFORMANCE gains
  the Home numbers. The full story goes to MAP-HISTORY.md.
- The Brain (rule 9): no new file, route or act is expected. If one is added,
  it is named in `BRAIN_PARTS` and given its lane (rule 9b) in the same
  change.
- Run lint, the affected unit tests, the affected verify files, then the full
  suite once. Merge only on the owner's word.
- Tell the owner in plain English:
  - each part's before and after numbers;
  - every place a fix reached;
  - anything left alone, and why.
