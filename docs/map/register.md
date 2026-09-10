# HaTi — register

*the Contracts and Negotiations lists: columns, filters, rows, sorting, paging*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## THE CONTRACTS PAGE TAKES THE ENTERPRISE DESIGN (owner-approved render, 24 Aug 2026)

The second page of the page-by-page pass, and the one every home tile lands on.
It reaches **Contracts AND Negotiations, because both are ONE table** —
renderRegister — so every line below was checked on both seats.

**THE ROW IS ONE LINE AND 36px, AND THAT IS THE OWNER'S OWN TRADE** ("drop the
document type and go with 36px rows"). The document KIND sat on a quiet second
line under the title and **that second line WAS the row's height**: 4px of
padding above and below TWO line boxes (20 + 16) measured 45. It is 36 now,
which turns about 17 contracts on a 1440x900 laptop into about 24. The trade was
named before it was built, because 23 Aug had deliberately KEPT that line as
"the one place in a row where a size difference is still carrying something" —
this REVERSES that IN PLACE, on the owner's ruling, and the fact is not lost:
the kind rides the title's own hover, and the VALUE STREAM it used to sit beside
is now a column.

**THE HEIGHT IS STATED ON THE CELL, AND MEASURED AT EVERY STEP.** The arithmetic
alone does not land — with 8px of padding above and below a 20px line the row
still came back **38.2**, because an inline-flex child sits on the BASELINE and
the strut adds its descender space underneath. Two intermediate fixes (the ⋯
button's own padding at 23.6px, then `vertical-align:middle`) each moved it and
neither reached 36. `--reg-row-h:36px` on `.reg-table` with `height` on the td
is the design's own rule, **and on a table cell a stated height is a FLOOR
rather than a cap** — a td grows past it when content needs to, which is what
makes it safe here where it would not be on a div.

**THE STAGE IS A DOT AND A WORD, AND THAT MADE A FOURTH DRESS FOR ONE READING.**
It was a filled chip, and five running down the middle of the page read as five
buttons. So `contractStatusMeta(c)` is the branch — partially-signed, expired,
counterparty-ready, else the status — and **every dress asks it**:
contractStatusTextHtml (the room head's sentence), contractStatusDotHtml (this
row), with the chip and contractStage still asking the same predicate. Three
copies of "which branch applies" is how they come to disagree; f237's claim was
WIDENED to pin the shape rather than the old literal.

**THE LINK COLUMN GAVE ITS PLACE TO THE VALUE STREAM.** The link column answered
"what happened to the link you sent them" — a fact about ONE contract rather
than something you scan a register for, and it drew an em-dash on every row of
an ordinary workspace. **THE FACT IS NOT LOST**: the contract's own shares
section draws the whole journey (renderSharesSection / shareJourneyHtml), and
**the STREAM DRAWER keeps its column** — a drawer is one stream's contracts,
where "have I sent this one out" IS what you are scanning for. One builder
still (shareLinkCell), so the two cannot drift. In its place the stream is
written out, because the 3px tick was the ONLY carrier and was explained by a
legend at the very foot of the page — this file's own standing rule is that
colour is never the only carrier. The tick stays; it is the fastest thing on the
row. f97's "both tables" claims were reversed in place.

**THE ROW'S TEXT VERB IS GONE, THE ⋯ STAYS.** "Review terms" / "View contract"
sat beside the ⋯ while pressing the row already opened the contract, so the verb
mostly restated the stage two columns along. The ⋯ keeps every act — it is the
only way to archive, export or delete from this page — and its own first row
("Open workspace") is what the verb did. **`regPrimaryAction` now has NO
CALLER**: left exported rather than deleted, on this file's convention for a
builder whose feature has gone, so a third caller cannot bring the column back
through a door nobody remembered. `.reg-actlink` and `.reg-kind` are STALE —
flag any mention.

**A FILTER SAYS WHAT IT FILTERS.** Five bare dropdowns whose only label was a
title attribute, so two of them reading "Any" sat side by side meaning different
things. The label is drawn above; the select keeps its id, options and title, so
every handler and test is untouched. **THE LABEL AND THE TOOLTIP ARE TWO
STRINGS** — the first draft used `reg_saved_views_title` as the label and its
sentence ran to 460px and pushed the bar off the row; `reg_saved_views` is the
label, the sentence stays the hover. `reg_lifecycle_stage` is NEW in both
languages: it was a hardcoded English tooltip and is now visible text.

**WHAT WAS DELIBERATELY NOT TAKEN FROM THE DESIGN**, each said out loud: its
footer's "Create" button (this page already has "+ New contract" at the top, and
two ways to create one contract is how a reader stops trusting either), and its
row height applied to the STREAM DRAWER, which is a different screen and was not
in the ask.

**THE COLOUR CENSUS WAS RE-RECORDED FOR IT, AUDITED FIRST**, and it is the
smallest kind of re-record: **one screen, both themes, and every value
explained.** GONE are the chip's BACKGROUND WASHES — `rgb(209,250,229)` and
`rgb(241,245,249)` in light, their two dark twins — which left with the chip;
ARRIVED is the grey DOT's ink in each theme. The word's inks did not move at
all, which is why only the washes went: the stage still says its tone in text.
Read as a SET DIFFERENCE, never as a diff — the baseline re-orders, so every
value appears on both sides of the patch and reading it tells you nothing.

