# PLAIN ENGLISH — FOUR REPORTS OFF FOUR SCREENSHOTS (Part D)

**WRITTEN 11 Sep 2026. REVIEWED, NOT BUILT.** The owner's instruction, in their
own words: *"review but do not code yet … review and Create work orders."*

**THE GATE ON ALL OF IT: nothing here is coded until the owner says go.** When
they do, the build starts from the latest `main`, runs in the order set below,
and each item lands with its nets and one plain-English summary.

## THE FOUR REPORTS, VERBATIM

1. *"Image one, the sentence does not cover the whole line before wrapping."*
   (MK-243, Document tab on Plain English; the bracketed "Parties" line in the
   front matter is drawn as a heading, wraps after "individually", and its
   third line and the reading under it sit on top of each other.)
2. *"Image 2, headers are missing from the plain english section."* (MK-243;
   *5. REPRESENTATIONS, WARRANTIES & COMPLIANCE* and *6. INDEMNIFICATION &
   LIABILITY* are on the paper and nothing faces them in the edition — the
   clause readings 5.1, 5.2, 6.1 draw, the section titles do not.)
3. *"Image 3, some contracts especially excuted contracts are coming back with
   no reading of plain english. This is a big bug."* (MK-346, an executed NDA
   with a ceremonial cover and a contents page; the column says *"8 clauses
   could not be matched to the contract — try again"* and nothing else.)
4. *"Image 4, It seems like the font adjuster does not adjust both the plain
   english and actually contracts equally and at the same time. Also both
   contracts should be of the same exact font size as in the headers should
   the same size in both sides and the main content or clauses should also be
   the same size on both sides so that the font adjuster ensures they adjust
   equally."* (MK-329, an executed NDA; the stepper reads 10px, the edition
   has shrunk to 10px, the contract beside it has not moved.)

## MEASURED FIRST (11 Sep, before anything was touched)

A scratch probe against a real HaTi (test/helpers' `startHati`, the scripted
model, a real Chromium at 1500×1000), staging the two shapes of paper the
screenshots show. Nothing in the product was changed to take these readings.

