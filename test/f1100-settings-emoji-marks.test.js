'use strict';
/* f1100 — EVERY SETTINGS ROW AND AREA WEARS AN EMOJI FOR WHAT IT IS; JAMBO'S BLACK BUTTON LIES ACROSS ITS GREY CARD
   (owner, 19 Nov 2026: "id prefer them to be emojis reflecting the title of the line and in line with other emojis
   in hati", "the change buttons to go across the card … any black buttons that go inside the bigger grey card").
   (1) ONE map SDD_EMOJI: an emoji for each of the six areas and every row sddRows can draw
   (2) a row and an area draw their emoji through ONE mark builder; needing you keeps the emoji and adds a dot,
       the old amber "!" circle is gone
   (3) the mark is never a button's words (f385 stands)
   (4) the black button in Jambo's grey card goes across the card; tokens only */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const S = strip(read('js/views/settings.js'));
const CSS = strip(read('index.html'));
const map = () => { const i = S.indexOf('const SDD_EMOJI='); assert.ok(i >= 0, 'the emoji map is there'); return S.slice(i, S.indexOf('};', i) + 2); };

test('f1100 (1) one emoji for each area and every row', () => {
  const M = map();
  for (const a of ['you', 'company', 'rules', 'jambo', 'mail', 'setup']) assert.match(M, new RegExp('area:\\{[^}]*\\b' + a + ":'[^']+'"), a);
  const blk = S.slice(S.indexOf('const SDD_AREAS='), S.indexOf('function stnPaint(admin)'));
  const ids = new Set([...blk.matchAll(/sddRow\(\{ id:'([\w-]+)'/g), ...blk.matchAll(/sddPanelRow\('\w+','\w+','([\w-]+)'/g)].map(m => m[1].replace(/\d+$/, '')));
  assert.ok(ids.size > 30, 'the rows are read (' + ids.size + ')');
  const row = M.slice(M.indexOf('row:{'));
  const missing = [...ids].filter(id => !new RegExp("(?:[{,\\s])'?" + id.replace(/-/g, '\\-') + "'?:'[^']+'").test(row));
  assert.deepEqual(missing, [], 'every row has its emoji');
});
test('f1100 (2) one mark builder; needing you adds a dot, never the "!" circle', () => {
  assert.match(S, /function sddMarkHtml\(r\)\{ return sddMkHtml\(sddEmojiOf\(r\.id, r\.area\), r\.area, r\.dot==='need'\); \}/);
  assert.match(S, /const mk=sddMkHtml\(SDD_EMOJI\.area\[a\], a, st\.dot==='need'\);/);
  assert.doesNotMatch(S, /sdd-mk is-need" aria-hidden="true">!</);
  assert.match(CSS, /html\.lg-new \.sdd-mk\.is-need::after\{content:"";position:absolute;top:0;right:0;width:10px;height:10px;border-radius:50%;background:var\(--st-amber-dot\)/);
});
test('f1100 (3) the mark is never inside a button', () => {
  const f = S.slice(S.indexOf('function sddMkHtml('), S.indexOf('\n', S.indexOf('function sddMkHtml(')));
  assert.match(f, /<span class="sdd-mk is-emo/);
  assert.doesNotMatch(f, /<button/);
});
test('f1100 (4) the black button lies across the grey card', () => {
  assert.match(CSS, /html\.lg-new \.jov5-act \.jov5-acts\{flex-direction:column;align-items:stretch;/);
  assert.match(CSS, /html\.lg-new \.jov5-act \.jov5-acts > \.jov5-go\{width:100%;/);
  const mine = CSS.split('\n').filter(l => /\.sdd-mk|\.jov5-act \.jov5-acts/.test(l)).join('\n');
  assert.doesNotMatch(mine, /#[0-9a-fA-F]{3,8}\b/);
});
