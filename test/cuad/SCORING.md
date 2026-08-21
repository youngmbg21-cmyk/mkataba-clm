# Stage 3 — what counts as correct

Written 21 Aug 2026. The set is `selection.json` (stage 1); the field map is
`MAPPING.md` (stage 2). This is the specification stage 4 builds to. Nothing here
is code and nothing here has been run.

**Its job is to make the score mean the same thing every time it is produced.**
Without that, a figure that drops next month cannot be told apart from somebody
having changed their mind about marking.

## THE OWNER'S THREE RULINGS, RECORDED

1. **`value` is dropped from the scorecard.** CUAD has no value category, so there
   is nothing to compare against. It is reported as *not measured* — never as a
   zero, never as a blank cell. Value gets measured later against the business's
   own paper, where the currency is right too.
2. **First-party rule.** Where CUAD marks every signatory, HaTi is correct if its
   `counterparty` matches any marked party **other than the first-named**.
3. **Unmarked is excluded, not wrong.** Where CUAD marks nothing for a field, that
   contract leaves that field's denominator. An annotator finding nothing is not
   the contract being silent.

Ruling 3 is the load-bearing one and it extends by its own logic — see
*derivability* below.

## TWO FIGURES PER FIELD, NEVER ONE

From stage 2: CUAD finds clauses, HaTi extracts fields. So every field reports

- **FOUND** — did HaTi read from the right passage? Its `sourceSpan` against
  CUAD's marked span.
- **CORRECT** — did HaTi get the answer right? Its value against the answer
  derived from CUAD's span.

They are never averaged together. A field that is FOUND-but-not-CORRECT means
HaTi located the right sentence and misread it, which is a different defect from
not finding it, wants a different fix, and must not be hidden inside one number.

## RULE 1 — FEED HaTi THE TEXT CUAD ANNOTATED

The scorecard sends each contract's `context` string verbatim. Not a PDF, not a
re-extraction.

This is what makes spans comparable at all: CUAD's offsets index that exact
string, and HaTi is instructed to copy its `sourceSpans` "exactly from the
document". Re-extracting from a PDF would shift every offset by whatever the two
readers disagree about, and the scorecard would measure text extraction while
claiming to measure the AI.

The PDF and OCR chain is a **separate** measurement, and it is not in this
scorecard. It needs the Zenodo bundle (see the work order).

## RULE 2 — HOW "FOUND" IS JUDGED

HaTi returns span *text*; CUAD stores *offsets*. So: normalise whitespace, locate
HaTi's phrase in the contract, and compare character ranges.

**A span is FOUND when it overlaps any of CUAD's spans for that category by at
least half the shorter of the two.**

Three properties, each chosen against a measured fact:

- **Any, not all.** CUAD marks the same category in several places — parties
  averages 4.5 spans, insurance 2.9, audit rights 2.7. HaTi quotes one. Requiring
  all of them would score a right answer wrong.
- **Symmetric, by the shorter span.** Span lengths differ by an order of
  magnitude between fields: a party name runs 16 characters, a liability cap 290.
  Containment in either direction fails at one end or the other. Overlap measured
  against the shorter span works at both.
- **Half, not one character.** A single character of overlap at a boundary is a
  near-miss, not a hit.

The half threshold is a judgement, not a discovery. **Stage 4 re-checks it against
real HaTi spans on ten contracts before the first full run** — if it turns out to
be doing real work at the margin, it gets revisited rather than defended.

### A SPAN THAT IS NOT VERBATIM IS ITS OWN RESULT

If HaTi's phrase cannot be located in the contract, the model paraphrased instead
of quoting. That is a real defect — the upload confirm screen and the renewal
card both print those spans as quotations from the document.

It is counted and reported as **not-verbatim**, separately. Never folded into
"wrong": the answer may be perfectly right. It is a different fault with a
different fix.

## RULE 3 — HOW "CORRECT" IS JUDGED, AND WHERE IT CANNOT BE

CUAD stores no normalised answers, so truth is derived by reading CUAD's own
span. Measured on the 50, that works this often:

**Re-measured at stage 4 with the scorer itself, not with a sketch of it.**
The `expiryDate` row below first read 42 of 49 and that was wrong — see the
correction under it.

| Field | Derivable | Of marked | How |
|---|---|---|---|
| `counterparty` | 50 | 50 | party names in the spans |
| `governingLaw` | 48 | 48 | jurisdiction named in the span |
| `liabilityCapped` | 42 | 42 | presence of the two categories |
| `noticePeriodDays` | 34 | 36 | duration parsed from the span |
| `effectiveDate` | 33 | 47 | a date in the span |
| `expiryDate` | **25** | 49 | a stated date, or a duration from a **stated** anchor |
| `warrantyMonths` | 15 | 20 | duration parsed from the span |
| `renewalType` | — | 39 | FOUND-only |
| `contractType` | — | 50 | FOUND-only |

