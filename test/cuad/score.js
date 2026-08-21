/* CUAD scorecard — the scoring rules, and nothing else.

   Stage 4 of the work order. This file is PURE: no network, no server, no
   filesystem, no AI. Everything here is a function from (what CUAD marked,
   what HaTi answered) to a verdict, which is what lets f226 prove every rule
   against fixtures for nothing before a single Copilot call is paid for.

   The rules themselves are test/cuad/SCORING.md. Where a rule is subtle the
   reason is repeated here, because a scorer whose reasoning lives only in
   another file is one somebody will "simplify" later.

   TWO FIGURES PER FIELD, NEVER ONE (SCORING.md, and the reason it exists):
   FOUND asks whether HaTi read from the passage CUAD marked; CORRECT asks
   whether it got the answer right. A field that is FOUND-but-not-CORRECT
   located the right sentence and misread it — a different defect with a
   different fix, and averaging the two hides it. They are never combined. */

'use strict';

/* ---------- locating HaTi's quote in the contract ----------
   CUAD stores offsets into the contract's own text; HaTi returns the phrase
   itself, copied "exactly from the document". So the phrase is located and
   the two character ranges are compared.

   The document is NEVER normalised — CUAD's offsets index it exactly as it
   is, and collapsing its whitespace would shift every answer in the key.
   Flexibility goes into the PATTERN instead: runs of whitespace in the
   needle match runs of whitespace in the document, which is the one
   difference a model reliably introduces when copying. */
const _esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function locate(doc, phrase) {
  const p = String(phrase || '').trim();
  if (!p) return [];
  const pattern = p.split(/\s+/).map(_esc).join('\\s+');
  let re;
  try { re = new RegExp(pattern, 'gi'); } catch (_) { return []; }
  const out = [];
  for (const m of doc.matchAll(re)) {
    out.push([m.index, m.index + m[0].length]);
    if (out.length > 50) break;          // a phrase this common tells us nothing
  }
  return out;
}

/* OVERLAP: at least half the SHORTER span.

   Symmetric by the shorter span because the two sides differ by an order of
   magnitude — measured on the 50, a party name runs 16 characters and a
   liability cap 290. Containment in either direction fails at one end or the
   other; this works at both.

   Half rather than one character because a single character at a boundary is
   a near-miss, not a hit. The threshold is a JUDGEMENT, not a discovery — it
   is re-checked against real HaTi spans on ten contracts before the first
   full run (SCORING.md). */
const OVERLAP_MIN = 0.5;

function overlaps(a, b, min = OVERLAP_MIN) {
  const hit = Math.min(a[1], b[1]) - Math.max(a[0], b[0]);
  if (hit <= 0) return false;
  const shorter = Math.min(a[1] - a[0], b[1] - b[0]);
  return shorter > 0 && hit / shorter >= min;
}

/* FOUND, and its third answer.

   'not-verbatim' is its own result and is never folded into 'missed': the
   model paraphrased instead of quoting, which is a real defect — those spans
   are printed as quotations on the upload confirm screen and the renewal
   card — but the ANSWER may be perfectly right. Different fault, different
   fix, so it is counted separately.

   ANY of CUAD's spans, not all: CUAD marks the parties in 4.5 places on
   average and HaTi quotes one. Requiring all would score a right answer
   wrong. */
function foundVerdict(doc, hatiSpan, cuadSpans, min = OVERLAP_MIN) {
  if (!cuadSpans || !cuadSpans.length) return 'excluded';   // not marked — owner's ruling 3
  if (!hatiSpan) return 'missed';
  const at = locate(doc, hatiSpan);
  if (!at.length) return 'not-verbatim';
  const key = cuadSpans.map(s => [s.answer_start, s.answer_start + s.text.length]);
  return at.some(h => key.some(k => overlaps(h, k, min))) ? 'found' : 'missed';
}

/* ---------- deriving the truth out of CUAD's span ----------
   CUAD stores no normalised answers, so the right answer is read out of the
   marked passage. Where it cannot be read, the contract leaves the CORRECT
   denominator and STAYS in the FOUND one — the owner's ruling 3 extended by
   its own logic: a span that never states a date cannot prove a date wrong. */

