# COMMENTS, ROUND TWO — REPORTS OFF THE FIRST DAY'S USE

**WRITTEN 11 Sep 2026, the evening the comments system landed on main.** The
owner's instruction, in their own words: *"Add these to a work order and wait
for more."*

**THE GATE ON ALL OF IT: nothing here is coded until the owner says go.** More
reports are expected; they are appended below as they arrive. When the owner
says go, the build starts from the latest `main`, runs in the order set below,
and each item lands with its nets and one plain-English summary.

## THE REPORTS, VERBATIM

1. *"When i highlight the whole area or multiple lines, I am unable to edit
   with copilot."* (Image 1: the clause editor on *2. Term and Termination*;
   every paragraph of the clause is selected; the rail shows Copilot's answer
   but the passage was not attached and the softer/firmer chips act on nothing.)
2. *"Also, i get a red vertical line even though all i did was go into the
   clause but did not edit anything."* (Image 2: the negotiation page after
   leaving the clause editor; the 3px ruby bar in the left margin stands
   against clause 2, which carries no filed change.)
3. *"Image 3, change to simply internal vs external."* (Image 3: the pin above
   the notes box says *For your team* / *For AIT Worldwide Logistics Norway
   AS*; the long name overflows the pin.)
4. *"Image 4, the number is outside the edges of the circle."* (Image 4: the
   numbered comment marker in the paper's left gutter; the figure is drawn
   below and to the right of the disc.)
5. *"Also, when i click the number the notes panel correctly appears but it
   needs to collapse when i click the number again. Make this a rule for
   sliding panels. If you click an area that makes a panel appear, then the
   same location should also be able to collapse the appearance."*
6. *"Image 5 should also be internal vs external."* (Image 5: the same pin
   with External lit; the same two labels.)

## WHAT EACH ONE LOOKS LIKE FROM HERE (to be MEASURED before a line moves)

**1 — A selection across paragraphs is refused.** Two readings refuse it
today, on purpose: the editor's own `ceSelectionRead` answers "across two
sub-paragraphs" as the reason there is no passage (N-4, 31 Aug), and the
paper's offer stays silent where a drag crosses a clause. The owner's use is
the ordinary one — select a clause whole, ask Copilot about it — so the
refusal is wrong for Ask Copilot even where it stays right for *Replace this
passage* (which cannot splice across two blocks). The likely shape: Ask
Copilot attaches the whole selection as words (several paragraphs), the
answer card records it, and only `ceReplacePassage` keeps the one-block wall
with its sentence. The owner rules whether *Comment* takes a multi-paragraph
quote too (the anchor's `quote` is one string; the marker would sit on the
first paragraph).

**2 — The ruby bar marks a clause that has no change.** The bar is
`.rl-clause.is-changed::after`, drawn where the canvas believes the clause
carries a change. The editor mounts the same canvas with `opts.live` (the
unfiled draft as a body), and on the way out the page below is repainted.
Hypotheses, in order: the seed draft equals the standing wording and is still
treated as "changed" by the live seam; the blur pull on exit filed a
formatting-only or no-op change that the funnel should have refused; or the
repaint on close keeps a class from the editor's own paint. Measure: open the
editor on an untouched clause, exit without typing, read `c.changes` and the
clause's classes. If a change was filed, that is the defect and the funnel's
no-op guard is where to look.

**3 and 6 — The pin's two labels.** `ng_np_for_team` / `ng_np_for_them` on
the pin (`rlNpPinHtml`). Change the two words to *Internal* / *External*
(and the Swedish pair), matching the drawer's own tabs above them, so the
switch and the tabs say one thing. The other side's name stays where it
already is: the box's placeholder ("Add a note for {who}…") and the tint.

**4 — The marker's figure sits outside its disc.** `.rl-note-mk` in the
negotiation sheet. The disc is drawn and the number is not centred in it —
most likely a line-height or the `--doc-scale` multiplier reaching the disc
but not the text, or the reverse. Measure the disc box and the glyph box on a
rendered page at 100% and at a stepped text size; the fix is one rule, and
the browser file pins the relation (glyph inside disc, both sizes).

**5 — A door that opens a panel also closes it.** Today the marker press
calls `openNotesPanel(cid, chId, {force:true})`, and `force` is what stops
the toggle. The rule the owner asks for already exists for the bell, the
activity door and the Chat door ("pressing Chat again shuts it", 10 Sep); the
marker is the one door that was written to open only. The change: the marker
press asks the same scope question (face + contract + change) and shuts the
drawer where it is already open on that thread. **THE RULE, to land in
CLAUDE.md when built**: *every press that opens a sliding panel closes it on
the second press at the same place; `force` is for a filing that must land in
the drawer, never for a door a person presses.* Sweep the other openers
(`data-rl-note-open`, the card's Notes row, the counterparty's Notes row in
More, the queue tab, the clause panel's pencil) and make each answer the same
question; say which ones already did.

## ORDER WHEN THE OWNER SAYS GO

3/6 (two words), 5 (one door and a sweep), 4 (one rule, measured), 2 (find
the cause first), 1 (needs the owner's ruling on Comment).

## STILL WAITING FOR

More reports from the owner. Nothing above is built.
