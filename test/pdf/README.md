# Measuring HaTi's PDF reader against files it did not make

HaTi reads PDFs with its own hand-written reader (`js/views/contract.js` —
object index, object streams, fonts, CMaps, width tables, a text-run walker).
Until 21 August 2026 that reader had **never been run against a PDF this
project did not produce.** The fixtures it had were generated here, which is
the same "marking our own homework" the CUAD scorecard was built to stop.

This is the measurement. It is not part of `npm test` — it needs a corpus and a
second reader, neither of which is committed. **The regression tests that DO
run every time are `test/f233-*.test.js`**, which reproduce each fault found
here with hand-built PDFs and no external files.

## What it measures, and what it cannot

There is no answer key. A PDF does not come with a statement of what it says.

So this is **differential testing**: read every file twice, once with HaTi and
once with Mozilla's `pdf.js`, and treat every disagreement as a question. It
cannot tell you HaTi is right. It tells you where two independent readers of
the same file disagree, which is where the defects are.

**`recall`** is the share of the words pdf.js found that HaTi also found. It is
deliberately one-directional and forgiving about order and punctuation — the
question being asked is *"did the words survive"*, not *"is the layout
identical"*, because everything downstream of this reader is an AI reading
prose.

Where pdf.js finds nothing either — an image-only scan, an encrypted file —
the pair is reported as **not comparable** rather than scored. Neither reader
failing is not evidence about either one.

## Running it

```
cd test/pdf
./fetch-corpus.sh          # the PDFs and pdf.js — neither is committed
node read-with-pdfjs.mjs   # the reference reading
node read-with-hati.js     # HaTi's own
node compare.js            # the table
```

The two readers **must** run in separate processes and the scripts are split
for that reason alone. `read-with-hati.js` needs jsdom, which installs a
browser-shaped set of globals; pdf.js then detects a browser, tries to use a
browser worker, and **silently returns nothing**. Run together, the reference
reading is empty and HaTi appears to score zero on everything.

## The corpus

`py-pdf/sample-files` — 34 PDFs from twelve different producers: LaTeX,
LibreOffice Writer, Google Docs, reportlab, pdfkit, ImageMagick, PyMuPDF, plus
Arabic right-to-left text, rotated and cropped pages, forms, annotations and
image-only scans.

It is a good corpus for this because it is organised **by producer**, and a
producer is what a defect here usually turns on: the first run's worst failures
were every LibreOffice file in the set, for reasons specific to how LibreOffice
writes a PDF.

**What it is not is contracts.** Nothing here is a commercial agreement, and
nothing here is a photographed or faxed scan — the two things this product
actually meets. Closing that is the remaining work, and it needs documents from
the business rather than a public corpus. See `WORKORDER-testing-next.md`.

## What it found on the day it was written

**54% mean recall, and every LibreOffice file returned an empty document.**

Three faults, in one chain, all of them ending in silence rather than an error:

1. **An indirect `/Length`.** LibreOffice, pdfkit and ImageMagick write
   `/Length 3 0 R` — a reference to another object — because a compressing
   writer does not know the length until the stream is written. Ordinary,
   legal PDF, and the index refused it and fell back to searching for
   `endstream`.
2. **The fallback kept the separator.** The bytes between the stream data and
   the `endstream` keyword are an end-of-line, not content, and
   `DecompressionStream` refuses a buffer with anything after the compressed
   data. Node's `zlib` tolerates it silently — which is exactly why nothing on
   the server side had ever noticed.
3. **A single-byte code is not always the character.** A subset TrueType font
   numbers its glyphs from 1 and states what they mean in a `/ToUnicode` map.
   HaTi read that map, attached it to the font, and then never asked it: the
   single-byte branches assumed the code *was* the character. The text came
   out as control characters, which every reader downstream strips.

Neither 1 nor 2 is fatal alone; together they are, and that is what LibreOffice
writes. **After all three: 80%, with every LibreOffice file at 100%.**

## What is still weak, measured

| | recall | what it is |
|---|---|---|
| `reportlab-overlay` | 0% | text drawn as an overlay — not diagnosed |
| Arabic (3 files) | 40% | right-to-left, and reversed on the way out |
| `GeoTopo` (2 files) | 42% | a 150,000-character LaTeX book — ligatures and hyphenation at scale |
| `annotated_pdf` | 50% | pdf.js reads annotation text; HaTi reads the page. Arguably a difference rather than a fault |

None has been chased. The three fixed were the ones costing whole documents.

## A note on the two dependencies

`pdf.js` is a **measuring instrument, not a dependency** — it is fetched into
`test/pdf/node_modules`, is never imported by the product, and nothing in
`npm test` touches it. If the day comes that HaTi should simply use pdf.js
instead of its own reader, that is a real option and this harness is what would
justify it. It is not what this measures.
