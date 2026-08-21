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

Each is in HaTi, not in the scorecard. **None has been fixed** — this is a
measurement exercise and the fixes are the owner's call.

## 1. THREE AI FEATURES READ ONLY THE FRONT OF A LONG CONTRACT

| Route | Reads |
|---|---|
| `/api/ai/obligations` | first **20,000** characters |
| `/api/ai/brief` | first **20,000** characters |
| `/api/ai/renewal` | first **12,000** characters |
| `/api/ai/extract` | the configurable cap (60,000 by default) |

A hard `String(text).slice(0, N)`, applied regardless of the input cap the
route otherwise respects, and **not reported to the reader anywhere**.

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
rather than the obligations it did see. A feature that degrades to silence is
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

Worst affected: `retentionPct` (6), `liabilityCapped` (5), `warrantyMonths` (5),
`category` (4), `retentionReleaseDays` (4). All fields whose answer is spread
across a clause, which is exactly where splicing is tempting.

**It matters because customers read those spans as quotations.** The upload
confirm screen prints them under each field, and the renewal card quotes the
phrase a notice period was read from — presented as the contract's own words.

---

# WHAT TO FIX FIRST

Ordered by what it costs the business, not by effort.

**1. The notice period, at 50% (5/10).** This feeds the renewal card's deadline
and the reminder emails. Half of them wrong is a customer missing a renewal.
The highest-consequence number in this document.

**2. The truncation.** Three features silently reading part of a contract. The
obligations reader is the worst of the three because it returns nothing at all.

**3. The splicing.** Customer-facing, and probably the cheapest of the three —
one instruction to quote a single continuous passage.

**4. The expiry date, at 50% (3/6).** Same family as the notice period, smaller
sample, same consequence.

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
