# WORK ORDER — the owner's fixes, 26 Aug 2026

**Raised by:** Young, 26 Aug 2026, off annotated screenshots.
**Branch:** `claude/ui-text-dropdown-styling-j2nat5`.
**Status:** **NOT STARTED — NOTHING IS TO BE BUILT YET.** The owner's exact
words were *"Do not code yet but add to a list of things to be done later and
I will add more."* This file is the list. It stays open; the owner is adding
to it. Wait for their word before writing a line of code.

---

## The plain-English version, for the owner

One item so far, and it is all about the small ⋯ menu that drops down from a
tracked change. Five things are wrong with how it reads: the words are bigger
and heavier than the ones on the row above them, one of them wraps onto a
second line, only two of the four rows have a picture beside them, and one
label is longer than it needs to be. None of it changes what any of those rows
DO — this is entirely about how they look and read.

More items to follow.

---

## L-1 — THE ⋯ MENU ON A TRACKED CHANGE READS AS A DIFFERENT PAGE

**Reported with Image 1:** the menu open on `CHG-003 · CLAUSE 4 · GOVERNING
LAW`, showing Review · Retract · ✦ Edit with Copilot · Open in the clause
panel.

**Owner's words, verbatim:**

> *The drop down should always be the same font size as Edit and Send, not in
> bold size, never wrap texted and they should have a symbol before the word
> just like review. Always limit the description like "Open in the clause
> panel" should be "Open clause panel".*

### Five separate asks, and each is its own check

1. **ONE SIZE.** Every row in the menu reads at the same size as `Edit` and
   `Send` on the row's own face directly above it. Not larger.
2. **NOT BOLD.** Nothing in the menu is set heavier than those two words.
   (In the screenshot `Edit with Copilot` is the offender — it is the menu's
   lead row and wears both the extra weight and the violet.)
3. **NEVER WRAPS.** No row breaks onto a second line at any menu width. If a
   label will not fit, the label gets shorter — see 5 — the type does not.
4. **A SYMBOL ON EVERY ROW.** Review already carries one and `Edit with
   Copilot` carries the ✦. Retract and Open have none, so the menu reads as
   two kinds of row. Every row gets one.
5. **SHORT LABELS.** *"Open in the clause panel"* becomes **"Open clause
   panel"**, and the same discipline applies to every row in this menu and any
   row added to it later.

### Notes for whoever builds it — read before touching anything

- **THE MENU IS ONE BUILDER AND THE CARD IS ANOTHER.** Two of those four rows
  (Review, Retract) are the CARD'S OWN BUTTONS, pushed into the menu when the
  face runs out of room — the same markup draws them on the face of other
  cards. So a size or weight change written at the button will move the row
  face too, on cards nobody reported. **Scope every declaration to the menu.**
- **THE INK IS NOT IN THIS ASK.** Retract is red and Review is teal because
  each verb keeps its own colour, and with the buttons bare of any border the
  colour is the whole of what says they are controls. The assumption here is
  that the colours STAY and only size, weight, wrapping and symbols move.
  Say so to the owner rather than discovering it in a screenshot; one word
  from them reverses it.
- **THE SYMBOLS COME FROM THE SPRITE, not from new hand-drawn glyphs.** The
  shell already defines a set of line symbols once, at a 16 box on a hairline
  stroke in `currentColor`, and several are staged and unused. A symbol
  invented here would be a second family in a menu four rows long. Note the
  ✦ is deliberately a solid mark and is the Copilot spark's own convention.
- **A SHORTER LABEL MOVES BOTH LANGUAGES.** These are dictionary keys, so
  Swedish changes in the same breath or the menu ships half-translated.
- **NOTHING IN THIS ITEM CHANGES WHAT A ROW DOES.** Every row is a door the
  page already has and the menu decides nothing — it must still decide nothing
  when this is finished.
- **PHOTOGRAPH IT WHEN IT IS DONE.** Three of the five asks (size against the
  face, no wrap, a symbol on every row) can only be answered by measuring the
  drawn menu with it actually open — a source read passes on all three while
  the screen is still wrong.

---

## L-2 — THE "SHOWING ONE SIDE ONLY" BAND, AND THE RULE BEHIND IT

**The rule is done and is not on this list.** It is written into the rulebook
as **NO NEW BANDS ON THE PAGE — ASK FIRST**, above the Bug Fix Rules, with the
owner's words verbatim, the two-part test, the SAP reasoning, and the bands
that explicitly stand — the send-all strip the owner kept by name, the
counterparty's wall line, and a refusal's way forward. Read it before touching
anything on this item.

