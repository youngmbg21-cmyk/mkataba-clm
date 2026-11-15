/* f1059 · BUILD A PACK, AND THE COLUMNS THAT LEAD (owner, 15 Nov 2026: "we need a process of build an ask a pack …
   you curate your bundle of due diligence questions coming from your standards"; "There should only be one pack at a
   time. So you build a new pack, due diligence falls off into a drop down"; on the results: "contract number should
   always be there … If you search a particular customer or supplier, then their name should not be in the body because
   they are the subject"; "Answer first"; drawings artifacts EnM52DHwv72XqZrM3HNZkA and JVhMMMio8K97DFdgEizhPy).
   The server is the wall: anyone who may read builds a pack for the company, at most COLUMN_Q_MAX questions; its
   builder or an admin changes or deletes it; the built-in pack is never deleted; a delete is undone by posting its id.
   The page shows ONE pack in the row with the rest in a dropdown; the builder offers our standards' questions; the
   results lead with Number and Contract and drop a column every row shares. Fails at the parent: none of it exists. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js')), I18N = read('js/i18n.js'), CSS = read('index.html');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function |\nif \(typeof document/); return src.slice(at, nx > 0 ? at + 10 + nx : src.length); };
const Q = n => Array.from({ length: n }, (_, i) => ({ question: `Does clause ${i + 1} name a supplier warranty?`, name: 'W' + (i + 1) }));

test('f1059 (1) the server: build, change, delete, undo; the walls and the limit', async () => {
  const h = await startHati();
  try {
    const W = await seedWorkspace(h, {});
    const a = await W.restricted.json('/api/columns/packs', { method: 'POST', body: { name: 'Supplier check', questions: Q(3).concat([{ question: 'When must we pay an invoice under this contract?', name: 'Payment days', std: 'Payment terms · 45 days' }]) } });
    assert.match(a.pack.id, /^pk_/); assert.equal(a.pack.questions.length, 4); assert.equal(a.pack.questions[3].std, 'Payment terms · 45 days');
    let L = await W.restricted.json('/api/columns');
    assert.ok(L.packs.some(p => p.id === a.pack.id), 'listed for the company');
    const nine = await W.restricted.raw('/api/columns/packs', { method: 'POST', body: { name: 'Too many', questions: Q(9) } });
    assert.equal(nine.status, 400, 'a pack holds what one read answers'); assert.match(nine.json.error, /at most 8/);
    assert.equal((await W.restricted.raw('/api/columns/packs', { method: 'POST', body: { name: '', questions: Q(2) } })).status, 400, 'a pack has a name');
    assert.equal((await W.restricted.raw('/api/columns/packs', { method: 'POST', body: { name: 'Count', questions: [{ question: 'How many of our contracts renew?' }] } })).status, 400, 'a counting question is not a pack question');
    /* only its builder or an admin changes or deletes it */
    assert.equal((await W.unrestricted.raw('/api/columns/packs/' + a.pack.id, { method: 'PUT', body: { name: 'Mine now', questions: Q(1) } })).status, 403);
    assert.equal((await W.unrestricted.raw('/api/columns/packs/' + a.pack.id, { method: 'DELETE' })).status, 403);
    const ch = await W.restricted.json('/api/columns/packs/' + a.pack.id, { method: 'PUT', body: { name: 'Supplier check 2', questions: Q(2) } });
    assert.equal(ch.pack.name, 'Supplier check 2'); assert.equal(ch.pack.questions.length, 2);
    /* the built-in pack: changed by an admin, never deleted */
    const dd = L.packs.find(p => p.builtin);
    assert.equal((await W.restricted.raw('/api/columns/packs/' + dd.id, { method: 'PUT', body: { name: 'DD', questions: Q(1) } })).status, 403);
    assert.equal((await W.admin.raw('/api/columns/packs/' + dd.id, { method: 'DELETE' })).status, 409);
    /* delete, then Undo brings it back whole */
    await W.admin.json('/api/columns/packs/' + a.pack.id, { method: 'DELETE' });
    L = await W.restricted.json('/api/columns');
    assert.ok(!L.packs.some(p => p.id === a.pack.id), 'a deleted pack is not listed');
    const back = await W.restricted.json('/api/columns/packs', { method: 'POST', body: { id: a.pack.id, name: 'Supplier check 2', questions: Q(2) } });
    assert.equal(back.pack.id, a.pack.id);
    assert.equal((await W.unrestricted.raw('/api/columns/packs', { method: 'POST', body: { id: dd.id, name: 'x', questions: Q(1) } })).status, 404, 'an id is brought back only from the bin, by its builder or an admin');
  } finally { await h.stop(); }
});

