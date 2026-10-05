/* f523 — TIDY THE COPILOT PANEL: PREPARED QUESTIONS, NEVER MORE THAN FOUR
   (Young, 5 Oct 2026: "I believe the playbook scan tab is redundant since it
   is already addressed by the drafted redlines … keeping the use our standard,
   fall back and copilot as the prepared questions above the copilot entry
   field"; "Also delete the Figure tab feature and the title name at the top of
   the panel that appears after copilot name … ladder should be the last tab
   after risks"; "prepared questions here or in risk should never be more than
   4"; "Go with the recommendations")
   ============================================================================
   The browser half is copilot-panel-tidy-verify; this pins, driven in a world:

     (1) THE ROW — Suggestions · Risks · Ladder, in that order; no Playbook scan,
         no Figure tab, no clause name after "Copilot";
     (2) NEVER MORE THAN FOUR — every row of prepared questions: the clause at
         rest (their ask on the table drops five to four), a highlighted
         passage, the whole contract, and the risk walk;
     (3) THE ORDER — their ask, then our standard · our fallback · Copilot's
         draft, then the risk; on a plain clause the old four;
     (4) A STANDARD QUESTION IS NOT A QUESTION TO COPILOT — data-ce-std, never
         data-ce-chip; a press calls no model and leaves the box alone; the card
         is badged and carries the reason; Apply moves it in;
     (5) THE SMALLEST CHANGE through "Use our standard";
     (6) THE NARROW PANEL draws no figure.

   Run: node --test test/f523-copilot-panel-tidy.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SRC = read('js/views/clauseeditor.js');
const NEG = read('js/views/negotiation.js');
const RISKS = read('js/risks.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const CODE = strip(SRC);

async function bench(opts = {}){
  const w = buildWorld({ negotiationView: true, contractView: true, playbook: true });
  const { win } = w;
  win.promptDialog = async () => '';
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => true;
  const calls = [];
  win.copilotPropose = async (...a) => { calls.push(a); return { proposedText: '', advice: '' }; };
  const c = supplyContract();
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  Object.defineProperty(win, 'innerWidth', { value: 1440, configurable: true });
  const here = win.negoClauseList(c)[0];
  if (opts.review !== false) c.playbook = { key: 'x', label: 't', source: 'ai', verdicts: [
    { category: 'Payment terms', status: 'deviation', quote: here.text.slice(0, 60),
      position: 'Payment due within 30 days',
      redline: here.text.replace(/\.\s*$/, '') + ', and in any case within thirty (30) days.', escalate: false },
  ] };
  if (opts.theirs) await win.negoEditClause(c, here.clauseId, '<p>' + here.text + ' Their own extra sentence.</p>', { side: 'counterparty', author: 'Amina' });
  win.rlOpenClauseEditor(c, here.clauseId, {});
  const doc = win.document;
  const chips = () => [...doc.querySelectorAll('#ce-chips button')];
  return { w, win, c, doc, here, chips, calls };
}

describe('f523 (1) the row', () => {
  test('Suggestions · Risks · Ladder, and nothing after "Copilot"', async () => {
    const tabs = [...CODE.matchAll(/data-ce-tab="([a-z]+)"/g)].map(m => m[1]);
    assert.deepEqual([...new Set(tabs)], ['chat', 'risks', 'ladder']);
    assert.ok(!/ce-ah-cl/.test(CODE), 'no clause name in the rail head');
    const p = await bench();
    const drawn = [...p.doc.querySelectorAll('#ce-tabs [data-ce-tab]')].map(b => b.getAttribute('data-ce-tab'));
    assert.equal(drawn[drawn.length - 1], 'ladder', 'Ladder is last on the screen');
    assert.equal(p.doc.querySelector('[data-ce-tab="scan"], [data-ce-tab="figure"], .ce-ah-cl'), null);
  });
  test('the retired code is gone, not hidden', () => {
    for (const dead of ['function ceScanHtml', 'function ceScanCardHtml', 'CE_SCAN_VERBS', 'function ceAddMissingClause',
      'function ceRunScan', 'function ceFigureLaneHtml', 'function ceFigureWrite', 'function ceFigureTopic', 'ce-fig-range'])
      assert.equal(CODE.includes(dead), false, dead);
  });
});

describe('f523 (2) never more than four', () => {
  test('the clause at rest with their ask on the table: four, their ask first', async () => {
    const p = await bench({ theirs: true });
    const q = p.chips().map(b => b.textContent.trim());
    assert.equal(q.length, 4, q.join(' | '));
    assert.match(q[0], /^How should we answer CHG-/);
  });
  test('a highlighted passage and the whole contract stay at three', () => {
    const ch = SRC.match(/function ceRenderChips\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(ch, /qs\.push\(_cet\('ce_q_words_mean'\), _cet\('ce_q_words_standard'\), _cet\('ce_q_words_risk'\)\);/);
    assert.match(ch, /qs\.push\(_cet\('ce_q_contract_risks'\), _cet\('ce_q_contract_missing'\), _cet\('ce_q_contract_end'\)\);/);
    assert.match(ch, /qs\.push\(_cet\('ce_inline_shorten'\), _cet\('ce_inline_firmer'\), _cet\('ce_inline_plain'\)\);/);
    assert.match(ch, /\.slice\(0, CE_CHIPS_MAX\)/, 'and every row is cut at the one ceiling');
    assert.match(SRC, /const CE_CHIPS_MAX = 4;/);
  });
  test('the risk walk holds its own four', () => {
    assert.match(RISKS.match(/function riskChipsHtml\([\s\S]*?\n\}/)[0], /Object\.keys\(RK_ASK_WORD\)\.map/, 'drawn off the one list');
    const n = (RISKS.match(/const RK_ASK_WORD = \{[^}]*\}/)[0].match(/[a-z]+: 'rk_ce_/g) || []).length;
    assert.ok(n > 0 && n <= 4, 'four at most: ' + n);
  });
});

describe('f523 (3) the order', () => {
  test('a clause off our standard: the standard questions lead, then the risk', async () => {
    const p = await bench();
    const q = p.chips().map(b => [b.textContent.trim(), b.hasAttribute('data-ce-std')]);
    assert.ok(q.length <= 4);
    const std = q.filter(x => x[1]).map(x => x[0]);
    assert.ok(std.length >= 1, 'at least one standard question: ' + q.map(x => x[0]).join(' | '));
    assert.deepEqual(std, ['Use our standard', 'Use our fallback', "Use Copilot's draft"].filter(x => std.includes(x)), 'in their order');
    assert.ok(q.findIndex(x => !x[1]) >= std.length, 'the standard ones come first');
    if (q.length === 4 && std.length < 4) assert.equal(q[std.length][0], 'What is the risk in this clause?');
  });
  test('a plain clause: the old four, no standard question', async () => {
    const p = await bench({ review: false });
    const q = p.chips().map(b => b.textContent.trim());
    assert.deepEqual(q, ['What is the risk in this clause?', 'Give me a softer version', 'Say this in plain English', 'What does our playbook say here?']);
  });
});

describe('f523 (4) a standard question is not a question to Copilot', () => {
  test('its own attribute, a card, no call, and the box waits for Apply', async () => {
    const p = await bench();
    const b = p.chips().find(x => x.getAttribute('data-ce-std') === 'preferred');
    assert.ok(b, 'Use our standard is offered');
    assert.equal(b.hasAttribute('data-ce-chip'), false, 'never data-ce-chip');
    const box0 = p.doc.querySelector('#ce-clausebody').innerHTML;
    const n0 = p.win.negoChanges(p.c).length;
    b.click();
    await new Promise(r => setTimeout(r, 30));
    assert.equal(p.calls.length, 0, 'no model call');
    assert.equal(p.doc.querySelector('#ce-clausebody').innerHTML, box0, 'the box is untouched');
    assert.equal(p.win.negoChanges(p.c).length, n0, 'nothing filed');
    const card = [...p.doc.querySelectorAll('#ce-lane .ce-card')].pop();
    assert.ok(card, 'a Suggested wording card');
    assert.match(card.querySelector('.n').textContent, /Suggested wording/);
    assert.match(card.querySelector('.chip').textContent, /Our standard/i);
    assert.match((card.querySelector('.r') || {}).textContent || '', /\S/, 'with its reason');
    assert.ok(/class="ce-you"/.test(p.doc.querySelector('#ce-lane').innerHTML), 'and the press reads as the reader\'s turn');
    card.querySelector('[data-ce-apply]').click();
    await new Promise(r => setTimeout(r, 30));
    assert.notEqual(p.doc.querySelector('#ce-clausebody').innerHTML, box0, 'Apply moves it in');
    assert.equal(p.win.negoChanges(p.c).length, n0, 'and still files nothing — Save does');
    assert.equal(p.calls.length, 0, 'still no model call');
  });
  test('the press and the card read through the one wording reading', () => {
    assert.match(SRC, /function ceStdPress\(kind\)\{[\s\S]*?const w = ceStdWording\(it, k\);/);
    assert.match(SRC, /function ceStdChips\(\)\{[\s\S]*?ceStdWording\(it, k\)/);
    assert.ok(!/copilotPropose|fetch\(|\/api\//.test(SRC.match(/function ceStdPress\(kind\)\{[\s\S]*?\n\}/)[0]), 'spends nothing');
  });
});

describe('f523 (5) the smallest change through "Use our standard"', () => {
  test('a figure found is the whole of the change', async () => {
    const p = await bench();
    const it = { clauseId: p.here.clauseId, oldHtml: '<p>Pay within sixty (60) days.</p>', v: { quote: 'sixty (60) days' },
      preferred: 'The Buyer shall pay every invoice within thirty (30) days of receipt.',
      fit: { kind: 'figure', text: 'Pay within thirty (30) days.', html: '<p>Pay within thirty (30) days.</p>' } };
    const w = p.win.ceStdWording(it, 'preferred');
    assert.equal(w.text, '<p>Pay within thirty (30) days.</p>', 'only the figure moves');
    assert.equal(w.fitted, true);
    const fb = p.win.ceStdWording({ ...it, fallback: 'X' }, 'fallback');
    assert.notEqual(fb && fb.text, it.fit.html, 'the fallback never takes the figure');
    assert.equal(p.win.ceStdWording({ ...it, fit: null, preferred: '' }, 'preferred'), null, 'no wording, no question');
  });
});

describe('f523 (6) the narrow panel draws no figure', () => {
  test('rlLadderTailHtml is the playbook and the notes', () => {
    const fn = NEG.match(/function rlLadderTailHtml\([\s\S]*?\n\}/)[0];
    assert.ok(!/rlFigureSecHtml|noFigure/.test(fn));
    assert.ok(!/function rlFigureSecHtml|data-rl-fig-write/.test(strip(NEG)), 'the section and its press are gone');
    assert.match(NEG, /function rlScaleHtml\(/, 'the Deal board keeps its scale');
  });
});
