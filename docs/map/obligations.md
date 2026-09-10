# HaTi — obligations

*obligations: the worklist, amounts, chains, chasing, the reminder ladder*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## OBLIGATIONS HAVE A HOME (owner-asked 29 Aug 2026 — J-2.1, WORKORDER-29-aug.md)

*"i want to first understand how obligations work in HaTi. I am not sure I
understand how I follow up on obligations per contract"*

**THE ANSWER WAS THAT THERE WAS NOWHERE TO.** A contract's promises lived behind
a card called **Checks** — the things you run BEFORE sending a contract out: the
playbook pass, the risk scan, the brief. An obligation is the opposite. It starts
mattering the day the paper is signed and it outlives every one of those checks.
So a reader asking how to follow one up was being sent to a card whose own name
says it is somewhere else.

**IT IS A READING AND IT ADDS NO STORE, NO ROUTE AND NO FIELD.** Every figure is
counted off `c.obligations`, which the record already carries and which survives
the light contract list. **This phase writes nothing**, and f253 asserts that by
name — `completedAt`, `completedBy`, `seriesId` and `chasedAt` belong to J-2.2
and must not appear here.

- **A FIFTH TAB, AND IT READS AFTER SIGNING AND BEFORE HISTORY** — the order a
  contract's life runs in: what it says, who signs it, what it commits you to,
  then the record of all three. **`ROOM_TABS` IS STILL ONE LIST READ TWICE**: the
  count is a THIRD ELEMENT on the entry, a function of the contract, so the tab
  row and the routing guard cannot come apart. That is the fault the Insights tab
  row paid for, where a new tab drew, registered its press and redrew the
  previous page because the guard was written out separately.
- **ONE FULL-WIDTH CARD, laid out like the History tab** and not like Key terms:
  this is a worklist, so it wants the width and rows ruled edge to edge. Four
  bands — overdue · due this month · later · completed — and **a band with
  nothing in it draws nothing**, the change column's own rule.
- **THE COUNT IS WHAT IS OUTSTANDING, AND IT IS AMBER ONLY WHEN SOMETHING IS
  OVERDUE.** A count that is always coloured is a warning nobody reads — the
  sidebar counts' rule, on a tab. A contract with nothing outstanding draws no
  count at all, because "0" is furniture.
- **A COUNT ON A TAB GOES STALE, so it is PAINTED and not merely built.**
  `wsPaintTabCounts` reads ROOM_TABS and is called from `applyWsTabs` on every
  tab change AND from **`obligationSurfacesChanged`**, which is the funnel every
  act that can move this number already goes through. A new surface joins that
  funnel or it goes stale the first time somebody ticks something off elsewhere.
- **EVERY VERB PRESSES `toggleObligation`.** A second way to complete an
  obligation is the fault this rulebook opens by warning about, and f253 greps
  for one. Every reading is borrowed too — `obState`, `obligationDue`,
  `obligationIsTheirs`, `obligationOwner` — so this tab cannot come to disagree
  with the Calendar about one commitment.
- **"NOBODY OWNS THIS", AND IT IS THE SERVER'S OWN READING.**
  `obligationReminderTo` is the browser twin of the server's
  `obligationRecipient`: email first, then name, case-insensitively, and only
  where the member has an address. **THE INSIGHTS PAGE ASKS IT NOW** — it had
  worked the resolution out for itself when it was built, and two answers to
  "will anybody be told" is exactly how a page comes to contradict the sweep
  that sends the mail. **Drawn only where a reminder could still matter**: a
  completed obligation is nobody's to chase.
- **A REGISTERED ALERT KIND**, `obligation`, amber, ranked **under the approvals
  and over the workspace's own conditions** — everything above it blocks a live
  deal and somebody else is waiting on it; this is work on a contract already
  done and only the reader can clear it. **THE WINDOW IS THE REMINDER MAILS'
  OWN** (seven days, or already late), so the bell and the inbox cannot say
  different things about one promise on one morning. **AN UNDATED OBLIGATION IS
  NOT IN IT** — nothing is ever sent about one, so a row claiming a deadline
  would be the panel inventing it; that silence is the Insights page's subject.
  Borrowed, never derived, and it writes nothing.
