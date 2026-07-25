# test-fixtures — inputs for the exploratory QA run

Built by the run recorded in `../TESTREPORT.md`. Everything here is synthetic;
no real agreement, company or person is involved. The named Kenyan companies are
used the same way `sample-contracts/` uses them — as recognisable placeholders in
fictitious documents.

Regenerate anything with the scripts in `generators/` (plain Node, no
dependencies except `generators/genscan.js`, which drives the pre-installed
Chromium through Playwright):

```bash
cd generators
node genbatch.js     # batch-01..12.pdf, over25-01..26.pdf, and the awkward filename
node genvaried.js    # varied-01..14.pdf — no shared boilerplate at all
node mkskia.js       # the three gdocs-skia-*.pdf variants
node gencsv.js       # manifest-01..09
node genoffice.js    # contract.docx, contract.doc
node gen2.js         # oversize-5mb.pdf
node genscan.js      # scanned-no-text-layer.pdf  (needs Playwright + Chromium)
```

## Contract documents

| file | what it is | what it is for |
|---|---|---|
| `clean-text-contract.pdf` | ordinary `Tj` text runs | control for the extractor comparisons |
| `gdocs-skia-contract.pdf` | one `Tm` + `Tj` per word, base-14 Helvetica declaring **no** `/Widths`, `Producer: Skia/PDF … Google Docs Renderer` | **F-008 regression fixture** — before the base-14 metrics shipped, the extractor glued words together here; it must now extract identically to the `/Widths` variant |
| `gdocs-skia-widths.pdf` | identical geometry, font **declares** `/Widths` | control: extracts perfectly, isolating the cause to the width fallback |
| `gdocs-skia-glyphs.pdf` | every glyph placed by `TJ` kerning numbers, no space glyph | control: also extracts perfectly |
| `scanned-no-text-layer.pdf` | a rasterised page with paper noise, printed back out as an image-only PDF | the OCR path (F-007) |
| `plain-contract.txt` | the same wording as plain text | the `.txt` import path |
| `contract.docx` | a real OOXML zip (`[Content_Types].xml`, `_rels/.rels`, `word/document.xml`) | byte-sniff refusal of Word files |
| `contract.doc` | a real OLE2 compound-file header (`D0 CF 11 E0 …`) | byte-sniff refusal of legacy Word |
| `zero-byte.pdf` | 0 bytes | **F-006 regression fixture** — must be refused, by the picker and the drop zone alike |
| `corrupt.pdf` | valid `%PDF-1.7` header, 9 KB of random bytes | imports with no readable text, never as an executed contract |
| `oversize-5mb.pdf` | 4.29 MB | the 4 MB refusal |
| `Mwangi's Supply, Naivas — ndogo café Ω.pdf` | spaces, apostrophe, comma, em dash, accented and Greek characters in the name | filename handling (handled correctly) |

Note: Playwright's `setInputFiles` cannot attach the awkward filename by path in
this environment. Read the bytes and pass
`{name, mimeType, buffer}` instead — the product handles the name fine, the
harness does not.

## Batches

| files | what they are |
|---|---|
| `batch-01..10.pdf` | ten genuinely different agreements — different counterparties, subject matter, values, dates and governing law — sharing only the ordinary clause skeleton a house template produces. **F-005 regression fixture.** Before the threshold was tightened, five of these ten were wrongly parked as near-duplicates; all ten must now import cleanly. Re-measure against it after any change to `SIMHASH_RELATED` or the corroboration rule. |
| `batch-11.pdf`, `batch-12.pdf` | spares, for the same-file-twice and already-imported cases |
| `varied-01..14.pdf` | fourteen contracts with **no shared boilerplate** — different clause sets, wording and lengths. Use these when the near-duplicate detector must not fire at all, e.g. the cancel and close-tab tests. |
| `over25-01..26.pdf` | 26 files, for the >25-per-batch cap |

## Manifests

| file | what it exercises |
|---|---|
| `manifest-01-clean.csv` | matches `batch-01..10.pdf` exactly — the happy path |
| `manifest-02-alt-columns.csv` | `Doc / Agreement / Vendor / Kind / Department / Stage / Amount / Ccy / Commencement / Termination / Executed` — handled correctly |
| `manifest-03-uk-dates.csv` | UK dates, an ambiguous date, and a US date — **F-002 regression fixture** |
| `manifest-04-bom-crlf.csv` | UTF-8 BOM plus CRLF line endings — handled correctly |
| `manifest-05-quoted-commas.csv` | quoted fields containing commas, and a doubled quote — handled correctly |
| `manifest-06-ghost-rows.csv` | two rows naming files that were never sent — reconciliation |
| `manifest-07-missing-required.csv` | no `filename` and no `name` column — rejected, and the rejection must stay named on screen (F-004) |
| `manifest-08-kenyan-values.csv` | `KES 2.5m`, `2,500,000/=`, `Kshs. 750,000/-`, `1.2 million` — **F-003 regression fixture** |
| `manifest-09-header-only.csv` | header row only — rejected correctly |

## Verification scripts

`generators/verify*.js` re-run the reproductions from `../TESTREPORT.md` against
a running server. They need the Playwright driver helpers in the same directory
(`drv.js`, `lib.js`, `twshim.js`) and a server on `http://localhost:3100` with a
workspace whose admin is `amina@mwangifoods.co.ke` / `Password123!`.

| script | covers |
|---|---|
| `verify.js`  | F-002, F-003, F-004, F-005, F-006, F-007, F-009 — manifest parsing, dedupe, bad files |
| `verify2.js` | F-018, F-019, F-022 — the share gate, the portal projection, the one-time code |
| `verify3.js` | F-021, F-023 + the whole signing journey and seal verification as a regression |
| `verify4.js` | F-010 — close the tab mid-batch and be told which files never landed |
| `verify5.js` | static mode and the filter-count regression |
| `verifyxss.js` | F-020 — counts payload executions per screen (expects 0) |

`twshim.js` stands in for the Tailwind Play CDN, which this test environment's
egress policy blocks. It is a harness file, not product code.
