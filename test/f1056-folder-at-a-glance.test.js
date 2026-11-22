/* f1056 · AT A GLANCE (owner's pick by name, 15 Nov 2026: "build at glance"; drawn on photos of the real Contracts page
   beside The SAP Way and The Legora Way). The Contracts panel, inside a folder and on the folders page, shows what the list
   cannot: when the contracts end across the next twelve months and where the money is, then what is not done yet. No AI;
   every press an existing door. Fails at the parent: none of it exists. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const reg = read('js/views/register.js');
const i18n = read('js/i18n.js');
const css = read('index.html');
const fn = name => { const m = reg.match(new RegExp('function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}')); assert.ok(m, name + ' exists'); return m[0]; };

/* the readings run as written, with a fixed day: the answer never depends on the day the test runs */
const run = (names, stubs) => Function(...Object.keys(stubs), 'const RFG_MONTHS = 12;\n' + names.map(fn).join('\n') + '\nreturn {' + names.join(',') + '};')(...Object.values(stubs));

test('f1056 · when they end: twelve months from this one, each contract in its month, the rest counted, never guessed', () => {
  const C = [{ id: 'a', expiry: '2026-11-20' }, { id: 'b', expiry: '2027-06-30' }, { id: 'c', expiry: '2027-06-01' }, { id: 'd', expiry: '2027-11-02' },
    { id: 'e', expiry: '2026-01-01' }, { id: 'f', expiry: '' }];
  const { regGlanceEnds } = run(['regGlanceEnds'], { todayISO: () => '2026-11-15', effectiveExpiry: c => c.expiry });
  const E = regGlanceEnds(C);
  assert.equal(E.months.length, 12);
  assert.equal(E.months[0].ym, '2026-11', 'the strip starts with this month');
  assert.equal(E.months[11].ym, '2027-10');
  assert.deepEqual(E.months[0].ids, ['a']);
  assert.deepEqual(E.months[7].ids, ['b', 'c'], 'two in June 2027');
  assert.deepEqual([E.later, E.past, E.none], [1, 1, 1], 'later, passed and no date are counted, not dropped');
  assert.equal(E.first.c.id, 'a'); assert.deepEqual(E.inYear, ['a', 'b', 'c']);
  assert.match(fn('regGlanceEnds'), /effectiveExpiry\(c\)/, 'the live end date, as amended');
});

test('f1056 · where the money is: the home currency, the largest first; pay and a missing rate add nothing', () => {
  const C = [{ id: 'a', v: 3 }, { id: 'b', v: 96 }, { id: 'c', v: 50, missing: true }, { id: 'd', v: 70, pay: true }, { id: 'e', v: 0 }];
  const { regGlanceMoney } = run(['regGlanceMoney'], { fxHome: c => ({ v: c.v, missing: !!c.missing }), fxIsPay: c => !!c.pay });
  assert.deepEqual(regGlanceMoney(C).map(x => x.c.id), ['b', 'a']);
});

test('f1056 · the folder\'s panel: the count and one chip, when they end, where the money is, not done yet — in that order', () => {
  const g = strip(fn('regFolderGlanceHtml'));
  const at = k => g.indexOf(k);
  assert.ok(at('const top=') < at('const E=regGlanceEnds(book)') && at('const E=regGlanceEnds(book)') < at('regGlanceMoney(book)') && at('regGlanceMoney(book)') < at('regFolderSays(book, r)'), 'in the drawn order');
  assert.match(g, /class="rfg-chip is-amber" data-rfp-view="needs"/, 'what needs you is the Needs you tab\'s door');
  assert.match(g, /class="rfg-mo has" \$\{only\(m\.ids, /, 'a month with any is a door to exactly those');
  /* RE-POINTED (P-31, owner's pick 20 Nov 2026: no money in a side panel): the money part is drawn only in the old look */
  assert.match(g, /if\(r\.val!=null&&!\(typeof newLookOn==='function'&&newLookOn\(\)\)\)/, 'the money only for a reader who may see values, and never in the new look');
  assert.match(g, /data-rfp-open="\$\{esc\(x\.c\.id\)\}"/, 'a bar opens its contract');
  assert.match(g, /x\.kind==='need'&&x\.std/); assert.match(g, /x\.kind==='money'/); assert.match(g, /x\.kind==='std'/);
  assert.doesNotMatch(g + fn('regFolderPanelHtml'), /api\/ai|aiAsk|copilot|fetch\(|data-ac-discover/i, 'no AI, no call, no Discover');
});

test('f1056 · the folders page: one bar split by folder, each row its folder\'s door; NDA and standards each with their list', () => {
  const g = strip(fn('regFoldersGlanceHtml'));
  assert.match(g, /canViewValues\(\)/);
  assert.match(g, /class="rfg-lg" data-ctf-folder=/);
  assert.match(g, /i18t\('rfg_nda'\)/); assert.match(g, /i18t\('rfg_checked'\)/);
  assert.match(g, /data-rfp-label="\$\{esc\(i18t\('rfg_label_nda'\)\)\}"/);
  /* RE-POINTED 21 Nov 2026 (P-31, as drawn): the new look's landing panel is the drawn one (regFoldersLsPanelHtml) — no
     money, no cards; At a Glance stays for the old look */
  assert.match(strip(fn('regFoldersPanelHtml')), /if \(regNl\(\)\)\{[\s\S]*?return regFoldersLsPanelHtml\(rows, said\); \}/, 'the new look draws it; the old look keeps its own');
});

test('f1056 · a list shown from the panel names itself', () => {
  const wired = strip(reg.slice(reg.indexOf('document._rfpWired=true'), reg.indexOf('function regNlFootHtml')));
  assert.match(wired, /on\.getAttribute\('data-rfp-label'\)\|\|i18t\('rfp_say_unchecked_label'/);
});

test('f1056 · every word in both books', () => {
  const keys = [...new Set((reg.match(/'rfg_\w+'/g) || []).map(k => k.slice(1, -1)))];
  assert.ok(keys.length >= 25, 'found ' + keys.length);
  for (const k of keys){ const n = (i18n.match(new RegExp('^    ' + k + '(?:_one|_other)?: ', 'gm')) || []).length; assert.ok(n === 2 || n === 4, k + ' in both books (' + n + ')'); }
});

test('f1056 · styled from the tokens, nothing boxed', () => {
  const rules = css.split('\n').filter(l => /html\.lg-new \.rfg|rfg-/.test(l)).join('\n');
  assert.ok(rules.length > 500);
  assert.doesNotMatch(rules, /#[0-9a-fA-F]{3,8}\b|rgba?\(/, 'colours only from tokens');
  assert.doesNotMatch(rules, /box-shadow|border:1px solid/, 'nothing boxed');
});
