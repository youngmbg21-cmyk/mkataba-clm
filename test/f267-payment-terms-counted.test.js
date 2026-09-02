/* ============================================================
   f267 — payment terms, turned into a number and counted
   ============================================================
   Owner-asked 2 Sep 2026: "An important part of Hati should be how to track
   payment terms ... How could we incorporate ensuring we have KPIs of the
   portfolio payment terms?" Then, ruling on three drawn options: build the
   cash-gap page (A) with the exception list (B) folded into it; the Home tile
   counts BOTH sides; the tab sits after Obligations.

   WHAT IS PINNED HERE:
     1  the parser: every shape the field can honestly hold, and what is not one
     2  the reading per contract, and what is out of scope
     3  the standard is the playbook's, and the fallback agrees with it
     4  the aggregate: sides, weighting, buckets, the gap
     5  nothing is folded away -- what cannot be read is counted out AND named
     6  the exceptions: both sides, worst first, by value
     7  the tile borrows the tab's reading and names both halves
     8  the tab is one list, read by the row and by the guard
     9  no store, no route, no writes
    10  both languages
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PT = read('js/payterms.js');
const HOME = read('js/views/home.js');
const INTEL = read('js/views/intelligence.js');
const I18N = read('js/i18n.js');
const PLAYBOOK = read('js/playbook.js');

/* A contract the reading will accept: monetary, live, with a category. */
const con = (id, over) => ({
  id, name:id, status:'Signed', value:1000000, counterparty:id + ' Ltd',
  metadata:{ paymentTerms:'30 days from invoice', category:'customer', currency:'KES' },
  ...over,
});
const meta = (c, m) => ({ ...c, metadata:{ ...c.metadata, ...m } });

/* buildWorld hands back the WINDOW the modules were evaluated into, which is
   where they publish themselves -- the house convention. The world carries no
   `state` of its own, so a stage supplies one, and payLiveBook reads `state`
   BARE, which resolves to that same window exactly as core.js's own const does
   in the product. */
const mk = opts => buildWorld({ payterms:true, ...(opts || {}) }).win;
function world(contracts, opts) {
  const w = mk(opts);
  w.state = { contracts };
  return w;
}

describe('f267 (1) the parser reads what the field can honestly hold', () => {
  const w = mk();

  test('a plain figure with a unit', () => {
    assert.equal(w.payParseDays('30 days from invoice'), 30);
    assert.equal(w.payParseDays('60 days from receipt of a valid tax invoice'), 60);
  });

  test('legal drafting writes the number twice and the bracket wins', () => {
    /* "sixty (60) days" -- the spelled-out word carries no digits, so a
       reader that took the first number in the string would find 60 anyway;
       what this pins is that the BRACKET is asked first, which is what stops
       "within 2 business days of the sixty (60) day period" reading as 2. */
    assert.equal(w.payParseDays('within sixty (60) days of delivery'), 60);
    assert.equal(w.payParseDays('forty-five (45) days'), 45);
  });

  test('the trade shorthand a person types, which the extraction never writes', () => {
    assert.equal(w.payParseDays('Net 45'), 45);
    assert.equal(w.payParseDays('net30'), 30);
    assert.equal(w.payParseDays('NET 60'), 60);
  });

  test('months become days the way a notice period already does', () => {
    assert.equal(w.payParseDays('2 months from invoice'), 60);
    assert.equal(w.payParseDays('1 month'), 30);
  });

  test('a bare number is days, and ONLY when it is the whole field', () => {
    assert.equal(w.payParseDays('45'), 45);
    /* Or "invoice 12345" would read as a payment term. */
    assert.equal(w.payParseDays('invoice 12345'), null);
    assert.equal(w.payParseDays('ref 30 above'), null);
  });

  test('no figure is no answer, and never a guess', () => {
    assert.equal(w.payParseDays('payment as agreed between the parties'), null);
    assert.equal(w.payParseDays(''), null);
    assert.equal(w.payParseDays(null), null);
    assert.equal(w.payParseDays(undefined), null);
    assert.equal(w.payParseDays('as invoiced'), null);
  });

  test('nothing outside a plausible range comes back', () => {
    assert.equal(w.payParseDays('0 days'), null);
    assert.equal(w.payParseDays('400 days'), null);
    /* 24 months is 720 days -- past the ceiling, so a misread rather than a
       credit term. */
    assert.equal(w.payParseDays('24 months'), null);
  });

  test('Swedish, because a person may type the field in their own language', () => {
    assert.equal(w.payParseDays('30 dagar'), 30);
    assert.equal(w.payParseDays('2 månader'), 60);
    assert.equal(w.payParseDays('netto 45'), 45);
  });
});

describe('f267 (2) the reading per contract', () => {
  const w = mk();

  test('it reads the RECORD, never the wording', () => {
    /* The metadata field is already the product reading of the document --
       extracted, printed back on the upload screen, confirmed by a person.
       Re-parsing the agreement here would be slow on every paint and could
       disagree with what the reader confirmed. */
    const c = con('A');
    c.redlineText = '<p>Payment shall fall due within ninety (90) days.</p>';
    assert.equal(w.payDays(c), 30, 'the record wins; the wording is not read');
  });

  test('a contract nobody has read answers null rather than zero', () => {
    assert.equal(w.payDays(meta(con('A'), { paymentTerms:'' })), null);
    assert.equal(w.payDays({ id:'B' }), null);
  });

  test('only customer and supplier are a SIDE', () => {
    assert.equal(w.paySide(meta(con('A'), { category:'customer' })), 'customer');
    assert.equal(w.paySide(meta(con('A'), { category:'supplier' })), 'supplier');
    ['lease', 'licence', 'employment', 'partner', 'funding', 'other', ''].forEach(k => {
      assert.equal(w.paySide(meta(con('A'), { category:k })), null, k + ' is not a side');
    });
  });

  test('where no money passes there are no payment terms to count', () => {
    /* isMonetary is the product own answer and every money surface asks it.
       Without it loaded everything is in scope, which is the honest default
       for a stage that cannot ask. */
    assert.equal(typeof w.payInScope, 'function');
    assert.equal(w.payInScope(con('A')), true);
  });

  test('the live book is the portfolio own: not Declined, not archived', () => {
    const wl = world([con('A'), con('B', { status:'Declined' }), con('C', { archived:{ at:'x' } })]);
    assert.deepEqual(Array.from(wl.payLiveBook(), c => c.id), ['A']);
  });
});

