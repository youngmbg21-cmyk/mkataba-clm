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

## L-2 — *(awaiting the owner)*

