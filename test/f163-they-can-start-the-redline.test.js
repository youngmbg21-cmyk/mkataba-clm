/* ============================================================
   f163 — the counterparty can start the redline
   ============================================================
   Reported from the field (Young, 09 Aug 2026): "The counterparty cannot
   initiate the redline. After the owner sends the first redline, then the
   counterparty can do so." The owner's own process is: send it to be SIGNED,
   they decline and say they want changes, send them a NEGOTIATION link, and
   they redline. Step four never landed.

   It looked like a permissions fault and was not. Their page drew Direct Edit,
   they rewrote a clause, filed it, pressed Send, and the server answered 200.
   Nothing arrived. Nothing was refused. Nothing was logged.

   WHAT WAS ACTUALLY WRONG — clause ids that would not hold still.

   A change is anchored on a clause id, and the id has to be the same on both
   sides of the table or the anchor points at nothing. clauseStampIds writes
   those ids INTO the document, which makes them durable — for a contract that
   HAS a document. A contract built from a template keeps none: c.redlineText is
   empty (or plain text), the wording is regenerated on demand, and
   negoStampContract has nowhere to write the stamp back to. Every read minted
   brand new random ids for the same clauses.

   negoFreshenBaseline re-reads the baseline on EVERY paint of the workbench
   while nothing is on the table — deliberately, so a key term filled on the Doc
   page shows through. On these contracts that meant the baseline, and with it
   every clause id, was replaced on every repaint, on BOTH parties' screens
   independently. The counterparty proposed wording against `cl_a1b2`; by the
   time it came home our clause answered to something else; applyNegoProposals
   could not find it and dropped it with `continue`; applyResponse reported
   nothing applied; the poller never marked the response handled and re-applied
   the same impossible answer every cycle, for ever, in silence.

   AND WHY THE OWNER'S OWN REDLINE "FIXED" IT: negoFreshenBaseline refuses to
   move once a single change is filed. Our first ask froze the baseline, the ids
   stopped wandering, and everything worked from that moment on — which is
   exactly the asymmetry that was reported.

   THREE THINGS ARE PINNED HERE:
     1. a re-read of an unchanged document returns the SAME ids (clauseCarryIds)
     2. so negoFreshenBaseline has nothing to replace, on a stored body and on a
        regenerated one alike
     3. and a proposal that arrives on a stale id — every link minted before this
        — is recovered by its wording rather than dropped, and where it genuinely
        cannot be placed it is RECORDED. Wording that arrives and vanishes with
        no line anywhere is the fault this whole file exists to close.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { buildWorld, supplyContract, SUPPLY_RICH } = require('./world');

const ROOT = path.join(__dirname, '..');
const ATTR = /data-clause-id="([^"]+)"/g;
const idsIn = html => [...String(html || '').matchAll(ATTR)].map(m => m[1]);

/* ============================================================
   1 — AN UNCHANGED DOCUMENT READ AGAIN IS THE SAME DOCUMENT
   ============================================================ */
describe('f163 · clauseCarryIds — a re-read does not rename the clauses', () => {

  test('the ids survive a fresh stamp of the identical wording', () => {
    const { win } = buildWorld();
    const first = win.clauseStampIds(SUPPLY_RICH).html;
    /* A second stamp of the ORIGINAL (unstamped) wording is what a template
       contract does on every read: same document, brand new ids. */
    const second = win.clauseStampIds(SUPPLY_RICH).html;
    assert.notDeepEqual(idsIn(second), idsIn(first),
      'the premise: an unstored document mints new ids every time it is read');
    const carried = win.clauseCarryIds(first, second);
    assert.deepEqual(idsIn(carried), idsIn(first), 'the ids come back');
    assert.equal(carried, first, 'and the document is byte-for-byte the one we had');
  });

  test('a clause keeps its id when wording elsewhere changes', () => {
    const { win } = buildWorld();
    const first = win.clauseStampIds(SUPPLY_RICH).html;
    /* The case negoFreshenBaseline exists for: a key term filled in on the Doc
       page after the workbench first painted. */
    const edited = SUPPLY_RICH.replace('KES 4,800,000', 'KES 5,250,000');
    const next = win.clauseCarryIds(first, win.clauseStampIds(edited).html);
    assert.deepEqual(idsIn(next), idsIn(first), 'every clause is still itself');
    assert.match(next, /KES 5,250,000/, 'and the new wording is the wording');
  });

  test('a document that changed SHAPE is not guessed at', () => {
    const { win } = buildWorld();
    const first = win.clauseStampIds(SUPPLY_RICH).html;
    /* Headings gone: this is not the same document read again, and carrying
       ids across by position would re-point live changes onto other clauses. */
    const flat = '<h1>RAW MATERIAL SUPPLY AGREEMENT</h1><p>One flat paragraph.</p>';
    const next = win.clauseCarryIds(first, win.clauseStampIds(flat).html);
    const shared = idsIn(next).filter(id => idsIn(first).includes(id));
    assert.equal(shared.length, 0, 'it keeps its own fresh stamp');
  });

  test('two clauses can never end up answering to one id', () => {
    const { win } = buildWorld();
    const first = win.clauseStampIds(SUPPLY_RICH).html;
    const next = win.clauseCarryIds(first, win.clauseStampIds(SUPPLY_RICH).html);
    assert.equal(new Set(idsIn(next)).size, idsIn(next).length);
  });
});