- **ONE ENTRY IN `KPI_CATALOG`** — *Obligations due*, dated obligations only,
  amber only when something is late, and NOT in the default four, so it forces
  nothing onto anybody's Home. **Its destination is the Calendar until J-2.3's
  worklist exists**, which is one line to change.
- **NO BAND, STRIP, BANNER OR CALLOUT IS ADDED ANYWHERE IN THIS PHASE.** Every
  count rides a tab, a row or a control.

**WHAT IS DELIBERATELY UNTOUCHED, and each is asserted rather than assumed:** the
reminder ladder (7 / 0 / -1 to the owner, day 4 to the admins); that obligations
stay editable after execution; that they never travel to the counterparty; the
Calendar's own dated view; the Insights obligations page's reading of what has
gone quiet; and the Checks card's other three rows.

Tests: f253 (41 — the one list, the amber rule, the one verb, the four bands,
the server-mirrored resolution, the registered kind and both languages), f148's
tab-row claim REVERSED IN PLACE (five tabs, and Negotiate still not one of them),
obligations-tab-verify (26, browser — the tab as pixels, the count's computed
amber, a real press moving the record AND the count, the bell row driven through
to the tab it names, and the five tabs proved to hold one line at 1280px in both
languages, which is the one way this job could have cost the contract its pixels).

**AND THEN COMPLETION STARTED MEANING SOMETHING (J-2.2, the same day).** Two
states, open and done, and nothing else — so there was no answer to *was it met
on time*, and the Insights page said so on its own data object. And a QUARTERLY
duty ticked off ended for ever: `recurring` was stored, printed on the row, and
read by nothing at all.

**SIX FIELDS AND NO MIGRATION, AND ABSENT MEANS UNKNOWN FOR EVERY ONE OF THEM.**
`completedAt` · `completedBy` · `completedNote` · `seriesId` on the obligation,
`obligationsReadAt` / `obligationsReadHash` on the contract. **The obligations
already ticked off keep exactly the truth they have** — done, on a day nobody
wrote down — and no date is inferred for any of them. An inference dressed as a
record is the fault this codebase has a standing rule against.

- **THE COMPLETION IS WRITTEN IN ONE PLACE.** `obligationMarkDone`, called by
  `toggleObligation` and by nothing else, so the tab, the Checks panel, the
  Calendar and the dashboard all record the same three facts the same way. A
  caller that supplies no date gets today, which is true — it is the day it was
  ticked. **THE DIALOG EXISTS TO MOVE THAT DATE BACK** and to leave one line of
  evidence; it decides nothing and presses the same verb. **FORWARD IS REFUSED**:
  a completion dated after today is a claim about work nobody has done yet.
- **REOPENING CLEARS IT.** A record carrying a completion date under a status of
  'open' is a contradiction the on-time figure would count.
- **A REPEATING DUTY OPENS ITS NEXT INSTANCE — EXACTLY ONE, WITH ITS OWN ID.**
  `obligationNextInstance` is the one builder, so **the dialog names the date it
  will open before the press** and the verb files the object that was named.
  **THE FRESH ID IS LOAD-BEARING**: the reminder sweep's dedupe key is
  `${c.id}:ob:${o.id || due}:…`, so an instance minted without one inherits the
  previous instance's rows and **its reminders never fire, silently** — f254
  proves that against a real server AND proves the control, that reusing the id
  is what would have silenced it.
- **ONE CADENCE STEP FROM THE DATE IT WAS DUE, never from the day it was
  ticked** — a quarterly report due on the 1st is due on the 1st next quarter
  whether it was filed early or three weeks late, and dating from the completion
  would drift a series a month a year. **THE MONTH IS CLAMPED** (31 January plus
  a month is the end of February, not 3 March). **AND THE NEXT ONE MAY ARRIVE
  OVERDUE**, which is true rather than tidy: skipping to the next date in the
  future would quietly erase a missed quarter.
