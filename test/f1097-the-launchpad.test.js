'use strict';
/* f1097 — THE LAUNCHPAD, BENTO THE LEGORA WAY (owner's pick by name, 19 Nov 2026: "bento the legora way it is"; then
   "1, yes" — ⌘K opens it; "A" — one list, the jump window IS it; "3, replace" — it replaces the symbol strip; "BUILD IT").
   It retires f1055 (the symbol strip).
   RE-DRAWN THE STRIPE WAY (owner, 20 Nov 2026: "Build the nav panel as drawn but it should be at the center of the screen"): (6).

   (1) every Guide page once, Board first and Settings last; under All the pages are grouped by the Guide's stages
   (2) what waits on you comes first, capped at LP_WAIT_MAX and the cap SAID; the chips narrow; nothing waiting is said
   (3) each waiting line is quoted from where it was read (Approvals' own first row, Settings' own first need), never
       guessed: a page with no reader shows its number alone
   (4) the bar's top-left symbol opens the jump window, a second press closes it
   (5) wired where the user looks: ⌘K and the symbol open the ONE jump window; nothing typed draws the launchpad; a row
       goes through the Guide's own door; the strip is gone; both books and the Handbook say it
   (6) THE STRIPE WAY: every page says what is behind it in the Guide's own line; no page symbols, no stage colours; what
       waits stands in ONE column beside the pages under All, the cap said at ITS foot; the ask line in two tones */
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
  negotiations:'Negotiations', approvals:'Approvals & signing', oblig:'Obligations', calendar:'Calendar', parties:'Parties',
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
    var openCommandPalette = (q, o) => { window.__opened++; window.__left = !!(o && o.left); const d = document.createElement('div'); d.id = 'cmd-palette'; d._lpClose = () => d.remove(); document.body.appendChild(d); };
    ${['GUIDE_NL', 'LP_WAIT_MAX', 'LP_CHIPS', 'LP_EMOJI', 'lpPlain'].map(constSrc).join('\n')}
    var _lpChip = 'all'; var _lpLeft = false;
    ${['guideRowShown', 'lpRows', 'lpStageOf', 'lpOwed', 'lpSize', 'lpQuoteOf', 'lpWaits', 'lpItems', 'lpWaitWord', 'lpActWord',
       'lpEmoHtml', 'lpOpt', 'lpWaitRowsHtml', 'lpSideOn', 'lpMoreSay', 'lpSideHtml', 'lpBodyHtml', 'lpWhereHtml', 'lpFootHtml', 'lpChipsHtml', 'lpIsOpen', 'lpDoorSay', 'lpToggle', 'lpWire'].map(fnSrc).join('\n')}
    window.__api = { LP_EMOJI, lpRows, lpItems, lpQuoteOf, lpBodyHtml, lpSideHtml, lpSideOn, lpWhereHtml, lpFootHtml, lpChipsHtml, lpWire, GUIDE_NL, LP_WAIT_MAX, chip: c => { _lpChip = c; }, left: on => { _lpLeft = !!on; } };
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
  for (const b of host.querySelectorAll('[data-cp-i]')) { assert.equal(b.getAttribute('role'), 'option'); assert.equal(b.id, 'cp-opt-' + b.getAttribute('data-cp-i')); assert.ok(b.getAttribute('data-lp-go'), 'each row names its page'); }
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
  /* RE-POINTED 21 Nov 2026 (owner: "the names differ ... when they are supposed to be one and the same"; "use Negotiate · sign") */
  A.chip('all'); assert.match(A.lpChipsHtml(), /data-lp-chip="negsign"[^>]*>gdn_s_negsign</, 'a stage\'s chip says its column\'s own head');
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
  assert.equal(w.__left, true, 'the nav button opens it at the left (P-37)');
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
  /* the owner, 19 Nov 2026: "nav panel pop up should appear at the center of the page" */
  assert.match(strip(fnSrc('openCommandPalette')), /display:flex;align-items:center;justify-content:center/, 'the window stands in the middle, up and down as well as across');
  assert.match(strip(fnSrc('openCommandPalette')), /sheet\.style\.minHeight=h\+'px'/, 'centred, it keeps the height it opened at while you type');
  assert.match(HTML, /id="dk-nav"[^>]*aria-controls="cmd-palette"/, 'the bar\'s door names the window it opens');
  assert.doesNotMatch(APP + HTML, /guideStrip|gd-strip|\.gds-/, 'the symbol strip is gone');
  const en = I18N.split('lp_where:'); assert.equal(en.length, 3, 'both books carry the launchpad\'s words');
  for (const k of ['lp_chip_all', 'lp_chip_need', 'lp_from', 'lp_none', 'lp_foot', 'lp_more_one', 'lp_more_other', 'lp_house_one', 'lp_house_other'])
    assert.equal(I18N.split('    ' + k + ':').length, 3, k + ' in both books');
  assert.match(HBK, /opens the launchpad/); assert.match(HBK, /öppnar startplattan/);
});

