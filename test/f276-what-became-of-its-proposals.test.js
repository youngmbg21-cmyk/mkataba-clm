/* ============================================================
   F276 — What Copilot proposed, and what became of it (ideas 22 & 23)
   ============================================================
   Two screens were asked for and they are ONE recording seen twice: the AI
   involvement record in a contract's evidence pack, and acceptance metrics in
   the Copilot engine drawer. Neither could be computed from anything on file
   before this, so the claims below are mostly about the RECORDING — the
   screens are only as true as it is.

   THE CONTROL COMES FIRST. Section 1 proves the funnel really settles a
   proposal, because every claim about a percentage rests on that one comparison
   working; a suite that asserts the arithmetic over hand-written entries would
   pass on a build where nothing was ever recorded. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
/* The sweeps read CODE, not prose: this file's own comments name the things it
   must never do ("there must never be a route"), and a grep over raw source
   would find the warning and report it as the fault. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const TRACE = read('js/aitrace.js');
const TRACE_CODE = strip(TRACE);
const I18N = read('js/i18n.js');
const SETTINGS = read('js/views/settings.js');
const CORE = read('js/core.js');
const NEGO = read('js/negotiation.js');
const CE = read('js/views/clauseeditor.js');
const OB = read('js/obligations.js');

/* The drawer's own section, read out of the file: everything between the
   builder and the next top-level function. */
const drawer = () => strip(SETTINGS).split('function stAcceptanceHtml(){')[1].split('\nfunction ')[0];

const CLAUSE = '<h2>3. Payment</h2><p>The Buyer shall pay each undisputed invoice within sixty (60) days of receipt.</p>';

function stage(){
  const { win, log } = buildWorld({});
  /* A bare world carries no `state` — only the option branches build one — and
     every reading here counts the book, so it is stood up explicitly rather
     than borrowed from whichever option happened to create it. */
  win.state = win.state || { contracts: [], settings: {} };
  const c = {
    id: 'MK-500', name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB',
    status: 'Under Review', folder: 'proc', format: 'rich', redlineText: CLAUSE,
    audit: [], comments: [], obligations: [],
  };
  win.state.contracts = [c];
  return { win, log, c };
}

/* ============================================================
   1 — THE CONTROL: a proposal really is settled by the funnel
   ============================================================ */