- **THE CONTRACT REMEMBERS THAT IT WAS READ.** `obligationsReadStamp` is written
  only where a reading really happened — a stamp written anywhere else would
  claim one that did not — and **whatever it found**, because a contract read
  and genuinely clear is the case this fact exists to tell apart from one nobody
  has opened. Never where there was nothing to read: below `OBLIG_TEXT_MIN`, the
  reader's own NAMED floor, it is withheld. **This read "by the SCAN and by
  nothing else" until 9 Sep 2026, and is REVERSED IN PLACE by auto-triage on
  upload** (see AN UPLOADED CONTRACT IS READ ON ARRIVAL): that sentence stated
  the right rule by naming its only caller, and auto-triage runs the SAME reader
  through the SAME floor before it stamps. Two callers, each asserted; a third
  that stamps without reading fails f254.
- **THE TWO BLIND SPOTS ON THE INSIGHTS PAGE CLOSE**, which is what that page's
  own claim asked for in its own words. `canSeeScan` and `canSeeCompletedOn` are
  true; the coverage card splits "nothing on file" into read-and-clear and
  **no record of a reading** (never "never read" — a contract scanned before the
  field existed carries no stamp, and calling it unread would be the page
  inventing a fact); the on-time card counts only what can answer and **prints
  the rest** rather than quietly working a rate over the answerable half. Its
  two colours are green and ruby — a third question wants a third pair, and
  amber/ruby already answers "is anything still being sent". The footer draws a
  blind spot only while it is still one, and the wording is KEPT rather than
  deleted: it is right again the day either field stops being written.
- **NOTHING ELSE MOVED.** The sweep reads status and due and has learned nothing
  from this phase; obligations still never travel to the counterparty; they are
  still editable after execution; every existing reading answers identically on
  a record carrying none of the new fields.