describe('f267 (3) the standard is the playbook own', () => {
  test('the fallback IS the playbook own number, or the two drift', () => {
    /* PAY_STD_FALLBACK is the answer for a stage with no js/playbook.js.
       Pinned as a RELATION so moving DEFAULT_PLAYBOOK fails HERE rather than
       leaving this file quietly stale. */
    const m = PLAYBOOK.match(/key:'paymentDays'[^}]*?value:\s*(\d+)/);
    assert.ok(m, 'the playbook still carries a paymentDays range');
    const w = mk();
    assert.equal(w.PAY_STD_FALLBACK, Number(m[1]));
  });

  test('with the playbook loaded the standard comes from it', () => {
    const w = mk({ playbook:true });
    assert.equal(w.payStandardFor(con('A')), w.PAY_STD_FALLBACK);
  });

  test('over standard is asked of the contract own standard, exactly', () => {
    const w = mk();
    const std = w.PAY_STD_FALLBACK;
    assert.equal(w.payOver(meta(con('A'), { paymentTerms:String(std) + ' days' })), false,
      'exactly the standard is inside it');
    assert.equal(w.payOver(meta(con('A'), { paymentTerms:String(std + 1) + ' days' })), true);
    assert.equal(w.payOver(meta(con('A'), { paymentTerms:'' })), false,
      'unreadable is never counted as over');
  });
});

describe('f267 (4) the aggregate', () => {
  const book = () => [
    meta(con('C1'), { category:'customer', paymentTerms:'30 days' }),
    meta(con('C2'), { category:'customer', paymentTerms:'90 days' }),
    meta(con('S1'), { category:'supplier', paymentTerms:'30 days' }),
    meta(con('S2'), { category:'supplier', paymentTerms:'60 days' }),
  ];

  test('each side is counted apart', () => {
    const d = world(book()).payTermsData();
    assert.equal(d.customer.n, 2);
    assert.equal(d.supplier.n, 2);
    assert.equal(d.counted, 4);
  });

  test('the average is weighted by VALUE, and says which basis it used', () => {
    const b = book();
    b[0].value = 9000000;   // 30 days
    b[1].value = 1000000;   // 90 days
    const d = world(b).payTermsData();
    /* A plain mean would be 60. Weighted: (30*9 + 90*1) / 10 = 36. */
    assert.equal(d.customer.avgDays, 36);
    assert.equal(d.customer.basis, 'value');
  });

  test('with nothing carrying a value it falls back to a plain mean and SAYS so', () => {
    const b = book().map(c => ({ ...c, value:0 }));
    const d = world(b).payTermsData();
    assert.equal(d.customer.avgDays, 60, '(30 + 90) / 2');
    assert.equal(d.customer.basis, 'count');
  });

  test('the buckets carry every contract exactly once', () => {
    const d = world(book()).payTermsData();
    const sum = S => S.buckets.reduce((a, b) => a + b.n, 0);
    assert.equal(sum(d.customer), d.customer.n);
    assert.equal(sum(d.supplier), d.supplier.n);
  });

  test('the gap is the difference, and null when one side cannot answer', () => {
    const d = world(book()).payTermsData();
    assert.equal(d.gap, d.customer.avgDays - d.supplier.avgDays);
    const one = world([meta(con('C1'), { category:'customer' })]).payTermsData();
    assert.equal(one.gap, null, 'nothing to compare against');
  });

  test('the standard rule is drawn after the last bucket wholly inside it', () => {
    const w = mk();
    /* Never under-claims: with a standard of 50 the 46-60 bucket really does
       hold contracts over it, so shading it is the safe direction. */
    assert.equal(w.payStandardSplit(45), 1);
    assert.equal(w.payStandardSplit(50), 1);
    assert.equal(w.payStandardSplit(60), 2);
    assert.equal(w.payStandardSplit(30), 0);
    assert.equal(w.payStandardSplit(10), -1, 'every bucket is over it');
  });
});

describe('f267 (5) nothing is folded away', () => {
  test('what cannot be read is counted OUT of every figure and NAMED', () => {
    const d = world([
      meta(con('C1'), { category:'customer', paymentTerms:'30 days' }),
      meta(con('X'),  { category:'customer', paymentTerms:'payment as agreed' }),
      meta(con('Y'),  { category:'customer', paymentTerms:'' }),
    ]).payTermsData();
    assert.equal(d.customer.n, 1, 'the two unreadable ones are not in the average');
    assert.equal(d.noTerms.n, 2);
    assert.deepEqual(Array.from(d.noTerms.rows, r => r.id).sort(), ['X', 'Y']);
  });

  test('a contract with no category sits on neither side and says so', () => {
    const d = world([
      meta(con('C1'), { category:'customer' }),
      meta(con('L1'), { category:'lease' }),
      meta(con('N1'), { category:'' }),
    ]).payTermsData();
    assert.equal(d.customer.n, 1);
    assert.equal(d.supplier.n, 0);
    assert.equal(d.noSide.n, 2);
    assert.deepEqual(Array.from(d.noSide.rows, r => r.id).sort(), ['L1', 'N1']);
  });

  test('every contract in the book lands in exactly one pile', () => {
    const d = world([
      meta(con('C1'), { category:'customer' }),
      meta(con('S1'), { category:'supplier' }),
      meta(con('L1'), { category:'lease' }),
      meta(con('X'),  { paymentTerms:'as agreed' }),
    ]).payTermsData();
    assert.equal(d.customer.n + d.supplier.n + d.noSide.n + d.noTerms.n, d.bookN);
  });

  test('an empty book answers nothing rather than a figure over nothing', () => {
    const d = world([]).payTermsData();
    assert.equal(d.counted, 0);
    assert.equal(d.gap, null);
    assert.equal(d.customer.avgDays, null);
  });
});

describe('f267 (6) the exceptions, both sides, worst first', () => {
  test('both sides are in one list, ranked by VALUE', () => {
    /* B list folded into A page (owner-ruled). Ranked by value rather than by
       days: what a reader acts on first is the biggest contract on bad terms,
       not the longest term on a small one. */
    const w = world([
      meta({ ...con('SMALL'), value:100 },  { category:'customer', paymentTerms:'300 days' }),
      meta({ ...con('BIG'), value:900000 }, { category:'supplier', paymentTerms:'90 days' }),
    ]);
    const d = w.payTermsData();
    assert.deepEqual(Array.from(d.exceptions, r => r.id), ['BIG', 'SMALL']);
    assert.deepEqual(Array.from(d.exceptions, r => r.side), ['supplier', 'customer']);
  });

  test('only what is actually over the standard is in it', () => {
    const w = world([
      meta(con('IN'),  { category:'customer', paymentTerms:'30 days' }),
      meta(con('OUT'), { category:'customer', paymentTerms:'90 days' }),
    ]);
    const d = w.payTermsData();
    assert.deepEqual(Array.from(d.exceptions, r => r.id), ['OUT']);
    assert.equal(d.overN, 1);
  });

  test('every row carries what the screen has to print', () => {
    const d = world([meta(con('OUT'), { category:'customer', paymentTerms:'90 days' })]).payTermsData();
    const r = d.exceptions[0];
    ['id', 'name', 'counterparty', 'side', 'days', 'standard', 'value'].forEach(k =>
      assert.ok(k in r, 'the row carries ' + k));
  });
});

