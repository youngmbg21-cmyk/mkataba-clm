# WORK ORDER — three off a desktop sitting, 28 Aug 2026

**Raised by:** Young, 28 Aug 2026, in one message with one screenshot — the
Insights → Portfolio *What needs attention* card, its pager ringed in red.

**Branch this was filed on:** `claude/desktop-layout-ui-bugs-n4p7ha`.

**Status: NOT BUILT.** Filed for a later job on the owner's own instruction —
*"Review all these and save these for a later work job."* **Nothing in the
product was changed.** Every finding below is read off the source and is quoted
with its file so the next person can check it rather than take it on trust.

**Two of the three carry a warning and both are at the top rather than buried.**
Item 1 asks for something that **reverses a decision the owner approved on
22 Aug 2026**, so it needs a ruling before anybody types. Item 2 **could not be
reproduced from the code**, and what was found says the obvious explanation is
probably the wrong one — it must be watched happening before it is touched.

---

## The plain-English version, for the owner

Three things, and they are three different kinds of problem.

**1 — Screens do not use a big monitor.** You are right, and here is why.
Almost every page in HaTi has a maximum width written into it. On a laptop the
window is narrower than that limit, so you never meet it. On a desktop the
window is wider, so the page stops growing and the rest of the screen turns into
white space either side. **The Portfolio page is the one page in the product
with no limit at all**, which is exactly why it is the one that looks right to
you. So this is not a bug in one screen — it is one decision, taken about a
dozen times, that a later job has to take once. And one of the limits you are
pointing at is one **you chose yourself on 22 Aug**, so we should agree what
replaces it before anybody starts.

**2 — The redline losing its marks when you press Edit.** I could not make this
happen by reading the code, and I found something that suggests it is not what
it looks like. The setting behind *Redlined / As agreed / With changes* can only
be changed by pressing one of those three words — nothing else anywhere in the
product touches it. So the tab has almost certainly **not** moved. What is far
more likely is that turning editing on takes the marks off **the one clause you
are editing**, which from where you are sitting looks exactly the same. That is
a different fix in a different place, so whoever picks this up has to watch it
happen once before changing anything.

**3 — The page jumping to the top.** Proven, and it is bigger than the button
you ringed. **Every filter on that page has the same fault**, not just the
pager. And there is already a helper in the app written to stop exactly this
from happening — nothing in the product calls it.

---

## 1 — A DESKTOP GETS A LAPTOP'S PAGE

> *"Many pages in the app shrink when I am in a desktop which does not give me
> the same view as when I am on a laptop. Can is when in documents page it looks
> great but when I am in the negotiation screen the the contract shrinks. Review
> this ACROSS the platform and ensure that even when on desktop I am getting a
> full screen experience like in the Portfolio page."*

### What is actually there — measured off the source

Page-level width caps, as written today:

| Where | Cap | Written at |
| --- | --- | --- |
| The contract sheet on the negotiation page | **860px** | `js/views/negotiation-css.js` — `.redline-page .rl-paper{…max-width:860px}` |
| The contract sheet on the Document tab | **860px** | `js/views/contract.js` — `const COL='width:100%;max-width:860px;…'` |
| Key terms · Signing · History | **1440px** | `--room-measure` in `index.html`, read by `.terms-grid`, `.sign-grid`, `#ws-history-pane` |
| The Negotiations list | **900px** | `.ngl-wrap` in `index.html` |
| People directory, template library, the counterparty's page | **860px** | their own view files |
| Insights → Negotiation friction (left column) | **78ch** | `js/views/intelligence.js` |
| **Insights → Portfolio** | **none** | `portfolioFrameHtml` sets no page width at all |

**THAT LAST ROW IS THE WHOLE REPORT.** The owner's reference page is the one
page that never had a cap. Nothing is broken; a dozen separate decisions simply
do not agree with each other, and none of them shows on a laptop.

### The one thing to be careful of, and it is the reason this is not a quick fix

