# Work order: from a Clauses point into Negotiate, and back (owner, 13 Oct 2026)

Agreed with the owner in chat, 13 Oct 2026, from four iPad screenshots of one
journey on MK-457 (Software as a Service Agreement):
Home → Document → Clauses → Deep dive on 21.1 → "Start redlining with this ask"
→ Negotiate → Edit 21. Confidentiality.

**BUILT 13 Oct 2026** (owner: "Build all seven, remove the General label too").
- Item 1: the button never filed anything; the five drafts in the screenshot
  are what "Draft from our standards" files. It now opens the point's clause
  in Edit with Jambo, the ask ready and unsent.
- Item 6: the deep dive's "■ General" label went too (owner's answer).
- The bug-log list at the end went to BUGLOG.md.

---

## 1. The button lands on the clause you came from, and files nothing

Today `data-stk-redline` (js/views/breakdown.js) only calls
`openRedlineWorkbench(c.id)`. Negotiate opens at the top, and the lit card is
"5. Charges", not "21. Confidentiality".
- The paper is NOT blank (owner corrected, 13 Oct 2026): it opens scrolled to
  the top of page 1, which is empty, so it LOOKS blank. Landing on the clause
  (below) fixes this too.
- Carry the point's clause (and Jambo's ask) through the one door
  (`openRedlineWorkbench`): land on that clause, its card lit, Jambo's ask
  ready to use.
- **Nothing is filed until a person presses.** Five drafts (CHG-001…005, one
  per Clauses point) were already on the table on arrival, although the deep
  dive said "Jambo's proposed ask · not filed". Find what filed them (the
  button, the blanks ask, the deep dive or an earlier press) and make the
  filing a person's own press (flow rule 7, "Copilot prepares, a person
  decides").

## 2. A way back to where you were

