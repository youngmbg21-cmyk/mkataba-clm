'use strict';
/* f982 — GEIST AGAIN; THE NAME AND THE FIGURE INK, THE DETAIL GREY; THE SAP WAY MARK AT THE HEAD OF EVERY ROW
   (owner, 9 Nov 2026: "change the font back to geist then build this: 1. The words on every list: dark name, grey detail
   … 2. The SAP way mark at the head of every row"; Home, Contracts, Negotiations, Approvals, Obligations, Needs you, the
   contract page's facts and the Redlines cards; "everything on the new look only, behind its switch")
   1 · Inter is gone: no link, no --font-new, no font files; the new look reads Geist like the old (f377)
   2 · ONE mark (listSapMarkHtml): a filled circle in the house's status colour, a white DRAWN glyph; done green tick ·
       your move amber ! · theirs steel i · a real risk ruby cross · nothing yet grey dash · Jambo violet star
   3 · every named list calls it, behind the switch; late is never ruby
   4 · the detail grey (--color-neutral-400) on each named list's second line, dates, kinds and panel labels; names ink
   At the parent every claim but the first half of 1 fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HTML = read('index.html'), CSS = strip(HTML);
const LL = strip(read('js/listlang.js')), CN = strip(read('js/views/counter.js')), REG = strip(read('js/views/register.js'));
const AP = strip(read('js/views/approvalsview.js')), OB = strip(read('js/obligations.js')), NG = strip(read('js/views/negotiation.js'));
const COMP = read('js/components.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i)); };

test('1 · the font is Geist again: no Inter link, token or files', () => {
  assert.doesNotMatch(HTML, /fonts\/inter\.css/);
  assert.doesNotMatch(HTML, /--font-new/);
  assert.doesNotMatch(CSS, /html\.lg-new\{--font-body/);
  assert.ok(!fs.existsSync(path.join(ROOT, 'fonts/inter.css')), 'fonts/inter.css removed');
  assert.match(HTML, /--font-body:'Geist',/);
});

test('2 · ONE mark: a filled circle, a white drawn glyph, the six meanings in their colours', () => {
  const map = LL.slice(LL.indexOf('const LIST_SAP_MARK'), LL.indexOf('function listSapMarkHtml'));
  for (const [k, tone, g] of [['done', 'green', 'mkTick'], ['you', 'amber', 'mkBang'], ['them', 'steel', 'mkInfo'], ['risk', 'ruby', 'mkCross'], ['none', 'gray', 'mkDash'], ['jambo', 'violet', 'mkStar']])
    assert.match(map, new RegExp(k + ": \\['" + tone + "', '" + g + "'\\]"), k);
  assert.match(fnBody(LL, 'listSapMarkHtml'), /icon\(m\[1\], 'ls-mk-g'/, 'a drawn icon, never a typed character');
  for (const g of ['mkTick', 'mkBang', 'mkInfo', 'mkCross', 'mkDash', 'mkStar']) assert.match(COMP, new RegExp('\\n  ' + g + ":'<"), g + ' is drawn');
  const base = CSS.slice(CSS.indexOf('html.lg-new .ls-mk{'), CSS.indexOf('}', CSS.indexOf('html.lg-new .ls-mk{')));
  assert.match(base, /width:20px;height:20px;border-radius:50%/); assert.match(base, /color:var\(--color-surface\)/);
  for (const t of ['green', 'amber', 'steel', 'ruby', 'violet']) assert.match(CSS, new RegExp('html\\.lg-new \\.ls-mk\\.is-' + t + '\\{background:var\\(--st-' + t + '-dot\\)\\}'), t);
  assert.match(LL, /const listSapOn = \(\) => \(typeof newLookOn === 'function'\) && !!newLookOn\(\)/, 'the new look only');
});

test('3 · every named list leads its rows with the mark, behind the switch; late is never ruby', () => {
  assert.match(fnBody(REG, 'regSapMarkHtml'), /listSapMarkHtml\(regSapMarkOf\(c\)/, 'Contracts');
  assert.match(fnBody(REG, 'regNegoMarkHtml'), /listSapOn\(\)\) return listSapMarkHtml\(/, 'Negotiations (the list language row)');
  assert.match(fnBody(REG, 'ngnRowHtml'), /listSapCellHtml\(r\.b === 'you' \? 'you'/, 'Negotiations (the new look row)');
  assert.match(AP, /listSapOn\(\)\)\?listSapMarkHtml\(r\.done\?'done':r\.mine\?'you':'them'/, 'Approvals (the list language row)');
  assert.match(AP, /listSapCellHtml\(r\.done\|\|r\.type==='receipt'\?'done'/, 'Approvals (the new look row)');
  assert.match(fnBody(OB, 'obwRowMarkHtml'), /listSapMarkHtml\(obState\(r\) === 'done' \? 'done'/, 'Obligations (the week)');
  assert.match(fnBody(OB, 'obnRowHtml'), /listSapCellHtml\(obnSapKey/, 'Obligations (the new look row)');
  assert.match(fnBody(CN, 'ndAvHtml'), /listSapOn\(\)\) return ndSapMarkHtml\(r, P\)/, 'Home: the mark replaces the initials');
  assert.match(fnBody(CN, 'ndBoardRowHtml'), /listSapOn\(\) \? ndSapMarkHtml\(r, P\)/, 'Needs you');
  assert.match(NG, /<div class="rl-card-metarow">\$\{rlSapMarkHtml\(band\)\}/, 'the Redlines cards');
  assert.match(NG, /refused: 'risk'/, 'a refusal is the real risk on a card');
  for (const [src, nm] of [[OB, 'obwRowMarkHtml'], [OB, 'obnRowHtml']]) assert.doesNotMatch(fnBody(src, nm).split('listSap')[1] || '', /'risk'/, nm + ': late is never ruby');
  assert.match(CN, /const ndSapKeyOf = \(r, P\) => r\.g === 'jambo' \? 'jambo'/, 'Jambo\'s pieces wear his star');
});

test('4 · the name and the figure ink, the detail grey, on each named list', () => {
  const G = 'color:var\\(--color-neutral-400\\)';
  for (const sel of ['#ct-place \\.reg-sub', 'tr\\[data-ngn-row\\] :is\\(\\.cun-sub', 'tr\\[data-ap-row\\] :is\\(\\.apn-sub', '#obn-body :is\\(\\.obn-sub',
    '#nd-rows :is\\(\\.nd-c-deal', '#pd-glance :is\\(\\.pd2-l', '\\.rl-card :is\\(\\.rl-card-sum', ':is\\(#ig-dock,#ins-panel\\) :is\\(\\.jov-k',
    '\\.apn-panel \\.apn-pr>b', '\\.ndb-r \\.ndb-w>span'])
    assert.match(CSS, new RegExp('html\\.lg-new ' + sel + '[^{]*\\{' + G), sel);
  for (const sel of ['.cn2-ln', '.cn2-fx', '.cn2-say', '.cn2-foot']) {
    const i = CSS.indexOf('html.lg-new #cn2-page ' + sel + '{'); assert.ok(i >= 0, sel);
    assert.match(CSS.slice(i, CSS.indexOf('}', i)), new RegExp(G), 'Home ' + sel);
  }
  assert.match(CSS, /html\.lg-new #cn2-page \.cn2-nm\{[^}]*color:var\(--color-text\)/, 'Home\'s name stays the ink');
  assert.match(REG, /regNl\(\)\?'var\(--color-neutral-400\)':'var\(--color-neutral-700\)'/, 'a contract\'s date is grey');
  assert.match(HTML, /--color-neutral-400:#6A6A6F/, 'the detail grey (5.3 to 1 on white)');
});
