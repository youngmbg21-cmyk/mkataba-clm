/* f269 — the negotiation memo
   ===========================
   Owner-asked (9 Sep 2026). One page on demand: what is agreed, what is still
   open, what we gave up, what is blocking, and whose move it is.

   THE CLAIM THIS FILE REALLY GUARDS IS THE ONE THE OWNER'S OWN NOTE LEADS
   WITH — "built from the record, so it cannot flatter." Everything below is a
   way that promise could quietly stop being true:

   · NOTHING IS WRITTEN BY A MODEL. No route, no spend, no key needed. The one
     advisory line is precedentLine's, which is deterministic counting over
     this workspace's own settled rounds — so it is drawn as what it is and
     never badged as advice from a model.
   · EVERY LINE IS QUOTED FROM THE RECORD. `summary` is the proposer's own
     sentence or the mechanical one built from stored ops; `clauseLabel` is the
     label stamped at filing. Machine-written prose about a legal change is the
     one thing this must not produce, because a reader would act on it.
   · IT READS WITHOUT WRITING. negoChanges, negoAllChanges and negoRound all
     call negoInit, which creates a negotiation and stamps clause ids into the
     document. A memo that started a negotiation by being read would be the
     worst possible version of this feature.
   · IT DECIDES NOTHING AND FILES NOTHING. It is a reading; the moment it can
     move the record it stops being safe to open on anything.
   · AND WHOSE MOVE IS BORROWED, NEVER RE-DERIVED — one reading, two readers,
     or the Negotiations row and the memo about that same contract come to
     disagree about whose turn it is. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const SRC = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
const NEG = SRC('views/negotiation.js');

const W = (opts = {}) => {
  const w = buildWorld({ registerView: true, negotiationView: true, contractView: true, ...opts }).win;
  w.state = { contracts: [], view: '' };
  return w;
};

/* ARRAYS COME BACK FROM THE VM REALM. buildWorld evaluates every module in
   its own vm context, so an array the product built has that context's
   Array.prototype — and assert.deepStrictEqual compares prototypes, so it
   fails on two lists that hold identical strings. Copy into this realm before
   comparing; a first draft did not and reported ['CHG-0'] !== ['CHG-0']. */
const list = x => Array.from(x || []);

const ch = (id, o = {}) => ({ id, status: 'pending', authorSide: 'owner',
  clauseLabel: 'Clause 5 · Payment terms', summary: 'sixty days from invoice', ...o });

/* A negotiation that has already been started — which is the only state this
   memo is ever opened on, because its door is in the room's own menu. */
const deal = (live = [], rounds = []) => ({
  id: 'MK-9', name: 'Supply Agreement', counterparty: 'Nordkust Industri',
  negotiation: { round: 2, turn: 'owner', seq: 9, rounds }, changes: live });

describe('f269 (1) it reads without writing — the trap this whole feature sits on', () => {
  /* negoChanges / negoAllChanges / negoRound all call negoInit, which sets
     c.changes, creates c.negotiation AND stamps clause ids into the document.
     The memo must be safe to ask of anything. */
  test('a contract with no negotiation gains none by being read', () => {
    const w = W();
    const bare = { id: 'MK-1', name: 'Draft', counterparty: 'Naivas' };
    const m = w.negoMemo(bare);
    assert.equal(bare.negotiation, undefined, 'the memo started a negotiation');
    assert.equal(bare.changes, undefined, 'the memo created a changes array');
    assert.equal(m.empty, true);
  });

  test('it does not rewrite the document', () => {
    const w = W();
    const body = '<h2>Clause 1</h2><p>Wording.</p>';
    const bare = { id: 'MK-2', redlineText: body };
    w.negoMemo(bare);
    assert.equal(bare.redlineText, body, 'clause ids were stamped into the wording');
  });

  test('and the source reaches for none of the three writing readings', () => {
    const body = /function negoMemo\(c\)\{[\s\S]*?\n\}/.exec(NEG);
    assert.ok(body, 'negoMemo not found');
    for (const f of ['negoChanges(', 'negoAllChanges(', 'negoRound(', 'negoInit('])
      assert.equal(body[0].includes(f), false, `negoMemo calls ${f} — that writes`);
  });
});