**THE COLUMNS DO NOT MOVE WHEN YOU TURN THE PAGE (owner-reported 24 Aug 2026:
"when you click through the pages, the columns move which is not how i want it …
there should be no scrolling from left to right to see the whole page").** An
AUTO table sizes each column to the content of the rows it is CURRENTLY showing,
so a page of long names widened the title and shifted every column beside it.
MEASURED on a 150-contract book: the title column was 217px on page 1 and 306px
on page 3, all seven others moved with it, and pages 2 to 4 scrolled sideways by
27 to 36px. `table-layout:fixed` reads the widths off the head row and holds
them whatever the page shows — the same fix, and the same lesson, as the
calendar's obligation table.

**EVERY WIDTH IS A PERCENTAGE AND THEY SUM TO 100**, which is what turns "no
left-right scrolling" into a guarantee rather than something that happens to
hold at today's window: the table is exactly its pane, at every width, on every
page. **`overflow:hidden` ON THE CELL IS THE OTHER HALF** — several cells carry
nowrap content, and in a fixed layout a child wider than its column spills over
the one beside it rather than widening the table. The two per-cell `max-width`
values on counterparty and stream went with it: the COLUMN is what governs now,
and a cap on the cell would fight it.

**SIX OF THE EIGHT ARE IDENTICAL ON BOTH PAGES.** Only the title and the last
column differ, and only because the last holds a ⋯ on Contracts and a sentence
about whose move it is on Negotiations — the title is the column with the give.
The type size was already one value for both (one builder), so no reduction was
needed and none was made.

Tests: f97's source claim RE-POINTED (the stream heading is no longer a bare
th), contracts-page-verify sections 10 and 11 (**5 of them fail against the code
of an hour before, and reproduce the reported sideways scroll at 27-36px**),
flat-rows-and-alerts-verify 2d REVERSED IN PLACE and 2e/2f re-pointed — that
head was rebuilt on the 24 Aug render and the file had been red for it since.

Tests: f240's three claims REVERSED IN PLACE (the verb's absence, the kind's,
and the stated height), f97's two reversed (one table draws the link column
now), f237 WIDENED to the one-branch shape, contracts-page-verify (browser).

