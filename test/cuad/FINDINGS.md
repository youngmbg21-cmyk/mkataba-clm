# What the scorecard found — 21 Aug 2026

First live measurement of HaTi's Copilot against contracts it did not write.
**Ten contracts, not fifty.** Two runs: the first produced two numbers that were
my own bugs; these are the figures after both were fixed.

Method and rules: `SCORING.md`. The set: `selection.json`. Raw answers from the
run that produced this: `--dump`, then `inspect.js`.

## HOW TO READ THIS

Two figures per field, never averaged (SCORING.md):

- **FOUND** — did HaTi read from the passage a lawyer marked?
- **CORRECT** — did it get the answer right?

They tell different stories here, and the gap between them is the single most
useful thing in this document.

Every percentage carries its denominator. Fields differ in how many contracts
could be scored, and a bare percentage hides that.

## THE FIELD RESULTS

| Field | FOUND | CORRECT | Not verbatim |
|---|---|---|---|
| `governingLaw` | 100% (10/10) | **100% (10/10)** | — |
| `counterparty` | 100% (10/10) | **90% (9/10)** | — |
| `effectiveDate` | 70% (7/10) | **100% (8/8)** | 1 |
| `liabilityCapped` | 44% (4/9) | **100% (9/9)** | 5 |
| `warrantyMonths` | 50% (1/2) | 100% (2/2) | 1 |
| `noticePeriodDays` | 70% (7/10) | **50% (5/10)** | 1 |
| `expiryDate` | 56% (5/9) | **50% (3/6)** | — |
| `contractType` | 80% (8/10) | not comparable | — |
| `renewalType` | 80% (8/10) | not comparable | 1 |

Headline: **72% mean FOUND across 9 fields, on 10 contracts.**

`warrantyMonths` rests on two contracts. It is reported because hiding it would
be a silent trim, but nothing should be concluded from it.

Six fields cannot be measured against CUAD at all — `value`, `currency`,
`paymentTerms`, `retentionPct`, `retentionReleaseDays`, `category`. They print
as *not measured*, never as zero. See MAPPING.md.

## READING IS BETTER THAN THE HEADLINE SUGGESTS

Where HaTi's answer could be checked, it was usually right — often perfectly.
`liabilityCapped` makes the point: **9 of 9 answers correct, and a FOUND figure
of 44%**, because five of the nine quotes could not be located in the contract.

**The low FOUND numbers are substantially caused by the quoting defect below,
not by HaTi looking in the wrong place.** Any summary that leads with 72%
without saying so is misleading in HaTi's disfavour.

---

# THREE PRODUCT FINDINGS

Each is in HaTi, not in the scorecard.

**FIXED 21 Aug 2026, owner-approved.** Findings 1 and 3 are fixed; finding 2 was
a consequence of finding 1 and should follow it. The measurements below are left
exactly as they were taken — they are the record of what was found, not a
running score. **The figures have NOT been re-measured since the fix**, and
nothing here should be read as describing HaTi today until they have been.
See CLAUDE.md, "THE WHOLE CONTRACT IS READ, AND A QUOTE IS ONE PASSAGE", and
test f227.

## 1. THREE AI FEATURES READ ONLY THE FRONT OF A LONG CONTRACT

| Route | Reads |
|---|---|
| `/api/ai/obligations` | first **20,000** characters |
| `/api/ai/brief` | first **20,000** characters |
| `/api/ai/renewal` | first **12,000** characters |
| `/api/ai/extract` | the configurable cap (60,000 by default) |

A hard `String(text).slice(0, N)`, applied regardless of the input cap the
route otherwise respects, and **not reported to the reader anywhere**.

**And the browser sliced too** — found while fixing this, not while measuring
it. `extractObligations`, the brief runner and the playbook runner each cut to
20,000 characters *before posting*, so correcting the server alone would have
corrected nothing. Six truncations, not three.

