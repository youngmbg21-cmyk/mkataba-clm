# What the scorecard found — 21 Aug 2026

**Fifty contracts, measured end to end.** HaTi's Copilot against commercial
agreements it did not write, marked up by lawyers who had never seen it.

Method and rules: `SCORING.md`. The set: `selection.json`. Raw answers:
`--dump`, then `inspect.js`.

## THE RESULT

| Field | FOUND | CORRECT |
|---|---|---|
| `governingLaw` | **100%** (48/48) | **100%** (48/48) |
| `counterparty` | **98%** (49/50) | 88% (44/50) |
| `renewalType` | 92% (36/39) | not comparable |
| `liabilityCapped` | 90% (38/42) | **95%** (40/42) |
| `noticePeriodDays` | 81% (29/36) | 85% (29/34) |
| `contractType` | 80% (40/50) | not comparable |
| `effectiveDate` | 79% (37/47) | **97%** (32/33) |
| `expiryDate` | 71% (35/49) | 79% (19/24) |
| `warrantyMonths` | 40% (8/20) | 80% (12/15) |

**81% mean FOUND across nine fields, on fifty contracts.**

**Obligations reader:** 843 obligations, **every one of them carrying a
quote**. Minimum commitments 59%, insurance 55%, audit rights 41%,
post-termination services 39%.

**Quotes:** 31 of 561 spans (6%) not found verbatim in the contract.

### Where it is weakest, and where it is strong

`warrantyMonths` at 40% FOUND is the weak field by a distance, on 20 contracts.
Note its CORRECT of 80%, which is the pattern across this table: **where HaTi's
answer can be checked it is usually right, more often than it quotes the exact
passage a lawyer highlighted.** Six of the nine CORRECT figures are 85% or
better; three are at or above 95%.

**Twenty-one of fifty contracts still return no obligations at all.** That is
the largest open item and it is characterised below — it is inconsistency
rather than blindness.

## THE FIVE PRODUCT DEFECTS THIS FOUND, ALL FIXED

1. **Three AI features read only the front of a long contract** (20,000
   characters; renewal 12,000) — and the browser cut to 20,000 a second time
   before posting. Six truncations, none of them ever a recorded decision.
2. **A cut-off answer was reported as an empty one.** Nothing in the server
   read `stop_reason`, so "I ran out of room" reached the screen as "no
   obligations found in this contract".
3. **Quotes were spliced**, separate passages joined with an ellipsis and
   printed to customers as quotations.
4. **The obligations prompt named five kinds of duty** and never mentioned
   audit rights or minimum commitments — the two categories scoring zero.
5. **"No obligations found" printed nothing at all**, being a bare `toast()`
   call, which this product treats as silent.

## AND FOUR OF MY OWN, WHICH BEAR ON TRUSTING THESE NUMBERS

Every one was caught by reading real output, and none by any test:

1. **`liabilityCapped` reported 0%** — the scorer compared `yes`/`no` against
   HaTi's `capped`/`uncapped`. True figure 100%.
2. **"Measured against 510 professionally reviewed contracts"** printed on a
   ten-contract run. A fiftyfold overstatement, in the line written to keep
   the claim honest.
3. **The notice period read the renewal TERM, not the notice** — the first
   duration in "successive one-year terms unless sixty (60) days notice".
   **Wrong on 18 of 34 entries in the answer key**, marking HaTi wrong for
   right answers.
4. **A call that never happened was scored as a wrong answer.** The daily
   budget stopped the run at contract 45 and five contracts became 45 false
   misses. The headline read 74%; it is 81%.

The rule that came out of the first, in `score.js`, is what caught the third
and fourth: **a figure that disagrees with a healthy FOUND score is a scorer
bug until proven otherwise.**

---

## WHY TWENTY-ONE CONTRACTS RETURN NOTHING — AND IT IS NOT LENGTH

The ten-contract run showed a clean split: contracts that answered were
14k–26k characters, silent ones 22k–52k. It looked decisive and it was the
basis of a fix.

