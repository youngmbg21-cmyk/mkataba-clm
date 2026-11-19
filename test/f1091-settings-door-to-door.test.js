'use strict';
/* f1091 — SETTINGS, DOOR TO DOOR (P-11; the owner picked "Six doors", then "build it with the Dossier card",
   17 Nov 2026). Round 1, as the Parking lot's plan says. Replaces f1045 (the twelve-row list it pinned is gone).
   (1) six areas, in order; the four pages at the old foot sit inside one (People & roles and Streams in Company,
       Trail & backup in Set-up and records; Jambo's lessons a row in Jambo)
   (2) EVERY setting HaTi has is one row in one area: each SET_PANELS key is a row's own door, or its page
   (3) ONE list of what needs you (sddNeedList) feeds the landing's count, an area's count and Jambo's card
   (4) a press chooses, a second press opens through the row's own door; the way back goes to the page's area,
       onto the row that opened it; a refresh keeps the area and the row
   (5) Jambo's panel is the Dossier card on every Settings page (the five parts, the act first)
   (6) nothing here writes: no route is called, every act is an existing door's
   (7) the chosen row is ONE grey band with room inside it; colours by token only
   (8) every new word stands in both books */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const S = read('js/views/settings.js');
const CSS = strip(read('index.html'));
const I = read('js/i18n.js');
const fn = name => { const i = S.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' is there'); const j = S.indexOf('\nfunction ', i + 10); return strip(S.slice(i, j < 0 ? undefined : j)); };
const block = () => { const a = S.indexOf('const SDD_AREAS='); assert.ok(a >= 0, 'the six areas are there'); return strip(S.slice(a, S.indexOf('function stnPaint(admin)', a))); };

