/* ============================================================
   f264 — a note on one change, and Chat is where they are read
   ============================================================
   Owner-ruled 31 Aug 2026, in one message and then four answers:

     "When you finish your edit of a redline and you click either the send
      button from copilot or click the pencil indicating you are done after
      making a redline (only if redline has been done), a pop up window appears.
      You can then have options: Skip or Add Note & File. If you add note &
      file, this note is stored and can only be accessed by owner via the
      highlight in image 2 where if clicked, the pop up comes up again where you
      can edit or delete."

     "A,B,D go with your recommendation. As far as C, the note will be kept and
      accessed via image attached. Then means to access the notes in the side
      panel should have its own door called Chat which should be accessed via a
      symbol which should be where highlighted in image 2 between copilot and
      alerts."

   THE FOUR RULINGS, and each is a claim below.
     A — FILE FIRST, THEN ASK. The owner's own words were "Add Note & File"; on
         that reading a dialog dismissed by Escape, by the backdrop or by a
         closed tab loses a change somebody had finished writing. Filing first
         costs nothing — the note is additive and the door back to it stands for
         the life of the contract — and it means no press in that dialog can be
         the difference between a redline existing and not.
     B — THE PENCIL FILES, and only where there is something to file.
     C — THE NOTE IS KEPT ON THE CHANGE, as an ordinary message on its own
         thread: no new store, no new field on the change, no migration. The
         change's Notes row raises the same window; the side panel becomes Chat.
     D — ASKED ONCE, on the filing that created the change.

   AND ON 1 Sep 2026 THE OWNER RULED WHERE THE NOTE GOES, which is the biggest
   thing in this file and the reason several claims below are reversed in place:

     "Make them external so that when you suggest an edit, you give an
      explanation as to why you want to change the contract. That is the idea."

   So it is not a private aside — it is the sentence the other side reads beside
   the redline, which closes the loop the 28 Aug ruling opened when it removed
   the mandatory "why this change?" step. WHICH ROOM A NOTE IS IN AND WHETHER IT
   HAS REACHED ANYBODY ARE TWO DIFFERENT FACTS, and only the second decides
   whether its writer may still change it. The window itself was rebuilt to
   Option A of four drawn on the same day.

   WHAT IS DELIBERATELY OUT OF SCOPE, in the owner's own words: "The
   counterparty will also access the notes through the same processes but fixing
   this will come at a later stage when we begin working on how the counterparty
   page will look like." So their seat is asserted UNCHANGED rather than built.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEG = read('js/negotiation.js');
const VIEW = read('js/views/negotiation.js');
const CE = read('js/views/clauseeditor.js');
const APP = read('js/app.js');
const HTML = read('index.html');

const BODY =
  '<h1>Supply Agreement</h1><p>Between Mkataba Holdings Ltd and Saw Sawa Ltd</p>'
  + '<h2>Clause 6 · Payment terms</h2><p>Pay each invoice within thirty (30) days.</p>'
  + '<h2>Clause 7 · Liability</h2><p>Neither party is liable for indirect loss.</p>';

const ME = { id: 'u_me', name: 'Amina Yusuf', role: 'legal', email: 'amina@mk.co.ke' };
const MATE = { id: 'u_mate', name: 'Wanjiru Kamau', role: 'legal', email: 'w@mk.co.ke' };
const VIEWER = { id: 'u_vw', name: 'Peter Njoroge', role: 'viewer', email: 'p@mk.co.ke' };

const contract = () => ({ id: 'MK-N4', name: 'Supply Agreement',
  counterparty: 'Saw Sawa Ltd', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [],
  comments: [], value: 4800000, redlineText: BODY, format: 'rich' });

/* ONE BENCH, and it files a real change through the real funnel — the note acts
   read `ch.thread`, so a hand-built change object would be a fixture describing
   the code rather than exercising it. */
