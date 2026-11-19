'use strict';
/* f1099 — OBLIGATIONS: WE OWE · THEY OWE (owner's pick, 19 Nov 2026: "Build as drawn"; "the goal for obligations is to remind
   you of your and their obligations"). The page is two columns under the tabs Next 30 days · Later · Done (· Proposed);
   each line its day, party, clause, who is reminded and one act; landed, Jambo's panel is the month as a line (ours above,
   theirs below) and who has nobody to remind; a line pressed, the panel is that obligation the Legora way.
   AT THE PARENT every test here fails: none of these readers exists and the page is the Late · Tracked table. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

function world(){
  const W = buildWorld({ obligations: true }).win;
  const c = { id: 'MK-T1', name: 'Warehousing Services', counterparty: 'Juno Logistics', folder: 'proc', status: 'Signed', metadata: {}, counterpartyEmail: '',
    owner: null, obligations: [
      { id: 'a', desc: 'Pay the storage fee', due: day(-3), status: 'open', party: 'ours', clause: '6.1', quote: 'The Customer shall pay the fee within thirty (30) days.' },
      { id: 'b', desc: 'Send the stock report', due: day(5), status: 'open', party: 'theirs', clause: '7.4' },
      { id: 'c', desc: 'Keep the goods insured', due: day(60), status: 'open', party: 'theirs', clause: '4.2' },
      { id: 'd', desc: 'Give notice', due: day(-40), status: 'done', completedAt: day(-41), party: 'ours' }] };
  if (typeof W.daysUntil !== 'function') W.daysUntil = iso => Math.round((new Date(String(iso).slice(0, 10) + 'T00:00:00') - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00')) / 864e5);
  return { W, c };
}
const rowsOf = (W, c) => c.obligations.map((o, i) => Object.assign({}, o, { cid: c.id, _c: c, _i: i, _key: c.id + '::' + o.id, st: o.status === 'done' ? 'done' : 'open', counterparty: c.counterparty }));

test('f1099 (1) each obligation stands on one tab: Next 30 days (late included), Later, Done', () => {
  const { W, c } = world();
  const r = rowsOf(W, c);
  assert.deepEqual(r.map(x => W.obnTwoTabOf(x)), ['open', 'open', 'later', 'done']);
});

test('f1099 (2) a line says its day, its party and clause, who is reminded, and one act; nobody to remind is said', () => {
  const { W, c } = world();
  const [ours, theirs] = rowsOf(W, c);
  const d = W.document.createElement('div');
  d.innerHTML = W.obnLineHtml(ours) + W.obnLineHtml(theirs);
  const [a, b] = d.querySelectorAll('.obt-li');
  assert.match(a.querySelector('.obt-w').className, /is-late/);
  assert.match(a.querySelector('.obt-sub').textContent, /Juno Logistics.*§ 6\.1/);
  assert.match(a.querySelector('.obt-rem').textContent, /nobody on our side/i, 'no owner, no assignee: said');
  assert.equal(a.querySelector('[data-obn-go]').getAttribute('data-obn-go'), 'done');
  assert.match(b.querySelector('.obt-rem').textContent, /nobody on their side/i, 'no address on their side: said');
  assert.equal(b.querySelector('[data-obn-go]').getAttribute('data-obn-go'), 'chase');
  c.counterpartyEmail = 'ops@juno.example';
  assert.match(W.obnRemWord(theirs, c), /can be reminded/);
});

test('f1099 (3) landed: the month as a line, ours above, theirs below, and who has nobody to remind', () => {
  const { W, c } = world();
  const o = W.obnTimelineFive(rowsOf(W, c));
  assert.match(o.title, /We owe 1, 1 late\. They owe 1, 0 late\./);
  const d = W.document.createElement('div'); d.innerHTML = o.mid;
  const rows = [...d.querySelectorAll('.obt-tl-row:not(.is-h)')].map(r => [...r.querySelectorAll('b')].map(b => b.textContent));
  assert.deepEqual(rows, [['1', '0', '0', '0'], ['0', '1', '0', '0']], 'late · this week · next week · later, ours then theirs');
  assert.equal(o.groups[0].rows.length, 2, 'both have nobody to remind');
});

test('f1099 (4) a line pressed: the obligation the Legora way — its words, its act, who is reminded', () => {
  const { W, c } = world();
  const [ours, theirs] = rowsOf(W, c);
  if (typeof W.partyContactsOpen !== 'function') W.partyContactsOpen = () => {};   /* js/participants.js's door, not in this world */
  const d = W.document.createElement('div'); d.innerHTML = W.obnOnePanel(ours) + W.obnOnePanel(theirs);
  const [p1, p2] = d.querySelectorAll('.obt-one');
  assert.match(p1.querySelector('.obt-side').textContent, /We owe/);
  assert.match(p1.querySelector('.obn-lg-q').innerHTML, /<mark>thirty \(30\) days<\/mark>/);
  assert.ok(p1.querySelector('[data-obn-go="done"]') && p1.querySelector('[data-obt-paper]'));
  assert.match(p2.querySelector('.obt-side').textContent, /They owe/);
  assert.ok(p2.querySelector('[data-obn-go="chase"]'), 'Chase now');
  assert.ok(p2.querySelector('[data-obt-contact="Juno Logistics"]'), 'no address: Add their contact, its own door');
});

test('f1099 (5) the page draws two columns, writes only the lines on a press, and both books carry the words', () => {
  const src = read('js/obligations.js');
  assert.match(src, /if\(_obnTab !== 'prop'\) return obnTwoRender\(host, book, projects, proposedN\);/);
  assert.match(src, /A PRESS THAT ONLY CHANGES WHICH LINES SHOW REDRAWS ONLY THE LINES/);
  assert.match(src, /oldList\.innerHTML = cols;/);
  const i18 = read('js/i18n.js');
  for (const k of ['obt_we_owe', 'obt_they_owe', 'obt_tab_next', 'obt_tab_later', 'obt_tab_done', 'obt_who_rem', 'obt_chase_now', 'obt_they_did', 'obt_add_contact', 'obt_b_late'])
    assert.equal((i18.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' in both books');
});

test('f1099 (6) a step held back by an earlier one is waiting, never late (the window decides, as the door and the reminders do)', () => {
  const { W, c } = world();
  const [ours] = rowsOf(W, c);
  const held = Object.assign({}, ours, { win: 'waiting' }), late = Object.assign({}, ours, { win: 'overdue' });
  assert.equal(W.obnIsLate(held), false);
  assert.equal(W.obnWhenWord(held).tone, 'ok');
  assert.match(W.obnWhenWord(held).t, /earlier step/);
  assert.equal(W.obnIsLate(late), true);
  assert.equal(W.obnTimelineFive([held]).title.includes('0 late'), true);
});
