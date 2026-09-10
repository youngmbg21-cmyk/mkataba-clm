# HaTi — insights

*the Insights tabs — Portfolio, obligations, payment terms, friction*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## INSIGHTS / PORTFOLIO

COUNTING IS NOT DRAWING (2026-08-11). Each SHAPED panel is now TWO functions: pfWorkloadRunwayData / pfMoneyHeldData / pfPromisesLiveData / pfWonLostData / pfRenewalRunwayData COUNT and return plain data; the renderers DRAW that data and compute nothing. Same shape as intelFrictionStats. The universal six are NOT split — deliberate, nobody asks Copilot about them yet; split one when they do.
- ONE DOOR: pfPanelData(name) / pfPanelsData() over PF_PANEL_DATA. Keys are STABLE ENGLISH (workload_runway, money_held_back, promises_live, won_and_lost, renewal_runway) — a translated title gives a model nothing to match on; the reader's label rides as `title`. pfPanelsForShape() drops a panel this workspace's shape does not draw.
- THE OBJECT CARRIES MORE THAN THE CHART DRAWS, because the question was WHY: per bucket, drivers (top PF_DRIVERS by slice) and `why` (start date on file vs defaulted to the signature date — pfStartSource — and how many start and end in one month); plus `excluded` (couldNotPlace with reasons, outsideTheWindow — work the chart silently dropped before), `method`, `scope` and `measure`. Row lists cap at PF_DATA_ROWS and say so. A cap or an exclusion is a FACT, never a silent trim.
- MONEY AND SCOPE HOLD BY CONSTRUCTION: everything passes through pfWeight (1-per-contract when values are hidden) and counts over state.contracts, the caller's already-scoped bootstrap. money.visible / measure say which the numbers are.
- BOTH TOOL LOOPS carry get_insights_panel: LOCAL_AI_TOOLS + _localToolRun (js/ai.js) asks pfPanelData live; COPILOT_TOOLS + runCopilotTool (server/server.js) READS ctx.insights.panels — copilotInsightsPanel is a lookup, NEVER a calculation. The server has no wsIsProject and must never grow one.
- TWO DOORS, NOT ONE: the panels ride with every brief as ctx.insights; the readable paragraph (aiInsightsBrief) is added to guideLive only on Insights → Portfolio, where relevance is near-certain. ctx.insightsTab tells Copilot which tab is open (the negotiation-room pattern). AI_DISAMBIG_RULES names the panels so "workload runway" is read as this chart and never as team capacity — the reported wrong answer.
Tests: f183 (the split, the drivers, the keys in all three lists, caps/scope/money), f151 (panel figures vs arithmetic over state.contracts), insights-panels-verify (24, browser — the panels draw, and the reported question verbatim reaches a brief and a tool that can answer it).

THE HEAD IS ONE LINE (owner-asked, 13 Aug 2026: "move the highlighted sentence to be next to the word Insights, and move the page up so the dashboards across the tabs have more screen space"). Both halves are ONE change: #page-head is its own flex row ABOVE #body-grid, so every pixel it takes is a pixel #content-scroll does not get — and all three Insights tabs size themselves against exactly that (height:var(--view-h), set by syncViewHeight off the scroll container). Subtitle on the title's own line + a trimmed lead: 63px of header became 36px, and each tab gained those 27px of chart. PAGE_HEAD_INLINE_SUB (js/app.js) is A LIST, NOT AN `if` — Insights is its only member today and the next page joins the list rather than growing a second branch in the markup. NOT the default: most subtitles here are sentences rather than three words, and on the title's line a long one either wraps straight back to two lines or gets cut. IT STILL WRAPS on a narrow window — a header that HID the page's own description to save a line would be trading the wrong thing. The three tabs share one header (it is the shell's, the tabs are the page's), so the claim is really that switching tabs never redraws it differently — asserted per tab. Tests: insights-panels-verify section 5 (30, browser — the two boxes on one line with the sentence to the RIGHT, the header's height, the chart room it bought, all three tabs, and the wrap).

