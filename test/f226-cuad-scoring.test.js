/* f226 — the CUAD scorecard's scoring rules.

   The scorer is what turns "HaTi said X, CUAD marked Y" into a number that
   ends up in a proposal, so its rules are pinned here BEFORE any Copilot
   money is spent proving them. Pure fixtures: no server, no network, no
   corpus, no AI. Runs with the ordinary suite in milliseconds.

   The rules themselves are test/cuad/SCORING.md and the owner's three
   rulings of 21 Aug 2026. Where a claim here disagrees with a comment in
   score.js, this file is right.  */

'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const S = require('../test/cuad/score.js');

const span = (text, at) => ({ text, answer_start: at });

/* ---------- 1. locating HaTi's quote ---------- */

test('f226-1a locate finds the phrase and reports its range', () => {
  const doc = 'This Agreement is governed by the laws of the State of New York.';
  const at = S.locate(doc, 'laws of the State of New York');
  assert.equal(at.length, 1);
  assert.equal(doc.slice(at[0][0], at[0][1]), 'laws of the State of New York');
});

test('f226-1b whitespace differs, the quote still matches — the document is never normalised', () => {
  // CUAD's offsets index the raw text. Flexibility goes in the PATTERN, or
  // every answer in the key would shift.
  const doc = 'terminate\nupon  ninety (90)   days   written notice';
  assert.equal(S.locate(doc, 'ninety (90) days written notice').length, 1);
});

test('f226-1c a phrase that is not in the document does not match', () => {
  assert.equal(S.locate('governed by the laws of Kenya', 'laws of Sweden').length, 0);
});

/* ---------- 2. FOUND: overlap by half the shorter span ---------- */

test('f226-2a overlap is measured against the SHORTER span, so both directions work', () => {
  // A party name is ~16 chars and a liability cap ~290 in the real key.
  // Containment in either direction fails at one end; this must not.
  assert.equal(S.overlaps([100, 116], [90, 380]), true, 'short inside long');
  assert.equal(S.overlaps([90, 380], [100, 116]), true, 'long around short');
});

test('f226-2b a single character of overlap is a near-miss, not a hit', () => {
  assert.equal(S.overlaps([0, 100], [99, 400]), false);
});

test('f226-2c exactly half the shorter span passes', () => {
  assert.equal(S.overlaps([0, 100], [50, 400]), true);
});

test('f226-2d ANY of CUAD spans, not all — CUAD marks parties in several places', () => {
  const doc = 'x'.repeat(40) + 'REYNOLDS CONSUMER PRODUCTS LLC' + 'y'.repeat(40);
  const key = [span('Seller', 0), span('REYNOLDS CONSUMER PRODUCTS LLC', 40)];
  assert.equal(S.foundVerdict(doc, 'REYNOLDS CONSUMER PRODUCTS LLC', key), 'found');
});

test('f226-2e reading from the wrong passage is missed', () => {
  const doc = 'AAAA governed by Kenya BBBB warranty lasts twelve months CCCC';
  const key = [span('governed by Kenya', 5)];
  assert.equal(S.foundVerdict(doc, 'warranty lasts twelve months', key), 'missed');
});

test('f226-2f a paraphrase is NOT-VERBATIM, never folded into missed', () => {
  // Its own defect: those spans are printed as quotations on the upload
  // screen and the renewal card. But the ANSWER may be perfectly right.
  const doc = 'terminable upon ninety (90) days written notice';
  const key = [span('ninety (90) days', 16)];
  assert.equal(S.foundVerdict(doc, '90 days notice required'), 'excluded');
  assert.equal(S.foundVerdict(doc, '90 days notice required', key), 'not-verbatim');
});

test("f226-2g CUAD marked nothing -> excluded, the owner's ruling 3", () => {
  assert.equal(S.foundVerdict('any text', 'any quote', []), 'excluded');
  assert.equal(S.foundVerdict('any text', 'any quote', null), 'excluded');
});

test('f226-2h HaTi answered nothing where CUAD marked something -> missed', () => {
  assert.equal(S.foundVerdict('abc', '', [span('abc', 0)]), 'missed');
});

