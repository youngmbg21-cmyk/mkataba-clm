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
       you press" (RE-POINTED 18 Oct 2026, LAND ON IT: the row no longer opens
       in place, so the drawn head words are its own whenever work waits, and
       its Open lands on the Board's card); the words, in both books.
   (6) SECOND PASS (the checker against the drawing, 18 Oct 2026): "waiting 4
       days" (homeboard publishes hbNyDays, the Counter's row read a bare
       number); the four chips alike; a request's short name says what it is
       for ("Sara's NDA request", cnReqWhat); the admin's own row comes before
       "Show N more", the card's last line.
   (7) JAMBO'S HOUSE SAYS THE COUNTER'S COUNT: "5 waiting for you" on Your
       desk and "1 waiting for you" in a room read counterWorkByAgent, the
       pieces the Board's Jambo's work card lists (never the approvals desk),
       and each LANDS ON that card (hbOpenAgent — RE-POINTED 18 Oct 2026 from
       counterOpenWork, which LAND ON IT took away); the house stands four and
       three rooms a floor as drawn, each agent clear of his room's words
       (main's measured rule: a short room draws no work line), and Jambo
       folds to the right edge beside it (his face, the Counter's count, ‹).
   (8) THIRD PASS (the checker against the drawing, rebuilt for LAND ON IT,
       19 Oct 2026): three owed rows in sight, then "Show 3 more · a note due
       today · Baltic Freight's 3 details · Sara's NDA request" (CN_ROWS 3);
       the approval answered for an away colleague leads, so the lead chip is
       "Jonas's approval"; time said in words ("in 40 days", never "in 40d");
       the renewal's title is its act, "Decide the renewal"; the greeting
       large (since Chambers, 20 Oct 2026, the title serif at 28px; it was
       Geist 26px semibold) and Jambo's work's tail small (12px); the approval's door
       lands ON the approval it opens (NEEDS_LAND, LAND ON IT).
   (9) THE HOUSE FILLS ITS PAGE (19 Oct 2026, as drawn: from the page's left
       edge to Jambo's folded strip): no 1200px cap; past JH_K_MAX the drawing
       widens (_jhW) rather than scaling up, so its floors keep their height.
   AT THE PARENT (8dc306a) every test here FAILS. At this lane's last commit
   (9cde108) (8), (9) and the re-pointed 4a, 4b, 6a, 6c and 7c FAIL.
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
    cnRows: () => rows, cnWork: () => ({ ready: 0, rows: [] }), cnCompany: () => [], cnSetup: () => 0, dkTabs: () => [], deskTabLabel: () => '',
    currentUser: () => ({ name: 'Maria Lindgren' }), jamboFaceHtml: () => '', setTimeout: () => 0,
    ...(extra || {}),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  /* THE ONE DESK (Round A, 22 Oct 2026): Home's card is drawn from ndRead, so its parts load beside Home's */
  const names = ['cnDayWords', 'cnMayMoney', 'cnNeedTitle', 'cnReqWhat', 'cnNeedShort', 'cnNeedDoorAttrs', 'cnChipsHtml', 'cnFace', 'counterHtml',
    'ndIsNews', 'ndAlerts', 'ndAlCovered', 'ndPieces', 'ndAgeOf', 'ndPieceAge', 'ndKindOf', 'ndRead', 'ndSumWords', 'ndStepOf', 'ndParts', 'ndHomeRowHtml', 'ndHomeHtml', 'ndSig'];
  vm.runInContext(['_cnE', '_cnT', '_cnTn', '_cnFirst', '_cnWho', '_cnToday', '_cnPill', '_cnJbCard', '_cnJbSend', 'CN_ROWS', 'CN_PICK_UP', 'CN_REQ_WHAT_RE',
    'ND_PAGE', 'ND_BUNDLE_MIN', 'ND_MERGE', 'ND_KIND_OF', 'ND_KINDS', 'ND_BTN', 'ND_NOT_WAITED', 'ND_NEWS', 'ND_AL_ROWS', 'ND_AL_PIECES', 'ND_AL_ADMIN', 'ND_AL_KIND', 'ND_AL_BTN', '_ndCid', '_ndHash', 'ndAlKey', '_ndAge', 'ndThings', '_ndCall', '_ndText', '_ndBtnHtml', '_ndStepHtml', '_ndTagHtml'].map(n => constLine(CN, n)).join('\n')
    + '\nlet _cnSig = "", _ndMemo = null, _nd = { tab: "all", kind: "any", q: "", more: 0 };\n' + names.map(n => fnBody(CN, n)).join('\n'), ctx);
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
  /* RE-POINTED 27 Oct 2026 (owner: "remove the highlighted sign contract and add board as always an option to press
     when you are in the home page"): no lead chip — the first owed row stays in Needs you — and the Board leads */
  test('1a an owed row is never a chip; the four places, the Board first', () => {
    const w = counter([approval, redlines]);
    const html = w.cnChipsHtml([approval, redlines]);
    const chips = [...html.matchAll(/<button type="button" class="cn-chip" ([^>]*)>([^<]*)<\/button>/g)].map(m => ({ attrs: m[1], t: m[2] }));
    assert.equal(chips.map(c => c.t).join('|'), 'board|contracts|calendar|draft a new agreement');
    assert.ok(chips.every(c => /^data-cn-ask="/.test(c.attrs)), 'each a place word, pressed as typed');
    assert.doesNotMatch(html, /data-cn-lead|data-cn-need|is-lead/);
  });
  test('1b nothing owed: the same four', () => {
    assert.equal([...counter([]).cnChipsHtml([]).matchAll(/>([^<]+)<\/button>/g)].map(m => m[1]).join('|'), 'board|contracts|calendar|draft a new agreement');
  });
});

describe('f803 (2) the rows', () => {
  /* RE-POINTED 22 Oct 2026 (Round A, "The Legora Way"): a row is the one desk's (ndParts → ndHomeRowHtml).
     RE-POINTED 24 Oct 2026 (Round 2, owner's yes): THE AGREEMENT LEADS — its name in black, then the number,
     the other side and the ask in grey; how long it waited in its own column; the button says what happens */
  const row = (w, y) => w.ndHomeRowHtml({ g: 'you', key: 'k', kind: w.ndKindOf(y), y, n: 1, late: y.urgent ? 1 : 0, age: w.ndAgeOf(y) });
  test('2a the agreement · "for Jonas · away until <day>" · number · party · the ask · value · Approve…', () => {
    const html = row(counter([]), approval);
    assert.match(html, /<b><span class="nd-t">Power purchase agreement<\/span> <span class="cn-pill"><svg data-ic="users"><\/svg>for Jonas · away until [A-Z][a-z]+day<\/span><\/b>/);
    assert.match(html, /<span>MK-1 · Helio Energy AB · Answer an approval for Jonas · KES 8\.10M<\/span>/);
    assert.match(html, /data-cn-need="approval" data-cn-id="MK-1">Approve…<\/button>/);
    assert.match(html, /title="MK-1 · Power purchase agreement · Helio Energy AB · KES 8\.10M"/, 'the reference rides the hover');
  });
  test('2b their redlines: the party is in the title, so the line does not repeat it; how long, in red', () => {
    const html = row(counter([]), redlines);
    assert.match(html, /<b><span class="nd-t">Master services agreement<\/span><\/b><span>MK-2 · Answer Nordvik Logistik’s 2 redlines<\/span><\/div><span class="nd-when cn-late">4 days<\/span>/);
    assert.match(html, />Review<\/button>/);
  });
  test('2c "Fill in 2 details", a salary\'s job title in place of the person', () => {
    const html = row(counter([]), pay);
    assert.match(html, /<b><span class="nd-t">Employment agreement<\/span><\/b><span>MK-3 · Chief financial officer · Fill in 2 details<\/span>/);
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
  /* RE-POINTED 22 Oct 2026 (Round A): the one desk's words; who asked is the Board's column */
  test('3a a note of yours that is due, only you, Open', () => {
    const P = counter([]).ndParts({ g: 'you', y: note, n: 1, late: 0, age: null });
    assert.equal([P.title, P.deal, P.who, P.btn].join('|'), 'A note of yours is due today|“Ask about the Kettle insurance”|only you|open');
    assert.equal(P.attrs, 'data-cn-note="nt_1"');
  });
  test('3b a request nobody holds, Answer', () => {
    const P = counter([]).ndParts({ g: 'you', y: req, n: 1, late: 0, age: 0 });
    assert.equal([P.title, P.deal, P.who, P.btn].join('|'), 'Sara’s request: NDA with Kettle & Co|Kettle & Co|Sara Lind|answer');
    assert.equal(P.attrs, 'data-cn-req="REQ-1"');
  });
  test('3c the list reads both, the bell\'s own readings, and the number counts them', () => {
    const rows = fnBody(CN, 'cnRows');
    assert.match(rows, /mineNotesDue\(\)/);
    assert.match(rows, /intakeAlertRows\(\)/);
    assert.match(rows, /approvalAnswersFor\(x\.c\)/);
    assert.match(fnBody(CN, 'counterNeedsCount'), /ndRead\(\)\.n/);
    assert.match(fnBody(CN, 'ndRead'), /const rows = cnRows\(\);/, 'the one desk reads Home\'s rows');
  });
  test('3d what arrives after the first paint is drawn when it comes', () => {
    assert.match(fnBody(APP, 'updateSidebarCounts'), /if\(typeof counterFollow==='function'\) counterFollow\(\);/);
    assert.match(fnBody(CN, 'renderCounter'), /mineLoad\(\)\.then\(counterFollow/);
    assert.match(fnBody(CN, 'counterFollow'), /sig = ndSig\(ndRead\(\)\)/);
    assert.match(fnBody(CN, 'counterFollow'), /if \(sig !== _cnSig\) counterRepaint\(\);/);
  });
});

describe('f803 (3b) a note\'s and a request\'s door LANDS ON its row (LAND ON IT, 18 Oct 2026)', () => {
  test('3e the page opens, then the one lander lights the row named; it presses nothing', () => {
    const wire = CN.slice(CN.indexOf("if ((el = t.closest('[data-cn-note]')))"), CN.indexOf("if ((el = t.closest('[data-cn-need]')))"));
    assert.match(wire, /myNotesOpen\(id\); cnLand\('\[data-mn-row="' \+ cnSel\(id\) \+ '"\]', 'cn_land_note_gone'\);/);
    assert.match(wire, /intakeGoTo\(id\); cnLand\('\[data-ik-row="' \+ cnSel\(id\) \+ '"\]', 'cn_land_req_gone'\);/);
    const ctx = { landOn: (sel, o) => { ctx.got = { sel, o }; }, i18t: k => k };
    vm.createContext(ctx);
    vm.runInContext(constLine(CN, '_cnT') + '\n' + fnBody(CN, 'cnLand'), ctx);
    ctx.cnLand('[data-mn-row="nt_1"]', 'cn_land_note_gone');
    assert.equal(ctx.got.sel, '[data-mn-row="nt_1"]');
    assert.equal(ctx.got.o.missing, 'cn_land_note_gone', 'a row that is gone is said where the reader looks');
    for (const k of ['cn_land_note_gone', 'cn_land_req_gone']) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
    /* the rows the lander looks for are the pages' own */
    assert.match(R('js/views/mynotes.js'), /<tr data-mn-row="\$\{_mnE\(n\.id\)\}"/);
    assert.match(R('js/views/intake.js'), /<tr data-ins-row data-ik-row="\$\{esc\(r\.id\)\}"/);
  });
});

describe('f803 (4) the foot', () => {
  /* RE-POINTED 22 Oct 2026 (Round A, "The Legora Way"; the owner: "Why don't you just move them to board?"):
     THREE rows of each group in sight; a group holding more says "Show all N", which lands on the Board's
     card on that group's tab — no "Show N more" on Home, nothing grows past the screen */
  test('4a "Show all N" on the group, three rows in sight', () => {
    const rows = [approval, redlines, pay, note, details(1), req];
    const html = counter(rows).counterHtml();
    assert.match(html, /<div class="nd-g" data-nd-g="you"><span class="nd-g-t">Waiting on you<\/span><button type="button" class="ui-link nd-all" data-nd-all="you">Show all 6<\/button><\/div>/);
    assert.equal((html.match(/<div class="cn-r nd-r[ "]/g) || []).length, 3, 'three rows in sight');
    assert.doesNotMatch(html, /data-cn-all|cn-foot-said/, 'the old foot is gone');
  });
  test('4b more than three contracts owing details read as ONE row, counted', () => {
    const w = counter([details(1), details(2), details(3), details(4), approval]);
    const D = w.ndRead();
    assert.equal(D.you.length, 2, 'the bundle and the approval');
    assert.equal(D.n, 5, 'every thing is counted');
    const P = w.ndParts(D.you.find(r => r.bundle));
    assert.equal([P.title, P.tag, P.btn, P.attrs].join('|'), 'Fill in details on 4 contracts|4 in one row|fill|data-nd-bundle="details"');
    assert.equal(counter([details(1), details(2), details(3), approval]).ndRead().you.length, 4, 'three stay rows of their own');
  });
});

describe('f803 (5) Jambo\'s rows, and the words', () => {
  /* RE-POINTED 22 Oct 2026 (Round A): no "Jambo's work · N prepared" row; each piece he prepared is a row
     of its own under "Jambo prepared it · your look is next": what it is, its step, what he read, Look */
  const piece = { key: 'round:MK-2', kind: 'answer', agent: 'round', c: C('MK-2', 'Master services agreement', 'Nordvik Logistik'), days: 2, tone: 'amber' };
  const world = rows => counter(rows, {
    AG_KEYS: ['round'], AG_DEF: { round: { review: 4, steps: [1, 2, 3, 4, 5, 6] } },
    agentsData: () => ({ agents: { round: { ready: [piece] } } }),
    agPieceTitle: () => 'Nordvik Logistik’s answer', agPieceLine: () => 'Two changes: take one, push back on one.', agPieceRefHtml: it => '<span class="hati-ref">' + it.c.id + '</span>', agCardParts: () => ({ urg: 'Waiting 2 days' }) });
  /* RE-POINTED 24 Oct 2026 (Round 2, owner's yes): a piece leads with the agreement, then the number and what
     Jambo prepared, in grey (the party is in the piece's own words, so not said twice); its button says Review */
  test('5a a piece is a row: the agreement, the number and what Jambo prepared, Review', () => {
    const w = world([]);
    const html = w.ndHomeRowHtml(w.ndRead().jambo[0]);
    assert.match(html, /<b><span class="nd-t">Master services agreement<\/span><\/b><span><span class="hati-ref">MK-2<\/span> · Nordvik Logistik’s answer<\/span>/);
    assert.match(html, /data-nd-look="round:MK-2">Review<\/button>/);
    assert.match(html, /title="Two changes: take one, push back on one\."/, 'what he found rides the hover');
  });
  test('5a2 the waiting thing and the piece prepared for it are ONE row, the piece\'s, and it keeps the wait and the red', () => {
    const w = world([redlines, approval]);
    const D = w.ndRead();
    assert.equal(D.you.map(r => r.y.x.c.id).join(','), 'MK-1', 'their redlines are not a row of their own');
    assert.equal(D.jambo.length, 1);
    assert.equal(D.jambo[0].late + '|' + D.jambo[0].age, '1|4', 'the redlines\' 4 days, late');
    assert.equal(D.n, 2);
    const html = w.counterHtml();
    assert.ok(html.indexOf('data-nd-g="jambo"') < html.indexOf('data-nd-g="you"'), 'Jambo\'s work first');
    assert.match(html, /<span class="cn-cnt">2<\/span><span class="nd-sum">1 late · the oldest has waited 4 days<\/span>/);
  });
  test('5b the words, in both books', () => {
    for (const k of ['cn_need_approval', 'cn_need_approval_for', 'cn_need_details_one', 'cn_need_details_other', 'cn_need_away', 'cn_need_for',
      'cn_need_note', 'cn_need_note_late', 'cn_need_note_only', 'cn_need_request', 'cn_sh_mynote', 'cn_sh_request', 'cn_sh_approval_for',
      'cn_sh_approval', 'cn_sh_redlines_other', 'cn_sh_details_other', 'cn_sh_renewal', 'cn_show_all', 'cn_show_more_one', 'cn_show_more_other',
      'nd_g_jambo', 'nd_g_you', 'nd_late_one', 'nd_late_other', 'nd_oldest', 'nd_step', 'nd_step_title', 'nd_read', 'nd_bundle_details_one', 'nd_bundle_details_other', 'nd_bundle_tag',
      'nd_btn_look', 'nd_btn_decide', 'nd_btn_sign', 'nd_btn_review', 'nd_btn_fill', 'nd_btn_answer', 'nd_btn_open'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});

describe('f803 (6) second pass: the Counter as drawn', () => {
  test('6a "waiting 4 days": the Board publishes the days in words the Counter reads', () => {
    const HB = R('js/views/homeboard.js');
    const pub = HB.slice(HB.lastIndexOf('Object.assign(window, { hbThenDay'));
    assert.match(pub, /\bhbNyDays\b/, 'published, so the row is not a bare number');
    /* RE-POINTED 22 Oct 2026 (Round A): the row's time is the one desk's, in its own column */
    assert.match(fnBody(CN, 'ndParts'), /if \(x\.age != null\) P\.when = days\(x\.age\);/);
  });
  test('6b a request says whose and what it is for; a title that names no agreement says only whose', () => {
    const w = counter([]);
    const r = t => ({ k: 'req', r: { id: 'R', title: t, by: { name: 'Sara Lind' } } });
    assert.equal(w.cnNeedShort(r('NDA with Kettle & Co')), 'Sara’s NDA request');
    assert.equal(w.cnNeedShort(r('New supply agreement for Baltic')), 'Sara’s supply agreement request');
    assert.equal(w.cnNeedShort(r('Help with the Kettle deal')), 'Sara’s request');
    assert.equal(w.cnNeedShort(r('Review the NDA')), 'Sara’s request', 'a verb first is not what it is for');
  });
  test('6c the admin\'s own row is the last of your move', () => {
    /* RE-POINTED 22 Oct 2026 (Round A): there is no foot; the admin's row ends Your move, counted as one */
    const D = counter([approval, redlines], { cnCompany: () => [{ text: 'A rule clashes' }] }).ndRead();
    assert.equal(D.you[D.you.length - 1].key, 'company');
    assert.equal(D.n, 3);
  });
  test('6d the four chips wear one dress: no louder lead in the sheet', () => {
    assert.doesNotMatch(R('index.html'), /\.cn-chip\.is-lead\{/);
  });
  test('6e the words, in both books', () => {
    for (const k of ['cn_sh_request_what']) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});

describe('f803 (7) Jambo\'s house says the Board card\'s count', () => {
  const JH = R('js/views/jambohouse.js');
  test('7a one reading: what the Counter lists, by agent', () => {
    /* RE-POINTED 22 Oct 2026 (Round A): the Jambo rows of the one desk, one per piece — what the Board's "Jambo prepared" tab lists */
    const ctx = { ndRead: () => ({ jambo: ['round', 'paper', 'renew', 'late', 'import'].map(agent => ({ agent })) }) };
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
  test('7c "N waiting for you" lands on the Board\'s Jambo\'s work card (LAND ON IT)', () => {
    const f = fnBody(JH, 'jhDrawOffice');
    assert.match(f, /jhLinkText\(ctx, dw, c\.x \+ c\.w - 14, ly1\(c\) \+ 2, C\.ok, 'desk'\)/);
    /* RE-POINTED 19 Oct 2026: the agent's name stays whole and the link's end is what is cut */
    assert.match(f, /jhLinkText\(ctx, link, wx \+ hw, ly2\(c\), C\.amber, r\.k\)/);
    assert.match(JH, /if \(typeof hbOpenAgent === 'function'\) hbOpenAgent\(k === 'desk' \? null : k\); return; \}/, 'a room: its agent\'s work below the card');
    assert.match(JH, /if \(t\.closest\('\[data-jh-work\]'\)\)\{ if \(typeof hbOpenAgent === 'function'\) hbOpenAgent\(\); return; \}/, 'the keyboard\'s door: the card');
    assert.doesNotMatch(JH + CN, /counterOpenWork/, 'no second way onto the work');
    assert.ok(BOOKS.en.jh_wait_open && BOOKS.sv.jh_wait_open && BOOKS.en.jh_wait_open_p && BOOKS.sv.jh_wait_open_p, 'the door and its hover, in both books');
  });
  test('7d four and three rooms a floor, as drawn; a room\'s work line only where it clears the seat', () => {
    assert.match(fnBody(JH, 'jhLayout'), /_jhCols = offices\.length > JH_COLS \* 2 \? JH_COLS_MAX : JH_COLS;/);
    /* RE-POINTED 18 Oct 2026: main measured the same overlap and draws no work line where it would not clear the seat */
    assert.match(fnBody(JH, 'jhDrawOffice'), /if \(!cp && ly2\(c\) \+ 4 <= r\.seat\.y - 25\)\{/);
  });
  /* RE-POINTED 29 Oct 2026 (owner: "Add the right jambo here not the one from the top"): the folded door to
     the side panel is gone; the house carries the list pages' own Jambo panel on the right (#ins-panel, painted
     by insPaintPanel → jlFrame), its Overview read off the one desk's prepared pieces, no Jambo call. */
  test('7e Jambo\'s panel stands on the right of his house, as on every list page', () => {
    assert.match(fnBody(JH, 'renderJamboHouse'), /\$\{jhBandHtml\(\)\}\$\{body\}<aside id="ins-panel" class="ins-panel"/);
    assert.match(fnBody(JH, 'renderJamboHouse'), /jhSidePaint\(\);/);
    assert.match(fnBody(JH, 'jhSidePaint'), /insPaintPanel\(\{ seat: 'jambo', jlSay: jhSideSay/);
    assert.match(fnBody(JH, 'jhSideSay'), /counterWorkByAgent\(\)\.ready/);
    assert.match(fnBody(JH, 'jhSideSay'), /hbOpenAgent\(\)/);
  });
});

describe('f803 (8) third pass: Home as drawn', () => {
  test('8a three owed rows in sight', () => {
    assert.match(constLine(CN, 'CN_ROWS'), /^const CN_ROWS = 3;$/);
  });
  test('8b the approval answered for an away colleague leads — then the urgent', () => {
    const ctx = { cnNeeds: () => [{ c: { id: 'MK-2' }, it: { kind: 'quiet', urgent: true } }, { c: { id: 'MK-1' }, it: { kind: 'approval' } }],
      approvalAnswersFor: c => c.id === 'MK-1' ? { id: 'u_j', name: 'Jonas Berg' } : null, mineNotesDue: () => [], intakeAlertRows: () => [], todayISO: () => today };
    vm.createContext(ctx);
    vm.runInContext(constLine(CN, '_cnToday') + '\n' + fnBody(CN, 'cnRows'), ctx);
    const rows = ctx.cnRows();
    assert.deepEqual(rows.map(r => r.x.c.id), ['MK-1', 'MK-2'], 'Jonas\'s approval above their late redlines, as drawn');
    const w = counter(rows.map(r => r.x.c.id === 'MK-1' ? approval : redlines));
    /* RE-POINTED 27 Oct 2026: it no longer leads the chips (no lead chip, f803 (1)) */
    assert.match(w.cnChipsHtml([approval, redlines]), /^<button type="button" class="cn-chip" data-cn-ask="board">board<\/button>/);
  });
  test('8c time in words: "in 40 days", never "in 40d"; a day the way a person says it', () => {
    const w = counter([]);
    const ren = { k: 'c', kind: 'renewal', urgent: false, x: { c: C('MK-7', 'Supply agreement', 'Brightwater Foods'), it: { kind: 'renewal', d: 40 }, age: null } };
    /* RE-POINTED 22 Oct 2026 (Round A): the one desk says the time in its own column */
    const one = y => w.ndParts({ g: 'you', y, n: 1, late: 0, age: w.ndAgeOf(y) });
    const P = one(ren);
    assert.equal([P.title, P.deal, P.when, P.btn].join('|'), 'Decide the renewal|Supply agreement · Brightwater Foods|in 40 days|decide', 'the act, the agreement, the time in words');
    assert.doesNotMatch(w.ndHomeRowHtml({ g: 'you', key: 'k', kind: 'renewal', y: ren, n: 1, late: 0, age: null }), /\b40 ?d\b/);
    const at = it => one({ k: 'c', kind: it.kind, urgent: false, x: { c: C('MK-7', 'Supply agreement', 'Brightwater Foods'), it, age: null } }).when;
    assert.equal(at({ kind: 'renewal', d: 1 }), 'in 1 day');
    assert.equal(at({ kind: 'renewal', d: 0 }), 'today');
    assert.match(at({ kind: 'sign', due: plus(2) }), /^due [A-Z][a-z]+day$/);
    assert.equal(BOOKS.sv.cn_due, 'senast {day}');
  });
  test('8d the greeting large, in the title serif; every button of Needs you one width', () => {
    const css = R('index.html');
    /* RE-POINTED 20 Oct 2026 (Chambers): Home's question is a page title — the
       serif title face at 28px, its own weight (was Geist 26px strong) */
    assert.match(css, /\.cn-ask h1\{font-family:var\(--font-title\);font-size:28px;font-weight:var\(--w-title-serif\);/);
    /* RE-POINTED 22 Oct 2026 (Round A, the owner: "make all of the buttons the same size") */
    assert.match(css, /\.nd-btn\{flex:none;width:76px;justify-content:center\}/);
  });
  test('8e "Open approval" and the lead chip LAND ON the approval they open, lit (LAND ON IT)', () => {
    const HOME = R('js/views/home.js');
    const t = HOME.slice(HOME.indexOf('const NEEDS_LAND={'), HOME.indexOf('};', HOME.indexOf('const NEEDS_LAND={')));
    assert.match(t, /approval:\(\)=>\{ const sa=document\.querySelector\('#pd-signface #sa-card'\)\|\|document\.getElementById\('sa-card'\); if\(sa\) return sa;/);
    assert.match(t, /const ap=document\.querySelector\('#pd-signface #ap-approve'\); if\(ap\) return ap\.closest\('section'\)\|\|ap;/, 'a rule\'s step: the Approval gate, where its Approve stands');
    assert.match(t, /#pd-signface \[data-pd-road-stop="yes"\]/, 'else the road\'s yes stop');
    assert.match(fnBody(HOME, 'needsYouGo'), /needsLand\(kind\);/);
  });
});

describe('f803 (9) the house fills its page', () => {
  const JH = R('js/views/jambohouse.js');
  test('9a no 1200px cap, no centring', () => {
    assert.doesNotMatch(R('index.html'), /\.jh-page\{max-width:1200px;margin-inline:auto\}/);
  });
  test('9b past JH_K_MAX the drawing widens rather than scaling up, so its floors keep their height', () => {
    assert.match(JH, /^const JH_K_MAX = \.75;$/m);
    const fit = fnBody(JH, 'jhFitCanvas');
    assert.match(fit, /k = Math\.min\(cssW \/ JH_W, JH_K_MAX\);/);
    assert.match(fit, /_jhW = Math\.max\(JH_W, Math\.round\(cssW \/ k\)\);/);
    assert.match(fnBody(JH, 'jhLayout'), /\(jhRX1\(\) - JH_RX0/, 'the rooms widen with it');
    assert.match(JH, /const jhGeom = \(\) => \(\{[^}]*w: _jhW,/);
  });
  test('9c a room\'s work line keeps the agent\'s name whole; only the link\'s end is cut', () => {
    const f = fnBody(JH, 'jhDrawOffice');
    assert.match(f, /const head = up\(_jhT\('ag_' \+ r\.k\) \+ ' · '\), hw = ctx\.measureText\(head\)\.width;/);
    assert.match(f, /const link = jhClip\(ctx, up\(_jhT\('jh_desk_waiting', \{ n: _jhFmt\(wn\) \}\)\), room - hw\);/);
  });
});
