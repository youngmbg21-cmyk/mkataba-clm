'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f773 — IMPORT AS DRAWN, THE FIX PASS (round 22, 19 Oct 2026; the drawn-vs-
   built check's differences — js/views/migration.js)
   (1) "not signed: import as a draft?": a file the batch would seal as signed
       whose name or first lines call it a draft and which says no signing day
       is PARKED (migLooksUnsigned), its row "To check" with that reason, three
       answers (Import as a draft · Import as signed · Skip); a draft is filed
       with nothing sealed.
   (2) Signed where the file says so (migSignedAt), never the start date.
   (3) Jambo's likely answers: the other party from "between A and B"
       (migPartyGuess, never one of ours), the amount as the file writes it
       (migAmountGuess); the notice a renewing file asks (migNoticeDays) and the
       yearly reminder before the notice day (migNoticeDay, migFileIt).
   (4) The six marks on every row; one name for a stream; the value with its
       period ("a year"); a file with no text never says "No money passes".
   (5) Option 1's tabs Check · Decide · Filed (Decide = a copy or nothing
       readable); "New batch" while checking; the empty page's chip is the
       page's own door; every new word in both books.
   AT THE FIRST PASS (4d7e31a) every test here FAILS.
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
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

function stage(o){
  const M = Object.assign({ queue:[], pending:{}, defaults:{ folder:'auto', status:'Signed' } }, (o && o.M) || {});
  const CS = (o && o.cs) || [];
  const ctx = {
    i18t: (k, v) => k + (v ? ' ' + JSON.stringify(v) : ''), i18tn: (k, n, v) => k + ':' + n + (v ? ' ' + JSON.stringify(v) : ''), esc: s => String(s == null ? '' : s),
    migState: () => M, migContracts: () => CS, getContract: id => CS.find(c => c.id === id) || null, canEdit: () => true,
    contractRef: c => c.id, isOcrText: () => false, isMonetary: c => c.valueType !== 'none', fmtMoneyShortOf: c => 'KES ' + c.value,
    langLocale: () => 'en-GB', FOLDERS: { proc:{ name:'Procurement' }, dist:{ name:'Warehousing & Distribution' } }, STREAM_SHORT: { dist:'Distribution' },
    streamLabel: c => ({ dist:'Distribution' }[c && c.folder]) || 'X', FIRST_PARTY: 'Highland Corporate Ltd',
    MIG_CRITICAL: ['counterparty', 'contractType', 'effectiveDate', 'expiryDate', 'value'], META_FIELDS: [], folderFromType: () => null,
    renderMigration: () => {}, document: { getElementById: () => null },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(take(['MIG_DRAFT_RE', 'migLooksUnsigned', 'MIG_SIGNED_SENT_RE', 'migSignedAt', 'migIsoIn', 'MIG_MON', 'MIG_SHOWS', 'MIG_DECIDE', 'migShowPass', 'MIG_ST_ORDER',
    'migLinkPending', 'migRefOf', 'MIG_K', 'MIG_FACT_WORD', 'migNoneWhy', 'migLinkWhy', 'migCheckWhy', 'migStateOf', 'MIG_DUP_WORD', 'migDupeWhy', 'migQueueState', 'migFolderFor',
    'migRows', 'migRowByKey', 'migKpis', 'migGates', 'migComplete', 'migFieldLabel', 'migDay', 'migSideFacts', 'migMarksOf', 'migDotsHtml', 'migStreamName', 'migParked',
    'MIG_PERIOD_RE', 'MIG_PERIOD_WORD', 'migPeriodEnd', 'migPeriodAt', 'migAmountWithPeriod', 'MIG_NUM_WORD', 'migNoticeDays', 'migNoticeWords', 'migNoticeDay', 'migPartyGuess', 'migAmountGuess',
    'migFind', 'migAmountAt', 'migDateAt', 'MIG_RENEW_RE', 'migRenewAt', 'migFoundAt', 'migSideSay'])
    + '\nlet _migShow = "all", _migAll = false, _migCheck = null, _migPick = null;\nthis.api = { migPeriodEnd, migLooksUnsigned, migSignedAt, migShowPass, migQueueState, migRows, migKpis, migSideFacts, migDotsHtml, migStreamName, migPeriodAt, migAmountWithPeriod, migNoticeDays, migNoticeWords, migNoticeDay, migPartyGuess, migAmountGuess, migAmountAt, migSideSay };', ctx);
  return ctx;
}
const fn = n => { let i = MIG.indexOf('\nfunction ' + n + '('); if (i < 0) i = MIG.indexOf('\nasync function ' + n + '('); return i < 0 ? '' : MIG.slice(i, MIG.indexOf('\n}', i) + 2); };

describe('f773 (1) not signed: import as a draft?', () => {
  test('1a a draft by its name or first lines, with no signing day, looks unsigned; a signed file does not', () => {
    const { api } = stage();
    assert.equal(api.migLooksUnsigned('NON-DISCLOSURE AGREEMENT\n\n1. Parties.', 'NDA_Volvo_draft_v2.docx'), true);
    assert.equal(api.migLooksUnsigned('DRAFT FOR DISCUSSION\nSUPPLY AGREEMENT', 'supply.pdf'), true);
    assert.equal(api.migLooksUnsigned('Utkast\nAVTAL', 'avtal.pdf'), true);
    assert.equal(api.migLooksUnsigned('SUPPLY AGREEMENT\n1. Parties.', 'supply.pdf'), false, 'no word of a draft: not asked');
    assert.equal(api.migLooksUnsigned('DRAFT\n...\n5. Signed in Nairobi on 2 March 2021.', 'x_draft.pdf'), false, 'a signing day in it: signed');
    assert.equal(api.migLooksUnsigned('LEASE', 'Overdraft_facility.pdf'), false, 'a word that holds "draft" is not one');
  });
  test('1b parked, its row is To check with the reason; it counts in To check and is no copy', () => {
    const M = { queue:[{ name:'NDA_draft.docx', status:'unsigned' }], pending:{ 0:{ file:{ name:'NDA_draft.docx' }, meta:{}, manifest:null } }, defaults:{ folder:'auto', status:'Signed' } };
    const { api } = stage({ M });
    assert.deepEqual(JSON.parse(JSON.stringify(api.migQueueState(M.queue[0]))), { k:'check', why:'mig_why_unsigned' });
    assert.equal(api.migKpis().check, 1);
  });
  test('1c the batch parks it before anything is saved; its three answers go through the one resolver, a draft with nothing sealed', () => {
    const loop = fn('migProcessFiles');
    assert.match(loop, /M\.defaults\.status==='Signed' && migLooksUnsigned\(extractedText, file\.name\)/);
    assert.ok(loop.indexOf("step('unsigned'") < loop.indexOf('const c=await migBuildAndSave'), 'parked before it is built');
    const res = fn('migResolveDuplicate');
    assert.match(res, /action==='draft'\?'Draft'/);
    assert.match(fn('migBuildAndSave'), /const status=ctx\.status\|\|/);
    assert.match(fn('migBuildAndSave'), /hash:executedOutside\?'MIGRATED':null/, 'a draft is not sealed');
    const acts = fn('migUnsignedActsHtml');
    for (const a of ['draft', 'signed', 'skip']) assert.match(acts, new RegExp(`data-mig-unsigned="${a}"`));
  });
});

describe('f773 (2) signed where the file says so', () => {
  test('2a the signature sentence gives the place and the day; the start date never stands in', () => {
    const { api } = stage();
    const a = api.migSignedAt('§ 3 Term. From 1 April 2019.\n\n§ 5 Signatures. Signed in Mombasa on 14 March 2019, in two copies.');
    assert.deepEqual([a.iso, a.place], ['2019-03-14', 'Mombasa']);
    const b = api.migSignedAt('§ 5 Underskrifter. Göteborg den 14 mars 2019. Två undertecknade exemplar.');
    assert.equal(b && b.iso, '2019-03-14');
    assert.equal(api.migSignedAt('This lease applies from 1 April 2019.'), null, 'no signing sentence: nothing said');
    assert.match(fn('migSignedLineHtml'), /mig_as_signed_none/);
    assert.ok(!/c\.signedAt/.test(fn('migSignedLineHtml')), 'the record\'s signedAt (the start date at import) is not shown as a signing day');
  });
});

describe('f773 (3) Jambo\'s likely answers', () => {
  test('3a the other party, never one of ours; the amount as written', () => {
    const { api } = stage();
    assert.equal(api.migPartyGuess('1. Parties. This Agreement is made between Highland Corporate Ltd and Acme Ltd.\n', {}).name, 'Acme Ltd');
    assert.equal(api.migPartyGuess('made between Safi Cleaners Ltd and Highland Corporate Ltd.', {}).name, 'Safi Cleaners Ltd');
    assert.equal(api.migPartyGuess('made between A Ltd and B Ltd.', {}), null, 'neither is ours: no guess');
    assert.equal(api.migAmountGuess('The fee is KES 1,250,000 for the term').quote, 'KES 1,250,000');
    assert.equal(api.migAmountGuess('Hyran är 40 000 kronor per månad').quote, '40 000 kronor');
    assert.match(fn('migWhyHtml'), /offers\.push\(\{ k:'party'/);
    assert.match(fn('migWhyHtml'), /offers\.push\(\{ k:'value'/);
  });
  test('3b the notice a renewing file asks, and the notice day ahead', () => {
    const { api } = stage();
    assert.equal(api.migNoticeDays('unless it is ended three months before the term runs out'), 90);
    assert.equal(api.migNoticeDays('upon 60 days notice'), 60);
    assert.equal(api.migNoticeDays('om det inte sägs upp senast tre månader före'), 90);
    assert.equal(api.migNoticeDays('renews by itself'), 0);
    assert.equal(api.migNoticeDay('2019-04-01', 90, '2026-10-19'), '2027-01-01');
    assert.equal(api.migNoticeDay('2019-04-01', 90, '2027-01-02'), '2028-01-02', 'a leap year counted');
    assert.equal(api.migNoticeDay('', 90, '2026-10-19'), '');
    assert.match(api.migNoticeWords(90), /mig_notice_months:3/);
  });
  test('3c filed as renews by itself, HaTi makes the yearly reminder it promised — an ordinary obligation of ours', () => {
    const f = fn('migFileIt');
    assert.match(f, /recurring:'annual', party:'ours'/);
    assert.match(f, /origin:'renew-notice'/);
    assert.match(fn('migWhyHtml'), /days && start \? i18t\('mig_why_end_so_remind'/, 'promised only where it will be made');
  });
});

describe('f773 (4) the list and the panel', () => {
  test('4a six marks on every row: the sixth met where nothing suggests a link', () => {
    const { api } = stage();
    const five = [1, 2, 3, 4, 5].map(i => ({ k:'k' + i, label:'l', ok:true }));
    assert.equal((api.migDotsHtml(five).match(/class="mig-dot[ "]/g) || []).length, 6);
    assert.equal((api.migDotsHtml(five.concat([{ k:'link', label:'x', ok:false }])).match(/class="mig-dot[ "]/g) || []).length, 6);
  });
  test('4b one name for a stream: the stream box\'s', () => {
    const { api } = stage();
    assert.equal(api.migStreamName('dist'), 'Warehousing & Distribution');
  });
  test('4c the value with the period the file writes; kept for the light list', () => {
    const { api } = stage();
    const t = 'The rent is KES 480,000 a year, paid quarterly.';
    assert.equal(api.migPeriodAt(t, api.migAmountAt(t, 480000)), 'year');
    assert.equal(api.migAmountWithPeriod({ value:480000, upload:{ extractedText:t } }), 'KES 480000 mig_per_year');
    assert.equal(api.migAmountWithPeriod({ value:480000, migration:{ valuePer:'month' } }), 'KES 480000 mig_per_month');
    assert.equal(api.migAmountWithPeriod({ value:5, upload:{ extractedText:'KES 5.' } }), 'KES 5');
    assert.match(fn('migBuildAndSave'), /valuePer:per/);
  });
  test('4d a file with no text never says "No money passes"', () => {
    const { api } = stage();
    const f = api.migSideFacts({ id:'Z', valueType:'none', metadata:{}, migration:{ blocked:'no-text' } }).find(x => x.k === 'value');
    assert.notEqual(f.text, 'mig_side_no_money');
  });
});

describe('f773 (5) tabs, the head, the empty page, the words', () => {
  test('5a Decide is a copy or nothing readable; the bar draws Check · Decide · Filed', () => {
    const { api } = stage();
    assert.equal(api.migShowPass({ st:{ k:'dupe' } }, 'decide'), true);
    assert.equal(api.migShowPass({ st:{ k:'none' } }, 'decide'), true);
    assert.equal(api.migShowPass({ st:{ k:'check' } }, 'decide'), false);
    const bar = fn('migTabsHtml'); assert.match(fn('migCheckBarHtml'), /migTabsHtml\('check'/); assert.match(fn('migDecideBarHtml'), /migTabsHtml\('decide'\)/);
    for (const k of ['mig_ck_tab_check', 'mig_ck_tab_decide', 'mig_ck_tab_filed']) assert.match(bar, new RegExp(k));
    assert.match(fn('migPaintHead'), /_migCheck \? 'mig_new_batch'/);
  });
  test('5b nothing brought in: Jambo\'s chip is the page\'s own door', () => {
    const { api } = stage();
    const say = api.migSideSay();
    assert.equal(say.chips.length, 1); assert.equal(say.chips[0].label, 'mig_chip_choose');
  });
  test('5c every new word in both books', () => {
    for (const k of ['mig_why_unsigned', 'mig_cf_t_unsigned', 'mig_cf_say_unsigned', 'mig_unsigned_draft', 'mig_unsigned_signed_b', 'mig_unsigned_after', 'mig_unsigned_left',
      'mig_unsigned_drafted', 'mig_unsigned_signed', 'mig_mark_alone', 'mig_ck_tabs', 'mig_ck_tab_check', 'mig_ck_tab_decide', 'mig_ck_tab_filed', 'mig_per_year', 'mig_per_month',
      'mig_per_quarter', 'mig_as_signed_none', 'mig_as_signed_in', 'mig_why_party_guess', 'mig_why_party_guess_unsure', 'mig_why_value_guess', 'mig_why_value_guess_unsure',
      'mig_use_val', 'mig_why_end_so_remind', 'mig_notice_months_one', 'mig_notice_months_other', 'mig_notice_days_one', 'mig_notice_days_other', 'mig_chip_choose',
      'mig_none_yet2', 'mig_new_batch']){
      assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); assert.notEqual(BOOKS.en[k], BOOKS.sv[k], k);
    }
  });
});

describe('f773 (6) fix pass 2 (the second check)', () => {
  test('6a the allowance is read on arrival, once a sitting — not only after a batch', () => {
    const r = fn('renderMigration');
    assert.match(r, /if\(API_MODE\(\)&&!M\.aiAsked\)\{ M\.aiAsked=true;\s*migLoadAiState\(\)/);
  });
  test('6b the marks list says the six the row draws; the quote under the value carries its period', () => {
    const { api } = stage();
    assert.match(fn('migSideRowHtml'), /migMarksOf\(gates\)\.map\(mark\)/);
    const t = 'The rent is KES 480,000 a year, paid quarterly.';
    const at = api.migAmountAt(t, 480000);
    assert.equal(t.slice(at.s, api.migPeriodEnd(t, at)), 'KES 480,000 a year');
  });
  test('6c a parked copy\'s row says what was read; a file with no text names no stream in the list', () => {
    assert.match(MIG, /const migRowC = r => r\.c \|\| \(migParked\(r\) \? migPendingAsContract\(r\) : null\);/);
    assert.match(fn('migValueCell'), /migRowC\(r\)/); assert.match(fn('migEndsCell'), /migRowC\(r\)/);
    assert.match(fn('migStreamOf'), /r\.st\.k === 'none'\) return '—'/);
  });
  test('6d the held file: one question, "Leave it out" (not a second "Skip"), and the Swedish reason reads', () => {
    assert.match(fn('migWhyHtml'), /if \(c\._parked\) return \{ lines:/);
    assert.match(fn('migUnsignedActsHtml'), /mig_unsigned_leave/);
    assert.ok(BOOKS.en.mig_unsigned_leave && BOOKS.sv.mig_unsigned_leave);
    assert.equal(BOOKS.sv.mig_why_unsure, 'oklart: {what}');
  });
});
