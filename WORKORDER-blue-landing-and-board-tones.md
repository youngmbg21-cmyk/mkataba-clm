# N — BLUE BY DEFAULT, PRESENT MODE THAT STAYS ON, SMALLER REFERENCES, A BOARD THAT WEARS THE BRAND, A SUMMARY BUTTON, A LEANER SUGGESTION CARD, A CLAUSES BUTTON YOU CANNOT MISS

**Owner-instructed 7 Oct 2026**, off two screenshots and the second HaTi Platform
mockup (`HaTi_Platform_2.html`): *"When you are in presentation mode in home page
when you move from board to explorer or the other way round, you should stay in
presentation mode unless you choose to exit. Also, per the attached mock up, and
in image 1, make the REF or contract numbers smaller in font size. Make the
landing color theme for the platform blue and move the blue button at the top to
be first. Then when changing colors the theme also per the attached mock up html,
the under tones in terms of colors should change in the board screen. Create a
work order... no coding yet."*

Nine parts. Each says what is wrong today, why, what to build, and how to prove
it. Nothing here is built yet.

---

## N-1 — PRESENT MODE SURVIVES THE BOARD ⇄ EXPLORER SWITCH

**Today.** On Home, press Present, then switch between Board and Explorer: the
screen drops out of presentation (full screen ends, the pointer/pen tools go).

**Why (found in the code).** Present asks the browser to make the Home page's
own element full screen (`hbPresent` → `hbPage().requestFullscreen()`).
Switching sides (`hbSetFace` → `hbMount` → `renderIntel`) REDRAWS the page, so
the element that was full screen is thrown away. The browser then ends full
screen by itself, and HaTi's own listener (`fullscreenchange` →
`hbPresent(false)`) reads that as "the reader chose to exit".

**Build.**
- Make full screen belong to something that SURVIVES the redraw — the content
  host the page is drawn into (or the document), not the page element itself.
- Keep `_hbPresenting` across the switch and re-dress the new page on arrival
  (`hbAfterMount` already calls `hbToolsPaint`, which applies `hb-presenting`).
- Exit only on the reader's act: the Present button, Escape, or the browser's
  own full-screen exit — never on a side switch. A browser exit that happens
  BECAUSE of our own redraw must not count (one flag raised around the swap).
- The pen's drawing is cleared on a side switch (it was drawn over the other
  side); the chosen tool is kept.

**Prove it.** A browser check: Present on Board → switch to Explorer → still
presenting (full-screen element set, `hb-presenting` on the page, tools shown)
→ switch back → still presenting → Escape → out. Run it against unmodified main
first: the middle step must FAIL there.

---

## N-2 — REFERENCE NUMBERS ONE SIZE SMALLER

**Today.** On the Contracts and Negotiations lists, "MK-441" is 13px (the body
size). The mockup draws it at 12.5px, weight 500, in Geist Mono.

