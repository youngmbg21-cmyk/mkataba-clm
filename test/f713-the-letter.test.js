'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f713 — THE SEND SCREEN IS THE LETTER (round 11 of the redesign: the owner
   picked "The letter" by name and answered "1. Keep it.": the note stays the
   only part the sender writes, 17 Oct 2026)
   (1) The email's words are written ONCE (js/sharemail.js) and read by both
       hosts: the route mails shareMailOf / signerTurnMailOf, WhatsApp opens
       with shareWaTextOf, and the words are today's, byte for byte.
   (2) The screen draws them: From, To, Subject, Sent as, the email's own
       paragraphs with the note box where the note goes; a choice or a
       keystroke redraws it; "Before you send" says what stays here and why
       (no names), what they never see, something else to send.
   AT THE PARENT (933a89e) every test here FAILS (1a and 1b pin today's
   words, byte for byte: the move into one module changed none of them).
   The browser half: test/chromium/the-letter-verify.js — it sends through a
   stub provider and compares the email received with the screen.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildPortal } = require('./portalworld');
const F = require('./clausefixtures.js');

const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const SRV = R('server/server.js');
const CORE = R('js/core.js');
const I18N = R('js/i18n.js');
const M = (() => { try { return require('../js/sharemail.js'); } catch (_) { return {}; } })();
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f713 (1) the email\'s words, written once', () => {
  /* RE-POINTED 18 Oct 2026 (round 11's gaps, "The letter" as drawn): the
     share email IS the drawing's letter now — "Round 2 of the Master services
     agreement, from Lindqvist & Co AB", "Hello Anna,", the note, what the
     round answers, "Open round 2" over the link, what the link lets them do
     with the one-time code, the sign-off with the job title — and an HTML part
     whose button carries the link. Still written once, here; the screen and
     the inbox read the same parts (test/chromium/the-letter-as-drawn-verify.js
     sends it and compares word for word). The Word email, WhatsApp's text and
     the signing email (1b) are today's words, unchanged. */
  test('1a the share email: the letter\'s words, its answers, its button', () => {
    const m = M.shareMailOf({ channel: 'email', purpose: 'negotiate', sender: 'Maria Lindgren', title: 'Legal counsel', org: 'Lindqvist & Co AB',
      cName: 'Master services agreement', recName: 'Anna Holm', message: 'We can meet you at 45 days.', link: 'https://h/s/1', expires: '2026-11-01T10:00:00Z',
      round: 2, codeOn: true, answers: { asked: 2, lines: [{ id: 'a', clause: 'Clause 11 · Payment terms', say: 'they propose 45 days (you asked for 60).' }], own: [] } });
    assert.equal(m.subject, 'Round 2 of the Master services agreement, from Lindqvist & Co AB');
    assert.equal(m.body, 'Hello Anna,\n\nWe can meet you at 45 days.\n\n'
      + 'Lindqvist & Co AB has answered 1 of your 2 redlines:\nClause 11 · Payment terms: they propose 45 days (you asked for 60).\n\n'
      + 'Open round 2:\nhttps://h/s/1\n\n'
      + 'You can propose changes on your own page. Nothing can be signed on this link. Before the page opens, we send a one-time code to this address.\n\n'
      + 'Maria Lindgren · Legal counsel · Lindqvist & Co AB');
    assert.match(m.html, /<a href="https:\/\/h\/s\/1" style="[^"]*">Open round 2<\/a>/, 'the HTML part\'s button carries the link');
    assert.ok(!/var\(--/.test(m.html), 'a standalone document carries no :root');
    const v = M.shareMailOf({ channel: 'email', purpose: 'sign', sender: 'M', org: '', cName: '', link: 'L', expires: '2026-11-01' });
    assert.equal(v.subject, 'A contract to sign, from HaTi');
    assert.equal(v.body, 'Hello,\n\nOpen it to sign:\nL\n\nYou sign this exact wording on your own page.\n\nM · HaTi');
  });
  test('1b the Word email, the history file, WhatsApp\'s text and the signing email', () => {
    const w = M.shareMailOf({ channel: 'word', sender: 'M', org: 'O', cName: 'C', message: '' });
    assert.equal(w.subject, 'M sent you "C" to mark up');
    assert.equal(w.body, 'M at O has sent you "C" as a Word file.\n\nThe attached document carries their proposed changes as Word tracked changes, and their notes as Word comments.\n\nMark it up in Word and send the file back to M — they will bring your changes into HaTi.\n\nReplies to this email reach M directly.');
    const hf = M.shareMailOf({ channel: 'word', purpose: 'history', sender: 'M', org: 'O', cName: 'C', recName: 'A' });
    assert.equal(hf.subject, 'M sent you the negotiation history of "C"');
    assert.match(hf.body, /^M at O has sent you the negotiation history of "C", A as a Word file\.\n\nThe attached document is the record/);
    assert.equal(M.shareWaTextOf({ sender: 'M', org: 'O', cName: 'C', message: 'hi', link: 'L', expires: '2026-11-01T00:00:00Z' }).body,
      'M at O shared "C" for your review.\n\nhi\n\nOpen it here — review, sign, request changes or decline, no account needed:\nL\n\nThis link expires on 2026-11-01.');
    const t = (k, v) => k + (v ? JSON.stringify(v) : '');
    const st = M.signerTurnMailOf({ signer: { id: 's1', name: 'Henrik', order: 1 }, plan: [{ id: 's1', name: 'Henrik', party: 'counterparty', order: 1 }],
      cName: 'C', org: 'O', link: 'L', expiresAt: '2026-11-01', t, codeOn: true });
    assert.equal(st.subject, 'mail_turn_subject{"name":"C"}');
    assert.equal(st.body, 'mail_hello Henrik,\n\nmail_turn_body{"name":"C","org":"O","pos":"mail_turn_pos{\\"n\\":1,\\"total\\":1}"}\n\nmail_open_link\nL\n\nmail_code_note\n\nmail_link_expires{"date":"2026-11-01"}\n\nmail_automated_notice');
  });
  test('1c the server mails what the module writes, and keeps no copy of the words', () => {
    /* RE-POINTED 18 Oct 2026 (round 11's gaps): the route hands the module
       the round, the answers and the sender's title, and mails its HTML part
       beside the text; a link they already hold mails the same letter */
    /* RE-POINTED 18 Oct 2026 (round 11's gaps, second pass): the server also
       takes the code-name reading (shareMailNameOf) from the same module */
    assert.match(SRV, /const \{ shareMailOf, (?:shareMailNameOf, )?signerTurnMailOf, shareRoundOf, shareAnswersOf \} = require\('\.\.\/js\/sharemail\.js'\);/);
    assert.match(SRV, /const mail = shareMailOf\(\{ channel: 'email', purpose: purp, sender: req\.user\.name, title: req\.user\.title \|\| '', org: payload\.org,\n\s+cName, recName: rec\.name, message, (?:subject, )?link, expires,\n\s+round: shareRoundOf\(pc\.negotiation\), answers: shareAnswersOf\(pc, shareId \? srvStoredContract\(shareId\) : null\), codeOn: shareCodeOn\(\) && purp !== 'status',\n\s+\.\.\.srvMailCodeOf\(shareId\) \}\);/);
    assert.match(SRV, /const mail = shareMailOf\(\{ channel: 'email', purpose: sharePurposeOf\(s\), sender: req\.user\.name,[\s\S]{0,400}?round: shareRoundOf\(pc\.negotiation\), answers: shareAnswersOf\(pc, s\.contract_id \? srvStoredContract\(s\.contract_id\) : null\), codeOn: shareNeedsCode\(s\),\n\s+\.\.\.srvMailCodeOf\(s\.contract_id\) \}\);\n\s+const r = await sendEmail\(s\.recipient_email, mail\.subject, mail\.body, `share letter: \$\{link\}`, \{ html: mail\.html \}\);/);
    assert.match(SRV, /const mail = shareMailOf\(\{ channel: 'word', purpose: histFile \? 'history' : null, sender: req\.user\.name,/);
    assert.match(SRV, /const m = signerTurnMailOf\(\{ signer, plan,/);
    const code = strip(SRV);
    assert.ok(!code.includes('of your ${') && !/Open round \$\{/.test(code) && !code.includes('Before the page opens, we send'), 'no second copy of the share email');
    assert.ok(!code.includes('as Word tracked changes, and their notes as Word comments'), 'nor of the Word email');
    assert.match(strip(CORE), /const shareMessageText=\(c,link,msg,expiresAt\)=>shareWaTextOf\(\{/);
  });
  test('1d loaded wherever the screen is drawn: the app, both worlds, the harness pages', () => {
    const app = R('js/app.js');
    assert.ok(app.indexOf("import './sharemail.js';") > 0 && app.indexOf("import './sharemail.js';") < app.indexOf("import './core.js';"));
    for (const f of ['test/world.js', 'test/portalworld.js']) assert.match(R(f), /'js\/sharemail\.js'/, f);
    for (const f of ['parity', 'redline', 'room-shots', 'timeline']) assert.match(R(`test/chromium/${f}.html`), /js\/sharemail\.js/, f);
  });
});

function contract(over = {}){
  return { id: 'MK-713', name: 'Master services agreement', counterparty: 'Nordvik Logistik AB',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: F.protoRich(), format: 'rich', ...over };
}
async function openShare(c, tweak){
  const p = buildPortal({ url: 'http://localhost/hati/' });
  const win = p.win;
  win.API_MODE = () => true;
  win.api = async () => ({ ok: true });
  win.state.contracts = [c]; win.state.selectedId = c.id;
  const user = { id: 'u_m', name: 'Maria Lindgren', role: 'legal', email: 'm@co.example' };
  win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
  win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
  win.persist = () => {}; win.renderAuditSection = () => {};
  win.renderSharesSection = () => {}; win.refreshShareOverview = () => {};
  win.contractShares = async () => [];
  if (tweak) tweak(win);
  win.negoInit(c);
  await win.openShareModal(c, { purpose: 'negotiate' });
  const root = win.document.getElementById('modal-root');
  const type = (id, v) => { const el = root.querySelector('#' + id); el.value = v; el.dispatchEvent(new win.Event('input', { bubbles: true })); };
  return { win, root, $: s => root.querySelector(s), type, txt: s => (root.querySelector(s) || {}).textContent || '' };
}

describe('f713 (2) the screen draws the letter', () => {
  test('2a From, To, Subject, Sent as; the boxes in the letter\'s places; the subject the module\'s', async () => {
    const m = await openShare(contract());
    assert.ok(m.$('#sh-letter'), 'the letter is drawn');
    /* RE-POINTED, the SAP Way (owner picked it by name, 28 Oct 2026): a form
       of labelled questions over the email — To, What goes, What they can do,
       Send by — then the email's own Subject and From */
    assert.deepEqual([...m.root.querySelectorAll('#sh-letter .sh-lt-k')].map(x => x.textContent.trim()),
      ['To', 'What goes', 'What they can do', 'Send by', 'Subject', 'From']);
    assert.ok(m.$('.sh-lt-to #sh-name') && m.$('.sh-lt-to #sh-email'), 'the To row holds the two boxes');
    assert.ok(m.$('#sh-lt-can-row #share-purpose') && m.$('#sh-lt-by-row #share-tabs') && m.$('#sh-lt-by-row #sh-link-opts'),
      'the purpose under What they can do; the channel and the link\'s settings under Send by');
    assert.ok(m.$('.sh-lt-b #sh-summary'), 'the note is a box in the letter\'s words');
    /* RE-POINTED 18 Oct 2026 (round 11's gaps, "The letter" as drawn) */
    assert.equal(m.$('#sh-lt-subject').value, 'Round 1 of the Master services agreement, from ' + m.win.FIRST_PARTY);
    assert.match(m.txt('#sh-lt-from'), /^Maria Lindgren, .+ · sent by HaTi$/);
    assert.deepEqual([...m.root.querySelectorAll('#sh-letter [data-sh-as]')].map(x => x.getAttribute('data-sh-as')), ['what', 'purpose', 'ch', 'link'],
      'four fields, each opening its own list of the same controls');
  });
  test('2b a keystroke and a choice redraw it', async () => {
    const m = await openShare(contract());
    /* RE-POINTED 18 Oct 2026 (round 11's gaps, "The letter" as drawn: "Hello
       Anna," over the note's dashed box, and Send names who it goes to) */
    assert.equal(m.txt('#sh-lt-before'), 'Hello,');
    m.type('sh-name', 'Anna Holm');
    assert.equal(m.txt('#sh-lt-before'), 'Hello Anna,');
    assert.equal(m.txt('#share-send').trim(), 'Send to Anna', 'Send names its first name');
    m.type('sh-summary', 'We can meet you at 45 days.');
    /* RE-POINTED, the SAP Way (28 Oct 2026): Jambo's "word for word" line is
       gone; his panel says what goes, the note once typed */
    assert.equal(m.txt('#sh-lt-goes-h'), 'What goes to Anna');
    assert.match(m.txt('#sh-lt-goes-l'), /Your note/);
    m.$('[data-share-purpose="view"]').click();
    assert.equal(m.$('#sh-lt-subject').value, 'The Master services agreement, from ' + m.win.FIRST_PARTY);
    m.$('[data-share-ch="link"]').click();
    assert.ok(m.$('#sh-lt-subj-row').classList.contains('hidden'), 'a copied link has no subject');
    assert.match(m.txt('#sh-lt-before'), /^Nothing is sent from here/);
  });
  test('2c the painter lays out the module\'s parts and composes no sentence of the email', () => {
    const paint = strip(CORE.slice(CORE.indexOf('function shareLetterOf('), CORE.indexOf('function shareStaysHtml(')));
    for (const call of ['shareMailOf(', 'shareWaTextOf(', 'signerTurnMailOf(', 'shareMailNoteHead(']) assert.ok(paint.includes(call), call);
    assert.ok(!/has shared|to negotiate|Open the link|This link expires/.test(paint), 'no word of the email here');
  });
  test('2d Before you send: what stays here and why — no names — what they never see, something else to send', async () => {
    const m = await openShare(contract());
    assert.match(m.txt('.sh-lt-jb'), /Before you send/);
    const heads = [...m.root.querySelectorAll('#share-step-1 .sh-lt-card h4')].map(x => x.textContent);
    assert.ok(heads.includes('What Nordvik Logistik AB never sees'), JSON.stringify(heads));
    /* RE-POINTED, the SAP Way (28 Oct 2026): "Something else to send?" is not
       drawn — the form's What goes asks it, and its list presses these same
       two buttons, kept out of sight as the one door each has */
    assert.ok(m.$('#sh-lt-else').classList.contains('hidden'), 'the card is not drawn');
    assert.ok(m.$('#share-other[data-sh-lt-else="history"]'), 'the history\'s one door is still there to press');
    assert.ok(m.$('[data-sh-lt-else="status"]'), 'and the Where we are page');
    assert.deepEqual([...m.root.querySelectorAll('[data-sh-as="what"] [data-sh-as-what]')].map(b => b.getAttribute('data-sh-as-what')), ['contract', 'history', 'status']);
    const win = m.win;
    const c = contract(); win.negoInit(c);
    win.reviewWithheldIds = () => new Set(['CH-1', 'CH-2']);
    win.negoUnsentAsks = () => [{ id: 'CH-1', clauseId: 'c7', review: { verdict: 'held', reviewer: { name: 'Sara Nyström' } } }, { id: 'CH-2' }];
    win.reviewHeld = x => !!(x.review && x.review.verdict === 'held');
    win.negoChangeSummary = () => ({ lines: [{ id: 'CH-1', clause: 'Clause 7 · Liability cap' }, { id: 'CH-2', clause: 'Clause 11 · Payment terms' }] });
    /* RE-POINTED 18 Oct 2026 (round 11's gaps, "The letter" as drawn:
       "Clause 7 stays here", "Your counter on the liability cap (75%) is with
       Sara Nyström for internal review", Remind Sara · Go to clause 7): the
       card names the clause by its number and the reviewer ONLY where the
       review's own wall lets this reader see who reviews (reviewMaySee) —
       otherwise the sentence without a name, as before. */
    win.reviewMaySee = () => false;
    const h = win.shareStaysHtml(c);
    assert.match(h, /Clause 7 stays here[\s\S]*liability cap[\s\S]*held in internal review/);
    assert.match(h, /Clause 11 stays here[\s\S]*payment terms[\s\S]*out for internal review/);
    assert.ok(!/Sara/.test(h), 'who reviews is the review\'s own business, unless the review lets this reader see it');
    assert.match(h, /data-sh-lt-goto="c7"[^>]*>Go to clause 7</, 'and a way to the clause');
  });
  test('2e the new words, in both books', () => {
    for (const k of ['sh_lt_aria', 'sh_lt_from', 'sh_lt_to', 'sh_lt_subject', 'sh_lt_as', 'sh_lt_from_v', 'sh_lt_from_wa', 'sh_lt_link', 'sh_lt_file', 'sh_lt_none', 'sh_lt_no_note',
      'sh_lt_jsay_mail', 'sh_lt_jsay_wa', 'sh_lt_jsay_turn', 'sh_lt_jsay_link', 'sh_lt_before', 'sh_lt_stays_h', 'sh_lt_stays_held', 'sh_lt_stays_wait', 'sh_lt_never_h', 'sh_lt_never',
      'sh_lt_else_h', 'sh_lt_else_p', 'sh_lt_else_hist_p', 'sh_lt_else_hist', 'sh_lt_else_hist_none', 'sh_lt_else_contract', 'sh_lt_else_status', 'brn_p_letter', 'brn_p_sharemail'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
