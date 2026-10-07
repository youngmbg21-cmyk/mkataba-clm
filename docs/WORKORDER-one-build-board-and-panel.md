# WORK ORDER — One build: the board draws what you ask, a suggestion shows only what moved, the prepared questions wear the platform's colour

**Status: NOT STARTED. Written 7 Oct 2026. No code was written with this order. Build only when the owner says go — then ALL of it, as ONE build (one branch from the latest main, one pull request).**

**The owner's words, 7 Oct 2026:**

> "build the board draws what you ask work order and all remaining work as one build. Image 1, i have stated this before, always show ONLY the clause or sub-clause that is impact not all the clauses. We need to better utilize the space and be targeted. Image 2, the predetermined questions should be slightly shaded based on the platform color them in place. Add all these to one work order and do not code yet"

**Added the same day (owner, off two screenshots — Approvals & signing and Negotiations, the REF column circled):**

> "add this as well, the font for numbers do not seem to be the same across the platform. Unify the font to be the same one as the highlighted font across the platform."

Asked which numbers, the owner picked **"References only"**: every contract reference uses the highlighted font on every page; values, dates and counts stay in the normal font.

**Added again (owner, a screenshot of a "[icon] Focus" button):** "all focus buttons should say Focus. Add this".

**And again (owner, 7 Oct 2026):** "In the home page in board and explorer. When you choose pointer, it seizes to become a cursor and only works as a pointer and therefore across the screens. You can then exit pointer to get back to cursor mode."

**What this order holds (six parts, one build):**
- **Part A — The board draws what you ask, however you say it.** The Home board work order written earlier today (branch `claude/board-draws-what-you-ask`, docs/WORKORDER-board-draws-what-you-ask.md), carried here WHOLE and renumbered A0–A6. This file SUPERSEDES that one; that branch is not merged.
- **Part B — A suggestion shows only the clause or sub-clause it changes** (owner's image 1).
- **Part C — The prepared questions are shaded in the platform's colour** (owner's image 2).
- **Part D — Every reference wears the reference font, on every page.**
- **Part E — Every Focus button says "Focus".**
- **Part F — On Home, the Pointer is a pointer only, until you exit it.**