THE REGISTER WEARS THE LINE DESIGN (owner-approved mockup, 20 Aug 2026 — measured off the owner's own HTML, and it reaches Contracts AND Negotiations because both are ONE table, renderRegister): flat white table ruled by hairlines, uppercase 10.5/700 header on the surface itself (the grey band is gone), teal tracking numbers (.reg-mk), regular-weight titles with the document KIND on a quiet second line (.reg-kind — cKind, the same reading the stream drawer prints), the stream tick moved OFF the row's left edge to a 3px span BESIDE the title (.reg-tick), values regular weight, and the expiry cell in the mockup's own shape — a fixed numeric dotted date (regDotDate, "25.08.2026" — digits carry no month word, so the months-follow-the-language rule has nothing to translate; the stream drawer's folderExpiryCell reads the same helper) with the countdown as "· N d" at 10.5/700 in its urgency colour (red inside 30 days, amber to 90 — thresholds unchanged; reg_in_days is "{n} d" in BOTH languages and sits on f148's SAME_IN_BOTH list). The bands, sorting, paging and every verb: untouched.

**AND THE ROWS READ AT ONE SIZE AND ONE WEIGHT SINCE 23 Aug 2026** (owner-asked off a render: "apart from the headers, the letters and numbers in the rows are all not bold and the same font size but the font colour differences are still intact"). SEVEN things in a row were set larger or bolder than their neighbours and every one is **14px regular** now: the tracking number (`.reg-mk`, was 13/600), the status chip, the urgent expiry date (which carried 700), the "· N d" countdown (10.5/700), the row's verb (`.reg-actlink`, 13/700), the ⋯, and — on Negotiations — the whose-move words (`.ngl-w`, 13/700). **NOT ONE COLOUR MOVED**, and that is the whole condition on flattening the type: the teal reference, the three status washes, the ruby and amber countdowns, the three whose-move inks and the stream tick are exactly what they were. **THE HEADERS ARE THE EXCEPTION AND THAT IS THE POINT** — the column heads and the three group headings keep their 700 and their letter-spacing, because with every row at one weight they are the only thing left telling a heading from a row. **THE DOCUMENT KIND STAYS AT 12px**, owner-chosen having been shown it at 14: it is a second line under the title, and at the title's own size it competes with the title and costs every row four pixels of height — the one place in a row where a size difference is still carrying something. **THE STATUS CHIP IS FLATTENED AT `.reg-table .badge`, NEVER AT `.badge`** — that class dresses every card, list and panel in the product and this is a decision about a table row. **THE CONTRACT ROOM'S FACT ROW KEEPS ITS BOLD** (`.room-facet .v .ngl-w`): one builder, two homes, and only the LIST was reported. **FIVE OF THE SEVEN WERE INLINE STYLES** and had to be changed in the markup — a class rule cannot beat one without `!important`. NOT SWEPT, said out loud: the amber question chip (`questionDot`) keeps its 12/700 — it is a marker like the link dot rather than a cell, it draws on almost no rows, and it is shared with other screens; and the PHONE's contract cards are their own shape and were not in the ask. Tests: f240, flat-rows-and-alerts-verify (every painted cell measured on both lists — 18 of its 36 checks fail against the code of an hour before).

**WHERE A BAND PINS IS MEASURED, NEVER TYPED** — see THE TWO HEADS SAY THE NAME AT ONE SIZE: the header's height is written as `--reg-head-h` by regFitBandOffset, so a change to this header's padding or type cannot leave a slot for rows to scroll through.

THE HOME PAGE IS THE ENTERPRISE DESIGN (owner-approved render, 24 Aug 2026 — this SUPERSEDES the Hero B banner of 20 Aug and the pipeline ring of 13 Aug). A greeting row, then three sections: **My work** (four tiles the reader chooses), **Portfolio** (four fixed), **Needs your decision** (rows). Nothing on it scrolls inside itself, so `.hm-page` is a plain column and no longer pins itself to `--view-h`.

**WHAT LEFT, AND WHERE EACH PART WENT** — nothing was simply deleted. THE HERO BANNER: its greeting is a plain line at the top of the page; its title, `home_clm_title`, moved into the SHELL BAR (`shellTitleFor`, which is where a console names the page you are on) and still turns over into Swedish; its three live facts are said by the tiles, which is where a number belongs when it is also a door. `.hm-banner`, `.hm-banner-greet`, `.hm-banner-cta`, `.hm-banner-ghost`, `.hm-kpi-bar` and `home_hero_managed/_value/_need` are STALE — flag any mention. THE EMAIL WARNING STRIP moved to the ALERTS PANEL as a registered kind (`email-off`), ADMIN-ONLY because nobody else can act on it, and ranked LAST because every row above it is work with somebody's name on it. `emailSetupLineHtml` survives as a builder with no caller — exported, so a third caller must not be able to bring the band back through a door nobody remembered.

**ONE RULE DECIDES WHERE A TILE GOES: a card opens the list that would change its number.** It settles the two awkward ones — Compliance opens the contracts that FAIL (`contractRisk>=60`, the same reading the percentage was worked out from), not all of them, because a list of everything tells you nothing; and Turnaround, which looked like it had no list at all being an average, opens the contracts signed in the last ninety days, which are the ones the average is made of. **THE NUMBER AND THE LIST MUST MATCH** — each destination narrows with the reading the tile counted, never a near-enough one, and home-page-verify presses a tile and counts what arrives.

**A CARD COUNTING ZERO IS NOT A DOOR.** The zero still draws, because it is true; the arrow goes and the press is refused. HOW it is refused differs by kind and that is deliberate: a fixed Portfolio tile takes `disabled`, so the browser itself declines and a keyboard reader is told; a My-work tile is ALSO the drag handle for reordering the four, and a disabled button fires no drag events — so it takes `aria-disabled`, loses its destination and its arrow, and the click handler checks `.is-dead`. Disabling it would have taken away the only way to move a zero card out of first place.

**THE DEFAULT FOUR CHANGED** (owner-ruled): approvals · negotiations · expiring90 · avgcycle — "what needs me today". `under_mgmt` and `compliance` left the top row because the row BELOW already says both (the lifecycle tile's footnote prints the agreement count; Compliance is a fixed tile). Nothing left the catalogue; `negotiations` JOINED it, counted off `negoLiveList` — the same reading the sidebar door and the Negotiations page print, READ WITHOUT WRITING (negoChanges would start a negotiation on every contract merely by counting them). KPI_MAX is untouched at four and governs the TOP row only.

**COPILOT SPEND BECAME COPILOT COVERAGE** (owner-ruled): "N still to read", how much of the live book Copilot has been through. Spend was the only figure on the page in dollars while everything else is in shillings, the only one an ordinary reader could not act on, and the only one with no list behind it; the money stays in the sidebar foot and in Settings. READ = one stored finding against the current wording — a brief, a playbook pass or a risk scan, ANY ONE of the three (asking for all three leaves the number permanently bad). **OBLIGATIONS ARE DELIBERATELY NOT ONE OF THEM**: a person can type one by hand, so counting the list would book somebody's own work to Copilot. **THE BRIEF IS ASKED VIA `_hasBrief`**, a boolean the LIST route attaches from one query — the memo itself rides only the single contract's GET, so a count built on `_brief` alone would be right locally and short in server mode, which is this codebase's recorded defect class (the dashboard's "raised by me", Reports' cycle time). It is transport: stripped on save beside `_brief`.

**THE LIFECYCLE TILE REPLACED THE RING**, and its three blocks — count, bar, word — are three DOORS into the register at that stage. What was lost was named before it was built: reading a stage's contracts without leaving the page. The register shows more per contract than the cramped column did; one press either way. RETIRED WITH IT: `hmArcsHtml`, `hmKeyHtml`, `hmSideHtml`, `hmSideHeadHtml`, `hmPaint`, `hmFit`, `_hmStage`, `RING_MIN`/`RING_MAX`, `PIPE_DOT`, every `.hm-pipe-*` and `.hm-ring-*`, and `home-pipeline-ring-verify.js`. **`.hm-row` WAS THE TRAP**: the retired card's own row rule sat LATER in the sheet at equal specificity and won, so the new decision rows drew `display:block` and dropped their tag and chevron onto a second line. A stale class name is not inert when a live one takes its name.

**A READER WITHOUT `canViewValues` GETS NO MONEY HALF OF THE LIFECYCLE TILE AT ALL** — not a dash under a money label. "Active value under management: —" tells them there is a figure and that it is being kept from them, and the label alone failed this page's own no-money sweep.

**Tests:** f3 (the panel roll call, the money sweep and the lifecycle blocks — three claims REVERSED IN PLACE), f96 (the theme menu's whole block reversed onto the two axes), f240 and flat-rows-and-alerts-verify (the alert-order claim rewritten as a RELATION, not the literal end of the list), kpi-four-verify (fixture corrected — the default four changed, so the metric it presses as "locked" had to change with it), nav-floats-verify (the widths and the column's size are READ FROM THE APP now, never typed — it reported four faults that did not exist the day the line and the column moved), laptops-verify (the dashboard is a document, so what is guarded is that nothing is clipped and the page never scrolls sideways), negotiations-door-verify (the repaint-is-not-a-navigation probe re-pointed at the brand swatch), and **home-page-verify (NEW, 24, browser)** — which REPLACES home-pipeline-ring-verify.js, deleted with the card it measured.

**THE ONE ACT IS WHITE** (owner-asked): white face, accent outline, accent ink. It reads `--color-surface` rather than a literal `#fff`, so it is white in light and the panel colour at night; and `--accent-ink` rather than the accent ramp, because ONLY that token has a dark answer — measured, the ramp gave 3.26:1 at night and the token gives 9.59:1. KPI cards keep their **3px top edge in the metric's own tone** and the hover must NEVER touch borderColor or it erases the edge. SAME IDS (`#kpi-customize`, `#hero-draft`, `#kpi-grid`) so the picker and the one new-contract menu are untouched.

THE WORKSPACE-STATUS FOOT FOLDS (owner-asked 20 Aug 2026): at rest the sidebar's bottom holds only a slim handle — dot, title, chevron (#foot-toggle) — and pressing it slides the status card (#foot-sheet) UP over the nav, transform + visibility, the left panels' own mechanism; Escape and the handle close it; open state is per sitting, on the element. The card's ids are untouched so updateSidebarStatus writes where it always wrote (the admin's spend door included). The freed height is what stopped the nav list scrolling. The 64px rail hides the foot entirely — it used to show bare dots there, retired with the fold.

THE NAV at rest is the OPEN 256px column above the 1500 line (railCollapsed's null default flipped; a stored choice still wins; below the line nothing changed). Items read 13px/400. nav-floats-verify's above-the-line claims reversed in place: the first press now collapses and stores '1'.

Tests: f3/f56 sentinels re-pointed (the "Key metrics" caption retired; "High-risk findings" now also titles a bottom card, so the sixth-KPI claim reads data-kpi-id, not page text), home-pipeline-ring-verify 54/54, kpi-four-verify 19/19, nav-floats-verify 67/67 with the two reversals above.

## AN ANSWER IS A WORKLIST, AND "SAVED VIEWS" WAS NEVER ONE (owner-asked 9 Sep 2026)

*"tell me how you delete a previously built saved view?"* — and the answer is
that **you cannot, because you cannot build one.** `REG_VIEWS` is seven presets
written into js/views/register.js and nothing anywhere in this product creates a
saved view, so there is no list of the reader's views to manage and no delete
anywhere. The owner had gone hunting for a button that could not exist, because
the control's own name promised a feature nobody had built.

- **IT IS `reg_quick_filters` NOW — Quick filters / Snabbfilter**, label and
  tooltip, owner-ruled. **THE KEYS MOVED WITH THE WORDS**: a key named for what
  a control used to say is a trap for whoever searches next, so
  `reg_saved_views` and `reg_saved_views_title` are STALE and are GONE rather
  than left answering — f268 asserts both are `undefined` in both books and that
  the renderer asks for neither. **THE FILTER'S OWN KEY IS STILL `'view'` and
  must stay**: that is what `R.view` and the stored bar preference
  (`hati.v1.regBarFilters`) are written under.
- **REAL SAVED VIEWS ARE NOT BUILT AND WERE NOT ASKED FOR.** Named, kept,
  renamed, deleted — with the separate question of whether a view is one
  reader's or the company's — is its own job with its own store.

**THEN THE WORKLIST DOOR — idea 25.** A question about the book and a filtered
list of the book are the same thing seen twice, and the second was unreachable:
the cards under a Copilot answer open ONE contract each, so *"which of these ends
inside sixty days and has nobody on it"* left the reader opening eight contracts
one at a time — or rebuilding the question by hand in the filter bar, where
several of these answers cannot be rebuilt at all.

- **IT SPENDS NOTHING AND ASKS NOTHING.** The ids are already on the answer: the
  model names its contracts as CITATIONS, the route resolves those into `cards`,
  and `aiRenderServerAnswer` turns them into records — every local branch hands
  `aiCards` real records too. So this is a reading of an answer that has already
  arrived, never a second question and never a second call. f268 greps the
  builder for `copilotAsk`, `fetch(`, `api(` and `ai/`.
- **ONE DOOR.** `regShowOnly(ids, label)` is the register's only way in and it
  brings its own two safety properties with it — the chip SAYS what the list is
  narrowed to, and the way back is on that same chip. **Nothing here narrows
  anything itself**: f268 fails on `R.only =` or `regSetScope(` appearing in
  js/ai.js.
- **IT CARRIES NO COUNT, DELIBERATELY.** The register narrows FURTHER inside a
  named set — a stage filter the reader left on still applies — so a figure on
  this button could promise seven and land on three, which is the one thing a
  door must never do. **The count is not lost**: the "Show all N" expander
  directly above already prints how many the answer holds, so this is the same
  fact declining to be printed twice in the one place it could be wrong.
- **BUILT INSIDE `aiCards`, WHICH IS WHAT MAKES IT ONE DOOR RATHER THAN
  ELEVEN.** Every branch of the intent engine and the server answer alike reach
  the reader through that one function, and **the phone draws the same markup**
  through renderAIFeed. It reads AFTER the expander, because it is the act on
  the whole list rather than part of the list.
- **DRAWN FROM TWO (`AI_WORKLIST_MIN`).** A worklist of one contract IS that
  contract and its card is already the door. **And never where `regShowOnly` is
  not on the page**, so it can never be a press that does nothing — the
  product's own "a verb that cannot work is not drawn" rule.
- **THE LABEL IS THE READER'S OWN QUESTION, READ AT BUILD TIME** — `aiFmt`'s own
  reasoning one function along: this runs while the answer is being built, so
  the last question on the record is the one being answered. Read at the PRESS,
  an older answer's button would carry whatever was asked most recently.
  **Trimmed at `AI_WORKLIST_LABEL_MAX` (60)**, because the chip it lands in sits
  on a filter bar the owner has twice ruled must fit one line and **that chip
  sets no width of its own** — so the trimming is this builder's job rather than
  a change to the chip. An empty ask stays empty: the chip has its own fallback
  sentence and inventing one here would be a second answer.
- **THE PRESS CLOSES THE PANEL FIRST**, which is the card handler's own move one
  line up and for the same reason: this drawer covers the right of the window,
  so landing the reader on a narrowed register with the thing that sent them
  still over it is half a journey.
- **THE LABEL LANDS IN AN ATTRIBUTE AND IS FREE TEXT A PERSON TYPED**, so it
  goes through components.js's published `esc` — the one that escapes quotes as
  well as angle brackets, and whose own note says why. A contract id is minted
  `MK-<n>` and carries no space, which is what lets the whole set travel in one
  attribute; f268 fails the day an id gains one.

Tests: f268 (31 — **24 of them fail against the parent**), **answer-worklist-verify
(19, browser — the only place the four things that decide whether this works can
be asked at all: is the door VISIBLE PIXELS rather than markup behind something,
does a real press land on the register, is it narrowed to exactly the answer's
contracts, and does the way back work. The answer is SCRIPTED THROUGH THE REAL
SERVER PATH rather than staged as markup, and it names a SUBSET of the book on
purpose — an answer naming every contract there is cannot answer whether
clearing widens the list. 8 of its 19 fail against the parent**),
contracts-page-verify (one comment re-pointed: its claim is about label LENGTH,
so a rename costs it nothing).

## WHOSE MOVE IS ONE WORD (owner-asked 25 Aug 2026)

Off a screenshot with the Negotiations page's last column ringed: *"change the
highlighted area to simply Mine, theirs, etc."* The cell printed a sentence —
"1 needs you", "2 changes not sent yet", "With Saw Sawa LLC", "Nothing
outstanding" — and now prints **Mine · Theirs · Neither**.

- **THIS REVERSES negoMovePillHtml'S OWN NOTE**, which argued the counterparty
  should be NAMED because "With Saw Sawa Ltd" answers what a reader scanning
  this page is deciding. **TWO THINGS WERE WRONG WITH IT.** The name is already
  on the row, two columns to the left, so the cell was repeating a cell you can
  already see; and at the width this column gets it was being **CUT** — the
  owner's screenshot reads "With Saw Sa…", "With Juno Li…", "1 change not…" —
  so the detail it was defending was not on screen anyway.
- **NOTHING IS LOST ON THE DESKTOP**: the sentence each cell used to print is
  the cell's own **hover**, which is the treatment the status chip beside it
  already takes ("a table cell has no room for a sentence"). f184 asserts the
  word and the title AS A PAIR, because losing the sentence altogether is as
  much a failure as losing the word.
- **THE PHONE HAS NO HOVER and therefore does drop the count** — said out loud
  rather than absorbed. Its card already prints the counterparty on a line of
  its own, so only the number goes. ONE BUILDER, THREE HOMES (the Negotiations
  column, the contract-room and negotiation-page fact row, the phone card): a
  word written at a call site is how the three would come to disagree, so the
  change is in the builder and reaches all of them.
- **THE THIRD STATE WAS EXEMPTED AT FIRST AND THAT WAS WRONG.** "Nothing
  outstanding" was kept on the reasoning that it is not an answer to *whose*
  but the absence of one — and photographing the column killed it: the cell
  drew "Nothing outst…", so the one cell still being cut was the one left out
  of the fix. **Neither** is the honest one-word answer, with "Nothing
  outstanding" on its hover like the other two. **PHOTOGRAPH THE THING YOU
  CHANGED**; the exemption looked perfectly reasonable in the source.
- **THE THREE COLOURS ARE UNTOUCHED** (amber `.ngl-w-you`, grey `.ngl-w-them`,
  green `.ngl-w-clear`) and so is every reading behind them — negWhoseMove's
  four answers, the bands, the counts and the row's own press. Only the text
  moved. `ngl_move_mine` / `_theirs` / `_none` in both languages; "Vems tur"
  answers Min · Deras · Ingen. **ONE WORD MEANS ONE WORD** — f184 fails on a
  space in any of the three, because a phrase here puts the cut straight back.

Tests: f184 (three claims REVERSED IN PLACE — the pill's text, the unsent
state's, and the both-languages roll call), negotiations-door-verify (the same
reversal, plus the hover), f148 unchanged.

## ONE WHITE BAND, AND IT REACHES THE SCREEN'S EDGE (owner-reported 25 Aug 2026)

**WIDENED THE SAME DAY, AND THE RULE HAS LEFT THIS PAGE'S OWN SHEET.** The same
strip was reported on four more screens — the contract room, the Calendar,
Insights and the negotiation page — and the answer is no longer the register's
private one. `VIEW_OWNS_HEIGHT` (js/app.js) is the ONE list of views whose root
is `height:var(--view-h)` and which therefore can never scroll the shell's
scroller; `paintScrollGutter` puts a class on `#content-scroll` from
`renderPageHeader`, which runs on every view change — including onto a view that
is NOT on the list, which is what takes the class off again — and
`#content-scroll.view-fixed{scrollbar-gutter:auto}` in index.html is the rule.
Id-plus-class outranks the id alone, so it wins with nothing shouted. The
register is simply on that list and its behaviour is unchanged; **five views
each carrying a copy is five places for it to drift**, which is the whole
argument. **A VIEW JOINS THE LIST ONLY IF ITS ROOT OWNS ITS HEIGHT** — Home,
Reports, Templates, Import and the Approvals queue are deliberately absent,
because they grow with their content and the reservation is what stops them
jolting. **THE ONE EXCEPTION IS THE CALENDAR BELOW 1023px**, where its own sheet
turns `.cal-page` to `height:auto` and the page really does scroll: that sheet
puts the gutter back at that width, written where the rule that causes it lives
and going with the page, so no other view can inherit the exception. MEASURED
after: the five listed views reach the screen's edge at 1500 and 1366, every
other page keeps its 10px.

Two screenshots, two sentences: *"remove the separation strip in the top two
cards and make it one card just like in the negotiations page"*, and *"the top
white cards should cover all the way to the end of the screen"*.

**ONE CAUSE, BOTH REPORTS.** The shell's scroller reserves a scrollbar gutter
permanently — `scrollbar-gutter:stable`, so moving between a scrolling page and
a fixed-height one cannot shift content sideways. `#page-head` sits OUTSIDE that
scroller and `.reg-band` inside it, so the two white boxes had **different right
edges**: MEASURED at 1440, the head ran to 1440 and the band stopped at 1430.
That 10px step is what read as two cards with a strip between them, and the grey
showing beside the band is what the second screenshot ringed. `.reg-band`'s own
note already recorded the step as a known compromise — "the head runs 10px wider
because it sits outside the scroller" — which is how a documented compromise
becomes a bug report.

- **THE GUTTER IS DEAD SPACE ON THIS PAGE, which is why turning it off here is
  honest rather than a workaround.** This view is exactly `--view-h` tall and
  the TABLE does its own scrolling, so the page scroller can never scroll and
  has no scrollbar to reserve room for. `#content-scroll{scrollbar-gutter:auto}`
  lives in the register's own injected `<style>`, so it goes with the page and
  the next view gets the shell's rule back untouched — asserted, because a rule
  that leaked would take the anti-jolt guarantee with it.
- **THE SHELL'S DECLARATION HAD TO MOVE OUT OF THE ELEMENT'S `style=""` FIRST.**
  An inline declaration cannot be beaten by a stylesheet rule without
  `!important` — the 91-`outline:none` lesson, met again. It is
  `#content-scroll{scrollbar-gutter:stable}` in index.html's own sheet now; one
  id apiece and the page's rule comes later in the document, so it wins on order
  with nothing shouted. **The first attempt put the page rule in and changed
  nothing at all**, which is what said the inline style was in the way.
- **BLEEDING THE BAND INTO THE GUTTER WAS TRIED FIRST AND REJECTED.** A negative
  margin does paint into it (measured — the white reached 1440), and it leaves
  the scroller with 10px of horizontal overflow that only `overflow-x:hidden`
  can swallow. A page that has to hide an overflow to look right is one pixel
  from scrolling sideways, which this rulebook forbids by name.
- **IT REACHES BOTH PAGES BY CONSTRUCTION** — Contracts and Negotiations are one
  renderer — and on Contracts it closes the first report too: with the band at
  1440 the head above it ends on the same vertical, so the two read as one card.

Tests: contracts-page-verify section 15 (9 — **8 of them fail against the code
of an hour before**, reporting "band 1430 of 1440" and the last column of pixels
painted by something that is neither the head nor the band). It is measured as
PAINT, not as boxes: two elements can share a right edge and still leave a seam,
so it walks the last visible column from the top of the head to the bottom of
the band and asks both what colour is there AND which element owns it — a colour
check alone is satisfied by anything laid over the page, and the always-mounted
Activity and Copilot panels are exactly that kind of thing.

## THE JOIN IS TWO TOKENS OR IT IS A GAP (owner-reported 25 Aug 2026)

*"There is still a grey gap in the card that needs to be eliminated."* — the
Contracts page, on a laptop, a strip of page ground across the white card
between the title row and the filters.

**THE BAND CANCELS THE VIEW'S PADDING WITH THE TOKEN AND THE WRAPPER TYPED THE
NUMBER.** `.reg-band` bleeds to the view's edge with
`margin:calc(var(--page-pad-t) * -1) calc(var(--page-pad-x) * -1)`; the
register's own wrapper typed `padding:14px 16px 14px`. The two only ever
cancelled by luck — at the one window height where `--page-pad-t` happens to be
16. **The day --page-pad-t started tightening with the window (25 Aug, ONE
HEADER TOP) the luck ran out**: on a laptop it is 10, so the band began
`14 - 10 = 4px` BELOW the head and the page ground showed through. MEASURED: 4px
under 820px of page, **6px** under 680, 0 at 900 — which is why every check
passed. The wrapper reads the tokens now.

- **`.ngl-page{padding-top:...}` IS RETIRED WITH IT**, and its own note is the
  lesson: it said widening the fix to the wrapper "would move the Contracts
  page's filter bar for no reason". There was a reason, and this was it.
- **THE STANDING RULE**: where one rule cancels another's padding, both read the
  same token. A typed number that happens to match is a gap waiting for the
  token to move.

Tests: contracts-page-verify 15b — asked at 1000, 800 and 660 and asked as
PAINT (every row between the head's bottom and the band's top must be owned by
one or the other); **it reports the reported gap, 4px and 6px, against the code
of an hour before**.

## THE CONTRACTS PAGE ANSWERS "WHICH DID WE SIGN IN 2021?" (owner-asked 31 Aug 2026)

*"If I am in 2029 and i want to find a contract that was signed in 2021, how
would i find it?"* — and MEASURED, there was no way to ask. The stage filter
gives every contract ever signed with no year and no range; the six sorts hold
no signed date; the box on the bar reads title, counterparty and reference
only; **the full-text index does not carry the date at all** (so "2021" finds
contracts that MENTION 2021); the calendar marks no signature; and Copilot's
`list_portfolio` is never given one. **A repair that makes the date trustworthy
and stops there leaves a correct figure nobody can look up.**

- **A NINTH COLUMN ON CONTRACTS, IMMEDIATELY BEFORE EXPIRY** — two dates side
  by side read as a term. Drawn with `regDotDate`, the builder the Expiry cell
  already uses, so two dates on one row can never be written differently, and
  **no countdown**: a signature has no deadline. **An em-dash where nothing is
  signed, and the column always draws** — one that came and went with the
  filter would be a table changing shape under the reader.
- **A SEVENTH SORT, AND IT ASKS ITS OWN DIRECTION.** `regFiltered` sorts with
  `dir*cmp`, so a sentinel that puts the unsigned last ascending puts them
  FIRST descending — and the default is newest-first, which would open on a
  screen of em-dashes. The comparator reads `regState().dir` and returns a
  value that survives the multiplication.
- **A SIXTH FILTER, AND DELIBERATELY NOT ONE OF THE DEFAULT FOUR.** The row
  already fits one line and keeping it there was the owner's ruling (WO-15), so
  it lives behind *Adapt filters* — and draws on its own the moment it is
  narrowing, which is the safety property that catalogue already carries.
  **Its options are the years this workspace actually signed something in**,
  newest first, with This year and Last year ahead of them; both of those
  resolve against the CLOCK, so a page left open over New Year cannot narrow to
  the wrong twelve months.
- **AND THE CUT IN FORCE IS ALWAYS ON THE LIST.** The years come off the BOOK,
  so a chosen year can stop being offered under the reader who chose it — the
  last 2021 contract deleted, or that same page over New Year, where "This
  year" now resolves to a year nothing is signed in yet. **A `<select>` whose
  value matches no option falls back to its first**, so the control would have
  read *Any* over a narrowed, empty table: the filter saying one thing and the
  list another, which is the fault the WHOSE ASKS label exists to prevent. The
  chosen value is appended when nothing else offers it, **labelled with its
  YEAR rather than "This year"** — the year is the fact, and the phrase would
  be naming a window it no longer names. It is the stream picker's own rule
  ("a picker keeps a record's CURRENT stream even when out of reach") pointed
  the other way: there it is the RECORD that must not be silently re-filed,
  here it is the READER who must not be stranded. **Asked in a browser**,
  because the fallback is the browser's behaviour and the markup looks
  perfectly correct either way.
- **NEVER ON THE NEGOTIATIONS SEAT.** One renderer draws both; a Signed column
  on a page of live negotiations is an em-dash on every row.
- **AND THE NINTH COLUMN IS PAID FOR BY THE TITLE ALONE.** The register's own
  rule since the two lists became one renderer is that the SIX columns both
  seats share are cut identically and **the title is the column with the give**
  — that is what lets a reader move between Contracts and Negotiations and find
  the same columns in the same places. A first pass spread the cost over five
  of them (counterparty, stream and expiry each losing a point or two) and the
  two pages stopped lining up; **contracts-page-verify 11d is the net and
  reported it** as `201/228 · 174/201 · 121/174 · 161/148`. So Signed comes out
  of the title, 23 → 15, and the six are byte-identical to the Negotiations
  row. **EIGHT POINTS RATHER THAN NINE, measured against Expiry beside it**:
  that column carries the same dotted date PLUS `· 30 d` in 13%, so a date on
  its own wants appreciably less, and the point saved goes to the title, which
  is what people scan.
- **AND 11d ITSELF WAS A DESCRIPTION FROM THE WAIST DOWN.** It paired the two
  tables by INDEX (`[0,2,3,4,5,6]`), true while both seats drew eight columns
  and wrong from the sixth onwards the moment one drew nine — index 5 is Signed
  here and Expiry there. **The claim was right and its indexing was not**, so it
  is paired BY KEY off each seat's own column list and the next column added to
  either seat costs no test edit. Pin the relation, not the number.
- **ONE READING, FOUR SURFACES** — the column, the sort, the filter and the
  chart all ask `contractSignedAt` and none works a signed date out for itself.

**STILL NOT BUILT, said out loud:** a mark on the calendar the day a contract
executes. It is the last piece of "where does a signed date show up".

## THE COLUMNS ARE DRAGGABLE, LIKE A SPREADSHEET (owner-asked 31 Aug 2026)

*"in the contracts and negotiations columns you can adjust the width of the
columns like in excel sheets."*

**THE WIDTHS STAY PERCENTAGES AND STILL SUM TO 100**, which is not a detail: it
is what makes the table exactly its pane at every width and what closed the
reported sideways scroll of 24 Aug. **So a drag is a TRADE between the column
and the one to its right** — which is also what a spreadsheet does when you take
hold of the boundary between two columns. Nothing else on the row moves and the
total cannot drift.

- **ONE LIST OF DEFAULTS PER SEAT** (`REG_COL_W` / `REG_COL_W_NEGO`), read by
  the head, the reset and the store. They used to be nine literals typed into
  the head row, so three places would each have had their own opinion of what
  the default is.
- **MEASURED FROM WHERE THE POINTER IS**, never distance travelled — the rule
  the negotiation divider and Key terms both state, and the reason is recorded.
- **A PIXEL FLOOR** converted against the table's live width, so a column can
  never be dragged to nothing; a pair too narrow for two floors is left alone
  rather than fudged.
- **THE STORED ARRAY IS READ, NEVER TRUSTED.** A length that does not match the
  seat's own column count is IGNORED — the whole migration story for the Signed
  column, since a browser holding eight widths must not shift every column one
  place left. So is a total that has drifted off 100, which would put the table
  back into sideways scroll.
- **DOUBLE-CLICK PUTS IT BACK, AND RESET MEANS "NOBODY HAS CHOSEN"** — the
  stored value is REMOVED rather than rewritten with today's defaults, or a
  later change to those defaults would never reach a reader who once reset.
- **ONE DELEGATED LISTENER, ARMED ONCE ON THE DOCUMENT** — the head is rebuilt
  on every full render, and a listener armed inside a renderer belongs to
  whichever page rendered first (the 15 Aug lesson).

**TWO THINGS ONLY A REAL BROWSER FOUND, and both are worth carrying forward:**

- **THE GRIP WAS UNREACHABLE AT `right:-3px`.** The head carries
  `overflow:hidden` (the "a cut cell says so" rule), so the grip's centre landed
  on the clipped side, `elementFromPoint` returned the TH, and the control could
  not be taken hold of at all — while looking perfectly correct in the source.
  It sits wholly inside the head now. **Never give it a negative offset.**
- **STOPPING THE POINTERDOWN DOES NOT STOP THE CLICK.** The sort is wired on
  `click`, a separate event, so the first build refused the drag AND re-sorted
  the book under the reader. The click is stopped in the CAPTURE phase.

Tests: f258 (5), signed-and-columns-verify (the drag with a REAL mouse — a
synthetic event fires no pointer capture and would pass against a control
nobody can take hold of).
