'use strict';
/* f998 — VIEWS FIRST: THE FOLDERS PAGE IS THE STEP BEFORE THE LIST
   (owner, 10 Nov 2026, picking by name from ten drawn options: "build views first"; before it: "this is the precursor
   step to the list of contracts", "add subtle colors on this", and of the panel beside it "the side panel colors makes
   it seem as if the main panel and the side panel colors are related which is not the case")
   1 · ONE READING (regFolderViewsData): four views, each a list of contracts; the tile's number is that list's length
       and the press hands the same ids to the one door a set has (regShowOnly). A view with nothing in it is not drawn;
       the money view is not drawn for a reader who may not see values. Driven with real records.
   2 · The press, and the way back: the view steps the folders aside, "‹ Folders" lets the set go.
   3 · The folders under them: two compact columns, the count · money · what needs you, no bar, no key.
   4 · One quiet tone a tile, tokens only; the panel's bars plain ink and grey.
   5 · Both books; the Handbook's Contracts chapter says it.
   At the parent every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const CSS = strip(read('index.html')), REG = strip(read('js/views/register.js')), I18N = read('js/i18n.js');
const eq = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m); /* the reading runs in its own realm */
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };

/* the reading, lifted out and run with stand-ins for what it asks of the rest of HaTi */
function reader(over){
  const box = Object.assign({
    todayISO: () => '2030-03-10',
    needsYouOf: c => (c.needs || []).map(kind => ({ kind })),
    negoExecuted: c => c.status === 'Signed',
    negoAnySignature: c => !!c.sigs, signingRouteOpen: c => !!c.route,
    effectiveExpiry: c => c.expiry || null,
    ovMapRenewal: c => ({ by: c.noticeBy || '' }),
    fxRankValue: c => c.value || null,
    canViewValues: () => true,
    fmtMoneyShort: v => 'M' + Math.round(v / 1e6),
    i18t: (k, p) => k + (p ? ':' + Object.values(p).join(',') : ''),
    i18tn: (k, n) => k + ':' + n,
  }, over || {});
  vm.createContext(box);
  vm.runInContext('const CTF_VIEW_DAYS = 90, CTF_VIEW_BIG = 10000000;\n' + fnSrc(REG, 'regFolderViewsData') + '\nthis.read = regFolderViewsData;', box);
  return box.read;
}
const BOOK = [
  { id: 'a', folder: 'f1', needs: ['approval'], value: 12e6 },
  { id: 'b', folder: 'f2', needs: ['approval', 'details'], route: true },
  { id: 'c', folder: 'f2', needs: ['details'], sigs: 1, expiry: '2030-04-01', noticeBy: '2030-03-20' },
  { id: 'd', folder: 'f3', status: 'Signed', sigs: 2, route: true, expiry: '2030-06-08', value: 30e6 },
  { id: 'e', folder: 'f3', expiry: '2030-06-09' },
  { id: 'g', folder: 'f1', expiry: '2030-03-09', value: 9999999 },
];

test('f998 (1) one reading: the number on a tile is the list behind it', () => {
  const V = reader()(BOOK), by = Object.fromEntries(V.map(v => [v.k, v]));
  eq(V.map(v => v.k), ['ap', 'sg', 'end', 'big'], 'the four, in the drawn order');
  eq(by.ap.list.map(c => c.id), ['a', 'b'], 'waiting for MY approval is needsYouOf\'s own kind');
  assert.equal(by.ap.sub, 'ctfv_in_folders:2');
  eq(by.sg.list.map(c => c.id), ['b', 'c'], 'signing opened and not finished; a signed one is not out');
  eq(by.end.list.map(c => c.id), ['c', 'd'], 'today to 90 days on, both ends counted; day 91 and yesterday are not');
  assert.equal(by.end.sub, 'ctfv_notice:1', 'the notice day is the renewal\'s own reading, this calendar month');
  eq(by.big.list.map(c => c.id), ['a', 'd'], 'at or above the mark; one below is not');
  assert.equal(by.big.sub, 'ctfv_together:M42');
  eq(V.map(v => v.tone), ['amber', 'steel', 'ruby', 'green']);
});