**The band itself comes off, and the owner ruled it** — 26 Aug 2026, *"put
removing it to the list of things to be done later"*, in answer to the
recommendation below. It is the amber row reading *"Showing one side only —
others are hidden / Show all changes"*, drawn under the WHOSE ASKS dropdown on
the Tracked changes column whenever that dropdown is not on All. It is on this
list rather than done, because nothing on this list is built until the owner
says begin.

### Why it goes

It fails both halves of the test the owner has just set: the dropdown ten
pixels above it reads "Mine (2)", so the screen already says the column is
narrowed, and it is the reader's own choice read back to them rather than work
owed.

### The one thing that must be checked before it goes

This band was put there deliberately and the rulebook names it as one of three
safety properties of that filter — *"while the column is narrowed it SAYS so
and offers the way back, which is the thing a collapsible control could
otherwise hide"*. A control that hides changes with nothing saying so is a
real hazard on this page, so the argument for removal rests entirely on the
screen still carrying the fact without it. **On the screenshot it does, three
times over** — the dropdown reads "Mine (2)", the heading reads "Tracked
changes (2)", and the line under the progress bar reads "1 of 3 decided", so
the 2 and the 3 disagree in plain sight. Measure that on the real page before
removing anything, and if any of the three is missing in some state, say so
and stop rather than leaving the filter silent.

The rulebook's three-safety-properties passage has to be corrected in the same
breath, or the next person reads the removal as drift and puts it back.

---

## L-3 — ON THE COUNTERPARTY'S PAGE, EDIT GOES TO THE CONTRACT

**Owner's words, 26 Aug 2026:** *"In the counterparty page, if you click Edit
in the card it should take you to the attached edit window not to the
contract."* The attached window is the CLAUSE PANEL — the one headed EDIT with
History / + notes and the text-size stepper, carrying As it stands, Change
this clause, On the table and History.

### THIS IS A REGRESSION, NOT A MISSING FEATURE — start there

The rulebook already records this exact ask, granted on **20 Aug 2026**, in
the owner's own words then: *"Edit should take you to the edit side panel, not
to the contract"* — **and it says BOTH SEATS**. So the question for whoever
picks this up is not *how do we build it*, it is *what stopped it working on
their seat*.

**AND THE OBVIOUS ANSWER IS NOT THE ANSWER.** The instinct with this class of
fault on this page is always "the handler was wired on the owner's page and
never reached the counterparty's mount" — that is the recorded 15 Aug lesson
and it has bitten four times. **CHECKED, AND IT IS NOT THAT THIS TIME:** the
counterparty's mount does run the same clause-tools wiring the owner's page
runs, its root does carry the class the Edit handler walks up to, and the
shared panes builder hands both seats the clause panel. The parts are all
present.

**So do not fix it by adding a second wiring path on their side.** One
mechanism, never two, is what the 20 Aug note is built on, and a second path
is how the two seats come to disagree about what Edit does — which is the
fault this whole rulebook opens by warning about.

### What to do, in order

1. **Reproduce it on a real share link first**, on their page, on a card with
   a clause behind it. Everything below is a hypothesis until then.
2. Then find where the press stops short. The handler jumps to the clause
   FIRST and opens the panel SECOND, so **a press that lands on the contract
   and does nothing else is that second step being skipped or refused** — the
   jump is working exactly as designed and the panel is not opening. Two known
   ways that happens by design: the panel refuses to open with no body for
   that clause, and a proposed-new-clause ask has no clause behind it at all.
   Rule both in or out before changing a line.
3. Check the card verb the owner is actually pressing. The card was rebuilt on
   25 Aug into a face plus a ⋯ menu, and the counterparty's card keeps a
   different shape from ours, so confirm which button on THEIR card carries
   the Edit act before assuming it is the same one as on ours.
4. Whatever the cause, the fix goes where both seats read it.

### And it wants a net, because it has now broken twice

There is no check anywhere that presses Edit **on the counterparty's seat**
and asserts the panel opens — which is why a granted ask could quietly stop
working for six days. Add one in the browser pass that already drives their
page, and make the claim the one that matters: after the press, the panel is
open **on that clause**. A check that only asserts the handler exists passes
against exactly the state being reported.

---

## L-4 — ONE CARD, ONE HEIGHT, NO DEAD BANDS (the Home dashboard)

**Owner's words, 26 Aug 2026:** *"The top cards and the bottom cards have to
be the same size as far as height and remove empty spaces which makes the card
look empty. Create a well structured card like a fiori card but fitting within
the dashboard format we are creating."* Two bands were ringed on the
screenshot: one across all four My-work cards between the sub-line and the big
figure, and one across the foot of all four Portfolio cards.