test('f1097 (6) the Stripe way: a line under every page, no symbols or stage colours, what waits in ONE column beside the pages', () => {
  const w = world({ here: 'contracts', owed: { approvals: 2, settings: 3, house: 2, oblig: 1 } }); const A = w.__api;
  const items = A.lpItems();
  assert.equal(A.lpSideOn(items), true, 'under All, with something waiting, the column stands beside the pages');
  const list = w.document.createElement('div'); list.innerHTML = A.lpBodyHtml(items, 0, { side: true });
  const side = w.document.createElement('div'); side.innerHTML = A.lpSideHtml(items, 0);
  assert.equal(list.querySelectorAll('.lp-w').length, 0, 'beside the pages, no waiting row is drawn among them');
  assert.equal(side.querySelectorAll('.lp-w').length, A.LP_WAIT_MAX, 'the column holds the waiting rows, capped');
  assert.match(side.querySelector('.lp-more').textContent, /lp_more:1/, 'the one left over is said at the column\'s foot');
  assert.doesNotMatch(A.lpFootHtml(false, true), /lp_more|lp_foot/, 'and not said twice in the window\'s foot');
  assert.match(A.lpFootHtml(false, false), /lp_more:1/, 'with no column beside, the foot still says it');
  const rows = [...list.querySelectorAll('.lp-p')];
  assert.ok(rows.length > 15 && rows.every(b => /^gd_w_/.test((b.querySelector('.lp-wh') || {}).textContent || '')), 'every page says what is behind it, in the Guide\'s own line');
  assert.equal([...list.querySelectorAll('svg, .lp-ic, .lp-dot'), ...side.querySelectorAll('svg, .lp-ic')].length, 0, 'no drawn symbols, no stage dots');
  assert.doesNotMatch(list.innerHTML + side.innerHTML, /\bt-(green|amber|steel|violet)\b/, 'no stage colours');
  const idx = [...side.querySelectorAll('[data-cp-i]'), ...list.querySelectorAll('[data-cp-i]')].map(b => +b.getAttribute('data-cp-i'));
  assert.deepEqual(idx, plain(items).map((_, i) => i), 'the arrows still walk every row once: the waiting first, then the pages');
  A.chip('need'); assert.equal(A.lpSideOn(A.lpItems()), false, 'under Waiting on you the rows take the list\'s place');
  assert.equal(draw(w).querySelectorAll('.lp-w').length, A.LP_WAIT_MAX);
  A.chip('all'); assert.equal(world().__api.lpSideOn(world().__api.lpItems()), false, 'nothing waiting, no column');
  assert.equal(A.lpWhereHtml(), 'lp_where', 'the ask line is the box\'s own words');
  const app = strip(APP), css = HTML.slice(HTML.indexOf('#cmd-palette .lp-sheet{'), HTML.indexOf('#cmd-palette .lp-foot kbd'));
  assert.match(fnSrc('lpWhereHtml'), /<b>\$\{esc\(m\[1\]\)\}<\/b>/, 'its question in ink, the rest grey');
  assert.match(app, /side\.hidden=!sideOn; side\.innerHTML=sideOn\?lpSideHtml\(results,active\):''/, 'the window paints the column');
  assert.match(app, /chips\.hidden=true; side\.hidden=true;/, 'typed, the column goes with the chips');
  assert.match(css, /\.lp-side\{grid-column:2;grid-row:1 \/ 4;[^}]*background:var\(--color-bg\)/, 'ONE tinted column, from the window\'s top to its foot');
  assert.match(css, /\.lp-nm\{[^}]*color:var\(--accent-ink\)/, 'a page\'s name in the link ink');
  assert.doesNotMatch(css, /st-(violet|steel|green)-/, 'no stage tone left in the launchpad\'s sheet');
  for (const k of ['lp_more_one', 'lp_more_other']) assert.doesNotMatch(I18N.split('    ' + k + ':')[1].split('\n')[0] + I18N.split('    ' + k + ':')[2].split('\n')[0], /below|nedan/, k + ' no longer says "below"');
  assert.match(HBK, /a line saying what is behind it/); assert.match(HBK, /en rad som säger vad som finns bakom den/);
});

