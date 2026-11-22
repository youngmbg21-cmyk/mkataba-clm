# HaTi — Design System Specification

**Status:** proposed, launch candidate · **Written:** 25 Aug 2026
**Companion files:** `UI-UX-AUDIT-AND-ROADMAP.md` (what is wrong today and in what order to fix it) · `prototype/design-system-preview.html` (this spec, drawn and measured in a real browser)

---

## 0 · How to read this

HaTi **already has a design system**. `index.html`'s `:root` declares 192 tokens covering colour, type, spacing, borders, shadows, status roles, focus, fields and z-order. This document does not replace that vocabulary — it would break 5,125 `var()` reads across the product to do so. Every token name below is HaTi's own.

What this document does is three things:

1. **States the ladders that exist**, so they can be adopted. Measured on 25 Aug 2026: of 2,394 `font-size` declarations, **2** read `var(--t-*)`; of 3,566 `padding`/`margin` declarations, **2** read the spacing scale. The ladders are real and almost nothing stands on them. A ladder with no consumers is a document, not a system.
2. **Adds the four ladders that are missing** — motion, breakpoints, density, tonal elevation. Each is marked **NEW**.
3. **Records the deliberate divergences** from the benchmark set (Apple, Linear, Stripe, SAP Fiori Horizon, Vercel, Ramp) as *rulings*, not defects — §9. A house style that disagrees with the benchmark on purpose is a design decision; one that disagrees by accident is drift.

> **The one rule that governs the rest.** A value typed into a rule is a value that can disagree with the next one. If two places must agree, they read one token. If a number has to be measured against another element, it is written by the code that measures it (`--reg-head-h`, `--view-h`) and never typed.

---

## 1 · Principles

Distilled from the benchmark set and reconciled with what a contract product actually has to do.

| # | Principle | Where it comes from | What it means here |
|---|---|---|---|
| 1 | **Density is a setting, not a style.** | SAP Fiori (cozy/compact/condensed) | A contract register and an approval queue are not read the same way. One token, three modes — §2.9. |
| 2 | **Elevate by tone first, shadow last.** | Linear, Stripe | A card differs from its page by *surface*, not by a drop shadow. Shadow is reserved for things that genuinely float — menu, drawer, modal. |
| 3 | **One filled act per view.** | Apple, Linear | A row of four filled buttons has no primary. Everything else is outlined or plain — never grey, which this product has learned three separate times reads as furniture. |
| 4 | **Colour is never the only carrier.** | WCAG 1.4.1, Fiori semantic roles | A status is a dot *and* a word. A filter that is narrowing says so in weight and ink as well as in a border. |
| 5 | **Numbers that sit in a column line up.** | Stripe, Ramp | `font-variant-numeric: tabular-nums` on every money, count, date and reference. HaTi does this well already — 145 uses across 15 files. |
| 6 | **The header must always fit; the body may ellipsise.** | Fiori responsive table | Head text is fixed and known. A body cell holds a counterparty's name and must be allowed to end in `…`. |
| 7 | **Motion is functional, three durations only.** | Apple HIG, Linear | 120 / 180 / 240ms. Anything longer is decoration; anything with a fourth value is drift. Everything collapses under `prefers-reduced-motion`. |
| 8 | **A refusal states itself where the reader is looking, with a way forward.** | Fiori message strips | Never a toast for a standing condition. Never a dead control with no explanation. |
| 9 | **Keyboard is a first-class input.** | Linear, Vercel | `⌘K` everywhere, `Esc` closes the topmost layer, `Tab` cycles inside a modal, arrows traverse a list. |
| 10 | **Primary ink is 14px and up; the secondary shade is where 11–13px lives.** | HaTi's own typography note | This is the rule that assigns the four reading shades. It is mechanical — §2.3. |

---

## 2 · Token architecture

### 2.1 Surfaces and ground

Four levels. The distinction is **tone**, and each level is one step, not a leap.

```css
--surface-0   /* the page ground        — #EDF1F2 light · #020617 dark */
--surface-1   /* a card, table, panel   — #ffffff light · #0f172a dark */
--surface-2   /* a nested well: filter bar, table foot, drawer foot */
--surface-3   /* a true float: menu, drawer, modal */
```

