/* ============================================================
   f245 — the clause editor: one clause, its redline, and Copilot beside it
   ============================================================
   Built from the owner-approved prototype "The Clause Journey" (25 Aug 2026).
   The clause panel's EDIT WITH COPILOT used to hand the clause to the Copilot
   drawer — a chat about a clause you cannot see. It opens a PAGE about the
   clause instead: the wording as it stands above the wording being proposed,
   the marks computed between them, and Copilot down a third of the window.

   WHAT IS PINNED HERE, and every one of them is a rule rather than a look:
     1  the two doors — the panel's button and the change row's, both through
        rlOpenClauseEditor and no other route
     2  WHO MAY OPEN IT, each refusal named separately
     3  APPLY is the only thing that moves the wording, and it STACKS
     4  the redline is COMPUTED by the product's own engine, never scripted
     5  the sub-paragraph lines survive every route in and out
     6  ONE SENTENCE AT A TIME touches only the line it was selected from
     7  it files through negoEditClause and nothing else
     8  the reason step is HaTi's own, Skip included
     9  the counterparty's seat is untouched
    10  both languages
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SRC = read('js/views/clauseeditor.js');
const NEGO = read('js/views/negotiation.js') + read('js/views/negotiation-css.js');
const I18N = read('js/i18n.js');
/* Comments carry the words this file is checking for — "negoFileChange" is in
   several of them — so a source claim about what the CODE calls has to read
   the code with the comments taken out. */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

async function bench(opts = {}){
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
  if (opts.ask !== false){
    await win.negoFileProposal(c,
      win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: opts.side || 'counterparty', author: opts.author || 'Amina Wanjiru' });
  }
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  return { w, win, c, doc: win.document };
}
const firstClauseId = p => p.win.negoClauseList(p.c)[0].clauseId;
/* The stage's window is not 1024 wide by default, and the door refuses a
   window too narrow for two columns. Said once, here, rather than in a dozen
   tests: the width is a fact about the harness, not about the feature. */
function wide(win){ try{ win.innerWidth = 1440; }catch(_){} }

