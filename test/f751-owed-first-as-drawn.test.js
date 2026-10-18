'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f751 — FILL IN, "OWED FIRST", EVERY DRAWN PART (the owner's yes of 18 Oct
   2026 to build every gap between the picked drawing and HaTi; round 8,
   option 1 "Owed first")
   (1) Under an owed box, Our standard's value where one names the fact:
       "Our standard for termination: 90 days · Use it" — read off Our
       standards' own preferred wording through an explicit table of facts
       (stdValueFor), never guessed; a date, or a label naming no such fact,
       is offered nothing.
   (2) Each row says where it lands on the paper: the clause heading above
       the box's own spot (pdFillSpotClause).
   (3) The document's card counts the answers on the paper and not yet in the
       wording (tplFormPendingKeys) and carries Fill the document — the form's
       own button, pressed; the fold of answered rows holds on every row,
       written on the element; "N of M done · saved as you type".
   (4) The stream row, where the reader may not move it: "Moving a contract to
       another stream is an admin's act. · Ask an admin" — the Ask-an-admin
       record, by its one route (POST /api/settings-asks).
   AT THE PARENT (8dc306a) every test here FAILS.
   The browser half: test/chromium/owed-first-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const TL = R('js/views/templatelib.js');
const ST = R('js/views/settings.js');
const IX = R('index.html');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
/* the readings' own files, in the order js/app.js loads them */
function stdStage(lib){
  const ctx = { console, state: { settings: lib ? { clauseLibrary: lib } : {} } };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['js/clausemodel.js', 'js/precedent.js', 'js/standards.js']) vm.runInContext(R(f), ctx, { filename: f });
  ctx.clauseLibrary = () => (lib || [
    { id: 'cl-pay', category: 'Payment terms', preferred: 'The Buyer shall pay each undisputed invoice within thirty (30) days of receipt.' },
    { id: 'cl-liab', category: 'Liability cap', preferred: 'Liability is capped at the fees paid in the twelve (12) months preceding the claim.' },
    { id: 'cl-conf', category: 'Confidentiality', preferred: 'Each party keeps the other’s information secret for the term and three (3) years after.' },
    { id: 'cl-term', category: 'Termination', preferred: 'Either party may terminate for material breach not remedied within thirty (30) days of notice, or for convenience on ninety (90) days’ written notice.' },
    { id: 'cl-law', category: 'Governing law', preferred: 'The law of Sweden governs.' }]);
  return ctx;
}

describe('f751 (1) Our standard, where one names the fact', () => {
  const ctx = stdStage();
  test('1a a notice period reads the notice figure off the termination standard — never its cure period', () => {
    const v = ctx.stdValueFor('Notice period');
    assert.deepEqual(JSON.parse(JSON.stringify(v)), { figure: 90, unit: 'days', category: 'Termination', clause: 'cl-term' });
  });
  test('1b payment terms, a liability cap, a confidentiality period', () => {
    assert.equal(ctx.stdValueFor('Payment terms (days)').figure, 30);
    assert.equal(ctx.stdValueFor('Liability cap').unit, 'months');
    assert.equal(ctx.stdValueFor('Confidentiality period').figure, 3);
  });
  test('1c a date, a label naming no such fact, or a standard with no figure: nothing is offered', () => {
    for (const l of ['Start date', 'Notice date', 'Secret until', 'Routes', 'Carrier address', 'Governing law', '', null]) assert.equal(ctx.stdValueFor(l), null, String(l));
  });
  test('1d the workspace\'s own standard is the one read', () => {
    const own = stdStage([{ id: 'x1', category: 'Termination', preferred: 'Either party may end it for convenience on sixty (60) days’ written notice.' }]);
    assert.equal(own.stdValueFor('Notice period').figure, 60);
  });
  test('1e drawn under an owed box, empty, with Use it putting it in the box the way typing does', () => {
    assert.match(PD, /const std = r\.getAttribute\('data-pd-owed'\) === '1' \? pdFillStdOf\(r\) : null;/);
    assert.match(PD, /_pdT\('pd_ff_std', \{ what: std\.category\.toLowerCase\(\), value: std\.said \}\)/);
    assert.match(PD, /box\.value = use\.getAttribute\('data-pd-ff-use'\);\n\s+box\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\); box\.dispatchEvent\(new Event\('change', \{ bubbles: true \}\)\);/);
  });
});

