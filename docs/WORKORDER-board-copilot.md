# WORK ORDER — Copilot builds the Board, with precision

**Status: written 4 Oct 2026. NOT STARTED. Do not begin until the owner says go.**

**The owner's words, 4 Oct 2026:**

> "find Solutions to make the copilot smarter in how it works with the
> Dashboard. I want it to be able to build almost anything i need in the
> dashboard with precision"
>
> "Create a work order to build this overnight but do not start yet"

The seven solutions below are the owner's list, in the owner's order. Build
them in that order: each one stands on the one before. Part 8, added by the
owner the same day, is built LAST and stands on its own (the Negotiate page,
not the Board).

---

## Where things stand (read before touching anything)

- Read CLAUDE.md, then grep docs/MAP-HISTORY.md for these headings and read
  each section in full:
  - "THE BOARD ANSWERS THE QUESTION ASKED"
  - ""THIS" IS THE OPEN CHART, AND COPILOT PRESSES THE BOARD'S BUTTONS"
  - "READ, THEN ASK"
  - "THE RECIPE"
- What exists today (js/views/homeboard.js, js/views/intelligence.js,
  server/server.js):
  - A card's picture is `hbPlan(D)`: the dig's own defaults (`hbPlanBase`)
    plus the reader's presses (`s.recipe[key]`, written ONLY by
    `hbRecipeSet`), made drawable (`hbPlanFix`).
  - A recipe has one split, one of six measures (`HB_MEASURES`), one of seven
    pictures (`HB_PICS`) and a trend switch.
  - Questions are read free first: `hbFollowUp` changes the open chart,
    `hbParse` / `hbRecipeRead` make a new card.
  - Anything else goes to `/api/ai/graph`. On the board its prompt opens with
    `boardJob`, it carries `screen.board` (`hbBoardNow`), and it answers ONE
    `chart` with `target` open/new, applied by `hbBoardTakes`.
  - The server's chart word lists equal the board's (f483 pins them).
  - Kept cards are `view` panels (`hbAddView`, `hbViewPanelHtml`).
  - Readings: `hbReadSrc` / `hbReadBlockHtml`. Doors: `hbDigData` keys
    (`q:`, `qg:`, `qm:`, `qv:`, `qn:`, `ls`, `f:`, `st:` …).
- The free path must stay free. Today every question that HaTi can read
  costs nothing. That stays true after this work.

---

## The seven parts

### 1. One recipe language for every card

**Goal.** Every card is described by ONE short recipe. HaTi draws only from
it; Copilot only writes it; the dropdowns only edit it. This follows LIDA and
NL4DV: the question becomes a structured description, then a chart.

**The recipe (version 1):**

| part | what it holds |
|---|---|
| `which` | the set: the whole book, `igConditions` text (re-read every paint, as `q:` is today), or ids (as `ls` is today), plus the lens |
| `split` | up to TWO. Each is a date split `{by:'date', unit, date}` or a group (`HB_SPLIT_GROUPS`). The second split stacks or groups |
| `measure` | today's `HB_MEASURES`; sum or average as today |
| `pic` | today's `HB_PICS`, plus what two splits need: stacked bars, grouped columns, a heat grid |
| `sort` | by value, by count or by name; up or down |
| `top` | N, with the rest said as "N more", never dropped silently |
| `window` | a time window: from/to, or "last N months/quarters/years" |
| `compare` | against the previous period or the same period last year: two columns side by side, said in words |
| `title` | the card's own name; defaults to HaTi's crumb |

**How.**
- ONE cleaner `hbCardClean(spec)` decides what a valid recipe is. A mirror on
  the server cleans what the model writes. f483's equal-lists test is
  extended to every part.
- ONE planner `hbCardPlan(spec)` replaces the inside of `hbPlan`. Today's
  `hbPlanBase`/`hbPlanFix` rules (`hbUsefulGroup`, signed is the stage, the
  trend rules, money hidden folds to the ring) move into it unchanged.
- Today's `q:` cards, `s.recipe` entries and kept `view` panels are read into
  the new recipe when they load, so nothing the owner already has is lost.
  Stored records are never rewritten: they are read, not migrated.
- Every new picture keeps the house rules:
  - every bar, cell or column is a door (a new key kind for a two-split cell,
    e.g. `q2:`);
  - every number is HaTi's count;
  - axes use `hbAxisTop`;
  - `.hb-sv-*` on `--hb-*` only;
  - the reading (`hbReadSrc`) says what the new parts do (top N, window,
    compare).
- The dropdown row (`hbRecipeRowHtml`) gains the new parts. It writes the
  recipe through ONE writer that replaces `hbRecipeSet`.

**Tests.**
- New f484: cleaner, planner, every new picture's doors, top N said, window,
  compare.
