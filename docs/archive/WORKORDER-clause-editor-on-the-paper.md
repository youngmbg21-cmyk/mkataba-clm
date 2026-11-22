# WORK ORDER — Edit with Copilot becomes the paper

**Raised by:** Young, 26 Aug 2026, over two rounds of drawing.
**Branch:** `claude/ui-text-dropdown-styling-j2nat5` (level with `origin/main`
at `e0c2ce2` as this was written).
**Approved design:** the artifact **Redline With Copilot** —
`https://claude.ai/code/artifact/877214ce-b253-40b3-9102-17f888923af0`.
The earlier side-by-side proposal (`44ac19aa…`) is SUPERSEDED and is kept only
as the record of a direction the owner looked at and did not take.
**Status:** **BUILT, 26 Aug 2026.** All three decisions were ruled first and are
recorded at the foot of this file in the owner's own words. The rulebook entry
is under EDIT WITH COPILOT IS A PAGE, NOT A DRAWER; what follows is the plan as
it was approved, kept because the reasoning is the useful part.

**WHAT THE BUILD FOUND THAT THE PLAN DID NOT.** Three things, each said out loud
rather than absorbed:
1. **The draft ignored the reading.** Phase 2 said the readings govern the
   document and Phase 3 said the draft is drawn from live ops; nobody joined
   them, so the one clause the reader was working on was the one clause that did
   not obey the tab they had just pressed. Caught by driving it.
2. **The marks had no colour.** `.nego-ins` / `.nego-del` read tokens declared on
   the negotiation room's own selectors, so on a page with no room around it the
   colour declaration was dropped and the redline came out in document ink.
   Clothes-follow-the-builder, one layer deeper than this plan looked.
3. **The acts had to stand down with the caret.** A band reading "This page is
   not editable" over a live Save is a page arguing with itself. Phase 4 said
   pencil and caret; it needed Apply, Undo, Discard and File too, which is one
   predicate rather than four.

---

## The plain-English version, for the owner

Today, pressing Edit with Copilot gives you a page with two stacked boxes — the
wording as it stands, and your proposed wording underneath. You asked for that
to go, and for the page to be the contract itself with Copilot beside it.

**Most of this is smaller than it looks.** The page already puts Copilot down
the right at full height; the clause head, the facts, the way out, the reason
step and the filing all stay exactly as they are. What changes is the middle:
two boxes become one contract.

**One part is genuinely new**, and it is the part to watch. The contract page
can show marks for changes that have been *filed*. It has never had to show
marks for wording you are *still typing*. That is the real work in this order,
and it is described below so nobody discovers it halfway through.

---

## WHAT MOVED ON MAIN SINCE THE DESIGN WAS DRAWN

Re-checked against `origin/main` before this order was adjusted, not assumed.
Nine commits landed. Five of them matter here:

1. **The WHOSE ASKS filter is retired** (owner-asked, 26 Aug). `rlIdxFilterHtml`
   is a stub with no caller. **Nothing in this order may reintroduce it**, and
   any older mock-up showing it is stale.
2. **The "N of M decided" row is deleted**; the progress bar stays. Not in this
   page, but it is the same morning's instinct and it sets the tone: the owner
   is taking rows OFF this product, not adding them.
3. **The "N not sent" strip is retired**, its act moved to the head's top-right
   slot. **This reverses the one exception NO NEW BANDS wrote down by name** —
   which is what made the band in this order a question rather than a given. It
   is ruled and recorded at the foot of this file, with both halves of the
   standing test answered.
4. **The clause pencil is hover-only and grey**, measured at 6.14:1 on the
   cream sheet, with focus, an open panel and `(hover:none)` keeping it
   reachable. The approved design draws exactly this, so **reuse
   `rlClauseEditPillHtml` and do not write a second pencil.**
5. **The card's coloured front edge is gone** while the owner weighs a better
   answer; `data-rl-origin` is still stamped. Nothing to do here — but it is
   why the tracked-changes column is mid-decision and should not be leaned on.

**One more thing landed and it is the sequencing risk:**
`WORKORDER-design-system-overnight.md` — an unattended run across type,
spacing, density, motion and accessibility. It has not run. It and this order
touch the same stylesheets.

---

## THE ONE HARD PROBLEM: AN UNFILED DRAFT ON THE PAPER

**State it before planning around it.** The contract page draws its marks from
**stored ops** — the change record's own, inside the fingerprint — and this
rulebook forbids re-diffing there in so many words: *"a mark drawn from a fresh
diff would not be the mark the other side verified."* Every mark you see on
that page belongs to a change that has been FILED.

