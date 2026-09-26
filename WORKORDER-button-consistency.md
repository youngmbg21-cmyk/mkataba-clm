# WORK ORDER — THREE BUTTON INCONSISTENCIES

Young, 26 Sep 2026, the morning after the Compact button ladder was merged,
over three screenshots (Approvals & signing, Home, the Document tab):

> *"I still see a lot of inconsitencies. image 1, buttons should never wrap
> text. Image two, the buttons should be the same size and likely the size of
> the needs your decision card. Image 3, some buttons have dark outlines when
> the common approach is a light grey outline. Put these in a work job to be
> fixed. Prior to fixing these, I first need you to give me examples of how we
> can improve the design for the contracts and negotiations contract lists
> design."*

**NOTHING IS BUILT YET.** The owner asked for the design options for the
Contracts and Negotiations lists FIRST; this order waits behind that choice.
Build these three rules BEFORE the chosen list design, so the new list is built
on them rather than having to be re-dressed after.

Everything below was MEASURED in a real browser on the sample portfolio, in the
owner's own look (navy brand, light theme), on the tree the ladder was merged
into (bddd8e1). Item 3's colours were also read off the owner's own screenshot,
pixel by pixel.

---

## 1 · A BUTTON'S WORDS NEVER WRAP

**MEASURED.** "Open the gate" on the Approvals & signing page is
`.ui-btn.ui-btn-sm.ap-go` in the last column of a `table-layout:auto` table.
With the sample's own titles it fits at every width tried (1024 to 1440):
98 × 22, one line. **With longer titles — the owner's own book — it does not**:
three contract names lengthened and the table squeezed that column to 116px, and
the button broke onto two lines at 88 × 31. That is the owner's screenshot. The
same squeeze breaks "Value ≥ SEK 5M" in the Rule fired column onto two lines and
clips the Value column — the owner's screenshot shows `SEK 15.20M` cut off by the
column beside it.

**THE CAUSE IS TWO THINGS, AND BOTH ARE GENERAL, NOT THIS PAGE'S:**
- every button family carries `white-space:normal`, so any button whose
  container gets narrower than its words breaks them (the ladder set heights and
  weights and never said a label may not wrap);
- nothing gives a column that holds buttons a floor, so the table gives the
  squeeze to the buttons instead of to the one column built to give — the title.

**WHAT TO BUILD.**
- `white-space:nowrap` on the BASE rule of every button family, so no label can
  break anywhere at any width: `.ui-btn` (all three rungs), `.ui-link`,
  `.hm-tri-b`, `.rl-btn`, `.sc-stage-act`, `.reg-chip`, `.tpl-btn-xs`, and any
  other hand-dressed button class the sweep below finds. (`.hm-rverb` already
  has it.)
- A column that holds buttons takes its content's width and never gives it up:
  `width:1%;white-space:nowrap` on the cell in an auto-layout table; a pixel
  floor in a fixed-layout one. The column that gives is the TITLE's, which elides
  with the whole title on the hover — the Contracts table's own rule.
- The Approvals table: the rule and value columns are one line too (a short
  phrase and a figure; neither may break), and the title column is the give.
- **Fixed-layout tables need the floor, or nowrap turns a squeeze into a clip.**
  Measured already: on Contracts at 1180 wide the row-menu cell is 28px and its
  content 35px, so the menu is cut. Contracts, Negotiations and the Templates
  table each take a pixel floor on their action column.

**SAID OUT LOUD, NOT IN SCOPE:** the Home map's stage blocks ("Drafting ·
5 contracts") and the Insights category rows are CARDS that happen to be buttons
— two lines by design. The Negotiate page's queue tab is vertical text on one
line. None of them is a labelled button.

**THE NET.** A browser file that stages long contract titles, sweeps every page,
the contract room's five tabs, the Negotiate page and the main pop-ups at 1024,
1180, 1280, 1366 and 1440 wide, and fails on any LABELLED button (short words,
no block inside it) whose text takes two lines. A node claim that every button
family's base rule states `nowrap`, so a family added tomorrow is caught too.
Run it against the parent first: it must fail there on "Open the gate".

---

## 2 · ONE SIZE FOR A ROW'S BUTTONS ON HOME

**MEASURED.** *Needs your decision*'s verb is `.hm-rverb`: 22px tall, 12px,
weight 500, 8px side padding, white face, a light-grey edge. *Prepared for
you*'s verbs are `.hm-tri-b` — **a hand-sized family the Compact ladder
missed**: min-height 28, 13px, weight 600, 12px padding, and `.is-p` FILLED in
the accent on EVERY row ("Open it", "Review"), with `.is-plain` a borderless
grey word ("Put away"). Two rows of the same family, one card apart, in two
sizes; and a filled button on every row, which is the ladder's own rule broken
(one filled button per area; a repeated row's main act takes the accent's ink,
never the fill).

**WHAT TO BUILD.**
- The desk's verbs take the row rung, exactly `.hm-rverb`'s box: 22px, 12px,
  weight 500, 8px padding.
- The lead act ("Open it", "Review", "Serve the notice", "Chase") in the
  accent's ink with the light-grey edge — NOT filled. "Put away" is a quiet text
  button at the same height.
