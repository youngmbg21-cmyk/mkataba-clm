# HaTi — playbook

*Our standards and the playbook check*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## PLAYBOOK FINDINGS ARRIVE OPEN

pbUI records what is SHUT, so a finding arrives read and pressing it folds it. Deliberate asymmetry with change cards (forty cards arrive as a wall; a handful of findings IS the panel's content). The fold is keyed by pbFoldKey (contract + category, never row index), in memory, never persisted. Quotes live in the review panel ONLY (the Key-terms reprint was removed); the one standing sentence in Key terms stays — it explains why governing law and the liability cap are not rows, drawn with or without a run. Tests: playbook-opens-read-verify (22, browser); f178's Key-terms assertions untouched.

**AND APPLYING ONE TAKES YOU TO IT (owner-reported 10 Sep 2026:** *"When I click
on apply this suggested wording it needs to take me where it has been added in
the contract."*). It filed, repainted the room and left the reader on the
Document tab with a toast saying to go and look — **while the "Show me" button
eight rows below it had done exactly that journey since it was built.** So the
walk existed and the one press that most needs it could not reach it.
**`pbShowInsert(c, x)` is that button's own reading, LIFTED rather than copied**
— two answers to *where did it go* is how the button and the press come to land
in different places — with exactly two callers, asserted. It tries the
document-side jump FIRST (a proposal lives in the negotiation until it is
accepted; only then is it in the document), then opens the workbench and
scrolls to the clause on the beat that button has always used. **`closeModal` is
what takes the side panel down** — the panel `openSidePanel` draws wires its own
✕ to it — and a `closeSidePanel()` written here first named a function nothing
publishes, which would have left the reader on the negotiation behind a drawer
about the page they had just left. **THE JOURNEY IS LAST**: persist and the
repaint run first, so a failure in the walk cannot cost the filing. The toast
now says WHAT HAPPENED (`pb_proposed_as`, naming the fingerprint) rather than
where to go, because by the time it is read the reader is looking at the clause.

## A STANDARD THAT IS ALREADY HERE IS SAID BEFORE IT IS ADDED (owner-reported 10 Sep 2026)

*"make sure that when someone is adding a duplicate clause from the playbook /
standards that the user is alerted before it is applied."* The reported screen
carried two pending asks headed QUALITY & REJECTION — one the clause library's
wording, one the model's draft.

- **THREE DOORS, AND NONE COULD SEE THE OTHER TWO.** Adding a standard files an
  `insertClause` ask and `negoInsertClause` mints a FRESH clause id every time,
  so two adds are two clauses. The doors are the Playbook review window, the
  clause editor's scan rail (both through `rlFilePlaybookProposal`) and the
  panel's *Apply suggested wording as a redline* (`applyClauseRedline`, which
  also serves the clause library picker).
- **THE HEADING IS THE IDENTITY, and it is structural rather than parsed out of
  prose.** Every door names the new clause from the standard's own name through
  `clauseHeadingFor` — one function, which only ever changes CASE to match the
  paper — so `headingText` on the change IS the standard's name and two adds of
  one standard carry the same one. It also catches a clause a PERSON wrote by
  hand under that heading, which a note-parsing reading would miss.
- **IT READS BOTH PLACES A CLAUSE CAN BE**, because they are two different facts
  with two different remedies: already ON THE TABLE as somebody's pending ask,
  or already IN the agreement. A standard the scan called missing while the
  document plainly carries a clause by that name is the scan being wrong, and
  warning is right there.
- **EXACT AFTER FOLDING, NEVER FUZZY.** Case and punctuation go and nothing
  else: "Quality & rejection" and "QUALITY & REJECTION" are one name, "Quality
  Assurance & Rejection" is not. A looser reading would nag on ordinary adds,
  and a warning that fires when it should not is how a reader learns to press
  through the one that matters.
- **WORK THAT IS OFF THE TABLE DOES NOT COUNT** — withdrawn, superseded and
  rejected asks are all gone from it; an ACCEPTED insert is deliberately IN,
  because its wording is what stands. And a `modify` is never a duplicate: it
  changes wording in place.
- **IT READS WITHOUT WRITING, and my own first writing of it did not.**
  `negoClauseList` calls `negoInit`, which CREATES a negotiation and stamps
  clause ids into the stored wording — so the document half started a
  negotiation on any contract it was merely asked about. It is guarded on
  `c.negotiation` already existing, which costs nothing at any real door (both
  callers arrive from a page that has opened one, and `applyClauseRedline` calls
  `negoInit` itself two lines above the ask) and means a sweep written later
  cannot turn this into a write. **Caught by f279 (4), which was written for
  exactly that trap.**
- **THE MODEL RETURNS A SHAPE AND DRAWS NOTHING.** `negoDupClauseAsk` builds the
  question in `confirmDialog`'s own shape and the door puts it up — a model
  function with a dialog in it is the fault this rulebook records by name. **No
  door writes a sentence of its own**, so three surfaces cannot come to warn
  about three different things.
- **IT REFUSES NOTHING.** Two clauses on one subject is sometimes exactly right
  and only the reader can tell, so this is a question with the way forward on
  it. A no returns null, which every caller already handles. **ONLY ON AN ADD** —
  a deviation that edits a located clause duplicates nothing.

Tests: f279 (8 — **all eight fail against the parent**),
playbook-opens-read-verify (22 — **8 fail against the parent**, the headline
ones reporting *"no dialog came up"*, *"on the negotiation: false"* and the
owner's own screenshot as a number: two presses filing 1 → 3).

## A RULE ONLY TOUCHES A CLAUSE OF ITS OWN KIND (owner-asked 26 Aug 2026)

The third and last of the playbook-scan fixes, built from
WORKORDER-clause-kinds.md after the owner ruled yes. A and the matcher's
refusal took the reported risk off the table; **this is the one that stops the
reading being statistical.** Every clause gets a kind from its own heading,
every playbook position already names the kind it governs — its CATEGORY is its
name — and a rule may only ever reach a clause of its kind.

**ONE TABLE, AND IT ALREADY EXISTED.** `js/precedent.js` has carried this exact
vocabulary since W3-2 — key, playbook category, cue pattern — to decide which
standard a settled argument was about. A second copy is the duplication this
file opens by warning about, so **`CLAUSE_KINDS` in js/clausemodel.js is the one
vocabulary and `PRECEDENT_TOPICS` is built FROM it**, joining its own numeric
columns (`num`/`unit`/`dir`) on by key. **It lives in clausemodel because every
test world already loads that file and none of them loads precedent.js** — put
there, the feature would have been silently off in every existing world. f222
(32) is what proves precedent did not move by a byte.

**THEY ASK DIFFERENT WORDS OF IT, AND THAT IS NOT TWO READINGS.**
`precedentTopicOf` reads a CHANGE, which has no heading of its own, so it asks
the label then the wording. `clauseKind` reads a CLAUSE, which has one — and
asks **THE HEADING AND NOTHING ELSE.**

**WHY THE HEADING ALONE, since the body is right there.** A heading is the
clause's own statement of what it is for, which is a FACT; a body is full of
cross-references to other topics, which is a trap. A termination clause
routinely says *"shall not affect accrued rights to payment"*, and a body
reading types it as a payment clause — the mis-type then hides every
termination finding, which is **the mirror of the reported bug and the one way
this feature could do harm.** Heading-only cannot make that mistake: right on
headed paper, BLANK on an unheaded wall of paragraphs, which is the safe answer
rather than a guess. **This is stronger than the work order, which allowed the
body as a fallback.**

**A HEADING SAYS IT IN DIFFERENT WORDS FROM A BODY, and the measurement is what
found it.** With the body cue alone, MEASURED on HaTi's own twelve built-in
templates: **31% of clauses typed, and the misses included "Lease Charges" — the
very clause from the report that started all this** — along with "Price &
Contract Value", "Service Charge" and "Tolling Fee". A payment clause's BODY
says *invoice* and *payable*; its HEADING says *Charges* or *Price*, and neither
vocabulary contains the other. So each topic carries **both** `re` and `head`,
and `clauseKind` matches on EITHER — it can only ADD coverage, never lose what
the body cue already caught. **`re` IS UNTOUCHED**, which is what keeps
precedent identical. **48% after**, and "Lease Charges" types as payment.

**THE TWO PATHS THROUGH `rlPbFindClause` ARE TREATED DIFFERENTLY, and that is
the whole safety argument:**
- **CONTAINMENT IS CERTAINTY AND A KIND MAY NOT OVERRULE IT** — but it is
  certainty about ONE clause only. The same boilerplate can sit in two, and the
  old single pass returned whichever came first, **silently**. Containment now
  collects its matches: exactly one is returned with the kind never consulted;
  several are broken by kind; and a tie the kind cannot break returns null
  rather than a coin toss, which is this matcher's own standing rule.
- **THE OVERLAP SCORE IS A GUESS**, so the kind narrows the field before it
  runs. **A clause whose kind is UNKNOWN always stays a candidate** — f131's
  "an unknown clause kind stays a candidate" passes before AND after on purpose:
  it is not a regression test, it is the WALL, and its job is to fail the day
  somebody tightens this to "kind must MATCH" and quietly empties every unheaded
  upload of its findings.

**NARROWING TO NOTHING RETURNS NULL, AND NULL IS NOT LOST**: `landing` reads it
as 'unplaced', the rail draws it on neither list, and the whole-document
Playbook review names it with its quote so the reader can go and look.

**`category` IS THE ONLY NEW ARGUMENT** and it is optional — absent, the matcher
behaves exactly as it did, which is what leaves every older caller untouched.
Two callers pass it: `rlPlaybookProposals` and `ceClauseDeviations`.

**THE FIVE ACCEPTANCE CONDITIONS ARE TESTS, NOT ASPIRATIONS.** Nothing is
printed and nothing is stored (a sweep over js/ and js/views/ that fails on the
kind being interpolated into markup or assigned onto an object — `kind` alone is
far too common a word here to sweep for); unsure holds nothing back; it only
narrows and can never conjure a match; no new store and no route; the three
landings unchanged.

**WHAT THE MEASUREMENT SAYS ABOUT REACH, said out loud rather than claimed
away.** On 50 real lawyer-marked agreements read as RAW TEXT, about half get at
least one typed clause; per kind the heading types 10–21 of 50 while the subject
appears in 46–49 of 50. So on third-party paper this fires perhaps half the
time and is off the rest, which is the safe direction. Two caveats on that
figure: the measurement's own heading detector is crude on raw text (HaTi reads
headings from real `<h2>` elements, so its real coverage is higher), and
data protection types 0/50 because the subject appears in only 1/50 of that
largely pre-GDPR corpus — not a failure of the reader.

**WHAT IS DELIBERATELY NOT DONE.** 'Quality & rejection' and 'Stamp duty' are
playbook categories with no kind, so `ruleKind` answers null and the filter is
off for them — correct, and cheaper than inventing cues nobody has measured. And
the kind is used NOWHERE but this match: search, the register and the clause
library are each their own decision with their own visible surface, and this one
was ruled invisible.

Tests: f131 Fix 2e (12 — 8 failing against the parent, the headline one
reporting a Payment rule landing on the TERMINATION clause), f222 unchanged,
f245 unchanged, clause-editor 91/91, redline 164/164, clause-door 99/99.

## OUR STANDARDS — THE ROW OPENS, AND THE PLAYBOOK LEARNS (owner-ruled 9 Sep 2026)

Off a screenshot of the page, then an artifact showing the whole redesign, then
four rulings at its foot: *"build all four as you recommended."*

1. the closed clause row states **Required** or **Preferred**;
2. it keeps **one line** of the wording, clipped by **width**;
3. the learned proposals read the **last quarter**, and only where there are
   enough settled rounds to mean anything;
4. the clause library and the negotiation playbook **stay two tabs**.

**`js/standards.js` IS THE READING AND IT HAS NO VIEW, NO ROUTE AND NO STORE.**
Counting is not drawing — the Insights panels' rule — so it returns plain data
and f272 greps it for `innerHTML`, `<div`, `document.`, `api(`, `fetch(` and
`ai/`. **ITS OWN FILE IS LOAD-BEARING for the same reason js/payterms.js's is:**
two views read it, and written inside either the other would reach it through
`window` on a stage that does not carry that view, get `undefined`, and count
**zero, silently** — the rlPaperFootHtml family. **AND IT LOADS AFTER
js/precedent.js**, because `STD_MIN_ROUNDS` reads `PRECEDENT_MIN` AT LOAD; f272
pins the order in js/app.js rather than leaving it to be discovered.

- **RULING 1 — THE STANCE IS READ, NEVER STORED TWICE.** `stdStanceOf(cl)` asks
  the playbook every time the row is drawn, which was the owner's whole
  condition: one fact stored in two places is the thing that drifts, and a
  reading cannot drift from its own source. **A POSITION TRUE OF SOME CONTRACT
  TYPES SAYS `scope:'some'` AND IS DRAWN QUIETER** — an outline where a baseline
  position is a fill — because the word alone over-states and silence says
  nothing. **A CLAUSE THE PLAYBOOK IS SILENT ABOUT DRAWS NO CHIP AT ALL**;
  guessing "Preferred" there would be the page inventing a company position.
- **TWO CHIPS, TWO CLASSES.** `.std-chip-pos` and `.std-chip-fb` beside the
  shared `.std-chip`: they are two different FACTS, the row draws the first only
  sometimes, and a bare `.std-chip` selector therefore resolves to the FALLBACK
  on those rows — which is exactly how the browser file first reported a chip on
  a row that draws none.
- **RULING 2 — ONE LINE, CLIPPED BY WIDTH.** The row showed the first 140
  characters and stopped mid-word every time. `white-space:nowrap` plus
  `text-overflow:ellipsis`, so it ends where the ROW ends; **nothing is cut in
  the markup** and the whole sentence is on the row's own `title`. **The fallback
  is on the closed row too**, as a FIGURE where the wording carries one — the
  card is headed "preferred & fallback wording" and half of it had never drawn.
- **THE ROW OPENS**, one at a time, in memory, per sitting — the clause panel's
  own rule. Behind the press: both halves under their own labels, this clause's
  own history line, and the acts. **The press repaints the LIST and nothing
  else**; the draft card and the learned card sit either side of it.
- **RULING 3 — THE LAST QUARTER, AND A FLOOR UNDER IT.** `STD_WINDOW_DAYS` is
  92, stated on the card so nobody has to guess which rounds are in it, and
  `precedentMine` gained an optional `since` (absent, every bare caller is
  byte-identical). **THE WINDOW CHANGES THE ANSWER RATHER THAN TRIMMING THE
  COUNT** — on the test book, all-time the held payment figure is 90 and this
  quarter it is 45 — which is the only way to prove the ruling rather than
  describe it. `stdHeld` keeps `PRECEDENT_MIN` as the floor, so a subject argued
  once inside the window proposes nothing: below it there is no pattern, only an
  anecdote.
- **THIS REVERSES `precedentSuggestions`' OWN RULE, LOUDLY.** That function's
  note reads *"THE ONLY SUGGESTION MADE IS ABOUT THE FALLBACK, never the
  preferred position. A preferred position is what the company wants; history
  cannot argue with an aspiration."* **The reasoning is right about ASPIRATION
  and wrong about SILENCE**: a preferred nobody has held in a quarter is not an
  aspiration, it is a number the playbook check flags on every contract and
  everybody has learned to wave through. **`precedentSuggestions` ITSELF IS
  UNTOUCHED** and still answers only about fallbacks — this is a second reading
  beside it, and f272 greps that function to prove it.
- **A FALLBACK IS A LINE AND A PREFERRED IS WORDING**, and that decides which
  door each takes. Moving a fallback presses `precedentAdopt` — the ordinary
  `saveClauseLibrary` write, asking first. Moving a preferred opens
  **`stdOpenPreferred`**, which writes NOTHING: it asks, then opens the clause
  editor on that clause, and the record moves only when a person presses Save
  there. f272 greps that function for every writer.
- **`precedentAdopt` TAKES THE ROW IT IS ADOPTING.** There are TWO readings of
  history in this product now — the all-time one and the windowed one — and a
  caller passing only a key would silently adopt the other one's figure. Absent,
  it falls back to `precedentSuggestions` exactly as before.
- **A POSITION BEING MET SAYS SO AND OFFERS NOTHING.** Holding rows are drawn as
  context BESIDE a proposal — "we looked at four subjects, two need moving, two
  are being met" is what makes the two proposals trustworthy — and **never on
  their own**: a card that only ever says everything is fine is furniture, and
  the reader stops opening it before the quarter it matters.

**A FIRST PLAYBOOK, READ OFF WHAT WAS SIGNED (idea 21).** Where a workspace has
saved neither a clause library nor a playbook, the page offers to read the
contracts they have already signed and say what they usually agree to.

- **THE DESIGN SAID "NO STANDARDS YET" AND THAT STATE DOES NOT EXIST**, which
  changed what was built and is reported rather than absorbed: `clauseLibrary()`
  and `playbook()` both fall back to HaTi's own defaults, so every workspace has
  six standards from its first minute and that heading would be printed over six
  visible ones. `stdUsingDefaults()` is the real, detectable, day-one case — a
  workspace still on wording somebody else wrote — so the card is a
  **COMPARISON** rather than a blank page being filled in.
- **IT READS THE RECORD, NOT THE WORDING.** Every figure comes off `metadata`,
  which IS this product's reading of a contract: extracted, printed back with
  its verbatim span, and confirmed by a person on Key terms. Re-reading the
  agreements would be slower, would need a model, and would rest on nothing
  anybody had checked.
- **IT PROPOSES ONLY WHERE THE TWO DISAGREE**, and only above `STD_DRAFT_MIN`
  (3) contracts and `STD_DRAFT_SHARE` (half) of those that carry a figure. A row
  that already matches is good news and offers nothing to press.
- **WHAT IT CANNOT READ IS NAMED.** A confidentiality duration and a liability
  cap in months are not fields the record holds, so the card says which subjects
  stay the reader's to write. A cap or an omission is a FACT — the standing rule
  — and inventing a standard is the one thing this must never do.
- **AND THE GOVERNING LAW ROW COMPARES AFTER ALL — REVERSED IN PLACE 9 Sep
  2026** (owner-reported, off their own card: *"it is not using the governing
  law i usually sign rather it says california is okay"*, then, pointing at the
  standard sitting visible eight rows below it, *"but the governing law says
  swedish per the attached"*). The row printed **"Nothing to compare — your
  standard is wording, not a figure"**, which was the card describing ITS OWN
  LIMIT and reading as a fact about the RECORD.
  - **IT WAS WORSE THAN A WORDING FAULT: the card was silently dropping the
    strongest finding it can make.** On the owner's book, `seen 1 of have 10`
    proves every recorded governing law is a singleton, so at most one of ten
    signed contracts named Sweden — against a standard marked **Required** —
    and the card said nothing at all about it.
  - **`compare` IS THE READING AND IT IS NOT ONE QUESTION.** `figure` lines a
    counted number up against the figure in the preferred wording; `home` asks
    the only question a governing law has an answer to — does this name our own
    market — because the standard there is the workspace's market setting
    rather than a number; `none` is the honest answer where the record holds a
    category and the standard holds prose.
  - **THE COMPARISON IS THE PRODUCT'S OWN, NEVER A SECOND COPY.** `jxNamesHome`
    is what the playbook check and the risk scan already ask, and both readings
    are `typeof`-guarded, so a stage without js/jurisdiction.js falls back to
    exactly what this row did before — no comparison, and the sentence that
    says so. **An honest absence, never a guessed jurisdiction.**
  - **TWO COUNTS, BECAUSE THEY ANSWER TWO QUESTIONS.** `topN` is how often the
    commonest value appears, which decides whether there is a usual value at
    all; `seen` is what the row PRINTS, and on a home comparison that is how
    many name the home market rather than how many share a spelling. Written as
    one number they disagree the moment a subject is compared any way but by
    counting duplicates.
  - **IT PROPOSES NOTHING, AND THAT IS THE ONE DOOR RULE rather than a limit of
    the reading.** A governing law is moved by changing the workspace's market,
    which is a settings act with a door of its own; a button here would be a
    second way in. So the row STATES its finding and presses nothing.
- **THREE MORE THINGS THE SAME ROW TAUGHT, all fixed with it.**
  - **"What you usually sign" claimed one where there was none.** The column
    printed the commonest value whatever its share, so ten one-off answers
    printed whichever sorted first in the **ALPHABETICAL TIE-BREAK** — California
    was there because C sorts early, not because it was common. Below the
    pattern floor the cell says the absence; with nothing on file at all it is
    the em-dash it always was.
  - **Nothing on file is not a disagreement.** The liability row read *"0 of
    your signed contracts carry one and they do not agree"* — the card arguing
    with its own zero, because `std_disagree` has no zero case and `i18tn`
    sends 0 to the `_other` form. It has a sentence of its own, asked first.
  - **"Already matches" needs a pattern to match.** Termination reported it at
    3 of 7, because `why()` asked whether the standard AGREES before it asked
    whether there was a pattern to agree with — a standard equal to a MINORITY
    value is not agreement. Reordered.
- **AND ITS ADOPT WAS CORRECTED BEFORE IT SHIPPED, which is the most useful
  thing in this section.** It first wrote the figure straight into the preferred
  as one flat sentence, and **MEASURED in a browser that replaced "The Buyer
  shall pay each undisputed invoice within thirty (30) days…" with "Payment
  terms at 60 days."** — the company's drafted clause thrown away to move a
  number inside it, which the reasoning written one screen away forbids by name.
  It goes through `stdOpenPreferred` now: **ONE DOOR for moving what the company
  asks for**, and the two cards call it by one name (`std_learn_move_pref` — a
  control reading "Adopt" that opened an editor would be naming somewhere it
  does not go). **"ADOPT ALL" WENT WITH IT AND IS NAMED RATHER THAN DROPPED**:
  it was drawn on the design and cannot honestly exist once each move is a
  person reading a clause. Substituting the figure into the existing prose was
  weighed and refused — this library writes "forty-five (45) days" and nothing
  in the product spells a number in words, so a substitution would leave a
  formal clause reading "60 days" in the middle of its own drafting.
  `std_adopt`, `std_adopt_q`, `std_adopt_msg`, `std_adopted`, `std_adopt_none`
  and `std_draft_adopt_all_*` are STALE, left inert in BOTH dictionaries.

**RULING 4 IS DELIBERATELY NO CODE.** The two tabs stay apart; what f272 asserts
for it is that nothing merged them, and that the open row's "Change the
position" is a **proxy onto the tab that already exists** rather than a second
door onto that act.

**THE PAGE'S OWN CLOTHES ARE WRITTEN IN THE PAGE** — a `<style>` block inside
`#content`, thrown away when the reader leaves, so it cannot quietly repaint a
screen that has not asked for it. The register's own precedent.

**AND THE LANGUAGE NET CAUGHT A REAL ONE.** f148 flagged `std_th_position` as
identical in both books — and the English was imprecise anyway: the column holds
a SUBJECT ("Payment terms", "Governing law"), not a position. It is
**Category / Kategori**.

Tests: f272 (57 — the file cannot even load against the commit that first
shipped this page, because the reading layer does not exist there; the eight
added 9 Sep 2026 for the governing law all fail against the commit before that
fix), f222 unchanged (its `renderPrecedentPanel` and `precedentAdopt` source
claims still hold, unedited), f148,
**standards-page-verify (38, browser — it is the only place three of these can
be asked at all: "one line clipped by width" is a GEOMETRY re-measured at a
narrower window, "the row opens" is a PRESS, and the page must SURVIVE being
drawn, since both new cards are called from `renderClauseLibrary` and a throw
in either takes the tab down. THE GOVERNING LAW CLAIMS ARE MEASURED AS PAINT,
because the whole complaint was about what the row SAID — the reading can be
right while the cells still read wrong — and its fixture DEPARTS from the
standard on purpose: seeded all-home the row would only ever say "Already
matches" and the finding could not be measured. Four fail against the parent
and report the owner's own screenshot verbatim, "California" under the heading
and "Nothing to compare" beside it; 6m is a CONTROL that passes either way, and
its job is to fail the day somebody gives that row a button)**.
