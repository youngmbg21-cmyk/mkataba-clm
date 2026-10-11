/* f641 — MY CALENDAR AND MY NOTES ARE PRIVATE (Young, 10 Oct 2026, the "HaTi
   Proposals" artifact, Parts 3 and 4)
   (1) a person's own event and note come back to them, and to nobody else
   (2) nobody else can change or delete them (404, as if they were not there)
   (3) a note may name only a contract the writer can see
   (4) the cleaner refuses what is not an event or a note
   (5) Copilot's plan: every proposed block is checked — inside the window,
       inside working hours, on a weekday, clear of the person's events and of
       each other — and what fails is counted, never quietly kept
   Run: node --test test/f641-my-items.test.js */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
after(async () => { await h.stop(); });

describe('f641 my items', () => {
  let ev, nt;
  test('(1) mine come back to me and to nobody else', async () => {
    ev = (await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'event', item: { title: 'Prep MK-A1 renewal', date: '2026-10-20', start: '10:00', end: '11:00', contractId: 'MK-A1' } } })).item;
    nt = (await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'Ask for their terms.\nBefore signing.', contractId: 'MK-A1', reviewBy: '2026-10-21' } } })).item;
    assert.ok(ev && ev.id && nt && nt.id);
    assert.equal(nt.title, 'Ask for their terms.', 'a note with no title takes its first line');
    const mine = await W.admin.json('/api/me/items');
    assert.deepEqual(mine.items.map(x => x.id).sort(), [ev.id, nt.id].sort());
    const theirs = await W.unrestricted.json('/api/me/items');
    assert.deepEqual(theirs.items, [], 'a colleague sees none of them');
  });
  test('(2) nobody else can change or delete them', async () => {
    const put = await W.unrestricted.raw('/api/me/items/' + ev.id, { method: 'PUT', body: { item: { title: 'hijacked' } } });
    assert.equal(put.status, 404);
    const del = await W.unrestricted.raw('/api/me/items/' + nt.id, { method: 'DELETE' });
    assert.equal(del.status, 404);
    const still = await W.admin.json('/api/me/items');
    assert.equal(still.items.find(x => x.id === ev.id).title, 'Prep MK-A1 renewal');
    const mark = await W.admin.json('/api/me/items/' + nt.id, { method: 'PUT', body: { item: { reviewedAt: '2026-10-11T09:00:00.000Z' } } });
    assert.equal(mark.item.reviewedAt, '2026-10-11T09:00:00.000Z');
    assert.equal(mark.item.body, 'Ask for their terms.\nBefore signing.', 'a change keeps what it does not name');
  });
  test('(3) a note names only a contract the writer can see', async () => {
    const r = await W.restricted.raw('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'about B', contractId: 'MK-B1' } } });
    assert.equal(r.status, 400);
    const ok = await W.restricted.raw('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'about A', contractId: 'MK-A1' } } });
    assert.equal(ok.status, 200);
  });
  test('(4) the cleaner refuses what is not an event or a note', async () => {
    for (const body of [{ kind: 'event', item: { title: 'x', date: '2026-10-20', start: '11:00', end: '10:00' } },
      { kind: 'event', item: { title: '', date: '2026-10-20' } }, { kind: 'note', item: { body: '   ' } }, { kind: 'secret', item: {} }]){
      const r = await W.admin.raw('/api/me/items', { method: 'POST', body });
      assert.equal(r.status, 400, JSON.stringify(body));
    }
    const del = await W.admin.raw('/api/me/items/' + ev.id, { method: 'DELETE' });
    assert.equal(del.status, 200);
  });
});

describe('f641 (5) Copilot\'s plan is checked, block by block', () => {
  const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
  const one = name => { const m = SRV.match(new RegExp('const ' + name + ' = [^\\n]*\\n')); assert.ok(m, 'no ' + name); return m[0]; };
  const fnOf = name => { const at = SRV.indexOf('function ' + name + '('); assert.ok(at > -1); const open = SRV.indexOf('{', SRV.indexOf(')', at)); let d = 0;
    for (let i = open; i < SRV.length; i++){ if (SRV[i] === '{') d++; else if (SRV[i] === '}' && !--d) return SRV.slice(at, i + 1); } };
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext([one('myDay'), one('myHm'), one('myText'), 'function myContractOk(){ return ""; }', fnOf('planBlocksCheck'), 'this.check = planBlocksCheck;'].join('\n'), ctx);
  test('only blocks that fit are kept, and the rest are counted', () => {
    const o = { from: '2026-10-19', to: '2026-10-25', hs: 8, he: 17, events: [{ date: '2026-10-20', start: '13:00', end: '14:30', title: 'Board pack' }, { date: '2026-10-23', start: '', end: '', title: 'Travel' }] };
    const out = ctx.check([
      { date: '2026-10-19', start: '10:00', end: '11:30', title: 'Decide notice' },          // fits
      { date: '2026-10-20', start: '14:00', end: '15:00', title: 'Overlaps the board pack' }, // overlap
      { date: '2026-10-21', start: '07:00', end: '08:00', title: 'Too early' },              // outside hours
      { date: '2026-10-24', start: '10:00', end: '11:00', title: 'Saturday' },               // weekend
      { date: '2026-10-23', start: '10:00', end: '11:00', title: 'Travel day' },             // all-day busy
      { date: '2026-10-30', start: '10:00', end: '11:00', title: 'Outside the window' },     // out of window
      { date: '2026-10-19', start: '11:00', end: '12:00', title: 'Clashes with the first' },  // overlaps a kept block
      { date: '2026-10-22', start: '15:00', end: '14:00', title: 'Ends first' },             // end before start
      { date: '2026-10-22', start: '10:00', end: '11:00', title: 'Review MK-235' },          // fits
    ], o);
    assert.equal(out.blocks.map(b => b.title).join(' | '), 'Decide notice | Review MK-235');
    assert.equal(out.dropped, 7);
    const many = Array.from({ length: 11 }, (_, i) => ({ date: '2026-10-' + String(19 + (i % 5)).padStart(2, '0'), start: String(8 + Math.floor(i / 5) * 2).padStart(2, '0') + ':00', end: String(9 + Math.floor(i / 5) * 2).padStart(2, '0') + ':00', title: 'Block ' + i }));
    const capped = ctx.check(many, { ...o, events: [] });
    assert.equal(capped.blocks.length, 8, 'at most eight kept');
    assert.equal(capped.blocks.length + capped.dropped, 11, 'and every other one is counted, never lost');
  });
});
