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

---

## Run: Rich Templates, Document Typography & Legibility

### 1. A document body could only ever be plain text, so every contract lost its structure at the door

**What was broken.** `redlineText`, the template `body` and every version record
were plain strings, and the only renderer for them, `documentTextHtml()`, escaped
the whole thing into a `white-space:pre-wrap` div. That is correct for what it
was given, but it meant a customer's actual contract — headings, bold defined
terms, numbered clauses, a fee table — arrived as an undifferentiated wall of
text. The clause numbers survived only when the source happened to have them as
literal characters; anything a word processor drew (`<ol>` markers, Word's list
numbering) was gone. A legal document is its clause numbers.

**Root cause.** There was no format dimension at all. The pipeline had exactly
one representation and every consumer — render, seal, diff, AI, print, portal —
assumed it.

**The fix.** A new module, `js/richdoc.js`, and a `format` field alongside every
document body (`'text'` for everything that already exists, `'rich'` for new
content). Design note: `DESIGN-rich-documents.md`, written before the code.

- **A strict tag allowlist** (`p br h1-h4 strong em u s ul ol li table thead
  tbody tr th td blockquote pre span`) with only `start`/`type` on `ol` and the
  single class `hati-field` on `span`. Everything else is dropped, unwrapped or
  mapped. No `style`, no `id`, no `href`, no `src`, no `on*`, no comments.
- **`sanitizeRich()` parses inert** — `document.implementation.createHTMLDocument()`
  — so a hostile fragment runs no scripts, fires no handlers and fetches no
  images while it is being cleaned, rather than during.
- **`renderDocHtml()` is the single render entry point** and sanitises *again*,
  at the point of render. Storage is never trusted. This is what protects the
  counterparty share portal, which serves people outside the workspace with no
  login.
- **`richToText()`** projects rich content back to text and **reconstructs
  ordered-list numbering** from the list type, `start` and nesting depth
  (`1.`, `1.1`, `1.1.2`). That projection is what the diff compares, the AI
  reads, search matches and the portal's redline box is pre-filled with. Word's
  own `<span style='mso-list:Ignore'>4.4</span>` literal numbers are kept, not
  stripped as noise.
- **`canonicalRich()`** is a deterministic serialisation — attributes sorted,
  whitespace normalised at block boundaries, `<pre>` left alone — so a document
  hashes the same after any harmless round trip.

**Files touched.** `js/richdoc.js` (new), `js/app.js`, `index.html`
(`.hati-doc` stylesheet), `js/core.js`, `js/views/contract.js`,
`js/versioning.js`, `js/templatefields.js`, `js/views/library.js`,
`js/views/portal.js`, `js/playbook.js`, `server/server.js`.

**How it was verified.** Browser test against the real app (Chromium): a
fragment containing `<script>`, `onclick`/`onerror`/`onmouseover` handlers,
`javascript:` links, `<img>`, `<iframe>`, `<svg><script>`, `<style>`, `<form>`,
inline `style`, `id`, an unlisted `class`, `colspan`, Word `o:`/`w:` elements
and an HTML comment survives as words only. Confirmed by inserting the rendered
output into the live DOM and asserting zero `script/iframe/img/style/form`
nodes, with a page-level alarm bound to `window.__pwned` that never fired.

### 2. Sealing rich content would have broken every seal already in the system

**What was broken.** (Caught in design, before it shipped.) `verifySeal()`
computed `sha256(normText(c.execution.html))` — the *text* of the frozen
document. For a rich document that hash is blind to formatting: bolding a
liability cap, or renumbering the clauses, would leave the seal verifying. But
simply changing the computation to a formatting-aware one would have
invalidated every contract sealed before this run.

**Root cause.** The hash computation was implicit in the code rather than
recorded on the record it applied to.

**The fix.** The mode is now **version-gated on the execution record**, exactly
as `sealVersion` already gates the seal string:

| `execution.hashMode` | Hash input |
|---|---|
| absent, or `'text'` | `normText(execution.html)` — byte-identical to before this run |
| `'rich'` | `canonicalRich(execution.html)` |

`execHashInput()` in `js/core.js` is the one place that decides. `sealString()`
is untouched, so v1 and v2 seal strings keep their exact original
serialisation. `frozenDocBody()` likewise leaves a pre-rich frozen body
completely alone — its classes are not on the rich allowlist, so sanitising it
would change how an already-sealed contract looks.

**Files touched.** `js/core.js`, `js/views/contract.js`.

**How it was verified.** The test seals a contract using the *verbatim
pre-change lines* (`sha256(normText(freezeContractHtml(c)))`, no `format`, no
`hashMode`), then verifies it through the new code path: hash input unchanged,
text hash matches, seal matches, and `frozenDocBody()` returns the stored HTML
untouched. Separately, a rich contract is sealed, re-rendered, re-serialised and
still verifies — and a one-word tamper inside the frozen HTML is detected.

### 3. `canonicalRich()` hashed source indentation, so a round trip could break a seal

**What was broken.** The first implementation collapsed whitespace with a global
regex over the finished string. `<p>The <strong>X</strong></p>` and the same
document with the source indented across lines produced *different* canonical
strings, because a space between `>` and a letter was preserved while one
between `>` and `<` was not. A rich contract re-saved by an editor that
pretty-prints its output would have failed to verify against its own seal.

**Root cause.** The design note specified "trim the leading/trailing space of
every block"; the code never implemented it and papered over the gap with string
regexes.

**The fix.** `_canonWhitespace()` walks the parsed tree and collapses each text
run, then trims a space only where it sits at a **block boundary** — the start
or end of a block, or the gap between two blocks. A space between two *inline*
elements is content and is kept. `<pre>` is skipped entirely, because whitespace
there is the document. The serialiser then emits exactly what the tree holds,
with no post-hoc string mangling.

**Files touched.** `js/richdoc.js`.

**How it was verified.** Test asserts the same document indented two different
ways canonicalises identically; that `canonicalRich` round-trips through itself;
that attribute order does not affect it; and — the point of the whole exercise —
that two documents with identical *wording* but different *formatting* produce
different canonical strings while producing identical text projections.

### 4. A formatting-only edit reported "no changes"

**What was broken.** `captureVersion()` de-duplicated on the plain text alone,
and `openCompareModal()` declared two versions "identical" on the same test. Once
documents could carry formatting, bolding a clause or renumbering a schedule
would silently capture no version at all, and comparing across such an edit said
nothing had changed. For a contract system that is a false statement about the
record.

**Root cause.** Text equality was standing in for document equality.

**The fix.** Version records now carry `canon` (the canonical form) and `body`
(the raw content) alongside `text`. De-duplication requires both the text *and*
the canonical form to match. The compare modal, when the wording is identical but
the canonical form is not, reports **"Formatting changed"** and says which
aspects can differ, instead of "no changes".

**Files touched.** `js/versioning.js`.

**How it was verified.** Test bolds one word in an otherwise unchanged document:
a new version *is* captured, its `text` equals the previous version's and its
`canon` does not. A genuinely unchanged save still captures nothing.

### 5. Rich content reached three places that would have mangled or leaked it

**What was broken.** Three consumers took a document body as a raw string:

- **Placeholder substitution.** `fillTemplateBody()` did a string replace over
  the body. On rich content, a filled-in value containing `<` would have become
  markup — a corruption bug and an injection route in one.
- **The counterparty share payload.** `openShareModal()` sent `redlineText`
  without `format`, so the portal would have rendered a rich contract's markup
  to the counterparty as literal text.
- **The server's search index.** `contractSearchBody()` indexed the body
  verbatim, so a search for "strong" would have matched every bolded contract in
  the workspace.

**The fix.** `fillTemplateBody()` takes a `format` and routes rich content
through `fillRichBody()`, which substitutes on **text nodes only** via the DOM.
The share payload carries `format`. The server strips tags before indexing
(a plain strip, deliberately — the server has no DOM, and a search index is a
convenience, not evidence). The portal's redline base text and its PDF export of
working text both go through the projection / the sanitising renderer.

**Files touched.** `js/templatefields.js`, `js/core.js`, `js/views/portal.js`,
`server/server.js`.

**How it was verified.** Test fills a rich template with the value
`Coast <script>alert(1)</script> Ltd`: the surrounding `<strong>` survives, the
script tag comes back escaped as text, and an unfilled blank still renders as a
ruled gap.

### 6. Two editors would have silently destroyed a formatted document

**What was broken.** The workspace's plain-text document editor and the
Templates "Add blanks" editor both load the body into a `<textarea>`. Given rich
content, the first would have replaced a formatted contract with plain text on
save with no warning, and the second would have shown the customer their own
contract as raw HTML and destroyed it on the first keystroke.

**The fix.** The document editor now **says so before you save**: a notice
explains that this is the plain-text editor, that the formatting will be lost,
and that the clause numbers below are written out as text so the wording
survives. The conversion is recorded in the audit trail rather than happening
invisibly. "Add blanks" no longer uses a textarea for rich templates at all — it
renders the template as the document it is and makes a blank from the **live
selection**, replacing only that range, so the surrounding formatting is
untouched. A selection that spans a table row or two clauses is refused with a
reason rather than silently rewriting the document's shape. The same rule
applies to an accepted counterparty redline, which arrives as plain text: the
document's `format` is reset and the audit entry says why.

**Files touched.** `js/views/contract.js`, `js/views/library.js`,
`js/versioning.js`, `js/richdoc.js` (`unmarkPlaceholders`).

**How it was verified.** Manual walk-through in the browser plus a test that
marking and then unmarking placeholders round-trips to the identical body.

### 7. The sanitiser let anything nested inside an unwrapped wrapper through untouched

**What was broken.** `_sanitizeNode()` iterated a **snapshot** of the child list
(`Array.from(node.childNodes)`) taken before the walk. Unwrapping a
non-allowlisted element — `<div>`, `<font>`, `<section>`, `<a>` — hoists its
children into that same list, *after* the snapshot was taken, so those children
were never visited. `<font><script>…</script></font>` therefore passed straight
through the sanitiser with the script intact.

**How it was found.** Pasting real Microsoft Word clipboard HTML. Word wraps
everything in `<div class=WordSection1>`, so the entire document came back with
its `class`, `style`, `<b>` and `<i>` untouched — visibly wrong output that,
traced back, turned out to be a hole rather than a cosmetic bug.

**The fix.** The walk now uses a **live cursor** instead of a snapshot, and
`_unwrap()` returns the node the walk must resume at — the first hoisted child.
Everything that was inside an unwrapped element is now checked exactly as if it
had been there all along.

**Files touched.** `js/richdoc.js`.

**How it was verified.** A regression test that nests hostile content one level
deeper than the original test did: a `<script>` inside `<font>`, an `onclick`
plus inline `style` inside `<div><section><span>`, a `javascript:` link with an
`onerror` image inside `<article>`, and an `<iframe>` inside
`<center><marquee>`. All markup is stripped, all four pieces of text survive,
and inserting the result into the live DOM yields zero
`script/iframe/img/style/form/a` nodes.

### 8. Word's clause numbering would have been dropped on paste

**What was broken.** Word does not emit `<ol>`. It emits a run of ordinary
paragraphs carrying `mso-list:l0 level1 lfo1` in their `style`, each opening
with `<span style='mso-list:Ignore'>1.</span>` — and *that span's text is the
literal clause number*. Every naive Word-paste cleaner strips those spans as
noise. Doing so here would have turned a numbered contract into an unnumbered
one: "1. Appointment" becomes "Appointment", with nothing to reconstruct it
from. A legal document is its clause numbers.

**The fix.** `_pasteWordLists()` in the new `js/richpaste.js` groups consecutive
`mso-list` paragraphs, reads the level from `level(\d+)` and the marker from the
`mso-list:Ignore` span, and rebuilds real nested `<ol>`/`<ul>` — carrying `type`
(`1`/`a`/`A`/`i`/`I`) and `start` across, so a schedule that begins at clause 8
still begins at 8. The literal marker span is removed only *after* the list that
regenerates it exists.

Where the marker cannot be modelled as a list at all — Word's multi-level
"4.4.2" style, or anything unrecognised — the run is **left as paragraphs with
the literal number kept as text**. A numbered paragraph is a correct document; a
silently renumbered clause is not.

**Files touched.** `js/richpaste.js` (new), `js/richdoc.js` (list projection).

**How it was verified.** A test fixture of genuine Word clipboard HTML — Office
namespaces, `MsoTitle`/`MsoHeading1`/`MsoListParagraphCxSp*` classes, `<o:p>`
tags, `mso-list` metadata, a `MsoTableGrid` fee table and a two-column signature
block. The conversion produces `1.`, `2.`, `a.`, `b.`, `3.` with no duplicated
markers, keeps the table and both signature rules, flattens
`text-transform:uppercase` and `font-variant:small-caps` into real capitals, and
leaves no `style`, `class`, typeface, point size or colour behind. The
"4.4.2"-style fixture keeps its literal numbers and is *not* renumbered.

### 9. A dotted clause path was applied to lettered sub-lists

**What was broken.** `richToText()` joined every ordered-list marker into a
dotted path, so a sub-list the author had set as `(a)`, `(b)` came out as
"2.a.", "2.b.". The document on screen says "a."; the projection said something
else. Since the projection is what the diff compares, what the AI reads and what
search matches, that is a number nobody can find in the paper.

**The fix.** The dotted path is built only for **decimal** sub-lists, which is
where legal numbering actually uses it (2 → 2.1 → 2.1.3). An `a`/`A`/`i`/`I`
sub-list emits its own marker alone, exactly as the document renders it.

**Files touched.** `js/richdoc.js`.

**How it was verified.** The Word fixture's lettered sub-list projects as
"a. Save as set out in clause 4.4." while the decimal Google Docs fixture still
projects as "2.1.".

### 10. Contract text was set in the interface font, so paper and product looked identical

**What was broken.** Everything in HaTi — the nav, the register, the buttons,
the panels *and the contract itself* — was set in IBM Plex Sans. A contract is
not a screen of application chrome; it is the artefact the whole product exists
to handle, and it read as just another panel.

**The fix.** Two new tokens, `--font-doc` (Google Sans Flex) and
`--font-doc-mono` (Google Sans Code), applied through a single `.doc-surface`
class that wraps every surface rendering contract text: the workspace document
pane, the counterparty share portal, the template preview, the paste editor and
the PDF export. The application interface is untouched and stays on IBM Plex.

Both embed URLs were taken from the Google Fonts API rather than from memory,
and the axes were probed rather than assumed:

- **Google Sans Flex** is variable on `wght` 300–700 and — the useful discovery
  — carries a real **`slnt` axis, range −10..0**. The family ships **no italic
  face at all**. Setting `font-style:italic` on it would have produced a
  browser-synthesised shear, which on a contract's defined terms looks like a
  rendering fault. Emphasis instead uses
  `font-variation-settings:'slnt' -10` behind an `@supports` guard, with
  `font-style` left as the fallback. (`slnt@-15..0` is rejected by the API with
  a 400; −10 is the real limit.)
- **Google Sans Code** is variable on `wght` 300–800 with true italics, and its
  `google/fonts` metadata records `license: "OFL"`. It carries the columnar
  blocks — fee schedules drawn with rules, side-by-side signature blocks —
  where character alignment is the content.

**Files touched.** `index.html`, `js/views/contract.js`, `js/views/portal.js`,
`js/views/library.js`.

**How it was verified.** A browser test asserts the document pane resolves to
Google Sans Flex, `<pre>` to Google Sans Code, the `<body>` still to IBM Plex,
and that `<em>` computes `font-style:normal` with a `slnt` variation setting.
Because this container's browser has no outbound network, `document.fonts.check()`
returns true even when nothing loaded — so the test additionally **measures
rendered text width** against the fallback faces (Flex 746px vs IBM Plex 694px
vs generic sans 752px; Code 960px vs generic monospace 963px), which only
differs if the real font files are rendering. The real Google Fonts CSS and all
32 woff2 subsets are served locally to the test for that reason.

### 11. Document body text was under WCAG AAA, and got worse on any tinted page

**What was broken.** Contract body copy was `text-brand-800/85` — the blue-grey
`#2c455d` at 85% opacity. Measured on the `#fbfbfc` document page that is
**6.27:1**, under WCAG AAA's 7:1 for body copy. The labels beside it were worse:
`/65` measured **3.68:1** and `/60` measured **3.25:1**, both under AA's 4.5:1
for normal text. Because these are opacity modifiers rather than colours, the
same class also reads differently on every background it lands on, and the
document page is not white.

**Root cause.** Opacity was being used to express hierarchy. It expresses
hierarchy only against one specific background, and silently stops meeting any
contrast target on the others.

**The fix.** A `--color-doc-text` token (`#15181a`) and a `--color-doc-muted`
token (`#4a4f54`) — solid colours, no opacity modifiers anywhere on a document
surface. `.doc-surface` overrides the `text-brand-800/*` utilities **only inside
a document**; the identical classes elsewhere in the application are deliberately
left alone, because this is a fix to how a contract reads, not a repaint of the
product. Hierarchy is carried by size and weight instead, which is what it was
carrying anyway.

`print-color-adjust: exact` (and the `-webkit-` form) is set on the document
surface and forced on everything inside `#print-root`, because browsers and
print drivers lighten body text and drop fills by default — which would have
silently undone all of this on the one artefact that actually gets filed,
emailed and signed.

**Files touched.** `index.html`.

**How it was verified.** Measured, not judged by eye. A browser test computes
WCAG relative luminance from `getComputedStyle`, compositing any alpha over the
effective background it walks up to find. Because this environment's network
policy blocks `cdn.tailwindcss.com`, the test injects the exact declaration
Tailwind v3 emits for these utilities, derived from `brand-800` read out of
`index.html` itself, so the "before" figure measures the shipped configuration
rather than an unstyled fallback.

| Surface | Before | After |
|---|---|---|
| Document body | 6.27:1 | **17.25:1** |
| Headings (h1/h2) | 6.27:1 | **17.25:1** |
| List items, table cells, `<pre>` | 6.27:1 | **17.25:1** |
| Table header (on `#f5f5f8`) | — | **16.39:1** |
| Rubrics / labels (`/60`, `/65`) | 3.25:1 / 3.68:1 | **8.00:1** |

The test also asserts hierarchy survived — h1 and h2 remain larger than body,
and headings and `<strong>` remain at weight ≥ 600.

### 12. A template could not be changed, only deleted and re-imported

**What was broken.** A saved template was immutable apart from its blanks. When
the standard paper moved on — a new payment policy, a revised liability cap —
the only recourse was to delete the template and import it again, which lost the
blanks, the field mappings and any record that the wording had ever changed. In
practice that means people stop trusting the template and go back to emailing
a Word file around.

**The fix.** Templates are editable in place, on one screen: name, value stream,
document and blanks together. The document is edited in the same rich editor
Task 1 built, so pasting a revised contract straight out of Word over the top
works and keeps its formatting.

Every save is a **version**: `version`, `versionAt`, `versionBy`, `versionNote`
on the record, with the previous state appended to `versions[]`. History is only
ever appended to — **reverting to an earlier version copies it forward as a new
version rather than erasing anything**, so the version you reverted away from is
still there.

Blanks and body are kept in sync, and the two failure directions are treated
differently because they are not equally bad:
- a **placeholder with no blank** would print as literal `{{braces}}` in every
  contract made from the template, so saving is **blocked**;
- a **blank with no placeholder** just asks a pointless question on the fill-in
  screen, so saving warns and asks for confirmation, naming the blanks.

Removing a blank puts its **label** back into the document rather than deleting
the words, so the sentence still reads as a sentence.

**Files touched.** `js/views/library.js`.

**How it was verified.** Browser test: v1 → edit → v2 keeps v1's exact body in
`versions[0]`; revert produces v3 while `versions` still holds both 1 and 2; the
note, author and timestamp are recorded; the sync detection finds both an
orphaned placeholder and an orphaned field.

### 13. Nothing recorded which version of a template a contract came from

**What was broken.** A contract carried `templateRef` — the template's id, and
nothing else. Once templates became editable that is not enough to answer the
only question that matters: *which wording is this?* A contract created in
January and one created in June could come from the same `templateRef` and share
no clauses.

**The fix.** Contracts now carry `templateId`, `templateName` and
`templateVersion`, stamped at creation by both the single-draft and bulk paths,
and repeated in the audit entry. The workspace shows it above the document —
**"Created from Distribution Agreement v1"** — and when the template has since
been revised it says so and states plainly that this contract keeps the wording
it was created with. When the template has been deleted entirely, it says that
too. `templateRef` is kept alongside for anything already reading it.

**Files touched.** `js/views/library.js`, `js/templatefields.js`,
`js/views/contract.js`.

**How it was verified.** Test creates a contract from v1, edits the template to
v2, and asserts the existing contract's body is byte-identical, its
`templateVersion` is still 1, the workspace banner names v1 and flags that the
template is now v2 — while a contract created afterwards takes v2's wording and
gets no "revised" flag.

### 14. Deleting a template asked for confirmation without saying what it would cost

**What was broken.** The delete confirmation said "Existing contracts created
from it are not affected" — true, but it never said how many contracts that was,
or that the template's whole version history went with it.

**The fix.** `deleteTemplateGuarded()` counts the contracts created from the
template and puts that number, and the number of versions being destroyed, in
front of the decision. In server mode the client holds a working set that is
capped for very large portfolios, so when the set is truncated the count is
reported as a floor — "at least 2 contracts (200 of 5,000 loaded)" — rather than
being presented as complete. The same honest count appears on the template card
and in the editor header.

**Files touched.** `js/views/library.js`.

**How it was verified.** Test asserts the exact count when the working set is
complete, and the "at least" phrasing once `state.truncated` is set.

### 15. HaTi's own twelve templates could not be adapted at all

**What was broken.** The built-in templates are **generators** — rendered from
code in `docBody()`, not stored as text — so there was no body to edit. A
customer who wanted HaTi's Raw Material Supply Agreement with two clauses
changed had no route at all.

**The fix.** "Duplicate & edit" on every built-in card. It renders the generator
once, converts each fill-in `<input>` back into the `{{blank}}` it stands for,
sanitises the result into a rich body, and carries the built-in's own field
schema (including the `maps` values that feed the register) onto the new
template. The result is an ordinary editable template that opens straight into
the editor. The built-in itself is untouched, and the copy records
`source:'builtin:RM'`.

**Files touched.** `js/views/library.js`.

**How it was verified.** Test duplicates `RM`, asserts the copy is rich, that
every field it carries has a matching placeholder in the body, that the
counterparty mapping survived, that no `<input>` leaked into the body, that the
text projection still reads as the agreement — and that `TEMPLATES.RM` itself is
unchanged. A contract built from the copy arrives fully populated with no
placeholders left.

### 16. A contract created from a custom template could not be shared at all

**What was broken.** The counterparty share portal decided whether a payload
held a real document with:

```js
const validDoc = p && p.kind==='hati-share' && p.contract &&
  (p.contract.source==='upload' || TEMPLATES[p.contract.template]);
```

A contract generated from a *custom* template has `source:'template'` and
`template:null`, so both arms are false. The counterparty was shown
**"Invalid share link — this link is malformed or truncated. Ask the sender to
generate a fresh one."** The link was neither malformed nor truncated; the
document was there and rendered perfectly once past the check.

This predates this run, but it sits directly across the route the whole brief
builds: paste your standard paper in, generate a draft from it, and then be
unable to send it to the other side. It was found by writing an end-to-end
portal test for the rich pipeline rather than by testing the sanitiser in
isolation.

**Root cause.** The check asked "can I identify where this document came from?"
when the question it needed to answer was "is there a document to render?"
A contract carrying its own body in `redlineText` — which is how every
custom-template and every edited contract carries its wording — needs no
template lookup at all: `docBody()` routes it straight to `redlineDocBody()`.

**The fix.** The condition now admits the third case explicitly:

```js
const validDoc = p && p.kind==='hati-share' && p.contract &&
  (p.contract.source==='upload' || !!p.contract.redlineText || !!TEMPLATES[p.contract.template]);
```

**Files touched.** `js/views/portal.js`.

**How it was verified.** A portal test renders a share payload for a
custom-template contract whose stored body carries formatting *and* a hostile
payload (`onclick`, `<script>`, `<img onerror>`), with `window.__pwned` bound as
a page-level alarm. The portal now renders the document, keeps its heading and
its numbered clauses, applies the document face — and the document region
contains zero `script/iframe/img/style/form/a/input/button` nodes and no event
handlers. The alarm never fired.

### 17. Legal could edit a template in the UI and the save silently failed on the server

**What was broken.** Custom templates live in the settings blob, and
`saveCustomTemplates()` persisted them through `saveSettings()` — which in
server mode is `PUT /api/settings`, guarded by the `admin` middleware:

```js
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};
```

But template management is `tplCanManage()`, which is `canEdit()` — **Admin and
Legal**. So a Legal user could open the template editor, make the change, press
Save, watch the modal close and the toast say the template was saved, and get a
second toast saying "Settings save failed: Admin access required" — with the
change gone. In static mode it worked, which is exactly the kind of split that
survives a long time unnoticed.

This predates this run (it applied to "Add blanks" and "Upload a template" too),
but Task 4 turns Legal into the primary user of the feature, so it had to be
fixed here.

**Root cause.** Two different authorities for the same action: the client's
`canEdit()` and the server's admin-only settings endpoint. The template data
happened to live behind the wrong door.

**The fix.** A dedicated `PUT /api/settings/templates`, guarded by a
`templateManager` middleware that admits admin **and** legal, and which writes
**only** the `customTemplates` key — merging it into the existing settings
rather than replacing them, so the endpoint cannot be used to reach the approval
threshold, the AI configuration or anything else in the blob. The client's
`saveCustomTemplates()` uses it in API mode and falls back to `saveSettings()`
in static mode.

**Files touched.** `server/server.js`, `js/views/library.js`.

**How it was verified.** Against a real server instance, not a mock: set up a
workspace, create a Legal user, and check that Legal gets **200** on
`PUT /api/settings/templates` and **403** on `PUT /api/settings`; that a
non-array payload is rejected with **400**; that both templates come back from
`/api/bootstrap`; and — the containment check — that the approval configuration
an admin set beforehand is byte-identical afterwards, so the narrow endpoint did
not become a wide one.

### 18. Ten native browser dialogs, in the flows this run added

**What was broken.** The template flows used `window.confirm()` and
`window.prompt()` — ten of them. In a deployed browser those render as a
**Chrome popup**: the origin banner ("hati-clm.onrender.com says"), the browser's
own typeface, OK/Cancel, and a checkbox offering to suppress all further dialogs
from the page. Reported from the live site, and correctly: it does not look like
part of the product, and it undermines the thing a contract tool most needs to
project.

It is also worse than cosmetic. `confirm()` and `prompt()` **block the main
thread**, they cannot be styled, their buttons are always "OK" and "Cancel"
rather than saying what will happen, and once a user ticks "prevent this page
from creating additional dialogs" every subsequent confirmation is silently
auto-dismissed — turning a destructive-action guard into no guard at all.

Six of the ten were added by this run; four (`openBlanksEditor`'s marker
conversion, its discard guard, and the two "name this blank" prompts) predate
it. The codebase already had a branded `confirmDialog()` — the delete guard uses
it — so the inconsistency was visible from inside the same file.

**The fix.** All ten replaced. `confirmDialog()` already existed; this adds
`promptDialog()` alongside it in `js/core.js`, following the same contract:
appended to `<body>` at a z-index above `#modal-root` so it stacks over an open
modal rather than clobbering it, Escape cancels, Enter accepts, and it resolves
`null` for cancel so an empty answer is still distinguishable from no answer.
Its `keydown` listener is registered in the **capture phase**, because the modal
underneath may also be listening for Escape.

Replacing the dialogs also let each one say what it is actually asking. The
detected-blanks prompt now names the blanks it found rather than only counting
them, explains that converting means the answers are filed as contract data, and
labels its buttons "Convert them" / "Not now". The discard guards name the
version the template stays at. The unused-blanks warning offers "Save anyway" /
"Go back and fix it" instead of OK/Cancel.

**One real bug this surfaced.** "Make selection a blank" captured the user's
selection with `Selection.getRangeAt(0)`, which returns the selection's **live**
range — and the very next thing it does is open a dialog to name the blank,
which takes focus and collapses the selection, taking the range's boundaries
with it. The native `prompt()` had the same hazard; it was simply never
exercised by a test. `_richSelection()` now returns `r.cloneRange()`.

**Files touched.** `js/core.js` (new `promptDialog`), `js/views/library.js`
(ten call sites, seven handlers made `async`, the range clone).

**How it was verified.** A browser test that drives the flows for real — select
text in the contenteditable, click "Make selection a blank", type the name,
confirm — and **fails if any native dialog fires**, via a Playwright `dialog`
listener that records every one. It asserts the prompt is pre-filled from the
selection, that the blank is actually inserted (which is what proves the cloned
range survived the focus change), that Escape cancels without changing the
document or closing the modal underneath, that "Keep editing" leaves the editor
open, and that the detected-blanks dialog names the blanks it found. Result:
17 checks pass, **zero native dialogs**.

### 19. Every PDF was extracted with guessed glyph widths, so words came apart

**What was broken.** Uploading a PDF produced text like:

```
M A STER R AW M A TERIA LS PRO C U REM EN T A G REEM EN T
TH IS M A STER R AW M A TERIA LS PRO C U REM EN T A G REEM EN T ( t h e "A g re e m e n t ")
is e n te re d in to a so f [ Eff e c t iv e D a t e]
```

Reported from the live site as "the contract looks terrible", and it is worse
than it looks: this text is what the AI clause review reads, what the search
index holds, what a template made from an uploaded PDF is built out of, and what
the migration's metadata extraction runs on. Garbled text degrades all of them
silently.

**Root cause — three defects compounding, in `js/views/contract.js`.**

1. **The extractor never read the widths the PDF ships.** `pdfPageFonts()`
   parsed `/Subtype` and `/ToUnicode` and nothing else, so every glyph advance
   came from `pdfEstWidth()` — a hardcoded table guessing 0.63 em for any
   capital, 0.50 em for any lowercase. Real Helvetica caps run 0.67–0.94 em.
   Producers that position each glyph individually (Chromium's PDF writer does
   exactly this for justified text, and it is what produced the report) leave
   the extractor comparing each glyph's true x against a running estimate that
   drifts. Once the drift passed the word-gap threshold, a space was inserted —
   mid-word, every few characters.

2. **`pdfArray()` stopped at the first `]`.** It matched `/\[([\s\S]*?)\]/`,
   non-greedy. A CID font's width array nests groups inside it:
   `/W [0 [778] 20 21 500 36 38 722 …]`. The non-greedy match returned
   `0 [778`, so one font in the sample got **no** widths at all and the other
   got **779 entries all equal to zero** — the truncated leftovers re-parsed as
   `cFirst cLast w` ranges with `w = 0`. This defect was introduced while fixing
   (1) and caught before shipping, by dumping the parsed font tables rather than
   trusting the output.

3. **The word-gap threshold was a constant.** The layout pass split a line
   wherever `x - endX > size * 0.30`, and `TJ` inserted a space on any kern more
   negative than a flat `-250`. Neither can be right across typefaces and point
   sizes: whether a gap is a word break depends on how wide *that font's* space
   actually is.

**The fix.**

- `pdfFontWidths()` reads the real advances: `/Widths` + `/FirstChar` for simple
  fonts (with `/MissingWidth` from the descriptor), and `/W` + `/DW` off the
  descendant for CID fonts, handling both `c [w…]` and `cFirst cLast w` forms.
- `pdfArray()` now matches brackets **by depth**, and `pdfKeyIndex()` matches a
  key as a whole name token, so `/W` no longer matches inside `/Widths` or
  `/WinAnsiEncoding`.
- `decode()` returns the character **codes** alongside the text, because widths
  are indexed by code, not by the decoded character; a code whose glyph maps to
  nothing still advances the pen, so the two are allowed to differ in length.
- `pdfRunWidth()` sums real widths and falls back to the old estimate only for
  codes the font did not declare.
- The gap rules are now relative to the font's own space advance
  (`font.spaceEm`, from the width table), and `TJ` folds its kern displacement
  into the run's advance instead of discarding it.
- A gap several spaces wide is treated as **column structure**, not a word
  break, and is emitted proportionally — so a side-by-side signature block and
  a fee table's columns survive into the text, where `documentTextHtml()`'s
  ruled-block detection keeps them aligned.

**Files touched.** `js/views/contract.js`.

**How it was verified.** Against PDFs **Chromium itself produced** — real
embedded subset CID fonts with `/W` arrays, real per-glyph positioning — not
only hand-built fixtures. Reproducing the report took one justified,
letter-spaced contract page; the extractor returned the user's exact garbling,
character for character, before the fix. The suite covers justified body text,
numbered clauses with bold runs, a bordered fee table, 7.5 pt type (where drift
bites hardest), and a two-column signature block, plus hand-built PDFs for
per-glyph kerning, heavy tracking, word gaps expressed as kerns, and a font with
**no** `/Widths` at all. The central assertion is that no word is split — no
isolated single letter survives anywhere in the output. All five bundled sample
contracts are checked for regression, and the scanned fixture is asserted to
still yield almost nothing, so it still routes to OCR.

Before → after on the reported document:

```
M A STER R AW M A TERIA LS PRO C U REM EN T A G REEM EN T
  →  MASTER RAW MATERIALS PROCUREMENT AGREEMENT

TH IS ... is e n te re d in to a so f
  →  THIS MASTER RAW MATERIALS PROCUREMENT AGREEMENT (the "Agreement") is entered into as of 1 August 2026

APEX LOGISTICS ... LTD SAVANNAH CONSUMER GOODS LIMITED
  →  ____________________                        ____________________
     APEX LOGISTICS & WAREHOUSING KENYA LTD      SAVANNAH CONSUMER GOODS LIMITED
```

### 20. An uploaded PDF arrived as a wall of flat text next to a pasted one

**What was broken.** Side by side, the same contract brought in two ways looked
like two different products. Pasted: a centred title, bold party names, a real
numbered list of the parties, section headings, italic standards references.
Uploaded as a PDF: every line the same size, the same weight, the same left
margin — an undifferentiated wall of text. The words were right (entry 19 fixed
that); the *document* was gone.

**Root cause.** `extractPdfText()` returned a string, and the ingestion paths
saved that string as a plain-text template. Everything the PDF stated about the
document's shape — the point size of each run, its weight, its slant, its exact
position on the page — was read, used to place spaces, and then discarded. Even
the weight and slant were never read at all: `pdfPageFonts()` parsed `/Subtype`
and `/ToUnicode` and stopped.

The product copy at the time said a PDF "carries no reliable structure to
recover". That is not true, and saying it let the gap stand.

**The fix.** A new module, `js/pdfrich.js`, reconstructs the document:

| Evidence in the PDF | Recovered as |
|---|---|
| a larger, bolder, shorter or centred line | `<h1>`–`<h4>`, levels assigned by size rank |
| a run set in a bold or italic face | `<strong>` / `<em>` |
| a line opening `1.` `(b)` `iv.` `•` | `<ol>` / `<ul>` with `type` and `start` |
| a left edge indented past the body margin | list nesting depth |
| consecutive lines a normal line-height apart | one paragraph, wrapped lines rejoined |
| a run of rules, or columns held apart by wide gaps | `<pre>`, alignment intact |

Supporting changes in `js/views/contract.js`: `pdfFontStyle()` reads weight and
slant from the BaseFont name, the descriptor's `/Flags` bits, `/ItalicAngle` and
`/StemV`, in that order of trust; runs carry `bold`/`italic`; and
`pdfRunsToLines()` was factored out of `pdfRunsToText()` so the plain and rich
paths can never disagree about where a line begins.

Three judgements are worth stating, because each protects something:

- **A dotted clause number is never turned into a list.** `11.2`, `4.4.2` stay
  paragraphs with their number as literal text, because an `<ol>` regenerates
  its own numbering and would renumber clause 11.2 as "1." — silently breaking
  every cross-reference in the contract. Simple markers an `<ol>` *can* redraw
  (`1. 2. 3.`, `a. b.`) become real lists. This is the same rule the Word paste
  converter already applies, for the same reason.
- **A numbered line is a heading only if it looks like one** — short, not a
  sentence, and bold or larger or capitalised. Otherwise it is a clause and
  stays a list item, because a clause wrongly promoted to a heading loses its
  number.
- **The plain text is the floor.** `extractDocRich()` compares the
  reconstruction's text projection against the plain extraction and discards the
  reconstruction if it lost more than 10% of the characters. A scan routed
  through OCR is always plain text, because OCR returns words with no type
  information to reason about.

**Also fixed, found while building this.**

- `pdfTextRuns()` reported the text-matrix scale as the "size", ignoring `Tf`
  entirely. A producer may set `Tf 20` and leave `Tm` unscaled (Chromium does)
  or set `Tf 1` and bake the size into `Tm`; only the product of the two is the
  size of anything. Every size-based judgement — line tolerance, paragraph gaps,
  heading detection — was being made on a number that was not a point size.
- `sanitizeRich()` left a list nested **directly** inside a list, with no `<li>`
  between them. That is legal to write and impossible to read: `richToText()`
  walks a list's `<li>` children, so the inner list and everything in it was
  skipped in silence. Content disappearing from the text projection is the worst
  class of bug in this codebase — the projection is what the diff compares, the
  AI reads, search matches and the seal hashes. Stray inner lists are now moved
  inside the preceding item.

**Files touched.** `js/pdfrich.js` (new), `js/views/contract.js`,
`js/richdoc.js`, `js/views/library.js`, `js/app.js`.

**How it was verified.** By measuring the actual goal rather than asserting it.
One source contract is printed to a real PDF by Chromium and also captured as
clipboard HTML; the PDF goes through the upload route, the clipboard through the
paste route, and the two results are compared. They now come out **structurally
identical** — `{headings:4, lists:1, items:2, paragraphs:4, bold:4, italic:1}`
from both — carrying the same words to within 3%. Individually asserted: the
title is an `<h1>`, all three sections are headings, the two parties are `<li>`
of one `<ol>`, the bold party names and the italic standard survive, and a
paragraph split across four printed lines is rejoined into one sentence.

### 21. An inserted clause vanished into the document with no trace of where it went

**What was broken.** "Insert clause" appended the clause's wording to the end of
the working text and said nothing else. No heading, no label, no marker — the
new wording simply became the last paragraph, glued on after whatever happened
to be there. The toast said "Preferred wording added as a redline"; the audit
entry said the same. Neither said *where*.

In a contract that is not a small thing. You cannot review, negotiate or seal
wording you cannot find, and on a document of any length the reader had no way
to tell which paragraph had just appeared — or, later, which paragraphs had come
from the clause library at all.

**The fix.** Every insertion now lands as a **named section** and leaves a trail:

- **In the document:** the clause is preceded by its own heading — `<h3>Payment
  within 30 days</h3>` in a formatted document, the name in capitals on its own
  line in a plain-text one. It reads as a clause instead of an orphan paragraph.
- **On the record:** `c.clauseInserts[]` keeps the name, where it went, who
  inserted it and when.
- **In the workspace:** the Playbook review card lists every inserted clause
  with that detail and a **"Show me"** button that scrolls the document to it
  and flashes it.
- **Immediately:** inserting scrolls to the clause and flashes it straight away,
  so the first thing you see after pressing Insert is the clause in its new
  home. The toast names the clause and says where it went.
- **In the audit trail:** "Inserted preferred wording (Payment within 30 days)
  as a redline — appended to the end of the document, as a new section titled
  'Payment within 30 days'" — specific rather than merely true.

`jumpToInsertedClause()` matches the **last** heading carrying the clause name,
because a clause can be inserted more than once and the most recent one is the
one being asked about. When the document has since been edited and no match
exists it falls back to the end of the document and says so, rather than
silently doing nothing.

The clause still goes to the end, and that is deliberate: it is the one position
that cannot disrupt the existing clause numbering. What changed is that the
document, the record and the interface all now say so.

**Files touched.** `js/playbook.js`, `index.html` (the flash).

**How it was verified.** A browser test drives the real flow on both a formatted
and a plain-text contract: the clause arrives under its own heading with the
heading before the body, the existing document is untouched, the insertion is
recorded with the right name/where/who, the audit entry names the position and
the section title, a version is captured, the card lists both insertions with
jump buttons, and pressing "Show me" flashes the correct heading (asserted by
matching the flashed element's text and its computed animation).

### 22. "Insert clause" appeared twice

**What was broken.** The Draft & Review pane carried an **Insert clause** button
inside the Playbook review card *and* a separate full-width "Insert clause" card
listing the whole library beneath it. Two controls, same action, one directly
under the other.

**The fix.** The standalone card is removed — `renderInsertClauseSection()`, its
`#insert-clause-section` host and its call site. The button in the Playbook
review card stays and opens the clause picker, which shows the same library with
a preview of each clause's wording, which the removed card did not.

**Files touched.** `js/playbook.js`, `js/views/contract.js`.

**How it was verified.** The test asserts exactly one control matching "Insert
clause" in the rendered workspace, and that `renderInsertClauseSection` no longer
exists at all.

### 23. "Show me" highlighted the whole contract instead of the clause

**What was broken.** On a contract built from one of the standard templates,
pressing **Show me** lit up the entire document rather than the clause. The
right clause was scrolled to, but everything around it was highlighted too, so
the control answered "where is it?" with "somewhere on this page".

**Root cause.** The jump looked for *the smallest element containing the clause
name* and highlighted that:

```js
const blocks=Array.from(canvas.querySelectorAll('div,p'))
  .filter(el=>!el.children.length && (el.textContent||'').includes(name.toUpperCase()));
```

That works for a formatted document, where each clause is its own block. It does
not work for a plain-text one — and a contract generated from a built-in
template *is* plain text once it carries working text. `documentTextHtml()`
renders the whole body as a single `white-space:pre-wrap` block, so the smallest
element containing the clause is the entire contract. **Measured on the reported
document: 78% of it.**

The clause simply is not an element there, so no element selector can ever be
right. It has to be found as a range of text.

**The fix.** `jumpToInsertedClause()` now takes two paths:

- **Formatted:** the `<h3>` we wrote, plus the blocks after it up to the next
  heading of the same or higher rank — so the whole clause lights up, heading
  and body, and the next clause does not.
- **Plain text:** locate the clause's characters (from its name to the blank
  line before the next heading-like line, or the end), map those offsets onto a
  DOM `Range`, and wrap just that range in a temporary span for the duration of
  the flash. The wrapper is removed afterwards and the container re-normalised,
  so the document is left byte-identical — the highlight never becomes part of
  the contract.

Each jump clears any previous highlight first, so pressing **Show me** on a
second clause does not leave the first one lit.

The flash style gained `box-decoration-break: clone`, because a plain-text
clause spans several wrapped lines as an inline span; without it the highlight
draws as one box stretched around the block instead of following the text.

**Files touched.** `js/playbook.js`, `index.html`.

**How it was verified.** A test reproducing the reported setup exactly — a
contract from a built-in template, plain-text body, three clauses inserted —
which **reimplements the old selector alongside the new one and measures both**:

```
scope of the highlight for one clause, in a 1,809-character contract:
  before: 1,407 chars (78% of the document)
  after :   165 chars ( 9% of the document)
```

It also asserts the highlight contains the clause heading *and* its wording,
stops before the next inserted clause, does not reach the original clauses,
does not catch the document's own "4. Governing Law" when asked for the
inserted "Kenyan governing law & forum", leaves exactly one highlight after a
second jump, and restores the document's text length exactly once the flash
ends. The formatted path is asserted to cover heading plus body and nothing
else.

### 24. The same template behaved differently depending on where you started

**What was broken.** Creating a contract from one of the twelve built-in
templates did two different things depending on the route:

- **Templates page → Use template** opened the guided fill: counterparty, value,
  start and expiry dates, payment terms, and the template's own distinctive
  field. Fill it in, press **Create draft**.
- **+ New contract → (a template)** created the draft immediately. No questions.
  Every one of those fields blank.

Same action, same template, two experiences — and the faster-looking route was
the worse one. The fields it skipped are not decoration: `applyTemplateValues()`
writes each answer onto the contract **and** into `c.metadata`, which is what
populates the register row, the filters, folder routing and the reports. A
contract created from the menu arrived with none of that, so it looked complete
in the workspace while being invisible to every view that reads structured data
— until someone noticed and re-keyed it by hand.

**Root cause.** Two functions for one job. The Templates page called
`openWizard(tid)`; the menu called `createFromTemplate(tid)`, an older path that
predates the guided fill and was never retired when the wizard arrived.

**The fix.** The menu's template entries now call `openWizard(tid)` — the same
function, pre-selected on the same template, so both routes land on a
byte-identical screen. The section heading above them changed from *"Or generate
directly"* to *"HaTi standard templates"*, because generating directly is no
longer what it does and a label that lies about the next screen is its own small
defect.

Custom templates were already consistent: both routes went through
`createFromCustomTemplate()`, which opens the fill modal whenever the template
has blanks. Only the built-ins diverged.

`createFromTemplate()` is kept — it is window-exported and produces a valid
draft — but is no longer reachable from the interface, and now says so in a
comment so the next reader does not wire it back up.

**Files touched.** `js/app.js`.

**How it was verified.** A test drives **both** routes and compares them: the
same template opened from the Templates page and from the menu produces the same
field ids and the same rendered text, character for character. It then fills the
menu route in and asserts the resulting draft carries the counterparty, the
value, the metadata and a "Guided creation" audit entry — and, for contrast,
that the old path leaves all three empty, which is the defect that was being
reported.

---

## Run: Visibility & Permissions Hardening

Seven fixes, F1–F7, in the order the brief set. All seven were completed. Every
entry below names the file, the symptom, and the decision — including the
things deliberately not done and why.

### F1-1. Folder access was a browser convenience, not a permission

**What was broken.** `state.settings.folderAccess` — the per-member map of which
value streams they may see — was read in exactly one place: `regFiltered()` in
`js/views/register.js`, to filter the register's rows and the folder dropdown.
The server never read it at all. Every API route returned the whole portfolio.

A member restricted to Procurement could therefore see every contract in the
workspace by opening the network tab, calling `/api/contracts` directly, running
a search, reading `/api/stats`, or exporting. The restriction was a UI
convention that the product presented to admins as an access control.

**Root cause.** `folderAccess` was introduced as a client-side filing
convenience and was never promoted to an enforcement point. `server/server.js`
had no concept of it.

**The fix.** `folderScopeFor(user)` resolves the caller's scope from settings on
every request; `scopeFrag()` / `scopeFragNamed()` build the `folder IN (…)`
fragment; `inScope()` / `idInScope()` / `idsInScope()` answer the per-record
question. Applied to the contract list and single GET, PUT and DELETE, search
(both the FTS branch and the LIKE fallback), `/api/stats`, `/api/analytics`,
`/api/activity`, `/api/shares/overview`, `/api/shares/pending`, the per-contract
shares and engagement panels, `POST /api/shares`, share revoke/resend,
`/distribute`, `/notify-signer`, and the workspace ZIP export.

The client-side dropdown filtering stays exactly as it was — it is now a
convenience on top of an enforced rule rather than the rule itself.

**Deliberate decision: 404, not 403.** A request for a contract outside the
caller's scope returns 404 with "Contract not found". A 403 would confirm that
the id exists, which is precisely what someone probing ids wants to learn.

**Deliberate decision: a contract cannot be filed into an invisible stream.**
`PUT /api/contracts/:id` refuses (403) a save that sets `folder` to a stream the
caller cannot see. Without that check, a restricted member could make a record
disappear from their own view — and from any audit they could run — in one
request.

### F1-2. The AI endpoints let the browser choose what the model read

**What was broken.** `/api/ai/graph`, `/api/ai/search` and `/api/ai/template`
build their prompt from a `contracts` / `candidates` array **posted by the
browser**. The graph endpoint accepted up to `aiMaxContracts` (default 400)
portfolio-wide contracts and packed them into the prompt regardless of who was
asking. A restricted member's own client would not send folder-B contracts —
but nothing stopped a crafted request, and nothing stopped the server from
answering questions about contracts the caller could not open.

**The fix.** `scopeAiPortfolio` middleware, running after `capAiInput` on all
three routes: every entry's id is checked against the caller's folder scope and
dropped if it fails, `activeIds` is narrowed the same way, and every monetary
field is stripped for a caller without `can_view_values`. An entry with **no
id** is dropped too — it cannot be shown to be in scope, so it is not trusted.

**Deliberate decision: the drop count is not reported per-contract.**
`req.aiDropped` counts what was removed but nothing about the dropped rows
travels back. "4 contracts were withheld" is a smaller leak than naming them,
but it is still a leak.

### F1-3. Copilot's tool loop queried the whole workspace

**What was broken.** `/api/ai/chat` runs a server-side tool loop —
`search_contracts`, `get_contract`, `list_portfolio`, `compare_contracts` — each
scoped to `org_id` only. Its system prompt also opened with a live workspace
summary ("WORKSPACE: 30 contracts (Signed: 12, …). Value-stream folders: …"),
which disclosed the size and shape of the whole portfolio before the user had
asked anything.

**The fix.** A `copilotCtx(req)` object carries `{org, scope, money}` into every
tool. `copilotGetJson` returns null for an out-of-scope id, so `get_contract`
reports "not found" exactly as it would for a contract that does not exist;
`copilotSearch` re-checks the folder on the join back to `contracts`;
`copilotList` filters in SQL; `buildCopilotSystem` counts and lists folders over
the caller's scope. `normalizeDeliver` re-checks every cited id before it is
echoed to the browser.

### F1-4. There was no server-side register export to point an auditor at

**What was broken (as designed).** All CSV export was browser-side, built from
`state.contracts`. That set is now scoped and masked at source, so the browser's
exports are correct — but there was no server response to assert against, and
"the file the customer walks away with" had no server-side boundary.

**The fix.** Added `GET /api/export/contracts.csv`: folder-scoped, value-masked,
narrowable by `folder` and `status` (neither of which can widen it). The
browser's selection-based exports are unchanged; they operate on rows the server
already bounded.

### F2-1. Contract values were visible to every role, everywhere

**What was broken.** There was no such thing as a member who could work with a
contract without seeing its price. `value` shipped on every list row and every
full record; `/api/stats` returned `totalValue`; `/api/analytics` returned
per-status, per-folder and per-counterparty totals plus a 12-month renewal
pipeline in shillings; the CSV carried it; every AI prompt carried it.

**The fix.** `can_view_values`, an additive column on `users` defaulting to `1`.
`maskContractValues()` strips `value`, `valueType`, money-mapped template blanks
(`c.fields`), extracted `metadata.value` / `metadata.currency`, and a
counterparty's `rounds[].proposedValue`. Aggregates are dropped from
`/api/stats` and `/api/analytics`; the pipeline still ships `pipelineCount` so
the shape of the renewal year survives. CSV emits the Value column **empty
rather than absent**, so a spreadsheet built against the export keeps its column
positions.

**Storage decision** (also in SUMMARY.md): a column on `users`, not a map in
`appSettings`. It is a right rather than a preference; `req.user` is already
loaded by the `auth` middleware so resolving it costs no extra query; and
`appSettings` is echoed wholesale to every browser in `/api/bootstrap`, which is
the wrong place for an access-control table to live even when its contents are
not secret. `folderAccess` stays where it is because moving it would be a
breaking change to data that already exists in customer databases.

### F2-2. A masked record saved back would have destroyed the stored value

**What was nearly broken.** This one was introduced by F2 and caught before it
shipped. A member without the right receives a contract with no `value`. The
client saves the whole record back on any edit. Without a guard, their first
edit to a counterparty name would have written `value: undefined` over a real
figure — silent, permanent data loss on exactly the records they are least
qualified to notice.

**The fix.** `PUT /api/contracts/:id` restores every monetary field from the
stored record before the write, for any caller without the right. This is the
same reasoning as the existing append-only audit-trail guard directly below it
in the same handler, and the comment says so.

### F2-3. Search snippets quoted the money field verbatim

**What was broken.** `contractSearchBody()` concatenates `Object.values(c.fields)`
into the FTS `body` column, so a `snippet()` around a match could contain the
contract's value as printed text. Masking the record did nothing about it.

**Decision.** Two options: take money out of the search index, or withhold
snippets. Taking it out of the index would stop an admin finding a contract by
its amount, which is a real capability and a real loss. Snippets are withheld
instead, for callers without the right only, and the response carries
`snippets:false` so the client can say so rather than render a row that looks
broken. Hit names and counterparties still come through, which is what
navigating a result list actually needs.

### F3-1. Financial KPI cards would have rendered as "KES 0"

**What was broken.** With F2 stripping values, `renderDashboard()`'s
`active_value` card, the KES exposure deltas on the expiring cards, the stage
cards' totals and the renewal-pipeline bars would all have computed from absent
values and rendered confident zeroes. A wrong number is worse than a hidden one.

**The fix.** The money cards are removed from the KPI catalog entirely — the
ribbon **and** the Customize popover — for members without the right. The
expiring cards keep their place and say "soonest in 41d" instead of an exposure
figure. Stage cards count contracts. The pipeline is drawn from contract counts.

**Deliberate decision: absent, not greyed out.** The brief called for this and
it is right: an option in a settings list that cannot be switched on is a worse
experience than an option that is not offered.

### F4-1. "Approvals waiting" was the whole workspace's queue, with amounts

**What was broken.** The Home panel listed the five contracts that had sat in
review longest across the entire workspace, each labelled "CFO sign-off" or
"Legal review" (derived from the value threshold) with the amount in brackets.
Most rows were nothing to do with the person reading them.

**The fix.** The panel now lists only contracts with an incomplete approval
chain where the reader is an eligible approver on a pending step, or which they
raised themselves (matched from the audit trail's Created entry). Amounts render
only with `can_view_values`, and the approval **step name** is replaced by a
generic label for those members — rule names are generated from their condition
("Value ≥ KES 5M") and would otherwise hand over the spend threshold.

**Deliberate deviation: this filtering is client-side.** The brief asked for it
server-side in server mode. There is no server-side assembly point for this
queue: the approval rule engine lives in `js/approvals.js` and evaluates
conditions (`deviation`, `foreignLaw`) that depend on client-held scan and
playbook state, and `kind` conditions that depend on the client's `TEMPLATES`
table. Porting it would duplicate the engine across two languages of the same
codebase and invite the two copies to diverge — at which point the server's
answer and the sign-panel's answer disagree about who may approve, which is a
worse defect than the one being fixed. The underlying contract list is already
folder-scoped by the server (F1), so this is a narrowing of data the reader is
entitled to see, not a confidentiality boundary resting on the browser.

### F5-1. The signer's IP address was printed on the face of the document

**What was broken.** `signatureBlock()` in `js/views/contract.js` rendered
`IP 41.90.x.x` in the sub-line under each signer's name on every executed
contract. That is on the document face: every reader, every exported PDF, every
screenshot and every forwarded copy carried a signer's network address.

**The fix.** The visible block keeps name, signature form/method and timestamp.
IP and user-agent appear only in the audit trail (a new provenance suffix on the
signature entry, naming the address and the device family) and in the evidence
pack, which already emitted both. The PDF export prints the audit trail, so the
signing certificate keeps the record.

**Sealing untouched.** `sealString()`, `execHashInput()` and everything under
`execution.hashMode` were not modified. This is a display change to a field that
was never part of the hashed content, so every contract sealed before this
session verifies against exactly the hash it was given.

### F5-2. The counterparty's device was never recorded against their signature

**What was broken (found while doing F5).** `POST /api/shares/:token/respond`
stamped `r.ip` onto a counterparty's signature but not their user-agent — that
was only captured on the `engagement` row for the share open. So the evidence
pack could name the device for an internal signer and not for the counterparty,
which is the signature that matters most.

**The fix.** The respond handler now stamps `r.ua` as well, and
`applyResponse()` stores it on the signature. Capture increased; disclosure on
the document face decreased.

### F6-1. The public advice page published how busy the firm was

**What was broken.** `GET /api/advice/rates` is unauthenticated — it is the
public intake page's rate card and the portal's server-mode probe — and it
returned `queue: { active: N }`, the live count of open advice requests. The
intake page printed it: "4 requests are currently in the pipeline". That is an
operational fact about the firm (how much work it has, how fast it is clearing
it, whether it just lost a client) handed to anyone who could load the URL,
including competitors.

**The fix.** The count is gone from the **response body**, not just the page.
The queue depth stays server-side and is folded into what the visitor actually
needs: `eta[service][urgency]`, an absolute date computed in the same place and
the same way `POST /api/advice/requests` computes the quoted date, so the page
and the promise cannot drift. The internal Advice Desk board is untouched.

**Residual, accepted, documented.** A submitted request's own quote still
carries `days` (base turnaround **plus** the queue-load adjustment), so a
customer who submits a request can infer the load band (0–5 days ⇒ 0–15+ active
requests). That is the same information as the ETA date the brief explicitly
asked to keep, and it is the turnaround actually promised to that customer for
their own request, delivered only behind their tracking token. Removing it would
remove a commitment the customer is entitled to.

### F7-1. The share payload published the contract's internal filing location

**What was broken.** `payloadObj` in `js/core.js` carried `contract.folder` —
which internal value stream the contract is filed under — to the counterparty.
`js/views/portal.js` has never rendered it; it derives one from the template and
falls back to `'corp'`.

**The fix.** `folder` removed. Every remaining field is documented at the
payload with the reason it is there, so a future addition has to be argued for.
The uploaded document is trimmed to `{fileName, size, mime, fileHash, dataUrl,
extractedText}` — the near-duplicate signals (`textFingerprint`, `simhash`), the
OCR page bookkeeping and the internal `fileId` are portfolio-analysis data with
no meaning to a counterparty.

**Kept deliberately:** `value` and `valueType` (the portal's "propose a
different value" field and the signing certificate row both need them),
`format` (without it a rich document renders as literal markup), `fields` and
`template` (a built-in template is re-rendered from them), `docHash` (echoed in
the response so the owner can tell the document changed after the link was
made).

### F7-2. Static-mode sharing looked like real sharing

**What was broken.** In static mode the entire document travels inside the URL
fragment. That link never expires, cannot be revoked, and generates no record
of who opened it — and the share dialog said none of this. It offered the same
Email / WhatsApp / Copy-link tabs as server mode.

**The fix.** A warning block above the channel tabs, shown only when there is no
server, stating plainly that the whole document is in the link, that the link
never expires and cannot be revoked, that anyone forwarded it can read the
contract with no record that they did, and that this is for demonstrations only.

---

## Deliberately not done, and why

### The mobile / WhatsApp counterparty portal

Out of scope by the brief's firm product boundary. Not built, not extended, not
refactored toward. The existing WhatsApp share channel (a `wa.me` deep link that
prefills the sender's own WhatsApp with the portal URL) was left exactly as it
was.

### Redacting monetary amounts from contract body text

`can_view_values` governs **structured** value fields, monetary aggregates,
exports and AI prompt assembly. It does not — and cannot honestly claim to —
remove amounts written inside the contract's own wording, its frozen executed
text, or an uploaded PDF's extracted text. A member without the right who can
open a contract can read the price in clause 4.

This is stated as a limitation in SECURITY.md rather than papered over. Anyone
who must not learn a contract's value should not have folder access to it: F1 is
the boundary that actually holds, and F2 is a reduction of casual exposure
across lists, dashboards, exports and AI answers.

### Porting the approval rule engine to the server

See F4-1 above. Deliberate, reasoned, and the only place where the brief's
server-first instruction was not followed to the letter.

### Server-side sorting by value

The brief asked for server-side value sorting to fall back to the default sort
for a member without the right. `GET /api/contracts` has never accepted a sort
parameter — ordering is `seq DESC` and all sorting happens in the browser. There
was nothing to make fall back. The client-side fallback **was** implemented
(`regFiltered()` and `folderFiltered()` both coerce a stored `sort:'value'`
preference to `'updated'`), and the option is removed from both sort menus. No
new server capability was invented to satisfy a requirement about a capability
that does not exist.

### Folder scoping of the reminder job

`runReminders()` was reviewed and left alone. Renewal and obligation reminders
are emailed to workspace **admins**, who are unconditionally unrestricted, so
there is no scope to apply. Counterparty share nudges go to the counterparty.
The route that triggers a run (`POST /api/reminders/run`) is admin-only. Noted
rather than changed, because adding a scope filter that can never do anything
would be misleading code.

### The workspace ZIP export

`GET /api/export/workspace.zip` is admin-only, and admins are always
unrestricted, so the scope filter added to it is a no-op today. It was added
anyway, with a comment saying why: if that route's authority is ever widened,
the export must not quietly become the way out.

---

## Run: Signing capacity (follow-up)

Reported after the visibility run: *"if I sign a contract and I am the
administrator but also the COO, the title in the signature is Admin."*

### 1. A permission level was printed as a signing capacity

**What was broken.** The line under a signer's name on an executed contract read
"Amina Otieno, **Admin**". `Admin` is the workspace **permission level** —
Admin / Legal / Viewer, what the account may do in the software. What belongs
there is the **capacity** the person signed in — COO, Finance Director — because
that is what tells a counterparty the signer had authority to bind the company.
The two are different claims, and one is not a weaker form of the other.

**Root cause — four gaps in a row, and the reporter hit all four.**

1. **The workspace founder was never asked for a title.** `POST /api/setup`
   took org, name, email and password. The "Add team member" form in Team &
   Settings *did* have a "Title (e.g. CFO)" box — so every member except the
   one who created the workspace could have a title, and the founder is the
   person most likely to be signing.
2. **A title, when given, was filed away from the account.** The add-member
   handler in `js/views/settings.js` posted only `{name, email, role, password}`
   and wrote the title into `state.settings.directory` — a contacts list.
   `users` had no `title` column at all. `orgDirectory()` in `js/core.js`
   contains `if(!byEmail[k].title && u.title)` — a read of a user field that
   has never existed, so that branch has never fired.
3. **The plain Sign button never consulted the directory.** Only the multi-signer
   route did (`openSignerPlanEditor`, `js/approvals.js`), and even there the
   fallback was `(p && p.title) || ROLE_LABEL[u.role]` — so a member with no
   directory entry got the permission level written into a field the UI labels
   "Title (e.g. CFO)". `finalizeExecution()` on the single-signer path wrote
   `role: ROLE_LABEL[u.role]` and no title whatsoever.
4. **The display filled the gap with the wrong thing.**
   `${s.title ? ', '+s.title : s.role ? ', '+s.role : ''}` — with no title it
   printed the permission level, turning missing information into a false
   statement.

**Note on the asymmetry.** The counterparty's signature carried their real title
correctly all along, because the share portal asks them to type it. So an
executed contract stated the outside party's capacity properly and the
workspace's own signer's incorrectly.

**The fix.**
- Additive `title` column on `users` (nullable — no title recorded is an honest
  empty, never a substitute). Exposed on `publicUser`.
- `POST /api/setup` and `POST /api/users` both accept and store it; the setup
  screen now asks the founder for their job title.
- `PATCH /api/users/:id` accepts `title`, and is the **one** field a non-admin
  may set on their own account: a permission is something an admin grants you,
  but your own job title is a fact about you, and refusing to let the founder
  record their own capacity is how this happened. Role and value access remain
  admin-only and still cannot be self-granted.
- Team & Settings shows each member's title under their email — or the warning
  *"No job title — signs with no capacity shown"* — with an Add/Edit control.
  Saving also updates the people directory, so signer-field auto-fill keeps
  working.
- `signerTitle(u)` in `js/core.js`: account title → people directory → empty.
  Never the permission level. Used by both signing paths.
- `signatureCapacity(s)`: title, else the signing route's free-text field, but
  **suppressing a value that is exactly `Admin`, `Legal` or `Viewer`**. That
  makes the fix read correctly on contracts signed *before* it — display-only,
  altering nothing, which matters because a signature on an executed contract is
  immutable by design.
- `c.signatory` (the "Signed by …" fallback) is now the name plus the capacity
  if one exists, and just the name if not.

**Sealing untouched.** `sealString()` v2 folds in each signature's name,
timestamp, form and image hash — not its role or title. A test asserts the seal
string is byte-identical with and without a title, so nothing already sealed
moves.

**Known edge case.** A member whose job title is literally the word "Admin",
"Legal" or "Viewer" will have it suppressed. Accepted: those three strings are
the product's own permission labels, a real title would be "Administrator" or
"Legal Counsel", and the cost of the alternative — leaving historic signatures
claiming a permission level as authority — is higher.

### 2. The evidence pack did not record signing capacity at all

**What was broken.** Found while fixing the above. `downloadEvidence()` in
`js/core.js` emitted `party`, `name`, `email`, `method`, `form`, the signature
image and its hash, the IP, the user-agent and the timestamp — and **no role or
title of any kind**. The document whose entire purpose is to prove a signature
did not say in what capacity anyone signed.

**The fix.** A `capacity` field on each signature in the pack, from
`signatureCapacity()`. `null` when none was recorded; never back-filled from a
permission level.

### 3. Deliberately not done — correcting contracts already signed

Signatures on an executed contract are immutable server-side
(`EXECUTED_IMMUTABLE` includes `signatures`), and that rule is not being
relaxed: a signature that can be edited after the fact is worth nothing.

Contracts signed before this fix keep whatever was written on them. The display
change means they no longer *show* "Admin" as a capacity — they show the name
alone, which is true — but the stored record is untouched. Correcting the record
itself is an amendment, which is the existing, correct route.

---

## Run 4 — Word round-trip (2026-07-26)

**F9-001 — `extractWordText`/`trackedNote` not window-attached.** Found by the
hand-driven browser run, not by unit tests: `js/wordflow.js` calls both, they
lived in `js/views/contract.js`, and the modules share scope only through
`window` (see components.js) — module-scoped `const`s are invisible across
files. Uploading a returned .docx threw `ReferenceError` inside an async click
handler, which surfaces nowhere: no toast, no round, nothing. Fixed by adding
both to contract.js's window exports. Lesson repeated from earlier runs: in
this codebase "defined" and "exported" are different facts, and only a real
browser exercise catches the difference.

**F9-002 — file-version picker defaulted to v1.** After adopting a Word round
the dropdown listed v1 and v2 but showed v1 selected, so "Download selected"
one click away from re-sending the superseded original. The latest version is
now pre-selected.

---

# Run: overnight fix-and-verify loop (UX-review remediation)

Starting point: commit `2d4cd99`, the commit the UX review examined. All times UTC.

## Phase 0 — the verification harness

**2026-07-26 — decision: a real DOM, not a hand-rolled fake.**
The existing tests render one view module into a small fake `document`
(`test/dom.js`) and read the markup back. That is enough for markup assertions
but not for a six-round negotiation: the rich-document engine (`js/richdoc.js`)
parses into an inert document, walks live cursors (`firstChild`/`nextSibling`
while mutating the same child list) and calls `querySelector` with a compound
selector. Reimplementing that faithfully in a test double would mean the
scenarios ran against my imitation of a browser rather than a browser.

Decision: add **jsdom as a devDependency** and boot the real modules into it
(`test/world.js`). The frontend keeps its no-build-step, no-runtime-dependency
rule — jsdom is `devDependencies` only and never reaches a browser. Recorded
here because it changes test infrastructure: the *style* of the tests is
unchanged (node:test, `describe`/`test`, assertions on real product output),
only the DOM underneath is now real.

**2026-07-26 — decision: the shell is stubbed, the logic never is.**
`test/world.js` stands in for the application shell — `persist()`, `toast()`,
`api()`, `renderWorkspace()` — but every module whose behaviour is under test is
loaded from `js/` and run for real. `logAudit()` is deliberately a *recorder*:
the product decides which actor and which wording go into the audit trail, and
checklist line 4 is an assertion about exactly that decision. Had `logAudit`
been reimplemented in the test, line 4 would have been testing the test.

**2026-07-26 — decision: Erik's Word files are real ZIP bytes.**
`test/docxfix.js` writes genuine `.docx` archives with tracked changes expressed
the way Word expresses them (`w:ins` around inserted runs, `w:delText` for
struck-out wording), so `js/docx.js` is exercised on the shape it meets in the
field rather than on a convenient paraphrase.

**2026-07-26 — baseline run.** `node --test test/scenario1.test.js
test/scenario2.test.js` → **6 pass, 27 fail**. This failing baseline is the
intended starting point: the scenario scripts describe the end state, and 27 of
their assertions describe behaviour that does not exist yet. The 6 that already
pass are the parts the UX review found genuinely working — the word diff, version
capture, the value-counter path and the signed door.

## Phase 1 — the six safe fixes

**2026-07-26 — fix-1: the Word round trip was gated on the wrong side of the deal.**
`wordControlsHtml` opened with `if(!isWordDoc(c)) return ''` — the contract had
to have *arrived* as a .docx. Everything underneath (`docxExtract`, the round
filing, the version ledger, the soft lock) was already origin-agnostic; only the
gate was not. Replaced with `wordCapable(c)`: a live, editable contract with
wording to send.

Two things the gate was hiding, found while removing it:

1. **The panel was never rendered for a drafted contract at all.** It lives
   inside `uploadDocBody()`, which only runs for received documents, so removing
   the gate alone would have changed nothing visible. The panel is now also
   rendered in the drafted-document path in `renderWorkspace`, guarded by
   `!isUpload(c)` so a received document does not show it twice.

2. **Adoption silently dropped the returned file on drafted contracts.**
   `acceptProposedRound` filed the .docx only `if(r.via==='word' && r.file &&
   c.upload)`. A drafted contract has no `c.upload`, so it adopted the wording
   and threw the file away. Decision, per the integrity rule: give a drafted
   contract its own ledger (`c.wordVersions`) rather than fabricate an `upload`
   block on it — a synthetic upload would make the record claim a document was
   received that never was, and `isUpload()` drives sealing, the portal and the
   register. `wordVersionLedger(c)` now decides which array in one place.
   Received documents keep numbering from v2 on top of their original, pinned by
   a regression test, so records created before tonight read identically.

**2026-07-26 — decision: a generated file must never be a stale file.**
Once a drafted contract can go out to Word, "download the current .docx" has two
possible meanings, and the dangerous one is silent: hand over the last *stored*
file after the wording has moved on, and counsel marks up text that no longer
exists. `wordFileStale(c, entry)` compares the wording filed with a stored file
against the live document, and `startWordReview` regenerates from the document
whenever the stored file has fallen behind (and always, for a drafted contract).

**Harness corrections made while running fix-1** (test-side only, no product
change): the world's `openModal` now really writes into `#modal-root`, because
the product wires modal buttons with `getElementById(...).addEventListener`
immediately afterwards; and array assertions use `.length` rather than
`deepEqual`, because an array built inside the jsdom realm does not share
Node's `Array.prototype` and a strict deepEqual compares realms, not contents.

Result: `f16-word-return-any-contract.test.js` 14/14; existing suite 186/186
green, no regressions.

**2026-07-26 — fix-2: the app had the counterparty's address all along and never read it.**
Every share row on the server already carried `recipient_name`,
`recipient_email`, `recipient_phone` and `channel`. The share dialog opened
blank regardless, so a six-round negotiation meant six trips through an empty
form. Added `lastShareRecipient(shares)` and `shareModalPrefill(shares)` as pure
functions of that list (testable on their own, and one place that answers "who
is this going to?"), `contractShares(c)` to fetch it, and
`reshareToLastRecipient(c)` behind a **Send updated version** button that
appears on the negotiation panel once a round has actually been decided.

Decisions:
- **A revoked or expired share still counts** as evidence of who the
  counterparty is. The link died; the person did not.
- **An anonymous copy-link share is skipped** — it names nobody, so it says
  nothing about where the next round should go.
- **The prefill says where it came from.** A field that silently fills itself
  reads as a mistake, and on a control that sends a live contract to a named
  address that is the wrong kind of surprise.
- The button **falls back to the full dialog** if there is nobody on record,
  rather than leaving a pressed button that did nothing.

**Test-harness finding worth recording** (it will bite the next person):
`js/core.js` declares `currentUser`, `canEdit` and friends as top-level `const`
arrows. Those are *lexical* bindings of the script, so a value passed into
`loadViews` as an override — or assigned onto the sandbox afterwards — does not
change what other core functions see; they close over the real one. Identity in
these tests therefore comes through `window.REMOTE`, which is the seam server
mode genuinely uses to sign a user in. Overriding `function`-declared globals
(e.g. `buildSharePayload`) does work, but only if assigned *after* the module
evaluates.

Result: `f17-reshare-recipient.test.js` 16/16; suite 202/202 green.

**2026-07-26 — fix-3: a real .docx writer (`js/docxwrite.js`), not the HTML-as-.doc fallback.**
The prompt allowed falling back to extending `portalDownloadCurrentAsDoc`
(an HTML body under a `.doc` name). I attempted the real writer first and it
shipped, so the fallback was not used. Three decisions inside it:

1. **Stored, not deflated.** A ZIP entry may be stored uncompressed (method 0)
   and Word opens such an archive; f9 already proves HaTi *reads* one. A
   contract is tens of kilobytes, so deflate buys nothing worth an async
   `CompressionStream` in the middle of a download, and store-only keeps the
   writer synchronous and dependency-free.

2. **Clause numbers are literal text, never `w:numPr` list numbering.** Word
   regenerates numbering for a real list, so a schedule beginning at clause 8
   would be renumbered to 1 and every cross-reference in the agreement would
   break. This is the identical reasoning `js/pdfrich.js` already applies when
   it refuses to turn a dotted clause number into an `<ol>`. The numbers the
   rich text projection reconstructs are the numbers that reach the file, and a
   test pins `start="8"` still starting at 8.

3. **Headings are real Word headings** (Heading1–4 with `w:outlineLvl` in a
   styles part), so the file opens with a navigable outline rather than as one
   undifferentiated block.

**How it is proved.** The strongest available evidence that the output is a
genuine Word file is that HaTi's own reader — written independently against the
spec, and already proven on Word's own output in f9 — reads it back unchanged.
The tests do that, and add what a round trip alone would miss: every OPC part
present, every XML part well-formed (parsed with a real XML parser, checking for
`parsererror`), markup escaped rather than injected, and control characters
stripped so a stray byte cannot make the file unopenable.

Wired into the workspace toolbar (**Word** beside PDF) and into the portal:
`portalWordCard` used to return `''` for any contract with no uploaded file, so
a counterparty reviewing a HaTi-drafted contract had no Word route at all. They
now get one, generated from the wording on the page they are reading, and the
existing "upload your marked-up copy" path — which reads the file in their own
browser and sends only the wording — now applies to those contracts too.

Result: `f15-docx-export.test.js` 15/15; suite 217/217 green; scenario 1 rounds
1 and 2 fully green (8/15 overall, the rest awaiting fixes 6 and 7).

**2026-07-26 — fix-5: one standing link per counterparty, instead of six dead ones.**
Every share was single-use, so a six-round negotiation meant six emailed links
and the counterparty's job included working out which was still live. Durability
is now opt-in per share (`shares.durable`), defaulting to **off**.

Design decisions, all forced by the fact that a durable link outlives the single
`response` and single `payload` columns a one-shot share was happy with:

- **`share_responses`, one row per round.** Reusing `shares.response` would make
  a second round look like the first being re-delivered. `/api/shares/pending`
  now returns durable answers with a `responseId`, and `/applied` marks off that
  one answer. Marking the whole link applied — the old behaviour — would have
  silenced every later round on it, which is the exact bug this feature could
  most easily have introduced.
- **`share_payload_history`, so "revised since you last opened it" survives.**
  The existing baseline (`priorCopySeenBy`) works by looking at *other* share
  rows; a durable link is refreshed in place and has none. On refresh the
  outgoing copy is moved into history along with whether this reader had
  actually opened it, and `priorCopyOfDurable` applies the same rule to that
  store: a copy never opened was never seen, and identical wording is not a
  revision.
- **A durable link is never superseded, and never supersedes.** It is the
  current copy by definition, so `shareSuperseded` is skipped for it — and,
  the direction that matters more, other links no longer treat a durable link's
  wording as grounds to invalidate themselves. Without that second half, opening
  a standing negotiation link would have killed the one-shot signature link
  someone was about to sign. Pinned by a test.
- **One-shot is untouched**: still the default, still binds exactly one answer to
  exactly one copy, still superseded by a newer copy. Refreshing a one-shot
  link's payload is refused outright (409) — silently swapping the wording under
  a single-answer link would be indefensible.
- `reshareToLastRecipient` **refreshes an existing durable link** rather than
  minting another one, which is the whole point of the feature from the
  counterparty's side: one URL for the whole deal.

The share dialog now offers the choice in plain words, defaulting to the
standing link and explaining that a single-answer link is what a final signature
wants.

Result: `f18-durable-link.test.js` 19/19 (including authorisation, revocation,
deleted-contract and viewer cases); suite 236/236 green.

**2026-07-26 — fix-7: the record now says who actually wrote the words.**
When a negotiation runs partly outside HaTi, the only way to get the
counterparty's wording in was to type it into the Edit box — which recorded the
owner as the author of the other side's changes, silently. Split into two paths
that are genuinely different events:

- `applyOwnerEdit(c, text)` — we changed it: versioned immediately, logged as
  ours. (The Edit modal's save body moved into this function rather than being
  duplicated, so there is one implementation of "an owner edit".)
- `fileCounterpartyEdit(c, text, {by, comment, channel})` — they changed it and
  it reached us off-platform: an **open** round in their name, going through the
  same review and accept step as a redline that came through the portal. The
  wording does not enter the document until it is accepted.

Decision on whose name goes where, because both facts are true and hiding
either would be its own dishonesty: the **round** is attributed to the
counterparty (they wrote the words), the **audit entry** names them as the
source *and* records who typed it in (`filedBy`, and "entered by …" in the
detail). Anyone reading the trail later can see both that the wording is Erik's
and that Wanjiru was the one at the keyboard. With no name supplied it falls
back to the contract's counterparty — never to the current user.

Also refuses to invent a round: identical wording, empty wording, an executed
contract and a viewer role all file nothing.

Result: `f19-counterparty-authorship.test.js` 17/17; suite 253/253 green;
scenario 1 now 13/15 (the two remaining are the formatting-flattening
assertions, which fix 6 owns).

**2026-07-26 — fix-8: the conversation now travels with the contract.**
The portal could tell a reader *that* their round was turned down and never
*why*: the reasoning lived in a parallel email thread, which is the exact
fragmentation the product exists to end, reappearing at the moment the parties
most need a shared record.

- `buildSharePayload` now carries `comment` on each round and `comment` on its
  resolution. The counterparty's own ask travelling back is not a leak — they
  wrote it — and it is what makes the page read as a conversation. The internal
  name of whoever ruled still stays behind; the organisation speaks. The
  proposed/base texts still stay behind too (bulk, and already reflected in the
  wording shown).
- `resolveRound(c, n, accept, {comment})` records the reply, bounded to 2000
  characters before storage, and the negotiation panel now *asks* for it when
  rejecting — a rejection the other side cannot understand is one they will
  simply re-send.
- `portalThreadHtml` renders both halves beside the document;
  `portalOpenPointsHtml` shows points that were raised and not adopted, because
  a rejected change that silently disappears reads as agreement.

**Bug found by the escaping test, fixed in the product:** the org name was
escaped in `portalThreadHtml` and then escaped again inside `bubble()`, so a
counterparty at "Mwangi & Sons" would have been shown "Mwangi &amp;amp; Sons".
Now escaped exactly once, at the point of output, with a regression test.

**Test-writing note:** the first version of the injection test asserted that the
string `onerror=` never appears in the output. That is the wrong assertion —
escaped text may legitimately contain those letters and does no harm there, and
the harness's own `icon()` stub emits a real `<svg>`. The assertion is now that
none of the injected *tags* survive as tags, which is the actual vector.

Result: `f20-round-thread.test.js` 18/18; suite 271/271 green.

## Phase 2 — the two large fixes

Checkpoint `checkpoint-before-fix4` tagged at `f5e67d5` (suite 271/271 green).

**2026-07-26 — fix-4: a redline is not one decision.**
`diffBlocks(base, proposed)` splits a redline into individually decidable
changes and `applyBlockDecisions(base, proposed, decisions)` rebuilds the
document from the answers. `reviewProposedRound` now renders a control per
change (plus Accept-all / Reject-all), and `acceptProposedRound(c, n,
{decisions, comment})` adopts exactly what was accepted.

The decisions that matter, in order of how badly each could have gone:

1. **One segmenter, two consumers.** The function that builds the controls and
   the function that builds the document must agree on where a block starts, or
   a decision would be applied to the wrong passage. `_diffSegments` is the
   single boundary rule both run on.
2. **Changes separated only by whitespace are ONE block.** Word-level diffing
   splits "fourteen (14) days" → "twenty-one (21) days" into two changes,
   because the space between them is unchanged. Offered as two decisions, a
   reviewer could accept "twenty-one" and reject "(21)" and produce
   **"twenty-one (14) days"** — a clause neither party ever proposed. That is a
   far worse failure than the one this fix replaces, so the shared whitespace is
   absorbed into the block and a block moves as a whole. Pinned by an exhaustive
   test over all 2^n decision combinations asserting the merged text contains no
   word neither side wrote.
3. **Silence rejects.** A block with no decision stays as it was. The other
   default — an unreviewed change quietly entering a contract — is unrecoverable
   once signed.
4. **Taking nothing is a rejection**, recorded as `rejected`, not as an
   "acceptance" that changed no wording. A partial acceptance is recorded as
   `partly-accepted` with the tally in the audit detail, so the record never
   reads as a full acceptance of something that was only half taken.
5. **Rejected blocks become open points** (`openPointsFor`), carried in the
   share payload and rendered in the portal, because a refused change that
   simply vanishes from the document reads as agreement. A point later agreed by
   another route drops off the list — a "still open" item that is actually
   settled teaches people to ignore the list.

**Refactor recorded:** `resolveRound` moved from `js/core.js` to
`js/versioning.js`. The all-rejected branch of adoption has to resolve the round,
and resolving a round and adopting one are the same decision seen from two
sides; they now sit together. `js/app.js` already loads both, in that order, so
nothing changes at runtime — but any test sandbox that resolves a round must now
load `js/versioning.js`, which F20's was updated to do.

Result: `f21-change-blocks.test.js` 21/21; suite 292/292 green.

Checkpoint `checkpoint-before-fix6` tagged at `a9ba7f4` (suite 292/292 green).

**2026-07-26 — fix-6: a contract no longer gets uglier as it is negotiated.**
The counterparty edits in a plain-text box, and a Word return is plain text
too. Adopting that overwrote the body with the text and set `format:'text'` —
so headings, clause numbering and tables were lost at the FIRST round of every
negotiation, permanently, and the signed instrument was the flattened copy.

`richFromTextEdit(html, newText)` in `js/richdoc.js` puts the edited text back
into the document's own structure. The insight that makes it tractable: the
LINE is the unit. `richToText` already emits one line per block, so the same
walk — recording which node produced each line (`_lineUnits`) — gives a map
from the text the counterparty edited to the elements that produced it. An LCS
over lines then lands each change on the node that owns it: an edited line
rewrites its block and keeps it, an inserted line becomes a new block, a
deleted line takes its block with it, and everything nobody touched is not
rewritten at all — including its inline emphasis.

Three rules, all of them about not guessing on a legal document:

1. **It verifies itself.** The rebuilt document's own text projection must
   equal the text that was agreed; if it does not, the merge returns null and
   the caller falls back to plain text. A structurally pretty document that
   does not say what the parties agreed would be far worse than a plain one
   that does.
2. **The fallback is announced.** When it falls back, the audit entry says the
   edit could not be placed back into the formatted document and it is now
   plain text. A silent flattening is precisely what this fix exists to stop, so
   an unavoidable one must at least be visible.
3. **Structures it cannot map are refused outright** — a table or a
   preformatted block has no line-per-block projection, so an edited line
   cannot be placed inside it safely.

Two smaller decisions found while testing:
- **Inline marks inside a CHANGED line are not reconstructed** unless the whole
  line sits in one text node. The text is what was agreed; the emphasis on a
  rewritten sentence is not something a plain-text edit tells us.
- **A line inserted after a list item** is a new list ITEM only if it opens with
  a clause marker (which is then stripped, because the list regenerates it);
  otherwise it is a paragraph placed after the list. Appending it into the list
  unconditionally invented a clause number nobody had written.

**Improvement made while a scenario assertion was failing, kept because it is
right:** `openPointsFor` now also drops a point whose clause has since been
renegotiated. Erik asks for Net-60, is refused, and the parties later settle on
Net-45 — he did not get what he asked for, but the passage the point was
measured against no longer exists, so the point is spent, not outstanding. A
list that keeps showing settled items is one people learn to ignore.

**Also fixed:** the redline adoption audit entry named only who decided, never
whose wording it was, so a trail read back later said a round was accepted
without saying who proposed it — the same omission fix-7 exists to prevent. It
now names both sides.

Result: `f22-formatting-survives.test.js` 14/14. **Full suite 342/342 green,
including both six-round scenario scripts end to end.**

## Phase 3 — final verification

**2026-07-26 — two clean runs, both green.**
`node --test test/*.test.js` on a fresh `git clone` of `82d62e2` with a fresh
`npm install`, in two separate directories:

  clean run 1 — 342 tests, 342 pass, 0 fail (75 suites, 15.05 s)
  clean run 2 — 342 tests, 342 pass, 0 fail (75 suites, 15.60 s)

All 14 checklist lines PASS, each against a named test. Nothing was rolled
back: both large fixes were tagged first (`checkpoint-before-fix4` at `a9ba7f4`,
`checkpoint-before-fix6` at `f5e67d5`) and both reached green, so neither tag
was needed.

Of the 342 tests, 172 are the pre-existing suite, unchanged and still passing —
which is checklist line 13: drafting, the twelve templates, PDF export, OTP
signing, the seal, the evidence pack and version compare are untouched.

**Scope honoured:** no mobile/WhatsApp counterparty portal was built. Fix 5
changed the *lifecycle* of the existing web link (how long it lives, how many
answers it takes) and nothing about its delivery channel.

---

# Run 6 — post-review remediation (2026-07-26)

A re-review of the current code (commit `b1a333f`) found two shipped bugs, both
on the counterparty's side of the product, and both missed because the 342-test
suite only drives the owner's side.

**Owner decisions recorded, so they are not lost:**

- **Item 4 (clause-by-clause editing for the counterparty): phased.** Phase 1
  shows the document as clauses and lets the counterparty edit one at a time,
  reassembling the full text and submitting through the EXISTING redline route
  so the server and the owner's side are untouched. Phase 2 adds a comment per
  clause. Not started; queued after the urgent work.

- **Item 6 (signing depends on email): allow signing without the 6-digit code.**
  The owner's stated context is a demo platform, with safeguards to follow later.
  Two constraints applied to that decision, neither of which was asked for but
  both of which cost nothing:

  1. **The code is only skippable when it CANNOT be delivered** (the server has
     no mail provider). Where email works, the code stays mandatory. Otherwise
     the verification could be bypassed by choosing to, which is a silent
     downgrade rather than a deliberate demo setting.
  2. **The resulting signature is labelled as unverified** on the record, the
     certificate and the evidence pack. Demos become production more often than
     not; a signature that overstates how it was verified is the same class of
     false record as the "sent" bug this run exists to fix.

**2026-07-26 — item-6 shipped: signing no longer requires a code that cannot be sent.**
`POST /api/shares/:token/respond` allowed `action:'sign'` only with a verified
one-time code. On a workspace with no mail provider that code can never arrive,
so a deal that had cleared every round could not be signed at all.

Now: where the code CAN be delivered it is still mandatory; where it cannot,
the signature is accepted and recorded as unverified. The narrowness is the
point — a verification the signer can decline is not a verification, and
skipping it would be invisible to the owner.

What the record says, in three places, because a signature that overstates how
it was checked is the same class of false record as the "sent" bug:
  · the response carries `verified:false` and a method naming the reason
  · the audit trail appends "NOT independently verified: this workspace cannot
    send verification codes"
  · the stored signature carries `verified`, so the certificate and evidence
    pack can read it back

Identity is not dropped along with the code: a real email address is still
required, so a share link can never be signed anonymously.

**A pre-existing regression test failed, and was rewritten rather than deleted.**
`regression.test.js` asserted "signing through a share still needs a verified
email code" — written when the rule was unconditional. The guarantee still
holds, in a different shape, so the test now asserts the half that applies to a
server with no mail key (a nameless signature is refused, 400) and points at
F23 for the half that needs one (code mandatory, 403). Deleting it because the
status code moved would have quietly removed the guarantee it existed to hold.

Backward compatibility: signatures recorded before this change carry no
`verified` field and are read as verified, which is what they were.

Result: `f23-signing-without-email.test.js` 11/11; suite 354/354 green.

**2026-07-26 — item-1 shipped: "sent" now means sent.**
`reshareToLastRecipient` refreshed the counterparty's durable link, showed the
owner "Updated version sent to Erik Lindqvist", and wrote that sentence into
the contract's history. Nothing was emailed. The negotiation then stalled with
both sides waiting, and the record explained the stall incorrectly.

Two halves, and the second is the larger one:

1. `PUT /api/shares/:token/payload` now sends the notification for an
   email-channel share, and returns `emailSent` / `emailConfigured` /
   `emailError` / `channel` / `link`, exactly as `POST /api/shares` already did.
2. **Every other outcome is reported for what it is.** Adding the email call
   alone would have left three silent failures behind it: a copy-link share
   (nobody to email), a WhatsApp share (HaTi has never sent those — the first
   share opens `wa.me` in the browser), and a provider that refuses the message.
   The audit line now reads "emailed to X" only when something left, and
   otherwise "published to X's link — NOT emailed", naming the reason. The
   button opens WhatsApp for a WhatsApp share, and otherwise shows a dialog
   handing over the link to send by hand.

**A test of my own from earlier in this session had to be corrected.** F17
asserted the audit reads "Updated version sent to Erik Lindqvist". Its stub
never simulated a delivered email, so under the new rule the honest wording is
"NOT emailed" — the test was asserting the bug. It now stubs a delivered send
and asserts "emailed", with F24 covering the outcomes where nothing leaves.

Result: `f24-reshare-notifies.test.js` 10/10; suite 364/364 green.

**2026-07-26 — item-2 shipped: the counterparty's Word download was one paragraph.**
`wireportalWord` handed the writer `portalCurrentText()` — the plain text
projection — while keeping `format:'rich'`. The writer parsed it as markup,
found none, and produced the entire contract as ONE block. The owner's
identical button produced sixteen properly structured lines.

The cause is a class of bug worth naming: **a format marker that lies about its
content.** Fixed in two places, deliberately:

1. **At the caller** — the portal now builds an honest descriptor. It hands over
   the formatted body when the body IS formatted and still matches what is on
   the page, and otherwise labels the plain text as plain text.
2. **At the writer** — `contractBlocks` treats content marked rich that contains
   no markup at all as text. That is the floor under every other caller,
   present and future; the caller fix is the correct one.

**2026-07-26 — item-7 (partial) shipped: the counterparty finally has a stage.**
`test/portalworld.js` boots `js/views/portal.js` — plus the real `core.js`,
`docxwrite.js` and the real document renderer — into a DOM, renders the page
from a payload built by the product's own `buildSharePayload`, presses its
buttons and reads what Erik actually receives.

`f25-counterparty-page.test.js` then drives what he does: opens the link,
downloads the Word file and reads the bytes back, proposes edits and checks the
submitted shape, reads the thread and the open points, and signs both with and
without a verification code available. **One of its assertions is that the file
he downloads and the file she exports are the same document** — the check that
would have caught this bug on the day it was written.

Two harness lessons, both the same lesson:
- A recorder assigned BEFORE the modules load is silently lost, because several
  of these names are declared by the modules themselves (`wordflow.js` declares
  `wordTriggerDownload`, `core.js` declares `toast`). Recorders are re-installed
  after loading.
- The page's handlers are async — building a Word file, capturing a signature —
  so `click()` awaits the microtask queue. A synchronous check reads the state
  before the work has happened, which looks exactly like a dead button.

Result: `f25-counterparty-page.test.js` 15/15; suite **379/379 green**.

**2026-07-26 — Run 6 verification.** Two clean runs on fresh clones of `b9f15c2`:
run 1 — 379 tests, 379 pass, 0 fail (16.9 s); run 2 — 379 tests, 379 pass, 0
fail (18.1 s).

Shipped this run: item 1 (reshare notifies), item 2 (portal Word export), item 6
(signing without a code, labelled), item 7 (counterparty test harness).
Not started: items 3, 5, 8, and item 4 (phased approach agreed with the owner).

**2026-07-26 — item-3 shipped: one Word control, and a pause you can see.**
Two controls on the same screen both said "Word". The toolbar one downloaded.
The one in the panel below downloaded AND froze online editing — silently, with
no explanation and no obvious way back.

The pause is worth keeping (edits made in HaTi while a copy is out in Word
collide with the wording coming back), so it was not removed — it was made
visible. `startWordReview(c, btn, {lock})` takes the freeze as a parameter
rather than applying it as an unavoidable side effect, the panel's duplicate
download is gone, and the toolbar button opens a short dialog that explains the
choice in words and defaults to pausing, which is the safer of the two.

The panel keeps what is genuinely its own — the return trip, the version ledger,
the lock status and its cancel — and now says where the download went, so
someone hunting for the old button is not left guessing.

Result: `f26-one-word-button.test.js` 9/9; suite 388/388 green.

**2026-07-26 — item-8 shipped: a silent wait is now a visible state.**
"Under Review" covered two situations that call for opposite actions: the
counterparty is reading it and thinking, or they never opened it and do not
know it exists. The app showed the same thing for both.

The answer was already in the data and was simply never read back. The server
records `first_opened_at` per share, and a durable link's marker is cleared on
every payload refresh — so "opened" already means "opened THIS version", which
is the only version worth asking about.

`counterpartySeenState(c, shares)` reduces the share list to one of
responded / opened / unopened, and `counterpartySeenHtml` renders it above the
shares panel. Unopened for three days or more escalates and offers "Send it
again" in one click, because silence that long usually means the message never
arrived rather than that the deal went quiet.

Deliberately says nothing when there is nothing worth saying: a revoked or
expired link, an anonymous copy-link (nobody to have *not* seen it), a contract
already executed, or a round already answered — the returned-changes strip
speaks for that one, and two notices about the same fact is how notices stop
being read.

Result: `f27-seen-state.test.js` 14/14; suite 402/402 green.

**2026-07-26 — item-5 shipped: a paper-signed deal lands on its own contract.**
A contract negotiated in HaTi and then signed on paper had nowhere to go. The
scan could only be uploaded as a NEW record, so every round, version and
decision was orphaned from the document those rounds produced — a dead end at
the last step, for a way of signing that is still normal in cross-border trade.

`attachPaperSignature(c, file, {signedOn, note})` executes the contract in
place: the wording and the whole negotiation history stay, the scan is stored
and registered in `c.documents`, and `c.hash` becomes the scan's own SHA-256 —
because the scan IS the signed document.

The line it does not cross: **HaTi witnessed nothing, and the record says so.**
No electronic signature is recorded (`c.signatures` stays empty), the execution
carries `offPlatform:true`, `isExternallyExecuted` now includes it so the UI
renders a filing record rather than a signing certificate, and the audit entry
states outright that no electronic signature was taken and that the signatures
are on the retained scan. That is the same claim, in the same words, that a
migrated already-signed contract already carried.

Refuses to run where it would produce a false record: over unresolved proposed
edits, on an already-executed contract, while a copy is out for Word review,
for a viewer, or with an oversized file.

**Harness note.** Loading `js/views/contract.js` into `test/world.js` for every
test broke F16 and scenario 1: it declares its own `detectWordFile`,
`extractWordText` and `dataUrlBytes`, which replaced the shell those tests rely
on. It is now loaded only on request (`buildWorld({contractView:true})`) — a
test that needs something from that file asks for the heavier stage, and the
rest keep the light one.

Result: `f28-paper-signature.test.js` 14/14; suite 416/416 green.

**2026-07-26 — item-4 phase 1 shipped: the counterparty edits a clause at a time.**
Erik was handed the entire agreement as one stretch of plain text in a single
box: scroll to find clause 4, edit it in place, and write one comment covering
every unrelated change. It invited accidental deletions and it was his whole
impression of the product, while the owner's side had become clause-aware.

**The unit is the line, and that is what makes it safe.** The shared text is
already one line per block — `richToText` emits it that way, so a heading, a
paragraph and a numbered clause each arrive as exactly one line. Editing one
line and rejoining is therefore exact: with nothing edited, the reassembled
document is the original byte for byte (asserted directly). A merge that could
drift would be far worse than the box it replaces.

**Nothing about the wire format changed**, which was the whole point of the
phasing agreed with the owner. The reassembled text goes down the same redline
route as before, so the server, the owner's review screen and every existing
test see exactly what they saw before. The change is confined to what Erik
looks at.

Also added, because clause-at-a-time is right for the ordinary case and wrong
for a wholesale restructure: an **escape hatch** back to whole-document editing
that carries across whatever he has already changed rather than discarding it.
A returned Word file is a whole-document edit by nature, so that path switches
to the plain surface before submitting.

Two bugs of mine caught by the new tests before they could ship:
- `wirePortalClauseEditor` attached listeners without ever doing the initial
  render, so the editor opened empty. It now renders first, then binds.
- `scrollIntoView` threw mid-handler under jsdom and would abort the rest of
  the flow. Guarded in the product (it is a convenience, not a requirement) and
  provided in the harness.

Also now refuses to submit a round in which nothing was changed — previously a
no-op round could be sent and would arrive at the owner as an empty redline.

Result: `f25-counterparty-page.test.js` 18/18; suite **419/419 green**.

**2026-07-26 — Run 6 final verification.** Two clean runs on fresh clones of
`d261282`: run 1 — 419 tests, 419 pass, 0 fail (18.6 s); run 2 — 419 tests, 419
pass, 0 fail (18.4 s).

All eight review items are now DONE (items 1, 2, 3, 4-phase-1, 5, 6, 7, 8).
Item 4 phase 2 (a comment per clause rather than one per round) is not built.

Three bugs were caught by the new counterparty-side tests before they could
ship, all three in this run's own work and all three on the counterparty's side:
an editor that rendered nothing, a scroll call that aborted the flow mid-step,
and a no-change round that could be submitted as an empty redline.

**2026-07-26 — item-4 phase 2 shipped: a reason belongs to the change it is about.**
Phase 1 let the counterparty edit a clause at a time, but the explanation was
still one comment for the whole round — "we need changes to payment, delivery
and liability" arrived as a lump, leaving the owner to work out which sentence
explained which edit, and leaving her one reply to cover all three.

**The join was the interesting part.** He writes a reason against a whole
CLAUSE; she decides individual DIFF FRAGMENTS ("thirty (30)" → "sixty (60)").
A note keyed by line index would be meaningless on her screen. So each note
travels with the whole line **before and after** the change, and
`noteForBlock(block, notes)` matches a fragment to its note by containment —
sound by construction, because the fragment came from that very edit. Pinned by
a test that two changes get two different reasons rather than the same one twice.

The conversation now runs per clause in both directions:
  · portal: a "Why?" field on the clause being changed; withdrawing the change
    withdraws its reason
  · response: `clauseNotes[]`, capped at 60 entries and 600 characters each
  · review screen: "Why they asked" against each change, plus a reply box on it
  · `blockDecisions` keep the ask and the reply beside the decision
  · open points and the portal thread show both halves, per clause, with the
    reply given on a specific change beating the one given for the whole round

Two test-writing notes, both mistakes I have now made twice:
- `new RegExp(literalWording)` — "thirty (30) days" contains regex grouping
  characters and silently matched the wrong row. Literal text needs `includes`.
- An injection assertion on the substring `onload=` fails on escaped text that
  harmlessly contains those letters. The vector is a TAG forming, and that is
  what the assertion checks.

Result: `f29-clause-comments.test.js` 15/15; suite **434/434 green**.

**2026-07-26 — final verification, item 4 complete.** Two clean runs on fresh
clones of `e97bc4e`: run 1 — 434 tests, 434 pass, 0 fail (19.3 s); run 2 — 434
tests, 434 pass, 0 fail (19.7 s).

All eight review items are DONE, including both phases of item 4. Nothing from
the review is outstanding.

---

# Session — the Negotiation tab (native in-app negotiation)

Branch `claude/new-session-mrv304`. Checkpoint `checkpoint-pre-negotiation-tab`
(= `301707f`). Running log, in the order things happened. **No rollback was
needed this session**; the checkpoint tag was never used.

## N-001 — 2026-07-27, Phase 0. The suite does not run on a fresh clone.

`npm test` failed at the first `before()` hook with:

```
Cannot read properties of undefined (reading 'stop')
```

which is the `after()` hook dereferencing an `h` that `before()` never assigned.
The real cause was two frames further up: `Error: Cannot find module 'express'`.
`node_modules` is not committed (correctly) and had not been installed.

Not a code defect. Worth writing down because the *presented* error points at
`test/helpers.js:22` and says nothing about dependencies, which is a minute lost
every time somebody clones this repo. `npm install` fixes it; the baseline was
then **513/513 green in 27 s**.

Left alone deliberately: making `after()` guard `h` would hide the real failure
behind a passing teardown.

## D1 — 2026-07-27, Phase 0. "Vanilla ES modules" needs one qualification.

The brief says vanilla ES modules, no build step, and that is accurate:
`index.html` loads exactly one script, `js/app.js`, which is 38 side-effecting
`import './x.js'` statements. But the modules do not `export` anything — each
ends with `Object.assign(window, {...})`, because ES-module scope means a
top-level `function foo(){}` is invisible to the next file.

Two rules the new modules follow, both already true of every existing one:

- anything another file needs goes in the closing `Object.assign(window, …)`;
- **no `import`/`export` statements in the file**, because `test/world.js`
  evaluates the same file as a raw script with `vm.runInContext`. A
  `module.exports` guarded by `typeof module !== 'undefined'` is the established
  way to also expose pure helpers to `require()` (see `js/docx.js`).

Recorded as a deviation only because the phrasing could reasonably be read as
"use `export`", and doing so would break the test harness.

## D2 — 2026-07-27, Phase 0. `docxExtract` is in `js/docx.js`, not `js/wordflow.js`.

The brief locates the Word extractor in `js/wordflow.js`. It is
`docxExtract()` in **`js/docx.js`**; `js/wordflow.js` owns the round-trip *flow*
(out, back, filed as a round) and `extractWordText()` in `js/views/contract.js`
is the thin wrapper over the extractor. No behaviour change — noted so the
reuse claim in `INVENTORY.md` points at the right file.

## D3 — 2026-07-27, Phase 0. Prototype tokens vs. HaTi's design system.

Per the brief, HaTi's real tokens win and the deviation is recorded. Full table
in `INVENTORY.md` §2.4. The substantive ones:

| Prototype | HaTi | Why HaTi wins |
|---|---|---|
| `--font-doc: Georgia, Times` (serif) | `--font-doc: "Google Sans Flex"` | The document surface's contrast ratios are documented in `index.html` (17.25:1 on `#fbfbfc`). A second document typeface in one product is worse than a different one. |
| `--font-ui`, `--font-mono` (system stacks) | `--font-body`, `--font-mono` (IBM Plex) | One type system. |
| `--canvas: #f2f4f7` (cool grey) | `--color-bg: #f4f3f0` (warm) | The whole app is warm-neutral; a cool pane reads as a foreign screen. |
| `--slate` ramp `#33475c / #456a8f / #26374a` | `--color-accent-800 / -700 / -900` | HaTi already has this ramp. |
| `--del-fg: #b0453c` for struck-out wording | `#8f322b` (from `diffHtml`) | **This one matters.** `diffHtml()` in `js/versioning.js` already renders deletions at `#8f322b`. Using the prototype's value would mean the same rejected wording looked different in the Negotiation tab and in the version-compare modal — two redlines that could drift. `#b0453c` is kept where the repo already uses it: destructive controls. |
| `--ins-fg: #1e6b4d` | `#1e6b4d` | No conflict; identical. |
| `--r-sm/md/lg 6/10/14px`, bespoke shadows | `--radius-*`, `--shadow-*` | One scale. |

**Structural deviations**, because the prototype is a standalone page and this is
a tab inside a workspace:

- The prototype's `header.topbar` (brand, breadcrumbs, avatar) is page chrome the
  workspace already provides. Only its contract-specific actions — Accept All,
  Reject All, the gated export, Propose edits — moved into the tab. Two headers
  on one screen would be worse than following the prototype literally.
- The prototype's viewport-fixed `footer.statusbar` becomes an in-tab strip; the
  workspace owns the bottom of the window.
- The prototype's `Doc` breadcrumb chip is the workspace tab row. The new tab
  joins it (`Docs` | `Negotiation`) rather than replacing a breadcrumb.

Asserted by `f36` — "the stylesheet uses HaTi tokens, not the prototype's
bespoke ramp" and "the insertion green matches diffHtml, so the two redlines
cannot drift".

## D4 — 2026-07-27, Phase 0. There is no tab literally called "Docs".

The brief says to attach the Negotiation tab beside the existing "Docs" tab. The
contract workspace has no tab by that name: it has a two-column body (document
left, panel right) and the panel carries `Draft & Review` | `Signing`
(`topTabBtn`, `_docTopTab`, `applyDocTabs` in `js/views/contract.js`).

Read as intended — "the existing document workspace" — and implemented as a new
**workspace-level** pair, `Docs` | `Negotiation`, above the split. It could not
have gone in the right-hand panel: that panel is a third of the screen and the
three-pane redline needs the full width. The hand-off button is named "Send to
Docs tab for signature" to match the brief's vocabulary, and the tab is
labelled `Docs`, so the name the brief uses now exists in the product.

## Decision — 2026-07-27, Phase 0. Custom templates already exist; scope does not expand.

The brief asked me to check rather than assume whether a custom/user template
feature exists, and to confirm a minimal version before building one. **It
already exists in full** and no template work was needed:
`state.settings.customTemplates`, persisted through
`api('settings/templates','PUT')`, with CRUD, versioning and bulk creation in
`js/views/library.js` (1,346 lines) — `openCreateTemplateModal`,
`openUploadTemplateModal`, `saveContractAsTemplate`, `duplicateBuiltinTemplate`,
`openTemplateVersions`, `createFromCustomTemplate`, `openBulkCreateModal`.
`templateFields()` in `js/templatefields.js` is already a single accessor over
built-in and custom templates alike — built-ins were retrofitted with a live
`fields` getter specifically so the two are indistinguishable to callers.

So Phase 1's second intake path is a shape, not a feature: the same body
carrying `templateId` instead of a built-in key.

## Decision — 2026-07-27, Phase 1. A change is not a round, and rounds stay.

`js/versioning.js` already models a proposal as a round: one whole-document text
pair whose divergences `diffBlocks()` segments into positional ids `b0`, `b1`…
That is the right unit for "review what came back" and it is untouched.

It is the wrong unit for a negotiation you can point at. `b0` in round 3 is a
different passage from `b0` in round 2, so nothing about a block is quotable,
addressable or hashable across rounds. The new `changes[]` model sits **beside**
the rounds rather than replacing them: a counterparty redline is filed as a
round (unchanged wire format, so every existing review path, export and test
reads what it always read) **and** as fingerprinted changes. Where the two
disagree, the round is the wire format and the changes are the working set.

## B-001 — 2026-07-27, Phase 2. A clause id is not a DOM id.

`#nw-clause:2.` is not a selector, it is a parse error: `:` and `.` are CSS
combinators, so `querySelector` **throws** rather than returning null.
`getElementById` does not care, which is why the first version worked — and
would have left a trap for the next person to reach for a selector.

Fixed by slugging element ids (`negoDomId`) while the real clause key travels in
`data-clause`, where an attribute selector can match it safely.

## B-002 — 2026-07-27, Phase 3. The portal called `persist()`.

The counterparty's page holds a **copy** of somebody else's contract, assembled
from the share payload. The shared component called `window.persist(c)` after a
decision, which on a no-login opaque origin throws
`SecurityError: localStorage is not available for opaque origins` — killing the
click handler silently. Erik pressed Accept and nothing happened, with no error
visible to him.

Fixed by rendering the portal's copy with `persist:false`. Decisions live in
`PORTAL_NEGO_DECISIONS` until they are sent. Found by writing
`f37` — "his decisions are held on the page until he sends them".

## Decision — 2026-07-27, Phase 3. No per-change write endpoint.

The obvious way to make Erik's decisions stick would be a `PUT` per change on
the share token. Rejected: that is a public, no-login URL that mutates a
contract on every click. Decisions ride the response route that already carries
a redline, as `negoDecisions`, and `applyResponse` runs them through
`negoResolve` — so there is no second path into the document and therefore no
second set of rules about what is allowed to enter it.

`applyResponse` also refuses a decision on the sender's **own** ask, so "nobody
rules on their own proposal" is enforced on the record and not only in the UI
(`f37` — "he cannot rule on his own ask even by posting a response directly").

## Deliberate deviation — 2026-07-27, Phase 3. What "replace the textarea" became.

The brief says to replace the portal's single-textarea redline view with the
shared component. Two surfaces existed there, not one: a per-clause editor
(already the primary path, added in an earlier session) and a whole-document
textarea behind "Edit the whole document instead".

What was done: the shared Negotiation component is now the counterparty's **view
of the negotiation** — every fingerprint, every status, accept/reject/discuss on
our proposals. The clause editor and its textarea escape hatch remain as the
**authoring** surface behind "Propose edits", because that is what feeds the
established wire format that ~40 existing tests and the whole owner-side review
path depend on. Replacing the authoring surface as well would have been a
rewrite of the response protocol, which the "do not destroy the working
platform" rule forbids. Recorded here rather than quietly done.

## B-003 — 2026-07-27, Phase 4. The permission gate ignored its own subject.

`negoResolve` guarded with a bare `canEdit()`. `js/core.js` declares
`const canEdit = () => …` — a **lexical** binding, not a property of the global
object. Under ES modules a bare `canEdit()` in another file resolves to
`window.canEdit` (the property `Object.assign` created) and the two are the same
function. In one shared script scope — which is what `vm.runInContext` gives the
test stages — the lexical `const` shadows the property, so the bare call
resolved past every substitution of `window.canEdit` and the check silently
ignored its own subject.

Symptom: every decision in the six-round scenario returned null with
"Viewers cannot decide changes", on a stage where `canEdit()` had been set to
return true.

Fixed by reading the permission through `window.canEdit` explicitly, and by
normalising **every** global this module reads — `nowISO`, `currentUser`,
`todayStr`, `isUpload`, `emailOff` — to the same `window.` form. Uniformity is
the point: the mixed style was the bug.

## B-004 — 2026-07-27, Phase 4. Uploaded Word contracts lost their formatting on the first accepted change.

The worst defect this session, and it only showed up at six rounds' distance.

Intake lifted extracted Word text with `textToRich()`, which splits on **blank
lines**. Extracted Word text has none — `docxExtract` emits one line per
paragraph — so an entire contract became a single `<p>` with `<br>` between the
clauses.

That reads correctly through `richToText()`, which is why it looked fine. But
`_lineUnits()` in `richFromTextEdit` maps every one of those lines to the **same
`<p>` node**, so rewriting one clause rewrote the whole paragraph and took the
other clauses with it. The verification at the end of `richFromTextEdit` caught
the damage and refused — exactly as designed — and `negoCommitText` fell back to
plain text. So the failure mode was not corrupted text; it was an uploaded
contract silently losing its headings and clause numbering on the first accepted
change, with the record correctly saying so and nobody reading it.

Fixed with `negoRichFromLines()`: one Word paragraph → one block, which is what
a Word paragraph is. The first heading line becomes `<h1>` (the title), later
ones `<h2>`, decided by `docLineKind()` — the same function the clause
segmentation uses, so the two cannot disagree about what is a term and what is a
label. `textToRich()` is untouched; it is still right for its own job (a
plain-text body opened in the rich editor).

Caught by `scenario3` — "six rounds — uploaded Word file", asserting
`docFormat(c.format) === 'rich'` after round 6.

## B-005 — 2026-07-27, Phase 4. Open points vanished when a round closed.

`negoOpenPoints` read only `c.changes` — the round in flight. `negoAdvanceRound`
archives a round's changes onto the record and clears that array, so every
earlier refusal disappeared from the list at the moment the round closed. A
rejected change that simply vanishes reads as agreement, which is the precise
failure the list exists to prevent, arriving through the back door.

Fixed by reading `negoAllChanges(c)` and applying the two ways a point stops
being open — the reasoning `openPointsFor()` in `js/versioning.js` already
worked out and which is deliberately not re-derived: they got the wording
anyway, or the passage it was measured against is gone.

The second case is the interesting one and `scenario3` pins it: Erik asks for 30
days' notice and EUR 250,000, is refused both, and the parties later settle on 45
days and EUR 500,000 per event. He got neither thing he asked for and both points
are spent, because the clauses they were measured against no longer exist.

## Note — 2026-07-27, Phase 5. PDF export has no direct test, and did not before.

`js/pdfrich.js` is unmodified and has no direct automated test — that was true at
the baseline too, and this session did not close the gap. `CHECKLIST.md` records
the line as unmodified-and-non-interfering rather than as test-covered, because
claiming otherwise would be exactly the thing the honesty rule forbids.

## Result

Six defects and one environment trap found; all six fixed. **625/625 green,
twice consecutively on a clean clone.** 513 baseline tests unchanged and still
passing, 112 new. No rollback was required, and
`checkpoint-pre-negotiation-tab` still marks the pre-session state if one is
ever wanted.

---

## U-001 — 2026-07-27, post-merge. The tab was unstyled after any repaint.

Reported from the running app with a screenshot: the Negotiation tab rendered as
a flat wall of text — "Baseline v0read-only reference", the whole document in one
column, no panes, no badges, no index.

The markup was intact; only the CSS was missing. `negoStyleHtml()` emitted a
`<style>` block **inside the host element**, guarded by a module-level
`_negoStyled` flag so it was written only once. Both halves were wrong together:

- every render does `host.innerHTML = negoTabHtml(...)`, which destroys the
  stylesheet along with everything else;
- the flag then refused to put it back.

So the tab was styled the first time it was opened and unstyled from the second
render onward — switching to Docs and back, deciding a change, or any
`renderWorkspace()` repaint. Reproduced in four lines:

```
render 1 — stylesheet present: true
render 2 — stylesheet present: false
   .nego-work still in markup: true
```

Fixed with `negoEnsureStyle()`, which appends the stylesheet to `<head>` and
returns early if `#nego-style` already exists. It now survives every `innerHTML`
assignment in the document and nothing has to remember anything; `_negoStyled` is
gone.

**Why the tests missed it, which is the more useful half.** Every existing
assertion on the stylesheet ran immediately after the *first* render — the one
case that worked. `f36` now has five tests that re-render first: after a second
`renderNegotiationTab`, after accept / reject / discuss, that it lives in
`<head>`, that re-adding never yields two copies, and that the markup carries no
`<style>` of its own any more.

## U-002 — 2026-07-27. Fingerprint badges were clipped to "G-001".

Found by rendering the real component in Chromium against the app's own tokens
and looking at it, rather than by a test.

`.nego-badge` is `position:absolute; right:calc(100% + 6px)`, which puts it
outside its clause's box — that is the margin anchoring the design is built on.
But the clause box starts at the document's own padding, so the badge landed
outside the pane's content box and was clipped by the pane's `overflow`.
`#CHG-001` read as `G-001`, and worse once accepted, because the ✓ makes it wider.

`prototype.html` has the same latent problem. It escapes it only because its
document never reaches its own `max-width` at the viewport it was drawn for.

Fixed by reserving the space — `.nego-pane.working .nego-doc{padding-left:100px}`
— rather than moving the badge inboard, which would have thrown away the margin
anchoring. Below 900px the gutter costs more than it is worth, so the badge
becomes `position:static` and sits above its clause instead: still attached to
the right clause, still the same fingerprint, no longer in a margin there is no
room for.

## U-003 — 2026-07-27. The change index was pushed off the side of the screen.

Same Chromium session, at an 860px viewport: the index pane overflowed the
viewport and its cards were cut off mid-word.

Two missing declarations, both the same mistake in different places:

- `#nego-root` is a flex *item* of `#nego-tab`. Flex items stretch on the cross
  axis but size to **content** on the main axis, so a root holding a 720px
  document simply grew wider than its parent. It needs `flex:1; width:100%;
  min-width:0`.
- `.nego-work` is a grid whose columns hold documents, and a grid will not shrink
  below its content's intrinsic width without `min-width:0` — the exact
  counterpart of the `min-height:0` that was already there.

## Note — how U-002 and U-003 were verified, and what the suite can and cannot do.

jsdom has no layout engine: `getBoundingClientRect` returns zeros, so **no test
in this suite can measure a pixel**. Neither of these two bugs was findable here,
and saying otherwise would be the kind of claim `CHECKLIST.md` exists to avoid.

They were found and fixed against real Chromium (pre-installed at
`/opt/pw-browsers/chromium`), rendering `js/views/negotiation.js` with the design
tokens extracted from `index.html`, measuring each badge's position against its
pane's box at 1600px and 860px, and screenshotting all three states. After the
fix every badge sits inside its pane at both widths.

What the suite now carries is **rule-level** assertions — that the gutter rule,
the `min-width:0`, the `position:static` fallback and the root's flex
declarations are present. Those cannot prove the layout is right; they stop the
rules being deleted again. Closing the gap properly means a browser-driven visual
test in `npm test`, which would add Playwright as a dependency and change how the
suite runs. Not done unilaterally — flagged as the honest next step.

## Result of this pass

Three defects, all visual, none of them reachable by the existing suite. Suite
now **633/633**, up from 630 by the eight new regression tests. `js/views/negotiation.js`
is the only source file touched.

---

## D3 — SUPERSEDED, 2026-07-27. The prototype's look wins after all.

D3 above recorded swapping the prototype's tokens for HaTi's, on the brief's
instruction to match the live design system "where they genuinely conflict".
That reading was too broad and the decision is **reversed** at the user's
direction, having seen both.

The negotiation is a distinct focused mode, and it looks like one:
Georgia on paper for the documents, the slate `#33475c` bar, the cool
`#f2f4f7` canvas, the prototype's `--ins`/`--del` ramp. HaTi's tokens no longer
appear anywhere in the component, in the stylesheet or in its inline styles.

What makes that safe is scoping, and it is asserted rather than asserted-to:
the tokens are declared on `.nego-room, #nego-root` and never on `:root`, and
`f36` walks **every selector in the sheet** and fails if one of them is not
namespaced to the component. A `:root` block here would restyle the whole
product from inside one screen.

## U-004 — 2026-07-27. The tab was a panel; it needed to be a room.

Reported with a screenshot: the two documents were too small to read. The cause
was structural rather than a bug. The negotiation rendered as a tab **inside**
the contract workspace, below the workspace header, the action bar, the
returned-changes strip and a tab row — so three panes shared whatever height was
left, and the two documents about half the width between them. Putting a
baseline and a working copy side by side and then making both unreadable defeats
the entire point of the layout.

It is a full-window mode now:

- `openNegotiationRoom()` mounts it over the viewport and hides the app shell,
  recording on the shell that **it** was the one who hid it, so closing cannot
  reveal something the room did not conceal.
- The `Doc ›` breadcrumb is the way out, because it already reads as where you
  came from; `Esc` does the same, and the handler is taken down on exit so a
  stray key cannot re-fire it.
- Both entry and exit are idempotent. A mode you can enter twice is a mode you
  can get stuck in.

Measured in Chromium at 1600px: the room fills the window, the shell is hidden,
panes are 576 / 677 / 335 and the document column is **777px tall** against the
few hundred it had as a tab.

## U-005 — 2026-07-27. Sliders in both gaps, and a foldable index.

`--nego-f` (the baseline's share of the document space) and `--nego-c` (the
index's width) drive the grid; the drag writes them straight onto the element
rather than through a re-render, so a drag does not rebuild two documents on
every pointer move. Both are clamped — 20–80% and 240–560px — so no pane can be
dragged out of existence, and both are remembered per browser under
`hati.v1.negoLayout`, the same way the Docs page already remembers its divider.
Double-click resets. Folding the index hands its whole width to the documents
and leaves a "Show index (n)" control.

Verified in Chromium: default 576/677/335, dragged to 777/476/335, folded to
733/861. No overflow and no badge clipping at 1600 or 1024.

## U-006 — 2026-07-27. The redline was correct and unreadable.

Visible in the very first room screenshot. A longest-common-subsequence diff
latches onto whatever words two versions happen to share, so a **rewritten**
clause came out interleaved:

> the EUR full 250,000 replacement in value the of aggregate the per affected
> contract goods. year.

Every token was in the right box and the passage could not be read. Note this is
not new — `wordDiff` has always done this and the existing compare modal has the
same behaviour — but the room puts it at the centre of the screen.

`negoDiffHtml` now measures whether a diff is *shredded*: six or more separate
change runs and more than 45% of the clause rewritten. Above that it falls back
to the prototype's own `runDiff` — common prefix, common suffix, one deletion
and one insertion between, cut on whitespace so no word is ever split. Below it,
LCS keeps its precision, because striking a whole sentence to change two words
would be the opposite mistake.

The first attempt at the test for this counted contiguous *groups* rather than
runs, and never fired: a rewrite's runs are separated by single spaces, so
anything treating whitespace as a boundary sees one enormous group.

`f36` pins both ends — word-level for a two-word edit, one clean pair for a
rewrite — plus the invariant that context-plus-deletion reconstructs the old
wording exactly and context-plus-insertion the new, so nothing is invented or
lost by the coalescing.

---
---

# Session: rebuild clause tracking on the real clause model
**2026-07-27** · branch `claude/new-session-7glnhu` · checkpoint tag `checkpoint-pre-real-redline`

The negotiation room's UI shell was right and is kept. Its clause foundation was
wrong, and that is what this session replaced. Everything below is timestamped
to this session and appended; nothing earlier was edited.

---

## Phase 0 — the before-evidence, measured

### D5 — clause identity was fake, and worse than the brief estimated

Ran **prototype.html's own six-clause contract** through the then-current
`negoClausesOf()`. The brief predicted 8 fragments on its 3-clause sample. On
the real six-clause document the answer was **fourteen**:

```
COUNT: 14   (the prototype says 6)
{"id":"clause:#0", "num":"","title":"","kind":"text","text":"Warehousing and Logistics Services Agreement…"}
{"id":"clause:#1", "num":"","title":"","kind":"text","text":"Between Wanjiru Catering Ltd (Nairobi, Kenya) and Nordfrakt …"}
{"id":"clause:#2", "num":"","title":"","kind":"text","text":"Clause 1 · Scope of Services…"}
{"id":"clause:#3", "num":"","title":"","kind":"text","text":"The Provider shall receive, store, handle, and dispatch the …"}
{"id":"clause:#4", "num":"","title":"","kind":"text","text":"Clause 4 · Payment Terms…"}
{"id":"clause:#5", "num":"","title":"","kind":"text","text":"All invoices are payable within thirty (30) days from the da…"}
… (14 in total)
```

Three distinct failures, each fatal alone:

1. **Every heading became a clause body.** "Clause 4 · Payment Terms" contains
   lowercase, so `docLineKind()`'s all-caps test rejected it and it was filed as
   a negotiable term. The document's *labels* became things you could redline.
2. **Every title and number was empty.** `negoClauseLabel()` therefore fell back
   to the clause's own first 60 characters, so the change index named clauses by
   quoting them at you.
3. **Every id was a line index** (`clause:#3`). Insert one clause above clause 4
   and every change filed against clause 4 now points at clause 5's wording.

The rich document already carried `<h2>` elements saying exactly where each
clause began. The flattening threw that structure away and then guessed at it.

Reproduction script: `test/f40-clause-model.test.js` asserts the corrected
behaviour on the same input; the raw before-output above was produced by running
`negoClausesOf(richToText(protoRich()))` on the pre-checkpoint tree.

### Baseline
Full suite at the checkpoint: **664 tests / 146 suites / 0 fail**, 35.5s.
Tag `checkpoint-pre-real-redline` cut before any change.

---

## Phase 3 — the diff engine, before and after

Measured on a 2,000-word clause (~4,000 whitespace tokens per side) with ten
amendments spread through it — a delivery schedule, the kind a real contract
carries.

| | time | memory |
|---|---|---|
| `wordDiff()` (LCS table, js/versioning.js) | **199.8 ms** | **61.0 MiB** (3999 × 3999 Uint32 cells) |
| `redlineOps()` (Myers O(ND), js/redline.js) | **3.7 ms** | no table |

**54× faster and the allocation is gone.** The brief quoted 481ms for the old
path; this machine is faster than the one that measured it, and the ratio is the
number that matters. The memory figure is the more serious of the two: 61 MiB
for *one clause* means a document with six schedules cannot be diffed on a
phone.

The cost difference is structural, not a micro-optimisation. The LCS table's
cost depends on LENGTH; Myers' depends on EDIT DISTANCE, and a schedule with ten
amended lines has a tiny one.

Worst case is bounded too: a 2,000-word clause rewritten wholesale takes 12.8 ms
because the search gives up at a budget (`REDLINE_MAX_D = 600`) and the passage
is rendered as one deletion plus one insertion.

**That budget is not a performance hack bolted on the side — it IS the U-006
readability rule.** Past a certain edit distance the two texts are not one text
with changes in it, and any token-level alignment is the interleaved confetti
U-006 was raised about. The old code detected shredding *after* the fact
(`_negoShredded`) and swapped in a different diff; here one mechanism produces
both properties. `js/versioning.js`'s own `wordDiff()` and the version-compare
modal are untouched.

---

## Defects found and fixed while doing the work

### B-006 — the share payload sent the baseline's text shadow, not the document
`buildSharePayload()` carried `negotiation.baselineText` only. The counterparty's
page therefore re-segmented the document from its text projection and minted
**fresh clause ids**, so every fingerprint the owner had filed pointed at a
clause that did not exist on the other side's screen. Caught by f37's
"identical on both sides" assertion the moment clause ids became real.
Fixed: the payload carries `baselineBody` (which holds the ids), the stored
`ops`, `hashV`, `prevChangeHash` and `seq`; `portalNegoContract()` restores them
instead of rebuilding.

### B-007 — `sha256()` fell back to a 32-bit rolling hash without saying so
`crypto.subtle` exists only in a **secure context**. A share link opened over
plain `http://` — a hotel captive portal, an office proxy, exactly where a
counterparty opens one — has no `subtle`, and `js/core.js` then returned a
32-bit rolling hash repeated eight times to look the right length. Nothing
recorded that this had happened.

This is squarely in scope: a "Verified" pill sitting on top of a trivially
collidable digest is worse than no pill. The fallback stays (a thrown exception
mid-save is worse than a weak fingerprint) but it is now **recorded**:
`sha256IsReal()` reports it, and `verifyChangeChain()` returns
`reason:'weak-digest'` rather than `ok:true` — "two weak digests agree" is not
evidence about a legal document. Test: f35 "a chain built on a weak digest is
reported unverifiable, never verified".

Found because `test/portalworld.js` boots `js/core.js` while `test/world.js`
supplies its own Node-crypto `sha256`, so the two stages disagreed about a hash
over byte-identical input. Both stages now redefine `window.crypto` from Node's
webcrypto — `Object.defineProperty`, because jsdom exposes `window.crypto` as a
read-only accessor and a plain assignment silently does nothing.

### B-008 — the whole-document text route still flattened clause markup
A proposal arriving as TEXT (a returned `.docx`, a pasted redraft) was lifted to
`<p>` blocks per line and used as the change's `bodyHtml` directly, so accepting
it replaced an `<ol start="3">` with a flat paragraph. This is the B-004 failure
class re-entering through a different door. Fixed: a text-derived proposal is
merged back into the baseline clause's own markup via `richFromTextEdit()`
(`negoBodyFromText()`), which verifies its own output and falls back per clause
rather than per document. Test: f37 "the formatted document is negotiated clause
by clause on both sides".

### B-009 — synchronised highlighting never worked in the room
Found in the Chromium pass, not in jsdom. `negoFocus()` looked up
`document.getElementById('nego-root')` and returned early if absent. The
embedded tab mounts `#nego-root`; the **full-window room mounts `.nego-room` and
has no `#nego-root` at all** — so clicking a change card in the mode the
component mostly runs in lit up nothing. The markup was correct in both modes,
which is exactly why 25 rule-level tests were happy with it. Fixed by falling
back to `#nego-room`. This is the single clearest argument for the Chromium
requirement in the brief.

### N-002 — `file://` aborts `js/core.js` partway through
The first Chromium harness opened the page as a `file://` URL. On an opaque
origin Chromium throws on the first `localStorage` access, which aborts
`js/core.js` mid-evaluation and leaves every `const` after that point
permanently in the temporal dead zone — surfacing as
`Cannot access 'currentUser' before initialization` from an unrelated function.
Not a product defect; the harness now serves over `http://127.0.0.1`.

---

## Decisions recorded rather than asked

**D6 — clause TITLES are not negotiable wording in v1.** The brief settles the
hash input as `contractRef | clauseId | changeType | oldText | newText | author
| createdAt | prevChangeHash`, and states that `num` and `title` are
presentation recomputed on render. Taken literally that leaves a hole: a title
edit would be untracked, and a counterparty renaming "Liability Cap" to
"Liability" would be a silent document change.

Rather than deviate from the settled canonical string, the *edit path* is
scoped: inline editing edits a clause's BODY. A clause's heading changes only by
`insertClause`/`deleteClause`, both of which are tracked, hashed and decided
normally. `clauseReplaceHeading()` exists for renumbering, which is presentation
and deliberately produces no change record. There is therefore no untracked edit
path — the hole is closed by removing the door, not by widening the hash.
Tracking title edits as their own op is the obvious v2.

**D7 — the chain has two kinds of link, and that is deliberate.** §1.4 says
`prevChangeHash` chains in creation order; §1.5 says a revision chains onto the
previous revision's hash. Those are different predecessors whenever anything was
created in between, which in practice is always. Implemented as both: a NEW
change chains onto the contract's chain head, a REVISION chains onto that
change's own previous hash. `seq` is stamped on every issuance either way, so
creation order survives independently, and `verifyChangeChain()` rebuilds both
expectations from stored content — a reordered or removed issuance shows up as a
broken link rather than passing quietly.

**D8 — scenario3's fixture is ALL-CAPS headed, and it has to be.** The fixture
rule asks for prototype-shaped headings ("Clause 4 · Payment Terms"). A mixed-
case heading cannot survive `.docx` extraction: extraction yields lines, and the
only heading signal left in a line is that it shouts. So the one fixture that
must be produced **identically by all three intake paths** uses ALL-CAPS
numbered headings, and keeps every other property the rule asks for —
non-contiguous numbering 1/4/5/6/9/12, multi-sentence bodies, two
multi-paragraph bodies. The mixed-case style is covered against the rich paths
in f35 and f40, and the headingless document in f40.

**D9 — "one version per closed round" is asserted as coverage, not as a count.**
`captureVersion()` deduplicates: a snapshot whose text and canonical form match
the previous one is the same version. Closing a round straight after the last
decision legitimately adds no record. Asserting the count went up would be
asserting version *spam*, so scenario3 asserts instead that the wording as it
stood at each round close is on the version list and can be compared against.

---

## Chromium verification — measured, not asserted

`node test/chromium/verify.js` · Chromium at `/opt/pw-browsers/chromium` ·
viewport 1440×900, deviceScaleFactor 2 · **21/21 checks passed** ·
screenshots in `test/chromium/shots/` (gitignored; regenerate with the script).

Rendered with prototype.html's own six-clause contract (clauses 1, 4, 5, 6, 9,
12) and Erik's four asks.

| what | measured |
|---|---|
| clauses in each pane | 6 working, 6 baseline |
| clause titles | `Clause 1 · Scope of Services` … `Clause 12 · Governing Law and Disputes` |
| numbering read from the headings | `1,4,5,6,9,12` |
| badges | 4 — one per **changed** clause; clauses 1 and 12 clean |
| a rewritten clause (clause 6) | **1** `.nego-del` + **1** `.nego-ins`, not interleaved |
| deletion run | `"the full replacement value of the affected goods."` |
| insertion run | `"EUR 250,000 in the aggregate per contract year."` |
| a small edit (clause 4) | `["thirty (30) days from the date of issue (Net-30)."]` → `["forty-five (45) days from the date of issue (Net-45)."]`, untouched sentences plain |
| badge vs text column | badge right edge **624px**, text column left edge **642px** → genuinely in the margin |
| three panes | baseline **503×765 @0**, working **590×765 @509**, index **335×765 @1105** |
| horizontal scroll | `scrollWidth 1440 ≤ innerWidth 1440` — none |
| sync highlight on card click | baseline 1, working 1, card 1, badge 1 |
| Verified pill | `Verified` with `data-verify="ok"` — after the chain was walked, not before |
| status strip | `Fingerprints: 4 verified` |
| clause tools on hover | opacity 1, left **1046px** ≥ text right **1028px** — opposite margin, `[Edit, Add clause, Delete]` |

The first run was 19/21. Both failures were real: B-009 above, and a
`/favicon.ico` 404 requested by the browser itself, which is now excluded by
name rather than by loosening the check.

---

## Regression

| run | result |
|---|---|
| baseline at checkpoint | 664 tests / 146 suites / 0 fail |
| clean checkout, fresh `npm install`, run 1 | **701 / 147 / 0 fail** |
| clean checkout, run 2 | **701 / 147 / 0 fail** (39.0 s) |

Test count moved 664 → 701. The old `f35` and `scenario3` were rewritten rather
than extended — their fixtures had been shaped to fit the implementation, which
is the failure the fixture rule exists to prevent — so this is not 664 + 37 new.

**PDF export has no direct automated test and never did.** It is recorded here
as **unmodified and non-interfering**: nothing in this session touched
`js/pdfrich.js`, and it reads the document body through the same accessors it
always did. It is NOT recorded as covered.

---

# Follow-up: the phantom-change bug, Ask Copilot, and the Share summary
**2026-07-27, later** · branch `claude/new-session-7glnhu`

## B-010 — opening a contract invented changes nobody had made

**Reported from the product**, with screenshots: a contract (MK-194) was opened,
nothing was edited, and the negotiation screen immediately showed a large red
strikeout across the end of "Clause 10 · MISCELLANEOUS" plus a brand-new clause
`#CHG-003` titled "BUYER: SUPPLIER:". Both were fiction — the wording on the two
sides was identical.

**Reproduced before fixing**, on a document shaped like the screenshot:

```
clauses in the baseline           : 1
changes filed by an UNEDITED load : 2   <-- must be 0
    CHG-001 modify        "GULIZ LLC gg By: ______ By: ______"
    CHG-002 insertClause  "(Attach technical parameters, grade levels here)."
```

which is exactly the reported `#CHG-002` strikeout and `#CHG-003` new clause.

**Mechanism.** A proposal arriving as TEXT was rebuilt into a document by
`negoRichFromLines()`. That function has only the lines to go on, so it decides
what is a heading with `docLineKind()` — which promotes any line in CAPITALS.
Real contracts keep the signature block and the schedule titles in capitals on
their own lines:

```
BUYER: SUPPLIER:
SCHEDULE A: MATERIAL SPECIFICATIONS
```

In the SOURCE document those are `<p>` inside the miscellaneous clause. Rebuilt
from text they became `<h2>`, opening clauses the baseline did not have — so the
clause they were sitting in read as truncated (phantom `modify`) and each
promoted line read as new (phantom `insertClause`).

**Fix.** The baseline already knows the document's shape. `richFromTextEdit()`
maps new lines onto the baseline's OWN block structure — a paragraph stays a
paragraph, a list item stays a list item — and verifies its own output before
returning it. So a text proposal is segmented exactly as the baseline is, and
only wording that genuinely moved can register. `negoRichFromLines` remains the
fallback for the one case it is right for: a document with no prior structure to
preserve. (`negoProposedBodyFromText`, js/negotiation.js.)

**Test.** `f41-no-phantom-changes` (7), pinning the invariant bluntly because
that is what failed: **round-tripping a document without editing it files
nothing.** Checked on the reported shape, on all three intake paths, on a
headingless document, and on one whose headings really ARE in capitals — plus
the opposite assertion, that a genuine edit is still caught and only it, since
an easy way to pass the first half is to stop detecting changes at all.

**Related, and worth stating:** this is the same family as B-008 (the accept
path flattening `<ol start="3">`). Both come from treating the text projection
as if it were the document. The projection is a READ of the document; anything
that rebuilds a document from it has to be handed the structure to rebuild into.

## B-011 — the room never re-verified after a decision

Found in the Chromium pass. `negoRefreshVerification` was kicked off inside
`renderNegotiationTab` only. The full-window room has its own render path
(`openNegotiationRoom`), so after any decision — which invalidates the
verification cache — the pill and the status strip sat on "Checking…"
permanently. Third instance of the same room-vs-tab divergence (B-009 was the
first). Fixed by extracting `negoAfterPaint()` and calling it from both, rather
than adding a second copy that can drift again. Chromium check: "after a
decision the room re-verifies rather than sitting on checking…".

## Ask Copilot in the negotiation room

Added to both sides' top bars. **The engine is reused, not reimplemented** —
`copilotAsk()` in js/ai.js, the same brain the rest of the app uses. What is new
is the surface and the context.

The dock is rendered INSIDE the room. The application's own Copilot panel lives
in the shell, which the full-window room covers, so opening that one from here
would slide a panel in behind the page being looked at. Verified in Chromium by
hit-testing the dock's centre point (`elementFromPoint`), not by reading a
z-index.

Two capabilities behind one box, and it is explicit about which is running:

- **Search always works.** `negoSearch()` reads clauses and change records
  already in memory — no key, no network — so "where does it say ninety days" is
  answerable offline. One row per clause however many times the word occurs
  (extra occurrences are counted, not repeated). Proposed wording that exists
  only as a change is findable and reported as proposed, not as the contract.
  Every result is a button that jumps to the clause.
- **Prose answers need an Anthropic key.** Without one the dock says so
  (`Search only` pill, and a note on the first ask) rather than appearing broken.

**Copilot reads the contract; it never edits it.** Asserted in the least
convenient way available: `copilotAsk` is stubbed to answer *"I have updated
clause 4 to Net-60 for you"* and the test asserts the wording is unchanged, no
fingerprint was filed and no version was captured. A machine quietly altering a
legal instrument is the failure the whole change model exists to prevent, and a
chat box is not a way around it. Test: `f43-ask-copilot` (18).

## Share opens on what you are sending

`openShareModal` was one step: recipient fields. It asked someone to dispatch a
contract to another company without once showing them what had changed since it
last went out.

Now two: **what you are sending** → Next → the existing send form, unchanged.
The summary is built by `negoChangeSummary()` from the change records — each
line is the sentence its proposer typed, or the mechanical "what goes → what
arrives" from its stored ops. Editable, because a covering note is the sender's
to write; but nothing composes prose about a legal change.

It travels: into the message body, and onto `payload.contract.changeSummary` so
the counterparty's landing page shows it (`portalChangeSummaryHtml`) to someone
opening the link a week later.

Both steps are built once and toggled rather than re-rendered — the send form
wires a dozen listeners by id, and rebuilding it on Next would mean wiring them
all again, where the first one forgotten is a silent dead control. The readiness
blockers stay on step 2, next to the button they block.

Test: `f42-share-summary-step` (15).

## Test-stage findings (not product defects)

- **N-003.** `test/portalworld.js` boots on an OPAQUE ORIGIN, where
  `localStorage` throws — deliberate, since that is the counterparty's own
  situation. But `openShareModal` is an OWNER action needing a signed-in user,
  and js/core.js reads the session from `localStorage`. It cannot be faked by
  assigning `window.currentUser`: core.js declares it as a lexical `const`, so
  its own callers resolve to that binding and never see a replacement — the same
  trap `negoResolve` documents for `canEdit`. `buildPortal({url})` now lets a
  test ask for a real origin; the default is unchanged.
- **N-004.** The Chromium harness was missing `.hidden{display:none!important}`,
  which index.html defines and the share dialog toggles between its two steps.
  Both steps rendered at once — the harness measuring its own omission. It now
  lifts index.html's `<style>` blocks at load rather than keeping a copy, since a
  copy would drift from the stylesheet that actually ships.

## Chromium

`node test/chromium/verify.js` — **31/31**, up from 21. New checks cover the
Copilot dock (hidden → open, inside the room, hit-testable on top, mode label,
search returning clickable results), the Share summary step (opens on step 1,
lists the fingerprints, prefilled from the record, Next reveals the form with a
way back) and the room's re-verification after a decision. Screenshots
`05-copilot.png`, `06-share-summary.png`, `07-share-send.png`.

## Regression

**741 tests / 154 suites / 0 fail** (was 701 before this follow-up, 664 at the
session checkpoint).

---

# Follow-up 2: six reports from using the product
**2026-07-27, evening** · branch `claude/new-session-7glnhu`

## B-012 — the discussion box swallowed the space bar

Reported with a screenshot: you could type words into a change's reply field
and not put spaces between them. Pressing Space did nothing.

**Mechanism.** The change card is keyboard-focusable — it acts as a button, so
Enter/Space select it — and its keydown handler called `preventDefault()` on
Space unconditionally. The reply input sits INSIDE the card, so every space
typed into the input bubbled up to the card and was cancelled before the
browser could insert the character.

**Fix.** The rule the handler should always have had: a container that behaves
like a button answers keys only when IT is the event target, never when the
focus is in a field inside it (`e.target !== card → return`). `f44` checks the
reply field, checks every other text field in the room for the same trap, and
checks the card KEPT its keyboard behaviour — the fix is a narrowing, not a
removal. The Chromium pass types "Net-45 works for us" with the real keyboard
and reads the value back.

## B-013 — the clause tools were hiding

Edit / Add clause / Delete appeared on hover only, anchored in the pane margin
where the pane edge CLIPPED them, in a pale outline. They are the only way to
propose anything now that the whole-document editor is gone — hiding them hid
the feature. Now: always drawn, on their own row inside the clause, in the
room's slate (Delete in the del red).

**First attempt was wrong and the screenshot caught it:** absolute-positioning
them top-right meant reserving 210px of heading width, which wrapped
"Clause 1 · Scope of Services" onto two lines in BOTH panes — including the
baseline pane, which has no tools at all. Moved to a normal flex row; nothing
is floated over text and nothing reserves space in a pane that doesn't need it.

## B-014 — "Send to the counterparty" sent nothing

The turn banner's Send button flipped the turn, snapshotted a version, wrote an
audit line — and told nobody. The contract read "Waiting on Nordfrakt — sent 2h
ago" while no link, no email and no share record existed.

Now it takes the SAME route as Share Link: summary step → send form → real
share. The rule that makes it honest: **the turn moves only in the `onSent`
callback** — i.e. only when a share was actually created. Close the dialog, or
fail to send, and it is still your turn, because it is. Step 1 additionally
warns "Sending this closes your turn" when opened from this button
(`opts.handOver`), because that consequence belongs on the screen before the
press, not after. Both entry points kept: Share Link shares a copy; Send closes
your turn — same dialog, different consequence, each labelled. `f45` (10).

## Propose edits removed

From the owner's bar, the counterparty's bar and the embedded tab header. It
opened a modal holding the entire document in one box — the surface B-010's
phantom changes arrived through, and the one that could not keep a heading or a
list. A clause is edited where it is read. f38's assertions updated to state
the new intent: `#nego-propose` must NOT exist, and every clause offers Edit.

## Ask Copilot is now the application's own panel

The bespoke dock built earlier today is deleted — markup, styles, search UI and
all. It was the wrong call: a lookalike that would drift from the real panel,
which is precisely the reasoning the user gave when reporting it.

The actual blocker was stacking, not styling: the room is `position:fixed` at
z-index 60; `#ai-panel` lives in the app shell at z-index 50, so opening it put
it BEHIND the room. Fix: `body.nego-room-open #ai-panel{z-index:70}` (scrim 65),
applied only while the room is open, and removed on exit. The button calls
`openAI()` — the app's own function. Context still travels: `negoRoomContract()`
tells `aiChatContext()` (js/ai.js) what the room is showing, so Copilot knows
the clauses, the changes and whose turn it is. `f43` rewritten (10);
Chromium hit-tests the panel's centre after the 300ms slide-in — measuring
immediately catches it mid-flight at x=1462, off-screen (that cost one red run).

The Chromium harness now lifts `#ai-panel` and index.html's `<style>` blocks out
of index.html itself (synchronous XHR, harness-only) instead of keeping stub
copies — a stub was exactly why the hit-test failed first time (N-004 again).

## Version selectors on both panes (f46)

The pane headers are dropdowns over every snapshot the contract carries — the
live pair first (still named "Original Baseline" / "Working Version", the
prototype's own words), then `captureVersion` records newest-first.

**The rule that governs the mode:** a comparison of two OLD versions is
HISTORY. Its differences were never proposed and there is nobody to accept
them. So any non-live pair puts the screen in a read-only comparison: an amber
banner that says so, no badges, no Accept/Reject on cards, bulk verbs disabled
in the top bar AND removed from the index (first Chromium screenshot showed
"Accept All" still live over a history view — that is the rule leaking at the
top of the page), a differences list in the index instead of the round's
progress, and a solid "Back to the live round" button (the first version was a
ghost button on an amber banner — white on cream, unreadable; the way out of a
mode must be the most legible thing in it).

The comparison itself is clause-by-clause on durable clause ids, so a
renumbered clause is FOLLOWED, not reported as removed-and-added — asserted
directly (`f46` "a renumbered clause is followed"). `negoResetView()` restores
the live pair so a stale comparison cannot follow you to the next contract.

## Two assertions I wrote wrong, corrected against the model

- f45 first asserted the counterparty's banner says "2 changes to review" after
  a hand-over. The model was right and the test wrong: those two pending
  changes are the counterparty's OWN asks, and nobody rules on their own
  proposal — the count is of what the READER must answer.
- f46 first asserted two closed rounds leave ≥4 snapshots. `captureVersion`
  deduplicates identical documents; the honest expectation is one snapshot per
  document CHANGE, and the test now says why.

## Regression

**770 tests / 0 fail** (was 741). Chromium **41/41** (was 31), now additionally
covering: the space bar typed for real, tools drawn without hover and inside
the pane, the version selectors opening on the live pair, comparison mode
refusing decisions, and the exit restoring the live round.

---

# Follow-up 3: Copilot's blindness, editing out of Docs, and the counterparty's page
**2026-07-27, late** · branch `claude/new-session-7glnhu`

## B-015 — Copilot could not answer about the contracts, and was right to say so

Reported with a screenshot: asked "how many additions have i added?", Copilot
replied *"I don't have a tool to track edits or versions within HaTi itself —
that would be a feature of the platform's audit log or document history, which
I can't access."*

**It was not refusing. It was blind.** `copilotDetail()` (server) and
`_localDetail()` (browser-direct) returned metadata, scan findings and body
text — and nothing whatsoever about changes, rounds, versions or authorship.
The honest answer to a question it had no data for is exactly the one it gave,
and the guardrail was never the problem: the system prompt has said *"not a
lawyer… do not give legal advice"* since long before this session.

**Fix: data.** A `negotiation` block now travels with every fetched contract —
round, turn, rounds closed, counts by status, readyToSign, every change with
its id, clause, type, proposer, side, summary, decider, decision time and any
reason given, plus the version list. Bounded at 60 changes newest-first with
`changesOmitted` stated, so a truncated list can never read as a complete one.

**TWO ENGINES, ONE ANSWER.** `copilotNegotiation()` in server/server.js and
`negoCopilotRecord()` in js/negotiation.js. Two implementations because the
server process loads none of the browser modules and the BYOK path never
reaches the server. If they described a negotiation differently, an answer
would depend on which brain happened to be configured — so f47 pins both field
sets, reading the server's source and checking each key. Crude, and it is the
only thing standing between the two and a silent divergence.

**The limit, restated and made visible.** Both prompts now say GUIDANCE, NOT
LEGAL ADVICE in the same terms: explain what a contract says, what changed and
what is unusual; do not say what the law requires, what a clause would mean in
court, whether to sign, or whether to accept a particular change. On a
negotiation it may note that a change is one-sided or unresolved — it may not
recommend a decision. And the limit is now stated to the READER in the panel's
opening message, not only to the model in a prompt they cannot see.

## Editing left the Docs page

`ws-edit` removed. That page reads, checks and signs.

The clause library moved to the negotiation room's top bar (`#nego-insert-lib`,
owner only — the playbook is our negotiating position and the counterparty
never sees it). `pb-insert` removed from the Docs playbook panel.

**The important half is the model, not the button.** `applyClauseRedline()` used
to append the clause onto `c.redlineText` — the document simply grew, with
nothing to review and nothing to accept. It now files a tracked `insertClause`
change with a fingerprint, a hash and a place in the chain. That fixes BOTH
callers at once — the library picker and the playbook review's "apply this
wording" — because the destination changed rather than each button.

## B-016 — the counterparty was sent a lobby, not a document

Their link opened on a card holding a preview of the negotiation squeezed into
a third of the width, behind a button marked "Open the negotiation room".

The room now opens as the page, on first paint, whenever changes are
outstanding. Measured in Chromium against the owner's own numbers: panes
**exactly** 503 / 590 / 335 wide on both sides (height differs by 9px, which is
one banner, and the two sides carry different banners legitimately).

Withheld from their side, each for a stated reason: **Ask Copilot** (reads our
whole portfolio and our playbook), **Save Draft** (our draft state), **Share
Link** (a counterparty who can re-share has published our contract), **Insert
clause** (our library is our position), the **workspace breadcrumb and template
code** (our filing structure), **"Email: Not Configured"** (our server's setup)
and **"Last seen"** (us watching them — showing a reader a log of their own
visits is both odd and none of their business).

**One I nearly got wrong.** My first comment claimed they also lose the index's
bulk Accept All / Reject All. They keep them, and the comment was corrected
rather than the code: those buttons act on OUR asks, and "I agree to all of it"
is a real answer. Withholding the button withholds nothing but their time, and
a lesser screen for the other side is the thing this room exists not to be.
f49 now pins that they DO get them.

## B-017 — the signing view

When every change is resolved, or none was ever proposed, three panes of a
settled change index is a diff of nothing. `portalNegoPhase()` reads the record
and picks the screen:

| state | screen |
|---|---|
| changes pending | the negotiation room, as the page |
| all resolved | Ready to sign, with "Review what changed" back into the room |
| nothing proposed | Ready to sign, saying no changes were proposed |
| superseded / responded | reading only — history is not signable |

The banner accounts for what was settled ("All 3 changes have been resolved — 2
adopted into the wording, 1 not taken") rather than asking someone to sign on
trust.

**Caught by an existing test, and the test was right.** f37 asserts `#pt-nego`
is absent for a contract with no changes — "an empty negotiation is not a panel
worth showing". My first signing view emitted a hidden `#pt-nego` host anyway.
The host exists only so the room has somewhere to render when they press
"Review what changed", and a contract with nothing to review needs neither. The
code was fixed, not the assertion.

## N-005 — a break that a passing-looking check let through

Prompt text written inside a template literal contained the words `negotiation`
and `changesOmitted` **in backticks**, which closed the literal. server.js
stopped booting; it surfaced as `server exited` inside a `before()` hook in
regression.test.js rather than as anything resembling a syntax error. js/ai.js
had the identical break and **nothing noticed at all**, because test/world.js
evaluates only the modules it loads.

Worse, my own pre-check (`new Function(source)`) reported "parses ok" on the
broken file. `node --check` is the real parser and says so immediately.

**f48** now runs `node --check` over every .js in js/, js/views/, server/ and
test/, and separately checks that index.html's `<script src>` list and
js/app.js's import list point at files that exist. Verified against the real
break shape by dropping a file with unbalanced backticks into js/ — it names
the file and the error.

A second, smaller lesson: I had three `npm test` runs going concurrently while
bisecting, which made the suite look like it was hanging. It was contention.

## Regression

**806 tests / 167 suites / 0 fail** (was 770). Chromium **52/52** (was 41),
now additionally measuring the counterparty's panes against the owner's,
their missing owner-only controls, their breadcrumb and their status strip.

## N-006 — two modules, one name on `window`

Found while writing f50, and it had been sitting there quietly.

`js/clausemodel.js` exported `clauseById(html, id)` → a clause of a document.
`js/playbook.js` exports `clauseById(id)` → an entry of the clause library. Both
land on `window`. Every file is its own ES module scope (index.html loads
js/app.js as `type="module"`), so nothing breaks at load — the LATER import
simply wins the name, and a caller of the loser gets a function with a different
signature and no complaint from anyone.

It surfaced only because test/world.js evaluates the modules flat, in one vm
scope, where the second declaration is a hard `SyntaxError: Identifier
'clauseById' has already been declared`. The harness being cruder than the
browser is what caught it.

Renamed to `clauseFindById`. `f48` now walks every `Object.assign(window, {...})`
in js/ and fails on any name claimed twice. It immediately turned up
`approvalState` and `approveContract` as well — and those are **not** a bug:
approvals.js's rule chain deliberately supersedes core.js's legacy
spend-threshold gate, and core.js reads the winner back through
`((window.approvalState)||approvalState)(c)` so its label matches what the sign
panel enforces. They are allow-listed with that reason written down, and the
allow-list is itself asserted to still be doubled — an entry cannot outlive the
decision it describes.

## The gap I had left in my own coverage

The BUGLOG entry above ("Editing left the Docs page") described work that had
**no named test**. The commit removed `ws-edit`, moved the clause library to the
negotiation bar and changed `applyClauseRedline` from an edit into a tracked
change — and the only assertion touching any of it was f49's owner-only control
list.

By this session's own rule that is not DONE. `f50` now covers it: the Docs page
emits no Edit button and nothing is wired to the editor; the editor is kept but
unreachable; Compare / PDF / Share / Import survive; the library is on the
owner's top bar and not the counterparty's; and — the half that matters — a
library pick files a pending `insertClause` change with a fingerprint and a
verifying chain, leaves the document untouched until it is accepted, restores
nothing on reject, and says "proposed" in the audit rather than "edited".

Writing it also turned up one piece of dead wiring: `ws-edit`'s click listener
was still there behind a `?.`, harmless today and an invitation tomorrow.
Removed.

## Regression, corrected

The figure recorded above (806 / 52) was taken before f50 and the collision
guard. Final for this round: **825 tests / 170 suites / 0 fail**, Chromium
**52/52**.

---

# Round: the negotiation room's verbs, the send that did nothing, and the way out

Reported with four screenshots of the counterparty's own screen. What follows is
one entry per gap, in the order the journey hits them. Every one was found by
reading the code behind the report or by walking the whole journey afterwards —
twelve walks in all, each one restarting from step 1.

## 1. Two rows of verbs, at two different scopes, rendered as equals

**Where:** `js/views/negotiation.js`, `negoRoomActionsHtml`.

The change index carried `Accept` / `Reject` / `Discuss` / `Undo` per card and
`Accept All` / `Reject All` above them. Those act on **one change at a time**.
The top bar carried four more — `Send N decisions`, `Accept wording`, `Decline`,
`Approve & sign` — and those are answers about **the whole deal**. Nothing on
the screen distinguished the two scopes.

Worse than a duplicate:

- **`Accept wording`** was a whole-document acceptance inherited from the
  portal's respond panel. Pressed with changes still pending it filed an
  acceptance on nobody's behalf — an answer to everyone's ask that answered
  none of them. **Removed.**
- **`Approve & sign`** signed nothing. It closed the room and routed to a panel.
  **Renamed to `Ready to sign`,** which is what it always did.
- **`Send N decisions`** is the postbox for per-change answers, so it **moved
  into the change index**, under the bulk pair, beside the decisions it carries.

What is left in the top bar is the pair with no per-change equivalent: say the
deal is settled, or end it.

## 2. "Send to <the owner>" did nothing — four independent reasons

Each of these alone was enough to make the button inert. All four were real.

**2a. It was the wrong button.** `#nego-send` lives in the turn banner and was
rendered on *both* sides, wired on both sides to `openShareModal` — the owner's
route, which mints a share link. A counterparty holding a link cannot mint links
to somebody else's contract. Removed from their side entirely, rather than
disabled: it was never theirs.

**2b. The right button could not have worked either.** `portalRespond` opens
with `if(!name) toast('Enter your full name')`, reading `#pt-name` — an input on
the page *underneath* the full-window room. Once the room became the landing
that box was unreachable, so every send failed its own first line against a
field nobody could see or fill. The name is now collected **in the room**,
prefilled from the share's recipient.

**2c. The server rejected the action.** `/api/shares/:token/respond` validated
against `['sign','accept','changes','decline']`. The portal had been posting
`action:'decisions'` for a whole release. Every batch of per-change answers ever
sent came back **400 Invalid response**.

**2d. And it was posting the wrong envelope.** That one call sent
`{ response: … }`; the server reads `req.body.kind` directly, as it does for
every other action. So even with the whitelist fixed it would have seen a body
with no `kind`. Two bugs in one line, the second hidden behind the first — and
`f37` was asserting `sent.response.kind`, agreeing with the page instead of with
the wire. That test is corrected and now asserts the shape the server parses.

## 3. Half the room's controls were wired to a hidden copy of itself

**Where:** `wireNegotiationTab`, `wireNegoLayout`, `openNegotiationRoom`,
`negoFocus`.

The counterparty's page mounted the component **twice**: the room over the
window, and an embedded copy underneath it. Every wiring looked its element up
with `document.getElementById`, which returns the *first* match in the document
— always the hidden one. So on their page the room's `Accept All`, `Reject All`,
the index fold, the drawer, the export and every per-change reply box had **no
handlers at all**. `negoFocus` lit up clauses in the copy while the screen they
were reading did not move.

Fixed by scoping every lookup to the mount being wired. Written as
`[id="…"]` rather than `#id`: a `#id` selector is answered from the document's
id map, finds the first element with that id and then reports `null` because it
is not inside the subtree — trading one wrong element for none, which is not an
improvement. The helper is `negoPick`.

**And then the duplicate itself went.** On a negotiation link the card in the
page column was pure scenery — behind a fixed full-window overlay, but still in
the document: a second "open the room" button and a second send a keyboard could
tab to. Only the empty hidden hosts survive, because `f37` diffs the two sides
through `#pt-nego` and that proof is worth keeping.

## 4. No way out, and none wanted

`← Doc` is a breadcrumb: it says there is a workspace behind this room and you
came from it. True for the owner. For the counterparty there is no Doc page and
nothing underneath — pressing it left them on an empty shell, and `Esc` did the
same by accident.

Removed on their side, along with the Esc route. **This reverses f49's assertion
from the previous round** — *"leaving the room lands on their page and does not
snap shut again"* — which was true while the room was a mode entered from a
portal page and stopped being true when the room became the landing. That test
is rewritten to assert the opposite, not worked around.

The exit is gated on `negoRoomHasExit(opts)`, not on side, for one honest
reason: a counterparty who reaches the room from a *signing* link by pressing
"Review what changed" **has** entered a mode from a page that still exists, and
must be able to get back.

**Found by Chromium, not jsdom:** the Escape listener is a document-level
singleton. Guarding it at registration time was not enough — one installed for a
room with an exit went on answering Escape for every room opened afterwards, and
closed the counterparty's. The test is now made inside the handler against the
room that is open now.

## 5. Readiness was inferred from arithmetic

`portalNegoPhase` counted outstanding changes and decided the reader was ready.
Resolve the last change — **even by refusing it** — and the room they had been
negotiating in silently became a request for their signature, with nobody having
said the deal was done. The same reading turned a first-draft contract sent out
clean into a signing request, so a counterparty invited to negotiate one had
nowhere to propose anything.

The link now carries its **purpose**, set by the sender:

    'negotiate' → the room, every time, however much is outstanding
    'sign'      → the clean document and the respond panel

Readiness is **signalled** by a person, recorded with who, when and which side,
and reaches the owner in three places. A link created before purposes existed
still opens on exactly the screen it opened on yesterday — the old reading
survives as the fallback and nowhere else.

## 6. The judgement call: "Withdraw this ask"

**This is scope nobody asked for, and it is recorded as a judgement.**

Gating `Ready to sign` on the parties being aligned deadlocks on a single
refusal. If "aligned" meant only "nothing pending", a refusal would count as
settled and the button would go green over a live disagreement. If it meant
"everything accepted", one refusal would block signature forever and neither
party could get out — worse than the bug the gate fixes.

So a rejected change is settled when **the side that asked** accepts the refusal
and takes the ask off the table. That verb is `negoWithdraw`. It is an
acknowledgement, not a second rejection: the change keeps its status, author,
fingerprint and reply, and the record reads "proposed, refused, and the proposer
let it go". Only the proposer may press it — a side that could withdraw the
*other* side's ask could clear every objection to its own wording and then
declare the deal aligned.

It is reversible, it travels in the share payload (or the reader's copy would
refuse over a point we had already let go), and a withdrawn ask stops being an
open point.

## 7. The owner's own "Ready to sign" banner claimed too much

`negoReadyHtml` was gated on `negoReadyToSign` — "every change has an answer" —
and a refusal is an answer. With one of their asks turned down the banner
appeared and said **"Nothing is outstanding between the parties"**, which was
not true. Re-gated on alignment, and it now accounts for withdrawals rather than
counting them silently as agreement. `f36`'s test is rewritten.

## 8. Decisions appeared to revert the moment they were sent

The room repaints after a send, and it repaints from the **share payload** — a
snapshot taken before the decisions existed. Clearing the held decisions without
remembering them put every card back to `pending`, with Accept and Reject on it,
a second after the reader had answered and sent. The one impression this whole
round exists to remove.

Sent decisions are now remembered on the page and marked `sent`. A sent decision
is not theirs to **undo** — it is filed with the other party, and returning it to
"pending" here would leave the two sides holding different answers. Changing
their mind is still allowed; that is a new decision and it travels.

## 9. Comments typed in the room reached nobody

`negoPostComment` writes onto the contract record the screen is reading. On the
owner's screen that record *is* the contract. On the counterparty's it is a copy
assembled from the share payload, `persist:false`, thrown away on the next
paint. So every per-change reply they typed went nowhere — and the room is now
the only page they have.

Comments ride the `/messages` route that already exists for exactly this: it
changes no wording, opens no round and does not close the link.

## 10. Declining asked for a reason the room could not supply

Same trap as the name: `portalRespond` requires a comment before filing a
decline, and read it from `#pt-comment` on the page underneath. The requirement
is right; what was missing was anywhere to satisfy it. The room asks, with a
confirm-style prompt, and a cancelled prompt sends nothing.

While fixing it: the call was `promptDialog(...)` bare. `js/core.js` declares
that as a lexical function, so the bare call resolves to that binding and can
never be substituted — the same trap `negoResolve` documents for `canEdit`.
Reached through `window` now.

## 11. Answering never handed the turn back

The turn moved to the counterparty when the owner sent the round. Nothing moved
it back when they answered, so the owner's banner went on reading "Waiting on
Nordfrakt Logistik AB" over a contract Nordfrakt had already replied to — the
exact untruth the turn model exists to prevent, in the one direction nobody had
walked. `applyResponse` now hands back through `negoHandOver`, the same code the
owner's own send uses.

## 12. Comparing two versions emptied the counterparty's whole top bar

`canAct` is false while the panes show two old versions, which is right for the
bulk verbs — nothing on that screen is a live proposal. It was being used to
gate the whole bar, so entering compare mode removed `Decline`, removed the
explanation, and removed the **name field**, taking whatever they had typed into
it. Ending a deal has no precondition, and who you are does not depend on which
version you are reading. Rendered on `!readonly`; disabled on `comparing`.

## 13. A refused readiness claim would be retried forever

The gate is enforced on both sides of the wire — a response is a public POST and
the page that sent it is not ours. But `applyResponse` returned `false` for a
claim the change set did not support, and the poller re-fetches and re-applies
any response that reports unhandled, every cycle. A claim that can never succeed
would loop.

Now: the decisions and withdrawals that arrived *with* the claim are kept (they
are true), the readiness is refused, the trail records exactly that, and the
response reports handled if anything landed.

## Smaller things, fixed on the way

- **The room's rerender discarded the caller's own.** `openNegotiationRoom`
  always rebuilt with the captured `opts`, so `pendingDecisions` stayed frozen
  at whatever it was when the room first opened — the send that appears once
  there is something to send never appeared. The caller's repaint wins now.
- **The name field was wiped on every repaint.** Each Accept rebuilds the room;
  rebuilding the field from the share's recipient undid a name typed a moment
  earlier. The live box is read first.
- **The name field was prefilled with the company.** It fell back to
  `opts.by`, which falls back to the counterparty *organisation* — filing
  "Nordfrakt Logistik AB" as the person who answered, silently, because the box
  would look already-filled. An empty box asks the question; a wrong one answers
  it.
- **A read-only room explained nothing.** Three different facts — superseded,
  already answered, no channel back — all rendered as an absence of buttons.
  Each says which now.
- **`negoAlignment` wrote to contracts it was asked about.** It read through
  `negoChanges`, which calls `negoInit` and creates a negotiation record — and
  stamps clause ids into the document. The dashboard asks the question of every
  contract in the portfolio, most loaded as summaries with their bodies
  stripped. A read must not write.
- **A signing link opened durable by default.** The dialog's own words say a
  one-shot link is "the right choice for a final signature, where one copy gets
  exactly one response". A default that contradicts the sentence beside it is
  worse than no default.
- **The invitation email described the wrong screen.** A negotiation link's mail
  told its recipient to "approve & sign, propose changes, or decline" — a panel
  they will not see. It now describes the room.

## Known limitations, carried forward

- **Signing is not built.** Image 4 is the portal's existing respond panel; this
  round routes to it. The owner's side keeps the existing "Send to Docs tab for
  signature" stub.
- **The mobile/WhatsApp counterparty portal is untouched**, as instructed.
- **The embedded copy of the negotiation still mounts, hidden**, on the
  counterparty's page. It is what `f37` diffs the two sides against, and losing
  it would lose the proof that neither side is looking at a lesser screen. It is
  no longer keyboard-reachable and no longer steals the room's wiring, but two
  elements do still share several ids in that document. Removing the duplication
  properly means giving `f37` another way to prove parity, which is its own
  piece of work.
- **`renderDashboard` is not booted in jsdom.** The dashboard needs the whole
  application shell — metrics, risk scoring, the family model,
  localStorage-backed KPI preferences. The readiness surface is split into
  `readyToSignItems` and `readyToSignRowsHtml`, and those are driven directly;
  the two questions worth asking (which contracts, and what does it say) do not
  need the shell.
- **The owner's share dialog itself is not driven end-to-end in jsdom** for the
  signing-link case. What is asserted is that both entry points exist and that
  `buildSharePayload` carries the purpose they pass; the dialog's own rendering
  is measured in the Chromium pass.

## Where the tests stand

**915 automated tests / 181 suites / 0 failures** (825 before this round), and
**69 of 69 Chromium checks** (52 before). Twelve full walks of the journey; the
last two found nothing new.

---

# Round: stacked notices, a document flattened, a panel removed, a seal that never printed

Five reports from four screenshots.

## 1. The room stacked its notices, and two of them were false

**Where:** `js/views/negotiation.js`, `negoRoomHtml`.

Four notices rendered unconditionally, one under another: the readiness signal,
"every change is resolved", whose turn it is, and the comparison bar. They are
not four notices — they are one question, *where does this stand?*, and it has
one answer at a time.

On the reported screen the contract was **SIGNED**, and it still said
*"Your turn — propose changes or send it back"* above a banner offering to
*"Issue a signing link to take it forward"*. `negoReadySignalHtml` never checked
the contract's status; the Docs-page strip did, so the two surfaces disagreed
about a signed contract.

`negoRoomBannerHtml` now picks one, in the order each supersedes the one below:

    executed / declined → nothing about turns or readiness applies
    comparing versions  → you are reading history, not the live round
    signalled           → somebody has said they are ready; the next act is named
    aligned             → everything settled, nobody has said so yet
    otherwise           → whose move it is

**Also fixed:** the notice read *"Young Mbagaya signalled Young Mbagaya is ready
to sign"*. My wording, and wrong even when the two names differ — the signer and
the party they sign for are usually the same words.

## 2. A contract arrived as a wall of prose — two faults, in opposite directions

**Root cause, confirmed by running a real sample PDF through the real intake
rather than reading and guessing.**

**2a. The fallback scrape destroyed every line break.** `pdfFlatText` in
`js/views/contract.js` runs when the structured parse finds nothing, and ended:

    out.join(' ').replace(/\s+/g,' ')

Every newline collapsed into a space, so the whole agreement arrived as **one
line**. Everything downstream rebuilds structure by splitting on newlines, so it
built a single paragraph containing the entire contract — recitals, clause
headings and page footers run together, *"…IT IS HEREBY AGREED as follows: PAGE
1 OF 4: DEFINITIONS, SCOPE &…"*. That is the reported screen exactly.

**2b. The structured path shredded paragraphs.** `negoRichFromLines` emitted one
`<p>` per line of the source, which is only correct if every line of the source
is a paragraph. The structured PDF reader emits one line per **visual** line, so
a sentence that wrapped three times became three paragraphs and `1. Services`
became body text rather than a heading a reader can navigate by.

**The fix, in two parts.** `pdfFlatText` keeps its newlines. And structure is no
longer taken from the line breaks at all: `docRichFromText` (js/docx.js) reads
the numbering, the bullet marks and the capitalisation the contract already uses
to say what its own parts are, and treats line breaks as what they are — where
the page happened to end.

- wrapped lines join into one paragraph, but only on **positive** evidence of a
  wrap (the next line starts lower-case, or the previous stopped on a comma or
  dash). A missed join is untidy; a wrong join welds a heading onto the sentence
  after it.
- numbered clause titles become headings; longer numbered clauses become list
  items that keep their number, because the number is the citation.
- bullets in any of the marks a contract uses become list items.
- page furniture ("PAGE 1 OF 4", bare page numbers) is dropped.
- a run-on blob is detected and broken at the document's own landmarks first.

**One bug found while testing the repair:** `Companies Act, 2015. RECITALS` was
read as clause 2015, inventing a clause and hanging the recitals under it.
Clause numbers are capped at three digits and never follow a comma.

Nothing is invented and nothing is edited: every character comes out in the same
order, and what changes is which block it sits in. That is asserted.

## 3. The discussion panel is removed, on instruction

"Talk it through" was a general message box beside a negotiation whose whole
premise is that every exchange attaches to a fingerprinted change. Two channels
for one conversation is how the two drift apart, and this was the one that could
not say which clause anybody meant.

Removed from **both** surfaces with no replacement, as instructed after the cost
was put to the user. The message ROUTE survives — it carries the per-change
threads in the room and feeds the dashboard's "questions waiting for you" — but
there is no longer a panel in which to read a thread in full or reply to one.
`f31`'s page tests are rewritten to assert the absence and record the loss,
rather than being deleted.

**And the thing that removal nearly left behind:** the open-points card on the
counterparty's page carried a reply box per point, wired by the same function
that wired the panel. Deleting the panel without deleting those would have left
a Send button that did nothing — the exact fault this product has spent a
session removing. The card is now read-only, and a test says so.

## 4. Printing a signed contract lost its seal

`exportPDF` took its body from `docBody()`, which folds the execution block in
only when `c.status === 'Signed' && c.execution.html` — a frozen body captured
at signing. Anything else printed the wording, a lone `SHA-256 DOCUMENT SEAL`
box and an audit trail: **no signatures, no "Executed & Sealed", no sealed text
fingerprint**. The page that most needs to prove it was signed was the one that
did not.

`printExecutionBlock` renders it explicitly, in **inline styles** — the print
sheet does not carry the application's stylesheet, so the page's own block (built
from utility classes) prints as unstyled text. The frozen body's copy is stripped
before printing so the fingerprint appears **once**: two copies of one seal on a
document about provenance read like two different seals.

Uploaded and externally-executed contracts get the right variant.

## Known limitations, carried forward

- **A run-on blob cannot be fully recovered.** The extractor destroyed the
  information; the rebuild is a salvage. It restores numbering, bullets and
  paragraph boundaries, and on the sample it still glues the document title to
  the first sentence. The extractor itself is fixed, so new uploads do not take
  that path — the rebuild is the safety net for what is already stored.
- **The counterparty's per-change comments have a thin reader.** They still
  reach the owner's dashboard as counted, quoted rows; there is no longer a
  thread view or a reply box for them on that side. Accepted deliberately.
- **The breadcrumb in the reported screenshot read "MK-196 · WH (Draft)" beside
  a SIGNED chip.** The chip is right and is read from `c.status`; the "(Draft)"
  is inside the contract's own template or name text. Not chased — it needs the
  record to say which.

## Where the tests stand

**933 automated tests / 0 failures** (915 before this round; f31 lost its panel
tests and gained absence tests, f52 is new with 28), and **72 of 72 Chromium
checks** (69 before — three new ones measure that exactly one notice is raised,
that it is laid out as a banner, and that it does not overlap the documents).

---

# Round: whose marks, whose questions, and giving the document room

## 1. HaTi was stamping contracts it did not execute

**Where:** `js/views/portal.js`, `printExecutionBlock` — code I wrote last round.

I built the print block to render for any `status === 'Signed'` contract and then
pick an "ON FILE / MIGRATED" variant for externally-executed ones. That variant
should never have existed. A contract signed on paper, or in somebody else's
system, and then filed here **was not signed by us**, and printing it must give
back what was filed. A seal, a fingerprint or an audit trail added to somebody
else's executed contract is HaTi asserting a part in an act it had no part in.

The rule is now one predicate, `printIsHatiExecuted(c)`: signed, not externally
executed, and carrying at least one signature HaTi actually took. Everything
below the document — the execution block, the bare seal box, the audit trail —
is gated on it. An uploaded document nobody signed here also prints as the
wording it arrived with: the certificate card that used to head it (file name,
size, value, status, fingerprint) is HaTi's filing metadata, and stapling it to
someone else's contract makes the print a HaTi artefact rather than a copy of
the agreement.

**Found while fixing:** the upload print footer said the original file was
"identified by the fingerprint above" — with the fingerprint no longer printed,
that sentence pointed at nothing.

## 2. The Copilot asked questions on the reader's behalf

Three rotating chips under the greeting, from `AI_SUGGESTIONS`. Removed. The
greeting says what the assistant can do; what to ask is the reader's to decide.
`renderAISuggest` is kept as a no-op so both render paths don't have to know.

**The Ask-AI triggers I added last round are a different thing** and stay —
those are a person choosing to ask, pre-filled from what they are looking at.

**But one of them was a duplicate and is gone.** I added an "Ask AI" button
beside PDF on the contract page; there was already an "Ask Copilot" button two
places along. Two buttons, one assistant. The pre-filled question moved onto
the existing one.

## 3. "Add a clause" removed

Proposing a clause the contract does not have yet is a real act, but it was done
through two blank prompt boxes — a heading, then a body, typed into a modal with
no sight of the document around it. That is not how anybody drafts a clause, and
a control nobody can use well is worse than its absence. Wording still enters
through the template, through an edit, or as a redline from the other side.
`f44`'s tool-list test is rewritten to two tools, and asserts the dialog is gone
rather than merely the button.

## 4. The version list — HALF DONE, and the half I did not ship is recorded here

Two separate problems sit behind images 3 and 5.

**The comparison itself was broken, and that is fixed.** `negoCompareVersions`
matched a clause to its earlier self **only by the durable clause id stamped
into the document**. Ids are stamped when the negotiation starts, so anything
captured before that — a template being applied, the first share — has an
unstamped body. Matching on id alone then found *nothing* in common and reported
two nearly-identical documents as a complete replacement: every clause Removed,
every clause Added. That is not a diff, it is a failure to compare, and it read
as if the contract had been rewritten. Where the id sets do not intersect it now
falls back to what a reader would use — the clause heading, then position.

**The list itself I did not change, and here is why.** The stated rule was
"original vs v1, then the versions that came from updates to the contracts". I
implemented it by dropping snapshots whose label is bookkeeping — `#CHG-001
accepted`, `Round 1 — sent to …`, `Shared for review` — and `f46` immediately
failed, correctly: in the fixture the *only* snapshot recording an accepted
change is the one labelled with the change id, because `captureVersion`
deduplicates and the round-close that follows it has identical text. Filtering
by label therefore deletes real document versions.

The deeper finding: every stored version already differs in wording from the one
before it — `captureVersion` refuses a no-change capture. So there are no
"versions that came from nothing". What is actually wrong is that a snapshot is
**labelled by the event that happened to trigger it** rather than by what
changed, which is why "v1 · Shared for review" looks like noise when it is in
fact the first real version. Fixing that means changing what versions are named
and when they are taken, which is a model change and not a filter. Reverted,
recorded, and put back to the user rather than guessed at.

## 5. The Doc page header folds

Nine actions, a status strip and a tab row before one line of the contract is
visible: right while you are deciding what to do, in the way once you are
reading. Collapsing folds the action rows and keeps what tells you where you are
— the name, the status, the way back.

**The control that folds it sits OUTSIDE what it folds**, along with Ask
Copilot. A control that hides itself cannot be pressed again; and Ask Copilot is
the one action people reach for while reading rather than while deciding. Both
are asserted.

Remembered per user, not per contract: someone who reads more than they act
wants it folded on every contract they open.

## Where the tests stand

**979 automated tests / 0 failures** (966 before this round; `f54` is new with
13, `f44` and `f49` rewritten), and **72 of 72 Chromium checks**.

## Follow-up: a version is something a person took and named

The half handed back above is now decided and built. A snapshot is a deliberate,
named act; the automatic copies stay, unlisted.

**`captureVersion(c, label, by, opts)`** grew two fields. `kind` — `named` or
`auto`. `listed` — whether it belongs in the list a person reads. Undefined
means listed, so **every version stored before this keeps appearing**: changing
how versions are taken must not retire the ones already taken.

**Unlisted (kept, not shown):** each individual change decided, a turn handed
over, a share going out, the copy taken before a redline. These are not
optional. Two things depend on them and would break silently:

- the copy before a first edit is **the only record of the original wording**;
- `resolveRound` diffs a returned redline against the most recent copy when the
  response carries no base text of its own (`js/versioning.js:373`).

**Listed:** named snapshots, the original, a round closing, signing.

**PROMOTION, and without it the milestones disappear.** A round closes moments
after the last change in it was accepted — same wording, so `captureVersion`
deduplicates, and the record already stored is the *unlisted* per-change one.
Returning it untouched let an internal baseline swallow the milestone, and
"Round 1 closed" never appeared at all. A listed request now promotes an
unlisted record and takes its name with it. Found because `f46` went red on the
first attempt; the test was right and the model was wrong.

**Taking one requires a name.** `takeNamedSnapshot` asks, and refuses to save
without an answer — better no version than one nobody can identify six weeks
later, which is what "Manual snapshot" filed three times over amounted to. A
snapshot of wording that has not moved is refused with a reason rather than
filed as a duplicate.

**What the list now reads**, on a contract negotiated through the room:

    Original Baseline · round 2      (live)
    Working Version · round 2        (live)
    v1 · Round 1 closed

rather than `#CHG-001 accepted — Clause 4`, `Shared for review` and
`Round 1 — sent to Juno Limited`.

**Found by the browser pass:** a contract nobody has snapshotted now has nothing
to compare against, which is correct and meant the Chromium fixture could no
longer reach the compare screen at all. The fixture takes a named version, which
is the flow it should have been exercising.

**Still not built:** there is no way to restore a contract to an earlier
version. Versions are for reading and comparing. I checked before saying so.

**990 tests / 0 failures**, 72 of 72 Chromium checks.

---

## Loop: two-party in-app negotiation, Wanjiru & Erik

Run as an improve-and-verify loop against the brief: make the two-party in-app
negotiation good enough for a Nairobi SME owner with no training to get through
six rounds and sign. Every finding below was walked in a real Chromium session
against a running server with two browser pages — Wanjiru's workspace and
Erik's share link — not read off the source. Nothing here was fixed on the
strength of reading the code alone.

**Caveat on the environment.** This container cannot reach `cdn.tailwindcss.com`,
so every screen rendered without its stylesheet. Behaviour, wording, control
presence and the whole data round-trip were verifiable; visual layout, spacing
and hit targets were NOT, and nothing in this entry claims otherwise.

### Cycle 1 — score 4/10

Three findings, any one of which stops the scenario dead.

**1. The first share of a negotiation went out as a SIGNING link.**
`buildSharePayload` (`js/core.js`) fell back to `shareChanges.length ? 'negotiate'
: 'sign'` when the caller stated no purpose. The Share button in the contract
toolbar — the button a first-time user actually presses — stated none. A first
draft has no changes, so the fallback read "nobody has negotiated" as "this is a
signature request", which is exactly backwards. Verified live: Erik opened the
link and met a green tick and the words **"Ready to sign — No changes were
proposed on this contract"** on a draft nobody had discussed, five near-identical
verbs, and no negotiation room anywhere.

*Fixed.* `defaultSharePurpose(c)` now reads whether the deal is FINISHED rather
than whether it has started — a contract with no changes is `negotiate`, one
whose changes are all settled is `sign`. And the dialog no longer guesses in
private: step 1 carries a two-option picker, **Negotiate** or **Sign**, each with
a sentence saying which screen the other side lands on. Changing it moves the
one-shot/standing default with it, because a signing link and a negotiation link
want opposite answers there.

**2. The counterparty could propose a change and had NO WAY TO SEND IT.**
The worst defect in the product. Erik presses **Change** on a clause in the
room, writes what he wants, saves. It is filed as `#CHG-001`, fingerprinted,
shown as pending, authored by him. The room's buttons are then still exactly
**Decline** and **Ready to sign**. The postbox in the change index
(`negoIndexSendHtml`) counted `pendingDecisions` only — answers to the OWNER's
asks — and `wirePortalNego`'s `onChange` collected only `authorSide==='owner'`.
Verified live: after two proposals, no send existed anywhere on the screen, and
Wanjiru's app never heard of them. Close the tab and the work was gone.

*Fixed.* `PORTAL_NEGO_PROPOSED` holds wording the reader asks for, exactly as
decisions are held; `portalNegoContract` puts it back on every repaint (and
winds `negotiation.seq` and the hash chain forward with it, or the second ask
collided with the first and the room told the reader in red that their own chain
was broken); the postbox counts both and names them; `portalRespond` posts them
as `negoProposed`; and `applyNegoProposals` on the owner's side RE-FILES each
one through `negoFileChange` so the id, fingerprint and chain are minted on the
record copy rather than trusted from a public page. `oldText` is read from our
clause, never theirs.

**3. And the room never named the act it exists for.** The per-clause control
said **Edit** — a word a counterparty reads as "not for me", and wrong anyway,
since it files a tracked change rather than editing anything. The empty change
index said "Propose wording and each change becomes a fingerprint", which says
what happens but not where to press.

*Fixed.* The control is **Change**, with a title saying it goes to the other side
to accept or reject; the empty index names the control and the pane; and the
working pane's subtitle, on a round with nothing in it, reads "press Change on
any clause to ask for different wording" instead of describing a redline that is
not there yet. `f44` updated to assert the new label and why.

Also fixed in this cycle, all found in the same walk:

- **Two send buttons, two behaviours.** The contract page's "Send updated
  version" refreshed the link Erik already had; Share and the room's "Send to …"
  minted a SECOND link and left the first live. `openShareModal` now refreshes a
  standing negotiation link to the same address in place, says so above the
  result, and logs it honestly. Signing links stay exempt — one signature must
  bind one copy of one text.
- **Two competing next actions.** With Erik's changes waiting, the action bar
  still read "Key terms are set — move it into review" beside a banner saying
  "Changes returned". `wsNextAction` now answers "somebody is waiting on you"
  first, and its button borrows the strip's own handler rather than growing a
  second path to the same screen.

### Cycle 2 — score 8/10

A fresh six-round walk on the fixed code found the fixes holding, and one more
defect that had been hidden behind them.

**4. THE COUNTERPARTY'S ANSWERS WERE SILENTLY LOST.** Erik withdraws his refused
ask, accepts Wanjiru's counter-wording, sends, and presses Ready to sign. His
screen says sent. The server marks the response applied. Wanjiru's contract
shows the change still pending, the ask still refused, no readiness, and her
audit trail has no entry — and because the response is marked applied, it is
never re-delivered. The round is gone.

*Root cause*, found by instrumenting the apply path rather than guessing:
`applyResponse` ended with `persist(c)`, which only marks the contract dirty and
sets a 400 ms timer, and then immediately repainted. The repaint reloads the
contract into the same object, so the SERVER's older copy was assigned over the
answers that had just been applied, and the timer then saved that older copy
back. `negoResolve` had returned success; the audit line had been written; both
were overwritten before either reached disk.

*Fixed.* `applyResponse` now awaits `flushSaves()` before anything repaints, so
the write happens while the object still holds what arrived. Verified: after the
fix the same walk ends with `CHG-002` withdrawn, `CHG-003` accepted, the
readiness recorded, and Wanjiru's page showing **"Ready to sign — Erik Lindqvist
signalled they are ready to sign … Issue a signing link"**, surviving two
reloads.

**5. Withdrawals sent with decisions were dropped.** Only the readiness branch
of `applyResponse` read `negoWithdrawn`. A counterparty who took a refused ask
off the table and pressed **Send** rather than **Ready** had the withdrawal
discarded in silence: their screen said the point was settled, ours went on
reporting a live disagreement, and neither side could see why the deal would not
move. The loop is now `applyNegoWithdrawals`, called by both branches.

**6. There was no way back to an earlier version.** Confirmed by search and by
walking the panel: you could read any version and compare it, and then you had
to retype. `restoreVersion` now exists — it snapshots the current wording FIRST,
writes the old wording in as a new version on top, and logs both, so the history
only ever grows and "we went back to Tuesday's draft" is itself on the record.
It refuses while changes are pending or a round is open, and says why: every
pending change is anchored to the wording it was proposed against.

**7. And the version list was empty, so restore had nothing to act on.** A
negotiation conducted entirely through the room produced **0 versions** in the
panel a person reads — automatic copies are unlisted by design, and the
hand-over capture only fires on a turn that actually moves. A share now files a
listed "Sent to <recipient>" version, and a hand-over files a listed one too.
These are the milestones a person can name afterwards; the per-change copies
stay unlisted. Verified: v1 "Sent to Erik Lindqvist" → restore → v2 "Before
going back to v1" and v3 "Restored from v1".

### Verified, and how

Two browser pages against a live server, driven through the real controls:
share dialog → Erik's room → propose → send → owner's index → accept and reject
with a reason → counter-propose → send on the same link → withdraw → settle →
readiness → the owner's signing route. Plus the restore flow end to end. **990
automated tests, 0 failures.**

### NOT fixed, and why

- **The five verbs on the counterparty's signing page** (Approve & sign / Accept
  the wording / Propose edits / Request changes / Decline). Unguided, and three
  of them overlap. Reachable only on a signing link now that negotiation links
  open the room, so it stopped being the blocker it was — but it is still a fork
  with no signpost. Left because collapsing it is a change to the signing flow,
  not to the negotiation, and this loop's brief was the negotiation.
- **No live signal on the owner's screen.** Answers land on reload or on the
  45-second poll; nothing on the contract page updates itself when one arrives.
  Correct data, late. A real fix means a push channel, which is infrastructure.
- **Two copies of the negotiation component in the counterparty's DOM** — the
  hidden `#pt-nego` mount plus the room — duplicating every id the room uses.
  This is the exact hazard the code's own comments describe having fixed once;
  it cost an hour of this session's debugging before I noticed I was driving the
  invisible copy. Not user-visible today, so not fixed under time; it should be.
- **The contract stays at status "Drafting"** through an entire negotiation.
- **Signing was not driven to an executed contract in the browser.** The
  readiness signal, the "Issue a signing link" route and the signing panel were
  all confirmed present and correct; the signature pad and the one-time-code path
  were not walked. Round 6 is therefore verified up to the signature and no
  further, and the score reflects that.
- **Layout was not verified.** No stylesheet in this container.

### Cycle 3 — score 9/10, and round 6 walked to the end

The gap left open in cycle 2 was closed: signing was driven all the way to an
executed, sealed contract, in the browser, both sides. It works — and getting
there surfaced four more defects, two of them the same class as the big one.

**8. Erik signs, and the headline still told him to sign.** `portalSetDone`
correctly spends every action button, but the green band at the top of his page
went on reading *"Ready to sign — read the wording below, then sign or respond
on the right"*, with the confirmation in a box far below it. The biggest thing
on the screen instructed him to do the thing he had just done. `portalMarkSigned`
now rewrites that band to *"Erik Lindqvist signed this contract … there is
nothing further for you to do here"*, on both the verified and the unverified
signing paths.

**9. The owner was never told the counterparty had signed.** Erik's signature is
filed, the audit trail records it, the share row reads Signed — and Wanjiru's
action bar went on saying *"Key terms are set — move it into review"* with a
button offering a step the contract passed three rounds earlier. The single act
left in the whole deal was her signature and the screen never mentioned it.
`wsNextAction` now answers *"Erik Lindqvist has signed. Your signature is the
only thing left."*

**10. The executed copies were never sent, and the reason shown was nonsense.**
`finalizeExecution` called `persist(c)` — which only marks dirty and sets a
400 ms timer — and then immediately called `distributeExecuted(c)`, which POSTs
to `/distribute`. The server checks the STORED status before it will send an
executed copy, so the request overtook the save, the server saw a contract that
was not yet `Signed`, and answered **"Contract is not executed yet"**. That
sentence was filed on the distribution record and printed in the signature panel
of a contract the same panel had just marked *Executed & sealed*, with both
parties listed as **Failed**. Nobody got their copy.

Same shape as defect 4: a debounced write overtaken by a read that depends on
it. Fixed the same way — `await flushSaves()` before distributing. Verified:
both recipients now read **Sent**.

**11. And the last screen of the journey did not repaint.** After signing, the
action bar kept "your signature is the only thing left" on an executed contract
until the reader reloaded. `renderActionBar` is now called with the rest of the
post-execution repaint.

**What the end of the journey now does.** Wanjiru presses *Issue a signing link*
from the readiness strip; the share dialog opens on **Sign** (not by guessing —
the caller states it and the picker shows it); Erik opens it, adopts a typed
signature, is told plainly that his email cannot be verified on this workspace
and that the record will say so, signs anyway; his page says he signed; her page
says her signature is all that is left; she ticks intent-to-sign and signs; the
contract goes to **Signed**, the seal and the text hash are written, a version
"Signed & sealed" is filed, and the executed copies go out to both parties.

**990 tests, 0 failures.**

### Still not fixed after cycle 3

Unchanged from cycle 2, and the reason the score is 9 rather than 10:

- the five overlapping verbs on the counterparty's signing page;
- no live signal on the owner's screen — answers arrive on reload or on the
  45-second poll;
- two copies of the negotiation component in the counterparty's DOM sharing
  every id;
- the contract reads "Drafting" throughout the negotiation;
- **layout was never verified** — no stylesheet in this container.

### Cycle 4 — the four I had listed and not fixed

Called out in review: three of the four items I had been citing as reasons for
the score were things I had chosen not to fix, not things I could not. Fixed.

**12. The contract called itself "Drafting" through the whole negotiation.**
The status only ever moved on the internal "Send for review" button, which
nobody presses once there is a counterparty to send to. Sending it outside the
building IS the transition. Draft → Under Review now happens on the send, with
the chip AND the bar repainted — updating the status without repainting the bar
left it offering to do the thing that had just been done, the same stale-bar
fault as after signing.

**And the bar then invited her to SIGN a draft she had just sent out to
negotiate.** Found by re-walking rather than by reading: with the status finally
moving, the "Under Review" branch fell straight through to "Approved — confirm
intent and sign below" on a contract that had gone out ten seconds earlier for
the other side to argue with. Two causes, both fixed: `negoHandOver` is now
called on a negotiation send (it was only ever called by the room's own send, so
a share from the toolbar left the record saying it was still our turn), and
`wsNextAction` answers "it is with them" or "your turn" before it answers
anything about signing.

**13. Five overlapping verbs on the counterparty's signing page.** Approve &
sign · Accept the wording (without signing) · Propose edits (redline) · Request
changes · Decline — rendered as equals, three of them the same sentence in a
first-time reader's head, and every one named after what the system does rather
than what the person does. The link already states its purpose, and on a signing
link the answer is: sign. So that is the button. The other four keep their ids,
handlers and behaviour behind one line — "Not ready to sign?" — each relabelled
as an act with a sentence saying what it does:

    Change the wording yourself      — edit the clauses; they accept or reject each one
    Tell them what you want changed  — describe it; the wording stays as it is
    Agree to the wording — but don't sign yet
    Decline this contract            — ends it; you will be asked why

**14. Two copies of the negotiation on the counterparty's page.** The room and
a hidden embedded mount underneath it, duplicating every id the room uses:
`#nego-cards`, `#nego-count`, `#nego-progress`, `#nego-send-decisions`. Anything
reaching by id found the hidden one, because it comes first.

Not theoretical. `portalRespond` picks the button it reports progress on with
`getElementById('nego-send-decisions')` — so "Sending…" and "sent" were written
onto an invisible copy while the button the reader was looking at said nothing.

The mount was being kept because a parity test read it. That is a bad reason to
ship a duplicated id. The embedded mount is now skipped exactly when the room is
the page; the host element stays, and on a signing link — where the room is a
mode entered from the page rather than the page itself — the embedded copy is
still the only mount and still renders. `f37` now diffs whichever copy is live,
which is a better test than one that read a screen nobody sees; `f51`'s
"prove the duplicate loses" case became "prove there is no duplicate".

Found while doing it: a whole-page render is a fresh arrival, so `_ptRoomOpened`
has to reset with it — left set, a link refreshed in place kept the reader
looking at the room built from the copy before it.

**15. Nothing on the owner's screen updated itself.** One fixed 45-second beat
treated every situation alike, so someone sitting on the contract they had just
sent out — the one case where the wait IS the experience — watched a screen that
could be three quarters of a minute stale. Two cheap corrections, no new
infrastructure: poll every 12 seconds instead of 45 while the open contract is
with the other side, and poll on tab focus, rate-limited so alt-tabbing cannot
hammer the server.

**Verified live, with the owner's tab never reloaded:** Erik proposes a change
and sends it; her screen goes from *"It is with Nordfrakt AB. Nothing needs you
until they answer"* to *"Nordfrakt AB is waiting on you — 1 change to decide"*
**17 seconds later, with no reload.**

**990 tests, 0 failures.** Two tests rewritten with the reason recorded in them.

### What is left after cycle 4

One thing, and it is not fixable from here: **the layout has never been seen.**
This container cannot reach the stylesheet the app loads from a CDN, so every
screen in every cycle rendered as unstyled text. Wording, controls, behaviour
and the whole data round-trip were testable and were tested. Spacing, alignment,
contrast and tap-target size were not, and no score should be read as covering
them.

---

## Cycle 5 — one negotiation, walked as the customer walks it

Five faults, all reported from a single WH negotiation run end to end, and every
one of them is a place where a screen or a message said something that was not
quite true.

**16. The pane selector offered the same document under several names.** A
contract opened for the first time gave three choices — *Original Baseline*,
*Working Version*, and `v1 · Template "WH"` — of which the first and the third
were the identical wording. One round of negotiation added more of exactly that
kind, so the list became something to pick through rather than read.

Every milestone takes a snapshot, and all of them belong in the version history.
A pane selector is not the version history: it asks which two DOCUMENTS to read
side by side, and two entries holding word for word the same document are not
two answers to that. `negoVersionChoices` now drops a version that says nothing
an entry above it already says; `negoVersionOptions` still returns every one of
them, so a key that resolved yesterday resolves today and the history panel is
untouched. The live pair and anything a pane is currently showing are never
dropped — a `<select>` whose own value is missing from its options renders
blank.

The order changed with it. It was the live pair followed by the snapshots
newest-first, which put the original at the bottom of a list whose first entry
changed every round; it now reads top to bottom as the sequence the document
went through — the wording the round is measured against, each saved version in
the order it was taken, then what is on the table now.

**17. The redline could not be read as a contract.** Both panes are marked up —
struck-through wording, inserted wording, a fingerprint against each — which is
what deciding a change needs and the opposite of what reading the agreement
needs. *"What does this actually say if we agree to all of it"* had no answer
short of accepting everything to find out, which is a decision rather than a
look.

**Read as agreed** is one button on the working pane. Both documents go clean:
removed wording is gone rather than struck, proposed wording is simply there, no
badges and no verbs. It is built by `negoCleanBody`, the same builder that
produces the agreed document when a change is really accepted — so it is the
outcome, not an impression of it. A banner says plainly that nothing has been
accepted and carries the way back. A refused ask is not assumed, and neither is
a withdrawn one: silence still rejects.

**18. A card showed half a conversation.** A comment on a fingerprint has two
stores — `ch.thread` on the contract record, and the discussion channel a
counterparty's public page has to use, because their copy of the contract is
rebuilt from the share payload and thrown away on every repaint. Each side
rendered only the store it wrote to. So the owner asked for input on a change,
the counterparty answered, the answer was filed correctly — and the card that
asked the question showed no reply.

`negoThreadOf` merges the two and orders by time; the owner's room now posts its
comments to the channel as well, so they reach the other side without waiting
for a link refresh. Identical text from the same side in both stores is one
message, not two.

Found while doing it: **deciding and speaking were one permission.** A copy that
can no longer move the negotiation — a spent one-shot link — was also a copy
that could not answer a question. A comment opens no round, moves no wording and
consumes no link; `canComment` is now its own question, and the embedded mount
finally has the `onComment` handler the room always had (without it, the reply
box on that copy reported "comment posted" and posted it nowhere).

**19. "Fully executed" with one signature on it.** Sealing is a fact about the
DOCUMENT — the wording has stopped moving, correctly, on the first signature —
and execution is a fact about the PARTIES. The distribution notice read one for
the other: it announced a finished agreement to both sides when only one had
signed, with the seal and a link to the document in it.

`signedParties` (server) and `executionParties` (client) answer the real
question. Fully executed means both named sides have signed; a contract with no
counterparty has one side to hear from, and one filed as executed outside HaTi
carries the paper. Until then the subject names the party that has signed and
the body names the one outstanding, and it carries **no seal and no link** —
both parties sign before the contract is shared. Automatic distribution is held
until the last signature; the panel says so rather than leaving a button that
never fires.

**20. Six emails for three answers.** Every share response sent two — one to the
sender, one back to the responder as a receipt — and every discussion message
sent two more. Where a workspace negotiates through one address, all of them
land in one inbox, most saying that something had been recorded which both
parties could already see on the contract.

Email is now reserved for the two things that cannot be seen without opening the
app: **wording that moved** (a proposal, a decision, a returned redline or
value) and **the deal ending** (a signature, a decline). The receipt is gone
outright — it told the responder what the responder had just done. Discussion
messages are carried in-app: `/api/messages/waiting` raises them on the screen
the owner already works in, and they reach the counterparty on the change's own
card.

**1008 tests, 0 failures.** Three tests rewritten where the new behaviour is the
reverse of the old, with the reason recorded in them; `f55` is new and covers
the clean read, the merged thread, the execution wording and the email rules.

---

## Cycle 6 — two faults with the same shape

Both are a value that was ALMOST the right kind being used as if it were exactly
the right kind, and the product carrying on as though nothing had happened.

**21. One badly typed date killed two screens for the whole portfolio.**
Everything downstream of an expiry assumes a clean `YYYY-MM-DD`, because the
date pickers produce one. An expiry can also arrive from metadata extraction,
from a bulk migration, or from a spreadsheet somebody typed — and then it reads
`30 September 2026`. `new Date("30 September 2026" + "T00:00:00")` is an Invalid
Date, and `toISOString()` on an Invalid Date **throws**.

It threw out of `renewalDecisionDate`, out of `renderDashboard` and
`renderCalendar`, and Home and Calendar went dead for every contract in the
workspace — over one field on one record.

And it went dead **silently**. The throw escaped `setView` before
`setActiveNav` ran, so the nav button never highlighted: no error on the screen,
no toast, nothing in the interface at all. A button that does nothing when you
press it reads as a broken button, not as a broken screen, and there was no way
for the person pressing it to know the difference.

Three parts to the fix.

`dateOnly()` normalises before any arithmetic touches the value: a leading
`YYYY-MM-DD` is taken as-is, anything else goes to `Date.parse`, and a value
that survives neither is `null`. Null is a real answer — *we do not know when
this expires* — and every caller already handled it.

`setView` catches the render. The rest of the switch then runs, so the shell
arrives in a coherent state, and the failure is **said**: named view, the error,
and the record when the error carries one (never guessed — a wrong id sends
somebody to the wrong contract). The content area says it too, because a toast
is gone in four seconds.

Found while doing it: `toISOString()` was also **wrong**, not just fragile. It
converts to UTC first, so midnight local in Nairobi (UTC+3) came back as the
previous day — every renewal deadline reported one day early, in the market this
product is built for. The day is now read in the reader's own timezone. The
calendar's expiry events go through the same normalisation, because the grid is
keyed by `YYYY-MM-DD`: an event carrying `30 September 2026` was built, counted,
and then drawn on no day at all.

**22. Compressed bytes were printed as if they were the contract.**
`pdfFlatText` fell back with `inf ? pdfLatin(inf) : m[1]` — so when the inflate
failed, the **raw compressed bytes** went to the string scraper. Deflate output
is high-entropy, so across a few hundred kilobytes it reliably contains `Tj` or
`BT` and plenty of `(`…`)` pairs. The test passed, `pdfStringsFrom` scraped the
noise between the parentheses, and that was stored as `upload.extractedText` and
printed by the PDF export.

`pdfStreamBytes` had the same line in a different form — `return inf || arr` —
so the STRUCTURED reader reached the fault by its own route: a stream that would
not inflate came back as its own compressed bytes and was handed to the
content-stream walker as drawing operators.

A declared-Flate stream that will not inflate is skipped on both paths. An
uncompressed content stream really is text and still reads as one, so this is
not a blanket skip: `pdfStreamIsCompressed` reads the `/Filter` entry where
there is one and the zlib/gzip header where there is not.

`looksLikeText()` is the gate at the end — >85% printable over the opening few
kilobytes — applied to every result of `extractPdfText`, again before the upload
stores it, and again on the re-read repair path. Below the line the answer is
the empty string, which is not a failure state: it is the existing "no
machine-readable text" path, and it is what puts the OCR offer in front of
somebody whose scan can actually be read.

**1028 tests, 0 failures.** `f56` is new and covers both faults, including the
two that were found while fixing them.

---

## Cycle 7 — the negotiation room was flattening the contract

**23. Every line break in every clause was being eaten.** `clauseSegment` gives
each clause two forms of itself and they are not interchangeable: `bodyHtml` is
the document — paragraphs, numbered lists, emphasis, tables — and `text` is
`richToText`'s projection, one line per block separated by real newline
characters. The projection is the substance the diff runs on and the
fingerprints bind, and that is exactly what it is for.

Both panes rendered `<p>${text}</p>`, and no rule in `negoStyleHtml()` set
`white-space` on those paragraphs. HTML collapses a newline to a space. So every
line break in the projection vanished: the preamble and the recitals — the part
of a contract most densely made of short lines — arrived as one unbroken run-on
blob, and a numbered list of parties read as a sentence.

Two fixes, in that order.

`.nego-clause p{white-space:pre-wrap}` makes the projection's breaks visible.
That is what a clause UNDER REDLINE needs and all it needs: its marked-up words
have to stay the words the ops were computed over, so the redline rendering is
untouched. `richToText` drops empty lines, so pre-wrap gives exactly one break
where there was one break and nothing doubles up.

A clause with NOTHING proposed against it is now drawn from its own markup
instead — the whole baseline pane, every untouched clause in the working pane,
and every clause whose ask was refused. There is no redline to line up against
there, and no reason to show somebody a flattened copy of a document they are
being asked to agree to. Same wrapper, same clause id, same tools and heading,
so Change, Delete, badge anchoring and the synchronised highlight cannot tell
the difference. `.nego-body` turns pre-wrap back off inside itself: real markup
carries its own structure, and the source html's indentation between tags is not
content.

Found while doing it, and it would have shipped as a new fault: the Change
editor reached for `block.querySelector('p')`. With a rich body that finds the
FIRST paragraph inside it and swaps only that — the list and every paragraph
after it stranded below the editor and outside what would be saved. It takes
`.nego-body` when there is one.

The clean read ("Read as agreed") went the same way, for the same reason: a
screen whose whole purpose is to be read as a contract is the last place that
should show a flattened one.

Nothing here touches `richToText`, the diff engine, the fingerprints or the
change model. Text remains the compared substance; this is what the reader sees.

**1042 tests, 0 failures.** `f57` is new.

---

## Cycle 8 — the second instance of each fault

A platform-wide sweep for the *other* examples of the patterns the last few
cycles each fixed once. Twelve confirmed, twelve fixed. Every one was reproduced
by a failing test before a line was changed.

**24. The reminder sweep died on a hand-typed expiry, and said nothing.**
`server/server.js` · `runReminders()`, the decision-deadline block.

Root cause: exactly f56's fault, on the other side of the wire. The sweep
computes expiry − noticePeriodDays and called `dd.toISOString()` on the result.
An expiry of `"30 September 2026"` — the shape a migration, a Copilot extraction
or a typed sheet produces — makes `new Date(expiry+'T00:00:00')` Invalid, and
`toISOString()` on an Invalid Date throws `RangeError: Invalid time value`. The
throw escaped the `for (const c of rows)` loop, so every contract behind the bad
one was never looked at.

Two consequences, and the second is the expensive one. `POST /api/reminders/run`
answered a bare 500. And the scheduled sweep runs inside
`setInterval(() => { try { runReminders(); } catch (e) {} }, 12h)` — an EMPTY
catch — so one badly typed field on one contract stopped every renewal reminder
for every contract in the workspace, twice a day, permanently, in silence.

Fix: `dateOnly()` / `isoDay()` mirrored into `server/server.js` from
js/obligations.js, applied at `ownExp()` — the one place the term is read — and
at every obligation `due`. The decision-deadline arithmetic is guarded for range
overflow. The interval's catch now logs `[reminders] sweep failed, no reminders
went out this cycle: …`.

Tests: `f65 — a malformed expiry does not take the whole sweep down`, and
`… the contracts after it in the portfolio still get theirs`.

**25. Milestone, decision and obligation reminders skipped in silence.**
`server/server.js` · `daysTo()` callers.

Root cause: the silent half of #24. `daysTo("30 September 2026")` is NaN, and
NaN matches no milestone in `[90,60,30].find(m => days === m)` and never equals
`-1` in the obligation branch. So even before the crash, a hand-typed expiry
earned no 90/60/30-day warning and a hand-typed obligation date never fired its
overdue notice. Fixed by the same normalisation.

Tests: `f65 — a hand-typed expiry earns its own milestone rather than being
skipped`, `… and so does its renewal-decision deadline`, `… an obligation whose
due date a person typed still goes overdue`.

**26. The decision deadline was a day early east of Greenwich.**
`server/server.js` · `const ddIso = dd.toISOString().slice(0, 10)`.

Root cause: the same timezone fault f56 called out in the browser. `toISOString`
converts to UTC first, so midnight local on a Nairobi-hosted server comes back as
the previous day. `daysTo` reads local, so the two disagreed. Fix: `isoDay(dd)`.

**27. Our decision never reached the counterparty's live link.**
`js/views/negotiation.js` · `decide()` · `js/views/contract.js` ·
`openNegotiationOwnerRoom()`.

Root cause: `refreshLiveShareQuietly()` was added so a counterparty's own answers
stop being replayed at them, and it was wired into exactly one call site —
`applyResponse`, the path that applies THEIR response. Nothing called it when WE
answered THEM. The counterparty asks for a change, the owner accepts it, and a
week later they reload their link to find their own ask marked pending again.

Fix: a new `opts.onDecided(c, ch)` hook on the shared component, called from
`decide()`, and `onDecided` / `onWithdraw` supplied only by the owner's mount —
the counterparty has no link to catch up. Deliberately narrow: newly *proposed*
wording is not pushed down a live link, because what the reader is asked to look
at changes when somebody sends it, not as a side effect. The catch-up stays
silent (no email, no new share row, no re-marking as sent, no reset of
opened-state), and the test asserts it.

Tests: `f64 — accepting their ask catches their link up`, `… rejecting it catches
the link up as well`, `… withdrawing our own refused ask does too`, `… and the
catch-up is the silent one — nothing is sent to anybody`.

**28. `effectiveExpiry` handed out whatever was typed.**
`js/family.js:87` · `ownExpiry`.

Root cause: js/family.js's own header says every consumer of an expiry must come
through this funnel — and it does; the funnel was the one thing not normalised.
f56 fixed two consumers (`renewalDecisionDate`, `calendarEvents`) and left the
source alone. So the Register's expiry cell printed the literal string
`Invalid Date`; Home's expiring-in-30/60/90 buckets, Reports' twelve-month
pipeline and `expiring90`, and the "expiring soonest" sort all silently dropped
the contract, because `daysUntil` was NaN and NaN compares false.

Fix: one line — `ownExpiry` returns `dateOnly(...)`. This also corrects
`contractRisk`, the Copilot portfolio snapshot, the aichart expiry series and the
Intelligence graph, all of which read through the same funnel.

Tests: `f66 — the funnel itself normalises`, `… the Register prints the date
rather than the words "Invalid Date"`, `… Home counts it among the contracts that
are about to expire`, `… Reports puts its value into the renewal pipeline`,
`… sorting by expiry puts it where its date says`.

**29. Obligation due dates were never normalised.**
`js/obligations.js` · `obState()` · `js/views/calendar.js` · `calendarEvents()` ·
`js/app.js` · `updateSidebarCounts()`.

Root cause: the expiry field was taught that a date can be typed by a human; the
obligation due date is the same field with a different name and was left as it
was. `/api/ai/obligations` passes the model's `due` straight through, and the
tool description asks for ISO while the model regularly answers
`"31 March 2027"`. Nothing throws, which is why it went unnoticed: the calendar
grid is keyed by `YYYY-MM-DD` so the event was built, counted and drawn on no
day at all; `daysUntil` was NaN so it never reached the 60-day agenda, never
reached the sidebar count, and never became overdue however long ago it was due.
The sidebar's `(o.due||'').slice(0,10)` made it worse — ten characters of
`"31 March 2027"` is `"31 March 2"`.

Fix: `obligationDue(o)` — the shared normaliser — used by `obState`, the calendar
event builder and the sidebar count.

Tests: `f64 — the event keys to a real grid cell`, `… and it appears in the
sixty-day agenda`, `… a due date that has passed is overdue, however it was
written`.

**30. `dateOnly` accepted the engine's legacy guess.**
`js/obligations.js:44` and the server mirror.

Root cause: found while fixing #29, and it was inside the previous cycle's own
fix. `dateOnly` offered any unrecognised string to `Date.parse`, and outside the
ISO grammar V8 falls back to a parser that finds a date in almost anything:
`Date.parse("Phase 2")` is 2001-02-01, `Date.parse("clause 4.2")` is 2001-04-02,
`Date.parse("TBC 2027")` is 2027-01-01. So an expiry a migration left as a label
did not come back as "we do not know" — it came back as a confident calendar day,
and the contract read as long expired, sat in the expiring buckets and drew
itself on a 2001 calendar.

Fix: only shapes a person writes a date in reach the parser — `D Month YYYY`,
`Month D, YYYY`, `YYYY/M/D` and the leading-ISO form — with the month token
checked against a real month list. A `Date` instance is handled explicitly.
Everything else is null, which every caller already handles.

Tests: `f64 — free text the engine would guess at is refused`, `… the shapes
people really write are still read`, `… a month that is not a month is a label,
not a date`.

**31. Copilot counted completed obligations as open.**
`js/ai.js:882` · `aiPortfolioSnapshot()`.

Root cause: `allObligations().filter(o => !o.done)`. Nothing in this product has
ever written an obligation with a `done` property — completion is
`status === 'done'`, which is what `obState()`, the workspace list, the overdue
count and the calendar all read. So the filter passed every obligation ever
recorded: a customer who had ticked off nine of ten was told by Copilot that ten
were open. The overdue line had #29's fault as well, so the one sentence whose
job is to raise the alarm went quiet on hand-typed dates.

Fix: both lines route through `obState()`.

Tests: `f67 — an obligation that has been completed is not open`, `… all of them
done means none open, said plainly`, `… an overdue obligation is reported overdue
however its date was typed`.

**32. The obligations chart drew finished work as outstanding.**
`js/aichart.js:247` · `obligationsDue()` and `AI_SERIES['obligations.due']`.

Root cause: #31 copied into the chart recipe — `if (o.done) continue;` and
`String(o.due).slice(0,7)`. The chart is built from live state precisely so the
model cannot fake it, which means what it miscounts is presented as fact: done
obligations drawn as open, and the Overdue bar empty on a portfolio with overdue
obligations in it.

Fix: `_acObState(o)` and `_acDue(o)`, which defer to `obState` / `obligationDue`.

Tests: `f67 — a completed obligation is not drawn as an open one`, `… every
obligation done means there is nothing to draw, not a full chart`, `… an overdue
obligation lands in the Overdue bar however its date was typed`, `… and a
hand-typed future date lands in its own month`.

**33. The sidebar count did not follow the obligation it counts.**
`js/obligations.js` · `renderObligationsSection()`, `openObligationForm()`,
`openObligationsReview()`.

Root cause: the Calendar badge ("due in the next sixty days") is recomputed at
the end of `setView()` — a screen switch. All three writers of that number live
in the workspace, which is not a screen switch. Complete the last obligation and
the badge goes on reading 1 until the reader navigates away and back, at which
point it silently corrects itself.

Fix: `obligationSurfacesChanged()` — updates the sidebar counts and repaints the
Calendar if that is the open screen — called from all four write paths.

Tests: `f68 — completing one recomputes the badge`, `… reopening one recomputes
it again`, `… removing one recomputes it too`.

**1151 tests, 0 failures** (1119 before). `f64`, `f65`, `f66`, `f67` and `f68`
are new; nothing existing was rewritten. The counterparty portal's own code is
untouched, the diff engine and hash chain are untouched, and no permission or
scoping check was altered.
## Cycle 8 — a negotiation you could not read back

Reported from a screenshot of a room reading **"Round 2 · 0 of 0 changes
resolved"**, from somebody who had just spent a round negotiating and could find
no trace of it.

Nothing was broken, which is what made it worth fixing. `negoAdvanceRound`
archives a round's decided changes onto `c.negotiation.rounds`, makes the
resolved wording the new baseline, and empties `c.changes` — correct, and the
whole point of a round. But the change index drew `negoChanges(c)` and nothing
else, and `negoVersionOptions` offered the live pair plus `listedVersions(c)`
and nothing else. So the moment round 1 closed:

- every decision in it, every reason given, every discussion and every
  fingerprint left the screen, and the panel read "No changes on the table";
- `c.negotiation.rounds[0].baselineBody` — the wording the negotiation actually
  started from — was stored, intact, and unreachable from the one page that
  exists to put two wordings side by side.

A record you cannot look at is not much of a record.

### The names

`Original Baseline · round 2` became `Round 2 - Baseline`. The round is what
orders a list spanning several of them, so it leads the label instead of
trailing it; the old shape read as a pile of similar phrases whose one ordering
fact was the last thing on each row.

Snapshots are numbered **within their round** — `Round 2 - V1` is the first
snapshot of round 2, whatever its number in the version history. That number is
not lost: it moves to `sub`, which `negoCompareDocHtml` prints under the pane.
The keys are untouched (`v3` is still `v3`), so nothing that resolved stopped
resolving.

Which round a snapshot belongs to is now stamped at capture (`roundStamp`), and
`negoAdvanceRound` passes the round that CLOSED rather than letting it read the
counter it has already incremented — otherwise "Round 1 closed" files itself
under round 2, the one entry nobody could place. Contracts negotiated before the
stamp existed carry none, so `negoVersionRound` falls back to the clock: a
snapshot taken before round 1 closed belongs to round 1.

### The closed rounds, on the list and readable

Each closed round contributes `Round N - Baseline` from its stored body. Its
WORKING version is deliberately not a separate row — it is word for word the
next round's baseline, which is the row directly below it.

That exposed a real duplicate the moment it worked. Closing a round also saves a
snapshot of the wording it produced, so `Round 1 - V1 · Round 1 closed` and
`Round 2 - Baseline` are the same document, every time — and the live row can
never be dropped, so first-seen-keeps-it put both on the menu. `negoVersionChoices`
now seeds `seen` with the live pair's text before the pass, so **the live row
wins a tie wherever it sits**. That is the rule the list already had, applied to
the entries added to make history reachable.

`negoHistoryHtml` puts the closed rounds under the live index, folded, one
section per round with its count and outcome on the header. Drawn only when
open — six rounds behind `display:none` is six rounds of cards, threads and
fingerprints built on every repaint of a screen showing none of them, and it
makes "is this readable" a question about a stylesheet.

The cards are read-only and carry `data-nego-past`, not `data-nego-card`: there
is no verb that could honestly be offered on a change settled two rounds ago —
accepting it again would be inventing a second decision, and the wording it
produced is already the baseline. What they carry is the decision, the reason,
the discussion, the author and the full hash.

### And a round no longer closes by surprise

One control closes a round, and its words are `Send to Docs tab for signature` —
about the step after, on a button that ends the round, archives its decisions,
moves the counter, empties the table and cannot be undone. Nothing in this
product reopens a closed round.

`negoConfirmCloseRound` names the act before it happens, with the real counts off
the contract, and it sits ABOVE the `opts.onReadyToSign` branch — a guard inside
the fallback would have protected the one path nobody uses, since the
Negotiations tab supplies its own hand-off. Cancel means the round never closed:
no archive, no snapshot, no audit line, changes still live. A page with no
`confirmDialog` goes ahead, because refusing to perform a deliberate act over a
dialog that could not be drawn would break the only route out of a finished
round.

Nothing here touches the diff engine, the fingerprints, the change model or
`richToText`. Accept All / Reject All are unchanged. The share payload does not
carry `negotiation.rounds`, so the counterparty's page is unaffected.

**1142 tests, 0 failures.** `f69` is new (25 tests). Four existing tests were
rewritten to the new labels and the new list: `f36` (the hand-off is now
asynchronous), `f38`, `f46` and `f54`.

## Cycle 9 — one record, two screens, and the card that would not say whose it was

Four faults from one sitting with the product, three of them reported as
questions rather than bugs — which is usually where the real ones are.

### 1. The counterparty's screen did not match ours

Cycle 8 gave the OWNER the rounds that are over. The counterparty got neither
the rows nor the history, because `buildSharePayload` never carried
`negotiation.rounds`. And it was worse than an omission: the payload sends
`negoAllChanges` — live AND archived — and `portalNegoContract` put the lot into
`c.changes`, which is what the index draws as "on the table". So a change settled
two rounds ago sat among this round's open questions looking exactly as live as
they did.

`shareNegoRounds` now carries each closed round's number, when it closed, the
wording it was measured against, and **the ids of the changes that belonged to
it**. Not the changes themselves — they already travel once, whole, in
`shareChanges`, and two copies of one fingerprint on one page is an invitation
for the two to disagree. The ids are the join; the portal partitions
`c.changes` on them and files each round's own set onto `negotiation.rounds`.

**The thing that would have broken quietly.** Taking the archived changes out of
`c.changes` also took them out of the two counters rebuilt from it. `negoNextId`
mints from `negotiation.seq` and `negoIssue` links onto `chainHead`/`chainSeq`,
both derived from that array on every repaint — so five archived changes and
nothing live would have restarted the count at CHG-001 and handed a reader's next
ask a fingerprint that already belonged to something else, with a chain head
pointing past it. Both now read `everyChange` — live plus archived.

Payload cost: ~4KB per closed round on the test contract, against a 15MB server
limit. Not capped, deliberately — a cap would mean the oldest rounds silently
vanish from their dropdown, which is the fault being fixed. `negoVersionOptions`
lifts a round's body from its text when a link carries no body, so an older
payload degrades instead of offering an empty document.

### 2. Nothing said whose ask a change was

Reported as *"why do some cards have Change decision and some do not?"* — which
is `!mine` working correctly on a screen that would not say which was which.
Nobody rules on their own ask; the only thing carrying that fact was
`(your side)` in grey italic at the bottom of the card, beside an author name
that on a deal where one person is testing both sides says nothing at all.

`negoWhoseHtml` puts it in the top row as a pill, named — "Nordfrakt Logistik
AB's ask", not "counterparty" — and the card takes `.is-mine`, a dark blue left
edge. Two channels on purpose: words survive a printed page, a colour-blind
reader and a phone rendering its own controls; colour is what lets eight cards
split into two groups without being read. The grey italic is gone rather than
left beside it.

**The edge cannot collide with the amber "not sent yet" edge**, and that is a
property rather than a coincidence: `held` only ever lands on a decision made
about the OTHER side's ask, because nobody decides their own. Asserted, so the
styling rests on something.

One component serves both screens and computes `mine` from the side looking, so
the card we see as ours is the card they see as ours — no second implementation
and no way for the two to disagree.

### 3. Dark red for a round that is over

On the selector rows (`option.closed`) and on the history below it, so the
colour means one thing in both places. Deliberately not `--n-reject`: a closed
round is finished, not refused, and two reds a shade apart meaning two different
things is worse than no colour. Browsers on a computer honour a colour on an
option; Safari and phones draw the OS menu and may ignore it — every label
starts with `Round N - ` either way.

### 4. Two buttons that move the deal, and one that was spare

`Send to <them>` hands over the turn; `Send to Docs tab for signature` closes the
round. Everything else in the room edits, reads or decides within it. Both now
carry `.nego-go` — larger, filled, raised — instead of rendering at the same
weight as the ghost button beside them.

`Share Link` is removed from the bar. It opened the same dialog by the same
route as `Send to <them>` (the send handler has said so in a comment since it was
written), from a position beside Save Draft where nothing suggested it was how
the contract reaches the other party. **`opts.onShareLink` is kept** — it is the
route the send rides, and removing the hook with the button would have taken the
send with it. There is a test for exactly that. Sharing outside the room is
untouched (`#ws-share`, the contracts list).

Nothing here touches the diff engine, the fingerprints, the change model or
`richToText`. Accept All / Reject All are unchanged.

**1165 tests, 0 failures.** `f70` is new (23 tests). Six existing assertions were
updated: `f36`/`f37`/`f69` for the marker that moved out of the grey italic, and
`f38`/`f49`/`f51` for Share Link leaving the bar.

---

## Run: Template Library & Document Converter (2026-07-30)

Defects found and fixed during the build. Blunt, per the brief.

**The baseline could not run.**
- What was broken: `npm test` failed on every file at session start.
- Root cause: the fresh container had no `node_modules` — `npm install`
  had never run; the first "baseline" was measuring a missing dependency.
- The fix: install, re-baseline (1672/1672 green), only then build.
- How it was verified: the suite ran green before the first feature commit.

**A stale library list could paint over the builder.**
- What was broken: the library screen loads its list async; navigating into
  the detail or builder before the fetch resolved let the late response
  repaint the list over the screen the user was working in.
- Root cause: the async callback checked only the current view name, which
  is 'tpl-library' for list, detail, builder and confirmation alike.
- The fix: a monotonic token (`tplLibCancelPending`) — drill-ins invalidate
  any in-flight list response.
- Files touched: js/views/templatelib.js, js/views/templatebuilder.js.
- How it was verified: code path review; f103 pins the render outputs.

**Cross-module const would have thrown in the real browser.**
- What was broken: the confirmation screen referenced `TB_BLOCK_META`,
  a top-level const of another ES module — module-scoped, not global, so
  the browser would throw ReferenceError where the vm-sandbox tests (which
  evaluate files into one context) would pass.
- Root cause: the test harness is more permissive than the platform.
- The fix: export it on window like every other cross-module symbol, and
  read it as `window.TB_BLOCK_META` with a fallback.
- Files touched: js/views/templatelib.js, js/views/templatebuilder.js.

**Known-broken / not done (nothing else hides here):**
- The ≥24-of-27 Brut acceptance number has not been run against the live
  model — no API key in this environment. Everything around the model call
  is tested; the call itself is one `anthropicMessages` invocation.
- The Brut fixture is a synthetic reconstruction; the real form was not
  supplied with the brief.
- The builder has no live preview pane; the confirmation screen's block
  list is read-only (blocks are edited in the builder one click later).
- `guided` options and `{{org.…}}` defaults are settable in the builder
  but the converter never emits them (the model is not asked to invent
  options — deliberate, per "never invent a field").

---

## Run: Template Library fix work order (2026-07-31)

User-reported, from a real uploaded contract (GULIZ LLC master procurement
agreement). All four confirmed and fixed; proof in f106 + updated f101/f105.

**Deleted fields reached contracts as literal {{code}}.**
- What was broken: fields deleted on the upload-review screen left their
  {{markers}} in the wording; the renderer showed unknown markers verbatim
  ("visible mistakes" — a decision that turned one delete into corruption);
  the model sometimes wrote the execution area longhand AND the renderer drew
  its own signature block, so signatures printed twice, once as code.
- Root cause: no marker cleanup on delete, no marker↔field check at publish,
  a renderer that preferred honesty over safety, no signature reconciliation.
- The fix: four layers — strip on delete, block publish on orphans (named),
  render orphans as plain blanks, rebuild signature wording as signature
  blocks; plus repair-on-open for records already damaged.
- Files touched: js/templateform.js, js/views/templatelib.js,
  js/views/templatebuilder.js, js/views/portal.js, server/server.js.

**Blanks looked fillable but were inert, and were green.**
- What was broken: the highlighted blanks in the document were render-only;
  filling lived solely in a side panel the document never pointed at. Green
  also reads as done/positive in this design — wrong for emptiness.
- The fix: blanks are grey (neutral palette, dotted rule), carry
  data-field-key (sanitiser admits it as narrowly as data-clause-id), and a
  click opens the right typed input in place — owner and portal — validated
  by the shared registry, autosaved through the same commit as the panel.
  Print shows underscore blanks. Signature blanks route to the signing flow.
- Files touched: index.html (CSS), js/richdoc.js (allowlist),
  js/templateform.js, js/views/templatelib.js, js/views/portal.js.

**The library was invisible from where users actually look.**
- What was broken: published templates appeared neither on the Templates
  page nor in + Draft new agreement — a third place nobody knew to visit.
- The fix: the standalone page is folded into the Templates page as the
  "Company standard templates" section; published templates join the
  draft-new-agreement menu above the built-ins; the sidebar count includes
  them. Deep screens (detail, builder, review) remain, returning to the
  Templates page.
- Files touched: js/views/templatelib.js, js/views/library.js, js/app.js,
  index.html (nav item removed).

**Known-not-done:** old settings-blob custom templates are still their own
section (migration explicitly out of scope); the popover handles typed and
guided fields — file/stamp fields route to the panel's file input by design.

Two follow-on defects surfaced by the after-screenshot pass (real Chromium),
both in the new click-to-fill popover, both fixed the same day:

**Committing with Enter fired the commit twice.**
- What was broken: Enter committed the value, the popover was removed, and
  removing the focused input fired its `change` event — a second commit on a
  popover that no longer existed. Chromium logged a DOM error
  ("node to be removed is no longer a child").
- The fix: a `done` flag — `close()` sets it, `commitPop()` checks it. One
  door, crossed once. Same guard on the portal's popover.
- Files touched: js/views/templatelib.js, js/views/portal.js.

**The document repainted as escaped HTML after a popover commit.**
- What was broken: after committing, the doc canvas showed the contract's raw
  markup as text (`<h1>STANDARD SUPPLY AGREEMENT</h1>…`).
- Root cause: `renderDocHtml(content, format)` treats a missing `format` as
  plain text and escapes it; both repaint sites passed only the content. The
  dom-sandbox tests stub `renderDocHtml` with a one-argument function, which
  is exactly why they never caught it — the real browser did.
- The fix: pass `window.RICH_FORMAT || 'rich'` at both repaint sites
  (repair-on-open and tplFormCommit).
- Files touched: js/views/templatelib.js.

---

## Run: the Copilot asking a question is not a redline (2026-07-31)

Found from a single screenshot: a drafter selected the price-adjustment and
invoicing sub-paragraphs of clause 4 and typed "combine them". Two defects,
which fail apart and are fixed apart.

### 1. A clarifying question was drawn as contract wording, under an Apply button

**What was broken.** The Copilot replied in prose — "I need to see the full
context of what the drafter wants me to combine… Please share: the full
contract…" — and the whole reply, markdown asterisks and bullet list included,
was rendered as the PROPOSED WORDING for clause 4.2 with an **Apply Redline**
button under it. One press would have filed a question into the contract as a
tracked change, authored, on the record and on its way to a counterparty. The
chat bubble above it read "Here is a replacement for that passage" — the panel
vouching for a reply it had not parsed.

**Root cause.** `AI_NOT_WORDING` (`js/ai.js`) is the guard that keeps a model's
remarks out of the proposal card, and every pattern in it described a model
REFUSING: "I'm sorry", "I cannot", "As an AI", "this is not legal advice",
"I would recommend". A model ASKING matches none of them, so
`aiLooksConversational` returned false, `aiSplitDisclaimer` classified the reply
as wording, and `aiParseProposal`'s no-JSON fallback handed all 786 characters
back as `proposedText`. Nothing between the card and `negoEditClause` re-checks
whether wording looks like wording.

**The fix.** A second list, `AI_ASKS_BACK`, for the openers a model uses when it
wants something before it will draft, plus two rules for the question itself:
`AI_ASKS_WHOLE` (anchored at both ends — a candidate that is nothing but a
question) and `aiAsksTheReader`, the one unanchored rule, kept safe by requiring
a conjunction a clause cannot satisfy — a question mark AND the model speaking
as "I". Contract wording is third-person about the parties; it does not say "I"
and it does not ask the reader anything. `aiOpenProposal` already had the right
behaviour waiting for an empty `proposedText` (one bubble, no card, session
stays open); it simply never fired. "Please provide" and "Please confirm" are
deliberately absent — a facility letter really does close "Please confirm your
acceptance by countersigning", and eating real wording is the same harm in the
other direction.

**Files touched.** js/ai.js.
**Verified.** f98a (the verbatim shipped reply yields no card, ten other ask
shapes likewise), f98b (eight strings of real wording, each brushing a new
pattern, still reach the card — including roman-numeral sub-paragraphs, which
are the near miss the first-person test is written to survive).

### 2. The panel never sent the conversation, so "them" had no antecedent

**What was broken.** "combine them" reached the model with the passage and that
one sentence. The turns before it were dropped, so the pronoun pointed at
nothing and the model asked for context the panel was already holding. Worse:
the drafter's ANSWER would have gone out the same way, so a session that once
needed clarifying could never get out of the loop.

**Root cause.** The seeded session (`aiOpenRephraseSession`) stored the passage
and a callback, and nothing else. `aiSubmit` called `onPropose(q, session)`, and
both views' `propose` called `copilotPropose` with no `history` at all. History
existed only on the follow-up path (`aiRefineProposal`), which does not run
until a card exists — so the first instruction in every session travelled blind,
and a session that produced no card never got a second chance.

**The fix.** The session keeps its turns (bounded to six, markup stripped).
`aiSubmit` reads the history before recording the new sentence — the instruction
is already stated on its own line, and repeating it would invite the model to
answer the echo — and hands it to `onPropose` as `{ history }`, the same shape
`onRefine` already receives. `aiOpenProposal` records a reply that produced no
card, because that is exactly the reply the next sentence is answering.

Two smaller things fixed alongside, both contributors to the same screenshot:
`copilotPropose` now sends the clause label, because a passage reading "4.2 …
4.3 …" arrived as bare text and the model concluded it was being shown two
clauses — a thing this product does forbid combining, and not what it was
looking at (a clause here runs heading to heading, so both are sub-paragraphs of
clause 4). And a reply that missed the shape no longer claims "I have no
reasoning to add"; it says the structure was missed and to read the wording
before applying it.

**Files touched.** js/ai.js, js/views/negotiation.js, js/views/doclab.js.
**Verified.** f98c (turns kept, ordered, markup-free, bounded, not recorded once
the session closes), f98d (the honest bubble), f98e (the history and the label
reach `copilotPropose` and the composed prompt, end to end on the negotiation
page). Full suite 1825/1825, plus 22/22 selection and 69/69 redline browser
checks — the multi-clause and live-redline refusals still refuse.

**Not done.** Nothing between **Apply Redline** and the contract inspects the
wording; the guard is at the parse. A model that returns a plausible-looking
non-clause the patterns do not catch still gets a button. A second check at
Apply — length against the passage, or a "this does not read like a clause"
confirm — was considered and not built: it needs a rule that will not fire on
short real edits, and guessing at one is how the first guard got too narrow.

---

## Run: the market is a setting, not a sentence (2026-07-31)

### 1. Kenya was hard-coded into ~90 places, none of them a setting

**What was broken.** The product was written for one market and asserted it in
code rather than configuration. The Copilot was told "you are helping negotiate
a contract governed by Kenyan law" on every rewrite, on three separate prompt
paths plus the server's own. Money formatted as KES through `fmtKES` — the
formatter's *name* was a hard-code. The executed copy and the evidence pack
cited the Business Laws (Amendment) Act 2020. The scanner asked whether a lease
had been stamped under Cap 480 and named the Data Protection Act 2019. The
playbook's governing-law position was "Kenyan law & forum", and its foreign-law
test literally meant "not Kenya". The generated document header stamped
"Republic of Kenya" on every contract the app produced.

A pilot outside Kenya would have been advised to negotiate for Kenyan courts,
shown shillings, and told its signatures rested on a Kenyan Act — each wrong in
the same way, none of them saying so.

**The tell nobody had noticed.** A Jurisdiction switcher (SE / KE) was already
in the header. It set a `data-region` attribute and raised a toast saying the
workspace had switched, while every sentence above stayed exactly where it was.
A control that reports a change it did not make is worse than no control.

**The fix.** `js/jurisdiction.js` — one table of packs (Kenya, Sweden), and
every assertion above reads from the active one. A pack holds what the app must
know to describe a market honestly: what the law is called, what money looks
like, which statute a signature rests on, which statute-specific checks apply.
It does NOT hold legal advice invented for a market nobody here has practised
in — where a pack has nothing to say (Sweden levies no stamp duty on a
commercial lease) the field is null and the check does not run, rather than
firing with a blank where the statute name goes. `fmtKES`/`fmtKESshort` became
`fmtMoney`/`fmtMoneyShort` and moved into the pack.

The foreign-law test is now RELATIVE — "not home" rather than "not Kenya" — so
a Kenyan-law contract is correctly foreign paper to a Stockholm workspace and
the same code path serves both. The header switcher is wired to the record and
repaints; it opens on the stored jurisdiction (which rides on the org, so a
workspace carries its market across devices) rather than on whatever key this
browser last held.

**Kenya stays the default, deliberately.** Making the market configurable and
changing it in the same breath would move every existing workspace's money,
playbook and scan without anybody asking. A workspace that never touches the
setting behaves exactly as it did.

**One table, two hosts.** `server/server.js` requires the same module rather
than restating the packs. The repo already carries one deliberate twin
(`negoCopilotRecord` / `copilotNegotiation`) with a test holding it honest; a
second was not worth the same cost when a plain require would do.

**Files touched.** New js/jurisdiction.js. js/app.js, js/ai.js, js/core.js,
js/playbook.js, js/metadata.js, js/versioning.js, js/approvals.js,
js/aichart.js, js/advice.js, js/fieldlib.js, js/templates.js, js/wizard.js,
js/views/{contract,negotiation,doclab,portal,settings,register,reports,advice,
adviceportal,queue,home,intelligence,library,migration,templatebuilder}.js,
server/server.js, and the four test harnesses that evaluate app modules onto a
bare stage (test/dom.js, test/world.js, test/portalworld.js, the two Chromium
pages) — a view that renders money now needs the pack on the stage with it.

**Verified.** f99 (23 tests): default unchanged; switching moves currency, law,
e-signature basis and playbook label together; foreign-is-relative in both
directions; the stamp-duty check runs in Kenya and stays silent in Sweden; the
data-protection finding names the right regime; every pack answers every field
the app asks of it; the server requires the same module; the switcher is wired.
One test is a source-level guard against the failure most likely to reappear —
the next prompt somebody writes saying "Kenyan law" again.

Beyond the suite: the real app was booted in Chromium, signed in with the
30-contract sample portfolio, and swept across eleven views in BOTH markets —
no unrendered `${…}` anywhere (the risk when a plain string becomes an
interpolation), no KES leaking into the Swedish workspace, no page errors.
Suite 1848/1848, browser 69/69, selection 22/22.

**Not done / known.** The 12 built-in template papers, the seeded playbook
clause wording and the 30 demo contracts are still Kenyan — deliberately, and
agreed with the user before starting. They are CONTENT, not configuration:
deleting them removes working features rather than un-hard-coding anything, and
a Swedish pack of papers has to be written by someone who practises there, not
generated here. A Swedish pilot gets correct law, currency, statutes and
Copilot briefings with a Kenyan template library it can ignore or replace.

Per-contract currency is also not done: money follows the workspace, so a
contract denominated in USD still displays in the workspace currency. That was
the explicit choice — the alternative needs the register, reports and charts to
total across mixed currencies, which is a larger change than this one.

---

## Run: three things a person doing the work kept hitting (2026-07-31)

All user-reported from one session, all the same shape: the product asking for
something it already had, or showing something twice.

### 1. The send dialog came back on every single change

**What was broken.** After sending the first redline to a counterparty, pressing
Send on the next one re-opened the whole "What you are sending" dialog — purpose
picker, change list, covering note — once per change, for the life of the
negotiation.

**Root cause.** `#nego-send` has always taken a one-press route when a contact
exists (`js/views/negotiation.js`), and the comment beside it even says the
dialog "stops appearing the moment there is an address to remember". Nothing
ever wrote that address. The contact is read from
`counterpartyContact(c, cachedShares(c))`; `_shareCache` is only ever filled by
`renderSharesSection`, which runs on the contract workspace page and never on
the redline workbench, so on that screen it is permanently `[]`. The fallback is
`c.counterpartyEmail`, and the share dialog — the very form that had just
collected an address — did not set it. So the dialog collected the address, used
it once, and forgot it.

**The fix.** `shareRememberRecipient` in `js/core.js`, called from both send
paths (server and static). First recipient wins: a later one-off — a copy to
counsel, a second signatory — must not silently re-point where the next round
goes, and the address is changed deliberately through the setup strip that owns
it. A signing link records nobody: it goes to whoever signs, who need not be the
person the contract is being argued with.

**Files touched.** js/core.js.
**Verified.** f100a — the recording rule in all four directions, plus that
`counterpartyContact` then answers, which is the thing that turns the next Send
into one press. One test asserts both send paths route through the single rule,
because a second copy would drift and bring the dialog back on one path only.

### 2. The change card carried a second copy of the redline

**What was broken.** Every card in Tracked Changes rendered the redline clamped
to two lines — beside a document pane already showing the same wording in full,
in its clause, with its neighbours. The card's copy was the lesser one: cut
mid-sentence, no surrounding text, nothing to act on. A column of six looked
like six paragraphs.

**The fix (specified by the user, mocked and agreed before coding).** The card
is a handle: id, whose ask, clause and author, status, and the verbs. No
wording. It is OPEN while there is something on it to press and a LINE when
there is not — and that rule is read off the verbs the card actually offers
rather than off a second enumeration of statuses, because two copies of "is
there anything to do here" would disagree the first time either moved and the
card that lost would hide a live control. `Edit` and the disabled `Sent` do not
count: one navigates, one is a label.

Pressing a folded card opens it AND jumps to the change (one press, not two —
the reader has already said which change they mean). The caret is the only
control that folds, deliberately separate: the card's own press means "take me
to this change", and a reader navigating to a clause must not have it fold up
underneath them. A hand-made choice survives repaints for the session.

**Files touched.** js/views/negotiation.js.
**Verified.** f100b, plus f89/f92/f93 updated to the new contract (the amber
`Sent` verb now lives one click inside a folded card; the badge on the head is
what says "this has gone"). Browser: `test:browser` check 14 rewritten — it used
to assert the card held only the marked runs, and now asserts it holds no copy
at all while the document still marks it. Driven end to end in Chromium: fold,
click-to-open-and-navigate, caret-to-fold, no page errors.

### 3. Every message box in the product was one line

**What was broken.** Six composers, all `<input type="text">`: the Copilot ask,
reply-on-a-change (two mounts), start-a-thread, reply-on-a-point, comment-on-the
-terms, and the counterparty's clause note. Past about a dozen words the start
of your own sentence scrolled out of view, so you could not re-read what you
were about to send — on a message going to another company.

**The fix.** `chatFieldWire` / `chatFieldGrow` / `chatFieldSubmits` /
`chatFieldReset` in `js/components.js`, and every composer is now a wrapping
textarea that grows from one line and scrolls past `max-height` (a composer that
can push its own send button off the panel has traded one problem for a worse
one). Enter still sends — that habit is why these were inputs — with Shift+Enter
for a newline, and the rule lives in one place so six composers cannot drift.
IME composition is excluded: Enter mid-composition commits a candidate word, and
treating that as "send" posts a half-typed message in exactly the languages
least able to spot it.

**The trap worth recording.** A textarea inside a `display:none` subtree reports
`scrollHeight` 0, and the sidebar mounts one of its two faces at a time — so
measuring the hidden one would write `height:0px` and leave a zero-height box
the moment that panel was shown. `chatFieldGrow` leaves an unmeasurable field at
`auto` and `rlSetSideMode` re-measures when the face appears.

**Files touched.** js/components.js, index.html, js/ai.js, js/views/negotiation.js,
js/discuss.js, js/views/contract.js, js/views/portal.js.
**Verified.** f100c — all six composers converted, the wrap/cap/resize CSS on
both stylesheets (the workbench also mounts as an embed on the counterparty
portal, which does not carry the shell's head), the Enter rules including IME,
growth and its cap, the hidden-field guard, reset-after-send, and that wiring a
field three times binds its handlers once. Measured live in Chromium: the
Copilot box 62→104px capped at 105, a thread reply 29→64px capped at 86.

**Whole run.** Suite 1889/1889, browser 71/71, selection 22/22.

**Not done.** The counterparty's incoming asks follow the same rule by choice —
open while pending, folded once decided — which was the agreed answer but is a
behaviour change on a screen the counterparty sees too. Nothing collapses on the
older two-pane negotiation cards (`.nego-card`, `js/views/negotiation.js:1391`);
that surface was not in the report and shares no markup with the workbench.

### 4. Follow-up: "after send the cards are not collapsing" — they were

**What was broken.** Reported from a live session with a screenshot: a sent card
open, showing its Copilot note and Edit / Sent, beside a fresh draft.

**Root cause, and it was not the collapse.** Driven end to end against the real
server, the send folds the card correctly. What the reader had done next was
press it — to check it had gone, the most natural move there is. That opened it,
by design. The defect was that the choice was remembered against the change ID
and nothing else, so it never expired: that card stayed open for the rest of the
session, through every later state change, and the feature read as broken.

The mirror of it is the one that mattered more. A card SHUT by hand while it was
your own draft stayed shut when the counterparty answered and it came back
carrying **Accept** and **Reject** — live controls on a decision waiting on you,
hidden behind a preference expressed about a different card state entirely.
Nobody would have gone looking.

**The fix.** The choice is stored against the state it was made in. The card's
verb set is that state — it is exactly what the open/shut rule reads, so
anything that changes the rule's answer also changes the key — and the card
carries it as `data-rl-state` so the handlers can record what was chosen. When
the state moves, the choice lapses and the rule takes over. One card holds one
choice: a stack of remembered choices per state would surprise a reader who
returned to a state months later.

The key is the ACTIONS on offer with the ids stripped out, so a clause renamed
under a card is not read as "this is a different card now".

**Files touched.** js/views/negotiation.js.
**Verified.** f100b — the peek not outliving its state, the dangerous mirror
(Accept/Reject never behind a stale choice), the key ignoring ids but not
actions, and the reported sequence end to end. Driven against the running
server: draft → send → folds → peek → opens → caret → folds → a second draft
alongside it, with the first still folded. Suite 1894/1894, browser 71/71,
selection 22/22.

### 5. The counterparty could not send a second batch of asks

**What was broken.** Reported from Counterparty View: two drafts on the table,
Send pressed, and a red **"It is already their turn"** — with nothing sent. The
drafts had nowhere to go for the rest of the negotiation unless the owner
happened to move first.

**Root cause.** The turn and the send were one fact. `turn` is whose move it is;
`turnAt` is when work last left the desk, and `negoUnsentAsks` measures against
`turnAt` alone — it is the only thing that decides whether an ask has been sent.
`negoHandOver` returned `null` whenever the target side already held the turn,
which is exactly the state a counterparty is in after answering a round:

    they answer round one and hand back   → turn = owner
    they then raise two more asks         → still turn = owner
    they press Send                       → refused, nothing sent

The owner had the identical trap through the share path (`js/core.js` hands over
after publishing), and it would have bitten on any second send inside one turn.

**The fix.** A hand-over to a side that already holds the turn still SENDS when
there is something of ours waiting: the turn does not move — it is already
there — but the work leaves and `turnAt` records it. With nothing unsent it
remains a no-op, which is the idempotency the share path relies on (two callers
may both hand over after one send, and the second must not stamp again).

`negoHandOver` now returns `moved`, and both sides' messages stopped claiming a
turn change that did not happen: "Sent to X — it was already their turn, so the
table has not moved". The audit line likewise distinguishes a hand-over from a
further send, because anyone reconstructing the negotiation later reads it as
the record of who held the table when.

The refusal message was also wrong twice over — it named the turn while saying
nothing about the drafts. It now fires only when there is genuinely nothing to
do, and says so: "Nothing to send — it is already X's turn and every ask of
yours has gone".

**Files touched.** js/negotiation.js, js/views/negotiation.js.
**Verified.** f100d — the counterparty's second batch, the owner's mirror, the
no-op with nothing waiting, a real hand-over still moving the turn, and the
audit distinguishing the two. Driven against the running server from the exact
reported state (turn = owner, one unsent counterparty ask, Counterparty View):
the send goes through, the toast is honest, and the unsent count drops to zero.
Suite 1899/1899, browser 71/71, selection 22/22.

### 6. Looking at a card is not deciding anything

**What was asked for.** Working through a round left a column of cards the
reader had opened and then had to close one at a time. Two requests: a sent card
must read `Sent` with only Edit and Sent on it; and a card the reader has not
committed to should collapse itself when they hover out or press elsewhere.

**The first was already true and could not drift** — the badge and the buttons
are both read from `negoUnsentAsks`, and `mineUnsent` / `mineSent` are mutually
exclusive by construction. What had been seen was the send not registering
(defect 5 above). Verified, not rebuilt.

**The second is new behaviour.** Peek on hover or focus; pin on click; unpin on
a press anywhere outside the column. At most one card open at a time, and it
closes as soon as attention moves on.

**Three things this needed, and one it did not get wrong by luck.**

- *The peek is a class on the live node, never a repaint.* Re-rendering the
  column on `mouseenter` would fight the pointer, drop the node the event came
  from, and disturb a half-typed reply in the Discussion panel beside it. That
  is why the card body is now always in the DOM and hidden with `display:none`
  when shut — which also keeps a hidden verb out of the tab order and the
  accessibility tree, not merely off the screen.
- *A grace period.* A card is not one rectangle to a pointer: crossing from the
  head to the buttons leaves the element for a frame, and an undelayed collapse
  slams shut mid-reach. 180ms, cancelled if the pointer returns.
- *The exemption, which is the whole safety argument.* A card with Accept,
  Reject, Send, Retract, Undo or Withdraw on it never peeks and never
  auto-collapses. Without it this feature would take a button off the screen
  while the reader's mouse was travelling toward it — the same wound as defect 2
  in this run, in a worse form: there the control was hidden before you looked,
  here it would vanish while you watched.

  The build goes one step further than asked: such a card cannot be folded **by
  hand** either. Its caret is drawn faded and does nothing. A card that needs you
  is simply always open, which removes the class of "a live control the reader
  cannot see" rather than leaving a way to create it deliberately.

**Decisions taken by the raiser before building.** A peek does not move the
document (the page would slide about as the mouse crossed the column); a pin is
not persisted and is dropped when the reader changes contract (a working
preference is not a setting, and a carried pin would open a card they have never
seen).

**Files touched.** js/views/negotiation.js.
**Verified.** f100e (13 tests): the exemption in both halves, peek without
repaint, the grace and its cancel, keyboard focus, pin surviving repaints,
unpin on an outside press, one pin at a time, pins not travelling between
contracts, no persistence, and no document movement on a peek. f100b/f89 updated
to the render-and-hide contract. Driven with a real pointer in Chromium against
the running server — at rest shut, hover opens, away closes, click pins and
navigates, click elsewhere releases. Suite 1911/1911, browser 71/71,
selection 22/22.

**One test-harness trap worth recording.** `test/world.js` runs `setTimeout`
synchronously so deferred UI work lands inside a test. That is right everywhere
else and wrong for a grace period, whose entire behaviour is the delay — under
the stub the card closes on the same tick as the `mouseleave` and the test
passes while proving nothing. Both `setTimeout` and `clearTimeout` are restored
for those two tests; restoring only the first makes the cancel a silent no-op.

---

## Run: Linked references and the renumber button (N1 + N2 — closes OI-1 and OI-2)

### 1. A cross-reference to a deleted clause was never flagged (OI-1)

**What was broken.** Nothing in the codebase knew a reference was a reference.
"Subject to Clause 9" was plain text, so accepting a deletion of clause 9 left
the sentence pointing at nothing, silently, all the way into the executed
document.

**The fix (N1, Stage 1 — `f110`, 21 tests).** Detection uses the same number
grammar the headings use (`clauseRefsInText`), resolution runs against the
document's own clause numbers (`clauseResolveRefs`), and the warning is
ATTRIBUTED, never scanned: `negoBrokenRefs` reports only where an accepted
deletion on this record accounts for the dangling target, on the clause that
CONTAINS the reference. An extract citing its parent agreement raises nothing.
Advisory only — a reference is never auto-repaired, because rewriting wording
to fix a warning changes what the contract means.

### 2. A deletion left a visible numbering gap, with nothing said and no way to close it (OI-2)

**What was broken.** A contract numbered 1..24 that lost clause 9 read
1..8, 10..24 — correct (numbers are the text the file carries) but unexplained,
so a lawyer's first reading was a mangled document. And there was no deliberate
way to close the gap at all.

**The fix, in two halves.** The notice and the execution lock shipped first
(`f98`: attributed gaps, `negoNumberingLocked`, two voices draft/executed).
N2 (Stage 5 — `f119`, 21 tests) built the door: `clauseRenumberPlan` computes
a pure, hierarchy-aware, format-preserving plan (`8.2(a)` → `8.1(a)` exactly;
an extract numbered 4, 5, 6 proposes nothing; ids never move), cross-references
repoint in the same plan with dangling ones listed as untouched, a preview
shows 100% of it before anything is written, and the act lands as ONE audit
entry carrying the X3 structured shape for the history timeline. The gap
notice offers the button on the owner's draft surface only; an executed
contract has no path to it — the computation itself refuses, not merely the
UI. A recorded renumbering also stands the gap notice down (attribution cuts
both ways), while a reference still citing the deleted clause keeps its own
warning.

**Files touched.** js/clausemodel.js, js/negotiation.js, js/core.js (logAudit
`data` param), js/views/negotiation.js, test/world.js (audit recorder carries
`data`), test/f98 (draft-side assertion adjusted deliberately per the work
order), test/f119.
**Verified.** Suite 2099/0 · redline 71/71 · parity 18/18 · selection 22/22.

---

## Run: the same column, read from the counterparty's chair (2026-07-31)

The two items WORKORDER-change-card-behaviour.md left open, both on the same
seat. The counterparty's page mounts the SAME renderer with
`side:'counterparty'`, so Draft/Sent and peek/pin arrive there by construction —
but "by construction" is a claim, not a reading, and neither had been read back
from that chair since the send-vs-turn fix (`0c41ffc`). One of them was not fine.

### 1. WO-1 · Sent, on the counterparty's own portal page — verified, no fault

**What was checked.** WO-1 item 3: that a sent ask of the counterparty's OWN
reads `Sent` and carries exactly **Edit** and **Sent** from their seat, as it
does from the owner's.

**What was found.** It holds, and it cannot drift: the portal passes its held
asks as `unsentIds` (`PORTAL_NEGO_PROPOSED`), and pressing the postbox moves
them to `PORTAL_NEGO_PROPOSED_SENT` and clears the held set — so the badge and
the verbs flip off the same one reading the owner's do. No code changed.

**Verified.** f100f, three tests: held it is a Draft with Edit/Retract/Send; sent
it is `Sent` with exactly Edit and Sent, Sent disabled, and no `data-rl-send` or
`data-rl-retract` anywhere on the card — the fault as originally reported, which
was never a rendering fault on either seat.

### 2. WO-2 · the unpin repainted the owner's workbench from inside the portal

**What was broken.** On the counterparty's page, pressing anywhere outside the
Tracked Changes column released the pin in the record and left the card open on
screen. The reader could not put a card away.

**Root cause.** The document-level unpin handler
(`js/views/negotiation.js`) ended `if (rlCardUnpinAll()) renderRedline()`.
`renderRedline` is the OWNER's page — it paints `#content` from
`state.activeId` — and this handler is wired by `rlWireClauseTools`, which
already carries `again` for exactly this reason and says so at the top of the
function: "falling back to renderRedline from inside an embed would paint the
owner's workbench over a page that is not the owner's." The mount that had to
redraw the card was never asked to. On the portal the owner's shell is hidden,
so the visible fault was only the stuck card; the wrong paint still happened,
into `#content`, behind it.

The same handler read its column with `document.getElementById('rl-changes')` —
"outside the column" answered by whichever mount the document held first, rather
than by this one.

**The fix.** `again()` instead of `renderRedline()`, and the column read off the
mount (`host.querySelector`). No change on the owner's seat, where `again` IS
`() => renderRedline()`.

**And one the same reading turned up.** `rlCardForgetPins` was called only by
`renderRedline`, so a pin made on a mount outlived the contract it was made on —
the rule the owner's page keeps, not kept by the embed. Now called by
`redlineEmbed` on the same terms (it clears only when the contract id moves, so
the portal's rebuild-on-every-change does not drop a live pin).

**Files touched.** js/views/negotiation.js.
**Verified.** f100f (5 tests). The two behavioural ones fail against the
unfixed file for the right reasons — the card stays open, and a marker left in
`#content` is destroyed by the owner's paint — and pass with it. The three WO-1
tests pass either way, which is what a verification item should do. Suite
1916/1916.

**Not done.** The mixed toolbar in Counterparty View (the owner's **Send All
Redlines** and **Publish Round** still drawn while previewing the counterparty's
seat), noticed during the original investigation and explicitly excluded by the
work order. Still open, still unspecified.

## Run: Plain meant short everywhere except where it was asked (2026-07-31)

**What was reported.** "Why is copilot coming back with long long explanations?"
— with a screenshot of a Shorten & Simplify over a lease clause that needed no
change at all, answered in a full paragraph.

**What was broken.** Not the model. The advice field described itself to it as a
FOUR-PART CHECKLIST — "what you changed, which risk it moves, what it costs to
ask for it, and anything the drafter should check" — so four points came back,
including the three whose honest answer was "none here". The screenshot answers
them in order: *"No risk moves either way"*, *"a Lessor will likely accept it as
neutral"*, *"check that 'throughout the term' is understood to include any
extension period"*. Ask four questions, get four paragraphs.

**Root cause.** The reader has a control for exactly this and it did not reach
this path. PLAIN / LEGAL (`ai.style`) is the register, and its plain half — "short
answers, two or three sentences" — DOES travel on every call, inside
`AI_STYLE_RULES`, in the system brief. But the four-part checklist sat in
`AI_PROPOSAL_FORMAT` / `AI_EDIT_FORMAT`, in the instruction directly beside the
passage. A specific enumeration next to the question beats a general rule in the
background briefing, every time. So the two contradicted each other on every
plain-mode call, the nearer one won, and the button's own tooltip ("Everyday
language, short answers, no legal jargon") described something the product did
not do here.

**The fix.** One shared `AI_ADVICE_FIELD(made)`, read by both formats, that
answers to the register.

- **Legal is byte-for-byte what it was.** The complaint was that the depth was
  compulsory, never that it was wrong. A reader who asks for depth gets exactly
  the text they got before.
- **Plain asks for two or three sentences**, leading with the answer — and makes
  the four points CONDITIONAL, which is the half doing the work: three sentences
  that must still cover four headings is compression, not brevity, and comes
  back as a denser paragraph rather than a shorter one. Guarded against the
  obvious failure of the fix — a risk that is real is still asked for; only the
  empty slot goes.
- **Both formats became functions**, for the reason `AI_GROUND_RULES` is one
  (see the jurisdiction run): the register is a setting the reader flips
  mid-session, and a string built at load would keep asking for the depth they
  just turned off for the rest of the session — the toggle would repaint and
  change nothing that leaves the building.
- **The shape never varies with the register.** Same fields, same names, both
  registers; `aiParseProposal` reads one contract and a second would be a second
  thing to keep in step.

Both transports get it for free: the format travels in the user message, so the
server-mediated (`ai/chat`) and browser-direct (`aiLocalClaude`) paths send the
same text, which is what that pairing was written for.

**Files touched.** js/ai.js. f88/f97 updated to call the two formats rather than
read them.
**Verified.** f107 (17 tests): the register in both formats, legal unchanged to
the character, brief-and-instruction agreement in both directions, the shape and
the placement rules surviving both, the prompt that actually leaves the building,
and the frozen-const trap. 15 of the 17 fail against the unfixed file. One source
guard is deliberately strict — "followed by a space is fine" would have passed
the very line this change fixed (`placements ? AI_EDIT_FORMAT :
AI_PROPOSAL_FORMAT`), so outside its declaration and the export list a mention
must be a call. Suite 1933/1933, browser 71/71, selection 22/22.

**Not done.** Nothing was capped in LEGAL, and nothing anywhere was given a hard
word limit — the length in plain mode is asked for, not enforced. If the paragraphs
come back long in plain after this, the next lever is a cap rather than a rewording.

---

## Run: the send that kept asking for an address it already had (field report)

### 1. A copy-link share shadowed the counterparty's email for the life of the negotiation

**What was broken.** Reported from the field: sending a redline popped the
share dialog asking for the counterparty's email *on every round*, in some
contracts but not others.

**Root cause.** `counterpartyContact` (js/core.js) returned the newest share
WHOLE. A copy-link share records only a name and a WhatsApp share only a
phone — neither carries an email — so one link copied to the clipboard
shadowed a perfectly good address: the one recorded on the contract, or the
one an earlier email share went to. Every send afterwards read `email: ''`,
concluded it had nowhere to send, and reopened the dialog. The address was in
the record the whole time. Contracts whose first share went out *by email*
never hit it, which is why it looked intermittent.

**The fix.** The newest share still decides WHO this is — name, channel,
token — and the ADDRESS is now a separate question answered best-first: the
most recent share that actually carries one, then the address recorded on the
contract. A share without an email is not evidence that there is no email.
The workbench's send also re-resolves the contact at PRESS time rather than
trusting the one computed when the screen painted, so a share list still in
flight can no longer cost the first press.

### 2. Two of the three creation paths did not record the counterparty they were told about

**What was broken.** The guided wizard and the custom-template path wrote
`counterparty:''` and folded the typed name into the display title only. So a
contract drafted for Kabras was titled "… — Kabras" while the field the
register filters on, the reports total by, and the signing readiness check
reads ("Complete: counterparty name") stayed empty — and the operator re-typed
in the workspace a fact they had already given the wizard. Uploads recorded it
correctly all along, which is why the three categories behaved differently.

**The fix.** Both template-born paths record the name they collected. All
three categories now agree.

**Files touched.** js/core.js, js/views/negotiation.js, js/wizard.js,
js/views/library.js, test/f126.
**Verified.** f126 (7) — the reported case reproduced against the fixed code,
plus WhatsApp, earlier-email fallback, newest-email precedence, the honest
null when nothing is known, first-one-wins memory, and the creation paths.
Suite 2139/0 · redline 71/71 · parity 18/18 · selection 22/22.

---

---

## Run: the read-only copy nobody could reach (2026-07-31)

**What was broken.** `POST shares/:token/derive-view` has minted a strictly
weaker view ticket since Stage 8, and `RELEASE-NOTES-stages-4-9.md` announced
it: "a negotiation-link holder can mint a read-only copy for an advisor." No
page in the product ever called it. The only callers in the repository were
`f123` and `f125` — its own tests. A counterparty whose insurer or counsel
needed to READ the deal still had exactly one thing to hand over: the
negotiate link, which carries the power to ANSWER in their name.

Found by checking the claim rather than the release note, after it had been
reported to the user as shipped.

**Why it survived.** The route is well tested and the tests call it directly
over HTTP, so every assertion passed while the UI door did not exist. Nothing
in the suite asks "can a person get to this".

**The fix.** A door on the counterparty's page, in the footer that already
carries the deal-level verbs (Ready to sign, Decline) — the same altitude: an
act about the whole deal rather than about one change.

- `portalCanDerive()` reads exactly the route's own conditions (live token, not
  read-only, not view-only, purpose is negotiate) so the button is ABSENT where
  the answer is a 403 rather than present and failing. The judgement is not
  re-implemented — a view cannot delegate and a signing holder was asked to
  sign, not to distribute, and both remain the server's to say.
- The name is asked for and optional, because it is what the OWNER sees beside
  the child in their share panel — "Nordfrakt insurers" is the difference
  between a link they can reason about and an anonymous one they revoke on
  suspicion. A CANCELLED prompt mints nothing: `promptDialog` answers `null`
  for a cancel and `''` for an empty box, and confusing the two would leave a
  live ticket on the server that somebody had just decided against.
- Minted links are HELD as a list and rendered from it, never written into the
  DOM once. This footer is rebuilt every time a decision is held, and a link
  that vanished when the reader answered the next change is a link they never
  copied. They ride in the same stored blob as the held answers (and count
  towards it, or a reader who had answered nothing would have the blob deleted
  from under them), and `portalDropHeld` writes them straight back — a derived
  link is a live ticket, not a draft, and losing the only record of one to an
  unrelated send leaves the reader with nothing to give anybody.
- The panel says what is being handed over: the holder cannot accept, reject,
  propose wording or sign; access ends on a date and sooner if the parent link
  ends; and the sender can see it and withdraw it. A reader who passes on a link
  believing it private would have been misled by our silence.

**Files touched.** js/views/portal.js. test/portalworld.js gained a derive-view
answer beside the respond and messages ones.
**Verified.** f127 (16 tests): the door's presence on a negotiate link and its
absence on signing, view-only, responded and superseded ones; the call and its
name; cancel-mints-nothing; two advisers, two links; survival across a footer
rebuild, a reload and a send; the three things the panel must say; and a refused
mint that gives the button back rather than leaving "Creating…" standing. 13 of
the 16 fail without the change. Suite 2170/2170 · redline 71/71 · selection
22/22 · parity 18/18.

**One trap worth recording.** `PORTAL_DERIVED` is a module-level `let`, which is
a lexical binding and NOT a property of `window` — a test that assigned to
`window.PORTAL_DERIVED` would be writing to a name nothing in the module reads,
the same trap `portalworld.js` documents for `canEdit`. It is handed out by
`portalDerivedLinks()` instead. And the portal stage runs on an OPAQUE ORIGIN
where `localStorage` throws on the first access — deliberately, because that is
the counterparty's own situation — so proving something was written needs
`buildPortal({ url })`, not a hand-rolled storage stub, which the accessor
silently ignores.

---

## Run: the history screen had never been looked at (2026-07-31)

**What was broken.** The negotiation history rendered at **510px of the 820px it
asks for** — 62% of its design width, with the filter bar wrapped into four rows
and every event squeezed into a column half the intended measure.

**Root cause.** `.ht` declares `max-width:820px`; `openHistoryTimeline` called
`openModal(html)` with no options, so the panel took the modal's `32rem` (512px)
default. An inner max-width cannot argue with an outer one — it can only lose.
`{ maxWidth: '820px' }` is the house convention for a modal of this kind
(js/views/library.js uses it twice); this call simply never said so.

**Why nothing caught it.** f120 and f121 prove the screen's behaviour — right
events, right order, filters that combine, tamper-detection that names the first
broken record — and every one of them ran in jsdom, which has no layout engine.
jsdom can prove an event is PRESENT. It cannot prove it is VISIBLE. The
Playwright render check was deferred from Session 14 to Session 20, then recorded
at the close of Stage 9 as the programme's one open follow-up.

This is the second time this exact failure has shipped here. The counterparty's
workbench went out rendering 419px wide against the owner's 925px, with the whole
suite green, and was caught only when `parity-verify.js` was built to look.

**The fix.** `test/chromium/timeline-verify.js` + `test/chromium/timeline.html`,
and the one-argument fix the harness found. 19 checks, all measured from
`getBoundingClientRect`/`getComputedStyle` in a real browser: the declared width
is reachable, one scrolling box rather than a scrollbar inside a scrollbar, no
filter control clipped or outside its bar, nothing drawn past the panel edge, no
event collapsed to nothing, redlines that wrap rather than scroll, the page
behind not scrolling, a written (not toasted) verdict from Verify integrity, a
filter that narrows the list without breaking the screen, and two narrower
viewports. Wired into `test:all` as `npm run test:timeline`.

**The check reads the component's OWN declared width** rather than a number
copied into the harness, so it fails when the panel cannot deliver what the
screen asks for — including if somebody later changes one and not the other.

**Files touched.** js/views/negotiation.js (one argument), package.json,
test/chromium/timeline.html, test/chromium/timeline-verify.js.
**Verified.** 19/19 after the fix, 17/19 before it — the two failures being the
width, on the unfiltered and the filtered screen. Suite 2170/2170 · redline
71/71 · selection 22/22 · parity 18/18 · timeline 19/19.

**Recorded, not fixed:** OI-5 — a `<del>` and its following `<ins>` run together
in `.ht-redline` with no separation at the join. Cosmetic, and it lives in the
shared redline renderer, so it moves every surface that draws one.

---

## Run: two buttons for one act, and only one of them following the rule (2026-07-31)

**What was broken.** In Counterparty View the workbench header read **Accept All
Non-Risk** and **Publish Round** — the owner's words — while the controls those
buttons press, three inches below, read **Accept all** and *"Send 2 changes you
have asked for and 1 decision to …"*. Two buttons for one act, saying different
things.

**Root cause.** D2's rule is written down where the bulk verbs are built
(`js/views/negotiation.js`): the verbs are named from the READER's chair,
because "Accept All Non-Risk" sorts by our playbook and our scan signals — from
the other seat it offers a verb they cannot reason about and reads out how we
score their asks — and "Publish Round" is the owner's act where the other chair
is sending answers back. The panes honour it. The header's two PROXIES onto
those same controls did not, and were never extended when the rule was written.

**Severity, stated honestly.** Nothing leaks. The counterparty's own page mounts
the panes and no header at all, so these words never reach them. What was broken
is the PREVIEW — and showing the owner what the other side sees is the only
reason anybody presses that toggle, so the preview is the whole feature. A
reader could also conclude from that header that the counterparty is being
offered "Accept All Non-Risk", which is precisely what D2 decided they must not
be offered.

**Not broken, and untouched:** the act, the target and the counts were already
seat-relative — `sendTarget` points at the counterparty postbox, `sendWho` and
the unsent count follow the seat (fixed once before, found in the six-round
simulation). `Close Round` beside them was already gated on the seat, which is
how we know the mechanism was here and had simply not been extended.

**The fix.** `bulkLabel` / `bulkTip` / `sendLabel` / `sendTip`, computed beside
`sendTarget` from the same `side`, mirroring the panes' own vocabulary:
`Accept all` and `Send Response`. The buttons also gained the titles they never
had; `redlineSyncProxies` already stashes a proxy's own title so a sync cannot
overwrite it with the unavailable message.

**Files touched.** js/views/negotiation.js.
**Verified.** f84 gained 6 tests. Three fail without the change; the other three
are regression guards that must pass either way — the act and the ids unchanged,
the owner's words restored on flipping back, and Close Round still owner-only.
The strongest of the six asserts the proxy and the control it presses carry the
SAME text, which is the durable form of the claim: two buttons for one act,
only one following the rule, is exactly how this drifted. Suite 2176/2176 ·
redline 71/71 · selection 22/22 · parity 18/18 · timeline 19/19.


---

## PDF & scanned document upload — blockers and blunt notes

### BLOCKER — no Anthropic API key in this environment, so detection quality and cost are UNMEASURED

`ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` are both unset, and there is no
settings database carrying a stored key. The test suite does not care — every
suite points `ANTHROPIC_BASE_URL` at a local stub — but two things the addendum
explicitly asks for could not be done:

- **§9's detection bar.** "Detection on the digital Brut PDF finds fewer than 20
  of its ~27 blanks after prompt iteration" is a stop condition, and it cannot
  be evaluated against a stub, which returns whatever the test told it to. The
  PDF-specific prompt rules in `TPL_CONVERT_PDF_RULES` are therefore **written
  but never iterated against a real answer.** They are a first draft, and should
  be treated as one.
- **§8's cost figure.** "API cost observed per document — note it so Young can
  price this" needs real `usage` numbers. Nothing was measured. Do not quote a
  price from this session; there is no number in it that came from a real call.

**Cost estimate, clearly labelled as arithmetic and not observation.** At the
published `claude-sonnet-4-6` rate of $3 per million input tokens and $15 per
million output, a page of PDF is on the order of 1.5–3k input tokens once the
API renders it, and the detection answer runs to a few thousand output tokens.
That puts a 2-page form somewhere around half a US cent and a 30-page scan in
the region of 15–30 cents. **These are estimates from public pricing, not
measurements.** The real numbers may differ, and a scan is likely to sit at the
expensive end because an image-only page carries more input tokens than a text
one.

**To run the real thing** (and get the two numbers above), set a key and point
the converter at the live API:

```
export ANTHROPIC_API_KEY=sk-ant-...        # or add it in Team & Settings
unset ANTHROPIC_BASE_URL                   # the test harness overrides this
npm start
# then: Templates → New template → Upload a document → fixtures/brut-account-opening.pdf
```

Count the fields on the confirmation screen against the form's ~27 blanks, and
read the cost off the AI usage record the server writes for every real call
(`feature: 'template_convert'`). Budget: a handful of uploads is cents, not
dollars — the $2 ceiling that was authorised is many times what this needs.

### The scanned fixture is synthetic, and that limits what the scan tests prove

`fixtures/brut-account-opening-scanned.pdf` is generated, not scanned: text
drawn as pixels with a 5×7 bitmap font, plus deterministic speckle and an edge
shadow. That is genuinely enough for what `f128` asserts — there is no text
layer, so classification, the confidence cap, the banner and the whole pipeline
are all exercised honestly. It is **not** enough to judge how well the model
reads real scanner output: no skew beyond a nominal shadow, no JPEG artefacts,
no bleed-through, and a font cleaner than most fax-quality paper. Before
trusting scan detection in front of customers, print the form, scan it, and run
that.

### The retry the brief asked for was NOT added — deliberately

§5 asks for "on an unparseable response, retry once". It is not implemented, on
either route, and that is a decision rather than an oversight:

- Phase D's Word route has never retried. Adding a retry to the PDF route alone
  would make the two paths behave differently on failure for no principled
  reason, and the whole design of this addendum is that the two routes differ
  only in how the document reaches the model.
- The corrected §5 says to add it to the shared failure path or to neither, and
  to say which. This is the saying-which: **neither**, for now.
- A retry is only safe if it fires on an unusable *answer* and never on a
  refusal, an auth failure or a rate limit — retrying those spends money and
  cannot succeed. Getting that discrimination right is worth doing properly,
  against real failure modes, which needs the key that this session did not
  have. Building it blind against a stub would be guessing at which errors are
  worth retrying.

The existing behaviour is unchanged and still safe: an unusable answer saves the
template as a draft with an `error_note`, the original file is stored before the
call so nothing is lost, and the upload flow never crashes. `f128` pins that for
the PDF route.

### The rate limiter had to be raised for the new test file

`f128` uploads far more than the 15 deep Copilot calls per window that
`AI_RATE_DEEP` allows, so it starts its server with `AI_RATE_DEEP: '500'`. The
limiter is a real production guard and is untouched everywhere else. Worth
knowing because the first run of that file failed on a 429 that looked like a
product bug and was not.

### Two things in the brief described a codebase that does not exist

Both were corrected before code and are recorded in full in the work order's
revision note; repeated here because they cost time:

- **"Remove the 'PDF support coming soon' signpost text."** No such string
  exists, or ever existed, in this repository. The four real places that name
  Word-only are listed in the corrected §4.
- **"JSON only, no prose, no fences."** The converter forces a tool call, so a
  fenced or prose answer is impossible by construction. The instruction
  described a text-parsing design this codebase does not use, and following it
  would have meant building a JSON parser for output that arrives structured.

### A guard that is precautionary, and is labelled as such

`tplPdfClassify()` walks the raw bytes as well as the inflated streams, so that
a PDF whose text sits uncompressed is not mistaken for a scan. The cost is that
it also walks compressed image data, where a byte run shaped like `(…)Tj` could
in principle be counted as text — which would file a scan as digital and
silently drop both the banner and the digit cap.

A printable-run filter was added against that. **Measured, it changed nothing:**
against 630 KB of incompressible image data the coincidence did not occur, so
`f128`'s big-scan case passes with or without the filter. It is kept because it
is nearly free and the failure it guards against is silent, but it should not be
described as fixing an observed bug, and the test should not be described as
proving the filter works. Both the code comment and the test say so.

Recorded here because a guard that passes either way is the kind of thing a
later reader mistakes for a tested invariant.

---

## The real run happened — and my cost estimate was wrong by roughly ten times

A key was supplied after the merge and all three fixtures were run against the
live model. Two entries above are now settled and one correction is owed.

### The estimate in this file was badly out. Use these numbers instead.

I estimated "on the order of half a US cent" for a two-page form and "15–30
cents" for a thirty-page scan, from published per-token pricing. Measured:

| Document | Pages | Input tok | Output tok | Cost |
|---|---|---|---|---|
| `blanks-mixed.pdf` (digital) | 1 | 3,570 | 1,819 | **$0.0380** |
| `brut-account-opening.pdf` (digital) | 2 | — | — | **$0.0589** |
| `brut-account-opening-scanned.pdf` (scan) | 2 | — | — | **$0.0630** |

About **4–6 US cents per document**, not half a cent. The estimate was wrong
because it assumed input tokens dominate. They do not: at $3/M input against
$15/M output, the 1,819 output tokens cost $0.0273 of that $0.0380 run — **the
answer is about three quarters of the bill, and the document is the rest.**

The practical consequence for pricing: **cost tracks the number of fields
detected far more closely than the number of pages.** A long contract with few
blanks is cheap; a short dense form with fifty fields is not. Extrapolating the
thirty-page worst case from a two-page sample is therefore unsafe in a way I did
not appreciate when writing the estimate — the page count moves the smaller half
of the bill. If a real thirty-page figure matters for pricing, measure one.

Note also that a scan cost only ~7% more than the same form as a digital PDF
(2 pages, $0.0630 vs $0.0589). I had expected image tokens to make scans
markedly more expensive. On this evidence they do not, though a photographic
scan at full resolution may behave differently from a generated raster.

### §9's detection bar: PASSED, comfortably

Digital Brut PDF: **25 fields**, against a bar of 20 and a form carrying 28
blanks. Types were right where it matters — `kenya_tax_id` for the KRA PIN,
`national_id` for the receiver ID, `phone`, `email`, `address`, `currency`,
`select` for the payment-terms option list, `stamp_image` for the stamp. The
three not returned as separate fields were Director signature, Title and Date
signed, which were folded into the signature block — the behaviour the shared
prompt asks for, not a miss.

The scan did **better**, at 27 fields, and the hard-coded rule fired exactly as
designed in production: 6 digit-bearing fields held to `medium`
(`company_reg_number`, `kenya_tax_id`, two `phone`, `national_id`, and a third
`phone`), everything else left at `high`. `TPL_CONVERT_PDF_RULES` needed no
iteration; it worked first time.

Caveat that still stands: the scan fixture is generated, not a genuine
print-and-scan. Real scanner output is the remaining unknown.

### A real bug the cost check exposed

`recordAiCall()` files any feature missing from `AI_FEATURE_LABEL` under
`'other'`. `template_convert` was never added to that map, so **every document
conversion since Phase D — Word as well as PDF — has been reported in the Other
bucket.** Nothing was lost or mischarged, but the single figure an admin needs
to answer "what does converting a document cost us?" was the one figure Team &
Settings would not show them. Fixed by adding the label; `f128` now asserts that
every feature key capable of spending has one, so the next feature added without
a label fails a test instead of quietly hiding its cost.

---

## Run: Copilot trust pass (2026-08-01, work order: copilot-trust)

### 1. The FTS body builder was silently pre-clipping the Copilot's read (FIXED in this run)

**What was broken.** `contractSearchBody()` slices its output at 40,000 chars
for the FTS index — and `copilotDetail` read through it. Raising the Copilot
read cap to 50k would have been a fiction: a 60k document would arrive as 40k
chars with `textTruncated: false`, which is precisely the silent-skim defect
this order exists to kill.

**Fix.** Split the builder: `contractFullBody()` (unsliced) feeds the Copilot
read, the truncation flags and quote verification; `contractSearchBody()`
keeps its 40k bound for the search index only. In scope because F-D item 3
explicitly asked for the truncation flag to survive any other clip, and a flag
computed after a hidden clip is not a flag.

### 2. Parked: one pre-existing browser check fails, unrelated to this order

`npm run test:browser` (redline suite) reports **70/71** — `FAIL 13 the batch
send is in the toolbar`. Verified against the untouched tree (`git stash`,
re-run): it fails identically **before** this run's changes, so it is not this
order's regression. It is a negotiation-toolbar UI check, nowhere near the
`/api/ai/chat` corner. Not touched tonight per the sequence rules; needs its
own look.

### 3. Parked: the helpers.js AI stub's comment does not match its behaviour

`test/helpers.js` `startAiStub()` picks `tools[0].name` when no `tool_choice`
is set, which for the chat route is `search_contracts` — so a default-stubbed
chat turn loops five rounds and lands on the "wasn't able to finish" fallback,
while a comment in `test/f1-folder-scope.test.js` says the stub "answers the
first turn with deliver_answer". The tests pass either way (their assertions
are about scoping, not the answer), so nothing was changed; the new
`test/f132-copilot-trust.test.js` uses its own scripted stand-in instead.
Worth a tidy-up someday, not tonight.

---

## Run: Copilot quality pass (2026-08-01, work order: copilot-quality)

### 1. Parked: /api/ai/playbook had no route tests until tonight

The order said the extraction must leave the route's behaviour proven by "its
tests" — but no test file exercised `POST /api/ai/playbook` directly (f131
covers the client-side playbook pass). Tonight's `f133` adds direct route
coverage (verdict shape, deep tier, provider-error mapping) alongside the
extraction, so the pin now exists. Noting it here because the gap predates
this run and the new pin is the fix.

### 2. Parked: the deep rate bucket is not consulted by escalated chat turns

By design tonight (documented in SUMMARY.md Run 9): escalated chat iterations
are governed by the daily spend ceiling, not `rlAiDeep`. If chat-driven deep
usage ever needs its own throttle, the rate-limiter middleware would need an
imperatively callable form so the loop can draw on the deep bucket per call —
a small refactor with its own blast radius, not done inside this order.

### 3. Parked: still one pre-existing browser check failing (unchanged)

`npm run test:browser` remains **70/71** — `FAIL 13 the batch send is in the
toolbar` — identical to before this run and to the untouched tree (see the
trust-pass entry above). Negotiation-toolbar UI, unrelated to this order.

---

## Run: Copilot streaming (2026-08-01, work order: copilot-streaming)

### 1. Judgement call, documented: deliver_answer's answer is streamed from its partial JSON

The order's letter says tool_use deltas buffer silently — but the system
prompt makes every well-behaved turn END in a `deliver_answer` tool call, so
the letter alone would leave the common case unstreamed (progress, silence,
then the whole answer at once). `answerExtractor()` in server/server.js
incrementally unescapes the `"answer"` string from the tool call's partial
JSON and emits it as token events; all other tool_use deltas stay silent. If
this reads as scope creep in the morning, deleting the one `_extract` hook in
`anthropicMessagesStream` restores the strict-letter behaviour — everything
else (protocol, parity, fallback) stands without it.

### 2. Parked: the SSE stream sends no heartbeat

A very long quiet gap (a slow deep-tier synthesis with no tools left to
announce) sends nothing on the wire until tokens start. Some proxies cut idle
streams; a `: ping` comment every ~15s would inoculate. Not needed for the
demo path (progress/token events flow well within any sane idle timeout);
worth adding if a real deployment ever fronts HaTi with an aggressive proxy.

### 3. Parked (unchanged): the one pre-existing redline browser check

`npm run test:browser` still **70/71** — `FAIL 13 the batch send is in the
toolbar` — identical on the untouched tree since before this sequence began.
Logged in the trust-pass entry; still nobody's regression.

### (Run 10a addendum, 2026-08-02) Word-by-word streaming switched off on request

Young's field call after trying it: keep the "what I'm doing" status lines,
drop the typewriter effect — the answer now arrives whole. Documented in
SUMMARY.md Run 10a; the token event name stays reserved and the machinery
stays in place for a possible return. If it does return, the fix should start
from why it read badly in the panel (likely the bubble reflowing on every
token) rather than just flipping the switch back.

---

## Run: the clause card breaks when you go back to edit a redline (2026-08-02)

Reported from the field (Young, 02 Aug 2026), with a screenshot, against **both**
the owner's Redline page and the counterparty's: file a redline, press **Direct
Edit** again to change a word of it, and the clause card falls apart — the
wording spills out of its box, the paragraphs run together, and the three hover
verbs sit on top of the Save change bar.

One report, three separate faults, which is why it looked like one bug.

### 1. The editor was styled as a different kind of thing from the clause

**What was broken.** Every typographic rule for a clause body is written for
`.nego-body`, and Direct Edit **replaces** `.nego-body` with `.nego-editing`
(`wireNegotiationTab`, `js/views/negotiation.js`). So the moment the editor
opened, the clause lost the lot.

Measured in Chromium on one preamble clause, before → after opening the editor:

| | reading | editing |
|---|---|---|
| paragraphs | `white-space:normal` | **`pre-wrap`** — every newline in the stored markup printed as a hard break |
| a party table | full width of the card | **126px** of 648px |
| a preformatted signature block | `overflow-x:auto`, scrolls inside the card | **`visible`**, hangs outside it |
| between blocks | 9px | **0** |

A short one-paragraph clause survived it unchanged, which is why this stood as
long as it did — and why the reported document (a preamble with several
paragraphs, a party table and a signature block) was the worst case.

**The fix.** Every `.nego-body` content rule in the room's sheet now names
`.nego-editing` beside it, and `.nego-editing` joins `.nego-body` in the
Redline page's canvas type rule. Written **longhand** rather than folded into
`:is(.nego-body,.nego-editing)`: f36 walks this sheet selector by selector and
requires every one to be namespaced to the component, splitting on commas — so
a comma inside `:is()` hands it fragments like `h2` that belong to no
component. The guard is right; the shorthand is what gave.

### 2. The hover verbs would not stand down while the clause was being typed in

**What was broken.** `.rl-tools` is revealed on `:focus-within`, and a caret in
the editor *is* focus within the clause. The row is absolutely positioned at
`bottom:-9px`, z-index 3 — exactly where the editor's own Save change / Cancel
bar sits. Measured: `opacity:0.93`, `pointer-events:auto`, geometrically over
the bar. The buttons the writer needed were underneath the buttons they didn't.

**The fix.** The clause carries `is-editing` while its editor is open, and the
sheet takes the tools off a clause that says so — hidden rather than moved,
because a clause under edit already carries its verbs (Save, Cancel) and
offering "Direct Edit" beside them names a door the reader is standing in. The
class is set when the editor opens and disappears with the repaint that closes
it, so no state here can outlive the editor. The touch reading (`hover:none`,
where the tools sit in the flow) gets the same treatment.

### 3. Going back to edit threw the redline away

**What was broken.** The editor loaded `cl.bodyHtml` — the **round baseline**
clause — and never looked at the pending change. So a second edit opened on the
original wording with the writer's own proposal nowhere on screen, and saving
re-filed against the baseline: the first ask was not refused and not withdrawn,
it was silently overwritten. The document beside the editor went on showing the
redline the whole time, so the page disagreed with itself about what was being
proposed. Reproduced on the owner's page and on the counterparty portal.

**The fix.** The editor opens on the wording that is **on the table** — the live
pending change's `bodyHtml`, falling back to the baseline. Three judgements are
worth stating:

- **Whichever side filed it.** On our own ask it is our draft, continued; on
  theirs it is what a counter-proposal actually counter-proposes — the same
  marked-up wording the clause is displaying an inch above. `negoFileChange`
  already knows the difference: it revises in place when the same hand returns
  and stacks a new change when a different one does.
- **Pending only.** An accepted change is in the baseline already and a rejected
  one means the baseline stands, so reopening from either would edit wording the
  record no longer carries. A proposed deletion carries no replacement wording,
  so it falls through to the baseline too — which is what the document is still
  showing.
- **The change id is read off the CLAUSE, not searched for in the record.** The
  wall keeps the other side's unsent drafts out of the document; a search of
  `c.changes` would have walked straight past it and opened the editor on
  wording the reader is not entitled to see. Reading the block's own
  `data-nego-card-anchor` means the editor can only ever open on what is already
  on the screen.

Also fixed in passing: the editor assigned stored markup straight into a live
element. Every other surface runs a clause through `sanitizeRich` at render
time — the rule `js/richdoc.js` states in its own header, because the
counterparty portal serves people outside the workspace with no login — and this
one path did not. It does now.

**Files touched.** `js/views/negotiation.js`.

**How it was verified.** `test/f144-the-editor-is-the-clause.test.js` (11 tests)
pins the behaviour and the rule-level styling claim — including a check that
every `.nego-body` content rule has a `.nego-editing` twin, so a rule added next
year without its twin fails the build. jsdom has no box model, so the styling
half is *measured* in `test/chromium/redline-verify.js` (six new checks, 12b):
each is a before/after comparison on the same clause rather than a magic number.
All six fail on the untouched tree and pass after. Full suite `2428/2428`;
browser `76/77`, `18/18` parity, `22/22` selection.

### 4. Parked (unchanged): the one pre-existing redline browser check

`FAIL 13 the batch send is in the toolbar` — confirmed identical on the
untouched tree at this commit. Still nobody's regression.

---

## Run: the narrow clause card — a class name two things were using (2026-08-02)

Follow-up to the run above. The three faults fixed there were real and are
fixed, but they were not the fault in the screenshot: the card was still half
width. Young re-reported it with a second screenshot, and the second one is what
made it findable — with the wrapping fixed, the wording now wrapped *to* the
narrow box instead of spilling out of it, which said the box itself was the
problem rather than the text.

### 1. Pressing Edit on a card dressed the clause as a dropdown

**What was broken.** `rlJumpToClause` — what the Tracked Changes card's **Edit**
button calls — flashes the clause it lands on by adding the class `rl-jump`.
`rl-jump` is *also* the class on the toolbar's contract picker
(`#rl-contract-jump`), and the picker's rules were written as
`.redline-page .rl-jump`: two classes, no element. So the clause matched them.

A `<select>`'s dress, applied to a clause:

| | the picker asks for | the clause got |
|---|---|---|
| `max-width` | `calc(220px + 9ch)` | **285.307px** inside a 626px sheet |
| `overflow` | `hidden` | heading clipped mid-word |
| `white-space` | `nowrap` | heading could not wrap |
| `min-width` | `96px` | — |
| type | 11px mono, 600 | — |

Measured on the real page against a sibling clause: `max-width: 285.307px |
other| none`. And it stuck — the class is only removed to *restart* the
animation, so the clause stayed shrunk until the next repaint.

**Why it took two passes to find.** Nothing about either part is wrong on its
own, and nothing in the clause's own rules is wrong either — which is why
reading the clause's stylesheet, its markup and its ancestors found nothing
three times over. It also does not reproduce from the clause's own **Direct
Edit** button, only from a *jump* — the card's Edit — so the obvious repro was
the wrong one. It was found by booting the real `index.html` in Chromium with a
seeded contract, taking the card route, and diffing the computed style of the
narrow clause against a normal one property by property. `max-width` and
`appearance: base-select` in that diff named the culprit immediately.

**The fix.** Two changes, either of which would have been enough; both are here
because the point is that this class of fault cannot recur.

- The flash is now `rl-arrived` — named for what it means, the clause you have
  *arrived* at, rather than for the gesture that got you there.
- Every picker rule is now typed as `select.rl-jump`. A block that is a
  select's dress should say so, and the element selector costs nothing.

### 2. Re-pointed: `13 the batch send is in the toolbar`

**What was broken.** Nothing in the product. This check asserted the batch send
flashed in the page toolbar, and `negoIndexSendHtml` deliberately moved it: the
header copy was a *proxy* for the engine's own control at the head of the
Tracked Changes column, the pair crowded the toolbar until the contract picker
clipped mid-word, and the proxy was removed with its identity — same words,
same count, same blast styling — moved onto the real control beside the cards it
publishes. The check had been red ever since, and had been logged as "parked,
nobody's regression" three runs running.

**The fix.** Re-pointed at the claim the product actually makes, and written to
be capable of failing *both* ways: the send must be inside the Tracked Changes
column and above the cards (the complaint that moved it was that the only send
was below the fold), **and** no copy may have reappeared in the header. A check
that only said "it exists somewhere" would have passed before the move and
after it — which is how this one sat red for a fortnight teaching nobody
anything.

**Files touched.** `js/views/negotiation.js`.

**How it was verified.** Three new jsdom tests in
`test/f144-the-editor-is-the-clause.test.js` pin the separation: no `rl-jump`
selector may exist without `select`, the jump must set `rl-arrived` and must not
set `rl-jump`, and the flash must still have a rule. All three fail on the
untouched tree. Check `12c` in `test/chromium/redline-verify.js` measures it in
a real browser as a *comparison* — the clause's width before the jump against
its width after — plus `max-width`, `overflow-x` and the heading's wrapping
named individually, so a partial recurrence cannot hide inside a width that
happens to match.

**The browser suite is green for the first time in this sequence: 82/82.** Full
jsdom suite 2431/2431; parity 18/18; selection 22/22; timeline 19/19.

### 3. Verified: the counterparty's page carried all four faults, and carries all four fixes

Asked for directly, and worth having asked: "the owner's page is fixed" is not
evidence about the counterparty's. Their page mounts the same component through
a **different door** — `redlineEmbed` under `.redline-page.rl-embed`, no
`#view-redline`, no contract picker in its toolbar — so every one of the four
faults could have been fixed on one seat and not the other with nothing to say
so. Three lived in shared code and one in a shared stylesheet, which makes the
parity *likely* and not *proven*.

Measured, not reasoned about. `test/chromium/parity-verify.js` now drives the
reported route — press **Edit** on a Tracked Changes card — on both seats
through one shared probe, and asserts eight things per seat plus one comparison
between them:

| | before | after |
|---|---|---|
| clause width on landing | 648 → **289px** | 648 → 648px |
| `max-width` / `overflow-x` | **288.884px** / `hidden` | `none` / `visible` |
| heading | **`nowrap`**, cut off | wraps |
| flash class | **`rl-jump`** (the picker's) | `rl-arrived` |
| clause knows it is being edited | **no** | yes |
| wording in the editor | **`pre-wrap`** | `normal` |
| hover verbs while typing | **opacity 1, clickable** | hidden, unclickable |
| editor opens on | **Net-30, the baseline** | Net-45, the filed redline |

Identical on both seats, before and after — so the counterparty's page had all
four and now has none. Against the pre-fix tree all 16 per-seat checks fail;
against this one all pass.

One judgement worth recording: the summary check ("the two seats edit a clause
identically") **passed even on the broken tree**, because both sides were
equally broken. That is correct behaviour for a parity assertion and a good
reminder of its limits — parity is not correctness, so the eight per-seat checks
carry the correctness claim and the comparison only guards against a future fix
landing on one door and not the other.

`npm run test:parity` 35/35; browser 82/82.

---

## Run: a decision that has gone is finished business (2026-08-02)

**What was wrong.** The counterparty answers a dozen changes, sends them, and is
left with a dozen full-height cards each still offering a button — on a column
where nothing is outstanding. The owner's page goes quiet at the same moment:
their settled changes leave the column entirely, and their own sent asks fold to
a line because "Sent" is an inert label. Same component, opposite feel, for no
reason either reader could see.

**Root cause — one classification, not a second design.** The fold-and-peek
behaviour already existed and already did exactly what was asked for: a card
with nothing left to do collapses to its head (id, origin, status badge) and
slides its body back out on hover or keyboard focus, with a grace period so it
cannot slam shut mid-reach and a tap-to-open fallback where there is no hover.
Which cards take part is decided by `rlCardNeedsYou` — *does this card offer
anything to DO?* — and `Change decision` was counted as a move waiting on the
reader.

It is not a move. The decision has gone, the other side is holding it, and
`Change decision` is an **escape hatch**. Escape hatches are precisely what the
peek is for.

**The fix.** `data-nego-redecide` joins `data-rl-edit` and `data-rl-sent` in
`RL_CARD_INERT`. Measured on the counterparty's page: a sent decision goes from
**95px to 58px**, its buttons hidden, its "Accepted · sent" badge still readable;
hovering restores it to 95px; leaving folds it again.

**Undo is deliberately NOT in that set**, and it is the same reasoning rather
than an exception to it. Undo sits on an answer that has been made and *not*
sent — the one state on this screen that looks finished and is not — and the
second after a click is exactly when a mis-click needs its way back visible.
It folds on its own once the round goes. This was put to Young as the one open
question and is his choice, not an inference.

**Files touched.** `js/views/negotiation.js` (one regex, one comment).

**How it was verified.** Five tests in
`test/f100-cards-composers-and-one-send.test.js`, beside the peek tests they
extend: a sent acceptance folds, a sent *rejection* folds the same way (built
from the status, so one is not evidence about the other), the badge and clause
survive the fold, a held answer stays open with Undo showing, and the exemption
still holds for every state carrying a live verb. Two fail on the untouched
tree. A correction worth recording: the first draft of these tests filed the
decision against the reader's OWN ask, which passed — `sentHere` has no author
guard — and was meaningless, since nobody rules on their own ask. They now file
an owner ask, which is the card a counterparty actually answers.

Full suite 2436/2436; browser 82/82; parity 35/35; selection 22/22.

---

## Run: the badge names a party, not a seat (2026-08-02)

**What was wrong.** The change card's origin badge read **"Counterparty"** for
the other side of the reader's table. That is correct from one chair and
misleading from the other, because *counterparty* is what BOTH parties call the
party opposite them. On the counterparty's own page it therefore labelled the
**sender's** ask with the word that reader uses for themselves.

Reported from the field as *"why is it that in the counterparty page, when you
have accepted a decision you then have an option to change decision?"* — the
card was the owner's ask all along, the decision was the counterparty's, and
"Change decision" was theirs to press. Nothing was broken except the word.

**The fix.** The badge names the organisation that actually asked.

| | owner's page | counterparty's page |
|---|---|---|
| their ask | `Nordfrakt Logistik AB’s ask` | `Wanjiru Catering Ltd’s ask` |
| your ask | `Your ask` | `Your ask` |

"Your ask" stays, because the one party a reader can never mistake is
themselves — and it is the phrasing `negoWhoseHtml` settled on for the room's
cards years earlier, whose comment says exactly this:

> **NAMED, NOT SIDED.** "Nordfrakt Logistik AB asked" beats "counterparty
> asked" — the reader knows who they are talking to.

The newer card had not inherited it. The organisation was already on the badge's
tooltip; the label now reads from the same value, so the two cannot disagree.
An empty counterparty field falls through to `Their ask` rather than to an
apostrophe with nothing in front of it.

**And it now carries text of unbounded length.** Companies are called things
like "APEX LOGISTICS & WAREHOUSING KENYA LTD", in a card head that also holds
the change id, the caret and the status badge, on a ~285px column. A fixed
`max-width` was tried first and is worse than it looks — it elides a name that
would have fitted and still cannot save a long one. `flex:0 1 auto` with
`min-width:0` lets the row decide: measured, "Nordfrakt Logistik AB’s ask" shows
in full at every layout, and the long name gives width back as the column
narrows (252px → 181px → 132px of 274px at 1440 / 1180 / 1024) with the status
badge on the row throughout and the full name on hover.

**Files touched.** `js/views/negotiation.js`.

**How it was verified.** `test/f93-party-badges-and-origin-filter.test.js`
rewritten off the literal: it asserts the badge NAMES the party (read from the
record, so a hard-coded label cannot rot into a test that has stopped reading
what it is about), that it is not the bare word "Counterparty", that the empty
field degrades readably, and that the CSS elides by the row rather than by a
number. The seat-flip test — the one covering the page where the old label meant
the reader themselves — now also asserts the label is never `c.counterparty`,
which on that page is the reader. Section 10 of
`test/chromium/parity-verify.js` measures the box model with a deliberately long
name pushed through the real renderer. Both fail on the untouched tree.

A correction worth recording: the first draft of that browser check mounted
`redlineEmbed` on a host that only exists on the counterparty's surface, so on
the owner's it silently did nothing and the check read the pre-existing card —
it would have passed or failed for reasons unconnected to the name under test.
It goes through the page's own `renderRedline()` now.

Full suite 2438/2438; browser 82/82; parity 39/39; selection 22/22;
timeline 19/19.

---

## Run: the Copilot explaining is not a redline either (2026-08-03)

### 1. A three-paragraph explanation was drawn whole in the proposal card, again

**What was broken.** F98's guard stopped a model that REFUSES and a model that
ASKS. This run's screenshots show the third voice: a model that EXPLAINS. The
fetched record was truncated, so the Copilot replied with three calm paragraphs
— what it received, what it cannot do, what to paste — no question mark
anywhere, every paragraph opening with a plain statement. The whole reply was
rendered as PROPOSED WORDING under an Apply Redline button, and one press filed
it into Clause 3 · Term as a tracked change.

**Root cause, in four parts.** (1) `AI_NOT_WORDING` and `AI_ASKS_BACK` are
anchored — they read the opening of the candidate only, and the giveaways
("I cannot properly rewrite…", "Please paste or share…") sat in paragraphs two
and three. (2) `aiAsksTheReader` needs a question mark, and "Please paste…"
asks without one. (3) The second screenshot's ask was bold — `**Please paste`
— and two asterisks defeat an anchored pattern. (4) `aiSplitDisclaimer` could
only move ONE opening sentence to advice; everything after it was "the
wording" by definition, so even a correct classification of sentence one left
paragraphs two and three inside the card. And the phrasing itself was
home-made: F132's trust pass told the model to say plainly when a record is
truncated, which is exactly the sentence nobody had a pattern for.

**The fix.** A rule about VOICE rather than another phrase. `AI_MODEL_VOICE`:
contract wording is third person about the parties, so a standalone capital
"I" — contracted or not — followed by a verb of speech, sight or need is the
model talking, whatever sentence it invents next month. The verb list is one
safety ("I, the undersigned, hereby appoint" matches no verb there); a
lookbehind is the other ("Article I can be amended" is a roman numeral wearing
a capital I). `aiBareText` strips markdown decoration — never "(a)", never a
digit — before the anchored lists read an opener, so bold cannot smuggle an
ask past them. And `aiSplitReply` splits the reply on blank lines and judges
each paragraph on its own: talk to the advice bubble, wording to the card, the
first wording paragraph still getting the sentence-level front split. Both
parser paths use it — the JSON field and the no-JSON fallback — so a remark
posted through `proposedText` moves the same way. Sub-paragraph lists survive
because single newlines are one paragraph; only a blank line splits.

Two prompt-layer changes alongside, so the guard is the net rather than the
plan: both format contracts (`AI_PROPOSAL_FORMAT`, `AI_EDIT_FORMAT`) now say
proposedText is CONTRACT WORDING ONLY and an empty string is the honest answer
when the model cannot draft; and the F132 truncation rule — in both brains,
server system prompt and browser-local — keeps its honesty but loses the
refusal: the passage quoted in the request is the authoritative text, so draft
from it and note the truncation in the reasoning.

**Files touched.** js/ai.js, server/server.js.
**Verified.** f135a (both verbatim screenshot replies land whole in advice with
nothing to apply; bold asks caught; the narrating voice caught), f135b (talk
before AND after the wording moves to advice on both parser paths; a
multi-paragraph clause and a single-newline list travel whole), f135c (six
strings of real wording brushing the new rule — roman numerals, the
undersigned, the F98b regulars — still reach the card; decoration stripping
never eats a sub-paragraph mark), f135d (the prompt rules, pinned in both
places each lives). Full suite 2496/2496.

**Not done.** The voice rule's verb list is curated, and a model narrating in
verbs outside it ("I checked the record…") slips the voice test — though the
paragraph split still contains the damage to one paragraph rather than the
whole reply. Nothing between Apply Redline and the contract inspects the
wording; that standing gap is unchanged from F98.

---

## Run: a summoned Copilot steps back when the errand is done (2026-08-03)

### 1. The drawer a selection action opened never left

**What was broken.** Highlighting a passage and picking a redline action opens
the Copilot drawer on the same gesture, to show the proposal. It then stayed:
Apply filed the change, Decline dropped it, and either way a drawer the reader
never asked to keep sat over the document they were reading until they closed
it by hand.

**The rule, as the product owner put it.** The panel should remember WHY it
opened. Summoned by a selection action → settling the proposal (Apply or
Decline alike) ends the errand and the panel goes back to hiding. Opened by
the reader — launcher, command bar, negotiation toolbar — or already standing
when the summons arrived → it is theirs, and stays until they close it. Two
edges agreed by name: Decline settles the errand the same as Apply; engaging
mid-proposal (Edit, a placement flip, a refine) does not claim the panel — it
still steps back after the final decision.

**The fix.** One flag on the panel state, written where the panel opens and
read where a proposal settles. `ai.summoned` is raised by `openAI` only when
the call says `summoned:true` AND the panel was closed — a summons landing on
an open panel changes nothing, because the panel was not opened for the
errand. Any deliberate open clears it, and so do close (whatever errand opened
it is settled) and minimize ("I'll be back" is the reader claiming the panel).
`aiProposalApply` and `aiProposalDecline` end by calling
`aiStepBackIfSummoned`, which closes the drawer only if the flag is up; an
Apply the handler refused returns before it, because the card — and the
question — are still open. Closing through `closeAI` also ends the seeded
rephrase session, which is the behaviour that function already had and exactly
what ending an errand should do. The four places a view opens the panel FOR
the reader — the propose paths and the refusal paths in negotiation and
Doc Lab — now pass `summoned:true`; the deliberate opens pass nothing.

**Files touched.** js/ai.js, js/views/negotiation.js, js/views/doclab.js.
**Verified.** f136a (summoned + Apply closes; Decline the same; Edit and a
placement flip in between change nothing; a refused Apply leaves the panel and
the flag standing), f136b (a hand-opened panel survives a settled proposal; a
summons on an open panel does not convert it; close and minimize both clear
the flag; two summonses are one errand), f136c (all four summoning sites pass
the flag, pinned at the source; the deliberate opens do not). Full suite
2510/2510.

**Not done.** A summoned panel the reader starts an unrelated portfolio
conversation in still closes on the proposal's final decision — engagement
short of minimize/close does not claim the panel, per the agreed rule. If that
reads wrong in use, the claim could widen to "typed a free question", but that
needs a signal cleaner than keystrokes.

---

## Run: the provenance label comes off the change card (2026-08-03)

### 1. An amber bar restating the button the reader had just pressed

**What was broken.** A Copilot-filed change carries a `note` written by the
machinery rather than by a person — "Copilot — Edit", "Copilot — Shorten &
Simplify (added after)". The redline card painted it as an amber bar with a
padlock on it, on the author's side only.

It told the reader nothing they did not already know. They had selected the
passage, chosen the action from the selection menu and pressed Apply half a
minute earlier; a strip of colour restating the button they pressed is a
second thing to read on a card whose actual content — the wording, the reason,
the four verbs — is what the column exists for. Amber also reads as a WARNING
everywhere else in this product (`--st-amber-bg` is the unsent state, the
truncation flag, the unstructured-reply badge), so the most eye-catching
element on a routine card was the one carrying the least information.

**The fix.** The render is gone: the `note` const and its slot in the card
body, the `.rl-card-note` rule, and the `margin-top` it shared with the verb
row. Nothing else moved.

**What deliberately did NOT change.** The field is still written on every
Copilot file. Provenance is exactly what the audit trail, the change history
and the exports are asked for and answer with, and deleting a render is the
change most likely to quietly take the data with it — so F137b pins the note
surviving on the record beside F137a pinning it off the card. The visibility
rule is also unaffected: a note never crossed to the counterparty, and the
`ch.authorSide === side` guard that held that line is simply no longer needed
on a card that draws no note at all. F92's assertion moved from the element
(which would now pass by not existing) to the TEXT, so it still means what it
was written to mean.

**Files touched.** js/views/negotiation.js, test/f92-six-round-negotiation.test.js.
**Verified.** f137a (the element and the label are both off the author's own
card; the padlock with it), f137b (the note is still on the record; the
REASON block — the reader's own words, written for the other side — still
renders; a change with a note and no reason now draws no aside at all).
Full suite 2519/2519, browser 80/80, selection 22/22.

**Not done.** `negoLiveCardsHtml` and `negoHistoryCardHtml` still fall back to
`ch.note` when a change has no `why`, so the same label can appear under a
"Why they asked" heading on the change-index and archived-round cards. That is
a different surface with different semantics — those renderers have carried
imported notes as reasons since long before the Copilot wrote any — and it was
left alone rather than swept up in a visual change.

---

## Run: company standard paper read as one clause (2026-08-04)

### 1. A contract whose only heading was its own name became a single clause

**What was broken.** A freight and logistics agreement was brought into HaTi as
company standard paper and drafted into a contract. On the Negotiation page the
ENTIRE agreement drew as one clause box — one editing window holding clauses 1
through 10 and the execution block, with a single "Direct Edit" button at the
foot of the page. There was no way to work on clause 8 without opening the whole
document, and every ask filed would have named one clause id covering all of it.

**Root cause.** `clauseSegment()` (js/clausemodel.js) had two readings and this
document fell between them. Where headings mark the clauses, a clause is a
heading plus everything under it. Where there are NO headings, it falls back to
one clause per top-level block. This document has exactly one heading — the
agreement's name — because it is typed the way a great many standard contracts
are typed: the clauses are ordinary paragraphs opening with their own number
("8. Termination. Either party may…").

With one heading the fallback never fired, so that lone `<h1>` opened a clause
and the whole contract poured into its body. The document title was not
recognised as a title either: the chrome rule required a LOWER-RANKED heading to
exist somewhere later, and there was none.

Nothing about the template feature was wrong. `templateFormDocHtml` emits `<h1>`
for the first heading block and `<p>` for fixed wording, which is correct; the
same shape arrives from a paste or an upload of the same document.

**The fix.** One rule, asked in one place (`_clTitleIndex` /
`_clHeadingsMarkClauses`): a heading that is the document's ONLY heading cannot
be marking clause boundaries, so a leading `<h1>` alone is the title, and the
blocks under it fall to the per-block reading a headingless document already
gets. `clauseSegment`, `clauseFrontMatter` and `clauseStampIds` all read that
one answer — they had three near-copies of the chrome test before, which is how
a document could be chrome for one and a clause for another.

Because every surface that draws a window per clause reads `clauseSegment` — the
workbench on desktop and phone, the contract tab, the room, the counterparty's
page — the fix reaches all of them without any of them changing.

**What deliberately did NOT change.** The template converter still emits those
numbered clauses as fixed wording rather than as heading blocks. Changing the
converter's prompt would improve future uploads but does nothing for documents
already in the library, cannot be verified here without spending a model call,
and is not needed now that the clause model reads them. The rule is also kept to
a leading `<h1>`: a document whose only heading is an `<h2>` still reads the old
way, because an `<h2>` at the top is as likely to be a section heading as a
title and guessing was not worth the blast radius.

Renumbering still proposes nothing for these clauses — their numbers live in
body text rather than in a heading element, and `clauseHeadingRenumber` has
never rewritten those. That is pre-existing and safe (it declines rather than
guesses), but it is now reachable on a class of document it was not reachable on
before.

### 2. The Copilot had no visible door on a clause

**What was broken.** Reported in the same breath — "it does not allow me to edit
by claude". The clause toolbar offered Direct Edit and nothing else. The
Copilot's three actions opened only from a text selection, which is an
affordance nothing on the page mentions, so a reader looking at a clause
concluded the Copilot could not touch company paper at all.

**Root cause.** A deliberate removal (recorded in the code as the "duplicate
door" argument): highlighting the words states the scope better than a
whole-clause button does. True about scope, and wrong about discoverability.

**The fix.** An "✨ Copilot" button on both clause toolbars — the workbench's and
the room's. It is a DOOR, not a second proposal path: it builds the same context
a drag across the whole clause builds and hands it to the same menu, so every
ask still travels `rlAiPropose` → `negoEditClause` with the same refusals (a
clause under a live redline is still declined) and the same fingerprint. The
engine's own menu was lifted out of the selection handler so both doors raise
the identical thing rather than two menus drifting apart. The counterparty's
page passes `noAi` and shows no button, because it has no Copilot panel to route
an ask into.

**Files touched.** js/clausemodel.js, js/views/negotiation.js.
**Verified.** f145 (10 assertions: the clause model on the reported document, the
headed and headingless documents unchanged, one window and one pair of verbs per
clause, the menu scoped to its clause, nothing offered on an executed contract or
a no-Copilot page), and a Chromium walk of the reported document
(`npm run test:standardpaper`, 11/11) measuring the boxes and the buttons on the
real page rather than in markup. Full suite green; browser 81/81, selection
22/22, parity 39/39, phone 59/59, live 31/31, structure, designstep, laptops,
timeline and newcontract all green.

---

## Run: Seventeen fixes off a batch of screenshots (24 Aug 2026)

`WORKORDER-screenshot-fixes.md` carries the whole order — what was asked, what
was measured, what was built and what each cost. What follows is the defects
found on the way, and then the standing list this run could not close.

### 1. I overwrote this file

**What was broken.** WO-0 asked for the owner's Scope rules to go into
CLAUDE.md, and one of those rules says a problem noticed while doing something
else becomes "one line in BUGLOG.md under 'Noticed, not fixed'". I wrote that
file without checking whether it existed. **It did — 7,032 lines of run
history** — and it was replaced by a 48-line note. Nothing was lost (git had
it) and it was caught by reading the diffstat before the final push, not by any
test.

**Root cause.** Assuming a filename was free because the instruction said to
create it. `ls` costs nothing and would have answered it.

**The fix.** The file is restored from `origin/main` and this section is
APPENDED, in the file's own convention (newest run at the bottom). The Scope
rules' "Noticed, not fixed" is a section of this run's entry rather than a new
top-level heading, so it reads as part of the record instead of competing with
it.

### 2. `margin-left:auto` had nothing to push against

**What was broken.** WO-10's three check symbols landed on a line of their own
at the LEFT wall of the negotiation head, adding 28px to a head that is meant
to be compact — the opposite of both halves of what was asked.

**Root cause.** `.room-facts` is a flex ITEM of `.room-head` and was a plain
BLOCK inside itself, so its two children stacked and `margin-left:auto` had no
flex parent to push against. It looks perfectly correct in the source.

**The fix.** `.room-facts` is a flex row; `.room-facets` takes `flex:1;
min-width:0`. Head back to 123px, byte-identical to main, symbols at the right
wall. **Verified** in `nego-redesign-verify` section 13, which measures the
overlap as a RELATION and drives a real press through to the side panel —
because the other thing that could be wrong with a new control is that it is a
dead press, and no source test can see one.

### 3. The Negotiations door answered one press two ways

**What was broken.** WO-17 sent the desktop's sidebar door to the list. The
work order stated the phone already did the same. It did not — `mGo` reopened
the last negotiation — so the two shells would have disagreed about one press.

**Root cause.** A claim in the order that nobody had measured.

**The fix.** The special case came OUT of the phone's funnel entirely: the
screen simply draws its list, so every door onto it inherits the answer. The
memory (`negoRememberOpened` / `negoLastOpened`) is kept, so the reopen is one
argument to put back. **Verified** f184 and negotiations-door-verify, which
asserts the memory is still recorded.

### 4. The filter bar drops its Sort control to a second line

**What is broken.** WO-15 removed two filters "so the row fits one line", and
the row has six controls left: **Search · Lifecycle stage · Value stream ·
Saved views · Category · Sort**. **Sort is the one that drops**, and the reason is
its LAYOUT rather than a missing name: the other five carry their word ABOVE
the box (`.reg-f` / `.reg-f-l`, the stacked label WO-4 gave them), while Sort
keeps the older arrangement with the word BESIDE the box. Two things on one
line is wider than two things stacked, so it is the widest item on the row and
the first to fall off. (An earlier version of this entry said Sort had no label
at all — wrong: it says "Sort" / "Sortera". The probe looked for `.reg-f-l`
specifically and read the inline label as an absence.)

**MEASURED on both pages (Contracts and Negotiations are one renderer and
behave identically), at every width in `laptops-verify`'s supported set, in
both languages, resting and with a filter set — BEFORE the fix below:**

| | resting | a filter set |
|---|---|---|
| English 1280 · 1440 · 1536 · 1920 | one line | one line |
| **English 1366** | one line | **two** |
| Swedish 1280 · 1536 · 1920 | one line | one line |
| **Swedish 1440** | one line | **two** |
| **Swedish 1366** | **two** | **two** |

**PART-FIXED 25 Aug 2026 (owner-asked: "stack Sort's label like the other
five"), and the measurement halved: 8 two-line cases across the two pages
became 4.** Sort goes through `selFilter`, the same builder as the other five,
so its word sits above the box instead of beside it. Re-measured the same
grid:

| | resting | a filter set |
|---|---|---|
| Swedish 1366 | **one line** (was two) | two |
| Swedish 1440 | one line | **one line** (was two) |
| English 1366 | one line | two |
| every other width, both languages | one line | one line |

**WHAT IS LEFT is the OTHER cause and is untouched: 1366 with a filter set,
in both languages.** The active state's `font-weight:600` still widens the
control, so the row is at its widest exactly when somebody is using it. Ways
out, all still the owner's call: drop a third filter, give the selects a
stated width so weight cannot change their size, or drop the bold — the last
one costs a carrier, and with the border and the ink both being colour it
would leave colour as the only signal, which this file's own rule forbids.

**Root cause — two things compound, and neither is page width alone.**
(1) **Setting a filter widens it**: the active state adds `font-weight:600`,
which is ~30px on "Lifecycle stage". So the row is at its widest exactly when
somebody is using it. (2) **Swedish is longer** — *Livscykelsteg*,
*Affärsområde*, *Sparade vyer* — which is why the reported case was Swedish.
1366 is also the narrowest PAGE of the set rather than the narrowest window: at
1280 the sidebar is a 64px rail, so the page is ~1174px, while at 1366 it is
the 240px column and the page is ~1084.

**Proved pre-existing** by running the same probe in a worktree at the commit
before the filter-outline change: the first table above is identical there, so
that colour work moved nothing.

**AND THE SIX READ AS ONE SET NOW**, which was the other half of stacking the
label and is worth as much as the width it saved: all six carry a 12px label
in one ink, on one line, with their boxes on the next — measured, one value
for each. Sorting still works and Sort deliberately never wears the active
accent, because on the other five that mark means "this is narrowing your
list" and sorting narrows nothing. Pinned in contracts-page-verify section 13,
every claim written as a RELATION between the six rather than as a number.

**AND MY FIRST REPORT OF THIS WAS WRONG IN ITS DETAIL** — it said "1366" flat,
with no mention of the language or of needing a filter set. The probe that
found it had left a filter active from an earlier measurement and I read that
as the resting state. A probe that carries state between measurements is a
probe that reports a condition as if it were the rule.

### 5. WO-9's cell clipping made the row menu invisible

**What was broken.** Owner-reported: *"Previously, the 3 dots at the end were a
filter where I had options to archive delete and so forth. What has happened to
that feature?"* The menu opened and drew nothing.

**Root cause.** WO-9 put `overflow:hidden; text-overflow:ellipsis` on every
`.reg-table td` so a long name would cut with an ellipsis. The actions cell
hosts the row menu as a `position:absolute` pop-up, and **overflow:hidden clips
an absolutely-positioned child to its clipping ancestor** — so a 180x234 menu
was cropped to a 35x36 cell. MEASURED with `document.elementFromPoint` at each
row's own centre: **0 of 7 rows reachable**. The button still worked and all
seven acts were still in the DOM; only the paint was gone.

**The fix.** The cell is named `reg-cell-menu` in the row builder and exempted.
**THE REFERENCE'S OWN RULE IS WHAT EXEMPTS IT** rather than a special case
bolted on: TYPOGRAPHY.md section 6 asks for the clip on "every table cell that
holds a NAME, A TITLE OR FREE TEXT", and this one holds a button and a menu.
NAMED IN THE MARKUP rather than matched with `:has()`, because which cell hosts
a pop-up is a fact about the row builder and belongs there. **Re-measured: 7 of
7 reachable**, and the exemption is one cell — 280 text cells still clip.

**Two lessons, and the second one is embarrassing.** (1) A geometry check
CANNOT see this: a clipped element still reports its full rectangle, so
comparing boxes passes on the broken page. "Is it painted" is the only honest
question and only a browser can answer it. (2) Writing the fix's own comment, I
put backticks in a CSS comment inside a JS template literal and **took the file
down** — the exact trap this file and CLAUDE.md both record, walked into while
writing about being careful. `node --check` caught it in seconds.

**Verified.** contracts-page-verify section 14, proved to fail against the
shipped code (0/7) before it was trusted. Section 10e widened in place: it
asserted EVERY cell clips, which the exemption correctly breaks.

**AND THE REST OF THE PRODUCT WAS SWEPT for the same fault, because one
instance of a class is never the question.** Two passes:

*The blast radius of the rule itself.* The only `overflow:hidden` this run
ADDED is `.reg-table td/th`; `.cal-when` and `.reg-title` already carried
theirs and only changed size. `.reg-table` is rendered from `register.js`
alone, which draws Contracts and Negotiations — both checked. The stream
drawer is `.fold-table` and was never given the clip.

*The class, anywhere.* A live sweep of 12 screens for every
`position:absolute` element a clipping ancestor would crop, with hidden
pop-ups forced visible for the measurement: **0 on eleven of them.** Two on
the negotiation page — `#rl-queue` and `#rl-cp` — and both are the DESIGN:
those panels park outside `#rl-grid` when shut, and that grid clips on purpose
so a parked panel cannot create a sideways scroll box (CLAUDE.md records it).
Opened and re-measured, both paint at 9 of 9 sample points.

*Then the menus were driven for real*, since a forced-visible element is not
the same as a pressed one — Contracts row menu 180x234, contract-room More
252x395, negotiation-head More 252x385, Calendar More 200x81, and the
full-text search drop 284x91 with a word actually typed into the box: **all
painted at 9 of 9.** The register's row menu was the only instance.

### 6. The Calendar's head is inset 24 where every other page is 16

Noticed while making every page's title start at the same height. The nine
other pages put their title at x=80 (the 64px column plus the 16px page
measure); the Calendar's own white band pads 24, so its title sits at 88.

**Not fixed.** The ask was the font SIZE and the TOP distance, and both are
done. The band is also a different kind of object — it bleeds edge to edge and
its 24 is the band's inner padding rather than a page measure — so whether it
should follow `--page-pad-x` is a decision rather than a slip.

### Noticed, not fixed

Per the Scope rules in CLAUDE.md. Each was proved to fail on unmodified
`origin/main` in a worktree before it was called inherited — "this was already
broken" is the most comfortable sentence in a codebase and the cheapest to
check.

- **`npm run lint` reports 4 errors on a clean tree**, against CLAUDE.md's
  zero-error bar. All four are two dictionary keys declared twice, once in each
  language: `co_password_updated` and `act_next`. Four lines.
- **`pages-read-alike-verify` fails 3 of 38** on "the negotiation head does not
  wrap". Named as a known red by `docs/WORKORDER-black-ink.md`, which proves it
  at `b82889e`. RE-CHECKED after WO-10 put three symbols on that head: 123px,
  byte-identical to main, so nothing here widened it.
- **`white-band-and-tabs-verify` fails 2 of 38** on 5d/5e, and only on the line
  box — the register's titles compute 20px against the reading switch's 19.6px,
  from two decisions made a day apart in someone else's work. It needs a ruling
  on which gives, the row rhythm or the shared type.
- **`panel-alerts-and-head-verify` fails 7 and throws.** It asks for render
  B1's Tracked Changes head — three `.rl-fseg` cuts, the 19px count with its
  uppercase caption. That head became a `<select>` in "The negotiation page
  takes the render" (`f3bc058`) and this file was never re-pointed. **NOT
  WO-8's**: that item only MOVED the control into the slot the owner drew and
  did not choose its shape.
- **`copilot-band-verify` fails outright**, because WO-3 retired the band it
  measures. The file is KEPT, not deleted, and listed in `run-all.js`'s
  KNOWN_RED: restoring the band is putting one function body back, and this is
  the only thing that would prove the restore worked.

**Files touched.** CLAUDE.md, index.html, js/ai.js, js/app.js, js/i18n.js,
js/mobile.js, js/views/{calendar,contract,home,intelligence,negotiation,
register}.js.
**Verified.** Node 4,527/4,527 and lint 0 errors. Browser: the whole set via
`run-all.js`, plus the colour census re-recorded and audited value by value
(five differences on three screens, every one attributable to a named item).


---

## 25 Aug 2026 — the platform face moves to IBM Plex Sans

**The change.** The four face tokens in `index.html`'s `:root` — `--font-heading`,
`--font-body`, `--font-mono`, `--font-doc` — now name IBM Plex Sans, and
`fonts/fonts.css` carries it inlined instead of Inter. `--font-code`
(Courier New) and `--font-doc-mono` are untouched, as are the two deliberate
exceptions they exist for. 402 read sites follow from those four lines, so the
face changes on every screen, the contract paper and the phone at once.
488 KB to 335 KB, eight inlined faces against nine.

**A brand decision and not a legibility one, and it was measured before it was
made rather than argued after.** Small-letter height 73.8% of cap height against
Inter's 75.3%; a clause of contract wording takes the SAME five lines at the same
measure. The confusable pairs come out MIXED — Plex separates capital I from
lowercase l far better (58% shape overlap against 95.5%), Inter separates
lowercase l from the digit 1 better (17.1% against 32.1%) — so this is not a
clarity win and is not sold as one. What it buys is ~5% of width back, measured
on this product's own screens.

**Defects found and fixed in this run**

- **`.font-serif` went on naming Inter, and it is the `.text-ink` fault in a new
  costume.** The compiled Tailwind blob bakes a literal family into three rules.
  Two were already covered — the `html` one loses to HaTi's own
  `html{font-family:var(--font-body)}`, and `.font-display` is named outright in
  the `h1..h6` rule. `.font-serif` was not, and the reason is SPECIFICITY: it is
  worn by `<h3>` elements (js/approvals.js's signing route, js/obligations.js's
  add-obligation and proposed panels, js/views/settings.js's folder-access
  sheet), and against an `h3.font-serif` that rule matches only on `h3` —
  (0,0,1) — while the blob's `.font-serif` scores (0,1,0) and wins. So those
  headings asked for a face no longer served and fell to the reader's system
  font inside a dialog drawn in Plex. Silent, because a font that resolves is
  never an error. Fixed in HaTi's OWN sheet, never the blob. PROVED
  load-bearing by disabling the new rule in a live page and re-measuring:
  IBM Plex Sans with it, Inter without.
- **HALF THAT DIAGNOSIS WAS WRONG FIRST TIME AND THE MEASUREMENT CAUGHT IT.**
  The first pass added rules for BOTH `.font-display` and `.font-serif` and
  wrote a comment claiming both were broken. Switching them off in place showed
  the faces did not move — `.font-display` was already covered by the h1-h6
  rule. The redundant rule and the false claim were removed. A fix that changes
  nothing is worse than no fix: it reads as a defect that once existed.

**A coverage narrowing, named rather than absorbed.** Plex ships six subsets on
Google Fonts and NO greek-ext, so U+1F00-1FFF is gone: polytonic Greek, the
accented forms of classical and ancient Greek. Modern Greek (U+0370-03FF) is
covered in full, and a name on a contract is written in modern Greek — which is
what f85's Greek claim exists to protect. So the claim MOVED RUNG (it guards
U+0370 now) rather than being deleted, and the loss is recorded in the test's
own comment, in `fonts/fonts.css` and in CLAUDE.md. Rewriting a test to match a
loss is ordinarily the fault this file warns about; what makes it legitimate
here is that the claim it still makes is the one the test was written to make.

**One weight now clamps, and is left saying what it meant.** Plex's variable
range is 400-700 against Inter's 300-800. Nothing asks for 300 or below. ONE
declaration asks for 800 — the `bold-corporate` document style's h1 — and a
browser clamps it to 700. Left saying 800 on purpose so the day a heavier face
returns it works again, rather than being quietly rewritten.

**Noticed, not fixed**
- **The CHARTS do not follow the platform face, and never have.** Asked
  directly after the swap ("what about Copilot?"). The Copilot PANEL is clean —
  measured live, every element inside it including the input box resolves to
  IBM Plex Sans, because js/ai.js names only `var(--font-mono)`,
  `var(--font-heading)` and `font:inherit`. The CHARTS it draws are the
  exception: js/aichart.js sets `font:{size:10}` on every axis, tick and legend
  and NEVER a family, and nothing anywhere sets `Chart.defaults.font.family` —
  so Chart.js falls back to its own built-in system stack. This is the CANVAS
  rule this rulebook already records for colour ("`var()` means nothing to
  `fillStyle`") in its typographic form: a canvas cannot read a token, so a
  chart's labels have to be told the face by name. NOT CAUSED BY THIS RUN — the
  labels were not in Inter either — so it is logged rather than fixed, and it
  is one line (`Chart.defaults.font.family`) whenever somebody wants it. It
  reaches every chart in the product: Copilot's in-chat charts, the Intelligence
  dock, the four Reports cards and the health report's embedded PNGs.
- **Chart.js is fetched from a CDN at runtime** (`AI_CHART_CDN`,
  cdnjs.cloudflare.com). Noticed while chasing the above, and not this run's to
  judge — but it means every chart in the product depends on the reader's
  browser reaching a third-party host.
- `npm run lint` reports **4 errors**, all `no-dupe-keys` in `js/i18n.js`:
  `co_password_updated` (lines 2019, 6777) and `act_next` (2763, 7443). That
  file is untouched by this run — proved with `git status` — so they pre-date
  it. Note that the previous run's own entry claims "lint 0 errors", so they
  arrived after that claim was written or the claim was wrong.

**Three browser files went red on the swap, and each was a different thing.**
Every one was run on an UNMODIFIED main in a worktree before being called mine
or not — the scope rule, honoured rather than asserted.

- **`type-and-symbols-verify` (2 fails, MINE, and the test was the stale part).**
  It asserted `/^Inter\b/` on `--font-heading` and on `--font-mono`. Claims
  reversed in place. Its weight loop asked for 300-800 because Inter is variable
  across exactly that; Plex is 400-700, so 300 and 800 were dropped from the
  list with the reason written beside them — asking for them would be asserting
  a fiction. Clean on main (41/0), so unambiguously this run's.
- **`laptops-verify` (5 fails, MINE, and a REAL layout regression).** Clean on
  main. `.hm-n` — Home's 32px figure — carried `line-height:1.05`, tuned to
  Inter, and Plex does not fit inside it: MEASURED, a 34px box against a
  scrollHeight of 37, with `overflow:hidden` (there for the ELLIPSIS, a
  horizontal concern) clipping 3px off the bottom of every big number on Home,
  at all five laptop sizes. `.hm-m` beside it carried the identical value for
  the identical reason. Both read `--lh-tight` now — the product's own rung,
  whose comment already names "counts" — rather than a number invented for the
  face. 21/21 after.
- **`pages-read-alike-verify` (5 fails: 3 pre-existing, 2 MINE).** Main fails
  the same 3 (the negotiation head wrapping, headH 125 against my 126 — the 1px
  is the face, the failure is not). The 2 new ones were section 8, the header
  top: the room drew 2px below Home. **THE FIRST DIAGNOSIS WAS WRONG AND IS
  RECORDED AS SUCH**: the crumb states no leading, so it sat a 12px face in an
  18px `--lh-base` box, which looked like the answer — stating `--lh-tight`
  moved the ink by NOTHING, because `align-items:center` was doing the
  positioning. Centring a 14.4px line box in a 16px min-height inserts an 0.8px
  offset nothing else on any header has, and Home's own 20px glyph sits 2px
  ABOVE its box because `--lh-tight` is tighter than Plex's natural 1.313. The
  crumb is `flex-start` now, so its first line starts where the block's padding
  puts it, like every other page's. Home 14px, room 15px, inside the ±1px the
  check allows. The stated leading was KEPT — it is right by the rule every
  page title already follows — but the comment says plainly which of the two
  was the cause.

**THE PATTERN WORTH KEEPING FROM ALL THREE:** every regression this swap caused
was a LEADING or a LINE BOX tuned to the old face's metrics, never a width.
Plex is ~5% narrower, so nothing ran out of horizontal room anywhere; what broke
was three places where a box was drawn just tall enough for Inter's glyphs. If
another face swap ever happens, sweep `line-height` on large type first.

**Files touched.** CLAUDE.md, index.html, fonts/fonts.css,
test/f85-the-server-serves-the-design.test.js,
test/chromium/type-and-symbols-verify.js.
