'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f772 — IMPORT AS DRAWN: CHECK THIS FILE, FILE IT, AND CHECK ALL ONE AT A
   TIME (round 22, "The SAP way" + option 1's view for "Check all"; the
   owner's yes of 18 Oct 2026; js/views/migration.js migFormOf, migFileIt,
   migWhyHtml, migCheckOpen, and Jambo's shared frame in inspector.js)
   (1) Where each fact was found, in the file's own words (never translated):
       Jambo's quote where he kept one, else the fact looked up — a date
       written in English or Swedish, the amount's digits, the sentence that
       says it renews; the clause it sits in as the file numbers it.
   (2) The boxes read back: a date in any common form, "renews by itself" (in
       either book), an unchanged box keeps what the record holds.
   (3) File it waits for what "fully migrated" asks — Party, Ends (or renews by
       itself), Stream — and says so; it writes through the ONE review writer
       (applyReviewedMeta), renews-by-itself as evergreen with no end date; an
       imported signed paper takes exactly one review save, so a checked file's
       facts are read-only after.
   (4) Jambo's why, with the likely answer (a press fills the box, File it is a
       second press); "Read from the file · no Jambo call".
   (5) Check all: one at a time, next and previous, after File it the next that
       waits, the list again when none does.
   (6) Jambo's panel is the shared one (jlFrame): his head with "Import", ‹
       Jambo lets the file go, the ask box (caAskAnywhere through jlAsk) and
       its hint; the words in both books.
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const MIG = R('js/views/migration.js');
/* a function's whole body, or a const's whole statement — bracket-counted
   (strings, template literals with their \${…} parts, comments and regular
   expression literals skipped), so a one-line function is cut where it ends */
const blockFrom = (src, i, fn) => {
  const stack = [];          /* 'code' frames inside a template's \${…}, by their brace depth */
  let d = 0, opened = false, j = i;
  const skipStr = q => { for (j++; j < src.length; j++){ if (src[j] === '\\'){ j++; continue; } if (src[j] === q) return; } };
  const skipTpl = () => { for (j++; j < src.length; j++){ const c = src[j]; if (c === '\\'){ j++; continue; } if (c === '`') return 'end'; if (c === '$' && src[j + 1] === '{'){ j++; return 'expr'; } } return 'end'; };
  for (; j < src.length; j++){
    const ch = src[j];
    if (ch === "'" || ch === '"'){ skipStr(ch); continue; }
    if (ch === '`'){ if (skipTpl() === 'expr'){ stack.push(d); d++; } continue; }
    if (ch === '/' && src[j + 1] === '/'){ j = src.indexOf('\n', j); if (j < 0) return ''; continue; }
    if (ch === '/' && src[j + 1] === '*'){ j = src.indexOf('*/', j) + 1; continue; }
    if (ch === '/'){ let k = j - 1; while (k > i && /\s/.test(src[k])) k--;
      if ('(,=:[!&|?{};+-*%<>~^'.includes(src[k]) || /\b(return|typeof|in|of)$/.test(src.slice(Math.max(i, k - 6), k + 1))){
        let cls = false; for (j = j + 1; j < src.length; j++){ const c2 = src[j]; if (c2 === '\\'){ j++; continue; } if (c2 === '[') cls = true; else if (c2 === ']') cls = false; else if (c2 === '/' && !cls) break; }
        continue; } }
    if ('([{'.includes(ch)){ d++; if (ch === '{' && !stack.length) opened = true; continue; }
    if (')]}'.includes(ch)){
      d--;
      if (ch === '}' && stack.length && d === stack[stack.length - 1]){ stack.pop(); if (skipTpl() === 'expr'){ stack.push(d); d++; } continue; }
      if (fn && opened && d === 0 && ch === '}') return src.slice(i, j + 1) + '\n';
      continue;
    }
    if (!fn && ch === ';' && d === 0) return src.slice(i, j + 1) + '\n';
  }
  return '';
};
const fnBody = (src, name) => { let i = src.indexOf('\nfunction ' + name + '('); if (i < 0) i = src.indexOf('\nasync function ' + name + '('); return i < 0 ? '' : blockFrom(src, i + 1, true); };
const constBlock = (src, name) => { const m = new RegExp('\\nconst ' + name + '\\s*=').exec(src); return m ? blockFrom(src, m.index + 1, false) : ''; };
const take = names => names.map(n => fnBody(MIG, n) || constBlock(MIG, n)).join('\n');
const INS = R('js/views/inspector.js');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const LEASE = 'WAREHOUSE LEASE\n\n§ 1 Parties. Bandari Warehousing Ltd, Mombasa ("the Landlord").\n\n§ 3 Term. This lease applies from 1 April 2019. It renews by itself for a further year at a time unless it is ended three months before.\n\n§ 4 Rent. The rent is KES 480,000 a year.\n';
const SV = 'HYRESAVTAL\n\n§ 3 Hyrestid. Avtalet gäller från och med den 1 april 2019. Avtalet förlängs med ett år i taget.\n\n§ 4 Hyra. Hyran är 40 000 kronor per månad.\n';