describe('F276 (1) the funnel settles what was recorded', () => {
  test('taken word-for-word reads as-is; a word changed reads edited', async () => {
    const { win, c } = stage();
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0];
    assert.ok(cl, 'the fixture has a clause to propose against');

    const words = '<p>The Buyer shall pay each undisputed invoice within thirty (30) days of receipt.</p>';
    const id = win.aiTraceNote(c, { feature: 'redline', kind: 'wording',
      clauseId: cl.clauseId, clauseLabel: 'Payment', what: words, rested: 'Playbook: 30 days' });
    assert.equal(win.aiTraceById(c, id).outcome, 'proposed',
      'it starts as offered and nothing more');

    win.aiTraceApplied(c, id, words);
    const ch = await win.negoEditClause(c, cl.clauseId, words, { side: 'owner' });
    assert.ok(ch, 'the change filed');
    assert.equal(win.aiTraceById(c, id).outcome, 'as-is',
      'filed word-for-word, so the funnel says as-is');
    assert.equal(win.aiTraceById(c, id).changeId, ch.id,
      'and the entry names the change it became');
  });

  test('a proposal the reader rewrote before filing reads edited', async () => {
    const { win, c } = stage();
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0];
    const proposed = '<p>The Buyer shall pay each undisputed invoice within thirty (30) days of receipt.</p>';
    const filed = '<p>The Buyer shall pay each undisputed invoice within forty-five (45) days of receipt.</p>';
    const id = win.aiTraceNote(c, { feature: 'redline', kind: 'wording', clauseId: cl.clauseId, what: proposed });
    win.aiTraceApplied(c, id, proposed);
    await win.negoEditClause(c, cl.clauseId, filed, { side: 'owner' });
    assert.equal(win.aiTraceById(c, id).outcome, 'edited');
  });

  test('a proposal nobody applied is never settled by somebody else\'s filing', async () => {
    const { win, c } = stage();
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0];
    const id = win.aiTraceNote(c, { feature: 'redline', kind: 'wording', clauseId: cl.clauseId, what: 'x' });
    await win.negoEditClause(c, cl.clauseId,
      '<p>Payment falls due on delivery.</p>', { side: 'owner' });
    assert.equal(win.aiTraceById(c, id).outcome, 'proposed',
      'no hash means it was never taken into a draft, so there is nothing to settle');
  });

  test('the counterparty\'s own change settles nothing of ours', async () => {
    const { win, c } = stage();
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0];
    const words = '<p>The Buyer shall pay within thirty (30) days.</p>';
    const id = win.aiTraceNote(c, { feature: 'redline', kind: 'wording', clauseId: cl.clauseId, what: words });
    win.aiTraceApplied(c, id, words);
    await win.negoEditClause(c, cl.clauseId, words, { side: 'counterparty', author: 'Nordkust Industri AB' });
    assert.equal(win.aiTraceById(c, id).outcome, 'proposed',
      'their wording may not mark a proposal nobody here took as taken');
  });

  test('a contract that never met Copilot gains no field from being read', () => {
    const { win, c } = stage();
    assert.equal(win.aiTraceList(c).length, 0);
    win.aiTracePack(c); win.aiTraceStats([c]); win.aiTraceSettle(c, { clauseId: 'cl_x', bodyHtml: 'y' });
    assert.ok(!('aiTrace' in c), 'reading must not write');
  });
});

/* ============================================================
   2 — the five outcomes, and the fifth is the honest one
   ============================================================ */
describe('F276 (2) the outcomes', () => {
  test('nothing is inferred from silence — proposed is its own answer', () => {
    const { win, c } = stage();
    win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: 'a' });
    const s = win.aiTraceStats([c]);
    assert.equal(s.proposals, 1);
    assert.equal(s.rows[0].refused, 0, 'untouched is not refused');
    assert.equal(s.rows[0].pending, 1);
    assert.equal(s.notTaken, 1, 'and it is reported, not folded away');
  });

  test('a reading is counted apart and never in the percentages', () => {
    const { win, c } = stage();
    win.aiTraceNote(c, { feature: 'redline', kind: 'reading', what: 'a plain-English explanation' });
    const s = win.aiTraceStats([c]);
    assert.equal(s.proposals, 0, 'it was never a candidate for the agreement');
    assert.equal(s.readings, 1);
    assert.equal(s.rows.length, 0);
  });

  test('a kind of reading is stamped read whatever outcome a caller asks for', () => {
    const { win, c } = stage();
    const id = win.aiTraceNote(c, { feature: 'redline', kind: 'reading', outcome: 'as-is', what: 'a' });
    assert.equal(win.aiTraceById(c, id).outcome, 'read');
  });

  test('an outcome is settled once and never re-settled', () => {
    const { win, c } = stage();
    const id = win.aiTraceNote(c, { feature: 'obligations', kind: 'wording', what: 'a' });
    assert.equal(win.aiTraceTaken(c, id), true);
    assert.equal(win.aiTraceRefuse(c, id), false, 'a decided entry is a record');
    assert.equal(win.aiTraceById(c, id).outcome, 'as-is');
  });
});

/* ============================================================
   3 — the hash answers equality, and only equality
   ============================================================ */
describe('F276 (3) the hash', () => {
  test('the same words in different dressing are the same wording', () => {
    const { win } = stage();
    assert.equal(win.aiTraceHash('<p>Thirty days.</p>'),
                 win.aiTraceHash('<p><strong>Thirty</strong> days.</p>'),
      'a change of dressing is not a change of wording');
  });
  test('a changed word is a different wording', () => {
    const { win } = stage();
    assert.notEqual(win.aiTraceHash('<p>Thirty days.</p>'), win.aiTraceHash('<p>Sixty days.</p>'));
  });
  test('it is never described as a seal or a fingerprint', () => {
    assert.ok(/NOT THE SEAL/.test(TRACE),
      'the file has to say what this hash is not, or the next reader reads it as evidence');
    assert.ok(!/sha-?256/i.test(TRACE_CODE), 'and it is not one');
  });
});

