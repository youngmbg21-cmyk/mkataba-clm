# WORK ORDER — FOUR OFF FOUR SCREENSHOTS

Young, 19 Sep 2026, in the owner's own words:

> *"The highlighted selections are selected categories but the highlight is so
> faint you can barely notice it. shade should be darker and the words in white
> when selected. delete the templates overview page. insights should come after
> obligations. Exposure page is very bland and does not highlight where your
> eyes should focus on."*

**NOTHING IS BUILT YET.** This is the understanding put back before any code is
written. Three of the four are straightforward; **item 2 takes something away
and needs a ruling before it is done.**

---

## 1 · A SELECTED ROW IS DARK, WITH WHITE WORDS

**THE FAULT, MEASURED.** The Templates rail lights a selected row with
`--color-accent-100` — `#ccfbf1`, a pale mint — under `--color-accent-800`
text. Against the white column behind it that is a wash of almost nothing, and
the owner's screenshot rings two rows that are selected and read as though they
are not.

**WHAT TO BUILD.** A selected rail row takes a **solid accent ground with white
words**: `--accent-fill` (`--color-accent-700`, `#0f766e`) behind
`#fff`, and its count in white at reduced opacity rather than accent-on-mint.
The 3px accent left rule stays. `--color-accent-100` remains what it is — the
HOVER well — so pointing at a row and selecting one stop reading alike.

**BOTH RAILS, ONE RULE.** `.tpl-rail.on` and `.tpl-rail-s.on` (the value-stream
rows) are one class pair and both are in the screenshot; `.tpl-rail-s.on`
currently overrides the colour back to neutral, which is why a selected stream
shows a mint bar and black words. That override goes.

**AND THE SAME QUESTION IS ASKED ELSEWHERE, so check before diverging.** The
sidebar's live door (`#side-nav .nav-item.active`), the Contracts page's active
filter and the settings tab row all answer "which one is selected". If any of
them is as faint, it is the same fault and should move with this one — **but
only after measuring each, and the answer is reported before it is changed.**
A rail that is dark and a sidebar that is pale would be two answers to one
question.

**WATCH THE CONTRAST BOTH WAYS.** White on `#0f766e` passes AA comfortably; the
dark theme's `--color-accent-700` is a light teal, so white on it would not.
The dark theme takes the same rule with its own two tokens, and both are
measured as COMPOSITED contrast before this is called done.

**Tests:** a browser claim that reads the computed background and colour of a
selected row and an unselected one and requires them to differ in BOTH, in both
themes. A source claim alone cannot see this — that is the whole lesson of the
faint highlight.

---

## 2 · DELETE THE TEMPLATES OVERVIEW TAB — **ONE RULING NEEDED**

The owner rings the *Templates overview* tab and says delete it. It is the tab
built two days ago, on the owner's own words: *"You also have not implemented
how the paper is doing tab which was part of my request."*

**WHY IT IS BEING ASKED FOR NOW IS CLEAR, AND IT IS A REAL DUPLICATION.** The
book's glance opens with *Came back changed 92%* and the overview's own
headline is the same figure. Two tabs leading with one number is exactly the
fault this product keeps paying for.

**BUT THE OVERVIEW HOLDS FOUR READINGS THE BOOK DOES NOT**, and deleting the
tab deletes them:

| Reading | Also in the book? |
|---|---|
| *Came back changed*, the headline % | **Yes** — the glance |
| *Where the argument is* — every template ranked worst-first, with a bar showing changed / accepted / never-checked | No |
| *The clause they argue about most* — which category is fought over, across all paper | No |
| *Templates causing most of it* / *going through clean* / *drafted but never checked* | No |

**THREE WAYS TO DO IT. The owner picks one.**

**(a) Delete the tab and let those four readings go.** Two tabs, *The book* and
*Templates*. Simplest, and the least paper on screen. What is lost is the only
place in the product that says which CLAUSE the counterparties argue about
most.

**(b) Delete the tab and fold the two lists into the book** — *Where the
argument is* and *The clause they argue about most* become two more named
sections under *What wants somebody*, resting shut so they cost nothing at
rest. Two tabs, nothing lost, the book grows by two folds.  ← **recommended**

**(c) Delete the tab and keep only the clause list**, as one shut section. Two
tabs, the per-template ranking goes (the book's *Needs attention* panel already
names the worst templates, differently), the clause reading survives.

**WHATEVER IS PICKED**, `tplHealthData` and `tplHealthHtml` are NOT deleted from
the source. They are left built and unreferenced, the way `tplOverviewHtml` is
now, with one line saying why — every reading in this product that was deleted
outright is a reading somebody later rebuilds from scratch.

**AND THE TAB COUNT DROPS TO TWO**, so `TPL_PAGE_TABS` goes back to a pair and
the landing rule is re-checked: a reader still arrives on *Templates*.

**Tests:** f334 (7) pins the overview tab as the health view and f336 pins
three tabs; both are re-pointed IN PLACE with the ruling beside them, never
deleted. templates-tabs-verify sections 1 and 9 likewise.

---

