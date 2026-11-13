/* f1045 — SETTINGS, THE LEGORA WAY, WITH COLOUR (owner's pick by name, 13 Nov 2026: "build the legora way", after
   "the current options are poor and very dull. No color what so ever"). Nothing boxed, one list by area; a round
   coloured mark on each row; coloured chips; the left menu gone, its pages links at the foot. Pins the builders'
   regions and the stylesheet's rules, comments stripped; the painted page is GitHub's (settings-menu-verify). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const S = read('js/views/settings.js');
const CSS = read('index.html').replace(/\/\*[\s\S]*?\*\//g, '');
const I = read('js/i18n.js');
const fn = name => { const i = S.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' is there'); const j = S.indexOf('\nfunction ', i + 10); return S.slice(i, j < 0 ? undefined : j); };

test('f1045 (1) every setting has ONE area and a drawn icon', () => {
  const areas = /const STN_AREAS=\[([^\]]+)\]/.exec(S)[1].replace(/'/g, '').split(',');
  assert.deepStrictEqual(areas, ['you', 'sec', 'rule', 'money', 'msg']);
  const of = new Function('return ' + /const STN_AREA_OF=(\{[^}]+\})/.exec(S)[1])();
  const ic = new Function('return ' + /const STN_ICON=(\{[^}]+\})/.exec(S)[1])();
  const rows = [...(fn('stnYouHtml') + fn('stnCompanyHtml')).matchAll(/stnRow\('(\w+)'/g)].map(m => m[1]);
  assert.strictEqual(rows.length, 12);
  const icons = read('js/components.js');
  rows.forEach(k => { assert.ok(areas.includes(of[k]), k + ' has an area'); assert.ok(ic[k] && new RegExp('\\n  ' + ic[k] + ':').test(icons), k + '\'s icon is one HaTi draws'); });
});
test('f1045 (2) the row: mark, name with its sentence under it, the state, the door last', () => {
  const r = fn('stnRow');
  assert.match(r, /class="stn-row a-\$\{ar\}"[\s\S]*?stn-mark[\s\S]*?stn-t"[\s\S]*?stn-l[\s\S]*?stn-sub[\s\S]*?stn-v"[\s\S]*?stn-a"/);
  assert.match(fn('stnPill'), /stn-pill stn-dot is-/);
});
test('f1045 (3) the left menu is gone; chips only for areas that have rows; the pages at the foot through the same doors', () => {
  assert.doesNotMatch(S, /stnMenuHtml|stnMenuMark|data-stn-to|stn-menu|stn-cols/);
  const c = fn('stnChipsHtml');
  assert.match(c, /STN_AREAS\.filter\(k=>rows\.some\(r=>r\.area===k\)\)/);
  assert.match(c, /if\(have\.length<2\) return ''/);
  assert.match(c, /rows\.filter\(r=>r\.area===k\)\.length/, 'a chip\'s number is the rows it shows');
  const p = fn('stnPagesHtml');
  ['data-st-page="team"', 'data-st-page="streams"', 'data-st-panel="lessons"', 'data-st-panel="trail"'].forEach(a => assert.ok(p.includes(a), a));
  assert.match(p, /if\(!admin\) return ''/);
});
test('f1045 (4) a chip redraws the list alone and the place is kept', () => {
  assert.match(fn('stnListPaint'), /getElementById\('stn-main'\)[^}]*stnListHtml/);
  assert.match(S, /_stnArea=ch\.getAttribute\('data-stn-area'\)\|\|'all';\s*stnListPaint\(\);/);
  assert.match(fn('settingsPlace'), /area:/);
  assert.match(fn('settingsPlacePut'), /_stnArea=\(p&&STN_AREAS\.includes\(p\.area\)\)\?p\.area:'all'/);
});
test('f1045 (5) the tones are HaTi\'s own five, by token; the sheet clips nothing; the switch is dressed here', () => {
  [['you', 'violet'], ['sec', 'steel'], ['rule', 'amber'], ['money', 'green'], ['msg', 'ruby']].forEach(([a, t]) =>
    assert.ok(CSS.includes(`html.lg-new .stn-page .a-${a}{--tb:var(--st-${t}-bg);--tf:var(--st-${t}-fg);--td:var(--st-${t}-dot)}`), a));
  assert.match(CSS, /\.ap-card\.stn-card\{[^}]*clip-path:none/);
  assert.match(CSS, /:is\(\.st-cr, \.stn-page\) \.st-swt\{/);
  assert.match(CSS, /html\.lg-new \.stn-main\{[^}]*flex:none/);
});
test('f1045 (6) the new words stand in both books', () => {
  ['stn_name_sub', 'stn_mail_ok_sub', 'stn_pages', 'stn_ar_label', 'stn_ar_all', 'stn_ar_you', 'stn_ar_sec', 'stn_ar_rule', 'stn_ar_money', 'stn_ar_msg'].forEach(k =>
    assert.strictEqual((I.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length, 2, k));
});
