# WORKORDER — what is left to test, and the tripwire

Written 21 Aug 2026, at the end of the CUAD scorecard work. **Nothing here is
started.** Each item says what it is, why it matters, what it costs, and what
finished looks like — so any of them can be picked up alone.

## WHERE WE GOT TO, IN ONE PARAGRAPH

HaTi's Copilot now has a measured score against fifty real commercial
contracts marked up by lawyers who had never seen it: **81% mean FOUND across
nine fields**, and around 89% on "did it get the answer right". Five product
defects were found and fixed along the way. The method, the corpus, the
scorer and the findings are in `test/cuad/`. Full detail: `FINDINGS.md`.

**What that measurement does NOT cover is most of this work order.**

---

# PART 1 — THE TRIPWIRE (the last stage of the original plan)

## 1.1 A scheduled run — the smoke alarm

**What it is.** Once a month, on its own, ten contracts, compared against the
recorded 81%. Silence when it is fine; a loud failure when it is not.

**Why it matters, and it is not the score.** The score is already known and
will not teach anybody anything next month. The point is the *regression* —
somebody changes something, Copilot quietly gets worse, and nobody finds out
until a customer says so. That is not hypothetical: it happened twice during
this work. Widening one instruction broke the obligations reader somewhere
else, and nothing failed, nothing logged, it simply started returning nothing.
It was caught only because a measurement was running at the time.

**What it costs.** About £1 a month. It runs in GitHub Actions, never on the
live site.

**The threshold has to respect the noise band, and this is the part that is
easy to get wrong.** Ten contracts wobble ±5 points run to run with no code
change at all — measured, see `SCORING.md`. So the alarm fires on a **drop of
15 points or more**, which is the size of the first fix in this project. It
will catch "somebody broke Copilot". It will **not** catch a slow drift, and
tuning it finer would train everybody to ignore it. Say that out loud in the
job, so the next person does not "improve" the threshold.

**Two decisions for the owner, neither technical:**
- An API key stored as a GitHub secret, spending ~£1 a month unattended. Small
  money, but it is a standing authorisation.
- Where the alarm lands. A red mark in GitHub is easy to miss if you do not
  live there; email is easy to add.

**Done looks like:** a scheduled workflow beside `tests.yml`, a recorded
baseline, a threshold with its reasoning in the file, and one deliberate test
that the alarm actually fires — a job that cannot go red is a diary.

**Note:** half of this is already running and free. The scorer's own 70 checks
(f229) are in `npm test`, so they run on every push. Given four of this
project's bugs were in the scorer rather than the product, that is the half
most worth having, and it is done.

---

# PART 2 — THE BIG UNTESTED AREA

## 2.1 The PDF and OCR chain has no real-world test at all

> **BOTH HALVES ARE NOW MEASURED — 21 and 22 Aug 2026 — and what is left is
> smaller and more specific than this item says.**
>
> *The reading half.* `test/pdf/` compares HaTi's reader against Mozilla's
> pdf.js over 34 real-world PDFs from twelve producers. It scored **54%**, with
> every LibreOffice file returning an empty document; three faults were found
> and fixed and it now scores **80%**. CLAUDE.md, "THE PDF READER MEETS FILES
> HaTi DID NOT MAKE"; test f233.
>
> *The scanning half.* `test/scan/` puts a real scan through the real path — a
> real Chromium, the real `ocrDocument`, the real pdf.js rasterizer and the real
> Tesseract — against a page drawn from known text, so there is an answer key.
> **Six defects**, the worst of them silent: a machine-read scan was filed by
> the batch importer as *complete*, needing no human, because the honest
> confidence cap produced `medium` and the review gate only tripped on `low` —
> so a phone photo whose expiry date read three years wrong went into the
> register with the renewal reminders pointing at it. CLAUDE.md, "THE SCANNING
> PATH IS DRIVEN FOR THE FIRST TIME"; tests f234, f235, `scan-verify`.
>
> **What neither covers, and is what is left of this item:** nothing in either
> corpus is a **contract**, and the scan pages are **drawn and degraded
> synthetically** rather than photographed off real paper. The Copilot **vision
> tier** is unmeasured because it needs a paid key. Everything below still
> stands, and the paragraph about five poor scans is now the single most useful
> thing anybody could hand over.

