'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f755 — THE LETTER, AS DRAWN: ITS WORDS (round 11's gaps: the owner's "build
   all the gaps", 18 Oct 2026; the picked option "The letter", and "1. Keep
   it.": the note stays the only part the sender writes)
   (1) The round the send opens (shareRoundOf): the table's round, or the next
       one once our side has it back and has not sent yet.
   (2) What the send answers (shareAnswersOf), read off the copy that travels:
       their asks this round, the ones our send answers — accepted, refused,
       countered with the figure moved ("they propose 45 days (you asked for
       60).") — a counter that superseded their ask counted too, and our own
       new asks apart. Nothing written.
   (3) The email (shareMailOf, channel email): subject "Round 2 of the Master
       services agreement, from Lindqvist & Co AB", "Hello Anna,", the note,
       "… has answered 1 of your 2 redlines:" and one line per answer, "Open
       round 2" over the link, what the link lets them do (per kind), the
       one-time code sentence where a code guards it, the sign-off with the job
       title — and an HTML part whose button is the link, in literal colours.
   (4) Both routes mail it: a new link (POST /api/shares) and a link they
       already hold (PUT /api/shares/:token/payload, `letter`), each passing
       the round, the answers, the title and the code, and the HTML part.
   AT THE BASE (8dc306a) every test here FAILS.
   The browser half: test/chromium/the-letter-as-drawn-verify.js — it sends
   through a stub provider and compares the inbox with the screen, word for word.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SRV = R('server/server.js');
const M = (() => { try { return require('../js/sharemail.js'); } catch (_) { return {}; } })();
const has = n => assert.equal(typeof M[n], 'function', n + ' is one reading, on both hosts');

const T0 = '2026-10-10T09:00:00.000Z', T1 = '2026-10-12T09:00:00.000Z', T2 = '2026-10-14T09:00:00.000Z';
function table(over = {}){
  return {
    id: 'MK-0382', name: 'Master services agreement',
    negotiation: { round: 2, roundAt: T0, turn: 'owner', turnAt: T1 },
    changes: [
      { id: 'CHG-7', authorSide: 'counterparty', status: 'countered', counteredBy: 'CHG-9', clauseLabel: '7. Liability cap',
        oldText: 'capped at 50% of the fees', newText: 'capped at 100% of the fees', createdAt: T1 },
      { id: 'CHG-11', authorSide: 'counterparty', status: 'countered', counteredBy: 'CHG-12', clauseLabel: '11. Payment terms',
        oldText: 'within 30 days of receipt', newText: 'within 60 days of receipt', createdAt: T1 },
      { id: 'CHG-9', authorSide: 'owner', status: 'pending', counterOf: 'CHG-7', clauseLabel: '7. Liability cap',
        newText: 'capped at 75% of the fees', createdAt: T2, _held: true },
      { id: 'CHG-12', authorSide: 'owner', status: 'pending', counterOf: 'CHG-11', clauseLabel: '11. Payment terms',
        newText: 'within 45 days of receipt', createdAt: T2 },
    ],
    ...over,
  };
}

describe('f755 (1) the round the send opens', () => {
  test('1a the table\'s round while it is theirs; the next once ours is back and unsent', () => {
    has('shareRoundOf');
    assert.equal(M.shareRoundOf({ round: 2, roundAt: T0, turn: 'counterparty', turnAt: T1 }), 2, 'with them: the round they have');
    assert.equal(M.shareRoundOf({ round: 1, roundAt: T0, turn: 'owner', turnAt: T1 }), 2, 'back with us after a send: the next round');
    assert.equal(M.shareRoundOf({ round: 1, turn: 'owner' }), 1, 'nothing sent yet: round 1');
    assert.equal(M.shareRoundOf(null), 1, 'no negotiation: round 1, never a guess past it');
  });
});

