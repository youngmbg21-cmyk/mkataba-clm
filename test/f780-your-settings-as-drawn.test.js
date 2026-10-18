'use strict';
/* f780 — YOUR SETTINGS, AS DRAWN (round 24 "One sheet", the gaps of 18 Oct
   2026: the owner's "build all the gaps")

   Every visible part of the picked drawing that the overnight build left out:
     (1) the head: "Your settings · yours alone — nobody else sees them" and
         Ask an admin for a member; "Settings · <the company>" for an admin
     (2) the contents list's words (Signing in, Jambo's points)
     (3) Who you are: Name · Change, Role "<role> · <access> — set by <who>"
         with Ask an admin, Email · Change
     (4) Signing in: the password's day, two-step, devices in words
     (5) Language, How you're told, How you like to work, points, Your data —
         each row's words as drawn; the Download is your own copy
     (6) whom you answer for, what of theirs waits now, and Open it
   AT THE PARENT (8dc306a) every test here fails but 5c: the chips row under
   his box was already drawn (kept, so a later change cannot lose it).
   The browser half: test/chromium/settings-as-drawn-verify.js.
   Run: node --test test/f780-your-settings-as-drawn.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { settingsStage, S } = require('./settingsworld.js');

const sec = (q, k) => q(`#set-page [data-st-you-card="${k}"]`);
const rowOf = (el, label) => [...el.querySelectorAll('.st-sr')].find(r => (r.querySelector('.st-sl') || {}).textContent === label) || null;

describe('f780 (1) the head says whose settings these are', () => {
  test('1a a member: "Your settings · yours alone — nobody else sees them", and Ask an admin', () => {
    const { q, text } = settingsStage({ role: 'legal' });
    assert.equal(text(q('#page-head-facts')), S.en.st_you_head_sub);
    const ask = q('#page-head-acts [data-st-ask-head]');
    assert.ok(ask, 'Ask an admin sits in the head');
    assert.equal(text(ask), S.en.st_ask_go);
  });
  test('1b an admin: "Settings · <the company>", no Ask an admin', () => {
    const { q, text } = settingsStage();
    assert.equal(text(q('#page-head-facts')), 'Highland Corporate Ltd');
    assert.equal(q('#page-head-acts [data-st-ask-head]'), null);
  });
  test('1c Ask an admin opens Jambo\'s ask card, the question the reader\'s to write; Ask sends the tracked ask', async () => {
    const { q, click, flush, log } = settingsStage({ role: 'legal', reply: r => r === 'settings-asks' ? { ok: true, ask: { id: 'ASK-1' } } : null });
    click(q('#page-head-acts [data-st-ask-head]'));
    const box = q('#st-jb-feed textarea[id^="st-ask-what-"]');
    assert.ok(box, 'a box for their question');
    box.value = 'May I sign up to KES 10 M?';
    click(q('#st-jb-feed [data-st-ask-admin]')); await flush();
    const sent = log.api.find(a => a.route === 'settings-asks' && a.method === 'POST');
    assert.ok(sent && sent.body.what === 'May I sign up to KES 10 M?', 'their words are the ask');
  });
});

describe('f780 (2) the contents list as drawn', () => {
  test('2a Signing in, Jambo\'s points', () => {
    const { qa } = settingsStage();
    const toc = qa('#set-page .st-toc [data-st-toc]').map(b => b.textContent);
    assert.ok(toc.includes(S.en.st_you_signin) && toc.includes(S.en.st_you_toc_points), JSON.stringify(toc));
  });
});

describe('f780 (3) Who you are', () => {
  test('3a Name · Change and Email · Change open in their row', () => {
    const { q } = settingsStage();
    const who = sec(q, 'who');
    assert.ok(rowOf(who, S.en.st_you_name_row).querySelector('[data-st-rform="me:name"]'));
    assert.ok(rowOf(who, S.en.st_you_email_row).querySelector('[data-st-rform="me:email"]'));
  });
  test('3b a member\'s Role: their business role · their access — set by who set it, with Ask an admin', () => {
    const { q, text } = settingsStage({ role: 'legal', me: { bizRole: 'Legal counsel', roleBy: 'Amina Otieno', title: 'Counsel' } });
    const role = rowOf(sec(q, 'who'), S.en.st_you_role);
    /* "— set by Sara" (as drawn): the admin's first name */
    assert.match(text(role.querySelector('.st-sv')), /^Legal counsel · Editor — set by Amina$/);
    assert.ok(role.querySelector('[data-st-ask-head="role"]'), 'Ask an admin about the role');
  });
  test('3c no record of who set it: "— set by an admin"; an admin\'s own row asks nobody', () => {
    const m = settingsStage({ role: 'legal' });
    assert.match(m.text(rowOf(sec(m.q, 'who'), S.en.st_you_role)), /— set by an admin/);
    const a = settingsStage();
    assert.equal(rowOf(sec(a.q, 'who'), S.en.st_you_role).querySelector('[data-st-ask-head]'), null);
  });
});

describe('f780 (4) Signing in', () => {
  test('4a the password\'s day, or that none is recorded', () => {
    const a = settingsStage({ me: { pwAt: '2026-08-02T09:00:00Z' } });
    assert.equal(a.text(rowOf(sec(a.q, 'safety'), S.en.st_you_password_row).querySelector('.st-sv')), 'Changed 2 Aug 2026');
    const b = settingsStage();
    assert.match(b.text(rowOf(sec(b.q, 'safety'), S.en.st_you_password_row)), new RegExp(S.en.st_you_pw_unknown));
  });
  test('4b devices in words: "2 signed in — this computer and an iPad"', () => {
    const { sb } = settingsStage();
    const said = sb.stDevicesSaid([{ current: true, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)' }, { current: false, ua: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Mobile' }]);
    assert.equal(said, '2 signed in — this computer and an iPad');
  });
  test('4c two-step and devices open in their row', () => {
    const { q } = settingsStage();
    assert.ok(sec(q, 'safety').querySelector('[data-st-rform="me:twostep"]'));
    assert.ok(sec(q, 'safety').querySelector('[data-st-rform="me:sessions"]'));
    assert.ok(sec(q, 'safety').querySelector('[data-st-rform="me:password"]'));
  });
});