const WORD_NUM = {
  one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10,
  eleven:11, twelve:12, fifteen:15, eighteen:18, twenty:20, thirty:30, forty:40,
  'forty-five':45, fifty:50, sixty:60, ninety:90, 'one hundred eighty':180,
};

/* Numbers written twice — "ninety (90) days" — is how legal drafting works
   and how HaTi's own seeded clause library writes them. The digits in the
   bracket win when both are present; the word is the fallback.

   NOTE: js/precedent.js has precedentFigure for this and SCORING.md says to
   reuse it rather than grow a second reader. It is a browser module built on
   `state`, so it cannot be required from a test process. This is the same
   READING deliberately re-expressed, which is the codebase's own precedent
   (rvUnsentOurs repeats negoUnsentAsks's arithmetic on the server for the
   same reason). If precedentFigure's reading changes, change this with it. */
function parseDuration(text) {
  const s = String(text || '');
  const unit = /(day|week|month|year)s?\b/i;
  const words = Object.keys(WORD_NUM).sort((a, b) => b.length - a.length).join('|');
  const re = new RegExp(
    `(?:(\\d{1,4})|\\b(${words})\\b)\\s*(?:\\(\\s*(\\d{1,4})\\s*\\)\\s*)?[\\s-]*(${unit.source})`, 'i');
  const m = re.exec(s);
  if (!m) return null;
  const n = m[3] ? Number(m[3]) : (m[1] ? Number(m[1]) : WORD_NUM[String(m[2]).toLowerCase()]);
  if (!Number.isFinite(n)) return null;
  return { n, unit: String(m[4]).toLowerCase().replace(/s$/, '') };
}

/* A period stated in MONTHS against a field measured in DAYS.

   CORRECTS SCORING.md, which said "'3 months' notice is 3 months, not 90
   days" — that reads well and is unusable, because HaTi's field is literally
   noticePeriodDays and must answer in days. A month has no fixed length, so
   the honest comparison is a RANGE: 3 months is anything from 3x28 to 3x31.
   Demanding exactly 90 would mark a correct reading wrong on a 31-day month,
   and demanding "3" would mark every correct answer wrong. */
function durationToDays(d) {
  if (!d) return null;
  if (d.unit === 'day') return { lo: d.n, hi: d.n };
  if (d.unit === 'week') return { lo: d.n * 7, hi: d.n * 7 };
  if (d.unit === 'month') return { lo: d.n * 28, hi: d.n * 31 };
  if (d.unit === 'year') return { lo: d.n * 365, hi: d.n * 366 };
  return null;
}

function durationToMonths(d) {
  if (!d) return null;
  if (d.unit === 'month') return { lo: d.n, hi: d.n };
  if (d.unit === 'year') return { lo: d.n * 12, hi: d.n * 12 };
  if (d.unit === 'day') return { lo: Math.floor(d.n / 31), hi: Math.ceil(d.n / 28) };
  return null;
}

const MONTHS = ['january','february','march','april','may','june','july',
                'august','september','october','november','december'];

/* Dates are compared EXACTLY — no tolerance. The renewal arithmetic counts
   from these and being a month out is precisely what the scorecard exists to
   catch (SCORING.md, ruling on agreement date vs effective date). */
