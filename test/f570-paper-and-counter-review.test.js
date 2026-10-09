'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f570 — THE PAPER AND COUNTER REVIEW (Young said "go", 9 Oct 2026), and the
   functional review's Negotiate items, as far as node can see them. The
   browser halves: counter-with-copilot-verify, edit-clause-door-verify (was click-type-save-verify; click · type · save retired 9 Oct 2026).

   (1) Copilot's redo reaches the paper at once: the probe the negotiation page
       already asks carries `prepAt`, which moves when an answer is written to
       round_prep (a redo moves no version); the redone answer is taken from
       the reply into the book, and "redone" is said only once it is there.
   (2) Copilot's counter on the paper: a dashed box under their wording — our
       seat only, never their page, only while the ask is live — marking only
       the words it adds; Counter glows; the editor's card says "Rests on:"
       once; Save counter carries the note as the counter's reason.
   (3) Send all names what travels: one reading for the count and the list.
   (4) A non-answer from the chat route is not an answer: copilotPropose says
       `unfinished`, and the editor says its own sentence with Try again.
   (5) The panel's Edit with Copilot is greyed with its reason where the
       editor cannot open (a tablet).
   (6) The Document tab is never typed in: a fillable Draft's blanks are
       readonly answers.
   AT THE PARENT (6a709b6) every claim fails: there is no prepAt, no box, no
   glow, no list, no unfinished, and the panel door is live at any width.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { buildWorld, supplyContract } = require('./world');
const RP = require('../js/roundprep.js');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const region = (src, name) => { const i = src.indexOf('function ' + name + '('); return i < 0 ? '' : src.slice(i, src.indexOf('\n}', i) + 2); };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();

describe('f570 (1) the redo reaches the paper', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });

  test('the probe carries prepAt, and a written answer moves it without moving the version', async () => {
    const DOC = '1. Price\nInvoices fall due within 45 days of receipt.';
    const c = fixtureContract('MK-RP1', 'Supply', 'Nandi Dairy', FOLDER_A, 900000, 'Under Review', DOC);
    const THEIRS = 'Invoices fall due within 90 days of receipt.';
    c.changes = [{ id: 'CHG-1', clauseId: 'cl_p', clauseLabel: '1. Price', status: 'pending', authorSide: 'counterparty',
      newText: THEIRS, oldText: 'Invoices fall due within 45 days of receipt.', createdAt: iso(-1), summary: 'x' }];
    await W.admin.json('/api/contracts/MK-RP1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const s0 = await W.admin.json('/api/contracts/MK-RP1/state');
    assert.ok(Object.prototype.hasOwnProperty.call(s0, 'prepAt'), 'the probe says where Copilot\'s answers stand');
    assert.equal(s0.prepAt, null, 'none yet');
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db')); db.exec('PRAGMA busy_timeout = 5000');
    const at = iso(0);
    db.prepare('INSERT INTO round_prep (contract_id,pkey,json,created_at) VALUES (?,?,?,?)').run('MK-RP1', RP.roundPrepKey('cl_p', THEIRS),
      JSON.stringify({ v: 1, at, verdict: 'counter', why: 'Half way.', standard: 'Payment terms', wording: 'Invoices fall due within 60 days of receipt.', clauseId: 'cl_p' }), at);
    db.close();
    const s1 = await W.admin.json('/api/contracts/MK-RP1/state');
    assert.equal(s1.prepAt, at, 'the answer\'s own time');
    assert.equal(s1.version, s0.version, 'and the version did not move — which is why the version alone never saw a redo');
    const full = await W.admin.json('/api/contracts/MK-RP1');
    assert.equal(full._roundPrep && full._roundPrep[RP.roundPrepKey('cl_p', THEIRS)].verdict, 'counter', 'the record\'s read carries it');
  });

  test('the page takes the reply\'s answer at once, and says "redone" only once it is there', () => {
    const { win } = buildWorld({ negotiationView: true, agents: true });
    const c = { id: 'MK-X' };
    assert.equal(win.agRoundPrepTake(c, 'k1', { at: 't1', verdict: 'counter' }), true);
    assert.equal(c._roundPrep.k1.verdict, 'counter');
    assert.equal(win.agRoundPrepLanded(c, 'k1', { at: 't1', verdict: 'counter' }), true);
    assert.equal(win.agRoundPrepLanded(c, 'k1', { at: 't2', verdict: 'counter' }), false, 'an older answer is not the new one');
    const press = region(R('js/views/agents.js'), 'agSendBackPress');
    assert.match(press, /agRoundPrepTake\(c, sbKey, r && r\.answer\)/);
    assert.match(press, /toast\(_agT\(landed \? 'ag_sendback_done' : 'ag_sendback_pending'\)/);
    assert.match(press, /agPrepRedraw\(c\.id\)/, 'and every open paper is redrawn');
    const neg = R('js/views/negotiation.js');
    assert.match(neg, /hasOwnProperty\.call\(st, 'prepAt'\)/, 'the negotiation page\'s own probe watches it');
  });
});

