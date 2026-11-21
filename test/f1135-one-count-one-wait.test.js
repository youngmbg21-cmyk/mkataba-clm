/* ═══════════════════════════════════════════════════════════════════════════
   f1135 — ONE COUNT, ONE WAIT (review of the merged pages against the owner's
   picked drawings, 22 Nov 2026: P-38 the side panel, P-39 the Board)

   The review found: the panel's ring said "3 Jambo" and the bell's chip
   "Jambo 3" while Needs you said "Jambo prepared 5"; one approval waited "134
   days" on one load and "today" on the next; the Company row put its sentence
   in the Agreement column and left Waited empty, and named a rule by its sum
   in the side panel; Activity printed the trail's whole system sentence and
   called an internal note "Sent".

   WHAT THIS PINS
     (1) the wait of an approval is read off the record the same on every load:
         the question's own `at`, else the day the record was raised — never
         the display day `lastAction`, whether the heavy fields have come or not
     (2) ONE count of what waits (ndWaitCounts): Jambo is every piece he
         prepared, late or not; the Board's chips, the panel's ring and
         headline and the bell's chips read it
     (3) the company row keeps the table's shape and says no money
     (4) Activity says who did what in a short line; a note is Asked
   AT THE PARENT (9fcdedfc) every test here FAILS but 1b, which pins what
   already held (the question's own `at`) beside the new fallback.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CN = R('js/views/counter.js'), HB = R('js/views/homeboard.js'), APP = R('js/app.js'), ST = R('js/views/settings.js'), I18N = R('js/i18n.js'), REP = R('js/views/reports.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): (?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'),?\s*$/gm)) {
    m[2] = m[2] != null ? m[2] : m[3];
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f1135 (1) an approval waits the same on every load', () => {
  const ctx = () => {
    const c = { window: null, Date, Math, isFinite, Number, String };
    c.window = c;
    vm.createContext(c);
    vm.runInContext(fnBody(REP, 'firstAuditAt') + '\nconst _repAt = v => { const t=Date.parse(v||\'\'); return isNaN(t)?null:t; };\n' + fnBody(REP, 'repRaisedAt')
      + '\nfunction approvalState(){ return { next: { ruleId: "r2", sa: false } }; }\n'
      + 'function askOpenFor(c){ return (c.asks || []).find(a => a.state === "open") || null; }\n' + fnBody(CN, 'ndWaitedDays'), c);
    return c;
  };
  const day = n => new Date(Date.now() - n * 864e5).toISOString();
  test('1a with no question on record: the day the record was raised, light or heavy alike, never lastAction', () => {
    const w = ctx();
    assert.ok(fnBody(CN, 'ndWaitedDays'), 'ndWaitedDays exists');
    const light = { _raisedAt: day(9), lastAction: '10 Jul 2026' };
    const heavy = { _raisedAt: day(9), lastAction: '21 Nov 2026', audit: [{ action: 'Created', at: day(9) }] };
    const bare = { lastAction: '10 Jul 2026', audit: [{ action: 'Created', at: day(9) }] };
    assert.equal(w.ndWaitedDays(light, { kind: 'approval' }), 9);
    assert.equal(w.ndWaitedDays(heavy, { kind: 'approval' }), 9, 'a later act rewriting lastAction moves nothing');
    assert.equal(w.ndWaitedDays(bare, { kind: 'approval' }), 9, 'the trail\'s own first line where the list has no _raisedAt');
    assert.doesNotMatch(strip(fnBody(CN, 'ndWaitedDays')), /lastAction/, 'the display day is never read');
  });
  test('1b once the question is on record, its own `at` is the wait', () => {
    const w = ctx();
    assert.equal(w.ndWaitedDays({ _raisedAt: day(40), asks: [{ state: 'open', at: day(3) }] }, { kind: 'approval' }), 3);
  });
  test('1c the Approvals page reads the same: the ask, else the raised day — not lastAction\'s idle first', () => {
    const AP = R('js/views/approvalsview.js');
    const rows = strip(fnBody(AP, 'apApprovalRows'));
    assert.match(rows, /repRaisedAt\(x\.c\)/);
  });
});

describe('f1135 (2) one count of what waits', () => {
  test('2a ndWaitCounts: Jambo is every piece, Late the late of both, Your move yours not late', () => {
    const c = { window: null }; c.window = c; vm.createContext(c);
    vm.runInContext('const newLookOn = () => true;\nconst ndRowsN = L => (L || []).length;\n' + fnBody(CN, 'ndOnBoard') + fnBody(CN, 'ndWaitCounts'), c);
    const D = { jambo: [{ late: 1 }, { late: 1 }, { late: 0 }, { late: 0 }, { late: 0 }], you: [{ late: 1 }, { late: 1 }, { late: 0 }, { late: 0 }, { late: 0 }, { late: 0 }, { late: 0 }, { late: 0 }] };
    const W = c.ndWaitCounts(D);
    assert.deepEqual({ ...W }, { all: 13, late: 4, you: 6, jambo: 5 });
  });
  test('2b the Board\'s chips, the panel\'s ring and headline, and the bell\'s chips all read it', () => {
    assert.match(strip(fnBody(CN, 'ndBoardHtml')), /const W = ndWaitCounts\(D\);[\s\S]*tab\('jambo', W\.jambo\)/);
    assert.match(strip(fnBody(CN, 'ndBellNlHtml')), /ndWaitCounts\(D\)/);
    const hello = strip(fnBody(HB, 'hbBoardHelloHtml'));
    assert.match(hello, /ndWaitCounts\(D\)/);
    assert.match(hello, /work = W \? W\.jambo/, '"I have N things ready" is the same count');
    assert.match(hello, /jambo: W\.jambo/, 'the ring\'s legend is the same count');
    assert.doesNotMatch(hello, /B\.jambo\.filter\(r => !r\.late\)/, 'no second reading that drops the late pieces');
  });
  test('2c the bell\'s Jambo chip lists every piece its count says', () => {
    assert.match(strip(fnBody(CN, 'ndBellNlHtml')), /_ndbChip === 'jambo' && g === 'jambo'\) \? x\.r\.g === 'jambo'/);
  });
  test('2d the Board\'s panel never cuts its last piece: what fits, and "N more" said', () => {
    assert.ok(fnBody(HB, 'hbHelloFitN'), 'hbHelloFitN exists');
    assert.match(strip(fnBody(HB, 'hbBoardHelloHtml')), /hbw2_more/);
    for (const b of ['en', 'sv']) assert.ok(BOOKS[b].hbw2_more_other, 'hbw2_more ' + b);
  });
});

describe('f1135 (3) the company row keeps the table\'s shape, and no money in the panel', () => {
  test('3a a name for the Agreement column, one line under what waits, its oldest wait', () => {
    const P = strip(fnBody(CN, 'ndParts'));
    assert.match(P, /P\.name = _cnT\('cn_company_where'\)/);
    assert.match(P, /P\.when = r\.age != null \? days\(r\.age\) : _cnT\('cn_company_open'\)/);
    assert.match(P, /first\.plain \|\| first\.text/);
    assert.match(strip(fnBody(CN, 'ndRead')), /company: R, mail: mailOff, n: 1, late: 0, age: a\.length \? Math\.max\(\.\.\.a\) : null/);
  });
  test('3b a clash said outside Settings names no sum', () => {
    for (const b of ['en', 'sv']) {
      for (const k of ['st_clash_self_rule_plain', 'st_clash_cap_plain', 'cn_company_where', 'cn_company_open']) assert.ok(BOOKS[b][k], k + ' ' + b);
      assert.doesNotMatch(BOOKS[b].st_clash_self_rule_plain, /\{rule\}/);
      assert.doesNotMatch(BOOKS[b].st_clash_cap_plain, /\{cap\}|\{acap\}/);
    }
    assert.match(strip(fnBody(ST, 'stClashes')), /plain:i18t\('st_clash_self_rule_plain'/);
  });
});

describe('f1135 (4) Activity: who did what, in a short line', () => {
  const ctx = () => {
    const c = { window: null, String }; c.window = c; vm.createContext(c);
    const SAYS = APP.slice(APP.indexOf('const ACT_SAYS=['), APP.indexOf('];', APP.indexOf('const ACT_SAYS=[')) + 2);
    vm.runInContext('const i18t = (k, v) => k + JSON.stringify(v || {});\nconst getContract = () => null;\n' + fnBody(APP, 'actKindOf') + SAYS + '\n' + fnBody(APP, 'actSayOf'), c);
    return c;
  };
  test('4a an internal note is Asked, said as "{who} wrote a note on {name}"', () => {
    const w = ctx();
    const S = w.actSayOf({ action: 'Negotiation', detail: 'Internal note posted on the contract by Amina Otieno — the contract is unchanged and no round was opened', user: 'Amina Otieno', name: 'Fuel Supply', id: 'MK-512' });
    assert.equal(S.kind, 'asked');
    assert.equal(S.line, 'act_s_note{"who":"Amina","name":"Fuel Supply"}');
  });
  test('4b an approval is Approved; a record filed by the system is said without a person', () => {
    const w = ctx();
    const A = w.actSayOf({ action: 'Approved', detail: 'Approved by Amina', user: 'Amina Otieno', name: 'Cleaning Services' });
    assert.equal(A.kind, 'signed'); assert.equal(A.badge, 'approved');
    assert.equal(A.line, 'act_s_approved{"who":"Amina","name":"Cleaning Services"}');
    assert.equal(w.actSayOf({ action: 'Created', detail: 'fixture', user: 'System', name: 'Office Lease' }).line, 'act_s_filed_sys{"who":"HaTi","name":"Office Lease"}');
  });
  test('4c the row draws the short line, the record\'s sentence kept as its title; the words in both books', () => {
    const P = strip(fnBody(APP, 'activityPanelHtml'));
    assert.match(P, /<b>\$\{esc\(a\.line\|\|a\.txt\)\}<\/b>/);
    assert.match(P, /i18t\('act_k_'\+\(a\.badge\|\|a\.kind\)\)/);
    for (const b of ['en', 'sv']) for (const k of ['act_s_note', 'act_s_approved', 'act_s_filed', 'act_s_filed_sys', 'act_s_else', 'act_k_approved', 'act_k_opened']) assert.ok(BOOKS[b][k], k + ' ' + b);
  });
});
