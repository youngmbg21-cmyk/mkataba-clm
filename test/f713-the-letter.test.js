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
  test('1a the share email: today\'s words, the note under its heading, the link under the invitation', () => {
    const m = M.shareMailOf({ channel: 'email', purpose: 'negotiate', sender: 'Maria Lindgren', org: 'Lindqvist & Co AB',
      cName: 'Master services agreement', recName: 'Anna Holm', message: 'We can meet you at 45 days.', link: 'https://h/s/1', expires: '2026-11-01T10:00:00Z' });
    assert.equal(m.subject, 'Maria Lindgren sent you "Master services agreement" to negotiate');
    assert.equal(m.body, 'Maria Lindgren at Lindqvist & Co AB has shared "Master services agreement" with you for review, Anna Holm.\n\n'
      + 'Message from Maria Lindgren:\nWe can meet you at 45 days.\n\n'
      + 'Open the link to work through the proposed changes clause by clause — accept, refuse or discuss each one, and propose your own wording. Nothing is signed there. No account is needed:\nhttps://h/s/1\n\n'
      + 'This link expires on 2026-11-01. Replies to this email reach Maria Lindgren directly.');
    const v = M.shareMailOf({ channel: 'email', purpose: 'sign', sender: 'M', org: '', cName: '', link: 'L', expires: '2026-11-01' });
    assert.equal(v.subject, 'M shared "a contract" for your review');
    assert.equal(v.body, 'M at HaTi has shared "a contract" with you for review.\n\nOpen the contract to review it and respond — approve & sign, propose changes, or decline. No account is needed:\nL\n\nThis link expires on 2026-11-01. Replies to this email reach M directly.');
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
    assert.match(SRV, /const \{ shareMailOf, signerTurnMailOf \} = require\('\.\.\/js\/sharemail\.js'\);/);
    assert.match(SRV, /const mail = shareMailOf\(\{ channel: 'email', purpose: purp, sender: req\.user\.name, org: payload\.org,\n\s+cName, recName: rec\.name, message, link, expires \}\);/);
    assert.match(SRV, /const mail = shareMailOf\(\{ channel: 'word', purpose: histFile \? 'history' : null, sender: req\.user\.name,/);
    assert.match(SRV, /const m = signerTurnMailOf\(\{ signer, plan,/);
    const code = strip(SRV);
    assert.ok(!code.includes('has shared "${cName}" with you for review'), 'no second copy of the share email');
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
    assert.deepEqual([...m.root.querySelectorAll('#sh-letter .sh-lt-k')].map(x => x.textContent.trim()), ['From', 'To', 'Subject', 'Sent as']);
    assert.ok(m.$('.sh-lt-to #sh-name') && m.$('.sh-lt-to #sh-email'), 'the To row holds the two boxes');
    assert.ok(m.$('.sh-lt-as #share-purpose') && m.$('.sh-lt-as #share-tabs') && m.$('.sh-lt-as #sh-link-opts'), 'Sent as holds the purpose, the channel and the link\'s settings');
    assert.ok(m.$('.sh-lt-b #sh-summary'), 'the note is a box in the letter\'s words');
    assert.equal(m.txt('#sh-lt-subject'), 'Maria Lindgren sent you "Master services agreement" to negotiate');
    assert.match(m.txt('#sh-lt-from'), /^Maria Lindgren at .+, sent through HaTi$/);
  });
  test('2b a keystroke and a choice redraw it', async () => {
    const m = await openShare(contract());
    m.type('sh-name', 'Anna Holm');
    assert.match(m.txt('#sh-lt-before'), /with you for review, Anna Holm\.$/);
    assert.ok(m.$('#sh-lt-msghead').classList.contains('is-off'), 'an empty note: its heading dim');
    m.type('sh-summary', 'We can meet you at 45 days.');
    assert.ok(!m.$('#sh-lt-msghead').classList.contains('is-off'), 'a note: its heading lit');
    assert.match(m.txt('#sh-lt-jsay'), /^This is the email Anna will get, word for word\./);
    m.$('[data-share-purpose="view"]').click();
    assert.equal(m.txt('#sh-lt-subject'), 'Maria Lindgren shared "Master services agreement" for your review');
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
    assert.ok(heads.includes('What Nordvik Logistik AB never sees') && heads.includes('Something else to send?'), JSON.stringify(heads));
    assert.ok(m.$('#share-other[data-sh-lt-else="history"]'), 'the history is the rare question\'s one door, in the card');
    assert.ok(m.$('[data-sh-lt-else="status"]'), 'and the Where we are page');
    const win = m.win;
    const c = contract(); win.negoInit(c);
    win.reviewWithheldIds = () => new Set(['CH-1', 'CH-2']);
    win.negoUnsentAsks = () => [{ id: 'CH-1', review: { verdict: 'held', reviewer: { name: 'Sara Nyström' } } }, { id: 'CH-2' }];
    win.reviewHeld = x => !!(x.review && x.review.verdict === 'held');
    win.negoChangeSummary = () => ({ lines: [{ id: 'CH-1', clause: 'Clause 7 · Liability cap' }, { id: 'CH-2', clause: 'Clause 11 · Payment terms' }] });
    const h = win.shareStaysHtml(c);
    assert.match(h, /Clause 7 · Liability cap stays here[\s\S]*held in internal review/);
    assert.match(h, /Clause 11 · Payment terms stays here[\s\S]*waiting for internal review/);
    assert.ok(!/Sara/.test(h), 'who reviews is the review\'s own business');
  });
  test('2e the new words, in both books', () => {
    for (const k of ['sh_lt_aria', 'sh_lt_from', 'sh_lt_to', 'sh_lt_subject', 'sh_lt_as', 'sh_lt_from_v', 'sh_lt_from_wa', 'sh_lt_link', 'sh_lt_file', 'sh_lt_none', 'sh_lt_no_note',
      'sh_lt_jsay_mail', 'sh_lt_jsay_wa', 'sh_lt_jsay_turn', 'sh_lt_jsay_link', 'sh_lt_before', 'sh_lt_stays_h', 'sh_lt_stays_held', 'sh_lt_stays_wait', 'sh_lt_never_h', 'sh_lt_never',
      'sh_lt_else_h', 'sh_lt_else_p', 'sh_lt_else_hist_p', 'sh_lt_else_hist', 'sh_lt_else_hist_none', 'sh_lt_else_contract', 'sh_lt_else_status', 'brn_p_letter', 'brn_p_sharemail'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
