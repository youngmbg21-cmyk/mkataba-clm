# DESIGN — OCR: reading scanned paper

Written before the code, per the build brief. Records the approach taken and
every deviation from the brief's recommended architecture.

---

## The problem

`extractDocText()` returns text only for true digital PDFs and plain-text files.
A scanned contract or a phone photo yields nothing: the migration flags it
`blocked: 'no-text'`, the register row is empty, and the customer types the whole
thing by hand. The target customer is a Nairobi business with drawers of scanned
paper — the product currently hands their problem straight back to them.

This is the highest-value change in the run. Everything below is in service of
one outcome: **a drawer of scans becomes a searchable, remindable register,
without anyone pretending the machine read it perfectly.**

---

## Architecture

The brief's recommended architecture is followed. Deviations are called out
under "Deviations" at the end.

### 1. Detect the need

```
extractDocText(dataUrl, mime)                       →  digital text or ''
  ├─ PDF with ≥ OCR_TEXT_FLOOR (200) chars          →  textSource 'pdf-text', done
  ├─ PDF with < 200 chars                           →  image-only, needs OCR
  └─ .png / .jpg / .jpeg                            →  straight to OCR
```

`OCR_TEXT_FLOOR = 200` characters. Below that a PDF is treated as image-only.
Real digital contracts run to tens of thousands of characters, so the floor is
comfortably clear of the boundary; a PDF that genuinely contains 150 characters
of text loses nothing by also being OCR'd.

### 2. Rasterize

`pdf.js` is loaded from CDN **as an ES module**, lazily and once, the first time
a document actually needs OCR — so a workspace that never OCRs anything pays
nothing, and static mode still boots with no network. Each page renders to a
`<canvas>` at ~200 DPI (`scale = 200/72 ≈ 2.78`, capped so a very large page
cannot blow up memory) and is exported as JPEG at quality 0.72, which keeps a
page image around 150–250 KB — small enough to send several without a timeout,
detailed enough for clause-level transcription.

Images (`.png`/`.jpg`) skip this step entirely and are sent as-is (downscaled
only if they exceed the long-edge cap).

`pdf.js` also gives us an honest **page count** before any AI call, which is what
makes the pre-flight estimate and `ocrMaxPages` meaningful.

### 3. Recognise — two tiers

**Primary — `POST /api/ai/ocr` (server mode, AI key configured).** Sends one page
image per call through the existing Anthropic proxy using vision, and returns
transcribed text. The prompt requires the model to:

- transcribe faithfully, preserving clause numbering and layout;
- never summarise, never paraphrase, never "clean up";
- never fill in a word it cannot read — mark it `[illegible]`;
- return the transcription through a tool call, so we get a structured result
  rather than a chatty preamble.

One page per HTTP call rather than a batch, for three reasons: the progress
strip can move per page, the batch stays cancellable mid-document, and a 4 MB
upload limit does not have to hold thirty page images at once. The **request
counter** still books one request per *document* (`first: true` on page 1) —
pages count toward spend and toward `ocrMaxPages`, which is the honest measure.

**Fallback — Tesseract.js (no key, or static mode).** Loaded from CDN on demand,
English, in-browser. Slower and materially less accurate. The UI labels it as the
fallback wherever its output is used, and the resulting `textSource` is
`ocr-local` so the provenance is never ambiguous.

Order of preference per document:

```
server mode + AI key  →  ocr-ai      (falls back to ocr-local on a hard failure)
static mode / no key  →  ocr-local
tesseract unavailable →  none        (and only THEN blocked: 'no-text')
```

### 4. Limits and cost

| Control | Default | Where |
|---|---|---|
| `ocrMaxPages` | 30 | admin-editable, env `OCR_MAX_PAGES` |
| `aiRateOcr` | 400 page-requests / 15 min / user | admin-editable, env `AI_RATE_OCR` |
| onboarding allowance | opened per migration | drawn when OCR runs inside a batch |
| daily spend ceiling | `aiDailySpendLimit` | drawn otherwise |

A document longer than `ocrMaxPages` is **not** refused. The first N pages are
OCR'd, the result is saved, and the user is told exactly which pages were
skipped (`upload.ocrSkippedPages`), on the contract, in the audit trail and in
the document viewer. Refusing a 60-page scan because the cap is 30 would hand
the customer's problem back to them again.

