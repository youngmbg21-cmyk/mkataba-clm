# WORK ORDER — FIVE OFF FIVE IMAGES

Young, 21 Sep 2026, in the owner's own words:

> *"Image 1, the page is too white as i have said previously. Add some color
> variation and easy to see the card outlines. the line of business line and the
> drop down fields are so close to overlapping with the contract cards. Beyond
> that, make all drop downs in the platform similar to the ones in the contract
> and negotiation pages. Image 2, the highlighted briefing card has a bug
> because it fails to run all the time. Image 3, the fix for running a brief
> before signing is not working. I need a button similar to the run readings
> button where it is mandatory to run or else you cannot sign. It should be the
> first button before going through the rest of the field. It should be similar
> to the button highlighted in image 5 and once you run it, the brief appears
> from the side panel. Image 4, it is not clear which clause copilot is working
> on."*

**NOTHING IS BUILT YET.** This is the understanding put back before any code is
written, with what has already been measured against the running product.

**ITEMS 2 AND 3 ARE PROBABLY ONE FAULT.** The brief is failing to be written at
all (item 2); the "show me the brief after the run" step built on 21 Sep only
fires where a brief was really written, so a brief that never arrives is a
panel that never opens. **Item 2 is measured and fixed first**, and item 3 is
then built on a brief that works. Said here so nobody builds item 3 against a
broken call and reports it done.

---

## 1 · THE NEW AGREEMENT POP-UP — COLOUR, OUTLINES, BREATHING ROOM, AND THE DROPDOWNS

Three separate asks in one image. The first two are about this screen; the
third is about the whole platform.

### 1a · IT IS WHITE ON WHITE, AND THE OWNER HAS SAID SO BEFORE

**MEASURED.** Every surface on that screen resolves to `--color-surface`:
the dialog frame, `.na-door` (each company-standard card), `.na-card` (the
questions card on the right) and the page behind them. The only thing separating
a card from what it sits on is a 1px `--color-divider` hairline. Six cards in a
grid with no ground behind them read as one sheet with lines drawn on it.

**WHAT TO BUILD — and the constraint that decides it.** The dialog's BODY takes
the page's own ground (`--color-bg`, the grey every other screen sits on) so the
white cards have something to be white against, and the card edge steps up from
`--color-divider` to `--rule-strong`, which is the token `.ui-btn` already uses
to make a control's edge visible on white. **THE SELECTED CARD IS UNCHANGED** —
it already wears the accent border plus an inset ring, and it is the one thing
on the screen that must stay louder than everything else.

**IT IS NOT A COLOUR SCHEME.** "Colour variation" here means ground against
surface, which is how every other page in HaTi already reads. Tinting the cards
themselves would make six cards claim six different things, and only one of
them — the chosen one — has anything to claim.

**THE CHIPS AND THE FOOT COME WITH IT.** `.na-chip` is a dashed outline on white
and will need re-checking against a grey ground; so will the foot row. Measure,
do not assume.

### 1b · THE LINE-OF-BUSINESS ROW IS CRAMPED AGAINST THE CARDS ABOVE IT

**MEASURED.** `.na-sec` sets an 8px gap between a section's heading row and its
contents, and `.na-doors` sets a 12px gap between cards. So the `HATI STANDARD`
heading — which carries the line-of-business label and its `<select>` on the
same line, pushed right by `margin-left:auto` — sits 8px under the last row of
company-standard cards, tighter than the cards are to each other. The select is
also 26px tall where every other control on that screen is 32px, so it reads as
a different class of thing crushed into a heading.

**WHAT TO BUILD.** The gap ABOVE a section heading is larger than the gap
between the things inside it — that is the ordinary rule and it is being broken
here. The select comes up to the form's own field height (`--field-h`), so the
one control in that row is the same size as the controls in the card beside it.

**SAID OUT LOUD, NOT DECIDED.** `.na-sec-h` is `flex-wrap:wrap`, so at a narrow
window the select drops to its own line and the spacing question changes shape.
Measure at the owner's own width first (the screenshot is ~1210px of dialog),
then at the widths `NA_PAPER_MIN_W` divides.

### 1c · EVERY DROPDOWN IN THE PLATFORM DRAWS HaTi'S OWN LIST

**THIS IS THE ASK THE 21 SEP NOTE LEFT OPEN.** `selectMenuWire` /
`.hati-selmenu` were built that day — a HaTi-drawn list at `--radius-lg` with
the product's own ink, mounted on `document.body` at `position:fixed` so a
sticky band cannot clip it — and armed on the Contracts filter bar **alone**.
The note ends: *"every other `<select>` still drops the system's list until
somebody asks."* This is that ask.

**THE READING OF "the contract and negotiation pages"**: both of those pages are
drawn by `renderRegister`, and the filter bar is where the new list lives. So
the owner is naming the dropdown he likes and asking for it everywhere. **If
that reading is wrong — if he means the ⋯ menu or the Document tab's Export
menu — say so before building**, because those are menus of ACTS and a select is
a list of VALUES, and turning one into the other would be a different job.

