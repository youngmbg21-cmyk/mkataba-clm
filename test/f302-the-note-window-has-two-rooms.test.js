/* f302 — THE NOTE AFTER A FILING ASKS WHICH ROOM, AND IS ASKED ON EVERY FILING
   ============================================================================
   C-3 (Young, 11 Sep 2026): "you should be able to choose whether the note is
   internal or external."  C-5 (same day): "If i go back later to Clause A and
   make another redline, this time when i close i do not get a pop up to add a
   note. This should not be the case."  D-6 (same day): "the pop up should
   always start with internal. Also, you should be able to enter different
   notes between internal and external on the same pop up."

   RE-POINTED THE SAME EVENING (Young: "whenever you want to comment, the
   comments / chat slide panel slides in and you comment there instead ...
   when you click on a pencil indicating you have finished your redlining").
   THE WINDOW IS GONE; every one of its rulings survives in the DRAWER: the
   pin above the box names the change just filed, the pin's switch is the room
   with Internal lit at rest, a draft stays with the room it was typed in, and
   Skip over a draft asks first. f303 pins the wider system; this file keeps
   the three rulings above as claims against the drawer. */
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
  w.win.negoPostToChannel = async () => ({ ok: true });
  w.win.negoNotifyMentions = async () => null;
  w.win.confirmDialog = async () => true;
  const c = contract();
  w.win.negoInit(c);
  const cl = w.win.negoClauseList(c).find(x => x.num === '6');
  const ch = await w.win.negoEditClause(c, cl.clauseId,
    '<p>Pay each invoice within forty-five (45) days.</p>', { side: 'owner' });
  w.win.state = Object.assign({}, w.win.state, { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  w.win.getContract = id => (String(id) === String(c.id) ? c : null);
  const host = w.win.document.createElement('div');
  w.win.document.body.appendChild(host);
  w.win.openNotesPanel = (cid, chId) => {
    const x = chId ? w.win.negoChangeById(c, chId) : null;
    if (x) w.win.rlNotesPanelPaint(host, c, x, { side: 'owner', author: ME.name });
    else w.win.rlChatPanelPaint(host, c, { side: 'owner', author: ME.name });
  };
  return { w, c, ch, cl, host };
}
const tick = () => new Promise(r => setTimeout(r, 30));
const send = async p => {
  const b = p.host.querySelector('[data-rl-np-send]');
  return p.w.win.rlNotesSend(p.host, p.c, p.ch, { side: 'owner', author: ME.name }, b.getAttribute('data-room'));
};

describe('f302 (1) — the control', () => {
  test('the pin offers both rooms, Internal lit at rest, External a press away', async () => {
    const p = await bench();
    p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    const pin = p.host.querySelector('.rl-np-pin');
    assert.ok(pin, 'the pin is up');
    const tabs = [...pin.querySelectorAll('[data-rl-np-pin-room]')];
    assert.deepEqual(tabs.map(t => t.getAttribute('data-rl-np-pin-room')), ['internal', 'external']);
    assert.equal(pin.querySelector('[data-rl-np-pin-room="internal"]').getAttribute('aria-pressed'), 'true');
    assert.match(pin.querySelector('.ref').textContent, new RegExp(p.ch.id), 'and names the change');
  });

  test('the placeholder and the box follow the room', async () => {
    const p = await bench();
    p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    const ph1 = p.host.querySelector('.rl-np-in').getAttribute('placeholder');
    p.host.querySelector('[data-rl-np-pin-room="external"]').click(); await tick();
    const ph2 = p.host.querySelector('.rl-np-in').getAttribute('placeholder');
    assert.notEqual(ph1, ph2);
    assert.match(ph2, /Saw Sawa Ltd/, 'the other side is named where you type');
    assert.ok(p.host.querySelector('.rl-np-foot.out'), 'and the box wears the crossing');
  });
});

describe('f302 (2) — one writer, the room\'s own answer', () => {
  test('Add note on Internal posts an internal note, and the channel is not asked', async () => {
    const p = await bench();
    let channel = 0;
    p.w.win.negoPostToChannel = async () => { channel++; return { ok: true }; };
    const done = p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    p.host.querySelector('.rl-np-in').value = 'For us only: we can go to sixty.';
    await send(p);
    assert.equal(await done, 'added');
    const m = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(m.visibility, 'internal');
    assert.equal(m.sentAt, undefined, 'never delivered');
    assert.equal(channel, 0, 'an internal note reaches nobody by not being posted');
  });

  test('Add note on External posts a shared note through the channel, and it is stamped delivered', async () => {
    const p = await bench();
    let channel = 0;
    p.w.win.negoPostToChannel = async () => { channel++; return { ok: true }; };
    const done = p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    p.host.querySelector('[data-rl-np-pin-room="external"]').click(); await tick();
    p.host.querySelector('.rl-np-in').value = 'Forty-five is our standard.';
    await send(p);
    assert.equal(await done, 'added');
    const m = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(m.visibility, 'shared');
    assert.ok(m.sentAt, 'delivered');
    assert.equal(channel, 1);
  });
});

describe('f302 (3) — on every filing', () => {
  test('a revision is asked, and the pin says it is one', async () => {
    const p = await bench();
    await p.w.win.negoEditClause(p.c, p.cl.clauseId,
      '<p>Pay each invoice within sixty (60) days.</p>', { side: 'owner' });
    assert.ok((p.ch.revisions || []).length, 'the fold happened');
    p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    await tick();
    /* RE-POINTED 11 Sep 2026 (round three): the pin carries no lead line —
       it quotes the change's wording, revision or first filing alike. */
    const pin = p.host.querySelector('.rl-np-pin');
    assert.ok(pin, 'the drawer is pinned to the revised change');
    assert.equal(pin.querySelector('.lead'), null);
    assert.match(pin.querySelector('q').textContent, /sixty/i, 'the revised wording is what is quoted');
  });

  test('the other seat and a viewer are still not asked', async () => {
    const p = await bench();
    assert.equal(await p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'counterparty' }), null);
    p.w.win.canEdit = () => false;
    assert.equal(await p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' }), null);
  });
});

