# Measuring HaTi's scanning path

A scanned contract is the commonest way paper reaches this product. DESIGN-ocr.md
puts it plainly: the target customer is "a Nairobi business with drawers of
scanned paper", and before OCR existed "the product currently hands their problem
straight back to them."

Until **22 August 2026 nothing had ever put a scan through it.** The transcription
route had never been called by a test, `ocrDocument` had never been run, and the
whole path was written from the design note and shipped unexercised.

This folder is the measurement. The regression tests that run every time are
`test/f234-*.test.js` (the route) and `test/f235-*.test.js` (the path), plus
`test/chromium/scan-verify.js` in the browser sweep — none of which needs
anything here.

## What is different about this one

The PDF harness next door had **no answer key**, so it compared two readers.
Here the paper is *drawn* from a page of text we wrote, so we know exactly what
it says — and the question is not only "did the words survive" but **"did these
eight facts survive"**:

| fact | what reads it |
|---|---|
| the expiry date | the renewal reminders fire off it |
| the effective date | the term is measured from it |
| the contract value | the approval chain and the signing cap |
| the payment days | an obligation is tracked against it |
| the notice period | the renewal deadline is counted back from it |
| the liability cap | the playbook checks it |
| the insurance figure | an obligation is tracked against it |
| the counterparty | it is the register row |

A transcription that is 95% right and has the expiry date wrong has failed at
the one job the renewal reminders depend on. Word recall alone cannot see that.

## Running it

```
sh test/scan/fetch-libs.sh     # pdf.js and Tesseract — about 30 MB, not committed
node test/scan/measure.js
node test/scan/measure.js --misses   # what each missed fact came back as
node test/scan/measure.js --keep     # leave the page images in test/scan/out/
```

The two libraries are answered from disk by Playwright's router, at the **same
CDN URLs the product asks for** — so the product is not reconfigured for the
measurement, only the wire is, and HaTi's own Content-Security-Policy still
applies exactly as it does in production.

## The four variants

| | what it is |
|---|---|
| `clean` | a 200 DPI scan, the good case |
| `low` | 100 DPI at JPEG quality 0.30 — a cheap office scanner in a hurry |
| `fax` | halved, blurred, thresholded to 1 bit, 1.2% of pixels flipped, fed crooked |
| `skew` | a phone photo: 2.6° off square, out of focus, a window on one side |

**The first version of these did almost nothing and scored 100% on everything**,
which is how it was caught. It added speckle and *then* thresholded, and a hard
threshold removes exactly the noise that had just been added — so "faxed" paper
came back cleaner than the original. Order matters: the damage has to happen
after the step that would repair it, which is also the order the real world does
it in.

## What it found

**The label was honest and had nothing behind it.**

Every piece of the honesty chain was present and correct, and the chain did not
connect:

1. OCR reads a date. The extractor is confident about the text it was given and
   marks it `high`.
2. `capConfidenceForOcr` honestly knocks every `high` down to `medium` — the
   rule DESIGN-ocr.md calls load-bearing.
3. The batch import's review gate only ever tripped on **`low`**.

So a drawer of scans imported in one batch — the flagship journey — was filed as
**complete**, with dates nobody had read, and the renewal reminders fired on them.

Measured, before it was touched: on a page whose **word recall was 100%**, the
`low` variant read *"28 February 2028"* as **"26 February 2028"**, and `skew`
read it as **"28 February 2025"** — three years out, on the field the reminders
fire on, in a reading that looks perfect. DESIGN-ocr.md predicted exactly this in
words ("3 for 8, 2026 for 2028") and then the gate let it past.

```
  variant detected  recall   facts   size     time
  ----------------------------------------------------------
  clean   yes       100%     8/8     250k     5.7s
  low     yes       100%     7/8     48k      2.3s
  fax     yes        98%     7/8     310k     3.7s
  skew    yes        94%     6/8     96k      2.8s

  what the misses actually came back as
    low    the expiry date    "expiring on 26 February 2028, unless terminated"
    skew   the expiry date    "expiring on 28 February 2025, unless terminated"
    skew   the counterparty   "Industri AB"
```

**Read the two columns together or not at all.** `low` scores 100% on recall
and still gets the expiry date wrong: every word of the page came back, and one
digit of the one date the reminders fire on did not. That is the whole argument
for scoring the eight facts separately, and it is the same lesson the CUAD
scorecard learned as FOUND versus CORRECT.

A machine-read record now needs a human once. `applyReviewedMeta` clears the flag
the moment somebody confirms, so it says *look once*, not *stay amber for ever* —
and a digital contract is not held, because a rule that flags everything is a rule
nobody reads.

## What this does NOT measure, said plainly

- **The Copilot vision tier.** It needs a paid key. Every number here is the
  offline recogniser, which is the **floor**: what a workspace with no key gets,
  and what every workspace *with* one falls back to when a page fails. The vision
  route's own plumbing is proved separately by `test/f234-*.test.js`.
- **Real paper.** The pages are drawn on a canvas and degraded synthetically.
  Real scans carry paper texture, ink bleed, staple shadows, dust on the platen
  and coffee. Synthetic damage is a floor for the recogniser and a ceiling for
  realism, and only one of an answer key and real paper can be had at a time.
  Closing that needs scans from the business. See `WORKORDER-testing-next.md`.
- **Handwriting.** Neither tier is for it, by design; the correct answer is
  `[illegible]`.