**This is the largest gap in the product's testing, and the scorecard made it
visible rather than closing it.**

Everything measured so far ran on **clean text**. The path a real customer
actually uses — upload a PDF, HaTi reads it, then the AI reads what HaTi
extracted — has never been tested against a document HaTi did not create.
HaTi's PDF reader is hand-rolled (`pdfTextRuns`, `pdfRunsToLines`, the font
width tables) and the OCR route beside it has never seen a scanned page in a
test.

**Why it matters more than the AI score.** A perfect Copilot reading garbled
text produces a confident wrong answer. Every figure in `FINDINGS.md` assumes
the text arrived intact, and nothing has ever checked that assumption.

**What is needed.** CUAD ships **510 PDFs** alongside the text — the same
contracts, so the text already committed in `contracts.json` **is the answer
key for the PDF reader.** Feed the PDF in, compare HaTi's extraction against
the known-good text. That is a rare thing: a reading test with a real answer.

**The blocker, recorded so nobody re-discovers it.** The PDFs are in
`CUAD_v1.zip` on Zenodo, and direct HTTPS to zenodo.org is refused by the
egress proxy. The text-only copy came down through the git lane (the CUAD
repository's `data.zip`), which does not contain them. **Somebody has to fetch
that bundle outside this environment** and put it somewhere reachable.

**Also needed and not in CUAD:** five genuinely poor scans — photographed,
skewed, faxed — off real paper. Selection rule 6 of the original work order
asked for exactly this and could not be satisfied. It still cannot: the scan
harness had to DRAW its pages in order to have an answer key, and synthetic
damage is a floor for the recogniser and a ceiling for realism — real paper
carries texture, ink bleed, staple shadows and dust that no canvas filter
produces. **Five photographs of five real contracts is a ten-minute job for
somebody with the paper, and it is the single highest-value thing left on this
list.**

**Done looks like:** a score for the PDF reader with the same two-figure
honesty as the AI one, and a named list of what it cannot read.

---

# PART 3 — WHAT THE CORPUS CANNOT ANSWER

Each of these is a real gap and none can be closed with CUAD. They need
documents from the business.

## 3.1 Kenyan and Swedish contracts — the actual market

Every one of the fifty is American: Delaware and New York law, dollars, US
drafting. That HaTi can find a governing law clause transfers; **nothing in
the 81% describes how it reads Kenyan or Swedish paper**, and no figure from
this set may be quoted as though it did.

**What is needed:** 10–15 real contracts from each market, redacted, with the
key fields marked by hand. A day's work for somebody who knows the contracts.

## 3.2 The NDA and the property lease

Two of HaTi's twelve templates are **completely unmeasured** and cannot be
measured from this source — companies do not file NDAs or leases as material
contracts, so EDGAR does not hold them. The NDA is the only built-in carrying
`valueType:'none'`, so it is the one template that exercises `isMonetary`'s
refusal path; the lease is one of only three carrying `valueType:'fixed'`.
Both are corner cases the other fifty never reach.

**What is needed:** 3–5 of each, redacted, marked by hand. Or an explicit
owner's decision to leave them unmeasured — which is a fine answer, provided
it is written down rather than forgotten.

## 3.3 Six fields with no answer key

`value`, `currency`, `paymentTerms`, `retentionPct`, `retentionReleaseDays`
and `category` print as **not measured** and must never print as zero. CUAD's
lawyers never marked them. `retentionPct` and `retentionReleaseDays` matter
most for this business — retention is money held back — and they are the
fields whose spans went wrong most often before the quoting fix.

**What is needed:** the same hand-marking as 3.1, on the same documents. Do
these three jobs in one sitting.

---

# PART 4 — THE WEAK FIELDS

Ordered by what a wrong answer costs the business, not by how wrong it is.

## 4.1 The expiry date — 71% found, 79% right

**The highest-consequence weak field.** It feeds the renewal card's deadline
and the reminder emails; the same family as the notice period, which was the
one worth fixing first and turned out to be a scorer bug rather than a product
one. Check the scorer first here too — `expiryTruth` has already been wrong
twice, and 25 of 49 contracts state no derivable expiry at all.

## 4.2 Warranty periods — 40% found

The weakest field by a distance, on 20 contracts. Note its 80% CORRECT: HaTi
gets the answer right twice as often as it quotes the passage a lawyer marked.
That pattern usually means the field is being read from somewhere reasonable
that CUAD did not highlight, so **read ten of them by hand before changing any
code.**

## 4.3 The counterparty — 88% right on 50

Six wrong out of fifty, and it is the field printed at the top of every
screen. Worth reading those six.

## 4.4 The obligations reader is inconsistent

21 of 50 return nothing on any given run — **and it is not the same 21.** Not
length (measured: silent contracts average 36,518 characters against 37,813),
not contract type. The same contract returned 12, 20, 0, 0 and 0 across five
runs.

The product already handles this honestly: it no longer claims the contract is
empty and offers *Scan again*. **Do not spend more prompt effort on this
without a bigger sample** — it is exactly the noise-chasing `SCORING.md` warns
about. If it is ever worth attacking, the option not taken was scanning twice
and merging, which doubles the cost of every scan.

## 4.5 Five spliced quotes came back

Down from 34, and every fragment is genuine wording. It says the fix
suppressed the behaviour rather than ending it. Low priority, cheap to look
at, and the surface is customer-facing.

---

# PART 5 — TESTING DEBT NOT RELATED TO THE SCORECARD

## 5.1 The one known-red browser file

`six-round-audit.js` — rounds 1–6 pass, the endgame does not. It issues a
NEGOTIATE link where it wants a signing one, so the share dialog opened by the
readiness hand-off needs the same treatment naming a signer already got. The
reason is written in `run-all.js` beside the entry. **Take it off the list the
day it goes green** — that is the rule the file states about itself.

## 5.2 Three features have no browser test

Named as not-done when they shipped and still not done: the **contract brief**,
the **archive shelf**, and **two-step sign-in**. Each has node tests; none has
a file proving its pixels. Two-step is the one to do first — it is the only one
of the three that can lock somebody out of their account.

## 5.3 analytics-verify's offline fallback is unguarded

Its check is `canvases > 0 || bars > 0`. The `bars` half looks for a
pill-shaped CSS bar that SQUARE CORNERS EVERYWHERE squared away, so that
selector now matches nothing anywhere. CI has ordinary network so the canvas
half carries the file, and the fallback it was written to guard is untested.
Re-point the selector when somebody is next in that file.

---

# HOW TO PICK THESE UP

**If there is one day:** Part 1 (the tripwire). It protects everything else.

**If there is a week:** Part 2 (the PDF chain). It is the largest untested
area in the product and CUAD hands over an answer key for it free.

**If somebody in the business can spare an afternoon with real contracts:**
Part 3, all three items in one sitting. Nothing else can close those gaps.

**Do not start with Part 4.** Two of the four "weak" fields have already
turned out to be measurement faults rather than product faults, and on a
fifty-contract sample a few points is not reliably signal. Read the contracts
by hand before writing any code.

## THE RULE THIS PROJECT EARNED, WORTH READING FIRST

Four of the bugs found in this work were in the **scorer**, not the product,
and every one was caught by a person reading real output rather than by any
test. The rule is in `score.js` and it paid for itself three times:

> **A figure that disagrees with a healthy FOUND score is a scorer bug until
> proven otherwise.**

Before fixing anything named in Part 4, prove the measurement is right.
