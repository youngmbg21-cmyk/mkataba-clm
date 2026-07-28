/* F60 — the Doc Lab's internal wall.

   The lab exists to decide one question before the product is moved onto it:
   can a message marked internal reach the counterparty? These assertions run on
   the real js/views/doclab.js, not a paraphrase, and they pin the property the
   whole experiment turns on — the share filter is EXPLICIT ALLOW.

   The bug this is written against is a real one, in the sample engine that
   prompted the experiment:

       changes.filter(c => c.visibility !== "internal_draft")

   Nothing in that schema ever sets `visibility`, so the comparison is
   `undefined !== "internal_draft"`, which is true, and every internal draft is
   sent. It fails open, silently, with no error and nothing to notice. The test
   below asserts the opposite behaviour on a thread whose visibility was never
   set: it stays home. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* The lab loaded the way the browser loads it — plain script, globals attached
   to `window` at the end — with the smallest shell its pure half touches. */
function loadLab(){
  const store = new Map();
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); }
  };
  const win = { FIRST_PARTY: 'Wanjiru Catering Ltd' };
  const ctx = vm.createContext({
    window: win, localStorage, JSON, Math, console,
    nowISO: () => '2026-07-28T14:30:00.000Z'
  });
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');
  vm.runInContext(src, ctx, { filename: 'doclab.js' });
  win._store = store;                 // so a test can corrupt it on purpose
  return win;
}

/* The lab is loaded into its own vm realm, so an object it built has that
   realm's prototype and assert's deep compare — which checks prototypes —
   reports a mismatch on two structurally identical values. Round-tripping
   through the TEST realm's JSON gives an ordinary object to compare. */
const plain = v => JSON.parse(JSON.stringify(v));

const msg = (body, author) => ({ id: 'm1', author: author || 'Amina Wanjiru',
  org: 'Bidii Foods Ltd', body, at: '2026-07-28T14:30:00.000Z' });

describe('F60a — the share filter is explicit allow', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  test('a shared thread travels', () => {
    const out = lab.labSharePayload({ threads: [
      { id: 't1', visibility: 'shared', status: 'open', topicLabel: 'Clause 12', messages: [msg('Sixty days works for us.')] }
    ]});
    assert.equal(out.threads.length, 1);
    assert.equal(out.threads[0].messages[0].body, 'Sixty days works for us.');
  });

  test('an internal thread does not', () => {
    const out = lab.labSharePayload({ threads: [
      { id: 't1', visibility: 'internal', status: 'open', topicLabel: 'Clause 12', messages: [msg('Hold the cure period.')] }
    ]});
    assert.equal(out.threads.length, 0);
    assert.ok(!JSON.stringify(out).includes('cure period'),
      'the wording of an internal note must not appear anywhere in the payload');
  });

  test('a thread whose visibility was NEVER SET stays home', () => {
    // the exact shape the sample engine's filter would have sent
    const out = lab.labSharePayload({ threads: [
      { id: 't1', status: 'open', topicLabel: 'Clause 12', messages: [msg('We can go to 45 if pushed.')] }
    ]});
    assert.equal(out.threads.length, 0,
      'a forgotten visibility field must fail closed, not open');
    assert.ok(!JSON.stringify(out).includes('45'));
  });

  test('a misspelt or unknown visibility stays home too', () => {
    for (const v of ['Shared', 'SHARED', 'public', 'external', 'internal_draft', '', null, 0, true]){
      const out = lab.labSharePayload({ threads: [
        { id: 't1', visibility: v, status: 'open', messages: [msg('secret')] }
      ]});
      assert.equal(out.threads.length, 0, `visibility ${JSON.stringify(v)} must not be treated as shared`);
    }
  });

  test('a mixed set sends only the shared half', () => {
    const out = lab.labSharePayload({ threads: [
      { id: 'a', visibility: 'shared',   status: 'open', messages: [msg('theirs')] },
      { id: 'b', visibility: 'internal', status: 'open', messages: [msg('ours')] },
      { id: 'c', visibility: 'shared',   status: 'resolved', messages: [msg('settled')] },
      { id: 'd',                          status: 'open', messages: [msg('unmarked')] }
    ]});
    assert.deepEqual(out.threads.map(t => t.id), ['a', 'c']);
  });

  test('an empty or absent thread list is not an error', () => {
    assert.equal(lab.labSharePayload({ threads: [] }).threads.length, 0);
    assert.equal(lab.labSharePayload({}).threads.length, 0);
    assert.equal(lab.labSharePayload(null).threads.length, 0);
  });
});

