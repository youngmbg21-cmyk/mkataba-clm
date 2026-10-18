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

/* ---- THE SECOND PASS (18 Oct 2026): the checker's differences against the
   picked drawing, built. AT THE PARENT (8dc306a) every test below fails. ---- */
const LINA = () => [{ id: 'u_x', name: 'Ann Holm', role: 'legal', email: 'a@h.t', prefs: { mustChangePassword: true } },
  { id: 'u_y', name: 'Lina Ek', role: 'legal', email: 'l@h.t', signCap: 10000000, overseerId: 'u_z' },
  { id: 'u_z', name: 'Jonas Berg', role: 'legal', email: 'j@h.t', signCap: 5000000 }];
const roleBook = sb => { sb.state.bizRoles = { roles: [{ id: 'sales', name: 'Sales', sys: 'legal', cap: 5000000, values: true, streams: 'all', checked: false, paper: false, refile: false, hold: false }], of: { u_y: 'sales' } }; };

describe('f784 (5) the list, its "N more" and Jambo say the same number', () => {
  test('5a a row that leaves after the paint: the tag, "N more" and Jambo\'s first words follow it', () => {
    const g = company({ capOn: true, more: LINA() });
    const was = g.sb.stNeedsAll().length;
    assert.ok(was > 4, 'more rows than the list draws');
    /* Ann takes up her invitation: a row the list does not draw goes */
    g.sb.REMOTE.users.find(u => u.id === 'u_x').prefs = {};
    g.sb.stSyncAttention();
    const rows = g.sb.stNeedsAll().length, drawn = g.qa('#st-att .st-need[data-st-need]').length;
    assert.equal(rows, was - 1);
    assert.equal(g.text(g.q('#st-att .st-needs-n')), String(rows), 'the tag');
    assert.equal(g.text(g.q('#st-att .st-need-more')), S.en.st_needs_more_other.replace('{n}', rows - drawn), '"N more" is the rows the list holds and does not draw');
    assert.ok(g.text(g.q('#st-jb-feed [data-st-jb-hello] .st-jb-bub')).startsWith(S.en['st_num_' + rows] + ' things need you here'), 'Jambo says the same count');
  });
  test('5b his first chip is the first row\'s button, in plain words, never "verb: what"', () => {
    const g = company({ capOn: true, more: LINA() });
    const chip = g.q('#st-jb-feed .st-jb-chip');
    assert.equal(g.text(chip), 'open Lina Ek', 'as drawn');
    const solo = company({ capOn: true });
    const first = solo.sb.stNeedsAll()[0];
    assert.ok(first, 'a row to say');
    assert.doesNotMatch(solo.text(solo.q('#st-jb-feed .st-jb-chip')), /:/, 'no colon');
  });
  test('5c the quarterly access review\'s second line: "… reviewed · asked until the quarter is stamped"', () => {
    const g = company({ state: { accessReview: { quarter: '2026-Q4', people: ['u_me', 'u_two', 'u_x'], marks: { u_two: 'keep' }, done: null } } });
    const row = g.q('#st-att .st-need[data-st-need="review"]');
    assert.equal(g.text(row.querySelector('.st-need-s')), '1 of 3 reviewed · asked until the quarter is stamped');
    assert.equal(g.text(row.querySelector('.st-need-go')), S.en.st_ar_continue);
  });
});

