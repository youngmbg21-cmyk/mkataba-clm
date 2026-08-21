# J12 — "The same product in every window"

All runs used a real Chromium (playwright-core) against a real `startHati()` server
and `seedWorkspace()` fixtures (never jsdom). Scripts live in `scripts/`, raw
output in `run.log` (and per-script `run-0N-*.txt`), machine-readable pass/fail
in `results-0N-*.json`, screenshots in `shots/` (119 PNGs — not readable back by
this session, permission-denied for `*.png`, so every visual claim below is also
backed by a programmatic measurement taken in the same browser pass).

Total: **1 Broken finding (dark theme contrast), 1 Confusing note (modal scrim), 1
untranslated-English finding (2 screens), 1 unreproduced network blip** — everything
else that was tested passed. Sections below are numbered as pressed/measured.

---

## 1. Widths — 1920 / 1500 / 1440 / 1366 / 1280 / 1024 (`scripts/01-widths.js`, 74/74 passed)

Visited Home, Contracts, contract room (all 4 tabs: terms/docs/sign/history),
Negotiations, Insights, Settings, People at every width.

- **No horizontal overflow anywhere.** `document.documentElement.scrollWidth −
  clientWidth` measured `0` on all 6 widths × 9 screens (54 checks). PASS.
- **Below 1500 (1440/1366/1280/1024): sidebar floats, does not push.**
  `#side-nav` computed `position: fixed` at all four; the content box
  (`#content-scroll` bounding rect) was measured **before opening the nav,
  while open, and after closing** and was byte-identical at all four widths —
  e.g. at 1024: `64,124,960,876` → `64,124,960,876` → `64,124,960,876`.
  This corroborates and matches `test/chromium/nav-floats-verify.js`, run
  fresh as a baseline (`nav-floats-baseline.txt`, top of `run.log`): **69/69
  passed**, including the page-not-moving claim at 1280/1366/1440/1512/1920
  and the Insights header-buttons claim.
- **Above 1500 (1920): nav rests at the open 256px column.** Measured
  `256px` exactly.
- One `console.error: 404` appeared once at 1920 during the widths sweep.
  Re-probed standalone (`scripts/probe-404.js`, walking dashboard → register →
  redline → intel → team → directory) and it **did not reproduce** — no
  request ever returned ≥400 or failed. Not reported as a finding; noted as
  an unreproduced blip (possibly a timing race on first paint of a lazy asset).

**Verdict: PASS.** No overflow, no clipping, sidebar floats/pushes correctly
across the whole width range and the whole screen list, zero reproducible
page errors.

---

## 2. Languages, end to end (`scripts/02-languages.js`, 9/9 passed at 1440; plus `lang-coverage.js`)

- Switched EN → SV via the top-bar toggle (`#lang-switch [data-lang="sv"]`,
  reachable at 1440 — confirmed present). Walked Home, Contracts, Negotiations,
  Insights, Settings, People, and the contract room (all 4 tabs) in Swedish.
  Home hero title changed from "Contract Lifecycle Management" to
  **"Hantering av avtalens livscykel"** (the settled `ng_clm` wording, as
  CLAUDE.md specifies) — screenshots `lang-en-home.png` / `lang-sv-home.png`.
- **The contract's own words never translate.** MK-A1's document body,
  isolated to the clause text (`SUPPLY AGREEMENT` … `confidential.`), was
  captured in both languages and is **byte-identical**, 379/379 chars, in
  both EN and SV UI (`debug-wording-en.txt` / `debug-wording-sv.txt`).
