/* f954 — THE THREAD: reads in batches, and the Reads page (the owner picked "The thread", 28 Oct 2026, over "The
   worklist" and "Keep reading"; docs/MAP-HISTORY.md "READS IN BATCHES")
     1 · the plan: the next are the first NOT YET READ, in the list's order — kept answers are never spent again;
         50 or 100 a press (AC_SIZES), the wall 100 on both hosts; Ask again reads the first N shown afresh
     2 · one sentence carries the choice, the count, where they stand and the cost: "the next 50 | 100 of the 450
         not yet read: contracts 51–100 · 50 Jambo calls. The 50 already read are kept and cost nothing";
         the first read "the first 50 | 100 of the 500 shown"; every one read says so and offers the kept answers;
         a batch with a gap says "down the list from no. N", never a range that is not one
     3 · the server records every press (column_reads: who, when, which contracts, from–to, calls), its batches
         share the record, Stop marks it; GET /api/columns/reads counts a read inside what the reader may see
     4 · the Reads page is on every list a page must be on: the "/" word, the Guide row, the Handbook chapter,
         the Brain, the place kept across a refresh, Jambo's page names
   At the parent (1) fails (no askColPlan), (2) fails, (3) fails (no column_reads), (4) fails.
   Run: node --test test/f954-the-thread.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');

const EN = (() => { const src = read('js/i18n.js'); const en = {};
  for (const m of src.matchAll(/^\s+([a-z][a-z0-9_]*): (["'])((?:[^"'\\]|\\.)*)\2,?\s*$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
  return en; })();
function stage(o){
  o = o || {};
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null) ? v[k] : '');
  const sb = { console, i18t: (k, v) => fill(EN[k] || k, v), i18tn: (k, n, v) => fill(EN[k + (n === 1 ? '_one' : '_other')] || k, Object.assign({ n }, v || {})),
    localStorage: { _m: {}, getItem(k){ return this._m[k] == null ? null : this._m[k]; }, setItem(k, v){ this._m[k] = String(v); } },
    regFiltered: () => (o.shown || []).map(id => ({ id })), regHome: () => true, regScope: () => 'all', regState: () => ({ show: 'list', ask: [] }), regHomeNarrow: () => false,
    esc: s => String(s), currentUser: () => ({ role: 'admin' }), document: undefined, crypto: { getRandomValues(a){ for (let i = 0; i < a.length; i++) a[i] = (i * 37 + 11) % 256; } } };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(read('js/views/askcolumn.js').replace(/^import .*$/gm, ''), sb, { filename: 'askcolumn.js' });
  return sb;
}
const ids = n => Array.from({ length: n }, (_, i) => 'HC-' + (1001 + i));
const text = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ \./g, '.').replace(/ ,/g, ',').trim();

test('1 · the plan: the next are the first not yet read, in the list\'s order; 50 or 100; the wall 100 on both hosts', () => {
  const sb = stage({ shown: ids(500) });
  assert.equal(JSON.stringify(sb.AC_SIZES), '[50,100]');
  assert.equal(sb.AC_MAX, 100);
  assert.match(read('server/server.js'), /^const COLUMN_MAX = 100;/m, 'the server holds the same wall');
  assert.equal(sb.acSize(), 50, 'the first choice is 50');
  sb.acSizeSet(100); assert.equal(sb.acSize(), 100, 'the choice is kept'); sb.acSizeSet(7); assert.equal(sb.acSize(), 50, 'a number that is not a size falls back');
  let p = sb.askColPlan({ askId: 'a1', size: 50 });
  assert.deepEqual([p.shown, p.read, p.unread, p.pick.length, p.from, p.to, p.contiguous, p.calls], [500, 0, 500, 50, 1, 50, true, 50]);
  /* the first 50 read and kept: the next are 51–100, never the first 50 again */
  sb.AC.ans.a1 = Object.fromEntries(ids(50).map(id => [id, { found: true }]));
  p = sb.askColPlan({ askId: 'a1', size: 50 });
  assert.deepEqual([p.read, p.unread, p.pick[0], p.pick[49], p.from, p.to, p.contiguous], [50, 450, 'HC-1051', 'HC-1100', 51, 100, true]);
  p = sb.askColPlan({ askId: 'a1', size: 100 });
  assert.deepEqual([p.pick.length, p.from, p.to, p.calls], [100, 51, 150, 100]);
  /* a gap: a contract in the middle read already is skipped, and the range is no longer one */
  sb.AC.ans.a1['HC-1070'] = { found: true };
  p = sb.askColPlan({ askId: 'a1', size: 50 });
  assert.deepEqual([p.read, p.pick.includes('HC-1070'), p.from, p.to, p.contiguous], [51, false, 51, 101, false]);
  /* Ask again reads the first N shown afresh */
  p = sb.askColPlan({ askId: 'a1', size: 50, force: true });
  assert.deepEqual([p.read, p.pick[0], p.from, p.to], [0, 'HC-1001', 1, 50]);
  /* a pack: a contract lacking ANY of its questions is not yet read */
  sb.AC.ans.a2 = Object.fromEntries(ids(30).map(id => [id, { found: true }]));
  p = sb.askColPlan({ askIds: ['a1', 'a2'], size: 50 });
  assert.deepEqual([p.read, p.pick[0]], [30, 'HC-1031']);
  /* a press is named, so its batches share one record */
  const run = sb.askColRunId(p);
  assert.match(run.id, /^cr_[0-9a-f]{16}$/); assert.deepEqual([run.from, run.to], [p.from, p.to]);
});