/* ============================================================
   4 — the cap is a fact
   ============================================================ */
describe('F276 (4) bounds', () => {
  test('a contract holds at most AI_TRACE_MAX entries, oldest dropped', () => {
    const { win, c } = stage();
    for (let i = 0; i < win.AI_TRACE_MAX + 5; i++)
      win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: 'p' + i });
    assert.equal(c.aiTrace.length, win.AI_TRACE_MAX);
    assert.equal(c.aiTrace[0].what, 'p5', 'the oldest went, not the newest');
  });

  test('the label and the line it rested on are clipped, never stored whole', () => {
    const { win, c } = stage();
    const long = 'x'.repeat(400);
    const id = win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: long, rested: long });
    const e = win.aiTraceById(c, id);
    assert.ok(e.what.length <= win.AI_TRACE_WHAT_MAX);
    assert.ok(e.rested.length <= win.AI_TRACE_RESTED_MAX);
  });
});

/* ============================================================
   5 — no store, no route, no drawing
   ============================================================ */
describe('F276 (5) it adds no route and draws nothing', () => {
  test('the reading reaches no network verb', () => {
    for (const v of ['api(', 'fetch(', "'ai/", '"ai/'])
      assert.ok(!TRACE_CODE.includes(v), `${v} must never appear here`);
  });
  test('and it draws nothing', () => {
    for (const v of ['innerHTML', '<div', 'document.'])
      assert.ok(!TRACE_CODE.includes(v), `${v} is the drawing's business, not this file's`);
  });
  test('it is its own file, published by name', () => {
    for (const n of ['aiTraceNote', 'aiTraceSettle', 'aiTraceStats', 'aiTracePack', 'aiTraceFeatureLabel'])
      assert.ok(new RegExp(`\\b${n}\\b`).test(TRACE.split('Object.assign(window,')[1] || ''),
        `${n} must leave the module, or every cross-module read of it is silence`);
  });
  test('it is loaded before the funnel that settles it', () => {
    const app = read('js/app.js');
    assert.ok(app.indexOf("'./aitrace.js'") < app.indexOf("'./negotiation.js'"));
  });
});

/* ============================================================
   6 — IDEA 22: the contract's own record, in the evidence pack
   ============================================================ */
