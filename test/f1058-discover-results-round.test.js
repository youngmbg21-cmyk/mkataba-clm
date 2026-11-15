/* f1058 · DISCOVER'S RESULTS, THE OWNER'S FIVE (15 Nov 2026, on two photos: "only one card is showing at the top … they
   are all grey. On the contract column beneath the name should be the contract number. You should also be able to sort
   the columns by pressing on the header"). A pack is tiled by what was found (To look at · Unclear · Nothing unusual ·
   Not found, each contract in exactly one); one question's plain facts take quiet colours of their own and the chip wears
   its tile's; the number under every name; every header sorts, a second press reverses. Fails at the parent. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js')), I18N = read('js/i18n.js'), CSS = read('index.html');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function |\nif \(typeof document/); return src.slice(at, nx > 0 ? at + 10 + nx : src.length); };

test('f1058 (1) a pack shows its tiles: each contract in exactly one of four, an empty one not shown', () => {
  const G = fnBody(RD, 'dsnGroups');
  assert.match(G, /t\.includes\('ruby'\) \? B\.risk : t\.includes\('amber'\) \? B\.amber : [^?]+\? B\.ok : B\.none/);
  assert.match(G, /\['risk', 'dsn_t_look', 'ruby'\], \['amber', 'dsn_t_unclear', 'amber'\], \['ok', 'dsn_nothing', 'green'\], \['none', 'ac_not_found', 'gray'\]/);
  assert.match(G, /\.filter\(\(\[k\]\) => B\[k\]\.length\)/);
});

test('f1058 (2) tiles are coloured; plain facts take quiet colours; the chip wears its tile\'s', () => {
  assert.match(RD, /const DSN_FACT_TONES = \['violet', 'pink', 'steel'\]/);
  assert.match(fnBody(RD, 'dsnResultsHtml'), /class="rdsc-tile is-\$\{g\.c \|\| 'gray'\}/);
  assert.match(fnBody(RD, 'dsnChipTone'), /G\.toneOf\.get\(k\)/);
  assert.match(fnBody(RD, 'dsnResultsHtml'), /_dsnChip\(dsnChipTone\(a, S\.G\)/);
  for (const t of ['violet', 'pink']) assert.match(CSS, new RegExp('\\.rdsc-tile\\.is-' + t + '\\{background:color-mix\\(in srgb,var\\(--st-' + t + '-bg\\)'));
});

test('f1058 (3) the contract number sits under the name, in the results and while reading', () => {
  assert.match(fnBody(RD, 'dsnResultsHtml'), /<div class="cun-name">\$\{_rdE\(_rdName\(x\.c\)\)\}<\/div><div class="cun-sub">\$\{dsnRefHtml\(x\.c\)\}<\/div>/);
  assert.match(fnBody(RD, 'dsnReadingHtml'), /<div class="cun-sub">\$\{dsnRefHtml\(c\)\}<\/div>/);
});

test('f1058 (4) every header sorts; the same press again reverses; a new read starts unsorted', () => {
  const R = fnBody(RD, 'dsnResultsHtml');
  assert.match(R, /\$\{dsnSortTh\('name', _rdT\('dsn_c_contract'\)\)\}\$\{dsnSortTh\('folder', _rdT\('dsn_f_folder'\)\)\}/);
  assert.match(R, /dsnSortTh\('q' \+ i, n\)/); assert.match(R, /dsnSortTh\('ans', /); assert.match(R, /dsnSortTh\('says', /);
  assert.match(RD, /_dsn\.sort = \(_dsn\.sort && _dsn\.sort\.k === k\) \? \{ k, dir: -_dsn\.sort\.dir \} : \{ k, dir: 1 \}/);
  assert.match(fnBody(RD, 'dsnResultsShown'), /localeCompare\(String\(dsnSortVal\(b, k\)\), undefined, \{ numeric: true/);
  assert.match(RD, /aria-sort="\$\{d > 0 \? 'ascending' : 'descending'\}"/);
  assert.match(RD, /if \(o && 'run' in o\) _dsn\.sort = null;/);
});

test('f1058 (5) the new words in both books', () => {
  for (const k of ['dsn_t_look', 'dsn_t_unclear', 'dsn_sort_tip']) assert.equal((I18N.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
});