test('2 · one sentence: the choice, the count, where they stand, the cost', () => {
  const sb = stage({ shown: ids(500) });
  const say = (o, s) => text(sb.askColSentenceHtml(sb.askColPlan(o), Object.assign({ force: !!o.force }, s || {})));
  assert.equal(say({ askId: 'a1', size: 50 }), 'Jambo reads the first 50 100 of the 500 shown: contracts 1–50 · 50 Jambo calls. Every answer comes with the sentence it came from. Nothing is filed.');
  assert.match(sb.askColSentenceHtml(sb.askColPlan({ askId: 'a1', size: 100 })), /<button type="button" class="ac-size-b" data-ac-size="50" aria-pressed="false">50<\/button><button type="button" class="ac-size-b on" data-ac-size="100" aria-pressed="true">100<\/button>/, 'the choice is inside the sentence, the chosen one lit');
  sb.AC.ans.a1 = Object.fromEntries(ids(50).map(id => [id, { found: true }]));
  assert.equal(say({ askId: 'a1', size: 50 }), 'Jambo reads the next 50 100 of the 450 not yet read: contracts 51–100 · 50 Jambo calls. The 50 already read are kept and cost nothing. Every answer comes with the sentence it came from. Nothing is filed.');
  assert.equal(say({ askId: 'a1', size: 50, force: true }), 'Ask again reads the first 50 100 of the 500 shown afresh, even where an answer is kept: contracts 1–50 · 50 Jambo calls.');
  /* a pack says it reads once and answers every question */
  assert.match(say({ askIds: ['a1'], size: 50 }, { pack: true, q: 5 }), /^Jambo reads the next 50 100 of the 450 not yet read, once each, and answers all 5 questions from that one read: contracts 51–100 · 50 Jambo calls\./);
  /* fewer left than a size: no choice to make, the count said plainly */
  sb.AC.ans.a1 = Object.fromEntries(ids(488).map(id => [id, { found: true }]));
  assert.equal(say({ askId: 'a1', size: 50 }), 'Jambo reads the 12 not yet read: contracts 489–500 · 12 Jambo calls. The 488 already read are kept and cost nothing. Every answer comes with the sentence it came from. Nothing is filed.');
  /* a gap is said as one, never as a range that is not one */
  sb.AC.ans.a1 = Object.fromEntries(ids(50).concat(['HC-1070']).map(id => [id, { found: true }]));
  assert.match(say({ askId: 'a1', size: 50 }), /: 50 down the list from no\. 51 · 50 Jambo calls\./);
  /* every one read: the kept answers offered, nothing to read */
  sb.AC.ans.a1 = Object.fromEntries(ids(500).map(id => [id, { found: true }]));
  assert.equal(say({ askId: 'a1', size: 50 }), 'Every one of the 500 shown is read and kept, free to bring onto the list. Ask again reads them afresh.');
  assert.equal(sb.askColAskWords(sb.askColPlan({ askId: 'a1', size: 50, force: true })), 'Ask again · 50');
  sb.AC.ans.a1 = Object.fromEntries(ids(50).map(id => [id, { found: true }]));
  assert.equal(sb.askColAskWords(sb.askColPlan({ askId: 'a1', size: 50 })), 'Read the next 50');
  assert.equal(sb.askColAskWords(sb.askColPlan({ askId: 'a9', size: 50 })), 'Ask 50 contracts');
  /* a small book: no choice to make either */
  const small = stage({ shown: ids(12) });
  assert.equal(text(small.askColSentenceHtml(small.askColPlan({ askId: 'a1', size: 50 }))), 'Jambo reads the 12 shown · 12 Jambo calls. Every answer comes with the sentence it came from. Nothing is filed.');
});