describe('f570 (2) Copilot\'s counter, on the paper and in the editor', () => {
  function bench(prep){
    const w = buildWorld({ negotiationView: true, contractView: true });
    const { win } = w;
    win.roundPrepOf = RP.roundPrepOf; win.roundPrepKey = RP.roundPrepKey;
    const c = supplyContract();
    win.negoInit(c);
    return { win, c, prep };
  }
  test('a dashed box under their wording carries the words Copilot adds; Counter glows; nothing is filed', async () => {
    const { win, c } = bench();
    const cl = win.negoClauseList(c).find(x => /thirty \(30\) days/.test(x.text));
    const ch = await win.negoFileChange(c, { clauseId: cl.clauseId, changeType: 'modify', side: 'counterparty', author: 'Erik',
      oldText: cl.text, newText: cl.text.replace('thirty (30) days', 'ninety (90) days'), summary: 'x' });
    const before = c.changes.length;
    /* ONE PAINTER (the overnight reconciliation, 9 Oct 2026): Copilot's answer
       is painted AFTER the render by rlPaintCopilotAnswers — never written into
       the paper's HTML, so no fingerprint moves — and only for an answer the
       reader asked Copilot to redo (`sentBack`). */
    const paint = (prep, side) => {
      c._roundPrep = prep ? { [RP.roundPrepKey(ch.clauseId, ch.newText)]: prep } : undefined;
      const box = win.document.createElement('div'); box.innerHTML = win.redlineDocHtml(c, { side });
      win.document.body.appendChild(box);
      win.rlPaintCopilotAnswers(box, c, { side, verbsIn: box });
      box.remove();
      return box;
    };
    const counter = { verdict: 'counter', why: 'Half way.', standard: 'Payment terms',
      wording: ch.newText.replace('ninety (90) days', 'sixty (60) days'), at: 't', sentBack: { note: 'Counter at 60', by: 'Amina' } };
    assert.equal(paint(null, 'owner').querySelector('.rl-sug-box'), null, 'no answer, no box');
    assert.ok(!win.redlineDocHtml(c, { side: 'owner' }).includes('rl-sug'), 'the render itself never carries it');
    const pb = paint(counter, 'owner').querySelector('.rl-sug-box');
    assert.ok(pb, 'the dashed box is on the paper');
    assert.match(pb.textContent, /sixty \(60\) days/);
    assert.ok([...pb.querySelectorAll('.rl-sug-new')].some(x => /sixty/.test(x.textContent)), 'the words it adds are marked');
    assert.equal(pb.querySelectorAll('del').length, 0, 'nothing is struck in it');
    assert.equal(paint(counter, 'counterparty').querySelector('.rl-sug-box'), null, 'never on their seat');
    assert.equal(paint(Object.assign({}, counter, { sentBack: undefined }), 'owner').querySelector('.rl-sug-box'), null,
      'an answer nobody asked Copilot to redo stays a line on the row');
    assert.equal(c.changes.length, before, 'nothing filed');
    const neg = R('js/views/negotiation.js');
    assert.ok(!/rlPrepBoxHtml|rlPrepCounterOf|rl-prep-box|data-rl-glow="/.test(neg), 'the second box and the second glow are gone');
    assert.match(region(neg, 'rlPaintCopilotAnswers'), /v\.classList\.add\('rl-glow'\)/, 'the one glow');
  });
  test('the editor: one card, in the box, "Rests on:" once, a note that travels as the reason, Save counter', () => {
    const ce = R('js/views/clauseeditor.js');
    assert.match(ce, /rests: String\(prep\.standard \|\| ''\)/, 'the card is handed the standard alone — its own line says "Rests on:"');
    assert.ok(!/rests: prep\.standard \? _cet\('ag_prep_rests'/.test(ce), 'never "Rests on: Rests on:"');
    assert.match(ce, /lane\.innerHTML = \(_cePrep \? '' : ceLadderCardHtml\(\)\)/, 'no second card that disagrees');
    assert.match(ce, /if \(_cePrep && _cePrep\.sentBack\) cePrepPut\(\{ quiet: true \}\);/,
      'the answer the paper drew dashed (sentBack) arrives in the box; one Copilot prepared alone keeps its Apply');
    assert.ok(!/cd\.prepared && cd\.sentBack\); \}\);\s*\n\s*if \(btn\) btn\.click\(\)/.test(ce), 'no second arrival door pressing Apply');
    assert.match(region(ce, 'ceFile'), /if \(!why && prepFiling && String\(_cePrep\.note \|\| ''\)\.trim\(\)\) why = String\(_cePrep\.note\)\.trim\(\);/,
      'the note to them rides the counter as its reason — the field they read');
    const { STRINGS } = require('../js/i18n.js');
    assert.equal(STRINGS.en.ce_save_counter, 'Save counter');
    assert.equal(STRINGS.en.ce_prep_inbox, 'In the box');
    assert.equal(STRINGS.en.ce_prep_out, 'Take it out');
  });
});