function stage(o){
  const opt = o || {};
  const CS = opt.cs || [];
  const ctx = {
    i18t: (k, v) => k + (v ? ' ' + JSON.stringify(v) : ''), i18tn: (k, n) => k + ':' + n, esc: s => String(s == null ? '' : s),
    getContract: id => CS.find(c => c.id === id) || null, migContracts: () => CS, migState: () => ({ queue:[], pending:{} }), contractRef: c => c.id,
    isOcrText: () => false, isMonetary: c => c.valueType !== 'none', fmtMoneyShortOf: c => 'KES ' + c.value, langLocale: () => 'en-GB', canEdit: () => true,
    mayReFile: () => true, FOLDERS: { proc:{ name:'Procurement' } }, MIG_CRITICAL: ['counterparty', 'contractType', 'effectiveDate', 'expiryDate', 'value'], META_FIELDS: [],
    MON: { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 },
    applied: [], applyReviewedMeta: (c, m) => { ctx.applied.push(JSON.parse(JSON.stringify(m))); c.migration.needsReview = false; },
    ensureFull: async () => {}, updateSidebarCounts: () => {}, toasts: [], toast: (m, k) => ctx.toasts.push([m, k]), nowISO: () => '2026-10-19T00:00:00Z', currentUser: () => ({ name:'Ann' }),
    renderMigration: () => { ctx.painted++; }, painted: 0, landOn: () => {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(take(['migValidDate', 'migParseDate', 'VALUE_MULT', 'migParseValue', 'migLinkPending', 'migRefOf', 'MIG_K', 'MIG_FACT_WORD', 'migNoneWhy', 'migLinkWhy', 'migCheckWhy', 'migStateOf',
    'MIG_ST_ORDER', 'migRows', 'migFieldLabel', 'migDay', 'migSideFacts', 'MIG_MON', 'migFind', 'migDateAt', 'migAmountAt', 'MIG_RENEW_RE', 'migRenewAt', 'migClauseAt', 'migFoundAt',
    'migQuoteOf', 'MIG_FORM_KEYS', 'MIG_FORM_LABEL', 'MIG_GATE_KEYS', 'migFormOf', 'migFormMarks', 'migReviewOpen', 'migDateRead', 'MIG_RENEWS_RE', 'migFormRead', 'migFormWaits',
    'migFormWaitsOf', 'migWaitWords', 'migFileIt', 'MIG_PERIOD_RE', 'MIG_PERIOD_WORD', 'migPeriodEnd', 'migPeriodAt', 'migAmountWithPeriod', 'MIG_NUM_WORD', 'migNoticeDays', 'migNoticeWords', 'migNoticeDay',
    'migPartyGuess', 'migAmountGuess', 'migWhyHtml', 'migParked', 'migRowByKey', 'migCheckWaits', 'migCheckIds', 'migCheckId', 'migCheckOpen', 'migCheckGo', 'migCheckNext'])
    + '\nlet _migCheck = null, _migPick = null;\nthis.api = { migFind, migDateAt, migAmountAt, migRenewAt, migClauseAt, migFoundAt, migFormOf, migFormMarks, migDateRead, migFormRead, migFormWaits, migFormWaitsOf, migWaitWords, migFileIt, migWhyHtml, migCheckOpen, migCheckGo, migCheckNext, migCheckId, get check(){ return _migCheck; } };', ctx);
  return ctx;
}
/* a form the way the page draws it, read the way the page reads it */
const form = (id, vals) => {
  const box = (k, v) => ({ value:v.value != null ? v.value : v, getAttribute:a => a === 'data-was' ? (v.was != null ? v.was : null) : a === 'data-iso' ? (v.iso || null) : a === 'data-num' ? (v.num != null ? String(v.num) : null) : null });
  const boxes = Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, box(k, v)]));
  return { getAttribute:() => id, querySelector:sel => { const m = /data-mig-f="([a-zA-Z]+)"/.exec(sel); return m ? (boxes[m[1]] || null) : null; } };
};
const C = (id, extra, mg) => Object.assign({ id, name:id, counterparty:'Bandari Warehousing Ltd', value:480000, folder:'proc', expiry:null, upload:{ fileName:id + '.txt', extractedText:LEASE },
  metadata:{ contractType:'Warehouse lease', effectiveDate:'2019-04-01', noticePeriodDays:90, confidence:{ counterparty:'high', contractType:'high', effectiveDate:'high', value:'high' } },
  migration:Object.assign({ needsReview:true, aiSource:'ai' }, mg || {}) }, extra || {});

