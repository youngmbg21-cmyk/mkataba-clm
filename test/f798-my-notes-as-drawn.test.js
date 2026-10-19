'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f798 — MY NOTES, AS DRAWN (round 20 of the redesign, scene "My notes"; the
   owner picked "The SAP way", 17 Oct 2026; every drawn part built on the
   owner's yes of 18 Oct 2026; js/views/mynotes.js)
   (1) The band: "My notes 5 · private to you · Jambo reads them only when you
       ask", + New note; the tabs All · Due today · Later · Reviewed with
       their counts; beside them "Note [Words in a note]" and "Contract [Any]"
       — no chip per contract.
   (2) The review as the drawing says it: "Review today", "Review Tue 20
       Oct", "No review day", "Reviewed 14 Oct"; Due today is the bell's own
       reading (mineNotesDue).
   (3) The list due first, then newest, as its head says; "5 of 5" under it.
   (4) Where the width holds it, the note opens in Jambo's panel ("Note"):
       "My note · written …", its pills, Mark reviewed · Snooze a week · Open
       REF, its words, Contract and Review as rows ("Today, … · in your bell"),
       the private line, Delete note. Narrower, the card's own side.
   (5) The boxes narrow; with nothing chosen Jambo says the ledger, no call.
   (6) The words, in both books.
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   The browser half: test/chromium/requests-and-notes-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const I18N = R('js/i18n.js');
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
/* local calendar days, the way todayISO says them */
const iso = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const stamp = n => new Date(Date.now() + n * 864e5).toISOString();

