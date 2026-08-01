# Template-converter fixtures (Phase D)

Detection fixtures for the upload-and-convert route (`POST /api/templates/upload`).
Regenerate with `node fixtures/generators/genbrut.js` — plain Node, no dependencies.

| File | Blank style exercised |
|---|---|
| `brut-account-opening.docx` | Empty table cells beside labels; `*` required markers; seven legal articles as fixed text; director signature + company stamp execution block |
| `blanks-underscores.docx` | Underscore runs (`____`) and bracket placeholders (`[INSERT NAME]`, `[●]`) |
| `blanks-inline.docx` | Inline blanks inside prose ("whose registered address is           ") |

**Provenance note:** the brief's test document — the Brut Africa account opening
form — was not supplied with the brief, so `brut-account-opening.docx` is a
synthetic reconstruction from its description (two pages, ~27 blanks, seven
legal articles, KRA PIN / email / company telephone / receiver ID number /
company stamp / director signature). Detection counts asserted against it are
therefore against this reconstruction, not the original paper.

`test/f105-upload-convert.test.js` uses all three: it asserts the server's
structure extraction (labels, blank markers, reading order) reaches the model
verbatim, and drives the full pipeline against a stubbed detection response.
The ≥24-of-27 acceptance number requires a live Anthropic key and a real
`claude-sonnet-4-6` call — see CHECKLIST.md.

---

## PDF fixtures (PDF & Scanned Document Upload addendum)

Regenerate with `node fixtures/generators/genbrutpdf.js` — plain Node, no
dependencies; the PDF writer is hand-rolled for the same reason the ZIP writer
is.

| File | What it exercises |
|---|---|
| `brut-account-opening.pdf` | Born-digital PDF, real text layer, 2 pages. Classifies as `pdf_digital`; digit fields keep their confidence |
| `brut-account-opening-scanned.pdf` | The same form as an **image-only** PDF, 2 pages — one grayscale raster per page, and not a single text operator in the file. Classifies as `pdf_scanned`; draws the banner and caps the digit fields |
| `blanks-mixed.pdf` | Digital PDF whose blanks are underscore runs and `[INSERT …]` brackets rather than ruled boxes |

The wording in all three is the same synthetic Brut Africa reconstruction that
`genbrut.js` writes into `brut-account-opening.docx` (provenance note above
applies unchanged). Keeping one source of truth for the text is deliberate: the
Word and PDF routes are meant to be reading the same document, so a detection
count from one is comparable with the other.

**How the scan is made, and what that does and does not prove.** A scan for
these purposes is a PDF with no text layer, so the fixture draws its text as
pixels using a small 5×7 bitmap font, then adds deterministic speckle and an
edge shadow. Deterministic matters — a fixture that changes on every run is not
a fixture — so the noise comes from a fixed-seed LCG rather than `Math.random`.

That is enough to prove everything `test/f128-pdf-upload.test.js` asserts:
classification, the page count, the confidence cap, the banner flag, and the
whole pipeline end to end. It is **not** a substitute for a genuine
print-and-scan when judging how well the model *reads* a scan. The bitmap font
is cleaner than real scanner output in some ways and cruder in others. Before
trusting scan detection quality in production, run the real thing — a printed
and rescanned copy of the form — against a live key.