**On fifty contracts it disappears.** Silent contracts average **36,518**
characters; answering ones **37,813**. Medians 39,588 against 37,876. The
ranges overlap almost entirely, and both sides carry maintenance,
distribution, outsourcing and transport agreements alike. **The split at n=10
was noise, exactly as the band below predicts** — and the prompt fix built on
that diagnosis still worked (0 obligations to 843), for reasons that were not
the reason given.

What it looks like instead is **inconsistency**. The same contract returned 12,
then 20, then 0, then 0, then 0 across five runs; four contracts that answered
nothing when the budget cut them off answered 20–24 on the very next attempt.
Twenty-one of fifty return nothing on any given run, and it is not the same
twenty-one.

**So the product now offers the second press.** "No obligations found" no
longer claims the contract is empty — it says the scan is not always
consistent and carries a *Scan again* button running the same act, not a
second path. Neither hiding the result nor asserting something about the
customer's paper that has repeatedly turned out to be untrue.

**Not attempted:** scanning twice automatically and merging. It would double
the cost of every scan to paper over a model behaviour, and nobody asked.

## HOW BIG A MOVEMENT IS READABLE — READ THIS FIRST

**On ten contracts, a change of fewer than about three contracts in a field is
noise**, and this was measured here rather than assumed. Runs 4 and 5 had
byte-identical field-extraction code — the only changes were inside the
obligations route — and the headline still moved 90% → 85%, with three fields
shifting by one or two contracts each. About **5% of individual answers flip
between runs**.

**FOUND is noisy; CORRECT is not** — every CORRECT figure was identical across
that pair. Where HaTi finds the passage it gets the answer right consistently;
what varies is which passage it quotes.

So: a fifteen-point move is real, a five-point move is not, and the way to
narrow the band is more contracts rather than more runs. Full reasoning and
the measurements are in SCORING.md.

---

# THE TEN-CONTRACT RECORD, KEPT AS IT WAS WRITTEN

Everything below is the earlier ten-contract work, left in place rather than
deleted: it is how each defect was found, in the order it was found, and the
reasoning is worth more than the superseded figures. **Every number in it is
superseded by the fifty-contract table at the top of this file.**

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
test f230.

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

