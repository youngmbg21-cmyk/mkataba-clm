'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f735 — PEOPLE: THE PERSON IN JAMBO'S PANEL (round 19 of the redesign, scene
   b, as drawn; the owner's "build all the gaps", 18 Oct 2026)

   (1) WHAT WAITS ON A PERSON is a READING of the loaded list, nothing written:
       for a colleague, the questions on the one ask list put to them by name,
       the approval chain's next step where it names them, their own turn to
       sign; for someone on the other side, the negotiations whose move is
       theirs. Never a code-named deal, an archived, signed or declined one.
   (2) THE PANEL AS DRAWN: initials, name, "title · our side"; Show their
       contracts · Email; the facts as rows — Email · In HaTi · Streams ·
       Named on · Away; "Waiting on Jonas" with each row's own door; the
       contracts they are named on (three) and "All N on Contracts ›"; Manage
       in Settings in ⋯ for an admin only.
   (3) AWAY IS SAID ONLY WHERE THE READER MAY KNOW IT: their own rule, or one
       the reader stands in for (state.away) — the server sends no other.
   (4) NOTHING CHOSEN: the page in Jambo's words from the directory's own
       count, whom the reader stands in for, its own tabs as chips.

   AT THE PARENT (8dc306a) every claim FAILS: none of these readings exist.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const DIR = read('js/views/directory.js');
const INS = read('js/views/inspector.js');
const I18N = read('js/i18n.js');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null ? v[k] : ''));
const t = (k, v) => fill(BOOKS.en[k] != null ? BOOKS.en[k] : k, v);
const tn = (k, n, v) => t(k + (n === 1 ? '_one' : '_other'), Object.assign({ n }, v || {}));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const stage = (src, names, extra) => { const ctx = Object.assign({ i18t: t, i18tn: tn, esc, _dE: esc, window: {} }, extra || {});
  vm.createContext(ctx); vm.runInContext(names.map(n => fnOf(src, n)).join('\n'), ctx); return ctx; };
const ids = list => Array.from(list, w => w.c.id + ':' + w.kind).join('|');

