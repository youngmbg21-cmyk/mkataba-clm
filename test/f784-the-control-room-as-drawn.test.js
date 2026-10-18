'use strict';
/* f784 — THE CONTROL ROOM, AS DRAWN (round 25 "Control room", the gaps of
   18 Oct 2026)
     (1) the head "Settings · <the company>" and You · Company as tabs, the
         count on Company the length of Needs your attention
     (2) Needs your attention's count in its round tag
     (3) Jambo says the page in words: "Three things need you here: …",
         chips — the first row's own door, what to turn on next, who can open
         a private stream — and "I find any setting … A 'why' is an AI
         question: I say what it costs before you press."
     (4) the cards as drawn: People & access two facts, Your standards the
         company and the streams, Jambo with his day limit and his agents'
         level, Housekeeping's keeping and last trail download
   AT THE PARENT (8dc306a) every test here fails.
   Run: node --test test/f784-the-control-room-as-drawn.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { settingsStage, S } = require('./settingsworld.js');

const company = (opts = {}) => { const g = settingsStage(opts); g.sb.settingsGoTab('company'); return g; };
/* a fact as the reader sees it: its name, the CSS's "· ", its state */
const factSaid = (g, f) => { const n = f.querySelector('.st-fact-n'), st = f.querySelector('.st-fact-s'); return g.text(n) + (st && st.textContent.trim() ? ' · ' + g.text(st) : ''); };

describe('f784 (1) the head and the tabs', () => {
  test('1a "Settings · Highland Corporate Ltd"; You · Company as tabs with Company\'s count', () => {
    const g = company({ capOn: true, more: [{ id: 'u_x', name: 'Ann Holm', role: 'legal', email: 'a@h.t', prefs: { mustChangePassword: true } }] });
    assert.equal(g.text(g.$('page-head-facts')), 'Highland Corporate Ltd');
    const tabs = g.qa('#set-page .st-faces [data-st-tab]');
    assert.deepEqual(tabs.map(t => t.getAttribute('data-st-tab')), ['you', 'company']);
    const n = g.q('#set-page .st-face[data-st-tab="company"] .st-face-n');
    assert.equal(n.textContent, String(g.sb.stNeedsAll().length));
  });
});

describe('f784 (2) Needs your attention\'s count in its tag', () => {
  test('2a the round amber tag', () => {
    const g = company({ capOn: true, more: [{ id: 'u_x', name: 'Ann Holm', role: 'legal', email: 'a@h.t' }] });
    const tag = g.q('#st-att .st-needs-n');
    assert.ok(tag && tag.classList.contains('st-pill-n') && tag.classList.contains('is-amber'));
  });
});

describe('f784 (3) Jambo says the page', () => {
  test('3a what needs you, in words from the rows themselves', () => {
    const g = company({ capOn: true, more: [{ id: 'u_x', name: 'Ann Holm', role: 'legal', email: 'a@h.t', prefs: { mustChangePassword: true } }] });
    const rows = g.sb.stNeedsAll();
    assert.ok(rows.length >= 2);
    const hello = g.text(g.q('#st-jb-feed [data-st-jb-hello] .st-jb-bub'));
    assert.match(hello, new RegExp('^' + ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][rows.length - 1] + ' things need you here: '));
    assert.ok(hello.includes(g.sb.stJbNeedPhrase(rows[0])), 'each row said by what it is');
    assert.match(hello, /Each row’s button opens what settles it\.$/);
  });
  test('3b the chips: the first row\'s own door, what to turn on next, who can open a private stream', () => {
    const g = company({ capOn: true, more: [{ id: 'u_x', name: 'Ann Holm', role: 'legal', email: 'a@h.t' }],
      before: sb => { sb.state.settings.privateStreams = { mktg: { on: true, people: [{ id: 'u_two' }] } }; } });
    const chips = g.qa('#st-jb-feed .st-jb-chip');
    const first = g.sb.stNeedsAll()[0];
    assert.ok(chips[0].matches('[data-st-panel],[data-st-page],[data-st-resend]'), 'the first is the row\'s own door');
    assert.equal(chips[0].outerHTML.includes(first.btn.split('"')[1]), true);
    assert.equal(chips[1].textContent, 'what should I turn on next?');
    assert.match(chips[2].textContent, /^who can open Marketing & Brand\?$/);
    assert.equal(g.text(g.qa('#st-jb-feed .st-jb-bub')[1]), S.en.st_jb_co_how);
  });
  test('3d rows of one kind are said once, with their count', () => {
    const g = company();
    g.run(`stNeedsAll=()=>[{key:'clash:cap:u1',text:'a'},{key:'clash:pair:u1:u2',text:'b'},{key:'clash:rule:r1',text:'c'},{key:'clash:stream:s1',text:'d'},{key:'review',text:'e'}];
      stClashes=()=>[1,2,3,4];`);
    assert.equal(g.sb.stJbCompanyWords(), 'Five things need you here: a clash in who may sign what, three clashes in who may do what and the quarterly access review. Each row’s button opens what settles it. 4 of them are clashes in who may do what: they warn, nothing is blocked.');
  });
  test('3c the panel\'s head says what it holds', () => {
    const g = company();
    assert.equal(g.text(g.$('st-side-word')), S.en.st_side_company);
  });
});