**AND THE HEADER AND THE TABS ARE ONE WHITE CARD** (owner-reported 24 Aug 2026, off a screenshot with both rows ringed: *"the highlighted area should just be one big white card not divided into grey and white"*). The tab strip has always painted itself on `--color-surface`; the TITLE line above it is the shell's `#page-head`, which paints nothing and so sat on the page's grey ground. MEASURED: a transparent 33px band directly on top of a white 42px one, **with no gap between them** — two halves of what reads as one header, in two different colours. **WRITTEN IN THE PAGE, NOT IN THE SHELL**, and that is what keeps it safe: the rule rides a `<style>` block inside `#content`, so it is thrown away the moment the reader leaves Insights and cannot quietly repaint the header of a page that has not asked for it — the register's own precedent, painting the same element the same way for the same reason. The claim is a RELATION (the two resolve to the same colour, whatever the token is, and nothing sits between them) plus one that the rule does NOT follow the reader to another page. Tests: insights-panels-verify section 5b (35 — 3 of them fail against the code of an hour before).

Insights has FOUR tabs since 26 Aug 2026 — Portfolio · Negotiation friction · Obligations · Contract graph — and opens on Portfolio (js/views/portfolio.js, rendered by renderIntel): six panels every business gets. LIVE = everything except Declined — the same definition aiPortfolioSnapshot uses; f151 pins that all surfaces count the same book. NOT on the phone — deliberate (listed under More; note lives in M_DESK).

THE SHAPED FILL: project-shaped panels (workload runway, money held back, live promises, won/lost) or a renewal runway for standing agreements. Which shapes, and the word for a piece of work, are COMPANY settings (js/workshape.js; org record, browser fallback, PUT /api/org/workshape). wsIsProject() is the ONE classification rule — the Settings suggestion, the panels and their counts all call it. Won/lost is the one panel past the live book: won = Signed, lost = Declined, still out = Under Review or draft with a live share; no new status invented.

## WHERE OBLIGATIONS GO QUIET — the fourth Insights tab (owner-asked 26 Aug 2026)

Built from the owner's own approved report. The friction tab beside it asks
where deals get STUCK; this one asks where promises get FORGOTTEN, which is the
quieter failure — a stalled negotiation has somebody waiting on it and a dropped
obligation has nobody at all.

**IT IS A READING, AND IT ADDS NO STORE, NO ROUTE AND NO FIELD.** Every figure
is counted in the browser off `state.contracts` — the caller's own already-scoped
bootstrap — exactly as the friction tab and the portfolio panels are, so it is
live on every draw and there is nothing to schedule or invalidate. f247 greps
both halves for `api(` and `fetch(`: there must never be a route, because how
far behind a company is on its own promises is this workspace's business.

**COUNTING IS NOT DRAWING**, the Insights panels' own rule: `intelObligationsData`
returns plain data and draws nothing, `intelObligationsHtml` draws it and
computes nothing. **AND IT BORROWS EVERY READING** — `obligationDue` for the
date, `obState` for open/overdue/done, `obligationIsTheirs` for the side,
`daysUntil` for the arithmetic, and the live book is the one `openObligations`
reads (not Declined, not archived, nothing already done). A second copy of "is
this overdue" is how two screens come to disagree about one commitment.

**THE CLAIM THE WHOLE PAGE RESTS ON IS "NO EMAIL WILL BE SENT ABOUT THIS", AND
THAT IS NOT THIS PAGE'S OPINION TO HOLD.** `OB_LAST_OWNED` (-4), `OB_LAST_UNOWNED`
(-1) and `OB_BRIEF_FLOOR` (-30) mirror runReminders' own milestones: with an
assignee that resolves to a member the sweep writes to THEM at 7 days, on the
day and the day after, and escalates to admins on day 4; with none it writes
ONCE, to the admins, on day 1; the daily brief carries an item until 30 days
overdue and then drops it. Past the last of those, nothing is ever sent again.
**f247 reads those milestones off server/server.js**, so a change to the sweep
fails there rather than leaving the page confidently contradicting the thing
that actually sends the mail.

