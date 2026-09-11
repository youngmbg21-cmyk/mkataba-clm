# COMMENTS, ROUND THREE — REPORTS OFF ROUND TWO'S FIRST USE

**WRITTEN 11 Sep 2026, late evening, minutes after round two went to main.**
The owner's instruction, in their own words: *"Add the following to a work
order and do not code yet."* And a standing instruction for the build: *"Ask
how SAP would approach these issues when you are building them because in
some cases they are nonsensical especially since I did not ask for those
particular changes."*

**THE GATE ON ALL OF IT: nothing here is coded until the owner says go.** When
they do, THE SIX QUESTIONS are run out loud on every item below — the owner has
said some of what they are seeing was never asked for, so each change lands
with one sentence on what serious contract software does with that shape and
what SAP's design would spend on it, BEFORE it is built.

## THE REPORTS, VERBATIM

1. *"Image 1, highlighted areas show what happened after I made an edit. The
   card in the notes is not elegant."* (Image 1: the clause editor after a
   filing on CHG-006; the drawer's pin reads *CHG-006 · Clause 3 · Pricing and
   Payment* with the filed line squeezed into a one-word-per-line column
   beside Skip — "CHG Skip 006 filed . add a note" — over an empty card body,
   then the Internal / External switch.)
2. *"I also think it is best to blur the background when the notes panel
   appears but only in the negotiate page."*
3. *"Also when I click apply on copilot edit, i should not have to go back and
   click the pencil again to close the edit."*
4. *"Image 2, internal and external buttons should be the same equal size."*
   (Image 2: the pin's switch, Internal filled and wider than External.)
5. *"Image 3 is from a previous card which is how the note card should look
   like but without the highlighted comments. Currently I am getting image 4
   which is just an empty card."* (Image 3: the HIGHLIGHT pin — reference,
   the quoted words in italics, the switch — with the *Comment on these
   words* caption the owner does not want. Image 4: the FILED pin — reference,
   the wrapped filed line beside Skip, an empty body, the switch.)
6. *"Ask how SAP would approach these issues when you are building them
   because in some cases they are nonsensical especially since I did not ask
   for those particular changes."*
7. *"Image 5, the highlighted area is not necessary when I am simply asking a
   question. When I want to edit then include it as you do already."* (Image
   5: Copilot's answer to "what does this means?" under Ask Copilot, followed
   by the three-row reading — OUR PLAYBOOK · WHAT WE SETTLED BEFORE · THE
   WORDING — and then "Copilot's answer" card with the quoted words.)

8. *"Image 1, when i highlight several sentences without click the pencil
   first, i do not get the drop down options to choose from. This should be
   fixed."* (The clause editor page — Exit at the top right, the three
   reading tabs — open on some other clause; the reader has dragged over
   clause *9. Counterparts and Electronic Signatures*, heading and body, on
   the editor's own paper. No menu.)

## WHAT EACH ONE LOOKS LIKE FROM HERE (to be MEASURED before a line moves)

