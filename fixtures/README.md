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
