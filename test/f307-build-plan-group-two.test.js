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
    /* Email says nothing (the pop-up diet, 13 Sep 2026): "they read it on
       their own page" under an Email button is the control printed twice. */
    assert.equal(note().trim(), '', 'email carries no line');
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

describe('f307 (4) — what came back, in one line', () => {
  /* THE ROUND SUMMARY THE BUILD PLAN ASKED FOR, built where it costs nothing
     and adds no band: the alert row that already says the round arrived. */
  test('it reads the record and names what they did', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const list = win.negoClauseList(c);
    /* one of ours they accepted, one of ours they refused, and one counter */
    const a = await win.negoEditClause(c, list[0].clauseId, '<p>Net-45 applies.</p>',
      { side: 'owner', author: 'Wanjiru Kamau' });
    const b = await win.negoEditClause(c, list[1].clauseId, '<p>Cap at EUR 250,000.</p>',
      { side: 'owner', author: 'Wanjiru Kamau' });
    win.negoResolve(c, a.id, 'accepted', { by: 'Erik Lindqvist' });
    win.negoResolve(c, b.id, 'rejected', { by: 'Erik Lindqvist' });
    const cl = win.negoClauseList(c).find(x => x.num === '6') || list[2];
    await win.negoEditClause(c, cl.clauseId, '<p>Ninety (90) days.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });

    const r = win.negoRoundRead(c);
    assert.ok(r, 'there is something to say');
    assert.equal(r.accepted, 1);
    assert.equal(r.refused, 1);
    assert.ok(r.awaiting >= 1, 'and something waiting on you');
    const line = win.negoRoundLine(c);
    assert.match(line, /accepted 1/i);
    assert.match(line, /refused 1/i);
    assert.match(line, /Start with/i, 'and where to begin');
  });

  test('a contract with nothing on it says nothing', () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    assert.equal(win.negoRoundRead(c), null);
    assert.equal(win.negoRoundLine(c), '');
  });

  /* READING MUST NOT WRITE. The alerts panel asks this of every live contract
     on every repaint; negoRound() would run negoInit and start a negotiation on
     each one. */
  test('reading it starts no negotiation', () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    const before = JSON.stringify(c);
    win.negoRoundRead(c);
    win.negoRoundLine(c);
    assert.equal(JSON.stringify(c), before, 'the record is byte-identical');
  });

  /* AND IT SPENDS NOTHING. The plan offered one Copilot call per round; every
     figure in the sentence turned out to be on the record already. */
  test('no model is asked', () => {
    const m = /function negoRoundRead\(c\)\{[\s\S]*?\n\}/.exec(strip(read('js/views/negotiation.js')));
    assert.ok(m);
    assert.doesNotMatch(m[0], /api\(|fetch|copilot|anthropic/i);
  });

  test('it rides the alert row, and adds no band', () => {
    const app = strip(read('js/app.js'));
    assert.match(app, /negoRoundLine\(c\)/, 'the panel asks it');
    assert.match(app, /a\.sub\?/, 'and the row draws it as its own second line');
  });

  test('the keys are in both books', () => {
    for (const k of ['ng_round_accepted_one', 'ng_round_refused_one', 'ng_round_countered',
      'ng_round_added_one', 'ng_round_asks_one', 'ng_round_start'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});

/* ============================================================
   f307 (5) — THE RECORD IS ITS OWN LINK, AND THE FIRST FRAME IS THE SEND
   ============================================================
   Young, 13 Sep 2026, three screenshots: "when I ask to send negotiation
   history i get the contract instead. When i click the share button, image 2
   flashes quickly before image 3 appears."

   Two faults. The signer card (WHO SIGNS) was drawn at the open for the Sign
   default and never told the kind had moved to the record, so the history
   screen led with a signing route. And a history send to an address that
   already held a standing contract link REFRESHED that link — the server
   serves a link by the row's own purpose, so the counterparty opened the
   contract while the sender believed they had sent the record. The flash was
   the opening frame still drawing the kind question after it had become a door.
   The first is asserted on the dialog, the second on the server (the wall) and
   in the dialog's own reuse predicate (f17), the third in f178. */
describe('f307 (5) — the record is its own link', () => {
  async function openShare(c, opts){
    const p = buildPortal({ url: 'http://localhost/hati/' });
    const win = p.win;
    win.API_MODE = () => false;
    const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
    win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
    win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
    win.persist = () => {};
    win.renderAuditSection = () => {};
    win.renderSharesSection = () => {};
    win.refreshShareOverview = () => {};
    await win.openShareModal(c, opts);
    const root = win.document.getElementById('modal-root');
    return { win, root, $: sel => root.querySelector(sel),
      hidden: sel => { const el = root.querySelector(sel); return !el || String(el.className || '').split(/\s+/).includes('hidden'); } };
  }
  const signable = () => ({ id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich',
    changes: [{ id: 'CHG-001', clauseId: 'cl_1', status: 'accepted', authorSide: 'counterparty', summary: 'x' }],
    signerPlan: [
      { id: 'sg_cp', party: 'counterparty', name: 'Erik Lindqvist', role: 'CEO', email: 'erik@nordfrakt.se', order: 1, signed: false },
      { id: 'sg_us', party: 'internal', name: 'Wanjiru Kamau', role: 'Director', email: 'w@co.ke', order: 2, signed: false } ] });

  test('the signer card follows the kind: drawn on Sign, gone on the record, back on the contract', async () => {
    const m = await openShare(signable(), { purpose: 'sign' });
    assert.ok(!m.hidden('#share-signers'), 'a signing link opens on WHO SIGNS');
    m.$('#share-other').click();
    m.$('[data-share-kind="history"]').click();
    m.$('#share-kind-next').click();
    assert.ok(m.hidden('#share-signers'), 'the record has nobody to sign it');
    assert.ok(!m.hidden('#share-hist-note'), 'and says what the link is');
    assert.ok(m.hidden('#share-purpose-wrap'), 'no purpose to choose on a record');
    m.$('#share-other').click();
    m.$('[data-share-kind="contract"]').click();
    m.$('#share-kind-next').click();
    assert.ok(!m.hidden('#share-signers'), 'choosing the contract again brings the route back');
  });

  test('the first frame is the one screen, folded like the settled one (no flash)', async () => {
    const m = await openShare(signable(), undefined);
    assert.ok(m.hidden('#share-step-kind'), 'the kind question is behind its door');
    assert.ok(!m.hidden('#share-step-1') && !m.hidden('#share-step-2'), 'the send is the screen');
    assert.ok(m.$('#share-other'), 'and the door is on it');
    assert.equal(m.$('#share-send').disabled, false, 'Send is live once the dialog is wired');
  });

  describe('the server keeps a link to the kind it was made with', () => {
    let h, W;
    before(async () => { h = await startHati(); W = await seedWorkspace(h); });
    after(async () => { await h.stop(); });
    const payloadFor = (id, purpose) => ({ kind: 'hati-share', org: 'Highland Corporate Ltd',
      sharedBy: 'Wanjiru Kamau', at: new Date().toISOString(), ...(purpose ? { purpose } : {}),
      contract: { id, name: 'Raw Milk Collection', counterparty: 'Nandi Dairy',
        docText: 'The Buyer shall pay within thirty (30) days.', changes: [], negotiation: { round: 1, rounds: [] } } });
    const mk = purpose => W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-A2', purpose), channel: 'link', durable: true, purpose,
      recipient: { name: 'Priya Nair', email: 'priya@nandi.example' } } });
    const put = (token, purpose) => W.admin.raw('/api/shares/' + token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-A2', purpose) } });

    test('a history payload cannot be written onto a contract link', async () => {
      const link = await mk('negotiate');
      const r = await put(link.token, 'history');
      assert.equal(r.status, 409, 'refused');
      assert.match(String(r.json.error), /own link/i, 'with the way forward');
      const got = await W.admin.json('/api/shares/' + link.token);
      assert.equal(got.historyOnly, undefined, 'and the link still opens as the contract');
      assert.ok(got.payload && got.payload.contract && got.payload.contract.docText, 'wording served');
    });
    test('a history link takes no refresh at all — it was already a read-only pass', async () => {
      const link = await mk('history');
      assert.equal((await put(link.token, 'negotiate')).status, 403, 'the read-only guard, unchanged');
      assert.equal((await put(link.token, 'history')).status, 403, 'even with its own kind — which is why the dialog never reuses one');
      const got = await W.admin.json('/api/shares/' + link.token);
      assert.equal(got.historyOnly, true);
      assert.equal(got.purpose, 'history');
      assert.equal(got.payload.contract.docText, undefined, 'a history link carries no wording');
    });
    test('the round send is untouched: no purpose, or a contract purpose, still refreshes a contract link', async () => {
      const link = await mk('negotiate');
      assert.equal((await put(link.token, null)).status, 200, 'the round send names no purpose');
      assert.equal((await put(link.token, 'sign')).status, 200, 'the book may have moved on to signing');
      assert.equal((await put(link.token, 'view')).status, 200);
    });
  });
});

/* ============================================================
   f307 (6) — THE WORD FILE IS WHAT THE SENDER CHOSE
   ============================================================
   Young, 13 Sep 2026, three screenshots: "this is what i get in word format
   for negotiation history. It should be image 2. When i click on print or
   export history in the image 3 screen i get the right information."
   The Word channel had one file builder — the tracked-changes contract — and
   handed it out on a history send. The record's file is the report Export
   history and Print history already give, read through the same builder. */
describe('f307 (6) — the Word file is what the sender chose', () => {
  test('the history report in Word\'s terms is the export, less its furniture', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = await negotiated(win);
    const r = await win.negoIntegrityReport(c);
    const page = win.negoHistoryExportHtml(c, r);
    const word = win.negoHistoryWordHtml(c, r);
    assert.match(page, /<style>/, 'the export is a whole page');
    assert.doesNotMatch(word, /<style|<head|<body|<html/, 'the Word half is the body alone');
    assert.doesNotMatch(word, /ht-mark/, 'the event glyphs are furniture');
    assert.doesNotMatch(word, /ht-key/, 'Word draws its own marks, so the colour legend goes');
    assert.match(word, /Negotiation history/, 'the heading is the report\'s own');
    assert.match(word, /CHG-001/, 'every event rides');
    assert.match(word, /round 1 · still pending/, 'with its meta line');
    assert.match(word, /Record verified|Integrity check/, 'and the integrity line');
  });

  test('the .docx carries the record, not the agreement', async () => {
    const { win } = buildWorld({ negotiationView: true, contractView: true });
    const c = await negotiated(win);
    const f = await win.wordHistoryFile(c, { author: 'Wanjiru Kamau' });
    assert.equal(f.name, 'MK-307-negotiation-history.docx');
    const out = win.docxExportTracked(win.negoHistoryWordHtml(c, await win.negoIntegrityReport(c)), { author: 'x' });
    const read = win.docxXmlToText(out.xml);
    const text = read.text;
    assert.match(text, /^Negotiation history — Warehousing/, 'the report\'s heading opens the file');
    assert.match(text, /CHG-001/, 'the change is in it');
    assert.match(text, /round 1 · still pending · Clause 4/);
    assert.match(text, /forty-five \(45\) days/, 'the proposed wording');
    assert.doesNotMatch(text, /Scope of Services|Storage Conditions|Governing Law/,
      'clauses the negotiation never touched are the CONTRACT, and the contract is not this file');
    assert.ok(read.tracked.ins > 0 && read.tracked.del > 0, 'the redline is Word tracked changes, as on the contract file');
  });

  test('the send builds the record\'s file on the record, and the contract\'s otherwise', () => {
    const fn = /const doSend=async\(\)=>\{[\s\S]*?const wantDurable=/.exec(CORE)[0];
    assert.match(fn, /const hist=purposeSel==='history';/);
    assert.match(fn, /hist \? await wordHistoryFile\(c\) : wordTrackedFile\(c,\{ side:'owner' \}\)/,
      'one branch, the kind decides the builder');
    assert.match(CONTRACT, /async function wordHistoryFile\(c,opts\)\{[\s\S]*?negoIntegrityReport\(c\)[\s\S]*?negoHistoryWordHtml\(c,r\)/,
      'the file is verified first, as Export and Print verify it');
    /* the channel line follows the kind */
    assert.match(CORE, /i18t\(purposeSel==='history'\?'co_ch_word_hist_note':'co_ch_word_note'\)/);
    assert.match(I18N, /co_ch_word_hist_note:/);
    assert.equal((I18N.match(/co_ch_word_hist_note:/g) || []).length, 2, 'both books');
  });

  test('the dialog opens on Email whatever the last send used, and the reader moves it', async () => {
    const { win } = buildWorld();
    const lit = m => m.$$('[data-share-ch]').find(b => /var\(--color-accent\)/.test(b.style.background)).getAttribute('data-share-ch');
    const m = await openShare(await negotiated(win), undefined, w => {
      w.contractShares = async () => [{ token: 't1', channel: 'word', durable: false, recipientName: 'Priya', recipientEmail: 'p@nandi.example', createdAt: '2026-09-13T10:00:00Z', state: 'sent' }];
    });
    assert.equal(lit(m), 'email', 'the last send was a Word file and the dialog still opens on Email');
    m.$('[data-share-ch="word"]').click();
    assert.equal(lit(m), 'word', 'and the reader can move it');
    const fn = /async function openShareModal\([\s\S]*?\n\}/.exec(CORE)[0];
    assert.match(fn, /let ch='email';/, 'the opening channel is a constant, not the share list\'s');
    assert.doesNotMatch(fn, /let ch=pre\.channel/, 'the remembered channel is the round send\'s, not this dialog\'s');
  });

  test('the contract\'s checks stand down on the record (Young, 13 Sep 2026)', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win), undefined, w => {
      w.contractReadiness = () => [{ severity: 'warn', text: 'No effective date' }];
    });
    const hidden = () => String(m.$('#share-readiness-wrap').className || '').split(/\s+/).includes('hidden');
    assert.ok(m.$('#share-readiness'), 'a warning is on the contract, so the fold is drawn');
    assert.equal(hidden(), false, 'and shown on the contract kind');
    m.$('#share-other').click();
    m.$('[data-share-kind="history"]').click();
    m.$('#share-kind-next').click();
    assert.equal(hidden(), true, 'the record carries no agreement — the checks say nothing about it');
    m.$('#share-other').click();
    m.$('[data-share-kind="contract"]').click();
    m.$('#share-kind-next').click();
    assert.equal(hidden(), false, 'and they come back with the contract');
    const fn = /const doSend=async\(\)=>\{[\s\S]*?const wantDurable=/.exec(CORE)[0];
    assert.match(fn, /if\(ack && !ack\.checked && purposeSel!=='history'\)/, 'the tick is never asked for on the record');
  });

  test('the dialog says what the Word file is, by kind', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    m.$('[data-share-ch="word"]').click();
    assert.match(m.$('#sh-ch-note').textContent, /changes tracked/, 'on the contract: the tracked copy');
    m.$('#share-other').click();
    m.$('[data-share-kind="history"]').click();
    m.$('#share-kind-next').click();
    assert.match(m.$('#sh-ch-note').textContent, /negotiation history/, 'on the record: the report');
    assert.doesNotMatch(m.$('#sh-ch-note').textContent, /file you import|answer comes back/, 'nothing comes back');
  });

  describe('the email says it is the record', () => {
    let h, W;
    before(async () => { h = await startHati(); W = await seedWorkspace(h); });
    after(async () => { await h.stop(); });
    const payloadFor = (id, purpose) => ({ kind: 'hati-share', org: 'Highland Corporate Ltd',
      sharedBy: 'Wanjiru Kamau', at: new Date().toISOString(), purpose,
      contract: { id, name: 'Raw Milk Collection', counterparty: 'Nandi Dairy',
        docText: 'The Buyer shall pay within thirty (30) days.', changes: [], negotiation: { round: 1, rounds: [] } } });
    test('a history send by Word file is described as the record, with the report attached', async () => {
      await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: payloadFor('MK-A2', 'history'), channel: 'word', durable: false, purpose: 'history',
        recipient: { name: 'Priya Nair', email: 'record@nandi.example' },
        file: { filename: 'MK-A2-negotiation-history.docx', content: Buffer.from('PK-not-really').toString('base64') } } });
      const ob = await W.admin.json('/api/outbox');
      const mail = (ob.items || []).find(m => String(m.to_addr) === 'record@nandi.example');
      assert.ok(mail, 'it went');
      assert.match(String(mail.subject), /negotiation history/i);
      assert.doesNotMatch(String(mail.subject), /to mark up/i);
      assert.match(String(mail.body), /record of the negotiation/i);
      assert.doesNotMatch(String(mail.body), /mark it up|reply to this email with the file/i, 'nothing comes back');
      assert.match(String(mail.detail || ''), /attachments: MK-A2-negotiation-history\.docx/);
    });
  });
});
