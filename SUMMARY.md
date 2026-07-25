# SUMMARY — Ingestion, AI Budget & Templates upgrade

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
