# AUDIT — why HaTi does not adapt to the window

Written 2026-08-03. Every claim below was **measured in a real browser**, not
read off the source: the real server was booted, a real admin logged in through
the real login form, and every owner-side screen was walked at 2560, 1920, 1600,
1440, 1366, 1280, 1024, 768 and 390 pixels wide. At each stop the page was asked
two questions — *is anything sitting past the right edge of the window?* and *is
any box holding content wider than itself with no way to scroll to it?*

---

## The plain-English version

The app is built as three strips side by side: a menu on the left that is always
exactly the same width, your work in the middle, and an activity column on the
right that is also always exactly the same width. Neither side strip ever gives
up any space. So on a smaller laptop the middle gets squeezed from both sides
until things stop fitting.

And because the whole app is pinned to the window, the page can never grow a
sideways scrollbar. When something doesn't fit you don't get a scrollbar to
reach it — **it just silently disappears off the edge**. That is precisely why
zooming the browser out is the only workaround: zooming is the only way to give
the middle more room.

The most serious single case: at 1280 pixels wide — a very common laptop width —
you open a contract and the contract's own name is cut down to about two
characters. You are looking at a contract and cannot read which one it is.

---

## What is already fine (do not touch)

Worth stating, because it narrows the job considerably:

- **The viewport meta tag is correct.** `index.html:5` has
  `width=device-width, initial-scale=1.0`. Nothing is forcing a desktop layout
  onto a phone.
- **The negotiation room already adapts.** `js/views/negotiation.js:996-1017`
  carries real breakpoints at 1120 / 900 / 760 that drop the baseline pane, then
  turn the decision index into a drawer.
- **The redline workbench already adapts** — `js/views/negotiation.js:5153`,
  `4963`, `5094`.
- **The counterparty portal already adapts** — `js/views/portal.js:2444` and
  `js/views/adviceportal.js:115,241` both stack their two columns below 1024.
- **Modals are already sane.** `openModal` (`js/core.js:1229-1241`) sets
  `width:100%`, a `max-width`, `max-height:88vh` and 16px of breathing room
  around the panel. `confirmDialog` (`js/core.js:1257`) matches it.
- **The contract sheet is already a reading column.** `DOC_PAGE_W = 660`
  (`js/views/contract.js:2549`) with `applyDocZoom` scaling it up to fill a wide
  pane, capped at 2×. This is exactly the behaviour asked for — it is preserved,
  not replaced.
- **Many card grids already reflow** via `repeat(auto-fit, minmax(...))` —
  `js/views/home.js:530`, `js/views/settings.js:284,314,337,467`,
  `js/views/templatelib.js:142`, `js/views/portal.js:2790`,
  `js/views/migration.js:972-974`.

---

## THE ROOT CAUSE — three findings that explain most of the rest

### R1. The app shell is a fixed-width three-strip grid
`index.html:903`

```
<div id="app-shell" style="…position:fixed;inset:0;
     grid-template-columns:256px minmax(0,1fr);
     grid-template-rows:64px minmax(0,1fr);…">
```

`256px` is a hard number with no breakpoint anywhere. The sidebar takes the same
256 pixels on a 390-wide phone as on a 2560-wide monitor.

### R2. The activity column is a second fixed strip
`index.html:1095` — `<div id="body-grid" style="…grid-template-columns:1fr 292px;…">`

Another hard number. Combined with R1 the arithmetic is brutal:

| Window | minus sidebar | minus activity | **left for your work** |
|---|---|---|---|
| 2560 | 2304 | 2012 | 2012 |
| 1440 | 1184 | 892 | **892** |
| 1280 | 1024 | 732 | **732** |
| 1024 | 768 | 476 | **476** |
| 768 | 512 | 220 | **220** |
| 390 | 134 | −158 | **negative** |

At 768 the entire contract register, its filters, its seven-column table and its
pager are asked to live in 220 pixels. At 390 the arithmetic goes negative.

### R3. Nothing is width-aware in JavaScript, and JavaScript wins
`js/app.js:598-606`

```js
function applyPanelLayout(){
  …
  const show = state.panelOpen && state.view!=='intel';
  if(show){ grid.style.gridTemplateColumns='1fr 292px'; … }
  else    { grid.style.gridTemplateColumns='1fr'; … }
}
```

Two problems. First, the only thing that hides the activity column is a manual
button press — the window's width is never consulted. Second, this writes an
**inline style**, and inline styles beat media queries. So any CSS breakpoint
written against `#body-grid` would be silently overridden. Any fix has to go
through this function, not around it.

The only resize listener in the shell is `syncViewHeight` (`js/app.js:184`),
which measures height only. Width changes are never reacted to at all.

