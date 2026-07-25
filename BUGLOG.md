# BUGLOG

One entry per defect fixed. Newest run at the bottom.

---

## Run: Ingestion, AI Budget & Templates upgrade

### 1. Word files were accepted, silently produced nothing, and landed as empty shells

**What was broken.** The file picker offered `.doc` and `.docx` in all three
ingestion entry points (single upload, bulk migration, template upload). But
`extractDocText()` only ever handled `text/*` and `pdf`. A Word file was
therefore accepted, produced an empty string, and a contract record was created
anyway — no counterparty, no dates, no text for the AI review, and an audit
entry that said the document had been imported. Silent failure, and the user
only found out later when the register showed a blank row.

**Root cause.** `MIG_ACCEPT` (`js/views/migration.js`), the `accept` attribute on
`#up-file` (`js/views/contract.js`) and on `#ut-file` (`js/views/library.js`) all
advertised Word support that the extraction path never had. Nothing checked the
file type before creating the record, and the template upload's failure message
told the user "Word files need conversion first" *after* extraction, which is
the right advice at the wrong time.

**The fix.**
- Added `detectWordBytes()` / `detectWordFile()` in `js/views/contract.js`,
  which sniffs the actual bytes rather than trusting the extension or the MIME
  type: `PK\x03\x04` plus a `word/…` OOXML part name means `.docx`;
  `D0 CF 11 E0 A1 B1 1A E1` (OLE2 compound file) means legacy `.doc`. The byte
  check is what catches drag-and-drop, which bypasses `accept` entirely, and a
  renamed file.
- Refusal happens **before** any contract record, file upload or audit entry is
  created, in all three entry points, with one shared message (`WORD_REFUSAL`):
  *"HaTi can't read Word files yet. Save or print the document as a PDF and
  upload that instead — the PDF is also what you'd want on record as the signed
  version."*
- The bulk migration queue shows a distinct `word` row status ("Word — not
  read"), not a generic `error`, and the batch summary counts refusals
  separately.
- Removed `.doc,.docx` from every `accept` attribute so the picker no longer
  invites the file in, and updated the surrounding copy in all three places.

**Files touched.** `js/views/contract.js`, `js/views/migration.js`,
`js/views/library.js`, `js/core.js` (new `EXTRACT_MAX_CHARS` export).

**How it was verified.** Byte-signature detection unit-checked against a
generated `.docx` (real ZIP with `word/document.xml`), a renamed `.docx`
(extension `.pdf`), a legacy OLE2 `.doc` header, and the five bundled
`sample-contracts/*.pdf` files (all correctly *not* flagged). Confirmed no
contract record, no `files` POST and no audit entry is produced on refusal.

---

### 2. AI spend was governed by request count, which never tracked the bill

**What was broken.** Three related problems.
(a) `aiDailyLimit` counted *activity*, not *cost* — a cheap metadata extraction
and an expensive playbook review each ticked the counter by one, so the ceiling
did not track the thing it exists to protect. (b) With a default of 500/day it
blocked onboarding: importing a 500-contract back catalogue is at least one call
per contract, so a new customer's most important task could not be finished in a
day. (c) The counter lived in the settings blob and was reset by anything that
lost it; a daily *money* budget cannot tolerate that.

**Root cause.** `recordAiCall()` incremented a bare integer inside
`anthropicMessages()` and ignored the `usage` block Anthropic already returns on
every response. There was no price table, no per-feature attribution, and no
concept of a separate onboarding budget.

**The fix.**
- **Meter money.** `recordAiSpend()` prices each call's `input_tokens`,
  `output_tokens` and cache tokens against an admin-editable per-model rate table
  (`aiRates`, seeded with pricing verified 2026-07-25; cache writes 1.25× and
  cache reads 0.1× of the input rate) and writes it to a new **`ai_spend` SQLite
  table** keyed by day and feature. It survives a restart; the request count is
  now derived from the same ledger.
- **New primary ceiling `aiDailySpendLimit`** (USD, admin-editable, env fallback
  `AI_DAILY_SPEND_LIMIT`, default 10). `aiDailyLimit` is retained as a blunt
  secondary guard with its default raised 500 → 5000, and the UI states plainly
  that spend is the real control.
- **Spend is shown as money**, broken down by feature — "Today: $2.14 of $10.00
  · 142 requests" plus a per-feature table (extraction, OCR, clause review,
  obligations, portfolio graph, search, template advisor, Copilot).
- **Onboarding allowance.** A one-off budget in money and/or documents that bulk
  migration and OCR draw on instead of the daily ceiling, opened from Team &
  Settings, burning down visibly on the Migration screen. When it runs out the
  server answers 429 with `allowanceExhausted` and migration continues on the
  pattern matcher with a clear message rather than hard-failing mid-batch.
