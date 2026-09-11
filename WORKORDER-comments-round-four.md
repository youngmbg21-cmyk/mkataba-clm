# COMMENTS, ROUND FOUR — TWO REPORTS OFF ROUND THREE'S FIRST USE

**WRITTEN 11 Sep 2026, late night, after round three went to main.** The
owner's instruction, in their own words: *"ADD THESE TO A WORK ORDER."*

**THE GATE ON ALL OF IT: nothing here is coded until the owner says go.** When
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

## ORDER WHEN THE OWNER SAYS GO

1 (one gate widened, one key on the post), then 2 (one door on an act that
exists, three refusals in words). Nets: f304 grows a section per item;
round-two-comments-verify gains a real press on a reply's Reply and on Delete
(the greyed delivered case measured, not described); f264's three-acts claims
re-pointed where the delete reaches the drawer.

## STILL WAITING FOR

The owner's go — and their word on the two rulings under item 2: whether a
root with replies may be deleted, and whether an admin may delete a
colleague's note.