### R4 (consequence). The page can never scroll sideways, so content is lost, not reached
Because `#app-shell` is `position:fixed;inset:0`, `document.documentElement`
never exceeds the window width. Measured across all 126 screen/width
combinations: **`scrollWidth > clientWidth` was never true — not once.** That is
not a clean bill of health, it is the disease. Nothing overflows *visibly*;
it is clipped by `overflow:hidden` or pushed past the right edge with no
scrollbar offering to take you there.

---

## MEASURED BREAKAGE, by width

Counts are "screens with at least one clipped or off-screen element", out of 14
owner-side screens walked. "Sideways" counts screens where the main view area
itself scrolls horizontally.

| Width | Screens affected | Individual issues | Screens scrolling sideways |
|---|---|---|---|
| 2560 | 2 / 14 | 4 | 0 |
| 1920 | 2 / 14 | 4 | 0 |
| 1600 | 2 / 14 | 4 | 0 |
| 1440 | 5 / 14 | 7 | 0 |
| 1366 | 5 / 14 | 10 | 0 |
| 1280 | 7 / 14 | 16 | 1 |
| 1024 | **14 / 14** | **42** | 3 |
| 768 | 8 / 14 | **55** | 5 |
| 390 | **14 / 14** | **152** | **14** |

*Note on the constant 2 screens / 4 issues:* these are the same two false
alarms at every width, recorded here so they are not "fixed" by mistake — the
dashboard hero's decorative glow (`js/views/home.js:393`,
`right:-60px;width:240px`) is deliberately clipped by its parent's
`overflow:hidden`, and `.rl-turnwrap` (`js/views/negotiation.js:5142`) is the
standard 1×1 visually-hidden clip around the turn banner. Both are correct as
written, and both are unchanged by this work.

*A note on how these were counted.* The first pass of the instrument treated any
ancestor with `overflow-x:auto` as a legitimate scroller and skipped everything
inside it. `#content-scroll` carries `overflow:auto` for VERTICAL scrolling, so
that rule excused every element on every page and made a broken app measure
clean. The instrument was corrected — `#content-scroll` is excluded from the
allow-list and whether it scrolls sideways is reported separately — and every
number in this table is from the corrected version, run against the unmodified
code.

---

## THE CATALOGUE

### C1. Contract page header crushes its own title — **worst defect found**
`js/views/contract.js:2872-2884`

```
<section id="ws-head" style="${CARD};flex:none;overflow:hidden">
  <div style="display:flex;…flex-wrap:wrap;…">
    <button id="ws-back" …>
    <div style="min-width:0;flex:1">        ← title + reference line
    <div data-ws-fold="actions" …>          ← Share/Import/Compare/History/Export
```

The parent wraps, but the title block declares `min-width:0`, so flexbox is free
to shrink it to nothing rather than wrapping the button row down a line. The
buttons win every time. Measured:

| Width | Title `<h3>` gets | Needs | Reference line gets | Needs |
|---|---|---|---|---|
| 1920 | full | — | full | — |
| 1440 | full | — | **268px** | 288px |
| 1366 | full | — | **194px** | 288px |
| 1280 | **31px** | 175px | **108px** | 288px |

At 1280, `Retail Supply — Coast` renders as roughly `R…`. The reference number,
folder and last-updated date are gone.

### C2. Insights header subtitle is clipped
`js/views/intelligence.js:734-738` — the explanatory span sits in a `nowrap`
flex header between the tabs and the filter controls, with `min-width:0`.
Measured: needs 541px, gets 518px at 1440 and **358px at 1280**.

### C3. Reports summary row is a hard four-column grid
`js/views/reports.js:221` — `grid-template-columns:repeat(4,1fr)`; and `:224` —
`repeat(1fr 1fr)`. Below ~1400 the four cards can no longer fit. Measured at
1280: the section wants 1013px in 978px, and the fourth card lands **7px past
the right edge of the window**.

### C4. Dashboard pipeline is a hard three-column grid
`js/views/home.js:456` — `repeat(3,minmax(0,1fr))`; and `:576` — `2fr 1fr`.
At 1280 the contract names inside the cards clip (measured 237px of text into
191px: `Waiting on review — Retail Supply — Co…`).

### C5. Kanban-style boards have no minimum and no scroll
- `js/views/advice.js:92` — `repeat(5,minmax(190px,1fr))` → needs 950px + gaps.
- `js/views/queue.js:77` — `repeat(4,minmax(200px,1fr))` → needs 800px + gaps.

Both sit inside the squeezed middle column. At 1024 the middle is 476px, so five
190px columns overflow by roughly 500px — clipped, unreachable.

