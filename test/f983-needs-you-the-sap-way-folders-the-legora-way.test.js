'use strict';
/* f983 — THE BOARD'S NEEDS YOU, THE SAP WAY; THE FOLDERS AND THEIR PANEL, THE LEGORA WAY
   (owner, 9 Nov 2026, picking by name from the drawn options: "SAP way for the board and legora way for the folders";
   asked first: "reduce the font on the highlighted area and also the space between the first and second column", "the
   side panel design for the listed folders is poorly designed")
   1 · Needs you: the ask 13px regular, the agreement column wider than the ask (2 to 1.25), rows 40px, heads 32px; the
       narrow card keeps its own three columns (the rule waits inside the card's own wide container)
   2 · Folders: one quiet list in the new look (regFolderRowsHtml): the mark, the name, a grey line with what waits in
       words, the bar, "N need you"; the most work first; the press is the tile's own door (data-ctf-folder)
   3 · The folders' panel: two ranked lists, where the work is and where the money is, each row its folder's door; both books
   At the parent every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const CSS = strip(read('index.html')), REG = strip(read('js/views/register.js')), I18N = read('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i)); };

test('1 · Needs you, the SAP way: smaller words, the gap gone', () => {
  assert.match(CSS, /@container ndcard \(min-width:641px\)\{ html\.lg-new :is\(\.nd-cols,\.nd-br\)\{grid-template-columns:minmax\(0,1\.25fr\) minmax\(0,2fr\) 96px 76px;gap:12px\} \}/);
  assert.match(CSS, /html\.lg-new \.nd-c-what b\{font-size:13px;font-weight:400\}/);
  assert.match(CSS, /html\.lg-new \.nd-br\{min-height:40px/);
  assert.match(CSS, /html\.lg-new \.nd-cols\{min-height:32px\}/);
});

/* RE-POINTED 10 Nov 2026: the owner picked "Views first" for the folders (f998), which reverses the Legora-way rows;
   what stands from this ruling is the one builder, the most work first and the folder's own door */
test('2 · the folders: one builder, the most work first, the folder\'s own door (the rows themselves are f998\'s)', () => {
  assert.match(fnBody(REG, 'regFoldersHtml'), /if \(regNl\(\)\) return regFolderRowsHtml\(live, fids, ended, endIds, isAdmin\);/);
  const f = fnBody(REG, 'regFolderRowsHtml');
  assert.match(f, /sort\(\(a, b\) => b\.r\.needN - a\.r\.needN \|\| b\.r\.n - a\.r\.n\)/, 'the most work first');
  assert.match(f, /data-ctf-folder="\$\{esc\(x\.fid\)\}"/, 'the folder\'s own door');
  assert.match(CSS, /html\.lg-new \.ctf-rl\{[^}]*color:var\(--color-neutral-400\)/, 'the line is the detail grey');
});

test('3 · the folders\' panel: where the work is, where the money is', () => {
  const p = fnBody(REG, 'regFolderRanksHtml');
  assert.match(p, /list\('ctfp_work', work/); assert.match(p, /list\('ctfp_money', rich/);
  assert.match(p, /class="ctfp-rk" data-ctf-folder=/, 'each row its folder\'s door');
  assert.match(fnBody(REG, 'regFoldersPanelHtml'), /regNl\(\) \? regFolderRanksHtml\(rows, short, money\)/);
  assert.match(I18N, /ctfp_work: 'Where the work is'/); assert.match(I18N, /ctfp_work: 'Där arbetet finns'/);
  assert.match(I18N, /ctfp_money: 'Where the money is'/); assert.match(I18N, /ctfp_money: 'Där pengarna finns'/);
});
