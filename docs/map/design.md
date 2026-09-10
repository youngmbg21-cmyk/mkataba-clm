# HaTi — design

*type, colour, tokens, spacing, icons, the shell and nav, corners, buttons, themes*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## BELOW 1440 THE SIDEBAR FLOATS INSTEAD OF PUSHING (owner-asked 13 Aug 2026; the line has been 1500, 1280, 1536 and is now 1440 — see the entry under SEVENTEEN THINGS)

Reported from a ThinkPad: expanding the sidebar squeezed every page. It cost the page 192px (256 expanded against the 64px rail) and NOTHING ADAPTED — every layout rule in this product measures the WINDOW, while the page gets the window minus the sidebar. So opening the nav shrank the page by a fifth and the layout carried on as though it had not.

THE NUMBER IS DERIVED, NOT PICKED, AND IT HAS MOVED THREE TIMES — 1500 → 1280 (24 Aug) → 1536 → **1440** (25 Aug, twice in one day). **THE ARITHMETIC WAS NEVER THE PROBLEM; THE QUESTION WAS.** 1280 came from 1040 (the design's own console) + 240 (the column), which asks *does the design still fit*. The line has to answer *is this a screen where giving up 176px of page is felt*, and the only authority on that is the owner reporting from a real machine. Two did, a day apart: a ThinkPad said the push was a shove, and a 15.6-inch 1920x1080 panel said it wanted the push back. **SO THE LINE'S JOB IS TO SEPARATE THOSE TWO LAPTOPS**, and 1440 does it — everything up to and including 1440 floats, 1536 and 1920 push. That 15.6-inch panel reports exactly **1536** CSS px at Windows' usual 125% scaling, which is why an inclusive `<=1536` caught it on the boundary itself. NAV_DRAWER_W / navDrawerActive() (js/app.js) is the one reading, matched by the `max-width:1440px` block in index.html — **the pair that can silently disagree, which is what home-page-verify pins now rather than the number**. **NOTHING BELOW THE LINE CHANGED**: the rail, the floating layer, the untouched stored preference and the scrim all behave exactly as they did.

- BELOW: `#side-nav` is `position:fixed`, 64px, and applyRail holds a 64px TRACK under it, so it widens to 256 OVER the page and the page's own width never changes. That is what makes rail-at-rest safe down here: opening and closing move nothing. MEASURED at 1280/1366/1440 — the content box is identical before, during and after. (ABOVE the line the DEFAULT is now the OPEN column — the SAP treatment, 20 Aug 2026, owner-approved render; railCollapsed()'s null default flipped to false. Below the line navDrawerActive() still wins and nothing changed; a stored choice still beats both.)
- ABOVE: nothing moved. The rail is still the reader's own remembered choice and expanding still PUSHES, which is what somebody with the room asked for.
- THE STORED PREFERENCE IS READ, NEVER WRITTEN, BELOW THE LINE (toggleRail returns early into setNavDrawer). Flipping a preference the width is not honouring would silently change what they get back on a big screen. It comes straight back above the line.
- IT USED TO BE 0px AND A MENU BUTTON, at 899 and below — the sidebar left the grid entirely. Right at 390px, wrong at 1280, where there is ample room for the icons and hiding every door behind a press is the worse trade. ONE behaviour from 768 to 1499 now, rather than two systems doing the same job. (Below 768 the desktop shell is hidden outright — see THE PHONE — so this never reaches it.) The header's `#nav-toggle` still draws at 899 and below and opens the same drawer; it is a second door, not a second mechanism.
- THE DOOR IS THE RAIL'S OWN CHEVRON, on the thing it opens. `#side-nav .rail-head` used to be hidden down here on the reasoning that a drawer has nothing to toggle — which left the layer with no way in at all. It stays, and its head goes back to the full bar with its word when open.
- THE TOGGLE DESCRIBES THE WORDS, NOT THE TRACK. railLabelsShowing() is the one reading (above the line: the stored choice; below: is the layer open) and paintRailToggle() is the one painter, called by applyRail AND setNavDrawer. It was painted off the rail's LOOK, which is on below the line whatever happens — so a reader who had just floated the labels was offered a chevron and a tooltip to show them again.
- TWO QUESTIONS THAT USED TO SHARE ONE ANSWER. "Is the sidebar a layer?" moved to 1500; "has the header run out of room for the language words?" did NOT — navHeaderTight() (900) is what placeLanguageSwitch asks, matching the stylesheet's own 899 rule. Left on navDrawerActive it posted the toggle into the sidebar on every laptop, styled by a rule that does not apply there.
- AND THE TOGGLE HAS TO FIT THE STRIP IT SITS IN: at 768–899 it is inside the sidebar, which now rests at 64px rather than the old 240px drawer. Side by side even the two-letter pair measures 86px — MEASURED, 34px of overflow — so at rest it wears its codes and STACKS down the strip, and the words come back when the layer opens.
Tests: nav-floats-verify (browser — the strip, the layer, the page proved unmoved below the line, the scrim and Escape, the untouched preference, the chevron, and that above the line the toggle still pushes and still remembers; **its widths are DERIVED from NAV_DRAWER_W so the file follows the line rather than being edited each time it moves**).

## THE TYPE IS THE DESIGN'S — SIZE AND INK (owner-asked 22 Aug 2026, twice)

The first pass rounded half-pixels and stopped there, and the owner's answer was **"you haven't done anything with the font sizes and the colors of the fonts"** — which was fair. Rounding 11.5 to 12 moves half a pixel; it fixes softness and changes nothing anybody can see. The design's type is genuinely BIGGER and differently COLOURED, and neither had been touched.

**HaTi WAS RUNNING ONE TO TWO STEPS SMALL.** Measured against the design's own stylesheet: its workhorse size is **14px** — root, nav items, table cells, buttons, search — with 12px for labels and 15px for facet values and tabs. HaTi's centre of gravity was 11-12px. So every size **at or below 14px moved up one rung** (9→10, 10→11, 11→12, 12→13, 13→14, 14→15): 1,994 declarations. Its distribution now centres on 12-14 like the design's. Sizes above 14 were left alone — headings were already close.

**TWO THINGS ARE DELIBERATELY EXCLUDED.** Anything inside a `calc()` — that is the contract paper, whose size the reader sets with the A⁻/A⁺ stepper, and lifting it would overrule a preference. And the ROOT, which is a flat 14px: the sweep caught it once and took it to 15, which moved every inherited size a second time.

**THE INK IS THE DESIGN'S TWO COLOURS.** Every text colour was a blue-leaning slate (`#1e293b` and the slate-400..900 ramp), which sat against a teal product and read cold. The design carries `--tx:#1B2A28` for body and `--label:#5F6D6B` for labels — a dark desaturated GREEN-black from the brand's own family. The ramp is re-hued onto it and **every step is at least as dark as the slate it replaces**, so nothing lost contrast: body 13.6:1 → 14.9:1 on white, and the label step 4.8:1 → 5.6:1, which was the one genuinely thin reading. THE NEUTRALS ARE A TYPE TOKEN HERE, not a surface one — they carry text in 638 places and a background or border in 6, which is what makes re-hueing them safe.

**THE SURFACES AND THE 11px LABELS, OFF THE DESIGN'S OWN BRIEF** (owner-asked
22 Aug 2026, "make the paper exactly match how the html is designed and fix the
11px labels").

**THE CREAM PAPER IS THE DESIGN'S AND WAS NOT REMOVED** — measured before
touching it: the mock-up's own redline sheet is `#FDFCF6` against HaTi's
`#FDFCF9`, three units apart in one channel. It is matched exactly rather than
stripped. WHAT WAS ACTUALLY WRONG WAS EVERY OTHER SURFACE, and all of it the
same blue leaning the ink retune left behind: the page ground `#f8fafc`
(slate-50) → the design's neutral `#F4F6F6`, the plain document panel `#fbfbfc`
→ flat white, and the one hairline `#e2e8f0` → `#DFE4E3`. **AND THE CONTRAST
MATHS DOES NOT SUPPORT THE OBVIOUS THEORY**, which is why it is written down:
cream costs 14.53:1 against white's 14.91:1, and HaTi's tinted page was
HIGHER contrast than the design's grey one. The shading was off-spec and was
never why the type read pale.

**11px IS A LABEL SIZE, NEVER SMALL BODY COPY** — the brief's rule, and HaTi
obeyed it in 7 rules out of 273. Applied mechanically, on the one question that
decides it: a rule that is uppercase is a micro label and takes the brief's
single `.09em` tracking (75 rules, several of which carried .04/.07/.08/.1em —
four different answers to one question); a rule that is NOT uppercase is small
body copy, which this size may not be, and moves up one rung to 12px (190
rules). MEASURED AFTER on three screens: every painted 11px element obeys, and
nothing is left at 11px as a sentence.

**THE SCOPE WAS MEASURED BEFORE IT WAS SWEPT.** 273 rules sounded like a
week's work; the elements actually PAINTED at 11px were about ten per screen —
the sidebar's caption and role line, activity rows, a couple of counts. Reading
the rendered page first is what turned this from a guess about 273 declarations
into a sweep with a check at the end of it.

**FOUR SHADES CARRY ALL READING TEXT** (owner-asked 22 Aug 2026, twice — "you
are still not meeting the dark sharp fonts", pointing back at the design's own
typography note). The note is explicit and mechanical: `#1B2A28` PRIMARY for
headings, body copy, table values and clause text; `#5F6D6B` SECONDARY for
labels, counts, breadcrumbs, column heads and metadata; `#A9B3B1` disabled;
white on dark. And the rule that assigns them — **"Primary text is 14 px or
larger; secondary shade is where 11-13 px lives."**

**MEASURED: HaTi ran 10-13 text colours on a single page.** The damage was two
MID greys — `#2F3E3C` (neutral-700) and `#43524F` (neutral-600) — carrying 600
declarations between them: lighter than primary, darker than the label, and
wearing every cell in the register. **That in-between grey is the whole of the
washed-out look**; the ink token was already `#1B2A28` and simply was not being
read. The ramp now carries the design's shades and nothing between them, split
on this codebase's own convention (600 = every caption in the product, 700 =
body and table text), so each HaTi habit lands on the role it was already
serving. Register 10 colours → 8, contract room 13 → 10.

**AND THE SHEET HAD A BLACK OF ITS OWN.** `--color-doc-text:#15181a` was a
BLUE-grey, so the biggest block of text anybody reads was the last thing still
pulling away from the palette — while the note lists clause text under its one
primary ink. Re-hued with `--color-doc-muted`, **and contrast was the condition
rather than an afterthought**: primary 17.84:1 → 14.91:1 (AAA wants 7:1), muted
8.28:1 → 8.21:1, the same reading in a different hue.

**WHAT IS DELIBERATELY LEFT, and each has a reason.** neutral-400 carries 20
borders and backgrounds against 39 text uses — the one step in this ramp that
is not a type token, so the "re-hueing the neutrals is safe" argument does not
cover it. Every colour still above 14px and not on primary is a STATUS or
ACTION shade (amber "In Review", teal links and active tabs), which the note
calls for by name. And the teal is the WORKSPACE ACCENT: pinning it to the
design's `#0B7C6B` would stop it following the workspace.

**A FIRST PASS SENT BOTH MID-GREYS TO PRIMARY AND TURNED EVERY CAPTION BLACK.**
Caught by clause-door-verify 9e, which exists to say that the captions under a
signpost are not the signpost — the mirror of the fault being fixed, and the
reason the rule has TWO halves rather than one.