describe('f302 (4) — the record', () => {
  test('the keys are in both books, and the retirement is written beside the reading', () => {
    const I = read('js/i18n.js');
    for (const k of ['ng_np_pin_filed', 'ng_np_pin_revised', 'ng_np_for_team', 'ng_np_for_them', 'ng_np_unpin'])
      assert.equal((I.match(new RegExp('^    ' + k + ':', 'mg')) || []).length, 2, k + ' in both books');
    const V = read('js/views/negotiation.js');
    assert.match(V, /THE RECEIPT WINDOW IS RETIRED \(Young asked 11 Sep 2026\)/);
    assert.match(V, /function rlNoteDialogHtml\(\)\{ return ''; \}/);
  });
});

describe('f302 (5) — two drafts, one drawer (D-6)', () => {
  test('the words typed in each room stay in that room', async () => {
    const p = await bench();
    p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    const type = (t) => { const b = p.host.querySelector('.rl-np-in'); b.value = t;
      b.dispatchEvent(new p.w.win.Event('input', { bubbles: true })); };
    type('For the colleagues.');
    p.host.querySelector('[data-rl-np-pin-room="external"]').click(); await tick();
    assert.equal(p.host.querySelector('.rl-np-in').value, '');
    type('For Saw Sawa.');
    p.host.querySelector('[data-rl-np-pin-room="internal"]').click(); await tick();
    assert.equal(p.host.querySelector('.rl-np-in').value, 'For the colleagues.');
    p.host.querySelector('[data-rl-np-pin-room="external"]').click(); await tick();
    assert.equal(p.host.querySelector('.rl-np-in').value, 'For Saw Sawa.');
  });

  test('Skip with words in either room asks first; a "no" keeps the pin, a "yes" discards both', async () => {
    const p = await bench();
    let answer = false, asked = 0;
    p.w.win.confirmDialog = async () => { asked++; return answer; };
    const done = p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    const b = p.host.querySelector('.rl-np-in'); b.value = 'Held words.';
    b.dispatchEvent(new p.w.win.Event('input', { bubbles: true }));
    p.host.querySelector('[data-rl-np-unpin]').click(); await tick();
    assert.equal(asked, 1);
    assert.ok(p.w.win.rlNotesPinned(), 'a "no" keeps the pin');
    answer = true;
    p.host.querySelector('[data-rl-np-unpin]').click(); await tick();
    assert.equal(await done, null);
    assert.equal(p.w.win.rlNotesPinned(), null);
    assert.equal(p.ch.thread.length, 0, 'nothing was written');
  });

  test('Skip with nothing written asks nothing', async () => {
    const p = await bench();
    let asked = 0;
    p.w.win.confirmDialog = async () => { asked++; return true; };
    const done = p.w.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    p.host.querySelector('[data-rl-np-unpin]').click(); await tick();
    assert.equal(asked, 0);
    assert.equal(await done, null);
  });
});
