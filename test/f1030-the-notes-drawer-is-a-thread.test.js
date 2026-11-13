'use strict';
/* ============================================================
   f1030 — THE NOTES DRAWER IS A THREAD (owner picked "The Thread" by name off
   four drawn options, 13 Nov 2026)
   ============================================================
   The drawer reads as a conversation. The same builders, attributes and the
   one writer; only the drawing moved. THE CLAIMS:
     1  a face per note, the clock beside the name, the full stamp on the hover
     2  a line per DAY over the notes written on it
     3  the chips say which pile is listed — Open · Yours · Done — a pile with
        nothing in it is not listed, and with only open notes no chip is drawn
     4  the Done chip is the ONE door onto done notes: no fold in the drawer
     5  the verbs are drawn buttons that keep their word and their attribute
     6  one box builder for both panels, with the @ door only where the room
        offers somebody
     7  the rooms' counts ride the switch without brackets
     8  every new word is in both books; no colour is hand-typed
   Run: node --test test/f1030-the-notes-drawer-is-a-thread.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const VIEW = read('js/views/negotiation.js');
const INDEX = read('index.html');
const I18N = read('js/i18n.js');
const fnOf = name => { const m = VIEW.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n\\}')); return m ? m[0] : ''; };

const BODY = '<h2>6. Payment</h2><p>Pay each invoice within thirty (30) days of receipt.</p>'
  + '<h2>7. Liability</h2><p>Neither party is liable for indirect loss.</p>';
const ME = { id: 'u_me', name: 'Amina Yusuf', role: 'legal', email: 'amina@mk.co.ke' };
const MATE = { id: 'u_mate', name: 'Wanjiru Kamau', role: 'legal', email: 'w@mk.co.ke' };
const tick = () => new Promise(r => setTimeout(r, 30));
async function bench(){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true, canEdit: true });
  w.win.getUsers = () => [ME, MATE];
  w.win.userById = id => [ME, MATE].find(u => u.id === id) || null;
  w.win.saveSettings = () => {}; w.win.persist = () => {};
  w.win.negoPostToChannel = async () => ({ ok: false, skipped: true });
  w.win.negoNotifyMentions = async () => null;
  w.win.confirmDialog = async () => true;
  const c = { id: 'MK-1026', name: 'Supply Agreement', counterparty: 'Saw Sawa Ltd', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
    value: 4800000, redlineText: BODY, format: 'rich' };
  w.win.negoInit(c);
  w.win.state = Object.assign({}, w.win.state, { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  w.win.getContract = id => (String(id) === String(c.id) ? c : null);
  const host = w.win.document.createElement('div');
  w.win.document.body.appendChild(host);
  const opts = { side: 'owner', author: ME.name };
  const paint = () => { w.win.rlChatPanelPaint(host, c, opts); return host; };
  const post = (text, who) => w.win.negoPostComment(c, null, text, { side: 'owner', author: who || ME.name, visibility: 'internal' });
  return { w, c, host, paint, post };
}
/* A day built off the clock the test runs on, never a calendar date. */
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12, 0, 0, 0); return d.toISOString(); };