**AND 146 ELEMENTS NEVER SAW ANY OF IT** (owner-reported 22 Aug 2026: *"why is
that fonts in the html are sharper and black fonts are darker than in HaTi?"*).
`.text-ink` is a COMPILED Tailwind class and its colour is the OLD slate
`rgb(30 41 59)` baked into the blob, so the elements wearing it — the largest
single population of body text in the product — kept the pre-retune ink. **The
dark theme had re-pointed it and the light theme never had**, which is why it
survived: at night it was right. The light-side rules are written in HaTi's own
sheet, later in source at equal specificity — **never in the blob, which is
generated and drops the change on the next build** (the `font-600` lesson).

**AND THE LARGEST TEXT ON THE PAGE WAS THE SOFTEST.** The contract title was
`clamp(19px, 15px + 0.45vw, 24px)` — which resolves to **21.48px** at 1440 and
to a different fraction at every other width, so it was fractional at every
width rather than at none. **The design has no fluid type at all**: a fixed rung
on its ladder is whole everywhere. Five fluid headings took fixed sizes, and the
room title took the design's own 22px/700 (it was 600) — **the SIZE half of
which was REVERSED the same day; see THE TWO HEADS SAY THE NAME AT ONE SIZE
below. The half that stands is the one that mattered: fixed, never fluid.**

**THE CONTRACT PAPER'S OWN BASES WENT WHOLE TOO.** The half-pixel sweep skipped
everything inside a `calc()` on the reasoning that the reader sets that size —
right about the PREFERENCE, wrong about the BASE: 13.5, 12.5, 11.5 and 10.5
multiply by the reader's ratio either way, and at the default of 1 they were the
last half-pixels in the product. Rounded up one rung like everything else.
MEASURED after: scanning every visible element on the dashboard, the contract
room and the register turns up **no fractional font size anywhere**.

**AND THE HEAD ROW WAS OVERSHOT BY THE BLANKET LIFT.** The crumb, the status
word and the fact-row labels were authored directly FROM the mock-up, and the
one-step sweep then moved them a step past it. They carry the design's own
numbers again (12px/`--label` for the labels and crumb, 14px/700 for the
status). **A value already taken from the design is not a value that was running
small** — check before sweeping over one.

MEASURED SIDE BY SIDE against the mock-up at 1440: root, fact label, fact value
and title now match it exactly — size, weight, colour and family. The one
remaining difference is the contract sheet's own ink, which is deliberately its
own token.

**THE COLOUR CENSUS WAS RE-RECORDED, and this is the one case the rule above allows it**: somebody deliberately owning a palette change. It went to 20/40 because every screen's text moved, which is the census working. **ONE THING WAS ABSORBED AND IS SAID OUT LOUD**: `negotiate--dark` had been missing `rgb(17, 94, 89)` since before this run (see the note below), and re-recording bakes that state in. That open question is now unanswerable from the baseline — if it matters, it has to be chased in the code.

**WHAT A NUMBER IN A TEST COSTS.** 1,994 size changes cost five test updates, and four of them were tests pinning a literal px where the claim was a RELATION — the card head "smaller than the contract body", the phone's label FLOOR, the Tracked Changes count against its caption. Each is now written as the relation it always meant, so the next lift costs nothing. Pin the relation, not the number.

## EVERY FONT SIZE SITS ON A WHOLE PIXEL (owner-asked 22 Aug 2026, from the design's own PDF)

"Pay attention to the crispness and sharpness of the font colors and sizes as well. Mimic the font sizes and approach."

**865 SIZES LANDED ON A HALF PIXEL — 41% of every font-size in the product.** 11.5px (348 uses), 10.5px (202), 12.5px (164), 9.5px (94), and five more. A fractional size puts the glyph stems between device pixels and the renderer interpolates them, so the same face at 11.5px reads measurably softer than at 11 or 12. That was the softness; nothing about the face or the colour.

**THE BASE WAS FRACTIONAL TOO, AND AT EVERY WIDTH A DIFFERENT FRACTION.** `clamp(12.5px, 12px + 0.12vw, 14px)` resolves to 13.73px at 1440 and to something else everywhere else, so no descendant using a relative size could land clean either. It is a flat **14px**, which is the design's own root.

**THE DESIGN'S SCALE IS WHOLE NUMBERS ONLY**: 10, 11, 12, 13, 14, 15, 17, 19, 22, 30, 34, 42, in three weights (400, 600, 700). Every half was rounded UP to the next whole, which also moves HaTi toward that ladder — it was running about one step small throughout.

**`font-feature-settings:'cv11'`** is on the body with the antialiasing that was already there. It is Inter's alternate letterform set, which the design turns on: the forms that keep similar characters apart at small sizes.

**THE OLD COMMENT SAID THE OPPOSITE and was wrong**: "the dense 10-13px interface type is deliberately NOT scaled — that density is the design." Density was never what the halves bought. They cost sharpness and bought nothing.

NOTE FOR THE NEXT SWEEP: no test in the suite asserted a half-pixel font size, which is why 865 replacements cost two test updates rather than fifty. Both were about the Tracked Changes caption, and one of them recorded a real consequence — the count used to be set a hair larger than the caption "because mono runs small at the same size", and that stopped being true when --font-mono was pointed at Inter with everything else. One family, no compensation owed, both 11px.

## THE FOUR LADDERS THAT DID NOT EXIST (25 Aug 2026 — Phase D)

**MOTION.** 183 transitions across **twelve** ad-hoc durations — .08, .12, .13,
.14, .15, .18, .2, .22, .25, .28, .3, .4 — each chosen by whoever wrote the
rule. Three rungs, and the question each answers is WHAT IS MOVING rather than
how far: `--dur-1` (120ms) for something that changes in place, `--dur-2` (180)
for a control that grows or swaps, `--dur-3` (240) for a layer arriving or
leaving. `--ease-exit` is flatter than `--ease`, because a layer leaving should
get out of the way rather than perform. **NEAREST RUNG, NEVER A BUCKET** — .22
is nearer 240 than 180 and a bucket would have said otherwise. **Anything past
300ms is left alone**: a seal stamping and a badge breathing are animations,
not transition rungs.

**AND THE SWEEP BROKE THE REDUCED-MOTION SETTING FOR TEN MINUTES.**
`transition-duration:.001ms!important` is not a duration somebody chose — it is
"as close to zero as a stylesheet can say" — and the sweep read it as an
ad-hoc value and mapped it to the nearest rung, **turning the accessibility
setting into a 120ms setting**. Caught because the sweep PRINTED what it moved
rather than only how many. `.001ms` is never a token; f238 pins it.

**AND THE BLOB-GUARD WAS PINNED TO A LINE NUMBER, WHICH IS THE EXPENSIVE HALF.**
The compiled Tailwind blob was line 74 when the rule was written and is line 81
now, because tokens were added above it — so a sweep skipping index 73 walked
straight into it and rewrote 60 declarations, and the repair for the kill
switch then turned Tailwind's own `.transition` utility from 150ms into
effectively instant. **The blob was restored byte for byte from the pre-run
tree.** It is found by its signature now (`*,:after,:before{--tw-border-spacing-x`),
never by its position, and f238 fails on any design token appearing inside it.
**PHASE C SHIPPED WITH THAT DAMAGE AND PHASE D REPAIRS IT** — said out loud
rather than quietly fixed, because the commit in between is on the branch.

**BREAKPOINTS — AND A CSS TOKEN IS IMPOSSIBLE HERE.** 30 distinct widths across
the product's media queries, and they are mostly ALREADY a ladder that was
never named: 767/768, 899/900, 1023/1024, 1439/1440 are max/min pairs of four
rungs, which is the correct idiom. **`@media (max-width: var(--bp-tablet))` is
not valid CSS** — a media query is evaluated before custom properties resolve —
so a `:root` block of `--bp-*` would have **zero consumers by construction**,
which is the exact fault this whole pass exists to fix. The rungs are named in
`js/app.js` as `BP`, where JavaScript asks the window the same questions the
stylesheet asks. **NAV_DRAWER_W IS NOT ONE OF THEM** and says so: the float
line was set from two of the owner's own laptops and moved three times in two
days to get there.

**ONE SHAPE FOR "THERE IS NOTHING HERE".** Seven ad-hoc treatments, each with
its own class name, icon size, type and idea of whether to offer a way forward.
`emptyStateHtml({icon,title,sub,action})` is the register's — the one that was
designed — extracted so the register, Intake, the Directory and the Calendar's
agenda are all it. **THE ACT IS THE POINT**: an empty screen that only says
"nothing here" leaves the reader to work out whether that is because there is
nothing, because a filter is on, or because something failed.

**THE CHARTS SPEAK THE PLATFORM'S TYPEFACE, AND DRAW SQUARE.** A canvas cannot
read a CSS token, so Chart.js was drawing every axis label and legend in its
own default stack — Helvetica Neue, Arial — while every word around it was
Inter: **two faces on one screen**. `Chart.defaults.font.family` is set from
`--font-body`, the same token the rest of the product reads, refreshed by the
palette refresh a theme toggle already calls. And the 20 Aug square-corners
sweep reached ~810 radii in CSS and could not reach a canvas, so **nine bar
charts kept a 4px corner**; Chart.js takes it as a number, not a stylesheet.

**DENSITY — THE F — SHIPPED EARLIER IN THIS RUN.** `--reg-row-h` /
`--reg-row-px` with comfortable (44) / compact (36) / condensed (30), a control
in the register's toolbar, remembered per browser. **The middle rung is HaTi's
shipped 36px and the default does not move** — that is what makes the control
safe, and it is the owner's decision 5 taken at its stated default.

**LOADING STATES ARE NOT BUILT, AND THE REASON IS THIS PRODUCT'S OWN RECORD.**
The order asks for a skeleton in the row rhythm for eight data views.
MEASURED: there is no skeleton machinery in the product at all — and the ONE
place a skeleton was built, the share dialog, it was REMOVED as the fault it
caused. F178's own name is *"the share dialog arrives once, at its final
size"*, and its first claim is that the opening markup is the real first
question **and not a skeleton**. Adding eight more unattended, against that
record, is the wider interpretation. It wants a measurement of where a gap
actually exists first.

Tests: f238 (six new claims, five failing against the parent commit — the sixth
is the kill switch, which was intact there and is the one this phase broke and
fixed), f177 unchanged.

## THE LADDERS HAVE CONSUMERS NOW (25 Aug 2026 — Phase C)

The audit's whole verdict in one sentence: **"a ladder with no consumers is a
document, not a system."** HaTi had a mature COLOUR system and essentially
nothing else — font-size, font-weight, line-height, z-index, duration and
border-width had zero tokens between them until 23 Aug, and the ladders added
that day had **four consumers in total** against 2,144 hand-typed font sizes,
1,065 weights and 1,748 on-grid spacings.

**4,991 DECLARATIONS NOW READ THE LADDERS, AND NOT ONE PIXEL MOVED.** By exact
value: 30→`--t-display`, 19→`--t-page`, 17→`--t-section`, 15→`--t-card`,
14→`--t-body`, 13→`--t-meta`, 12→`--t-label`, 11→`--t-micro`, 10→`--t-figure`;
400/500/600/700→`--w-*`; 4/8/12/16/24/32/40/48→`--s-*`. **A type or spacing
change is ONE edit now**, which is the whole point of the phase.

**THE PROOF IS A CENSUS AND IT IS IN THE REPO** — `test/design-census.cjs`,
run by hand in pairs. Every font-size, weight, line-height, letter-spacing,
padding, margin, gap, shadow and height the browser RESOLVES, on 14 screens in
both themes, keyed by a stable path. Recorded on a worktree at the parent
commit and again on the branch: **5,906 element paths, 0 moved, 0 gone, 0
arrived.**

**IT FLAPPED FIRST, AND THAT IS THE LESSON.** Run twice on an unchanged tree it
reported 12 moved paths and then moved them back — Reports hydrates its charts
asynchronously, so the census read the CSS fallback strip (58px) on one run and
the canvas (220px) on the next, and every ancestor of a chart reported a height
change. **A census that moves on its own is worse than no census**, and it made
the three "0 moved" runs before it worthless. It waits for the canvases and for
the height to stop changing; zero drift on identical code is now the first
thing it has to earn.

**WHAT IS DELIBERATELY EXCLUDED FROM THE SWEEP, and each for the same reason.**
Anything inside a `calc()` — that is the contract paper, whose size the reader
sets with the A⁻/A⁺ stepper, and a token there overrules a preference. Line 74
of index.html, the compiled Tailwind blob, which regenerates. And **the
STANDALONE DOCUMENTS**: js/views/healthreport.js and js/views/weekly.js open
their own windows and carry no `:root`, so a token there resolves to NOTHING —
the declaration is dropped and the browser falls back to whatever it inherits.
**A THIRD ONE WAS MISSED AND f143 CAUGHT IT IN ONE RUN**: `negoHistoryExportHtml`
is a whole-document builder living inside an ordinary view file, so a
file-level exclusion did not cover it. Its 17 tokens are literals again and the
function says why at the top. Any new builder emitting a whole document joins
that list.

**THE OFF-GRID SPACING IS LEFT ALONE, AS THE ORDER ASKS: 3,482 declarations**
on 10, 6, 9, 14, 7, 5, 2, 11 and 3 px. They are hand-tuned dense rows and they
want an eye, not a regex.

**SEVENTEEN HALF-PIXEL FONT SIZES WERE ROUNDED UP** — 14.5→15, 13.5→14,
12.5→13, 11.5→12, 10.5→11 — eleven in the clause editor and six on the
negotiation page, including the two in the change-card ⋯ menu the order names.
A fractional size puts the glyph stems between device pixels and renders soft;
this is the 22 Aug sweep's own rule, finishing the job.

**ONE FIELD PAIR.** Seven local `FLD`/`LBL` constants in three disagreeing
flavours — two of them in core.js 1,300 lines apart — and `RV_FLD` in
js/review.js carried a note saying it was a deliberate copy to be kept in step
and **had already drifted 2px from what it quoted**. `HATI_FLD` / `HATI_LBL` are
declared once in core.js and published; family, intake and library read them.
**js/review.js's pair is written out on purpose and says why**: pointing it at
the shared pair left the share dialog's field with NO STYLE AT ALL on a stage
that does not load core.js, and f156 caught it within the hour. **What drifts
is VALUES, not strings** — every declaration there reads `var(--field-*)`, so a
change to a field's height is still one edit in `:root`. f238 asks for that,
not for the string.

**TWO SURFACES BETWEEN THE PAGE AND WHITE.** `--surface-2` (a raised strip ON a
card) and `--surface-3` (a layer ABOVE the page), light going DOWN from white
and dark going UP from the panel, because that is which way "nearer the reader"
reads on each ground. Adopted on the room's ⋯ menu and the settings drawer. Every
rung clears AA in both themes by measurement (11.87:1 for body ink on
`--surface-3` at night).

**AND THE REGISTER'S FILTER BAR WAS REVERTED WITHIN THE HOUR, WHICH IS THE
USEFUL HALF.** It is the most obvious raised strip in the product and it is the
one place a tone is forbidden: the owner reported that head and band reading as
two cards with a strip between them ("make it one card"), and the fix was one
white object running to the screen's edge. `--surface-2` put that seam straight
back — contracts-page 8a and 15 both failed on it. **An owner ruling outranks a
system rule on the element it names.**

Tests: f238 (the field claim REVERSED IN PLACE and made stronger — one pair,
published, and no constant typing its own NUMBERS), **`test/tokens.js` (NEW —
one resolver mapping a token to its value out of `:root`, so a test asserting a
RELATION reads a number without typing one; six tests use it)**, and twenty
claims RE-POINTED across f143, f156, f173, f175, f178, f184, f210, f223, f238
and f240 — seventeen were literals where the claim was a relation, which is
exactly what rule 4 predicted, and each now costs nothing at the next retune.

## ONE FOCUS TRAP, NINE HOMES, AND EVERY REFUSAL SPOKEN (25 Aug 2026 — Phase B)

The audit graded accessibility D+ on two measured facts: **the product had ONE
focus trap** — openModal's, written on 23 Aug — against nine overlays that
needed one, and **ZERO aria-live regions in the whole product.**

**A LAYER THAT DOES NOT HOLD FOCUS IS NOT A MODAL.** Tab walked out of the
settings drawer, the alerts panel, the command palette, the counterparty's
alerts panel, the KPI customizer, confirmDialog, promptDialog and all seven
phone sheets into the page underneath — where a sighted reader watches nothing
happen and a screen-reader user is read the page BEHIND the dialog. **`trapFocus(panel, opts)`**
is that one implementation, extracted from openModal with its reasoning intact
and adopted at all nine.

- **IT RETURNS ITS OWN UNDO.** `release()` unbinds and hands focus back to
  whatever opened the layer. Three jobs that are really one job: separated, the
  third is the one that gets forgotten, and a keyboard reader is then dropped at
  the top of the document every time they dismiss anything. Calling it twice is
  safe, because a layer with two ways out will do exactly that.
- **IT DOES NOT OWN ESCAPE, deliberately.** Every one of these layers already
  has its own Escape with its own guard about which overlay is on top, and a
  second opinion here is how two of them come to disagree — a fault this product
  has already paid for once, when Escape on a "Discard these changes?" guard
  both answered it and closed the editor underneath in one keystroke.
- **RELEASE BEFORE THE MARKUP GOES.** The trap restores focus to the opener, and
  an element cannot take focus once its panel has been torn out from under it.
- **THE PHONE'S SHEETS ARE SET AFTER THE PAINT, NOT AT THE PRESS**, because that
  shell repaints wholesale on every act and the node the press opened is gone by
  the next frame. The opener is remembered by ID across the repaint, which is
  what survives; the element does not.
- **AND THE SEVEN SHEETS HAD NO SEMANTICS AT ALL** across 3,419 lines — no role,
  no modal announcement, no name. They say `role="dialog"`, `aria-modal` and a
  NAME now, taken from the sheet's own title where it draws one (six of seven
  do) and from a getter map for the one that does not. A getter, never a literal:
  an object literal freezes whatever language was current at load, which is the
  trap this file records four separate times.

**FOUR aria-live REGIONS, EACH ON THE ELEMENT THAT RECEIVES THE MESSAGE** — the
toast root, the settings drawer's refusal, the register's result count, and the
counterparty's own signature confirmation. That last one is the most
consequential moment on their page — they have just executed a contract — and
the whole confirmation was **a band repainted in place**, which changes nothing
a screen reader is told: the page it was reading still said "ready to sign".

**EVERY ACT NOW HAS A KEY BESIDE ITS CLICK.** The register's sortable column
heads (a click, a pointer cursor and `aria-sort`, and no way to press them
without a mouse), the negotiation page's split divider (Key Terms' own divider
has had arrows since it was built — this is that, ported, writing the SAME store
and re-running the SAME layout so the two cannot disagree), the room's tab row
(one tab stop with arrows inside it, which is what a tablist is for), the risk
map's dots, and the KPI row, where **dragging was the only way to reorder** —
Alt+Arrow, through the same splice as the drop.

**AND `aria-selected` WAS SET ONCE, WHEN THE ROW WAS BUILT.** The room's tab
paint flipped only the class, so from the second tab onward the row announced
the tab the reader started on for as long as they stayed in the room. The class
and the attribute come off one reading now.

**REFUSING THE POINTER IS NOT REFUSING THE KEYBOARD.** On the 'as agreed' and
'with changes' readings the change column is greyed and `pointer-events:none`
refuses the press — and MEASURED, Tab still reached every verb in it and Enter
still fired them, so the one route the greying exists to close was open to
anybody not using a mouse. `aria-disabled` merely SAYS unavailable; **`inert`**
takes it away.