### `expiryDate` WAS OVERSTATED, AND THE CORRECTION IS THE INTERESTING PART

It first read 42 of 49, measured with a rough pattern that accepted "a date OR
a duration". The scorer disagreed at 9 of 49, and the scorer was right: **only
9 of the marked spans state a date at all.** Another 33 state a DURATION —
*"commence on the Effective Date and continue for an Initial Term of five (5)
years"* — which is simply how a term is drafted, and which cannot be compared
to the calendar date HaTi's `expiryDate` holds.

The recovery is arithmetic on two facts CUAD already marked: where the span
**names its anchor** and that anchor's date is itself derivable, the expiry is
computed. That lifts it to **25 of 49**.

**The anchor must be stated, never assumed.** Ten spans give a duration with no
anchor — *"a term of ten (10) years"*, from when? Assuming those run from the
effective date would invent the TRUTH, and inventing the truth is worse than
inventing an answer: it marks a correct reading wrong and the scorecard blames
HaTi for the annotator's silence.

A computed expiry carries **one day** of tolerance; a stated one carries none.
"Five years from 1 March" does not settle whether the term ends on the
anniversary or the day before, and that ambiguity belongs to the drafting.

**Where the answer is not derivable, the contract leaves the CORRECT denominator
and stays in the FOUND denominator.** This is ruling 3 applied one step further,
and by the same reasoning: a span that never states a date cannot prove HaTi's
date wrong.

`effectiveDate` is the weakest at 33 of 47, because CUAD frequently marks the
defined term "Effective Date" rather than the date itself — the median span for
that field is 21 characters. So its CORRECT figure rests on two thirds of its
FOUND figure, and **the scorecard prints both denominators** rather than letting
one stand for the other.

### PER-FIELD COMPARISONS

- **Dates.** Parsed to a calendar date, compared exactly. No tolerance: the
  renewal arithmetic counts from these, and a month out is what this exists to
  catch.
- **Durations.** Normalised to days (`noticePeriodDays`) or months
  (`warrantyMonths`). Words and digits are the same answer — "ninety (90) days"
  is 90 — and legal drafting writes both. **Reuse `precedentFigure`'s existing
  reading; do not grow a second one.**
  **CORRECTED at stage 4 by f229-3d.** This first read *"'3 months' notice is 3
  months, not 90 days"*, which reads well and is unusable: HaTi's field is
  literally `noticePeriodDays` and must answer in days. A month has no fixed
  length, so a period stated in months is compared as a RANGE — 3 months is
  anything from 3x28 to 3x31 days. Demanding exactly 90 would mark a correct
  reading wrong whenever the months are long.
- **Governing law.** Correct if HaTi names the jurisdiction the span names.
  "New York", "State of New York" and "New York, USA" all pass against *"the laws
  of the State of New York"*. Naming a country where the span names a state
  fails — Kenyan and Swedish law are national and the level matters.
  **The jurisdiction list must cover more than the United States.** A first pass
  scored four contracts as underivable that were nothing of the sort: Hong Kong,
  Spain, British Columbia and Canada were simply missing from the list. The gap
  was in the tooling, not in the data, and a short list silently understates the
  score.
- **`liabilityCapped`** is three states from two categories: *Cap on Liability*
  marked → `yes`; only *Uncapped Liability* → `no`; both → `yes`, since a cap
  with carve-outs is still a cap; neither → excluded, per ruling 3.
- **`counterparty`** — ruling 2. Company-name comparison ignores case,
  punctuation and the suffixes (Ltd, LLC, Inc, plc, AB).
- **`contractType`** is fuzzy and reported as such: HaTi answers in its own
  vocabulary of twelve, CUAD gives the document's title. "Distributor Agreement"
  against "DISTRIBUTOR AGREEMENT" passes; HaTi's "Distributor" against CUAD's
  "Sales, Marketing, Distribution and Supply Agreement" is a judgement no rule
  settles cleanly. **Reported FOUND-only**, with CORRECT marked *not comparable*.
- **`renewalType`** is FOUND-only. CUAD gives the renewal term's wording; HaTi
  answers with a type. They are not the same question.

## RULE 4 — THE OBLIGATIONS READER

The cleanest measurement here, because it needs no derived truth at all.

| Category | Marked |
|---|---|
| Post-Termination Services | 23/50 |
| Audit Rights | 23/50 |
| Minimum Commitment | 23/50 |
| Insurance | 20/50 |

