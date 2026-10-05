/* f509 — A RISK FINDS ITS CLAUSE, AND WHERE HaTi CANNOT TELL THE READER POINTS
   (Young, 5 Oct 2026: over "Product standard not cited" opening an empty new
   clause after Governing Law with Copilot refusing; picked "Find the clause"
   with "You point" behind it, and the two small fixes, then "Build the
   recommendation and merge to main")
   ============================================================================
   The browser half is a-risk-finds-its-clause-verify; this pins, fast:

     (A) FIND THE CLAUSE — a rule that names a template clause by its tag
         (`c3`) opens THAT clause, found by the title the template's own paper
         gives the tag (templateClauseTitles); the quoted words still win; a
         renamed clause finds nothing rather than a guess;
     (B) MORE TOPICS, FOR RISKS ONLY — quality, insurance, warranty, delivery
         and intellectual property are read after Our standards' six, which
         are unchanged; an Insurance redline now covers an insurance risk;
     (C) YOU POINT — a risk HaTi cannot place comes back `choose`; a missing
         thing, or a known topic with no clause, is still a new clause;
     (D) THE WALK — while it waits for the reader Copilot is not asked and the
         quick asks are grey; "Which clause is this about?" offers every clause
         to change and every place for a new one; the choice opens that clause
         (or holds the new one) and asks Copilot once;
     (E) COPILOT WROTE NOTHING — said quietly with the way forward under it,
         never in red, and the box opens on the clause in front of the reader;
     (F) THE REQUEST — with no wording, Copilot is told there is none; with
         wording, the request is as it was;
     (G) every new word is in both books.

   Run: node --test test/f509-a-risk-finds-its-clause.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const J = v => JSON.parse(JSON.stringify(v));
const SRC = read('js/risks.js');
const CM = read('js/clausemodel.js');
const KINDS = CM.slice(CM.indexOf('const CLAUSE_KINDS = ['), CM.indexOf('/* ---------- reading a heading'));

function load(extra = {}){
  const ctx = { console, ...extra };
  ctx.window = ctx;
  ctx.persist = () => {};
  ctx.document = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] };
  vm.createContext(ctx);
  vm.runInContext(KINDS + '\nObject.assign(window, { CLAUSE_KINDS, clauseKindByKey, clauseKind, ruleKind });', ctx);
  vm.runInContext(SRC, ctx);
  return ctx;
}
/* The raw-material agreement as the negotiation copy reads it: the template's
   titles, numbered, the shared clauses between, the signatures last. */
const RM = [
  { clauseId: 'k1', title: 'Supply & Specification', headingText: '1. Supply & Specification', text: 'The Supplier shall supply the material to specification.' },
  { clauseId: 'k2', title: 'Price & Payment', headingText: '2. Price & Payment', text: 'Payment within 30 days.' },
  { clauseId: 'k3', title: 'Quality & Rejection', headingText: '3. Quality & Rejection', text: 'Consignments failing specification may be rejected within 3 days.' },
  { clauseId: 'k4', title: 'Governing Law', headingText: '4. Governing Law', text: 'Laws of Kenya.' },
  { clauseId: 'k5', title: 'Signatures', headingText: '5. Signatures', text: 'Signed for and on behalf of each party.' },
];
const TITLES = { c1: 'Supply & Specification', c2: 'Price & Payment', c3: 'Quality & Rejection', c4: 'Governing Law' };
const KEBS = { id: 'rm-kebs', sev: 'med', kind: 'risk', title: 'Product standard not cited', anchor: 'c3',
  what: 'The quality clause references a specification generally but names no product standard number.',
  why: 'An unnamed standard makes rejection hard to enforce.', fix: 'Cite the applicable product standard.' };
const scanOf = (...f) => ({ at: 'today', dismissed: [], findings: f });
const stage = (extra = {}) => load({ negoClauseList: () => RM, rlPbFindClause: () => null,
  templateClauseTitles: () => TITLES, ...extra });