function parseDate(text) {
  const s = String(text || '');
  let m = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?([A-Za-z]+),?\s+(\d{4})\b/.exec(s);
  if (m) {
    const mo = MONTHS.indexOf(m[2].toLowerCase());
    if (mo >= 0) return _iso(Number(m[3]), mo + 1, Number(m[1]));
  }
  m = /\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/.exec(s);
  if (m) {
    const mo = MONTHS.indexOf(m[1].toLowerCase());
    if (mo >= 0) return _iso(Number(m[3]), mo + 1, Number(m[2]));
  }
  m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(s);
  if (m) return _iso(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/.exec(s);      // US filings: month first
  if (m) {
    let y = Number(m[3]); if (y < 100) y += y < 50 ? 2000 : 1900;
    return _iso(y, Number(m[1]), Number(m[2]));
  }
  return null;
}
const _pad = n => String(n).padStart(2, '0');
const _iso = (y, mo, d) =>
  (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) ? `${y}-${_pad(mo)}-${_pad(d)}` : null;

/* ---------- the expiry date, which is mostly not written as a date ----------
   MEASURED on the 50: only 9 of the 49 marked spans state a date. Another 33
   state a DURATION — "commence on the Effective Date and continue for an
   Initial Term of five (5) years" — which is the ordinary way a term is
   drafted.

   A duration alone is not an answer: HaTi's expiryDate is a calendar date, and
   "five years" cannot be compared to one. But where the span NAMES its anchor
   and that anchor's date is itself known, the expiry is arithmetic on two
   facts CUAD marked, not a guess.

   THE ANCHOR MUST BE STATED, NOT ASSUMED. 10 of the spans give a duration with
   no anchor at all ("a term of ten (10) years" — from when?). Assuming those
   run from the effective date would invent an answer, and inventing the TRUTH
   is worse than inventing an answer: it marks a correct reading wrong.
   Honestly derivable: 24 of 49. */
const EXPIRY_ANCHOR = /(effective date|commencement date|date of this agreement|date hereof)/i;

function addDuration(iso, d) {
  if (!iso || !d) return null;
  const [y, mo, day] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, day));
  if (d.unit === 'year') dt.setUTCFullYear(dt.getUTCFullYear() + d.n);
  else if (d.unit === 'month') dt.setUTCMonth(dt.getUTCMonth() + d.n);
  else if (d.unit === 'week') dt.setUTCDate(dt.getUTCDate() + d.n * 7);
  else if (d.unit === 'day') dt.setUTCDate(dt.getUTCDate() + d.n);
  else return null;
  return dt.toISOString().slice(0, 10);
}

/* Returns an ISO date, or {from, to} where the date was COMPUTED.

   A computed expiry carries one day of tolerance and a stated one carries
   none. "For five years from 1 March 2019" is ambiguous in the drafting
   itself about whether the term ends on the anniversary or the day before it,
   and that ambiguity is the contract's, not HaTi's. Where the paper states a
   date there is nothing to be ambiguous about. */
function expiryTruth(expirySpans, effectiveSpans) {
  const texts = (expirySpans || []).map(s => s.text);
  for (const t of texts) { const d = parseDate(t); if (d) return { at: d, computed: false }; }
  const anchored = texts.find(t => EXPIRY_ANCHOR.test(t) && parseDuration(t));
  if (!anchored) return null;
  let eff = null;
  for (const s of (effectiveSpans || [])) { eff = parseDate(s.text); if (eff) break; }
  if (!eff) return null;
  const at = addDuration(eff, parseDuration(anchored));
  return at ? { at, computed: true } : null;
}

function expiryMatches(truth, answer) {
  const got = parseDate(String(answer || ''));
  if (!got || !truth) return false;
  if (!truth.computed) return got === truth.at;
  const day = 86400000;
  const gap = Math.abs(Date.parse(got) - Date.parse(truth.at));
  return gap <= day;
}

/* THE LIST MUST NOT BE SHORT.

   A first pass scored four contracts as underivable that were nothing of the
   sort — Hong Kong, Spain, British Columbia and Canada were simply missing.
   The gap was in the tooling, not the data, and a short list silently
   UNDERSTATES the score, which is the worst direction for a number that ends
   up in a proposal. Broadened, governing law derives 48 of 48.

   Kenya and Sweden are in it because that is where this product sells, even
   though no EDGAR filing will name them. */
const JURISDICTIONS = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia',
  'Washington','West Virginia','Wisconsin','Wyoming','District of Columbia',
  'England','Wales','Scotland','Northern Ireland','Ireland','Ontario','Quebec',
  'British Columbia','Alberta','Manitoba','Nova Scotia','Canada','Hong Kong',
  'Singapore','Australia','New Zealand','India','Japan','China','Korea','Taiwan',
  'Israel','Spain','Portugal','Italy','France','Germany','Austria','Switzerland',
  'Netherlands','Belgium','Luxembourg','Denmark','Norway','Sweden','Finland',
  'Poland','Brazil','Mexico','Argentina','Chile','South Africa','Kenya','Nigeria',
  'Bermuda','Cayman Islands','Jersey','Guernsey',
];
/* Longest first: "New York" must win over a bare "York", and "British
   Columbia" over "Columbia". */
const _JX = JURISDICTIONS.slice().sort((a, b) => b.length - a.length);

