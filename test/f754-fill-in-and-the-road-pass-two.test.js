'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f754 — FILL IN AND BEFORE YOU SIGN: THE SECOND PASS OF GAPS (the checker's
   list against the owner's picked drawings, rounds 8 "Owed first" and 10
   "The road"; 18 Oct 2026)
   ROUND 8
   (1) Our standard is named for the kind of contract whose book applies
       ("Our standard for freight: 6 months"); an owed box shows an example of
       its answer ("e.g. 1 November 2026", "e.g. 6 months", "A number").
   (2) The paper beside Fill in: an owed blank amber, an answer typed but not
       yet in the wording underlined; no "Fill from document" over the owed
       rows; no chips under the face.
   (3) An NDA's two facts in a card of their own ("Confidentiality · 2 to
       confirm"), each "read from clause N", its reading in a box, "Read from
       the wording, not yet confirmed by a person. · Confirm" — once confirmed
       "Confirmed by <who>"; Pay in a card of its own (Part · How often ·
       Amount, base pay "not filled in yet · needed before signing", Edit pay ›);
       a private stream's "Private · <stream>", "only the people named on
       <stream> see it", and Jambo waiting for a press, its cost said.
   ROUND 10
   (4) The pill counts only what somebody here can settle — another signer's
       turn is a wait ("Their turn"); Ready to sign names only the checks that
       came back clear, the rest "not clear yet".
   (5) Another signer's open stop carries that signer's own buttons and the
       column folds behind "Show"; on the receipt every stop is ticked, the yes
       read off the record ("Approved by Maria for Jonas, 19 Oct") and each
       signer with the day they signed.
   (6) The signing copy says so on the paper's line with its page arrows and
       size (nothing above the paper); "Sign here" only for whoever's turn it
       is; "Signing it their way" is the Menu tab's row, not a line on the face.
   AT THE PARENT (8dc306a) every test here FAILS.
   The browser halves: test/chromium/owed-first-as-drawn-verify.js and
   test/chromium/the-road-as-drawn-verify.js (their pass-two stages).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const CT = R('js/views/contract.js');
const CORE = R('js/core.js');
const IG = R('js/views/intelligence.js');
const IX = R('index.html');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): "((?:[^"\\]|\\.)*)",?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');
const T = (k, v) => fill(k in BOOKS.en ? BOOKS.en[k] : k, v);
const Tn = (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || BOOKS.en[k] || k, Object.assign({ n }, v));
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const J = x => JSON.parse(JSON.stringify(x));
const TODAY = '2026-10-19';          // the stage's own clock, never the day the test runs

/* the Fill in face's own file, in a document of its own */
function faceStage(extra = {}, tail = ''){
  const dom = new JSDOM('<!doctype html><body><div id="ig-canvas"></div><div id="pd-fillface"></div></body>', { runScripts: 'outside-only' });
  const W = dom.window;
  Object.assign(W, { i18t: T, i18tn: Tn, todayISO: () => TODAY, langLocale: () => 'en-GB' }, extra);
  /* the file's own `let`s live in this one evaluation: a face opened is set in it */
  W.eval(PD + '\n' + tail);
  return W;
}