**WHAT MAKES IT SAFE, and it must not be given up.** The `<select>` STAYS and is
still the record: the wire intercepts the pointer, draws the list, writes the
value back and fires the select's own `change`, so nothing downstream learns a
menu was involved. **THE KEYBOARD IS LEFT ALONE** — arrows, Home, End and
type-ahead are the browser's, and rebuilding them in a div is how a control
loses behaviour nobody noticed it had.

**MEASURED SCOPE: about 100 `<select>` elements across 30 files**, the heaviest
being Settings (16), the template library (9), the negotiation page (8) and the
contract room (8). **A blanket `selectMenuWire(document, 'select')` is the wrong
answer** and must not be the build: a multiple-select, a select inside a
dragged dialog, a select on the counterparty's page and a select on the phone
each need looking at once. Build it as a named sweep, page by page, with the
phone and the counterparty's seat explicitly asked about rather than swept.

---

## 2 · THE BRIEF FAILS TO RUN, AND IT IS NOT THE KEY OR THE BUDGET

> *"the highlighted briefing card has a bug because it fails to run all the time."*

**THE MEASUREMENT THAT NARROWS IT, and it is in the owner's own screenshot.**
On that contract the arrival strip reads: **No brief** — "Copilot could not be
reached just now" — beside **Standards checked (4)**, **Obligations found (20)**,
**16 open fields** and **Filed**. Three of those four are Copilot calls made in
the same breath as the brief, against the same key, the same budget and the same
network, and **they came back**. So this is not the key, not the daily cap and
not the provider being down. It is something specific to the brief's own call.

**WHAT IS ALREADY KNOWN AND MUST NOT BE RE-DONE.** The 21 Sep fix changed what
the tile SAYS, not whether the call works: `triageWhy` turned a developer's
`fetch failed` into one of five sentences a reader can act on. That work stands.
The owner is now reporting the failure underneath it.

**THE THREE CANDIDATES, to be measured before anything is written:**

1. **IT IS THE LONGEST CALL ON THE SCREEN.** The brief is the deep tier at
   `max_tokens: 4000` over up to `AI_DOC_CHARS` (200,000) of wording, where the
   obligations scan and the standards pass are each bounded tighter. A transport
   timeout on a long contract would look exactly like this and would fail more
   often the longer the paper is. **The owner's contract is a distribution
   agreement**, which is the long end.
2. **THERE IS NO RETRY ON A TRANSPORT FAILURE.** `anthropicMessages` retries
   once, but **only when the provider rejects the MODEL** (an HTTP status). A
   `fetch failed` is not retried at all, by any caller.
3. **THE DEEP RATE LIMIT IS SHARED.** `rlAiDeep` allows 15 deep calls per
   window per person, and one arrival run spends several — brief, standards,
   obligations — with Prepare redlines, the renewal adviser and the Plain
   English edition drawing on the same bucket. A second contract filed inside
   the window could starve the brief. **This should show as the rate-limit
   sentence rather than "could not be reached", so it is the least likely of
   the three — but it is cheap to rule out.**

**WHAT TO BUILD, once it is measured.** Whatever the cause, two things are owed
regardless and both are this product's own rules:

- **A CAP OR A FAILURE IS A FACT, NEVER A SILENT ONE** — that holds already. But
  **"Try again in a moment" is a sentence with no way to try again.** The tile
  offers no act. It should carry the press that runs the brief, which is the
  one `openCheckPanel`'s own card already draws, so there is no second door onto
  writing a brief.
- **ONE READING, EVERY STEP.** If the answer is a timeout or a retry, it is
  asked where every AI call is made and not at the brief alone — the
  four-call-sites lesson this file has paid for twice.

**NOT DECIDED, and it needs the owner:** if the cause is length, the honest
answer may be that a very long contract's brief is written in pages the way the
Plain English edition already is, which costs more than one call. That is money
and it is his to rule on.

---

## 3 · A BRIEF IS RUN BEFORE SIGNING, FIRST, AND IT CANNOT BE SKIPPED

> *"I need a button similar to the run readings button where it is mandatory to
> run or else you cannot sign. It should be the first button before going
> through the rest of the field ... once you run it, the brief appears from the
> side panel."*

**WHAT IS ALREADY THERE.** *Before you sign* has a `brief` row in the READ
stage; it holds the signature under the default `advise` gate; and `runSignCheck`
re-writes the brief and then opens the panel. **So the machinery exists and the
owner is still not getting it.** Two reasons, and they are different:

1. **THE BRIEF IS FOLDED INTO "Run N readings".** In the owner's screenshot the
   button says **Run 2 readings** — the brief is not one of the two. It is
   counted only where it is missing, stale or cut short, so on a contract whose
   brief HaTi believes is fresh there is no brief row and no brief press, and a
   reader who wants to read the brief before signing has nowhere to press.
   **The owner is asking for it to be unconditional.**