**THREE THINGS FELL OUT OF DRIVING IT RATHER THAN READING IT, and all three
would have passed a markup check.** `.sr-only` **did not exist anywhere in the
product** and was written into the KPI hint — the `ui-input` fault, this
codebase's own recorded example — so it is defined in HaTi's own sheet in the
same change; **`.click()` is a no-op on an SVG element**, so a keyboard handler
on the risk-map `<g>` dots did nothing at all, silently (a dispatched MouseEvent
reaches the same delegated handler the mouse does); and **the dashboard has two
KPI-card builders, one of them dead** — `kpiHtml` is computed and never
interpolated — so a hint written onto it reached nothing.

Tests: **keyboard-reach-verify (NEW, 40, browser — 25 of the 40 fail against the
code of an hour before**; every claim is DRIVEN with real Tab and Arrow presses
and read off `document.activeElement`, because "does the element carry
role=dialog" is a different question from "can somebody reach this without a
mouse" and only the second one matters), f238 (six new claims, five failing
against the prior code — the sixth is the extraction itself, which landed in
Phase A's commit by an accident of timing and is named there), F97 (one claim
RE-POINTED: it anchored on a literal opening tag that gained an attribute, so
`indexOf` came back -1 and `slice(-1)` handed two checks a one-character string
they both passed against — a false pass is the expensive half).

## A POP-UP WINDOW CAN BE MOVED OUT OF THE WAY (owner-asked 1 Sep 2026)

*"Make it so that the pop-up window with the notes regarding the redline can be
dragged around the screen if needed. In fact, make all pop-up windows have the
ability to be moved around."* Recommendation put to the owner and taken: you
grab a window by its TOP.

**ONE HELPER, EVERY WINDOW, BECAUSE THEY ARE ALL ONE SHAPE.** Measured before a
line was written: the eight families of pop-up in this product — `openModal`'s
~69 dialogs, `confirmDialog`, `promptDialog`, the redline note window, the
signature pad, the new-stream box and the counterparty's two — are each a fixed
full-screen frame with `place-items:center`, a scrim child and a panel child.
That is what makes `dragDialog` (js/core.js, beside `trapFocus`, whose shape it
borrows — it returns its own undo) one function rather than eight, and it is why
a ninth dialog written later is one line rather than a copy. **f265 sweeps all
eight and fails on a ninth family that does not arm it.**

- **YOU GRAB IT BY THE TOP — the standard answer**, and the reason a departure
  would need one: Word, Windows and SAP's own dialogs all drag by the title bar
  and a reader already knows it. The zone is the top `DLG_GRAB_H` of the panel
  MINUS anything you could press or type into, so the heading is a handle, the ✕
  in the corner is still a close button, and a text box at the top of a window is
  still a text box.
- **NOT FROM ANYWHERE, and that is the whole reason for a zone.** A dialog
  regularly holds text somebody means to select and copy — the response code, a
  shared link, a colleague's note — and a window that walks off when you try to
  select a line is worse than one that does not move. Measured as a real
  selection in the browser file, not merely as a window that stayed put.
- **AND NOT BY A GRAB BAR**, which was drawn and refused: it would put a new
  strip on sixty-nine windows to say something the cursor already says. The
  pointer turns to `move` over the zone and nowhere else — the cheapest channel
  that carries the fact, which is this rulebook's own second question.
- **IT CAN NEVER BE PUT WHERE YOU CANNOT REACH IT.** The top is clamped at 0
  rather than at `-keep`: a window whose title strip is above the ceiling is one
  you cannot pick up again, and that is the one state this must never allow.
  `DLG_KEEP` stays on screen at every other edge, **per AXIS rather than one
  number for both** — a window wider than it is tall was allowed to hang off the
  side by the difference, because the margin it had to keep was being set by its
  own height (caught by f265 before it shipped).
- **IT COMES BACK TO THE MIDDLE.** The position is per SITTING of that window and
  dies with it — a window that opened in a corner a week later with nothing on
  screen saying why is the fault the saved-filter rule already warns about, and a
  remembered corner is wrong the moment the browser is resized. **What it DOES
  survive is a repaint of the window's own contents**, because the offset is kept
  on the FRAME rather than in a variable here: several of these windows are built
  by a `paint()` written to be re-runnable that replaces the very panel the
  helper is armed on, and left in a closure the position would die with it and
  the window would jump back to the middle under the reader's hand. **NOTHING
  SHIPPED REPAINTS ITSELF IN PLACE TODAY** — a first writing of this section said
  the note window did when a note is saved, and it does not; it closes — so this
  is the cheap half of being ready for one, exercised by f265 and by nothing in
  the product.
- **DOUBLE-CLICK THE TOP PUTS IT BACK, and gives every declaration back exactly.**
  THE TRAP: each of these dialogs writes its position, width and max-width as an
  INLINE style, so clearing ours would not fall back to theirs — it would DELETE
  them, and the window would come back the wrong width for the rest of the
  sitting. The six are saved at arm time and restored on reset.
- **AND THE SCREEN CAN CHANGE SIZE UNDER A WINDOW SOMEBODY HAS MOVED.** A pinned
  panel is at a fixed pixel, so a browser dragged narrower — or a laptop undocked
  from a second monitor — would leave one that was against the right edge off the
  side of the screen entirely, reachable only by Escape. It is clamped back on,
  which is the same promise the drag itself makes.
- **NOT ON A NARROW WINDOW.** Below `DLG_MIN_W` (768) a dialog is nearly the whole
  screen, so there is nowhere to move it to and every drag can only make it
  worse. The phone is untouched BY CONSTRUCTION — that shell opens none of these
  and has sheets of its own — but the counterparty's page is NOT the phone and is
  drawn at any width, which is what this line is really for.
- **IT MOVES A WINDOW AND DOES NOTHING ELSE.** No record, no persist, no audit
  line, nothing in localStorage; Escape, the scrim, the ✕ and any
  `onBeforeClose` guard are exactly as they were. f265 greps the helper for all
  seven and fails on any of them appearing.
- **NO KEYBOARD EQUIVALENT, AND THAT IS DELIBERATE.** Every ACT in this product
  has a key beside its click; moving a window is not an act — nothing is
  recorded, nothing is decided, and every control in the dialog is reachable
  without it, so a reader who never moves one loses nothing. Said out loud rather
  than left to be discovered.

**WHAT IS DELIBERATELY NOT IN IT**, each for its own reason and each named to the
owner before it was built: the panels DOCKED to an edge (Copilot, Alerts,
Activity, Notes, the clause panel, the round queue, `openSidePanel`) — they are
attached to a side rather than floating, and there is nowhere for them to move
to; the ⋯ menus and the selection strip, which are menus; the toasts; the
command palette and the full-screen document reader, which are not windows; and
the phone's bottom sheets.

**AND THE HELPER IS PUBLISHED, or six of the eight sites are silence** — they
call it as `window.dragDialog && …`, which is this codebase's most repeated
defect (a name defined in one module, never put on window, read through a guard
that is therefore always false). f265 asserts it leaves js/core.js by name.

