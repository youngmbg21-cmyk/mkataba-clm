'use strict';
/* f786 — A STREAM BESIDE ITS LIST (round 26 "The SAP way" as drawn, the gaps
   of 18 Oct 2026: "press a row to see it in the side panel")
     (1) the list as drawn: "Streams N · press a row to see it in the side
         panel"; On hold; No period; a private stream that does not name the
         admin: "N named · not you", "not counted", dashes
     (2) a press CHOOSES: the side panel shows "<stream> · stream" — Who may
         open, Contracts, Kept after they end ("10 years, then listed to
         delete"), Due now ("2 contracts · ended before …"), On legal hold
         ("1 · held back"); the Due now table (a family counted); the held
         rows with Open and "never deleted or archived while held"
     (3) its acts: Delete these N — the keeping run's own route, asked once
         more; Change keeping — the stream's page on Keeping; Close — Jambo's
         words come back; the same row again lets it go; Enter opens the
         stream's page (the one door)
     (4) a shut stream says only what the admin may know; a refresh comes
         back to the stream shown
   AT THE PARENT (8dc306a) every test here fails.
   Run: node --test test/f786-a-stream-beside-its-list.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { settingsStage, S } = require('./settingsworld.js');

const BOOK = { rules: { sales: { years: 10, then: 'delete' } }, years: [1, 2, 3, 5, 7, 10],
  streams: { sales: { contracts: 6, cutoff: '2016-10-15', heldDue: 1,
    due: [{ id: 'MK-S1', ref: 'MK-S1', name: 'Distribution agreement', counterparty: 'Skane Retail Ltd', ended: '2015-03-31', family: [] },
      { id: 'MK-S2', ref: 'MK-S2', name: 'Agency agreement', counterparty: 'Norrland Trade Ltd', ended: '2015-06-30', family: ['MK-S2A'] }],
    held: [{ id: 'MK-S3', ref: 'MK-S3', name: 'Settlement agreement', counterparty: 'Vastkust Retail Ltd', ended: '2014-11-30', since: '2026-09-02T09:00:00Z', by: 'Amina Otieno' }] } } };
const streams = (opts = {}) => {
  const g = settingsStage({ ...opts, before: sb => { require('node:vm').runInContext(`_stKp.data=${JSON.stringify(BOOK)}`, sb);
    sb.state.settings.privateStreams = { mktg: { on: true, people: [{ id: 'u_two' }, { id: 'u_x' }] } }; if (opts.before) opts.before(sb); } });
  g.sb.settingsGoPage('streams');
  return g;
};
const pick = (g, fid) => g.click(g.q(`#set-page .st-sw-row[data-st-sw-pick="${fid}"]`));
const fact = (g, label) => { const f = [...g.qa('#st-jb-feed .st-swp-f')].find(x => g.text(x.querySelector('dt')) === label); return f ? g.text(f.querySelector('dd')) : null; };

describe('f786 (1) the list as drawn', () => {
  test('1a its head, its last column, and a private stream that does not name you', () => {
    const g = streams();
    assert.equal(g.text(g.q('.st-sw-card .st-card-sub')), S.en.st_sw_list_press);
    assert.equal(g.text(g.q('#st-sw-n')), '6');
    assert.equal(g.text([...g.qa('.st-sw-tb thead th')].pop()), S.en.st_sw_c_onhold);
    const priv = g.q('.st-sw-row[data-st-sw-pick="mktg"]');
    const cells = [...priv.querySelectorAll('td')].map(c => g.text(c));
    assert.equal(cells[1], '2 named · not you');
    assert.equal(cells[2], S.en.st_sw_not_counted);
    assert.equal(cells[4], '—'); assert.equal(cells[5], '—');
    assert.equal(g.text(g.q('.st-sw-row[data-st-sw-pick="proc"] td:nth-child(4)')), S.en.st_sw_no_period);
  });
});

describe('f786 (2) a press shows the stream beside the list', () => {
  test('2a the panel\'s head, the stream\'s facts as drawn', () => {
    const g = streams();
    pick(g, 'sales');
    assert.ok(g.q('.st-sw-row[data-st-sw-pick="sales"]').classList.contains('is-picked'), 'the row is lit');
    assert.equal(g.text(g.$('st-side-word')), 'Sales & Route-to-Market · stream');
    assert.equal(fact(g, 'Who may open'), 'Everyone given it · 3 people');
    assert.equal(fact(g, 'Kept after they end'), '10 years, then listed to delete');
    assert.equal(fact(g, 'Due now'), '2 contracts · ended before 15 Oct 2016');
    assert.equal(fact(g, 'On legal hold'), '1 · held back');
  });
  test('2b the Due now table, a family counted; the held row with Open', () => {
    const g = streams();
    pick(g, 'sales');
    const rows = g.qa('#st-jb-feed .st-swp-tb tbody tr').map(r => [...r.querySelectorAll('td')].map(c => g.text(c)).join(' | '));
    assert.deepEqual(rows, ['MK-S1 Distribution agreement | Skane Retail Ltd | 31 Mar 2015', 'MK-S2 Agency agreement · with 1 filed under it | Norrland Trade Ltd | 30 Jun 2015']);
    const held = g.q('#st-jb-feed .st-swp-held');
    assert.match(g.text(held), /MK-S3 Settlement agreement · Vastkust Retail Ltd/);
    assert.match(g.text(held), /Ended 30 Nov 2014 · on legal hold since 2 Sept? 2026 · Amina Otieno · never deleted or archived while held/);
    g.click(held.querySelector('[data-st-swp-open]'));
    assert.deepEqual(g.log.opened, ['MK-S3'], 'Open goes to the contract, where its hold is placed and released');
  });
});

describe('f786 (3) its acts', () => {
  test('3a Delete these 2: asked once more, then the keeping run\'s own route', async () => {
    const g = streams({ reply: (r, m) => r === 'keeping/sales/run' ? { done: ['MK-S1', 'MK-S2'], rules: BOOK.rules, streams: { sales: { contracts: 3, held: BOOK.streams.sales.held, due: [] } } } : null });
    pick(g, 'sales');
    const del = g.q('#st-jb-feed [data-st-swp-run="sales"]');
    assert.equal(g.text(del), 'Delete these 2');
    assert.ok(del.classList.contains('ui-btn-danger') && del.classList.contains('is-filled'));
    g.click(del); await g.flush(); await g.flush();
    assert.ok(g.log.confirm && g.log.confirm.danger, 'asked once more, as a danger');
    const run = g.log.api.find(a => a.route === 'keeping/sales/run');
    assert.ok(run && run.method === 'POST' && run.body.act === 'delete' && run.body.ids.join() === 'MK-S1,MK-S2');
  });
  test('3b no yes, nothing runs', async () => {
    const g = streams({ confirm: false });
    pick(g, 'sales');
    g.click(g.q('#st-jb-feed [data-st-swp-run="sales"]')); await g.flush();
    assert.ok(!g.log.api.some(a => /\/run$/.test(a.route)));
  });
  test('3c Change keeping opens the stream\'s own page on Keeping; Close and the same row let it go', () => {
    const g = streams();
    pick(g, 'sales');
    assert.ok(g.q('#st-jb-feed [data-st-panel="stream:sales@keeping"]'), 'Change keeping is the stream\'s own door');
    g.click(g.q('#st-jb-feed [data-st-swp-close]'));
    assert.equal(g.q('#st-jb-feed .st-swp'), null, 'Close: Jambo\'s words are back');
    assert.ok(g.q('#st-jb-feed [data-st-jb-hello]'));
    pick(g, 'sales'); pick(g, 'sales');
    assert.equal(g.q('#st-jb-feed .st-swp'), null, 'the same row again lets it go');
  });
  test('3d Enter on a row opens the stream\'s own page — the one door', () => {
    const g = streams();
    g.key(g.q('.st-sw-row[data-st-sw-pick="sales"]'), 'Enter');
    assert.ok(g.q('#st-drawer') && g.text(g.q('#st-dhead .rvd-title')) === 'Sales & Route-to-Market');
  });
});

describe('f786 (4) the wall, and a refresh', () => {
  test('4a a stream that does not name you: nothing of its contracts, the door to name yourself', () => {
    const g = streams();
    pick(g, 'mktg');
    assert.equal(fact(g, 'Contracts'), S.en.st_sw_not_counted);
    assert.equal(fact(g, 'Due now'), '—');
    assert.equal(g.text(g.q('#st-jb-feed .st-swp-shut')), S.en.st_swp_shut);
    assert.equal(g.q('#st-jb-feed .st-swp-tb'), null);
  });
  test('4b a refresh comes back to the stream shown', () => {
    const g = streams();
    pick(g, 'sales');
    const place = JSON.parse(JSON.stringify(g.sb.settingsPlace()));
    assert.equal(place.stream, 'sales');
    const h = settingsStage({ before: sb => { sb.settingsPlacePut(place); require('node:vm').runInContext(`_stKp.data=${JSON.stringify(BOOK)}`, sb); } });
    assert.ok(h.q('#st-jb-feed .st-swp[data-st-swp="sales"]'));
  });
});