describe('F276 (6) the evidence pack', () => {
  test('the pack states what the section is NOT, in its own first line', () => {
    const { win, c } = stage();
    win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: 'a' });
    const p = win.aiTracePack(c);
    /* PINNED AS WORDS RATHER THAN AS A RELATION, deliberately: this is a
       disclaimer in a document read in a dispute, so what it SAYS is the whole
       of what it does. */
    assert.ok(/nothing here is part of the agreement/i.test(p.note),
      'the section must disclaim itself before anything else');
    assert.ok(/sealed wording/i.test(p.note),
      'and point at what the agreement actually is');
  });

  test('every column the record needs is on the row', () => {
    const { win, c } = stage();
    win.aiTraceNote(c, { feature: 'playbook', kind: 'wording', clauseId: 'cl_1',
      clauseLabel: 'Clause 3 — Payment', what: 'thirty days', rested: 'Playbook: 30 days', by: 'Wanjiru Kamau' });
    const r = win.aiTracePack(c).entries[0];
    for (const k of ['at', 'feature', 'featureLabel', 'clause', 'proposed', 'restedOn', 'outcome', 'by'])
      assert.ok(k in r, `the pack must carry ${k}`);
    assert.equal(r.clause, 'Clause 3 — Payment');
    assert.equal(r.restedOn, 'Playbook: 30 days');
  });

  test('the pack counts each outcome apart', () => {
    const { win, c } = stage();
    const a = win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: 'a' });
    const b = win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: 'b' });
    win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: 'c' });
    win.aiTraceNote(c, { feature: 'redline', kind: 'reading', what: 'd' });
    win.aiTraceTaken(c, a); win.aiTraceRefuse(c, b);
    const p = win.aiTracePack(c);
    assert.deepEqual(
      { n: p.proposals, asIs: p.takenAsIs, ed: p.editedFirst, no: p.refused, none: p.notActedOn, read: p.readings },
      { n: 3, asIs: 1, ed: 0, no: 1, none: 1, read: 1 });
  });

  test('the pack\'s feature name keeps English, because a record does', () => {
    const { win, c } = stage();
    win.langSet('sv');
    win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: 'a' });
    assert.equal(win.aiTracePack(c).entries[0].featureLabel, 'Redline (clause editor)');
    win.langSet('en');
  });

  test('the evidence pack draws the section only where there is something to say', () => {
    assert.ok(/copilot:\(\(\)=>\{[\s\S]*aiTracePack/.test(CORE),
      'the pack asks the one reading');
    assert.ok(/p\.proposals\|\|p\.readings/.test(CORE.replace(/\s/g, '')),
      'and returns null on a contract that never met Copilot');
  });
});

/* ============================================================
   7 — IDEA 23: the workspace, by feature
   ============================================================ */
