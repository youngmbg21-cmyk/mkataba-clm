'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f921 — "SENT AS: A COLLEAGUE" ON THE ONE SEND SCREEN (owner picked "The Send
   Screen" by name, 20 Oct 2026: "We already have a send email share feature
   to send emails. Why create a new feature when you can use the share
   feature")

   (1) ONE LETTER, BOTH HOSTS: passMailOf (js/sharemail.js) writes the
       colleague's email — "Hello Young,", the note, who sent what, "Open
       MK-1 in HaTi" over the app's own link, "No guest link is made", the
       sign-off; Jambo's summary names itself in the subject.
   (2) THE ONE DOOR: the existing pass route mails that letter (a link into
       the app, never a share token), holds a note of PASS_NOTE_MAX and
       REFUSES a longer one with its numbers, mailing nothing.
   (3) THE SCREEN: "colleague" is a purpose; its Send presses the pass route
       through caPassSend — the same function Jambo's card presses — before
       any of the other side's checks; the browser's note cap is the route's.
   (4) BOTH BOOKS carry every new word.
   AT THE PARENT (f668bbb) every part fails: no passMailOf, a 600-character
   note trimmed unsaid, no colleague purpose.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHatiWithMail, seedWorkspace } = require('./helpers');
const R = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
const SM = require('../js/sharemail.js');