**AN OBLIGATION IS SILENT WHEN NO REMINDER WILL REACH THE PERSON WHO OWES IT,
EVER AGAIN** — no readable date (nothing fires at all), or nobody the mail
resolves to (the one admin note on day 1 is a note to a bystander, not a
reminder to an owner), or past the last milestone. **THE REASON ROWS ADD UP TO
MORE THAN THE HEADLINE AND THE PAGE SAYS SO**: an obligation can fail two tests
at once, the headline counts it once, and the overlap is printed rather than
quietly reconciled. The assignee is resolved exactly as the server's
`obligationRecipient` does — email first, then name, case-insensitively, and only
where the member has an address to write to — off the roster every browser
already holds.

**WHAT IT CANNOT SEE IS STATED, NEVER GUESSED.** Nothing on the record says a
contract was ever READ for obligations, so "N contracts with none on file" is
reported as two possibilities (read and genuinely clear, or never looked) rather
than as a finding; and nothing says WHEN one was completed, so the on-time panel
says what field it needs instead of estimating a trend. `canSeeScan` and
`canSeeCompletedOn` are `false` on the data object and flip the day either field
exists.

**COLOUR DOES ONE JOB PER CHART AND NEVER CARRIES A READING ALONE.** OURS is the
workspace accent and THEIRS is amber — the pair has to survive the teal
workspace, the navy one and the dark theme, and two accent-ish hues collapse
into one in at least one of them, which the calendar's own legend already paid
for. On the AGE chart colour answers a different question — is anything still
being sent? — so the first two buckets are amber and the last two ruby, with the
Day 4 and Day 30 marks named under them. Every bar carries its figure and every
legend spells its count out.

**THE TAB LIST IS ONE LIST AND BOTH THE ROW AND THE GUARD READ IT.** `IG_TABS` /
`IG_TAB_LABEL` (labels are KEYS, never resolved strings — the getter trap).
renderIntel's guard was a bare `['frame','map','friction']` written out
separately from the tab row, so the first build's new button **drew, registered
its press, and redrew the OVERVIEW** with nothing anywhere saying why. Nothing
failed and nothing logged; it was found by looking at the page. A fifth surface
is a name added to that list and nowhere else.

**WHAT WAS DELIBERATELY NOT BUILT, said out loud**: no row on this page is a
door yet. The approved report is a reading, the numbers and the lists behind
them do not yet match one-for-one anywhere in the register, and a door whose
destination narrows differently from the figure above it is the fault Home's own
rule exists to prevent. The `<details>` chase list is the one disclosure.

Tests: f247 (30 — the one list read by both halves, counting-not-drawing, the
milestones read off the server, the live book, every panel's reading, and both
languages), obligations-report-verify (27, browser — the press DRIVEN and what
arrives read off the page, every headline figure checked against the number the
counter returned, the ours/theirs pair measured as computed colours in light,
dark and the navy workspace, three laptop widths with no sideways scroll, and
the empty book). `buildWorld({intelView:true})` is new and pulls js/obligations.js
under it.

## PAYMENT TERMS, TURNED INTO A NUMBER — the fifth Insights tab (owner-ruled 2 Sep 2026)

*"How could we incorporate ensuring we have KPIs of the portfolio payment
terms?"* — then, off three drawn options: build the **cash-gap page (A) with
the exception list (B) folded into it**, the Home tile counts **BOTH sides**,
and the tab sits **after Obligations**.