describe('f245 (1) — the doors', () => {
  test('the clause panel hands to the editor, and keeps the old route as the fallback', () => {
    assert.ok(/data-rl-cp-editor="1"/.test(NEGO),
      'the panel\'s Copilot button carries the editor marker');
    assert.ok(/data-nego-ai-clause="\$\{id\}"/.test(NEGO),
      'and it still carries the old attribute — that is the fallback for a stage '
      + 'without the editor module, not a leftover');
    assert.ok(!/rl-cp-act-ai" data-rl-cp-close="1"/.test(NEGO)
      && !/class="rl-cp-act rl-cp-act-ai"[\s\S]{0,120}data-rl-cp-close/.test(NEGO),
      'data-rl-cp-close came OFF that button — it is handled in the capture phase, '
      + 'so the panel would shut before the page opened and closing the page '
      + 'would land the reader on a shut panel');
  });

  test('the handler tries the editor FIRST and stops there either way', () => {
    const m = NEGO.match(/data-rl-cp-editor'\)[\s\S]{0,260}/);
    assert.ok(m, 'the clause-AI handler asks for the marker');
    assert.ok(/rlOpenClauseEditor\(c, clauseId/.test(m[0]),
      'and opens the editor with the clause it was pressed on');
    assert.ok(/return;[\s\S]{0,40}return;/.test(m[0]),
      'a refusal has already said why, so the press stops rather than falling '
      + 'through to a second feature');
  });

  test('the change row carries the second door, and it LEADS', () => {
    assert.ok(/data-rl-cp-editor-row=/.test(NEGO), 'the row has its own door');
    assert.ok(/\$\{ceBtn\}\$\{openBtn\}/.test(NEGO),
      'and it is written BEFORE Open on both card shapes — the approved journey '
      + 'puts Edit with Copilot above Open in the clause panel');
    assert.equal((NEGO.match(/\$\{ceBtn\}\$\{openBtn\}/g) || []).length, 2,
      'both shapes: the receipt line and the full card');
  });

  test('the row door does not answer to .rl-open-btn', () => {
    /* That class MEANS the Open button and half a dozen checks resolve it by
       the class alone. A second element answering to it makes every one of
       them pick whichever comes first in the markup. */
    assert.ok(/class="rl-cp-editor-btn"/.test(NEGO), 'its own class');
    assert.ok(!/class="rl-open-btn rl-cp-editor-btn"/.test(NEGO), 'and only its own');
    assert.ok(/\.rl-cp-editor-btn\{/.test(NEGO), 'dressed by its own rule');
  });

  test('neither door is a second route into the contract', () => {
    const doors = (NEGO.match(/rlOpenClauseEditor\(/g) || []).length;
    assert.ok(doors >= 2, 'both doors call it');
    assert.ok(!/negoFileChange|negoEditClause/.test(
      (NEGO.match(/data-rl-cp-editor-row'\)[\s\S]{0,400}/) || [''])[0]),
      'the row handler opens a page and files nothing');
  });
});

describe('f245 (2) — who may open it', () => {
  test('every refusal names itself, and they are separate answers', async () => {
    const p = await bench(); wide(p.win);
    const R = p.win.clauseEditorRefusal;
    assert.equal(R(null), p.win.i18t('ce_no_contract'));
    assert.equal(R(p.c, { side: 'counterparty' }), p.win.i18t('ce_owner_only'));
    assert.equal(R(p.c, { readonly: true }), p.win.i18t('ce_read_only'));
    assert.equal(R(p.c, {}), null, 'and an ordinary owner seat is let through');
  });

  test('frozen wording refuses, because the words have stopped moving', async () => {
    const p = await bench(); wide(p.win);
    p.c.signatures = [{ by: 'Someone', at: new Date().toISOString() }];
    assert.equal(p.win.clauseEditorRefusal(p.c, {}), p.win.i18t('ce_wording_frozen'));
  });

  test('a window too narrow for two columns refuses in words', async () => {
    const p = await bench();
    try{ p.win.innerWidth = 900; }catch(_){}
    assert.equal(p.win.clauseEditorRefusal(p.c, {}), p.win.i18t('ce_too_narrow'));
    wide(p.win);
    assert.equal(p.win.clauseEditorRefusal(p.c, {}), null);
  });

  test('the desk is asked through the name its own module publishes', () => {
    /* rlMayRedline is the negotiation view's reading of exactly this and is
       deliberately NOT published to window; reaching for it would be silence
       rather than a refusal (f232's whole subject). */
    assert.ok(/window\.deskMayRedline/.test(CODE), 'it asks deskMayRedline');
    assert.ok(!/window\.rlMayRedline/.test(CODE), 'and never an unpublished name');
  });
});

describe('f245 (3) — Apply is the only thing that moves the wording', () => {
  test('it stacks, and Undo steps back one at a time', async () => {
    const p = await bench(); wide(p.win);
    assert.ok(p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {}), 'the page opens');
    const base = p.doc.querySelector('#ce-prop').textContent;
    p.win.ceApply('First go at it.', 'one');
    p.win.ceApply('Second go at it.', 'two');
    assert.ok(/Second go at it/.test(p.doc.querySelector('#ce-prop').textContent));
    p.win.ceUndo();
    assert.ok(/First go at it/.test(p.doc.querySelector('#ce-prop').textContent),
      'one step back, not all the way');
    p.win.ceUndo();
    assert.ok(!/First go at it/.test(p.doc.querySelector('#ce-prop').textContent));
    assert.ok(base.length > 0);
    p.win.rlCloseClauseEditor();
  });

  test('Discard goes back to the wording as it stands, in one press', async () => {
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    p.win.ceApply('Something else entirely.', 'x');
    p.win.ceDiscard();
    const shown = p.doc.querySelector('#ce-prop').textContent;
    assert.ok(!/Something else entirely/.test(shown), 'the draft is gone');
    p.win.rlCloseClauseEditor();
  });

  test('applying the wording already in the box changes nothing', async () => {
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    p.win.ceApply('Only once.', 'a');
    assert.equal(p.win.ceApply('Only once.', 'b'), false, 'it refuses, rather than stacking a no-op');
    p.win.rlCloseClauseEditor();
  });
});

describe('f245 (4) — the redline is computed, never scripted', () => {
  test('it goes through the product\'s own engine', () => {
    assert.ok(/window\.redlineOps/.test(CODE), 'redlineOps computes the marks');
    assert.ok(/redlineStats/.test(CODE), 'and redlineStats counts them');
    assert.ok(!/<ins[^>]*>\$\{/.test(CODE) && !/<del[^>]*>\$\{/.test(CODE),
      'no mark is written by hand anywhere in this page');
  });

  test('the marks and the counts follow whatever put the wording in the box', async () => {
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    /* Compared value by value, not with deepEqual: the object comes back from
       the stage's own realm, so deepStrictEqual fails on the PROTOTYPE while
       every number matches. Rule out the instrument before believing the
       finding — this file's own standing lesson. */
    const before = p.win.ceCounts('the fee is thirty days', 'the fee is thirty days');
    assert.equal(before.ins, 0, 'no change, no insertions');
    assert.equal(before.del, 0, 'no change, no deletions');
    const after = p.win.ceCounts('the fee is thirty days', 'the fee is sixty days');
    assert.ok(after.ins > 0 && after.del > 0, 'a real change is counted both ways');
    const html = p.win.ceRedlineHtml('the fee is thirty days', 'the fee is sixty days');
    assert.ok(/sixty/.test(html) && /thirty/.test(html),
      'both the old and the new wording are on the page — that is what a redline is');
    p.win.rlCloseClauseEditor();
  });
});

describe('f245 (5) — sub-paragraph lines survive', () => {
  test('the wording is read and written as LINES, never one run-together paragraph', async () => {
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    p.win.ceApply('(a) The first limb.\n(b) The second limb.', 'lines');
    /* Joined rather than deepEqual'd, for the cross-realm reason above. */
    assert.equal([...p.win.ceLines()].join('|'), '(a) The first limb.|(b) The second limb.',
      'two lines in, two lines held');
    const boxes = [...p.doc.querySelectorAll('#ce-prop p')];
    assert.ok(boxes.length >= 2, 'and two blocks drawn — a numbered limb is what a contract is cited by');
    p.win.rlCloseClauseEditor();
  });

  test('filing hands the lines to the document builder', () => {
    assert.ok(/negoRichFromLines\(_ceText\)/.test(CODE),
      'negoRichFromLines is what reads line openers back into real numbering');
  });
});

describe('f245 (6) — one sentence at a time', () => {
  test('a rewrite touches only the line the passage was selected from', async () => {
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    p.win.ceApply('(a) Pay within thirty days.\n(b) Interest runs at two per cent.', 'seed');
    const lines = p.win.ceLines();
    assert.equal(lines.length, 2);
    /* The replacement the inline field performs, done here on the same reading
       it uses: line 0 only. Line 1 must come through character for character. */
    const at = lines[0].indexOf('thirty days');
    lines[0] = lines[0].slice(0, at) + 'sixty days' + lines[0].slice(at + 'thirty days'.length);
    p.win.ceApply(lines.join('\n'), 'passage');
    const after = p.win.ceLines();
    assert.equal(after[0], '(a) Pay within sixty days.');
    assert.equal(after[1], '(b) Interest runs at two per cent.',
      'the other limb is untouched, character for character');
    p.win.rlCloseClauseEditor();
  });

  test('a selection spanning two limbs is refused rather than run together', () => {
    assert.ok(/IT HAS TO SIT INSIDE ONE SUB-PARAGRAPH/.test(SRC),
      'the rule is stated where the reading is made');
    assert.ok(/lines\.forEach/.test(CODE),
      'and the selection is resolved per line, not against a flattened text');
  });
});

describe('f245 (7) — it files through the funnel and nothing else', () => {
  test('negoEditClause is the only way in', () => {
    assert.ok(/negoEditClause\(/.test(CODE), 'it files through negoEditClause');
    assert.ok(!/negoFileChange\(/.test(CODE),
      'never the funnel directly — the wrapper carries the clause reading');
    assert.ok(!/changes\.push/.test(CODE), 'and never the array');
    assert.ok(!/negoInsertClause|negoDeleteClause/.test(CODE),
      'this page changes wording; adding and removing clauses have their own doors');
  });

  test('a filing that changes nothing says so in the page, not only in a toast', () => {
    assert.ok(/ce_nothing_changed/.test(CODE),
      'a refusal delivered off-screen is how a live button reads as a dead one');
  });

  test('and it lands back on the panel it came from', () => {
    assert.ok(/rlCpSetShown\(document, clauseId\)/.test(CODE),
      'the clause panel is reopened on the same clause after a filing');
  });
});

describe('f245 (8) — the reason step is HaTi\'s own', () => {
  test('the same words, and the same three buttons', async () => {
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    const box = p.doc.querySelector('#ce-reason');
    assert.ok(box, 'the step is in the page');
    assert.ok(box.hidden, 'and shut until Save is pressed');
    const words = box.textContent;
    assert.ok(words.includes(p.win.i18t('ng_file_change').replace(/&[a-z]+;/g, '')),
      'File change, in the dictionary\'s own words');
    const plain = k => p.win.i18t(k).replace(/&mdash;/g, '\u2014').replace(/&[a-z]+;/g, '');
    assert.ok(words.includes(plain('ng_skip_no_reason')),
      'Skip, because it is skippable everywhere else in this product');
    assert.ok(box.querySelector('[data-ce-act="reason-back"]'), 'and a way back to the wording');
    p.win.rlCloseClauseEditor();
  });

  test('the question itself is the negotiation editor\'s, not a second one', () => {
    assert.ok(/_cet\('ng_why_this_change'\)/.test(CODE), 'the same key');
    assert.ok(/_cet\('ng_ph_reason_example'\)/.test(CODE), 'and the same example');
    assert.ok(!/ce_why_this_change/.test(I18N), 'no private copy of the question');
  });
});

describe('f245 (9) — the counterparty\'s seat is untouched', () => {
  test('the row door is never drawn on their page', () => {
    const m = NEGO.match(/const ceBtn = \([\s\S]{0,220}/);
    assert.ok(m, 'the row door has a guard');
    assert.ok(/side === 'owner'/.test(m[0]), 'our own seat only');
    assert.ok(/!previewSeat/.test(m[0]), 'and not in the preview of theirs');
    assert.ok(/editable/.test(m[0]), 'and only where this reader may redline');
  });

  test('the page refuses a counterparty seat outright', async () => {
    const p = await bench(); wide(p.win);
    assert.equal(p.win.rlOpenClauseEditor(p.c, firstClauseId(p), { side: 'counterparty' }), false);
    assert.equal(p.doc.getElementById('clause-editor'), null, 'and nothing is mounted');
  });
});

describe('f245 (10) — both languages', () => {
  test('every key the page prints is in both dictionaries', () => {
    const keys = [...new Set((SRC.match(/_cet\('([a-z0-9_]+)'/g) || [])
      .map(m => m.replace(/_cet\('/, '').replace(/'/, '')))];
    assert.ok(keys.length > 60, 'the page is written in the dictionary, not in English');
    const missing = keys.filter(k => (I18N.match(new RegExp(`^    ${k}:`, 'gm')) || []).length !== 2);
    assert.deepEqual(missing, [], 'each key appears once in each dictionary');
  });

  test('nothing on the page is a hard-coded English sentence', () => {
    /* The words a reader sees all come through _cet. What is left in English on
       purpose is the model's own prompt and the audit note, and both are on
       f148's SAME_IN_BOTH list with their reasons. */
    const html = (SRC.match(/function clauseEditorHtml\(\)[\s\S]*?\n\}/) || [''])[0];
    const bare = html.match(/>[A-Z][a-z]+ [a-z]+ [a-z]+</g) || [];
    assert.deepEqual(bare, [], 'no sentence is typed into the markup');
  });
});
