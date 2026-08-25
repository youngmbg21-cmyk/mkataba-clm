# HaTi — UI/UX Audit & Pre-Launch Roadmap

**Audited:** 25 Aug 2026 · **Against:** Apple (macOS HIG + apple.com), Linear, Stripe, SAP Fiori Horizon / S-4HANA, Vercel (Geist), Ramp
**Method:** every finding read at `file:line` in the working tree, then adversarially re-read by a second pass instructed to refute it. 97 findings survived.
**Companions:** `DESIGN-SYSTEM-SPEC.md` · `prototype/design-system-preview.html`

---

## 0 · Verdict

**HaTi is closer to enterprise-grade than a first look suggests, and it is failing on a narrower set of things than a first look suggests.** It has a mature colour system, a genuine token vocabulary, correct dialog semantics, tabular numerals, a command palette, a considered dark theme and a level of documented design reasoning most Series-A products never reach.

What it does not have is **adoption**. The type ladder, the spacing ladder, the weight ladder and the radius ladder are all declared in `:root` and are read by almost nothing:

| Ladder | Declared | Consumers | Competing literals |
|---|---|---|---|
| Colour | ✅ | 5,125 `var()` reads | 663 hex literals |
| Border | ✅ | 602 of 1,202 (50%) | 600 |
| Shadow | ✅ | 109 of 241 (45%) | 55 hand-rolled `rgba()` in 9 flavours |
| **Type** | ✅ | **2 of 2,394 (0.08%)** | 2,339 raw px |
| **Spacing** | ✅ | **2 of 3,566 (0.06%)** | ~2,600 raw px, ~1,700 off the 4pt grid |
| **Weight** | ✅ | **0 of 1,074** | 1,074 |
| **Radius** | ✅ | **0 of 833** | 833 |
| **Motion** | partial | 5 of 113 | 12 ad-hoc durations |
| **Breakpoints** | ✗ | — | **31 distinct values** |
| **Density** | ✗ | 1 | one 36px row, typed once |

> **A ladder with no consumers is a document, not a system.** This is the whole gap, and it is why HaTi can be described in its own rulebook as having a design system and still not look like one.

**The good news is that this is the cheapest possible kind of debt.** A type sweep by exact-value mapping (`14px → var(--t-body)`) changes **not one pixel** — it is a mechanical rename that makes the next change one edit instead of two thousand. The expensive work is already done: somebody chose the values.

**Three findings are not design debt and should be read first — §2.**

---

## 1 · Benchmark standards extracted (Phase 1)

Sourced and confidence-marked. `✅` = verified in first-party source or published tokens; `~` = search summary only (several vendor sites are blocked by the egress proxy); `○` = industry convention, no normative spec.

### Apple — restraint, hierarchy, materials

| Standard | Numbers |
|---|---|
| ~ macOS type ramp is **dense** | Large Title 26 · Title1 22 · Title2 17 · Title3 15 · **Headline 13/semibold · Body 13** · Caption 10. The iOS ramp (Body 17) is one to two rungs looser — do not port it to a desktop app. |
| ✅ Focus ring | `2px solid #0071e3`. WCAG 2.4.11: ≥2px, ≥3:1 against **both** the unfocused state and adjacent colour. |
| ✅ Materials | `backdrop-filter: saturate(180%) blur(20px)` for transient chrome only. Five thicknesses, four vibrancy inks. **Anything you read is opaque.** Guard with `@supports not (backdrop-filter:…)`. |
| ✅ Target size | 44×44px minimum. WCAG 2.5.8 floor is 24×24px. |
| ○ Motion | `.snappy(0.25s)`, `.smooth(0.35s)`, `spring(response .32, damping .72)`. |

### Linear & Stripe — density that stays calm

