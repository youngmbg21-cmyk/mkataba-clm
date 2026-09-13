/* ============================================================
   f307 — THE BUILD PLAN, GROUP TWO: one screen to send a round, and Word
   ============================================================
   Owner-approved 13 Sep 2026. Two things about the moment a round leaves the
   building.

   ONE SCREEN. Share opened on a question ("what are you sharing?"), then Next,
   then the purpose, then at last the person — three screens before the address.
   It opens on the send now, with what is going out above it and the purpose on
   it. The 2 August 2026 ruling is KEPT rather than worked around: nobody sends
   without consciously choosing negotiate or sign, because the picker is on the
   screen. (f42 drives the screen itself; this file asks what f42 does not.)

   WORD IS A WAY OF SENDING. HaTi could write a .docx with tracked changes and
   Word comments — as a DOWNLOAD. The sender attached it to their own mail and
   the product never learned the round had gone out. It is a channel now, so
   every record a send writes is written whichever way the round travels.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { buildPortal } = require('./portalworld');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');
const F = require('./clausefixtures.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const CORE = read('js/core.js');
const CONTRACT = read('js/views/contract.js');
const SERVER = read('server/server.js');
const I18N = read('js/i18n.js');

function contract(over = {}){
  return { id: 'MK-307', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
async function negotiated(win){
  const c = contract();
  win.negoInit(c);
  const cl = win.negoClauseList(c).find(x => x.num === '4');
  await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS['4'].text}</p>`,
    { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS['4'].summary });
  return c;
}
/* The real dialog, in the one window that loads js/core.js. Copied from f42's
   own opener on purpose — it is the same stage, and a second description of how
   to raise this dialog is the thing this codebase pays for. */
async function openShare(c, opts, tweak){
  const p = buildPortal({ url: 'http://localhost/hati/' });
  const win = p.win;
  win.API_MODE = () => true;      /* the Word channel is only offered where there is a server */
  win.api = async () => ({ ok: true });
  const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
  win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
  win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
  win.persist = () => {}; win.renderAuditSection = () => {};
  win.renderSharesSection = () => {}; win.refreshShareOverview = () => {};
  win.contractShares = async () => [];
  if (tweak) tweak(win);
  await win.openShareModal(c, opts);
  const root = win.document.getElementById('modal-root');
  return { win, root, $: sel => root.querySelector(sel),
    $$: sel => Array.from(root.querySelectorAll(sel)) };
}

describe('f307 (1) — the send is one screen', () => {
  test('the change list folds, and the sentence above it leads', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    const det = m.$('#share-manifest details');
    assert.ok(det, 'the list is behind a fold');
    assert.equal(det.open, false, 'shut at rest — the decision stays above it');
    assert.match(m.$('#share-manifest-line').textContent, /1 change/,
      'and the count is stated in the open');
    assert.ok(det.textContent.includes('#CHG-001'),
      'nothing is lost: the list is still the record’s own');
  });

  test('the second step’s heading and its standing blurbs stand down', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    assert.ok(m.$('#share-step2-head').className.includes('hidden'));
    /* DRAWN AND HIDDEN, NEVER DELETED: the two-screen shape is still in the
       markup, and a blurb that is gone cannot be put back. */
    assert.ok(m.$('#share-send-blurb'), 'the markup survives');
  });
});

