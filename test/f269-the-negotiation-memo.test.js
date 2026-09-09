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
    /* ANCHORED ON THE NAME, NOT THE ARGUMENT LIST — this pinned the exact
       signature and stopped matching the day the renderer took an options
       argument. Pin the relation, not the literal. */
    const body = /function negoMemoHtml\(m[^)]*\)\{[\s\S]*?\n\}/.exec(NEG)[0];
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
    'ng_memo_capped_one', 'ng_memo_capped_other',
    /* The send, and the frame the route writes around the memo in the
       RECIPIENT's own language — the memo's body is composed in the browser in
       the sender's, which is what every other mail in this product does. */
    'ng_memo_send', 'ng_memo_send_h', 'ng_memo_send_sub', 'ng_memo_send_who',
    'ng_memo_send_note', 'ng_memo_send_privacy', 'ng_memo_send_go', 'ng_memo_sending',
    'ng_memo_sent', 'ng_memo_send_outbox', 'ng_memo_send_failed', 'ng_memo_send_nobody',
    'mail_memo_subject', 'mail_memo_line'];

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

/* ================================================================
   f269 (12) — SEND IT TO A COLLEAGUE (owner-asked 9 Sep 2026)
   ================================================================
   *"We need to bring back the send to a colleague button."*

   The memo shipped with Copy alone; the drawing it was built from carried a
   send beside it, and it was named as deliberately not built. This is that
   button, and every claim below is a way it could quietly stop being the same
   memo the panel shows:

   · ONE TEXT BUILDER. What reaches a colleague's inbox is negoMemoText — the
     very thing Copy copies — so the email cannot say something the panel did
     not. A second composition here is the recorded defect class.
   · THE ADDRESS IS NEVER THE BROWSER'S. The dialog sends a member id; the
     route resolves the address off the workspace's own records and refuses a
     body-supplied one outright.
   · IT STILL DECIDES NOTHING AND FILES NOTHING. That property is what lets the
     memo be opened on an executed contract at all, and a send that wrote a
     courtesy audit line would take it away (aiNoteRead's own lesson).
   · A VERB THAT CANNOT WORK IS NOT DRAWN. With nobody to send to, no button. */
describe('f269 (12) send it to a colleague', () => {
  const SHARE = /function openNegoMemoShare\([^)]*\)\s*\{[\s\S]*?\n\}/.exec(NEG)[0];
  const DOOR  = /function openNegoMemo\([^)]*\)\s*\{[\s\S]*?\n\}/.exec(NEG)[0];

  test('what is sent is the text the Copy button copies — one builder', () => {
    assert.match(SHARE, /negoMemoText\(m\)/,
      'the email must be composed by the memo’s own text builder, never a second one');
  });

  test('the browser sends a member id and never an address', () => {
    assert.match(SHARE, /toId/);
    assert.equal(/\b(email|address|to)\s*:/.test(SHARE), false,
      'an address in the body would make this route an open relay wearing the workspace’s name');
  });

  test('it posts to the contract’s own memo route', () => {
    assert.match(SHARE, /'contracts\/'/);
    assert.match(SHARE, /'\/memo'/);
  });

  test('it decides nothing and files nothing', () => {
    for (const f of ['negoFileChange', 'negoResolve', 'negoWithdraw', 'changes.push',
                     'persist(', 'logAudit'])
      assert.equal(SHARE.includes(f), false, `the send writes to the record: ${f}`);
  });

  test('“sent” means sent — all three answers are read', () => {
    for (const k of ['emailSent', 'outbox', 'emailError'])
      assert.match(SHARE, new RegExp(k), `the send does not read ${k}`);
  });

  test('a refusal is shown in the dialog, not behind it', () => {
    assert.match(SHARE, /ng-memo-err/,
      'the route’s own sentence names the colleague and why nothing went');
  });

  /* THE BUTTON IS THE SIGN AND THE DIALOG IS THE WALL — both ask the same
     reading, so a roster that emptied between the paint and the press cannot
     produce a press that does nothing. */
  test('the door decides whether the button can work before drawing it', () => {
    assert.match(DOOR, /negoMemoRecipients\(\)/);
    assert.match(DOOR, /canSend/);
    assert.match(SHARE, /negoMemoRecipients\(\)/, 'the dialog re-asks: the button is the sign, this is the wall');
  });

  test('no colleague, no button', () => {
    const w = W();
    const m = w.negoMemo(deal([ch('CHG-1')]));
    assert.equal(w.negoMemoHtml(m).includes('ng-memo-send'), false, 'a dead button was drawn');
    assert.equal(w.negoMemoHtml(m, { canSend: true }).includes('ng-memo-send'), true);
    /* Copy is unconditional — a memo can always be selected and copied. */
    assert.equal(w.negoMemoHtml(m).includes('ng-memo-copy'), true);
  });

  test('an empty memo offers neither act', () => {
    const w = W();
    const m = w.negoMemo(deal([]));
    assert.equal(m.empty, true);
    const html = w.negoMemoHtml(m, { canSend: true });
    assert.equal(html.includes('ng-memo-send'), false);
    assert.equal(html.includes('ng-memo-copy'), false);
  });

  test('the recipients are colleagues with an address, never yourself', () => {
    const w = W();
    w.currentUser = () => ({ id: 'u_me', name: 'Me' });
    w.getUsers = () => ([
      { id: 'u_me', name: 'Me', email: 'me@example.co.ke' },
      { id: 'u_two', name: 'Two', email: 'two@example.co.ke' },
      { id: 'u_none', name: 'No Address', email: '' },
    ]);
    assert.deepEqual(list(w.negoMemoRecipients()).map(u => u.id), ['u_two'],
      'yourself and anybody with nowhere to write to are both out');
  });
});