- `lang-coverage.js` (the product's own "still-English" measure) run fresh:
  67 still-English text runs total across 11 screens, and every one is either
  (a) contract/clause-library wording (never translated, by design), or
  (b) the documented same-in-both exemptions ("Team", "Status", "Version").
  Nothing new or unexplained turned up (`lang-coverage-run.txt`).

### Finding — untranslated English (rank: **Broken**, screen: contract room →
Document tab, on an EXECUTED contract's seal/signature block, e.g. MK-A1)

Three hardcoded English sentences sit inside an otherwise fully-translated
block (this is exactly the historic "translated fragment followed by
hardcoded English" fault pattern CLAUDE.md calls out):

- `"Timestamp recorded"` — `js/views/contract.js:2220` and again at
  `js/views/portal.js:4287` (the counterparty's copy of the same block —
  two places, same fault, confirming the DUPLICATION WARNING).
- `"Signer identity is verified by account session (first party) and email
  one-time code (counterparty). Government IPRS identity and CAK-accredited
  PKI are on the roadmap and not yet active."` — `js/views/contract.js:2222`.
- `"Not recorded"` (shown when no signature is present) —
  `js/views/contract.js:2201`.

All three sit beside properly-translated neighbours (`i18t('ct_sealed')`,
`i18t('ct_executed_sealed_caps')`, `i18t('ct_sealed_fingerprint')`,
`i18t('ct_document_seal')`) in the same block. Confirmed live in a Swedish
session: the rendered Document tab reads "FÖRSEGLAT … Undertecknat och
förseglat … DOKUMENTSIGILL (SHA-256)" then drops straight into English
mid-paragraph. Screenshot: `shots/lang-sv-room-docs.png`. Verified via 3
explicit checks in `run-02-languages.txt` (all failing, i.e. all three still
hardcoded).

### Months follow the reader's language, not the market
Covered together with the market switch — see §3, since it needs both knobs
turned independently. Both directions proven there.

**Verdict: mostly PASS**, with one concrete untranslated-text finding
(rank Broken — it's platform chrome, not contract wording, so it is squarely
in scope for translation and currently is not).

---

## 3. Both markets (Kenya / Sweden) (`scripts/03-markets.js`, 18/18 passed at 1440)

- Default market is **kenya**. MK-A1's Key Terms value cell reads
  **"KES 48,000,000"** — en-KE comma grouping.
- Pinned the reader's language to English explicitly (two real toggles, SV
  then EN, to defeat the toggle's own documented "already there, do nothing"
  no-op guard — clicking an already-active language button is a genuine
  no-op by design and does **not** count as pinning).
- Opened Settings → Platform → Company & market, switched the market select
  to **sweden**.
  - **Settings page holds still.** Tagged `#set-page` with a JS reference
    before the switch; it is the **same DOM node** after — confirmed a real
    patch-in-place, not a full `renderTeam()` re-render, because the pinned
    English reader's language did not move (the one documented case that
    *would* trigger a full redraw).
  - The market-facts line changed in place: `"Currency: KES · Governing
    law: Kenyan law…"` → `"Currency: SEK · Governing law: Swedish
    law…Regulation (EU) No 910/2014 (eIDAS)."`
  - **Existing contract keeps its OWN currency.** MK-A1's value cell still
    reads **KES**, unaffected by the market switch — "Swedish buttons over
    Kenyan contracts is correct" is proven: same screenshot shows KES value
    with the UI otherwise following the new market/language settings.
    Digit grouping on that same figure flipped to **sv-SE space grouping**
    ("KES 48 000 000") — proving numbers follow the *market*, independent of
    the contract's own currency code.
  - The contract's document wording (Highland Corporate Ltd / Kabras Sugar…)
    is untouched by the market switch.
  - Playbook screen's governing-law clause changed from "laws of Kenya" to
    "Sweden/Stockholm" wording, and no longer mentions Kenya.
- **Months follow the reader's language, numbers follow the market — both
  directions proven on the Calendar.**
  - English reader + Swedish market: `#cal-month` reads **"August 2026"**
    (English month word).
  - Same market, reader flipped to Swedish: `#cal-month` reads
    **"augusti 2026"**.
  - Screenshots: `market-sweden-calendar-english-reader.png`,
    `market-sweden-calendar-swedish-reader.png`.

**Verdict: PASS**, all 18 checks green — every CLAUDE.md claim about markets
reproduced live: settings holds still, Swedish-buttons-over-Kenyan-contracts,
currency/law/facts changing, months-vs-numbers split in both directions.

### Note (rank: **Confusing**, not a defect) — the Settings drawer's scrim is a real page-covering modal backdrop
While probing the "holds still" claim (`scripts/probe-scrim.js`) I found the
company-market drawer's `#st-scrim` (`position:fixed; inset:0; z-index:70`)
covers the *entire* viewport while a drawer is open, including the top-bar
language toggle and the sidebar. This is ordinary "click the backdrop to
dismiss" modal behaviour (the scrim's own click handler calls
`stDrawerClose()`) rather than a broken control — but it does mean: (a) the
language toggle cannot be reached while any settings drawer is open (must
close the drawer first — expected), and (b) a **programmatic** `setView(...)`
call while a drawer is open does *not* clear the drawer/scrim (only
`stDrawerClose()` does), so a script or a future feature that navigates the
`state.view` directly without going through a real click or Escape would
leave a dead, page-covering scrim behind. Not exercised by any normal user
flow found in this pass (a real click on the sidebar while the drawer is up
just closes the drawer, as backdrops normally do — the click is "spent"
closing the modal rather than reaching the nav item, requiring a second
press, which is standard modal UX). Recorded for completeness, not filed as
Broken.