function jurisdiction(text) {
  const s = String(text || '');
  for (const j of _JX) {
    if (new RegExp(`\\b${j.replace(/\s+/g, '\\s+')}\\b`, 'i').test(s)) return j;
  }
  return null;
}

/* Company names: case, punctuation and the corporate suffix are noise.
   "REYNOLDS CONSUMER PRODUCTS LLC" and "Reynolds Consumer Products" are the
   same party, and HaTi is not wrong for dropping the LLC. */
const SUFFIX = /\b(inc|incorporated|llc|l\.l\.c|ltd|limited|plc|corp|corporation|co|company|gmbh|ab|as|nv|bv|sa|sarl|pty|lp|llp|holdings?|group)\b/gi;
function normCompany(s) {
  return String(s || '').toLowerCase()
    .replace(/[.,''`"()]/g, ' ').replace(SUFFIX, ' ')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/* THE OWNER'S FIRST-PARTY RULE (ruling 2): correct if HaTi's answer matches
   any marked party OTHER THAN the first-named, the first being conventionally
   the drafting side. A convention, not a law — it will be wrong sometimes,
   and it is written down so that when it is, it is visible.

   CUAD also marks role words — "Seller", "Buyer" — among the party spans.
   Those are not company names and are skipped, or every answer would match
   something. */
const ROLE_WORD = /^(seller|buyer|purchaser|supplier|vendor|distributor|licensor|licensee|company|customer|client|contractor|consultant|agent|principal|party|parties|lessor|lessee|sponsor)$/i;

function counterpartyVerdict(hatiAnswer, partySpans) {
  const names = partySpans.map(s => s.text.trim()).filter(t => t && !ROLE_WORD.test(t));
  if (names.length < 2) return null;                 // cannot apply the rule — excluded
  const eligible = names.slice(1).map(normCompany).filter(Boolean);
  const got = normCompany(hatiAnswer);
  if (!got) return false;
  return eligible.some(e => e === got || e.includes(got) || got.includes(e));
}

/* liabilityCapped is three states built from two CUAD categories.
   Both marked -> capped: a cap with carve-outs is still a cap.
   Neither marked -> null, EXCLUDED per ruling 3 — the annotator finding
   nothing is not the contract being silent, and scoring against that would
   invent a wrong answer.

   THE WORDS ARE HaTi'S OWN, AND THEY HAVE TO BE.

   This returned 'yes' / 'no' on the first live run and HaTi's field is an enum
   of ['capped','uncapped','unclear']. So 'capped' === 'yes' was false every
   single time and the scorecard reported CORRECT 0% (0/9) — a flat accusation
   that HaTi cannot read a liability cap at all, produced entirely by MY
   vocabulary and not by anything HaTi did. FOUND was 67% in the same run,
   which is the tell: it kept locating the right passage and then "failing" to
   read it.

   A zero is the loudest thing this scorecard can print. Any field scoring 0%
   while FOUND is healthy should be assumed a scorer bug until proven
   otherwise. f226-6d pins the vocabulary to HaTi's enum, so a rename on either
   side breaks the test rather than the number. */
const LIABILITY_STATES = ['capped', 'uncapped', 'unclear'];

function liabilityTruth(capSpans, uncappedSpans) {
  const cap = !!(capSpans && capSpans.length);
  const unc = !!(uncappedSpans && uncappedSpans.length);
  if (cap) return 'capped';
  if (unc) return 'uncapped';
  return null;
}


/* ---------- a short run must still span the book ----------
   selection.json is built group by group, so taking the first N returned N
   contracts from ONE group — for --n 10, ten pharma-skewed supply agreements
   and nothing else. A calibration run that measures one sixth of the book
   while reading as a general signal is the worst kind of wrong number:
   plausible, cheap, and unrepresentative.

   Round-robin: one from each group in turn until the limit is met. Order
   WITHIN a group is preserved, so the best-covered contracts (selection.json
   is sorted by answer-key coverage) are still the ones taken first. */
function spreadAcrossGroups(rows, limit) {
  if (!limit || limit >= rows.length) return rows;
  const byGroup = new Map();
  for (const r of rows) {
    if (!byGroup.has(r.group)) byGroup.set(r.group, []);
    byGroup.get(r.group).push(r);
  }
  const queues = [...byGroup.values()];
  const out = [];
  while (out.length < limit) {
    let took = false;
    for (const q of queues) {
      if (!q.length) continue;
      out.push(q.shift()); took = true;
      if (out.length === limit) break;
    }
    if (!took) break;                        // every group exhausted
  }
  return out;
}


/* ---------- reading the obligations reader's answer ----------
   The first live run scored this 0% across all four categories (0/3, 0/5,
   0/2, 0/4), and the numbers could not say WHY. Three different things look
   identical from a zero:

     a) the reader returned nothing at all;
     b) it returned obligations but with no `quote` — the field is optional
        (the tool requires only `desc`, and js/obligations.js prints the quote
        only `if (o.quote)`), so there is nothing to match on;
     c) it returned quoted obligations that are simply about OTHER clauses —
        payment terms and delivery rather than audit rights and insurance.

   (c) is a real and useful finding about scope. (b) is a product defect worth
   knowing on its own — an obligation HaTi cannot trace back to the wording.
   (a) is a failure. Reporting all three as one zero tells nobody anything, so
   they are counted apart. Same reasoning as not-verbatim beside missed. */
function obligationMatch(doc, items, cuadSpans, min = OVERLAP_MIN) {
  const list = Array.isArray(items) ? items : [];
  if (!cuadSpans || !cuadSpans.length) return 'excluded';   // ruling 3
  if (!list.length) return 'none-returned';
  const quoted = list.filter(it => String(it && (it.quote || it.sourceSpan || it.source || '')).trim());
  if (!quoted.length) return 'no-quotes';
  const hit = quoted.some(it => {
    const q = it.quote || it.sourceSpan || it.source;
    return foundVerdict(doc, q, cuadSpans, min) === 'found';
  });
  return hit ? 'found' : 'elsewhere';
}

/* ---------- the tally ----------
   Every figure carries its denominator. A bare percentage hides that warranty
   duration rests on 20 contracts and notice period on 36, and this number
   ends up in a proposal. */
function newTally() {
  return { found: 0, foundOf: 0, correct: 0, correctOf: 0,
           notVerbatim: 0, excludedNotMarked: 0, excludedNotDerivable: 0 };
}

function record(t, { foundV, truth, answer, compare }) {
  if (foundV === 'excluded') { t.excludedNotMarked++; return; }
  t.foundOf++;
  if (foundV === 'found') t.found++;
  if (foundV === 'not-verbatim') t.notVerbatim++;
  if (truth == null) { t.excludedNotDerivable++; return; }   // ruling 3, extended
  t.correctOf++;
  if (compare(truth, answer)) t.correct++;
}

const pct = (n, d) => d ? `${Math.round((n / d) * 100)}% (${n}/${d})` : 'no data';

/* NOT MEASURED is a different claim from zero and from blank, and the screen
   must not confuse them (SCORING.md, rule 6). */
const NOT_MEASURED = {
  value: 'CUAD has no value category — dropped by the owner, 21 Aug 2026',
  currency: 'CUAD has no currency category',
  paymentTerms: 'CUAD has no payment-terms category',
  retentionPct: 'CUAD has no retention category',
  retentionReleaseDays: 'CUAD has no retention category',
  category: "HaTi's own six streams — no CUAD equivalent",
  priceReview: 'only 5 of 50 marked — below the six-contract floor',
};

/* No single blended accuracy number: it would average a field resting on 50
   contracts with one resting on 20 and hide whichever is weak. Where a
   headline is wanted it says what it is — the mean of the per-field FOUND
   figures, with the field count beside it. */
function headline(tallies) {
  const live = Object.values(tallies).filter(t => t.foundOf > 0);
  if (!live.length) return 'no fields measured';
  const mean = live.reduce((a, t) => a + t.found / t.foundOf, 0) / live.length;
  return `${Math.round(mean * 100)}% mean FOUND across ${live.length} fields`;
}

module.exports = {
  locate, overlaps, foundVerdict, OVERLAP_MIN,
  parseDuration, durationToDays, durationToMonths, parseDate,
  jurisdiction, JURISDICTIONS, normCompany, counterpartyVerdict, liabilityTruth,
  LIABILITY_STATES,
  addDuration, expiryTruth, expiryMatches, EXPIRY_ANCHOR,
  newTally, record, pct, headline, NOT_MEASURED, spreadAcrossGroups,
  obligationMatch,
};