test('3 · the server records every press; its batches share the record; Stop marks it; the count is what the reader may see', async () => {
  const h = await startHati();
  try {
    /* the first twenty in stream B — the restricted person (stream A only) must count none of them read */
    const cs = ids(30).map((id, i) => fixtureContract(id, 'Supply Agreement', 'Kabras Sugar', i < 20 ? FOLDER_B : FOLDER_A, 1000000, 'Signed',
      'SUPPLY AGREEMENT\n\n9. Termination\nEither party may end this agreement on thirty days\' written notice to the other.'));
    const W = await seedWorkspace(h, { contracts: cs });
    const Q = 'How much notice does each side need to end the contract?';
    const r1 = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice to end', ids: ids(10), run: { id: 'cr_aaaaaaaaaaaaaaaa', from: 1, to: 20 } } });
    assert.equal(r1.run.id, 'cr_aaaaaaaaaaaaaaaa', 'the press keeps its name');
    const r2 = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice to end', ids: ids(20).slice(10), run: { id: 'cr_aaaaaaaaaaaaaaaa', from: 1, to: 20 } } });
    assert.equal(r2.run.id, 'cr_aaaaaaaaaaaaaaaa');
    /* the same 20 again: kept, free — and still one record, no calls added */
    const r3 = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice to end', ids: ids(20), run: { id: 'cr_bbbbbbbbbbbbbbbb', from: 1, to: 20 } } });
    assert.equal(r3.calls, 0); assert.equal(r3.cached, 20);
    const L = await W.admin.json('/api/columns/reads');
    const a = L.reads.find(r => r.id === 'cr_aaaaaaaaaaaaaaaa'), b = L.reads.find(r => r.id === 'cr_bbbbbbbbbbbbbbbb');
    assert.deepEqual([a.n, a.from, a.to, a.calls, a.cached, a.by, a.stopped, a.names], [20, 1, 20, 20, 0, 'Amina Otieno', false, ['Notice to end']]);
    assert.deepEqual([b.n, b.calls, b.cached], [20, 0, 20], 'a free press is a press too, said with its cached count');
    assert.equal(L.reads[0].id, 'cr_bbbbbbbbbbbbbbbb', 'newest first');
    /* a name that is not a press name is not trusted: the server mints one */
    const r4 = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice to end', ids: ids(25).slice(20), run: { id: 'DROP TABLE', from: 'x', to: 25 } } });
    assert.match(r4.run.id, /^cr_[0-9a-f]{16}$/);
    const L2 = await W.admin.json('/api/columns/reads');
    const d = L2.reads.find(r => r.id === r4.run.id);
    assert.deepEqual([d.n, d.from, d.to], [5, null, 25]);
    /* Stop marks the record */
    const st = await W.admin.json('/api/columns/reads/' + r4.run.id + '/stop', { method: 'POST', body: {} });
    assert.equal(st.ok, true);
    assert.equal((await W.admin.json('/api/columns/reads')).reads.find(r => r.id === r4.run.id).stopped, true);
    assert.equal((await W.admin.json('/api/columns/reads/nope/stop', { method: 'POST', body: {} }).catch(e => e)).status, 404);
    /* a read of one contract with no name is an arrival, summed, never listed */
    await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice to end', ids: ['HC-1026'] } });
    const L3 = await W.admin.json('/api/columns/reads');
    assert.ok(!L3.reads.some(r => r.n === 1 && !r.from), 'no arrival row');
    const askId = r1.ask.id;
    assert.deepEqual([L3.arrivals[askId].n, L3.arrivals[askId].calls], [1, 1]);
    /* THE SERVER IS THE WALL: a person who may see stream A alone counts a read inside it — the first press read
       twenty contracts of stream B, so to them it read none; the fifth read's five are theirs */
    const Lv = await W.restricted.json('/api/columns/reads');
    assert.equal(Lv.reads.find(r => r.id === 'cr_aaaaaaaaaaaaaaaa').n, 0, 'twenty stream-B contracts read, none of them theirs');
    assert.equal(Lv.reads.find(r => r.id === r4.run.id).n, 5, 'the five of stream A are theirs');
  } finally { await h.stop?.(); }
});

