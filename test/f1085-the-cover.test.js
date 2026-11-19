'use strict';
/* f1085 — THE COVER (owner picked "Margin Notes" by name, 16 Nov 2026; drawn at five stages, "build it")
   1 · One reading (pdCoverOf) and one builder (pdCoverHtml): the sheet (parties, three facts each only where held,
       value only where money passes), at most CV_NOTES_MAX margin notes, the headline by stage, the Dossier's six stages,
       ONE count with its door, Lately and Coming up two rows each, Open the dossier the largest button, the brief beside.
   2 · Only a door that opens the contract on purpose shows it: pdOpenOnHome(id, 'open') and roomHomeLand(id, {cover:true});
       a door on its way to a job lands on the paper alone ({cover:false}); typed "paper" asks for the paper.
   3 · It replaces our "Where the deal stands" page: pd2StandsOpen opens the Cover.
   4 · Its words are in both books; the Handbook and the flow map say it.
   At the parent every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PD = strip(read('js/paperdesk.js'));
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

test('f1085 (1) one reading, one builder, the parts as drawn', () => {
  assert.match(PD, /const CV_NOTES_MAX = 3, CV_ROWS_MAX = 2, CV_PARTIES_SHOWN = 6;/);
  const of = fn(PD, 'pdCoverOf');
  assert.match(of, /dossierOf\(c\)/); assert.match(of, /dealStands\(c\)/); assert.match(of, /negWhoseMove\(c\)/);
  assert.match(of, /stage = executed \? 'live' : signedN > 0 \? 'sign' : W\.k === 'you' \? 'you' : W\.k === 'them' \? 'them' : !sent \? 'draft' : 'quiet'/);
  assert.match(of, /notes: notes\.slice\(0, CV_NOTES_MAX\)/); assert.match(of, /coming: coming\.slice\(0, CV_ROWS_MAX\)/);
  const sheet = fn(PD, 'pdCoverSheetHtml');
  assert.match(sheet, /isMonetary\(c\)/, 'value only where money passes');
  assert.match(sheet, /\]\.filter\(Boolean\)/, 'a fact not held is left out');
  const right = fn(PD, 'pdCoverRightHtml');
  assert.equal((right.match(/class="cv-count/g) || []).length, 1, 'ONE count');
  assert.match(right, /data-cv-open data-cv-cid=/, 'Open the dossier goes into the contract (f1099: the Cover is a page of its own, not laid over the paper)');
  assert.match(right, /V\.D\.stages\.map/, 'the Dossier\'s six stages');
  assert.doesNotMatch(right, /asks\.map\(|asks\.forEach\(/, 'the clauses are counted, never listed');
});

test('f1085 (2) only a door that opens the contract on purpose shows it', () => {
  const o = fn(PD, 'pdOpenOnHome');
  assert.match(o, /if \(tab === 'open' && !\(o && o\.cover === false\)\)\{ if \(pdCoverGo\(id\)\) return true; const ok = pdOpenOnHome\(id, 'open', \{ cover: false \}\); if \(ok\) pdCoverLand\(id\); return ok; \}/, 'the Cover as its own page first (f1099), else over the paper');
  const R = strip(read('js/views/contract.js'));
  assert.match(R, /const ok=!!pdOpenOnHome\(c\.id,mine==='jambo'\?'plain':'open',\{ cover:false \}\);\s*if\(ok&&opts&&opts\.cover&&typeof window\.pdCoverLand==='function'\) window\.pdCoverLand\(c\.id\);/);
  for (const [f, re] of [['js/views/register.js', /roomHomeLand\(id,\{ cover:true \}\)/], ['js/views/inspector.js', /roomHomeLand\(c\.id, \{ cover: true \}\)/],
    ['js/views/homeboard.js', /roomHomeLand\(id, \{ cover: true \}\)/], ['js/components.js', /window\.roomHomeLand\(id, \{ cover: true \}\)/],
    ['js/views/boardstrip.js', /roomHomeLand\(id, \{ cover: true \}\)/], ['js/navmap.js', /paper: \(\) => pdOpenOnHome\(id, 'open', \{ cover: false \}\)/]])
    assert.match(strip(read(f)), re, f);
  assert.match(fn(PD, 'pdCoverLand'), /innerWidth < 768/, 'not on the phone');
});

test('f1085 (3) our "Where the deal stands" page is the Cover now', () => {
  assert.match(PD, /function pd2StandsOpen\(id\)\{ return pdCoverOpen\(id\); \}/);
  assert.match(PD, /function pd2StandsUp\(id\)\{ return pdCoverUp\(id\); \}/);
  assert.ok(!/function pd2StandsFaceHtml\(/.test(PD));
  assert.ok(fs.existsSync(path.join(ROOT, 'js/dealstands.js')), 'their status page stays');
});

test('f1085 (4) both books, the Handbook and the map', () => {
  const I = read('js/i18n.js');
  for (const k of ['cv_open', 'cv_h_you', 'cv_h_them', 'cv_h_draft', 'cv_h_sign', 'cv_h_none', 'cv_lately', 'cv_coming', 'cv_c_asks_other', 'cv_stamp_bare'])
    assert.equal((I.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length, 2, k + ' in both books');
  assert.match(read('js/handbook.js'), /lands first on its Cover/);
  assert.match(read('js/flowmap.js'), /shows its Cover first/);
  assert.match(strip(read('index.html')), /\.cv-page\{--cv-pad:[^;]+;display:grid;/);
});