test('f1059 (2) the row: one pack at a time, the others in a dropdown with Build and Manage', () => {
  const R = fnBody(RD, 'dsnPackRowHtml');
  assert.match(R, /const cur = dsnPackCur\(\)/);
  assert.match(R, /data-dsc-pack="\$\{_rdE\(cur\.id\)\}"/, 'only the current pack is a chip');
  assert.match(R, /data-dsn-pkmenu aria-haspopup="menu" aria-expanded="\$\{open\}"/);
  assert.match(R, /P\.map\(p => `<button type="button" role="menuitem" class="dsn-pk-i[\s\S]*data-dsn-pkpick=/);
  assert.match(R, /data-dsn-pkbuild[\s\S]*data-dsn-pkmanage/);
  assert.match(fnBody(RD, 'dsnPackCur'), /P\.find\(p => p\.id === id\) \|\| P\.find\(p => p\.builtin\)/, 'the last built or chosen, else Due diligence');
  assert.match(fnBody(RD, 'dsnPackSave'), /dsnPackCurSet\(p\.id\)/, 'a new pack takes the row');
  assert.match(RD, /if \(e\.key === 'Escape' && _dsn\.pkMenu\)/, 'Esc closes the dropdown');
  assert.match(RD, /addEventListener\('pointerdown', e => \{ if \(!_dsn\.pkMenu/, 'a press elsewhere closes it');
  assert.match(RD, /if \(t\.closest\('\[data-dsn-pkmenu\]'\)\)\{ _dsnStop\(e\); _dsn\.pkMenu = !_dsn\.pkMenu;/, 'press it again and it closes');
});

test('f1059 (3) the builder: questions from our standards, the note re-read, the limit said; Manage edits and deletes with Undo', () => {
  const S = fnBody(RD, 'dsnStdQuestions');
  assert.match(S, /playbook\(\)/); assert.match(S, /book\.positions/); assert.match(S, /book\.ranges/);
  assert.match(S, /What does this contract say about/, 'a standard not named still asks');
  const P = fnBody(RD, 'dsnPackPanel');
  assert.match(P, /full = n >= DSN_PACK_MAX/); assert.match(P, /'dsn_pk_full'/, 'the limit is said, never a silent stop');
  assert.match(P, /data-dsn-pkedit=[\s\S]*data-dsn-pkdel=/); assert.match(P, /may && !p\.builtin/, 'the built-in pack has no Delete');
  assert.match(fnBody(RD, 'dsnPackDelete'), /confirmDialog\(/); assert.match(fnBody(RD, 'dsnPackDelete'), /dsnPackRestore\(p\)/, 'Undo after a delete');
  assert.match(fnBody(RD, 'dsnPackSave'), /dsnPackDelete\(p, \{ quiet: true \}\)/, 'Undo after a save');
  assert.match(RD, /const DSN_PACK_MAX = 8/);
});

test('f1059 (4) the columns: Number and Contract lead, a shared Party or Folder steps out, Answer before the quote', () => {
  const L = fnBody(RD, 'dsnLeadCols');
  assert.ok(L.indexOf("k: 'no'") < L.indexOf("k: 'name'"));
  assert.match(L, /if \(!S\.party\) out\.push\(\{ k: 'party'/); assert.match(L, /if \(!S\.folder\) out\.push\(\{ k: 'folder'/);
  assert.match(fnBody(RD, 'dsnSubject'), /v\.length === 1/);
  const R = fnBody(RD, 'dsnResultsHtml');
  assert.ok(R.indexOf("k: 'ans'") < R.indexOf("k: 'says'"), 'answer first');
  assert.match(R, /dsnSubjectWords\(S\.rows\.map\(x => x\.c\)\)/, 'the subject named once under the title');
});

test('f1059 (5) words in both books; colours only from tokens', () => {
  const keys = [...new Set((RD.match(/'dsn_pk_\w+'/g) || []).map(k => k.slice(1, -1)))].concat(['dsn_c_no']);
  assert.ok(keys.length >= 25, 'found ' + keys.length);
  for (const k of keys){ const n = (I18N.match(new RegExp('^    ' + k + '(?:_one|_other)?: ', 'gm')) || []).length; assert.ok(n === 2 || n === 4, k + ' in both books (' + n + ')'); }
  const rules = CSS.split('\n').filter(l => /\.dsn-pk|\.dsn-pkq|\.dsn-pkm/.test(l)).join('\n');
  assert.ok(rules.length > 500); assert.doesNotMatch(rules, /#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
