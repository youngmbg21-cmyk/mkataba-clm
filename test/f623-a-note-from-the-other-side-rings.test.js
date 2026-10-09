/* ============================================================
   F623 — a note from the other side rings a bell, on both seats (8 Oct 2026)
   ============================================================
   Notes from the other side rang nobody's bell. Ours: a `note-theirs` row off
   the conversations their side spoke last in (GET /api/messages/waiting),
   newer than this reader's c.notesRead — opening the notes drawer clears it.
   Theirs: a `note` row and a count on their Notes door for our side's notes
   on the contract's own thread they have not seen; opening the drawer clears
   both. Driven end to end in their-page-parties-and-notes-verify (3, 4). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const APP = read('js/app.js'), PORTAL = read('js/views/portal.js'), I18N = read('js/i18n.js');

describe('f623 — our bell', () => {
  test('the kind sits after note-mine and before suggest', () => {
    const kinds = [...APP.slice(APP.indexOf('const ALERT_KINDS'), APP.indexOf('function buildAlerts')).matchAll(/k:'([a-z-]+)'/g)].map(m => m[1]);
    assert.equal(kinds.indexOf('note-theirs'), kinds.indexOf('note-mine') + 1);
    assert.ok(kinds.indexOf('note-theirs') < kinds.indexOf('suggest'));
  });
  test('the row reads the waiting list against c.notesRead and opens the drawer', () => {
    const b = APP.slice(APP.indexOf('function buildAlerts'), APP.indexOf('function alertCount'));
    assert.match(b, /state\.waitingQuestions[\s\S]*?negoNotesReadAt\(c, me\)[\s\S]*?push\('note-theirs'[\s\S]*?openNotesPanel\(c\.id/);
  });
});
describe('f623 — their bell and their Notes door', () => {
  test('our side\'s contract-thread notes, newer than what they saw, are counted', () => {
    const f = PORTAL.slice(PORTAL.indexOf('function portalNotesUnread'), PORTAL.indexOf('function portalNotesMarkSeen'));
    assert.match(f, /m\.side==='owner'/);
    assert.match(f, /\^change:/, 'a reply on a change is the bell\'s reply row already');
  });
  test('the bell row, the door count, and opening the drawer marks them seen', () => {
    assert.match(PORTAL, /push\('note', 'gray', i18tn\('pa_note'/);
    assert.match(PORTAL, /id="pt-notes-n"/);
    const open = PORTAL.slice(PORTAL.indexOf('function portalOpenNotes'), PORTAL.indexOf('function portalNotesClose'));
    assert.match(open, /portalNotesMarkSeen\(\)/);
  });
  test('both books carry the words', () => {
    for (const k of ['pa_note_one', 'pa_note_other', 'al_note_theirs_one', 'al_note_theirs_other'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
