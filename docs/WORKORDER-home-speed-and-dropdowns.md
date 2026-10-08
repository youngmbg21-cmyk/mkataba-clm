# WORK ORDER — Home is quick, a board dropdown is never behind a card, and the Board balances its cards

**Status: WRITTEN 8 Oct 2026. NOT BUILT.** Owner: *"yes fix all three and this
issue where the drop down goes behind the cards. Do not fix yet but add all to
a work order"*. Build only when the owner says so.
Part 5 (the Board balances its cards) was added the same day, owner-asked: *"add this to the work order"*.
Part 6 (Show as table turns the chart into a table) was added the same day, owner-asked: *"one more thing to add to the work order. fix this highlighted button so that when you click, it turn the chart to a table."*
Part 7 (the clause strip on the Paper becomes the TRACK) was added the same day, owner-asked: *"I want to add the implementation of track for the paper page from this artifact"* (artifact "Clause Strip Options", https://claude.ai/artifact/Jpi4zqQH8fzQ2Be8B7u4Xf, option 3 "Track", picked by name).

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

## Part 5 — THE BOARD BALANCES ITS CARDS (owner-asked 8 Oct 2026)

**What the owner wants (their words):** *"train the Board tab to understand
symmetry and the use of space to balance the board."* When a card is summoned
and it is the only card on its row, it uses the space to its right. Two cards
side by side are always equal in height. If one is dug into and grows, the
one beside it grows with it, and the extra space stays empty.

**The owner said YES to all four of these:**
1. An odd card at the end (for example the third of three) stretches full
   width.
2. On a very wide screen, if three cards share a row, all three match the
   tallest.
3. When one card of a pair is closed, the remaining card spreads to fill the
   whole row at once.
4. On a narrow screen, each card takes the full width, one under another.

**What was found (check it yourself; line numbers drift, so grep):**
- The Board's cards sit in `.hb-grid`. Its rule is in index.html, in HaTi's
  own sheet (not the Tailwind blob): two columns with `align-items:start`.
  That is why the cards in a pair end at different heights.
- `.hb-grid>.hb-panel.is-big{grid-column:1 / -1}` is the only full-width
  rule. So a lone card that is not "big" stays in the left half (the owner's
  screenshot: "Where negotiations slow…" with empty space to its right).
- At ≤1180px `.hb-grid` already drops to one column (`@media
  (max-width:1180px)`), so rule 4 may already hold. Prove it in a browser.
- **There is no three-column Board today** (checked 8 Oct: `.hb-grid` is
  `repeat(2, …)` at every width). Rule 2 therefore has nothing to apply to.
  See D.
- The grid is drawn in js/views/homeboard.js (grep `class="hb-grid"`).
  Cards are `.hb-card.hb-panel` (and `.hb-view`). `is-big` comes from
  `p.big || p.split`.

**The build:**
- **A. Equal height per row.** The cards in a row stretch to the tallest.
  The card's inside stays at the top, and the empty space is at the BOTTOM of
  the shorter card: no centring, no stretched charts.
- **B. A lone card fills its row.** A card that ends up alone on a row spans
  the full width. That covers one card on its own, the last card of an odd
  count, a card left behind when its partner closes, and a card after a
  "big" one. Prefer a pure-CSS rule if one does it reliably. Otherwise write
  one function in homeboard.js that marks the lone card on every paint,
  including repaints through `hbMorph`. A card the reader made big stays big.
- **C. Charts redraw at the new width.** The Board draws charts at their
  MEASURED width (`hbFitMeasure`/`_hbFitAt`), so a widened card must redraw
  them. Check that a lone card's bars and charts fill the wider card and are
  not left at half-width.
- **D. Three across.** Only if the Board already allows three columns on wide
  screens; do not ADD a third column. It does not exist today, so say so in
  the summary and leave it.

**Rules to follow (CLAUDE.md):**
- Before starting, grep MAP-HISTORY.md for "HOME — THE BOARD" and for the
  chart standard.
- Find EVERY place Board cards are laid out side by side: the Board face,
  the dig/focus view `.hb-focus`, packs `.hb-pack-cards`, and story chapters
  `.hb-sy-chs`/`.hb-sy-two`. Decide for each whether the rule applies. Tell
  the owner in plain English which you changed, which you left alone, and
  why.
- No new bands. Do not change the phone (it keeps old Home). Fix cascade
  fights by scope, never `!important`.
- Part 2's one-part face switch must not undo this: the balance is
  re-marked on every paint, including a face coming back.

**Proving it (test where the owner looks):**
- In a real browser, test the Board with: 1 card; 2 cards; 3 cards; 2 cards
  where one is dug into until it grows; a pair where one is closed; a narrow
  window. Measure the card boxes: each row's bottom edges are equal, and a
  lone card's width equals the grid's width. Take screenshots.
- Add a browser check for these cases (**board-balance-verify**), guarded so
  a missing feature reports instead of timing out. Run it against unmodified
  main first to show it is red there.
- Run `npm run lint` first, only the Board's test files while working, and
  the full suite once at the end.
- Add one short line to THE MAP's Home section in CLAUDE.md, naming the rule,
  its function or class, and the new test. Append the story to
  docs/MAP-HISTORY.md.

Finish with a short plain-English summary for the owner.

---

## Part 6 — "Show as table" turns the chart into a table (owner-asked 8 Oct 2026)

**What the owner sees.** On an opened (dug-into) board card drawn as bars,
for example a count "by stage" with two bars (8 and 17), the card's tools
read "Show as table · Back to opened". Pressing **Show as table** does not
turn the chart into a table.

**What was found (read only, nothing changed; grep, never trust a line
number):**
- The button is drawn in `hbChartHtml` (the "OPENED, DETAIL IS EARNED
  (O-25)" block) and pressed through `data-hb-table`, which toggles
  `_hbTableOn` and calls `hbPaintBoard`. That part works.
- The table is built by `hbChartTableHtml(svgHtml)`. It reads each piece's
  label from an SVG `<title>` ELEMENT inside a `[data-hb-dig]` piece. The
  SVG charts (ring, blocks, timeline, bubbles) carry one, so they turn into
  a table.
- The HTML charts do not. `hbChartBarsHtml` (`.hb-cbar`) and
  `hbChartColsHtml` (`.hb-ccol`) put the same "label: count" in a `title=""`
  ATTRIBUTE on the button, not a `<title>` element. So `hbChartTableHtml`
  finds no rows, returns `''`, and the chart is left as it was. The button's
  word then flips to "Show as chart" over a chart that never changed (a dead
  button wearing a live one's clothes).

**The build:**
1. `hbChartTableHtml` reads every chart the board draws: the `<title>`
   element where there is one, else the piece's `title` attribute. ONE
   reader, so the table can never say what the chart does not. Each row
   stays the same door (`data-hb-dig`) as its piece. A piece that is
   `disabled` (nothing behind it) is not a row.
2. The table shows the same order as the chart (stage order for "by stage",
   month order for months).
3. **The button never lies.** It says "Show as chart" only when a table is
   actually showing. If a chart truly has no rows to show, the button is not
   drawn (or is greyed with the reason), never a press that does nothing.
4. **Every place this button is drawn:** the opened card, Full screen
   (`_hbFull`), a story chapter opened as its own card, and a pack card when
   opened. Check each chart shape (Chart · Bars · List switch, months as
   columns, the ring, blocks, timeline, bubbles) and the "top N contracts"
   bars. Fix each, or tell the owner in plain English which was left and
   why.
5. The choice is kept as today (`_hbTableOn`, per card) and survives a
   repaint through `hbMorph` and Part 2's one-part face switch.

**Rules that bite:** no new band; the table uses the board's own colours
(light and dark, `--hb-*`); words via `i18t()` in both books (`hb_tab_what`,
`hb_tab_count` already exist); Esc still steps back out of Full screen.

Accept: on an opened card drawn as bars (the owner's "by stage" card), as
columns (months), and as each SVG chart, pressing Show as table replaces
the chart with a table whose rows equal the chart's pieces in labels and
counts; pressing a row opens what the piece opens; pressing "Show as chart"
puts the same chart back. Measured in a browser, light and dark.

## Part 7 — THE TRACK: the clause strip on the Paper (owner picked "Track" by name, 8 Oct 2026)

**What the owner picked.** The drawn options were Wider · Index · Track (the
artifact "Clause Strip Options"). The owner picked **Track**. Build only
that one, as the artifact draws it.

**What is there today (read only; grep, never trust a line number):**
- Home's Paper draws a coloured strip down the left edge of the paper's
  column: `#ig-spine` (`.doc-xr-spine .ig-spine`), painted by
  `igStrandPaint` in js/views/intelligence.js from `docXraySpineHtml(rows,
  {numbers:true})` and `docXraySpineRows` in js/views/contract.js. It is
  `DOC_XRAY_SPINE_W` = 28 px wide, so numbers like 3.4.1, 16.1 and 24.8 are
  cut off. Blocks share the strip's height by weight (`docXraySegH`,
  `XR_SEG_MIN`/`XR_SEG_MAX`); the strip follows the paper
  (`igStrandFollow`); hover shows the card (`igStrandTip`); a press glides
  the paper to the clause and puts a question in Copilot's box, sending
  nothing (`igStrandPress`, the 28 Sep "Ask" ruling).
- **The artifact's note that the strip is also on the Document tab is out
  of date.** The Document tab has drawn no strip since the Thread (5 Oct
  2026); `docXraySpineHtml`'s own comment says so. So Part 7 reaches Home's
  Paper only (and Explorer's "Analyze contract", if it draws `#ig-spine` —
  check, and fix there too or tell the owner).

**What the Track is (as the artifact draws it):**
1. **One thin rail for the whole contract.** A grey rail, 6 px wide, runs
   from the top of the paper's column to its bottom. The top of the rail is
   the start of the contract and the bottom is its end. It never scrolls and
   never passes the bottom of the screen (the 24 Sep ruling still holds).
2. **Each flagged clause sits where it really is.** A short coloured mark on
   the rail, in the clause's grade (ruby · amber · steel, worst on top as
   today), placed at that clause's TRUE position in the contract: its offset
   down the paper divided by the paper's full height, measured off the
   painted paper (the rows `docXrayRows` already returns carry the element).
   Never guessed from the clause number. A longer clause gets a slightly
   taller mark (the same `docXraySegH` weight). Only the marked clauses are
   drawn (the 23 Sep "only the coloured ones" ruling still holds).
3. **Every number reads whole.** Beside the rail, each mark has a small
   label with its clause number (18 px high, white ground, 1 px line, the
   grade as a 2 px coloured edge on its left, the number always dark,
   tabular figures). Labels never overlap: they are pushed apart (at least
   20 px between centres) and pulled back inside the column; a thin leader
   line joins each label to its mark, so a label pushed off its spot still
   points at it.
4. **A window shows what is on screen.** A soft accent-tinted box on the
   rail, outlined in the accent, covers the part of the contract currently
   visible in the paper's column. It moves as the reader scrolls (this
   replaces today's `igStrandFollow` marking). The clause being read has its
   label in bold accent ink.
5. **Same hover, same press.** Hovering or focusing a label shows today's
   card (`igStrandTip`: which clause, how serious, why, "Click to go there
   and ask Copilot"). Pressing a label does exactly today's act
   (`igStrandPress`): the paper glides to the clause, lights it for a
   moment, and a question about it goes in Copilot's box. Nothing is sent
   and nothing is spent until the reader presses Ask. The pressed label is
   shown as on. Labels are buttons: Tab reaches them, Enter presses.
6. **The contract does not move (Six Questions, 3).** The Track is 70 px
   wide and lives only in the grey margin to the left of the sheet (73 px
   on a 1440 px screen with the panel open). Measure the sheet's left edge
   and the first line of wording before and after: they must not move.
   Where the margin is narrower than the Track (a smaller window, Focus,
   the panel wider), the Track does NOT push the paper: it falls back to
   today's thin strip. Say which in the summary, with the widths measured.
7. Light and dark from the app's own tokens (`--st-*` status colours never
   move); `prefers-reduced-motion` respected for the glide and the window.

**Retire, do not leave half-alive:** the 28 px blocks on Home's Paper stop
being drawn where the Track draws. `docXraySpineHtml` stays only if the
fallback uses it; otherwise retire it the house way (and `DOC_XRAY_SPINE_W`
with it) after a grep proves no other caller. The hover card, the press and
the Ask question are KEPT, not rewritten.

**Rules that bite:** NO NEW BAND; the Track draws nothing when no clause is
marked (as today); a refresh lands at the same spot (the paper's scroll, so
the window comes back in the same place); READING MUST NOT WRITE (the Track
reads the painted paper and the marks, saves nothing). The Brain (rule 9):
no new file or route is expected; if one is added it is named in
`BRAIN_PARTS` with its area and lane in the same change.

Accept, in a real browser at 1440 × 900 with the panel open, light and
dark, on a long contract with marks spread through it:
- every flagged clause has one label, every label's number is whole (its
  text is not clipped: `scrollWidth <= clientWidth`), and no two labels
  overlap;
- each mark's place on the rail, as a share of the rail, matches its
  clause's position on the paper, as a share of the paper (within 2 %);
- the window's top and height match the paper's visible part, and move
  when the paper scrolls;
- hovering a label shows the card; pressing one glides the paper to that
  clause and fills Copilot's box without sending anything;
- the sheet's left edge and first line of wording are in the same place as
  at unmodified main (to the pixel);
- at a window narrower than the Track needs, today's strip is drawn and
  the paper still does not move.

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
- **show-as-table-verify** (new, Chromium): Part 6's acceptance. It must
  be red at unmodified main on the bars and columns cases.
- **track-on-the-paper-verify** (new, Chromium): Part 7's acceptance.
  Red at unmodified main (no rail, numbers cut off).
- A unit test of the Track's label spacing: given mark positions that
  crowd together, the labels come out in order, at least 20 px apart, all
  inside the column, and each leader joins its own mark.
- A unit test of `hbChartTableHtml` over a bars body, a columns body and an
  SVG body: each gives one row per enabled piece, with the piece's label,
  count and door.
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