describe('F60b — what a shared thread carries, and what it leaves behind', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  test('the internal name of whoever closed a thread does not travel; the organisation does', () => {
    /* The MESSAGE author does travel — the counterparty wrote it, or was
       written to by name. What stays behind is the colleague who ruled, which
       is why the resolver here is deliberately not the author. */
    const out = lab.labSharePayload({ threads: [
      { id: 't1', visibility: 'shared', status: 'resolved',
        resolvedAt: '2026-07-28T15:00:00.000Z',
        resolvedBy: { name: 'Sarah Chen', org: 'Wanjiru Catering Ltd' },
        messages: [msg('Agreed.', 'Amina Wanjiru')] }
    ]});
    const t = out.threads[0];
    assert.equal(t.resolvedByOrg, 'Wanjiru Catering Ltd');
    assert.equal(t.resolvedBy, undefined, 'the named colleague must not be in the payload');
    assert.ok(!JSON.stringify(out).includes('Sarah Chen'),
      'the ruling colleague’s name must appear nowhere in the payload');
    assert.ok(JSON.stringify(out).includes('Amina Wanjiru'),
      'the message author still travels — they wrote it');
  });

  test('status and the pinned change travel, because the reader is entitled to both', () => {
    const out = lab.labSharePayload({ threads: [
      { id: 't1', visibility: 'shared', status: 'resolved', changeId: 7, messages: [msg('ok')] }
    ]});
    assert.equal(out.threads[0].status, 'resolved');
    assert.equal(out.threads[0].changeId, 7);
  });

  test('the payload is a copy — mutating it cannot reach back into the lab', () => {
    const source = { threads: [
      { id: 't1', visibility: 'shared', status: 'open', messages: [msg('original')] }
    ]};
    const out = lab.labSharePayload(source);
    out.threads[0].status = 'resolved';
    out.threads[0].messages[0].body = 'tampered';
    assert.equal(source.threads[0].status, 'open');
    assert.equal(source.threads[0].messages[0].body, 'original');
  });
});

describe('F60c — what stayed behind is counted for the owner only', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  test('withheld counts threads and messages that did not travel', () => {
    const held = lab.labWithheld({ threads: [
      { id: 'a', visibility: 'shared',   messages: [msg('1')] },
      { id: 'b', visibility: 'internal', messages: [msg('1'), msg('2')] },
      { id: 'c',                          messages: [msg('1')] }   // unmarked counts as withheld
    ]});
    assert.deepEqual(plain(held), { threads: 2, messages: 3 });
  });

  test('nothing withheld reads as zero rather than throwing', () => {
    assert.deepEqual(plain(lab.labWithheld({ threads: [] })), { threads: 0, messages: 0 });
    assert.deepEqual(plain(lab.labWithheld(null)), { threads: 0, messages: 0 });
  });
});