describe('F276 (7) the acceptance reading', () => {
  test('it counts across contracts and groups by the surface that proposed', () => {
    const { win, c } = stage();
    const c2 = { id: 'MK-501', audit: [], comments: [] };
    win.state.contracts.push(c2);
    const a = win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: 'a' });
    win.aiTraceTaken(c, a);
    const b = win.aiTraceNote(c2, { feature: 'redline', kind: 'wording', what: 'b' });
    win.aiTraceTaken(c2, b, { edited: true });
    const d = win.aiTraceNote(c2, { feature: 'obligations', kind: 'wording', what: 'd' });
    win.aiTraceRefuse(c2, d);
    const s = win.aiTraceStats(win.state.contracts);
    assert.equal(s.proposals, 3);
    assert.equal(s.asIs, 1); assert.equal(s.edited, 1); assert.equal(s.notTaken, 1);
    assert.equal(s.rows[0].feature, 'redline', 'the busiest surface reads first');
    assert.equal(s.rows[0].proposals, 2);
  });

  test('every proposal lands in exactly one column', () => {
    const { win, c } = stage();
    ['a', 'b', 'c', 'd'].forEach(w => win.aiTraceNote(c, { feature: 'redline', kind: 'wording', what: w }));
    win.aiTraceTaken(c, c.aiTrace[0].id);
    win.aiTraceTaken(c, c.aiTrace[1].id, { edited: true });
    win.aiTraceRefuse(c, c.aiTrace[2].id);
    const r = win.aiTraceStats([c]).rows[0];
    assert.equal(r.asIs + r.edited + r.refused + r.pending, r.proposals);
  });

  test('the feature name follows the reader, and the two readers use one naming', () => {
    const { win } = stage();
    assert.equal(win.aiTraceFeatureLabel('redline'), 'Redline (clause editor)');
    win.langSet('sv');
    assert.equal(win.aiTraceFeatureLabel('redline'), 'Redline (klausulredigeraren)');
    win.langSet('en');
    assert.ok(!/Redline \(clause editor\)/.test(strip(SETTINGS)),
      'the drawer names nothing itself — it asks aiTraceFeatureLabel');
  });

  test('the drawer keeps the key box, the model routing and the spend table', () => {
    for (const id of ['ai-key', 'ai-key-save', 'ai-key-clear', 'ai-model-fast',
      'ai-model-deep', 'ai-spend-breakdown', 'ai-spend-people', 'ai-rates-table'])
      assert.ok(SETTINGS.includes(`id="${id}"`), `${id} must still be drawn`);
  });

  test('the section is drawn in both modes, from one builder', () => {
    const body = SETTINGS.split('function stEngineBodyHtml(){')[1].split('\nfunction ')[0];
    assert.equal((body.match(/stAcceptanceHtml\(\)/g) || []).length, 2,
      'the no-server branch and the server branch both draw it');
    assert.equal((strip(SETTINGS).match(/function stAcceptanceHtml/g) || []).length, 1,
      'and there is one builder');
  });

  /* ---- THE DRAWING'S OWN CLAIMS ARE READ OFF ITS SOURCE, and that is a
     limit rather than a preference: no test world loads js/views/settings.js,
     so stAcceptanceHtml cannot be DRIVEN here. What node can prove is the
     arithmetic, which is why the shares were moved out of the drawer and into
     the reading; the pixels are settings-tabs-verify's to measure. */
  test('the shares always add up, and the residual falls on not-taken', () => {
    const { win } = stage();
    /* 3 proposals, 1 as-is, 1 edited: three rounded thirds are 99, and a set of
       shares that does not add up is a set nobody trusts. */
    const sh = win.aiTraceShares({ proposals: 3, asIs: 1, edited: 1 });
    assert.equal(sh.asIs + sh.edited + sh.notTaken, 100);
    assert.equal(sh.notTaken, 34, 'the rounding lands on the least flattering column');
    const none = win.aiTraceShares({ proposals: 0, asIs: 0, edited: 0 });
    assert.equal(none.asIs + none.edited + none.notTaken, 0, 'and nothing is divided by nothing');
  });

  test('the drawer computes nothing of its own', () => {
    const body = drawer();
    assert.ok(/aiTraceStats\(/.test(body) && /aiTraceShares\(/.test(body),
      'it asks the reading for both the counts and the shares');
    assert.ok(!/Math\.round/.test(body),
      'counting is not drawing — a percentage worked out here is a second arithmetic');
  });

  /* REVERSED IN PLACE 9 Sep 2026: there are TWO kinds of empty now, because the
     book can hold Copilot history from before the recording existed. Never used
     at all is a different fact from nothing since the recording started, and the
     claim is stronger for naming both. */
  test('an empty book says which kind of empty it is, and there are two kinds', () => {
    const body = drawer();
    assert.ok(/ai_tr_since_none.*:.*ai_tr_none|ai_tr_none.*:.*ai_tr_since_none/.test(body),
      'the empty state is chosen by whether history holds anything');
    assert.ok(body.includes("i18t('ai_tr_none_why')"),
      'an empty state that only says "nothing here" leaves the reader guessing why');
    assert.ok(body.includes("i18t('ai_tr_before_why')"),
      'and a book with history says what that history cannot answer');
  });

  test('the table prints counts and the tiles print shares', () => {
    const body = drawer();
    assert.ok(/cell\(r\.proposals, true\)\}\$\{cell\(r\.asIs\)\}\$\{cell\(r\.edited\)\}\$\{cell\(r\.refused \+ r\.pending\)/.test(body),
      'every cell in a row is a count, so no row can fail to add up');
    assert.ok(/sh\.asIs \+ '%'/.test(body), 'and the tiles carry the shares');
  });

  test('it says when the counting started, and what "not taken" holds', () => {
    const body = drawer();
    assert.ok(body.includes("i18t('ai_tr_started')"),
      'a workspace with a year behind it would otherwise read a small number as a verdict');
    assert.ok(body.includes("i18t('ai_tr_untaken_note')"));
  });
});

/* ============================================================
   8 — the three surfaces that record, and the one that must not
   ============================================================ */