Tests: f254 (41 — the six fields both ways, the date refused forward, the series
with its own id, **the dedupe proved on a real server with its control**, the
scan's one caller, the two blind spots and both languages), f247's blind-spot
claim REVERSED IN PLACE (and made stronger — it now asserts that nothing is
guessed), f253's two claims REVERSED IN PLACE, **f68's stage corrected: its
`openModal` was a no-op, which was harmless until something in this file opened
one — a stand-in that cannot behave like the thing it replaces turns its test
into a description**, obligations-tab-verify (33 — the dialog driven, the
reference on the record, and the series opened with the date the dialog promised).

**AND THE WORKLIST, AND THE CHASE (J-2.3, the same day).** The tab answers *what
does THIS contract commit us to*; the question underneath it — **what is waiting
on somebody now, across everything** — had no screen at all. The Calendar
answers *what falls in October*, which is a different question and a worse one
to work from.

- **IT IS A TABLE OF OBLIGATIONS, NOT OF CONTRACTS**, and that is the whole
  difference from the register: a contract with six late promises is one row
  there and six rows here, which is the shape of the morning.
- **IT COUNTS NOTHING OF ITS OWN.** `allObligations` is the one reading of the
  book, `obState` decides overdue, **`obligationBand` decides the pile — the
  SAME four the contract's own tab uses**, so the two screens cannot disagree
  about what "due this month" means, and `toggleObligation` is the one verb.
  The sidebar's count is `openObligations`' own reading of what is late, so the
  door and the page it opens cannot differ.
- **FIVE FILTERS, PER SITTING, IN MEMORY** — whose · state · side · value stream
  · due window. A stored filter lands a reader on a narrowed page a week later
  with nothing on screen saying why, and this page has no saved-view machinery
  to say it with. **A DATELESS OBLIGATION IS IN NO DUE WINDOW**: nothing is ever
  sent about one, and dropping it there is what makes "due in 7 days" mean the
  same thing here as it does in the bell.
- **A ROW OPENS ITS CONTRACT ON THE OBLIGATIONS TAB.** A row that opened the
  Document tab would make the reader hunt for what they pressed.
- **CHASING RECORDS THE FACT WHATEVER THE MAIL DOES.** `chasedAt` / `chasedBy`
  are written on the contract through the ordinary save BEFORE anything is sent
  — that the other side was chased, and when, is the half that pays off at
  renewal, and a fact that depends on a provider being up is not a record. The
  message is the knock on the door, and the route is the only thing that knows
  whether it landed: three honest answers, sent · outbox · refused-and-why.
- **THE ADDRESS IS THE SERVER'S TO DECIDE.** `POST /api/contracts/:id/chase`
  reads the counterparty's address off the STORED contract and **refuses a
  body-supplied one outright** — the open-relay rule the review-request route
  beside it already states. It refuses an obligation that is OURS (chasing is
  what you do about a duty on the other side) and one already done, and
  **nowhere to write is a FACT, not a failure**: the browser has already
  recorded the chase, and the route says plainly that no message went and where
  to put an address.
- **IT ASKS BEFORE IT SENDS** — the one act on this page that leaves the
  building — and **a refusal writes nothing**.
- **AND THE Home CARD LANDS HERE NOW** rather than on the Calendar, which is the
  one line J-2.1's note promised.
- **OBLIGATIONS STILL NEVER TRAVEL.** The chase sends a SENTENCE, never the
  record, and `buildSharePayload` is untouched — asserted, not assumed.

**WHAT IS DELIBERATELY NOT BUILT, said out loud:** on-time reporting BY
COUNTERPARTY, which the work order names as the third piece of J-2.3. The
reading exists (`obligationOnTime`, and `allObligations` carries the
counterparty on every row) and the figure would be honest, but it is only worth
drawing once J-2.2 has been running long enough for most completions to carry a
date — today every workspace would see one panel of "cannot answer". It wants
its own ask rather than a card nobody can read yet.

Tests: f255 (34 — the one population, every filter, the dateless rule, the
door's three registrations, the record-before-the-message ordering, and the
route attacked with a body-supplied address against a real server),
obligations-tab-verify (40 — the worklist driven from the sidebar door, a row
proved to land on the Obligations tab, and a chase driven through its own
confirm with the fact read back off the record).

## AN OBLIGATION CARRIES AN AMOUNT (owner-asked 30 Aug 2026, J-5.2)

An obligation held a description, a due date, a cadence, an owner, a side and a
completion record. **It could not hold a NUMBER** — so *"Second tranche — KES
4,000,000"* was prose that could not be added up, charted or forecast.
Disbursement tracking is the market's word for the thing this one field
prevented.

- **ONE FIELD, `amount`, AND NO CURRENCY BESIDE IT.** The currency is the
  CONTRACT'S, read through `contractCurrency` and shown as a fixed prefix; a
  second currency stored on the obligation is a second answer that can drift.
- **BLANK BY DEFAULT AND NEVER ZERO**, and an obligation saved without one
  carries **no `amount` key at all** — which is why every record filed before
  reads identically and there is nothing to migrate.
- **`obligationAmount` / `obligationBandTotal` ARE THE ONE ARITHMETIC**, asked
  by the contract's tab, the worklist, every band heading and the foot total.
- **MONEY OBEYS THE PRODUCT'S EXISTING PERMISSION**, never a new rule: a reader
  without `canViewValues` sees **no** amount, band sum, total or form row —
  **not drawn at all** rather than drawn as dashes, the register's convention,
  because a column of dashes says a figure is being kept from you. The field is
  CARRIED FORWARD from the record on that path, or opening an obligation would
  silently erase its figure.
- **THE SUM RIDES THE HEADING THAT ALREADY CARRIES A COUNT** — no new box, no
  new panel, no band.
- **A CROSS-CONTRACT TOTAL CONVERTS** through `fxHome` and **says what it left
  out**; a per-contract one does not, because one contract is one currency.
- **THE ONLY NEW THING ON THAT DIALOG IS AMOUNT.** The first render of it was
  drawn from intent rather than from the screen and got six things wrong — the
  worst being that it dropped the "Whose obligation is this?" toggle outright.
  **Draw from the screen.** The amount is on BOTH sides of that toggle: money
  they owe us matters as much as money we owe them.
- **THE VERBS NOW RESERVE ONE WIDTH.** They sat at their natural width and a
  completed row says "Reopen" where an open one says "Done" — measured, an 11px
  difference, which put the due date and the amount on a different vertical in
  every band. A right-aligned column of figures that does not line up is not a
  column.

**NOT TOUCHED, asserted rather than assumed:** obligations still never travel
to the counterparty; the chase message stays one sentence and gains no figure;
the reminder ladder, the four bands and the series machinery are unchanged; and
the contract's own `value` is not reconciled against any of this.

Tests: f259, amount-and-window-verify.

## Find obligations — THE THREE THINGS WRONG WITH IT (owner-reported 30 Aug 2026, J-5.3)

*"what is the purpose of find obligations? It seems to have a bug today."* —
off a charter carrying 18 proposals. **WHAT IT IS FOR**, since the screen never
says: it reads the wording with Copilot and proposes the ongoing duties it
finds, each with the verbatim clause it came from; the reader ticks and nothing
is saved until they confirm.

1. **NO DEDUPE — pressing it twice added everything twice.** 18 → 36 → 54. With
   amounts on obligations that is duplicated MONEY, which is what made it the
   one to fix first.
2. **EVERY PROPOSAL ARRIVED TICKED**, which is what made (1) so easy to hit.
3. **THE CONFIRMATION WAS SILENT** — a bare `toast()` prints nothing in this
   product, so the one act that changes the record said nothing on screen, and
   it was hardcoded English besides.

**`obligationAlreadyOn(c, proposal)` IS THE ONE READING**, matched on the
DESCRIPTION with whitespace collapsed and case folded — the scan mints nothing,
so a proposal's wording is the only identity it and a stored obligation share.
**Asked at the DRAW and again at the ADD**: the checkbox is the sign, the check
inside the handler is the wall. **A duplicate is SHOWN, unticked, with a word
saying why** — never silently dropped, because the reader must be able to see
that the scan found it AND that they already have it. The button counts what
will actually be added, and **the confirmation counts what was already there
off the PROPOSALS**, not off the boxes: the dialog unticks a duplicate on the
reader's behalf, so counting the ticked ones alone said nothing about what it
had set aside. Zero is its own sentence, not a plural form — `tn` knows only
`_one` and `_other`.

**NOT TOUCHED:** the scan, its prompt, its 20-item ceiling, the retry it offers
on an empty result, and the read-stamp it writes.

**AND THE COUNT FOLLOWS THE TICKS (owner-reported 1 Sep 2026).** *"as I exclude
or include any obligations, the count in the highlighted button should in live
reflect the number of obligations checked only."* **IT WAS WRITTEN ONCE, AT THE
DRAW** — right the moment the window opened, because it already left duplicates
out, and then it never moved, so untick fifteen of twenty and the button still
offered to add twenty.

- **ONE PAINTER AND NO SECOND COPY.** The label is not written into the markup
  at all: `obPaintAdd` is the only thing that writes it, so the first paint and
  every repaint go through one reading and cannot come to disagree about what
  the number means.
- **ONE DELEGATED LISTENER** on the window rather than one per row — the list
  runs to twenty on a real agreement.
- **ZERO IS TWO DIFFERENT SENTENCES, which is why the STATE is read and not the
  number alone.** Nothing ticked because the scan found nothing new is a fact
  about the scan (`ob_add_none`); nothing ticked because the reader untied
  everything is their own choice (`ob_add_pick`, the one new key). Telling them
  "nothing new to add" over a list full of new proposals would be the window
  arguing with itself.
- **AND EITHER WAY THE BUTTON IS DISABLED** — this product's own rule: grey
  where it can be known before the press, rather than a refusal after it.

Tests: f260 (a new block, plus the button's literal label claim replaced by the
painter it now goes through), amount-and-window-verify.

## THE PAYMENT CHAIN (owner-instructed 31 Aug 2026, L)

*"Build based on your recommendation"* — off a before/after render of the two
screens that change. **The render is the specification** and
`WORKORDER-payment-chain.md` records the three rulings it settled.

An obligation was a single dated promise. Four tranches of an equipment
purchase were four items in a list with nothing linking them, **so HaTi would
email a supplier about the commissioning payment while the delivery payment was
still unpaid.**

- **ONE NEW FIELD, `after`, AND EVERYTHING ELSE IS A READING OF IT.** Absent
  means not in a chain, which is every obligation on file, so **there is no
  migration and nothing already stored reads differently on any screen** —
  f262's first claim, and the condition on all the rest.
- **BLOCKED IS THE DIRECT PREDECESSOR ONLY, and that is not a shortcut — it is
  what makes it safe.** Step 4 waits on 3 and 3 waits on 2, so 4 stays held for
  as long as 3 is, **with no walk and therefore no cycle to fall into.** A
  record hand-edited into a loop still draws.
- **A POINTER AT A STEP THAT IS NOT THERE IS NOT A BLOCK.** Deleting a step must
  not silently freeze everything after it, on screen or in the sweep.
- **THE READINGS MATCH ON THE ID, NEVER ON IDENTITY.** The worklist hands them a
  SPREAD COPY, so `x !== o` is true of the row's own original — a self-reference
  would then find ITSELF as its predecessor and block for ever.
- **`obligationChains` PARTITIONS**, which is what lets the tab draw the chains
  and then the bands over what is left with nothing appearing twice. Two steps
  pointing at one predecessor is branching, which is deliberately not built.
- **`obState` IS UNTOUCHED, DELIBERATELY.** A blocked step is still open or
  overdue by its own date, so the calendar, the alerts window and every existing
  count behave exactly as they did. **What moved is the BAND** — `waiting`
  outranks `overdue`, because a step nobody could have done is not late by
  anybody's fault — plus the head counts, the door's number and who is chased.
- **A FIFTH BAND, AFTER `later` AND BEFORE `done`** — a **departure from the
  render**, which drew it second. These bands are ordered by what needs you
  first and a waiting step needs nobody; it stays above `done` because the money
  on it is outstanding. Said out loud rather than slipped in.
- **THE MONEY IS ONE ARITHMETIC.** `obligationRoll` returns committed / paid /
  outstanding / overdue, and **paid + outstanding IS committed by construction**
  rather than by three sums agreeing. `paid` is not a new state — it is what
  completing a step already records, so no figure is entered twice.
- **THE WHOLE COMMITTED-AGAINST-PAID READING IS ONE LINE GROWN.** The tab's head
  already carried the counts and the worklist's foot already carried converted
  money and already said what it left out — so it needed **no new screen, no
  card, no panel and no band**, only more figures on lines that were there.
- **AND A DESCENDANT SELECTOR REACHED INTO THE NEW MARKUP.** `.obw-total i` was
  correct while the foot held one figure and one note; each new pair's LABEL is
  an `<i>`, so every one of them took `flex-basis:100%` and wrapped its value
  onto a second line. MEASURED: each pair 36px inside a 17px row. It is
  `.obw-total > i` now. **A rule written for one shape reaches the next one.**
- **THE SWEEP IS THE PAYOFF AND IT IS PROVED AGAINST A REAL SERVER.**
  `srvObligationBlocked` is the server's twin, read off the STORED contract;
  a held step fires **none** of the four milestones; and on the day it comes
  due **one** mail goes to the contract's OWNER (admins where none resolves)
  saying it is held. **The control is written first**: the same obligation,
  same day, same person, unchained — it must still be nudged, or "no mail
  arrived" proves nothing.
- **ONE DOOR ONTO THE ORDER.** The obligation form's "Comes after" picker. The
  render drew an *Edit the order* button on the chain head as well; **it is not
  built** — a second door onto one act is the drift this file opens by warning
  about. It never offers itself, draws nothing where there is no sibling to
  point at, **refuses a loop in words** (bounded, so an already-looped record
  cannot hang the check) and writes the order into the contract's history.
- **HELD BACK IS A SHAPE, NOT A TINT.** The row is set in from the spine and its
  connector is dashed, so colour is never the only carrier — and the browser
  file measures both as computed values, because a rule that loses a cascade
  fight looks perfectly correct in the source.
- **AND IT IS NOT FADED, WHICH REVERSES THE APPROVED RENDER.** That drew the held
  row at `opacity:.74`, and MEASURED that costs more than it buys: the label ink
  falls from **6.31:1 to 3.48:1** on white and the chip from 6.92 to 3.70 —
  **both under AA, on the one row a reader most needs to read to understand why
  nothing is happening.** *An opacity is not an ink*, this file's own rule, paid
  for once already on `.text-ink/40…/60`. The state is still carried four ways
  and none of them is contrast.

**WHAT IS DELIBERATELY NOT BUILT:** branching; a paid state of its own; a trend,
a chart or a fifth Insights tab (ruling 2); and anything at all on the
counterparty's page — obligations have never travelled and still do not,
asserted rather than assumed.

Tests: f262 (62 — the model's edges, the partition, the four figures agreeing,
both renderers, both languages, and **section 13 against a running server with
its own control**), f255's two claims REVERSED IN PLACE (one pinned the literal
four bands and is now the relation it was always about), payment-chain-verify
(34, browser — the chain measured as paint, the set-back and the dashed
connector as computed values, the loop refused through the real toast root, and
completing a step proved to free the next one and not the one after it).