**THE PREMISE WAS HALF RIGHT, AND THE HALF THAT WAS WRONG IS THE FEATURE.**
Payment terms were already captured in five places — Copilot's extraction, the
upload confirm screen, Key terms, the phone card, and the playbook, which has
held the standard (45 days, an admin setting) since it was built. What was
missing is that the record holds a SENTENCE — *"30 days from invoice"*,
*"Net 45"*, *"within sixty (60) days of delivery"* — and nothing can average a
sentence.

- **`js/payterms.js` IS THE READING, AND ITS OWN FILE IS LOAD-BEARING.** Two
  surfaces ask it. Written inside either view, the other would read it through
  `window` on a stage that does not carry that view, get `undefined`, and count
  **zero, silently** — the rlPaperFootHtml family. Its own file, loaded before
  both, cannot fail that way. Same shelf as js/precedent.js: a deterministic
  reading with no view, no store, no route and no field.
- **IT READS THE RECORD, NOT THE WORDING.** `metadata.paymentTerms` is already
  the product's reading of the document — extracted, printed back with its own
  verbatim phrase for a person to confirm, overtypeable on Key terms.
  Re-parsing the agreement on every dashboard paint would be slow AND could
  disagree with what the reader confirmed. **So "not recorded" MEANS
  something**: nobody has read this contract yet, which is the actionable fact
  and why the count is printed rather than folded away.
- **THREE OTHER PARSERS EXIST AND ARE DELIBERATELY UNTOUCHED, said out loud
  because the proposal put to the owner overstated it.** js/playbook.js reads
  days out of the full CONTRACT TEXT for its standards check; js/precedent.js
  reads them out of a CHANGE's wording. Different questions on different
  inputs, so not copies of this one — and re-pointing them would change what
  two other features report.
- **THE STANDARD IS THE PLAYBOOK'S, PER CONTRACT KIND.** No new setting, and
  because the playbook is per contract type, supply paper can carry a different
  limit from services with nothing more to configure. `PAY_STD_FALLBACK` is the
  answer for a stage without js/playbook.js and **f267 pins it to
  DEFAULT_PLAYBOOK's own number**, so moving the playbook's value fails there
  rather than leaving this one stale.
- **OVER STANDARD IS ASKED OF EACH CONTRACT'S OWN STANDARD, never of a bucket.**
  The buckets are a picture; the count has to be exact. The dashed rule is drawn
  after the last bucket wholly inside the standard, which is the safe direction
  — a standard of 50 shades the 46–60 bucket whole, because that bucket really
  does hold contracts over it.
- **THE AVERAGE IS WEIGHTED BY VALUE AND SAYS SO.** A plain mean lets twelve
  small agreements outvote the one that carries the book. Where money is hidden
  from this reader, or nothing carries a value, it falls to a straight mean and
  `basis` changes with it, so the figure never claims a weighting it did not use.
- **WHERE NO MONEY PASSES THERE ARE NO PAYMENT TERMS.** `isMonetary` is the
  product's one answer, so an NDA is never counted and never reported as "not
  recorded".
- **NOTHING IS FOLDED AWAY.** What cannot be read is counted OUT of every figure
  and NAMED; a contract with no category sits on neither side and says so; and
  every contract in the book lands in exactly one pile (f267 asserts the four
  add up to it).
- **THE TILE COUNTS BOTH SIDES AND NAMES THE HALVES APART** (owner-ruled). One
  number carries both only because "outside standard" is read in each side's own
  direction and the sub-line says which half is which — *17 where you wait · 10
  where you make them wait*. A customer on ninety days costs cash; a supplier on
  ninety is cash you keep and a governance fact besides. **It borrows
  `payOverStandard`** rather than counting again, so the tile and the tab cannot
  disagree. Amber only when something is actually over; **not in the default
  four**, so it forces itself onto nobody's Home. **Its destination is the TAB**,
  through `intelGoTab` — the one named door — because the two halves can only be
  told apart there and a mixed list of contracts in a table would not explain
  itself.
