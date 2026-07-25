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
| `gdocs-skia-contract.pdf` | one `Tm` + `Tj` per word, base-14 Helvetica declaring **no** `/Widths`, `Producer: Skia/PDF … Google Docs Renderer` | **reproduces F-008** — the extractor glues words together |
| `gdocs-skia-widths.pdf` | identical geometry, font **declares** `/Widths` | control: extracts perfectly, isolating the cause to the width fallback |
| `gdocs-skia-glyphs.pdf` | every glyph placed by `TJ` kerning numbers, no space glyph | control: also extracts perfectly |
| `scanned-no-text-layer.pdf` | a rasterised page with paper noise, printed back out as an image-only PDF | the OCR path (F-007) |
| `plain-contract.txt` | the same wording as plain text | the `.txt` import path |
| `contract.docx` | a real OOXML zip (`[Content_Types].xml`, `_rels/.rels`, `word/document.xml`) | byte-sniff refusal of Word files |
| `contract.doc` | a real OLE2 compound-file header (`D0 CF 11 E0 …`) | byte-sniff refusal of legacy Word |
| `zero-byte.pdf` | 0 bytes | **reproduces F-006** |
| `corrupt.pdf` | valid `%PDF-1.7` header, 9 KB of random bytes | **reproduces F-006** |
| `oversize-5mb.pdf` | 4.29 MB | the 4 MB refusal |
| `Mwangi's Supply, Naivas — ndogo café Ω.pdf` | spaces, apostrophe, comma, em dash, accented and Greek characters in the name | filename handling (handled correctly) |

Note: Playwright's `setInputFiles` cannot attach the awkward filename by path in
this environment. Read the bytes and pass
`{name, mimeType, buffer}` instead — the product handles the name fine, the
harness does not.

## Batches

| files | what they are |
|---|---|
| `batch-01..10.pdf` | ten genuinely different agreements — different counterparties, subject matter, values, dates and governing law — sharing only the ordinary clause skeleton a house template produces. **This is the fixture set F-005 fails on:** five of the ten are wrongly parked as near-duplicates. Re-measure against it after changing `SIMHASH_RELATED`. |
| `batch-11.pdf`, `batch-12.pdf` | spares, for the same-file-twice and already-imported cases |
| `varied-01..14.pdf` | fourteen contracts with **no shared boilerplate** — different clause sets, wording and lengths. Use these when the near-duplicate detector must not fire at all, e.g. the cancel and close-tab tests. |
| `over25-01..26.pdf` | 26 files, for the >25-per-batch cap |

## Manifests

| file | what it exercises |
|---|---|
| `manifest-01-clean.csv` | matches `batch-01..10.pdf` exactly — the happy path |
| `manifest-02-alt-columns.csv` | `Doc / Agreement / Vendor / Kind / Department / Stage / Amount / Ccy / Commencement / Termination / Executed` — handled correctly |
| `manifest-03-uk-dates.csv` | UK dates, an ambiguous date, and a US date — **reproduces F-002** |
| `manifest-04-bom-crlf.csv` | UTF-8 BOM plus CRLF line endings — handled correctly |
| `manifest-05-quoted-commas.csv` | quoted fields containing commas, and a doubled quote — handled correctly |
| `manifest-06-ghost-rows.csv` | two rows naming files that were never sent — reconciliation |
| `manifest-07-missing-required.csv` | no `filename` and no `name` column — rejected correctly, but see F-004 |
| `manifest-08-kenyan-values.csv` | `KES 2.5m`, `2,500,000/=`, `Kshs. 750,000/-`, `1.2 million` — **reproduces F-003** |
| `manifest-09-header-only.csv` | header row only — rejected correctly |
