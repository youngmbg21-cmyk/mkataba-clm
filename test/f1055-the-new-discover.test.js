/* f1055 · THE NEW DISCOVER (owner, 14–15 Nov 2026: "begin the discover process from the folders … The discovery should
   … be its own window … reverting to the results field by press when you are done"; the drawing picked on photos of the
   real pages, artifact V69F7v1fg4XdJw3eWcU8TG; "push both and build the new discover").
   Four screens on the one Discover page — the list of reads, New read, while it reads, the results of one read — and its
   one door on the Board. A read remembers WHERE it was asked and HOW MANY were chosen (the server's record), and a
   folder outside the reader's scope is never named. Fails at the parent: none of it exists. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js')), HB = strip(read('js/views/homeboard.js')), I18N = read('js/i18n.js'), CSS = read('index.html');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function |\nif \(typeof document/); return src.slice(at, nx > 0 ? at + 10 + nx : src.length); };
const ids = n => Array.from({ length: n }, (_, i) => 'NW-' + String(i + 1).padStart(2, '0'));

test('f1055 (1) a read remembers where it was asked and how many were chosen; a folder the reader cannot see is never named', async () => {
  const h = await startHati();
  try {
    const cs = ids(6).map((id, i) => fixtureContract(id, 'Supply Agreement', 'Kabras Sugar', i < 3 ? FOLDER_A : FOLDER_B, 1000000, 'Signed',
      'SUPPLY AGREEMENT\n\n9. Termination\nEither party may end this agreement on thirty days\' written notice to the other.'));
    const W = await seedWorkspace(h, { contracts: cs });
    const Q = 'How much notice does each side need to end the contract?';
    await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice', ids: ids(3), run: { id: 'cr_cccccccccccccccc', where: [FOLDER_A, FOLDER_B], of: 6 } } });
    await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice', ids: ids(6).slice(3), run: { id: 'cr_dddddddddddddddd', where: ['all', 'bad name!'], of: 'x' } } });
    const L = await W.admin.json('/api/columns/reads');
    const a = L.reads.find(r => r.id === 'cr_cccccccccccccccc'), b = L.reads.find(r => r.id === 'cr_dddddddddddddddd');
    assert.deepEqual(a.where, [FOLDER_A, FOLDER_B]); assert.equal(a.of, 6); assert.deepEqual(a.ids.sort(), ids(3));
    assert.deepEqual(b.where, ['all'], 'a word that is not a folder key is never kept'); assert.equal(b.of, null, 'a count that is not a number is never kept');
    /* the restricted person (stream A only) sees only A named, and only A's contracts */
    if (W.restricted){
      const R = await W.restricted.json('/api/columns/reads');
      const ra = R.reads.find(r => r.id === 'cr_cccccccccccccccc');
      assert.deepEqual(ra.where, [FOLDER_A]);
    }
  } finally { await h.stop(); }
});

test('f1055 (2) the four screens: the list of reads, New read, while it reads, the results; a read in flight is its own screen', () => {
  const r = fnBody(RD, 'dsnRender');
  assert.match(r, /if \(busy\) _dsn\.screen = 'reading';/, 'a read in flight always stands on its own screen');
  for (const f of ['dsnListHtml', 'dsnNewHtml', 'dsnReadingHtml', 'dsnResultsHtml']) assert.match(r, new RegExp(f + '\\('), f + ' is drawn');
  assert.match(fnBody(RD, 'rdnRender'), /dsnRender\(host, o\)/, 'the Discover page is the four screens');
  const L = fnBody(RD, 'dsnListHtml');
  /* RE-POINTED (P-42, owner's pick 20 Nov 2026: Discover the Legora + Stripe way): Question · Status · Answered · To look
     at · Where · By · When; the four filters are "+ filter" chips (dsnFChip) */
  for (const k of ['dsn_c_when', 'rdn_c_q', 'dsn_c_where', 'dsn_f_status', 'dsn_c_answered', 'dsn_t_look', 'dsn_c_by']) assert.ok(L.includes("'" + k + "'"), 'the list says ' + k);
  for (const k of ["'folder'", "'ask'", "'by'", "'when'"]) assert.ok(L.includes("dsnFChip(" + k), 'the list filters by ' + k);
  assert.match(L, /id="dsn-new"/, 'New read is the black button');
  const N = fnBody(RD, 'dsnNewHtml');
  const page = N.slice(N.lastIndexOf('return `'));
  assert.ok(page.indexOf('id="dsc-q"') < page.indexOf('${filters}') && page.indexOf('${filters}') < page.indexOf("${line('all'"), 'the question on top, then the filters, then the folders to tick');
  for (const k of ["'nfolder'", "'status'", "'party'"]) assert.ok(N.includes('dsnFChip(' + k), 'New read filters by ' + k);
  assert.match(fnBody(RD, 'dsnReadingHtml'), /data-dsn-results/, 'at the end, Open the results');
  const R = fnBody(RD, 'dsnResultsHtml');
  assert.match(R, /type="search" id="dsn-q"/, 'a full-width search');
  assert.match(R, /data-dsn-tab=/, 'the tiles filter');
  assert.match(R, /data-dsn-back/, '‹ All reads goes back');
});

test('f1055 (3) the read goes where New read chose, says where and how many, and is the one read', () => {
  const c = fnBody(RD, 'dsnChosen');
  assert.match(c, /_dsn\.pick\.has\('all'\)/); assert.match(c, /_dsnSigned/); assert.match(c, /counterparty/);
  const a = fnBody(RD, 'dsnAsk');
  assert.match(a, /A\.scope = \{ ids: ch\.ids \}/, 'the chosen contracts are what the read goes to');
  assert.match(a, /where: ch\.where, of: ch\.ids\.length/, 'its record keeps where and how many');
  assert.match(a, /askColAskHere\(o\)/, 'the one read');
  assert.doesNotMatch(RD, /negoFileChange|changes\.push/, 'nothing is filed');
  assert.match(fnBody(RD, 'dsnRunWhere'), /r\.where\.length[\s\S]*includes\('all'\)/, 'an older read without where says the folders of its contracts');
});

test('f1055 (4) the Board\'s door: Discover in Jambo\'s green with his spark, between Explorer and Draft agreement', () => {
  assert.match(HB, /\$\{hbExplorerBtnHtml\(\)\}\$\{hbDiscoverBtnHtml\(\)\}\$\{hbDraftBtnHtml\(\)\}/);
  assert.match(fnBody(HB, 'hbDiscoverBtnHtml'), /class="hb-btn is-sm hb-discover-go" data-hb-discover[\s\S]*icon\('sparkle'/);
  assert.match(HB, /on\('\[data-hb-discover\]'\)\)\{ discoverOpen\(\); return; \}/);
  assert.match(CSS, /\.hb-btn\.hb-discover-go\{[^}]*background:var\(--accent-ink\);color:var\(--color-surface\)/);
});

test('f1055 (5) every word in both books; colours only from tokens', () => {
  const keys = [...new Set((RD.match(/'dsn_\w+'/g) || []).map(k => k.slice(1, -1)))].concat(['hb_discover_tip']);
  assert.ok(keys.length >= 50, 'found ' + keys.length);
  for (const k of keys){ const n = (I18N.match(new RegExp('^    ' + k + '(?:_one|_other)?: ', 'gm')) || []).length; assert.ok(n === 2 || n === 4, k + ' in both books (' + n + ')'); }
  const rules = CSS.split('\n').filter(l => /\.dsn-|hb-discover-go/.test(l)).join('\n');
  assert.doesNotMatch(rules, /#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