describe('f267 (7) the Home tile', () => {
  test('it BORROWS the tab reading rather than counting again', () => {
    const w = world([
      meta(con('C1'), { category:'customer', paymentTerms:'90 days' }),
      meta(con('S1'), { category:'supplier', paymentTerms:'90 days' }),
      meta(con('OK'), { category:'customer', paymentTerms:'30 days' }),
    ]);
    const p = w.payOverStandard();
    const d = w.payTermsData();
    assert.equal(p.n, d.overN, 'one reading, two surfaces');
    assert.equal(p.n, 2);
  });

  test('BOTH SIDES, and the halves are named apart (owner-ruled)', () => {
    const p = world([
      meta(con('C1'), { category:'customer', paymentTerms:'90 days' }),
      meta(con('S1'), { category:'supplier', paymentTerms:'90 days' }),
      meta(con('S2'), { category:'supplier', paymentTerms:'75 days' }),
    ]).payOverStandard();
    assert.equal(p.n, 3);
    assert.equal(p.customer, 1);
    assert.equal(p.supplier, 2);
    assert.equal(p.customer + p.supplier, p.n, 'the halves add up to the headline');
  });

  test('the tile is in the catalogue and NOT in the default four', () => {
    assert.match(HOME, /payterms:'Payment terms over standard'/, 'it has an English word');
    assert.match(HOME, /KPI_ALL_ORDER=\[[^\]]*'payterms'/, 'it is in the catalogue');
    const def = HOME.match(/const DEFAULT_KPI_SEL=\[([^\]]*)\]/);
    assert.ok(def, 'the default four are still named');
    assert.ok(!/payterms/.test(def[1]), 'it forces itself onto nobody dashboard');
  });

  test('the sub-line names both halves, never one number alone', () => {
    assert.match(HOME, /home_pt_split/, 'the split sentence is drawn');
    const en = I18N.match(/home_pt_split: '([^']*)'/);
    assert.ok(en, 'the sentence exists');
    assert.ok(/\{c\}/.test(en[1]) && /\{s\}/.test(en[1]),
      'it prints the customer half AND the supplier half');
  });

  test('its destination is the TAB, not the register', () => {
    assert.match(HOME, /go:\{intelTab:'payterms'\}/);
    assert.match(HOME, /g\.intelTab/, 'the press handler knows that branch');
    assert.match(HOME, /intelGoTab\(g\.intelTab\)/, 'through the one named door');
  });

  test('amber only when something is actually over', () => {
    assert.match(HOME, /grad:p\.n\?G\.amber:G\.steel/,
      'a figure that is always coloured is one nobody reads');
  });
});

