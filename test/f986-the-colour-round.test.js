'use strict';
/* f986 — THE COLOUR ROUND (owner, 9 Nov 2026, picked by press in the colour picker: "Parties: Kind chips · People:
   Workload bars · Reads: Answer colours · Requests: Age colour · Our paper: Use bars · Calendar: Kind labels · Settings:
   On / Off pills"). One quiet touch of colour per page, each read off a fact the page already has; the new look only.
   At the parent every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const CSS = read('index.html'), I18N = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i)); };

test('Parties: kind chips, initials in the stream\'s tone, what waits in amber', () => {
  const f = fnBody(read('js/views/customers.js'), 'cunRowHtml');
  assert.match(f, /listChipHtml\(toneOf\(f\), shortOf\(f\)\)/);
  assert.match(f, /class="cun-av is-\$\{avTone\}"/);
  assert.match(f, /cun-wait\$\{words \? ' is-owed' : ''\}/);
  assert.match(CSS, /html\.lg-new td\.cun-wait\.is-owed\{color:var\(--st-amber-fg\)\}/);
});
test('People: a workload bar to scale', () => {
  const S = read('js/views/directory.js');
  assert.match(fnBody(S, 'dirnRowHtml'), /dirnLoadBarHtml\(ids\.length\)/);
  assert.match(S, /_dirnMost = Math\.max\(0, \.\.\.ours\.concat\(theirs\)/);
  assert.match(CSS, /html\.lg-new \.dirn-load\{/);
});
test('Reads: answers as tinted chips, a progress bar', () => {
  const S = read('js/views/reads.js');
  /* RE-POINTED 15 Nov 2026 (the new Discover): what a read found is one tinted chip; New read's folders carry the green bar */
  assert.match(S, /const _dsnChip = \(t, w\) => \(typeof listChipHtml === 'function'\) \? listChipHtml\(_dsnTone\(t\), w\)/);
  assert.match(fnBody(S, 'dsnFound'), /_dsnChip\('ruby'/);
  assert.match(fnBody(S, 'dsnNewHtml'), /class="rdn-prog"/);
  assert.match(CSS, /html\.lg-new \.rdn-prog i\{[^}]*--st-green-dot/);
});
test('Requests: today green, a week or more amber', () => {
  const S = read('js/views/intake.js');
  assert.match(fnBody(S, 'iknAgeTone'), /days <= 1 \? ' is-fresh' : days >= IKN_OLD_DAYS \? ' is-old' : ''/);
  assert.match(fnBody(S, 'iknRowHtml'), /cun-wait ikn-age\$\{iknAgeTone\(r\)\}/);
  assert.match(CSS, /html\.lg-new td\.cun-wait\.ikn-age\.is-old\{color:var\(--st-amber-fg\)\}/);
});
/* REVERSED 14 Nov 2026 (owner's pick, Our paper the Legora way): the uses are said in small type on the right of each
   row, and the colour is the stream's own mark (f1049) */
test('Our paper: each row\'s uses said on the right, the stream\'s colour on its mark', () => {
  const f = fnBody(read('js/views/library.js'), 'tplnRowHtml');
  assert.match(f, /<span class="tpln-u">\$\{_tplEsc\(i18tn\('tpln_uses', uses, \{ n: uses \}\)\)\}<\/span>/);
  /* RE-POINTED 17 Nov 2026 (#762): the stream's colour is its tone's soft pair, readable (contrast-verify: white on the dot failed AA) */
  assert.match(f, /background:var\(--st-\$\{tone\}-bg\);color:var\(--st-\$\{tone\}-fg\)/);
});
test('Calendar: kind labels read off the record, both books', () => {
  const S = read('js/views/calendar.js');
  assert.match(fnBody(S, 'calAgKindOf'), /if\(e\.type==='obligation'\) return e\.theirs\?'theirs':'due';/);
  assert.match(S, /list\.map\(textOf\)\.join\(' · '\), underOf\(first\), actOf\(first\), '', d, calAgKindOf\(first\)\)/);
  for (const k of ['approve', 'due', 'theirs', 'decide', 'ends']) assert.equal((I18N.match(new RegExp('cal_kind_' + k + ':', 'g')) || []).length, 2, k + ' in both books');
});
test('Settings: on / off pills off the panel\'s own reading', () => {
  const S = read('js/views/settings.js');
  assert.match(S, /function stnStateText\(k\)\{ const st=stStateOf\(k\); return st&&st\.text\?stnPill\(esc\(stShortState\(st\.text\)\), st\.dot\):''; \}/);
  assert.match(fnBody(S, 'stnPushSaid'), /ps==='blocked'\?'need'/);
  /* the Legora way (owner's pick, 13 Nov 2026): the state is a dot and a word, still in its tone */
  assert.match(CSS, /html\.lg-new \.stn-dot\.is-on\{color:var\(--st-green-fg\)\}/);
});