async function bench(user = ME){
  const w = buildWorld({ user, negotiationView: true, contractView: true,
    canEdit: user.role !== 'viewer' });
  w.win.getUsers = () => [ME, MATE, VIEWER];
  w.win.userById = id => [ME, MATE, VIEWER].find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  const c = contract();
  w.win.negoInit(c);
  const cl = w.win.negoClauseList(c).find(x => x.num === '6');
  const ch = await w.win.negoEditClause(c, cl.clauseId,
    '<p>Pay each invoice within forty-five (45) days.</p>', { side: 'owner' });
  w.win.state = Object.assign({}, w.win.state,
    { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  w.win.getContract = id => (String(id) === String(c.id) ? c : null);
  return { w, c, ch, cl };
}
const noteOf = (w, c, ch, text, o = {}) =>
  w.win.negoPostComment(c, ch.id, text,
    Object.assign({ side: 'owner', visibility: 'internal' }, o));

/* ============================================================
   1 — THE STORE IS THE THREAD, AND NOTHING ELSE IS ADDED
   ============================================================ */
describe('f264 (1) — a note is an ordinary internal message', () => {
  test('it lands on the change’s own thread and adds no field to the change', async () => {
    const p = await bench();
    const before = Object.keys(p.ch).sort().join('|');
    const m = noteOf(p.w, p.c, p.ch, 'Our fallback is thirty.');
    assert.ok(m, 'the note is filed');
    assert.equal(p.ch.thread.length, 1, 'onto ch.thread, which already existed');
    assert.equal(p.ch.thread[0].visibility, 'internal',
      'internal, which is negoPostComment’s own safe default');
    const after = Object.keys(p.ch).filter(k => k !== 'thread').sort().join('|');
    assert.equal(after, before.split('|').filter(k => k !== 'thread').join('|'),
      'NO NEW FIELD ON THE CHANGE — the whole point of keeping it on the thread '
      + 'is that every screen already reading a thread reads this for free, and '
      + 'there is nothing to migrate');
  });

  test('the writer’s id rides beside their name, and only for their own note', async () => {
    const p = await bench();
    const mine = noteOf(p.w, p.c, p.ch, 'Mine.');
    assert.equal(mine.byId, ME.id,
      'an id survives a rename; the name survives the account being deleted — '
      + 'the same pair a contract’s owner carries, for the same reason');
    assert.equal(mine.who, ME.name);
    /* A caller naming SOMEBODY ELSE gets no id: the counterparty's own seat
       passes their company name through this same door. */
    const theirs = noteOf(p.w, p.c, p.ch, 'Theirs.',
      { side: 'counterparty', author: 'Priya Nair · Saw Sawa Ltd' });
    assert.equal(theirs.byId, null);
  });

  test('a note filed before this existed still reads as its writer’s', async () => {
    const p = await bench();
    /* THE WHOLE MIGRATION STORY: `byId` is absent on everything already on
       file, so the reading falls back to the NAME — and must, or a workspace
       would wake up unable to edit any note it had ever written. */
    p.ch.thread = [{ who: ME.name, side: 'owner', visibility: 'internal',
      at: '2026-08-01T09:00:00.000Z', text: 'Filed before byId existed.' }];
    assert.equal(p.w.win.negoNoteIsMine(p.ch.thread[0]), true);
    assert.equal(p.w.win.negoMyNote(p.c, p.ch).text, 'Filed before byId existed.');
  });
});

/* ============================================================
   2 — WHOSE NOTE IT IS, AND THE THREE THINGS THAT REFUSE
   ============================================================ */
describe('f264 (2) — the acts are narrow, and each narrowing is a promise', () => {
  /* ---- REVERSED IN PLACE 1 Sep 2026, AND IT IS THE STRONGER CLAIM ----
     (owner-ruled: "Make them external so that when you suggest an edit, you
     give an explanation as to why you want to change the contract.")

     It refused any note marked SHARED. Every note the window writes is shared
     now, so that rule would have made the window's own note unchangeable the
     instant it was typed — including in a workspace where nothing was ever
     sent. WHICH ROOM A NOTE IS IN AND WHETHER IT HAS REACHED ANYBODY ARE TWO
     FACTS, and this product has learned three times over that they must not be
     one. `sentAt` is stamped by whatever succeeded in delivering it, and only a
     DELIVERED note is beyond its writer. */
  test('a note that has REACHED them cannot be changed or removed', async () => {
    const p = await bench();
    const sent = noteOf(p.w, p.c, p.ch, 'We can hold at thirty.', { visibility: 'shared' });
    sent.sentAt = '2026-09-01T08:00:00.000Z';
    assert.equal(p.w.win.negoNoteDelivered(sent), true);
    assert.equal(p.w.win.negoNoteIsMine(sent), false,
      'the other side holds a copy: rewriting our half would leave two records '
      + 'of one sentence disagreeing, and deleting it would take it off our '
      + 'screen while it stayed on theirs');
    assert.equal(p.w.win.negoEditNote(p.c, p.ch, sent, 'Changed.'), null);
    assert.equal(p.w.win.negoDeleteNote(p.c, p.ch, sent), false);
    assert.equal(sent.text, 'We can hold at thirty.', 'and nothing moved');
  });

  test('one that has NOT gone is still its writer’s, whichever room it is in', async () => {
    const p = await bench();
    const held = noteOf(p.w, p.c, p.ch, 'Draft explanation.', { visibility: 'shared' });
    assert.equal(p.w.win.negoNoteDelivered(held), false,
      'no stamp — outside API mode the channel carries nothing, and a note '
      + 'nobody has read is not one its writer may not correct');
    assert.ok(p.w.win.negoEditNote(p.c, p.ch, held, 'Corrected explanation.'));
    assert.equal(p.ch.thread[0].text, 'Corrected explanation.');
  });

  test('an older message carries no stamp, and that reads as NOT delivered', async () => {
    const p = await bench();
    /* THE SAFE DIRECTION: absent means editable, never "it reached somebody". */
    p.ch.thread = [{ who: ME.name, byId: ME.id, side: 'owner', visibility: 'shared',
      at: '2026-08-01T09:00:00.000Z', text: 'Filed before sentAt existed.' }];
    assert.equal(p.w.win.negoNoteDelivered(p.ch.thread[0]), false);
    assert.equal(p.w.win.negoNoteIsMine(p.ch.thread[0]), true);
  });

  test('a colleague’s note is a colleague’s — no admin exception', async () => {
    const p = await bench();
    const theirs = noteOf(p.w, p.c, p.ch, 'Wanjiru’s aside.',
      { author: MATE.name });
    assert.equal(p.w.win.negoNoteIsMine(theirs), false);
    assert.equal(p.w.win.negoEditNote(p.c, p.ch, theirs, 'No.'), null);
    assert.equal(p.w.win.negoDeleteNote(p.c, p.ch, theirs), false);
    assert.equal(theirs.text, 'Wanjiru’s aside.');
  });

  test('a note from THEIR side is never ours to touch', async () => {
    const p = await bench();
    const cp = noteOf(p.w, p.c, p.ch, 'From them.',
      { side: 'counterparty', author: 'Priya Nair' });
    assert.equal(p.w.win.negoNoteIsMine(cp), false);
    assert.equal(p.w.win.negoDeleteNote(p.c, p.ch, cp), false);
  });

  test('editing replaces the words, re-stamps the hash and writes a line', async () => {
    const p = await bench();
    const m = noteOf(p.w, p.c, p.ch, 'Thirty is our fallback.');
    const lines = p.c.audit.length;
    const out = p.w.win.negoEditNote(p.c, p.ch, m, 'Thirty-five is our fallback.');
    assert.equal(out.text, 'Thirty-five is our fallback.');
    assert.equal(out.atHash, p.ch.hash,
      'WRITTEN NOW, so it is stamped now: leaving yesterday’s hash on '
      + 'today’s sentence would have the thread announce it as "written '
      + 'against an earlier revision" when it was not');
    assert.ok(out.editedAt, 'and it records that it was changed');
    assert.ok(p.c.audit.length > lines,
      'the thread is still a record — an edit leaves a trail even though the '
      + 'sentence itself does not');
  });

  test('removing takes it off the thread and writes a line', async () => {
    const p = await bench();
    const m = noteOf(p.w, p.c, p.ch, 'Gone in a moment.');
    const lines = p.c.audit.length;
    assert.equal(p.w.win.negoDeleteNote(p.c, p.ch, m), true);
    assert.equal(p.ch.thread.length, 0);
    assert.ok(p.c.audit.length > lines);
  });

  test('an emptied note is a removed note, not a blank one', async () => {
    const p = await bench();
    const m = noteOf(p.w, p.c, p.ch, 'Something.');
    p.w.win.negoEditNote(p.c, p.ch, m, '   ');
    assert.equal(p.ch.thread.length, 0,
      'a thread row holding an empty string is furniture with a name on it');
  });

  test('the newest of your own notes is the one the dialog opens on', async () => {
    const p = await bench();
    noteOf(p.w, p.c, p.ch, 'First thought.');
    noteOf(p.w, p.c, p.ch, 'Second thought.');
    noteOf(p.w, p.c, p.ch, 'Not mine.', { author: MATE.name });
    assert.equal(p.w.win.negoMyNote(p.c, p.ch).text, 'Second thought.');
  });

  test('a caller holding a COPY of the message still edits the right one', async () => {
    const p = await bench();
    const m = noteOf(p.w, p.c, p.ch, 'The original object.');
    /* The merged thread hands back rebuilt objects for the channel's half, and
       a repaint can put a copy in a caller's hand. Identity first, content
       second — never content only, which would match the wrong twin. */
    const copy = Object.assign({}, m);
    assert.ok(p.w.win.negoEditNote(p.c, p.ch, copy, 'Edited through a copy.'));
    assert.equal(p.ch.thread[0].text, 'Edited through a copy.');
  });

  test('a message that is not on this thread at all is refused', async () => {
    const p = await bench();
    assert.equal(p.w.win.negoEditNote(p.c, p.ch,
      { who: ME.name, side: 'owner', visibility: 'internal', text: 'Nowhere.' }, 'x'), null);
    assert.equal(p.ch.thread.length, 0);
  });
});

/* ============================================================
   3 — IT NEVER TRAVELS
   ============================================================ */
describe('f264 (3) — the note stays inside this organisation', () => {
  test('the share payload carries no thread', async () => {
    const p = await bench();
    noteOf(p.w, p.c, p.ch, 'Our fallback is thirty — do not send this.');
    const pay = p.w.win.buildSharePayload
      ? p.w.win.buildSharePayload(p.c, { purpose: 'negotiate' }) : null;
    if (!pay) return;   /* the stage does not build one; the grep below stands */
    const s = JSON.stringify(pay);
    assert.equal(/do not send this/.test(s), false,
      'ch.thread is not in the share payload and never has been — an internal '
      + 'note reaches nobody by simply not being posted, which is a stronger '
      + 'guarantee than any filter');
  });
});

/* ============================================================
   4 — ASKED ONCE, ON THE FILING THAT CREATED THE CHANGE (D)
   ============================================================ */
describe('f264 (4) — the ask is one reading of the record', () => {
  test('a brand-new change is asked; a revision of it is not', async () => {
    const p = await bench();
    let opened = 0;
    p.w.win.openChangeNoteDialog = () => { opened++; return Promise.resolve(null); };
    await p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    assert.equal(opened, 1, 'revisions[] is empty, so this press created it');
    /* THE READING IS THE RECORD'S OWN AND NEEDS NOTHING THREADED THROUGH IT:
       negoFileChange pushes the previous wording onto revisions[] every time it
       folds a second edit into a pending ask. */
    const cl = p.w.win.negoClauseList(p.c).find(x => x.num === '6');
    await p.w.win.negoEditClause(p.c, cl.clauseId,
      '<p>Pay each invoice within sixty (60) days.</p>', { side: 'owner' });
    assert.ok((p.ch.revisions || []).length, 'the fold really happened');
    await p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    assert.equal(opened, 1, 'and a revision files silently');
  });

  test('their seat is never asked, and that is where the note would live', async () => {
    const p = await bench();
    let opened = 0;
    p.w.win.openChangeNoteDialog = () => { opened++; return Promise.resolve(null); };
    await p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'counterparty' });
    assert.equal(opened, 0,
      'their page is rebuilt from a share payload and thrown away on the next '
      + 'repaint, so a note written there would be typed and lost');
  });

  test('a reader who may not write is not asked to', async () => {
    const p = await bench(VIEWER);
    let opened = 0;
    p.w.win.openChangeNoteDialog = () => { opened++; return Promise.resolve(null); };
    await p.w.win.rlNoteAskAfterFile(p.c, p.ch, { side: 'owner' });
    assert.equal(opened, 0);
  });

  test('both filing doors go through the one reading', () => {
    assert.match(VIEW, /rlNoteAskAfterFile\(c, ch, \{ side, author: opts\.by/,
      'the engine’s own inline editor, inside fileAndRepaint — the ONE '
      + 'filing wrapper on that page, so the edit, the insert and the delete '
      + 'all inherit it');
    assert.match(CE, /rlNoteAskAfterFile\(c, ch, \{ side: 'owner'/,
      'and the clause editor page');
    assert.equal((VIEW.match(/openChangeNoteDialog\(c, ch, \{ \.\.\.opts, filed: true \}\)/g) || []).length, 1,
      'ONE place decides whether to ask, so two doors cannot come to disagree '
      + 'about when the question is put');
  });

  test('the ask comes AFTER the filing, the persist and the repaint', () => {
    const fn = VIEW.match(/const fileAndRepaint = async[\s\S]*?\n  \};/)[0];
    const persisted = fn.indexOf('persist(c)');
    const asked = fn.indexOf('rlNoteAskAfterFile');
    assert.ok(persisted > -1 && asked > persisted,
      'the change exists on the record before the dialog is drawn, so nothing '
      + 'a reader does with the dialog can be the difference between a redline '
      + 'existing and not');
  });

  test('the toast stands down where the dialog opens', () => {
    assert.match(CE, /if \(!_noteAsk && window\.toast\) toast\(_cet\('ce_filed'/,
      'the dialog’s lead begins "Filed." and its heading names the change, '
      + 'so two boxes twelve pixels apart saying one thing is exactly the '
      + 'furniture this rulebook keeps warning about');
  });
});

/* ============================================================
   5 — ONE DIALOG, TWO SHAPES
   ============================================================ */
describe('f264 (5) — the dialog reads the record for its shape', () => {
  const dlg = (p, mine, opts = {}) =>
    p.w.win.rlNoteDialogHtml(p.c, p.ch, mine, Object.assign({ side: 'owner' }, opts));

  /* REVERSED IN PLACE 1 Sep 2026 — Option A, chosen off four drawn windows.
     The FILING is the headline now ("CHG-004 filed", with the tick this product
     uses for something that has just gone right) and the lead is the ask. */
  test('no note yet: the filing leads, and the way out says Skip', async () => {
    const p = await bench();
    const h = dlg(p, null, { filed: true });
    assert.match(h, /ng_note_add|Add note/);
    assert.equal(/ng_note_delete|>Delete</.test(h), false,
      'Delete draws only where there is something of yours to delete');
    assert.match(h, new RegExp(`${p.ch.id} filed`),
      'the act is the headline and the note is the small thing under it');
    assert.match(h, /class="tick"/, 'in the tone for something that went right');
    assert.match(h, /Skip/);
  });

  test('a note of yours: Save and Delete, and the way out says Close', async () => {
    const p = await bench();
    const m = noteOf(p.w, p.c, p.ch, 'Thirty is our fallback.');
    const h = dlg(p, m);
    assert.match(h, /ng_note_save|>Save</);
    assert.match(h, /rl-note-del/);
    assert.match(h, /Thirty is our fallback\./, 'prefilled with what you wrote');
    assert.equal(/Filed\./.test(h), false,
      'it did not arrive by itself, so it does not claim to have just filed');
  });

  test('it names the change in its heading', async () => {
    const p = await bench();
    assert.match(dlg(p, null, { filed: true }), new RegExp(p.ch.id),
      'the owner’s own example was "Note on CHG-004"');
  });

  /* REVERSED IN PLACE 1 Sep 2026. It pinned "stays inside", which was true
     while the note was private; the owner has ruled it is the explanation the
     other side reads, so the window has to say THAT — and a lock over a note
     that travels would be the worst kind of wrong. */
  test('it names who reads it, on the face, before anything is typed', async () => {
    const p = await bench();
    const h = dlg(p, null, { filed: true });
    assert.match(h, /rl-note-who/);
    assert.match(h, /Saw Sawa Ltd/, 'the counterparty by name');
    assert.equal(/rl-note-keep|never sees/.test(h), false,
      'and no promise of privacy over something that goes to them');
  });

  /* REVERSED IN PLACE 1 Sep 2026. It pinned a COUNT of the other notes and a
     door to Chat. The window prints them now, above the box — the fact on
     screen rather than counted and pointed at — which is what that claim was
     really about: a reader whose colleagues have written three must not open an
     empty box and be told nothing. */
  test('what has already been said is printed above the box', async () => {
    const p = await bench();
    noteOf(p.w, p.c, p.ch, 'Wanjiru’s aside.', { author: MATE.name });
    noteOf(p.w, p.c, p.ch, 'And another.', { author: MATE.name });
    const h = dlg(p, null);
    assert.match(h, /rl-note-past/);
    assert.match(h, /Wanjiru/);
    assert.match(h, /And another/);
    const mine = noteOf(p.w, p.c, p.ch, 'Mine.');
    const h2 = dlg(p, mine);
    assert.match(h2, /Wanjiru/, 'the others are still there');
    assert.equal((h2.match(/Mine\./g) || []).length, 1,
      'and the one IN the box is not printed above it as well');
  });

  test('with nothing else on the change there is no record block at all', async () => {
    const p = await bench();
    assert.equal(/rl-note-past/.test(dlg(p, null, { filed: true })), false);
  });

  test('a viewer reads it and writes nothing', async () => {
    const p = await bench(VIEWER);
    const h = dlg(p, null);
    assert.equal(/rl-note-in/.test(h), false, 'no box');
    assert.equal(/rl-note-ok/.test(h), false, 'no verb');
    assert.match(h, /rl-np-no/,
      'and the refusal is the sentence the Document tab’s own discussion '
      + 'has printed for viewers since long before this dialog');
  });

  test('it writes a note and nothing else — no second filing path', () => {
    const one = VIEW.match(/function openChangeNoteDialog[\s\S]*?\n\}\n/)[0];
    for (const bad of ['negoFileChange(', 'negoEditClause(', 'negoResolve(',
      'changes.push', 'negoReviseInsert(']){
      assert.equal(one.includes(bad), false,
        `the dialog must not touch the change itself: found ${bad}`);
    }
    assert.match(one, /negoPostComment\(/, 'the one writer');
    assert.match(one, /negoEditNote\(/);
    assert.match(one, /negoDeleteNote\(/);
  });
});

/* ============================================================
   6 — THE PENCIL FILES (B)
   ============================================================ */
describe('f264 (6) — the gesture that means done, means done', () => {
  test('one reading answers for the pencil and for the File button', () => {
    assert.match(CE, /const ceCanFile = \(\) => \(_ceText !== _ceBase \|\| _ceHead !== _ceHeadBase\) && clauseEditorDirty\(\);/,
      'the two questions joined: the wording has moved from what STANDS, and '
      + 'there is something the RECORD does not already hold');
    assert.match(CE, /const anyToFile = ceCanFile\(\);/, 'the foot asks it');
    assert.match(CE, /if \(_ceEditing && ceCanFile\(\)\)\{/,
      'and so does the pencil, so a pencil that files where the button is dead '
      + 'is not a thing that can happen');
  });

  test('typing goes off only after the record moves', () => {
    const branch = CE.match(/const pencil = hit\('\[data-ce-pencil\]'\);[\s\S]*?\n      return; \}/)[0];
    assert.match(branch, /Promise\.resolve\(ceFile\(\)\)\.then\(ch => \{\s*\n\s*if \(!ch\) return;\s*\n\s*_ceEditing = false;/,
      'turning the box read-only over wording the funnel has just REFUSED would '
      + 'hide the reader’s own work behind a page drawing the marks of a '
      + 'change that does not exist');
  });

  test('ceFile answers whether it filed, on every path', () => {
    const fn = CE.match(/async function ceFile\([\s\S]*?\n\}\n/)[0];
    /* Its OWN returns — two-space indent — not the ones inside the callbacks
       it registers, which answer for themselves. */
    assert.equal((fn.match(/\n  \s*return;\s*\n/g) || []).length, 0,
      'every early exit says null rather than nothing, or the pencil cannot '
      + 'tell a refusal from a success');
    assert.match(fn, /\n  return ch;\n\}/);
  });

  test('a clause only READ still toggles, exactly as it always did', () => {
    const branch = CE.match(/const pencil = hit\('\[data-ce-pencil\]'\);[\s\S]*?\n      return; \}/)[0];
    assert.match(branch, /_ceEditing = !_ceEditing;/,
      'the plain toggle is still there, below the branch, for the case where '
      + 'there is nothing to file');
  });

  test('filing keeps typing on everywhere else — the 30 Aug rule is untouched', () => {
    assert.match(CE, /keepView: true/,
      'the strip’s cut still leaves the reader writing');
    const fn = CE.match(/async function ceFile\([\s\S]*?\n\}\n/)[0];
    assert.equal(/_ceEditing = false/.test(fn), false,
      'and ceFile itself never turns typing off — only the one gesture that '
      + 'asks for the opposite does');
  });
});

/* ============================================================
   7 — THE NOTES ROW RAISES THE DIALOG (C)
   ============================================================ */
describe('f264 (7) — one window for writing a note and one for reading it back', () => {
  test('our seat opens the dialog, not the drawer', () => {
    const wired = VIEW.match(/document\._rlNotesWired[\s\S]*?\n\}\n/)[0];
    assert.match(wired, /openChangeNoteDialog\(c, ch,/);
    assert.match(wired, /const portal = !!\(window\.PORTAL_MODE && PORTAL_MODE\(\)\);/,
      'their seat is told apart explicitly rather than by whether a lookup '
      + 'happened to fail');
    assert.match(wired, /if \(window\.openNotesPanel\) openNotesPanel\(cid, id\);/,
      'and their press falls through to exactly what it did before — the '
      + 'owner’s own next sentence was that their access comes later');
  });

  test('the door is still one delegated listener armed at module load', () => {
    assert.equal((VIEW.match(/document\._rlNotesWired = true;/g) || []).length, 1);
    assert.equal((VIEW.match(/\[data-rl-notes\]'\)/g) || []).length, 1,
      'three surfaces press it — the row’s count, the ⋯ menu and the '
      + 'clause panel — and one listener finds all three');
  });
});

/* ============================================================
   8 — CHAT
   ============================================================ */
describe('f264 (8) — Chat is the whole contract’s conversation', () => {
  test('it borrows every reading and counts nothing of its own', async () => {
    const p = await bench();
    const cl7 = p.w.win.negoClauseList(p.c).find(x => x.num === '7');
    const ch7 = await p.w.win.negoEditClause(p.c, cl7.clauseId,
      '<p>Neither party is liable for indirect or consequential loss.</p>',
      { side: 'owner' });
    noteOf(p.w, p.c, p.ch, 'On the payment clause.');
    noteOf(p.w, p.c, ch7, 'On the liability clause.');
    const rows = p.w.win.rlChatRows(p.c, { side: 'owner' });
    assert.equal(rows.length, 2);
    assert.equal(rows[0].ch.id, p.ch.id);
    assert.equal(rows[1].ch.id, ch7.id);
    const fn = VIEW.match(/function rlChatRows\([\s\S]*?\n\}/)[0];
    assert.match(fn, /negoRoomNotes\(/,
      'the one reading of what a seat may see and which room a note is in');
  });

  test('oldest last, so it reads in the order it happened', async () => {
    const p = await bench();
    p.ch.thread = [
      { who: ME.name, byId: ME.id, side: 'owner', visibility: 'internal',
        at: '2026-08-20T10:00:00.000Z', text: 'Later.' },
      { who: ME.name, byId: ME.id, side: 'owner', visibility: 'internal',
        at: '2026-08-19T10:00:00.000Z', text: 'Earlier.' }];
    const rows = p.w.win.rlChatRows(p.c, { side: 'owner' });
    assert.equal(rows[0].m.text, 'Earlier.');
    assert.equal(rows[1].m.text, 'Later.');
  });

  test('both rooms in one list, each row saying which', async () => {
    const p = await bench();
    noteOf(p.w, p.c, p.ch, 'Kept here.');
    noteOf(p.w, p.c, p.ch, 'Sent across.', { visibility: 'shared' });
    const h = p.w.win.rlChatPanelHtml(p.c, { side: 'owner' });
    assert.match(h, /ng_np_tab_int|Internal/);
    assert.match(h, /ng_np_tab_ext|External/,
      'this is where you READ, and a reader catching up wants the conversation '
      + 'in the order it happened rather than in two halves');
    assert.match(h, new RegExp(`data-rl-notes="${p.ch.id}"`),
      'and each row is a door onto that change’s own note');
  });

  test('THE REFERENCE IS THE REFERENCE, and nothing round it', () => {
    /* Owner-reported 1 Sep 2026, off a screenshot with two of them ringed:
       "should simply say CHG-00X and they should never wrap text." "On CHG-001"
       spent two of the row's scarcest characters on a word saying nothing the
       row's own shape does not — the reference sits above the note it belongs
       to, so what it is ON is already on screen. */
    const fn = VIEW.match(/function rlChatPanelHtml\([\s\S]*?\n\}/)[0]
      .replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/ng_chat_on/.test(fn),
      'the wrapper word is gone; ng_chat_on is STALE and inert in both dictionaries');
    assert.match(fn, /<span class="id">\$\{_ne\(ch\.id\)\}<\/span>/,
      'the id and nothing else');
    /* AND IT MAY NOT WRAP. flex:none is what makes that a GUARANTEE rather than
       a measurement: no panel width can break it across two lines. The clause
       name beside it is the one that gives, and it already elides. */
    const css = read('index.html');
    const rule = css.match(/\.rl-chat-on \.id\{[\s\S]*?\}/)[0];
    assert.match(rule, /flex:none/, 'it is never squeezed');
    assert.match(rule, /white-space:nowrap/, 'and never broken');
  });

  /* ---- REVERSED IN PLACE 2 Sep 2026 (owner-asked) ----
     It pinned that Chat drew NO composer, on the reasoning that a box here
     would be a second one with no change to attach to. THE REASONING WAS RIGHT
     ABOUT THE STORE AND WRONG ABOUT THE NEED: the owner asked for notes
     "unrelated to a redline", so what was missing was not a second box but a
     second HOME. The contract has its own thread now — negoNoteHome answers it
     — and the composer is the per-change panel's own foot, character for
     character, because two composers dressed two ways for one conversation is
     what reverting this panel to the panel's clothes was for.

     "THIS PRODUCT'S OWN BOX, NOT A SECOND ONE" IS THE CLAIM NOW, and it is the
     stronger form: it fails if Chat ever grows a composer of its own design. */
  test('THE BOX IS BACK, and it is the panel\'s own', () => {
    const fn = VIEW.match(/function rlChatPanelHtml\([\s\S]*?\n\}/)[0];
    assert.match(fn, /class="chat-field rl-np-in"/,
      'the same textarea class the per-change panel writes');
    assert.match(fn, /rlNpTagMenuHtml\(c, room, opts\)/,
      'and the same tag picker — one function, both composers');
    assert.match(fn, /data-rl-chat-send/,
      'its own send attribute, because it carries no change id');
    assert.match(fn, /notesMayWrite\(c, opts\)/,
      'and a viewer is refused by the product\'s own reading, in the panel\'s '
      + 'own words');
  });

  test('and it writes on the CONTRACT, through the one writer', () => {
    /* negoPostComment is still the only thing that files a note. What is new is
       that an absent change id names the contract rather than failing to
       resolve — see negoNoteHome. */
    const send = VIEW.match(/async function rlNotesSend\([\s\S]*?\n\}/)[0];
    assert.match(send, /negoPostComment\(c, ch \? ch\.id : null, text, \{/,
      'one send, two scopes, and no second filing path');
    const model = read('js/negotiation.js');
    assert.match(model, /function negoNoteHome\(c, ch\)\{/,
      'the one reading of where a note lives');
    assert.match(model, /const onContract = \(id == null \|\| id === ''\);/,
      'an absent id means the contract; an id we cannot resolve is still refused');
    /* AND IT IS A NEW STORE ON THE RECORD, absent everywhere until something is
       written — so nothing already on file reads differently. */
    assert.match(model, /if \(!Array\.isArray\(host\.thread\)\) host\.thread = \[\];/,
      'minted on first use, never on read');
  });

  test('an external note on the contract joins the general topic, not a new one', () => {
    /* The Document tab's discussion has posted a general comment under
       DISCUSS_GENERAL since long before this panel. ONE conversation about the
       contract, read from two screens, is the reason to reuse it. */
    const model = read('js/negotiation.js');
    assert.match(model, /const negoTopicFor = ch => ch \? \('change:' \+ ch\.id\) : \(window\.DISCUSS_GENERAL \|\| 'general'\);/,
      'the contract\'s topic is the product\'s own general topic');
    const ch = VIEW.match(/async function negoPostToChannel\([\s\S]*?\n\}/)[0];
    assert.ok(!/\|\| !ch \|\|/.test(ch),
      'and the channel no longer refuses a post that names no change');
  });

  test('an empty contract says so, and no contract says something else', async () => {
    const p = await bench();
    assert.match(p.w.win.rlChatPanelHtml(p.c, { side: 'owner' }), /ng_chat_empty|Nothing has been written/);
    assert.match(p.w.win.rlChatPanelHtml(null), /ng_chat_none|Open a contract/);
  });
});

/* ============================================================
   9 — THE DOOR IN THE SHELL BAR
   ============================================================ */
describe('f264 (9) — the door, and where it is dead', () => {
  test('it sits between Copilot and the bell, as asked', () => {
    const ai = HTML.indexOf('id="cmd-ai"');
    const chat = HTML.indexOf('id="hdr-chat"');
    const bell = HTML.indexOf('id="hdr-notify"');
    assert.ok(ai > -1 && chat > -1 && bell > -1, 'all three are drawn');
    assert.ok(ai < chat && chat < bell,
      'the owner ringed the gap between copilot and alerts');
  });

  test('its symbol is one the sprite actually carries', () => {
    const btn = HTML.match(/<button id="hdr-chat"[\s\S]*?<\/button>/)[0];
    const sym = btn.match(/href="#(i-[a-z-]+)"/)[1];
    assert.match(HTML, new RegExp(`<symbol id="${sym}"`),
      'a <use> pointing at a symbol that does not exist renders an EMPTY BOX — '
      + 'no error, no warning, a button with a hole in it');
  });

  test('which contract it opens is named once', () => {
    assert.match(APP, /function chatContractId\(\)\{[\s\S]*?redlineHeldId\(\)[\s\S]*?state\.activeId/,
      'the contract the negotiation page is actually PAINTING first — '
      + 'redlineHeldId is recorded on the paint — then whatever was last '
      + 'opened anywhere');
  });

  test('it presses the one door onto the notes face', () => {
    assert.match(APP, /getElementById\('hdr-chat'\)\?\.addEventListener\('click',\(\)=>\{\s*\n\s*const id=chatContractId\(\); if\(id\) openNotesPanel\(id\);/,
      'openNotesPanel is the one door onto that face; this is the press '
      + 'arriving there, never a second way of putting the panel up');
  });

  test('the change is optional, and a contract is not', () => {
    assert.match(APP, /function openNotesPanel\(contractId, changeId\)\{\s*\n\s*if\(!contractId\) return;/);
    assert.match(APP, /changeId: changeId==null\?null:String\(changeId\)/);
    assert.match(APP, /if\(c&&!nf\.changeId&&window\.rlChatPanelPaint\)\{ rlChatPanelPaint/,
      'no change named is the whole contract, not an error');
  });

  test('the heading says which scope it is showing', () => {
    assert.match(APP, /const _chat=notes&&!\(\(state\.notesFor\|\|\{\}\)\.changeId\);/);
    assert.match(APP, /_chat\?i18t\('ng_chat'\)/,
      'Chat is the contract’s whole conversation and Notes is one '
      + 'change’s thread — a reader who cannot tell them apart is a reader '
      + 'who will believe the wrong one');
  });

  test('it is dead where pressing it would do nothing, with the reason on its hover', () => {
    const fn = APP.match(/function paintChatDoor\(\)\{[\s\S]*?\n\}/)[0];
    /* REVERSED IN PLACE 2 Sep 2026 (owner-asked: "the sliding panels should not
       be hidden or muted when in the editor page"). This pinned the SECOND dead
       state — the clause editor covering the page — and that state is gone
       rather than merely unreachable: the page sits under both slide-overs now,
       so the press works there. ng_chat_not_here went with it. */
    assert.ok(!/clauseEditorOpen/.test(fn),
      'no layer can make this door dead any more');
    assert.match(fn, /const dead=!id;/,
      'ONE dead state, and it is about whether there is a conversation at all');
    assert.match(fn, /btn\.disabled=dead;/,
      'disabled, so the browser itself declines and a keyboard reader is told');
    /* RE-POINTED 2 Sep 2026: this pinned the whole ternary as a literal, and a
       FOURTH fact joined it (somebody has named you). What the claim was always
       about is that each fact gets its own sentence rather than one shrug, so
       that is what it asks — the relation, not the expression. */
    ['ng_chat_none', 'ng_chat_title', 'ng_chat_at_n'].forEach(k => {
      assert.ok(fn.includes("'" + k + "'"), k + ' has a sentence of its own');
    });
  });

  /* ---- AND THE MARK (owner-asked 2 Sep 2026) ---- */
  test('the door carries a mark when somebody has named you', () => {
    const fn = APP.match(/function paintChatDoor\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /window\.negoMentionsWaiting/,
      'the count is the notes module\u2019s own reading, asked through window');
    assert.match(fn, /dot\.hidden=!n;/,
      'hidden at zero and nowhere else \u2014 a shut door is not an empty inbox');
    const NEG = read('js/views/negotiation.js');
    const wait = NEG.match(/function negoMentionsWaiting\(c, opts = \{\}\)\{[\s\S]*?\n\}/)[0];
    assert.ok(!/negoChanges\(/.test(wait),
      'it reads c.changes RAW \u2014 negoChanges runs negoInit, and a badge that '
      + 'started a negotiation merely by counting is the recorded trap');
    assert.match(wait, /negoThreadSeenAt/,
      'and it is the panel\u2019s own per-browser seen store, not a second one');
    assert.match(NEG, /negoMarkChatSeen\(c, opts\);/,
      'opening Chat clears it');
  });

  /* RE-POINTED 1 Sep 2026, claim intact. The editor paints this door on both
     sides and always did; what changed is that it paints all THREE through one
     call, because the bell and Activity gained the same dead state. */
  test('the editor paints it on the way in AND on the way out', () => {
    assert.equal((CE.match(/if \(window\.paintShellDoors\) paintShellDoors\(\)/g) || []).length, 2,
      'both halves together, or the doors stay dead for the rest of the sitting');
    assert.match(APP, /try\{ paintChatDoor\(\); \}catch\(_\)\{\}\s*\n  const dot=/,
      'and on the same beat the bell is painted — every view change and '
      + 'every save');
  });

  /* ---- REVERSED IN PLACE AGAIN, 2 Sep 2026 (owner-asked: "the sliding panels
     should not be hidden or muted when in the editor page") ----
     THE COLLISION IS GONE RATHER THAN SHARED. On 1 Sep all three doors were
     greyed on the clause editor, through one predicate, because a panel opened
     at 46 behind a page at 54. The remedy has moved to the other side of that
     same collision: the PAGE sits under both slide-overs now, so every door is
     live there and there is nothing to grey.

     WHAT THE CLAIM IS REALLY ABOUT SURVIVES and is what is pinned — no door
     carries a private copy of a layer rule, and the Chat door's own dead state
     is the one that has nothing to do with layers. */
  test('no door is dead for a layer reason — the editor sits under the panels', () => {
    const fn = APP.slice(APP.indexOf('function panelSuppressed()'),
      APP.indexOf('function chatContractId'));
    assert.match(fn, /return false;/, 'nothing refuses the layer');
    const chat = APP.slice(APP.indexOf('function paintChatDoor'));
    const body = chat.slice(0, chat.indexOf('\n}'));
    assert.ok(!/clauseEditorOpen/.test(body),
      'and the Chat door no longer greys itself for one');
    assert.match(body, /const dead=!id;/,
      'its one dead state is the one about a conversation, not about a layer');
    const CE = read('js/views/clauseeditor.js');
    assert.match(CE, /#clause-editor\{position:fixed; inset:0; z-index:38;/,
      'the page is UNDER #panel-scrim 45, #context-panel 46 and #ai-panel 50');
  });
});

/* ============================================================
   10 — BOTH LANGUAGES
   ============================================================ */
describe('f264 (10) — every new sentence is written twice', () => {
  test('the dictionary carries the note and Chat wording in EN and SV', () => {
    const I18N = read('js/i18n.js');
    const keys = ['ng_note_head', 'ng_note_filed_lead', 'ng_note_keep_lead',
      'ng_note_ph', 'ng_note_skip', 'ng_note_add', 'ng_note_save',
      'ng_note_delete', 'ng_note_added', 'ng_note_updated', 'ng_note_removed',
      'ng_note_sent', 'ng_note_not_yours', 'ng_note_others_one',
      'ng_note_others_other', 'ng_note_open_chat', 'ng_note_delete_title',
      'ng_note_delete_msg', 'ng_chat', 'ng_chat_title', 'ng_chat_none',
      'ng_chat_lead', 'ng_chat_empty', 'ng_chat_on', 'ng_chat_not_here'];
    for (const k of keys){
      const n = (I18N.match(new RegExp(`^\\s{4}${k}:`, 'gm')) || []).length;
      assert.equal(n, 2, `${k} is written once in each dictionary, not ${n} times`);
    }
  });

  test('the two refusals are dictionary keys, not English written into the model', () => {
    assert.match(NEG, /toast\(i18t\('ng_note_sent'\), 'err'\)/);
    assert.match(NEG, /toast\(i18t\('ng_note_not_yours'\), 'err'\)/);
  });
});