/* ---------- 3. deriving the truth out of the span ---------- */

test('f226-3a "ninety (90) days" is 90 — the digits in the bracket win', () => {
  assert.deepEqual(S.parseDuration('at least ninety (90) days'), { n: 90, unit: 'day' });
});

test('f226-3b words alone and digits alone both read', () => {
  assert.deepEqual(S.parseDuration('forty-five days'), { n: 45, unit: 'day' });
  assert.deepEqual(S.parseDuration('30 days'), { n: 30, unit: 'day' });
  assert.deepEqual(S.parseDuration('twelve months'), { n: 12, unit: 'month' });
});

test('f226-3c a span with no duration derives nothing rather than guessing', () => {
  assert.equal(S.parseDuration('terminable on reasonable notice'), null);
});

test('f226-3d months against a field measured in DAYS is a RANGE, not a number', () => {
  // CORRECTS SCORING.md, which said "3 months notice is 3 months, not 90
  // days". HaTi's field is noticePeriodDays and must answer in days; a month
  // has no fixed length, so 3 months is anything from 3x28 to 3x31.
  const r = S.durationToDays(S.parseDuration('at least 3 months'));
  assert.deepEqual(r, { lo: 84, hi: 93 });
  const ok = d => d >= r.lo && d <= r.hi;
  assert.equal(ok(90), true, '90 must pass');
  assert.equal(ok(92), true, '92 must pass');
  assert.equal(ok(30), false, 'a month is not three');
});

test('f226-3e days stay exact — no range is invented where the contract is exact', () => {
  assert.deepEqual(S.durationToDays(S.parseDuration('60 days')), { lo: 60, hi: 60 });
});

test('f226-3f dates parse in the forms US filings actually use', () => {
  assert.equal(S.parseDate('this 15th day of March, 2019'), '2019-03-15');
  assert.equal(S.parseDate('March 15, 2019'), '2019-03-15');
  assert.equal(S.parseDate('3/15/2019'), '2019-03-15');
  assert.equal(S.parseDate('2019-03-15'), '2019-03-15');
});

test('f226-3g a span naming only the defined term derives no date', () => {
  // Why effectiveDate derives on 33 of 47: CUAD often marks the term, not
  // the date. Those contracts leave the CORRECT denominator and stay in the
  // FOUND one.
  assert.equal(S.parseDate('the Effective Date'), null);
});

/* ---------- 4. governing law: the list must not be short ---------- */

test('f226-4a the four that a short list got wrong', () => {
  // Scored as underivable on the first pass. The gap was the tooling, not
  // the data — and a short list silently UNDERSTATES the score.
  assert.equal(S.jurisdiction('the laws of Hong Kong'), 'Hong Kong');
  assert.equal(S.jurisdiction('the laws of Spain.'), 'Spain');
  assert.equal(S.jurisdiction('courts of the Province of British Columbia'), 'British Columbia');
  assert.equal(S.jurisdiction('the federal laws of Canada applicable therein'), 'Canada');
});

test('f226-4b longest name wins, so New York never reads as York', () => {
  assert.equal(S.jurisdiction('the laws of the State of New York'), 'New York');
  assert.equal(S.jurisdiction('the Province of British Columbia'), 'British Columbia');
});

test('f226-4c the markets this product sells into are in the list', () => {
  assert.equal(S.jurisdiction('governed by the laws of Kenya'), 'Kenya');
  assert.equal(S.jurisdiction('governed by Swedish law in Sweden'), 'Sweden');
});

test('f226-4d naming the wrong level fails — Kenyan and Swedish law are national', () => {
  const truth = S.jurisdiction('the laws of the State of New York');
  assert.notEqual(truth, S.jurisdiction('the laws of the United States'));
});

/* ---------- 5. the counterparty, under the owner's first-party rule ---------- */

test('f226-5a any party but the first-named is accepted', () => {
  const key = [span('ACME HOLDINGS INC', 0), span('REYNOLDS CONSUMER PRODUCTS LLC', 40)];
  assert.equal(S.counterpartyVerdict('Reynolds Consumer Products', key), true);
});

