/* ═══════════════════════════════════════════════════════════════════════════
   f869 — NEEDS YOU, EVERYWHERE (the rest of Round A; the owner picked "The
   Legora Way" for the bell by name, 23 Oct 2026, artifact
   WPfQyLgvpcjbTswNtGzwth: "Legora way, count signer in both, server counts")

   The bell, its Alerts panel and the Dossier say what Home and the Board say:
   ONE reading (ndRead). What the bell hears that asks nothing of you is NEWS,
   under its own tab, never counted.

   WHAT THIS PINS
     (1) the bell counts what Home counts (alertCount = counterNeedsCount)
     (2) the bell's signals split in two: news is never counted; work the one
         desk already holds is not drawn twice (the row of that kind on that
         contract, the piece Jambo prepared for it, the week's piece, the
         admin's row); any other work joins the one desk as a row of its own,
         worded by the bell and pressing the bell's own door
     (3) the panel: Needs you (the one desk's own rows, all of them) and News
         (drawn only when there is some); a known set handed in draws as the
         grouped list alone
     (4) nobody named to sign is a detail owed on Home as on the Dossier (one
         reading, signerOwed)
     (5) both books
     earlier rulings kept on the new rows: good news green, flashing once
     (23 Aug 2026); what came back leads the row's line (13 Sep 2026); a
     colleague's hand-off carries its note
   AT THE PARENT (a873c4b) every test here FAILS: there is no ndAlerts, the
   bell counts buildAlerts, and the panel has no tabs (run, 23 Oct 2026).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CN = R('js/views/counter.js');
const APP = R('js/app.js');
const HOME = R('js/views/home.js');
const PD = R('js/paperdesk.js');
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

const NAMES = ['cnDayWords', 'cnMayMoney', 'cnNeedTitle', 'cnNeedDoorAttrs', 'ndIsNews', 'ndAlerts', 'ndAlCovered', 'ndPieces', 'ndAgeOf', 'ndPieceAge', 'ndKindOf', 'ndRead',
  'ndSumWords', 'ndStepOf', 'ndParts', 'ndHomeRowHtml', 'ndPanelHtml'];
const CONSTS = ['_cnE', '_cnT', '_cnTn', '_cnFirst', '_cnWho', '_cnToday', '_cnPill', 'CN_ROWS', 'ND_PAGE', 'ND_BUNDLE_MIN', 'ND_MERGE', 'ND_KIND_OF', 'ND_KINDS', 'ND_BTN', 'ND_NOT_WAITED',
  'ND_NEWS', 'ND_AL_ROWS', 'ND_AL_PIECES', 'ND_AL_ADMIN', 'ND_AL_KIND', 'ND_AL_BTN', '_ndCid', '_ndHash', 'ndAlKey', '_ndAge', 'ndThings', '_ndCall', '_ndText', '_ndBtnHtml', '_ndStepHtml', '_ndTagHtml'];
const C = (id, cp) => ({ id, name: 'Agreement ' + id, counterparty: cp || 'Party ' + id, value: 1e6 });
const BOOK = { 'MK-1': C('MK-1', 'Nordvik Logistik'), 'MK-2': C('MK-2', 'Kettle & Co'), 'MK-3': C('MK-3', 'Helio Energy AB') };
function world({ rows = [], pieces = [], alerts = [], company = [] } = {}){
  const ctx = {
    i18t: (k, v) => fill(BOOKS.en[k] || k, v), i18tn: (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || BOOKS.en[k] || k, { n, ...(v || {}) }),
    todayISO: () => '2026-10-23', langLocale: () => 'en-GB', icon: n => `<svg data-ic="${n}"></svg>`, setTimeout: () => 0,
    hbNyWhat: x => x.it.title || '', hbNyDays: n => n === 0 ? 'today' : n + ' days', contractRef: c => c.id, refHtml: c => `<span class="hati-ref">${c.id}</span>`,
    streamIsPrivate: () => false, FOLDERS: {}, getContract: id => BOOK[id] || null,
    fmtMoneyShortOf: () => 'KES 1M', canViewValues: () => true, isMonetary: () => true, fxIsPay: () => false, agPoss: n => n + '’s',
    cnRows: () => rows, cnCompany: () => company, cnSetup: () => 0, buildAlerts: () => alerts.slice(),
    AG_KEYS: ['round', 'week'], AG_DEF: { round: { review: 4, steps: [1, 2, 3, 4, 5, 6] }, week: { review: 1, steps: [1, 2] } },
    agentsData: () => ({ agents: { round: { ready: pieces.filter(p => p.agent === 'round') }, week: { ready: pieces.filter(p => p.agent === 'week') } } }),
    agPieceTitle: it => 'Piece ' + it.key, agPieceLine: () => '', agPieceRefHtml: () => '', agCardParts: () => ({}),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(CONSTS.map(n => constLine(CN, n)).join('\n') + '\nlet _ndMemo = null;\n' + NAMES.map(n => fnBody(CN, n)).join('\n'), ctx);
  return ctx;
}
const al = (kind, id, text, extra) => ({ kind, id: id || '', text: text || kind, go: () => {}, ...(extra || {}) });
const row = (id, kind, extra) => ({ k: 'c', kind, urgent: false, x: { c: BOOK[id], it: { kind, n: 1, ...(extra || {}) }, age: null } });

describe('f869 (1) the bell counts what Home counts', () => {
  test('1a alertCount is the one desk\'s number, never a count of the bell\'s own signals', () => {
    const f = fnBody(APP, 'alertCount');
    assert.match(f, /counterNeedsCount\(\)/);
    assert.ok(!/buildAlerts\(\)\.length/.test(f));
  });
});

describe('f869 (2) the bell\'s signals: news apart, work never lost, never twice', () => {
  test('2a news is never counted, and stands apart', () => {
    const w = world({ alerts: [al('review-out', 'MK-1'), al('ap-cleared', 'MK-2'), al('watch', '', 'A watched number moved'), al('gift', 'MK-3'), al('settings-answer'), al('stream-self')] });
    const D = w.ndRead();
    assert.equal(D.n, 0);
    assert.equal(D.news.map(a => a.kind).join(','), 'review-out,ap-cleared,watch,gift,settings-answer,stream-self');
  });
  test('2b work the one desk holds is not drawn twice: the row of that kind, the piece, the same source', () => {
    const answer = { key: 'round:MK-1', kind: 'answer', agent: 'round', cid: 'MK-1', c: BOOK['MK-1'] };
    const w = world({ rows: [row('MK-2', 'approval'), row('MK-3', 'review')], pieces: [answer],
      alerts: [al('negotiation', 'MK-1'), al('desk-quiet', 'MK-1'), al('approval', 'MK-2'), al('review-mine', 'MK-3'),
        al('note-due', ''), al('request', ''), al('watch', 'MK-1', 'Jambo saw it', { fired: true }), al('handover', 'MK-2', 'Out with them for signature')] });
    const D = w.ndRead();
    assert.equal(D.you.filter(r => r.al).map(r => r.al.kind).join(','), 'handover', 'nothing of the bell\'s is a second row; the one it alone holds joins');
    assert.equal(D.n, 4, 'the answer, the approval, the review, the handover');
  });
  test('2c a duty or an ending this week is the week\'s piece; the admin\'s own are the company row, the mail warning leading its line', () => {
    const week = { key: 'week:1', kind: 'week', agent: 'week', cid: null, evs: [{ type: 'obligation', obId: 'ob-1', cid: 'MK-2' }, { type: 'expiry', cid: 'MK-3' }] };
    const w2 = world({ company: [{ key: 'ask:1', text: 'Answer Sara' }, { key: 'panel:mail', text: 'Email' }], alerts: [al('email-off', '', 'Email isn\'t set up')] });
    const D2 = w2.ndRead();
    assert.equal(D2.you.map(r => r.key).join(','), 'company', 'one row, the admin\'s own, last');
    const C2 = w2.ndParts(D2.you[0]);
    assert.match(C2.title, / · 2$/, 'the mail warning counted once'); assert.match(C2.deal, /^Email isn’t set up · Answer Sara$|^Email isn't set up · Answer Sara$/);
    const w = world({ pieces: [week], company: [{ key: 'ask:1', text: 'Answer Sara' }],
      alerts: [al('obligation', 'MK-2', 'Due in 2 days', { obId: 'ob-1' }), al('renewal', 'MK-3', 'Ends in 20 days', { ends: true }),
        al('settings-ask'), al('access-review'), al('email-off'), al('obligation', 'MK-1', 'Overdue: the report', { obId: 'ob-7', late: true })] });
    const D = w.ndRead();
    assert.equal(D.you.filter(r => r.al).map(r => r.al.kind).join(','), 'obligation', 'only the duty the week does not hold');
    assert.equal(D.n, 3, 'the week\'s piece, the late duty and the company row');
  });
  test('2d any other work joins as a row of its own: its words, its contract, the bell\'s own door', () => {
    const w = world({ alerts: [al('cp-ready', 'MK-1', 'They said they are ready to sign'), al('obligation', 'MK-2', 'Overdue: the insurance certificate', { obId: 'ob-9', late: true }),
      al('negotiation', 'MK-3', '2 changes are waiting on your answer'), al('review-out', 'MK-1')] });
    const D = w.ndRead();
    const A = D.you.filter(r => r.al);
    assert.equal(A.map(r => r.al.kind).join(','), 'cp-ready,obligation,negotiation');
    assert.equal(D.n, 3, 'the news is not counted');
    assert.equal(D.late, 1, 'an overdue duty is late');
    assert.equal(A.map(r => r.kind).join(','), 'sign,duty,review', 'each under its kind on the Board');
    const P = w.ndParts(A[0]);
    assert.equal(P.title, 'They said they are ready to sign');
    assert.equal(P.deal, 'Agreement MK-1 · Nordvik Logistik');
    const sub = w.ndParts({ g: 'you', key: 'k', al: al('negotiation', 'MK-3', '2 changes', { sub: 'They asked for 2 changes' }) });
    assert.equal(sub.deal, 'They asked for 2 changes · Agreement MK-3 · Helio Energy AB', 'what came back leads its line');
    const good = w.ndParts({ g: 'you', key: 'k', al: al('cp-ready', 'MK-1', 'Ready', { tone: 'green', news: true }) });
    assert.ok(good.good && good.news, 'good news is green and flashes');
    assert.match(w.ndHomeRowHtml({ g: 'you', key: 'k', al: al('cp-ready', 'MK-1', 'Ready', { tone: 'green', news: true }) }), /class="cn-r nd-r nd-good nd-news"/);
    assert.equal(P.btn, 'sign');
    assert.match(P.attrs, /^data-nd-al="al:cp-ready:MK-1:[a-z0-9]+"$/);
    assert.equal(w.ndParts(A[2]).btn, 'review');
    assert.match(w.ndHomeRowHtml(A[1]), /data-nd-al="al:obligation:MK-2:[a-z0-9]+">Open</);
  });
  test('2d2 an ending is not the decision: the renewal\'s row and piece never stand for it', () => {
    const memo = { key: 'renew:MK-3', kind: 'renewal', agent: 'round', cid: 'MK-3', c: BOOK['MK-3'] };
    const w = world({ rows: [row('MK-3', 'renewal')], pieces: [memo], alerts: [al('renewal', 'MK-3', 'Ends in 20 days', { ends: true }), al('renewal', 'MK-3', 'Decide the renewal')] });
    assert.equal(w.ndRead().you.filter(r => r.al).map(r => r.al.text).join(','), 'Ends in 20 days');
  });
  test('2e the same signal twice is one row', () => {
    const w = world({ alerts: [al('cp-ready', 'MK-1', 'Ready'), al('cp-ready', 'MK-1', 'Ready')] });
    assert.equal(w.ndRead().n, 1);
  });
  test('2f a row of the bell\'s presses its own door, and from the panel the panel steps aside first', () => {
    const h = CN.slice(CN.indexOf("if ((el = t.closest('[data-nd-al]')))"));
    const b = h.slice(0, h.indexOf('return; }') + 9);
    assert.match(b, /ndRead\(\)\.you\.find\(x => x\.key === k\)/);
    assert.match(b, /step\(\);[\s\S]*r\.al\.go\(\)/);
    assert.match(CN, /const inPanel = !!t\.closest\('#panel-body \.nd-pan'\);/);
  });
});

describe('f869 (3) the bell\'s panel, the Legora way', () => {
  const panel = fnBody(APP, 'alertsPanelHtml');
  test('3a two tabs: Needs you, the one desk\'s own rows, and News, drawn only when there is some', () => {
    assert.match(panel, /tab\('need',i18t\('al_tab_need'\),n\)/);
    assert.match(panel, /news\.length\?tab\('news',i18t\('al_tab_news'\),news\.length\):''/);
    assert.match(panel, /ndPanelHtml\(D\)/);
    assert.match(panel, /alertsListHtml\(news\)/);
    assert.match(panel, /ap_nothing_needs_you/);
  });
  test('3b Needs you is every row, both groups, Home\'s own row builder, how many are late', () => {
    const w = world({ rows: [row('MK-2', 'approval'), row('MK-3', 'review'), row('MK-1', 'look')],
      pieces: [{ key: 'round:MK-1', kind: 'answer', agent: 'round', cid: 'MK-1', c: BOOK['MK-1'], tone: 'ruby' }],
      alerts: [al('cp-ready', 'MK-3', 'Ready'), al('handover', 'MK-2', 'Out for signature')] });
    const html = w.ndPanelHtml(w.ndRead());
    assert.match(html, /^<div class="nd-pan-sum">1 late<\/div>/);
    assert.equal((html.match(/class="cn-r nd-r"/g) || []).length, 6, 'all of it: no "Show all" in the panel');
    assert.ok(!/data-nd-all/.test(html));
    assert.ok(html.indexOf('data-nd-g="jambo"') < html.indexOf('data-nd-g="you"'), 'Jambo\'s group first');
  });
  test('3c a known set handed in draws as the grouped list alone', () => {
    assert.match(panel, /if\(given\) return[\s\S]*alertsListHtml\(given\)/);
  });
  test('3d the panel\'s rows keep the one button width; a long name gives way', () => {
    const css = R('index.html');
    assert.match(css, /\.nd-btn\{flex:none;width:76px;justify-content:center\}/);
    assert.ok(!/\.nd-pan \.nd-btn\{[^}]*width/.test(css), 'no second width in the panel');
    assert.match(css, /\.nd-pan \.nd-t\{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\}/);
  });
});

describe('f869 (4) nobody named to sign is a detail owed, on Home as on the Dossier', () => {
  test('4a one reading, signerOwed, asked by the Dossier and by Home\'s checklist', () => {
    assert.match(fnBody(PD, 'signerOwed'), /pdSignAhead\(c\)[\s\S]*signBlockers\(c\)\.some\(b => b && b\.key === 'signers'\)/);
    assert.equal((PD.match(/const nobody = signerOwed\(c\);/g) || []).length, 3, 'the Dossier\'s three readers');
    assert.ok(!/signBlockers\(c\)\.some\(b => b && b\.key === 'signers'\)/.test(PD.replace(fnBody(PD, 'signerOwed'), '')), 'no second copy in the Dossier');
    const n = fnBody(HOME, 'needsYouOf');
    assert.match(n, /const sg=\(window\.signerOwed&&signerOwed\(c\)\)\?1:0;[\s\S]*const n=\(\(d&&d\.left\)\|\|0\)\+sg;[\s\S]*if\(n\) out\.push\(\{ kind:'details', urgent:false, n \}\)/);
  });
  test('4b the Dossier: a piece stands for the rows it covers and the late duty it chases', () => {
    const rows = fnBody(PD, 'pdNeedsRows');
    assert.match(rows, /ndRead\(\)/);
    assert.match(rows, /ND_MERGE\[r\.it\.kind\]/);
    const owed = fnBody(PD, 'dossierOwed');
    assert.match(owed, /if \(asks\.length && !quiet\)/, 'their asks one by one stay (pass 3 as drawn)');
    assert.match(owed, /r\.jw && r\.pk === 'answer' && r\.nd && r\.nd\.late/, 'past the standard, Jambo\'s answer is the one row for them');
    assert.match(owed, /if \(late\.length > chased\)/);
  });
});

describe('f869 (5) both books', () => {
  for (const k of ['al_tab_need', 'al_tab_news', 'nd_k_duty', 'pd_nd_waiting'])
    test(k, () => { assert.ok(BOOKS.en[k] && BOOKS.sv[k] && BOOKS.en[k] !== BOOKS.sv[k], k); });
});
