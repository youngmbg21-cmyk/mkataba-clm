'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f803 — THE COUNTER AS DRAWN (round 23's gaps, 18 Oct 2026: the picked "Open
   in place", its Counter around Jambo's work — "What do you need, Maria?",
   the chips, "Needs you · 7 · each row's button opens its page", the rows,
   "Show 3 more · a note due today · Baltic Freight's 3 details · Sara's NDA
   request")
   (1) THE CHIPS: what is owed first leads — the first row's short name, its
       press that row's own door — then contracts · calendar · draft a new
       agreement. No "jambo's work" (his row is right below), no upload.
   (2) THE ROWS: the title says the act ("Answer an approval for Jonas",
       "Fill in 2 details"); an approval answered for somebody away carries
       "for Jonas · away until <day>" (approvalAnswersFor); the line says the
       agreement — its name, the party unless the title names it (a salary's
       job title), the value where an approval turns on it, how long it has
       waited — and the reference rides the hover; the button opens its page
       ("Open approval", "Open redlines", "Fill in").
   (3) NEEDS YOU WHOLE: a note of yours that is due (mineNotesDue) and a
       request nobody holds (intakeAlertRows) are rows too, with their doors
       (Open note, Open request); the number counts them; a list that arrives
       after the first paint is drawn when it comes (counterFollow).
   (4) THE FOOT: "Show N more" and the names of what waits behind it.
   (5) Jambo's work's head says "· N prepared · nothing sent or filed until
       you press" while open; the words, in both books.
   (6) SECOND PASS (the checker against the drawing, 18 Oct 2026): "waiting 4
       days" (homeboard publishes hbNyDays, the Counter's row read a bare
       number); the four chips alike; a request's short name says what it is
       for ("Sara's NDA request", cnReqWhat); the admin's own row comes before
       "Show N more", the card's last line.
   (7) JAMBO'S HOUSE SAYS THE COUNTER'S COUNT: "5 waiting for you" on Your
       desk and "1 waiting for you" in a room read counterWorkByAgent, the
       pieces the Counter lists (never the approvals desk), and each opens the
       work on the Counter (counterOpenWork); the house stands four and three
       rooms a floor as drawn, each agent clear of his room's words, and Jambo
       folds to the right edge beside it (his face, the Counter's count, ‹).
   AT THE PARENT (8dc306a) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CN = R('js/views/counter.js');
const AP = R('js/approvals.js');
const APP = R('js/app.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const constLine = (src, name) => { const m = src.match(new RegExp('^(const|let) ' + name + '\\b[^\\n]*$', 'm')); return m ? m[0] : ''; };
const constBlock = (src, name) => { const i = src.search(new RegExp('^const ' + name + '\\b', 'm')); if (i < 0) return ''; return src.slice(i, src.indexOf('};', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    const v = m[2].replace(/\\u([0-9a-fA-F]{4})/g, (_, x) => String.fromCharCode(parseInt(x, 16)));
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const fill = (s, v) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const plus = n => { const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function counter(rows, extra){
  const ctx = {
    i18t: (k, v) => fill(BOOKS.en[k] || k, v), i18tn: (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || BOOKS.en[k] || k, { n, ...(v || {}) }),
    todayISO: () => today, langLocale: () => 'en-GB', icon: n => `<svg data-ic="${n}"></svg>`,
    hbNyWhat: x => x.it.title || '', hbNyDays: n => n + ' days', hbNyWhen: () => '',
    contractRef: c => c.id, streamIsPrivate: () => false, FOLDERS: {}, fmtMoneyShortOf: () => 'KES 8.10M', canViewValues: () => true, isMonetary: () => true, fxIsPay: c => c.category === 'employment',
    INS_NEED_VERB: { renewal: 'home_verb_decide' }, getContract: () => null, agPoss: n => (/s$/i.test(n) && /\s/.test(n)) ? n + '’' : n + '’s',
    cnRows: () => rows, cnWork: () => ({ ready: 0, rows: [] }), cnCompany: () => [], cnSetup: () => 0, cnJwRowHtml: () => '', cnSig: () => '', dkTabs: () => [], deskTabLabel: () => '',
    currentUser: () => ({ name: 'Maria Lindgren' }), jamboFaceHtml: () => '',
    ...(extra || {}),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const names = ['cnDayWords', 'cnMayMoney', 'cnNeedVerb', 'cnNeedTitle', 'cnNeedSub', 'cnNeedRowHtml', 'cnNoteRowHtml', 'cnReqRowHtml', 'cnReqWhat', 'cnNeedShort', 'cnNeedDoorAttrs', 'cnChipsHtml', 'cnFace', 'counterHtml'];
  vm.runInContext(['_cnE', '_cnT', '_cnTn', '_cnFirst', '_cnWho', '_cnToday', '_cnPill', 'CN_ROWS', 'CN_PICK_UP', 'CN_REQ_WHAT_RE'].map(n => constLine(CN, n)).join('\n') + '\nlet _cnAll = false, _cnSig = "", _cnJwOpen = false, _cnJwLook = null;\n'
    + constBlock(CN, 'CN_NEED_GO') + '\n' + names.map(n => fnBody(CN, n)).join('\n'), ctx);
  return ctx;
}
const C = (id, name, cp, extra) => ({ id, name, counterparty: cp, value: 8.1e6, ...(extra || {}) });
const approval = { k: 'c', kind: 'approval', urgent: false, x: { c: C('MK-1', 'Power purchase agreement', 'Helio Energy AB'), it: { kind: 'approval' }, age: null }, fw: { id: 'u_j', name: 'Jonas Berg', until: plus(2) } };
const redlines = { k: 'c', kind: 'quiet', urgent: true, x: { c: C('MK-2', 'Master services agreement', 'Nordvik Logistik'), it: { kind: 'quiet', n: 2, urgent: true, title: 'Answer Nordvik Logistik’s 2 redlines' }, age: 4 } };
const pay = { k: 'c', kind: 'details', urgent: false, x: { c: C('MK-3', 'Employment agreement', 'Erik Holm', { category: 'employment', metadata: { jobTitle: 'Chief financial officer' } }), it: { kind: 'details', n: 2 }, age: null } };
const note = { k: 'note', kind: 'mynote', urgent: false, n: { id: 'nt_1', body: 'Ask about the Kettle insurance', reviewBy: today } };
const req = { k: 'req', kind: 'request', urgent: false, r: { id: 'REQ-1', title: 'NDA with Kettle & Co', by: { name: 'Sara Lind' }, counterparty: 'Kettle & Co', createdAt: new Date().toISOString() } };
const details = n => ({ k: 'c', kind: 'details', urgent: false, x: { c: C('MK-9' + n, 'Freight terms', 'Baltic Freight'), it: { kind: 'details', n: 3 }, age: null } });

describe('f803 (1) the chips', () => {
  test('1a the first owed row leads, by its short name, pressing its own door; then the three places', () => {
    const w = counter([approval, redlines]);
    const html = w.cnChipsHtml([approval, redlines]);
    /* RE-POINTED 18 Oct 2026 (second pass): the four chips wear one dress, as drawn; the lead is marked for its door only */
    const chips = [...html.matchAll(/<button type="button" class="cn-chip" ([^>]*)>([^<]*)<\/button>/g)].map(m => ({ lead: /data-cn-lead/.test(m[1]), attrs: m[1], t: m[2] }));
    assert.equal(chips.map(c => c.t).join('|'), 'Jonas’s approval|contracts|calendar|draft a new agreement');
    assert.ok(chips[0].lead && /data-cn-need="approval" data-cn-id="MK-1"/.test(chips[0].attrs), 'the row\'s own door');
    assert.doesNotMatch(html, /is-lead/);
    assert.doesNotMatch(html, /upload a document|jambo.s work/i);
  });
  test('1b nothing owed: the three places', () => {
    assert.equal([...counter([]).cnChipsHtml([]).matchAll(/>([^<]+)<\/button>/g)].map(m => m[1]).join('|'), 'contracts|calendar|draft a new agreement');
  });
});

describe('f803 (2) the rows', () => {
  test('2a "Answer an approval for Jonas" · "for Jonas · away until <day>" · name · party · value · Open approval', () => {
    const html = counter([]).cnNeedRowHtml(approval);
    assert.match(html, /<b>Answer an approval for Jonas <span class="cn-pill"><svg data-ic="users"><\/svg>for Jonas · away until [A-Z][a-z]+day<\/span><\/b>/);
    assert.match(html, /<span>Power purchase agreement · Helio Energy AB · KES 8\.10M<\/span>/);
    assert.match(html, />Open approval<\/button>/);
    assert.match(html, /title="MK-1 · Power purchase agreement"/, 'the reference rides the hover');
  });
  test('2b their redlines: the party is in the title, so the line does not repeat it; waiting in red', () => {
    const html = counter([]).cnNeedRowHtml(redlines);
    assert.match(html, /<span>Master services agreement · <span class="cn-late">waiting 4 days<\/span><\/span>/);
    assert.match(html, />Open redlines<\/button>/);
  });
  test('2c "Fill in 2 details", a salary\'s job title in place of the person', () => {
    const html = counter([]).cnNeedRowHtml(pay);
    assert.match(html, /<b>Fill in 2 details<\/b><span>Employment agreement · Chief financial officer<\/span>/);
    assert.match(html, />Fill in<\/button>/);
  });
  test('2d whom an approval is answered for: the step\'s own approver, read through the away rule', () => {
    const ctx = { approvalDecidableNow: () => ({ kind: 'rule', step: { approver: { kind: 'member', id: 'u_j' } } }),
      awayForOf: (u, id) => id === 'u_j' ? { id: 'u_j', name: 'Jonas Berg' } : null, currentUser: () => ({ id: 'u_me' }),
      state: { away: { covering: [{ userId: 'u_j', userName: 'Jonas Berg', from: today, to: plus(3) }] } } };
    vm.createContext(ctx);
    vm.runInContext(fnBody(AP, 'approverForOf') + fnBody(AP, 'approvalAnswersFor'), ctx);
    const fw = ctx.approvalAnswersFor({ id: 'MK-1' });
    assert.equal(fw.name + '|' + fw.until, 'Jonas Berg|' + plus(3));
    ctx.awayForOf = () => null;
    assert.equal(ctx.approvalAnswersFor({ id: 'MK-1' }), null, 'answered as themself: nothing said');
  });
});

describe('f803 (3) Needs you whole', () => {
  test('3a a note of yours that is due, only you, Open note', () => {
    const html = counter([]).cnNeedRowHtml(note);
    assert.match(html, /<b>A note of yours is due today<\/b><span>“Ask about the Kettle insurance” · only you<\/span>/);
    assert.match(html, /data-cn-note="nt_1">Open note</);
  });
  test('3b a request nobody holds, Open request', () => {
    const html = counter([]).cnNeedRowHtml(req);
    assert.match(html, /<b>Sara’s request: NDA with Kettle &amp; Co<\/b><span>Kettle &amp; Co<\/span>/);
    assert.match(html, /data-cn-req="REQ-1">Open request</);
  });
  test('3c the list reads both, the bell\'s own readings, and the number counts them', () => {
    const rows = fnBody(CN, 'cnRows');
    assert.match(rows, /mineNotesDue\(\)/);
    assert.match(rows, /intakeAlertRows\(\)/);
    assert.match(rows, /approvalAnswersFor\(x\.c\)/);
    assert.match(fnBody(CN, 'counterNeedsCount'), /cnRows\(\)\.length/);
  });
  test('3d what arrives after the first paint is drawn when it comes', () => {
    assert.match(fnBody(APP, 'updateSidebarCounts'), /if\(typeof counterFollow==='function'\) counterFollow\(\);/);
    assert.match(fnBody(CN, 'renderCounter'), /mineLoad\(\)\.then\(counterFollow/);
    assert.match(fnBody(CN, 'counterFollow'), /if \(sig !== _cnSig\) counterRepaint\(\);/);
  });
});

describe('f803 (4) the foot', () => {
  test('4a "Show N more" and the names of what waits behind it', () => {
    const rows = [approval, redlines, details(1), details(2), details(3), details(4), details(5), note, pay, req];
    const html = counter(rows).counterHtml();
    /* RE-POINTED 18 Oct 2026 (second pass): "Sara's NDA request", whose and what it is for, as drawn */
    assert.match(html, /data-cn-all aria-expanded="false">Show 3 more<\/button><span class="cn-foot-said">a note due today · Erik Holm’s 2 details · Sara’s NDA request<\/span>/);
    assert.equal((html.match(/<div class="cn-r"/g) || []).length, 7, 'seven rows in sight');
  });
  test('4b more than three behind it: three names and the rest counted', () => {
    const rows = [approval, redlines, details(1), details(2), details(3), details(4), details(5), note, pay, req, details(6)];
    assert.match(counter(rows).counterHtml(), /<span class="cn-foot-said">a note due today · Erik Holm’s 2 details · Sara’s NDA request · and 1 more<\/span>/);
  });
});

describe('f803 (5) Jambo\'s work\'s head, and the words', () => {
  test('5a open, its head says what the drawing says', () => {
    assert.equal(BOOKS.en.cn_jw_said, 'nothing sent or filed until you press');
    assert.match(fnBody(CN, 'cnJwRowHtml'), /\$\{open \? ' · ' \+ _cnE\(_cnT\('cn_jw_said'\)\) : ''\}<\/span><\/b>\$\{open \? '' :/);
  });
  test('5b the words, in both books', () => {
    for (const k of ['cn_need_approval', 'cn_need_approval_for', 'cn_need_details_one', 'cn_need_details_other', 'cn_need_away', 'cn_need_for', 'cn_need_go_approval', 'cn_need_go_redlines',
      'cn_need_go_note', 'cn_need_go_request', 'cn_waiting', 'cn_need_note', 'cn_need_note_late', 'cn_need_note_only', 'cn_need_request', 'cn_sh_mynote', 'cn_sh_request', 'cn_sh_approval_for',
      'cn_sh_approval', 'cn_sh_redlines_other', 'cn_sh_details_other', 'cn_sh_renewal', 'cn_show_more_one', 'cn_show_more_other', 'cn_and_more'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});

describe('f803 (6) second pass: the Counter as drawn', () => {
  test('6a "waiting 4 days": the Board publishes the days in words the Counter reads', () => {
    const HB = R('js/views/homeboard.js');
    const pub = HB.slice(HB.lastIndexOf('Object.assign(window, { hbThenDay'));
    assert.match(pub, /\bhbNyDays\b/, 'published, so the row is not a bare number');
    assert.match(fnBody(CN, 'cnNeedSub'), /hbNyDays\(x\.age\)/);
  });
  test('6b a request says whose and what it is for; a title that names no agreement says only whose', () => {
    const w = counter([]);
    const r = t => ({ k: 'req', r: { id: 'R', title: t, by: { name: 'Sara Lind' } } });
    assert.equal(w.cnNeedShort(r('NDA with Kettle & Co')), 'Sara’s NDA request');
    assert.equal(w.cnNeedShort(r('New supply agreement for Baltic')), 'Sara’s supply agreement request');
    assert.equal(w.cnNeedShort(r('Help with the Kettle deal')), 'Sara’s request');
    assert.equal(w.cnNeedShort(r('Review the NDA')), 'Sara’s request', 'a verb first is not what it is for');
  });
  test('6c the admin\'s own row comes before "Show N more", the card\'s last line', () => {
    const rows = [approval, redlines, details(1), details(2), details(3), details(4), details(5), note, pay, req];
    const w = counter(rows, { cnCompany: () => [{ text: 'A rule clashes' }] });
    vm.runInContext(fnBody(CN, 'cnCompanyRowHtml'), w);
    const html = w.counterHtml();
    const co = html.indexOf('data-cn-co'), more = html.indexOf('data-cn-all');
    assert.ok(co > 0 && more > co, 'company row, then Show N more');
    assert.match(html, /<\/span><\/div><\/section>\s*<\/div><\/div>$/, 'nothing after the foot');
  });
  test('6d the four chips wear one dress: no louder lead in the sheet', () => {
    assert.doesNotMatch(R('index.html'), /\.cn-chip\.is-lead\{/);
  });
  test('6e the words, in both books', () => {
    for (const k of ['cn_sh_request_what']) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});

describe('f803 (7) Jambo\'s house says the Counter\'s count', () => {
  const JH = R('js/views/jambohouse.js');
  test('7a one reading: what the Counter lists, by agent', () => {
    const ctx = { cnWork: () => ({ ready: 5, rows: [{ k: 'round', pill: 1 }, { k: 'paper', pill: 1 }, { k: 'renew', pill: 1 }, { k: 'late', pill: 1 }, { k: 'import', pill: 1 }] }) };
    vm.createContext(ctx);
    vm.runInContext(fnBody(CN, 'counterWorkByAgent'), ctx);
    const W = ctx.counterWorkByAgent();
    assert.equal(W.ready, 5);
    assert.deepEqual(Object.keys(W.by).sort(), ['import', 'late', 'paper', 'renew', 'round']);
    assert.equal(W.by.approve, undefined, 'the approvals desk is never on the Counter, so never waiting here');
  });
  test('7b at rest the desk, its trays and each room read it; a replay keeps its own record', () => {
    const f = fnBody(JH, 'jhDrawOffice');
    assert.match(f, /const W = upto === Infinity && !_jh\.one \? jhWaitNow\(\) : null;/, 'at rest, over the whole book');
    assert.match(f, /deskOpen\[r\.k\] = W \? \(W\.by\[r\.k\] \|\| 0\) : \(agPointsTally/);
    assert.match(f, /wn = W \? \(W\.by\[r\.k\] \|\| 0\) : 0/);
    assert.match(fnBody(JH, 'jhWaitNow'), /counterWorkByAgent\(\)/);
  });
  test('7c "N waiting for you" is a door to the work on the Counter', () => {
    const f = fnBody(JH, 'jhDrawOffice');
    assert.match(f, /jhLinkText\(ctx, dw, c\.x \+ c\.w - 14, ly1\(c\) \+ 2, C\.ok, 'desk'\)/);
    assert.match(f, /jhLinkText\(ctx, link, wx \+ ctx\.measureText\(head\)\.width, ly2\(c\), C\.amber, r\.k\)/);
    assert.match(JH, /if \(typeof counterOpenWork === 'function'\) counterOpenWork\(k === 'desk' \? null : k\); return; \}/);
    const go = fnBody(CN, 'counterOpenWork');
    assert.match(go, /_cnJwOpen = true;/);
    assert.match(go, /setView\('counter'\)/);
  });
  test('7d four and three rooms a floor, as drawn; each agent clear of his room\'s words', () => {
    assert.match(fnBody(JH, 'jhLayout'), /_jhCols = offices\.length > JH_COLS \* 2 \? JH_COLS_MAX : JH_COLS;/);
    assert.match(fnBody(JH, 'jhDrawOffice'), /const wx = r\.seat\.y - 26 >= ly2\(c\) \+ 4 \? lx\(c\) : r\.seat\.x \+ 18/);
  });
  test('7e Jambo folded to the right edge beside his house: his face, the Counter\'s count, his name, ‹ — a press opens him', () => {
    const f = fnBody(JH, 'jhJamboDoorHtml');
    assert.match(f, /counterNeedsCount\(\)/);
    assert.match(f, /class="igd-door" data-jh-jambo/);
    assert.match(f, /_jhT\('pd_tab_copilot'\)/);
    assert.match(f, /<use href="#i-left"\/>/);
    assert.match(fnBody(JH, 'renderJamboHouse'), /\$\{jhBandHtml\(\)\}\$\{body\}<\/div>\$\{jhJamboDoorHtml\(\)\}<\/div>/);
    assert.match(JH, /if \(t\.closest\('\[data-jh-jambo\]'\)\)\{ if \(typeof openAI === 'function'\) openAI\(\); return; \}/);
    assert.match(R('index.html'), /:is\(#ig-dock,#jh-jambo\) \.igd-door\{height:100%/, 'Home\'s folded strip\'s own clothes');
  });
});
