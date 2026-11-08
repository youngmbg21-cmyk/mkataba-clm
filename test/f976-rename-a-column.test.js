'use strict';
/* f976 — RENAME A COLUMN (owner, 8 Nov 2026: "Add rename"). A column's name is the team's: the person who asked the
   question, the person who kept it, or an admin may rename it (the same wall as taking it off the list, colMayUnkeep);
   anyone else is refused; an empty or over-long name is refused; the question and its answers are untouched.
   At the parent the route does not exist (404 for every call). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract } = require('./helpers');

test('f976 rename a column: the asker, the keeper or an admin; nobody else; the answers stay', async () => {
  const h = await startHati();
  try {
    const cs = ['RN-1', 'RN-2'].map(id => fixtureContract(id, 'Supply Agreement', 'Kabras Sugar', 'proc', 1000000, 'Signed', '9. Law\nThis agreement is governed by the laws of Kenya.'));
    const W = await seedWorkspace(h, { contracts: cs });
    const r = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: 'Which law governs it?', name: 'Law', ids: ['RN-1', 'RN-2'] } });
    const id = r.askId || (r.ask && r.ask.id) || ((await W.admin.json('/api/columns')).asks.find(a => a.name === 'Law') || {}).id;
    assert.ok(id, 'the question is asked');
    const before = (await W.admin.json('/api/columns/answers', { method: 'POST', body: { askId: id, ids: ['RN-1', 'RN-2'] } }).catch(() => null));
    /* someone who neither asked nor kept it */
    const no = await W.unrestricted.json('/api/columns/' + id + '/name', { method: 'POST', body: { name: 'Mine now' } }).catch(e => e);
    assert.equal(no.status, 403, 'refused to someone else');
    for (const bad of ['', '   ', 'x'.repeat(41)]){
      const e = await W.admin.json('/api/columns/' + id + '/name', { method: 'POST', body: { name: bad } }).catch(x => x);
      assert.equal(e.status, 400, JSON.stringify(bad).slice(0, 20));
    }
    const ok = await W.admin.json('/api/columns/' + id + '/name', { method: 'POST', body: { name: '  Governing   law ' } });
    assert.equal(ok.ask.name, 'Governing law', 'trimmed, one space');
    assert.equal(ok.ask.question, 'Which law governs it?', 'the question stays');
    assert.ok((await W.admin.json('/api/columns')).asks.some(a => a.id === id && a.name === 'Governing law'), 'the team sees the new name');
    const after = (await W.admin.json('/api/columns/answers', { method: 'POST', body: { askId: id, ids: ['RN-1', 'RN-2'] } }).catch(() => null));
    assert.deepEqual(JSON.stringify(after && after.answers), JSON.stringify(before && before.answers), 'the answers stay as they were');
    assert.ok(before && before.answers && Object.keys(before.answers).length, 'there were answers to keep');
    const gone = await W.admin.json('/api/columns/nope/name', { method: 'POST', body: { name: 'X' } }).catch(e => e);
    assert.equal(gone.status, 404);
  } finally { await h.stop(); }
});