Scored on location alone: did the reader surface an obligation whose source text
overlaps CUAD's span, by rule 2? Reported per category, not blended — "finds
insurance duties but misses audit rights" is the useful sentence.

**Only these four.** The reader legitimately finds obligations CUAD never marked;
those are not false positives and are not counted against it. This measures
recall — what it missed — and says so on the screen.

## RULE 5 — THE CONTRACT BRIEF IS COVERAGE, NOT ACCURACY

The brief is prose and there is no right answer to compare. What can be measured:
its `watchouts` each carry the wording they rest on, so those spans can be checked
against the categories a lawyer would flag — uncapped liability, exclusivity,
non-compete, anti-assignment, change of control.

Reported as **coverage**: of the risk-shaped clauses CUAD marked, how many did the
brief raise? Never called accuracy. A brief that raised every one would be a list,
not a brief, and choosing what to leave out is the job.

## RULE 6 — HOW IT IS REPORTED

- **Every percentage carries its denominator.** "83% (30/36)", never "83%".
  Warranty duration rests on 20 contracts and notice period on 36; a bare
  percentage hides that.
- **Excluded contracts are named and counted**, with which reason — not marked, or
  not derivable. A silent trim on a number that will end up in a sales deck is the
  fault this whole exercise exists to prevent.
- **`value`, `currency`, `paymentTerms`, `retentionPct`, `retentionReleaseDays`
  and `category` print as *not measured*** with the reason. Not blank, not zero.
- **No single blended accuracy number.** It would average a field resting on 50
  contracts with one resting on 20 and hide whichever is weak. Where a headline is
  wanted for a proposal, it states what it is: the mean of the per-field FOUND
  figures, with the field count beside it.
- **The claim names the number of contracts that ACTUALLY RAN.**
  **CORRECTED 21 Aug 2026.** This first read *"measured at N% against 510
  professionally reviewed contracts"*, and the runner printed exactly that,
  hardcoded. 510 is the size of the whole public CUAD dataset; this scorecard
  uses a chosen 50, and `--n 10` measures ten — so the tool was handing the
  reader a claim backed by ten contracts dressed as five hundred and ten. A
  fifty-fold overstatement, produced by the very tool built to stop
  overstatement.
  The sentence is now built from the run's own count. 510 may be MENTIONED as
  the set the 50 were drawn from, which is true and worth saying, but it can
  never be the number claimed. Never "N% accurate". Credit CUAD (CC BY 4.0).

## WHAT STAGE 4 MUST NOT DO

- Must not re-extract the contracts from PDFs — rule 1.
- Must not run on save. Before a release, and after any change to how a question
  is asked.
- Must not write a second duration reader — rule 3.
- Must not report a field's CORRECT figure against its FOUND denominator.
- Must not treat an obligation CUAD never marked as a false positive.

## HOW BIG A MOVEMENT IS READABLE (measured 21 Aug 2026, and it is smaller than it looks)

**On ten contracts, a change of fewer than about three contracts in a field is
noise.** This is not a caution copied from a statistics book — it was measured
here, by accident, and it retroactively qualifies several readings of these
numbers.

Runs 4 and 5 were the first pair with **byte-identical field-extraction code**:
the only changes between them were inside `/api/ai/obligations` (a length bound
on its quote, and its token ceiling). The extract route, its prompt, its schema
and its inputs were untouched. Same fifty contracts, same ten drawn.

The field-extraction figures still moved:

| | Run 4 | Run 5 | Contracts |
|---|---|---|---|
| Headline (mean FOUND) | 90% | **85%** | — |
| `noticePeriodDays` FOUND | 90% | **70%** | 2 |
| `expiryDate` FOUND | 89% | **78%** | 1 |
| `renewalType` FOUND | 100% | **90%** | 1 |

Four individual answers out of about ninety comparisons came back differently
from identical code — roughly **5% of answers flip between runs**, which is
±5 points on the headline and up to 20 points on one field.

**FOUND IS NOISY; CORRECT IS NOT.** Every CORRECT figure was identical across
the two runs — 80, 100, 83, 100, 100, 100, 100. Where HaTi finds the passage it
gets the answer right consistently; what varies is *which* passage it quotes.
That is worth knowing before anybody spends a day chasing a CORRECT score.

### What follows from it

- **Do not report a one-field, one-contract movement as an improvement.** Two
  such movements were reported that way during this project and at least one of
  them was almost certainly this.
- **A movement of the size run 1 → run 2 (72% → 87%) is real.** Fifteen points
  is three times the noise band.
- **The obligations reader going from 0 to 5 of 14 categories, and 38 to 161
  quoted obligations, is real.** Also far outside it.
- **The way to narrow the band is more contracts, not more runs.** Fifty would
  roughly halve it. Re-running ten proves nothing that ten already proved.