test('f226-5b naming the first party fails — it is conventionally the drafting side', () => {
  const key = [span('ACME HOLDINGS INC', 0), span('REYNOLDS CONSUMER PRODUCTS LLC', 40)];
  assert.equal(S.counterpartyVerdict('Acme Holdings', key), false);
});

test('f226-5c role words are skipped, or everything would match something', () => {
  // CUAD interleaves role labels with company names — parties average 4.5
  // spans. The roles drop out first, so "first-named" means the first real
  // COMPANY, not the word "Seller".
  const key = [span('Seller', 0), span('ACME HOLDINGS INC', 8),
               span('Buyer', 30), span('NAIVAS LIMITED', 40)];
  assert.equal(S.counterpartyVerdict('Naivas', key), true);
  assert.equal(S.counterpartyVerdict('Acme Holdings', key), false, 'still the first-named');
  assert.equal(S.counterpartyVerdict('Buyer', key), false, 'a role is not a party');
});

test('f226-5c2 one company name and the rest roles cannot be judged -> excluded', () => {
  // The single name IS the first-named, so the owner's rule has nothing to
  // accept. Excluded is the honest answer; guessing would invent a verdict.
  const key = [span('Seller', 0), span('Buyer', 8), span('NAIVAS LIMITED', 20)];
  assert.equal(S.counterpartyVerdict('Naivas', key), null);
});

test('f226-5d corporate suffixes are noise, not a wrong answer', () => {
  assert.equal(S.normCompany('REYNOLDS CONSUMER PRODUCTS LLC'),
               S.normCompany('Reynolds Consumer Products, Inc.'));
});

test('f226-5e fewer than two named parties cannot apply the rule -> excluded', () => {
  assert.equal(S.counterpartyVerdict('Anyone', [span('Seller', 0)]), null);
});

/* ---------- 6. liabilityCapped: three states from two categories ---------- */

test('f226-6a a cap with carve-outs is still a cap', () => {
  assert.equal(S.liabilityTruth([span('cap', 0)], [span('uncapped for IP', 9)]), 'capped');
});

test('f226-6b only uncapped marked reads as uncapped', () => {
  assert.equal(S.liabilityTruth([], [span('uncapped', 0)]), 'uncapped');
});

test("f226-6d the truth speaks HaTi's OWN vocabulary, not a synonym", () => {
  // The first live run reported liabilityCapped CORRECT 0% (0/9) with FOUND
  // at 67%. Not a failure of HaTi: this returned yes/no while HaTi's field is
  // an enum of capped/uncapped/unclear, so every comparison was false. A zero
  // beside a healthy FOUND is a scorer bug until proven otherwise.
  for (const t of [S.liabilityTruth([span('c', 0)], []),
                   S.liabilityTruth([], [span('u', 0)])]) {
    assert.ok(S.LIABILITY_STATES.includes(t),
      t + " is not one of HaTi's states — the comparison would always fail");
  }
  assert.deepEqual(S.LIABILITY_STATES, ['capped', 'uncapped', 'unclear'],
    "must match the enum in /api/ai/extract's file_contract tool");
});

test('f226-6c neither marked is EXCLUDED, never "unclear"', () => {
  // The annotator finding nothing is not the contract being silent, and
  // scoring against that would invent a wrong answer.
  assert.equal(S.liabilityTruth([], []), null);
});

/* ---------- 7. the tally, and how it is reported ---------- */

test('f226-7a excluded contracts never enter a denominator', () => {
  const t = S.newTally();
  S.record(t, { foundV: 'excluded', truth: null, answer: null, compare: () => true });
  assert.equal(t.foundOf, 0);
  assert.equal(t.correctOf, 0);
  assert.equal(t.excludedNotMarked, 1);
});