| Standard | Numbers |
|---|---|
| ✅ Structure by **1px hairlines, not shadow** | Dark `rgba(255,255,255,.05)` resting → `.08` emphasis; solid `#23252a → #34343a → #3e3e44`. Light: Stripe hairline `#e3e8ee`. |
| ✅ Elevate by a **tone ladder**, four steps | Linear dark: `#010102 → #0f1011 → #141516 → #18191a → #191a1b` — 4–6 units of lightness per step. |
| ✅ Shadows are **tinted with the surface hue**, never black | L1 `0 1px 3px rgba(0,55,112,.08)`; L2 `0 8px 24px rgba(0,55,112,.08), 0 2px 6px rgba(0,55,112,.04)`. |
| ✅ Contrast floors | 4.5:1 text under 18.66px; 3:1 boundaries, icons, dots. **White on accent-600 measures ~3.7:1 and fails — use accent-700 (~5.5:1).** An opacity-faded ink lands 2.4–4.1:1 and is never a substitute for a second ink. |
| ✅ Tracking tightens with size, zero at body | 40px → −1.0px · 28 → −0.6 · 22 → −0.4 · 20 → −0.2 · 16 → −0.05 · **≤14 → 0** · uppercase eyebrow +0.09em. All three vendors agree on this curve. |
| ○ Row height is the density lever | 36 dense / 40 default / 44 comfortable; cell padding `0 12px`; line-height stated at 20px; header 32–35px. |
| ○ Command palette is **primary navigation** | Paints <100ms; remote debounce ~250ms; rows 36–40px; 8 rows before scroll; ↑/↓/Enter/Escape; focus in on open, back to the opener on close. |
| ✅ Spacing | 4px grid: 2·4·8·12·16·24·32·48. Radii 4 chip · 6 button · 8 card · 12 dialog. |

### SAP Fiori Horizon — enterprise IA (the richest verified source)

| Standard | Numbers |
|---|---|
| ✅ **Three densities on one axis** | Cozy `3rem/48px` · Compact `2rem/32px` · Condensed `1.5rem/24px`. Row height = base + border → **49 / 33 / 25px**. Column header = base size. |
| ✅ Condensed is an **add-on to compact**, never a third independent state | Verbatim: *"The application must run in compact mode. If it runs in cozy mode, the class is not set."* Grid tables only, never responsive tables. |
| ✅ Density gates **input mode** | Compact and condensed *"cannot be interacted with via touch"*, even on a touchscreen. Cozy touch area 44px. |
| ✅ Element heights | 36 / 26 / 22px across the three densities. |
| ✅ Five semantic roles, by **consequence** | `#256f3a` positive · `#aa0808` negative · `#e76500` critical · `#788fa6` neutral · `#0070f2` informative. **Text and fill are separate tokens per role** — critical *text* is `darken(10%)` while critical *element* is the raw value. |
| ✅ A status band is one band | MessageStrip: min-height 32px, padding `7px 16px`, 40px icon column — and **all four types use the neutral text colour**. Only the ground and the icon carry the role. |
| ✅ Breakpoints | `600 / 1024 / 1440`. |
| ~ Dynamic page header **snaps** | Title persists, facts scroll away; **re-expands when its content receives keyboard focus** and re-collapses when focus leaves. |
| ~ Filter bar | Live mode has no Go button; manual mode must have one. Expanded bar shows a *subset*; the rest live behind "Adapt Filters". |
| ~ Variant management | A saved view carries filters **and** columns, and shows an asterisk when dirty, offering overwrite or save-as. |
| ~ Flexible column layout | list · document · detail at **25 : 50 : 25**; no 3-column layout below 1024px; splits resizable and remembered per device type. |

### Vercel & Ramp — dashboard rhythm

| Standard | Numbers |
|---|---|
| ✅ Sidebar (shadcn, the de-facto implementation) | Expanded `16rem/256px` · rail `3rem/48px` · mobile `18rem/288px` · **⌘B** to toggle · remembered **7 days**. |
| ~ Geist | 4px space unit; control heights 32/40/48; radius 6 functional / 12 card; page 1200px, wide 1400px, gutter 24px; header 64px. |
| ○ Ramp (publishes no design system — observed) | Near-monochrome warm canvas, white cards, hairline borders, **a single vivid accent used only where money moves**. |

---

## 2 · Read these three first — they are not design debt

Found by the UI audit, verified by hand, and outside what a visual pass would normally touch.

### 2.1 · `toast()` writes its message into `innerHTML` unescaped — `js/core.js:790`

```js
el.innerHTML = '…<span style="flex:1;min-width:0">' + msg + '</span>'
             + (act ? '…>' + esc(act.label) + '</button>' : '');
//                          ^^^ the label IS escaped, one expression later
```

**117 of 635 `toast()` calls interpolate a stored value** — a member's own display name, a signer's name, a workspace name typed at setup, a template label, a contract reference:

```js
toast(`Karibu tena, ${u.name.split(' ')[0]}`)
toast(`Sent back for approval — waiting on ${approverLabelOf(back[0].approver)}`)
toast(`Workspace "${name}" created — karibu!`)
```