/* ================================================================
   f269 (13) — THE ROUTE, AGAINST A RUNNING SERVER
   ================================================================
   The browser half above is a source reading; this drives the real route with
   a real mail provider behind it, because every rule that matters here is one
   the server enforces and the screen only signs:

   · the address is resolved off the workspace's own records, never the body;
   · a colleague who could not open the contract is REFUSED rather than mailed
     a memo full of wording from a value stream they are walled out of;
   · nothing is written to the record, so the memo stays safe to open on a
     sealed contract;
   · and "sent" means sent — the same three-way answer every other mail here
     gives, proved by flipping the provider mid-run rather than by reading the
     route's own source. */
describe('f269 (13) the route', () => {
  const { startHatiWithMail, seedWorkspace } = require('./helpers.js');
  const LINES = ['Retail Supply — Coast — Naivas Supermarkets', 'MK-B1 · Round 1', '',
    'AGREED (1)', '  Clause 2 · SPECIFICATIONS — added “thirty (30) days”', '',
    'BLOCKING THE DEAL (0)', '  None'];

  test('it mails the colleague, carrying the memo’s own lines and a way in', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.reset();
    const r = await W.admin.json('/api/contracts/MK-B1/memo', { method: 'POST', body: {
      toId: W.users.unrestricted.id, note: 'Have a look before Friday', lines: LINES } });
    assert.equal(r.emailSent, true, 'a delivered memo must report sent');
    assert.equal(r.to, 'everything@example.co.ke', 'and to the address on FILE, not one we were handed');
    assert.equal(h.mail.sent.length, 1);
    const msg = h.mail.sent[0];
    assert.match(msg.subject, /Modern Trade Listing/, 'the subject names the agreement');
    assert.match(msg.text, /Have a look before Friday/, 'the sender’s own note travels');
    assert.match(msg.text, /Clause 2 · SPECIFICATIONS/, 'the memo’s own lines travel verbatim');
    assert.match(msg.text, /BLOCKING THE DEAL \(0\)/, 'including the section that says “none”');
    assert.match(msg.text, /#contract=MK-B1/, 'and a link the reader can actually open');
  });

  test('a body-supplied address is refused outright', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.reset();
    for (const body of [{ email: 'stranger@example.com', lines: LINES },
                        { to: 'stranger@example.com', lines: LINES },
                        { address: 'stranger@example.com', lines: LINES }]){
      const r = await W.admin.raw('/api/contracts/MK-B1/memo', { method: 'POST', body });
      assert.equal(r.status, 400, `an address in the body was accepted: ${JSON.stringify(body)}`);
    }
    assert.equal(h.mail.sent.length, 0, 'and nothing left the building');
  });

  /* THE MEMO CARRIES CLAUSE WORDING. A colleague walled out of this value
     stream must not receive it, and the link would land them on a page they
     cannot see — so this is a refusal in words rather than a silent skip:
     there is exactly one recipient, and silence would read as a message that
     went. */
  test('a colleague who cannot see the contract is refused, and nothing is sent', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.reset();
    const r = await W.admin.raw('/api/contracts/MK-B1/memo', { method: 'POST', body: {
      toId: W.users.restricted.id, lines: LINES } });
    assert.equal(r.status, 403);
    assert.equal(r.json.reason, 'no-access');
    assert.match(String(r.json.error), /Restricted Legal/, 'the refusal names who, so it can be acted on');
    assert.equal(h.mail.sent.length, 0);

    /* THE CONTROL: the same send, the same contract, a colleague who CAN see
       it. Without this, "nothing was sent" proves nothing about the guard. */
    const ok = await W.admin.json('/api/contracts/MK-B1/memo', { method: 'POST', body: {
      toId: W.users.unrestricted.id, lines: LINES } });
    assert.equal(ok.emailSent, true);
    assert.equal(h.mail.sent.length, 1);
  });

  test('a sender who cannot see the contract gets nothing back but a 404', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.reset();
    const r = await W.restricted.raw('/api/contracts/MK-B1/memo', { method: 'POST', body: {
      toId: W.users.unrestricted.id, lines: LINES } });
    assert.equal(r.status, 404, 'invisible therefore unsendable — folderScopeFor’s own answer');
    assert.equal(h.mail.sent.length, 0);

    /* THE CONTROL, and it is the one that makes this a claim about SCOPE
       rather than about a route that happens not to exist: the same sender,
       the same act, a contract in the one stream they CAN see. */
    const own = await W.restricted.json('/api/contracts/MK-A2/memo', { method: 'POST', body: {
      toId: W.users.unrestricted.id, lines: LINES } });
    assert.equal(own.emailSent, true, 'a restricted member may still send about their own stream');
    assert.equal(h.mail.sent.length, 1);
  });

  test('an unknown colleague, and an empty memo, are both refused', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    const gone = await W.admin.raw('/api/contracts/MK-B1/memo', { method: 'POST', body: {
      toId: 'u_nobody', lines: LINES } });
    assert.equal(gone.status, 404);
    const nothing = await W.admin.raw('/api/contracts/MK-B1/memo', { method: 'POST', body: {
      toId: W.users.unrestricted.id, lines: ['', '   ', ''] } });
    assert.equal(nothing.status, 400, 'a memo of blank lines is nothing to send');
  });

  test('“sent” means sent — a refused memo says so, and says why', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.setMode('refuse', { status: 403, message: 'The example.co.ke domain is not verified.' });
    const r = await W.admin.json('/api/contracts/MK-B1/memo', { method: 'POST', body: {
      toId: W.users.unrestricted.id, lines: LINES } });
    assert.equal(r.emailSent, false, 'a REFUSED memo must not report sent');
    assert.match(String(r.emailError || ''), /not verified/i, 'and the reader is told what went wrong');
  });

  /* THE PROPERTY THAT LETS THE MEMO BE OPENED AT ALL. An advisory read that
     wrote a courtesy audit line would be refused outright on an executed
     contract — which is exactly the contract a memo is most often opened on. */
  test('it writes nothing to the record', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    const before = await W.admin.json('/api/contracts/MK-B1');
    const auditBefore = JSON.stringify(before.audit || []);
    await W.admin.json('/api/contracts/MK-B1/memo', { method: 'POST', body: {
      toId: W.users.unrestricted.id, note: 'a note', lines: LINES } });
    const after = await W.admin.json('/api/contracts/MK-B1');
    assert.equal(JSON.stringify(after.audit || []), auditBefore, 'the trail moved');
    assert.equal(after.updatedAt, before.updatedAt, 'the record was touched');
    assert.equal(JSON.stringify(after.changes || []), JSON.stringify(before.changes || []),
      'a reading filed something');
  });

  /* A CAP IS A SAFETY WALL ON A BODY THIS SERVER DID NOT COMPOSE, and the memo
     already caps itself and says so on the page — so this only has to hold,
     not to be reported. */
  test('a runaway body is bounded rather than passed through', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.reset();
    /* WRITTEN AS THE RELATION, NOT THE NUMBER — this pinned <= 400 and failed
       the day the wall was raised for a memo that now quotes wording. What is
       claimed is that BOTH bounds bite on a body far past any sane one, and
       that the wall is a wall rather than a particular figure. */
    const SENT = 3000, WIDE = 9000;
    const many = Array.from({ length: SENT }, (_, i) => 'row ' + i);
    many[0] = 'x'.repeat(WIDE);
    const r = await W.admin.json('/api/contracts/MK-B1/memo', { method: 'POST', body: {
      toId: W.users.unrestricted.id, lines: many } });
    assert.ok(r.n < SENT, `the line count was not bounded: ${r.n} of ${SENT}`);
    const first = h.mail.sent[0].text.split('\n').find(l => l.startsWith('xxx'));
    assert.ok(first.length < WIDE, `a single line was not bounded: ${first.length}`);
  });
});

