# THE CONTRACT GRAPH'S NODES, AND COPILOT PRE-WRITING THE REDLINES

**WRITTEN 10 Sep 2026. NOT BUILT.** The owner's instruction, in their own words:
*"i want to build all 5. Is this doable?"* — then, on the three rulings put
back: *"go with your recommendations on all three. When i say go, build all of
them autonomously and merge to main. Wait for my go to code and start from the
latest main."* And on the same day, a second job appended to this order: A12
from the HaTi Gap Closure Plan, *"Copilot pre-writes the redlines on incoming
paper"*, whose prompt is carried whole in Part B.

**THE GATE ON ALL OF IT: nothing here is coded until the owner says go.** When
they do, the build starts from the latest `main`, runs in the order set below,
and merges to `main` at the end. The owner is not a developer; every summary
written back is plain English with no file paths.

The five options were drawn first and chosen from the artifact *Five Options
for the Contract Graph* (10 Sep 2026). That page is the picture; this order is
the plan.

## READ FIRST, BOTH PARTS

CLAUDE.md, in this order: the Scope rules and NO NEW BANDS ON THE PAGE; THE SIX
QUESTIONS; INSIGHTS / PORTFOLIO (counting is not drawing, the one door for
Copilot, `IG_TABS` as one list); WHERE OBLIGATIONS GO QUIET and PAYMENT TERMS,
TURNED INTO A NUMBER (the two newest Insights tabs, which are the model for how
a reading is built here); MONEY IN ITS OWN CURRENCY (`fxHome`, `fxMissing`, no
rate is ever guessed); AN AMENDMENT IS WRITTEN HERE (the family model and
`effectiveExpiry`); THE PAYMENT CHAIN (`after`, `obligationBlocked`); THE
RENEWAL ADVISER (`renewalWindow`); WHEN A CONTRACT WAS SIGNED (`contractSignedAt`);
A GUARD THAT IS ALWAYS FALSE (f232 and the `window.` rule); and the four
sections Part B names. Read the matching subjects in docs/MAP-HISTORY.md before
touching any of those areas.

## THE THREE RULINGS, TAKEN (owner: "go with your recommendations on all three")

1. **Blast radius counts all three link types** — agreement family (parent,
   amendment, annex, renewal), obligation chains (`after`), and shared
   counterparty. **The demo "feeds / supplies / precedes" links (`REL_SEEDS`)
   go**: they are sample data tied to sample names and draw on no real book.
2. **A counterparty's share of the book is measured by VALUE**, in home
   currency, with the contract count printed beside it.
3. **Money flow reads the side the Payment terms tab already reads**: where we
   are the supplier the money comes IN, where we are the customer it goes OUT.
   Every figure is labelled *on paper* wherever it appears.

## RULES THAT GOVERN EVERY OPTION

- **A LINK IS A FACT OR IT IS NOT DRAWN.** An edge between two contracts comes
  off the record — a family field, an obligation's `after`, the same
  counterparty string — never from wording similarity, never from a model. A
  guessed edge is a guessed clause number: worse than none.
- **COUNTING IS NOT DRAWING.** Each option is a READING that returns plain data
  and draws nothing, beside a DRAWING that computes nothing. The Insights
  panels', obligations tab's and payment terms tab's own shape. That is what
  lets Copilot answer the same question in words.
- **EVERY FIGURE IS BORROWED.** `renewalWindow`, `negWhoseMove`, `obState`,
  `obligationBlocked`, `fxHome` / `fxMissing`, `contractSignedAt`,
  `intelFrictionStats`, `obligationOnTime`, `payTermsData`'s side reading,
  `triageOf`. A second copy of any of these is the recorded defect class.
- **READ WITHOUT WRITING.** Never `negoChanges` (it runs `negoInit` and would
  start a negotiation on every contract the graph draws). `c.changes` and
  `c.negotiation` raw.
- **COLOUR IS NEVER THE ONLY CARRIER.** Every state a node shows also carries
  a word or a number. Both themes, through tokens; the accent has a night
  answer only via `--accent-ink`.
- **MONEY OBEYS `canViewValues`.** A reader without it sees NO money on any
  node, hub or card — not drawn, never dashes. `fxMissing` is reported, never
  trimmed.
- **NO BAND, STRIP, NOTICE OR CALLOUT ANYWHERE.** Facts go on the node, on its
  hover, in the existing dock card, or in the existing legend.
- **ONE DOOR.** A node press still opens the dock's explain card (`igExplain`);
  a hub press still narrows the graph. Where a card offers *See the list*, it
  is `regShowOnly` — the register's one door — never a second list.
- **THE INSIGHTS PAGE HOLDS NO CONTRACT**, so the third of the six questions
  passes at zero by construction. Say so in the summary rather than measuring.
- **THE STAGE.** `buildWorld({intelView:true})` pulls js/obligations.js; the
  graph model runs in node. Physics and SVG are browser-only:
  insights-panels-verify is the file to extend, and a claim about pixels lives
  there and nowhere else. Every new `window.` read is a name some module
  publishes — run f232 before believing a green browser run.

## THE ORDER OF BUILD, AND WHY