> **FIXED.** One ceiling for one contract (200,000 characters, above the
> longest of the 510 and settable), it marks the text and tells the reader when
> it bites, and the portfolio-wide budget — which is where a cap genuinely
> earns its place — is untouched.

Eight of the ten contracts measured are longer than 20,000 characters. The
median is 31,914 — so the obligations reader saw at most **63%** of a typical
one, and 38% of the longest.

**It is the wrong 63%.** Audit rights, insurance, post-termination duties and
liability caps are drafted at the BACK of an agreement, and commercial
contracts open with long definitions sections.

This is the silent trim this project's own rulebook forbids on every other
surface — *"a cap or an exclusion is a FACT, never a silent trim"*. Three AI
features do it, and the reader is told nothing.

## 2. THE OBLIGATIONS READER GOES SILENT RATHER THAN PARTIAL

Scored 0% on all four categories. That is **not** a reading failure:

| | |
|---|---|
| Contracts returning no obligations at all | **9 of 10** |
| The one that worked | **12 obligations, every one quoted** — the maximum the tool allows |
| Its length | **14,193 characters — the shortest in the run**, and one of only two seen whole |
| Truncated contracts returning anything | **0 of 8** |

Shown a whole contract it works well. Shown two thirds it returns **nothing**,
rather than the obligations it did see.

> **NOT FIXED DIRECTLY, AND DELIBERATELY.** Nothing was changed to make the
> reader degrade gracefully, because with the truncation gone there is far less
> to degrade from — and building a fallback for a state you have just stopped
> creating is how a product grows machinery nobody needs. What WAS fixed is the
> silence beside it: "No obligations detected" was a bare `toast()` call, which
> in this product prints nothing at all, so the press had no visible outcome
> whatever the answer. Re-measuring is what settles the rest. A feature that degrades to silence is
worse than one that degrades to partial, because silence reads as "this
contract has no obligations".

**Honest limit:** only two contracts were seen whole, and one of those still
returned nothing. The direction is clear; the sample is small. Re-measuring
after the truncation is lifted is the way to settle it.

## 3. QUOTES ARE SPLICED, NOT PARAPHRASED — AND NOT INVENTED

**34 of 125 spans (27%) could not be found in the contract.** Far worse than
the score table shows, because the table counts only the nine scored fields.

The mechanism is specific:

> `"invoices...issued by EIT at the start of each term...paid by"`
> `"EIT guarantees that the solution suggested...EIT guarantees "`

HaTi is joining separate parts of a clause with an ellipsis. **Every fragment
is genuinely in the contract; the join is not.** `inspect.js` splits each span
at the ellipsis and checks every fragment, so this is measured rather than
assumed.

That distinction decides how serious it is:

- **Not** invention. Nothing was made up.
- **Not** a reading fault. It found the right words.
- A **prompt instruction** — it needs telling to quote one continuous passage.

> **FIXED.** One sentence, stated once and reaching all four tools that hand a
> quote to a customer, carrying its own way forward for the case that caused
> the splicing: where no single passage holds the whole answer, quote the one
> that holds most of it.

Worst affected: `retentionPct` (6), `liabilityCapped` (5), `warrantyMonths` (5),
`category` (4), `retentionReleaseDays` (4). All fields whose answer is spread
across a clause, which is exactly where splicing is tempting.

**It matters because customers read those spans as quotations.** The upload
confirm screen prints them under each field, and the renewal card quotes the
phrase a notice period was read from — presented as the contract's own words.

---

# WHAT TO FIX FIRST

Ordered by what it costs the business, not by effort.

**~~2. The truncation.~~** and **~~3. The splicing~~** were fixed on
21 Aug 2026. What is left:

**~~1. The notice period, at 50% (5/10).~~ THAT FIGURE WAS MEANINGLESS —
21 Aug 2026.** Asked to fix it, I checked the answer key first, and the answer
key was wrong on **18 of its 34 entries**.

