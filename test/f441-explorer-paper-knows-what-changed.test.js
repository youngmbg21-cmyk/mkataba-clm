/* ============================================================
   F441 — THE EXPLORER'S PAPER KNOWS WHAT CHANGED (Young asked 30 Sep 2026:
   "I want to be able to ask copilot in explorer page to summarize changes
   while the paper is open. It should have answers related to the paper as I
   read it with no limitations." — and picked the three recommendations:
   the original is the wording when the negotiation started; the record rides
   every question on the open paper; every change is in it, each labelled.)
   ============================================================
   The paper is the agreed wording only, so a question about what changed had
   nothing to answer from. igPaperChanges builds the negotiation's own record
   — per clause, its wording when the negotiation started, then every change
   whole — and igPaperAsk sends it after the wording under its own rule.
   Every test here is red at the parent (2654ad5) — none of these names
   exist — except the one marked [wall], which holds what did not change.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const ORIGINAL = '<h2 data-clause-id="cl_aaaa1111">1. Payment</h2><p>The buyer pays within sixty days of invoice.</p>'
  + '<h2 data-clause-id="cl_bbbb2222">2. Term</h2><p>This agreement runs for one year.</p>';
/* Round 1 closed with the payment change agreed, so the LIVE baseline moved:
   the original is only on the first round's copy. */
const AFTER_R1 = '<h2 data-clause-id="cl_aaaa1111">1. Payment</h2><p>The buyer pays within thirty days of invoice.</p>'
  + '<h2 data-clause-id="cl_bbbb2222">2. Term</h2><p>This agreement runs for one year.</p>';
const LONG = 'The supplier shall keep every record of every delivery made under this agreement. '.repeat(40).trim();

function change(id, over = {}) {
  return { id, clauseId: 'cl_aaaa1111', clauseLabel: '1. Payment', changeType: 'modify', status: 'pending',
    oldText: 'The buyer pays within sixty days of invoice.', newText: 'The buyer pays within thirty days of invoice.',
    author: 'Amina Otieno', authorSide: 'owner', createdAt: '2026-09-10T08:00:00Z', ...over };
}
function negotiated() {
  const many = Array.from({ length: 70 }, (_, i) => change(`CHG-${100 + i}`, { clauseId: 'cl_bbbb2222', clauseLabel: '2. Term',
    oldText: 'This agreement runs for one year.', newText: `This agreement runs for ${i + 2} years.`, status: 'rejected',
    author: 'Kabras Legal', authorSide: 'counterparty', resolvedBy: 'Amina Otieno', resolvedAt: '2026-09-20T09:00:00Z' }));
  return {
    id: 'MK-9', name: 'Supply Agreement', counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review', folder: 'proc',
    fields: {}, metadata: {}, audit: [], versions: [], signatures: [], comments: [], obligations: [], value: 0,
    format: 'rich', redlineText: AFTER_R1,
    negotiation: { round: 2, baselineBody: AFTER_R1,
      rounds: [{ n: 1, baselineBody: ORIGINAL, changes: [change('CHG-1', { status: 'accepted', roundN: 1,
        resolvedBy: 'Kabras Legal', resolvedAt: '2026-09-12T10:00:00Z', why: 'Our cash flow needs it.', reply: 'Agreed.' })] }] },
    changes: [
      change('CHG-2', { roundN: 2, newText: 'The buyer pays within fourteen days of invoice.', oldText: 'The buyer pays within thirty days of invoice.' }),
      change('CHG-3', { roundN: 2, clauseId: 'cl_cccc3333', clauseLabel: null, headingText: '3. Records', changeType: 'insertClause',
        oldText: '', newText: LONG, status: 'pending' }),
      change('CHG-4', { roundN: 2, status: 'superseded', supersededBy: 'CHG-2', newText: 'The buyer pays within twenty days of invoice.' }),
      ...many,
    ],
  };
}
function world(list) {
  const w = buildWorld({ intelView: true });
  const { win } = w;
  win.state = Object.assign({}, win.state, { contracts: list, activeId: null, view: 'intel', aiConfigured: true });
  win.getContract = id => (win.state.contracts || []).find(c => c.id === id) || null;
  win.intel.history = []; win.intel.paper = null;
  if (typeof win.contractRef !== 'function') win.contractRef = c => c.id;
  if (typeof win.igSyncDockWidth !== 'function') win.igSyncDockWidth = () => {};
  win.document.body.innerHTML = `<div id="ig-page"><header id="ig-head" style="display:flex"></header><div id="ig-note"></div>
    <div id="ig-strip" class="ig-strip" hidden></div><div id="ig-gwrap"><svg id="ig-svg"></svg><div id="ig-paper" class="ig-paper" hidden></div></div>
    <aside id="ig-dock"></aside></div>`;
  return w;
}