describe('f784 (4) the cards as drawn', () => {
  test('4a People & access: "N people · N admin · N roles", then who has not taken up their invitation', () => {
    const g = company({ more: [{ id: 'u_x', name: 'Ann Holm', role: 'legal', email: 'a@h.t', prefs: { mustChangePassword: true } }],
      before: sb => { sb.state.bizRoles = { roles: [{ id: 'r1', name: 'Sales' }, { id: 'r2', name: 'Finance' }], of: {} }; } });
    const facts = g.qa('[data-st-card="people"] .st-fact').map(f => g.text(f));
    assert.deepEqual(facts, ['3 people · 1 admin · 2 roles', '1 invitation not accepted — Ann Holm']);
    assert.ok(g.qa('[data-st-card="people"] .st-fact .st-dot').length === 2, 'each with its dot');
  });
  test('4b Your standards: the company itself, the streams and how many are private', () => {
    const g = company({ before: sb => { sb.state.settings.privateStreams = { mktg: { on: true, people: [{ id: 'u_two' }] } }; } });
    const facts = g.qa('[data-st-card="standards"] .st-fact').map(f => g.text(f));
    assert.ok(facts.includes('Highland Corporate Ltd · Kenya · KES'), JSON.stringify(facts));
    assert.ok(facts.includes('6 streams · 1 private'), JSON.stringify(facts));
  });
  test('4c Jambo: on, and his day limit; his agents, how many and how far they go', () => {
    const g = company({ ai: true, agents: { agents: { a: { on: true, level: 'ask' }, b: { on: true, level: 'ask' } } },
      before: sb => { sb.state.aiCfg = { limits: { dailySpendLimit: 5 } }; } });
    const facts = g.qa('[data-st-card="copilot"] .st-fact').map(f => factSaid(g, f));
    assert.ok(facts.some(f => /^Jambo · On · \$5 a day at most$/.test(f)), JSON.stringify(facts));
    assert.ok(facts.some(f => /2 of 2 on, all Ask me first$/.test(f)), JSON.stringify(facts));
  });
  test('4d Housekeeping: keeping on N of M streams, and the last trail download, by whom', () => {
    const g = company({ before: sb => { sb.state.keeping = { rules: { sales: { years: 10, then: 'delete' } }, due: {} };
      vm(sb, `_stTr.list=[{ at:'2026-10-02T09:00:00Z', who:'Young Mbagaya', from:'2026-07-01', to:'2026-09-30', as:'pdf', acts:12 }]`); } });
    const facts = g.qa('[data-st-card="house"] .st-fact').map(f => factSaid(g, f));
    assert.deepEqual(facts, ['Keeping · 1 of 6 streams have a period', 'Last trail download · 2 Oct, by you']);
  });
});
const vm = (sb, code) => require('node:vm').runInContext(code, sb);