function world(o){
  const w = buildWorld({ registerView: true });
  const win = w.win;
  win.state = Object.assign(win.state || {}, { view: 'mynotes', settings: {},
    contracts: [{ id: 'MK-A2', name: 'Raw Milk Collection', counterparty: 'Nandi Dairy', status: 'Signed' },
                { id: 'MK-A1', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', status: 'Signed' }] });
  win.getContract = id => win.state.contracts.find(c => c.id === id) || null;
  win.todayISO = () => iso(0);
  win.currentUser = () => ({ id: 'u1', name: 'Amina Otieno', role: 'admin' });
  win.API_MODE = () => false;
  const notes = [
    { id: 'nt_1', kind: 'note', title: "Check Nandi Dairy's insurance broker", body: 'Check the broker before we accept a higher cap in clause 7.', contractId: 'MK-A2', reviewBy: iso(0), createdAt: stamp(-4) },
    { id: 'nt_2', kind: 'note', title: 'The NDA must cover shelf data', body: 'Shelf data too.', reviewBy: iso(1), createdAt: stamp(-1) },
    { id: 'nt_3', kind: 'note', title: 'Is the price index right', body: 'Clause 4.', contractId: 'MK-A1', reviewBy: iso(3), createdAt: stamp(-3) },
    { id: 'nt_4', kind: 'note', title: 'Their counsel prefers Ugandan law', body: 'We hold Kenya.', contractId: 'MK-A2', createdAt: stamp(-7) },
    { id: 'nt_5', kind: 'note', title: 'Delivery window moved', body: 'A week.', contractId: 'MK-A1', reviewBy: iso(-5), reviewedAt: stamp(-5), createdAt: stamp(-10) },
  ];
  win.localStorage.setItem('hati.v1.mine', JSON.stringify({ event: [], note: (o && o.notes) || notes, pref: null }));
  win.eval(R('js/mine.js').replace(/^Object\.assign\(window[\s\S]*$/m, m => m));
  win.eval(R('js/views/mynotes.js'));
  if (win.insForce) win.insForce(!(o && o.narrow));
  return { w, win, d: win.document };
}
async function painted(o){ const x = world(o); await x.win.mineLoad(true); x.win.renderMyNotes(); return x; }

describe('f798 (1) the band', () => {
  test('1a the name, its count and the private line; + New note at its end', async () => {
    const { d } = await painted();
    const band = d.querySelector('#mn-page .sap-band.mn-band');
    assert.ok(band, 'the white band');
    assert.equal(txt(band.querySelector('.mn-t1')), 'My notes');
    assert.equal(txt(band.querySelector('.mn-hn')), '5');
    assert.equal(txt(band.querySelector('.mn-hs')), 'private to you · Jambo reads them only when you ask');
    assert.ok(band.querySelector('.mn-hs svg'), 'with the lock');
    assert.equal(txt(band.querySelector('#mn-new')), 'New note');
  });
  test('1b the tabs with their counts, and beside them Note and Contract — no chip per contract', async () => {
    const { d } = await painted();
    const bar = d.querySelector('.mn-band .reg-tabbar');
    const tabs = [...bar.querySelectorAll('.reg-views [data-mn-tab]')].map(b => [b.getAttribute('data-mn-tab'), b.firstChild.textContent, txt(b.querySelector('.n'))]);
    assert.deepEqual(tabs, [['all', 'All', '5'], ['today', 'Due today', '1'], ['later', 'Later', '2'], ['done', 'Reviewed', '1']]);
    const fb = bar.querySelector('.ik-fb');
    assert.deepEqual([...fb.querySelectorAll('.ik-fb-l, .reg-f-l')].map(txt), ['Note', 'Contract']);
    assert.equal(fb.querySelector('#mn-q').getAttribute('placeholder'), 'Words in a note');
    assert.deepEqual([...fb.querySelectorAll('select[data-mn-f="ct"] option')].map(txt), ['Any', 'MK-A2 · Nandi Dairy', 'MK-A1 · Kabras Sugar', 'No contract']);
    assert.ok(!d.querySelector('[data-mn-filter^="c:"]'), 'the contract chips are gone');
  });
});

describe('f798 (2) the review, as the drawing says it', () => {
  test('2a today, a day ahead (weekday first), none, done; late is red', async () => {
    const { win } = await painted();
    const st = n => JSON.parse(JSON.stringify(win.myNoteState(n)));
    assert.deepEqual(st({ reviewBy: iso(0) }), { k: 'today', word: 'Review today' });
    assert.equal(st({ reviewBy: iso(1) }).k, 'later');
    assert.match(st({ reviewBy: iso(1) }).word, /^Review [A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2}$/, '"Review Tue 20 Oct"');
    assert.deepEqual(st({}), { k: 'none', word: 'No review day' });
    assert.match(st({ reviewBy: iso(-5), reviewedAt: stamp(-5) }).word, /^Reviewed \d{1,2} [A-Z][a-z]{2}$/);
    assert.equal(st({ reviewBy: iso(-2) }).k, 'late');
  });
  test('2b Due today counts what the bell counts (mineNotesDue)', async () => {
    const { win, d } = await painted();
    assert.equal(win.mineNotesDue().length, Number(txt(d.querySelector('[data-mn-tab="today"] .n'))));
  });
});

describe('f798 (3) the list', () => {
  test('3a due first, then newest — said on its head; "5 of 5" under it', async () => {
    const { d } = await painted();
    assert.deepEqual([...d.querySelectorAll('.mn-t [data-mn-row]')].map(r => r.getAttribute('data-mn-row')), ['nt_1', 'nt_2', 'nt_3', 'nt_4', 'nt_5']);
    assert.match(txt(d.querySelector('.ins-cardhead-t')), /^My notes 5 due first, then newest$/);
    assert.deepEqual([...d.querySelectorAll('.mn-t thead th')].map(txt), ['Note', 'Contract', 'Review', 'Written']);
    assert.deepEqual([...d.querySelectorAll('.mn-t [data-mn-row] .mn-pill')].map(p => p.className.replace('mn-pill is-', '')), ['today', 'later', 'later', 'none', 'done']);
    assert.equal(txt(d.querySelector('[data-mn-foot]')), '5 of 5');
  });
});

describe('f798 (4) the note in Jambo\'s panel', () => {
  test('4a "Note" in his head; the note as drawn', async () => {
    const { d } = await painted();
    const p = d.querySelector('#ins-panel.is-jambo');
    assert.ok(p, 'Jambo\'s panel beside the list');
    assert.equal(txt(p.querySelector('[data-jl-word]')), 'Note');
    assert.match(txt(p.querySelector('.ins-eb')), /^My note · written \d{1,2} [A-Z][a-z]{2}$/);
    assert.ok(p.querySelector('.ins-eb svg'), 'the lock');
    assert.equal(txt(p.querySelector('.ins-cp')), "Check Nandi Dairy's insurance broker");
    assert.deepEqual([...p.querySelectorAll('.jl-pills > span')].map(txt), ['Review today', 'MK-A2']);
    assert.deepEqual([...p.querySelectorAll('.ins-h .ins-acts [data-ins-act]')].map(txt), ['Mark reviewed', 'Snooze a week', 'Open MK-A2']);
    assert.equal(txt(p.querySelector('.mn-body')), 'Check the broker before we accept a higher cap in clause 7.');
    const rows = [...p.querySelectorAll('.jl-rows.mn-rows > div')].map(r => [txt(r.querySelector('dt')), txt(r.querySelector('dd'))]);
    assert.equal(rows[0][0], 'Contract'); assert.equal(rows[0][1], 'MK-A2 · Raw Milk Collection · Nandi Dairy');
    assert.equal(rows[1][0], 'Review'); assert.match(rows[1][1], /^Today, [A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2} · in your bell$/);
    assert.equal(txt(p.querySelector('.mn-priv')), 'Private: only you can see your notes. Jambo reads them only when you ask.');
    assert.equal(txt(p.querySelector('[data-mn-act="delete"]')), 'Delete note');
  });
  test('4b narrower, the same note in the card\'s own side', async () => {
    const { d } = await painted({ narrow: true });
    assert.ok(!d.getElementById('ins-panel'), 'no panel at the edge');
    const side = d.querySelector('.mn-card2 #mn-side');
    assert.ok(side && /Mark reviewed/.test(side.textContent) && /Delete note/.test(side.textContent));
  });
});

describe('f798 (5) the boxes narrow; Jambo says the ledger', () => {
  test('5a Contract and the words', async () => {
    const x = await painted();
    const sel = x.d.querySelector('select[data-mn-f="ct"]');
    sel.value = 'MK-A1'; sel.dispatchEvent(new x.win.Event('change', { bubbles: true }));
    assert.deepEqual([...x.d.querySelectorAll('.mn-t [data-mn-row]')].map(r => r.getAttribute('data-mn-row')), ['nt_3', 'nt_5']);
    assert.equal(txt(x.d.querySelector('[data-mn-foot]')), '2 of 5');
    const s2 = x.d.querySelector('select[data-mn-f="ct"]'); s2.value = ''; s2.dispatchEvent(new x.win.Event('change', { bubbles: true }));
    const q = x.d.getElementById('mn-q'); q.value = 'ugandan'; q.dispatchEvent(new x.win.Event('input', { bubbles: true }));
    assert.deepEqual([...x.d.querySelectorAll('.mn-t [data-mn-row]')].map(r => r.getAttribute('data-mn-row')), ['nt_4']);
  });
  test('5b with nothing chosen, his own words counted from the notes, and two doors', async () => {
    const x = await painted();
    x.win.insLetGo('mynotes'); x.win.renderMyNotes();
    const p = x.d.getElementById('ins-panel');
    assert.equal(txt(p.querySelector('.jl-bub')), 'You have 5 notes, private to you. 1 is due today. 2 come up later. I read a note only when you ask me to.');
    assert.match(txt(p.querySelector('.jl-src')), /no Jambo call/);
    assert.deepEqual([...p.querySelectorAll('.jl-chip')].map(txt), ['the ones due today', 'new note']);
  });
});

describe('f798 (6) the words', () => {
  test('6a in both books', () => {
    const books = I18N.split(/\n  sv: \{/);
    for (const k of ['mn_head_sub', 'mn_new_btn', 'mn_tab_today', 'mn_tab_later', 'mn_box_note_ph', 'mn_box_any', 'mn_sort', 'mn_foot', 'mn_col_review2',
      'mn_no_day', 'mn_pill_today', 'mn_eb', 'mn_rv_today', 'mn_rv_on', 'mn_private_all', 'mn_delete_note', 'jl_w_note', 'jl_mn_say_n_other', 'jl_mn_src'])
      for (const b of books.slice(0, 2)) assert.ok(new RegExp('\\n\\s+' + k + ': ').test(b), k);
  });
});

/* SECOND PASS (lane A3, 19 Oct 2026): a refresh lands on the same tab, boxes
   and note. At the first pass (fc08e7f) every test here FAILS. */
describe('f798 (7) a refresh lands at the same spot (PLACE_PARTS.mynotes)', () => {
  test('7a My notes is in the place store', () => {
    assert.match(R('js/app.js'), /mynotes:\['mnPlace','mnPlacePut'\]/);
  });
  test('7b the tab, the boxes and the chosen note come back once the notes are in', async () => {
    const a = await painted();
    a.d.querySelector('[data-mn-tab="later"]').click();
    a.d.querySelector('[data-mn-row="nt_3"]').click();
    const kept = JSON.parse(JSON.stringify(a.win.mnPlace()));
    assert.equal(kept.filter, 'later'); assert.equal(kept.sel, 'nt_3');
    const b = world();
    b.win.mnPlacePut(kept);
    await b.win.mineLoad(true); b.win.renderMyNotes();
    assert.ok(b.d.querySelector('[data-mn-tab="later"][aria-selected="true"], [data-mn-tab="later"].is-on'), 'Later lit');
    assert.equal(txt(b.d.querySelector('#ins-panel .ins-cp')), 'Is the price index right', 'the chosen note is back');
  });
});

describe('f798 (8) a tab\'s number is the list it opens (second pass)', () => {
  test('8a the Contract box narrows every tab\'s number with the list', async () => {
    const x = await painted();
    const sel = x.d.querySelector('select[data-mn-f="ct"]');
    sel.value = 'MK-A2'; sel.dispatchEvent(new x.win.Event('change', { bubbles: true }));
    const n = k => { const e = x.d.querySelector(`[data-mn-tab="${k}"] .n`); return e && !e.hidden ? Number(e.textContent) : 0; };
    assert.equal(n('all'), x.d.querySelectorAll('.mn-t [data-mn-row]').length);
    assert.equal(n('all'), 2); assert.equal(n('today'), 1); assert.equal(n('later'), 0); assert.equal(n('done'), 0);
  });
});

describe('f798 (9) second check: a reviewed note\'s verb says what it does', () => {
  test('9a "Review again", not an Undo days later', async () => {
    const x = await painted();
    x.d.querySelector('[data-mn-row="nt_5"]').click();
    const verbs = [...x.d.querySelectorAll('#ins-panel .ins-h .ins-acts [data-ins-act]')].map(txt);
    assert.equal(verbs[0], 'Review again');
    assert.ok(!verbs.includes('Undo'));
  });
});