describe('f784 (6) a clash: since when, whose drawer, the limit lit, back to the role', () => {
  test('6a "a clash in who may do what · since 14 Oct" from the day the server keeps; Open with the whole name', () => {
    const g = company({ capOn: true, more: LINA(), state: { clashSeen: { 'clash:cap:u_y': '2026-10-14' } } });
    const row = g.q('#st-att .st-need[data-st-need="clash:cap:u_y"]');
    assert.equal(g.text(row.querySelector('.st-need-s')), 'a clash in who may do what · since 14 Oct');
    const go = row.querySelector('.st-need-go');
    assert.equal(g.text(go), 'Open Lina Ek');
    assert.equal(go.getAttribute('data-st-focus'), '#tm-cap', 'the limit that clashes is lit');
  });
  test('6b the page tells the server the clashes it sees, only when that set moved', () => {
    const g = company({ capOn: true, more: LINA(), state: { clashSeen: {} },
      reply: (route, method, body) => route === 'clashes/seen' ? { seen: Object.fromEntries(body.keys.map(k => [k, '2026-10-16'])) } : null });
    const told = g.log.api.filter(a => a.route === 'clashes/seen');
    assert.equal(told.length, 1); assert.deepEqual([...told[0].body.keys], ['clash:cap:u_y']);
    const quiet = company({ capOn: true, more: LINA(), state: { clashSeen: { 'clash:cap:u_y': '2026-10-14' } } });
    assert.equal(quiet.log.api.filter(a => a.route === 'clashes/seen').length, 0, 'nothing moved, nothing is sent');
  });
  test('6c her drawer says the clash and its two ways forward; "Back to Lina\'s role" beside Save puts the role\'s limit back', () => {
    const g = company({ capOn: true, more: LINA(), before: roleBook });
    g.sb.settingsPersonDrawer('u_y');
    assert.equal(g.text(g.q('#st-dbody .st-clash-say')), 'A clash: Lina may sign more than the person who approves first, Jonas Berg. Lower the limit to the role’s KES 5M, or name an approver who signs up to KES 10M.');
    const acts = g.qa('#st-dfoot .st-dfoot-acts > button').map(b => b.id || b.getAttribute('data-st-dclose') != null && 'cancel');
    assert.deepEqual(acts, ['st-dsave', 'tm-bz-back', 'cancel'], 'Save, then Back to her role, Cancel last');
    const back = g.$('tm-bz-back');
    assert.equal(g.text(back), 'Back to Lina’s role'); assert.equal(back.hidden, false, 'shown: the drawer holds more than the role gives');
    g.click(back);
    assert.equal(g.$('tm-cap').value, '5000000', 'the role\'s limit, in the drawer — saved only on Save');
    assert.equal(g.$('tm-bz-back').hidden, true, 'nothing more than the role now');
    assert.equal(g.log.api.filter(a => /^users\//.test(a.route)).length, 0, 'nothing written');
  });
});

describe('f784 (7) the cards: the drawing\'s facts and doors', () => {
  const doorsOf = (g, k) => g.qa(`[data-st-card="${k}"] .st-card-doors .st-door`).map(d => g.text(d).replace(/ ›$/, ''));
  const factsOf = (g, k) => g.qa(`[data-st-card="${k}"] .st-card-facts .st-fact`).map(f => g.text(f.querySelector('.st-fact-n')));
  test('7a Before anyone signs, The agreement, Links you send', () => {
    /* reviewChecked is js/review.js's one reading, published there */
    const g = company({ reviewOn: true, more: [{ id: 'u_v', name: 'Vic Viewer', role: 'viewer', email: 'v@h.t' }],
      before: sb => { sb.reviewChecked = u => !u || u.reviewChecked !== false; } });
    assert.deepEqual(doorsOf(g, 'signing'), ['Everyone’s signing limits', 'Who may sign in which stream']);
    assert.deepEqual(factsOf(g, 'agreement'), [S.en.st_p_approvals, S.en.st_p_review]);
    assert.match(g.text(g.q('[data-st-card="agreement"] .st-fact[data-st-panel="review"]')), /2 people checked$/, 'everyone but a viewer, as the sheet counts');
    assert.deepEqual(doorsOf(g, 'agreement').slice(-1), [S.en.st_p_desk]);
    assert.ok(!doorsOf(g, 'agreement').includes(S.en.st_p_review), 'Internal review is a fact, not a door');
    assert.deepEqual(factsOf(g, 'links'), [S.en.set_link_code]);
    assert.deepEqual(doorsOf(g, 'links'), ['Link settings']);
  });
  test('7b Jambo, Housekeeping, Going live & plumbing', () => {
    const g = company();
    assert.deepEqual(doorsOf(g, 'copilot'), ['Jambo’s agents', S.en.st_p_boardwords || doorsOf(g, 'copilot')[1]]);
    assert.equal(g.q('[data-st-card="copilot"] .st-door').getAttribute('data-st-view'), 'jambo', 'his agents\' page, the house');
    const house = g.qa('[data-st-card="house"] .st-door');
    assert.deepEqual(house.map(d => g.text(d).replace(/ ›$/, '')), ['The trail', 'Data & backup', 'Monthly report']);
    assert.equal(house[1].getAttribute('data-st-page'), 'data');
    const live = factsOf(g, 'live');
    assert.equal(live[1], 'Email delivery');
    assert.equal(g.text(g.q('[data-st-card="live"] .st-fact[data-st-panel="mail"] .st-fact-s')), 'working');
    assert.deepEqual(doorsOf(g, 'live'), ['Email & outbox', S.en.set_integrity_title]);
  });
  test('7c Who holds what: short money, and the admin\'s own row is the name', () => {
    const g = company({ capOn: true, more: LINA(), before: roleBook });
    const lina = g.q('#st-sheet-card .st-sh-row[data-st-panel="person:u_y"] td:nth-child(3)');
    assert.equal(g.text(lina), 'KES 10M · role gives KES 5M');
    assert.equal(g.text(g.q('#st-sheet-card .st-sh-row[data-st-panel="person:u_me"] .st-sh-who')), 'Young Mbagaya');
  });
});