describe('f269 (2) the four sections are four readings of the record', () => {
  const w = W();
  const m = w.negoMemo(deal([
    ch('CHG-1', { status: 'accepted' }),
    ch('CHG-2', { status: 'pending', authorSide: 'counterparty' }),
    ch('CHG-3', { status: 'rejected', authorSide: 'counterparty' }),
    ch('CHG-4', { withdrawn: { by: 'You', at: '2026-09-01' } }),
  ]));
  const ids = k => list(m[k]).map(r => r.id);

  test('agreed is what was accepted', () => assert.deepEqual(ids('agreed'), ['CHG-1']));
  test('still open is what is pending', () => assert.deepEqual(ids('open'), ['CHG-2']));
  test('blocking is a refusal nobody withdrew', () => assert.deepEqual(ids('blocking'), ['CHG-3']));
  test('we gave up is what we withdrew', () => assert.deepEqual(ids('gave'), ['CHG-4']));

  /* A withdrawal is a FLAG beside whatever status the change already carried,
     so it has to be asked FIRST or a withdrawn pending ask shows up as open —
     which would report an ask we took off the table as still live between the
     parties. rlCardBand asks it first for the same reason. */
  test('a withdrawn ask is NOT also still open', () => {
    assert.equal(ids('open').includes('CHG-4'), false);
  });

  test('a superseded change is in no section at all', () => {
    const m2 = W().negoMemo(deal([ch('CHG-9', { status: 'superseded' })]));
    for (const k of ['agreed', 'open', 'gave', 'blocking'])
      assert.deepEqual(list(m2[k]), [], `a superseded change reached ${k}`);
  });
});

describe('f269 (3) WE gave up, and BOTH sides block', () => {
  /* Them dropping an ask is good news and belongs to a section nobody drew;
     counting it under "we gave up" would tell a boss we conceded when we did
     not. */
  test('a withdrawal of theirs is not us giving up', () => {
    const m = W().negoMemo(deal([ch('CHG-1', { authorSide: 'counterparty', withdrawn: { at: 'x' } })]));
    assert.deepEqual(list(m.gave), []);
  });

  /* A refusal stops the deal whichever side asked, and only the ASKER can
     settle it by withdrawing — so a memo listing one side's refusals only
     would under-report what is stuck. */
  test('a refused ask of ours blocks exactly as a refused ask of theirs does', () => {
    const m = W().negoMemo(deal([
      ch('CHG-1', { status: 'rejected', authorSide: 'owner' }),
      ch('CHG-2', { status: 'rejected', authorSide: 'counterparty' }),
    ]));
    assert.deepEqual(list(m.blocking).map(r => r.id), ['CHG-1', 'CHG-2']);
    assert.deepEqual(list(m.blocking).map(r => r.side), ['us', 'them']);
  });

  test('a refusal the asker withdrew stops blocking', () => {
    const m = W().negoMemo(deal([ch('CHG-1', { status: 'rejected', withdrawn: { at: 'x' } })]));
    assert.deepEqual(list(m.blocking), []);
  });
});

describe('f269 (4) closed rounds are in it, and carry their round', () => {
  test('an accepted change from round 1 is still agreed in round 2', () => {
    const m = W().negoMemo(deal([], [{ n: 1, changes: [ch('CHG-0', { status: 'accepted' })] }]));
    assert.deepEqual(list(m.agreed).map(r => r.id), ['CHG-0']);
    assert.equal(m.agreed[0].round, 1);
  });
});

describe('f269 (5) every line is QUOTED, never composed', () => {
  test('a row carries the record’s own summary and stamped label', () => {
    const m = W().negoMemo(deal([ch('CHG-1', {
      clauseLabel: 'Clause 12 · Indemnity', summary: 'the proposer’s own words' })]));
    assert.equal(m.open[0].clause, 'Clause 12 · Indemnity');
    assert.equal(m.open[0].said, 'the proposer’s own words');
  });

  /* A change with no summary quotes NOTHING rather than repeating its own
     heading — a row that quotes its own title reads as a quote that is not one. */
  test('with no summary the row quotes nothing rather than inventing something', () => {
    const m = W().negoMemo(deal([ch('CHG-1', { summary: '' })]));
    assert.equal(m.open[0].said, '');
    assert.equal(m.open[0].clause, 'Clause 5 · Payment terms');
  });

  test('with no stamped label the row falls back to the id, not to a lookup', () => {
    const m = W().negoMemo(deal([ch('CHG-1', { clauseLabel: null })]));
    assert.equal(m.open[0].clause, 'CHG-1');
  });

  /* negoTimeline's own rule: clause numbers move when a round renumbers, so a
     memo naming today's number for a change filed against last round's would
     be citing the wrong clause. */
  test('it never looks a clause up live', () => {
    const body = /function negoMemo\(c\)\{[\s\S]*?\n\}/.exec(NEG)[0];
    for (const f of ['negoClauseById', 'negoClauseNowById', 'negoClauseList', 'clauseLabel('])
      assert.equal(body.includes(f), false, `negoMemo resolves the clause live via ${f}`);
  });
});