**NEW: `--surface-2` and `--surface-3`.** HaTi has `--color-bg` and `--color-surface` and nothing between or above them, so a filter bar and the table under it are the same white and a modal and a card are the same white. The two new steps are what let a nested region read as nested without a border doing all the work.

`--color-bg` and `--color-surface` remain as the aliases everything already reads. `--surface-0`/`-1` are their names in the ladder.

### 2.2 Ink

Four shades carry **all** reading text. Not nine.

```css
--color-text          /* PRIMARY   #0E1A18 · headings, body, table values, clause text */
--color-neutral-600   /* SECONDARY #54635F · labels, counts, breadcrumbs, column heads */
--color-neutral-400   /* QUIET     #8A9997 · disabled, placeholder, an em-dash absence */
                      /* INVERSE   #ffffff · on a filled or dark ground */
```

**The assignment rule is mechanical:** primary is 14px and up; secondary is where 11–13px lives. An 11px rule must be an uppercase micro label — never a sentence.

**Never carry ink in an opacity.** `.text-ink/40…/60` put 54 elements between 2.36:1 and 4.11:1 — five rungs under AA. Hierarchy is carried by size and weight, which survive a background change; a fade does not.

### 2.3 Accent

```css
--color-accent-50 … -900   /* the ramp: fills, washes, borders */
--accent-solid             /* = -600. Brand fills that must not flip: nav, primary button */
--accent-ink               /* THE ONLY ACCENT TOKEN THAT MAY CARRY TEXT */
--btn-edge                 /* color-mix(accent-solid 45%, transparent) */
```

> **This is the single most important rule in the colour system.**
> `html.dark` redefines the surface, the ink and the whole neutral ramp and **does not redefine the accent ramp**. `--color-accent-800` measures **2.35:1** on the dark panel — AA wants 4.5:1. `--accent-ink` exists precisely to solve this and resolves to `accent-800` in light and `accent-300` (9.59:1) in dark.
>
> **Any accent used as `color:` reads `--accent-ink`. Any accent used as a fill or a border may read the ramp.** Measured today: 40 declarations still read the raw ramp as ink and fail at night — including `a:hover`, while resting `a` was correctly fixed.

**The one filled act uses `accent-700`, not `accent-600`.** White on `-600` is 3.74:1, under AA for a 14px label. `-700` gives 5.47:1 in the teal workspace and 11.30:1 in the navy one, so one value serves both and no dark override is owed.

### 2.4 Semantic / status roles

Five roles, four tokens each. **All twenty already have a dark answer** — this is the healthiest part of HaTi's colour system and nothing here needs changing.

| Role | Token stem | Means |
|---|---|---|
| Neutral | `--st-gray-*` | Draft, inactive, nothing owed |
| Critical | `--st-amber-*` | Waiting on you, due soon, a caution |
| Positive | `--st-green-*` | Signed, cleared, agreed |
| Negative | `--st-ruby-*` | Declined, refused, expired, a refusal |
| Information | `--st-steel-*` | In flight, counterparty ready, informational |

Each carries `-bg` (wash), `-fg` (ink), `-dot` (the 6px mark), `-line` (border).

**`--danger` is the interaction role, not a status.** It dresses a destructive *verb* (Delete, Decline, Revoke). It currently has **no dark answer** — `#dc2626` is 3.70:1 on the night panel. It needs one: `#f87171`.

### 2.5 Typography

One family end to end: **Inter**, SIL Open Font License. `--font-heading`, `--font-body` and `--font-mono` all resolve to it; they differ by **weight**, not by face. `--font-code` (Courier New) is the deliberate exception for a SHA-256 seal and a keyboard chip.

| Token | px | Role |
|---|---|---|
| `--t-display` | 30 | hero figure only |
| `--t-page` | 19 | the `h1` of a view |
| `--t-section` | 17 | drawer head, dialog title |
| `--t-card` | 15 | card title, contract-room title |
| `--t-body` | **14** | body copy and table values — the root |
| `--t-meta` | 13 | secondary metadata, a sub-line |
| `--t-label` | 12 | field label |
| `--t-micro` | 11 | UPPERCASE micro label only — never a sentence |
| `--t-figure` | 10 | a count inside a chip. The floor. |