An Editor who sets their display name to `<img src=x onerror=…>` gets script execution in every colleague's browser the next time a toast names them. **This is stored XSS, and the fix is one word:** `esc(msg)`. `esc` already resolves at that line — the expression beside it calls it.

### 2.2 · `confirmDialog` runs the destructive act on Enter regardless of focus — `js/core.js:2179`

```js
function onKey(e){ if(e.key==='Escape') done(false); else if(e.key==='Enter') done(true); }
document.addEventListener('keydown', onKey);
```

Tab to **Cancel**, press Enter — the contract is deleted. **Delete the Enter branch entirely.** A focused `<button>` already fires `click` on Enter, so the two buttons then own their own keys and Cancel means Cancel.

### 2.3 · The toast sits *under* seven overlay layers — `index.html:4779`

`#toast-root` carries a literal `z-[60]` while `--z-toast` is 90 and the docked Copilot drawer sits at `z-100` **in the toast's exact bottom-right corner**. Every confirmation and every refusal raised while Copilot is open is painted behind it. Point it at `var(--z-toast)`.

> These three are stated, not fixed. Fixing them is a change to `core.js` and `index.html`, which is beyond an audit — say the word and they are a ten-minute patch with a test each.

---

## 3 · Gap analysis (Phase 3)

### 3.1 Scorecard

| Dimension | Grade | Why |
|---|---|---|
| Colour system | **A−** | 20 status tokens, all theme-complete. Brand-aware. Genuinely good. |
| Dark theme | **C+** | 55 of 192 tokens redefined. **24 colour tokens have no dark answer**, and the accent ramp is among them. |
| Type system | **D** | The ladder is right and unread. 2 consumers. 62% of the product is set at 12–13px — *label and metadata sizes* — against a declared 14px body. |
| Spacing rhythm | **D** | 2 consumers. ~1,700 values off the 4pt grid (10px ×243, 6px ×208, 7px ×181, 5px ×173, 9px ×162). |
| Elevation | **C** | Ladder exists, 45% adopted, no tonal ladder at all, 55 hand-rolled recipes, no dark recipes. |
| Motion | **D+** | 12 durations, no ladder, `--ease` at 5 consumers. `prefers-reduced-motion` respected in 16 places. |
| Responsive | **C−** | **31 breakpoints.** The float line is well-reasoned; the rest is ad-hoc. |
| Component maturity | **C** | Buttons and badges are well-specified; **175 buttons carry inline padding across 33 distinct values** that no stylesheet can reach. 7 field constants in 3 disagreeing flavours. |
| Feedback & states | **D** | **Zero `aria-live` regions.** Zero loading states in the 8 main data views. 7 distinct "nothing here" class names, one designed empty state. |
| Accessibility | **D+** | Dialogs are correct (credit). Focus ring architecture is correct (credit). But: focus colour fails in dark, keyboard paths missing on 6 primary surfaces, phone shell has **zero** a11y semantics in 3,419 lines. |
| Density control | **F** | One row height. No user control. |
| Information architecture | **B** | 16 views, a real object-page pattern, banded lists, a working ⌘K. Genuinely enterprise-shaped. |

### 3.2 Where HaTi feels dated, and precisely why

1. **It is set at label size.** 826 declarations at 12px and 667 at 13px against 328 at 14px. Apple's macOS ramp and Linear both anchor body at 13–14 — HaTi is *at* that anchor for metadata and *below* it for body. The product reads cramped rather than dense.
2. **The rhythm is hand-tuned, not stepped.** 10px, 6px, 7px, 5px, 9px, 3px paddings in the thousands. No two cards breathe alike, and no rule can be moved without touching every one.
3. **Elevation is carried by shadow, not tone.** There is no surface between the page ground and white, so a filter bar, a table and a modal are all the same colour and only borders separate them. Every benchmark does the opposite.
4. **Motion is inconsistent enough to read as jitter.** Twelve durations means a hover here and a hover there feel like different products.
5. **It has one density.** A contract register and an audit trail are read completely differently; Fiori ships three modes for exactly this reason.
6. **Dark mode is half-built.** It looks finished until you find the 183 accent-as-text declarations at 2.35:1 and the focus ring at 1.58:1.

### 3.3 What HaTi should keep — do not "modernise" these