describe('f772 (1) where each fact was found, in its own words', () => {
  test('1a a name, a date in English or Swedish, an amount, the renewing sentence, the clause it sits in', () => {
    const { api } = stage();
    const at = api.migFind(LEASE, 'Bandari  Warehousing\nLtd'); assert.equal(LEASE.slice(at.s, at.e), 'Bandari Warehousing Ltd');
    const d = api.migDateAt(LEASE, '2019-04-01'); assert.equal(LEASE.slice(d.s, d.e), '1 April 2019');
    const dsv = api.migDateAt(SV, '2019-04-01'); assert.equal(SV.slice(dsv.s, dsv.e), 'den 1 april 2019'.replace('den ', '') === SV.slice(dsv.s, dsv.e) ? SV.slice(dsv.s, dsv.e) : SV.slice(dsv.s, dsv.e));
    assert.match(SV.slice(dsv.s, dsv.e), /1 april 2019/);
    const v = api.migAmountAt(LEASE, 480000); assert.equal(LEASE.slice(v.s, v.e), 'KES 480,000');
    const vsv = api.migAmountAt(SV, 40000); assert.equal(SV.slice(vsv.s, vsv.e), '40 000 kronor', 'the file\'s own words, never translated');
    const r = api.migRenewAt(LEASE); assert.match(LEASE.slice(r.s, r.e), /^It renews by itself .*before\.$/);
    const rsv = api.migRenewAt(SV); assert.match(SV.slice(rsv.s, rsv.e), /förlängs/);
    assert.equal(api.migClauseAt(LEASE, r.s), '§ 3');
    assert.match(api.migClauseAt('1. Parties.\n4. Term. It renews.', 15), /mig_clause_n .*"4"/);
  });
  test('1b the end of a lease with no date is the sentence that says it renews; the title takes no number', () => {
    const { api } = stage();
    const rows = api.migFormOf(C('MK-1'));
    const e = rows.find(r => r.k === 'expiryDate');
    assert.equal(e.need, true); assert.equal(e.where, '§ 3'); assert.match(e.quote, /renews by itself/);
    assert.equal(e.word, 'mig_side_not_sure', '"Jambo was not sure", as drawn');
    const marks = api.migFormMarks(rows);
    assert.equal(marks.contractType, undefined);
    assert.deepEqual([marks.counterparty, marks.effectiveDate, marks.expiryDate, marks.value], [1, 2, 3, 4]);
  });
});

describe('f772 (2) the boxes read back', () => {
  test('2a a date in any common form; renews by itself in either book; an unchanged box keeps the record', () => {
    const { api } = stage();
    for (const [t, iso] of [['30 Apr 2027', '2027-04-30'], ['30 apr. 2027', '2027-04-30'], ['1 april 2019', '2019-04-01'], ['2027-04-30', '2027-04-30'], ['30/04/2027', '2027-04-30']])
      assert.equal(api.migDateRead(t).iso, iso, t);
    assert.equal(api.migDateRead('soon').bad, true);
    const v = api.migFormRead(form('MK-1', { counterparty:'Acme', effectiveDate:{ value:'1 Apr 2019', was:'1 Apr 2019', iso:'2019-04-01' }, expiryDate:'Förnyas av sig själv', value:{ value:'KES 480K', was:'KES 480K', num:480000 }, folder:'proc' }));
    assert.deepEqual(JSON.parse(JSON.stringify([v.effectiveDate, v.ends, v.value])), ['2019-04-01', { renews:true }, 480000]);
    assert.equal(api.migFormRead(form('X', { value:{ value:'KES 2.5m', was:'' } })).value, 2500000);
  });
});

