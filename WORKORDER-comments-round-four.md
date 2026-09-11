# COMMENTS, ROUND FOUR — TWO REPORTS OFF ROUND THREE'S FIRST USE

**WRITTEN 11 Sep 2026, late night, after round three went to main.** The
owner's instruction, in their own words: *"ADD THESE TO A WORK ORDER."*

**BUILT overnight on the owner's "Start from the latest main. Fix all of them in an autonomous overnight work session."** All eight items landed; the three open choices were taken as this order proposed (blur off with no outside-press close; no delete of a root with replies, admin not widened; the note comes at Save) and said in the summary. Record: CLAUDE.md (COMMENTS, ROUND FOUR), docs/MAP-HISTORY.md, BUGLOG.md; nets f304 (10), round-two-comments-verify I1–I6.

**THE GATE THAT STOOD BEFORE: nothing here is coded until the owner says go.** When
they do, the standing instruction of round three applies: for each item, say
what the general practice in contract software is and what SAP's design would
spend on it, before building, and add nothing the item did not ask for.

## THE REPORTS, VERBATIM

1. *"Image 1, you should be able to reply on any comment not just the original
   one."* (Image 1: the Internal room on a change. The root note by Young
   Mbagaya — *@John Wayne what do we do here?* — carries Reply and Done; the
   reply under it, *send it home*, carries nothing.)
2. *"Image 2, you should have the option to delete a note so add a delete next
   to done."* (Image 2: the External room, two notes by Young Mbagaya on
   Clause 4 and Clause 7, each with Reply and Done and no way to remove it.)


**Added later the same night** (*"ADD these too"*):

3. *"Image one, remove the blurry background please (reversal of what i asked
   before)."* (Image 1: the negotiation page with the Chat drawer open; the
   contract behind it blurred.)
4. *"Image 2, when i click on a number, it should take me to the note wherever
   it is. Currently it just opens up the notes panel but does not take you
   directly to the reference note."* (Image 2: the clause editor's paper, the
   marker ② beside Clause 2, and the drawer open on Chat's Internal room
   showing a Clause 1 note.)
5. *"Image 3, something has broken because when i highlight and comment, the
   number for the comment does not appear anymore."* — CORRECTED by the owner
   the same night: *"the problem is that there is a delay before it appears or
   you have to refresh the page. It should appear immediately."* (Image 3:
   the clause editor; a new note on Clause 8 — *Okay then*, 22:43 — is on the
   drawer's list with its quoted words, and the paper beside it shows no
   marker at Clause 8 yet, while ⑤ still sits at Clause 7.)
6. *"iMAGE 4, suggest deleting does not work. You should be able to click and
   it essential redlines the selected sentence or word."* (Image 4: the clause
   editor's rail, a passage held under SELECTED · CLAUSE 3, the *Suggest
   deleting* button under it.)
7. *"Image 5, when i click apply, this is a redline and it should come with
   the notes panel so i can enter my notes."* (Image 5: a Copilot card's
   Apply; the paper beside it shows the struck and inserted wording.)

8. *"the last one, when you click on any of the option on the drop down, the
   cursor should take you to the entry field in copilot or notes entry
   section. You should not have to click into them"* (Image: the clause
   editor; a highlight on Clause 9 with the three-row menu open beside it;
   the rail on the right holds the words under ASKING ABOUT · CLAUSE 9 and
   the empty box *Ask about these words…* below, with no caret in it.)

## WHAT EACH ONE LOOKS LIKE FROM HERE (to be MEASURED before a line moves)

