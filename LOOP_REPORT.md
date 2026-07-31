# Loop report — Template Library & Document Converter build

Running log per loop: what was attempted, what happened, what was decided
next. Newest at the bottom. Companion documents: RECON.md (the map),
SUMMARY.md (what was built), BUGLOG.md (what broke), CHECKLIST.md (what is
proven by which test).

---

## Loop 0 — recon (step zero)

**Attempted:** the codebase map the brief requires before feature code.
Three parallel sweeps (data model + server; rendering/DOCX/signing/portal;
i18n + tests + conventions), plus a full-suite baseline run.

**Happened:** RECON.md written and committed. Three premise corrections
surfaced: (1) there is **no EN/SV i18n layer** — all UI strings are inline
English, so guardrail 6 cannot be satisfied as written; (2) there is **no
"Template Studio" brief or artifacts** to delete — the closest thing,
DESIGN-template-fields.md, documents a different, shipped feature that must
keep working; (3) the **Brut Africa form was not supplied** — only the brief
was uploaded. First baseline run failed on a missing `node_modules`
(`npm install` had never run in this container); after installing,
**1672/1672 tests green**.

**Decided next:** build Phase A on the session's designated branch
(`claude/new-session-d8fnvd` — the environment cannot push elsewhere; the
brief's `feature/template-library` name is recorded as a deviation).
Strings follow house convention (inline English). The Brut fixture will be
a synthetic reconstruction, labelled as such.

## Loop 1 — Phase A: library foundation

**Attempted:** the brief's §4 data model as additive SQLite tables, the
library/permission/lifecycle routes, the library + detail screens, and f96.

**Happened:** all landed. Two shared-code touches only: `upsertContract`
gained two set-once provenance columns (COALESCE keeps them write-once at
the SQL layer), and the contract save route gained the matching JSON guard.
The field catalogue went into ONE dual-environment registry
(js/fieldlib.js) required verbatim by the server. f101: 9/9. Full suite
green. One test-side fix: an error-message regex written before the message
("archived, never deleted").

**Decided next:** Phase B, building save-as-template server-side first so
the builder has real converted content to open.

## Loop 2 — Phase B: builder + save-as-template

**Attempted:** the block/field builder UI, org branding panel, publish flow
with change notes, save-as-template conversion, f97 + f98.

**Happened:** all landed. The conversion reads party values from the
contract's own structured record (never guessed), replaces literal
occurrences with placeholders, and leaves wording fixed. One test
expectation was wrong, not the code: a paragraph containing the contract
value correctly became wording-with-blanks, so the "boilerplate stays
fixed" assertion needed a genuinely fixed article to point at. The old
`ws-tpl` button now routes to the library in API mode (settings-blob flow
kept for local mode). f102: 4/4, f103: 4/4, full suite 1680 green.

**Decided next:** Phase C, server-spawn route first (it enforces
draft/archived rules), then the fill/portal/signing integration.

## Loop 3 — Phase C: contract from template

**Attempted:** the spawn route with org-profile default resolution, the
shared form renderer (the document IS the rendering of the form), the
owner fill panel, portal typed inputs with per-field autosave onto the
share row, sign-gating on a valid form, branding letterhead, and f99 —
including the immutability test the brief names explicitly.

**Happened:** all landed. The byte-identical test passes: publish v2 and
the v1 contract's stored record does not change by one byte. The portal
autosave endpoint accepts ONLY field values (fixed wording untouchable by
construction) and re-validates each against the shared registry. One design
decision recorded: the negotiation propose-modal refuses template contracts
— fixed wording is the template manager's, not the deal-maker's. Full
suite 1686 green.

**Decided next:** Phase D. Read the claude-api skill before writing the
detection call; honour the brief's pinned model (claude-sonnet-4-6) via a
one-line override in the existing AI helper rather than a parallel path.

## Loop 4 — Phase D: upload-and-convert

**Attempted:** real-bytes DOCX validation (PK magic + word/document.xml),
server-side ZIP/WordprocessingML structure extraction with table cell
pairing, the forced-tool_use detection call, defensive shape-cleaning with
an error-note fallback, the unskippable confirmation screen, three
committed fixtures + generator, and f100.

**Happened:** all landed. The extraction is deterministic code; only the
fixed-vs-blank judgement goes to the model, and the house forced-tool_use
pattern replaces the brief's "JSON only, no fences" prompting (strictly
stronger; the defensive parse survives as schema shape-checking — recorded
as a deviation). The Brut form is a synthetic reconstruction (the original
was not supplied) — noted in fixtures/README.md. f105: 6/6 against a
purpose-built detection stub; the ≥24-of-27 live-model acceptance number
is marked in CHECKLIST.md as requiring a real key.

**Decided next:** final documents (SUMMARY/BUGLOG/CHECKLIST/SESSION-NOTES),
full-suite verification, commit and push. Out-of-scope list respected: no
PDF/OCR, no clause library, no auto-updating open contracts, no sharing,
no pricing changes.

