# WORK ORDER — the stale "Selected" card, and advice-only risks are not redlines

**Status: NOT STARTED. Written 5 Oct 2026 from two owner reports the same day. The owner said "Keep that as a work order for now" — do not build until the owner says go.**

Two parts. They are independent; build either on its own. Part 2 is the smaller
and the safer of the two.

---

## Where things stand (read before touching anything)

- Read CLAUDE.md, then grep docs/MAP-HISTORY.md for these headings and read each
  section in full:
  - "EDIT WITH COPILOT — THE CLAUSE EDITOR"
  - "ONE EDITOR FOR BOTH DOORS" (all three passes, 5 Oct 2026)
  - "RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD"
  - "ONE DOOR FOR EDITS — RISKS OPEN IN EDIT WITH COPILOT"
  - "A NEW CLAUSE IS HELD IN EDIT WITH COPILOT"
- Both parts change what a screen SAYS, so the SIX QUESTIONS are run before any
  code. Neither part adds a band, a strip or a tip. Neither moves the contract.

---

## Part 1 — The "Selected · …" card in Edit with Copilot quotes an old draft

**The owner's words, 5 Oct 2026** (over a screenshot of Edit with Copilot on
"Article IV: Fees, Billing, and Rate Schedule"):

> "why is there a confusion between the two highlighted areas. Explain but do
> not fix." … "Keep that as a work order for now."

### The finding (measured in the code, nothing changed)

The paper on the left and the "Selected · Article IV" card on the right are
two pictures of the SAME draft, drawn at different moments.

- The paper (`ceRenderPaper`) is redrawn every time the draft moves: a
  Copilot card's Apply, a playbook standard, a passage rewritten in place, a
  risk's wording, typing pulled from the box (`cePullText` → `ceApply`),
  Undo, Redo, Discard, and every Save.
- The card (`ceRenderScope`) is repainted ONLY at: open (`ceRenderAll`), a
  rail tab change (`ceRenderTabs`), a passage attached or let go
  (`ceAttachPassage` / `ceDetachPassage`, which returns early when nothing is
  held), the ✕ (`ceSetWhole`), a Save (`ceFiled` → `ceRenderAll`) and the end
  of a Playbook scan. **Nothing repaints it on `ceApply`, `ceUndo`, `ceRedo`
  or `ceDiscard`.** (`ceApply`'s own comment lists the four regions it
  rebuilds — the readings row, the paper, the foot, the writing bar — and the
  card is not one of them.)
- In its resting state (`.is-clause`) the card quotes `_ceText || _ceBase`
  through `richToText` — the PROPOSED wording, flat, with no struck or added
  words — under the title "Selected · <clause>" and the line "The whole
  clause". So after any Apply or Undo it keeps quoting the draft as it stood
  at its last paint, while the paper shows the draft now. That is the owner's
  screenshot: the card said "4.2 Monthly Invoicing. Terms are net thirty (30)
  days.", the paper said "4.2 Invoicing and Payment … within two (2) days of
  invoice date", and the foot said "Draft saved at 13:53 · Undo the last
  change" — a step had been applied after the card was last painted.