**Build.**
- Every reference number drops to the label size, **12px** (HaTi uses whole
  pixels only, so the mockup's 12.5 becomes 12), keeping Geist Mono and 500.
- One rule, every place a reference is printed in a list or panel: the list's
  REF column (`.reg-mk`, both seats), the side panel's eyebrow (`.ins-ref`),
  the contract header's quiet line (`.room-sub-id`, already 12 — check), the
  stream drawer's rows, and any other list that prints `contractRef(c)` in the
  reference face. Find them all by searching for `--font-ref` and
  `contractRef(` in list builders before changing anything.
- Row heights must not change (measure a row before and after).

**Prove it.** contracts-page-verify reads the REF cell's computed size as the
label token (a relation, not "12px"); inspector-verify the same for the panel.

---

## N-3 — HaTi LANDS ON BLUE, AND BLUE COMES FIRST

**Today.** A browser that has never chosen a colour gets Green. The two colour
swatches in the top bar are Green then Blue.

**Where the choice lives.** In each browser (`hati-brand` in local storage),
read by `brandNow()` / `themeNow()` in js/app.js and, before the first paint, by
the small script at the top of index.html. Both fall back to green today.

**Build.**
- The fallback becomes **Blue** (`navy` inside the code) in all three places
  together — `brandNow()`, `themeNow()`, and the pre-paint script — or the first
  frame flashes green before turning blue (the 10 Sep fault, f96).
- Someone who has ALREADY picked Green keeps Green (their stored choice wins).
  **Open question for the owner below.**
- Swap the two swatches so Blue is first, in the top bar and in the phone's
  appearance menu (`M_THEME_SWATCH` order in js/mobile.js).
- Places that print a fixed brand colour because they have no theme to read —
  the browser-tab icon, the status-link page's bar, e-mails — follow the
  landing brand: the blue `#264C9E`.
- The counterparty's own page: decide with the owner whether it lands blue too
  (it reads the same key today).

**Prove it.** f96 (the pre-paint script mirrors the app) updated to the new
fallback; a browser check in a fresh profile lands blue with no green frame;
theme-tokens-verify re-recorded as a set difference (the default screens move
from the green ramp to the blue one — expected, and audited before saving).

---

## N-4 — THE BOARD'S UNDERTONES FOLLOW THE BRAND

**Today.** Under the Blue workspace the Home board is still teal-green: the
dotted ground, the KPI tiles' top edges, the glow, the lines and the frosted
cards (screenshot 2). The board has its own colour set (`--hb-*` in index.html,
one for the Dark screen and one for the Light "Frosted" screen), and every
value in it is a typed teal.

**How the mockup does it.** Everything is drawn from a handful of brand tokens
(`--acc`, `--acc-soft`, `--acc-tint`, `--acc-line`, `--ground`); switching to
Blue changes those tokens, so every tint underneath turns blue with them.

**Build.**
- Give each board screen a Blue answer: `#hb-page.hb-light` and `.hb-dark`
  under `:root[data-brand="navy"]` set the same `--hb-*` names to blue
  equivalents. Glow, lines, card washes, the dotted ground, the gradient stops
  and the shadow tint all move to the blue ramp. Status colours (amber, ruby,
  green) DO NOT change — they mean something.
- Where the board's own JavaScript types a teal (`HB_HUES[0]` `#38CDB8` for
  the first series, the tile edge colours), read the brand instead, so a chart's
  lead colour is the brand's.
- Light board, blue: ground from `#F4F6FA` to white, accent ink `#1C3872`,
  glow `#264C9E`. Dark board, blue: a deep navy stage (in the family of
  `#0F2448` → `#060C18`) with a lighter blue glow. Final values are picked by
  measuring contrast (every word on its own ground clears AA, as contrast-verify
  asks) and shown to the owner as a photo of both screens before merging.
- **Explorer** is always dark and shares the Dark screen's tokens; it follows
  the brand with them. Its canvas also types teal in js/views/intelligence.js
  (the hub glow and grid lines, `rgba(56,205,184,…)`); those read the board's
  `--hb-gw` / `--hb-ln` instead. **Open question below** in case the owner wants
  Explorer to stay teal.

**Prove it.** A browser check switches the brand on Home and asserts the
board's ground, glow and a tile edge each MOVE to a blue value and back,
measured as painted colours; contrast-verify on both board screens in both
brands; theme-tokens-verify re-recorded as an audited set difference;
dark-no-white-patches-verify still clean.

---

## N-5 — "SUMMARISE MY BOARD" IS A BUTTON

