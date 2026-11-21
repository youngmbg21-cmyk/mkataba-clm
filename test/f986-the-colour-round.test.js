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
  /* RE-POINTED 19 Nov 2026 (the SAP way, revised): the streams have their own column, the first one a chip in its tone */
  assert.match(f, /listChipHtml\(toneOf\(v\.streams\[0\]\), streamNames\[0\]\)/);
  assert.match(f, /class="cun-av is-\$\{avTone\}"/);
  assert.match(f, /cun-wait\$\{ws \? ' is-owed' : ''\}/);
  assert.match(CSS, /html\.lg-new td\.cun-wait\.is-owed\{color:var\(--st-amber-fg\)\}/);
});
/* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): the pink workload bar is gone ("no pink
   bar"); the colour is the side — initials and the role's soft badge green for our team, steel for the other side — and
   an amber badge only where something waits on them */
test('People: the side in colour, what waits in amber', () => {
  const S = read('js/views/directory.js');
  assert.doesNotMatch(S, /dirnLoadBarHtml|_dirnMost/);
  assert.match(fnBody(S, 'dirnRowHtml'), /const tone = ours \? 'green' : 'steel';/);
  assert.match(fnBody(S, 'dirnRowHtml'), /class="cun-av is-\$\{tone\}"/);
  assert.match(fnBody(S, 'dirnRowHtml'), /w\.length \? `<span class="apn-st is-amber">/);
  assert.doesNotMatch(CSS, /html\.lg-new \.dirn-load\{/);
  assert.match(CSS, /html\.lg-new \.cun-av\.is-green\{/);
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
  /* RE-POINTED (P-32): the Waiting column is red past a week (the badge says "No one yet · N days") */
  assert.match(fnBody(S, 'iknRowHtml'), /late \? `<span class="late">/);
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
  /* RE-POINTED (P-11, 17 Nov 2026: the six areas): what a setting is set to is read off the panel's own state
     (sddState: ok → on, warn → need, off → off), a blocked phone still amber, drawn as a dot and a word in its tone */
  assert.match(fnBody(S, 'sddState'), /dot:st\.dot==='ok'\|\|st\.dot==='on'\?'on':st\.dot==='warn'\?'need':st\.dot==='off'\?'off':''/);
  assert.match(fnBody(S, 'sddYouRows'), /ps==='blocked'\?'need'/);
  assert.match(CSS, /html\.lg-new \.sdd-v\.is-on\{color:var\(--st-green-fg\)\}/);
});