- **Pre-flight estimate** on the Migration screen ("25 documents, about 180
  pages, estimated $1.20"), with explicit confirmation above an admin-set
  threshold. Labelled as an estimate throughout.
- **OCR counts as one request per document**, not one per page; pages count
  toward spend and `ocrMaxPages`.
- The 15-minute per-user limiters (`aiRateLight` 40 / `aiRateDeep` 15) are
  untouched. The `429` + `Retry-After` shape is preserved; a distinct, equally
  friendly message covers the spend ceiling, because the remedy is different.

**Files touched.** `server/server.js`, `js/views/settings.js`,
`js/views/migration.js`, `js/metadata.js`, `js/api.js`, `js/core.js`,
`README.md`.

**How it was verified.** Ran the server against a scratch database: seeded a
ledger day, confirmed `/api/ai/spend` reports `$3.64 · 151 requests` split
across two features; lowered `dailySpendLimit` below it and confirmed
`/api/ai/extract` returns 429 with the spend-ceiling message and
`spendLimit: true`; exhausted an allowance and confirmed the
`allowanceExhausted` 429; restarted the process and confirmed both spend and
allowance survived. Rate-table edit, reset-to-defaults and rejection of a
negative rate all confirmed over HTTP.

---

### 3. Scanned paper was a dead end — the product handed the customer's problem back

**What was broken.** `extractDocText()` returned text only for true digital PDFs
and plain text. A scanned contract or a phone photo yielded nothing: the
migration flagged it `blocked: 'no-text'`, the register row came back empty, and
the customer typed the whole agreement by hand. The target customer is a Nairobi
business with drawers of scanned paper, so this was the single largest hole in
the ingestion story.

**Root cause.** There was no rasterization and no recogniser — only the two
existing PDF text-layer extractors. `blocked: 'no-text'` was also set *before*
anything had tried to read the image, so the gate fired on documents that were
perfectly readable, just not as a text layer.

**The fix.** New `js/ocr.js` plus a new `POST /api/ai/ocr` endpoint (see
`DESIGN-ocr.md` for the full design note).
- **Detect**: a PDF under 200 characters of text layer is image-only; images go
  straight to OCR.
- **Rasterize**: pdf.js, loaded lazily as an ES module, renders each page to a
  canvas at ~200 DPI, exported as JPEG q0.72.
- **Recognise, two tiers**: Claude vision via the server proxy (`ocr-ai`) with a
  strict transcribe-don't-summarise prompt that marks unreadable words
  `[illegible]`; Tesseract.js in-browser (`ocr-local`) when there is no key or in
  static mode, labelled as the slower, less accurate fallback. A hard failure
  mid-document falls back to the local tier rather than abandoning the document.
- **Limits**: `ocrMaxPages` (30) and `aiRateOcr`, both admin-editable with env
  fallbacks. Over the page cap the first N pages are read, saved, and the skipped
  pages are named — never a refusal.
- **Progress**: a live page counter in the upload strip ("Reading page 4 of 12")
  and in the migration queue row; the batch stays cancellable mid-document and
  keeps the pages already read.
- **Honesty**: `upload.textSource` / `ocrPages` / `ocrSkippedPages` recorded;
  `capConfidenceForOcr()` caps every OCR-derived field at medium until a human
  confirms it; audit trail, document viewer, review panel and clause review all
  state the text was machine-read from a scan; `blocked: 'no-text'` can now only
  fire after OCR has been attempted and failed.
- The CSP gains two named CDN origins and `worker-src blob:`; all three library
  URLs are overridable via `window.HATI_OCR_*` for egress-restricted deployments.

**Files touched.** `js/ocr.js` (new), `server/server.js`, `js/views/contract.js`,
`js/views/migration.js`, `js/views/library.js`, `js/metadata.js`, `js/app.js`,
`sample-contracts/06_Scanned_Test_Document.pdf` (new fixture), `README.md`,
`DESIGN-ocr.md`.

**How it was verified.** Driven end to end in real Chromium against the committed
fixture (`06_Scanned_Test_Document.pdf`, a rasterized copy of the KCB facility
letter with a **0-character** text layer):
- digital text layer 0 chars → `ocrNeeded` true → pdf.js rasterized → Tesseract
  returned **1,581 characters** of accurate contract text → `textSource:
  'ocr-local'`, `pages: 1`, progress events fired per page;
- metadata extraction then ran over that text and the provenance line, viewer
  banner and review-panel notice all rendered;
- `capConfidenceForOcr()` verified explicitly: `high → medium`, `medium` and
  `low` untouched, `_ocrCapped` set;
- a synthetic 40-page scan with `maxPages: 3` read 3 pages, reported
  `skippedPages: 37`, saved the text, and produced "Pages 4–40 were not read
  (page limit)";
- cancelling mid-document kept the 2 pages already read;
- a digital PDF (`01_Naivas_Supplier_Agreement.pdf`, 1,964 chars) was **not**
  routed to OCR — no regression on the existing path.

The `ocr-ai` tier could not be exercised in the build environment (no Anthropic
key available); its request/response contract, metering and 429 handling were
verified server-side instead. See SUMMARY.md.

---

### 4. Extraction read the front of a contract and missed the clauses that matter

**What was broken.** `js/metadata.js` and `js/views/migration.js` both sliced the
document to 24,000 characters before extraction, the server sliced again inside
`/api/ai/extract`, and `extractDocText()` capped at 40,000. That is roughly the
first eight to twelve pages. Renewal, termination, notice period and expiry
clauses usually sit at the **back** of a long agreement — so the fields the
90/60/30-day reminder system depends on were the ones most likely to be missing
or wrong. Silent, and invisible until a renewal was missed.

**Root cause.** Three independent blind head-slices, none of which knew anything
about where in a contract the term-critical language lives.

**The fix.**
- Client extraction cap raised to **200,000** characters (`EXTRACT_MAX_CHARS`);
  default `aiMaxChars` raised 50,000 → **60,000**.
- New `buildExtractionPayload(text)` assembles front (~15k) + back (~10k) +
  ±1,500-character windows around every term-critical term, merged where they
  overlap, joined in document order, with explicit
  `[... N characters omitted ...]` markers, capped at `aiMaxChars`, dropping the
  lowest-priority windows first (definitions before termination).
- Removed the hard 24,000 slice from `server/server.js` — `capAiInput` and
  `aiMaxChars` govern, and the prompt now explains what the omission markers
  mean so the model does not infer across a gap.
- **Source spans**: the extraction tool returns the short verbatim phrase behind
  each value; stored as `metadata.sourceSpans[field]` and shown on the review
  screen under each field ("found: *'…expires on 31 December 2027…'*"). The
  review header also states how much of the document was actually read.
- **Thorough mode** (`aiThoroughExtract`, off by default): the whole document in
  overlapping 30,000-character windows, one deep-tier call each, merged field by
  field — highest confidence wins, ties go to later chunks for expiry, renewal
  and notice and to earlier chunks for parties and value. The settings UI states
  it multiplies cost and the pre-flight estimate reflects it.
- With thorough mode off it remains exactly **one AI call per contract**.

**Files touched.** `js/metadata.js`, `js/core.js`, `js/views/contract.js`,
`js/views/migration.js`, `server/server.js`, `README.md`.

**How it was verified.** Ran `buildExtractionPayload` against a synthetic
138,390-character agreement whose term clauses sit on the last page. The old
24,000-char head slice missed both "expires on 31 December 2027" and "90 days
written notice"; the new payload (28,160 chars, 3 merged sections, 2 omission
markers, within the 60,000 cap) contains the expiry date, the notice period, the
non-renewal statement, the governing-law clause, the execution block **and** the
front anchor and the payment window. Re-run at a tight 28,000 budget, the expiry
clause still survives — the priority ordering drops definitions first as
intended. Thorough chunking verified at 6 chunks with an exact 3,000-character
overlap and full coverage of the tail; the merge rules verified to pick the
higher-confidence counterparty and, on a confidence tie, the **later** chunk's
expiry date, carrying its source span through.

