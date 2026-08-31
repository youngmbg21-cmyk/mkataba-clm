# WORK ORDER — the redlining flow (31 Aug 2026, evening)

Four items. **N-1 is NOT decided and nothing about it may be built yet.**
N-2, N-3 and N-4 are fixes and are ready to build.

---

## N-1 — A NOTE TIED TO A CHANGE. **OPTIONS REJECTED; THE OWNER IS THINKING.**

> *"I am still not happy with the workflow of redlining especially with regards
> to connecting the edit to the notes field ... once you redline, you can have
> an option to enter notes tied to the change CHG-004 as an example or you can
> choose to skip ... I want to keep it very simple and easy to navigate. The
> redlining process still feels clunky with too many presses. It should feel
> like an easy flow which does not move you around across the screen."*

Three options were researched and drawn:
https://claude.ai/code/artifact/6f6d7d13-4903-4dbc-91bb-dc57ce3761b7

> *"I do not like the options on the table so let me think it through for now."*

**BUILD NOTHING FOR N-1.** Do not pick one of the three on the owner's behalf
and do not "improve" one of them into a fourth. The next step is the owner's.

**WHAT THE RESEARCH ESTABLISHED, and it stands whatever is chosen** — this is
the part worth keeping, because it is measured rather than argued:

- **The note cannot be written from the page where redlining happens, at all.**
  `#context-panel` (the notes drawer) is z-index 46; `#clause-editor` is 54, so
  the drawer opens BEHIND the editing page and is never seen. This was known
  when the page was built — it is the recorded reason the approved prototype's
  "Comment on it" row was left out — and what has never been done is give the
  note a door that works from there.
- **MEASURED, counting a press as a click the reader must make:** a change and
  nothing said is **2 presses, 1 screen**; a change explained to your own team
  is **6 presses, 2 screens**; a change explained to the other side is **8
  presses, 2 screens**.
- **The `why` field already exists**, already travels to the counterparty and
  already prints beside the redline on their screen. It is written today only
  by the Copilot proposal card. So whichever shape is chosen, the plumbing for
  "a sentence attached to a change" is built twice over — what is missing is
  the door and the ruling on WHICH of the two a box at filing time writes.
- **The mandate was removed on 28 Aug** with the words "Users can use the notes
  feature to add notes on changes". The notes feature was never connected to
  the moment of the change; that is the whole of the gap.

---

## N-2 — THE CONTRACT STILL JUMPS WHILE YOU EDIT

> *"The contracts still jumps around when you are trying to make edits. The
> contracts should stay firm where it is unless you are scrolling."*

**ONE CAUSE WAS FIXED ON 31 Aug AND IT WAS NOT THE ONLY ONE.** `ceRenderPaper`
restored the reader's place with a bare `scrollTop` assignment, and `#ce-doc` is
a `.nego-scroll` carrying `scroll-behavior:smooth`, so the restore was read as a
REQUEST TO ANIMATE from the top — measured gliding through 0, 2, 8, 18, 32 … 500.
That now goes through `ceRestoreScroll` and lands with no intermediate frame.

**REPRODUCE BEFORE TOUCHING ANYTHING.** The candidates, in the order worth
checking:

1. **The paper is rebuilt on presses that do not need a rebuild.** Restoring the
   offset is not enough if the CONTENT ABOVE the caret changes height — the
   reader's line moves while `scrollTop` is honoured, which looks identical to a
   jump and is not fixed by anything in N-2's first fix.
2. **`ceFile` calls `ceRenderAll()`**, which rebuilds the head, the paper, the
   foot, the tabs, the lane, the scope card and the chips. Only some of that
   moved.
3. **The rail's own scrollers** (`lane.scrollTop`, the scan tab's reset) run on
   paints that have nothing to do with the lane.

**MEASURE IT AS FRAMES, not as a final position** — the fix that shipped was
only provable that way, and a probe that reads the offset after the dust settles
passes against a page that visibly jumps.

---

## N-3 — REMOVE THE SEARCH FIELD ON THE CONTRACTS PAGE

> *"remove the search open text field in the contracts page."*