test('f226-7b FOUND and CORRECT keep SEPARATE denominators', () => {
  // The whole point of two figures: a field can be found and misread, and
  // one denominator must never stand for the other.
  const t = S.newTally();
  S.record(t, { foundV: 'found', truth: '2019-01-01', answer: '2019-01-01', compare: (a, b) => a === b });
  S.record(t, { foundV: 'found', truth: null, answer: 'anything', compare: () => true });
  assert.equal(t.foundOf, 2, 'both count for FOUND');
  assert.equal(t.correctOf, 1, 'only the derivable one counts for CORRECT');
  assert.equal(t.excludedNotDerivable, 1);
});

test('f226-7c found-but-wrong is a real state and is visible', () => {
  const t = S.newTally();
  S.record(t, { foundV: 'found', truth: '2019-01-01', answer: '2019-02-01', compare: (a, b) => a === b });
  assert.equal(t.found, 1);
  assert.equal(t.correct, 0);
  assert.equal(t.correctOf, 1);
});

test('f226-7d not-verbatim counts against FOUND and is reported on its own', () => {
  const t = S.newTally();
  S.record(t, { foundV: 'not-verbatim', truth: 90, answer: 90, compare: (a, b) => a === b });
  assert.equal(t.found, 0);
  assert.equal(t.notVerbatim, 1);
  assert.equal(t.correct, 1, 'the answer can still be right');
});

test('f226-7e every percentage carries its denominator', () => {
  assert.equal(S.pct(30, 36), '83% (30/36)');
  assert.equal(S.pct(0, 0), 'no data');
  assert.ok(!/^\d+%$/.test(S.pct(30, 36)), 'a bare percentage must never be produced');
});

test('f226-7f the six unscoreable fields say WHY, and value names the ruling', () => {
  for (const k of ['value', 'currency', 'paymentTerms', 'retentionPct',
                   'retentionReleaseDays', 'category', 'priceReview']) {
    assert.ok(S.NOT_MEASURED[k], `${k} must state a reason`);
  }
  assert.match(S.NOT_MEASURED.value, /no value category/i);
});

test('f226-7g the headline states what it is and counts its fields', () => {
  const t1 = S.newTally(); t1.found = 9; t1.foundOf = 10;
  const t2 = S.newTally(); t2.found = 7; t2.foundOf = 10;
  const h = S.headline({ a: t1, b: t2 });
  assert.match(h, /mean FOUND across 2 fields/);
  assert.match(h, /80%/);
});

test('f226-7h a field with nothing measured does not drag the headline', () => {
  const t1 = S.newTally(); t1.found = 9; t1.foundOf = 10;
  const empty = S.newTally();
  assert.match(S.headline({ a: t1, b: empty }), /across 1 fields/);
});

/* ---------- 8. the expiry date, which is mostly not written as a date ----------
   Measured on the 50: only 9 of 49 marked spans state a date. 33 state a
   duration instead, which is how a term is ordinarily drafted. */

test('f226-8a a stated date wins and carries no tolerance', () => {
  const t = S.expiryTruth([span('shall expire on March 15, 2024', 0)], []);
  assert.deepEqual(t, { at: '2024-03-15', computed: false });
  assert.equal(S.expiryMatches(t, '2024-03-15'), true);
  assert.equal(S.expiryMatches(t, '2024-03-16'), false, 'a stated date is exact');
});

test('f226-8b a duration ANCHORED to a known effective date is computed', () => {
  const t = S.expiryTruth(
    [span('commence on the Effective Date and continue for an Initial Term of five (5) years', 0)],
    [span('dated as of March 1, 2019', 0)]);
  assert.equal(t.at, '2024-03-01');
  assert.equal(t.computed, true);
});

test('f226-8c a computed expiry allows one day — the ambiguity is the drafting\'s', () => {
  // "for five years from 1 March" does not settle whether the term ends on
  // the anniversary or the day before it. That is the contract's ambiguity,
  // not HaTi's, so it is not scored as an error.
  const t = S.expiryTruth(
    [span('for a term of five (5) years from the Effective Date', 0)],
    [span('March 1, 2019', 0)]);
  assert.equal(S.expiryMatches(t, '2024-03-01'), true);
  assert.equal(S.expiryMatches(t, '2024-02-29'), true, 'the day before passes');
  assert.equal(S.expiryMatches(t, '2024-03-08'), false, 'a week out does not');
});

