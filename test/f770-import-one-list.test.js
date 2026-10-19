'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f770 — IMPORT AS DRAWN: ONE LIST OF THE BATCH'S FILES (round 22 of the
   redesign, "The SAP way"; the owner's yes of 18 Oct 2026 to build every drawn
   part — js/views/migration.js migRows, migKpis, migShown)
   (1) Each file of the batch has ONE state, read once (migStateOf for the
       contracts the imports made, migQueueState for this sitting's files that
       did not become one): To check · Duplicate? · No readable text · Filed,
       and Reading / Not imported / Left out — each with its reason in words.
   (2) ONE list, the ones that need you first; a file that became a contract is
       listed once; the figures count that same list (Files = every row).
   (3) "9 of 24 shown · Show all 24": every row that needs you, then the rest
       up to nine — the cap said, never a silent trim; a figure's door shows
       its kind whole; Show all lifts the cap.
   (4) The figures are doors: pressed again, or an unknown word, all.
   (5) The table as drawn: File · what Jambo read · Stream · Value · Ends ·
       Done · State, a filed row's number opens its contract, rows carry no
       buttons (the panel holds the acts), no !important.
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   The browser half: test/chromium/import-as-drawn-verify.js.
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

function stage(o){
  const M = Object.assign({ queue:[], pending:{}, defaults:{ folder:'auto', status:'Signed' } }, (o && o.M) || {});
  const CS = (o && o.cs) || [];
  const ctx = {
    i18t: (k, v) => k + (v ? ' ' + JSON.stringify(v) : ''), i18tn: (k, n) => k + ':' + n,
    migState: () => M, migContracts: () => CS, getContract: id => CS.find(c => c.id === id) || null,
    contractRef: c => c.id, isOcrText: s => /^ocr/.test(String(s || '')), isMonetary: c => c.valueType !== 'none',
    fmtMoneyShortOf: c => 'KES ' + c.value, langLocale: () => 'en-GB', FOLDERS: { proc:{ name:'Procurement' }, corp:{ name:'Corporate' } },
    MIG_CRITICAL: ['counterparty', 'contractType', 'effectiveDate', 'expiryDate', 'value'], META_FIELDS: [],
    folderFromType: () => null, renderMigration: () => { ctx.painted++; }, painted: 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(take(['MIG_SHOWS', 'MIG_ROWS_SHOWN', 'MIG_ST_ORDER', 'MIG_NEEDS', 'migShowPass', 'migShowSet', 'migLinkPending', 'migRefOf', 'MIG_K', 'MIG_FACT_WORD',
    'migNoneWhy', 'migLinkWhy', 'migCheckWhy', 'migStateOf', 'MIG_DUP_WORD', 'migDupeWhy', 'migQueueState', 'migFolderFor', 'migRows', 'migRowByKey', 'migKpis',
    'migShown', 'migGates', 'migComplete', 'migFieldLabel', 'migDay', 'migSideFacts'])
    + '\nlet _migShow = "all", _migAll = false;\nthis.api = { migStateOf, migQueueState, migRows, migRowByKey, migKpis, migShown, migShowPass, migShowSet, get show(){ return _migShow; }, set all(v){ _migAll = v; }, get all(){ return _migAll; } };', ctx);
  return ctx;
}
const C = (id, mg, extra) => Object.assign({ id, name:id, counterparty:'Acme', value:5, folder:'proc', expiry:'2027-01-31', upload:{ fileName:id + '.pdf', fileHash:'h' + id },
  metadata:{ contractType:'Supply', effectiveDate:'2024-01-01', confidence:{} }, migration:Object.assign({ batch:'B-1', aiSource:'ai' }, mg || {}) }, extra || {});

describe('f770 (1) one state for each file, with its reason', () => {
  test('1a a contract the import made: no text, to check (with the first fact missing), a link to decide, being read, filed', () => {
    const { api } = stage();
    assert.equal(api.migStateOf(C('A', { blocked:'no-text' })).k, 'none');
    const miss = api.migStateOf(C('B', { needsReview:true }, { expiry:null }));
    assert.equal(miss.k, 'check'); assert.match(miss.why, /mig_why_missing_ends/);
    const link = api.migStateOf(C('C', {}, { linkSuggestions:[{ id:'MK-9' }] }));
    assert.equal(link.k, 'check'); assert.match(link.why, /mig_why_link .*MK-9/);
    assert.equal(api.migStateOf(C('D', { reading:'queued', needsReview:true })).k, 'reading');
    assert.equal(api.migStateOf(C('E', {})).k, 'filed');
    const rules = api.migStateOf(C('F', { needsReview:true, aiSource:'heuristic' }));
    assert.match(rules.why, /mig_why_rules/, 'read by HaTi\'s own rules is said');
  });
  test('1b a file of this sitting that did not become a contract', () => {
    const { api } = stage({ cs:[C('MK-4', {})] });
    const d = api.migQueueState({ status:'dupe', dupes:[{ id:'MK-4', kind:'text' }] });
    assert.equal(d.k, 'dupe'); assert.match(d.why, /mig_dup_text .*MK-4/);
    const x = api.migQueueState({ status:'duplicate', dupes:[{ id:'MK-4', kind:'exact' }] });
    assert.equal(x.k, 'skipped'); assert.match(x.why, /mig_dup_exact/); assert.match(x.why, /mig_dup_left/);
    assert.deepEqual([api.migQueueState({ status:'error', note:'empty file' }).k, api.migQueueState({ status:'error', note:'empty file' }).why], ['failed', 'empty file']);
    assert.equal(api.migQueueState({ status:'word' }).k, 'failed');
    assert.equal(api.migQueueState({ status:'cancelled' }).k, 'skipped');
    assert.match(api.migQueueState({ status:'waiting' }).why, /mig_why_waiting/);
  });
});

describe('f770 (2) one list, the ones that need you first', () => {
  test('2a needs-you first; a saved file is listed once (as its contract); the figures count the same list', () => {
    const cs = [C('MK-1', {}), C('MK-2', { needsReview:true }, { expiry:null }), C('MK-3', { blocked:'no-text' })];
    const M = { queue:[{ name:'MK-1.pdf', status:'saved', id:'MK-1' }, { name:'copy.pdf', status:'dupe', dupes:[{ id:'MK-1', kind:'near' }] }, { name:'old.doc', status:'word' }], pending:{} };
    const { api } = stage({ cs, M });
    const rows = api.migRows();
    assert.deepEqual(rows.map(r => r.st.k).join(), ['check', 'dupe', 'none', 'failed', 'filed'].join());
    assert.equal(rows.filter(r => r.c && r.c.id === 'MK-1').length, 1, 'the saved file is its contract, once');
    const k = api.migKpis();
    assert.deepEqual([k.files, k.filed, k.check, k.dupe, k.none], [5, 1, 1, 1, 1]);
    assert.equal(api.migRowByKey('q:1').st.k, 'dupe');
  });
});

describe('f770 (3) nine shown, the cap said', () => {
  test('3a everything that needs you, then the rest up to nine; a door shows its kind whole; Show all lifts the cap', () => {
    const cs = [];
    for (let i = 0; i < 4; i++) cs.push(C('N' + i, { needsReview:true }, { expiry:null }));
    for (let i = 0; i < 8; i++) cs.push(C('F' + i, {}));
    const { api } = stage({ cs });
    const rows = api.migRows();
    const s = api.migShown(rows);
    assert.equal(s.list.length, 9); assert.equal(s.of, 12);
    assert.equal(s.list.filter(r => r.st.k === 'check').length, 4, 'every row that needs you is shown');
    api.migShowSet('filed');
    assert.equal(api.migShown(rows).list.length, 8, 'a door shows its kind whole');
    api.migShowSet('filed'); api.all = true;
    assert.equal(api.migShown(rows).list.length, 12, 'Show all lifts the cap');
  });
  test('3b more rows need you than nine: none is hidden', () => {
    const cs = []; for (let i = 0; i < 12; i++) cs.push(C('N' + i, { needsReview:true }, { expiry:null }));
    const { api } = stage({ cs });
    assert.equal(api.migShown(api.migRows()).list.length, 12);
  });
});

describe('f770 (4) the figures are doors', () => {
  test('4a pressed again, or an unknown word, all — and the cap comes back', () => {
    const ctx = stage(); const { api } = ctx;
    api.migShowSet('check'); assert.equal(api.show, 'check');
    api.migShowSet('check'); assert.equal(api.show, 'all');
    api.all = true; api.migShowSet('nonsense'); assert.equal(api.show, 'all'); assert.equal(api.all, false);
    assert.equal(ctx.painted, 3);
    assert.equal(api.migShowPass({ st:{ k:'dupe' } }, 'dupe'), true);
    assert.equal(api.migShowPass({ st:{ k:'dupe' } }, 'none'), false);
  });
  test('4b the five figures, a zero is not a door', () => {
    const f = fnBody(MIG, 'migBandHtml');
    for (const k of ["fig('all', i18t('mig_k_files')", "fig('filed', i18t('mig_k_filed')", "fig('check', i18t('mig_k_check')", "fig('dupe', i18t('mig_k_dupe')", "fig('none', i18t('mig_no_text')"]) assert.ok(f.includes(k), k);
    assert.match(f, /const door = n > 0/);
  });
});

describe('f770 (5) the table as drawn', () => {
  test('5a its head, columns and foot', () => {
    const f = fnBody(MIG, 'migListHtml');
    for (const k of ['mig_list_sub', 'mig_sheet', 'mig_check_all', 'mig_col_file', 'mig_col_stream', 'mig_col_value', 'mig_col_ends', 'mig_col_done', 'mig_col_state', 'mig_shown_n', 'mig_show_all_n']) assert.ok(f.includes("'" + k + "'"), k);
    assert.match(f, /data-mig-all/);
  });
  test('5b a filed row\'s number opens its contract; a row carries no button; no !important', () => {
    assert.match(fnBody(MIG, 'migStateCell'), /class="mig-ref" data-open=/);
    assert.ok(!/<button/.test(fnBody(MIG, 'migRowHtml')), 'the panel holds the acts');
    assert.ok(!/!important/.test(MIG));
  });
});
