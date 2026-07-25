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
