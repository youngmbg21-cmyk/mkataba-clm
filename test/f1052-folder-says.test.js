/* f1052 · WHAT THIS FOLDER SAYS, THE LEGORA WAY (owner's pick by name, 14 Nov 2026).
   Where "Columns you asked" stood in the Contracts folder's panel: one quiet list of plain sentences, each read from
   facts HaTi already holds (no AI), each with its act through an existing door. Fails at the parent: none of it exists. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const reg = read('js/views/register.js');
const fn = name => { const m = reg.match(new RegExp('function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}')); assert.ok(m, name + ' exists'); return strip(m[0]); };

test('f1052 · the folder\'s panel draws This folder, the sentences, Discover — and no asked columns', () => {
  const pan = fn('regFolderPanelHtml');
  assert.match(pan, /\$\{folder\}\$\{regFolderSaysHtml\(book, r\)\}\$\{acts\}/);
  assert.doesNotMatch(pan, /rfp_cols_h|data-ac-bring|data-ac-remove/);
});
test('f1052 · every sentence is read, never guessed, and spends nothing', () => {
  const says = fn('regFolderSays');
  assert.match(says, /stdRowReading\(c\)/, 'the standards\' own reading');
  assert.match(says, /effectiveExpiry\(c\)/, 'the live end date, as amended');
  assert.match(says, /fxHome\(c\)\.missing/, 'the sum\'s own left-out reading');
  assert.match(says, /if\(r\.noRate\)/, 'the money sentence only where the sum left something out');
  assert.doesNotMatch(says + fn('regFolderSaysHtml'), /api\/ai|aiAsk|copilot|fetch\(/i, 'no AI, no call');
  assert.doesNotMatch(says, /c\.playbook\s*=|\.verdicts\.push|persist\(/, 'reading never writes');
});
test('f1052 · every act is an existing door', () => {
  const says = fn('regFolderSays');
  for (const d of ['data-rfp-view="needs"', 'data-rfp-open=', 'data-rfp-only=', 'data-rfp-rate']) assert.ok(says.includes(d), d);
  const wired = strip(reg.slice(reg.indexOf('document._rfpWired=true'), reg.indexOf('function regNlFootHtml')));
  assert.match(wired, /\[data-rfp-only\][\s\S]*regShowOnly\(/);
  assert.match(wired, /\[data-rfp-rate\][\s\S]*isAdmin\(\)[\s\S]*openSettingsAt\('company','company'\)[\s\S]*stAskFrom\('company'/, 'an admin lands on the rates, anyone else asks an admin');
  assert.match(wired, /\[data-rfp-chip\][\s\S]*ctfDockAgain\(\)/);
});
test('f1052 · a chip shows only for a kind with a row, and only where two kinds stand', () => {
  const html = fn('regFolderSaysHtml');
  assert.match(html, /if\(!S\.length\) return '';/, 'nothing to say draws nothing');
  assert.match(html, /RFP_SAY_CHIPS\.filter\(\(\[k\]\)=>S\.some\(x=>x\.kind===k\)\)/);
  assert.match(html, /kinds\.length>1\?/);
});
test('f1052 · the words stand in both books, the retired ones in neither', () => {
  const i18n = read('js/i18n.js');
  const keys = [...new Set((reg.match(/'rfp_(?:say|chip)_\w+'/g) || []).map(k => k.slice(1, -1)))];
  assert.ok(keys.length >= 15);
  for (const k of keys) { const n = (i18n.match(new RegExp('^    ' + k + '(?:_one)?: ', 'gm')) || []).length; assert.strictEqual(n, 2, k + ' in both books'); }
  assert.doesNotMatch(i18n, /^\s+rfp_(cols_h|col_sub|on_list|off_list|add|remove): /m);
});
test('f1052 · the panel\'s sentences are styled from tokens, nothing boxed', () => {
  const css = read('index.html').match(/html\.lg-new \.rfp-say\{[^}]*\}/)[0];
  assert.doesNotMatch(css, /border-radius|box-shadow|background/);
});
