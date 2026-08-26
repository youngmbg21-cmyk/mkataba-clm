# WORK ORDER — Edit with Copilot becomes the paper

**Raised by:** Young, 26 Aug 2026, over two rounds of drawing.
**Branch:** `claude/ui-text-dropdown-styling-j2nat5` (level with `origin/main`
at `e0c2ce2` as this was written).
**Approved design:** the artifact **Redline With Copilot** —
`https://claude.ai/code/artifact/877214ce-b253-40b3-9102-17f888923af0`.
The earlier side-by-side proposal (`44ac19aa…`) is SUPERSEDED and is kept only
as the record of a direction the owner looked at and did not take.
**Status:** **NOT STARTED. No code until the owner says begin.** Three
decisions below are open and one of them is a sequencing question that blocks
nothing but will cost a day if it is answered late.

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
   which makes the band question in this order live rather than settled. See
   the first open decision.
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

### Phase 5 — the queue rail

The reference screenshot carries **THIS ROUND'S QUEUE 1/4** down the left.
**Decide before building** (see the open questions) — it is the round's reading
order, and this page is about one clause.

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

---

## OPEN — THE OWNER'S TO RULE

**1 · The yellow strip.** The approved design carries a band on the two
non-editable readings: *"This page is not editable — Back to Redlined"*, in the
owner's own words. **It is a band, and the standing rule is ask first** — and
main has just retired the one exception that rule named. It is recorded here as
**owner-approved** so nobody sweeps it. The cheaper alternative, if the owner
would rather have no band at all: the reading tab already says which reading is
live, and the pencils are simply absent. One word either way.

**2 · The queue rail.** Keep it, or leave it to the negotiation page? It is the
round's reading order and this page is about one clause — but the reference
drawing has it.

**3 · Sequencing against the design-system run.** This order changes a page's
SHAPE; that one changes the platform's TOKENS. **Recommendation: this first** —
then the token sweep has one shape to sweep rather than two. If the design
system runs first, this order must be re-measured against it before Phase 1,
because every spacing number in the approved design would have moved.
