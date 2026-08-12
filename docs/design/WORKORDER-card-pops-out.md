# WORK ORDER — the redline card pops out instead of expanding down

Owner-approved 12 Aug 2026. The drawings behind this live in
`docs/design/card-opens-out.html` (open it in a browser — it is a styled page,
not a document to read as text). This file is the build order; it is complete on
its own and you should not need the HTML to work from.

Read before touching anything: `CLAUDE.md` — the sections "THE NEW DESIGN
(Document + Negotiate)" and the card rules under it ("CARDS ARE SHUT UNTIL
SOMEBODY OPENS THEM", "A SHUT CARD IS TWO AREAS, NOT ONE"); then the matching
card section of `docs/MAP-HISTORY.md`.

## The problem

A change card in the Tracked Changes column expands **downwards, in place**. Three
things go wrong: the column reflows so every card below moves; the reading matter
(why they asked, the reviewer's note, the notes thread) is squeezed into the
narrowest space on the screen; and there is no way to scroll one change on its own.

## What is true today

Two press targets, and one of them does two jobs:

| Press | Result today |
|---|---|
| `.rl-card-head` | Jumps the document to that clause (`rlLinkFocus`) **and** toggles the card |
| `[data-rl-caret]` | Toggles the card only — deliberately does not move the document |

The caret is `&#9662;` (▾) at 9px in neutral grey, sitting between the origin pill
and the status pill. It reads as punctuation, not as a control. That is the fault.

## What to build

1. **`.rl-card-head` keeps `rlLinkFocus(c, id, 'card')` and stops toggling.**
   Pressing a card means "take me to this clause" and nothing else.
2. **The caret becomes the pop-out door.** ~28px, outlined so it plainly is a
   button, moved to the card's top-right corner after the status pill, carrying an
   *open-out* mark — **not** a chevron. A downward chevron promising a floating
   panel is a lie. Its `title` and `aria-label` say it opens the change.
3. **A floating panel, anchored to its card.** ~420px wide, capped height, its
   **own internal scroll**, floating left over the document. It carries what
   `.rl-card-body` holds today — who filed it, on-behalf, revised-by, why they
   asked, the reviewer's note, the notes list and the composer — **plus the full
   proposed wording**, which the card only shows as two clamped lines.
4. **Closing:** the ✕, Escape, and a press outside it. It must flip or shift when
   the card sits near the top or bottom of the window, and follow or close when
   the column scrolls. It must never open half off-screen.
5. **Below the phone breakpoint it is a bottom sheet**, not a floating panel.

### Where the code is

`js/views/negotiation.js`, and only this file for the behaviour:

| ~line | What |
|---|---|
| 6255–6400 | the card's CSS, injected by `redlineLayoutCss()` |
| 8736 | `rlLinkFocus(c, changeId, source)` |
| 8913–8940 | the two click handlers — `.rl-card-head`, then `[data-rl-caret]` |
| 10828–10840 | the card builder in `redlineChangeCardsHtml` — `const caret`, `const body`, `const actionBar`, the `<article>` and `data-rl-open` |

Line numbers drift. Confirm with grep; do not go exploring beyond them.

### State: this REMOVES state, it does not add it

Per-card open/shut becomes **one value — which single change is popped out, or
none**. Trace every caller before deleting any of: `_rlCardChoice`,
`rlCardIsOpen`, `rlCardSetOpen`, `rlCardOpenState`, `rlCardStateKey`,
`data-rl-open`, `.rl-card-shut`.

## Must not break

Each of these is a standing rule with a test already behind it.

- **The verbs stay on the shut card.** `.rl-card-actions` is a sibling of the head
  and nothing folds it. A verb must be **visible pixels** (f180) — including
  inside the counterparty embed, where jsdom will happily "press" a hidden button.
- **`redlineChangeCardsHtml` is rendered by four surfaces**: the workbench, the
  phone (the desktop renderer under a back bar), the counterparty's portal embed
  (`redlineEmbed`), and redline-verify's harness. The panel must work **inside an
  embed** — check the containing block, not just the workbench.
- **`negoLiveCardsHtml` is a different renderer** (the contract tab's own card).
  Leave it alone, and say so in the summary.
- **`rlCardSort` / `rlCardRank` / `redlineCardIds` are untouched.** This is not a
  filter and not a sort; every chip count stays identical.
- **New classes go where the other `.rl-*` rules live** (`redlineLayoutCss`), never
  invented at the call site — see the `ui-input` lesson in CLAUDE.md.
- **Every new string goes through `i18t()` / `i18tn()`, in EN and SV.** Never `t()`.

## Tests — rewrite the claims, do not delete them

- `test/chromium/card-collapse-verify.js` pins today's shut/open behaviour.
  Rewrite it for the pop-out: the card no longer grows, the panel opens as visible
  pixels with a real box, it scrolls internally, the card's own verbs stay
  pressable, and pressing the card body still jumps the document.
- Check and update: `f84`, `f89`, `f100b/e/f`, `test/chromium/redline-verify.js`
  (checks 14b, 14c), `parity-verify`, `phone-verify`.
- Add one browser check that the panel opens inside the counterparty's embed.

Run: one file `node --test --test-reporter=dot test/<f>.test.js`; everything
`npm test` (~3m20s); browser checks `node test/chromium/<name>.js`. The full suite
and every browser check named above must pass before committing.

## Not in this change

The `‹ ›` previous/next stepper through the queue (Option B in the design page).
Note it as a follow-up; do not build it.

## Finish with

A short plain-English summary for a non-developer: what changed, that it reaches
the phone and the counterparty's page, anything deliberately left alone, and
anything you were unsure about. No file paths, no line numbers.