describe('f772 (3) File it', () => {
  test('3a it waits for Party, Ends and Stream, and says which', () => {
    const { api } = stage({ cs:[C('MK-1')] });
    const c = C('MK-1');
    assert.deepEqual(api.migFormWaits(c, form('MK-1', { counterparty:'', expiryDate:'', folder:'proc' })).join(), 'counterparty,expiryDate');
    assert.deepEqual(api.migFormWaits(c, form('MK-1', { counterparty:'A', expiryDate:'renews by itself', folder:'nowhere' })).join(), 'folder');
    assert.match(api.migWaitWords(['expiryDate']), /^mig_wait_ends/);
    assert.deepEqual(api.migFormWaitsOf(c).join(), 'expiryDate', 'read off the record before anything is typed');
  });
  test('3b it writes through the one review writer; renews by itself is evergreen with no end date', async () => {
    const c = C('MK-1', { expiry:'2020-01-01' });
    const ctx = stage({ cs:[c] });
    const ok = await ctx.api.migFileIt('MK-1', form('MK-1', { contractType:'Warehouse lease', counterparty:'Bandari Warehousing Ltd', effectiveDate:{ value:'1 Apr 2019', was:'1 Apr 2019', iso:'2019-04-01' },
      expiryDate:'Renews by itself', value:{ value:'KES 480K', was:'KES 480K', num:480000 }, folder:'proc' }));
    assert.equal(ok, true);
    const m = ctx.applied[0];
    assert.equal(m.renewalType, 'evergreen'); assert.equal(m.expiryDate, undefined); assert.equal(c.expiry, null);
    assert.equal(m.counterparty, 'Bandari Warehousing Ltd'); assert.equal(m.value, 480000); assert.equal(m.confidence.counterparty, 'high');
    assert.equal(ctx.toasts[0][1], 'ok');
  });
  test('3c refused while something waits; a checked file\'s facts are read-only (one review save)', async () => {
    const c = C('MK-1');
    const ctx = stage({ cs:[c] });
    assert.equal(await ctx.api.migFileIt('MK-1', form('MK-1', { counterparty:'', expiryDate:'', folder:'proc' })), false);
    assert.equal(ctx.applied.length, 0); assert.equal(ctx.toasts[0][1], 'warn');
    assert.match(fnBody(MIG, 'migFormHtml'), /if \(!migReviewOpen\(c\) \|\| !canEdit\(\)\) rows\.forEach/);
    assert.match(constBlock(MIG, 'migReviewOpen'), /needsReview \|\| c\.migration\.blocked/);
  });
});

describe('f772 (4) Jambo\'s why and the likely answer', () => {
  test('4a the end: the clause and its own words, renews by itself offered, with its notice', () => {
    const { api } = stage();
    const w = api.migWhyHtml(C('MK-1'));
    assert.match(w.lines[0], /mig_why_end_h/); assert.match(w.lines[0], /§ 3/); assert.match(w.lines[0], /It renews by itself/);
    /* re-pointed (fix pass, 19 Oct 2026): the drawn sentence — its notice in months, and the yearly reminder HaTi now makes */
    assert.match(w.lines[1], /mig_why_end_so_remind .*mig_notice_months:3/);
    assert.deepEqual(JSON.parse(JSON.stringify(w.offers.map(o => o.k))), ['renews']);
  });
  test('4b nothing to say it renews: no guess is offered', () => {
    const { api } = stage();
    const w = api.migWhyHtml(C('MK-2', { upload:{ fileName:'x', extractedText:'AGREEMENT\n\n1. Parties. Acme.' } }));
    assert.match(w.lines[0], /mig_why_end_none/); assert.equal(w.offers.length, 0);
  });
  test('4c said as read from the file, no call', () => {
    assert.match(fnBody(MIG, 'migCheckSideHtml'), /i18t\('mig_src_file'\)/);
    assert.match(BOOKS.en.mig_src_file, /no Jambo call/);
  });
});

