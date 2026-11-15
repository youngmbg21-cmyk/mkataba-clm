'use strict';
/* f1055 — THE SYMBOL STRIP, THE GUIDE'S COMPACT FACE (owner, 15 Nov 2026: "Build the symbol nav panel per your
   recommendation"). The recommendation, as the owner read it: a strip of coloured symbols down the LEFT edge, one
   symbol per page, Board at the top and Settings at the foot, in a FIXED order (the Rolodex was drawn and turned
   down); the name beside the symbol pointed at; opened by the symbol at the top left of the bar, on a press or a
   short rest of the mouse; built from the Guide's own list, so it is no second door.

   (1) one symbol per page: every page the Guide lists, once, Board first, Settings last, no row naming two pages
   (2) the order is fixed: what is owed or where you stand never moves a symbol
   (3) the Guide's own words: the tip names the page and the word that opens it, "You are here" on yours, the
       count on a page that is owed; Parties and People wear different symbols
   (4) a press opens it, a second press closes it, a press on a symbol goes there through the Guide's own door and
       closes it, Esc closes it, a press outside closes it; one the mouse opened stays when pressed
   (5) wired where the user looks: the bar carries the door before ‹, the shell wires it, both books name it */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const R = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const APP = R('js/app.js'), HTML = R('index.html'), HBK = R('js/handbook.js'), I18N = R('js/i18n.js');
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ');
function fnSrc(name){
  const at = APP.search(new RegExp('function\\s+' + name + '\\s*\\(')); assert.ok(at >= 0, name + ' exists');
  const open = APP.indexOf('{', at); let d = 0;
  for (let i = open; i < APP.length; i++){ if (APP[i] === '{') d++; else if (APP[i] === '}' && --d === 0) return APP.slice(at, i + 1); }
  return '';
}
function constSrc(name){
  const at = APP.search(new RegExp('const\\s+' + name + '\\s*=')); assert.ok(at >= 0, name + ' exists');
  const end = APP.indexOf(';\n', at); return APP.slice(at, end + 1);
}
const PAGE_NAMES = { board:'Board', contracts:'Contracts', requests:'Requests', import:'Import', ourpaper:'Our paper', draft:'Draft agreement',
  negotiations:'Negotiations', approvals:'Approvals & signing', document:'Workspace', oblig:'Obligations', calendar:'Calendar', parties:'Parties',
  people:'People', mynotes:'My notes', explorer:'Explorer', reads:'Discover', pulse:'Pulse board', house:'Jambo’s agents', flowmap:'Flow map',
  handbook:'Handbook', settings:'Settings & rules' };