---

### 5. Deduplication only caught identical bytes, and silently skipped what it caught

**What was broken.** `migProcessFiles` deduplicated on `sha256(dataUrl)` — exact
bytes and nothing else. The same agreement scanned twice, or a PDF alongside a
Word-exported copy of the same text, imported as two separate contracts, so the
register overstated the portfolio. And when a duplicate *was* caught it was
skipped in silence: the user saw a file disappear with no indication of what it
matched.

**Root cause.** A single `Set` of file hashes, with no text-level or metadata
identity, and no decision path — the pipeline could only import or skip.

**The fix.** New `js/dedupe.js` with four signals, cheapest first:
- `fileHash` — exact bytes, still the fast first check;
- `upload.textFingerprint` — SHA-256 of the text after aggressive normalisation
  (lowercase, strip non-alphanumerics, collapse whitespace);
- `upload.simhash` — a 64-bit SimHash over word 5-grams, kept as a hi/lo pair
  rather than a BigInt so a full-register scan stays cheap. Hamming ≤ 3 is a
  near-certain duplicate, 4–12 closely related;
- metadata — same normalised counterparty **and** same effective date **and**
  value within 2%, for the re-typed copy whose text no longer matches.

The behaviour changed too: a flagged file gets a `duplicate?` queue row with
**Skip / Import anyway / Import and link as an amendment of C-XXX**, and the
batch carries on past it rather than blocking. Exact matches still auto-skip but
now name the contract they matched. `text_fingerprint`, `simhash` and `parent_id`
are real SQLite columns, so the comparison index is built from light register
rows without loading a single document body. Also added `js/family.js` with the
`parentId` / `relation` / `relationNote` model and its depth-one and cycle rules,
which the link action writes through.