**Owner, 7 Oct 2026** (off a screenshot of the board's top line): *"summarise my
board should be a button."*

**Today.** It is drawn as a text link (`.hb-link hb-bs-go` in js/views/homeboard.js,
label `hb_bs_btn`): the sparkle and the words in the glow colour on nothing, so
it reads as a caption rather than something to press.

**Build.**
- Draw it as the board's own outlined button (`.hb-btn`: the control height,
  a hairline edge, the board's card wash), keeping its sparkle, its words, its
  cost on the hover and its greyed state with the reason when there is no
  Copilot key or a summary is already running. The same press, the same
  handler (`data-hb-why`) — only the dress changes.
- It stays where it is (the right end of the LIVE · COUNTED line), so nothing
  on the board moves; the line's height does not grow (measure before/after).
- It follows N-4: on the Blue workspace its edge and ink are the board's blue.
- Any other board action still drawn as a bare link and doing the same kind of
  job (asking Copilot to write something) is listed for the owner rather than
  changed on the way past.

**Prove it.** A browser check finds the control, asserts it is a button with a
painted border at the control height, presses it (with a stubbed Copilot) and
sees the summary start; and greys it with its reason when no key is set.

---

## N-6 — "ASK FOR A CHANGE" GOES FROM COPILOT'S SUGGESTION CARD

**Owner, 7 Oct 2026** (off a screenshot of Edit with Copilot): *"ask for change
seems redundant when you already have the asking about below it. Put work order
to delete it."*

**What it does today (found in the code).** Nothing of its own. Pressing it
(`data-ce-refine` in js/views/clauseeditor.js) closes the expanded view, puts the
cursor in the ask box at the foot of the panel and prints "Say what to change
about it in the box below." The ask box is already there, already scoped to the
clause ("Asking about · This clause"), one glance below the card.

**Build.**
- Remove the button from BOTH places the card builder draws it: a suggestion
  card and a risk card (two call sites, one label `ce_refine`). The suggestion
  card's foot then holds Apply alone (plus N-7's answer on the thumbs).
- Delete its handler and retire `ce_refine` / `ce_refine_hint` by leaving them
  inert in both language books (the house rule for a retired key).
- The template builder has its OWN "Ask for a change" (`tb_pb_refine`,
  `tb_ph_refine`) on a different screen. Not touched; named to the owner in the
  summary in case the same reasoning applies there.

**Prove it.** clause-editor-verify (and one-copilot-editor-verify) assert no
`[data-ce-refine]` on either card kind, Apply still files through
`negoEditClause`, and the ask box still takes a follow-up about the suggestion.

---

## N-7 — THE THUMBS UP / DOWN: THEY RECORD NOTHING TODAY

**Owner, 7 Oct 2026:** *"how do the thumbs up or down add value?"*

**The honest answer (found in the code): today they don't.** A press only lights
the thumb on screen (`card.vote` in js/views/clauseeditor.js). The mark is not
saved, not sent to the server, not written to Copilot's trace (`js/aitrace.js`),
not counted on any report, and never fed back to Copilot. It is gone when the
editor closes. A control that looks like feedback and goes nowhere is the
"dead button wearing a live one's clothes" fault this codebase already names.

**DECIDED (owner, 7 Oct 2026): "okay remove the thumbs up and down."** Build the first way below; the second is kept only as the record of what was weighed.

**The two ways that were weighed:**
- **Remove them (recommended).** Delete both thumbs from both card kinds, their
  handler and their CSS; nothing else reads them, so nothing else changes.
- **Make them real.** Write the vote onto the suggestion's trace record
  (`aiTraceSave`), show the counts where Copilot's results are already reported
  (Settings → Copilot engine → results), and say so on the hover ("Tells your
  admin how useful this suggestion was"). It still would not retrain Copilot —
  HaTi has no way to do that — so its value is a usefulness report for admins.

**Prove it.** Whichever is chosen: no thumb on a card (remove), or a pressed
thumb appears on the trace record and in the admin's results after a reload
(make real).

---

## N-8 — THE CLAUSES BUTTON IS "TONED" (owner picked it by name, 7 Oct 2026)

**Owner:** *"provide proposals to me [to make] the highlighted button more in
focus or important so that users do not miss it"*, then, off three drawn options
(Toned · Leading · Arrival glow, artifact "Clauses Button Options"): *"add toned
to the work order."*

**Today.** The Document tab's Clauses button (`#ws-th-door`, painted by
`docThreadDoorPaint` in js/views/contract.js) is a plain outlined button; only
its small count words ("1 to look at") carry a colour, so with the clause list
closed it is easy to miss.

