# BUILD BRIEF — Phase 2 Addendum: PDF & Scanned Document Upload

**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi)
**Branch:** create `feature/pdf-upload` off `main`. Do not commit to `main`.
**Session type:** autonomous overnight
**Estimated scope:** two to three sessions
**Depends on:** the Template Library brief (Phases A–D) being merged and working.
**Do not start this brief** if Phase D's Word-upload route is broken or absent —
verify it passes its end-to-end fixture test first, and stop with a BUGLOG.md
entry if it does not.

> **Revision note (review pass, before any code was written).** This brief was
> checked against the repository as it actually stands. Sections 1, 2, 4, 5 and 6
> carry corrections, marked **[Corrected]**. The substance of the brief is
> unchanged: PDFs enter by the same door as Word files and end at the same
> confirmation screen. What changed is that several instructions described a
> codebase different from this one. The corrections are:
>
> 1. An OCR/scan-reading module already exists (`js/ocr.js`) — reuse it, do not
>    build a second one (§1).
> 2. Native PDF support makes the page-rasterising step unnecessary in the normal
>    case (§5).
> 3. The EN/SV bilingual requirement does not apply to this product (§2).
> 4. The detection call returns JSON through a forced tool call, not raw text, so
>    "JSON only, no fences" is the wrong instruction here (§5).
> 5. The exact upload-screen strings and fixture files named in §4 and §6 differ
>    from what is on disk (§4, §6).
>
> The branch name above (`feature/pdf-upload`) is unchanged and still governs the
> build session. Confirm it at the start of that session, since an automated
> session may be handed a different branch by its harness — if so, the branch it
> was given wins, and the mismatch belongs in `SUMMARY.md`.
>
> No feature code was written during this review pass.

---

## 0. Plain-English summary (for Young, not for Claude Code)

Phase D lets customers upload a Word file and get a draft template. This addendum
adds a second door: **PDF files, including scans.**

The trick is that HaTi will not try to untangle the PDF's internals. Instead, the
file is handed to Claude, which looks at the pages the way a human does and returns
the same structured field list the Word route already produces. From that point on,
everything is identical: same confirmation screen, same builder, same library, same
publish flow.

*(Revised: this originally said HaTi would turn each page into a picture itself.
It turns out Claude accepts a PDF directly and does that step on its side, so HaTi
doesn't need to make, store, and tidy up picture files. Same result, less that can
go wrong. §5 keeps the do-it-ourselves version as a backup in case the direct route
reads scans poorly.)*

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

**[Corrected] There is already a scan-reading module — reuse it.** An earlier
phase built `js/ocr.js` (design note: `DESIGN-ocr.md`) to bring scanned paper into
the contract register. It already does several things this brief asks for, and its
existing functions are the intended building blocks:

| Existing function | What §5 asks for |
| --- | --- |
| `ocrNeeded()` | Step 1, digital-vs-scanned classification (uses an existing 200-character text floor) |
| `ocrPdfPageCount()` | The page count and the 30-page cap in §4 |
| `ocrRenderPage()` | Step 2 rasterising, if the fallback in §5 is ever needed |
| `capConfidenceForOcr()` | Step 4's confidence downgrade |

Do not write a second classifier, page counter, or rasteriser. If one of these
needs a small change to serve both callers, change it in place and keep the
register's behaviour identical.

**One architectural decision the brief left open, which must be settled in recon
(§3) before code:** `js/ocr.js` runs **in the browser** (it uses pdf.js and a
canvas), whereas the template converter runs **on the server** — the server today
has no PDF-reading ability at all. Classification and page counting must therefore
either run in the browser before upload (reusing the module above) or be added to
the server. **Recommended: do them in the browser and send the result with the
file.** That reuses working code, adds no server dependency, and lets an oversized
PDF be refused before it is uploaded. **The server must not trust those values.**
It independently re-checks the file signature, the size cap, and encryption, and it
must enforce the page cap itself — a browser-supplied page count is a hint, not a
control, and the cap exists to bound API cost (guardrail 3). Counting pages
server-side does not need a PDF library: the page count can be read from the PDF's
own page tree.

---

## 2. Guardrails

All guardrails from the Phase A–D brief still apply (no destructive migrations,
no mutation of published versions, server-side access enforcement, document
blockers instead of silently working around them).

**[Corrected] The EN/SV bilingual requirement is struck.** It was inherited from a
brief template written for a different product. HaTi has no translation layer of
any kind and is built for the Kenyan market (KRA PINs, Kenyan national IDs).
Building one to satisfy this line would be a large detour for no user. **New
user-facing text in this brief is English only**, matching every other string in
the app. If a Swedish or multilingual market is ever added, that is its own piece
of work covering the whole product, not a clause in a PDF-upload brief.

