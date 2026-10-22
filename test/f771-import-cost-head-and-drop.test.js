'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f771 — IMPORT AS DRAWN: THE HEAD, THE COST IN CALLS, THE DROP STRIP AND A
   WHOLE FOLDER (round 22, "The SAP way"; the owner's yes of 18 Oct 2026;
   js/views/migration.js migHeadFacts, migCostLine, migConfirmEstimate,
   migFilesFromDrop)
   (1) The head says what the batch is: "Old contracts from <folder> · started
       Fri 16 Oct by you · 24 files" — the folder only where one was dropped,
       "you" only for the reader, the files counted from the one list.
   (2) What reading costs is said in Jambo CALLS, never money (the owner's
       answer of 18 Oct 2026): about one call a file, more for a scan read page
       by page; the onboarding allowance in files used.
   (3) You see the total before it starts: whenever Jambo will read, the total
       is asked first (reverses U-4's silent start on an open allowance — the
       drawing's own words); where HaTi's own rules read, nothing is asked.
   (4) A whole folder dropped is walked: its contracts are taken, anything else
       is left out and counted, and the folder names the batch.
   (5) The drop strip and its three labelled boxes as drawn; Choose files… in
       the head; the page head paints through PAGE_HEAD_PAINT and a refresh
       keeps the page's place (PLACE_PARTS).
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   RE-POINTED 21 Oct 2026 (Part 8, "every list page the Legora way", the
   owner's pick): the list head's box keeps its words across a refresh, so the
   kept place carries them too (q) beside the door, Show more, the chosen file
   and the check view.
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
const APP = R('js/app.js');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

function stage(o){
  const opt = o || {};
  const M = Object.assign({ queue:[], pending:{}, defaults:{ folder:'auto', status:'Signed' }, allowance:null }, opt.M || {});
  const CS = opt.cs || [];
  const ctx = {
    i18t: (k, v) => k + (v ? ' ' + JSON.stringify(v) : ''), i18tn: (k, n, v) => k + ':' + n + (v ? ' ' + JSON.stringify(v) : ''),
    migState: () => M, migContracts: () => CS, getContract: id => CS.find(c => c.id === id) || null,
    contractRef: c => c.id, isOcrText: () => false, isMonetary: () => true, langLocale: () => 'en-GB',
    currentUser: () => ({ name:'Ann Admin' }), API_MODE: () => opt.api !== false,
    state: { aiConfigured: opt.ai !== false, aiCfg: { limits:{} } }, MIG_MAX_FILES:25, MIG_CHARS_PER_PAGE:1800, MIG_BYTES_PER_PAGE:40000,
    MIG_CRITICAL: ['counterparty', 'contractType', 'effectiveDate', 'expiryDate', 'value'], META_FIELDS: [], FOLDERS: { proc:{ name:'Procurement' } },
    folderFromType: () => null, confirmDialog: async q => { ctx.asked.push(q); return true; }, asked: [],
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(take(['MIG_ST_ORDER', 'MIG_NEEDS', 'migLinkPending', 'migRefOf', 'MIG_K', 'MIG_FACT_WORD', 'migNoneWhy', 'migLinkWhy', 'migCheckWhy', 'migStateOf', 'MIG_DUP_WORD',
    'migDupeWhy', 'migQueueState', 'migRows', 'migFieldLabel', 'migDay', 'migSideFacts', 'migGuessPages', 'MIG_EST_FALLBACK', 'migAiRate', 'migEstimate', 'migCallsOf',
    'migAllowanceWords', 'migAllowanceLine', 'migConfirmEstimate', 'migCostLine', 'migDayWord', 'migHeadFacts', 'MIG_TAKE_RE', 'MIG_WALK_MAX', 'migFilesFromDrop', 'MIG_SHOWS', 'migPlace', 'migPlacePut'])
    + '\nlet _migShow = "all", _migAll = false, _migPick = null, _migCheck = null, _migQ = "";\nconst migCheckId = () => _migCheck ? (_migCheck.ids[_migCheck.i] || null) : null;'
    + '\nthis.api = { migCallsOf, migCostLine, migConfirmEstimate, migDayWord, migHeadFacts, migFilesFromDrop, migAllowanceWords, migAllowanceLine, migPlace, migPlacePut, get check(){ return _migCheck; } };', ctx);
  return ctx;
}
const C = (id, mg) => ({ id, name:id, counterparty:'Acme', value:5, folder:'proc', expiry:'2027-01-31', upload:{ fileName:id + '.pdf' }, metadata:{ contractType:'x', effectiveDate:'2024-01-01', confidence:{} },
  migration:Object.assign({ batch:'B-1', aiSource:'ai', importedAt:'2026-10-16T09:00:00Z', importedBy:'Ann Admin' }, mg || {}) });

describe('f771 (1) the head says what the batch is', () => {
  test('1a the folder it came from, the day, "you", the files', () => {
    const { api } = stage({ cs:[C('A', { from:'shared drive' }), C('B', { from:'shared drive', importedAt:'2026-10-17T09:00:00Z' })] });
    const h = api.migHeadFacts();
    assert.match(h, /^mig_head_from \{"from":"shared drive"\} · mig_head_started_by .*"who":"mig_head_you"/);
    assert.match(h, /mig_head_files:2/);
    assert.match(h, /"day":"Fri 16 Oct"/, 'the day as drawn, no comma');
  });
  test('1b files from different places say "old contracts brought in"; another importer is named; nothing imported, nothing said', () => {
    const { api } = stage({ cs:[C('A', { from:'drive' }), C('B', { importedBy:'Bea' })] });
    assert.match(api.migHeadFacts(), /^mig_head_old · /);
    const z = stage({ cs:[C('A', { importedBy:'Bea' })] }).api.migHeadFacts();
    assert.match(z, /"who":"Bea"/);
    assert.equal(stage().api.migHeadFacts(), '');
  });
});

describe('f771 (2) the cost in calls, never money', () => {
  test('2a about one call a file; up to one more a page if they are scans', () => {
    const { api } = stage();
    const n = api.migCallsOf([{ name:'a.pdf', size:80000 }, { name:'b.docx', size:1000 }, { name:'c.png', type:'image/png', size:9000 }]);
    assert.deepEqual([n.files, n.calls, n.upTo], [3, 3, 7]);
  });
  test('2b the strip says calls and the allowance in files; no money anywhere in the words', () => {
    const { api } = stage({ M:{ allowance:{ open:true, docs:200, docsUsed:41, budget:3, spent:1.2 } } });
    const line = api.migCostLine();
    assert.match(line, /mig_cost_calls .*mig_from_allow_docs .*41.*200/);
    assert.match(line, /mig_cost_before/);
    assert.ok(!/[$]|1\.2|spent/.test(line));
    assert.match(stage({ ai:false }).api.migCostLine(), /mig_cost_rules/, 'no key: HaTi\'s own rules, no calls');
    for (const k of ['mig_cost_calls', 'mig_run_calls_other', 'mig_from_allow_docs', 'mig_side_allow_docs']) assert.ok(!/[$£€]|\bKES\b|\bSEK\b|\bkr\b|money/i.test(BOOKS.en[k]), k);
    assert.ok(!/migMoney|\$'\+Number/.test(MIG), 'the dollar formatter is gone from the page');
  });
});

describe('f771 (3) you see the total before it starts', () => {
  test('3a asked whenever Jambo reads — an open allowance too — in calls', async () => {
    const ctx = stage({ M:{ allowance:{ open:true, docs:200, docsUsed:41 } } });
    assert.equal(await ctx.api.migConfirmEstimate([{ name:'a.pdf', size:1000 }, { name:'b.pdf', size:1000 }]), true);
    assert.equal(ctx.asked.length, 1);
    assert.match(String(ctx.asked[0].message), /mig_run_calls:2 .*mig_from_allow_docs/);
    assert.equal(ctx.asked[0].confirmLabel, 'mig_run_go');
  });
  test('3b where HaTi\'s own rules read, nothing is asked', async () => {
    const ctx = stage({ ai:false });
    assert.equal(await ctx.api.migConfirmEstimate([{ name:'a.pdf', size:1000 }]), true);
    assert.equal(ctx.asked.length, 0);
  });
});

describe('f771 (4) a whole folder', () => {
  const file = name => ({ isFile:true, isDirectory:false, name, file:(ok) => ok({ name }) });
  const dir = (name, kids) => ({ isFile:false, isDirectory:true, name, createReader:() => { let done = false; return { readEntries:(ok) => { const b = done ? [] : kids; done = true; ok(b); } }; } });
  test('4a walked, its contracts taken, the rest left out and counted, the folder names the batch', async () => {
    const { api } = stage();
    const dt = { items:[{ webkitGetAsEntry:() => dir('shared drive', [file('a.pdf'), file('b.docx'), file('.DS_Store'), file('notes.xlsx'), dir('2019', [file('c.PDF'), file('d.doc')])]) }] };
    const r = await api.migFilesFromDrop(dt);
    assert.deepEqual(r.files.map(f => f.name).join(), 'a.pdf,b.docx,c.PDF,d.doc');
    assert.equal(r.from, 'shared drive');
    assert.equal(r.left, 2);
  });
  test('4b loose files pass as they came', async () => {
    const { api } = stage();
    const r = await api.migFilesFromDrop({ items:[{ webkitGetAsEntry:() => file('x.pdf') }], files:[{ name:'x.pdf' }] });
    assert.deepEqual([r.files.length, r.from], [1, null]);
  });
});

describe('f771 (5) the strip, the boxes, the head, the place', () => {
  test('5a the strip as drawn, its three labelled boxes, "Let Jambo suggest"', () => {
    const f = fnBody(MIG, 'migDropCardHtml');
    for (const k of ['mig_drop_h', 'mig_import_as', 'mig_file_under', 'mig_list_l', 'mig_list_load', 'mig_list_empty', 'mig_auto_jambo', 'mig_choose_files']) assert.ok(f.includes("'" + k + "'"), k);
    assert.match(f, /<span class="mig-opt-l">/);
    assert.match(fnBody(MIG, 'migPaintHead'), /id="mig-choose"/);
  });
  test('5b the head paints through PAGE_HEAD_PAINT; a refresh keeps the door, the words, the chosen file and the check view', () => {
    assert.match(APP, /PAGE_HEAD_PAINT = \{[^}]*migration:'migPaintHead'/);
    assert.match(APP, /migration:\['migPlace','migPlacePut'\]/);
    const { api } = stage();
    api.migPlacePut({ show:'check', all:true, pick:'MK-1', check:'MK-2', q:'Nordkap' });
    assert.deepEqual(JSON.parse(JSON.stringify(api.migPlace())), { show:'check', all:true, pick:'MK-1', check:'MK-2', q:'Nordkap' });
    api.migPlacePut({ show:'nonsense' });
    assert.equal(api.migPlace().show, 'check', 'an unknown door is not put back');
  });
  test('5c the words, in both books', () => {
    for (const k of ['mig_head_from', 'mig_head_old', 'mig_head_started_by', 'mig_head_files_one', 'mig_head_files_other', 'mig_cost_calls', 'mig_cost_before', 'mig_cost_rules',
      'mig_run_title_one', 'mig_run_title_other', 'mig_run_calls_one', 'mig_run_calls_other', 'mig_run_go', 'mig_folder_left_one', 'mig_folder_left_other', 'mig_drop_h', 'mig_drop_sub',
      'mig_list_l', 'mig_list_load', 'mig_list_empty', 'mig_auto_jambo', 'mig_choose_dots']) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
