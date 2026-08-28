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
/* The engine's editor, comments stripped — this file records retired names in
   its own prose, so a raw read reports them as still live. */
const NEGO_CODE = NEGO.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

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
    const base = p.doc.querySelector('#ce-clausebody').textContent;
    p.win.ceApply('First go at it.', 'one');
    p.win.ceApply('Second go at it.', 'two');
    assert.ok(/Second go at it/.test(p.doc.querySelector('#ce-clausebody').textContent));
    p.win.ceUndo();
    assert.ok(/First go at it/.test(p.doc.querySelector('#ce-clausebody').textContent),
      'one step back, not all the way');
    p.win.ceUndo();
    assert.ok(!/First go at it/.test(p.doc.querySelector('#ce-clausebody').textContent));
    assert.ok(base.length > 0);
    p.win.rlCloseClauseEditor();
  });

  test('Discard goes back to the wording as it stands, in one press', async () => {
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    p.win.ceApply('Something else entirely.', 'x');
    p.win.ceDiscard();
    const shown = p.doc.querySelector('#ce-clausebody').textContent;
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
    const boxes = [...p.doc.querySelectorAll('#ce-clausebody p')];
    assert.ok(boxes.length >= 2, 'and two blocks drawn — a numbered limb is what a contract is cited by');
    p.win.rlCloseClauseEditor();
  });

  /* REVERSED IN PLACE 28 Aug 2026, and the claim is unchanged: line openers are
     still read back into real numbering by negoRichFromLines. What moved is
     WHEN. This page's wording is rich HTML now rather than a plain string, so
     the conversion happens on the way IN — ceRich, the one coercion every plain
     route goes through — and by the time a change is filed the numbering is
     already real markup. Filing therefore hands the body straight over.
     Pinning `negoRichFromLines(_ceText)` would now pin a step that has moved,
     not the property it was written to protect. */
  test('line openers are read back into real numbering, on the way in', () => {
    assert.ok(/function ceRich\(/.test(CODE), 'ceRich is the one coercion');
    assert.ok(/negoRichFromLines\(t\)/.test(CODE),
      'and it is what reads line openers back into real numbering');
  });

  test('filing hands over the rich body it already holds', () => {
    assert.ok(/const html = _ceText;/.test(CODE),
      'no second conversion at the filing step — one representation on the page');
    assert.ok(/negoEditClause\(c, clauseId, html/.test(CODE),
      'and it still goes through the same funnel');
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
  /* REVERSED IN PLACE 26 Aug 2026: there are TWO wrappers now, not one — a
     clause somebody proposed is revised through negoReviseInsert so the ask
     keeps its id rather than gaining a rival. The safety property is unchanged
     and is what this claim was always really about: never the raw funnel, never
     the array, and no second door for adding or removing a clause. */
  test('the two wrappers are the only ways in', () => {
    assert.ok(/negoEditClause\(/.test(CODE), 'wording in the agreement');
    assert.ok(/negoReviseInsert\(/.test(CODE), 'and a clause still only proposed');
    assert.ok(!/negoFileChange\(/.test(CODE),
      'never the funnel directly — the wrapper carries the clause reading');
    assert.ok(!/changes\.push/.test(CODE), 'and never the array');
    assert.ok(!/negoInsertClause\(|negoDeleteClause\(/.test(CODE),
      'this page changes wording; ADDING and removing clauses have their own '
      + 'doors — revising one already proposed is not adding it again');
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

/* REVERSED IN PLACE 28 Aug 2026 (owner-asked: "we need to remove the mandate
   for adding why this change for every change. Users can use the notes feature
   to add notes on changes").

   WHAT THIS BLOCK USED TO PIN was that the reason step here was the engine's
   own — the same key, the same example, the same three buttons — so one page
   could not refuse what another permitted. THAT CLAIM IS KEPT AND IS STRONGER
   AS AN ABSENCE: both paths file in ONE press, and neither asks. A reason step
   coming back on one of the two and not the other is what these checks now
   catch. */
describe('f245 (8) — nothing asks why, on either path', () => {
  test('Save FILES — there is no step in between', async () => {
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    assert.equal(p.doc.querySelector('#ce-reason'), null, 'the panel is gone, not hidden');
    assert.equal(p.doc.querySelector('#ce-why'), null, 'and so is its box');
    for (const act of ['reason-back', 'reason-skip', 'reason-file'])
      assert.equal(p.doc.querySelector('[data-ce-act="' + act + '"]'), null,
        act + ' is retired');
    assert.ok(p.doc.querySelector('[data-ce-act="save"]'), 'the one act is still there');
    p.win.rlCloseClauseEditor();
  });

  test('and the act goes straight to the funnel', () => {
    assert.ok(/case 'save': cePullText\(\); ceFile\(\); break;/.test(CODE),
      'Save pulls the wording and files it, with nothing in between');
    assert.ok(!/ceOpenReason/.test(CODE), 'the opener is gone rather than left unreachable');
  });

  test('THE ENGINE\'S OWN EDITOR AGREES — one press there too', () => {
    assert.ok(!/data-nego-skip/.test(NEGO_CODE), 'no Skip, because there is nothing to skip');
    assert.ok(!/data-nego-back/.test(NEGO_CODE), 'no way back from a step that does not exist');
    assert.ok(!/data-nego-reason/.test(NEGO_CODE), 'and no reason box on the filing path');
    assert.ok(/data-nego-next[\s\S]{0,600}?file\(\)/.test(NEGO_CODE),
      'Save files rather than stepping');
  });

  test('WHAT IT COSTS IS NOT SILENT — the reason still travels where it is written', () => {
    /* `why` is not deleted from the product: it is on the record, it is printed
       on the cards, and the Copilot proposal card still writes one. That card
       is what keeps the counterparty-facing sentence reachable at all, which is
       why removing it too would be a capability lost rather than a step. */
    assert.ok(/data-ai-prop-why/.test(read('js/ai.js')),
      'the Copilot card keeps its optional reason — the one surface that still writes one');
    assert.ok(/why\b/.test(read('js/negotiation.js')),
      'and the funnel still accepts one, so an existing reason is not orphaned');
  });
});

describe('f245 (16) — the highlight strip is one strip, and it files nothing', () => {
  test('the box holds the WORDING, not an instruction to a model', () => {
    assert.ok(/ceInlineApply/.test(CODE), 'the reader\'s own hand has a name');
    assert.ok(/ta\.value = sel\.text/.test(CODE),
      'it opens carrying the passage, so the common act is editing a sentence');
    assert.ok(!/ce_inline_about/.test(CODE),
      'and the context line is gone — the words are not printed twice');
  });

  test('ONE reading of the replacement, shared by the hand and by Copilot', () => {
    const m = CODE.match(/function ceReplacePassage\([\s\S]{0,900}?\n\}/);
    assert.ok(m, 'there is one replacement');
    assert.ok(/lines\[sel\.line\] = ln\.slice\(0, at\)/.test(m[0]),
      'inside ONE line, with every other line carried across');
    /* A second copy is how the reader\'s typing and a rewrite come to disagree
       about what a line break costs. */
    assert.equal(CODE.split('lines[sel.line] = ln.slice(0, at)').length - 1, 1,
      'and only one');
  });

  test('ENTER APPLIES, SHIFT+ENTER MAKES A LINE', () => {
    assert.ok(/key === 'Enter' && !ev\.shiftKey\){ ev\.preventDefault\(\); ceInlineApply/.test(CODE),
      'Enter files the wording into the draft');
  });

  test('A CHIP ANSWERS INTO THE BOX, never into the contract', () => {
    const go = CODE.match(/async function ceInlineGo\([\s\S]{0,2400}?\n\}/);
    assert.ok(go, 'the Copilot path is its own function');
    assert.ok(/ta\.value = wording/.test(go[0]),
      'what comes back lands in the box for the reader to read and edit');
    assert.ok(!/ceApply\(/.test(go[0]),
      'and never straight onto the paper — one strip, one box, one press');
  });

  test('AND THE STRIP IS NOT A THIRD DOOR — it files nothing', () => {
    const rep = CODE.match(/function ceReplacePassage\([\s\S]{0,900}?\n\}/)[0];
    for (const door of ['negoEditClause', 'negoFileChange', 'negoReviseInsert', 'persist('])
      assert.ok(!rep.includes(door), door + ' must not be reachable from the strip');
    assert.ok(/ceApply\(lines\.join/.test(rep),
      'it applies to the draft; the one act in the rail\'s foot still files');
  });

  test('both languages carry its words', () => {
    for (const k of ['ce_inline_ph', 'ce_inline_replace', 'ce_inline_replace_title',
      'ce_inline_suggested', 'ce_inline_say_what']){
      assert.ok(new RegExp('\\b' + k + ':').test(I18N), k + ' is in the dictionary');
      assert.equal(I18N.split(new RegExp('\\b' + k + ':')).length - 1, 2,
        k + ' is in BOTH languages');
    }
  });
});

describe('f245 (17) — the four faults reported off the screenshots', () => {
  /* OWNER-REPORTED 28 Aug 2026, off three pictures of the real page:
     "almost all of the features do not seem to be working like undo and the
     font as well and even bullet points does not give you the bullet point it
     just pushes you inwards", and the expand control that was on the approved
     render and not in the build. Each was reproduced in a browser before it
     was touched; the pixels are pinned in clause-editor-verify section 19. */

  /* THE BULLET BUTTON DID MAKE A REAL LIST ALL ALONG — execCommand writes
     <p><ul>…</ul></p>, which is invalid, and the HTML parser closes the <p>
     when the body is re-read, so nothing was ever malformed by the time it was
     stored. MEASURED both ways: the sanitiser's output on that input is byte
     for byte what it was before this fix. A first attempt added twenty lines to
     lift the list out and they were DEAD CODE with a comment blaming them for
     the bug; they were removed rather than shipped. What was actually wrong was
     one missing declaration, below. */
  test('the sanitiser keeps a list a list, and always did', () => {
    const win = buildWorld().win;
    const out = win.sanitizeRich('<p>Lead in<ul><li>one</li><li>two</li></ul>tail</p>');
    assert.ok(!/<p>[^<]*<ul/.test(out), 'no <ul> survives inside a <p>: ' + out);
    assert.ok(/<ul>/.test(out) && /two<\/li>/.test(out), 'and the list itself is kept');
  });

  test('THE MARKER IS PUT BACK, in HaTi\'s own sheet — this was the whole fault', () => {
    const CSS = read('js/views/negotiation-css.js');
    assert.ok(/list-style-type:disc/.test(CSS), 'a bullet list draws a bullet');
    assert.ok(/list-style-type:decimal/.test(CSS), 'a numbered list draws a number');
    /* The compiled Tailwind blob sets list-style:none on every list in the
       product, and it regenerates — the font-600 lesson. */
    assert.ok(!/list-style-type:disc/.test(read('index.html').split('\n')[80] || ''),
      'never written into the generated blob');
  });

  test('UNDO TAKES THE TYPING FIRST, and the paper is fenced while it repaints', () => {
    assert.ok(/function ceUndo\(\)\{?[\s\S]{0,700}?cePullText\(\)/.test(CODE),
      'Undo pulls the box before it steps back, so it undoes what was typed');
    assert.ok(/_ceRendering = true;/.test(CODE) && /if \(_ceRendering\) return;/.test(CODE),
      'and the blur handler stands down while the paper is being written over');
    assert.ok(/function ceBoxDirty/.test(CODE),
      'the button knows about typing the stack has not taken yet');
  });

  /* REVERSED IN PLACE 28 Aug 2026, after comparing the approved prototype with
     the build. This pinned a CONTRACT-ALONE toggle that hid the Copilot rail —
     my own reading of the button the owner reported missing. The prototype's
     button in that slot is the WAY OUT of work mode, and with the header gone
     it is the only one. */
  test('THE WAY OUT IS ON THE STRIP, and it is the only one', () => {
    assert.ok(/class="ce-exit" data-ce-act="close"/.test(CODE),
      'the last thing on the strip leaves the page');
    /* THAT IT IS THE ONLY ONE is a claim about the drawn page and is measured
       there (clause-editor-verify 2p): a source count would also catch the
       querySelector that finds it. */
    assert.ok(!/data-ce-wide|ceSetWide|_ceWide/.test(CODE),
      'the contract-alone toggle is gone rather than left beside it');
    /* It must not grow into the product's focus mode: that one hides the app's
       OWN chrome, and this page has none to hide. */
    assert.ok(!/rlSetFocus/.test(CODE), 'and it never reaches for the app-wide one');
  });

  test('AND THE HEADER IS GONE — work mode opens into the contract', () => {
    for (const id of ['ce-title', 'ce-crumb', 'ce-ostat', 'ce-facts', 'ce-sel', 'ce-headacts'])
      assert.ok(!new RegExp('id="' + id + '"').test(CODE), id + ' is not drawn');
    assert.ok(!/class="ui-btn ce-back-btn"/.test(CODE), 'and neither is the back button');
    /* #ce-say stays: it is where a refusal is spoken, and a refusal with
       nowhere to appear is a dead press. */
    assert.ok(/id="ce-say"/.test(CODE), 'but the status line does, on the strip');
  });

  test('a tool that cannot act GREYS, with the reason on its hover', () => {
    assert.ok(/b\.disabled = !live;/.test(CODE), 'the tools grey when nothing is typeable');
    assert.ok(/k === 'undo' \|\| k === 'redo'/.test(CODE),
      'but not the two that act on the draft stack');
    assert.ok(/\.rb-btn:disabled/.test(CODE), 'and a greyed tool looks greyed');
  });

  test('both languages carry the new control\'s words', () => {
    for (const k of ['ce_leave_work_mode']){
      assert.equal(I18N.split(new RegExp('\\b' + k + ':')).length - 1, 2,
        k + ' is in BOTH languages');
    }
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

/* ================================================ 11 — A SCAN THAT SAYS SO */
describe('f245 (11) — the playbook scan reports its own failure', () => {
  /* ---- OWNER-ASKED 26 Aug 2026: "you should be able to run the playbook scan
     by pressing the highlighted button" ----
     THE BUTTON WAS WIRED AND DID RUN — proved by pressing it on an ordinary
     contract in a real browser. What it could not do was FAIL OUT LOUD:
     runPlaybookReview answers null where there is no readable wording (an
     upload whose text never came out of the file, which is the commonest shape
     on this screen), toasts a red line that fades, and this panel then redrew
     the SAME "not been checked yet" sentence and the SAME button. Nothing on
     screen moved, which is exactly what a dead press looks like.

     THE RENEWAL CARD ANSWERED THIS SHAPE ALREADY, in its own words: a failure
     states itself where the reader is looking rather than relying on a toast
     that has already faded. */

  test('a scan that comes back with nothing is recorded, not swallowed', () => {
    assert.match(CODE, /else _ceScanErr = 'empty'/,
      'the one runner writes it down when no review arrives');
    assert.match(CODE, /if \(rev\) \{ _ceScan = rev; _ceScanErr = null; \}/,
      'and a review arriving clears it — the note is never stale');
    assert.match(CODE, /_ceScanBusy = true; _ceScanErr = null;/,
      'a fresh run clears it before it starts, so the old note cannot outlive it');
  });

  test('the panel prints it where the reader is looking', () => {
    assert.match(CODE, /function ceScanErrHtml\(\)/, 'it has one builder');
    assert.match(CODE, /ce_scan_nothing/, 'which names what happened');
    assert.match(CODE, /ce_scan_nothing_why/, 'and what to do about it');
    /* IT DOES NOT RE-DERIVE WHY. runPlaybookReview owns the reading of whether
       there is wording to check; a second copy of that test here is the
       twin-formula fault this codebase records. So the panel reports only what
       it can stand behind and names the usual cause as prose. */
    assert.ok(!/extractedText/.test(CODE),
      'the editor never re-reads the document to work out the reason itself');
  });

  test('the empty panel offers the run, and a failed one offers it again', () => {
    assert.match(CODE, /_cet\(_ceScanErr \? 'ce_scan_again' : 'ce_scan_run'\)/,
      'a refusal needs its way forward on the same screen');
  });

  test('both languages', () => {
    for (const k of ['ce_scan_nothing', 'ce_scan_nothing_why'])
      assert.equal((I18N.match(new RegExp(`^    ${k}:`, 'gm')) || []).length, 2, k);
  });
});

/* ============================== 12 — TWO LISTS, TWO VERBS, AND WHOSE WORDING */
describe('f245 (12) — a rule that is not about this clause cannot replace it', () => {
  /* ---- OWNER-REPORTED 26 Aug 2026, off Clause 2 of an equipment lease ----
     The scan rail on a LEASE CHARGES clause listed a DATA PROTECTION rule, and
     pressing its "Use our standard" struck out the whole lease-charge sentence
     and put a data protection paragraph in its place. Three faults stacked:

       1  the panel showed rules that matched NO clause inside whichever clause
          happened to be open — right intention, since a standard missing from
          the contract is worth knowing about while drafting;
       2  it then handed those rules the page's ONE verb, which replaces the
          clause you are looking at, when the honest answer to a missing
          standard is to ADD a clause; and
       3  the button labelled "Use our standard" served Copilot's improvisation
          rather than the workspace's approved wording — the workspace's own
          Kenyan Data Protection Act clause was on the quieter button beside it,
          while the "standard" cited GDPR.

     Every claim below is DRIVEN — the page is opened, the rail is drawn, the
     button is pressed — because "does the reading split" and "can this press
     still overwrite the clause" are different questions and only the second one
     is what was reported. */

  async function scanBench(){
    /* The clause library has to be REAL here: with playbook.js absent there is
       no approved wording at all, every card falls back to Copilot's draft, and
       a check written on that stage would pass against the broken code. */
    const w = buildWorld({ negotiationView: true, contractView: true, playbook: true });
    const { win } = w;
    win.promptDialog = async () => '';
    win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
    win.copilotAvailable = () => false;
    const c = supplyContract();
    win.negoInit(c);
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    Object.defineProperty(win, 'innerWidth', { value: 1440, configurable: true });
    const cls = win.negoClauseList(c);
    const here = cls[0], other = cls[1];
    /* The reported shape: one rule that quotes THIS clause, one that is missing
       from the whole contract, and one that belongs to a DIFFERENT clause. */
    c.playbook = { key: 'x', label: 'test', source: 'ai', verdicts: [
      { category: 'Payment terms', status: 'deviation', quote: here.text.slice(0, 60),
        position: 'Payment due within 30 days',
        redline: 'The Buyer shall pay within thirty (30) days of the invoice date.', escalate: false },
      { category: 'Data protection', status: 'missing', quote: '',
        position: 'Data protection clause preferred where personal data is involved',
        redline: 'Insert a data protection clause addressing GDPR obligations.', escalate: false },
      { category: 'Liability cap', status: 'deviation', quote: other.text.slice(0, 60),
        position: 'At least 12 months of fees', redline: '', escalate: true },
    ] };
    win.rlOpenClauseEditor(c, here.clauseId, {});
    const doc = win.document;
    doc.querySelector('[data-ce-tab="scan"]').click();
    const lane = () => doc.querySelector('.ce-lane') || doc.querySelector('#ce-lane');
    return { w, win, c, doc, here, other, lane };
  }

  test('the reading splits: this clause, the homeless ones, and nobody else', async () => {
    const p = await scanBench();
    const g = p.win.ceScanGroups();
    /* Compared as strings: the world runs in a vm, so an array built inside it
       carries that realm's prototype and deepStrictEqual fails on two lists
       whose contents are identical. */
    const names = list => list.map(i => i.v.category).join('|');
    assert.equal(names(g.here), 'Payment terms',
      'a rule whose quote located THIS clause is answerable here');
    assert.equal(names(g.missing), 'Data protection',
      'a rule that located no clause at all is the reader\'s business while drafting');
    /* A rule about ANOTHER clause belongs on that clause's own page and is in
       neither list — it was never drawn here and must not start being. */
    const all = names(p.win.ceScanItems());
    assert.ok(!/Liability cap/.test(all), 'a rule about another clause is in neither list');
    assert.equal(all, 'Payment terms|Data protection',
      'and the flat list the press handler indexes is here-then-missing');
  });

  test('the missing group offers ADD, and cannot reach the replace verb at all', async () => {
    const p = await scanBench();
    const html = p.lane().innerHTML;
    const cards = [...p.doc.querySelectorAll('.ce-rule')];
    const missCard = cards.find(el => /Data protection/.test(el.textContent));
    assert.ok(missCard, 'the missing rule draws a card');
    const verbs = [...missCard.querySelectorAll('[data-ce-scan]')].map(b => b.textContent.trim());
    assert.ok(verbs.length, 'and it offers something to press');
    for (const v of verbs)
      assert.ok(/^Add /.test(v), `every verb on a missing rule adds a clause, got "${v}"`);
    /* THE REPORTED PRESS, BY NAME. Nothing on that card may say "Use". */
    assert.ok(!verbs.some(v => /^Use /.test(v)),
      'nothing on a missing rule offers to replace the clause the reader is in');
    assert.match(html, /Missing from the contract/, 'the group says what it is');
    assert.match(html, /never replace the clause you are in/,
      'and the heading carries the promise of what a press inside it does');
  });

  test('a missing rule prints its wording plainly — it never marks up this clause', async () => {
    const p = await scanBench();
    const cards = [...p.doc.querySelectorAll('.ce-rule')];
    const missCard = cards.find(el => /Data protection/.test(el.textContent));
    const pv = missCard.querySelector('.pv');
    assert.ok(pv, 'it still shows the wording it would add');
    /* THE VISUAL LIE AT THE HEART OF THE REPORT: the card used to draw a
       redline FROM the open clause TO the standard, so the screenshot showed
       the lease-charge sentence struck through. A rule with no clause has
       nothing here to mark up. */
    assert.equal(pv.querySelectorAll('del').length, 0, 'nothing of this clause is struck through');
    assert.equal(pv.querySelectorAll('ins').length, 0, 'and nothing is marked as inserted into it');
    /* while a rule that DID locate this clause still draws the marks, because
       there its redline is true. */
    const hereCard = cards.find(el => /Payment terms/.test(el.textContent));
    assert.ok(hereCard.querySelector('.pv del'), 'a located rule still shows a real redline');
  });

  test('pressing Add files a new clause and leaves the open clause alone', async () => {
    const p = await scanBench();
    const before = p.win.negoChanges(p.c).length;
    const wordingBefore = String((p.win.negoClauseNowById(p.c, p.here.clauseId) || {}).text || '');
    const btn = [...p.doc.querySelectorAll('[data-ce-scan]')]
      .find(b => /^Add our standard$/.test(b.textContent.trim()));
    assert.ok(btn, 'the workspace\'s own wording is what the primary add offers');
    btn.click();
    await new Promise(r => setTimeout(r, 30));
    const chs = p.win.negoChanges(p.c);
    assert.equal(chs.length, before + 1, 'exactly one change filed');
    const ch = chs[chs.length - 1];
    assert.equal(ch.changeType, 'insertClause', 'a missing standard is ADDED, never swapped in');
    assert.equal(ch.status, 'pending', 'and it is a proposal like any other');
    assert.match(String(ch.note || ''), /^Playbook — /, 'carrying the position it enforces');
    assert.equal(String((p.win.negoClauseNowById(p.c, p.here.clauseId) || {}).text || ''),
      wordingBefore, 'the clause the reader had open is untouched');
    assert.match(p.lane().innerHTML, /Added as a new clause/,
      'and the card settles rather than offering the same press again');
  });

  test('"our standard" is the workspace\'s, and Copilot\'s draft says whose it is', async () => {
    const p = await scanBench();
    const it = p.win.ceScanItems().find(x => x.v.category === 'Data protection');
    /* The reported case, in one assertion: the approved Kenyan clause is what
       "our standard" serves; the model's GDPR sentence is a DRAFT and is
       labelled as one. */
    assert.match(it.preferred, /Data Protection Act, 2019/,
      'the preferred wording is the clause library\'s own');
    assert.ok(!/GDPR/.test(it.preferred), 'never the model\'s improvisation');
    assert.match(it.draft, /GDPR/, 'the model\'s wording is kept — under its own name');
    assert.equal(it.leadKind, 'standard', 'and the approved one is what the card previews');
    const html = p.lane().innerHTML;
    assert.match(html, /Add Copilot&#39;s draft|Add Copilot's draft/,
      'the draft is offered, and the button says whose wording it is');
  });

  test('the verdict line is plain text — the separator is not printed as an entity', async () => {
    const p = await scanBench();
    const cards = [...p.doc.querySelectorAll('.ce-rule')];
    const missCard = cards.find(el => /Data protection/.test(el.textContent));
    const line = missCard.querySelector('.l').textContent;
    /* pbVerdictLine returns MARKUP. This rail stripped its tags and escaped the
       result — and stripping tags leaves an ENTITY behind, so the ampersand was
       escaped a second time and "&middot;" arrived on screen as five visible
       characters. */
    assert.ok(!/&middot;|&amp;/.test(line), `the line prints no raw entity, got "${line}"`);
    assert.match(line, /Not in this document · Our standard is/,
      'it reads as one sentence with a real separator');
  });

  test('both languages', () => {
    for (const k of ['ce_scan_here', 'ce_scan_missing', 'ce_scan_missing_sub',
                     'ce_use_draft', 'ce_add_standard', 'ce_add_fallback', 'ce_add_draft',
                     'ce_scan_added', 'ce_scan_added_row', 'ce_scan_add_failed',
                     'ce_scan_add_unavailable', 'pb_w_ours', 'pb_w_fallback', 'pb_w_draft'])
      assert.equal((I18N.match(new RegExp(`^    ${k}:`, 'gm')) || []).length, 2, k);
  });
});

/* ================================= 13 — WHAT A PRESS COSTS (owner-asked C) */
describe('f245 (13) — the card says what the press takes', () => {
  /* ---- OWNER-ASKED 26 Aug 2026, off a drawn render and ruled before it was
     built. The marks alone do not say how much of the clause is going: a
     playbook standard striking out every word you have reads, at a glance,
     exactly like a change of three. ONE QUIET LINE, in the label shade —
     amber on every total swap would be an alarm that is always on, and
     replacing a whole clause is often exactly right. ---- */

  async function costBench(){
    const w = buildWorld({ negotiationView: true, contractView: true, playbook: true });
    const { win } = w;
    win.promptDialog = async () => '';
    win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
    win.copilotAvailable = () => false;
    const c = supplyContract();
    win.negoInit(c);
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    Object.defineProperty(win, 'innerWidth', { value: 1440, configurable: true });
    const here = win.negoClauseList(c)[0];
    /* A deviation on THIS clause whose Copilot draft is surgical — the two
       wordings then cost different amounts, which is the whole point. */
    c.playbook = { key: 'x', label: 't', source: 'ai', verdicts: [
      { category: 'Payment terms', status: 'deviation', quote: here.text.slice(0, 50),
        position: 'Payment due within 30 days',
        redline: here.text.replace('twelve (12) months', 'twenty-four (24) months'), escalate: false },
      { category: 'Data protection', status: 'missing', quote: '',
        position: 'DP preferred', redline: '', escalate: false },
    ] };
    win.rlOpenClauseEditor(c, here.clauseId, {});
    const doc = win.document;
    doc.querySelector('[data-ce-tab="scan"]').click();
    return { win, c, doc, here };
  }

  test('it reads three ways, and says nothing where there is nothing to say', async () => {
    const p = await costBench();
    const { win } = p;
    assert.match(win.ceCostLine('one two three four', 'alpha beta gamma delta'), /all 4 words/,
      'everything goes');
    assert.match(win.ceCostLine('one two three four', 'one two three zebra'), /1 of 4 words.*keeps 3/,
      'some of it goes, and it says what survives');
    assert.match(win.ceCostLine('one two three', 'one two three four five'), /Adds 2 words/,
      'nothing of the reader\'s wording is at risk, so it says what arrives');
    /* A line reading "changes 0 of 16" is worse than no line. */
    assert.equal(win.ceCostLine('same words here', 'same words here'), null, 'no change, no line');
    assert.equal(win.ceCostLine('', 'anything'), null, 'nothing to compare, no line');
  });

  test('it counts with the page\'s own counter, never a second one', () => {
    /* redlineStats counts WORDS and is what the foot's +N -N already prints,
       so the line and the header can never disagree about what a word is. */
    assert.match(CODE, /function ceCostLine[\s\S]{0,400}ceCounts\(/,
      'the reading asks ceCounts, which is redlineStats');
    assert.ok(!/function ceCostLine[\s\S]{0,600}split\(\/\\s\+\/\)[\s\S]{0,40}length[\s\S]{0,80}ins/.test(CODE),
      'and it does not count the marks itself');
  });

  test('it draws on a rule about THIS clause and not on one that adds a clause', async () => {
    const p = await costBench();
    const cards = [...p.doc.querySelectorAll('.ce-rule')];
    const here = cards.find(el => /Payment terms/.test(el.textContent));
    const miss = cards.find(el => /Data protection/.test(el.textContent));
    assert.ok(here.querySelector('.cost'), 'the located rule says what it takes');
    assert.match(here.querySelector('.cost').textContent, /Replaces all \d+ words/);
    /* A rule in the missing group replaces nothing — it files a NEW clause — so
       a line about what it takes away would describe an act that never happens. */
    assert.equal(miss.querySelector('.cost'), null, 'and a rule that adds one says nothing about taking');
  });

  test('each verb carries its OWN cost, so two wordings can be compared unpressed', async () => {
    const p = await costBench();
    const card = [...p.doc.querySelectorAll('.ce-rule')].find(el => /Payment terms/.test(el.textContent));
    const titles = {};
    for (const b of card.querySelectorAll('[data-ce-scan]'))
      titles[b.textContent.trim()] = b.getAttribute('title');
    assert.match(titles['Use our standard'] || '', /keeps none/,
      'the library\'s generic wording is a total swap and says so');
    assert.match(titles['Use Copilot\'s draft'] || '', /keeps \d+\./,
      'and the targeted draft keeps most of the clause');
    assert.notEqual(titles['Use our standard'], titles['Use Copilot\'s draft'],
      'two wordings that cost different amounts must not read alike');
  });

  test('it is drawn quiet — the label shade, never an alarm', () => {
    const rule = (SRC.match(/\.ce-rule \.cost\{[^}]*\}/) || [''])[0];
    assert.ok(rule, 'the line has a rule of its own');
    assert.match(rule, /--color-neutral-600/, 'the label shade');
    assert.ok(!/--st-amber|--st-ruby|--danger/.test(rule),
      'never amber or ruby: a total swap is often right, and an alarm always on is one nobody reads');
    assert.match(rule, /tabular-nums/, 'and the figures line up down a column');
  });

  test('both languages', () => {
    for (const k of ['ce_cost_all_one', 'ce_cost_all_other', 'ce_cost_some_one',
                     'ce_cost_some_other', 'ce_cost_add_one', 'ce_cost_add_other'])
      assert.equal((I18N.match(new RegExp(`^    ${k}:`, 'gm')) || []).length, 2, k);
  });
});

/* ============================================================
   f245 (14) — WHAT COPILOT IS TOLD IS ABOUT THIS CLAUSE
   ============================================================
   Owner-asked 26 Aug 2026, after the commentary bug. cePlaybookLine read EVERY
   deviation on the whole contract and handed the categories to the model while
   the reader was editing ONE clause — which is why, on Clause 2, it had a
   Clause 5 concern in front of it, noticed the mismatch, and wrote that
   observation where the wording goes. The model was right; the product had
   handed it a confusing question.

   The other two facts on that list were already clause-scoped, so this was the
   odd one out rather than a new rule. */
describe('f245 (14) — the playbook line is about the clause in front of you', () => {
  async function twoClauseBench(){
    const w = buildWorld({ negotiationView: true, contractView: true, playbook: true });
    const { win } = w;
    win.promptDialog = async () => '';
    win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
    win.copilotAvailable = () => false;
    const c = supplyContract();
    win.negoInit(c);
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    Object.defineProperty(win, 'innerWidth', { value: 1440, configurable: true });
    const list = win.negoClauseList(c);
    const here = list[0], elsewhere = list[1];
    /* ONE deviation on each of two different clauses. The quotes are verbatim,
       so the matcher's containment path places both with certainty and this
       test is about the FILTER rather than about how well the matcher guesses. */
    c.playbook = { key: 'x', label: 't', source: 'ai', verdicts: [
      { category: 'Payment terms', status: 'deviation', quote: here.text.slice(0, 60),
        position: 'Payment due within 30 days', redline: '', escalate: false },
      { category: 'Limitation of liability', status: 'deviation', quote: elsewhere.text.slice(0, 60),
        position: 'Cap at 12 months of fees', redline: '', escalate: false },
    ] };
    return { win, c, here, elsewhere };
  }

  test('THE FIX: on one clause it names that clause\'s flag and not the other\'s', async () => {
    const p = await twoClauseBench();
    p.win.rlOpenClauseEditor(p.c, p.here.clauseId, {});
    const line = p.win.cePlaybookLine();
    assert.match(line, /Payment terms/, 'the flag that is about this clause');
    assert.ok(!/Limitation of liability/.test(line),
      'and NOT the one about another clause — this is the whole defect, and it '
      + 'is what put a Clause 5 concern in front of a model editing Clause 2');
  });

  test('and it mirrors on the other clause, so it is a filter and not an order', async () => {
    const p = await twoClauseBench();
    p.win.rlOpenClauseEditor(p.c, p.elsewhere.clauseId, {});
    const line = p.win.cePlaybookLine();
    assert.match(line, /Limitation of liability/);
    assert.ok(!/Payment terms/.test(line),
      'a filter that only ever kept the first verdict would pass the test above');
  });

  test('a clause with nothing flagged says nothing at all', async () => {
    const p = await twoClauseBench();
    const third = p.win.negoClauseList(p.c)[2];
    p.win.rlOpenClauseEditor(p.c, third.clauseId, {});
    assert.equal(p.win.cePlaybookLine(), '',
      'an empty line, not a list of somebody else\'s problems');
  });

  test('a deviation the matcher cannot place is left out, never attributed here', async () => {
    const p = await twoClauseBench();
    p.c.playbook.verdicts = [{ category: 'Governing law', status: 'deviation',
      quote: 'wording that appears nowhere in this agreement at all',
      position: 'Kenyan law', redline: '', escalate: false }];
    p.win.rlOpenClauseEditor(p.c, p.here.clauseId, {});
    assert.equal(p.win.cePlaybookLine(), '',
      'the matcher refuses when unsure, and an unplaced rule pinned to whichever '
      + 'clause happens to be open is the reported fault in quieter clothes');
  });

  test('it asks the ONE matcher rather than carrying a second copy', () => {
    const m = CODE.match(/function ceClauseDeviations\(\)[\s\S]{0,700}?\n\}/);
    assert.ok(m, 'the reading has a name');
    assert.match(m[0], /rlPbFindClause\(/,
      'the rail locates its findings the same way — two copies of "which clause '
      + 'is this rule about" is how the two come to disagree');
    assert.ok(!/_rlPbNorm|indexOf|includes\(/.test(m[0]),
      'and it does not re-derive the match itself');
  });

  test('the sentence no longer says "this contract", in both languages', () => {
    assert.match(I18N, /ce_pb_flags: 'Our playbook flags this clause for/);
    assert.match(I18N, /ce_read_playbook_none: 'Nothing flagged on this clause\./);
    assert.ok(!/ce_pb_flags: 'Our playbook flags this contract/.test(I18N),
      'a narrowed reading under a sentence that still claims the whole contract '
      + 'would be a screen telling the model something untrue');
    for (const k of ['ce_pb_flags', 'ce_read_playbook_none'])
      assert.equal((I18N.match(new RegExp(`^    ${k}:`, 'gm')) || []).length, 2, k);
  });
});

/* ============================================================
   f245 (11) — A CLAUSE YOU PROPOSED OPENS HERE TOO
   ============================================================
   Owner-reported 26 Aug 2026: "when I click on edit with copilot for standard
   company clauses added to the contract i get the error on the bottom right. I
   should be able to edit even standard company clauses."

   The error was "That clause is no longer in the document" — a sentence that is
   not even true of it. A clause added from the library or the playbook is an
   ASK, so negoClauseNowById answers null and this page turned the reader away.
   The clause PANEL closed the same gap on 25 Aug and this page was not brought
   along; the duplication warning in its usual direction.
   ============================================================ */
async function withProposed(){
  const p = await bench(); wide(p.win);
  const list = p.win.negoClauseList(p.c);
  const ch = await p.win.negoInsertClause(p.c, list[list.length - 1].clauseId,
    { headingText: 'Liability Cap',
      bodyHtml: '<p>Aggregate liability is capped at the fees paid in the preceding twelve months.</p>' },
    { side: 'owner', author: 'You' });
  return { ...p, ch };
}

describe('f245 (11) — the editor opens on a clause that is only proposed', () => {
  test('THE REPORTED CASE: the page opens instead of refusing', async () => {
    const p = await withProposed();
    assert.ok(p.ch && p.ch.clauseId, 'the fixture really did propose a clause');
    assert.equal(p.win.negoClauseNowById(p.c, p.ch.clauseId), null,
      'and it is genuinely NOT in the agreement — otherwise this proves nothing');
    assert.ok(p.win.rlOpenClauseEditor(p.c, p.ch.clauseId, {}),
      'the page refused a clause the reader had just added');
    p.win.rlCloseClauseEditor();
  });

  test('it opens on the PROPOSED wording, which is what the reader is changing', async () => {
    const p = await withProposed();
    p.win.rlOpenClauseEditor(p.c, p.ch.clauseId, {});
    const shown = p.doc.querySelector('#ce-clausebody').textContent;
    assert.match(shown, /capped at the fees paid/,
      'the ask supplies the clause: its own heading and its own wording');
    p.win.rlCloseClauseEditor();
  });

  test('filing FOLDS INTO THE SAME ASK rather than stacking a rival', async () => {
    /* The whole reason it routes through negoReviseInsert. A second ask on one
       clause is the state "one proposal on the table" exists to prevent. */
    const p = await withProposed();
    const before = p.c.changes.filter(x => x.clauseId === p.ch.clauseId).length;
    p.win.rlOpenClauseEditor(p.c, p.ch.clauseId, {});
    p.win.ceApply('Aggregate liability is capped at the fees paid in the preceding six months.', 'x');
    await p.win.ceFile('Tightened the cap.');
    const mine = p.c.changes.filter(x => x.clauseId === p.ch.clauseId
      && x.status === 'pending' && !x.withdrawn);
    assert.equal(mine.length, 1, `expected one live ask, got ${mine.length}`);
    assert.equal(before, 1, 'and there was one before, so nothing was stacked');
    assert.equal(mine[0].changeType, 'insertClause',
      'it is still a proposed clause, not a modification of one');
    assert.match(String(mine[0].newText || ''), /preceding six months/,
      'and it carries the revised wording');
  });

  test('the heading is untouched — this page writes wording, never the label', async () => {
    const p = await withProposed();
    p.win.rlOpenClauseEditor(p.c, p.ch.clauseId, {});
    p.win.ceApply('Something shorter.', 'x');
    await p.win.ceFile('');
    const mine = p.c.changes.find(x => x.clauseId === p.ch.clauseId
      && x.status === 'pending' && !x.withdrawn);
    assert.equal(String(mine.headingText || ''), 'Liability Cap',
      'an absent headingText means "leave it as it is", never "clear it"');
  });

  test('THEIR proposal is answered, not rewritten — and a settled one is a record', async () => {
    /* The panel's own three bounds, kept: ours, and only while it is live. */
    const p = await bench(); wide(p.win);
    const list = p.win.negoClauseList(p.c);
    const theirs = await p.win.negoInsertClause(p.c, list[list.length - 1].clauseId,
      { headingText: 'Their Clause', bodyHtml: '<p>Their wording.</p>' },
      { side: 'counterparty', author: 'Amina Wanjiru' });
    assert.equal(p.win.rlOpenClauseEditor(p.c, theirs.clauseId, {}), false,
      'their proposal is answered on the card, never edited here');

    const mine = await p.win.negoInsertClause(p.c, list[list.length - 1].clauseId,
      { headingText: 'Settled Clause', bodyHtml: '<p>Agreed wording.</p>' },
      { side: 'owner', author: 'You' });
    p.c.changes.find(x => x.id === mine.id).status = 'accepted';
    assert.equal(p.win.rlOpenClauseEditor(p.c, mine.clauseId, {}), false,
      'a settled ask is a record');
  });

  test('a clause id that is genuinely nowhere still refuses, in the same words', async () => {
    const p = await bench(); wide(p.win);
    assert.equal(p.win.rlOpenClauseEditor(p.c, 'cl_nothere', {}), false);
  });
});

/* ============================================================
   f245 (12) — THE DIVIDER
   ============================================================
   Owner-asked 26 Aug 2026, wanting the negotiation page's draggable divider
   here — "I want the limitation (how far you can drag) in dragging right to
   left to be identical" — and saying plainly that a previous attempt at this
   page's layout broke it.

   It did: a strip written across the top of the grid pushed the Copilot rail
   172px down the window, and it took more than one go to correct. So the claims
   below are as much about what the divider MUST NOT DO as about what it does,
   and 2d1-2d3 above are the net that catches the old break.
   ============================================================ */
describe('f245 (12) — the divider, and what it must not disturb', () => {
  const CE = SRC;
  const NCSS = read('js/views/negotiation-css.js');

  test('THE LEFT-HAND LIMIT IS THE NEGOTIATION PAGE\'S, to the number', () => {
    /* Owner-asked in those words. Pinned as a RELATION across the two files
       rather than as a number typed twice: neither constant is published, so
       this reads both sources and fails if one moves without the other. */
    const mine = CE.match(/const CE_FMIN = ([\d.]+)/)[1];
    const theirs = NEGO.match(/const RL_FMIN = ([\d.]+)/)[1];
    assert.equal(mine, theirs,
      `the leftward stop must match the negotiation page's — ${mine} against ${theirs}`);
    const myPx = CE.match(/const CE_LEFT_MIN = (\d+)/)[1];
    const theirPx = NEGO.match(/RL_LEFT_MIN = (\d+)/)[1];
    assert.equal(myPx, theirPx,
      `and so must the pixel floor under it — ${myPx} against ${theirPx}`);
  });

  test('the OTHER direction is this page\'s own, and it is the rail\'s floor', () => {
    /* Said out loud rather than quietly matched: the negotiation page lets its
       right column go to 300 and this rail is built to 340 — it holds a chat
       box, the chips and two buttons. */
    const mine = Number(CE.match(/CE_RIGHT_MIN = (\d+)/)[1]);
    assert.equal(mine, 340, "the rail's own floor");
    assert.match(CE, /minmax\(340px,1fr\)/,
      'and the CSS fallback agrees with it, or the two disagree before JS runs');
  });

  test('the limits BITE, in both directions, at every laptop width', async () => {
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    const L = p.win.ceSplitLeft;
    for (const w of [1280, 1440, 1920, 2560]){
      assert.equal(L(w, 0), Math.round(0.45 * w),
        `dragged hard left at ${w} the contract stops at 45%`);
      assert.ok(w - L(w, 1) >= 340,
        `dragged hard right at ${w} the rail keeps 340px, got ${w - L(w, 1)}`);
      /* And at rest it is the one third the owner asked for and 2d1 pins. */
      assert.ok(Math.abs((w - L(w)) / w - 1 / 3) < 0.02,
        `at rest the rail is a third, got ${((w - L(w)) / w).toFixed(3)} at ${w}`);
    }
    p.win.rlCloseClauseEditor();
  });

  test('IT SAYS WHEN IT WILL NOT GO FURTHER — at BOTH stops, not just the pixel one', async () => {
    /* Found by dragging it in a real browser. Read off the pixel floors alone
       the grip stayed grey at the 45% stop, because on a wide window the
       FRACTION binds and the pixel floor is nowhere near — so the divider
       stopped and said nothing, which is the one thing a splitter at its limit
       must not do. Both stops come out of the ONE clamp now, so the mark and
       the position cannot disagree about where the end is. */
    const p = await bench(); wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    const S = p.win.ceSplit;
    assert.equal(S(1500).limit, null, 'at rest it is not at a limit');
    assert.equal(S(1500, 0).limit, 'min', 'the FRACTION stop is marked on a wide window');
    assert.equal(S(1500, 1).limit, 'max');
    /* And on a window narrow enough for the pixel floors to bite first. */
    assert.equal(S(800, 0).limit, 'min');
    assert.equal(S(800, 0).left, 380, 'the pixel floor, not the fraction');
    assert.equal(S(800, 1).limit, 'max');
    assert.equal(S(800, 1).left, 800 - 340);
    p.win.rlCloseClauseEditor();
  });

  test('the handle CLAIMS NO TRACK — this is the break that must not come back', () => {
    /* A third grid child laid out in flow, or any strip spanning both columns,
       pushes the rail down by its own height and looks perfectly correct in the
       source. Absolute, inside the grid, and the grid stays two columns. */
    assert.match(CE, /\.ce-grid\{[^}]*position:relative/,
      'the grid is the positioned ancestor, so the handle moves with it');
    assert.match(CE, /grid-template-columns:minmax\(0,2fr\) minmax\(340px,1fr\)/,
      'still exactly two columns');
    assert.match(CE, /gridTemplateColumns = left \+ 'px minmax\(0,1fr\)'/,
      'and the drag writes two, never three');
    assert.ok(!/grid-template-rows:minmax\(0,1fr\) [^;}]/.test(CE),
      'and never a second row');
  });

  test('it wears the negotiation page\'s OWN dressing, shared not copied', () => {
    assert.match(CE, /id="ce-resizer" class="rl-resizer"/,
      'the same class, so one rule dresses both');
    assert.match(NCSS, /(^|\n)\s*\.rl-resizer\{/,
      'and that rule is unscoped — scoped, this page draws an unstyled strip');
    assert.ok(!/\.redline-page \.rl-resizer\{position:absolute/.test(NCSS),
      'the scoped rule was REPLACED, not joined — no cascade fight left to lose');
  });

  test('STACKED, the inline columns are CLEARED — this page\'s rule has no !important', () => {
    /* The negotiation page forces its stack with !important; this one does not,
       so an inline column written on a wide window and left behind would beat
       the media query and crush the stacked layout. */
    assert.match(CE, /max-width:1023px\)/, 'the stack point is the stylesheet\'s own');
    const fit = CE.match(/function ceFitSplit[\s\S]*?\n}/)[0];
    assert.match(fit, /if \(ceStacked\(\)[^)]*\)\{[\s\S]{0,320}gridTemplateColumns = ''/,
      'ceFitSplit clears them before it does anything else');
    assert.match(CE, /\.ce-grid > \.rl-resizer\{display:none\}/,
      'and the handle is not drawn across a stacked page');
  });

  test('an UNMEASURED grid is not measured, and a zero is not a width', () => {
    const fit = CE.match(/function ceFitSplit[\s\S]*?\n}/)[0];
    assert.match(fit, /avail < 160\) return/,
      'writing 0px would collapse a layout the CSS is holding perfectly well');
  });

  test('ONE geometry, asked for by both halves', () => {
    /* When the layout and the drag described the page differently, one pixel of
       pointer bought less than one pixel of column. And the gap: this grid has
       none, so subtracting one would put the handle 14px off the seam. */
    assert.equal((CE.match(/_ceAvail\(/g) || []).length, 2,
      'the layout and the drag both ask the same function, and nothing else does');
    assert.match(CE, /const _ceAvail = grid => grid\.clientWidth;/,
      'no gap subtracted — this grid has no gap track');
  });

  test('the drag reads WHERE THE POINTER IS, never how far it has come', () => {
    const wire = CE.match(/function ceWireSplit[\s\S]*?\n}\n/)[0];
    assert.match(wire, /pointerFrac = x =>[\s\S]{0,220}getBoundingClientRect/,
      'position, not travel — travel leaves a dead band at the limits');
    assert.match(wire, /grabDx = \(hb\.left \+ hb\.width \/ 2\) - e\.clientX/,
      'and the grab offset keeps the boundary under the cursor');
    assert.match(wire, /ResizeObserver/, 'the grid is observed, not guessed at');
    assert.match(wire, /dataset\.ceSplitBound/, 'bound once per element');
  });

  test('its own memory, so the two dividers cannot move each other', () => {
    assert.match(CE, /CE_SPLIT_KEY = 'hati\.v1\.ceLeftFrac'/);
    assert.ok(!/rlLeftFrac/.test(CE),
      "the negotiation page's key is a different question about a different page");
  });

  test('a separator nobody can reach is a control half this workspace lacks', () => {
    assert.match(CE, /role="separator" aria-orientation="vertical"/);
    assert.match(CE, /tabindex="0"/);
    const wire = CE.match(/function ceWireSplit[\s\S]*?\n}\n/)[0];
    assert.match(wire, /ArrowLeft/, 'the arrows move it');
    assert.match(wire, /dblclick/, 'and a double-click puts it back');
  });
});

/* ============================================================
   f245 (15) — the clause you are typing in is still the paper
   ============================================================
   Owner-reported 26 Aug 2026, off the page itself: "you click on the edit
   symbol and then a window of the clause opens up to be like a search field. I
   want when you click on edit the field to not change color and just have a
   very light almost dotted line around the clause you want to edit. It should
   not look out of place." Option A of a drawn render.

   IT REALLY DID LOOK LIKE A SEARCH FIELD, and not by coincidence: a pure white
   fill with a solid 2px accent ring is precisely how this product draws a form
   input, so the reader was shown one, dropped onto a cream contract. Two marks
   for one fact, and the louder of the two was the one that did not belong.

   And the same message asked for the space back: "the name of number of the
   edit plus the something of my own are taking up space from the contract.
   They would maybe go on the far right of the contract tab changes and give
   space back to the contract." The chips moved onto the readings row, into
   space that row already had; "+ Something of my own" was removed outright on
   the owner's ruling in the reply that chose the render.

   The claims below are written as RELATIONS wherever a look is involved — the
   line's colour against the document's own ink, the chips' home against the
   row that draws it — so the next type or palette pass costs no edit here.
   What a browser has to answer (does the paper show through, did the contract
   really move up) is in clause-editor-verify; this file holds the rules.
   ============================================================ */
describe('f245 (15) — the editing state is a hairline, and the strip is gone', () => {
  const CE = SRC;
  const TYPING = CE.match(/\.ce-paperwrap \.ce-typing\{[\s\S]*?\}/)[0];
  const FOCUS = CE.match(/\.ce-paperwrap \.ce-typing:focus\{[\s\S]*?\}/)[0];

  test('THE REPORTED CASE: no fill and no ring — the paper shows through', () => {
    assert.match(TYPING, /background:transparent/,
      'the white fill is what made it read as a search box');
    assert.match(TYPING, /box-shadow:none/,
      'and the solid 2px accent ring is the other half of that costume');
    assert.ok(!/box-shadow:0 0 0 2px/.test(TYPING),
      'the ring may not survive in any strength — it is the mark being removed');
    assert.ok(!/var\(--color-surface\)/.test(TYPING),
      'a surface fill on a document is a form field wherever it is drawn');
  });

  test('what is left is a DASHED HAIRLINE set clear of the words', () => {
    assert.match(TYPING, /outline:1px dashed/,
      '"a very light almost dotted line", in the owner\'s own words');
    assert.match(TYPING, /outline-offset:4px/,
      'set clear of the wording so it frames it rather than touching it');
    assert.ok(!/border:/.test(TYPING),
      'an OUTLINE takes no space, so nothing on the page moves when it appears — '
      + 'a border would reflow the clause under the reader');
  });

  test('the colour is MIXED off the document ink, never a typed grey', () => {
    /* The one thing that makes a single declaration right in both themes. The
       sheet is cream by day and near-black at night, so a fixed light grey
       that reads as a whisper on the cream is invisible on the other. Pinned
       as the relation — which token it is mixed from — and not as a value. */
    assert.match(TYPING, /color-mix\(in srgb, var\(--color-doc-text\)[^)]*, transparent\)/,
      'the line follows the ink the paper is already printed in');
    assert.ok(!/#[0-9a-fA-F]{3,8}/.test(TYPING),
      'no hex here: a literal would need a dark override, and the override is '
      + 'the half that gets forgotten');
    /* And the token really does answer differently at night, or the mix is
       one declaration serving one theme. */
    const root = read('index.html');
    assert.ok(/--color-doc-text:/.test(root), 'the ink is a token');
    assert.ok(/html\.dark[\s\S]{0,4000}--color-doc-text:/.test(root),
      'and dark redefines it — otherwise mixing off it buys nothing');
  });

  test('focus does not bring the old ring back', () => {
    /* A rule that holds until the reader clicks into the box is no rule: the
       one moment this state is ever seen is while somebody is typing in it. */
    assert.match(FOCUS, /outline:1px dashed/, 'the same line, still dashed');
    assert.match(FOCUS, /box-shadow:none/, 'and still no ring');
    assert.ok(!/var\(--accent-solid\)/.test(FOCUS),
      'the accent belongs to the margin bar on this page, not to the text box');
  });

  test('THE MARGIN BAR IS UNTOUCHED — the one signal still at full strength', () => {
    /* Said out loud because taking the fill down without checking this would
       have left the page saying nothing at all about which clause is live. */
    const bar = CE.match(/\.ce-paperwrap \.rl-clause-live::before\{[\s\S]*?\}/)[0];
    assert.match(bar, /background:var\(--accent-solid\)/,
      'the teal bar still says WHICH clause is live');
    assert.match(bar, /width:3px/, 'at the weight it has always had');
  });

  test('THE STRIP IS GONE, and nothing can draw one', () => {
    assert.ok(!/id="ce-ctx"/.test(CE), 'the full-width strip has left the markup');
    assert.ok(!/\.ce-ctx\{/.test(CE), 'and its rule went with it');
    assert.ok(!/#ce-ctx/.test(CE),
      'nothing anywhere still reaches for it — a fill into a missing element is '
      + 'silence, which is how this class of fault survives');
  });

  test('"+ Something of my own" is removed outright, and DISCARD is what it did', () => {
    /* Owner-ruled. Checked before it was deleted rather than after: the chip
       set the editor to speak for no particular ask, so the box opened on the
       clause as it stands — which is exactly one press of Discard. */
    assert.ok(!/ce_something_of_my_own/.test(CODE),
      'no reader left in the code');
    assert.ok(!/ce-chip-new/.test(CODE), 'and no class for it either');
    const discard = CE.match(/function ceDiscard[\s\S]*?\n}\n/)[0];
    assert.match(discard, /_ceText = _ceBase/,
      'the way back to the standing wording is still one press');
    /* And filing is unaffected either way: the funnel folds by side and round,
       never by which chip happens to be lit. */
    assert.ok(!/_ceLead/.test(CE.match(/async function ceFile[\s\S]*?\n}\n/)[0] || ''),
      'the file step never asked which chip was lit');
  });

  test('the chips are drawn by the READINGS row, and by that row alone', () => {
    const bar = CE.match(/function ceRenderReadBar[\s\S]*?\n}\n/)[0];
    assert.match(bar, /ceCtxChipsHtml\(\)/, 'the row that had the room draws them');
    assert.equal((CODE.match(/(?<!function )ceCtxChipsHtml\(\)/g) || []).length, 1,
      'exactly one caller — two would be the same chips in two places, '
      + 'disagreeing about which is lit');
    assert.match(CE, /\.ce-readbar \.ce-chip\{flex:none\}/,
      'and they are dressed where they now sit');
  });

  test('pressing a chip repaints that row, or the pressed one never lights', () => {
    const h = CODE.match(/data-ce-focus'\)[\s\S]{0,400}/)[0];
    assert.match(h, /ceRenderHead\(\)/, 'the head still follows');
    assert.match(h, /ceRenderReadBar\(\)/,
      'and so must the row the chips are on — this is the whole cost of moving them');
  });

  test('a clause with nothing on it draws no chips at all', async () => {
    /* Which is what keeps the readings row the height it has always been on
       the commonest screen of all: a clause nobody has touched. */
    const p = await bench({ ask: false });
    wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    assert.equal(p.doc.querySelectorAll('#ce-readbar .ce-chip').length, 0,
      'no chips on the row');
    /* And nothing stands in for them either. The strip used to fill its own
       40px with "Nothing has been proposed on this clause yet" — the fourth
       printing of a fact the crumb and two fact-row cells already carry. */
    const page = p.doc.querySelector('#clause-editor');
    assert.ok(page, 'the page is up');
    assert.ok(!/Nothing has been proposed/.test(page.textContent),
      'the retired empty-state sentence is drawn nowhere on the page');
    p.win.rlCloseClauseEditor();
  });

  test('and a clause that HAS an ask carries its chip on that row', async () => {
    const p = await bench();
    wide(p.win);
    const ch = p.c.changes.find(x => x.status === 'pending' && !x.withdrawn);
    assert.ok(ch, 'the fixture really did put an ask on the table');
    p.win.rlOpenClauseEditor(p.c, ch.clauseId, {});
    const chips = [...p.doc.querySelectorAll('#ce-readbar .ce-chip')];
    assert.equal(chips.length, 1, `expected one chip, got ${chips.length}`);
    assert.match(chips[0].textContent, /CHG-/, 'named by the change it speaks for');
    assert.equal(p.doc.querySelectorAll('#ce-ctx').length, 0,
      'and the strip above the paper is not there to draw it twice');
    p.win.rlCloseClauseEditor();
  });

  test('both languages — the three keys are inert, and still in both dictionaries', () => {
    /* Left rather than deleted, this file's own convention: a key removed from
       one dictionary and not the other is how a screen ends up half-English. */
    for (const k of ['ce_on_this_clause', 'ce_nothing_proposed_yet', 'ce_something_of_my_own']){
      assert.equal((I18N.match(new RegExp(`\\b${k}:`, 'g')) || []).length, 2,
        `${k} must survive in BOTH dictionaries or in neither`);
    }
    assert.match(I18N, /STALE SINCE 26 Aug 2026, left inert rather than deleted/,
      'and the reason is written where the next reader will find them');
  });
});
