/* f302 — THE NOTE WINDOW ASKS WHICH ROOM, AND COMES UP ON EVERY FILING
   ============================================================================
   C-3 (Young, 11 Sep 2026): "you should be able to choose whether the note is
   internal or external."  C-5 (same day): "If i go back later to Clause A and
   make another redline, this time when i close i do not get a pop up to add a
   note. This should not be the case."

   The window is the one composer on our seat that offered no choice; it wears
   the drawer's two tabs now, External lit at rest (the 1 Sep default kept),
   and posts the room's own answer through negoPostComment — 'shared' on
   External, nothing on Internal, the writer's safe default. And it is raised
   on every filing on our seat; a revision opens on the note already given. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const ME = { id: 'u_me', name: 'Amina Yusuf', role: 'legal', email: 'amina@mk.co.ke' };

function contract(){
  return { id: 'MK-302', name: 'Supply', counterparty: 'Saw Sawa Ltd', status: 'Under Review',
    redlineText: '<h2>6. Payment</h2><p>Pay each invoice within thirty (30) days.</p>'
      + '<h2>7. Term</h2><p>Two years from the effective date.</p>', format: 'rich',
    changes: [], audit: [], signatures: [] };
}
async function bench(){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true, canEdit: true });
  w.win.getUsers = () => [ME];
  w.win.userById = id => (id === ME.id ? ME : null);
  w.win.saveSettings = () => {};
  w.win.persist = () => {};
  w.win.negoPostToChannel = async () => ({ ok: false, skipped: true });
  w.win.negoNotifyMentions = async () => null;
  const c = contract();
  w.win.negoInit(c);
  const cl = w.win.negoClauseList(c).find(x => x.num === '6');
  const ch = await w.win.negoEditClause(c, cl.clauseId,
    '<p>Pay each invoice within forty-five (45) days.</p>', { side: 'owner' });
  w.win.state = Object.assign({}, w.win.state, { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  w.win.getContract = id => (String(id) === String(c.id) ? c : null);
  return { w, c, ch, cl };
}
const tick = () => new Promise(r => setTimeout(r, 30));
const ov = w => w.win.document.getElementById('rl-note-overlay');

describe('f302 (1) — the control', () => {
  test('two tabs, External lit at rest, Internal a press away; the globe line is gone', async () => {
    const p = await bench();
    p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    const o = ov(p.w);
    assert.ok(o, 'the window is up');
    const tabs = [...o.querySelectorAll('[data-rl-note-room]')];
    assert.deepEqual(tabs.map(t => t.getAttribute('data-rl-note-room')), ['internal', 'external']);
    assert.equal(o.querySelector('[data-rl-note-room="external"]').getAttribute('aria-selected'), 'true');
    assert.equal(o.querySelector('.rl-note-who'), null, 'the line that read the choice back is the control now');
    assert.ok(tabs.every(t => !t.disabled), 'live on a fresh note');
    o.querySelector('#rl-note-skip').click(); await tick();
  });

  test('the lead and the placeholder follow the room', async () => {
    const p = await bench();
    p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    let o = ov(p.w);
    assert.match(o.querySelector('.rl-note-lead').textContent, /Saw Sawa Ltd/);
    const extPh = o.querySelector('#rl-note-in').placeholder;
    o.querySelector('#rl-note-in').value = 'half typed';
    o.querySelector('[data-rl-note-room="internal"]').click(); await tick();
    o = ov(p.w);
    assert.match(o.querySelector('.rl-note-lead').textContent, /colleagues/i);
    assert.notEqual(o.querySelector('#rl-note-in').placeholder, extPh);
    assert.equal(o.querySelector('#rl-note-in').value, 'half typed', 'a press keeps what was typed');
    assert.equal(o.querySelector('[data-rl-note-room="internal"]').getAttribute('aria-selected'), 'true');
    o.querySelector('#rl-note-skip').click(); await tick();
  });
});

describe('f302 (2) — one writer, the room\'s own answer', () => {
  test('Add note on Internal posts an internal note, and the channel is not asked', async () => {
    const p = await bench();
    let channel = 0;
    p.w.win.negoPostToChannel = async () => { channel++; return { ok: true }; };
    const done = p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    const o = ov(p.w);
    o.querySelector('[data-rl-note-room="internal"]').click(); await tick();
    const o2 = ov(p.w);
    o2.querySelector('#rl-note-in').value = 'For us only: we can go to sixty.';
    o2.querySelector('#rl-note-ok').click();
    assert.equal(await done, 'added');
    const m = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(m.visibility, 'internal');
    assert.equal(m.sentAt, undefined, 'never delivered');
    assert.equal(channel, 0, 'an internal note reaches nobody by not being posted');
  });

  test('Add note on External posts a shared note through the channel, exactly as before', async () => {
    const p = await bench();
    let channel = 0;
    p.w.win.negoPostToChannel = async () => { channel++; return { ok: true }; };
    const done = p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    const o = ov(p.w);
    o.querySelector('#rl-note-in').value = 'Forty-five is our standard.';
    o.querySelector('#rl-note-ok').click();
    assert.equal(await done, 'added');
    const m = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(m.visibility, 'shared');
    assert.ok(m.sentAt, 'delivered');
    assert.equal(channel, 1);
  });

  test('opened on a note already on file, the control is SET to its room and disabled', async () => {
    const p = await bench();
    p.w.win.negoPostComment(p.c, p.ch.id, 'Kept at home.', { side: 'owner' });
    p.w.win.openChangeNoteDialog(p.c, p.ch, { side: 'owner' });
    await tick();
    const o = ov(p.w);
    const tabs = [...o.querySelectorAll('[data-rl-note-room]')];
    assert.ok(tabs.every(t => t.disabled), 'a note cannot be moved between rooms');
    assert.equal(o.querySelector('[data-rl-note-room="internal"]').getAttribute('aria-selected'), 'true');
    assert.match(o.querySelector('#rl-note-ok').textContent, /save|spara/i);
    o.querySelector('#rl-note-skip').click(); await tick();
  });
});

describe('f302 (3) — on every filing', () => {
  test('a revision is asked, and the window says it is one, opening on the note already given', async () => {
    const p = await bench();
    p.w.win.negoPostComment(p.c, p.ch.id, 'First reason.', { side: 'owner', visibility: 'shared' });
    await p.w.win.negoEditClause(p.c, p.cl.clauseId,
      '<p>Pay each invoice within sixty (60) days.</p>', { side: 'owner' });
    assert.ok((p.ch.revisions || []).length, 'the fold happened');
    const pr = p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    await tick();
    const o = ov(p.w);
    assert.ok(o, 'the window came up on the revision (null at the parent)');
    assert.match(o.querySelector('.rl-note-lead').textContent, /again/i, 'the lead says it is a revision');
    assert.equal(o.querySelector('#rl-note-in').value, 'First reason.', 'the note already given is in the box');
    assert.match(o.querySelector('#rl-note-ok').textContent, /save|spara/i);
    assert.equal(o.querySelector('[data-rl-note-room="external"]').disabled, true, 'set to its room');
    o.querySelector('#rl-note-skip').click();
    assert.equal(await pr, null);
  });

  test('a note already DELIVERED is a record: the box opens empty and the delivered note is printed above', async () => {
    const p = await bench();
    const m = p.w.win.negoPostComment(p.c, p.ch.id, 'Went across.', { side: 'owner', visibility: 'shared' });
    m.sentAt = '2026-09-11T10:00:00Z';
    await p.w.win.negoEditClause(p.c, p.cl.clauseId,
      '<p>Pay each invoice within sixty (60) days.</p>', { side: 'owner' });
    p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    await tick();
    const o = ov(p.w);
    assert.ok(o);
    assert.equal(o.querySelector('#rl-note-in').value, '');
    assert.match(o.querySelector('.rl-note-past').textContent, /Went across/);
    assert.match(o.querySelector('#rl-note-ok').textContent, /add|lägg/i);
    assert.ok([...o.querySelectorAll('[data-rl-note-room]')].every(t => !t.disabled), 'live for a further note');
    o.querySelector('#rl-note-skip').click(); await tick();
  });

  test('the other seat and a viewer are still not asked', async () => {
    const p = await bench();
    await p.w.win.negoEditClause(p.c, p.cl.clauseId,
      '<p>Pay each invoice within sixty (60) days.</p>', { side: 'owner' });
    assert.equal(await p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'counterparty' }), null);
    assert.equal(ov(p.w), null);
  });
});

describe('f302 (4) — the record', () => {
  test('the keys are in both books, and the reversal is written beside the reading', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['ng_note_filed_lead_int', 'ng_note_keep_lead_int', 'ng_note_revised_lead',
      'ng_note_revised_lead_int', 'ng_note_ph_int', 'ng_note_who_int', 'ng_note_room_label', 'ng_note_added_int'])
      assert.equal((i18n.match(new RegExp(`^\\s*${k}:`, 'mg')) || []).length, 2, `${k} in both books`);
    const view = read('js/views/negotiation.js');
    const fn = view.slice(view.indexOf('function rlNoteAskAfterFile('));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    assert.equal(/revisions[^\n]*return Promise\.resolve\(null\)/.test(body), false,
      'the once-only gate is gone');
    assert.match(view.slice(view.indexOf('function rlNoteAskAfterFile(') - 3000, view.indexOf('function rlNoteAskAfterFile(')), /31 Aug/,
      'the earlier ruling is still recorded beside the reading');
    assert.match(body, /11 Sep 2026/, 'and so is the reversal');
  });
});
