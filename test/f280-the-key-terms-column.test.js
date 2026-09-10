/* ============================================================================
   F280 — THE KEY TERMS COLUMN, AND A READING THAT WAS NOT KEPT
   ----------------------------------------------------------------------------
   Three of the owner's thirteen (10 Sep 2026), and two of them are one fault:

     · "In the key terms tab, it looks like buttons and cards are not aligned
       and they overlay on each other or buttons are not in the cards they are
       supposed to be in."
     · "contract brief in the top highlight says brief written but as you can
       see on the bottom highlighted area on the contract brief, I had to click
       write brief for a second time. This should not be the case if it was
       already written before."

   THE OVERLAP WAS FLEX-SHRINK. Every card in that column carries min-height:0
   and the column gave them `flex:0 1 auto` — do not grow, DO SHRINK — so a
   column whose cards add up to more than the height available did not scroll:
   flexbox shrank each card below the height its own content needs and the
   content spilled out over the card beneath. MEASURED on the reported shape at
   1500x720: the column needed 492px and had 457, the brief card was squeezed to
   75 against the 96 its content needs, and its button hung 21px below its own
   card and 9px into the Agreement family card — which is the screenshot, where
   the word "Write" sits on top of the heading "Agreement family".

   THE BRIEF WAS TWO TRUTHS THAT READ AS A CONTRADICTION. A brief the provider
   cut short is deliberately NOT written to the briefs table — the route's own
   note says why — so it lives for one sitting and is gone when the contract is
   read back. The triage record is DURABLE, so the strip went on saying the
   brief was written for ever while the card beside it correctly said there was
   none. REPRODUCED end to end against a real server with a provider scripted to
   cut the answer short: after the run c._brief is set; after reopening the
   contract it is gone and checkVerdict answers null.

   WHAT LIVES HERE is the rule, the words and the READING — the tile is a pure
   function of the step, so "the strip stops claiming a brief" is asserted as
   that relation rather than as one rendering of it. That the boxes really stop
   overlapping is a measurement on a rendered page (amendment-journey-verify),
   because flex-shrink has no answer until something is laid out.
   ========================================================================== */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { buildWorld } = require('./world.js');
const { startHati, seedWorkspace, startScriptedAi } = require('./helpers');

const HTML = fs.readFileSync('index.html', 'utf8');
const TRIAGE = fs.readFileSync('js/triage.js', 'utf8');
const I18N = fs.readFileSync('js/i18n.js', 'utf8');

/* ---------------------------------------------------------------- 1 */
test('f280 (1) a card in the Key terms column cannot be crushed', () => {
  const rule = /\.terms-grid #kt-side > \*\{([^}]*)\}/.exec(HTML);
  assert.ok(rule, 'the column states how its children size');
  assert.match(rule[1], /flex:0 0 auto/,
    'do not grow, DO NOT SHRINK — the card takes its content height');
  /* THE OLD VALUE IS GONE rather than overridden further down: a second
     opinion about shrink is how this comes back. */
  assert.ok(!/#kt-side > \.kt-side-card\{[^}]*flex:0 1 auto/.test(HTML),
    'the shrinking rule it replaced is gone');
  /* IT IS THE WHOLE COLUMN, not only .kt-side-card. #renewal-host is a plain
     div and carried the default shrink of 1, so it could be crushed the same
     way by a card added later. */
  assert.ok(!/#kt-side > \.kt-side-card\{/.test(HTML),
    'the rule names every child, not one class of them');
});

/* ---------------------------------------------------------------- 2 */
test('f280 (2) and the column is still the thing that scrolls', () => {
  /* THE OTHER HALF OF THE SAME CLAIM. Cards that cannot shrink are only safe
     because the column they sit in can scroll — otherwise the fix would trade
     an overlap for content pushed off the bottom of the page. */
  const col = /\.terms-grid #kt-side\{([^}]*)\}/.exec(HTML);
  assert.ok(col, 'the column has its own rule');
  assert.match(col[1], /overflow-y:auto/, 'and it scrolls inside itself');
  assert.match(col[1], /min-height:0/, 'with a bound to scroll inside');
  /* THE CARD'S OWN INNER RULES ARE UNTOUCHED: a card is still a flex column so
     a list inside it can scroll within whatever height the card ends up with. */
  assert.match(HTML, /\.kt-side-card\{ display:flex; flex-direction:column; min-height:0; flex:1; \}/,
    'the card is still a flex column');
});