describe('f755 (2) what the send answers', () => {
  test('2a a counter on their ask says the figure moved, and what they asked for', () => {
    has('shareAnswersOf'); has('shareFigureOf'); has('shareClauseParts');
    const c = table();
    c.changes = c.changes.filter(x => x.id !== 'CHG-9');
    c.changes[0].status = 'pending'; delete c.changes[0].counteredBy;
    const a = M.shareAnswersOf(c);
    assert.equal(a.asked, 2, 'their two asks on the table');
    assert.deepEqual(a.lines.map(l => [l.clause, l.say]), [['Clause 11 · Payment terms', 'they propose 45 days (you asked for 60).']]);
    assert.deepEqual(a.own, [], 'no new ask of ours');
  });
  test('2b accepted and refused since the table changed hands; a percentage keeps its sign', () => {
    const c = table();
    c.changes = [
      { id: 'A', authorSide: 'counterparty', status: 'accepted', resolvedAt: T2, clauseLabel: '3. Term' },
      { id: 'B', authorSide: 'counterparty', status: 'rejected', resolvedAt: T2, clauseLabel: 'Clause 4 · Fees' },
      { id: 'C', authorSide: 'counterparty', status: 'accepted', resolvedAt: T0, clauseLabel: '5. Old news' },
      { id: 'D', authorSide: 'counterparty', status: 'countered', counteredBy: 'E', clauseLabel: '7. Liability cap',
        oldText: 'capped at 50% of the fees', newText: 'capped at 100% of the fees' },
      { id: 'E', authorSide: 'owner', status: 'pending', counterOf: 'D', clauseLabel: '7. Liability cap', newText: 'capped at 75% of the fees', createdAt: T2 },
    ];
    const a = M.shareAnswersOf(c);
    assert.deepEqual(a.lines.map(l => l.clause + ': ' + l.say), [
      'Clause 3 · Term: they accept your change.',
      'Clause 4 · Fees: they keep the current wording.',
      'Clause 7 · Liability cap: they propose 75% (you asked for 100%).']);
    assert.equal(a.asked, 3, 'an ask decided before the table changed hands is not this send\'s');
  });
  test('2c a counter that superseded their ask is counted; our own new asks stand apart; nothing is written', () => {
    const c = table();
    c.changes = [
      { id: 'S', authorSide: 'counterparty', status: 'superseded', clauseLabel: '9. Data protection' },
      { id: 'K', authorSide: 'owner', status: 'pending', counterOf: 'S', clauseLabel: '9. Data protection', newText: 'within 24 hours', createdAt: T2 },
      { id: 'N', authorSide: 'owner', status: 'pending', clauseLabel: '10. Subcontractors', newText: 'only with written consent', createdAt: T2 },
    ];
    const before = JSON.stringify(c);
    const a = M.shareAnswersOf(c);
    assert.equal(a.asked, 1);
    assert.deepEqual(a.lines.map(l => l.clause + ': ' + l.say), ['Clause 9 · Data protection: they propose new wording.']);
    assert.deepEqual(a.own.map(o => o.clause), ['Clause 10 · Subcontractors']);
    assert.equal(JSON.stringify(c), before, 'a reading writes nothing');
  });
  test('2d a clause\'s label, said one way', () => {
    assert.deepEqual(M.shareClauseParts('11. Payment terms'), { n: '11', name: 'Payment terms' });
    assert.deepEqual(M.shareClauseParts('Clause 7 · Liability cap'), { n: '7', name: 'Liability cap' });
    assert.deepEqual(M.shareClauseParts('Recitals'), { n: '', name: 'Recitals' });
    assert.deepEqual(M.shareFigureOf('within 45 days of receipt', 'within 30 days of receipt'), { n: '45', unit: 'days' });
    assert.equal(M.shareFigureOf('the same words', 'the same words'), null, 'no figure moved: none said');
  });
});