/* ================================================================
   f269 (14) — THE FULL WORDING, NOT THE CARD'S SHORTHAND
   ================================================================
   Owner-reported 9 Sep 2026, off a screenshot: *"the memo is not taking the
   full quotes of what has changed rather only the short hands that are in the
   redline screen therefore the full clauses are not visible."* — and then, off
   three drawn options: *"build option 1 and add the reason."*

   `summary` is negoSummariseOps' own line: at most TWO changed regions, each
   side clipped to 34 characters. Right on a 300px card, useless in a memo
   somebody forwards. The claims below are the ways this could quietly stop
   being the same wording the redline draws:

   · THE ROW CARRIES OPS, NOT MARKUP. The reading draws nothing, so the panel
     can render the marks and the email the same ops as plain text.
   · NOTHING RE-DIFFS. The stored ops are inside the fingerprint, and a mark
     drawn from a fresh diff would not be the mark the other side verified.
   · ONE READING OF WHICH BLOCKS ARE SHOWN. redlineShownBlocks was lifted out
     of the renderer the day the memo became its second reader.
   · AND WHAT IS LEFT OUT IS SAID, counted off the same ops the wording is
     drawn from. */
describe('f269 (14) the wording, in full', () => {
  const LONG = 'The Supplier shall deliver each consignment to the Buyer’s '
    + 'nominated warehouse within thirty (30) days of the Purchase Order, '
    + 'carriage paid and risk passing on unloading.';
  const opsFor = (before, after) => [
    { op: 'keep', text: 'Delivery. ' },
    { op: 'del', text: before },
    { op: 'ins', text: after },
  ];
  const wordy = (o = {}) => ch('CHG-9', {
    clauseLabel: 'Clause 3 · Delivery',
    summary: '“The Supplier shall deliver eac…” → “The Supplier shall deliver eac…”',
    ops: opsFor('within sixty (60) days of the Purchase Order', LONG),
    ...o });

  test('the row carries the change’s own ops, and no markup', () => {
    const m = W().negoMemo(deal([wordy()]));
    const r = list(m.open)[0];
    assert.ok(Array.isArray(r.ops) && r.ops.length, 'the row carries no ops to draw from');
    /* THE READING BUILDS NO TAGS. Stated as "no tag" rather than "no angle
       bracket": the ops carry the CONTRACT'S own words now, and a contract may
       legitimately say "<". */
    assert.equal(/<[a-z/!]/i.test(JSON.stringify(m)), false, 'the reading emitted markup');
  });

  test('the panel quotes the wording in full, where the summary clipped it', () => {
    const w = W();
    const m = w.negoMemo(deal([wordy()]));
    const html = w.negoMemoHtml(m);
    assert.ok(!list(m.open)[0].said.includes('carriage paid'),
      'the fixture’s summary is not clipped, so this proves nothing');
    assert.match(html, /carriage paid and risk passing on unloading/,
      'the memo still shows only the card’s shorthand');
    /* AND THE MARKS ARE THERE — what goes out and what arrives, drawn by the
       product's own builder rather than described in prose. */
    assert.match(html, /<del|nego-del/, 'the wording that goes is not struck');
    assert.match(html, /<ins|nego-ins/, 'the wording that arrives is not marked');
  });

  test('nothing re-diffs — the drawing goes through the one builder', () => {
    const body = /function negoMemoHtml\(m[^)]*\)\{[\s\S]*?\n\}/.exec(NEG)[0];
    assert.match(body, /rlChangeWordingHtml/, 'the memo draws wording some other way');
    for (const f of ['redlineOps(', 'wordDiff(', 'redlineBlocks('])
      assert.equal(body.includes(f), false, `the memo re-diffs: ${f}`);
  });

  test('the email carries the same wording, spelled out', () => {
    const w = W();
    const m = w.negoMemo(deal([wordy()]));
    const text = w.negoMemoText(m);
    assert.ok(text.includes('+ Delivery. ' + LONG) || text.includes('+ ' + LONG)
      || /\+ .*carriage paid/.test(text), 'what arrives is not on a "+" line');
    assert.match(text, /- .*sixty \(60\) days/, 'what goes out is not on a "-" line');
    assert.equal(/[<>]/.test(text), false, 'the plain-text memo carries markup');
  });

  /* ONE READING, TWO DRAWINGS. The panel renders marks and the email renders
     text, and both must agree about WHICH parts of the clause are shown — so
     the selection lives in redlineShownBlocks and neither copies it. */
  test('both drawings ask redlineShownBlocks', () => {
    const w = W();
    assert.equal(typeof w.redlineShownBlocks, 'function',
      'the shared reading is not published — a window read of it would be silence');
    const src = SRC('redline.js');
    assert.match(src, /function redlineOpsBlocksHtml[\s\S]{0,400}?redlineShownBlocks\(ops, opts\)/,
      'the renderer works out its own blocks again');
    const body = /function negoMemoWording\([^)]*\)\{[\s\S]*?\n\}/.exec(NEG)[0];
    assert.match(body, /redlineShownBlocks/, 'the text builder decides for itself which blocks show');
  });

  test('what is left out is said, and counted off the same ops', () => {
    const w = W();
    /* Four lines, one of them touched: three are left alone. */
    const many = [{ op: 'keep', text: 'one\ntwo\n' }, { op: 'del', text: 'three' },
      { op: 'ins', text: 'THREE' }, { op: 'keep', text: '\nfour' }];
    const m = w.negoMemo(deal([wordy({ ops: many })]));
    assert.equal(list(m.open)[0].unchanged, 3, 'the count is not the blocks left alone');
    assert.match(w.negoMemoHtml(m), /3 more parts/);
    assert.match(w.negoMemoText(m), /3 more parts/);
  });

  test('a change that touches nothing claims nothing was hidden', () => {
    const w = W();
    const keep = [{ op: 'keep', text: 'one\ntwo\nthree' }];
    const m = w.negoMemo(deal([wordy({ ops: keep })]));
    assert.equal(list(m.open)[0].unchanged, 0,
      'a formatting-only change shows the whole clause and hides nothing');
    assert.equal(/more parts/.test(w.negoMemoHtml(m)), false);
  });

  /* THE REASON THE ASKER GAVE, in their own words. */
  test('the reason draws where there is one, in both shapes', () => {
    const w = W();
    const m = w.negoMemo(deal([wordy({ why: 'Our warehouse cannot take sixty-day stock.' })]));
    assert.equal(list(m.open)[0].why, 'Our warehouse cannot take sixty-day stock.');
    assert.match(w.negoMemoHtml(m), /Our warehouse cannot take sixty-day stock\./);
    assert.match(w.negoMemoText(m), /Reason: Our warehouse cannot take sixty-day stock\./);
  });

  test('and nothing at all where there is none', () => {
    const w = W();
    const m = w.negoMemo(deal([wordy()]));
    assert.equal(list(m.open)[0].why, '');
    assert.equal(/Reason/.test(w.negoMemoHtml(m)), false, 'an empty reason drew its label');
    assert.equal(/Reason/.test(w.negoMemoText(m)), false);
  });

  /* `why` AND NOT `note`. note is the tool's own provenance — "Copilot —
     Simplify" — which is a different fact and reads as nonsense under the word
     "reason". The two card renderers print `why || note` in a slot that means
     "anything said about this"; this row means the reason. */
  test('it is the asker’s reason, never the tool’s provenance', () => {
    const w = W();
    const m = w.negoMemo(deal([wordy({ note: 'Copilot — Simplify' })]));
    assert.equal(list(m.open)[0].why, '', 'a provenance note was read as a reason');
    assert.equal(/Copilot/.test(w.negoMemoHtml(m)), false);
  });

  test('the label answers in both languages and is not the same string', () => {
    const { STRINGS } = require('../js/i18n.js');
    for (const lang of ['en', 'sv'])
      assert.ok(STRINGS[lang].ng_memo_why, `ng_memo_why missing in ${lang}`);
    assert.notEqual(STRINGS.en.ng_memo_why, STRINGS.sv.ng_memo_why);
  });
});