2. **AND WHERE IT DOES RUN, THE PANEL DOES NOT OPEN** — because the run fails
   (item 2), and the 21 Sep step only opens the panel where a brief was really
   written. Fixing item 2 is what makes this visible.

**WHAT TO BUILD.**

- **A BUTTON OF ITS OWN, FIRST, before the paper stage.** Not inside the
  readings stage and not behind the other two. It is drawn whatever state the
  brief is in, because the ask is that reading the brief is a STEP, not a
  repair.
- **SHAPED LIKE IMAGE 5** — *Write the brief*, the Overview's own control, which
  is `.ui-btn`: a white face, a hairline edge and the page's ink. **NEVER
  FILLED**: one filled button per screen and on this screen that is Sign. The
  Run-readings control (`.sc-stage-act`) is already written as the secondary
  button and this one wears the same clothes, so the two read as one family.
- **IT HOLDS THE SIGNATURE.** The brief row holds under every gate but `off`,
  which is what "mandatory" means here, and the Sign button's own count already
  says how many rows are holding.
- **IT OPENS THE PANEL WHEN IT LANDS** — `openCheckPanel(c,'brief')`, the same
  call the Overview's card makes, so there is never a second idea of what
  "open the brief" means.
- **IT SAYS WHAT IT COSTS**, as *Run N readings* does: the press spends money
  and the label should not hide that.

**THE ONE DOOR QUESTION, asked and answered.** This is a THIRD press onto
writing a brief — the Overview card, the arrival tile and now this. All three
must call the one act; if they cannot, this button is a proxy onto the card's
own press. **Two doors are only safe as one act** — the rule this codebase has
paid for at the empty change column and at Prepare redlines.

**NOT DECIDED, and it changes what is built:** whether the brief should HOLD on
a contract whose brief is fresh and has simply not been opened by this reader.
"Mandatory to run" and "mandatory to have read" are different rules, and only
the owner can say which he means. **The build should ask before assuming the
stricter one**, because the stricter one makes every signature on a briefed
contract re-spend money.

---

## 4 · THE COPILOT RAIL NAMES THE CLAUSE IT IS WORKING ON

> *"it is not clear which clause copilot is working on."*

**MEASURED.** The rail's head row says **`✦ Copilot`** and nothing else, then
the tabs. The clause name is on the screen in two other places — the shell
crumb, 40px up and in the dark bar, and the heading on the paper to the left,
which scrolls away — so a reader deep in a conversation about wording has
nothing beside that conversation saying what it is about. In the owner's own
screenshot the rail is discussing *Quality & Rejection* while the paper beside
it is showing *Governing Law and Dispute Resolution*, which is exactly the
confusion.

**WHAT TO BUILD.** The rail's head names its clause, through **`ceClauseLabel`**
— the one presenting reading this page already has, which goes through
`clauseNameShown`, so the rail cannot spell a clause differently from the column,
the paper or the crumb. It sits with `✦ Copilot`, elides rather than wrapping
(that row also holds three tabs and a count), and carries the whole name on the
hover.

**IT FOLLOWS THE CLAUSE.** Moving to another clause repaints the rail, so the
name must be read at the paint and not written once at the open — the same trap
the strip's own counts were built around.

**SAID OUT LOUD.** The shell crumb already names the clause, so this is the same
fact twice on one screen. It earns its place because the crumb is in the shell
bar, far from the conversation, in a different colour, and the owner has just
told us it is not doing the job. **If the answer is to make the crumb louder
rather than to repeat it, that is the owner's call** — put both to him.

---

## 5 · WHAT IS NOT IN THIS ORDER

- **No change to what the brief SAYS**, only to whether it is written and shown.
- **No new band, strip or notice** on any of these screens.
- **No change to the Overview's own brief card** — image 5 is quoted as the
  SHAPE for item 3's button, not as something to alter.
- **The Contracts filter bar's dropdowns are already done** and are the
  reference for item 1c, not part of its work.

---

## TESTS EACH ITEM OWES

Every claim is proved RED at the unmodified parent before it is called a fix.

- **1a/1b** — a browser file measuring the dialog's ground against its cards'
  ground (two different colours), the card edge's computed contrast, the gap
  above the section heading against the gap between cards, and the select's
  height against the form's. Pixels, not source.
- **1c** — a node sweep that every `<select>` on the swept pages is wired, and a
  browser file that a press opens HaTi's list, a press on a row writes the value
  AND fires `change`, and the keyboard still reaches every option. Plus the
  named absences: what was deliberately not swept and why.
- **2** — a node test that a transport failure is retried / bounded (whatever the
  measurement says), and a browser file that the failed tile carries a press.
  **The measurement itself goes in the run log**, because the owner is owed the
  answer to "why does it fail" and not only the fix.
- **3** — node claims that the button is drawn whatever the brief's state, that
  it is first, that it holds under `advise` and `require`, and that it presses
  the same act as the card; a browser file that drives a real press and reads
  the panel open.
- **4** — a browser file that reads the painted rail head, and that it changes
  when the reader moves to another clause.