```css
--w-body:400  --w-label:500  --w-strong:600  --w-title:700
--lh-tight:1.2   /* single-line controls: buttons, chips, tabs, counts */
--lh-snug:1.35   /* headings — two lines at most */
--lh-base:1.5    /* the base */
--lh-relaxed:1.6 /* multi-line body copy, notices, panel prose */
--lh-doc:1.8     /* the contract paper */
--ls-micro:.09em --ls-title:-0.01em --ls-base:0
```

**Every size is a whole pixel.** A fractional size puts glyph stems between device pixels and the renderer interpolates them; the same face at 11.5px reads measurably softer than at 11 or 12. **No fluid type** — `clamp()` resolves to a different fraction at every viewport width, which is fractional *everywhere* rather than nowhere.

`font-feature-settings:'cv11'` on the body — Inter's alternate letterforms, which keep similar characters apart at small sizes.

### 2.6 Spacing

A 4-point grid. `--s-1:4 --s-2:8 --s-3:12 --s-4:16 --s-6:24 --s-8:32 --s-10:40 --s-12:48`.

Derived measures, so two rules that must cancel each other read the same token:

```css
--page-pad-x --page-pad-t --page-pad-b   /* the page measure — ALL eleven view roots */
--pad-card --pad-card-sm --pad-card-lg
--row-pad-x                              /* set by density — §2.9 */
--gap-tight --gap-row --gap-card --gap-section
```

> **Where one rule cancels another's padding, both read the same token.** A typed number that happens to match is a gap waiting for the token to move — this has already cost HaTi one visible bug when `--page-pad-t` started tightening with the window.

### 2.7 Borders and rules

```css
--color-divider   /* the ordinary hairline: card edges, cell rules */
--rule-strong     /* where a REGION ends: head band, tab baseline, table header */
--rule-faint      /* repeated rules inside one dense table */
--field-line      /* a control's boundary — 3.03:1 on white, WCAG 1.4.11 wants 3:1 */
--border-w:1px  --border-w-strong:2px
```

`--rule-strong` and `--rule-faint` are declared and have **zero consumers**. The "two hairlines" intent was never implemented, and both need a dark answer before they are adopted (`#C6CFCD` is 11.23:1 on the night panel — a near-white rule).

### 2.8 Elevation — **NEW ladder**

Two mechanisms, used in order:

1. **Tone.** A surface one step above its ground reads `--surface-N+1`. This is the default and covers cards, tables, filter bars, table feet.
2. **Shadow.** Only for something that genuinely floats above the page and can be dismissed.

```css
--shadow-sm   /* a card lifting on hover; a sticky bar */
--shadow-md   /* a menu, a popover, a toast */
--shadow-lg   /* a drawer, a modal */
```

Measured today: 241 `box-shadow` declarations, 109 read the ladder, **55 are hand-rolled `rgba()` recipes** in ~9 distinct flavours. Every one of those 55 should resolve to a rung or be deleted.

**Dark needs its own recipes.** A shadow tuned for white is invisible on `#0f172a`; the dark block re-states all three at higher alpha.

### 2.9 Density — **NEW ladder**

One token drives a whole table's rhythm.

| Mode | `--row-h` | `--row-pad-x` | For |
|---|---|---|---|
| Comfortable | 44px | 16px | Approvals, signing routes, anything read one row at a time |
| **Compact** (default) | **36px** | 12px | The contract register, negotiations — HaTi's current row |
| Condensed | 30px | 8px | Audit trails, long history, power users |

HaTi ships one row height (36px, typed once as `--reg-row-h` with a single consumer). Fiori ships three because the same table is read two different ways. The mode is a **per-table** setting with a workspace default, remembered per browser.

> **Reconciled with Fiori's verified ladder, which is 48 / 32 / 24 (row height 49 / 33 / 25).** HaTi's middle rung is **36px** — its shipped, owner-tuned row — and the bracket above is built around it rather than replacing it, because 36 is a value somebody already chose against this product's own type. Two Fiori rules are worth carrying over verbatim: **condensed is an add-on to compact, never an independent state** (*"the application must run in compact mode"*), and **neither compact nor condensed is touchable** — SAP states plainly they *"cannot be interacted with via touch"* even on a touchscreen. So the phone shell stays on `--ctl-h-touch` and never inherits a density mode.