`#reg-search` in `js/views/register.js`. This is the SAME removal already made
on the Negotiations seat (M-5), for the same reason the owner gave then: the
shell bar already carries one, twelve pixels above.

- **ONE RENDERER DRAWS BOTH PAGES**, so this is a scope question, not a second
  branch: `regScope()` already decides. M-5 made the box conditional; this makes
  it conditional the other way and the box is drawn on neither.
- **THE FTS WIRING IS NOT DELETED** — every handler already guards on the
  element existing, so there is no second code path to keep in step.
- **A STALE QUERY MUST NARROW NOTHING.** M-5's own note records this: the shell
  bar writes `regState().query` and navigates, so a value really can be left on
  the state, and a page narrowed by a control nobody can see is worse than the
  duplicate box was. It is already ignored in `regFiltered` for the negotiations
  seat; widen that to both seats — in the ONE reading, never in a renderer
  another path can go around.
- `reg_search_ph` becomes stale as visible text on this page; leave it inert in
  BOTH dictionaries, because a key removed from one and not the other is how a
  screen ends up half-English.

---

## N-4 — AFTER LETTING A PASSAGE GO, THE SAME CLAUSE STOPS ACCEPTING ONE

> *"when I click the highlighted x in the card, I am unable to highlight a
> sentence in the same clause and get a copilot to edit again."*

**REPRODUCED 31 Aug 2026, AND THE ✕ IS THE TRIGGER RATHER THAN THE CAUSE.**

**THE MECHANISM.** `ceSelection` looks the highlighted words up in
`ceLines()` — which reads `_ceText`, the DRAFT IN MEMORY — and returns null when
it cannot find them. So the moment the draft and the words ON SCREEN disagree,
every highlight in that clause is refused. Measured in a browser with the two
deliberately out of step: the browser's own selection is live and non-collapsed
(`"Neither party shall be liable "`), `ceSelection()` answers null, and no card
is drawn. Another clause is unaffected — which is exactly the "same clause"
in the report.

**WHY THE ✕ IS WHERE IT SHOWS.** Pressing it moves focus out of the
contenteditable box (measured: `activeElement` goes to BODY), which fires the
blur pull — and `ceDetachPassage` has just mutated that box, unwrapping the held
mark and running `normalize()` on its parent. So a DOM mutation and a pull land
in the same instant. If what the pull stores differs from what is on screen by
so much as a whitespace run, the clause is dead to highlighting until the paper
is rebuilt.

**FOUR CONFIGURATIONS DID NOT REPRODUCE IT** and that is worth recording so the
next attempt does not repeat them: a plain clause with a synthetic Range; the
same with a real mouse drag; a drag across a tracked-change mark; and pressing
the ✕ then re-selecting the identical words. It needs the divergence, so the
next thing to vary is what actually produces one — the likeliest being a
passage whose `surroundContents` throws and takes the extract-and-reinsert
fallback, which restructures the DOM rather than wrapping it.

**THE FIX HAS TWO HALVES AND THE SECOND ONE IS THE IMPORTANT ONE.**

1. **Do not let them diverge.** Either clear the mark without leaving a pull to
   catch the mutation, or repaint the paper so the box and `_ceText` agree
   again. `ceDetachPassage` is the one place to do it.
2. **A REFUSAL MAY NOT BE SILENT.** `ceSelection` returning null draws nothing
   and says nothing, so a gesture that the product has decided against looks
   exactly like a broken page — which is this codebase's own most repeated
   defect wearing another costume. Where the words are demonstrably on screen
   and the model cannot place them, that is OUR fault and the page should say
   so through `ceSay` (the page's one refusal line) rather than leaving the
   reader to press again.

**AND IT NEEDS A NET THAT WOULD HAVE CAUGHT IT.** A check that presses the ✕ and
re-selects passes today. The claim worth pinning is the INVARIANT underneath:
after any act on this page, a selection the browser really made inside the clause
must be one `ceSelection` can place. Drive it with a real mouse — a scripted
Range fires no mousedown and passed against every configuration above.

---

## WHAT SHIPS TOGETHER

N-2, N-3 and N-4 go in one change. N-1 waits for the owner.
