# HaTi — clause-editor

*the full-window Edit with Copilot page, work mode, the writing bar, typing on the paper, clause names and front matter*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## A CLAUSE'S NAME IS PART OF THE CLAUSE (owner-asked 28 Aug 2026)

*"the ability to edit the name of the header."* A contract is CITED by its
headings — "subject to Clause 9", "the limits in Section 4" — so proposing
“Charges” where the document says “Payment Terms” is a change to the agreement
and not a caption on a screen. It was the one part of a clause nothing could
move: `headingText` was carried and applied for an `insertClause` ONLY.

- **IT IS THE ONE FUNNEL, THE ONE RECORD AND NO NEW ACT.** `negoEditClause`
  gained an optional `opts.headingText` and the change carries it on a `modify`.
  **ABSENT MEANS THE FILING SAYS NOTHING ABOUT THE HEADING**, which is what every
  caller written before this passes — the playbook, the Word round trip, Copilot,
  the clause library — so no existing route changes behaviour and there is
  nothing to migrate. Every guard the funnel carries (the executed-wording
  freeze, the desk rule, the review gate) applies without being repeated.
- **THE NO-OP GUARD HAD TO LEARN ABOUT IT.** A rename files ALL-KEEP ops, so the
  rule that stops a clause somebody merely LOOKED at filing a fingerprint would
  have swallowed it. It joins the formatting-only exemption — **on both halves**:
  the filing must MOVE what the record says about the heading, AND the record
  must still propose one afterwards. So typing the original name back over a
  pending rename is refused with “nothing changed”, exactly as typing the
  original WORDING back already is, rather than leaving a change on the column
  that proposes nothing at all. **Taking a rename back is Withdraw**, which is
  the verb for it and is on the card.
- **THE NAME THE CLAUSE ALREADY HAS IS NOT A RENAME**, and is stored as `''`
  rather than as itself: storing it would leave a record claiming one.
  `negoHeadingAsk(cl, ch)` is the ONE reading of whether a heading moved, so the
  paper, the room, the card and the panel cannot come to disagree about it.
- **v5, AND THE HEADING IS INSIDE IT.** Left outside the attestation the rename
  would have been the one part of the document a change carries and the
  fingerprint does not — the visible rename rewritable without disturbing the
  hash, which is the v4 argument for `ops`, one field along. Appended AFTER ops
  through the same length prefix, so a v5 input is a v4 input with one more field
  on the end. `NEGO_HASH_VERIFIES` gains 5 and **nothing already filed moves**:
  every record keeps the version stamped on it and verifies under that version
  for ever.
- **A CLAUSE WHOSE WORDS DID NOT MOVE READS AS THE DOCUMENT.** Drawn from
  all-keep ops it would come back as its TEXT PROJECTION — one flat run where the
  document has a numbered list or an indented sub-paragraph — so the wording
  nobody touched would visibly lose its shape the moment somebody proposed a new
  name for it. `negoWordsMoved(ch)` is that reading and BOTH canvases ask it;
  guarded on the ops actually being a list, so a change that arrived with no ops
  at all keeps the fallback it has always had.
- **BOTH RENDERERS, ONE READING, DIFFERENT CLOTHES.** redlineDocHtml prints the
  document's own heading verbatim; negoDocHtml prints the REBUILT LABEL (number
  and title). Both honour the reading exactly as the body under them does — As
  agreed keeps the name the clause has, With changes wears the proposed one, only
  Redlined shows both — and **a settled rename keeps its marks in every reading**,
  for the reason the body's own note gives: the marks are the record of what was
  decided.
- **ACCEPTING IT KEEPS THE CLAUSE.** `clauseReplaceHeading` rewrites the words and
  keeps the element, its rank and its id, so a renamed clause is the same clause:
  every change already filed against it still points at it and the ids the other
  side holds still resolve.
