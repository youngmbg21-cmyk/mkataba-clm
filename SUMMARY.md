# SUMMARY

One section per build run, newest at the bottom — the same convention
`BUGLOG.md` follows.

- [Run 1 — Ingestion, AI Budget & Templates upgrade](#run-1--ingestion-ai-budget--templates-upgrade)
- [Run 2 — Rich Templates, Document Typography & Legibility](#run-2--rich-templates-document-typography--legibility)

---

# Run 1 — Ingestion, AI Budget & Templates upgrade

Seven tasks, seven commits, in the order the brief set. Every task was
implemented in full. What follows is what shipped, how it was verified, where I
deviated, and what I deliberately did not do.

---

## What shipped

| # | Task | Commit |
|---|---|---|
| 1 | Reject Word files clearly and tell the user what to do | `061b64f` |
| 2 | Govern AI spend by money, and give onboarding its own budget | `051efaa` |
| 3 | Read scanned paper (OCR) | `23dceef` |
| 4 | Read the whole contract, not just the front | `53260a1` |
| 5 | Catch near-duplicates, don't just skip identical bytes | `7b3627b` |
| 6 | Link amendments to their parent agreement | `0e02406` |
| 7 | Give customer templates fill-in blanks, and bulk creation | `1a754f2` |

New modules: `js/ocr.js`, `js/dedupe.js`, `js/family.js`,
`js/templatefields.js`. New design notes: `DESIGN-ocr.md`,
`DESIGN-template-fields.md`. New fixture:
`sample-contracts/06_Scanned_Test_Document.pdf`. Per-defect detail is in
`BUGLOG.md`.

**Non-negotiable constraints held.** No build step (both new CDN libraries load
lazily at runtime as ES modules / script tags — nothing was added to
`package.json` for the frontend). Every new module follows the
`Object.assign(window, {...})` pattern. Every feature degrades in static mode
(OCR falls back to in-browser Tesseract, spend controls and AI blanks are
server-mode features that are hidden rather than offered-and-failing, everything
else works). No audit entry ever claims a human confirmed a machine's guess —
the OCR provenance, the link suggestion and the link decision are each their own
entry. The WhatsApp / mobile counterparty portal was not touched.

**Out of scope, untouched as instructed:** `MIG_MAX_FILES` (25), `UPLOAD_MAX`
(4 MB), moving batch migration server-side, cloud-storage connectors and
email-in ingestion.

---

## Self-check

Run in real Chromium against a live server. Verbatim results.

**1. A digital PDF still imports exactly as it did before — no regression.**
✅ `01_Naivas_Supplier_Agreement.pdf` → **1,964 characters** extracted by the
existing text-layer path, `ocrNeeded` **false** (never routed to OCR), not
flagged as a Word file, heuristic extraction still produces a value. The OCR
detour only ever engages below the 200-character floor.

**2. Team & Settings shows today's AI spend in money, broken down by feature,
and the figure survives a server restart.**
✅ `/api/ai/spend` returned `$3.64 · 151 requests` split across *Metadata
extraction* ($2.14) and *Clause review* ($1.50); the settings card renders
"Today: $2.14 of $10.00 · 142 requests" plus the per-feature table. Killed and
restarted the process: spend, request count and the open allowance all came back
intact, because the ledger is a SQLite table rather than an in-memory counter.

**3. An admin can open an onboarding allowance, watch it burn down during a
batch, and see migration fall back to pattern matching — with a clear message —
when it runs out.**
✅ Opened `$25 / 500 documents` over HTTP; `POST /api/ai/allowance/document`
burned it down (3 of 500 used, 497 left) and the Migration strip renders the
money and document bars from the same figures. With the allowance exhausted,
`POST /api/ai/extract {allowance:true}` returned **429** with
`allowanceExhausted: true` and *"Migration will carry on with the built-in
pattern matcher — an admin can top it up in Team & Settings."*; `migExtract`
catches that flag, switches to `heuristicExtract` for the remainder of the batch
and shows the reason on the queue. No hard failure, no half-imported portfolio.

**4. `sample-contracts/06_Scanned_Test_Document.pdf` imports with real text and
`textSource: 'ocr-ai'`, fields capped at medium, one request (not one per page).**
⚠️ **Verified except the `ocr-ai` tier, which needs an Anthropic key this
environment does not have.** The fixture (a rasterized copy of the bundled KCB
facility letter, **0-character** text layer) was driven end to end: detected as
image-only → rasterized by pdf.js → **1,581 characters** of accurate contract
text → `textSource: 'ocr-local'`, `pages: 1`, per-page progress events, correct
provenance line, viewer banner and review notice. `capConfidenceForOcr()` was
verified explicitly (`high → medium`, `medium`/`low` untouched). With a key
configured the same path books `ocr-ai` instead; the one-request-per-document
metering is implemented server-side (`countRequest: !!first`) and was verified
against the ledger's request/call columns, but the live vision call itself is
untested here. **This is the one claim in the brief I cannot fully evidence.**

**5. A `.docx` is refused with the "save as PDF" message and creates no record.**
✅ A real `.docx` (a ZIP containing `word/document.xml`) was detected as `docx`
**and still detected when renamed to `.pdf` with a `application/pdf` MIME type** —
the byte-signature check is what makes that work. Zero contracts created, no
`files` POST, no audit entry. The refusal text names PDF explicitly. Verified
separately that a legacy OLE2 `.doc` is caught, an `.xlsx` is **not**
false-positived, and none of the five bundled sample PDFs are flagged.

**6. A long contract with its termination clause on the last page has the
correct expiry extracted, with a source span pointing at that clause.**
✅ (payload) / ⚠️ (span). Against a synthetic 138,390-character agreement whose
term clauses sit on the last page: the old 24,000-character head slice missed
both "expires on 31 December 2027" and "90 days written notice"; the new payload
(28,160 chars, 3 merged sections, 2 omission markers, inside the 60,000 cap)
contains the expiry date, notice period, non-renewal statement, governing law,
execution block **and** the front anchor and payment window. Re-run at a tight
28,000-character budget the expiry clause still survives — the priority ordering
drops definitions before termination as specified. **The source span is the
model's output**, so like item 4 it is implemented and schema-verified but not
exercised against a live key; the review screen renders `sourceSpans[field]`
under each value when present.

**7. The same agreement uploaded as both a PDF and a re-scanned copy is flagged
as a possible duplicate, not silently imported twice.**
✅ Against text from the real sample contracts: the same agreement reflowed into
a different format → **identical `textFingerprint`** (`kind: 'text'`); a
simulated re-scan (whitespace collapsed, ~0.4% OCR-style character corruption,
page furniture appended) → SimHash distance **5** (`kind: 'related'`); the same
agreement plus an amending clause → distance **3** (`kind: 'near'`); a genuinely
different contract → distance **28**, well outside the threshold. The
metadata-only signal ("Naivas Limited" vs "Naivas Ltd", same effective date,
value 1.6% apart, unrelated text) also fires. Flagged files get a `duplicate?`
row with Skip / Import anyway / Import and link — the batch does not block, and
exact matches that auto-skip now name the contract they matched.

**8. A master agreement plus two amendments shows as one agreement / three
documents, with the expiry taken from the later amendment.**
✅ Master (own expiry 2026-06-30) + Amendment 1 (2027-06-30) + Amendment 2
(2028-12-31) + one unrelated lease → **"2 agreements · 4 documents"**;
`effectiveExpiry(master)` = **2028-12-31**, sourced from the second amendment,
while the master's own date is unchanged. The renewal **decision deadline**
resolved to 2028-11-01 — the effective expiry minus the *amendment's* 90-day
notice period, not the master's 60. **Server-side reminders verified both ways**:
a master expiring in exactly 90 days with a linked amendment moving the term out
queued **zero** renewal emails; unlinking the amendment and re-running queued
"Renewal in 90 days: Master Supply".

**9. A custom template with five blanks produces a contract whose register row
is fully populated, with no manual typing.**
✅ Better than five: a synthetic distribution agreement with `[SQUARE BRACKET]`
markers auto-detected **7** blanks with correct inferred types and mappings.
Creating a contract from it produced a register row with counterparty *Coast
Distributors Ltd*, value *4,500,000*, expiry *2028-06-30*, effective date
*2026-07-01*, stream *sales*, the same values mirrored into `c.metadata` at high
confidence, and a document body with every placeholder substituted. Nothing was
typed twice.

**10. A 50-row bulk creation CSV with two deliberately bad cells reports both
errors and creates nothing until they're fixed.**
✅ Exactly. "31st of Feb 2027" in a date column and "four million" in a number
column both reported with their row and column
(`row 8 · EXPIRY DATE: … must be a date like 2026-12-31 …`,
`row 20 · ANNUAL VALUE: … must be a number …`), and **zero** contracts created.
After fixing the two cells the same sheet created **50** drafts in one pass, all
sharing one batch id, all with counterparty and expiry set, each with an audit
entry naming the template and the batch. A 201-row sheet is refused with
"201 rows — the cap is 200 per run."

**11. Everything works in static mode, or degrades with a clear message.**
✅ **Every browser test above ran in static mode** (no server), which is how the
OCR, dedupe, family and template work was verified. Server-mode-only features
degrade rather than fail: the AI OCR tier falls back to Tesseract, "Suggest
blanks" is hidden without a key rather than offered and failing, the pre-flight
estimate and allowance strip are skipped when there is no server, and the
migration intake already warns that static mode stores files in the browser. No
page errors were logged in any run.

**12. A 1,200-contract workspace still loads its summaries in well under a
second.**
✅ With 1,200 contracts (171 of them amendments): **Home 119 ms · Register 30 ms
· Reports 115 ms — 265 ms total**. `familyCounts()` < 1 ms, `effectiveExpiry()`
across all 1,200 = 19 ms, the near-duplicate index build = 1 ms and a full
duplicate scan ≈ 3 ms per candidate. The new work costs a rounding error against
the existing bar.

---

## Deviations from the brief

Each was a judgement call; none changes what the brief asked for.

1. **The spend ledger keys on the configured AI day, not strictly UTC.** The
   brief says "keyed by UTC date". The existing request counter already rolls
   over at local midnight in `AI_DAY_TZ` (default `Africa/Nairobi`), and having
   the money ledger and the request counter roll over at different times would
   be actively confusing for the Kenyan customer the product is for. The ledger
   keys on `aiToday()`, which is UTC when `AI_DAY_TZ=UTC`. Documented in
   `README.md`.

2. **OCR sends one page per `/api/ai/ocr` call rather than a batch.** The
   endpoint accepts an array, but the client sends one page at a time so the
   progress counter can move per page and a batch stays cancellable
   mid-document. The *request counter* still books one request per document,
   which is what the brief actually asked for. Reasoned in `DESIGN-ocr.md`.

3. **The CSP was widened by two named CDN origins** (`cdnjs.cloudflare.com` for
   pdf.js, `cdn.jsdelivr.net` for Tesseract) plus `worker-src blob:`. Rasterizing
   in the browser is impossible otherwise without a build step. Two named
   origins, not a wildcard.

4. **All three OCR library URLs are overridable** via `window.HATI_OCR_*`
   globals, defaulting to the pinned CDN URLs the brief specifies. A customer
   handling contracts behind a strict egress policy otherwise cannot use OCR at
   all — and this is also how the end-to-end test drove the real pipeline, since
   the CDNs are blocked in the build environment.

5. **The AI OCR tier falls back to the local tier on a hard failure**, not only
   when no key is configured. A contract part-read by Tesseract is worth more
   than one abandoned mid-document, provided the provenance is honest — and it
   is: `textSource` records the *weakest* tier used.

6. **A duplicate-flagged file is parked, not blocking.** The brief specifies the
   three actions but not the flow. Rather than halting the batch on a modal, the
   flagged row is parked with its actions and the rest of the drop carries on;
   the decision is made afterwards on the queue. Half a batch waiting on one
   modal is worse for a 25-file drop.

7. **`findDuplicates()` caps at the top 6 matches** (reporting the true total).
   A portfolio built on one standard template — 200 distributor agreements on the
   same paper — legitimately produces a very long "related" tail, which the test
   surfaced. A 50-item list is noise, not a decision.

8. **The built-in templates' `fields` is a lazy accessor**, not a literal array,
   because `TEMPLATE_PRIMARY` lives in `js/wizard.js`, which loads after
   `js/templates.js`. Behaviour is identical; it just resolves on first read.

---

## Bugs the tests caught (and I fixed)

- **`metadataMatch()` read the wrong date field.** It resolved the effective date
  via `effDateOf()`, which looks inside `c.metadata` — but comparison index rows
  carry an already-resolved `effectiveDate`. The metadata duplicate signal
  therefore *never fired at all*. Fixed to accept either shape; the test now
  demonstrates it firing.
- **A pathological duplicate-hit tail** on template-derived portfolios, found
  when a synthetic index of 1,200 near-identical rows matched everything. Led to
  the `DUP_MAX_HITS` cap above.
- **`aiMaxChars` had two different defaults** (50,000 in `capAiInput`, 60,000 in
  the config response) after the Task 4 change. Aligned to 60,000.

---

## Things I found but did not do — the next-run list

Out of scope this run, or discovered along the way.

**Already named as out of scope by the brief** (recording the ideas as
instructed):
- **`MIG_MAX_FILES` (25).** With the onboarding allowance now solving the budget
  side, 25 files per batch is the remaining throughput ceiling on a 500-contract
  onboarding — twenty separate drops. The natural fix is the next item.
- **Move batch migration to a server-side background job.** Everything now runs
  in the browser tab, and OCR makes a batch genuinely long-running: a 25-file
  drop of 10-page scans is 250 vision calls the user must keep the tab open for.
  A server-side job with a resumable queue would also let `MIG_MAX_FILES` go.
- **Cloud-storage connectors and email-in ingestion.** The single largest
  remaining friction in onboarding: the customer's back catalogue is usually
  already in Drive or SharePoint, and drag-and-drop makes them download it first.
- **`UPLOAD_MAX` (4 MB).** Now more binding than it was: a 30-page 200-DPI scan
  routinely exceeds 4 MB, so exactly the documents OCR exists for are the ones
  most likely to be refused for size. Worth pairing with server-side storage.

**Found during this run:**
- **Word support via a real converter.** Refusing `.doc`/`.docx` is honest, but
  a customer's back catalogue genuinely contains Word files. A server-side
  conversion step (or a pure-JS `.docx` unzip-and-read, since `.docx` is already
  a ZIP of XML — the byte sniffer proves we can identify them) would remove the
  refusal entirely for the modern format.
- **The clause review and obligation extraction still send a blind slice.**
  Task 4 fixed the metadata extraction payload; `/api/ai/playbook` and
  `/api/ai/obligations` would benefit from the same `buildExtractionPayload`
  treatment, and for the same reason — the clauses that matter are at the back.
- **`aiRateLight`/`aiRateDeep` are still in-memory and single-instance.** The
  spend ledger is now persisted, but the per-user 15-minute windows are not, so a
  multi-node deployment would need a shared store. Noted in `README.md` as
  instructed.
- **The rate table can go stale silently.** It ships with prices verified
  2026-07-25 and shows that date in the settings UI, but nothing checks it
  against Anthropic's published pricing. A periodic check, or simply surfacing
  the age of the table more loudly once it passes a few months, would stop spend
  being under-reported.
- **Family depth is capped at one, deliberately** — but an amendment *to an
  amendment* is a real (if uncommon) thing, and today it must be linked to the
  master instead. The error message says so explicitly rather than failing
  silently.
- **Bulk creation has no dry-run preview of the resulting register rows.**
  Validation reports errors per cell, which is the important half; showing the
  first few resulting rows as they would appear in the register would make a
  200-row run less of a leap.

---

## Where the run is honest about its limits

The `ocr-ai` tier and the AI source spans are the two places I could not
exercise against a live model, because this environment has no Anthropic key.
Both are implemented, both have their request/response contracts and metering
verified server-side, and both have a verified fallback path (`ocr-local`, and
the review screen simply omitting spans when absent). Everything else in the
brief was driven end to end against real files in a real browser and a real
server, and the results are quoted above rather than summarised.

---

# Run 2 — Rich Templates, Document Typography & Legibility

Five tasks, six commits. Every task was implemented in full. What follows is
what shipped, the measured numbers, how the body actually reads, where I
deviated from the brief, and what I deliberately did not do.

Per-defect detail — what was wrong, root cause, fix, files, verification — is in
`BUGLOG.md`, entries 1–17 of the second run. The storage decision behind Task 0
is in `DESIGN-rich-documents.md`, written before any code.

## What shipped

| # | Task | Commit |
|---|---|---|
| 0 | Rich document content — the foundation | `d0545c6` |
| 1 | Create template, with paste as the primary route | `b05685f` |
| 2 | Document typography — Google Sans Flex / Google Sans Code | `13b1b57` |
| 3 | Document legibility — the ink | `13b1b57` |
| 4 | Edit templates in place, versioned, with provenance | `756dc19` |
| — | Two bugs Task 4 exposed: unshareable contracts, and Legal's saves | `ad56c1d`, `a5bdc9b` |

New modules: `js/richdoc.js` (the sanitiser, the text projection, the canonical
form), `js/richpaste.js` (the paste converter and the editor surface). New
design note: `DESIGN-rich-documents.md`.

**Non-negotiable constraints held.** No build step — both new modules are plain
ES modules loaded in order by `js/app.js`, nothing was added to `package.json`
for the frontend, and the two new web fonts load from Google Fonts exactly as
IBM Plex already did. Single global scope — both modules end in
`Object.assign(window, {...})`. Both modes work — the only server change is one
new endpoint, and everything else runs identically in static mode. The
WhatsApp / mobile counterparty portal was not touched.

## The two numbers the brief asked for

### Measured contrast

Measured, not judged by eye: a browser test computes WCAG 2.x relative
luminance from `getComputedStyle`, compositing any alpha over the effective
background it walks up the tree to find. Ratios are on the `#fbfbfc` document
page, which is what a contract is actually read on — not on white, which would
flatter the numbers.

| Document surface | Before | After |
|---|---|---|
| Body copy | **6.27 : 1** | **17.25 : 1** |
| Headings (h1, h2) | 6.27 : 1 | **17.25 : 1** |
| List items, table cells, `<pre>` | 6.27 : 1 | **17.25 : 1** |
| Table header (on `#f5f5f8`) | — | **16.39 : 1** |
| Rubrics and labels (`/60`, `/65`) | **3.25 : 1** / **3.68 : 1** | **8.00 : 1** |

The "before" figures are the point. `text-brand-800/85` — the blue-grey
`#2c455d` at 85% opacity — measured **6.27:1**, under WCAG AAA's 7:1 for body
copy. The labels beside it were under AA's **4.5:1** for normal text. The brief
described the text as washed out; it was also non-compliant, which is a
different and worse problem.

The fix is a colour, not a smaller opacity number, because opacity means the
same class reads differently on every background it lands on — and the document
page is not white.

> **Caveat on the "before" measurement, stated because it matters.** This
> environment's network policy blocks `cdn.tailwindcss.com`, so Tailwind never
> loads in the test browser and the `text-brand-800/*` utilities never generate.
> A naive probe would have measured the *inherited* colour and cheerfully
> reported ~16:1 for the before state — a number that measures nothing. The test
> therefore injects the exact declaration Tailwind v3 emits for those utilities,
> with the `brand-800` value read out of `index.html` itself. It is the shipped
> configuration either way, but it is a reconstruction, not a live capture.

### How the body reads in Google Sans Flex

Rendered and looked at, not assumed. The document is set at 13.5px / 1.75 on the
`.doc-surface`, 1.85 inside `.hati-doc`.

It reads **noticeably better than IBM Plex at the same size**, for a specific
reason: Google Sans Flex has a large x-height and open apertures, so at the
small sizes contract body copy actually gets set at, the letterforms stay
distinct. `1`, `l` and `I` are separable, which matters when the text is
"clause 1.1.1". The figures are lining and the family is set with
`font-variant-numeric: tabular-nums`, so money and clause numbers align down a
column without any per-cell work — the fee table in the render sample lines up
on its own.

Three things worth recording:

1. **It is a warmer, rounder, more "document" face than IBM Plex**, which is
   grotesque and reads as UI. Putting the two side by side — interface in Plex,
   paper in Flex — the distinction lands immediately, which is the whole point
   of the task.
2. **There is no italic.** See deviation 2 below; emphasis is a real slant axis
   instead, and it looks like a drawn oblique rather than a shear.
3. **Headings need no size inflation to read as headings.** At weight 600 with
   the document's own scale the hierarchy is obvious, so the h1 is only 1.42em —
   a contract title should not shout.

Google Sans Code carries the columnar blocks. In the render sample the fee
schedule and the two-column signature block both hold their alignment, which is
the only thing that face is there to do.

## Task 0 — was it materially harder than the brief assumed?

**No.** The brief offered an escape hatch — stop and report if Task 0 turns out
harder than assumed — and it was not needed. The reason is the decision recorded
in `DESIGN-rich-documents.md`: the existing pipeline is already HTML-shaped at
every point that matters (`execution.html` *is* an HTML string,
`freezeContractHtml` produces HTML, `htmlToStructuredText` already projects HTML
to text), so storing a restricted sanitised fragment changed the *input* to
every consumer rather than its *shape*. A structured block model would have been
the better long-term foundation and would have required rewriting all of it in
one run; I did not start that, and nothing here forecloses it.

The genuinely hard parts were the two the brief flagged, and both are done:

- **Sealed contracts still verify.** The hash is version-gated on
  `execution.hashMode`. A record sealed before this run has no such field, takes
  the `normText()` branch, and produces byte-identical input to what it produced
  before. This was **tested rather than asserted**: the test seals a contract
  using the verbatim pre-change lines and then verifies it through the new code
  path (`BUGLOG.md` #2).
- **Clause numbering survives.** `richToText()` reconstructs ordered-list
  numbering from list type, `start` and nesting depth, and Word's literal
  `mso-list:Ignore` numbers are kept rather than stripped as noise
  (`BUGLOG.md` #8).

## Self-check

All sixteen, with how each was actually checked.

| # | Item | Result |
|---|---|---|
| 1 | Pre-existing templates and contracts open and read exactly as before | **Pass.** `format` defaults to `'text'` and is never inferred; `renderDocHtml(content,'text')` returns byte-identical output to `documentTextHtml(content)`, asserted directly. A pre-rich frozen body is rendered exactly as stored — sanitising it would change how a sealed contract looks, so it is not sanitised. |
| 2 | A previously sealed contract still verifies | **Pass.** Sealed with the verbatim pre-change computation, then verified through the new version-gated path: hash input unchanged, text hash matches, seal matches, frozen HTML untouched. |
| 3 | Google Docs paste preserves numbering, headings, bold, indentation, bullets, signature layout | **Pass.** Real Google Docs clipboard fixture, including the `<b style="font-weight:normal">` wrapper that would otherwise bold the entire contract. |
| 4 | The same from Microsoft Word | **Pass.** Real Word clipboard fixture — Office namespaces, `MsoTitle`/`MsoHeading1`/`MsoListParagraphCxSp*`, `<o:p>`, `mso-list` metadata, a `MsoTableGrid` fee table and a two-column signature block. Produces `1.`, `2.`, `a.`, `b.`, `3.` with no duplicated markers. |
| 5 | "All Caps" formatting arrives as actual capitals | **Pass.** `text-transform:uppercase` and `font-variant:small-caps` are flattened into real capitals *before* the sanitiser strips the styles — that ordering is the only reason it can work. |
| 6 | A pasted table renders as a table, on screen and in the PDF | **Pass.** Table survives the allowlist; `.hati-doc table` styles it; the print block adds `break-inside:avoid` on rows so it is not split mid-row. Confirmed in the render capture. |
| 7 | Hostile paste stores and renders nothing executable, in the portal as well as the workspace | **Pass.** Verified in both, with `window.__pwned` bound as a page-level alarm that never fired. The portal check is scoped to the document region and asserts zero `script/iframe/img/style/form/a/input/button` nodes. Includes the nested case that found `BUGLOG.md` #7. |
| 8 | Plain text with no HTML on the clipboard still works | **Pass.** `richFromClipboard` falls back to `text/plain` → `textToRich`, and also falls through when the HTML converts to nothing. |
| 9 | Documents render in Google Sans Flex; the interface does not | **Pass.** Asserted on computed styles for both, and confirmed by measuring rendered text width against the fallback faces. |
| 10 | Body text ≥ 7:1 on screen and in the PDF; export keeps colour | **Pass.** Table above. `print-color-adjust: exact` is set on the document surface and forced across everything in `#print-root`, so drivers cannot lighten the text or drop the value-stream colours, status chips and clause tags. |
| 11 | A pasted template behaves identically to an uploaded one | **Pass.** Same document pasted and uploaded: Preview, Use, Add blanks and the bulk CSV all work on both. "Add blanks" gives the rich template a selectable document pane and the plain one its textarea. |
| 12 | Name, stream and body edits persist in both modes and leave existing contracts unchanged | **Pass.** Persistence verified against a real server for both Admin and Legal (`BUGLOG.md` #17) and in static mode. The existing contract's body is asserted byte-identical after the template moves to v2. |
| 13 | Deleting a placeholder while its field exists warns before saving | **Pass.** And the reverse — a placeholder with no field — **blocks** the save, because that one prints as literal braces in a real contract. Both warnings offer the remedy inline. |
| 14 | Built-ins offer "Duplicate & edit" and the original is untouched | **Pass.** `TEMPLATES.RM` asserted unchanged after duplication. |
| 15 | A contract shows which template and which version it came from | **Pass.** "Created from Distribution Agreement v1", and when the template has moved on it says so and states that this contract keeps its original wording. |
| 16 | Formatting-only differences report "formatting changed", not "no changes" | **Pass.** And a genuinely identical pair still reports "identical", so the new message is not just always-on. |

## Deviations from the brief

**1. Tasks 2 and 3 are one commit, not two.** Both are carried by the same new
`.doc-surface` class — it exists to apply the document faces *and* the document
ink to exactly the surfaces that render contract text. Splitting them would have
meant committing a `.doc-surface` that sets a font but no colour, or a colour
but no font: an intermediate state that never runs in practice and that nothing
verifies. The commit message says so explicitly rather than leaving it implied.

**2. Google Sans Flex has no italic, so emphasis uses its slant axis.** The
brief did not anticipate this and neither did I; the axes were probed against
the Google Fonts API rather than recalled. `ital` returns only upright faces.
What the family does have is a real `slnt` axis, range **−10..0** (the API
rejects `-15` with a 400). Setting `font-style: italic` on it would have given a
browser-synthesised shear, which on a contract's defined terms reads as a
rendering fault. `<em>` therefore computes `font-style: normal` with
`font-variation-settings: 'slnt' -10`, behind an `@supports` guard, with the
`font-style` declaration left as the fallback for anyone who does not get the
variable font.

**3. Google Sans Code's OFL licence is verified; Google Sans Flex's is not.**
Google Sans Code has a public entry at `google/fonts/ofl/googlesanscode/` whose
`METADATA.pb` records `license: "OFL"`. **Google Sans Flex has no entry in the
public `google/fonts` repository** under `ofl/`, `apache/` or `ufl/`, and
`fonts.google.com` is blocked by this environment's network policy, so I could
not verify its licence from source. It is served by Google Fonts and the brief
states both are SIL OFL — but I am recording that as *unverified* rather than
repeating it as fact. **Worth confirming before this ships to a customer.**

**4. The plain-text contract editor converts rather than editing rich in
place.** The workspace's `openEditDocModal` is still a textarea. Given a
formatted contract it now says so, explicitly, before you save — that this is
the plain-text editor, that the formatting will be lost, and that the clause
numbers below are written out as text so the wording survives — and it records
the conversion in the audit trail. The brief's rich-editor requirement was
scoped to *templates* (Task 4), and that is fully done; upgrading the contract
editor to reuse `richEditor()` is a small, obvious follow-on, listed below.

**5. Two bugs outside the brief's scope were fixed, because the brief's own
route ran through them.** Both are in `BUGLOG.md` with full detail. Neither was
caused by this run.

## Two bugs the brief's route ran straight into

Recorded here because they change what a reader should believe about the state
of the product, not just about this run.

**A contract created from a custom template could not be shared at all.** The
counterparty portal decided whether a payload held a real document by asking
where the document came from — an uploaded file, or a built-in template it could
regenerate. A contract generated from a *custom* template has
`source:'template'` and `template:null`, so both arms were false and the
counterparty was told the link was "malformed or truncated". It was neither: the
document was there and rendered correctly the moment the check was passed. This
sits directly across the route this entire brief builds — paste your standard
paper in, generate a draft, send it to the other side. Found by testing the
portal end to end rather than testing the sanitiser in isolation
(`BUGLOG.md` #16).

**A Legal user's template save silently failed in server mode.** Templates live
in the settings blob, persisted through `PUT /api/settings`, which is admin-only
— but template management is `canEdit()`, i.e. Admin *and* Legal. Legal could
open the editor, save, see the success toast, then a second toast saying
"Settings save failed: Admin access required", with the change gone. Static mode
worked, which is exactly the kind of split that survives unnoticed. Template
writes now have their own endpoint at the right authority, writing only the
`customTemplates` key (`BUGLOG.md` #17).

## Storage: should templates become their own records?

The brief asked for a recommendation with rough sizing, before a workspace
reaches thirty templates with histories. **Yes — and the threshold is closer
than it looks.** Here is the measurement, not an estimate.

A realistic standard-form contract — nine clauses with sub-obligations, a fee
table, a signature line — as rich content:

| | Size |
|---|---|
| Rich body | 4.4 KB |
| Text projection | 3.9 KB |
| Template record, v1 (JSON, one blank) | **9.1 KB** |
| Same record after 10 saves | **51.2 KB** |
| 30 templates × 1 version | 276 KB |
| **30 templates × 10 versions** | **1.50 MB** |

The multiplier is the problem, not the absolute size. `saveSettings()` writes
the **entire** settings object on every change: `PUT /api/settings` in server
mode, a full `localStorage` rewrite in static mode. So at thirty templates with
ten versions each, **every** settings change — a template edit, an approval
threshold, an AI configuration change — moves 1.5 MB. In static mode that is
also 30% of a typical 5 MB `localStorage` origin quota, shared with every
contract in the workspace.

**Recommendation: give templates their own table, at the same time as the next
schema change — not urgently, but not later than the first customer who edits
templates regularly.**

The shape, following what `contracts` already does (per-row storage with its own
version column, which is exactly this problem solved once already):

```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY, name TEXT, folder TEXT, format TEXT,
  version INTEGER, updated_at TEXT, updated_by TEXT, json TEXT
);
CREATE TABLE template_versions (
  id TEXT, n INTEGER, at TEXT, by TEXT, note TEXT, json TEXT,
  PRIMARY KEY (id, n)
);
```

**Rough sizing: half a day.** The client already routes every template read
through `customTemplates()` and every write through `saveCustomTemplates()` —
both single functions, both already isolated, and `saveCustomTemplates()` now
has its own endpoint, which is most of the seam. The work is: the two tables,
four endpoints (list, get, put, delete) reusing the `templateManager` middleware
added this run, a migration that reads `appSettings.customTemplates` and writes
the rows, and pointing the two client functions at the new endpoints. Version
history moves to `template_versions` and stops being loaded at all unless
someone opens the version list — which is the actual win, because it takes the
51 KB record back down to 9 KB for every normal read.

**What makes it safe to defer:** nothing about the current design leaks. Both
accessors are single functions, the version history is already a separate array
rather than being interleaved with the record, and the new endpoint means
template writes no longer rewrite unrelated settings server-side. What makes it
unwise to defer past thirty templates is the static-mode quota, which fails hard
and without a useful error.

## Deliberately not done

- **No formatting-aware diff.** The diff is over the text projection; a
  formatting-only change is *detected and labelled*, not itemised clause by
  clause. Itemising it needs the structured block model.
- **No mass conversion of existing records.** Every template and contract stays
  `'text'` until someone edits or pastes into it. There is no migration to run
  and nothing to roll back.
- **No inline styles, in either direction.** Not one `style` attribute survives
  the sanitiser. Document appearance comes from HaTi's stylesheet alone, which
  is what makes a pasted contract look like the product rather than like the
  machine it was written on.
- **`colspan`/`rowspan` are not on the allowlist**, per the brief's "every
  attribute not named above". A merged cell degrades to separate cells;
  contract tables are overwhelmingly rectangular.
- **No font pickers, colour pickers or text sizing** in the editor, per the
  brief. Ctrl/Cmd+B, I and U are the only formatting controls, because those are
  the three marks a contract actually uses.

## Next run, in the order I would do it

1. **Confirm the Google Sans Flex licence** before this reaches a customer
   (deviation 3 above). Everything else in Task 2 is settled.
2. **Point the contract editor at `richEditor()`** so editing a formatted
   contract stops being a conversion. The component exists and is already reused
   twice; this is wiring plus removing the warning.
3. **Templates into their own table**, per the sizing above.
4. **A formatting-aware diff**, which is the point at which the structured block
   model earns its rewrite. `richToText()` is the seam a converter attaches to,
   and `DESIGN-rich-documents.md` records why the model was not adopted now.
5. **Let the counterparty redline formatted text.** The portal's redline box is
   a textarea, so an accepted redline converts a rich contract to plain text —
   handled honestly today (the format is reset and the audit entry says why) but
   it is a real loss on a route that will get more traffic now.