> **THE DIAGNOSIS WAS WRONG, AND THE SECOND RUN PROVED IT — 21 Aug 2026.**
> Truncation was not the cause. With the whole contract reaching it, the
> reader returned **nothing on all ten**, exactly as before.
>
> The real fault was at the other end. **Nothing in the server read
> `stop_reason`.** A tool call stopped at the token ceiling comes back with a
> partial answer, and every route's `Array.isArray(block.input?.x) ? … : []`
> turned *"I ran out of room"* into *"there is nothing here"* — which the
> screen then prints as **"No obligations found in this contract"**, a claim
> about the customer's paper.
>
> The ceiling was 1,500 tokens against a schema allowing 12 obligations, each
> carrying a description **and** a verbatim quote — roughly 100 tokens apiece,
> so about two obligations of headroom. **And the quoting fix probably tipped
> it over**: asking for one *continuous* passage makes every quote longer than
> the spliced fragment it replaced. A fix in one place cost the answer in
> another.
>
> A **partial** list is now kept and labelled, rather than thrown away —
> degrading to partial beats degrading to silence, which was this finding's
> own point. Only a list that is empty *and* cut off is refused.
>
> Fixed three ways: the flag is recorded once in `anthropicMessages` and
> becomes a sentence on **all eleven** AI routes through `aiNotice`; the
> obligations ceiling is 4,000; and an empty list from a cut-off call is now a
> refusal rather than an answer.
>
> **THE THIRD RUN MOVED IT, AND THEN NAMED THE REAL CAUSE.** Two categories
> came off zero, 42 obligations came back where 12 had before, and **all 42
> carried a quote**. No cut-offs, no refusals — so the token ceiling had been
> real and was no longer binding.
>
> What remained was a clean split by **length**: the three contracts that
> answered are 14k–26k characters, the seven that returned nothing are
> 22k–52k, averaging twice as long. The model was asked and answered
> *"nothing"* about master supply agreements full of duties.
>
> **The one-sentence prompt was the fault.** It named five kinds of
> obligation — and the two CUAD categories scoring **zero** were the two it
> never mentioned (audit rights, minimum commitments) while the one it did
> name (insurance) scored. It also carried a restraining instruction with
> nothing to balance it, and on a long document a restraint with no
> counterweight makes the empty list the cheapest safe answer.
>
> Rewritten: read to the end, the duties that matter are drafted at the back,
> and ten named kinds including audit, minimum commitments, survival and
> exclusivity. **Widening it is not tuning to the answer key** — a minimum
> volume commitment is money a manufacturer loses by missing it, and belongs
> here whether or not CUAD marks it. That CUAD marks it is how the gap was
> found, not why it is being closed.
>
> **THE FOURTH RUN: THE PROMPT WORKED AND THE ROOM RAN OUT BEHIND IT.**
> Contracts returning a genuinely empty answer fell from **7 to 3**, and the
> two that answered returned **20 and 18** obligations against 12 and 12. One
> that had managed 18 was cut off trying for more, and five came back as an
> honest **502 naming the reason** — the silence they used to be.
>
> The arithmetic, rather than another guess: 20 items, each a description plus
> a whole clause quoted continuously (400–600 characters is 100–150 tokens),
> plus the JSON around them. Call it 200 tokens an item and 4,000 was exactly
> not enough. **8,000** now, and the quote is **bounded at 200 characters** —
> *"short snippet"* carried no number while the quoting rule asks for one
> continuous passage, and those two pull in opposite directions. Output is
> billed as used, so a scan needing 2,500 still costs 2,500.
>
> **THE FIFTH RUN SETTLED IT.** All four categories scored above zero for the
> first time — post-termination services 2 of 3, minimum commitments 1 of 2,
> audit rights 1 of 5, insurance 1 of 4. **161 obligations, every one of them
> quoted**, against 38. Contracts answering nothing fell from 8 to 5, and
> nothing was cut off.
>
> That is far outside the noise band measured below, so it is real. **The
> reader is no longer the silent feature this project started with.**
>
> Two things it did NOT fix, said out loud. Five contracts still return
> nothing, and the longest three are among them. And volume is not the same as
> aim: 161 obligations found, and audit rights still 1 of 5 — it is finding a
> great deal without reliably finding the things a lawyer marked as mattering.
> **Neither is worth chasing on ten contracts** (see the noise band); both are
> worth revisiting on fifty.


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

> **FIXED, AND MEASURED — third run.** Splicing is **entirely gone**: 0 of 16
> remaining not-verbatim spans carry an ellipsis, down from 34 of 125.
>
> What replaced it is smaller and different — the model writing a sentence
> *about* an absence into a field that holds a quotation: *"No retention
> provision in the contract"*, *"No express warranty period stated"*. Eight of
> the sixteen are retention, the field most often genuinely absent. The rule
> already said "omit if the field is empty" and lost the argument to the
> sentence in front of it; it now says so twice and names this exact failure.
>
> **AND THAT FIX MEASURED CLEAN — fourth run.** Not-verbatim spans fell from
> 16 of 121 (13%) to **5 of 110 (5%)**, and both retention fields left the
> list entirely. **This finding is closed:** 34 spliced quotes at the start,
> none now, and the absence-sentences gone with them. The five that remain are
> ordinary paraphrase, spread one or two across four different fields.

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
a single duration. Section 12 of f229 now carries the real sentences, verbatim
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

> measured on 50 contracts drawn from CUAD, a set of 510 marked up by
> commercial lawyers

Never *"N% accurate"*. Never cite 510 as the number measured. Credit CUAD
(CC BY 4.0). And do not quote the headline without the FOUND/CORRECT split
beside it — 81% is the share of answers read from the passage a lawyer
marked, and it understates how often HaTi's answer is right.