**1 — REPLY ON ANY NOTE.** Today the note row draws Reply and Done only where
the row is a ROOT (`ctx.root` in the row builder); a reply row draws no acts
at all, and the reply box is opened by the root's key. The general practice
(Word, Google Docs, the review tools SAP's own UI follows) is that a thread is
FLAT: a reply on a reply joins the same thread under the same root, in time
order, and never nests a level deeper. So: the Reply button is drawn on every
note the reader may write under; pressing it on a reply opens the box under
THAT note (where the reader is looking) but posts with `replyTo` = the ROOT's
key, so `negoNoteThreads` keeps one root and one list and the Word export's
threading (`commentsExtended.xml`, replies under their root) is unchanged. Done
stays on the root only — it settles the thread, not one message. Their page's
aside draws the same row builder and gets it by construction. Q5: one row
builder, one reply box, one posting path (`rlNotesSend` with `replyTo`).

**2 — DELETE BESIDE DONE.** The act exists in the model and has no door in the
drawer: `negoDeleteNote(c, ch, msg)` (js/negotiation.js) removes a note of
YOUR OWN that has NOT yet reached the other side (`negoNoteDelivered` refuses
with `ng_note_sent`; another colleague's note refuses with
`ng_note_not_yours`), writes an audit line, and touches nothing else. Three
things to say to the owner before building, because the rulebook already rules
on them:
- A note that has been DELIVERED down the link cannot be deleted — it is on
  the other side's screen and in their record; the general practice is that a
  sent comment is resolved (Done) or answered, never unsaid. On an EXTERNAL
  note that has gone, Delete is greyed with that reason on the hover (grey
  where HaTi can know before the press), never hidden.
- Only the author deletes (the model's own wall); an admin is not widened here
  unless the owner says so.
- The act today knows only a CHANGE's thread (`ch.thread`); a note on the
  contract's own thread (`c.thread`, `negoNoteHome`) and a REPLY need the same
  act through the one home reading, and deleting a root with replies under it
  is the owner's call: refuse while replies stand (the general practice), or
  take the thread with it. The order proposes REFUSE, said in words.
- It asks once (`confirmDialog`, naming the note's first words); a refusal
  writes nothing. The Word export's comment for a deleted note simply does not
  exist next time it is written. No server route is needed: the thread rides
  the PUT as it does today; a delivered note is the wall above.
Drawn as a third bare verb after Done in the note row's acts, both panels
(the per-change panel and Chat), dressed by the same rule. `ng_np_delete` and
its Swedish twin; the confirm's sentence beside it.

**3 — THE BLUR COMES OFF.** Reverses round three's item 2 the same night. The
scrim stops taking `is-blur` on the negotiation page (`notesBlurs()` answers
false, or is retired); the 27 Aug ruling stands again everywhere: no shade,
the contract stays lit. ONE QUESTION FOR THE OWNER: the press on the page
that closes the drawer arrived WITH the blur (a blurred page reads as a door;
an unblurred one does not) — does it stay? The general practice for a docked
panel is that the page behind stays live and the panel's own ✕ closes it.
The order proposes: no blur, no outside-press close, the round-three rule
lines and notes-two-rooms-verify section 2 put back to the 27 Aug shape.

**4 — THE MARKER LANDS ON ITS NOTE.** The press already carries the key
(`_rlNpFocusKey`) and the drawer scrolls to it and lights it
(`rlNpShowFocused`, consumed on the next paint). MEASURE which case misses:
image 2 shows the drawer open on CHAT (the contract's face, no change in
hand) listing a Clause 1 note while ② on Clause 2 was pressed — so either the
note pressed lives on a CHANGE's thread and the marker opened the wrong home,
or the focused key was consumed by a paint before the note was drawn (the
round-two lesson: the focus key is spent by the paint that lands on it), or
the drawer was already open on another thread and the toggle rule swapped
without re-focusing. Whatever the cause: a marker press lands ON that note,
in the room that holds it (switching the room where the note is external),
scrolled into view and lit — measured in the browser file from both papers.

**5 — A NEW COMMENT DRAWS ITS MARKER AT ONCE.** Not a regression: the marker
arrives LATE — after a delay, or only on a refresh. The record is right (the
note is on the list with its anchor); the paper is repainted late. The
markers are painted by `rlPaintNoteMarks` AFTER a paint of the canvas, and
posting a note from the drawer repaints the DRAWER, not the paper beside it —
the paper catches up on its next paint for some other reason (a probe, a
repaint, a refresh). The fix is at the posting: the one writer of a note
(`negoPostComment`, through `rlNotesSend`) is followed by a repaint of the
marks on whichever canvas is mounted — the negotiation page's, the clause
editor's, their page's — in the same breath, numbered after the others; the
marker must be on screen before the toast has gone. Measured on both papers
in round-two-comments-verify as a real press with no wait: highlight,
Comment, Add note, marker.

**6 — SUGGEST DELETING REDLINES THE PASSAGE.** The press is `scope-cut` →
`ceCutPassage`: it takes the words out of the draft, applies, and FILES
(`ceFile`) in one press. "Does not work" has to be measured: the guard
`ceUnderDeletion`, `ceEditableReading`, a `moved` refusal (`ce_inline_moved`
where the held words are no longer found verbatim — the likeliest, since the
draft carries list markers as text and the round-two multi-line reading moved
what `sel.text` holds), or `ce_inline_cut_all` (the cut would empty the
clause). Whichever it is, the expected result is the one the owner names: the
selected sentence or word struck through on the paper as a filed deletion —
the strike drawn by the redline engine, nothing hand-written — and the
refusal, where there is one, spoken in `#ce-say`, never silent.

**7 — APPLY ON A COPILOT CARD, AND THE NOTE.** The rulebook is precise here
and the owner should be told before a line moves: Apply is NOT a filing — it
moves the wording into the box and (since round three) ends typing so the
marks are seen; the ONE act that files is Save in the rail's foot, and the
drawer comes up pinned to the change on that filing (`rlNoteAskAfterFile`).
So today the note window arrives one press later than the owner expects.
Two honest ways to give what image 5 asks, the owner's choice:
- (a) APPLY FILES: a Copilot card's Apply goes on to `ceFile` in the same
  press, exactly as *Suggest deleting* already does (one press, one filing,
  the drawer pinned to the new change) — Apply becomes a second door onto
  the filing act, which the six questions refuse without the owner's yes, and
  Undo after Apply would then mean Withdraw.
- (b) THE DRAWER COMES AT SAVE, as now, and Apply says so where the reader is
  looking (the rail's foot reads "Save files this as CHG-0NN and opens the
  note" — words on the control, no band).
The general practice (Word's tracked changes, the redlining tools serious
contract software follows) is (b): a suggestion is applied, reviewed, then
committed with its comment. The order proposes (b) unless the owner says (a).

**8 — THE VERB PUTS THE CARET IN THE BOX.** Today the three verbs deliberately
leave the caret where it was (round two's *attaching never takes the caret*,
written so the paper's own selection survived the press). The owner rules
the other way: after Ask Copilot or Edit with Copilot the caret goes into
the rail's ask box (`#ce-ask`), and after Comment into the drawer's note box
(`.rl-np-in`, the room the pin opens on) — on both papers, the negotiation
page's and the editor's, and on their page's aside for Comment. The
selection on the paper may go with it: the words are already held (the pin,
or the held passage in the rail), so nothing is lost. `focus()` with
`preventScroll` where the box is already on screen; where the drawer or the
editor is still sliding in, focus after its paint (the drawer's own
`trapFocus` already moves focus into the panel — check it lands on the BOX,
not the first control). Measured in the browser file: `document.activeElement`
is the box after each of the three presses, on both papers.

## ORDER WHEN THE OWNER SAYS GO

3 (a reversal, one function), 5 (a late paint — repaint the marks at the post), 4 (measure
which case misses), 6 (measure the refusal), 1 (one gate widened, one key on
the post), 2 (one door on an act that exists, three refusals in words), 7
(after the owner's (a)/(b)), 8 (focus on the three verbs, both papers). Nets: f304 grows a section per item;
round-two-comments-verify gains a real press on a reply's Reply and on Delete
(the greyed delivered case measured, not described); f264's three-acts claims
re-pointed where the delete reaches the drawer.

## STILL WAITING FOR

The owner's go — and their word on: the two rulings under item 2 (whether a
root with replies may be deleted; whether an admin may delete a colleague's
note); under item 3 whether the press-on-the-page close goes with the blur;
under item 7 whether Apply files (a) or the note comes at Save (b).