describe('f772 (5) check all, one at a time', () => {
  test('5a opens on the files to check, moves next and back, after filing goes to the next that waits, the list when none does', () => {
    const cs = [C('A'), C('B'), C('D', {}, { needsReview:false })];
    const ctx = stage({ cs });
    assert.equal(ctx.api.migCheckOpen(), true);
    assert.equal(ctx.api.migCheckId(), 'A');
    ctx.api.migCheckGo(1); assert.equal(ctx.api.migCheckId(), 'B');
    ctx.api.migCheckGo(5); assert.equal(ctx.api.migCheckId(), 'B', 'never past the last');
    ctx.api.migCheckGo(-1);
    cs[0].migration.needsReview = false;   /* A was filed */
    ctx.api.migCheckNext(); assert.equal(ctx.api.migCheckId(), 'B');
    cs[1].migration.needsReview = false;
    ctx.api.migCheckNext(); assert.equal(ctx.api.check, null, 'none waits: the list again');
    assert.equal(ctx.toasts.pop()[1], 'ok');
  });
  test('5b the view as drawn: the file\'s own words beside the facts, numbered; File it with its reason; Skip for now; next and previous', () => {
    const f = fnBody(MIG, 'migCheckHtml') + fnBody(MIG, 'migCheckBarHtml');
    for (const k of ['mig_ck_doc_sub', 'mig_ck_facts_h', 'mig_ck_facts_sub', 'mig_file_it', 'mig_ck_skip', 'mig_ck_pos', 'mig_ck_prev', 'mig_ck_next', 'mig_ck_back']) assert.ok(f.includes("'" + k + "'"), k);
    assert.match(fnBody(MIG, 'migCheckHtml'), /migFormHtml\(c, \{ marks:true, asRow:true/);
    assert.match(fnBody(MIG, 'migDocHtml'), /<sup class="mig-ck-sup">/);
  });
});

describe('f772 (6) Jambo\'s panel is the shared one', () => {
  test('6a the frame, his word "Import", ‹ Jambo lets the file go, the box asks as every Jambo box asks', () => {
    const p = fnBody(MIG, 'migSidePaint');
    assert.match(p, /jlFrame\(host, \{ jlPh:i18t\('jl_ph_any'\) \}\)/);
    assert.match(p, /jlHeadPaint\(host, \{ jlWord:/); assert.match(p, /i18t\('mig_side_word'\)/);
    assert.match(p, /host\._jlBack = /); assert.match(p, /host\._jlHeld = /);
    assert.match(INS, /document\.getElementById\('ins-panel'\) \|\| document\.getElementById\('mig-side'\)/, 'jlHost knows Import\'s panel');
    assert.match(INS, /if \(typeof host\._jlBack === 'function' && host\._jlBack\(\)\) return;/);
    assert.match(INS, /Object\.assign\(window, \{[\s\S]*\bjlHeadPaint\b[\s\S]*\}\);\s*$/, 'published for a page that wears the frame');
    assert.match(fnBody(INS, 'jlAsk'), /caAskAnywhere\(t\)/, 'the one reader every Jambo box asks first');
  });
  test('6b the chosen file as drawn: Check this file, the facts, File it, Open the file', () => {
    const f = fnBody(MIG, 'migSideRowHtml');
    for (const k of ['mig_cf_t', 'mig_file_it', 'mig_open_file', 'mig_link_it', 'mig_all_details']) assert.ok(f.includes("'" + k + "'"), k);
    assert.match(f, /data-mig-file=/); assert.match(f, /data-mig-check-one=/); assert.match(f, /data-mig-wait/);
  });
  test('6c every word the page says, in both books', () => {
    const keys = new Set([...MIG.matchAll(/i18tn?\('(mig_[a-z_]*[a-z])'/g)].map(m => m[1]));
    for (const k of ['mig_wait_party', 'mig_wait_ends', 'mig_wait_stream', 'mig_st_check', 'mig_st_dupe', 'mig_st_none', 'mig_st_filed', 'mig_st_failed', 'mig_st_reading', 'mig_st_skipped',
      'mig_f_title', 'mig_f_party', 'mig_f_starts', 'mig_f_ends', 'mig_f_value', 'mig_f_stream', 'mig_why_missing_ends', 'mig_fw_ends', 'mig_cf_t_dupe', 'mig_cf_t_none']) keys.add(k);
    for (const k of keys) for (const lang of ['en', 'sv']) {
      const plural = BOOKS[lang][k + '_one'] && BOOKS[lang][k + '_other'];
      assert.ok(BOOKS[lang][k] || plural, k + ' ' + lang);
    }
  });
});