- **The `box-shadow` focus ring.** 59 inline `outline:none` declarations exist and none sets `box-shadow`, so the shadow form reaches all of them. An outline never could. This is a correct, hard-won solution.
- **`openModal`.** Role, `aria-modal`, label, focus in, Tab cycle, focus return. Route new overlays through it.
- **`tabular-nums`.** 145 uses across 15 files, correctly applied.
- **The status token set.** All 20 tokens theme-complete.
- **`table-layout:fixed` with percentages summing to 100.** Exactly right, and hard-won.
- **The documented reasoning.** `CLAUDE.md` records *why* for nearly every decision. That is worth more than any of the fixes below.

---

## 4 · Page-by-page audit (Phase 2)

97 verified findings. **P0** = broken, unreachable, inaccessible or misleading · **P1** = a customer or evaluator would notice · **P2** = polish.

| Surface | P0 | P1 | P2 | The one thing to fix first |
|---|---|---|---|---|
| Tokens & consistency | 4 | 5 | 2 | 183 accent-as-text declarations with no dark answer |
| Insights / Calendar / Reports | 4 | 5 | 2 | Reports' hero cards at **1.67:1** |
| Components / modals / feedback | 2 | 4 | 1 | `toast()` unescaped · `confirmDialog` Enter |
| Mobile / phone shell | 2 | 3 | 4 | Zero a11y semantics in 3,419 lines |
| Negotiation / redline | 1 | 4 | 4 | Reading mode refuses the pointer only |
| Register / tables | 0 | 4 | 5 | Negotiation rows are mouse-only |
| Shell / nav / header | 0 | 4 | 4 | Focus ring 1.3:1 on the dark bar |
| Counterparty portal | 0 | 5 | 3 | "Malformed link" shown for a network failure |
| Home / dashboard | 0 | 5 | 2 | KPI reorder is drag-only; the footer instructs the impossible |
| States / loading / error | 0 | 6 | 1 | Bootstrap failure dumps you on the login form silently |
| Settings / library | 0 | 4 | 2 | Drawer declares `aria-modal`, traps nothing |
| Contract room | 0 | 4 | 1 | Tabs stamp `aria-selected` once and never update |

### 4.1 Tokens & consistency — the root cause of most of the rest

- **P0** `index.html:760` — **183 declarations set the raw accent ramp as text colour.** `--accent-ink` exists with a correct dark answer; the recorded fix reached two selectors and **`a:hover` one line below the fixed `a` was missed**. 2.35:1 at night. *Mechanical one-token rename.*
- **P0** `index.html:544` — **the focus ring itself** reads `--color-accent-700`, which dark never redefines: **1.58:1 in the navy dark theme**. Fix: `--focus-color:var(--accent-ink)`.
- **P0** `family.js:299` — 62 inline accent-tint backgrounds with no dark answer; **four wrap inherited text and measure 1.02:1 at night.** Fix: `--st-steel-bg` / `--st-steel-line`, which already flip.
- **P0** `index.html:4779` — toast z-order (§2.3).
- **P1** `index.html:249` — **the neutral ramp is collapsed in light and not in dark**: 226 elements that are one shade by day are three shades apart at night.
- **P1** `index.html:529` — **three shadow ladders share the same rung names**; the one used 99 times has no dark answer and different geometry from the one used 110 times.
- **P1** `index.html:535` — **28 tokens have zero consumers**, including the entire `--z-*`, `--icon-*` and `--radius*` groups and six of nine type rungs. `--ring` is declared directly beneath a comment saying it was deleted for having none.

### 4.2 Insights / Calendar / Reports — the weakest surface

- **P0** `reports.js:277` — four hero stat cards are saturated gradients with white text at **1.67:1 and 1.92:1**. This is the single most visually dated thing in the product and the least accessible.
- **P0** `calendar.js:742` · `portfolio.js:233` · `intelligence.js:1296` — accent-as-text with no dark answer; a `role="img"` SVG whose every dot is a click target and whose own footer says "click a dot"; and **six `text-ink` opacity rungs never re-pointed** (/45, /50, /60).
- **P1** `aichart.js:146` — **no chart is told the platform typeface.** Every axis, legend and tooltip renders in Chart.js's default Helvetica/Arial. One line: `Chart.defaults.font.family`.
- **P1** `reports.js:336` — Reports hand-rolls its primary button at accent-600, re-introducing the exact 3.74:1 the platform button was moved off.

### 4.3 Mobile — the largest single gap

