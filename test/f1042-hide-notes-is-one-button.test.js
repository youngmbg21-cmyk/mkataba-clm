/* f1042 — HIDE NOTES IS ONE BUTTON; THE REDLINE NOTES SPEAK PROFESSIONALLY (owner picked "The Legora Way", 13 Nov
   2026, then: "Couldn't show and hide notes be one button"; "Buttons should not land behind the zoom button")
   ============================================================================
     (1) THE WORDS — All notes · Outstanding · Resolved; "Resolved by your redline", "not yet sent", "sent, awaiting
         their response", "not yet addressed", "agreed; pending re-check"; Hide notes / Show notes; both books;
     (2) ONE BUTTON — one pill that says Hide notes while the notes show and Show notes once they are put away;
     (3) REMEMBERED ON THIS COMPUTER — the choice is kept in this browser and read back;
     (4) WHERE IT APPLIES — everywhere the notes stand beside the paper but the Redline view; never while Jambo's read
         plays (the owner: "Show while it plays"); put away, the pill stands alone; shown again, the lone pill goes;
     (5) NEVER BEHIND THE ZOOM — the pill and the chips are placed under the zoom's drawn buttons (pd2RedFloor, and the
         lone pill measured against the box it stands in);
     (6) THE HANDBOOK names both words, both books.
   AT THE PARENT every check but none fails: the words are the old ones and no pill exists.
   Run: node --test test/f1042-hide-notes-is-one-button.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const PD = read('js/paperdesk.js'), I18N = read('js/i18n.js'), HB = read('js/handbook.js');
function fnSrc(src, name){
  const at = src.search(new RegExp('function\\s+' + name + '\\s*\\('));
  if (at < 0) return '';
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && --d === 0) return src.slice(at, i + 1);
  }
  return '';
}
/* the two books: English is the first, Swedish the second, of every key */
const said = k => [...I18N.matchAll(new RegExp('\\n\\s+' + k + ": '([^']*)'", 'g'))].map(m => m[1]);

describe('f1042 (1) the words', () => {
  const want = {
    /* RE-POINTED 24 Nov 2026 (the paper and its notes, L+S, owner's pick): the first tab says All; Hide is short on the row */
    pd2_rn_chip_all: 'All', pd2_notes_hide_s: 'Hide', pd2_rn_chip_open: 'Outstanding', pd2_rn_chip_done: 'Resolved',
    pd2_rn_answered: 'Resolved by your redline', pd2_rn_unsent: 'not yet sent', pd2_rn_sent: 'sent, awaiting their response',
    pd2_rn_none: 'not yet addressed', pd2_rn_agreed: 'agreed; pending re-check', pd2_notes_hide: 'Hide notes', pd2_notes_show: 'Show notes' };
  for (const [k, en] of Object.entries(want)) test(k + ' says "' + en + '", and has a Swedish twin', () => {
    const v = said(k);
    assert.equal(v.length, 2, k + ' in both books');
    assert.equal(v[0], en);
    assert.ok(v[1] && v[1] !== en, k + ' is Swedish in the Swedish book');
  });
});

/* a small stage: the readers, the pill and the store, run in a page of their own */
function stage(){
  const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://hati.test/', runScripts: 'outside-only' });
  const w = dom.window;
  w.eval(`var _pdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    var _pdT = k => ({ pd2_notes_hide: 'Hide notes', pd2_notes_hide_s: 'Hide', pd2_notes_show: 'Show notes' })[k] || k;
    var PD2_NOTE_GAP = 12;
    var lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
    var lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    ${PD.match(/const PD2_NOTES_HIDDEN_KEY = [^;]+;/)[0].replace('const', 'var')}
    ${['pd2NotesHiddenGet', 'pd2NotesHiddenSet', 'pd2NotesTgHtml', 'pd2NotesTgSolo'].map(n => fnSrc(PD, n)).join('\n')}`);
  return w;
}

