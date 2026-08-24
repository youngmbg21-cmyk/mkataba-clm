# WORK ORDER — the black ink

**Owner's words, 24 Aug 2026:**

> "The html has a very beautiful design on how they use the black fonts across
> the different pages but HaTi uses grey fonts instead which is not striking. I
> need the use of black font the way it has been applied in the html to be
> designed accordingly in HaTi."

Reference: `/tmp/design/design_handoff_hati_enterprise/` — `tokens.css`,
`TYPOGRAPHY.md`, `hati-enterprise-demo.html`.

---

## What was already measured (do not redo this)

A first pass was built, measured and then set aside so the three unrelated
fixes could ship on their own. **The diff is saved at
`docs/WORKORDER-black-ink.patch`** — `git apply docs/WORKORDER-black-ink.patch`
puts it back. It is verified (node suite untouched, colour census 40/40,
contrast improved on every step) but it is only PART ONE below.

### The finding

HaTi's 22 Aug type retune re-hued the reading ramp onto the brand's green-black
family. **It got the hue right and the depth wrong.** Measured step for step
against the handover's own `tokens.css`, every one of HaTi's inks sits a shade
LIGHTER than the design's — so the product reads one notch softer than the
reference on every screen at once. That is the whole of the owner's report.

| role | design (`tokens.css`) | HaTi before | on white, before → after |
|---|---|---|---|
| primary | `--ink` **#0E1A18** | `--color-text` #1B2A28 | 14.91 → **17.80** |
| panel prose | `--ink2` **#3B4A48** | `--color-doc-muted` #43524F | 8.21 → **9.30** |
| label / meta | `--ink3` **#54635F** | `--color-neutral-500/600` #5F6D6B | 5.40 → **6.31** |
| quiet | `--ink4` **#8A9997** | `--color-neutral-400` #93A09E | 2.71 → **2.96** |

Dark theme, same story: design `#EAF1EF / #C6D4D0 / #9FB0AC / #6F817C` against
HaTi's `#E3E9E8 / #C9D2D0 / #93A09E / #5F6D6B`.

**Nothing got lighter.** Every step gained contrast; this is a change of DEPTH,
not of hue, and the 22 Aug hue decision stands.

### The second finding — where the design leaves text BLACK

The design sets **no colour at all** on most text: 118 elements inherit `--ink`
from the body, and only 244 are explicitly greyed. Its rule in practice:

- **default = `--ink`** — headings, row titles, counterparty, tile titles, body
- `--ink3` — counts, captions, sub-lines, meta, 12–13px secondary
- `--ink2` — inactive tabs and prose inside a panel (a DARK grey, not a light one)
- `--ink4` — column headers, "not applicable" values

HaTi's own rule (CLAUDE.md, "FOUR SHADES CARRY ALL READING TEXT") already says
*primary is 14px or larger; secondary is where 11–13px lives*. **Measured, three
screens break it:**

| screen | element | now | design says |
|---|---|---|---|
| Contracts | `· 310 d` countdown suffix | 14px secondary | one colour per expiry cell |
| Home | the unit beside a numeral (`%`, `docs`) | 14px secondary | primary |
| Calendar | head sub-facts (`Nothing to decide this week`, `August 2026`) | 14px secondary | 13px `--ink3` |

The register's **value-stream cell is correctly grey** — the design's own row
sets `color:var(--ink3)` on that one cell. Do not "fix" it.

---

## The work

### Part one — the ramp takes the design's values (built, verified, in the patch)

1. `index.html` `:root` — `--color-text:#0E1A18`, `--color-neutral-500/600:#54635F`,
   `--color-neutral-400:#8A9997`, `--color-neutral-700/800/900:#0E1A18`,
   `--color-doc-text:#0E1A18`, `--color-doc-muted:#3B4A48`.
2. `index.html` `html.dark` — `--color-text:#EAF1EF`,
   `--color-neutral-500/600:#9FB0AC`, `--color-neutral-400:#6F817C`,
   `--color-neutral-700:#C6D4D0`.
3. `test/f238-the-design-system.test.js` — a new check pinning all twelve
   declarations to the design's literal values, plus a sweep that `#1B2A28` is
   no longer declared in `:root`. **Pinned as literals on purpose**, unlike
   almost every other check in the suite: these are not "a dark ink" and "a
   label ink", they are the four the handover declares, and the failure being
   guarded against is exactly a well-meant retune drifting off them again.
4. `test/chromium/theme-tokens-baseline.json` — re-recorded. **The audit is
   done and it is clean:** 7 values left, 9 arrived, every one a one-for-one
   swap of an ink for the design's own, no screen gained or lost a hue. The two
   values that leave from 20 screens rather than 10 are `#5F6D6B` and `#93A09E`,
   which were in BOTH themes (light 500/600 and 400; dark 400 and 500/600).

### Part two — the three 14px greys (not built)

Each is small, and each needs a decision rather than a sweep:

- **Contracts, the countdown suffix.** Either give the whole expiry cell one
  colour like the design does, or lift the suffix to primary. Check
  `contracts-page-verify` and `flat-rows-and-alerts-verify` first — the 23 Aug
  owner ruling flattened this row's weights and sizes and must not be reversed.
- **Home, the unit beside a numeral.** Primary, matching its numeral.
- **Calendar, the head sub-facts.** The design draws its `calSub` at 13px
  `--ink3`; dropping HaTi's from 14 to 13 makes it compliant without touching
  the colour, and is the smaller change.

### What is deliberately OUT of scope

- **`#5F6D6B` / `#1B2A28` literals in `js/views/portal.js`, `js/app.js`'s print
  root and `js/branding.js`.** These are standalone documents opened in their
  own window — the evidence pack, the print sheet, the branding preview. They
  carry no stylesheet, so a token there resolves to nothing, and CLAUDE.md
  already records that exemption. They are now one shade lighter than the
  console, which is harmless on a printed record.
- **Home's 32px tile numerals at `--color-neutral-400` when they read zero.**
  That grey is a deliberate signal — a tile counting zero is not a door — and is
  recorded in CLAUDE.md. The design gives its numerals full ink because it has
  no such state.
- **The register row's status weight.** The design draws it at 600; HaTi
  flattened it to 400 on 23 Aug at the owner's explicit ask. Leave it.
- **`--color-neutral-400` as a non-type token.** It carries 20 borders and
  backgrounds against 39 text uses, so it is the one step in this ramp that is
  not purely type. Its value moves; nothing about its usage should.

---

## Acceptance

- `npm test` green (was 4,526/4,526 before this work).
- `node test/chromium/theme-tokens-verify.js` — 40/40, with the baseline
  re-recorded and the set difference audited in the commit message.
- `node test/chromium/contracts-page-verify.js`, `clause-door-verify.js`,
  `pages-read-alike-verify.js` unchanged.
- `npm run lint` at its 4-error baseline (duplicate keys in `js/i18n.js`).
- A screenshot of the contract room, Contracts and Home held next to
  `hati-enterprise-demo.html`, in both themes.

## One known red that is NOT this work

`pages-read-alike-verify` fails 3 of 38 on `1 the negotiation head does not
wrap`. **Proved at commit `b82889e` — it fails identically there**, before any
of this. It is somebody else's regression and should be chased on its own.