describe('F276 (8) where a proposal is recorded', () => {
  test('the clause editor records at arrival and stamps at the press', () => {
    const code = strip(CE);
    assert.ok(/aiTraceNote\(_ceC,\s*\{\s*feature:\s*'redline'/.test(code),
      'a Copilot card is recorded when it lands, or the ones nobody takes are invisible');
    assert.ok(/aiTraceApplied\(_ceC,\s*card\.trace,\s*_ceText\)/.test(code),
      'and what the draft became is read off the draft, never off the card');
  });

  test('the playbook records only Copilot\'s own draft, and our standard is a refusal', () => {
    const code = strip(CE);
    assert.ok(/const _pbDraft = String\(\(it && it\.draft\)/.test(code),
      'preferred and fallback are the clause library\'s, not Copilot\'s');
    assert.ok(/parts\[1\] !== 'draft'\) aiTraceRefuse/.test(code),
      'using our own standard instead is exactly a refusal of the draft');
  });

  test('obligations record every proposal shown, and unticking is an explicit no', () => {
    const code = strip(OB);
    assert.ok(/feature: 'obligations'/.test(code));
    assert.ok(/aiTraceRefuse\(c, id, i18t\('ob_trace_untick'\)\)/.test(code));
    assert.ok(/if \(dupe\[i\] \|\| !window\.aiTraceNote\) return null/.test(code),
      'a duplicate is neither taken nor refused — there was no decision to make');
    assert.ok(/else if \(!ticked\.has\(i\) && window\.aiTraceRefuse\)/.test(code),
      'and a proposal ticked but not added — one that became a duplicate while the '
      + 'window was open — is left as offered rather than read as a refusal');
  });

  test('draft from a sentence is deliberately not recorded, and the file says why', () => {
    assert.ok(!/'draft'/.test(TRACE_CODE.split('AI_TRACE_FEATURES')[1] || TRACE_CODE),
      'no draft feature key');
    assert.ok(/DELIBERATELY NOT RECORDED/.test(TRACE) && /Draft from a sentence/.test(TRACE),
      'a limit that is not written down is a limit somebody rediscovers');
  });

  test('the settle sits at the funnel and nowhere else', () => {
    assert.ok(/aiTraceSettle\(c, \{ clauseId: ch\.clauseId/.test(strip(NEGO)));
    assert.equal((strip(CE).match(/aiTraceSettle/g) || []).length, 0,
      'no door settles its own filing — that is the funnel\'s job');
  });

  test('a sealed record takes no courtesy save', () => {
    const { win, c } = stage();
    let saved = 0;
    win.persist = () => { saved++; };
    c.status = 'Signed';
    c.execution = { at: '2026-01-01T00:00:00.000Z', html: '<p>x</p>' };
    assert.equal(win.aiTraceSave(c), false);
    assert.equal(saved, 0, 'persist is refused on an executed contract — aiNoteRead\'s own lesson');
  });
});

/* ============================================================
   9 — both languages
   ============================================================ */
describe('F276 (9) the words', () => {
  const KEYS = ['ai_tr_title', 'ai_tr_sub', 'ai_tr_none', 'ai_tr_none_why', 'ai_tr_started',
    'ai_tr_proposals', 'ai_tr_as_is', 'ai_tr_edited', 'ai_tr_not_taken',
    'ai_tr_th_feature', 'ai_tr_th_proposals', 'ai_tr_th_as_is', 'ai_tr_th_edited', 'ai_tr_th_not_taken',
    'ai_tr_note', 'ai_tr_untaken_note', 'ai_tr_readings_one', 'ai_tr_readings_other',
    'ai_tr_f_redline', 'ai_tr_f_playbook', 'ai_tr_f_obligations',
    'ce_trace_used_ours', 'ob_trace_untick'];

  test('every key is written in both books', () => {
    for (const k of KEYS)
      assert.equal((I18N.match(new RegExp(`\\n\\s*${k}:`, 'g')) || []).length, 2,
        `${k} must be in English and in Swedish`);
  });

  test('and no key resolves to itself', () => {
    const { win } = stage();
    for (const lang of ['en', 'sv']){
      win.langSet(lang);
      for (const k of KEYS) assert.notEqual(win.i18t(k), k, `${k} is missing in ${lang}`);
    }
    win.langSet('en');
  });
});

/* ============================================================
   10 — WHAT HISTORY ALREADY HOLDS (owner-asked 9 Sep 2026)
   ============================================================
   The recording starts the day it ships, so the drawer opened empty on every
   workspace and the owner reported the feature as simply not being there. This
   is the half that CAN be recovered — and, just as importantly, the three
   halves that cannot. */
describe('F276 (10) the history count', () => {
  const bookOf = changes => [{ id: 'MK-1', changes }];

  test('a change filed from Copilot wording is counted', () => {
    const { win } = buildWorld({});
    const h = win.aiTraceHistory(bookOf([{ id: 'CHG-1', note: 'Copilot — Simplify' }]));
    assert.equal(h.taken, 1);
    assert.equal(h.contracts, 1);
  });

  test('a PLAYBOOK filing is deliberately not counted', () => {
    const { win } = buildWorld({});
    /* Two of the playbook's three wordings are the workspace's OWN clause
       library, and the note does not say which went in. Counting it would be
       HaTi taking credit for its customer's drafting — the same rule the
       recording itself keeps. */
    const h = win.aiTraceHistory(bookOf([{ id: 'CHG-1', note: 'Playbook — Payment terms' }]));
    assert.equal(h.taken, 0);
  });

  test('an ordinary change with no provenance is not counted', () => {
    const { win } = buildWorld({});
    assert.equal(win.aiTraceHistory(bookOf([{ id: 'CHG-1' }, { id: 'CHG-2', note: 'Typo' }])).taken, 0);
  });

  test('archived rounds are counted too — closing a round moves a change off c.changes', () => {
    const { win } = buildWorld({});
    const h = win.aiTraceHistory([{ id: 'MK-1', changes: [{ id: 'CHG-9', note: 'Copilot — Shorten' }],
      negotiation: { rounds: [ { n: 1, changes: [
        { id: 'CHG-1', note: 'Copilot — Firmer' }, { id: 'CHG-2', note: 'Playbook — Liability' } ] } ] } }]);
    assert.equal(h.taken, 2, 'one live and one archived; the playbook one is not ours to claim');
  });

  test('one change is never counted twice', () => {
    const { win } = buildWorld({});
    const ch = { id: 'CHG-1', note: 'Copilot — Simplify' };
    const h = win.aiTraceHistory([{ id: 'MK-1', changes: [ch],
      negotiation: { rounds: [{ n: 1, changes: [ch] }] } }]);
    assert.equal(h.taken, 1, 'a double-counted figure is the one thing this must not print');
  });

  test('IT READS WITHOUT WRITING — no negotiation is started by counting the book', () => {
    const { win } = buildWorld({});
    const c = { id: 'MK-1', format: 'rich', redlineText: CLAUSE };
    win.aiTraceHistory([c]);
    assert.ok(!('negotiation' in c),
      'negoAllChanges and negoChanges both call negoInit, which would start a negotiation on ' +
      'every contract merely by counting it');
    assert.equal(c.redlineText, CLAUSE, 'and would stamp clause ids into the document');
  });

  test('the reading never touches a route or the network', () => {
    for (const bad of ['api(', 'fetch(', "'ai/", 'aiTraceHistory = async']) {
      assert.ok(!TRACE_CODE.includes(bad), `js/aitrace.js must not contain ${bad}`);
    }
    assert.ok(!/negoAllChanges|negoChanges\(/.test(TRACE_CODE),
      'it must read c.changes and the rounds RAW');
  });

  test('the drawer prints the count and says what it cannot answer', () => {
    const body = drawer();
    assert.ok(body.includes('aiTraceHistory'), 'the section asks for it');
    assert.ok(body.includes("i18tn('ai_tr_before'"), 'and prints it as a count, one/other');
    assert.ok(body.includes("i18t('ai_tr_before_why')"),
      'a figure this partial without its limit beside it is worse than no figure');
    assert.ok(!/ai_tr_before[^_]/.test(body) || body.includes("i18tn('ai_tr_before'"),
      'never as a second table pretending to the same four columns');
  });

  test('and it is read through window, so a stage without the file draws no line', () => {
    assert.ok(/window\.aiTraceHistory/.test(drawer()),
      'a bare cross-module read throws; this file is loaded on stages that carry no aitrace.js');
  });
});

/* ============================================================
   11 — THE PANEL IS THE KEY, THE MONEY AND WHAT CAME OF IT
   ============================================================
   Owner-asked 9 Sep 2026. The claim is NOT that things were deleted — every one
   of them is a wall somebody argued for, and two are named in the rulebook. It
   is that they FOLD, and that the three things a person reads are above the
   fold. */
describe('F276 (11) the folded panel', () => {
  /* THE SERVER BRANCH ONLY. stEngineBodyHtml returns a short local-mode panel
     first — key, a note, and the acceptance reading — and reading both together
     puts that branch's stAcceptanceHtml() BEFORE the spend table and makes an
     ordering claim answer about the wrong panel. The fold is the server one. */
  const panel = () => {
    const all = strip(SETTINGS).split('function stEngineBodyHtml(){')[1].split('\nfunction ')[0];
    return all.slice(all.lastIndexOf('id="ai-cfg-status"'));
  };

  test('the key box, the spend and the proposals all read before the fold', () => {
    const b = panel();
    const fold = b.indexOf('<details');
    assert.ok(fold > 0, 'there is a fold');
    for (const id of ['id="ai-key"', 'id="ai-spend-breakdown"', '${stAcceptanceHtml()}']) {
      assert.ok(b.indexOf(id) > 0 && b.indexOf(id) < fold, `${id} must read before the fold`);
    }
  });

  test('and it sits directly after the spend, where the owner\'s drawing puts it', () => {
    const b = panel();
    assert.ok(b.indexOf('id="ai-spend-breakdown"') < b.indexOf('${stAcceptanceHtml()}'),
      'what it cost, then what came of it');
    assert.ok(b.indexOf('${stAcceptanceHtml()}') < b.indexOf('<details'),
      'and nothing configurable in between');
  });

  test('EVERY WALL IS STILL THERE — folded is not deleted', () => {
    const b = panel();
    for (const id of ['ai-daily-spend', 'ai-renewal-prep', 'ai-renewal-max', 'ai-rates-table',
                      'ai-model-fast', 'ai-spend-people', 'meta-backfill', 'ai-allow-budget']) {
      /* A limit field is built by stLimitField, so its id is an ARGUMENT rather
         than markup — reading only for id="…" would report half these walls as
         missing on a panel that still draws every one of them. */
      assert.ok(b.includes(`id="${id}"`) || b.includes(`'${id}'`),
        `${id} is a control somebody argued for; it may fold, not go`);
    }
  });

  test('the fold is shut by default and remembers nothing', () => {
    const b = panel();
    assert.ok(/<details class="st-adv" id="ai-advanced">/.test(b), 'no open attribute');
    assert.ok(!/st-adv[^>]*\bopen\b/.test(b));
    assert.ok(!/localStorage|hati\.v1\.[a-z]*adv/i.test(b),
      'a drawer that remembered being open would put the wall of boxes back');
  });

  test('it is not called Advanced, because the model row already is', () => {
    const b = panel();
    assert.ok(b.includes("i18t('set_more_settings')"), 'the fold has its own name');
    assert.ok(b.includes("i18t('set_advanced_override')"),
      'and the model routing keeps its own, which is why the two may not share a word');
  });

  test('both dictionaries carry every word this panel gained', () => {
    for (const k of ['set_more_settings', 'set_more_settings_sub', 'set_spend_today',
                     'ai_tr_before_one', 'ai_tr_before_other', 'ai_tr_before_why', 'ai_tr_since_none']) {
      const hits = (I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length;
      assert.equal(hits, 2, `${k} must be in BOTH books, found ${hits}`);
    }
  });
});