**2 → 1 → 3 → 4 → 5.** Two first because it is the one thing the Contracts
table cannot do and the edges it draws make every later option better. One
second because it is the cheapest and turns the graph into a worklist. Three
third because concentration is the reading a small business finds out about
too late. Four and five last because each overlaps something that exists (the
Calendar's horizon; the Payment terms tab) and five rests on the least certain
number. **Each option lands with its own tests and its own browser check
before the next begins**, so stopping after any of them leaves finished work.

---

# PART A — THE FIVE OPTIONS

## A-2 — BLAST RADIUS (first)

**WHAT IT IS.** Real links between nodes, and hovering any node lights up
everything that depends on it. The dock card sums what is at risk.

- **`buildGraphEdges(cs)` IS THE ONE READING OF THE LINKS**, in
  js/views/intelligence.js beside `buildGraphModel`, returning
  `{from, to, kind, label}` with `kind` in `family` · `chain` · `party`.
  - **family**: `c.parentId` → its parent, labelled by `RELATION_LABEL` (the
    screen's word — a getter, read at draw time, never frozen).
  - **chain**: an obligation whose `after` points at an obligation on ANOTHER
    contract links the two; same-contract chains draw nothing here (the
    Obligations tab already draws those). Resolve through `obligationAfter`
    and the product's own lookup; a pointer at a step that is not there is
    not an edge.
  - **party**: contracts sharing `c.counterparty` (folded case and
    whitespace, the same fold `obligationAlreadyOn` uses) are linked THROUGH
    a party hub — never pairwise, which is n² edges on a book with one big
    customer. The party hub is A-3's node; until A-3 lands it is a plain hub.
- **`REL_SEEDS` AND ITS TWO READERS GO.** The name stays exported as an EMPTY
  array for one release so nothing that reads it through `window` throws;
  flag it stale in CLAUDE.md.
- **`graphDependents(id)` IS THE ONE READING OF THE RADIUS** — direct
  dependents only, no transitive walk (a chain of chains is a different
  question and a cycle to fall into). Returns `{contracts:[ids], value,
  missing, held:[obligation ids], amendments:n, calloffs:n}`. `value` through
  `fxHome`, `missing` through `fxMissing`. Held = obligations on the dependent
  contracts that `obligationBlocked` answers true for.
- **HOVER LIGHTS THE DEPENDENTS** through `igPaint`'s existing `hi` / `dim`
  classes — the adjacency already exists; what changes is that the edges are
  real. **A press keeps opening the dock card**, which gains one block, *If
  this ends*, drawn only where `graphDependents` returns anything: value
  across N contracts, amendments that lapse, call-offs that lose their master,
  payment steps held. Its *See the list* is `regShowOnly(ids, label)`.
- **EDGE DRESS SAYS THE KIND**: family solid, chain dashed, party through the
  hub. A legend row per kind in `renderIntelLegend`, drawn only for kinds the
  book actually has.
- **Copilot**: `graphDependents` joins the local tool loop as
  `get_dependents` beside `get_insights_panel` — a LOOKUP over the reading,
  never a calculation of its own. The server does not grow a copy.
- **Refuses**: a transitive walk; any edge not read off a record field; a
  count that includes archived or declined contracts (`negoIsLive`'s own
  exclusions).
- **Tests**: a new node file (the three edge kinds each proved from a fixture;
  a self-pointer and a dangling `after` proved not to draw; the radius sum
  proved to equal `fxHome` arithmetic with the omission counted; `REL_SEEDS`
  proved empty; the tool proved to be a lookup). insights-panels-verify: a
  hover proved to light exactly the dependents as classes on real SVG nodes,
  the card's figure read off the page and compared with the reading, and the
  press through to a narrowed register.

## A-1 — THE NODE STATES ITS FACTS (second)

**WHAT IT IS.** One line of facts on the node, and a hover card with the
detail. An unread contract is drawn faded.

- **`graphNodeFacts(c)` IS THE ONE READING**: `{decideDays, whose, overdue,
  overdueValue, offStandard, unread}`.
  - `decideDays` from `renewalWindow(c)` — null where no window; the days are
    that reading's own, never recomputed.
  - `whose` from `negWhoseMove(c).k` and printed with `negoMoveSay`, the one
    wording the Negotiations column and the memo already share.
  - `overdue` = count of `c.obligations` where `obState` answers overdue and
    `obligationBlocked` answers false; `overdueValue` through
    `obligationAmount` — only where `canViewValues`.
  - `offStandard` = deviations on `c.playbook` (the stored review), null where
    none has run.
  - `unread` = the Home tile's own Copilot-coverage reading (`_hasBrief` /
    `_brief`, `c.playbook`, `c.scan` — any one of the three), never
    obligations, for the reason that tile records.
- **THE NODE'S THIRD LINE** carries at most three of these, in this order:
  days to decide (amber inside 90), whose move (a word), overdue (ruby with a
  count). Nothing where nothing applies. Node height grows by one line only
  where a fact is drawn.
- **UNREAD FADES THE NODE** (opacity on the group, label kept legible) and the
  sub-line says *not yet read by Copilot*. Colour is not the carrier; the word
  is.
- **THE HOVER CARD** is the dock's explain card's own facts block, reused —
  never a third rendering of the same six facts. If a floating hover card is
  built, it is `position:absolute` inside the graph's own frame, dismissed on
  leave, and carries no controls (a control on a hover is a control nobody can
  reach by keyboard). `Open contract →` is the existing door.
- **Refuses**: a second copy of any reading; money for a reader without
  `canViewValues`; more than three facts on the node (the hover carries the
  rest).
- **Tests**: node file (each fact proved to equal its source reading on a
  fixture; the three-on-the-node cap; unread proved to follow the Home tile's
  own rule; money proved absent for a viewer). insights-panels-verify: the
  line as painted text, the fade as computed opacity with the label still
  above AA, the hover card's figures against the reading.

## A-3 — THE COUNTERPARTY AS A NODE (third)

**WHAT IT IS.** Each company on the other side becomes a node carrying share of
book by value, contract count, rounds per deal, on-time record and which way
their payment terms cut.

- **`graphPartyStats(name)` IS THE ONE READING** and `graphPartyStatsAll()`
  the roll-up. Per party: `{contracts, value, missing, share, rounds, onTime:
  {met, answered}, pay:{side, days, standard, over}}`.
  - `value` and `share` through `fxHome` over the LIVE book (`negoIsLive`'s
    exclusions — not declined, not archived); `share` = value / live book
    value in home currency; `missing` names what was left out on either side
    of that division.
  - `rounds` is `intelFrictionStats`' own per-counterparty `avgRounds` — asked,
    never re-derived.
  - `onTime` from `obligationOnTime` over that party's obligations that CAN
    answer; the unanswerable count is printed (the J-2.2 rule: nothing guessed
    on a record that has no completion date).
  - `pay` from `payTermsData().rows` filtered to the party: the side, the
    days, the standard for that side, and whether over.
- **THE NODE** wears the hub's deep teal with a share bar and the four lines
  from the mock. **Click narrows the graph to that party's contracts** through
  `igFilterToGroup`'s own lens mechanism — one act, not a second filter.
- **THE GROUPING** `counterparty` already exists; this replaces its plain hub
  with the party node. Every other grouping keeps plain hubs.
- **Copilot**: `graphPartyStats` joins the local tool loop as
  `get_counterparty` — a lookup.
- **Refuses**: an average of averages (share is value over value, once); a
  rounds figure computed here; on-time reported as a rate where fewer than
  three obligations can answer (`PRECEDENT_MIN`'s reasoning: below three there
  is no pattern, only an anecdote — print the fraction, not a percentage).
- **Tests**: node file (share proved to sum to 1 across parties less the
  missing; rounds proved equal to the friction stats' own; on-time refusing a
  rate below three; money absent for a viewer). insights-panels-verify: the
  party node as pixels, the share bar's width against the figure, a press
  narrowing the graph.

## A-4 — THE RENEWAL CLIFF, DRAWN (fourth)

**WHAT IT IS.** A grouping by decision window with the hubs in time order, and
a scrubber that fades out nodes whose decision date has passed.

- **`groupLabelOf`'s `expiry` case ALREADY GROUPS BY EXPIRY WINDOW.** A-4 adds
  a `decision` case reading `renewalDecisionDate(c)` — expiry (family-aware,
  `effectiveExpiry`) minus the notice period read from the wording — the same
  two readings the Calendar's horizon and the reminder emails use. Windows:
  this quarter, then each of the next four quarters, then *later*, then *no
  date*. A node under a window carries its `decideDays`.
- **THE HUBS ARE LAID OUT LEFT TO RIGHT IN TIME** for this grouping only —
  `makeIntelGraph` seeds hubs on a ring; a `linear` seed for this grouping
  places them on a line. The physics is untouched.
- **THE SCRUBBER** is one range input in the graph's own toolbar, drawn only on
  this grouping, defaulting to today, running to +12 months. Moving it fades
  (does not remove) nodes whose decision date is before the scrubbed date and
  restyles the hub's count as *N passed · N ahead*. Per sitting, in memory.
- **A CROWDED QUARTER SAYS SO IN WORDS** on the hub (*5 decisions in one
  quarter*) — amber ink only where the count exceeds the book's average per
  quarter; never a band.
- **Refuses**: a decision date computed anywhere but `renewalDecisionDate`;
  a scrubber that persists; a fourth reading of "days to decide" (A-1's
  `graphNodeFacts.decideDays` is the one the node prints).
- **Tests**: node file (the grouping proved to bucket by the same date the
  Calendar's horizon uses on a fixture built with `monthSpan`, never by
  counting days from today — the f183 rule; the passed/ahead split at a
  scrubbed date). insights-panels-verify: hubs proved left-to-right in time as
  geometry, the scrubber dragged with a real pointer and the fade measured as
  computed opacity, and the crowded-quarter word as painted text.

## A-5 — MONEY FLOWING THROUGH THE VALUE STREAM (fifth)

**WHAT IT IS.** Each value stream hub shows money in, money out and net, on
paper. Links are sized by value.

- **`graphStreamFlow()` IS THE ONE READING**: per folder `{in, out, net,
  missing, unsided}`. Side from `payTermsData().rows[].side` — supplier = in,
  customer = out. Value through `fxHome`. **A contract whose side cannot be
  read is `unsided`, counted and named, never assumed** (the fault the
  payment terms tab's "not recorded" pile exists to prevent). Non-monetary
  contracts (`isMonetary` false) are in no column.
- **THE HUB** carries In / Out / Net with the words *on paper* on the hub
  itself, not only in the legend. Net is green ink for positive, ruby for
  negative, and the sign is printed.
- **LINK WIDTH** is value on a bounded scale (min 1.5px, max 9px, sqrt of the
  share of the largest) so one giant contract does not make every other link
  a hairline. The width has no legend entry: the node's own sub-line prints
  the value, which is the carrier.
- **THE LEGEND** names teal = in, amber = out, and prints the `missing` and
  `unsided` counts as one sentence, drawn only where either is non-zero.
- **NOT PAID.** Nothing here reads invoices, because HaTi holds none. The
  legend's sentence says so: *what the paper says, not what was invoiced*.
- **Refuses**: any hub without *on paper*; a net computed from unconverted
  values; money for a reader without `canViewValues` (the hub then carries
  the stream's name and count only); a second side reading beside the payment
  terms tab's.
- **Tests**: node file (in + out per stream proved to equal the converted
  value of the sided monetary contracts; unsided and missing proved counted
  and never summed; a viewer proved to get no money). insights-panels-verify:
  hub figures as painted text against the reading, link widths measured and
  proved bounded, the *on paper* word present on every hub.

## THE COLOUR CENSUS

Insights is NOT one of theme-tokens-verify's twenty screens, so a colour change
here is proved by insights-panels-verify. Any new ink is a token with a dark
answer; no raw ramp step as text.

## TESTS, PART A

Lint first. While working, run only the new node file and insights-panels-
verify (`npm run test:insights`), plus f183 and f151 where a figure they pin
is touched. Prove each browser section fails against the parent commit before
trusting it. Run f232 (window reads) and f148 (both languages) once per option.
The full suite runs ONCE, at the end of Part A.

## RECORD KEEPING, PART A

One CLAUDE.md section per option in the house style, written as each lands.
One BUGLOG.md run entry for the whole of Part A, appended with `cat >>`, never
written. Anything noticed outside this order goes under "Noticed, not fixed".

## SUMMARY, PART A

Plain English for a non-developer: what a node now shows and what hovering or
pressing it does; which links are real and where they come from; what a
counterparty node says; what the time view and the money view show and what
"on paper" means; what a reader without money rights sees; and anything left
out or unsure of. No file paths.

---

# PART B — A12: COPILOT PRE-WRITES THE REDLINES ON INCOMING PAPER

**The owner's prompt, carried whole.** Everything between the rules is theirs;
the notes after it are what a check of the code adds.

> Build A12 from the HaTi Gap Closure Plan: "Copilot pre-writes the redlines
> on incoming paper."
>
> WHAT IT IS
> One press on the negotiation page, "Prepare redlines", that runs the
> playbook review HaTi already has and files every proposed wording as a
> draft of OURS, unsent, one card each. Nothing is sent. The person then
> sends, edits or retracts each draft exactly as they do today. This is the
> "one button" half only. The overnight half is scoped below.
>
> READ FIRST
> CLAUDE.md sections: THE MAP, ONE DOOR ONTO ADDING A CLAUSE, A STANDARD THAT
> IS ALREADY HERE (negoAddNamedClause is the wall), A RULE ONLY TOUCHES A
> CLAUSE OF ITS OWN KIND (the three landings: edit / add / unplaced), THE
> NEGOTIATION MEMO (how a row joins the More menu via opts.menuRow), WHAT
> COPILOT PROPOSED AND WHAT BECAME OF IT (aiTraceNote), THE OVERNIGHT DESK and
> THE RENEWAL NOTE IS WRITTEN BEFORE ANYBODY ARRIVES (the owner-pays rule and
> the nightly cap), and the Scope rules. Read the matching sections of
> docs/MAP-HISTORY.md before touching those areas.
>
> HOW TO BUILD IT
> 1. ONE DOOR. A row "Prepare redlines" in the negotiation page's More menu,
>    beside Playbook review and Memo, passed through opts.menuRow. It is a
>    job, not an act, so it does not go on the head row. Same gate as its
>    neighbours: our seat, canEdit, not a narrowed reviewer, dead in the
>    counterparty preview, never on an executed contract. Grey it with the
>    reason on hover when there is no readable wording, the same rule the
>    playbook scan uses.
> 2. IT ASKS BEFORE IT SPENDS. A confirm dialog that names what it will do
>    (run Our standards against this contract and file the proposals as
>    unsent drafts) and that it costs one deep Copilot call. Refusing writes
>    nothing.
> 3. THE REVIEW IS THE EXISTING ONE. Call runPlaybookReview, then
>    rlPlaybookProposals. Do not write a second reading of what is off
>    standard.
> 4. THE FILING IS THE EXISTING ONE. For each proposal: landing 'edit' files
>    through rlFilePlaybookProposal's own path; landing 'add' goes through
>    negoAddNamedClause, so a clause already on the table or in the agreement
>    is refused rather than duplicated; landing 'unplaced' is skipped and
>    counted. Every filing reaches negoFileChange, so the desk rule, the
>    review gate, the frozen-wording rule and the no-op guard all apply
>    without being repeated. Never call negoFileChange or changes.push
>    directly from the new code.
> 5. WHICH WORDING. Use the same choice the review modal's lead button uses
>    (rlPbWordingLabel decides what the card shows): the library's preferred
>    wording where the position has one, otherwise Copilot's fitted draft.
>    Never file a fallback automatically.
> 6. NOTHING IS SENT. The drafts land under "Your drafts" with their Send /
>    Edit / Retract verbs. Do not touch turnAt, do not call the postbox, do
>    not publish a round.
> 7. RECORD IT. Call aiTraceNote for each proposal as a 'playbook' feature
>    proposal at the press, so the acceptance metrics on the Copilot engine
>    panel count what became of these.
> 8. SAY WHAT HAPPENED, ONCE. An 'ok' toast with the counts: filed, skipped
>    because already here, could not be placed, refused by a rule. Zero filed
>    is a 'warn' toast that says why. No band, strip or notice anywhere on the
>    page. The column repaints and that is the confirmation.
> 9. WORDS in both languages through i18t, with keys; the audit line stays
>    English and names the count.
>
> THE OVERNIGHT HALF, SCOPED DOWN ON PURPOSE
> The change funnel lives in the browser and the server must not grow a copy
> of it. So overnight, the existing renewal-prep sweep pattern runs the
> playbook review server-side through aiPlaybookVerdicts for a contract that
> arrived from the other side and has no stored review, under the same
> owner-pays rule, the same nightly cap and the same admin switch shape as
> the renewal notes, and stores the verdicts as the ordinary playbook record.
> It files nothing. The next morning "Prepare redlines" finds the review
> already on file and costs nothing. If this half needs a new switch or a new
> cap, use the renewal-prep ones or mirror them exactly and say so.
>
> REFUSALS THAT MUST HOLD
> Never on the counterparty's seat. Never a second filing path. Never a draft
> filed on a locked or executed contract. Never a fallback filed
> automatically. Never anything sent.
>
> TESTS
> Lint first. While working, run only the new node test file and the test
> files the sections above name. One new browser file,
> prepare-redlines-verify, that drives the real press on a real contract with
> their paper, counts the cards that arrive under Your drafts, proves none was
> sent, proves the counterparty's page did not change, and proves a second
> press files nothing new. Prove the browser file fails against the parent
> commit before trusting it. Run the full suite once at the end.
>
> RECORD KEEPING
> Append a section to CLAUDE.md in the house style and a run entry to
> BUGLOG.md with cat >> (never write). Anything you notice outside this task
> goes under "Noticed, not fixed".
>
> WHEN YOU FINISH
> Plain-English summary for a non-developer: what a person now presses, what
> happens, what is never done, what it costs per contract, and anything you
> deliberately left out or were unsure of. No file paths.

## WHAT A CHECK OF THE CODE ADDS TO PART B

- **The names are real and in these places**: `runPlaybookReview` in
  js/playbook.js (async, returns null where there is no readable wording —
  that null is the greying rule); `rlPlaybookProposals` and
  `rlFilePlaybookProposal` in js/views/negotiation.js, the latter already
  refusing an `unplaced` landing; `negoAddNamedClause` in js/negotiation.js
  (async; a refusal comes back on `opts.refused` and returns null);
  `aiTraceNote` in js/aitrace.js; `aiPlaybookVerdicts` and `runRenewalPrep`
  in server/server.js with `aiRenewalPrep` (absent = on) and
  `aiRenewalPrepMax` as the switch and cap to mirror.
- **`rlFilePlaybookProposal` is where the three landings already meet.** A12's
  loop should hand it each proposal and let IT route: an `edit` landing files
  the located clause, an `add` landing goes to `negoAddNamedClause`, and
  `unplaced` is refused. If that function does not already route `add`
  through the named-clause wall, teaching it to is the change — never a
  parallel loop in the new code. Check before writing.
- **The second-press property comes free from two existing walls**: the no-op
  guard refuses a modify that changes nothing, and `negoDupClauseStop` refuses
  a named clause already on the table. A12 must count those refusals rather
  than pre-filter, so the toast can say *N already here*.
- **The More menu's gate is `mayMenu` in `renderRedline`** (the Playbook review
  row's own); the Memo row is the precedent for a second row through
  `opts.menuRow`. The row is dead in the counterparty preview through the
  same `data-rl-dead` treatment the row beside it wears.
- **The overnight half writes `c.playbook` through the ordinary persist**, so
  `aiNoteRead`'s rule applies: no courtesy audit line on an executed record —
  and an executed record is not a candidate anyway. "Arrived from the other
  side" is `c.source==='upload'` with a counterparty named, not yet executed,
  `c.playbook` absent; owner-pays through `c.owner` exactly as the renewal
  prep does, and a contract with no owner is not prepared, for the reason that
  section records.
- **The confirm dialog is `confirmDialog`**, draggable like every other window,
  and its sentence names the cost. Where the review is already on file (the
  overnight half ran, or a person ran it that morning) the dialog says the
  review is on file and the press costs nothing — one sentence, chosen by
  whether `c.playbook` exists.

## THE ORDER OF THE WHOLE

Part A first (2, 1, 3, 4, 5), then Part B's one-button half, then Part B's
overnight half. Each lands with its own tests. One branch, merged to `main`
when the last lands, on the owner's standing instruction. A part that turns
out blocked is finished as far as it goes and the block is named in the
summary; the rest still lands.

---

# PART C — ADDED 11 Sep 2026, AFTER PARTS A AND B LANDED. NOT BUILT.

Two jobs appended by the owner on the day Parts A and B merged. Both wait
for the owner's go, exactly as the parts above did, and start from the
latest `main`.

## C-1 THE MAP COPILOT GETS EVERYTHING THE MAP KNOWS

**What the owner saw (11 Sep 2026).** They typed *"cluster by expiration
date"* into the Contract Graph's panel. The panel answered *"All contracts ·
clustered by expiration date"*, the caption switched to *Grouped by Copilot
grouping*, and every node stayed on its value-stream hub. Two turns earlier,
*"cluster by timeline of when they were signed"* and *"cluster them by month
they were created"* had both been excused with *"I don't have those dates"*
and silently regrouped by status. The owner's words: *"it gave me an answer
but as you can see from the nodes, it was not correct."* Then: *"what can we
do to give copilot maximum information including what we just discussed
above?"* — and this section is the answer, written down.

**The cause, found on 11 Sep.** Map commands go through `POST /api/ai/graph`
(server/server.js), whose `render_graph` tool allows `groupBy` to be only
`folder · counterparty · status · valueBand · kind · custom` — no `expiry`,
no `decision`, no `payterms`, no `risk`, no `source`, though every one of
those is on the Group By dropdown (`groupOpts` in js/views/intelligence.js)
and drawn by `groupLabelOf`. The card each contract travels as carries only
`id · name · counterparty · folder · kind · value · status · expiry`
(`intelGraphAsk`'s payload) — no signed date, no created date, no renewal
decision date. Faced with a dimension it may not name, the model answered
`custom` with an empty `groups` map and a label; `intelGraphAsk` took
`res.groupBy` on trust, set `intel.groups` to nothing, and `groupLabelOf`'s
`default` branch drew the folder. Nothing checks that a grouping Copilot
returns contains a single contract, and the chat line is Copilot's own
sentence, never a reading of what the map did.

**The rulings to build, in this order.**

1. **THE GROUPING MENU IS THE DROPDOWN'S.** The tool's `groupBy` enum becomes
   the SAME list `groupOpts` carries (`folder · counterparty · status ·
   valueBand · kind · expiry · payterms · decision · risk · source`) plus
   `custom` — ONE list, published from the client and mirrored on the server
   with a test pinning the two equal (the `IG_TABS` rule applied to
   groupings). The buckets are HaTi's (`groupLabelOf`), never Copilot's:
   *Expired · Within 30 days · 31–90 days · 3–12 months · Beyond a year · No
   expiry set* for expiry, the quarters for decision, `payBucketOf` for
   payment terms. Copilot names the dimension; the product cuts it.
2. **THREE TIME GROUPINGS THE DROPDOWN DOES NOT HAVE YET**: *signed year*,
   *signed quarter*, *expiry year* (a fourth, *created month*, only if
   `created_at` rides the light list — check). Each reads ONE existing
   reading — `contractSignedAt` (js/negotiation.js, the one reading of when),
   `effectiveExpiry` — and lands in `groupLabelOf` beside `expiry`, and on
   the dropdown too, so the typed command and the control cannot disagree.
   A contract with no such date is its own bucket, named ("Not signed",
   "No expiry set"), never folded in.
3. **THE CARD CARRIES EVERY FACT THE MAP DRAWS.** The per-contract card sent
   to `/api/ai/graph` gains: `signedAt` (`contractSignedAt`), `createdAt`,
   `decisionDate` (`renewalDecisionDate`), `noticeDays`, `effDate`,
   `payTermsDays` (`metadata.paymentTerms`, the record, never the wording),
   `parentId` and `relation` (the family), `currency` (`contractCurrency`),
   `move` (`negWhoseMove`), `live` (`negoIsLive`), `overdue` and `nextDue`
   (`obState` / `obligationDue` over the list), `offStandard`
   (`deviationSummary`), `risk` (`riskScore`), `read` (`copilotRead`),
   `archived`, `source`. **Every value is borrowed from the reading the
   graph already draws** — A-1's `graphNodeFacts`, A-3's `graphPartyStats`,
   A-5's `graphStreamFlow` — never a second arithmetic (the COUNTING IS NOT
   DRAWING rule, and f291/f292/f294's "every figure borrowed"). Money obeys
   `canViewValues`: a reader who may not see values sends none, and the
   server strips `value` again on its own reading (THE SERVER IS THE WALL).
   Wording is NOT sent for a map command — grouping never needs it, and the
   full Copilot reads wording on demand through `get_contract` as it does
   now. The 600-contract cap on the payload stays and is said (A CAP IS A
   FACT).
4. **FILTERS ARE FIELDS, NOT ID LISTS.** The tool gains a structured `where`
   (status, folder, kind, counterparty, value above/below, expiring within N
   days, signed between two dates, overdue obligations, off standard, not
   read yet, whose move, archived). HaTi applies it over `state.contracts`
   and builds `visibleIds` itself; the model may still return `visibleIds`
   for a match no field expresses (a name, a city), and where BOTH come back
   the field filter wins and the list is intersected. This is where a
   159-contract book stops depending on the model copying ids by hand.
5. **THE ANSWER IS WRITTEN FROM WHAT THE MAP DID.** After `intelGraphAsk`
   applies the result it composes the chat line from the model it built
   (*"Grouped 159 contracts into 6 expiry windows · 14 have no expiry
   set"*, *"Showing 23 of 159 · Leases"*) and prints Copilot's own sentence
   only as a second line where it says something the numbers do not. A
   `custom` grouping that places no contract, or fewer than two groups, is
   REFUSED in words — *"I could not group by that. The map can group by
   value stream, customer, status, value, type, expiry window, payment
   terms, renewal decision, risk, origin, signed year, signed quarter,
   expiry year."* — and the map is left exactly as it was (no caption flip
   to *Copilot grouping*, no lens). The built-in fallback `graphInterpret`
   learns the same list of dimensions so an unconfigured workspace gets the
   same behaviour minus the prose.
6. **WHAT IS ON SCREEN TRAVELS TOO**: the current `groupBy`, the lenses in
   force (label, action, count), the crowded quarters (`graphCliffCrowded`),
   the reader's language and workspace currency, beside the `activeIds` and
   the eight turns of history already sent. Today's date already travels.
7. **THE FULL COPILOT GETS THE GRAPH'S OTHER READINGS.** `ctx.graph` (built
   in `aiChatContext`, js/ai.js) already carries `links` (A-2) and
   `parties` (A-3). It gains `streams` (`graphStreamFlow`'s per-folder
   in/out/net/missing), `cliff` (the decision quarters and their counts),
   `facts` (each node's ≤3 facts from `graphNodeFacts`), and `lenses` (the
   same list as 6, so *"of those"* works in a typed question). Each rides
   as fields clamped on the server exactly as `pageSays` does (f283's rule);
   the server never recomputes any of it and has no family model.

**The nets.** A test pinning the server's enum to the client's `groupOpts`
by SET (the two lists cannot drift); a test that a `custom` grouping with no
placed contract is refused and the caption does not move; a test that the
card's every field is a name published from the reading it borrows (f232's
rule); a test that a reader without `canViewValues` sends no `value`, and
that the server strips it for such a caller; a browser section on
insights-panels-verify that types *"cluster by expiration date"* against the
scripted AI (`startScriptedAi`) and measures the hubs on screen equal the
six expiry buckets — and that the same file, run against the parent, fails
at the hubs rather than timing out.

**The order.** 1, 2, 5 first (they close the failure the owner saw); then 3
and 4 (the reach); then 6 and 7 (small once the others are in). The map
Copilot stays on the `fast` tier; one press is still one call.

**Standing questions for the owner, none blocking**: whether *created month*
is wanted (the created stamp may not ride the light list); whether a
`custom` grouping should be allowed at all once the named list is this long
(it is what lets *"by city"* work, and it is what produced the wrong answer).

## C-2 AN EXECUTED CONTRACT CANNOT START A NEGOTIATION

**The owner's instruction, 11 Sep 2026, verbatim:** *"If a contract has been
executed, the start negotiating button should be greyed out and therefore
locked out from the negotiate page."* Their screenshot: MK-243, the
Document tab, status word **Closed** in ruby, the counterparty's signature
on the trail, and *Start negotiating* drawn live at the right of the tab row.

**What stands today.** The wording already FREEZES at the first signature
(`negoWordingFrozen = negoExecuted || negoAnySignature`, asked at the
funnel), so a negotiation on executed paper could never file a change — but
every DOOR onto the negotiate page is still drawn live, and a reader who
presses one lands on a page whose every verb then refuses. That is the
product saying yes with a button and no with the page: the fault class THE
SIX QUESTIONS name as the most expensive (two screens disagreeing about what
the product does). The button's label is chosen by whether a negotiation
exists (`started`), never by whether the paper is executed.

**The ruling to build.**

1. **ONE READING: `negoMayStart(c)`** (js/negotiation.js, beside
   `negoExecuted` and `negoWordingFrozen`) answers whether a negotiation may
   be opened or started on this contract: false where `negoWordingFrozen(c)`
   is true (executed, or any signature on either store — the same line the
   funnel already draws; a contract half-signed is as shut as a sealed one),
   false where the record is archived, true otherwise. It returns the
   REASON as well as the answer (`{ok, why}`) so every door can print the
   same sentence. READING MUST NOT WRITE: it reads `c.changes` and
   `c.negotiation` raw, never through `negoChanges`.
2. **EVERY DOOR ASKS IT AT DRAW TIME, and a door that cannot work is drawn
   dead, not hidden** (the rule the desk and the clause lock already keep:
   `disabled`, the reason on the hover and the aria-label, the control kept
   in its slot so the row does not reflow). The doors, found on 11 Sep —
   Rule 2 says find every one; account for each:
   - the Document tab's `#ws-to-nego` (js/views/contract.js, the tab-row
     slot builder — the one in the screenshot);
   - the blank-paper note's button (`docNothingWrittenHtml`);
   - the seven other `openRedlineWorkbench(c.id)` presses in
     js/views/contract.js (the ⋯ menu's row, the head's act, the Key terms
     and History doors);
   - the phone's two (`js/mobile-contract.js`, `js/mobile-screens.js` — a
     dimmed row keeps its tap and TALKS, per the overnight-run rule);
   - the Negotiations list's row (renderRegister on the negotiations
     scope) and the register's row door;
   - the Home decision rows and the alerts panel's `negotiation` kind, where
     they lead to the page.
   The label on a dead door stays what it is ("Start negotiating"); the
   hover says *"This agreement is executed — its wording is sealed"* (one
   new key, both books; `ng_closed_no_start` or the like).
