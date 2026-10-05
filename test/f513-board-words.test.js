/* f513 — THE BOARD'S WORD BOOK (work order "the board that answers right",
   Part 3, 5 Oct 2026; Power BI's linguistic schema)

     A. the route: an admin adds, replaces and removes a word; a non-admin is
        refused; a meaning outside HaTi's own kinds and values is refused; an
        ordinary settings save never writes the list (a difference, stored);
     B. the reader swaps a company word for a phrase it already knows, before
        it reads — longest first, whole words only, in either language;
     C. a word the board already reads is refused in the drawer (hbWordClash);
     D. Copilot is handed the list in the data guide. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');
const { read, strip, J, boardWorld, openPlan } = require('./board-world');

describe('F513 (A) — the route', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { contracts: [] }); });
  after(async () => { await h.stop(); });
  test('an admin adds a word; it rides the settings blob with who and when', async () => {
    const r = await W.admin.json('/api/settings/board-words', { method: 'PUT', body: { say: 'deals', lang: 'en', means: { kind: 'set', value: 'contracts' } } });
    assert.equal(r.boardWords.length, 1);
    const boot = await W.unrestricted.json('/api/bootstrap');
    const w = boot.settings.boardWords[0];
    assert.equal(w.say, 'deals'); assert.deepEqual(w.means, { kind: 'set', value: 'contracts' });
    assert.ok(w.by && /^\d{4}-\d{2}-\d{2}$/.test(w.at));
  });
  test('the same word and language is replaced, not doubled', async () => {
    const r = await W.admin.json('/api/settings/board-words', { method: 'PUT', body: { say: 'Deals', lang: 'en', means: { kind: 'stage', value: 'Under Review' } } });
    assert.equal(r.boardWords.length, 1); assert.equal(r.boardWords[0].means.value, 'Under Review');
  });
  test('only an admin may write it', async () => {
    const r = await W.unrestricted.raw('/api/settings/board-words', { method: 'PUT', body: { say: 'BU', lang: 'en', means: { kind: 'split', value: 'folder' } } });
    assert.equal(r.status, 403);
  });
  test('a meaning outside HaTi\'s own kinds and values is refused', async () => {
    for (const body of [{ say: 'x', lang: 'en', means: { kind: 'set', value: 'contracts' } }, { say: 'BU', lang: 'de', means: { kind: 'split', value: 'folder' } },
      { say: 'BU', lang: 'en', means: { kind: 'code', value: 'x' } }, { say: 'BU', lang: 'en', means: { kind: 'split', value: 'colour' } },
      { say: 'BU', lang: 'en', means: { kind: 'measure', value: 'profit' } }, { say: 'BU', lang: 'en', means: { kind: 'set', value: '<script>' } }]) {
      const r = await W.admin.raw('/api/settings/board-words', { method: 'PUT', body });
      assert.equal(r.status, 400, JSON.stringify(body));
    }
  });
  test('an ordinary settings save never writes the list', async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { boardWords: [{ say: 'evil', lang: 'en', means: { kind: 'set', value: 'x' } }], somethingElse: 1 } });
    const boot = await W.admin.json('/api/bootstrap');
    assert.deepEqual(boot.settings.boardWords.map(w => w.say), ['Deals']);
  });
  test('a word is removed', async () => {
    const r = await W.admin.json('/api/settings/board-words', { method: 'PUT', body: { say: 'deals', lang: 'en', remove: true } });
    assert.equal(r.boardWords.length, 0);
    const again = await W.admin.raw('/api/settings/board-words', { method: 'PUT', body: { say: 'deals', lang: 'en', remove: true } });
    assert.equal(again.status, 404);
  });
});

const WORDS = [
  { say: 'deals', lang: 'en', means: { kind: 'set', value: 'contracts' } },
  { say: 'BU', lang: 'en', means: { kind: 'split', value: 'folder' } },
  { say: 'pipeline deals', lang: 'en', means: { kind: 'stage', value: 'Under Review' } },
  { say: 'leverantörsavtal', lang: 'sv', means: { kind: 'side', value: 'supplier' } },
];
const withWords = () => boardWorld({ settings: { boardWords: WORDS } });

describe('F513 (B) — the reader swaps a word before it reads', () => {
  test('whole words, longest first, either language', () => {
    const w = withWords();
    assert.equal(w.hbWordsApply('deals by BU'), 'contracts by stream');
    assert.equal(w.hbWordsApply('pipeline deals by counterparty'), 'in review by counterparty');
    assert.equal(w.hbWordsApply('BUdget dealsy'), 'BUdget dealsy', 'never inside another word');
    assert.equal(w.hbWordsApply('leverantörsavtal by stage'), 'suppliers by stage');
  });
  test('"deals by BU" draws contracts by value stream, free', () => {
    const w = withWords();
    assert.ok(w.hbAsk('deals by BU'), 'read free');
    assert.equal(openPlan(w).P.split.by, 'folder');
  });
  test('with no words nothing is changed', () => {
    const w = boardWorld();
    assert.equal(w.hbWordsApply('deals by BU'), 'deals by BU');
  });
});

describe('F513 (C) — a built-in word keeps its meaning', () => {
  test('"stage", "value", "suppliers" and a counterparty\'s name clash; a new word does not', () => {
    const w = boardWorld();
    for (const say of ['stage', 'suppliers', 'renewals', 'Siginon']) assert.equal(w.hbWordClash(say), true, say);
    for (const say of ['deals', 'BU', 'ramavtal']) assert.equal(w.hbWordClash(say), false, say);
  });
  test('the drawer refuses a clash before it is sent (source)', () => {
    const src = strip(read('js/views/settings.js'));
    assert.match(src, /if\(window\.hbWordClash&&hbWordClash\(say\)\) return stDrawerRefuse\(i18t\('st_words_clash',\{ word:say \}\)\);/);
    assert.match(src, /await api\('settings\/board-words','PUT',body\)/);
  });
  test('the built-in words are read off the reader, never a copy', () => {
    const w = boardWorld();
    const b = J(w.hbWordsBuiltIn());
    assert.deepEqual(b.map(x => x.group), Object.keys(J(w.HB_RC_GW)));
    assert.ok(b.find(x => x.group === 'status').words.includes('stages'));
  });
});

describe('F513 (D) — Copilot is handed the list', () => {
  test('the data guide names every word and its meaning', () => {
    const w = withWords();
    const g = w.hbDataGuide('all', 5000);
    assert.match(g, /Company words \(read them so\): "deals" = set contracts; "BU" = split folder;/);
  });
});
