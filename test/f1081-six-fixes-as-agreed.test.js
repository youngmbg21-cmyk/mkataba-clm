'use strict';
/* f1081 — SIX FIXES, AS AGREED (owner, 16 Nov 2026, off five screenshots and the redrawn artifact; "Yes, build all six"):
   1. New agreement: a long text ran into the pill's round ends. One line is a pill, more is a box; a paste's line
      breaks are joined.
   2. Negotiations: "every line is grey … the side panel information should reflect the contract you have pressed."
      White rows, the chosen one grey; the panel is the pressed round alone; a row chooses in the list and the panel.
   3. Recent pages: "the shading of the options is off." One shade, the row under the pointer.
   4. Import: "locked on this page" (the check screen's bar was hidden) and "used to have stats … and the level of
      confidence for each contract": the bar shows, Esc goes back, five figures and How sure.
   5. Redlines: "the redline cards should be the focal point": Cards first, one line then the cards.
   6. Clauses: "remove the orange highlights and reduce the font … by one size".
   Source-sliced, comments stripped; the two small readings run. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const raw = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const read = f => strip(raw(f));
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, 'missing ' + name);
  let d = 0; for (let k = src.indexOf('{', i); k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}'){ d--; if (!d) return src.slice(i, k + 1); } } return ''; };
const HTML = read('index.html');

test('f1081 (1) the ask box: one line a pill, more a box; a paste\'s line breaks are joined', () => {
  const W = read('js/wizard.js');
  assert.match(fnSrc(W, 'naSayFit'), /box\.classList\.toggle\('is-many', !one\)/, 'the frame is told how tall its words stand');
  assert.match(HTML, /html\.lg-new #na-root\.na-one \.na-askbox\.is-many\{border-radius:var\(--radius\);padding:16px 12px 12px 16px/, 'several lines: the one corner, 16px inside');
  assert.match(W, /say\?\.addEventListener\('paste',e=>\{ const t=naPasteJoined\(e\); if\(t==null\) return;/);
  const join = new Function(fnSrc(raw('js/wizard.js'), 'naPasteJoined') + '; return naPasteJoined;')();
  const ev = t => ({ clipboardData: { getData: () => t } });
  assert.equal(join(ev('one line')), null, 'no line break: the browser\'s own paste stands');
  assert.equal(join(ev('countries as the director.\nI have 73 people \r\n the network')), 'countries as the director. I have 73 people the network');
});

test('f1081 (2) Negotiations: white rows, one grey; the panel is the pressed round; a row chooses everywhere', () => {
  assert.ok(!/\.ngn-table tr\.is-yours td\{background/.test(HTML), 'no grey wash on every "your move" row');
  assert.match(HTML, /html\.lg-new \.ngn-table tr\.is-sel td\{background:var\(--surface-2\)\}/, 'the chosen row is shaded, whoever\'s move it is');
  const R = read('js/views/register.js'), p = fnSrc(R, 'ngnPanelFiveHtml');
  const chosen = p.slice(p.indexOf('if (r){'), p.indexOf('const pick = '));
  assert.match(chosen, /title: c\.name \|\| ''/, 'its name is the headline');
  assert.match(chosen, /ngn5c_g_unsent[\s\S]*ngn5c_g_asks[\s\S]*ngn5c_g_round/, 'its three numbers');
  assert.ok(!/ngnPageSay|ngn5_t_you/.test(chosen), 'nothing of the page\'s totals on a chosen round');
  assert.match(p, /attr: `data-ngn-pick="\$\{E\(x\.c\.id\)\}"`/, 'the overview\'s rows choose');
  assert.match(R, /if \(\(el = t\.closest\('\[data-ngn-pick\]'\)\)\)\{ e\.preventDefault\(\); _ngnSel = el\.getAttribute\('data-ngn-pick'\); _ngnNone = false; ngnRepaint\(\); return; \}/);
  assert.match(R, /ph\._jlBack = \(\) => \{[^\n]*_ngnSel = null; _ngnNone = true; ngnRepaint\(\);/, 'the tab is the way back to the overview');
});

test('f1081 (3) the recent pages menu: one shade, the row under the pointer', () => {
  assert.match(HTML, /\.dk-r\.is-on\{background:none\}/, 'the page you are on wears no shade');
  assert.match(HTML, /\.dk-r\.is-on \.dk-r-t\{font-weight:var\(--w-strong\)\}/, 'it says so by its tick and a bolder name');
  assert.match(HTML, /\.dk-r:hover\{background:var\(--surface-2\)\}/, 'the whole row under the pointer');
  assert.match(HTML, /\.dk-r-go:hover\{background:none\}/, 'never a second, narrower band');
});

test('f1081 (4) Import: the check screen\'s bar shows, Esc goes back, the figures and How sure are drawn', () => {
  assert.match(HTML, /html\.lg-new \.mig-page:not\(\.is-checking\):not\(:has\(table\)\) #mig-band\{display:none\}/, 'the band is hidden only off the check screen');
  assert.ok(!/html\.lg-new \.mig-page:not\(:has\(table\)\) #mig-band\{display:none\}/.test(HTML));
  const M = read('js/views/migration.js');
  assert.match(M, /e\.key !== 'Escape' \|\| e\.defaultPrevented \|\| !_migCheck/); assert.match(M, /e\.preventDefault\(\); migCheckClose\(\);/);
  assert.match(fnSrc(M, 'migNlPageHtml'), /\$\{migNlFigsHtml\(\)\}/, 'the figures stand over the list');
  assert.match(fnSrc(M, 'migNlFigsHtml'), /return n \? `<button type="button" class="mign-fig[^`]*data-mign-fig="\$\{key\}"[^`]*` : `<span class="mign-fig is-zero">/, 'a figure of nothing is no door');
  assert.match(fnSrc(M, 'migNlRowHtml'), /\$\{migSureCellHtml\(c\)\}/);
  const sure = new Function('migSideFacts', fnSrc(raw('js/views/migration.js'), 'migSureOf') + '; return migSureOf;');
  const of = facts => sure(() => facts)({});
  const F = (found, low) => [0, 1, 2, 3, 4].map(i => ({ missing: i >= found, unsure: i < low }));
  assert.deepEqual(of(F(5, 0)), { n: 5, of: 5, level: 'high' });
  assert.deepEqual(of(F(4, 1)), { n: 3, of: 5, level: 'med' }, 'found, but one doubted');
  assert.deepEqual(of(F(2, 0)), { n: 2, of: 5, level: 'low' });
  assert.equal(sure(() => [])({}), null, 'nothing asked, nothing said');
});

test('f1081 (5) Redlines: cards first — no headline on Changes, Send all ends the one line', () => {
  const N = read('js/views/negotiation.js'), f = fnSrc(N, 'rlFiveHead');
  assert.ok(!/jov5_rl_unsent_t|jov5HeadHtml\(\{ title/.test(f), 'no serif headline on Changes');
  assert.match(N, /`<div class="rl-five-act is-line">\$\{sendH\}<\/div>`/);
  assert.match(HTML, /#rl-changes-col\.is-five:not\(\.is-ladder-face\):not\(\.is-notes-face\) :is\(\.rl-idx-title, \.rl-idx-br\)\{display:none\}/, 'the count and the round share one line with Send all');
  assert.match(HTML, /\.rl-five-act\.is-line\{flex:0 0 auto;display:block;margin:0;padding:0;border-radius:0;background:none\}/, 'no card round the button');
});

test('f1081 (6) Clauses: no orange sentence on a row; the name and the plain English one size smaller', () => {
  const B = read('js/views/breakdown.js');
  assert.match(B, /const say = stkNewLookOn\(\) && !live \? \(mine\.find\(p => p\.status === 'fine'\) \|\| null\) : null;/, 'a clause with something live says no sentence on its row');
  assert.match(B, /: \(words && !stkNewLookOn\(\)\) \? \[`<span class="stk-n is-\$\{words\.worst\}">/, 'nor its count in amber');
  assert.match(HTML, /\.doc-th-lbl ~ \.doc-th-rows \.doc-th-row \.doc-th-name\{flex:1;min-width:0;font-size:13px\}/);
  assert.match(HTML, /\.doc-th-row\.is-open \.doc-th-plain\{font-family:var\(--font-doc\);font-size:13px;/);
});

test('f1081 (7) every new word in both books', () => {
  const I = raw('js/i18n.js'), sv = I.search(/\n {2}sv\s*:\s*\{/), EN = I.slice(0, sv), SV = I.slice(sv);
  for (const k of ['ngn5c_g_unsent_one', 'ngn5c_g_unsent_other', 'ngn5c_g_asks_one', 'ngn5c_g_asks_other', 'ngn5c_g_round', 'mign_c_sure', 'mign_sure_high', 'mign_sure_med', 'mign_sure_low', 'mign_sure_n',
    'mign_fig_files_one', 'mign_fig_files_other', 'mign_fig_filed', 'mign_fig_check', 'mign_fig_dupe', 'mign_fig_none'])
    for (const [b, w] of [[EN, 'en'], [SV, 'sv']]) assert.ok(new RegExp('\\b' + k + ':').test(b), k + ' in ' + w);
});
