/* f484 — RISKS TO LOOK AT: THE RISK SCAN LIVES IN THE REDLINES CARD
   ============================================================================
   Young picked "A pile to look at" and "Read in place" by name (4 Oct 2026),
   ruled the separate Risk scan panel away and swapped the Overview's Filed tile
   for Risks found. The browser half is risks-in-the-redlines-card-verify; this
   pins the READING and the walls, fast.

   WHAT THIS FILE PINS
     (1) riskItemsOf is the one list: scan findings and the brief's lines,
         worst first, a duplicate said once, record blanks left out
     (2) dismissing is one list everywhere: a scan finding in c.scan.dismissed,
         a brief line in c.risks.dismissed; bringing back undoes either
     (3) a risk that became a redline leaves the open list while that redline
         lives, and comes back if it is discarded
     (4) reading writes nothing; filing goes through the funnel's two wrappers
         and nothing else; c.risks never travels
     (5) the old panel has no door: openCheckPanel answers 'risk' and 'scan'
         with Risk View; the Filed tile is gone from the strip
     (6) every new word is in both books

   Run: node --test test/f484-risks-in-the-redlines-card.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const SRC = read('js/risks.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const CODE = strip(SRC);
/* lists made inside the sandbox carry its own Array; compare their contents */
const J = v => JSON.parse(JSON.stringify(v));

function load(extra = {}){
  const ctx = { console, persisted: 0, ...extra };
  ctx.window = ctx;
  ctx.persist = () => { ctx.persisted++; };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return ctx;
}
const SCAN = () => ({ at: 'today', findings: [
  { id: 'a', sev: 'low', kind: 'missing', title: 'No injunctive-relief clause', anchor: 'doc' },
  { id: 'b', sev: 'high', kind: 'risk', title: 'Assignment not restricted', anchor: 'c2', quote: 'Either party may assign.' },
  { id: 'g-cp', sev: 'high', kind: 'missing', title: 'No counterparty named', anchor: 'recital' },
  { id: 'rm-mat', sev: 'med', kind: 'missing', title: 'Material not specified', anchor: 'recital' },
], dismissed: [] });

describe('f484 (1) one list, worst first', () => {
  test('scan findings and the brief\'s lines, worst first, blanks left out', () => {
    const w = load({
      docXrayBriefWatch: () => [{ say: 'Notices by e-mail count only the next working day', quote: 'next working day', why: 'slows notices' }],
      docXrayBriefOdd: () => [{ say: 'Assignment not restricted', quote: '', why: '' }],
    });
    const c = { scan: SCAN(), changes: [] };
    const list = w.riskItemsOf(c);
    assert.deepEqual(J(list.map(x => x.key)), ['s:b', w.riskKeyOf('brief', 'Notices by e-mail count only the next working day'), 's:a'],
      'high, then the brief\'s medium, then low — and the odd line repeating a scan title is said once');
    assert.ok(!list.some(x => /^s:(g-cp|rm-mat)$/.test(x.key)), 'a blank on the record is filled on the Overview, not drafted');
    assert.equal(list[2].missing, true, 'a missing clause with no words to point at becomes a new clause');
  });
});

describe('f484 (2) dismissing is one list', () => {
  test('a scan finding is dismissed where the scan keeps it; a brief line on c.risks', () => {
    const w = load({ docXrayBriefWatch: () => [{ say: 'Watch the notice period', quote: '' }], docXrayBriefOdd: () => [] });
    const c = { scan: SCAN(), changes: [] };
    w.riskDismiss(c, 's:b');
    assert.deepEqual(J(c.scan.dismissed), ['b'], 'the scan\'s own list, so openFindings agrees');
    const bk = w.riskKeyOf('brief', 'Watch the notice period');
    w.riskDismiss(c, bk);
    assert.deepEqual(J(c.risks.dismissed), [bk]);
    assert.equal(w.riskKeyDismissed(c, bk), true, 'Risk View asks the same answer');
    assert.equal(w.riskOpenOf(c).length, 1, 'only the injunctive risk is still open');
    w.riskDismiss(c, 's:b', true); w.riskDismiss(c, bk, true);
    assert.equal(w.riskOpenOf(c).length, 3, 'bringing back undoes both');
    assert.ok(w.persisted >= 4, 'every press is saved');
  });
});

