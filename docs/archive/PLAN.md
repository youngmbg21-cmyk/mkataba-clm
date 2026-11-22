# PLAN — making HaTi fit any window

Companion to `AUDIT.md`. Everything below is layout and sizing only. No colour,
no typeface, no information is removed, no screen is simplified.

**Owner's decision, recorded:** contract text keeps a comfortable **reading
column**; dashboards, lists and boards **stretch to fill** the window.

---

## The five breakpoints

One set of names, used everywhere, so every screen agrees on what "narrow"
means:

| Name | Range | What changes |
|---|---|---|
| Ultrawide | ≥ 1800 | Sidebar 272px, activity column 320px. Reading column unchanged. |
| Desktop | 1440 – 1799 | The current design, unchanged. This is the reference. |
| Laptop | 1200 – 1439 | Sidebar 216px, activity column 264px. Hard grids start reflowing. |
| Tablet | 900 – 1199 | Sidebar collapses to an icon rail (72px). Activity column auto-hides. Boards scroll sideways. |
| Phone | < 900 | Sidebar becomes an off-canvas drawer behind a menu button. Everything single-column. |

Chosen so the standard-desktop look at 1440–1799 is **byte-for-byte what ships
today** — the density stays exactly where it is, and every change below only
takes effect on screens that are currently broken.

---

## Step 1 — Make the shell breathe (`index.html`, `js/app.js`)

Fixes **R1, R2, R3, C8**.

1. Add two tokens to `:root` — `--shell-nav-w: 256px` and
   `--shell-panel-w: 292px` — and rewrite `#app-shell`'s grid to
   `var(--shell-nav-w) minmax(0,1fr)`. Today's numbers become today's defaults,
   so nothing moves at desktop width.
2. Retune both tokens at each breakpoint with media queries.
3. **`applyPanelLayout` must become width-aware** (`js/app.js:598`). It writes an
   inline `grid-template-columns`, which beats any media query, so the fix has to
   live inside it: it now writes `1fr var(--shell-panel-w)` (letting the media
   queries retune the width) and hides the activity column outright below 1200.
   The user's manual toggle is remembered and honoured again as soon as the
   window is wide enough — a narrow window suppresses the panel, it does not
   forget the preference.
4. Bind `applyPanelLayout` to the existing `resize` listener beside
   `syncViewHeight` (`js/app.js:184`), debounced.

## Step 2 — Sidebar: rail, then drawer

Fixes **R1** at the two narrowest sizes.

- **Tablet (< 1200):** *superseded.* This originally collapsed the sidebar to an
  icon rail on a breakpoint. Main gained its own rail in the meantime — a
  remembered toggle, collapsed by default — whose code argues explicitly against
  breakpoint-driven collapsing. That design won; this step was dropped so only
  one system decides the sidebar's width. See SUMMARY.md, Run 20a.
- **Phone (< 900):** the sidebar becomes a fixed off-canvas drawer, translated
  off screen, with a scrim. A menu button is added at the far left of the top
  header, visible only below 900. Tapping a destination closes the drawer.

Every existing `data-view` button keeps its id, its handler and its position in
the DOM. Navigation is restyled, never rebuilt.

## Step 3 — Contract page header (`js/views/contract.js:2872`)

Fixes **C1**, the worst defect.

The title block currently declares `min-width:0`, which lets flexbox shrink the
contract's name to nothing rather than wrapping the button row down a line.
Change it to `min-width:min(100%, 260px)`. Below 260px of available room the
action buttons wrap onto their own line — which the container already supports,
since it is `flex-wrap:wrap` — and the contract name is legible at every width.
The `data-ws-fold` fold behaviour is untouched.

## Step 4 — Reflow the hard grids

Fixes **C3, C4, C7**. Each fixed column count becomes `auto-fit` with a sensible
minimum, so cards wrap instead of shrinking past readability:

| Where | From | To |
|---|---|---|
| `reports.js:221` | `repeat(4,1fr)` | `repeat(auto-fit,minmax(220px,1fr))` |
| `reports.js:224` | `1fr 1fr` | `repeat(auto-fit,minmax(340px,1fr))` |
| `home.js:456` | `repeat(3,minmax(0,1fr))` | `repeat(auto-fit,minmax(260px,1fr))` |
| `home.js:576` | `2fr 1fr` | same at ≥1200, single column below |
| `intelligence.js:1032` | `1fr 1.15fr` | same at ≥1100, single column below |
| `designstep.js:277` | `268px minmax(0,1fr) 292px` | drops the right rail below 1280, the left rail below 1000 |
| `library.js:1388` | `196px 1fr` | single column below 900 |

