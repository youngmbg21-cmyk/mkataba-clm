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
    /* REVERSED IN PLACE 29 Aug 2026, and the claim is unchanged: it pinned the
       shape of a call that has since moved into `openEditor`, the one reading
       of what a door onto that page means (see f245 (19)). What it is about —
       the press goes to the editor and STOPS there, rather than falling through
       to the old menu once a refusal has already said why — is stronger now: it
       is one unconditional return rather than two returns agreeing. */
    const m = NEGO.match(/data-rl-cp-editor'\)[\s\S]{0,260}/);
    assert.ok(m, 'the clause-AI handler asks for the marker');
    assert.ok(/openEditor\(clauseId\)/.test(m[0]),
      'and opens the editor with the clause it was pressed on');
    assert.ok(/openEditor\(clauseId\);\s*\n\s*return;/.test(m[0]),
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
    /* REVERSED IN PLACE 29 Aug 2026. It counted the CALL SITES and wanted two
       of them; there is ONE now, and that is the point rather than a loss —
       both doors (three, with the paper's pencil) reach it through `openEditor`,
       so what a press onto that page means is decided once. f245 (19) holds
       that claim; this one keeps its own, which is that neither door writes. */
    assert.ok(/data-rl-cp-editor="1"/.test(NEGO) && /data-rl-cp-editor-row=/.test(NEGO),
      'both doors exist');
    const doors = (NEGO.match(/rlOpenClauseEditor\(c,/g) || []).length;
    assert.equal(doors, 1, 'and they share one route in');
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

  /* ---- REVERSED IN PLACE, 30 Aug 2026 (owner-ruled: "stay on the page") ----
     This pinned "BACK WHERE YOU STARTED": filing closed the editor and reopened
     the clause panel on the same clause. That was right while filing was a
     once-per-visit act at the end of a clause, and wrong the moment the strip
     started filing — changing three sentences meant being thrown out and going
     back in twice, which breaks the two-press ceiling the owner set.

     WHAT IT WAS REALLY PINNING SURVIVES AND IS STRONGER: after a filing the
     reader is left looking at the record as it now stands, rather than at a
     stale page. It is simply the page they are already on. */
  test('filing keeps the page, and re-reads it from the record', () => {
    const file = CODE.match(/async function ceFile\([\s\S]*?\n\}/)[0];
    assert.ok(!/rlCloseClauseEditor\(/.test(file),
      'filing does not close the editor — leaving is its own button');
    assert.match(file, /ceSeedDraft\(ch\.id\)/,
      'the record has moved, so the draft is re-read from it — the same seeding '
      + 'the door uses, never a second copy');
    assert.match(file, /ceRenderAll\(\)/, 'and the page redraws in place');
    assert.match(file, /_ceAgain\(\)/,
      'the page underneath is repainted behind this one, because the column and '
      + 'the counts read a record that has just changed');
  });

  /* ---- REVERSED IN PLACE 31 Aug 2026 (M-1), AND THE RULING IS KEPT ----
     This asserted that the strip's SEND filed immediately (owner-asked 30 Aug:
     "press send and it is filed immediately") and that its delete button did
     the same, so the two could not disagree. The send is gone with the strip —
     a replacement is typed into the paper now and the one act in the rail's
     foot files it — but the CUT has no such twin: it is a single press with
     nothing to type, and dropping the filing would make it the one act on this
     page costing two presses instead of one. So the ruling survives on the
     control it still has, and the claim is that it is not a SECOND filing
     path. */
  test('ONE ACT: the cut files through the same ceFile the foot presses', () => {
    const cut = CODE.match(/function ceCutPassage\([\s\S]*?\n\}/)[0];
    assert.match(cut, /ceApply\(lines\.join\('\\n'\), _cet\('ce_step_cut'\), \{ keepView: true, repaint: true \}\)/,
      'the wording still goes through the one apply');
    assert.match(cut, /ceFile\(\);/,
      'and the press reaches the record in one — "press send and it is filed '
      + 'immediately", on the control that still has no typing beside it');
    assert.match(cut, /if \(!ceApply\([\s\S]{0,120}?\) return false;\n\s+ceFile\(\);/,
      'but only where something actually moved: a filing on a draft that already '
      + 'says it would be a revision proposing nothing');
    for (const door of ['negoEditClause', 'negoFileChange', 'persist('])
      assert.ok(!cut.includes(door),
        door + ' is not reachable from the cut — ceFile is the one act, so every '
        + 'guard the funnel carries applies without being repeated here');
  });

  test('READY FOR THE NEXT SENTENCE: a strip filing keeps the reader typing', () => {
    /* Without this the second sentence in a clause costs TWO presses — the
       pencil again, then send — which is the ceiling the owner set. The rule it
       narrows is untouched for what it was written about: wording that arrives
       from a Copilot card or a playbook standard still drops out of typing so
       the marks it made are the first thing seen. */
    const rep = CODE.match(/function ceReplacePassage\([\s\S]*?\n\}/)[0];
    assert.match(rep, /\{ keepView: true, repaint: true \}/,
      'keepView holds the reader in the wording; repaint is owed because the '
      + 'WORDS moved and the box would otherwise still show the sentence that '
      + 'has just gone');
    const apply = CODE.match(/function ceApply\([\s\S]*?\n\}/)[0];
    assert.match(apply, /if \(_ceEditing && !opts\.keepView\) _ceEditing = false;/,
      'and the two flags stay independent — one is about the caret, the other '
      + 'about the paper');
  });

  /* REVERSED IN PLACE 31 Aug 2026, and the claim is STRONGER for it. It pinned
     the literal `moved && clauseEditorDirty()`, which was the whole reading
     written out at its one call site; the pencil now files on exactly the same
     question (owner-ruled B), so the reading is NAMED — ceCanFile — and what
     this asserts is the RELATION the claim was always about: the foot asks that
     one reading, and it is the two questions joined. Pin the relation, not the
     expression. */
  test('the File button greys once the record has caught up', () => {
    const foot = CODE.match(/function ceRenderFoot\([\s\S]*?\n\}/)[0];
    assert.match(foot, /const anyToFile = ceCanFile\(\);/,
      'with the page staying open, a just-filed draft still differs from what '
      + 'STANDS — so File asks whether the record already holds it, or it would '
      + 'sit live over a press the funnel refuses as proposing nothing');
    const read = CODE.match(/const ceCanFile = [^\n]+/)[0];
    assert.match(read, /_ceText !== _ceBase \|\| _ceHead !== _ceHeadBase/,
      'and that one reading is the two questions joined: the wording has moved '
      + 'from what STANDS…');
    assert.match(read, /clauseEditorDirty\(\)/,
      '…and there is something the RECORD does not already hold');
    assert.match(foot, /\[discard, _cet\('ce_discard'\), moved\]/,
      'Discard keeps its own question — has the wording moved from what stands, '
      + 'because that is what it puts back');
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

/* REVERSED IN PLACE 31 Aug 2026 (M-1), owner-asked off three drawn options:
   "when I highlight the sentence, it appears in the Copilot screen on the right
   and I can then ask Copilot for what I want. This change then eliminates the
   pop-up strip." Then: "Build option A."

   WHAT THIS SECTION WAS REALLY ABOUT SURVIVES WHOLE and is what is still
   pinned: there is ONE field for the wording, ONE replacement reading shared by
   the hand and by Copilot, and nothing on this path files. What changed is
   WHERE the passage goes — the rail, not a box over the contract — and that the
   field beside it now takes the INSTRUCTION rather than the wording, because
   typing the wording is done in the contract itself. */
describe('f245 (16) — the highlighted passage goes to the rail, and it files nothing', () => {
  test('nothing opens over the paper, and the passage is on the rail', () => {
    assert.ok(!/class="ce-inline"/.test(CODE), 'the strip markup is gone');
    assert.ok(!/ceOpenInline|ceCloseInline|ceInlineGo|ceInlineApply|ceInlineFit/.test(CODE),
      'and its five functions with it — deleted, not left unreachable');
    assert.ok(/<div id="ce-scope"><\/div>/.test(CODE),
      'the rail carries the slot the passage lands in');
    /* IT IS BETWEEN THE CONVERSATION AND THE ASK BOX, which is the whole of why
       Option A was recommended: what is attached and what you are typing are
       read together, and it cannot scroll away. */
    assert.ok(CODE.indexOf('id="ce-lane"') < CODE.indexOf('id="ce-scope"')
      && CODE.indexOf('id="ce-scope"') < CODE.indexOf('id="ce-askrow"'),
      'and it sits under the conversation and over the ask box');
  });

  test('the card quotes the passage and offers the two acts on it', () => {
    const r = CODE.match(/function ceRenderScope\([\s\S]*?\n\}/);
    assert.ok(r, 'the scope has one painter');
    assert.match(r[0], /data-ce-act="scope-off"/, 'a way to let the passage go');
    assert.match(r[0], /data-ce-act="scope-cut"/,
      'and the strip\'s own delete verb, which had no other home in the product');
    assert.match(r[0], /box\.innerHTML = ''/, 'and it draws nothing when nothing is attached');
    /* THE ASK BOX STATES THE NARROWING BY BEING SET TO IT — the WHOSE ASKS
       rule, on a placeholder. */
    assert.match(r[0], /ask\.placeholder = _cet\(sel \? 'ce_ask_ph_passage' : 'ce_ask_ph'\)/,
      'and the box says what it is for');
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

  test('ONE ENTER ON THIS PAGE, and it is the rail\'s ask box', () => {
    /* The strip had an Enter of its own that applied wording. With the wording
       typed in the contract there is nothing for a second Enter to do, and two
       keystroke paths is how they come to disagree about what Enter means. */
    assert.equal(CODE.split("key === 'Enter' && !ev.shiftKey").length - 1, 1,
      'exactly one Enter path');
    assert.match(CODE, /key === 'Enter' && !ev\.shiftKey\)\{\n\s+ev\.preventDefault\(\);\n\s+if \(ask\.value\.trim\(\)\)[\s\S]{0,120}?ceAsk\(q\)/,
      'and it asks Copilot rather than applying');
  });

  test('A CHIP IS A QUESTION, and the answer lands on a card', () => {
    /* ONE ROW, ONE ATTRIBUTE. The chips follow the scope — the strip\'s three
       with a passage attached, the clause\'s four without — and either way a
       chip presses ceAsk, which is what decides the scope. A second attribute
       for "passage chip" would be a second route to one act. */
    assert.ok(!/data-ce-inline-chip/.test(CODE), 'the strip\'s own chip route is gone');
    const ch = CODE.match(/function ceRenderChips\([\s\S]*?\n\}/)[0];
    assert.match(ch, /if \(_ceSel\)\{[\s\S]{0,200}?ce_inline_shorten/,
      'a passage gets the three rewrite questions');
    assert.match(ch, /ce_q_softer/, 'and a clause gets its own four');
    assert.equal(ch.split('data-ce-chip=').length - 1, 1, 'drawn by one line either way');
  });

  test('AND THE CARD KNOWS WHAT IT WAS ABOUT', () => {
    /* The passage is recorded ON the card rather than read off `_ceSel` when
       Apply is pressed, so an answer stays applicable after the reader has let
       the passage go — and so a card marked against one sentence can never be
       applied as a rewrite of the whole clause. */
    assert.match(CODE, /const scope = _ceSel;/, 'the ask captures its scope at the press');
    assert.match(CODE, /text: wording, passage: scope \|\| null/, 'and hands it to the card');
    assert.match(CODE, /card\.passage \? card\.passage\.text : _ceText/,
      'the preview is marked against what it really replaces');
    assert.match(CODE, /if \(card\.passage\) ceReplacePassage\(card\.passage, card\.text\);\n\s+else ceApply\(/,
      'and Apply routes by what the card is about');
  });

  test('AND IT IS NOT A THIRD DOOR — the replacement files nothing of its own', () => {
    const rep = CODE.match(/function ceReplacePassage\([\s\S]{0,1400}?\n\}/)[0];
    for (const door of ['negoEditClause', 'negoFileChange', 'negoReviseInsert', 'persist(', 'ceFile('])
      assert.ok(!rep.includes(door), door + ' must not be reachable from the passage');
    assert.ok(/ceApply\(lines\.join/.test(rep),
      'it applies to the draft; the one act in the rail\'s foot still files');
    /* AND THE CUT, WHICH DOES REACH THE RECORD, GETS THERE THE SAME WAY — see
       the claim above. It is a named function rather than a body in the act
       handler because Escape and the paper's own gestures reach the same two
       acts and a second copy is how they come to disagree. */
    assert.match(CODE, /function ceCutPassage\(/, 'the cut is one named act');
  });

  test('both languages carry its words', () => {
    for (const k of ['ce_ask_ph_passage', 'ce_scope_in', 'ce_scope_off', 'ce_scope_cut',
      'ce_apply_passage', 'ce_suggestion_passage', 'ce_inline_say_what']){
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
  /* ---- RE-POINTED 1 Sep 2026 ---- The frame moved OFF the two editable boxes
     and onto the clause that contains them, on the owner's report that the name
     and the wording each drew one and the clause read as two stacked fields.
     Every claim below is the claim it always was — dashed, hairline, clear of
     the words, mixed off the document's own ink, not brought back by focus —
     asked of the rule that now draws it. */
  const FRAME = CE.match(/\.ce-paperwrap \.rl-clause-live:has\(\.ce-typing\)\{[\s\S]*?\}/)[0];

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
    assert.match(FRAME, /outline:1px dashed/,
      '"a very light almost dotted line", in the owner\'s own words');
    /* PINNED AS THE RELATION: a POSITIVE offset is what puts the line clear of
       the words. The number is a look and has already moved once. */
    const off = FRAME.match(/outline-offset:(\d+)px/);
    assert.ok(off && Number(off[1]) > 0,
      'set clear of the wording so it frames it rather than touching it');
    assert.ok(!/border:/.test(FRAME),
      'an OUTLINE takes no space, so nothing on the page moves when it appears — '
      + 'a border would reflow the clause under the reader');
  });

  test('ONE FRAME, ROUND THE CLAUSE — not one per editable box', () => {
    /* Owner-reported 1 Sep 2026, off a screenshot with both ringed: "when you
       click on a pencil you can an outline for the clause header and an outline
       for the clause. I want the outline to be one outline that encompasses
       both." The clause is the one element that already contains the name and
       the wording, so the frame goes there and the boxes draw none. */
    assert.ok(!/outline:1px dashed/.test(TYPING),
      'the wording box may not draw a frame of its own — that is the second box');
    assert.match(TYPING, /outline:none/, 'and says so, rather than leaving it to a default');
    const HEAD = CE.match(/\.ce-paperwrap \.ce-headbox\{[\s\S]*?\}/)[0];
    assert.ok(!/outline:/.test(HEAD),
      'and the name box adds no frame either — it carries geometry only');
    /* THE STATE IS EXACT, and it is what keeps the frame off a clause being
       merely READ: rl-clause-live marks this page's clause whether or not
       typing is on, and ce-typing exists only while it is typeable. */
    assert.match(FRAME, /\.rl-clause-live:has\(\.ce-typing\)/,
      'the live clause that CONTAINS an editable box — never the live clause alone');
  });

  test('the colour is MIXED off the document ink, never a typed grey', () => {
    /* The one thing that makes a single declaration right in both themes. The
       sheet is cream by day and near-black at night, so a fixed light grey
       that reads as a whisper on the cream is invisible on the other. Pinned
       as the relation — which token it is mixed from — and not as a value. */
    assert.match(FRAME, /color-mix\(in srgb, var\(--color-doc-text\)[^)]*, transparent\)/,
      'the line follows the ink the paper is already printed in');
    assert.ok(!/#[0-9a-fA-F]{3,8}/.test(FRAME),
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
    assert.match(FOCUS, /box-shadow:none/, 'still no ring');
    assert.match(FOCUS, /outline:none/,
      'and no frame of the box\'s own — the clause carries the one frame now, '
      + 'and it does not depend on which of the two boxes has the caret');
    assert.ok(!/var\(--accent-solid\)/.test(FOCUS),
      'the accent belongs to the workspace, not to a text box on the paper');
  });

  test('THE MARGIN BAR IS GONE — and the red changed-clause bar is not', () => {
    /* REVERSED IN PLACE 29 Aug 2026, owner-asked, ringing it: "delete the green
       line bar on highlighted in the attached".

       WHAT THIS TEST USED TO SAY, and why reversing it is safe rather than a
       loss: it asserted the teal bar was UNTOUCHED, on the reasoning that
       taking it would leave the page saying nothing about which clause is live.
       Three things already say that — the dashed frame round the wording, the
       caret in it, and the page naming its one clause at the top — so the
       reasoning was right about the question and wrong about this bar being the
       only answer to it.

       DELETED, NOT MADE TRANSPARENT: a bar painted in the page's own colour
       still reserves its margin and still has to be ruled out by the next
       reader. So the claim is the ABSENCE of the rule, which is stronger than
       asserting a colour. */
    assert.ok(!/\.rl-clause-live::before/.test(CE),
      'no margin bar is drawn on the clause being worked on');
    assert.ok(!/\.ce-paperwrap \.rl-clause-live\{/.test(CE),
      'and its positioning rule went with it — the clause is already positioned '
      + 'by the redline page, which is what the RED bar hangs off');
    /* THE RED ONE IS A DIFFERENT MARK AND STAYS, asserted here so this removal
       can never be read as covering it: it says the clause carries a change and
       it draws on every changed clause in the product, not only this page's. */
    const NEGOCSS = read('js/views/negotiation-css.js');
    assert.match(NEGOCSS, /\.rl-clause\.is-changed::after\{[\s\S]{0,200}background:var\(--danger\)/,
      'the changed-clause bar is untouched');
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

  /* ---- REVERSED IN PLACE 1 Sep 2026 (owner-asked: "delete ever having the CHG
     pills on the screen as show in the highlighted area") ----
     These two pinned WHERE the chips were drawn and that pressing one repainted
     the row they sat on. The chips are gone, so what is pinned now is the
     removal — including that nothing stands in for them, which is the half a
     "no chips" check alone would miss. DELETED RATHER THAN STUBBED, following
     Quarter, List and Obligations on the calendar: the builder was never
     exported, so there is no door a third caller could bring it back through. */
  test('the CHG pills are gone from the readings row, and from the page', () => {
    const bar = CE.match(/function ceRenderReadBar[\s\S]*?\n}\n/)[0];
    assert.ok(!/ceCtxChipsHtml/.test(bar), 'the row that drew them draws them no more');
    assert.equal((CODE.match(/(?<!STALE — flag any mention\. \*\/\n)function ceCtxChipsHtml/g) || []).length, 0,
      'and the builder is deleted, not left for a third caller to find');
    assert.ok(!/data-ce-focus/.test(CE.replace(/\/\*[\s\S]*?\*\//g, '')),
      'nor is the handler that made one lit — a listener for markup nothing '
      + 'emits is a mention of a retired thing');
    assert.ok(!/\.ce-chip\{/.test(CE), 'and no rule dresses one');
  });

  test('_ceLead is untouched — the door still says which ask this speaks for', () => {
    /* WHAT WENT WITH THE CHIPS, said out loud: on a clause carrying several
       asks you can no longer switch, from inside this page, which one the
       editor speaks for. Nothing is unreachable — the page is OPENED from a
       change — and the fact it named is still on the record and still on the
       foot's own button. */
    assert.match(CE, /_ceLead = ceLeadChange\(changeId\);/,
      'still set at the door');
    assert.match(CE, /_ceLead \? _cet\('ce_save_to', \{ id: _ceLead\.id \}\)/,
      'and still what the foot names');
  });

  test('a clause with nothing on it draws no chips at all', async () => {
    /* Which is what keeps the readings row the height it has always been on
       the commonest screen of all: a clause nobody has touched. */
    const p = await bench({ ask: false });
    wide(p.win);
    p.win.rlOpenClauseEditor(p.c, firstClauseId(p), {});
    assert.equal(p.doc.querySelectorAll('#ce-readbar .ce-chip').length, 0,
      'no chips on the row — and since 1 Sep 2026 there are none on any row');
    /* And nothing stands in for them either. The strip used to fill its own
       40px with "Nothing has been proposed on this clause yet" — the fourth
       printing of a fact the crumb and two fact-row cells already carry. */
    const page = p.doc.querySelector('#clause-editor');
    assert.ok(page, 'the page is up');
    assert.ok(!/Nothing has been proposed/.test(page.textContent),
      'the retired empty-state sentence is drawn nowhere on the page');
    p.win.rlCloseClauseEditor();
  });

  /* REVERSED IN PLACE 1 Sep 2026: it pinned that a clause WITH an ask carries a
     chip. None does now, and the claim is the stronger half of what it was
     always guarding — nothing above the paper draws a second copy of the
     change's id. */
  test('and a clause that HAS an ask carries no chip either', async () => {
    const p = await bench();
    wide(p.win);
    const ch = p.c.changes.find(x => x.status === 'pending' && !x.withdrawn);
    assert.ok(ch, 'the fixture really did put an ask on the table');
    p.win.rlOpenClauseEditor(p.c, ch.clauseId, {});
    assert.equal(p.doc.querySelectorAll('#ce-readbar .ce-chip').length, 0,
      'the readings row is the readings, the counts and the zoom');
    assert.equal(p.doc.querySelectorAll('#ce-ctx').length, 0,
      'and the retired strip above the paper is not back either');
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

/* ============================================================
   f245 (18) — the Changes tab is gone, and Redlined shows redlines
   ------------------------------------------------------------
   Two owner reports off one screenshot, 28 Aug 2026: "Delete changes tab", and
   "ensure when you are in the redlines tab you are able to see the redlines
   because that is the whole purpose of having that tab."

   The second is the interesting one. A typeable box shows the DRAFT — you
   cannot type into a redline — so a page that opened typeable on a clause
   already carrying a change put the reader on Redlined with the one clause
   they were looking at unmarked, while the rail beside it showed the marks
   perfectly. Both of this page's standing decisions survive on the question
   that separates them: is there anything to hide?
   ============================================================ */
describe('f245 (18) — the Changes tab is gone, and Redlined shows redlines', () => {
  test('the tab, its list and its badge are deleted, not switched off', () => {
    for (const dead of ['data-ce-tab="changes"', 'ce-chg-n', 'ceChangesHtml(', 'ceFiledList(']){
      assert.equal(CODE.includes(dead), false, `${dead} is gone from the page`);
    }
    assert.equal(/\.ce-chg\{/.test(SRC), false, 'and its dress went with it');
  });

  test('the rail is Copilot and the playbook scan, and nothing else', () => {
    const tabs = [...CODE.matchAll(/data-ce-tab="([a-z]+)"/g)].map(m => m[1]);
    assert.deepEqual([...new Set(tabs)].sort(), ['chat', 'scan']);
  });

  test('the two keys are left INERT in both dictionaries, never removed from one', () => {
    for (const key of ['ce_tab_changes', 'ce_changes_none']){
      const hits = (I18N.match(new RegExp(`(^|[^\\w])${key}:`, 'g')) || []).length;
      assert.equal(hits, 2, `${key} must still be in English AND Swedish, or a screen goes half-English`);
    }
  });

  test('the page never opens in a state that hides marks that exist', () => {
    /* The rule, read off the source: the opening posture is a QUESTION about
       whether the draft differs from what stands, not a constant. A literal
       `_ceEditing = true` here is the reported fault.

       REVERSED IN PLACE 29 Aug 2026 and made STRONGER, not weaker: the
       question is unchanged and now sits behind one override — an explicit ask
       to type, which is the reader clicking into the words. What the rule
       governs is ARRIVAL, which is where it was reported; a reader who has
       just put their cursor in a clause is not having anything hidden from
       them. */
    assert.match(CODE, /_ceEditing = wantTyping \|\| \(_ceText === _ceBase && _ceHead === _ceHeadBase\)/,
      'it opens typeable only where there is nothing being kept from anybody');
    assert.equal(/_ceEditing = true;/.test(CODE), false,
      'and never unconditionally');
  });

  test('the ask to type is CONSUMED, so it cannot leak into every later move', () => {
    /* _ceOpts is what every later ceGoClause inherits. Left on it, one click
       into the words would silently make every subsequent move to another
       clause open typing too — a posture nobody chose, spreading. */
    assert.match(CODE, /delete _ceOpts\.typing/,
      'the flag is taken off the stored options at the moment it is read');
  });

  test('and the pencil is still the one press that starts the writing', () => {
    assert.match(CODE, /_ceEditing = !_ceEditing/,
      'the control that turns typing on is unchanged and is on the clause');
  });

  test('moving to another clause asks before it throws a draft away', () => {
    /* The draft lives in memory until it is filed, and there are TWO doors onto
       this act — the clause list and another clause's pencil. (There were three
       until 1 Sep 2026; the press in another clause's words is retired, see
       below.) It is the PRODUCT'S OWN guard, not a second one: the same
       predicate and the same words the page uses when the reader leaves it. */
    assert.match(CODE, /const dirty = \(typeof clauseEditorDirty === 'function'\) && clauseEditorDirty\(\)/,
      'asked in ceGoClause, so all three doors inherit it');
    assert.match(CODE, /if \(!dirty \|\| typeof window === 'undefined' \|\| !window\.confirmDialog\)\{ go\(\); return; \}/,
      'a reader who has typed nothing is never asked \u2014 every ordinary move');
    assert.match(CODE, /_cet\('ce_leave_title'\)/,
      'and it borrows the leave dialog\'s own words rather than minting a key');
  });

  test('THE WARNING NAMES ITS CLAUSE AND THE WORDING AT RISK', () => {
    /* ---- OWNER-REPORTED 1 Sep 2026 ----
       "The attached alert does not give you an indication of which clause or
       which wordings are in question and I therefore cannot track back to where
       i left off."

       It named neither. "Leave this clause?" over "the wording you have written
       here has not been filed" is true of every clause in the contract, and it
       is raised from a full-window page that carries no header — so at the
       moment the reader most needs to know where they are, nothing said. */
    assert.match(CODE, /function clauseEditorLeaveAsk\(\)\{/,
      'ONE READING, because two surfaces raise this one guard');
    assert.match(CODE, /_cet\('ce_leave_on', \{ clause: name \}\)/,
      'it names the clause');
    assert.match(CODE, /clauseLabel\(cl\)/,
      'through clauseLabel — the product\'s own answer to "which clause is '
      + 'this", which the cards and the Chat rows already print, and which '
      + 'falls back to the clause\'s own wording where there is no heading');
    assert.match(CODE, /_cet\('ce_leave_lost', \{ words: cut \}\)/,
      'and quotes back what is not filed');
    assert.match(CODE, /window\.richToText \? richToText\(_ceText \|\| ''\) : ''/,
      'read through the ONE text projection this codebase has');
    /* BOUNDED, because a confirm dialog is one paragraph and a clause is not.
       Pinned as the relation — a named ceiling, not its value. */
    assert.match(CODE, /const CE_LEAVE_SNIP = \d+;/, 'the bound is named');
    assert.match(CODE, /raw\.length > CE_LEAVE_SNIP/, 'and it is what bounds the quote');
    /* THE FALLBACK IS ALWAYS THE OLD SENTENCE, never nothing: a guard that says
       less because a lookup failed is worse than the guard that prompted the
       report. */
    assert.match(CODE, /const tail = _cet\('ce_leave_body'\);/);
    assert.match(CODE, /bits\.push\(tail\);/, 'the warning itself is always last');
  });

  test('and the shell asks for that sentence rather than writing its own', () => {
    /* Two surfaces raise one guard — this page on the way to another clause,
       the shell on the way off the page — and a copy of the words in the shell
       would be a second answer to one question. */
    const app = read('js/app.js');
    assert.match(app, /window\.clauseEditorLeaveAsk && clauseEditorLeaveAsk\(\)/,
      'asked through window, the ES-module rule');
    assert.match(app, /\|\| \{ title:i18t\('ce_leave_title'\), message:i18t\('ce_leave_body'\) \}/,
      'and the fallback is the old sentence, never nothing');
    assert.match(app, /confirmDialog\(\{ title:ask\.title, message:ask\.message,/,
      'and it uses what it was given');
    assert.match(read('js/views/clauseeditor.js'), /\n  clauseEditorLeaveAsk,/,
      'PUBLISHED — an unexported name read through window is silence');
  });

  test('and both of its sentences are in both languages', () => {
    for (const k of ['ce_leave_on', 'ce_leave_lost']){
      assert.ok(new RegExp('\\b' + k + ':').test(I18N), k + ' is in the dictionary');
      assert.equal(I18N.split(new RegExp('\\b' + k + ':')).length - 1, 2,
        k + ' is in BOTH languages');
    }
  });

  test('THE PENCIL IS THE ONLY WAY IN — a press in the words does nothing', () => {
    /* ---- REVERSED IN PLACE 1 Sep 2026 ----
       It pinned click-in-the-words-and-type (owner-asked 29 Aug: "Let me just
       edit like I am in Google Docs"). The owner reversed it in those terms:
       "only after clicking on the pencil can you have the ability to edit."
       WHAT THAT GESTURE COST is why: you cannot type into a redline, so a press
       that felt like putting a cursor down was quietly the press that took a
       clause's marks off the screen.

       IT DOES NOT EVEN MOVE THE PAGE, ruled on by name — a click that silently
       re-points this page at another clause changes what the crumb says, what
       File would file and what Copilot is answering about, with nothing on
       screen inviting it. */
    assert.ok(!/const inDoc = hit\('#ce-doc'\)/.test(CODE),
      'the branch that read a press in the paper as an ask to type is gone');
    assert.ok(!/ceStartTyping/.test(CODE.replace(/\/\*[\s\S]*?\*\//g, '')),
      'and its helper with it — one definition, one caller, never published');
    /* THE TWO DOORS THAT DO MOVE YOU, both still there and both deliberate. */
    assert.match(CODE, /if \(id && id !== _ceClauseId\)\{ ceGoClause\(id, \{ typing: true \}\); return; \}/,
      'the pencil on another clause: ONE press, goes there AND starts editing, '
      + 'because a pencil means edit wherever it is');
    assert.match(CODE, /const goCl = hit\('\[data-ce-goclause\]'\)/,
      'and the clause list moves you WITHOUT editing — the reading door');
    /* Once typing is on, the browser's own caret is the right answer and this
       page must not fight it. Nothing here places one from a press. */
    assert.ok(!/caretRangeFromPoint|caretPositionFromPoint/.test(CODE),
      'no caret is placed from a press: that was the click-to-type route\'s own '
      + 'machinery and it went with the gesture');
  });
});

/* ============================================================
   f245 (19) — one press to edit
   ============================================================
   Owner-reported 29 Aug 2026: "I am still clicking the pencil sign various
   times and I do not know for what reason ... Just click the pencil symbol
   once, you can then edit manually by typing or highlight a sentence and a
   strip bar appears (which was there before but you seem to have deleted it)."

   THE CAUSE WAS ONE LINE AND IT IS NOT WHAT IT LOOKED LIKE. The strip was not
   deleted; it was made conditional on NOT typing, so typing and the strip could
   never be live at once and no number of pencil presses reached both. That
   guard arrived in 79551c8 (26 Aug 2026); the 28 Aug rule about ARRIVAL then
   turned a latent conflict into a daily one, because the reader now lands on a
   marked clause needing a press.

   AND A SECOND FAULT SAT UNDER IT, found only by reading the click path: since
   click-to-type landed, a DRAG in the wording started typing on the `click`
   that follows mouseup, which dropped a caret and COLLAPSED the selection
   before the strip's own deferred read ran. Removing the guard alone would have
   fixed nothing.

   What a browser has to answer — is the strip visible pixels, is the caret
   still in the clause — is clause-editor-verify's. This file holds the rules.
   ============================================================ */
describe('f245 (19) — one press reaches typing AND the strip', () => {

  test('THE REPORTED CAUSE: the strip no longer stands down while typing', () => {
    const up = CODE.match(/addEventListener\('mouseup'[\s\S]*?\n  \}\);/);
    assert.ok(up, 'the selection handler is still there to read');
    assert.ok(!/ceIsTyping\(\)\s*\)\s*return;/.test(up[0]),
      'it must not refuse a drag because the reader is typing — that refusal IS '
      + 'the report, and with it in place the pencil is one switch pointing at '
      + 'one of two jobs');
    assert.match(up[0], /ceAttachPassage\(read\.sel\)/, 'and it still attaches the passage');
    /* ---- AND IT ONLY EVER ANSWERS FOR A PRESS ON THE PAPER (M-1) ----
       THE LINE THAT MAKES OPTION A WORK. With the box on the paper, a press
       elsewhere that made no selection meant "the reader has moved on" and
       detaching was right. With the box in the RAIL, the very next thing a
       reader does after attaching is click into the ask box — which makes no
       selection — and that would have detached the passage they had just
       chosen, in one press, every time. */
    assert.match(up[0], /if \(!t \|\| !t\.closest \|\| !t\.closest\('#ce-doc'\)\) return;/,
      'a press outside the paper is not this handler\'s business at all');
  });

  /* ---- REVERSED IN PLACE 1 Sep 2026 ----
     It said the strip's fix was scoped so that click-to-type was untouched, and
     recorded a drag guard written for it and taken out again. Click-to-type is
     RETIRED (owner-ruled: "only after clicking on the pencil can you have the
     ability to edit"), so there is nothing left for either half to be scoped
     around — and the drag-versus-click question it was weighing cannot arise at
     all now that a press in the wording is not read as anything.

     WHAT THE CLAIM WAS REALLY PROTECTING SURVIVES AND IS STRONGER: no guard of
     ours may sit in front of a drag on the paper. That is what makes the strip
     reachable, and it is the half the 29 Aug report was actually about. */
  test('no guard of ours sits in front of a drag on the paper', () => {
    assert.ok(!/ceDragSelected/.test(CODE),
      'the browser\'s own selection is what the strip reads');
    assert.ok(!/const inDoc = hit\('#ce-doc'\)/.test(CODE),
      'and there is no click branch on the paper left to race it');
  });

  /* REVERSED IN PLACE 31 Aug 2026 (M-1) AND STRONGER FOR IT. The claim was that
     the strip took the caret only when the reader was not already typing — a
     conditional, because the box was on the paper and its first keystroke was
     usually meant for it. Then 30 Aug reversed THAT: the strip ALWAYS took the
     caret, because the owner had met the conditional and did not want it. With
     the box in the RAIL there is nothing on the paper to move the caret to, so
     attaching never touches focus at all — which is the same promise both
     earlier rules were reaching for, with the condition gone. */
  test('attaching NEVER takes the caret', () => {
    const at = CODE.match(/function ceAttachPassage\([\s\S]*?\n\}/)[0];
    assert.ok(!/focus\(\)/.test(at),
      'a drag mid-sentence must not move the reader out of the clause they are writing in');
    assert.match(at, /if \(_ceSel && _ceSel\.text === sel\.text && _ceSel\.line === sel\.line\) return;/,
      'and the same passage twice repaints nothing, so a stray double-click '
      + 'does not clear a half-typed ask');
  });

  /* KEPT FROM 30 Aug AND RE-POINTED, not deleted: the writing bar must go on
     working while a passage is held, and it does by acting on the held sentence
     rather than on a selection the caret has left behind. What CHANGED is that
     there is no box on the paper to carry typing through the press. */
  test('THE OTHER HALF: the writing bar acts on the held sentence', () => {
    /* A document has ONE selection. A reader who highlights a sentence and then
       presses B means that sentence, wherever the caret has since gone. */
    const bar = CODE.match(/bar\.addEventListener\('mousedown'[\s\S]*?\n  \}\);/)[0];
    assert.match(bar, /if \(_ceSel && ceBarOnHeld\(k\)\) return;/,
      'a held passage is asked about FIRST');
    assert.match(bar, /if \(window\.richBarPress && richBarPress\(k\)\) cePullText\(\);/,
      'and with nothing held the bar reads the reader\'s own selection exactly '
      + 'as it did');
    const held = CODE.match(/function ceBarOnHeld\([\s\S]*?\n\}/)[0];
    assert.match(held, /richBarPress\(k\)/, 'the act is the shared bar\'s, never this page\'s own');
    assert.match(held, /ceReopenHeld\(held\)/,
      'and the reader is put back afterwards — the same passage held, marked '
      + 'where it now sits');
    /* REVERSED IN PLACE (M-1): it used to carry the strip's half-typed text
       through the press. There is no box on the paper to carry, and the rail's
       own ask box is never rebuilt by a paint, so there is nothing to save. */
    assert.ok(!/const typed = ta0/.test(held),
      'and it carries no typing through the press — the ask box is in the rail '
      + 'and a paint does not touch it');
  });

  test('a passage that cannot be found again is let go, not held over nothing', () => {
    const re = CODE.match(/function ceReopenHeld\([\s\S]*?\n\}/)[0];
    assert.match(re, /if \(!r\)\{ ceDetachPassage\(\); return; \}/,
      'where a rebuild genuinely moved the wording the rail lets it go rather '
      + 'than standing a card over words it can no longer place');
  });

  /* REVERSED IN PLACE 31 Aug 2026 (M-1), and it is the OPPOSITE test now.
     It asserted that the handler excluded CONTROLS and took everything else,
     which was right while the strip was the only other thing on the page that
     acted on a held passage. The rail is a card the reader reads and presses,
     and a press anywhere in it that is not a control came back here a frame
     later with no selection in the clause and tore the card down under the hand
     using it. So it asks the DOCUMENT instead: a gesture that did not end in
     the wording is not a gesture about the wording. */
  test('a drag that did not end in the contract is not about the contract', () => {
    const up = CODE.match(/addEventListener\('mouseup'[\s\S]*?\n  \}\);/)[0];
    assert.match(up, /if \(!t \|\| !t\.closest \|\| !t\.closest\('#ce-doc'\)\) return;/,
      'the press has to have landed inside the paper');
    assert.ok(!/\[data-ce-act\], #ce-inline/.test(up),
      'and the old control exclusion is gone with the strip it was written for');
    assert.match(up, /if \(read\.sel\)\{ ceAttachPassage\(read\.sel\); return; \}/,
      'a real selection attaches');
    assert.match(up, /ceDetachPassage\(\);\n/, 'and none lets the passage go');
  });

  test('and typing in the clause lets it go, having done nothing', () => {
    const input = CODE.match(/addEventListener\('input'[\s\S]*?\n  \}\);/)[0];
    assert.match(input, /if \(_ceSel\) ceDetachPassage\(\);/,
      'a reader who highlights and then carries on writing has answered the '
      + 'question themselves');
    assert.match(input, /ceSyncBarSteps\(\)/, 'and the step buttons still follow');
  });

  test('nothing about filing moved', () => {
    /* The whole of this fix is which gestures reach which control. A change
       that started filing on a highlight would be a second door onto the one
       act this page has. */
    assert.ok(!/negoFileChange\(/.test(CODE), 'no second filing path');
    assert.ok(!/changes\.push/.test(CODE), 'and nothing writes a change directly');
  });

  test('THE DOOR ITSELF: a press that says "edit" arrives ready to type', () => {
    /* THE HALF THAT WAS ACTUALLY MISSING, and the report named it: "when i
       click on pencil it takes me to the editor page but the rest is not
       working". The page opened, correctly, in the state the 28 Aug ARRIVAL
       rule asks for — showing the marks that exist — so the reader still had to
       find a SECOND pencil on the far side. Three controls open that page and
       none of them said what the press meant.

       ONE READING, THREE CALLERS. The ask is written in `openEditor` and
       nowhere else, so a fourth door in this function inherits it and cannot
       forget; three call sites each remembering to say the same thing is how
       two of them come to disagree. */
    assert.match(NEGO_CODE, /const openEditor = \(clauseId, extra\)/,
      'the reading is a named thing, not a phrase repeated at three presses');
    assert.match(NEGO_CODE, /openEditor = [\s\S]{0,200}?typing: true/,
      'and what it says is that the reader asked to edit');
    const calls = NEGO_CODE.match(/rlOpenClauseEditor\(c,/g) || [];
    assert.equal(calls.length, 1,
      'exactly one place calls the door — a caller of its own would be a second '
      + 'answer to what a press onto this page means');
    const asks = NEGO_CODE.match(/typing: true/g) || [];
    assert.equal(asks.length, 1, 'and the ask is made in exactly one place');
    for (const attr of ['data-rl-cp-editor-row', 'data-rl-cp-editor'])
      assert.ok(NEGO_CODE.includes(attr),
        `${attr} is still a door onto the page`);
  });

  test('…and the ARRIVAL rule still governs every move inside the page', () => {
    /* The narrowing is exactly one case: the press that said "edit". A move to
       another clause from inside the editor is not that press, and must still
       land showing whatever marks exist — which is what consuming the ask
       buys, and why it is deleted rather than kept on the options. */
    const open = SRC.match(/function rlOpenClauseEditor\([\s\S]*?\n\}/)[0];
    assert.match(open, /delete .*typing|typing[\s\S]{0,120}delete/,
      'the ask is consumed on arrival');
    assert.match(CODE, /_ceEditing = /, 'and the conservative reading survives');
  });
});

/* ============================================================
   f245 (20) — the contract stops jumping
   ============================================================
   OWNER-REPORTED 31 Aug 2026, in the same message as Option A: *"whenever I
   make change or click in the box, the contract moves up then back down to
   where I was. Remove this bug."*

   THE PAPER IS REBUILT ON EVERY CHANGE TO THE DRAFT, and a rebuilt scroller
   starts at 0 — that is the jump. `ceRenderPaper` then puts the reader's place
   back with a BARE ASSIGNMENT, and `#ce-doc` is a `.nego-scroll`, which is
   scroll-behavior:smooth — so the restore is read as a REQUEST TO ANIMATE from
   the top. That is the crawl back down.

   THE PRODUCT ALREADY SOLVED THIS. rlRestoreScroll was written for the
   identical fault on the negotiation page a fortnight earlier and its own note
   says so in those words; this page never called it. The smooth rule is NOT
   removed — it is what makes pressing a change card read as a journey to its
   clause — it is suspended for the width of the assignment.

   WHAT A BROWSER ANSWERS — does the paper visibly move — is
   clause-editor-verify's. This file holds the rule.
   ============================================================ */
describe('f245 (20) — putting a scroll back is not travelling to it', () => {

  test('THE REPORTED CAUSE: the restore is no longer a bare assignment', () => {
    const paint = CODE.match(/_ceRendering = true;[\s\S]{0,600}?ceApplyZoom\(\);/);
    assert.ok(paint, 'the paint that rebuilds the paper is still there to read');
    assert.ok(!/host\.scrollTop = keep;/.test(paint[0]),
      'a bare assignment under a smooth rule is a request to animate from the top — '
      + 'which is the whole of the report');
    assert.match(paint[0], /ceRestoreScroll\(host, keep\)/,
      'it is put back rather than travelled to');
  });

  test('and the restore suspends the smooth rule rather than deleting it', () => {
    const r = CODE.match(/function ceRestoreScroll\([\s\S]*?\n\}/)[0];
    assert.match(r, /el\.style\.scrollBehavior = 'auto';/, 'suspended for the assignment');
    assert.match(r, /el\.scrollTop = top;/, 'the position is put back');
    assert.match(r, /el\.style\.scrollBehavior = prev;/,
      'and handed back, because the reader\'s NEXT scroll is meant to be smooth');
    /* THE RULE LIVES IN THE SPLIT STYLESHEET, which is where this page's paper
       gets it from too: `#ce-doc` carries .nego-scroll. */
    assert.match(read('js/views/negotiation-css.js'), /\.nego-scroll\{[^}]*scroll-behavior:smooth/,
      'the rule itself is untouched — it is what makes rlLinkFocus read as a journey');
    assert.match(CODE, /<div class="nego-scroll" id="ce-doc"/,
      'and this page\'s paper really carries it, which is why the fault reached here');
  });

  test('THE FALLBACK IS THE FIX AGAIN, never the bare assignment', () => {
    /* A cross-module read that falls back to the broken behaviour is how a fix
       silently reverts — this codebase's most repeated defect, recorded six
       times. So the fallback does the same job rather than putting the bug
       back, AND the name it prefers is really published. */
    const r = CODE.match(/function ceRestoreScroll\([\s\S]*?\n\}/)[0];
    assert.match(r, /window\.rlRestoreScroll\)\{ rlRestoreScroll\(el, top\); return; \}/,
      'it prefers the product\'s own one');
    assert.match(read('js/views/negotiation.js'), /^\s*rlRestoreScroll,$/m,
      'which is published, or the read is silence');
  });

  /* ---- REVERSED IN PLACE 31 Aug 2026 (N-2), AND STRONGER FOR IT ----
     This allowed ONE bare assignment on the paper — ceScrollToClause — on the
     reasoning that bringing the clause into view is a deliberate TRAVEL and
     should glide. The owner reported that glide as the bug it is: a 28-frame
     journey down the contract every time you press the pencil. So the exemption
     is gone and the claim is the simple one — the paper is NEVER assigned
     bare. */
  test('nothing on this page assigns the paper a scrollTop bare', () => {
    const live = CODE.replace(/\/\*[\s\S]*?\*\//g, '');
    /* PINNED AS A RELATION, NOT A COUNT: every remaining assignment is either
       the helper's own or the rail's conversation — a different scroller, with
       no smooth rule on it. */
    const sites = live.match(/[\w.]+\.scrollTop = /g) || [];
    for (const site of sites)
      assert.ok(/^(el|lane)\.scrollTop = $/.test(site), 'unexpected scroll site: ' + site);
    assert.equal(sites.filter(x => x === 'host.scrollTop = ').length, 0,
      'the paper is never assigned directly — every move goes through the helper');
    assert.equal(sites.filter(x => x === 'el.scrollTop = ').length, 1,
      'and the helper itself is the one place that writes one');
    assert.equal(sites.filter(x => x === 'lane.scrollTop = ').length, 2,
      'the rail keeps its own two — the scan tab\'s top and the last turn');
  });
});

/* ============================================================
   f245 (21) — THE SENTENCE THE RAIL IS HOLDING
   ------------------------------------------------------------
   (owner-approved render, 30 Aug 2026; RE-POINTED 31 Aug 2026 with M-1.) A
   document has ONE selection — so the moment the caret moves anywhere else the
   browser stops painting the reader's highlight, and the sentence being worked
   on would go invisible at the exact moment its replacement is being asked
   for. This mark is what keeps it visible, and the owner ruled on it as a mark
   on the CONTRACT rather than as a detail of the strip.

   IT IS WHY OPTION A COST THE READER NOTHING. The render that chose the rail
   named the lost highlight as its one cost; this mark, built for the strip the
   day before, pays it — so the mark outlived the strip and every claim below
   is still exactly the claim it was.

   THE CLAIM THAT MATTERS IS THAT IT CANNOT REACH THE RECORD, and it is asserted
   three times because it is guaranteed three times: the pull reads a copy with
   the mark taken off, the sanitiser unwraps the class by construction, and the
   strip closing clears it. Two of the three are structural — neither depends on
   anybody remembering to call anything — and that is the point.
   What a browser has to answer (is the wash painted, does typing reach the box)
   is clause-editor-verify's.
   ============================================================ */
describe('f245 (21) — the sentence the rail is holding', () => {

  test('the mark is drawn where the reader dragged, not where the words repeat', () => {
    /* RE-POINTED 31 Aug 2026: ceSelection is a one-line wrapper now and the
       reading lives in ceSelectionRead, so a refusal can name itself. The claim
       is unchanged — the live range travels with the selection. */
    const sel = CODE.match(/function ceSelectionRead\([\s\S]*?\n\}/)[0];
    assert.match(sel, /range: r/,
      'the live range travels with the selection, so the mark lands on exactly '
      + 'the passage that was dragged');
    const at = CODE.match(/function ceAttachPassage\([\s\S]*?\n\}/)[0];
    assert.match(at, /if \(sel\.range\) ceMarkHeld\(sel\.range\)/,
      'and it is marked BEFORE anything else can collapse the selection it is '
      + 'read from');
  });

  test('NET 1 — the pull reads the box with the mark taken off', () => {
    const pull = CODE.match(/function cePullText\([\s\S]*?\n\}/)[0];
    assert.match(pull, /const raw = ceBoxHtml\(box\);/,
      'the pull never reads the live box directly');
    const boxHtml = CODE.match(/function ceBoxHtml\([\s\S]*?\n\}/)[0];
    assert.match(boxHtml, /cloneNode\(true\)/,
      'it reads a COPY, so the mark on screen is untouched');
    assert.match(boxHtml, /ceClearHeld\(clone\)/, 'with the mark unwrapped out of it');
  });

  test('NET 2 — the sanitiser drops the class by construction', () => {
    /* THE STRUCTURAL ONE, and the reason this mark is safe rather than careful:
       richSpanClassOk answers for every span the sanitiser meets, and a span
       whose class is not on its allow-list is UNWRAPPED. So the mark cannot
       reach a stored body even if every explicit guard above were deleted.
       IT FAILS THE DAY SOMEBODY PUTS THIS CLASS ON THAT LIST, which is exactly
       when somebody should be made to re-read this. */
    const rich = fs.readFileSync(path.join(ROOT, 'js/richdoc.js'), 'utf8');
    assert.match(rich, /richSpanClassOk = v => v === RICH_FIELD_CLASS \|\| RICH_MARK_CLASSES\.has\(v\)/,
      'one reading of whether a span may keep its class');
    assert.ok(!/ce-held/.test(rich),
      'and the held mark is deliberately NOT on the allow-list');
    assert.match(rich, /querySelectorAll\('span'\)[\s\S]{0,200}richSpanClassOk[\s\S]{0,260}sp\.remove\(\)/,
      'a span it does not know is unwrapped, keeping its text and leaving '
      + 'nothing behind to hang meaning on');
  });

  test('NET 3 — letting the passage go clears it', () => {
    const close = CODE.match(/function ceDetachPassage\([\s\S]*?\n\}/)[0];
    assert.match(close, /ceClearHeld\(\)/,
      'the mark says what the rail is holding, so it may not outlive it');
    const paper = CODE.match(/function ceRenderPaper\([\s\S]*?ceRenderReadBar\(\)/)[0];
    assert.match(paper, /ceDetachPassage\(\)/,
      'and a rebuilt paper takes the card with it — the element the mark sat '
      + 'on has gone, and the passage may genuinely have moved');
  });

  test('it changes no layout, and follows the workspace rather than a colour', () => {
    const css = CODE.match(/\.ce-paperwrap \.ce-held\{[\s\S]*?\}/)[0];
    assert.match(css, /background:color-mix\(in srgb, var\(--accent-solid\)/,
      'the workspace accent, so it is the same colour as the rail card\'s own '
      + 'quote rule and needs no answer of its own at night');
    assert.match(css, /box-shadow:inset/,
      'INSET, so the underline occupies no space');
    assert.ok(!/\.ce-paperwrap \.ce-held\{[^}]*(?:padding|margin|border(?!-)|font-size)/.test(CODE),
      'and nothing in it can move a word when it appears or goes');
  });
});

/* ============================================================
   f245 (22) — LETTING A PASSAGE GO REALLY LETS IT GO
   ------------------------------------------------------------
   OWNER-REPORTED 31 Aug 2026, off a screenshot with the card's ✕ ringed:
   *"when I click the highlighted x in the card, I am unable to highlight a
   sentence in the same clause and get a copilot to edit again."*

   REPRODUCED IN A BROWSER, AND THE ✕ IS THE TRIGGER RATHER THAN THE CAUSE.
   Letting the passage go took away the card and the mark and left the BROWSER'S
   OWN SELECTION standing — and pressing the ✕ moves focus out of the box, at
   which point the browser stops painting that selection. From the reader's
   chair nothing is selected; the document says otherwise.

   WHAT THAT COSTS IS THE WHOLE REPORT: a mousedown inside an existing selection
   in a contenteditable box starts a native DRAG OF THE TEXT rather than a new
   selection, so the browser swallows the mouseup and this page's handler never
   runs. MEASURED: two mousedowns, one mouseup. That clause only, because that
   is where the stale selection is — which is exactly the qualifier in the
   report — and it clears itself after one press elsewhere, which is what made
   it read as intermittent.

   THE SECOND HALF IS THE ONE THAT MATTERS MORE. A highlight this page refuses
   used to draw nothing and say nothing, so a gesture the product had decided
   against was indistinguishable from a page that had stopped working. That is
   this codebase's own most repeated defect, and had the refusal been speaking
   the first half would have been findable in seconds.

   The PIXELS — that the second drag really does raise the card again — are
   clause-editor-verify's, driven with a real mouse. A scripted Range fires no
   mousedown at all and passes against the broken build.
   ============================================================ */
describe('f245 (22) — the selection goes with the passage', () => {

  test('THE REPORTED FIX: letting a passage go releases the selection too', () => {
    const off = CODE.match(/function ceDetachPassage\([\s\S]*?\n\}/)[0];
    assert.match(off, /removeAllRanges\(\)/,
      'the browser\'s own selection is dropped, or the next mousedown inside it '
      + 'is read as a drag of the text and the mouseup never arrives');
    assert.match(off, /const had = _ceSel;/,
      'what was being held is taken before it is cleared, so the comparison '
      + 'below has something to compare against');
  });

  test('ONLY WHERE THE SELECTION IS STILL OURS', () => {
    /* This runs on every path that lets a passage go — a rebuild and a refusal
       included — so collapsing a selection the reader has just made themselves
       would be the same rudeness pointing the other way. */
    const off = CODE.match(/function ceDetachPassage\([\s\S]*?\n\}/)[0];
    assert.match(off, /!s\.isCollapsed && had && had\.text/,
      'a collapsed selection and a detach with nothing held are both left alone');
    assert.match(off, /=== had\.text\)\n?\s*s\.removeAllRanges\(\)/,
      'and it is cleared only when it is still the passage that was held');
    assert.ok(off.includes("replace(/[^\\S\\n]+/g, ' ')"),
      'compared on the normalised text, because ceSelection normalises and a '
      + 'live selection does not');
    assert.match(off, /try\{[\s\S]*removeAllRanges[\s\S]*\}catch/,
      'and it can never take an act down with it');
  });

  test('ONE READING, TWO READERS — a refusal can name itself', () => {
    assert.match(CODE, /function ceSelectionRead\(\)\{/,
      'the whole question is answered once');
    assert.match(CODE, /function ceSelection\(\)\{ return ceSelectionRead\(\)\.sel \|\| null; \}/,
      'and ceSelection is a thin wrapper, so every existing caller is unchanged');
    /* NEVER TWO COPIES OF THE READING: a second function working out "why not"
       beside one working out "what" is how the two come to disagree about which
       passages are allowed. */
    const reads = (CODE.match(/const lines = ceLines\(\);\n\s+let li = -1/g) || []).length;
    assert.equal(reads, 1, 'there is exactly one place that decides');
  });

  test('and the three refusals are real, distinct reasons', () => {
    const read = CODE.match(/function ceSelectionRead\([\s\S]*?\n\}/)[0];
    for (const k of ['ce_sel_two_paras', 'ce_sel_twice', 'ce_sel_not_in_draft'])
      assert.ok(read.includes(k), k + ' is answered by the reading itself');
    assert.match(read, /if \(text\.length < 3\) return \{ why: null \};/,
      'A CLICK IS NOT A REFUSAL — below this there is nothing a reader could '
      + 'have meant, so it names no reason and the page stays silent');
    assert.match(read, /if \(!sel \|\| sel\.isCollapsed \|\| !sel\.rangeCount\) return \{ why: null \};/,
      'and neither is a collapsed selection');
  });

  test('the handler speaks it, through the page\'s one refusal line', () => {
    const up = CODE.match(/addEventListener\('mouseup'[\s\S]*?\n  \}\);/)[0];
    assert.match(up, /const read = ceSelectionRead\(\);/, 'it asks the one reading');
    assert.match(up, /if \(read\.sel\)\{ ceAttachPassage\(read\.sel\); return; \}/,
      'a placeable passage attaches exactly as it did');
    assert.match(up, /if \(read\.why\) ceSay\(_cet\(read\.why\)\);/,
      'and a refusal names itself — ceSay is the line the writing bar, Apply '
      + 'and Discard already speak through');
  });

  test('both languages carry the three sentences', () => {
    for (const k of ['ce_sel_two_paras', 'ce_sel_twice', 'ce_sel_not_in_draft']){
      assert.ok(new RegExp('\\b' + k + ':').test(I18N), k + ' is in the dictionary');
      assert.equal(I18N.split(new RegExp('\\b' + k + ':')).length - 1, 2,
        k + ' is in BOTH languages');
    }
  });
});

/* ============================================================
   f245 (23) — LANDING ON A CLAUSE IS NOT A JOURNEY TO IT
   ------------------------------------------------------------
   OWNER-REPORTED 31 Aug 2026: *"The contracts still jumps around when you are
   trying to make edits. The contracts should stay firm where it is unless you
   are scrolling."*

   THE 31 Aug FIX WAS REAL AND WAS NOT THE ONLY CAUSE. That one was the RESTORE
   — putting the reader back where they were, drawn as a glide. This is the
   other half and it is one function along: ceScrollToClause wrote scrollTop
   BARE, and #ce-doc is a `.nego-scroll` carrying scroll-behavior:smooth, so
   opening a clause was a 28-FRAME ANIMATED GLIDE from the top of the contract
   down to it — measured 0 → 728 on an ordinary agreement. The reader presses
   the pencil to edit one clause and watches half the contract fly past first.

   MEASURED BEFORE AND AFTER, as frames rather than as a final position: 28
   distinct offsets before, 2 after. A probe that reads the offset once the dust
   settles passes against a page that visibly travels, which is why the pixels
   for this live in clause-editor-verify.
   ============================================================ */
describe('f245 (23) — the paper lands rather than travels', () => {

  test('THE REPORTED CAUSE: no bare assignment is left in the travel', () => {
    const go = CODE.match(/function ceScrollToClause\([\s\S]*?\n\}/)[0];
    assert.ok(!/host\.scrollTop = Math\.max/.test(go),
      'a bare assignment under a smooth rule is a request to animate');
    assert.match(go, /ceRestoreScroll\(host, Math\.max\(0, host\.scrollTop \+ \(tb\.top - hb\.top\) - want\)\)/,
      'the same arithmetic, through the one thing on this page that moves the '
      + 'paper — so there is a single answer to "does the contract animate"');
  });

  test('AND A MOVE KEEPS THE READER\'S PLACE — only an arrival places a clause', () => {
    /* ---- OWNER-REPORTED 1 Sep 2026 ----
       "when I click on the pencil the clause being edited should stay where it
       is as opposed to being pushed all the way to the top of the page ... I
       should always make the decision to scroll and not be moved without my
       choosing to do so."

       Moving between clauses closes and reopens this page, so the ARRIVAL
       placement ran on every move. It is right for a page that did not exist a
       frame ago and wrong every time it runs on a move inside one. */
    const go = CODE.match(/function ceScrollToClause\([\s\S]*?\n\}/)[0];
    assert.match(go, /function ceScrollToClause\(placeAt\)/,
      'the placement takes the reader\'s own offset where there is one');
    assert.match(go, /const want = \(placeAt == null\) \? 24 : placeAt;/,
      'and 24 is reached only on an arrival, or on a move to a clause that was '
      + 'not on screen to keep a place on');
    /* THE ANCHOR IS THE TARGET CLAUSE'S OWN TOP, not the scroller's number: the
       clause being left grows (its marks come back) and the clause being
       entered shrinks (its marks go), so everything below the first one moves
       and a remembered number would land somewhere else. */
    assert.match(CODE, /_cePlaceAt = ceClauseTopNow\(clauseId\);/,
      'measured on the clause being moved TO, before the page is torn down');
    const now = CODE.match(/function ceClauseTopNow\([\s\S]*?\n\}/)[0];
    assert.match(now, /return \(top >= 0 && top <= hb\.height\) \? top : null;/,
      'and null where it is off screen — a jump from the clause list has no '
      + 'place to keep, so it falls through to the arrival placement');
    /* CONSUMED ON ARRIVAL, never stored: an ask that outlived its press is the
       fault the typing ask records in its own note. */
    assert.match(CODE, /const placeAt = _cePlaceAt; _cePlaceAt = null;/,
      'read once into a local and cleared, beside the typing ask it copies');
  });

  test('and both callers land: arriving, and moving to another clause', () => {
    /* Neither is a journey. Arriving opens a full-window layer that did not
       exist a frame ago, so there is no position to travel FROM; ceGoClause
       re-seeds the draft and re-renders the paper first, so a glide would
       animate between two unrelated documents. */
    const callers = (CODE.match(/ceScrollToClause\([a-zA-Z]*\)/g) || []).length;
    assert.ok(callers >= 2, 'both call sites are still there: ' + callers);
    assert.ok(!/scrollIntoView/.test(CODE),
      'and nothing on this page reaches for scrollIntoView, which animates '
      + 'under the same rule and cannot be suspended');
  });

  test('the stylesheet rule is NOT removed', () => {
    /* It is what makes the reader's own scrolling behave, and what makes the
       negotiation page's rlLinkFocus read as a journey to its clause across a
       document that has not moved. */
    const neg = read('js/views/negotiation.js');
    assert.match(neg, /scroll-behavior:\s*smooth/,
      'the smooth rule stands; what changed is which writes are exempt from it');
  });
});