### C6. Wide tables have no horizontal scroll of their own
Every one of these is `width:100%` with no `min-width`, so instead of scrolling
they compress until columns collide, and where a parent clips they vanish:

| File | Line | Table | Columns |
|---|---|---|---|
| `js/views/register.js` | 593 | contract register | 7 |
| `js/views/register.js` | 86 | folder table | 6 |
| `js/views/settings.js` | 211 | team members (Settings & Rules) | 6 |
| `js/views/library.js` | 1303 | template detail | — |
| `js/views/advice.js` | 250 | advice detail | — |
| `js/views/migration.js` | 1044 | migration rows | — |

Measured at 390: the templates table sits **690px past the right edge**; the
team table **628px past**. The register's own container (`#reg-scroll`,
`js/views/register.js:592`) does have `overflow:auto`, which is why it fares
slightly better — that pattern needs applying to the rest.

### C7. Fixed-column side rails in secondary screens
- `js/views/designstep.js:277` — `268px minmax(0,1fr) 292px`; the two rails
  alone need 560px before any content.
- `js/views/library.js:1388` — `196px 1fr`.
- `js/views/intelligence.js:1032` — `1fr 1.15fr`.
- `js/views/intelligence.js:1022` — `minmax(120px,170px) 1fr 40px 40px`.

None has a breakpoint.

### C8. Only the top header has any responsive rules at all
`index.html:481-483` — three media queries at 1620 / 1430 / 1000 that shed the
jurisdiction caption, then the jurisdiction switcher, then the search box and
profile text. This is good work and it is the *only* responsive CSS in the whole
shell. Nothing exists for the sidebar, the activity column or any view.

### C9. Type and spacing are hardcoded in pixels
- `index.html:251` — `body{ … font-size:13px; … }` — a fixed base.
- **1,597** hardcoded `font-size:NNpx` declarations across `js/`.
- **274** hardcoded `width:NNpx`, **76** `max-width:NNpx`, **54**
  `min-width:NNpx`.
- Spacing tokens are pixels: `index.html:158` —
  `--space-1:3.4px; --space-2:6.8px; …`.

Two notes on this, because it changes what the fix should be. First, the dense
10–13px interface type **is** the Bloomberg-terminal look that must be
preserved; scaling it fluidly would be a redesign, not a repair. Second, most of
those 1,597 declarations are inline styles inside template strings — rewriting
them all would be a very large, very risky diff across features that must not
break. The plan therefore applies fluid `clamp()` sizing to the **display scale
only** (page titles, hero headings, KPI figures) and leaves the dense UI type at
its designed size. This is a deliberate, stated departure from a literal reading
of the brief.

### C10. Absolute positioning used for layout in a few places
`position:absolute` appears 30 times and `position:fixed` 12 times across `js/`.
Most are correct (popovers, menus, badges). The layout-bearing ones worth noting:
- `js/views/negotiation.js:1018` — `#nego-drawer` pinned bottom-right; already
  inside a breakpoint, correct.
- `js/views/reports.js:151` and `js/views/register.js:438` — row `⋯` menus
  anchored `position:absolute` with fixed widths (220px, 180px); they can leave
  the window on a narrow screen.
- `js/views/contract.js:2901` — the export menu, `min-width:250px`, same issue.

### C11. Full-height views assume a fixed chrome height
`index.html:112` — `--view-h:calc(100vh - 126px)`. This is refreshed from a real
measurement by `syncViewHeight` (`js/app.js:173-178`) on every resize, so the
number is not the problem. It is listed only because it uses `100vh`, which on
mobile browsers includes the retracting address bar — `100dvh` is the correct
unit there.

---

## What is NOT broken and must not be "fixed"

- The contract reading column (`DOC_PAGE_W = 660` + `applyDocZoom`). This is the
  requested behaviour, already shipped.
- The dashboard hero's decorative glow clipping (`js/views/home.js:393`).
- `.rl-turnwrap`'s screen-reader clip (`js/views/negotiation.js:5128`).
- The negotiation room's and portal's existing breakpoints — they are extended,
  not replaced.

---

## One thing the brief and the code disagree on

The brief asks to preserve **IBM Plex, DM Sans and JetBrains Mono**. The app does
not use any of them. It runs on **Inter** for body copy and **Plus Jakarta Sans**
for headings (`index.html:113-114`, `fonts/fonts.css`), with a true monospace
stack reserved for exactly two things: a SHA-256 fingerprint and a keyboard chip
(`index.html:125`). `--font-mono` deliberately resolves to Inter, and
`index.html:115-121` explains at length why.

No font is being changed by this work. The disagreement is recorded here so it is
not mistaken for drift introduced by these fixes.
