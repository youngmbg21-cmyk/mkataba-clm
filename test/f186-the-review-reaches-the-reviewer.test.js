/* ============================================================
   f186 — the internal review reaches the reviewer, and can be called off
   ============================================================
   Owner's report, 12 Aug 2026: the colleague never got an email, and the
   review could not be cancelled. Neither was a missing feature — both were
   already built and both failed the same way, by being invisible.

   THE EMAIL. The dialog's tick-box arrives ticked, the server resolves the
   recipient from the workspace's own records and refuses a body-supplied
   address, and it reports honestly whether anything left. What it did NOT do
   was let the requester tell the three "nothing arrived" cases apart — email
   is not configured on this server at all (there is an internal outbox for
   exactly that), the tick-box was cleared, or a provider refused — and it said
   whatever it said in a TOAST, which is gone in seconds. So the outcome is
   named and recorded where it lasts: on the review itself and in the audit
   trail. And the link now lands on the contract, on its negotiation, rather
   than on the front door, built by the same server function as the internal
   signer's mail.

   CANCEL. Requester-or-admin-only, named by the change ids it covers, and told
   only to the reviewer it was taken from — all of that was right. It lived in
   the review notice, and since 10 August every notice on that page arrives
   folded behind a bell, so the button existed and effectively nobody could
   find it. Two answers here: a review still in play brings the stack up
   unfolded, and the change card carries its own Cancel beside the status that
   says why the change cannot be sent.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 5 · Pricing</h2><p>Prices are fixed for the first twelve months.</p>';

const ME    = { id: 'u_me',  name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@w.co.ke' };
const SALES = { id: 'u_sal', name: 'Achieng Otieno', role: 'legal', email: 'achieng@w.co.ke' };
const BOSS  = { id: 'u_adm', name: 'Amina Mwangi',   role: 'admin', email: 'amina@w.co.ke' };
const TEAM  = [ME, SALES, BOSS];

const contract = (over = {}) => ({ id: 'MK-R1', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 4800000, redlineText: BODY, format: 'rich', ...over });

function world(user = ME){
  const w = buildWorld({ user, negotiationView: true, contractView: true });
  w.win.getUsers = () => TEAM;
  w.win.userById = id => TEAM.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}
/* One of our own asks, and a review of it out with SALES. */
async function asked(w){
  const c = contract();
  w.win.negoInit(c);
  const cl = w.win.negoClauseList(c).find(x => x.num === '5');
  const ch = await w.win.negoEditClause(c, cl.clauseId,
    '<p>Prices are fixed for twenty-four months.</p>',
    { side: 'owner', author: ME.name, summary: 'ask on 5' });
  const rv = w.win.reviewAsk(c, { reviewer: SALES, ids: [ch.id] });
  w.win.state = Object.assign({}, w.win.state,
    { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  w.win.getContract = id => (String(id) === String(c.id) ? c : null);
  return { c, ch, rv };
}

describe('f186 (A) — did the colleague actually get told', () => {
  test('the outcome is RECORDED, not shouted once and lost', async () => {
    const w = world();
    const { c, rv } = await asked(w);
    w.win.reviewNoteDelivery(c, rv, { wanted: true, sent: true, to: SALES.email });
    assert.equal(rv.notice.kind, 'sent');
    assert.equal(rv.notice.to, SALES.email);
    assert.ok(rv.notice.at, 'and when');
    /* And in the audit trail, which is the record a toast is not. */
    const line = (c.audit || []).map(a => `${a.action} ${a.detail}`).join(' | ');
    assert.match(line, /Email sent to Achieng Otieno at achieng@w\.co\.ke/);
  });

  test('THE THREE WAYS NOTHING ARRIVES ARE TOLD APART', async () => {
    /* From the requester's chair these looked identical — a review that had not
       been opened for two days, and no way to know which of the three it was. */
    const w = world();
    const a = await asked(w);
    w.win.reviewNoteDelivery(a.c, a.rv, { wanted: false });
    assert.equal(a.rv.notice.kind, 'not-asked');
    assert.match(w.win.reviewDeliveryState(a.rv).text, /you chose to tell Achieng Otieno yourself/i);

    const b = await asked(world());
    b.rv.reviewer = { id: SALES.id, name: SALES.name, email: SALES.email };
    w.win.reviewNoteDelivery(b.c, b.rv, { wanted: true, outbox: true });
    assert.equal(b.rv.notice.kind, 'outbox');
    assert.match(w.win.reviewDeliveryState(b.rv).text, /no mail provider set up/i);

    const d = await asked(world());
    w.win.reviewNoteDelivery(d.c, d.rv, { wanted: true, why: 'Resend rejected this message (403).' });
    assert.equal(d.rv.notice.kind, 'refused');
    assert.equal(d.rv.notice.why, 'Resend rejected this message (403).');
    assert.equal(w.win.reviewDeliveryState(d.rv).tone, 'ruby');
  });

  test('an older review with no record says nothing — "unknown" is not "failed"', async () => {
    const w = world();
    const { rv } = await asked(w);
    assert.equal(w.win.reviewDeliveryState(rv), null);
  });

  test('THE RECORD SURVIVES A DEAD MAIL PROVIDER', () => {
    /* The standing rule, and the one this change must not break: the review is
       filed before anything is sent, and the send's failure is reported rather
       than thrown. */
    const src = read('js/review.js');
    const fn = src.slice(src.indexOf("document.getElementById('rv-send')?.addEventListener"));
    const body = fn.slice(0, fn.indexOf('\n  });'));
    assert.ok(body.indexOf('reviewAsk(') < body.indexOf('review-request'),
      'the record exists before the knock on the door');
    assert.match(body, /catch\s*\(e\)\s*\{/, 'and a refused send is caught, never thrown');
    assert.match(body, /reviewNoteDelivery\(c, rv, out\)/);
  });

  test('the banner prints the outcome beside the review it belongs to', async () => {
    const w = world();
    const { c, rv } = await asked(w);
    w.win.reviewNoteDelivery(c, rv, { wanted: true, outbox: true });
    const html = w.win.reviewBannerHtml(c, {});
    assert.match(html, /no mail provider set up/i);
    assert.match(html, /rv-cancel:REV-1/, 'and the Cancel is on the same row');
  });

  test('THE LINK LANDS ON THE CONTRACT, ON ITS NEGOTIATION', () => {
    const srv = read('server/server.js');
    const route = srv.slice(srv.indexOf("app.post('/api/contracts/:id/review-request'"));
    const body = route.slice(0, route.indexOf('\n});'));
    assert.match(body, /contractUrl\(req, req\.params\.id, 'redline'\)/,
      'not the site root — the agreement, on the screen the ask is about');
    assert.ok(!/const appUrl = /.test(body), 'the front-door link is gone');
    /* ONE BUILDER, not two: the internal signer's mail had the identical fault
       and both now go through contractUrl. */
    assert.match(srv, /const contractUrl = \(req, contractId, tab\) =>/);
    assert.match(srv, /const contractSignUrl = \(req, contractId\) => contractUrl\(req, contractId, 'sign'\);/);
    /* And the browser honours it on the far side of the sign-in wall. */
    const core = read('js/core.js');
    const hash = core.slice(core.indexOf('function openFromHash'));
    assert.match(hash.slice(0, hash.indexOf('\n}')), /'redline'\]\.includes\(tab\)/);
  });

  test('and the reason travels with the answer', () => {
    const srv = read('server/server.js');
    const route = srv.slice(srv.indexOf("app.post('/api/contracts/:id/review-request'"));
    const body = route.slice(0, route.indexOf('\n});'));
    assert.match(body, /emailError: \(sent && sent\.detail\) \|\| null/);
    assert.match(body, /outbox: !EMAIL_ON\(\)/);
    assert.match(body, /to: u\.email/);
  });
});

describe('f186 (B) — Cancel is findable, and still nobody else’s to press', () => {
  test('A REVIEW IN PLAY BRINGS THE NOTICE STACK UP UNFOLDED', async () => {
    const w = world();
    const { c } = await asked(w);
    assert.equal(w.win.reviewWantsAttention(c), true);
    assert.equal(w.win.rlNoticesFolded(c), false,
      'the one notice carrying a control its reader must reach does not hide');
    /* And the reader still wins once they decide. */
    w.win.rlSetNoticesFolded(c, true);
    assert.equal(w.win.rlNoticesFolded(c), true);
  });

  test('the change card carries its own Cancel, named by the changes it covers', async () => {
    const w = world();
    const { c, ch, rv } = await asked(w);
    const html = w.win.reviewCardCancelHtml(c, ch, {});
    assert.match(html, new RegExp(`data-rv-cancel="${rv.id}"`));
    assert.match(html, new RegExp(ch.id), 'the tooltip names the CHANGE ids, never "REV-2"');
    assert.match(html, /Achieng Otieno/, 'and who has it');
  });

  test('BOTH card renderers draw it — the duplication rule', () => {
    const src = read('js/views/negotiation.js');
    const wb = src.slice(src.indexOf('function redlineChangeCardsHtml'));
    assert.match(wb.slice(0, wb.indexOf('\n}\n')), /reviewCardCancelHtml\(c, ch, opts\)/);
    const live = src.slice(src.indexOf('function negoLiveCardsHtml'));
    assert.match(live.slice(0, live.indexOf('\nfunction ')), /reviewCardCancelHtml\(c, ch, opts\)/);
  });

  test('THE REVIEWER IS NEVER OFFERED IT', async () => {
    /* ME asks; SALES is the one looking. */
    const w = world();
    const { c, ch } = await asked(w);
    w.win.currentUser = () => SALES;
    assert.equal(w.win.reviewCardCancelHtml(c, ch, {}), '',
      'a reviewer must not be shown a Cancel for the job they were handed');
  });

  test('nor is an uninvolved colleague; an admin is', async () => {
    const w = world();
    const { c, ch } = await asked(w);
    /* A third person, on neither side of the review. */
    const other = { id: 'u_other', name: 'Someone Else', role: 'legal', email: 'x@w.co.ke' };
    w.win.currentUser = () => other;
    assert.equal(w.win.reviewCardCancelHtml(c, ch, {}), '');
    w.win.currentUser = () => BOSS;
    assert.match(w.win.reviewCardCancelHtml(c, ch, {}), /data-rv-cancel/);
  });

  test('THE COUNTERPARTY IS NEVER SHOWN IT', async () => {
    const w = world();
    const { c, ch } = await asked(w);
    assert.equal(w.win.reviewCardCancelHtml(c, ch, { side: 'counterparty' }), '');
    assert.equal(w.win.reviewCardCancelHtml(c, ch, { readonly: true }), '');
    const was = w.win.PORTAL_MODE;
    w.win.PORTAL_MODE = true;
    assert.equal(w.win.reviewCardCancelHtml(c, ch, {}), '');
    w.win.PORTAL_MODE = was;
  });

  test('IT SAYS WHAT CANCELLING COSTS, before the press', async () => {
    const w = world();
    const { c, ch, rv } = await asked(w);
    w.win.reviewMark(c, ch.id, 'held', { force: true, by: SALES.name, byId: SALES.id });
    const cost = w.win.reviewCancelCost(c, rv);
    assert.match(cost, /Achieng Otieno has ruled on 1 of 1/);
    assert.match(cost, /those verdicts go with it/i);
    assert.match(cost, new RegExp(ch.id), 'and it names the clauses it covers');
    /* The confirm is actually asked for, not just available. */
    const src = read('js/review.js');
    const wire = src.slice(src.indexOf("closest('[data-rv-cancel]')"));
    assert.match(wire.slice(0, 900), /confirmDialog\(/);
    assert.match(wire.slice(0, 900), /reviewCancelCost\(c, rv\)/);
  });

  test('and the model refuses underneath, however the button was drawn', async () => {
    const w = world();
    const { c, rv } = await asked(w);
    w.win.currentUser = () => SALES;
    assert.equal(w.win.reviewCancel(c, { reviewId: rv.id }), null);
    assert.equal(rv.status, 'open');
  });
});