## FIVE THINGS OFF FOUR SCREENSHOTS (owner-reported 31 Aug 2026, M-3..M-6)

Sent with the ruling on Option A, in one message. The work order is
`WORKORDER-fixes-31-aug-pm.md`.

**M-3 — THE SCAN SAYS IT IS WORKING, AT EVERY DOOR.** *"When you click on find
obligations or scanning of obligations, it is not clear that something is
working in the background so provide a symbol that a search is ongoing within
the button."*

- **THE BUSY STATE EXISTED AND REACHED ONE DOOR OF TWO.** `runFindObligations`
  wrote it onto `#ob-find` — the Checks card's door — BY NAME, and the
  contract's own Obligations tab draws `#obt-find`, which was never touched at
  all. That tab is the screen in the screenshot, so on the page the owner was
  looking at a scan taking twenty seconds said nothing whatsoever.
- **`OB_FIND_DOORS` IS THE LIST AND `obFindBusy` IS THE ONE HELPER**, so a third
  door added later joins a list rather than needing two more lines remembered.
- **THE LABEL IS REMEMBERED ON THE ELEMENT**, never rebuilt from a key: the two
  doors do not read the same word, and a helper that put one word back on both
  would silently rename the other.
- **IT STOPS WHATEVER HAPPENS** — the stop is in a `finally`, because a refusal
  deep in the reader (no key, a provider saying no, a document too short) must
  not leave a button disabled and spinning for the life of the page.