describe('f1042 (2) one button, (3) remembered', () => {
  test('one pill: Hide notes while shown, Show notes once put away', () => {
    const w = stage();
    const shown = w.document.createElement('div'); shown.innerHTML = w.pd2NotesTgHtml(false);
    const away = w.document.createElement('div'); away.innerHTML = w.pd2NotesTgHtml(true);
    assert.equal(shown.querySelectorAll('button').length, 1);
    /* RE-POINTED 24 Nov 2026 (the paper and its notes, L+S, owner's pick): shown, the press is the row's short Hide */
    assert.equal(shown.querySelector('button').textContent, 'Hide');
    assert.equal(shown.querySelector('button').getAttribute('data-pd2-notes-tg'), 'hide');
    assert.equal(away.querySelectorAll('button').length, 1);
    assert.equal(away.querySelector('button').textContent, 'Show notes');
    assert.equal(away.querySelector('button').getAttribute('data-pd2-notes-tg'), 'show');
  });
  test('the choice is kept in this browser and read back; a blocked store reads as shown', () => {
    const w = stage();
    assert.equal(w.pd2NotesHiddenGet(), false);
    w.pd2NotesHiddenSet(true); assert.equal(w.pd2NotesHiddenGet(), true);
    assert.equal(w.localStorage.getItem('hati.v1.pd2NotesHidden'), 'true', 'kept through the shell\'s own store');
    w.pd2NotesHiddenSet(false); assert.equal(w.pd2NotesHiddenGet(), false);
    Object.defineProperty(w, 'localStorage', { get(){ throw new Error('blocked'); } });
    assert.equal(w.pd2NotesHiddenGet(), false);
  });
});

describe('f1042 (4) where it applies', () => {
  const paint = fnSrc(PD, 'pd2NotesPaint');
  test('put away only off the Redline view, never while the read plays; the lone pill stands under the zoom', () => {
    /* RE-POINTED 24 Nov 2026 (the paper and its notes, L+S, owner's pick): Hide stands on the Redline row too, so the notes are put away there as well */
    assert.match(paint, /if \(!walking && pd2NotesHiddenGet\(\)\)\{ pd2NotesOff\(\); pd2NotesTgSolo\(zoom\); return; \}/);
  });
  /* RE-POINTED 25 Nov 2026 (the paper's dock): the row and the lone pill stand in the dock's row, written whole by
     pd2DockRowSet, emptied by pd2NotesOff; nothing of the row is in the notes' own box */
  test('shown again, the lone pill goes; the pill heads the notes but not while reading', () => {
    assert.match(paint, /host\.innerHTML = groups\.map\(\(g, i\) => pd2GroupHtml\(g, i\)\)\.join\(''\);\s*pd2DockRowSet\(walking \? '' : pd2NotesTgHtml\(false\)\);/);
    assert.match(fnSrc(PD, 'pd2NotesOff'), /pd2-dock-row[\s\S]*r\.innerHTML = ''/);
    assert.match(fnSrc(PD, 'pd2NotesTgSolo'), /pd2DockRowSet\(`<div id="pd2-notes-tg">\$\{pd2NotesTgHtml\(true\)\}<\/div>`\)/);
  });
  test('a press flips the choice and draws the notes again', () => {
    assert.match(PD, /closest\('\[data-pd2-notes-tg\]'\)[\s\S]{0,200}pd2NotesHiddenSet\(b\.getAttribute\('data-pd2-notes-tg'\) === 'hide'\)[\s\S]{0,200}pd2NotesPaint\(/);
  });
});

describe('f1042 (5) never behind the zoom', () => {
  /* RE-POINTED 25 Nov 2026 (the paper's dock, owner: "the hide button and others are overlapping with the zoom. They
     should never do that"): the zoom and the row are ONE box; the notes start under its foot */
  test('the notes start under the dock, the row under the zoom in the same box', () => {
    const paint = fnSrc(PD, 'pd2NotesPaint');
    assert.match(paint, /if \(!red\) pd2GroupsPlace\(groups, z, h, ff, pd2RedFloor\(h\)\)/);
    assert.match(fnSrc(PD, 'pd2RedFloor'), /#pd2-dock:not\(\[hidden\]\) \.pd2-dock-box[\s\S]*box\.offsetHeight/);
    assert.match(PD, /d\.innerHTML = '<div class="pd2-dock-box"><div class="pd2-dock-zc"><\/div><div id="pd2-dock-row" class="pd2-dock-row"><\/div><\/div>'/);
  });
});


describe('f1042 (6) the Handbook', () => {
  test('both words named in both books', () => {
    /* RE-POINTED 24 Nov 2026 (the paper and its notes, L+S): shown, the press is the row's short Hide */
    const n = (HB.match(/\{ui:pd2_notes_hide_s\}/g) || []).length, m = (HB.match(/\{ui:pd2_notes_show\}/g) || []).length;
    assert.ok(n >= 2 && m >= 2, 'en and sv');
  });
});
