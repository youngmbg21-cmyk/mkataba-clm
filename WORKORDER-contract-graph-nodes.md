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