**On a `<td>` a stated height is a floor, not a cap** — a cell grows past it when content needs to, which is what makes this safe here where it would not be on a `div`.

### 2.10 Motion — **NEW ladder**

Measured today: 113 transitions across **12 ad-hoc durations** (.12s ×63, .15s ×58, .13s, .14s, .18s, .2s, .22s, .25s, .28s, .3s …) and `--ease` has 5 consumers.

```css
--dur-1:120ms   /* a state change on a control: hover, press, tick, tab */
--dur-2:180ms   /* something appears or repositions: menu, tooltip, chip, modal */
--dur-3:240ms   /* something travels: drawer, side panel, sheet */
--ease:cubic-bezier(.2,.7,.3,1)      /* standard */
--ease-exit:cubic-bezier(.4,0,1,1)   /* leaving — faster out than in */
```

Three durations, two curves. **Nothing animates `width`, `height`, `top` or `left`** — `transform` and `opacity` only, which are the two properties a compositor can animate without re-laying-out the page.

One reduced-motion block collapses the whole ladder:

```css
@media (prefers-reduced-motion:reduce){ :root{ --dur-1:0ms; --dur-2:0ms; --dur-3:0ms; } }
```

### 2.11 Breakpoints — **NEW ladder**

Measured today: **31 distinct `@media` breakpoints** (479, 560, 639, 640, 680, 719, 720, 760, 767, 768, 820, 880, 899, 900, 980, 999, 1000, 1023, 1024, 1080, 1099, 1100, 1120, 1180, 1199, 1279, 1280, 1439, 1440, 1536, 1800). The benchmark set uses four to six.

| Token | Value | Meaning |
|---|---|---|
| `--bp-phone` | 768px | below this the desktop shell hides and the phone shell draws |
| `--bp-tablet` | 1024px | split views stack; the divider stands down |
| `--bp-laptop` | 1280px | the nav column becomes a 64px rail |
| `--bp-desk` | 1440px | **the float line** — at or below, the nav floats over the page; above, it pushes |
| `--bp-wide` | 1800px | content stops growing and centres |

The float line is not arithmetic — it separates two real laptops and is owner-set from reports on real machines. **It must not be pinned in a test as a literal**; pin the *drift* instead — that the JS reading and the CSS `max-width` say the same number.

