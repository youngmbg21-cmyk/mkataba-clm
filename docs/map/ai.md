# HaTi — ai

*Copilot: prompts, charts, briefs, plain English, auto-triage, spend and what it proposed*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## DRAFT FROM A SENTENCE (owner-asked 9 Sep 2026)

*"start on 1. But I need this to be an option and not the default when you
click on draft template."* Type what you need in a sentence and the template
this workspace already holds that fits opens PRE-FILLED.

**IT IS A FOURTH ROW IN THE `+ Draft new agreement` MENU, and the owner's
condition is the first thing this section states: "Draft from a template" is
UNTOUCHED** — same id, same handler, still first, still the ordinary picker —
so anybody who knows which template they want never meets this. f270 (7) and
the browser file both assert that as a CONTROL, passing before and after.

- **`js/draft.js` IS ITS OWN FILE AND MINTS NOTHING.** The last thing it does
  is press a door that already exists — the wizard's answer step, the saved
  template's fill, the company standard's essentials — so the contract is
  created by the same function, with the same validation and the same audit
  line, as one drafted by hand. **f270 (3) greps the module** for
  `state.contracts.unshift`, `nextId(`, `persist(`, `logAudit(`,
  `createFromWizard(`, `buildFromCustomTemplate(`, `tplLibCreate(` and
  `applyTemplateValues(` and fails on any of them.
- **IT PICKS FROM YOUR OWN PAPER AND WRITES NO WORDING AT ALL.** Every
  candidate is a template the ordinary picker already offers, read from the
  SAME three sources it reads — `myCreatableTemplates()`, `customTemplates()`,
  `tplLibPublished()` — so the two doors can never offer different paper, and
  the saved templates and the standards stay editor-only exactly as they are
  there. A model drafting clauses from scratch walks around the playbook, the
  clause library and every guard this product has.
- **ONE CALL FOR BOTH HALVES, DELIBERATELY.** `POST /api/ai/draft` returns the
  template AND that template's own answers from ONE reading of one sentence,
  so the two cannot disagree about what it said and one press costs one spend.
  **`/api/ai/template` IS NOT WIDENED TO DO THIS** and that is said out loud: it
  answers a different question over a different population — which existing
  CONTRACT to copy, scored on whether it was signed, with its clause text — and
  has no slot for the facts; two screens read it today.
- **THE MODEL IS SHOWN EACH TEMPLATE'S OWN FIELDS AND ANSWERS THEM BY KEY**,
  which is why no vocabulary had to be invented and a customer's own saved
  template is filled exactly as a built-in is. `maps` was the obvious
  alternative and is the weaker one: it cannot reach a template's PRIMARY field
  (material, product, services), which carries no mapping at all.
- **THE WALL IS ON BOTH HOSTS, AND THAT IS WHY IT IS A WALL.** A value may only
  reach a box the CHOSEN template declares: the route drops a stray key before
  it travels, and `draftApplyPrefill` drops it again before it reaches a form.
  Neither host has to trust the other about what this template asks.
- **NOTHING ARRIVES UNSEEN.** Every value lands on a field's DEFAULT, in an
  editable box, on a screen the reader presses Create on — so what is filed is
  what they confirmed, never what the model first said. The browser file drives
  exactly that: it overtypes the counterparty and reads the correction off the
  record.
- **THE PREFILL IS ONE READING WITH THREE READERS.** `draftApplyPrefill` moves
  each value onto its field's `def`, and the wizard's answer step, the saved
  template's fill and the essentials form all ask it. Written out three times
  they would drift about what applying a value means. **Copied by DESCRIPTOR,
  never spread** — a built-in's `label` and `def` are getters that name the
  workspace currency and the workspace itself, and `{...f}` reads them once and
  freezes the answer; that is the getter trap this file records four times over.
- **WHAT WAS FILLED IS NAMED, NEVER VALUED.** The offer says *"It also filled
  in: Counterparty, Payment terms (days)"* and prints not one of their values —
  they are one press away in boxes that can be corrected, and the uneditable
  copy is the one that reads as decided.
- **AN HONEST "NOTHING FITS" IS AN ANSWER.** The tool's own schema says to leave
  the id empty rather than stretch to the nearest template, and the screen then
  says so and offers the ordinary picker. So does no Copilot key, and so does a
  refusal from the route — each on the same screen, with the way forward on it.
  **The row is drawn either way**: one that disappeared when a key is missing
  would teach nobody why.
- **THE PROMPT'S ONE JOB IS NOT TO GUESS.** *Only what they actually said*;
  *leave a question out rather than guess*; *never invent a counterparty, a
  value, a date or a term*. "A two-year agreement" gives you neither date,
  because you do not know when it starts. f270 (9) pins all three in the prompt.
- **THE SPEND IS NAMED ON ARRIVAL** (`draft: 'Draft from a sentence'`), for the
  reason the document converter's omission records: an unknown feature lands in
  the Other bucket, which is the one number an admin looks for by name.
- **NO FOLDER SCOPE ON THE ROUTE, and that is a decision rather than an
  omission.** `scopeAiPortfolio` checks `candidates` ids against the CONTRACT
  register; these are TEMPLATE ids, so it would drop every one of them for a
  restricted member. Templates are not contracts and filing one is not access
  control — this rulebook's own words. Editor-only, because creating a contract
  is.
- **THE MENU ROW IS ENGLISH, LIKE ITS THREE SIBLINGS; THE SCREEN IS
  TRANSLATED.** Every row in that menu is hardcoded English and a fourth in the
  reader's own language would be the odd one out; the screen carries refusals
  and every fill screen around it is translated. Translating all four rows is
  its own job and is logged.

**NOT BUILT, said out loud:** Copilot does not draft a clause, propose wording,
or create anything; there is no "no template — write me one" path, and adding
one is a different product decision.

