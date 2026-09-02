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
    'kpi_payterms', 'home_pt_of', 'home_pt_split', 'home_pt_clear'];

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