describe('f269 (6) whose move is borrowed, never re-derived', () => {
  test('the memo carries negoMoveSay’s own answer', () => {
    const w = W();
    const c = deal([ch('CHG-1', { authorSide: 'counterparty' })]);
    assert.deepEqual({ ...w.negoMemo(c).move }, { ...w.negoMoveSay(c) });
  });

  /* ONE READING, TWO READERS. The register's pill dresses the same answer, so
     the row on the Negotiations page and the memo cannot disagree. */
  test('the pill dresses that same reading', () => {
    const w = W();
    const c = deal([ch('CHG-1', { authorSide: 'counterparty' })]);
    const say = w.negoMoveSay(c);
    const pill = w.negoMovePillHtml(c);
    assert.ok(pill.includes('>' + say.word + '<'), `${pill} does not print ${say.word}`);
    assert.ok(pill.includes(say.say), `${pill} does not carry "${say.say}"`);
  });

  test('the sentences live in one place, not two', () => {
    const reg = SRC('views/register.js');
    const pill = /function negoMovePillHtml\(c\)\{[\s\S]*?\n\}/.exec(reg)[0];
    for (const k of ['ng_no_live_copy', 'ng_not_sent_yet', 'ng_needs_you', 'ng_door_with'])
      assert.equal(pill.includes(k), false, `${k} is still decided inside the markup builder`);
    assert.match(reg, /function negoMoveSay\(c\)/);
  });

  /* ASSIGNED AWAY, NOT DELETED. In the test world every module is evaluated
     into one VM context, so a top-level `function` is a non-configurable
     property of that context and `delete` silently does nothing — the first
     draft of this check therefore ran with the reading still present and
     proved the opposite of what it says. */
  test('a stage without the reading still draws a memo', () => {
    const w = W();
    const keep = w.negoMoveSay;
    w.negoMoveSay = undefined;
    try {
      assert.equal(typeof w.negoMoveSay, 'undefined', 'the stage was not actually stripped');
      assert.equal(w.negoMemo(deal([ch('CHG-1')])).move, null);
    } finally { w.negoMoveSay = keep; }
  });
});

describe('f269 (7) a cap is a fact, never a silent trim', () => {
  test('the counts are the whole population even when the rows are capped', () => {
    const w = W();
    const many = Array.from({ length: w.NEGO_MEMO_MAX + 5 }, (_, i) => ch('CHG-' + i));
    const m = w.negoMemo(deal(many));
    assert.equal(m.counts.open, w.NEGO_MEMO_MAX + 5);
    assert.equal(m.open.length, w.NEGO_MEMO_MAX);
    assert.equal(m.capped, true);
    assert.match(w.negoMemoHtml(m), /listed/i);
  });

  test('an uncapped memo says nothing about a cap', () => {
    const w = W();
    const m = w.negoMemo(deal([ch('CHG-1')]));
    assert.equal(m.capped, false);
    assert.equal(/only the first/i.test(w.negoMemoHtml(m)), false);
  });
});

describe('f269 (8) counting is not drawing', () => {
  test('the reading returns data and no markup', () => {
    const m = W().negoMemo(deal([ch('CHG-1')]));
    assert.equal(/[<>]/.test(JSON.stringify(m)), false, 'the reading emitted markup');
  });

  /* The claim is that the drawing never works out a POPULATION — not that it
     never calls .filter, which a first draft asserted and which caught a
     `.filter(Boolean)` on a label join. A crude proxy for a real rule reports
     a fault that is not there. */
  test('the drawing decides no population of its own', () => {
    const body = /function negoMemoHtml\(m\)\{[\s\S]*?\n\}/.exec(NEG)[0];
    for (const f of ['c.changes', 'negoAlignment', 'negotiation.rounds', 'authorSide',
                     '.withdrawn', 'status ===', 'precedentForChange'])
      assert.equal(body.includes(f), false, `negoMemoHtml works something out for itself: ${f}`);
    assert.match(body, /m\[sec\.k\]/);
  });

  /* Both shapes are built from ONE data object, so what a colleague pastes
     into an email cannot say something the panel did not. */
  test('the text form and the panel are the same memo', () => {
    const w = W();
    const m = w.negoMemo(deal([ch('CHG-1', { clauseLabel: 'Clause 3 · Term' })]));
    assert.match(w.negoMemoText(m), /Clause 3 · Term/);
    assert.match(w.negoMemoHtml(m), /Clause 3 · Term/);
  });
});