/* ================================================================
   f269 (15) — THE MEMO AS A DOCUMENT, FOR WORD AND FOR AN EMAIL
   ================================================================
   Owner-reported 9 Sep 2026, off a paste into Word: *"I would like to maintain
   the crossed line highlighting what was changed"*, and then *"I would also
   like to maintain a clear structure including what is bold or not bold so
   that it is a structured communication to an executive."*

   The Copy button wrote PLAIN TEXT, so the marks arrived as "+" and "-" lines
   and the structure arrived as nothing. This is the THIRD drawing of one
   reading — the panel in marks, the inbox in plain text, this for a document —
   and the claims below are the ways it could stop being the same memo:

   · EVERY VALUE IS A LITERAL. This markup is opened OUTSIDE this app, where no
     class and no token of the product's exists. A var() here is a bug, which
     is the rule the two standalone documents already follow.
   · THE MARKS CARRY THEMSELVES. Inline, on the elements, because a stylesheet
     does not travel on a clipboard.
   · BOLD IS WHAT A READER SCANS FOR, and nothing else.
   · AND THE PLAIN FLAVOUR IS STILL WRITTEN, as the fallback and as the thing a
     plain-text destination takes. */
describe('f269 (15) the memo as a document', () => {
  const w = W();
  const rich = (over = {}) => {
    const c = deal([ch('CHG-7', { clauseLabel: 'Clause 2 · Specifications',
      summary: 'added “sixty…”', why: 'Our board approved ninety.',
      ops: [{ op: 'keep', text: 'Delivery. ' },
        { op: 'del', text: 'within sixty (60) days' },
        { op: 'ins', text: 'within thirty (30) days of the Purchase Order' },
        { op: 'keep', text: '\nTail one\nTail two' }],
      ...over })]);
    const m = w.negoMemo(c);
    return { m, html: w.negoMemoRichHtml(m) };
  };

  /* THE ONE THAT MATTERS MOST. A document that leaves this app carries no
     stylesheet, so a token resolves to NOTHING and the marks vanish — which is
     exactly what the owner pasted into Word. */
  test('every value is a literal — no token leaves the building', () => {
    const { html } = rich();
    assert.equal(/var\(/.test(html), false, 'a var() in markup that leaves this app');
    assert.equal(/--[a-z]/.test(html), false, 'a custom property in a foreign document');
  });

  test('the marks carry themselves, inline', () => {
    const { html } = rich();
    assert.match(html, /<del[^>]*style="[^"]*line-through/,
      'the deletion is not struck where a stylesheet cannot reach it');
    assert.match(html, /<ins[^>]*style="[^"]*underline/,
      'the insertion carries no mark of its own');
    /* AND COLOUR IS NEVER THE ONLY CARRIER — the strike and the underline do
       the work, so the memo survives a black-and-white printout. */
    assert.match(html, /<del[^>]*style="[^"]*color:#/);
    assert.match(html, /<ins[^>]*style="[^"]*color:#/);
  });

  test('the wording itself is in it, in full', () => {
    const { html } = rich();
    assert.match(html, /within thirty \(30\) days of the Purchase Order/);
    assert.match(html, /within sixty \(60\) days/, 'what goes out is not shown');
  });

  /* BOLD IS WHAT A READER SCANS FOR: the agreement, each section, each clause,
     and the two labels. Bold on everything is bold on nothing. */
  test('the structure is bold where an executive scans, and nowhere else', () => {
    const { html } = rich();
    assert.match(html, /font-size:14pt;font-weight:bold[^>]*>Supply Agreement/,
      'the agreement’s name does not lead');
    assert.match(html, /font-weight:bold[^>]*>AGREED \(0\)/, 'the sections are not headings');
    assert.match(html, /<b>CHG-7 · Clause 2 · Specifications<\/b>/,
      'the row does not lead with its reference and clause, in bold');
    /* The wording is REGULAR — it is the content, not a signpost. */
    const block = /<p class="rl-line[^>]*>([\s\S]*?)<\/p>/.exec(html);
    assert.ok(block, 'the wording is not drawn as its own block');
    assert.equal(/font-weight:bold/.test(block[1]), false, 'the wording was set in bold');
  });

  test('it says everything the panel says', () => {
    const { m, html } = rich();
    for (const sec of list(w.NEGO_MEMO_SECTIONS))
      assert.ok(html.includes(String(sec.label).toLocaleUpperCase()),
        `the document drops the ${sec.label} section`);
    assert.match(html, /Our board approved ninety\./, 'the reason did not travel');
    assert.match(html, /2 more parts/, 'what is left out is not said');
    assert.match(html, /Whose move/, 'whose move it is did not travel');
    assert.equal(m.empty, false);
  });

  test('an empty memo is one honest sentence, not an empty document', () => {
    const m = w.negoMemo(deal([]));
    const html = w.negoMemoRichHtml(m);
    assert.equal(/AGREED/.test(html), false);
    assert.ok(html.length < 200, `an empty memo produced ${html.length} characters of document`);
  });

  /* THE STYLE OPTIONS ARE ADDITIVE. Every other caller passes none, so the
     paper, the clause panel and the open card are byte-identical — written as
     the RELATION rather than as a golden string. */
  test('the options change nothing for a caller that does not pass them', () => {
    const OPS = [{ op: 'keep', text: 'a ' }, { op: 'del', text: 'b' }, { op: 'ins', text: 'c' }];
    assert.equal(w.redlineOpsBlocksHtml(OPS), w.redlineOpsBlocksHtml(OPS, {}));
    assert.equal(w.redlineOpsHtml(OPS), w.redlineOpsHtml(OPS, {}));
    assert.equal(/style=/.test(w.redlineOpsBlocksHtml(OPS)), false,
      'the shared renderer emits an inline style nobody asked for');
  });

  /* BOTH FLAVOURS, AND THE PLAIN ONE IS THE FALLBACK. ClipboardItem is the
     newer half of this API: it can be missing, refused, or blocked outside a
     secure context, and a Copy that fails outright is worse than one that
     pastes without its marks. */
  test('the Copy button writes both, and falls back to the text', () => {
    const body = /const btn = document\.getElementById\('ng-memo-copy'\);[\s\S]*?\n  \}\);/.exec(NEG)[0];
    assert.match(body, /'text\/html'/, 'the rich flavour is never put on the clipboard');
    assert.match(body, /'text\/plain'/, 'the plain flavour was dropped');
    assert.match(body, /negoMemoRichHtml\(m\)/, 'the document is composed some other way');
    assert.match(body, /negoMemoText\(m\)/);
    assert.match(body, /typeof ClipboardItem === 'function'/,
      'a browser without ClipboardItem gets a dead press');
    assert.match(body, /\.then\(done, plain\)/, 'a refused rich write does not fall back');
  });
});

