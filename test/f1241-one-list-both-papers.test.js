'use strict';
/* f1241 — ONE LIST, BOTH PAPERS (owner, 26 Nov 2026: "why is it that in the clean page, the notes appear on clause 1 but
   missing when in the redline page?" — "fix it"). Jambo's findings (the Clauses tab's own points) stand beside the
   redlined paper as they do beside the clean one, by the same clause; one our redline meets is "Resolved by your redline"
   on BOTH papers, through ONE check (pd2PointRedlineOf): our pending or agreed redline on the finding's clause, else on
   its topic (riskCoverOf). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = strip(R('js/views/../paperdesk.js')), RK = R('js/risks.js'), H = R('index.html');
const fn = name => { const i = PD.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return PD.slice(i, PD.indexOf('\n}', i) + 2); };

test('f1241 (1) the redlined paper carries Jambo\'s findings beside the risks and the standards', () => {
  assert.match(fn('pd2RedAnswers'), /return out\.concat\(pd2RedPointAnswers\(c, cv, \{ chs, unsent, plain \}\), pd2RedStdAnswers\(/);
  const f = fn('pd2RedPointAnswers');
  assert.match(f, /P = pd2ClausePoints\(c, cv\)/, 'the same reading the clean paper draws');
  assert.match(f, /const ch = answerOf\(p, el\);/);
  assert.match(f, /tone: 'done', red: true, point: true/);
  assert.match(f, /tone: 'owe', red: true, point: true, k, state: word \+ ' · ' \+ _pdT\('pd2_rn_none'\)/);
});
test('f1241 (2) the clean paper says the same: one check, green when met', () => {
  assert.match(fn('pd2Groups'), /const answerOf = pd2PointRedlineOf\(c\);[\s\S]*answerOf\(p, rows\[at\]\.el\) \? get\(at\)\.items\.push\(\{ tone: 'fact', kind: 'done', clause: true, word: _pdT\('pd2_rn_answered'\)/);
  assert.ok(H.includes('.pd2-mg-i.k-done .pd2-mn-dot{background:var(--st-green-dot)}'));
  assert.match(RK, /riskCoverOf, riskCoverCtx: _rkCoverCtx,/, 'the risks\' own matcher and its context are shared');
});
test('f1241 (3) the one check: our redline on the clause, else on the topic; theirs, withdrawn or rejected never', () => {
  const win = { riskCoverCtx: () => ({}), riskCoverOf: (it) => /cap/i.test(it.title) ? { id: 'topic' } : null };
  const make = new Function('window', fn('pd2PointRedlineOf') + '\nreturn pd2PointRedlineOf;');
  const of = make(win);
  const el = cid => ({ closest: () => ({ getAttribute: () => cid }) });
  const c = { changes: [
    { id: 'a', authorSide: 'owner', status: 'pending', clauseId: 'k1' },
    { id: 'b', authorSide: 'counterparty', status: 'pending', clauseId: 'k2' },
    { id: 'c', authorSide: 'owner', status: 'rejected', clauseId: 'k3' },
    { id: 'topic', authorSide: 'owner', status: 'accepted', clauseId: 'k9' }] };
  const ask = of(c);
  assert.equal((ask({ title: 'x' }, el('k1')) || {}).id, 'a', 'ours on its clause');
  assert.equal(ask({ title: 'x' }, el('k2')), null, 'theirs is not an answer');
  assert.equal(ask({ title: 'x' }, el('k3')), null, 'a rejected one is open again');
  assert.equal((ask({ title: 'Cap is low' }, el('k5')) || {}).id, 'topic', 'ours on its topic');
  assert.equal(of({ changes: [] })({ title: 'Cap' }, el('k1')), null, 'no redline, no answer');
});