describe('f780 (5) the rows\' words as drawn', () => {
  test('5a Dates and money names the market', () => {
    const { q, text } = settingsStage();
    assert.match(text(rowOf(sec(q, 'lang'), S.en.st_you_lang_money)), /Numbers and money follow the market: Kenya, KES\./);
  });
  test('5b How you\'re told: Daily brief, The bell, Email', () => {
    const { q } = settingsStage();
    const labels = [...sec(q, 'told').querySelectorAll('.st-sl')].map(x => x.textContent);
    assert.deepEqual(labels, [S.en.st_you_brief_row, S.en.st_you_bell_only, S.en.st_you_email_told]);
  });
  test('5c Jambo\'s suggestions: the chips under his box', () => {
    const { q, text } = settingsStage();
    assert.match(text(sec(q, 'work')), new RegExp(S.en.st_you_chips_box));
  });
  test('5d Jambo\'s points: "0 of 2 agents and readings — the rest use the company\'s", the table in its row', () => {
    const { q, text } = settingsStage();
    const p = sec(q, 'points');
    assert.match(text(p), /0 of 2 agents and readings — the rest use the company’s/);
    assert.ok(p.querySelector('[data-st-rform="me:points"]'));
  });
  test('5e Your data: "One file, to keep. The download is recorded." — your copy', () => {
    const { q, text } = settingsStage();
    const d = sec(q, 'data');
    assert.match(text(d), /One file, to keep\. The download is recorded\./);
    assert.ok(d.querySelector('[data-st-mycopy]'));
  });
});

describe('f780 (6) whom you answer for', () => {
  test('6a the line, what it covers, what of theirs waits now, and Open it', () => {
    const away = { today: '2026-10-16', mine: null, covering: [{ userId: 'u_two', userName: 'Asha Kimani', deputyId: 'u_me', from: '2026-10-12', to: '2026-10-23' }] };
    const { q, text, click, log } = settingsStage({ state: { away }, before: sb => { sb.apApprovalRows = () => [{ mine: true, waitsOn: 'Asha Kimani', c: { counterparty: 'Helio Energy' } }]; } });
    const cover = sec(q, 'away').querySelector('.st-aw-cover');
    assert.ok(cover, 'the line is drawn');
    assert.match(text(cover), /You answer for Asha Kimani until 23 Oct 2026\./);
    assert.match(text(cover), /Their approvals and internal reviews — never their signing\. 1 waits now: Helio Energy’s approval\./);
    click(cover.querySelector('[data-st-away-open]'));
    assert.deepEqual(log.views, ['approvals'], 'Open it lands on Approvals & signing');
  });
});

/* ---- THE SECOND PASS (18 Oct 2026): the checker's differences against the
   picked drawing, built. AT THE PARENT (8dc306a) every test below fails. ---- */
describe('f780 (7) the sheet as drawn: eight headings, and the list follows the reading', () => {
  test('7a an Editor\'s sheet has the eight drawn headings; Company design is found by its name, not a ninth', () => {
    const g = settingsStage({ role: 'legal' });
    assert.deepEqual(g.qa('#set-page [data-st-toc]').map(b => g.text(b)),
      ['st_you_away', 'st_you_who', 'st_you_signin', 'st_you_lang', 'st_you_told', 'st_you_work', 'st_you_toc_points', 'st_you_data'].map(k => S.en[k]));
    assert.equal(g.q('#set-page [data-st-you-card="design"]'), null, 'no Company design on the sheet');
    assert.ok(g.q('#st-list [data-st-you="design"]'), 'the Menu names it');
  });
  test('7b the contents list marks the heading being read as the sheet scrolls, and the last at the foot', () => {
    const g = settingsStage({ role: 'legal' });
    const sc = g.win.document.createElement('div'); sc.id = 'content-scroll'; g.win.document.body.appendChild(sc);
    Object.defineProperties(sc, { clientHeight: { value: 600 }, scrollHeight: { value: 3000 }, scrollTop: { value: 300, writable: true } });
    sc.getBoundingClientRect = () => ({ top: 0, height: 600, bottom: 600, left: 0, right: 900, width: 900 });
    const secs = g.qa('#set-page .st-you-board [data-st-you-card]');
    secs.forEach((s, i) => { s.getBoundingClientRect = () => ({ top: i * 400 - 300, height: 380, bottom: i * 400 + 80, left: 0, right: 600, width: 600 }); });
    sc.dispatchEvent(new g.win.Event('scroll'));
    const lit = () => g.text(g.q('#set-page [data-st-toc][aria-current="true"]'));
    assert.equal(lit(), g.text(g.q(`#set-page [data-st-toc="${secs[1].getAttribute('data-st-you-card')}"]`)), 'the second heading, read a third of the way down');
    sc.scrollTop = 2400;
    sc.dispatchEvent(new g.win.Event('scroll'));
    assert.equal(lit(), g.text(g.q(`#set-page [data-st-toc="${secs[secs.length - 1].getAttribute('data-st-you-card')}"]`)), 'at the foot of the page, the last');
  });
});