"All remaining work" was checked against everything raised in this session. Everything else is built and merged (#159, #160). One idea was raised but never decided, so it is NOT in this order: making "Why it matters" the first row of the shaded facts (Risk Walk Options, left as an open question). It needs the owner's yes first.

**THE OWNER HAS ALREADY SAID PART B ONCE** ("i have stated this before"). MAP-HISTORY carries it as the Notes pin: *"I only changed clause 1.2 so the reference on the right should only take 1.2 and not the whole clause 1"* (`rlNpChangeQuote`, read through `redlineShownBlocks(ops,{changedOnly:true})`), and the Deal board draws "one point whole but only the paragraphs touched". The Suggested wording in Edit with Copilot never took that rule. Treat B as RESTORING stated behaviour, not as a new design.

---

## PART A — THE BOARD DRAWS WHAT YOU ASK, HOWEVER YOU SAY IT

### A · The one rule this order serves

**A question that names a chart puts that chart on the board, or says plainly
why it cannot. Nothing else.** It never changes the hidden Explorer map, and
it never writes a sentence describing a picture that is not on the screen.
How the question starts ("show me", "give me", "I want", "can you draw", or
nothing at all) never changes what is drawn.

This is the existing rule "THE WORDS, THE PICTURE AND THE CONTROLS ALWAYS
AGREE" (WORKORDER-board-answers-right.md) and "ON THE BOARD THE MAP IS NOT THE
SCREEN" (the 4 Oct comment in intelAsk). Both were broken by the two
screenshots below.

---

### A · What went wrong (diagnosed 7 Oct, read-only)

#### Screenshot 1 — "bubble chart of value against time left"
Reply: *"Grouped 180 contracts into 6 groups by expiry window · 113 in "No
expiry set" · Coloured by value · Sized by value · Labelled by customer ·
Timeline by expiry date"*. The board stayed empty.

#### Screenshot 2 — "show me bubble chart of value against time left"
Reply: *"Sized by value · Timeline by expiry date. This bubble chart plots
contracts by their expiry date (left to right, time remaining) and sizes them
by value. The 4 contracts ending within 90 days stand out …"*. The board stayed
empty again. Copilot described a chart that was never drawn.

#### The three wrong turns (each one is a step below)

1. **HaTi's own reader passed the question on.** `hbRecipeRead` reads
   "bubble chart" (pic `bubbles`) and "value" (measure). But "of", "against",
   "time left" are not in `HB_RC.filler` and no rule consumes them, so
   `R.left` is not empty, `hbParse` returns null, and the question goes to
   Copilot. "Value against time left" is literally what the bubbles picture
   already draws (`hb_pic_bubbles`: "Bubbles: value against time left"), so
   HaTi should have drawn it itself, free. (Likely, not yet measured in a
   browser. A1 measures it first.)

2. **Copilot answered in the map's language.** The board prompt in
   server.js (`boardJob`, in the `/api/ai/graph` handler) tells Copilot to use
   board `actions` and to leave the map's fields empty. Copilot ignored that:
   it returned `groupBy`/`colourBy`/`sizeBy`/`labelBy`/`timeBy` and a prose
   `answer`, and no `actions` and no `chart`.

3. **Nothing stopped the map answer on the board.** In `intelGraphAsk`,
   `hbBoardTakes(res, q)` returns null when there are no actions, and the code
   then falls through to `intelGraphApply(q, res)`. That rearranges the Explorer
   map hidden behind the board and composes "Grouped 180 contracts…" /
   "Sized by value · Timeline by expiry date" as if it had worked. In
   screenshot 2, Copilot's own prose rode along too, claiming a "bubble chart"
   the reader cannot see.

#### Why "show me" sometimes seems to matter
Not yet proven. These are the places where "show me" changes the road, and the
builder MEASURES each one before changing anything:
- `hbAnalystWords` strips "show me", "give me", "I want" … (good). But
  `HB_RX.bring` (`^(?:bring up|pull up|open|show me|look at|find …)`) reads
  "show me X" as "open the contract named X" in `hbFindContract`. A question
  starting with "show me" that happens to match one contract's name opens that
  contract instead of a chart.
- `HB_FU.verb` and `HB_FU.refer` (the follow-up reader) know "show it",
  "show them", "show value". With a chart open, a bare phrase like
  "value by stream" may be read differently from "show value by stream".
- `intelGraphApply`'s narrowing test (`/\b(?:only|just|which|what|show me|…)\b/`)
  keeps or drops a set depending on whether "show me" is present.
- The server prompt may itself lean toward drawing when a request opens with a
  verb, and toward explaining when it does not.

---

### A · Where things stand (read before touching anything)

Read CLAUDE.md, then grep docs/MAP-HISTORY.md for these headings and read
each section in full:
- "HOME — THE BOARD AND THE MAP"
- "CLAUDE.MD TRIM, 7 OCT 2026"
- "BOARD WORK ORDER TRIM"
- the 4 Oct block on "ON THE BOARD THE MAP IS NOT THE SCREEN"

Also read docs/WORKORDER-board-answers-right.md and
docs/WORKORDER-board-copilot.md (the earlier board orders; the check-and-repair
pass `hbBoardTakesChecked` and `hbCardCheck` come from them).

The functions this order touches: `hbAskReadingOf`, `hbAnalystWords`
(`HB_ANALYST_WORDS`), `hbParse`, `hbFindContract` (`HB_RX.bring`),
`hbRecipeRead` (`HB_RC`, `filler`), `hbFollowUpRead` (`HB_FU`), `hbBoardTakes`,
`hbBoardTakesChecked`, `hbProseChecked`; in intelligence.js `intelAsk`,
`intelGraphAsk`, `intelGraphApply`; in server.js the `boardJob` prompt in the
`/api/ai/graph` handler and whatever cleans its reply (`graphChartClean`).

**Before writing ANY code:** run A0's phrase table against a worktree at
unmodified main and save the results. "Already broken" is proved there, never
assumed (CLAUDE.md: A CHECK THAT PASSES AGAINST THE PARENT IS A DESCRIPTION).

---

### A0 — Measure first: the phrase table

Build one browser check (name it `test/chromium/board-says-it-plain-verify.js`)
that types each phrase below into the board's ask box on Home and records:
(a) the road `hbAskReadingOf` chose (free / copilot / map), (b) whether a card
landed on the board, (c) the card's picture, split and measure,
(d) whether the hidden map's grouping or look changed. With no Copilot key the
copilot road should report "went to Copilot", not time out.

Every chart phrase is tested in FIVE openings — the bare phrase, then with
"show me", "give me", "can you draw", "I want to see" in front:

| Bare phrase | Must draw |
|---|---|
| bubble chart of value against time left | bubbles · value |
| value against time left | bubbles · value |
| bubbles | bubbles |
| contracts by stage as a pie | ring · stage · count |
| value by stream | bars · stream · value |
| signed contracts by month with a trend | month columns · signed · count · trend |
| top 5 counterparties by value | bars · counterparty · value · top 5 |
| timeline of contracts ending in the next 6 months | contract bars · end |
| value by stream and stage as stacked columns | stack · stream · stage · value |
| contracts by stream and payment terms as a heat map | heat · stream · payment terms |
| value by counterparty as a treemap | blocks · counterparty · value |
| median days to sign by quarter over the last 2 years | quarter columns · median days to sign |
| risk exposure by stream | bars · stream · exposure |
| value signed this year as a running total | month columns · signed · value · running |
| contracts ending by quarter compared with last year | quarter columns · end · compare year |
| a pie of payment terms | ring · payment terms |
| payment terms pie | ring · payment terms |
| chart of renewals by month | month columns · decision or end |

Also two "not a chart" rows, to prove nothing regresses:
- "show me MK-104" and "bring up Amani Foods" (one match) still open the
  contract's card.
- "the map" still switches to Explorer.

Save the table as it stands on unmodified main in the morning summary. Every
row must come out the SAME for all five openings when this order is done.

---

### A1 — HaTi reads "value against time left" itself

- The bubbles picture already means "value against time left". Teach the
  recipe reader those words: "against time left", "against time remaining",
  "against months left", "by time left", "versus time to expiry" (and the
  Swedish "mot tid kvar") are the bubbles picture's own words, consumed by
  `hbRecipeRead` and never left over.
- Add "of" as a connecting word the chart reader may drop when it sits between
  a picture word and what to count ("a pie OF payment terms", "bubble chart OF
  value"). Do NOT add "of" to the condition reader: "contracts of Amani Foods"
  must still narrow.
- After this, "bubble chart of value against time left" reaches the board on
  the FREE road, draws bubbles, and costs nothing. The line over the ask box
  (`hbAskPreviewText`) says so before Enter.
- Any new phrase goes in the shared book first (`HB_ANALYST_WORDS` or `HB_RC`),
  never as a one-off branch (MAP: "a new phrasing goes in the book first").

### A2 — The opening words never decide the road

- How a question starts must not change what is drawn. "show me", "give me",
  "I want to see", "can you draw", "draw", "plot", "chart", "display", "put up",
  "let me see", "pull up", "visa mig" are all stripped the same way before ANY
  reader looks at the question — including the follow-up reader and the
  contract finder — EXCEPT where they really ask to open one contract.
- The contract finder (`hbFindContract` via `HB_RX.bring`) opens a contract
  only when the rest of the question is a contract's name or reference and
  carries NO chart words (no picture, split, measure, period or trend word
  that `hbRecipeRead` reads). "show me Amani Foods" opens the contract;
  "show me Amani Foods by month" draws a chart of their contracts.
- The follow-up reader treats a bare recipe phrase ("value", "as a pie",
  "by stream") the same as "show value", "show it as a pie", "show it by
  stream" when a chart is open.
- `intelGraphApply`'s narrowing test must not depend on "show me" either (the
  same list of openings, stripped first).
- Prove it with A0: every row identical across its five openings.

### A3 — On the board, a map answer never touches the hidden map

- In `intelGraphAsk`, when the board is the screen (`igBoardNow()`) and
  Copilot's reply carries no board `actions` and no `chart`, do NOT call
  `intelGraphApply`. The hidden Explorer map stays exactly as it was.
- Instead, turn what Copilot asked for into a board card where it can be done
  safely, else say so:
  - If the reply names a picture-shaped look (e.g. `sizeBy: value` with
    `timeBy: expiry`, or prose naming a chart type), and the original question
    carried a picture word HaTi already read (`_hbPendingRecipe`), add that
    recipe as a card through `hbBoardApply` — the same one writer as always.
  - Otherwise send it back to Copilot ONCE through the existing
    check-and-repair retry (`hbBoardTakesChecked`'s `retry`), with a note:
    "On the board, answer with actions; the map's fields are not drawn."
  - If it still has no board actions, the reply is one plain line saying the
    board could not draw it and offering the closest chart HaTi can draw as a
    press (the board's existing "next questions" style). No band, no strip.
- The only way to change the map from the board stays as it is today: the
  reader asks for the map ("the map", "explorer", "show these on the map").

### A4 — Copilot's words never claim a picture that is not there

- On the board, Copilot's prose `answer` is shown ONLY when something it
  describes was actually drawn, or when the question was a question about what
  the board already shows (the prompt's "A QUESTION ABOUT WHAT THE BOARD SHOWS").
- A sentence that names a chart ("This bubble chart plots…") while no card
  landed is dropped, and the reply says what DID happen. Use the existing
  checker (`hbProseChecked` / `hbFactCheck`) and extend it with this one case
  rather than writing a second checker.
- The "Sized by value · Timeline by expiry date" style sentence (composed by
  `intelGraphApply` from the map's roles) must never appear on the board,
  because after A3 that function no longer runs there.

### A5 — The server prompt says it once more, harder

- In the `boardJob` prompt: add one short example of a picture question
  answered with `add_card` (e.g. "bubble chart of value against time left →
  add_card {which:{all:true}, recipe:{pic:'bubbles', measure:'value'}}").
- In the server's cleaning of the reply, when the request came from the board
  (`onBoard`) and the reader did not ask for the map, strip the map's fields
  (`groupBy`, `floorsBy`, `columnsBy`, `colourBy`, `sizeBy`, `labelBy`,
  `timeBy`, `view`, `look`) before the reply leaves the server. THE SERVER IS
  THE WALL; the browser rule in A3 is the second line.
- Do not raise the token budget or add calls; one retry (A3) is the most.

### A6 — Correct the guide page

- Republish "Ask the Board" (https://claude.ai/artifact/7KYY1XTBkzsaaUpZhXR19y,
  read it first with the Artifact tool, then publish to that URL) only once
  A1–A4 are merged and the phrase table is green:
  - add a short line under "How a question is read": the opening words
    ("show me", "give me", …) make no difference;
  - keep "bubble chart of value against time left" as an example only if
    A0's row for it is green on main. If it is not, change the example to a
    phrasing that is.

### A · Tests (Part A)

- New: `test/chromium/board-says-it-plain-verify.js` (A0's table; the five openings; the two "not a chart" rows; the hidden map's grouping and look unchanged after every board question; no reply sentence names a chart when no card landed).
- New node test (the next free f-number; check first): `hbRecipeRead` leaves nothing over for the A1 phrases; the five openings give the same reading for every A0 phrase; `HB_RX.bring` opens a contract only with no chart words; server: a board reply loses the map's fields unless the map was asked for.
- Re-run the existing board files: f496–f502, f504, f511–f521, f524–f538, f540, board-* and chart-* verify files, insights-shelf-verify.


---

## PART B — A SUGGESTION SHOWS ONLY THE CLAUSE OR SUB-CLAUSE IT CHANGES

**What the owner saw (image 1):** on the Risks tab, "Payment terms · restricted". Copilot's Suggested wording printed the WHOLE of clause 2 (2.1 Base Rent, 2.2 Security Deposit, 2.3 Utilities and Operating Costs) when the only change was two added sentences in 2.1.

**Why:** `ceCardHtml` draws `ceRedlineHtml(…)`, which calls `redlineOpsBlocksHtml(ops, { who: 'us', shape })` WITHOUT `changedOnly`, so every block of the clause is drawn. Since the 7 Oct Sticky bar the card is printed whole (no window), so the untouched sub-clauses now cost real height.

**The rule (one reading, already in the code):**
- The Suggested wording draws ONLY the blocks the change touches: `redlineShownBlocks(ops, { changedOnly: true })` / `redlineBlockTouched`, the same reading the Notes pin (`rlNpChangeQuote`) and the Deal board (`dealBoardCardHtml`, `changedOnly`) use. Never a second reading.
- A sub-clause keeps its NAME: when a touched block sits under a heading block in the same clause ("2.1 Base Rent."), that heading is drawn too, unmarked, so the reader knows where the change sits. Nothing else is added.
- WHAT IS LEFT OUT IS COUNTED AND SAID, the Deal board's way: one quiet line under the wording, e.g. "2 unchanged parts of this clause not shown" (`i18t`, both books). It is a fact inside the card, not a band. If the owner reads it as a band, drop it and say so.
- A change that touches nothing visible (formatting only) falls back to the whole clause. `redlineShownBlocks` already does this.
- DRAWING ONLY: Apply still puts the WHOLE suggested clause into the draft (`card.text` unchanged), Save files exactly what it did, and the votes and Ask for a change are untouched. The rule changes what the card SHOWS, never what it DOES.

**Everywhere it appears (Bug Fix Rule 1):** the Suggested wording on the Suggestions tab and on the Risks tab (both `ceCardHtml`); a standard question's card (Use our standard / fallback, `ceStdPress` → the same builder); the passage card when words were highlighted (`card.passage` — already measured against the passage; check it still reads right). Grep every caller of `ceRedlineHtml` and of `redlineOpsBlocksHtml` in the editor and account for each. The paper in the middle of the editor is NOT this card and stays whole.

**Tests:**
- Browser (extend `test/chromium/panel-tidy-and-risk-footer-verify.js`, or a new `suggestion-shows-what-moved-verify.js`): a three-sub-clause clause, Copilot scripted to change ONE sub-clause; the card shows that sub-clause's heading and its marked sentence, NOT the other two sub-clauses' words, and the count line says how many were left out; Apply still puts the whole clause in the box; the same on the Suggestions tab; a formatting-only suggestion shows the whole clause.
- Node: `ceRedlineHtml` (or the card builder) passes `changedOnly: true`; the count key in both books.
- Must FAIL on unmodified main.

---

## PART C — THE PREPARED QUESTIONS ARE SHADED IN THE PLATFORM'S COLOUR

**What the owner saw (image 2):** the prepared questions over the ask box (Make it firmer · Give me a softer version · Shorter · What does our playbook say?) are white boxes with grey words. They should be slightly shaded in the platform's own colour, staying where they are.

**The rule:**
- `.ce-chips button` takes the platform's pale wash: background `--color-accent-50`, words `--accent-ink`, edge `--color-accent-100`; on hover `--color-accent-100` with an `--accent-solid` edge. The brand decides the colour (green on the green brand, navy on navy) because these are the brand's own tokens. Size, place, order and wording do not change.
- At night the pale rungs already have their dark answer on `:root.dark` (CLAUDE.md LOOKS) — check the chips read in dark, and that dark-no-white-patches-verify stays green.
- Contrast: `--accent-ink` on `--color-accent-50` must meet AA for 12px text (contrast-verify's way of measuring).
- Everywhere they appear: the chips row is ONE builder for both tabs (`ceRenderChips`; on Risks `riskChipsHtml` fills the same `#ce-chips`). A standard question's chip (`data-ce-std`) wears the same shade. Check no other surface borrows `.ce-chips` (grep) — the Home board's next questions wear `--hb-*` and are NOT part of this.

**Tests:** extend the browser check: a chip's computed background is the accent-50 colour (not white) and its ink is the accent ink, on both tabs, in light and dark, on BOTH brands (green and navy). Must FAIL on unmodified main.

---

## PART D — EVERY REFERENCE WEARS THE REFERENCE FONT, ON EVERY PAGE

**What the owner saw:** on Negotiations the REF column (MK-441, RL-001) is in Geist Mono, the reference font the bright brand (7 Oct) gave references (`--font-ref`, fonts/geist-mono.css: "References read `--font-ref` — refs only"). On Approvals & signing the same references (MK-117, MK-107) are in the ordinary face. Today only three places use `--font-ref`: the Contracts/Negotiations table (`.reg-mk`), the inspector's eyebrow (`.ins-eb .ins-ref`) and the room head (`.room-head .room-sub-id`).

**The rule (owner's pick, "References only"):**
- A REFERENCE is the printed name of a record: a contract's `contractRef(c)` (`c.contractNo || c.id`, e.g. MK-117, RL-001, HZ-0), a change's id (CHG-009), and any other id HaTi prints as a reference (a request's, an obligation's, an approval's, if it prints one). Every one wears `--font-ref` with tabular digits, at the size and weight the place already uses — only the FACE changes.
- NOT references, and they stay in the ordinary face: values (SEK 44M), dates, day counts ("85 days"), badges and counters, clause numbers ("2.1"), and anything inside the contract's own wording (the paper never changes face for this).
- ONE WAY TO DRESS IT: one shared class (e.g. `.hati-ref`, defined once in index.html: `font-family:var(--font-ref); font-variant-numeric:tabular-nums`) or one small helper that wraps a reference in it, used by EVERY surface. The three existing rules either become that class or are left as they are, so there is ONE definition of what a reference looks like. Never a second copy per page.
- EVERYWHERE IT APPEARS (Bug Fix Rule 1): grep every printer — `contractRef(`, `hbRef(`, change ids (`CHG-`, `ch.id` where printed), and any `c.id` printed to the screen — across js/ and js/views/ (about 190 call sites in about 30 files, many of them not printing, e.g. used as keys or in sentences sent to Copilot). Account for each: print → dress it; key, sentence to Copilot, email, PDF, Word file, CSV → leave it. At least: Approvals & signing (both tabs), Obligations (page and room tab), Calendar (month, horizon, agenda), Home (board cards, lists, stories), Copilot's work, Requests, Insights, Explorer's cards, the Notes drawer, the Deal board, the Redlines column, notifications and the bell, search (Cmd/Ctrl+K), the phone (js/mobile*.js).
- A STANDALONE DOCUMENT CARRIES NO `:root` (CLAUDE.md): the PDF, print, Word, emails, the health report and exports do not load Geist Mono. Leave their references as they are, and say so in the summary.
- Light and dark, both brands: the face does not change colour; check nothing else moves (no row grows taller — Geist Mono's digits are wider, so check narrow columns do not wrap or clip a reference: measure row heights before and after on Approvals and Obligations).

**Tests:**
- Browser (new, e.g. `test/chromium/one-reference-face-verify.js`): on each page listed above, every element that prints a reference computes `font-family` starting with Geist Mono; a value, a date and a day count on the same rows do NOT; row heights unchanged on Approvals and Obligations; a reference is not cut off at 1024px wide. Must FAIL on unmodified main (Approvals does today).
- Node: one class/helper exists and the pages listed call it (pin the RELATION — the helper is used — not a count of call sites).

---

## PART E — EVERY FOCUS BUTTON SAYS "FOCUS"

**What the owner showed:** a button with the focus mark and the word **Focus**. That is the model for every Focus button.

**What they say today (read 7 Oct, grep again before building):**
- Document tab control row (`.ws-focus-door`, `data-ws-focus-door`): the mark ONLY, no word.
- Negotiate control row (`.rl-focus-door`, `data-ws-focus`): the mark ONLY, no word.
- The counterparty's page (`#pt-focus`, `data-rl-focus`): "Focus mode" (`po_focus_mode`).
- The contract's ⋯ menu row (`ct_menu_focus`, painted in contract.js): "Focus mode".
- A second ⋯ menu row (`#ws-focus` in contract.js): "Focus mode" typed in ENGLISH straight into the markup — it never follows Swedish. Check whether this row is still drawn; if it is, it takes the key.
- Explorer's Analyze-contract paper (`data-ig-focus`, `int_focus`): already "Focus" — the model.

**The rule:**
- Every control that TURNS ON focus shows the focus mark and the one word **Focus** (Swedish **Fokus**), through ONE key (`int_focus` already says it; use it or one shared key — never a new English literal). While focus is on, the same toggle stays "Focus", lit (`aria-pressed`, the existing `.on` look). The fuller sentence ("Focus mode — hide the header and give the room to the document", "Esc to leave") stays on the HOVER (`title`) and for screen readers (`aria-label`), so nothing a reader relied on is lost.
- The separate EXIT controls drawn while in focus ("Exit focus", `ng_exit_focus`, `.rl-focus-exit`) are a different act and keep their words.
- THE COST: the two control rows that show only the mark grow by one word. Measure both rows before and after at 1024px and 1440px: the row must stay ONE line, nothing may wrap or be pushed off, and the contract's first line of wording must not move down (Six Questions, 3). If a row cannot take the word at 1024px, say so to the owner rather than squeezing it.
- Everywhere: the room's Document tab, Negotiate (both seats — ours and the counterparty's), the ⋯ menu, Explorer's Analyze paper, and the phone if it draws a Focus control. Retired keys (`po_focus_mode`, `ct_menu_focus` if no longer called) are left inert in BOTH books.

**Tests:** browser (extend `focus-mimics-document-verify` or a new `focus-says-focus-verify`): on each surface the Focus control's visible text is exactly "Focus" (and "Fokus" in Swedish), with the mark; pressing it still enters focus and the exit still leaves it; the control rows stay one line at 1024px; the first line of wording does not move. Must FAIL on unmodified main.

---

## PART F — ON HOME, THE POINTER IS A POINTER ONLY, UNTIL YOU EXIT IT

**Today (read 7 Oct; grep again):** Present on Home offers Pointer · Pen · Clear (`hbToolsPaint`, `data-hb-tool`, `_hbTool`, `hbSetTool`). With Pointer on, `.hb-pointing` hides the cursor and a red dot with a short trail follows the mouse (`#hb-laser`, `hbOnPointer`) — but only over the board's column (`#hb-col`). Over anything pressable the HAND comes back, the dot steps aside and a click still works (`hbPointerHandAt`, `.hb-cur-chain`, `HB_CUR_CONTROL`). That last behaviour was the owner's 6 Oct ruling ("It should only turn into a mouse when hovering over a button").

**The owner's new rule REVERSES the 6 Oct hand-over-buttons ruling** (say so in the summary; replace the line in CLAUDE.md, story to MAP-HISTORY):
- With Pointer chosen, there is NO cursor anywhere on the screen, and the mouse ONLY points: the red dot and its trail, never the hand, over the board, over Explorer's map, over the Copilot panel, the page head and every button. A click does NOTHING — no dig, no card, no tab, no button — so a presenter can point at anything without opening it by accident.
- It works the same on the BOARD and on EXPLORER, and across the WHOLE screen, not only the board's column (the dot is drawn on a layer over the whole page, sized to the window).
- ONE WAY BACK, always visible and always pressable: a small "Exit pointer" control (the Pointer button itself, lit, in the Present tools) is the single element that still takes a click while pointing; Escape also exits (already: `hbOnKey` clears `_hbTool`). Exiting brings the normal cursor straight back, and nothing that was pointed at was pressed.
- The Pen keeps its own behaviour; Clear still clears. Leaving Present, a page change, or a refresh ends pointing (nothing kept), as today.
- Where Pointer can be chosen does NOT change: today it is in Present's tools. If the owner meant it to be available outside Present too, that is a new door — ASK before adding it.
- Remove what the reversal makes dead: `hbPointerHandAt`'s hand-over-buttons lift (`.hb-cur-chain`, `HB_CUR_CONTROL`) if nothing else uses it; flag the names STALE in the MAP.

**Tests:** browser (extend the Present check, or a new `pointer-only-verify`): Present → Pointer on, on the Board then on Explorer: over a figure, a chart bar, a tab and the Copilot panel the computed cursor is `none` and the dot is drawn at the mouse; a click on a figure opens nothing and changes no state (board path, open card, tab unchanged); the Exit control and Escape each bring the cursor back; after exit a click works again. Must FAIL on unmodified main (today a click over a button works while pointing, and the dot is hidden there).

---

## ONE BUILD — ORDER OF WORK AND CHECKS

1. One branch from the LATEST main. One commit per part (A, B, C, D, E, F), then one pull request for all six.
2. Read CLAUDE.md, then grep docs/MAP-HISTORY.md for "HOME — THE BOARD AND THE MAP", "EDIT WITH COPILOT — PANEL TIDY-UP", "THE PIN QUOTES WHAT MOVED" and "changedOnly", and read each.
3. Run the Six Questions for B–F (they change what a person sees). B restores a stated rule; C, D, E and F are the owner's exact instructions (F reverses the 6 Oct pointer ruling on the owner's own word). Neither should bite; if one does, say so before building.
4. `npm run lint` first, zero errors. Run the affected test files together until green; the full suite ONCE at the end.
5. Every new check runs against a worktree at unmodified main first and must FAIL there.
6. PHOTOGRAPH WHAT YOU BUILT: the board after each A0 phrase; the Suggested wording on both tabs before and after B (owner's lease example: only 2.1 shown); the chips in light and dark, green and navy brands; Approvals, Obligations, Calendar and Home with their references before and after; every Focus button before and after; Present with Pointer on, on the Board and on Explorer.
7. Update THE MAP in CLAUDE.md (four lines at most per area) and append the story to docs/MAP-HISTORY.md under the same headings. Mark the old board work order as superseded by this one.

## OUT OF SCOPE (BUGLOG line, never a fix)

Anything else found on the way. Not in this order: "Why it matters" as the first shaded row (undecided); the Explorer map's own reading; the phone Home; Insights tabs.

## THE SUMMARY TO THE OWNER (plain English)

For each part, what changed and whether it is changed everywhere it appears; the A0 phrase table before and after (counts only); the lease example before and after; the chips in both brands; which pages' references changed font and which documents (PDF, Word, emails) were left alone; anything left alone and why.
