# AUDIT — the redline engine and the Negotiate tab

Assessment only. No code was changed. Measured 2026-08-12 against the working tree at
`135c485`.

---

## The verdict

**Tired, not in trouble.** The area is 24,494 lines, but 10,083 of those are prose
comments explaining why the code is the way it is, and they are genuine documentation
— fewer than 25 lines in the whole area are commented-out code. The actual code is
13,839 lines, and for a feature that carries tracked changes, two seats, rounds,
internal review, a desk, a separate phone shell, two languages and a server that
enforces all of it independently, that is roughly the right order of magnitude. The
model/view split is real: the negotiation model file contains zero markup. The single
worst class of bug this codebase has suffered — a cross-module function that was never
exported and silently drew nothing for a year — is now clean everywhere I checked.
Test coverage for this area is about 0.9 lines of test per line of code, which is
strong.

The problem is not volume, it is **concentration**. One file holds 11,197 lines and
five different jobs. Five functions are over 400 lines each. One function of 985 lines
wires every interactive control on the page. And the deliberate duplication the
rulebook sanctions — two card renderers — has quietly stopped being parallel: one of
them has three features the other never received. That last one is a live defect, not
a style opinion, and it is the finding that costs you money today.

---

## The numbers

### Lines, by file

| File | Total | Code | Comment | Blank |
|---|---:|---:|---:|---:|
| js/views/negotiation.js | 11,197 | 5,980 | 4,985 | 232 |
| js/views/portal.js | 3,589 | 2,291 | 1,258 | 40 |
| js/negotiation.js | 3,096 | 1,592 | 1,425 | 79 |
| js/review.js | 1,791 | 1,025 | 708 | 58 |
| js/desk.js | 1,277 | 790 | 452 | 35 |
| js/redline.js | 941 | 501 | 412 | 28 |
| js/clausemodel.js | 878 | 484 | 365 | 29 |
| js/mobile-contract.js | 640 | 473 | 134 | 33 |
| js/playbook.js | 536 | 374 | 145 | 17 |
| js/discuss.js | 410 | 257 | 143 | 10 |
| js/mobile-portal.js | 139 | 72 | 56 | 11 |
| **Total** | **24,494** | **13,839** | **10,083** | **572** |

Server-side negotiation guards live inside `server/server.js` (8,274 lines total, of
which the negotiation/share routes and their read-only predicates are a minority
share). `index.html` carries 2,149 lines of CSS, some of it for this area.

### Comment character

The comment ratio (41% of all lines) looks alarming and is not. Classified:

| File | Prose comments | Commented-out code |
|---|---:|---:|
| js/views/negotiation.js | 4,967 | 18 |
| js/negotiation.js | 1,421 | 4 |
| js/review.js | 707 | 1 |
| js/views/portal.js | 1,256 | 2 |

Even the 25 "code-like" hits are mostly prose sentences that happen to end in a
semicolon-like character. **There is effectively no commented-out code in this area.**
The comments are design rationale in the house style, and they are the reason a new
reader can work here at all.

### The ten longest functions

| Lines | Function | Location |
|---:|---|---|
| 1,265 | redlineLayoutCss | js/views/negotiation.js:5625 |
| 985 | wireNegotiationTab | js/views/negotiation.js:4182 |
| 926 | negoStyleHtml | js/views/negotiation.js:161 |
| 666 | renderRedline | js/views/negotiation.js:7086 |
| 459 | redlineChangeCardsHtml | js/views/negotiation.js:10025 |
| 339 | rlAiPropose | js/views/negotiation.js:7983 |
| 328 | redlineDocHtml | js/views/negotiation.js:9032 |
| 268 | negoLiveCardsHtml | js/views/negotiation.js:1904 |
| 263 | negoDocHtml | js/views/negotiation.js:1566 |
| 247 | negoFileChange | js/negotiation.js:965 |

Functions ≥60 lines: **57**. Functions ≥200 lines: **12**. Functions ≥400 lines: **5**.
Lines sitting inside functions of 200+ lines: **6,178 — about 45% of all code in the
area.**

### Markup vs logic

| File | Code lines | Inside template strings | Share |
|---|---:|---:|---:|
| js/views/negotiation.js | 5,980 | 2,222 | 37% |
| js/views/portal.js | 2,291 | 724 | 32% |
| js/review.js | 1,025 | 142 | 14% |
| js/desk.js | 790 | 113 | 14% |
| js/negotiation.js | 1,592 | 0 | 0% |