A second, smaller confusion, by design rather than by fault: the card says
"Selected" when nothing was selected (its resting state means "Copilot is
working on the whole clause"), and its quote never looks like the paper beside
it because it carries no marks.

### What to build (the owner picks by name when they say go)

Two roads. **Recommend "Follows"** — the smallest change that makes the card
true.

- **"Follows"** — the card is a statement about the draft, so it is repainted
  wherever the draft moves: `ceRenderScope()` joins the non-keepView branch
  of `ceApply`, and `ceUndo`, `ceRedo`, `ceDiscard`. On the typing pull
  (`keepView`) it is painted too: the card lives in the rail, not under the
  caret, and `#ce-scope` is written in place, so the 30 Aug "nothing is
  rebuilt under the reader's finger" rule is kept (measure that the box keeps
  focus and the caret, as that rule's note requires). Nothing else changes.
- **"Says less"** — the POP-UP DIET: what a control already says goes. The
  resting card keeps its title line and "The whole clause" and drops the
  quote, because the paper beside it IS the whole clause, with its marks. The
  passage card (`.ce-scope` with a held passage) keeps its quote — there the
  quote is the only thing that says which words are held. Fewer pixels in the
  rail; the owner has not asked for this, so it needs their yes.

Either way: the title word "Selected" on the resting card is NOT changed here
(a wording change the owner has not asked for — one line to them if the builder
thinks it should read "Working on · <clause>").

### Tests

- Node: in f245 or a new f-number — open the editor on a clause with a pending
  ask, call `ceApply` with new wording, then `ceUndo`: after each, the
  resting card's `<q>` equals `richToText(_ceText)`. Red at unmodified main.
- Browser: one-copilot-editor-verify gains one check — press Apply on a
  Suggested wording card, photograph, and read the card's quote against the
  paper's added words. Guard it so a build without the card reports rather
  than times out.

---

## Part 2 — A risk that only ADVISES is not a redline

**The owner's words, 5 Oct 2026** (over two screenshots: the Redlines card
showing "Have qualified counsel review before signing — LOW — RISK SCAN", and
the Edit with Copilot window opened on it, holding "New clause after 26.
Notices" and Copilot's red refusal "The passage shown is empty — there is no
selected wording to work from"):

> "this risk should not be redlines because you cannot edit it to create a
> redline. Exclude such clauses where it just advise as opposed to ones where
> they can be added on paper. Add this to the work order as well"

### The finding

The risk scan's rules are of two kinds, and today the Redlines card does not
tell them apart.

- Most rules name WORDING to change or add — a clause of a topic (governing
  law, liability, renewal, data protection, payment terms) or a clause a
  template calls for (`cm-*`, `da-*`, `nd-*`, `wh-*` … in js/ai.js). These
  can be put on paper: `riskEditTarget` finds the clause, or holds a new one.
- A few rules are ADVICE to the reader — a step to take, not words for the
  paper. All are in `uploadScanRules` (js/views/contract.js):
  - `u-legal` "Have qualified counsel review before signing" — added to EVERY
    upload's scan, unconditionally (the scanner's own comment: "always —
    honest disclaimer"). This is the one in the owner's screenshots.
  - `u-noext` "Document text could not be read automatically" and `u-ocr`
    "Quotes below come from a machine-read scan" — statements about the
    scan's own reliability.
  - `u-law` "Confirm governing law is …", `u-liab` "Check liability cap &
    indemnities", `u-term` "Confirm term, renewal & exit" — the manual
    checklist written only when no text could be read; there is no clause to
    open because no clauses were read.
  - `u-cp` "Counterparty not recorded" and `u-val` "Contract value not
    recorded" — record blanks. They are the Overview's Fill, not a redline;
    the list already leaves the `g-*` record blanks out for that reason.
- What happens today with `u-legal`: `riskItemsOf` lists it; `riskOpenOf`
  counts it in every number (the Redlines head "3", the Overview strip's
  "Risks found" tile in js/triage.js, the room's check badge and its
  "Copilot · Read · 6 to look at" fact in js/views/contract.js, the editor's
  Risks tab "3"); `riskEditTarget` finds no
  quote and no topic (`_rkKind` is null), so it answers a NEW clause after the
  last term — "New clause after 26. Notices" — and the walk opens the window
  holding an empty clause and asks Copilot to draft one from the risk's text.
  Copilot refuses, in red. Save stays grey. The walk still counts it ("Risk 3
  of 3"). The reader can only Skip or Discard.
- The filter that exists today, `_rkDraftable` in js/risks.js, drops only
  `g-*` ids and `recital` anchors.

### What to build

1. **ONE READING of "can this be put on paper".** A set of rule ids in
   js/risks.js — `RK_ADVICE_IDS` = `u-legal`, `u-noext`, `u-ocr`, `u-law`,
   `u-liab`, `u-term`, plus `u-cp` and `u-val` as record blanks (see the
   question below) — and `_rkDraftable` drops a finding whose id is in it.
   In js/risks.js rather than on the scanner, because findings are STORED on
   the record (`c.scan.findings`) as they were at scan time: a flag stamped by
   the scanner tomorrow is not on any scan already stored, and two sources is
   how they drift. The exclusion is by the RULE'S NATURE, never by "no clause
   found": "No data-protection terms detected" also finds no clause and IS
   paper-able — it holds a new clause, as the owner chose on 5 Oct.
2. **Everything follows from the one list.** Because every count and door
   reads `riskItemsOf` / `riskOpenOf`, the list, the fold, the Overview tile,
   the room's number, the bell, the editor's Risks tab count, "Risk k of n"
   and the end-of-walk counts all drop the advice rows at once. Nothing else
   is touched. Check that Risk View (`docXrayRows`) draws nothing for them
   already (anchor `doc`, no quote); if it does, say so to the owner rather
   than widening.
3. **Where the advice goes instead — the owner's call (see below).** Nothing
   is added anywhere in this part unless the owner picks a place.
4. The plain "Why" book (`rk_why_u_*`) keeps its keys; they become inert
   where the rule no longer draws a card. f506 (A) reads every id off the
   scanners and will still find a reason for each — unchanged.

### Tests

- Node: f484 or f503 gains — an uploaded contract's scan with `u-legal`,
  `u-noext` and `u-cp` in it: `riskItemsOf` lists none of them, `riskOpenOf`
  counts none, and `riskEditTarget` is never asked for one; a `t-dp` finding
  with no clause still answers `newClause`. f506 gains (E): every id a scanner
  can write is either in `RK_ADVICE_IDS` or carries a topic or a quote — a
  new advisory rule written tomorrow turns it red. Red at unmodified main.
- Browser: risks-in-the-redlines-card-verify and one-door-for-edits-verify —
  on an upload, the Redlines card shows no "Have qualified counsel" row, the
  tile's "N to look at" equals the rows drawn, and the walk's "Risk k of n"
  never lands on an empty new clause with a refusal.

---

## Waiting on the owner

- **Part 1: "Follows" or "Says less"?** Recommend "Follows".
- **Part 2: `u-cp` and `u-val` (counterparty / value not recorded).** They
  cannot be put on paper either — they are record fields the Overview's Fill
  answers. Recommend treating them like the `g-*` record blanks and leaving
  them out of the Redlines card too. Say so if not.
- **Part 2: where does the advice go instead?** Three answers, pick one:
  - **Nowhere** (recommend, for now). "Not legal advice" is already said by
    the rail's own line "Written by Copilot. Check it before you send it.",
    and the scan's reliability notes (`u-noext`, `u-ocr`) belong at the head
    of the scan's own panel, which already says how the text was read.
  - **The signing readiness list** — `u-legal` is about signing, so the
    Advise rung of `signReadiness` is its natural home. That is a new line on
    a page, so it is asked here, not built.
  - **The contract brief's watch-outs** — read on arrival, never a redline.