- **A SYMBOL, NOT ONLY A WORD**: `.ob-spin`, a ring in `currentColor` so it
  needs no rule per theme or per accent, and STILL DRAWN but not moving under
  `prefers-reduced-motion` — a reader who asked for no motion is still owed the
  fact.

**M-4 — NO DUPLICATE OBLIGATIONS, EVER.** *"Never allow for addition of
duplicate obligations."*

- **THE SCAN ALREADY REFUSED ONE (J-5.3) AND THE FORM DID NOT** — so the one
  door a person types into was the one door with no guard, and since J-5.2 a
  duplicated obligation is duplicated MONEY on every figure that sums them.
- **IT ASKS `obligationAlreadyOn`, THE ONE READING**, rather than growing a
  second: description matched with whitespace collapsed and case folded, exactly
  as the scan matches, so the two doors cannot come to disagree about what "the
  same obligation" means.
- **NEVER AGAINST ITSELF.** The row being edited is left out of the comparison,
  or every second save of an existing obligation would be refused.
- **REFUSED IN WORDS AND BEFORE ANYTHING IS WRITTEN**, naming the wording it
  clashes with.

**M-5 — ONE SEARCH BOX, AND NO NOTE UNDER IT.** *"Remove the search bar on the
left under negotiations because we already have one on top of the screen. Also
remove the 'sorts within each group' writing."*

