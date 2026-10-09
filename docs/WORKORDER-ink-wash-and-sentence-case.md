# WORK ORDER — Ink Wash and sentence case (HaTi without grey)

**Status: WRITTEN 9 Oct 2026. NOT BUILT.** Build only when the owner says so.

**The picture the owner chose:** artifact "HaTi Without Grey",
https://claude.ai/artifact/JNp1yDuDXqKX4BR1ktDS4Y. A copy of the page is
saved beside this file as `docs/WORKORDER-ink-wash-and-sentence-case.html`.
Open it in a browser and use **View: Today / Chosen**, **Theme** and **Mode**
to see the target. Five screens are drawn: Contracts, Overview, Document,
Negotiate, Obligations. That page is the picture. This file is the rules.

**The owner's words, in order (9 Oct 2026):**

1. *"I have the grey fonts in hati. Create a proposal where grey is not a font in hati. All current grey colors should be a mix of black, the theme color of Green or Blue depending on the theme mode you have selected or any other ideas."*
2. *"Note that this should not impact the paper contract."*
3. *"Dark mode should stay as is today as in black dark mode."*
4. *"Let's go with ink wash … Also Headers being in small letters per the artifact and Not Headers in Capital letters like in Hati."*
5. *"Also, do not change the colors of the redline cards Buttons."*
6. *"The proposal should extend to the pop ups as well."*
7. *"Please exclude the Type Scale from this work."* and then *"And from the artifact."* (done: the page no longer shows it.)

Three options were shown: Ink Wash, Two Inks and Brand Slate. **Ink Wash was picked by name.**
Two Inks was turned down because the theme colour means "you can press this" in
HaTi (MAP-HISTORY: "a neutral-grey control reads as furniture", and accent ink
marks a pressable thing). Labels in accent ink would read as links.

---

## THE TWO CHANGES

### Change 1: Ink Wash (light mode only)

Every grey in light mode becomes ONE ink: **black mixed with the theme
colour**, with its quieter shades thinned by a **pale wash of the same theme
colour** instead of white. Green HaTi gets green inks and Blue HaTi gets blue
inks.