function world(opts = {}){
  const dom = new JSDOM('<!doctype html><html><body><header id="top-header"><button id="dk-nav" type="button"></button><button id="dk-back"></button></header><main id="page"><button id="elsewhere">x</button></main></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const w = dom.window;
  w.state = { view: opts.view || 'dashboard' };
  w.__here = opts.here || 'board';
  w.__owed = opts.owed || {};
  w.__went = [];
  w.eval(`
    var esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
    var NAMES = ${JSON.stringify(PAGE_NAMES)};
    var i18t = (k, v) => k.startsWith('gd_p_') ? NAMES[k.slice(5)] : k === 'gdn_say' ? 'Say ' + v.words : k === 'gd_here' ? 'You are here' : k === 'gds_label' ? 'Pages' : k;
    var icon = (n) => '<svg data-icon="' + n + '"></svg>';
    var guideHereKey = () => window.__here;
    var guideNlCount = k => window.__owed[k] ? { n: window.__owed[k], owed: true } : (k === 'contracts' ? { n: 128, owed: false } : null);
    var guideWordOf = k => k === 'draft' ? '' : (k === 'oblig' ? 'obligations' : k);
    var guideGo = k => window.__went.push(k);
    var caMayAdd = () => true;
    ${['GUIDE_NL', 'GUIDE_NL_ICON', 'GUIDE_STRIP_ICON'].map(constSrc).join('\n')}
    var GUIDE_STRIP_HOVER_MS = 0, GUIDE_STRIP_LEAVE_MS = 0, _gdsHow = null, _gdsHoverT = 0, _gdsLeaveT = 0;
    ${['guideRowShown', 'guideStripRows', 'guideStripIcon', 'guideStripOwed', 'guideStripHtml', 'guideStripTipHtml', 'guideStripTip', 'guideStripIsOpen',
       'guideStripOpen', 'guideStripClose', 'guideStripPress', 'guideStripGo', 'guideStripWire'].map(fnSrc).join('\n')}
    window.__api = { guideStripRows, guideStripHtml, guideStripTipHtml, guideStripOpen, guideStripClose, guideStripIsOpen, guideStripPress, guideStripWire, GUIDE_NL };
  `);
  return w;
}
const keysOf = w => [...w.document.querySelectorAll('#gd-strip [data-gds-go]')].map(b => b.getAttribute('data-gds-go'));

test('f1055 (1) one symbol per page: every Guide page once, Board first, Settings last', () => {
  const w = world(); const A = w.__api;
  A.guideStripOpen('press');
  const keys = keysOf(w);
  const guide = [...new Set(A.GUIDE_NL.flatMap(st => st.rows.flat()))];
  assert.equal(keys[0], 'board', 'Board, the landing page, is the top symbol');
  assert.equal(keys[keys.length - 1], 'settings', 'Settings is the foot');
  assert.equal(new Set(keys).size, keys.length, 'no page twice');
  assert.deepEqual([...keys].sort(), [...guide].sort(), 'exactly the Guide\'s pages, no second list');
  assert.ok(keys.includes('explorer') && keys.includes('reads') && keys.includes('people') && keys.includes('house'), 'the pages the Guide groups each have their own symbol');
  assert.equal(w.document.querySelectorAll('#gd-strip [data-gds-go]').length, keys.length, 'one button per page');
  for (const b of w.document.querySelectorAll('#gd-strip [data-gds-go]')) assert.equal(b.getAttribute('aria-label'), PAGE_NAMES[b.getAttribute('data-gds-go')], 'each symbol carries its page\'s name for a reader that cannot see it');
});

test('f1055 (2) the order is fixed: counts and where you stand never move a symbol', () => {
  const a = world(); a.__api.guideStripOpen('press');
  const b = world({ here: 'calendar', owed: { approvals: 34, mynotes: 2, settings: 4 } }); b.__api.guideStripOpen('press');
  assert.deepEqual(keysOf(a), keysOf(b));
});

test('f1055 (3) the Guide\'s own words: name and word in the tip, "You are here", the owed count; Parties and People differ', () => {
  const w = world({ here: 'calendar', owed: { approvals: 34 } }); const A = w.__api;
  A.guideStripOpen('press');
  assert.match(A.guideStripTipHtml('oblig'), /<b>Obligations<\/b><span>Say “obligations”<\/span>/);
  assert.match(A.guideStripTipHtml('calendar'), /You are here/);
  assert.match(A.guideStripTipHtml('approvals'), /<i>34<\/i>/);
  assert.doesNotMatch(A.guideStripTipHtml('draft'), /Say/, 'a page with no one word says none');
  const cal = w.document.querySelector('#gd-strip [data-gds-go="calendar"]');
  assert.equal(cal.getAttribute('aria-current'), 'page'); assert.ok(cal.querySelector('.gds-mk.t-ink'), 'the page you are on is black');
  assert.equal(w.document.querySelector('#gd-strip [data-gds-go="approvals"] .gds-n').textContent, '34', 'the owed count sits on the symbol');
  assert.equal(w.document.querySelector('#gd-strip [data-gds-go="contracts"] .gds-n'), null, 'a size is not a debt: no badge');
  const ic = k => w.document.querySelector(`#gd-strip [data-gds-go="${k}"] [data-icon]`).getAttribute('data-icon');
  assert.notEqual(ic('parties'), ic('people'), 'one symbol per page means two pages never share a picture');
});

test('f1055 (4) press opens, press again closes; a symbol goes there and closes; Esc and a press outside close', () => {
  const w = world(); const A = w.__api; const d = w.document;
  A.guideStripWire();
  const nav = d.getElementById('dk-nav');
  nav.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  assert.equal(A.guideStripIsOpen(), true, 'a press opens it');
  assert.equal(nav.getAttribute('aria-expanded'), 'true');
  nav.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  assert.equal(A.guideStripIsOpen(), false, 'press it again and it closes');
  A.guideStripOpen('hover');
  nav.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  assert.equal(A.guideStripIsOpen(), true, 'a press on a strip the mouse opened keeps it');
  d.querySelector('#gd-strip [data-gds-go="oblig"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(w.__went, ['oblig'], 'the Guide\'s own door takes you there');
  assert.equal(A.guideStripIsOpen(), false, 'and the strip lets go');
  A.guideStripOpen('press');
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(A.guideStripIsOpen(), false, 'Esc closes it');
  A.guideStripOpen('press');
  d.getElementById('elsewhere').dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true }));
  assert.equal(A.guideStripIsOpen(), false, 'a press outside closes it');
  A.guideStripWire();
  nav.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  assert.equal(A.guideStripIsOpen(), true, 'wired once: a second wiring does not double the press');
});

test('f1055 (5) wired where the user looks: the bar\'s door before ‹, the shell wires it, both books name it', () => {
  const hdr = HTML.slice(HTML.indexOf('<header id="top-header"'), HTML.indexOf('</header>', HTML.indexOf('<header id="top-header"')));
  const nav = hdr.indexOf('id="dk-nav"'), back = hdr.indexOf('id="dk-back"');
  assert.ok(nav > 0 && nav < back, 'the strip\'s symbol is the first thing at the top left of the bar');
  assert.match(hdr, /id="dk-nav"[^>]*aria-controls="gd-strip"/);
  assert.match(strip(APP), /addEventListener\('click',panelDoorPress\);\s*guideStripWire\(\);/, 'the shell wires it beside the panel button');
  assert.match(APP, /Object\.assign\(window,\{[^}]*guideStripOpen,/, 'published');
  assert.match(I18N, /gds_label: "Pages"/); assert.match(I18N, /gds_label: "Sidor"/);
  assert.match(HBK, /strip of symbols: the symbol at the top left of the bar/); assert.match(HBK, /remsa med symboler: symbolen längst upp till vänster/);
  const css = HTML.slice(HTML.indexOf('.gds{'), HTML.indexOf('.gds-tt em{'));
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, 'the strip wears tokens only');
  assert.match(css, /\.gds\{position:fixed;left:0;/, 'down the left edge, over the page');
});
