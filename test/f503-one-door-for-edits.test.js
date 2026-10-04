/* f503 — ONE DOOR FOR EDITS: RISKS OPEN IN EDIT WITH COPILOT, WITHOUT
   DUPLICATES (the owner's work order, Part 8, 4 Oct 2026)
   ============================================================================
   The browser half is one-door-for-edits-verify; this pins the readings and
   the walls, fast.

     (A) ALREADY COVERED — a risk on a topic our standards redlined, or on a
         clause we already redlined, is covered: not open, not counted, in the
         fold naming the redline; back by itself when that redline goes. A risk
         of no known topic is never covered (the safe direction);
     (B) THE RIGHT PLACE — "Missing governing law" targets the Governing law
         clause that is there, on top of our own pending redline; a new clause
         is offered only before the signatures;
     (C) ONE DOOR — the card's rows offer Add a note · Dismiss · Edit with
         Copilot; Risk View offers only Add a note; the safety net finds a
         second redline of ours on one clause;
     (D) THE WALLS — the editor's Save from the walk is the editor's own Save
         (ceSaveChecked → ceFile → negoEditClause) wearing the risk's
         provenance; nothing in the walk files or sends by itself; every new
         word is in both books.

   Run: node --test test/f503-one-door-for-edits.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const SRC = read('js/risks.js');
const CE = read('js/views/clauseeditor.js');
const CM = read('js/clausemodel.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const J = v => JSON.parse(JSON.stringify(v));
/* the clause kinds the standards match on, as they stand */
const KINDS = CM.slice(CM.indexOf('const CLAUSE_KINDS = ['), CM.indexOf('/* ---------- reading a heading'));

function load(extra = {}){
  const ctx = { console, persisted: 0, ...extra };
  ctx.window = ctx;
  ctx.persist = () => { ctx.persisted++; };
  ctx.document = { getElementById: () => null, querySelector: () => null };
  vm.createContext(ctx);
  vm.runInContext(KINDS + '\nObject.assign(window, { CLAUSE_KINDS, clauseKindByKey, clauseKind, ruleKind });', ctx);
  vm.runInContext(SRC, ctx);
  return ctx;
}
const PAY = 'The Buyer shall pay each undisputed invoice within 60 days of receipt.';
const LIAB = 'Total liability shall not exceed the charges paid in the preceding three months.';
const scan = () => ({ at: 'today', dismissed: [], findings: [
  { id: 'pay', sev: 'med', kind: 'risk', title: 'Payment terms: 60 days', anchor: 'doc', quote: PAY },
  { id: 'liab', sev: 'high', kind: 'risk', title: 'Liability cap may be too low', anchor: 'doc', quote: LIAB },
  { id: 'law', sev: 'med', kind: 'missing', title: 'Missing governing law', anchor: 'doc' },
  { id: 'ins', sev: 'low', kind: 'risk', title: 'Insurance amount not stated', anchor: 'doc' },
] });
const mine = (id, extra) => ({ id, status: 'pending', authorSide: 'owner', roundN: 1, ...extra });