The model file containing zero markup is the single healthiest signal in this audit.
The layering the rulebook claims exists actually exists.

Separately, **2,191 lines are CSS written inside JavaScript template strings**
(`redlineLayoutCss` 1,265 + `negoStyleHtml` 926) — 16% of all code in scope. The two
blocks are not duplicates of each other: they share exactly one selector (`.nego-doc`)
out of 86 and 15 respectively.

### Test coverage

| | Lines |
|---|---:|
| Node tests specifically covering this area (23 files) | 9,879 |
| Browser verifies covering this area (6 files) | 2,424 |
| **Total test lines for this area** | **12,303** |
| Whole suite, for reference | 49,742 node + 7,472 browser |

Roughly **0.89 lines of test per line of production code** in this area.

### Blast radius

Files touched per commit, last 30 commits in this area: median **5**, typical range
3–8, with one outlier at 26 ("Naming the signers opens signing"). Three recent real
changes:

- *"The send moves onto the card the decision was made on"* — 6 files.
- *"The counterparty's send becomes a button they can see"* — 4 files.
- *"Both sides sign, and the route shuts at the first signature"* — 6 files.

A 5-file median for a feature spanning two shells, two seats and a server is
defensible. It is not the runaway number I expected from an 11,000-line file.

### Duplication

| Pattern | Deliberate? |
|---|---|
| Two card renderers (redlineChangeCardsHtml / negoLiveCardsHtml) | Sanctioned by the rulebook — **but they have drifted. See Finding 1.** |
| Two pending-change document renderers (negoDocHtml / redlineDocHtml) | Sanctioned; both still carry the formatting-only branch. |
| Server repeating the browser's arithmetic (rvUnsentOurs vs negoUnsentAsks) | Sanctioned and correct — the server must not trust the request body. |
| Three CSS blocks (negoStyleHtml, redlineLayoutCss, portalWorkbenchStyle) | Not duplicated content; **but three homes plus index.html is a hazard. See Finding 3.** |
| `negoUnsentAsks` called by 9+ readers with no reimplementation | The good pattern. One arithmetic, many readers. |

---

## Findings, ranked by what they cost you

### 1. The two card renderers have stopped being twins — **live defect**

The rulebook sanctions two card renderers and requires that a card fix land in both.
They still share the *rules* (both call `reviewVerbsHtml`, `reviewChipHtml`,
`rlActorHeld`, `rlMyCardIds`, `deskCardInsteadHtml`), which is the healthy half. But
three features exist on the workbench renderer only:

| Feature | redlineChangeCardsHtml | negoLiveCardsHtml |
|---|---|---|
| Cards collapse/expand (`rlCardIsOpen`, `.rl-card-head`) | yes | **no** |
| Mine / Theirs / All author filter (`rlCardFilterPass`) | yes | **no** |
| Shared notes builder (`rlCardNotesHtml`) | yes | **no — inlines its own composer** |
| Hidden-from check (`rlHiddenFrom`) | yes | **no** |

So "cards are shut until somebody opens them" — a rule stated unconditionally in the
rulebook — is true on one screen and false on the other. Same for the author filter.
And because the second renderer builds its own notes composer inline instead of calling
the shared one, every future change to note behaviour has to be made twice by hand,
with nothing to catch it when it isn't.

**Cost today:** the two Negotiate surfaces behave differently, and the difference is
invisible until a user finds it. **Cost tomorrow:** the pending work order to make
cards collapse from their header will be built against the renderer that already has
collapse, and will silently miss the one that doesn't.

**Size of fix:** moderate — make the second renderer call the shared card-shell
helpers rather than hand-rolling. **Risk:** medium; it moves pixels on a live screen,
so it needs browser verification on both surfaces and the phone.

### 2. `wireNegotiationTab` is 985 lines wiring every control on the page

One function owns every listener on the Negotiate tab. The rulebook already records the
failure mode this invites — handlers stacking because a wiring function re-runs on tab
change — and notes a specific control that had to be moved to a different wiring
function to escape it.

