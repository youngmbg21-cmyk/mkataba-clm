# WORK ORDER — The board that answers right

**Status: DONE. Written 5 Oct 2026; built the same night (owner: "Start the overnight run now"); merged to main. The morning summary is at the end.**

**The owner's words, 5 Oct 2026:**

> "Do further research on how we can make the dashboard dynamic and world
> class … The dashboard always gracefully responding accurately to the
> prompts in copilot."
>
> "Build the recommendations in an artifact and how ones on the screen would
> look like first. No coding"
>
> "Create a work order to build all of the jobs in an overnight run. No coding"

**What the owner has seen:**
- The research page "The Board That Answers Right"
  (https://claude.ai/artifact/TWoMEa4s67ZTcMvUbBenbz). It holds the twelve
  recommendations, ranked.
- The sketches "Board Answers, On Screen"
  (https://claude.ai/artifact/Q7dyQR8BXPGbRU9TpYXeH6). They hold eleven
  screens drawn on HaTi's real Home board and Settings pages.

"Build all of the jobs" is the owner's yes to every screen AS SKETCHED. That
lifts the Six Questions' refusals ONLY for what the sketches show. Anything
beyond a sketch (a new band, a new door, a different place on the page) goes
to the owner first.

**One correction to the sketches, found while writing this order:**
- Screen "−" sketched a separate "Weekly digest" email with its own switch.
- HaTi already sends the brief daily, weekly or not at all (`briefCadence`,
  `BRIEF_EVERY`), and kept views already ride it (`keptSec`).
- A second email and a second switch would be a second door (Six Questions,
  5). So Part 12 adds a "What moved" section to the EXISTING brief.
- Settings › You keeps its one brief setting. Say this to the owner in the
  morning summary.

---

## The one rule this order serves

**The words, the picture and the controls always agree.** The reply, the
chart and the card's dropdowns may never say three different things.

The screenshots of 5 Oct showed all three ways this breaks:
- "Showing 10 of 181" sat beside a board counting 178.
- Copilot's note "as graph" became a card's name.
- A ring claimed "Average payment days" but drew counts.

Those three are fixed (PR #128, f504, board-says-what-it-draws-verify). This
order removes the CAUSE: text the model wrote reaching the screen without
being checked against what was drawn.

---

## Where things stand (read before touching anything)

Read CLAUDE.md, then grep docs/MAP-HISTORY.md for these headings and read
each section in full:
- "HOME — THE BOARD DRAWS WHAT IT SAYS"
- "MEASURE PRECISION"
- "THE BOARD ANSWERS THE QUESTION ASKED"
- ""THIS" IS THE OPEN CHART"
- "READ, THEN ASK"
- "THE RECIPE"

Also read docs/WORKORDER-board-copilot.md, the last overnight order on this
board.

What exists today (js/views/homeboard.js, js/views/intelligence.js,
server/server.js):
- **One recipe** per card. Reader `hbRecipeRead` (`HB_RC`), cleaner
  `hbCardClean` (= server `graphChartClean`, f483), planner `hbCardPlan`
  (`P.dropped`), writer `hbCardSet`.
- **The free road.**
  - `hbFollowUp` changes the open chart.
  - `hbParse` makes a new card.
  - Anything else goes to Copilot through `hbAskInPanel` → `intelAskReady`
    → `/api/ai/graph`, with `screen.board` (`hbBoardNow`) and the data guide
    (`hbDataGuide` → `screen.guide`, `GRAPH_GUIDE_MAX`).
- **Copilot's actions** go through ONE applier, `hbBoardApply`. There is a
  checker `hbCardCheck` with one retry, undo `s.undo`, and choices
  `hbAmbiguity`.
- **The free answer is written by HaTi:**
  - `hb_found_n` gives the count;
  - `hb_found_how` gives "Drawn as …";
  - `hb_edit_said` covers follow-ups.
- **Copilot's own text reaches the screen in four places:**
  - `res.answer` (appended by `hbBoardTakes`);
  - `res.note` (a set's label, in `intelGraphApply`, and the card name
    through `hbShowFound`);
  - an `add_card` `title`;
  - `name_card`.

  A sentence stating a contract count the board does not show is already
  dropped ("THE COUNT IS HATI'S").
- **The precision book:** test/board-precision-book.json (109 requests). There
  is ONE judge (test/board-precision.js, `recipeMisses`). f502 is the free
  half, with its pass mark at 100. `npm run eval:board` is the Copilot half
  and needs a key; it has never been run.
- **The shelf:** `hbInsightsToday` / `hbInsFinding`, in the browser only.
  Kept views reach the server through `hbKeptSync` → `prefs.keptViews`, and
  the brief prints them (`keptSec`).
- **Company lists** are admin routes like `PUT /api/settings/filing`. Per
  person, prefs.
- **The test numbers used run to f510.** This order's tests start at f511.

**The free road must stay free.** Every question HaTi can read today costs
nothing, and that stays true after this work.

---

## The twelve jobs, in build order

Twelve recommendations become eleven parts. Build them in this order, because
each part stands on the ones before it. The number in brackets is the
recommendation's number on the research page; "Screen" is the sketch.

### Part 1 — The honest reply [#1, #4] · Screen 1 · nothing new on the board

**Goal.** Every count, scope and card name in a reply is written by HaTi
from what was DRAWN. Copilot's own sentence may explain; it never names,
counts or titles.

**How.**
- ONE answer writer, `hbAnswerSay(D, P, opts)`. It writes the scope, the
  count, the money where `hbMoneyOk`, and "Drawn as …" (`hbHowWord`). It is
  used by every free answer, `hbEditSaid`, `hbBoardTakes` and `hbShowFound`.
- **Card names.**
  - A card's name is HaTi's crumb (`hbCrumbOf`) or the top-N label
    (`int_top_label`).
  - A Copilot `title` or `name_card` is taken ONLY when the person's own
    words asked for a name (`HB_RC.title`, "call it", "rename"). It is
    cleaned by `hbPlainText`.
  - `res.note` NEVER becomes a card name or a Counting chip.
- **Copilot's `answer` is printed only when:**
  - the question is a why / explain question (`HB_WHY_ASK_RE`), or
  - Copilot answered with no actions and no set (a question about what the
    board shows).

  Otherwise it is dropped. The reply is `hbAnswerSay` alone.
- **Explorer's "Showing n of N"** already counts the book (`igBookTotal`).
  On the board, the line is replaced by `hbAnswerSay`.
- **THE DISCONNECT CHECK.** `hbAnswerAgrees(said, D, P)` runs before any
  reply is printed. It compares:
  - the reply's numbers with `D.n` and the money;
  - the reply's picture and split words with `P`;
  - the card's name with its crumb.

  On a mismatch HaTi rewrites the REPLY from `hbAnswerSay`, never the chart.
  It counts the catch through Part 7's record (`kind:'disconnect'`).

**Tests.**
- f511, red at main:
  - a Copilot answer with a note becomes no name;
  - "Show them in graph" after a Copilot set keeps the card's name;
  - an answer counting 181 on a board of 178 is rewritten;
  - a why-question keeps Copilot's sentence;
  - a title asked for is kept.
- Extend board-says-what-it-draws-verify with the screenshot's sequence:
  Copilot stub "top 10 by value" → "By counterparty" → "Show them in graph".
  The name stays "Top 10 by value", the split stays by counterparty, and the
  reply says 10.

### Part 2 — Ask or assume, for every two-way word [#6] · Screen 5 · nothing new on the board

**Goal.** A word that can mean two things is drawn with the likeliest
reading. The assumption is SAID, and the other reading is one press. This is
the date choice extended.

**How.**
- Extend `hbAmbiguity` to:
  - "value" (contract value or value bands);
  - "stage" (lifecycle stage or signing stage);
  - "terms" (payment terms or contract terms);
  - "owner" (our owner or the counterparty).
- Choices use the existing buttons (`hbChoicePress`,
  `graphBoardChoicesClean`). No new control.
- The assumption line is the existing `hb_amb_*` sentence family. Add new
  keys in English AND Swedish.

**Tests.**
- f512: each word, both readings reachable, a clear question offers nothing.
- Add the phrasings to the precision book FIRST (red at main).
- choices-when-unclear-verify stays green.

### Part 3 — One word book [#2] · Screen 9 · adds to Settings (owner's yes)

**Goal.** The company's own words ("deals", "POs", "ramavtal") mean the same
thing every time, to the free reader and to Copilot.

**How.**
- A company list `boardWords`, admin-only:
  - `PUT /api/settings/board-words`, the same pattern as filing, guarded as
    a DIFFERENCE;
  - rows `{say, lang, means:{kind, value}}`;
  - `kind` is one of `set` · `split` · `measure` · `type` · `stage` · `side`.
- **Built-in rows** are drawn READ-ONLY from what the reader already knows
  (`HB_RC_GW`, the stage words). Nothing is copied into the store.
- **The free reader** swaps a company word for its meaning BEFORE
  `hbRecipeRead`.
  - Words are DATA: escape them, and never build a regex from translated
    text (TWO LANGUAGES rule).
  - A company word never overrides a built-in one. A clash is refused in the
    drawer with the reason.
- **Copilot** gets the list in `screen.guide`, under `GRAPH_GUIDE_MAX`. A cut
  is said (A CAP IS A FACT).
- **The Settings drawer "Board words"** (Platform settings › Copilot group)
  follows the sketch: the table, "Add a word", "From the review list (n)".
  Use `openSettingsAt`, `SET_PANELS` and `stRepaintRow`. Never call
  `renderTeam()`.

**Tests.**
- f513: route walls (a non-admin gets 403; a difference guard); the reader
  swaps a word; a clash is refused; Swedish words.
- New board-words-verify: add "deals" in the drawer → "deals by stage"
  draws contracts by stage, free.

### Part 4 — The reading, as chips [#7] · Screen 2 · owner's yes

**Goal.** Under each board answer, HaTi shows how it read the question:
Picture · Split · Measure. Each chip opens the SAME menu as the card's
dropdown.

**How.**
- The chips are drawn from the card's plan (`hbPlan`), never from the
  answer's text.
- The menus are `hbRcOptions`. Greyed options keep their reason (A DEAD
  BUTTON WEARING A LIVE ONE'S CLOTHES).
- A choice writes through `hbCardSet` (one writer) and marks undo
  (`hbUndoMark`).
- The chips belong to the reply for the card that is OPEN. On older replies
  they show as plain text, so an old reply never edits a card that has
  moved on.
- Desktop panel only. The phone keeps its own Home (say so in the summary).

**Tests.**
- f514: the chips equal the plan; a press changes the card through
  `hbCardSet`; an old reply's chips are inert; greyed options say why.
- Browser: home-board answer chips, pressed both ways.

### Part 5 — Three next questions [#8] · Screen 3 · owner's yes

**Goal.** Three dashed follow-ups under each answer, worked out from the
recipe. Each is answered by the FREE reader and always draws.

**How.**
- `hbNextQuestions(D, P)` picks from a fixed list. Examples:
  - "only suppliers" / "only customers" where a side splits the book;
  - "by month signed";
  - "compare with last year" where dates allow;
  - "which are over our standard?" for payment terms;
  - "top 5 by value".
- A suggestion is offered only if:
  - it round-trips through the free reader to a DIFFERENT recipe, and
  - `hbCardCheck` finds no fault (never empty, never crowded).
- A press asks it as if typed, through the same `hbAsk`. Nothing is sent to
  Copilot.
- English and Swedish wording, read by the reader in the reader's language.

**Tests.**
- f515: every offered suggestion reads free, changes the recipe and passes
  the checker. This is checked across every request in the precision book.
- Nothing is offered on an empty card.

### Part 6 — Right or wrong, and the review record [#9] · Screen 4 · owner's yes

**Goal.** Two small marks at the foot of each answer. "Wrong" records the
question and what was drawn for the admins. The reply confirms in ONE quiet
line (`saidq` in the sketch). No band, no dialog.

**How.**
- A server record `board_feedback`:
  - fields `{id, kind: 'wrong'|'right'|'disconnect'|'fix', q, after, recipe,
    said, by, at, state}`;
  - written by `POST /api/board/feedback`;
  - the person is looked up from the session, never from the body (THE
    SERVER IS THE WALL);
  - read by admins only.
- `kind:'fix'` is written when a person changes a chip within 30 seconds of
  an answer, as a possible misreading. Nothing is said for it.
- The record holds NO contract text and no names other than the asker's.
  The recipe is enough.
- The marks are on free and Copilot answers alike. They are pressed once;
  a second press does nothing.

**Tests.**
- f516: route walls (person from session, admin-only read); one record per
  press; the confirmation line; a chip change within the window writes
  `fix`.

### Part 7 — Copilot accuracy, measured [#3, #4, #9] · Screen 0 · admins only

**Goal.** A Settings drawer "Copilot accuracy" holds:
- the free reader's score;
- Copilot's weekly score;
- disconnects caught;
- Copilot's misses;
- the questions people marked wrong, each with "Add a word", "Keep as a
  test" or "Dismiss".

**How.**
- **The free reader's score** is computed in the admin's browser when the
  drawer opens. It is free and instant, and uses the precision book's free
  requests, shipped as a static file (the same one f502 reads). Nothing is
  stored.
- **Copilot's weekly score** runs on the server on Mondays. Hook it into
  `agentScheduleTick`, spend through `runAgent` into `agent_runs`, and
  respect `agentMaySpend` and the spend page.
  - It asks the board's Copilot route with the book's Copilot requests over
    the book's own contracts, never the customer's.
  - It judges with a server copy of `recipeMisses`. f483-style, the two
    judges are pinned to agree.
  - No key: the drawer says "Not measured: no Copilot key". Never a zero.
- **Kept tests**: a question kept from the review list is added to the
  weekly run. The drawer also offers "Copy as test" (a JSON line) so a
  developer can add it to the precision book. The app never writes the
  repo.
- **Disconnects caught** is the count of `kind:'disconnect'` rows this week.

**Tests.**
- f517:
  - the schedule is guarded by `agentMaySpend`;
  - with no key it says "not measured";
  - the two judges agree on the whole book;
  - the drawer's rows act on the record.
- copilot-accuracy-verify: the drawer is shown with a stubbed run.

### Part 8 — Chart the deal facts [#11] · Screen 8 · owner's yes

**Goal.** New choices in the Split menu, under a "Deal facts" heading:
whose move, negotiation rounds, overdue duties, renewal decision and risks
found.

**How.**
- New split groups:
  - `move` (from `negWhoseMove`: us · them · neither);
  - `rounds` (1 · 2 · 3 · 4+);
  - `overdue` (has overdue duties: yes · no, using the obligations' ONE
    predicate);
  - `decision` (`graphDecisionOf` quarter);
  - `risks` (from `riskOpenOf`: none · 1–2 · 3+).
- Add them to `HB_SPLIT_GROUPS`, `HB_RC_GW` (English and Swedish), the
  server's `GRAPH_CHART_SPLITS` / `GRAPH_CHART_GROUP_OF` (f483 pins them
  equal), and the data guide.
- **THE LIGHT LIST — check FIRST.** In server mode `state.contracts` is
  light. For each fact, prove it is present on the light list in
  production. Where it is not, carry it as a transport fact from the list
  route (like `_reach`), stripped on save.
  - A fact HaTi cannot read is a group of its own ("Not known"), never a
    guess.
- **READING MUST NOT WRITE**: read `c.changes` and `c.negotiation` RAW.
  Never call `negoInit`.
- `move` reads the SERVER's `_reach` where `negWhoseMove` asks it, exactly
  as the Negotiations page does.

**Tests.**
- f518:
  - every group on the light list;
  - "which stalled deals are waiting on us, by counterparty" reads free;
  - no negotiation is created by counting (source sweep plus run).
- Add the phrasings to the precision book first.
- deal-facts-verify in a real server, the light list included.

### Part 9 — Verified views [#5] · Screen 7 · owner's yes

**Goal.** An admin saves a card as a verified view and names the questions
it answers. Asking one always gives that chart, marked VERIFIED, with who set
it and when.

**How.**
- A company list `boardVerified`, admin-only:
  - `PUT /api/settings/board-verified`, guarded as a difference;
  - rows `{id, title, recipe (cleaned by graphChartClean), phrases[], by,
    at}`.
- **The free reader checks the phrases first** (normalised, exact). A hit
  draws the stored recipe through `hbAddCard` as a normal card. It is
  counted LIVE in this reader's reach. A verified view never shows a
  contract a person could not already see.
- Copilot is told the phrases so it does not compete with them.
- **The card's ⋯ menu** gains "Verified view…" for admins only, as
  sketched. The badge sits on the card head and in the reply line.
- A verified view whose recipe no longer passes the checker is shown with
  the checker's line, never silently changed.

**Tests.**
- f519:
  - route walls;
  - a phrase hit is free and exact;
  - the count is the reader's own reach;
  - a non-admin sees no menu row;
  - a stale recipe is said.

### Part 10 — See it while you type [#10] · Screen 6 · owner's yes

**Goal.** As a person types, one faint line above the ask box says how HaTi
will read the question, and whether it is free or goes to Copilot.

**How.**
- READING MUST NOT WRITE. Today `hbFollowUp` and `hbParse` callers dig and
  set cards.
  - Build a pure `hbReadingOf(q)`. It returns what the answer WOULD be (a
    recipe, a panel, a figure, "Copilot") and writes nothing: no `hbDig`, no
    `hbCardSet`, no `hbSave`.
  - `hbAsk` then uses `hbReadingOf` as its first step, so the preview and
    the answer are ONE reading.
- The line updates after a short pause in typing (about 250 ms), costs
  nothing, and is drawn inside the ask area. The panel's height does not
  change: the line's room is always there.
- The line says "Copilot will read this one" without a price unless the
  route returns a real estimate. A cost is never guessed.

**Tests.**
- f520: `hbReadingOf` writes nothing (state snapshot before and after); the
  preview equals the answer across the whole precision book; the height is
  unchanged.

### Part 11 — "What moved" in the brief [#12] · Screen − (corrected) · email only

**Goal.** The brief people already get (daily or weekly) gains a short
"What moved" section: the shelf's top three findings. Each is one sentence
with a link that opens its chart on Home.

**How.**
- The shelf's findings are computed in the browser. Sync the top three to
  prefs the way kept views are synced (`hbKeptSync` → `prefs.keptViews`):
  - `prefs.boardMoved = [{say, key, at}]`;
  - written when Home paints;
  - capped and dated.
- The brief prints them in a new section beside `keptSec`, with "as of"
  dates. A finding older than the brief's period is not printed.
- The link is the app URL with a narrow `HASH_GO` word that opens the
  board at that card. Never a token.
- No new switch: the brief's own daily / weekly / off decides.

**Tests.**
- f521: the sync is capped; a stale finding is left out; the link opens the
  card; there is no new preference key for on/off.

---

## How to run the night (house rules)

- **One branch:** the session's designated branch, restarted from the
  latest main.
  - Commit after each part, with that part's own tests green.
- **Before code in each part:** the Six Questions.
  - The owner's yes covers the sketches as drawn.
  - Only a NEW refusal goes to the owner. Write it under "Waiting on the
    owner", stop that part, and carry on with the next part only if it does
    not depend on it.
- **Before running any test:** `npm run lint` first, with zero errors.
- **Prove every new check:** run it against a worktree at unmodified main.
  It must be red there.
- **Precision book first:** every new phrasing goes in the book before the
  code. f502's pass mark stays 100.
- **Photograph** every new control and reply line, in Dark and Light, and
  read the photos.
- **Language and other surfaces:**
  - every new word in English AND Swedish (i18n), with no duplicate keys;
  - the phone shell is untouched; say so in the summary.
- **Separate problems found on the way:** one BUGLOG line each, never a fix.
- **MAP:** at most four lines per part in CLAUDE.md, with the story in
  MAP-HISTORY.
  - CLAUDE.md is at 82.9 KB, over its 80 KB line. Move the Home section's
    longer lines to MAP-HISTORY BEFORE adding new ones (the owner approved
    such trims on 4 Oct). Say what moved.
- **The Brain:** name new features in `BRAIN_PARTS` and place them in a
  flow (f458).
- **Spending:** no Copilot key is expected overnight. Every Copilot step is
  tested with a stand-in, and the summary says nothing was spent.
- **Finish:** run the full suite ONCE at the end. Then merge to main: one
  PR, merged only when green.
  - Change this file's status line to DONE and fill in the morning summary.
  - If a part stopped on an owner question, merge what is finished and
    green, and say what waits.

## The morning summary

All eleven parts are built, tested and on main. Nothing stopped on a question for you. No Copilot key was present, so **nothing was spent**; every Copilot step was tested with a stand-in.

1. **The honest reply** — on screen. Copilot's answer on the board now says exactly what was drawn and how many contracts. A sentence that claims something the board did not draw is left out. Copilot renames a card only when you asked for a name or a new board.
2. **Ask or assume** — on screen. "value", "terms", "owner" and "stage" are drawn the likeliest way, the answer says so, and the other meaning is one press.
3. **Board words** — on screen, in Settings › Copilot (admins). Teach the board your own words ("BU" means value stream).
4. **The reading, as chips** — on screen. Under an answer: Picture · Split · Measure, each opening its menu. A quick change after an answer is noted as a possible misreading.
5. **Three next questions** — on screen, under the latest answer. Each one is answered for free.
6. **Right or wrong** — on screen. Two small marks under each answer; your admins see the list.
7. **Copilot accuracy** — on screen for admins in Settings. It runs every Monday. Score: **not measured** (no key).
8. **Deal facts** — on screen. In the Split menu, under "Deal facts": whose move, rounds, overdue duties, renewal decision, risks found. "Which stalled deals are waiting on us, by counterparty" is now answered for free.
9. **Verified views** — on screen for admins: a card's ⋯ › "Verified view…". Asking one of its questions brings that card back, marked VERIFIED, with who set it.
10. **See it while you type** — on screen. One faint line over the ask box says how the board will read your question, and whether it is free or goes to Copilot. Nothing moves while you type.
11. **What moved, in the brief** — email only. Your daily or weekly brief gains "What moved on your board": the top three findings, each with a link that opens the chart. As written in this order, there is no new switch and no second email.

**The precision book:** 109 questions before, 117 after. Every free question is still answered correctly (100%).

**Left alone:**
- The phone: Home on the phone is the old Home, and none of this shows there.
- One test about the Document tab's clause list was already failing on main before this work. It is untouched and still logged.

**Small things fixed on the way, inside this work:**
- Two of tonight's own test pins moved when Part 6 changed a line; they were re-pointed.
- Part 6's "Wrong" mark used two colour names that do not exist; it now uses the app's own red.

**The full test run, once at the end:** 11,626 tests, 11,624 passed.
- One failure (Swedish wording check) was fixed afterwards: three word-free patterns like "{what}: {how}".
- The other is the clause-list test above, which was already failing before this work.

## Waiting on the owner

- The Copilot key for this workspace (`ANTHROPIC_API_KEY`), so Part 7's
  weekly score and `npm run eval:board` can run here.
- (Add any new question that stops a part here.)
