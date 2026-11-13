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
    pd2_rn_chip_all: 'All notes', pd2_rn_chip_open: 'Outstanding', pd2_rn_chip_done: 'Resolved',
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
    var _pdT = k => ({ pd2_notes_hide: 'Hide notes', pd2_notes_show: 'Show notes' })[k] || k;
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
    assert.equal(shown.querySelector('button').textContent, 'Hide notes');
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
    assert.match(paint, /if \(!red && !walking && pd2NotesHiddenGet\(\)\)\{ pd2NotesOff\(\); pd2NotesTgSolo\(zoom\); return; \}/);
  });
  test('shown again, the lone pill goes; the pill heads the notes but not while reading', () => {
    assert.match(paint, /document\.querySelectorAll\('#pd2-notes-tg'\)\.forEach\(n => n\.remove\(\)\)/);
    assert.match(paint, /host\.innerHTML = \(walking \? '' : pd2NotesTgHtml\(false\)\) \+ groups\.map/);
    assert.match(fnSrc(PD, 'pd2NotesOff'), /#pd2-notes-tg/);
  });
  test('a press flips the choice and draws the notes again', () => {
    assert.match(PD, /closest\('\[data-pd2-notes-tg\]'\)[\s\S]{0,200}pd2NotesHiddenSet\(b\.getAttribute\('data-pd2-notes-tg'\) === 'hide'\)[\s\S]{0,200}pd2NotesPaint\(/);
  });
});

describe('f1042 (5) never behind the zoom', () => {
  test('the notes start under the pill, the pill under the zoom (one measure for chips and pill)', () => {
    const paint = fnSrc(PD, 'pd2NotesPaint');
    assert.match(paint, /if \(!red\) pd2GroupsPlace\(groups, z, h, ff, pd2RedFloor\(h\)\)/);
    assert.match(fnSrc(PD, 'pd2RedFloor'), /paper-zc[\s\S]*querySelectorAll\('\*'\)[\s\S]*a\.bottom/);
  });
  test('the lone pill is measured against the box it stands in, under the zoom\'s buttons, in line with their right edge', () => {
    const w = stage();
    const doc = w.document;
    doc.body.innerHTML = '<div id="ig-paper-scroll"><div class="paper-zc"><span id="zb"></span></div></div><div id="box"><div class="ig-zoom" id="z"></div></div>';
    const R = (l, t, r, b) => () => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t });
    doc.getElementById('zb').getBoundingClientRect = R(942, 110, 1040, 138);
    doc.querySelector('.paper-zc').getBoundingClientRect = R(1040, 110, 1040, 110);
    doc.getElementById('box').getBoundingClientRect = R(40, 104, 1032, 900);
    const z = doc.getElementById('z');
    /* jsdom lays nothing out: the lone pill's box is the outer one, as in a browser with the notes away */
    Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get(){ return doc.getElementById('box'); }, configurable: true });
    w.pd2NotesTgSolo(z);
    const el = doc.getElementById('pd2-notes-tg');
    assert.ok(el, 'drawn');
    assert.equal(el.style.top, (138 - 104 + 12) + 'px', 'under the zoom\'s buttons, a gap clear');
    assert.equal(el.style.right, (1032 - 1040) + 'px', 'its right edge in line with theirs');
  });
});

describe('f1042 (6) the Handbook', () => {
  test('both words named in both books', () => {
    const n = (HB.match(/\{ui:pd2_notes_hide\}/g) || []).length, m = (HB.match(/\{ui:pd2_notes_show\}/g) || []).length;
    assert.ok(n >= 2 && m >= 2, 'en and sv');
  });
});