**Rich working text with section headings** (`<h2>` sections over numbered
`<p><strong>1.1 …</strong>` clauses, plus one long `<h3>` in the front
matter — MK-243's shape):

| What | Reading |
|---|---|
| Rows the walk sends | 8: three `section` rows (the h2 titles, text empty), one `section` row (the bracketed Parties line), four `clause` rows |
| Items the route stores | all 8 — the three empty-bodied section rows included, exactly as the server's own comment says it keeps them |
| Notes the browser draws | 5 — the three section titles are DROPPED by `docReadAnchors` |
| The long `<h3>` note | `text-wrap: balance`, 3 lines, 15.82px |
| Heading sizes, paper vs edition | paper h2 16.24px (1.16em) · paper h3 14.56px (1.04em) · paper h4 14.7px (1.05em) — edition `.dr-s` 15.82px (1.13em), `.dr-h` 14px (1em) |
| Body sizes, paper vs edition | 14px both — already a measured relation |

**An executed template contract** (status Signed, `execution.html` frozen by
`freezeContractHtml`, the sealed signature card drawn under it):

| What | Reading |
|---|---|
| Rows the walk sends | 4, EVERY ONE `kind:'section'`, each carrying 155–743 characters of wording |
| The last row's text | ends *"…Government IPRS identity and CAK-accredited PKI are on the roadmap and not yet active."* — the SEAL CARD's own words, signer names and e-mail addresses included, read as clause 4's wording (`.rl-paper-foot` absent on a sealed record; `.seal-in` present and not furniture) |
| Today's freeze at the 15 / 10 setting | sheet 14 → 9.34px, paragraph 14 → 9.34px — follows the reader |
| An August-shaped freeze (paragraphs carrying `text-[13.5px]`, the class the paper had when MK-329 and MK-346 were sealed) at 15 / 10 | sheet 14 → 9.34px, paragraph **15 → 15px** — a flat 15, the compiled blob's `.text-\[13\.5px\]{font-size:15px}` |
| The edition beside it at 10 | 9.34px — it follows the SHEET's root, which the sealed wording does not |

That last pair IS image 4. The seal-card sentence IS the reading printed under
*4. Governing Law* in image 4 (*"…SHA-256 cryptographic sealing … signed
through its COO (Young Mbagaya, using the email …) … IPRS identity checks …
planned but not yet in use"*).

## RULES THAT GOVERN EVERY ITEM

- **The Bug Fix Rules and the Scope rules stand.** Each item touches the
  Document tab's Plain English layer and the readings route, and nothing
  else; a thing noticed on the way is one line in BUGLOG.md.
- **THE WALL: what the route is sent is the hash.** D-2 moves the sent shape
  on purpose (a `kind` that was wrong); everything else here changes what is
  DRAWN and nothing the route receives. f277 (17) pins the wall; the item that
  moves it says so and says what it costs.
- **The six questions.** Refusal 3 (the contract's pixels) is not touched by
  any item — nothing here is above the first line of the wording. Refusal 2
  (no new band): the foot line *"N clauses could not be matched — try again"*
  already exists and is the one place a partial answer is said; no item adds
  a band. Question 4 (Copilot's place): D-2 is the item — a silent failure
  becomes a said one.
- **A sealed record's words and hash do not move by a byte.** D-3 changes how
  big the SCREEN draws a sealed paper; `hashMode` 'text' is `normText(html)`
  and 'rich' is `canonicalRich(html)`, neither of which reads a stylesheet.
  The export, the PDF and the counterparty copy take `--doc-scale` 1 and are
  out of every item here.

## THE ORDER OF BUILD, AND WHY

D-1 first (one guard, ten minutes, and it is half of image 3 as well as all of
image 2). D-2 second (the executed-paper reading — the "big bug"). D-3 third
(sizes). D-4 last (the wrap — smallest and the one whose overlap still needs
its own measurement on the owner's record).

## D-1 THE PAPER'S OWN HEADINGS ARE DRAWN, WHETHER OR NOT THE MODEL WROTE UNDER THEM (image 2)

**The cause, measured.** `docReadAnchors` (js/views/contract.js) keeps a
section row only where the reading has a body OR the item carries a
model-written `head`. Since Young's 10 Sep ruling headings are no longer
asked of the model, so `head` is empty on every new reading, and the prompt
tells the model to leave a SECTION's reading EMPTY. Both halves of the guard
are therefore false on every section title, and every one is dropped. The
server does the opposite — its own comment says *"a section row is kept on
its heading alone … the paper's own heading is what the browser draws under
it"* — so the two hosts disagree about the same row, which is this
codebase's most expensive fault class. Measured: 8 items stored, 5 drawn,
the three h2 titles missing.

**The ruling to build.**

1. A section row is paired on its key and its heading, and drawn from the
   PAPER's own heading (`row.ownHead` + `cite`/`sep`) — the item's `head` and
   `plain` do not decide whether it exists. The `it.head` half of the guard
   goes; it was the pre-10-Sep world.
2. **Every row that was sent gets its heading in the edition** — a clause row
   whose reading came back empty included (the prompt allows an empty reading
   for counterparts, severability, a cover page). The edition is a document
   and a clause the model had nothing to say about still has its name in it;
   a numbered heading with nothing under it says "nothing to tell" by being
   set to nothing, which is the SAP rule. This is a RULING FOR THE OWNER:
   option A (recommended) — every sent row's heading draws; option B — only
   section titles draw, a clause with an empty reading stays absent as today.
   Option A needs the SERVER to keep an entry for a clause row with an empty
   reading (today `if (!plain && kind !== 'section') return;` drops it) —
   still no wording, still nothing invented; the browser draws the heading.
3. The section title draws at the size D-3 gives it; no other change to the
   markup.

**The nets.** f277 gains: a reading whose section items carry no `head` and
no `plain` still pairs (0 of 1 at the parent). plain-english-verify gains a
section: three h2 titles on the paper → three `.dr-s` headings in the edition,
each level with its title, measured on screen (fails at the parent: 0 drawn).

## D-2 AN EXECUTED CONTRACT IS READ LIKE ANY OTHER (image 3 — the big bug)

Three faults stacked on the same paper; each is its own fix and its own net.

**D-2a THE ROW'S KIND IS A FACT ABOUT THE ROW, NOT ABOUT ITS TAG.** The walk
marks every heading row `kind:'section'`. On template paper — and therefore
on every contract sealed from a template — a clause is an `<h4>` over a
`<p>`, so EVERY clause arrives as a SECTION carrying its full wording
(measured: four rows, all `section`, 155–743 characters each). The prompt
then says, in capitals, that a SECTION's reading must be EMPTY. A model that
obeys returns nothing under any clause; a model that half-obeys returns
something the pairing may refuse. Either way the executed contract "comes
back with no reading". The ruling: a heading row is a `section` only where
it carries NO wording of its own (`text` empty — a title over its own
clauses); a heading row WITH wording is a `clause`. **This moves the sent
shape and therefore the hash** — every contract already read is re-asked on
its next press, once. Said in the summary, as C-6 was.

**D-2b THE SEAL CARD IS FURNITURE.** `DOC_READ_FURNITURE` names
`.rl-paper-head`, `.rl-paper-foot` and `header`; a sealed record's
`signatureBlock` is `.seal-in`, not `.rl-paper-foot`, so the last clause's
range runs to the end of the canvas and swallows the whole card — the hash,
the signers' names, their e-mail addresses, the assurance line — as clause
wording. Measured on the probe; printed in image 4's own reading. The
ruling: `.seal-in` (and the external-execution block) join the furniture
list, and the last row's range stops at the first furniture element after it
(today it stops at `.rl-paper-foot` only). Personal e-mail addresses are
never sent to the model as contract wording again; the reading of the last
clause is the clause.

**D-2c A REFUSED PAIRING SAYS WHY, AND IS NOT A DEAD END.** Eight of eight
rows failing the echo is systematic, and today the route only COUNTS: the
column says *"8 clauses could not be matched — try again"*, and "try again"
re-sends the identical prompt and gets the identical refusal. The ruling:
(i) the route returns, beside `unmatched`, the failed entries' keys and
echoed headings (admin-visible in the server log at minimum; on the record's
`_readings` as `failed:[{key, echo}]`, stripped on PUT/save/share like the
rest of `_readings`) so the fault can be READ rather than guessed; (ii) the
echo comparison tolerates the row LABEL — the doc line reads `[R0] SECTION 1.
Purpose` and `[R1] CLAUSE 1.1 — 1.1 Terms.`, while the prompt says *"copied
exactly as it was given after the key"*: a model that takes that literally
echoes `SECTION 1. Purpose` and fails every row on a contract whose rows are
all headings — which is exactly an executed template contract. Strip a
leading `SECTION`/`CLAUSE` and the `num —` prefix from the echo before
folding; the wall stays (a shifted echo still fails), only a label the route
itself put there stops counting against the model. THIS IS THE LEADING
HYPOTHESIS FOR THE 8, NOT A MEASUREMENT — (i) is what turns it into one, and
the build reads MK-346's own `failed` list before trusting (ii). (iii) The
prompt shows the heading on its own quoted line so "copy it" has one reading.

**Out of D-2.** The ceremonial cover and the contents `<nav>` produce no rows
(their lines carry no dotted number and no heading tag) — measured; nothing
to do there.

**The nets.** f277: a heading row with wording is `clause`, without is
`section` (parent: both `section`); `.seal-in` text never appears in any sent
row (parent: it does); a scripted answer echoing `SECTION 1. Purpose` pairs
(parent: refused); a scripted answer echoing the wrong row's heading is still
refused and named in `failed`. plain-english-verify gains: an executed
template contract on Plain English draws a reading under every clause
(parent: the model is told to write nothing).

## D-3 ONE SIZE ON BOTH SIDES, AND ONE PRESS MOVES BOTH (image 4)

**D-3a THE SEALED PAPER FOLLOWS THE READER ON SCREEN.** A contract sealed
before the 22 Aug size sweep carries `text-[13.5px]` / `text-[13px]` on its
clause paragraphs; the compiled blob resolves those to a FLAT 15px / 14px
that ignores `--doc-scale`. The sealed markup is kept byte for byte (the
rule), so the fix is a rule in HaTi's own sheet, scoped to the screen's paper
(`#doc-zoom .doc-surface .text-\[13\.5px\]` and its sibling, at equal
specificity and later in source than the blob — never `!important`):
`font-size:inherit`, so the frozen paragraph takes the sheet's own
`14px × --doc-scale` exactly as today's paper does. RULING FOR THE OWNER: at
the 15 setting a sealed paper then draws at 14px where it drew at 15 — a
1px change in how big the screen draws it, nothing in the sealed content, the
hash, the PDF or the counterparty copy. Recommended: yes, one size rule for
every paper on the tab.

**D-3b THE EDITION'S HEADINGS ARE MEASURED OFF THE FACING HEADING.** The body
already is (`--dr-size` off the sheet's computed size; `--dr-face` beside
it). The headings are not: `.dr-s` is a typed 1.13em and `.dr-h` a typed 1em,
against a paper whose h2 is 1.16em, h3 1.04em and template h4 1.05em —
measured, four different numbers for "the same size". The ruling: for each
entry `docReadPaint` reads `getComputedStyle` of the element it faces
(`p.el` for a section; the bold lead-in for a clause) and writes that
font-size on the entry's own heading (`--dr-hsize`, one custom property per
note, the same mechanism as the two already there). A RELATION, so a design
added tomorrow is right by construction; no list of ratios to keep in step.
Weight, case and letter-spacing are NOT copied — the owner asked for size;
copying the rest is a second ruling if they want it.

**D-3c ONE PRESS REPAINTS BOTH COLUMNS.** `rlSetDocType` → `applyDocZoom`
writes `--doc-scale` on the paper's wrapper; the edition is repainted only by
a `ResizeObserver` on the canvas — so it follows only when the PAPER changes
height, which a paper at a flat 15px never does, and follows a frame late
otherwise. The ruling: the Document tab's setter path repaints the edition
explicitly (`docReadPaint` on the contract the layer holds, `layer._docReadC`)
in the same call; the observer stays for the paper's own reflows.

**The nets.** plain-english-verify gains: (a) an August-shaped freeze at the
10 setting — the paragraph's computed size equals the sheet's (parent: 15 vs
9.34); (b) each edition heading's computed size equals the facing paper
heading's, for a section (h2) and for a clause lead-in (strong), at the 15
and 10 settings (parent: 15.82 vs 16.24); (c) one press on A⁻ and, with no
resize event, the edition's size has moved in the same frame. f277 pins that
the sent shape does not move for any of D-3.

## D-4 A HEADING FILLS ITS LINE BEFORE IT WRAPS (image 1)

**The cause, measured.** `.doc-read-note .dr-s` carries `text-wrap:balance`,
which evens the lines of a wrapped heading by breaking the first one early —
which is what *"does not cover the whole line before wrapping"* is. The
contract beside it wraps at the edge, so a two-line title on the paper faces
a three-line one in the edition (measured: three balanced lines at 15.82px
where the paper's own line ran full). The ruling: the declaration goes; the
edition wraps as the paper wraps (`text-wrap:wrap`, the default). Nothing
else in that rule moves.

**The overlap is not yet measured.** In the screenshot the heading's third
line and the reading's first line share a row. The probe (a real `<h3>` in a
rich working text) drew the note whole and the next note 18px below it. The
owner's paper is a Word upload set in Formal legal, where the bracketed
Parties line is a BOLD PARAGRAPH the reader marked as a heading. The build
stages THAT shape (the docx reader's bold-paragraph heading on a
formal-legal design) and measures the two elements' rects before writing a
line of fix; a candidate is the size of a heading changing after the notes
were placed (a design's face or D-3b's size landing after `offsetHeight` was
read), in which case placement is re-run after the sizes are written. If it
does not reproduce there either, it is said so in the summary rather than
"fixed".

**The nets.** plain-english-verify section 14's geometry gains: a heading
longer than the column's width has its first line rect wider than 90% of the
column (parent: balanced, ~66%); no two notes' rects intersect, and inside
one note the heading's bottom is at or above the reading's top.

## RECORD KEEPING

- THE MAP (CLAUDE.md) gains one section, *THE EXECUTED PAPER IS READ, THE
  HEADINGS ARE DRAWN, THE SIZES ARE MEASURED (Part D)*, terse; the story goes
  in docs/MAP-HISTORY.md under the same heading. The PLAIN ENGLISH section's
  line *"an empty reading is right for a cover page"* stays; the line about
  `docReadAnchors` gains "a section is kept on the paper's heading alone".
- BUGLOG.md: one run section per item, appended.
- The summary to the owner: what each of the four now does, the one hash move
  (D-2a) and what it costs, the two rulings asked (D-1 option A/B, D-3a's
  1px), and whether D-4's overlap reproduced.

## SUMMARY FOR THE OWNER (plain English)

- Image 2: the section titles ARE in the answer HaTi stores; the screen throws
  them away because of a check written for the old world where the model wrote
  the headings. Fix is small and certain.
- Image 3: three things at once on signed contracts. Every clause of a
  template contract is labelled "section title" and the model is told to write
  nothing under a section title; the signed-and-sealed card at the bottom
  (names, e-mails, codes) is being read to the model as part of the last
  clause; and when the matching fails HaTi only counts, so nobody can see
  why. All three are fixed; the third gets a way to SEE the reason first.
- Image 4: contracts sealed before 22 August carry an old fixed size that
  ignores the A⁻/A⁺ control, so the contract stays put while the edition
  moves. The edition's headings also use their own sizes instead of copying
  the contract's. Both become "copy what the contract does".
- Image 1: the edition deliberately evens out the lines of a heading, which
  is why it wraps early. That comes off. The two lines sitting on each other
  could not be reproduced on the test paper and will be measured on paper
  shaped like yours before it is called fixed.
