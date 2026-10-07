# WORK ORDER — The board draws what you ask, however you say it

**Status: NOT STARTED. Written 7 Oct 2026. No code was written with this order.**

**The owner's words, 7 Oct 2026** (two screenshots of the Home board, the
Intelligence panel on the right, the board below it empty):

> "why is this not working? do not code"
>
> "i also see this error where it is not building. It seems some times I have
> to say "show me" in order for it to work. Make it so that i can just say what
> needs to come up without saying show me. Do not code but put together a work
> order for everything discussed"

**What the owner has seen:**
- The guide page "Ask the Board"
  (https://claude.ai/artifact/7KYY1XTBkzsaaUpZhXR19y). It lists what Home's
  Copilot can draw, with sixteen example cards. One of its examples —
  "bubble chart of value against time left" — is exactly the question that
  failed. Part 6 corrects the page.

---

## The one rule this order serves

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

## What went wrong (diagnosed 7 Oct, read-only)

### Screenshot 1 — "bubble chart of value against time left"
Reply: *"Grouped 180 contracts into 6 groups by expiry window · 113 in "No
expiry set" · Coloured by value · Sized by value · Labelled by customer ·
Timeline by expiry date"*. The board stayed empty.

### Screenshot 2 — "show me bubble chart of value against time left"
Reply: *"Sized by value · Timeline by expiry date. This bubble chart plots
contracts by their expiry date (left to right, time remaining) and sizes them
by value. The 4 contracts ending within 90 days stand out …"*. The board stayed
empty again. Copilot described a chart that was never drawn.

### The three wrong turns (each one is a Part below)

1. **HaTi's own reader passed the question on.** `hbRecipeRead` reads
   "bubble chart" (pic `bubbles`) and "value" (measure). But "of", "against",
   "time left" are not in `HB_RC.filler` and no rule consumes them, so
   `R.left` is not empty, `hbParse` returns null, and the question goes to
   Copilot. "Value against time left" is literally what the bubbles picture
   already draws (`hb_pic_bubbles`: "Bubbles: value against time left"), so
   HaTi should have drawn it itself, free. (Likely, not yet measured in a
   browser. Part 1 measures it first.)

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

### Why "show me" sometimes seems to matter
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

## Where things stand (read before touching anything)

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

**Before writing ANY code:** run Part 0's phrase table against a worktree at
unmodified main and save the results. "Already broken" is proved there, never
assumed (CLAUDE.md: A CHECK THAT PASSES AGAINST THE PARENT IS A DESCRIPTION).

---

## Part 0 — Measure first: the phrase table

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

## Part 1 — HaTi reads "value against time left" itself

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

## Part 2 — The opening words never decide the road

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
- Prove it with Part 0: every row identical across its five openings.

## Part 3 — On the board, a map answer never touches the hidden map

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

## Part 4 — Copilot's words never claim a picture that is not there

- On the board, Copilot's prose `answer` is shown ONLY when something it
  describes was actually drawn, or when the question was a question about what
  the board already shows (the prompt's "A QUESTION ABOUT WHAT THE BOARD SHOWS").
- A sentence that names a chart ("This bubble chart plots…") while no card
  landed is dropped, and the reply says what DID happen. Use the existing
  checker (`hbProseChecked` / `hbFactCheck`) and extend it with this one case
  rather than writing a second checker.
- The "Sized by value · Timeline by expiry date" style sentence (composed by
  `intelGraphApply` from the map's roles) must never appear on the board,
  because after Part 3 that function no longer runs there.

## Part 5 — The server prompt says it once more, harder

- In the `boardJob` prompt: add one short example of a picture question
  answered with `add_card` (e.g. "bubble chart of value against time left →
  add_card {which:{all:true}, recipe:{pic:'bubbles', measure:'value'}}").
- In the server's cleaning of the reply, when the request came from the board
  (`onBoard`) and the reader did not ask for the map, strip the map's fields
  (`groupBy`, `floorsBy`, `columnsBy`, `colourBy`, `sizeBy`, `labelBy`,
  `timeBy`, `view`, `look`) before the reply leaves the server. THE SERVER IS
  THE WALL; the browser rule in Part 3 is the second line.
- Do not raise the token budget or add calls; one retry (Part 3) is the most.

## Part 6 — Correct the guide page

- Republish "Ask the Board" (https://claude.ai/artifact/7KYY1XTBkzsaaUpZhXR19y,
  read it first with the Artifact tool, then publish to that URL) only once
  Parts 1–4 are merged and the phrase table is green:
  - add a short line under "How a question is read": the opening words
    ("show me", "give me", …) make no difference;
  - keep "bubble chart of value against time left" as an example only if
    Part 0's row for it is green on main. If it is not, change the example to a
    phrasing that is.

---

## Tests

- New: `test/chromium/board-says-it-plain-verify.js` (Part 0's table; the five
  openings; the two "not a chart" rows; the hidden map's grouping and look
  unchanged after every board question; no reply sentence names a chart when no
  card landed).
- New node test `test/f541.test.js` (number is the next free one; check
  first): `hbRecipeRead` leaves nothing over for the Part 1 phrases; the five
  openings give the same reading for every Part 0 phrase; `HB_RX.bring` opens a
  contract only with no chart words; server: a board reply loses the map's
  fields unless the map was asked for.
- Re-run the existing board files only: f496–f502, f504, f511–f521,
  f524–f538, board-* and chart-* verify files, insights-shelf-verify. The full
  suite once at the end.
- Every new check is run against unmodified main first and must FAIL there for
  the rows this order fixes. A check that passes on main describes, it does not
  test.

## Out of scope (BUGLOG line, never a fix)

Anything found on the way that is not one of the Parts above: the Explorer
map's own reading, the phone Home (which keeps old Home), other Copilot
panels, Insights tabs.

## The morning summary (plain English, for the owner)

- What changed, in one sentence per Part.
- The phrase table before and after (just the counts: "12 of 18 drew a chart on
  main with 'show me', 7 of 18 without; now 18 of 18 both ways").
- Anything left alone and why.
- That the guide page was corrected, or why not yet.
- Add the four-line MAP entry under "HOME — THE BOARD AND THE MAP" and the
  story under the same heading at the end of docs/MAP-HISTORY.md.
