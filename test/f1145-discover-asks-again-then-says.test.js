/* f1145 · DISCOVER ASKS AGAIN, THEN SAYS (owner, 22 Nov 2026: "on the discover page, when I press on the questions, the side
   panel says fetching the answers but nothing is happening"). A question was marked "asked" for good the first time its
   answers were sent for, so three things left "Fetching the answers…" on screen for ever:
     (1) a load that failed (a slow or busy moment) was never sent again;
     (2) a load sent before the contracts were known (no ids) came back empty and was never sent again;
     (3) answers thrown away to be read afresh (a question's rule changed: askColRuleSet) were never fetched again.
   Now a finished load lets its questions go; one still without answers is asked again a little later, RDN_TRIES times in
   all, and then the panel says it could not fetch them, with Try again (rdnRetry), which asks once more.
   AT THE PARENT (1)–(3) fail: the second draw sends nothing, and there is no rdnFailed / rdnRetry. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js'));

/* the page's asking, run on its own: from `const _rdnLoading` to the end of rdnRedrawIfHere */
function world(load, contracts){
  const a = RD.indexOf('const _rdnLoading'), b = RD.indexOf('function rdnRedrawIfHere(');
  assert.ok(a >= 0 && b > a, 'the asking block exists');
  const end = RD.indexOf('\n}', b) + 2;
  const W = { sent: [], draws: 0, timers: [], AC: { ans: {} }, state: { view: 'reads', contracts: contracts || [{ id: 'c1' }, { id: 'c2' }] } };
  const window = { askColLoadMany: (ks, ids) => { W.sent.push({ ks: [...ks], ids: [...ids] }); return load(ks, ids, W); } };
  const api = new Function('window', 'state', 'AC', 'renderReads', 'setTimeout', RD.slice(a, end)
    + '; return { rdnAnswers, rdnFailed, rdnRetry, RDN_TRIES };')(window, W.state, W.AC, () => { W.draws++; }, (fn, ms) => { W.timers.push({ fn, ms }); });
  return Object.assign(W, api);
}
const settle = () => new Promise(r => setImmediate(r));

test('f1145 (1) a failed load is asked again, then said with Try again — never "Fetching" for ever', async () => {
  let fail = true;
  const W = world((ks, ids, W) => { if (fail) return Promise.reject(new Error('busy')); ks.forEach(k => { W.AC.ans[k] = { c1: { found: true } }; }); return Promise.resolve(true); });
  assert.equal(W.rdnAnswers('q1'), null); await settle();
  assert.equal(W.sent.length, 1, 'asked once');
  assert.ok(W.draws >= 1 && W.timers.length === 1, 'drawn again, and a later look is set');
  assert.equal(W.rdnFailed(['q1']), false, 'not given up after one try');
  W.rdnAnswers('q1'); await settle();
  assert.equal(W.sent.length, 2, 'the next draw asks again — at the parent it sent nothing');
  for (let i = 2; i < W.RDN_TRIES; i++){ W.rdnAnswers('q1'); await settle(); }
  assert.equal(W.sent.length, W.RDN_TRIES, 'asked RDN_TRIES times in all');
  assert.equal(W.rdnFailed(['q1']), true, 'then given up, so the panel can say so');
  W.rdnAnswers('q1'); await settle();
  assert.equal(W.sent.length, W.RDN_TRIES, 'and no more asking on its own: bounded');
  fail = false;
  W.rdnRetry(['q1']);
  assert.equal(W.rdnFailed(['q1']), false, 'Try again lets it be asked once more');
  W.rdnAnswers('q1'); await settle();
  assert.equal(W.sent.length, W.RDN_TRIES + 1);
  assert.deepEqual(W.rdnAnswers('q1'), { c1: { found: true } }, 'and the answers come');
});

test('f1145 (2) a load before the contracts are known waits for them, then asks with them', async () => {
  const W = world((ks, ids, W) => { ks.forEach(k => { W.AC.ans[k] = {}; }); return Promise.resolve(true); }, []);
  W.rdnAnswers('q1'); await settle();
  assert.equal(W.sent.length, 0, 'nothing sent with no contracts');
  assert.equal(W.timers.length, 1, 'a later look is set');
  W.state.contracts.push({ id: 'c1' });
  W.rdnAnswers('q1'); await settle();
  assert.equal(W.sent.length, 1, 'asked once the contracts are here');
  assert.deepEqual(W.sent[0].ids, ['c1']);
  assert.deepEqual(W.rdnAnswers('q1'), {}, 'answered (none found is an answer, not a wait)');
});

test('f1145 (3) answers thrown away later (a rule changed) are fetched again', async () => {
  const W = world((ks, ids, W) => { ks.forEach(k => { W.AC.ans[k] = { c1: { found: true } }; }); return Promise.resolve(true); });
  W.rdnAnswers('q1'); await settle();
  assert.ok(W.rdnAnswers('q1'));
  delete W.AC.ans.q1; /* as askColRuleSet does */
  assert.equal(W.rdnAnswers('q1'), null); await settle();
  assert.equal(W.sent.length, 2, 'asked again — at the parent it was marked asked for good');
  assert.ok(W.rdnAnswers('q1'), 'and the fresh answers come');
});

test('f1145 (4) the panel and the results say it, with Try again wired to rdnRetry, in both books', () => {
  const R = read('js/views/reads.js');
  assert.match(strip(R), /if \(!rows\) return `<div class="dsl dsl6">\$\{head\}\$\{rdnWaitHtml\(r\.askIds, 'dsl-say'\)\}<\/div>`;/, 'the read\'s panel');
  assert.match(strip(R), /if \(!S\) return head \+ rdnWaitHtml\(r\.askIds, 'dsc-quiet dsc-pad'\);/, 'the results page');
  assert.match(strip(R), /closest\('\[data-dsn-refetch\]'\)\)\)\{ stop\(e\); rdnRetry\(/, 'Try again asks again');
  const I = read('js/i18n.js');
  assert.equal(I.split('    dsc_load_failed:').length, 3, 'both books');
});