describe('f751 (2) where each row lands on the paper', () => {
  const dom = new JSDOM('<!doctype html><body><div id="ig-canvas"></div></body>', { runScripts: 'outside-only' });
  dom.window.eval(PD);
  const W = dom.window;
  const cv = W.document.getElementById('ig-canvas');
  test('2a the heading above the box\'s spot names its clause', () => {
    cv.innerHTML = '<div data-upwording><h1>FRAMEWORK</h1><h4>1. Scope</h4><p>x</p><h4>3. Term</h4><p>3.1 It starts on <span data-upblank="s">[Start date]</span>.</p></div>';
    assert.equal(W.pdFillSpotClause(cv.querySelector('[data-upblank]'), cv), '3');
  });
  test('2b a clause anchor\'s own heading; "Clause 12" and "§ 4" read alike', () => {
    cv.innerHTML = '<div data-anchor="a"><h4>Clause 12 Payment</h4><p><span data-sync="pay">30</span></p></div><h4>§ 4 Rates</h4><p><span data-field="r">x</span></p>';
    assert.equal(W.pdFillSpotClause(cv.querySelector('[data-sync]'), cv), '12');
    assert.equal(W.pdFillSpotClause(cv.querySelector('[data-field]'), cv), '4');
  });
  test('2c no numbered heading above it: nothing is said', () => {
    cv.innerHTML = '<p>The Carrier is <span data-field-key="c">x</span>.</p>';
    assert.equal(W.pdFillSpotClause(cv.querySelector('span'), cv), '');
  });
  test('2d drawn at the row\'s head; the row being typed in says "on the paper"', () => {
    assert.match(PD, /<span class="pd-ff-on">\$\{_pdE\(_pdT\('pd_ff_on_paper'\)\)\} · <\/span>\$\{_pdE\(_pdT\('pd_ff_at', \{ n: at\.n \}\)\)\}/);
    assert.match(IX, /#pd-fillface \[data-pd-owed\]:focus-within > \.pd-ff-at \.pd-ff-on\{display:inline\}/);
  });
});

describe('f751 (3) the document\'s card, the fold, the count line', () => {
  const body = name => { const i = TL.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return TL.slice(i, TL.indexOf('\nfunction ', i + 9)); };
  const ctx = { JSON, Map, Set, String, window: {} };
  ctx.window.templateFormDocHtml = f => 'DOC:' + JSON.stringify(f.values || {});
  vm.createContext(ctx);
  vm.runInContext([body('tplFormSig'), body('tplFormLocked'), body('tplFormPending'), body('tplFormPendingKeys')].join('\n') + '\nthis.templateFormDocHtml = window.templateFormDocHtml;', ctx);
  test('3a the answers that moved since the wording was filled, counted', () => {
    const c = { status: 'Draft', redlineText: 'DOC:{}', templateForm: { values: { carrier: 'Baltic', route: 'SE-FI', lane: 'Road' }, filledSig: JSON.stringify([]) } };
    assert.deepEqual([...ctx.tplFormPendingKeys(c)].sort(), ['carrier', 'lane', 'route']);
    c.templateForm.filledSig = JSON.stringify([['carrier', 'Baltic'], ['lane', 'Sea'], ['route', 'SE-FI']]);
    assert.deepEqual([...ctx.tplFormPendingKeys(c)], ['lane']);
    c.redlineText = ctx.window.templateFormDocHtml(c.templateForm);
    assert.deepEqual([...ctx.tplFormPendingKeys(c)], [], 'the wording already carries them: nothing owed');
  });
  test('3b the card: its count and the form\'s own Fill the document, pressed — the one act', () => {
    assert.match(PD, /_pdTn\('pd_ff_doc_n', keys\.length, \{ n: keys\.length \}\)/);
    assert.match(PD, /const own = host\.querySelector\('#pd-fill \[data-tplf-fill\]'\); if \(own && !own\.disabled\) own\.click\(\);/);
    assert.match(IX, /#pd-fillface \.pd-ff-work #pd-fill \[data-tplf-fill\]\{display:none\}/);
  });
  test('3c the fold holds on every row: written on the element, the painter\'s own value kept to give back', () => {
    assert.match(PD, /if \(!r\.hasAttribute\('data-pd-disp'\)\) r\.setAttribute\('data-pd-disp', r\.style\.display \|\| ''\);/);
    assert.match(PD, /const want = \(shut && r\.getAttribute\('data-pd-owed'\) === '0'\) \? 'none' : r\.getAttribute\('data-pd-disp'\);/);
  });
  test('3d "5 of 8 done · saved as you type"', () => {
    assert.equal(BOOKS.en.pd_ff_saved, 'saved as you type');
    assert.match(PD, /\$\{_pdE\(_pdT\('det_n_of_m', \{ done, all: d\.all \}\)\)\} · \$\{_pdE\(_pdT\('pd_ff_saved'\)\)\}/);
  });
});

describe('f751 (4) the stream: the rule\'s own door', () => {
  test('4a "Moving a contract to another stream is an admin\'s act." with Ask an admin, or when and whom it was asked of', () => {
    assert.equal(BOOKS.en.pd_ff_stream_admin, 'Moving a contract to another stream is an admin’s act.');
    assert.match(PD, /stAskOpenFor\('refile:' \+ c\.id\)/);
    assert.match(PD, /data-pd-ff-ask>\$\{_pdE\(_pdT\('st_ask_go'\)\)\}<\/button>/);
  });
  test('4b sent by the Ask-an-admin record\'s one route, its reminders and bell as every ask', () => {
    const f = ST.slice(ST.indexOf('async function stAskDirect('), ST.indexOf('const stAskOpenFor='));
    assert.match(f, /await api\('settings-asks','POST',\{ what:words, why:'', panel:String\(panel\|\|''\) \}\);/);
    assert.match(f, /await stAsksLoad\(\);/);
    assert.match(PD, /await stAskDirect\(_pdT\('pd_ff_ask_words', \{ ref, name: String\(c\.name \|\| ''\)\.trim\(\) \}\)/);
  });
  test('4c the words, in both books', () => {
    for (const k of ['pd_ff_saved', 'pd_ff_doc_n_one', 'pd_ff_doc_n_other', 'pd_ff_std', 'pd_ff_use', 'pd_ff_u_days_one', 'pd_ff_u_days_other', 'pd_ff_u_months_one',
      'pd_ff_u_months_other', 'pd_ff_u_years_one', 'pd_ff_u_years_other', 'pd_ff_at', 'pd_ff_on_paper', 'pd_ff_stream_admin', 'pd_ff_ask_words'])
      for (const l of ['en', 'sv']) assert.ok(BOOKS[l][k], k + ' ' + l);
  });
});