**Build — the button wears the worst flag's colour.**
- When any clause is flagged, the WHOLE button takes the tone of the worst mark
  — the same reading the count already uses (`docThreadWorst(rows)`: red ·
  amber · blue): the tone's pale wash as its background, the tone's line as its
  edge, its icon in the tone's ink, the word "Clauses" in the page ink.
- The count becomes a SOLID pill in the tone's dot colour with white figures
  ("1 to look at"), so the number is the first thing seen.
- Add the clause-list icon before the word (a drawn icon, not a glyph).
- When no clause is flagged it is the plain outlined button it is today — it
  only stands out when there is something to look at.
- While the list is OPEN (`is-on`) it keeps its pressed look; the tone stays so
  the reader still sees how serious it is.
- Night mode uses each tone's night answers (`--st-*-bg/-fg/-dot`), checked
  with contrast-verify.
- Size, place and height unchanged: nothing on the row moves, the contract's
  first line does not move (measure before/after), no band, no motion.
- The Negotiate page's own needs-you button keeps its dress (out of scope; named
  to the owner if they want it to match).

**Prove it.** A browser check on a contract with one amber clause: the button's
painted background and edge are the amber tokens and its count is a filled pill;
on a red clause they are the ruby tokens; on a contract with nothing flagged the
button is the plain outlined control. Run against unmodified main first: the
tone assertions must fail there.

---

## N-9 — "YOUR MOVE" STANDS IN ONE STRAIGHT LINE ON THE CONTRACTS LIST

**Owner, 7 Oct 2026** (off a screenshot of the Contracts list): *"the your move
should be in a straight line."*

**Today.** In the Stage column, "· your move" / "· their move" is written straight
after the stage pill (`stageMove` beside `contractStatusDotHtml` in
`renderRegister`, js/views/register.js). The pills are different widths
("Drafting" is shorter than "In Review"), so the words start at a different
place on every row and zig-zag down the page.

**Build.**
- The stage pill sits in a slot of ONE fixed width per page, wide enough for the
  longest stage word drawn on that page in the reader's language (measured, not
  typed — Swedish words are longer), and "· your move" starts right after that
  slot. Every row's move word then starts at the same x.
- The pill itself does not stretch; only its slot is fixed, so short pills keep
  their own size and the column reads as two neat sub-columns.
- A row with no move (nothing waiting) leaves the slot's right side empty; a
  row with "lives in Negotiations" (`lives`) lines up the same way.
- Nothing else moves: column widths, row heights and the contract's paper are
  unchanged. The Negotiations seat already puts whose-move in its own column and
  is not touched.
- The pill must never be cut off by the column: if the slot plus the move words
  are wider than the column, the move words shorten with "…" (whole word on the
  hover), never the pill.

**Prove it.** contracts-page-verify measures the left edge of every visible
"· your move" on the page and asserts they are equal (to the pixel), in English
and Swedish; and that no stage pill is clipped (its painted width equals its
own content width).

---

## QUESTIONS FOR THE OWNER BEFORE BUILDING

1. **People who already chose Green** — keep their Green (recommended), or move
   everyone to Blue once?
2. **The counterparty's page** — land on Blue too, or keep whatever our side
   uses? (Recommended: Blue, the same as ours.)
3. **Explorer** — follow the brand like the board (recommended), or stay teal?
4. ~~The thumbs (N-7)~~ — decided: remove them.

## ORDER OF WORK

N-1 (a fault, smallest) → N-6 → N-7 → N-8 → N-9 → N-2 → N-5 → N-3 → N-4, one branch, each part checked in the
browser before the next. Full suite once at the end; merge on the owner's word.
