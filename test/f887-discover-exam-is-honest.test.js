'use strict';
/* ═══════════════════════════════════════════════════════════════
   f887 — THE DISCOVER EXAM IS HONEST ABOUT ITS OWN WORLD (stage 0 of
   docs/PLAN-jambo-discover.md, owner 25 Oct 2026: "measure first")

   test/discover-measure.js asks Jambo forty questions of eleven contracts
   and grades his answers against a written-down truth. A measure is only as
   good as that truth, so this pins it, with no server and no AI:
   (1) the exam: forty questions, six facts, every fact asked six ways or
       more, no question twice, the Due diligence pack is five of them.
   (2) THE TRUTH MATCHES THE WORDING: wherever the truth says a contract
       answers a question, the right answer is in that contract's own words;
       wherever it says the wording is silent, the words carry nothing on it;
       the one contract with no wording has none.
   (3) THE MARKER: a right answer is marked right, a wrong one wrong, a
       missing one a dead end; "not found" is right only where the wording is
       silent; "not capped" reads as no; a verdict is judged only when given.
   AT THE PARENT (a992f4c) every claim fails: none of the three files exists.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { TRUTH, IDS, WORDING, discoverContracts, RULES } = require('./discover-world');
const { DISCOVER_EXAM, PACK_DD, grade, polarity } = require('./discover-exam');

const FACTS = ['notice', 'cap', 'law', 'renewal', 'data', 'payment'];
/* the word a clause on each fact cannot be written without */
const TELL = { notice: /terminat/i, cap: /liabilit/i, law: /governed/i, renewal: /renew/i, data: /personal data/i, payment: /\bpay\b/i };

describe('f887 (1) the exam', () => {
  test('1a forty questions, six facts, each asked six ways or more, none twice', () => {
    assert.equal(DISCOVER_EXAM.length, 40);
    for (const f of FACTS) assert.ok(DISCOVER_EXAM.filter(x => x.fact === f).length >= 6, f);
    assert.deepEqual([...new Set(DISCOVER_EXAM.map(x => x.fact))].sort(), [...FACTS].sort());
    const qs = DISCOVER_EXAM.map(x => x.q.trim().toLowerCase());
    assert.equal(new Set(qs).size, qs.length, 'no question twice');
    for (const x of DISCOVER_EXAM) assert.ok(['amount', 'yesno'].includes(x.form), x.q);
  });
  test('1b the Due diligence pack is five of the questions, one per fact, payment left out', () => {
    assert.equal(PACK_DD.length, 5);
    const facts = PACK_DD.map(q => DISCOVER_EXAM.find(x => x.q === q).fact);
    assert.deepEqual(facts, ['notice', 'cap', 'law', 'renewal', 'data']);
  });
  test('1c every rule but payment is written down; payment has none on purpose', () => {
    for (const f of FACTS) assert.ok(f in RULES, f);
    assert.equal(RULES.payment, null);
  });
});

describe('f887 (2) the truth matches the wording', () => {
  test('2a eleven contracts, ten with wording, one with none', () => {
    const cs = discoverContracts();
    assert.deepEqual(cs.map(c => c.id), IDS);
    assert.equal(IDS.length, 11);
    assert.equal(cs.filter(c => c.redlineText).length, 10);
    const empty = cs.find(c => !c.redlineText);
    assert.equal(TRUTH[empty.id].noWording, true);
  });
  test('2b where the truth says it speaks, the right answer is in its own words', () => {
    for (const id of IDS){
      if (TRUTH[id].noWording) continue;
      for (const f of FACTS){
        const t = TRUTH[id][f];
        assert.ok(t, `${id} has a truth for ${f}`);
        if (!t.found) continue;
        assert.ok(TELL[f].test(WORDING[id]), `${id} carries a clause on ${f}`);
        const sentences = WORDING[id].split(/\n|(?<=\.)\s/).filter(s => TELL[f].test(s) || f === 'cap' && /deposit/i.test(s) || f === 'notice' && /terminat/i.test(s));
        assert.ok(sentences.some(s => (t.rests || t.re).test(s)), `${id} · ${f}: the right answer ${t.rests || t.re} is in the wording`);
        assert.equal(typeof t.yes, 'boolean', `${id} · ${f} has a polarity`);
        assert.ok(t.verdict === 'in' || t.verdict === 'out' || (f === 'payment' && t.verdict === null), `${id} · ${f} verdict`);
      }
    }
  });
  test('2c where the truth says it is silent, the words carry nothing on it', () => {
    for (const id of IDS){
      if (TRUTH[id].noWording) continue;
      for (const f of FACTS) if (!TRUTH[id][f].found) assert.ok(!TELL[f].test(WORDING[id]), `${id} is silent on ${f}`);
    }
  });
  test('2d some contracts break each rule and some keep it, so a verdict can be wrong both ways', () => {
    for (const f of FACTS.filter(x => x !== 'payment')){
      const v = IDS.filter(id => !TRUTH[id].noWording && TRUTH[id][f].found).map(id => TRUTH[id][f].verdict);
      assert.ok(v.includes('in') && v.includes('out'), f + ': ' + v.join(','));
    }
  });
});