describe('f754 (1) our standard, named for the kind; an example in an owed box', () => {
  test('1a the kind of contract whose book applies, in its own words; none named, the topic', () => {
    const W = faceStage({ playbookKeyFor: () => 'freight', resolvePlaybook: () => ({ label: 'Freight (road and sea)' }) });
    assert.equal(W.pdFillStdKind({ id: 'x' }), 'freight');
    const W2 = faceStage({ playbookKeyFor: () => '_default', resolvePlaybook: () => ({ label: 'All contracts (baseline)' }) });
    assert.equal(W2.pdFillStdKind({ id: 'x' }), 'all contracts');
    assert.match(PD, /const what = kind \|\| std\.category\.toLowerCase\(\);/);
  });
  /* RE-POINTED (the gaps' third pass, 18 Oct 2026; the owner's answer (5): "empty owed boxes stay
     empty with the amber wash — no 'e.g. …' example text") */
  test('1b an empty owed box stays empty: no example in it, the amber wash says it is owed', () => {
    const W = faceStage();
    assert.equal(typeof W.pdFillExample, 'undefined', 'no example writer');
    assert.doesNotMatch(PD, /pdFillExample|PD_FF_EG_/);
    for (const l of ['en', 'sv']) { assert.ok(!('pd_ff_eg' in BOOKS[l]), 'pd_ff_eg ' + l); assert.ok(!('pd_ff_eg_num' in BOOKS[l]), 'pd_ff_eg_num ' + l); }
  });
  test('1c a date face says "Pick a date" while empty — no caller\'s example (data-ph)', () => {
    assert.match(CORE, /\$\{\(w\|\|i18t\('dp_pick'\)\)\.replace/);
    assert.doesNotMatch(CORE, /data-ph/);
    assert.match(CORE, /attributeFilter:\['disabled'\]/);
  });
});

describe('f754 (2) the paper beside Fill in; nothing over the rows; no chips', () => {
  test('2a an owed blank amber, an answer not yet in the wording underlined — and taken off when the face goes', () => {
    let up = true;
    const W = faceStage({ detailsOf: () => ({ live: true, all: 3, left: 2, items: [{ key: 'start', open: true }, { key: 'notice', open: true }, { key: 'carrier', open: false }] }),
      tplFormPendingKeys: () => ['route'], intel: { paper: { id: 'MK-0410' } }, getContract: () => ({ id: 'MK-0410' }), igHomePaperFace: () => true },
      "_pdFill = 'MK-0410'; _pdTab = 'copilot';");
    const cv = W.document.getElementById('ig-canvas');
    cv.innerHTML = '<span class="hati-field" data-field-key="start">Start date</span><span class="hati-field" data-field-key="lane">Lane</span><span class="hati-field-done" data-field-key="route">Sweden–Finland</span><span class="hati-field-done" data-field-key="carrier">Baltic</span>';
    const c = { id: 'MK-0410' };
    W.pdFillPaperMarks(c);
    const cls = k => cv.querySelector(`[data-field-key="${k}"]`).className;
    assert.match(cls('start'), /pd-ff-owe-mark/); assert.doesNotMatch(cls('lane'), /pd-ff-owe-mark/, 'not owed: not amber');
    assert.match(cls('route'), /pd-ff-pend/); assert.doesNotMatch(cls('carrier'), /pd-ff-pend/, 'in the wording already');
    /* RE-POINTED 20 Oct 2026 (the Legora way): the marks follow the Dossier's grid, not a face */
    W.pdSetTab('oblig'); W.pdFillPaperMarks(c);
    assert.ok(!cv.querySelector('.pd-ff-owe-mark, .pd-ff-pend'), 'another tab, the marks go'); up = !up;
    assert.match(IX, /#ig-canvas \.hati-field\.pd-ff-owe-mark:not\(\.is-fieldlit\)\{background:var\(--st-amber-bg\);color:var\(--st-amber-fg\)\}/);
    assert.match(IX, /#ig-canvas \.pd-ff-pend\{text-decoration:underline dotted var\(--accent-ink\)/);
    assert.match(PD, /try \{ pdFillPaperMarks\(c \|\| pdContract\(\)\); \} catch \(_\)\{\}/, 'after every paint of the paper');
  });
  test('2b no "Fill from document" over the owed rows; no chips under Fill in or Before you sign', () => {
    assert.match(IX, /#pd-fillface \.pd-ff-work #det-basics \.det-card-h\{display:none\}/);
    assert.match(PD, /function pdChipsQuiet\(\)\{ return !!\(pdFillShows\(\) \|\| pdSignShows\(\)\); \}/);
    assert.match(PD, /if \(pdChipsQuiet\(\)\)\{ chips\.querySelectorAll\('button'\)\.forEach\(b => b\.remove\(\)\); return; \}/);
    assert.match(IG, /\(window\.pdChipsQuiet&&pdChipsQuiet\(\)\)\?'':/);
  });
});

describe('f754 (3) an NDA\'s facts, pay, a private stream', () => {
  test('3a the NDA\'s card: its heading counts what is left to confirm; its rows read as drawn (detNdaRows)', () => {
    const g = strip(PD.slice(PD.indexOf('function pdFillGroupsPaint('), PD.indexOf('/* ---- UNDER AN OWED BOX')));
    assert.match(g, /_pdTn\('pd_ff_nda_n', ndaOpen, \{ n: ndaOpen \}\)/);
    assert.match(g, /const leftHere = Math\.max\(0, \(d\.left \|\| 0\) - ndaOpen - payOwed\);/, 'Still to fill counts the rest');
    const r = strip(CT.slice(CT.indexOf('function detNdaRows('), CT.indexOf("document.addEventListener('click',e=>{\n  const b=e.target&&e.target.closest&&e.target.closest('[data-det-nda]')")));
    assert.match(r, /i18t\('det_nda_read_clause', \{ n: N\.clause \}\)/);
    assert.match(r, /<span class="det-nda-read det-nda-box">\$\{read\}<\/span><span class="det-nda-line">/);
    assert.match(r, /N\.who \? i18t\('nda_confirmed_by', \{ who: N\.who \}\)/);
    assert.match(r, /det_nda_span_end/, 'no date to count from: the wording\'s own span');
    assert.equal(T('det_nda_not_conf'), 'Read from the wording, not yet confirmed by a person.');
    assert.equal(Tn('pd_ff_nda_n', 2, { n: 2 }), '2 to confirm');
  });
  test('3b pay: its own card — Part · How often · Amount, base pay owed said, Edit pay ›', () => {
    const W = faceStage({ fxIsPay: () => true, canViewValues: () => true, bsPayEvery: k => ({ month: 'Monthly', year: 'Yearly' }[k] || ''), bsPayMoney: (c, n) => 'SEK ' + n,
      bsPayMay: () => true, payEditOpen: () => true,
      payPartsOf: () => [{ kind: 'part', label: 'Bonus', every: 'year', amount: null, words: 'up to 30 % of base pay' }] });
    const h = W.pdFillPayHtml({ id: 'MK-0399', pay: { every: 'month' } }, true);
    const box = W.document.createElement('div'); box.innerHTML = h;
    assert.equal(box.querySelector('h4').textContent, 'Pay');
    assert.match(box.textContent, /kept apart from deal value · never added to a total/);
    assert.deepEqual([...box.querySelectorAll('th')].map(x => x.textContent), ['Part', 'How often', 'Amount']);
    const rows = [...box.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => td.textContent));
    assert.deepEqual(rows, [['Base pay', 'Monthly', 'not filled in yet · needed before signing'], ['Bonus', 'Yearly', 'up to 30 % of base pay']]);
    assert.equal(box.querySelector('[data-pd-ff-pay-edit]').textContent, 'Edit pay ›');
    /* RE-POINTED (the gaps' third pass): owed is the house's amber pill with its dot, as drawn */
    assert.ok(box.querySelector('tbody tr.is-base .pd-pill.is-warn > i'), 'base pay owed: an amber pill with a dot');
    assert.equal(W.pdFillPayHtml({ id: 'x' }, false).includes('pd-pill'), false, 'not owed: not said owed');
    assert.equal(faceStage({ fxIsPay: () => false }).pdFillPayHtml({ id: 'x' }, true), '', 'not pay: no card');
  });
  /* RE-POINTED (the gaps' third pass; the owner's answer (4): costs stay in Jambo calls, never money) */
  test('3c a private stream says so, and Jambo waits for a press with its cost', () => {
    const W = faceStage({ streamIsPrivate: f => f === 'board', FOLDERS: { board: { name: 'Board' } }, canEdit: () => true,
      bsReadWait: () => ({ stale: false }), aiCostWords: (k, fb) => 'about SEK 1', jamboFaceHtml: () => '<img class="pd-ff-wait-face">' });
    const box = W.document.createElement('div');
    box.innerHTML = W.pdFillPrivateHtml({ id: 'MK-0399', folder: 'board' });
    assert.equal(box.textContent.trim(), 'Private · Board only the people named on Board see it');
    assert.equal(W.pdFillPrivateHtml({ id: 'x', folder: 'sales' }), '');
    box.innerHTML = W.pdFillWaitHtml({ id: 'MK-0399', folder: 'board' });
    assert.equal(box.textContent.replace(/\s+/g, ' ').trim(), 'Jambo reads a private stream’s contract only when someone presses. Read it now · about three Jambo calls');
    assert.ok(box.querySelector('.pd-ff-wait-face'), 'Jambo\'s small face beside it, as drawn');
    assert.equal(box.querySelector('[data-pd-ff-read]').getAttribute('data-pd-ff-read'), 'MK-0399');
    assert.match(PD, /if \(typeof bsGo === 'function'\)\{ bsGo\('read', rd\.getAttribute\('data-pd-ff-read'\)\);/, 'the strip\'s own press');
  });
});

/* ---- ROUND 10: the road's own stage (f752's) ---- */
function stage({ holds = [], noted = [], rows = [], plan = [], me = { id: 'u-maria', name: 'Maria Lind', role: 'legal' }, sa = null, covering = [], signed = false, status = 'Under Review', approvals = [] } = {}){
  const c = { id: 'MK-0391', counterparty: 'Helio Energy AB', status, signerPlan: plan, signatures: signed ? [{ at: 'x' }] : [], signApprovals: approvals,
    obligations: [{ desc: 'Pay', status: 'open' }, { desc: 'Deliver', status: 'open' }] };
  const steps = () => { const by = new Map(); plan.slice().sort((a, b) => a.order - b.order).forEach(s => { const k = s.step || s.order; if (!by.has(k)) by.set(k, []); by.get(k).push(s); });
    return [...by.keys()].sort((a, b) => a - b).map((k, i) => ({ n: i + 1, rows: by.get(k) })); };
  const ctx = {
    i18t: T, i18tn: Tn,
    signReadiness: () => ({ holds, noted, rows }), signSteps: steps,
    signStepNow: () => { const st = steps().find(x => !x.rows.every(r => r.signed)); return st ? st.n : 0; },
    nextSigner: () => plan.slice().sort((a, b) => a.order - b.order).find(s => !s.signed) || null,
    currentUser: () => me, contractParty: () => 'Lindqvist & Co AB', negoExecuted: () => status === 'Signed',
    signApprovalStateOf: () => sa || { rows: [], ok: true, started: false, open: [] },
    saMayDecide: (req, u) => (String(req.approverId) === String(u.id) ? 'approver' : covering.some(x => String(x.userId) === String(req.approverId)) ? 'deputy' : null),
    saStarted: x => Array.isArray(x.signatures) && x.signatures.length > 0,
    signingLocked: () => signed, canEdit: () => true, openSignerPlanEditor: () => {}, todayISO: () => TODAY, langLocale: () => 'en-GB',
    fmtMoneyShortIn: (n, cur) => `${cur} ${(n / 1e6).toFixed(1)} M`, contractCurrency: () => 'SEK',
    awayByLabel: (by, f) => f && f.name ? `${by} for ${f.name}` : by,
    state: { away: { covering } }, setTimeout: () => 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(PD, ctx);
  return { ctx, c };
}
const PLAN = [{ id: 'a', party: 'counterparty', name: 'Henrik Dahl', order: 1 }, { id: 'b', party: 'internal', name: 'Jonas Berg', memberId: 'u-jonas', order: 2 }];

describe('f754 (4) the pill and Ready to sign say only what is so', () => {
  test('4a another signer\'s turn is a wait, never "to settle"', () => {
    const { ctx, c } = stage({ holds: [{ kind: 'signapproval' }, { kind: 'turn' }], plan: PLAN });
    assert.deepEqual(J(ctx.pdSignState(c)), { closed: false, holds: 1, waits: 1, noted: 0 });
    assert.match(ctx.pdSignPillHtml(c), /1 to settle/);
    const after = stage({ holds: [{ kind: 'turn' }], plan: PLAN });
    assert.match(after.ctx.pdSignPillHtml(after.c), />Their turn</, 'nothing of ours left: whose turn it is');
    const ours = stage({ holds: [{ kind: 'turn' }], plan: [{ id: 'b', party: 'internal', name: 'Jonas Berg', memberId: 'u-jonas', order: 1 }] });
    assert.match(ours.ctx.pdSignPillHtml(ours.c), />Jonas’s turn</, 'a colleague\'s turn: by first name');
  });
  test('4b clear only where the check came back clear; one the gate let through is "not clear yet"', () => {
    const { ctx, c } = stage({ plan: PLAN, noted: [{ kind: 'standards-read' }, { kind: 'brief' }] });
    assert.equal(ctx.pdRoadStops(c).stops[0].sub, '3 checks clear: wording, promises, details · not clear yet: standards, the brief');
    const all = stage({ plan: PLAN });
    assert.equal(all.ctx.pdRoadStops(all.c).stops[0].sub, '5 checks clear: wording, standards, promises, details, the brief');
  });
});

describe('f754 (5) another signer\'s stop, and the receipt', () => {
  test('5a their stop is the open one: the column folds behind Show, the stop marked for its own buttons', () => {
    const { ctx, c } = stage({ holds: [{ kind: 'turn' }], plan: PLAN });
    const R0 = J(ctx.pdRoadStops(c));
    assert.equal(R0.stops[R0.cur].k, 'step1');
    assert.equal(R0.theirAt, R0.cur); assert.equal(R0.fold, true);
    assert.deepEqual(R0.stops[R0.cur].ids, ['a']);
    assert.deepEqual(J(vm.runInContext('PD_RD_ROW_ACTS', ctx)), ['data-sp-send', 'data-sp-notify'], 'the signing order\'s own buttons');
    const f = strip(PD.slice(PD.indexOf('function pdRoadPaint('), PD.indexOf('function pdSignFaceHtml(')));
    assert.match(f, /const acts = i === R\.theirAt \? pdRoadTheirActs\(host, x\) : '';/);
  });
  test('5b the receipt: every stop ticked, the yes off the record, each signer\'s day', () => {
    const plan = [{ id: 'a', party: 'counterparty', name: 'Henrik Dahl', order: 1, signed: true, at: '2026-10-16T10:00:00Z' },
      { id: 'b', party: 'internal', name: 'Jonas Berg', memberId: 'u-jonas', order: 2, signed: true, at: '2026-10-17T10:00:00Z' }];
    const approvals = [{ id: 'sa1', key: 'u-jonas', status: 'approved', approverName: 'Jonas Berg', decidedBy: { name: 'Maria Lind' }, decidedAt: '2026-10-15T09:00:00Z', for: { id: 'u-jonas', name: 'Jonas Berg' } }];
    const { ctx, c } = stage({ plan, status: 'Signed', signed: true, approvals });
    const S = J(ctx.pdRoadStops(c).stops);
    assert.deepEqual(S.map(x => x.k), ['ready', 'yes', 'step1', 'step2', 'sealed']);
    assert.ok(S.every(x => x.done), 'every stop ticked');
    assert.equal(S[1].t, 'Jonas Berg’s yes');
    assert.equal(S[1].sub, 'Approved by Maria Lind for Jonas Berg, 15 Oct');
    assert.equal(S[2].sub, 'Henrik Dahl · signed 16 Oct'); assert.equal(S[3].sub, 'Jonas Berg · signed 17 Oct');
  });
  test('5c a withdrawn or replaced request is not the yes on the record', () => {
    const { ctx } = stage();
    assert.deepEqual(J(ctx.pdRoadYesGiven({ signApprovals: [{ key: 'k', status: 'approved', decidedAt: 'x' }, { key: 'k', status: 'withdrawn' }] })), []);
    assert.equal(ctx.pdRoadYesGiven({ signApprovals: [{ key: 'k', status: 'refused', decidedAt: 'x' }, { key: 'k', status: 'approved', decidedAt: 'y' }] }).length, 1);
  });
});

describe('f754 (6) the signing copy on the line; Sign here; signing their way', () => {
  test('6a "Signing copy" with its page arrows and size on the paper\'s line — nothing above the paper', () => {
    assert.match(strip(IG.slice(IG.indexOf('function igStripHtml('), IG.indexOf('function igStripHtml(') + 9000)), /up&&onHome&&igSignOn\(c\)\?igSignCopyHtml\(c\):''/);
    const s = strip(IG.slice(IG.indexOf('function igSignCopyHtml('), IG.indexOf('function igApplyZoom(')));
    assert.match(s, /i18t\(sealed\?'sc_signed_copy':'sc_signing_copy'\)/);
    assert.match(s, /scControlsHtml\(c\)/);
    /* RE-POINTED (the gaps' third pass): no row above the signing copy, not even an empty one */
    assert.match(strip(IG.slice(IG.indexOf('function igZoomCornerHtml('), IG.indexOf('function igSignCopyHtml('))), /if\(igSignOn\(c\)\) return '';/); assert.doesNotMatch(IG, /IG_ZC_HOLD/);
    assert.match(IG, /closest\('#ig-strip \[data-ig-sc\] \[data-sc-zoom\], #ig-strip \[data-ig-sc\] \[data-sc-page\]'\)/, 'one listener for the line\'s controls');
  });
  test('6b "Sign here" only for whoever\'s turn it is', () => {
    assert.match(PD, /if \(!sealed && pdSignMine\(c\) && typeof pagesSignFlags === 'function'\) try \{ pagesSignFlags\(cv, 0\); \} catch \(_\)\{\}/);
  });
  test('6c "Signing it their way" is the Menu tab\'s row; the face draws no line for it', () => {
    assert.match(CT, /rows\.push\(`<button type="button" id="ws-m-their-way" title="\$\{esc\(i18t\('ho_they_sign_q'\)\)\}">/);
    assert.match(CT, /document\.getElementById\('ws-m-their-way'\)\?\.addEventListener\('click',\(\)=>\{ if\(window\.outsideSetRoute\) outsideSetRoute\(getContract\(c\.id\)\|\|c,'outside'\); \}\);/);
    assert.match(PD, /const paperRoute = foot\.querySelector\('#sign-paper'\); if \(paperRoute\) paperRoute\.style\.display = 'none';/);
    for (const l of ['en', 'sv']) assert.ok(BOOKS[l].ho_menu_their_way, 'ho_menu_their_way ' + l);
  });
});

describe('f754 (7) the words, in both books', () => {
  test('7a every new key in English and Svenska', () => {
    for (const k of ['pd_ff_nda', 'pd_ff_nda_n_one', 'pd_ff_nda_n_other', 'pd_ff_pay_owed', 'pd_ff_private', 'pd_ff_private_who', 'pd_ff_wait',
      'det_nda_read_clause', 'det_nda_not_conf', 'det_nda_set_line', 'det_nda_span_end', 'det_nda_span_start', 'det_nda_span_disclosure',
      'pd_rd_checks_clear_one', 'pd_rd_checks_unclear', 'pd_rd_signed_on', 'pd_sf_waits_on', 'pd_sf_waits_theirs', 'ho_menu_their_way', 'pd_ff_wait_cost'])
      for (const l of ['en', 'sv']) assert.ok(BOOKS[l][k], k + ' ' + l);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   THE THIRD PASS (the checker's second list, 18 Oct 2026; main brought in)
   ROUND 8
   (8) The NDA's facts carry its own editor's names ("Secret until"), and
       "· Confirm" stays on its sentence's line; base pay owed is an amber pill
       with its dot; a private contract's wait line stands straight under Pay
       with Jambo's small face; no perch beside Fill in and Before you sign
       (Chambers, 20 Oct 2026, removed the perch and the row it was given);
       Fill in's size stands on the paper's line, nothing above the sheet; the
       "clause N" door lands on the paper's spot through the one lander.
   ROUND 10
   (9) Each yes at its own stop — a rule's approval beside a named person's
       yes, with its states and its own buttons; the number on Ready to sign
       matches what it names; a rule's step nobody approved is off the road once
       signing has begun; the receipt says "obligations" and draws the record
       once; the link check reads the rule chain (window.approvalState), so a
       given yes opens the other signer's link; Open obligations lands through
       the one lander; beside the signing copy the name stays whole.
   AT THE PARENT (8dc306a) every test below FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
describe('f754 (8) Fill in, the third pass', () => {
  test('8a the NDA\'s facts by its own editor\'s names: "Who keeps it secret" · "Secret until"', () => {
    const r = strip(CT.slice(CT.indexOf("if(typeof ndaIs === 'function' && ndaIs(c)){"), CT.indexOf('const asked = new Set(DET_RECORD_KEYS);')));
    assert.match(r, /add\(recSec, 'ndaDir', i18t\('nda_f_dir'\)/);
    assert.match(r, /add\(recSec, 'ndaEnds', i18t\('nda_f_ends'\)/);
    assert.equal(T('nda_f_ends'), 'Secret until'); assert.equal(BOOKS.sv.nda_f_ends, 'Hemligt till');
  });
  test('8b "· Confirm" is held to the sentence\'s last word, never on a line of its own', () => {
    const r = strip(CT.slice(CT.indexOf('function detNdaRows('), CT.indexOf('function detPaintBasics(')));
    assert.match(r, /const words = String\(line\)\.split\(' '\), last = words\.pop\(\);/);
    assert.match(r, /<span class="det-nda-tail">\$\{esc\(last\)\}\$\{door\}<\/span>/);
    assert.match(IX, /\.det-nda-tail\{white-space:nowrap\}/);
  });
  test('8c base pay owed: the amber pill with its dot; the wait line under Pay with Jambo\'s face', () => {
    assert.match(strip(PD.slice(PD.indexOf('function pdFillPayHtml('), PD.indexOf('function pdFillWaitHtml('))), /\(base && owed\) \? pdPill\('warn', _pdT\('pd_ff_pay_owed'\)\)/);
    const face = PD.slice(PD.indexOf('function pdFillFaceHtml('), PD.indexOf('function pdFillPrivateHtml('));
    assert.ok(face.indexOf('data-pd-ff-pay') < face.indexOf('data-pd-ff-wait'), 'the wait host after Pay\'s');
    assert.match(IX, /#pd-fillface \.pd-ff-work > \.pd-ff-wait\{order:3;/, 'among Pay\'s order, after it');
    assert.match(strip(PD.slice(PD.indexOf('function pdFillWaitHtml('), PD.indexOf('let _pdFillFolded'))), /jamboFaceHtml\('hello', 22, 'pd-ff-wait-face'\)/);
  });
  /* RE-POINTED 20 Oct 2026 (Chambers: the perch is gone, reversing "JAMBO,
     ALIVE"): beside Fill in and Before you sign no bird perches at all, so
     nothing can cover the chips and no row is reserved for him. */
  test('8d no perch beside Fill in and Before you sign — Jambo covers nothing', () => {
    const css = strip(IX);
    assert.doesNotMatch(css, /\.jb-perch|jb-perched/, 'no perch rule left in the sheet');
    assert.doesNotMatch(css, /#ig-dock\.jb-perched:has\(#pd-fillface, #pd-signface\)/, 'no row reserved for a perch');
    for (const f of ['js/components.js', 'js/views/intelligence.js', 'js/paperdesk.js'])
      assert.doesNotMatch(strip(R(f)), /jamboPerchMount|jamboHop|jb-perch/, f + ' mounts no perch');
  });
  test('8e Fill in\'s size on the paper\'s line, nothing above the sheet while it is open', () => {
    assert.match(strip(IG.slice(IG.indexOf('function igStripHtml('), IG.indexOf('function igStripHtml(') + 9000)), /up&&onHome&&!igSignOn\(c\)&&window\.rlTypeStepHtml\?`<span class="ig-zc-line" data-ig-zc-line>\$\{rlTypeStepHtml\(\)\}<\/span>`:''/);
    assert.match(IX, /#ig-strip \.ig-zc-line\{display:none;flex:none\}/);
    assert.match(IX, /#ig-page:has\(#pd-fillface\) #ig-strip \.ig-zc-line\{display:inline-flex;align-items:center\}/);
    assert.match(IX, /#ig-page:has\(#pd-fillface\) #ig-paper-scroll > \.paper-zc-row\{display:none\}/);
  });
  test('8f "clause N" lands on the paper\'s spot through the one lander, the hand kept in the box', () => {
    const landed = [];
    const W = faceStage({ landOn: (t, o) => { landed.push([t, o]); return Promise.resolve(t); }, intel: { paper: { id: 'MK-0405' } }, igHomePaperFace: () => true,
      getContract: () => ({ id: 'MK-0405' }), contractFieldLight: () => { throw new Error('the typing echo is not a landing'); } }, "_pdFill = 'MK-0405'; _pdTab = 'copilot';");
    const doc = W.document, cv = doc.getElementById('ig-canvas'), host = doc.getElementById('pd-fillface');
    cv.innerHTML = '<span class="hati-field" data-upblank="up_notice">Notice period</span>';
    host.innerHTML = '<label data-pd-owed="1" data-cd-key="up_notice"><span>Notice period</span><button type="button" data-pd-ff-at>clause 3</button><input type="text"></label>';
    W.contractFieldPeer = (k, where) => where === 'paper' ? cv.querySelector('[data-upblank="up_notice"]') : null;
    W.pdFillWire(host);
    host.querySelector('[data-pd-ff-at]').dispatchEvent(new W.MouseEvent('click', { bubbles: true }));
    assert.equal(landed.length, 1); assert.equal(landed[0][0], cv.querySelector('[data-upblank]'));
    assert.deepEqual(J(landed[0][1]), { block: 'center', focus: false });
    assert.equal(doc.activeElement, host.querySelector('input'), 'the cursor stays in the box');
  });
});

/* the road's stage with a rule chain beside the named yes */
function ruleStage({ rule = { status: 'pending' }, decide = 'rule', sa = null, holds, signed = false, status = 'Under Review', me } = {}){
  const step = { ruleId: 'r-spend', name: 'Value ≥ KES 5M', approver: { kind: 'role', role: 'admin' }, status: rule.status, by: rule.by || null, at: rule.at || null, comment: rule.comment || null };
  const S = stage({ holds: holds || [{ kind: 'approval' }, { kind: 'signapproval' }, { kind: 'turn' }], plan: PLAN, sa, signed, status, me });
  Object.assign(S.ctx, {
    approvalState: () => ({ required: true, ok: rule.status === 'approved', chain: [step].concat(sa ? [{ sa: true, name: 'Lina Ek\'s contracts', status: 'pending' }] : []) }),
    approvalDecidableNow: () => (decide === 'rule' && rule.status === 'pending') ? { kind: 'rule', step } : null,
    approverLabelOf: a => a.role === 'admin' ? 'an Admin' : 'a ' + a.role, approverForOf: () => null,
  });
  S.c.value = 8100000;
  return S;
}
const SA_ROW = { status: 'pending', need: { key: 'k-jonas', approverId: 'u-jonas', approverName: 'Jonas Berg' }, req: { id: 'sa1', approverId: 'u-jonas', askedAt: '2026-10-19T08:00:00Z', askedBy: { id: 'u-lina', name: 'Lina Ek' }, shows: {} } };

describe('f754 (9) the road, the third pass', () => {
  test('9a each yes at its own stop: the rule\'s, then the named person\'s — the pill counts what the road shows', () => {
    const { ctx, c } = ruleStage({ sa: { rows: [SA_ROW], ok: false, started: false, open: [SA_ROW] } });
    const R0 = J(ctx.pdRoadStops(c));
    assert.deepEqual(R0.stops.map(x => x.k), ['ready', 'rule', 'yes', 'step1', 'step2', 'sealed']);
    assert.equal(R0.stops[1].t, 'An admin’s yes'); assert.equal(R0.stops[2].t, 'Jonas Berg’s yes');
    assert.equal(R0.cur, 1, 'the rule\'s yes is the open stop'); assert.ok(R0.stops[1].framed);
    assert.match(ctx.pdSignPillHtml(c), />2 to settle</);
    const open = R0.stops.filter(x => !x.done && ['rule', 'yes'].includes(x.k)).length;
    assert.equal(open, 2, 'two yeses wait, two stops say so');
  });
  test('9b the rule\'s card: its states, what it covers, Approve · Refuse… for whoever may decide it; one #sa-card', () => {
    const { ctx, c } = ruleStage({ sa: { rows: [SA_ROW], ok: false, started: false, open: [SA_ROW] } });
    const R0 = ctx.pdRoadStops(c);
    vm.runInContext('_pdRdId = false;', ctx);
    const h = ctx.pdRoadRuleHtml(c, R0.stops[1].rule);
    const dom = new JSDOM('<div id="x"></div>'); const box = dom.window.document.getElementById('x'); box.innerHTML = h;
    assert.deepEqual([...box.querySelectorAll('.pd-rd-st')].map(x => x.textContent), ['Waiting', 'Approved', 'Refused', 'Lapsed']);
    assert.equal(box.querySelector('.pd-rd-facts').textContent, 'The rule “Value ≥ KES 5M” asks an Admin for a yes. It covers the wording as it stands and SEK 8.1 M; a change undoes it.');
    assert.deepEqual([...box.querySelectorAll('[data-pd-rd-rule]')].map(b => b.textContent + ':' + b.getAttribute('data-pd-rd-rule')), ['Approve:approved', 'Refuse…:refused']);
    assert.equal(box.querySelector('.pd-rd-card').id, 'sa-card', 'the first yes in road order this reader may give');
    const y = ctx.pdRoadYesOf(c, SA_ROW);
    assert.doesNotMatch(ctx.pdRoadYesHtml(c, y), /id="sa-card"/, 'never a second #sa-card on the face');
    const f = strip(PD.slice(PD.indexOf('async function pdRoadPress('), PD.indexOf('function pdSignFacePaint(')));
    assert.match(f, /if \(!d \|\| d\.kind !== 'rule' \|\| typeof approvalDecideAsk !== 'function'\)/, 'the lists\' one door, only while it is theirs');
    assert.match(f, /await approvalDecideAsk\(c, b\.getAttribute\('data-pd-rd-rule'\) === 'approved' \? 'approved' : 'refused'\);/);
  });
  test('9c a reader who may not decide it sees who approves and the rule; a refused one is sent back through the column\'s own act', () => {
    const { ctx, c } = ruleStage({ decide: null, sa: { rows: [SA_ROW], ok: false, started: false, open: [SA_ROW] } });
    const R0 = J(ctx.pdRoadStops(c));
    assert.equal(R0.stops[1].sub, 'An Admin approves · Value ≥ KES 5M');
    const ref = ruleStage({ rule: { status: 'rejected', by: 'Amina Otieno', comment: 'Cap too high' }, holds: [{ kind: 'approval' }, { kind: 'turn' }] });
    const R1 = ref.ctx.pdRoadStops(ref.c);
    const h = ref.ctx.pdRoadRuleHtml(ref.c, R1.stops[1].rule);
    assert.match(h, /Amina Otieno refused it: “Cap too high”\./); assert.match(h, /data-pd-rd-resubmit>Change and send again</);
    assert.match(strip(PD.slice(PD.indexOf('async function pdRoadPress('), PD.indexOf('function pdSignFacePaint('))), /document\.querySelector\('#pd-signface #ap-resubmit'\)/);
  });
  test('9d the number on Ready to sign matches what it names', () => {
    const { ctx, c } = stage({ plan: PLAN, holds: [{ kind: 'standards-read' }, { kind: 'obligations' }, { kind: 'oblig-gaps' }, { kind: 'brief' }] });
    assert.equal(ctx.pdRoadStops(c).stops[0].sub, '4 to settle: standards, promises (2), the brief');
  });
  test('9e once signing has begun a rule\'s step nobody approved is off the road; one approved stays, with who and when', () => {
    const off = ruleStage({ holds: [], signed: true });
    assert.ok(!J(off.ctx.pdRoadStops(off.c)).stops.some(x => x.k === 'rule'));
    const on = ruleStage({ rule: { status: 'approved', by: 'Amina Otieno', at: '2026-10-15T09:00:00Z' }, holds: [], signed: true, status: 'Signed' });
    const st = J(on.ctx.pdRoadStops(on.c)).stops.find(x => x.k === 'rule');
    assert.ok(st && st.done); assert.equal(st.sub, 'Approved by Amina Otieno, 15 Oct');
  });
  test('9f the receipt says obligations, as drawn: "6 obligations, the first on 31 Jan 2027"', () => {
    assert.equal(Tn('pd_sf_next_n', 6, { when: '31 Jan 2027' }), '6 obligations, the first on 31 Jan 2027');
    assert.equal(T('pd_sf_next_none'), 'No obligations are recorded on this contract.');
    for (const k of Object.keys(BOOKS.en).filter(k => k.startsWith('pd_sf_next'))) assert.doesNotMatch(BOOKS.en[k], /\bdut(y|ies)\b/i, k);
  });
  test('9g the receipt draws who approved and who signed once: the column\'s own record folds away when sealed', () => {
    const f = strip(PD.slice(PD.indexOf('function pdRoadPaint('), PD.indexOf('function pdSignFaceHtml(')));
    assert.match(f, /const side = host\.querySelector\('#sign-side'\);\s*if \(side\)\{ const want = R\.closed \? 'none' : 'flex';/);
  });
  test('9h the link check reads the rule chain, so a given yes opens the other signer\'s link', () => {
    const f = strip(CORE.slice(CORE.indexOf('function linkRefusal('), CORE.indexOf('function linkRefusal(') + 6000));
    assert.match(f, /const ap=ask\(\(\)=>window\.approvalState&&window\.approvalState\(c\)\);/);
    assert.doesNotMatch(f, /&&approvalState\(c\)/, 'never the file\'s own legacy spend gate');
  });
  test('9i Open obligations lands on the contract\'s own obligations through the one lander', () => {
    const f = strip(PD.slice(PD.indexOf('function pdSignWire('), PD.indexOf('async function pdRoadPress(')));
    assert.match(f, /hbOpenView\(ob\.getAttribute\('data-pd-sf-oblig'\), 'oblig'\);\s*if \(typeof landOn === 'function'\) landOn\(\(\) => document\.querySelector\('#obw-one-host table, #obw-one-host \.obt, #obw-one-host'\), \{ block: 'start', focus: false \}\);/);
  });
  test('9j beside the signing copy the name stays whole: Notes and Share keep their word in their hover on a short line', () => {
    assert.match(IX, /#ig-strip\{container:igline \/ inline-size\}/);
    assert.match(IX, /@container igline \(max-width: 1000px\)\{\s*#ig-strip \.ig-sc ~ \.ig-acts :is\(\.ig-notes-w, \.ig-share-w\)\{display:none\}/);
    assert.match(IG, /<span class="ig-share-w">\$\{igEsc\(i18t\('ct_share'\)\)\}<\/span>/);
  });
});

describe('f754 (10) the third pass\'s words, in both books', () => {
  test('10a every new key in English and Svenska; the retired cost and example keys gone', () => {
    for (const k of ['pd_rd_ck_n', 'pd_rd_rule_sub', 'pd_rd_rule_facts', 'pd_rd_rule_refused', 'pd_rd_rule_refused_why', 'pd_rd_rule_lapsed', 'pd_ff_wait_cost'])
      for (const l of ['en', 'sv']) assert.ok(BOOKS[l][k], k + ' ' + l);
    for (const k of ['na_file_read_money', 'ai_cost_about', 'brn_p_callcost', 'brn_pd_callcost'])
      for (const l of ['en', 'sv']) assert.ok(!(k in BOOKS[l]), k + ' ' + l);
  });
});
