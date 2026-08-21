# WORKORDER — Copilot accuracy scorecard (CUAD)

Stage 1 of five: **choose the contracts.** Written 21 Aug 2026.

The other four stages — match the vocabulary, agree what counts as correct, build
the run, decide the cadence — are NOT done and are not described here beyond what
stage 1 constrains.

## What this is for

Every one of HaTi's sixteen Copilot features is currently tested against sample
contracts HaTi wrote for itself. That is marking our own homework. CUAD is 510
real commercial contracts with 13,101 clauses highlighted by hand by lawyers,
across 41 categories — an outside answer key.

The point is not a number for its own sake. It is (a) a tripwire, so a prompt
change that quietly makes Copilot worse is caught the same week, and (b) a
defensible sentence for a cautious buyer.

## THE ONE THING THAT MAKES THIS CHEAP

`/api/ai/extract` already instructs the model: *"For every field you fill in, also
return the short verbatim phrase it came from in sourceSpans, copied exactly from
the document."* Those spans are what the upload confirm screen prints under each
field, and what the renewal card quotes when it names where a notice period came
from.

CUAD's answer key is **also** verbatim spans — highlighted passages, not a list of
values. So the two line up span-against-span and can be compared mechanically.
Had HaTi reported bare values, a human would have to hand-judge every answer and
this would not be a four-day job.

**Do not remove sourceSpans to save tokens.** It is now load-bearing twice over.

## The corpus, verified

510 contracts, 25 types, from the U.S. SEC's EDGAR system. CC BY 4.0 — free
commercially, on one condition: **credit CUAD wherever an accuracy figure is
published.** That obligation attaches to the marketing claim, not to the code.

Ships as 510 PDFs *and* 510 plain-text files, plus the answer key. The PDFs matter
as much as the text: they let the scorecard exercise the whole chain — PDF
reading, then extraction, then the AI — rather than the AI alone. HaTi's
file-reading code has no real-world test today.

## STAGE 1 IS BLOCKED ON THE DOWNLOAD, AND THE SELECTION IS NOT

The egress proxy denies zenodo.org and github.com file downloads with a 403
policy denial. Per the proxy's own README a policy denial is reported, never
worked around. So the files are not here.

The selection work does not need them. What follows is decided off the published
catalogue and is what the download gets applied to on arrival.

## WHICH CONTRACT TYPES, AND WHY

HaTi's own shape is the constraint: a food and beverage manufacturer, six streams,
twelve templates. CUAD's 25 types map onto that unevenly, and the mismatch is the
finding.

| HaTi stream | HaTi templates | Drawn from CUAD | Available |
|---|---|---|---|
| Procurement & Raw Materials | Raw Material Supply, Packaging Supply | Supply | 18 |
| Manufacturing & Production | Contract Manufacturing | Manufacturing, Outsourcing | 35 |
| Manufacturing & Production | Equipment Lease & Maintenance | Maintenance | 34 |
| Warehousing & Distribution | Freight & Distribution | Transportation | 13 |
| Sales & Route-to-Market | Distributor, Retail Listing | Distributor, Reseller, Agency | 57 |
| Marketing & Brand | Marketing & Trade Promotion | Marketing, Promotion, Sponsorship, Endorsement, Co-Branding | 106 |
| Corporate & Compliance | Professional Services | Service, Consulting | 39 |

### TWO OF THE TWELVE TEMPLATES HAVE NO EQUIVALENT AND CANNOT BE SCORED

- **Mutual NDA.** CUAD has no non-disclosure type. Companies do not file NDAs as
  material contracts, so EDGAR does not hold them. The nearest neighbour is
  Non-Compete / No-Solicit / Non-Disparagement, of which there are **3** — a
  different instrument, and too few to yield a percentage anyway.
- **Commercial Property Lease.** No lease type at all, for the same reason.

This is not a small omission and it is stated rather than buried. The NDA is the
one built-in carrying `valueType:'none'`, so it is the template that exercises
`isMonetary`'s refusal path; the lease is one of only three carrying
`valueType:'fixed'`. Both are corner cases the rest of the set will not reach.

**The way out is the owner's call, and is deferred to stage 2:** either supply
3–5 real NDAs and leases from the business, redacted, with the key marked by
hand — or accept out loud that those two templates are unmeasured.