**1 and 5 — THE FILED PIN SHOULD LOOK LIKE THE HIGHLIGHT PIN.** Today
`rlNpPinHtml` draws one shape for two pins: the highlight pin carries the
quoted words and (since round two) no caption; the filed pin carries a lead
line ("CHG-006 filed · add a note") and NO quote, so its body is empty and the
lead, given `flex:1;min-width:0` beside Skip, wraps to a word a line. The
owner's picture of the right card is image 3 minus the caption: reference ·
the quoted wording · the switch. So a FILED pin quotes what the change did —
the change's own `summary`, or the words that moved read through
`rlChangeWordingHtml` with `changedOnly` (the one builder for "what this
change proposed") — in the same italic `<q>`, and the "filed · add a note"
lead goes (`ng_np_pin_filed`, `ng_np_pin_revised` stale; the way out stays as
Skip). The general practice is the SAP one already in this rulebook: the
reader's own act read back to them is not a sentence, and a card is one
shape wherever it is drawn. THE SIX QUESTIONS, out loud: Q2 — the cheapest
channel for "this was just filed" is the reference itself in the pin's head
with the change column already showing the new row twelve pixels away; Q5 —
one builder, one shape, two callers.

**2 — BLUR BEHIND THE DRAWER, ON THE NEGOTIATE PAGE ONLY.** This REVERSES a
ruling: the notes face draws no scrim by the owner's word of 27 Aug 2026
("do not shade the contract, it has to remain active") and applyPanelLayout
says so. The owner now asks for a blur — on the negotiation page only, not
the contract room, not the clause editor (say which they mean by "negotiate
page": the negotiation page, or also the clause editor which is where image
1 was taken). Build: `panel-scrim` takes a `backdrop-filter` blur class when
the face is notes AND `state.view === 'redline'`; the scrim's outside-press
close comes with it (the rulebook's own reason the notes face had none), so
say so before building — a blurred page you can still press through is two
statements. SAP's answer to this shape: a side panel that needs the page dimmed
is a modal task; one that does not is a docked panel. The owner should be told
that in one sentence and asked which the notes drawer is on that page.

**3 — APPLY ENDS TYPING.** Today a Copilot card's Apply moves the wording into
the box and leaves typing ON; the reader presses the pencil to see the marks.
The owner wants Apply to close the edit — the box drops out of typing and the
clause shows its marks, as a playbook standard's Apply already does ("wording
that arrives from somewhere else drops out of typing so the marks it made are
the first thing seen" — ceReplacePassage's own note says that rule is untouched
for cards). Measure first: which Apply the owner pressed (a passage card
through ceReplacePassage keeps typing ON by design — `keepView:true`; a whole-
clause card through ceApply drops out). The likely change: the passage card's
Apply stops passing `keepView` — one line — and the reader's own typing keeps
it. Q6: after Apply the clause shows its marks and the pencil is the way back
into typing, which is the page's standing posture.

**4 — TWO EQUAL HALVES.** `.rl-np-pinroom button` sizes to its word, so the
filled half is wider than the other by the width of "Internal" over "External"
plus the bold. Equal halves: `flex:1 1 0;text-align:center` on both, weight
held constant across the two states so the lit half does not grow (reserve
the bold width, the tab row's own trick). Measured equal in the browser file.

**6 — THE STANDING INSTRUCTION.** Recorded above the reports. For every item
in this order the build says, before coding, what the general practice is and
what SAP would spend on it; and nothing is added that the item did not ask
for. The owner's "nonsensical" points at things arriving that they never
asked for — the round-two pin's lead line is one; the reading list under an
answer (item 7) is another.

**7 — NO READING LIST UNDER A QUESTION.** `ceAsk` attaches `read` (the three
rows: playbook, precedent, the wording) to every answer. Under the ASK verb the
owner wants the answer alone; under EDIT the rows stay. One line in `ceAsk`
(`read: asking ? [] : read`) and `ceTurnHtml`'s asking branch draws no list.
Q2: the rows answer "what does this rest on" — a question about wording rests
on the answer's own words; the playbook and precedent rows matter where
wording is about to move.

**8 — THE EDITOR'S PAPER OFFERS ON EVERY CLAUSE, NOT ONLY THE ONE IN THE
BOX.** In the clause editor the highlight reading (`ceSelectionRead`) answers
only for a range inside `#ce-clausebody` — the typing box of the clause the
page is open on — and the mouse-up handler asks nothing else; so a drag over
ANY OTHER clause on that canvas (image 1: clause 9, while the page is open on
another) draws nothing and says nothing. The negotiation page's paper offers
the three verbs on any clause; the editor's paper should too, and both should
read the same way. Two things to build: the editor's mouse-up hands a drag
outside the box to the PAPER'S offer (`rlPaperSelOffer`, through the editor's
own door — Ask / Edit re-open the page on THAT clause with the words in hand,
as the negotiation page does; Comment opens the drawer on those words); and a
selection that takes the clause's HEADING along (the owner's drag began on
"9. Counterparts…") is read as the clause's words with the heading left out,
on both papers (the round-two overshoot reading, `_negoNodeText` on
`.rl-clause-top`, is the same question one clause earlier). Q5: one offer, one
reading, two papers — the editor's canvas already mounts `redlineDocHtml`, so
the negotiation page's handler is the model and the editor must not grow a
second one. Measured with a real drag over a non-edited clause, heading
included, in round-two-comments-verify's own shape.

## THE OWNER'S ANSWER ON ITEM 2 (later the same evening)

*"Slight blur the negotiate background so that you can still see the writing
in the contract. And pressing the blurred area should close the drawer."*
- A SLIGHT blur — the contract stays readable through it (measure: a small
  `backdrop-filter: blur(...)` with no darkening that would fail the wording's
  contrast; the wording must still be legible in the browser file).
- The blurred area is a door: pressing it closes the drawer, the alerts panel's
  own rule. The 27 Aug ruling (no scrim, no outside-press close on the notes
  face) is REVERSED for this page and stays for every other.
- "The negotiate background" is read as the NEGOTIATION PAGE. The clause
  editor is not included unless the owner says so.

## ORDER WHEN THE OWNER SAYS GO

7 (one line), 4 (one rule, measured), 1/5 (one builder, the filed pin quotes
the change), 8 (the editor's paper offers on every clause, heading tolerated),
3 (measure which Apply first), 2 (needs the owner's answer: which page, and
whether the blur may close the drawer on an outside press).

## STILL WAITING FOR

The owner's go. Item 2 is answered (above); whether the clause editor gets
the blur too is still theirs to say.