---

## 4. Dark theme (`scripts/04-dark-theme.js`, plus 3 follow-up probes)

Programmatic verdicts, since PNG reads are permission-denied to this session
— every claim below is a WCAG contrast ratio computed live in Chromium from
`getComputedStyle`, walking up the DOM for an opaque effective background,
sampled on Home, Contracts, Negotiations, Insights, Settings, People and all
4 room tabs, in both light and dark.

### Finding (rank: **Broken**, screen: Settings → tab row, e.g. People/Platform
settings/Build & launch/You; reproducible on **any** element using
`--color-accent-700/-800/-900` as text colour) — dark theme never redefines
the accent-700/800/900 tokens

`index.html`'s `html.dark{...}` block (the one place every other dark-mode
token — `--color-neutral-*`, `--color-doc-*`, `--st-*-fg`, `--shadow-*` — is
correctly redefined) **does not touch `--color-accent-700`, `-800`, or
`-900`** at all. Confirmed by reading the resolved custom properties live in
a dark session:

```
accent100: #ccfbf1   (unchanged from light — pale mint)
accent800: #115e59   (unchanged from light — dark teal)
accent900: #134e4a   (unchanged from light — dark teal)
neutral600: #94a3b8  (correctly redefined for dark)
bg: #020617
surface: #0f172a
```

The active Settings tab ("People") renders `color: rgb(17, 94, 89)` — that
unmoved `--color-accent-800` — directly on the page's near-black background
(`rgba(0,0,0,0)` computed background-color on the tab itself, falling
through to `--color-bg:#020617`). Measured contrast ratio **2.66:1** against
a **4.5:1** requirement for 13px/400-weight text (screenshot:
`shots/probe-dark-settings-tabs.png`). The automated sweep caught the same
family of elements independently:

- `dark/settings`: `.st-tab.on` "People" ratio 2.66, `.st-tab` "Build &
  launch" ratio 2.66, both needing 4.5.
- `dark/people`: the mailto link `admin@example.co.ke` (also styled off
  `--color-accent-800`-family teal) ratio 3.26 against 4.5.
- `dark/contracts`: a "show a flat list" toggle button, same family, ratio 3.26.

This is not confined to Settings — `grep -n "color:var(--color-accent-800)"
index.html` (and `-900`) finds **20 rules** across the whole app using these
un-redefined tokens as text colour, including the shared dialog head
(`.rvd-title` / `.rvd-sub` — used by every settings drawer *and* the desk
sheet per CLAUDE.md), `.reg-act` icons, `.ai-chip:hover`, and the inline
template-field chip style (`.field`) that draws every unfilled blank on a
contract document. Only the Settings-tab instance was independently
confirmed with a live measurement in this pass; the other 19 share the exact
same root cause (same tokens, same missing dark redefinition) and are named
here as the same-class, not independently re-verified one by one.

### Everything else in dark: PASS, with 2 methodology false-positives worth naming
- `dark/home`: **0 of 48** low-contrast elements (clean).
- `dark/insights`: **0 of 66** low-contrast elements (clean); separately
  confirmed the Insights/Portfolio panels render as **inline SVG**, not
  `<canvas>` (my first probe's canvas-presence check was wrong — the
  product's own design puts these six panels in SVG, per
  `js/views/portfolio.js`; `js/aichart.js`'s `<canvas>` is for Copilot/Reports/
  Health-report charts, a different surface not defaulted-to here). Sampled
  15 SVG `<text fill="...">` nodes live: all use `var(--color-neutral-600)`
  or `var(--color-text)`, both of which **are** correctly redefined for
  dark — so the charts are in fact theme-safe (`probe-svg-dark.txt`).
- **Status chips/badges do not vanish**: sampled every `.reg-status` /
  `[class*=chip]` / `[class*=badge]` on the register in dark and none share
  their parent's exact background colour (0 of N "vanished").
- Two **light-theme-only** low-contrast reports (`.hm-banner` greeting/title,
  Insights KPI-card figures) are **test-methodology false positives**: both
  elements use CSS `background: linear-gradient(...)` (confirmed in
  `index.html`), which sets `background-image`, not `background-color` — my
  contrast walker only reads `backgroundColor`, so it fell through to a
  grandparent's pale page background and mis-measured white text as sitting
  on white. Both passed cleanly in dark (0 flagged), which is consistent
  with this being a walker limitation rather than a real light *or* dark
  regression (per CLAUDE.md, the hero banner's left stop is `--nav-bg`, a
  dark colour, by design).
