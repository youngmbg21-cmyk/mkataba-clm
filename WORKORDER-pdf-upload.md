# BUILD BRIEF — Phase 2 Addendum: PDF & Scanned Document Upload

**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi)
**Branch:** create `feature/pdf-upload` off `main`. Do not commit to `main`.
**Session type:** autonomous overnight
**Estimated scope:** two to three sessions
**Depends on:** the Template Library brief (Phases A–D) being merged and working.
**Do not start this brief** if Phase D's Word-upload route is broken or absent —
verify it passes its end-to-end fixture test first, and stop with a BUGLOG.md
entry if it does not.

---

## 0. Plain-English summary (for Young, not for Claude Code)

Phase D lets customers upload a Word file and get a draft template. This addendum
adds a second door: **PDF files, including scans.**

The trick is that HaTi will not try to untangle the PDF's internals. Instead, each
page is turned into a picture and sent to Claude, which reads the page the way a
human does and returns the same structured field list the Word route already
produces. From that point on, everything is identical: same confirmation screen,
same builder, same library, same publish flow.

Because reading a picture involves more guessing than reading a Word file, this
route has extra safety rails: a scan warning, per-field confidence shown more
prominently, and a hard rule that number-heavy fields (IDs, phone numbers, tax
PINs) from scans are always flagged for human checking.

---

## 1. What already exists — reuse, do not rebuild

The following were built in Phases A–D and MUST be reused as-is:

- The template library, versioning, and permissions.
- The builder and the publish flow.
- The confirmation screen (fields found, confidence flags, fix/add/delete).
- The detection JSON contract (blocks + fields shape) and the field library.
- The upload entry point in Templates → New template → Upload a document.

This addendum changes only two things: the upload screen accepts more file types,
and there is a new extraction path that ends by producing the same JSON the Word
path produces. If you find yourself modifying the confirmation screen, the
builder, or the data model beyond what section 4 lists, stop — you are off-spec.

---

## 2. Guardrails

All guardrails from the Phase A–D brief still apply (no destructive migrations,
no mutation of published versions, server-side access enforcement, EN/SV i18n on
all new strings, document blockers instead of silently working around them).

Additional guardrails for this brief:

1. **No new PDF-parsing dependency stack.** Do not add libraries that attempt to
   reconstruct tables or layout from PDF internals. The extraction strategy is
   vision-based (section 5). A minimal library for page-to-image rendering and
   basic PDF validity checking is fine.
2. **Never auto-publish from this route.** Same as Phase D: every upload ends at
   the confirmation screen, no exceptions, no flags.
3. **Cost awareness.** Vision calls on multi-page documents are the most
   expensive API usage in HaTi. Enforce the page cap (section 4) and never send
   the same page twice for the same upload without an explicit user retry.

---

## 3. Step zero — recon refresh

Before feature code, append a short section to the existing `RECON.md`:

- Confirm how Phase D's extraction output is shaped and where the detection call
  lives, so the new path can produce identical output.
- Confirm where uploaded source files are stored and how they are named.
- Note the current upload screen component and its file-type validation.
- Record the current end-to-end fixture test status (must be green to proceed).

---

## 4. Scope of change

**Upload screen:**
- Accept `.pdf` alongside `.docx`. Validate the real file signature.
- Page cap: reject PDFs over 30 pages with a friendly message ("For long
  documents, split the file or upload the Word version"). Size cap stays as is.
- Remove the "PDF support coming soon" signpost text.

**New columns (additive, nullable) on `templates`:**
- `source_type` — `docx` | `pdf_digital` | `pdf_scanned`
- `page_count` — integer, for PDFs

No other schema changes.

---

## 5. The extraction path

**Step 1 — classify the PDF.** Attempt a plain text extraction. If the document
yields meaningful text on most pages, classify as `pdf_digital`. If pages yield
little or no text, classify as `pdf_scanned`. Record the classification; it
drives the warning states later.

**Step 2 — render pages.** Convert each page to an image at a resolution high
enough that small print is legible but files stay reasonable. Store page images
temporarily; delete them after the template draft is created.

**Step 3 — detection call.** Send the document to the Anthropic API
(model `claude-sonnet-4-6`) using the API's native PDF/document support — attach
the file as a document content block rather than pre-chopping it, unless recon
shows a reason not to. The instruction and required JSON output are IDENTICAL to
Phase D's contract: blocks (heading / field_group / fixed_text / signature_block)
and fields (label, field_key, section, field_type, required, confidence). JSON
only, no prose, no fences.

Additional detection rules for this route, added to the prompt:
- Read in natural human order: left-to-right, top-to-bottom, respecting columns.
- An empty ruled box or line next to a label is a field.
- Handwriting present in a blank on a scan means the blank is still a field;
  ignore the handwritten content itself.
- For scans, transcribe printed labels carefully; if a label is partially
  illegible, keep the field with `confidence: low` and the best-guess label.
- Never invent fields that are not visible on the page.

**Step 4 — confidence downgrade rule (hard-coded, not left to the model):**
after parsing the response, if `source_type` is `pdf_scanned`, downgrade every
field whose type is `national_id`, `kenya_tax_id`, `phone`, `company_reg_number`,
or `number` to at most `confidence: medium`. Digits are where scan errors hide,
and the confirmation screen must draw the eye to them.

**Step 5 — same destination.** The parsed result becomes a draft template version
and opens at the existing confirmation screen. For scanned sources, show a
banner: "This document was a scan. Please check number fields carefully." (EN/SV.)

Failure handling: on an unparseable response, retry once; on second failure save
the template as `draft` with an error note and log the raw responses. Never crash
the upload flow.

---

## 6. Test fixtures

Add to `fixtures/`:

- The Brut Africa form as a **digital PDF** (the original file).
- A **scanned version** of the same form: print-and-scan it or simulate one
  (rasterise the PDF, add slight rotation and noise, re-save as image-only PDF).
- One **mixed document**: digital PDF with underscore blanks and `[INSERT ...]`
  placeholders rather than boxed cells.

End-to-end tests, one per fixture: upload → classify → detect → confirm →
publish → create contract → fill → export. For the scanned fixture, assert that
the ID/phone/PIN fields arrive with confidence no higher than `medium` and that
the scan banner is shown.

The Phase A–D fixture tests must still pass untouched at session end.

---

## 7. Out of scope

- OCR pipelines or any text-layer reconstruction beyond the classify step.
- Handwriting transcription (handwritten content is ignored by design).
- Password-protected or encrypted PDFs — reject with a clear message.
- Documents over 30 pages.
- Any change to the Word route, the builder, the confirmation screen's
  capabilities, or the data model beyond section 4.
- Auto-filling fields from values already visible in the uploaded document.

---

## 8. Required output files

Same four as always, at repo root before session end: updated **`RECON.md`**
(appended section), **`SUMMARY.md`** (plain English first; which fixtures pass;
API cost observed per document — note it so Young can price this), **`BUGLOG.md`**
(blunt), **`LOOP_REPORT.md`** (per-loop log).

---

## 9. Stop conditions

Stop and write up immediately if:
- Any Phase A–D test that was green at session start goes red and cannot be
  fixed within one loop.
- Detection on the digital Brut PDF finds fewer than 20 of its ~27 blanks after
  prompt iteration — that signals a structural problem worth a human decision,
  not more overnight thrashing.
- The API returns unparseable output on more than half of attempts.
- Two consecutive loops make no measurable progress on the same task.
