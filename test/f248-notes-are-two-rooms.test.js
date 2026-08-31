/* ============================================================
   f248 — notes are two rooms, and the room is the destination
   ============================================================
   Owner-ruled 27 Aug 2026, in two messages:

     "The buttons for internal vs external should show the respective sides'
      notes. Internal vs external notes should not be in the same view."
     "Any person that can edit the contract can send notes externally."

   WHAT THIS REPLACES, and why the replacement is safer rather than merely
   tidier. The note box carried a SWITCH — Internal / Send to them — set on the
   composer and read at the press, and the send resolved visibility by FINDING
   the pressed marker and DEFAULTING TO SHARED when it found none. So the wall
   between an internal aside and a message to the other side rested on a piece
   of markup being present, and the unsafe direction was the fallback.

   THE ROOM IS THE DESTINATION NOW. Internal and External are tabs; each holds
   its own notes and its own box; the box you type in belongs to the room you
   are standing in. There is no setting, so there is nothing to set wrongly —
   which is why the tests below assert by FILING rather than by reading markup:
   what matters is where a note ends up, not what a button said.

   THE GATE IS THE ONE THE PRODUCT ALREADY ASKS. POST /api/contracts/:id/messages
   — the route that has carried a note to the counterparty since long before
   this panel — is gated `auth, editor`. No owner check, no negotiation-lead
   check. Gating this panel harder would make a note stricter than the door
   that already sends one.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const BODY =
  '<h1>Supply Agreement</h1><p>Between Mkataba Holdings Ltd and Saw Sawa Ltd</p>'
  + '<h2>Clause 6 · Payment terms</h2><p>Pay each invoice within thirty (30) days.</p>'
  + '<h2>Clause 7 · Liability</h2><p>Neither party is liable for indirect loss.</p>';

const EDITOR = { id: 'u_ed', name: 'Amina Yusuf', role: 'legal', email: 'amina@mk.co.ke' };
const VIEWER = { id: 'u_vw', name: 'Peter Njoroge', role: 'viewer', email: 'peter@mk.co.ke' };

const contract = () => ({ id: 'MK-N9', name: 'Supply Agreement',
  counterparty: 'Saw Sawa Ltd', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [],
  comments: [], value: 4800000, redlineText: BODY, format: 'rich' });

/* The panel is the shell's drawer and buildWorld never loads the shell, so it
   is painted into a plain host — which is rlNotesPanelPaint's whole contract. */
/* NOTE THE WORLD'S OWN STUB, because it bit once: test/world.js replaces
   canEdit with () => true unless told otherwise, so a viewer built without
   `canEdit:false` reads as an editor and this file's gate tests would have
   passed against a product with no gate at all. The role AND the switch are
   set together here — a stub kinder than the thing it stands in for turns its
   test into a description. */
