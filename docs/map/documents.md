# HaTi — documents

*reading and writing documents: .docx, PDF, OCR, uploads, the clause model*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## THE UPLOAD NAMES OUR ENTITY, AND THE PAGE SURVIVES IT (owner-reported 20 Aug 2026, MK-358)

**BOTH RECEIVED-DOCUMENT BANDS ARE GONE (owner-asked 26 Aug 2026, ringing the
first: delete it and put nothing in its place; then "nothing should stay except
for the contract", then "simply remove the gold band as well").** The Document
tab drew the same fact twice — a TEAL strip above the paper ("Received document
— read it below, run the Copilot review, then sign to record acceptance") and a
GOLD band inside it naming us and the seal. Both draw nothing now.

- **`OURS` WENT WITH ITS ONE READER**, and that puts the crash this section is
  about beyond returning: a sentence that is not drawn cannot read a constant
  out of scope. The note explaining the reading is KEPT in the source, because
  if a sentence naming our side is ever drawn there again it must use
  `contractParty` — the DOCUMENT names the party, the workspace is what the
  PLATFORM says.
- **THE EXECUTED-AND-LOCKED BAND STAYS.** It was not in the ask, and it states
  a fact about the paper being sealed rather than an instruction on how to read
  it. Asserted in f225 so nobody reads this removal as covering it.
- **ONE SENTENCE HAS NO OTHER HOME IN THE PRODUCT and is reported rather than
  absorbed**: the gold band's MIGRATED half — "executed outside … filed for
  reference, renewal and reporting — there is nothing to sign here."
  `ct_executed_outside` is read nowhere else, so that is not said anywhere now.
  It is a fact about how a migrated record WORKS rather than about this
  document's wording; if it is wanted back it wants a home of its own — the
  Signing tab or Key terms — and not a band over the contract.
- **THE PARTY IS STILL SET AND READ ON KEY TERMS**, which for an upload is the
  only door to its own facts (there are no recitals to name it in).
  `ct_received_read_below`, `ct_on_their_paper` and `ct_executed_outside` are
  STALE as visible text; the keys are left inert. Tests: f225 (reversed in
  place — the claim is STRONGER now), upload-party-verify (19).

An imported third-party .docx took the whole contract workspace down with "OURS is not defined". The banner on a RECEIVED-AND-NOT-YET-EXECUTED upload names OUR party ("…sign to record X's acceptance…"), and uploadDocBody reached for docBody's OURS — a DIFFERENT FUNCTION's local. Latent since the party-vs-workspace change: template contracts never draw the sentence, migrated-executed uploads take the other branch, so 150 contracts hid it and the first live third-party upload found it. uploadDocBody now carries its own `const OURS = contractParty(c)` fallback FIRST_PARTY — the same reading as the recitals. The fix reaches every surface by construction (one builder: docBody → uploadDocBody — room, share copy, exports; the phone wraps it in try and showed mc_could_not_draw, the same fault in politer clothes).

THE OWNER'S CHOSEN FIX RIDES WITH IT: the upload popup asks WHO WE ARE. `up-party` on uploadConfirmHtml, prefilled with FIRST_PARTY (the CONTRACT_ESSENTIALS reasoning — the assumption made out loud, overtypeable), datalist `up-party-list` built by **uploadPartyOptions()** — the FX picker's rule, OFFERS NEVER REFUSES: the workspace name first, then every entity already on a contract (case-insensitive dedupe; the list grows by use, nothing for an admin to maintain — the AUTOMATIC option, owner-chosen over a managed Settings list). Any typed name is accepted; blank files as absent and the reading falls back to the workspace, so nothing filed before the field existed reads differently. submitUpload stores it as `c.party`. `party` survives the light list by construction (HEAVY spreads the record), so the datalist works in server mode. The phone's "upload received" row calls the same openUploadModal — one dialog, both shells. The migration importer was deliberately left alone: migrated paper is executed-outside, the other (working) branch, and Key terms stays its door.

**THE COUNTS ARE NUMBERS, NOT TAGS (owner-asked 23 Aug 2026: "the numbers should be white and nothing boxing them").** Every count wore a translucent box and a tinted ink — MEASURED, `rgba(255,255,255,.14)` behind `rgb(159,216,209)` — so nine tinted capsules ran down the drawer and the figures were the palest text on it. Box gone, ink white. **AMBER STAYS, AND IT IS THE ONE EXCEPTION** (asked and owner-ruled before it was built): amber is how this drawer says a door is waiting on you, `NAV_COUNT_TONE` gives it only to a count above zero so it never cries wolf over an empty queue, and white would take the signal off the sidebar entirely. TEAL DOES NOT STAY — it marked the SIZE of the book rather than anything owed, and with the box gone a third ink is decoration. **`#nav-intel-new` KEEPS ITS PILL**: it shares the class because it shares the slot, but "New" is a tag announcing a page worth visiting, not a number, and stripped to bare white text it reads as a word that has wandered into the count column. **AND THE `.active` RULE HAD TO GO, WHICH IS THE FIX RATHER THAN AN OMISSION**: `#side-nav .nav-item.active .nav-count` scored (1,3,0) against the amber rule's (1,2,0) and WON — measured, opening Negotiations turned its own amber count white, so the one door whose warning you were looking at was the one door that stopped warning. A tone is about the work, never about where the reader happens to be. The new browser file stands on the Negotiations page on purpose for that check; run it from anywhere else and it passes against the broken build.

**THE DOORS ARE WHITE AND THE LIVE ONE SITS DEEPER (owner-asked 23 Aug 2026: "the names of the tabs plus the menu needs to be pure white and when you select a tab, the highlighted tab should not be a lighter green but an even dark green").** Every door read `--nav-ink` — a pale teal, #9fd8d1 in the green workspace and #a5bde0 in the navy one — so the whole column was set in a tint of its own background and only the door you were standing on was white. They all take `--nav-ink-strong` now (the token that already means "the strong nav ink" and is #ffffff in both workspaces) rather than a hard-coded white, so the dark theme keeps its own near-white with no second rule. **THE LIVE STATE WAS A WHITE VEIL** — `rgba(255,255,255,.15)`, which LIGHTENS the panel, the opposite of the ask; **the mock-up agrees with the owner**, its own nav setting `--nav-act:#0D332F` under a `--nav:#123F3A`. It darkens through `color-mix(in srgb, black 30%, var(--nav-bg))` — **a mix rather than a token per theme**, so the green workspace, the navy one and the dark theme all follow from one line and none can drift. HOVER DARKENS TOO, more gently (12%): it used to lighten while the active state lightened harder, and with the live door going deeper a hover going the other way makes the column read as two unrelated signals. **THE TWO HALVES HAD TO SHIP TOGETHER** — with every door white, the background is the only thing left marking the live one. MEASURED: every label rgb(255,255,255) at 12.05:1 on the panel, the live door 20.98:1 on a ground darker than the panel. **THE SECTION CAPTION IS DELIBERATELY NOT SWEPT** ("ADMINISTRATION", `rgba(255,255,255,.62)`): it is a caption over the doors, not one of them, and at full white it would compete with what it labels.

AND THE SIDEBAR COUNTS SIT ON ONE LINE (owner-asked same day, off a screenshot). The floating drawer's open state gave every nav button `width:auto` — each shrank to its own text, so the count badges landed ragged mid-drawer. It is `width:100%` now, so the label's flex:1 pushes every badge to one straight column at the drawer's right edge — the same line the open column above 1500 always drew. Never width:auto there again.

Tests: upload-party-verify (14, browser — the crash on the reported state, proved to fail 4 ways on the old code; the popup with a REAL .docx through the real file input; a typed entity landing on the record and the page drawing it; badge right-edges measured at 1440 drawer and 1920 column), n2 section 4 (the field, the prefill, the list's order and dedupe, text-box-never-select), nav-floats-verify unchanged at 69.

## AN UPLOADED CONTRACT IS A CONTRACT, NOT A FILE ATTACHMENT (owner-reported 20 Aug 2026)

"When the uploaded contract is loaded into documents page, it looks different from standard contracts because it is pulled inside a card in the contract page." It was true: this tab already renders inside the standard sheet, and `uploadDocBody` then drew the read-out text into a bordered, separately-scrolling box on top of it — a contract inside a contract — under ~130px of file handling (two bordered cards and a row of three chip-buttons) before the first word of the agreement.

- **AND THE EDITED-WORDING BRANCH GOT THE SAME FIX ONE BRANCH LATE (owner-asked 23 Aug 2026: "I do not understand the need for the highlighted alert. Get rid of it").** Once `c.redlineText` exists on an upload, the branch below stops drawing the file's own text and a WORKING TEXT card drew the edited wording instead — an uppercase caption with an icon, an accent border, a padded box, and a sentence under it. Same fault, same fix: the lid goes, the wording is the page. **DELETING THE BLOCK OUTRIGHT WOULD HAVE BEEN WRONG** and is the trap worth recording — it is the ONLY place the current wording appears on that tab. **ONE SENTENCE REALLY IS LOST, said out loud**: "This edited text is what versions, Compare and the seal operate on" was the only statement of that fact in the product. It is about how the seal works rather than about this document, nothing acts on it, and it was being told to every reader of every edited upload for ever; if it is wanted back it wants a home of its own — the evidence pack or the seal's own panel — not a caption over the contract. `ct_working_text` is STALE (the notices stack's own `docWorkingTextNoteHtml`, which says "edited working text" and offers Edit and Compare, is a DIFFERENT thing and is untouched). Tests: panel-alerts-and-head-verify.
- **THE WORDING IS THE PAGE.** The .docx-with-text branch renders `documentTextHtml` straight onto the sheet: same paragraph and heading treatment, scrolling with the page like every other agreement in the product. WHAT IT COSTS, said out loud: the box had its own scrollbar, so the file strip stayed pinned while you read — but a contract is read from the top, the strip is a fact about the FILE rather than about the wording, and nothing else in HaTi pins anything over the paper. **PDFs KEEP THEIR FILE PREVIEW** (an iframe): there is no text to lay out, so a frame is the honest rendering there.
- **THE READER'S TEXT SIZE REACHES IT** (owner-reported 20 Aug 2026: "the font adjuster does not have the ability to adjust the font of the contract"). Reproduced before it was touched — the stepper's own reading moved 0.600 → 1.333 and the wording stayed at 13px on every setting. The A⁻/A⁺ stepper writes `--doc-scale` and the sheet's body reads it through `calc(13.5px * var(--doc-scale,1))`, so a TEMPLATE contract scales by inheritance; text read out of a FILE is laid out by documentTextHtml, whose every block carried a bare pixel size and therefore overrode that inheritance. All three sizes it emits (body, heading, ruled block) now go through one `scaled()` helper carrying the same calc — ONE preference, both kinds of document. NOTHING ELSE MOVES: the token is defined only on the document surfaces and the negotiation page's roots, so the template library's preview, the migration preview and every export resolve it to 1 — measured in a browser at the 8, 15 and 20px settings, all three came back at exactly the size asked for. f225.
- **THE FILE IS ONE STRIP.** Name · size · who filed it · when · how well it was read · Download original · Re-read document, on one hairline-ruled line above the paper. NOTHING WAS DROPPED and `data-reread` carries the same handler. The provenance caption (ct_reading_view) stays as a caption rather than a lid — "Text read out of the Word file", no border.
- **AND A LATENT CRASH FELL OUT OF IT.** The received-document banner names OUR side and read a bare `OURS` — a constant declared inside docBody, AFTER the early return that sends every upload to uploadDocBody, so it was never in that function's scope at all. Every received contract NOT executed off-platform threw a ReferenceError on its Document tab; only the migrated branch beside it, which names nobody, ever drew. It reads `contractParty(c)` now — the DOCUMENT names the party, the workspace is what the PLATFORM says (see PARTY vs WORKSPACE).

## AN UPLOADED CONTRACT KEEPS ITS STRUCTURE (owner-asked 29 Aug 2026, J-3.1/3.2)

*"When you upload received contract, it should be uploaded in the same exact
structure as the original. Currently the contract loses structure and it
becomes hard to follow."*

**THE READER WAS A TEXT SCRAPER.** It opened one file inside the zip
(`word/document.xml`) and kept the words; the paragraph styles, the numbering
definition, the list levels, the tables and the emphasis were all discarded at
that moment, and the screen then GUESSED the structure back out of the wording
— a short line in capitals is a heading, a line opening "3.2 " is a clause.
Reasonable guesses about paper that follows those conventions, wrong about
paper that does not.

**AND THE WORST OF IT WAS THE NUMBERING: where Word numbers automatically the
numbers ARE NOT IN THE TEXT AT ALL.** Word generates them from a definition in
another file, so an automatically numbered agreement — which is how most
professionally drafted contracts are written — arrived with no clause numbers
whatsoever, and nothing downstream could put them back because they were never
there to read.

**IT COST MORE THAN READABILITY, and that is why it was worth the work.** HaTi
decides what a CLAUSE is from the document's own headings, so an upload that
lost its headings fell back to one clause per paragraph — and with that, a
clause heading could not be renamed, the front-matter region was not offered,
the playbook's clause-kind matcher typed every clause as unknown, and "subject
to clause 9" could not be followed. **All four now work on received paper**,
and the browser file drives each of them.

- **`docxExtractRich` IS THE READER** and `docxExtract` is untouched beside it.
  `extractWordText` is the ONE door both the upload and the Re-read control go
  through, so there is no second reading to keep in step.
- **THE SIZE GUARD REACHES EVERY PART IT OPENS.** `DOCX_PARTS` names the three
  and the ceiling each is trusted to; the old reader guarded `document.xml`
  alone, and **a numbering definition is attacker-controlled input exactly as
  the document is**. A damaged part reads as ABSENT and never takes an import
  down — the document itself is guarded separately.
- **RESOLVING A NUMBER IS A WALK, NOT A LOOKUP.** The number a reader sees comes
  from the list's definition, the paragraph's level and how many paragraphs at
  that level have gone before — including the restarts, which is why it cannot
  be answered for one paragraph on its own. **Counters are kept per ABSTRACT
  list**, because two `numId`s pointing at one abstract definition continue the
  same sequence: that is how Word writes a list that is interrupted and
  resumed, and counting per `numId` would restart it and make every number
  after it wrong.
- **NO NUMBER IS EVER INVENTED (D-4).** Where the definition cannot be read the
  paragraph draws with no number and the count is REPORTED, so the file strip
  can say so. **A guessed clause number is a wrong citation**, which is worse
  than a missing one and would be repeated in every redline made against it.
- **THE DOCUMENT'S OWN TITLE TAKES h1 AND THE LEVELS SHIFT UNDER IT.** HaTi's
  clause model reads a LEADING h1 as the title and the headings below it as the
  clauses — which is exactly how a Word contract is drafted, a Title paragraph
  over Heading 1 clauses. Mapped one-for-one the title is not a heading at all
  and the front-matter region is not offered; mapped without the shift the title
  becomes clause 1. So where the file HAS a Title paragraph the levels shift by
  one, decided ONCE from the file before a block is emitted; **where it has none
  nothing shifts**, which is byte-identical to reading it without the rule.
- **A STYLE IS A HEADING BY ITS OUTLINE LEVEL OR BY ITS NAME**, because a
  contract drafted from a firm's own template regularly uses a style called
  something else entirely with `outlineLvl` set.
- **THE ALLOW-LIST IS NOT WIDENED BY ONE TAG.** Everything emitted is already
  permitted by `js/richdoc.js` and the body goes through `sanitizeRich` on the
  way to the record like any other. **NO `colspan`**: a merged cell is emitted
  as the cells it spans, the first carrying the wording and the rest empty — a
  visible, honest approximation that keeps the row's column count, rather than
  something smuggled past the allow-list.
- **THE MONOSPACE FALLBACK STANDS DOWN BY CONSTRUCTION**: a real table is drawn
  from the stored body, so `documentTextHtml`'s ruled-block guess never runs on
  a document that has one.
- **A TABLE ROW IS A ROW.** The plain text joins a row's cells with tabs where
  the scraper emitted one line per CELL — which is why a rate card came out as
  a stream of words. It is the one place the LINES differ, and it differs the
  right way.

**THE TWO ACCEPTANCE CONDITIONS CANNOT BOTH BE MET LITERALLY, and that is said
out loud rather than quietly picked between.** The work order asks for the
plain text to carry *"the same words in the same order as today's"* AND for the
document to *"show the same numbers Word shows"* — and those numbers were never
in today's text. A byte-identical string would mean the numbering was not
resolved. **So the property is asserted where it is exact**: every line's
wording is that line's wording, and the only thing that may appear in front of
it is a resolved marker and a tab. Nothing is added inside a sentence, nothing
is dropped, and nothing moves — f257 (5) checks it piece by piece against the
scraper's own output on the same file.

**THE GUESSWORK STAYS, AS THE FALLBACK IT SHOULD ALWAYS HAVE BEEN.** A Word
file with no styles and no numbering reads BYTE-IDENTICALLY to the scraper and
stores no body at all (`docxHasStructure`), so the screen goes on guessing for
it — and for PDFs and scans, which genuinely have no structure to read.

**J-3.3 IS THE HALF THE ORDER ITSELF NAMED, AND NO MORE.** Its own words were
that it *"may end as 'accept the guesswork and say so on screen' rather than as
a build"* — so what is built is the saying so, and inferring headings from a
PDF's font sizes is NOT. A file whose structure was guessed carries one phrase
on the same strip, *"Structure read from the wording"*, with the reason on its
hover. **IT IS A FACT AND NOT A WARNING** — guessing is the RIGHT answer for a
format that carries no structure, and it takes no amber; what was missing is
that nothing in the product distinguished a heading Word declared from one HaTi
inferred. It is a word on the row that already carries the file's name, who
filed it and how well it was read — the second rung of the cheapest-channel
ladder, not the fourth.

**NOTHING ALREADY UPLOADED IS RE-READ (D-5).** A sealed record must not change
under anybody. The existing "Re-read document" control is the one door, and it
now **refuses a SEALED record and refuses to overwrite an EDITED one** — once
somebody has redlined this document the wording is theirs, and a re-read of the
file must not throw that away.

**THE FIRST WRITING OF THIS SAID THE CONTROL "ALREADY REFUSES A SEALED RECORD"
AND THAT WAS NOT TRUE**, which is worth recording rather than quietly
correcting: its only guard was `canEdit()`, and it wrote `c.redlineText`
straight from a fresh read on a signed contract. The refusal is real now
(`status`, the seal hash, an execution stamp, or `negoExecuted`), and it
**carries the clause ids across** with `clauseCarryIds` — without that a
re-read returned a body with no ids at all, so every signature place anchored
on one was orphaned while the blocker went on counting it, and the same clause
could then be spotted a second time.

**CLAUSE IDENTITY CHANGES FOR NEW UPLOADS, AND THAT IS THE POINT.** With real
headings the segmentation finds real clauses rather than one per paragraph.
Nothing already on file moves, because nothing is re-read — but the same file
uploaded after this ships is segmented differently from before it.

**WHAT IS DELIBERATELY NOT CARRIED (D-1, D-2)**: fonts, page size, margins,
headers, footers and images. Those belong to a printed page. **Comments and
tracked changes inside an incoming file** keep their own feature and are
untouched — the counts still ride back and the audit line still says the
document was read with every change accepted.

Tests: f257 (50 — every file built as Word writes one, a real zip with a real
`numbering.xml`, and read through the real reader; nothing here is a fixture
written to match the code — plus **section 11, what a record filed BEFORE this
job reads as**), upload-structure-verify (18, browser — a real .docx through
the real file input, the headings measured as PAINTED elements larger or
heavier than the body, the four downstream capabilities driven, the strip's
line proved to be a line and not a band, **and the strip proved to be ONE LINE
at every laptop width**).

## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)

clauseSegment() is the ONE splitter for every per-clause screen — a document reading wrong reads wrong everywhere, and the fix belongs in clausemodel.js. Two readings, decided by HEADINGS: headings mark the clauses (heading + everything under it) — or they don't (no headings, or only a leading h1 = the title): one clause per top-level block, title is front matter. clauseSegment, clauseFrontMatter and clauseStampIds share _clTitleIndex / _clHeadingsMarkClauses — change all together or the title becomes both chrome and a clause.

ID DURABILITY: negoStampContract writes ids back ONLY into rich stored bodies (c.redlineText); template-built and plain-text contracts regenerate wording on demand. clauseCarryIds(prevHtml, nextHtml) — sole caller negoFreshenBaseline — makes a re-read of an unchanged document return the SAME document byte for byte (clauses recognised by heading text where headings mark, by POSITION where they don't; a shape-changed document keeps its fresh stamp). Without it, ids churned on every repaint and the counterparty could never start a redline (their proposals landed on dead ids; the poller retried forever, silently).

applyNegoProposals never drops what it cannot place: recover by the wording they edited, then the clause label, filed on OUR id never theirs; genuinely unplaceable wording goes to the audit trail verbatim and the response reports HANDLED so the poller stops — wording only; a refused DECISION stays unhandled (f37). A VERB THAT CANNOT WORK IS NOT DRAWN: the signing screen's "Change the wording yourself" draws only where the editor exists (W6 blocks it on signing links, f113; f49 pins the absence and the replacement sentence; the handler refuses in words if drawn anyway). Tests: f163.

## THE SCANNING PATH IS DRIVEN FOR THE FIRST TIME (22 Aug 2026 — the work order's Part 2, finished)

A scanned contract is the commonest way paper reaches this product, and
**nothing had ever put one through it.** The transcription route had never been
called by a test, `ocrDocument` had never been run, and the whole path was
written from DESIGN-ocr.md and shipped unexercised. Six defects, every one
reproduced before it was touched, and the last is the one that matters.

- **THE HONEST LABEL HAD NOTHING BEHIND IT.** Every piece of the honesty chain
  was present and correct and the chain did not connect: OCR reads a date, the
  extractor is confident about the text it was given and marks it `high`,
  `capConfidenceForOcr` honestly knocks every high down to **`medium`** — the
  rule DESIGN-ocr.md calls load-bearing — and the batch import's review gate
  (`migNeedsReview`) only ever tripped on **`low`**. So the flagship journey, a
  drawer of scans imported in one batch, filed every one of them as
  **complete**, with dates nobody had read, and the renewal reminders fired on
  them. MEASURED before it was touched: on a page whose **word recall was
  100%**, a 100 DPI scan read "28 February 2028" as "26 February 2028"; a phone
  photo of the same page read it as "**28 February 2025**". Three years out, on
  the one field the reminders fire on, in a reading that looks perfect.
  DESIGN-ocr.md predicted exactly this in words — "3 for 8, 2026 for 2028" —
  and then the gate let it past. A machine-read record now needs a human ONCE
  (`applyReviewedMeta` clears the flag on confirmation, so it is not a
  permanent amber), and a DIGITAL contract is not held — a rule that flags
  everything is a rule nobody reads. **ASKED OF THE CONTRACT'S OWN
  `textSource`, never of `meta._ocrCapped`**: the underscore is transport and
  does not survive a save, so a later recompute would forget.
- **A PAGE CUT SHORT WAS JOINED INTO THE WORDING SILENTLY.** f231's finding on
  a route nobody had applied it to, and worse here than it was there: an
  obligations list that comes back empty is visibly wrong, half a transcription
  reads exactly like a whole one — and it becomes the contract's WORDING, so
  the bottom of the page simply is not in the record. Empty **and** cut short
  is now refused (a blank separator sheet mid-scan is a legitimate answer and
  must not be what a failure looks like); a partial page is KEPT, flagged
  `truncated`, counted as `partialPages`, and **said out loud in
  `ocrProvenanceLine`** — the one sentence the viewer banner, the audit detail
  and the clause-review warning all print.
- **THE PROGRESS COUNTER RAN THE DOCUMENT TWICE**, because every page was
  rasterized into an array before any was read and both loops reported. One
  loop now — render, read, next — which also stops thirty JPEG data URLs being
  alive at once, keeps a render failure on page 27 from throwing away
  twenty-six pages already rendered, and makes DESIGN-ocr.md's own
  cancellation claim true for the first time (stopping mid-rasterize used to
  discard everything, because nothing had been recognised yet).
- **THE ONE PATH THAT SHRINKS AN IMAGE COULD MAKE IT BIGGER.** `ocrPrepImage`'s
  `k = OCR_MAX_EDGE/longEdge` is GREATER than one whenever the image is under
  the edge cap and over the byte cap — a phone photo cropped tight, or a
  high-quality scan of a small page. Measured in a browser: a 900px page was
  scaled UP to 2400px on its way to being shrunk. `Math.min(1, …)`, and the
  re-encode at JPEG 0.72 is what actually brings the bytes down. NOTE THE CAP
  IS MEASURED ON THE BASE64 STRING, not the picture — the real threshold is
  ~2.6 MB of image, not the 3.5 MB the constant reads as; left alone because it
  errs toward shrinking sooner.
- **"PAGES 21–50 WERE NOT READ (PAGE LIMIT)" ON A DOCUMENT WHOSE UNREAD PAGES
  WERE 31–60.** The range counted from what came back rather than from the
  total, so a 60-page scan capped at 30 of which the recogniser managed 20 was
  wrong at both ends — and wrong in the direction that understates. Pages 21–30
  were attempted and failed, a different fact with a different remedy; 51–60
  went unmentioned. Counted off `ocrTotalPages` it states only what the page
  limit is responsible for, and the migration record carries that field now
  (it did not, and it is one of the two records that sentence reads).
- **`ocrRelease` HAD NOT ONE CALLER.** The rlPaperFootHtml family in its other
  direction — not a function nobody could reach, a function nobody reached for
  — so the offline recogniser's tens of megabytes were held for the life of the
  page. Called now at the end of the upload and the library import (one file is
  the whole run) and at the end of a migration BATCH but never between its
  files, because a new worker reloads the language data and paying that forty
  times is worse than holding it once. **f232's sweep cannot catch this class**:
  it checks `window.foo` READS against published names, and this is a published
  name with no reader at all.

WHAT IS DELIBERATELY NOT MEASURED, said plainly: **the Copilot vision tier**,
which needs a paid key — every accuracy figure is the OFFLINE recogniser, which
is the floor (what a workspace with no key gets, and what every workspace with
one falls back to when a page fails); and **real paper**, because the pages are
drawn on a canvas and degraded synthetically, and only one of an answer key and
real paper can be had at a time. Closing the second needs scans from the
business — `WORKORDER-testing-next.md`.

AND THE HARNESS CAUGHT ITSELF TWICE, which is the part worth keeping. Its first
degradations scored **100% on everything** because they added speckle and THEN
thresholded, and a hard threshold removes exactly the noise just added — "faxed"
paper came back cleaner than the original. The damage has to happen after the
step that would repair it, which is also the order the real world does it in.
And the counterparty read as MISSING on all four variants while recall was 100%,
because "Nordkust Industri" straddles a line break IN THE SOURCE: the recogniser
was right and the check was wrong, the fifth scorer bug of that family in this
project. **A figure that disagrees with a healthy recall score is a harness bug
until proven otherwise.**

Tests: f234 (17 — the route, called for the first time: what it accepts, the
four kinds of junk it must refuse before any spend, the forced tool, the four
things the prompt forbids, and the cut-short pair), f235 (25 — detection, the
one loop, the cap, the fallback, the weakest-tier rule, and the review gate both
ways; 8 of them fail against the code of the morning before),
scan-verify (12, browser — the upscale fix measured on real decoded pixels, a
real image-only PDF reading as a scan, the amber banner as pixels),
test/scan/measure.js (the measurement itself — a real Chromium, a real
Tesseract, four kinds of damaged paper, and eight facts checked one at a time
because a transcription that is 95% right with the wrong expiry date has failed
at the one job the reminders depend on).

## THE PDF READER MEETS FILES HaTi DID NOT MAKE (21 Aug 2026 — the work order's Part 2, started)

HaTi's PDF reader is hand-written and **had never been run against a PDF this project did not produce** — its fixtures are generated in `fixtures/generators`, which is the same marking-our-own-homework the CUAD scorecard exists to stop. Measured against Mozilla's pdf.js over 34 real-world PDFs from twelve producers: **54% of the words pdf.js read**, and **every LibreOffice file in the set returned an empty document**.

- **THREE FAULTS IN ONE CHAIN, and all three end in SILENCE rather than an error** — which is why nothing had ever reported them. (1) **An indirect `/Length`**: LibreOffice, pdfkit and ImageMagick write `/Length 3 0 R` because a compressing writer does not know the length until the stream is written; ordinary, legal PDF, and `pdfIndexObjects` refused it (the negative lookahead was deliberate) and fell back to searching for `endstream`. (2) **The fallback kept the separator**: the bytes between the stream data and `endstream` are an end-of-line, not content, and **DecompressionStream refuses a buffer with anything after the compressed data** — Node's zlib tolerates it silently, which is exactly why no server-side check ever saw it. (3) **A single-byte code is not always the character**: a subset TrueType font numbers its glyphs from 1 and states what they mean in a `/ToUnicode` map, and HaTi read that map, attached it to the font, and then never asked it — both single-byte branches assumed the code WAS the character, so the text came out as control characters and every reader downstream stripped them.
- **NEITHER 1 NOR 2 IS FATAL ALONE — TOGETHER THEY ARE**, and that is what LibreOffice writes. Measured, not assumed: f233's first draft claimed each was fatal on its own and both passed against the reader they were written to catch. They are kept as CONTROLS, which is what makes the combination's failure attributable to the pair rather than to a broken fixture.
- **AFTER ALL THREE: 80%, every LibreOffice file at 100%**, and 16 of 23 comparable files at 95% or better.
- **`pdfIndexObjects` RESOLVES THE REFERENCE IN A SECOND PASS** — it cannot be done on the first, because the object holding the length may not be indexed yet. The `endstream` fallback also stops BEFORE the end-of-line now, and `inflateBytes` trims up to FOUR trailing bytes and retries: a tolerance for a separator, never a search for a stream that is not there (f233-8 pins the bound — an unbounded trim eventually "succeeds" on arbitrary bytes and hands back whatever falls out).
- **`mapChar` IS SEPARATE FROM `cidChar` ON PURPOSE.** Two-byte fonts have only the map, so an unmapped code there is a bullet; a single-byte font has the standard encodings to fall back to, so mapChar returns NULL for "the font offers no opinion" and the old reading stands. A partial `/ToUnicode` must not erase the codes it omits.
- **THE MEASUREMENT IS `test/pdf/`** and is NOT in `npm test`: it needs a corpus and a second reader, neither committed (`fetch-corpus.sh` gets both). **THE TWO READERS MUST RUN IN SEPARATE PROCESSES** — jsdom installs browser-shaped globals, pdf.js then detects a browser, tries a browser worker and returns NOTHING, so run together the reference reading is empty and HaTi appears to score zero on everything. pdf.js is a MEASURING INSTRUMENT, never a dependency: the product never imports it.
- **WHAT IS STILL WEAK, measured and not chased**: reportlab-overlay 0% (undiagnosed), Arabic 40% (right-to-left), a 150,000-character LaTeX book 42% (ligatures and hyphenation at scale), annotations 50% (pdf.js reads annotation text, HaTi reads the page — arguably a difference rather than a fault). The three fixed were the ones costing WHOLE DOCUMENTS.
- **AND IT IS STILL NOT CONTRACTS.** Nothing in that corpus is a commercial agreement and nothing is a photographed or faxed scan — the two things this product actually meets. That gap needs documents from the business and stays open in WORKORDER-testing-next.md.

Tests: f233 (9 — each fault as the smallest hand-built PDF that reproduces it, the two controls, junk still yielding nothing rather than noise, the trim bound, and the map's fallback branch; 5 of the 9 fail against the reader of that morning).

## A GAP IS A GAP — TWO WRITERS, ONE COMPARISON (owner-reported 23 Aug 2026)

Two screenshots of the SAME Compare window: "The original" against "Proposed"
read perfectly; "The original" against a saved version spaced every paragraph
out and put a thin coloured sliver on each gap.

**THE DIFF WAS FINE. THE TWO SIDES WERE WRITTEN DOWN BY DIFFERENT SERIALISERS.**
The comparables on that list come from three writers and they do not agree
about whether a blank line sits between blocks: **`richToText` joins with ONE
newline** — which is what `negotiation.baselineText` ("the original") and the
Proposed reading are both built from, and exactly why that pairing looked
right; **`htmlToStructuredText` keeps a BLANK LINE** — what `docPlainText`
falls to for a template contract, and therefore what `captureVersion` stores in
every captured version; and the filed paper arrives spaced however the file
was, carriage returns and all. `wordDiff` tokenises on `(\s+)` and KEEPS each
whitespace run as a token of its own, so `\n` and `\n\n` are different tokens
and every separator between two writers reads as a change.

**THE TELL WAS THE LEGEND DISAGREEING WITH THE PICTURE** — "+1 added · −0
removed" over a document covered in marks. `diffStats` counts only tokens that
survive a trim, so it was right and the document was wrong. MEASURED on the two
conventions before anything was touched: **eight marks emitted, all eight
whitespace-only, stats 0/0.** Two readings of one comparison disagreeing is
what said the fault was in the spacing rather than in the words; chase that
first.

**THE FIX IS AT THE WINDOWS, NEVER IN THE DIFF, and that is the load-bearing
half.** `wordDiff` is ALSO what `_diffSegments` reconstructs change blocks from
and that reconstruction is required to be exact — a block that rebuilds wording
nobody proposed is the fault that whole mechanism exists to prevent; and
`redlineBlocks`, one layer along, is what `redlineOpsStructured` files into the
record, inside the fingerprint. **Neither may be taught to overlook a
character.** `diffCompareText` (js/versioning.js, beside the diff) is a reading
of two texts on their way to a SCREEN: per line, collapse the runs and trim —
which is the treatment BOTH serialisers already apply — then drop the blank
lines they disagree about. Nothing stored moves, no fingerprint moves, and
f239 asserts both engines still reproduce their texts byte for byte.

**IT COSTS LESS THAN IT LOOKS.** The obvious worry — "a paragraph genuinely
split in two would stop showing" — does not hold: a split turns a SPACE into a
LINE BREAK, the line count moves, and the diff still has something to say.
Joining two still shows for the same reason. What stops showing is only the
difference between one break and two, which neither writer regards as content
and which **the product already discounts itself**, in `normText` and in
`docCanonical`, when it decides whether two versions are the same version.

**BOTH WINDOWS HAD IT — the duplication warning in its usual direction.** The
owner's Compare and the counterparty's are two renderings of one question. The
owner's shows it differently (its structured renderer draws inserted BLANK ROWS
rather than slivers) and its cumulative view pairs the same two writers, so all
three call sites read the pair. The phone's Compare is a desk-only row that
toasts, so there is no fourth. `openDiffModal` has **no callers at all** —
exported and dead; left alone rather than deleted in passing.

**THE FALLBACK IS THE TRAP TO WATCH.** portal.js reads the helper through
`window` with the raw text as its fallback, so a missing import would put the
bug straight back **silently** — the rlPaperFootHtml class, six times paid for.
f232 proves the name is published; f239 additionally pins that `js/app.js`
imports versioning.js, which is what puts it on window for the share page.

**AND NOTHING HAD EVER DRIVEN EITHER WINDOW.** No test in the suite named
`openCompareModal`, `openPortalVersionCompare`, or any control inside them
before f239 — which is why a fault this visible survived. Tests: f239 (19 — the
fault reproduced with its own counter as the tell, the reading, the four kinds
of real change proved to still show, both engines proved byte-exact, both
windows' call sites, the import, and the edges; **12 of the 19 fail against the
code of an hour before**).