`parseDuration` returns the first duration in a marked span, and a renewal
clause states the renewal **term** before the notice:

> "renew automatically for successive **one-year terms** unless one Party gives
> notification of termination with at least **sixty (60) days** written notice"

The answer is 60 days. The scorer read 365. So on more than half of these,
HaTi was being marked wrong for giving the right answer. Fixed —
`noticeDuration` asks what each duration is *attached to* rather than taking
the first one, and all 18 corrected readings were checked back against their
own spans by hand. **The true figure is unknown until a re-run.**

**~~4. The expiry date, at 50% (3/6).~~** Same fault, same fix. `expiryTruth`
computed an expiry off the first duration too — turning *"terminable by either
party with one (1) year written notice"* into a one-year term, and inventing a
term outright for an evergreen agreement that states none. It now refuses where
the span states no term: 25 scorable truths became 24, in the honest direction.

**THIS IS THE THIRD SCORER BUG OF ONE FAMILY** (after `yes`/`no` against
`capped`/`uncapped`, and expiry overstated at 42/49) and the largest. All three
had the same tell, and the rule written into `score.js` after the first one
caught this one: *a figure that disagrees with a healthy FOUND score is a
scorer bug until proven otherwise.* FOUND for the notice period was 70%.

**None of the 59 existing tests caught it**, because every fixture in them held
a single duration. Section 12 of f226 now carries the real sentences, verbatim
from the corpus.

**HaTi's own two field definitions were hardened at the same time** — not
because they are proven to be the cause, but because both were genuinely
under-specified and it is cheap. `noticePeriodDays` named two different clauses
with a slash and ranked neither, while everything downstream treats it as the
renewal one; it now says which wins, warns about the term-before-notice trap,
and states the month-to-days conversion its sibling field already stated.
`expiryDate` asked for a date on contracts that state only a term — silent
arithmetic, which this product refuses everywhere else — and now leaves it
empty rather than estimating.

**5. Re-run the scorecard.** Two of the three findings changed what the AI is
shown, so every figure in this document now describes code that no longer
exists. The same ten contracts, for about US$0.90 — more than the first run,
because whole contracts are now being read.

---

# WHAT THIS DOES NOT SAY

- **Ten contracts, not fifty.** The other forty were deliberately not run:
  two features are now known to be reading truncated contracts, so those
  numbers would measure the truncation rather than the AI.
- **American contracts.** Delaware and New York law, dollars, US drafting. That
  HaTi finds a governing law clause transfers; nothing here describes how it
  reads Kenyan or Swedish paper.
- **Nothing about the PDF or OCR chain.** This measures the AI on clean text.
  The document-reading path still has no real-world test.
- **Nothing about value, currency, payment terms or retention.** CUAD has no
  answer key for them.
- **The NDA and the property lease are unmeasured** and cannot be measured from
  this source — no such contracts are filed publicly. Two of HaTi's twelve
  templates, including the only one carrying no money.

## AND TWO OF MY OWN ERRORS, SINCE THEY BEAR ON TRUST IN THE NUMBERS

The first run reported `liabilityCapped` at **0% correct**. That was my
scorer comparing `yes`/`no` against HaTi's `capped`/`uncapped`. The true figure
is **100%**. Had it been published, it would have accused HaTi of being unable
to read a liability cap at all.

The runner also printed *"measured against 510 professionally reviewed
contracts"* on a ten-contract run — a fiftyfold overstatement, in the one line
written to keep the claim honest.

Both were caught by a person reading the output, not by any test. The rule that
came out of it is in `score.js`: **a zero beside a healthy FOUND is a scorer bug
until proven otherwise.**

## THE CLAIM, IF A FIGURE IS EVER PUBLISHED

> measured on 10 contracts drawn from CUAD, a set of 510 marked up by
> commercial lawyers

Never *"N% accurate"*. Never cite 510 as the number measured. Credit CUAD
(CC BY 4.0).
