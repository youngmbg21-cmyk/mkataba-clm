/* f508 — THE CARD FOLLOWS THE DRAFT, AND A RISK THAT ONLY ADVISES IS NOT A
   REDLINE (docs/WORKORDER-selected-card-and-advice-risks.md; Young, 5 Oct
   2026: picked "Follows", then "Go, build both parts")
   ============================================================================
   The browser half is selected-card-and-advice-verify; this pins, fast:

     (A) THE CARD FOLLOWS THE DRAFT — the "Selected · <clause>" card in Edit
         with Copilot quotes the draft the paper is showing after Apply, Undo,
         Redo and Discard, and is painted a beat behind typing (ceRenderScope
         reads ceDraftNow; ceMarksSchedule paints it);
     (B) ADVICE IS NOT A REDLINE — the upload scanner's advice and record
         checks (have counsel read it, text unreadable or read from a scan,
         the no-text checklist, counterparty and value not recorded) are not
         in the Redlines card's list, not counted, and cannot open the
         editor; a risk that can be put on paper (data protection, no clause
         yet) still opens a new clause;
     (C) ONE NAMED SET — every rule the upload scanner writes is in
         RK_NEEDS_WORDING as needing none (re-pointed 5 Oct 2026, see f510): a new advisory
         rule written tomorrow turns this red until it is decided.

   Run: node --test test/f508-card-follows-advice-is-not-a-redline.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld, supplyContract } = require('./world');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const J = v => JSON.parse(JSON.stringify(v));
const CE = strip(read('js/views/clauseeditor.js'));
const RK_SRC = read('js/risks.js');
const CM = read('js/clausemodel.js');
const KINDS = CM.slice(CM.indexOf('const CLAUSE_KINDS = ['), CM.indexOf('/* ---------- reading a heading'));
const fn = (src, name) => {
  const m = src.match(new RegExp('(?:async )?function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}'));
  assert.ok(m, name + ' exists');
  return m[0];
};

/* ---------------------------------------------------------------- (A) */
async function bench(){
  const w = buildWorld({ negotiationView: true, contractView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => false;
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.cachedShares = () => [];
  const c = supplyContract();
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  try{ win.innerWidth = 1440; }catch(_){}
  return { win, c, doc: win.document };
}
/* RE-POINTED 6 Oct 2026 (Young, "one Copilot editor": the Selected card is
   removed): what the card said rides as a TAG in the ask box. At rest it
   names the clause and quotes nothing, so there is nothing that can go stale
   behind the paper — the fault (A) was written for cannot come back. */
const cardQuote = p => {
  const q = p.doc.querySelector('#ce-scope.ce-tag');
  return q ? q.textContent.trim() : null;
};

describe('f508 (A) the card follows the draft', () => {
  test('after Apply, Undo, Redo and Discard the card quotes what the paper shows', async () => {
    const p = await bench();
    const id = p.win.negoClauseList(p.c)[0].clauseId;
    assert.ok(p.win.rlOpenClauseEditor(p.c, id, {}), 'the page opens');
    const first = cardQuote(p);
    assert.equal(first, 'This clause', 'the resting tag names the clause and quotes nothing');
    p.win.ceApply('First go at it.', 'one');
    assert.equal(cardQuote(p), 'This clause', 'Apply: nothing on the tag to go stale');
    p.win.ceUndo(); p.win.ceRedo(); p.win.ceDiscard();
    assert.equal(cardQuote(p), first, 'Undo, Redo, Discard: the same');
    p.win.rlCloseClauseEditor();
  });

  test('the card reads the draft as the page shows it, and the typing beat paints it', () => {
    assert.ok(!/ceDraftNow\(/.test(fn(CE, 'ceRenderScope')), 'the tag quotes no draft (re-pointed 6 Oct 2026)');
    assert.match(fn(CE, 'ceMarksSchedule'), /ceRenderScope\(\)/, 'a beat behind the typing, with the marks');
    for (const name of ['ceApply', 'ceUndo', 'ceRedo', 'ceDiscard', 'ceForgetUnfiled'])
      assert.match(fn(CE, name), /ceRenderScope\(\)/, name + ' repaints the card');
  });
});

/* ---------------------------------------------------------------- (B) */
function load(extra = {}){
  const ctx = { console, ...extra };
  ctx.window = ctx;
  ctx.persist = () => {};
  ctx.document = { getElementById: () => null, querySelector: () => null };
  vm.createContext(ctx);
  vm.runInContext(KINDS + '\nObject.assign(window, { CLAUSE_KINDS, clauseKindByKey, clauseKind, ruleKind });', ctx);
  vm.runInContext(RK_SRC, ctx);
  return ctx;
}
const ADVICE = ['u-legal', 'u-noext', 'u-ocr', 'u-law', 'u-liab', 'u-term', 'u-cp', 'u-val'];
const PAY = 'The Buyer shall pay each undisputed invoice within 60 days of receipt.';
const uploadScan = () => ({ at: 'today', dismissed: [], findings: [
  { id: 'u-cp', sev: 'high', kind: 'missing', title: 'Counterparty not recorded', anchor: 'doc' },
  { id: 'u-val', sev: 'med', kind: 'missing', title: 'Contract value not recorded', anchor: 'doc' },
  { id: 'u-ocr', sev: 'med', kind: 'risk', title: 'Quotes below come from a machine-read scan', anchor: 'doc' },
  { id: 'u-noext', sev: 'low', kind: 'missing', title: 'Document text could not be read automatically', anchor: 'doc' },
  { id: 'u-law', sev: 'med', kind: 'risk', title: 'Confirm governing law is Swedish', anchor: 'doc' },
  { id: 'u-liab', sev: 'med', kind: 'risk', title: 'Check liability cap & indemnities', anchor: 'doc' },
  { id: 'u-term', sev: 'low', kind: 'ambiguity', title: 'Confirm term, renewal & exit', anchor: 'doc' },
  { id: 't-pay', sev: 'med', kind: 'risk', title: 'Payment terms: 60 days', anchor: 'doc', quote: PAY },
  { id: 't-dp', sev: 'low', kind: 'missing', title: 'No data-protection terms detected', anchor: 'doc' },
  { id: 'u-legal', sev: 'low', kind: 'missing', title: 'Have qualified counsel review before signing', anchor: 'doc' },
] });
const clauses = [
  { clauseId: 'c1', title: '1. Supply', text: 'Supply.' },
  { clauseId: 'c26', title: '26. Notices', text: 'Notices.' },
  { clauseId: 'c27', title: '27. Signatures', text: 'Signed for and on behalf of each party.' },
];

describe('f508 (B) a risk that only advises is not a redline', () => {
  test('the advice and record checks are not in the list and not counted', () => {
    const w = load();
    const c = { id: 'K1', scan: uploadScan(), changes: [] };
    const keys = J(w.riskItemsOf(c)).map(x => x.key);
    for (const id of ADVICE) assert.ok(!keys.includes('s:' + id), id + ' is not a risk to look at');
    assert.deepEqual(keys.sort(), ['s:t-dp', 's:t-pay'], 'only what can be put on paper');
    assert.equal(w.riskOpenOf(c).length, 2, 'the one count every surface reads');
  });

  test('the scan itself still holds them, for every other reader', () => {
    const w = load();
    const c = { id: 'K1', scan: uploadScan(), changes: [] };
    w.riskOpenOf(c);
    assert.equal(c.scan.findings.length, 10, 'nothing is removed from the stored scan');
    assert.deepEqual(J(c.scan.dismissed), [], 'nothing is dismissed for the reader');
  });

  test('an advice row cannot open the editor; a paper risk with no clause still holds a new one', () => {
    let opened = null;
    const w = load({ negoClauseList: () => clauses, rlPbFindClause: () => null,
      rlOpenClauseEditor: (c, id, o) => { opened = { id, o }; return true; } });
    const c = { id: 'K2', scan: uploadScan(), changes: [] };
    assert.equal(w.riskEditStart(c, 's:u-legal'), false, 'no walk starts on advice');
    assert.equal(opened, null, 'and nothing opened');
    assert.equal(w.riskEditStart(c, 's:t-dp'), true);
    assert.ok(opened && opened.o && opened.o.newClause, 'data protection is put on paper as a new clause');
    assert.equal(opened.o.newClause.afterClauseId, 'c26', 'before the signatures');
    const info = J(w.riskWalkInfo(c));
    assert.equal(info.n, 2, 'the walk counts only paper risks: "Risk k of 2"');
  });

  test('the Redlines card draws no advice row', () => {
    const w = load();
    w.riskMayAct = () => true;
    const h = w.rlRisksPileHtml({ id: 'K3', scan: uploadScan(), changes: [] }, {});
    assert.ok(!/qualified counsel/i.test(h), 'no "Have qualified counsel review" row');
    assert.ok(!/Counterparty not recorded|could not be read|machine-read/.test(h));
    assert.match(h, /Payment terms: 60 days/);
  });
});

/* ---------------------------------------------------------------- (C) */
describe('f508 (C) one named set', () => {
  const UP = read('js/views/contract.js');
  const body = UP.slice(UP.indexOf('function uploadScanRules('), UP.indexOf('\n}\n', UP.indexOf('function uploadScanRules(')));
  const upIds = [...new Set([...body.matchAll(/add\('([a-z]+-[a-z]+)'/g)].map(m => m[1]))];
  const allIds = [...new Set([...(read('js/ai.js') + UP).matchAll(/add\('((?:t|u|rm|pk|cm|eq|wh|ff|da|rl|mk|nd|le|ps)-[a-z]+)'/g)].map(m => m[1]))];

  /* RE-POINTED 5 Oct 2026 (Young: "any risks that do not require an amendment
     to the contract or need additional language … should not be moved to the
     redline panel"): the hand list RK_ADVICE_IDS became a mark on EVERY rule,
     RK_NEEDS_WORDING, read through riskIsAdvice / riskNeedsWording. What this
     pinned still holds — every upload check is decided as needing no wording;
     f510 holds every other rule to its mark. */
  test('every rule the upload scanner writes is decided: needs no wording', () => {
    assert.ok(upIds.length >= 8, upIds.length + ' rules read');
    const w = load();
    for (const id of upIds){
      assert.equal(typeof w.RK_NEEDS_WORDING[id], 'boolean', id + ' is marked — a new upload check must be decided');
      assert.equal(w.riskIsAdvice({ id }), true, id + ' needs no wording');
    }
  });

  test('a rule that names wording is not advice', () => {
    const w = load();
    for (const id of ['t-dp', 'rm-kebs', 't-liab', 'nd-inj']) assert.equal(w.riskIsAdvice({ id, kind: 'risk' }), false, id + ' stays a redline');
    assert.ok(allIds.length >= 40, allIds.length + ' rules read');
  });
});