Existing breakpoints migrate to the nearest rung. Anything that genuinely needs a bespoke value (a component's own fold ladder) states why in a comment.

### 2.12 Focus, z-order, icons

```css
--focus-color:var(--color-accent-700);
--focus:0 0 0 2px var(--focus-color);
```

> **The focus ring is a `box-shadow`, not an `outline`, and that is load-bearing.** HaTi carries 59 inline `outline:none` declarations that no stylesheet can beat without `!important` — but **none of them sets `box-shadow`**, so the shadow form reaches all of them. This is HaTi's own solution and it is correct. Do not "simplify" it back to an outline.

Applied on `:focus-visible` only, so a mouse press does not draw a ring.

```css
--z-base:0  --z-sticky:20  --z-drawer:40  --z-scrim:60
--z-modal:70  --z-menu:80  --z-toast:90
--icon-sm:14px  --icon:16px  --icon-lg:20px  --icon-stroke:1.5
```

Icons are one 16px box, hairline stroke, `currentColor`, no fills except where a mark is genuinely solid. A `<use>` pointing at a missing symbol renders an **empty box** with no error — icon references must be verified by painted `getBBox()`, never by markup presence.

### 2.13 Radius

`--radius: 0` — **an owner ruling, not a defect.** See §9.

---

## 3 · Buttons

Three strengths. **At most one filled act per view.**

| Class | Face | Border | Ink | For |
|---|---|---|---|---|
| `.ui-btn-primary` | `accent-700` | same | white | the one act |
| `.ui-btn` | transparent | `--btn-edge` | `--accent-ink` | an ordinary verb |
| `.ui-btn-plain` | transparent | none | `--accent-ink` | a head row beside the one act |
| `.ui-btn-danger` | transparent | `danger` @45% | `--danger` | a destructive verb |

**Height comes from a rung; padding is horizontal only.**

```css
min-height:var(--ctl-h); padding:0 var(--pad-ctl-x);
```

`padding:6px 12px` on a 14px/1.2 label computes to **30.8px** — taller than a "large" button fixed at 28 — which is how one row ends up with three heights. Sizes: `--ctl-h-sm` 24 · `--ctl-h` 28 · `--ctl-h-lg` 32 · `--ctl-h-touch` 44 (phone only).

**A button in a head row has no business setting its own height or border.** Scope the pin to the row (`#ws-head .room-acts button`), never to today's four class names — a rule naming today's classes is one the next button walks past.

**States, all four required:** hover (face deepens), active (0.5px press), `:focus-visible` (the ring), `[disabled]` (0.45 opacity, `not-allowed`, hover suppressed), `[aria-busy]` (spinner, label at 0.35, width held so the row does not jump).

> **Grey is not an option.** A neutral-grey secondary reads as furniture — reported three separate times in this product. Flat is not grey: border and ink stay the workspace accent, only the fill goes.

**Debt:** 189 `.ui-btn` elements carry an inline `style` — 167 with padding, 172 with a font size. No stylesheet can reach any of them. They are hand-tuned dense rows and want an eye, not a regex.

---

## 4 · Badges and status

Two forms of one fact. Choosing between them is the whole spec.

**The chip** — a wash, a border, a dot and a word. For a card, a panel head, a detail row: somewhere a shape helps you find it.

```css
.badge{ font-size:var(--t-label); font-weight:var(--w-title); letter-spacing:.03em;
        padding:2px 9px; border:1px solid; }
.badge>.dot{ width:6px; height:6px; border-radius:50%; }
```

**The quiet form** — a dot and a word, no wash, no border. **For a table cell.** Five filled chips down the middle of a register read as five buttons; the dot carries the tone and the word carries the meaning.

```css
.stat{ font-size:var(--t-meta); color:var(--color-text); }
.stat>.dot{ width:7px; height:7px; border-radius:50%; }
```

One reading decides the branch (`contractStatusMeta`) and **every dress asks it** — the chip, the dot-and-word and the head-row sentence. Three copies of "which branch applies" is how they come to disagree.

---

## 5 · Tables

The register is the product's centre of gravity. Everything here is measured.

**Layout.** `table-layout:fixed`, percentage widths **summing to exactly 100**, stated on the head row. An auto table sizes columns to the rows it is *currently showing*, so a page of long names shifts every column and the page scrolls sideways — measured at 27–36px of drift on a real book. Fixed makes "no sideways scroll" a guarantee rather than something that happens to hold at today's width.

`overflow:hidden` on the cell is the other half: in a fixed layout a child wider than its column spills over the one beside it.

**Head row.** `--t-micro` / `--w-title` / `--color-neutral-600`, **sentence case** — uppercase plus `.09em` tracking costs a head about 40% of its width and is this product's *signpost* treatment, not its column-head treatment. Sticky at `top:0`, `--rule-strong` beneath, `--surface-1` behind (a transparent sticky head lets rows scroll through it).

**Body row.** Height from `--row-h`. `--t-meta`, primary ink, `--rule-faint` between. Hover and `:focus-visible` both light the row. The whole row is the target; a cell that stops propagation must say why.

**Numbers.** `tabular-nums` on reference, money, count and date. Money right-aligned. A date is `25.08.2026` with its countdown as `· 12 d` in its urgency tone — digits carry no month word, so nothing needs translating.

**Truncation.** Head must always fit; body ellipsises. Both need the hover to carry the whole value.

**Band headings.** A grouping row is `role="presentation"`, no `data-row`, no tab stop, and is generated at render so the footer's "1–8 of 8" cannot count one. Pinned below the head at a **measured** offset written by the code (`--reg-head-h`), never a typed number — a typed 38 against a head that renders 35 leaves a 3px slot for rows to scroll through.

**Sort.** Head is a button, `aria-sort` on the live column, caret inked only when active but its **width always reserved** so hovering does not shift the row.

**Empty and loading.** A table narrowed to nothing **says what narrowed it and offers the way back**. Loading is a skeleton in the row rhythm it stands in for, so nothing jumps when the data lands.

---

## 6 · Filter bars

Modelled on Fiori's filter bar, drawn at Linear's weight.

- **A filter says what it filters.** Label above the control, always. A `title` attribute is not a label — two dropdowns both reading "Any" side by side mean different things and neither says which.
- **Resting state is a neutral edge** (`--field-line`), not the accent. The accent is reserved for the filter that is *actually narrowing*, which then carries border **and** ink **and** 600 weight — three carriers, because one is a colour.
- **An active filter's ink is `--accent-ink`**, never the raw ramp: `accent-800` on the night panel is 2.35:1.
- **One line.** The bar wraps to a second line only below `--bp-tablet`. If it will not fit, a filter is removed — not shrunk.
- **A clear control appears only when something is on**, and it says how many.
- **A narrowing that the page owns** (a scope, not a filter) is not drawn as a clearable chip. There is nothing for its ✕ to do.

---

## 7 · Cards

**KPI / metric card.** Three facts, no more: the figure, its name, its movement.

- A 3px top edge in the metric's own tone. **Hover must never touch `border-color`** — it erases that edge.
- Figure at 26px/700 with `tabular-nums`; label at `--t-label` in the secondary shade; sub-line at `--t-label`.
- **A card counting zero is not a door.** The zero still draws — it is true — but the arrow goes, the hover lift goes, and the press is refused. A *fixed* tile takes `disabled` so the browser refuses it and a keyboard reader is told; a *draggable* tile takes `aria-disabled` instead, because a disabled element fires no drag events.
- A reader without value permission gets **no money half at all** — not a dash under a money label, which tells them a figure exists and is being kept from them.

**Content card.** `--surface-1`, `--color-divider`, `--pad-card`. A title at `--t-card`/600, a hairline, then content. **`empty:hidden`** — a bordered box drawn before its content is what makes a missing card read as a broken page.

**Object header** (Fiori's object page, HaTi's contract room). Breadcrumb → title + status → a fact row of label-above-value pairs divided by hairlines → acts at the right. **An absent fact is drawn and named with an em-dash, never omitted** — a row that loses a column reads as a different page. The collapse control folds the *facts* only; title, status and acts never move.

---

## 8 · Overlays

**A drawer is for a form you fill and dismiss. A modal is for a question you answer.** Both: focus moves in on open, `Tab` cycles inside, `Esc` closes the topmost layer only, the scrim closes, and focus **returns to the opener**.

Both must set `role="dialog"`, `aria-modal="true"` and an accessible name. **HaTi's `openModal` already does all of this correctly** — role, `aria-modal`, an optional label, focus into the first control, `Tab` cycling and focus return to the opener. It is the reference implementation; new overlays should route through it rather than hand-rolling a panel.

**Drawer** — 440px, right, `--surface-3`, `--shadow-lg`, `translateX` over `--dur-3`. Head (title + sub + ✕) / body (scrolls) / foot.

> **The refusal lives in the foot.** Above the fields it pushes everything down 46px the moment it appears and pulls it back when it clears; pinned in the foot it also cannot be scrolled away from.

Two foot kinds, and the difference is honesty: **`save`** for a real form, **`done`** for a panel that already wrote what you changed. A gate that writes on change has no Save button on purpose — one there would be a button that does nothing.

**Modal** — `min(560px, 100vw-32px)`, centred, opacity + a 0.985→1 scale over `--dur-2`. Head (icon + title + sub) / body / foot with the acts right-aligned.

**Toast** — three kinds, three dwells, **and no kind may carry a dwell of zero**.

| Kind | Tone | Dwell | For |
|---|---|---|---|
| `ok` | accent-800 | 2600ms | an act that left the page and cannot be taken back |
| `warn` | amber | 8000ms | it happened, but not the way you expected — carries an action |
| `err` | ruby | 5000ms | it did not happen |

An identical message already on screen is **replaced**, not stacked. The toast root is `aria-live="polite" role="status"` — measured today, HaTi has **zero** `aria-live` regions and the toast is its main feedback channel.

A toast is for something that just happened because of a press. **A standing condition is not a toast** — it is a row in the alerts panel or a line on the page.

---

## 9 · Deliberate divergences from the benchmark set

These are **rulings**. They are recorded so that "HaTi differs from Linear here" reads as a decision and not as drift.

| # | HaTi | The benchmark | Why | Revisit? |
|---|---|---|---|---|
| 1 | `--radius: 0` everywhere | Apple 10–12px, Linear/Stripe/Vercel 4–8px | Owner-asked, ~810 radii swept. Squareness reads as documentary and legal. | **Yes — one line.** The prototype has a live toggle so the two can be seen side by side. |
| 2 | No filled button in a head row | Linear/Stripe keep one filled primary | Owner-reported four times: a filled face reads as shouting, not leading. The act leads by **position and weight**. | Settled — four reversals by the same hand. |
| 3 | `--ctl-h: 28px` | Fiori 32, Vercel 32, Linear 32 | Owner-ruled: "buttons should stay at 28 but the rest should stick to the new design." | Settled. |
| 4 | No page describes itself under its own title | Fiori and Vercel both draw a subtitle | Owner-asked twice: a sentence describing the page to a reader already looking at it. | Settled. |
| 5 | Nothing floats over the page | Linear/Ramp use floating toolbars and toasts | Owner-asked: notices draw **in flow** above the working area. Toasts are the one exception. | Settled. |
| 6 | Filters wear a neutral edge; buttons wear accent | The reference draws both on neutral | Owner's standing call on buttons; filters matched the reference on 25 Aug. | Half-closed. |
| 7 | Table heads sentence case | Fiori and Stripe use uppercase micro-caps | Owner-asked 24 Aug: "only capitalize the first." Also buys ~40% of the head's width. | Settled. |

---

## 10 · The invariants

Nine rules. Each was learned here, expensively, and each is written as a thing a test can check.

1. **A ladder with no consumers is a document.** A token added without a sweep that adopts it is debt.
2. **Any accent that carries text reads `--accent-ink`.** The ramp is for fills and borders.
3. **Every colour token that carries ink or a rule has a dark answer.** 24 do not today.
4. **Never define a colour only inside a media or `[data-theme]` block.** Define the light value on bare `:root`, redefine under dark.
5. **A number that must agree with another element's size is written by the code that measures it**, never typed.
6. **Pin the relation, not the number.** "Smaller than the body" survives a type pass; `13px` costs a test edit. HaTi's last type sweep cost five test edits, four of them exactly this.
7. **Measure the computed value before editing the declaration.** A rule that loses a specificity fight looks perfectly correct in the source and draws nothing — this codebase's most repeated visual defect.
8. **Fix scope, never reach for `!important`.** It wins this fight and hides the next.
9. **Photograph what you build.** jsdom resolves no cascade; a rule that vanished, an icon that did not resolve, and a control that clips are all invisible to a source read.

---

## 11 · Conformance

A surface conforms when all of the following hold. `prototype/design-system-preview.html` is the reference implementation and passes every one.

- [ ] Every `font-size` reads `var(--t-*)`. No fractional sizes. No `clamp()`.
- [ ] Every `padding`/`margin` reads the 4pt scale.
- [ ] Every accent used as `color:` reads `--accent-ink`.
- [ ] Every colour token used has a dark answer; the surface is checked in **both** themes.
- [ ] Every `transition` reads `--dur-*` and `--ease*`; nothing animates a layout property.
- [ ] Every `@media` reads a `--bp-*` rung, or states why not.
- [ ] Every interactive element has hover, active, `:focus-visible` and disabled.
- [ ] Every status is a dot **and** a word.
- [ ] Every number in a column is `tabular-nums`.
- [ ] Every dialog sets `role`, `aria-modal` and a name; focus enters, cycles and returns.
- [ ] Empty, loading and error states exist and are designed.
- [ ] No sideways scroll at 1280, 1440 or 1920; no head cell clips.
