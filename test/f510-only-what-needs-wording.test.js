/* f510 — ONLY A RISK THAT NEEDS WORDING GOES IN THE REDLINES CARD
   (Young, 5 Oct 2026: "any risks that do not require an amendment to the
   contract or need additional language to contract should not be moved to the
   redline panel", then "Go ahead")
   ============================================================================
   The browser half is only-what-needs-wording-verify; this pins, fast:

     (A) EVERY RULE IS MARKED — every rule id a scanner can write (and, where
         its meaning turns on its kind, every kind it writes) has a true/false
         mark in RK_NEEDS_WORDING; a new rule cannot arrive unmarked;
     (B) FACTS AND STEPS STAY OUT — "Governing law: <your own> (found in
         text)", payment terms of 45 days or less, the termination notice, a
         box to fill (deposit), and steps outside the contract (stamp duty,
         the certificate) are not listed; foreign law, long payment terms and
         the rest are; an unmarked id is shown, never guessed away;
     (C) COPILOT'S OWN MARK — a brief watch-out or unusual term marked
         `wording: false` is not listed; true is; a brief written before the
         mark (none) is shown;
     (D) THE BRIEF ASKS FOR IT — both of the brief's lists carry a required
         boolean `wording` with one shared description, and the prompt says
         what it means; the readers carry it through.

   Run: node --test test/f510-only-what-needs-wording.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const J = v => JSON.parse(JSON.stringify(v));
const SRC = read('js/risks.js');
const CM = read('js/clausemodel.js');
const CV = read('js/views/contract.js');
const AI = read('js/ai.js');
const SRV = read('server/server.js');
const KINDS = CM.slice(CM.indexOf('const CLAUSE_KINDS = ['), CM.indexOf('/* ---------- reading a heading'));
/* The brief's two readers, as the contract view writes them. */
const fnSrc = name => { const i = CV.indexOf('function ' + name + '('); return CV.slice(i, CV.indexOf('\n}\n', i) + 2); };
const BRIEF_READERS = fnSrc('docXrayBriefWatch') + fnSrc('docXrayBriefOdd');

function load(extra = {}){
  const ctx = { console, ...extra };
  ctx.window = ctx;
  ctx.persist = () => {};
  ctx.document = { getElementById: () => null, querySelector: () => null };
  vm.createContext(ctx);
  vm.runInContext(KINDS + '\nObject.assign(window, { CLAUSE_KINDS, clauseKindByKey, clauseKind, ruleKind });', ctx);
  vm.runInContext(BRIEF_READERS, ctx);
  vm.runInContext(SRC, ctx);
  return ctx;
}
const keys = (w, c) => J(w.riskItemsOf(c)).map(x => x.key);
const f = (id, kind, title, extra) => ({ id, sev: 'low', kind, title, anchor: 'doc', ...extra });

/* Every add('<id>', sev, kind, …) the scanners write, with each kind it can
   take ("d>45?'risk':'ambiguity'" is two). */
