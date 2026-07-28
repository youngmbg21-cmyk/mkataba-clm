# SUMMARY

One section per build run, newest at the bottom — the same convention
`BUGLOG.md` follows.

- [Run 1 — Ingestion, AI Budget & Templates upgrade](#run-1--ingestion-ai-budget--templates-upgrade)
- [Run 2 — Rich Templates, Document Typography & Legibility](#run-2--rich-templates-document-typography--legibility)
- [Run 3 — Visibility & Permissions Hardening (2026-07-25)](#run-3--visibility--permissions-hardening-2026-07-25)
- [Run 3a — Signing capacity follow-up (2026-07-26)](#run-3a--signing-capacity-follow-up-2026-07-26)
- [Run 4 — Word (.docx) Round-Trip (2026-07-26)](#run-4--word-docx-round-trip-2026-07-26)
- [Run 5 — UX-review remediation: the negotiation loop (2026-07-26)](#run-5--ux-review-remediation-the-negotiation-loop-2026-07-26)
- [Run 6 — The counterparty's side (2026-07-26)](#run-6--the-counterpartys-side-2026-07-26)

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

## Follow-up after the run: uploaded PDFs now keep their structure

Reported after delivery, with a side-by-side comparison: the same contract
brought in by paste and by PDF upload looked like two different products. The
paste kept its title, bold party names, numbered parties and section headings;
the upload was an undifferentiated wall of flat text.

The words were already right — that was `BUGLOG.md` #19, the glyph-width fix.
What was missing was the *document*. `extractPdfText()` returned a string and the
ingestion path saved it as plain text, discarding everything the PDF states about
shape. Weight and slant were never even read.

`js/pdfrich.js` now reconstructs it — headings by size rank, `<strong>`/`<em>`
from the actual font, real lists from simple markers, nesting from indentation,
wrapped lines rejoined into paragraphs, rules and columns preserved. Three
judgements protect the contract: a **dotted clause number is never made into a
list** (an `<ol>` would renumber 11.2 as "1." and break every cross-reference);
a numbered line is a **heading only if it looks like one**, otherwise it stays a
clause with its number; and the **plain text is the floor** — the reconstruction
is discarded if it loses more than 10% of the characters.

Verified by measuring the goal rather than asserting it: one source contract is
printed to a real PDF and also captured as clipboard HTML, run through both
routes, and compared. They now produce **structurally identical** output —
`{headings:4, lists:1, items:2, paragraphs:4, bold:4, italic:1}` from both —
with the same words. Full detail in `BUGLOG.md` #20.

Two further defects surfaced while building it, both in already-shipped code:
`pdfTextRuns()` reported the matrix scale as the point size and ignored `Tf`
entirely, so every size-based judgement was made on a number that was not a
size; and `sanitizeRich()` left a list nested directly inside a list, which
`richToText()` skips in silence — content vanishing from the projection that the
diff, the AI, search and the seal all read.

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

---

# Run 3 — Visibility & Permissions Hardening (2026-07-25)

Seven fixes, F1–F7, seven commits, in the order the brief set. **All seven were
completed**, including their acceptance tests. One requirement inside F4 was
implemented client-side rather than server-side for a reason set out below and
in `BUGLOG.md`; nothing else deviates.

The premise of the run was a single sentence: **the server is the only thing
that decides what a user can see, and the interface inherits that decision.**
Everything below follows from it.

## What shipped

| # | Fix | Commit |
|---|---|---|
| F1 | Enforce folder access on the server, not in the browser | `7f291e3` |
| F2 | `can_view_values` — a per-member right the server enforces | `366ed20` |
| F3 | The dashboard inherits the scope | `ca18a58` |
| F4 | Approvals waiting is the reader's own queue | `e0dc188` |
| F5 | Signer IP and device move off the document face | `6f33afd` |
| F6 | The public advice page stops publishing how busy the firm is | `fc493cd` |
| F7 | Trim the share payload; label static sharing | `53153e3` |

## Test baseline

**There was no automated test suite in this repository when the run started.**
`package.json` had no `test` script and no test files existed; the only prior
verification artefact was `TESTREPORT.md`, a manual exploratory QA pass. So the
recorded baseline is: **0 tests, nothing to regress against.**

This run creates the suite. `npm test` runs `node --test test/*.test.js`:

| File | Tests | What it covers |
|---|---|---|
| `test/regression.test.js` | 12 | The baseline itself — auth, viewer read-only, executed-record immutability, append-only audit trail, counterparty share round-trip, optimistic locking |
| `test/f1-folder-scope.test.js` | 21 | F1 acceptance |
| `test/f2-value-permission.test.js` | 19 | F2 acceptance |
| `test/f3-dashboard.test.js` | 9 | F3 acceptance |
| `test/f4-approvals.test.js` | 6 | F4 acceptance |
| `test/f5-signature-provenance.test.js` | 6 | F5 acceptance |
| `test/f6-advice-queue.test.js` | 7 | F6 acceptance |
| `test/f7-share-payload.test.js` | 9 | F7 acceptance |
| **Total** | **89** | all passing |

`test/helpers.js` boots a **real** server on a free port against a throwaway
SQLite file. `test/dom.js` is a small browser stand-in — enough to run a view
module that builds a string and read back the markup it produced.

**Nothing calls a real API.** Anthropic is served by a local stand-in
(`ANTHROPIC_BASE_URL`, a new env var that also lets an air-gapped deployment
point at a proxy) which records every request body — that recording is what the
"no folder-B contract reached the prompt" assertions run against. Email is never
sent: `RESEND_API_KEY` is unset in the harness, so `sendEmail()` queues to the
outbox table exactly as it does on a server with no mail provider.

**Every security assertion is on a raw response body or a raw AI payload**, not
on rendered UI. That is the whole point of the run: a browser hiding data the
server still sent is the failure mode being eliminated, so a test that checks
the UI would pass on the broken code.

## Schema changes

Additive only, via the existing `addColumnIfMissing()` pattern. Safe to run
against an existing database; no column was dropped, renamed or rewritten.

| Table | Column | Type | Why |
|---|---|---|---|
| `users` | `can_view_values` | `INTEGER NOT NULL DEFAULT 1` | F2. Default 1 so every existing account keeps seeing exactly what it saw yesterday. |

That is the only schema change in the run. F1 needed none — folder access
already existed in `settings.appSettings.folderAccess`, in the shape the client
has always written; the server simply started reading it.

## The F2 storage decision, and why

`can_view_values` is a **column on `users`**, not a map in `appSettings`
alongside `folderAccess`. Three reasons, in order of weight:

1. **It is a right, not a preference.** `appSettings` is the workspace's
   configuration blob — templates, approval rules, advice rates, the directory.
   An access-control fact that the server consults on every single response
   belongs on the identity it constrains.
2. **It costs nothing to resolve.** The `auth` middleware already loads the full
   `users` row into `req.user`. Reading a column off it is free; reading
   `folderAccess` requires a settings lookup and a JSON parse per request.
3. **`appSettings` is published to every browser.** `GET /api/bootstrap` returns
   the whole blob. That is the wrong place for a permissions table to live even
   when its contents are not themselves secret, and it invites a future change
   that lets a non-admin write to it.

**Why `folderAccess` was not moved to match.** It already exists in customer
databases in its current shape, `PUT /api/settings` already writes it, and the
client already reads it. Migrating it would be a breaking change to live data
for a consistency benefit only a developer would feel. The two live in different
places and the code says why in both.

## Behaviour changes an admin will notice

1. **Folder access is now real.** A member restricted to two streams sees only
   those streams everywhere — the register, search, the dashboard, the
   activity feed, exports, and anything they ask the AI. Before this run they
   saw the whole portfolio through any path except the register.
   **If a customer was relying on the register filter as a filing convenience
   while expecting members to still find things by search, that will change.**
2. **A restricted member gets "Contract not found" for a contract outside their
   streams**, not "access denied" — deliberately, so ids cannot be probed.
3. **A restricted member cannot file a contract into a stream they cannot see.**
   The save is refused with a clear message.
4. **New: per-member value visibility.** Team & Settings has a Hide / Show
   control beside each member's folder access. **It is on for everyone by
   default** — this deploy changes nothing until an admin turns it off.
5. **Admins cannot be denied value access**, and cannot change their own. The
   API refuses both with an explanatory message.
6. **A member without value access sees a different dashboard**: no "Active
   value" card (it is not in the Customize list either), expiring cards say
   *when* rather than *how much*, the renewal pipeline is drawn in contract
   counts, and the "Value (high → low)" sort option is not offered.
7. **Search snippets are withheld** from members without value access — hit
   names and counterparties still show. The FTS index contains template field
   values, so a snippet can quote an amount verbatim.
8. **"Approvals waiting" is now "Approvals waiting on you"** and lists only what
   the reader can act on or raised themselves. An admin who was using it as a
   workspace-wide backlog will find it much shorter; the Queue board is the
   place for the full picture.
9. **Executed contracts no longer print the signer's IP** on the document face.
   It is in the audit trail and the evidence pack. Anyone who was reading IPs
   off the contract will find them one panel down.
10. **The public advice page no longer says how many requests are in the
    pipeline.** It still gives the estimated feedback date, and that date still
    moves with the real load.
11. **In static (no-server) mode the share dialog now carries a red warning**
    that link-borne sharing is demo-only. Server-mode sharing is unchanged.
12. **An uploaded document's bytes are scoped too.** `GET /api/files/:id`
    resolves the caller's scope against the contracts that reference the file.
    A file nothing references stays readable — that is what the orphan sweep in
    Team & Settings is for.
13. **New endpoint:** `GET /api/export/contracts.csv` — the scoped, masked
    whole-register export. The browser's selection exports still work.

## Static mode

Static mode (localStorage, no server) keeps working throughout. Where a fix is
inherently server-only, static mode keeps current behaviour:

- **F1 and F2 are server-only.** There is no server to enforce anything and no
  multi-user workspace to enforce it between — a static workspace is one person
  and one browser. `userFolderAccess()` and `canViewValues()` both answer
  "unrestricted" for a local user record, so nothing changes.
- **F3, F4, F5, F7** are client-side and apply in both modes.
- **F6** applies in both: the static intake page computes the date from the same
  browser's own demo queue and prints no count either.

## Manual verification steps

Click-through steps, no developer tools needed unless a step says so. Start each
one signed in as the workspace admin, with the server running (`npm start`).

### F1 — folder access is enforced

1. Go to **Team & Settings**. Add a member: name *Test Legal*, email
   `testlegal@yourcompany.co.ke`, role **Legal**, any password of 8+ characters.
2. In that member's row, under the access column, click **Edit**.
3. Untick **All streams & folders**, tick **only** *Procurement & Raw Materials*,
   click **Save access**.
4. Sign out. Sign in as `testlegal@…`. You will be asked to set your own
   password — do that.
5. Open the **Register**. Confirm every row is a Procurement contract, and the
   stream filter pills offer no other stream.
6. Type the name of a contract from a *different* stream into the search box.
   Confirm **no result**.
7. Go to **Home**. Confirm the KPI counts, the stage bar, "Decisions due" and
   "Needs your action" only ever name Procurement contracts.
8. **The one that matters:** in the browser's address bar, replace everything
   after the host with `/api/contracts?limit=200` and press Enter. You are
   looking at exactly what the server sent. Confirm the JSON contains **no**
   contract from another stream. Do the same for `/api/stats` and
   `/api/export/contracts.csv` (the CSV downloads — open it in a spreadsheet).
9. Now put a specific contract id from another stream in the address bar:
   `/api/contracts/MK-XXX`. Confirm you get **`{"error":"Contract not found"}`**,
   not an access-denied message and not the contract.
10. Sign back in as the admin and confirm you still see everything.

### F2 — value visibility

1. As the admin, go to **Team & Settings**. In *Test Legal*'s row, under the
   access column, find **Sees contract values** and click **Hide**. Confirm the
   dialog explains what they lose, then confirm.
2. Sign in as *Test Legal*.
3. **Register:** the Value column shows `—` on every row. The footer no longer
   shows an aggregate. Open the **Sort** dropdown — confirm *Value (high → low)*
   is **not** in the list.
4. Open any contract. Confirm no amount appears in the key-terms panel.
   *(Expected limitation: if the contract's own wording quotes a figure, that
   figure is still in the document text — see "Known limitations" below.)*
5. **Home:** confirm there is no *Active value* card. Click **Customize** and
   confirm *Active value* is not offered there either. Confirm the expiring
   cards say "soonest in N d" rather than a KES exposure, and the Renewal
   pipeline is labelled in contracts, not shillings.
6. **The one that matters:** address bar → `/api/contracts?limit=200`. Confirm
   no `"value"` field and no amount anywhere in the JSON. Then `/api/stats` —
   confirm there is no `totalValue`. Then `/api/export/contracts.csv` — open it
   and confirm the *Value (KES)* column is present and every cell in it is empty.
7. Still as *Test Legal*, edit something harmless on a contract (a note, the
   counterparty spelling) and save. Sign back in as the admin, open the same
   contract, and **confirm the value is still there and unchanged.**
8. As the admin, click **Show** in that member's row to restore access, and
   confirm the amounts come back for them.

### F3 — the dashboard

1. Signed in as the restricted *Test Legal* from F1, open **Home**.
2. Confirm the KPI counts match the Register's contract count for their streams.
3. Expand **Decisions due**. Confirm every contract named is one of theirs.
4. Confirm "Waiting longest" and "Needs your action" name only their contracts.
5. With value access also removed (F2 step 1), confirm no `KES` figure appears
   anywhere on the Home screen.

### F4 — approvals

1. As the admin, go to **Team & Settings → approval rules** and confirm a rule
   exists (the default is *Value ≥ KES 5M → an Admin*).
2. As a **Legal** member who is not an approver under any rule, open **Home**.
   Confirm the panel is titled **"Approvals waiting on you"** and lists only
   contracts that member raised, or says *"Nothing is waiting on you."*
3. Sign in as an **Admin**. Confirm the same panel now lists the high-value
   contracts waiting on an admin's sign-off, each row showing the step, the
   reason and how long it has waited.
4. Click a row. Confirm it opens that contract.
5. With value access removed for a member, confirm their rows carry no amount
   and the step reads "Approval" rather than a rule name containing a figure.

### F5 — signer IP off the document face

1. Open any **executed (Signed)** contract.
2. Look at the *Executed & Sealed* block. Confirm each signer card shows the
   name, the email, the signature form (e.g. "drawn signature") and the
   timestamp — and **no `IP` anywhere**.
3. Scroll to the **Audit trail** panel. Confirm the *Signed* entry ends with
   the IP and the device (e.g. `· IP 41.90.64.12 · Chrome`).
4. Click **Download evidence pack**. Open the downloaded `.json`. Confirm each
   entry under `signatures` still has `"ip"` and `"userAgent"` filled in.
5. Click **Export PDF**. Confirm the printed audit trail carries the same
   provenance line and the signature block does not.
6. Click **Verify seal** on a contract that was signed *before* this update.
   Confirm it still reports **Seal valid**.

### F6 — the public advice page

1. Sign out entirely (or open a private window).
2. Go to `<your-host>/#advice=new`.
3. Pick a service. Confirm the blue notice reads *"Submit today and expect
   feedback by <date>. Current workload is already included in that date."* and
   **does not** state a number of requests in the pipeline.
4. **The one that matters:** address bar → `/api/advice/rates`. Confirm the JSON
   contains `orgName`, `rates` and `eta`, and contains **no** `queue` object and
   no request count.
5. Sign back in and open the **Advice Desk**. Confirm the internal board still
   shows every request and the full pipeline counts.

### F7 — the share payload

1. Open a contract, click **Share**, send a link to yourself (channel: *Copy
   link*). Copy the link.
2. Open it in a private window. Confirm the counterparty page renders: the
   document, the header naming who shared it, and the response form.
3. Confirm **"Propose a different value"** is offered on a monetary contract,
   enter a figure, add a comment, and submit as *Request changes*.
4. Back in HaTi as the sender, confirm the round appears under **Negotiation**
   with the proposed value.
5. Repeat 1–2 with a contract that has **formatted** (rich) working text and
   confirm it renders as formatted text, not as raw markup.
6. **The one that matters:** with the link open in the private window, address
   bar → `/api/shares/<token>` (the token is the part of the link after
   `#share=t:`). Confirm the JSON contains **no `folder`** field on the contract.
7. **Static mode:** open `index.html` directly from disk (no server), create a
   contract, click **Share**. Confirm the red *"Demo sharing — for
   demonstrations only"* block appears above the channel tabs and says the link
   never expires and cannot be revoked.

## Known limitations, stated plainly

- **`can_view_values` does not redact the contract's own wording.** It governs
  structured value fields, monetary aggregates, exports and AI prompt assembly.
  A member who can open a contract can still read a price written into clause 4,
  into the frozen executed text, or into an uploaded PDF's extracted text.
  **Folder access (F1) is the boundary that actually holds**; value visibility
  reduces casual exposure across every list, dashboard, export and AI answer.
  This is written into SECURITY.md rather than glossed over.
- **The approvals filter (F4) is client-side.** The data underneath is
  server-scoped; the narrowing is not. Reasoning in `BUGLOG.md`.
- **A customer's own advice quote still carries its turnaround in days**, which
  encodes the queue-load band. Same information as the ETA date the brief asked
  to keep, and delivered only behind that customer's own tracking token.
- **`GET /api/contracts` has no sort parameter**, so there was no server-side
  value sort to make fall back. The client-side fallback was implemented and the
  option removed from both sort menus.

## Constraints held

- **No build step.** No frontend dependency added; every change is vanilla ES
  modules in `js/` following the existing `Object.assign(window, {…})` pattern.
  The only `package.json` change is a `test` script pointing at Node's own
  built-in test runner. No test framework was installed.
- **Sealing untouched.** `sealString()`, `execHashInput()`, `freezeContractHtml()`
  and everything under `execution.hashMode` were not modified. F5 is a display
  change to a field that was never part of the hashed content. Contracts sealed
  before this session verify against exactly the hash they were given, and the
  regression suite pins executed-record immutability.
- **Additive schema only.** One new column, `NOT NULL DEFAULT 1`, via
  `addColumnIfMissing()`. Nothing dropped, nothing rewritten. Safe against an
  existing database.
- **Server-first throughout.** Filtering and masking happen in
  `server/server.js` before the response is serialised; every client change is
  cosmetic on top. The one exception (F4) is named above and in `BUGLOG.md`.
- **Viewers stay exactly as read-only as they were.** No existing check was
  loosened; the regression suite pins it.
- **The mobile / WhatsApp counterparty portal was not touched.** Not built, not
  extended, not refactored toward.

## Next run, in the order I would do it

1. **Give `folderAccess` the same server-side write path `can_view_values` has.**
   It is still edited by writing the whole `appSettings` blob through
   `PUT /api/settings`, which means the folder-access editor and the template
   editor race each other on save. A dedicated admin-only route would fix both.
2. **A server-side approvals endpoint**, which is the honest fix for F4's
   deviation — but only alongside moving the rule engine to one place rather
   than copying it, so the two answers cannot diverge.
3. **Per-folder value visibility.** `can_view_values` is workspace-wide per
   member; the natural next ask is "they can see values in Procurement but not
   in Sales", which the folder-scope machinery is already shaped for.
4. **An admin-visible access audit** — one screen answering "who can see what",
   built from `folderScopeFor()` and `canViewValues()` so it reports the rules
   the server actually enforces rather than a second implementation of them.

---

# Run 3a — Signing capacity follow-up (2026-07-26)

One reported defect, one commit. Raised straight after Run 3: signing a contract
as the workspace admin printed **"Admin"** as the signer's title, even when the
person's actual job title was COO.

## The distinction the product was missing

| | What it is | Example | Where it belongs |
|---|---|---|---|
| **Role** | A permission level — what the account may do in the software | Admin / Legal / Viewer | Team & Settings, access control |
| **Title** | The capacity a person signs in — their authority to bind the company | Chief Operating Officer | The signature block, the evidence pack |

The signature block was built to show the title and to fall back to the role.
Nothing ever recorded a title for a team member, so it always fell back. A
permission level is not a weaker version of a capacity; it is a different claim,
and on a contract it is the wrong one.

## Schema change

Additive, via `addColumnIfMissing()`. Safe against an existing database.

| Table | Column | Type | Why |
|---|---|---|---|
| `users` | `title` | `TEXT` (nullable) | The capacity a member signs in. Nullable on purpose: no title recorded reads as empty, never as a substitute. |

## What changed

- **The setup screen now asks the founder for their job title.** They were the
  one account that could never have one — the "Add team member" form had a title
  box, the workspace-creation form did not.
- **A title now lands on the account**, not only in the contacts directory. Both
  are kept in step so signer-field auto-fill still works.
- **Team & Settings shows each member's title**, or the warning *"No job title —
  signs with no capacity shown"*, with an Add/Edit control.
- **A member can set their own job title.** It is the only field a non-admin may
  change on their own account: a permission is granted to you, a job title is a
  fact about you. Role and value access are still admin-only and still cannot be
  self-granted.
- **Both signing paths record the capacity** — single-signer and the multi-signer
  route — reading account title, then the people directory, then nothing.
- **Nothing falls back to a permission level any more**, including the signing
  route's own auto-fill, which used to write "Admin" into a field the interface
  labels "Title (e.g. CFO)".
- **The evidence pack now records capacity.** It previously recorded no role or
  title at all — the document that exists to prove a signature did not say in
  what capacity anyone signed.
- **Contracts signed before this fix read correctly now too.** The display
  suppresses a value that is exactly `Admin`, `Legal` or `Viewer`, so an old
  signature shows the name alone rather than a permission level. Display-only —
  no stored record is altered.

## Sealing

Untouched. The seal folds in each signature's name, timestamp, form and image
hash — never its role or title. A test asserts the seal string is byte-identical
with and without a title, so nothing already sealed moves.

## Manual verification

1. **New workspace:** at the create-workspace screen, confirm there is now a
   **Your job title** box. Enter *Chief Operating Officer* and finish setup.
2. Open any draft contract and **Sign** it.
3. Look at the *Executed & Sealed* block. Confirm it reads
   **"<your name>, Chief Operating Officer"** — not "Admin".
4. Click **Download evidence pack**, open the JSON, and confirm the signature
   entry has `"capacity": "Chief Operating Officer"`.
5. **Existing workspace:** go to **Team & Settings**. Under your own name you
   will see *"No job title — signs with no capacity shown"* with an **Add**
   button. Click it, enter your title, save.
6. Confirm the same for a colleague: as an admin, click **Add/Edit** on their
   row. Confirm a non-admin can edit their own title but not a colleague's.
7. Open a contract **signed before this update**. Confirm the signature now
   shows the name **alone** — the old "Admin" is no longer displayed as a
   capacity, and the seal still verifies (click **Verify seal**).
8. Set up a **signing route** with two named signers. Confirm the "Title (e.g.
   CFO)" field auto-fills from the member's recorded title, and no longer fills
   itself with "Admin" when there is none.

## Known limitations

- **Contracts already signed keep their stored record.** Signatures on an
  executed contract are immutable server-side, and that rule is not being
  relaxed — a signature that can be edited afterwards is worth nothing. The
  display reads honestly now; correcting the underlying record is an amendment,
  which is the existing and correct route.
- **A job title that is literally "Admin", "Legal" or "Viewer" is suppressed.**
  Those three strings are the product's own permission labels. A real title
  would be "Administrator" or "Legal Counsel". Accepted trade-off: the
  alternative leaves historic signatures claiming a permission level as
  authority.

## Test coverage

19 new tests (`test/f8-signing-capacity.test.js`) covering the rule, where the
capacity is read from, what the signed contract shows, the evidence pack, the
seal being unaffected, and the server storing and serving it — including that a
non-admin can set their own title and nothing else. **Suite total: 109, all
passing.**

---

# Run 4 — Word (.docx) Round-Trip (2026-07-26)

HaTi now reads modern Word files and owns the full negotiate-in-Word loop:
upload a received `.docx`, send it OUT for external review (with a visible
soft lock), take the marked-up file BACK as an ordinary negotiation round,
and adopt it as the next document version — one history, whichever tool the
counterparty negotiates in. Legacy `.doc` (pre-2007) stays refused with a
clear instruction to re-save.

## What shipped

| Phase | What it does |
|---|---|
| 1 | Accept `.docx` in every upload entry point (single upload, bulk migration, template import). Text is read client-side by the new zero-dependency extractor `js/docx.js` and flows through the exact pipeline PDFs use — metadata extraction, obligations, clause scan, AI or heuristic alike. |
| 2 | **Download .docx for Word review** — downloads the current file, marks the contract `Out for Word review` (amber chip with a days-out counter), pauses online editing and signing, and always offers **Cancel review** as the escape hatch. A 14-day reminder nudges a stalled review. |
| 3 | **Upload returned .docx** — the returned file is validated on its bytes, its text extracted (tracked changes read as *accepted*, with the counts on the audit trail), stored in the files store, and filed as a negotiation round with `baseText`/`proposedText`. Review/accept/reject runs through the existing `reviewProposedRound` machinery. An unchanged return closes the review without opening a round. |
| 4 | Adoption files the returned file as document version v2, v3… beside the untouched original — file-version picker + per-version download in the workspace, a latest-round redline card (added/removed counts), a real reading view for `.docx` uploads, and a refreshed clause scan so risk flags describe the adopted wording. |
| 5 | Guardrails: executed contracts take no new versions (client UI + the server's existing `EXECUTED_IMMUTABLE` wall over `upload`); returned files are byte-sniffed, size-capped and refused with human-readable reasons; version files ride `c.documents` so the server's file scoping and delete-sweep cover them; heavy bytes are stripped from synced JSON once a `fileId` exists. |

## New / touched

- **New:** `js/docx.js` — ZIP central-directory reader + `DecompressionStream`
  inflate + WordprocessingML→text projection. No dependencies; runs in the
  browser and under `node:test`.
- **New:** `js/wordflow.js` — the round-trip flow and its workspace controls.
- **Touched:** `js/views/contract.js` (upload accepts docx, Word controls,
  edit/sign gates, current-version re-read), `js/versioning.js` (Word rounds
  adopt their file on accept), `js/core.js` (round/version payload slimming,
  Word round label), `js/views/migration.js` + `js/views/library.js` (docx
  accepted, `.doc` refused), `js/app.js` (module imports).
- **Fixtures:** `test-fixtures/contract-v2-redline.docx` (real `w:ins`/`w:del`
  tracked changes) via `generators/genoffice.js`.

## Verification

- `test/f9-word-roundtrip.test.js` — 11 tests: extractor semantics on real
  fixture bytes (tracked changes read as accepted, deleted wording never
  resurfaces, entities/tabs/breaks, field codes dropped) and adversarial
  inputs (random bytes, zip-without-document, zero-byte, empty document), plus
  the server-side signed door (PUT that grows `upload.versions` on an executed
  record → 409) and the version-file lifecycle (readable while referenced,
  swept on contract delete).
- Full suite: **120/120 pass** (34 suites), no regressions.
- Hand-driven browser run: upload → out-for-review lock → returned redline →
  round review → adoption → version picker → sign — screenshots in the run
  record.

## Known limitations (deliberate)

- The Word download is a **clean copy** of the current version — HaTi does not
  yet write Word's own tracked-changes markup into generated files. The web
  redline (and Word's Review → Compare) carries that duty. Native `w:ins`/`w:del`
  export is the natural v2 of this feature.
- Legacy `.doc` remains refused; headers/footers/footnotes/text-boxes in a
  `.docx` are not read (body text only). Comments in the returned file are not
  yet surfaced.
- OCR does not apply to `.docx` (never scanned paper); no-AI mode degrades to
  the same heuristics every other document uses.

---

# Run 5 — UX-review remediation: the negotiation loop (2026-07-26)

A UX review of HaTi ran two contract negotiations end to end and scored them
2/10 and 5/10. This run fixed the eight problems it found, and proved each fix
with automated tests that replay those same two negotiations against the real
code.

**All eight items are DONE. All 14 checks passed twice in a row on clean
checkouts. No fix was rolled back.**

---

## The two people in the story

The tests are written as a real negotiation, because that is the only way to
find out whether the product works.

**Wanjiru** owns a small catering company in Nairobi. She drafted a 12-month
supply agreement in HaTi. **Erik** is a procurement manager at a Swedish firm.
In the first story he refuses to use HaTi and works only in Microsoft Word. In
the second he negotiates inside HaTi. Each story runs six full rounds and ends
with a signed, sealed contract.

---

## What was wrong, and what changed

### 1. She could not send her contract as a Word file — DONE (`0e233df`)

**Before.** A contract drafted in HaTi could only be exported as a PDF. Erik
cannot mark up a PDF. So Wanjiru copied the text out by hand, pasted it into
Word and rebuilt the headings and clause numbers herself — about half an hour,
before the negotiation even started.

**Now.** A **Word** button beside PDF produces a genuine `.docx`. Headings stay
headings, clause numbers stay exactly as written, bold and italics survive, and
the signature block is there. The counterparty review page offers the same
download, so Erik can take a Word copy from the page he is reading.

**How we know it works.** HaTi already knows how to *read* Word files — that
reader was built separately and is proven against files Word itself produced.
The test writes a contract out and reads it back with that same reader: what
comes back is the contract, unchanged.

**One deliberate choice.** Clause numbers are written into the file as ordinary
text rather than as Word's automatic numbering. Word renumbers its own lists —
a schedule that starts at clause 8 would be renumbered to 1, and every
cross-reference in the agreement would break.

### 2. Erik's marked-up file had no way into her contract — DONE (`2f76520`)

**Before.** HaTi had a good Word round-trip: send the file out, get the
marked-up copy back, see the changes highlighted. But it only worked for
contracts that had *arrived* as Word files. For a contract Wanjiru wrote
herself — the normal case for a small business — it was switched off entirely.
Uploading Erik's file created a second, unrelated contract.

**Now.** It works on every contract. Erik's file lands on the contract it
belongs to, as a numbered negotiation round, with his tracked changes counted
and shown.

**Two things found while fixing it.** The panel was never even drawn on a
drafted contract, so removing the restriction alone would have changed nothing
visible. And when the file was accepted, HaTi kept the new wording but silently
threw the file itself away. Both fixed. Contracts that arrived as Word files
behave exactly as before — there is a test that fails if that changes.

### 3. The record said she wrote his changes — DONE (`1a5860f`)

**Before.** When part of a negotiation happens by email, the only way to get
the other side's wording in was to type it into the Edit box. The history then
recorded **Wanjiru** as the author of **Erik's** changes.

**Now.** The Edit box has a tick-box: *"These changes came from Nordkust
Industri AB (received outside HaTi)."* Ticking it files the wording as a round
in **their** name, waiting for her decision, exactly like a change that arrived
through the app. The wording does not enter the contract until she accepts it.

Both facts are kept, because both are true: the round is theirs, and the record
also says who typed it in. Nobody can later claim the history was disguised.

### 4. She had to retype his email address every round — DONE (`144f9c4`)

**Before.** The share form opened blank every time. Six rounds meant typing
Erik's address six times — six chances to send a live contract to the wrong
person.

**Now.** After a round is decided, one button: **Send updated version**. It goes
to the person she was already negotiating with. If she opens the full form
instead, it is already filled in and says where the details came from. The
information was always stored; nothing had ever read it back.

### 5. Every round needed a new link — DONE (`0effb2c`)

**Before.** Each link accepted exactly one reply and then died. Erik collected
six links and had to work out which was live.

**Now.** One standing link per counterparty, for the whole negotiation. It
always shows the current wording and always takes the next reply. Single-use
links still exist and are still the default for a final signature, where one
copy should bind one answer.

**The subtle part.** A standing link must not make other links look out of
date — otherwise opening the negotiation link would quietly kill the signature
link someone was about to sign. There is a test for exactly that.

### 6. Accept everything or refuse everything — DONE (`a9ba7f4`)

**Before.** A round arrives with three changes. She agrees with two. Her only
options were to accept all three, then delete the third by hand in a plain text
box — or refuse all three and retype the two she wanted.

**Now.** Each change gets its own **Accept** / **Reject**, with a running count
and a reply box. The contract is rebuilt from her decisions.

**The dangerous part, and how it is handled.** Changes that sit next to each
other must move together. "fourteen (14) days" → "twenty-one (21) days" looks
to a computer like two separate changes; accepting one and refusing the other
would produce **"twenty-one (14) days"** — wording neither party ever proposed.
Related changes are therefore treated as one decision, and a test tries every
possible combination of decisions and checks that the result never contains a
word neither side wrote.

A change nobody looked at is **not** adopted. Taking nothing is recorded as a
refusal, not as an acceptance that happened to change nothing.

### 7. Refused changes vanished, and "no" came with no reason — DONE (`f5e67d5`, `a9ba7f4`)

**Before.** The portal could tell Erik his round was not adopted, but never
why — that lived in a separate email. And a refused change simply disappeared
from the document, which reads like agreement.

**Now.** Her reply travels with her decision and both sides of every round are
shown as a conversation beside the contract. Refused changes are listed under
**Still open between us**, showing what he asked for, what the contract still
says, and why. A point drops off the list once it is settled — including when
the clause is later renegotiated to something else entirely — because a list
that shows settled items is one people stop reading.

### 8. The contract got uglier every round — DONE (`82d62e2`)

**Before.** The moment a redline was accepted, the document became plain text.
Headings, numbered clauses and tables — gone, permanently, at the first round.
By round four Erik is editing a wall of prose, and the version that gets signed
is the ugly one.

**Now.** Edited wording is put back into the document's own structure. Six
rounds later the title is still a title, clause 5 is still clause 5, and the
signed contract is the properly formatted document.

**The rule that makes this safe.** After rebuilding, HaTi checks that the
document says *exactly* what the parties agreed. If it cannot verify that, it
does not guess — it falls back to plain text **and says so in the history**. A
good-looking contract that does not say what was agreed would be far worse than
a plain one that does.

---

## Status of all eight items

| # | Item | Status | Commit |
|---|---|---|---|
| 1 | Word return works on every contract | **DONE** | `2f76520` |
| 2 | One-click reshare, remembered recipient | **DONE** | `144f9c4` |
| 3 | Real .docx export | **DONE** | `0e233df` |
| 4 | Accept or reject each change separately | **DONE** | `a9ba7f4` |
| 5 | One standing negotiation link | **DONE** | `0effb2c` |
| 6 | Formatting survives the negotiation | **DONE** | `82d62e2` |
| 7 | File changes under the counterparty's name | **DONE** | `1a5860f` |
| 8 | Two-way conversation in the portal | **DONE** | `f5e67d5` |

Supporting commits: `0456e54` (the test harness and the failing baseline it
starts from).

Nothing was rolled back. Both large items (4 and 6) were tagged before work
began — `checkpoint-before-fix4` and `checkpoint-before-fix6` — and both were
brought fully green, so neither tag was needed.

The mobile/WhatsApp counterparty portal was **not** built; it is deferred by
design. Item 5 changes how long an existing web link lives, nothing else.

---

## Verification

Two runs of the complete test suite, each on a **fresh copy of the final
commit** (`82d62e2`) in its own directory with a fresh install:

| Run | Result |
|---|---|
| Clean run 1 | **342 tests, 342 passed, 0 failed** (15.05 s) |
| Clean run 2 | **342 tests, 342 passed, 0 failed** (15.60 s) |

All 14 checks in `CHECKLIST.md` passed twice in a row on clean runs.

Where the suite started: at the commit the review examined, the existing 172
tests passed and the two new negotiation scripts failed 27 of their 33 checks.
Those 27 failures described work that had not been done yet; they are the
distance this run closed.

Of the 342 tests, 172 are the pre-existing suite, unchanged and still passing —
drafting, the twelve templates, PDF export, email-code signing, the seal, the
evidence pack and version compare all behave exactly as they did before.

---

## Two things worth knowing

**A test dependency was added.** The tests now use `jsdom`, a stand-in browser,
so the negotiation scripts run against the real code rather than an imitation
of it. It is a *testing* tool only: the app itself still has no build step and
still ships no libraries to the browser.

**Two real bugs were found by the new tests and fixed**: a counterparty company
name containing "&" would have been displayed to them as "&amp;" in the portal,
and the history entry for an accepted round named only who decided it, never
whose wording it was.

---

# Run 6 — The counterparty's side (2026-07-26)

A fresh review of the platform after Run 5 found two bugs that had shipped, plus
one thing that blocked demos. All three are now fixed. **Everything passes: 379
checks, twice in a row, on clean copies.**

The uncomfortable pattern worth naming up front: **both bugs were on Erik's side
of the screen, and both got past 342 passing tests** — because every one of those
tests was checking Wanjiru's side. Erik is half of every contract and had no
checks at all. That is now fixed too, and it is the most valuable thing in this run.

---

## 1. "Send updated version" wasn't sending anything — FIXED (`8710db8`)

**What was wrong.** Wanjiru finished a round, pressed **Send updated version**,
and saw *"Updated version sent to Erik Lindqvist."* The contract's history said
the same. **No email ever went out.** Erik had no reason to look at the link
again. Both of them then waited for the other, and the record explained the
delay incorrectly.

**What it does now.** It actually emails him. And — the part that took the real
work — when it *can't* send, it says so instead of pretending:

- no email service set up → *"published to Erik's link — NOT emailed: this
  workspace has no mail provider"*
- the email service refused it → the reason is recorded
- a WhatsApp share → WhatsApp opens so she can send it herself
- a copy-link share → she's handed the link to send

The history now only says "emailed" when something genuinely left the building.

**Why the extra work mattered.** Just adding the email would have fixed one of
four cases and left three silent failures behind it, which is how the original
bug happened in the first place.

## 2. Erik's Word download was one giant paragraph — FIXED (`b9f15c2`)

**What was wrong.** Erik pressed **Download as Word** on his review page and got
the entire contract as one unbroken block of text — no headings, no clause
numbers, nothing. The same button on Wanjiru's side produced a properly laid out
document with sixteen separate sections.

**Why.** The page was handing the file-builder plain text while telling it *"this
is formatted."* The builder went looking for formatting, found none, and treated
the whole contract as a single paragraph.

**What it does now.** Both sides download the same properly structured document.
There is a test that compares the two files and fails if they ever differ again.
There's also a safety net in the file-builder itself, so if any other part of the
app makes the same mistake in future, it produces a sensible document anyway.

## 3. Signing was impossible without an email service — FIXED (`6eaf573`)

**What was wrong.** To sign, Erik needed a 6-digit code emailed to him. If the
server had no email service connected — which is the normal state for a demo —
that code could never arrive, so **nobody could sign at all.** After six rounds
of work.

**What it does now, per your decision.** He can sign without the code. Two things
I kept, neither of which slows a demo down:

- **The code is only skippable when it genuinely can't be sent.** If email is
  working, the code is still required. Otherwise anyone with the link could skip
  the identity check just by choosing to, and nobody would see it happen.
- **The signature is labelled as unverified** — in the history, on the
  certificate and in the evidence pack. The signature is still binding. What the
  record no longer does is imply HaTi checked something it didn't.

He still has to give a real email address, so a link can never be signed
anonymously.

## 4. The counterparty's side now has tests — FIXED (`b9f15c2`)

This is the fix that prevents the next two bugs.

There is now a test setup that opens Erik's actual review page, presses its
buttons, and checks what he really receives: the Word file he downloads, the
edits he submits, the conversation he can read, and both ways of signing. Fifteen
checks, including one that would have caught the download bug on the day it was
written.

---

## Status

| # | Item | Status | Commit |
|---|---|---|---|
| 1 | "Send updated version" actually sends | **DONE** | `8710db8` |
| 2 | Counterparty's Word download | **DONE** | `b9f15c2` |
| 6 | Signing without an email service | **DONE** | `6eaf573` |
| 7 | Tests for the counterparty's side | **DONE** | `b9f15c2` |
| 3 | One Word button instead of two | **NOT STARTED** | — |
| 5 | Attach a paper-signed copy | **NOT STARTED** | — |
| 8 | Show whether he has seen the current version | **NOT STARTED** | — |
| 4 | Clause-by-clause editing for Erik | **NOT STARTED** (phased approach agreed) | — |

## Verification

Two runs of everything, each on a fresh copy of the final commit in its own folder:

| Run | Result |
|---|---|
| Clean run 1 | **379 checks, 379 passed, 0 failed** (16.9 s) |
| Clean run 2 | **379 checks, 379 passed, 0 failed** (18.1 s) |

## Two tests had to be corrected, not deleted

Both changes altered a rule that an older test was holding in place. In each case
the guarantee still exists in a new shape, so the test was rewritten to assert
the new shape rather than removed:

- A test said *"signing always needs an emailed code."* It now checks that a
  server which **can** send one still demands it, and that a server which can't
  still refuses an anonymous signature.
- A test from Run 5 checked the history said *"Updated version sent."* Its setup
  never simulated a delivered email — so it was, in effect, asserting the bug. It
  now simulates delivery and checks for *"emailed"*.

Deleting either because it went red would have quietly removed the protection it
existed to provide.

## Run 6 continued — the remaining four items

All eight items from the review are now done. **419 checks, passing twice on
clean copies.**

### 3. Two buttons both said "Word" — FIXED (`24eb233`)

One downloaded. The other downloaded *and* froze editing, silently, with no way
back that anyone would find. There is one button now. The freeze is still there,
because it is genuinely useful — edits made here while a copy is out in Word
would clash with the wording coming back — but it is now a tick-box you choose,
with a sentence explaining why, and it defaults to on.

### 8. "Under review" now says which kind — FIXED (`3934772`)

That status covered two completely different situations: he's reading it and
thinking, or he never opened it and doesn't know it exists. Those need opposite
responses from Wanjiru and looked identical.

The contract now says plainly *"Erik has not opened the current version — sent 5
days ago"*, or *"Erik opened the current wording 2 days ago. No response yet."*
After three days unopened it escalates and offers **Send it again** in one click,
because silence that long usually means the message never arrived.

The information was already recorded. Nothing had ever shown it.

### 5. A paper-signed deal can be filed on its own contract — FIXED (`981f342`)

Signing on paper is still normal in cross-border trade, and it was a dead end:
the scan could only be uploaded as a *new* contract, so six rounds of
negotiation were orphaned from the document they produced.

Now there's **"Signed on paper instead? File the signed copy here"** under the
sign button. It attaches the scan to the same contract, keeps the whole history,
and seals it with the scan's own fingerprint.

What it refuses to do is pretend HaTi witnessed anything. No electronic
signature is recorded, and the history says outright that none was taken and
that the signatures are on the attached scan — the same wording an imported
already-signed contract carries.

### 4 (phase 1). Erik edits one clause at a time — FIXED (`d261282`)

The last place in the product treating a contract as a wall of text. He now sees
the document as clauses and presses **Change** on the one he wants to alter.
Everything else stays exactly as it was.

**Why this is safe.** The shared document is already stored one line per clause,
so changing one line and rejoining is exact — with nothing changed, the rebuilt
contract is identical to the original character for character. There's a check
that proves this. And as agreed, none of the plumbing changed: his edits travel
the same way they always did, so Wanjiru's side and the server behave exactly as
before.

There's still a **"Edit the whole document instead"** link for anyone who wants
to restructure wholesale, and it carries across whatever they've already changed.

Phase 2 — a comment attached to each clause rather than one per round — is not
built.

---

## Final status of all eight

| # | Item | Status | Commit |
|---|---|---|---|
| 1 | "Send updated version" actually sends | **DONE** | `8710db8` |
| 2 | Counterparty's Word download | **DONE** | `b9f15c2` |
| 3 | One Word button | **DONE** | `24eb233` |
| 4 | Clause-by-clause editing (phase 1) | **DONE** | `d261282` |
| 5 | Attach a paper-signed copy | **DONE** | `981f342` |
| 6 | Signing without an email service | **DONE** | `6eaf573` |
| 7 | Tests for the counterparty's side | **DONE** | `b9f15c2` |
| 8 | Has he seen the current version? | **DONE** | `3934772` |

## Verification

| Run | Result |
|---|---|
| Clean run 1 | **419 checks, 419 passed, 0 failed** (18.6 s) |
| Clean run 2 | **419 checks, 419 passed, 0 failed** (18.4 s) |

## Three bugs the new tests caught before they shipped

All three were in this run's own work, and all three were on the counterparty's
side — the half that had no checks until now:

- The clause editor opened **completely empty**, because the code attached the
  buttons before drawing anything for them to attach to.
- A scrolling call **crashed halfway through** opening the editor, silently
  abandoning the rest of the step.
- A round with **no changes at all** could be submitted, arriving at Wanjiru as
  an empty set of edits.

Which is the argument for the test harness, made better than I could make it in
prose.

### 4 (phase 2). A reason attached to each clause — FIXED (`e97bc4e`)

**What was still wrong after phase 1.** Erik could change one clause at a time,
but he still had a single comment box for the whole round. So *"we need changes
to payment, delivery and liability"* arrived as one lump, and Wanjiru had to work
out which sentence explained which edit. She also had only one reply to cover all
three.

**What it does now.** When Erik changes a clause, there's a **"Why?"** box right
there. His reason travels with that specific change.

On Wanjiru's review screen, each change now shows **"Why they asked"** above its
Accept/Reject buttons, and she gets a reply box on that change too. So the
conversation is: this clause, his reason, her decision, her answer — four things
that belong together, shown together.

Erik then sees, per clause, what he asked, whether it was adopted, and what she
said back.

**The tricky part, in plain terms.** Erik writes his reason against a whole
clause. Wanjiru decides on the *specific words* that changed inside it — "thirty
(30)" becoming "sixty (60)". So the app has to work out which of his reasons goes
with which changed phrase, without either of them thinking about it. It does that
by sending each reason along with the full clause before and after the change,
then matching the changed phrase back to the clause it came from. There's a check
that two changes get two *different* reasons rather than the same one twice.

Withdrawing a change withdraws its reason with it, and a reply given on a
specific change takes priority over a general one for the round.

---

## Everything is now done

| # | Item | Status | Commit |
|---|---|---|---|
| 1 | "Send updated version" actually sends | **DONE** | `8710db8` |
| 2 | Counterparty's Word download | **DONE** | `b9f15c2` |
| 3 | One Word button | **DONE** | `24eb233` |
| 4 | Clause-by-clause editing, **both phases** | **DONE** | `d261282`, `e97bc4e` |
| 5 | Attach a paper-signed copy | **DONE** | `981f342` |
| 6 | Signing without an email service | **DONE** | `6eaf573` |
| 7 | Tests for the counterparty's side | **DONE** | `b9f15c2` |
| 8 | Has he seen the current version? | **DONE** | `3934772` |

## Final verification

| Run | Result |
|---|---|
| Clean run 1 | **434 checks, 434 passed, 0 failed** (19.3 s) |
| Clean run 2 | **434 checks, 434 passed, 0 failed** (19.7 s) |

Nothing from the review is outstanding.

---

# The Negotiation tab — what changed, in plain English

*Written for someone who does not read code. Nothing below is a claim about what
the software should do; every statement about behaviour is backed by an automated
test whose name is given, and the test names are listed in `CHECKLIST.md`.*

## The problem this fixes

Until now, HaTi could track a negotiation properly only while the other side
also worked inside HaTi. The moment a Word file was involved, tracking fell
apart: you emailed a document out, something came back, and somebody had to work
out by eye what had actually changed.

## What is true now

**However a contract gets into HaTi, everything after that happens inside
HaTi.** There are three ways in — one of your standard templates, one of your
own custom templates, or a Word file you upload — and once the wording is in,
all three behave identically. Word is needed exactly once, to read a file's
wording in. It is never again the way a change is tracked.

Proven by `scenario3.test.js`, which runs a complete six-round negotiation three
times over, once per route, and then checks that all three end up with a
**word-for-word identical contract**. Three separate tests passing would not
have caught one route quietly drifting; comparing them to each other does.

## What the Negotiation tab looks like

The contract workspace now has two tabs across the top: **Docs** (everything
that was there before) and **Negotiation** (new). Switching between them loses
nothing — not a comment you were half-way through typing, not the change you had
selected.

The Negotiation tab shows three columns side by side:

1. **Baseline** — the wording both sides agreed they are arguing about, read-only.
2. **Working** — the same document with the proposed changes drawn over it:
   wording that would go is struck through in red, wording that would arrive is
   underlined in green.
3. **Change Index** — one card per proposed change.

Every change has its own **fingerprint** — a label like `#CHG-012` sitting in
the margin of the document, next to the clause it belongs to — and its own
**SHA-256 digest**, a 64-character code that identifies that exact change and
nothing else. You can read a fingerprint out over the phone. It does not change
when the change is accepted, rejected or reopened, so it can still be used to
verify what was agreed months later.

Clicking a fingerprint, a clause, or a card highlights the same clause in **all
three columns at once** and scrolls them into line, so you never have to hold the
old wording in your head while reading the new one.

## What you can do with a change

- **Accept** — that clause's new wording goes into the contract. The audit trail
  records who accepted it, **who proposed it**, and the fingerprint.
- **Reject** — the clause stays exactly as the baseline reads it, and you are
  asked why. Your reason travels back to the other side, and the ask stays
  visible to both of you as a point still open between you. It does not silently
  disappear, because a change that vanishes reads like agreement, and it is not.
- **Discuss** — a short conversation attached to that one change. This is the
  important one: **posting a comment changes nothing.** No new version, no new
  round, no movement in the document. Asking "would you take 45 days?" used to
  mean opening a formal round; now it means typing a sentence.

There are also **Accept All** and **Reject All**, a progress bar, and a status
strip along the bottom showing whether email is set up, whether the other side
has opened the link, which round you are on, and how many changes are resolved.

### One rule worth knowing

**A change nobody has decided is not in the contract.** Silence never adopts
anything. The document is rebuilt from the changes that were actually accepted,
which means rejecting everything gives you back the original wording exactly,
character for character. This is the property that makes it safe to run on a
legal document at all, and it is tested directly
(`f35` — "rejecting everything reproduces the baseline EXACTLY").

**And nobody rules on their own request.** You can discuss your own proposal or
withdraw it by proposing something else, but you cannot mark your own wording
"accepted" and tell the other side it was agreed. This is enforced on the
server-side record, not just hidden in the buttons
(`f37` — "he cannot rule on his own ask even by posting a response directly").

## What the counterparty sees

**The same screen.** Not a simplified version, not a read-only preview — the
identical component, rendered from the same information: same clauses, same
fingerprints, same digests, same statuses.

That claim is tested the only way worth testing it: `f37` renders **both**
screens and compares them element by element. A test that only looked at the
counterparty's page could have passed while the two sides slowly drifted apart.

They still get in by **clicking a link. No account, no password, no login** —
unchanged. Each counterparty has one durable link per contract that always shows
the current state, so round six uses the same URL as round one.

They can accept or reject the changes *you* proposed, and discuss any change.
Their decisions are held on their page until they press send, which is
deliberate: their link is a public URL, and a public URL that changed your
contract on every click would be a bad idea.

When you accept a change, it shows as accepted on their side, with the wording
moved. When you reject one, they see the baseline kept **and your reason**.

## What is deliberately NOT built

**The signing flow.** This was out of scope on purpose, and it stayed out.

When every change on the table has an answer, a green banner appears — *"Ready to
sign — every change is resolved"* — with one button: **"Send to Docs tab for
signature."** That button closes the round, makes the agreed wording the new
baseline, and moves you to the Docs tab, where signing already lives. It signs
nothing, seals nothing and executes nothing.

`scenario3` presses that button and then checks that the contract's status,
signatures, execution record and seal are all still untouched. The hand-off is
reachable and clearly named; the thing it hands off to is the existing signing
flow, unchanged.

**The mobile/WhatsApp counterparty portal** was also out of scope and was not
touched.

## Did anything else break?

No — and here is the evidence rather than the assurance.

The full test suite was run on a **fresh clone**, twice in a row:

| | Result |
|---|---|
| Before this work | **513 tests, all passing** |
| After, run 1 | **625 tests, all passing** |
| After, run 2 | **625 tests, all passing** |

Those 625 are the original 513 plus 112 new ones. **No existing test was changed
to make it pass.** The only edits to existing test files were adding the two new
modules to the setup lists.

Six source files were touched, and the change was almost entirely additive:
**1,693 lines added, 5 removed** — and all 5 removals are the single-line lists
at the bottom of a file that say which functions other files can use.

Which means these files were **not modified at all**: the drafting wizard, the
templates, the custom-template library, the PDF exporter, the Word exporter and
reader, the signature and sealing code, the version-comparison code, and the
discussion module.

Named confirmations, each with its proving test, are in `CHECKLIST.md`:
wizard drafting and all 12 templates, custom templates, Word export, OTP
signing, the seal, the evidence pack, version compare, the Docs tab, and the
append-only audit trail.

**One honest caveat.** PDF export has **no direct automated test** — and it did
not before this work either. That gap is pre-existing and this session did not
close it. What can be shown is that the PDF code was not modified, and that the
new tab's export button is disabled until every change is resolved and otherwise
just calls the existing exporter. `CHECKLIST.md` records that line as
"unmodified and non-interfering", not as "tested", because saying otherwise
would be the one thing worth never doing here.

## Six real bugs were found by building this

Written up in full in `BUGLOG.md`. The one worth repeating:

**Uploaded Word contracts were losing their formatting the first time you
accepted a change.** The intake step was turning a whole Word contract into a
single paragraph with line breaks inside it. It *read* correctly, which is why it
looked fine — but editing one clause of a single giant paragraph rewrites the
whole paragraph. The safety check that exists for exactly this reason caught the
damage and correctly fell back to plain text, so no wording was ever corrupted;
what was lost was the headings and clause numbering, silently, on the first
accepted change. Now each Word paragraph becomes its own block, which is what a
Word paragraph is.

That bug was invisible in a one-round test. It took a six-round negotiation to
surface it, which is the argument for `scenario3` existing at all.

The other five: open points disappearing when a round closed; a permission check
that ignored its own setting; the counterparty's Accept button failing silently
on the no-login page; clause identifiers that broke as HTML identifiers; and a
misleading error on a fresh clone with no dependencies installed. All six fixed.

## Where things live

| File | What it is |
|---|---|
| `js/negotiation.js` | the change model — fingerprints, digests, accept/reject/discuss, the three-route intake normaliser |
| `js/views/negotiation.js` | the three-column screen, rendered for whichever side is looking |
| `js/views/contract.js` | the `Docs` \| `Negotiation` tab row and the owner's side of the shared screen |
| `js/views/portal.js` | the counterparty's side of the same shared screen |
| `js/core.js` | carries the change set to the counterparty; applies their decisions |
| `INVENTORY.md` | what already existed vs. what was built new |
| `CHECKLIST.md` | every capability, with PASS/FAIL and the test that proves it |
| `BUGLOG.md` | the six bugs, the design decisions, and the deviations from the prototype |

---
---

# Session: what a clause is now, and what the fingerprints actually prove
**27 July 2026** · plain English, no code

## The problem in one paragraph

The negotiation screen looked right and was built on sand. Underneath, the
software did not really know what a clause was. It took the contract, threw away
its formatting to get flat text, and then tried to guess where each clause began
by looking for lines that were WRITTEN ALL IN CAPITALS. Run the sample contract
from the design mock-up through it — six clauses — and it came back with
**fourteen**. Every clause heading ("Clause 4 · Payment Terms") had lowercase
letters in it, so it failed the capitals test and got filed as a *term of the
contract* rather than as the label on one. No clause had a title. No clause had
a number. And each one was identified by which line it happened to sit on.

That last point is the dangerous one. If a clause is "the thing on line 12", then
adding a new clause higher up the page moves everything down a line — and every
comment, every proposed change and every audit entry that pointed at line 12 now
quietly points at a *different clause*. Nothing would break. Nothing would show
an error. The record would just start describing the wrong paragraph.

## What a clause is now, and why its identity survives editing

A clause is now read from the document's actual structure: a heading, plus
everything underneath it until the next heading of the same or higher level. No
guessing. A heading is a heading because it *is* a heading, not because it
shouted.

When a contract first enters the system — however it arrived, whether from a
built-in template, a template the customer wrote themselves, or a Word file
somebody uploaded — every clause is stamped with a short, meaningless code like
`cl_8f2k9q`, written invisibly into the document itself. That code is assigned
once and never changes.

**The clause number and title are now treated as decoration.** They are read off
the heading fresh every time the screen is drawn, and they are never used to
identify anything. This is the whole point. A lawyer can renumber a draft from
1, 4, 5, 6, 9, 12 into 1, 2, 3, 4, 5, 6; they can insert three new clauses at the
top; they can retitle a clause — and every change, comment and audit entry stays
attached to exactly the clause it was always about, because none of them were
ever pointing at a number or a position.

One more consequence worth stating: a clause with three paragraphs is now **one
clause** — one badge in the margin, one Accept button, one decision. Previously
it was three separate things to decide, which is not how anyone reads a contract.

## What the fingerprints and the chain actually prove

Each proposed change gets a fingerprint — a `#CHG-012` label and a SHA-256 hash,
which is a long code computed from the change's contents. Change one character of
the wording and the code comes out completely different.

Two things are new here.

**First, the fingerprints are now linked in a chain.** Each one records the
fingerprint of the change filed before it. So they are not a pile of independent
stamps; they are a sequence. Removing a change from the middle, or reordering
them, breaks the links visibly rather than silently.

**Second — and this is the one that matters — the "Verified" badge now actually
verifies something.** In the design mock-up, and in the software until this
session, that badge was simply *printed on every card*, always, regardless of
anything. It checked nothing. It was decoration that read as a guarantee, which
is worse than having no badge at all.

It now does real work: it recalculates every fingerprint in the entire history
from the wording as it is stored right now, and checks each link against the one
before it. If everything matches, it says **Verified**. If someone has altered
stored wording after the fact, it says **Integrity check failed** and *names the
first change that does not match*. Until the check has finished running it says
"Checking…" — it never claims to have verified something it has not yet looked
at.

**What this does and does not prove.** It proves that the wording on the record
today is the wording that was filed, and that the history has not been reordered
or had entries removed. It is a tamper-*evidence* mechanism, not a tamper-*proof*
one: someone with full write access to the database could recompute the whole
chain to match altered text. It is the same kind of assurance a numbered,
initialled page gives on paper — it makes quiet alteration detectable, not
impossible.

One related thing was found and fixed along the way. Web browsers only provide
proper cryptography on secure (`https`) connections. On a plain `http` page —
a hotel wifi login page, an office proxy, which is exactly where a counterparty
is likely to open a link — the software had been quietly falling back to a much
weaker code that merely *looked* the right length, and saying nothing about it.
A "Verified" badge sitting on top of that would have been a straightforwardly
false statement. It now detects this and says the chain cannot be verified here,
and to open the page over `https`.

## How editing a clause creates a tracked change

Previously, "proposing changes" meant opening a pop-up box containing the entire
contract as plain text and editing it there. Formatting, numbering and tables did
not survive the trip.

Now you hover over a clause in the working pane and get three small buttons in
the margin: **Edit**, **Add clause**, **Delete**. Editing a clause edits *that
clause*, in place, keeping its formatting. When you save:

- If you changed nothing, **nothing is recorded**. No empty fingerprint.
- If you changed something, the system compares your version against the wording
  the round started from, works out exactly what moved, and files one tracked
  change against that clause.

The comparison is done **once**, at that moment, and the result is **stored**.
This matters more than it sounds. Previously the marked-up view was recalculated
every time the screen was drawn — and the comparison method was changed once
mid-project, which meant the same change could genuinely look different on
different days. What was reviewed was not provably what was decided on. Now the
mark-up is a picture of the record, not a fresh calculation.

**Deleting a clause does not delete anything.** It strikes the clause through and
proposes the deletion. Every word stays on the page until the other side accepts
it. **Adding a clause** puts it exactly where you asked for it — after the clause
you clicked — rather than tacking it onto the end of the contract, which is what
the old system did because a line number gave it nowhere better to point.

If you edit the same clause twice before the other side has answered, that is
treated as *changing your mind about one ask*, not as two asks. The change keeps
its `#CHG` number and gets a new fingerprint chained onto the old one — so the
previous wording is still recoverable, and a comment written against the earlier
version can be shown as such rather than presented as if it were about today's
words. But once the other side has *decided* something, a new wording is a
**counter-proposal**, and it gets a fresh number in the next round. Folding it
into a change they already agreed to would be rewriting what they agreed to.

## How rounds pass between the two parties

Both sides see the same three-panel screen: the original on the left, the
proposed version with mark-up in the middle, the list of changes on the right.
Not a lesser version for the counterparty — literally the same screen, built from
the same record.

A banner at the top says whose move it is: *"Your turn — 3 changes to review"* or
*"Waiting on Nordfrakt — sent 2h ago"*. When you press **Send**, the turn passes
and a snapshot of the document is filed so the version history stays complete.

Two rules are enforced in the engine itself, not just hidden in the interface:

1. **Silence rejects.** A change nobody has answered is *not* in the contract.
   The working document is rebuilt from the set of changes that were explicitly
   accepted, so rejecting everything reproduces the original exactly. The
   opposite default — a clause drifting into an agreement because nobody looked
   at it — cannot be undone once signed.
2. **Nobody rules on their own proposal.** The side that wrote a change cannot
   accept it. This is checked in the engine, so no future screen can accidentally
   route around it.

Accepting a change now edits the document's real structure directly, by clause
code. It no longer converts the whole contract to plain text and back — which was
the mechanism behind an earlier bug where formatting was lost the first time a
change was accepted on an uploaded contract. That failure mode is not guarded
against; it has been removed, because the step that caused it no longer exists.

## What is deliberately not built

- **Signing and finalising.** Untouched. When everything is agreed the screen
  says "Ready to sign" and hands off to the existing Docs tab. No signing logic
  went anywhere near this work.
- **The mobile / WhatsApp portal.** Untouched, as instructed.
- **Reading Word's own tracked changes** directly from a returned `.docx` file.
  This was listed as an optional stretch. It was not built. Returned files are
  still compared the existing way, which works; this would just be more direct.
- **Editing a clause's heading as a tracked change.** Renumbering and retitling
  are treated as presentation. A clause's *wording* is what is tracked. There is
  no way to edit a heading without it being visible, so nothing changes silently
  — but a proper "the title changed" record is honest future work, and it is
  written up in the technical log rather than left implied.
- **Live updates between the two browsers.** There are no websockets. The page
  loads current state when opened and there is a "refresh" indicator. That was
  the stated scope for this version.

## What the two clean runs actually showed

The full automated test suite was run twice in a row on a completely fresh copy
of the code, with dependencies reinstalled from scratch:

- **Run 1: 701 tests, 701 passed, 0 failed.**
- **Run 2: 701 tests, 701 passed, 0 failed.**

The starting point before this session's work was 664 passing. The number is not
664 + 37, because two existing test files were **rewritten rather than added to**
— and the reason is worth being blunt about. Those files had 664 tests passing
against a clause model that returns fourteen fragments for a six-clause
contract. They passed because their test documents had been written to suit what
the code could handle: one sentence per clause, tidy consecutive numbering,
headings in capitals. The tests were shaped to fit the implementation. The new
test documents are shaped like the real design mock-up instead — mixed-case
headings, gaps in the numbering (1, 4, 5, 6, 9, 12), multi-paragraph clauses,
plus an all-capitals variant and a document with no headings at all.

Separately, because automated tests here run in a simulated browser with no
ability to actually lay a page out, the screen was also rendered in a real
Chromium browser and measured: **21 out of 21 checks passed**. That pass found
one genuine bug the 25 existing simulated tests could not: clicking a change in
the full-screen negotiation view was supposed to highlight the matching clause in
all three panels, and it had never done so. The markup was correct, so the
simulated tests were satisfied; only a browser that actually draws the page shows
that nothing lights up. It is fixed.

**What this does not mean.** It does not mean the system is certainly correct.
Passing tests show that the specific things we thought to check behave as
expected on the documents we thought to try. Real contracts are stranger than
test fixtures — that is precisely the lesson the fourteen-fragment bug taught,
since it lived happily under a full green suite for an entire previous session.
What can be said honestly is narrower and still worth something: the specific
defect has been fixed and is now pinned by tests that would fail if it came back;
the safety rules are enforced in the engine rather than in the interface; and the
badge that says "Verified" is now doing the work it claims to be doing.

---

# Follow-up: three fixes, in plain English
**27 July 2026, later the same day**

## 1. The page was inventing changes nobody had made

**What you saw.** You opened a contract, touched nothing, and the screen showed a
big red line through the end of Clause 10 and a brand-new clause called "BUYER:
SUPPLIER:". Neither was real. Nobody had edited anything.

**Why.** To compare two versions, the software has to rebuild the document from
plain text — and when it does that it has to work out which lines are *headings*.
Its only clue was: **a line written entirely in CAPITAL LETTERS is a heading.**

Your contract has a signature block and schedule titles in capitals on their own
lines:

> BUYER: SUPPLIER:
> SCHEDULE A: MATERIAL SPECIFICATIONS

In the real document those are ordinary lines *inside* Clause 10. The rebuild
turned them into headings, which split Clause 10 in two. So the software compared
a document with 10 clauses against one it had accidentally given 12, and reported
the difference as changes — a deletion where the clause got cut short, and an
insertion where the new "clause" appeared.

**The fix.** The original document already knows its own shape, so the rebuild now
copies that shape instead of guessing at one. A line that was an ordinary
paragraph stays an ordinary paragraph. Only wording that genuinely moved can now
show up as a change.

**What stops it coming back.** A permanent test with a deliberately blunt rule:
*open a contract, change nothing, and nothing may be recorded.* It runs against
the exact document from your screenshot, against all three ways a contract can
arrive, against a document with no headings at all, and against one whose
headings really are in capitals — plus the reverse check, that a real edit is
still caught. That last one matters: the easy way to pass "don't invent changes"
is to stop noticing changes altogether.

## 2. Ask Copilot, in the negotiation screen

There's a new **✦ Ask Copilot** button in the top bar, on both sides. It opens a
panel on the right of the negotiation screen.

**Two things it does, and it tells you which one is running:**

- **Finding things always works.** Type "ninety days" and it lists every clause
  containing it, with the surrounding sentence, and each result is a button that
  jumps you straight there. No setup, no internet connection needed. It also
  searches *proposed* wording — text that only exists as someone's suggestion —
  and labels it as proposed rather than as part of the contract.
- **Answering in sentences needs a key.** This is the same Copilot the rest of
  HaTi uses, so it needs an Anthropic key set in Team & Settings → Copilot
  engine. Without one, the panel says "Search only" and explains why, rather than
  looking broken.

**It reads your contract. It never edits it.** This is enforced, not just
intended. There's a test that makes Copilot reply *"I have updated clause 4 to
Net-60 for you"* and then checks that the contract is completely unchanged — no
wording moved, no change recorded, no version saved. If you want to act on a
suggestion, you click **Edit** on that clause yourself, and it's recorded as a
tracked change in your name like any other.

One design note: the panel had to be built *inside* the negotiation screen.
HaTi's usual Copilot panel lives behind that screen, so opening it from here
would have slid it in underneath the page you were reading. We checked this in a
real browser by clicking the middle of the panel and confirming the panel is what
receives the click.

## 3. Share now shows you what you're sending

**Before:** clicking Share Link went straight to "who do you want to send this
to?" — asking you to send a contract to another company without ever showing you
what had changed since it last went out. Six rounds into a negotiation, nobody
can hold that in their head.

**Now** it's two steps:

1. **What you are sending** — every change on the table, with its reference
   number, which clause it affects, who asked for it, and whether it's been
   accepted, rejected or is still waiting.
2. **Next →** the send form exactly as it was.

The summary is **editable** before you send, because the covering note is yours
to write. But the list it starts from comes straight from the record — either the
sentence the person typed when they proposed the change, or a direct quote of
what moved ("thirty (30)" → "forty-five (45)"). Nothing writes a description of a
legal change on your behalf.

And the summary **travels with the link**. It goes into the email, and onto the
page the counterparty lands on — so if they open the link a week later, they
still see what they were asked to look at instead of an unexplained document.

## Something else found along the way

Checking the above in a real browser turned up a separate bug: after you accepted
or rejected a change, the "Fingerprints: verified" indicator at the bottom got
stuck on "checking…" and never finished. The full-screen negotiation view and the
smaller embedded one each had their own copy of that step, and only one of them
had been updated. They now share a single one, so they can't drift apart again.
That's the third time this session that a difference between those two views has
hidden a bug — each time caught only by looking at a real browser, because the
underlying page was correct and it was the *behaviour* that was missing.

## Where the tests stand

- **741 automated tests, all passing** (701 before this round of work, 664 at the
  start of the session).
- **31 out of 31 browser checks passing**, up from 21 — the new ones cover the
  Copilot panel, the Share summary step, and the verification indicator finishing
  properly.

As before: this means the things we thought to check behave as expected. It
doesn't mean the system is certainly correct — the phantom-changes bug you
reported lived happily under a fully green test suite, because nobody had thought
to test "open a contract and change nothing". That test exists now.

---

# Follow-up 2: your six reports, in plain English
**27 July 2026, evening**

1. **The space bar works now.** The reply box lives inside a card that also
   responds to the keyboard, and the card was grabbing every space before the
   box could use it. The card now only reacts when the card itself is selected.
   A browser test literally types a sentence and checks the spaces arrived.

2. **Edit / Add clause / Delete are always visible** — dark buttons on their own
   line above each clause, nothing hidden behind hovering, nothing cut off at
   the pane edge. (First attempt floated them over the heading and squashed the
   titles onto two lines; the screenshot caught it, they now sit on their own
   row.)

3. **The version boxes at the top of each pane are now dropdowns.** Pick any two
   versions and read them side by side. One honest rule: differences between two
   old versions were never proposed by anyone, so that view is clearly marked
   "Comparing versions", offers no Accept/Reject anywhere — cards, top bar or
   index — and has one obvious button back to the live round.

4. **Ask Copilot is now the real Copilot** — the same panel as everywhere else
   in HaTi, because it *is* the same panel. It was hidden behind the
   full-screen negotiation view; the room now lifts it in front and tells it
   which contract and round you're reading.

5. **Propose edits is gone** from both sides. Editing happens on the clause,
   where you read it.

6. **"Send to the counterparty" actually sends.** It opens the same two-step
   dialog as Share Link — summary first, then email/WhatsApp/link — and warns
   you that sending closes your turn. The turn only changes hands when
   something really went out. Close the dialog and it's still your turn,
   because it is. Before this fix the button flipped the turn and told nobody.

**Where the tests stand:** 770 automated tests passing (741 before this round),
and 41 of 41 real-browser checks — including typing the space bar for real and
clicking into the comparison mode and back out.

---

# Follow-up 3: your five reports, in plain English

## 1. The counterparty's link now IS the negotiation page

Before: the link opened on a card with a squeezed-up preview of the negotiation
behind a button marked "Open the negotiation room". They were sent a lobby, not
a document.

Now the link opens straight onto the same three-pane page you read — measured in
a real browser, their panes are **exactly** the same width as yours (503, 590
and 335 pixels), with the same draggable dividers, the same clause tools, the
same discussion, and the same Accept / Decline on every change. They can propose
their own wording too, because that is the entire point of sending them a link.

**What they deliberately don't get, and why:**

| Withheld | Because |
|---|---|
| Ask Copilot | it reads our whole portfolio and our playbook |
| Save Draft | our draft state means nothing outside our workspace |
| Share Link | a counterparty who can re-share has published our contract |
| Insert clause | our clause library **is** our negotiating position |
| the workspace breadcrumb, template code, folder | our filing, not their contract |
| "Email: Not Configured" | our server's setup |
| "Last seen" | that is us watching *them*; none of their business |

One I nearly got wrong: I first assumed they should also lose "Accept all" /
"Reject all". They keep them. Those buttons act on **our** asks, and "I agree to
all of it" is a real answer — withholding the button withholds nothing but their
time.

## 2. When everything is agreed, the link is the signature

Three panes of a settled change list is a diff of nothing. So the contract
decides which screen the link is, not a button:

- **changes still outstanding** → the negotiation room, as the page
- **everything resolved** → Ready to sign, with "Review what changed" to look back
- **nothing was ever proposed** → Ready to sign, saying exactly that
- **a superseded or already-answered link** → reading only; history is not signable

And it accounts for what happened rather than asking anyone to sign on trust:
*"All 3 changes have been resolved — 2 adopted into the wording, 1 not taken."*

## 3. Copilot can now answer questions about your contracts

You asked it "how many additions have I added?" and it said it had no way to
track edits or versions in HaTi.

**It was not refusing. It was blind.** The tool that fetches a contract handed
it the metadata, the scan findings and the body text — and nothing at all about
changes, rounds, versions or who proposed what. The honest answer to a question
it had no data for is exactly the one it gave.

So the fix was data, not wording. Every contract Copilot fetches now carries the
negotiation with it: which round, whose turn, how many changes are pending,
accepted and rejected, and for each one who asked, what for, what was decided,
by whom, when, and any reason they gave — plus the version history. (Bounded at
60 changes, newest first, and it says when it has trimmed, so a shortened list
can never read as a complete one.)

**Guidance, not legal advice — and now it says so to you.** It will explain what
a contract says, what changed, what is unusual, and it may point out that a
change is one-sided or still unresolved. It will not tell you what the law
requires, what a clause would mean in court, whether to sign, or whether to
accept a particular change. That limit was already in the instructions the model
receives; it is now also in the first line you read when you open the panel.

## 4. "Insert clause from library" moved to the negotiations page

It is in the top bar of the negotiation room, on your side only — the playbook
is our negotiating position, so the counterparty never sees it.

**The important half is not the button, it's where it goes.** Inserting
preferred wording used to append it to the document: the contract simply grew,
with nothing to review and nothing to accept. It now files a tracked change with
a fingerprint, a hash and its place in the chain, exactly like any other ask —
and the document doesn't move until someone accepts it. That also fixed the
playbook review's "apply this wording" button, because the destination changed
rather than each button.

## 5. No more editing on the Docs page

Docs reads, checks and signs. The Edit button is gone, and so is its wiring —
leaving the listener behind is how a removed feature comes back by accident.
Compare, PDF, Share, Import, the scan, the checks and the signing all stay
exactly as they were. The editor code itself is kept, just unreachable from that
page: removing a screen is not the same as deleting code.

The reason is one sentence: **there were two ways to change a contract**, and
only one of them tracked anything. Two ways is how the two drift apart, and it
was the untracked one that couldn't keep a heading.

## Something found along the way

Two different modules were both publishing a function called `clauseById` — one
meaning "find this clause in this document", the other "find this entry in the
clause library". They quietly overwrote each other depending on load order.
Nothing was calling the losing one yet, which is precisely why it would have
been found the hard way. Renamed, and there is now a test that fails if any two
modules ever claim the same name again.

**Where the tests stand:** 825 automated tests passing (770 before this round),
and 52 of 52 real-browser checks — including measuring the counterparty's page
against your own, pane by pane.

---

# Round: the negotiation room — the verbs, the send, and the way out

Written for someone who is not reading the code.

## What you reported, and what was actually wrong

### The two rows of buttons

You were right that it read as a duplicate, and it was worse than one. The two
rows were doing different jobs at different scales, and nothing on the screen
said so. The buttons beside each change answer **that change**. The buttons
along the top answer **the whole deal**.

Among the top ones was **"Accept wording"** — which accepted the entire
document. Press it with changes still on the table and it filed an acceptance
that answered nobody's specific ask. It is gone. **"Approve & sign"** signed
nothing; it opened a panel. It now says **"Ready to sign"**, which is what it
did. And **"Send N decisions"** moved down into the change list, next to the
decisions it sends.

The counterparty's top bar now has two buttons, both about the whole deal:
**Ready to sign** and **Decline**.

### "Send to Young" did nothing — there were four reasons

Any one of them would have been enough. All four were real, and all four are
fixed.

1. **It was the wrong button.** It was the owner's *share* button, shown by
   mistake on their side too. Pressing it tried to create a new share link,
   which a counterparty cannot do for someone else's contract.
2. **The right button couldn't have worked either.** Sending requires their
   name. The name box lived on the page *underneath* the full-screen room —
   unreachable once the room became the page they land on. So every send failed
   its own first check against a box nobody could see. **Their name is now
   asked for in the room**, filled in from whoever you addressed the link to.
3. **The server was rejecting it.** Its list of allowed replies never included
   "decisions". Every batch of per-change answers ever sent came back as an
   error the page never showed.
4. **And it was posting the message in the wrong wrapper**, so even with the
   third fixed the server would not have recognised it. Two faults in one line,
   the second hidden behind the first.

### Half the room's buttons weren't connected to anything

Found while walking the journey, not from your report. Their page was quietly
building **two copies** of the negotiation — the room you see, and a hidden one
behind it. Because both copies use the same names for their parts, every button
in the room was connected to the hidden copy instead. **Accept All**,
**Reject All**, the reply boxes on each change, folding the change list away —
none of them did anything when pressed.

That is now fixed, and the hidden duplicate is no longer part of the page.

### The way out

`← Doc` is a "go back to where you came from" link. For you that's true — the
room sits on top of your workspace. For them there is nothing behind it: the
room **is** the page you sent them. Pressing it left them staring at an empty
screen, and the Escape key did the same thing by accident.

Both are gone on their side. **This reverses something I told you last round**
("leaving the room lands on their page and does not snap shut again"). That was
true when the room was a mode they opened; it stopped being true when the room
became the page. The test that asserted it is rewritten to assert the opposite —
not quietly deleted.

They keep a way back in one case, and it's the right one: if they arrive on a
*signing* link and press "Review what changed", that genuinely is a detour from
a page that still exists.

## Ready to sign

### It is signalled, never guessed

Before, the software counted the outstanding changes and decided for them. Once
the last change was resolved — **even if it was resolved by refusing it** — the
link they'd been negotiating in quietly turned into a request for their
signature. Nobody had said the deal was done; arithmetic said it for them.

The same guess turned a clean first draft sent out for negotiation into a
signing request, so someone invited to negotiate had nowhere to propose
anything.

Now the link says what it is for when you create it. **A negotiation link is the
room, always** — resolved or not — until you issue a signing link. And readiness
is a thing a person does.

### The button is gated, and says why it's shut

Green only when the parties are genuinely aligned: nothing waiting on a
decision, and nothing refused that is still being argued about. Until then it
sits there **visible, plainly not pressable, with a line beside it naming what
is outstanding** — "3 changes still waiting on a decision", or "1 of your asks
refused — withdraw it or keep negotiating". A button that vanishes teaches
nothing.

Measured in a real browser: the label stays fully legible when disabled (not
faded to grey), it keeps the same size when it opens, and the explanation is on
screen rather than hidden in a tooltip.

### One press, one call

Pressing **Ready to sign** sends their decisions **and** their readiness in a
single message. "Did I remember to press Send?" is no longer a way to lose a
round.

### The deadlock, and the call I made about it

This is the judgement call I flagged, and I built it.

If refusing an ask counted as settling it, the button would go green over a live
disagreement. If only acceptance counted, a single refusal would block signing
**forever** and neither side could get out — worse than the bug the gate fixes.

So there is a new small verb: **"Withdraw this ask"**, on a refused change,
available only to whoever made it. It means "you said no, and I'm letting it
go". The refusal stays on the record — nothing is erased — the point simply
stops standing between you. It can be undone.

Without it the gate would have been a trap. With it, either side can always
clear their own half.

## What reaches you when they signal

Three places, as asked:

1. **In the negotiation room**, at the top, with an **Issue a signing link**
   button on it.
2. **On the Docs page**, in the status band above the document where the
   "Changes returned" strip lives, so someone who has stopped opening the room
   still sees it.
3. **On the dashboard**, in the "waiting on you" card, counted and named.

All three say, in those words, **"Nothing is signed yet."** It's recorded in the
audit trail the same way, and you get an email.

**If something is reopened afterwards** — a new ask filed, a change put back to
pending — the signal is marked as no longer describing where the deal stands,
and the "issue a signing link" button withdraws itself. It isn't deleted: they
did say it, and that stays true.

## Signing arrives on a new link

You issue it. The old negotiation link is retired the moment you do — it still
**opens**, because they're entitled to see what they were sent, but it can no
longer be answered, and it tells them a signing link was issued and when.

This rides the mechanism already there for retiring old links, with one honest
addition: previously a link was only retired when the *wording* changed, and at
this exact moment the wording is identical — that's the whole point, you've
agreed on it. So a signing link now retires the negotiation links it replaces,
including the standing "one link for the whole negotiation" kind.

**No signing was built.** The signing link opens the panel that already existed,
exactly as you photographed it, including "Propose edits (redline)".

## Six more things found by walking the journey

None of these were in your report. They were found by walking the whole thing
from step 1, twelve times.

- **Decisions appeared to un-answer themselves the moment they were sent.** The
  room redraws from the copy of the contract it was sent, which was made before
  they answered — so every card snapped back to "waiting for a decision" a
  second after they'd pressed Send. They now stay answered and are marked
  **sent**.
- **Comments typed on a change reached nobody.** They were written onto a
  throwaway copy of the contract and discarded on the next redraw. They now go
  down the same channel the discussion panel uses.
- **Declining asked for a reason it gave them no way to give.** Same trap as the
  name — the box was on the page underneath. It asks in the room now, and
  cancelling sends nothing.
- **Answering never handed the turn back to you.** Your banner went on saying
  "Waiting on Nordfrakt" over a contract Nordfrakt had already replied to.
- **Comparing two versions emptied their whole top bar**, taking the name
  they'd typed with it.
- **Your own "Ready to sign — every change is resolved" banner** appeared when
  one of their asks had been *refused*, claiming "nothing is outstanding
  between the parties". It wasn't.

## Tests

- **New:** `f51` — the full journey in both directions, 83 tests. Owner
  proposes → they land on the room → decide individually and in bulk → the
  gate refuses and explains → they settle → one press sends everything → it
  lands on your record and in all three surfaces → you issue a signing link →
  the old one goes quiet. Then in reverse, and the mirror. Plus refresh
  mid-journey, reopening after sending, a contract with no changes, Decline at
  every stage, a spent link, a failed send, and the single-rejection deadlock.
  It runs the real server for the wire.
- **Rewritten, not worked around:**
  - `f49` — three tests. "Leaving the room lands on their page" became "there is
    no way out, because there is nowhere to go" and "Escape does not empty the
    window under them". "Every change resolved opens the signing view" became
    "a negotiation link stays the room, resolved or not". A test was added for
    old links created before this change, which still open the way they did.
  - `f38` — the counterparty's verbs, now two instead of four, plus their name
    field.
  - `f37` — the "same screen" claim, and the message envelope it had been
    asserting in the broken shape.
  - `f36` — "Ready to sign appears when every change has an answer" became
    "…when every change is **agreed**", with the refusal-and-withdrawal case.
- **Browser measurements:** 69 checks, up from 52. New ones measure that there
  is no exit and no other route off the page, that Escape really doesn't close
  it, that the name field is real and filled in, that the disabled button is
  legible and its explanation is on screen, that it keeps its size and name when
  it opens, and that the send sits inside the change list and not in the top bar.

**Where things stand: 915 automated tests passing** (825 before this round),
**69 of 69 real-browser checks**. Twelve full walks of the journey; the last two
found nothing new.

## Still open

- Signing itself is not built — the signing link opens the panel that already
  existed.
- The mobile/WhatsApp counterparty portal is untouched, as you asked.
- The hidden second copy of the negotiation still exists on their page. It can
  no longer be reached and no longer steals the room's buttons, but it is still
  there, because it is what proves the two sides see the same screen. Removing
  it properly means finding another way to prove that, which is its own job.
- The dashboard's readiness list is tested through the two pieces it is built
  from rather than by starting the whole dashboard, which needs the entire
  application around it.

---

# Round: the stacked banners, the flattened contract, the panel, and the missing seal

## Image 1 — too many notices, and two of them untrue

The room was showing every notice it had, stacked. They aren't separate notices;
they're one question — *where does this stand?* — and it has one answer at a
time. It now shows exactly one, and which one depends on where the deal actually
is: executed, declined, comparing old versions, somebody has signalled,
everything settled, or whose turn it is.

Your screenshot showed something worse than clutter. That contract was
**signed**, and it still said *"Your turn — propose changes or send it back"*
over a banner offering to *"issue a signing link"* for a deal that was already
done. A signed or declined contract now says so, once, and says nothing else.

Also fixed: it read *"Young Mbagaya signalled Young Mbagaya is ready to sign"*.
That was my wording and it was wrong — the person signing and the party they
sign for are usually the same name, and repeating it turns a fact into a
stutter.

## Image 2 — the contract lost its structure

I reproduced this with a real sample PDF rather than guessing, and there were
**two** faults pulling in opposite directions.

When HaTi can't read a PDF's internal structure it falls back to scraping the
raw text out. That fallback was throwing away **every line break** — so the
whole agreement arrived as one continuous string, and the part of the system
that rebuilds a document works by looking at line breaks. It found none, and
made the entire contract into a single paragraph: recitals, clause headings and
the page footers all run together. That is your screenshot exactly, including
`PAGE 1 OF 4` sitting in the middle of a sentence.

The *good* path had the reverse problem. It gave one paragraph per **line of the
page**, so a sentence that wrapped three times became three paragraphs, and
`1. Services` became ordinary body text instead of a heading you can navigate by.

Both are fixed, and the underlying approach changed: **structure is no longer
taken from the line breaks at all.** It's read from what the contract itself
uses to say what its parts are — the numbering, the bullet marks, the
capitalisation. Line breaks are treated as what they are: wherever the page
happened to end.

So now: numbered clauses come back as headings and keep their numbers (the
number is how you cite it), bullets come back as bullets, wrapped sentences
rejoin into one paragraph, and page footers are dropped.

Nothing is invented and nothing is reworded — every word comes out in the same
order, and all that changes is which block it sits in. There's a test that
checks precisely that.

**One bug I found while fixing it:** `under the Companies Act, 2015. RECITALS`
was being read as *clause 2015*, which invented a clause and filed the recitals
underneath it. Clause numbers are capped at three digits now.

**What I can't fully recover:** for contracts already stored through the broken
fallback, the information was destroyed at the door. The rebuild gets the
numbering, the bullets and the paragraphs back; on my test sample it still glues
the document's title to the first sentence. New uploads don't go through that
path any more.

## Image 3 — the discussion panel is gone

Removed from both your Docs page and the counterparty's page, with no
replacement, as you chose.

One thing that nearly went wrong: the "open points" card on their page had a
small reply box on each point, wired up by the same code that ran the panel.
Deleting the panel would have left a **Send button that did nothing** — the
exact fault we've spent this session removing. Those boxes are gone too, and the
card is now for reading.

As flagged before you decided: a comment a counterparty sends still reaches you
as a counted, quoted row on your dashboard, but there's no longer a thread to
read in full or a box to reply in.

## Images 4 & 5 — the printed contract had no seal

The print was building the document from the same code the Docs page uses, and
that code only includes the "Executed & Sealed" block when the contract has a
frozen copy of itself saved at signing. Yours didn't. So it printed the wording,
one orphaned SHA-256 box and an audit trail — no signatures, no seal panel, no
sealed-text fingerprint. The one page that most needs to prove a contract was
signed was the page that didn't.

The print now renders that block itself, so it doesn't depend on the frozen copy
existing. It carries the seal roundel, who signed and how and when, the sealed
text fingerprint and the document seal — laid out to match the Docs page.

Two details worth knowing: the block is styled inline, because the print sheet
doesn't load the app's stylesheet (which is why it would have printed as
unstyled text otherwise); and the fingerprint now appears **once**. It was going
to appear twice, and two copies of one seal on a document about provenance read
like two different seals.

Uploaded and externally-signed contracts get the right version of the block.

## Tests

- **New:** `f52`, 28 tests — one notice at a time (including a signed and a
  declined contract), the document structure rebuild in both directions, nothing
  left pressable after the panel removal, and the printed seal.
- **Rewritten:** `f31`'s page tests now assert the panel is **absent** and record
  what was given up, rather than being deleted quietly. Its server tests stay,
  because that route still carries the per-change threads in the room.
- **Browser:** 72 checks, up from 69 — three new ones measure that exactly one
  notice is raised, that it's laid out as a full-width banner, and that it sits
  above the documents rather than over them.

**Where things stand: 933 automated tests passing, 72 of 72 real-browser
checks.** Both suites run clean twice.

## Still open

- One thing in your screenshot I couldn't chase: the breadcrumb read
  `MK-196 · WH (Draft)` next to a **SIGNED** chip. The chip is correct and comes
  from the contract's status; the "(Draft)" is inside the contract's own name or
  template text. I'd need to see the record to say which.

---

# Round: the Copilot gets markdown, tone and charts

## What I found before building, and what I changed because of it

Step 0 said inspect first. Five of the spec's stack constraints don't describe
this repo, so I followed HaTi's actual conventions — which the spec also asks
for — and recorded the divergences here rather than inventing the missing parts.

| The spec said | What HaTi actually is | What I did |
|---|---|---|
| Supabase | SQLite behind the Express server in `server/server.js`; no Supabase anywhere | Used the existing persistence |
| Cloudflare Worker proxy | The project's own server already proxies AI: `/api/ai/chat`, `/search`, `/graph`, `/ocr`, with budget guards and rate limits | Used it. **No key ever reaches the browser** in server mode — that constraint holds |
| Single-file HTML, ES modules | `index.html` + ~40 window-attached scripts, loaded through one module entry | Followed the repo: two new files, imported in `js/app.js` |
| Flat snake_case records | camelCase (`redlineText`, `lastAction`) | Followed the repo |
| Chart.js from cdnjs | Not present | Added, loaded lazily on first chart |

**There was already an AI assistant.** `js/ai.js` — a slide-in panel with an
unread badge, expand/minimise/clear, persisted history and a context builder.
I **extended it** rather than adding a second floating chat. Two assistants in
one app is the duplication we've spent three rounds removing, and they would
have had two context builders that could disagree.

**`jurisdiction` and `role_profile` do not exist.** "Jurisdiction" appears only
as contract *text* the scanner looks at for a governing-law clause. The
workspace is Kenya-only and money is KES. Step 0 said never invent data, so
`jurisdictionSplit` is **not** built. Its place is taken by `valueStreamSplit`,
which uses the app's own real segmentation. Where the spec says `role_profile`
I used the real `role` (Admin / Legal / Viewer).

I did **not** read the `horizon` repo — it isn't in this session's scope and I
wouldn't pull in another repository without asking. Everything is built from
your spec.

## What was built

**Safe rendering** (`js/aimd.js`). A block-aware markdown renderer — fenced
code, tables, rules, headings, nested lists, quotes, bold/italic/code, links —
where every non-markdown chunk is escaped. Links only survive as links for
`https`, `http`, `mailto`, `#` and `/`; anything else renders as plain text.
Then the tone markers: `{+good}` `{-bad}` `{!watch}` `{~aside}`, applied *after*
escaping so a marker can't carry markup.

This replaced the old `aiFmt`, which is the single point every answer passes
through — so the upgrade reaches the server path, the browser-direct path and
the built-in keyword engine at once.

**In-chat charts** (`js/aichart.js`). The model emits a fenced `hati-chart`
block naming a **kind** and nothing else. The client pulls those blocks out
*before* markdown runs, leaves placeholders, and hydrates each one from live
state. So a chart in an answer is built by the same code, from the same records,
as the dashboard beside it — it cannot drift and cannot be hallucinated.

**Final recipe list:** `statusBreakdown`, `expiryTimeline`, `valueByCounterparty`,
`renewalPipeline`, `valueStreamSplit`, `cycleTime`, `obligationsDue`.

**Final series catalog** (for `custom`), all month-indexed on one x-axis:

- `contracts.signed` — Contracts signed (count)
- `contracts.expiring` — Contracts expiring (count)
- `value.expiring` — Value expiring (KES)
- `renewals.due` — Renewal decisions due (count)
- `obligations.due` — Obligations due (count)
- `counterparty.<slug>` — value expiring for each real counterparty, generated
  from the live portfolio, top 12

A chart mixing KES with counts is refused: two meanings on one axis is a chart
that lies without stating a single false number.

**`quoted`** is the one kind carrying the model's own figures. Bounded to 2–12
plain numbers — a numeric string or an expression is rejected — and the card
says on its face *"as stated in this answer, not read from your records"*,
because a reader can't otherwise tell it from the ones built from the record,
and that difference is what makes the others trustworthy.

**The live snapshot.** Rebuilt on every message, never cached: status counts,
total value, value-stream and counterparty breakdowns, expiries at 30/60/90,
open and overdue obligations, then up to **40** per-contract lines, soonest to
expire first. The cap is stated in the prompt so the model says the list is
partial rather than concluding from it.

**Plain / Legal toggle**, above the input, persisted per user. Plain: everyday
language, short. Legal: clause names, dates and amounts exact, assumptions
stated.

**Ask-AI triggers** in two places: the dashboard's decisions-due card ("what
needs my attention in the next 90 days") and the contract page's action bar
("what should I be watching in *this contract*").

**Sanitizer** for AI output rendered outside the chat — strips `hati-chart`
fences, json fences whose body is a chart spec, and bare spec-shaped JSON.

## Quality gates

- **XSS:** `<script>`, `<img onerror>` and `javascript:`/`data:`/`vbscript:`
  links all render as inert text. Tested.
- **Invalid kind / unknown series:** a plain error card naming the problem,
  never raw JSON. Tested.
- **Chart cleanup:** one registry keyed `aichart-<msg>-<block>`; clearing the
  conversation destroys every instance, and a sweep after each repaint drops
  canvases whose message is gone. Tested.
- **No regressions:** 965 tests passing (933 before), 72/72 Chromium checks.
- **Mobile:** the chart canvas has its own height at ≤640px; the panel is
  unchanged.

## Deviations, and why

1. **Extended the existing Copilot** instead of adding a second panel.
2. **No `jurisdictionSplit`** — the field doesn't exist. `valueStreamSplit`
   instead.
3. **No Supabase, no Cloudflare Worker** — neither exists here; used what does.
4. **Not a single-file app** — the repo isn't one, and the spec also says to
   follow its conventions.
5. **Per-contract analysis (Step 5)** rides the context the panel already builds
   when a contract is open, plus the negotiation block it already carried. I did
   **not** add per-contract chart series: with one contract there is nothing to
   chart that a sentence doesn't say better.
6. **Chart.js is loaded from cdnjs on first use.** A workspace with no outbound
   network gets a plain card saying so, not a broken panel.

## Still open

- The chart pipeline is proven by unit tests, not yet by a browser pass — the
  Chromium harness doesn't boot the Copilot panel. Rendering, recipes, cleanup
  and the error paths are all covered in jsdom; what isn't measured is how a
  chart *looks* at 430px.
- `cycleTime` reads the audit trail, which is the only place stage timing is
  recorded. Contracts whose trail doesn't carry both ends are left out rather
  than guessed at; if none do, the chart says there's no data.

---

# Round: whose marks, whose questions, and room to read

## Image 1 — seals only on contracts HaTi signed

You're right, and I got this wrong when I built the print block last round.

A contract signed on paper or in another system and then filed here **was not
signed by us**. Printing it now gives back what was filed and nothing else — no
seal, no fingerprint, no audit trail, no "Executed outside HaTi" panel. Adding
any of that is HaTi claiming a part in someone else's signing.

There's now a single rule the whole print obeys: *did HaTi take this signature?*
Signed here → the full seal and signatures. Anything else → the document alone.

That covers plain uploads too. An uploaded document nobody signed here used to
print with a HaTi certificate card on top — file name, size, value, fingerprint.
That's our filing information, not part of their agreement. Gone.

## Image 2 — no more suggested questions

The three chips under the greeting are removed. The greeting stays.

The **Ask Copilot** buttons on the dashboard and contract page stay — those are
you choosing to ask, with the question pre-filled from what you're looking at.
But I found I'd left **two** AI buttons on the contract page (an "Ask AI" I added
next to PDF, and the "Ask Copilot" that was already there). One assistant, one
button — merged.

## Images 3 & 5 — one half fixed, one half handed back

**Fixed: the comparison was genuinely broken.** When you compared two versions it
showed *every* clause as Removed and *every* clause as Added — which isn't a
difference, it's a failure to compare. The cause: HaTi matches a clause to its
earlier self by a hidden identity stamped into the document when a negotiation
starts. Versions captured *before* that have no such identity, so nothing
matched, and two nearly-identical documents looked completely rewritten. It now
falls back to matching on the clause heading, then position.

**Not fixed, deliberately: the list itself.** I built your rule — keep the
original and the real updates, drop the bookkeeping — and the tests caught it
deleting real versions. Here's why, plainly:

HaTi takes a snapshot whenever the wording changes, and **labels it with
whatever event triggered it.** When you accept a change, the snapshot that
records the new wording is called *"#CHG-001 accepted — Clause 4"*. When you
edit and then share, the first snapshot after the edit gets called *"Shared for
review"*. So the entries that look like noise are often the actual versions,
just badly named.

Filtering them out throws away real history. The real fix is to change **when
snapshots are taken and what they're named**, which is a change to the version
model rather than a filter on a dropdown — and I didn't want to make that call
on your behalf. Written up in `BUGLOG.md`. Tell me the shape you want and I'll
build it.

## Image 4 — "Add a clause" deleted

I made the case and you didn't buy it, which is fair: it asked you to draft a
clause into two blank boxes with no sight of the document around it. Nobody
drafts that way. Gone, and the test rewritten to assert its absence.

Wording still enters three ways: the template, editing a clause, or a redline
from the other side.

## Image 6 — the header folds away

A collapse button at the right of the top bar. Pressing it folds the row of
actions and the status strip, leaving the contract's name, its status and the
way back — so the document gets the space.

Two details worth knowing:

- **The collapse button isn't inside the part that collapses.** Neither is Ask
  Copilot. A button that hides itself can't be pressed again, and Copilot is the
  one thing you reach for while reading rather than while deciding.
- **It's remembered per user, not per contract.** If you read more than you act,
  it stays folded on every contract you open.

## Tests

979 passing (966 before), 72 of 72 browser checks. New file `f54` covers all
four; `f44` and `f49` rewritten where "Add a clause" was asserted.

## Still open

The version-list naming question above — that's the one thing from these five I
handed back rather than guessed at.

## Follow-up: snapshots are now named

You take a snapshot, you name it, it saves. That's the model now, and it
answers the version-list question I'd handed back.

**What counts as a version:** the ones you name, plus three milestones nobody
should have to remember — the original wording, a negotiation round closing, and
signing. That's it. Accepting a single change, sharing the contract, or handing
the turn over no longer creates something in the list.

**What the list looks like now** on a contract negotiated in the room:

- Original Baseline
- Working Version
- v1 · Round 1 closed

instead of `#CHG-001 accepted — Clause 4`, `Shared for review` and
`Round 1 — sent to Juno Limited`.

**The copies still get taken behind the scenes**, they're just not shown. That
isn't tidiness — two things genuinely need them. The copy taken before your
first edit is **the only record of the original wording**, and reviewing a
returned redline compares against the most recent copy when the response doesn't
carry its own starting point. Deleting those would have lost real things
quietly.

**One bug I hit building it, worth knowing about.** A round closes seconds after
its last change was accepted, so the wording is identical and HaTi refuses a
duplicate — which meant the *invisible* per-change copy stayed and the "Round 1
closed" milestone never appeared. A milestone now takes over the copy that's
already there and renames it. The existing tests caught this on the first
attempt.

**Naming is required.** Cancel or leave it blank and nothing is saved — better
no version than one you can't identify in six weeks, which is what "Manual
snapshot" filed three times over gave you. And a snapshot of wording that hasn't
changed is refused with a reason rather than filed as a duplicate.

**Old versions are untouched.** Anything already stored still appears — changing
how versions are taken shouldn't retire the ones you already have.

**One thing that still doesn't exist:** you can look at and compare old versions,
but you can't roll a contract back to one. I checked the code before saying so.

**990 tests passing, 72 of 72 browser checks.**

---

# Negotiation loop — Wanjiru & Erik

## In one line

Two people can now negotiate a contract inside HaTi across six rounds without
anything falling on the floor. Before this loop, three separate things stopped
them — and one of them was losing a whole round of work in silence.

**Final score: 8 out of 10.** Cycles run: 2 (4/10 → 8/10). I stopped at two
because the session budget ran out, not because it reached 10. What still
blocks a 10 is listed at the bottom, plainly.

## What was wrong, in plain words

**1. The very first send was labelled "sign".** Wanjiru presses Share on a fresh
draft. HaTi decided, on its own and without saying so, that a contract nobody
had discussed must be one that is ready for signature. Erik opened the link and
saw a green tick and the words "Ready to sign". Nothing on his screen offered to
negotiate. The negotiation never started.

**2. Erik could ask for a change, and then had nowhere to send it.** He pressed
the button on a clause, typed what he wanted, saved it. HaTi recorded it
properly — numbered it, fingerprinted it, showed it in the list. And there was
no Send button anywhere on the page. If he closed the tab, the work was gone.
Wanjiru's app never knew he had asked.

**3. When he did get an answer through, it disappeared.** Erik accepted
Wanjiru's counter-wording and withdrew the point she had refused. His screen
said sent. HaTi's server marked it done. Wanjiru's contract showed neither. The
cause was a race in the code: the answers were written into memory and then a
screen refresh loaded the older copy back over them a fraction of a second
before they were saved. Because the server thought the message had been
delivered, it never sent it again. A whole round, gone, with no error anywhere.

## What changed

- **The Share screen asks what the link is for** — Negotiate or Sign — with one
  sentence each saying which screen the other side will land on. The default
  now reads whether the deal is finished, not whether it has started.
- **The counterparty can send the changes they ask for.** The button in the
  change list counts them, names them, and posts them. Wanjiru's copy re-files
  each one itself, so the fingerprint and its place in the chain are minted on
  the record rather than taken on trust from a public page.
- **The button is called "Change", not "Edit"**, and the screen says where to
  press before anything has been proposed.
- **Answers are saved before anything redraws.** That is the fix for the lost
  round.
- **A withdrawal now counts whichever button sends it.** Before, taking a
  refused point off the table only worked if you pressed "Ready to sign"; press
  "Send" instead and it was thrown away.
- **One person, one link.** Sending the next round refreshes the link Erik
  already has instead of quietly minting a second one and leaving the first
  live. The screen says so.
- **One next action, not two.** With changes waiting, the contract page says
  "Nordfrakt AB is waiting on you — 2 changes to decide" instead of offering an
  unrelated step.
- **You can go back to an earlier version.** Restore saves the wording you have
  now as its own version first, so nothing is lost and the history stays honest.
  It refuses while a change is still open, and says why.
- **The version list is no longer empty.** Sending a draft, and handing a turn
  over, now file a version a person can name and come back to.

## What was verified, and how

Everything above was walked in a real browser against a running server, with two
pages open — Wanjiru's workspace and Erik's link — clicking the actual controls.
Not one item was marked fixed on the strength of reading the code.

The full six-round walk now ends with Wanjiru's page showing: *"Ready to sign —
Erik Lindqvist signalled they are ready to sign · 3 changes settled, 2 adopted
into the wording, 1 ask withdrawn. Nothing is signed yet. [Issue a signing
link]"* — and that survives reloading the page.

**990 automated tests, 0 failures.**

## What is still open

- **Signing itself was not driven to a finished, executed contract.** The
  readiness signal, the "Issue a signing link" route and the signing panel are
  all present and correct. The signature pad and the one-time-code step were not
  walked. Round 6 is verified up to the signature and no further. This alone
  keeps the score off 10.
- **The counterparty's signing page still offers five overlapping choices** —
  approve and sign, accept the wording, propose edits, request changes, decline
  — with nothing saying which is which. Negotiation links now open the room
  instead, so it is no longer the first thing anyone meets, but it is still a
  fork with no signpost.
- **Nothing on the owner's screen updates itself.** An answer appears when she
  reloads, or up to 45 seconds later. Correct, but late.
- **Two copies of the negotiation screen exist in the counterparty's page** —
  one hidden behind the other — which duplicates every internal name the visible
  one uses. Not visible to a user today. It cost an hour of this session's
  debugging and it is the kind of thing that causes a silent fault later.
- **The contract still says "Drafting"** all the way through a negotiation.
- **Layout was not checked.** This container has no internet access to the
  stylesheet the app loads from a CDN, so every screen rendered unstyled.
  Wording, controls and behaviour were testable; spacing and tap targets were
  not, and nothing here claims they were.

## Update — round 6 driven to the end

The one thing left open above has been closed. Signing was walked all the way
through in the browser, both sides, to an executed and sealed contract.

**It works.** Wanjiru issues the signing link from the readiness message; Erik
opens it, types his signature, is told plainly that this workspace cannot check
his email address and that the record will say so, and signs; she is told her
signature is all that is left; she signs; the contract is sealed and a copy goes
to both parties.

Getting there found four more faults, all now fixed and re-checked:

1. **Erik signed and the top of his page still said "Ready to sign."** The
   buttons were correctly spent, but the biggest words on the screen went on
   telling him to do what he had just done.
2. **Wanjiru was never told he had signed.** Her page still offered "Send for
   review" — a step the contract had passed three rounds earlier — when the only
   thing left in the whole deal was her signature.
3. **The signed copies were never actually sent, and the reason given was
   nonsense.** The app asked the server to email the executed contract a
   fraction of a second before it had finished saving the fact that it was
   signed. The server, reading the older saved copy, replied *"Contract is not
   executed yet"* — and that sentence was then printed in the signature panel of
   a contract the same panel had just marked *Executed and sealed*, with both
   parties shown as **Failed**. This is the same underlying mistake as the lost
   round, in a different place. Both recipients now show **Sent**.
4. **The final screen did not refresh.** After signing, the page kept saying
   "your signature is the only thing left" on a contract that was already
   sealed, until you reloaded.

**Score after this cycle: 9 out of 10.** Three cycles: 4 → 8 → 9. 990 tests, 0
failures.

**Why not 10.** Four things are still true, and a strict reviewer would mark all
four: the counterparty's signing page still offers five overlapping choices with
no signpost; nothing on the owner's screen updates itself; there are two copies
of the negotiation screen in the counterparty's page sharing the same internal
names; and the contract calls itself "Drafting" through an entire negotiation.
On top of that, **the layout has never been checked** — this machine cannot
download the app's stylesheet, so every screen was tested unstyled. A ten would
mean someone had looked at it properly on a real screen. Nobody has.

## Update — the four open items are now closed

Fair challenge: three of the four things I had been listing as reasons for the
score were things I *chose* not to fix, not things I couldn't. All four are
done, and each was re-checked in a live browser.

**The contract no longer calls itself "Drafting" all the way through.** Sending
it to the other side is what moves it to "In Review" — that is the moment it
stops being a draft. Re-walking this immediately caught something worse hiding
behind it: once the status moved, the page started offering Wanjiru a **Sign**
button on a contract she had sent out ten seconds earlier for the buyer to argue
with. Her page now says *"It is with Nordfrakt AB. Nothing needs you until they
answer"*, and switches to *"Nordfrakt AB is waiting on you"* when they do.

**Erik's signing page now asks one question.** It was five buttons that all
sounded alike. It is now one — **Sign this contract** — with a single line
underneath, *"Not ready to sign?"*, that opens the other four. Each of those is
renamed to describe what he is doing rather than what the software calls it:
*Change the wording yourself*, *Tell them what you want changed*, *Agree to the
wording but don't sign yet*, *Decline this contract* — each with one sentence
saying what happens.

**The duplicate hidden screen is gone.** Erik's page was building the whole
negotiation twice, one copy invisible behind the other, and both copies used the
same internal names for the same parts. This was causing a real fault: when he
pressed Send, the word "Sending…" was being written onto the invisible copy
while the button he was looking at said nothing. There is now one copy. It was
being kept only because a test read it; the test now reads the copy a person can
actually see, which is a better test.

**Her screen keeps up on its own now.** It used to check for news every 45
seconds regardless. It now checks every 12 seconds while she is looking at a
contract that is out with the other side, and immediately when she returns to
the browser tab. Measured: Erik sends a proposed change, and her page updates
itself **17 seconds later without her touching anything**.

**990 tests, 0 failures.** Two tests were rewritten, with the reason written
into them.

## What is left

One thing, and I cannot fix it from here: **nobody has seen any of this on a
properly styled screen.** The app downloads the file that gives it its colours,
spacing and button sizes from the internet, and this machine has no access to
it. Every screen in every cycle came up as plain text. So I can tell you the
steps work — I have driven them end to end, twice over — but not that they
*look* right, are readable, or are usable on a phone. Someone needs to open it
on a normal computer and look.

---

# Round 8 — the conversation on a change, and the signals around it

Five things. One was a real bug that was losing people's words; the rest are the
screen saying out loud what it already knew.

## The bug: replies were disappearing

Erik types an answer under a proposed change. He sees it appear. He presses
Accept on that same change a moment later — and his own words are gone.

**They were never lost.** They were on the server the whole time, and they were
in the discussion panel. But a page that shows you your comment and then takes
it away has told you it was lost, and there is no difference to the person
reading it.

Why it happened: a comment on a change has two places it can live. On our side
it goes onto the contract record itself. On Erik's side it cannot — his page
holds a *copy* of the contract built fresh from the link every time anything on
the screen moves, so anything written onto it is thrown away seconds later. His
replies therefore go to a separate message store, and that store was never being
read back in when the page rebuilt itself.

Three parts to the fix.

**The two stores are read as one thread**, on both sides, with the same piece of
code. A comment written in both places — which is what happens every time *we*
post one — counts once, not twice. They read in the order they were said.

**Erik's page puts them back** every time it rebuilds. Same treatment his
proposed changes already had, for exactly the same reason.

**Our side now fetches them**, on opening the negotiation and again on the same
12-second beat that already watches for his answers. Before, a reply sat on the
server until somebody reloaded the page. The screen only repaints when something
has actually arrived — repainting on every beat would rebuild the room under you
and take the reply box you were typing into with it.

**And found while fixing it:** the reply was posted and the screen repainted at
the same moment, without waiting. So the repaint often read the message store a
fraction of a second before the reply reached it. It now waits.

## Discuss flashes amber when somebody is waiting

"Discuss (2)" reads exactly the same whether the last word was theirs an hour
ago or yours a moment ago. A question addressed to you sat on a card looking
identical to a settled conversation.

The button now pulses amber when **the last word is theirs and it arrived since
you last opened that thread** — both halves, because either one alone is wrong.
"Their word is last" nags for ever once you have read it and chosen not to
reply; "newer than my last look" lights up over your own comment.

Opening the thread stops it. So does answering. Which threads you have read is
kept in your own browser and never travels with the contract: it is a fact about
you, not about the agreement, and the other side can neither see it nor change
it.

## "Send N decisions" pulses until you press it

Decisions you have taken and not sent are the one state on that screen with
nothing to show for themselves — you have answered, they have heard none of it,
and the page looks finished. The button now pulses between the room's two blues
until it is pressed. On both sides. Nothing to switch off afterwards: the button
stops being drawn the moment there is nothing held.

Both flashes stop, and hold a static colour instead, for anyone whose device is
set to reduce motion. Someone who asked for less movement did not ask to be told
less.

## The reply button now says "Save"

It said "Send", a few inches from another button reading "Send 2 decisions" that
does something completely different. Same behaviour, including Enter — only the
word changed, and only on the reply box.

## Accepted / Rejected moved onto the buttons' line — and now names the change

The status was being pushed inside the clause's own heading, so a clause read
"Clause 4 · Payment Terms Accepted" — the status looked like part of the title,
and on a narrow pane it pushed the heading onto two lines. It now sits on the
same row as Change and Delete, immediately before them, where the controls for
that clause already are. On read-only screens, which have no button row, it
stays exactly where it was.

**And it names the change: "#CHG-001 accepted", not a bare "Accepted".** Raised
after the first pass, and right. A clause block is whatever sits between two
headings, and in a real contract that can be a great deal — in the WH document
the heading "AND" swallows the parties, the RECITALS line, three WHEREAS
paragraphs and "NOW, THEREFORE" into a single block. One bare "Accepted" over a
slab like that reads as a verdict on every paragraph beneath it, and the reader
has no way to tell which part of it the word is about.

The wider practice worth recording, because it decided this: in Word, Google
Docs and the serious contract tools, **the marking IS the status in the
document** — accept a change and the mark-up simply disappears, leaving ordinary
text. No permanent "Accepted" sticker is left in the body; the written record
lives in the review panel. Measured against that, this app was saying the same
thing three times: the margin fingerprint turns green with a tick, the change
index says "accepted", and now the document said it too.

Removing it from the document altogether would be the more orthodox answer, and
was offered. It was not taken because the margin fingerprint signals status
largely by colour, and colour alone is a poor signal for a reader who cannot
easily tell green from red. Naming the change keeps a readable label and removes
the ambiguity for the cost of one word.

Still open, and deliberately not touched: the real cause of the oversized block
is that "AND" is read as a clause heading. Fixing that means changing where one
clause ends and the next begins — which is the anchor the fingerprints are
attached to, so it moves hashes. A separate conversation.

## What was deliberately not touched

The comparison engine, the fingerprints and the change model — none of this
changes what is compared or what is signed. Accept All and Reject All are
untouched. The mobile/WhatsApp counterparty portal is untouched; the two changes
inside `js/views/portal.js` are the ones named in the brief — putting replies
back on the rebuilt page, and the pulse on that page's own send button.

**1067 tests, 0 failures.** 25 new ones covering all five, including the two
faults found while fixing the first. Three existing tests were updated to the
new label wording, and two were rewritten off the wall clock — they stamped a
comment with "now" and compared it against a fixed fixture time, so whether they
passed depended on the hour the suite happened to run.

## Still true from earlier rounds

**Nobody has seen any of this on a properly styled screen.** This machine cannot
reach the file that gives the app its colours and spacing, so every screen comes
up as plain text. The behaviour is driven end to end and tested. Whether the
amber flash reads as urgent rather than broken, and whether the blue pulse is
noticeable without being irritating, are judgements that need a person looking at
a real screen.

---

# Round 9 — a decision that has gone is a decision

## The bug: the counterparty's cards would not settle

Erik answers every change, presses "Send 2 decisions" — and Accept and Reject
come straight back onto the cards. Meanwhile Wanjiru's copy of those same
changes settles into its answered state. Two people looking at one negotiation
and reading different screens about the same answers.

The reasoning behind it was sound and the effect was not. Changing your mind
after sending IS a real thing to be able to do, so the verbs were left on a sent
card. But that made the exception the normal state of every card, and left Erik
with no way to tell whether anything had left his browser at all.

**A sent decision now looks like a decision**: the answer, a "sent" mark, and
Discuss. Same as Wanjiru's.

### A second cause, found while fixing the first

The same fault wearing a different coat, and worth reporting because nobody
would have noticed it from the screenshot. Erik's page was re-filing every
decided change as *unsent* on every redraw — including redraws that decided
nothing. So merely opening a Discuss thread on a change he had already answered
brought back "Send 1 decision", removed the "sent" mark and restored Undo. One
click that touched nothing, and the page had forgotten the answer ever left.

A held decision is now one that actually *differs* from what was sent.

### Changing your mind is kept, behind one click

On a sent, answered card there is now a small **"Change decision"** link. Press
it and Accept / Reject come back for that one card. Answering again files a new
decision and it travels exactly as the first did.

Nothing about the change itself moves when you press it — not its status, not
its fingerprint, not what the other side is holding. It only puts the buttons
back on your own screen, and only until you use them. Which cards you have
re-opened is where you are looking, not a fact about the agreement: it never
reaches the record or the link.

## Two buttons renamed

**"Read as agreed" → "Clean Read".** The old label described the *arrangement*
rather than the *view*, on the one screen where what has and has not been agreed
is the entire question. The tooltip no longer implies agreement either: "Read
both documents clean — removed wording out, proposed wording in. Nothing is
accepted."

**"Show the redline" → "Show changes."** Same button, other state. Its tooltip
is now "Put the change marks back", and the banner that appears in clean read
was brought into line with both — it is headed "Clean read" and its way out
reads "Show changes".

## What was deliberately not touched

The comparison engine, the fingerprints and the change model. Accept All and
Reject All are unchanged. The mobile/WhatsApp portal is out of scope; the two
edits inside `js/views/portal.js` are the second cause of the reported bug.

**1079 tests, 0 failures.** 12 new. One existing test — the counterparty
changing their mind after sending — now presses "Change decision" first, which
is the behaviour change itself.

---

# Round 10 — arriving at a negotiation shows what is being negotiated

Reported from a screenshot: the negotiation opened on a **clean document** — no
marks, no changes visible, and a button reading "Show changes" — with no memory
of having asked for that. Two faults behind it.

## Two buttons saying "Show changes"

The grey bar across the top carried its own exit, and the working document pane
carried the toggle. Two buttons a few inches apart, doing exactly the same
thing — and the one further from the document was the more prominent of the two.

The bar's button is gone. The bar itself stays, because the sentence on it is
the whole point of it: *"Nothing has been accepted — 1 change is still open."*
The way out is now the same control that opened the mode, in the place you
pressed to get there.

## Clean Read was outliving the room

This is what the screenshot was actually showing, and it is worth stating
plainly because nothing on screen said it.

Clean Read — and version comparison alongside it — were remembered for as long
as the browser tab was open. Take a clean read, step out to the Docs page, come
back to the negotiation, and it opened clean: every change invisible, on the one
screen you go to in order to look at them.

Nothing was broken, and nothing said so. The screen simply was not the screen
you expected, and the single thing you had come to do was the single thing you
could not see.

**Arriving now always shows the changes.** Every entry starts on the redline,
with every change across every clause marked up and fingerprinted. A version
comparison left open behaves the same way — you arrive at the live round, not at
wherever the last visit was abandoned.

**Repaints deliberately do not reset it.** If you are reading the contract clean
and accept something as you read, you stay in Clean Read. A mode that switched
itself off every time you decided something would fight you the whole way
through.

## The flow, as it now runs

1. Open Negotiation → every change, across every clause, marked up in the
   document with its fingerprint in the margin
2. Click a card in the right-hand panel → both documents jump to that clause and
   highlight it; Accept, Reject and Discuss are on the card *(unchanged)*
3. Click **Clean Read** → the contract as it would read if every change were
   agreed, with the bar saying plainly that none of them has been
4. Click **Show changes** → back to the redline

## What was not touched

The comparison engine, the fingerprints and the change model. Accept All and
Reject All. The mobile/WhatsApp portal.

**1087 tests, 0 failures.** 8 new. Two existing tests asserted the bar's button
existed; both now assert there is exactly one way back, which is the change.