- Through the ladder's own classes (`.ui-btn.ui-btn-sm`, `.ui-btn-accent`,
  `.ui-link`), not a fourth copy of the same box. `.hm-tri-b` is also drawn by
  the dormant triage row (no caller today); dress it by the same rule so it cannot
  come back in the old size.

**SAID OUT LOUD.** The two cards' verbs do not share one right edge (the
decision rows end in a chevron, the desk rows in *Put away*). SAME SIZE is what
was asked; lining them up on one edge is left as it is unless the owner wants it.

**THE NET.** f385 extended: no hand-styled button family outside the ladder (a
sweep of the sheet for button classes stating their own height or weight).
home-page-verify stages a desk row (the sample book has none) and measures both
cards' verbs equal — height, size, weight — with none filled.

---

## 3 · ONE LIGHT-GREY OUTLINE FOR EVERY OUTLINED CONTROL

**MEASURED OFF THE OWNER'S OWN SCREENSHOT**, the Document tab's control row,
reading the pixel on each control's top edge:

| Control | Edge today | Token |
|---|---|---|
| Contract View · Plain English · X-ray | `rgb(28,56,114)` navy | `--accent-ink` |
| Export, Open Negotiate, the focus square | `rgb(203,211,208)` | `--btn-edge` = `--rule-strong` |
| A⁻ 14px A⁺ (text size) | `rgb(226,231,229)` | `--rule` |

Three outline colours in one row. The owner boxed the navy switch AND Export /
Open Negotiate as the dark ones, and left the stepper — so the owner's "light
grey" is the stepper's.

**ACROSS THE APP** (pages, the room's tabs, the Negotiate page, the ladder panel,
the clause editor, the New agreement doors and form, Upload, Share, the notes
drawer, alerts; every OUTLINED, UNFILLED control at rest):
- **Navy (`--accent-ink`)** — the three switches: Home's Count | Value
  (`.hm-map-seg`), the Document tab's view switch (`.doc-read-seg`), the Negotiate
  page's Internal | Counterparty (`.rl-segwrap`, drawn again in the clause editor
  and the ladder panel; the clause panel's History | + notes wears the same rule).
- **The accent at 45%** — the notes drawer's Add note / Reply (`.rl-np-send`), the
  desk verbs (`.hm-tri-b`), `.ui-btn-secondary` (portal, Templates), and
  `.redline-page .rl-btn` where it still resolves to it.
- **Amber** — Insights' "Read them now".
- **`#CBD3D0` (`--rule-strong`)** — every `.ui-btn`, the Contracts filter chips,
  the decision verb, the room's check squares, the Signing tab's Run / Write the
  brief.
- **`#E2E7E5` (`--rule`)** — the stepper, the Contracts segments (Table | Board,
  Cozy | Compact), the Calendar segments, the Send dialog's purpose segments, the
  Negotiate page's queue tab.

**WHAT TO BUILD.**
- `--btn-edge` is the ONE outline of every button-like control at rest —
  buttons, icon squares, steppers, segmented switches, filter chips, a text
  button that draws a box. Every one of them reads it; none names a colour.
- Its light value is the stepper's light grey, `#E2E7E5` (today's `--rule`). Its
  dark value keeps a VISIBLE edge on the dark ground — measure before choosing
  (today's is `#36423F`); it does not simply follow `--rule` into the dark theme.
- **A switch keeps the grey group edge and grey dividers; the lit half is filled
  in `--accent-fill` with white words.** The fill says which half is on; the
  outline no longer tries to.
- Hover may take the accent. Rest never does.

**NOT IN IT, SAID OUT LOUD.**
- **Text boxes and dropdowns.** A field's edge is what tells a reader where to
  type, and WCAG 1.4.11 asks 3:1 for it — which is why `--field-line` exists.
  They are not buttons and keep their own rule. (Worth knowing: the Obligations
  page's dropdowns draw the light `#E2E7E5` today while dialog fields draw
  `--field-line` — a separate inconsistency, for the owner to rule on.)
- **Coloured cards and tiles** — the Template book's tone bars, the New agreement
  door tiles, the Upload drop zone. They are cards, not outlined buttons.
- A FILLED button's edge is its fill.

**THE RISK, OWNED.** Every outlined control on the colour census's 20 screens ×
2 themes moves, so theme-tokens-verify moves. It is re-recorded ONLY after a
set-difference audit showing the whole difference is this change (the census is
already red on 19 screens at the parent, for other people's reasons — restore
those lines by hand, never absorb them). contrast-verify re-run.

**THE NET.** A browser sweep over pages, pop-ups and panels that fails on any
outlined, unfilled, resting button-like control whose edge is not `--btn-edge`
resolved live; the switch's lit half asserted filled, its group edge grey.

---

## ORDER OF WORK

1 → 3 → 2 (item 2 dresses the desk rows with the ladder classes that item 3
re-edges). One branch. f385 and compact-ladder-verify extended, one new browser
file for the wrap sweep; each new claim run against the parent first; the full
suite once at the end; the browser set compared with the parent check by check;
the census audited as a set difference. The record: a section in CLAUDE.md, the
story in docs/MAP-HISTORY.md, a run in BUGLOG.md.
