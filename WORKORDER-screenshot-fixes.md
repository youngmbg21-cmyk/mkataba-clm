# WORK ORDER — seventeen fixes off the owner's screenshots

**Raised by:** Young, 24 Aug 2026, across five messages of annotated
screenshots ("Do not code but review and create a plan to fix…", then two more
batches, then "create a work order for the other fixes and updates we have
discussed and wait for my word to begin the fixes").
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Branch:** `claude/ui-spacing-styling-localization-63iz8i`.
**Reference:** `HaTi_Platform_Visual_Refinement.zip` — the twelve-screen
enterprise design handoff (README.md, TYPOGRAPHY.md, tokens.css, fonts.css,
the interactive demo and the prototype source). Attached by the owner the same
day, reviewed in full before this order was written.
**Status:** NOT STARTED. The owner's word is required before any code is
written. Four decisions below are still open and two of them block their item.

---

## The plain-English version, for the owner

Ten things, all reproduced in a real browser before anything was proposed.
Four of them are smaller than they look — the control is already on the screen
and cannot be seen, or the space it should sit in is already reserved for it.
Two are bigger than they look. Four of the ten disagree with the design
reference the owner has just supplied, and each of those is listed below by
name so the owner can rule rather than discover it later.

The readable version of all of this is the artifact
**"Fixes From Your Screenshots"**.

---

## Before anything: the branch is five commits behind

MEASURED: `origin/main` is five commits ahead, and one of them — "The
negotiation page takes the render" — rebuilt the exact screen items WO-8,
WO-9 and WO-10 are about. The owner's screenshots are of MAIN. My branch does
not contain the "Change index" head, the filter dropdown or the Copilot band
at all.

**First act of the run: bring the branch up to `origin/main`, then re-measure
WO-1 to WO-7 on it before touching them.** Two of those five commits are the
calendar's; one is the negotiation page's; none obviously touches Contracts,
Home, Insights, the nav or the Copilot panel, but "obviously" is not a
measurement and this file's whole method is that it does not guess.

---

## THE REFERENCE BUNDLE, AND WHERE THIS WORK DIVERGES FROM IT

The bundle is explicit about its own standing: *"the files in this bundle are
design references… not production code to copy directly"*, lift `tokens.css`,
`fonts.css` and `TYPOGRAPHY.md` verbatim, recreate the rest with the
codebase's own primitives. HaTi has been built to this design since 20 Aug and
already matches it on the shell (44px bar, 240px nav), the page ground
(`--page:#EDF1F2` is byte-identical to HaTi's `--color-bg`), the row height
(36px), the face (Inter) and the section-header rhythm.

**FOUR OF THE OWNER'S TEN ASKS OVERRULE THE REFERENCE.** Each is legitimate —
the owner is the customer for both — but each must be recorded as a deliberate
divergence in CLAUDE.md, or the next person reads it as drift and "fixes" it
back.

| # | The owner asks | The reference says | Ruling |
|---|---|---|---|
| WO-4 | Table column headers must not be all-capitals | Type scale: *"11px/700 — Column headers and section eyebrows — always with `letter-spacing:.06em–.08em; text-transform:uppercase`"*, and again under Letter-spacing: *".06em on table column headers"* | **Owner overrules.** Record it. |
| WO-2 | Delete the Renewal filter from Contracts | The Contracts filter bar is five chips and one of them is **Renewal type**, drawn in its ACTIVE state | **Owner overrules.** Record it. |
| WO-6 | Take a third off the Home section headings | *"Section headers throughout: `display:flex; gap:10px; margin: 14px 0 8px`, an `<h2>` at 14px/700"* — which is exactly what HaTi draws and exactly the 41.6px measured | **Owner overrules.** Record it. |
| WO-4 | Filter outlines should match the buttons | Agrees they should match — but has both on `--field-line` (#7F8E8B, a strong grey). HaTi's buttons wear an accent-45% border because the owner reported TWICE (17 Aug) that a grey secondary reads as furniture | **Match the buttons as they actually are** (accent). See WO-4. |

**TWO ASKS THE REFERENCE ACTIVELY SUPPORTS**, which is worth as much:

- **WO-9, the sideways-scrolling table.** TYPOGRAPHY.md §6 is explicit: *"Every
  table cell… `min-width:0; white-space:nowrap; overflow:hidden;
  text-overflow:ellipsis` on the cell, and the grid track is `minmax(0, Nfr)` —
  **never bare `Nfr`**"*, and *"Column header cells: same three properties"*.
  Every table in the prototype is a CSS grid with a DECLARED column ladder —
  fixed px for the rigid columns, `minmax(0,Nfr)` for the text ones. The
  reference names exactly four tables that get a horizontal scroller (Requests
  Queue 1120px, Closed 980px, Clause library 900px, Obligations 1040px) and the
  **Contracts register is not one of them** — it is meant to fit. So the fix in
  WO-9 is the reference's own method, and HaTi's auto-sizing table is the
  divergence.
- **WO-7, the Insights friction margins.** The reference draws the friction
  panels full-width inside the page padding (`1.15fr 1fr`), with no centred
  card and no gutter.

**TWO ASKS THE REFERENCE HAS NOTHING TO SAY ABOUT:**

- **WO-5, the nav collapse and float.** *"The console assumes a desktop
  viewport."* The nav is a fixed 240px, and the shell bar's Menu button has **no
  handler at all** in the prototype — it is decorative. Collapsing to symbols
  and floating over the page are HaTi's own inventions; there is no design to
  follow, only HaTi's own history.
- **WO-10, the check symbols on the negotiation page.** The reference's
  negotiation header is a six-cell facts strip spanning the full width, so it
  has no gap at the right where the owner drew the box. HaTi's own head draws
  four facts and leaves that space. **If HaTi later adopts the six-cell strip,
  the symbols must move to the acts row** — build them as their own group so
  that move is one line.

**ONE KNOWN, OWNER-APPROVED DIVERGENCE, restated so nobody "corrects" it:**
`--ctl-h` is **28px** in HaTi and **32px** in the reference. Owner-ruled
22 Aug: *"buttons should stay at 28 but the rest should stick to the new
design."*

**AND ONE THE REFERENCE FLAGS THAT HaTi DOES NOT OBEY, out of scope but
recorded:** *"Animation — the only motion in the app is the status dot's
pulse… Do not add transitions; the density reads as sluggish with them."*
`.ui-btn` carries a 150ms transition on three properties. Not in this order;
worth a line in CLAUDE.md so the next design pass decides it deliberately.

---

## Standing rules for this run

1. Bug Fix Rules in full. Find every place a thing appears before changing it;
   fix every place; anything deliberately left alone reaches the owner in
   plain English.
2. **The lint runs first and costs seconds** (`npm run lint`). Then targeted
   node files while working. The FULL suite once, when the work is believed
   finished — and again only if that run found something.
3. **One browser file per screen changed.** Every claim in this order is a
   COMPUTED value or a geometry: this codebase's most repeated visual defect is
   a rule that looks correct in the source and loses a cascade fight, and a
   source-reading test cannot see it.
4. **Pin the RELATION, not the number.** The 1,994-size sweep of 22 Aug cost
   five test edits, four of them because a test had pinned a literal px where
   the claim was a relation.
5. Every new check is **run against today's code first, and watched to fail.**
   A check that passes either way proves nothing.
6. No backticks in a CSS comment inside a JS template literal (f236's rule) and
   no comment opened inside another (the swallowed-rule fault).
7. Anything published on `window` that another module reads must be in an
   export list (f232). Three of these items touch cross-module calls.

**INHERITED STATE, measured on this branch before any work — so the run cannot
mistake it for its own breakage.** `npm run lint` reports **4 errors and 151
warnings**. The bar in CLAUDE.md is zero errors, so the tree is already over
it. All four are the same thing: two dictionary keys declared twice, once in
each language (`co_password_updated`, `act_next`). The warnings are the
standing unused-locals tidy-up list and are deliberately not an alarm.
**Fix the four in the first commit of the run** — they are four lines, they are
in the file WO-4 and WO-2 both touch, and leaving the proofreader red means the
one check that costs seconds stops being read.

---

## The items

Numbered by the order they will be worked, not by the order they were asked.

---

### WO-0 · The scope rules go into CLAUDE.md — FIRST, before any other item
*Owner, 24 Aug 2026, supplying the text verbatim and asking that the work order
start with it.*

**BUILD:** add this section to CLAUDE.md, word for word as the owner wrote it,
and create `BUGLOG.md` with the `Noticed, not fixed` heading it refers to so
the first person to need it is not inventing a format.

```
## Scope rules

- Do only what the current request asks. Nothing else.
- If you notice a separate problem (broken test, bad code,
  missing file, outdated dependency): DO NOT fix it.
  Write one line in BUGLOG.md under "Noticed, not fixed"
  and carry on with the original task.
- Broken tests that were already failing before this session
  are not your problem. Leave them red.
- If the request is unclear, stop and ask. Do not pick
  the wider interpretation.
- At the end, list anything you touched that was outside
  the request. If that list isn't empty, you broke this rule.
```

**WHERE IT GOES:** at the TOP of CLAUDE.md, above the Bug Fix Rules. It governs
them — Bug Fix Rule 2 says find every place a thing appears, and this says do
not go and fix the other things you find on the way. Read in the other order
they can be made to argue.

**IT IS FIRST FOR A REASON, and the reason is this file.** Several items below
found a second fault while the first was being measured — the white-on-white
sweep in WO-1, the four inherited lint errors, the squared-off ripple in WO-12.
Under these rules those are BUGLOG lines, not work. **Where an item in this
order already names such a thing as part of its own build, that naming is the
owner's approval and it stays in scope.** Anything found from here on that is
not named in this file goes to BUGLOG.md.

**DO NOT paraphrase, tidy or re-word the owner's text.** It is a standing
instruction in their own voice, like the Bug Fix Rules above it, and this file's
own convention is that the terse rule goes in CLAUDE.md verbatim.

---

### WO-1 · The collapse button is white on white
*Owner: "Bring back the ability to collapse the nav panel and just have the
symbols." (Image 1, first batch of the third message.)*

**MEASURED before touching it.** The button is on the page right now, 26×26,
`display:grid`, `opacity:1`, `visibility:visible`, fully clickable, sitting
exactly where the owner drew an empty box. Its three colours were written for
the old dark-green sidebar and left behind when the 24 Aug redesign turned the
column white:

| Part | Today | Ground |
|---|---|---|
| chevron stroke | `rgb(255,255,255)` | `rgb(255,255,255)` |
| fill | `rgba(255,255,255,.14)` | `rgb(255,255,255)` |
| ring | `rgba(255,255,255,.3)` | `rgb(255,255,255)` |
| the word "MENU" beside it | `rgb(95,109,107)` — **corrected** | `rgb(255,255,255)` |

The label was re-pointed at the white column and the button beside it was not.

**BUILD:** give the toggle three colours that read on the white column,
through the same tokens the nav's own ink already uses — never a literal.
Nothing else about it changes: same id, same handler, same chevron direction
rule, same tooltip pair.

**AND SWEEP THE REST OF THAT COLUMN while in there.** This is the third
recorded instance of the same fault (`--n-accept`'s white tick on white,
`.rl-wall` unstyled outside its page). One pass over every rule in the sidebar
that names a white or a white-alpha, reported as a list.

**TESTS:** the existing nav browser file gains a computed-contrast claim —
the toggle's ink against its own ground, in both themes and both brands. It
must fail against today's code, reporting 1:1.

---

### WO-2 · Delete the note and the Renewal filter on Contracts
*Owner: "delete the notes and the filter i have highlighted so we can have
more spacing." (Image 1, first message.)*

**MEASURED:** the sentence under "Contracts" belongs to that page alone. The
Renewal dropdown is the ONLY writer of the renewal filter anywhere in the
product — no saved view, no phone screen, no other door sets it — so removing
the control cannot leave a hidden filter switched on.

**BUILD:**
- The Contracts page stops printing its subtitle. The dictionary keys stay,
  inert, per the house convention.
- The Renewal control is removed. **The filtering READING stays** — it costs
  nothing and the shape is read by the "is anything filtered" predicate in two
  files.
- Two existing browser claims name that control, one of them asserting Category
  "sits beside the renewal filter". Both are **reversed in place** onto the new
  neighbour, never deleted.

**DIVERGES FROM THE REFERENCE** (see the table above): the reference's filter
bar carries Renewal type as one of its five, drawn active. Record it.

**OPEN DECISION 1** — only Contracts loses its subtitle, or every page?
Recommendation: Contracts only. **Does not block:** build the filter half
either way.

---

### WO-3 · Delete the Copilot first-pass strip
*Owner: "delete the copilot first pass feature completely", then, asked
whether the files go too: **"Just delete the strip for now."***

**FOOTPRINT, measured on main:** its own engine file; the band builder and one
call site in the negotiation view; ~23 styling mentions; 42 dictionary keys in
each language; two test files that exist only for it; one CLAUDE.md section.

**BUILD, to the owner's ruling — the strip only:**
- The band stops being drawn. One call site.
- **The engine, the wording and the styling stay in place, dormant**, so it
  returns in one line if the owner changes their mind.
- The band builder becomes a `return ''` stub rather than being deleted — the
  `negoCounterLineHtml` convention, and the reason it exists: a third caller
  must not be able to bring the strip back through a door nobody remembered.
- Its two test files are **turned round** to assert the band is NOT on the
  page — as pixels, not as an absent function.
- CLAUDE.md's section on it gains a line: not drawn, by whose ruling, and what
  survives.

**WHAT IS LOST, said out loud:** only the suggested first read. The band
decided nothing and filed nothing — every button on it carried the ordinary
cards' own attributes and pressed the ordinary funnel.

---

### WO-4 · Filter outlines like the buttons, and headers that stop shouting
*Owner: "The outline of the filter boxes should be similar to the outline of
the buttons in the contract and negotiation pages. And the headers highlighted
should not be in capital letters apart from the first letters of the words."
(Image 3, first message.)*

Two changes on one screen. Both reach the Negotiations list by construction —
Contracts and Negotiations are one renderer.

**(a) THE OUTLINES.** The filter selects and the search box wear
`--color-divider`, the panel hairline. The buttons wear an accent-45% border.

**HaTi ALREADY HAS `--field-line:#8A9795`** — the reference's own
fields-are-not-panels distinction — **and the filter bar does not read it.**
Third instance of "the token exists and nothing reads it" (`--space-2` was
the first, the focus ring the second).

**BUILD:** the filter bar's controls take the button's own border, read from
the one place `.ui-btn` reads it — never a second copy. **The ACTIVE state
must stay tellable apart:** it keeps the full-strength accent border plus 600
weight plus accent ink, so three signals carry it and colour is never the only
one. Measure resting against active, both themes, before shipping.

**Note the alternative, which the reference prefers:** both on `--field-line`.
Rejected because the owner has twice reported that a grey control reads as
furniture, and the buttons the owner pointed at are accent today.

**(b) THE HEADERS.** The capitals are a styling rule, not typed. Remove it, and
the letter-spacing with it — tracking exists to make capitals readable and
reads loose on ordinary words.

**Scope:** `.reg-table` (Contracts + Negotiations) and the stream drawer's
table, which is the same kind of object. **NOT swept:** the Negotiations group
bands, the sidebar's "ADMINISTRATION", the Tracked Changes caption and every
other uppercase micro-label — the owner highlighted column heads. One word
from the owner and the rest follow.

**OPEN DECISION 2 — BLOCKS THIS ITEM.** English headers are a mix today
("Contract Title" and "Expiry Date" but "Value stream" and "Whose move").
Every word capitalised, or only the first?
**Recommendation: English capitalises every word; SWEDISH capitalises only the
first**, because title-casing is a grammatical error in Swedish — "Vems Tur"
is wrong. Each language follows its own rules.

**DIVERGES FROM THE REFERENCE** on the capitals (see the table above). Also
note HaTi's header is 12px where the reference says 11px — a separate, smaller
divergence; leave it, and record it.

---

### WO-5 · The sidebar stops shoving the page
*Owner: "For smaller laptops, when you open the collapse button, the nav panel
slides on top of the screen so it does not push the page."*

**MEASURED, opening the nav today:**

| Width | Behaviour | Page loses |
|---|---|---|
| 1152 and below | floats over the page | nothing |
| 1280 | shoves | 176px |
| 1366 | shoves | 176px |
| 1440 | shoves | 176px |
| 1600 | shoves | 176px |

So every real laptop shoves. This is recent: the float line moved from 1500 to
1280 when the new sidebar landed, so machines that used to float now push.

**OPEN DECISION 3 — BLOCKS THIS ITEM.** How wide is the owner's screen? The
answer sets the line.
**Recommendation: put the line back to 1500.** Machines up to that width then
rest as the icons-only strip (which is the same thing WO-1's button reveals)
and float open over the page. **It partly reverses the owner's own approved
render of 20 Aug**, whose 1280 reasoning was 1040px of page + a 240px column.

**BUILD once ruled:** one number, derived and commented as derived. The stored
preference must stay READ-NEVER-WRITTEN below the line — the existing rule, and
the reason for it is that flipping a preference the width is not honouring
silently changes what the reader gets back on a big screen.

**TESTS:** the nav browser file measures the page's own content box before,
during and after a toggle at 1280 / 1366 / 1440 — unchanged below the line,
and the stored preference proved untouched.

---

### WO-6 · Take a third off the Home section headings
*Owner: "reduce the highlighted space by 1 third." (Image 2, first message.)*

**MEASURED:** each heading takes **41.6px** (My work 44.2, because it carries
the Customize link). Three of them, **127px**.

And it is not only tidiness — the Home page **already runs off the bottom**:

| Screen | Too tall by |
|---|---|
| 1280 ThinkPad at 150% | 98px |
| 1366 × 768 | 50px |
| MacBook 1440 | fits |

The ~42px the three give back removes almost all of the 1366 overflow.

**BUILD:** take the third out of the space above and below plus a little off
the heading's own line, **measured at each step** — the first guess never
lands. All three change: they are one builder drawn three times, and leaving
"My work" taller reads as a fault. Re-measure on all four laptop sizes after.

**DIVERGES FROM THE REFERENCE**, which specifies this heading's margins
exactly (see the table above). Record it.

---

### WO-7 · Negotiation Friction margins match Portfolio
*Owner: "the space between the card and the edge in the negotiation friction
tab should be the same as the distance in the portfolio tab." (Image 2, second
message.)*

**MEASURED, populated tab:**

| Width | Portfolio | Friction |
|---|---|---|
| 1280 | 20px | 20px — already matches |
| 1440 | 20px | 20px — already matches |
| 1600 | 20px | 58px |
| 1920 | 20px | 138px |
| 2560 | 20px | 298px |

Friction is the only Insights screen with a width rule of its own. It was
capped at a fixed width once, given back half the dead space later, and the
owner is asking for the other half. **On a laptop nothing changes** — this
shows on a large monitor, which is where the screenshot was taken.

**BUILD:** remove the width rule so the card fills its padded host exactly as
Portfolio's does. Measured with it off: 20px each side at every width.

**AND HOLD THE PROSE, which is why the cap existed.** At full width on 2560 the
left-hand paragraphs run ~130 characters a line. Let the CARD fill the width as
asked, and cap the SENTENCES inside it to a readable measure; the bars and the
counterparty table take the extra room, which is where it is useful.

**LEFT ALONE, and said out loud:** the no-negotiations empty state has a
different, narrower rule of its own. It reads as a message rather than a card
and the owner's screenshot is of the full version.

**The reference supports this item** (see above).

---

### WO-8 · Move the "All" filter into the slot already waiting for it
*Owner: "move the all button to the small red highlighted location on the top
right." (Image 1, third message.)*

**MEASURED on main.** The change column's head is built as *Change index → the
"N open" badge → the bar → "N of M decided" → an empty span* — and that empty
span is named, in the markup, as the filter slot. **Nothing anywhere writes
into it.** One declaration, no readers, in any file. The owner drew a box
around a space already reserved for exactly what they asked for; the intention
was there and the last step was never taken.

**BUILD:** draw the filter in its slot, and drop the line it currently sits on
if nothing else needs it. **Keep the three properties that make this control
safe** — three options only, each still carrying its OWN count unmoved by the
filter, and the narrowed-state note offering the way back. A control that can
hide changes is the one on that page that must never be silent.

---

### WO-9 · The table that scrolls sideways
*Owner: "when I switch to swedish language, in all tables I should not have to
scroll right to see the entire table." (Image 4, first message.)*

**Three findings, all measured.**

**It is one table, not all of them.** Every screen was swept in both languages:
the Contracts/Negotiations table is the only one that scrolls sideways.

**It is not really a Swedish problem:**

| Width | English | Swedish |
|---|---|---|
| 1152 | fits | 10px over |
| **1280** | **4px over** | **58px over** |
| 1366 and up | fits | fits |

**1280 is the worst width, not the narrowest** — at exactly 1280 the sidebar is
a full column and the page is at its narrowest; below it the sidebar floats and
the page gets wider. The one width the design is built around is the one width
the table does not fit. (WO-5 may move this line; the fix must hold either way.)

**What does NOT work**, probed live at 1280 in Swedish:

| Tried | Still over | Cost |
|---|---|---|
| headers wrap to two lines | 58px | nothing gained — Swedish compounds are one word |
| drop the capitals and tracking | 58px | — |
| narrow the reference column | 58px | — |
| let the status word wrap | 30px | row grows 36 → 41px |
| all of those together | 25px | row grows 36 → 43px |
| **declare the column widths** | **fits at every width** | see below |

**BUILD:** a declared column ladder — fixed px for the rigid columns, fractional
for the text ones, every cell AND every header cell ellipsising. Proved at
1152 / 1280 / 1366 / 1440 / 1600 / 1920 in both languages: no overflow, the
36px row survives, the sticky header survives, and the title column gets WIDER
on a large screen than it is today.

**This is the reference's own method** (TYPOGRAPHY.md §6 — see above), so it is
a correction toward the design rather than a workaround.

**THE COST, and the trap.** On a narrow window some values shorten with "…"
and show in full on hover. A first draft of the ladder clipped the Swedish
status word and the expiry countdown — **the wrong trade**. The widths must be
measured off the longest real Swedish content, and the shortening must land on
the counterparty and value-stream columns, which already shorten today.

**STILL TO MEASURE:** the Negotiations seat (same renderer, different last
column — its own ladder) and the stream drawer's table with a long counterparty
name.

**TESTS:** a new browser file asking the SIDEWAYS question of every
table-bearing screen, in both languages, at 1280. **Why nothing caught it:** the
existing laptop file exempts this scroller by name as a legitimate scroller and
only ever asks about the vertical axis.

---

### WO-10 · The three check symbols on the negotiation page
*Owner: "add the red highlighted symbols to where image 3 shows in the
negotiation page. They should then act like buttons so you can click on them to
run the respective scans but if they were already ran while in the documents
page, then the results simply appear from the panel on the right hand side."*
Then: symbols only, name on hover; **no** state dot.

**BUILD:**
- The three symbols — Obligations, Playbook review, Copilot risk scan — at the
  right-hand end of the head line the owner marked, **outside the part that
  folds when Collapse is pressed.** Controls that vanish when you tidy the
  heading are controls you stop trusting.
- **Symbols only; the name on hover**, plus a spoken label for screen readers.
  A picture is never the only carrier — the tooltip and the panel title carry
  the word.
- **Press runs the check. If it has already run, it opens what was found** in
  the existing right-edge panel — the same panel the Document tab uses, which
  mounts page-independently and therefore needs no second one.
- **The same rules as the card it comes from:** a viewer, or anyone on a signed
  contract, may still OPEN what was found but not re-run it — except
  Obligations, which are deliberately exempt because a quarterly report starts
  mattering after signature.
- **One shared reading of "has this run"** — the symbols ask the same function
  the card asks. Three copies of that question is how they come to disagree.

**NO DOT, so the hover carries the state.** The name reads
*"Copilot risk scan · 3 found"* where it has run and *"Copilot risk scan ·
run it"* where it has not — one word, as asked, and nothing extra drawn.
Without it a symbol cannot say whether pressing it spends Copilot money or
merely opens a result.

**THE ONE REAL PIECE OF WORK.** The scan runner opens the results panel only
`if` the Document tab's card is on screen — guarded, deliberately, so a scan
run elsewhere "still completes normally". Run from the negotiation page it does
the work and says nothing. That needs a home.

**AND CHECK REACHABILITY FIRST, not after.** Two of the pieces this needs may
not be published for another module to call. That is the f232 class and it
fails SILENTLY — nothing errors, nothing logs, the button does nothing.
Confirm each name before wiring.

**Not in the reference** (see above) — and build the three as their own group
so a future six-cell facts strip moves them in one line.

---

### WO-12 · The page moves when it should land
*Owner, 24 Aug 2026: "when i flip from tab to tab or page to page in the html,
the landing page appears like a flash or like a picture and very stable. In
hati, it is like a moving picture."*

**MEASURED ON BOTH SIDES, which is what makes this one unarguable.**

| | The reference demo | HaTi |
|---|---|---|
| Elements carrying a transition, one screen | **0** | **75** |
| Named animations in the whole product | **1** (`hx-pulse`, the status dot) | **26** |
| Animations running while idle | **1** | **4** |
| Animations running on a page switch | **1** — nothing plays | **6&ndash;12** |

Clicking through the reference's own pages, the running-animation count never
moves off 1. Nothing plays on navigation at all. That is the "flash, like a
picture" the owner is describing, and it is not an impression — it is the
literal measurement.

**WHAT PLAYS IN HaTi ON EVERY NAVIGATION**, measured going to four different
pages:

- **`viewIn`, 240ms** &mdash; the WHOLE page fades up from `opacity:0` and
  slides 6px. This is the fault. Every page, every time.
- **`rowIn`, 340ms, once per row** &mdash; the register's rows slide in
  staggered underneath it. Measured at 4 running simultaneously.
- **the nav item's own 120ms transition** &mdash; `background`, `color` and
  `border-color`, so the sidebar's active marker FADES from the door you left
  to the door you pressed instead of snapping. 4&ndash;5 of these run at once.

And two ambient loops run for ever, on several elements at a time:
**`livePing` 2.4s** (a box-shadow ripple) and **`ping` 1.8s** (a scaling one) —
two names, two durations, both marking "live", where the reference has exactly
one looping animation in the entire console.

**THE REFERENCE IS EXPLICIT AND GIVES THE REASON:** *"Animation — the only
motion in the app is the status dot's `hx-pulse 2.4s ease-in-out infinite`.
Everything else is instant. **Do not add transitions; the density reads as
sluggish with them.**"*

#### BUILD — in three tiers, because "delete all 26" is not the answer

**Tier 1 — the reported fault. Do this and the complaint is answered.**
- Delete `viewIn` and `rowIn`, and the `.stagger` class with them.
- **The whole suppression machinery goes with them, which is the tidy part:**
  `markViewTransition`, `_lastRenderedView`, `_viewAnimTimer`, the 450ms
  re-arm and the `.no-view-anim` class exist ONLY to stop an animation that
  will no longer exist. Its own comment says so: *"the whole screen replayed
  the fade-and-slide, reading as a flash of reload."* The animation was the
  problem; the machinery was the patch.
- Take `background` and `color` off the nav item's transition so the active
  marker snaps. **Leave the item's HOVER as it is for now** — that is tier 3.

**Tier 2 — one looping animation, not four.**
- The reference allows exactly one, on the status dot, at 2.4s. Reduce to one
  and put it where the reference puts it. Everything else that currently
  pulses states its liveness in words or colour already, or should.
- **A small defect falls out of this:** `.live-dot::after` scales to 2.1&times;
  and carries `border-radius:0` — squared by the 20 Aug corner sweep — so what
  was designed as an expanding ring now draws as an expanding SQUARE. Either
  it goes with this tier, or it gets its circle back.

**Tier 3 — the 111 transition declarations. A separate decision, not this
order's to take.**
- The reference's answer is zero, with a stated reason. HaTi's are almost all
  hover states, which do not fire on navigation and are not what the owner
  reported.
- **Recommendation: do it, but as its own pass with the owner's word**, because
  it touches every screen and is the kind of change that should be looked at
  once rather than discovered.

#### WHAT KEEPS MOVING, said out loud

- **Spinners** (`spin`, `nego-spin`) — work genuinely in progress.
- **The green bell blink** (`hdr-bell-news`, `al-row-news`, `rl-bell-news`) —
  owner-asked, 23 Aug, three blinks then stop. Not motion for decoration.
- **The slide-over panels** (`sidePanelIn`, the queue, the clause panel, the
  phone's sheets). A panel that slides in FROM somewhere is saying where it
  came from; the reference has no slide-overs at all, so it holds no opinion
  here.
- **The land-here flashes** (`rlJump`, `clauseFlash`, `anchorFlash`) — they fire
  once, on a jump, and answer "where did I land". That is information.
- **`prefers-reduced-motion`** — untouched, and the tier-1 deletions make more
  of the product honest under it by construction.

#### TESTS

A browser file that counts, because this is the one claim a source read cannot
make: navigate between four pages and assert `document.getAnimations()` holds
**nothing from the view-entry family** immediately after each switch, and that
the idle count is at most one looping animation. It must fail against today's
code, reporting `viewIn` and four `rowIn`s.

**And pin the RELATION, not the number:** the claim is "nothing plays when you
change page", never "there are exactly N animations" — a page that legitimately
gains a spinner must not fail it.


---

### WO-13 · Every card a different colour, and the number to match
*Owner, 24 Aug 2026: "The colors of the top of the cards should all be
different for each card and the number inside the cards should reflect that
color as well. This is also reflected in the demo html attached in the file
previously provided."*

**WHY IT LOOKS WRONG TODAY.** HaTi colours a Home tile by what its metric
MEANS — green good, amber needs attention, ruby overdue, steel neutral. Two
metrics that both mean "needs attention" therefore draw the same amber, which
is exactly what the owner's screenshot shows: **Pending approvals and Awaiting
counterparty are both amber**, side by side.

**AND THE DEMO WAS CHECKED RATHER THAN TAKEN ON TRUST.** It is half what the
owner remembers, and the half that differs matters:

| Demo tile | Top edge | Its numeral |
|---|---|---|
| Waiting on you | amber | **amber** |
| Live negotiations | brand teal | **black** |
| Expiring soon | red | **red** |
| Turnaround | green | **green** |
| Compliance | amber | **amber** |
| Import queue | brand teal | **black** |
| Copilot spend | brand teal | **black** |

Three findings, all measured off the demo's own data:

1. **The four "My work" edges ARE four different colours** — the owner is right
   about that row.
2. **The Portfolio row is NOT all different.** Import queue and Copilot spend
   are both brand teal, and Compliance repeats the amber from the row above.
3. **The numeral does NOT always follow the edge.** It follows it on the three
   STATUS colours and stays BLACK on all three brand-teal tiles. The rule the
   demo is actually running is *colour means this needs attention; the brand
   colour is not an alarm, so its number stays black.* Three of its seven
   numerals are black.

So the demo's four different colours are a consequence of its four illustrative
metrics happening to mean four different things — not a rule that each card
gets its own colour by position.

**OPEN DECISION 5 — BLOCKS THIS ITEM.** Two readings, and they lead to
different products:

- **(a) Keep colour meaning something.** Amber always means "needs you", ruby
  always "overdue". Two amber cards side by side stay possible, and the fix is
  to give the CATALOGUE better-spread tones so the common four rarely collide.
  This is what the demo does and what HaTi does today.
- **(b) Colour tells the cards apart.** Each of the four positions takes its own
  colour whatever the metric means, and the number takes it too. The owner's
  words read this way. **The cost, said plainly: the page stops being able to
  say "this one is urgent" with colour** — every card is coloured, so none of
  them stands out, and the amber-means-attention rule the sidebar counts and the
  alert rows both use would no longer agree with Home.

**Recommendation: (a), plus the numeral rule the demo actually runs** — a status
tile colours its number, a brand-teal tile keeps it black. That answers the
complaint the owner is really making (two identical amber cards) without
spending the one signal the page has.

**IF THE OWNER RULES (b), it must be said out loud in CLAUDE.md** that Home's
tile colour no longer carries meaning, because four other surfaces read the same
tone table.

**NOT IN SCOPE EITHER WAY:** the zero-count tile's grey numeral, which is a
deliberate signal already recorded in CLAUDE.md ("a tile counting zero is not a
door"), and which `docs/WORKORDER-black-ink.md` also names as out of scope.

---

### WO-14 · The "Reading only" strip comes off the two other readings
*Owner, 24 Aug 2026: "delete this strip from the as agreed and with changes
tabs."*

The strip reads *"Reading only — go back to Redlined to make a change"* with a
**Back to redlined** button, above the change column, whenever the page is on
"As agreed" or "With changes".

**IT IS NOT DECORATION, AND THIS IS THE WHOLE OF THE ITEM.** MEASURED on main:
in those two readings the change column is not merely dimmed, it is
**switched off** — `opacity:.45`, `filter:grayscale(1)` and, decisively,
`pointer-events:none`. The strip is a SIBLING of that pane precisely so its own
button stays pressable, and it is the only thing on the page that says why
nothing in the column responds.

**So deleting the strip alone leaves a greyed-out column that refuses every
press and explains nothing** — which is the exact fault this codebase records
over and over ("a control that looks live and does nothing is the fault a
reader blames themselves for"), and it reverses a standing rule in CLAUDE.md:
*"A NON-DEFAULT READING ALWAYS SAYS SO … with the way back"*, and
*"THE READING NOTICE NEVER FOLDS — quietly hiding the strikes is the expensive
mistake."*

**OPEN DECISION 6 — BLOCKS THIS ITEM.** Three ways to give the owner what they
asked for, and they are different products:

- **(a) Strip goes, and the column goes with it.** In those two readings the
  column is not drawn at all. Honest — nothing dead is left on screen — and the
  page gains the width. **The cost:** the round's shape disappears while you
  read the clean wording, which is the reason the column was greyed rather than
  removed in the first place.
- **(b) Strip goes, and the column comes ALIVE.** Deciding works in all three
  readings; nothing is disabled, so nothing needs explaining. The cleanest
  screen. **The cost:** you can accept a change while looking at a document
  that does not show the marks — which is what the disabling was built to
  prevent.
- **(c) Strip shrinks to a mark, not a sentence.** The column stays greyed; a
  small padlock or a one-word tag replaces the strip and carries the sentence
  on hover. **The cost:** the reason is a hover away, and the way back moves
  to the tab row (where it already exists).

**Recommendation: (c).** It is what the owner is really reacting to — a
two-line sentence in a box, at the top of the column, on every non-default
reading — without leaving a dead column unexplained. **If the owner wants (a)
or (b), say so and it is a small change either way**; both are honest, and
neither should be picked by me.

---

### WO-15 · Two filters go, so the row fits one line
*Owner, 24 Aug 2026: "delete the highlighted filters so that there is enough
space for all the filters to be on one line." (The **Live negotiations** locked
chip and the **Renewal** filter.)*

**The Renewal half is already WO-2** and reaches this page by construction:
Contracts and Negotiations are one renderer, so removing the control there
removes it here. Nothing extra to build.

**The locked chip is new, and it is not a filter.** It carries a padlock, has
no ✕, and cannot be cleared — CLAUDE.md records why: *"it says what the page
is … there is nothing to remove: it is not a filter the reader chose. It leads
the bar so everything to its right is plainly a narrowing WITHIN live
negotiations."*

**WHAT ITS REMOVAL COSTS, and it is small here:** the page already says what it
is, twice and more loudly — the heading reads **Negotiations** with an
**18 live** badge beside it, and the sentence under it says *"Every agreement
being argued over right now."* The chip is a third statement of a fact the two
lines above it already make. That is a better reason to remove it than the
space, and it is why this one needs no decision.

**BUILD:** the chip stands down. The scope itself is untouched — it is a
property of the page, not of the chip, and `regFiltered` applies it first
whatever the bar draws.

**AND MEASURE THE ROW AFTERWARDS.** The ask is "one line", which is a
GEOMETRY, not two removals: at 1280 with the sidebar open the bar has ~996px,
and the remaining five controls plus Sort must be proved to sit on one line
there, not merely to look right at 1440.

---

### WO-16 · The row type comes down a size
*Owner, 24 Aug 2026: "reduce the font by a size in the contracts page list of
contracts and the negotiations page list of contracts so that there is enough
room in the card and words to no disappear to the right of the tables."*

**TWO ASKS IN ONE SENTENCE, and they want separating** because one of them is
already WO-9 and the other is a taste decision.

**The disappearing words ARE WO-9.** The owner's screenshot shows the WHOSE
MOVE column cut off at the right edge — that is the sideways-scroll fault,
measured at 58px over in Swedish and 4px in English at 1280. **A smaller font
does not fix it and must not be relied on to.** WO-9 probed five smaller-is-
better remedies and every one left the table over; only a declared column
ladder fits at every width. **Build WO-9 and the words stop disappearing
whatever size the type is.**

**The size itself is a separate, legitimate ask.** The rows are 14px today.
One rung down is 13px.

**WHAT IT REVERSES, said out loud:** the 22 Aug type pass lifted every size at
or below 14px one rung, on the finding that HaTi ran one to two steps small
against the design — and the design's own type scale puts **table row primary
text at 14px/600**. So 13px rows are a step back below the reference. The owner
has seen both and may still want it; it must be recorded as their ruling, not
left looking like drift.

**AND IT MUST NOT REVERSE THE 23 Aug RULING**, which is the trap: that day
flattened every cell in the row to ONE size and ONE weight, with the document
kind as the single exception. `flat-rows-and-alerts-verify` pins exactly that —
*"every cell but the document kind is ONE size"*, and separately that the rows
still carry **at least three inks**. Dropping the row to 13px means dropping
**every** cell together, and the document kind (12px today) must stay smaller
than the row or that check fails honestly.

**OPEN DECISION 7 — BLOCKS THE SIZE HALF ONLY.** Does the owner want 13px rows
knowing it steps below the design's own 14px, now that WO-9 will fix the
disappearing words on its own? **Recommendation: build WO-9 first, look at the
page, then decide** — the ask was made to solve a problem WO-9 solves, and the
type may look right at 14 once nothing is being cut off.

---

### WO-17 · The Negotiations door opens a list, like Contracts
*Owner, 24 Aug 2026: "when i click on the contracts tab on the nav panel, i get
a list of contracts. This should be the same when i click on the negotiation
tab."*

**MEASURED, and the owner is describing it exactly.** Pressing the sidebar's
Negotiations item lands on a **single negotiation's workbench** — whichever one
was open last — not on the list. Contracts always lands on the list.

**IT IS DELIBERATE TODAY**, and CLAUDE.md records the reasoning: the door
answers `'reopen'`, reading `negoLastOpened`, so a reader who was working on
one deal is put back into it. The list is one press further, on the page's own
**All negotiations** button.

**The owner is reversing that.** It is their call and it is a small change —
the door answers `'list'` instead of `'reopen'` — but three things go with it
and each must be decided rather than discovered:

- **The memory itself.** `negoRememberOpened` / `negoLastOpened` would have no
  caller left. **Keep the reading, drop the door** — the machinery is written,
  it is one line to re-point, and deleting it makes the decision hard to undo.
- **The way back in.** Every other door into a negotiation (a decision card, a
  returned-changes notice, a playbook finding, the phone) is untouched — they
  name their contract and still open it. Only the SIDEBAR changes.
- **The phone already does what the owner wants.** Its bottom-bar Negotiate
  item lands on the list, so this makes the two shells agree rather than
  diverge — worth saying, because it is evidence the owner's reading is the
  more natural one.

**BUILD:** the sidebar's Negotiations press asks for the list. No new door, no
second route — the door already takes an answer and this changes which one it
gives. `negotiations-door-verify` has claims about the reopen behaviour that
are **reversed in place**, not deleted: what they really pin is that the door
is deliberate rather than accidental, and that stays true.

---

## The owner's rulings

Given 24 Aug 2026. Six of the seven are answered; one is waiting on an
explanation of the question, not on the owner.

| # | Question | Ruling |
|---|---|---|
| 1 | Contracts only loses its subtitle, or every page? | **Contracts only.** Every other page keeps its own line. |
| 2 | Headers: every word capitalised, or only the first? | **Only the first.** Sentence case, both languages. |
| 3 | Copilot's language rule | **Greet in the interface language; answer in the language the question was asked in.** |
| 4 | Where does the sidebar start floating? | **Derived from the screen sizes HaTi is built for — see below.** Not from anybody's own monitor. |
| 5 | Home tiles: does colour mean something, or tell the cards apart? | **Tell them apart.** |
| 6 | The greyed change column: remove it, wake it, or mark it? | **STILL OPEN** — the owner asked what the greyed column is before ruling. |
| 7 | Rows a size smaller, below the design's own 14px? | **Yes.** |

### Ruling 2, in full — sentence case, and it costs less than expected

Every column head takes a capital on its FIRST word only: *Contract title ·
Counterparty · Value stream · Value · Expiry date · Status · Whose move*.

**THIS IS SIMPLER THAN THE RECOMMENDATION IT OVERRULES.** The order proposed
title case for English and sentence case for Swedish, because title-casing is a
grammatical error in Swedish. The owner's answer removes the split entirely:
**Swedish already writes these in sentence case, so it does not move at all**,
and English changes two heads (`Contract Title` → `Contract title`,
`Expiry Date` → `Expiry date`). One rule, both languages, nothing to keep in
step.

### Ruling 3, in full — and half of it is already built

> *"It should greet you in the language mode you have chosen but it should
> answer your questions based on the language you ask in. If I ask in swahili
> then answer in swahili but greetings should be between swedish and english."*

Two halves, and they are already the two halves the product has:

- **The ANSWER follows the question.** Already built and already correct on both
  hosts — *"Reply in the language the user wrote their question in."* A Swahili
  question already gets a Swahili answer. **Nothing to change**, and the order
  should not touch it.
- **The GREETING follows the interface.** That is WO-11, and the owner's wording
  settles its one open edge: the greeting is only ever **Swedish or English**,
  because those are the two the interface offers. It never tries to greet in a
  third language just because the last question was asked in one.

### Ruling 4, in full — the number is DERIVED, and the owner is right that the rule already exists

> *"I do not understand the questions regarding how wide my screen is. The rule
> we have been working on is hati should be built on a number of screen sizes
> which means hati respects those screen sizes. This rule should be in the code
> somewhere."*

**IT IS, AND ASKING FOR A PERSONAL SCREEN SIZE WAS THE WRONG QUESTION.** The
supported set is declared in `test/chromium/laptops-verify.js`:

| Machine | CSS width |
|---|---|
| 1080p at 150% (ThinkPad) | **1280** |
| 1366 x 768 | 1366 |
| MacBook 1440 | 1440 |
| 1080p at 125% | 1536 |
| 1080p at 100% | 1920 |

**SO THE LINE FALLS OUT OF ARITHMETIC RATHER THAN TASTE.** The design draws its
console at 1280 with a 240px column and **1040px of page**. MEASURED at 1280
with the column pushed open, HaTi's page is **1030px** — under the design's own
measure — and the Contracts table needs **1054px** in Swedish (WO-9). So on the
smallest machine HaTi supports, a pushed column leaves less page than either
the design assumes or the table needs.

**THE RULE: float at 1280 and below; push above it.** Every supported size is
then honoured — the smallest floats so nothing is squeezed, and 1366 and up
keep the pushed column with room to spare (1366 leaves 1126, 1440 leaves 1200).

**AND IT EXPLAINS THE REPORT.** Today the product floats *below* 1280 and
pushes *at* 1280 — so the ThinkPad sits exactly ON the line and gets the shove.
The change is one pixel in a constant and one in a matching stylesheet rule;
what matters is that the number is now derived from the supported set and is
commented as derived, so the next person moves the SET rather than the number.

### Ruling 5, in full — and what it costs

Each Home tile takes its own colour and its number takes that colour too.

**THE COST WAS PUT TO THE OWNER BEFORE THEY RULED AND THEY RULED ANYWAY, so it
is recorded rather than re-argued:** Home's tile colour stops meaning
anything. Amber will no longer mean "this needs you" on that page, so a reader
cannot tell an urgent tile from a calm one by its colour — only by reading it.

**FOUR OTHER SURFACES KEEP THE OLD MEANING** and must not be swept with it: the
sidebar's amber counts, the alerts panel's amber rows, the register's status
tones and the calendar's legend. **CLAUDE.md must say out loud that Home is now
the exception**, or the next person reads the mismatch as drift and "fixes" one
of them.

**WHAT STAYS:** the zero-count grey numeral, already out of scope in both this
order and `docs/WORKORDER-black-ink.md`. With every other number coloured it
becomes the only grey one, which makes it a stronger signal than it is today,
not a weaker one.

### Ruling 7, in full

Rows drop one rung, to 13px, on both Contracts and Negotiations.

**RECORDED AS THE OWNER'S RULING**: the design's own type scale puts table row
text at 14px, so this is a deliberate step below the reference.

**AND IT DOES NOT REPLACE WO-9.** The disappearing words are the sideways-scroll
fault and only the declared column ladder fixes them at every width. Build WO-9;
this is a density choice sitting on top of it.

**THE TRAP:** every cell drops together, and the document kind must stay smaller
than the row, or `flat-rows-and-alerts-verify`'s one-size claim fails honestly.

**ONE ITEM IS STILL BLOCKED: WO-14.** Everything else is ruled on and ready.

---

### WO-11 · The Copilot greeting (carried from the plan, unblocked)
*Owner: "when I switch to swedish, copilot should greet me in swedish not
english. This needs to be a rule for copilot."*

**The Swedish greeting exists and is correct, and the language rule is already
in the prompt on both hosts.** The fault is where the greeting LIVES: it is
written into the conversation as a message the first time the panel opens, and
a conversation is never re-translated — rightly, because an answer must stay as
it was written.

**Two more things fall out of the same fault:** the greeting is also SENT to
the model as one of the last few messages, so on a Swedish screen the model is
shown an English message it supposedly just said — which pulls against the very
rule being asked for; and the panel does not repaint its own wording when the
language changes while it is open.

**BUILD:** treat the greeting as part of the PANEL, not the conversation —
which is exactly how the Insights notebook already does it, so this follows a
pattern the product has rather than inventing one. It is then drawn fresh in
whatever language is being read, and stops being fed to the model. A language
switch repaints the panel's furniture and leaves the conversation untouched.

**TESTS:** the existing one-language-per-screen browser file cannot see this
fault, because it switches to Swedish BEFORE opening the panel — so the
greeting is written in Swedish and it passes on a broken build. The new check
opens the panel first, then switches.

---

## Order of work

Smallest and most self-contained first, so each arrives as its own reviewable
change rather than one large one. Everything after the rebase.

0. Rebase onto `origin/main`; re-measure WO-1 … WO-7 on it.
1. **WO-0** the scope rules into CLAUDE.md, and BUGLOG.md beside it —
   **before any other item**, because it changes what the rest of the run is
   allowed to touch.
2. **WO-1** the collapse button's colours (+ the white-on-white sweep)
3. **WO-12 tier 1** stop the page moving on navigation
4. **WO-3** delete the Copilot strip
5. **WO-8** move the "All" filter into its slot
6. **WO-11** the Copilot greeting
7. **WO-2** the note and the Renewal filter
8. **WO-7** friction margins
9. **WO-6** the Home headings
10. **WO-4** outlines and headers
11. **WO-10** the three check symbols
12. **WO-5** where the sidebar floats
13. **WO-9** the sideways-scrolling table
14. **WO-15** the two filters off the bar (the Renewal half rides WO-2)
15. **WO-17** the Negotiations door opens the list
16. **WO-14** the reading strip — *STILL BLOCKED: ruling 6*
17. **WO-13** the Home tile colours
18. **WO-16** the row type — *after WO-9, so the two are looked at together*

WO-12's tier 2 (one looping animation) rides with tier 1 if the owner wants it;
tier 3 (the 111 transitions) is explicitly NOT in this order.

WO-5 and WO-9 are last together on purpose: WO-5 can move the width at which
WO-9's table is narrowest, and measuring WO-9 against a line that is about to
move would be measuring the wrong thing.

## Acceptance

- Every claim proved in a real browser, at the widths that fail, in **both**
  languages. Not read off the source — three of these ten survived precisely
  because a source read cannot see them.
- Every new check run against today's code first and **watched to fail**.
- Node suite green; one browser file per screen touched; the colour census
  re-recorded ONLY where somebody is deliberately owning a palette change, and
  audited value by value before it is saved.
- CLAUDE.md updated: the four divergences from the reference named as
  divergences with whose ruling they are, the retired strip recorded, and the
  three "already built, invisible" faults added to the family this file keeps
  recording.
- A short plain-English summary for the owner: what changed, what was
  deliberately left alone, and anything uncertain.