describe('f509 (A) find the clause', () => {
  test('a rule naming template clause c3 opens "3. Quality & Rejection", not a new clause', () => {
    const w = stage();
    const t = J(w.riskEditTarget({ id: 'K1', template: 'RM', changes: [] }, { ...KEBS }));
    assert.deepEqual(t, { clauseId: 'k3', label: '3. Quality & Rejection', changeId: null });
  });
  test('on top of our own pending redline there', () => {
    const w = stage();
    const c = { id: 'K1', template: 'RM', changes: [{ id: 'CHG-004', clauseId: 'k3', status: 'pending', authorSide: 'owner' }] };
    assert.equal(w.riskEditTarget(c, { ...KEBS }).changeId, 'CHG-004');
  });
  test('the quoted words still win over the tag', () => {
    const w = stage({ rlPbFindClause: () => RM[0] });
    assert.equal(w.riskEditTarget({ id: 'K1', changes: [] }, { ...KEBS, quote: 'supply the material' }).clauseId, 'k1');
  });
  test('a clause the negotiation renamed finds nothing — the reader points, nothing is guessed', () => {
    const renamed = RM.map(x => x.clauseId === 'k3' ? { ...x, title: 'Acceptance', headingText: '3. Acceptance' } : x);
    const w = stage({ negoClauseList: () => renamed });
    const t = J(w.riskEditTarget({ id: 'K1', changes: [] }, { ...KEBS, title: 'Number not cited' }));
    assert.equal(t.newClause, true);
    assert.equal(t.choose, true);
  });
  test('only a template tag is looked up; "doc" and "recital" are not', () => {
    let asked = 0;
    const w = stage({ templateClauseTitles: () => { asked++; return TITLES; } });
    w.riskEditTarget({ id: 'K1', changes: [] }, { title: 'Something odd', anchor: 'doc' });
    assert.equal(asked, 0);
  });
});