**The negotiation page's 860 is an owner-approved decision from 22 Aug 2026 and
it is written down with its reasoning** (CLAUDE.md, *THE NEGOTIATION PAGE TAKES
THE MOCK-UP*, and the long note above `rlLayoutResizer`). The working area on
that page already runs the page's full width — that was fixed the same day, off
a report that the cards were leaving a dead strip on the right. What was
deliberately kept is that **the SHEET centres inside its track at
`RL_SHEET_MAX`**, on the argument that *a line of an agreement has a length past
which it stops being readable*, which is what a document reader looks like
anyway.

So the owner is asking to reverse that, and **the reversal has a real cost that
must be put to them in one sentence before it is built**: on a 2560px monitor an
uncapped sheet gives a line of contract wording roughly 1,900 pixels long, which
is about 200 characters — two and a half times what typography considers
readable, and about three times what the printed contract will be.

**THERE ARE THREE HONEST ANSWERS AND THE OWNER PICKS ONE**, per page or across
the platform:

1. **Uncap the CHROME, keep the PAPER.** Every page of the product — lists,
   cards, panels, settings — fills the monitor; the contract sheet alone keeps a
   readable measure. This is what most contract software does and it is the
   cheapest to build, because it touches no document renderer.
2. **Raise the cap rather than remove it.** One number for the whole platform
   (`--page-measure`), somewhere around 1440–1600, replacing the twelve
   different numbers above. Nothing fills a 4K monitor but nothing looks lost on
   a 27-inch one either.
3. **Uncap everything, paper included.** What was literally asked for. Say the
   line-length cost out loud first.

### Notes for whoever builds it

- **THE TWO SHEETS ARE ALREADY THE SAME NUMBER (860), so "documents looks great
  and negotiation shrinks" is NOT explained by the caps and must be measured on
  the owner's own screen before a number is changed.** The likeliest reading is
  that the negotiation page's sheet sits in a track that also holds a 460px card
  column, so it is offset and surrounded by more visible dead space — the same
  cap reading as a smaller page. **Get a screenshot at the owner's real
  resolution with a ruler on it.** This rulebook's own standing rule applies:
  *measure before you fix, even when the report is your own.*
- **`--room-measure` (1440) IS THE PRECEDENT TO FOLLOW, not to add to.** It was
  introduced on 25 Aug for exactly this problem on the contract room's four
  tabs, whose three different caps made one contract read as three
  differently-sized pages. Whatever number wins should be **one token every page
  reads**, so the next retune is one line.
- **DO NOT SWEEP THE COUNTERPARTY'S PAGE IN PASSING.** `js/views/portal.js`
  carries the same 860 in three places, and that page is read by people outside
  the building on unknown screens. It is its own decision and it is not in this
  ask.
- **NOR THE STANDALONE DOCUMENTS.** `js/views/healthreport.js` and
  `js/views/weekly.js` open their own windows and carry no `:root`, so a token
  there resolves to nothing.
- **THE SIX QUESTIONS APPLY** (CLAUDE.md), and question 3 in particular: measure
  the pixels above the first line of the agreement before and after on every
  screen that draws it.
- **NETS:** `pages-read-alike-verify` is the file that already sweeps every page
  and compares them to each other, so the claim belongs there written as a
  RELATION (every page reads one measure) rather than as a number.
  `laptops-verify` must stay green — whatever is done for the desktop may not
  cost the laptop anything.

---

## 2 — THE REDLINE PAGE SHOWING CLEAN TEXT AFTER PRESSING EDIT

> *"Redline page, should always show you the redline. Currently while on the
> page and click the edit button it changes to as agreed even though you have
> not moved to the as agreed page."*

### DO NOT START BY CHANGING THE READING. Here is why

The reading — *Redlined / As agreed / With changes* — is one value, `_rlRead` in
`js/views/negotiation.js`. **It has exactly two writers in the entire product**,
and this was swept rather than assumed:

- `rlSetReadMode(v)`, which is only ever called from a press of an element
  carrying `data-rl-read` (the three tabs themselves, and the "back to redlined"
  button on the reading band); and
- `negoResetView()`, which resets it to `'marks'` when the page is left.