test('f1097 (7) an emoji marks every page; one name for one stage (owner, 21 Nov 2026)', () => {
  const w = world({ here: 'contracts', owed: { approvals: 2, settings: 3, house: 2, oblig: 1 } }); const A = w.__api;
  const items = A.lpItems();
  const guide = plain([...new Set(A.GUIDE_NL.flatMap(st => st.rows.flat()))]);
  const E = plain(A.LP_EMOJI);
  assert.deepEqual(Object.keys(E).sort(), [...guide].sort(), 'exactly one emoji for each of the Guide\'s pages');
  assert.equal(new Set(Object.values(E)).size, guide.length, 'no two pages share an emoji');
  const list = w.document.createElement('div'); list.innerHTML = A.lpBodyHtml(items, 0, { side: true });
  const side = w.document.createElement('div'); side.innerHTML = A.lpSideHtml(items, 0);
  for (const b of list.querySelectorAll('.lp-p')) { const k = b.getAttribute('data-lp-go'), em = b.querySelector('.lp-em');
    assert.ok(em && em.textContent === E[k] && em.getAttribute('aria-hidden') === 'true', k + ' carries its own emoji, a mark the reader is not read');
    assert.equal(b.firstElementChild, em, 'at the left of the name'); assert.ok(!b.querySelector('.lp-nm').textContent.includes(E[k]), 'never inside the name'); }
  for (const b of side.querySelectorAll('.lp-w')) assert.equal((b.querySelector('.lp-pg .lp-em') || {}).textContent, E[b.getAttribute('data-lp-go')], 'the same emoji beside it where it waits');
  const chips = w.document.createElement('div'); chips.innerHTML = A.lpChipsHtml();
  const heads = [...list.querySelectorAll('.lp-st h5')].map(h => h.textContent);
  const stageChips = [...chips.querySelectorAll('[data-lp-chip]')].slice(2).map(c => c.textContent);
  assert.deepEqual(stageChips, heads, 'each stage\'s chip says the same words as its column\'s head');
  assert.doesNotMatch(APP + I18N, /lp_chip_deal/, 'the second name is retired from the code and both books');
  assert.match(HBK, /Negotiate · sign · Live · The book\)/); assert.match(HBK, /Förhandla · signera · Gäller · Boken\)/);
  const css = HTML.slice(HTML.indexOf('#cmd-palette .lp-sheet{'), HTML.indexOf('#cmd-palette .lp-foot kbd'));
  assert.match(css, /\.lp-em\{position:absolute;/, 'the emoji stands in its own gutter, the line under the name starts where the name starts');
});

test('f1097 (8) the emoji book holds every emoji the launchpad draws (owner, 21 Nov 2026)', () => {
  const ST = R('js/views/settings.js'), i = ST.indexOf('const SDD_EMOJI='); assert.ok(i >= 0, 'the emoji book is there');
  const book = new Function('return ' + ST.slice(i + 'const SDD_EMOJI='.length, ST.indexOf('};', i) + 1))();
  const E = plain(world().__api.LP_EMOJI);
  assert.deepEqual(Object.keys(book.page).sort(), ['calendar', 'contracts', 'draft', 'negotiations', 'oblig', 'pulse', 'reads'], 'the seven pages the book had nothing for');
  for (const [k, e] of Object.entries(book.page)) assert.equal(E[k], e, k + ': the launchpad draws the book\'s emoji');
  const all = new Set([...Object.values(book.area), ...Object.values(book.row), ...Object.values(book.page)]);
  for (const [k, e] of Object.entries(E)) assert.ok(all.has(e), k + ' ' + e + ' is in the emoji book');
});

test('f1097 (9) the nav button panel slides in from the left: one list, each page has its own count, Waiting on you narrows it (P-37)', () => {
  const w = world({ here: 'contracts', owed: { approvals: 2, settings: 3, house: 2, oblig: 1 } }); const A = w.__api;
  A.left(true);
  const items = A.lpItems();
  assert.equal(items.filter(x => x.wait).length, 0, 'no waiting rows at the left: each page carries its own count');
  assert.equal(A.lpSideOn(items), false, 'no tinted column at the left');
  const host = draw(w);
  assert.equal(host.querySelectorAll('.lp-w').length, 0);
  const ap = host.querySelector('[data-lp-go="approvals"] .lp-ct');
  assert.ok(ap && ap.classList.contains('is-owed') && ap.textContent === '2', 'a page that waits on you shows its own amber count');
  A.chip('need');
  const need = plain(A.lpItems().map(x => x.id));
  assert.deepEqual([...need].sort(), ['approvals', 'house', 'oblig', 'settings'], 'Waiting on you narrows the list to the pages with a count, the page you are on left out');
  assert.equal(draw(w).querySelectorAll('.lp-st h5').length > 0, true, 'still under their stages\' heads');
  A.chip('all'); assert.match(A.lpFootHtml(false, false), /lp_out/, 'the foot says a press outside closes it');
  A.left(false);
  const app = strip(fnSrc('openCommandPalette'));
  assert.match(app, /position:fixed;left:0;right:0;bottom:0;top:\$\{top\}px/, 'under the black bar to the window\'s foot');
  assert.match(app, /width:min\(400px,100vw\)/, '400 wide, from the left edge');
  assert.match(app, /translateX\(-100%\)/, 'it slides (a transform), and back');
  assert.match(app, /prefers-reduced-motion: reduce/, 'reduced motion: at once');
  assert.match(strip(fnSrc('lpToggle')), /openCommandPalette\('',\{ left:true \}\)/, 'only the nav button opens it at the left');
  assert.match(strip(APP), /\(e\.key==='k'\|\|e\.key==='K'\)\)\{ e\.preventDefault\(\); openCommandPalette\(\); return; \}/, '⌘K keeps the window in the middle');
  assert.equal(I18N.split('    lp_out:').length, 3, 'both books');
  assert.match(HBK, /slides in from the left/); assert.match(HBK, /glider in från vänster/);
});