describe('f307 (2) — Word is a channel, and the screen follows the choice', () => {
  const chans = m => m.$$('[data-share-ch]').map(b => b.getAttribute('data-share-ch'));

  test('it is offered where it can work, and only there', async () => {
    const { win } = buildWorld();
    const on = await openShare(await negotiated(win));
    assert.ok(chans(on).includes('word'), 'a server and the .docx writer');
    /* NOT OFFERED WHERE IT CANNOT WORK — a verb that cannot act is not drawn,
       and a Word send with no writer would be a dead press. */
    const off = await openShare(await negotiated(win), undefined,
      w => { w.docxExportTracked = null; });
    assert.equal(chans(off).includes('word'), false);
  });

  test('choosing it hides the link settings, because a file has no link', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    const opts = m.$('#sh-link-opts');
    assert.ok(opts && !opts.className.includes('hidden'), 'a link has them');
    m.$('[data-share-ch="word"]').click();
    assert.ok(m.$('#sh-link-opts').className.includes('hidden'), 'a file does not');
    m.$('[data-share-ch="email"]').click();
    assert.ok(!m.$('#sh-link-opts').className.includes('hidden'), 'and they come back');
  });

  /* GREYED WITH THE REASON, which is the product's own rule: say before the
     press what cannot work, rather than refusing after it. And a purpose that
     has just been made impossible may not stay selected — that is how a send
     goes out meaning something nobody chose. */
  test('a file cannot be signed, and the screen says so before the press', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win), { purpose: 'sign' });
    const sign = m.$('#share-purpose [data-share-purpose="sign"]');
    assert.equal(sign.disabled, false);
    m.$('[data-share-ch="word"]').click();
    assert.equal(sign.disabled, true, 'greyed');
    assert.match(sign.title, /cannot be signed/i, 'with the reason on it');
    assert.equal(m.$('#share-purpose [data-share-purpose="negotiate"]').getAttribute('aria-pressed'),
      'true', 'and the choice moved off the dead purpose');
  });

  test('the line under the row says what the channel does, and what it costs', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    const note = () => m.$('#sh-ch-note').textContent;
    assert.match(note(), /their own page/i, 'the link says what they get');
    m.$('[data-share-ch="word"]').click();
    assert.match(note(), /tracked/i, 'the file says what it carries');
    assert.match(note(), /no page for them|cannot tell you when they open/i,
      'and what is lost — an honest channel says both');
  });

  test('the send button names the act', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    m.$('[data-share-ch="word"]').click();
    assert.match(m.$('#sh-send-lbl').textContent, /file/i);
    m.$('[data-share-ch="email"]').click();
    assert.match(m.$('#sh-send-lbl').textContent, /email/i);
  });

  /* ONE BUILDER, TWO CONSUMERS. The download and the attachment are the same
     file; two builders would drift, and the one that drifted would be the one
     the counterparty actually receives. */
  test('the file the send attaches is the file the download writes', () => {
    const code = strip(CONTRACT);
    assert.match(code, /function wordTrackedFile\(/, 'the one builder');
    const dl = /function exportWordTracked\([\s\S]*?\n\}/.exec(code);
    assert.ok(dl, 'the download exists');
    assert.match(dl[0], /wordTrackedFile\(/, 'and the download asks it');
    assert.doesNotMatch(dl[0], /docxExportTracked\(/, 'rather than writing a second one');
    assert.match(strip(CORE), /wordTrackedFile\(c,\s*\{\s*side:\s*'owner'\s*\}\)/,
      'and so does the send');
  });

  /* A FILE IS NOT A STANDING LINK. The share row is the record that a round
     left the building, but its URL is never given out on this channel — so if
     it were durable, every reading of "do they hold a live copy" would answer
     yes about a page they have never seen. */
  test('the Word send is never durable', () => {
    assert.match(strip(CORE), /const wantDurable\s*=\s*ch\s*===\s*'word'\s*\?\s*false/);
  });

  test('the keys are in both books', () => {
    for (const k of ['co_ch_word', 'co_ch_word_note', 'co_send_the_file', 'co_word_cannot_sign',
      'co_note_goes_with_file', 'co_file_sent', 'co_file_sent_body', 'co_file_outbox',
      'co_send_round_to', 'co_send_something_else', 'co_see_the_changes_one'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' is written in English and Swedish');
  });
});

describe('f307 (3) — the server attaches the file and writes no link', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  const payloadFor = id => ({ kind: 'hati-share', org: 'Highland Corporate Ltd',
    sharedBy: 'Wanjiru Kamau', at: new Date().toISOString(), purpose: 'negotiate',
    contract: { id, name: 'Raw Milk Collection', counterparty: 'Nandi Dairy',
      docText: 'The Buyer shall pay within thirty (30) days.', changes: [] } });

  test('it emails the .docx, with no link in the body', async () => {
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-A2'), channel: 'word', durable: false,
      message: 'Marked up as discussed.',
      recipient: { name: 'Priya Nair', email: 'priya@nandi.example' },
      file: { filename: 'MK-A2-redline.docx', content: Buffer.from('PK-not-really-a-docx').toString('base64') } } });
    assert.ok(r.token, 'the round is still recorded — a share row exists');
    const ob = await W.admin.json('/api/outbox');
    const mail = (ob.items || []).find(m => String(m.to_addr) === 'priya@nandi.example');
    assert.ok(mail, 'the counterparty was written to');
    assert.match(String(mail.subject), /to mark up/i);
    assert.match(String(mail.body), /tracked changes/i, 'it says what is attached');
    assert.match(String(mail.body), /reply to this email with the file/i, 'and how to answer');
    /* THE WALL: no link goes with a file. */
    assert.doesNotMatch(String(mail.body), /\/s\/|share\?t=|http/i,
      'the URL is not put in the email');
    assert.match(String(mail.detail || ''), /attachments: MK-A2-redline\.docx/,
      'and the file really rode with it');
  });

  test('a send with no file is a refusal in words, never an empty envelope', async () => {
    const before = (await W.admin.json('/api/outbox')).items.length;
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-A2'), channel: 'word', durable: false,
      recipient: { name: 'Priya Nair', email: 'priya@nandi.example' } } });
    assert.equal(r.emailSent, false);
    assert.match(String(r.emailError || ''), /No file was supplied/i);
    assert.equal((await W.admin.json('/api/outbox')).items.length, before,
      'nothing was sent');
  });

  /* AND THE LINK CHANNEL IS UNTOUCHED — the branch is an addition, not a
     rewrite, and the ordinary send still mails the URL. */
  test('the ordinary email share still carries its link', async () => {
    await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-A2'), channel: 'email', durable: true,
      recipient: { name: 'Priya Nair', email: 'link@nandi.example' } } });
    const ob = await W.admin.json('/api/outbox');
    const mail = (ob.items || []).find(m => String(m.to_addr) === 'link@nandi.example');
    assert.ok(mail, 'it went');
    assert.match(String(mail.body), /http/, 'with the link in it');
  });

  test('the route is one door — no second send-a-file route was added', () => {
    assert.doesNotMatch(SERVER, /\/api\/contracts\/:id\/send-word|\/api\/shares\/word/);
    assert.equal((SERVER.match(/ch === 'word'/g) || []).length, 1,
      'one branch, on the route that already records a round');
  });
});