- f448's phrase book must stay green. It is the pass mark.
- home-board-verify, read-then-ask-verify, board-answers-the-question-verify
  and this-is-the-open-chart-verify must stay green.
- A new browser check photographs each new picture in Dark and Light.

### 2. Give Copilot the Board's tools (the CopilotKit pattern)

**Goal.** Copilot acts through the board's own buttons, several in one
answer. "Build me a renewals dashboard" becomes four or five cards in one go.

**Tools:**
- `add_card(recipe)`
- `change_card(card, part-changes)`
- `remove_card(card)`
- `arrange(order, sizes)`
- `name_card(card, title)`
- `filter_board(which)` — the counting chip, i.e. the existing count lens

**How.**
- On the board, `/api/ai/graph` (or a new `/api/ai/board`, if that keeps the
  map's route clean) gives the model these tools instead of the single
  `chart` field. It returns a LIST of actions.
- ONE applier `hbBoardApply(actions)` does them in order, each through the
  writer a press uses:
  - cards are `view` panels holding a recipe;
  - arrange, name and remove reuse the panel writers.
- The panel's answer line lists what was done, in HaTi's words, then
  Copilot's own sentence.
- `hbBoardTakes` becomes a caller of `hbBoardApply`. It is not a second road.
- The map's own fields stay off the board, as today.

**Tests.**
- New f485: tools schema equals the browser's applier; every action uses a
  press's writer (source sweep); several actions apply in order.
- New browser check: a stubbed Copilot answer with five actions builds five
  cards.

### 3. A data guide for Copilot

**Goal.** Copilot picks fields that actually work.

**How.**
- ONE builder `hbDataGuide(lens)`. For every field a recipe can use, it gives:
  - what the field means;
  - how many contracts have it filled, as a count and a share. For example,
    "signing date: 29 of 47 signed have one";
  - the range for dates and money;
  - the top values for groups (at most 8, plus how many more);
  - the live / draft / signed split.
- It obeys `canViewValues` (no money for a reader who cannot see it) and
  `visibleFolders` (no stream the reader cannot see).
- It rides with every board question, beside `hbBoardNow`. It has a size cap,
  and the cap is said ("A CAP IS A FACT").
- The server clamps it, as `graphScreenSays` clamps the board.

**Tests.**
- f485 (or f486): the guide's counts equal the board's own counts for the
  same book; hidden money and streams never appear; the cap is said.

### 4. Check and repair (the LIDA pattern)

**Goal.** Nothing wrong reaches the board quietly.

**How.**
- ONE checker `hbCardCheck(recipe)` returns problems in plain words:
  - the set is empty;
  - the picture cannot show this split;
  - money is not shown to this reader;
  - there are too many groups to read;
  - the date it splits on is mostly empty (from the data guide);
  - a trend has no history;
  - a field is unknown.
- Before applying Copilot's actions, every card is checked. If any fail, the
  problems go back to Copilot ONCE, with the recipe that failed, for one
  automatic retry. The retry's cost is counted like any Copilot call, and the
  panel says that one retry ran.
- What still fails after the retry is NOT applied. It is said in ONE plain
  line in the panel's answer ("Could not add 'X': its date is empty for 40 of
  47 contracts"). Never a band (CLAUDE.md: NO NEW BANDS).
- The free reader's cards go through the same checker. They get no retry;
  they get the same plain line.

**Tests.**
- f486: each problem is found; a failing card is not applied; the retry is
  sent once and only once; the line is said.
- Browser check: a stub that fails then succeeds; a stub that fails twice.

### 5. Preview big builds, and one-press undo

**Goal.** A big build is the owner's choice. Any change can be taken back.

**How.**
- **Preview.** When one answer would add two or more cards, or remove any,
  the panel's answer shows them as a list with ticks: "Add all" or "Add
  chosen". Nothing is applied until pressed. This lives in the panel answer,
  not a band and not a dialog: the cheapest channel that carries the act.
- A single change (one card, or one change to the open card) applies at once,
  as today.
- **Undo.** ONE store `s.undo`: the last 10 board states (panels, path,
  recipes), written by ONE writer before every board change, whatever made
  it — a press, the free reader or Copilot.
  - Every panel answer that changed the board carries "Undo".
  - Ctrl/⌘+Z on the board undoes too.
  - The store is per person, in the board's own record, and is trimmed to 10;
    the trim is not said, since it holds only the reader's own past views.

**Tests.**
- f487: preview applies nothing until pressed; "Add chosen" adds only the
  ticked ones; undo restores exactly the state before, for every kind of
  change.
- Browser check: build five, untick two, add; undo; refresh keeps the board
  (the owner's refresh rule).

### 6. Choices when a question is unclear (the NL4DV pattern)

**Goal.** The board shows two or three buttons instead of guessing.

**How.**
- Copilot may answer `ask`: up to three recipes, each with a short label.
- The free reader may offer choices too, where its own words are ambiguous:
  - "by month" with no date named → end · signed · created;
  - "value" → contract value · value bands;
  - two counterparties match one word.
- The panel draws them with the map's own choice buttons (`choices`, as
  `intelGraphApply` does today), never a new control. A press applies that
  recipe through `hbBoardApply` and can be undone.

**Tests.**
- f488: each listed ambiguity offers its choices; a press applies exactly
  that recipe; a clear question offers none.

### 7. Measure precision

**Goal.** A hit rate everyone can see, kept from slipping.

**How.**
- A test book of about 100 requests in the owner's style, each with the
  recipe it must produce: `test/board-precision-book.json`.
  - Sources: f448's phrase book, the 25 questions of the 4 Oct review (kept in
    MAP-HISTORY), the owner's screenshots' questions, and new ones for every
    part above.
  - Each request is tagged "free" (HaTi must read it without Copilot) or
    "copilot".