/* ============================================================
   2 — THE BASELINE STOPS WANDERING
   ============================================================
   The reported fault, in the one function that caused it. A plain-text body is
   the honest reproduction: negoStampContract writes its stamp back only into a
   RICH stored body, so a text contract regenerates its markup — and its ids —
   on every read, exactly as a template contract does. */
describe('f163 · negoFreshenBaseline — the clause ids hold still', () => {

  const textContract = () => supplyContract({
    id: 'MK-TXT-1', format: 'text',
    redlineText: ['RAW MATERIAL SUPPLY AGREEMENT', '',
      '1. TERM', 'This Agreement runs for twelve (12) months.', '',
      '2. PAYMENT', 'Payment shall be made within thirty (30) days of a valid invoice.', '',
      '3. GOVERNING LAW', 'This Agreement is governed by the laws of Kenya.'].join('\n'),
  });

  test('a regenerated body keeps its ids across repeated paints — the bug', () => {
    const { win } = buildWorld();
    const c = textContract();
    win.negoInit(c);
    const before = idsIn(c.negotiation.baselineBody);
    assert.ok(before.length >= 2, 'the document has clauses to lose');
    win.negoFreshenBaseline(c);
    win.negoFreshenBaseline(c);
    win.negoFreshenBaseline(c);
    assert.deepEqual(idsIn(c.negotiation.baselineBody), before,
      'three repaints used to mean three sets of clause ids, and every id handed '
      + 'to the counterparty was dead the moment their page repainted');
  });

  test('a stored rich body is unaffected, as it always was', () => {
    const { win } = buildWorld();
    const c = supplyContract();
    win.negoInit(c);
    const before = idsIn(c.negotiation.baselineBody);
    win.negoFreshenBaseline(c);
    assert.deepEqual(idsIn(c.negotiation.baselineBody), before);
  });

  test('and it still freshens when the wording genuinely moves', () => {
    const { win } = buildWorld();
    const c = supplyContract();
    win.negoInit(c);
    const ids = idsIn(c.negotiation.baselineBody);
    c.redlineText = SUPPLY_RICH.replace('KES 4,800,000', 'KES 5,250,000');
    assert.equal(win.negoFreshenBaseline(c), true, 'the new wording is picked up');
    assert.match(c.negotiation.baselineBody, /KES 5,250,000/);
    assert.deepEqual(idsIn(c.negotiation.baselineBody), ids,
      'the clauses are the same clauses — only the words moved');
  });

  test('a clause the other side was told about is still findable afterwards', () => {
    const { win } = buildWorld();
    const c = textContract();
    win.negoInit(c);
    /* What travels in the share payload is negotiation.baselineBody, so this is
       the id the counterparty's page anchors their proposal on. */
    const sentId = win.clauseSegment(c.negotiation.baselineBody)[1].clauseId;
    for (let i = 0; i < 5; i++) win.negoFreshenBaseline(c);
    assert.ok(win.negoClauseById(c, sentId),
      'their redline names this clause; we have to still have it');
  });
});

/* ============================================================
   3 — A PROPOSAL THAT ARRIVES ON A STALE ID
   ============================================================
   applyNegoProposals lives in js/core.js, which declares its shell with `const`
   — so it is loaded into a context of its own rather than substituted. See
   f160 for the same stage and the same reason. */
