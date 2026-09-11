/* ============================================================
   f303 — NOTES ARE ONE SYSTEM (Young asked 11 Sep 2026)
   ============================================================
   "I need your solution in how we can implement the comments ecosystem to be
    one. Maybe whenever you want to comment, the comments / chat slide panel
    slides in and you comment there instead. This for both commenting when you
    highlight a contract sentence ... or when you click on a pencil indicating
    you have finished your redlining ... if you choose comment, you are brought
    to the sliding comments / chat panel and you enter your comments there
    tagged to the CHG number. ... the comments that are related to a CHG number
    can then be also exported to microsoft word document."
   And, the same day: "we also add the ability to reply to a comment vs just
    entering a comment which would be a different step. All comments to be
    time stamped as well."

   THE CLAIMS, in the order the owner's words run:
     1  a note may be anchored to words, may be a reply, has an id, may be done
     2  where an anchored note lives is a READING — the pending change on its
        clause, else the contract — and whether its words are still there
     3  the channel carries the note's own facts, so the other seat reads them
     4  the drawer: the pin above the box, a reply as its OWN act under the note
        it answers, Done folded away, the full date and time on every note
     5  three doors, one drawer: highlight, the pencil, the card — and the
        receipt window is gone
     6  the marks on the paper follow the open, anchored threads
     7  the external notes go out to Word as comments, CHG number first,
        replies threaded, Done resolved; internal never
     8  the server keeps meta and answers Done on both links
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace } = require('./helpers');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const VIEW = read('js/views/negotiation.js');
const CE = read('js/views/clauseeditor.js');
const APP = read('js/app.js');
const PORTAL = read('js/views/portal.js');
const CONTRACT = read('js/views/contract.js');
const SERVER = read('server/server.js');

const BODY =
  '<h1>Supply Agreement</h1><p>Between Mkataba Holdings Ltd and Saw Sawa Ltd</p>'
  + '<h2>Clause 6 · Payment terms</h2><p>Pay each invoice within thirty (30) days of receipt.</p>'
  + '<h2>Clause 7 · Liability</h2><p>Neither party is liable for indirect loss.</p>'
  + '<h2>Clause 8 · Term</h2><p>Two years from the effective date.</p>';
const ME = { id: 'u_me', name: 'Amina Yusuf', role: 'legal', email: 'amina@mk.co.ke' };
const MATE = { id: 'u_mate', name: 'Wanjiru Kamau', role: 'legal', email: 'w@mk.co.ke' };
const VIEWER = { id: 'u_vw', name: 'Peter Njoroge', role: 'viewer', email: 'p@mk.co.ke' };
const contract = () => ({ id: 'MK-303', name: 'Supply Agreement', counterparty: 'Saw Sawa Ltd',
  status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [],
  versions: [], signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich' });

async function bench(user = ME){
  const w = buildWorld({ user, negotiationView: true, contractView: true, canEdit: user.role !== 'viewer' });
  w.win.getUsers = () => [ME, MATE, VIEWER];
  w.win.userById = id => [ME, MATE, VIEWER].find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  w.win.persist = () => {};
  w.win.negoPostToChannel = async () => ({ ok: false, skipped: true });
  w.win.negoNotifyMentions = async () => null;
  w.win.confirmDialog = async () => true;
  const c = contract();
  w.win.negoInit(c);
  const cl6 = w.win.negoClauseList(c).find(x => x.num === '6');
  const cl7 = w.win.negoClauseList(c).find(x => x.num === '7');
  const ch = await w.win.negoEditClause(c, cl6.clauseId,
    '<p>Pay each invoice within forty-five (45) days of receipt.</p>', { side: 'owner' });
  w.win.state = Object.assign({}, w.win.state, { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  w.win.getContract = id => (String(id) === String(c.id) ? c : null);
  /* A stand-in for the shell's drawer: the world has no js/app.js, so the
     door is stubbed to paint the two real panels into a host, exactly as
     renderContextPanel does. */
  const host = w.win.document.createElement('div');
  w.win.document.body.appendChild(host);
  const opened = [];
  w.win.openNotesPanel = (cid, chId, o) => {
    opened.push({ cid, chId, force: !!(o && o.force) });
    const opts = { side: 'owner', author: ME.name };
    if (chId){ const x = w.win.negoChangeById(c, chId); w.win.rlNotesPanelPaint(host, c, x, opts); }
    else w.win.rlChatPanelPaint(host, c, opts);
  };
  return { w, c, ch, cl6, cl7, host, opened };
}
const tick = () => new Promise(r => setTimeout(r, 30));
/* Objects cross the jsdom realm, so structure is compared as JSON. */
const same = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

/* ============================================================
   1 — THE FOUR SMALL FACTS ON A NOTE
   ============================================================ */
