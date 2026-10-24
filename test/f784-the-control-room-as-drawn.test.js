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
    /* RE-POINTED (third pass): the head is a card in the left column */
    assert.equal(g.text(g.q('#st-headcard [data-st-head-sub]')), 'Highland Corporate Ltd');
    const tabs = g.qa('#st-headcard .st-faces [data-st-tab]');
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
    /* RE-POINTED (third pass): his words are the drawing's, nothing after
       them — the clash rows say themselves that they warn */
    assert.equal(g.sb.stJbCompanyWords(), 'Five things need you here: a clash in who may sign what, three clashes in who may do what and the quarterly access review. Each row’s button opens what settles it.');
  });
  /* RE-PINNED (owner, 24 Oct 2026, one window where there is nothing else to show): the panel holds only his
     words, so its head draws no Overview / Jambo tabs and no word beside them */
  test('3c the panel\'s head draws no tabs and no word: it is one window', () => {
    const g = company();
    assert.equal(g.$('st-side-word'), null);
    /* his one tab "Jambo", his sign and name (owner, 24 Oct 2026: "bring them back") */
    assert.deepEqual(g.qa('#st-side-head .st-side-tab').map(t => g.text(t)), ['Jambo']);
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
      before: sb => { sb.state.aiCfg = { limits: { dailySpendLimit: 5, dailyLimit: 5000 } }; } });
    const facts = g.qa('[data-st-card="copilot"] .st-fact').map(f => factSaid(g, f));
    /* RE-POINTED (third pass, owner's answer 4): his day limit in CALLS,
       never money */
    assert.ok(facts.some(f => /^Jambo · On · 5,000 calls a day at most$/.test(f)), JSON.stringify(facts));
    assert.ok(!facts.some(f => /\$/.test(f)), 'no money: ' + JSON.stringify(facts));
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
  /* RE-POINTED (third pass): the server finds the clashes itself; the page
     only asks it to look again when a clash it shows has no day — and sends
     no list */
  test('6b the page asks the server to look again only when a clash it shows has no day', () => {
    const g = company({ capOn: true, more: LINA(), state: { clashSeen: {} },
      reply: route => route === 'clashes/seen' ? { seen: { 'clash:cap:u_y': '2026-10-16' } } : null });
    const told = g.log.api.filter(a => a.route === 'clashes/seen');
    assert.equal(told.length, 1); assert.equal(told[0].body.keys, undefined, 'no list is sent');
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
    /* RE-POINTED (third pass): every card door opens its page with ‹ Settings
       — the agents' own page, not his house */
    const ag = g.q('[data-st-card="copilot"] .st-door');
    assert.equal(ag.getAttribute('data-st-panel'), 'agents'); assert.ok(ag.hasAttribute('data-st-dock'), 'a page on the desk');
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

/* ---- THE THIRD PASS (19 Oct 2026): the checker's differences after main
   moved on, built. AT THE PARENT (5aea3f2, main merged in, before this pass)
   every test below fails. ---- */
const fs3 = require('node:fs');
const path3 = require('node:path');
const HTML3 = fs3.readFileSync(path3.join(__dirname, '..', 'index.html'), 'utf8');
describe('f784 (8) the third pass: the frame, every card door a page, the facts, his words', () => {
  test('8a the head card leads the left column; Jambo\'s panel is the right column, the whole window tall', () => {
    const g = company();
    const left = g.q('#set-page .st-cr-cols > .st-cr-left');
    assert.ok(left && left.firstElementChild.id === 'st-headcard', 'the head card in the left column');
    assert.ok(g.q('#st-headcard .st-facebar .st-faces'), 'the You · Company tabs inside it');
    const wide = /@media \(min-width:981px\)\{([\s\S]*?)\n  \}/.exec(HTML3.slice(HTML3.indexOf('THE FRAME, AS DRAWN (rounds 24 and 25')));
    assert.ok(wide, 'the frame from 981px');
    assert.match(wide[1], /\.st-cr \.st-side\{ top:0; margin:calc\(-1 \* var\(--page-pad-t\)\) calc\(-1 \* var\(--page-pad-x\)\) 0 0;/);
    assert.match(wide[1], /border-left:1px solid var\(--color-divider\); border-radius:0;/);
    assert.match(fnBody3('stSideFit'), /matchMedia\('\(min-width:981px\)'\)[\s\S]*sc\.clientHeight/, 'its height is the scroller\'s own');
  });
  test('8b every panel door on a card, the ladder\'s and Add member open the panel as a PAGE with ‹ Settings; ‹ Settings lands back on the door', async () => {
    const landed = [];
    const g = company({ capOn: true, more: LINA(), before: sb => { sb.landOn = (t, o) => { landed.push(typeof t === 'function' ? t() : t); return Promise.resolve(null); }; } });
    const doors = g.qa('#set-page [data-st-card] .st-door[data-st-panel]').filter(d => !['trail', 'backup'].includes(d.getAttribute('data-st-panel')));
    assert.ok(doors.length >= 12 && doors.every(d => d.hasAttribute('data-st-dock')), doors.map(d => d.getAttribute('data-st-panel')).join(','));
    assert.ok(g.q('[data-st-card="people"] .st-door[data-st-panel="person:new"][data-st-dock]'), 'Add member');
    g.click(g.q('[data-st-card="signing"] .st-door[data-st-panel="limits"]'));
    const pg = g.q('#set-page[data-st-sub="panel"]');
    assert.ok(pg, 'a page at its own name');
    const dr = g.q('#st-dock > #st-drawer');
    assert.ok(dr && dr.classList.contains('is-docked') && dr.classList.contains('open') && !dr.hidden, 'the one drawer, docked in the page');
    assert.ok(g.q('#st-dock #st-lim-u_y'), 'its own body — everyone\'s limits');
    assert.equal(g.text(g.q('#set-page .st-pg-back')), '‹ ' + S.en.pg_team, '‹ Settings is the way back');
    assert.equal(g.$('st-side-word'), null, 'one window: Jambo\'s head names nothing (owner, 24 Oct 2026)');
    g.click(g.q('#set-page .st-pg-back')); await g.flush();
    assert.equal(g.q('#set-page[data-st-sub]'), null, 'back on the board');
    assert.ok(g.$('st-drawer').hidden && g.$('st-drawer').parentElement === g.win.document.body, 'the drawer put away');
    assert.ok(landed.some(el => el && el.getAttribute && el.getAttribute('data-st-panel') === 'limits' && el.classList.contains('st-door')), 'landed on the door that was pressed');
  });
  test('8c Done on a docked page goes back to Settings; Needs your attention\'s own buttons keep the drawer', () => {
    const g = company({ capOn: true, more: LINA() });
    g.click(g.q('[data-st-card="links"] .st-door[data-st-panel="linkcode"]'));
    assert.ok(g.q('#st-dock #st-drawer.is-docked'));
    g.click(g.q('#st-dfoot [data-st-dclose]'));
    assert.equal(g.q('#set-page[data-st-sub]'), null);
    g.click(g.q('#st-att .st-need[data-st-need^="clash:cap:"] .st-need-go'));
    const dr = g.$('st-drawer');
    assert.ok(dr.classList.contains('open') && !dr.classList.contains('is-docked') && dr.parentElement === g.win.document.body, '"Open Lina Ek" opens her drawer, as drawn');
  });
  test('8d a refresh brings the docked page back', () => {
    const g = company();
    g.click(g.q('[data-st-card="copilot"] .st-door[data-st-panel="agents"]'));
    const place = g.sb.settingsPlace();
    assert.deepEqual([place.page, place.dock], ['panel', 'agents']);
    const h = settingsStage({ before: sb => sb.settingsPlacePut(place) });
    assert.ok(h.q('#st-dock #st-drawer.is-docked'), 'docked again after the refresh');
  });
  test('8e "Signing limits · On, N people capped"', () => {
    const g = company({ capOn: true, more: LINA() });
    const f = g.qa('[data-st-card="signing"] .st-fact').map(x => factSaid(g, x));
    assert.ok(f.includes('Signing limits · On, 2 people capped'), JSON.stringify(f));
    for (const lang of ['en', 'sv']) for (const k of ['st_cf_capped_one', 'st_cf_capped_other', 'st_cf_day_calls_one', 'st_cf_day_calls_other']) assert.equal(typeof S[lang][k], 'string', k + ' ' + lang);
  });
  test('8f his first words are the drawing\'s: the list, then "Each row\'s button opens what settles it." and nothing after', () => {
    const g = company({ capOn: true, more: LINA() });
    const w = g.text(g.q('#st-jb-feed [data-st-jb-hello] .st-jb-bub'));
    assert.match(w, /Each row’s button opens what settles it\.$/);
    assert.doesNotMatch(w, /warns|nothing is blocked/);
    assert.equal(S.en.st_jb_np_unseen, 'contracts no admin can see waiting in {stream}', 'a stream is named "in <stream>", as drawn');
  });
});
function fnBody3(name){ const SRC = fs3.readFileSync(path3.join(__dirname, '..', 'js', 'views', 'settings.js'), 'utf8'); const i = SRC.search(new RegExp('function ' + name + '\\(')); return i < 0 ? '' : SRC.slice(i, SRC.indexOf('\n}', i) + 2); }

/* ---- THE GAPS' FOURTH PASS (19 Oct 2026): every door to a company panel is
   its page, finishing round 25's "every door opens a page with ‹ Settings".
   The third pass docked the cards' doors only; a panel with no door on any
   card (reached by the Menu, ⌘K or Jambo) still opened as the old drawer
   over a dimmed page. AT THE PARENT (019b635) every test here fails (9d
   because the reading, stDockable, is new; a member was never docked). ---- */
describe('f784 (9) the Menu\'s rows, ⌘K, Jambo\'s Open and a named door open the panel as a page', () => {
  const cardKeys = g => new Set(g.qa('#set-page [data-st-card] [data-st-panel]').map(d => d.getAttribute('data-st-panel')));
  const docked = g => { const dr = g.q('#st-dock > #st-drawer'); return !!(dr && dr.classList.contains('is-docked') && dr.classList.contains('open') && !dr.hidden && g.q('#set-page[data-st-sub="panel"]')); };
  test('9a a Menu row for a panel with no door on any card opens its page; ‹ Settings lands back on that row', async () => {
    const landed = [];
    const g = company({ before: sb => { sb.landOn = (t, o) => { landed.push(typeof t === 'function' ? t() : t); return Promise.resolve(null); }; } });
    const onCards = cardKeys(g);
    g.sb.stSideSet('menu');
    const row = g.qa('#set-page .st-mrow[data-st-panel]').find(r => { const k = r.getAttribute('data-st-panel'); return !onCards.has(k) && g.sb.SET_PANELS[k] && !['trail', 'backup'].includes(k); });
    assert.ok(row, 'a panel only the Menu reaches');
    const k = row.getAttribute('data-st-panel');
    g.click(row);
    assert.ok(docked(g), k + ': docked as a page, not the drawer over the page');
    assert.ok(g.$('st-scrim') == null || g.$('st-scrim').hidden, 'no dimmed page behind it');
    assert.equal(g.text(g.q('#set-page .st-pg-back')), '‹ ' + S.en.pg_team, '‹ Settings is the way back');
    g.click(g.q('#set-page .st-pg-back')); await g.flush();
    assert.equal(g.q('#set-page[data-st-sub]'), null, 'back on the board');
    assert.ok(landed.some(el => el && el.getAttribute && el.getAttribute('data-st-panel') === k && el.classList.contains('st-mrow')), 'landed on the Menu row that was pressed');
  });
  test('9b ⌘K\'s row and a door from another page (openSettingsAt) open the panel as its page; a person keeps the drawer', () => {
    const g = company();
    g.sb.stFindGo('panel:webhooks');
    assert.ok(docked(g) && g.sb.settingsPlace().dock === 'webhooks', '⌘K: the page');
    g.click(g.q('#st-dfoot [data-st-dclose]'));
    assert.equal(g.q('#set-page[data-st-sub]'), null, 'Done goes back to Settings');
    g.sb.openSettingsAt('build', 'engine');
    assert.ok(docked(g) && g.sb.settingsPlace().dock === 'engine', 'a named door from elsewhere: the page');
    g.sb.stFindGo('person:u_two');
    const dr = g.$('st-drawer');
    assert.ok(dr.classList.contains('open') && !dr.classList.contains('is-docked') && dr.parentElement === g.win.document.body, 'a person opens their drawer, as drawn');
  });
  test('9c Jambo\'s Open on a setting he found opens its page; the trail and the backup stay Data & backup\'s page', () => {
    const g = company();
    g.sb.stJbAsk('events out');
    const open = g.q('#st-jb-feed [data-st-jb-turn] .st-jb-card [data-st-panel="webhooks"]');
    assert.ok(open, 'Jambo found it: ' + g.text(g.$('st-jb-feed')).slice(-200));
    g.click(open);
    assert.ok(docked(g), 'his Open: the page');
    assert.equal(g.sb.stDockable('trail'), false); assert.equal(g.sb.stDockable('backup'), false);
    assert.equal(g.sb.stDockable('person:u_two'), false); assert.equal(g.sb.stDockable('ask:a1'), false);
    assert.equal(g.sb.stDockable('limits'), true); assert.equal(g.sb.stDockable('gates'), true);
  });
  test('9d a member: no Company page to dock on', () => {
    const g = settingsStage({ role: 'legal' });
    assert.equal(g.sb.stDockable('webhooks'), false);
  });
});