Tests: f270 (56 — **47 of them fail against the parent**; the survivors are the
"mints nothing" sweeps and the owner's own control that row one is unchanged),
**draft-from-a-sentence-verify (36, browser — the only place the feature's own
claim can be made: a value PAINTED into an input a person can see and overtype.
It drives the whole journey against a real server with a scripted provider —
menu, sentence, the pick, the pre-filled fill screen, Create, and an ordinary
draft on the record — plus the nothing-fits answer creating nothing. 34 of its
41 checks fail against the parent, and every driven half is guarded so it
REPORTS rather than timing out).**

## PLAIN ENGLISH BESIDE THE CONTRACT (Young ruled 9 Sep 2026 — idea 7)

*"go with the switch is in your slot option as i shared with no ring around the
buttons plus ensuring the negotiation button matches ... switch the 2 buttons so
that the first button is 'Contract View' and then 'Plain English' comes second
which the button will be shaded at first. Note that part of the frustration with
reading contracts is the legal verbiage in contracts so the plain english needs
to be clear enough for a regular person."*

Every clause on the Document tab gets a short reading of what it MEANS FOR YOU,
beside the wording it explains. Simplify has done this for one highlighted
passage since 17 Aug; this does it for the whole document, on one press.

- **THE COLUMN TAKES TURNS, IT IS NOT DELETED**, and that is the worry the whole
  design answers — Young's own words two messages earlier, over a screenshot with
  the right-hand column ringed: *"i am concerned you want to delete the
  highlighted area."* That column already swaps between the Document tab's cards
  and the Signing tab's order, keyed on `data-doc-col`; a third state is the
  mechanism it already has. The cards are **COVERED, never rebuilt** — `#doc-read`
  is an absolutely-positioned child of `#doc-grid` at `grid-column:2`, the clause
  panel's own precedent, and `#doc-right` takes `visibility:hidden`, so the three
  cards keep their place, their scroll and their content character for character.
  **NOT INSIDE `#doc-right`**, which carries an inline `overflow-y:auto` a
  stylesheet cannot beat without `!important`.
- **AND THE CONTRACT DOES NOT MOVE BY A PIXEL** — the six questions' one absolute
  refusal. The paper is in the grid's first track and the layer takes the second;
  measured either side of the swap, and the distance above the first line of the
  agreement is unchanged at 293.
- **THE SWITCH IS IN THE SLOT YOUNG DREW**, before the text-size stepper, with the
  negotiation door still last. Contract View first and lit at rest, Plain English
  second: **a page that opened on the readings would be a page that had spent
  Copilot money nobody asked for.** No ring — the red box on the mock was
  annotation. The lit half takes `--accent-fill` rather than the raw ramp (white
  on accent-600 measures 3.74:1) and the ink is `--accent-ink`, the one accent
  token with a night answer.
- **ONE HEIGHT ACROSS THAT SLOT, AND THE STEPPER HAD TO BE PINNED RATHER THAN
  PADDED.** `.rl-type-step` states `height:28px` UNSCOPED 2,350 lines into the
  negotiation sheet — one builder, three homes — so trimming its padding here
  could never reach it: measured 28 beside two controls at 32. Pinned in this
  slot alone, because that same stepper draws on the counterparty's page and on
  the negotiation control row, whose fold ladder is measured in pixels.
- **WHAT COUNTS AS A CLAUSE HERE IS WHAT IS PAINTED ON THE SHEET, and that is
  the safety of the pairing rather than a shortcut.** `clauseSegment` is still
  this product's one splitter and is untouched — but it reads a DOCUMENT MODEL,
  top-level blocks under their own headings, which is the shape a stored rich
  body has and NOT the shape `docBody` draws for a template contract: there each
  clause sits inside a block of its own with the heading nested in it. MEASURED
  before this was written — MK-A2's sheet paints five headings and segmenting the
  same html returns **ONE** clause, the whole agreement under its title. So the
  list sent to the model and the anchors the notes hang on are **the SAME WALK**,
  which means a note cannot land beside the wrong wording by construction rather
  than by care. Scoped to this layer: nothing files against it, nothing is stored,
  and no fingerprint sees it.
- **THE FRONT MATTER IS NOT A CLAUSE, and it takes TWO readings because this tab
  draws the head two ways.** Template paper builds it with `docPaperHeadHtml`, a
  real `<header>`; an UPLOAD builds its own out of a bare div. So the second
  reading is the fact both share — **the first heading on the sheet is the
  contract's own NAME** — narrow on purpose, only the first and only where it
  really is the name, so it can never eat a clause. Without it a scan whose words
  never came out of the file drew the switch and would have asked the model to
  explain a title. The last clause stops at the signature block, which is derived
  from the record rather than from the wording.
- **PAIRED BY THE NUMBER IT WAS GIVEN AND CHECKED AGAINST THE HEADING'S OWN
  WORDS.** The number alone is enough while the sheet is the sheet the reading was
  written about; the heading guard is what makes a repainted or re-read document
  draw **NOTHING** rather than shunt every note one clause along. Silence is the
  only safe failure here.
- **MEASURED FROM THE CLIP, NEVER FROM THE SCROLLER.** A note's top is relative to
  the box it hangs in, and that box starts below this column's own head — so
  measuring against the paper's scroller put every note a constant **29px** low,
  which reads as a note beside the clause after its own. Caught as PIXELS; nothing
  in the markup looked wrong. The two columns are kept in step by a **transform**
  on one inner element rather than a scroller of its own: two scrollers drifting
  apart is the one thing this may never do.
- **IT IS NEVER PART OF THE DOCUMENT.** Painted after the canvas on
  `wireDocCanvas` — the signature places' own funnel (J-1) and for the same three
  reasons: `docBody` is what the share copy, the exports and the phone all render,
  so a note written into it would travel; the wording is untouched, so no
  fingerprint moves; and it dies with every re-render, which is why it is re-armed
  there.
- **TRANSPORT, NEVER THE RECORD.** Its own `clause_readings` table — the brief's
  own bargain — hashed on exactly the text that was sent, riding GETs as
  `_readings`, stripped on PUT, stripped by `saveContract`, and stripped out of
  any share payload. **A CUT-SHORT ANSWER IS NOT CACHED AS A WHOLE ONE**: the
  brief paid for that lesson once.
- **A CAP IS A FACT.** `READ_MAX_CLAUSES` is 60 and what is over it is COUNTED and
  said on the column, never trimmed in silence.
- **THE PROMPT IS THE FEATURE, and it is pinned word for word** because it is the
  only part of this a test can hold on to. Everyday words for somebody with no
  lawyer; what the clause means for the reader — who does what, by when, and what
  happens if they do not; one or two sentences; never advise, warn, redraft or
  judge; never restate an amount (the figure is on the page beside the reading);
  and **an EMPTY reading is the right answer** for a cover page, a table of
  contents, headings and interpretation — far better than padding one out.
- **THE BOX IS SAVED BEFORE THE SWAP** (Young ruled it). That column regularly
  holds the contract form, whose fields commit on CHANGE — that is, on blur — so a
  reader mid-typing who pressed the switch would have lost that one box. Blurring
  first fires the same commit the form already listens for, which is why it is one
  line rather than a second way to save.
- **BELOW 1024px IT IS NOT DRAWN AT ALL** — the clause editor's own floor, and for
  its reason: two working columns need room to be two columns. The stored
  preference is **READ, NEVER WRITTEN** there, the nav drawer's rule: a narrow
  sitting must not quietly clear a choice made on a laptop.
- **A VERB THAT CANNOT WORK IS NOT DRAWN.** No clauses on the sheet, no switch.
- **`readings: 'Plain English'` IS NAMED IN THE SPEND LEDGER ON ARRIVAL**, for the
  reason the document converter's omission records: an unnamed feature lands in
  the Other bucket, which is the one number an admin goes looking for by name.
- **NOT BUILT, said out loud**: nothing on the phone, nothing on the counterparty's
  page, and the readings are not offered on the Signing tab — that column holds
  the signing order there and this one has nothing to say about it.

**AND IT IS A CLAUSE-FOR-CLAUSE EDITION, NOT A SUMMARY — REVERSED IN PLACE
10 Sep 2026** (Young, off their own supply agreement: *"Plain english should be
structured in the sense that is translates the contracts into plain english and
not just summarizing. If there clause 1.1 in the contract then there should be
a traslated clause 1.1 in plain english ... the clause should be numbered like
in the contract and have the headers to match as well ... it should almost look
like a contract in itself"*, then *"Let the plain english also sit in a white
card and not the grey background"*, then *"when the contract in the document
changes or is redlined and you click on plain english it should update the
translation accordingly"*). Built to a render they approved first.

- **THE CAUSE WAS THE SEGMENTATION, NOT THE PROMPT, and that is the whole of
  why it read as a summary.** The walk took HEADINGS and nothing else — and on
  real commercial paper the headings are the SECTION titles while 1.1, 1.2 and
  1.3 are bold lead-ins inside ordinary paragraphs. So the whole of section 1
  arrived as ONE row and could only ever come back as one note. It was never a
  decision to summarise; the model was doing the only thing it could with what
  it was handed. MEASURED on the reported shape: 6 rows where there was 1.
- **A NUMBERED PARAGRAPH IS AN ANCHOR OF ITS OWN, AND IT REQUIRES A DOT.**
  `1.1` and `3.2.1` are sub-clauses; `1.` alone is as likely to be a list item
  or a sentence opening with a figure. **It only ever ADDS anchors** — paper
  with no numbered paragraphs walks exactly as it did, which is what makes this
  safe on documents nobody has seen, and f277's CONTROL passes before and after.
- **THE CLAUSE'S HEADING IS ITS OWN BOLD LEAD-IN** — "1.1 Master Agreement
  Structure." — because that is what the drafter wrote as its name and because
  it is what the pairing guard compares. A wrapper that merely CONTAINS the
  numbered paragraph is never the anchor: taking it would put the entry above
  its own wording and swallow every clause after it.
- **THE NUMBER IS THE PAPER'S AND IS NEVER ASKED OF THE MODEL.** It is read off
  the sheet by the same walk the entries hang on, which is what lets it be
  printed as a citation — the renewal adviser's own rule about dates, on a
  clause reference. The model supplies the plain HEADING; a row marked SECTION
  gets a heading and no reading, and is the one row that may stand on a heading
  alone.
- **THE PROMPT ASKS FOR A TRANSLATION AND KEEPS EVERY FIGURE.** *TRANSLATE, DO
  NOT SUMMARISE*, match the clause you are given, and the old "never more than
  three sentences" and "do not restate any amount" are both gone. **The money
  rule was right about a summary and wrong about a translation**: an edition
  that drops "0.5% per day, capped at 10%" has described the clause rather than
  translated it, and the figure is in the WORDING the same reader is already
  reading — `canViewValues` governs the contract's value FIELD, never the
  document text. `max_tokens` is 8,000 from the schema's own arithmetic rather
  than a guess (60 clauses × ~110 tokens), and a cut-short answer is still not
  cached.
- **A WHITE SHEET, AND THE CONTRACT'S OWN SIZE.** A facing page beside the
  cream one rather than notes on the page ground. **The size is MEASURED off
  the paper on every paint, never computed from a token here**: `--doc-scale`
  is written on the paper's own zoom wrapper in the OTHER column and never
  reaches this one, and a document style can multiply the size again on top of
  it (`compact-executive` takes .94). Asking the sheet what it resolves to
  follows both, and follows the next one.
- **LEVEL WITH ITS OWN CLAUSE, STEPPING DOWN RATHER THAN OVERLAPPING.** Level
  is what makes this a parallel reading — 3.3 beside 3.3 — and the step is what
  keeps that promise honest when it cannot be kept exactly.
- **THE READING FOLLOWS THE WORDING.** The press ran the route only where there
  was NO reading at all, so a redlined clause went on showing the reading of
  the wording it replaced. `docReadSig` is the browser's own signature of the
  walk — **not the cache key, which the ROUTE owns**, only how the press knows
  whether to ask. Unchanged wording asks nothing; moved wording calls the
  route, which answers from its own cache without spending anything if it turns
  out to agree. Stamped from the walk that was SENT, taken before the await,
  because the paper can be repainted while the request is in flight.

Tests: f277 (61 — **25 fail against the parent**, the headline one reporting a
section of three clauses as one row), **plain-english-verify (47, browser — 12
fail against the parent; sections 8 and 9 stage the reported shape through the
REAL builder and drive the whole journey, and 8f measures the reading and the
paper against EACH OTHER rather than against a typed size)**.

## THE WALK READS BOTH SHAPES OF PAPER (Young reported it 10 Sep 2026)

*"some times when i click on a contract from a different page, in this case
from the calendar page and it takes me to the documents page per the attached,
the contract view and plain english buttons are missing."*

**IT IS NOTHING TO DO WITH THE ROUTE, and that was MEASURED before anything
was touched** — the dashboard, the register, the calendar and a bare tab press
all behaved identically, because every one of them is `selectContract` →
`openWorkspace` → `setView('workspace')`, one door. **WHAT DIFFERS IS THE
CONTRACT.**

- **A CONTRACT DRAWN FROM PLAIN TEXT HAD NO SWITCH AT ALL**, and that is most
  of the book: every received document, and every working text a negotiation
  has stored — which is the state Young's own screenshot is in ("Round 1 · 2
  need you", "WORKING TEXT" on the sheet). `documentTextHtml` lays that paper
  out and paints a heading as a styled `<div>` and a clause number as a styled
  `<span>`; there is not one `<h*>` in the wording. The walk knew ONE shape of
  paper. MEASURED on a template contract's own working text: **0 rows**, so
  `docReadSwitchHtml` correctly stood down and the reader was offered nothing —
  on exactly the paper a plain-English reading is worth most on.
- **THE BUILDER NOW NAMES WHAT IT ALREADY DECIDED.** It asked `docLineKind`
  which lines are headings and `docClausePrefix` which carry a number, and then
  threw both answers away. `doc-t-h` and `doc-t-n` are those two decisions
  written down. **TWO CLASSES AND NOTHING ELSE** — no element moves, no style
  changes, no line breaks differently — so the five other callers of that
  builder (the counterparty's page, the template library's two previews,
  richdoc's fallback, the upload branch) render byte for byte as they did and
  carry an inert class. **MEASURED AS PAINT rather than asserted**: every text
  line's own rect and the canvas's own box, before and after, identical.
- **THE ALTERNATIVE WAS TO READ AN INLINE STYLE STRING**, which is the kind of
  reading that breaks in silence. The seal is untouched by construction —
  `freezeContractHtml` builds its own markup for a plain-text body and never
  calls this builder.
- **THE NUMBER'S SPAN IS THE ANCHOR, NOT ITS PARAGRAPH, and that is the half
  that keeps this a translation rather than a summary.** That builder puts a
  whole RUN of body lines into one `pre-wrap` div, so a section's 1.1, 1.2 and
  1.3 share one element. Anchoring the run would hand the model one row for
  three clauses and bring back one note for all of them — **precisely the
  summary Young rejected on 10 Sep, arriving through the other door**. The
  number is already a real element sitting at the top of its own line, and a
  Range from it to the next one is exactly that clause's wording. So the sheet
  is not restructured to be read; the reading uses what is there.
- **ONE WALK, BOTH SHAPES** — the property the whole pairing rests on. A marked
  heading is a SECTION exactly as an `<h*>` is; a marked number is a CLAUSE
  whose wording runs to the next anchor. The contract's own name is stepped
  over on this paper too, because that rule now asks one reading of "is this a
  heading" rather than testing a tag name.
- **`_docReadWords` IS ONE READING OF "THE FIRST FEW WORDS"**, because a marked
  number has no element of its own to read a bold run out of — its wording is
  what FOLLOWS it — and two copies would let the two shapes of paper name the
  same clause differently.

**MEASURED AFTER, on a template contract's own working text: the switch drawn,
four clauses each carrying the paper's own number, the first entry level with
its clause to the pixel, and the contract not narrowed by one.**

Tests: f277 (12) (9 — **7 of them fail against the parent**; the paper is built
by the REAL builder, never typed out, because a block that hand-writes the
shape the product produces passes on the commit before the product could
produce it), plain-english-verify section 10 (8, browser — the only place three
of these can be asked: whether the switch is VISIBLE PIXELS on a real contract,
whether a real press brings back a note beside the clause it reads, and whether
the paper moved. **6 fail against the parent, reporting Young's own screenshot
verbatim — the switch not drawn and 0 rows**).

## PLAIN ENGLISH BESIDE THE CONTRACT — THE FIRST BUILD (Young ruled 9 Sep 2026)

What follows is the record of the first build, kept because the reasoning is
the useful part; the edition above reverses its segmentation and its prompt in
place and keeps everything else.

Tests: f277 (34 — the switch's order and default, the one walk, the two front-
matter readings, the pairing and its heading guard, never in `docBody`, its own
table and every strip, the prompt's own words, the route against a real server
with a scripted provider, and both languages), **plain-english-verify (32, browser
— the only place five of these can be asked: `test/world.js` stands a ONE-LINE
`docBody` in for the real one, so the node stage can only prove the RELATION; that
the real builder yields real clauses, that a note lands on its own clause to the
pixel, that the cards are covered and come back whole, that the contract does not
narrow, and that the slot is one height are all measurements on a rendered page.
It caught the 29px offset, the unreachable route path and the title being read as
a clause — none of which looked wrong in the source).**

## HIGHLIGHT ON THE DOCUMENT TAB → SIMPLIFY / ASK COPILOT (owner-asked 17 Aug 2026, understanding confirmed before building)

A highlight on the Document tab's paper raises the negotiation page's own selection menu (rlSelMenu — which gained ctx.actions + ctx.onPick so a host can bring its own action list WITHOUT a second copy of the markup, anchoring or kill logic; without them every row still routes to rlAiPropose and the negotiation surfaces are byte-identical) carrying TWO actions of this tab's own: **Simplify** (the Copilot panel answers with a plain-language version) and **Ask Copilot** (the panel quotes the passage and asks for the inquiry; the next typed question rides the ordinary chat door with the passage in its history — no session machinery).
- READING AIDS, NOT EDITS — the whole difference from the negotiation page and the reason it is small. Nothing on this path calls negoFileChange / negoEditClause / changes.push / copilotPropose (f211 greps the code, comments stripped). That is what makes it safe on EVERY status — draft, under review, signed — and for every role including Viewers. Wording changes still go through Negotiate; the Document tab stays a clean read.
- NO CLAUSE MATCHING, deliberately: the negotiation path refuses front matter, multi-clause drags and marked wording because it must FILE against one clause's text. A reading aid has no such stake — the recital, the title and a run across two clauses are all fair questions.
- THE FULL PASSAGE REACHES THE MODEL: the display bubble clamps the quote with max-height, never a slice — aiChatMessages() reads that bubble's text into the next request, so a truncated display would hand the model a truncated passage. Simplify's instruction forbids proposing wording (a reading aid, not a redraft).
- NEVER THE COUNTERPARTY (owner-ruled): the wiring lives on the owner's Document tab, which the share pages never render, and refuses PORTAL_MODE besides. The menu's dismiss listeners are armed once on the document; the guard list keeps drags inside fillable blanks and controls from raising it. The panel opens BEFORE anything is asked (rlAiPropose's own rule), and a workspace with no Copilot key gets the honest "not connected" sentence in the panel, not a dead press.
- DOC_SEL_ACTIONS / wireDocCopilotSel / docAiRead / docSelKill, in js/views/contract.js beside the canvas wiring; f91's "no 'Ask Copilot' in this file" claim NARROWED IN PLACE (it named a retired header door; the words now name a selection action, allowed to appear exactly once, in DOC_SEL_ACTIONS).
Tests: f211 (8 — the menu extension both ways, the full-passage claim, the no-writes grep, the PORTAL guard, the pair of actions), document-ask-copilot-verify (9, browser — the menu as pixels beside a real highlight, both actions pressed, the quote and the answer landing in the panel, Escape, and every contract's change count proved untouched).

## THE WHOLE CONTRACT IS READ, AND A QUOTE IS ONE PASSAGE (owner-approved 21 Aug 2026, off the CUAD scorecard)

The first live measurement of Copilot against contracts HaTi did not write (`test/cuad` — 50 real agreements marked up by commercial lawyers) turned up two defects, and both were INVISIBLE: nothing failed, nothing was logged, and the wrong answer arrived wearing the right answer's clothes.

- **FOUR SILENT SLICES, AND THE BROWSER HELD TWO OF THEM.** `/api/ai/obligations`, `/api/ai/brief` and `/api/ai/playbook` each carried a hard `slice(0, 20000)` and `/api/ai/renewal` a `slice(0, 12000)` — and `extractObligations`, `aiBriefRun` and the playbook runner sliced to 20,000 a SECOND time before posting, so fixing the server alone would have fixed nothing. The duplication warning in its usual direction. **None of the four was ever a decision**: no line in this rulebook, in MAP-HISTORY or in any work order, each arriving inside a commit about another subject. MEASURED: 41 of 50 real contracts are longer than 20,000 characters, the median is 37,970, and **the obligations reader returned NOTHING AT ALL on every truncated one** — a feature that degrades to silence rather than to partial, because silence reads as "this contract has no obligations". They also broke a promise the code makes in writing: `capAiInput` says "defaults sit above what the client sends, so genuine use is never trimmed", and these ran afterwards, trimming exactly that.
- **ONE CEILING FOR ONE CONTRACT — `aiDocChars` / `aiDocText(req, s)`** (200,000, `AI_DOC_CHARS`, settable beside every other cap on `/api/ai/config` and reported on `/api/pulse`). Set ABOVE any real contract rather than below most of them: the longest of 510 professionally-drafted agreements is 73,685 characters, the deep tier holds a million tokens, and reading a whole contract costs about two US cents. What it exists for is the runaway case a contract manager really does meet — a master agreement with every annexe bound in — and not the ordinary one.
- **THE BULK BUDGET IS A DIFFERENT QUESTION AND IS LEFT ALONE.** `aiMaxChars` (60,000) still bounds a portfolio call and DIVIDES ITSELF across its contract list, which is where a cap genuinely earns its place — 400 contracts is millions of characters and real money. Two jobs were wearing one number and a third number nobody decided was doing neither; riding the document ceiling would have more than tripled a ten-contract Copilot question. `b.text` is a SINGLE document on every route that sends it (extract, blanks, obligations, playbook), so it alone moved to the document ceiling.
- **A CAP IS A FACT, NEVER A SILENT TRIM** — the standing rule. `aiDocText` marks the text with `AI_TRUNC_MARK` for the model and sets `req.aiInputCapped`, which `aiNotice` already turns into a sentence on all four routes. An untruncated document is never marked.
- **THE BRIEF HASHES EXACTLY WHAT IT SENDS.** Its cache key was `sha(String(body).slice(0, 20000))` while the prompt read its own slice — the route's own comment already promised "a hash of exactly the text that was read". Clipped once now, hashed and sent as one value; hashing a different slice than was sent means a change past the cut never refreshes the memo. ONE CONSEQUENCE, SAID OUT LOUD: every existing cached brief re-runs once, because the key really has changed.
- **A QUOTE IS ONE CONTINUOUS PASSAGE — `AI_QUOTE_RULE`, stated once and appended to all four tools that return one.** 34 of 125 returned spans (27%) could not be found in the contract; `inspect.js` split each at its ellipsis and checked every fragment, and ALL of them were genuinely in the wording — **the JOIN was invented**. Not hallucination and not a reading fault: a missing instruction. It matters because those spans are printed to the customer AS QUOTATIONS from their own contract (the upload confirm screen under every field, the renewal card quoting the phrase a notice period was read out of). Worst affected were the fields whose answer is spread across a clause — retention, liability caps, warranty periods — which is exactly where splicing is tempting. The rule carries its own way forward ("if no single passage carries the whole answer, quote the one that carries most of it"), because a refusal with no alternative is what caused the splicing.
- **AND "NO OBLIGATIONS FOUND" WAS SILENT.** `runFindObligations` called `toast('No obligations detected')` with no kind — which by this product's own rule prints NOTHING — so a scan that found nothing was indistinguishable from a dead button, and it was hardcoded English besides. It is `toast(i18t('ob_none_found'),'warn')`: 'warn' and not 'err', because nothing refused and nothing failed.
- NOT TOUCHED, each for its own reason: the Copilot chat tool's `COPILOT_TEXT_CAP` (50,000 with a `textTruncated` flag) was ALREADY the honest pattern and is what the four were made to look like; `guideRules` / `guideLive` (the rulebook and the live snapshot handed to the model, not a customer's wording); `js/family.js`'s document-HEAD reads (a heuristic guessing a parent from the front matter, deliberately not an AI read); and `js/views/library.js`'s 60,000 (it already matched the cap).

Tests: f230 (13 — the four slices swept on BOTH hosts so the next one fails here, the ceiling's two exclusions, the mark and the notice, the brief's key, the quoting rule proved to reach every tool, and the toast in both languages; 11 of the 13 fail against the code the morning before, which is what makes it a regression test rather than a description).

## THE OBLIGATIONS READER WENT SILENT ON LONG AGREEMENTS (21 Aug 2026, the scorecard's third run)

With the whole contract reaching it and 4,000 tokens of room, three contracts returned 12, 18 and 12 obligations — **all 42 carrying a quote** — and seven returned NOTHING. No truncation, no refusal, no cut-off: the model was asked and answered "nothing" about master supply agreements full of duties.

- **THE LENGTH IS THE TELL AND IT IS A CLEAN SPLIT.** The three that answered are 14k–26k characters; the seven that did not are 22k–52k, averaging twice as long. Measured before anything was changed, which is what turned a fourth guess into a diagnosis.
- **A ONE-SENTENCE PROMPT WAS THE FAULT.** It named five kinds of obligation, and **the two CUAD categories scoring ZERO were the two it never mentioned** (audit rights, minimum commitments) while the one it did name (insurance) scored. It also carried a RESTRAINT — "only list obligations actually present" — with nothing to balance it, and on a long document a restraint with no counterweight makes the empty list the cheapest safe answer. Rewritten: read to the END (the duties that matter — audit, insurance, survival, minimum commitments — are drafted at the back), ten named kinds, and an empty list called out as rare in a commercial agreement. **The restraint STAYS**: widening the ask must not licence inventing one.
- **WIDENING THE LIST IS NOT TUNING TO THE ANSWER KEY**, and the distinction is the whole defence of this change. A minimum volume commitment is money a manufacturer loses by missing it; an audit right is something you must be ready for. They belong here whether or not CUAD marks them — that CUAD marks them is HOW the gap was found, never WHY it is being closed. Fitting a prompt to a scorer's categories would be marking our own homework in new clothes, which is the thing this whole exercise exists to stop.
- **maxItems 12 → 20.** The model already ignored 12 and returned 18 on a distributor agreement; a cap the model does not honour only misleads whoever reads this schema next. The review dialog scrolls.
- **AND AN ABSENCE IS NOT A QUOTATION.** The splicing is ENTIRELY GONE (0 of 16 remaining not-verbatim spans carry an ellipsis, down from 34 of 125) and what replaced it is smaller and different: the model writing a sentence ABOUT an absence into a field that holds a quotation — *"No retention provision in the contract"*, *"No express warranty period stated"*. Eight of the sixteen are the two retention fields, the ones most often genuinely absent. `AI_QUOTE_RULE` now closes with "if the document says nothing on the point, return nothing at all", and the span field names the exact failure — the old "Omit if the field is empty" lost the argument to the sentence in front of it.
- **THE FOURTH RUN: THE PROMPT WORKED AND THE ROOM RAN OUT BEHIND IT.** Genuinely-empty answers fell from **7 to 3**; the two contracts that answered returned **20 and 18** obligations against 12 and 12; one that had managed 18 was cut off trying for more; and five came back as an honest 502 naming the reason — the silence they used to be. So the ceiling is binding again, and that IS the prompt fix working. THE ARITHMETIC RATHER THAN ANOTHER GUESS: 20 items, each a description plus a whole clause quoted continuously (400–600 characters is 100–150 tokens), plus due, recurring and the JSON around them — call it 200 tokens an item and 4,000 is exactly not enough, which is what was observed. **8,000**, and f230 DERIVES it from the schema's own maxItems so the two cannot drift apart. **AND THE QUOTE IS BOUNDED AT 200 CHARACTERS**, the half that costs nothing: *"Short … snippet"* carried no number while `AI_QUOTE_RULE` asks for one CONTINUOUS passage, and those two pull in opposite directions — the extract route's span has said "under 140 characters" all along. A bounded quote also reads better in a dialog showing twenty of them.
- **THE ABSENCE RULE MEASURED CLEAN.** Not-verbatim spans fell from 16 of 121 (13%) to **5 of 110 (5%)** and both retention fields left the list entirely. That finding is CLOSED: 34 spliced quotes at the start, none now, and the absence-sentences gone with them.
- **THE FIFTH RUN SETTLED IT.** All four categories above zero for the first time (post-termination 2/3, minimum commitments 1/2, audit rights 1/5, insurance 1/4), **161 obligations against 38 and every one of them quoted**, silent contracts 8 → 5, nothing cut off. Far outside the noise band below, so it is real: the reader is no longer the silent feature this project started with. TWO THINGS IT DID NOT FIX, said out loud — five contracts still answer nothing (the longest three among them), and VOLUME IS NOT AIM: 161 found and audit rights still 1 of 5. Neither is worth chasing on ten contracts; both are worth revisiting on fifty.
- **AND `maxItems` IS ADVISORY, NOT A CAP** — the model returned 40, 40, 36 and 28 against a stated 20, exactly as it had returned 18 against 12. Nothing in this product may rely on it to bound a list; where a bound has to hold, bound it after the answer arrives.
- Five causes, five runs, each found only after the last was fixed: truncated input → a cut-off answer read as an empty one → a prompt too narrow to ask the right question → the room that prompt then needed → and then the measurement itself was the thing that had to be understood (below).

## THE OBLIGATIONS READER IS INCONSISTENT, NOT BLIND (21 Aug 2026, the fifty-contract run)

**The ten-contract run's length diagnosis does not survive fifty.** It showed a clean split — answering contracts 14k–26k characters, silent ones 22k–52k — and that was the basis of the prompt rewrite. On fifty: silent contracts average **36,518** characters against **37,813** for answering ones, medians 39,588 against 37,876, ranges overlapping almost entirely, and both sides carrying maintenance, distribution, outsourcing and transport agreements alike. **The split at n=10 was noise, exactly as the noise band predicts.** The fix built on it still worked (0 obligations → 843, every one quoted) — for reasons that were not the reason given, and saying so is the point.

- **WHAT IT ACTUALLY IS: INCONSISTENCY.** The same contract returned 12, then 20, then 0, then 0, then 0 across five runs; four contracts that answered nothing when the daily budget cut them off answered 20–24 on the very next attempt. 21 of 50 return nothing on any given run, and it is not the same 21.
- **SO THE PRODUCT OFFERS THE SECOND PRESS.** `ob_none_found` no longer claims the contract is empty — it says the scan is not always consistent — and the warn toast carries a *Scan again* action calling `runFindObligations(c)`, the SAME act and never a second path. A refusal needs its way forward on the same screen, and this is a refusal wearing a finding's clothes: the one thing this scan has repeatedly been wrong about is asserting that a contract holds no duties.
- **NOT BUILT, said out loud:** scanning twice automatically and merging. It would double the cost of every scan to paper over a model behaviour, and nobody has asked for it.
- **AND THE MEASUREMENT IS DONE.** 81% mean FOUND across nine fields on fifty contracts; governing law 100/100, counterparty 98, liability cap 90/95, effective date 79/97. Where HaTi's answer can be checked it is usually right — more often than it quotes the exact passage a lawyer highlighted, which is what the FOUND/CORRECT split exists to show. Weakest field is warrantyMonths at 40% FOUND on 20 contracts. Five product defects found and fixed; four scorer bugs of my own found and fixed, every one caught by reading real output rather than by any test.

Tests: f230 (24 — the retry offered, wired to the same act, and the words proved not to claim an empty contract).

## A CALL THAT NEVER GOT AN ANSWER IS NOT A WRONG ANSWER (21 Aug 2026, the fifty-contract run)

**The fourth scorer bug of one family**, and the family is: something that FAILED being counted as something that was WRONG.

- **THE RUN HIT HaTi'S OWN DAILY CEILING AT CONTRACT 45.** `aiDailySpendLimit` — $10, and a GOOD rule on a real workspace — stopped the last six contracts, five of them before the extract route. `spans[field]` is undefined for every field when the call threw, which `foundVerdict` correctly reads as "missed": correct about the FIELD, wrong about the CONTRACT, because nobody was asked. Five contracts × nine fields is up to **45 false misses** in ~380 comparisons, every one pulling the headline down.
- **NAMED IS NOT THE SAME AS EXCLUDED.** The obligations side had had a `call-failed` verdict since the first diagnostic run — printed under "why the misses" — and counted those same 24 calls into `foundOf` anyway. Reported as failures and scored as misses in one breath. Both sides now exclude it, and both PRINT it ("N NOT ASKED"), because a reader must be able to tell "HaTi answered 45 of 50" from "HaTi was asked 45 times".
- **THE CEILING IS OFF ON THE THROWAWAY SERVER ONLY** (`AI_DAILY_SPEND_LIMIT: '0'` in run.js's env). The rule itself is right and the product keeps it: on a run whose cost was estimated and accepted by the operator, a ceiling that silently turns five contracts into 45 missed fields makes the SCORE wrong rather than the spending safe.
- **AND `--resume` NOW REFUSES A ROW WITH NO ANSWER IN IT.** The dump records every contract including the failures, so a naive resume would skip exactly the contracts it exists to retry.
- Their rulebook's own Bug Fix Rule 3 is what this cost: find every place the thing you are changing appears, and fix them all. The obligations side was fixed first and the field side was never asked about.

Tests: f229 section 13 (4 — excluded from both denominators, told apart from the other two exclusions, a real miss still a miss, and the headline ignoring a field nobody was asked about; all four fail against the scorer of an hour before).

## HOW BIG A MOVEMENT IS READABLE — THE SCORECARD'S OWN NOISE BAND (measured 21 Aug 2026, by accident)

**On ten contracts, a change of fewer than about three contracts in a field is NOISE**, and this was MEASURED here rather than borrowed from a statistics book.

- **RUNS 4 AND 5 WERE THE FIRST PAIR WITH BYTE-IDENTICAL FIELD-EXTRACTION CODE** — the only diff between the two commits sits inside `/api/ai/obligations` (a length bound on its quote, and its token ceiling), with the extract route, its prompt, its schema and its inputs untouched. Same contracts. **The headline still moved 90% → 85%**: noticePeriodDays FOUND 90→70 (2 contracts), expiryDate 89→78 (1), renewalType 100→90 (1). Four answers out of ~90 comparisons flipped — about **5%**, which is ±5 points on the headline and up to 20 on one field.
- **FOUND IS NOISY; CORRECT IS NOT.** Every CORRECT figure was identical across that pair (80, 100, 83, 100, 100, 100, 100). Where HaTi finds the passage it gets the answer right consistently; what varies is WHICH passage it quotes. Worth knowing before anybody spends a day chasing a CORRECT score.
- **WHAT FOLLOWS:** never report a one-field, one-contract movement as an improvement (it was done twice during this project and at least one was this); run 1 → run 2's fifteen points IS real, at three times the band; and **the way to narrow the band is more CONTRACTS, not more runs** — fifty would roughly halve it, re-running ten proves nothing ten already proved.
- Recorded in test/cuad/SCORING.md and at the top of FINDINGS.md, because a number read as precise when it is not is the fault this whole exercise exists to stop.

Tests: f230 (22 — the ten named kinds, the read-to-the-end counterweight, the restraint still standing, the honest maxItems, and the absence rule stated twice).

## AN ANSWER CUT SHORT IS NOT AN EMPTY ANSWER (21 Aug 2026, found by the scorecard's second run)

The obligations reader returned NOTHING on all ten contracts — the same 0% as before the truncation was lifted, which is what proved the truncation had never been the cause.

- **NOTHING IN server.js READ `stop_reason`.** A tool call stopped at max_tokens returns a `tool_use` block whose input is partial or absent, so every route's `Array.isArray(block.input?.x) ? … : []` turned *"I ran out of room"* into *"there is nothing here"* — and `js/obligations.js` prints that as **"No obligations found in this contract"**, a claim about the customer's paper. THE INPUT-TRUNCATION LESSON ON THE OUTPUT SIDE, and the same standing rule: a cap is a FACT, never a silent trim.
- **ONE PLACE, EVERY ROUTE.** `anthropicMessages` records `truncated`; `aiNotice` turns it into a sentence, and all ELEVEN AI routes already fold aiNotice into their response while `js/api.js` already toasts `notice`. One line reaches the lot — never a per-route check.
- **THE CEILING WAS THE LOWEST OF ANY DEEP ROUTE.** 1,500 tokens against a schema whose `maxItems` is 12, each item carrying a description AND a verbatim quote — about 100 tokens apiece before the JSON, so roughly two obligations of headroom. Now 4,000. Output is billed as used, so headroom that is not needed costs nothing; an answer cut off costs the whole answer.
- **AND THE QUOTING FIX PROBABLY TIPPED IT OVER**, said out loud: `AI_QUOTE_RULE` asks for ONE CONTINUOUS passage, which is longer than the spliced fragment it replaced. A fix in one place cost the answer in another, and only a measurement caught it.
- **"NONE" AND "CUT OFF BEFORE IT COULD SAY" ARE DIFFERENT ANSWERS.** An empty list from a truncated call is now a refusal naming the reason, never an empty result.
- STILL UNPROVEN, said out loud: a third run is what settles whether the reader now works. `test/cuad/run.js` records the notice and the refusal in its dump, and `inspect.js` prints them, so a third identical figure cannot be mistaken for either of the first two causes.

- **AND A PARTIAL ANSWER IS KEPT.** Degrading to partial beats degrading to silence — the original finding's own words. What arrived is real work and is handed over; the notice is what stops it reading as the complete picture. Only a list that is EMPTY *and* cut off is refused.
- **THE STAND-IN COULD NOT REPRODUCE IT EITHER**, which is why the whole suite passed while the defect was live: `startScriptedAi` only ever produced COMPLETE answers. It takes `stopReason` now (both the JSON and the SSE path). A harness that cannot fail the way the provider really fails turns every test written on it into a description.

Tests: f230 (19 — the source: the flag recorded once, the sentence reaching every route, the ceiling measured against the schema's own maxItems, and the refusal), f231 (6, against a real server and a provider that really cuts the answer short — the complete answer unmoved, a genuinely-empty answer still a real answer, the cut-off one refused in words, a partial one kept with its warning, and the warning inherited by a route that never mentions truncation; 4 of the 6 fail against the commit before).

## WHICH DURATION IN THE SENTENCE IS THE ANSWER (21 Aug 2026, owner-asked "fix the notice period and the expiry date")

Both were reported at 50% by the CUAD scorecard. **Neither was HaTi's to fix: the ANSWER KEY was wrong on 18 of its 34 entries**, and checking the scorer before the product is what this file's own rule already said to do.

- **THE FIRST DURATION IN A RENEWAL CLAUSE IS THE RENEWAL TERM, NOT THE NOTICE.** `parseDuration` returns the first one it finds, and the clause is drafted term-first: *"renew automatically for successive ONE-YEAR TERMS unless one Party gives notification of termination with at least SIXTY (60) DAYS written notice"* — the answer is 60 days and the scorer read 365. On more than half the key, HaTi was marked wrong for answering correctly. `pickDuration(text, want)` (test/cuad/score.js) asks what each duration is ATTACHED TO — a NOTICE cue near it, a TERM cue immediately after it — and `noticeDuration` / `termDuration` are the two readings. All 18 corrected truths were read back against their own spans by hand before it shipped; f229 section 12 carries four of them VERBATIM, because a fixture holding one duration cannot fail the way the real data failed (none of the 59 existing tests caught this).
- **THE SAME FAULT INVENTED EXPIRY DATES.** `expiryTruth` computed off the first duration too, turning *"terminable by either party with ONE (1) YEAR written notice"* into a one-year term and giving an evergreen agreement a term it does not have. `termDuration` REFUSES where every candidate looks like a notice: 25 scorable truths became 24, in the honest direction.
- **THIRD SCORER BUG OF ONE FAMILY** (after 'yes'/'no' against capped/uncapped, and expiry overstated at 42/49), and the largest. The rule written into score.js after the first caught this one: **a figure that disagrees with a healthy FOUND score is a scorer bug until proven otherwise** — FOUND for the notice period was 70%.
- **AND THE TWO FIELD DEFINITIONS WERE HARDENED ANYWAY**, not as a proven fix but because both were genuinely under-specified and it is cheap. `noticePeriodDays` read *"Notice period in days for termination/non-renewal"* — two different clauses in one slot, ranked neither — while everything downstream treats it as ONE thing: `renewalDecisionDate` subtracts it from the expiry, the renewal card quotes its span as that deadline's source, and the reminder emails fire off it. It now says which wins, NAMES THE TERM-BEFORE-NOTICE TRAP so the model does not fall into the hole the scorer fell into, and states the month-to-days conversion that its sibling `retentionReleaseDays` already stated (without it "six months' notice" comes back as 180, 182 or 6). `expiryDate` asked for a date on contracts that state only a term — silent arithmetic, which the renewal adviser's own prompt forbids in so many words — and now leaves it EMPTY where the document supports no date. Measured: of 49 marked expiries only 9 state a date and 15 more are derivable.
- **THE REAL FIGURES ARE UNKNOWN UNTIL A RE-RUN.** Nothing here entitles anybody to say the notice period improved; what it says is that the number it was measured with meant nothing.

Tests: f229 section 12 (7 — the four misread spans verbatim, the term reading refusing a notice, an evergreen yielding no truth, and the single-duration case proved unmoved), f230's two field claims.

## WHAT COPILOT COSTS, PER PERSON (owner-asked 14 Aug 2026: "work order for visibility first")

PHASE 1 SHOWS THE NUMBERS AND REFUSES NOTHING. Most workspaces find the spend is lopsided in a way they would rather have a conversation about than block, and a cap designed before anybody has seen the figures is a cap set to the wrong one. Phase 2 (a per-person daily ceiling, following the signing-limit pattern) is NOT built — f203 greps for `copilotCap` and fails if it appears.
- THE WORK WAS ONE FIELD ON A TAG THAT ALREADY TRAVELS, in eleven places — not a new path through every route. recordAiSpend is the ONE recorder, aiBudgetGuard the ONE guard; the gap was in the middle, where the recorder sits inside the call to Anthropic and cannot see the request. aiWho(req) → {id,name} or NULL is the one reading, and every metered site passes `who:` or forwards one.
- A METERED CALL SITE THAT DOES NOT NAME A PERSON IS SPENDING THAT COUNTS AGAINST NOBODY — the per-person total goes quietly short and an admin reads a number that does not add up to the workspace one. f203's first block walks every `await anthropicMessages(...)`/`...Stream(...)` in the server (parenthesis walk, not a regex over multi-line payloads; `await` is what tells a CALL from a MENTION — the definition and a comment both read the bare name) and fails on the twelfth site added without one. Written BEFORE the code, as the work order asked. The order's two "check — no explicit feature" sites resolved to `ocr` and `template_convert`: there was no pre-existing hole.
- aiPlaybookVerdicts is a FORWARDER with two callers — the /api/ai/playbook route and copilotPlaybookCheck inside a chat turn's tool loop (booked to `chat`, because it IS a chat turn's cost). It takes its who rather than inventing one; the tool loop's rides on `aux`.
- A SECOND SMALL TABLE, NOT A WIDER ONE: ai_spend_user keyed (day, user_id). Putting user_id on ai_spend's primary key would multiply its rows by the roster and change what every existing reader gets back; this leaves the by-feature numbers byte-identical. Stores the NAME beside the id for the contract-owner reason — the id survives a rename, the name survives an account being deleted. aiSpendPeople is ONE query with a LEFT JOIN, never one per row: aiSpendToday() runs in aiBudgetGuard on every Copilot request, so N+1 there would be on the hot path of the thing it measures.
- WHERE THERE IS NO PERSON, NOTHING IS BOOKED HERE and the gap is a FIGURE, not a discovery: `unattributed` rides back on the spend object and the panel prints it (only when there IS one — an always-on "$0.0000" is furniture).
- ON BUILD & LAUNCH → COPILOT ENGINE, under the by-feature breakdown, where the money already lives. NOT on the People tab: a per-person cost column turns a list about permissions into a league table, which is a different product decision. set_spend_people_note says what the figure IS — what Anthropic charged for calls this person set off, not a measure of value and not a performance measure — because somebody will read it as one otherwise.
Tests: f203 (22 — the thirteenth-site walk, the ledger's shape, two members' calls landing on two lines against a real server with the two ledgers agreeing, and Phase 2 proved absent), settings-tabs-verify section on the pixels (the breakdown on screen UNDER the by-feature one, its sentence, and no cost column on the roster).

## THE COPILOT'S SUB-PARAGRAPH NOTE IS CONDITIONAL (owner-reported 16 Aug 2026)

copilotPropose (js/ai.js, "WHICH CLAUSE THIS IS, SAID OUT LOUD") tells the model the passage is ONE clause so "4.2 … 4.3 …" is never read as two. The line used to state "Numbers inside it — 4.2, 4.3, (a), (b) — are sub-paragraphs", meaning the numbers as examples — and on a clause with NO numbering the model took them as fact, decided it had been shown a fragment, and refused to draft until "the full clause including its sub-paragraphs" was pasted in, naming those four example numbers back. THE RULE IS NOW AN "IF", NEVER AN ASSERTION: "If it contains numbered or lettered items (for example 4.2 or (a)), treat them as sub-paragraphs of that one clause… Do not ask for sub-paragraphs the passage does not show." Conditional wording was chosen over detecting numbering in the passage because a detector that misses one style (Roman numerals, "a." lists) silently brings the original two-clauses misreading back; an "if" costs nothing when false and binds the same when true. ONE SITE: every entry path — selection menu, clause button, refine, the phone — goes through copilotPropose, so there is no second copy of the line to fix. Tests: f98 both directions (the purpose survives on a numbered passage; the assertion is gone on a plain one).

## A NUMBER IN BRACKETS IS NOT A LIST MARKER (owner-reported 26 Aug 2026)

*"now the structure is breaking"*, over a screenshot of a clause replaced with
one paragraph of ordinary drafting and drawn on the paper as:

> …has an initial term of three
> **(**
> **3)**  years from the Effective Date. Either party may terminate by six
> **(**
> **6)**  months' written notice…

**`aiSplitItems`' MARKER ALTERNATION MATCHED AT TWO OVERLAPPING PLACES INSIDE
"three (3) years"** — once before `(3)` and again before `3)` — so the lone
bracket landed on a line of its own, and the digit after it was then read by
`RL_MARKER` as a sub-paragraph number and put in the hanging indent's gutter.
Reproduced character for character before anything was touched.

**IT IS REACHED FROM `aiPreserveTypography`, WHICH IS RIGHT TO EXIST.** That
function puts the model's wording back into the shape of the passage it
REPLACES; the clause here was a two-limb list, the answer was one paragraph, so
it went looking for a second item and the broken pattern found two. The
function's own note, three lines below, already describes this damage for
INSERTS ("breaking the sentence at its own semicolon to find them") — inserts
were exempted and replaces were not.

**"thirty (30) days" IS HOW LEGAL DRAFTING WRITES A NUMBER**, and it is in
almost every contract, so splitting inside it is never right. TWO NARROWINGS,
each forced by a near miss:
- a **bracketed** marker carries a single letter or a roman numeral — `(a)`,
  `(iv)` — never digits. `(the)` and `(and)` fail it too, which is the same
  rule doing a second job.
- a **bare** marker — `1.`, `2)` — may not sit inside a bracket, and the
  lookbehind spans the digits as well: written `(?<!\()` it merely breaks one
  character later, at `(3` / `0)`. **My own first attempt did exactly that and
  the test caught it.**

**WHAT IS LOST, SAID OUT LOUD:** a run-on list numbered `(1) … (2) …` no longer
re-splits, because bracketed digits are now indistinguishable from a gloss. It
falls through to one line — untidy and TRUE, which beats the mangling above. A
wrong break invents a sub-paragraph nobody drafted; a missed one only leaves a
long line. f97d pins that cost so the next person meets a decision rather than a
mystery.

**ONLY ONE COPY OF THE PATTERN EXISTED**, checked rather than assumed:
`DOC_LABEL` (js/docx.js) and `RL_MARKER` (js/redline.js) are both anchored at
`^`, so neither can split mid-sentence.

**AND THE BROWSER CHECK WAS WRITTEN WRONG FIRST, which is the lesson worth more
than the fix.** It stubbed the ask and pressed "the first `[data-ce-apply]`" —
but parity.html **seeds a proposal card of its own**, so it applied THAT card
and passed identically on the broken code. It was caught only by running it
against the parent commit. It now drives `aiPreserveTypography` with the real
clause's own text, and against the parent it reports the owner's screenshot
verbatim: `"…three\n(\n3) years…"`, offenders `["(", "3) years…", "(", "6)…"]`.
**Run a new browser check against the parent before believing it.**

Tests: f97d (6 — 4 failing against the parent), clause-editor-verify section 15
(4 — 3 failing, reproducing the reported screen).

## COMMENTARY IS NOT WORDING, IN EITHER PERSON (owner-reported 26 Aug 2026)

*"i asked copilot to replace an entire clause and this is what it did"* — over a
screenshot of Clause 2 struck through in red with this filed as its replacement:

> "The drafter wants to replace Clause 2 (Term and Termination), but the
> playbook concern is about Clause 5 (Limitation of Liability), not Clause 2.
> This is a mismatch. The passage shown is indeed Clause 2 and contains only
> term and termination language — nothing about liability."

**THE FOURTH MEMBER OF THE FAMILY F88 (refusals), F98 (questions) and F135
(explanations) started, and every one of those guards missed it for ONE REASON:
it is written entirely in the THIRD PERSON.** It does not refuse, so the
anchored refusal openers saw nothing. It does not ask, and carries no question
mark, so neither ask-back rule fired. And it never says "I" — which is the whole
of what AI_MODEL_VOICE reads. Reproduced against the real parser before anything
was written: `proposedText` came back as the entire paragraph and `advice` came
back empty.

**AI_MODEL_VOICE's own note says contract wording is third person about the
parties. That is true and it is only half the rule** — a model can talk in the
third person too. The half that was missing, and `AI_TASK_TALK` is it: **contract
wording is about the PARTIES AND WHAT THEY MUST DO, so a sentence whose subject
is one of the CONVERSATION'S own objects — who asked, what they were shown, what
the check said — is the model talking, whatever person it talks in.**

**EACH PATTERN IS NARROWER THAN THE OBVIOUS ONE, and the narrowing is the whole
safety argument** — a guard that eats real wording is the same harm pointing the
other way, which is the rule this family is written under. Every narrowing below
is a real clause that forced it:

- **"the drafter" alone is REAL WORDING** — *"shall not be construed against the
  drafter"* is contra proferentem — so a verb of WANTING is required. **"asks"
  and "requests" are deliberately NOT on that verb list**: a SaaS agreement
  genuinely says *"where the User asks us to delete their data"*.
- **"the passage shown" is the model's word for what it was handed.** "text",
  "wording" and "clause" are words a contract uses about ITSELF (*"the wording
  shown in Exhibit A"*), so those are caught only in the *you sent / you quoted*
  form — and *"the text you provided"* is dropped from even that, because
  platform terms really do say it.
- **"playbook" alone is not enough** — a distribution agreement can carry a Brand
  Playbook — so it must be the playbook SPEAKING: its concern, its position,
  what it flags.
- **The verdict is anchored at the front**, like every opener beside it: a clause
  does not begin *"This is a mismatch"*, and *"This is an Agreement between the
  Parties"* does not match it.

**MEASURED, RATHER THAN CONSIDERED: 7,607 sentences of real commercial drafting
(test/cuad's 50 lawyer-marked agreements, already committed for the extraction
scorecard) and AI_TASK_TALK reads NOT ONE of them as a remark.** f135f makes that
a standing claim, and it was proved to BITE by widening the rule the two obvious
ways and watching five real clauses get eaten. **A false-positive net that has
never been shown to fail is a description.**

**AND THE FENCE WAS WIDENED WITH THE NET.** `AI_PROPOSAL_FORMAT` and
`AI_EDIT_FORMAT` forbade *"a question, an apology or a note about missing
context"* — and the reported reply is none of those three. **A fence that lists
three kinds of talk teaches the model a fourth kind is allowed**, so it names the
SHAPE now (a remark about the request itself) and states the exact case that
produced this one: a point raised about some other clause is the advice, not the
wording. Both format contracts changed together, as f135d has required since it
was written.

**AND THE PROMPT WAS NARROWED THE SAME DAY, on the owner's ask** — this REVERSES
the "recorded and not fixed" note that stood here. `cePlaybookLine()` read EVERY
deviation on the whole contract and handed the categories to the model while the
reader was editing ONE clause, which is why it had a Clause 5 concern in front of
it on Clause 2 and, quite correctly, said so. **The model was right and the
product handed it a confusing question.** `ceClauseDeviations()` is the reading
and it asks `rlPbFindClause`, THE ONE MATCHER — never a second copy of "which
clause is this rule about", because the rail beside it locates its findings the
same way. A deviation the matcher cannot place is left out: after the 26 Aug
tightening it refuses when unsure, and pinning an unplaced rule to whichever
clause happens to be open is the reported fault in quieter clothes. **THE OTHER
TWO FACTS ON THAT LIST WERE ALREADY CLAUSE-SCOPED** (`cePrecedentLine` reads this
clause's lead change, `ceTheirAsk` this clause's asks), so the playbook line was
the odd one out rather than this being a new rule. `ce_pb_flags` and
`ce_read_playbook_none` say *clause* now, in both languages — a narrowed reading
under a sentence still claiming the whole contract would be a screen telling the
model something untrue. **WHAT IT COSTS, SAID OUT LOUD:** a whole-contract
question asked from inside this page no longer has the other clauses' flags in
front of it; the Playbook scan tab in the same rail still shows all of them.
**THE GUARD IS STILL THE NET AND IS WHAT WAS ACTUALLY BROKEN** — a model can
produce commentary for a hundred reasons and the paper must survive all of them.
Tests: f245 (14) (6, all six failing against the parent).

**AND IT CAME BACK THE SAME DAY IN NEW CLOTHES (owner-reported 26 Aug 2026: "I
asked for a softer version of a clause and I got this").** Four paragraphs of
Copilot discussing an assignment clause, filed into it whole. **IT WAS NOT A
REGRESSION and that was checked before anything else was said** — measured
against the commit before AI_TASK_TALK, the same reply was filed identically,
1058 characters either way. But it was not FIXED either, and saying so plainly
was the honest answer to the owner's question.

**AI_TASK_TALK WAS STILL A PHRASE LIST**, built around the phrasings of the
first screenshot, and this reply used none of them: it never says "I", never
names the passage, never mentions the playbook. What was missing was a
MEASUREMENT rather than another phrase.

**A QUESTION IS NOT WORDING, AND THE "I" WAS NEVER NEEDED.** `aiAsksTheReader`
demanded a question mark AND the model naming itself — a conjunction written
before anybody had counted how often a contract asks a question. MEASURED
across the same 50 lawyer-marked agreements: **of 3,550 paragraphs not ONE ends
in a question mark**, and of 7,607 sentences exactly TWO contain one at all,
both a quoted title inside a marketing exhibit. `AI_ENDS_ASKING` is that
measured half — a passage that ENDS by asking is the model asking — and the old
conjunction stays for a question mark sitting mid-passage, where a quoted title
really can put one.

**AND THREE TELLS FOR TALK ABOUT THE DRAFTING JOB**, each measured at ZERO
across that corpus and each narrowed by a real clause:
- **"me" IS THE MODEL TOO.** AI_MODEL_VOICE reads the word "I" and a model says
  "me" just as often ("if you want me to draft a softer version"). A DRAFTING
  verb is required, so *"appoint the Attorney to act on my behalf"* and *"we
  shall let the carrier know"* are untouched.
- **"please confirm WHETHER"** is a question wearing an instruction's clothes.
  Plain "please confirm" is deliberately absent, because *"Please confirm your
  acceptance by countersigning"* is real wording.
- **THE DRAFTING REGISTER ONLY** — "a softer version", "the plainer wording":
  the words that describe how something is WRITTEN. A first attempt included
  *revised*, *shorter* and *longer* and ate three real clauses; the near misses
  are in f135i.
- **WHO THE READER ACTS FOR** is a fact about the conversation, and it is the
  SECOND PERSON that gives it away — *"authorised to act for and on behalf of
  the Company"* is not caught.

**THE MEASURED COST WENT FROM ONE TO THREE** and every survivor is named in
f135g: the "Note:" footnote, plus two lines of a marketing exhibit listing
content titles, one carrying a question mark. Bounded, and worth it — the unit
the guard is really asked about is the PARAGRAPH, where the corpus figure is
zero.

Tests: f135h (5), f135i (13 — twelve near misses that pass before AND after,
because they are the wall rather than a regression test), f135g's figure
REVERSED IN PLACE with the paragraph claim added beside it. Six fail against
the parent.

**A HEADING IS NOT A DISCLAIMER**, and this one was found by measuring the WHOLE
guard against the corpus rather than by anybody reporting it. The shipped opener
`/^(?:please note|disclaimer|caveat)\b/` read real contract SECTION HEADINGS as
the model clearing its throat — *"DISCLAIMER OF WARRANTY"*, *"Disclaimer of
Representations and Warranties."* — **three of the guard's four hits across 50
real agreements, and the largest false positive it had. THE TELL IS GRAMMATICAL,
NOT ANOTHER PHRASE**: followed by "of", the word is a noun phrase naming a
section; the model's use is the word standing alone as a lead-in, which the
sibling rule catches by its colon and this one by its absence. So the fix costs
the guard nothing it was catching, and f135g asserts BOTH halves — the headings
reaching the card, and the model's own "Disclaimer:" still caught.
**THE MEASURED NUMBER IS NOW ONE, AND IT IS DELIBERATELY NOT ZERO**: the survivor
is a schedule footnote opening *"Note:"*, which is genuinely two-sided — a model
writes "Note:" as often as a schedule does — and it is left on the standing rule
that the worse error is the other one, a note about the answer filed into the
agreement as wording. f135g pins the figure so the next person meets a decision
rather than a mystery.

Tests: f135e (4 — the reported reply as advice with nothing to apply, and pinned
as carrying no "I" and no question mark so nobody rewrites the fixture into a
case an older rule would catch), f135f (19 — the near misses each pattern was
narrowed to survive, plus the corpus), f135d reversed in place and made stronger.

## THE CHARTS, AND THE HEALTH REPORT

ONE box of recipes: js/aichart.js — Copilot in-chat charts, the Intelligence dock, the four Reports cards (js/views/reports.js; CSS strips kept as the fallback for any workspace where the library does not load), the health report's embedded PNGs. **THE LIBRARY IS SERVED BY THIS WORKSPACE SINCE 26 Aug 2026 — see THE CHART LIBRARY IS OURS TO SERVE below; it used to arrive from cdnjs, so every one of those four surfaces drew only if the READER'S browser could reach a third party.** The AI names a KIND; the recipes read live state; the AI NEVER supplies chart data. Copy-image / PNG / CSV buttons come from ONE delegated listener registered in aichart.js — new surfaces get them free.

The shape is askable: the `breakdown` kind splits group (stream/counterparty/status/risk/month) × measure (value/count) × shape (pie/doughnut/bar/hbar/line); AI_CHART_RULES carries a HARD rule that a named shape is honoured, never substituted;

A NAMED SHAPE IS NOW BINDING, NOT ADVISORY (owner-reported 13 Aug 2026: "I asked for a bar graph and it gave me a pie chart"). The words were "give the status in bar graph format" and the answer was statusBreakdown — a doughnut, whose shape is baked in. The prompt rule was already there and correctly worded; a prompt cannot BIND. The specific trap: the reader named a slice ("the status") that is also the name of a fixed kind, and the kind won. aiAskedShape(ask) reads the shape out of the reader's own sentence and aiHonourShape(spec, ask) applies it in aiExtractCharts — the one place a spec is born, so block.spec is the honoured spec and the card, the canvas and the CSV read one truth. The ask travels through aiFmt via aiLastAsk() (reads `ai` BARE — window.ai exists, but guarding on it is the shape that silently disabled the review gate).
- THE BOUND IS THE WHOLE THING: A SHAPE REQUEST MAY CHANGE THE SHAPE AND MUST NEVER MOVE A NUMBER. AC_SHAPE_SWAP holds only the three kinds a breakdown reproduces EXACTLY — statusBreakdown, riskBands, expiryTimeline — and f177 proves the equivalence label-by-label and figure-by-figure rather than trusting the list. Deliberately absent, each for its own reason: valueByCounterparty (drops its tail where the breakdown folds an "Other" — better arithmetic, not the arithmetic the reader was shown), valueStreamSplit (two datasets, two axes), renewalPipeline (its own arithmetic), cycleTime / obligationsDue (not a slice of the book). A kind already drawn in the shape asked for is not rewritten at all.
- "bar" and "line" are ORDINARY ENGLISH, so their patterns carry their own chart context ("bar graph", "in bars", "as a line chart") — f177 walks "barred by the limitation period", "the bar association" and "sign on the dotted line" and refuses to read a shape out of any of them. Bars over WORDS (counterparty, stream) become hbar, which is the rule valueByCounterparty was built on. Tests: f177 (42). `quoted` takes a shape; aiSimpleChart accepts 'pie'; _acSliceColors gives one colour per slice (Chart.js cycles short arrays — two same-coloured slices on a pie is two readings of one number). Only TWO surfaces let the model pick a kind (Copilot feed, Intel dock) and neither holds a kind list, so new kinds reach both free (f177 pins it). THE EXCEPTION IS ABOUT CLICKING: a chart you look at goes through aichart.js; a chart you CLICK is inline SVG (Negotiation Friction bars, the portfolio risk map — js/views/portfolio.js). If a picture stops being interactive it belongs back in the recipes.

The Portfolio Health Report is DETERMINISTIC — the AI never writes a word. openHealthReport() opens the tab synchronously (popup rules), then fills; charts always on the LIGHT palette. Copilot merely opens it (aiWantsHealthReport in js/ai.js — works with no AI key); the Reports button reaches the SAME builder. Month-on-month reads hati.v1.monthlySnaps in browser localStorage — NO server copy; the report names its snapshot.

The Copilot brief travels in TWO parts: ctx.guideRules (the rulebook) and ctx.guideLive (the snapshot); buildCopilotSystem (server/server.js) stacks two system blocks, cache_control on the first. Failure bubbles carry err:true and are EXCLUDED from aiChatMessages (a stored error poisons later turns). f151 is the drift test: snapshot, health report and recipes must agree with arithmetic over state.contracts — a new figure in the prompt wants a row there.

## THE CHART LIBRARY IS OURS TO SERVE (owner-asked 26 Aug 2026)

Reported as a finding rather than a bug: *"the charting library is fetched from
an outside website each time someone opens a chart. So charts only work if the
reader's browser can reach that third party."*

**IT WAS TRUE, AND THE REACH WAS EVERY CHART IN THE PRODUCT** — the Copilot's
in-chat charts, the Insights dock, the four Reports cards and the health
report's embedded pictures all go through `aiChartLib()`, and it fetched
Chart.js 4.4.1 from `cdnjs.cloudflare.com` on first use. Rarely a problem in an
ordinary office; **total in the building this product is sold into**, where a
bank, a ministry or a large law firm blocks outside sites outright and every
chart quietly stops drawing.

- **NO CONTRACT DATA EVER WENT THERE, and that half of the design held.** The
  model names a KIND and the recipes build the chart from live state in the
  browser, so cdnjs only ever handed over a blank drawing tool. What it saw was
  the reader's address; what it could do was fail. Both are gone.
- **THE BYTES ARE IN `vendor/`, NOT `js/vendor/`, and that is deliberate.** Six
  tests walk `js/` RECURSIVELY (f148 and f232 among them) on the assumption
  that everything under it is a module somebody here wrote; a 205KB minified
  bundle under that roof is a trap for every one of them and for the next sweep
  somebody adds. `js/` means our source. `vendor/README.md` carries the
  provenance, the one line removed (a `sourceMappingURL` pointing at a map that
  is not shipped, which would 404 on every chart) and the upgrade recipe.
- **SERVED AT `/vendor`** by a route beside `/fonts` in server/server.js, cached
  hard for the same reason: a file there is never edited in place. No CSP entry
  was needed — `'self'` already covers it, and the cdnjs entries stay because
  **the OCR path still uses them** (js/ocr.js fetches pdf.js and Tesseract);
  that is the same fault in another feature and is logged, not fixed here.
- **THE GRACEFUL CARD IS KEPT AND ITS WORDS CHANGED.** A local path can 404 too
  — a half-deployed build, a static host not serving /vendor — so the fallback
  still earns its place. It may no longer say *"Charts need an internet
  connection"*: the library is ours, so a failure is ours, and telling the
  reader to check their connection sends them to look in the one place the
  fault is not. `hr_charts_offline` moved with it, in both languages.
- **`AI_CHART_CDN` IS RENAMED `AI_CHART_SRC`** — a constant called CDN pointing
  at a local file is exactly the name that misleads the next reader.

**WHAT PROVES IT, and it is two files answering different questions.** f177
carries the SOURCE claim — the one src is the workspace's own copy, the bytes
are actually committed (a local path that 404s is worse than the CDN it
replaced), the failure card no longer blames the reader's network, and a SWEEP
over js/ that fails on the next surface reaching for a CDN, which is how the
original one arrived. A browser file cannot answer that: run on a
well-connected laptop it passes either way, because the chart draws. So
**analytics-verify carries the other half and now ABORTS every request to
cdnjs and jsdelivr outright**, then requires a real canvas — it reports 4
canvases and 4 embedded report images with the open internet cut off, which is
the thing that was impossible the day before. Its old CHARTJS_LOCAL env-var
dance is gone with the stub it fed.

## AN UPLOADED CONTRACT IS READ ON ARRIVAL (owner-ruled 9 Sep 2026)

*"build 2 but do not code yet. Explain how it works first in plain english"* —
then, off a drawing: *"go with your recommendations on all four"*, a correction
(*"but originally this is what you proposed"*), and *"go"*.

Upload a contract somebody sent you and HaTi reads it there and then — the risk
scan, the brief, Our standards, and a look for obligations — and the answer is
waiting on Home. **THE READINGS ARE NOT NEW.** Every one of them has had a
button on the Checks card since it was built; what was missing is that nobody
presses four buttons on a contract they have not read yet, so the readings
mostly never ran, and the one moment they are worth most — the minute a
counterparty's paper lands — is the moment nothing had been done.

- **IT ADDS NO ROUTE AND NO FIELD ON ANYTHING BUT THE CONTRACT.** `c.triage`
  is one object — when, by whom, one entry per reading, and a `seenAt` — and it
  is absent on every record already on file, so nothing already uploaded reads
  differently and there is nothing to migrate.
- **THE TICK-BOX IS THE WHOLE OF THE OWNER'S FIRST RULING, AND IT IS TICKED.**
  This is the first thing in the product that spends Copilot money **with
  nobody pressing a button**, so it says so on the upload screen and can be
  turned off before the file is filed. Ticked by default because the reading is
  what the feature is; a box nobody notices that costs nothing to clear is the
  honest shape of "on by default, and said out loud". **AND NO BOX MEANS NO
  READING, never a silent yes** — the promise this feature makes is that the
  cost is NAMED, so a box that did not draw is a question nobody was asked.
  Unreachable today, and the direction is what matters: money spent unasked is
  a broken promise the reader cannot see, where a reading that did not happen
  is a card they notice is missing.
- **THREE CALLS, NOT FOUR.** The risk scan is deterministic rule-matching with
  no model behind it, so it costs nothing and always runs. Said out loud
  because "four readings" reads like four bills.
- **A DOCUMENT WITH NO TEXT IS READ BY NOTHING AND PAYS FOR NOTHING.** A
  photographed lease whose words never came out of the file is the commonest
  shape this meets — and the risk scan is rule-matching over a string, so on an
  empty one it **"succeeds" by finding nothing in nothing**. Left there, the
  card would report a contract as read and clean when not one word had been
  seen: the wrong answer wearing a right one's clothes. The runner asks once,
  before it spends anything, and every reading says it could not read the
  document.
- **AND THAT IS NOT THE READERS' OWN FLOOR.** `OBLIG_TEXT_MIN` is named ONCE in
  js/obligations.js and read by three: the reader refuses a document under it,
  the read-stamp is withheld for one, and auto-triage asks it BY NAME. What the
  runner asks is strictly weaker and obviously true — *is there any text at
  all* — so a short document still goes to the readers and still gets each
  one's own refusal.
- **NOTHING IS FILED ON THE READER'S BEHALF THAT A PERSON WOULD HAVE TICKED.**
  The owner's fourth ruling: the obligations the scan proposes are **held on
  the triage record and never written to `c.obligations`** — a person still
  opens the list and ticks. The brief, the standards pass and the risk scan are
  READINGS and are stored as the ordinary readings they already were.
- **THE READERS STOP SHOUTING, AND `opts.quiet` SUPPRESSES THE TOAST AND
  NOTHING ELSE.** Three red boxes over one upload is the fault this product has
  already been rung about. **A QUIET CALLER MAY NEVER BE QUIETER AND WORSE**:
  written the first way it took the FALLBACK with the toast, so where the AI
  leg throws it returned *unavailable* while a loud caller falls through to the
  heuristic — a real reading — and the card would have said nothing was found
  on a contract a person pressing the same button gets answers for. Where there
  is genuinely no answer the reason IS handed back, for the card to print where
  the reader is looking. Every existing caller passes nothing and behaves
  exactly as it did.
- **ONE ORDER, ONE LIST.** `TRIAGE_STEPS` is what the runner walks, what the
  card counts and what the tiles are built from, so the runner and the card can
  never disagree about how many readings there are. Each runs in its own try:
  one refusal does not take the other three down, and a reading this stage does
  not carry says so rather than vanishing.
- **ONE AUDIT LINE, and it says what was READ rather than what was found** —
  the findings are on the record and have their own lines.

**THE ANSWER IS A ROW IN A LIST THAT ALREADY EXISTS.** It leads *Needs your
decision* on Home, which already takes rows from five sources, and folds to an
ordinary row. **NO BAND, NO STRIP, NO NEW SECTION** — the standing rule, and it
is why the card was drawn there rather than anywhere else.

- **FOUR TILES: Brief · Standards · Obligations · Filed.** Each states what was
  found and presses through to where it is acted on.
- **THE SIGNING-ROUTE TILE IS HELD BACK, and this is a real gap rather than a
  trim.** HaTi has no reading of *who signs this* on an uploaded contract, so a
  tile there would be a guess, and "Change the route" waits on it. **Filed
  stays**, because it only reports the stream and the owner already on the
  record.
- **THE CARD CLEARS BECAUSE SOMEBODY PRESSED IT.** `triageAck` stamps `seenAt`
  — an ACT, never a render — so a card cannot clear itself by being drawn, and
  the alerts rule is kept: it clears when the work does.
- **IT COUNTS NOTHING OF ITS OWN.** The row's line, the tiles and the fold all
  read `c.triage`; a second count is how the card and the tiles would come to
  disagree.

**AND THE HEADLINE SAYS WHAT ACTUALLY HAPPENED, which the browser found and
no source check could.** On a scanned lease whose words never came out of the
file, the tag read *Not read*, the sub-line read *No text came out of the
file*, and the TITLE — the one line set biggest — read *read and ready for
you*: the card contradicting itself, with the wrong half winning. The title is
chosen by `triageReadAnything`, the SAME reading the tag and the coloured edge
already use, so the three cannot come apart. **A card arguing with itself is
only visible on a rendered card.**

**AND A TILE PRINTED A COUNT WITH NOTHING UNDER IT.** The obligations tile read
`x.text`; the field is **`desc`** — the server's schema requires it, the
heuristic writes it, and every obligation surface in the product reads it. So
the card would have said *2* with no words: a number the reader cannot act on.
Found by re-reading the diff against the server's own schema, and the check that
catches it was proved to FAIL against the defect before it was trusted.

**AND I EDITED DEAD CODE FOR AN HOUR, WHICH IS THE LESSON WORTH MOST HERE.**
js/views/home.js builds a `decisionRows` / `activitySection` pair that is
**never interpolated** — the live renderer is `ddRows`, in the `.hm-*`
vocabulary — so a row added to the obvious-looking builder drew nothing, in
silence, and every source check passed. Found by probing the rendered page for
what it actually held. **When a change draws nothing, ask the PAGE what it has
before re-reading the source.**

**REVERSED IN PLACE: "obligationsReadStamp is written by the SCAN and by
nothing else"** (J-2.2, above). Auto-triage stamps it too — and the rule's
REASON is untouched, which is why this is a widening rather than a hole: that
sentence exists so a stamp can never claim a reading that did not happen, and
auto-triage runs the SAME reader through the SAME named floor before it stamps.
Two callers now, each asserted; a third that stamps without reading fails f254.

**AND THE RECORD HAS TO BE ON THE SERVER BEFORE IT CAN BE READ (owner-reported
9 Sep 2026, on their own upload: the box was ticked and the Contract brief card
still read "Not written yet").** `persist()` in API mode is **debounced by
400ms** and returns nothing to wait on, so the readings fired before the
contract had been created — and `POST /api/ai/brief` looks the row up BEFORE it
reads a word (it has to: out of scope must read exactly like does not exist), so
it answered **404 "Contract not found"**, every time, on every real upload.

- **THE OTHER THREE LANDED, WHICH IS WHAT MADE IT LOOK LIKE NOTHING RAN.** The
  risk scan is browser-side, and the standards and obligation routes read the
  CLIENT's text out of the body. Only the brief needs the stored row — and the
  brief is the one card on the screen the reader lands on.
- **`flushSaves()` IS THIS PRODUCT'S OWN MOVE FOR THAT MOMENT**, made after
  creating a contract by the template library and awaited by the migration
  importer. **THE PAIR IS THE CLAIM**: the save is waited for and the READINGS
  still are not, because awaiting those would make somebody watch a spinner
  before their own contract appeared. A save that FAILS still lets them start —
  the reading then answers honestly on the card, which beats silence.
- **AND THE NET COULD NOT SEE IT, WHICH IS THE LESSON WORTH MORE THAN THE FIX.**
  Every section of auto-triage-verify CALLED `triageRun` on a contract it seeded
  itself. That proves the reader works **from a state nobody arrives in**, and
  proves nothing about whether pressing **File contract** reaches it — the same
  fault this file already records against a pill that opens nothing and a door
  whose handler was never wired. Section 7 starts where the reader starts:
  it opens the dialog, sets a real file, presses the real button, and asserts no
  reading was refused because the record was not there. It reports the owner's
  own sentence verbatim against the parent, and **7a/7b pass either way** — the
  controls that prove the journey is really being driven.
- **THE REFUSAL IS PINNED, NOT THE SUCCESS.** "no reading says Contract not
  found" stays true on a workspace with no Copilot key, where the brief refuses
  for its own honest reason — a different answer from the record not being there.

**AND TWO MORE OFF THE SAME UPLOAD (owner-reported 9 Sep 2026), both of which
failed as SILENCE or as the wrong sentence rather than as an error.**

- **THE BRIEF TILE WAS ALWAYS EMPTY.** `triageBriefLine` read `b.summary ||
  b.headline`; the route answers `{v, at, by, inputHash, truncated, data}` and
  **every field a reader sees is one level down under `data`** —
  `renderBriefSection` reads exactly that. Neither name has ever existed on a
  brief, so it returned `''` on every contract in the product and the tile drew
  its tick with nothing under it. **THE SIBLING OF THE OBLIGATIONS TILE READING
  `text` WHERE THE FIELD IS `desc`**, which was caught before it shipped and
  this was not — both found by DUMPING WHAT A REAL RUN RENDERS rather than by
  reading the schema. It takes the first sentence of `data.overview`: the
  brief's own answer to what this contract is, so the tile can never say
  something the panel behind it does not.
- **AND A READING NOBODY ASKED FOR SHOUTED.** A red box over the page: *"The
  Copilot answer was longer than the space allowed and was cut short … Try
  again, or narrow what you asked for."* Written for somebody who ASKED — nobody
  asked, so there was nothing to narrow. **Each reading suppresses its OWN toast
  and none of them could reach this one**: `api()` surfaces the server's
  `notice` centrally for all ~200 callers, so auto-triage's promise held for
  every refusal and broke on the one the server volunteers. `api(path, method,
  body, opts)` takes `opts.quiet` and the three readings hand theirs down.
- **THE SUPPRESSION AND THE SAYING ARE ONE CHANGE.** Silencing the box without
  carrying the fact turns a badly-worded warning into a **silent trim**, which
  is worse — the standing rule is that a cap is a FACT. Each reading writes
  `opts.notice` back on the options bag it was handed (already its out-param for
  a refusal), triage records it on the step, and the tile it happened to says so
  after what WAS read. Said once, where it happened.
- **THE HARNESS CANNOT ANSWER THIS ONE, said out loud.** Its server has no
  Copilot, so a brief comes back with `data:{}` — the tile is empty there
  whatever the code does. The reading is pinned in node against the real shape
  instead (and against the shape it used to read, which yields nothing), and
  that is what fails on the parent.
- **AND TWO EXISTING CLAIMS PINNED A LITERAL WHERE THE CLAIM WAS A RELATION** —
  f134 pinned `api()`'s exact parameter list as a proxy for "still JSON-only",
  and f230 matched an api call to its closing bracket. Both re-pointed. **A
  probe reading api()'s neighbourhood also read the COMMENT explaining why it is
  JSON-only and reported the prose as the code**: end a slice at the function's
  own last line.

**AND A READING THAT WAS NOT KEPT IS NOT RECORDED AS DONE (owner-reported
10 Sep 2026).** *"contract brief in the top highlight says brief written but as
you can see on the bottom highlighted area on the contract brief, I had to click
write brief for a second time. This should not be the case if it was already
written before."*

- **BOTH HALVES WERE TELLING THE TRUTH ABOUT DIFFERENT THINGS, and that is what
  made it look like a broken card rather than a wrong sentence.** A brief the
  provider CUT SHORT is deliberately **not written to the briefs table** — the
  route's own note says why in its own words, *"the reader is told, and the next
  press asks again rather than being handed a permanent half-answer"* — so it
  exists for that one sitting and is gone the moment the contract is read back.
  **The triage record is DURABLE**, so the strip went on saying the brief was
  written for ever, while the card beside it correctly said there was none.
- **THE CACHING RULE IS RIGHT AND IS UNTOUCHED**, and f280 (4) pins it so this
  cannot be "fixed" the other way round: caching a half-answer would hand the
  reader a permanent one, which is worse than asking again. What was wrong is
  the SUMMARY claiming a reading the record does not hold.
- **AND THE SUMMARY LINE GOES WITH IT, deliberately.** It was drawn from a brief
  nobody can now open, and a one-line précis of something that is not there is
  the contradiction this fixes rather than a consolation for it. The step
  carries the reason instead, and the reason names **the one thing the reader
  can act on** — write it again.
- **THE ORDER IS THE FIX.** The truncated branch is asked BEFORE the ordinary
  success one, or an answer that was cut short still lands as written; f280 (3)
  asserts the ordering rather than only the branch.
- **THE TILE FOLLOWS BY CONSTRUCTION**, which is why this needed no second rule
  and no browser restaging: `triageTiles` reads the step, so a step recorded
  not-done takes `TRIAGE_HEADS.brief.no` and prints its reason wherever it is
  drawn. Asserted as that RELATION in f280 (6).
- **IT IS THE BRIEF ALONE.** A cut-short brief must not read as a failed triage
  — the strip's headline asks whether ANYTHING was read, and the risk scan, the
  standards pass and the obligations reader are untouched by it.

**AND WHAT WAS READ IS ON THE CONTRACT ITSELF (owner-ruled 9 Sep 2026, off
three drawn options).** *"it still lands in the key terms page and I then have
to go back to the home page which is not ideal"* — and the answer chosen was to
bring the CARD to the contract rather than move where an upload lands, so
**their own 20 Aug ruling stands untouched**: an upload still opens on Key
terms, because it arrives with a complete document and empty terms.

- **KEY TERMS ONLY, AND THAT IS THE SIX QUESTIONS' ONE ABSOLUTE REFUSAL RATHER
  THAN A PREFERENCE.** A strip above the tab content pushes what is under it
  down, and on the Document tab what is under it is the agreement. The slot is
  mounted INSIDE `[data-ws-pane="terms"]`, so the refusal holds by construction
  rather than by care — measured as pixels, not asserted. Nothing is lost: the
  Document tab's own Checks card carries the same three readings.
- **IT BORROWS `triageTiles`, THE ONE READING**, so Home and the contract can
  never disagree about what was found; only the drawing differs. It makes no
  reading of its own and f273 greps the builder for every runner.
- **A SLOT AND A PAINTER, because the room is rendered BEFORE the readings
  run** — submitUpload puts the contract on screen and only then starts them, so
  interpolating the strip draws nothing and leaves no element for the paint to
  replace. `#ws-tabrow-end`'s own pattern. `paintKtTriage` is the ONE place it
  is drawn or wired, and `renderKeyTerms` calls it — which is what auto-triage's
  `onStep` already calls, so the tiles fill in under the reader.
- **NO ACTS ON IT, DELIBERATELY.** Home's three all exist to get you TO the
  contract and you are on it; the brief's own button is an inch below and the
  standards and risk are on the card that owns them. A second door onto an act
  that already has one is the drift this rulebook opens by warning about. What
  it carries is the one thing not available elsewhere: a way to put it away.
- **AND IT GOES ON HOME'S OWN STAMP.** `triageAck`, one fact and one state, so
  dismissing it in either place dismisses it in both — and an always-there strip
  is furniture, while the readings live on in their own cards for good.
- **AND A PROBE THAT CALLS WHAT A READER PRESSES MEASURES A HIDDEN PANE.**
  `roomGoTab` takes the CONTRACT first and is a module function, not a global in
  the real app, so `roomGoTab('terms')` from a browser file did nothing at all
  and every measurement after it read a pane that was still `display:none` —
  reported as a strip 0px wide. Press the tab button.

**AND THREE MORE OFF THE SAME UPLOAD (owner-reported 9 Sep 2026).**

- **A READING STILL IN FLIGHT WAS DRAWN AS A FAILURE.** *"If it is still
  loading, i should see an action of still loading for each card."* A step that
  has not been ATTEMPTED is simply absent from `t.steps`, and read as `!ok` that
  is **indistinguishable from one that was attempted and failed** — so for the
  minute the readings take, every tile accused them of failing, with no reason
  under it because a step that has not run has none to give. **THREE STATES NOW,
  and `TRIAGE_HEADS` is ONE TABLE naming three heads per reading** so a caller
  cannot forget the third; `triageBusy(c)` reads `_triaging`, which is set for
  the life of the run and deleted in its `finally`, so the same absence
  afterwards is a real gap and still says so. **The busy tile takes no tone and
  no count** — a colour there would be the strip claiming an outcome it does not
  have.
- **THE CARD IS OFF HOME.** *"delete the 4 cards from the home page and simply
  land in the key terms page when you upload with the boxes attached."* The four
  tiles are on the contract's own Key terms tab, and the same four in two places
  is the duplication this rulebook opens by warning about. **THE BUILDER SURVIVES
  WITH NO CALLER** — this file's own convention — so it is one line to put back;
  what went is the SOURCE the decisions list read them from. **WHAT IT COSTS,
  said out loud:** nothing on Home now says a contract arrived and was read.
- **AND THE SIDE COLUMN WAS NEVER REPAINTED**, so the Contract brief card went
  on reading *"Not written yet"* — offering to run what had just run — over a
  brief already on the record. A reading lands on `c._brief`, `c.playbook` and
  `c.scan`, the same places the manual buttons write, so **nothing ever had to be
  run twice**; what was wrong is that the card SAYING so was painted before the
  reading finished and nothing repainted it. **`renderKeyTermsSide` is NOT on
  contract.js's export list while its two neighbours ARE**, so a `window.` guard
  would have been false for exactly the one being added — silently. All three
  live in that file, so they are called BARE and there is no window question to
  get right.
- **AND A FIRST WRITING OF THAT CLAIMED ALL THREE WERE UNPUBLISHED AND THE
  CALLBACK HAD NEVER RUN.** It was read off the export statement's FIRST LINE
  and that list spans several. A test caught it. **Read the whole statement, and
  correct the comment when the reading was wrong** — a note that misdescribes
  the code is worse than none.
- **AND A PROBE CANNOT HAND-BUILD A CONTRACT AND THEN OPEN ITS ROOM.** A record
  pushed onto `state.contracts` alone does not exist on the SERVER, so the room
  draws **no panes at all** — reported three times as the strip being missing
  when what was missing was the room. The Home card could be staged that way
  because it only ever needed the object; a claim about the contract's own page
  is staged through the real upload. **An absence that reports WHY is what
  turned that from three wrong diagnoses into one.**

**AND A READING ALREADY MADE IS OFFERED, NEVER MADE TWICE (owner-reported
9 Sep 2026).** *"although it ran the obligations in image 1, there are not
there in image 2 meaning I have to run obligations again."* The strip said "20
obligations found" and the Checks row twelve pixels below said **"Run →"** —
because triage PROPOSES obligations and files none, which is the owner's own
fourth ruling. **BOTH WERE TELLING THE TRUTH AND THE PAIR READ AS A PRODUCT
THAT HAD LOST ITS OWN ANSWER**, and pressing Run paid Copilot for the same
reading a second time.

- **`triageHeldObligations(c)` IS THE ONE READING**: what triage proposed, less
  anything now on the contract, through **`obligationAlreadyOn`** — the
  product's own dedupe, the same one the review dialog unticks a duplicate with
  — so it empties itself as they are ticked and the ordinary scan comes back.
  **RULING 4 IS UNTOUCHED**: it files nothing, and f273 greps it for every
  writer.
- **THE FIX IS AT THE FUNNEL, NOT THE TWO DOORS.** The Checks card and the
  Obligations tab both press `runFindObligations`, and so will the next door;
  teaching each separately is how they come to disagree about whether a scan is
  owed. It returns BEFORE the scan and ends in **the same review dialog the scan
  ends in**, so nothing about who decides has moved.
- **THE ROW SAYS A READING IS WAITING, IN STEEL.** `checkVerdict` returned null
  with nothing ticked yet, which is what drew "Run →". **Steel, not amber**:
  nothing is late and nothing is wrong, there is simply a list nobody has looked
  at, and amber on that card means work the contract owes. **The tone had to be
  DRAWN** — without a branch it fell through to GREEN, the row saying this
  contract is clear when the work has not been read.
- **AND THE VERDICT IS CARRIED AS AN OBJECT, NOT A BOOLEAN.** `const
  ran=!!checkVerdict(...)` made a held reading indistinguishable from findings
  already on the record, so the press opened the panel — which shows what is ON
  the contract, and nothing is. **BOTH presses ask `ran.held`**, or one row
  behaves two ways depending on which the reader used.
- **AND ONLY A BROWSER CAN ASK THE CLAIM THAT MATTERS.** A source check sees the
  early return; whether the press reaches the provider again is a count of
  requests on a real page. Against the parent it reports `calls: 1`.

**NOT BUILT, said out loud:** the signing-route tile and its "Change the route"
(above); nothing runs on a contract drafted from a template — this is for paper
somebody sent you; the card is not on the phone; and nothing about it reaches
the counterparty, asserted rather than assumed.

Tests: f280 (3)-(7) for the cut-short brief — the branch, its ordering, the caching rule it rests on, the tile that follows it, both languages, and the reproduction against a real server with a provider scripted to cut the answer short (the CONTROL first: a whole brief IS kept, or "nothing was kept" passes against a server that keeps nothing) — plus
f273 (59 — the runner's order, the three quiet readers, the empty
document proved to spend nothing, the obligations proved HELD and not filed,
the named floor with its three readers, the card's reading, the headline
following that reading, the acknowledgement as an act, and both languages; the
file cannot even load against the parent, because the reading does not exist),
f254's stamp claim REVERSED IN PLACE and made stronger, f260's stamp claim
RE-POINTED at the named floor rather than the number, **auto-triage-verify (29,
browser — 23 of the first 28 fail against the parent, the headline one reporting the
tick-box absent from the upload screen; the box driven through the real file
input, the run driven for real with no toast raised, the card measured as
VISIBLE PIXELS at the top of the list, the fold, each act, and the
could-not-read card, whose own title is check 6d. Every driven half is guarded,
so a build without the feature REPORTS its failures rather than stopping at the
fourth)**.

## THE RENEWAL NOTE IS WRITTEN BEFORE ANYBODY ARRIVES (Young ruled 9 Sep 2026)

*"why cant we build the overnight feature then?"* — and the answer was that ONE
DECISION was missing rather than one night's code. Put to them: two of the
desk's three kinds are INSTANT READINGS (counting a late promise or unread
paper at 3am gives the same rows as counting them when Home opens, so overnight
buys nothing but the word); the one genuinely prepared piece of work is HaTi
writing the renewal memo; and that is the only thing on the desk that spends
Copilot money with nobody pressing a button. **Young ruled who pays: "the
person whose contract it is."**

- **THE OWNER PAYS, AND THAT IS THE WHOLE FEATURE IN ONE LINE.** `meter.who` is
  built from `c.owner` rather than from a request — f203's rule is that a
  metered call naming nobody is spending that counts against nobody, and it
  surfaces in the admin panel's `unattributed` figure.
- **SO A CONTRACT WITH NO OWNER IS NOT PREPARED.** Imported and uploaded paper
  has no owner and never will (`contractOwnerStamp`'s own note), and preparing
  it would be exactly the unattributed spend the ruling exists to prevent.
  **Nothing is lost**: the desk row still stands with the facts HaTi is certain
  of, and Review still writes the memo on a real person's press.
- **THE WORKING CORE IS LIFTED OUT OF ITS ROUTE** — `renewalSignalsOf` and
  `aiRenewalAdvice`, `aiPlaybookVerdicts`' own shape for its own reason: two
  copies of *what the renewal advice IS* is how the card a person runs and the
  card waiting in the morning come to say different things. The route keeps its
  own middleware, validation, errors and cache, and f219 proves it unchanged.
  **`doc` comes IN rather than being read inside**, so the route goes on marking
  its own request as capped while the sweep passes `aiDocText(null, …)`.
- **ONCE PER RENEWAL CYCLE, NOT ONCE A NIGHT.** The signals carry
  `daysToDecision`, which moves every day, so the advice CACHE cannot bound this
  — its hash changes nightly and every contract would re-run every night. The
  dedupe is the reminders table, the daily brief's own mechanism, keyed on the
  DECISION DATE: prepared once when a contract enters the window, again only if
  the term moves under it. **The row is written only on a call that succeeded
  and was not cut short**, so a provider failure is retried tomorrow rather than
  silently marking the cycle done.
- **THREE BOUNDS, AND THE FIRST IS THE ONE THAT USUALLY DOES NOT EXIST HERE.**
  `aiBudgetGuard` is MIDDLEWARE and this has no request, so the workspace's own
  daily spend ceiling is asked BY HAND before every call and the whole run stops
  when it bites — a night that quietly spent the next morning's budget would be
  worse than no preparation at all. Then a nightly cap (`aiRenewalPrepMax`), so
  a workspace that has just migrated four hundred contracts does not wake up to
  four hundred calls. Then the switch.
- **IT IS STOPPABLE FROM A SCREEN.** `aiRenewalPrep` on the Copilot engine
  panel, **absent meaning ON** — the whole migration story. Money spent with
  nobody pressing anything must be refusable by somebody, and the row says who
  the charge is booked to.
- **IT WRITES NOTHING TO THE CONTRACT RECORD.** The advice has its own table, so
  the sealed record a renewal question is always about is never touched —
  `aiNoteRead`'s own lesson, which is what made this safe to run unattended at
  all. No audit line, no version bump.
- **IT RIDES THE SAME TIMER AS THE OTHER TWO SWEEPS, UNDER ITS OWN CATCH** with
  its own admin-visible outbox note — the third application of the M-6 lesson,
  and why all three are written out rather than looped. It is the only one that
  is ASYNC, so it is started and left to finish: a renewal memo may never delay
  a renewal reminder.

**AND THE DESK COULD NOT HAVE SEEN IT — a defect in the desk shipped that
morning, found by building this.** Home reads `state.contracts`, which in server
mode is the LIGHT list, and `_renewalAdvice` is transport attached only by a
single contract's own GET. So *"renewal note ready"* was right in local mode and
**could never draw in production** — the recorded defect class, after the
dashboard's raised-by-me and Reports' cycle time. **`_renewalPrep` is the list's
twin**, `_hasBrief`'s own shape: ONE query for the whole page, a WORD and not
the memo, and the word says WHICH — `'night'` where HaTi prepared it unprompted,
`'you'` where somebody ran it. The desk asks the list's word FIRST and falls
back to the whole record, so it is right in both modes; stripped on save like
its two neighbours.

**THE HEADER STILL CLAIMS NO CLOCK TIME, and that is a deliberate refusal of the
word the owner asked about.** *Prepared for you* is true of all three rows;
*Prepared overnight* would be true of at most one, since the other two are
instant readings that were never prepared at all. **The fact went on the ROW
instead** — `desk_ren_ready`, "memo prepared for you", against `desk_ren_memo`
for one somebody ran — which is the cheapest channel that carries it and the
place it is actually true. One word changes the header if the owner rules that
way.

**NOT BUILT, said out loud:** nothing else on the desk is prepared unattended
(the drafted amendment named in the desk's own section stays unbuilt), the two
instant kinds are untouched, and the counterparty's page is not involved at all.

Tests: f275 (23 — **21 of them fail against the parent**; the owner named by the
spend ledger against a real server with a scripted provider, the no-owner
refusal, the three other refusals, the once-per-cycle dedupe, all three bounds
each proved to BITE, the record proved untouched, and the desk read end to end),
f219 unchanged at 17 (the route's behaviour is the condition on the lift),
settings-tabs-verify (68 — the switch measured as VISIBLE PIXELS, because a
source check cannot see whether a row draws).

## WHAT COPILOT PROPOSED, AND WHAT BECAME OF IT (owner-asked 9 Sep 2026, ideas 22 & 23)

*"implement 23 and 22 but for 23, do not delete the where I have to enter the
anthropic key for now per the attached image."*

Two screens, and they are **ONE RECORDING SEEN TWICE**: the AI involvement
record in a contract's own evidence pack (22), and acceptance metrics in
Settings → Build & launch → Copilot engine (23).

**NEITHER COULD BE COMPUTED FROM ANYTHING ON FILE.** The product recorded that a
change came from Copilot — `note` reads *"Copilot — Simplify"* — and nothing
else: not what was offered and never taken, and not whether wording that WAS
taken went in word-for-word or was rewritten first. The build order's own
parenthetical had said *"quietly start recording Copilot's involvement — for 23
later"* and it was never built, so the recording is most of this job and the two
screens are only as true as it is.

- **`js/aitrace.js` IS THE RECORDING AND IT ADDS NO ROUTE AND NO TABLE.**
  `c.aiTrace` is an ordinary field, so it rides the light list by construction
  (HEAVY spreads the record and strips five named things), and the workspace
  reading counts `state.contracts` in the browser — the caller's own
  already-scoped bootstrap. Same shelf as js/precedent.js and js/payterms.js:
  a deterministic reading with no view and no network verb. **Its own file is
  load-bearing** — four surfaces reach it, and written inside any one of them
  the others would read it through `window` on a stage that does not carry that
  view and record NOTHING, silently.
- **FIVE OUTCOMES, AND THE FIFTH IS THE HONEST ONE.** `proposed` (offered,
  nothing has happened) is printed and **never counted as a refusal** — this
  codebase's own rule that a call which never got an answer is not a wrong
  answer. `as-is`, `edited`, `refused`, and `read` for a reading, which is
  counted apart because it was never a candidate for the agreement.
- **SETTLED AT THE FUNNEL, NOT AT THE PRESS.** `negoFileChange` is where every
  change is filed, so a proposal that reached the agreement by any door is
  marked without that door knowing it had to — the same reasoning the two guards
  above it are written under. **OUR SIDE ONLY**: a counterparty change on the
  same clause is their wording, and letting it settle one of ours would mark a
  proposal nobody here took as taken. **The newest APPLIED proposal on that
  clause, and only that one** — a reader who takes card A, then B over it, then
  files has used B, so A stays `proposed`, which is what "offered, not taken"
  means.
- **THE HASH IS FOR EQUALITY, NEVER FOR ATTESTATION**, and the file says so by
  name. It is a cheap FNV over the TEXT PROJECTION, so a change of dressing that
  leaves the words alone still reads as taken as-is — which is what a reader
  means by it. **It is not the seal** (SHA-256 over the sealed wording) and not
  the negotiation fingerprint.
- **THREE SURFACES RECORD, EACH AT ITS OWN NATURAL MOMENT.** The clause editor's
  Copilot card is recorded **at arrival**, because a card is one paid answer to
  one question and a proposal recorded only when it is applied can never report
  the ones nobody wanted. The playbook is recorded **at the press**, because a
  finding STANDS on its card until it is dealt with — recording it earlier would
  count the same not-yet twice, once on a card and once as a statistic.
  Obligations are recorded **at the draw**, so the denominator is every proposal
  the reader was SHOWN rather than only the ones they got round to answering.
- **ONLY THE DRAFT IS COPILOT'S WORDING.** `rlPlaybookProposals` names three and
  only `draft` is the model's; `preferred` and `fallback` are the clause
  library's, approved in this workspace. Counting a *"Use our standard"* press as
  a Copilot proposal accepted would be this product taking credit for its
  customer's own drafting — **so it is recorded as a refusal of the draft, which
  is exactly what it is.**
- **A DUPLICATE OBLIGATION IS NEITHER**, and is not recorded: Copilot proposed
  something the contract already carries, so there is no decision for a person to
  make. Ticking is `as-is` and never `edited` — that window offers no way to
  change the wording, so an edited outcome there would be a state the screen
  cannot produce.
- **DRAFT FROM A SENTENCE IS DELIBERATELY NOT RECORDED, said out loud.** Its
  proposal becomes a CONTRACT, so a draft nobody took has no contract to be
  recorded on: the feature could only ever report as-is and edited, and a "not
  taken" column reading zero for it would be a lie by omission on the one row
  that could not answer.
- **A SEALED RECORD TAKES NO COURTESY WRITE** — `aiTraceSave` is `aiNoteRead`'s
  own reasoning one field along: persist is refused outright on an executed
  contract, so it records in memory and declines to save.
- **THE CAP IS A FACT.** `AI_TRACE_MAX` (40) per contract, oldest dropped, and
  the label and the "rested on" line are clipped rather than stored whole — what
  is wanted from them is recognition, and the wording itself is one press away on
  the clause the entry names.

**IDEA 22 — THE PACK STATES WHAT IT IS NOT, IN ITS OWN FIRST LINE.** *"Nothing
here is part of the agreement — the agreement is the sealed wording above."* A
lawyer reading it in a dispute must not have to infer that, and reading it the
other way round — as though the model had authored a clause — is what a plain
statement at the top is for. **It keeps ENGLISH**, because a record read by
somebody who was never in this workspace must not put two languages in one
exhibit. Drawn only where there is something to say; a `copilot` key reading zero
on every older pack would be a section about an absence.

**IDEA 23 — IT SITS UNDER THE MONEY, AND THE KEY BOX IS UNTOUCHED.** The owner's
own instruction, and it is asserted as a control rather than assumed: the
Anthropic key box, Remove key, the model routing and both spend tables are all
still drawn, and the new section reads AFTER them — what Copilot COST is directly
above, what came OF it is here, and everything below is configuration.

- **THE FEATURE IS THE SURFACE THAT PROPOSED, NOT THE SPEND BUCKET.** The clause
  editor's Copilot spends on the `chat` route, so borrowing the server's
  `AI_FEATURE_LABEL` would file every redline proposal under a row called
  "Copilot" that also holds every question anybody asked anywhere. `redline` ·
  `playbook` · `obligations`, named once in `AI_TRACE_FEATURES` and resolved at
  read time so it follows a reader who changes language mid-sitting.
- **THE TABLE PRINTS COUNTS AND THE TILES PRINT SHARES — a departure from the
  drawing**, which put a percentage in every cell. A percentage per row hides its
  own sample size, and three rounded shares regularly sum to 99 or 101; a table
  that does not add up is a table nobody trusts. **`aiTraceShares` is the one
  arithmetic** (drawn in the drawer it would be a drawing that computes) and
  **NOT TAKEN takes the rounding residual**, which errs towards showing a lower
  acceptance — the honest direction for a number this product has an interest in.
- **"NOT TAKEN" HOLDS BOTH HALVES on purpose** — wording that was declined and
  wording nobody used. They are different facts and the record keeps them apart;
  a five-column table in a drawer this narrow is what would have to give, and the
  note under it says what the column counts.
- **AND IT SAYS WHEN THE COUNTING STARTED.** A workspace with a year of Copilot
  behind it would otherwise read "3 proposals" as a verdict on the feature. The
  recording began when it was built and nothing before it can ever be counted.
- **AN EMPTY BOOK SAYS WHICH KIND OF EMPTY IT IS** — read and genuinely quiet, or
  a recording that has not had time to fill.
- **DRAWN IN BOTH MODES FROM ONE BUILDER.** It counts the book in the browser and
  needs no server, so a workspace running without one has the same question and
  would otherwise lose the answer for no reason.

**AND THE HARNESS PAGES HAD TO LEARN THE NEW FILE — the browser check caught it
in one run.** Those pages build their own script list rather than loading
index.html, so `window.aiTraceNote` was silently undefined and a card recorded
NOTHING while every source claim passed. Four of them load the funnel and all
four now load this beside it.

**AND A CHECK THAT INHERITS TWENTY-SEVEN SECTIONS OF DRAFTS PROVES NOTHING ABOUT
ITSELF**, paid for again here: the file press did nothing, three diagnoses chased
the product, and an isolated probe showed the whole chain working on a fresh
page. Section 28 reloads and stages its own ground.

**AND THE SCREEN WAS EMPTY, WHICH FROM THE OWNER'S CHAIR IS NOT BUILT
(owner-reported 9 Sep 2026, three times).** *"I do not see the changes for 23
and 22 as designed in the artifact"*, then *"but I also cannot find this"*, then
— over a screenshot of the section itself — *"like i said, it is not there."*

**THEY WERE RIGHT, AND THE FAULT WAS THE DELIVERY RATHER THAN THE CODE.** The
recording starts the day it ships, so on a workspace with a year of Copilot
behind it the drawer opens on "Nothing recorded yet" and stays there for weeks
— below a wall of number boxes that took four screenshots to scroll past. What
was handed over was the machinery and an empty box, and the honest thing to
have said at the point of merging was so.

- **`aiTraceHistory` COUNTS WHAT THE BOOK ALREADY HOLDS.** Long before any of
  this, a change filed from Copilot's wording carried its provenance — `note`
  reads "Copilot — Simplify" — so a proposal that was TAKEN is countable right
  back through the book. **It is printed as a COUNT with its limit under it,
  never as a second table**: the record never held what the model first said
  (as-is against edited is unknowable) and never held a proposal nobody used
  (refused and never-acted-on are unknowable), and a table with one honest
  column and three guessed ones is worse than a sentence.
- **A PLAYBOOK FILING IS DELIBERATELY NOT COUNTED**, which is the recording's
  own rule one step back: `Playbook — <category>` says a standard was filed and
  does NOT say which of the three wordings went in, and two of the three are the
  workspace's own clause library. Counting them would be HaTi taking credit for
  its customer's drafting.
- **IT READS WITHOUT WRITING, and this is the trap it would have fallen into.**
  `negoAllChanges` is the product's own answer to *every change this negotiation
  ever carried* — and it calls `negoInit`, which creates a negotiation record
  and stamps clause ids into the document. A sweep over the whole book would
  have started a negotiation on every contract merely by counting it.
  `c.changes` and the archived rounds are read RAW, deduped on the change id.
- **TWO KINDS OF EMPTY, and they are different facts**: never used at all, and
  nothing since the recording started. The section says which.

**AND THE PANEL IS THE KEY, THE MONEY AND WHAT CAME OF IT (owner-asked 9 Sep
2026).** *"delete anything unnecessary information in the panel because it has
too much information that I have never used and I do not see the value for. The
only thing i use currently is where i enter the anthropic key."*

- **IT FOLDS RATHER THAN DELETES, and the difference is not pedantry.** Nothing
  in that panel is decoration: the daily budget is the one real money wall, the
  renewal-notes switch is the stop on the ONE thing HaTi spends unasked — which
  this rulebook requires to be *stoppable from a screen* — and a stale rate
  table silently under-reports the bill. Deleting any of them takes a wall away
  rather than tidies a screen. **One `<details>` holds model routing, the
  by-person spend, every limit, both switches, the allowance, the rate table and
  the backfill**; each is one press away, which is what stoppable has always
  meant. The precedent is this product's own: the workspace-status foot folds.
- **MEASURED: the drawer was 2093px in an 873px window and is 873.** The key,
  the spend and what became of its proposals are all on screen with nothing to
  scroll, which is the owner's own drawing of this panel — it has three sections
  and the real one had eight.
- **SHUT BY DEFAULT AND IT REMEMBERS NOTHING.** A fold that remembered being
  open would put the wall of boxes back for the one reader who ever opened it.
- **IT IS NOT CALLED "ADVANCED", because the model row already is.** Two doors
  on one screen sharing a word is a name nobody can use; `set_more_settings`.
- **THE PROSE MOVED WITH ITS CONTROLS.** The spend-governance paragraph and the
  by-person note read below the fold now, beside the things they explain — an
  admin who opens it is exactly who wants them.
- **`.st-sec-top` IS A CLASS, NOT `:first-of-type`.** `.st-sec` dresses every
  drawer in Settings and the rule that separates the first section from the key
  block is a decision about ONE of them.

**AND ONE FAULT WAS FOUND BY MEASURING RATHER THAN READING**, which is this
file's own standing lesson: slicing the spend section in two left the first
`<div>` unclosed, so `#ai-acceptance` was a CHILD of it rather than a sibling —
`.st-sec + .st-sec` never applied, and the two sections drew with no rule and no
gap between them. It looks perfectly correct in the source. A computed-style
read of `border-top` is what named it.

Tests: f276 (67 — sections 10 and 11 new, and the empty-state claim REVERSED IN
PLACE onto the two kinds of empty), **f203's placement claim REVERSED IN PLACE**
(it pinned the by-person table as being in the same SECTION as the by-feature
one, which the fold separates; what that decision was always about is which
SCREEN carries per-person cost, and the "never on the People tab" half beside it
is untouched), settings-tabs-verify (80 — four new claims measuring the drawer
as PAINT: it fits with nothing to scroll, the fold is shut, the three readings
are above it, and all eight folded controls are reachable in one press; the
renewal-switch claim re-pointed to open the fold first, which is what a person
does).

Tests: f276 (50 — the funnel's own settle first as the CONTROL, the five
outcomes, the hash, the cap, no route and no drawing, both readings, the three
recording surfaces and both languages), clause-editor-verify section 28 (6,
browser — the only place the `window.` guards can be shown to FIRE: a card
recorded on arrival, Apply stamping the draft, a real press of File settling it
as-is, and a rewritten one reading edited), settings-tabs-verify (the section as
visible pixels with the key box beside it as the control, the shares proved to
add to 100 on the awkward thirds, and the empty state saying which empty it is).