- **P0** `mobile.js:1078` — **zero accessibility semantics in 3,419 lines.** The tab bar has no current state; **seven sheets are undeclared modals** with no Escape and no focus handling.
- **P0** `mobile.js:256` — in dark mode **the live tab is the only unreadable one**: 3.26:1 teal / 1.58:1 navy, against resting siblings at 7.89:1.
- **P1** `index.html:5` — **no `viewport-fit=cover`**, so all 13 `env(safe-area-inset-*)` calls resolve to 0. One attribute; every consumer already has a 0px fallback.
- **P1** `mobile.js:205` — the desktop's own AA button fix never reached the phone.

### 4.4 Everything else — the pattern

Four faults repeat across every remaining surface, and each has one cause:

1. **A control is mouse-only.** Negotiation rows, the split divider, KPI reorder, sortable headers, the card→clause link, the risk map. *The click handler was written and the keydown was not.*
2. **An overlay declares modality and delivers none.** The settings drawer, the alerts panel, the ⌘K palette, the portal's alerts, the KPI popover, seven phone sheets — all `aria-modal` or scrim, none trapping or restoring focus. `openModal` already does it correctly; nothing reuses it.
3. **A refusal is announced to nobody.** `stDrawerRefuse`, the toast root, the portal's Sign button, filter results. Zero `aria-live` regions product-wide.
4. **A failure is reported as the wrong thing.** A network error reads "your link is malformed" to the counterparty; a bootstrap failure silently shows the login form to an already-authenticated user; informational Copilot notices toast red.

---

## 5 · The roadmap

Sequenced so each phase is independently shippable and nothing later depends on a decision not yet made.

### Phase 0 — Before launch · ~½ day · **do this regardless**

| # | Fix | Where | Cost |
|---|---|---|---|
| 1 | `esc(msg)` in `toast()` | `core.js:790` | 1 word |
| 2 | Delete the `Enter` branch in `confirmDialog` | `core.js:2179` | 1 line |
| 3 | `#toast-root` → `var(--z-toast)`, add `role="status" aria-live="polite"` | `index.html:4779` | 1 line |
| 4 | `--focus-color: var(--accent-ink)` | `index.html:544` | 1 token |
| 5 | `viewport-fit=cover` | `index.html:5` | 1 attribute |

Five edits. Two are security, one is a keyboard trap, two are one-word contrast fixes. **Each needs one test.**

### Phase 1 — Contrast & dark-theme completion · ~2 days

6. Sweep `color:var(--color-accent-600|700|800|900)` → `var(--accent-ink)`. **183 declarations, mechanical, changes nothing in light mode.**
7. Sweep inline `background:var(--color-accent-100|200)` → `--st-steel-bg` / `--st-steel-line`. 62 declarations.
8. Give `--danger`, `--rule-strong`, `--rule-faint` dark answers.
9. Re-point the six `text-ink` opacity rungs onto the two real inks — **in HaTi's own sheet, never the Tailwind blob**, which regenerates.
10. Rebuild Reports' four hero cards on the platform card shell with a 3px tone edge.
11. Fix the pager, the mobile primary button and `confirmDialog`'s inline confirm — all three are the same accent-600 3.74:1.
12. **Re-record `theme-tokens-verify` in the same commit**, audited value by value.

*Exit: every text/boundary token passes AA in both themes, on all 20 census screens.*

### Phase 2 — Keyboard & announcement · ~3 days

13. Extract `openModal`'s focus block into `trapFocus(panel)`; adopt it in the settings drawer, alerts panel, ⌘K palette, portal alerts, KPI popover, `confirmDialog`, `promptDialog` and the seven phone sheets. **One implementation, nine call sites.**
14. Add the missing keydown beside the existing click on: negotiation rows, sortable headers, the split divider (port `ktWireSplit`, which already has it), KPI reorder, the card→clause link, risk-map dots.
15. `aria-live` on the toast root, `stDrawerRefuse`, the portal's sign state and the register's result count.
16. `aria-current="page"` in `setActiveNav`; `aria-selected` in `applyWsTabs`.
17. `inert` on the change column in reading mode — refusing the pointer is not refusing the keyboard.
18. Phone: `role="dialog"` + focus + Escape on all seven sheets; `aria-current` on the tab bar.

*Exit: every act reachable by keyboard; every refusal spoken.*

### Phase 3 — Adopt the ladders · ~4 days, zero visual change