test('4 · the Reads page is on every list a page must be on', () => {
  const APP = read('js/app.js'), CA = read('js/copilotacts.js'), NAV = read('js/navmap.js'), HBK = read('js/handbook.js'), BR = read('js/brainmap.js'), CORE = read('js/core.js');
  assert.match(APP, /import '\.\/views\/reads\.js';/);
  assert.match(APP, /else if\(view==='reads'\) renderReads\(\);/);
  assert.match(APP, /case 'reads':\s*return \[i18t\('nav_reads'\), ''\];/);
  assert.match(APP, /reads:\['rdPlace','rdPlacePut'\]/, 'a refresh lands at the same spot');
  assert.match(APP, /\{ k: 'keep', rows: \['contracts', 'reads', 'oblig', 'calendar', 'mynotes'\] \}/, 'the Guide row (flow rule 9c)');
  assert.match(CORE, /'mynotes','reads','handbook'/, 'setView knows it');
  assert.match(CA, /\{ k: 'reads', w: \['reads', 'every read'/, 'the "/" word');
  assert.match(CA, /reads: \(c, a\) => \(typeof readsOpen === 'function'\)/, 'the door opens on the question named');
  assert.match(NAV, /\['reads', \/ \(every read\|all reads/, 'navigable by typing');
  assert.match(HBK, /\{ k: '5\.8', part: 'keep', round: 2,\s*title: \{ en: 'Reads: every read, and the next batch'/, 'the Handbook chapter (rule 9d)');
  assert.match(HBK, /reads: \['reads'\], handbook:/, 'Jambo reads the book on the page');
  for (const part of ["['reads', 'renderReads', 'see', 0]", "['askcolnext', 'askColPlan', 'see', 1]", "['askcolruns', 'GET /api/columns/reads', 'wall', 2]", "['askcolstop', 'POST /api/columns/reads/:id/stop', 'wall', 2]"])
    assert.ok(BR.includes(part), 'the Brain names ' + part);
  assert.match(read('js/ai.js'), /reads: 'Reads'/);
  for (const k of ['nav_reads', 'ca_w_reads', 'gd_p_reads', 'gd_w_reads', 'brn_p_reads', 'rd_next_arrow', 'ac_th_next', 'ac_th_every_read', 'lh_ph_reads_other']) assert.ok(EN[k], k + ' is in the book');
  /* the page's own words: the thread and the next batch, every door an existing one */
  const RD = read('js/views/reads.js');
  for (const fn of ['askColNext', 'askColBring', 'askColTableFor', 'askColOpen', 'regShowOnly']) assert.ok(RD.includes(fn + '('), 'the page opens the existing door ' + fn);
  assert.doesNotMatch(RD, /api\('ai\/column'/, 'the page itself reads nothing');
});
