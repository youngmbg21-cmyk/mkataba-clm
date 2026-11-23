/* f1191 · DISCOVER'S ANSWERS IN A DROPDOWN (owner, 23 Nov 2026, on a photo of a long question's results: "this is
   unsustainable. Put All next to the search field and the questions need to go to a dropdown next to All"). One line:
   the search, All N beside it, then Answers ▾ whose menu lists each answer with its dot and count; the same on an
   alert's own page; the menu closes on a choice, Esc and a press outside. Fails at the parent. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js')), I18N = read('js/i18n.js'), CSS = read('index.html');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function |\nif \(typeof document/); return src.slice(at, nx > 0 ? at + 10 + nx : src.length); };

test('f1191 (1) one line: the search first, All beside it, then Answers ▾ with each answer inside', () => {
  const B = fnBody(RD, 'dsnAnsBarHtml');
  assert.match(B, /return `<div class="apn-bar dsn-bar dsn-abar">\$\{search\}\$\{all\}\$\{menu\}<\/div>`/);
  assert.match(B, /role="menuitemradio"[^`]*\$\{attr\}="\$\{_rdE\(g\.k\)\}"[^`]*\$\{dot\(g\)\}<b class="dsn-cl">\$\{_rdE\(g\.l\)\}<\/b><span>\$\{g\.n\}<\/span>/);
  assert.match(B, /on \? `\$\{dot\(on\)\}<b class="dsn-cl">/, 'a chosen answer is said on the button');
  assert.match(CSS, /\.dsn-page \.dsn-abar\{flex-wrap:nowrap/);
  assert.match(I18N, /dsn_answers: 'Answers'/); assert.match(I18N, /dsn_answers: 'Svar'/);
});

test('f1191 (2) both pages draw it, and no row of answer chips is left', () => {
  assert.match(fnBody(RD, 'dsnResultsHtml'), /dsnAnsBarHtml\('dsn', S, _dsn\.tab/);
  assert.match(fnBody(RD, 'amwPageHtml'), /dsnAnsBarHtml\('amw', S, _dsn\.atab/);
  for (const f of ['dsnResultsHtml', 'amwPageHtml']) assert.doesNotMatch(fnBody(RD, f), /S\.G\.map\(g => `<button type="button" class="apn-tab is-chip/);
});

test('f1191 (3) the menu opens on a press, closes on a choice, Esc and a press outside', () => {
  assert.match(RD, /t\.closest\('\[data-dsn-aopen\]'\)/);
  assert.match(RD, /_dsn\.tab = el\.getAttribute\('data-dsn-tab'\); _dsn\.cid = null; _dsn\.amenu = null;/);
  assert.match(RD, /_dsn\.atab = el\.getAttribute\('data-amw-tab'\); _dsn\.acid = null; _dsn\.amenu = null;/);
  assert.match(RD, /e\.key === 'Escape' && document\.querySelector\('\.dsn-xmenu:not\(\[hidden\]\), \.dsn-amenu:not\(\[hidden\]\)'\)/);
  assert.match(RD, /closest\('\.dsn-aw'\)\) && document\.querySelector\('\.dsn-amenu:not\(\[hidden\]\)'\)\) dsnAnsShut\(\)/);
});