describe('f755 (3) the email, as drawn', () => {
  const base = { channel: 'email', purpose: 'negotiate', sender: 'Maria Lindgren', title: 'Legal counsel', org: 'Lindqvist & Co AB',
    cName: 'Master services agreement', recName: 'Anna Holm', message: 'We can meet you at 45 days on payment.', link: 'https://hati.example/#share=t:abc',
    round: 2, codeOn: true, answers: { asked: 2, lines: [{ id: 'CHG-11', clause: 'Clause 11 · Payment terms', say: 'they propose 45 days (you asked for 60).' }], own: [] } };
  test('3a subject, greeting, note, answers, the button over the link, the promise with the code, the sign-off', () => {
    const m = M.shareMailOf(base);
    assert.equal(m.subject, 'Round 2 of the Master services agreement, from Lindqvist & Co AB');
    assert.equal(m.body, 'Hello Anna,\n\nWe can meet you at 45 days on payment.\n\n'
      + 'Lindqvist & Co AB has answered 1 of your 2 redlines:\nClause 11 · Payment terms: they propose 45 days (you asked for 60).\n\n'
      + 'Open round 2:\nhttps://hati.example/#share=t:abc\n\n'
      + 'You can propose changes on your own page. Nothing can be signed on this link. Before the page opens, we send a one-time code to this address.\n\n'
      + 'Maria Lindgren · Legal counsel · Lindqvist & Co AB');
    assert.deepEqual(m.parts.map(p => p.k), ['hello', 'msg', 'say', 'ans', 'btn', 'link', 'say', 'foot'], 'the parts the screen lays out');
  });
  test('3b the HTML part: the same words, the button IS the link, literal colours only', () => {
    const m = M.shareMailOf(base);
    assert.match(m.html, /<a href="https:\/\/hati\.example\/#share=t:abc" style="[^"]*background:#0b7a5f[^"]*">Open round 2<\/a>/);
    assert.match(m.html, /<b>Clause 11 · Payment terms:<\/b> they propose 45 days \(you asked for 60\)\./);
    assert.match(m.html, /Maria Lindgren · Legal counsel · Lindqvist &amp; Co AB/);
    assert.ok(!/var\(--/.test(m.html), 'a standalone document carries no :root');
    assert.ok(!/<script/i.test(M.shareMailOf({ ...base, message: '<script>x</script>' }).html), 'the note is escaped');
  });
  test('3c no note, no answers, no code, no title: those lines are simply not there', () => {
    const m = M.shareMailOf({ ...base, message: '', answers: null, codeOn: false, title: '', recName: '' });
    assert.equal(m.body, 'Hello,\n\nOpen round 2:\nhttps://hati.example/#share=t:abc\n\nYou can propose changes on your own page. Nothing can be signed on this link.\n\nMaria Lindgren · Lindqvist & Co AB');
  });
  test('3d each kind of link says what its page lets them do; a status link never asks a code', () => {
    const say = p => M.shareMailOf({ ...base, purpose: p, answers: null });
    assert.equal(say('sign').subject, 'The Master services agreement to sign, from Lindqvist & Co AB');
    assert.match(say('sign').body, /Open it to sign:\n[\s\S]*You sign this exact wording on your own page\. Before the page opens/);
    assert.match(say('view').body, /You can read it on your own page, and nothing else can be done on this link\./);
    assert.match(say('advise').body, /You see only the clauses you were asked about/);
    assert.match(say('status').body, /See where we stand:\n[\s\S]*It carries no wording and nothing to press\.\n\n/);
    assert.ok(!/one-time code/.test(say('status').body), 'a status page asks no code');
    assert.ok(!/redlines:/.test(say('view').body), 'only a negotiation round answers redlines');
  });
});

describe('f755 (4) both routes mail the letter', () => {
  test('4a a new link: the round, the answers, the title, the code, and the HTML part', () => {
    assert.match(SRV, /const \{ shareMailOf, signerTurnMailOf, shareRoundOf, shareAnswersOf \} = require\('\.\.\/js\/sharemail\.js'\);/);
    const at = SRV.indexOf("const mail = shareMailOf({ channel: 'email', purpose: purp,");
    assert.ok(at > 0, 'the share route builds the letter');
    const call = SRV.slice(at, SRV.indexOf('});', at) + 3);
    for (const bit of ["title: req.user.title || ''", 'round: shareRoundOf(pc.negotiation)', 'answers: shareAnswersOf(pc)', "codeOn: shareCodeOn() && purp !== 'status'"])
      assert.ok(call.includes(bit), bit);
    assert.match(SRV.slice(at, at + 900), /sendEmail\(email,\s*mail\.subject,\s*mail\.body,[\s\S]{0,200}?\{ html: mail\.html \}\)/, 'the inbox gets the button');
  });
  test('4b a link they already hold: the same letter, its note kept on the link, its errors recorded', () => {
    const at = SRV.indexOf("app.put('/api/shares/:token/payload'");
    assert.ok(at > 0);
    const route = SRV.slice(at, SRV.indexOf('\napp.', at + 10));
    assert.match(route, /letter/, 'the route takes a letter');
    assert.match(route, /shareMailOf\(\{ channel: 'email', purpose: sharePurposeOf\(s\)/);
    assert.match(route, /answers: shareAnswersOf\(pc\), codeOn: shareNeedsCode\(s\)/);
    assert.match(route, /\{ html: mail\.html \}/);
    assert.match(route, /emailSent = !!r\.sent; emailError = r\.detail \|\| null;/, '"sent" means sent');
  });
});
