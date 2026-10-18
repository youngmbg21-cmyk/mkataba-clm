'use strict';
/* f785 — THE LADDER AND WHO HOLDS WHAT, AS DRAWN (round 25 "Control room",
   the gaps of 18 Oct 2026)
     (1) the ladder: one rung a line, its gates in one line, the next one to
         turn on marked "(next)"; the head says "next: <it>" and carries its
         door at the right
     (2) Who holds what on the board: its count in a tag, "the access sheet ·
         a row opens that person, their role at the top", "See all N people"
         at the head's right; everyone in order, admins too, six at most
     (3) its cells as drawn: "any amount · admins are never capped"; a limit
         above what the business role gives, red, with "role gives …"; "away
         until … · <who> answers"; "N of M · not named on <private stream>";
         the role column the business role, else the job title
   AT THE PARENT (8dc306a) every test here fails.
   Run: node --test test/f785-the-ladder-and-the-sheet-as-drawn.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { settingsStage, S } = require('./settingsworld.js');

const company = (opts = {}) => { const g = settingsStage(opts); g.sb.settingsGoTab('company'); return g; };

describe('f785 (1) the ladder, one rung a line', () => {
  test('1a the head says what is next, its door at the right; the next gate is marked', () => {
    const g = company();
    const next = g.sb.stGovNext();
    assert.ok(next, 'something is off in a fresh workspace');
    const head = g.q('#st-gov .st-card-h');
    assert.match(g.text(head), new RegExp('next: ' + g.sb.SET_PANELS[next].title().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.ok(head.querySelector('.st-door[data-st-panel="gates"]'), 'What to turn on next, in the head');
    const marked = g.qa('#st-gov .st-gov-g.is-next');
    assert.equal(marked.length, 1);
    assert.equal(marked[0].getAttribute('data-st-panel'), next);
    assert.match(g.text(marked[0]), /\(next\)/);
    assert.equal(g.q('#st-gov .st-gov-nextline'), null, 'no separate "Next to turn on" line');
  });
});

describe('f785 (2) Who holds what on the board', () => {
  test('2a its count, its words, See all at the right; everyone in order, admins too, six at most', () => {
    const more = Array.from({ length: 6 }, (_, i) => ({ id: 'u_m' + i, name: 'Member ' + i, role: 'legal', email: `m${i}@h.t` }));
    const g = company({ more });
    const card = g.q('#st-sheet-card');
    assert.equal(g.text(card.querySelector('.st-card-h .st-pill-n')), '8');
    assert.match(g.text(card.querySelector('.st-card-h')), new RegExp(S.en.st_sh_sub2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.ok(card.querySelector('.st-card-h .st-door[data-st-page="sheet"]'));
    const rows = [...card.querySelectorAll('.st-sh-row')].map(r => r.getAttribute('data-st-panel'));
    assert.deepEqual(rows, ['person:u_me', 'person:u_two', 'person:u_m0', 'person:u_m1', 'person:u_m2', 'person:u_m3']);
  });
});

describe('f785 (3) its cells as drawn', () => {
  test('3a an admin may sign any amount; admins are never capped', () => {
    const g = company();
    const cell = g.q('#st-sheet-card .st-sh-row[data-st-panel="person:u_me"] td:nth-child(3)');
    assert.equal(g.text(cell.firstChild), 'any amount');
    assert.equal(g.text(cell.querySelector('.st-sh-sub')), 'admins are never capped');
    assert.ok(cell.querySelector('.st-sh-sub'));
  });
  test('3b a limit above what the business role gives is red, and says what the role gives', () => {
    const g = company({ capOn: true, otherIs: { signCap: 10000000 },
      before: sb => { sb.state.bizRoles = { roles: [{ id: 'sales', name: 'Sales', sys: 'legal', cap: 5000000 }], of: { u_two: 'sales' } }; } });
    const row = g.q('#st-sheet-card .st-sh-row[data-st-panel="person:u_two"]');
    assert.ok(row.querySelector('.st-sh-over'), 'red');
    assert.match(g.text(row.querySelector('td:nth-child(3)')), /^KES 10,000,000 · role gives KES 5,000,000$/);
    assert.equal(g.text(row.querySelector('td:nth-child(2)')), 'Sales', 'the role column is the business role');
  });
  test('3c away, and who answers, under the name', () => {
    const g = company({ state: { away: { today: '2026-10-16', mine: null, covering: [], everyone: [{ userId: 'u_two', userName: 'Asha Kimani', deputyId: 'u_me', deputyName: 'Young Mbagaya', from: '2026-10-12', to: '2026-10-23' }] } } });
    const who = g.q('#st-sheet-card .st-sh-row[data-st-panel="person:u_two"] .st-sh-who');
    assert.equal(g.text(who.querySelector('.st-sh-away')), 'away until 23 Oct 2026 · Young answers');
  });
  test('3d streams: "N of M", and the private ones that do not name them, by name', () => {
    const g = company({ before: sb => { sb.state.settings.privateStreams = { mktg: { on: true, people: [{ id: 'u_two' }] } }; } });
    const me = g.q('#st-sheet-card .st-sh-row[data-st-panel="person:u_me"]');
    const cells = me.querySelectorAll('td');
    assert.match(g.text(cells[cells.length - 1]), /not named on Marketing & Brand$/);
  });
  test('3e the role column: the job title where there is no business role', () => {
    const g = company({ otherIs: { title: 'Commercial lead' } });
    assert.equal(g.text(g.q('#st-sheet-card .st-sh-row[data-st-panel="person:u_two"] td:nth-child(2)')), 'Commercial lead');
  });
});
