/* ═══════════════════════════════════════════════════════════════════════════
   f867 — THE ONE DESK (Round A; the owner picked "The Legora Way" by name,
   22 Oct 2026, then: "Why don't you just move them to board?", "the card
   still has to go below the KPIs card", "make all of the buttons the same
   size", "Yes, go ahead and build it and merge to main")

   Needs you is ONE reading (ndRead, js/views/counter.js): what Jambo has
   prepared and what only you can do. Home draws the top three of each group;
   "Show all N" lands on the Board, where the whole of it stands under Your
   book (ndBoardHtml inside hbPrepHtml).

   WHAT THIS PINS
     (1) one reading: a waiting thing and the piece Jambo prepared for it are
         ONE row, the piece's, carrying the wait and the red; more than three
         contracts owing details are one row; every thing is counted once
     (2) Home: Jambo's group first, three rows of each, "Show all N" onto the
         Board; each piece says its step and what Jambo read
     (3) the Board: tabs All · Your move · Jambo prepared, only the kinds there
         are, a find box, five columns, twelve rows at a time; the find box
         narrows the rows and is never redrawn; the card stands under Your
         book and never folds or closes; its tab, kind and words come back
         after a refresh (the Board's place)
     (4) one button width, one word each, in both books
   AT THE PARENT (df2a3e3) every test here FAILS: there is no ndRead.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CN = R('js/views/counter.js');
const HB = R('js/views/homeboard.js');
const CSS = R('index.html');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const constLine = (src, name) => { const m = src.match(new RegExp('^(const|let) ' + name + '\\b[^\\n]*$', 'm')); return m ? m[0] : ''; };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const fill = (s, v) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

const NAMES = ['cnDayWords', 'cnMayMoney', 'cnNeedTitle', 'cnNeedDoorAttrs', 'ndPieces', 'ndAgeOf', 'ndPieceAge', 'ndKindOf', 'ndRead', 'ndSumWords', 'ndStepOf', 'ndParts',
  'ndHomeRowHtml', 'ndHomeHtml', 'ndKindsOf', 'ndOnBoard', 'ndInTab', 'ndBoardList', 'ndBoardRowHtml', 'ndBoardRowsHtml', 'ndBoardHtml', 'ndShow', 'ndPlace', 'ndPlacePut'];
const CONSTS = ['_cnE', '_cnT', '_cnTn', '_cnFirst', '_cnWho', '_cnToday', '_cnPill', 'CN_ROWS', 'ND_PAGE', 'ND_BUNDLE_MIN', 'ND_MERGE', 'ND_KIND_OF', 'ND_KINDS', 'ND_BTN', 'ND_NOT_WAITED',
  '_ndAge', 'ndThings', '_ndCall', '_ndText', '_ndBtnHtml', '_ndStepHtml', '_ndTagHtml'];
function world(rows, pieces, extra){
  const ctx = {
    i18t: (k, v) => fill(BOOKS.en[k] || k, v), i18tn: (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || BOOKS.en[k] || k, { n, ...(v || {}) }),
    todayISO: () => today, langLocale: () => 'en-GB', icon: n => `<svg data-ic="${n}"></svg>`, setTimeout: () => 0,
    hbNyWhat: x => x.it.title || '', hbNyDays: n => n === 0 ? 'today' : n + ' days', contractRef: c => c.id, streamIsPrivate: () => false, FOLDERS: {},
    fmtMoneyShortOf: () => 'KES 8.10M', canViewValues: () => true, isMonetary: () => true, fxIsPay: () => false, agPoss: n => n + '’s',
    cnRows: () => rows, cnCompany: () => [], cnSetup: () => 0,
    AG_KEYS: ['round', 'late', 'paper', 'approve'], AG_DEF: { round: { review: 4, steps: [1, 2, 3, 4, 5, 6] }, late: { review: 2, steps: [1, 2, 3, 4] }, paper: { review: 4, steps: [1, 2, 3, 4, 5, 6] } },
    agentsData: () => ({ agents: { round: { ready: (pieces || []).filter(p => p.agent === 'round') }, late: { ready: (pieces || []).filter(p => p.agent === 'late') },
      paper: { ready: (pieces || []).filter(p => p.agent === 'paper') }, approve: { ready: [{ key: 'ap:MK-1', kind: 'approve', agent: 'approve' }] } } }),
    agPieceTitle: it => 'Piece ' + it.key, agPieceLine: () => 'What he found.', agPieceRefHtml: it => it.c ? it.c.id : '', agCardParts: it => ({ urg: it.kind === 'chase' ? it.days + ' days late' : '' }),
    ...(extra || {}),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(CONSTS.map(n => constLine(CN, n)).join('\n') + '\nlet _ndMemo = null, _nd = { tab: "all", kind: "any", q: "", more: 0 };\n'
    + NAMES.map(n => fnBody(CN, n)).join('\n') + '\nthis._ndNow = () => _nd;', ctx);
  return ctx;
}
const C = (id, cp) => ({ id, name: 'Agreement ' + id, counterparty: cp, value: 1e6 });
const row = (id, kind, extra) => ({ k: 'c', kind, urgent: false, x: { c: C(id, 'Party ' + id), it: { kind, n: 1, ...(extra || {}) }, age: null }, ...(extra && extra.row || {}) });
const redlines = { ...row('MK-2', 'quiet', { title: 'Answer their redlines' }), urgent: true, x: { c: C('MK-2', 'Nordvik Logistik'), it: { kind: 'quiet', n: 2, urgent: true, title: 'Answer their redlines' }, age: 8 } };
const answer = { key: 'round:MK-2', kind: 'answer', agent: 'round', c: C('MK-2', 'Nordvik Logistik'), days: 1, tone: 'amber' };
const chase = { key: 'late:MK-3', kind: 'chase', agent: 'late', c: C('MK-3', 'Kettle & Co'), days: 5, tone: 'ruby' };

describe('f867 (1) one reading', () => {
  test('1a a waiting thing and the piece prepared for it are ONE row, the piece\'s, with the wait and the red', () => {
    const w = world([redlines, row('MK-1', 'approval')], [answer, chase]);
    const D = w.ndRead();
    assert.equal(D.you.map(r => r.key).join(','), 'c:MK-1:approval', 'their redlines are not a row of their own');
    assert.equal(D.jambo.map(r => r.it.key).join(','), 'late:MK-3,round:MK-2', 'the late first');
    const a = D.jambo.find(r => r.it.key === 'round:MK-2');
    assert.equal(a.late + '|' + a.age, '1|8', 'the answer carries the redlines\' 8 days and their red');
    assert.equal(D.n, 3, 'counted once each');
    assert.equal(D.late, 2);
    assert.equal(D.oldest, 8);
  });
  test('1b the approval packs and our promises stay off: an approval is your row, once', () => {
    const w = world([row('MK-1', 'approval')], []);
    assert.equal(w.ndRead().jambo.length, 0);
    assert.equal(w.ndRead().n, 1);
  });
  test('1c a read covers the details owed on its contract; more than three contracts owing details are one row', () => {
    const read = { key: 'paper:MK-5', kind: 'read', agent: 'paper', c: C('MK-5', 'Baltic Freight') };
    const w = world([row('MK-5', 'details'), row('MK-6', 'details'), row('MK-7', 'details'), row('MK-8', 'details'), row('MK-9', 'details')], [read]);
    const D = w.ndRead();
    const b = D.you.find(r => r.bundle);
    assert.equal(b.n, 4, 'MK-5 is the read\'s; four are left, and four are a bundle');
    assert.equal(D.you.length, 1);
    assert.equal(D.n, 5);
  });
  test('1d it reads, never writes: no route, no save, no negotiation started', () => {
    const f = fnBody(CN, 'ndRead') + fnBody(CN, 'ndParts') + fnBody(CN, 'ndPieces');
    assert.ok(!/api\(|fetch\(|persist\(|negoChanges\(|negoInit\(|negoRound\(/.test(f));
  });
});

describe('f867 (2) Home', () => {
  test('2a Jambo\'s group first, three rows of each, "Show all N" onto the Board', () => {
    const pieces = [answer, chase, { ...chase, key: 'late:MK-4', c: C('MK-4', 'Atlas') }, { ...chase, key: 'late:MK-8', c: C('MK-8', 'Rania') }];
    const w = world([row('MK-1', 'approval'), row('MK-11', 'sign')], pieces);
    const html = w.ndHomeHtml(w.ndRead());
    assert.ok(html.indexOf('data-nd-g="jambo"') < html.indexOf('data-nd-g="you"'));
    assert.match(html, /<span class="nd-g-t">Jambo prepared it · your look is next<\/span><span class="cn-n">· 4<\/span><button type="button" class="ui-link nd-all" data-nd-all="jambo">Show all 4<\/button>/);
    assert.ok(!/data-nd-all="you"/.test(html), 'two rows: nothing hidden, no Show all');
    assert.equal((html.match(/class="cn-r nd-r"/g) || []).length, 5, 'three of Jambo\'s, two of yours');
  });
  test('2b a piece says its step and what Jambo read, and its Look names it', () => {
    const w = world([], [chase]);
    const html = w.ndHomeRowHtml(w.ndRead().jambo[0]);
    assert.match(html, /<span class="nd-step" title="Step 3 of 4 · yours">3 of 4<\/span>/);
    assert.match(html, /<i class="nd-read">Jambo read<\/i> the duty and the address on the contract · MK-3/);
    assert.match(html, /<span class="nd-when cn-late">5 days late<\/span><button type="button" class="ui-btn ui-btn-sm nd-btn" data-nd-look="late:MK-3">Look<\/button>/);
  });
  test('2c Home\'s presses: Show all and Look land on the Board through the one opener', () => {
    assert.match(CN, /if \(\(el = t\.closest\('\[data-nd-all\]'\)\)\)\{ ndOpenBoard\(el\.getAttribute\('data-nd-all'\)\); return; \}/);
    assert.match(fnBody(CN, 'ndOpenBoard'), /hbAgLookSet\(key\)/, 'a piece arrives open');
    assert.match(fnBody(CN, 'ndOpenBoard'), /return hbOpenAgent\(null, key \|\| null\);/);
  });
});

describe('f867 (3) the Board', () => {
  const many = n => Array.from({ length: n }, (_, i) => row('MK-' + (100 + i), i % 2 ? 'sign' : 'review', { who: 'Sara Lind' }));
  test('3a tabs with counts, the kinds there are, a find box, five columns, twelve rows', () => {
    const w = world(many(14), [chase]);
    const html = w.ndBoardHtml({});
    assert.match(html, /^<section class="hb-card nd-card" id="hm-agents">/);
    assert.match(html, /data-nd-tab="all" aria-pressed="true">All <span class="nd-tab-n">15<\/span>/);
    assert.match(html, /data-nd-tab="you" aria-pressed="false">Your move <span class="nd-tab-n">14<\/span>/);
    assert.match(html, /data-nd-tab="jambo" aria-pressed="false">Jambo prepared <span class="nd-tab-n">1<\/span>/);
    const chips = [...html.matchAll(/data-nd-kind="(\w+)"/g)].map(m => m[1]).join(',');
    assert.equal(chips, 'any,sign,review,jambo', 'only the kinds there are');
    assert.match(html, /<input type="search" id="nd-q"/);
    assert.equal((html.match(/<div class="nd-cols">(.*?)<\/div>/) || [])[1].match(/<span>/g).length, 5);
    assert.equal((html.match(/class="nd-br/g) || []).length, 12, 'twelve at a time');
    assert.match(html, /data-nd-more>Show 3 more<\/button>/);
    assert.match(html, /hb_ny_title|Needs you/);
  });
  test('3b a tab and a kind narrow it; the words narrow the rows only', () => {
    const w = world(many(4), [chase]);
    w._ndNow().tab = 'jambo';
    assert.equal((w.ndBoardHtml({}).match(/class="nd-br/g) || []).length, 1);
    Object.assign(w._ndNow(), { tab: 'all', kind: 'sign' });
    assert.equal((w.ndBoardHtml({}).match(/class="nd-br/g) || []).length, 2);
    Object.assign(w._ndNow(), { kind: 'any', q: 'kettle' });
    assert.equal((w.ndBoardRowsHtml(w.ndRead(), {}).match(/class="nd-br/g) || []).length, 1);
    const wire = CN.slice(CN.indexOf("document.addEventListener('input'"), CN.indexOf("document.addEventListener('keydown'"));
    assert.match(wire, /if \(e\.target && e\.target\.id === 'nd-q'\)\{ _nd = \{ \.\.\._nd, q: e\.target\.value, more: 0 \}; ndRowsRepaint\(\); \}/, 'the box is never redrawn');
  });
  test('3c a piece opens in place under its row, with the Board\'s own body and acts', () => {
    const w = world([], [chase]);
    const html = w.ndBoardHtml({ look: it => it.key === 'late:MK-3' ? '<div class="nd-body">BODY</div>' : '' });
    assert.match(html, /<div class="nd-br is-look" data-nd-row="p:late:MK-3" data-hb-ag-item="late:MK-3" data-nd-agent="late">/);
    assert.match(html, /data-hb-ag-look="late:MK-3" aria-expanded="true">Look<\/button><\/span><div class="nd-body">BODY<\/div><\/div>/);
    const look = fnBody(HB, 'hbNdLookHtml');
    assert.match(look, /agRowActOf/);
    assert.match(look, /data-ag-act="away"/, 'Put away, last');
  });
  test('3d it stands under Your book, never folds or closes, and keeps its place', () => {
    const board = HB.slice(HB.indexOf('function hbBoardHtml('), HB.indexOf('function hbBoardHtml(') + 6000);
    const lay = board.slice(board.indexOf('${hbBookHtml('));
    assert.ok(lay.indexOf('${hbPrepHtml(') > 0 && lay.indexOf('${hbPrepHtml(') < lay.indexOf('bsStripsHtml'), 'right under Your book, the strips after it');
    assert.ok(!/data-hb-prep/.test(fnBody(HB, 'hbPrepHtml') + fnBody(CN, 'ndBoardHtml')));
    assert.match(fnBody(HB, 'hbPlace'), /p\.nd = ndPlace\(\)/);
    assert.match(fnBody(HB, 'hbPlacePut'), /ndPlacePut\(p\.nd\)/);
    const w = world([], []);
    w.ndPlacePut({ tab: 'jambo', kind: 'sign', q: 'kettle' });
    assert.equal(JSON.stringify(w.ndPlace()), '{"tab":"jambo","kind":"sign","q":"kettle"}');
    w.ndPlacePut({ tab: 'nope', kind: 'nope' });
    assert.equal(JSON.stringify(w.ndPlace()), '{"tab":"all","kind":"any","q":""}', 'a word it does not know is not kept');
  });
});

describe('f867 (4) one button width, one word', () => {
  test('4a every Next button wears one width on both drawings', () => {
    assert.match(CSS, /\.nd-btn\{flex:none;width:76px;justify-content:center\}/);
    assert.match(CSS, /\.nd-cols,\.nd-br\{display:grid;grid-template-columns:minmax\(0,2\.2fr\) minmax\(0,1\.6fr\) minmax\(0,1\.1fr\) 104px 76px;/);
  });
  test('4b the words, in both books', () => {
    const keys = Object.keys(BOOKS.en).filter(k => k.startsWith('nd_'));
    assert.ok(keys.length > 50);
    for (const k of keys) assert.ok(BOOKS.sv[k], k + ' sv');
    for (const k of ['nd_btn_look', 'nd_btn_decide', 'nd_btn_sign', 'nd_btn_review', 'nd_btn_fill', 'nd_btn_answer', 'nd_btn_open'])
      assert.ok(!/\s\S+\s/.test(BOOKS.en[k]), k + ' is one word (Fill in, two at most)');
  });
});