describe('f570 (3) Send all names what travels', () => {
  test('one reading for the count and the list, and the batch send asks with it', () => {
    const neg = R('js/views/negotiation.js');
    assert.match(region(neg, 'rlUnsentCount'), /return rlUnsentList\(c\)\.length;/);
    assert.match(neg, /if \(!_rlSoloSendId && typeof window\.confirmDialog === 'function'\)\{\s*\n\s*const list = rlUnsentList\(c\);/);
    const { STRINGS } = require('../js/i18n.js');
    assert.equal(STRINGS.en.ng_sendall_q_title_other, 'Send {n} changes to {who}?');
    assert.ok(STRINGS.sv.ng_sendall_q_title_other && STRINGS.sv.ng_sendall_q_title_other !== STRINGS.en.ng_sendall_q_title_other);
  });
});

describe('f570 (4) a non-answer is not an answer', () => {
  test('copilotPropose reports unfinished; the editor says its own sentence with Try again', () => {
    const ai = R('js/ai.js');
    assert.match(region(ai, 'copilotPropose'), /if \(res && typeof res === 'object' && \(res\.unfinished \|\| res\.empty\)\) return \{ unfinished: true/);
    const ce = R('js/views/clauseeditor.js');
    assert.match(region(ce, 'ceAsk'), /if \(res\.unfinished\)\{\s*\n\s*_ceThread\.push\(\{ who: 'ai', text: _cet\('ce_ask_unfinished'\), retry: q \}\);/);
    assert.match(ce, /data-ce-retry="\$\{i\}"/);
    const { STRINGS } = require('../js/i18n.js');
    assert.ok(!/naming a specific contract/.test(STRINGS.en.ce_ask_unfinished), 'not the portfolio chat\'s words');
  });
});

describe('f570 (5)(6) a dead door is greyed; the Document tab is read', () => {
  test('at a tablet width the clause panel\'s Edit with Copilot is disabled with the reason', async () => {
    const { win } = buildWorld({ negotiationView: true, contractView: true });
    const c = supplyContract(); win.negoInit(c);
    win.clauseEditorFits = () => false;
    const sink = [];
    win.redlineDocHtml(c, { side: 'owner', cpSink: sink, cpPanel: true });
    const html = sink.join('');
    assert.match(html, /class="rl-cp-act rl-cp-act-ai" disabled aria-disabled="true" data-rl-dead="1"/);
    assert.ok(!/data-nego-ai-clause=/.test(html), 'no live door onto a page that refuses');
    win.clauseEditorFits = () => true;
    const sink2 = []; win.redlineDocHtml(c, { side: 'owner', cpSink: sink2, cpPanel: true });
    assert.match(sink2.join(''), /data-nego-ai-clause=/, 'and live where the editor opens');
  });
  test('a fillable Draft\'s blanks on the Document tab are readonly answers', () => {
    const { win } = buildWorld({ contractView: true });
    const out = win.docPaperAnswersHtml('<p>Paid within <input class="field" data-field="days" value="30"> days.</p>');
    assert.match(out, /readonly=""/); assert.match(out, /tabindex="-1"/); assert.match(out, /data-doc-answer="1"/);
    assert.match(region(R('js/views/contract.js'), 'docSheetHtml'), /docFillable\(c\)\)\?docPaperAnswersHtml\(docBody\(c\)\)/);
  });
});