/* ================================================================
   f269 (16) — THE TWO THINGS THE OWNER SAW ON THEIR OWN CONTRACT
   ================================================================
   Reported 9 Sep 2026 off a memo of a live negotiation, and they are two
   different faults that happened to arrive in one screenshot:

   · TWO ROWS THAT LOOKED IDENTICAL. "Clause 2 · SPECIFICATIONS … Clause
     deleted — 2.1 Compliance with Specifications…" twice, with another row
     between them. They were not one change drawn twice: two asks on one clause
     draw the same clause name and — where neither carries a summary somebody
     typed — the same GENERATED line, and the one thing that tells them apart
     is the reference. Every card, tag, panel row and audit line in this
     product names a change by its id; the memo was the only surface that did
     not.
   · THREE ROWS READING "New clause added —" WITH NOTHING AFTER THE DASH. An
     insertion filed with an empty body: a clause with a name and no words. It
     draws as a heading over blank paper, asks the other side to accept
     nothing, and carries a fingerprint over an empty string for the life of
     the negotiation. Refused at the FUNNEL now — and the memo says so for the
     records that already hold one, because an absence is said rather than left
     as a blank row. */
describe('f269 (16) two rows are two rows, and a clause is its words', () => {
  const w = W();

  test('every drawing names the change, so two asks are never one row', () => {
    /* THE OWNER'S OWN SHAPE: two deletions of one clause, which generate a
       byte-identical summary because the summary is built from the wording. */
    const twin = (id) => ch(id, { status: 'accepted', clauseLabel: 'Clause 2 · Specifications',
      summary: 'Clause deleted — 2.1 Compliance with Specifications. Supplier warrants…',
      ops: [{ op: 'del', text: '2.1 Compliance with Specifications.' }] });
    const m = w.negoMemo(deal([twin('CHG-004'), twin('CHG-011')]));
    assert.equal(list(m.agreed).length, 2, 'the fixture is not two changes');
    for (const drawn of [w.negoMemoHtml(m), w.negoMemoText(m), w.negoMemoRichHtml(m)]){
      assert.ok(drawn.includes('CHG-004') && drawn.includes('CHG-011'),
        'a drawing does not name its changes — two asks read as one row twice');
    }
  });

  test('the funnel refuses an insertion with no wording', async () => {
    const w2 = buildWorld({ negotiationView: true, contractView: true }).win;
    w2.state = { contracts: [], view: '' };
    const c = { id: 'MK-5', redlineText: '<h2>Clause 1</h2><p>Some wording.</p>' };
    w2.negoInit(c);
    const before = (c.changes || []).length;
    /* A HEADING IS NOT ENOUGH ON ITS OWN — that is the whole of the report:
       every row the owner saw carried a heading and no body. */
    const empty = await w2.negoInsertClause(c, null, { headingText: 'Governing law', bodyHtml: '' });
    assert.equal(empty, null, 'a clause with a name and no words was filed');
    assert.equal((c.changes || []).length, before, 'a refusal still wrote to the record');

    /* THE CONTROL, and without it "nothing was filed" proves nothing: the same
       call with wording in it must still file. */
    const real = await w2.negoInsertClause(c, null,
      { headingText: 'Governing law', bodyHtml: '<p>This Agreement is governed by Kenyan law.</p>' });
    assert.ok(real && real.id, 'a real insertion was refused too');
    assert.equal((c.changes || []).length, before + 1);
  });

  test('and a record that already holds one says so rather than drawing a blank', () => {
    /* Filed before the guard existed, so it is built as the stored shape by
       hand and says so — the ordinary route can no longer produce it. */
    const m = w.negoMemo(deal([ch('CHG-2', { changeType: 'insertClause',
      clauseLabel: 'Governing law', summary: 'New clause added — ',
      ops: [{ op: 'ins', text: '' }] })]));
    for (const drawn of [w.negoMemoHtml(m), w.negoMemoText(m), w.negoMemoRichHtml(m)])
      assert.match(drawn, /No wording was recorded/,
        'a change carrying nothing drew a blank row instead of saying so');
  });

  test('the words answer in both languages', () => {
    const { STRINGS } = require('../js/i18n.js');
    for (const lang of ['en', 'sv'])
      assert.ok(STRINGS[lang].ng_memo_no_wording, `ng_memo_no_wording missing in ${lang}`);
    assert.notEqual(STRINGS.en.ng_memo_no_wording, STRINGS.sv.ng_memo_no_wording);
  });
});