describe('f484 (3) drafted while the redline lives', () => {
  test('a risk filed as a redline leaves the list, and returns if the redline is discarded', () => {
    const w = load();
    const c = { scan: SCAN(), changes: [{ id: 'CHG-001', status: 'pending' }], risks: { dismissed: [], drafted: { 's:b': 'CHG-001' } } };
    assert.ok(!w.riskOpenOf(c).some(x => x.key === 's:b'), 'drafted, so not open');
    assert.equal(w.riskFromScan(c, c.changes[0]), true, 'and the row can say where it came from');
    c.changes = [];
    assert.ok(w.riskOpenOf(c).some(x => x.key === 's:b'), 'discarded, so open again');
  });
});

describe('f484 (4) the walls', () => {
  test('reading writes nothing and never starts a negotiation', () => {
    const body = SRC.slice(SRC.indexOf('function riskItemsOf'), SRC.indexOf('const riskOpenOf'));
    assert.ok(!/negoClauseList|negoInit|persist\(/.test(strip(body)), 'riskItemsOf reads RAW');
    const w = load();
    const c = { scan: SCAN(), changes: [] };
    const snap = JSON.stringify(c);
    w.riskItemsOf(c); w.riskOpenOf(c);
    assert.equal(JSON.stringify(c), snap, 'the record is untouched');
  });
  test('filing goes through the funnel\'s wrappers and nothing else', () => {
    const file = strip(SRC.slice(SRC.indexOf('async function riskFile'), SRC.indexOf('function riskNote')));
    assert.ok(/negoEditClause\(/.test(file) && /negoAddNamedClause/.test(file), 'edit and add, the person\'s own doors');
    assert.ok(!/changes\.push|negoFileChange\(/.test(CODE), 'no change is pushed by hand');
    assert.ok(!/negoAdvanceRound|data-rl-send|nego-send|api\(\s*'shares/.test(CODE), 'nothing is sent');
    assert.ok(/'Copilot — Risk scan: '/.test(SRC), 'the note is provenance (NEGO_PROVENANCE_RE), never a reason shown to them');
  });
  test('c.risks never travels', () => {
    const core = read('js/core.js');
    const pay = core.slice(core.indexOf('function buildSharePayload'), core.indexOf('function buildSharePayload') + 30000);
    assert.ok(!/\brisks\s*:/.test(pay), 'the share payload is an allow-list that does not name it');
  });
});

describe('f484 (5) the panel has no door; the tile replaced Filed', () => {
  const CT = read('js/views/contract.js');
  test('openCheckPanel answers risk and scan with Risk View', () => {
    const at = CT.indexOf('function openCheckPanel(c,kind){');
    assert.ok(at > 0);
    assert.match(CT.slice(at, at + 200), /if\(kind==='risk'\|\|kind==='scan'\)\{ riskViewOpen\(c\); return; \}/);
  });
  test('the strip draws Risks found, not Filed, and its door opens Risk View', () => {
    const TRI = strip(read('js/triage.js'));
    assert.ok(!/add\('filed'/.test(TRI), 'Filed is no longer drawn');
    assert.ok(/add\('risk'/.test(TRI), 'Risks found is');
    assert.match(CT, /\(x\.key==='risk'\s+&& x\.ok\) \? 'risk'/);
    assert.match(CT, /if\(go==='risk'\)\{ riskViewOpen\(c\); return; \}/);
  });
});

describe('f484 (6) both books', () => {
  test('every rk_ key and the tile heads are in English and Swedish', () => {
    const I = read('js/i18n.js');
    const keys = new Set((SRC + read('js/views/contract.js') + read('js/triage.js') + read('js/views/negotiation.js'))
      .match(/\b(rk_[a-z_]+|tri_t_risk[a-z_]*|tri_go_risk)\b/g));
    for (const k of keys)
      assert.equal((I.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