describe('f303 (1) — a note may be anchored, may be a reply, has an id, may be done', () => {
  test('an anchor is stored only through the one reading, bounded and clean', async () => {
    const p = await bench();
    const m = p.w.win.negoPostComment(p.c, null, 'Is thirty realistic?', { side: 'owner',
      anchor: { clauseId: p.cl6.clauseId, quote: '  thirty   (30) days  ' } });
    assert.ok(m.id && /^nt_/.test(m.id), 'minted at posting');
    same(m.anchor, { clauseId: p.cl6.clauseId, quote: 'thirty (30) days' });
    const bad = p.w.win.negoPostComment(p.c, null, 'Malformed.', { side: 'owner', anchor: { quote: 'x' } });
    assert.equal(bad.anchor, undefined, 'a clause id is required');
    const long = p.w.win.negoPostComment(p.c, null, 'Long.', { side: 'owner',
      anchor: { clauseId: 'x', quote: 'w'.repeat(900) } });
    assert.equal(long.anchor.quote.length, p.w.win.NOTE_QUOTE_MAX);
  });

  test('a reply names the note it answers, and the threads reading puts it under it', async () => {
    const p = await bench();
    const root = p.w.win.negoPostComment(p.c, p.ch.id, 'Root.', { side: 'owner' });
    const reply = p.w.win.negoPostComment(p.c, p.ch.id, 'Answer.', { side: 'owner', replyTo: root.id });
    assert.equal(reply.replyTo, root.id);
    const th = p.w.win.negoNoteThreads(p.ch.thread);
    assert.equal(th.length, 1, 'one thread');
    assert.equal(th[0].root, root);
    assert.equal(th[0].replies.length, 1);
    assert.equal(th[0].replies[0], reply);
    const orphan = p.w.win.negoPostComment(p.c, p.ch.id, 'Orphan.', { side: 'owner', replyTo: 'nt_nowhere' });
    assert.equal(p.w.win.negoNoteThreads(p.ch.thread).length, 2,
      'a reply whose parent is not on the list reads as a root, never hidden');
    assert.ok(orphan.replyTo, 'and its field is kept');
  });

  test('an older note without an id is keyed on its time', async () => {
    const p = await bench();
    const old = { who: 'Somebody', side: 'owner', visibility: 'internal', at: '2026-08-01T10:00:00Z', text: 'Old.' };
    assert.equal(p.w.win.negoNoteKey(old), old.at);
  });

  test('Done is written by the one writer, on the real thread, with who and when', async () => {
    const p = await bench();
    const m = p.w.win.negoPostComment(p.c, p.ch.id, 'Root.', { side: 'owner' });
    const copy = { ...m };
    const real = p.w.win.negoNoteDone(p.c, p.ch, copy, true);
    assert.equal(real, m, 'found by key, so a merged copy still marks the record');
    assert.equal(m.done.by, ME.name);
    assert.ok(m.done.at);
    assert.match(p.c.audit[p.c.audit.length - 1].detail || JSON.stringify(p.c.audit[p.c.audit.length - 1]), /done/i);
    p.w.win.negoNoteDone(p.c, p.ch, m, false);
    assert.equal(m.done, undefined, 'reopened');
    assert.equal(p.w.win.negoNoteDone(p.c, p.ch, { id: 'nt_none', at: 'x' }, true), null, 'a note not on the thread is refused');
  });
});

/* ============================================================
   2 — WHERE AN ANCHORED NOTE LIVES, AND WHETHER ITS WORDS STAND
   ============================================================ */
describe('f303 (2) — the home is a reading, and so is the anchor’s state', () => {
  test('the pending change on the clause, newest first; nothing on a clean clause', async () => {
    const p = await bench();
    assert.equal(p.w.win.negoNoteHomeFor(p.c, p.cl6.clauseId), p.ch);
    assert.equal(p.w.win.negoNoteHomeFor(p.c, p.cl7.clauseId), null);
    p.ch.withdrawn = true;
    assert.equal(p.w.win.negoNoteHomeFor(p.c, p.cl6.clauseId), null, 'a withdrawn ask is not a home');
    delete p.ch.withdrawn;
  });

  test('live where the words are in the clause as it stands, moved where they are not, gone where the clause is not', async () => {
    const p = await bench();
    const live = { anchor: { clauseId: p.cl7.clauseId, quote: 'indirect loss' } };
    const moved = { anchor: { clauseId: p.cl7.clauseId, quote: 'consequential loss' } };
    const gone = { anchor: { clauseId: 'cl_nowhere', quote: 'anything' } };
    assert.equal(p.w.win.negoAnchorState(p.c, live), 'live');
    assert.equal(p.w.win.negoAnchorState(p.c, moved), 'moved');
    assert.equal(p.w.win.negoAnchorState(p.c, gone), 'gone');
    assert.equal(p.w.win.negoAnchorState(p.c, { text: 'no anchor' }), null);
    assert.equal(p.w.win.negoAnchorState({ id: 'x' }, live), 'unknown',
      'a record with no negotiation is not read against — READING MUST NOT WRITE');
  });
});

/* ============================================================
   3 — THE CHANNEL CARRIES THE NOTE'S OWN FACTS
   ============================================================ */
