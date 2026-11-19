'use strict';
/* f1097 — THE LAUNCHPAD, BENTO THE LEGORA WAY (owner's pick by name, 19 Nov 2026: "bento the legora way it is"; then
   "1, yes" — ⌘K opens it; "A" — one list, the jump window IS it; "3, replace" — it replaces the symbol strip; "BUILD IT").
   It retires f1055 (the symbol strip).

   (1) every Guide page once, Board first and Settings last; under All the pages are grouped by the Guide's stages
   (2) what waits on you comes first, capped at LP_WAIT_MAX and the cap SAID; the chips narrow; nothing waiting is said
   (3) each waiting line is quoted from where it was read (Approvals' own first row, Settings' own first need), never
       guessed: a page with no reader shows its number alone
   (4) the bar's top-left symbol opens the jump window, a second press closes it
   (5) wired where the user looks: ⌘K and the symbol open the ONE jump window; nothing typed draws the launchpad; a row
       goes through the Guide's own door; the strip is gone; both books and the Handbook say it */
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
const NAMES = { board:'Board', contracts:'Contracts', requests:'Requests', import:'Import', ourpaper:'Our paper', standards:'Playbook', draft:'New agreement',
  negotiations:'Negotiations', approvals:'Approvals & signing', document:'Workspace', oblig:'Obligations', calendar:'Calendar', parties:'Parties',
  people:'People', mynotes:'My notes', explorer:'Explorer', reads:'Discover', pulse:'Pulse board', house:'Jambo’s agents', flowmap:'Flow map',
  handbook:'Handbook', settings:'Settings & rules' };