describe('f441 (1) the record is the whole negotiation, read raw', () => {
  test('a contract with no negotiation has no record, and reading it creates none', () => {
    const c = { id: 'MK-1', name: 'x', fields: {} };
    const { win } = world([c]);
    const r = win.igPaperChanges(c);
    assert.equal(r.text, ''); assert.equal(r.count, 0);
    assert.equal(c.negotiation, undefined, 'reading must not write');
    assert.equal(c.changes, undefined);
  });
  test('the original is the FIRST round\'s wording, not the live baseline', () => {
    const c = negotiated(); const { win } = world([c]);
    const t = win.igPaperChanges(c).text;
    assert.match(t, /Wording when the negotiation started: "1\. Payment The buyer pays within sixty days of invoice\."/);
    assert.match(t, /Wording when the negotiation started: "2\. Term This agreement runs for one year\."/);
  });
  test('every change is in it, every status labelled, nothing counted out (74 of 74)', () => {
    const c = negotiated(); const { win } = world([c]);
    const r = win.igPaperChanges(c);
    assert.equal(r.count, 74);
    for (let i = 0; i < 70; i++) assert.ok(r.text.includes(`CHG-${100 + i} (round 2)`), `CHG-${100 + i} is in the record`);
    assert.match(r.text, /CHG-1 \(round 1\): proposed to change the wording by Amina Otieno \(our side, [^)]+\) on 2026-09-10\./);
    assert.match(r.text, /Status: AGREED, on the paper now[^\n]*decided by Kabras Legal on 2026-09-12\./);
    assert.match(r.text, /Why it was asked: "Our cash flow needs it\."/);
    assert.match(r.text, /Said with the decision: "Agreed\."/);
    assert.match(r.text, /CHG-2[^\n]*\n\s+Status: WAITING FOR AN ANSWER, not on the paper\./);
    assert.match(r.text, /CHG-4[^\n]*\n\s+Status: REPLACED by the later proposal CHG-2, not on the paper\./);
    assert.match(r.text, /Status: REJECTED, not on the paper, decided by Amina Otieno/);
    assert.match(r.text, /\(their side, Kabras Sugar\)/);
  });
  test('a long proposed wording travels whole, never clipped', () => {
    const c = negotiated(); const { win } = world([c]);
    const t = win.igPaperChanges(c).text;
    assert.ok(LONG.length > 3000, 'the fixture is longer than any old clip');
    assert.ok(t.includes(`Proposed wording: "${LONG}"`), 'the whole wording is in the record');
    assert.match(t, /--- 3\. Records ---\nNot in the contract when the negotiation started: it was proposed as a new clause\./);
  });
  test('reading the record writes nothing to the contract', () => {
    const c = negotiated(); const { win } = world([c]);
    const before = JSON.stringify(c);
    win.igPaperChanges(c);
    assert.equal(JSON.stringify(c), before);
  });
});

describe('f441 (2) the question on the open paper carries it', () => {
  function ask(c) {
    const w = world([c]); const { win } = w;
    const sent = [];
    win.copilotAvailable = () => true;
    win.copilotAsk = async (msgs, ctx) => { sent.push({ msgs, ctx }); return { answer: 'ok', citations: [] }; };
    win.contractPlainText = () => '1. Payment The buyer pays within thirty days of invoice. 2. Term This agreement runs for one year.';
    win.igAnalyze(c.id);
    return { win, sent };
  }
  test('the record rides after the wording, under its own rule, with wholeDoc', async () => {
    const c = negotiated(); const { win, sent } = ask(c);
    await win.igPaperAsk('Summarise what changed from the original');
    assert.equal(sent.length, 1);
    const last = sent[0].msgs[sent[0].msgs.length - 1].content;
    assert.equal(sent[0].ctx.wholeDoc, true);
    assert.ok(last.includes(win.IG_PAPER_CHANGES_RULE), 'the record\'s rule is sent');
    const w = last.indexOf('=== THE WORDING OF MK-9'), r = last.indexOf('=== THE NEGOTIATION RECORD OF MK-9');
    assert.ok(w > 0 && r > w, 'the wording first, the record after it');
    assert.ok(last.includes(LONG), 'the record is sent whole');
  });
  test('[wall] a contract with nothing negotiated sends what it always sent', async () => {
    const c = { id: 'MK-2', name: 'Plain', fields: {}, status: 'Draft', template: 'RM' };
    const { win, sent } = ask(c);
    await win.igPaperAsk('What is the term?');
    const last = sent[0].msgs[sent[0].msgs.length - 1].content;
    assert.ok(!last.includes('NEGOTIATION RECORD OF'), 'no record');
    assert.ok(!last.includes(win.IG_PAPER_CHANGES_RULE));
  });
  test('the box\'s hover counts the record in the cost', async () => {
    const c = negotiated(); const { win } = ask(c);
    assert.equal(win.intel.paper.changes, 74);
    assert.ok(win.intel.paper.words > 3000, 'the words counted include the record');
    assert.match(win.igAskCost(), /74 changes/);
    const plain = { id: 'MK-3', name: 'Plain', fields: {}, status: 'Draft', template: 'RM' };
    const w2 = ask(plain);
    assert.doesNotMatch(w2.win.igAskCost(), /changes/);
  });
});

describe('f441 (3) a pin lights only what is on the paper', () => {
  test('a quote found only in the record takes no pin; one on the paper does', () => {
    const c = negotiated(); const { win } = world([c]);
    win.contractPlainText = () => '1. Payment The buyer pays within thirty days of invoice. 2. Term This agreement runs for one year.';
    const on = win.igQuoteOnPaper(c);
    assert.equal(on('The buyer pays within thirty days of invoice.'), true, 'on the paper');
    assert.equal(on('The buyer pays within sixty days of invoice.'), false, 'the old wording is in the record only');
    assert.equal(on('Words that are nowhere at all in either copy.'), true, 'left to the pin\'s own lost state');
  });
});

describe('f441 (4) the words and the names', () => {
  test('the cost line is in both books, and every new name is published', () => {
    const fs = require('node:fs'); const path = require('node:path');
    const I18N = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
    assert.equal((I18N.match(/int_ask_contract_cost_changes:/g) || []).length, 2);
    const IG = fs.readFileSync(path.join(__dirname, '..', 'js/views/intelligence.js'), 'utf8');
    ['IG_PAPER_CHANGES_RULE', 'igPaperChanges', 'igPaperCost', 'igQuoteOnPaper']
      .forEach(n => assert.match(IG, new RegExp('Object\\.assign\\(window,\\{[^}]*\\b' + n + '\\b')));
  });
});
