'use strict';
/* f1147 — THE SIX PAGES INSIDE SETTINGS, THE LEGORA + STRIPE WAY (owner's pick 22 Nov 2026)
   People · Who holds what · Roles · Contract streams · How our contracts look · Data & backup.
   (1) one switch stLsOn, six pages, admins on the Company face only; stPagePaint hands them over
   (2) one head builder for all six: the way back to the area, the title, the ask box, chips that hide a nought
   (3) no button on a row: a row chooses or opens; Keep · Change and "mark done" are the panel's
   (4) nothing here writes: the pages only press doors the old pages had
   (5) the old painters hand over while the new page stands (streams, the review, the trail, Jambo's feed)
   (6) How our contracts look keeps its editing; the head and the panel are Settings' own
   (7) every word in both books; the styles stay inside the page and the panel */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const S = strip(read('js/views/settings.js'));
const D = strip(read('js/views/designstep.js'));
const CSS = strip(read('index.html'));
const I = read('js/i18n.js');
const region = () => {
  const a = S.indexOf("const ST_LS_PAGES="), b = S.indexOf('function stYouBoardHtml', a) > 0 ? S.indexOf('function stYouBoardHtml', a) : S.indexOf("window._stLsWired=true", a) + 3000;
  assert.ok(a >= 0, 'the six pages are there');
  return S.slice(a, b);
};
const fn = name => { const i = S.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' is there'); return S.slice(i, S.indexOf('\nfunction ', i + 10)); };

test('f1147 (1) one switch, six pages, admins on the Company face; the page painter hands over', () => {
  assert.match(S, /const ST_LS_PAGES=\['team','sheet','roles','streams','look','data'\];/);
  const on = fn('stLsOn');
  assert.match(on, /!ST_LS_PAGES\.includes\(_stPage\)\) return false/);
  assert.match(on, /!stIsAdmin\(\)\|\|settingsTab\(\)!=='company'\) return false/);
  assert.match(on, /newLookOn\(\)/);
  assert.match(fn('stPagePaint'), /if\(stLsOn\(\)\)\{ stLsPaint\(admin\); return; \}/);
  for (const n of ['stLsOn', 'stLsHeadHtml', 'stLsPanelPaint', 'stLsRepaint', 'ST_LS_PAGES'])
    assert.match(S, new RegExp('Object\\.assign\\(window,\\{[^\\n]*\\b' + n + '\\b'), n + ' is published');
});

test('f1147 (2) one head for all six: way back, title, ask box, chips that hide a nought', () => {
  const h = fn('stLsHeadHtml');
  assert.match(h, /class="sdd-back st-ls-back" data-st-page="" data-sdd-to=/);
  assert.match(h, /filter\(c=>c&&\(c\.k==='all'\|\|c\.n\|\|c\.k===o\.chip\)\)/, 'a chip with nothing behind it is not listed, unless it is the one in front');
  for (const p of ['stLsTeamHtml', 'stLsSheetHtml', 'stLsRolesHtml', 'stLsStreamsHtml', 'stLsDataHtml']) assert.match(fn(p), /stLsHeadHtml\(\{/, p);
  assert.match(D, /window\.stLsHeadHtml\(\{ page: 'look'/, 'the look page wears the same head');
});

test('f1147 (3) no button on a row; the review\'s acts are the panel\'s', () => {
  for (const t of ['stLsTeamTableHtml', 'stLsSheetTableHtml', 'stLsRolesTableHtml', 'stLsSwTableHtml'])
    assert.doesNotMatch(fn(t), /<button/, t + ' draws no button');
  const p = fn('stLsSheetPanel');
  assert.match(p, /data-st-ar="keep" data-st-ar-who=/);
  assert.match(p, /data-st-ar="change" data-st-ar-who=/);
  assert.match(p, /id="st-ar-done"\$\{left\?` disabled aria-disabled="true" title=/, 'mark done is grey with its reason while someone is undecided');
  assert.match(fn('stLsSheetTableHtml'), /st-ls-ticks/);
});

test('f1147 (4) nothing here writes', () => {
  const R = region();
  assert.doesNotMatch(R, /\bapi\(\s*['"`](?:PUT|POST|DELETE|PATCH)/i, 'no write to the server');
  assert.doesNotMatch(R, /\bsaveSettings\(|\bpersist\(|\bsaveState\(/, 'no local save');
});

test('f1147 (5) the old painters hand over while the new page stands', () => {
  assert.match(fn('stSwRepaint'), /^function stSwRepaint\(\)\{\s*if\(stLsOn\(\)&&document\.querySelector\('#set-page\.st-ls-page'\)\)\{ stLsRepaint\(\); return; \}/);
  assert.match(fn('stArRepaint'), /stLsOn\(\)&&document\.querySelector\('#set-page\.st-ls-page'\)\) stLsRepaint\(\); else renderTeam\(\)/);
  assert.match(fn('stJbFeedRepaint'), /stLsPanelPaint\(\); return;/);
  assert.match(fn('stJbDataRepaint'), /stLsPanelPaint\(\); return;/);
  assert.match(fn('stnPanelPaint'), /stLsPanelPaint\(\); return;/);
  assert.match(fn('stTrailPaint'), /getElementById\('st-ls-trbtn'\)/);
});

test('f1147 (6) How our contracts look keeps its editing', () => {
  const i = D.indexOf('function clPageHtml()'), f = D.slice(i, D.indexOf('\nfunction clRepaint', i));
  const ls = f.slice(f.indexOf('window.stLsOn()'), f.indexOf('const acts = admin'));
  for (const part of ['clSheetHtml()', "clNotesHtml('l')", "clNotesHtml('r')", 'clPickHtml()', 'clOthersHtml()', 'clChipsHtml()', 'id="cl-save"', 'id="cl-say"'])
    assert.ok(ls.includes(part), part + ' is still drawn');
  assert.match(D, /function clModeGo\(m\) \{ if \(!_cl\) clInit\(\); if \(!clAdmin\(\)\) return;/, 'the panel\'s rows open a setting only for an admin');
  assert.match(D, /Object\.assign\(window, \{[^\n]*clFacts, clModeGo/);
});

test('f1147 (7) every word in both books; the styles stay inside the page and the panel', () => {
  const R = region() + D;
  const keys = new Set([...R.matchAll(/i18tn?\('(st_ls_[a-z_]+|bz_page_sub_line)'/g)].map(m => m[1]));
  assert.ok(keys.size > 40, 'the words are read (' + keys.size + ')');
  const sv = I.indexOf('sdd_sub_setup: "Att göra HaTi redo');
  assert.ok(sv > 0);
  const en = I.slice(0, sv), se = I.slice(sv);
  const has = (book, k) => book.includes('\n    ' + k + ': "') || book.includes('\n    ' + k + '_one: "');
  const missing = [...keys].filter(k => !has(en, k) || !has(se, k));
  assert.deepEqual(missing, [], 'in English and in Swedish');
  const a = CSS.indexOf('html.lg-new .st-ls-page .st-ls-main'), b = CSS.indexOf('html.lg-new .sdd5-p .jov5[data-jov-slot="stn"] .jov5-title', a);
  assert.ok(a > 0 && b > a, 'the block is there');
  const rules = CSS.slice(a, b).split('\n').map(l => l.trim()).filter(l => l.startsWith('html.lg-new') || l.startsWith('@media'));
  const stray = rules.filter(l => !/\.st-ls-page|\.st-ls-p\b/.test(l));
  assert.deepEqual(stray, [], 'every rule is scoped to the six pages or their panel');
  assert.doesNotMatch(CSS.slice(a, b), /!important/);
});