## 3 · INSIGHTS COMES AFTER OBLIGATIONS

**THE FAULT.** The sidebar reads Home · Contracts · Negotiations · Calendar ·
**Insights** · Templates · Obligations · Requests · People. Insights sits
fifth, between Calendar and Templates, above two doors used far more often.

**WHAT TO BUILD.** Insights moves to after Obligations:

> Home · Contracts · Negotiations · Calendar · Templates · Obligations ·
> **Insights** · Requests · People

**IT IS MARKUP ORDER AND NOTHING ELSE.** The sidebar is written out in
`index.html`; moving one `<button data-view="intel">` block moves it. No
handler, no route, no state and no count changes — every door keeps its own
`data-view`, and the "New" badge (`#nav-intel-new`) travels with the block it
is inside.

**TWO THINGS TO CHECK AFTER MOVING, both of which have bitten this file
before:** the `.nav-item[data-view="intel"] svg` colour rules are keyed on the
attribute and not on position, so they follow; and the keyboard order is the
markup order, so tabbing through the sidebar must be walked once to confirm it
reads in the new order rather than the old.

**Tests:** a browser claim reading the sidebar's doors in painted order and
requiring `intel` to sit after `obligations` and before `intake`.

---

## 4 · THE EXPOSURE PAGE SHOULD SAY WHERE TO LOOK

> *"Exposure page is very bland and does not highlight where your eyes should
> focus on."*

**THE FAULT, READ OFF THE OWNER'S OWN SCREENSHOT.** Six rows in one flat table,
every row in the same weight and the same ink. Three of the six are **zero** —
Indemnity, Renews itself, Exclusive — and they take exactly as much of the page
as the two that are not. The row that matters most, *Not read closely enough to
say* at 119 contracts and SEK 747M, is drawn last, in the same size as a row
reading zero. **A table where nothing is emphasised emphasises nothing**, and
the eye is left to do the ranking the page should have done.

**WHAT TO BUILD. Five moves, none of them a new band and none of them a
colour the product does not already use.**

1. **WORST FIRST.** Order the rows by what they are worth, not by the order the
   kinds happen to be written in. A zero row sinks by construction.
2. **A ZERO ROW STANDS DOWN** — its figures take the label shade rather than
   the primary ink, and it draws no verb, because *See all* over nothing opens
   nothing. **It is NOT hidden**: "no contract in the book has uncapped
   indemnity" is a fact worth reading, and hiding it would make the page look
   like a list of everything that is wrong.
3. **THE LEADING ROW CARRIES THE WEIGHT.** The worst exposure takes a 3px tone
   bar in the margin — ruby where the product's own risk threshold says so,
   amber below it — and its figure is the only one drawn large. One leading
   figure per page, the same rule the register and the health view follow.
4. **THE UNREAD ROW IS NOT AN EXPOSURE AND SHOULD STOP LOOKING LIKE ONE.**
   *Not read closely enough to say* is a statement about HaTi's own coverage,
   not about the contracts. It moves out of the table into a line of its own
   beneath it, with its one door (*Read them*). Six rows become five plus a
   coverage line, and the five are then comparable with each other.
5. **THE ASTERISK EARNS A WORD.** `SEK 6M *` means a value was left out for want
   of an exchange rate. That is the fxMissing rule and it is right, but a bare
   asterisk is not a sentence. It keeps its hover and gains one quiet line under
   the table saying how many contracts were left out and why.

**WHAT NOT TO DO, and each is refused on this product's own rules:** no score
or rating out of ten (a figure a lawyer cannot re-derive is worse than a count
they can press); no new coloured band across the page; no chart — six rows are
a list, and a doughnut of six slices is decoration; and **no change to what is
counted.** Every figure on that page stays exactly the reading it is now.
**This is an ordering-and-weight change, not an arithmetic one.**

**Tests:** a browser claim that the rows are painted worst-first, that a zero
row draws no verb and takes the quiet ink, that exactly one figure on the page
is drawn at the leading size, and that the counted values are byte-identical to
the parent's — the last one is what proves this touched presentation only.

---

## NOTICED WHILE READING THE SCREENSHOTS — NOT ASKED FOR, NOT IN THIS ORDER

**A DEVIATION RATE OVER ONE CONTRACT IS BEING PRINTED AS 100%.** Five value
streams in the owner's screenshot read *Deviation rate 100%* and each says
underneath *"The one contract checked did not follow Our standards."* The
arithmetic is honest and the sentence is honest, but a 100% in 20px type over a
sample of one reads as a catastrophe and sits beside HaTi standard's 92% over
twelve, which is a real one. The shut-section headline was given a floor on
19 Sep for exactly this reason (`TPL_DEV_MIN`, three checked); **the cards
themselves were not.**

One line to fix, whenever the owner wants it: below the floor the card prints
the count rather than the percentage — *"1 of 1 checked"* — and keeps its
sentence. **Not touched in this order.**

---

## THE ORDER OF WORK

1 and 3 are small and independent. 4 is a day. **2 is blocked on the owner's
ruling** and nothing in it should start before that comes back.