describe('f303 (3) — what travels on the channel, and what the merge reads back', () => {
  test('the post carries id, anchor and replyTo as meta; the merge reads them, and Done from a twin', async () => {
    const p = await bench();
    const m = p.w.win.negoPostComment(p.c, p.ch.id, 'Ours, external.', { side: 'owner', visibility: 'shared',
      anchor: { clauseId: p.cl6.clauseId, quote: 'forty-five (45)' } });
    const meta = p.w.win.negoNoteMeta(m);
    same(meta, { id: m.id, anchor: m.anchor });
    /* Their reply and their Done on our note, as the channel would hold them. */
    const extra = [
      { id: 41, topic: 'change:' + p.ch.id, author: m.who, side: 'owner', at: m.at, body: m.text,
        meta: { id: m.id, anchor: m.anchor, done: { at: '2026-09-11T12:00:00Z', by: 'Erik Lund' } } },
      { id: 42, topic: 'change:' + p.ch.id, author: 'Erik Lund', side: 'counterparty', at: '2026-09-11T11:00:00Z',
        body: 'Fine by us.', meta: { id: 'nt_theirs', replyTo: m.id, anchor: { clauseId: p.cl6.clauseId, quote: 'forty-five (45)' } } },
    ];
    const merged = p.w.win.negoMergedThread(p.c, p.ch, extra);
    const ours = merged.find(x => x.text === 'Ours, external.');
    const theirs = merged.find(x => x.text === 'Fine by us.');
    assert.equal(ours.done.by, 'Erik Lund', 'the twin’s Done is READ onto ours');
    assert.equal(m.done, undefined, 'and the record itself is untouched');
    assert.equal(ours.channelId, 41);
    assert.equal(theirs.replyTo, m.id);
    same(theirs.anchor, m.anchor);
    assert.equal(theirs.id, 'nt_theirs');
    const th = p.w.win.negoNoteThreads(merged);
    assert.equal(th.length, 1);
    assert.equal(th[0].replies[0].text, 'Fine by us.');
  });

  test('the channel post names the meta; the portal’s post does too, and handles a contract-level note', () => {
    assert.match(VIEW, /body: msg\.text, meta: negoNoteMeta\(msg\) \}\);/);
    assert.match(PORTAL, /meta:\(window\.negoNoteMeta\?negoNoteMeta\(msg\):undefined\)/);
    assert.match(PORTAL, /topicLabel: ch \? `Change #\$\{ch\.id\}/, 'no change is the contract, not "Change #undefined"');
  });
});

/* ============================================================
   4 — THE DRAWER
   ============================================================ */
describe('f303 (4) — the pin, the reply as its own act, Done, and the clock', () => {
  test('every note prints the full date and time', async () => {
    const p = await bench();
    const full = p.w.win.negoWhenFull('2026-09-14T09:14:00Z');
    assert.match(full, /2026/, 'the year');
    assert.match(full, /\d{1,2}[:.]\d{2}/, 'the time');
    const m = p.w.win.negoPostComment(p.c, p.ch.id, 'Clocked.', { side: 'owner', at: undefined });
    const html = p.w.win.rlNpNoteHtml(m, 'internal', 'owner', 'Saw Sawa Ltd');
    assert.ok(html.includes(p.w.win.negoWhenFull(m.at)), 'the row prints negoWhenFull');
  });

  test('a pinned passage draws above the box, names the CHG it is tagged to, quotes the words, and offers the room', async () => {
    const p = await bench();
    const ok = p.w.win.rlNoteFromSelection(p.c, { clauseId: p.cl6.clauseId, quote: 'forty-five (45) days' }, { side: 'owner' });
    assert.equal(ok, true);
    same(p.opened[0], { cid: p.c.id, chId: p.ch.id, force: true },
      'the words sit inside the pending change, so the drawer opens on that change');
    const pin = p.host.querySelector('.rl-np-pin');
    assert.ok(pin, 'the pin is drawn');
    assert.match(pin.textContent, new RegExp(p.ch.id));
    assert.match(pin.querySelector('q').textContent, /forty-five \(45\) days/);
    const rooms = [...pin.querySelectorAll('[data-rl-np-pin-room]')];
    assert.deepEqual(rooms.map(b => b.getAttribute('data-rl-np-pin-room') + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')),
      ['internal*', 'external'], 'Internal lit at rest (D-6), External a press away');
    assert.ok(p.host.querySelector('[data-rl-np-unpin]'), 'and a way to drop it');
  });

  test('a note sent under the pin carries the anchor onto the pinned change, and the pin is spent', async () => {
    const p = await bench();
    p.w.win.rlNoteFromSelection(p.c, { clauseId: p.cl6.clauseId, quote: 'forty-five (45) days' }, { side: 'owner' });
    const box = p.host.querySelector('.rl-np-in');
    box.value = 'Can their finance team pay in 45?';
    const send = p.host.querySelector('[data-rl-np-send]');
    await p.w.win.rlNotesSend(p.host, p.c, p.ch, { side: 'owner' }, send.getAttribute('data-room'));
    const m = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(m.text, 'Can their finance team pay in 45?');
    same(m.anchor, { clauseId: p.cl6.clauseId, quote: 'forty-five (45) days' });
    assert.equal(m.visibility, 'internal');
    assert.equal(p.w.win.rlNotesPinned(), null, 'spent');
    assert.equal(p.host.querySelector('.rl-np-pin'), null, 'and gone from the drawer');
  });

  test('words on a clean clause pin to the contract, and the switch changes the room', async () => {
    const p = await bench();
    p.w.win.rlNoteFromSelection(p.c, { clauseId: p.cl7.clauseId, quote: 'indirect loss' }, { side: 'owner' });
    assert.equal(p.opened[0].chId, null, 'no change on clause 7: the contract’s own drawer');
    assert.match(p.host.querySelector('.rl-np-pin .ref').textContent, /Clause 7|Liability/);
    p.host.querySelector('[data-rl-np-pin-room="external"]').click();
    await tick();
    assert.equal(p.w.win.rlNotesPinned().room, 'external');
    assert.equal(p.w.win.rlNpRoom(), 'external', 'the drawer’s tab follows the pin');
    assert.ok(p.host.querySelector('.rl-np-pin.out'), 'and the pin wears the crossing’s colour');
  });

  test('Reply is its own act: a box under the note, and the reply lands on the root’s thread in the root’s room', async () => {
    const p = await bench();
    const root = p.w.win.negoPostComment(p.c, p.ch.id, 'Root question.', { side: 'owner' });
    p.w.win.rlNotesPanelPaint(p.host, p.c, p.ch, { side: 'owner', author: ME.name });
    assert.equal(p.host.querySelector('.rl-np-rbox'), null, 'no reply box until Reply is pressed');
    p.host.querySelector(`[data-rl-np-reply="${root.id}"]`).click();
    await tick();
    const rbox = p.host.querySelector(`[data-rl-np-rin="${root.id}"]`);
    assert.ok(rbox, 'the reply box is under the note it answers');
    assert.match(rbox.getAttribute('placeholder'), /Amina Yusuf/, 'and names who it answers');
    rbox.value = 'Answer to the root.';
    p.host.querySelector(`[data-rl-np-reply-send="${root.id}"]`).click();
    await tick(); await tick();
    const reply = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(reply.text, 'Answer to the root.');
    assert.equal(reply.replyTo, root.id);
    assert.equal(reply.visibility, 'internal');
    assert.ok(p.host.querySelector('.rl-np-note.is-reply'), 'drawn indented under the root');
    assert.equal(p.host.querySelector('.rl-np-rbox'), null, 'the box shuts');
  });

  test('the foot box only ever writes a NEW note, never a reply', async () => {
    const p = await bench();
    p.w.win.negoPostComment(p.c, p.ch.id, 'Root.', { side: 'owner' });
    p.w.win.rlNotesPanelPaint(p.host, p.c, p.ch, { side: 'owner', author: ME.name });
    p.host.querySelector('.rl-np-in').value = 'Another root.';
    await p.w.win.rlNotesSend(p.host, p.c, p.ch, { side: 'owner' }, 'internal');
    const m = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(m.replyTo, undefined);
    assert.equal(p.w.win.negoNoteThreads(p.ch.thread).length, 2);
  });

  test('Done folds the thread away under "Done (n)", and Reopen brings it back', async () => {
    const p = await bench();
    const root = p.w.win.negoPostComment(p.c, p.ch.id, 'Settle me.', { side: 'owner' });
    const opts = { side: 'owner', author: ME.name };
    p.w.win.rlNotesPanelPaint(p.host, p.c, p.ch, opts);
    p.host.querySelector(`[data-rl-np-done="${root.id}"]`).click();
    await tick(); await tick();
    assert.ok(root.done, 'marked on the record');
    assert.equal(p.host.querySelector('.rl-np-thread:not(.is-done)'), null, 'no open thread drawn');
    const fold = p.host.querySelector('[data-rl-np-donefold]');
    assert.ok(fold, 'the fold is drawn');
    assert.match(fold.textContent, /1/);
    fold.click(); await tick();
    const shown = p.host.querySelector('.rl-np-thread.is-done');
    assert.ok(shown, 'unfolded');
    assert.match(shown.textContent, /Amina Yusuf/, 'Done by whom');
    shown.querySelector(`[data-rl-np-done="${root.id}"]`).click();
    await tick(); await tick();
    assert.equal(root.done, undefined, 'reopened');
  });

  test('a viewer reads the acts on nobody’s notes and writes nothing', async () => {
    const p = await bench(VIEWER);
    p.w.win.negoPostComment(p.c, p.ch.id, 'Root.', { side: 'owner', author: ME.name });
    p.w.win.rlNotesPanelPaint(p.host, p.c, p.ch, { side: 'owner', readonly: true });
    assert.equal(p.host.querySelector('[data-rl-np-reply]'), null);
    assert.equal(p.host.querySelector('[data-rl-np-done]'), null);
    assert.ok(p.host.querySelector('.rl-np-no'));
  });

  test('Chat groups threads, and a contract note on words a pending change now covers is shown under that CHG', async () => {
    const p = await bench();
    p.w.win.negoPostComment(p.c, null, 'On the payment words.', { side: 'owner',
      anchor: { clauseId: p.cl6.clauseId, quote: 'forty-five (45)' } });
    p.w.win.negoPostComment(p.c, null, 'On liability.', { side: 'owner',
      anchor: { clauseId: p.cl7.clauseId, quote: 'indirect loss' } });
    p.w.win.rlChatPanelPaint(p.host, p.c, { side: 'owner', author: ME.name });
    const rows = [...p.host.querySelectorAll('.rl-chat-row')];
    assert.equal(rows.length, 2);
    assert.match(rows[0].querySelector('.rl-chat-on').textContent, new RegExp(p.ch.id),
      'the words sit in the pending change, so the row leads with its reference');
    assert.match(rows[1].querySelector('.rl-chat-on').textContent, /Clause 7|Liability/);
    assert.ok(rows[1].querySelector('.rl-np-anchor q'), 'and the words are quoted on the note');
  });

  test('their seat: Chat draws one room and no tabs', async () => {
    const p = await bench();
    const html = p.w.win.rlChatPanelHtml(p.c, { side: 'counterparty', canComment: true, messages: [] });
    assert.equal(/data-rl-np-room=/.test(html), false);
    assert.match(html, /rl-np-who out/);
  });
});

/* ============================================================
   5 — THREE DOORS, ONE DRAWER
   ============================================================ */
describe('f303 (5) — three doors and the retired window', () => {
  test('the pencil: rlNoteAskAfterFile opens the drawer pinned to the change just filed, Internal at rest', async () => {
    const p = await bench();
    const done = p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    await tick();
    same(p.opened[0], { cid: p.c.id, chId: p.ch.id, force: true });
    const pin = p.w.win.rlNotesPinned();
    assert.equal(pin.changeId, p.ch.id);
    assert.equal(pin.filed, true);
    assert.equal(pin.room, 'internal');
    /* RE-POINTED 11 Sep 2026 (round three): no lead line; the pin quotes the change. */
    assert.equal(p.host.querySelector('.rl-np-pin .lead'), null);
    assert.ok(p.host.querySelector('.rl-np-pin q'), 'the change\'s wording is quoted');
    /* Skip with nothing typed drops the pin and tells the caller nothing happened. */
    p.host.querySelector('[data-rl-np-unpin]').click();
    await tick();
    assert.equal(await done, null);
    assert.equal(p.w.win.rlNotesPinned(), null);
  });

  test('a revision says so on the pin; a note typed under it lands on the change and resolves "added"', async () => {
    const p = await bench();
    await p.w.win.negoEditClause(p.c, p.cl6.clauseId,
      '<p>Pay each invoice within sixty (60) days of receipt.</p>', { side: 'owner' });
    assert.ok((p.ch.revisions || []).length, 'the fold happened');
    const done = p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    await tick();
    assert.equal(p.host.querySelector('.rl-np-pin .lead'), null, 'no lead (round three)');
    assert.match(p.host.querySelector('.rl-np-pin q').textContent, /sixty/i, 'the revised wording is quoted');
    p.host.querySelector('.rl-np-in').value = 'Sixty is our fallback.';
    const send = p.host.querySelector('[data-rl-np-send]');
    await p.w.win.rlNotesSend(p.host, p.c, p.ch, { side: 'owner' }, send.getAttribute('data-room'));
    assert.equal(await done, 'added');
    const m = p.ch.thread[p.ch.thread.length - 1];
    assert.equal(m.text, 'Sixty is our fallback.');
    assert.equal(m.anchor, undefined, 'a note on a filing has no words of its own to sit on');
  });

  test('a draft stays with the room it was typed in, and Skip over a draft asks first', async () => {
    const p = await bench();
    let asked = 0;
    p.w.win.confirmDialog = async () => { asked++; return false; };
    p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    await tick();
    const box = p.host.querySelector('.rl-np-in');
    box.value = 'For us.'; box.dispatchEvent(new p.w.win.Event('input', { bubbles: true }));
    p.host.querySelector('[data-rl-np-pin-room="external"]').click(); await tick();
    assert.equal(p.host.querySelector('.rl-np-in').value, '', 'the other room starts empty');
    p.host.querySelector('[data-rl-np-pin-room="internal"]').click(); await tick();
    assert.equal(p.host.querySelector('.rl-np-in').value, 'For us.', 'and the first room kept its words');
    p.host.querySelector('[data-rl-np-unpin]').click(); await tick();
    assert.equal(asked, 1, 'asked');
    assert.ok(p.w.win.rlNotesPinned(), 'and a "no" keeps the pin');
  });

  test('their seat and a viewer are still not asked; the drawer closing drops the pin', async () => {
    const p = await bench();
    assert.equal(await p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'counterparty' }), null);
    assert.equal(p.opened.length, 0);
    const v = await bench(VIEWER);
    assert.equal(await v.w.win.rlNoteAskAfterFile(v.c, v.ch, { side: 'owner' }), null);
    const done = p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    p.w.win.rlNotesPanelClosed();
    assert.equal(await done, null);
  });

  test('the card row opens the drawer on the change with nothing pinned', async () => {
    const p = await bench();
    p.w.win.rlNotesPin({ contractId: p.c.id, clauseId: p.cl7.clauseId, quote: 'x' });
    const out = await p.w.win.openChangeNoteDialog(p.c, p.ch, { side: 'owner' });
    assert.equal(out, null);
    assert.equal(p.w.win.rlNotesPinned(), null, 'an old pin is dropped');
    /* RE-POINTED 11 Sep 2026 (evening): the row is a door a person presses,
       so it TOGGLES — no `force`. Force is the filing's, which delivers a pin. */
    same(p.opened[0], { cid: p.c.id, chId: p.ch.id, force: false });
  });

  test('the receipt window is a stub, and nothing draws it', () => {
    assert.match(VIEW, /function rlNoteDialogHtml\(\)\{ return ''; \}/);
    for (const stale of ['rl-note-overlay', 'rl-note-dlg', 'rl-note-in', 'rl-note-ok', 'rl-note-skip', 'data-rl-note-room']){
      const hits = (VIEW.match(new RegExp(stale, 'g')) || []).length;
      assert.ok(hits <= 1, `${stale} is stale: ${hits} mentions`);
    }
    assert.equal(/id="rl-note-overlay"|rl-note-overlay'/.test(VIEW), false);
    assert.equal(/openChangeNoteDialog\(c, ch, \{ \.\.\.opts, filed: true \}\)/.test(VIEW), true,
      'the one reading of the ask is kept');
  });

  test('the clause editor offers Ask Copilot, Edit with Copilot and Comment, and its confirmation is brief and always', () => {
    assert.match(CE, /if \(read\.sel\)\{ ceOfferPassage\(read\.sel\); return; \}/);
    assert.match(CE, /ng_sel_ask/);
    assert.match(CE, /ng_sel_edit/);
    assert.match(CE, /ng_sel_comment/);
    assert.match(CE, /if \(window\.toast\) toast\(_cet\('ce_filed', \{ id: ch\.id \}\), 'ok'\);/);
    /* RE-POINTED 11 Sep 2026 (evening): the paper's Ask and Edit both arrive
       with words AND the verb they were pressed under. */
    assert.match(CE, /if \(opts && opts\.passage\) setTimeout\(\(\) => \{ try \{ ceAttachWords\(opts\.passage, opts\.passageMode\)/,
      'the paper’s Ask Copilot arrives with words and its verb');
    assert.match(CE, /rlPaintNoteMarks\(host, _ceC/, 'and the canvas paints the marks');
  });

  test('the paper offers two things on our seat and one on theirs, and the guard that killed the menu is gone', () => {
    const fn = VIEW.match(/function rlPaperSelOffer\(ctx\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /acts\.push\(\{ id: 'ask'/);
    assert.match(fn, /acts\.push\(\{ id: 'comment'/);
    assert.match(fn, /if \(opts && opts\.preview\) return false;/);
    assert.match(VIEW, /const onPaper = !inCpEditorPane && !!\(pane\.closest && pane\.closest\('\.rl-doc'\)\);/);
    assert.equal(/if \(!theirSeat && !inCpEditorPane && pane\.closest && pane\.closest\('\.rl-doc'\)\)\{\n\s*_negoKillSelMenu\(\);\n\s*return;/.test(VIEW), false);
    /* RE-POINTED 11 Sep 2026 (round three, item 8): the paper's handler goes
       through rlPaperOfferFromRange — the one reading both papers share. */
    assert.match(VIEW, /rlPaperOfferFromRange\(\{ c, opts, side, passage, text, rect,/);
  });

  test('the shell: force opens rather than toggles, and a closed drawer drops the pin', () => {
    assert.match(APP, /function openNotesPanel\(contractId, changeId, o\)\{/);
    assert.match(APP, /const same=!force&&state\.panelOpen/);
    assert.match(APP, /if\(!state\.panelOpen\)\{ try\{ if\(window\.rlNotesPanelClosed\) rlNotesPanelClosed\(\); \}catch\(_\)\{\} \}/);
  });

  test('their page: a notes aside of its own, a door in More, and both hooks on the mount', () => {
    assert.match(PORTAL, /function portalNotesShellHtml\(\)/);
    assert.match(PORTAL, /id="pt-notes-door"/);
    assert.match(PORTAL, /onDone:portalNoteDone\(p\),/);
    assert.match(PORTAL, /openNotes:\(_c,pin\)=>portalOpenNotes\(\{ pin \}\),/);
    assert.match(PORTAL, /\$\{portalAlertsShellHtml\(\)\}\$\{portalNotesShellHtml\(\)\}/);
  });
});

/* ============================================================
   6 — THE MARKS ON THE PAPER
   ============================================================ */
describe('f303 (6) — the marks follow the open anchored threads', () => {
  test('a marker per open anchored thread in reading order, a wash on the words, hollow where they moved', async () => {
    const p = await bench();
    p.w.win.negoPostComment(p.c, null, 'Liability.', { side: 'owner',
      anchor: { clauseId: p.cl7.clauseId, quote: 'indirect loss' } });
    p.w.win.negoPostComment(p.c, p.ch.id, 'Payment.', { side: 'owner', visibility: 'shared',
      anchor: { clauseId: p.cl6.clauseId, quote: 'forty-five (45)' } });
    const done = p.w.win.negoPostComment(p.c, null, 'Finished.', { side: 'owner',
      anchor: { clauseId: p.cl7.clauseId, quote: 'liable' } });
    p.w.win.negoNoteDone(p.c, null, done, true);
    const stale = p.w.win.negoPostComment(p.c, null, 'Moved.', { side: 'owner',
      anchor: { clauseId: p.cl7.clauseId, quote: 'consequential loss' } });
    const root = p.w.win.document.createElement('div');
    root.innerHTML = `<div class="rl-doc">${p.w.win.redlineDocHtml(p.c, { side: 'owner' })}</div>`;
    const n = p.w.win.rlPaintNoteMarks(root, p.c, { side: 'owner' });
    assert.equal(n, 3, 'three open anchored threads; the done one draws nothing');
    const marks = [...root.querySelectorAll('.rl-note-mk')];
    assert.deepEqual(marks.map(b => b.textContent), ['1', '2', '3'], 'numbered down the paper');
    assert.equal(marks[0].getAttribute('data-rl-note-home'), p.ch.id, 'the payment note is on its CHG');
    assert.ok(marks[0].classList.contains('out'), 'the external room wears its own colour');
    const gone = marks.find(b => b.classList.contains('is-gone'));
    assert.ok(gone, 'the moved words draw hollow');
    assert.equal(gone.getAttribute('data-rl-note-open'), stale.id);
    const washes = [...root.querySelectorAll('.rl-note-hl')];
    assert.ok(washes.some(w => /indirect loss/.test(w.textContent)), 'the words are washed');
    assert.equal(washes.some(w => /consequential/.test(w.textContent)), false);
    /* Painting again is idempotent. */
    assert.equal(p.w.win.rlPaintNoteMarks(root, p.c, { side: 'owner' }), 3);
    assert.equal(root.querySelectorAll('.rl-note-mk').length, 3);
    assert.equal(root.querySelectorAll('.rl-note-hl').length, washes.length);
  });

  test('rlWrapWords finds words across two text nodes and never inside a control', async () => {
    const p = await bench();
    const el = p.w.win.document.createElement('section');
    el.innerHTML = '<p>Pay each <b>invoice</b> within thirty (30) days.</p><button>thirty (30) days</button>';
    assert.equal(p.w.win.rlWrapWords(el, 'each invoice within', 'rl-note-hl'), true);
    assert.equal(el.querySelectorAll('.rl-note-hl').length, 3, 'three pieces across the bold');
    assert.equal(el.querySelector('button .rl-note-hl'), null);
    assert.equal(p.w.win.rlWrapWords(el, 'not in there', 'rl-note-hl'), false);
  });

  test('every canvas paints them: negoAfterPaint leads with the marks', () => {
    assert.match(VIEW, /function negoAfterPaint\(c, opts, host\)\{\n  try \{ if \(host && c\) rlPaintNoteMarks\(host, c, opts \|\| \{\}\); \} catch \(e\)\{\}/);
  });
});

/* ============================================================
   7 — WORD
   ============================================================ */
describe('f303 (7) — the external notes go out as Word comments', () => {
  test('a note on a change goes out with the CHG first, on the change’s own words; replies thread; Done resolves; internal never', async () => {
    const p = await bench();
    const root = p.w.win.negoPostComment(p.c, p.ch.id, 'Our standard is 45.', { side: 'owner', visibility: 'shared' });
    p.w.win.negoPostComment(p.c, p.ch.id, 'Accepted.', { side: 'owner', visibility: 'shared', replyTo: root.id, author: 'Kari' });
    p.w.win.negoPostComment(p.c, p.ch.id, 'Internal aside.', { side: 'owner' });
    const d = p.w.win.negoPostComment(p.c, null, 'Liability?', { side: 'owner', visibility: 'shared',
      anchor: { clauseId: p.cl7.clauseId, quote: 'indirect loss' } });
    p.w.win.negoNoteDone(p.c, null, d, true);
    let captured = null;
    const realExport = p.w.win.docxExportTracked;
    p.w.win.docxExportTracked = (html, o) => { captured = o; return realExport(html, o); };
    p.w.win.URL = p.w.win.URL || {};
    p.w.win.URL.createObjectURL = () => 'blob:x';
    p.w.win.URL.revokeObjectURL = () => {};
    p.w.win.exportWordTracked(p.c, { author: 'Amina' });
    assert.ok(captured && Array.isArray(captured.comments), 'the writer is handed the comments');
    const texts = captured.comments.map(x => x.text);
    assert.ok(texts.includes(p.ch.id + ': Our standard is 45.'), 'CHG first');
    assert.ok(texts.includes('Accepted.'));
    assert.equal(texts.some(t => /Internal aside/.test(t)), false, 'internal never leaves');
    const reply = captured.comments.find(x => x.text === 'Accepted.');
    assert.equal(reply.replyTo, captured.comments.find(x => /Our standard/.test(x.text)).key);
    const doneC = captured.comments.find(x => x.text === 'Liability?');
    assert.equal(doneC.done, true);
    assert.equal(doneC.quote, 'indirect loss');
    assert.match(captured.comments.find(x => /Our standard/.test(x.text)).quote, /forty-five \(45\)/, 'a note on a change sits on the inserted words');
    const D = require('../js/docx.js');
    const out = D.docxExportTracked(p.w.win.redlineDocHtml(p.c, { side: 'owner' }), { author: 'Amina', comments: captured.comments });
    assert.equal(out.comments.placed, 3);
    assert.match(out.xml, /commentRangeStart/);
    const back = await D.docxComments(out.bytes);
    assert.equal(back.length, 3);
    assert.ok(back.some(x => x.text === p.ch.id + ': Our standard is 45.'));
  });

  test('with no comments the file is byte-identical to before, and the parts only appear with one', () => {
    const D = require('../js/docx.js');
    const html = '<p>Plain words.</p>';
    const a = D.docxExportTracked(html, { author: 'A', date: '2026-09-11T10:00:00Z' });
    const b = D.docxExportTracked(html, { author: 'A', date: '2026-09-11T10:00:00Z', comments: [] });
    assert.deepEqual([...a.bytes], [...b.bytes]);
    assert.equal(/comments\.xml/.test(new TextDecoder().decode(a.bytes)), false);
    const c = D.docxExportTracked(html, { author: 'A', date: '2026-09-11T10:00:00Z',
      comments: [{ key: 'k', author: 'X', date: '2026-09-11T10:00:00Z', text: 'Hi', quote: 'Plain words' }] });
    const txt = new TextDecoder().decode(c.bytes);
    assert.match(txt, /word\/comments\.xml/);
    assert.match(txt, /commentsExtended\.xml/);
    assert.match(txt, /w15:commentEx/);
    assert.equal(c.comments.left, 0);
    const left = D.docxExportTracked(html, { author: 'A', comments: [{ author: 'X', text: 'Hi', quote: 'not here' }] });
    assert.equal(left.comments.left, 1, 'an unplaced comment is counted, never guessed');
  });

  test('the import reads the CHG prefix home before it guesses by wording', () => {
    const NEG = read('js/negotiation.js');
    assert.match(NEG, /const tag = \/\^\(CHG-\\d\+\)\\s\*\[:：\]\\s\*\/i\.exec\(String\(cm\.text \|\| ''\)\);/);
    assert.match(NEG, /topic: negoTopicFor\(ch\), topicLabel: `Change #\$\{ch\.id\}/);
  });

  test('the export gathers the EXTERNAL room only, every change but a superseded one', () => {
    const fn = CONTRACT.match(/function wordCommentsOf\(c,side\)\{[\s\S]*?\n\}/)[0];
    assert.equal((fn.match(/'external'/g) || []).length, 2);
    assert.equal(/'internal'/.test(fn), false);
    assert.match(fn, /ch\.status!=='superseded'/);
  });
});