describe('f269 (9) it spends nothing and changes nothing', () => {
  const region = NEG.slice(NEG.indexOf('function negoMemo(c)'),
    NEG.indexOf('function openNegoMemo') + 1400);

  test('the region under test was really found', () => {
    assert.ok(NEG.indexOf('function negoMemo(c)') > 0 && region.length > 2000,
      'the slice is empty — every check below would pass on nothing');
  });

  test('no model, no route', () => {
    for (const f of ['copilotAsk', 'copilotPropose', 'fetch(', 'api(', "'ai/"])
      assert.equal(region.includes(f), false, `the memo reaches for ${f}`);
  });

  test('it files nothing and decides nothing', () => {
    for (const f of ['negoFileChange', 'negoResolve', 'negoWithdraw', 'changes.push', 'persist(', 'logAudit'])
      assert.equal(region.includes(f), false, `the memo reaches for ${f}`);
  });

  /* precedentForChange is DETERMINISTIC counting over this workspace's own
     settled rounds — no model — so the memo must not badge it as advice from
     one. The drawing said "Copilot:"; the owner ruled it should say what it is. */
  test('the precedent line is never badged as Copilot', () => {
    const w = W();
    const m = w.negoMemo(deal([ch('CHG-1', { status: 'rejected' })]));
    assert.equal(/copilot/i.test(w.negoMemoHtml(m)), false);
    assert.equal(/copilot/i.test(w.negoMemoText(m)), false);
  });

  test('and a stage without precedent still draws a memo', () => {
    const w = W();
    const keep = w.precedentForChange;
    w.precedentForChange = undefined;
    try {
      assert.equal(typeof w.precedentForChange, 'undefined', 'the stage was not actually stripped');
      const m = w.negoMemo(deal([ch('CHG-1', { status: 'rejected' })]));
      assert.equal(m.blocking.length, 1);
      assert.equal(m.blocking[0].precedent, '');
    } finally { w.precedentForChange = keep; }
  });
});

describe('f269 (10) the door', () => {
  test('the memo’s row is in the page’s own menuRow, beside the playbook pass', () => {
    assert.match(NEG, /data-rl-memo/);
    /* Sliced FORWARD from the declaration by a fixed budget rather than to a
       landmark: `host.innerHTML` appears earlier in this file, so slicing to
       its first index came back EMPTY and the matches below passed against an
       empty string. A slice that can silently be empty is a test that cannot
       fail. */
    const at = NEG.indexOf('const mayMenu');
    assert.ok(at > 0, 'menuRow is not built where this file expects');
    const row = NEG.slice(at, at + 2200);
    assert.match(row, /data-rl-pbreview/, 'the playbook row left the same string');
    assert.match(row, /data-rl-memo/);
    /* Dead in preview like its neighbour — the counterparty draws its own
       header and never this one. */
    assert.match(row, /data-rl-memo[\s\S]{0,120}data-rl-dead/);
  });

  test('it is wired where the page wires its own rows', () => {
    assert.match(NEG, /\[data-rl-memo\]'\)\?\.addEventListener\('click', \(\) => openNegoMemo\(c\)\)/);
  });

  /* openSidePanel is the product's own drawer and draws NO SCRIM, which is why
     it is the right one: the negotiation the memo is about stays lit behind it. */
  test('it opens the product’s own side panel rather than a second drawer', () => {
    const body = /function openNegoMemo\(c\)\{[\s\S]*?\n\}/.exec(NEG)[0];
    assert.match(body, /openSidePanel\(/);
    for (const f of ['openModal(', 'openNotesPanel', 'setPanelFace'])
      assert.equal(body.includes(f), false, `openNegoMemo builds a second drawer via ${f}`);
  });

  test('every name leaves the module', () => {
    for (const n of ['negoMemo', 'negoMemoHtml', 'negoMemoText', 'openNegoMemo', 'NEGO_MEMO_MAX'])
      assert.match(NEG, new RegExp('Object\\.assign\\(window[\\s\\S]*\\b' + n + '\\b'), `${n} is never published`);
    assert.match(SRC('views/register.js'), /Object\.assign\(window[\s\S]*\bnegoMoveSay\b/);
  });
});

describe('f269 (11) the words, in both languages', () => {
  const { STRINGS } = require('../js/i18n.js');
  const KEYS = ['ng_memo', 'ng_memo_title', 'ng_memo_agreed', 'ng_memo_open', 'ng_memo_gave',
    'ng_memo_blocking', 'ng_memo_nil', 'ng_memo_none', 'ng_memo_round', 'ng_memo_from_record',
    'ng_memo_move', 'ng_memo_copy', 'ng_memo_copied', 'ng_memo_copy_failed',
    'ng_memo_capped_one', 'ng_memo_capped_other'];

  test('every key answers in English and in Swedish', () => {
    for (const lang of ['en', 'sv'])
      for (const k of KEYS)
        assert.ok(STRINGS[lang][k] && String(STRINGS[lang][k]).trim(), `${k} missing in ${lang}`);
  });

  test('the two books are really translated', () => {
    for (const k of KEYS)
      assert.notEqual(STRINGS.en[k], STRINGS.sv[k], `${k} is the same string in both`);
  });

  test('neither book calls the memo Copilot', () => {
    for (const lang of ['en', 'sv'])
      for (const k of KEYS)
        assert.equal(/copilot/i.test(STRINGS[lang][k]), false, `${k} says Copilot in ${lang}`);
  });
});
