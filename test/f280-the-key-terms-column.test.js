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
/* ---- REVERSED IN PLACE 10 Sep 2026, because its PREMISE is gone ----
   It pinned that a cut-short brief is recorded as NOT DONE with no summary,
   which was right while such a brief was thrown away: a précis of something
   nobody can open is a note claiming a reading the record does not hold. The
   owner has ruled that a written brief survives a refresh, so the route keeps
   it now — and a step saying "not done" over a brief the record really holds
   would be the same contradiction pointing the other way.

   WHAT THE CLAIM WAS REALLY ABOUT IS UNCHANGED AND IS WHAT IS PINNED: the note
   and the thing it describes must agree. */
test('f280 (3) a brief that was cut short is recorded as done, and as partial', () => {
  const step = TRIAGE.slice(TRIAGE.indexOf('const o = { quiet: true };'),
                            TRIAGE.indexOf('3 — OUR STANDARDS'));
  assert.ok(/r\.truncated/.test(step),
    'the cut-short answer is still read off the brief the route returned');
  assert.ok(/ok: true, line: triageBriefLine\(r\)/.test(step),
    'and recorded as DONE, with the line off the brief that exists');
  assert.ok(/cut: o\.notice \|\| \(r\.truncated/.test(step),
    'with the cap said beside it rather than instead of it');
  assert.ok(!/i18t\('tri_brief_cut'\)/.test(step),
    'and nothing records it as "not kept", which is no longer what happens');
});

/* ---------------------------------------------------------------- 4 */
/* ---- REVERSED IN PLACE 10 Sep 2026, and the half that mattered is kept ----
   This pinned "a cut-short brief is not cached at all". The owner has ruled the
   other way — "once the brief is written, when I refresh the page I should not
   lose the previously created brief until I choose to rerun the brief" — so the
   row IS written now. WHAT THE OLD RULE WAS REALLY FOR is that a partial memo
   must never be served as a COMPLETE one, for ever, with no notice; that is
   what the flag is for, and it is what this claim pins instead. */
test('f280 (4) a cut-short brief is kept, and kept MARKED', () => {
  const SRV = fs.readFileSync('server/server.js', 'utf8');
  assert.ok(!/if \(!resp\.truncated\)\s*\n\s*db\.prepare\('INSERT INTO briefs/.test(SRV),
    'the row is no longer withheld — a written brief survives a refresh');
  assert.match(SRV, /truncated: !!resp\.truncated/,
    'and the flag travels ON the record, so a CACHED read carries the cut — '
    + 'which is the exact thing the old rule said a cached read could not do');
  /* The flag is on the object that is written, not beside it. */
  const at = SRV.indexOf("const brief = { v: 1, at: now()");
  const w = SRV.slice(at, SRV.indexOf('res.json({ brief', at));
  assert.ok(/truncated: !!resp\.truncated/.test(w) && /INSERT INTO briefs/.test(w)
    && !/if \(!resp\.truncated\)/.test(w),
    'the marked brief is what goes into the table, unconditionally');
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

  /* ---- REVERSED IN PLACE 10 Sep 2026, with the 3rd — same reason ----
     A cut-short brief is KEPT now, so the note that describes it says so
     rather than saying it is not there. */
  test('a cut-short one is recorded as done AND as partial', async () => {
    const { win, c } = triStage();
    win._ai.brief = { truncated: true, data: { overview: 'A logistics contract between two parties.' } };
    const t = await win.triageRun(c);
    assert.equal(t.steps.brief.ok, true,
      'there IS a brief on the record, so the note says so');
    assert.ok(/logistics contract/.test(t.steps.brief.line || ''),
      'with its summary, off the brief that exists: ' + t.steps.brief.line);
    assert.ok(t.steps.brief.cut,
      'and the cap said BESIDE it rather than instead of it — half a memo '
      + 'served as a whole one is the fault the old rule was written for');
  });

  test('and the strip\u2019s own tile follows, by construction', async () => {
    /* THE TILE READS THE BRIEF ITSELF and falls back to the note only where
       there is nothing to look at, so this is the relation rather than a second
       copy of the rule: a brief on the record draws as written, and its own
       truncated flag is what puts the cut under it. */
    const { win, c } = triStage();
    win._ai.brief = { truncated: true, data: { overview: 'A haulage contract.' } };
    await win.triageRun(c);
    const tile = win.triageTiles(c).find(t => t.key === 'brief');
    assert.ok(tile, 'the brief has a tile');
    assert.equal(tile.ok, true, 'it draws as written, because one is there to open');
    assert.equal(tile.headKey, win.TRIAGE_HEADS.brief.ok, 'with the written head');
    assert.match(tile.detail || '', /cut short|klipptes/i,
      'and says the answer was cut short: ' + tile.detail);
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

  /* ---- REVERSED IN PLACE 10 Sep 2026 ---- It asserted the brief was thrown
     away. Owner-ruled the other way: it is kept, and marked, and every surface
     that reads it says it is partial. */
  test('a cut-short one is kept, and comes back still saying it is partial', async () => {
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
      /* THE REPORTED FAULT: "the brief is written and readable; refresh and the
         card is back to Not written yet." */
      const again = await W.admin.json('/api/contracts/MK-A2');
      assert.ok(again._brief, 'the contract comes back carrying it — a written '
        + 'brief survives a refresh');
      assert.equal(again._brief.truncated, true,
        'AND THE CACHED READ CARRIES THE CUT, which is the whole condition on '
        + 'keeping it: half a memo served as a whole one is the fault the old '
        + 'rule was written for');
      /* A SECOND READ IS THE CACHE, not another call — so the flag has to
         survive the round trip through the table rather than only the response
         it was minted on. */
      const again2 = await W.admin.json('/api/ai/brief',
        { method: 'POST', body: { id: 'MK-A2', text: WORDING } });
      assert.equal(again2.cached, true, 'served from the table');
      assert.equal(again2.brief.truncated, true, 'and still says it is partial');
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

/* ============================================================================
   9 · A WRITTEN BRIEF SURVIVES A REFRESH (owner-reported 10 Sep 2026)
   ----------------------------------------------------------------------------
   "The brief is written and readable; refresh and the card is back to Not
   written yet."

   TWO HALVES, AND THE FIRST IS THE CAUSE. max_tokens was 1400 against a schema
   asking for an overview, three term strings, two money strings, SIX watchouts
   each carrying a plain sentence AND a verbatim quote, and four unusual terms —
   about 1,550 tokens at its own face value, so a thorough brief truncated BY
   CONSTRUCTION rather than rarely. The obligations reader learned exactly this
   and its ceiling is derived from its own schema; so is this one.

   THE SECOND IS THE PROMISE. Owner-ruled: a written brief is not lost until the
   reader chooses to run it again. So a cut-short brief is KEPT, MARKED, and
   every surface that reads one says it is partial — which is the exact thing
   the rule it replaces said a cached read could not do.
   ==========================================================================*/
describe('f280 (9) — a written brief survives a refresh', () => {
  const SRV = fs.readFileSync('server/server.js', 'utf8');
  const briefRoute = () => {
    const at = SRV.indexOf("app.post('/api/ai/brief'");
    return SRV.slice(at, SRV.indexOf("app.post('", at + 40));
  };

  test('the ceiling has room for the answer this schema asks for', () => {
    const route = briefRoute();
    const m = route.match(/max_tokens: (\d+),/);
    assert.ok(m, 'could not read the brief token ceiling');
    /* DERIVED FROM THE SCHEMA, NOT PICKED — and pinned to the schema so the
       two cannot drift. Per watchout: a plain sentence plus a verbatim quote
       plus its two JSON keys, ~150 tokens. Per unusual term, ~50. And BOTH
       list budgets are DOUBLED, because maxItems is ADVISORY rather than a
       cap: this codebase MEASURED the obligations reader returning 40 items
       against a stated 20. On top of the lists, the overview, the term and
       money strings and the JSON wrapper, ~450. */
    const watch = Number(route.match(/watchouts: \{ type: 'array', maxItems: (\d+)/)[1]);
    const odd = Number(route.match(/unusual: \{ type: 'array', maxItems: (\d+)/)[1]);
    const need = watch * 150 * 2 + odd * 50 * 2 + 450;
    assert.ok(Number(m[1]) >= need,
      `${watch} quoted watchouts and ${odd} unusual terms do not fit in ${m[1]} tokens `
      + `(needs about ${need})`);
  });

  test('output headroom is free, so the ceiling is not a cost decision', () => {
    /* Said out loud because it is the reason the number can be generous:
       output is billed as used. What an answer cut off costs is the whole
       answer. */
    assert.match(briefRoute(), /billed as used/i,
      'the reasoning is written beside the number');
  });

  test('every surface that reads a brief says when it is partial', () => {
    /* Bug Fix Rule 2: find every place it appears. Four read a brief — the
       panel, the Key terms card, the phone, and the strip's own tile. */
    const AI = fs.readFileSync('js/ai.js', 'utf8');
    const CT = fs.readFileSync('js/views/contract.js', 'utf8');
    const MO = fs.readFileSync('js/mobile-contract.js', 'utf8');
    const TR = fs.readFileSync('js/triage.js', 'utf8');
    assert.match(AI, /b\.truncated\?`<p class="br-cut">/,
      'the panel says it, above the Rewrite button that answers it');
    assert.match(CT, /const cut=!!\(v&&c\._brief&&c\._brief\.truncated\)/,
      'the Key terms card reads the flag');
    assert.match(CT, /i18t\('br_partial_sub'\):i18t\('br_kt_sub'\)/,
      'and its sub-line says what is missing rather than describing a whole brief');
    assert.match(MO, /c\._brief&&c\._brief\.truncated/, 'and the phone says it too');
    assert.match(TR, /brief\.truncated/,
      'and the strip’s tile asks the brief’s own flag first');
  });

  test('a partial brief carries the way forward on the card itself', () => {
    const CT = fs.readFileSync('js/views/contract.js', 'utf8');
    assert.match(CT, /cut&&may\?`<button type="button" data-kt-brief="run"[\s\S]{0,180}br_rewrite/,
      'Write it again sits beside Read the brief — not a sentence pointing '
      + 'somewhere else');
    /* AND EVERY BUTTON ON THE CARD IS WIRED. A partial brief draws two, and a
       bare querySelector would wire the first and leave the second dead. */
    assert.match(CT, /const list=\[\.\.\.document\.querySelectorAll\('\[data-kt-brief\]'\)\]/,
      'the wiring takes them all');
    assert.match(CT, /runContractBrief\(c,\{force:!!c\._brief\}\)/,
      'and a rewrite forces, or the cache hands back the same partial memo');
  });

  test('THE PAIR: a cached cut-short brief reads as written AND as partial', () => {
    /* The state MK-382 is actually in once both halves ship, and the one thing
       to get right between them: Job 4 makes a brief EXIST where it did not, so
       Job 3's tile finds one and would say "written" — dropping the very fact
       that matters. */
    const { tile, win } = tileStage({ triage: { at: Date.now(), by: 'Young', steps: {
        brief: { ok: false, why: 'Copilot request failed: fetch failed' },
        playbook: { ok: true, dev: 1, miss: 0, cats: ['Payment terms'] } } },
      _brief: { at: Date.now(), truncated: true,
        data: { overview: 'A logistics contract between two parties. It runs a year.' } } });
    const t = tile();
    assert.equal(t.ok, true, 'there IS a brief to open, so the tile says so');
    assert.equal(t.headKey, win.TRIAGE_HEADS.brief.ok, 'with the written head');
    assert.match(t.detail || '', /cut short|klipptes/i,
      'and it says the answer was cut short: ' + t.detail);
    assert.match(t.detail || '', /logistics contract/,
      'beside the line the brief itself yields — never a stored one');
  });

  test('CONTROL — a WHOLE cached brief says nothing about a cut', () => {
    const { tile } = tileStage({ triage: { at: Date.now(), by: 'Young', steps: {
        brief: { ok: false, why: 'Copilot request failed: fetch failed' } } },
      _brief: { at: Date.now(), truncated: false,
        data: { overview: 'A logistics contract between two parties.' } } });
    const t = tile();
    assert.equal(t.ok, true);
    assert.ok(!/cut short|klipptes/i.test(t.detail || ''),
      'a warning that is always there is one nobody reads: ' + t.detail);
  });

  test('CONTROL — the reported direction: a failed note over a brief that exists', () => {
    /* Job 3's own screen. It passes before AND after, because the live reading
       shipped on 10 Sep; what was still missing was that nothing REPAINTED the
       strip after the press, which only a rendered page can answer. */
    const { tile, win } = tileStage({ triage: { at: Date.now(), by: 'Young', steps: {
        brief: { ok: false, why: 'Copilot request failed: fetch failed' } } },
      _brief: { at: Date.now(),
        data: { overview: 'A logistics contract between two parties.' } } });
    assert.equal(tile().ok, true, 'the strip may not say No brief over one that opens');
    assert.equal(tile().headKey, win.TRIAGE_HEADS.brief.ok);
  });

  test('and the press repaints the strip, not only the column', () => {
    /* MEASURED as the cause: wireKtBriefCard called renderKeyTermsSide and
       nothing else, so the card knew and the strip four inches above did not.
       Called BARE — all three live in this file, and js/views/contract.js does
       not export renderKeyTermsSide, so a window guard would have been false
       for exactly the one being added. */
    const CT = fs.readFileSync('js/views/contract.js', 'utf8');
    const at = CT.indexOf('function wireKtBriefCard');
    const fn = CT.slice(at, CT.indexOf('\nfunction renderKeyTermsSide', at));
    assert.match(fn, /renderKeyTermsSide\(c\)/, 'the column repaints');
    assert.match(fn, /\{ paintKtTriage\(c\); \}/,
      'and so does the strip — both halves, or the reader still has to leave '
      + 'the page to see the two agree');
  });

  test('both languages carry the partial sentence', () => {
    for (const k of ['br_partial', 'br_partial_sub'])
      assert.equal(I18N.split(new RegExp('\\b' + k + ':')).length - 1, 2,
        k + ' is in BOTH languages');
    const en = (I18N.match(/\n\s*br_partial_sub: "([^"]*)"/) || [])[1] || '';
    assert.ok(/again/i.test(en), 'and names what to do about it: ' + en);
  });
});