describe('f1030 — the Notes drawer is a Thread', () => {
  test('(1)(2) a face, the clock beside the name, and a line per day', async () => {
    const p = await bench();
    p.post('Older.', MATE.name); p.post('Newer.');
    p.c.thread[0].at = daysAgo(1); p.c.thread[1].at = daysAgo(0);
    const h = p.paint();
    const notes = [...h.querySelectorAll('.rl-np-note')];
    assert.equal(notes.length, 2);
    assert.equal(notes[0].querySelector('.rl-np-av').textContent, 'WK', 'initials on the face');
    const days = [...h.querySelectorAll('.rl-np-day')].map(d => d.textContent.trim());
    assert.deepEqual(days, ['Yesterday', 'Today'], 'one line per day, in the list\'s order');
    const when = notes[1].querySelector('.rl-np-top span');
    assert.doesNotMatch(when.textContent, /20\d\d/, 'the clock alone beside the name');
    assert.match(when.getAttribute('title'), /20\d\d/, 'and the full stamp on the hover');
    /* two notes on one day share one line */
    p.c.thread[0].at = daysAgo(0);
    assert.equal(p.paint().querySelectorAll('.rl-np-day').length, 1);
    /* a caller that names no day still draws the full stamp */
    assert.match(p.w.win.rlNpNoteHtml(p.c.thread[1], 'internal', 'owner', ''), /<span title="[^"]*">[^<]*20\d\d/);
  });

  test('(3)(4) the chips: no chip with only open notes; Yours and Done listed when they hold something; no fold', async () => {
    const p = await bench();
    p.post('One.'); p.post('Two.', MATE.name); p.post('Three.');
    let h = p.paint();
    assert.equal(h.querySelectorAll('.rl-np-chip').length, 0, 'nothing to choose, no chip');
    assert.ok(h.querySelector('.rl-np-scope .rl-np-sort'), 'the order is still said');
    p.c.thread[1].given = { id: ME.id, name: ME.name, due: null };
    p.c.thread[2].done = { at: daysAgo(0), by: ME.name };
    h = p.paint();
    const chips = () => [...h.querySelectorAll('.rl-np-chip')].map(b => b.textContent.replace(/\s+/g, ' ').trim());
    assert.deepEqual(chips(), ['Open 2', 'Yours 1', 'Done 1']);
    assert.equal(h.querySelectorAll('.rl-np-thread').length, 2, 'Open lists the open threads');
    assert.equal(h.querySelector('[data-rl-np-donefold]'), null, 'the fold is gone from the drawer');
    assert.match(h.querySelector('.rl-np-given.is-you').textContent, /Given to you/);
    h.querySelector('[data-rl-np-show="done"]').click(); await tick();
    assert.equal(h.querySelectorAll('.rl-np-thread').length, 1);
    assert.ok(h.querySelector('.rl-np-thread.is-done'), 'Done lists the done thread');
    assert.equal(h.querySelector('[data-rl-np-show="done"]').getAttribute('aria-pressed'), 'true');
    h.querySelector('[data-rl-np-show="mine"]').click(); await tick();
    assert.equal(h.querySelectorAll('.rl-np-thread').length, 1);
    assert.match(h.querySelector('.rl-np-thread').textContent, /Two\./);
    /* a pile that empties falls back to Open */
    delete p.c.thread[1].given;
    h = p.paint();
    assert.equal(h.querySelector('.rl-np-chip.on').getAttribute('data-rl-np-show'), 'open');
    assert.deepEqual(chips(), ['Open 2', 'Done 1'], 'and an empty pile is not listed');
    p.w.win.rlNotesPanelClosed();
  });

  test('(5) the verbs are drawn, keep their word and their attribute, and still act', async () => {
    const p = await bench();
    p.post('Root.');
    const h = p.paint();
    const bar = h.querySelector('.rl-np-note > .rl-np-acts');
    assert.ok(bar, 'the verbs sit on the note');
    for (const a of ['data-rl-np-reply', 'data-rl-np-done', 'data-rl-np-seen', 'data-rl-np-give', 'data-rl-np-delete']){
      const b = bar.querySelector('[' + a + ']');
      assert.ok(b, a);
      assert.ok(b.querySelector('svg.rl-np-ai'), a + ' is drawn');
      assert.ok(b.querySelector('.rl-np-al').textContent.trim(), a + ' keeps its word');
      assert.ok(b.getAttribute('title'), a + ' says what it is on the hover');
    }
    bar.querySelector('[data-rl-np-done]').click(); await tick(); await tick();
    assert.ok(p.c.thread[0].done, 'Done still marks the record');
    assert.match(INDEX, /\.rl-np-note>\.rl-np-acts\{[^}]*opacity:0;\}/, 'unseen at rest');
    assert.doesNotMatch(INDEX.match(/\.rl-np-note>\.rl-np-acts\{[^}]*\}/)[0], /pointer-events/, 'but never unpressable');
    assert.match(INDEX, /\.rl-np-note:hover>\.rl-np-acts,\.rl-np-note:focus-within>\.rl-np-acts\{opacity:1;\}/, 'pointed at or keyed to');
    assert.match(INDEX, /@media \(hover:none\)\{\s*\.rl-np-note\{flex-wrap:wrap;\}\s*\.rl-np-note>\.rl-np-acts\{position:static;opacity:1;/, 'always there on a finger');
    p.w.win.rlNotesPanelClosed();
  });

  test('(6)(7) one box builder; the @ door only where the room offers somebody; counts without brackets', () => {
    assert.match(fnOf('rlChatPanelHtml'), /rlNpBoxHtml\(\{/);
    assert.match(fnOf('rlNotesPanelHtml'), /rlNpBoxHtml\(\{/);
    const box = fnOf('rlNpBoxHtml');
    assert.match(box, /\$\{o\.tags \? `<button type="button" class="rl-np-atb" data-rl-np-at/, 'no picker, no door');
    assert.match(box, /class="rl-np-send" \$\{o\.send\}/, 'the one filled button carries the caller\'s send');
    assert.match(fnOf('rlNpRoomsHtml'), /<i>\$\{n\}<\/i>/);
    assert.doesNotMatch(fnOf('rlNpRoomsHtml'), /<i>\(\$\{n\}\)<\/i>/);
  });

  test('(8) both books carry the words; the Thread\'s sheet types no colour', () => {
    for (const k of ['ng_np_today', 'ng_np_yesterday', 'ng_np_show_open', 'ng_np_show_mine', 'ng_np_show_done',
      'ng_np_none_open', 'ng_np_given_you', 'ng_np_given_you_by'])
      assert.equal((I18N.match(new RegExp('\\n\\s+' + k + ': ', 'g')) || []).length, 2, k + ' is in both books');
    const a = INDEX.indexOf('---- THE THREAD (owner picked it by name off four drawn, 13 Nov 2026) ----');
    const b = INDEX.indexOf('#panel-body .al-row.al-good{padding-left', a);
    assert.ok(a > 0 && b > a, 'the block is where the notes rules are');
    assert.doesNotMatch(INDEX.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, ''), /#[0-9a-fA-F]{3,8}\b/, 'tokens only');
  });
});