describe('f503 (A) already covered', () => {
  test('a standards redline on the topic covers it: not open, not counted, and it names the redline', () => {
    const w = load();
    const c = { scan: scan(), changes: [mine('CHG-001', { clauseId: 'c2', clauseLabel: '2. Charges', oldText: 'The Buyer shall pay within 60 days.', note: 'Playbook — Payment terms: 30 days' })] };
    const it = J(w.riskItemsOf(c)).find(x => x.key === 's:pay');
    assert.deepEqual(it.covered, { id: 'CHG-001', clause: '2. Charges', clauseId: 'c2', std: 'Payment terms' });
    assert.ok(!w.riskOpenOf(c).some(x => x.key === 's:pay'), 'not counted');
  });
  test('our redline on the clause the risk is about covers it — by its words, or by its topic', () => {
    const w = load();
    const byWords = { scan: scan(), changes: [mine('CHG-002', { clauseId: 'c5', clauseLabel: '5. Caps', oldText: LIAB })] };
    assert.equal(J(w.riskItemsOf(byWords)).find(x => x.key === 's:liab').covered.id, 'CHG-002');
    const byTopic = { scan: scan(), changes: [mine('CHG-003', { clauseId: 'c33', clauseLabel: '33. Governing law and disputes', oldText: 'Laws of Denmark.' })] };
    assert.equal(J(w.riskItemsOf(byTopic)).find(x => x.key === 's:law').covered.id, 'CHG-003');
    assert.equal(w.riskOpenOf(byTopic).length, 3);
  });
  test('it comes back by itself when that redline is discarded, superseded, or is theirs', () => {
    const w = load();
    const c = { scan: scan(), changes: [mine('CHG-003', { clauseId: 'c33', clauseLabel: '33. Governing law', oldText: '' })] };
    assert.ok(!w.riskOpenOf(c).some(x => x.key === 's:law'));
    c.changes = [];
    assert.ok(w.riskOpenOf(c).some(x => x.key === 's:law'), 'discarded');
    c.changes = [mine('CHG-003', { clauseId: 'c33', clauseLabel: '33. Governing law', status: 'superseded' })];
    assert.ok(w.riskOpenOf(c).some(x => x.key === 's:law'), 'superseded');
    c.changes = [{ id: 'CHG-004', status: 'pending', authorSide: 'counterparty', clauseId: 'c33', clauseLabel: '33. Governing law' }];
    assert.ok(w.riskOpenOf(c).some(x => x.key === 's:law'), 'their ask is not our redline');
  });
  test('a risk of no known topic is never treated as covered', () => {
    const w = load();
    const c = { scan: scan(), changes: [mine('CHG-005', { clauseId: 'c9', clauseLabel: '9. Insurance', oldText: 'Supplier shall insure.' })] };
    assert.equal(J(w.riskItemsOf(c)).find(x => x.key === 's:ins').covered, null);
  });
  test('the fold lists them, said and counted nowhere else', () => {
    const w = load({ riskMayAct: () => true });
    w.riskMayAct = () => true;
    const c = { id: 'K1', scan: scan(), changes: [mine('CHG-001', { clauseId: 'c2', clauseLabel: '2. Charges', note: 'Playbook — Payment terms' })] };
    const h = w.rlRisksPileHtml(c, {});
    assert.match(h, /data-rk-act="covered"/);
    assert.match(h, /rk_covered_h/);
    assert.match(h, /rk_head/);
  });
});