describe('f509 (B) more topics, for risks only', () => {
  test('a quality risk with no tag finds the quality clause by its topic', () => {
    const w = stage({ templateClauseTitles: () => ({}) });
    assert.equal(w.riskEditTarget({ id: 'K1', changes: [] }, { title: 'Product standard not cited', kind: 'risk' }).clauseId, 'k3',
      '"Quality & Rejection" — not "Supply & Specification", which is not a quality clause');
  });
  test('insurance, warranty, delivery and IP are topics; the six are read first and unchanged', () => {
    assert.match(SRC, /const RK_TOPICS = \[/);
    for (const k of ['insurance', 'quality', 'warranty', 'delivery', 'ip']) assert.match(SRC, new RegExp(`key: '${k}'`));
    assert.match(SRC, /if \(k\) return k;\s*const hit = RK_TOPICS\.find/, 'Our standards\' six answer first');
    assert.ok(!/key:\s*'quality'|key:\s*'insurance'/.test(KINDS), 'CLAUSE_KINDS (Our standards) is not touched');
  });
  test('an Insurance redline of ours now covers an insurance risk', () => {
    const w = load();
    const c = { scan: scanOf({ id: 'ins', sev: 'low', kind: 'risk', title: 'Insurance amount not stated', anchor: 'doc' }),
      changes: [{ id: 'CHG-005', clauseId: 'c9', clauseLabel: '9. Insurance', oldText: 'Supplier shall insure.', status: 'pending', authorSide: 'owner', roundN: 1 }] };
    assert.equal(J(w.riskItemsOf(c))[0].covered.id, 'CHG-005');
  });
});

describe('f509 (C) you point, only where HaTi cannot tell', () => {
  test('no quote, no tag, no topic, not "missing": the window holds a place and asks the reader', () => {
    const w = stage({ templateClauseTitles: () => ({}) });
    const t = J(w.riskEditTarget({ id: 'K1', changes: [] }, { title: 'Ambiguous counter-signature mechanics', kind: 'risk' }));
    assert.equal(t.choose, true);
    assert.equal(t.newClause, true);
    assert.equal(t.afterClauseId, 'k4', 'held before the signatures');
  });
  test('a missing thing is still a new clause, as the owner chose on 5 Oct', () => {
    const w = stage({ templateClauseTitles: () => ({}) });
    const t = J(w.riskEditTarget({ id: 'K1', changes: [] }, { title: 'No injunctive-relief clause', kind: 'missing' }));
    assert.equal(t.newClause, true);
    assert.equal(t.choose, false);
  });
  test('a known topic with no clause of it is still a new clause', () => {
    const w = stage({ templateClauseTitles: () => ({}) });
    const t = J(w.riskEditTarget({ id: 'K1', changes: [] }, { title: 'No data-protection terms detected', kind: 'missing' }));
    assert.equal(t.choose, false);
    const t2 = J(w.riskEditTarget({ id: 'K1', changes: [] }, { title: 'Data protection terms are thin', kind: 'risk' }));
    assert.equal(t2.choose, false, 'the topic is known (dp), only its clause is absent');
  });
});

/* A stage that can open the window and draw the Risks tab. */
function walkStage(over = {}){
  const opened = [], asked = [];
  let place = 'k4';
  const w = stage({
    riskMayAct: () => true,
    ceApply: () => true, ceRenderLane: () => {}, ceBoxWords: () => (opened.length && opened[opened.length - 1].id ? 'Consignments failing specification may be rejected.' : ''),
    copilotAvailable: () => true,
    copilotPropose: async o => { asked.push(o); return over.answer ? over.answer(o) : { proposedText: 'Wording.', advice: 'Done.' }; },
    clauseEditorOpen: () => false, rlCloseClauseEditor: () => {},
    rlOpenClauseEditor: (c, id, o) => { opened.push({ id, o }); return true; },
    ceNewPlace: () => place, ceSetNewPlace: id => { place = id; return true; },
    ...over.extra,
  });
  return { w, opened, asked, setPlace: p => { place = p; } };
}
const ODD = { id: 'odd1', sev: 'med', kind: 'risk', title: 'Ambiguous counter-signature mechanics', anchor: 'doc', what: 'Unclear.', why: 'Disputes.', fix: 'Clarify.' };

describe('f509 (D) the walk waits for the reader, then asks Copilot once', () => {
  test('waiting: no Copilot call, grey quick asks, the box asks which clause', async () => {
    const s = walkStage({ extra: { templateClauseTitles: () => ({}) } });
    const c = { id: 'K2', scan: scanOf(ODD), changes: [] };
    assert.equal(s.w.riskEditStart(c, 's:odd1'), true);
    assert.ok(s.opened[0].o.newClause, 'the window holds the place');
    s.w.riskEditorArrive(c, 's:odd1');
    await new Promise(r => setTimeout(r, 0));
    assert.equal(s.asked.length, 0, 'Copilot is not asked while it waits');
    const h = s.w.riskLaneHtml(c);
    assert.match(h, /rk_where_which/);
    assert.match(h, /<option value="" disabled selected>rk_choose_ph<\/option>/);
    assert.match(h, /<option value="chg:k3">rk_change<\/option>/, 'every clause to change');
    assert.match(h, /<option value="k4">rk_after<\/option>/, 'and every place for a new one');
    assert.ok(!/value="chg:k5"|value="k5"/.test(h), 'never at or after the signatures');
    assert.match(s.w.riskChipsHtml(c), /disabled/);
    assert.equal(await s.w.riskEditorDraft(c, 's:odd1', 'make it firmer'), false);
    assert.equal(s.asked.length, 0);
    assert.match(s.w.riskLaneHtml(c), /rk_ce_pick_first/, 'a typed ask says what to do first');
  });
  test('with no Copilot, the waiting window says so at once — never silent', () => {
    const s = walkStage({ extra: { templateClauseTitles: () => ({}), copilotAvailable: () => false } });
    const c = { id: 'K6', scan: scanOf(ODD), changes: [] };
    s.w.riskEditStart(c, 's:odd1');
    s.w.riskEditorArrive(c, 's:odd1');
    const h = s.w.riskLaneHtml(c);
    assert.match(h, /rk_ce_no_ai/);
    assert.match(h, /rk_where_which/, 'and the reader can still choose the clause to write in');
  });
  test('"Change 3. Quality & Rejection" opens that clause, and Copilot is asked to rewrite it', async () => {
    const s = walkStage({ extra: { templateClauseTitles: () => ({}) } });
    const c = { id: 'K2', scan: scanOf(ODD), changes: [] };
    s.w.riskEditStart(c, 's:odd1');
    assert.equal(s.w.riskWherePick(c, 'chg:k3'), true);
    const last = s.opened[s.opened.length - 1];
    assert.equal(last.id, 'k3');
    s.w.riskEditorArrive(c, 's:odd1');
    await new Promise(r => setTimeout(r, 0));
    assert.equal(s.asked.length, 1);
    assert.equal(s.asked[0].ask, 'rk_prompt_edit');
    assert.match(s.asked[0].passage, /Consignments failing/, 'with the clause\'s wording');
    assert.match(s.w.riskLaneHtml(c), /<option value="chg:k3" selected>/, 'the box keeps the choice, so it can be changed');
  });
  test('a place for a new clause moves the held clause and asks Copilot once', async () => {
    const s = walkStage({ extra: { templateClauseTitles: () => ({}) } });
    const c = { id: 'K2', scan: scanOf(ODD), changes: [] };
    s.w.riskEditStart(c, 's:odd1');
    // the window holds a new clause, so the walk knows it is new
    assert.equal(s.w.riskWherePick(c, 'k2'), true);
    await new Promise(r => setTimeout(r, 0));
    assert.equal(s.asked.length, 1);
    assert.equal(s.asked[0].ask, 'rk_prompt_add');
    assert.equal(s.asked[0].passage, '');
  });
  test('the owner\'s case end to end: c3 opens the quality clause and Copilot rewrites it', async () => {
    const s = walkStage();
    const c = { id: 'K3', template: 'RM', scan: scanOf(KEBS), changes: [] };
    s.w.riskEditStart(c, 's:rm-kebs');
    assert.equal(s.opened[0].id, 'k3');
    s.w.riskEditorArrive(c, 's:rm-kebs');
    await new Promise(r => setTimeout(r, 0));
    assert.equal(s.asked[0].ask, 'rk_prompt_edit');
    assert.ok(!/rk_where_which|data-ce-rk-where/.test(s.w.riskLaneHtml(c)), 'nothing to choose: HaTi knew');
  });
});

describe('f509 (E) Copilot wrote nothing', () => {
  test('said quietly with the way forward, never in red, and the box opens on the clause in front', async () => {
    const s = walkStage({ answer: () => ({ proposedText: '', advice: 'I need to see the clause.' }) });
    const c = { id: 'K4', template: 'RM', scan: scanOf(KEBS), changes: [] };
    s.w.riskEditStart(c, 's:rm-kebs');
    s.w.riskEditorArrive(c, 's:rm-kebs');
    await new Promise(r => setTimeout(r, 0));
    const h = s.w.riskLaneHtml(c);
    assert.ok(!/class="rk-err"/.test(h), 'not the red failure box');
    assert.match(h, /class="rk-say"/);
    assert.match(h, /rk_ce_refused_way/);
    assert.match(h, /<option value="chg:k3" selected>/, 'the box is open on the clause in front of the reader');
  });
  test('a real failure (thrown) stays red', async () => {
    const s = walkStage({ answer: () => { throw new Error('offline'); } });
    const c = { id: 'K5', template: 'RM', scan: scanOf(KEBS), changes: [] };
    s.w.riskEditStart(c, 's:rm-kebs');
    s.w.riskEditorArrive(c, 's:rm-kebs');
    await new Promise(r => setTimeout(r, 0));
    assert.match(s.w.riskLaneHtml(c), /class="rk-err"/);
  });
});

/* ai.js on a stage, as f98 loads it. */
function loadAi(){
  const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; },
    querySelector(){ return null; }, innerHTML: '', value: '', style: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    focus(){}, setSelectionRange(){}, getBoundingClientRect(){ return { width: 430 }; } });
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp,
    Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
    document: { getElementById: () => el(), querySelector: () => null,
      querySelectorAll: () => [], addEventListener(){}, createElement: () => el(),
      body: { classList: { toggle(){} } } },
    state: { contracts: [], view: '' }, icon: () => '', esc: s => String(s),
    toast(){}, lsGet(){ return null; }, lsSet(){}, getContract(){ return null; },
    currentUser(){ return { name: 'You' }; }, API_MODE(){ return false; },
    innerWidth: 1400, addEventListener(){},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ['i18n.js', 'jurisdiction.js', 'ai.js'])
    vm.runInContext(read('js/' + f), sandbox, { filename: f });
  return sandbox;
}

