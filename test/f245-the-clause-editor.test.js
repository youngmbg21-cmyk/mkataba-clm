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