describe('f503 (B) the right place', () => {
  const clauses = [
    { clauseId: 'c1', title: '1. Supply', text: 'Supply.' },
    { clauseId: 'c33', title: '33 Governing law', text: 'Laws of Denmark.' },
    { clauseId: 'c40', title: '40 Notices', text: 'Notices.' },
    { clauseId: 'c41', title: '41 Signatures', text: 'Signed for and on behalf of each party.' },
    { clauseId: 'c42', title: '42 Schedule', text: 'Annex.' },
  ];
  test('"Missing governing law" changes the Governing law clause, on top of our pending redline', () => {
    const w = load({ negoClauseList: () => clauses, rlPbFindClause: () => null });
    const it = { title: 'Missing governing law', quote: '' };
    assert.deepEqual(J(w.riskEditTarget({ changes: [] }, it)), { clauseId: 'c33', label: '33 Governing law', changeId: null });
    const c = { changes: [mine('CHG-009', { clauseId: 'c33' })] };
    assert.equal(w.riskEditTarget(c, it).changeId, 'CHG-009', 'one redline per clause: the edit goes on top of ours');
    assert.equal(w.riskEditTarget({ changes: [] }, { title: 'No injunctive-relief clause', quote: '' }), null, 'nothing of that topic: a new clause');
  });
  test('a new clause is offered only before the signatures, and the card drafts no change to a clause', async () => {
    const w = load({ negoClauseList: () => clauses, copilotAvailable: () => false });
    w.riskMayAct = () => true;
    const c = { id: 'K2', scan: { at: 'today', dismissed: [], findings: [{ id: 'inj', sev: 'low', kind: 'missing', title: 'No injunctive-relief clause', anchor: 'doc' }] }, changes: [] };
    await w.riskDraft(c, 's:inj');
    const h = w.rlRisksPileHtml(c, {});
    const opts = [...h.matchAll(/<option value="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(opts, ['a:c1', 'a:c33', 'a:c40'], 'adds only, never at or after Signatures');
    assert.match(h, /value="a:c40" selected/, 'the default is the last clause ahead of the signatures');
  });
});

describe('f503 (C) one door', () => {
  test('the rows offer Add a note · Dismiss · Edit with Copilot; Risk View only Add a note', () => {
    const w = load();
    w.riskMayAct = () => true;
    const c = { id: 'K3', scan: scan(), changes: [] };
    const h = w.rlRisksPileHtml(c, {});
    const acts = [...h.matchAll(/data-rk-act="([a-z-]+)"/g)].map(m => m[1]);
    assert.ok(acts.includes('edit-ce') && acts.includes('note') && acts.includes('dismiss'));
    assert.ok(!acts.includes('draft') && !/data-rk-target|data-rk-act="add"/.test(h), 'no drafting in the card');
    const foot = w.riskMarkFootHtml(c, { k: 'scan', id: 'liab' });
    assert.match(foot, /data-rk-note=/);
    assert.doesNotMatch(foot, /data-rk-go|rk_draft/, 'no "Draft a redline" in Risk View');
    assert.ok(!/riskGoDraft|riskAfterPaint/.test(strip(SRC) + strip(read('js/views/negotiation.js'))), 'the old hand-off is gone');
  });
  test('the safety net finds a second redline of ours on one clause, and only that', () => {
    const w = load({ negoRound: () => 2 });
    assert.equal(w.riskSecondRedline({ changes: [mine('CHG-1', { clauseId: 'c5', roundN: 2 })] }, 'c5'), null, 'this round\'s pending one is folded into');
    assert.equal(w.riskSecondRedline({ changes: [mine('CHG-1', { clauseId: 'c5', roundN: 1 })] }, 'c5').id, 'CHG-1', 'an earlier round\'s would make two');
    assert.equal(w.riskSecondRedline({ changes: [mine('CHG-1', { clauseId: 'c5', roundN: 1, withdrawn: true })] }, 'c5'), null);
    assert.equal(w.riskSecondRedline({ changes: [{ id: 'X', authorSide: 'counterparty', status: 'pending', clauseId: 'c5', roundN: 1 }] }, 'c5'), null, 'theirs is a counter, not a second of ours');
  });
});

describe('f503 (D) the walls', () => {
  test('a Save from the walk is the editor\'s own Save, with the risk\'s provenance', () => {
    const body = strip(CE.slice(CE.indexOf('async function ceRiskSave'), CE.indexOf('async function ceFile(')));
    assert.match(body, /riskSecondRedline\(/, 'the safety net first');
    assert.match(body, /_ceFileNote = window\.riskProvenance \? riskProvenance\(info\.it\)/);
    assert.match(body, /ch = await ceSaveChecked\(\)/, 'the page\'s own Save');
    assert.ok(!/negoEditClause|negoFileChange|negoInsertClause|changes\.push/.test(body), 'files nothing of its own');
    assert.match(CE, /const note = _ceFileNote \|\| _cet\('ce_provenance'\);/);
    const w = load();
    assert.match(w.riskProvenance({ title: 'Liability cap may be too low' }), /^Copilot — Risk scan: Liability cap may be too low$/);
  });
  test('the walk files nothing and sends nothing by itself', () => {
    const walk = strip(SRC.slice(SRC.indexOf('ONE DOOR FOR EDITS: THE WALK'), SRC.indexOf('WHO MAY ACT HERE')));
    assert.ok(!/negoEditClause|negoAddNamedClause|negoInsertClause|negoFileChange|changes\.push/.test(walk), 'no filing in the walk');
    assert.ok(!/negoAdvanceRound|api\(\s*'shares|nego-send/.test(walk), 'no sending');
  });
  test('every new word is in both books', () => {
    const I = read('js/i18n.js');
    const keys = new Set((SRC + CE).match(/\b(rk_ce_[a-z_]+|rk_net_[a-z_]+|rk_cov_[a-z_]+|rk_covered[a-z_]*|rk_edit_ce[a-z_]*|ce_tab_risks)\b/g));
    assert.ok(keys.size > 20, String(keys.size));
    for (const k of keys) assert.equal((I.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