describe('f735 (1) what waits on a person — a reading, nothing written', () => {
  const JONAS = { id: 'u7', name: 'Jonas Berg' };
  const book = [
    { id: 'A', status: 'Under Review', asks: [{ kind: 'rule', state: 'open', to: { id: 'u7', name: 'Jonas Berg' } }] },
    { id: 'B', status: 'Under Review', asks: [{ kind: 'review', state: 'open', to: { id: 'u7', name: 'Jonas Berg' } }] },
    { id: 'C', status: 'Approved', _next: { approver: { kind: 'member', id: 'u7' } } },
    { id: 'D', status: 'Approved', _signer: { party: 'owner', memberId: 'u7', signed: false } },
    { id: 'E', status: 'Approved', _signer: { party: 'counterparty', memberId: 'u7', signed: false } },
    { id: 'F', status: 'Under Review', archived: true, asks: [{ kind: 'rule', state: 'open', to: { id: 'u7' } }] },
    { id: 'G', status: 'Under Review', _codeNamed: true, asks: [{ kind: 'rule', state: 'open', to: { id: 'u7' } }] },
    { id: 'H', status: 'Signed', asks: [{ kind: 'rule', state: 'open', to: { id: 'u7' } }] },
    { id: 'I', status: 'Under Review', asks: [{ kind: 'rule', state: 'answered', to: { id: 'u7' } }, { kind: 'rule', state: 'open', to: { role: 'admin' } }] },
    { id: 'J', status: 'Under Review', asks: [{ kind: 'rule', state: 'open', to: { id: 'u7' } }], _next: { approver: { kind: 'member', id: 'u7' } } },
  ];
  const ctx = () => stage(DIR, ['dirWaitingOn'], {
    dirContracts: () => book,
    asksOf: c => c.asks || [],
    askSamePerson: (a, b) => a && b && String(a.id) === String(b.id),
    approvalState: c => ({ next: c._next || null }),
    nextSigner: c => c._signer || null,
    negWhoseMove: c => ({ k: c._move || 'you' }),
  });
  test('1a a colleague: their open questions by name, the chain\'s next step that names them, their own turn to sign', () => {
    const w = ctx().dirWaitingOn({ side: 'ours', id: 'u7', name: JONAS.name, contracts: [] });
    assert.equal(ids(w), 'A:approval|B:review|C:approval|D:sign|J:approval');
  });
  test('1b never a code-named, archived or signed deal; never a role\'s question, an answered one, or the other side\'s signer', () => {
    const w = ctx().dirWaitingOn({ side: 'ours', id: 'u7', name: JONAS.name, contracts: [] });
    for (const id of ['E', 'F', 'G', 'H', 'I']) assert.ok(!Array.from(w).some(x => x.c.id === id), id);
  });
  test('1c the other side: the negotiations whose move is theirs, on their own contracts only', () => {
    book.push({ id: 'K', status: 'Draft', _move: 'them' }, { id: 'L', status: 'Draft', _move: 'you' }, { id: 'M', status: 'Draft', _move: 'them' });
    const w = ctx().dirWaitingOn({ side: 'theirs', contracts: ['K', 'L'] });
    assert.equal(ids(w), 'K:move');
    book.splice(-3);
  });
  test('1d it writes nothing and asks no server', () => {
    const f = fnOf(DIR, 'dirWaitingOn');
    assert.ok(f, 'dirWaitingOn is there');
    assert.doesNotMatch(f, /api\(|fetch\(|contractSave|saveState|negoInit|\.push\((?!\{ c, kind \}\))/);
  });
  test('1e each row\'s door: an approval on Approvals, a signature on its signing, a review or a move on the negotiation', () => {
    const went = [];
    const c = stage(DIR, ['dirWaitGo'], { getContract: id => ({ id }), insSelect: (s, id) => went.push('sel:' + s + ':' + id),
      setView: v => went.push('view:' + v), apOpenSigning: id => went.push('sign:' + id),
      openRedlineWorkbench: (id, o) => went.push('nego:' + id + ':' + !!(o && o.face)), dirOpenContract: id => went.push('open:' + id) });
    c.dirWaitGo('approval', 'A'); c.dirWaitGo('sign', 'D'); c.dirWaitGo('review', 'B'); c.dirWaitGo('move', 'K');
    assert.equal(went.join('|'), 'sel:approvals:A|view:approvals|sign:D|nego:B:true|nego:K:true');
  });
});

describe('f735 (2) the panel as drawn', () => {
  const f = fnOf(DIR, 'dirPaintPanel');
  test('2a the head: initials, "title · our side"; Show their contracts · Email; Manage in Settings in ⋯ for an admin only', () => {
    assert.match(f, /const av = `<span class="jl-av" aria-hidden="true">\$\{_dE\(dirInitials\(p\.name \|\| p\.email\)\)\}<\/span>`;/);
    assert.match(f, /sub: _dE\(\[p\.title, i18t\('jl_side_ours'\)\]\.filter\(Boolean\)\.join\(' · '\)\)/);
    assert.match(f, /label: i18t\('dir_show_contracts'\)[\s\S]{0,200}\.concat\(mailBtn\)/);
    assert.match(f, /menuHtml: admin && typeof insMenuItemHtml === 'function' \? insMenuItemHtml\(\{ k: 'manage', label: i18t\('dir_manage_settings'\)/);
    assert.equal(t('dir_show_contracts'), 'Show their contracts');
  });
  test('2b the facts as rows: Email · In HaTi · Streams · Named on · Away (Away only where known)', () => {
    const rows = /body = rowsOf\(\[([\s\S]*?)\]\)\s*\+ waitSec/.exec(f);
    assert.ok(rows, 'the colleague\'s rows');
    const keys = Array.from(rows[1].matchAll(/k: '([a-z]+)'/g), m => m[1]);
    assert.deepEqual(keys, ['email', 'hati', 'streams', 'contracts', 'away']);
    assert.match(rows[1], /\.\.\.\(away \? \[\{ k: 'away'/);
  });
  test('2c "Waiting on Jonas", each row with its own door; past four, the rest counted', () => {
    assert.match(f, /sec\(i18t\('jl_waiting_on', \{ who: first \}\), waits\.length,/);
    assert.match(f, /data-dir-wait="\$\{_dE\(w\.kind\)\}" data-dir-wait-id="\$\{_dE\(w\.c\.id\)\}">\$\{_dE\(i18t\(DIR_WAIT_OPEN\[w\.kind\]/);
    assert.match(f, /waits\.length > DIR_WAIT_MAX \?/);
    assert.equal(t('jl_waiting_on', { who: 'Jonas' }), 'Waiting on Jonas');
    assert.equal(t('jl_may_answer'), 'you may answer for them');
  });
  test('2d the contracts they are named on — three, then "All N on Contracts ›"', () => {
    assert.match(f, /sec\(i18t\('dir_named_on'\), n, n \? namedJl\(3\)/);
    assert.match(f, /data-dir-all>\$\{_dE\(i18t\('jl_all_on_contracts', \{ n: p\.contracts\.length \}\)\)\}/);
    assert.equal(t('jl_all_on_contracts', { n: 14 }), 'All 14 on Contracts');
    assert.match(fnOf(DIR, 'dirPanelWire'), /closest\('\[data-dir-all\]'\)[\s\S]{0,200}dirShowContracts\(p\)/);
  });
  test('2e the panel says "Person" and keeps the page\'s own words for nothing chosen', () => {
    assert.match(f, /jlWord: i18t\('jl_w_person'\), jlHome: DIR_JL\.jlHome\(\), jlPh: DIR_JL\.jlPh\(\), jlSay: dirSay/);
  });
});

describe('f735 (3) away is said only where the reader may know it', () => {
  const ctxOf = (away, me) => stage(INS, ['jlAwayOf'], { state: { away }, currentUser: () => me });
  test('3a their own rule; one the reader stands in for; nobody else\'s', () => {
    const away = { mine: { from: '2026-10-16', to: '2026-10-23' }, covering: [{ userId: 'u7', userName: 'Jonas Berg', from: '2026-10-16', to: '2026-10-23', deputyName: 'Maria' }] };
    const c = ctxOf(away, { id: 'u1' });
    assert.equal(c.jlAwayOf('u1').to, '2026-10-23', 'the reader\'s own');
    assert.equal(c.jlAwayOf('u7').userName, 'Jonas Berg', 'one they stand in for');
    assert.equal(c.jlAwayOf('u9'), null, 'anyone else: not known, not said');
    assert.equal(ctxOf(null, { id: 'u1' }).jlAwayOf('u7'), null);
  });
  test('3b a span said once: "16–23 Oct"; the year only where it is not this one', () => {
    const c = stage(INS, ['jlDayRange'], { langLocale: () => 'en-GB' });
    const yr = new Date().getFullYear();
    assert.equal(c.jlDayRange(`${yr}-10-16`, `${yr}-10-23`), '16–23 Oct');
    assert.match(c.jlDayRange(`${yr - 1}-12-29`, `${yr}-01-05`), new RegExp(`^29 Dec ${yr - 1}–5 Jan ${yr}$`));
  });
  test('3c the words: whose stand-in answers what, and that nobody signs for them', () => {
    assert.equal(t('jl_away_line', { span: '16–23 Oct', who: 'Maria' }), '16–23 Oct · Maria answers their approvals and internal reviews. Nobody signs for them.');
  });
});

describe('f735 (4) nothing chosen: the page in Jambo\'s words', () => {
  test('4a "12 people here: 8 of ours and 4 from the other side." — and whom the reader stands in for; chips are the tabs', () => {
    const _dir = { tab: 'all' };
    const book = [...Array(8)].map(() => ({ side: 'ours' })).concat([...Array(4)].map(() => ({ side: 'theirs' })));
    const c = stage(DIR, ['dirSay'], { dirBook: () => book, _dir, renderDirectory: () => {}, _dCall: () => {},
      state: { away: { covering: [{ userName: 'Jonas Berg', to: '2026-10-23' }] } }, jlDayWord: () => 'Friday' });
    const s = c.dirSay();
    assert.equal(s.lines[0].replace(/<[^>]+>/g, ''), '12 people here: 8 of ours and 4 from the other side.');
    assert.equal(s.lines[1], 'Jonas is away until Friday; you answer their approvals and reviews.');
    assert.equal(Array.from(s.chips, x => x.label).join('|'), 'our people|their people');
    s.chips[1].run();
    assert.equal(_dir.tab, 'theirs', 'the chip is the tab');
  });
  test('4b counted from the directory, no AI', () => {
    const f = fnOf(DIR, 'dirSay');
    assert.match(f, /const book = dirBook\(\);/);
    assert.doesNotMatch(f, /api\(|fetch\(|copilot|aiAsk/i);
  });
  test('4c every word in both books', () => {
    for (const k of ['jl_w_person', 'jl_dir_say_one', 'jl_dir_say_other', 'jl_dir_split', 'jl_dir_cover', 'jl_dir_chip_ours', 'jl_dir_chip_theirs',
      'jl_side_ours', 'jl_email', 'jl_f_email', 'jl_f_away', 'jl_away_until', 'jl_away_line', 'jl_named_n', 'jl_waiting_on', 'jl_may_answer',
      'jl_kind_review', 'jl_kind_look', 'jl_kind_move', 'jl_open_approval', 'jl_open_review', 'jl_open_signing', 'jl_open_negotiation', 'jl_all_on_contracts'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k] != null, `${k} ${lang}`);
  });
});
