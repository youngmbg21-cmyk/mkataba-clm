# Stage 2 — matching CUAD's 41 categories to HaTi's fields

Written 21 Aug 2026. Stage 1 (the 50 contracts) is in `selection.json`; the
reasoning for the whole exercise is in `WORKORDER-cuad-scorecard.md`.

## THE THING STAGE 2 DISCOVERED, AND IT REVERSES A STAGE 1 CLAIM

Stage 1 reported that pricing is redacted in 19 of the 50 and recommended scoring
`value` only where a price is stated. The owner ruled exactly that.

**The ruling cannot be carried out against CUAD's answer key, and the reason is
deeper than redaction: CUAD has no value category at all.** All 41 were read from
`category_descriptions.csv`. The nearest four are *Revenue/Profit Sharing*
(is revenue shared?), *Price Restrictions* (may a party raise prices?), *Minimum
Commitment* (minimum order size) and *Liquidated Damages* (termination fee). Not
one asks what the agreement is worth.

Redaction was real but secondary. Even on the 31 contracts that state a price,
there is nothing to compare HaTi's answer against.

The same is true of `currency`, `paymentTerms`, `retentionPct` and
`retentionReleaseDays` — HaTi extracts them, CUAD never marked them.

## CUAD FINDS CLAUSES; HaTi EXTRACTS FIELDS

The two are not the same job, and every scoring decision below follows from it.

CUAD asks *"highlight the parts related to Governing Law"* and answers with a
span of text. HaTi asks *"what is the governing law?"* and answers with a
normalised value **plus** the span it read it from — the `sourceSpans` the upload
screen prints under each field.

So there are **two different measurements**, and they must never be reported as
one number:

- **Did HaTi look in the right place?** HaTi's span against CUAD's span. Works
  for every mapped field, fully automatic, no human judgement.
- **Did HaTi get the right answer?** Needs normalised truth. CUAD supplies none,
  so where this is scoreable at all it is *derived* from CUAD's span — parsing
  "ninety (90) days" down to 90 and comparing.

A field can pass the first and fail the second. That is a real and useful state:
it means the reading is right and the interpretation is wrong.

## THE MAP

Coverage is out of the 50 selected contracts.

| HaTi field | CUAD category | Coverage | Location | Value |
|---|---|---|---|---|
| `effectiveDate` | Effective Date | 47/50 | yes | yes — parse the date |
| `expiryDate` | Expiration Date | 49/50 | yes | yes — parse the date |
| `noticePeriodDays` | Notice Period to Terminate Renewal | 36/50 | yes | yes — parse days |
| `governingLaw` | Governing Law | 48/50 | yes | yes — name match |
| `warrantyMonths` | Warranty Duration | 20/50 | yes | yes — parse months |
| `liabilityCapped` | Cap on Liability + Uncapped Liability | 42/50 | yes | yes — see Q3 |
| `counterparty` | Parties | 50/50 | yes | needs a ruling — Q2 |
| `contractType` | Document Name | 50/50 | yes | fuzzy only |
| `renewalType` | Renewal Term | 39/50 | yes | **location only** |
| `priceReview` | Price Restrictions | 5/50 | — | **too thin, dropped** |
| `category` | none | — | — | HaTi's own six streams |
| `value` | **none** | — | — | **not scoreable** |
| `currency` | **none** | — | — | **not scoreable** |
| `paymentTerms` | **none** | — | — | **not scoreable** |
| `retentionPct` | **none** | — | — | **not scoreable** |
| `retentionReleaseDays` | **none** | — | — | **not scoreable** |

**Six of sixteen score fully. Two score on location with a ruling. One is
location-only. One is too thin. Six cannot be scored at all.**

`priceReview` is dropped on the stage 1 floor: below six contracts one document
moves the figure by 20% and the number is noise, not a measurement.

### THE OBLIGATIONS READER SCORES BETTER THAN THE FIELDS DO

Four categories are obligation-shaped and well covered — each is a promise that
survives signature, which is exactly what that feature exists to find:

| CUAD category | Coverage |
|---|---|
| Post-Termination Services | 23/50 |
| Audit Rights | 23/50 |
| Minimum Commitment | 23/50 |
| Insurance | 20/50 |

Scored on location: did the obligations reader surface a commitment anchored in
the passage CUAD marked? This needs no normalised truth at all, which makes it
the cleanest measurement in the whole exercise.

## THE RULINGS

Proposed answers. Marked **[decided]** where the reading is obvious and I have
taken it, **[owner]** where it materially changes what gets measured.

**Q1 — `value`, given there is no key. [owner]**
Either drop value from the scorecard and say so, or hand-mark a value key on the
31 contracts that state a price. Hand-marking honours the owner's ruling and
costs somebody an afternoon reading 31 contracts. Dropping costs nothing and
leaves the field unmeasured. My recommendation is to drop it here and measure
value later against the business's own paper, where the currency is right too.

**Q2 — which party is the counterparty? [owner]**
CUAD marks every signatory. HaTi records *the other side*, and on a stranger's
contract there is no "us". Proposal: HaTi is correct if its answer matches any
marked party **other than the first-named**, since the first-named is
conventionally the drafting party. This is a convention, not a rule, and it will
be wrong sometimes.

**Q3 — `liabilityCapped` has three states, CUAD has two categories. [owner]**
Proposal: *Cap on Liability* marked → `yes`. Only *Uncapped Liability* marked →
`no`. Both marked → `yes`, because a cap with carve-outs is still a cap. Neither
marked → **excluded from scoring, not counted as `unclear`** — CUAD's silence
means the annotator found nothing, which is not the same as the contract being
silent, and scoring HaTi against an absence would invent a wrong answer.

**Q4 — several notice periods in one contract. [decided]**
Contracts routinely set one notice period for renewal, another for termination
for convenience, another for breach. CUAD marks the renewal one specifically.
HaTi's `noticePeriodDays` feeds the renewal card's deadline, so only the renewal
notice counts as correct. A contract's other notice periods are not wrong
answers to a different question — they are wrong answers to this one.

**Q5 — "ninety (90) days" against 90. [decided]**
Correct. Legal drafting writes numbers twice and HaTi already reads both forms
elsewhere — `precedentFigure` parses "forty-five (45) days" for exactly this
reason. The scorer reuses that reading rather than growing a second one.

**Q6 — how exact must the governing law be? [decided]**
Accept any answer naming the jurisdiction CUAD's span names. "New York", "State
of New York" and "New York, USA" all pass against *"the laws of the State of New
York"*. Naming the wrong jurisdiction fails; naming a country where the span
names a state fails, because Kenyan and Swedish law are national and getting the
level wrong there is a real error.

**Q7 — agreement date against effective date. [decided]**
Different fields in CUAD and different facts. A contract signed on 1 March and
effective 1 April has both. HaTi's field is the effective date, so the agreement
date is wrong. No leniency: the renewal arithmetic counts from the effective
date, and being a month out is the kind of error this scorecard exists to catch.

## WHAT STAGE 3 INHERITS

- Two figures per field, never one: **found the right place** and **got the right
  answer**.
- Ten fields measurable, of which six fully.
- Four obligation categories, location-scored.
- Six fields CUAD cannot speak to, `value` among them — stated on the scorecard
  as *not measured*, never shown as zero. A blank and a nought are different
  claims and the screen must not confuse them.