test('f998 (1b) a view with nothing in it is not drawn; money is not drawn for a reader who may not see values', () => {
  eq(reader()([BOOK[4]]).map(v => v.k), [], 'nothing waits, nothing ends in time, no money: no tiles');
  eq(reader({ canViewValues: () => false })(BOOK).map(v => v.k), ['ap', 'sg', 'end']);
  assert.match(reader()([BOOK[3]]).find(v => v.k === 'end').sub, /^ctfv_notice_none/, 'no notice due is said, not left blank');
  assert.match(fnSrc(REG, 'regFolderViewsHtml'), /if \(!V\.length\) return '';/, 'no tiles, no heading over nothing');
  assert.match(fnSrc(REG, 'regFolderViewsHtml'), /<b>\$\{v\.list\.length\}<\/b>/, 'the number is the list\'s length');
});

test('f998 (2) the press hands the same ids to the one door; the way back lets the set go', () => {
  const at = REG.indexOf("t.closest('[data-ctf-view]')"); assert.ok(at > 0);
  const press = REG.slice(at, REG.indexOf("t.closest('[data-ctf-new]')", at));
  assert.match(press, /regFolderViewsData\(regFolderLive\(\)\)\.find\(x => x\.k === vw\.getAttribute\('data-ctf-view'\)\)/, 'read again at the press, by the same reading');
  assert.match(press, /_ctFolders = false; regShowOnly\(v\.list\.map\(c => c\.id\), v\.label\)/, 'the one door a set has');
  assert.match(REG, /t\.closest\('\[data-ctf-back\]'\)\)\{ e\.preventDefault\(\); const R = regState\(\); _ctFolders = true; R\.type = 'all'; R\.only = null;/, '‹ Folders lets the set go');
});

test('f998 (3) the folders under the views: two compact columns, no bar, no key', () => {
  const f = fnSrc(REG, 'regFolderRowsHtml');
  assert.match(f, /return `\$\{regFolderViewsHtml\(rows\.flatMap\(x => x\.cs\)\)\}<div class="ctf-cap">/, 'the views read the very contracts the rows count');
  assert.match(f, /<div class="ctf-list is-two">\$\{body\}\$\{endRow\}\$\{newRow\}<\/div>/, 'the Ended shelf and New folder keep their doors');
  assert.doesNotMatch(f, /regTileBar|regTileKeyHtml|listSapMarkHtml/, 'no bar, no key, no mark: as drawn');
  assert.match(f, /\[String\(r\.n\), r\.val \? esc\(money\(r\.val\)\) : '', need\]/, 'count · money · what needs you');
  assert.match(CSS, /html\.lg-new \.ctf-list\.is-two\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(CSS, /html\.lg-new \.ctf-row\.is-compact\{display:flex;/, 'a button row is flex, never grid');
});

test('f998 (4) one quiet tone a tile, from the tokens; the panel beside it stays plain', () => {
  for (const t of ['amber', 'steel', 'ruby', 'green']){
    assert.match(CSS, new RegExp('html\\.lg-new \\.ctf-view\\.is-' + t + '\\{background:color-mix\\(in srgb,var\\(--st-' + t + '-bg\\) 60%,var\\(--color-surface\\)\\)\\}'));
    assert.match(CSS, new RegExp('html\\.lg-new \\.ctf-view\\.is-' + t + ' b\\{color:var\\(--st-' + t + '-fg\\)\\}'));
  }
  assert.match(CSS, /html\.lg-new \.ctf-view\{[^}]*padding:16px/, '16px inside the card');
  const p = fnSrc(REG, 'regFolderRanksHtml');
  assert.match(p, /String\(x\.r\.needN\), 'ink'\)/); assert.match(p, /money\(x\.r\.val\), 'grey'\)/);
  assert.match(CSS, /html\.lg-new \.ctfp-rk-b i\.is-ink\{background:var\(--color-text\)\}/);
});

test('f998 (5) both books, and the Handbook says it', () => {
  for (const k of ['ctfv_cap', 'ctfv_folders', 'ctfv_ap', 'ctfv_sg', 'ctfv_end', 'ctfv_big', 'ctfv_in_folders_one', 'ctfv_in_folders_other', 'ctfv_notice_one', 'ctfv_notice_other', 'ctfv_notice_none', 'ctfv_together'])
    assert.equal(I18N.split('\n    ' + k + ': ').length - 1, 2, k + ' in both books');
  assert.match(read('js/handbook.js'), /Contracts opens on its folders, the step before the list\./);
});