There is no way back from Negotiate to the Clauses review: no back link, and
the button does not remember where you came from.
- Negotiate remembers that it was opened from Home → Clauses, deep dive point
  N of M, and offers "‹ Back to clauses" in its page title area (a crumb, like
  the deep dive's own "Back to clauses"; NOT a band).
- Pressing it returns to the same deep dive point, so the reader carries on to
  the next one. A refresh keeps it (`PLACE_PARTS`).

## 3. Jambo changes only what is needed

Jambo's ask for 21.1 keeps the existing sentence and adds one survival sentence,
but the filed change (CHG-004) strikes ALL of 21.1, including the number and
title, the first sentence ("All Confidential Information … property of the
Disclosing Party") and the last ("Receiving Party shall limit internal
distribution …"), and puts only Jambo's paragraph in its place. The clause
editor showed "+69 −110". CHG-001 likewise removes the whole line "33.1 Danish
law applies.", number included.
- The ask splices in at its quote (the smallest change: `pbFitWording`,
  `pbFitInto`), so the redline adds the one new sentence and leaves the
  rest of the clause, its number and its title untouched.
- Check every path that files a Jambo/Playbook ask (`rlFilePlaybookProposal`,
  the editor's "Use Jambo's draft", the deep dive) through the funnel.

## 4. One dropdown per press on an iPad (owner: second time asked)

On the Clauses tab, pressing the Section filter on an iPad shows HaTi's own list
AND then the iPad's own picker for the same box. The rule is now in CLAUDE.md
("ONE DROPDOWN PER PRESS, ON AN iPAD TOO").
- Likely cause, to prove first: the Stakes filters' change handler
  (js/views/breakdown.js) repaints and then calls `.focus()` on the new select;
  on iPadOS a focused select opens the system picker. Remove that, and sweep
  `js/` for every other `.focus()` on a `<select>`.
- Test with a touch press: one list only, before and after.

## 5. Every paper's zoom (− 100% +) looks and sits the same

Owner, 13 Oct 2026, two screenshots: *"the paper adjustment filter seems to be
in different places and cutoff or joined to the paper. Make it professional to
be in the grey area but well designed and well placed."*
- What the screenshots show: on Home's Document tab the zoom is tucked under
  "Another contract" and cut off by the line below the strip; on Negotiate it
  touches the paper's top edge and runs into the scrollbar.
- Why: one builder (`rlPaperZoomHtml` → `.paper-zc-row`/`.paper-zc`), but each
  page nudges it by its own numbers (`--zc-room`, `--zc-top` for
  `#ig-paper-scroll`, `#nego-scroll-work`, `#doc-zc-slot`, `#ds-docpane`), and
  it hangs off the scroller's right edge (`--paper-zc-right`), not the paper's.
- Build: ONE placement for every host: in the grey ground above the sheet,
  its right edge lined up with the paper's right edge, the same clear gap
  above the sheet and below the strip on every page, never touching the paper,
  a bar, a button or the scrollbar. Drop the per-page nudges.
- EVERY PAPER, NOT ONLY NEGOTIATE (owner, 13 Oct 2026: "all papers should be
  uniform with regard to the zoom control"): Home's Document tab, Negotiate,
  Details and Signing, the design step, the counterparty's page, AND the clause
  editor ("Edit with Jambo"), which today draws its own different zoom
  (`.ce-zoom` in js/views/clauseeditor.js, beside "Redline" and "+69 −110").
  One builder, one look, one place for all of them; a page's extras (the
  "+N −N" count, Signing's controls) sit on the same line, to the zoom's left.
- Check on every page that draws the paper (Home Document, Negotiate,
  Details/Signing, the design step), at desktop and iPad widths, with a
  photograph of each, and keep the ONE ZOOM rule in CLAUDE.md true.

## 6. Remove the coloured squares after clause names on the Clauses tab

Owner, 13 Oct 2026, a screenshot of Home → Document → Clauses: *"remove these
green dots as no one knows what they are for"*.
- They are the section squares (`.stk-rsq`, painted in `stkDecorate`,
  js/views/breakdown.js): each clause name gets a small square in its
  section's colour (green, blue, purple…), with the section's name only as a
  hover tip, which an iPad never shows. On some rows the square also sits on
  top of the clause name's last letters.
- Build: remove the square from every row, in every colour, not only green.
  The Section filter already says which section a point belongs to.
- Kept: the deep dive's "■ General" chip, because it carries its section's
  name in words. Ask the owner if that one should go too.
- Update THE MAP's Stakes line in CLAUDE.md ("name + region square
  (`.stk-rsq`)") in the same change, and mark `.stk-rsq` stale.

## 7. Every coloured dot explains itself

Owner, 13 Oct 2026, a screenshot of the Clauses tab with Severity = "Worth a
look": *"we have some worth a look but they have no explanation"*. Clause 3.6
wears an amber dot, has no "N to review", and opened it shows only Plain
English: nothing says why it is amber.
- Why (read in the code, to prove in a browser first): the list has TWO
  readings. The dot's amber comes from the older clause marks (`x.tone`,
  `docThreadMarks`/`docThreadWorst` in js/views/contract.js), and Home does not
  draw those marks. The explanations come only from Jambo's points
  (`stkDecorate`, js/views/breakdown.js). A clause the old marks call amber but
  Jambo's points never mention gets a dot with nothing behind it.
- And the filter keeps an OPEN row even when no point matches it ("the open
  row stays", `stkFiltering` in `stkDecorate`), so 3.6 stays in a "Worth a look"
  list that has nothing for it.
- Build: a dot is coloured ONLY when the open row can say why. One reading for
  both: the dot follows the points listed under it (the Stakes points, which
  already take in the standards check), and a clause with none wears a plain
  dot. Under a filter, a row with nothing that matches leaves the list, even if
  it is open. The number on the filter matches the rows shown.

---

## For the bug log, not this build (owner: stay focused)

- "Risks to look at · 0" (scanned 00:02) on Negotiate vs "2 need you" on the
  Clauses tab for the same contract: two readings of the same thing disagree.
- Clause editor panel: "Your standard is —" shows a dash, yet "Use our
  standard" is offered; "Counterparties pushed on Confidentiality 4 times…"
  is said twice ("What you have settled for" and "What we settled before").
- 21.2 (a)–(e) are plain paragraphs on Home's paper but hanging-indented in
  the clause editor (one paper everywhere).
- Home Document heading reads "Software as a Service Agreement · — · Drafting":
  the counterparty's name is missing.
- The clause-number track down the paper's margin lists "3", "7.3", "47.1" after
  "33.2", out of order.
- "Progress · 0 of 5 decided" counts our own unsent drafts as things to decide.