3. **THE WALL IS `openRedlineWorkbench`**, the funnel every named door goes
   through (NEGOTIATE IS A PLACE). It asks `negoMayStart` FIRST and, where
   the answer is no, does not navigate: it says the reason on the screen the
   reader is standing on (a 'warn' toast through i18t, the same sentence as
   the hover) and returns false. The list door (`openNegotiations({list})`)
   is untouched — the list is not a negotiation. A hash arrival
   (`#contract=<id>&tab=redline`, `openFromHash`) lands on the CONTRACT's
   Document tab instead, so a stale link is not a way round.
4. **THE PAGE ITSELF, where it is already open** when the last signature
   lands (the twelve-second state probe brings the fact): `renderRedline`
   asks the same reading on its next paint and, where the answer has turned
   to no, draws the way back to the contract in place of the working area —
   nothing else changes on that paint, and nothing is written.
5. **THE SERVER IS THE WALL FOR CHANGES ALREADY** (SIGNED_WORDING_FROZEN,
   EXECUTED_IMMUTABLE on PUT). C-2 adds no route: a negotiation is a fact on
   the record, and the record already refuses to move. Nothing new to guard.

**What this is NOT.** It does not touch the History tab, which is where the
negotiation's record is read once the paper is sealed (`negoTimeline`); the
counterparty's page (told apart by PORTAL_MODE, and their link's own rules
govern it); the Signing tab; or the label logic for a LIVE contract
(`ct_start_negotiating` / `ct_open_negotiate_n` / `ct_open_negotiate` stay
as they are).