Additional guardrails for this brief:

1. **No new PDF-parsing dependency stack.** Do not add libraries that attempt to
   reconstruct tables or layout from PDF internals. The extraction strategy is
   vision-based (section 5). A minimal library for page-to-image rendering and
   basic PDF validity checking is fine. **[Corrected]** Note this guardrail says
   *do not build a new one* — it does not forbid using the OCR module that already
   exists (§1). Reusing `js/ocr.js` is the intended path, not a violation.
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

**[Corrected] Add these four, which the review pass identified as decisions the
brief left open. Settle them in `RECON.md` before writing feature code:**

- **Where classification and page counting will run** — browser or server (see the
  architectural note in §1). Write down the choice and the reason.
- **What `js/ocr.js` can be reused as-is** and what, if anything, needs adapting.
  Confirm that any change keeps the contract register working exactly as before.
- **Whether native PDF support handles the scanned fixture well enough** (see §5,
  Step 3). This decides whether the Step 2 rasterising fallback is needed at all.
  Test before building it.
- **Whether an Anthropic API key is configured in this environment.** The
  converter refuses without one, so the end-to-end tests cannot pass without it.
  If there is no key, stop and record it in `BUGLOG.md` rather than writing tests
  that cannot run.

---

## 4. Scope of change

**Upload screen:**
- Accept `.pdf` alongside `.docx`. Validate the real file signature.
- Page cap: reject PDFs over 30 pages with a friendly message ("For long
  documents, split the file or upload the Word version"). Size cap stays as is.
- Remove the "PDF support coming soon" signpost text.

**[Corrected] There is no string reading "PDF support coming soon."** Do not hunt
for it. What actually exists, and must be updated, is these four places:

| Where | What it says or does now |
| --- | --- |
| `js/views/templatelib.js` (~line 132) | Body text: "Upload your standard contract as a Word (.docx) file." |
| `js/views/templatelib.js` (~line 136) | File picker: `accept=".docx"` |
| `js/views/templatelib.js` (~line 147) | Client-side check rejecting anything not ending `.docx` |
| `server/server.js` (~line 5374) | Server refusal: "…the converter reads .docx only (PDF arrives in a later phase)" |

Keep both the client-side and server-side checks — the client check gives a fast,
friendly message; the server check is the one that actually enforces. The server
validates the real file signature (`%PDF-` for PDFs, as it already does the zip
signature for Word files), never the file extension.

**Size cap:** unchanged at 8 MB decoded, which is comfortably inside the API's
32 MB request limit. Do not raise it.

**Encrypted PDFs** (§7 requires rejecting these) need an explicit check with a
clear message — an encrypted file passes the `%PDF-` signature test and would
otherwise fail confusingly later.

**New columns (additive, nullable) on `templates`:**
- `source_type` — `docx` | `pdf_digital` | `pdf_scanned`
- `page_count` — integer, for PDFs

No other schema changes. **[Corrected]** Existing rows keep `source_type` as NULL;
do not backfill them to `docx` and do not make the column NOT NULL. Treat NULL and
`docx` identically at read time (neither shows the scan banner).

---

## 5. The extraction path

**Step 1 — classify the PDF.** Attempt a plain text extraction. If the document
yields meaningful text on most pages, classify as `pdf_digital`. If pages yield
little or no text, classify as `pdf_scanned`. Record the classification; it
drives the warning states later.

**Step 2 — render pages. [Corrected: this is now a fallback, not a required
step.]** As originally written, Steps 2 and 3 contradicted each other: Step 2 said
to turn every page into an image, and Step 3 said to send the whole file to the
API and *not* pre-chop it. Step 3 is the right approach and makes Step 2
unnecessary in the normal case — the API renders the pages itself, so there are no
temporary images to create, store, or remember to delete. That is cheaper, simpler,
and removes a whole class of cleanup bug.

**So: do not build Step 2 first.** Build Step 3, test it against all three
fixtures, and only fall back to local rasterising (reusing `ocrRenderPage()` from
§1) if the scanned fixture measurably fails to meet §9's detection bar. If you do
need the fallback, the original instruction stands: render at a resolution where
small print is legible, and delete the images once the draft exists.

**Step 3 — detection call.** Send the document to the Anthropic API
(model `claude-sonnet-4-6` — the same model the Word route already uses) using the
API's native PDF/document support: attach the file as a document content block
rather than pre-chopping it. **[Corrected]** Verified against the current API: this
needs no beta header, and the limits are 32 MB per request and 600 pages — both far
beyond this brief's 8 MB and 30-page caps, so the caps are ours for cost control,
not API constraints. The document block goes in the user message before the text
instruction, and the existing `anthropicMessages()` helper passes this through
unchanged, so no plumbing change is needed:

```
messages: [{ role: 'user', content: [
  { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: <base64, no newlines> } },
  { type: 'text', text: <the instruction> },
]}]
```

The required output is IDENTICAL to Phase D's contract: blocks (heading /
field_group / fixed_text / signature_block) and fields (label, field_key, section,
field_type, required, confidence).

