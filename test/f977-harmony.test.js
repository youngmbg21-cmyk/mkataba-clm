'use strict';
/* f977 — THE HARMONY REVIEW (owner's picks saved 9 Nov 2026, docs/PLAN-harmony.md; built behind the new-look switch).
   Round 1, every page:
   (1) ONE HEAD: Approvals and Obligations draw their own new-look title and the page head steps aside for them; the
       pages still on their own head take the same serif 26 through one pair of tokens, the old look's 20 kept.
   (2) PILL TO ACT, LINK TO GO: Parties' rows carry no "Open party" and People's no "Email" (both stay in the panel);
       the black act is the chosen row's only.
   (3) ONE VOICE: in the new look a panel tab carries a number only when the page counts its own list; Home's panel
       has no "Jambo" on each note and no "Likely next".
   (4) SAY IT ONCE: a column that reads the same on every row steps out (Approvals' rests, People's reach).
   (5) ONE COUNT: Home's sentence leads with the whole; Obligations' title count is its first tab's.
   (6) THE FOOT FOLLOWS and (7) ONE THING WHEN EMPTY live in the HARMONY block, every rule under html.lg-new. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('function ' + name + '\\(')); assert.ok(i >= 0, name + ' exists'); return src.slice(i, src.indexOf('\n}', i) + 2); };
const HTML = read('index.html');
const block = () => { const i = HTML.indexOf('/* ==== THE NEW LOOK: HARMONY'); assert.ok(i > 0, 'the HARMONY block is there'); return HTML.slice(i, HTML.indexOf('</style>', i)); };

test('f977 (1) one head', () => {
  const app = read('js/app.js');
  assert.match(app, /\(\(view==='approvals'\|\|view==='obligations'\)&&typeof window\.newLookOn==='function'&&newLookOn\(\)&&typeof insFits==='function'&&insFits\(\)\)/, 'the page head steps aside for both');
  assert.match(strip(fnBody(read('js/views/approvalsview.js'), 'apnRender')), /<div class="cun-head"><h2 class="ctf-h">\$\{esc\(i18t\('nav_approvals'\)\)\}<\/h2><span class="ctf-hf" id="page-head-facts">/);
  assert.match(strip(fnBody(read('js/obligations.js'), 'obnRender')), /<div class="cun-head"><h2 class="ctf-h">\$\{_obEsc\(i18t\('nav_obligations'\)\)\}<\/h2>/);
  for (const f of ['js/app.js', 'js/views/library.js']) assert.match(read(f), /font-size:var\(--ph-title-size,20px\);font-weight:var\(--ph-title-w,var\(--w-title-serif\)\)/, f + ': the old look keeps 20');
  assert.match(block(), /html\.lg-new\{--ph-title-size:26px;--ph-title-w:400\}/);
});

test('f977 (2) pill to act, link to go', () => {
  assert.doesNotMatch(strip(fnBody(read('js/views/customers.js'), 'cunRowHtml')), /data-cun-open/, 'no Open party in a row');
  assert.doesNotMatch(strip(fnBody(read('js/views/directory.js'), 'dirnRowHtml')), /data-dirn-mail/, 'no Email in a row');
  assert.match(read('js/views/directory.js'), /data-dirn-mail="\$\{E\(p\.key\)\}"/, 'Email stays in the panel');
  assert.match(block(), /tr:not\(\.is-sel\) \.apn-acts \.apn-ok/, 'black only on the chosen row');
});

test('f977 (3) one voice', () => {
  assert.match(strip(fnBody(read('js/views/inspector.js'), 'jlHeadPaint')), /opt\.tabCount != null \? Number\(opt\.tabCount\) \|\| 0 : \(\(typeof window\.newLookOn === 'function' && newLookOn\(\)\) \? 0 : jlCount\(\)\)/);
  const cn = read('js/views/counter.js');
  assert.doesNotMatch(cn, /cn2-who-j/, 'no Jambo on each note');
  assert.match(cn, /after: ready \+ turns \};/, 'no Likely next in the panel');
  assert.match(read('js/paperdesk.js'), /igHomePaperFace\(\) === true && !pdContract\(\) && !\(typeof window\.newLookOn === 'function' && newLookOn\(\)\);/);
});

test('f977 (4) say it once', () => {
  const ap = strip(fnBody(read('js/views/approvalsview.js'), 'apnRender'));
  assert.match(ap, /const same=rs\.length>1&&rs\.every\(x=>x!=null&&x===rs\[0\]\);/);
  assert.match(ap, /\$\{same\?'':`<th>\$\{esc\(i18t\('apn_col_rests'\)\)\}<\/th>`\}/);
  assert.match(strip(fnBody(read('js/views/directory.js'), 'dirnRender')), /const reachAny = list\.some/);
  assert.match(strip(fnBody(read('js/views/customers.js'), 'cunRowHtml')), /const org = rec\.orgNo \? i18t\('cun_org', \{ n: rec\.orgNo \}\) : '';/);
});

test('f977 (5) one count', () => {
  assert.match(strip(fnBody(read('js/views/counter.js'), 'cn2Say')), /const s = many \? _cnTn\('cn2_s_you', L\.length, \{ n: L\.length \}\) \+ ': ' \+ all : all;/);
  assert.match(strip(fnBody(read('js/obligations.js'), 'obnRender')), /open = book\.filter\(r => obnTabOf\(r, 'open'\)\)\.length;/);
});

test('f977 (6, 7) the foot follows, one thing when empty — every HARMONY rule waits on the switch', () => {
  const b = strip(block());
  assert.match(b, /html\.lg-new \.apn-card > \.apn-foot, html\.lg-new \.ctf-foot\{margin-top:0\}/);
  assert.match(b, /html\.lg-new \.cun-page\.is-empty :is\(\.apn-bar, thead, \.apn-foot\)\{display:none\}/);
  assert.match(b, /html\.lg-new \.mig-page:not\(:has\(table\)\) #mig-band\{display:none\}/);
  assert.doesNotMatch(b, /!important/);
  const rules = [...b.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m => m[1].trim()).filter(s => s && !/^@media/.test(s));
  assert.ok(rules.length > 10);
  for (const r of rules) assert.match(r.replace(/^@media[^{]*\{\s*/, ''), /^html\.lg-new\b/, r);
});