How each value is made (oklab mixing; `a500/a600/a700` = the brand's accent ramp):

- `base` = color-mix(in oklab, a700 62%, #000)
- `wash` = color-mix(in oklab, a500 45%, #fff)

| role | today (Green and Blue alike) | formula | **Green** | **Blue** |
|---|---|---|---|---|
| primary text, `--color-text`, `--color-neutral-700/800/900` | #141F1D | base | **#032E2A** (14.7:1) | **#091938** (17.4:1) |
| secondary text, `--color-neutral-500/600` | #5A6866 | base 66% + wash | **#3A5F5A** (7.1:1) | **#374A6D** (8.9:1) |
| quiet text, `--color-neutral-400` (= `--cap-ink`) | #6B7876 | base 49% + wash | **#547974** (4.8:1) | **#50648A** (6.0:1) |
| greyed-out text (disabled) | #A9B3B1 | base 20% + wash | **#84A8A3** | **#7F94BC** |
| strong border, `--color-neutral-300` | #CBD3D0 | a600 30% + white | **#BED6D1** | **#BAC8E4** |
| divider, `--color-neutral-200`, `--color-divider` | #E2E7E5 | a600 16% + white | **#DCE9E6** | **#DAE2F1** |
| fill, `--color-neutral-100`, `--surface-2`, `--color-chat-bg` | #EEF2F0 | a600 7% + white | **#F0F5F4** | **#EEF2F9** |
| page ground, `--color-bg` | #F4F6F5 / navy #F4F6FA | a600 5% + white | **#F4F8F7** | **#F3F6FB** |

The numbers in brackets are contrast on white. 4.5:1 is the pass mark for normal text.
These are the hex values to type. **Do not put `color-mix()` in the tokens.**
Store hex, as the ramp does today, so the `-rgb` channel copies and the colour census keep working.

Also:
- **Grey status pill** (`--st-gray-bg/-fg/-dot/-line`, Draft, Under review, `.sev-low`): bg = fill, fg = secondary, dot = quiet, line = strong border.
- **~54 stray grey codes** typed straight into the code (Tailwind slate and gray: `#94a3b8 #64748b #475569 #98A2B3 #475467 #6b7280 #9ca3af #cbd5e1 #e2e8f0 #f1f5f9 …`): index.html 34, js/views/negotiation-css.js 13, js/aichart.js 6, js/views/calendar.js 1. Each one becomes the matching token above (`var(--color-neutral-N)`, never a new literal). Leave `var()` fallbacks alone, per CLAUDE.md ("never rewrite a `var()` fallback").
- **NOT the standalone documents.** js/views/weekly.js, js/views/healthreport.js, emails, PDF/Word exports and clipboard HTML carry literal colours by rule ("A STANDALONE DOCUMENT CARRIES NO `:root`"). Leave them as they are. This was the owner-facing suggestion, and the owner has not asked for them.

### Change 2: Sentence case for headers and labels

"ESSENTIALS" becomes "Essentials", "COUNTERPARTY" becomes "Counterparty", "WORK" becomes "Work".
Today about 260 rules set text in capitals (`text-transform:uppercase`: 92 in index.html, 172 across 42 js files).

- The one shared label list is the `:root :is(.sec-f-l, …)` rule beside `--cap-ink` / `--cap-ls` (grep `CAPS LABELS ARE NOT BOLD`). The column heads list follows it (`.ins-lt th, .reg-table th, …`). Change these two first: `text-transform:none`, `letter-spacing:0`.
- Then sweep every other `text-transform:uppercase` in index.html and js/ (both shells, the phone too, and their page). The rule is **headers and labels**. Leave alone:
  - contract references (`refHtml` → `.hati-ref`), which keep their code style;
  - keyboard keys;
  - words that really are capitals in their text (KES, USD, NDA). Only the CSS capitalising goes; text is never rewritten.
- Check i18n.js for labels TYPED in capitals in either language (grep the two books for all-caps values). A label typed in capitals stays in capitals after the CSS goes.
- `--cap-ls` becomes `0` (or is no longer read).

---

## WHAT MUST NOT CHANGE (each one is the owner's own rule)

1. **Every text size.** The type scale was shown and then taken out (*"exclude the Type Scale"*). No `--t-*` token moves, no `font-size` changes anywhere.
2. **Dark mode, exactly as today.** Black ground, panels, every ink. Change light values only.
3. **The contract paper.** The sheet, every word on it, clause numbers, subtitle and rule, page footer, and the red and green redline marks. That covers the Document tab, Negotiate, Home's Paper (Clean and Redlined), their page, the Signing copy and print. The paper's own tokens (`--color-doc-text`, `--color-doc-muted`, `--color-doc-rule`, `--color-page*`) stay as they are. **TRAP: anything on the paper that reads `--color-text` or a `--color-neutral-*` step would change with the ramp.** Before the change, record the computed colours of the paper's text, numbers, rules and marks on each surface. After the change they must be EQUAL. Where one moved, pin it on the paper scope to today's literal (e.g. `--color-text:#141F1D` inside the sheet). Do not pin it globally.
4. **The buttons on the redline cards.** Accept · Reject · Counter · Edit · Send · Review · Ladder · Discard (`rlRowFaceVerbs`), "Send all · N not sent" (`rlUnsentSendHtml`), "Send to <them>" (`rlDecisionsSendHtml`) and their hover states. Same check: record the computed colour, border and fill before, and require EQUAL after, on every seat that draws the row (`banded: true`). Pin where needed.
5. **Red danger buttons** (Delete, Discard and other `danger` buttons) in pages and pop-ups, and the amber, green and red status colours (`--st-amber-*`, `--st-green-*`, `--st-ruby-*`).
6. **Contract wording shown inside a pop-up** (a clause quoted in a dialog or a drawer) keeps today's colours, like the paper.
7. **No layout, spacing or size moves. No new band, banner or notice** (CLAUDE.md "NO NEW BANDS").

## WHERE IT MUST SHOW (pages AND pop-ups)

Every page on desktop, the phone (js/mobile*.js reads the same tokens), the
counterparty's page (js/views/portal.js), Home's Board and Explorer (check the
`--hb-*` tones: the board has its own palette, and `.hb-ag-work` maps the app's
tokens onto `--hb-*`). Pop-ups too, as the owner asked:
- dialogs (`openModal`, `confirmDialog`);
- side drawers (Settings, Notes, the one panel's three faces);
- dropdown lists and menus (`selectMenuSweep` lists, More menus, `rlSelMenu`, `#ca-pop`, `.hb-rmenu/.hb-pmenu`);
- toasts and hover hints.

The browser's own native `title` tooltip cannot be styled. Leave it.

---

## OPEN QUESTION — ASK THE OWNER BEFORE BUILDING

**How heavy should the new sentence-case labels be?** The artifact draws them at
**600 (semi-bold)**, because a small-letter label looks smaller than the same
label in spaced capitals. **But the owner ruled on 20 Sep 2026 that field names
"should not be in bold letters"** (`--cap-w` = body weight 400, comment
"CAPS LABELS ARE NOT BOLD"). That ruling stands until the owner reverses it.
Offer three choices: 400 (today, the ruling), 500 (the resting control weight
`--w-label`), or 600 (as drawn). If there is no answer, build 400.

---

## TRAPS (read before typing)

- **Specificity, navy vs dark.** `:root[data-brand="navy"]` (0,2,0) OUTRANKS `html.dark` (0,1,1). Blue's light inks must go in `:root[data-brand="navy"]:not(.dark)`, the way `--color-bg` already does (grep `:root[data-brand="navy"]:not(.dark)`). Otherwise Blue's dark mode turns into light inks.
- **Every changed light token must already have a dark answer** in `html.dark`. If dark has no line for a token you change, add one carrying TODAY's dark value. Otherwise dark inherits the new light value.
- **The `-rgb` channel copies.** Where a neutral has an `-rgb` twin (Tailwind `/opacity` classes), change both together.
- **Today Blue wears green-tinted greys.** The neutral ramp is defined once and navy never redefines it. That is why Blue needs its own block.
- **The Tailwind blob in index.html is GENERATED.** Never edit it. Override in HaTi's own sheet.
- **Colour census.** `test/chromium/theme-tokens-verify.js` + `theme-tokens-baseline.json` WILL go red. This is an owner-owned palette change, so re-recording is allowed. Audit it first as a SET DIFFERENCE: every colour that left must be a grey listed above, and every colour that arrived must be an Ink Wash value. Nothing else may move.
- **Tests that pin capitals or greys.** 16 test files mention `uppercase`. f175, pages-read-alike, button-consistency, contrast, dark-no-white-patches and test/tokens.js pin colour RELATIONS. Update a claim IN PLACE, keeping what it guards. Never delete a test.
- **f232 / f48** if any js file is touched to remove a literal.

## HOW TO CHECK (CLAUDE.md "HOW TO TEST ECONOMICALLY")

1. `npm run lint` first.
2. A new browser check, `test/chromium/ink-wash-verify.js`, that measures:
   - (a) Light, Green and Blue: label and caption inks equal the table above. No computed text colour on any page or pop-up is one of the stray greys.
   - (b) Dark, Green and Blue: every ink EQUAL to today (record today's values from main first).
   - (c) The paper: text, numbers, rules and redline marks EQUAL to today, on the Document tab, Negotiate, Home Paper and their page.
   - (d) The redline card buttons: colour, border and fill EQUAL to today.
   - (e) Danger buttons and status pills EQUAL to today.
   - (f) No header or label has `text-transform:uppercase` (references excepted).
   - (g) No font-size moved.
   Run it against a worktree at unmodified main first: (a) and (f) must FAIL there, and (b)–(e), (g) must PASS ("A CHECK THAT PASSES AGAINST THE PARENT IS A DESCRIPTION").
3. Photograph Contracts, Overview, Document, Negotiate, Obligations, a dialog, a drawer and a dropdown in Green and Blue, light and dark. Compare with the artifact.
4. The full suite once, at the end.

## AFTER BUILDING

- Update THE MAP in CLAUDE.md ("LOOKS: TOKENS, TYPE …") in at most four lines: the Ink Wash ramp per brand, labels in sentence case, and paper and redline-card buttons pinned. Flag `--cap-ls` as stale if retired. The story goes to docs/MAP-HISTORY.md under "INK WASH AND SENTENCE CASE".
- Plain-English summary to the owner (Bug Fix Rule 5).
