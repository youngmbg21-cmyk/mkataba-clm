/* ============================================================
   f443 — A NOTE CAN BE GIVEN TO A COLLEAGUE (Young asked 3 Oct 2026)
   ============================================================
   "Build idea number 16" — from the teamwork review: *any note can be given
   to a named colleague, with a date; it then appears on their list of what is
   waiting on them, and leaves it when the note is marked done.*

   THE CLAIMS:
     1  `given` is {id, name, due}, absent until somebody gives the note, and
        negoNoteGive is the ONE writer — taking it back removes the field
     2  negoNoteForMe asks the id first and the name second
     3  negoNotesForMe reads the record RAW: counting what is waiting on you
        must not create a thread or a negotiation, and a done note is waiting
        on nobody
     4  THE WALL — `given` is not on the server's msgMeta allow-list and not in
        the share payload, so it cannot reach the other side. This is a
        not-doing: the test fails if a later hand adds it to either.
     5  the drawer draws the chip and the button, BOTH carrying
        data-rl-np-give, and neither on the counterparty's seat
     6  the three homes that say what is waiting on you know the kind, and the
        door opens the drawer the note lives in
     7  every word is in both books

   Run: node --test test/f443-a-note-can-be-given.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEGO = read('js/negotiation.js');
const VIEW = read('js/views/negotiation.js');
const HOME = read('js/views/home.js');
const INSP = read('js/views/inspector.js');
const APP = read('js/app.js');
const I18N = read('js/i18n.js');
const SERVER = read('server/server.js');
const CORE = read('js/core.js');

const ME = { id: 'u_me', name: 'Amina Yusuf', role: 'legal', email: 'amina@mk.co.ke' };
const MATE = { id: 'u_mate', name: 'Wanjiru Kamau', role: 'legal', email: 'w@mk.co.ke' };
const contract = () => ({ id: 'MK-443', name: 'Supply Agreement', counterparty: 'Saw Sawa Ltd',
  status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [],
  versions: [], signatures: [], comments: [], value: 4800000 });

function bench(user = ME){
  const w = buildWorld({ user, negotiationView: true, canEdit: true });
  w.win.getUsers = () => [ME, MATE];
  w.win.userById = id => [ME, MATE].find(u => u.id === id) || null;
  w.win.persist = () => {};
  return w;
}

describe('f443 (1) given is one field with one writer', () => {
  test('absent until given, read back whole, and removed when taken back', () => {
    const w = bench(); const c = contract();
    const note = w.win.negoPostComment(c, null, 'Does our insurance cover 150%?');
    assert.ok(note, 'the note was posted');
    assert.equal(note.given, undefined, 'a fresh note is with nobody');
    assert.equal(w.win.negoNoteGiven(note), null, 'and the reading says so');

    w.win.negoNoteGive(c, null, note, { id: MATE.id, name: MATE.name }, '2026-10-09');
    const g = w.win.negoNoteGiven(note);
    /* Field by field: the object is built inside the harness's own realm, so a
       whole-object compare fails on the prototype rather than the facts. */
    assert.equal(g.id, MATE.id); assert.equal(g.name, MATE.name); assert.equal(g.due, '2026-10-09');

    w.win.negoNoteGive(c, null, note, null, '');
    assert.equal(note.given, undefined, 'taken back removes the field, never leaves an empty one');
    assert.equal(w.win.negoNoteGiven(note), null);
  });

  test('a day that is not a day is refused rather than stored', () => {
    const w = bench(); const c = contract();
    const note = w.win.negoPostComment(c, null, 'Check the cap.');
    w.win.negoNoteGive(c, null, note, { id: MATE.id, name: MATE.name }, 'next Friday');
    assert.equal(w.win.negoNoteGiven(note).due, null, 'a typed phrase is not a date');
    assert.equal(note.given.due, undefined, 'and nothing was written');
  });

  test('a note with no name on it cannot be given', () => {
    const w = bench(); const c = contract();
    const note = w.win.negoPostComment(c, null, 'Check the cap.');
    w.win.negoNoteGive(c, null, note, { id: 'u_ghost', name: '   ' }, '');
    assert.equal(note.given, undefined, 'a blank name takes the note back rather than storing one');
  });

  test('it writes an audit line, and the contract itself is untouched', () => {
    const w = bench(); const c = contract();
    const note = w.win.negoPostComment(c, null, 'Check the cap.');
    const before = JSON.stringify({ changes: c.changes || null, status: c.status, value: c.value });
    w.win.negoNoteGive(c, null, note, { id: MATE.id, name: MATE.name }, '');
    const line = (c.audit || []).map(a => String(a.detail || a.text || a)).join(' | ');
    assert.match(line, /given to Wanjiru Kamau/i, 'the trail says who has it');
    assert.match(line, /contract is unchanged/i, 'and that nothing else moved');
    assert.equal(JSON.stringify({ changes: c.changes || null, status: c.status, value: c.value }), before);
  });
});