**The nets.** A test that `negoMayStart` answers no on each of: status
Signed; `c.hash`; `execution.at`; one signature row on either store; and
yes on a Draft with none (f-numbered, model only). A test sweeping
js/views/contract.js and the two phone files for every
`openRedlineWorkbench(` press and requiring `negoMayStart` asked in the same
builder (a name sweep, f232's shape). A browser section on the room's own
verify file that opens an executed fixture on the Document tab and measures
`#ws-to-nego` `disabled` with the sentence on its title, presses it and
measures the view did NOT change — and, run against the parent, reports a
live button rather than timing out.

**A question to put back before building, not blocking the rest.** The
screenshot's contract reads **Closed**, which is the status word for
*Declined*, not *Signed* — the trail shows a counterparty signature, so the
freeze already bites on it through `negoAnySignature`. Does the owner want a
Declined contract WITHOUT a signature locked too? The reading above says no
(nothing is sealed on it); one word from the owner adds `Declined` to the
reading, and the sentence gains a second branch ("This agreement was
closed").

## C-3 THE NOTE ON A FILED REDLINE ASKS WHICH ROOM IT IS FOR

**The owner's instruction, 11 Sep 2026, verbatim:** *"you should be able to
choose whether the note is internal or external."* Their screenshot: the
receipt window after filing (tick, *CHG-002 filed*, *Tell the counterparty
why, or skip*, the box, the globe line *the counterparty reads this beside
the change*, Skip, Add note).

**What stands today, and what this reverses.** On 1 Sep the owner ruled the
note filed from this window EXTERNAL (A NOTE ON ONE REDLINE, AND CHAT IS
WHERE THEY ARE READ — *"THE NOTE IS EXTERNAL — the explanation the other side
reads (reversed 1 Sep)"*), and the window has posted `visibility:'shared'`
without asking ever since. The Notes drawer already has the two rooms as
TABS with their own box (NOTES ARE TWO ROOMS). This window is the one
composer on our seat that offers no choice. This section gives it the
choice; the default stays what the 1 Sep ruling made it.

**The ruling to build.**

1. **A TWO-WAY CONTROL ON THE WINDOW, Internal · External**, drawn where the
   globe line sits today (that line is the CHOICE read back, so it becomes
   the control — THE READER'S OWN CHOICE, READ BACK TO THEM, IS NEVER A
   BAND). Same clothes as the drawer's two tabs (`ng_np_tab_int` /
   `ng_np_tab_ext` — the keys already exist in both books; `.rl-segwrap` /
   `.rl-seg`, the one segmented control this page draws). **External is
   lit at rest** (the 1 Sep default, unchanged). The box's placeholder and
   the external tint follow the live half exactly as the drawer's box does
   (`ng_np_ph_ext` for external; `ng_note_ph` for internal — check whether
   the internal wording needs its own key: "A note for your colleagues…").
   The lead sentence follows too: *"Tell {who} why, or skip"* on external;
   on internal a sentence that names the colleagues (one new key, both
   books).
2. **ONE WRITER, THE ROOM'S OWN ANSWER.** Add note posts through
   `negoPostComment` with `visibility` read off the control — `'shared'` on
   External, absent on Internal (anything not exactly `'shared'` is internal
   by the writer's own safe default; never a third value). Edit and Delete
   from the change's Notes row (`negoEditNote` / `negoDeleteNote`) are
   unchanged: a note's room is fixed at posting, as it is in the drawer; a
   note cannot be moved between rooms (the confirm on the CROSSING in the
   drawer is the precedent for how seriously a room is taken). Where the
   window is opened from the Notes row on a note already on file, the
   control is drawn SET to that note's room and disabled — it states a fact.
3. **THE TAG PICKER FOLLOWS THE ROOM** (`negoTagPeople` — colleagues in the
   internal room, the other side's named people in the external), and the
   wall in `negoPostComment` resolves mentions against the room chosen, so
   a colleague tagged in an external note is dropped rather than published.
4. **THE RECEIPT TOAST NAMES THE ROOM** (`ng_note_added` gains the room in
   its sentence, or a second key), so the reader knows where it went without
   opening the drawer. The drawer's live tab is not moved by this window.
5. **WHAT TRAVELS IS UNCHANGED**: an external note goes out through
   `negoPostToChannel` exactly as now, and is marked delivered on the same
   `sentAt` rule; an internal note reaches nobody by not being posted
   (`ch.thread` is not on the share payload). The counterparty's page is
   untouched (PORTAL_MODE has one room and no such window).

**THE SIX QUESTIONS, where they bit.** Q2: the globe line already spends the
attention; it becomes the control, so nothing new is added to the window.
Q5: this is the same door (the same window), taught the same choice the
drawer already carries — not a second composer. Q6: a reader who picks
Internal and presses Add note lands back where they were with a toast that
says *internal*; the drawer's Internal tab shows it.

**The nets.** A model test that the window's Add note posts `'shared'` on
External and nothing on Internal (the writer's default), and that the
control opened on an existing note is set and disabled. A browser section on
notes-two-rooms-verify that files a change, picks Internal, adds a note, and
measures the drawer's Internal tab holding it and the External tab not; then
the same with External; and that the page's own placeholder follows the
half pressed. Against the parent the file reports no control rather than
timing out.

## C-4 THE PENCIL FILES ON ONE PRESS, NOT TWO

**The owner's report, 11 Sep 2026, verbatim:** *"after i make a redline then
try to click on the pencil sign, the first time it does not work and then i
have to click on it a second time to log it. Make it one click on the
pencil."* Their screenshot: the clause editor's paper, a struck line above,
the pencil at the top right of the clause being worked on.

**REPRODUCED in a real browser on 11 Sep, before anything was touched**
(a scratch Playwright run against test/chromium/parity.html: open the
editor on a clause with `typing:true`, type in the box, ONE real mouse
press on the live clause's pencil):

- Before the press the pencil sits at y = 116.75. With the mouse button
  HELD DOWN it sits at y = 152.75 — 36 px lower. The mousedown landed on
  the pencil; the mouseup landed on a `<p>` of the wording; the browser
  fired the click on their common ancestor (`ARTICLE`), so the pencil
  handler never ran. A second press found the pencil where it now was and
  filed (`changes` 6 → 7, the note window came up). Instrumented as
  `mousedown:pen · mouseup:P · click:ARTICLE`, then
  `mousedown:pen · mouseup:pen · click:pen`. The same on a redline made by
  selecting and deleting words.
- **The cause is the toolbar row growing by one line under the reader's
  hand.** The mousedown on the pencil takes focus off the box; the box's
  blur handler pulls the text (`cePullText` → `ceApply` with `keepView`),
  and `ceApply` speaks `ce_applied` — *"Applied to the wording below."* —
  into `#ce-say`. The say line sits ON THE TOOLBAR ROW (`.ce-barrow`,
  `flex-wrap` off) between the tools and the Exit button; it takes up to
  300 px when it is on (`.ce-say.is-on`; `max-width:0` when off). The
  tools bar `.ce-bar` is `flex-wrap:wrap` and has no `flex` of its own, so
  when the say line takes its width the tools wrap onto a second line, the
  row grows 36 px, and the paper — and the pencil — move down by exactly
  that. It is the 30 Aug File-button fault (the rail foot rewritten on the
  blur its own mousedown caused) in a second costume: nothing is rebuilt
  this time, the control is simply pushed out from under the pointer.

**The ruling to build.**

1. **THE SAY LINE MAY ONLY TAKE FREE SPACE.** `.ce-barrow .ce-say` becomes
   `flex:1 1 0; min-width:0; max-width:300px` (basis zero, so it can never
   force a sibling to shrink) and `.ce-barrow .ce-bar` becomes `flex:none`
   (the tools keep their own width on this row). The faded state keeps
   `max-width:0`. The row's height is then the same with the line on and
   off, by construction — measure it, as a RELATION (row height with the
   line on equals the row height with it off), never a number.
2. **AND WHERE THERE IS NO FREE SPACE THE SENTENCE STILL APPEARS.** Below
   the width where the tools and the Exit fill the row (measure at 1024,
   the page's floor), a refusal spoken into a zero-width span is a dead
   press — the rule this page already keeps. If the measurement shows the
   line squeezed to nothing at 1024, the say line takes a second home on
   that rung only: its own row UNDER the toolbar, reserved at one line's
   height whether or not it is on (`min-height`), so it still cannot move
   the paper. Not a band: it is the same status line the strip already
   carries, in the place the strip has room for it.
3. **THE BLUR SAYS NOTHING.** `cePullText`'s call into `ceApply` passes
   `quiet:true`: the reader typed the words themselves and *"Applied to the
   wording below"* is their own act read back to them (THE READER'S OWN
   CHOICE, READ BACK TO THEM, IS NEVER A BAND). Every other speaker of
   `ce_applied` — a Copilot card's Apply, a playbook standard, a passage
   rewritten in place — is untouched. This alone would make the reported
   press work; it is second, not first, because 1 is what stops the NEXT
   sentence spoken on a mousedown from doing the same thing.
4. **NOTHING ELSE MOVES.** No change to the pencil handler, `ceFile`, the
   note window, or the blur handler's pull (which is what lets the pencil
   file what was typed).

**The nets.** A browser section on clause-editor-verify that opens the
editor typing, types, and presses the pencil ONCE with a real mouse
(`page.mouse.down` / `up`, never `.click()` on the element, which is not a
press), then measures `changes` grew by one and the note window is up; and
that measures the pencil's `getBoundingClientRect().top` with the button
held equal to its top before the press. Against the parent the section
reports the pencil 36 px lower and no filing, rather than timing out. A
second claim that the toolbar row's height with `#ce-say.is-on` equals its
height without, at 1500 and at 1024. Re-point the 30 Aug section's claim
(the rail foot) only if it reaches for the same fixture.

**Out of scope, said out loud.** The clause panel's own inline editor and
the room's editor have no `#ce-say` and were not measured; if the same
sentence is spoken on a strip there, it is a line in BUGLOG.md, not a fix
on the way past.

## C-5 THE NOTE WINDOW COMES UP ON EVERY FILING ON A CLAUSE, NOT ONLY THE FIRST

**The owner's report, 11 Sep 2026, verbatim:** *"when i redline Clause A and
close, I get the pop up note window to give a reason. If i go back later to
Clause A and make another redline, this time when i close i do not get a pop
up to add a note. This should not be the case."*

**What stands today, and what this reverses.** On 31 Aug 2026 the owner
ruled decision D — *asked once, on the first filing; revisions file
silently* — and `rlNoteAskAfterFile` (js/views/negotiation.js) keeps it
with one line: `if ((ch.revisions || []).length) return`. A second redline
on a clause that already carries our pending ask FOLDS into the same change
through the funnel's revision fold (ONE PROPOSAL ON THE TABLE), `revisions`
grows by one, and the window is not raised. From the reader's chair the
second filing is as much a filing as the first, and the explanation they
would give may have changed with the wording. **This section reverses
decision D:** the window is raised on every filing that moves the wording
on our seat. The earlier ruling's reason — a revision is the same ask, so
the same note stands — survives as what the window SHOWS, not as a reason
to stay shut.

**The ruling to build.**

1. **THE GATE GOES.** `rlNoteAskAfterFile` drops the `revisions` test and
   asks on every filing on our seat where `notesMayWrite` says yes — a new
   change, a revision folded into our pending one, an insertion, a
   deletion. Both callers inherit it (the funnel wrapper in
   js/views/negotiation.js and the clause editor's pencil/File in
   js/views/clauseeditor.js); no third caller is added.
2. **A REVISION OPENS ON THE NOTE ALREADY GIVEN.** Where the reader already
   wrote a note on this change (`negoMyNote`), the window opens with that
   note IN THE BOX and its verb reads *Save* (`ng_note_save`), exactly as it
   does when opened from the change's own Notes row today — so a second
   filing lets the reader keep, amend or delete the reason rather than write
   it twice. Where a note was given but has already been DELIVERED
   (`negoNoteDelivered` — `sentAt` stamped, the other side is holding it),
   the box opens EMPTY for a further note and the delivered one is printed
   above it in the "already said" list the window already draws (`past`):
   a delivered note is a record, not a draft. The headline stays the
   filing's (*CHG-002 filed*, the tick); the lead sentence says it is a
   revision where it is one (one new key, both books, e.g. *"You changed
   the wording again — update the reason, or skip."*).
3. **C-3's ROOM CONTROL RIDES ALONG**: where C-3 has landed, the control on
   a revision's window is SET to the existing note's room and disabled (a
   fact), and live only for a fresh note.
4. **NOTHING ELSE MOVES.** The window still never blocks the filing (every
   caller has filed, persisted and repainted before it opens); Skip still
   costs nothing; the counterparty's seat is untouched (`side !== 'owner'`
   still returns); Edit and Delete from the Notes row are unchanged.

**The nets.** A model test that `rlNoteAskAfterFile` opens the window on a
change with one revision on our seat (against the parent it resolves null),
and still resolves null on the counterparty's side and for a viewer. A
browser section on clause-editor-verify (beside section 23, which drives
the window) that files on a clause, skips, files a second redline on the
SAME clause through the pencil, and measures the window up with the lead
naming a revision; then adds a note, files a third time, and measures the
box pre-filled with that note and the verb reading Save. Against the parent
the second window never comes up and the section reports it.

**The comment above `rlNoteAskAfterFile` is rewritten** to record both
rulings and their dates — the 31 Aug reason for once, and the 11 Sep reason
for every time — so the next reader does not put the gate back as a fix.

## C-6 THE PLAIN ENGLISH EDITION IS ONE CLAUSE OUT ON THE COMPANY STANDARDS

**The owner's report, 11 Sep 2026, verbatim:** *"In two different company
standard contracts, the plain english has failed to pick up on the first
clause. This was previously not an issue."* Two screenshots, both Drafting
contracts made from built-in templates with their blanks still editable —
the Packaging Supply Agreement (MK-395's sibling) and Marketing & Trade
Promotion Services (MK-395) — the Document tab on Plain English.

**What the screenshots actually show, read closely.** It is not that the
first clause is missing; it is that EVERY reading sits one clause too low.
Under *2. Price & Contract Value* the edition prints the reading of clause 1
(*"You (the Supplier) must manufacture and supply packaging that matches the
artwork…"*); under *3. Approvals & Media* it prints the reading of clause 2
(*"The annual retainer or working budget amount is left blank…"*). The slot
under clause 1 is empty, and the last clause's reading has nowhere to go.

**MEASURED on 11 Sep, before anything was touched.** A scratch run against
a real HaTi (test/helpers' `startHati`, the scripted AI, a real browser):
create a draft from `PK` and from `MK` through `createFromTemplate`, open
the Document tab, ask `docReadClauses`. Both walks are RIGHT: four rows,
each `section` row carrying its own heading and its own wording (*1. Scope
of Supply → "The Supplier shall manufacture…"*, *2. Price & Contract Value
→ "The estimated annual contract value is…"*). The template title is taken
as the name and not sent; the front paragraph is not a row. So what the
route was sent was correct, and the fault is in how the answer is paired.

**The cause, by the shape of the fault.** `/api/ai/readings`
(server/server.js) numbers the rows it sends `[0] … [n-1]` and asks the
model for `i` = *"the number in square brackets at the head of the row"*.
Every row's heading ALSO starts with a number — the clause's own, one
higher (*"1. Scope of Supply"* is row `[0]`). An answer that numbers from
one instead of zero — the model reading the clause number as the row
number — produces exactly the screenshot: the entry the model meant for
clause 1 arrives as `i:1`, the server stamps it with `list[1]`'s heading
(*2. Price…*), the browser's guard compares that stamped heading with the
same list's row 1 and is satisfied by construction, and the reading draws
under the wrong clause; row 0 gets no entry; the entry `i:n` is out of
range and dropped. **The heading guard cannot catch this**: since 10 Sep
(headings no longer asked of the model) the heading on an item is the
SERVER's own `list[i].heading`, so the guard compares the list with itself.
That is the "previously not an issue" — before 10 Sep a heading the model
echoed could disagree with the row and the guard drew nothing; now nothing
the model writes is checked against anything. And a wrong pairing is CACHED
in `clause_readings` for the life of the wording (the input hash has not
moved), so the two contracts will stay wrong until forced.

**The ruling to build.**

1. **THE ROW KEY CANNOT BE MISTAKEN FOR THE CLAUSE NUMBER.** Rows are sent
   under an opaque key that no clause could carry — `[R0] … [Rn-1]` (or a
   letter key) — and the tool's `i` field becomes `key` (string), described
   as *"the row key in square brackets, e.g. R3 — never the clause's own
   number"*. Zero-based integers beside one-based clause numbers is the
   trap; remove the trap rather than warn about it.
2. **THE ANSWER RESTS ON SOMETHING CHECKABLE.** Each entry echoes the row's
   heading verbatim (`heading`, required — the pairing reading, never
   printed; Young's 10 Sep ruling was about headings DRAWN, and this one is
   drawn nowhere). The server pairs an entry only where the key resolves AND
   the echoed heading equals `list[key].heading` after `_docReadNorm`'s
   folding; an entry that fails either is DROPPED and COUNTED. A row with
   no heading (a marked number with no lead-in) is paired on the key plus
   the first eight words of its wording echoed instead. The browser's guard
   stays as the second wall.
3. **A SHIFTED ANSWER IS REFUSED WHOLE, NOT CACHED.** Where more than a
   quarter of the entries fail the pairing check, the route answers with
   the readings it could pair, `partial:true`, and a count of how many it
   could not — and writes NOTHING to `clause_readings` (the cut-short rule,
   applied to a mispaired answer). The column says so in its foot: *"N
   clauses could not be matched to the contract — try again"* with the
   force press the truncated brief already has. A CAP IS A FACT, NEVER A
   SILENT TRIM; a misfiled reading is worse than a missing one.
4. **THE TWO CONTRACTS ON FILE ARE MADE RIGHT.** The input hash changes by
   construction (the sent text carries the new keys), so the next press on
   Plain English asks the route again and the stale pairing is never served;
   no migration, no manual clearing. Say so in the summary.
5. **THE PROMPT SAYS IT ONCE, PLAINLY**: *"The key in brackets is the row's
   address for your answer. It is not the clause number, which is part of
   the heading and is the contract's own."*

**The nets.** A test on the route against the scripted AI that answers
with keys one row high (the fault as observed): asserts nothing is drawn
under the wrong clause, the mismatched entries are counted, `partial` is
set and the cache table stays empty — and, run against the parent, the
same script produces the shifted pairing. A second script answering the
right keys with a wrong echoed heading on one row: that one row is dropped
and counted, the rest pair. plain-english-verify gains the shifted script as
a section and measures on screen that the reading under *2.* is about
clause 2 or absent, never clause 1's. f277 pins that the tool's key field
is not an integer and that `heading` is required in the schema.

**Out of scope.** The walk (`docReadSheet`) is untouched — measured right.
The prompt's translation rules are untouched. Readings cached for other
contracts stay served until their wording moves (their pairing was made
under the same fault only if the model numbered from one that day; the new
hash re-asks them on the next press either way).

## C-7 THE UPLOADED CONTRACT'S HEADER BLOCK — MEASURE AND ADVISE FIRST, NOTHING COMES OFF WITHOUT A YES

**The owner's brief, 11 Sep 2026, verbatim and whole. It is an instruction to
MEASURE and PROPOSE, not to build; the proposal goes back to the owner and
waits for their yes before a line of code:**

> On the Document tab of a contract that was UPLOADED (not drafted from a
> template), the block above the wording does not look like the rest of the
> product. It reads "External Document · received · MK-000" in small mono
> capitals, with the contract's name under it in the platform's typeface, on
> its own ruled line. An ordinary contract draws the paper's own header there
> instead — the market, the name set in the document's own typeface, and
> "Between us and them" — so the same tab looks like two different products
> depending on where the contract came from.
>
> Measure and advise before you write any code. Three things:
>
> 1. THE HEADER BLOCK. Tell me what an ordinary contract draws there and what
>    an upload draws there, side by side. Then tell me what the upload's block
>    says that the room header twelve pixels above it does not already say —
>    it already shows the name and the reference — and how many pixels it
>    costs above the first line of the agreement.
>
> 2. WHETHER IT TRAVELS. I believe that block sits outside the owner-only
>    guard, so it goes into the counterparty's copy and into the exports as
>    well — meaning the other side reads our own filing language about their
>    own paper. Check it and tell me either way.
>
> 3. THE WORDING SIZE. Where a Word file's text was read out but no structure
>    was stored, the wording is set one pixel smaller than an ordinary
>    contract's. Confirm it and tell me what it should be.
>
> The FILE STRIP (the quiet line naming the file, who filed it, how well it
> was read, Download original, Re-read document) is a different thing and I
> want it to stay — it is a fact about the file. Do not touch it.
>
> Then propose what you would do, in plain English, and wait for me to say
> yes. Removing a block is as much a change as adding one, so nothing comes
> off that page without my word. Measure it on a real uploaded contract in a
> browser before you tell me anything, run the six questions, and remember
> the contract may not lose pixels.

**Where to look when the go comes (pointers, not findings — nothing below
has been measured yet).**

- The block is written in `uploadDocBody` (js/views/contract.js): a
  `mb-6 pb-5 border-b` wrapper holding a `text-[10px] font-mono uppercase
  tracking-[0.2em]` caption from `ct_external_received` (*"External Document
  · received · {id}"*, both books) and an `<h3 class="font-display …">` of
  `c.name`. The gold band under it was removed on 26 Aug and its comment
  records what went and why; the same comment records `OURS` and the crash
  it fixed — read it before touching the builder.
- An ordinary contract's head is `docPaperHeadHtml` (the ONE builder for the
  paper's head — TWO BUILDERS every document body goes through; see THE NEW
  DESIGN) — market, the name in the document's own face, *"Between us and
  them"*. `docBody` is the dispatcher (`isUpload → uploadDocBody`,
  executed → `frozenDocBody`, stored wording → `redlineDocBody`, else
  template): check what `frozenDocBody` draws for an EXECUTED upload too,
  and `renderShareViewer` / `viewBody` for the read-only copy.
- Question 2 is answered by reading, then proving: which builders the share
  payload's `viewBody` and the two exporters (`exportWordTracked`, the PDF)
  call, and whether `PORTAL_MODE` or `opts.readonly` ever reaches
  `uploadDocBody`. The owner's belief is a hypothesis; the answer is the
  counterparty's page opened in a browser off a real share of an uploaded
  contract, byte-compared as clause-editor-verify section 11 does.
- Question 3: `uploadDocBody`'s plain branch and `documentTextHtml`
  (`doc-t-*`), the `scaled()` helper, and `.doc-pre` at
  `parseFloat(size)-1.5` — measure the computed `font-size` of the first
  paragraph of the wording on (a) a template draft, (b) an upload with
  structure stored (`docxHasStructure` true), (c) an upload with text only.
  The contract's own size is the sheet's (THE READER'S TEXT SIZE, base 15
  × `--doc-scale`); a branch that sets its own is the fault if so.
- Question 1's pixel count is THE SIX QUESTIONS' refusal 3: window top to
  the first line of the wording, on the same upload, before and after any
  proposal — the contract may not lose pixels, and whatever chrome comes off
  is not put anywhere else on the paper.
- The file strip (`ct_file_strip*`, the acts `flex:none`, facts elide; see
  THE FILE'S OWN SHAPE and THE AUDIT OF J-1 TO J-3) is out of scope by the
  owner's word.
- The proposal, when written, is one plain-English page: the three answers
  with their numbers, then what would be done, then the yes/no. Stale keys
  to name if the block goes: `ct_external_received` (both books, left
  inert); `ct_received_read_below`, `ct_on_their_paper`,
  `ct_executed_outside` are ALREADY stale (THE UPLOAD NAMES OUR ENTITY).

## C-8 THE WORD EXPORT WRITES NO PARAGRAPH FOR THE CODE'S OWN INDENTATION

**The owner's brief, 11 Sep 2026, verbatim and whole:**

> When I export a redlined contract to Word there are massive blank gaps
> between the clauses. It has already been measured, so you do not need to
> rediscover it — here is what was found:
>
> - A real export of an ordinary contract produced 32 paragraphs, 21 of them
>   EMPTY: two or three blank ones before every heading, two after it, and
>   more after each clause.
> - The cause is the page's own code layout. The contract on screen is built
>   from indented markup; a browser ignores the whitespace between the blocks
>   and the Word writer does not — it reads each gap as content, so every one
>   becomes a real empty paragraph in the file.
> - Proved in isolation: two paragraphs with no whitespace between the tags
>   export as 2 paragraphs; the SAME two, pretty-printed, export as 7.
> - Each empty paragraph costs a full line plus the normal 8pt after-space,
>   about a third of an inch, so three in a row is nearly an inch of white.
> - The spacing in the styles is NOT the fault and must not be touched. It is
>   correct; it is simply being applied to paragraphs that should not exist.
>
> Fix it: a paragraph whose only content is whitespace is not a paragraph and
> must not be written.
>
> Conditions:
> - Do it in the WRITER, in one place. Do not reformat the markup the page is
>   built from, and do not change the spacing in the styles.
> - A blank line somebody deliberately typed INTO the contract is different
>   from the code's own indentation. Tell me in plain English whether your
>   fix can tell them apart, and if it cannot, tell me what that costs before
>   you build it.
> - Prove the loop, not just the paragraph count: export, read the file back
>   through our own reader, and show the wording, the headings, the
>   numbering, the tables and the tracked changes all still come out.
> - Write the check so it FAILS on today's code first, and say by how much
>   (the before and after paragraph counts).
>
> Do not fix anything else. While you were in there you would notice that
> the small line under the title exports the middle dot as the literal text
> "&middot;" — that is a separate fault: put one line in BUGLOG under
> "Noticed, not fixed" and leave it alone.
>
> Then give me the usual short plain-English summary.

**Where the one place is (read on 11 Sep; not yet changed).** The writer's
tokeniser is `docxRunsFromHtml` (js/docx.js). Text between tags goes through
`_dxSpace` (which keeps a tab and collapses the rest to one space — see THE
DOCX WRITER) and `push()`, so the newline-and-indent between two blocks
becomes a run whose text is a single space; `close()` then keeps any
paragraph with `runs.some(r => r.text)`, and a lone space is text. That is
the whole fault, and `close()` is the one place: a paragraph is written
only where some run carries a NON-WHITESPACE character, or where it is
`forced`. `docxHtmlBlocks` already drops a whitespace-only block between
tables (`.trim()`), so the table seam is not the case. Nothing else moves —
not `_dxSpace` (the tab it keeps is a hanging indent's, f288), not the
styles' `after="160"`, not the markup the paper is built from.

**The question the owner asked, and what the code says the answer should
be — to be PROVED in a browser, not asserted.** A blank line a person types
in the clause editor is a `<br>`, and `<br>` sets `forced` on the paragraph
it opens, which `close()` keeps regardless — so a deliberate blank line
survives and the indentation does not, by the reading of the code. What the
fix cannot tell apart is a paragraph somebody typed that contains ONLY
spaces or tabs and no `<br>`: that one would be dropped. Measure what the
clause editor actually writes for an empty line (Enter twice) and for a line
of spaces before answering the owner; if the editor writes an empty `<p>`
with no `<br>` for a blank line, that is a real cost and must be said before
building, with the fix then reading an EMPTY block element as deliberate
(no runs at all is not the same as one whitespace run).

**The nets, as the owner set them.** f288 gains: (1) the isolation claim —
two `<p>` with no whitespace export as 2 paragraphs and the same two
pretty-printed ALSO export as 2 (on today's code, 7), the before and after
counts printed; (2) the loop on a real contract body from the harness's own
`renderDocHtml` — export through `docxExportTracked`, read back through
`docxExtractRich`, and assert the wording byte-for-byte, the headings by
level, the numbering markers, a table's rows and cells, and the `<ins>` /
`<del>` runs all come back, with the paragraph count before and after named
in the summary (the owner's own figure was 32 → 11 on one contract); (3) a
deliberate `<br>` blank line still exports as a paragraph. Run the file
against the parent first and record the count it fails at.

**BUGLOG, one line, not a fix**: the small line under the title exports the
middle dot as the literal text `&middot;` (the writer decodes a fixed set of
entities and that one is not on it — `decodeXmlEntities`). Under "Noticed,
not fixed".

### C-7 — MEASURED 11 Sep 2026, on a real HaTi in a real browser (1500×1000). Nothing changed. THE PROPOSAL WAITS FOR THE OWNER'S YES.

Three contracts were filed through the product's own store with the SAME
wording where a like-for-like was needed (`test/helpers` `startHati`, the
admin signed in, the Document tab): an ordinary contract with stored wording,
an upload with its structure stored (same wording), and a text-only upload
(the Word text read out, no structure).

**1. THE HEADER BLOCK, side by side.**

| | ordinary contract | upload (structure stored) | upload (text only) |
|---|---|---|---|
| above the wording | nothing but the paper's own top (the wording's own title) | *EXTERNAL DOCUMENT · RECEIVED · MK-U2* over the name in the platform's face, on its own ruled line — **78 px + 24 px margin**; then the file strip (38 + 16); then *Text read out of the Word file* (21 + 14) | the same block **78 + 24**; the strip; the same caption |
| first line of wording, from the window top | **372 px** | **563 px** (+191) | 483 px |
| wording size (sheet is 14 px × the reader's scale) | 14 px | 14 px | **13 px** |

What the block says that the room header 12 px above it does not: **nothing.**
The room header already prints *Contracts / MK-U2*, the name, *In Review*,
the stream, the round, the value and the date; "received" is what the file
strip says with the file's name, who filed it, Download original and Re-read
document. The block is the id and the name printed a second time, plus the
word "received" printed a second time. It costs **102 px** of paper.

**2. WHETHER IT TRAVELS — yes, both ways, proved on a real link.** The block
is drawn by `uploadDocBody`, which `docBody` dispatches to FIRST for any
record with `source:'upload'`, and `docBody` is what the share payload's
`viewBody` is built from (text-only uploads: `contract.viewBody` was measured
carrying *External Document · received · MK-U1*, the *Text read out of the
Word file* caption AND the file strip's markup) — and, for an upload with
stored wording, the payload carries `source` and `upload`, so the
counterparty's page runs `uploadDocBody` ITSELF. A real review link was
minted for each and opened: **both counterparty pages print "EXTERNAL DOCUMENT
· RECEIVED · MK-U1/U2" over our name in our typeface** (the strip's acts do
not travel; the caption does). The same builder feeds `exportPDF`
(js/views/portal.js, `holder.innerHTML = docBody(c)`) and the phone's document
(js/mobile-contract.js, `docBody(c)`). The sealed copy: see the note below.

**3. THE WORDING SIZE — confirmed.** A text-only upload is set at **13 px**
(`documentTextHtml(u.extractedText, {size:'13px'})` in the text branch of
`uploadDocBody`), against the sheet's own `calc(14px × --doc-scale)`; the
heading in that branch is size + 1, the ruled blocks size − 1.5. It should be
the sheet's own size — 14 px × the reader's scale, the same line-height —
which is what every other wording on that tab is set in; the branch should
stop naming a size and let `.hati-doc` govern (the +1 / −1.5 relations then
follow from the sheet's size).

**THE SIX QUESTIONS, run.** Q1 the general practice: the agreement is drawn
as the agreement; provenance is a fact in the record's header and file
metadata, never a caption on the paper. Q2 the cheapest channel is NOTHING —
every fact in the block is already on screen in the room header or on the
file strip. Q3 the paper gains 102 px; nothing grows. Q4/Q5 not engaged. Q6
the reader lands on the same tab with the wording 102 px higher; the
counterparty's copy stops carrying our filing language; the PDF export and
the phone follow by construction (one builder).

**THE PROPOSAL (nothing comes off without the owner's word).**
(a) Remove the *External Document · received · MK-000* caption and the
platform-face name block from `uploadDocBody`; leave `ct_external_received`
inert in both books and record it stale. In its place draw NOTHING: an
uploaded document is the other side's paper and carries its own title in its
wording (measured — the stored structure's h1, or the text's first line), and
the room header carries the name and the reference. Where the wording carries
no top at all, `docPaperHeadHtml` is NOT drawn either — that head says
"Between us and them" and names OUR market, which is not what a received
document says; say this out loud as the one judgement in the proposal.
(b) Because the block is drawn by the one builder, it leaves the
counterparty's page, the PDF export and the phone with the same change — no
second edit, and the counterparty page is re-measured byte-for-byte after.
(c) The text-only branch takes the sheet's own size (14 px × scale).
(d) Keep, untouched: the file strip (owner's word), and the *Text read out of
the Word file* caption (a fact about the reading the strip does not say —
the owner may rule on it separately).
(e) NOT DONE by this: a record already SEALED keeps whatever copy it froze
(`execution.html` is never rewritten); the seal's hash is over the canonical
text and is not disturbed. Records sealed after the change freeze the paper
without the block.
(f) Nets: a browser file measuring the first line of wording on the three
fixtures before and after (a RELATION: the upload's first line minus the
ordinary's equals the strip and caption alone), the counterparty page for the
text-only upload not containing the phrase, `ct_external_received` read by no
builder, and the text-only wording's computed size equal to the sheet's.

Standing question for the owner, with the yes: (a)'s judgement — nothing at
the top of an upload versus the paper head — and whether (d)'s caption stays.
