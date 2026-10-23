'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f747 — NEEDS YOU HERE, AS DRAWN (round 3 of the redesign, "Tabs and
   faces"; the owner's "build all the gaps", 18 Oct 2026)
   (1) A private note of YOURS due on the contract in front is a row in Needs
       you here (pdNoteRows): "1 note due today", its own words quoted and
       "only you", with Open note (myNotesOpen, My notes' own door). It is My
       notes' own reading (mineNotesDue), narrowed to this contract; the store
       answers only for the person signed in, so only the owner of the note
       ever sees it. Not loaded yet, it is loaded once and the card painted
       again. A note on another contract, or none due, draws nothing.
   (2) Their redlines waiting on us say which clauses they are on ("waiting
       4 days · clauses 7 and 11") and open with "Open redlines".
   (3) "all N" — the Counter's own number, in the drawn lower case.
   (4) Reading writes nothing; the words are in both books.
   PASS 3 (the owner's answer (8) of 18 Oct 2026, and the second review):
   (5) THEIR REDLINES ARE OWED AFTER 5 QUIET DAYS, UNCHANGED: Needs you here
       draws needsYouOf's own 'quiet' row and no row of its own before it
       (pass 2's deskWaitingFresh is gone); the tab and the pill count only
       what the checklist counts.
   (6) Jambo's work here in the drawing's words: "Jambo's work · Nordvik's
       answer", its line whole ("Prepared overnight: an answer to each
       redline"), read off the agent's own piece.
   (7) Needs you here is PINNED above the conversation (pdJamboPinHtml) and
       painted again in place; "all N" and Open note land (landOn).
   AT THE PARENT (8dc306a) every test here FAILS but 4a, a guard (reading
   writes nothing) that holds there too: pdNoteRows and
   pdAskClausesSay do not exist, the quiet row's verb is "Answer" and the
   door reads "All N".
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && k in v) ? v[k] : m);
const TODAY = '2026-10-18';

function stage({ notes = [], loaded = true, needs = [], asks = [], fresh = null, round = null } = {}){
  const c = { id: 'MK-1', contractNo: 'MK-1', counterparty: 'Nordvik Logistik AB', status: 'Under Review',
    changes: asks.map((a, i) => ({ id: 'ch' + i, status: 'pending', authorSide: 'counterparty', clauseLabel: a, ops: [] })) };
  const calls = [];
  const ctx = {
    intel: { paper: { id: 'MK-1' }, dockOpen: true }, state: { view: 'dashboard' },
    getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
    i18t: (k, v) => fill(k in BOOKS.en ? BOOKS.en[k] : k, v),
    i18tn: (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || k, Object.assign({ n }, v || {})),
    igHomePaperFace: () => true, hbFace: () => 'paper', canEdit: () => true, PORTAL_MODE: false,
    detailsOf: () => ({ left: 0, all: 4, live: true, items: [] }), signBlockers: () => [], negoMayStartLine: () => '',
    contractStatusTextHtml: () => '<span class="room-stat">In review</span>',
    /* RE-POINTED 23 Oct 2026 (the rest of Round A): Jambo's pieces here are the one desk's, worded by its one builder */
    ndJamboFor: () => round ? [{ g: 'jambo', agent: 'round', it: { key: 'answer:MK-1', kind: 'answer', cid: 'MK-1' }, n: 1, late: 1, age: 4 }] : [],
    ND_MERGE: { answer: ['quiet'], renewal: ['renewal'], notice: ['renewal'], read: ['details'] },
    ndParts: () => ({ title: 'Nordvik Logistik’s answer', step: { n: 5, of: 6 }, read: 'their changes, your standards and past deals', when: '4 days', late: true,
      line: 'Answers to their 2 redlines, read against our standards.' }),
    agentsData: () => ({ agents: { round: { ready: round ? [Object.assign({ agent: 'round', kind: 'answer', key: 'answer:MK-1', cid: 'MK-1' }, round)] : [] } } }),
    langLocale: () => 'en-GB', landOn: (t, o) => { calls.push(['land', typeof t === 'function' ? 'fn' : t]); return Promise.resolve(null); },
    hbNeedsOpen: () => calls.push(['home-needs']), CSS: { escape: x => x },
    needsYouOf: () => needs.slice(), deskWaitingFresh: () => fresh,
    NEEDS_YOU_ORDER: ['quiet', 'review', 'look', 'approval', 'refused', 'note', 'suggest', 'join', 'details', 'sign', 'renewal'],
    insNeedWords: (cc, it) => ({ title: 'Answer Nordvik Logistik AB’s 2 redlines', sub: '<span class="late">waiting 4 days</span>', plain: 'waiting 4 days' }),
    INS_NEED_VERB: { quiet: 'home_verb_answer', note: 'home_verb_answer' },
    negoNeedsYouIds: () => c.changes.map(x => x.id),
    clauseParseHeading: t => { const m = /^(\d+)\.?\s+(.*)$/.exec(String(t)); return m ? { num: m[1], title: m[2] } : { num: '', title: t }; },
    mineNotesDue: () => notes.filter(n => n.reviewBy <= TODAY), mineLoaded: () => loaded,
    mineLoad: () => { calls.push(['load']); return Promise.resolve(); },
    todayISO: () => TODAY, regDotDate: d => d,
    myNotesOpen: id => calls.push(['open', id]),
    counterNeedsCount: () => 7, deskGoCounter: () => calls.push(['counter']),
    jamboFaceHtml: () => '', renderIntelDock: () => {}, setTimeout: () => 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(PD, ctx);
  return { ctx, c, calls };
}
const J = x => JSON.parse(JSON.stringify(x));

describe('f747 (1) a note of yours due here', () => {
  const NOTE = { id: 'n1', contractId: 'MK-1', title: '', body: 'Check Nordvik\'s insurance broker.', reviewBy: TODAY };
  test('1a "1 note due today", its words and "only you", with Open note', () => {
    const { ctx, c } = stage({ notes: [NOTE] });
    const html = ctx.pdNeedsHtml(c);
    assert.match(html, /<div class="pd-gl-row pd-nd-row is-note" data-pd-nd-kind="mynote"><span><b>1 note due today<\/b><small title="“Check Nordvik&#39;s insurance broker\.” · only you">“Check Nordvik&#39;s insurance broker\.” · only you<\/small><\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-nd-note="n1">Open note<\/button><\/div>/);
    assert.match(html, /<b>Needs you here<\/b><span class="pd-pill is-quiet"><i><\/i>1<\/span>/, 'counted with the card\'s rows');
  });
  test('1b two due, the earliest leads; one late says the day it was due', () => {
    const { ctx, c } = stage({ notes: [{ ...NOTE, id: 'n2', reviewBy: TODAY }, { ...NOTE, id: 'n3', body: 'Older', reviewBy: '2026-10-12' }] });
    const r = J(ctx.pdNoteRows(c));
    assert.equal(r.length, 1); assert.equal(r[0].n, 2); assert.equal(r[0].first.id, 'n3'); assert.equal(r[0].late, true);
    assert.match(ctx.pdNeedsHtml(c), /is-note is-hot"[\s\S]*<b>2 notes due, the first since 2026-10-12<\/b>[\s\S]*“Older” · only you/);
  });
  test('1c a note on another contract, a note not yet due, or none: nothing', () => {
    assert.equal(stage({ notes: [{ ...NOTE, contractId: 'MK-2' }] }).ctx.pdNoteRows({ id: 'MK-1' }).length, 0);
    assert.equal(stage({ notes: [{ ...NOTE, reviewBy: '2026-10-25' }] }).ctx.pdNoteRows({ id: 'MK-1' }).length, 0);
    assert.equal(stage().ctx.pdNeedsHtml({ id: 'MK-1' }), '');
  });
  test('1d not loaded yet: loaded once, then the card is painted again', () => {
    const { ctx, c, calls } = stage({ notes: [NOTE], loaded: false });
    assert.equal(ctx.pdNoteRows(c).length, 0);
    ctx.pdNoteRows(c);
    assert.deepEqual(calls.filter(x => x[0] === 'load').length, 1, 'once');
    assert.match(PD, /Promise\.resolve\(mineLoad\(\)\)\.then\(\(\) => \{ try \{ pdNeedsRepaint\(\); \} catch \(_\)\{\} \}/);
  });
  /* RE-POINTED (pass 3, LAND ON IT): My notes' own door, then the note's row lit */
  test('1e Open note is My notes\' own door, and lands on the note\'s row', () => {
    const wiring = PD.slice(PD.indexOf('document._pdJamboTopWired = true'), PD.indexOf('JAMBO, ALIVE'));
    assert.match(wiring, /const nn = t\.closest\('\[data-pd-nd-note\]'\);\s*\/\*[^*]*\*\/\s*if \(nn\)\{ e\.preventDefault\(\); const nid = nn\.getAttribute\('data-pd-nd-note'\);\s*if \(typeof myNotesOpen === 'function'\) myNotesOpen\(nid\);\s*if \(nid && typeof landOn === 'function'\) landOn\(\(\) => document\.querySelector\(`\[data-mn-row="\$\{CSS\.escape\(nid\)\}"\]`\), \{ block: 'nearest', focus: false \}\);/);
    assert.match(R('js/views/mynotes.js'), /<tr data-mn-row="\$\{_mnE\(n\.id\)\}"/, 'the row it lands on');
  });
  test('1f only the note\'s owner: it reads My notes\' own store, scoped to the person signed in', () => {
    const fn = PD.slice(PD.indexOf('function pdNoteRows('), PD.indexOf('function pdAskClausesSay('));
    assert.match(fn, /mineNotesDue\(\)/);
    assert.ok(!/api\(|fetch\(|getUsers|state\.contracts/.test(fn), 'no other store, no other person');
    assert.match(R('server/server.js'), /SELECT \* FROM my_items WHERE user_id=\?/, 'the store answers for the person signed in');
  });
});

describe('f747 (2) their redlines: which clauses, and Open redlines', () => {
  test('2a "waiting 4 days · clauses 7 and 11", Open redlines', () => {
    const { ctx, c } = stage({ needs: [{ kind: 'quiet', urgent: true, n: 2 }], asks: ['7. Limitation of liability', '11. Payment terms'] });
    const html = ctx.pdNeedsHtml(c);
    assert.match(html, /<small title="waiting 4 days · clauses 7 and 11"><span class="late">waiting 4 days<\/span> · clauses 7 and 11<\/small>/);
    assert.match(html, /data-pd-nd="quiet" data-pd-nd-id="MK-1">Open redlines<\/button>/);
  });
  test('2b one clause says "clause"; an unnumbered clause says no list at all', () => {
    assert.equal(stage({ asks: ['7. Limitation of liability'] }).ctx.pdAskClausesSay(stage({ asks: ['7. Limitation of liability'] }).c), 'clause 7');
    const s = stage({ asks: ['7. Limitation of liability', 'Schedule'] });
    assert.equal(s.ctx.pdAskClausesSay(s.c), '', 'never a list that leaves one out');
  });
});

describe('f747 (3) "all N", the Counter\'s own number', () => {
  test('3 the door says "all 7" as drawn and lands on Home\'s Needs you', () => {
    const { ctx, c } = stage({ notes: [{ id: 'n1', contractId: 'MK-1', body: 'x', reviewBy: TODAY }] });
    assert.match(ctx.pdNeedsHtml(c), /data-pd-nd-all title="[^"]*">all 7/);
    assert.equal(BOOKS.en.pd_nd_all, 'all {n}'); assert.equal(BOOKS.sv.pd_nd_all, 'alla {n}');
    assert.equal(BOOKS.en.pd_nd_all_tip, 'Everything that needs you, on Home');
    const wiring = PD.slice(PD.indexOf('document._pdJamboTopWired = true'), PD.indexOf('JAMBO, ALIVE'));
    assert.match(wiring, /if \(t\.closest\('\[data-pd-nd-all\]'\)\)\{ e\.preventDefault\(\); if \(typeof hbNeedsOpen === 'function'\) hbNeedsOpen\(\);/, 'hbNeedsOpen: Home, then landOn(\'#cn-needs\')');
  });
});

describe('f747 (4) reading writes nothing; both books', () => {
  test('4a the record is the same after the card is drawn', () => {
    const { ctx, c } = stage({ notes: [{ id: 'n1', contractId: 'MK-1', body: 'x', reviewBy: TODAY }], needs: [{ kind: 'quiet', n: 2 }], asks: ['7. A', '11. B'] });
    const before = JSON.stringify(c); ctx.pdNeedsHtml(c); assert.equal(JSON.stringify(c), before);
  });
  for (const k of ['pd_nd_note_one', 'pd_nd_note_other', 'pd_nd_note_late_one', 'pd_nd_note_late_other', 'pd_nd_only_you', 'pd_nd_open_note', 'pd_nd_open_red', 'pd_nd_clause_one', 'pd_nd_clause_other', 'pd_nd_and'])
    test(k, () => { assert.ok(BOOKS.en[k] && BOOKS.sv[k] && BOOKS.en[k] !== BOOKS.sv[k], k); });
});

describe('f747 (5) their redlines are owed after the quiet standard, unchanged (the owner\'s answer 8)', () => {
  const ago = d => new Date(Date.now() - d * 864e5).toISOString();
  test('5a before the standard: no row of this panel\'s own, whatever has arrived', () => {
    const { ctx, c } = stage({ needs: [{ kind: 'sign', urgent: false }], asks: ['7. A', '11. B'], fresh: { since: ago(4), n: 2 } });
    assert.deepEqual(J(ctx.pdNeedsRows(c).map(r => r.it)), [{ kind: 'sign', urgent: false }]);
    assert.ok(!/deskWaitingFresh/.test(PD), 'the panel asks no reading of its own');
  });
  test('5b past the standard it is needsYouOf\'s own row, once', () => {
    const { ctx, c } = stage({ needs: [{ kind: 'quiet', urgent: true, n: 2, since: ago(9) }], asks: ['7. A', '11. B'] });
    assert.equal(ctx.pdNeedsRows(c).filter(r => r.it && r.it.kind === 'quiet').length, 1);
  });
  test('5c the desk\'s reading is main\'s: no fresh row, no second standard', () => {
    const D = R('js/desk.js');
    assert.ok(!/deskWaitingFresh|deskAnswerableBy/.test(D));
    assert.ok(!/ag_waiting_today/.test(R('js/views/inspector.js').slice(R('js/views/inspector.js').indexOf("if (it.kind === 'quiet'){"), R('js/views/inspector.js').indexOf("if (it.kind === 'review'){"))));
  });
  test('5d the drawn row past the standard: "waiting N days · clauses 7 and 11 · Open redlines"', () => {
    const { ctx, c } = stage({ needs: [{ kind: 'quiet', urgent: true, n: 2, since: ago(8) }], asks: ['7. Limitation', '11. Payment terms'] });
    assert.match(ctx.pdNeedsHtml(c), /data-pd-nd-kind="quiet"><span><b>Answer Nordvik Logistik AB’s 2 redlines<\/b><small title="waiting 4 days · clauses 7 and 11">[^<]*<span class="late">waiting 4 days<\/span> · clauses 7 and 11<\/small><\/span><button[^>]*data-pd-nd="quiet"[^>]*>Open redlines</);
  });
});

describe('f747 (6) Jambo\'s work here, in the drawing\'s words', () => {
  /* RE-POINTED 23 Oct 2026 (the rest of Round A; the owner picked the Legora way, drawn as
     "Nordvik Logistik's answer · 5 of 6 / Jambo read … · waiting 8 days · Look"): the row is the
     one desk's row, in its words; his whole line rides its hover; their redlines are not a second row */
  test('6a "Nordvik Logistik\'s answer", its step, what Jambo read, how long it waited, Look', () => {
    const { ctx, c } = stage({ round: {}, needs: [{ kind: 'quiet', urgent: true, n: 2 }] });
    const html = ctx.pdNeedsHtml(c);
    assert.match(html, /<b>Nordvik Logistik’s answer<span class="nd-step"[^>]*>5 of 6<\/span><\/b><small title="Answers to their 2 redlines, read against our standards.">/);
    assert.match(html, /<i class="nd-read">Jambo read<\/i> their changes, your standards and past deals · <span class="late">waiting 4 days<\/span>/);
    assert.match(html, /data-pd-nd-jw="round" data-pd-nd-key="answer:MK-1">Look</);
  });
  test('6b their redlines are the piece\'s: no second row for them', () => {
    const { ctx, c } = stage({ round: {}, needs: [{ kind: 'quiet', urgent: true, n: 2 }] });
    assert.ok(!/data-pd-nd="quiet"/.test(ctx.pdNeedsHtml(c)));
    const bare = stage({ needs: [{ kind: 'quiet', urgent: true, n: 2 }] });
    assert.match(bare.ctx.pdNeedsHtml(bare.c), /data-pd-nd="quiet"/, 'with no piece, the redlines are their own row');
  });
  test('6c its line is read whole, wrapped — never cut with an ellipsis', () => {
    const CSS = R('index.html');
    assert.match(CSS, /#ig-dock \.pd-needs \.pd-nd-row small\{[^}]*white-space:normal;overflow:visible;text-overflow:clip/);
  });
  for (const k of ['pd_nd_jw_answer', 'pd_nd_jw_prepared', 'pd_nd_jw_read', 'pd_nd_jw_overnight', 'pd_nd_jw_today', 'pd_nd_jw_yesterday', 'pd_nd_jw_on', 'pd_nd_jw_each_one', 'pd_nd_jw_each_other', 'pd_nd_jw_some'])
    test(k, () => { assert.ok(BOOKS.en[k] && BOOKS.sv[k] && BOOKS.en[k] !== BOOKS.sv[k], k); });
});

describe('f747 (7) Needs you here stays at the top of the tab', () => {
  test('7a the note is a row of the dossier\'s Still owed card, painted again in place', () => {
    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): nothing is pinned
       above the dossier; Needs you here's rows, a note of yours among them,
       are its Still owed card, and repaint with it */
    const { ctx, c } = stage({ notes: [{ id: 'n1', contractId: 'MK-1', body: 'x', reviewBy: TODAY }] });
    ctx.pdContract = () => c;
    assert.equal(ctx.pdJamboPinHtml(), '');
    assert.match(ctx.pdGlanceHtml(c), /id="pd-needs"[\s\S]*data-pd-nd-note="n1"/);
    assert.match(PD.slice(PD.indexOf('function pdNeedsRepaint('), PD.indexOf('function pdNeedsRepaint(') + 400), /pdGlanceRepaint\(\)/);
  });
});
