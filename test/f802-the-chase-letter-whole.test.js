'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f802 — LOOK ON A CHASE SHOWS THE EMAIL WHOLE (round 23's gaps, 18 Oct 2026:
   the drawing's Look opens the letter — To, Subject, "Hello,", the reminder,
   signed "<name>, <company>" — and under it "It goes to the address on the
   contract. You are asked once more before it is sent.")
   (1) ONE LETTER, TWO HOSTS: js/sharemail.js's chaseMailOf writes it; the
       chase route sends it and the Counter's Look draws it. What the screen
       shows is what the inbox gets, word for word (the standing link, which
       only the server can find, is the one line the screen leaves out and
       says so on its hover).
   (2) The day in words, in the recipient's language — the screen printed the
       stored "2026-10-13" while the inbox got "13 October 2026".
   (3) Signed by the person who presses, for our company on this agreement
       (c.party, else the workspace); with nobody pressing, the automated
       notice stands where the name would.
   AT THE PARENT (8dc306a) every test here FAILS but 1a, the stage (the route
   sent both chases there too).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SRV = R('server/server.js');
const SM = (() => { try { return require('../js/sharemail.js'); } catch (_){ return {}; } })();
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const day = n => iso(n).slice(0, 10);

describe('f802 (1) the inbox and the screen say the same', () => {
  let h, W, sent = {}, shown = {};
  before(async () => {
    h = await H.startHati(); W = await H.seedWorkspace(h, { approvalRules: [] });
    const c = H.fixtureContract('MK-CL1', 'Supply agreement', 'Kettle & Co', H.FOLDER_A, 2.4e6, 'Signed', 'Words.');
    c.counterpartyEmail = 'insurance@kettle.example'; c.party = 'Highland Corporate Ltd';
    c.obligations = [{ id: 'ob-late', desc: 'the insurance certificate', due: day(-5), party: 'theirs', status: 'open' },
      { id: 'ob-firm', desc: 'the signed annex', due: day(-20), party: 'theirs', status: 'open', chasedAt: day(-9) }];
    await W.admin.json('/api/contracts/MK-CL1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    await W.admin.json('/api/contracts/MK-CL1/chase', { method: 'POST', body: { obligationId: 'ob-late' } });
    await W.admin.json('/api/contracts/MK-CL1/chase', { method: 'POST', body: { obligationId: 'ob-firm', firm: true } });
    const box = ((await W.admin.json('/api/outbox')).items || []).filter(m => m.to_addr === 'insurance@kettle.example');
    sent.first = box.find(m => /insurance certificate/.test(m.body)); sent.firm = box.find(m => /signed annex/.test(m.body));
    /* the screen: the page's own preview, on a stage signed in as the same person */
    const { buildWorld } = require('./world');
    const { win } = buildWorld({ agents: true, desk: true, user: { id: 'u_admin', name: 'Amina Otieno', role: 'admin', email: 'admin@example.co.ke' } });
    shown.first = win.agChaseMail ? win.agChaseMail(c, c.obligations[0]) : null;
    shown.firm = win.agChaseMail ? win.agChaseMail(c, c.obligations[1], true) : null;
  });
  after(async () => { await h.stop(); });
  test('1a the route sent it', () => { assert.ok(sent.first && sent.firm, 'two chases in the outbox'); });
  test('1b the screen\'s letter is the inbox\'s, word for word', () => {
    assert.ok(shown.first && sent.first);
    assert.equal(shown.first.subject, sent.first.subject);
    assert.equal(shown.first.body, sent.first.body);
  });
  test('1c the firmer one too', () => {
    assert.ok(shown.firm && sent.firm);
    assert.equal(shown.firm.subject, sent.firm.subject);
    assert.equal(shown.firm.body, sent.firm.body);
  });
  test('1d the day in words, signed by the person who pressed, for our company', () => {
    assert.match(sent.first.body, /^Hello,\n\nThis is a reminder about "the insurance certificate" under our agreement "Supply agreement" \(MK-CL1\), which was due on \d{1,2} [A-Z][a-z]+ \d{4}\. Could you let us know where it stands\?\n\nAmina Otieno, Highland Corporate Ltd$/);
    assert.doesNotMatch(sent.first.body, /automated notice/);
  });
  test('1e both hosts build from the one letter', () => {
    const at = SRV.indexOf('async function srvChaseSend(');
    assert.match(SRV.slice(at, SRV.indexOf('\napp.', at + 10)), /chaseMailOf\(\{ t: \(k, v\) => tFor\(L, k, v\), firm, dated: !!o\.due, soon, vars, link: link \|\| null,/);
    assert.match(R('js/views/agents.js'), /chaseMailOf\(\{ t: T, firm: !!firm, dated: !!\(o && o\.due\), soon, vars, link: null, sender: \(me && me\.name\) \|\| '', party \}\)/);
  });
});

describe('f802 (2) the letter\'s shape', () => {
  const T = (k, v) => k + (v && Object.keys(v).length ? JSON.stringify(v) : '');
  test('2a the standing link, where one stands, comes before the sign-off', () => {
    const m = SM.chaseMailOf({ t: T, dated: true, vars: { due: '13 October 2026' }, link: 'https://x/s/abc', sender: 'Amina Otieno', party: 'Highland' });
    assert.equal(m.body.split('\n\n').length, 4);
    assert.match(m.body, /\n\nmail_ob_chase_open\nhttps:\/\/x\/s\/abc\n\nAmina Otieno, Highland$/);
  });
  test('2b nobody pressing: the automated notice where the name would be', () => {
    const m = SM.chaseMailOf({ t: T, dated: false, vars: {}, link: null, sender: '', party: 'Highland' });
    assert.match(m.body, /mail_ob_chase_line_nodate\n\nmail_automated_notice$/);
  });
  test('2c not yet due is "is due on"; the firmer one has its own words', () => {
    assert.match(SM.chaseMailOf({ t: T, dated: true, soon: true, vars: {}, sender: 'A' }).body, /mail_ob_chase_line_soon/);
    assert.match(SM.chaseMailOf({ t: T, firm: true, dated: true, vars: {}, sender: 'A' }).subject, /mail_ob_chase_firm_subject/);
  });
});
