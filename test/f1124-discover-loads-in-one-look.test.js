/* f1124 · DISCOVER LOADS IN ONE LOOK (owner, 20 Nov 2026: "fix Discover", after "advise why it takes a while for the
   discover page to load"). Measured on a copy with 66 contracts and 19 questions: the page sent one answers request per
   question (19), each carrying the drawn wording of every contract (about 2.4 MB each, ~45 MB in all, every paper drawn
   in the browser once per question), and drew the whole page again after each one landed.
   (1) the server answers many questions in one request; without wording, a contract whose wording is stored is
       answered at once and one whose wording exists only where it is drawn is named in `need`, never shown unchecked;
       with its wording it is answered, and a wrong drawing is stale, as the one-question request says; a question
       nobody keeps is named `missing`; the walls are the one-question request's.
   (2) the page gathers every question a draw asks for into one load and draws again once; that load sends no wording,
       then draws and sends only the contracts the server named.
   AT THE PARENT both fail: the route knows no `askIds`, and the page loads one question at a time with every wording. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js')), AC = strip(read('js/views/askcolumn.js'));
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists');
  const nx = src.slice(at + 10).search(/\n(?:async )?function |\n(?:const|let) [A-Za-z_$]/); return src.slice(at, nx < 0 ? undefined : at + 10 + nx); };

const BODY = 'SUPPLY AGREEMENT\n\n12. Data\nThe Supplier acts as data processor under a data processing agreement signed by both parties.';
const DRAWN = 'SERVICES AGREEMENT\n\n4. Data\nThe Provider processes personal data only on our written instructions, under the terms in Schedule 2.';

test('f1124 (1) many questions in one request; wording only where the server needs it', async () => {
  const h = await startHati();
  try {
    const stored = ['DL-01', 'DL-02'], drawn = 'DL-03';
    const cs = stored.map(id => fixtureContract(id, 'Supply Agreement', 'Kabras Sugar', FOLDER_A, 1000000, 'Signed', BODY))
      .concat([fixtureContract(drawn, 'Services Agreement', 'Kabras Sugar', FOLDER_A, 500000, 'Signed')]);
    const W = await seedWorkspace(h, { contracts: cs });
    const all = stored.concat([drawn]), texts = { [drawn]: DRAWN };
    const a1 = (await W.admin.json('/api/ai/column', { method: 'POST', body: { question: 'Does the supplier act as a data processor?', name: 'Processor', ids: all, texts } })).ask.id;
    const a2 = (await W.admin.json('/api/ai/column', { method: 'POST', body: { question: 'Which country\'s law governs this contract?', name: 'Law', ids: all, texts } })).ask.id;
    const one = async k => (await W.admin.json('/api/columns/answers', { method: 'POST', body: { askId: k, ids: all, texts } })).answers;
    const [o1, o2] = [await one(a1), await one(a2)];
    assert.deepEqual(Object.keys(o1).sort(), all, 'the one-question request answers all three (the drawn one with its wording)');

    /* first look: no wording at all */
    const m = await W.admin.json('/api/columns/answers', { method: 'POST', body: { askIds: [a1, a2, 'ca_nobody_keeps_this'], ids: all } });
    assert.deepEqual(m.missing, ['ca_nobody_keeps_this'], 'a question nobody keeps is named');
    assert.deepEqual(m.need, [drawn], 'only the drawn paper needs its wording');
    for (const [k, o] of [[a1, o1], [a2, o2]]) {
      assert.deepEqual(Object.keys(m.byAsk[k].answers).sort(), stored, k + ': the stored papers answered at once, the drawn one not shown unchecked');
      for (const id of stored) assert.deepEqual(m.byAsk[k].answers[id], o[id], k + ' ' + id + ': the same answer the one-question request gives');
      assert.equal(m.byAsk[k].ask.id, k);
    }

    /* second look: only the drawn one, with its wording */
    const m2 = await W.admin.json('/api/columns/answers', { method: 'POST', body: { askIds: [a1, a2], ids: m.need, texts } });
    assert.deepEqual(m2.need, [], 'with wording sent, nothing more is asked for');
    for (const [k, o] of [[a1, o1], [a2, o2]]) assert.deepEqual(m2.byAsk[k].answers[drawn], o[drawn], k + ': the drawn paper answered with its wording');
    const bad = await W.admin.json('/api/columns/answers', { method: 'POST', body: { askIds: [a1], ids: [drawn], texts: { [drawn]: DRAWN + ' Changed since.' } } });
    assert.deepEqual(bad.byAsk[a1].stale, [drawn], 'a drawing that changed since the read is stale, never shown');

    /* the walls: a contract outside what the person may see is not answered */
    if (W.restricted) {
      const r = await W.restricted.json('/api/columns/answers', { method: 'POST', body: { askIds: [a1], ids: all } });
      const one1 = await W.restricted.json('/api/columns/answers', { method: 'POST', body: { askId: a1, ids: all } });
      assert.deepEqual(Object.keys(r.byAsk[a1].answers).sort(), Object.keys(one1.answers).filter(id => stored.includes(id)).sort(), 'the same walls as one question');
    }
  } finally { await h.stop(); }
});

test('f1124 (2) the page asks for every question in one load, sends wording only where named, and draws once', () => {
  const R = fnBody(RD, 'rdnAnswers');
  assert.match(R, /askColLoadMany\(ks, ids\)/, 'the gathered questions are loaded together');
  assert.doesNotMatch(R, /askColLoad\(askId/, 'no longer one request per question');
  assert.equal((R.match(/renderReads\(\)/g) || []).length, 1, 'one redraw, after the load');
  assert.match(R, /_rdnQueue\.push\(String\(askId\)\)/, 'a question asked while the page is drawn joins the waiting load');
  const L = fnBody(AC, 'askColLoadMany');
  assert.match(L, /api\('columns\/answers', 'POST', \{ askIds: ks, ids \}\)/, 'the first look sends no wording');
  assert.match(L, /askColTexts\(need\)/, 'only the papers the server named are drawn');
  assert.equal((L.match(/askColTexts\(/g) || []).length, 1, 'and drawn once, for every question together');
  assert.match(L, /askColDrop\(k\)/, 'a question nobody keeps leaves quietly');
  assert.match(read('js/views/askcolumn.js'), /Object\.assign\(window, \{[^}]*\baskColLoadMany\b/, 'published');
});