**Cost today:** this is the highest-risk edit surface in the area. Any change to it
risks a listener that fires twice or not at all, and those bugs do not show up in
tests that press buttons in jsdom. **Size of fix:** large, and it is the kind of
refactor that buys nothing visible. **Risk:** high.

**Recommendation: do not refactor this wholesale.** Split off one coherent group of
listeners at a time, only when you are already editing that group for another reason.

### 3. Styling has four homes and no rule about which one to use

2,191 lines of CSS live inside JavaScript template strings, 2,149 more live in
`index.html`, and a third smaller block sits in the portal view. Nothing states which
home a new class belongs in.

This has already cost you once: the rulebook records a class (`ui-input`) that was
written into markup but never defined anywhere, and a test (f175) exists specifically
to check that a set of dialog classes are present in `index.html`. **A test whose job
is to check that CSS exists is a symptom of not knowing where CSS lives.**

**Cost today:** low but recurring — occasional unstyled elements, and a slow decision
every time someone adds a class. **Size of fix:** small if you only write down the
rule; large if you actually relocate the CSS. **Risk:** relocating is deceptively
risky because load order and specificity change.

**Recommendation: write the rule down, don't move the CSS.** One line in the rulebook
saying which home wins would have prevented the `ui-input` bug at zero risk.

### 4. `js/views/negotiation.js` is one file doing five jobs

11,197 lines holding: two CSS blocks, the contract-tab Negotiate pane, the full-window
workbench, both card renderers, both document renderers, the selection menu and AI
proposal flow, and the page wiring. There is no correctness problem here — but it is
the reason finding 1 was able to happen unnoticed. Two functions that must stay in step
sit 8,000 lines apart.

**Cost today:** moderate, and it is mostly paid in attention rather than bugs. **Size
of fix:** large. **Risk:** high, for no user-visible gain.

**Recommendation: split only along the seam that finding 1 exposes** — put the two card
renderers and their shared shell in one file together, so drift between them is visible
in one screen. Leave the rest.

### 5. Nothing is dead

I checked every feature the rulebook records as removed. Doc Lab: gone from code,
surviving only in four explanatory comments. `redlineDiscussionHtml`: zero hits, fully
removed. Region flag buttons: gone, and the function that remains (`setRegion`) is live
and called from four places for the Settings market selector — the rulebook's wording
that "setRegion mentions are stale" is slightly imprecise, since the buttons are stale
but the function is not. That is a documentation nit, not a code finding.

Export hygiene is clean. I specifically re-checked `rlPaperFootHtml`, the function
whose missing export drew a placeholder for a year: it is now exported, the call site
still guards defensively, and a browser verify pins it.

---

## If I had one day

1. Fix finding 1 — bring the contract-tab card renderer onto the shared card shell, and
   verify both surfaces plus the phone in a real browser. This is the only finding that
   is costing users something right now.
2. Write down the CSS-home rule (finding 3). Fifteen minutes, prevents a recurring bug
   class.
3. Add one test that asserts the two card renderers offer the same feature set, so
   finding 1 cannot silently recur.

## What I would leave alone forever

- **The comments.** 10,000 lines of rationale is not bloat here; it is the only reason
  the deliberate weirdness is safe to work near. Deleting them would be the single most
  destructive change available.
- **`wireNegotiationTab` as a wholesale refactor.** High risk, invisible reward.
- **The sanctioned duplication** — two document renderers, the server repeating the
  browser's arithmetic. Both are recorded decisions with failures behind them.
- **The CSS's physical location.** Write the rule; don't move the files.

## What I was unsure about, or could not measure

- **The server share.** `server/server.js` is 8,274 lines and I did not cleanly isolate
  which of those belong to negotiation versus everything else, so the server is under-
  represented in the totals above. The real in-scope figure is somewhat higher than
  24,494.
- **Function-length figures are approximate.** They come from brace-depth counting,
  which slightly over-measures functions containing large template strings, and
  under-counts nested helper functions defined inside larger ones.
- **Whether the card-renderer drift is deliberate.** The rulebook states the collapse
  rule and the filter rule without qualifying them to one surface, so I have read the
  drift as accidental. It is possible someone decided the contract-tab card should stay
  always-open and simply did not write it down. **That question should go to the owner
  before the fix is built.**
- **Runtime behaviour.** This audit read code and ran no browser. Everything above is a
  claim about the source, not an observation of the running app.