describe('F60d — a thread closes when the change it is about is decided', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  const set = () => ({ threads: [
    { id: 'a', visibility: 'shared',   status: 'open',     changeId: 7,    messages: [msg('1')] },
    { id: 'b', visibility: 'internal', status: 'open',     changeId: 7,    messages: [msg('2')] },
    { id: 'c', visibility: 'shared',   status: 'open',     changeId: 9,    messages: [msg('3')] },
    { id: 'd', visibility: 'shared',   status: 'resolved', changeId: 7,    messages: [msg('4')] },
    { id: 'e', visibility: 'shared',   status: 'open',     changeId: null, messages: [msg('5')] }
  ]});

  test('only the open threads pinned to that change close', () => {
    const l = set();
    const n = lab.labResolveLinked(l, 7, { name: 'Sarah Chen' });
    assert.equal(n, 2);
    const by = id => l.threads.find(t => t.id === id);
    assert.equal(by('a').status, 'resolved');
    assert.equal(by('b').status, 'resolved', 'an internal thread closes too — the question is answered either way');
    assert.equal(by('c').status, 'open',     'a thread about a different change is untouched');
    assert.equal(by('e').status, 'open',     'a thread pinned to nothing is untouched');
  });

  test('an already-resolved thread is not re-closed or re-stamped', () => {
    const l = set();
    l.threads.find(t => t.id === 'd').resolvedBy = { name: 'David Otieno', org: 'Wanjiru Catering Ltd' };
    lab.labResolveLinked(l, 7, { name: 'Sarah Chen' });
    assert.equal(l.threads.find(t => t.id === 'd').resolvedBy.name, 'David Otieno');
  });

  test('closing records who did it and when', () => {
    const l = set();
    lab.labResolveLinked(l, 7, { name: 'Sarah Chen' });
    const t = l.threads.find(x => x.id === 'a');
    assert.equal(t.resolvedBy.name, 'Sarah Chen');
    assert.equal(t.resolvedBy.org, 'Wanjiru Catering Ltd');
    assert.equal(t.resolvedAt, '2026-07-28T14:30:00.000Z');
  });

  test('deciding a change with nothing pinned to it closes nothing', () => {
    const l = set();
    assert.equal(lab.labResolveLinked(l, 999, { name: 'Sarah Chen' }), 0);
  });

  test('a thread closed by us still does not travel if it is internal', () => {
    const l = set();
    lab.labResolveLinked(l, 7, { name: 'Sarah Chen' });
    const out = lab.labSharePayload(l);
    assert.ok(!out.threads.some(t => t.id === 'b'), 'closing an internal thread must not share it');
  });
});

describe('F60e — the store is the lab’s own, and keeps what it was given', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  test('visibility survives a save and a read back', () => {
    lab.labPut('C-001', { threads: [
      { id: 't1', visibility: 'internal', status: 'open', messages: [msg('ours')] }
    ], decisions: {} });
    const back = lab.labFor('C-001');
    assert.equal(back.threads[0].visibility, 'internal');
    assert.equal(lab.labSharePayload(back).threads.length, 0);
  });

  test('one contract’s lab cannot be read through another’s id', () => {
    lab.labPut('C-001', { threads: [{ id: 't1', visibility: 'internal', messages: [msg('ours')] }], decisions: {} });
    assert.equal(lab.labFor('C-002').threads.length, 0);
  });

  test('clearing removes that contract’s lab and leaves the others', () => {
    lab.labPut('C-001', { threads: [{ id: 't1', visibility: 'shared', messages: [msg('a')] }], decisions: {} });
    lab.labPut('C-002', { threads: [{ id: 't2', visibility: 'shared', messages: [msg('b')] }], decisions: {} });
    lab.labClear('C-001');
    assert.equal(lab.labFor('C-001').threads.length, 0);
    assert.equal(lab.labFor('C-002').threads.length, 1);
  });

  test('a corrupt store reads as empty rather than throwing the page down', () => {
    lab._store.set('hati.lab.v1', '{not json at all');
    assert.deepEqual(plain(lab.labFor('C-001')), { threads: [], decisions: {} });
    // and it recovers: the next write replaces the damage
    lab.labPut('C-001', { threads: [{ id: 't1', visibility: 'shared', messages: [msg('a')] }], decisions: {} });
    assert.equal(lab.labFor('C-001').threads.length, 1);
  });

  test('the lab writes under its own key and nowhere near contract storage', () => {
    assert.equal(lab.LAB_KEY, 'hati.lab.v1');
    assert.ok(!lab.LAB_KEY.startsWith('hati.v1.'),
      'the lab must not share a namespace with the real data keys in js/core.js');
  });
});