/* ---------------------------------------------------------------- 3 */
test('f280 (3) a brief that was cut short is not recorded as written', () => {
  const step = TRIAGE.slice(TRIAGE.indexOf('const o = { quiet: true };'),
                            TRIAGE.indexOf('3 — OUR STANDARDS'));
  assert.ok(/r && r\.truncated/.test(step),
    'the cut-short answer is read off the brief the route returned');
  assert.ok(/ok: false,\s*\n?\s*why: \(typeof i18t === 'function'\) \? i18t\('tri_brief_cut'\)/
    .test(step), 'and recorded as NOT done, with its reason');
  /* ORDER MATTERS: the truncated branch has to be asked BEFORE the ordinary
     success one, or an answer that was cut short still lands as written. */
  assert.ok(step.indexOf('r.truncated') < step.indexOf('ok: true, line: triageBriefLine'),
    'the truncated case is asked before the ordinary one');
  /* AND THE SUMMARY LINE GOES WITH IT. A one-line précis of a brief nobody can
     open is the contradiction this fixes rather than a consolation for it. */
  const cut = step.slice(step.indexOf('r.truncated'), step.indexOf('ok: true'));
  assert.ok(!/triageBriefLine/.test(cut),
    'a cut-short step carries no summary of something that is not there');
});