describe('f921 (1) — one letter, both hosts', () => {
  const EN = { mail_hello: 'Hello', mail_pass_line: '{who} sent you {ref} · {name} in HaTi.', mail_pass_line_review: '{who} asked you to review {ref} · {name} in HaTi.',
    mail_pass_btn: 'Open {ref} in HaTi', mail_pass_inside: 'This opens the contract inside HaTi. No guest link is made.',
    mail_pass_subject: '{who} sent you {name}', mail_pass_subject_jambo: "{ref}: Jambo's summary, from {who}" };
  const t = (k, v) => String(EN[k] || k).replace(/\{(\w+)\}/g, (m, x) => (v && v[x] != null ? v[x] : m));
  test('1a the letter as drawn: Hello, the note, the button over the app link, the line, the sign-off', () => {
    const M = SM.passMailOf({ t, sender: 'Young Mbagaya', title: 'CEO', org: 'Young', recName: 'Grace Njeri', ref: 'MK-451', cName: 'Professional Services',
      note: 'Fixed fee SEK 4,800,000.', link: 'https://app.example/#contract=MK-451&tab=terms', fromJambo: true });
    assert.deepEqual(M.parts.map(p => p.k), ['hello', 'msg', 'say', 'btn', 'link', 'say', 'foot']);
    assert.equal(M.parts[0].t, 'Hello Grace,');
    assert.equal(M.subject, "MK-451: Jambo's summary, from Young");
    assert.match(M.body, /^Hello Grace,\n\nFixed fee SEK 4,800,000\.\n\nYoung Mbagaya sent you MK-451 · Professional Services in HaTi\.\n\nOpen MK-451 in HaTi:\nhttps:\/\/app\.example\/#contract=MK-451&tab=terms\n\nThis opens the contract inside HaTi\. No guest link is made\.\n\nYoung Mbagaya · CEO · Young$/);
    assert.match(M.html, /<a href="https:\/\/app\.example\/#contract=MK-451&amp;tab=terms"[^>]*>Open MK-451 in HaTi<\/a>/);
  });
  test('1b no note, no note part; not from Jambo, the pass route\'s own subject; a code-named deal by its code', () => {
    const M = SM.passMailOf({ t, sender: 'Young Mbagaya', recName: 'Grace', ref: 'MK-9', cName: 'Real Name', code: 'Project Falcon' });
    assert.ok(!M.parts.some(p => p.k === 'msg'));
    assert.equal(M.subject, 'Young Mbagaya sent you Project Falcon (MK-9)');
    assert.ok(!/Real Name/.test(M.body));
  });
  test('1c the screen draws the same function the route mails', () => {
    const CORE = code(R('js/core.js')), SRV = code(R('server/server.js'));
    assert.match(CORE, /s\.purpose==='colleague'[\s\S]{0,200}passMailOf\(/);
    assert.match(SRV, /const M = passMailOf\(\{ t: \(k, v\) => tFor\(L, k, v\)/);
    assert.match(SRV, /sendEmail\(to, M\.subject, M\.body, `pass: \$\{req\.params\.id\} -> \$\{to\}`, \{ html: M\.html \}\)/);
  });
});

describe('f921 (2) — the one door: the pass route', () => {
  let h, W;
  before(async () => { h = await startHatiWithMail({}, { HATI_AGENTS_AUTO: 'off' }); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); });
  test('2a a note past PASS_NOTE_MAX is refused with its numbers, and nothing is mailed', async () => {
    const before = h.mail.sent.length;
    const r = await W.admin.raw('/api/contracts/MK-B2/pass', { method: 'POST', body: { memberId: W.users.unrestricted.id, note: 'x'.repeat(SM.PASS_NOTE_MAX + 1) } });
    assert.equal(r.status, 400);
    assert.equal(h.mail.sent.length, before);
  });
  test('2b a long summary is mailed whole, with the app link and no guest link; History names the send screen', async () => {
    const note = 'Clause 8 governs money. '.repeat(40).trim();
    assert.ok(note.length > 600 && note.length <= SM.PASS_NOTE_MAX);
    const r = await W.admin.json('/api/contracts/MK-B2/pass', { method: 'POST', body: { memberId: W.users.unrestricted.id, note, fromJambo: true, door: 'send' } });
    assert.ok(r.ok && r.asked && r.emailSent, JSON.stringify(r));
    const m = h.mail.sent[h.mail.sent.length - 1];
    assert.equal(m.to, 'everything@example.co.ke');
    assert.match(m.subject, /^MK-B2: Jambo's summary, from Amina$/);
    assert.ok(m.text.includes(note), 'the whole note');
    assert.match(m.text, /Open MK-B2 in HaTi:\nhttp[^\n]*#contract=MK-B2&tab=terms/);
    assert.ok(!/\/s\/|token=/.test(m.text), 'no guest link');
    assert.match(r.audit.detail, /^To Unrestricted Legal \(from the send screen\) — emailed — “/);
  });
});

describe('f921 (3) — the screen presses the one door', () => {
  const CORE = code(R('js/core.js')), CA = code(R('js/copilotacts.js'));
  test('3a "colleague" is a purpose, drawn on both shapes of the picker', () => {
    assert.match(CORE, /const SHARE_PURPOSE = p => \(\[[^\]]*'colleague'[^\]]*\]/);
    assert.match(CORE, /\$\{seg\('advise'\)\}\$\{seg\('colleague'\)\}/);
    assert.match(CORE, /\$\{btn\('advise'\)\}\$\{btn\('colleague'\)\}/);
  });
  test('3b its Send goes to caPassSend before any of the other side\'s checks', () => {
    const send = CORE.slice(CORE.indexOf('const doSend=async()=>{'));
    assert.ok(send.indexOf("if(purposeSel==='colleague') return shareColSend(c);") >= 0);
    assert.ok(send.indexOf("if(purposeSel==='colleague') return shareColSend(c);") < send.indexOf('linkRefusal('));
    const col = CORE.slice(CORE.indexOf('const shareColSend=async(c)=>{'), CORE.indexOf('const doSend=async()=>{'));
    assert.match(col, /await caPassSend\(c, p, note, \{ fromJambo:_shCol\.fromJambo, review:_shCol\.review, door:'send' \}\)/);
    assert.ok(!/api\(/.test(col), 'no second route');
  });
  test('3c the browser\'s note cap is the route\'s', () => {
    assert.match(CA, /const CA_NOTE_MAX = (\d+);/);
    assert.equal(Number(CA.match(/const CA_NOTE_MAX = (\d+);/)[1]), SM.PASS_NOTE_MAX);
  });
  test('3d "send the above summary to @…" opens the screen on "a colleague", Jambo\'s words as the note', () => {
    /* a summary is Jambo's (its subject says so); Share inside the company's send is not (24 Oct 2026) */
    assert.match(CA, /openShareModal\(c, \{ purpose: 'colleague', colleagues: \[\{ id: a\.person\.id, name: a\.person\.name \}\], note: a\.note, fromJambo: !a\.share/);
  });
});

describe('f921 (4) — both books', () => {
  const I = R('js/i18n.js');
  const KEYS = ['co_purpose_colleague_label', 'co_purpose_colleague', 'co_purpose_colleague_sub', 'co_purpose_colleague_line', 'sh_as_p_colleague',
    'sh_lt_note_lbl_jambo', 'sh_col_add', 'sh_col_remove', 'sh_col_keys', 'sh_col_note_cap', 'sh_col_sent_one', 'sh_col_sent_other',
    'ca_pop_people_on', 'ca_cannot_open', 'ca_cannot_open_in', 'ca_summary_none', 'ca_scr_open', 'ca_scr_reopen', 'ca_scr_sent',
    'ca_scr_outbox', 'ca_scr_asked', 'ca_scr_mailfail', 'ca_scr_show', 'mail_pass_btn', 'mail_pass_inside', 'mail_pass_subject_jambo', 'jb_hint_people'];
  test('4a every new word is in English and in Svenska', () => {
    for (const k of KEYS) assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});