function world(opts = {}){
  const dom = new JSDOM('<!doctype html><html><body><header id="top-header"><button id="dk-nav" type="button"></button></header><main id="page"></main></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const w = dom.window;
  w.__here = opts.here || 'board';
  w.__owed = opts.owed || {};
  w.__opened = 0;
  w.apWorkRows = () => ({ yours: opts.approvals || [] });
  w.stNeedsAll = () => opts.needs || [];
  w.jov5Money = c => c.value ? 'KES ' + c.value + 'M' : '';
  w.eval(`
    var esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
    var NAMES = ${JSON.stringify(NAMES)};
    var i18t = (k, v) => k.startsWith('gd_p_') ? NAMES[k.slice(5)] : k === 'gd_here' ? 'You are here' : k === 'lp_from' ? 'From ' + v.page
      : k === 'lp_and' ? 'and ' + v.what : k;
    var i18tn = (k, n, v) => k + ':' + n;
    var icon = n => '<svg data-icon="' + n + '"></svg>';
    var guideHereKey = () => window.__here;
    var guideNlCount = k => window.__owed[k] ? { n: window.__owed[k], owed: true } : (k === 'contracts' ? { n: 4, owed: false } : null);
    var caMayAdd = () => true;
    var openCommandPalette = () => { window.__opened++; const d = document.createElement('div'); d.id = 'cmd-palette'; d._lpClose = () => d.remove(); document.body.appendChild(d); };
    ${['GUIDE_NL', 'GUIDE_NL_ICON', 'LP_WAIT_MAX', 'LP_CHIPS', 'LP_ICON', 'lpPlain'].map(constSrc).join('\n')}
    var _lpChip = 'all';
    ${['guideRowShown', 'lpRows', 'lpIcon', 'lpStageOf', 'lpToneOf', 'lpOwed', 'lpSize', 'lpQuoteOf', 'lpWaits', 'lpItems', 'lpWaitWord', 'lpActWord',
       'lpMark', 'lpBodyHtml', 'lpFootHtml', 'lpChipsHtml', 'lpIsOpen', 'lpDoorSay', 'lpToggle', 'lpWire'].map(fnSrc).join('\n')}
    window.__api = { lpRows, lpItems, lpQuoteOf, lpBodyHtml, lpFootHtml, lpChipsHtml, lpWire, GUIDE_NL, LP_WAIT_MAX, chip: c => { _lpChip = c; } };
  `);
  return w;
}
const plain = x => JSON.parse(JSON.stringify(x));
const draw = w => { const A = w.__api; const host = w.document.createElement('div'); host.innerHTML = A.lpBodyHtml(A.lpItems(), 0); return host; };

test('f1097 (1) every Guide page once, Board first, Settings last; under All grouped by the Guide\'s stages', () => {
  const w = world(); const A = w.__api;
  const keys = plain(A.lpRows().map(r => r.k));
  const guide = plain([...new Set(A.GUIDE_NL.flatMap(st => st.rows.flat()))]);
  assert.equal(keys[0], 'board'); assert.equal(keys[keys.length - 1], 'settings');
  assert.equal(new Set(keys).size, keys.length, 'no page twice');
  assert.deepEqual([...keys].sort(), [...guide].sort(), 'exactly the Guide\'s pages, no second list');
  const host = draw(w);
  const rows = [...host.querySelectorAll('.lp-p[data-cp-i]')];
  assert.deepEqual(rows.map(b => b.querySelector('.lp-nm').textContent).sort(), guide.map(k => NAMES[k]).sort(), 'every page drawn once under All');
  assert.equal(host.querySelectorAll('.lp-st').length, A.GUIDE_NL.length, 'one group per stage');
  for (const b of host.querySelectorAll('[data-cp-i]')) { assert.equal(b.getAttribute('role'), 'option'); assert.equal(b.id, 'cp-opt-' + b.getAttribute('data-cp-i')); }
  const here = host.querySelectorAll('[aria-current="page"]');
  assert.equal(here.length, 1, 'exactly one row says where you are'); assert.match(here[0].textContent, /Board/); assert.match(here[0].textContent, /You are here/);
});

test('f1097 (2) what waits comes first, capped and the cap said; chips narrow; nothing waiting is said', () => {
  const w = world({ owed: { board: 5, approvals: 2, house: 2, settings: 5, oblig: 1 } }); const A = w.__api;
  const items = A.lpItems();
  const waits = plain(items.filter(x => x.wait).map(x => x.id));
  assert.deepEqual(waits, ['approvals', 'oblig', 'house'].slice(0, A.LP_WAIT_MAX), 'owed pages in the fixed order, the page you stand on left out, at most LP_WAIT_MAX');
  assert.ok(items.slice(0, waits.length).every(x => x.wait), 'the waiting tiles come first');
  assert.match(A.lpFootHtml(false), /lp_more:1/, 'the one left over is SAID, never a silent trim');
  const amber = [...draw(w).querySelectorAll('.lp-p .lp-ct.is-owed')].map(e => e.textContent);
  assert.ok(amber.includes('5') && amber.includes('2'), 'every owed page keeps its amber number in the list');
  A.chip('need'); assert.ok(A.lpItems().every(x => x.wait), 'Waiting on you: the waiting alone');
  A.chip('arrive'); const ar = plain(A.lpItems().map(x => x.id));
  assert.deepEqual(ar, plain(A.GUIDE_NL.find(s => s.k === 'arrive').rows.flat()), 'Arrive: its pages alone, no waiting tiles');
  const none = world(); none.__api.chip('need');
  assert.match(draw(none).textContent, /lp_none/, 'nothing waiting is said, never an empty panel');
  A.chip('all'); assert.match(A.lpChipsHtml(), /data-lp-chip="negsign"[^>]*>lp_chip_deal</, 'the stage chip for Negotiate · sign says Deal');
});

test('f1097 (3) each waiting line is quoted from where it was read, never guessed', () => {
  const w = world({ here: 'contracts', owed: { approvals: 2, settings: 3, house: 2, oblig: 1 },
    approvals: [{ c: { name: 'Retail Supply — Coast', counterparty: 'Naivas Supermarkets', value: 78 } }, { c: { name: 'Raw Milk Collection', counterparty: 'Nandi Dairy', value: 36 } }],
    needs: [{ text: 'Email isn\'t set up — <b>review links</b>' }, { text: 'Quarterly access review' }, { text: 'Signing limits' }] });
  const A = w.__api;
  assert.deepEqual(plain(A.lpQuoteOf('approvals')), { q: 'Retail Supply — Coast · Naivas Supermarkets · KES 78M', more: 'and Raw Milk Collection · Nandi Dairy · KES 36M' });
  assert.deepEqual(plain(A.lpQuoteOf('settings')), { q: 'Email isn\'t set up — review links', more: 'lp_and_n:2' }, 'Settings\' own first need, its markup read as words');
  assert.equal(A.lpQuoteOf('house').q, 'lp_house:2', 'the agents say their count in a sentence');
  assert.equal(A.lpQuoteOf('oblig'), null, 'a page with no reader quotes nothing');
  const tiles = [...draw(w).querySelectorAll('.lp-w')];
  const ap = tiles.find(t => /Approvals/.test(t.textContent));
  assert.ok(ap.querySelector('q') && /From Approvals & signing/.test(ap.textContent), 'the quote says where it was read');
  assert.match(ap.querySelector('.lp-act').textContent, /lp_act_approvals/, 'its button is in the row');
  const ob = tiles.find(t => /Obligations/.test(t.textContent));
  assert.ok(ob && !ob.querySelector('q') && !/From /.test(ob.textContent), 'no quote, no "From": the number alone');
});

test('f1097 (4) the bar\'s top-left symbol opens the jump window; a second press closes it', () => {
  const w = world(); const A = w.__api; A.lpWire(); A.lpWire();
  const b = w.document.getElementById('dk-nav');
  b.click(); assert.equal(w.__opened, 1, 'a press opens it, wired once');
  assert.ok(w.document.getElementById('cmd-palette'));
  b.click(); assert.equal(w.document.getElementById('cmd-palette'), null, 'a second press closes it'); assert.equal(w.__opened, 1);
});

test('f1097 (5) wired where the user looks; the strip is gone; both books and the Handbook say it', () => {
  const app = strip(APP);
  assert.match(app, /\(e\.key==='k'\|\|e\.key==='K'\)\)\{ e\.preventDefault\(\); openCommandPalette\(\); return; \}/, '⌘K opens the launchpad');
  assert.match(app, /e\.key==='\/'&&![^\n]*openCommandPalette\(\)/, '"/" outside a box opens the same window');
  assert.match(app, /\blpWire\(\);/, 'the shell wires the symbol');
  assert.match(fnSrc('openCommandPalette'), /if\(!input\.value\.trim\(\)\)\{ lpPaint\(\); return; \}/, 'nothing typed draws the launchpad');
  assert.match(fnSrc('openCommandPalette'), /if\(it\.kind==='page'\)\{ close\(\); guideGo\(it\.id\); return; \}/, 'a row goes through the Guide\'s own door');
  assert.match(HTML, /id="dk-nav"[^>]*aria-controls="cmd-palette"/, 'the bar\'s door names the window it opens');
  assert.doesNotMatch(APP + HTML, /guideStrip|gd-strip|\.gds-/, 'the symbol strip is gone');
  const en = I18N.split('lp_where:'); assert.equal(en.length, 3, 'both books carry the launchpad\'s words');
  for (const k of ['lp_chip_all', 'lp_chip_need', 'lp_chip_deal', 'lp_from', 'lp_none', 'lp_foot', 'lp_more_one', 'lp_more_other', 'lp_house_one', 'lp_house_other'])
    assert.equal(I18N.split('    ' + k + ':').length, 3, k + ' in both books');
  assert.match(HBK, /opens the launchpad/); assert.match(HBK, /öppnar startplattan/);
});