**Files touched.** `js/dedupe.js` (new), `js/family.js` (new),
`js/views/migration.js`, `server/server.js`, `js/app.js`, `README.md`.

**How it was verified.** In real Chromium against text extracted from the bundled
sample contracts:
- the same agreement reflowed into a different format → **identical
  textFingerprint**, reported as `text` (distance 0);
- a simulated re-scan (whitespace collapsed, ~0.4% OCR-style character
  corruption, page furniture appended) → SimHash distance **5**, reported as
  `related`;
- the same agreement plus an amending clause → distance **3**, reported as
  `near`;
- a genuinely different contract (a lease vs a supplier agreement) → distance
  **28**, comfortably outside the 12 threshold;
- the metadata-only signal ("Naivas Limited" vs "Naivas Ltd", same effective
  date, value 1.6% apart, unrelated text) → matched.

**A real bug the test caught:** `metadataMatch()` read the effective date via
`effDateOf()`, which looks in `c.metadata` — but index rows carry a resolved
`effectiveDate` field, so the metadata signal never fired at all. Fixed to accept
either shape. Also capped `findDuplicates()` to the top 6 hits (reporting the
true total) after the test showed a portfolio of near-identical template
contracts can legitimately produce a very long related-match tail.

**Performance:** at 1,201 register rows, index build ~360 ms and a full scan
**~3 ms** per candidate — well inside the existing performance bar.

---

### 6. Amendments were standalone contracts, so the count and the reminders were both wrong

**What was broken.** Every imported file became its own contract. A master
agreement plus six addenda counted as seven agreements, and the expiry came from
whichever document happened to be filed rather than from the amendment that
actually changed the term. A renewal reminder therefore fired on a stale date —
or fired seven times for one agreement.

**Root cause.** There was no relationship between contracts at all: no
`parentId`, no notion of a family, and every expiry consumer read `c.expiry` (or
`c.metadata.expiryDate`) directly, in eight different places.

**The fix.** New `js/family.js`.
- **Data model**: `parentId` / `relation` / `relationNote`, depth capped at one,
  cycles and self-links rejected with an explanatory message. `parent_id` is a
  SQLite column with an index.
- **Suggest, never auto-link**: `looksLikeAmendment()` + `suggestParents()`
  propose a parent at import (filename/recital regex AND a counterparty match,
  ranked by SimHash similarity and cited agreement names/dates). The proposal
  (`Link suggested`) and the human's decision (`Link decision`) are separate
  audit entries.