- `ui-btn-primary` white-on-teal buttons ("Share", "Draft new agreement",
  "Add member", "Open the register") measured ratio **3.74**, identically,
  in **both** light and dark — not a dark-theme regression (same ratio
  either way), out of scope for this pass.

**Verdict: 1 real, reproducible Broken finding** (accent-700/800/900 text
never gets a dark redefinition — Settings tabs are the confirmed instance,
~19 more CSS rules share the exact cause), **everything else in dark
theme passed**, including charts, chips/badges, and the six screens' general
readability.

---

## 5. The phone shell at 390px (`scripts/05-phone.js`, 19/19 passed)

- `grep -n "changes.push\|negoFileChange" js/mobile*.js` → **no matches**.
  Confirmed: the phone still files no changes of its own.
- Bottom bar: **4 labels**, all measured at exactly **14px** (the floor) —
  Home / Contracts / Negotiate / Approvals.
- Walked Home → Contracts → Negotiate → Approvals via the real bottom-bar
  buttons; **zero horizontal overflow** on every one.
- **Negotiations list, three bands, real data.** Seeded one live negotiation
  (client-side funnel call, same technique as
  `negotiations-door-verify.js`) so the bands had something to show, then
  confirmed the phone's Negotiate screen renders all three: "Waiting on you
  1", "With the other side 0", "Nothing outstanding 0" — matching the
  desktop's band model exactly (`shots/phone-negotiate.png`).
- **Contract screen.** Tapped a real register row (`[data-m-open="MK-A1"]`),
  landed on the phone contract screen (confirmed `[data-m-ctab]` present),
  walked the **terms** and **history** sub-tabs — no overflow on either
  (the phone has no separate "Signing" tab; signing is reached via the
  next-action button, consistent with the mobile design described in
  CLAUDE.md).
- **Share sheet** opens (confirmed a real sheet element >10px tall appeared
  after triggering it), and closes on Escape.
- **People** screen: no overflow, lists real member rows (2+ email
  addresses visible).
- **More** screen: no overflow.

**Verdict: PASS**, all 19 checks green — the phone shell behaves correctly
at 390px across every screen named in the brief, with no changes-filing
leak and correct band/tab structure.

---

## What was NOT reached

- The small-phone width (320px) — the brief's phone matrix asked only for
  390px; 320 is covered by the product's own `phone-verify.js` (not re-run
  here since it is out of scope for J12's specific screen list).
- A full pixel-by-pixel visual review of the 119 screenshots — this session
  cannot read `.png` files back (permission-denied), so every visual claim
  above is instead backed by a live DOM/contrast measurement taken in the
  same Chromium pass. The screenshots exist in `shots/` for a human to open.
- Deep, independent re-verification of all 19 other `--color-accent-800/900`
  text-colour call sites named in §4 — only the Settings-tab instance was
  live-measured; the rest are named by the same grep/root-cause, not each
  individually screenshotted.
- Non-admin roles (restricted/novalues/unrestricted users from
  `seedWorkspace`) were not walked through this same width/language/theme
  matrix — every pass here used the admin account. Market-switching is
  admin-only by design so that part could not have used another role anyway.
- The counterparty/share-link portal pages, and the Copilot chat panel
  itself, were not walked across widths/languages/themes in this pass —
  out of the seven named screens in the brief.
- The one 1920-width `console.error: 404` was not root-caused (it did not
  reproduce on a standalone re-run); flagged as unreproduced, not filed.

## Files
- `scripts/01-widths.js` … `scripts/05-phone.js` — the five main passes.
- `scripts/probe-404.js`, `probe-scrim.js`, `probe-accent-dark.js`,
  `probe-svg-dark.js` — the four follow-up probes referenced above.
- `run.log` — combined raw output (nav-floats baseline + all 5 passes +
  lang-coverage + all 4 probes).
- `results-0N-*.json`, `errors-0N-*.json` — machine-readable per-pass.
- `debug-wording-en.txt` / `debug-wording-sv.txt` — the isolated MK-A1
  clause text proving byte-identical contract wording across languages.
- `debug-body-en.txt` / `debug-body-sv.txt` — the full captured Document-tab
  text (clause + seal block) in both languages, showing exactly where the
  untranslated English in §2 sits.
- `nav-floats-baseline.txt` — fresh 69/69 run of the existing
  `test/chromium/nav-floats-verify.js`, used as corroboration for §1.
- `shots/` — 119 screenshots across all five passes.
