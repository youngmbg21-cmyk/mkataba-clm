# WORK ORDER — the design system, adopted

**Raised:** 25 Aug 2026, by the owner, off the pre-launch UI/UX audit.
**Source of truth:** `UI-UX-AUDIT-AND-ROADMAP.md` and `DESIGN-SYSTEM-SPEC.md` on
branch `claude/hati-enterprise-redesign-6awp2n`, plus
`prototype/design-system-preview.html`. **Read all three before starting.**
**Shape:** an overnight run, unattended. Sequenced so every phase is
independently shippable and nothing later waits on a decision not yet made.

---

## 0 · WHAT THIS IS FOR

The audit graded HaTi on twelve dimensions. This work order closes the ten the
owner named:

| Graded | Dimension | Phase here |
|---|---|---|
| **F** | Density control | D |
| **D** | Type system | C (and **T**, which is the owner's) |
| **D** | Spacing rhythm | C |
| **D** | Feedback & loading | B, D |
| **D+** | Motion | D |
| **D+** | Accessibility | A, B |
| **C−** | Responsive | D |
| **C** | Elevation | A, C |
| **C** | Component maturity | C |
| **C+** | Dark theme | A |

**THE ONE SENTENCE THE WHOLE ORDER RESTS ON**, from the audit's own verdict:
*"A ladder with no consumers is a document, not a system."* The values were
chosen long ago and are right. Almost nothing reads them. Most of what follows
is therefore a **mechanical rename that moves no pixel** — which is why it can
be done overnight at all, and why anything that DOES move a pixel is carved out
below and handed back to the owner.

---

## 1 · THE RULES THIS RUN WORKS UNDER

`CLAUDE.md` governs. These are the ones this particular job will trip over.

1. **DO ONLY WHAT IS IN THIS ORDER.** A separate problem you notice is one line
   in `BUGLOG.md` under "Noticed, not fixed", never a fix. Tests already red
   before you started are not yours — but **prove it** on a worktree at the
   parent commit before saying so, and log the proof.
2. **MEASURE BEFORE AND AFTER, IN A REAL BROWSER.** Every claim in this order is
   a number somebody measured. Re-measure rather than trusting it — this
   codebase has been caught three times by a rule that looked right in the
   source and lost a cascade fight. `getComputedStyle`, not grep, decides
   whether a change landed.
3. **A SWEEP CLAIMING "NO PIXEL MOVES" MUST PROVE IT.** Before/after computed
   values on at least 20 screens in both themes. If a value moves, it is either
   a bug or an owner decision — never a rounding you absorbed quietly.
4. **PIN THE RELATION, NOT THE NUMBER.** The 22 Aug type pass cost five test
   edits, four of them literals where the claim was a relation. Any test you
   touch comes out asserting the relation.
5. **REVERSE CLAIMS IN PLACE, never delete them.** A test whose subject moved
   keeps what it was really about and records what changed.
6. **WHOLE PIXELS ONLY.** No font size may land on a half pixel. Two already
   exist in the change card's ⋯ menu (13.5 and 10.5) — fix those as part of
   Phase C and say so.
7. **NEVER a backtick inside a CSS comment** in a file that returns CSS from a
   template literal. It has cost this project three separate outages, the last
   one on 25 Aug. Say "terminator". `f236` sweeps for it; run it.
8. **NEVER edit the compiled Tailwind blob.** It regenerates. Every override
   goes in HaTi's own sheet.
9. **TEST ECONOMY.** `npm run lint` first, always — it costs seconds. Then only
   the test files the section names, together, in one command. **The full suite
   runs ONCE, when you believe you are finished**, and again only if that run
   found something. It is 4m and tells you nothing a targeted file has not.
10. **ONE BROWSER FILE PER SCREEN CHANGED**, and only the screen changed.
11. **RE-RECORD `theme-tokens-verify` IN THE SAME COMMIT as any deliberate
    palette change, audited value by value first** — every value that left and
    every value that arrived, each attributable. A half-red census catches
    nothing. Never re-record to make a red run go away.
12. **UPDATE `CLAUDE.md`** as you go, and say in the summary what changed there.
13. **PLAIN ENGLISH SUMMARY** at the end of each phase: what was fixed, whether
    it is fixed everywhere, what you deliberately left, what you were unsure
    about. No file paths, no line numbers.

---

## 2 · BEFORE YOU START — five questions, and what happens if nobody answers

The audit lists five decisions as the owner's (§6). **Do not make them.** Each
has a default below; if the owner has not answered by the time you reach the
work, take the default, say so out loud in the commit, and carry on. None of
them blocks a phase.

| # | Question | Default if unanswered |
|---|---|---|
| 1 | Corners: keep square, or adopt 4px? | **Keep square.** ~810 radii were swept to 0 on the owner's own ask; reversing that unasked is the wider interpretation. |
| 2 | May a head row carry one filled button? | **No.** Four separate owner reversals have removed them. |
| 3 | Control height 28 or 32px? | **28.** Owner-ruled 25 Aug: "buttons should stay at 28 but the rest should stick to the new design." |
| 4 | Should a contract's name outrank a fact value on its own header? | **Leave both at 15px/600.** Two independent rulings set them there; the interaction was never put to the owner and is not yours to settle. |
| 5 | Density default: compact or comfortable? | **Compact** — today's behaviour. Phase D ships the *control*; the default staying put is what makes it safe. |

---

## PHASE A — the three that are not design debt, then contrast · ~½ + 2 nights

### A0 · FIRST, AND BEFORE ANYTHING ELSE

The audit's §2 names three findings it says to read first. **They were fixed on
the audit branch and are NOT on `main`** — verified 25 Aug 2026: `main` still
interpolates the toast message unescaped, still runs `confirmDialog` on Enter
regardless of focus, and still paints the toast at `z-[60]` under seven layers.

**Bring all three across, with their test** (`toast-and-confirm-verify.js`, 14
checks, proved to fail 11 of 15 against pre-fix code). Do not re-derive them —
they are written, reasoned and tested. Port, re-run, confirm the test still
fails against `main`'s code before you trust it.

Then the two Phase 0 items still open: `--focus-color: var(--accent-ink)` and
`viewport-fit=cover`.

### A1 · Dark theme — C+ → the target is AA on every text and boundary token

Audit items 6–12.

- Sweep `color:var(--color-accent-600|700|800|900)` → `var(--accent-ink)`.
  **183 declarations. Mechanical. Changes nothing in light mode** — prove that.
  This is the single biggest contrast win in the product: those declarations
  measure **2.35:1 at night** where AA wants 4.5.
- Sweep inline `background:var(--color-accent-100|200)` → `--st-steel-bg` /
  `--st-steel-line`. 62 declarations.
- Give `--danger`, `--rule-strong`, `--rule-faint` dark answers.
- Re-point the six `text-ink` opacity rungs onto the two real inks — **in
  HaTi's own sheet**. An opacity is not an ink: those rungs put ordinary
  reading text between 2.36:1 and 4.11:1.
- Reports' four hero cards onto the platform card shell with a 3px tone edge.
- The pager, the mobile primary button and `confirmDialog`'s inline confirm —
  all three are the same accent-600 at 3.74:1.

**EXIT:** every text and boundary token passes AA in both themes on all 20
census screens, and the census is re-recorded in the same commit with every
value accounted for.

**Tests:** `f238` (the design-system ratchet), `theme-tokens-verify`,
`pages-read-alike-verify`, plus one browser file per screen whose colour moved.

---

## PHASE B — keyboard and announcement · ~3 nights

**Accessibility D+ → the target is: every act reachable by keyboard, every
refusal spoken.**

Audit items 13–18. The two that carry the most weight:

- **`trapFocus(panel)`, extracted from `openModal` and adopted at nine call
  sites** — the settings drawer, the alerts panel, ⌘K, the portal alerts, the
  KPI popover, `confirmDialog`, `promptDialog` and the seven phone sheets. One
  implementation, nine homes. `openModal` is already correct and is the model;
  the audit lists it under "do not modernise".
- **`aria-live` where a refusal or a result lands**: the toast root (done in
  A0), `stDrawerRefuse`, the portal's sign state, the register's result count.
  The audit measured **zero** `aria-live` regions in the whole product.

Then: the missing keydown beside each existing click (negotiation rows,
sortable headers, the split divider — port `ktWireSplit`, which already has it
— KPI reorder, the card-to-clause link, risk-map dots); `aria-current="page"`
in `setActiveNav` and `aria-selected` in `applyWsTabs`; `inert` on the change
column in reading mode, because refusing the pointer is not refusing the
keyboard; and the phone's seven sheets, which carry **zero** accessibility
semantics across 3,419 lines.

**Tests:** a new browser file that drives each surface by keyboard alone. A
markup check cannot answer "can somebody reach this without a mouse".

---

## PHASE C — adopt the ladders · ~4 nights, **and not one pixel moves**

**Text D, Spacing D, Components C, Elevation C.**

This is the phase that closes four grades and is the safest work in the order,
because it is a rename. Audit items 19–24.

- **Type sweep by EXACT-VALUE MAPPING**: 30→`--t-display`, 19→`--t-page`,
  17→`--t-section`, 15→`--t-card`, 14→`--t-body`, 13→`--t-meta`,
  12→`--t-label`, 11→`--t-micro`, 10→`--t-figure`. 2,394 declarations, 2 of
  which already read the ladder.
  **THE 132 OFF-LADDER SIZES ARE THE ONLY PART THAT MOVES A PIXEL** — resolve
  them to the nearest rung **one at a time, with eyes on**, and list every one
  in the summary. The two half-pixels in the card ⋯ menu are in this set.
- **Weight sweep**: 400/500/600/700 → `--w-*`. 1,074 declarations, **0**
  consumers today. No pixel moves.
- **Spacing sweep, ON-GRID VALUES ONLY** (4/8/12/16/24/32).
  **LEAVE THE ~1,700 OFF-GRID VALUES ALONE.** They are hand-tuned dense rows
  and they want an eye, not a regex. Log the count; do not touch them.
- **Collapse the 55 hand-rolled shadows onto the three rungs** and give them
  dark recipes. Nine flavours of `rgba()` doing one job.
- **ONE `FLD`/`LBL` PAIR** exported from `core.js`; delete the four unswept
  copies. Seven field constants in three disagreeing flavours is how a form
  ends up 2px off the form beside it.
- **Add `--surface-2` / `--surface-3` and adopt them** on filter bars, table
  feet, menus and drawers. This is the "boxes separated by borders instead of
  shade" complaint: there is no surface between the page ground and white, so a
  filter bar, a table and a modal are all one colour and only a hairline tells
  them apart. Every benchmark does the opposite.

**EXIT:** a type or spacing change is ONE edit. Then delete `--ring`, `--s-0`
and the other genuinely surplus tokens.

**PROOF OBLIGATION:** a before/after computed-value census across 20 screens in
both themes showing **every** size, weight and spacing identical except the 132
named exceptions. Without that census this phase is not finished.

---

## PHASE D — the four ladders that do not exist · ~3 nights

**Motion D+, Responsive C−, Density F, Feedback & loading D.**

Audit items 25–30.

- **MOTION**: `--dur-1/2/3` (120/180/240ms) + `--ease` + `--ease-exit`.
  Migrate all 113 transitions off the twelve ad-hoc durations. **One**
  `prefers-reduced-motion` block — it is respected in 16 scattered places today.
- **BREAKPOINTS**: `--bp-phone/tablet/laptop/desk/wide`. Migrate the **31
  distinct values** to the nearest rung. Anything genuinely bespoke states why
  in a comment — **the nav float line at 1440 is bespoke and is not yours to
  move**: it was set from two of the owner's own laptops and moved three times
  in two days to get there.
- **DENSITY — the F.** `--row-h` / `--row-pad-x` with comfortable / compact /
  condensed, a control in the register's toolbar, remembered per browser.
  **The middle rung is HaTi's shipped 36px** and the bracket is built around it
  deliberately (44/36/30). Fiori's own ladder is 48/32/24 — noted, and not
  copied, because 36 is owner-tuned. **Ship the control; do not move the
  default** (decision 5 above).
- **EMPTY STATES**: extract the register's into
  `emptyStateHtml({icon,title,sub,action})` and adopt it on Intake, Directory,
  Home's decisions card and the Calendar panels — replacing **seven** ad-hoc
  "nothing here" class names with one.
- **LOADING STATES**: a skeleton in the row rhythm for the **eight** data views
  that have none. The audit measured 25 skeleton hits in the entire product.
  A screen that says nothing while it works is indistinguishable from a dead
  button — this product has reported that fault four separate times.
- Tell Chart.js the platform typeface, and `borderRadius:0`.

---

## PHASE T — **THE ONE THE OWNER MUST RULE ON. DO NOT BUILD IT.**

> *"The whole product is set at label size. 826 declarations at 12px and 667 at
> 13px against 328 at 14px. It reads cramped rather than dense."*

**THIS IS NOT IN THE AUDIT'S ROADMAP, AND THAT IS DELIBERATE.** Phase C's type
sweep is explicitly *zero visual change* — it renames 12px to the token that
means 12px. Making the product read less cramped means **raising sizes**, which
moves every screen in the platform and is exactly the kind of decision this
codebase's rules say is the owner's.

**WHAT THIS RUN DOES INSTEAD — and it is the whole of Phase T:** after Phase C
lands (and only after — a size decision taken on a product that does not read
its own ladder cannot be applied in one edit), produce **screenshots, not
prose**: eight screens the owner actually uses, in three treatments —

- **as it is today**,
- **one rung up for body copy only** (12→13, 13→14; labels and micro text
  unmoved),
- **the ladder applied as the spec intends** (body at 14, metadata at 13,
  labels at 12, micro at 11).

Put them side by side, state what each costs in rows-per-screen on a 1440×900
laptop, and stop. **The owner rules from the pictures.** They have decided
every type question in this product that way, and describing it in words has
failed twice.

---

## PHASE E — polish · not overnight work

Audit items 31–35, listed so nobody starts them by accident:

- The **175 inline button paddings across 33 values** — **a visual pass, not a
  regex.** Each is a hand-tuned dense row. No stylesheet can reach them, so
  every one is a decision.
- The icon sweep onto `--icon-*` — verified by painted `getBBox()`, never by
  markup presence: a `<use>` pointing at a missing symbol renders an empty box
  with no error.
- Menu flip-and-clamp (the register ⋯ and the negotiation card ⋯) — **both
  render below the fold today.**
- The counterparty portal's ~40 hardcoded English strings.
- Settings' 13 undivided Platform rows.

---

## 3 · WHAT THIS RUN MAY NOT DO

Stated plainly, because an unattended run's worst failure is a confident one.

- **May not answer the five questions in §2.** Take the default, say so.
- **May not build Phase T.** Screenshots and a stop.
- **May not touch the off-grid spacing values** or the inline button paddings.
- **May not move the nav float line, the 36px row, the square corners or the
  28px control height** — each is an owner ruling with its own history.
- **May not re-record the colour census** except in the same commit as a
  deliberate palette change, audited value by value.
- **May not leave a phase half-done.** Each is independently shippable; ship
  what is finished and say what is not.
- **May not report a grade as closed** without the measurement that proves it.

---

## 4 · HOW TO REPORT

Per phase, in this order:

1. What moved, in plain English, for a non-developer.
2. The measurement that proves it — before and after, in a real browser.
3. What was deliberately left, and why.
4. What was noticed and not fixed (also one line each in `BUGLOG.md`).
5. Which owner decisions were taken by default.
6. Test tally: lint, the targeted files, the one full-suite run, the browser
   files per screen.

**Commit per phase, not per file.** Push to the designated branch. Do not open
a pull request unless the owner asks.