- **THE TAB IS ONE LIST.** `IG_TABS` gained 'payterms' between 'obligations' and
  'map', read by the row AND by renderIntel's own guard. A fifth surface is a
  name added there and nowhere else — the fault the obligations tab paid for.
- **COUNTING IS NOT DRAWING.** `payTermsData()` returns plain data;
  `intelPayTermsHtml` draws it and counts nothing. The drawing BORROWS the
  obligations tab's own card vocabulary (obCard, OB_CARD, OB_NUM, OB_OURS,
  OB_THEIRS) rather than declaring a second set that agrees today.
- **COLOUR DOES ONE JOB**: OURS is the workspace accent (money coming in),
  THEIRS is amber (money going out) — the obligations report's own pair, for its
  own reason. Every bar carries its figure, every legend spells its count, and
  every exception row names its side in words.
- **THE HONEST LIMIT IS A CARD ON THE PAGE**, and it is the most important thing
  on the tab: HaTi reads agreements, not your bank. Whether people pay to the
  terms they agreed, and how late they run, both need the accounting system.
  Named so the page never looks as though it is answering them.

Tests: f267 (59 — the parser, the reading, the standard as a RELATION, the
aggregate, the four piles adding up, the exceptions, the tile borrowing the
tab's count, the tab as one list, no store/route/writes, and both languages),
**payment-terms-verify (39, browser — the press DRIVEN and what arrives read off
the page, every printed bar figure checked against the number the reading
counted, bar heights following their own counts, the standard rule inside the
plot, an exception row pressed through to its contract, the tile pressed through
to THIS tab, four laptop widths with no sideways scroll, and both languages)**.
Two claims REVERSED IN PLACE — f247 and obligations-report-verify each pinned
the tab row as a LITERAL where the claim was that tab's own PLACE.

## TWO TARGETS, AND WHAT IS DRIVING THE GAP (owner-ruled 2 Sep 2026)

*"i do not understand this chart. What if we want to pay under one payment term
while we get paid under a different payment term?"* — then, on the answer:
*"How will i then identify the contracts that are driving the gap if I want to
address them?"* Both were holes in the tab above rather than misreadings of it,
and the second is the one that mattered.

**THE PAGE TOLD THEM THERE WAS A PROBLEM AND THEN TOLD THEM NOTHING WAS
WRONG.** On the owner's own book the gap card read **15 days** and the
exceptions card read *"Every contract with terms on file sits inside your
standard"* — both true, because being paid in 45 against a 45-day limit and
paying in 30 is two perfectly compliant contracts and a 15-day gap. **Being
past the standard and driving the gap are simply not the same list**, and only
the first was built.

- **TWO TARGETS, ONE PER SIDE, AND ABSENT MOVES NOTHING.** `payTargets()` reads
  `settings.payTargets`; **null means nobody has set one and the playbook
  answers exactly as it did**, so every workspace already running is
  byte-identical and there is nothing to migrate. **A target that IS set wins
  over the playbook for its own side**, deliberately: the default playbook
  carries `paymentDays` for every kind, so a playbook that won would leave the
  pair unable to reach a single contract anywhere. **ONE PAIR, WORKSPACE-WIDE**
  — per type AND per side is four numbers an SME would have to keep true, and
  the two questions a treasury policy asks are how fast money should come in and
  how slowly it may go out. It rides the ordinary settings blob like the review
  gate's switch: a pair of numbers is not an access map, so the H-3 reasoning
  that gives `folderAccess` and `signFolders.by` atomic routes does not apply.
- **ONE BASIS FOR THE PAGE, NEVER ONE PER SIDE — a correctness fix, not a
  cosmetic one.** `avg` decided per side, so a book where one side's contracts
  carry a value and the other's do not printed *"weighted by value"* under one
  figure and *"averaged across"* under the other twelve pixels away — and made
  **THE GAP the difference between two numbers worked out different ways**.
  Value only where money is visible AND every side that has rows can actually
  be weighted; otherwise both are a straight mean.
- **THE DRIVERS ARE ONE CONTRACT AT A TIME AND EXACTLY TRUE:** bring this one
  onto its side's target and the gap closes by this many days, holding
  everything else where it is. Its share of its own side times its distance from
  the target in the gap-widening direction — later than target on the money
  coming in, **sooner** than target on the money going out. **IT DOES NOT ADD UP
  TO THE GAP AND NEVER CLAIMS TO** (the contracts pulling the other way are
  floored out), so a figure is printed per row and no total. **The share follows
  the BASIS above**, so the list and the two headline averages cannot disagree.
- **A CONTRACT CAN BE AN EXCEPTION AND NOT A DRIVER, and that is the feature
  working.** Paying a supplier in 95 days against a 60-day limit is past the
  standard AND narrows the gap. Both lists are drawn, and the drivers card is
  drawn only where there is a gap against us — over no gap it would be
  furniture.
- **NOTHING IS SHADED ANY MORE.** The region ran from the standard to the right
  EDGE, so on an ordinary book three of five bands were a large amber block
  holding nothing — the biggest object on the chart, saying that nothing is
  there. **A boundary is a LINE**, and with a target per side there are two, in
  their own colours, so a reader can tell which bars each governs; where the two
  coincide there is one, captioned as the shared standard. A side with no rows,
  or one whose contracts carry two different playbook limits, gets **no line**
  rather than one implying it governs the rest.
- **THE CAPTION SITS ON ITS LINE, UNDER THE AXIS.** Hung to the right at the top
  it read as a label for the shaded block; under the axis there is guaranteed
  room and a mark there reads as an axis annotation. One row per line, so two
  captions can never collide however close the targets are, and clamped at both
  ends.
- **A BAND PAST ITS SIDE'S LINE IS MARKED IN RUBY, NEVER AMBER** — amber is
  already the money-going-out side on this chart, so an amber figure over an
  amber bar would say nothing. Only where the WHOLE band is past
  (`payStandardSplit`'s own rule), so the mark can never over-claim; the exact
  counts are still `payOver`, per contract.
- **PAYMENT TERMS IS A GRAPH LENS, AND ALL FOUR DOORS LEARNED IT** — the Group
  by dropdown, `groupLabelOf`, the *"grouped by"* line, and Copilot's own phrase
  router. A dropdown offering what the sentence cannot is the drift this file
  opens by warning about. It **borrows `payBucketOf`**, so the graph and the tab
  can never sort one contract two ways, and a contract nobody has read the terms
  off is its own group rather than being pushed in with the shortest.

**AND TWO SELECTORS IN THE BROWSER FILE HAD TO BE NARROWED, which is the lesson
worth carrying.** A second card carrying `data-pt-open` rows made the exceptions
check count a list twice its own length, and `[role="img"] > div + div > span`
matched the new caption row as well as the axis. **Both were still green
sentences over the wrong elements** — when a card or a row is added beside one a
probe already reads, re-check what the probe is actually holding.

Tests: f267 (94 — sections 11-14 new, **30 of them failing against the parent**),
payment-terms-verify (60, browser — **22 failing against the parent, the
headline one reporting `1 filled box(es) behind the bars`**; the two targets
typed into the real panel and the chart's two lines measured as paint, the gap
list pressed through to its contract, and the graph regrouped for real).

## ONE TABLE, AND THE GRAPH FILTERS IT (owner-asked 2 Sep 2026)

*"make this one scrollable table with only 'What is driving the gap'. It should
have columns for contract number, value stream, and value as well. Also make
the page interactive so that when you click on the graphs they filter the table
accordingly."* Then, ruled by picker: **add payment terms as a filter on
Contracts, and KEEP the tab.**

- **TWO CARDS BECAME ONE POPULATION WITH THE FACTS AS COLUMNS.** *Driving the
  gap* and *past your standard* are different questions and a contract can
  answer one, both or neither — stacked as two lists, the same contract appeared
  twice and had to be read twice. `payTermsData().rows` is every counted
  contract with BOTH answers on it, ranked by the gap, so the drivers lead by
  construction and the rest of the book sits behind them. **NOTHING IS COUNTED
  TWICE**: `drivers` and `exceptions` are untouched and a row's `gapDays` IS its
  drivers figure, so the head's two counts and the rows cannot disagree.
- **EVERY COLUMN IS A FRACTION, NEVER `auto`, and this was MEASURED rather than
  reasoned.** The head row and the data rows share ONE template string — and
  still drew columns 65px and 37px wide, because `auto` sizes to CONTENT and two
  grids size independently. **A shared template string is not a shared layout;
  only fractions resolve alike.**
- **AND THE HEAD IS STICKY INSIDE THE SCROLLER, not a sibling above it.** A
  sibling stops being the same width the moment the scroller grows a scrollbar,
  and then the head and the rows come apart again. Inside and sticky is both
  "stays put" and "exactly as wide as the rows".
- **THE STREAM TRAVELS AS AN ID AND IS NAMED AT DRAW TIME.** `FOLDERS` belongs
  to the screens, and a name resolved in the reading would freeze whatever
  language was current when it ran — the getter trap this file records four
  times over. The lookup is guarded, so a stage without FOLDERS draws the table
  rather than taking the page down.
- **A BAR IS A CONTROL.** A real `<button>`, so it is reachable without a mouse;
  an EMPTY bar is `disabled`, because a press that could only narrow the table
  to nothing is a dead press and greying is what this product does where it can
  know that before the press. Pressing the live cut again clears it, so the way
  back is on the thing the reader pressed as well as on the table's own line.
  The legend chips narrow to a side the same way.
- **A PRESS REPAINTS THE BODY, NEVER THE VIEW.** `ptRepaint` replaces
  `#ig-pt-body` and re-arms the listeners on the markup it has just replaced;
  `renderIntel` would rebuild the tab strip and the header and lose the reader's
  place in a scrolling table. The scroll offset is kept across the repaint.
- **THE CUT IS PER SITTING AND IN MEMORY** (`intel.ptCut`), like every other cut
  on this page: a stored one would land a reader on a narrowed table a week
  later with nothing saying why. **It cannot be quietly on** — the table names
  the cut in words, prints *showing N of M*, and carries **Show all**.
- **PAYMENT TERMS IS A FILTER ON CONTRACTS**, in the `REG_BAR_FILTERS`
  catalogue, **NOT one of the default four** (the bar fits one line and keeping
  it there is the owner's own ruling, WO-15) — so it lives behind *Adapt
  filters* and **draws on its own the moment it is narrowing**, which is that
  catalogue's own safety property. It **borrows `PAY_BUCKETS` and
  `payBucketOf`**, so the register and the tab can never sort one contract into
  two bands, and `none` — *not recorded* — is the worklist that gets the rest of
  the book read, which is the actionable cut on this subject rather than an
  absence folded away. Read through a `typeof` guard so a shell without
  js/payterms.js narrows nothing rather than emptying the register.
- **`pt_exc_title` AND ITS CARD ARE GONE, NOT HIDDEN**, and f267 asserts the
  key is unreachable — but the FACT is not lost: `over` is a ruby tag on the
  row's own terms cell and the count is a second flag on the table's head.

**AND A PROBE THAT THROWS PROVES NOTHING**, paid twice in this file now: the
parent run aborted first on `x.rows` being absent and then on a click waiting
for `[data-pt-bar=""]`. Every reading is defensive and every driven half is
guarded, so a build without the feature REPORTS its 20 failures instead of
timing out.

Tests: f267 (121 — sections 15-17 new, **24 failing against the parent**),
payment-terms-verify (73, browser — **20 failing against the parent**; every
press DRIVEN, the two grids' resolved column widths compared as paint, and the
register's filter turned on from the model to prove it draws itself).

## THE CARD HOLDS WHAT IS AGAINST YOU, AND IT PAGES (owner-ruled 2 Sep 2026)

*"This table should be the same height as the chart above it. If the list is
long then it will have pages to click to. This table should also only contain
contracts that are greater than the company standard / preferred payment
terms."* Then, on the two readings of that last sentence: *"the card should
have contracts that put you at a disadvantage when it comes to payment
terms."*

- **THE TWO READINGS ARE NOT THE SAME LIST, AND THE OWNER RULED ON WHICH.**
  "Greater than the standard" read literally is `payOver` — days > standard on
  both sides — and on the SUPPLIER side that is a contract you pay LATER than
  your own policy, which is money you KEEP. Read as *at a disadvantage* it is
  the opposite contract: one you pay SOONER than you need to. **On the customer
  side the two coincide; on the supplier side they are mutually exclusive.**
  `disadvantage` is the ruling, `over` is still stamped on every row, and the
  literal reading lives on the Contracts filter.
- **`gapAway` MOVED ONTO THE ROW AND IS COMPUTED FOR EVERY CONTRACT.** It was
  worked out inside the drivers loop, where a contract carrying no value on a
  value-weighted book gets a SHARE of nil and so fell out entirely — its terms
  are just as bad, and its size is a different fact. The drivers now read the
  row's own distance rather than recomputing it, so there is one arithmetic.
- **`against` IS THE CARD'S POPULATION** and the head's count is that reading's
  own length. The over-standard flag came off the head: a count of something
  the table does not hold is a number that argues with the rows under it. The
  **OVER** tag stays on the rows where it applies.
- **AN EMPTY CARD SAYS WHICH KIND OF EMPTY IT IS** — a cut that matched nothing
  is a different fact from a book with nothing against you, and the second is
  good news rather than an absence.
- **THE HEIGHT IS THE CHART'S, MEASURED AND NEVER TYPED.** `ptFitTable` reads
  the chart card's own rect — the chart is found by the plot inside it, so
  `obCard` keeps its signature — sets the table card to it, and the page size
  falls out of the room that is left. **`rowsThatFit` is deliberately not used**:
  it measures from an element's top to the SCROLLER's bottom, which is "fill the
  rest of the screen", and this box is bounded by the card above it instead.
  A zero is not an answer, and it re-fits only when the answer changes, so it
  cannot loop; a ResizeObserver on the chart follows a window resize.
- **PAGING IS WHAT LETS THE HEAD ROW BE A PLAIN SIBLING AGAIN.** A scroller
  grows a scrollbar and the head stops being the same width as the rows, which
  is why it had to be sticky INSIDE it; a paged region is `overflow:hidden` and
  never has one. **The columns are still fractions** — that half is unchanged
  and is what makes two grids resolve alike at all.
- **THE PAGER IS THE REGISTER'S OWN SHAPE**, prev / numbers with an ellipsis /
  next, sharing `reg_page_of` so there is one wording for "page N of M". It is
  written out rather than borrowed because `regPager` is bound to the
  register's own state and attribute; **a THIRD pager is the point at which the
  builder should be lifted out**, and that is said where it stands.
- **THE PAGE IS CLAMPED AND A NEW CUT STARTS AT ONE.** A narrowing can shorten
  the list under a reader who is on page 3, and stranding them on a page that
  no longer exists is the fault the clamp exists for. Per sitting, in memory,
  like the cut beside it.

Tests: f267 (142 — sections 18-19 new, **24 failing against the parent**),
payment-terms-verify (81, browser — **14 failing against the parent**; the card
and the chart measured as paint at the same height, the rows proved not to
spill, and the pager DRIVEN through to page two with the slice read back off
the page).

THE WEEKLY REVIEW (js/views/weekly.js): deterministic document, window.open first then fill, five fixed slots (slot 5 "what we did not look at" prints every week), sizes add pages AFTER the five. Reached from Reports. No model writes a word.
