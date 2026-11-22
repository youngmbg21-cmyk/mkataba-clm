# M — THE HIGHLIGHT GOES TO COPILOT, AND FIVE THINGS OFF FOUR SCREENSHOTS

**Owner-instructed 31 Aug 2026**, in two halves in one message: *"Build option A
with the scroll fix"* — off the three drawn options in **Highlight to Copilot** —
and then five reports off four screenshots, with *"build all the above
autonomously to completion."*

The render is the specification for M-1. The screenshots are the specification
for M-3 to M-6.

## M-1 — THE HIGHLIGHT ARRIVES IN THE RAIL, AND THE STRIP GOES

Owner's own words, 31 Aug: *"Let's make it so that when I highlight the
sentence, it appears in the Copilot screen on the right and I can then ask
Copilot for what I want. This change then eliminates the pop-up strip. To
manually make a change, I just write the change in the contract as currently
designed."* Then, off three drawn options: **build option A.**

- **THE PASSAGE ATTACHES DIRECTLY ABOVE THE ASK BOX**, at the foot of the rail:
  an eyebrow naming the clause, the passage quoted, and a ✕ that lets it go.
  Option A was recommended and chosen because the scope and the ask are then
  read together and the scope can neither scroll away nor be left attached with
  no way to release it.
- **THE CHIPS FOLLOW THE SCOPE.** While a passage is attached the ready-made
  questions are the strip's own three — shorten, firmer, plain English — plus
  the strip's ✕ verb, *suggest deleting these words*, which had no other home in
  the product and is named here rather than lost. With nothing attached the row
  is the four clause-level questions it has always been.
- **THE ASK BOX SAYS WHAT IT IS FOR.** Its placeholder follows the scope, so a
  narrowed box states the narrowing by being set to it.
- **APPLY REPLACES THE PASSAGE, NOT THE CLAUSE**, and the button says so. It
  goes through `ceReplacePassage` — the ONE replacement reading, unchanged — so
  the reader's own typing and a Copilot rewrite still cannot come to disagree
  about what a line break costs.
- **THE STRIP IS DELETED**, with its markup, its CSS and its five functions.
  Manual replacement is typing in the contract, which already works and is what
  the owner asked for.
- **NOTHING FILES.** Applying changes the draft; the one act in the foot still
  puts it on the record.

## M-2 — THE CONTRACT STOPS JUMPING

Owner-reported in the same message: *"whenever I make change or click in the
box, the contract moves up then back down to where I was."*

- The paper is rebuilt on every change to the draft. A rebuilt scroller starts
  at 0 — that is the jump — and `ceRenderPaper` then puts the reader's place
  back with a bare assignment. **Under `scroll-behavior:smooth` that is a
  request to ANIMATE from the top**, which is the glide back down.
- **`rlRestoreScroll` IS THE PRODUCT'S OWN ANSWER** and this page never called
  it. The negotiation page was corrected for the identical fault a fortnight ago
  and its note says so in its own words.
- The smooth rule is NOT removed: it is what makes pressing a change card read
  as a journey to its clause. Suspended for the width of the assignment only.

## M-3 — THE SCAN SAYS IT IS WORKING (image 1)

*"When you click on find obligations or scanning of obligations, it is not clear
that something is working in the background so provide a symbol that a search is
ongoing within the button."*

- **THE BUSY STATE EXISTED AND REACHED ONE DOOR OF TWO.** `runFindObligations`
  wrote it onto `#ob-find` — the Checks-card door — and the contract's own
  Obligations tab draws `#obt-find`, which was never touched. The tab is the
  door in the screenshot.
- **ONE HELPER, EVERY DOOR**, so a third door added later cannot be forgotten.
- **A SYMBOL, NOT ONLY A WORD**: a spinning ring beside the word, defined in
  HaTi's own sheet, standing still under `prefers-reduced-motion`.

## M-4 — NO DUPLICATE OBLIGATIONS, EVER (image 2)

*"Never allow for addition of duplicate obligations."*

- **THE SCAN ALREADY REFUSES ONE** (J-5.3) and the **Add obligation form did
  not**, so the one door a person types into was the one door with no guard.
- `obligationAlreadyOn` is the ONE reading and the form asks it rather than
  growing a second — matched on the description with whitespace collapsed and
  case folded, exactly as the scan matches.
- **REFUSED IN WORDS, NEVER SILENTLY**, and never against ITSELF while editing:
  saving an obligation you are editing without changing its wording is not a
  duplicate.

## M-5 — ONE SEARCH BOX, AND NO NOTE UNDER IT (image 3)

*"Remove the search bar on the left under negotiations because we already have
one on top of the screen. Also remove the 'sorts within each group' writing."*

- The shell bar's own search is the primary one and says so; the page's own
  full-text box sat under it saying almost the same thing.
- **CONTRACTS KEEPS ITS BOX.** The ask names Negotiations and only Negotiations,
  and that page's filter row is the crowded one.
- `ngl_sort_note` and `#reg-sort-note` are STALE. **The FTS wiring is not
  deleted** — `#reg-search` simply is not drawn on that seat, so every handler
  guards on the element and the Contracts seat is byte-identical.

## M-6 — THE WORKLIST READS AS A TABLE (image 4)

Four reports on one screen:

1. *"It is never clear if there is a filter on so you can click clear."* —
   **Clear says whether anything is on.** Dead and quiet with nothing filtered;
   live, accented and counting when something is.
2. *"The table has no column headers."* — **A head row**, naming all six
   columns, on the widths the table already declares.
3. *"The overdue column needs to be the same size in every line therefore
   shorten the obligation."* — **The description is clamped to two lines**, so
   every row is one height and the date column holds one vertical. The whole
   wording is on the row's own hover and one press away in full.
4. *"User can click the obligation and it takes them to the contract in
   question's obligation page."* — **The behaviour already exists and nothing
   said so.** The description reads as the door it is, and the row keeps its
   press.

## ACCEPTANCE

1. A highlight opens nothing over the paper; the passage is in the rail with a
   way to release it; Apply changes those words and no others.
2. The contract does not move when the draft changes.
3. Both scan doors say they are working, and stop when it ends — including when
   it fails.
4. A duplicate description is refused at the form and at the scan, and editing
   one without changing it is not refused.
5. The Negotiations filter row draws one search control and no sort note;
   Contracts is unchanged.
6. The worklist has headers, a Clear that states itself, and a date column on
   one vertical at every row.
7. Both languages, on everything new.