describe('f267 (8) the tab', () => {
  test('it sits after Obligations and before the contract graph', () => {
    const m = INTEL.match(/const IG_TABS = \[([^\]]*)\]/);
    assert.ok(m);
    const tabs = m[1].split(',').map(s => s.trim().replace(/'/g, ''));
    assert.deepEqual(tabs, ['frame', 'friction', 'obligations', 'payterms', 'map']);
    assert.equal(tabs.indexOf('payterms'), tabs.indexOf('obligations') + 1);
  });

  test('ONE list, read by the row AND by the guard', () => {
    /* The fourth tab once drew, registered its press, and redrew the overview,
       because the guard was written out separately as a bare array. */
    assert.match(INTEL, /IG_TABS\.indexOf\(intel\.tab\)<0/, 'the guard reads the list');
    assert.match(INTEL, /IG_TABS\.map\(k=>tabBtn/, 'the row reads the list');
    assert.doesNotMatch(INTEL, /\['frame','friction','obligations','map'\]/,
      'no second copy of the tab list survives anywhere');
  });

  test('the label is a KEY, never a resolved string', () => {
    assert.match(INTEL, /payterms:'pt_tab'/);
  });

  test('the body branch draws it and wires its one verb', () => {
    assert.match(INTEL, /intel\.tab==='payterms'/);
    assert.match(INTEL, /intelPayTermsHtml\(\)/);
    assert.match(INTEL, /data-pt-open/, 'an exception row opens its contract');
  });

  test('the named door is published, or the tile read of it is silence', () => {
    assert.match(INTEL, /intelPayTermsHtml,intelGoTab,/,
      'both leave the module by name');
  });
});

describe('f267 (9) no store, no route, no writes', () => {
  test('it never reaches the network', () => {
    /* How long a company waits to be paid is that workspace own business.
       There must never be a route. */
    assert.doesNotMatch(PT, /\bapi\(/);
    assert.doesNotMatch(PT, /\bfetch\(/);
  });

  test('it writes nothing at all', () => {
    ['persist(', 'logAudit(', 'saveContract(', 'localStorage'].forEach(w =>
      assert.ok(!PT.includes(w), 'a reading does not ' + w));
  });

  test('counting does not start a negotiation', () => {
    /* negoChanges runs negoInit and would create a negotiation on every
       contract merely counted -- the alerts panel own standing trap. */
    assert.doesNotMatch(PT, /negoChanges\(/);
  });

  test('the reading is its own file, reachable by both surfaces', () => {
    /* Written inside either view, the other would read it through window on a
       stage that does not carry that view and count zero, silently. */
    assert.ok(fs.existsSync(path.join(ROOT, 'js/payterms.js')));
    assert.match(read('js/app.js'), /import '\.\/payterms\.js'/);
    assert.doesNotMatch(HOME, /function payTermsData/);
    assert.doesNotMatch(INTEL, /function payTermsData/);
  });

  test('counting is not drawing', () => {
    assert.doesNotMatch(PT, /innerHTML/);
    assert.doesNotMatch(PT, /<div|<span|<section/);
  });
});

describe('f267 (10) both languages', () => {
  const KEYS = ['pt_tab', 'pt_we_wait', 'pt_we_pay', 'pt_the_gap', 'pt_days',
    'pt_side_empty', 'pt_wait_sub_value', 'pt_wait_sub_count', 'pt_pay_sub_value',
    'pt_pay_sub_count', 'pt_gap_fund', 'pt_gap_ahead', 'pt_gap_level', 'pt_gap_none',
    'pt_spread_title', 'pt_spread_q', 'pt_are_paid', 'pt_standard', 'pt_standard_varies',
    'pt_no_terms_one', 'pt_no_terms_other', 'pt_no_side_one', 'pt_no_side_other',
    'pt_exc_title', 'pt_exc_q', 'pt_exc_none', 'pt_exc_flag', 'pt_exc_showing',
    'pt_side_cust', 'pt_side_supp', 'pt_blind_title', 'pt_blind_1', 'pt_blind_1_why',
    'pt_blind_2', 'pt_blind_2_why', 'pt_method', 'pt_empty', 'pt_empty_why',
    'kpi_payterms', 'home_pt_of', 'home_pt_split', 'home_pt_clear',
    /* the two targets and the gap list (owner-ruled 2 Sep 2026) */
    'pt_target_in', 'pt_target_out', 'pt_drive_title', 'pt_drive_q', 'pt_drive_none',
    'pt_drive_terms', 'pt_drive_flag', 'pt_targets_set', 'pt_targets_in_only',
    'pt_targets_out_only', 'st_p_paydays', 'set_paydays_sub', 'set_pay_in', 'set_pay_out',
    'set_pay_days', 'set_pay_note', 'set_pay_bad', 'set_pay_saved',
    'set_pay_row_both', 'set_pay_row_in', 'set_pay_row_out', 'set_pay_row_none'];

  test('every key is written twice, and the two are different words', () => {
    KEYS.forEach(k => {
      const hits = [...I18N.matchAll(new RegExp('^\\s*' + k + ": '", 'gm'))];
      assert.equal(hits.length, 2, k + ' is in both dictionaries exactly once each');
    });
  });

  test('the honest limit is stated in both, not only in English', () => {
    const hits = [...I18N.matchAll(/^\s*pt_blind_1_why: '([^']*)'/gm)].map(m => m[1]);
    assert.equal(hits.length, 2);
    assert.notEqual(hits[0], hits[1], 'it is translated, not copied');
    hits.forEach(h => assert.ok(/bank/i.test(h), 'both say HaTi does not read the bank'));
  });

  test('every key the tab draws really exists', () => {
    const used = [...INTEL.matchAll(/i18t\('(pt_[a-z0-9_]+)'/g)].map(m => m[1]);
    assert.ok(used.length > 10, 'the tab draws through the dictionary');
    [...new Set(used)].forEach(k =>
      assert.ok(new RegExp('^\\s*' + k + ": '", 'm').test(I18N), k + ' is defined'));
  });

  test('the plural sentences go through i18tn', () => {
    assert.match(INTEL, /i18tn\('pt_no_terms'/);
    assert.match(INTEL, /i18tn\('pt_no_side'/);
  });
});

/* ============================================================
   Owner-ruled 2 Sep 2026, off "What if we want to pay under one payment term
   while we get paid under a different payment term?" and "How will i then
   identify the contracts that are driving the gap if I want to address them?"
   ============================================================
    11  two targets, one per side -- and absent moves nothing
    12  ONE basis for the page, never one per side
    13  what is driving the gap
    14  the chart's boundary, and payment terms as a graph lens
   ============================================================ */

/* A world that can carry a settings blob as well as a book. */
function tw(contracts, settings, opts) {
  const w = mk(opts);
  w.state = { contracts, settings: settings || {} };
  return w;
}
const cust = (id, days, over) => meta(con(id, over), { paymentTerms: days + ' days', category:'customer' });
const supp = (id, days, over) => meta(con(id, over), { paymentTerms: days + ' days', category:'supplier' });

describe('f267 (11) two targets, one per side', () => {
  test('absent means nobody has set one, and the playbook answers exactly as before', () => {
    const w = tw([cust('C', 30)]);
    assert.deepEqual(Object.assign({}, w.payTargets()), { customer:null, supplier:null });
    assert.equal(w.payStandardFor(w.state.contracts[0]), w.PAY_STD_FALLBACK,
      'with nothing set the standard is the playbook fallback, so no book moves');
  });

  test('a target answers for its own side and leaves the other alone', () => {
    const w = tw([cust('C', 30), supp('S', 30)], { payTargets:{ customer:20 } });
    const [c, s] = w.state.contracts;
    assert.equal(w.payStandardFor(c), 20, 'the side with a target reads it');
    assert.equal(w.payStandardFor(s), w.PAY_STD_FALLBACK, 'the side without one falls back');
  });

  test('the pair really can differ -- the whole point of the ruling', () => {
    const w = tw([cust('C', 45), supp('S', 45)], { payTargets:{ customer:30, supplier:60 } });
    const [c, s] = w.state.contracts;
    assert.equal(w.payStandardFor(c), 30);
    assert.equal(w.payStandardFor(s), 60);
    assert.equal(w.payOver(c), true, '45 days to be paid is past a 30-day target');
    assert.equal(w.payOver(s), false, '45 days to pay is inside a 60-day target');
  });

  test('a contract with no side cannot read a target', () => {
    const w = tw([meta(con('X', 30), { paymentTerms:'30 days', category:'lease' })],
      { payTargets:{ customer:5, supplier:5 } });
    assert.equal(w.payStandardFor(w.state.contracts[0]), w.PAY_STD_FALLBACK);
  });

  test('a target is a whole number of days from 1 to 365, and nothing else is one', () => {
    const w = mk();
    assert.equal(w.payTargetDays(30), 30);
    assert.equal(w.payTargetDays('45'), 45);
    assert.equal(w.payTargetDays(30.6), 31, 'rounded, never stored fractional');
    [0, -5, 366, '', null, undefined, 'soon', NaN, Infinity].forEach(v =>
      assert.equal(w.payTargetDays(v), null, String(v) + ' is not a target'));
  });

  test('the page reports the pair, so a reader can tell a target from a default', () => {
    const w = tw([cust('C', 30)], { payTargets:{ customer:20, supplier:60 } });
    assert.deepEqual(Object.assign({}, w.payTermsData().targets), { customer:20, supplier:60 });
  });

  test('each side reports its own standard, and none where its contracts disagree', () => {
    const w = tw([cust('A', 10), cust('B', 20), supp('S', 10)],
      { payTargets:{ customer:30, supplier:60 } });
    const d = w.payTermsData();
    assert.equal(d.customer.standard, 30);
    assert.equal(d.supplier.standard, 60);
    assert.equal(typeof d.customer.splitAfter, 'number');
    assert.equal(typeof d.supplier.splitAfter, 'number');
  });

  test('a side with no rows carries no standard, so the chart draws it no line', () => {
    const d = tw([cust('C', 30)], { payTargets:{ customer:30, supplier:60 } }).payTermsData();
    assert.equal(d.supplier.standard, null);
    assert.equal(d.supplier.splitAfter, null);
  });

  test('the setting is written by exactly one panel, and it rides the ordinary blob', () => {
    const SET = read('js/views/settings.js');
    const writes = [...SET.matchAll(/state\.settings\.payTargets\s*=/g)];
    assert.equal(writes.length, 1, 'one writer');
    assert.match(SET, /saveSettings\(\)/, 'through the ordinary save, no route of its own');
    assert.ok(!/api\(['"]settings\/pay/.test(SET), 'no atomic route was invented for a pair of numbers');
  });

  test('the panel refuses a number the reading would hand back as null', () => {
    const SET = read('js/views/settings.js');
    const body = SET.slice(SET.indexOf('paydays:{'), SET.indexOf('workshape:{'));
    assert.match(body, /payTargetDays/, 'the panel asks the one reading rather than its own');
    assert.match(body, /stDrawerRefuse\(i18t\('set_pay_bad'\)\)/, 'and refuses in the drawer, in words');
    assert.match(body, /stRepaintRow\('paydays'\)/, 'the row behind the drawer is repainted, never the screen');
  });
});

describe('f267 (12) one basis for the page, never one per side', () => {
  test('both sides read the same way when both can be weighted', () => {
    const d = tw([cust('C', 30, { value:1000 }), supp('S', 60, { value:2000 })]).payTermsData();
    assert.equal(d.basis, 'value');
    assert.equal(d.customer.basis, 'value');
    assert.equal(d.supplier.basis, 'value');
  });

  test('one side with no value on file drops BOTH to a straight mean', () => {
    /* This is the reported fault: "Averaged across 1 customer contracts" beside
       "Weighted by value across 1 supplier contracts", and a GAP that was the
       difference between two numbers worked out different ways. */
    const d = tw([cust('C', 30, { value:0 }), supp('S', 60, { value:2000 })]).payTermsData();
    assert.equal(d.basis, 'count');
    assert.equal(d.customer.basis, d.supplier.basis, 'one basis, so the two sub-lines read alike');
  });

  test('a side with no rows at all reports no basis rather than the page\'s', () => {
    const d = tw([cust('C', 30)]).payTermsData();
    assert.equal(d.supplier.basis, null);
    assert.equal(d.customer.basis, d.basis);
  });

  test('the gap is a like-for-like subtraction', () => {
    const d = tw([cust('C', 45, { value:0 }), supp('S', 30, { value:9999 })]).payTermsData();
    assert.equal(d.basis, 'count');
    assert.equal(d.gap, 15);
  });
});

describe('f267 (13) what is driving the gap', () => {
  test('a contract inside its target drives nothing', () => {
    const d = tw([cust('C', 20), supp('S', 60)],
      { payTargets:{ customer:30, supplier:60 } }).payTermsData();
    assert.equal(d.drivers.length, 0);
  });

  test('the reported shape: a gap with an EMPTY exceptions list still names its drivers', () => {
    /* Paid in 45 against a 45-day limit, paying in 30: nothing is past the
       standard, and the gap is 15 days. This is the book the owner reported. */
    const d = tw([cust('C', 45), supp('S', 30)]).payTermsData();
    assert.equal(d.gap, 15);
    assert.equal(d.exceptions.length, 0, 'nothing is past the standard');
    assert.ok(d.drivers.length > 0, 'and the page can still say what is driving it');
    assert.equal(d.drivers[0].id, 'S', 'paying 15 days sooner than the limit is what drives it');
    assert.equal(d.drivers[0].gapDays, 15);
  });

  test('a customer contract drives it by running LATER than its target', () => {
    const d = tw([cust('C', 60)], { payTargets:{ customer:30 } }).payTermsData();
    assert.equal(d.drivers[0].id, 'C');
    assert.equal(d.drivers[0].gapDays, 30, 'the whole side, so its whole distance');
  });

  test('a supplier contract drives it by running SOONER than its target', () => {
    const d = tw([supp('S', 10)], { payTargets:{ supplier:60 } }).payTermsData();
    assert.equal(d.drivers[0].id, 'S');
    assert.equal(d.drivers[0].gapDays, 50);
  });

  test('it is a share of its own side, so a small contract moves the gap less', () => {
    const d = tw([cust('BIG', 30, { value:9000 }), cust('SMALL', 130, { value:1000 })],
      { payTargets:{ customer:30 } }).payTermsData();
    const small = d.drivers.find(r => r.id === 'SMALL');
    assert.equal(d.drivers.length, 1, 'BIG is on target and drives nothing');
    assert.equal(small.gapDays, 10, 'a tenth of the side, a hundred days out');
  });

  test('largest first, and the value breaks a tie', () => {
    const d = tw([cust('A', 60, { value:1000 }), cust('B', 90, { value:1000 })],
      { payTargets:{ customer:30 } }).payTermsData();
    assert.deepEqual(Array.from(d.drivers.map(r => r.id)), ['B', 'A']);
  });

  test('each row carries what a reader has to act on', () => {
    const d = tw([cust('C', 60, { counterparty:'Acme Ltd' })], { payTargets:{ customer:30 } }).payTermsData();
    const r = d.drivers[0];
    assert.equal(r.side, 'customer');
    assert.equal(r.days, 60);
    assert.equal(r.standard, 30);
    assert.equal(r.gapAway, 30);
    assert.equal(r.counterparty, 'Acme Ltd');
    assert.equal(r.id, 'C');
  });

  test('driving the gap and being past the standard are DIFFERENT lists', () => {
    const src = PT.slice(PT.indexOf('const drivers = []'));
    assert.ok(!/exceptions/.test(src.slice(0, 400)), 'the drivers are not the exceptions filtered');
    assert.match(PT, /does not add up to the gap and never claims to/i,
      'the file says out loud that the rows are not a decomposition');
  });

  /* REVERSED IN PLACE 2 Sep 2026, owner-asked: "make this one scrollable table
     with only 'What is driving the gap'". The two cards became one table, so it
     draws whether or not there is a gap — what the claim was really about is
     that the drawing counts nothing of its own and every row is a door. */
  /* REVERSED IN PLACE 2 Sep 2026: the card's population is `against` since the
     owner ruled it should hold "contracts that put you at a disadvantage". The
     claim itself is unchanged — one reading, no counting, every row a door. */
  test('the ONE table reads the one reading, counts nothing, and every row is a door', () => {
    const card = INTEL.slice(INTEL.indexOf('3 · ONE TABLE, PAGED'), INTEL.indexOf('4 · what this page cannot see'));
    assert.match(card, /const against = d\.against \|\| \[\]/, 'it reads the one population');
    assert.match(card, /against\.length/, 'and the head count is that reading\'s own length');
    assert.ok(!/\.reduce\(/.test(card), 'counting is not drawing');
    assert.match(card, /data-pt-open="\$\{E\(r\.id\)\}"/, 'every row opens its contract');
    assert.ok(!INTEL.includes('pt_exc_title'), 'the second card is gone, not hidden');
  });
});

describe('f267 (14) the chart names its boundary, and the graph can group by terms', () => {
  const spread = INTEL.slice(INTEL.indexOf('2 · where the terms sit'), INTEL.indexOf('3b · WHAT IS DRIVING'));

  test('the shaded region the owner ringed is gone', () => {
    assert.ok(!/right:0;background:var\(--st-amber-bg\)/.test(spread),
      'nothing runs from the standard to the right edge any more');
    assert.ok(!/st-amber-bg/.test(spread.slice(0, spread.indexOf('bucketKeys.map'))),
      'no region fill is drawn behind the bars');
  });

  test('the boundary is a line per side, drawn only where that side can answer', () => {
    assert.match(spread, /const lineFor = \(S, ink, key\) => \(S\.rows\.length && S\.standard != null/);
    assert.match(spread, /lc && ls && lc\.std === ls\.std/, 'one line where the two coincide');
    assert.match(spread, /border-left:1px dashed \$\{L\.ink\}/);
  });

  test('the caption sits on the line, under the axis', () => {
    assert.match(spread, /const capAt = si =>/);
    assert.match(spread, /translateX\(-50%\)/, 'centred on its own line');
    assert.match(spread, /si >= cols - 1 \?/, 'and clamped at both ends');
    assert.ok(spread.indexOf('capAt(L.si)') > spread.indexOf('bucketKeys.map(k =>'),
      'the caption row is drawn after the bucket labels, so it is under the axis');
  });

  test('a band past its side\'s line is marked, and never in the side colour', () => {
    assert.match(spread, /const past = b\.n > 0 && S\.standard != null && i > pastFor\(S\)/);
    assert.match(spread, /past \? 'var\(--st-ruby-fg\)'/, 'ruby, because amber is already a side');
  });

  test('the card says whether the lines are your targets or the playbook default', () => {
    assert.match(spread, /pt_targets_set/);
    assert.match(spread, /pt_targets_in_only/);
    assert.match(spread, /pt_targets_out_only/);
  });

  test('payment terms is a group in the graph, and it borrows the tab\'s own bands', () => {
    assert.match(INTEL, /\['payterms','Payment terms'\]/, 'it is on the dropdown');
    assert.match(INTEL, /case 'payterms': \{/, 'and the label reader answers for it');
    assert.match(INTEL, /payBucketOf\(dd\)/, 'the bands are the payment terms tab\'s own');
    assert.match(INTEL, /return 'No payment terms'/, 'and an unread contract is its own group');
  });

  test('both doors onto the grouping learned it, so the dropdown and Copilot agree', () => {
    assert.match(INTEL, /has\('by payment terms'/, 'the phrase router');
    assert.match(INTEL, /payterms:'payment terms'/, 'and the "grouped by" line names it');
  });

  test('the group is a reading, not a second parser', () => {
    const cs = INTEL.slice(INTEL.indexOf("case 'payterms': {"), INTEL.indexOf("case 'source':"));
    assert.ok(!/match\(|replace\(|parseInt|Number\(/.test(cs), 'it asks payDays and nothing else');
  });
});

/* ============================================================
   Owner-asked 2 Sep 2026, off a screenshot of the two stacked cards:
   *"make this one scrollable table with only 'What is driving the gap'. It
   should have columns for contract number, value stream, and value as well.
   Also make the page interactive so that when you click on the graphs they
   filter the table accordingly."* Then, ruled by picker: add payment terms as
   a filter on Contracts, and KEEP the tab.
   ============================================================
    15  one table, one population, the facts as columns
    16  the graph filters the table
    17  payment terms is a filter on Contracts
   ============================================================ */

describe('f267 (15) one table, and the facts are columns', () => {
  test('every counted contract is a row -- both lists, one population', () => {
    const d = tw([cust('OVER', 90), cust('OK', 10), supp('SOON', 10)],
      { payTargets:{ customer:45, supplier:60 } }).payTermsData();
    assert.equal(d.rows.length, d.customer.n + d.supplier.n);
    assert.deepEqual(Array.from(d.rows.map(r => r.id)).sort(), ['OK', 'OVER', 'SOON']);
  });

  test('a row answers BOTH questions, so neither list is lost', () => {
    /* A supplier paid later than the limit is past the standard AND narrows
       the gap -- the two facts the stacked cards used to carry separately. */
    const d = tw([supp('LATE', 95)], { payTargets:{ supplier:60 } }).payTermsData();
    const r = d.rows.find(x => x.id === 'LATE');
    assert.equal(r.over, true, 'past its standard');
    assert.equal(r.gapDays, 0, 'and driving nothing');
    assert.equal(d.exceptions.length, 1);
    assert.equal(d.drivers.length, 0);
  });

  test('the drivers lead by construction, not by being put in a separate box', () => {
    const d = tw([cust('QUIET', 20), cust('LOUD', 90)], { payTargets:{ customer:30 } }).payTermsData();
    assert.equal(d.rows[0].id, 'LOUD');
    assert.ok(d.rows[0].gapDays > 0);
    assert.equal(d.rows[d.rows.length - 1].gapDays, 0, 'and the rest of the book sits behind them');
  });

  test('nothing is counted twice: a row\'s gap IS its driver figure', () => {
    const d = tw([cust('C', 90), supp('S', 10)], { payTargets:{ customer:30, supplier:60 } }).payTermsData();
    d.drivers.forEach(dr => {
      const row = d.rows.find(r => r.id === dr.id);
      assert.equal(row.gapDays, dr.gapDays, dr.id + ' agrees with the drivers reading');
    });
    d.rows.filter(r => !d.drivers.some(dr => dr.id === r.id))
      .forEach(r => assert.equal(r.gapDays, 0, r.id + ' drives nothing and says zero'));
  });

  test('the stream travels as an ID, never as a resolved name', () => {
    const w = tw([Object.assign(cust('C', 30), { folder:'sales' })]);
    assert.equal(w.payTermsData().rows[0].folder, 'sales');
    assert.ok(!/FOLDERS\s*\[/.test(PT), 'the reading never looks a folder name up -- that is a view\'s job');
  });

  test('the table draws all seven columns from ONE template', () => {
    const card = INTEL.slice(INTEL.indexOf('3 · ONE TABLE, PAGED'), INTEL.indexOf('4 · what this page cannot see'));
    assert.match(card, /const PT_COLS =/, 'one column template');
    const uses = [...card.matchAll(/grid-template-columns:\$\{PT_COLS\}/g)];
    assert.equal(uses.length, 2, 'read by the head row and by the data row, and written out nowhere');
    ['pt_col_ref', 'pt_col_party', 'pt_col_stream', 'pt_col_side', 'pt_col_terms', 'pt_col_gap', 'pt_col_value']
      .forEach(k => assert.ok(card.includes(k), k + ' is a column head'));
  });

  /* REVERSED IN PLACE 2 Sep 2026, owner-asked: "This table should be the same
     height as the chart above it. If the list is long then it will have pages
     to click to." A paged region never grows a scrollbar, which is what lets
     the head row be a plain sibling again rather than sticky inside a
     scroller. */
  test('it PAGES inside a box the chart hands it, and never scrolls', () => {
    const card = INTEL.slice(INTEL.indexOf('3 · ONE TABLE, PAGED'), INTEL.indexOf('4 · what this page cannot see'));
    assert.ok(!/overflow-y:auto|max-height:340px|position:sticky/.test(card),
      'no scroller, no sticky head — the box is bounded by the card above it');
    assert.match(card, /id="ig-pt-rows"[^>]*overflow:hidden/, 'the rows region clips rather than scrolls');
    assert.match(card, /ptPagerHtml\(page, pages\)/);
    assert.ok(!/auto/.test(card.slice(card.indexOf('const PT_COLS'), card.indexOf('const cut'))),
      'every column is a fraction: `auto` sizes to content, so two grids sharing '
      + 'one template string would still draw different widths');
  });
});

describe('f267 (16) the graph filters the table', () => {
  const chart = INTEL.slice(INTEL.indexOf('2 · where the terms sit'), INTEL.indexOf('3 · ONE TABLE, PAGED'));

  test('a bar is a real button, so it is reachable without a mouse', () => {
    assert.match(chart, /<button type="button" \$\{b\.n \? '' : 'disabled '\}data-pt-bar=/);
    assert.match(chart, /aria-pressed=/);
  });

  test('an empty bar is disabled -- a press that could only empty the table is a dead press', () => {
    assert.match(chart, /\$\{b\.n \? '' : 'disabled '\}/);
    assert.match(chart, /cursor:\$\{b\.n \? 'pointer' : 'default'\}/);
  });

  test('the legend narrows to a side', () => {
    assert.match(chart, /data-pt-side="\$\{E\(S\.key\)\}"/);
  });

  test('the press toggles, so the way back is on the thing that was pressed', () => {
    const wire = INTEL.slice(INTEL.indexOf('function ptWire()'), INTEL.indexOf('function intelPayTermsHtml()'));
    assert.match(wire, /c\.side === side && c\.bucket === bucket\) \? \{ side:null, bucket:null \}/);
    assert.match(wire, /c\.side === side && !c\.bucket\) \? \{ side:null, bucket:null \}/);
  });

  test('a press repaints the BODY, never the view', () => {
    const rp = INTEL.slice(INTEL.indexOf('function ptRepaint()'), INTEL.indexOf('function ptWire()'));
    assert.match(rp, /getElementById\('ig-pt-body'\)/);
    assert.ok(!/renderIntel\(\)/.test(rp), 'renderIntel would rebuild the tab strip and lose the reader\'s place');
    assert.match(rp, /host\.scrollTop = keep/, 'and it keeps the place in the table');
    assert.match(rp, /ptWire\(\)/, 'the listeners are re-armed on markup that has just been replaced');
  });

  test('the cut is per sitting and in memory, with no store behind it', () => {
    assert.match(INTEL, /ptCut:\{ side:null, bucket:null \}/);
    assert.ok(!/localStorage[^\n]*ptCut/.test(INTEL), 'nothing is stored');
  });

  test('a narrowed table SAYS so and carries the way back', () => {
    const card = INTEL.slice(INTEL.indexOf('3 · ONE TABLE, PAGED'), INTEL.indexOf('4 · what this page cannot see'));
    assert.match(card, /pt_showing/);
    assert.match(card, /data-pt-clear/);
    assert.match(card, /pt_show_all/);
    assert.ok(card.indexOf('cutWords') < card.indexOf('cutLine'), 'and it names the cut in words');
  });

  test('a cut that matches nothing says so rather than drawing an empty box', () => {
    const card = INTEL.slice(INTEL.indexOf('3 · ONE TABLE, PAGED'), INTEL.indexOf('4 · what this page cannot see'));
    assert.match(card, /pt_tbl_none/);
  });
});

describe('f267 (17) payment terms is a filter on Contracts', () => {
  const REG = read('js/views/register.js');
  const regw = (contracts, R) => {
    const w = buildWorld({ registerView:true }).win;
    w.state = Object.assign({}, w.state, { contracts, settings:{} });
    Object.assign(w.regState(), { stage:'all', type:'all', view:null, category:'all',
      renewal:'all', signed:'all', payterms:'all', query:'', only:null }, R || {});
    return w;
  };
  const book = () => [cust('A', 20), cust('B', 60), supp('C', 20),
    meta(con('D'), { paymentTerms:'payment as agreed' })];

  test('it is in the catalogue and NOT one of the default four', () => {
    assert.match(REG, /\{ k:'payterms', fixed:false/);
    assert.ok(!/REG_BAR_DEFAULT = \[[^\]]*payterms/.test(REG), 'the bar still fits on one line');
  });

  test('it draws on its own the moment it is narrowing -- it can never be quietly on', () => {
    assert.match(REG, /if\(k==='payterms'\) return !!R\.payterms && R\.payterms!=='all';/);
  });

  test('the bands are the payment terms tab\'s own, never a second ladder', () => {
    assert.match(REG, /PAY_BUCKETS/);
    assert.match(REG, /payBucketOf\(dd\)===R\.payterms/);
    assert.ok(!/reg_payterms_0_30|'0–30'/.test(REG), 'no band is typed out here');
  });

  test('it narrows to a band', () => {
    const w = regw(book(), { payterms:'0–30' });
    assert.deepEqual(Array.from(w.regFiltered().map(c => c.id)).sort(), ['A', 'C']);
  });

  test('"not recorded" is the worklist that fixes the data gap', () => {
    const w = regw(book(), { payterms:'none' });
    assert.deepEqual(Array.from(w.regFiltered().map(c => c.id)), ['D']);
  });

  test('"any" narrows nothing', () => {
    assert.equal(regw(book()).regFiltered().length, 4);
  });

  test('Clear puts it back, and the page counts as filtered while it is on', () => {
    assert.match(REG, /R\.payterms='all';/, 'clear-all clears it');
    assert.match(REG, /\(R\.payterms&&R\.payterms!=='all'\)\|\|!!R\.only/,
      'and an on filter makes the page read as narrowed, so Clear offers itself');
  });

  /* PINNED AS SOURCE, and the reason is worth writing down: these modules are
     evaluated into one script scope, so payterms.js's `const payDays` is a
     LEXICAL binding the register reads directly — deleting window.payDays does
     not hide it, and a test that tried would be asserting against a stage the
     product never has. What can be pinned is that the guard is there, which is
     what a shell without the module (the phone, a harness page) relies on. */
  test('a stage without the reading narrows nothing rather than emptying the register', () => {
    assert.match(REG, /R\.payterms!=='all'&&typeof payDays==='function'/,
      'the filter stands down where the reading is absent');
    assert.match(REG, /typeof payBucketOf==='function'/);
    assert.ok(!/window\.payDays/.test(REG), 'read bare, never through a window guard that is always false');
  });

  test('both languages', () => {
    ['reg_payterms', 'reg_payterms_title', 'reg_payterms_none',
     'pt_col_ref', 'pt_col_party', 'pt_col_stream', 'pt_col_side', 'pt_col_terms',
     'pt_col_gap', 'pt_col_value', 'pt_no_stream', 'pt_over_tag', 'pt_tbl_q',
     'pt_tbl_none', 'pt_showing', 'pt_show_all'].forEach(k => {
      const hits = [...I18N.matchAll(new RegExp('^\\s*' + k + ": '", 'gm'))];
      assert.equal(hits.length, 2, k + ' is in both dictionaries exactly once each');
    });
  });
});

/* ============================================================
   Owner-asked 2 Sep 2026: *"This table should be the same height as the chart
   above it. If the list is long then it will have pages to click to. This
   table should also only contain contracts that are greater than the company
   standard / preferred payment terms."* Then, on the two readings of that last
   sentence: *"the card should have contracts that put you at a disadvantage
   when it comes to payment terms."*
   ============================================================
    18  at a disadvantage -- and it is not the over-standard list
    19  one box the chart hands down, and pages inside it
   ============================================================ */

describe('f267 (18) at a disadvantage, read in each side\'s own direction', () => {
  const w = () => tw([
    cust('CUST-LATE', 90),   // paid later than target -- money arrives late
    cust('CUST-OK', 20),
    supp('SUPP-SOON', 10),   // we pay sooner than target -- money leaves early
    supp('SUPP-LATE', 95),   // we pay later than our own policy -- money we keep
  ], { payTargets:{ customer:30, supplier:60 } }).payTermsData();

  test('a customer paid later than target is against you', () => {
    assert.equal(w().rows.find(r => r.id === 'CUST-LATE').disadvantage, true);
  });

  test('a supplier paid SOONER than target is against you too', () => {
    const r = w().rows.find(r => r.id === 'SUPP-SOON');
    assert.equal(r.disadvantage, true);
    assert.equal(r.gapAway, 50, 'fifty days earlier than you need to pay');
  });

  test('a supplier paid LATER than your own policy is NOT — that is money you keep', () => {
    const r = w().rows.find(r => r.id === 'SUPP-LATE');
    assert.equal(r.disadvantage, false);
    assert.equal(r.over, true, 'it is still past the standard, which is a different question');
  });

  test('a contract on its target is on neither list', () => {
    const r = tw([cust('ON', 30)], { payTargets:{ customer:30 } }).payTermsData().rows[0];
    assert.equal(r.disadvantage, false);
    assert.equal(r.over, false);
  });

  test('THE CARD AND THE OVER-STANDARD LIST ARE DIFFERENT LISTS', () => {
    const d = w();
    assert.deepEqual(Array.from(d.against.map(r => r.id)), ['CUST-LATE', 'SUPP-SOON']);
    assert.deepEqual(Array.from(d.exceptions.map(r => r.id)).sort(), ['CUST-LATE', 'SUPP-LATE']);
  });

  test('the reported row goes: 30 against a 30-day target is not a disadvantage', () => {
    /* The owner's own screenshot — MK-363, a supplier at "30 → 30 days" with an
       em-dash in the Gap column — is exactly the row this rule removes. */
    const d = tw([cust('KEEP', 45), supp('DROP', 30)], { payTargets:{ customer:30, supplier:30 } }).payTermsData();
    assert.deepEqual(Array.from(d.against.map(r => r.id)), ['KEEP']);
  });

  test('a contract with no value on file is still listed — its SHARE is nil, its terms are not', () => {
    /* gapDays is a share of the side and goes to zero on a valueless contract
       in a value-weighted book. Being at a disadvantage is about the TERMS. */
    const d = tw([cust('BIG', 20, { value:9000000 }), cust('POOR', 90, { value:0 })],
      { payTargets:{ customer:30 } }).payTermsData();
    assert.equal(d.basis, 'value');
    const poor = d.against.find(r => r.id === 'POOR');
    assert.ok(poor, 'it is on the card');
    assert.equal(poor.gapAway, 60, 'and it says how far out it is');
    assert.equal(poor.gapDays, 0, 'even though it moves the average by nothing');
  });

  test('the card names its population and the count is that reading\'s own length', () => {
    const card = INTEL.slice(INTEL.indexOf('3 · ONE TABLE, PAGED'), INTEL.indexOf('4 · what this page cannot see'));
    assert.match(card, /pt_drive_flag', \{ n:n\(against\.length\) \}/);
    assert.ok(!/pt_exc_flag/.test(card), 'no flag counting something the table does not hold');
  });

  test('an empty card says which kind of empty it is', () => {
    const card = INTEL.slice(INTEL.indexOf('3 · ONE TABLE, PAGED'), INTEL.indexOf('4 · what this page cannot see'));
    assert.match(card, /against\.length \? 'pt_tbl_none' : 'pt_tbl_clear'/,
      'a cut that matched nothing is a different fact from a book with nothing against you');
  });

  test('one arithmetic: the drivers read the row\'s own distance', () => {
    assert.match(PT, /const days = Math\.round\(share \* r\.gapAway \* 10\) \/ 10;/,
      'never a second copy of "how far out is this"');
  });
});

describe('f267 (19) one box the chart hands down, and pages inside it', () => {
  test('the height is MEASURED off the chart card, never typed', () => {
    const fit = INTEL.slice(INTEL.indexOf('function ptFitTable()'), INTEL.indexOf("/* ---- THE TAB'S OWN PRESSES"));
    assert.match(fit, /querySelector\('\[role="img"\]'\)/, 'the chart is found by its plot, not by a name');
    assert.match(fit, /card\.style\.height = h \+ 'px'/);
    assert.ok(!/height\s*=\s*['"]?\d{3}/.test(fit), 'no number is typed for it');
  });

  test('a zero is not an answer — a pane still laying out keeps the size it had', () => {
    const fit = INTEL.slice(INTEL.indexOf('function ptFitTable()'), INTEL.indexOf("/* ---- THE TAB'S OWN PRESSES"));
    assert.match(fit, /if\(!\(rowH > 0\) \|\| !\(room > 0\)\) return;/);
    assert.match(fit, /if\(h > 0\)/);
  });

  test('the page size falls out of the room that is left, above a floor', () => {
    const fit = INTEL.slice(INTEL.indexOf('function ptFitTable()'), INTEL.indexOf("/* ---- THE TAB'S OWN PRESSES"));
    assert.match(fit, /Math\.max\(PT_PAGE_MIN, Math\.floor\(room \/ rowH\)\)/);
    assert.match(INTEL, /const PT_PAGE_MIN = \d/);
  });

  test('it re-fits only when the answer changes, so it cannot loop', () => {
    const fit = INTEL.slice(INTEL.indexOf('function ptFitTable()'), INTEL.indexOf("/* ---- THE TAB'S OWN PRESSES"));
    assert.match(fit, /if\(fit !== _ptPageSize\)\{ _ptPageSize = fit; ptRepaint\(\); return; \}/);
  });

  test('and it follows the chart when the window moves', () => {
    const fit = INTEL.slice(INTEL.indexOf('function ptFitTable()'), INTEL.indexOf("/* ---- THE TAB'S OWN PRESSES"));
    assert.match(fit, /ResizeObserver/);
    assert.match(fit, /chart\.dataset\.ptObs/, 'armed once per paint, because the element it watches is replaced');
  });

  test('the pager is the register\'s own shape, and draws nothing on one page', () => {
    const pg = INTEL.slice(INTEL.indexOf('function ptPagerHtml'), INTEL.indexOf('function ptFitTable()'));
    assert.match(pg, /if\(pages <= 1\) return '';/);
    assert.match(pg, /data-pt-page=/);
    assert.match(pg, /reg_page_of/, 'one wording for "page N of M", not a second');
    assert.match(pg, /…/, 'numbers with an ellipsis, like the register');
  });

  test('the page is clamped, so a cut cannot strand a reader on page 3', () => {
    const card = INTEL.slice(INTEL.indexOf('3 · ONE TABLE, PAGED'), INTEL.indexOf('4 · what this page cannot see'));
    assert.match(card, /const page = Math\.min\(Math\.max\(1, intel\.ptPage \|\| 1\), pages\)/);
  });

  test('changing the cut starts at page one', () => {
    const wire = INTEL.slice(INTEL.indexOf('function ptWire()'), INTEL.indexOf('function intelPayTermsHtml()'));
    assert.equal([...wire.matchAll(/intel\.ptPage = 1;/g)].length, 3,
      'both graph cuts and Show all');
    assert.match(wire, /data-pt-page/, 'and the pager presses are wired');
  });

  test('the page is per sitting and in memory', () => {
    assert.match(INTEL, /ptCut:\{ side:null, bucket:null \}, ptPage:1,/);
    assert.ok(!/localStorage[^\n]*ptPage/.test(INTEL), 'nothing is stored');
  });
});