The tabs are drawn from `rlReadMode()` at every paint (`rlReadSegsHtml`) and
repainted from it by `rlPaintReadSegs`, so **the tab cannot say one thing while
the value says another.** No Edit control anywhere writes to it.

**So the reading almost certainly did not move, and the fault is in what the
PAPER draws when editing turns on.** Two candidates, and they are the same
complaint in two different places:

**(a) The clause editor page** (`js/views/clauseeditor.js`). Pressing the pencil
flips `_ceEditing`, and `ceRenderPaper` then draws that one clause as plain
LINES so it can be typed into — no marks, by design, because a clause carries
one sub-paragraph per line and that is what gets read back at filing time. Every
other clause keeps its marks. **On a contract where the clause being edited is
the only changed one, the whole document then reads as clean** — which is
precisely "it changes to as agreed".

**(b) The negotiation page's own inline clause editor** (`data-nego-edit`). It
replaces the clause with an editable box seeded from `negoClauseNowById` — "what
stands", i.e. the wording with adopted changes folded in. That is *literally* the
As-agreed reading of that clause, drawn while the tab says Redlined.

### What to do, in this order

1. **REPRODUCE IT AND SAY WHICH BUTTON.** There are at least three "Edit"
   controls in play — the pencil on a clause, the `Edit` verb on a tracked-change
   row, and the pencil inside the clause editor page. Get the owner to point at
   the one they pressed, and note whether the **tab** moved or only the
   **document**. Those are two different bugs.
2. **If the tab did not move** (expected), the question is not "why did the
   reading change" but **"should turning editing on take the marks off the clause
   at all, and if it must, what says so?"** The product already has the shape of
   an answer: the reading band (`rlReadNoticeHtml`) exists to stop a document
   silently disagreeing with the control above it. A one-line note beside the
   clause being typed in — *you are editing this clause; its marks are off while
   you type* — is the cheap fix and needs no renderer change.
3. **If the tab really did move**, then something is dispatching a press on a
   `data-rl-read` element, and the two delegated listeners are where to look:
   `js/views/negotiation.js` (on `document`) and `js/views/clauseeditor.js`
   (which stops propagation deliberately so the first does not fire twice).
   **That stopPropagation is load-bearing — do not remove it.**

### Notes for whoever builds it

- **THE READING IS THE PRODUCT'S, NOT ONE PAGE'S.** Three surfaces draw it — the
  negotiation page, the clause editor page and the counterparty's header. A fix
  that gives one of them a private copy is how they come to disagree about what
  "As agreed" means, which is the fault the one-builder rule exists for.
- **`ceEditableReading()` IS THE ONE PREDICATE** for "does this reading allow
  editing", and it is asked by the pencil, the caret and Apply. Anything added
  here asks it too rather than testing the mode again.
- **NETS:** `clause-editor-verify` section 12 already drives the three readings
  and the pencil for real; whatever this turns out to be belongs there.
  `redline-verify` sections 16 and 17 hold the reading-is-not-a-working-posture
  claims.

---

## 3 — A CONTROL INSIDE A PAGE THROWS THE READER TO THE TOP

> *"Image 1, when i click on the highlighted button the page jumps me to the top
> of the screen. Fix and make a rule that and in any other area where this is an
> issue."*

**This one is proven from the source and it is wider than the button in the
screenshot.**

### The cause

The pager under *What needs attention* calls `renderIntel()`
(`js/views/portfolio.js`, the `[data-pf-find-page]` handler). `renderIntel`
rebuilds the whole Insights view, and replacing a scrolled container's contents
clamps its `scrollTop` to 0 on the intermediate paint. The reader is at the
bottom of a long page, presses `›`, and lands back at the top.

### It is not one button — it is every control on that page

`wirePortfolioFrame(rerender)` gives **every** filter on the Portfolio page the
same `again()`, and on Insights `again` **is** `renderIntel`. So the same jump
happens on:

- the pager (`data-pf-find-page`) — the reported one;
- the category filter (`data-pf-cat`);
- the counterparty filter (`data-pf-cp`);
- each un-filter chip (`data-pf-unfilter`) and *Clear* (`data-pf-clear`);
- the four Insights tabs (`data-ig-tab`, four separate bindings in
  `js/views/intelligence.js`);