**[Corrected] Ignore "JSON only, no prose, no fences."** That describes parsing
raw text, which is not how this codebase works. Phase D forces a **tool call**
(`TPL_CONVERT_TOOL` with `tool_choice`), so the response is already structured and
fenced/prose output is impossible by construction. Reuse that exact tool
definition, the same `tplConvertClean()` sanitiser, and the same forced
`tool_choice`. Reusing the sanitiser is what guarantees the promise in §1 that the
two routes produce identical output.

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
banner: "This document was a scan. Please check number fields carefully."
**[Corrected]** English only — see §2. The banner is driven by `source_type ==
'pdf_scanned'`; NULL and `docx` show nothing.

Failure handling: on an unparseable response, retry once; on second failure save
the template as `draft` with an error note and log the raw responses. Never crash
the upload flow.

**[Corrected] Match Phase D's existing failure handling, and add the retry to
both routes or neither.** The Word route already saves a draft with an
`error_note`, stores the original file *before* calling the model so nothing is
lost, and never crashes — reuse that, do not reinvent it. Two clarifications:

- Phase D does **not** currently retry. Adding a retry only to the PDF route makes
  the two paths behave differently on failure for no principled reason. Either add
  the single retry to the shared failure path so both routes get it, or leave both
  without one and say so in `SUMMARY.md`. Do not silently diverge.
- **Retry only on an unusable or unparseable response.** Do not retry a refusal, an
  authentication failure, or a rate-limit error — retrying those burns money and
  cannot succeed. This matters more here than on the Word route, because a
  30-page PDF is the most expensive call in the product (guardrail 3).

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

**[Corrected] "the original file" does not exist as a PDF.** `fixtures/` holds the
Brut form as `brut-account-opening.docx` only — there is no PDF anywhere in the
repo. All three fixtures must be generated. There is already a generator directory
(`fixtures/generators/`, containing `genbrut.js`); add the PDF generators there
alongside it, so the fixtures can be rebuilt rather than being opaque binaries
checked into the repository.

**[Corrected] One existing test will need updating, and that is expected.**
`test/f105-upload-convert.test.js` currently uploads a PDF specifically to assert
that it is **rejected**. That assertion becomes wrong the moment this brief's first
change lands. Update it to assert the new behaviour — a well-formed PDF is
accepted, and a genuinely unsupported file type is still refused. This is the one
sanctioned edit to a Phase A–D test; every other one must pass untouched. Note it
in `SUMMARY.md`.

**[Corrected] These tests call a paid API, so state their cost and requirements
plainly.** Each end-to-end run sends a real document to the model. Before writing
them, decide and record in `RECON.md` whether they run against the live API or a
recorded response, and make sure they fail with a clear "no API key configured"
message rather than an obscure one. §8 asks for the observed cost per document —
capture it from these runs, and note the scanned 30-page case separately, since
that is the worst case Young will be pricing against.

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

**[Corrected] Record which tests were green at session start, before touching
anything.** The first stop condition below compares against that baseline, so
without it the condition cannot be evaluated.

**Run `npm install` before running any test.** In a fresh container `node_modules`
is empty, and `server/server.js` fails on its first `require` — which surfaces as
the whole suite hanging and then reporting every test as "cancelled by parent",
with the real cause buried in a stack trace. It looks exactly like a broken test
suite and is not one. This was confirmed during the review pass: with dependencies
installed, `test/f105-upload-convert.test.js` — the very test §0 names as this
brief's precondition — **passes 7 of 7**. So the precondition is met and this brief
may proceed.

Baseline measured during the review pass, for comparison at session start:

| Test | Result |
| --- | --- |
| `f101-template-library` · `f102-save-as-template` · `f103-template-library-ui` · `f104-contract-from-template` | 23 of 23 pass |
| `f105-upload-convert` (this brief's precondition) | 7 of 7 pass |

Re-confirm this at session start and record it in `RECON.md`. If any of these are
red before you have changed anything, the cause is the environment, not the brief —
check `npm install` first.

Stop and write up immediately if:
- Any Phase A–D test that was green at session start goes red and cannot be
  fixed within one loop.
- Detection on the digital Brut PDF finds fewer than 20 of its ~27 blanks after
  prompt iteration — that signals a structural problem worth a human decision,
  not more overnight thrashing.
- The API returns unparseable output on more than half of attempts.
- Two consecutive loops make no measurable progress on the same task.