- The shell bar's box says "Search contracts, clauses, counterparties…" and this
  one said "Full-text: names, parties & clauses…" — two controls answering
  almost the same question, one directly above the other, on the page whose
  filter row is already the crowded one.
- **CONTRACTS KEEPS ITS BOX**: the ask names Negotiations and only Negotiations.
- **THE FTS WIRING IS NOT DELETED.** Every handler already guarded on the
  element existing (`if(si)`, `if(!box) return`, `if(rs&&…)`), so the Contracts
  seat is byte-identical and there is no second code path to keep in step.
- **AND A STALE QUERY ON THAT SEAT NARROWS NOTHING.** The shell bar writes
  `regState().query` and then navigates to Contracts, so a value really can be
  left on the negotiations state — and a page narrowed by a control nobody can
  see is worse than the duplicate box was, because there would be nothing to
  press to widen it again. Ignored in `regFiltered`, the ONE reading, rather
  than cleared in a renderer another path could go around.
- `ngl_sort_note` and `#reg-sort-note` are STALE; the key is left inert in BOTH
  dictionaries, because a key removed from one and not the other is how a screen
  ends up half-English.

**M-6 — THE WORKLIST READS AS A TABLE.** Four reports on one screen.

- **CLEAR STATES ITSELF.** It was live whatever the page was showing, so a
  reader could not tell a narrowed list from a whole one by looking at it, and
  pressing it on a whole one did nothing. Dead and quiet at zero; counting and
  accented above it; the reason on the hover either way.