## Loop 5 — the fix work order (WORKORDER-template-library-fixes.md)

**Attempted:** all four steps of the user's work order from hands-on testing:
marker corruption, inert green blanks, the disconnected library, grey
restyle.

**Happened:** Step 1 — deleting a field now strips its markers from the
wording (review screen and builder alike), publish blocks server-side on any
orphaned marker and names it, the renderer never emits raw {{syntax}} (an
orphan renders as a plain blank), longhand signature wording from the model
is rebuilt as a signature block named for who signs, and contracts stored
with {{code}} repair themselves on next open (portal copies repair
display-side; executed records untouched). Step 2 — blanks are grey with a
dotted rule, carry data-field-key (admitted by the sanitiser as narrowly as
data-clause-id), and take clicks: a typed in-place input with shared-registry
validation on the workspace and the portal, signature blanks routing to the
signing flow, print showing underscore blanks. Step 3 — the standalone
Template Library page is gone; the library renders as a "Company standard
templates" section on the Templates page, published templates appear in the
+ Draft new agreement menu above the built-ins, and the sidebar count
includes them. Step 4 — f106 (10 tests) pins the hygiene layers; f105 gained
the signature-reconciliation case; f101/f103 updated for the new warning and
the folded-in section.

**Decided next:** full suite + browser checks, after-screenshots of the
three bug-report screens, merge to main.

---

# PDF & scanned document upload — per-loop log

**Loop 1 — review the brief before touching anything.** Read the addendum
against the repository rather than taking it at face value. Six instructions
described a codebase we do not have; all six were corrected in the work order
first, with the reasoning kept, and two decisions were escalated (branch name,
EN/SV) and answered. Chief finding: `js/ocr.js` already classifies
digital-vs-scanned and counts PDF pages for the contract register, and the brief
did not mention it — which would have invited a second parallel pipeline. Also
established the test baseline the stop conditions compare against (23/23 on
f101–f104, 7/7 on f105), after discovering that a fresh container with no
`npm install` makes the whole suite look broken when it is not.

**Loop 2 — schema and the server's own reading of a PDF.** Added `source_type`
and `page_count` to `templates`, additive and nullable, with `TPL_IS_SCANNED()`
as the single place that decides NULL and `docx` both mean "not a scan". Then
the pre-flight inspectors: encryption, page count, and digital-vs-scan
classification, all from the bytes, sharing one bounded pass and using the
`node:zlib` already required for the .docx reader.

*Deviation, recorded:* the corrected §1 recommended classifying in the browser
by reusing `js/ocr.js`. On implementation that was wrong twice over — the module
is browser-bound (`window`, canvas, CDN pdf.js) so it cannot run server-side at
all, and the page count gates spending so it must not be forgeable by a client.
The server reads the file itself. RECON.md carries the full reasoning.

*Caught during this loop:* the first version of `tplPdfClassify()` only inspected
Flate-compressed streams, so a PDF with uncompressed content — perfectly legal,
and what a hand-written PDF looks like — would have been misfiled as a scan and
had its number fields needlessly capped. Fixed to read both.

**Loop 3 — the route, the prompt, and the screen.** Branched the upload route on
signature rather than extension; the PDF travels as a `document` content block so
the API renders the pages and HaTi never rasterises. The shared prompt, tool and
`tplConvertClean()` sanitiser are reused whole, with `TPL_CONVERT_PDF_RULES`
appended only for what changes when the input is pages. That addendum has to
correct the shared prompt's opening line explicitly, which describes an
extraction listing that does not arrive on this route. Confidence cap applied
after cleaning, so it sees the same typed fields the confirmation screen will.
Banner on the confirmation screen, driven by `scanned`, English only.

**Loop 4 — fixtures.** Three PDFs from a new `genbrutpdf.js`: digital, image-only
scan, and underscore/bracket blanks, all carrying the same synthetic Brut wording
as the existing .docx so counts are comparable across routes. The scan draws its
text as pixels with a 5×7 bitmap font plus fixed-seed speckle — deterministic on
purpose. First cut silently clipped a third of the form off the raster page;
caught by checking the page count rather than by a test, and fixed by sizing
`perPage` to the worst case.

**Loop 5 — tests, and the one sanctioned edit.** New `f128` (14 tests): refusals
before any call, classification, the document block, the selective confidence
cap, the banner flag, NULL-is-not-a-scan, and the full pipeline for each of the
three fixtures. Updated `f105`'s first test, which asserted PDFs are *rejected* —
correct before this addendum, wrong the moment it landed. First run failed on a
429 that looked like a bug and was the Copilot rate limiter doing its job;
`f128` now starts with headroom.

**Not done, and why.** The retry in §5 was not built, on either route: it should
fire on an unusable answer and never on a refusal or a rate limit, and getting
that discrimination right needs real failure modes, not a stub. Detection quality
(§9's 20-of-27 bar) and cost per document (§8) are unmeasured because this
environment has no Anthropic key. Both are in BUGLOG.md with the command to run.