### BOTH RINGED BANDS ARE RESERVED SPACE, AND IT IS ALREADY MEASURED

Neither is a rendering fault; both are space the cards are TOLD to hold open,
and the two heights are typed:

- **The two rows are set to two different heights** — the My-work row and the
  Portfolio row carry their own fixed numbers, 35px apart. That is the owner's
  first sentence, and it is one value, not a layout puzzle.
- **The band above the figure is a spacer** that takes up whatever is left
  over inside the card. Against a FIXED height with short content it stops
  being a spacer and becomes a hole — which is precisely what was ringed.
- **The band under the foot is a reserved two-and-a-bit lines** on the
  Portfolio cards, held open even where the footer is one line. All four
  footers in the screenshot are one line, so all four show the reservation.

### WHY THEY WERE PUT THERE — do not just delete them

Both reservations exist to keep four cards in a row LINED UP when their
content is different lengths: without them, one card's figure and footer sit
at a different height from its neighbour's, and a row of four cards whose
numbers do not share a baseline looks worse than the empty space does. **So
deleting the spacer and the minimum without replacing the mechanism trades one
ugly row for another** — and the second one will be reported too.

### THE ANSWER THE OWNER ALREADY NAMED: give the card an anatomy

A Fiori card is not a box that content falls into — it is a fixed set of
regions, and every card in a row shares them, which is exactly how alignment
is bought without padding the shortest card with a hole. Take the STRUCTURE,
not the look; the dress stays HaTi's own.

The regions this dashboard actually needs, read off the cards already on it:

1. **Header** — title, and one line of supporting detail
   ("80 drafting · 21 in review · 47 executed · 2 closed").
2. **The figure** — the number, its unit or scale, and its tone.
3. **The footing fact** — one line qualifying the figure
   ("+2 this week", "0 stalled > 14d", "SEK 8.80M exposure").

Every card fills the same three regions and each region is the same height on
every card, so titles line up with titles and figures with figures **because
they are in the same row of the same skeleton** — not because a spacer was
told to swallow the difference. A card with nothing for a region leaves it
empty and the row still lines up; what it must never do is hold open a region
this dashboard does not use.

**The lifecycle card is the one that will fight this**, and it is the test of
whether the skeleton is right: it is wide, its figure sits beside a
three-stage bar rather than under a sub-line, and it has a second state
entirely for a reader who may not see money. Fit it into the same three
regions or say plainly why it is the exception.

### The decision the owner has to make, and what to measure first

One height for all eight means either the top row grows by 35px or the bottom
row shrinks by it. **MEASURE BEFORE PROPOSING**: find the tallest thing each
region genuinely has to hold — the longest sub-line in both languages, the
lifecycle card's stage bar, a two-line footer if any card really has one — and
let the height fall out of that. Then say what it costs in page height and let
the owner rule. **A number typed to make today's screenshot look right is what
produced the two numbers being reported.**

### What must survive it

- The four My-work cards are the reader's own choice and are **drag-to-reorder**;
  the card is the drag handle. A skeleton that breaks dragging has failed.
- **A card counting zero is not a door** — it keeps its number, loses its
  arrow, and refuses the press, and the two rows refuse it differently on
  purpose (one is disabled outright, the other must stay draggable). Both
  behaviours survive unchanged.
- The 3px top edge in each card's own tone, and the numeral matching it.
- The narrow-window branch, where the Portfolio row is already allowed to grow
  with its content — it has to keep agreeing with whatever the new height is.
- A reader who may not see money still gets no money figure at all, not a
  labelled blank.

### Prove it with pixels, not with the stylesheet

The claim is a RELATION and must be written as one: **every card in both rows
returns the same height, and no card contains a run of empty space taller than
the gap between its own regions.** Written as a typed number it costs a test
edit at the next type pass and passes against a card that is the right height
and still hollow.

---

## L-5 — A REFRESH SHOULD LEAVE YOU WHERE YOU WERE

**Owner's words, 26 Aug 2026:** *"When you refresh a page, it should take you
back to the same page not back to home."*

### THE MACHINERY EXISTS — so this is a regression or a partial restore

Read before starting, because the instinct here is to build it and it is
already built. Every page change writes down which page you are on, which
agreement is open and which stream, and startup reads that back and returns
you there. Its own note in the code names this very complaint as the reason it
was written: *"losing a refresh mid-negotiation to the dashboard was the exact
complaint this list caused."*

**So the question is not how to remember the page. It is which page stopped
being remembered, and why.**

### Reproduce first, and write down WHICH page