const RULES = (() => {
  const out = {};
  for (const m of (AI + CV).matchAll(/add\('([a-z]+-[a-z]+)',\s*[^,]+,\s*([^,]+),/g)){
    const kinds = [...m[2].matchAll(/'([a-z]+)'/g)].map(k => k[1]);
    (out[m[1]] = out[m[1]] || new Set());
    kinds.forEach(k => out[m[1]].add(k));
  }
  return out;
})();

describe('f510 (A) every rule is marked', () => {
  test('the scanners were read', () => {
    assert.ok(Object.keys(RULES).length >= 50, Object.keys(RULES).length + ' rules');
  });
  test('each rule, and each kind it writes, has a true/false mark', () => {
    const w = load();
    for (const [id, kinds] of Object.entries(RULES)){
      const byId = typeof w.RK_NEEDS_WORDING[id] === 'boolean';
      for (const k of kinds){
        const byKind = typeof w.RK_NEEDS_WORDING[id + '_' + k] === 'boolean';
        assert.ok(byId || byKind, `${id} (${k}) is marked — a new rule must say whether it needs wording`);
      }
    }
  });
  test('no mark names a rule that no scanner writes', () => {
    const w = load();
    for (const k of Object.keys(w.RK_NEEDS_WORDING)){
      const id = k.replace(/_[a-z]+$/, '');
      assert.ok(RULES[id], k + ' names a rule a scanner writes');
    }
  });
  test('the old hand list is gone', () => {
    const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    assert.ok(!/RK_ADVICE_IDS/.test(strip(SRC)), 'RK_ADVICE_IDS is stale');
  });
});

describe('f510 (B) facts and steps stay out; what needs wording stays in', () => {
  const scan = () => ({ at: 'today', dismissed: [], findings: [
    f('t-law', 'ambiguity', 'Governing law: Sweden (found in text)', { quote: 'governed by the laws of Sweden' }),
    f('t-pay', 'ambiguity', 'Payment terms: 30 days', { quote: 'within 30 days' }),
    f('t-term', 'ambiguity', 'Termination notice: 90 days', { quote: 'ninety (90) days' }),
    f('le-dep', 'missing', 'Security deposit not specified', { anchor: 'c3', sev: 'high' }),
    f('le-stamp', 'risk', 'Stamp duty not evidenced', { anchor: 'c4' }),
    f('cm-fs', 'risk', 'Food-safety certification not evidenced', { anchor: 'c3' }),
    f('rm-kebs', 'risk', 'Product standard not cited', { anchor: 'c3' }),
    f('t-liab', 'risk', 'Liability / indemnity — review carefully', { quote: 'liability is capped' }),
  ] });
  test('the facts, the box and the steps outside the contract are not listed', () => {
    const k = keys(load(), { scan: scan(), changes: [] });
    for (const id of ['t-law', 't-pay', 't-term', 'le-dep', 'le-stamp', 'cm-fs']) assert.ok(!k.includes('s:' + id), id + ' is not a risk to redline');
    assert.deepEqual(k.sort(), ['s:rm-kebs', 's:t-liab']);
  });
  test('the same rule with the other kind is listed: foreign law, payment terms over 45 days', () => {
    const w = load();
    const c = { scan: { at: 'today', dismissed: [], findings: [
      f('t-law', 'risk', 'Foreign governing law detected', { quote: 'laws of England', sev: 'high' }),
      f('t-pay', 'risk', 'Payment terms: 90 days', { quote: 'within 90 days', sev: 'med' }),
    ] }, changes: [] };
    assert.deepEqual(keys(w, c).sort(), ['s:t-law', 's:t-pay'], 'foreign law and long terms');
    assert.equal(w.riskNeedsWording({ id: 't-law', kind: 'missing' }), true);
  });
  test('an unmarked id is shown, never guessed away', () => {
    const w = load();
    assert.equal(w.riskNeedsWording({ id: 'zz-old', kind: 'risk' }), true);
    assert.deepEqual(keys(w, { scan: { at: 'today', dismissed: [], findings: [f('zz-old', 'risk', 'A retired rule')] }, changes: [] }), ['s:zz-old']);
  });
  test('the scan keeps every finding', () => {
    const c = { scan: scan(), changes: [] };
    load().riskOpenOf(c);
    assert.equal(c.scan.findings.length, 8);
  });
});

describe('f510 (C) Copilot\'s own mark on the brief', () => {
  const brief = () => ({ data: {
    watchouts: [
      { point: 'The supplier can raise prices on 30 days’ notice.', why: 'Costs can rise mid-term.', quote: 'on 30 days notice', wording: true },
      { point: 'The certificate must be kept current.', why: 'A lapse is a breach.', wording: false },
      { point: 'Notices go to a postal address only.', why: 'Email is not valid notice.' },
    ],
    unusual: [
      { point: 'Exclusivity runs for ten years.', why: 'Long for this kind of contract.', wording: true },
      { point: 'Your own law governs it.', why: 'Disputes stay close to home.', wording: false },
      'An old brief’s bare sentence.',
    ] } });
  test('marked false is not listed; true is; no mark (an older brief) is shown', () => {
    const w = load();
    const c = { _brief: brief(), changes: [] };
    const t = J(w.riskItemsOf(c)).map(x => x.title);
    assert.ok(t.includes('The supplier can raise prices on 30 days’ notice.'));
    assert.ok(!t.includes('The certificate must be kept current.'), 'a step outside the contract');
    assert.ok(t.includes('Notices go to a postal address only.'), 'no mark: shown');
    assert.ok(t.includes('Exclusivity runs for ten years.'));
    assert.ok(!t.includes('Your own law governs it.'), 'a fact worth knowing');
    assert.ok(t.includes('An old brief’s bare sentence.'));
  });
  test('the readers carry the mark, null where the brief has none', () => {
    const w = load();
    const c = { _brief: brief() };
    assert.deepEqual(J(w.docXrayBriefWatch(c)).map(x => x.wording), [true, false, null]);
    assert.deepEqual(J(w.docXrayBriefOdd(c)).map(x => x.wording), [true, false, null]);
  });
});

describe('f510 (D) the brief asks for the mark', () => {
  const at = SRV.indexOf("name: 'contract_brief'");
  const tool = SRV.slice(at, SRV.indexOf('const prompt = ', at));
  test('both lists carry a required boolean "wording" with one shared description', () => {
    assert.ok(at > 0, 'the brief tool is found');
    assert.equal((tool.match(/wording: \{ type: 'boolean', description: BRIEF_WORDING_MARK \}/g) || []).length, 2);
    /* 'title' joined the list on 5 Oct 2026 (f522, Risk Card Titles); the
       claim here is only that 'wording' is required on both. */
    assert.equal((tool.match(/required: \['point', (?:'title', )?'why', 'wording'\]/g) || []).length, 2);
    assert.match(SRV, /const BRIEF_WORDING_MARK = 'True only if dealing with this would mean changing the contract\\'s wording or adding wording to it\./);
  });
  test('the prompt says what the mark means', () => {
    const p = SRV.slice(SRV.indexOf('const prompt = `You are explaining a contract'), SRV.indexOf('DOCUMENT:\\n${sent}`'));
    assert.match(p, /Mark each one "wording": true only if dealing with it would mean changing the contract's wording or adding wording to it; false if it is a step outside the contract, a box to fill, or simply a fact worth knowing\./);
  });
});
