# WORK ORDER — Copilot panel tidy-up (Edit with Copilot)

**Status: NOT STARTED. Written 7 Oct 2026. Owner: "Header line, Shaded column, Sticky bar. No coding yet." Build only when the owner says go.**

**What the owner has seen and picked:** "Copilot Panel Tidy-up"
(https://claude.ai/artifact/Ajp6ddgN9Rbmf893E4LTAz). Three parts, three named
options each. The owner picked ONE BY NAME per part:

| Part | Picked | Not picked (do not build) |
|---|---|---|
| A · The ask box | **Header line** | Token, Outlined |
| B · The facts under a risk | **Shaded column** | Ruled, Framed table |
| C · Suggested wording | **Sticky bar** | Flat strip, Actions on top |

The picks are the owner's yes to each option AS DRAWN on that page. That lifts
the Six Questions' refusals only for what the page shows. Anything beyond it
(a new band, a new door, another place on the screen) goes to the owner first.

**Two earlier rulings this reverses (owner's yes given by the picks; say both
in the morning summary and replace the old lines in CLAUDE.md's MAP):**
- 6 Oct 2026, "one Copilot editor": the scope tag rides INSIDE the ask box
  "at no height". Header line gives it its own slim line (about 22px).
- 5 Oct 2026, "FILL THE PANEL" (Expand → `ceRenderFull`, picked over "Grow in
  place" and "Read it on the paper"). Sticky bar removes Expand from the
  suggestion card.

---

## Where things stand (read before touching anything)

Read CLAUDE.md, then grep docs/MAP-HISTORY.md for these headings and read
each in full: "EDIT WITH COPILOT", "CLAUDE.MD TRIM, 7 OCT 2026",
"RISKS TO LOOK AT", and "FILL THE PANEL".

Names this order touches (grep, never trust a line number):
- Part A: `ceRenderScope`, `#ce-scope` / `.ce-tag`, `.ce-askbox`,
  `.ce-ask textarea`, `CE_TAG_X`, `CE_ASK_LINES` (js/views/clauseeditor.js).
- Part B: the facts list `ul.ce-read` built in `ceTurnHtml` from
  `ceReadList()`.
- Part C: `ceCardHtml` (the "Suggested wording" card), the Expand press,
  `ceRenderFull` / `ceFullClose` / `#ce-full` / `_ceFull`, `ceRiskAnswerHtml`.

**DUPLICATION WARNING (Bug Fix Rule 1).** The facts list and the suggestion
card are drawn by SHARED builders, on BOTH the Suggestions tab and the Risks
tab, and on the counterparty's seat where the editor is drawn
(`ceSide()`, no Copilot there; check what still draws). Find every place each
builder is called before changing it. Fix every place, or tell the owner in
plain English which one was left and why.

---

## Part A — Header line (the ask box)

- The scope tag ("This clause", "Whole contract", the first words of a
  highlight, "Suggest deleting") moves out of the text onto its own slim line
  at the top of the box: a small grey "Asking about" then the tag.
- The tag is a FILLED pill: the accent green with white words, and a white ×
  the hand can find (at least 16px to press). Asking about highlighted words
  stays purple, as today. Every × keeps today's act and words on hover
  ("Ask about the whole contract", "Back to this clause").
- The typed question then starts at the left edge and uses the full width. No
  more narrow column beside the tag.
- ONE quiet focus mark: while typing, a 2px accent line along the bottom
  edge of the box only. Remove the second ring: today the box draws a ring on
  `:focus-within` AND the typing area draws the app-wide
  `textarea:focus-visible` ring inside it. Fix by SCOPE on
  `.ce-ask textarea` (never `!important`), and keep a visible keyboard focus.
- The placeholder text is unchanged.
- Tests: the editor's existing ones (f245, f505, f523, f537,
  clause-editor-verify, one-copilot-editor(-plain)-verify,
  copilot-panel-tidy-verify). Add to a browser check: the tag line exists; the
  textarea's left edge equals the box's inner left edge; exactly ONE painted
  focus edge while typing (measure computed outline AND box-shadow on both the
  box and the textarea).

## Part B — Shaded column (the facts under a risk)

- The label column (Our playbook · What we settled before · What they asked ·
  The wording) gets a pale accent fill, dark-green labels in normal case (not
  capitals), and a 2px pale-green line down its right edge between labels and
  explanations. Faint lines between rows; one thin border round the block.
- The explanations stay on white in the strongest ink.
- Same look wherever `ul.ce-read` is drawn (THE CLOTHES FOLLOW THE BUILDER).
- Light and dark both: the pale accent rungs have dark answers on `:root.dark`
  (`--color-accent-50/-100`); an ink on that wash is `--accent-ink`.
- Tests: add to a browser check that the label cell's background differs from
  the value cell's, and that the separating line is painted (style AND width).

## Part C — Sticky bar (suggested wording)

- The grey card around "Suggested wording" goes, and so does the small window
  inside it with its own scroll bar. The wording is printed IN FULL, with its
  marks, straight on the panel, with a 2px accent line down its left side.
  The heading row keeps "Suggested wording" and the COPILOT chip, and the
  "Rests on…" line stays under it.
- The whole panel scrolls as ONE. There is no scroller inside the suggestion.
- Apply · Ask for a change · 👍 👎 sit after the last word, and STICK to the
  bottom of the panel's scroll while any part of the suggestion is on screen
  (`position: sticky` inside the rail's scroller, with a hairline and a soft
  shadow above it). Once the suggestion scrolls out of view, the bar goes with
  it.
- Expand is removed from the card. Whatever Expand's page showed that the card
  did not (Copilot's fuller explanation, "where it goes") is printed under the
  wording in the same scroll. Retire `ceRenderFull`/`#ce-full` only if NOTHING
  else opens it; otherwise leave it and tell the owner what still opens it.
  A retired i18n key is left inert in BOTH books.
- A REFRESH LANDS AT THE SAME SPOT: if the panel's scroll position is kept
  today, it is still kept.
- Tests: f505, f508, f537 and selected-card-and-advice-verify read the card's
  current shape, so update them FOR THE NEW SHAPE ONLY where they pin the old
  one, and say each change in the summary. Add to a browser check: no element
  inside the suggestion scrolls (scrollHeight == clientHeight); Apply is inside
  the rail's visible box when the suggestion's first line is at the top; no
  Expand button is drawn.

---

## Order of work and checks

1. Parts in order A, B, C, one commit each.
2. `npm run lint` first, zero errors.
3. Run only the affected test files together in one command until green; the
   full suite once at the end.
4. Every new check is run against unmodified main first: it must FAIL there.
5. PHOTOGRAPH WHAT YOU BUILT: screenshots of both tabs (Suggestions, Risks),
   light and dark, a long suggestion, and a long typed question, compared
   against the owner's page.
6. Update THE MAP in CLAUDE.md (at most four lines each, replacing the two
   reversed rulings) and append the story to docs/MAP-HISTORY.md under
   "EDIT WITH COPILOT".

## Out of scope (BUGLOG line, never a fix)

Anything else in the editor, the Ladder tab, the Negotiate page, the phone,
and the Home board's work order (docs/WORKORDER-board-draws-what-you-ask.md).

## The morning summary (plain English, for the owner)

What changed in each part, whether it is changed everywhere the panel is drawn,
the two reversed rulings, what Expand's page used to show and where that now
lives, and anything left alone and why.