- **Manual linking** both ways from the contract workspace, plus Unlink.
- **`effectiveExpiry()`** and a full rollout: renewal reminders (client and
  server), the notice-period decision deadline (which now also takes the
  amendment's notice period), `contractRisk`, the Home attention snapshot and
  expiry pipeline, Register filters/sort/expiry cell, Calendar, Reports and the
  Intelligence graph.
- **Family-aware counting**: `familyCounts()` / `agreementsIn()`, "N agreements
  · M documents" on the Home command bar, the Register footer and the Migration
  KPI strip; the Register groups children under their parent with a flat toggle.
- **Sixth migration gate** `link`, shown only for documents the suggester
  flagged.

**Files touched.** `js/family.js` (new), `server/server.js`, `js/core.js`,
`js/obligations.js`, `js/app.js`, `js/components.js`, `js/views/register.js`,
`js/views/home.js`, `js/views/calendar.js`, `js/views/reports.js`,
`js/views/intelligence.js`, `js/views/contract.js`, `js/views/migration.js`,
`README.md`.

**How it was verified.** In Chromium, with a master (own expiry 2026-06-30) plus
two amendments (2027-06-30 and 2028-12-31) and one unrelated lease:
- counts → **2 agreements · 4 documents**;
- `effectiveExpiry(master)` → **2028-12-31**, sourced from **MK-102**, while the
  master's own date stays 2026-06-30 and a child still speaks for itself;
- the renewal **decision deadline** → 2028-11-01, i.e. the effective expiry minus
  the *amendment's* 90-day notice period, not the master's 60;
- depth-one, self-link and master-with-children link attempts all rejected with
  their specific messages; a valid link accepted;
- Register grouping puts both amendments under the master and the flat toggle
  restores four independent rows;
- the suggester flagged an "Amendment No. 3" naming the master in its recitals,
  proposed MK-100 with its reasoning, **left `parentId` null**, and logged
  "Not linked — awaiting a human decision".

**Server-side reminders verified end to end** against a live server: a master
expiring in exactly 90 days with a linked amendment moving the term to +400 days
queued **zero** renewal emails; unlinking the amendment and re-running queued
"Renewal in 90 days: Master Supply". That is precisely the defect this task
exists to fix.

---

### 7. A customer's own template lost every bit of automation, and produced no data

**What was broken.** The twelve built-in Kenyan templates have variables and a
guided wizard. A customer's own uploaded template was just extracted text
(`saveTemplateRecord` / `createFromCustomTemplate`): no blanks, no guided fill,
no structured output. So at the exact moment that matters — when a customer uses
their own paper, the paper they actually sign — they lost all the automation, and
the resulting contracts carried no counterparty, no value and no expiry. The
register row was empty and everything downstream (filters, folder routing,
renewal reminders, reports) had nothing to work with.

**Root cause.** Two unrelated shapes: `templateVars()` was bespoke to the
built-ins, and a custom template was a bare `{name, folder, text}` record. There
was no field schema, no placeholder mechanism, and no path from a filled-in
value to a contract field.

**The fix.** New `js/templatefields.js` (design note:
`DESIGN-template-fields.md`).
- **One field schema** — `{key,label,type,opts,required,def,maps}` with
  `type ∈ text|party|num|date|select` over a body of `{{key}}` placeholders.
  `TEMPLATES` in `js/templates.js` now exposes the same shape through a lazy
  `fields` accessor, so the wizard, preview and bulk creation are template-kind
  agnostic. `templateAllowedForRole` and the viewer read-only rule are preserved
  and now also gate the built-in card list and bulk creation.
- **Three ways to make blanks**: manual selection (always available), AI-assisted
  via a new `POST /api/ai/blanks` on the fast tier (proposals are reviewed and
  editable — nothing is saved unreviewed, and the server drops any proposal whose
  `find` span is not literally present in the document), and auto-detect of
  `[BRACKETS]` / `{{curly}}` / labelled underscore runs on import.
- **Feed the repository**: `applyTemplateValues()` writes every value into
  `c.metadata.templateFields` and the mapped ones into `c.counterparty`,
  `c.value`, `c.expiry`, `c.fields.effDate`, `c.folder` and the matching
  `c.metadata` keys, at `high` confidence — a human typed them.
- **Bulk creation**: CSV download (one column per blank), upload, **whole-sheet
  validation before anything is created**, per-cell errors, one creation pass
  with a batch id and a naming audit entry, 200-row cap, reusing `parseCsv`
  rather than writing a second CSV parser.

**Files touched.** `js/templatefields.js` (new), `js/templates.js`,
`js/wizard.js`, `js/views/library.js`, `js/app.js`, `server/server.js`,
`README.md`, `DESIGN-template-fields.md`.

**How it was verified.** In Chromium, end to end on a synthetic distribution
agreement carrying `[SQUARE BRACKET]` markers:
- auto-detect found **7** blanks and assigned sensible types and mappings
  (`distributor_name:party→counterparty`, `expiry_date:date→expiry`,
  `annual_value:num→value`, `start_date:date→effDate`);
- creating a contract from it produced a register row with **counterparty
  "Coast Distributors Ltd", value 4,500,000, expiry 2028-06-30, effective date
  2026-07-01, stream `sales`**, the same values mirrored in `c.metadata` at high
  confidence, and a document body with every placeholder substituted — nothing
  typed twice;
- built-in `TEMPLATES.DA` reports the unified schema, and the NDA correctly has
  no value field;
- **the brief's exact bulk scenario**: a 50-row CSV with two deliberately bad
  cells ("31st of Feb 2027" in a date column, "four million" in a number column)
  reported **both** errors with their row and column and created **nothing**;
  after fixing the two cells the same sheet created **50** drafts in one pass,
  all sharing one batch id, all with counterparty and expiry set, each with an
  audit entry naming the template and the batch;
- a 201-row sheet is refused with "201 rows — the cap is 200 per run."