### DELIBERATELY EXCLUDED

Affiliate (10), Collaboration (26), Development (29), Franchise (15), Hosting
(20), IP (17), Joint Venture (23), License (33), Non-Compete (3), Strategic
Alliance (32) — 208 contracts left on the shelf. The 302 that remain are the
pool the 50 are drawn from; 208 + 302 = 510, which is the check that the type
figures above are the real ones.

These are corporate, technology and joint-venture instruments. HaTi's customers
do not raise them, and padding the set with them would buy a bigger number that
answers a question nobody asked.

## THE SET: 50 CONTRACTS

Weighted to what the business actually signs, with a floor per group so a
percentage means something. Below roughly six contracts, one contract is 17% and
the figure is noise rather than a measurement.

| Group | Composition | Count |
|---|---|---|
| Procurement & supply | Supply ×10 | 10 |
| Manufacturing & plant | Manufacturing ×6, Outsourcing ×4 | 10 |
| Equipment & maintenance | Maintenance ×6 | 6 |
| Distribution & route-to-market | Distributor ×7, Reseller ×3, Transportation ×2 | 12 |
| Marketing & brand | Marketing ×3, Sponsorship ×2, Promotion ×1 | 6 |
| Professional services | Service ×4, Consulting ×2 | 6 |
| **Total** | | **50** |

Distribution carries the most weight because Sales and Warehousing together hold
four of the twelve templates and are where this business concentrates. Marketing
takes only 6 of the 106 available, because HaTi has exactly one marketing
template and a bigger sample would flatter a stream nobody negotiates hard.

## THE RULES FOR PICKING WITHIN A TYPE

Applied on arrival, in this order:

1. **The answer key must cover what is being scored.** A contract CUAD never
   marked a governing law in cannot score governing law. Check first; it is the
   only rule that can disqualify outright.
2. **Short over long.** Cost scales with length and a 200-page master agreement
   is not what a customer uploads. Target 15–20 pages. This is the main lever on
   the bill.
3. **A real term, with a renewal.** The renewal adviser, `effectiveExpiry` and the
   notice-period arithmetic all need a term to find. Perpetual and one-shot
   agreements score nothing on the fields that matter most here.
4. **Money on the page — but not everywhere.** Keep **3 deliberately
   non-monetary**, because `isMonetary` has a refusal path that the seeded
   samples exercise and real paper rarely does.
5. **Spread the filing years.** Older EDGAR scans are dirtier. That is a feature.
6. **Include 5 poor-quality or scanned PDFs on purpose.** HaTi's OCR route has no
   real-world test at all today. This is the cheapest one it will ever get.

Rules 5 and 6 are the ones a tidier selection would drop. They stay: the contracts
customers upload are not clean.

## WHAT THIS COSTS

~50 contracts × the features under measurement, which is a few hundred Copilot
calls a run. HaTi already meters spend by feature and by person, so the first run
reports the true figure rather than an estimate — and the set shrinks if it comes
back higher than the owner wants.

It must not run on save. Before a release, and after any change to how a question
is asked.

## WHAT STAGE 1 DOES NOT SETTLE

- Which features are measured first. Recommended: the contract brief, field
  extraction on upload, and the obligations reader — the three customers lean on.
  The playbook and renewal adviser follow.
- Every question of what counts as a right answer. Two termination notice periods
  in one contract, "ninety (90) days" against "90 days", a one-sentence quote
  inside a paragraph-length key. Those are stage 3 and they are the owner's
  rulings, not a coding decision.
- The NDA and lease gap above.

## THE HONEST LIMITS OF THE WHOLE EXERCISE

**The contracts are American.** Delaware and New York law, dollars, US drafting.
For *can HaTi find the governing law clause* that is fine — the skill transfers.
For anything specific to Kenya or Sweden it says nothing, and no score from this
set may be quoted as if it did.

**A score is not a guarantee.** It reports how HaTi did on 50 contracts of a
particular kind. The sales line is "measured at N% against 510 professionally
reviewed contracts", never "N% accurate".

**The first result may be unflattering.** A feature assumed solid may score badly.
That is the reason to do it, and it should surprise nobody.