The clause editor's whole point is the opposite: you type, and you see what
your typing would do, **before** anything is filed. `ceRedlineHtml` computes
that live, on every keystroke, against the wording as it stands.

So the page and the editor disagree about where a mark comes from, and this
change puts them in one place.

**THE GOOD NEWS, and it is what makes this affordable:** both already hand
their ops to **the same renderer**. `ceRedlineHtml` calls
`redlineOpsBlocksHtml`; so does the document canvas. Nothing new has to be
drawn — what is missing is a way to tell the canvas *"for this one clause, use
these ops instead of the stored ones."*

**THE SHAPE OF THE ANSWER, to be confirmed by measurement first:** the document
builder takes an optional live override for exactly one clause — the clause
being edited — and draws it through the renderer it already uses. Every other
clause on the page is untouched and still draws from the record.

**FOUR PROPERTIES THAT MUST HOLD, and each is a check:**

- **Nothing is re-diffed on a filed change.** The override reaches ONE clause,
  and only while the editor is open on it. A filed change's marks come from its
  own stored ops, exactly as today.
- **The override never persists.** It is what is on screen, not what is on the
  record. It dies with the editor and touches no contract.
- **The fingerprint is unaffected.** Filing still goes through `negoEditClause`
  and nothing about what is stored changes.
- **The counterparty's page cannot reach it.** They have no editor here; the
  refusal is already in place and must be asserted, not assumed.

---

## THE PHASES

Each is independently shippable and each ends green.

### Phase 1 — the middle of the page

Replace `.ce-left`'s two boxes with the contract canvas.

- The paper is `redlineDocHtml`'s output, in the sheet the negotiation page
  uses, scrolling inside its own column.
- **The head, the crumb, the facts, the acts, the reason step, the foot and the
  Copilot rail are untouched.** They are already inside the left column, which
  is what lets the rail run top to bottom — the source says so at the grid, and
  it is the one thing this layout was corrected for repeatedly. **Anything new
  that spans the whole page goes in the left column too.**
- `.ce-box`, `.ce-stands`, `.ce-prop`, `ce_as_it_stands` and `ce_proposed`
  become stale. Retire them the way this codebase retires things — a stub or a
  named removal, never a silent delete — because `ce_as_it_stands` and
  `ce_proposed` are dictionary keys in two languages.

### Phase 2 — the three readings

`.ce-seg` today offers **Redlines | Edit**. It becomes the product's own three:
**Redlined · As agreed · With changes**.

- **Use `rlReadSegsHtml`, the existing builder**, not a second control. It is
  already drawn in two homes and this is the third; the clothes follow the
  builder, which is a fault this page has paid for twice.
- **`Edit` disappears as a reading**, because editing is no longer a view of a
  box — it is what the paper does. Say this to the owner rather than letting
  them find it.

### Phase 3 — typing on the paper

The clause you came in on opens in edit state, in place.

- **One editor, not a second one.** The negotiation page's own clause editor is
  what opens; this rulebook already records "one editor, two homes" and this
  makes it three.
- Apply, Undo and Discard keep working exactly as they do — they move the
  wording, and the wording now lives on the paper.
- **The live override from the section above is what makes the marks appear.**

### Phase 4 — the two readings that are not Redlined

On **As agreed** and **With changes** the paper stands its editing down: no
pencil, no caret, nothing typeable.

**This is not a new rule.** The negotiation page already refuses the change
column on those two readings, for the reason that governs here too: those
readings hide the marks, so what you would be editing is not what is on the
record. Applying it to the paper is that rule reaching one more surface.

### Phase 5 — the yellow strip

On **As agreed** and **With changes**, above the paper: *"This page is not
editable — Back to Redlined"*, with the way back on the band. Owner-asked, in
those words, and recorded under the rulings at the foot of this file with the
standing band test answered.

- **It is `rlReadNoticeHtml`'s job, not a new builder.** That function said
  exactly this sentence on the negotiation page and is a `return ''` stub there
  since 24 Aug. Restore its body for THIS page only — the negotiation page's
  reasoning for retiring it (its tab row and greyed column say it twice) does
  not apply here and must not be undone.
- **The way back presses `data-rl-read`**, the reading tabs' own attribute, so
  it is the existing door and never a second one.
- It draws on **Redlined never**, so it cannot become furniture.

### Phase 6 — the queue rail: NOT BUILT

The reference screenshot carries **THIS ROUND'S QUEUE 1/4** down the left. The
owner has ruled it out for this page — *"Should not be in the edit page"* — so
nothing is built and nothing is left dormant. The strip stays on the
negotiation page, where a round is worked through. **Any future drawing showing
it here is stale.**

---