/* ---------------------------------------------------------------- 4 */
test('f280 (4) and the caching rule it rests on is untouched', () => {
  const SRV = fs.readFileSync('server/server.js', 'utf8');
  /* THE RULE IS RIGHT AND IS NOT WHAT CHANGED. A cut-short brief is not
     written at all, so the next press asks again rather than the reader being
     handed a permanent half-answer. What was wrong is the SUMMARY claiming a
     reading the record does not hold. */
  assert.match(SRV, /if \(!resp\.truncated\)\s*\n\s*db\.prepare\('INSERT INTO briefs/,
    'a cut-short brief is still not cached');
  assert.match(SRV, /truncated: !!resp\.truncated/,
    'and the flag still travels with the record, so the reader can be told');
});

/* ---------------------------------------------------------------- 5 */
test('f280 (5) both languages carry the sentence', () => {
  assert.equal(I18N.split(/\btri_brief_cut:/).length - 1, 2,
    'tri_brief_cut is in BOTH languages');
  /* IT NAMES THE ONE THING THE READER CAN ACT ON. A reason that only says what
     went wrong leaves them where the contradiction did. */
  const en = (I18N.match(/\n\s*tri_brief_cut: '([^']*)'/) || [])[1] || '';
  assert.ok(/again/i.test(en), 'the sentence says to run it again: ' + en);
});

/* ============================================================================
   6 · DRIVEN — what triage records for each kind of answer
   ==========================================================================*/
function triStage(){
  const { win } = buildWorld({ triage: true });
  win.FOLDERS = { proc: { name: 'Supply & Logistics' } };
  const c = { id: 'MK-407', name: 'Nordkust supply agreement', status: 'Under Review',
    source: 'upload', folder: 'proc', audit: [], obligations: [], comments: [],
    upload: { name: 'Supply.docx', extractedText:
      'The Supplier shall deliver the Goods within thirty (30) days of each purchase order. '
      + 'Payment terms are sixty (60) days from invoice. This Agreement is governed by Swedish law. '
      + 'Each party shall keep the other\'s information confidential for five (5) years.' } };
  win.state.contracts = [c];
  return { win, c };
}

describe('f280 (6) — a cut-short brief, driven', () => {
  test('an ordinary brief is still recorded as written, with its line', async () => {
    /* THE CONTROL, and it comes first: without it "not recorded" is satisfied
       by a stage where nothing records anything. */
    const { win, c } = triStage();
    win._ai.brief = { truncated: false, data: { overview: 'A logistics contract between two parties.' } };
    const t = await win.triageRun(c);
    assert.equal(t.steps.brief.ok, true, 'a whole answer is written');
    assert.ok(t.steps.brief.line, 'and the strip carries its summary');
  });

  test('a cut-short one is NOT — the reported contradiction', async () => {
    const { win, c } = triStage();
    win._ai.brief = { truncated: true, data: { overview: 'A logistics contract between two parties.' } };
    const t = await win.triageRun(c);
    assert.equal(t.steps.brief.ok, false,
      'the strip may not say written about a brief the record does not hold');
    assert.ok(/again/i.test(t.steps.brief.why || ''),
      'and it says the one thing the reader can act on: ' + t.steps.brief.why);
    assert.ok(!t.steps.brief.line,
      'with no summary of a brief nobody can open');
  });

  test('and the strip\u2019s own tile follows, by construction', async () => {
    /* THE TILE IS A READING OF THE STEP, so this is the relation rather than a
       second copy of the rule: a step recorded not-done draws the "could not"
       head and prints its reason, wherever it is drawn. What a rendered page
       adds is only that it is on screen, which auto-triage-verify already asks
       of every tile. */
    const { win, c } = triStage();
    win._ai.brief = { truncated: true, data: { overview: 'x' } };
    await win.triageRun(c);
    const tile = win.triageTiles(c).find(t => t.key === 'brief');
    assert.ok(tile, 'the brief has a tile');
    assert.equal(tile.ok, false, 'and it does not draw as done');
    assert.equal(tile.headKey, win.TRIAGE_HEADS.brief.no,
      'it takes the could-not head, not the written one');
    assert.ok(/again/i.test(tile.detail || ''),
      'and prints the reason under it: ' + tile.detail);
  });

  test('and the other three readings are untouched by it', async () => {
    /* THE NARROWNESS IS THE CLAIM. A cut-short brief must not read as a failed
       triage — the strip's headline asks whether ANYTHING was read. */
    const { win, c } = triStage();
    win._ai.brief = { truncated: true, data: { overview: 'x' } };
    const t = await win.triageRun(c);
    for (const k of ['risk', 'playbook', 'oblig'])
      assert.equal(t.steps[k].ok, true, k + ' still ran');
    assert.equal(win.triageReadAnything(c), true,
      'and the card still says this contract was read');
  });
});

/* ============================================================================
   7 · AGAINST A REAL SERVER — the reproduction the rest of this rests on
   ----------------------------------------------------------------------------
   A cut-short answer is the one thing a stand-in that can only produce COMPLETE
   answers could never reproduce, which is why f231 taught the harness to cut one
   short. Both halves are asserted, in this order: an ordinary brief IS kept, so
   "nothing was kept" cannot pass against a server that keeps nothing.
   ==========================================================================*/
describe('f280 (7) — a cut-short brief is not kept', () => {
  const WORDING = 'This Supply Agreement is made between Highland Corporate Ltd and Kabras '
    + 'Sugar. The Supplier shall deliver each consignment within thirty (30) days of the '
    + 'purchase order. The Buyer shall pay each invoice within forty-five (45) days of '
    + 'receipt. Either party may terminate on ninety (90) days written notice.';
  const BRIEF = (over) => [{ type: 'tool_use', id: 'tu_b', name: 'contract_brief',
    input: { overview: over, watchouts: [], unusual: [], term: {}, money: {} } }];

  test('a whole one comes back and is still there on the next read', async () => {
    const ai = await startScriptedAi();
    const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    try {
      const W = await seedWorkspace(h);
      ai.reset();
      ai.script({ content: BRIEF('A supply agreement between two parties.'), stopReason: 'end_turn' });
      const r = await W.admin.json('/api/ai/brief',
        { method: 'POST', body: { id: 'MK-A2', text: WORDING, force: true } });
      assert.equal(r.brief.truncated, false, 'a whole answer says so');
      assert.equal(r.notice, undefined, 'and carries no warning');
      const again = await W.admin.json('/api/contracts/MK-A2');
      assert.ok(again._brief, 'and the contract comes back carrying it');
    } finally { await h.stop(); await ai.stop(); }
  });

  test('a cut-short one is handed back once and never again', async () => {
    const ai = await startScriptedAi();
    const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    try {
      const W = await seedWorkspace(h);
      ai.reset();
      ai.script({ content: BRIEF('A supply agreement between'), stopReason: 'max_tokens' });
      const r = await W.admin.json('/api/ai/brief',
        { method: 'POST', body: { id: 'MK-A2', text: WORDING, force: true } });
      assert.equal(r.brief.truncated, true, 'the answer says it was cut short');
      assert.ok(r.notice, 'and the reader is told, on this one response');
      /* AND IT WAS NOT KEPT — the whole reason the strip may not claim a brief
         was written. This is the reported contradiction as a fact about the
         record rather than as a screenshot. */
      const again = await W.admin.json('/api/contracts/MK-A2');
      assert.ok(!again._brief,
        'the contract comes back with no brief on it — nothing was cached');
    } finally { await h.stop(); await ai.stop(); }
  });
});

/* ============================================================================
   8 · THE TILE ASKS THE BRIEF, NOT A NOTE ABOUT IT (owner-reported 10 Sep 2026)
   ----------------------------------------------------------------------------
   *"The Key terms strip and the Contract brief card contradict each other."*
   One contract, two boxes, opposite answers: the strip said "Brief written —
   … — part of it was cut short" and the card four inches below said "Not
   written yet" with a Write the brief button.

   IT IS NOT THE BUG SECTION 6 FIXED. That one changed how a NEW run RECORDS a
   cut-short brief, and it cannot reach a note already on file: every contract
   read before it carries `{ ok:true, line, cut }` for ever. So that fix was
   right and incomplete, and the half that was missing is a READING — the tile
   asks whether there IS a brief and falls back to the note only where there is
   nothing to look at. Nothing is repaired and nothing is migrated: an old
   wrong note is simply not read.

   THE FIRST FOUR HERE FAIL AGAINST THE COMMIT BEFORE IT. The last three are
   named CONTROLS that pass either way — their job is to fail the day somebody
   sweeps the live reading wider than it should go.
   ==========================================================================*/
function tileStage(over){
  const { win } = buildWorld({ triage: true });
  win.FOLDERS = { proc: { name: 'Supply & Logistics' } };
  const c = Object.assign({ id: 'MK-379', name: 'Logistics agreement',
    status: 'Under Review', source: 'upload', folder: 'proc',
    audit: [], obligations: [], comments: [] }, over || {});
  win.state.contracts = [c];
  return { win, c, tile: () => win.triageTiles(c).find(t => t.key === 'brief') };
}
/* MK-379's OWN SHAPE — read on 9 Sep by the code of the day, so the note says
   the brief was written and carries its summary. The brief itself was never
   kept, so on the next read there is none. */
const OLD_NOTE = () => ({ triage: { at: Date.now(), by: 'Young', steps: {
  brief: { ok: true, line: 'This is a logistics contract between two parties.', cut: 'x' },
  risk: { ok: true, open: 0 },
  playbook: { ok: true, dev: 1, miss: 0, cats: ['Payment terms'] },
  oblig: { ok: true, found: [{ desc: 'Deliver within thirty (30) days' }] } } } });

describe('f280 (8) — the strip and the card cannot disagree', () => {
  test('an old note claiming a brief the record does not hold is not believed', () => {
    /* THE REPORTED SCREEN. */
    const { tile, win } = tileStage(OLD_NOTE());
    const t = tile();
    assert.equal(t.ok, false,
      'the strip may not say written about a brief there is none of');
    assert.equal(t.headKey, win.TRIAGE_HEADS.brief.no,
      'it takes the No brief head');
    assert.ok(!/logistics contract between/.test(t.detail || ''),
      'and does not print a summary of a brief nobody can open: ' + t.detail);
  });

  test('and the way forward is on it', () => {
    const { tile } = tileStage(OLD_NOTE());
    assert.ok(/tri_brief_none|None on file/.test(tile().detail || ''),
      'with no reason on the record it says there is none and where to write one');
  });

  test('a brief with no note at all reads as written', () => {
    /* THE MIRROR, and it is what makes the tile go green BY ITSELF on a
       contract whose brief a person writes later — which it could not do while
       it read a note written once at upload. */
    const { tile, win } = tileStage({ _brief: { at: '2026-09-10T09:00:00Z',
      data: { overview: 'A logistics contract between two parties.' } },
      triage: { at: Date.now(), by: 'Young', steps: { risk: { ok: true, open: 0 } } } });
    const t = tile();
    assert.equal(t.ok, true, 'there is a brief, so the tile says so');
    assert.equal(t.headKey, win.TRIAGE_HEADS.brief.ok, 'and takes the written head');
    assert.ok(/logistics contract/.test(t.detail || ''),
      'and its line comes from the brief itself: ' + t.detail);
  });

  test('a light row says written and draws no line', () => {
    /* THE TRAP THE PAIR EXISTS FOR. `_brief` rides the SINGLE contract's GET
       and `_hasBrief` is the boolean the LIST route attaches, so a tile reading
       `_brief` alone is right locally and wrong in server mode — this
       codebase's recorded defect class. There is nothing to draw a line from
       here, and a stored line may describe an older brief. */
    const { tile } = tileStage(Object.assign(OLD_NOTE(), { _hasBrief: true }));
    const t = tile();
    assert.equal(t.ok, true, 'the list’s own boolean is believed');
    assert.equal(t.detail, '', 'and nothing is invented to put under it: ' + t.detail);
  });

  test('the line is the brief’s, never the stored one', () => {
    const { tile } = tileStage(Object.assign(OLD_NOTE(),
      { _brief: { data: { overview: 'A haulage contract for the northern route.' } } }));
    const t = tile();
    assert.ok(/haulage contract/.test(t.detail || ''),
      'it reads the brief on the record: ' + t.detail);
    assert.ok(!/logistics contract between/.test(t.detail || ''),
      'never the line the note happens to carry');
  });

  test('the cap does not ride a brief written later', () => {
    /* THE VERY NEXT STATE OF THE VERY CONTRACT REPORTED. The reader presses
       Write the brief from the card, it comes back whole — and the note still
       says the run it describes was capped. Left riding the tile, the strip
       would say the new brief was cut short when it was not: this section's
       own fault, one size smaller. */
    const { tile } = tileStage(Object.assign(OLD_NOTE(),
      { _brief: { data: { overview: 'A haulage contract for the northern route.' } } }));
    assert.ok(!/tri_cut|cut short/.test(tile().detail || ''),
      'a newer brief does not wear the old run\u2019s warning: ' + tile().detail);
  });

  /* ---- the three controls ---- */
  test('CONTROL \u2014 but it IS drawn over the brief the note describes', () => {
    /* Which is what the cap is for, and what would be lost by dropping it: an
       auto-triage run reads quietly, so the strip is the only place a capped
       reading is ever said. Same brief, same line, so the warning stands. */
    const LINE = 'This is a logistics contract between two parties.';
    const { tile } = tileStage(Object.assign(OLD_NOTE(),
      { _brief: { data: { overview: LINE } } }));
    const t = tile();
    assert.equal(t.ok, true, 'there is a brief');
    assert.ok(/tri_cut|cut short/.test(t.detail || ''),
      'and the run that wrote it is still reported as capped: ' + t.detail);
  });

  test('CONTROL — the busy state still wins, with a brief and without', () => {
    for (const extra of [{}, { _brief: { data: { overview: 'A logistics contract.' } } }]){
      const { tile, win } = tileStage(Object.assign({ _triaging: true,
        triage: { at: Date.now(), by: 'Young', steps: {} } }, extra));
      const t = tile();
      assert.equal(t.working, true, 'a reading still in flight reads as working');
      assert.equal(t.headKey, win.TRIAGE_HEADS.brief.ing, 'and takes the working head');
      assert.equal(t.detail, '', 'with nothing under it');
      assert.equal(t.count, null, 'and no count');
    }
  });

  test('CONTROL — the other three tiles still read their note', () => {
    /* THE NARROWNESS IS THE CLAIM. Obligations are HELD on the triage record
       and filed nowhere else, so that tile has no second store to ask; the
       standards and risk readings are on the contract itself and move with it.
       Only the brief has a store that can outlive the note about it. */
    const { win, c } = tileStage(OLD_NOTE());
    const tiles = win.triageTiles(c);
    for (const k of ['playbook', 'oblig'])
      assert.equal(tiles.find(t => t.key === k).ok, true, k + ' still reads its note');
  });

  test('CONTROL — the headline is a different question and is not swept', () => {
    /* `triageReadAnything` asks whether ANYTHING was read at all, off the
       STORED steps. A contract whose brief is gone was still read. */
    const { win, c } = tileStage(OLD_NOTE());
    assert.equal(win.triageReadAnything(c), true,
      'the strip still says this contract was read');
  });
});