19. **Type sweep by exact-value mapping.** 30→`--t-display`, 19→`--t-page`, 17→`--t-section`, 15→`--t-card`, 14→`--t-body`, 13→`--t-meta`, 12→`--t-label`, 11→`--t-micro`, 10→`--t-figure`. Resolve the 132 off-ladder sizes to the nearest rung **one at a time, with eyes on** — that is the only part that moves a pixel.
20. **Weight sweep**: 400/500/600/700 → `--w-*`. 1,074 declarations, no pixel moves.
21. **Spacing sweep** for on-grid values only (4/8/12/16/24/32). Leave the ~1,700 off-grid values alone in this phase; they are hand-tuned dense rows and want an eye.
22. Collapse the 55 hand-rolled shadows onto the three rungs; add dark recipes.
23. **One `FLD`/`LBL` pair** exported from `core.js`; delete the four unswept copies in `intake.js`, `library.js`, `family.js`.
24. Add `--surface-2` / `--surface-3` and adopt them on filter bars, table feet, menus and drawers.

*Exit: a type or spacing change is one edit. Delete `--ring`, `--s-0` and the other genuinely surplus tokens.*

### Phase 4 — The ladders that do not exist yet · ~3 days

25. **Motion**: `--dur-1/2/3` + `--ease` + `--ease-exit`. Migrate all 113 transitions. One `prefers-reduced-motion` block.
26. **Breakpoints**: `--bp-phone/tablet/laptop/desk/wide`. Migrate the 31 values to the nearest rung; anything genuinely bespoke states why in a comment.
27. **Density**: `--row-h` / `--row-pad-x` with comfortable/compact/condensed, a control in the register's toolbar, remembered per browser. *Note Fiori's verified ladder is 48/32/24 against HaTi's proposed 44/36/30 — HaTi's middle rung is its shipped, owner-tuned 36px and the bracket is built around it deliberately.*
28. **Empty states**: extract `register.js:663` into `emptyStateHtml({icon,title,sub,action})`; adopt on Intake, Directory, Home's decisions card, the Calendar panels — replacing 7 ad-hoc class names.
29. **Loading states**: a skeleton in the row rhythm for the eight data views that have none.
30. Tell Chart.js the platform typeface and set `borderRadius:0`.

### Phase 5 — Polish · ongoing

31. The 175 inline button paddings across 33 values — **a visual pass, not a regex**; each is a hand-tuned dense row.
32. Icon sweep onto `--icon-*`; verify by painted `getBBox()`, never markup presence.
33. Menu flip-and-clamp (register ⋯, negotiation card ⋯) — both render below the fold today.
34. The counterparty portal's remaining ~40 hardcoded English strings and its inability to render in the sender's language.
35. Group Settings' 13 undivided Platform rows.

---

## 6 · Decisions only the owner can make

Each is a place where HaTi diverges from all five benchmarks. None is a defect; all are recorded in `DESIGN-SYSTEM-SPEC.md` §9.

| # | Question | Cost to change |
|---|---|---|
| 1 | **Radius: keep 0, or adopt 4px?** Every benchmark uses 4–8px. HaTi swept ~810 radii to 0 on your own ask. | **One line.** `prototype/design-system-preview.html` has a live toggle — look at both and rule. |
| 2 | **Should any head row carry a filled button?** Four separate reversals have removed them. Linear and Stripe keep exactly one. | Per-row. |
| 3 | **Control height 28 vs 32px.** You ruled 28; Fiori, Vercel and Linear all use 32. | One token, moves every row. |
| 4 | **Should the contract's name outrank a fact value on its own header?** Two separate rulings independently set both to 15px/600, so they are now byte-identical. The *interaction* was never put to you. | One value. |
| 5 | **Density default**: compact (today) or comfortable? | One token. |

---

## 7 · What this audit did not cover

Said plainly rather than left as an implication.

- **No live screenshot pass of the running app.** Every finding is read from source at `file:line` and adversarially re-verified there, plus a real-browser measurement pass on the prototype. A photograph pass across all 16 views in both themes would likely find more — this codebase's own rulebook records that jsdom cannot see a rule that lost a cascade fight.
- **Server-rendered surfaces** (transactional email templates, the PDF and Word exports, the standalone health and weekly report windows) were not audited. They carry their own styling deliberately and are excluded from the token system by design.
- **No copy or content-design audit.** Roughly half the visible strings in the contract room and ~40 in the counterparty portal are hardcoded English in a bilingual product — flagged as findings, but the tone and wording themselves were not reviewed.
- **Nothing was changed in the product.** The three deliverables are two new documents and one new file in `prototype/`. Phase 0's five edits are stated and not applied.