test('f1091 (1) six areas in order; the old foot\'s pages inside them', () => {
  assert.match(S, /const SDD_AREAS=\['you','company','rules','jambo','mail','setup'\];/);
  assert.match(S, /const SDD_PAGE_AREA=\{ team:'company', sheet:'company', roles:'company', streams:'company', look:'company', data:'setup'/);
  assert.match(fn('sddJamboRows'), /sddPanelRow\('jambo','knows','lessons'/);
  assert.match(fn('sddSetupRows'), /door:'data-st-page="data"'/);
  assert.match(fn('sddCompanyRows'), /door:'data-st-page="team"'/);
  assert.match(fn('sddCompanyRows'), /door:'data-st-page="streams"'/);
});
test('f1091 (2) every setting HaTi has is one row in one area', () => {
  const keys = [...strip(S.slice(S.indexOf('const SET_PANELS={'), S.indexOf('\n};', S.indexOf('const SET_PANELS={')))).matchAll(/\n  (\w+):\{/g)].map(m => m[1]);
  assert.ok(keys.length >= 30, 'the panels are read (' + keys.length + ')');
  const B = block();
  /* a panel whose own page stands for it: Streams and categories → the Streams page, How our contracts look → its
     page, the backup → Trail & backup */
  const page = { folders: 'data-st-page="streams"', design: 'data-st-page="look"', backup: 'data-st-page="data"' };
  const missing = keys.filter(k => !(new RegExp("sddPanelRow\\('\\w+','\\w+','" + k + "'").test(B) || B.includes(`onoff('${k}'`) || B.includes(`data-st-panel="${k}"`) || (page[k] && B.includes(page[k]))));
  assert.deepEqual(missing, [], 'every setting has its row');
});
test('f1091 (3) one list of what needs you, read by the landing, an area and the card', () => {
  const n = fn('sddNeedList');
  assert.match(n, /rows\.filter\(r=>r\.dot==='need'&&\(!area\|\|r\.area===area\)\)/);
  assert.match(fn('sddAreaState'), /sddNeedList\(/);
  assert.match(fn('sddHeadHtml'), /sddNeedList\(admin, a\|\|null, rows\)\.length/);
  assert.match(fn('sddCardHtml'), /const needs=sddNeedList\(admin, area, rows\)/);
  assert.match(fn('stSyncAttention'), /sddRepaint\(\); return;/, 'colleagues\' asks landing late redraw the areas');
});
test('f1091 (4) a press chooses, a second opens its own door; the way back and a refresh land where you were', () => {
  const B = block();
  assert.match(B, /if\(_sddPick===id\)\{ const b=row\.querySelector\('\[data-sdd-go\]'\); if\(b\)\{ b\.click\(\); return true; \} \}/);
  assert.match(B, /if\(_sddHome===a\) sddGo\(a\); else sddHomeSet\(a\);/);
  assert.match(fn('stPageHeadHtml'), /data-sdd-to="\$\{ar\}"/);
  assert.match(B, /_sddArea=to\.getAttribute\('data-sdd-to'\); _sddPick=to\.getAttribute\('data-sdd-to-row'\)/);
  assert.match(fn('settingsPlace'), /sdd:_sddArea\|\|null, pick:_sddPick\|\|null/);
  assert.match(fn('settingsPlacePut'), /_sddArea=\(p&&SDD_AREAS\.includes\(p\.sdd\)\)\?p\.sdd:null/);
  assert.match(fn('openSettingsAt'), /_sddArea=null; _sddPick=null;/, 'a fresh way in lands on the six areas');
});
test('f1091 (5) Jambo\'s panel is the Dossier card on every Settings page', () => {
  assert.match(fn('stnPanelHtml'), /return sddCardHtml\(admin\);/);
  assert.match(fn('stJbLandHtml'), /newLookOn\(\)&&typeof sddCardHtml==='function'\) return sddCardHtml\(admin,\{ area:sddPageArea\(\), pick:null \}\);/);
  const c = fn('sddCardHtml');
  assert.equal((c.match(/actFirst:true/g) || []).length, 2, 'both faces put the one black button first');
  assert.match(c, /k:i18t\('sdd_f_now'\)[\s\S]*k:i18t\('sdd_f_affects'\)[\s\S]*k:i18t\('sdd_f_who'\)[\s\S]*k:i18t\('sdd_f_history'\)/);
});
test('f1091 (6) nothing here writes', () => {
  const B = block();
  assert.doesNotMatch(B, /\bapi\(|fetch\(|saveSettings\(|persist\(/);
});
test('f1091 (7) one grey band for the chosen row, room inside it, tokens only', () => {
  assert.match(CSS, /html\.lg-new \.sdd-row:hover,html\.lg-new \.sdd-row\.is-chosen\{background:var\(--surface-2\)\}/);
  assert.match(CSS, /html\.lg-new \.sdd-colh,html\.lg-new \.sdd-row\{[^}]*padding-left:12px;padding-right:12px\}/);
  assert.match(CSS, /html\.lg-new \.sdd-row \.sdd-go\.is-black\{background:var\(--color-text\)/);
  const mine = CSS.split('\n').filter(l => /\.sdd-/.test(l)).join('\n');
  assert.doesNotMatch(mine, /#[0-9a-fA-F]{3,8}\b/, 'no hand-typed colour');
});
test('f1091 (8) every new word stands in both books', () => {
  const B = block() + fn('stPageHeadHtml') + fn('sddPeopleTabsHtml');
  const has = k => (I.match(new RegExp('\\n    ' + k + '(_one)?: ', 'g')) || []).length === 2;
  const keys = new Set([...B.matchAll(/i18tn?\('(sdd_[a-z0-9_]+)'[,)]/g)].map(m => m[1]));
  ['you', 'company', 'rules', 'jambo', 'mail', 'setup'].forEach(a => { keys.add('sdd_a_' + a); keys.add('sdd_sub_' + a); });
  for (const m of B.matchAll(/sdd(?:Panel)?Row\((?:\{ id:'\w+', area:'(\w+)', g:'(\w+)'|'(\w+)','(\w+)')/g)) keys.add('sdd_g_' + (m[1] || m[3]) + '_' + (m[2] || m[4]));
  ['signcap', 'signfolder', 'review', 'desk', 'linkcode'].forEach(k => ['_on', '_off', '_sub'].forEach(x => keys.add('sdd_ru_' + k + x)));
  ['daily', 'weekly', 'off'].forEach(x => keys.add('sdd_you_told_say_' + x));
  assert.ok(keys.size > 150, 'the words are found (' + keys.size + ')');
  assert.deepEqual([...keys].filter(k => !has(k)), []);
});