## WHAT MUST NOT BREAK

Each is already pinned; each needs re-pointing rather than deleting.

- **Filing goes through `negoEditClause` and nothing else.** f245 greps for a
  second path and must go on doing so.
- **The reason step is HaTi's own**, Skip included.
- **Every refusal that guards the door** — a frozen contract, a narrow window
  (under 1024px), the counterparty's seat, the desk rule.
- **Sub-paragraph lines survive**; a passage spanning two limbs is refused
  rather than run together.
- **Both languages.** Two keys retire and the readings arrive with their own.
- **The scan reports its own failure** — landed on main this week; untouched.

---

## THE NETS

- **f245** — sections 3 to 8 survive with re-pointed selectors. **Section 4 is
  the one that genuinely changes**: "the redline is computed, never scripted"
  becomes a claim about the override — computed for the clause being edited,
  read from the record for every other clause, and never written down.
- **clause-editor-verify (57)** — its two-box claims reverse in place. Add: one
  paper and no second box; the three readings really change what the paper
  draws; typing produces a live mark; the other two readings refuse the caret
  **as measured behaviour, not as a class**.
- **redline-verify (164), clause-door-verify (99), parity-verify (44)** — must
  stay green untouched. If any moves, the shared canvas has been changed rather
  than extended, which is the thing this order must not do.
- **theme-tokens-verify 40/40** — the cream sheet arrives on a page that had
  none, so the census WILL move. Audit it value by value and re-record in the
  same commit, per the standing rule.
- **The band is asserted BOTH WAYS, or it is half a net**: drawn on the two
  non-editable readings with a way back that really presses the reading tabs,
  and **absent on Redlined**. And the negotiation page's own retirement is
  re-asserted in the same run — restoring that builder's body must not put its
  band back where the owner took it from.
- **The queue rail is asserted ABSENT** on this page, as pixels and as a
  published name, so a later reader cannot bring it back through a door nobody
  remembered.

---

## RULED — 26 Aug 2026, IN THE OWNER'S OWN WORDS

> *"1: leave the bar. 2: Should not be in the edit page. 3: Your
> recommendation"*

**1 · The yellow strip STAYS.** *Leave the bar* is read as KEEP IT — it answers
a question whose recommendation was to keep it, and it is written down here in
that form so a later reader cannot take "leave" as "leave it out". So on the
two non-editable readings the paper carries the band the owner drew, in the
owner's own words: *"This page is not editable — Back to Redlined"*, with the
way back ON the band.

**IT IS AN OWNER-ASKED BAND AND IT PASSES BOTH HALVES OF THE STANDING TEST**,
which is what has to be recorded rather than assumed:

- *Does it say something the screen does not already say?* **Yes, and more so
  than when this was drawn.** The pencil that lets you edit a clause has been
  hover-only since 26 Aug — so on a reading that refuses editing, nothing on
  screen is missing that a reader could see was missing. Without the band the
  page simply does not respond, which reads as a fault rather than as a rule.
- *Is it about work owed or a promise made, and does it carry the act?*
  **Yes** — it says what this page will and will not do with what you type, and
  Back to Redlined is on the band.

**IT IS ALSO NOT A NEW BAND**, which settles the point that made this question
live: `rlReadNoticeHtml` already said exactly this on the negotiation page and
was retired there on 24 Aug because the tab row and the greyed column had come
to say it twice. Here there is no greyed column to say it — so this is that
notice reaching the one surface that still needs it, at the owner's word.

**2 · NO QUEUE RAIL on the edit page.** *"Should not be in the edit page."* The
round's reading order stays on the negotiation page, which is where a round is
worked through; this page is about one clause. **Phase 5 is therefore DELETED,
not deferred** — nothing is built and nothing is left dormant, so there is no
half-feature for a later reader to switch on. The reference screenshot's
`THIS ROUND'S QUEUE 1/4` strip is STALE for this page and any future drawing of
it should be read as the negotiation page's, never as this one's.

**3 · THIS ORDER RUNS FIRST**, before `WORKORDER-design-system-overnight.md`.
*"Your recommendation."* The reason, restated so the next person does not
re-open it: this order changes a page's SHAPE and that one changes the
platform's TOKENS, so run this way round and the token sweep has one shape to
sweep instead of two. Run the other way round and every spacing number in the
approved design has moved before Phase 1 starts, and the whole design has to be
re-measured against a page nobody has looked at yet.

**WHAT THIS MEANS FOR THE OTHER ORDER, said out loud:** it waits. It is
unattended and touches the same stylesheets, so starting it while this is in
flight would put two hands on `negotiation-css.js` and `clauseeditor.js` at
once.
