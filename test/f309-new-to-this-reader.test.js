/* ============================================================
   f309 — WHICH NOTES ARE NEW TO THIS READER (build plan group 5.1)
   ============================================================
   Owner-approved 13 Sep 2026. The drawer could not say which notes were new.

   THE BELL WAS NOT THE ANSWER, and saying it was would have been the wrong
   answer twice over: it counts only the notes that NAME you, on one contract,
   and what it remembers lives in that browser rather than in the record. So
   this is the one item in group 5 that needed a new piece of record —
   `c.notesRead`, a reader id to the moment they last had the drawer open.

   THE WALLS: it never travels (a counterparty is not told who on our side has
   read what), your own note is never new to you, and the stamp only ever moves
   forwards.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const CORE = read('js/core.js');

const ME = { id: 'u_w', name: 'Wanjiru Kamau', email: 'w@co.ke' };
function bench(){
  const w = buildWorld();
  const { win } = w;
  win.currentUser = () => ME;
  const c = { id: 'MK-309', name: 'A contract', counterparty: 'Nordkust Industri AB',
    audit: [], comments: [], changes: [] };
  return { win, c };
}
const note = (who, at, extra = {}) => ({ id: 'n' + at, who, at, text: 'hello', ...extra });

describe('f309 — a note is new until this reader has had the drawer open', () => {
  test('with nothing remembered, everything but your own is new', () => {
    const { win, c } = bench();
    assert.equal(win.negoNotesReadAt(c), null);
    assert.equal(win.negoNoteUnread(c, note('Erik Lindqvist', '2026-09-01T10:00:00.000Z')), true);
    /* YOUR OWN NOTE IS NEVER NEW TO YOU. */
    assert.equal(win.negoNoteUnread(c, note(ME.name, '2026-09-01T10:00:00.000Z', { byId: ME.id })), false);
  });

  test('having the drawer open settles what was there', () => {
    const { win, c } = bench();
    const before = note('Erik Lindqvist', '2026-09-01T10:00:00.000Z');
    win.negoMarkNotesRead(c);
    assert.equal(win.negoNoteUnread(c, before), false, 'read');
    const after = note('Erik Lindqvist', '2099-01-01T10:00:00.000Z');
    assert.equal(win.negoNoteUnread(c, after), true, 'and the next one is new again');
  });

  test('the stamp moves only forwards, and writes nothing when it has not moved', () => {
    const { win, c } = bench();
    const first = win.negoMarkNotesRead(c);
    assert.ok(first);
    /* A record already stamped in the future is not dragged back. */
    c.notesRead[ME.id] = '2099-01-01T00:00:00.000Z';
    assert.equal(win.negoMarkNotesRead(c), null, 'nothing written');
    assert.equal(c.notesRead[ME.id], '2099-01-01T00:00:00.000Z');
  });

  test('it is per reader, not per contract', () => {
    const { win, c } = bench();
    win.negoMarkNotesRead(c);
    const m = note('Erik Lindqvist', '2026-09-01T10:00:00.000Z');
    assert.equal(win.negoNoteUnread(c, m), false, 'read by me');
    assert.equal(win.negoNoteUnread(c, m, { id: 'u_other', name: 'Someone Else' }), true,
      'and still new to a colleague who has not opened it');
  });

  test('nobody signed in, nothing recorded', () => {
    const { win, c } = bench();
    win.currentUser = () => null;
    assert.equal(win.negoMarkNotesRead(c), null);
    assert.equal(c.notesRead, undefined, 'and no empty map left behind');
  });

  /* ---- THE WALL: IT NEVER TRAVELS ----
     Who on our side has read what is nobody else's business, and the share
     payload's allow-list is what keeps it that way. */
  test('it is not on the share payload', () => {
    const m = /function buildSharePayload\([\s\S]*?\n\}/.exec(strip(CORE));
    assert.ok(m, 'the allow-list exists');
    assert.doesNotMatch(m[0], /notesRead/);
  });

  test('and the counterparty’s seat never draws the mark', () => {
    const view = strip(read('js/views/negotiation.js'));
    const m = /function rlNpNoteHtml\([\s\S]*?\n\}/.exec(view);
    assert.ok(m);
    assert.match(m[0], /!PORTAL_MODE && window\.negoNoteUnread/,
      'their page has no reader to remember');
  });

  test('the mark is written after the paint, never before it', () => {
    const view = strip(read('js/views/negotiation.js'));
    const m = /function rlNpWireActs\([\s\S]*?\n  const again = /.exec(view);
    assert.ok(m, 'the drawer’s own per-paint wiring');
    assert.match(m[0], /setTimeout\(\(\) => \{[\s\S]*?negoMarkNotesRead\(c\)/,
      'stamping before the paint would clear the dots in the same breath as drawing them');
  });

  test('the word is in both books', () => {
    const i18n = read('js/i18n.js');
    assert.equal((i18n.match(/\bng_np_new:/g) || []).length, 2);
  });
});