test('f226-8d a duration with NO stated anchor derives nothing', () => {
  // "a term of ten (10) years" — from when? Assuming the effective date
  // would invent the TRUTH, which is worse than inventing an answer: it
  // marks a correct reading wrong.
  assert.equal(S.expiryTruth([span('This agreement is for a term of ten (10) years.', 0)],
                             [span('March 1, 2019', 0)]), null);
});

test('f226-8e anchored but the effective date is unknown derives nothing', () => {
  assert.equal(S.expiryTruth(
    [span('for five (5) years from the Effective Date', 0)],
    [span('the Effective Date', 0)]), null);
});

test('f226-8f addDuration crosses month and year ends — including a known quirk', () => {
  // PINNED, NOT BLESSED: JS date arithmetic overflows, so one month from 31
  // January lands on 3 March rather than the end of February a lawyer would
  // read. Harmless here — expiry terms are drafted in years, and a computed
  // expiry carries a day of tolerance besides — but it is a wrong answer in
  // principle and is written down so the next reader sees it rather than
  // rediscovering it.
  assert.equal(S.addDuration('2019-01-31', { n: 1, unit: 'month' }), '2019-03-03');
  assert.equal(S.addDuration('2020-02-29', { n: 1, unit: 'year' }), '2021-03-01');
  assert.equal(S.addDuration('2019-12-31', { n: 1, unit: 'day' }), '2020-01-01');
});

/* ---------- 9. the published claim must not overstate ----------
   The runner prints a suggested wording for any figure that leaves the
   building. It first said "measured at N% against 510 professionally reviewed
   contracts" — hardcoded, while `--n 10` measures ten. A fifty-fold
   overstatement, printed by the tool built to prevent overstatement, and
   caught by an operator reading the output rather than by any test here.

   Source-pinned rather than behaviour-pinned: the claim is one console.log in
   the runner, and running the runner costs money. The f215/f222 pattern. */

const fs = require('node:fs');
const path = require('node:path');
const RUNNER = fs.readFileSync(path.join(__dirname, 'cuad', 'run.js'), 'utf8');
/* comments legitimately DISCUSS the old wording — strip them before asserting */
const RUNNER_CODE = RUNNER.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('f226-9a the runner never prints a hardcoded "against 510"', () => {
  assert.ok(!/against 510/i.test(RUNNER_CODE),
    'the claim must not name 510 as the number measured');
});

