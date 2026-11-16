/* f1076 — NO STUTTER BETWEEN CONTRACTS, A CHART FADES IN ONCE, AND THE BOOK ANSWERS ITS OWN QUESTIONS (owner, 16 Nov
   2026: "also fix the stutters, which I am still seeing"; "Review all the buttons in the jambo panels and make sure
   they work using common sense"):
     1 every contract is ONE page to the arrival watcher: going from one contract to the next does not replay it
     2 the Board draws a chart's fade-in only the first time that very picture is drawn (hbChartsStill)
     3 the Handbook panel's "How do I…?" opens the chapter that answers it (hbkFind), in both books
   At the parent (1)–(3) fail: the key was 'c:' + the contract's id, no hbChartsStill, the questions went to Jambo
   (and from there to the Contracts page or Settings).
   Run: node --test test/f1076-panels-arrive-once-and-the-book-answers.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const body = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return strip(src.slice(i, src.indexOf('\n}', i) + 2)); };

test('f1076 (1) every contract is one page to the arrival', () => {
  const b = body(read('js/components.js'), 'jovPageKeyOf');
  assert.match(b, /if \(c && c\.id\) return 'c';/);
  assert.doesNotMatch(b, /'c:' \+ c\.id/);
});

test('f1076 (2) driven: a chart drawn again stands still', () => {
  const HB = read('js/views/homeboard.js');
  assert.match(body(HB, 'hbPaintBoard'), /hbMorph\(host, hbBoardHtml\(\)\);\s*hbChartsStill\(host\);/);
  const i = HB.indexOf('const _hbChartsSeen'); assert.ok(i >= 0);
  const src = HB.slice(i, HB.indexOf('\n}', HB.indexOf('function hbChartsStill(')) + 2);
  const mkSvg = html => { const gs = [{ cl: new Set(['hb-in']) }, { cl: new Set(['hb-in']) }];
    gs.forEach(g => { g.classList = { remove: k => g.cl.delete(k) }; });
    return { outerHTML: html, gs, querySelector: () => (gs.some(g => g.cl.has('hb-in')) ? gs[0] : null), querySelectorAll: () => gs.filter(g => g.cl.has('hb-in')) }; };
  const still = new Function(src + '\nreturn hbChartsStill;')();
  const a = mkSvg('<svg>A</svg>'); still({ querySelectorAll: () => [a] });
  assert.equal(a.gs.filter(g => g.cl.has('hb-in')).length, 2, 'first drawing fades in');
  const a2 = mkSvg('<svg>A</svg>'); still({ querySelectorAll: () => [a2] });
  assert.equal(a2.gs.filter(g => g.cl.has('hb-in')).length, 0, 'the same picture again stands still');
  const b = mkSvg('<svg>B</svg>'); still({ querySelectorAll: () => [b] });
  assert.equal(b.gs.filter(g => g.cl.has('hb-in')).length, 2, 'a new picture fades in');
});

test('f1076 (3) the Handbook panel opens the chapter its question names', () => {
  assert.match(body(read('js/views/handbook.js'), 'hbknPanelHtml'), /hbkFind\(q, _hbkLang\(\)\)[\s\S]*hbkOpen\(f\.k\); return;/);
  const ctx = { window: {}, console }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(read('js/handbook.js'), ctx);
  const EN = require('../js/i18n.js').STRINGS.en, SV = require('../js/i18n.js').STRINGS.sv;
  assert.equal(ctx.hbkFind(EN.jov5_hbk_q1, 'en').k, '4.3');
  assert.equal(ctx.hbkFind(EN.jov5_hbk_q2, 'en').k, '7.1');
  assert.equal(ctx.hbkFind(SV.jov5_hbk_q1, 'sv').k, '4.3');
  assert.equal(ctx.hbkFind(SV.jov5_hbk_q2, 'sv').k, '7.1');
});