Tests: f265 (25 — the rules, in a window of its own with the helper lifted out of
core.js between named landmarks, so it is the shipped code and the first claim
fails if either landmark moves), **window-drag-verify (19, browser — every press
a REAL MOUSE, because a scripted event exercises neither the pointer capture nor
the browser's own click-after-drag and would pass against a window nobody can
take hold of; 5 of the 19 fail against the parent commit, the headline one
reporting the owner's window moving `0,0`).**

## THE ACCENT HAD NO NIGHT ANSWER (25 Aug 2026 — the pre-launch UI/UX audit, Phase A)

**ONE STRUCTURAL FACT UNDER ALMOST EVERY DARK-THEME COMPLAINT, and this file had
already diagnosed it for exactly one selector and never swept it.** `html.dark`
redefines the surface, the ink and the whole neutral ramp and **never redefines
the accent**. So a raw ramp step used as TEXT had no dark answer at all.

- **183 DECLARATIONS SET AN ACCENT RAMP STEP AS TEXT** — `color:var(--color-accent-600|700|800|900)`
  — and measured **2.35:1 at night** where AA wants 4.5. The register's teal
  tracking numbers alone are 41 of them, at 3.74:1 in **daylight**.
- **62 MORE SET AN ACCENT TINT AS AN INLINE BACKGROUND** (`--color-accent-100|200`),
  which at night is a near-white block under near-white text.

**TWO INK TOKENS, NOT ONE, AND THAT IS THE WHOLE REASON LIGHT DID NOT MOVE.**
`--accent-ink` is accent-800 by day and `--accent-ink-700` is accent-700, so each
of the two rungs that carried text keeps its own daylight value and only night
changes. Collapsing them onto one token would have re-coloured 104 of the 183 in
broad daylight — which is a palette change nobody asked for wearing a contrast
fix's clothes. **MEASURED, AND THIS IS THE PROOF THE SWEEP RESTS ON: the colour
census passed on all ten LIGHT screens, every colour unchanged.**

- **`--accent-fill` IS THE TOKEN FOR A WHITE-ON-ACCENT SURFACE** — accent-700,
  because white on accent-600 is **3.74:1**. `.ui-btn-primary` had taken that
  rung on 23 Aug and eight more fills had not: the pager's live page,
  `confirmDialog`'s confirm, the phone's primary button, Reports' health-report
  button. **`--accent-solid` IS UNTOUCHED** — it is the nav's own fill and this
  file records it as a brand fill that must not flip.
- **AN OPACITY IS NOT AN INK, AND THE LIGHT SIDE HAD NEVER BEEN TOLD.**
  `.text-ink/40…/60` put reading text between 2.36:1 and 4.11:1. The dark theme
  had re-pointed them and light never had — the same shape as `.text-ink` itself
  on 22 Aug, which survived for the same reason: **at night it was right.**
  Collapsed onto the two real inks in HaTi's own sheet, never the compiled blob.
- **`--danger`, `--danger-hover`, `--rule-strong` and `--rule-faint` GAINED NIGHT
  ANSWERS.** A refusal that is unreadable at night is a refusal nobody acts on.
- **THE TEXT-SIZE STEPPER WORE A BORDER SHADE AS AN INK.** `html.dark .rl-type-step
  button` read `--color-neutral-300`, which answers `#475569` at night — the same
  value this ramp uses for panel borders. 2.36:1; it takes the label ink now, 8.1:1.

**REPORTS' FOUR HERO CARDS LEFT THEIR GRADIENTS.** White on `--grad-amber` is
**1.67:1** and on `--grad-emerald` **1.92:1** — the worst contrast in the
product. They wear the platform card shell with a **3px top edge in the metric's
own tone**, which is the shape Home's KPI cards already use. **THE TONE IS NOT
LOST**: it moved from the fill to the edge and the icon chip, which is where a
status colour is carried everywhere else here. `REPORT_METRICS` states a `tone`
rather than a `grad` — one fact per metric, beside every other fact about it —
and the hero dropdown reads the same tokens as its neighbour on the chart cards
below, differing only in SIZE, because 11px uppercase is a label.

**WHAT WAS MEASURED AND DELIBERATELY NOT SWEPT, said out loud.**
`--color-neutral-400` carries text in about fifty places and fails AA in **both**
themes (2.96:1 by day, 4.34:1 at night) — but it carries borders and backgrounds
in twenty more, so it is the one step in this ramp that is not a type token,
which is why the four-shades pass already recorded it as excluded. It is not a
dark-theme finding, and fifty declarations want an eye each. And **the Insights
hero tile puts `#bde7e1` on `--brand-hero`'s middle stop at 2.80:1** — in the
teal workspace only; navy and dark both clear 8:1. Fixing it means darkening a
brand gradient or moving the tile, both the owner's call. Insights is not one of
the twenty census screens.

**THE CENSUS WAS RE-RECORDED, AUDITED VALUE BY VALUE — the one case the rule
allows.** All ten LIGHT screens passed unchanged. All ten dark screens moved, on
exactly **three** values, nothing unexplained: `rgb(204,251,241)` (accent-100 as
a dark background) GONE; `rgba(20,184,166,.15)` (`--st-steel-bg`, the token those
62 moved onto) ARRIVED; and `rgb(45,212,191)` (`--accent-ink` at night) ARRIVED
on **register--dark alone**, because the other nine screens already held it.

Tests: **contrast-verify (NEW, 33, browser — 23 of the 33 fail against the code
of an hour before**, naming every ratio above; it measures COMPOSITED contrast,
walking up until the alphas reach opaque, because reading one element's own
background is how a probe reports 1:1 white-on-white on a page nobody has
trouble reading; it counts the two exclusions out loud on every run so a green
run cannot read as "nothing is left"), f238 (five new claims, all five failing
against the prior code), theme-tokens-verify 40/40, f175 (one claim RE-POINTED
in place — it pinned the ramp step by name where the claim was a relation, and
now asserts the token plus the hand-written night answer this file's own history
records as the defect it was written for).

## THE DESIGN SYSTEM GREW ITS OTHER HALF (23 Aug 2026 — the launch design audit)

An exhaustive design-system audit, measured in a real browser across 23 screens
in both themes, found ONE structural fact under almost every complaint: **HaTi
had a mature COLOUR system and essentially nothing else.** Of 120 `:root`
tokens, 91 were colour. font-size, line-height, font-weight, z-index,
transition-duration and border-width had **zero tokens between them**, against
2,300 / 523 / 1,029 / 78 / 114 hand-typed declarations. And the fifteen
non-colour tokens that DID exist — six `--space-*`, three `--radius-*`, four
`--sh*`, `--ring` — had **exactly zero consumers each**.

**THE CLEAREST EVIDENCE THAT A SCALE WAS WANTED AND COULD NOT BE REACHED:**
`--space-2` was declared `6.8px`, and somebody had hand-typed `padding:6.8px`
— that dead token's raw value — into js/views/register.js rather than use it.
The whole ladder was a 0.85x scaling of 4/8/12/16/24/32, so every rung landed
on a FRACTION of a device pixel: the same softness the 22 Aug type sweep spent
865 replacements removing from font sizes.

**WHAT LANDED.** One token block in `:root` — spacing, page measure, cards,
rows, control heights, gaps, the type ladder with its ROLES, weights, a
five-rung leading ladder, tracking, borders, focus, fields, z-index and icons.
It reaches all four style sources, because every JS-injected stylesheet lands
in the same document head. Declared in **px, never rem**: the flat 14px is on
`body`, not `html`, so rem still resolves against 16 and a rem scale would have
introduced a SECOND grid beside the 5,142 existing px declarations.

- **ONE PAGE MEASURE.** 11 page roots carried 3 measures and the leftmost ink
  landed on 6 different verticals; `#page-head` padded to 20px while the bodies
  under it padded to 16, 18, 20 or 0, so on 10 of 11 screens the page TITLE and
  its own content did not line up. All of them read `--page-pad` now, header
  included. The contract room's 6px top was UNTOUCHED here — owner-ruled,
  22 Aug — and REVERSED on 25 Aug, when the owner asked for one header top
  across the platform; it reads --page-pad-t like every other view root now.
- **THE ROW IS THE DENSITY LEVER.** The register measured 55.39px against
  Fluent 44, AG Grid / Atlassian 40-42, Material compact / Salesforce 32-36.
  It is 45px, DECLARED rather than emergent: `--pad-row` plus two stated line
  boxes, because with no line-height the two lines inherited 1.5 and padding
  could not reach the number alone. 12 contracts on a 1440x900 laptop became 17.
- **LEADING IS OWNED.** 78.2% of font-size declarations carried none, and the
  product's only base leading was `html{line-height:1.5}` inherited from the
  GENERATED Tailwind blob nobody may edit. `--lh-base` is declared in HaTi's own
  sheet at equal specificity and later in source, so it wins without !important.
- **WEIGHT 500 IS REAL.** `.font-medium` was pinned to 400 because "72" had no
  500 cut; its own note called the pin "one edit to undo when somebody wants
  Medium on purpose". Inter carries 300-800. 37 elements were already authored
  as medium and rendering as regular. Inter is not duplex — measured, nothing
  reflows; the widest effect is a truncating cell clipping one character earlier.

**CONTRAST — ROUGHLY 300 AA FAILURES CLOSED BY THREE EDITS.**
- **THE ACCENT WAS BRAND-AWARE BUT NOT THEME-AWARE.** `html.dark` redefines the
  surface, the ink and the whole neutral ramp and never redefines the accent, so
  160 declarations setting accent-700/800 as TEXT had no dark answer: every
  ordinary button and every link measured **3.26:1 at night in teal and 1.58:1
  in navy**. `--accent-ink` already existed WITH a correct dark value and the
  raw carriers simply never read it. `.ui-btn` and `a` read it now — measured
  3.26:1 -> **9.59:1**. This file had already diagnosed it for exactly one
  selector (`.rl-idx-n.is-live`) and never swept it.
- **AN OPACITY IS NOT AN INK.** `.text-ink/40…/60` put 54 elements of ordinary
  reading text between **2.36:1 and 4.11:1** — five rungs under AA. The design
  carries two reading inks, so the ladder collapses onto them: the two heavy
  rungs take PRIMARY, the six light ones SECONDARY. Hierarchy is carried by size
  and weight, which survive a background change; a fade does not.
- **THE ONE FILLED ACT.** White on `--accent-solid` (accent-600) is **3.74:1**
  on 114 elements. `.ui-btn-primary` takes accent-700: 5.47:1 teal, 11.30:1
  navy, so one value serves both and there is no dark override to keep in step.
  `--accent-solid` ITSELF IS UNCHANGED — it is the nav's fill and this file
  records it as a brand fill that must not flip.

**THE FOCUS RING REACHED NOTHING.** 91 inline `outline:none` declarations,
carried in by the field constants, defeated the product's one focus rule — and
an inline declaration cannot be beaten without !important. Measured: both
SIGN-IN fields returned outlineWidth 0px / boxShadow none while focused, while
the Sign in button beside them drew the ring correctly. **The fix is the second
declaration**: not one of those 91 sites sets box-shadow, so `box-shadow:var(--focus)`
reaches all of them without !important. The outline stays for everything else.

**ONE FIELD SYSTEM.** Three disagreeing `FLD` constants — two in js/core.js
1,300 lines apart — on 8px/10px vs 6px/10px padding, 13px vs 14px type, one with
no min-height at all; plus `RV_FLD`, which carried a note saying it was a
deliberate copy to be kept in step and **had already drifted 2px from what it
quoted**. All five read the tokens now, so the copy cannot drift again.

**THE BUTTON LAYER IS PART UNREACHABLE, AND THAT IS SAID OUT LOUD.** `.ui-btn`
computed 30.8px from `padding:6px 12px` against `.ui-btn-lg`'s fixed 28, under a
comment calling the large one the larger; height comes from `--ctl-h` now and
padding is horizontal-only. A head row takes one height scoped BY CONTAINER, not
by class, because the measured fault was four classes meeting in one row — a
rule naming today's classes is one the next button walks past. **176 buttons
still carry an INLINE padding or font-size (10 paddings, 4 type sizes) and no
stylesheet can reach them.** `.ui-btn-sm` now exists as the rung they were
hand-rolling; migrating those call sites is a separate VISUAL pass — each is a
hand-tuned dense row and wants an eye, not a regex.

**AND FOUR DEFECTS FELL OUT OF MEASURING, none of them a spacing value:**
- **CTRL+P PRINTED A BLANK PAGE ON EVERY OWNER-SIDE SCREEN.** `body>*{display:none!important}`
  with `#print-root` the one escape, and the only code that ever filled it was
  the COUNTERPARTY's side. Measured on the Document tab: 2,092 characters on
  screen, **0 in print** — and the calendar shipped a Print row calling straight
  into it. A `beforeprint` handler fills #print-root from the surface on screen
  and `afterprint` clears it; it never overwrites a deliberate fill, so
  portal.js's own path is untouched. Now 1,192 printable characters.
- **THE READER'S A-/A+ CONTROL DID NOT REACH THE CONTRACT'S WORDS.** Measured at
  the 8, 15 and 20px settings: `.doc-surface` moved 7.46 -> 14 -> 18.66px while
  every clause paragraph stayed a flat **15px**, so at the small setting the
  clause TITLE (10.66px) drew SMALLER than the body beneath it. The cause is a
  class that lies: the paper carried `text-[13.5px]` and `text-[13px]`, and the
  22 Aug sweep moved their COMPILED values to 15px and 14px while leaving the
  NAMES saying 13.5 and 13 — a fixed size that overrode the sheet's own scaling.
  The body inherits the sheet now and the heading takes a RATIO of it. Swept and
  re-measured: **14 elements on the paper, 0 not following the reader.**
- **THE SIGNED-OUT SCREEN ADVERTISED THE SESSION IT DID NOT HAVE.** `#context-panel`
  and `#ai-panel` mount at page load as body-level siblings, so the sign-in
  page's own text read "… Sign in … ACTIVITY / HaTi Copilot / Searching your
  live contract data / ANSWERS". `body.pre-auth` hides them by CSS rather than
  per element, so a panel added later cannot forget.
- **NO DIALOG SAID IT WAS ONE.** The share dialog — the most-used in the
  product, 31 focusables behind a scrim at z-index 70 — reported role null,
  aria-modal null, no accessible name, and focus never moved into it. `openModal`
  now sets role/aria-modal/aria-label, moves focus in, cycles Tab inside, and
  returns focus to the opener. Escape already worked and is untouched.
- **TARGET SIZE.** "Forgot password?" — the only route back into a locked-out
  account — measured 366x17px, 7px under the WCAG 2.5.8 floor at every width.
  LINKBTN carries a floor now.

**RE-RECORDED AGAIN 24 Aug 2026, ON THE MERGE, FOR SOMEBODY ELSE'S DELIBERATE
CHANGE — and the "whose is it" question was ANSWERED BEFORE THE BASELINE WAS
TOUCHED, which is the only thing that makes this legitimate.** The home page
merged into main, and the census came back **30/40**: contract, keyterms,
signing, history and menu, in BOTH themes. It looked like the merge's fault and
was not. MEASURED on main as it stood BEFORE the merge — a worktree at that
commit, the file run there — main scored the **identical 30/40, same five
screens, same three values**. `b45fcb3` removed the floating bell and the
floating notices card on the owner's ask ("I do not want anything floating over
the page") and never re-recorded, so main had been red on its own net since that
commit. The merge neither caused it nor widened it.

**THE AUDIT, AS A SET DIFFERENCE RATHER THAN A DIFF** — reading the baseline's
own text is useless here, because the file re-orders and every value appears on
both sides of the patch. Three values GONE, **nothing arrived**:
`rgb(224,196,138)` (light) and `rgba(245,158,11,.35)` (dark) are the two themes'
`--st-amber-line`, the amber notice card's BORDER; `rgba(15,23,42,.34)` is that
card's drop SHADOW. All three are the floating furniture that was deliberately
removed. Pure removal on five screens is the safest shape a re-record can have.

**AND THE SEMANTIC WAS PROVED STILL ALIVE BEFORE IT WAS SAVED**, which is the
check that stops a real regression being baked in: amber has not left the
product, it is simply not drawn on five screens that have nothing to say —
`.rl-notices:empty` draws nothing at all now. `negotiate--light` and
`negotiate--dark` both PASSED throughout, and that is the screen that always
carries a notice. A value that disappears everywhere is a regression; one that
disappears exactly where the thing drawing it was removed is the change.

**THE STANDING RULE THIS PAYS FOR:** a deliberate palette change that is not
re-recorded leaves the one net for colour regressions catching nothing, and the
next person reads the red as furniture. Re-record in the same commit as the
change, or the person who finds it has to prove it was yours before they can
clear it.

**RE-RECORDED 24 Aug 2026 for the shell's swap of grounds, and this is the one
case the rule allows — somebody deliberately owning a palette change.** It went
to 20/40, which is the census working: the dark column and the 64px header
moved on every screen. **AUDITED VALUE BY VALUE BEFORE IT WAS SAVED, which is
the whole condition on saving it.** 39 shades left and 20 arrived, and every
one is accounted for: GONE are the black-30% mix that marked the dark column's
live door (both brands), the accent at .1/.22/.3/.4 (the old Copilot button's
tint and the CLM chip), the old `--nav-bg`/`--nav-line` and `--color-bg`,
fifteen white-at-an-alpha values from the foot card and section heads that were
written for a dark ground, the brand mark's drop shadow and its cyan gradient
stop, and the old amber-on-dark count ink. ARRIVED are the new `--nav-bg`
(#093733), `--nav-well` in both themes, the new page ground, the neutrals the
white column needs, the bell badge's #2A1B04, accent-800 for the Copilot block,
`--accent-ink`, and the shell bar's own white alphas. **NOTHING UNEXPLAINED
APPEARED**, and the redline's grammar was checked separately and is untouched —
amber, teal, green and ruby all still draw on the home page in both themes.
**ONE EXCLUSION WAS WIDENED RATHER THAN THE FAILURE ABSORBED**: the census
already skipped the theme MENU because its rows are samples of the themes
("counting them would make the green sample look like a teal the sweep missed
while you were on navy"). The menu became two brand swatches, which are the
same samples, and until they joined that selector the file reported green
surviving the navy switch on all ten screens.

**TWO PRE-EXISTING REDS WERE CLEARED and both were the INSTRUMENT, not the
product.** `test/chromium/_edge.js` hard-coded one session's scratchpad path and
was the only thing keeping f227 red. And F96's token reader anchored on the
literal `:root{\n    --color-bg:` and sliced to the first `\n  }` in the FILE —
so the day a comment was written between the brace and the first token (22 Aug),
the anchor stopped matching, the slice came back EMPTY, all three tokens read
undefined, and the test failed on a claim that was still perfectly true. It
brace-matches now. **A fragile anchor accusing the product of a fault it does
not have is worse than no test.**

**WHAT IS DELIBERATELY NOT DONE, said out loud:** the 176 inline button
overrides (above); the ~3,978 inline `style=""` attributes carrying 69% of all
spacing, which no stylesheet can reach; the icon sweep onto `--icon-*` (the
tokens exist, the sprite does not read them yet — measured, five painted box
sizes and six stroke widths on ONE screen); the counterparty portal's own
density (54.9% chrome before the contract at 1440); and the 200%-zoom shell swap,
which could not be reproduced cleanly and is UNPROVEN rather than fixed.

**THE COLOUR CENSUS WAS RE-RECORDED, and this is the one case the rule allows**
— somebody deliberately owning a palette change. It went to 28/40, and EVERY
ONE of the twelve was the SAME two values leaving with NOTHING arriving:
`#1B2A28` at 50% and at 60% alpha — `.text-ink/50` and `/60`, the faded
reading inks replaced above. Nothing new appeared because their replacement
(--color-neutral-600) was already in the census as the label ink. Checked
value by value before it was saved, which is the whole condition on saving
it; it is 40/40 again and is a working net.

Tests: f238 (NEW, 18 — the ratchet: the ladders exist, one page measure, no
opacity ink survives, the accent carriers read the token with a dark answer,
the focus ring is a box-shadow, no field constant types its own height, no
fixed-size utility on the paper, and the four broken things stay fixed),
f236, f227 and F96 (the last two re-pointed at the INSTRUMENT rather than the
product), f156 / f175 / F220 reversed in place, plus a live browser pass
measuring all twelve claims. Node 4,388/4,388. Browser: settings-tabs 65,
pages-read-alike 38, redline 95, clause-door 89, nav-floats 69,
home-pipeline 54, calendar 39, kpi-four 19, theme-tokens 40 — all green.

## THE PLATFORM FILLS THE MONITOR, AND THE CONTRACT DOES NOT (owner-ruled 28 Aug 2026 — WORKORDER-fixes-28-aug.md)

*"Many pages in the app shrink when I am in a desktop which does not give me a
full screen experience."* Recommendation taken the same day: **let everything
that is not the contract fill the monitor, keep the contract itself a readable
page, and give the whole platform one setting so no two screens can drift.**

**WHAT WAS WRONG WAS NOT THE WIDTHS, IT WAS THAT THEY DISAGREED.** A dozen pages
had each decided their own — 860 on two sheets, 900 on the Negotiations list,
1440 on the contract room's tabs, 78ch on a friction column — and **Insights →
Portfolio had never set one at all**, which is exactly why that is the page the
owner reads as correct. SAP calls the pattern **letterboxing** and its rule is
the one HaTi was breaking: an app may cap its width, but it may not let some
pages cap and others not when people move between them.

- **`--page-measure` IS THE ONE DECLARATION and its value is `none`.** `none` is
  a real value and it is the point: the chrome fills the monitor today, and if a
  cap is ever wanted it is ONE line rather than a dozen edits. `.ngl-wrap`, the
  People directory and the template library read it; `--room-measure` is KEPT as
  a name (three rules read it) and DERIVED from it, so it can no longer be a
  fourth opinion.
- **TWO THINGS ARE DELIBERATELY NOT IT, and each says why beside itself.** The
  AGREEMENT (`--doc-sheet-max`, below) and the friction brief's 78ch prose
  column — both capped for the same reason, that a line past about 80 characters
  measurably slows reading down. **The prose column is left a LITERAL on
  purpose**: it has exactly one consumer and a token with one reader is noise;
  what it needed was the reason written next to it.
- **NOT SWEPT, each for its own reason:** the counterparty's page (read by people
  outside the building on unknown screens — its own decision, and not in the
  ask), and the standalone documents in `js/views/healthreport.js` and
  `js/views/weekly.js`, which open their own windows and carry no `:root`, so a
  token there resolves to nothing.
- **THE SURPLUS BESIDE THE CONTRACT STAYS GREY** — owner-ruled 28 Aug with a
  screenshot. `RL_RIGHT_W0` stays 460, the resting split is untouched, and the
  cards do not grow into it. Keeping it means writing NO rule, which makes it
  the cheapest answer as well as the chosen one. **The cost, stated once:** the
  walk from a clause to its card grows with the window — about 163px at 1920 and
  483px at 2560. If it ever bites, the fix is to cap and centre the working area
  so sheet and cards travel together, never to widen the cards.

## A PAGE FILLS THE READER'S OWN SCREEN (owner-ruled 29 Aug 2026)

*"Pages are still not using full monitor and i have attached examples"* — three
screenshots, Home, Insights and Templates, each with the bottom half of a
2000×1030 monitor empty.

**THE WIDTH WAS ALREADY FIXED, AND THAT WAS MEASURED BEFORE ANYTHING WAS
TOUCHED** (the rule this file records for exactly this case): every page
reported `max-width:none` and painted to 1990–2000 of a 2000px window. **What
the screenshots showed was HEIGHT, and it was not a layout bug** — it was fixed
limits on how much a page shows. MEASURED at 2000×1030: **Templates drew 9 cards
of 47 and stopped 439px short; Home drew 4 decisions of 36.** A big monitor was
being shown a laptop's slice.

- **`rowsThatFit(el, rowH, min, max)` IS THE ONE READING** and every list that
  tops up asks it. **It is answered AFTER THE PAINT, which is the only time it
  can be** — the room below a list is whatever was drawn above it, and that is
  not known while the markup is being built. Same shape as `rlFitTabRow`,
  `ktFitSplit` and `regFitBandOffset`.
- **A ZERO IS NOT AN ANSWER, and that is the safety property the whole thing
  rests on.** A hidden pane, a page mid-render and a stage that lays nothing out
  all measure 0, and topping a working list up to zero rows would empty a screen
  that was fine. Every caller keeps its OLD count as the FLOOR — Home's four,
  the wall's eight — so where the measurement is not trustworthy the page is
  exactly what shipped, and the worst this can do is nothing.
- **IT ASKS THE SCROLLER THAT IS REALLY SCROLLING**, not the window: a view on
  `VIEW_OWNS_HEIGHT` builds its own (`#ig-frame`, `.cal-page`), which is the
  same trap `keepScroll` was carrying.
- **THE WALL FITS ROWS OF CARDS, NOT CARDS.** The card height, the row gap and
  how many sit on a row are all read off the wall itself, so a re-dressed card
  carries this with it and there is no number here to go stale.
- **IT RE-RENDERS ONLY WHEN THE ANSWER CHANGES**, or a resize drag would repaint
  the dashboard on every pixel.
- **THE COUNTING IS NOT CAPPED BY THE SCREEN — only the drawing is.** "39 more"
  and "see all 47" read the same `shown` list, so they follow the fit without
  being told, and the reading behind them is the whole book.
- **AND THE FRICTION CARD HAD A GAP RATHER THAN A CAP.** Its left column is
  PROSE and stops at 78ch for the reason written beside it, but its TRACK went
  on growing with the card — so past about 1500px the reader got a column of
  text with ~300px of dead white beside it and the tables squeezed. The track
  is capped at the same measure above 1500px, so the surplus goes to the
  evidence column. **Wide screens only**: at a laptop width nothing moves.
- **WHAT IS DELIBERATELY NOT FITTED, said out loud:** the friction page's
  most-contested clauses and friction-by-counterparty tables are a **top-8
  READING**, not a queue. Stretching them to the monitor would make the same
  report say different things on different screens, which is the fault the
  "counting is not drawing" rule exists to prevent. If more rows are wanted
  there it is a change to the reading and wants its own ask.

Tests: f252 (6 — the helper run for real, because the floor is arithmetic and a
browser is not needed for it), keeps-your-place-verify (the wall proved to show
more on a taller screen and to reach down it — 17 cards at 1030 against 10 at
700, bottom at 923px).

## A FILTER MAY NOT THROW THE READER TO THE TOP (owner-asked 28 Aug 2026)

*"When I click on the highlighted button the page jumps me to the top of the
screen. Fix and make a rule that and in any other area where this is an issue."*

**THE RULE IS AN OLD ONE APPLIED ONE LEVEL DOWN.** `setView` has enforced it
between views since it was written — re-entering the SAME view leaves the reader
exactly where they were — and every in-page repaint is the same case, each
re-deciding it by accident. **A press that NAVIGATES may land at the top; a
press that FILTERS, PAGES, SORTS or TOGGLES may not move the reader's place.**

**THREE THINGS WERE WRONG AND ONLY THE FIRST WAS KNOWN.**

- **`keepScroll` HAD ZERO CALLERS.** It sat in js/app.js doing exactly this job,
  published on window, and nothing in the product ever called it. **That is this
  codebase's most repeated defect wearing its other face**: the rlPaperFootHtml
  family is a name that was never PUBLISHED and so could never be reached; this
  is a name that IS published and that nobody ever reached FOR. f232's sweep is
  built to catch the first kind and cannot catch this one.
- **AND IT READ THE WRONG ELEMENT.** It measured `#content-scroll` alone — but
  every view on `VIEW_OWNS_HEIGHT` builds its own scroller inside `#content`,
  and Insights is one of them (`#ig-frame`). **Wired up as it stood, the fix
  would have shipped and the jump would have stayed.** It sweeps the id-carrying
  descendants of `#content` now and restores **BY ID**, because the caller is
  about to replace the markup and the element the position was read off will not
  survive it.
- **AND THE REPORTED BUTTON DID NOT ARRIVE AT THE FUNNEL.** The pager called
  `renderIntel()` directly while every filter beside it went through `again()` —
  which is precisely why THAT was the button the owner saw. **A rule at a funnel
  only holds while everything really arrives there**, and f251 pins it.
- **A SCROLLER WITH NO ID STARTS AT ITS OWN TOP, and that is the decision** the
  work order asked to be made once: the findings list (`.pf-find-scroll`) holds
  a different set of rows after any of these presses, so its own top is where it
  belongs. It falls out of keying on ids rather than needing a rule.
- **A TAB IS NAVIGATION AND MAY LAND AT THE TOP** (`intelRepaint` wraps the
  filters; the tabs call `renderIntel` plain). Different content arrives, so a
  remembered offset would drop the reader at an arbitrary point in it.
- **NOT SWEPT:** `openSettingsAt`, which writes `scrollTop=0` deliberately
  because everything arriving through it is a navigation with a name on it; and
  the settings page's patch-in-place rule, which is a stronger answer to the
  same problem. `js/views/negotiation.js`'s own `_keepScroll` map is a different
  job (many inner scrollers, not the page).

Tests: f251 (7), **keeps-your-place-verify (7, browser — the only place this can
be asked, because jsdom lays nothing out; it reports the owner's own bug against
the parent commit, 461 → 0, and 461 → 461 with the fix).** **NOTE THE INSTRUMENT
FAULT IT COST AN HOUR TO FIND: Playwright SCROLLS AN ELEMENT INTO VIEW before it
clicks it**, so a driver-click on a control above the fold moves the scroller
and the check then measures its own actionability rather than the product. The
presses are dispatched in the page, which runs the same delegated handler a
mouse does and touches nothing else.

## THE NOTES DRAWER IS A QUARTER WIDER (owner-asked 28 Aug 2026)

264 / 292 / 320 became **330 / 365 / 400** — **all three rungs together**,
because a drawer wider on a big monitor and not on a laptop is the fault that
ladder exists to prevent. **ALL THREE FACES** (owner-ruled 29 Aug): there is no
notes panel — `#context-panel` shows Activity, Alerts or Notes and they are the
same element at the same width, so widening one alone would make the drawer
change size as the reader switched face with nothing saying why. **It costs the
page nothing**: the drawer floats OVER the page rather than pushing it aside.

## THE PLATFORM CARRIES A 2px CORNER, AND THE CONTRACT DOES NOT (owner-ruled 26 Aug 2026)

Owner-asked off a drawn preview of Home and the negotiation page at 0, 2, 3, 4
and 6px: *"implement 2px across the platform apart from the contracts
themselves when they are visible on screen. They should look like word
documents when they are on screen."*

**THIS REVERSES "SQUARE CORNERS EVERYWHERE" (20 Aug 2026), and that entry is
reversed in place rather than deleted** — its exemption list is inherited whole
and extended, which is the half of it that was always load-bearing.

- **IT IS ONE NUMBER AND IT IS `--radius`.** The token family
  (`--radius / -sm / -md / -lg`) was declared on 23 Aug 2026 with **zero
  consumers between them**; 818 hand-typed zeros now read it, which is what
  makes "one line to change again" true rather than aspirational. **THE FOUR
  RUNGS ARE DELIBERATELY EQUAL** — one number, one look; splitting them is a
  later decision and would want its own reason.
- **2px IS THE MILDEST THAT READS.** Below it nothing changes; above it the
  product starts to feel friendlier than a legal tool. Measured on a preview
  before it was built.

**THE CONTRACT STAYS SQUARE, WHEREVER IT IS ON SCREEN**, so it reads as a
document rather than as a card. Each of these keeps a literal `0` beside a
comment saying why, and none of them may be pointed at the token:
- `.rl-paper` (the cream sheet), `.rl-doc` (its canvas), `.rl-clause.is-changed`
  and its margin rule;
- `.doc-surface` / `.hati-doc` and the Document tab's own `.blueprint` sheet;
- `.nego-doc` and `.nego-clause` — the room's two-pane paper;
- the counterparty's `.pv-sheet` and their `#pt-doc`, on screen and in print;
- the phone's `.m-paper`;
- the Compare dialog's sheet, and every `doc-surface` preview pane in the
  template library;
- **AND THE MARKS DRAWN ON IT** — `.nego-ins`, `.nego-del`, `.nego-resolved`
  and the room's `ins`/`del` rules. A tracked change in Word is a plain
  highlight; a rounded one reads as a chip laid over the wording rather than as
  the wording itself. This one was MISSED by the first pass and caught by f210.

**`--n-r-*` IS THE PAPER'S TOKEN NOW and stays 0.** It had four readers and
they were two different things: `.nego-doc` and `.nego-clause` are paper,
`.nego-card` and `.nego-work` are furniture. The furniture was pointed at
`--radius` directly and the token kept the document, which is what its name
means here now. **Do not point it at `--radius`.**

**A RULE HAS NO CORNERS TO ROUND.** `.rl-idx-head` (a hairline under a caption)
and `.ngl-w` (a bare coloured word) name NO radius at all — not even the
platform's. Both had one, both had `background:none;border:0;padding:0` beside
it, and a declaration there is noise the next reader has to rule out. f175 and
f184 assert the ABSENCE now, which is a stronger claim than the literal 0 they
pinned before.

**AND `.rounded-full` WAS DRAWING SQUARES — A PRE-EXISTING DEFECT, FOUND BY
CHECKING RATHER THAN ASSUMING.** The 20 Aug sweep squared every `.rounded*`
utility in the compiled Tailwind blob and took the CIRCLE class with it, so the
24 elements wearing it — the numbered approval steps among them — had been
squares ever since, and would have become 2px squares after this. It is
`9999px` again, written in **HaTi's own sheet, never the blob** (generated;
drops the change on the next build — the `font-600` lesson), same specificity,
later in source. The blob's own line is left exactly as found. **It is not
`var(--radius)`: a circle is not a corner.**

**OUT OF SCOPE ENTIRELY, each for its own reason** — the two standalone
documents (`js/views/healthreport.js`, `js/views/weekly.js`), which open in
their own window and do not carry this sheet; every export path; and the emails
in `server/server.js`, which were never in the 20 Aug sweep either. **CHECKED
RATHER THAN ASSUMED**: the sweep touched none of those files, because none of
them typed a `border-radius:0` to begin with.

**BUT ONE STANDALONE DOCUMENT IS BUILT INSIDE A TOUCHED FILE, AND IT WAS
BROKEN.** The negotiation-history report a counterparty can download is a whole
HTML file assembled in js/views/negotiation.js, and the sweep gave three of its
rules `var(--radius)` — which resolves to NOTHING in a file that carries no
`:root`, so every rounded box in the report squared off silently. **The block's
own comment had warned about exactly this**, in its own words, because the same
trap had already eaten its ins/del COLOURS once ("literal values, because
self-contained has to mean self-contained"); the warning named colours and the
next person swept corners. It is a literal `2px` again and the comment now names
both. f143 is the net and caught it on the first run. **THE STANDING RULE: a
`var()` of any kind is a bug in a file that will be opened outside this app —
and "which files are standalone" is answered by looking for the builders, not
by looking at the filenames.**

**THE COLOUR CENSUS IS UNTOUCHED AND THAT IS THE POINT** — a radius is not a
colour, theme-tokens-verify stayed 40/40 throughout, and if it had moved
something else would have moved with it.

Tests: f95, f175, f184, f210, f236, f246, f96 (claims REVERSED IN PLACE, never
deleted — three of them got STRONGER: "shares one token" beats "shares one
number", and "names no radius at all" beats "names zero").

## THE CONTRACT GETS THE SPACE BACK (owner-asked 22 Aug 2026)

"HaTi is not efficiently using the space to give the contracts a proper space."

**MEASURED at 1440x900 before the change: 291px sat above the first line of the agreement on the Document tab** — a third of the window — and 148px on the negotiation page. The design spends about 230 and 134.

- **291 → 249 on the Document tab, 148 → 140 on the negotiation.** **THE ROOM'S 6px TOP WAS REVERSED 25 Aug 2026** on the owner's ask that every header start the same distance below the shell bar (see ONE HEADER TOP): the wrapper reads --page-pad-t (16) again, so the document begins about 10px lower than this paragraph records. The rest of the saving — the head's gap, the fact band's margin and padding — is untouched, and it was the larger half. The savings came out of three joins in the CHROME: `.room-head`'s gap was doing double duty (it separated the crumb from the title AND the title from the fact band, so one number spent 24px on two joins that want different amounts) — 12px to 6; the fact band's own margin 10 to 2 and its padding 12 to 10; and the room wrapper's 14px top padding and 12px gap to 6 and 8.
- **NOTHING CAME OUT OF THE PAPER.** The sheet keeps its 34px top margin, because that is the DOCUMENT's margin and it is what makes it read as a document rather than as text in a box — the design gives its own sheet 32px for the same reason. A page that reclaims space by cropping the contract has answered the wrong complaint.
- WHERE IT STANDS AGAINST THE DESIGN: the negotiation page is now within 6px of it, the Document tab within about 18. The remainder is the sub-line, which the design's own head does not draw — it is the obvious next cut if the owner wants one, and it is left in place because its stream, round and updated-on facts are not in the fact row.

## THREE BUTTON LEVELS, ONE FILLED ACT PER PAGE (owner-asked 22 Aug 2026)

"The theme of how the buttons are designed should continue across the platform." `.ui-btn` in index.html carries three strengths and every screen inherits them:

- **`.ui-btn-primary`** — filled accent. **At most one per page** — the contract room's head gave its fill up on 22 Aug 2026 (owner-asked; see FIVE FIXES AND A CALENDAR) and now carries none, so "exactly one" is the ceiling rather than a quota.
- **`.ui-btn`** — accent border on a transparent face. An ordinary verb, still plainly a button.
- **`.ui-btn-plain`** — accent text, no border. For a head row where several verbs sit beside the one filled act.

**WHAT CHANGED IS THE FILL, NOT THE METRICS.** The base used to wear an accent TINT and a small lift, so a row of four secondaries read as four competing buttons and the primary had nothing to stand against. Padding, font size and weight are untouched (13px/600) **on purpose**: every button in the product wears this class, and the negotiation control row's four-rung fold ladder is measured in pixels — a metrics change here moves screens nobody was looking at. `.ui-btn-lg` is the head rows' own size — **14px in a 28px box** since 22 Aug 2026, one rung down from the 15/30 it arrived at (owner-asked: "reduce them by a size including the boxes").

**THE 17 Aug LESSON IS KEPT AND IS THE REASON THIS IS SAFE.** That decision ("a secondary has to look pressable", reported twice) was about **GREY** — this product has learned three separate times that a neutral-grey control reads as furniture. **Flat is not grey**: border and ink are both the workspace accent. Only the tint behind them went. f175's claim was reversed in place and still fails on a neutral.

**THREE FILLED BUTTONS BECAME ONE, and two of them reverse owner calls made earlier this month** — said out loud rather than slipped in: `ws-share` was filled on 09 Aug ("make the Share buttons visible in green"), `ws-new` was filled on the same call. Both are plain verbs now; the head's one fill goes to `wsNextAction`'s answer, which is the contract's own next act and therefore differs per contract. `ws-to-nego` (the Document tab's door onto the negotiation) dropped to the bordered level rather than to plain: it is the only way in from that tab, and the far right of a tab row is the one place a bare text verb genuinely gets missed. f91, f95 reversed in place.

**THE NEGOTIATION ROW FOLLOWS THE SAME RULE FROM ITS OWN SHEET.** `.rl-btn` cannot simply BE `.ui-btn` — its metrics feed rlFitTabRow's ladder — so it keeps 11.5px/700 and takes the platform's FACE. Change one, change the other. `.rl-btn-go` **was** that page's single fill and is flat since 23 Aug 2026 (owner-asked — see FOUR OFF FOUR MORE SCREENSHOTS). **AND IT LOST ITS WEIGHT THE SAME MORNING** ("publish round should not be bold"): the head-row pin no longer excludes it, so **nothing in that row is bold and nothing is filled** — the act leads by POSITION and its accent outline alone. Fourth reversal of "one filled act per page" by the same hand, and the pattern is settled: this reader reads emphasis as shouting. **BOTH BUTTONS WEARING THE CLASS CHANGED** (Publish Round and Close Round), exactly as when the fill came off. **SCOPED TO `#ws-head .room-acts`, which is what keeps it safe** — `.rl-btn`/`.rl-btn-go` also draw on the CONTROL BAR, whose metrics feed rlFitTabRow's fold ladder, and that row keeps its own 700; `.rl-btn-alt` keeps its violet because the playbook pass is the one control there that changes nothing on the table.

## THE SHELL'S SYMBOLS ARE ONE SET, DEFINED ONCE (owner-asked 22 Aug 2026)

Twenty-seven line symbols from the design mock-up, in a `<defs>` sprite at the top of index.html's body, referenced with `<use href="#i-…">`. One rule for all of them: a 16x16 box, a hairline stroke, `currentColor`, no fills except where a mark is genuinely solid (the Copilot spark, the overflow dots, the settings handles).

**WHAT THEY REPLACED WAS NOT A SET.** Some were solid glyphs at a 24 box, some 1.8-weight outlines, and they had drifted far enough apart that a filled folder sat two rows above a hairline shield — Home was a solid pie chart sized DOWN to 15px to stop it out-weighing its neighbours, which is a fix for a mismatch rather than a design. Every nav icon is 16px now and the column reads as one family.

**ONE DEFINITION, MANY USES, and that is the half that pays.** The Copilot spark was written out twice — the header button and the sidebar launcher — so the two could drift with nothing to catch it. Both point at `#i-spark`. The phone's Negotiate and Approvals marks, the two it shared with this shell, point at the sprite too (at `stroke-width:1.15`, which is the 1.8-on-24 weight the bar had, since they draw at 24px).

**EIGHTEEN ARE LIVE, NINE ARE WAITING** — more, down, up, left, right, edit, plus, sliders, clock. Every one is a mark this product already draws inline and one-off inside the view files; they are staged for the page-by-page redesign rather than swept now, because the sweep belongs to the page that needs them. The sprite's own comment names all nine. **If the page-by-page work stops, delete them** rather than letting them become furniture.

**THE FAILURE MODE IS SILENCE, which is why this has a browser file.** A `<use>` pointing at a symbol that does not exist renders an EMPTY BOX — no error, no warning, a button with a hole in it — and jsdom builds no shadow tree for `<use>` at all, so it cannot tell a resolved reference from a dead one. **type-and-symbols-verify** measures each icon's painted `getBBox()`, which is non-zero only if the reference really resolved. It also tells "not painted" apart from "broken": Insights is hidden until the portfolio is big enough, and four doors live in the Administration fold, which starts shut — the file opens the fold, and for a door the app itself hides it asserts the reference is sound and says so in the output rather than counting it as a pass.

SQUARE CORNERS EVERYWHERE — **REVERSED 26 Aug 2026 by THE PLATFORM CARRIES A 2px CORNER (below); read that first.** The half of this entry that STANDS is its exemption list — circles, the pill rule, the emails — which the new one inherits whole and extends. What follows is the record of the sweep, kept because the reasoning is the useful part. (owner-asked 20 Aug 2026, second pass — this completes what the first pass scoped to Home and the shell): ~810 rounded-rectangle radii swept to 0 across index.html and every js/ file — cards, dialogs, chips, badges, inputs, menus, toasts, the phone, exports. True circles stay circles, and the sweep PROVED each one rather than pattern-matching: `border-radius:50%` kept by rule, and a pill value (999/9999/99px) kept ONLY where the same style run declares equal width and height (13 dots and avatars wear pill values — a blanket `*{border-radius:0}` would have squared them). The compiled `.rounded-full` class is the circle class and stays; every other `.rounded*` utility is 0. The negotiation sheet's own radius tokens (--n-r-*) are 0. Emails in server.js are deliberately untouched — their own surface, like their Arial fallback.

## THE SHELL: A 44px DARK BAR AND A WHITE 240px COLUMN (owner-ruled 24 Aug 2026)

**THIS REVERSES 23 Aug's "the doors are white and the live one sits deeper", and the reasoning behind that day carries straight over.** The ask then was that a door read as strongly as possible against its ground and that the live one be marked by DEPTH rather than a veil. Both still hold; the GROUND moved. On white, "as strongly as possible" is the primary ink, and "deeper" is a filled well rather than a darker green.

- **`--nav-bg` STILL MEANS THE SAME THING** — "the deep brand ground, deeper than the accent ramp reaches" — it has simply moved from the left edge to the top one. Nothing that reads it (the hero gradient's survivors, the phone) needed to know. Its values took the design's exact stops: `#093733` green, `#0F2648` navy. `--nav-well` is NEW and belongs to the white column: the ground a hovered or live door sits on. **It needs a dark answer** — left undefined under `html.dark` the live door drew a near-white block under near-white text, so the one row you were standing on was the one row you could not read.
- **THE LIVE DOOR IS A 3px LEFT RULE IN THE ACCENT plus that well.** A left rule cannot be done with a veil and does not depend on the ground having anywhere darker to go, which is what makes it survive the dark theme with no override.
- **THE COUNTS KEEP THEIR ONE EXCEPTION.** 23 Aug's rule — a plain count is a fact, an amber count is a warning, and only above zero — is untouched. Only the plain ink changed, from white to the label shade, because the ground did.
- **WHAT THE BAR GAVE UP TO REACH 44px**: the 40px brand mark, the CLM chip, the "SME Contract Platform" caption and the profile's name-and-role text. The wordmark stays as live text; `#side-name` and `#side-role` stay in the DOM and stay written (they are the button's accessible name and half the suite reads them) — the bar simply stops PRINTING them beside the circle. The space they held now carries `#shell-title`, the page's own name, which nothing in the shell stated before.
- **THE NUMBERS ARE FOUR AND THEY MOVE TOGETHER**: `--shell-head-h:44px`, `--nav-w:240px`, `--row-h` unchanged, and **`--ctl-h` STAYS AT HaTi'S 28px** (owner-ruled: "buttons should stay at 28 but the rest should stick to the new design"). The open column reads `--nav-w`; `applyRail` used to type 256 in one line while the shell's own grid said 240, which is two answers to one question.

## BRAND AND THEME ARE TWO AXES, NOT THREE STATES (24 Aug 2026)

The old control was a menu of three mutually-exclusive themes — Green, Navy, Dark — so a reader on Navy who wanted night lost their brand, and there was no way back to a navy workspace after dark. **f96's own header had already noticed** ("navy-at-night already works in the stylesheet and is one row away in the menu if anybody asks for it"). Somebody asked.

- **THE BRAND IS THE WORKSPACE'S, THE THEME IS THE PERSON'S.** `setBrand` / `setDark` write `hati-brand` and `hati-dark`; `brandNow()` / `darkNow()` read them and **fall back to the single legacy key**, so 'navy' still opens a navy workspace and 'dark' still opens a dark one and nothing stored in anybody's browser moves. `themeNow()` is DERIVED from the pair rather than stored beside it — the phone's More sheet prints it and presses `toggleTheme`, and a second stored copy is how two shells come to disagree.
- **`applyAppearance` IS THE ONE PAINTER.** `applyTheme(mode)` still answers to a whole-theme name because boot and several callers pass one; it writes through the pair rather than keeping its own reading.
- **THE TWO SWATCHES ARE ADMIN-ONLY** (owner-ruled). Light/dark and language change what YOU see; the brand changes what everyone in the company sees, and a control that repaints the whole workspace does not belong one stray click from the search box for every member. Drawn rather than dimmed — a control whose only outcome is a refusal is furniture.
- **THE SWATCHES ASK WHO IS SIGNED IN, AND AT BOOT NOBODY IS.** `wireThemeMenu` runs once, before the sign-in wall, so `brandPickerVisible` answered false for everybody. Repainted from `renderPageHeader`, which runs on every view change — the first thing that happens after a successful sign-in.
- **EVERY DOM CALL BEYOND THE BASICS IS GUARDED.** Test stages stand a minimal element in for a real one: a bare `el.dataset` threw and took the whole shell's wiring — and therefore five unrelated views — down with it. The toast lesson, paid a second time.
- `#theme-menu`, `data-theme-pick`, `THEME_SWATCH` and `#theme-swatch` are STALE — flag any mention.

## THE LANGUAGE SWITCH IS IN THE SHELL BAR (24 Aug 2026)

The enterprise design draws no language control at all; HaTi is bilingual, so it needs one, and it sits in its own bordered group beside the appearance controls — the same kind of setting, changing what this reader sees and nobody else. `#lang-switch` keeps its id and `placeLanguageSwitch` is untouched.

## FOUR OFF FOUR SCREENSHOTS (owner-reported 22 Aug 2026)

**THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT.** What still stands:

- **The upload confirm's two columns stay level** — `grid-template-rows:subgrid`
  over three rows, so labels share a row with labels however either wraps. **The
  hint row is emitted even when empty**: subgrid places children by ROW, and a
  cell with two children puts its box in the label's row. A `min-height` on the
  label was refused — it breaks again at three lines.
- **An executed contract keeps its signing column**, drawn and GENUINELY
  DISABLED rather than dimmed (anchors lose their `href`; `disabled` does
  nothing to a link). **Both cards, not just the reported one.** `closed` reads
  negoExecuted, never `status==='Signed'` alone, and the one line saying so sits
  at the TOP of the column.
- **The people chip is one chip.** The flat treatment is the BASE rule, so both
  heads inherit it; the negotiation page's `#ws-head .dk-chip` override is
  STALE, and `.dk-chip-static` is still emitted and now styles nothing.
- **A search box is `--color-surface`, never the page grey** — the register and
  the value-stream page alike.

Tests: upload-party-verify, sign-links-verify, pages-read-alike-verify 6,
negotiations-door-verify 11.

## FIVE FIXES AND A CALENDAR (owner-reported 22 Aug 2026, off five screenshots)

**THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT** — including the three
owner decisions it reverses and why the width is what moved under them. What
still stands:

- **The change column is one white card.** `.rl-side` no longer switches
  `.rl-col`'s card off; it only adds the rail's padding, so surface, border and
  corner come from the one place the page defines them. Contents inset 16px, so
  caption, unsent band and cards share one left edge.
- **The card's bottom verbs carry no border, and the three-class selectors
  STAY** — that is what makes them win the cascade, so the next person who wants
  an edge here gets one. Each verb keeps its own INK (ruby refusal, accent
  alternative), which with no border is the only thing saying it is a control;
  `html.dark .rl-edit` is accent-300 for that reason.
- **The contract room's head carries no filled button at all**, and BOTH buttons
  in that slot changed — the next act and Evidence pack — or the head would be
  filled on some contracts and flat on others.
- **The working area lines up with the bands above it.** `#redline-host` is
  inset 24 on BOTH sides; the grid is neither capped nor centred, so the surplus
  goes to the doc track and the SHEET centres inside it at RL_SHEET_MAX.
  `RL_LEFT_MAX` survives as the sheet's measurement and clamps nothing.
- **A button in a head row has no business dressing itself.** The pin is
  `.redline-page #ws-head .room-acts button` — EVERY button that row draws, not
  the four reported — and it is scoped so it reaches neither `.rl-tabrow` nor
  `.rl-head`, leaving rlFitTabRow's fold ladder untouched. `.ws-more-btn` names
  no height of its own. Weight may still differ; nothing else may.
- **`.ui-btn-lg` is 14px in a 28px box**, everywhere that class draws.

## FOUR OFF FOUR MORE SCREENSHOTS (owner-asked 23 Aug 2026)

**THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT.** What still stands:

- **The counterparty's reading tabs sit on a row of their own** — `.pw-id-row2`,
  switch at its left and `#pt-nego-foot` at its right. Nothing was rebuilt:
  `rlReadSegsHtml()` is still the ONE builder and that foot is still their only
  postbox. Pinned as a GEOMETRY rather than a class, and **"share one line" is
  measured by CENTRES, never tops** — the two are deliberately different heights,
  so equal tops report a fault that is not there.
- **The reading buttons and the bell are not shaded.** Flat here is the ACCENT
  treatment, never a grey one — this product has learned three times that a
  neutral-grey control reads as furniture. Only the fill goes.
- **Nothing in a head row is filled**; the act leads by weight and position, and
  exactly one act is bold. Both buttons wearing `.rl-btn-go` changed together.
- **A head row draws ONE outline colour**, settled in the head-row pin above
  rather than in each class — two of those classes also draw on the control bar,
  whose metrics feed the fold ladder. `.ws-more-btn` names no border either.

## THE TWO HEADS SAY THE NAME AT ONE SIZE (owner-reported 22 Aug 2026, off three screenshots)

**THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT.** What still stands:

- **`.redline-page #ws-head` is `flex-wrap:nowrap`**, and the contract page keeps
  the wrap it depends on (its crumb and fact row are full-width items). **The
  title is what gives, not the row** — it carries the ellipsis, and `min-width:0`
  on its neighbours is what lets a flex child shrink below its content.
- **Both heads say the contract's name at 15px/600**, and the size is a FIXED
  rung, never `clamp()`.
- **A resting tab takes `--color-text`, not the label shade.** A tab is a thing
  you read and press, not metadata about one. THE FULL INVENTORY, so the next
  sweep is a check rather than a hunt: `.room-tab` · `.rl-readwrap .rl-seg` (the
  reference) · `[data-ig-tab]` · `[data-igf-days]` · `.st-tab` · `.m-ctab` (phone,
  ink only — a touch target is not a pointer target). **`.rl-fseg` is
  deliberately NOT on that list**: it is a filter, not page navigation.
- **`.st-tab` carries the room's own geometry** (`9px 1px`, 22px gap) so the
  underline is as wide as the word; they stay two rules and f236 pins them to
  each other. It declares no `font-family` of its own — `font:inherit` plus an
  override is two fallback orders.
- **`.reg-title` was already right and is PINNED** (pages-read-alike 5d/5e), so a
  later type pass cannot quietly pull it off the reference.
- **`.ngl-band > td` reads `--reg-head-h`**, written by `regFitBandOffset` off the
  header's own box — never a typed number, because a number that has to agree
  with another element's height agrees until somebody changes a padding. A height
  of ZERO is not a height, and it is OBSERVED rather than measured once.

## A NOTE ON theme-tokens-verify — RESOLVED 21 Aug 2026, KEPT AS THE LESSON

This section stood for over a week saying the file "scores 20/40 and has done
since well before this run", that the baseline was a stale snapshot rather
than a regression, and that somebody should re-record it "when they are ready
to own the current palette". **Somebody did.** It went to 40/40, it came off
the known-red list, and the standing rule is at THE NET above: re-record only
when deliberately owning a palette change, never to make a red run go away.

**RE-RECORDED 23 Aug 2026, AND HERE IS EXACTLY WHAT THAT ABSORBED.** The
sidebar-count change (boxes off, numbers white, amber kept) is a palette change
on a strip that is on EVERY screen, so it moved the census on 18 of the 40
checks — `rgba(245,158,11,.26)` and `rgba(255,255,255,.24)` leaving, and
`rgb(253,230,138)` arriving. That is somebody deliberately owning a palette
change, which is the one case the rule above allows, so the baseline was saved.

**AND THE LAST FOUR WERE RECORDED 23 Aug 2026, so the file is 40/40 and is a
working net again.** It had sat at 36/40 because the calendar redesign and the
head-row button pass both landed without re-recording. **EACH DIFFERENCE WAS
MEASURED AND CHECKED BEFORE IT WAS SAVED, not waved through** — re-recording is
how a real regression gets buried, so the rule is that you look at every value
first:

- `negotiate--light` and `--dark` lost `color(srgb .72549 .10980 .10980 / .45)`
  — the Reject button's 45%-alpha BORDER, removed by the owner-asked "the
  bottom buttons do not have lines around them". Checked that the verb kept its
  own ink rather than going quiet with its border: Reject still draws
  `rgb(185,28,28)` at 6.47:1, Edit `rgb(15,118,110)`, both with `border-width:0`.
  Only the semi-transparent border value left the census; the opaque ink is
  still in it.
- `calendar--light` and `--dark` moved on the redesign's own tones and
  surfaces — teal .11 → .45, the page tint re-hued to the design's neutral, and
  `rgb(148,163,184)` / `rgb(100,116,139)` arriving, which is `--st-gray` in each
  theme. That last one is the value that section records as the redesign's own
  caught defect (`--st-steel-dot` resolved to the workspace accent and drew two
  slices of one colour), so its presence is the FIX being recorded, not a drift.
  Re-checked that the four legend tones are still tellable apart: closest pair
  126 in light, and four distinct values in dark.

**NOTHING WAS ABSORBED SILENTLY** — the four values above are the whole of it.

**RE-RECORDED AGAIN 23 Aug 2026 for render B1's live tab.** AUDITED BEFORE SAVING and it is **one value on one screen**: `rgb(45, 212, 191)` — `--accent-ink` in dark, which the Tracked Changes live tab now takes — ARRIVING on `negotiate--dark`, with **nothing leaving and no other screen moving**. `negotiate--light` did not move at all, because `--accent-ink` resolves to accent-800 there and the census already held it. The fill and the white ink that Render B put on the live count are still in the census: they draw elsewhere on that screen. 40/40.

**RE-RECORDED AGAIN 23 Aug 2026, for the text-size stepper — and it is the SMALLEST re-record yet, which is what an audited one looks like.** Two values leave, on exactly two screens (`contract--dark` and `signing--dark`), and **nothing arrives**: `rgba(148,163,184,.14)` and `rgba(15,23,42,.5)`, which are the base `.rl-type-step` dark rules — the PRE-REDESIGN grey pill. They leave because the 22 Aug redesign's own block was scoped `.redline-page` and has now been unscoped, so the Document tab and the Signing tab finally wear the box the negotiation page has worn for a day. Nothing new appears because the redesign's dark background IS `--color-surface`, which was already in the census on every panel of those screens. The light halves never failed, because both rules resolve to white there. Audited before saving, as the rule requires; 40/40.

**RE-RECORDED ONCE MORE 23 Aug 2026** for the head row's outline (see FOUR OFF FOUR MORE SCREENSHOTS). AUDITED BEFORE SAVING, and it is one value: `color(srgb .0509804 .580392 .533333 / .5)` — `.rl-pb-btn`'s own 50% accent mix — gone from `negotiate--light` and `negotiate--dark`, with **nothing new arriving and no other screen touched**, because the button stopped naming its own outline and took the row's 45%, which the census already held. 40/40.

**RE-RECORDED AGAIN 23 Aug 2026 for the sidebar's own change**, and it moved all
20 screens because the drawer is on every one of them. Checked before saving,
and it is one change and nothing else: `rgb(159,216,209)` (the pale-teal door
ink) and `rgba(255,255,255,.15)` (the old white veil on the live door) leaving,
`color(srgb .0302 .1675 .1592)` — the darker green mix — arriving, identically
on every screen, and the same pair in dark against its own ground. The
`.st-tab.on` swap from `--color-accent-800` to `--accent-ink` moved NO colour:
`--accent-ink` IS `--color-accent-800` in light, and following the token is what
makes it right in dark. 40/40.

**TWO CHECKS WERE ALREADY RED BEFORE IT AND ARE NOW BAKED IN — NAMED HERE SO
THEY ARE NOT LOST.** MEASURED on the clean tree immediately before re-recording:
**38/40**, the two failures being `negotiate--light` and `negotiate--dark`, both
on one value — the `.rl-pb-btn` accent border
`color(srgb 0.0509804 0.580392 0.533333 / 0.5)`
(`color-mix(in srgb,var(--accent-solid) 50%,transparent)`) standing where a
slate tint used to be. That is the 22 Aug redesign owning a colour on one page;
its author reported it rather than re-recording, and re-recording now is what
turns "reported" into "recorded". It is not a defect and needs no chase.

**AND THE FIGURE BELOW WAS WRONG.** This paragraph read 26/40 and the note under
it read 39/40; the tree actually measured 38/40. A number nobody re-measures is
the fault this whole file exists to stop, so: re-measure before quoting one.

**RE-RECORDED 31 Aug 2026 for the calendar's agenda-window control (J-5.4), and
it is the smallest kind: TWO screens, ONE value, and NOTHING LEAVING.**
`rgb(138, 151, 149)` — `--field-line`, the border on the new `.cal-days`
`<select>` — ARRIVING on `calendar--light` and `calendar--dark`, with nothing
gone on either and no other screen moved. It is the token WO-4 measured for
exactly this job (a control boundary at 3.03:1 on white and 5.90:1 at night,
against the old shared mix's 1.97:1), so the value was already in the census on
every screen that draws a filter — only the calendar had never drawn one.

**AND ONE FAILURE WAS DELIBERATELY LEFT RED RATHER THAN SAVED WITH IT.**
`templates--light` fails, on `rgb(241, 245, 249)` (`--color-neutral-100`) having
gone from that screen. **IT IS NOT THIS RUN'S**, and that was PROVED rather than
asserted: a worktree at the parent commit, the same file run there, the same
`templates--light` failure and the same 39/40. So its line in the baseline was
restored by hand after `--save` had overwritten it, and the file is 39/40 with
one honest red. **THIS IS THE STANDING RULE DOING ITS JOB IN THE AWKWARD
DIRECTION**: `--save` re-records EVERY screen, so owning your own palette change
and burying somebody else's regression are the same keystroke. Diff the baseline
after saving, and put back any line you cannot explain.

**THE OLD NOTE, KEPT FOR ITS LESSON — it read 26/40 as of 22 Aug 2026.** (This paragraph said 39/40 and named one lost shade; the real figure was
taken by stashing an unrelated change and running the file on the clean tree.
The 22 Aug button and typography work moved colours on nine of the twenty
screens — the flat `.ui-btn` border and the accent ink are what the diff keeps
naming — and the baseline was never re-recorded for it. Re-recording is a
deliberate palette-ownership act, so it is reported rather than done in passing;
the file stays OFF KNOWN_RED so a real colour regression cannot hide behind it.)

**AND ONE SHADE WAS ALREADY GONE BEFORE THAT.**
`negotiate--dark` lost one shade — `rgb(17, 94, 89)` is in the baseline and
appears nowhere on that screen now. Found while checking the Inter swap for
ripples, and **it predates that work**: the same single failure reproduces with
every one of those changes stashed, which is how it was attributed rather than
assumed. Nobody has yet found which element stopped drawing it. It is recorded
here rather than re-recorded into the baseline, because a colour that vanished
without anybody deciding it should is exactly what this file exists to catch —
and quietly re-saving the census is the one thing the rule above forbids.

**The lesson is worth more than the note was.** A half-red file with a written
excuse beside it is the most comfortable kind of debt in a codebase — the
excuse was true, the reasoning was sound, and it still meant the one net built
to catch a colour regression caught nothing for a week. `run-all.js` states
the same rule in its own words now: an entry on KNOWN_RED is a promise that
somebody looked, printed on every run so it stays something you have to keep
reading rather than becoming the furniture. **Take a file off the list the day
it goes green.**

## SEVENTEEN THINGS OFF A BATCH OF SCREENSHOTS (owner-asked 24 Aug 2026 — WORKORDER-screenshot-fixes.md)

Five rounds of annotated screenshots, one work order, seven owner rulings.
**THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT**; read the work order
before extending any of it. What still stands:

- **WO-0 — the Scope rules are the first thing in this file and they GOVERN the
  Bug Fix Rules under them.** A separate problem you notice is one line in
  BUGLOG.md, never a fix. **And "this was already broken" is PROVED, not
  asserted** — run the file on an unmodified main in a worktree before saying so.
- **WO-2 / WO-15 — the register page carries no subtitle, no Renewal filter and
  no locked-scope chip**, so the filter row fits one line. `#reg-lock-chip` and
  `reg-renewal-sel` are STALE and `regPrimaryAction` has no caller. **The claim
  the chip made is stronger without it**: the narrowing is a property of the PAGE
  (`regScope`), not a filter anybody can press away.
- **WO-4 — a filter box wears `--field-line`, the strong neutral**, and the
  accent is kept for the ACTIVE one alone. `--btn-edge` is the BUTTON's token and
  `--field-edge` is STALE. Measured: the old shared mix was **1.97:1** against
  WCAG's 3:1 for a control boundary; `--field-line` gives 3.03:1 on white and
  5.90:1 at night, so no dark override is owed. **An active filter's ink is
  `--accent-ink`**, the one accent ink with a dark answer (2.35:1 → 9.59:1). The
  buttons stay accent — a grey button reads as furniture. Table headers are not
  uppercase.
- **WO-9 — `.reg-table` td AND th ellipsise**, and the row's height comes from
  `--reg-row-h`. **Measure before you fix, even when the report is your own**:
  the overflow this was written for had already been closed by `table-layout:fixed`.
- **WO-16 — the rows read 13px**, one rung under the platform's 14. Five inline
  cell sizes had to move in the markup, because a class rule cannot beat an
  inline style without `!important`. **The tests pin the RELATION, not the
  number.**
- **WO-6 — `.hm-sec` states an explicit `line-height`**: with none, the heading
  inherits 1.5 and the margin cannot reach the number alone.
- **WO-13 — `HM_ROW_TONES` / `HM_ROW_INKS` are applied BY POSITION, never by
  metric** — the four My-work tiles are the reader's own choice, so a colour keyed
  to a metric gives one workspace three ambers. **A dead tile takes no ink**: a
  coloured numeral in a greyed card is the card arguing with itself.
- **WO-5 — the float line comes from the SUPPORTED SCREEN SET**
  (test/chromium/laptops-verify.js), not from whoever is looking at it, and it is
  1440. See BELOW 1440 THE SIDEBAR FLOATS. **It is not pinned in a test** — it
  moved three times in two days on reports from real machines; nav-floats reads it
  off the app and home-page pins the DRIFT instead (the `<=` in js/app.js and the
  `max-width` in index.html must read as one number).
- **WO-11 — Copilot's greeting is an EMPTY STATE, not a stored message**, so it
  turns over with the language and a language change repaints an open panel. The
  ANSWER stays in the asker's language.
- **WO-12 — no page-change animation.** `.view-enter`, `rowIn` and `.stagger` are
  gone. **`@keyframes viewIn` IS KEPT and that is the trap**: `.modal-in`,
  `.ai-msg` and the contract overlay all read it. Check every reader of a keyframe
  before deleting it.
- **WO-7 — Insights' two tabs share one margin**; the left column takes
  `max-width:78ch` rather than a measure nobody else on that page uses.
- **WO-8 — the whose-asks control sits in the head's top-right.** Moving it was
  all WO-8 did; it was already a dropdown. Its safety properties are named under
  the column's own entry.
- **WO-3 — `rlPlanBandHtml` is a `return ''` STUB**, and js/redlineplan.js, the
  `rp_*` wording and the `.rl-plan` rules are dormant, not deleted.
- **WO-14 — a reading is not a working posture.** On "as agreed" and "with
  changes" the change column greys and REFUSES the press (`pointer-events:none`,
  not merely dimmed) and no clause offers a pencil. The strip that explained it is
  gone and `.rl-idx-reading` is STALE — **the three reading tabs are the way
  back**, drawn on every paint.
- **WO-10 — three check symbols on the negotiation head**, symbols only with the
  name on the hover, no state dot. They open the SAME side panel the Document
  tab's Checks card opens — never a second runner — and they sit OUTSIDE
  `.room-facets` so Collapse never takes them away. **`.room-facts` is a flex
  row**: as a block, `margin-left:auto` had nothing to push against and the
  symbols took a whole line at the LEFT wall.
- **WO-17 — the Negotiations door opens the LIST, on both shells.** There is no
  special case left in that funnel, so every door inherits the answer. The memory
  is KEPT, not deleted: `negoRememberOpened` still records and `negoLastOpened`
  still answers, so the reopen is one argument to put back.

**WHERE THIS DIVERGES FROM THE ENTERPRISE DESIGN REFERENCE, said out loud**:
`--ctl-h` stays at HaTi's 28px (owner-ruled); the reference's italic cut is not
used anywhere; the filter SIZE and HEIGHT are deliberately not taken from it (the
ask named the outline, and growing those controls pushes the bar toward the
second line WO-15 exists to prevent); and the reference gives no guidance on the
change column or the counterparty's page, which keep their own decisions.

## THREE OFF THREE SCREENSHOTS (owner-asked 25 Aug 2026)

**THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT.** What still stands:

- **The float line is 1440** — see BELOW 1440 THE SIDEBAR FLOATS.
- **The Negotiations page draws no resting subtitle**; `ngl_sub` is STALE and
  left inert. **`ngl_sub_filtered` STAYS and is not the same kind of thing**: it
  resolves a contradiction on screen — the sidebar door counts CHANGES waiting on
  this person while the bands count AGREEMENTS in the filtered view — and it
  draws only when a filter is on. **A SENTENCE THAT LEAVES A SLOT MUST BE
  FINDABLE IN ANOTHER ONE BEFORE THE SLOT IS DELETED**; this one has no other
  home, so it kept its own.
- **The head's fact values are 600.** ONE rule reaches both heads, because
  roomFactsHtml is one builder with two homes and a weight written at a call site
  is how the two would disagree. The SIZE is deliberately not moved, and
  `.room-facet .v .ngl-w` keeps its own 700.

## ONE HEADER TOP, ON ALL TWELVE PAGES AND AT EVERY HEIGHT (owner-asked 25 Aug 2026, three times)

*"For all the headers, the distance from the edge on top of the screen to the
header should be the same across the platform and using home page as the
reference."* The first pass, the day before, had reported this done. It was not,
and the two reasons are the useful part.

- **IT MEASURED THE BOX, NOT THE INK.** An element's bounding box top is its
  LINE box; half-leading puts the glyphs somewhere else inside it. MEASURED:
  every page head's box sat at exactly 16, and Home's and the Calendar's GLYPHS
  sat at 18 — because each centres a 24px title in a row carrying a 28px
  control (Home by `align-items:baseline`, the Calendar by `center`). Identical
  padding, different-looking gap. **THE FIX IS AT THE CAUSE, NOT A NUDGE**:
  `#hero-draft` takes `align-self:center` and leaves the greeting's baseline
  group (a control's baseline is its label's, which sits lower than a title's);
  `.cal-head .ttl` takes `align-self:flex-start` and leaves its row's centring.
  **A 2px NUDGE ON EACH WOULD HAVE WORKED AND BEEN WRONG** — it survives until
  somebody changes a line-height, and says nothing about why.
- **AND IT SWEPT THE PAGES, NOT THE ROOMS.** The contract room's header began
  **6px** below the bar and the negotiation page's **13**, against everyone
  else's 16 — and those two are the ones a reader actually notices; 2px is not.
  The room's wrapper reads `--page-pad-t` like every other view root now, and
  `.room-band`'s full-bleed negative margin reads the same tokens rather than
  typing 6 and 16 (that pair has to equal the wrapper's padding exactly or the
  crumb moves). **THIS REVERSES THE 6px TOP OF 22 Aug** — an owner ruling, so
  it is named: the document on the Document tab begins about 10px lower.
  MEASURED: 249 → 260 above the first line of the agreement.
- **THE NEGOTIATION HEAD IS ONE ROW, so its title is centred against its own
  28px buttons** and its glyphs land `(--ctl-h - 18px) / 2` below the row's
  top. Its padding takes that back, DERIVED FROM THE TOKENS rather than typed,
  so a change to the control height carries the head with it.
- **THE RULE, STATED ONCE:** the first painted glyph of a page's header sits
  `--page-pad-t` below the shell bar, on all twelve pages. **Home is the
  reference and 16 is Home's own page padding** — what moved on Home was the
  2px its own button was adding, not the measure.
- **THE SIZE AND WEIGHT COMPARISON STAYS SCOPED TO THE PAGE HEADS.** The
  contract room and the negotiation page carry a 15/600 title by the owner's
  ruling of 22 Aug ("the two heads say the name at one size"); demanding Home's
  20/700 there would be one rule arguing with another. Only the TOP is
  universal.

- **AND IT WAS MEASURED AT ONE HEIGHT, WHICH IS THE THIRD REASON** (owner
  reported it a third time: *"i do not see this in the platform as the headers
  are still vary as far as distance to the top edge"*). The headers DID line up
  — at the 1000px viewport the check runs in. **index.html's own short-laptop
  block says why that is worthless, in its own words: "almost no laptop has
  900px of page."** The same mistake, in the other dimension, in the file that
  records it. MEASURED at 1440x800: Home's header at 10, the Calendar's and the
  two room heads' at 16, and the seven shared ones at **24** — a **15px spread**
  on every machine anybody actually uses.
  **TWO `!important` RULES CAUSED IT AND BOTH WERE WRITTEN FOR A HEADER THAT HAS
  MOVED.** `.hm-page{padding-top:10px}` tightened HOME's top and nothing else's,
  so Home rose alone; and `#page-head>div{padding-top:8px}` set the SHARED
  header's padding back when that inner div was what carried it — the padding is
  on `#page-head` itself since 25 Aug, so the rule stopped being a reduction and
  became an **addition**, 16 plus 8. **Both are deleted rather than corrected**:
  a second opinion about the header's top is what caused this.
  **THE TOP IS ONE TOKEN AT EVERY HEIGHT NOW.** `--page-pad-t` is what tightens
  (16 → 10 under 820px of page, → 8 under 680), and every header reads it —
  `#page-head` through renderPageHeader, `.hm-page`, `.cal-head`, `.ngl-page`,
  the room wrapper, and the negotiation head through its own calc. The headers
  stay level at every height BY CONSTRUCTION rather than by four rules agreeing.

Tests: pages-read-alike-verify section 8, rewritten to measure a Range's own
rect on every page including the two room heads — **it reports eleven pages out
of line against the code that preceded it**, naming the room at 6px and the
negotiation page at 13 — and then rewritten again to sweep at TWO heights, 1000
and 760, where it reports **all twelve out of line** at the short one. It also
asserts the tightening is real: a short window has to pull every header up
TOGETHER, or "they all agree" is satisfied by nothing moving at all.

## NO PAGE EXPLAINS ITSELF UNDER ITS OWN TITLE (owner-asked 25 Aug 2026)

Off a screenshot of Import contracts with its line ringed: *"remove these
explanations below the headers in all pages where the explanation is there."*

- **THIS FINISHES WHAT 24 Aug STARTED AND REVERSES ITS OTHER HALF.** That day
  the Contracts page lost its line and the ruling recorded here was "ONLY THIS
  PAGE — every other page keeps its own"; this is the owner looking at the rest
  of them and asking for the same thing. The reasoning that removed the first
  one covers all of them: a sentence describing the page to a reader already
  looking at it.
- **DRAWN NOWHERE, RATHER THAN EMPTIED CASE BY CASE.** `commandMeta` still
  returns its second element and every `pg_*_sub` key stays in the dictionary,
  inert — eighteen cases each returning `''` is eighteen places a sentence
  could come back through. There is no `<p>` in the header markup to put one
  in, which is what f238 asserts.
- **`PAGE_HEAD_INLINE_SUB` IS STALE** — flag any mention. Insights was its one
  member, and the 13 Aug ask that put that sentence on the title's line was
  about WHERE it sat, not whether it should exist; the charts keep the room it
  bought them and gain the rest.
- **WHAT IS DELIBERATELY LEFT, and each is a different kind of thing.** Home's
  date line and the Calendar's counts sit BESIDE their titles and are facts
  about the workspace, not descriptions of the page. The contract room's and
  negotiation page's sub-line is the contract's own (stream, round, value,
  updated). And the Negotiations list keeps `ngl_sub_filtered`, which draws
  ONLY when a filter is on and exists to resolve a contradiction between two
  counts on screen — it is not describing the page either. Say so if the owner
  points at any of them; none was in this ask.
- **DIVERGES FROM THE DESIGN REFERENCE**, which draws a subtitle on every
  screen header. Recorded as the owner's ruling, twice made, not as drift.

Tests: f238 (the builder has no paragraph and no branch that could put one on
the title's line), pages-read-alike section 8 (swept live across all fourteen
pages, including Import — the one that was screenshotted), insights-panels
section 5 (four claims REVERSED IN PLACE: what the 13 Aug move bought the
charts is untouched, where the sentence sat is gone, and its narrow-window
check moved from 720px to 820 — below 768 the desktop shell is hidden and
`#page-head` measures 0, so the old check was reading a hidden element's text
and could never have caught a layout fault).

## SIX OFF A MORNING OF SCREENSHOTS (owner-asked 25 Aug 2026)

**THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT** — including the first
hour of it, which reviewed a branch three commits behind main and reported two
faults that were already fixed. **Check the remote before measuring.** What still
stands:

- **One measure for the contract room's four tabs** — `--room-measure`, **which
  is `var(--page-measure)` since 29 Aug 2026 and no longer 1440px; see THE
  PLATFORM FILLS THE MONITOR. The reason it exists is unchanged and is answered
  more widely: the tabs still agree with each other, now with every other page
  as well** —
  read by `.terms-grid`, `.sign-grid` and `#ws-history-pane`. They had three
  different caps, so one contract read as three differently-sized pages.
- **The History tab's five filters take the row**: `flex:1 1 0` with a 132px
  floor and NO ceiling — a ceiling is what left the surplus unused.
- **The clause panel's History | + notes wears `.rl-segwrap`/`.rl-seg`**, the
  seat switch's own classes, named in one rule with `.rl-actions` so the two
  cannot drift. `.rl-cp-segs` carries LAYOUT only.
- **"+ Propose new wording" is an ordinary `.ui-btn`** — no fill. Its HEIGHT is
  deliberately left at 34 to match Edit with Copilot beside it; a 28px box would
  leave the pair 6px apart, which reads as a mistake.
- **The clause editor keeps the shell on screen**, and its duplicate Playbook
  scan is gone — same attribute, same handler, so it changed a panel on the far
  side of the screen. `.ce-act-plain` is STALE.
- **Two verbs on the face, the rest in the ⋯.** `rlFaceSplit` cuts ONCE after the
  finished list — every branch still pushes the verb it always pushed, so each
  keeps its seat, desk and review rules. `RL_FACE_RANK` decides which two stay and
  the built order decides how they draw. **ONE EXCEPTION**: a change a reviewer is
  HOLDING has no decision and nothing to send, and its remedy is named in words,
  so the ask is promoted to the front — a remedy named and then folded into a menu
  is a refusal with no way forward.
- **The ⋯ guard reads the face and the overflow as one pool**, so a verb cannot
  appear twice; it tested only for Edit and shipped a duplicate.
- **The card reads one rung smaller and the heading two**, and nothing below the
  heading ends up larger. The summary kept the PRIMARY ink as a deliberate,
  scoped exception — it is the wording of the change — and **that half is
  REVERSED IN PLACE 2 Sep 2026**: the primary ink moved to the reference line
  above it and the wording took the label shade, on the owner's own ruling. See
  THE REFERENCE LEADS AND THE REDLINE READS QUIETLY.
- **No backtick in a CSS comment inside a CSS-emitting literal.** `clauseEditorCss`
  returns a template literal; one pair ends the string and evaluates what is
  between them. Say "terminator" instead.

## SIX OFF FIVE SCREENSHOTS (owner-asked 26 Aug 2026)

**THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT.** What still stands:

- **The chart library is ours to serve** — see THE CHART LIBRARY IS OURS TO SERVE.
- **Home's tile heights**: this entry's `--hm-tile-h` was SUPERSEDED the same day
  by the three-region skeleton under SIX OFF THE OWNER'S LIST. `--hm-tile-h` is
  STALE — read that entry, not this one.
- **The ⋯ dropdown draws no header.** The menu opens hard against the ⋯ it was
  pressed on, whose id and clause name are still on screen, and the press now
  lights that card and scrolls the paper to its clause. **The change id is not
  lost**: it is the ⋯ button's own aria-label. `.rl-more-head` is STALE.
- **`rlMorePlace` MEASURES rather than guesses** — CSS cannot see how many rows a
  change earned or how far the reader has scrolled. **The bound is the nearest
  SCROLLING ancestor, not the window**, because the cards live in their own
  column. It flips up when there is no room below, **and caps its height and
  scrolls inside itself** when it fits in neither direction — flipping alone only
  changes which rows are lost. Down wins a tie.
- **The ⋯ also takes you to the clause**: one call to `rlLinkFocus` with source
  `'card'`, the same act the card's head performs, so the column does not scroll
  under the hand already on it. The press stays `stopPropagation`'d because this
  handler navigates itself — letting it fall through would re-enter the same
  listener's shut branch.
- **WHOSE ASKS is a label, not a signpost**: it takes `.rl-idx-title`'s own type
  rather than the 11px uppercase micro-caps this product reserves for a heading
  OVER a list. It does not take that rule's ink or its accent underline.

## SIX OFF THE OWNER'S LIST (26 Aug 2026 — WORKORDER-fixes-26-aug.md)

**THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT**, including the merge
with main that met a parallel session on two of the same controls. What still
stands:

- **L-1 — the ⋯ menu reads as one kind of row.** Every row is `--t-label`, which
  IS the face verbs' own token, so the claim is a RELATION and the next type pass
  moves both or neither. Nothing is bold (the Copilot lead row keeps its violet
  and loses its weight). `white-space:nowrap` is a GUARANTEE, and it is the LABEL
  that gets shorter when one does not fit, never the type. **The symbols come
  from the shell's sprite** in `currentColor`, so each mark takes its row's ink
  and Reject stays red with nothing said twice; `i-check` and `i-x` were added for
  the two decision verbs. `rlMoreWithIcon` inserts after the opening tag and
  rebuilds nothing, so the borrowed verbs are the SAME buttons the face draws; an
  unrecognised verb keeps its own markup rather than wearing the wrong symbol.
- **L-2 — a narrowed column is said by its own control**, not by a band. See A
  NARROWED COLUMN IS SAID BY ITS OWN CONTROL.
- **L-3 — `rlCpSetShown` returns whether it actually opened**, and the card's
  Edit says `ng_cp_cannot_open` when it did not. A silent refusal here is a dead
  button from the reader's chair. **And the net had a kindness in it**:
  parity-verify pressed Edit and then fell back to the clause pill, so it passed
  either way from the day that fallback was written. The answer is taken BEFORE
  the fallback now.
- **L-4 — Home's rows own three regions and every card borrows them**:
  `--hm-r1` header · `--hm-r2` figure · `--hm-r3` foot, each card `grid-row:span 3`
  with `grid-template-rows:subgrid`, so titles line up with titles because they
  sit in the same row of ONE skeleton. Both grids read the same three tokens, so
  the two rows are one height by construction rather than by two numbers agreeing.
  Every row is `minmax(token, auto)` — Swedish is longer and a narrow window wraps.
  **ROW GAP ZERO IS LOAD-BEARING**: a card spans all three rows, so a row gap falls
  INSIDE it. `.hm-sp` and `--hm-tile-h` are STALE.
- **L-5 — no module may declare a top-level name another module publishes.** A
  function declaration is hoisted over the whole file, so a private `lsGet`/`lsSet`
  in js/app.js silently captured every bare call in that file — including
  `setView`'s, which stored the page you were on as unparseable text and lost your
  place on every refresh. Nothing failed and nothing logged. They are
  `brandRead`/`brandWrite` now, and **f232-6 is the net**; it also NAMES the three
  older clashes (`approvalState`, `approveContract`, `esc`) rather than sweeping
  them up in passing.
- **L-6 — a full-window layer comes down when the page changes.** `viewLayersClosed`
  sits at the top of `setView`, so all five doors inherit it; the clause editor is
  the only such layer in the product and a second one joins that function rather
  than growing a rule. **A repaint is not a navigation** — same view in, layer
  untouched. It asks before throwing away wording, and **the predicate is not the
  foot's**: `clauseEditorDirty` measures against the text the editor OPENED with,
  because the foot's own reading is TRUE from the first frame on a clause that
  already carries an ask. `_leavingCe` is what makes it one question per press.

## ONE CONTROL ROW, AND IT IS THE HEAD ROW'S OWN RUNG (Young ruled 10 Sep 2026)

Off two screenshots, one per page, each with the lower row ringed: *"the
buttons at the bottom should be shorter and have the same height as the buttons
above them. They should also take the same font size as the fonts in the
buttons above and also not in bold like the ones above ... Only the shaded
buttons should bold."*

**TWO PAGES CARRIED TWO CONTROL HEIGHTS ONE UNDER THE OTHER, AND THE TWO HALVES
WERE WRONG IN DIFFERENT PLACES** — measured on both before anything was
touched, which is what stopped this being one blanket sweep:
- **The Document tab's slot** was 32px, mixed 13px and 14px, with the RESTING
  half of the switch at weight 700 — against a row of acts forty pixels above
  at 28px, 14px and weight 400.
- **The negotiation page's control row** was already 28px and already unbold;
  what was wrong there was only the SIZE, 13px against the head row's 14. That
  is exactly what each screenshot's own wording asked for — "shorter" on the
  first, "the same size" on the second — and reading them as one instruction
  would have been a change nobody asked for on one of the two.

- **`.ui-btn-lg` IS THE RUNG AND BOTH ROWS ARE MEASURED AGAINST IT** —
  `--ctl-h` at `--t-body`, weight 400. Every claim is written as a RELATION
  between the two rows rather than against a typed number, so a later type
  retune moves them together and costs no test edit.
- **ONLY THE SHADED HALF IS BOLD**, on both pages: once a row reads at one
  weight, the lit half of a pair is what stands out of it, and it is the only
  thing that needs to.
- **SCOPED TO THE GROUP THAT WAS RINGED.** On the negotiation page that is
  `.rl-head`, and the rules say `:not(.rl-readwrap)` as well — the reading tabs
  (Redlined / As agreed / With changes) share `.rl-segwrap` with the seat
  switch, are a 44px tab bar before the spacer, and were not in the ask. The
  counterparty's header draws the same builders and is untouched for the same
  reason.
- **EVERY CONTROL THE ROW DRAWS, not only the four in a screenshot.** The
  head-row pin one page along records why in its own words: a rule naming
  today's controls is one the next control walks past, and a row at two sizes
  is what was reported. So the "N needs you" chip took the size too.
- **"ALL NEGOTIATIONS" HAS NO BOX TO LINE UP.** It is a bare text link — no
  border, no fill, no padding — so it takes the size and is checked for sitting
  on the other controls' centre line, not for a height it does not have.
- **THE FOLD LADDER IS UNCHANGED AND WAS RE-MEASURED, which was the one real
  risk**: `rlFitTabRow` measures that row in pixels, and bigger type could have
  made it bite earlier. control-row-folds-verify holds one line at 1240 through
  940px, every word intact, 27/27.

Tests: f277 (11) (the rung as a relation, both rows, the scoping proved by
sweeping every selector in the block), plain-english-verify 1i-1l (**3 fail
against the parent, reporting `slot 32` against `head 28` and a resting half at
weight 700**), control-row-folds-verify (**1 fails against the parent, reporting
`row 13px` against `head 14px`**).