- **`OBW_DEF` IS THE ONE STATEMENT OF THE DEFAULTS, and it is not "everything is
  All"** — State opens on `open`, which is a cut, so a reading that compared
  against `'all'` would report the page as filtered the moment it was drawn.
  `obwNarrowing` is the one reading and both the button and the controls ask it.
- **AND EACH CONTROL SAYS WHETHER IT IS THE ONE NARROWING** — `--accent-ink`,
  the register's own answer from 25 Aug, rather than a second vocabulary.
- **THE TABLE NAMES ITS COLUMNS**, on the widths it already declares and from
  the same `money` reading as the cells, so the head and the body cannot
  disagree about how many columns there are. Sticky, because this table scrolls
  inside the shell and a head that scrolls away leaves six unlabelled columns
  again. The verb column is deliberately unnamed on screen.
- **THE DESCRIPTION IS CUT TO ONE LINE**, so every row is one height and the
  date column holds one vertical — which is what was reported. **ONE LINE, NOT
  TWO, AND THE DIFFERENCE WAS MEASURED**: unclamped the table held rows of 91px
  and 236px, a spread of 145; clamped to TWO it still held 54 and 72, because a
  row is then one line or two depending on its wording. At one line every row is
  the description plus its meta line and the table has **one** height (measured:
  spread 0px, every row 54). Reserving two lines instead would buy the same
  evenness and spend 18px of white on every short obligation in a list of
  thirty. Nothing is hidden silently: the ellipsis says there is more, the whole
  wording is on the row's own title, and the row is a door to where it is
  printed in full. **THE DOT LEFT THE TEXT FLOW** into a flex row beside it; an
  inline-block dot inside the cut box would have taken the line the wording
  needs.
- **THE OBLIGATION IS THE DOOR, AND IT ALWAYS WAS** — the row has opened its
  contract on the Obligations tab since J-2.3 and nothing said so, which is why
  the report asked for a behaviour the page already had. The description carries
  the underline on hover now.

Tests: f263 (25 — **17 of them fail against the parent**, including the headline
one for each report), obligations-tab-verify unchanged at 41,
negotiations-door-verify's search-box claim REVERSED IN PLACE and re-pinned on
the Contracts seat, contracts-page-verify unchanged at 72.