- **Free half.** A unit test (f489) runs on every change. The pass mark is
  the agreed hit rate, starting at what it measures on day one, and it may
  only go up.
- **Copilot half.** A script, `npm run eval:board`, runs only when a Copilot
  key is present. It sends each request to the real route, compares the
  recipe that comes back and writes a dated report to docs/
  (`BOARD-PRECISION.md`): the hit rate and every miss with what came back.
  - CI does not run it, since there is no key in CI.
  - The overnight run runs it once before Part 1 and once at the end, so the
    owner sees before and after.

### 8. One door for edits: risks open in Edit with Copilot, without duplicates

**Added by the owner, 4 Oct 2026:** "Add this as the last part of the
overnight work order and merge all to main once completed".

- **Source.** The owner's proposal page "One door for edits" (Artifact
  https://claude.ai/artifact/UuMeJdpX7MdbQcDi3PwtkZ). Open it, and walk its
  eight screens, before building:
  1. The list
  2. Covered fold
  3. Edit with Copilot
  4. Note after Save
  5. A new clause
  6. Last risk done
  7. Risk View
  8. Safety net
- **Base.** It builds on what is live since PR #124, "Risks to look at" in the
  Redlines card:
  - js/risks.js;
  - Risk View on the Document tab;
  - the Overview's "Risks found" tile (`tri_t_risk`);
  - keys `rk_*`.
- **Before building**, grep docs/MAP-HISTORY.md for "Risks to look at" and
  for "THE CLAUSE EDITOR", and read both sections. This part touches the
  clause editor (js/views/clauseeditor.js) and its funnel rule: it FILES
  THROUGH `negoEditClause` AND NOTHING ELSE (f245).

**The owner's three decisions:**
1. **Already covered.** A risk on a topic Our standards already checked, or on
   a clause we already redlined, leaves the list. It waits in "Covered by
   your redlines (n)", each line linking to the redline that covers it. It is
   counted nowhere. Discard that redline and the risk comes back by itself.
2. **The right place.** "Missing governing law" when clause 33 Governing Law
   exists changes clause 33; it never adds a second one. If that clause
   already has our redline, the edit goes on top of it: one redline, never
   two. A new clause never goes after Signatures, Execution, Signed by or In
   witness.
3. **One door for edits.** "Edit with Copilot" on a risk opens the Edit with
   Copilot window, the same one the pencil opens. The risk sits in its own
   rail tab with Copilot's wording already in the box. Save, then Next risk,
   all inside the window. The Redlines card only lists risks. Risk View only
   offers Add a note.

#### A. Duplicates between the risk scan and Our standards

1. **Already covered.** Before a risk is listed, HaTi asks whether it is
   already being handled. It is covered when (a) Our standards checked the
   same topic on this contract, or (b) we already have a redline on the
   clause the risk is about.
   - "Same topic" uses the clause types the standards already use to match
     clauses (governing law, liability, payment, confidentiality …).
   - The risk's title and the clause it points at are read the same way.
2. **Where a covered risk goes.** Into a fold under the list, "Covered by
   your redlines (n)", each line linking to the redline that covers it.
   - Not counted in "Risks to look at", the Overview "Risks found" tile or the
     room's Copilot number.
   - Skipped by Next.
   - Comes back by itself when that redline is discarded.
3. **Change the clause that is there.** A "missing clause" risk on a contract
   that already has a clause of that type changes that clause (e.g. 33
   Governing Law), never adds a second one. If that clause already carries
   our redline, the Copilot draft builds on top of it: one redline per
   clause.
4. **Never after the signatures.** A new clause is added only when no clause
   of that type exists, and always before Signatures / Execution / Signed by /
   In witness.
5. **Safety net at Save.** About to file a second redline of ours on a clause
   that already has one, HaTi stops: "Clause 33 already has your redline
   CHG-001", with Open CHG-001 / Cancel. This is a dialog because it is a
   decision that cannot proceed (the SAP rule), and the owner chose it.