describe('f509 (F) the request says when there is no wording', () => {
  test('no wording: told there is none and to write it fresh; no empty quote, no "selected wording"', async () => {
    const ai = loadAi();
    let seen = '';
    ai.window.copilotAsk = async msgs => { seen = msgs[0].content; return '{"advice":"a","proposedText":"b"}'; };
    await ai.copilotPropose({ ask: 'Draft ONE new contract clause.', passage: '', instruction: 'Cite the standard.', clauseLabel: 'Product standard not cited' });
    assert.match(seen, /There is no existing wording: this is a NEW clause/);
    assert.ok(!/The selected wording is/.test(seen));
    assert.ok(!/"""/.test(seen), 'no empty quote');
    assert.ok(!/The passage comes from/.test(seen), 'and no claim that a passage came from somewhere');
  });
  test('with wording, the request is as it was', async () => {
    const ai = loadAi();
    let seen = '';
    ai.window.copilotAsk = async msgs => { seen = msgs[0].content; return '{"advice":"a","proposedText":"b"}'; };
    await ai.copilotPropose({ ask: 'Rewrite.', passage: 'Pay in 60 days.', clauseLabel: 'Clause 2 · Payment' });
    assert.match(seen, /The selected wording is:\n"""\nPay in 60 days\.\n"""/);
    assert.match(seen, /The passage comes from Clause 2 · Payment/);
    assert.ok(!/There is no existing wording/.test(seen));
  });
});

describe('f509 (G) both books, and the lookup', () => {
  const I18N = read('js/i18n.js');
  test('every new word is in English and Swedish, once', () => {
    for (const k of ['rk_where_which', 'rk_choose_ph', 'rk_change', 'rk_ce_pick_first', 'rk_ce_refused_way']){
      const n = (I18N.match(new RegExp(`\\n {4}${k}: '`, 'g')) || []).length;
      assert.equal(n, 2, k + ' in both books, once each');
    }
  });
  test('the tag lookup reads the template\'s own paper and is published', () => {
    const CV = read('js/views/contract.js');
    const fn = CV.slice(CV.indexOf('function templateClauseTitles('), CV.indexOf('function docBodyStructured('));
    assert.match(fn, /docBody\(\{ \.\.\.c, redlineText:'', status:'Draft', execution:null, _preview:true \}\)/);
    assert.match(fn, /data-anchor="\(\[\^"\]\+\)"/);
    assert.match(CV, /docBody,docBodyStructured,templateClauseTitles,/);
  });
});
