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
  /* RE-POINTED (P-42, owner's pick 20 Nov 2026: Discover the Legora + Stripe way): the tiles are chips now, each with its
     tile's colour as a dot */
  /* RE-POINTED 23 Nov 2026 (owner: "put All next to the search field and the questions in a dropdown next to All"): the
     answers sit in the Answers ▾ menu (dsnAnsBarHtml), each item still wearing its tile's colour as a dot */
  assert.match(fnBody(RD, 'dsnResultsHtml'), /dsnAnsBarHtml\('dsn', S, _dsn\.tab/);
  assert.match(fnBody(RD, 'dsnAnsBarHtml'), /const dot = g => `<i class="dsl-dot is-\$\{_rdE\(g\.c \|\| 'gray'\)\}"/);
  assert.match(fnBody(RD, 'dsnChipTone'), /G\.toneOf\.get\(k\)/);
  /* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): the chips keep their tiles' colours; an answer in the table is its plain
     words with its mark against our playbook (dsnPlaybookOf), the risky in the ruby ink */
  assert.match(fnBody(RD, 'dsnResultsHtml'), /dsnPlaybookOf\(a, r\.askIds\[0\]\)/); assert.match(fnBody(RD, 'dsnResultsHtml'), /t === 'ruby' \? ' is-ruby' : ''/);
  for (const t of ['violet', 'pink']) assert.match(CSS, new RegExp('\\.rdsc-tile\\.is-' + t + '\\{background:color-mix\\(in srgb,var\\(--st-' + t + '-bg\\)'));
});

/* RE-POINTED (owner, 15 Nov 2026: "Make the contract number a column", then the columns drawn and "Answer first"): the
   number is its own column, led by the one builder both tables draw (f1061 pins the subject rule) */
test('f1058 (3) the contract number is its own column, in the results and while reading', () => {
  /* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): one Contract column — its name, and its number · party under it
     (dsnContractCell) — in a pack's results and while reading, so the answers' columns keep the room */
  assert.match(fnBody(RD, 'dsnResultsHtml'), /dsnContractCell\(x\.c, x\.id, RS/);
  assert.match(fnBody(RD, 'dsnReadingHtml'), /dsnContractCell\(c, id, RS\)/);
  assert.match(RD, /const dsnContractCell = \(c, id, S, more\) => [^\n]*_rdRef\(c\), S && S\.party/);
  assert.doesNotMatch(RD, /cun-sub">\$\{dsnRefHtml/, 'no second line under the name');
});

test('f1058 (4) every header sorts; the same press again reverses; a new read starts unsorted', () => {
  const R = fnBody(RD, 'dsnResultsHtml');
  /* RE-POINTED (P-42): each question's header also carries its Keep (a column on Contracts) after the sort button */
  /* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): a pack's question heads carry Keep UNDER their words (dsn-thk); one
     question's columns are Contract · Answer · Against our playbook · § */
  assert.match(R, /x\.ask && pack \? dsnSortTh\(x\.k, x\.th\)\.replace\(\/<\\\/th>\$\/, `<div class="dsn-thk">\$\{dsnKeepHtml\(x\.ask, names\.length > 3\)\}<\/div><\/th>`\)/);
  assert.match(R, /W\.map\(th\)/);
  assert.match(R, /k: 'q' \+ i/); assert.match(R, /k: 'ans'/); assert.match(R, /k: 'pb'/); assert.match(R, /k: 'name'/);
  assert.match(RD, /_dsn\.sort = \(_dsn\.sort && _dsn\.sort\.k === k\) \? \{ k, dir: -_dsn\.sort\.dir \} : \{ k, dir: 1 \}/);
  assert.match(fnBody(RD, 'dsnResultsShown'), /localeCompare\(String\(dsnSortVal\(b, k\)\), undefined, \{ numeric: true/);
  for (const k of ['no', 'party']) assert.match(fnBody(RD, 'dsnSortVal'), new RegExp("if \\(k === '" + k + "'\\)"));
  assert.match(RD, /aria-sort="\$\{d > 0 \? 'ascending' : 'descending'\}"/);
  assert.match(RD, /if \(o && 'run' in o\) _dsn\.sort = null;/);
});

test('f1058 (5) the new words in both books', () => {
  for (const k of ['dsn_t_look', 'dsn_t_unclear', 'dsn_sort_tip']) assert.equal((I18N.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
});
