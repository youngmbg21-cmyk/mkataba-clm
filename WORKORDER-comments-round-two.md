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

### The second batch (same evening)

7. *"Image 1, when you click add note, these cards should disappear."*
   (Image 1: the pin — *Clause 4 · Independent Contractor*, the quoted words,
   the room switch — stays above the box after Add note has posted.)
8. *"Image 2, remove this area."* (Image 2: the three-line caption *Comment
   on these words* at the pin's right, between the clause name and Unpin.)
9. *"Another feature, when i simply want to comment, i do not need to click on
   the pencil first. I can simply highlight a word and the drop down of ask
   copilot appears along with comment."*
10. *"The other new rule would be ask copilot simply allows you to ask a
    question but not edit. To edit, there should be a third option saying Edit
    with copilot which will then give the option to edit with copilot at which
    point after you edit you can apply."*
11. *"I also want to change another process. When you click the pencil, it
    allows you to edit manually or with copilot but you can still edit with
    copilot without having to click the pencil. You simply highlight what you
    want and it gives you the 3 options and you can click edit with copilot."*

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

**7 — Add note spends the pin.** Today the pin is dropped only on Unpin, on a
filing door's resolve, or when the drawer closes; a plain Add note under a
highlight pin posts and leaves the pin standing. The change: a successful
Add note (either room) calls `rlNotesUnpin` — the posted note now carries
the words, so the pin has nothing left to say. The pin raised by the PENCIL
already resolves on Add note (f302 (2)); this makes the highlight's pin do
the same. The drawer then shows the new note in the list with the box
cleared.

**8 — The caption goes.** `ng_np_pin_words` (*Comment on these words*) is
drawn between the clause name and Unpin on a highlight pin and wraps to three
lines in the drawer's width. Remove it from `rlNpPinHtml`; the quoted words
underneath say what the pin is. Both books keep the key inert. Refusal 2 in
reverse: this is a caption coming OFF, said here rather than done on the way
past.

**9 — Comment without the pencil.** On the NEGOTIATION page's paper a
highlight already offers Ask Copilot · Comment (`rlPaperSelOffer`, built
today). Find out which screen the owner was on when it did not: the clause
EDITOR offers the pair on its own canvas; the DOCUMENT tab offers Simplify ·
Ask Copilot and was left alone by the 11 Sep ruling ("you cannot ask copilot
or comment whilst in the document page"). If the offer failed on the
negotiation page it is a defect (measure the silence cases: front matter, a
drag that starts outside the clause, a selection across two clauses — item 1
again). If the owner means the Document tab, that is a change to the ruling
and needs their word.

**10 and 11 — THREE OPTIONS ON A HIGHLIGHT, and the pencil is no longer the
only way into Copilot's editing.** The offer becomes *Ask Copilot · Comment ·
Edit with Copilot*, on the negotiation paper and in the editor:
- *Ask Copilot* is a QUESTION about the words — the rail answers, the
  passage is recorded on the answer card, and NOTHING offers Apply (no
  softer/firmer chips that rewrite, no Replace). Today the Copilot path and
  the edit path are one and the same (attach, ask, Apply into the box); this
  splits them by the verb the reader pressed.
- *Edit with Copilot* is what today's Ask Copilot does: opens the clause
  editor with the words attached (`opts.passage` → `ceAttachWords`), typing
  on, the rewrite chips drawn, Apply live. Reached from a highlight with no
  pencil press — the pencil stays as the door that opens the editor on the
  whole clause for manual or Copilot editing.
- *Comment* is unchanged.
Questions for the owner before building: (a) in *Ask Copilot* mode, may the
reader still switch to editing from the rail (a button on the answer card,
"Edit with this"), or must they re-highlight and choose the third option?
(b) On the counterparty's page the offer stays Comment alone (they have no
Copilot). (c) The rule for CLAUDE.md: *a highlight offers three verbs; the
verb decides whether Copilot may touch the wording.* Refusal 5 (one door):
Edit with Copilot is not a second door onto the editor — it is the pencil's
door pressed with a passage in hand, through the same `rlOpenClauseEditor`.

## ORDER WHEN THE OWNER SAYS GO

3/6 (two words), 8 (one caption off), 7 (the pin spends on Add note), 5
(one door and a sweep), 4 (one rule, measured), 2 (find the cause first),
9 (find the screen first), 10/11 (the three verbs — needs the owner's answer
to (a)), 1 (needs the owner's ruling on Comment across paragraphs).

## STILL WAITING FOR

More reports from the owner. Nothing above is built.
