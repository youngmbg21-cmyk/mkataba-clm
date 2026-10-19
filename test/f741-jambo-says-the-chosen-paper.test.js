'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f741 — JAMBO SAYS THE PAPER CHOSEN ON THE WALL (round 13 of the redesign,
   "Wall of papers", as drawn; the owner's "build all the gaps", 18 Oct 2026)
   (1) What the panel holds: a paper chosen on Home's Document face, with no
       paper up; the head says "Contract"; the ask box "Ask for a contract, a
       number or a list…"; a question there is not about one contract.
   (2) Its facts, each a reading the house already makes: Stage (its words
       and its round) · Stream (a lock where private) · Value (the wall's own,
       no row where values are not the reader's) · Ends · Owner ("You") · Last
       move ("<party> sent 2 redlines", how long ago).
   (3) The panel: name, ref · party, the facts, Needs you (Needs you here's
       own rows, the details owed among them), Open the paper and Life line and
       details; a deal kept to its list says its rule and offers no door.
   (4) Both books.
   (5) PASS 3 (the checker's differences, 18 Oct 2026): their redlines waiting
       on our side are a row of their own — "Answer 2 redlines", the clauses
       under it ("Clause 7 Liability cap · clause 11 Payment terms"), "Open
       redlines" — standing aside past the desk's standard (the checklist's
       'quiet' row says it then); the Value reads as amended, the page's own
       figure; a row's second line wraps, never cut.
   AT THE PARENT (8dc306a) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const lineOf = (src, start) => { const i = src.indexOf(start); if (i < 0) return ''; return src.slice(i, src.indexOf('\n', i) + 1); };
const BOOKS = (() => {
  const en = {}, sv = {};
  /* a value in either quote, the other quote allowed inside it ("Home's") */
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): (?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'),?\s*$/gm)){
    const v = m[2] != null ? m[2] : m[3];
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const FNS = ['pdCardNow', 'pdCardPage', 'pdHolds', 'pdHeldContract', 'pdHeadWord', 'pdAskPlaceholder', 'pdAskContractId', 'pdDaysSince', 'pdAgoWords',
  'pdStageWords', 'pdLastMove', 'pdClauseSaid', 'pdTheirAsksRow', 'pdTheirAsksRowHtml', 'pdChosenFacts', 'pdChosenHtml', 'pdNeedsRows'];
const INDEX = R('index.html');
const J = x => JSON.parse(JSON.stringify(x));
const ago = d => new Date(Date.now() - d * 864e5 - 3600e3).toISOString();
/* the English book's words, filled in, so a sentence reads as the reader sees it */
const say = (k, v) => { const t = BOOKS.en[k]; if (t == null) return k; return t.replace(/\{(\w+)\}/g, (_, x) => (v && v[x] != null) ? v[x] : ''); };
const sayN = (k, n, v) => say(k + (n === 1 ? '_one' : '_other'), Object.assign({ n }, v));
function world(over){
  const ctx = Object.assign({
    Array, JSON, Math, Number, String, Set, Object, Date, isFinite,
    state: { view: 'dashboard' }, intel: { paper: null },
    i18t: say, i18tn: sayN,
    igHomePaperFace: () => true,
    igWallChosen: () => ctx.chosen || null,
    pdContract: () => null,
    contractRef: c => c.id,
    contractStatusMeta: c => ({ label: c.status === 'Under Review' ? 'In Review' : c.status, dot: 'var(--st-amber-dot)' }),
    igLineRound: c => (c.negotiation && c.negotiation.round) || 0,
    regStreamName: c => ({ sales: 'Sales', board: 'Board' })[c.folder] || '',
    streamIsPrivate: f => f === 'board',
    canViewValues: () => true,
    igWallValue: c => (c.value ? 'SEK ' + (c.value / 1e6) + ' M' : '—'),
    insFacts: c => [{ k: 'ends', v: c.expiry ? '31 Dec 2028' : '' }],
    contractOwnerName: c => (c.owner && c.owner.name) || '',
    contractOwnedBy: (c, u) => !!(c.owner && u && c.owner.id === u.id),
    currentUser: () => ({ id: 'u1', name: 'Maria Lindgren' }),
    dsPartyNames: c => [{ name: 'Lindqvist & Co AB', ours: true }, { name: c.counterparty, ours: false }],
    dsThem: P => P.find(p => !p.ours),
    dsChanges: c => (c.changes || []).filter(Boolean),
    negoUnsentAsks: () => [],
    hbAgentsData: () => ({ rows: [] }),
    needsYouOf: c => c.needs || [],
    pdNeedRowHtml: (c, r) => `<row ${r.it ? r.it.kind : 'jw'}>`,
    histMoveOf: c => c.move || null,
    deskMayRedline: c => !c.noSeat,
    negoMayStart: () => ({ ok: true }),
    negoClauseName: s => s,
    effectiveTerm: c => ({ v: null, from: c.amendedBy ? { id: c.amendedBy } : null }),
    icon: () => '<svg/>',
    chosen: null,
  }, over || {});
  ctx.window = ctx;
  vm.createContext(ctx);
  const src = [lineOf(PD, 'const _pdE = '), lineOf(PD, 'const _pdT = '), lineOf(PD, 'const _pdTn = '), lineOf(PD, 'const PD_CH_CLAUSES_MAX = ')].concat(FNS.map(f => fnBody(PD, f))).join('\n');
  vm.runInContext(src, ctx);
  return ctx;
}
const MSA = () => ({ id: 'MK-0382', name: 'Master services agreement', counterparty: 'Nordvik Logistik AB', folder: 'sales', status: 'Under Review',
  value: 4200000, expiry: '2028-12-31', owner: { id: 'u1', name: 'Maria Lindgren' }, negotiation: { round: 2 },
  changes: [{ id: 'CHG-1', authorSide: 'owner', createdAt: ago(9), roundN: 1, status: 'accepted', resolvedAt: ago(8) },
    { id: 'CHG-2', authorSide: 'counterparty', createdAt: ago(4), roundN: 2, status: 'pending' },
    { id: 'CHG-3', authorSide: 'counterparty', createdAt: ago(4), roundN: 2, status: 'pending' }],
  needs: [{ kind: 'quiet', n: 2 }, { kind: 'details', n: 1 }] });

describe('f741 (1) what the panel holds', () => {
  test('1a a paper chosen on the wall, no paper up: the head says "Contract", the box asks about anything', () => {
    for (const f of FNS) assert.ok(fnBody(PD, f), f + ' is defined');
    const w = world(); w.chosen = MSA();
    assert.equal(w.pdHolds(), 'chosen');
    assert.equal(w.pdHeadWord(), 'Contract');
    assert.equal(w.pdAskPlaceholder(), 'Ask for a contract, a number or a list…');
    assert.equal(w.pdAskContractId(), null, 'a question here is not about one contract');
  });
  test('1b nothing chosen, or a paper up, or the Board: it holds none of this', () => {
    const w = world(); assert.equal(w.pdHolds(), '');
    w.chosen = MSA(); w.pdContract = () => MSA(); assert.equal(w.pdHolds(), '', 'a paper up says the paper');
    const b = world({ igHomePaperFace: () => false }); b.chosen = MSA(); assert.equal(b.pdHolds(), '', 'the Board, no page brought up');
  });
});

describe('f741 (2) its facts, each one borrowed', () => {
  test('2a Stage with its round · Stream · Value · Ends · Owner "You" · Last move with how long ago', () => {
    const w = world();
    const F = w.pdChosenFacts(MSA());
    assert.deepEqual(J(F.map(f => f.k)), ['stage', 'stream', 'value', 'ends', 'owner', 'last']);
    const by = k => F.find(f => f.k === k);
    assert.equal(by('stage').v, 'In Review · round 2');
    assert.ok(by('stage').dot, 'the stage\'s own dot');
    assert.equal(by('stream').v, 'Sales'); assert.equal(by('stream').lock, false);
    assert.equal(by('value').v, 'SEK 4.2 M');
    assert.equal(by('ends').v, '31 Dec 2028');
    assert.equal(by('owner').v, 'You');
    assert.equal(by('last').v, 'Nordvik Logistik AB sent 2 redlines');
    assert.equal(by('last').sub, '4 days ago');
  });
  test('2b values not the reader\'s: no Value row (never a dash that claims there is none); someone else owns it: their name', () => {
    const w = world({ canViewValues: () => false, currentUser: () => ({ id: 'u9' }) });
    const F = w.pdChosenFacts(MSA());
    assert.ok(!F.some(f => f.k === 'value'));
    assert.equal(F.find(f => f.k === 'owner').v, 'Maria Lindgren');
  });
  test('2c a private stream wears its lock; a deal kept to its list says only its stage and stream', () => {
    const w = world();
    assert.equal(w.pdChosenFacts({ ...MSA(), folder: 'board' }).find(f => f.k === 'stream').lock, true);
    const coded = w.pdChosenFacts({ id: 'MK-0412', name: 'Project Falcon', folder: 'sales', status: 'Under Review', _codeNamed: true });
    assert.deepEqual(J(coded.map(f => f.k)), ['stage', 'stream']);
  });
  test('2d the last move, read RAW off the record: our unsent asks, their answers, a signature, else when it changed', () => {
    const w = world({ negoUnsentAsks: c => (c.changes || []).filter(x => x.authorSide === 'owner') });
    assert.equal(w.pdLastMove({ ...MSA(), changes: [{ id: 'C1', authorSide: 'owner', createdAt: ago(1), roundN: 3, status: 'pending' }] }).text, '1 redline of ours, not sent yet');
    const a = w.pdLastMove({ ...MSA(), changes: [{ id: 'C1', authorSide: 'owner', createdAt: ago(5), roundN: 1, status: 'accepted', resolvedAt: ago(2) },
      { id: 'C2', authorSide: 'owner', createdAt: ago(5), roundN: 1, status: 'rejected', resolvedAt: ago(2) }] });
    assert.equal(a.text, 'Nordvik Logistik AB answered 2 redlines');
    assert.equal(w.pdLastMove({ ...MSA(), changes: [], signatures: [{ at: ago(3), name: 'Per Nordvik' }] }).text, 'Per Nordvik signed');
    assert.equal(w.pdLastMove({ ...MSA(), changes: [], signedAt: '2026-04-28' }).text, 'Signed');
    assert.equal(w.pdLastMove({ ...MSA(), changes: [], updatedAt: ago(0) }).text, 'Last changed');
    assert.equal(w.pdLastMove({ ...MSA(), changes: [] }), null, 'nothing known: nothing said');
    assert.equal(w.pdAgoWords(ago(0)), 'today');
  });
  test('2e reading writes nothing: the record is the same after every reading', () => {
    const w = world(); const c = MSA(); const before = JSON.stringify(c);
    w.pdChosenFacts(c); w.pdLastMove(c); w.pdChosenHtml(c);
    assert.equal(JSON.stringify(c), before);
  });
});

describe('f741 (3) the panel', () => {
  test('3a name, ref · party, the facts, Needs you (the details owed among them), Open the paper, Life line and details', () => {
    const w = world();
    const h = w.pdChosenHtml(MSA());
    assert.match(h, /^<div id="pd-chosen" class="pd-chosen" data-pd-chosen-for="MK-0382"><h3 class="pd-ch-name">Master services agreement<\/h3><p class="pd-ch-ref">MK-0382 · Nordvik Logistik AB<\/p>/);
    assert.match(h, /<dt>Last move<\/dt><dd><span>Nordvik Logistik AB sent 2 redlines<\/span> <small>4 days ago<\/small><\/dd>/);
    assert.match(h, /<div class="pd-ch-h">Needs you<\/div><div class="pd-glance pd-needs pd-ch-needs"><div class="pd-gl-b"><row quiet><row details><\/div><\/div>/);
    assert.match(h, /data-pd-ch-open="MK-0382"[^>]*>Open the paper<\/button><button type="button" class="ui-btn ui-btn-sm" data-pd-ch-life="MK-0382"[^>]*>Life line and details<\/button>/);
    assert.match(h, /ui-btn-primary" data-pd-ch-open/, 'Open the paper is the one filled button');
  });
  test('3b nothing owed: no Needs you; the details owed stay off the paper\'s own Needs you here (its glance has them)', () => {
    const w = world();
    assert.doesNotMatch(w.pdChosenHtml({ ...MSA(), needs: [] }), /Needs you/);
    assert.deepEqual(J(w.pdNeedsRows(MSA()).map(r => r.it.kind)), ['quiet'], 'beside a paper: the glance says the details');
    assert.deepEqual(J(w.pdNeedsRows(MSA(), { details: true }).map(r => r.it.kind)), ['quiet', 'details']);
  });
  test('3c a deal kept to its list: its code name, number and stream, the rule in the stop\'s own words, and no door it would refuse', () => {
    const w = world();
    const h = w.pdChosenHtml({ id: 'MK-0412', name: 'Project Falcon', folder: 'sales', status: 'Under Review', _codeNamed: true });
    assert.match(h, /<p class="pd-ch-ref">MK-0412 · Sales<\/p>/);
    assert.match(h, /<p class="pd-ch-rule">Project Falcon is a confidential deal: only the people named on it may open it\.<\/p>/);
    assert.doesNotMatch(h, /data-pd-ch-open|data-pd-ch-life/);
  });
  test('3d the panel\'s doors: Open the paper is the wall\'s open, Life line and details brings up its page', () => {
    const i = PD.indexOf('document._pdHeldWired'), seg = PD.slice(i, PD.indexOf('\n}\n', i));
    /* RE-POINTED (pass 4, LAND ON IT): each door lands on what it opened — the
       paper, the page brought up — through the one lander (pdHeldLand) */
    assert.match(seg, /\[data-pd-ch-open\][\s\S]*?igWallOpen\(id\) !== false\) pdHeldLand\('paper', id\)/);
    assert.match(seg, /\[data-pd-ch-life\][\s\S]*?igWallLetGo\(\);[\s\S]*?hbStripBring\(id\) !== false\) pdHeldLand\('page', id\)/);
    assert.match(fnBody(PD, 'pdJamboTopHtml'), /const held = pdHeldTopHtml\(\); if \(held != null\) return held;/);
  });
});

describe('f741 (5) pass 3: their redlines, the value as amended, a row that wraps', () => {
  const MOVE = { k: 'you', theirs: [{ id: 'CHG-2', clauseId: 'c7', clauseLabel: '7 Liability cap' }, { id: 'CHG-3', clauseId: 'c11', clauseLabel: '11 Payment terms' }], ours: [], open: 2 };
  test('5a our move, their two changes open: "Answer 2 redlines", the clauses under it, "Open redlines" — after Jambo\'s work, before the checklist\'s rows', () => {
    const w = world();
    const h = w.pdChosenHtml({ ...MSA(), move: MOVE, needs: [{ kind: 'details', n: 1 }] });
    assert.match(h, /<div class="pd-gl-b"><div class="pd-gl-row pd-nd-row" data-pd-nd-kind="answer"><span><b>Answer 2 redlines<\/b><small title="Clause 7 Liability cap · clause 11 Payment terms">Clause 7 Liability cap · clause 11 Payment terms<\/small><\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-ch-red="MK-0382"[^>]*>Open redlines<\/button><\/div><row details><\/div>/);
    const one = w.pdTheirAsksRow({ ...MSA(), move: { ...MOVE, theirs: [MOVE.theirs[0], { id: 'CHG-4', clauseId: 'c7', clauseLabel: '7 Liability cap' }] }, needs: [] });
    assert.equal(one.n, 2); assert.equal(one.sub, 'Clause 7 Liability cap', 'one clause said once');
    const many = w.pdTheirAsksRow({ ...MSA(), move: { ...MOVE, theirs: ['1 A', '2 B', '3 C', '4 D', '5 E'].map((l, i) => ({ id: 'X' + i, clauseId: 'k' + i, clauseLabel: l })) }, needs: [] });
    assert.equal(many.sub, 'Clause 1 A · clause 2 B · clause 3 C · 2 more', 'a few, then how many more');
  });
  test('5b it stands aside: past the desk\'s standard (the checklist\'s own row says it), their move, no seat, a deal kept to its list', () => {
    const w = world();
    assert.equal(w.pdTheirAsksRow({ ...MSA(), move: MOVE, needs: [{ kind: 'quiet', n: 2 }] }), null, 'never said twice');
    assert.equal(w.pdTheirAsksRow({ ...MSA(), move: { ...MOVE, k: 'them' }, needs: [] }), null);
    assert.equal(w.pdTheirAsksRow({ ...MSA(), move: { ...MOVE, theirs: [] }, needs: [] }), null);
    assert.equal(w.pdTheirAsksRow({ ...MSA(), move: MOVE, needs: [], noSeat: true }), null);
    assert.equal(w.pdTheirAsksRow({ ...MSA(), move: MOVE, needs: [], _codeNamed: true }), null);
  });
  test('5c its door opens Jambo\'s Redlines on that contract, letting the choice go', () => {
    const i = PD.indexOf('document._pdHeldWired'), seg = PD.slice(i, PD.indexOf('\n}\n', i));
    assert.match(seg, /\[data-pd-ch-red\][\s\S]*?igWallLetGo\(\);[\s\S]*?pdRedOpen\(id\)/);
  });
  test('5d the Value reads as amended, and says which amendment set it', () => {
    const w = world();
    const v = w.pdChosenFacts({ ...MSA(), amendedBy: 'MK-0377-A1' }).find(f => f.k === 'value');
    assert.equal(v.sub, 'as amended by MK-0377-A1');
    assert.equal(w.pdChosenFacts(MSA()).find(f => f.k === 'value').sub, '', 'no amendment: no words');
    const IG = R('js/views/intelligence.js');
    assert.match(fnBody(IG, 'igWallValue'), /cv=effectiveValueView\(c\)\|\|c;[\s\S]*?fmtMoneyShortOf\(cv\)/, 'the wall\'s value is the List\'s own: as amended');
  });
  test('5e a row\'s second line wraps on the chosen paper\'s panel, its button at the top', () => {
    assert.match(INDEX, /#ig-dock \.pd-ch-needs \.pd-nd-row\{align-items:flex-start\}/);
    assert.match(INDEX, /#ig-dock \.pd-ch-needs \.pd-nd-row small\{white-space:normal;overflow:visible;text-overflow:clip;/);
  });
  test('5f every new word in English and Svenska', () => {
    for (const k of ['pd_ch_answer_one', 'pd_ch_answer_other', 'pd_ch_clause', 'pd_ch_clause_lc', 'pd_ch_more_one', 'pd_ch_more_other', 'pd_ch_go_red', 'pd_ch_go_red_tip', 'pd_ch_value_amended']){
      assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k);
    }
    assert.equal(BOOKS.en.pd_ch_go_red, 'Open redlines');
  });
});

describe('f741 (4) both books', () => {
  test('4a every new word in English and Svenska', () => {
    const keys = ['pd_ch_head', 'pd_ask_any', 'pd_ago_today', 'pd_ago_days_one', 'pd_ago_days_other', 'pd_lm_signed', 'pd_lm_signed_plain', 'pd_lm_touched',
      'pd_lm_drafted_one', 'pd_lm_drafted_other', 'pd_lm_sent_one', 'pd_lm_sent_other', 'pd_lm_answered_one', 'pd_lm_answered_other',
      'pd_ch_stage', 'pd_ch_stream', 'pd_ch_value', 'pd_ch_ends', 'pd_ch_owner', 'pd_ch_last', 'pd_ch_needs', 'pd_ch_open', 'pd_ch_open_tip', 'pd_ch_life', 'pd_ch_life_tip'];
    for (const k of keys){ assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  });
});