"It goes home" may be true of some pages and not others, and the answer is
different for each. Refresh on each of these and record what happens: Home,
Contracts, a stream, Negotiations (the list), a negotiation, a contract room
on each of its four tabs, Insights, Calendar, Reports, Templates, Our
standards, Requests, People, Import, Settings & Rules. **Everything below is a
hypothesis until that table exists.**

### Two gaps already found by reading, neither yet proved to be the cause

1. **Only the page, the open agreement and the open stream are remembered —
   not where you were INSIDE the page.** The contract room's four tabs are
   held in memory only, so a refresh on Signing or History reopens the room on
   the tab it would normally open on. If the owner's report is about a tab
   rather than a page, that is a different and smaller job than it sounds.
2. **There is a silent fall-back to the dashboard.** On startup, if the
   remembered agreement is not among the ones loaded, the open agreement is
   dropped and the page is quietly changed to the dashboard. That branch is
   written for the contract room and for nothing else, so the negotiation page
   is not covered by it either way. Whether it can fire on a real workspace is
   the thing to measure — but it is exactly the shape of "I was somewhere and
   now I am home".

**The remembered position is read back in two different places on startup.**
Whatever the fix is, both have to end up agreeing; a fix in one is the
duplication warning in its usual direction.

### What must not break

- **A link from an email still wins.** A signer or reviewer following their
  link lands on that agreement, on the step the mail is about, and the link is
  spent once used — the remembered page must not override it, and a refresh an
  hour later must not put them back on the signing step.
- **A page the reader is no longer allowed to open must not strand them.**
  Settings & Rules refuses a non-admin at the door, so restoring somebody onto
  a page they may not have is landing them on a refusal. Whatever page cannot
  be honoured falls back gracefully, and quietly.
- **The remembered position is per browser, never shared with colleagues** —
  it is where one person's screen was, and it must not travel.
- The counterparty's own pages are reached by a link and have no shell; they
  are not in this ask and are not to be given a memory.

### The check

Refresh on each page in the table above and assert you are still on it — the
one claim that matters, and the one nothing currently makes. Include the
contract room's tabs, whatever is decided about them, so the answer is
recorded either way rather than left to the next report.

---

## L-6 — THE NAV IS DEAD WHILE EDIT WITH COPILOT IS OPEN

**Owner's words, 26 Aug 2026:** *"then I am on this page and i try to switch to
another tab in the nav panel it keeps me in the same page which is a bug."*
The page is **Edit with Copilot** — the full-window clause editor, screenshot
showing Clause 3 · Term with the Copilot rail down the right and the sidebar's
Home ringed.

### FOUND, and it is worse than it looks

The clause editor is a LAYER laid over the page area, not a page the shell
draws. It is put up when it opens and taken down when it closes — and the only
things that take it down are its own controls: Back to the negotiation,
Escape, and filing a change. **Nothing in the shell's own page-switching closes
it.**

So pressing Home in the sidebar does exactly what it always does: **the app
really does go to Home.** It draws Home underneath, and the clause editor is
still lying on top of it, so the reader sees nothing happen. The press is not
dead — the result of it is hidden.

**That is why this is more than a cosmetic bug.** The reader is looking at the
clause editor while the app believes they are on Home. Anything they do next
is being done against a page that is no longer the one underneath — including
Back to the negotiation, which returns them to a page the app has already left.

### The fix, and where it goes

**One place: the shell's own page switch closes the layer before it draws the
new page.** Every door inherits it — the sidebar, the command palette, a link
in an alert, a deep link from an email — and there is nothing to remember to
do at each. A rule written at the sidebar is a rule the other four doors walk
past, which is this rulebook's most repeated defect.

**Check for other layers while you are there.** If anything else in the
product is a full-window layer put up over the page area, it has the same
hole and takes the same fix in the same breath — but only after looking, not
on the assumption.

### The decision the owner has to make

**This page can be holding unfinished work** — a proposal half typed and a
reason half written — and both are thrown away when it closes. The page
already has a Discard changes button, which is the product saying out loud
that leaving with unsaved wording is a thing worth confirming.

So: **should pressing a nav door with unsaved wording ask first, or leave
silently?** Recommendation is to ask, and only where something has actually
been typed — an editor with nothing in it should close without a word, or the
guard becomes the thing everybody clicks through. That matches how the page
already treats Discard.

### The check

Open the clause editor, press a sidebar door, and assert **the new page is on
screen and the editor is gone** — not merely that the app's idea of the page
changed, which is true today and is the whole bug. Do it for at least two
different doors, so a fix written at one is not mistaken for a fix.

---

## L-7 — *(awaiting the owner)*