describe('f887 (3) the marker', () => {
  const item = f => DISCOVER_EXAM.find(x => x.fact === f && x.form === 'amount');
  const yn = f => DISCOVER_EXAM.find(x => x.fact === f && x.form === 'yesno');
  const said = (answer, extra) => Object.assign({ found: true, answer, detail: '', quote: 'Either Party may terminate this Agreement.', quoteMissing: false }, extra || {});

  test('3a right is right, wrong is wrong, missing is a dead end', () => {
    assert.equal(grade(item('notice'), TRUTH['DV-01'].notice, said('90 days', { detail: 'either side' })).mark, 'right');
    assert.equal(grade(item('notice'), TRUTH['DV-01'].notice, said('30 days')).mark, 'wrong');
    assert.equal(grade(item('notice'), TRUTH['DV-01'].notice, undefined).mark, 'dead');
    assert.equal(grade(item('cap'), TRUTH['DV-04'].cap, said('Not capped')).mark, 'right');
    assert.equal(grade(item('cap'), TRUTH['DV-04'].cap, said('12 months of fees')).mark, 'wrong');
  });
  test('3b "not found" is right only where the wording is silent', () => {
    const nf = { found: false, answer: '', detail: 'no clause' };
    assert.equal(grade(item('data'), TRUTH['DV-01'].data, nf).mark, 'right');
    assert.equal(grade(item('data'), TRUTH['DV-03'].data, nf).mark, 'wrong');
    assert.equal(grade(item('data'), TRUTH['DV-01'].data, said('Yes')).mark, 'wrong', 'found where silent');
  });
  test('3c a yes/no question reads yes or no, "not capped" is no, an amount alone still counts', () => {
    assert.equal(polarity('Not capped'), false);
    assert.equal(polarity('Yes · 90 days'), true);
    assert.equal(polarity('90 days'), null);
    assert.equal(grade(yn('renewal'), TRUTH['DV-01'].renewal, said('Yes', { detail: '90 days to say no' })).mark, 'right');
    assert.equal(grade(yn('renewal'), TRUTH['DV-05'].renewal, said('No', { detail: 'expires on the date' })).mark, 'right');
    assert.equal(grade(yn('renewal'), TRUTH['DV-05'].renewal, said('Yes')).mark, 'wrong');
    assert.equal(grade(yn('law'), TRUTH['DV-01'].law, said('Kenya')).mark, 'right', 'the amount alone, matching');
    assert.equal(grade(yn('renewal'), TRUTH['DV-09'].renewal, said('No')).mark, 'right', 'silent wording answered "no"');
  });
  test('3d no wording is right only as "no wording"', () => {
    assert.equal(grade(item('notice'), TRUTH['DV-11'], { found: false, noWording: true }).mark, 'right');
    assert.equal(grade(item('notice'), TRUTH['DV-11'], said('90 days')).mark, 'wrong');
    assert.equal(grade(item('notice'), TRUTH['DV-01'].notice, { found: false, noWording: true }).mark, 'wrong');
  });
  test('3e a sentence is counted checked only when the route kept it; a verdict only when given', () => {
    const a = grade(item('notice'), TRUTH['DV-01'].notice, said('90 days'));
    assert.equal(a.quoted, true);
    assert.equal('verdictRight' in a, false, 'no verdict given, none judged');
    assert.equal(grade(item('notice'), TRUTH['DV-01'].notice, said('90 days', { quoteMissing: true })).quoted, false);
    assert.equal(grade(item('notice'), TRUTH['DV-03'].notice, said('30 days', { verdict: 'out' })).verdictRight, true);
    assert.equal(grade(item('notice'), TRUTH['DV-03'].notice, said('30 days', { verdict: 'in' })).verdictRight, false);
    assert.equal(grade(item('payment'), TRUTH['DV-01'].payment, said('30 days', { verdict: 'norule' })).verdictRight, true, 'payment: no rule');
  });
  test('3f a number of days with its unit run on is read as that number, never inside a longer one (the live run, 25 Oct 2026)', () => {
    const who = DISCOVER_EXAM.find(x => x.q === 'Who can end it early, and how fast?');
    assert.equal(grade(who, TRUTH['DV-04'].notice, said('Supplier 180d, Bank 30d', { detail: 'asymmetric notice periods' })).mark, 'right', '"180d" is 180 days');
    assert.equal(grade(item('notice'), TRUTH['DV-01'].notice, said('90d')).mark, 'right');
    assert.equal(grade(item('notice'), TRUTH['DV-01'].notice, said('190 days')).mark, 'wrong', 'not inside a longer number');
    assert.equal(grade(item('notice'), TRUTH['DV-01'].notice, said('900 days')).mark, 'wrong');
    assert.equal(grade(item('payment'), TRUTH['DV-05'].payment, said('17 days')).mark, 'wrong', 'seven is not inside seventeen');
  });
});