- **TWO EDITORS OFFER IT AND ONE DELIBERATELY DOES NOT.** The clause panel (which
  is the door the paper's own pencil opens) draws an editable `.rl-cp-clname`
  when the editor opens on it; work mode types it on the paper itself
  (`#ce-clausehead`), in the same dashed frame the wording wears. **THE ROOM'S
  INLINE EDITOR GETS NO NAME BOX**: that canvas prints a rebuilt LABEL rather
  than the heading string the document stores, so a box over it would be editing
  something the record does not hold.
- **AND A CLAUSE WITH NO HEADING IS REFUSED ONE.** That is an upload that arrived
  as a wall of paragraphs, and in that document HEADINGS DO NOT MARK THE CLAUSES
  — `clauseSegment` reads one clause per top-level block and the ids sit on
  paragraphs — so writing a heading in would not rename a clause, it would
  re-segment the whole agreement under a reader who asked to change a name.
  `clauseReplaceHeading` finds nothing to rewrite and answers null, so the box is
  simply not drawn where the act cannot work: the screen agreeing with the model.
- **A HEADING IS ONE LINE AND IT IS TEXT.** Enter finishes the name rather than
  putting a paragraph break inside a citation string, and what is read back is
  `textContent` — the document model writes a heading with textContent, so markup
  a paste brought in would be flattened on the way to the record and the box
  would stop showing what is stored.
- **IN WORK MODE THE DRAFT HAS TWO HALVES AND ONE STEP STACK.** `_ceSteps` entries
  carry `head` beside `text`, `cePullText` takes BOTH onto one step (which is why
  the heading got no puller of its own — that function is called from about ten
  places and a second would have had to be remembered at each), and
  `ceRestoreStep` puts the pair back. A step recorded before the heading joined
  the stack falls to the standing name, which is what that step meant.

Tests: f249 (39 — **23 of the 28 that run against the parent commit fail there**),
f35 and f151 (the hash-version claims REVERSED IN PLACE — f151's literal is kept
as a literal ON PURPOSE, with its own stated reason, and now checks the canonical
string beside the number so the two cannot drift), f210 (one source claim
RE-POINTED: it pinned a whole argument list, so adding the name to the same call
read as the branch being gone).

## THE FRONT MATTER IS A REGION, AND IT IS PROPOSED ON (owner-ruled 28 Aug 2026)

*Front matter — the title, the parties, the recitals and the signature block —
"editable, recorded as a document change."*

The opening names the parties and states what the agreement is FOR, and both are
argued over on real paper. It was the one part of the document nothing could
propose against, because the change model keys everything on a clause id and the
front matter has none. **`clauseSegment`'s own note gave the reason in so many
words — "nobody negotiates the title" — and that line is REVERSED IN PLACE.**

- **THE SKIP STANDS; THE REGION IS NEW.** `clauseSegment` still skips the front
  matter, so it never appears in the clause list, the round queue's document
  order lookup, the numbering or any count — **a reader is never asked to decide
  "clause 0"**. What it gains is one reserved id, `CLAUSE_FRONT_ID = 'front'`,
  and that id is **deliberately not `cl_`-prefixed**: `clauseNewId` only ever
  mints `cl_…` and `clauseStampIds` only ever writes what `clauseNewId` returns,
  so a collision is impossible by construction rather than by luck.
- **WHAT THAT BUYS IS THE WHOLE REASON FOR DOING IT THIS WAY.** The funnel, the
  fingerprint, the revision fold, the cards, the round close, the payload
  allow-list and the counterparty's copy all address a change by `clauseId` and
  already work. No new changeType, no new store, no new route, no migration.
  `negoClauseById` and `negoClauseNowById` route on the id and everything
  downstream inherits it.
- **THREE FUNCTIONS IN THE MODEL, and they are the only new machinery**:
  `clauseFrontClause(html)` reads the region as a clause-shaped object,
  `clauseFrontParts(frontHtml)` splits whichever version is being drawn into
  kicker / title / recital, and `clauseReplaceFront(html, frontHtml)` writes it
  back. `_clFrontEnd` is where the region ends, asked once so the segmentation,
  `clauseFrontMatter` and the writer cannot disagree about where the document's
  own words stop.
- **IT MAY NOT CHANGE WHAT THE CLAUSES ARE, AND THAT IS MEASURED.** A heading
  pasted into the recital is a NEW CLAUSE as far as this model is concerned, and
  the agreement would re-segment under a reader who was correcting a party's
  name — every clause id re-pointed, silently, by a paste. So the result is read
  back through the segmentation the rest of the product uses and refused unless
  it returns the same clause ids in the same order. **The trial runs at the
  filing door**, so the reader is told in words at the moment they press rather
  than having the change file, travel, and then quietly fail to apply when the
  round closes.
- **AND THE REGION HAS TO SURVIVE ITS OWN EDIT.** The region is detected by its
  TITLE — a rank-1 heading above the first clause — so an edit that deleted the
  title would leave the recital orphaned and the region itself unreachable for
  ever: no pencil would draw on it again and nothing could propose against it.
  One accepted change would quietly close a door with no way back. Refused.
  Dropping the RECITAL is allowed; only the title is load-bearing.
- **ONLY WHERE HEADINGS MARK THE CLAUSES.** In a document whose headings do not
  — an upload that arrived as a wall of paragraphs — every block under the title
  IS a clause and the ids sit on paragraphs, so a front-matter edit that happened
  to introduce a heading would re-segment the whole agreement. **Not offered
  rather than guarded**: `clauseFrontClause` answers null, no pencil is drawn,
  and the paper draws exactly what it always drew.
- **THE THREE READINGS ARE DOCUMENTS, NOT MARKS.** A clean reading has real
  markup on both sides — the baseline's, and the one the change proposes — so
  'As agreed' and 'With changes' keep the title's own size and the recital's own
  shape. **Only the redlined reading flattens the region to its text**, which is
  what a redline is and is the same trade every clause on this page already
  makes.
- **ONE CONTROL AND NOTHING ELSE ON THE PAPER.** The pencil every clause carries,
  at the region's top right, hover-only like theirs, opening the same clause
  panel through the same `data-rl-cp-open`. `is-changed` borrows the clause's own
  red margin rule rather than inventing a second mark. **No band, no caption, no
  box** — the standing rule about what may go on a page.
- **THE RECORD SAYS "Front matter"; THE SCREENS SAY the reader's own words.**
  `clauseLabel` builds the stored `clauseLabel` from the region's `title`, and a
  stamped string keeps English like every other record here. The panel's name and
  the queue row print `ng_front_matter` instead.
- **AND IT READS FIRST IN THE ROUND QUEUE.** The region is the top of the
  document, and it is not in `negoClauseList`, so its place in the reading order
  is STATED (`order.set(front, -1)`) rather than looked up — left to the
  fallback it would sort LAST, which is the one thing that queue's own note says
  it must never do.
- **THE ROOM IS DELIBERATELY UNCHANGED.** `negoDocHtml` has never drawn the front
  matter — it prints a label head of its own — and still does not. No reading
  differs: the page that has always drawn the document's own words is the page
  that draws their redline.
- **THE SIGNATURE BLOCK IS NOT IN THE REGION, and that is said out loud.**
  `rlPaperFootHtml` is DERIVED from `c.party` and `c.counterparty` — it is not
  document text at all — so editing it means editing the record, and Key terms is
  its one door. Building a second one here would be the duplication this rulebook
  opens by warning about.

Tests: f250 (26 — **all 26 fail against the parent commit**), f210 (its pencil
selector NARROWED in place: the region carries the same control in a row of its
own, so a bare class selector stopped meaning "one per clause"; the claims in
that file are about CLAUSES and the region's own pencil is f250's).

**AND THE BACKTICK FAULT WAS PAID A FOURTH TIME, in the same file that records
it.** A CSS comment in js/views/negotiation-css.js quoted a class name in
backticks; the file returns CSS from a JS template literal, so the pair ended the
string and the browser tried to parse the rules after it as code. Nine tests in
an unrelated file went red with `SyntaxError: Unexpected identifier`. Say
"the is-changed class" in prose. f236 is the net and the linter caught it in one
run.

## ONE PRESS REACHES TYPING AND THE STRIP (owner-reported 29 Aug 2026)

*"I am still clicking the pencil sign various times and I do not know for what
reason ... Just click the pencil symbol once, you can then edit manually by
typing or highlight a sentence and a strip bar appears (which was there before
but you seem to have deleted it)."*

**THE STRIP WAS NEVER DELETED — IT WAS MADE CONDITIONAL ON NOT TYPING**, and
the owner's memory was right on both counts. `page.addEventListener('mouseup')`
opened `if (ceIsTyping()) return;`, so **typing and the strip could not be live
at once**: the pencil was one switch pointing at one of two jobs and **no number
of presses reached both**. Nothing on screen said so, which is why the only
thing left to try was pressing it again.

**IT WENT IN ON 26 Aug 2026** with the change that made this page edit on the
paper, along with `ceIsTyping` itself; before that commit the strip carried no
such condition. **THE 28 Aug ARRIVAL RULE (the section below) THEN TURNED A
LATENT CONFLICT INTO A DAILY ONE** — the reader now lands on a marked clause
needing a press, and the press takes the strip away. **Both of those decisions
stand**; what was wrong was that they met.

**THE REASONING IT WAS WRITTEN ON IS NOT WRONG ABOUT WHAT A DRAG CAN MEAN** —
inside a contenteditable box it really can be somebody selecting words to
embolden. It is wrong that it can only mean that. On this page a reader who
highlights a sentence is usually reaching for Copilot, which is the one thing
the strip exists for. **So a drag means BOTH**: the browser's own selection
stands and every tool on the bar still acts on it, AND the strip opens beside
it.

**THE STRIP WAITS RATHER THAN TAKING OVER — REVERSED IN PLACE 30 Aug 2026; see
HIGHLIGHT AND TYPE, AND TWO PRESSES ARE THE CEILING.** The owner met this rule
and ruled the other way: the strip ALWAYS takes the caret now, so a highlight is
followed by typing rather than by a click into the box. **The half of the
reasoning below that was right is kept and is what pays for it** — the writing
bar goes on working, by acting on the held sentence wherever the caret is. What
follows is the record of the rule this replaced, because its reasoning is the
useful part. Two rules carried it:
- **It does not take the caret while the reader is typing.** `ceOpenInline` used
  to focus and select its box unconditionally — right while the strip only ever
  opened in the reading, where nothing else held the caret. Now that a highlight
  can be made mid-sentence, that would move the reader out of the clause every
  time they selected something.
- **Typing in the clause closes it, having done nothing.** A reader who
  highlights and then carries on writing has answered the question themselves,
  and the passage the strip was holding is the one they have just typed over.

**AND THE OTHER HALF OF THE REPORT WAS THE DOOR** (owner-reported the same day,
after the strip was fixed: *"The only fix is when i click on pencil it takes me
to the editor page but the rest is not working."*). The strip was mended and the
reader still could not reach it, because **the press never said what it meant**:
the three controls that open this page — the panel's Copilot button, the ✦ on a
tracked change and the paper's own pencil — opened it with no ask, so the 28 Aug
arrival rule below applied, the page landed **showing its marks and not
typeable**, and "click the pencil symbol once" was really click it once here and
again over there.

- **`typing: true` IS AN ASK THE PAGE ALREADY HONOURED.** Main built it for a
  click into another clause's words; a door needs it for exactly the same
  reason. Nothing new was invented and no state was added.
- **ONE READING, THREE CALLERS — `openEditor` in wireNegotiationTab.** Three call
  sites each remembering to say the same thing is how two of them come to
  disagree, and a fourth door added later would have forgotten. It is written
  once and they call it; `rlOpenClauseEditor(c, …)` is now reached from exactly
  ONE place in that file, which f245 (1) and f245 (19) both pin.
- **IT NARROWS THE 28 Aug ARRIVAL RULE AND DOES NOT REPEAL IT** — see the
  section below, whose claim is reversed in place there. That rule still governs
  every move INSIDE the page, because **the ask is CONSUMED on arrival**: a
  later `ceGoClause` inherits nothing. What is overruled is only the case the
  owner rang, where the press itself said *edit this clause*.

**NOTHING ABOUT FILING MOVED.** The whole of this is which gestures reach which
control; the one act in the rail's foot is still what puts a change on the
record, and f245 (19) greps that no second filing path appeared.

**AND ONE THING WAS NOTICED AND DELIBERATELY NOT FIXED, said out loud.** With
typing OFF, a DRAG in the wording is read as a press in the wording:
click-to-type runs on the `click` that follows mouseup, starts typing and drops
a caret, which collapses the selection the drag just made. **It cannot reach the
reported fault** — while typing, that branch is already excluded by its own
contenteditable selector — so a guard written for it was **taken out again**
rather than shipped, because refusing the drag would have narrowed the 29 Aug
click-to-type feature for a case nobody has reported. The finding is recorded in
the source where it lives.

**THE GREEN MARGIN BAR WENT WITH THIS FIX** — see THE CLAUSE YOU ARE TYPING IN
IS STILL THE PAPER, whose "untouched" claim is reversed in place there.

Tests: f245 (19) (8 claims, **6 of them failing against the parent**), f245's
margin-bar claim REVERSED IN PLACE, f245 (1)'s two door claims REVERSED IN PLACE
(each keeps what it was really about — the press stops at the editor, and
neither door writes — and one is stronger for it: it counted two call sites and
now asserts there is one), clause-editor-verify section 21 (9 — the gesture
**driven with a real mouse**, because the fault had a second half that only a
real mousedown/mouseup/click sequence exercises: a synthetic Range fires neither
event and would have passed against the broken build) and 17g reversed in place.
**Against the parent that file reports the owner's bug verbatim** —
`21c … strip false` — and the green bar at 3px.

**AND THE DOOR IS ASSERTED WHERE THE READER STARTS**, which is the lesson this
one cost: clause-door-verify 16d2-16d5 press the pencil **on the contract** and
then drag for real, because clause-editor-verify stages the page by calling the
door directly and pressing the editor's OWN pencil — so it proved the strip
works from a state the reader never arrives in, and passed throughout. Against
the parent those checks report the fault verbatim: `typing false`, `marks 2`,
`strip false`. **A PROBE MAY NOT SCROLL THE PAPER TO FIND ITS TARGET**, and an
hour was lost to it: `.nego-scroll` — which is what `#ce-doc` is — carries
`scroll-behavior:smooth`, so `scrollIntoView` ANIMATES and a rect read on the
next line is the position the paper is LEAVING. Measured, the canvas moved 332px
between mousedown and the third mouse move, the pointer left the clause, and the
selection collapsed to nothing — which reads exactly like a product refusing to
select. Take a point already on screen, or wait for the scroll to settle before
measuring one.

## HIGHLIGHT AND TYPE, AND TWO PRESSES ARE THE CEILING (owner-approved render, 30 Aug 2026)

*"Once I make an edit, I have to click multiple times in order for the redlines
to be filed... I also want to simply highlight a sentence and the open strip
where I can make my change highlighted the highlighted word inside the strip and
not have to click inside the strip to start typing... press send and it is filed
immediately."*

**TWO OF THE PRESSES THE OWNER WAS MAKING WERE BEING THROWN AWAY BY THE PAGE,
and that half was a DEFECT rather than a design.** REPRODUCED with a real mouse
before anything was touched: type in the clause, press **File as a change**
once, and nothing happens; press it again and it files. Same for the pencil —
press one did not toggle, press two did.

**THE CAUSE IS ONE LINE AND IT COST FOUR REGIONS.** A press is a mousedown and a
mouseup, and the browser only calls it a click if both land on the same element.
The mousedown moves focus out of the typing box, which fires blur, which pulls
the text — and the pull rebuilt **the readings row, the paper, the rail foot and
the writing bar**, replacing whatever the reader's finger was on. So the mouseup
landed on an element that had never been pressed. Nothing failed and nothing
logged; from the reader's chair it is a dead button. The owner met two of the
four and reported those.

- **WHILE THE CARET IS IN THE BOX, NOTHING IS REBUILT.** `keepView` already
  meant exactly that state — `cePullText` is its only caller and returns early
  unless the reader is typing — so it now also means "paint, do not rebuild".
  The box already shows the words, the bar's greying asks a question whose
  answer has not moved, and the readings and the zoom are untouched. What
  genuinely moves is the running `+N −N` and the foot, and both are painted in
  place. **`ceStatHtml` is the one builder** for that count, read by the
  readings row and by the painter, because two places printing what the draft
  has done is how they come to disagree.
- **THE RAIL FOOT IS PATCHED, NEVER REWRITTEN** — the settings page's own rule,
  applied to the one row on this page that is pressed while the caret is still
  in the text. Its two buttons live for the life of the page and only their
  state moves; the label is written as `textContent`, which is also what keeps
  the element identity the fix rests on.
- **THE PAPER IS STILL REBUILT WHERE IT IS OWED**, which is when the sanitiser
  had to correct the box — there the screen is showing something the record will
  not keep. MEASURED: a freshly rendered box is already clean and stays clean
  through ordinary typing including pressing Enter, so that signal is rare, and
  it goes true on exactly the paste that needs correcting.

**THE STRIP TAKES THE CARET. THIS REVERSES THE 29 Aug RULE**, which withheld it
while the reader was typing so that selecting words to embolden would not throw
them out of the clause. MEASURED with a real drag before it was touched: the box
carried the words, the caret stayed in the clause, and typing straight away went
into the CONTRACT and over the very sentence just highlighted — so the gesture
lost the sentence and the strip in one keystroke. **The old reasoning was right
about the cost, and the cost is paid elsewhere: the writing bar now acts on the
held sentence.**

**THE HELD MARK IS A MARK ON THE CONTRACT AND THE OWNER RULED ON IT AS ONE.** A
document has ONE selection, so the moment the caret moves into the strip the
browser stops painting the highlight — the sentence being replaced would go
invisible at the exact moment its replacement is typed. `.ce-held` is a teal
wash with an inset 2px underline, mixed against `--accent-solid` so it is the
same colour as the strip's own edge and needs no answer of its own at night, and
drawn as a background and an INSET shadow so it occupies no space and no word
moves when it appears.

**IT CAN NEVER REACH THE RECORD, GUARANTEED THREE TIMES RATHER THAN REMEMBERED
ONCE**: the pull reads a CLONE of the box with the mark unwrapped (`ceBoxHtml`,
which `ceBoxDirty` asks too); `sanitizeRich` unwraps any span whose class is not
on its own allow-list, and this class deliberately is not on it; and the strip
closing clears it outright. **The first two are structural** — neither depends on
anybody remembering to call anything — and f245 asserts all three, including
that the class is absent from `richSpanClassOk`'s list, so the day somebody adds
it there the test makes them re-read this.

**IT IS A WRAPPER RATHER THAN AN OVERLAY** because a wrapper follows the words
through a scroll, a re-wrap, a zoom and the reader's own text-size setting, where
an overlay would have to be told about each.

**THE BAR ACTS ON THE SENTENCE YOU HIGHLIGHTED, WHEREVER THE CARET IS.** One rule
rather than two, and NOT "the bar acts on the strip when the caret is in the
strip", which cannot work: the strip is a plain box whose value goes to the
record as WORDING, so bold inside it has nowhere to live. The mark is what makes
it possible — a real element wrapping exactly the passage, so the range is read
off it rather than searched for. **The paper is rebuilt by almost every press of
that bar and that is right** (the browser writes `<b>` where the record keeps
`<strong>`, and an indent writes a style the record will not keep at all), so
the reader is put back afterwards: the same passage held, their own typing
intact, the caret in the box. Where the passage genuinely cannot be found again
the strip CLOSES rather than standing open over wording it cannot place.

**AND A PRESS ON A CONTROL IS NOT THE END OF A DRAG.** The page's mouseup
handler excluded only the strip; the bar restores the strip after its own press
and this handler then ran a frame later, found no selection in the wording and
tore down what had just been put back. It excludes CONTROLS now rather than
everything outside the clause, so a drag that ends past the wording's edge still
opens the strip.

**SEND FILES, AND FILING NEVER CLOSES THE PAGE.** Both are owner rulings and they
go together. `ceInlineApply` files after replacing, and the **✕** beside it files
the same way — a strip whose two buttons disagreed about reaching the record
would be the worse answer. **IT IS NOT A SECOND FILING PATH**: the wording goes
through `ceReplacePassage` and then `ceFile`, the same one act the foot presses,
so the desk rule, the review gate and the executed-wording freeze all apply
without being repeated. **ONLY WHERE SOMETHING MOVED** — a filing on wording the
passage already says would be a revision proposing nothing.

**THIS REVERSES "BACK WHERE YOU STARTED".** Closing the editor and returning was
right while filing was a once-per-visit act at the end of a clause; with the
strip filing it meant being thrown out and going back in twice to change three
sentences. **ONE RULE, BOTH DOORS**: filing files, leaving is its own button.
After a filing the record has moved, so the page is re-read from it —
**`ceSeedDraft` is that reading and has TWO callers**, the door and the filing,
because a second copy of it is how they would disagree about which baseline the
marks are drawn against. The POSTURE is untouched: typing stays on, the rail
stays where it was, and the reader's place is the one thing they were holding.

- **A STRIP FILING KEEPS THE READER TYPING** (`keepView` on the replacement),
  or the second sentence costs a second press of the pencil and the ceiling
  breaks. The rule it narrows is untouched for what it was written about:
  wording that arrives from a Copilot card or a playbook standard still drops
  out of typing so the marks it made are the first thing seen.
- **THE FILE BUTTON GREYS ONCE THE RECORD HAS CAUGHT UP.** With the page staying
  open a just-filed draft still differs from what STANDS, so File asks
  `clauseEditorDirty` instead — is there anything the record does not already
  hold — or it would sit live over a press the funnel refuses. **Discard keeps
  its own question**, which is whether the wording has moved from what stands,
  because that is what it puts back.

**MEASURED END TO END with a real mouse and keyboard: pencil, highlight, type,
Enter → filed, page still open, still typing. Then highlight, type, Enter →
filed again as a revision. The first change costs two presses and every one
after it costs one.**

**AND THE TWO DOORS ONTO THE CLAUSE PANEL ARE SHUT ON OUR SEAT** (*"shut the two
doors that put it in front of me"*). The pencil has opened the edit page since
29 Aug; the card's **Edit** still jumped to the clause and opened the PANEL on
it, and the ⋯ carried an **Open clause panel** row besides — so one clause had
three doors going to two places.

- **`ceTakesIt` IS THE READING AND IT IS THE PENCIL'S OWN**, asked once for the
  whole column: our seat, not a preview, the module present BY NAME, and a
  window wide enough. Decided at draw time rather than by falling through a
  refusal, which is what stops a door claiming a page nothing can open.
- **THE MENU NEVER REPEATS THE FACE.** Edit now carries the editor door, so the
  ⋯'s Copilot row stands down on any card whose face has it — the menu's own
  rule — and survives on the cards whose face is bare.
- **THE PANEL ITSELF IS NOT RETIRED AND THAT IS A CAPABILITY.** The counterparty
  refuses `rlOpenClauseEditor` outright, so the panel is the ONLY way their page
  proposes wording; the same is true below 1024px and on a stage that does not
  load the module. All three are the one question `ceTakesIt` asks.
- **THE ONE THING THE PANEL HELD THAT NOTHING ELSE DID MOVED FIRST**: the way
  back from a decision already **accepted**. `negoResolve` refuses a second
  acceptance on a clause whose rival is adopted and names reopening as the way
  out, and a refusal whose stated remedy cannot be reached is worse than no
  remedy — f208's whole lesson. It is on the accepted change's own card now,
  which was only possible because the piles of 26 Aug gave a settled change a
  card to carry it. **A refused ask of OUR OWN deliberately did not move**:
  Withdraw is the verb for that and is already on the card.

**AND THE PENCIL'S TOOLTIP NAMED THE WRONG PLACE.** It read "Open this clause —
what it says now, what is on the table, and everything that has been asked about
it", which describes the PANEL, while the pencil has opened the edit page since
29 Aug. `ng_cp_edit_title`, both languages; `ng_cp_open_title` is still live and
still right on the controls that really do open the panel. **A control that names
somewhere it does not go is the same fault as one that goes nowhere, just
quieter.**

Tests: f245 (the two claims of 28 and 29 Aug REVERSED IN PLACE and made stronger
— the strip always takes the caret, and the bar's half is asserted beside it so
neither can ship alone — plus f245 (20), the held mark's three nets), f246 (the
menu's lead-row claim reversed onto "drawn exactly once, never twice", with the
no-editor stage read as its own world), f100 (eleven panel claims RE-POINTED,
never deleted, at the stage where the panel is still the door, and the sent-ask
claim written as the question it always was — *a sent ask still has a way into
its own wording* — rather than as one answer), clause-editor-verify and
clause-door-verify.

## THE PAGE NEVER OPENS IN A STATE THAT HIDES MARKS THAT EXIST (owner-reported 28 Aug 2026)

*"ensure when you are in the redlines tab you are able to see the redlines
because that is the whole purpose of having that tab"* — off a screenshot of
work mode on **Redlined**, with a clause carrying CHG-001 and **not one mark on
it**, while the rail beside it drew that change's marks perfectly.

**NARROWED IN PLACE 29 Aug 2026, and the narrowing is exactly one case:** a
press that SAID *edit this clause* — the paper's pencil, the ✦ on a change, the
panel's Copilot button — now arrives typeable whatever marks the clause carries,
because the owner asked for it in those words ("click the pencil symbol once …
the redlines disappear to clean view"). See ONE PRESS REACHES TYPING AND THE
STRIP above. **AND ON 1 Sep 2026 THAT NARROWING AND THIS RULE CAME BACK INTO
AGREEMENT**: click-to-type is retired, so the only presses that say *edit this
clause* are pencils — see THE PENCIL IS THE ONLY WAY IN.
**Everything below still governs every move INSIDE the page**,
which is what consuming the ask on arrival buys: a reader who lands on Redlined
without asking to edit still sees the marks that exist, which is the whole of
what was reported here.

**THIS REVERSES "THE CLAUSE YOU CAME IN ON OPENS TYPEABLE", and both decisions
survive on the one question that separates them.** That rule was an owner
decision with a good reason — this page is pressed to change wording, and
arriving on a read-only contract and having to find the pencil first is a step
nobody asked for. What it cost is that **a typeable box shows the DRAFT**: you
cannot type into a redline, so on a clause that already carried a filed change
the reader landed on Redlined and the one clause they were looking at was the
one clause with no marks.

- **THE QUESTION IS "IS THERE ANYTHING TO HIDE?"** `_ceEditing = _ceText ===
  _ceBase && _ceHead === _ceHeadBase`. A clause with nothing on it opens
  typeable — nothing is being kept from anybody and the pencil press is the step
  nobody asked for. A clause whose draft differs from what stands opens SHOWING
  ITS MARKS, and the pencil, on that clause, is one press away.
- **THE HEADING IS IN THE READING**, because a pending rename is a mark too.
- **WHAT IT COST IN TESTS IS THE USEFUL PART.** clause-editor-verify pressed the
  pencil BLIND at four points, on the assumption that the page always opens
  typeable — so the moment the default moved, a blind press landed each staging
  in whichever posture it had not asked for and 23 checks went red in sections
  that had nothing to do with the change. `setTyping(want)` presses it ONLY when
  needed, so each staging now says what it WANTS rather than what it happens to
  get. **A test that stages a posture by toggling is a test that breaks when the
  default moves.**
- **AND THE CLAIM IS MEASURED AS PAINT, ON A FRESH OPEN**: 20i counts the `ins`
  and `del` runs in the clause the page opened on, because a class check would
  pass on a page that opened typeable and drew the draft clean — which is exactly
  the reported state. It reports `ins 0 · del 0` against the code of an hour
  before.

Tests: f245 (18) (5 — 3 failing against the parent), clause-editor-verify 19a
REVERSED IN PLACE with 19a2 keeping what it was really about (the writing is one
press away, not two), 20e/20f reversed onto the tab's absence, and 20i-20l new
(6 of the file's checks fail against the parent, the headline one reporting the
owner's screenshot).

## THE PENCIL OPENS THE EDITOR, AND TWO CASES KEEP THE PANEL (owner-ruled 29 Aug 2026)

*"Keep the negotiation page as is today but when I click the edit symbol, it
takes me to the edit with copilot page to begin my edit there."* The pencil
opened the clause panel, which then offered two writing buttons; those are the
pencil's own job now. **Two presses became one and nothing about the negotiation
page's layout, cards or columns moved.**

- **THE DESTINATION IS CHOSEN AT DRAW TIME, NOT BY FALLING THROUGH A REFUSAL**,
  and that is what keeps it from being a dead press: where the editor cannot
  take the clause the pencil never claims it will. `rlClauseEditPillHtml` takes
  `toEditor`; `redlineDocHtml` decides it ONCE for the whole canvas, so the four
  clause branches cannot disagree.
- **THE PANEL IS NOT RETIRED, AND THAT IS A CAPABILITY RATHER THAN A TASTE.**
  **THEIR SEAT** — `clauseEditorRefusal` answers `ce_owner_only` for a
  counterparty, and the panel is the ONLY way their page proposes wording;
  sending their pencil to a page that turns them away would take that away
  entirely. **AND A WINDOW UNDER 1024px**, which `clauseEditorFits` refuses
  because two columns need room to be two columns; the panel works at every
  width. So on our seat, at a usable width, the panel never opens — which is
  what the ruling asked for — and it is still there for the two cases that need
  it. **Said out loud rather than reported as "retired".**
- **A DOOR ONTO A FULL-WINDOW PAGE IS NEVER "OPEN"**: the editor covers this
  page, so `aria-expanded` on it would claim a state nobody can observe. The
  panel's own pencil still reports its own.
- **THE FRONT MATTER GOES TO THE EDITOR TOO** — `negoClauseNowById` resolves
  `'front'` and the editor does not refuse it, so the region carries the same
  door every clause does. The re-segmentation refusal that guards a front-matter
  edit lives in `negoEditClause`, which is the funnel the editor files through,
  so it applies unchanged.

**AND THE DOOR HAD NO READER FOR A DAY (owner-reported 29 Aug 2026: *"we
agreed that the panel on the right would go away and when i click on the pencil
i would go straight to edit with copilot page and that is not working"*).** It
was a DEAD PRESS: the pencil started carrying `data-rl-cp-editor` when the
editor became its destination, and **nothing on the paper listened for that
attribute** — the only handler that reads it is bound to `[data-nego-ai-clause]`
elements, which is the PANEL's Copilot button and not this. So the press fell
through every branch and did nothing at all: no page, no panel, no refusal, no
page error.

- **THE FAMILY IS THIS CODEBASE'S OWN MOST REPEATED DEFECT**, in a third
  costume. `rlPaperFootHtml` was a name nothing PUBLISHED; `keepScroll` was a
  published name nothing REACHED FOR; this is an attribute nothing LISTENS FOR.
  All three fail in silence with a plausible-looking fallback, and neither f232's
  window sweep nor any source claim can see this one — every assertion about the
  attribute passed throughout.
- **IT IS WIRED BESIDE THE ROW'S OWN DOOR**, per paint in `wireNegotiationTab`,
  because `rlOpenClauseEditor` needs the contract, the seat and the repaint —
  none of which the module-load listener that owns `data-rl-cp-open` can see.
  **The panel's Copilot button is excluded BY SELECTOR**
  (`:not([data-nego-ai-clause])`), not by luck: it carries both attributes and is
  already wired, and two handlers on one press would open the page, tear it down
  and open it again.
- **AND `editorTakesIt` NOW ASKS FOR THE MODULE BY NAME.** It asked only whether
  the WIDTH suited the editor, and that check falls through as true on a stage
  that does not load `js/views/clauseeditor.js` at all — a pencil claiming a page
  nothing can open, which is the dead press the draw-time decision exists to
  prevent. Its own note already said the answer should be the panel there; the
  code said the opposite.
- **NO FILE PRESSED IT, WHICH IS WHY IT SHIPPED.** clause-door-verify re-staged
  itself away from pressing the pill in the same change that gave it somewhere
  new to go (see its own note at `openPanel`), so the one file that used to
  press this control stopped pressing it exactly when the destination moved.
  **The destination is asserted by DRIVING it now** — a pill that opens nothing
  looks identical in the markup to one that opens a page. Tests:
  clause-door-verify 16a-16d (**16b and 16c fail against the parent, reporting
  `page:false, panel:false`**).

## THE PENCIL IS THE ONLY WAY IN (owner-ruled 1 Sep 2026)

*"I am reversing this ... and essentially saying only after clicking on the
pencil can you have the ability to edit."*

**THIS REVERSES CLICK IN THE WORDS AND TYPE (owner-asked 29 Aug 2026), whose
reasoning is kept below because it is the useful part.** A press anywhere in the
wording turned typing on, so that a contract would behave like any document.
**WHAT IT COST is that the same press ALSO took that clause's redlines off the
screen** — you cannot type into a redline — so the gesture that felt like
putting a cursor down was quietly the gesture that hid the marks, on a clause
the reader had only pointed at.

**THE RULE HAS ONE SHAPE NOW.** The pencil is the only thing that clears a
clause's marks and lets it be typed in.

- **A PRESS IN THE WORDING DOES NOTHING AT ALL — not even move the page**, and
  the owner ruled on that half by name. A click that silently re-points this
  page at another clause changes what the crumb says, what File would file and
  what Copilot is answering about, with nothing on screen inviting it.
- **THE PENCIL ON ANOTHER CLAUSE IS ONE PRESS: it goes there AND starts
  editing.** A pencil means "edit this" wherever it is, so making it mean merely
  "go there" on a clause you are not standing on would be two rules for one
  button — and with the press in the wording retired it would also cost two
  presses for what one press does on the clause you are already on.
- **THE CLAUSE LIST at the top still moves you WITHOUT editing** — the reading
  door, unchanged.
- **ONCE TYPING IS ON, a press inside the box places the caret.** That is the
  browser's own behaviour on a text box rather than a way in, and nothing here
  touches it.
- **`ceStartTyping` WENT WITH THE BRANCH** — one definition, one caller, never
  published, so there is no door a third caller could bring it back through. So
  did `ceFocusTyping`'s `point` argument and the caret-from-a-point machinery
  behind it: written for that gesture, dead without it.
- **AND THE 28 Aug RULE GOES BACK TO FULL STRENGTH.** *The page never opens in
  a state that hides marks that exist* was narrowed on 29 Aug by "an explicit
  ask to type"; the only presses that now say that are pencils, so the narrowing
  and the rule agree.
- **MOVING TO ANOTHER CLAUSE STILL ASKS BEFORE IT THROWS A DRAFT AWAY**, and it
  is the product's own guard rather than a second one: `clauseEditorDirty` is
  what `viewLayersClosed` asks, and the words are that dialog's own. TWO doors
  onto that act now rather than three.

**WHAT THE 29 Aug VERSION SAID, kept because a future reader will otherwise
trip over it:** the pencil was not retired and the press in the words was not a
second act — both ends ran the two lines that handler already had, and
`ceStartTyping` named the first of them once so they could not drift. That was
true and well built. What it could not do was stay out of the way of the marks.

Tests: f245 (three claims REVERSED IN PLACE — the branch is gone, its helper is
gone, and the two doors that survive are pinned), clause-door-verify 16e-16h
(**driven with a real mouse**, which is the only thing that can tell "the branch
is gone" from "the branch is there and refused"; 16h drives the one-press pencil
so the reversal cannot read as a lost capability).

## THE CLAUSE YOU ASKED FOR STAYS WHERE IT IS (owner-reported 1 Sep 2026)

*"when I click on the pencil the clause being edited should stay where it is as
opposed to being pushed all the way to the top of the page ... I should always
make the decision to scroll and not be moved without my choosing to do so."*

**MEASURED, AND IT IS ONE LINE.** Moving between clauses CLOSES AND REOPENS the
clause editor, and arrival ends by placing the clause 24px below the top of the
pane. That placement is right for a page that did not exist a frame ago — there
is no position of the reader's to keep — and wrong every time it runs on a move
INSIDE the page, where there very much is one.

- **THE ANCHOR IS THE TARGET CLAUSE'S OWN TOP, not the scroller's number**, and
  that is not a refinement: the clause being LEFT stops being typed in, so its
  marks come back and it grows; the clause being ENTERED starts being typed in,
  so its marks go and it shrinks. Everything below the first one therefore moves
  and a remembered offset would land the reader somewhere else. Re-measuring the
  target after the render is the only reading that survives both.
- **AND ONLY WHERE IT IS ON SCREEN TO BEGIN WITH.** A jump from the clause list
  to something twenty clauses away has no place to keep — the reader is asking
  to be taken somewhere — so `ceClauseTopNow` answers **null** there and the
  arrival placement stands. Null is the honest answer rather than a number:
  pretending a place exists would scroll the reader somewhere they had never
  been.
- **CONSUMED ON ARRIVAL, NEVER STORED**, beside the typing ask it copies: read
  once into a local and cleared, so an open that returns early cannot leave it
  standing for the next arrival to obey.
- **AND EVERY OTHER MOVE OF THE PAPER IS UNTOUCHED.** `ceRestoreScroll` is still
  the one thing on that page that moves the contract, so there is a single
  answer to *does it animate*; the same-clause pencil press already kept the
  offset and still does; and the stylesheet's smooth rule is what makes the
  reader's own scrolling behave.

Tests: f245 (a new claim beside the 31 Aug landing rule, pinning the anchor, the
null, and the consumption), clause-editor-verify 24d/24e (**the clause's own top
measured before and after a real move — it reports the owner's report verbatim
against the parent source, `clause top 193px → 24px`** — with 24e proving it was
not at the top to begin with, so "it stayed" is a claim rather than an accident).

## THE LEAVE WARNING NAMES ITS CLAUSE (owner-reported 1 Sep 2026)

*"The attached alert does not give you an indication of which clause or which
wordings are in question and I therefore cannot track back to where i left
off."*

**IT NAMED NEITHER.** "Leave this clause?" over *the wording you have written
here has not been filed* is true of every clause in the contract — and it is
raised from a full-window page that carries no header, so at the moment the
reader most needs to know where they are, nothing on screen said.

- **ONE READING, AND EVERY RAISER ASKS FOR IT.** `clauseEditorLeaveAsk` is where
  the sentence is built, because that is where the clause and the draft are. The
  clause editor raises this guard on all three of its own doors (see EVERY DOOR
  OUT OF A DRAFT ASKS below, which REVERSES "two raisers" in place); the SHELL
  raises the same guard when you leave the page altogether (`viewLayersClosed`).
  A sentence written out at each would be two answers to one question, so the
  shell asks for it through `window` — the ES-module rule — and it is PUBLISHED,
  because an unexported name read that way is silence.
- **THE FALLBACK IS ALWAYS THE OLD SENTENCE, never nothing.** A guard that says
  less because a lookup failed is worse than the guard that prompted the report.
- **THE CLAUSE IS NAMED BY `clauseLabel`** — the product's own answer to *which
  clause is this*, which the change cards and the Chat rows already print, and
  which falls back to a snippet of the clause's own wording where there is no
  number and no heading. So it always says something.
- **AND THE QUOTE IS THE DRAFT, through `richToText`** — the one text projection
  this codebase has — **bounded by a NAMED ceiling** (`CE_LEAVE_SNIP`), because a
  confirm dialog is one paragraph and a clause is not. It is there to be
  RECOGNISED rather than read: what the reader needs is to know which piece of
  work they are about to lose.
- **ONE PARAGRAPH, said out loud.** `confirmDialog` draws its message in a `<p>`
  and escapes it, so the sentence is built as one flowing line rather than three
  — changing that builder for one caller would reach every dialog in the
  product.
- **THE CLAUSE'S NAME KEEPS ENGLISH inside the label**, because `clauseLabel` is
  the product's stamped naming and is already printed on screen elsewhere; the
  sentences round it turn over. Said out loud rather than discovered.

Tests: f245 (the one reading, both raisers, the publish, the bound as a named
ceiling, and both sentences in both languages).

## EVERY DOOR OUT OF A DRAFT ASKS (owner-asked 3 Sep 2026)

*"Close them"* — the two doors that did not. Asked to confirm the redlining
workflow, the owner had it right except for one step; checking the code to
answer turned up the gap, and they ruled on it.

**EVERY WAY OUT OF THE CLAUSE EDITOR WARNED BEFORE THROWING AWAY UNFILED
WORDING EXCEPT TWO** — the **Leave work mode** button and **Escape** — which
called `rlCloseClauseEditor` directly. So one draft had doors answering
differently, which is the drift this file opens by warning about, and the two
that stayed silent are the two a reader reaches for when they mean to stop.

- **`ceLeaveGuard(go)` IS THE ASK, LIFTED RATHER THAN COPIED.** The dirty
  reading, the words and the two buttons were written out inside `ceGoClause`;
  a third and fourth copy is how they come to disagree about what an unfiled
  draft costs. It is said once and the doors hand it what to do next — so the
  claim is now made OF the guard, and a fourth door inherits it rather than
  having to remember it. f245 pins that there are exactly three callers.
- **AND IT SITS AT THE DOORS, NEVER INSIDE `rlCloseClauseEditor`.** That
  function is also reached by `ceGoClause`'s own `go` and by the shell's
  `viewLayersClosed`, and **both have already asked** by the time they call it —
  a guard written inside the close would ask twice on exactly the two paths that
  were already right. f245 asserts that as a WALL: it passes before and after,
  and its job is to fail the day somebody moves the guard one level down to
  "cover every caller".
- **IT READS THE BOX BEFORE ASKING WHETHER THERE IS ANYTHING IN IT, and without
  that the closed door opens again in silence.** `_ceText` only follows the box
  on BLUR. Pressing a BUTTON blurs it on the way and would have got away with
  it; **Escape blurs nothing at all**, so the guard would have asked about a
  draft it could not see — on exactly the gesture it was closed for. The pencil
  on ANOTHER clause reaches `ceGoClause` without pulling either, so this closes
  a third door of the same kind. **ONE PULL, IN THE GUARD**, which is what every
  other door on this page already does before it acts (the pencil, the foot's
  File, the writing bar), and free where nothing is typeable.
- **THE PULL MAY NOT MOVE INTO `clauseEditorDirty`**, tempting as it looks: that
  is a READING, `cePullText` pushes a step and repaints, and READING MUST NOT
  WRITE. The pull belongs at the doors.
- **ESCAPE NOW DEFERS TO THE LAYER ABOVE THIS PAGE, and it had to go in with the
  guard or the guard would fight itself.** `openModal` draws INTO `#modal-root`;
  `confirmDialog`, `promptDialog` and the note window each append an overlay of
  their own and mark it `data-top-overlay` — the product's ONE reading of *a
  layer above me owns this key*, and what `openModal`'s own Escape asks. This
  listener is armed at module load and a confirm's when it opens, so **this one
  runs first**: Escape over the leave dialog would have raised a second leave
  dialog on top of the one being answered. The note dialog defers to a confirm
  it raises for exactly this reason.
- **NOT DIRTY, NO QUESTION** — a reader who has typed nothing, or who has filed
  what they typed, is asked nothing at all, which is every ordinary close. The
  browser file drives that CONTROL first, or "it asks" is satisfied by a page
  that always nags.

**AND IT COST THE BROWSER FILE A HELPER, which is the lesson worth carrying.**
Seven places in `clause-editor-verify` press a door with a draft in the box, and
a confirm left standing **covers the page and blocks every mouse press after
it** — five checks in unrelated sections went red, none of them near the change.
`answerLeave(p)` is `skipNote`'s own shape for the same reason: where the
journey is not about the guard, answer it and move on. **19j is REVERSED IN
PLACE and is stronger for it** — the way out is now driven THROUGH the guard.

Tests: f245 (four claims — one REVERSED IN PLACE, three new, and **three of the
four fail against the parent**), clause-editor-verify section 27 (8, browser —
**5 fail against the parent, the headline one reporting the page gone and no
dialog after Escape**; it has to be DRIVEN, because a source check sees the
pull and cannot see whether the dialog comes up, and the deferral is a race
between two document listeners that only a real key press resolves).

## ONE FRAME ROUND THE CLAUSE, NOT ONE PER BOX (owner-reported 1 Sep 2026)

Off a screenshot with the clause heading and the clause body each ringed:
*"when you click on a pencil you can an outline for the clause header and an
outline for the clause. I want the outline to be one outline that encompasses
both."*

The name and the wording are two editable boxes, so each drew the 26 Aug dashed
frame and the clause read as two fields stacked rather than as the one region
you are working in.

- **THE FRAME IS ON THE CLAUSE** — the one element that already contains both —
  and the boxes draw none. Everything about the LINE is unchanged: hairline,
  dashed, an outline rather than a border so nothing moves when it appears, and
  the colour mixed off the document's own ink so one declaration is right in
  both themes.
- **THE has() SELECTOR IS THE READING AND IT IS EXACT.** `.rl-clause-live` marks
  the clause the page is about whether or not typing is on, so a frame keyed to
  it alone would draw on a clause showing its marks; `.ce-typing` exists only
  while the clause is typeable. *The live clause that CONTAINS an editable box*
  is the state, said once, with nothing new stamped on the markup to keep in
  step.
- **THE PENCIL IS INSIDE IT, unavoidably and on purpose**: the name shares a row
  with the pencil, so ANY single rectangle round the name and the wording
  contains it. It is the control that closes the region, which is a fair thing
  to find inside the region's own frame.

Tests: f245 (three claims RE-POINTED at the rule that draws it now, plus a new
one that neither box draws a frame; the offset is pinned as a POSITIVE number
rather than as its value, because that number is a look and has moved once
already), clause-editor-verify 17d2/17d3 (**measured as paint** — the two boxes
proved to draw nothing, and the frame proved by GEOMETRY to contain both).

## THE OTHER SIDE MAY NOT RENAME OUR CLAUSES (owner-ruled 29 Aug 2026)

The rename shipped on 28 Aug with **no rule about seats**, and their page mounts
the same panel ours does — so they could propose a new name for a clause of
ours. A clause's name is how the agreement is CITED ("subject to Clause 9") and
the numbering and cross-references are ours to keep coherent.

- **AT THE FUNNEL**, for the reason the two guards around it already give:
  `negoFileChange` is what the Copilot shortcut, both playbook entrances, the
  Word round-trip and an inbound link all reach without passing any screen.
- **`modify` ALONE.** Naming a clause THEY are proposing is not renaming one of
  ours; an `insertClause` carries the heading of a clause that does not exist
  yet, and refusing that would leave them able to propose a new clause and
  unable to call it anything.
- **IT DROPS THE RENAME AND KEEPS THE EDIT**, rather than refusing the filing:
  the wording they typed is a legitimate ask, and throwing it away over a field
  they cannot even be shown would cost them work they meant to do. **A
  rename-only attempt then proposes nothing, and the no-op guard refuses it in
  the product's own words** — so the rule needed no refusal of its own.
- **THE NAME BOX STANDS DOWN ON THEIR SEAT TOO** (`mayName`), because a control
  whose only outcome is a refusal is furniture. That is the SIGN; the funnel is
  the WALL. **Their right to propose new WORDING is untouched, a rename WE
  propose still reaches them, and they still accept or refuse it.**

## THE WRITING BAR, AND SAVE IN ONE PRESS (owner-asked 28 Aug 2026)

Ten messages, one settled design, three builds. The owner's own words:
*"most of the best in class CLM companies have a contract on screen that is
like a Google Docs or word document with regards to the features on top of the
bar … my platform lacks that completely"*, and then *"build it but make sure
you do not forget the copilot panel goes all the way to the top."*

**ONE SHELF, TWO SETTINGS, AND IT LIVES BESIDE THE ALLOWLIST.** `richBarHtml`
is in **js/richdoc.js**, next to the sanitiser that decides what a stored body
may carry — because a tool that writes a mark and a rule that permits one are
the same fact, and a bar in a view file would be a second opinion about it.
`RICH_BAR_TOOLS` is ONE list where `full:1` marks the tools the compact shelf
omits, so the clause panel's inline editor and work mode's bar cannot come to
disagree about what a button does. `richBarPress` is the press,
`richMarkSelection` the mark, `richUnmark` the removal, `richSizeAt` the
reading of what size the caret is in.

**THE COLOUR DOOR IS OPEN AND IT IS NARROW.** The sanitiser refuses `style` on
everything and always will; what it now permits on a SPAN is a fixed list of
CLASS names and nothing else — five inks, four highlights, ten sizes
(`RICH_MARK_CLASSES`, `richSpanClassOk`, asked by `_stripAttrs` AND by
`_normaliseStructure`'s span unwrap, which is one reading with two callers).
**GREEN AND RED ARE NOT ON THE LIST**: they are the redline's own grammar —
an insertion is green and a deletion is struck in ruby — and a reader who
could colour a sentence green would be writing something the page already
means. **THE MARKS FOLLOW THE PAPER**: every rule is `var(--mk-token,
#literal)` so a standalone document still colours, and every token has a dark
answer.

**WHERE THE BAR SITS IS THE LOAD-BEARING PART.** Inside `.ce-head`, which is
inside the LEFT column. A full-width row above `.ce-grid` pushes the Copilot
rail down by its own height — the one thing about that layout that has been
corrected repeatedly, and the comment at the top of the builder says so.
clause-editor-verify 17l3 pins the bar's HOME and 2d2 measures the rail itself.

**ONE CLAIM REVERSED IN PLACE, and the two bands are not the same kind of
thing.** 17l2 asserted that the readings row was the ONLY band between the head
and the paper. What it was written about was a NOTICE — "On this clause", the
change's name, a sentence saying nothing had been proposed — three facts the
crumb and the fact row twelve pixels above already carried. That one is still
gone (17j/17k pin its absence in their own right). **A band that carries an act
is what the standing rule keeps; a band that restates the screen is what it
removes.**

**SAVE IS ONE PRESS.** Owner-asked: *"we need to remove the mandate for adding
why this change for every change. Users can use the notes feature to add notes
on changes."* Both filing paths changed together — the engine's inline editor
and the clause editor page quoted each other button for button so one page
could not refuse what another permitted, and they still agree.

- **WHAT STOOD, because the reasoning is the useful part**: Save led INTO the
  question, on the argument that a reason offered as one more optional field is
  a field people scroll past. Skip was always a visible button, so the ANSWER
  was never mandatory; it was the QUESTION that was unavoidable, and a pass over
  six clauses cost six extra presses.
- **WHAT IS LOST, SAID OUT LOUD.** `why` TRAVELS — its own label said "the
  other side sees it beside the redline" — and a note does not: the composer
  defaults to Internal on our seat and an internal note never leaves the
  building. The sentence that explained a redline to the counterparty at the
  moment it was made now has to be typed on purpose, in the clause panel's note
  box with the switch thrown to "Send to them".
- **THE COPILOT PROPOSAL CARD KEEPS ITS OWN OPTIONAL REASON**, which blocks
  nothing and was never the mandate — it is the one surface that still WRITES a
  `why`, which is what keeps the field from being orphaned. The field on the
  record, the fingerprint (which never carried `why`), every renderer that
  prints one and `negoWireWhyClamp` are untouched. The REJECTION dialog's own
  reason is a different question by a different person and was not in the ask.
- **STALE, left inert in BOTH dictionaries**: `ng_why_this_change`,
  `ng_file_change`, `ng_skip_no_reason`, `ng_back_to_wording`, `ce_reason_hint`;
  and `data-nego-save` / `-skip` / `-back` / `-reason` and the three
  `data-ce-act="reason-*"`. `data-nego-next` and `data-ce-act="save"` KEPT their
  names — half a dozen checks and both browser files reach the button by them,
  and a rename would cost those and buy nothing; what changed is where they go.

**HIGHLIGHT A PASSAGE — AND IT GOES TO THE COPILOT RAIL (M-1, owner-chose
Option A off three drawn options, 31 Aug 2026).** *"Let's make it so that when I
highlight the sentence, it appears in the Copilot screen on the right and I can
then ask Copilot for what I want. This change then eliminates the pop-up strip.
To manually make a change, I just write the change in the contract as currently
designed."*

**THIS REVERSES THE STRIP IN PLACE, and the half that survives is the half that
was ever load-bearing:** ONE field for the wording, ONE replacement reading
shared by the hand and by Copilot, and nothing on this path files. What moved is
WHERE the passage goes.

- **IT ATTACHES DIRECTLY ABOVE THE ASK BOX**, between the conversation and the
  ready-made questions. That placement is the whole of why Option A was
  recommended and chosen: what is attached and what you are typing are read
  together, and a card pinned to the foot of the rail can neither scroll away
  nor be left attached with no way to release it. It draws nothing when nothing
  is attached, so the ordinary rail is unchanged.
- **THE ONE LINE THAT MAKES IT WORK**: the paper's mouseup handler answers ONLY
  for a press inside `#ce-doc`. With the box on the paper, a press elsewhere
  that made no selection meant "the reader has moved on" and detaching was
  right; with the box in the RAIL, the very next thing a reader does is click
  into the ask box — no selection — and that would have detached the passage
  they had just chosen, in one press, every time. The ways to let one go are the
  card's ✕, Escape, typing over it in the clause, and choosing another passage.
  **Nothing else takes it away.**
- **ATTACHING NEVER TAKES THE CARET.** The old rule was conditional (focus only
  when the reader was not already typing) because the box was on the paper; with
  it in the rail there is nothing to focus, so the promise holds with the
  condition gone.
- **THE CHIPS FOLLOW THE SCOPE, ONE ROW AND ONE ATTRIBUTE.** A passage gets the
  strip's own three, key for key — `ce_inline_shorten`, `ce_inline_firmer`,
  `ce_inline_plain`, already written in both languages; a clause gets the four
  this rail has always carried. Either way a chip presses `ceAsk`, which is what
  decides the scope: a second attribute for "passage chip" would be a second
  route to one act, and ONE line draws the row either way.
- **THE ASK BOX SAYS WHAT IT IS FOR** — its placeholder follows the scope, so a
  narrowed control states the narrowing by being set to it. The WHOSE ASKS rule,
  on a placeholder.
- **THE CARD KNOWS WHAT IT WAS ABOUT.** The passage is recorded ON the answer
  card rather than read off `_ceSel` when Apply is pressed, so an answer stays
  applicable after the reader lets the passage go — and a card marked against
  one sentence can never be applied as a rewrite of the whole clause. Its
  preview is marked against the PASSAGE, and Apply routes by what the card
  carries.
- **APPLY FILES NOTHING; THE CUT STILL DOES, AND THAT KEEPS THE 30 Aug RULING
  IN PLACE.** The strip's SEND filed immediately, because the owner asked for it
  in those words and had capped this page at two presses. That send is gone with
  the strip — a replacement is typed into the paper now, and the one act in the
  rail's foot files it — but the CUT has no such twin: it is a single press with
  nothing to type, and dropping the filing would make it the one act on this
  page costing two presses instead of one. **IT IS NOT A SECOND FILING PATH**,
  which was always the condition on it: `ceCutPassage` presses `ceFile`, the
  same one act the foot presses, so every guard the funnel carries applies
  without being repeated. `ceReplacePassage` reaches no filing door at all, and
  f245 asserts both halves.
- **`ceReplacePassage` IS THE ONE READING** of "put this wording in place of
  that passage", shared by the reader's hand and by a Copilot rewrite. The rest
  of the clause is carried across character for character, and a passage dragged
  across two sub-paragraphs is still refused. Its refusals speak through
  `ceSay` now — the page's own refusal line, which the writing bar, Apply and
  Discard already speak through — because they used to print inside the strip,
  and a refusal with nowhere to appear is a dead press.
- **ONE VERB HAD NO OTHER HOME AND IS NAMED RATHER THAN LOST**: the strip's ✕,
  *"suggest deleting these words"*, is the only one-press way in the product to
  strike a sentence out. It is on the passage's own card. **A DEPARTURE FROM THE
  APPROVED RENDER**, which drew it as a fourth chip: that row holds questions
  that spend money on Copilot, and an act that changes the draft on the spot is
  a different kind of thing.
- **THE PAPER KEEPS THE PASSAGE LIT, AND THAT COST NOTHING TO BUILD** — which
  is the one place this section is better than the render that proposed it. The
  drawn options named the lost highlight as Option A's price: the browser paints
  one selection, and it goes the moment the reader clicks into the ask box.
  **`ceMarkHeld` had been built the day before, for the strip**, and it simply
  outlived it — the passage keeps an accent wash on the contract for as long as
  the rail holds it. Its three nets against ever reaching the record are
  unchanged and are asserted in f245 (21): the pull reads a copy with the mark
  taken off, the sanitiser unwraps an unknown span class by construction, and
  letting the passage go clears it. The card still quotes the passage in full on
  its own title, twelve pixels from the box the question is typed into, so the
  fact is said in two places that cannot disagree — one on the paper, one in the
  rail.
- **MANUAL REPLACEMENT IS TYPING IN THE CONTRACT**, which the contenteditable
  box has done since 26 Aug and which is what the owner asked for in the same
  breath. **A workspace with no Copilot key loses nothing**: the strip's manual
  half is what typing already does.
- `.ce-inline` and its five functions are DELETED, not left unreachable.
  `ce_inline_ph`, `ce_inline_newline`, `ce_inline_cancel`, `ce_inline_replace`,
  `ce_inline_replace_title`, `ce_inline_where`, `ce_inline_suggested` and
  `ce_inline_about` are STALE — flag any mention. **`ce_inline_shorten`,
  `ce_inline_firmer` and `ce_inline_plain` are NOT**: they are the chips, and
  they kept their keys because they are the same three questions about the same
  one sentence, in both languages, whoever draws them. So are
  `ce_inline_say_what`, `ce_inline_moved`, `ce_inline_cut`, `ce_inline_cut_all`
  and `ce_inline_cut_title` — the two refusals `ceReplacePassage` speaks and the
  cut's own words.

Tests: f245 (16) and (19) REVERSED IN PLACE (**14 of that file's checks fail
against the parent**), clause-editor-verify sections 18 and 21 reversed the same
way — 18f-18i now drive the CUT, which is the one act on the card that needs no
Copilot key and answers the same four questions the section always asked — plus
18e2, which presses into the ask box and proves the passage stays attached,
clause-door-verify 16d4 re-pointed.

**THE CONTRACT STOPS JUMPING (M-2, owner-reported in the same message:**
*"whenever I make change or click in the box, the contract moves up then back
down to where I was. Remove this bug."*)

- `#ce-doc` is a `.nego-scroll`, which is `scroll-behavior:smooth` — right for
  every scroll a reader ASKS for, and exactly wrong for putting a position back
  after a repaint. `ceRenderPaper` restored the reader's place with a BARE
  ASSIGNMENT, which under that rule is a **request to animate** from wherever
  the scroller currently is.
- **THE PRODUCT'S OWN ANSWER EXISTED AND THIS PAGE NEVER CALLED IT.**
  `rlRestoreScroll` was written for the identical fault on the negotiation page
  a fortnight earlier and its note says so in those words. The smooth rule is
  NOT removed — it is what makes pressing a change card read as a journey to its
  clause — it is suspended for the width of the assignment.
- **THE FALLBACK IS THE FIX AGAIN, never the bare assignment.** A cross-module
  read that falls back to the broken behaviour is how a fix silently reverts,
  which is this codebase's most repeated defect; so where the name is
  unreachable `ceRestoreScroll` does the same job itself.
- **WHAT IS PROVED AND WHAT IS NOT, said out loud.** MEASURED in a browser: a
  bare assignment on this element really does animate (frames at 0, 2, 8, 18,
  32 … of 400) and the helper puts the same position back with no intermediate
  frame at all. **The owner's own gesture is NOT reproduced in the harness** —
  the animation fires only when the rebuilt paper CLAMPS the offset, which needs
  a height change, and the test fixture's contract is four short clauses whose
  repaint leaves the height where it was. A check written on that gesture passed
  identically with the fix patched out, so it was taken out again rather than
  shipped as a description. The mechanism is fixed; whether it was the whole of
  what the owner saw wants their own screen to confirm.

Tests: f245 (20) (4 claims), clause-editor-verify section 22 (5 — with the
CONTROL first, because "no intermediate frames" would otherwise be satisfied by
a browser that never animates at all).

**FOUR FAULTS REPORTED OFF THE SCREENSHOTS (owner-reported 28 Aug 2026), and
every one reproduced in a browser before it was touched.**

- **A BULLET LIST DREW NO BULLET.** *"even bullet points does not give you the
  bullet point it just pushes you inwards."* MEASURED: the compiled Tailwind
  blob's preflight sets `list-style:none` on every `ol` and `ul` in the product,
  and the paper's own rule gave the gutter back and never the marker. So the
  press worked, made a real list, and looked as though it had not. One
  declaration in **HaTi's own sheet**, never the blob, which regenerates.
  **AND A DEAD FIX WAS REMOVED RATHER THAN SHIPPED**: execCommand writes
  `<p><ul>…</ul></p>`, which is invalid, so a first attempt added twenty lines
  to the sanitiser to lift the list out — and the HTML parser already closes
  the paragraph on re-read, so the output was byte for byte what it had been.
  Twenty lines that fixed nothing, under a comment blaming them for the bug.
  **Measure the fix, not just the fault.**
- **UNDO DID NOTHING AND THREW.** The box's text only reached the step stack on
  BLUR — right, because taking it on every keystroke repaints the document under
  the caret — so Undo pressed straight after typing was GREYED OUT, and where it
  was live the repaint it ran raced the blur handler firing behind it:
  *"Failed to set the 'innerHTML' property … Perhaps it was moved in a 'blur'
  event handler?"* THREE PARTS: `ceUndo` pulls the box FIRST, so it undoes what
  was just typed; `ceBoxDirty` is what the button asks, so it offers itself the
  moment something is typed; and `_ceRendering` fences the paper's own write so
  the blur handler stands down while it is being replaced.
- **A TOOL THAT COULD NOT ACT WAS A DEAD PRESS.** With the caret out of the
  clause every tool answered with a line in the head that a reader looking at
  the paper never saw. They GREY now, with the reason on the hover — this
  product's own rule for what it can know before the press. **UNDO, REDO AND THE
  CONTRACT-ALONE CONTROL ARE NOT IN IT**: the first two act on the draft stack
  and the third on the page, so all three still work when the wording does not.
- **THE CONTRACT-ALONE CONTROL WAS ON THE RENDER AND NOT IN THE BUILD.** It is
  at the end of the bar: press it and the Copilot rail stands down so the
  contract has the whole page; press it again, or Escape, to bring it back. A
  CLASS FLIP and nothing else, so the caret, the selection and the reader's
  place all survive it; the rail is kept in the DOM, so its thread, its scan and
  its scroll are still there. **`ceFitSplit` STANDS DOWN WITH IT** — it writes
  an inline `gridTemplateColumns` that a stylesheet cannot beat without
  `!important`. **IT IS NOT THE PRODUCT'S FOCUS MODE and must not become one**:
  that hides the app's OWN chrome, and this page already covers the window.
- **AND THE INSTRUMENT COST AN HOUR.** A probe read `window.ceIsTyping`, which
  is not published, so it reported "not typing" however well the page worked —
  and the first diagnosis chased a fault that was not there. Read a DOM fact
  (`contenteditable` on the box), not an unexported function. **Rule out the
  instrument before believing the finding.**
- **AND THE BACKTICK FAULT WAS PAID A THIRD TIME.** The CSS comment above
  quoted the Tailwind rule in backticks, inside a file that returns CSS from a
  JS template literal — the string ended and the browser tried to parse
  `ol,ul{…}` as code. Say "sets list-style none" in prose. f236 is the net and
  the linter caught it in one run.

Tests: f245 (17) (6), clause-editor-verify section 19 (15 — **7 fail against the
code of an hour before, reporting `marker: none` and the innerHTML crash
verbatim**).

## WORK MODE IS THE PROTOTYPE'S, MEASURED AGAINST IT (owner-asked 28 Aug 2026)

*"compare what we agreed on Focus mode (previously work mode) in the attached
artifact to what you have built. They are not the same."* The artifact is the
owner's own "Work Mode Prototype", and it is the agreement — read it before
changing this page.

**THE ONE BIG DIFFERENCE WAS A HEADER NOBODY HAD ASKED FOR.** The prototype
opens straight into the white tool strip and then the contract; the build
carried the ONE-CLAUSE page's whole header above it — a crumb, the clause name,
a status chip, a clause dropdown, "Back to the negotiation" and a four-fact row.
MEASURED: 132px the prototype does not draw, so the contract began 231px down
where the prototype begins it at **92**. It is 92 now, to the pixel. Nothing is
lost that is not one press away — the facts, the status and the clause list are
all on the negotiation page this opens from. `#ce-title`, `#ce-crumb`,
`#ce-ostat`, `#ce-facts`, `#ce-sel`, `#ce-headacts` and `.ce-back-btn` are STALE.

**`#ce-say` IS THE ONE THING KEPT FROM IT**, on the strip: it is where a refusal
is spoken, and a refusal with nowhere to appear is a dead press.

**THE WAY OUT IS THE LAST THING ON THE STRIP** — filled, corners pointing in,
"Leave work mode" — which is what the prototype draws in that slot. **AND IT
SAYS THE WORD SINCE 10 Sep 2026, which REVERSES "square" IN PLACE**
(owner-reported: *"the exit button is not so clear it is an exit button in the
negotiations page. Maybe it should be a button that says exit"*). Square was the
prototype's shape for a button carrying a SYMBOL AND NOTHING ELSE, and that
symbol — four corners pointing in — reads as *make this smaller* as readily as
it reads as *leave*. **THE ONLY WAY OUT OF A FULL-WINDOW PAGE MAY NOT BE A
GUESS**: this page covers the shell, so a reader who cannot place the control
has nothing else to press. **THE SYMBOL STAYS BESIDE THE WORD** — it is what
makes the control findable at a glance once you know it, and the word is what
teaches it the first time — and **the hover keeps the longer sentence**, because
a control whose name and whose title read the same tells the reader nothing
twice (`ce_exit` is the act in one word, `ce_leave_work_mode` names which mode).
**THE HEIGHT IS UNTOUCHED at 28**, deliberately: the ask was about being
READABLE rather than bigger, the box grows to fit the label and `.ce-barg` — the
flex:1 spacer — gives up exactly what it takes, so nothing else on the strip
moves. Bold because it is filled, which is the owner's own rule for a control
row. Tests: f245 (two claims, one of them REVERSED IN PLACE),
clause-editor-verify 2o REVERSED IN PLACE plus 2q/2q2/2q3 (**3 of the 4 fail
against the parent, the headline one reporting "no label span"**).
This REVERSES the contract-alone toggle built two days earlier: that was a
reading of the button the owner reported missing from the render, and the
artifact settles it. With the header gone it is the ONLY way out, so it is never
conditional and never greys with the writing tools. **Where a keyboard reader
lands moved with it**: arrival used to focus the way out, which was the first
control on a page that had a header and is now the last; it lands on the paper.

**ZOOM IS A VIEW, NOT A FONT SIZE.** The size box on the toolbar sets the size of
the WORDS and stores it in the contract — the other side sees it and so does the
signed PDF; the −/+ on the readings row changes how big the page looks to this
reader and nothing in the document. Both exist in Word for the same reason, and
**the percentage is what keeps them apart on screen**: a number of pixels beside
a number of pixels would be two controls nobody can tell apart. Not persisted —
a reading posture for this sitting. **THE VARIABLE GOES ON `.ce-paperwrap`**:
`.rl-doc` is the PARENT of `#ce-doc`, so a custom property written on the child
never reaches the rule that reads it (measured — the readout moved and the paper
did not).

**THE CHANGES TAB IS DELETED (owner-asked 28 Aug 2026: "Delete changes tab").**
It was built that morning from the prototype — every live change on the record,
newest first, each a door to its clause — and the owner looked at it and did not
want it. **NOTHING IS LOST, which is the condition on removing a surface**: every
one of those changes is on the negotiation page's own column, in its bands, with
its verbs; and the MARKS are on the paper twelve pixels to the left, which is
what the Redlined reading is for. **DELETED RATHER THAN STUBBED**, following
Quarter, List and Obligations on the calendar: none of these was exported, so
there is no door a third caller could bring one back through. `ceFiledList`,
`ceChangesHtml`, `.ce-chg` and the `ce_tab_changes` / `ce_changes_none` keys are
STALE — the two keys are left INERT in BOTH dictionaries, because a key removed
from one and not the other is how a screen ends up half-English. **The rail is
Copilot and the playbook scan.**

**THE PROTOTYPE'S SELECTION MENU DOES NOT SURVIVE CONTACT WITH THE PRODUCT, and
that is a deliberate departure written down rather than slipped in.** Of its four
rows — Replace this wording / Suggest deleting it / Comment on it / Ask Copilot
to redraft it — only ONE is a capability the strip does not already have.
Replace IS the strip; Ask Copilot is the three chips on it, so a menu row would
be a second door onto an act that already has one; and **Comment cannot work
from here at all — the notes drawer belongs to the shell and this page covers
the shell**, so it would open behind it. So the deleting is a button ON the
strip, which also keeps the owner's own instruction, "a single strip to enter
your change". It goes through `ceReplacePassage` and APPLIES rather than files;
a cut that would empty the clause is refused in words naming the way forward.

**AND THE STRIP CARRIES THE PROTOTYPE'S HINT ROW** — where the words are going,
Shift+Enter, Esc. It is NOT the context box the owner asked to be removed: that
one printed the passage the box is now prefilled with, in a box of its own above
the field.

**STILL NOT THE PROTOTYPE'S, AND BOTH ARE THE SAME PIECE OF WORK:** renaming a
clause heading, and front matter (the title, the parties, the recitals and the
signature block) editable and recorded as a document change. The owner ruled on
the second on 28 Aug 2026 — *editable, recorded as a document change* — which is
the ruling that unblocks both. See the note below for what a heading rename
costs; front matter is the same shape one level up, because nothing can be filed
against it the way a clause can.

Tests: f245 (17) and clause-editor-verify sections 2, 18 and 20 — the header's
absence, the strip measured as one row ending exactly where the Copilot card
starts, the way out driven, the zoom measured bigger and smaller with the
furniture held still, the Changes rows counted against the record, and the
delete driven. 168/168.

**RENAMING A CLAUSE HEADING WAS THE ONE THING LEFT, AND IT IS BUILT — see A
CLAUSE'S NAME IS PART OF THE CLAUSE below.** What stood here listed exactly what
it would cost (the funnel, negoBuildBody, both renderers, the payload, a
fingerprint decision) and every line of that list turned out to be the work; the
one thing it did not predict is that the guard which stops an untouched clause
filing a fingerprint had to learn about it too.

**TWO TEST FAULTS FOUND ON THE WAY, both mine, and both worth recording.**
round-delivery-verify held a RACE — sections 3 and 4 need an answer the owner's
browser has not collected, and that was left to timing; losing one press moved
the sequence about a second earlier and six checks failed on an answer that had
simply arrived. The contract now leaves the owner's browser BEFORE the round is
sent, which is section 3's own mechanism moved earlier: **the window is closed
rather than the clock re-tuned.** And clause-door-verify's hand-staged reason
drew nothing, because **the panel's bodies are built by the CANVAS**
(redlineDocHtml pushes them into `cpSink`) and `rlCpSetShown` only flips which
one shows — a repaint is what reaches it.

Tests: f245 (8) reversed in place and made stronger (it pinned that this page's
reason step MATCHED the engine's; it pins that NEITHER asks), f245 (16) for the
strip, clause-editor-verify (140 — sections 17l2/17l3 and a new section 18 that
DRIVES the strip with a real Range and a real Enter), clause-door-verify 99,
live-verify 40 (its reason-box geometry claims re-pointed at the editor box,
which is the furniture that is left), paper-grows-verify 59, round-delivery 34,
f144, f92, six-round-audit and the four-round audit simulation.

## EDIT WITH COPILOT IS A PAGE, NOT A DRAWER (owner-approved prototype, 25 Aug 2026 — "The Clause Journey")

The panel's Copilot button used to hand the clause to the Copilot DRAWER, which is a chat about a clause you cannot see. It opens **js/views/clauseeditor.js** instead: the whole window goes to one clause, with Copilot down a third of the screen. Six of the journey's thirteen steps needed nothing built; what is new is **one page and two doors**.

**THE MIDDLE OF IT IS THE CONTRACT NOW (owner-asked 26 Aug 2026, over two rounds
of drawing — WORKORDER-clause-editor-on-the-paper.md):** *"There is no current
wording vs proposed wording windows. Just one screen in which you can edit like
you were able to edit in the proposed wording. It should also include the
redlined, as agreed and with changes features but the difference is that the
copilot window sits on the right to help with the editing."* **This REVERSES the
two stacked boxes IN PLACE and keeps everything else in this section** — the
cover, the rail, the third, Apply, the funnel, the reason step, the two doors —
because none of that was what the owner was looking at.

- **IT IS THE PRODUCT'S OWN CANVAS, NOT A THIRD RENDERER.** `redlineDocHtml`,
  the same builder the negotiation page and the counterparty's page draw,
  wrapped in `.redline-page` / `.rl-doc` / `.nego-scroll` so it borrows the
  paper's own sheet rather than growing a second set that agrees today.
  `.ce-box`, `.ce-stands`, `.ce-prop`, `.ce-bh`, `.ce-seg`, `#ce-stands`,
  `#ce-prop`, `ce_as_it_stands`, `ce_proposed`, `ce_view_redlines` and
  `ce_view_edit` are STALE — flag any mention; the two keys are left inert in
  both dictionaries.
- **THE ONE HARD PART IS A DRAFT THAT IS NOT ON THE RECORD YET**, and it was
  stated before it was planned around. Every mark that canvas draws belongs to a
  change that has been FILED, and this rulebook forbids re-diffing there in so
  many words — *a mark drawn from a fresh diff would not be the mark the other
  side verified*. The editor's whole point is the opposite: you type and you see
  what your typing WOULD do. **THE SEAM IS A BODY, NOT A DIFF**: `opts.live =
  {clauseId, html}` — the caller hands over finished markup for exactly ONE
  clause and the canvas draws it where that clause goes. Nothing there computes
  it, nothing stores it, it dies with the page. **FOUR PROPERTIES, each true by
  construction rather than by care**: one clause; a filed change's marks still
  come from its own stored ops; it never persists (it is a string on its way to
  innerHTML); and the counterparty cannot reach it — they have no editor here
  and never pass it, which is asserted rather than assumed.
- **THE THREE READINGS ARE `rlReadSegsHtml`, IN ITS THIRD HOME** — never a
  second control. The two-way Redlines|Edit toggle it replaces is retired with
  the box it sat in: **editing is no longer a VIEW of a box, it is what the paper
  does.** `_ceEditing` is whether the one clause is typeable; `rlReadMode` is how
  the whole document is drawn. Two questions, two answers.
- **AND THE DRAFT ANSWERS THE READING TOO.** A first build drew the draft's
  marks in all three, so the one clause the reader was working on was the one
  clause that did not obey the tab they had just pressed. As agreed = what the
  clause says today (a draft nobody has filed is not in the agreement); With
  changes = the draft as ordinary wording. Both go through the same op renderer
  with the two texts equal, which is how they inherit the hanging indents and the
  sub-paragraph shape the rest of the paper has.
- **THE PENCIL IS THE PRODUCT'S OWN, AND A CALLER MAY SAY WHAT ITS OWN ONE
  DOES.** `rlClauseEditPillHtml` gained `opts.pill = {attr, label, title,
  pressed}`, and `redlineDocHtml` routes all four of its clause branches through
  one `pillFor`. Here it turns typing on and off; on another clause it MOVES the
  page to that clause, through `ceGoClause` — the same act the crumb's dropdown
  performs, because a second copy is how the two come to disagree about what an
  unfinished draft costs. Its words may be a FUNCTION of the clause, or one
  pencil tells nineteen clauses it will do something it will not. Absent the
  hook, the control is byte for byte what it always was.
- **PHASE 4 IS ONE PREDICATE, ASKED IN THREE PLACES.** `ceEditableReading()` —
  As agreed and With changes draw the paper without its marks, so anything typed
  there would be measured against a document the reader is not being shown. The
  pencil stands down inside `rlClauseEditPillHtml` (so this page inherits the
  rule rather than remembering to ask it), the caret stands down at the paint,
  **`ceApply` REFUSES IN WORDS** — it is the third door into the wording and a
  rule kept in two of three places is not a rule — and Undo, Discard and File
  grey with the reason on the hover, because a band saying *not editable* over a
  live Save is a page arguing with itself. The cost is one press and it is the
  honest one: file from the reading that shows you what you are filing.
- **THE BAND IS `rlReadNoticeHtml`, ITS BODY BACK FOR ONE SURFACE.** Owner-asked,
  in the owner's own words — *"this page is not editable - back to redline"*,
  SIMPLY, so it is one sentence and one button. `opts.on` is what protects the
  negotiation page's own retirement: the notice stack calls it with nothing and
  still gets nothing. It passes both halves of the standing band test — it says
  something no control on that screen says (the pencil is hover-only since this
  morning, so nothing on a refusing reading looks missing), and the way back is
  ON it, pressing `data-rl-read`, the reading tabs' own attribute. **On Redlined
  it draws nothing at all**, so it cannot become furniture.
- **NO QUEUE RAIL** (owner-ruled: *"Should not be in the edit page"*). The
  round's reading order stays on the negotiation page, where a round is worked
  through; this page is about one clause. Nothing is built and nothing is left
  dormant, and its ABSENCE is asserted.
- **THE READING IS THE PRODUCT'S, NOT THIS PAGE'S** — and that costs one line.
  `rlSetReadMode` repaints the negotiation page's TAB ROW while this page covers
  it, so a reader leaving on As agreed would come back to a page whose tabs said
  one thing over a document still carrying its marks. The reading at OPEN is
  remembered and closing repaints the page below **only when it actually moved**.
- **AND THE BROWSER FILE PASSED ON A FAULT THE REAL APP WOULD HAVE HAD — f232
  is what caught it, and this is the lesson worth more than the feature.** This
  page reads the negotiation view's readings through `window`, and `rlReadMode`
  was NOT on its export list. In the product that is `undefined`, so the draft
  would have answered 'marks' on every reading and the page underneath would
  never have been brought back in step — the rlPaperFootHtml class, silently.
  **The browser harnesses load these files as CLASSIC SCRIPTS**, where every
  top-level function really is a global, so `window.rlReadMode` resolved there
  and every claim about the readings passed. **A browser file cannot see an
  unpublished name; only the sweep can.** Run f232 before believing a green
  browser run on anything that crosses a module boundary.
- **THE MARKS HAD NO COLOUR ON ARRIVAL, and it is the clothes-follow-the-builder
  lesson one layer deeper.** `.nego-ins` / `.nego-del` are UNSCOPED and read
  `--n-ins-fg` / `--n-del-fg`, which are declared on `.nego-room, #nego-root,
  …` — so on the negotiation page they resolve because the paper sits inside
  `#nego-root`, and on a page with no room around it the colour declaration was
  dropped outright and every insertion and deletion came out in the document's
  own ink: a redline with no red in it. `.redline-page` joined that token list.
  **ON THE NEGOTIATION PAGE THIS MOVES NOTHING** and that is what makes it safe
  rather than convenient — `#nego-root` is nearer the marks and defines the same
  values, and no rule scoped to `.redline-page` reads an n-token at all.
  Measured before it was written; the colour census stayed 40/40 throughout.

- **THE PAGE COVERS THE PAGE, NOT THE SHELL — REVERSED IN PLACE 25 Aug 2026** (owner-asked, off a screenshot with both ringed: *"the highlighted bars (nav panel and the top panel) have to be on screen when you are in the editing with copilot"*). **ONLY THE COVER MOVED; THE HALF THAT MATTERED IS UNCHANGED**: the approved render moves the shell's own brand and controls into this page's two bars, that is a live DOM move of elements other renderers repaint, and it is still deliberately not taken. What changed is where the cover starts. MEASURED before: fixed at 0,0 over the whole window, and probing the middle of the shell bar and of the nav column returned this page's own content — both were genuinely hidden. **THE BOX IS MEASURED, NEVER TYPED** — `ceFitToShell` reads `#content-scroll`'s own rect and writes left/top/width/height, with a ResizeObserver bound ONCE on that element. The nav has three states (240px column, 64px rail, a floating layer below 1440), so a typed inset would be right in one and wrong in two; the scroller is the one element that already answers for all three. A rect of zero is refused — the standing rule. **z-index 54, DOWN FROM 55**, and that is what lets the floating nav drawer open OVER this page: `#side-nav` is 55 below the float line and this page is later in the document, so at equal weight it won. Still above the Copilot drawer (50) and the activity panel (46), still below modal-root and the toasts. Mounted on demand and REMOVED on close — the DOM cost is zero when nobody is in it, and there is no half-built page for another renderer to walk into.
- **THE RAIL RUNS FLOOR TO CEILING, AND THAT IS THE ONE THING TO GET RIGHT** (owner-corrected repeatedly on the prototype, and reported again the day this shipped: *"Confirm the copilot window on the far right goes all the way to the top"*). It did not: the crumb, the title and the fact row were written as a FULL-WIDTH header above both columns, so the rail started **172px down** — MEASURED before it was touched. The header sits INSIDE the left column now and `.ce-grid` is the page's only region, so the rail is 0 to the window's own bottom. **ANYTHING NEW THAT SPANS "THE WHOLE PAGE" GOES IN THE LEFT COLUMN TOO** — that is the rule, and a full-width strip added above the grid later would push the rail down again by exactly its own height. Pinned as a geometry in clause-editor-verify (2d2/2d3), which reports the rail's top and bottom against the page's own, so it can never regress silently.
- **THE RAIL IS ONE THIRD** (`minmax(0,2fr)` beside `minmax(340px,1fr)`, measured at 0.333 in a real browser). The 340px floor bites only on a window too narrow for a third to be usable, and below 1024px the door is **not offered at all** — `clauseEditorFits`, asked of the window, the same question the stylesheet's own break asks. A page that cannot be used is worse than a page that is not there.
- **APPLY IS THE ONLY THING THAT MOVES THE WORDING, AND IT MOVES IT INTO THE BOX** — never into the contract. A Copilot suggestion, a playbook standard, a passage rewritten in place and the reader's own typing all go through `ceApply`, which is what makes the redline underneath honest: it is recomputed from the two texts every time, so it cannot describe a route it did not take. **IT STACKS** — apply twice, step back one at a time. Nothing is filed until the one act in the rail's foot is pressed.
- **THE REDLINE IS THE PRODUCT'S OWN ENGINE.** `redlineOps` + `redlineOpsBlocksHtml` + `redlineStats` — the same functions that file the marks. No mark is written by hand anywhere on this page, and f245 greps for one.
- **IT FILES THROUGH negoEditClause AND NOTHING ELSE** — same funnel, same fingerprint, same desk rule, same review gate, same executed-wording freeze. A suggestion that arrived from a model is not a different KIND of change and must not get a private path into the contract. f245 fails on `negoFileChange(`, `changes.push`, `negoInsertClause` or `negoDeleteClause` appearing in this file.
- **THE REASON STEP IS HaTi'S OWN, SKIP INCLUDED, and that is a deliberate difference from the prototype.** The render refused a blank reason; this product has always allowed one to be skipped on purpose (see the two-step note in js/views/negotiation.js — "Skip is a visible button, so a blank reason means somebody decided against giving one"). One page refusing what every other page permits is a second rule wearing the first one's clothes. Same keys, same three buttons: `ng_why_this_change`, `ng_file_change`, `ng_skip_no_reason`, `ng_back_to_wording`.
- **BACK WHERE YOU STARTED.** Closing repaints nothing unless something was filed — the reader's place in the contract is the one thing they were holding on to — and the clause panel is still standing behind, so filing lands them on the panel they came from (`rlCpSetShown(document, clauseId)`).
- **TWO DOORS, ONE ROUTE.** The panel's Copilot button (`data-rl-cp-editor`, which **keeps `data-nego-ai-clause` as the FALLBACK** for a stage without this module — the browser harnesses build their own script lists) and a ✦ on every tracked change (`data-rl-cp-editor-row`), which **LEADS**: the approved journey puts Edit with Copilot above Open in the clause panel. Both resolve through `rlOpenClauseEditor` and nothing else.
- **THE ROW DOOR IS THE ✦ ALONE, AND IT DOES NOT WEAR `.rl-open-btn`.** Icon-only because a receipt is one line and a second labelled button is what would push it to two; its words are on the hover and its accessible name. The class matters more than it looks: `.rl-open-btn` MEANS the Open button and half a dozen checks resolve it by that class alone, so a second element answering to it makes every one of them pick whichever comes first in the markup — caught by f100 in one run. It takes the same dressing from its own rule instead.
- **`data-rl-cp-close` CAME OFF THE PANEL'S BUTTON, and that is load-bearing rather than tidying**: it is handled in the CAPTURE phase, so the panel would shut before the page opened and closing the page would land the reader on a shut panel.
- **THE PANEL'S ESCAPE NOW DEFERS TO THE PAGE.** Both handlers sit on `document`, so one Escape closed the editor AND the panel behind it in the same press. Caught only by driving the journey in a browser — two listeners agreeing to fire is invisible in the source of either.
- **THE NAME IS `rlOpenClauseEditor`, NOT `openClauseEditor`** — js/views/settings.js has owned that name for the clause LIBRARY editor all along, and f48 caught the collision on the first run.
- **ONE CARD PER ASK, and that is a deliberate difference from the render**, which showed two or three ways to answer. Each alternative is a separate paid call to the model; the ready-made chips make a firmer or a plainer version one press each, so the reader spends that money when they want it. **WHAT COPILOT READ IS OUR OWN READING, NOT THE MODEL'S**: the playbook position, what this workspace settled before (`precedentForChange`) and what the other side actually asked are computed from the record and PASSED IN. A model naming its own sources cannot be checked; a list built from the record can.
- **THE SCAN IS THE PLAYBOOK'S OWN.** `runPlaybookReview` for the run,
  `rlPlaybookProposals` for what is proposable, narrowed to this clause and
  drawn in the same card shape. A rule that is MET offers nothing to apply.
  **IT NO LONGER ALL HANDS TO THE SAME APPLY — see the section below.**

- **TWO LISTS, TWO VERBS, AND A RULE THAT IS NOT ABOUT THIS CLAUSE CANNOT
  REPLACE IT** (owner-reported 26 Aug 2026, off Clause 2 of an equipment lease).
  The rail on a LEASE CHARGES clause listed a DATA PROTECTION rule and its "Use
  our standard" struck out the whole lease-charge sentence and put a data
  protection paragraph in its place. **THREE FAULTS STACKED.**
  - **THE PANEL SHOWED HOMELESS RULES INSIDE WHICHEVER CLAUSE WAS OPEN.** The
    reading was "this clause's findings, plus the ones that matched no clause at
    all", and that INTENTION is right and is kept — a standard missing from the
    whole contract is worth knowing about while you are drafting one.
  - **BUT BOTH GROUPS WERE HANDED THE PAGE'S ONE VERB**, which replaces the
    clause you are looking at. A finding with no clause of its own has nothing
    here to replace: it is answered by ADDING a clause, which is what the
    negotiation page's Playbook review has always done with it. **`ceScanGroups`
    is the split, taken at SOURCE rather than at the draw** — `here` may be
    edited in place, `missing` may only be added — so neither list can reach the
    other's verb, because the verb is chosen from the list a finding is in. The
    order is asked `!it.clauseId` FIRST: with no clause open, both sides of an
    equality on null are null, and testing the match first files every homeless
    finding under "this clause". `ceScanItems` is the flat list the press
    handler indexes and is BUILT from the groups, so the two cannot drift.
  - **AND THE MISSING CARD DREW A REDLINE AGAINST A CLAUSE IT HAD NOTHING TO DO
    WITH** — the visual lie at the heart of the report. A rule that located no
    clause prints its wording PLAINLY; only a located rule is marked up.
  - **ADDING GOES THROUGH `rlFilePlaybookProposal`**, never a second filing path
    here: that function already knows where a new clause may land (ahead of the
    execution wording, never after it) and what note it carries. The card then
    settles into "Added as a new clause" — per sitting, in memory — because it
    is the only press on this rail that puts a tracked change on the record
    rather than filling a box the reader can undo.
- **OUR WORDING AND THE MODEL'S ARE TWO DIFFERENT THINGS** (same report, and the
  half worth fixing first). `preferred` read `v.redline || libCl.preferred` — the
  MODEL'S suggestion FIRST — and every surface printed it under a button reading
  **"Use our standard"**. So a workspace whose approved position is the Data
  Protection Act, 2019 was shown Copilot's improvisation citing **GDPR**, wearing
  a label saying somebody here approved it; the approved clause sat on the
  quieter **fallback** button beside it. **THREE NAMED SLOTS NOW AND NOTHING IS
  LOST**: `preferred` and `fallback` are the clause library's, `draft` is the
  model's, a draft repeating a library wording is dropped rather than drawn
  twice, and `lead`/`leadKind` say which one a card previews so the picture and
  the first button cannot disagree. **BOTH SURFACES CHANGED TOGETHER** — the rail
  and the Playbook review modal — and `rlPbWordingLabel` is the ONE naming, so
  neither can call the same thing by another name. The modal also stopped drawing
  its preferred button unconditionally: a position the library has no entry for
  offered a press that filed nothing. Tests: f245 (12), f131 (Fix 2b),
  clause-editor-verify 12a-12i.
- **A REDLINE IS WORDING, NOT A NOTE ABOUT WORDING** (the third half, on the
  server). The prompt asked for "a suggested redline in the preferred wording" —
  loose enough to be read as a DESCRIPTION of it — and the field is filed into
  the contract VERBATIM, so what came back was *"Insert a data protection clause
  addressing … (e.g., GDPR)"*: an instruction to a drafter, citing the wrong
  country's regime under a prompt that opens "practising under Kenyan law".
  `AI_REDLINE_RULE(jurisdiction)` is stated ONCE beside `AI_QUOTE_RULE` and used
  in the schema field AND the prompt, so the two cannot drift; it takes the
  jurisdiction because half of what it fixes is naming the wrong country's law.
  `const J = orgJx()` moved above the tool that reads it. Tests: f230 (5b).
- **THE CARD SAYS WHAT THE PRESS TAKES** (owner-asked 26 Aug 2026, drawn and
  ruled before it was built). The marks alone do not say how much of the clause
  is going: a standard striking out every word reads, at a glance, exactly like
  a change of three. `ceCostLine(from, to)` is that sentence and **it counts
  nothing new** — `ceCounts` is `redlineStats`, which counts WORDS and is what
  the page foot's own +N -N already prints, so the line and the header cannot
  disagree about what a word is. Three shapes, because the honest sentence
  differs: everything goes, some goes, or nothing of the reader's is at risk and
  wording merely arrives. **NULL WHERE THERE IS NOTHING HONEST TO SAY** — a line
  reading "changes 0 of 16" is worse than no line. **DRAWN QUIET (owner-ruled):**
  the label shade, never amber — replacing a whole clause is often exactly right,
  and an alarm that is always on is the one nobody reads. **NOT ON THE MISSING
  GROUP AT ALL**: a rule there replaces nothing, so a line about what it takes
  away would describe an act that never happens. **AND EACH VERB CARRIES ITS OWN
  COST ON ITS HOVER** — the visible line describes the wording being SHOWN, and a
  card offering three of them would otherwise make the reader press one to find
  out. Tests: f245 (13), clause-editor-verify 13a-13d.
- **A MATCH IT IS NOT SURE OF IS NO MATCH** (owner-asked 26 Aug 2026 — the cheap
  half of clause types, bought for an afternoon). `rlPbFindClause` matched a rule
  to a clause by hunting for the quoted sentence and, failing that, GUESSING by
  shared words. The guess was loose in three ways at once: the bar was HALF the
  quote's long words, which contract clauses share freely; a word was counted by
  `includes`, a SUBSTRING test, so "days" scored against "holidays"; and it
  returned the best clause however close the runner-up, which is a coin toss
  reported as a finding. **CONTAINMENT IS UNTOUCHED** — a verbatim quote is
  certain and is not weighed. Beneath it, words are matched as WORDS
  (`_rlPbWords`), the bar is `RL_PB_MATCH_MIN` (0.7), and the winner must also be
  `RL_PB_MATCH_LEAD` (0.15) clear of second place: **two clauses scoring alike is
  the one state that must answer "I do not know"**, because the wrong one of them
  looks identical to the right one. MEASURED against the old matcher: quotes
  whose words are spread over two clauses used to locate one of them and now
  locate neither.
- **AND REFUSING CREATED A THIRD LANDING, WHICH IS THE PART TO GET RIGHT.**
  `landing` is named once in `rlPlaybookProposals` and has THREE answers: a
  located clause is **edit**, a standard the scan found nowhere is **add**, and a
  deviation nobody could place is **unplaced** — we know the wording is in the
  contract and not which clause holds it, so editing would land on the wrong one
  and adding would put a second copy of a clause the document already has. That
  state is NOT new (a quote the scan trimmed has always failed to match) and it
  used to fall through to the insert, silently. **THREE SURFACES ASK THE ONE
  READING**: the rail draws it on neither list, the review modal offers it no
  verb and names the state instead (`ng_pb_unplaced`), and
  `rlFilePlaybookProposal` refuses it outright — the wall, so a surface that
  forgets cannot file one. Tests: f131 (Fix 2c, 2d).
- **A DEVIATION IS EDITED, NOT BULLDOZED** (owner-asked 26 Aug 2026 — option D).
  `AI_REDLINE_RULE` asked for "replacement wording" and got exactly that: on a
  lease-charges clause the library's generic payment wording went over
  "The Lessee shall pay ... in advance, exclusive of VAT", losing "in advance"
  and renaming the **Lessee** to the **Buyer**, because a generic clause does not
  know what document it landed in. The rule now asks a deviation for the
  **SMALLEST change that meets the position**, keeping every word that is not
  off-position — the parties' defined names, the amounts, the dates and anything
  plainly negotiated — and forbids pasting a generic clause over one the document
  already has; a MISSING position has nothing to keep and is still written out in
  full. **THE LABELS ARE UNTOUCHED**, which is what keeps this honest: the
  library's own wording is still what "our standard" serves, and the fitted
  version is still Copilot's draft under its own name. What C then adds is that
  the two costs are readable without pressing either. Tests: f230 (5c).
- **A READING THAT SERVES A MARKUP SLOT AND A TEXT SLOT IS BUILT AS TEXT AND
  DRESSED AT THE SLOT.** `pbVerdictLine` returned MARKUP; this rail needed the
  same sentence as plain text, stripped its tags and escaped the result — and
  stripping tags does not touch an ENTITY, so the ampersand was escaped a second
  time and `&middot;` arrived on screen as five visible characters.
  `pbVerdictWords` is the plain core and `pbVerdictLine` is `_pbEsc` of it, so
  the playbook panel does not move by a pixel. **Never dress and then undress —
  the undressing is lossy and the loss is silent.**
- **AND A SCAN THAT COMES BACK WITH NOTHING SAYS SO WHERE THE READER IS LOOKING
  (owner-asked 26 Aug 2026: "you should be able to run the playbook scan by
  pressing the highlighted button").** THE BUTTON WAS WIRED AND DOES RUN —
  proved by pressing it on an ordinary contract in a real browser, findings and
  all. What it could not do was FAIL OUT LOUD: `runPlaybookReview` answers null
  where there is no readable wording — an upload whose text never came out of
  the file, which is the commonest shape on this screen — toasts a red line
  that fades, and the panel then redrew the SAME "not been checked yet"
  sentence and the SAME button. Nothing on screen moved, which is exactly what
  a dead press looks like. REPRODUCED before it was touched.
  **THE RENEWAL CARD ANSWERED THIS SHAPE ALREADY**, in its own words: a failure
  states itself where the reader is looking rather than relying on a toast that
  has already faded. `_ceScanErr` is `_renewalAdviceError` for the scan —
  written by the one runner, cleared the moment a review arrives, cleared again
  before each fresh run so a stale note cannot outlive it, and the button then
  reads "Run it again" because a refusal needs its way forward on the same
  screen. **IT DOES NOT RE-DERIVE WHY**: `runPlaybookReview` owns the reading of
  whether there is wording to check, and a second copy of that test here is the
  twin-formula fault this codebase records — so the panel reports what it can
  stand behind and names the usual cause and the remedy as prose.
  `ce_scan_nothing` / `ce_scan_nothing_why`, both languages. Tests: f245 (11).
- **ONE SENTENCE AT A TIME SITS INSIDE ONE SUB-PARAGRAPH.** A clause's text carries one limb per LINE and those breaks are what the document builder reads back into real numbering, so a passage dragged across two of them is refused rather than silently run together — the same reasoning that refuses a highlight across two clauses on the paper. The replacement happens inside that one line and every other line is carried across character for character.
- **THE READY-MADE QUESTIONS ARE ONE LINE, ALWAYS** (owner-asked in those words): `flex-wrap:nowrap`, the row scrolls sideways, each chip `white-space:nowrap`, and a mask rather than a colour fades the edge so it reads as "there is more" rather than as clipped.
- **THE PAGE CARRIES ONE BRAND COLOUR AND NO OTHER** — Copilot takes the workspace accent here rather than a violet of its own. That is a decision about THIS page: the clause panel's own Copilot button keeps the violet it has always worn.

**THE HEAD IS THE NEGOTIATION HEAD'S, BY WEARING ITS OWN CLASSES (owner-asked 25 Aug 2026, off two screenshots: "the highlighted part should be the same exact design as image 2 including the font sizes").** The way to be the same as that head EXACTLY is to be dressed by the same rules rather than by a second set that agrees today — so this page emits `.room-head`, `.room-id`, `.room-name`, its `h1`, `.room-sub`, `.room-facts`, `.room-facets` and `.room-facet`'s `.l`/`.v`, all defined unscoped in index.html. MEASURED afterwards, property for property against the live head: title, sub-line, label and value all identical. **THE FACTS ARE THE CLAUSE'S, so roomFactsHtml itself cannot be reused** — it reads counterparty, value and term; the SHAPE is shared and the reading is this page's own. **ONE DECLARATION IS RESTATED AND ONLY ONE**: `letter-spacing:0`, because the negotiation page zeroes the global h1 tracking of -0.01em in a block scoped to itself, so `.room-head h1` alone left the title a fraction wide (-0.15px against 0). **AND THE COLLAPSE CONTROL IS DELETED, NOT HIDDEN** (same ask): `.ce-fold`, `.ce-ohwrap` and the is-folded rule are gone, because a control for tidying away four facts on a page whose head holds nothing else is furniture, and hiding the control while leaving the machinery is how it comes back.

**THE WAY BACK IS AT THE RIGHT, DRESSED LIKE THE DOOR IT MIRRORS** (owner-asked, same day: "move the back to negotiations button to the right where I have highlighted and it should look like the button in image 3"). It left the crumb for the head's right-hand acts and wears `.ui-btn` with `#ws-to-nego`'s own metrics — MEASURED identical on every property against a reference built exactly as the Document tab builds it. **IT REPLACES THE OLD Close**: both left the page, and two controls that do one thing is precisely the duplication reported on the contract room the same morning. What stays in the crumb is what that line is for — which contract, and which clause of it.

**AND NO BRANCH OF THE CONTRACT HEAD DRAWS A SECOND DOOR ONTO THE NEGOTIATION** (owner-reported, same day, off a screenshot with both ringed: "you have duplicated the door to negotiations page. Remove the top one"). The Document tab already carries `#ws-to-nego` at the right of its tab row — the ONE door from that tab, kept bordered there because a bare verb at the far right of a tab row is the one place a control genuinely gets missed — and `wsNextAction` put another in the head's lead slot forty pixels above. **ALL THREE `kind:'review-changes'` BRANCHES TAKE `noButton`, not the one in the screenshot**: this file's first rule is that the same thing is drawn in several places and a fix in one is not a fix in all, and the branch that actually fires most often is the open-round one, which was NOT the one photographed. Left half done, the duplicate would have vanished on one contract and stayed on the next. **`noButton`, NEVER null**, and the reasoning is f176's own, written for exactly this shape: the head draws nothing and the GUIDE stays, so the phone's own reading still answers what the next step is; returning null would fall through and say something true, useless and silent about the round that is open. **NOTHING URGENT IS LOST ON THE DESKTOP**: the sub-line already prints "N needs you" in amber and the tab-row door already carries its own count ("Open Negotiate · 1 waiting").

**AND NOR DOES IT DRAW A DOOR ONTO KEY TERMS (owner-asked 9 Sep 2026: "delete
the complete key terms button").** The FOURTH control of one family off this
head, and the argument is the one the three above it already make: the lead
slot pointed at a page the reader was standing on. **"Key terms" is the FIRST
tab in the row forty pixels below and is drawn from every tab**, so the head's
copy was the second door onto it; the fields themselves sit an inch under it
saying "Not set" beside their own pencils, which makes the button a press spent
arriving somewhere you can already see. **THE FACT SURVIVES ON THE OTHER FOUR
TABS WITHOUT IT** — the head's own fact row prints Value and Term as em-dashes
wherever the reader is standing, which is what says the terms are incomplete.
**`noButton`, NEVER null**, for the reason its three siblings give: null falls
through to the rung below and the phone's bar then reads "All key terms are
set" over a contract whose key terms are not set. **THE GUIDE STAYS AND SO DOES
THE LABEL** — `ct_complete_key_terms` is NOT stale, it is what the machinery
would print, exactly like `ap_alerts_not_here` and the other three branches'
own words. **AND THE ACT IS KEPT, PUBLISHED AND WIRED**: `focusKeyTerms` and
its dispatch branch stay beside the three other noButton kinds, because
deleting an act the day one door closes is how a capability goes missing the
day another opens. Tests: f176 (three new claims, **one of them failing against
the parent**), newcontract-verify (**4 of its 24 fail against the parent** — it
stands on a draft created with the fields skipped, which is the reported state,
and reads the head as PAINT on all four tabs with the head's other acts as the
CONTROL).

**AND THE COUNTERPARTY'S SEAT WAS PROVED UNTOUCHED, NOT ASSERTED (owner-asked, the same day).** Their page was rendered from a REAL share payload in a worktree at the commit BEFORE this work and again at HEAD, and the two dumps — the whole of `#share-root`, every button with every attribute, normalised only for generated ids and clock times — are **byte for byte identical, on BOTH of their screens**: the negotiation workbench and the signing page, 81 buttons each. **IDENTICAL MARKUP IS NOT IDENTICAL BEHAVIOUR**, so it was pressed as well: the one thing this work changed in a file their page loads is the clause panel's Escape handler, which now defers while the editor is open — it is never open there, and their panel still opens from the pill and still closes on Escape. Forced open from their seat, `rlOpenClauseEditor` refuses in words and mounts nothing. Their own Accept still turns a card's verbs into Send and Undo and still raises the unsent band. Pinned permanently as clause-editor-verify section 11 (the before/after diff cannot be a standing test — it needs the old tree — but every claim it made can be, and is). **ONE INSTRUMENT FAULT ON THE WAY, worth recording**: the first probe read `PORTAL_NEGO_DECISIONS` through `window` and reported zero however well the press worked — that store is module-local and is not published. Rule out the instrument before believing the finding; measure what a person sees.

**THE CLAUSE YOU ARE TYPING IN IS STILL THE PAPER (owner-asked 27 Aug 2026, Option A off a drawn render: *"you click on the edit symbol and then a window of the clause opens up to be like a search field. I want when you click on edit the field to not change color and just have a very light almost dotted line around the clause you want to edit. It should not look out of place."*)** It read as a search field because it WAS dressed as one: a pure white fill with a solid 2px accent ring is exactly how this product draws a form input, so the reader was shown one, dropped onto a cream contract. Two marks for one fact, and the louder of them was the one that did not belong.

- **THE FILL AND THE RING BOTH GO AND THE PAPER SHOWS THROUGH.** What is left is `outline:1px dashed` at `outline-offset:4px` — an OUTLINE rather than a border, so it takes no space and nothing on the page moves when it appears; a border would reflow the clause under the reader mid-sentence.
- **THE COLOUR IS THE DOCUMENT'S OWN INK AT A FIFTH STRENGTH, NEVER A TYPED GREY**, and that is what makes ONE declaration right in both themes: the sheet is cream by day and near-black at night, so a fixed light grey that whispers on the cream is invisible on the other — and the dark override is the half that gets forgotten. `color-mix(in srgb, var(--color-doc-text) 22%, transparent)`, so the line follows the paper. MEASURED in both: `srgb .055 .102 .094 / .22` on the cream, `srgb .886 .910 .941 / .22` on the near-black.
- **WHAT CARRIES FOCUS IS THE CARET**, which is the strongest indicator a text field has and is why this line does not need to shout: the line says WHERE the editable region is, the caret says you are in it. The `:focus` rule is the resting rule repeated rather than a stronger one — a mark that holds until the reader clicks into it is no mark, because typing is the one moment this state is ever seen.
- **THE TEAL MARGIN BAR WAS UNTOUCHED HERE AND IS RETIRED — REVERSED IN PLACE 29 Aug 2026** (owner-asked, ringing it: *"delete the green line bar on highlighted in the attached"*). It said WHICH clause is live, and keeping it while the fill came off was right at the time: taking BOTH marks in one pass would have left the page saying nothing at all. **What makes removing it safe now is that three other things already answer that question** — the dashed frame this section is about, the caret sitting in it, and the page naming its ONE clause at the top. **DELETED, NOT MADE TRANSPARENT**: a bar painted in the page's own colour still reserves its margin and still has to be ruled out by the next reader. Its `position:relative` went with it and is not needed — the clause is already positioned by the redline page's own rule, which is what the RED changed-clause bar hangs off. **THAT RED BAR STAYS** and is asserted beside the removal in both files, so this can never be read as covering it: a different mark, saying the clause carries a change, drawn on every changed clause in the product rather than only on this page's live one.

**AND THE CHIPS MOVED ONTO THE READINGS ROW (owner-asked the same day: *"the name of number of the edit plus the something of my own are taking up space from the contract. They would maybe go on the far right of the contract tab changes and give space back to the contract."*)** They had a full-width strip of their own directly above the paper — MEASURED at 40px with its rule, on a page whose middle is meant to be the contract. `ceCtxChipsHtml` is drawn by `ceRenderReadBar` and by nothing else (two callers would be the same chips in two places disagreeing about which is lit), and they sit inside the running `+N −N` readout, which is where the reader's eye already goes for what their typing is doing.

- **THE SPACE WAS ALREADY THERE, NOT TAKEN.** Measured at 1500px, that row had 580px spare and the chips need 372; the row is still ONE line, and it is measured as one by comparing CENTRES rather than tops — the children are deliberately different heights, so equal tops would report a correctly-centred row as three lines.
- **THREE THINGS WENT WITH THE STRIP AND NONE OF THEM IS LOST.** "On this clause" — the page is about ONE clause and its name is two rows above, in the crumb and in the dropdown under it. "Nothing has been proposed on this clause yet" — the crumb already says "Nothing on the table" and the fact row says it twice more, so it was the same fact printed a fourth time. And **"+ Something of my own" was REMOVED OUTRIGHT, owner-ruled**: it set the editor to speak for no particular ask, so the box opened on the clause as it stands — which is exactly one press of **Discard**, checked before the chip was deleted rather than after. Filing is unaffected either way, because the funnel folds by side and round and never by which chip is lit.
- **`ce_on_this_clause`, `ce_nothing_proposed_yet`, `ce_something_of_my_own`, `.ce-ctx` and `.ce-chip-new` are STALE** — flag any mention. The three keys are left INERT in BOTH dictionaries with the reason written beside them: a key removed from one and not the other is how a screen ends up half-English.
- **THE ONE COST OF MOVING THEM IS A SECOND REPAINT**, and it is the fault this could have shipped: the chip press painted the head alone, so the pressed chip never lit. It repaints the readings row too. Pinned by pressing it and reading the class back.
- **DRAWN NOWHERE when nothing is on the clause**, which is what keeps that row the height it has always been on the commonest screen of all — and the empty-state sentence is not drawn in its place either.

**WHAT IS DELIBERATELY NOT DONE, said out loud:** the counterparty's page is untouched, as agreed — the editor refuses their seat outright and the ✦ is never drawn on it; there is no phone layout, and below 1024px the door is not offered; and the answers Copilot gives are only as good as the instruction behind them, which has been written but not yet tested against a shelf of real clauses. **AND THE NEGOTIATION PAGE'S OWN DIVIDER HAS THE SAME SILENT-AT-A-FRACTION-LIMIT GAP** this page's divider was corrected for — its at-limit reading knows only the pixel floors, so on a wide window the grip stays grey at the 45% stop. Noticed while dragging this one; left alone as somebody else's screen.

Tests: f245 (37, with its two-box claims re-pointed at the paper — the claim was never the boxes, it was that the reader can see their draft marked against what stands), f232 (the three reading names published, or the reads are silence), f148 (both languages), f176 (widened — every branch of the head declines that door), clause-editor-verify (74, browser — the rail measured floor to ceiling AND at one third, the chips proved to take one line, the redline proved to DRAW with its marks coloured and struck, and the whole journey driven: open, apply, apply again, undo, save, say why, file, and the change on the record with the panel back up behind it), clause-door-verify 8d REVERSED IN PLACE (the destination moved; the corner-dropdown report it was written for is still exactly what is pinned), redline-verify's hand-over block reversed the same way (its "the clause's own wording is on screen beside the rail" claim re-pointed off the retired upper box onto the clause the page is about), f48 / f232 / f148 / f100 each catching one real fault on the first run. **The 26 Aug rebuild added clause-editor-verify sections 12a-12n (14 claims, every one MEASURED BEHAVIOUR rather than a class): the clause opens typeable, the pencil is the product's own control, typing produces a live mark, the three readings really change what the paper draws, nothing on a refusing reading takes a caret, Apply is refused there and the wording provably does not move, the acts grey with their reason, the band draws with its way back and draws NOTHING on Redlined, the negotiation page's own retirement still holds, the queue rail is absent, the pencil on another clause moves the page, and leaving on a clean reading leaves the page underneath in step.** Two of them failed against my own first attempt and each named a real fault — the draft ignoring the reading, and the marks arriving only when you stop typing. **Node 4663/4663. Browser: every file this change can touch is green — clause-editor 75, redline 164, clause-door 99, parity 44, nego-redesign 52, counterparty-reading-and-more 63, theme-tokens 40/40, six-fixes 20. Six files are red and NOT ONE IS THIS RUN'S** — each was re-run in a worktree at the parent commit and came back with the identical count and the identical failing checks; they are the same morning's WHOSE ASKS retirement and settled-piles rebuild, and they are listed by name in BUGLOG.

FIVE THINGS OFF FIVE SCREENSHOTS (owner-asked 16 Aug 2026). Together they finish the paper's half of the clause-panel design.

- **AN INSERTION IS GREEN AND NOTHING ELSE, EVERYWHERE.** Reported twice — the first pass scoped it to the panel and left the paper on the tracked-changes convention, and the paper was the half being pointed at. The rule is at the BASE now (`.nego-ins`), so the sheet, the room, the contract tab, the panel and the counterparty's copy read the same; the panel's own copy went with it, because two rules for one fact is how they come to differ. **THE DELETION KEEPS ITS STRIKE** and that is not an inconsistency: colour alone can say "added", nothing but the strike can say "taken out".
- **THE COPILOT IN THE PANEL IS A BUTTON AGAIN (owner-asked 19 Aug 2026, REVERSING the 16 Aug line that stood here; and SINCE 25 Aug 2026 it opens a PAGE rather than the drawer — see EDIT WITH COPILOT IS A PAGE above):** *"change 'edit with copilot' to be a button which if clicked, it takes you to copilot and you can edit the entire clause."* It had become plain violet WORDS on the reasoning that a door and a label for one feature, twelve pixels apart, was the door doing the label's job badly — and the ground under that moved the same day the paper's highlight menu came off (above): the words then named the ONLY Copilot route on the page, and named it as something nobody could press. `.rl-cp-ai-note` is RETIRED (flag any mention). TWO ACTS in the panel now, and they are different SIZES, which is what makes both worth having: the ＋ writes here, the Copilot hands the WHOLE clause over and closes the panel behind itself; a highlight inside the panel's own editor still hands ONE SENTENCE, and the hint line under the buttons says so rather than leaving it to discovery. It goes STRAIGHT to the Copilot with no menu in between (`direct` at data-nego-ai-clause — a control narrowed to one action would raise a menu of one row, anchored on a button the closing panel has just hidden: the reported top-corner dropdown). Tests: f210 (11)/(12) and clause-door-verify 3d/7a/8c/8d reversed in place, 8d re-measured after a real press so the corner-dropdown report stays pinned.
- **A REDLINED CLAUSE IS MARKED IN THE MARGIN, NOT WASHED** ("keep the contract page white but add a thin redline on the right of the clause"). The amber tint and frame are gone; `border-right:3px solid #dc2626` says the same thing and costs the wording none of its width — on a document where most clauses are under negotiation, a wash marks nothing. **AND THE BOX IS THE SAME WHETHER OR NOT ANYTHING IS ON IT** (owner-asked 19 Aug 2026; this line used to claim the padding was kept "so the wording does not shift", and that was NOT true of the code beneath it): an unmarked clause had `padding:0` and no rule, a marked one `padding:12px 14px` and a 3px rule, so the first change on a clause slid its wording 14px right and its Edit pill 17px left. Measured both ways before it was touched. THE MARK IS NOW A BAR IN THE SHEET'S OWN MARGIN — `.rl-clause.is-changed::after`, absolutely positioned at `right:-18px`, outside the text column and in the white the page already has — so every clause has an identical box (`padding:0`, no border) whether or not anything is on the table, and the mark costs the wording nothing. A FIRST PASS RESERVED A 14px GUTTER ON EVERY CLAUSE INSTEAD, and redline-verify caught it in one run: the text stopped sitting evenly inside the sheet (54px left against 78px right), which on a DOCUMENT is a worse fault than the one being fixed. A mark in the margin belongs in the margin. **THE PILL IS PINNED, NOT CARRIED**: `position:absolute;right:0` on `.rl-clause-top` rather than `margin-left:auto` in the heading's flex row — equal boxes alone would align it, and pinning means no marker invented later (the linked-clause outline, the new-clause tint) can move it either. The heading reserves the width in the reader's own type scale. Tests: f210 (the rules), clause-door-verify section 12 (the pixels — one rail and one text column at 8px, 15px and 20px).
- **THE ASK TAGS HAVE COME OFF THE PAPER** ("remove the pills from the contracts"). Four on one heading pushed the clause's own name off its line. They were kept this long for ONE reason and it has gone: a settled change leaves the change column, and the tag was the only handle left on it — the PANEL is that handle now, naming every ask on the clause, live and settled, with its wording and its outcome. `rlAskTagHtml` / `rlAskRevealHtml` survive as builders with no caller on this canvas; negoDocHtml's badges are a different marker and are untouched.
- **AND THE REOPEN MOVED WITH THEM, OR THE REMEDY WOULD BE UNREACHABLE.** The tag's reveal carried the way back from a settled decision, and the accept guard refuses IN WORDS naming reopening as the way out. The two had to move together — a refusal whose stated remedy cannot be reached is worse than no remedy, which is the exact fault f208 exists for. It is in the panel's History rows now (`mayReopen`), on the same rules: settled only, our seat only, never PORTAL_MODE, never read-only.
- ABOUT TWENTY TEST CLAIMS NAMED THE TAGS and every one was REVERSED IN PLACE rather than deleted — f207, f208, f209, f37, f70, f93, f96, and four browser files. What each was really pinning is still true and still worth pinning; they are re-pointed at the surface that carries it now (the panel row, or `is-changed` on the clause).

## A CLAUSE YOU PROPOSED IS EDITABLE TOO (owner-asked 25 Aug 2026)

Off a screenshot of a payment-terms clause added from the playbook: *"standard
clauses added should be editable as well."*

**IT WAS THE ONE THING ON THE PAPER WITH NO WAY BACK INTO IT.** An
`insertClause` ask is not in the baseline, so `negoClauseById` answered null and
every editing door in the product stood down — the pencil was not drawn, the
card's Open was suppressed, the card's Edit fell back to a jump. A reader who
added a clause and wanted thirty days to read forty-five had to withdraw the ask
and add it again.

- **IT IS THE FUNNEL'S OWN REVISION FOLD, NOT A NEW ACT.** `negoFileChange`
  already revises in place when the same side files again on the same clause in
  the same round — that is what makes a second edit a revision rather than a
  rival — and an insert is no different. **`negoReviseInsert(c, clauseId,
  clause, opts)`** files the SAME clauseId back through the same funnel: the ask
  keeps its id, its author and its place, its previous wording goes onto
  `revisions[]` with its hash intact, and a new fingerprint is issued. Every
  guard the funnel carries — the desk rule, the review gate, the executed-wording
  freeze — applies unchanged, because none of them is repeated there.
- **IT ONLY EVER REVISES.** `negoInsertClause` mints a fresh clauseId every
  time; this one returns null unless there really is a pending insert of OUR OWN
  on that clause. Without that check a mistyped id would file a second,
  invisible clause into the agreement.
- **OUR OWN, AND ONLY WHILE IT IS LIVE.** Their proposal is answered, not edited
  — the mirror rule this page keeps everywhere — and a settled one is a record.
  Both fall through to the plain block, so nothing that used to draw stops.
- **THE PANEL SAYS AS PROPOSED, NOT AS IT STANDS** (`ng_cp_proposed` /
  `ng_cp_proposed_note`, both languages). A clause nobody has agreed to is not
  in force, and that heading is the one place the page would be saying it is.
  `negoClauseNowById` answers null for it, so every reading in the panel comes
  off the ask itself; the ＋ reads "Continue your draft", which is what the
  funnel will actually do.
- **THE EDITOR IS THE SAME EDITOR.** One branch in the `[data-nego-edit]`
  handler: the clause comes from the ask when the baseline has none, the seed is
  the ask's own body, and the save routes to `negoReviseInsert`. The two steps,
  the reason, the Skip, the fingerprint and every refusal are the same code
  either way. **The ask must be one of the ids the BLOCK carries** — the same
  wall as everything else there, so the editor can only open on wording the
  reader is already entitled to see.
- **A REPLACE THAT MATCHED THE WRONG FUNCTION COST AN HOUR.** The `standing`
  line this change edits appears twice in the file, and the first occurrence is
  in `negoLeadChange` — the edit landed there and the whole Negotiations page
  died with "isNew is not defined". Anchor a replacement on a neighbouring line
  that is unique, and read back the line numbers before running anything.

Tests: f210 (13) — 8 claims, **7 of them fail against the code of an hour
before**; clause-door-verify section 14 (7, browser — the pencil as reachable
pixels, the panel's heading, the editor seeded from the proposal, and the save
proved to leave ONE proposed clause carrying one revision).

## LETTING GO MEANS LETTING GO, AND LANDING IS NOT TRAVELLING (owner-reported 31 Aug 2026)

Two reports in one message, and each turned out to be a rule the product half
kept. `WORKORDER-redline-flow.md` carries all four items; N-1 (a note tied to a
change) is **NOT DECIDED** — three options were drawn, the owner rejected all
three, and nothing for it may be built.

**N-4 — THE ✕ IS THE TRIGGER, NOT THE CAUSE.** *"when I click the highlighted x
in the card, I am unable to highlight a sentence in the same clause and get a
copilot to edit again."*

- **REPRODUCED, AND THE MECHANISM IS THE BROWSER'S.** Letting a passage go took
  away the card and the mark and **left the browser's own selection standing** —
  and pressing the ✕ moves focus out of the box, at which point Chrome stops
  painting that selection. From the reader's chair nothing is selected; the
  document says otherwise. **A mousedown inside an existing selection in a
  contenteditable box starts a native DRAG OF THE TEXT rather than a new
  selection**, so the browser swallows the mouseup and this page's handler never
  runs. MEASURED: two mousedowns, one mouseup. **That clause only**, because
  that is where the stale selection is — which is exactly the qualifier in the
  report — and it clears after one press elsewhere, which is what made it read
  as intermittent.
- **`ceDetachPassage` RELEASES THE SELECTION, AND ONLY WHERE IT IS STILL OURS.**
  That function runs on every path that lets a passage go — a rebuild and a
  refusal included — so collapsing a selection the reader has just made
  themselves would be the same rudeness pointing the other way. Compared on the
  NORMALISED text, because ceSelection normalises and a live selection does not.
- **AND THE SILENT REFUSAL SPEAKS, which is the half that matters more.** A
  highlight this page could not place drew nothing and said nothing, so a
  gesture the product had decided against was indistinguishable from a page that
  had stopped working — this codebase's own most repeated defect. Had it been
  speaking, the first half would have been findable in seconds.
  **`ceSelectionRead` IS ONE READING WITH TWO READERS**: it answers the passage
  or the reason there is not one, and `ceSelection` is a thin wrapper so every
  existing caller is untouched. **Never two copies** — a second function working
  out "why not" beside one working out "what" is how they come to disagree about
  which passages are allowed. Three real reasons (across two sub-paragraphs;
  those words appear twice; some of those words are struck out and not in the
  draft), and **a click is not a refusal** — under three characters it answers
  nothing and the page stays silent.

**N-2 — LANDING ON A CLAUSE IS NOT A JOURNEY TO IT.** *"The contracts still
jumps around when you are trying to make edits. The contracts should stay firm
where it is unless you are scrolling."*

- **THE 31 Aug FIX WAS REAL AND WAS NOT THE ONLY CAUSE.** That one was the
  RESTORE — putting the reader back where they were, drawn as a glide. This is
  the other half, one function along: **`ceScrollToClause` wrote `scrollTop`
  BARE**, and `#ce-doc` is a `.nego-scroll` carrying `scroll-behavior:smooth`,
  so opening a clause was a **28-frame animated glide from the top of the
  contract down to it** — measured 0 → 728. The reader presses the pencil to
  edit one clause and watches half the contract fly past first.
- **BOTH CALLERS LAND RATHER THAN TRAVEL**, and neither is a journey: ARRIVING
  opens a full-window layer that did not exist a frame ago, so there is no
  position to travel FROM; MOVING TO ANOTHER CLAUSE re-seeds the draft and
  re-renders the paper first, so a glide would animate between two unrelated
  documents. Both go through `ceRestoreScroll`, so **there is one answer to
  "does the contract animate"** rather than one per caller.
- **THE STYLESHEET RULE IS NOT TOUCHED.** It is what makes the reader's own
  scrolling behave and what makes the negotiation page's `rlLinkFocus` read as a
  journey to its clause across a document that has not moved.
- **MEASURED AS FRAMES, NEVER AS A FINAL POSITION** — 28 distinct offsets
  before, 2 after. A probe that reads the offset once the dust settles passes
  against a page that visibly travels, which is the whole reason this claim
  lives in a browser file.

**N-3 — ONE SEARCH BOX, AND IT IS THE SHELL'S.** *"remove the search open text
field in the contracts page."* M-5 did this on Negotiations five days earlier
and its note said Contracts kept its box; **that is REVERSED IN PLACE by the
owner naming the other seat**, and the claim is simpler for it — it is no longer
a question about seats at all, so the guard goes rather than flipping. A
condition false on every seat is one the next reader has to rule out.

- **THE FTS WIRING IS NOT DELETED** — every handler already guards on the
  element existing, so there is no second code path to keep in step and the
  full-text search behind the shell's own box is untouched.
- **A STALE QUERY NARROWS NOTHING, IN THE ONE READING.** The shell bar writes
  `regState().query` and then navigates, so a value really can be left on the
  state, and a page narrowed by a control nobody can see has nothing on screen
  to press to widen it. Ignored in `regFiltered` rather than cleared in a
  renderer another path can go around.
- **AND WHAT COUNTS AS NARROWED AGREES WITH WHAT NARROWS.** `regRowsHtml`'s own
  "is anything filtered" reading drops the query too: two answers to one
  question is how a Clear button comes to offer itself over a list nothing
  filtered.
- `reg_search` and `reg_search_ph` are STALE as visible text on both seats, left
  INERT in both dictionaries.

**AND A CHECK THAT STAGES ITS OWN GROUND CANNOT BE BROKEN BY THE SECTION ABOVE
IT** — paid twice in one day. clause-editor-verify's new section inherited a
draft that sections 18–22 had typed into, applied to and filed against, so its
drag found no passage long enough; it opens its own untouched clause now, the
same correction 18j needed that morning. **And a probe's own sentinel is not
data**: filming an arrival starts before the layer mounts, and counting those
frames as scroll offsets made an instrument artefact look like a third step of
a journey.

Tests: f245 (22) and (23) (**every claim fails against the parent**, three
claims of f245 (19)/(20)/(21) REVERSED IN PLACE — the last one now says the
paper is NEVER assigned bare, where it used to allow exactly one), f263 (3)
(reversed onto both seats, with the old Contracts CONTROL becoming the second
half of the claim), clause-editor-verify sections 23 and 24 (**driven with a
real mouse, because a scripted Range fires no mousedown and passes against the
broken build — against the parent they report `down 2 / up 1` and `28 distinct
offsets`**), contracts-page-verify section 16 plus six claims re-pointed from
six controls to five.

## A SUB-BULLET STICKS, AND A TAGGED NAME IS A PERSON (owner-asked 2 Sep 2026)

Four things in one message off four screenshots.

**THE BAR IS A FIFTH BIGGER.** *"increase the size of the top bar features by
20%. They are currently too small to read or understand some of them."* Every
measurement is its old value times 1.2 rounded to a whole pixel — this product
draws no fractional size — and every TYPE size moves to the nearest rung of the
ladder rather than the exact multiple (13 → 15, 12 → 14, 9 → 11), because a size
off the ladder is what the 22 Aug sweep spent 865 replacements removing.
**THE NINE ICONS SCALE FROM ONE DECLARATION**: all are authored 15px wide with a
viewBox, so `width:18px` is exactly 1.2 on each, and `height:auto` stops the pen
— the one that is not square — being stretched to fit. It costs the contract
nothing: the bar sits in the LEFT column's own head and wraps on content.

**A SUB-BULLET STICKS.** *"the dented bullet point ... does not stick"* — typed
under its parent it read as a sub-bullet in the box and came back as a sibling
the moment the clause showed its marks.

- **THE DEPTH WAS THROWN AWAY AT THE TEXT PROJECTION**, and nothing downstream
  could put it back: the redline is drawn from OPS, the ops carry text, and
  every bullet at every level projected as `• `. **A nested DECIMAL list has
  always carried its depth** (2 → 2.1 → 2.1.3, because that is how a legal
  document numbers its clauses); a nested BULLET list carried none. So this is
  an asymmetry closed, not a new idea.
- **• ◦ ▪ IS WORD'S OWN LADDER and this product already read all three** —
  `RL_MARKER` lists them among the true marks — so the redline splits a
  sub-bullet into its gutter with nothing added there. Past the third level the
  glyph repeats: a marker a reader cannot name is worse than one that is reused.
- **ONE READING, `_listMark`, AND BOTH WALKS ASK IT.** `richToText` and
  `_lineUnits` each carried their own copy character for character, and they
  MUST agree — `richFromTextEdit` verifies its merge by projecting the result
  against the text that was agreed, so a marker differing by one glyph would
  abandon the merge on **every list in the document**.
- **THE INDENT IS READ OFF THE GLYPH** (`redlineMarkerDepth`), not carried in a
  second field nobody would keep in step, and it is presentation only —
  `margin-left`, never padding, because padding-left is what the hang itself
  uses and adding to it would pull the marker out of its gutter. Both sheets.
- **WHAT IT COSTS, said out loud:** a clause containing a NESTED bullet list
  projects differently from today, so a change filed before this whose
  `oldText` was the old projection no longer matches a fresh one — which
  `negoMeasuredAlike` reads as *measured differently*, the looser direction.
  **Fingerprints are untouched**: they are over the stored bodyHtml, never a
  fresh projection.

**AND THE SWEEP FOUND ONE MORE.** *"review this bug and any other bug related to
editing like bullets, fonts etc."* Every tool was walked through storage: bold,
italic, underline, strike, both lists, headings, tables, quote, the drafter's
ink, highlight and size all survive; a style attribute, an unknown class and two
classes on one span are refused (the last deliberately — applying a colour and
then a size makes two NESTED spans, which is what the browser side produces).
**The one real defect is `<li><p>a</p></li>`** — what a paste from Word, Docs or
a model's answer routinely produces — which projected as a line holding nothing
but the bullet and then a second line holding the wording. **Fixed in the
MARKUP, not in the walks**, for the same reason as above; a second paragraph in
an item becomes a `<br>`, which both walks already read as a second line.

**A TAGGED NAME IS BOLD AND CARRIES THE PERSON'S OWN INK.** *"every name having
a different color code."*

- **IT WAS NEITHER, AND THE CAUSE IS THE CLOTHES-FOLLOWING-THE-BUILDER FAULT
  THIS FILE RECORDS THREE TIMES.** `.rl-np-at` was scoped to `.redline-page`;
  the Chat drawer is the SHELL's panel and a body-level sibling, so the tag drew
  coloured on the page and plain in the drawer. Unscoped now, beside every other
  `.rl-np-*` rule. Measured against the parent: weight 400, in the body's ink.
- **THE PALETTE IS THE DRAFTER'S OWN INKS, borrowed rather than invented**,
  because the reason those were chosen is the reason that matters here:
  `RICH_MARK_INKS` carries **no green and no red** on purpose — on the paper
  green already means inserted and struck red means deleted. They have night
  answers already, so no override is owed. **Grey is left out**: at night it is
  this panel's own secondary shade.
- **DETERMINISTIC AND KEYED ON THE VISIBLE NAME**, folded — not the id. The id
  is the sturdier identity and is right for a RECORD; this is a scanning aid,
  and a counterparty contact carries no id at all, so keying on one would split
  some people into two colours and leave others uncoloured. **Colour is never
  the only carrier**: the weight and the @ say it is a tag, and with four inks
  two colleagues can share one — the NAME identifies them and always did.

**AND THE PERSON TAGGED IS TOLD.** *"informed via email and also with a mark on
the symbol."* This REVERSES *"tagging still notifies nobody"*.

- **`POST /api/contracts/:id/mention` — KEYS IN, ADDRESSES NEVER.** A body
  carrying one is refused outright rather than ignored, so a caller cannot come
  to believe it works. **TWO POPULATIONS, TWO PLACES TO LOOK, and neither is the
  body**: a colleague is a row in `users`; somebody on the other side is not a
  member at all and is looked up in the STORED contract — its signing route,
  then the counterparty contact — which is where the chase route reads its one
  address. **The NAME travels beside the id as a KEY**, because the counterparty
  contact has no id of any kind and a route keyed on ids alone would quietly
  never reach the commonest person on the other side.
- **A COLLEAGUE WHO COULD NOT OPEN IT IS NAMED RATHER THAN WRITTEN TO** — the
  review-request route's own reasoning — and nobody is told about their own note.
- **THE LINK IS ONE THE READER CAN OPEN**: the in-app link for a colleague, the
  standing share link for the other side, and nothing at all where there is
  none.
- **ONE DOOR, `negoNotifyMentions`, TWO CALLERS** — the panel's send and the
  note dialog's — and the answer rides the ONE confirmation the act already
  draws rather than a second box. Awaited, because "sent means sent"; silent
  where nobody was named or there is no route.
- **THE MARK IS `#hdr-chat-dot`**, the bell's own shape and the bell's own
  amber, because both mean work waiting on this reader and a second colour would
  be a second vocabulary. It counts NOTES THAT NAME YOU, not a busy thread, and
  **reads without writing** — `c.changes` raw, never `negoChanges`, which runs
  `negoInit` and would start a negotiation on any contract merely counted. Seen
  is the panel's own per-browser store, so opening Chat clears it exactly as
  reading a thread clears the card dot. **It counts THIS contract only**, said
  out loud: the door opens this contract's conversation, and a number including
  others would press through to the wrong one.

Tests: f266 (37 — **23 of its 29 checks fail against the parent**),
clause-editor-verify section 26 (the bar measured as computed pixels and the
sub-bullet's indent measured as geometry after a real filing),
notes-two-rooms-verify section 7 (**the tag's weight and colour read in the
DRAWER — the parent reports 400 and the body's own ink, which is the screenshot
— plus the mark driven on and off**).

## THE CHG PILLS ARE GONE, AND ONE READING TOOK THE ⋯ WITH IT (owner-reported 1 Sep 2026)

Two of five reports in one message, and they are unrelated to each other except
that both are a control naming a change where nothing needed naming.

**THE PILLS: *"delete ever having the CHG pills on the screen as show in the
highlighted area."*** The clause editor's readings row carried a chip per ask on
the clause plus a "+ Something of my own", and this file's own entry of 27 Aug
records them arriving there from a full-width strip above the paper — moved to
give the contract its pixels back. The owner has now looked at them in place and
taken them. **NOTHING IS LOST, which is the condition on removing a control**:
the page is about ONE clause and its name is two rows above in the crumb; which
ask the box is measured against is the pencil's own business and is what the
marks on the paper say; and "+ Something of my own" was already recorded as one
press of **Discard**, which is why it went on 27 Aug's own reasoning rather than
this one's. `ceCtxChipsHtml`, `data-ce-focus` and the whole `.ce-chip` block are
DELETED — not stubbed — because none of them was exported and there is no door a
third caller could bring one back through. `ce_something_of_my_own` and
`ce_on_this_clause` are left INERT in BOTH dictionaries — a key removed from one
and not the other is how a screen ends up half-English. Tests: clause-editor-verify 17m/17n REVERSED IN PLACE and
measured as PAINT — nothing on that row names a change — because a class check
would pass on a row that still drew one under another name.

**THE ⋯ MENU: *"I do not recall what I clicked on but the feature in image 5
appeared again when it is supposed to be completely eliminated from the internal
side of the platform."*** The feature was the CLAUSE PANEL, shut on our seat on
30 Aug. It came back through the ⋯ menu's **"Jump to the clause"** row, whose
guard tested for `data-rl-edit=` alone — the attribute the card's Edit carried
*until* 30 Aug, when our seat's Edit became `data-rl-cp-editor-row`. So on every
card with an Edit the guard saw a bare face, drew the duplicate row, **and that
row's handler opened the retired panel.**

- **ONE READING, `rlEditorTakesIt(side, opts)`, AND FOUR ASKERS.** *Does the
  clause editor page take this clause* was written out four times — in the card
  renderer, in the paper's pill, in the ⋯ — and **not at all in the
  `[data-rl-edit]` handler**, which is the one place it decides where a press
  lands. That is the shape this rulebook warns about in its own words: the
  drawing may differ between surfaces, the READING never may.
- **THE GUARD READS BOTH DOORS.** `data-rl-edit=|data-rl-cp-editor-row=` — the
  same verb, either destination — so the row draws only where the face really
  is bare, which is what its own comment always claimed.
- **BOTH HALVES, OR NEITHER IS A FIX.** The fallback row still draws
  deliberately on a card with no verbs at all, so a guard alone would have left
  that press opening the panel; the handler stands down first where the editor
  takes the clause.
- **FOUR NETS WERE PASSING ON THE BUG**, and all four for one reason: they
  reached for `data-rl-edit=` and found the duplicate row. f161 and f192 are
  re-pointed at either door; f89 is re-staged on `page({ noEditor: true })`, the
  seat where Edit really is the jump; and **parity-verify's whole check 9 had
  been measuring the clause-panel route on our seat through the very control
  the owner reported** — its four panel claims are REVERSED IN PLACE onto the
  seat that still has that route, its landing claims re-pointed at `is-linked`
  (which both seats set through `rlLinkFocus`) rather than at `rl-arrived`
  (which is `rlJumpToClause`'s own flash and only one seat sets), and the
  "the two seats agree" list narrowed to what the owner ruled should agree.
  **A green tally is not a net; find out what each check is actually pressing.**