describe('f443 (2) whose note it is', () => {
  test('the id answers first, the name second', () => {
    const w = bench(); const c = contract();
    const a = w.win.negoPostComment(c, null, 'one');
    w.win.negoNoteGive(c, null, a, { id: ME.id, name: 'Someone Else' }, '');
    assert.equal(w.win.negoNoteForMe(a, ME), true, 'the id wins over a stale name');

    const b = w.win.negoPostComment(c, null, 'two');
    w.win.negoNoteGive(c, null, b, { id: null, name: ME.name }, '');
    assert.equal(w.win.negoNoteForMe(b, ME), true, 'and the name answers where there is no id');
    assert.equal(w.win.negoNoteForMe(b, MATE), false);
  });

  test('a note given to nobody is nobody’s', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'one');
    assert.equal(w.win.negoNoteForMe(n, ME), false);
  });
});

describe('f443 (3) counting must not write', () => {
  test('a contract nobody has written on is not changed by being counted', () => {
    const w = bench(); const c = contract();
    assert.equal(w.win.negoNotesForMe(c, ME).length, 0);
    assert.equal(c.thread, undefined, 'no thread was created by looking');
    assert.equal(c.negotiation, undefined, 'and no negotiation was started');
  });

  test('a done note is waiting on nobody', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'Check the cap.');
    w.win.negoNoteGive(c, null, n, { id: ME.id, name: ME.name }, '');
    assert.equal(w.win.negoNotesForMe(c, ME).length, 1);
    w.win.negoNoteDone(c, null, n, true, ME);
    assert.equal(w.win.negoNotesForMe(c, ME).length, 0, 'marking it done clears the list');
  });

  test('it reads the contract thread and the changes, raw', () => {
    const src = NEGO.slice(NEGO.indexOf('function negoNotesForMe'));
    const fn = src.slice(0, src.indexOf('\nfunction '));
    assert.match(fn, /c\.thread/, 'the contract’s own thread');
    assert.match(fn, /c\.changes/, 'and each change’s');
    assert.doesNotMatch(fn, /negoNoteHome|negoChanges\(|negoInit/,
      'never through a reading that creates what it looks at');
  });
});

describe('f443 (4) the wall: it never travels', () => {
  test('the server’s message allow-list does not name it', () => {
    const i = SERVER.indexOf('function msgMeta');
    assert.ok(i > 0, 'msgMeta is there');
    const fn = SERVER.slice(i, SERVER.indexOf('\n}', i));
    assert.doesNotMatch(fn, /given/, 'a field the allow-list does not name cannot cross');
    for (const k of ['id', 'replyTo', 'anchor', 'done'])
      assert.match(fn, new RegExp('raw\\.' + k), 'the four it does name are still named: ' + k);
  });

  test('the share payload does not carry it either', () => {
    const i = CORE.indexOf('function buildSharePayload');
    assert.ok(i > 0);
    /* The PROSE around this builder uses the word "given" in its ordinary
       sense, so the comments come off before the field is looked for. */
    const fn = CORE.slice(i, i + 20000)
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.doesNotMatch(fn, /given\s*:/, 'nothing writes a given field onto the payload');
    assert.doesNotMatch(fn, /\.given\b/, 'and nothing reads one to put it there');
  });

  test('the drawer refuses to draw it on the counterparty’s seat', () => {
    const i = VIEW.indexOf('function rlNpNoteHtml');
    const fn = VIEW.slice(i, VIEW.indexOf('\nfunction ', i + 10));
    assert.match(fn, /!PORTAL_MODE[^\n]*negoNoteGiven|negoNoteGiven[^\n]*PORTAL_MODE/,
      'the reading itself stands down in the portal');
    assert.match(fn, /!PORTAL_MODE && !given/, 'and so does the button');
  });
});