6. **Known limit.** A risk whose title matches no known clause type is not
   treated as covered and stays listed (the safe direction). The safety net
   catches the rest.

#### B. One door for edits: risks are edited in Edit with Copilot

1. **Redlines card.** Risk rows only list: Add a note · Dismiss · Edit with
   Copilot. The in-card drafting (open row, wording, Where it goes, Add to
   redlines) is removed.
2. **Edit with Copilot opens on the risk.** The same window the pencil opens.
   A new rail tab, **Risks (n)**, sits beside Playbook scan. It shows:
   - "Risk k of n" with progress;
   - the risk card (what it says, why it matters, suggested fix);
   - Copilot's wording already in the box as tracked changes (one Copilot
     call on arrival, said).
3. **Ask Copilot for a better clause.** Under the risk card:
   - quick asks: Make it firmer · Give me a softer version · Shorter · What
     does our playbook say?;
   - a typing box with Send.
   Each ask is one Copilot call and redrafts the box; nothing is saved until
   Save. With no key, say so and let the reader write it.
4. **Moving through.** The foot reads ‹ Previous · Skip · Save to CHG-xxx &
   next ›.
   - Covered and dismissed risks are skipped.
   - After the last: "That was the last risk", with what was saved, skipped
     and covered, nothing sent, and Back to Redlines.
5. **A new clause.** The window holds the new clause where it will go (Where
   it goes, an editable heading). *To confirm while building:* the window
   today edits existing clauses only. If holding a new one is a big change,
   STOP this item and write it under "Waiting on the owner"; do not build
   around it.
6. **The note, as today.** Save opens the same Notes drawer that opens after
   saving from the pencil, pinned to the redline just filed ("CHG-007
   filed", what moved, Internal lit / the other side). Add note or Skip, then
   the next risk opens. No note box inside the panel.
7. **Risk View.** "Draft a redline" is removed; only "Add a note" stays.

#### C. Unchanged

- Dismiss / Show dismissed / Bring back; Re-scan; "Risk scan not run yet ·
  Run it"; the Overview "Risks found" tile; "Draft from our standards".
- Nothing is ever sent by itself. Every Save files an unsent redline through
  the same route a person's own edit uses (`negoEditClause` /
  `negoInsertClause`, the funnel). A risk redline's provenance never reaches
  the other side.

#### D. Tests to add or re-point

- A risk on a topic Our standards checked, and a risk on a clause we already
  redlined, are both "covered": not counted, in the fold, back when the
  redline is discarded.
- "Missing governing law" on a contract with a Governing Law clause targets
  that clause; a new clause never lands after a Signatures heading.
- Edit with Copilot opens on a risk with the Risks tab; Save & next files one
  unsent redline, opens the Notes drawer, then the next risk; Skip files
  nothing.
- The safety net stops a second redline on one clause.
- Risk View draws no "Draft a redline"; the Redlines card draws no in-card
  drafting.
- Plus the house's own: f245's funnel grep stays green; each new check is red
  at unmodified main; the eight screens are photographed in a browser check
  (one-door-for-edits-verify) and the photos read.

---

## How to run the night (house rules, unchanged)

- One branch: the session's designated branch. Commit after each part, with
  that part's own tests green.
- Before code in each part: the Six Questions (CLAUDE.md). Only a refusal
  goes to the owner. If one bites, STOP that part, write the question at the
  end of this file under "Waiting on the owner", and carry on with the next
  part only if it does not depend on it.
- `npm run lint` first, zero errors.
- Every new check runs against a worktree at unmodified main and must be red
  there.
- Photograph every new picture and every new answer line; read the photos.
- A separate problem found on the way: one BUGLOG line, never a fix.
- MAP: at most four lines per part in CLAUDE.md. The story goes to
  MAP-HISTORY. Keep CLAUDE.md under 80 KB.
- New features are named in `BRAIN_PARTS` and placed in a flow (f458).
- Full suite ONCE at the end. Then MERGE EVERYTHING TO MAIN (the owner's
  words: "merge all to main once completed"): one PR, merged only when
  green, with this file's status line changed to DONE and the morning
  summary below filled in. If a part stopped on an owner question, merge
  what is finished and green, and say what waits.

## The morning summary (fill in at the end)

In simple English, for the owner:
- what was built, part by part;
- the precision report, before → after;
- anything not built, and why;
- anything waiting on the owner;
- the cost of the overnight Copilot calls (from `agent_runs` / the spend
  page).

## Waiting on the owner

- **Open chart language (not in this order).** On 4 Oct the owner was offered
  a second road for requests beyond the recipe: Copilot describes any chart
  in an open chart language (Vega-Lite style) over HaTi's own data, and HaTi
  checks and draws it. The owner's list does not include it, so it is NOT
  built here. Ask before adding it.