### 5. Progress

`UPLOAD_STEPS` gains a page counter — the "Extracting details" step reads
"Reading page 4 of 12" while OCR runs. The migration queue row shows the same
through a new `ocr` row status with a live note, and the batch remains
cancellable mid-document: the page loop checks `migState().running` between
pages and stops cleanly, saving whatever pages it already has.

---

## Honesty rules

These matter as much as the feature. A machine-read scan that *looks* like a
confirmed record is worse than no record at all, because the renewal reminders
depend on the dates.

| Rule | How it is enforced |
|---|---|
| Provenance is recorded | `upload.textSource ∈ {pdf-text, ocr-ai, ocr-local, none}`, plus `upload.ocrPages` and `upload.ocrSkippedPages` |
| OCR'd metadata never reaches `high` confidence | `capConfidenceForOcr()` downgrades every `high` to `medium` on the extraction result before the review panel sees it. Only a human confirming a field promotes it to `high`. |
| The audit trail says so | The import/upload audit entry names the OCR tier and page count |
| The document viewer says so | A banner above machine-read text: text was read from a scan and may contain errors |
| Clause review still quotes verbatim | The AI review runs on the OCR'd text unchanged, and carries a visible warning that its quotes come from a scan |
| `blocked: 'no-text'` is a last resort | It may only be set *after* OCR has been attempted and failed |

The confidence cap is the load-bearing one. OCR misreads dates and amounts —
`3` for `8`, `2026` for `2028` — and those are exactly the fields the 90/60/30
day renewal reminders fire on.

---

## Deviations from the brief

1. **One page per `/api/ai/ocr` call, not a batch.** The brief says the endpoint
   "accepts page images" (plural). The endpoint does accept an array, but the
   client sends one page per call so progress can move per page and the batch
   stays cancellable mid-document. The request *counter* still books one request
   per document, which is what the brief actually asked for.

2. **`pdf.js` and Tesseract.js are loaded lazily, on first use**, rather than at
   page load. Both are large; a workspace with only digital PDFs should not pay
   for them, and static mode must still boot offline.

3. **The CSP is widened, deliberately and narrowly.** `script-src` and
   `connect-src` gain the two CDN origins (`cdnjs.cloudflare.com` for pdf.js,
   `cdn.jsdelivr.net` for Tesseract), `worker-src blob:` is added for their web
   workers, and `img-src`/`connect-src` already allow the `blob:`/`data:` URLs
   the rasterizer produces. Loosening two named origins is the smallest change
   that makes client-side rasterization possible without a build step.

4. **The AI OCR tier falls back to the local tier on a hard failure**, not just
   when no key is configured. If `/api/ai/ocr` fails mid-document (budget
   exhausted, provider error), the remaining pages are read by Tesseract rather
   than abandoned, and `textSource` records `ocr-local` for the document. A
   partly-read contract is worth more than none, provided the provenance is
   honest — which it is.

---

## What this does not do

- **No server-side rasterization.** Everything renders in the browser. A server
  path would need a native PDF renderer, which the "no build step, zero native
  dependencies" constraint rules out.
- **No handwriting.** Both tiers are for printed and typed paper. A handwritten
  amendment will produce `[illegible]` runs, which is the correct answer.
- **No layout reconstruction beyond what the prompt preserves.** Tables come back
  as text with their alignment approximated, not as structured data.

---

## Addendum — self-hosting the two libraries

Both CDN URLs (and Tesseract's worker / wasm-core / language-data paths) can be
overridden with globals set before `js/app.js` loads:

```html
<script>
  window.HATI_OCR_PDFJS        = '/vendor/pdf.min.mjs';
  window.HATI_OCR_PDFJS_WORKER = '/vendor/pdf.worker.min.mjs';
  window.HATI_OCR_TESSERACT    = '/vendor/tesseract.min.js';
  window.HATI_OCR_TESSERACT_OPTS = { workerPath:'/vendor/worker.min.js', corePath:'/vendor/', langPath:'/vendor/' };
</script>
```

Left unset, the pinned CDN URLs are used, which is the default the brief calls
for. The hook exists because a deployment behind a strict egress policy — which
is a realistic posture for a customer handling contracts — otherwise cannot use
OCR at all, and because it is how the end-to-end test in this run drove the real
pipeline (the CDNs are blocked in the build environment).