- *Clear* on the friction filter (`ig-friction-clear`);
- *Today* on the calendar (`cal-today`, `js/views/calendar.js`).

### THE HELPER ALREADY EXISTS AND NOTHING CALLS IT

`keepScroll(fn)` is in `js/app.js`, does exactly this job, and is published on
`window`. **It has zero callers in the entire product** — swept; the only two
hits are its own definition and its export line.

That is this codebase's own most-repeated defect wearing its other face. The
`rlPaperFootHtml` family is a name that was never published and so was never
reached; this is a name that IS published and that **nobody ever reached for**.
Worth saying in the commit message, because `f232`'s sweep is built to catch the
first kind and cannot catch this one.

### The rule the owner asked for

**A PRESS THAT NAVIGATES MAY LAND AT THE TOP. A PRESS THAT FILTERS, PAGES,
SORTS OR TOGGLES MAY NOT MOVE THE READER'S PLACE.**

**This is not a new rule — it is an existing one that was never applied inside a
page.** `setView` has enforced it at the view level since it was written, in its
own words: *"Arriving on a DIFFERENT view starts the reader at the top;
re-entering the SAME view must leave them exactly where they were."* Every
in-page repaint is the same case, and each one currently re-decides it by
accident.

**How to make it hold, rather than trusting everybody to remember:**

- **ONE HELPER.** Every same-view repaint fired from a control goes through
  `keepScroll`. Never a second copy — the two-frame restore in it is there
  because the intermediate paint is shorter than the final one, and a hand-rolled
  version will get that wrong.
- **AT THE FUNNEL, NOT AT THE PRESS.** The Portfolio page has one `again()` and
  Insights has one `renderIntel` — wrap those, not the eleven handlers. Eleven
  wrapped presses is eleven places for the twelfth to be forgotten.
- **THE INNER SCROLLERS ARE A SEPARATE QUESTION AND MUST BE ASKED.** The
  findings list has its own scroller (`.pf-find-scroll`, capped at 392px). On a
  **pager** press it is right for that list to start at its top — it is a new
  page of rows. On a **filter** press it is arguable. Decide it once and write
  down which, or the two will drift.
- **THE NET.** A test that fails on a same-view repaint called from a click
  handler without `keepScroll`, in the shape `f232` already uses for its
  window-read sweep — the point being that a rule living in prose alone holds
  until the first person who does not read it, which is this rulebook's own
  recorded experience.
- **AND A BROWSER FILE, because only a browser can answer it.** Scroll the
  Insights page to the bottom, press `›`, read `#content-scroll.scrollTop` back.
  jsdom lays nothing out and will pass either way. Run it against the parent
  commit first and watch it report the jump, or it is a description rather than
  a test.

### Notes for whoever builds it

- **DO NOT SWEEP `js/views/settings.js`.** It writes `scrollTop=0` deliberately
  (`openSettingsAt`), because everything arriving through that function is a
  navigation with a name on it and landing at the bottom of a page you have just
  asked to be shown reads as a broken page. That is the rule agreeing with
  itself, not an exception to it.
- **DO NOT SWEEP THE SETTINGS PAGE'S PATCH-IN-PLACE RULE EITHER.** *THE SETTINGS
  PAGE HOLDS STILL* in CLAUDE.md is a stronger answer to the same problem —
  never re-render at all — and it stays.
- **`js/views/negotiation.js` ALREADY HAS ITS OWN** `_keepScroll` map and
  `rlRestoreScroll`, for the panes inside that page. That is a different job (many
  inner scrollers, not the page) and is not this.

---

## What was deliberately NOT done in this sitting

- **Nothing in the product was changed.** The owner asked for a review and a
  filing, and the Scope rules say do only what the request asks.
- **BUGLOG.md was not appended to.** These three items ARE the request rather
  than something noticed on the way past it, and this file is where the request
  lives.
- **No estimate is given.** Item 1 is a product decision before it is work, item
  2 has not been reproduced, and only item 3 is understood well enough to be
  sized honestly — it is small.