test('f226-9b the claim is built from the run\'s own contract count', () => {
  const claim = RUNNER_CODE.split('\n').filter(l => /Claim as/.test(l)).join('\n');
  assert.ok(claim, 'the runner must still print a suggested claim');
  assert.match(claim, /\$\{n\b/, 'the claim must interpolate the actual count');
});

test('f226-9c "N% accurate" is still refused, and CUAD still credited', () => {
  assert.match(RUNNER_CODE, /never "N% accurate"/);
  assert.match(RUNNER_CODE, /CC BY 4\.0/);
});

/* ---------- 10. a short run must still span the book ---------- */

const row = (group, title) => ({ group, title });
const BOOK = [
  ...Array.from({ length: 10 }, (_, i) => row('procurement', 'p' + i)),
  ...Array.from({ length: 10 }, (_, i) => row('manufacturing', 'm' + i)),
  ...Array.from({ length: 6 }, (_, i) => row('equipment', 'e' + i)),
  ...Array.from({ length: 12 }, (_, i) => row('distribution', 'd' + i)),
  ...Array.from({ length: 6 }, (_, i) => row('marketing', 'k' + i)),
  ...Array.from({ length: 6 }, (_, i) => row('services', 's' + i)),
];

test('f226-10a ten contracts reach every group, not ten of one', () => {
  // The fault: selection.json is group-ordered, so slice(0,10) returned ten
  // procurement contracts — the pharma-skewed ones stage 1 warned about.
  const got = S.spreadAcrossGroups(BOOK, 10);
  assert.equal(got.length, 10);
  assert.equal(new Set(got.map(r => r.group)).size, 6, 'all six groups represented');
  const naive = BOOK.slice(0, 10);
  assert.equal(new Set(naive.map(r => r.group)).size, 1, 'and the old way really did take one');
});

test('f226-10b the full run is untouched — same contracts, every one', () => {
  assert.equal(S.spreadAcrossGroups(BOOK, 0).length, BOOK.length);
  assert.equal(S.spreadAcrossGroups(BOOK, 999).length, BOOK.length);
  assert.deepEqual(S.spreadAcrossGroups(BOOK, 0), BOOK, 'no limit means no reordering at all');
});

test('f226-10c order within a group is preserved — best-covered first', () => {
  // selection.json sorts each group by how much of the answer key it has.
  const got = S.spreadAcrossGroups(BOOK, 12).filter(r => r.group === 'procurement');
  assert.deepEqual(got.map(r => r.title), ['p0', 'p1']);
});

test('f226-10d a limit larger than one group still fills from the others', () => {
  const small = [row('a', 'a0'), row('b', 'b0'), row('b', 'b1'), row('b', 'b2')];
  const got = S.spreadAcrossGroups(small, 3);
  assert.deepEqual(got.map(r => r.title), ['a0', 'b0', 'b1']);
});

test('f226-10e asking for more than exists returns everything, without looping', () => {
  const small = [row('a', 'a0'), row('b', 'b0')];
  assert.equal(S.spreadAcrossGroups(small, 50).length, 2);
});

/* ---------- 11. the obligations reader, and WHY a zero happened ----------
   The first live run scored 0% on all four categories. Three different causes
   look identical from a zero, so they are told apart. Proved with fixtures in
   the shape /api/ai/obligations really returns — {obligations:[{desc, quote}]} —
   which is the check that should have run before any money was spent. */

const OB_DOC =
  'Section 8. AUDIT. Buyer may, on reasonable notice, audit the books and ' +
  'records of Seller to verify compliance with this Agreement. ' +
  'Section 9. PAYMENT. Buyer shall pay each invoice within thirty (30) days.';
const OB_KEY = [span('Buyer may, on reasonable notice, audit the books and records of Seller', 21)];

test('f226-11a a quoted obligation on the right clause registers as found', () => {
  // The reader is NOT broken if this passes — which is what the free half of
  // the diagnosis had to establish before asking anyone to pay for a re-run.
  const items = [{ desc: 'Allow buyer audits', quote: 'audit the books and records of Seller' }];
  assert.equal(S.obligationMatch(OB_DOC, items, OB_KEY), 'found');
});

test('f226-11b obligations about OTHER clauses are "elsewhere", not a failure', () => {
  // A real and useful finding about scope: the reader found genuine
  // obligations, they are simply not the four CUAD marks.
  const items = [{ desc: 'Pay within 30 days', quote: 'pay each invoice within thirty (30) days' }];
  assert.equal(S.obligationMatch(OB_DOC, items, OB_KEY), 'elsewhere');
});

test('f226-11c obligations with NO quote are their own answer', () => {
  // `quote` is optional in the tool schema — required is ['desc'] alone — and
  // js/obligations.js prints it only if present. An obligation that cannot be
  // traced back to the wording is a product defect worth naming, not a miss.
  const items = [{ desc: 'Allow buyer audits' }, { desc: 'Pay on time', quote: '  ' }];
  assert.equal(S.obligationMatch(OB_DOC, items, OB_KEY), 'no-quotes');
});

test('f226-11d nothing returned at all is distinct from all of the above', () => {
  assert.equal(S.obligationMatch(OB_DOC, [], OB_KEY), 'none-returned');
  assert.equal(S.obligationMatch(OB_DOC, null, OB_KEY), 'none-returned');
});

test('f226-11e CUAD marked nothing -> excluded, ruling 3 again', () => {
  assert.equal(S.obligationMatch(OB_DOC, [{ desc: 'x', quote: 'y' }], []), 'excluded');
});
