# Work order: from a Clauses point into Negotiate, and back (owner, 13 Oct 2026)

Agreed with the owner in chat, 13 Oct 2026, from four iPad screenshots of one
journey on MK-457 (Software as a Service Agreement):
Home → Document → Clauses → Deep dive on 21.1 → "Start redlining with this ask"
→ Negotiate → Edit 21. Confidentiality.

**NOT STARTED.** The owner has more to ask before building. Build in the order
below, one at a time. Run the Six Questions and the Nine Flow Rules on each.

---

## 1. Negotiate shows a blank paper

After "Start redlining with this ask", Negotiate's Redline tab draws an empty
sheet (only the "HATI" running head) while the counter reads "+209 −119" and
the column lists five drafts. The wording must be on the paper.
- Find why the sheet paints empty on this path (and whether any other door into
  Negotiate does the same), fix it at the cause, and photograph the paper.

## 2. The button lands on the clause you came from, and files nothing

Today `data-stk-redline` (js/views/breakdown.js) only calls
`openRedlineWorkbench(c.id)`. Negotiate opens at the top, and the lit card is
"5. Charges", not "21. Confidentiality".
- Carry the point's clause (and Jambo's ask) through the one door
  (`openRedlineWorkbench`): land on that clause, its card lit, Jambo's ask
  ready to use.
- **Nothing is filed until a person presses.** Five drafts (CHG-001…005, one
  per Clauses point) were already on the table on arrival, although the deep
  dive said "Jambo's proposed ask · not filed". Find what filed them (the
  button, the blanks ask, the deep dive or an earlier press) and make the
  filing a person's own press (flow rule 7, "Copilot prepares, a person
  decides").

## 3. A way back to where you were

There is no way back from Negotiate to the Clauses review: no back link, and
the button does not remember where you came from.
- Negotiate remembers that it was opened from Home → Clauses, deep dive point
  N of M, and offers "‹ Back to clauses" in its page title area (a crumb, like
  the deep dive's own "Back to clauses"; NOT a band).
- Pressing it returns to the same deep dive point, so the reader carries on to
  the next one. A refresh keeps it (`PLACE_PARTS`).

## 4. Jambo changes only what is needed

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