async function bench(user = EDITOR){
  const w = buildWorld({ user, negotiationView: true, contractView: true,
    canEdit: user.role !== 'viewer' });
  w.win.getUsers = () => [EDITOR, VIEWER];
  w.win.userById = id => [EDITOR, VIEWER].find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  const c = contract();
  w.win.negoInit(c);
  const cl = w.win.negoClauseList(c).find(x => x.num === '6');
  const ch = await w.win.negoEditClause(c, cl.clauseId,
    '<p>Pay each invoice within forty-five (45) days.</p>',
    { side: 'counterparty', author: 'Priya Nair · Saw Sawa Ltd' });
  w.win.state = Object.assign({}, w.win.state,
    { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  w.win.getContract = id => (String(id) === String(c.id) ? c : null);
  const paint = (room, opts = {}) => {
    if (room) w.win.rlNpSetRoom(room);
    const host = w.win.document.createElement('div');
    w.win.document.body.appendChild(host);
    w.win.rlNotesPanelPaint(host, c, ch, Object.assign({ side: 'owner' }, opts));
    return host;
  };
  const settle = () => new Promise(r => setImmediate(r));
  return { w, c, ch, paint, settle };
}

describe('f248 — the two rooms never share a note', () => {
  test('a note goes to exactly one room, and the reading is one function', async () => {
    const p = await bench();
    p.w.win.negoPostComment(p.c, p.ch.id, 'Our fallback is thirty.',
      { side: 'owner', author: EDITOR.name, visibility: 'internal' });
    p.w.win.negoPostComment(p.c, p.ch.id, 'We can hold at thirty.',
      { side: 'owner', author: EDITOR.name, visibility: 'shared' });
    const win = p.w.win;
    const int = win.negoRoomNotes(p.c, p.ch, 'internal', {}, 'owner');
    const ext = win.negoRoomNotes(p.c, p.ch, 'external', {}, 'owner');
    assert.equal(int.length, 1);
    assert.equal(ext.length, 1);
    assert.match(int[0].text, /fallback is thirty/);
    assert.match(ext[0].text, /hold at thirty/);
    /* NO NOTE IS IN BOTH, AND NONE IS IN NEITHER — the two rooms partition the
       thread, which is what makes "not in the same view" a guarantee rather
       than a filter that might miss one. */
    const all = win.negoRoomNotes(p.c, p.ch, null, {}, 'owner');
    assert.equal(int.length + ext.length, all.length);
    assert.equal(int.filter(m => ext.includes(m)).length, 0);
  });

  test('the counts are ONE arithmetic, and the tabs print it', async () => {
    const p = await bench();
    for (const v of ['internal', 'internal', 'shared'])
      p.w.win.negoPostComment(p.c, p.ch.id, `a note ${v} ${Math.random()}`,
        { side: 'owner', author: EDITOR.name, visibility: v });
    const n = p.w.win.negoNoteCounts(p.c, p.ch, {}, 'owner');
    assert.deepEqual([n.internal, n.external, n.total], [2, 1, 3]);
    const host = p.paint('internal');
    const tabs = [...host.querySelectorAll('[data-rl-np-room]')].map(t => t.textContent.trim());
    assert.match(tabs[0], /\(2\)/, 'the internal tab prints its own count');
    assert.match(tabs[1], /\(1\)/, 'and the external tab its own');
    /* THE ROW AND THE MENU BORROW THE SAME READING rather than counting again:
       a number worked out twice is a number that comes to disagree. */
    const src = read('js/views/negotiation.js');
    assert.match(src, /function rlCardNotesCountHtml[\s\S]{0,400}negoNoteCounts\(/);
    assert.match(src, /_npN = \(typeof negoNoteCounts === 'function'\)/);
  });
});

describe('f248 — the room decides where a note goes', () => {
  test('filing from the internal room files internal, and nothing travels', async () => {
    const p = await bench();
    let posted = 0;
    p.w.win.api = async () => { posted++; return { messages: [] }; };
    const host = p.paint('internal');
    host.querySelector('.rl-np-in').value = 'Finance will not go past thirty-five.';
    host.querySelector('[data-rl-np-send]').dispatchEvent(
      new p.w.win.Event('click', { bubbles: true }));
    await p.settle(); await p.settle();
    const last = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(last.visibility, 'internal');
    assert.equal(posted, 0,
      'THE CHANNEL IS THE ONLY WAY OUT, and an internal note simply does not take it');
  });

  test('filing from the external room files shared, and it travels', async () => {
    const p = await bench();
    const sent = [];
    p.w.win.api = async (pathname, method, body) => { sent.push({ pathname, body }); return { messages: [] }; };
    p.w.win.confirmDialog = async () => true;
    const host = p.paint('external');
    host.querySelector('.rl-np-in').value = 'Thirty days works.';
    host.querySelector('[data-rl-np-send]').dispatchEvent(
      new p.w.win.Event('click', { bubbles: true }));
    await p.settle(); await p.settle();
    const last = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(last.visibility, 'shared');
    assert.equal(sent.length, 1, 'and it went down the discussion channel');
    assert.match(sent[0].pathname, /\/messages$/);
    assert.match(sent[0].body.body, /Thirty days works/);
  });

  test('THE CONFIRM IS ON THE CROSSING ONLY, and it can refuse', async () => {
    const p = await bench();
    let asked = 0;
    p.w.win.api = async () => ({ messages: [] });
    p.w.win.confirmDialog = async () => { asked++; return false; };
    /* Internal: never asked. A dialog on both paths is furniture people learn
       to dismiss, and then it protects nothing. */
    let host = p.paint('internal');
    host.querySelector('.rl-np-in').value = 'quiet aside';
    host.querySelector('[data-rl-np-send]').dispatchEvent(new p.w.win.Event('click', { bubbles: true }));
    await p.settle(); await p.settle();
    assert.equal(asked, 0, 'an internal note is one press, exactly as before');
    assert.equal(p.ch.thread[p.ch.thread.length - 1].visibility, 'internal');
    /* External: asked, and Cancel really cancels. */
    const before = p.ch.thread.length;
    host = p.paint('external');
    host.querySelector('.rl-np-in').value = 'this must not go';
    host.querySelector('[data-rl-np-send]').dispatchEvent(new p.w.win.Event('click', { bubbles: true }));
    await p.settle(); await p.settle();
    assert.equal(asked, 1, 'the crossing asks');
    assert.equal(p.ch.thread.length, before, 'and Cancel files nothing at all');
  });
});

describe('f248 — who may write', () => {
  test('an editor writes in either room', async () => {
    const p = await bench(EDITOR);
    assert.ok(p.paint('internal').querySelector('[data-rl-np-send]'));
    assert.ok(p.paint('external').querySelector('[data-rl-np-send]'));
  });

  test('a viewer reads both rooms and writes in neither, and is told why', async () => {
    const p = await bench(VIEWER);
    for (const room of ['internal', 'external']){
      const host = p.paint(room);
      assert.equal(host.querySelector('[data-rl-np-send]'), null, `no box in the ${room} room`);
      assert.equal(host.querySelector('.rl-np-in'), null);
      const no = host.querySelector('.rl-np-no');
      assert.ok(no, 'the refusal is drawn where the box would be');
      assert.match(no.textContent, /cannot post/i, 'and it says why');
      assert.ok(host.querySelector('.rl-np-list'),
        'NOTHING IS HIDDEN FROM THEM: they read the whole exchange');
    }
  });

  test('the gate asks the one question the product already asks', async () => {
    const p = await bench(VIEWER);
    assert.equal(p.w.win.notesMayWrite(p.c, {}), false, 'a viewer may not');
    const q = await bench(EDITOR);
    assert.equal(q.w.win.notesMayWrite(q.c, {}), true, 'an editor may');
    assert.equal(q.w.win.notesMayWrite(q.c, { readonly: true }), false,
      'and a read-only seat may not, whoever is in it');
    /* The counterparty's page answers for itself — their page is the only
       channel they have, so it passes its own canComment and never reaches
       canEdit, which on their seat is not even a question that can be asked. */
    assert.equal(q.w.win.notesMayWrite(q.c, { canComment: true }), true);
    /* And the server's own gate on this act is the same one. */
    assert.match(read('server/server.js'),
      /app\.post\('\/api\/contracts\/:id\/messages', auth, editor,/);
  });
});

describe('f248 — the seats, the doors and the words', () => {
  test('the counterparty gets ONE room and no tabs', async () => {
    const p = await bench();
    const host = p.w.win.document.createElement('div');
    p.w.win.document.body.appendChild(host);
    p.w.win.rlNotesPanelPaint(host, p.c, p.ch,
      { side: 'counterparty', canComment: true, org: 'Mkataba Holdings' });
    assert.equal(host.querySelector('[data-rl-np-room]'), null,
      'no tabs: their page is thrown away on every paint, so there is nowhere to keep a private note');
    assert.ok(host.querySelector('.rl-np-who.out'), 'one room, and it says who reads it');
    assert.ok(host.querySelector('[data-rl-np-send]'), 'and no gate on it');
  });

  test('every door onto the panel carries the one attribute', async () => {
    const p = await bench();
    p.w.win.negoPostComment(p.c, p.ch.id, 'a note', { side: 'owner', author: EDITOR.name });
    p.w.win.renderRedline();
    const $ = s => p.w.win.document.querySelector(s);
    assert.ok($(`#rl-changes [data-rl-notes="${p.ch.id}"]`),
      'the count on the row is a door');
    const src = read('js/views/negotiation.js');
    assert.match(src, /data-rl-notes="\$\{_nea\(ch\.id\)\}">\$\{i18t\('ng_card_notes'\)\}/,
      'and so is the row in the ⋯ menu');
    /* REVERSED IN PLACE 31 Aug 2026 (owner-ruled C). The CLAIM is unchanged and
       is the whole point — one delegated listener, armed at module load, finds
       every door — and only the DESTINATION moved: on our seat the press now
       raises the note dialog, because the owner ruled that the same window
       writes a note and reads it back. The drawer is still where their seat
       lands, and is now Chat, with a door of its own in the shell bar. */
    const wired = src.match(/document\._rlNotesWired = true;[\s\S]*?\n\}\n/)[0];
    assert.match(wired, /openChangeNoteDialog\(c, ch,/,
      'ONE delegated listener, armed at module load, finds them all');
    assert.match(wired, /if \(window\.openNotesPanel\) openNotesPanel\(cid, id\);/,
      'and their seat falls through to exactly what it did before');
  });

  test('the count hides at zero — a column nobody has discussed carries none', async () => {
    const p = await bench();
    assert.equal(p.w.win.rlCardNotesCountHtml(p.c, p.ch, {}, 'owner'), '');
    p.w.win.negoPostComment(p.c, p.ch.id, 'a note', { side: 'owner', author: EDITOR.name });
    assert.match(p.w.win.rlCardNotesCountHtml(p.c, p.ch, {}, 'owner'), /data-rl-notes/);
  });

  test('the panel says everything in both languages', () => {
    const en = read('js/i18n.js');
    for (const k of ['ng_np_tab_int', 'ng_np_tab_ext', 'ng_np_who_int', 'ng_np_who_ext',
      'ng_np_oldest', 'ng_np_none_int', 'ng_np_none_ext', 'ng_np_none_sub', 'ng_np_ph_ext',
      'ng_np_viewer', 'ng_np_confirm_title', 'ng_np_confirm_msg', 'ng_np_confirm_go',
      'ng_np_sent', 'ng_np_send_failed', 'ng_np_filed', 'ng_np_gone'])
      assert.equal((en.match(new RegExp(`${k}:`, 'g')) || []).length, 2,
        `${k} must exist in EN and SV`);
  });
});