function coreStage(){
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  Object.defineProperty(win, 'crypto', { value: globalThis.crypto, configurable: true, writable: true });
  win.TextEncoder = globalThis.TextEncoder;
  win.console = console;
  const ctx = dom.getInternalVMContext();
  for (const rel of ['js/i18n.js', 'js/components.js', 'js/templates.js', 'js/jurisdiction.js',
    'js/core.js', 'js/richdoc.js', 'js/clausemodel.js', 'js/redline.js',
    'js/versioning.js', 'js/discuss.js', 'js/negotiation.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  return { win, run: src => vm.runInContext(src, ctx) };
}

const OURS = () => ({
  id: 'MK-SUP-9', name: 'Supply', counterparty: 'Nordkust Industri AB', folder: 'proc',
  template: 'RM', status: 'Under Review', value: 4800000, valueType: 'estimated',
  fields: {}, metadata: {}, comments: [], audit: [], signatures: [], rounds: [], versions: [],
  format: 'rich', redlineText: SUPPLY_RICH,
});

describe('f163 · applyNegoProposals — their wording is placed, or it is recorded', () => {

  const setUp = () => {
    const s = coreStage();
    const c = OURS();
    s.win.negoInit(c);
    const clauses = s.win.clauseSegment(c.negotiation.baselineBody);
    return { s, c, clauses };
  };

  test('a proposal on a live clause id is filed (the control)', async () => {
    const { s, c, clauses } = setUp();
    const cl = clauses[2];
    const filed = await s.win.applyNegoProposals(c, { negoProposed: [{
      id: 'CHG-001', clauseId: cl.clauseId, changeType: 'modify',
      oldText: cl.text, newText: cl.text + ' Payment within 45 days.' }] }, 'Grace Njeri');
    assert.equal(filed.length, 1);
    assert.equal(c.changes[0].authorSide, 'counterparty');
    assert.equal(c.changes[0].clauseId, cl.clauseId);
  });

  test('a STALE clause id is recovered by the wording they were editing', async () => {
    const { s, c, clauses } = setUp();
    const cl = clauses[2];
    /* Every link minted before clauseCarryIds carries an id our baseline has
       since re-minted. This used to be dropped in silence. */
    const filed = await s.win.applyNegoProposals(c, { negoProposed: [{
      id: 'CHG-001', clauseId: 'cl_goneaway', changeType: 'modify',
      clauseLabel: 'Clause 3 · PAYMENT',
      oldText: cl.text, newText: cl.text + ' Payment within 45 days.' }] }, 'Grace Njeri');
    assert.equal(filed.length, 1, 'their round is not lost to a renamed clause');
    assert.equal(c.changes[0].clauseId, cl.clauseId,
      'and it is filed on OUR id — filing it on theirs would be the same hole one step along');
  });

  test('and by the clause label when the wording has moved on', async () => {
    const { s, c, clauses } = setUp();
    const cl = clauses[2];
    const label = s.win.negoClauseLabel(cl);
    const filed = await s.win.applyNegoProposals(c, { negoProposed: [{
      id: 'CHG-001', clauseId: 'cl_goneaway', changeType: 'modify',
      clauseLabel: label, oldText: 'wording nobody here has ever had',
      newText: 'Payment shall be made within forty-five (45) days.' }] }, 'Grace Njeri');
    assert.equal(filed.length, 1);
    assert.equal(c.changes[0].clauseId, cl.clauseId);
  });

  test('what genuinely cannot be placed is written into the trail, not dropped', async () => {
    const { s, c } = setUp();
    const filed = await s.win.applyNegoProposals(c, { negoProposed: [{
      id: 'CHG-001', clauseId: 'cl_goneaway', changeType: 'modify',
      clauseLabel: 'Clause 91 · SPACE LAW', oldText: 'nothing like this',
      newText: 'Disputes shall be heard on the Moon.' }] }, 'Grace Njeri');
    assert.equal(filed.length, 0, 'it is not invented onto some other clause');
    const trail = (c.audit || []).map(e => e.detail).join(' | ');
    assert.match(trail, /could NOT be matched/i, 'the owner can see that something arrived');
    assert.match(trail, /Moon/, 'and their exact words are kept, so the round is recoverable by hand');
  });
});