## Step 5 — Boards scroll sideways instead of vanishing

Fixes **C5**. The advice desk (5 columns) and queue (4 columns) get a minimum
column width and an `overflow-x:auto` container. Below tablet the board scrolls
horizontally **inside its own frame** — the page itself never scrolls sideways.

## Step 6 — Tables scroll inside their own container

Fixes **C6**. Every wide table gets a wrapper with `overflow-x:auto` and a
`min-width` on the table itself, so columns stay readable and the table scrolls
rather than compressing or disappearing. The register already does this; the
pattern is copied to the folder table, the team table, template detail, advice
detail and migration.

Data is never removed and no column is ever hidden — the brief is explicit that
information density stays.

## Step 7 — Popovers stay on screen

Fixes **C10**. The three fixed-width anchored menus (register row `⋯`, reports
row `⋯`, contract export) get `max-width:calc(100vw - 24px)` so they cannot
leave the window on a narrow screen.

## Step 8 — Type and units

Fixes **C9**, with the stated departure.

- `body{font-size:13px}` becomes `clamp(12.5px, 12px + 0.12vw, 14px)` — a
  barely-perceptible fluid base that firms up dense text on a small laptop and
  relaxes it on a large monitor, without touching the density.
- Display-scale type gets `clamp()`: page titles, the dashboard hero heading,
  and KPI figures. These are the sizes that actually look wrong at the extremes.
- **The dense 10–13px interface type is deliberately left alone.** It is the
  Bloomberg-terminal density the brief insists on keeping, and there are 1,597
  such declarations, almost all inline inside template strings that also carry
  feature logic. Rewriting them would be a large, risky diff for no visual gain.
  This is a conscious decision, not an oversight, and it is repeated in
  `SUMMARY.md`.
- `100vh` becomes `100dvh` where mobile browser chrome would otherwise cut a
  view short.

## Step 9 — Modals

Already sound (`AUDIT.md`, "already fine"). One tightening only: the four
full-height modals that pass `height:'calc(100vh - 40px)'` also get a
`max-height` so they can never exceed the viewport on a short window.

---

## What will NOT be changed

- Colours, typefaces, radii, shadows, spacing scale — untouched.
- Information density — no data removed, no column hidden, no screen simplified.
- The contract reading column (`DOC_PAGE_W = 660` + `applyDocZoom`) — already the
  requested behaviour.
- The negotiation room's and portal's existing breakpoints — extended where they
  meet the new shell, otherwise left as they are.
- Fonts — the app runs on Inter / Plus Jakarta Sans, not the three families named
  in the brief. Flagged in `AUDIT.md`; nothing changed either way.

---

## Risk register

Ranked by how much damage a mistake would do.

| Risk | Why it matters | How it is contained |
|---|---|---|
| **`applyPanelLayout` is the only writer of the body grid** | Getting it wrong blanks the activity feed or the whole content column | Keep it the sole writer; add width-awareness inside it rather than fighting it with CSS |
| **Negotiation room already has breakpoints** | Two sets of rules could contradict each other and break tracked changes | Shell breakpoints only move the shell; the room's internal grid is left alone |
| **Sidebar rail hides text with CSS** | If a selector is too broad it could hide a live count or a nav destination | Restyle only; every button, id and handler stays in the DOM |
| **The doc zoom reads pane width** | A shell change alters the pane, so the contract could render at the wrong size | `applyDocZoom` re-measures on resize already; verified after the shell change |
| **Inline styles inside template strings** | An edit inside a template literal can break the feature it renders | Small, targeted edits; full test suite run afterwards |

## How it will be proved

1. `npm test` — the full node suite, before and after, must be identical.
2. The browser suites: redline, selection, parity, live, timeline, structure,
   designstep.
3. The same instrumented walk used for the audit, re-run at all nine widths, with
   the before/after offender counts printed side by side in `SUMMARY.md`.
4. Feature spot-checks at 1280 and 768: contract editing, negotiation room,
   tracked changes, comments, PDF export, DOCX round-trip, counterparty portal,
   signing, EN/SV switching.

Anything that cannot be made responsive without risking a feature is reported in
`SUMMARY.md` rather than guessed at.