/* ================================================================
   f269 (17) — THE EMAILED MEMO IS A DOCUMENT TOO
   ================================================================
   Owner-asked 9 Sep 2026, after the clipboard was fixed: the memo that reaches
   an inbox looked like the screenshot that started all this, because sendEmail
   posted a text body and nothing else.

   IT RIDES BESIDE THE TEXT, never instead of it: one message carrying both, so
   a client that can render it does and a plain-text reader still gets what it
   always got.

   AND HTML OFF A REQUEST IS A DIFFERENT RISK FROM TEXT OFF A REQUEST. Text
   cannot carry a link that says one thing and goes to another, a tracking
   pixel, or a script. The wall that matters is still WHO is written to — a
   member of this workspace, in scope, resolved from our own records — and
   mailSafeHtml is the second one: it REBUILDS rather than strips, and the only
   attribute that survives is a filtered `style`. */
describe('f269 (17) the emailed memo', () => {
  const { startHatiWithMail, seedWorkspace } = require('./helpers.js');
  const LINES = ['Supply Agreement — Nordkust', 'MK-B1 · Round 1', '', 'AGREED (1)',
    '  CHG-004 · Clause 2 — added “thirty (30) days”', '    - sixty (60) days', '    + thirty (30) days'];
  const RICH = '<div style="font-family:Aptos"><p style="font-weight:bold">AGREED (1)</p>'
    + '<p><b>CHG-004 · Clause 2</b></p>'
    + '<p style="margin:0 0 4px 24px"><del style="color:#be123c;text-decoration:line-through">sixty (60) days</del>'
    + '<ins style="color:#047857;text-decoration:underline">thirty (30) days</ins></p></div>';
  const send = (W, body) => W.admin.json('/api/contracts/MK-B1/memo', { method: 'POST', body });

  test('both flavours leave in one message, and the frame is the server’s', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.reset();
    await send(W, { toId: W.users.unrestricted.id, note: 'Before Friday', lines: LINES, html: RICH });
    const msg = h.mail.sent[0];
    assert.ok(msg.text && msg.text.includes('AGREED (1)'), 'the plain flavour stopped travelling');
    assert.ok(msg.body.html, 'no HTML flavour left the building');
    assert.match(msg.body.html, /text-decoration:line-through/, 'the marks did not survive');
    assert.match(msg.body.html, /thirty \(30\) days/, 'the wording did not survive');
    /* THE FRAME IS BUILT HERE, in the recipient's own language, and the link is
       composed from contractUrl rather than accepted from anybody. */
    assert.match(msg.body.html, /Before Friday/, 'the sender’s note is not in the document');
    assert.match(msg.body.html, /#contract=MK-B1/, 'the link is not in the document');
    assert.match(msg.body.html, /Unrestricted Legal/, 'the greeting does not name the reader');
  });

  test('a message with no HTML still goes, exactly as it did', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.reset();
    const r = await send(W, { toId: W.users.unrestricted.id, lines: LINES });
    assert.equal(r.emailSent, true);
    assert.equal(h.mail.sent[0].body.html, undefined,
      'an HTML body was invented for a caller that sent none');
    assert.ok(h.mail.sent[0].text.includes('AGREED (1)'));
  });

  /* THE WALL. Each of these is a thing text could never carry. */
  test('the wall drops what an email has no business carrying', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.reset();
    const nasty = '<div style="color:#0e1a18">kept'
      + '<script>alert(1)</script>'
      + '<img src="https://tracker.example/p.gif">'
      + '<a href="https://phish.example">click</a>'
      + '<p onclick="steal()" class="x" id="y" style="color:#047857;position:fixed">styled</p>'
      + '<p style="background:url(https://tracker.example/p.gif)">urly</p>'
      + '<p style="color:javascript:alert(1)">js</p>'
      + '</div>';
    await send(W, { toId: W.users.unrestricted.id, lines: LINES, html: nasty });
    const got = h.mail.sent[0].body.html;
    for (const bad of ['<script', '<img', 'onclick', 'tracker.example',
                       'phish.example', 'position:fixed', 'javascript:', 'class="x"', 'id="y"'])
      assert.equal(got.includes(bad), false, `the wall let through: ${bad}`);
    /* THE ONE LINK IN THE MESSAGE IS THE SERVER'S OWN, built from contractUrl
       and never accepted from anybody. Asserted as a COUNT rather than as an
       absence, because the frame legitimately carries one and a sweep for
       "<a href" would report the product's own way in as an attack. */
    const links = got.match(/<a\s+href/g) || [];
    assert.equal(links.length, 1, `the message carries ${links.length} links`);
    assert.match(got, /<a href="[^"]*#contract=MK-B1[^"]*">/,
      'the one link is not the one this server composed');
    /* AND IT KEEPS WHAT THE MEMO IS MADE OF — a wall that ate the document
       would be the same failure pointing the other way. */
    assert.match(got, />kept/);
    assert.match(got, />styled/);
    assert.match(got, /color:#047857/, 'a permitted style property was dropped');
    assert.match(got, /<p style="color:#0e1a18"|<div style="color:#0e1a18"/,
      'the document’s own colour was dropped');
  });

  test('the memo’s own tags and marks all survive the wall', async (t) => {
    const h = await startHatiWithMail();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    h.mail.reset();
    await send(W, { toId: W.users.unrestricted.id, lines: LINES, html: RICH });
    const got = h.mail.sent[0].body.html;
    for (const tag of ['<div', '<p', '<b>', '<del', '<ins'])
      assert.ok(got.includes(tag), `the wall ate ${tag}, which the memo is made of`);
    for (const prop of ['font-weight:bold', 'color:#be123c', 'text-decoration:underline', 'margin:0 0 4px 24px'])
      assert.ok(got.includes(prop), `the wall ate ${prop}`);
  });
});