describe('f443 (5) two doors, one act', () => {
  test('the chip and the button both carry the attribute', () => {
    const i = VIEW.indexOf('function rlNpNoteHtml');
    const fn = VIEW.slice(i, VIEW.indexOf('\nfunction ', i + 10));
    const hits = (fn.match(/data-rl-np-give=/g) || []).length;
    assert.ok(hits >= 2, 'both the button and the chip are doors, found ' + hits);
  });

  test('and the wiring arms every one of them', () => {
    const i = VIEW.indexOf('function rlNpWireActs');
    const fn = VIEW.slice(i, VIEW.indexOf('\nasync function rlNpSetDone', i));
    assert.match(fn, /querySelectorAll\('\[data-rl-np-give\]'\)/,
      'querySelectorAll, never querySelector — a chip armed by neither is a dead door');
  });

  test('the writer makes no call: given is local and persisted, nothing more', () => {
    const i = VIEW.indexOf('async function rlNpSetGiven');
    const fn = VIEW.slice(i, VIEW.indexOf('\nfunction rlNpGivePick', i));
    assert.doesNotMatch(fn, /api\(|fetch\(|negoPostToChannel/,
      'done crosses because msgMeta names it; given has nowhere to go');
    assert.match(fn, /persist\(c\)/, 'and the record is saved');
  });

  test('the picker offers the internal room’s own people and nobody else', () => {
    const i = VIEW.indexOf('function rlNpGivePick');
    const fn = VIEW.slice(i, VIEW.indexOf('\n/* ---- THE VERB PUTS THE CARET', i));
    assert.match(fn, /negoTagPeople\(c, 'internal'/, 'one roster with the @ picker');
    assert.doesNotMatch(fn, /counterparty|'external'/, 'never anybody outside the workspace');
  });
});

describe('f443 (6) where it is waiting on you', () => {
  test('the kind is registered in all three homes', () => {
    assert.match(HOME, /NEEDS_YOU_ORDER = \[[^\]]*'note'/, 'the checklist order');
    assert.match(HOME, /kind:'note'/, 'the reading pushes it');
    assert.match(INSP, /note: 'home_verb_answer'/, 'the verb');
    assert.match(INSP, /note: 'ins_need_go_notes'/, 'and where the press goes');
    assert.match(INSP, /it\.kind === 'note'/, 'and the row has words');
    assert.match(APP, /k:'note-mine'/, 'the bell knows the kind');
    assert.match(APP, /push\('note-mine'/, 'and builds the row');
  });

  test('the door opens the drawer rather than inventing a page', () => {
    assert.match(HOME, /kind==='note'\)\{ if\(window\.openNotesPanel\)/,
      'one way to reach a note, and it is the drawer it lives in');
  });

  test('the bell reads raw, so the count cannot start a negotiation', () => {
    const i = APP.indexOf("push('note-mine'");
    const near = APP.slice(i - 700, i + 200);
    assert.match(near, /negoNotesForMe/, 'through the raw reading');
    assert.doesNotMatch(near, /negoChanges\(|negoPending\(/, 'and nothing that initialises');
  });
});

describe('f443 (7) both books', () => {
  const KEYS = ['ng_np_give', 'ng_np_give_change', 'ng_np_given', 'ng_np_given_by',
    'ng_np_given_ok', 'ng_np_given_back', 'ng_np_give_title', 'ng_np_give_who',
    'ng_np_give_when', 'ng_np_give_go', 'ng_np_give_off', 'ng_np_give_nobody',
    'ins_need_go_notes', 'ins_need_note_one', 'ins_need_note_other',
    'al_note_mine_one', 'al_note_mine_other'];
  for (const k of KEYS) test(k + ' is in English and Swedish', () => {
    const hits = (I18N.match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length;
    assert.equal(hits, 2, k + ' should appear once per book, found ' + hits);
  });
});