/* ============================================================
   8 — THE SERVER
   ============================================================ */
describe('f303 (8) — the server keeps a message’s meta and answers Done on both links', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { if (h) await h.stop(); });

  test('the column, the allow-list and the two PATCH routes are on the server', () => {
    assert.match(SERVER, /addColumnIfMissing\('share_messages', 'meta', 'TEXT'\);/);
    assert.match(SERVER, /function msgMeta\(raw\)/);
    assert.match(SERVER, /app\.patch\('\/api\/contracts\/:id\/messages\/:mid', auth, editor/);
    assert.match(SERVER, /app\.patch\('\/api\/shares\/:token\/messages\/:mid', rlShare/);
  });

  test('meta rides a post, is bounded, and Done is set and cleared by PATCH', async () => {
    const posted = await W.admin.json('/api/contracts/MK-A2/messages', { method: 'POST', body: {
      topic: 'general', body: 'On these words.',
      meta: { id: 'nt_1', anchor: { clauseId: 'cl_1', quote: '  thirty   (30)  ' }, replyTo: 'nt_0', junk: 'dropped' } } });
    same(posted.message.meta, { id: 'nt_1', replyTo: 'nt_0', anchor: { clauseId: 'cl_1', quote: 'thirty (30)' } });
    const list = await W.admin.json('/api/contracts/MK-A2/messages');
    const m = list.messages.find(x => x.id === posted.message.id);
    same(m.meta, posted.message.meta, 'read back with the row');
    const done = await W.admin.json('/api/contracts/MK-A2/messages/' + m.id, { method: 'PATCH', body: { done: true } });
    assert.equal(done.message.meta.done.by, 'Amina Otieno');
    assert.ok(done.message.meta.done.at);
    const undone = await W.admin.json('/api/contracts/MK-A2/messages/' + m.id, { method: 'PATCH', body: { done: false } });
    assert.equal(undone.message.meta.done, undefined);
    const nope = await W.admin.raw('/api/contracts/MK-A2/messages/999999', { method: 'PATCH', body: { done: true } });
    assert.equal(nope.status, 404);
    const scoped = await W.restricted.raw('/api/contracts/MK-B2/messages/' + m.id, { method: 'PATCH', body: { done: true } });
    assert.equal(scoped.status, 404, 'a contract out of scope is not found');
  });

  test('a message with no meta reads as null meta, never as a throw', async () => {
    const posted = await W.admin.json('/api/contracts/MK-A2/messages', { method: 'POST', body: { topic: 'general', body: 'Plain.' } });
    assert.equal(posted.message.meta, null);
  });
});
