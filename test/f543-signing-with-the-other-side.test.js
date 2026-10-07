/* f543 — SIGNING WITH THE OTHER SIDE (work order O, part 1, 7 Oct 2026)
   (1) a sign link's GET carries the signatures so far, read live, with the
       mark, name, title and check — never an address — and this link's own
       signature while our side has not applied it yet; lastResponse carries
       the title (O-1, O-2).
   (2) a counterparty cannot sign while an ask we SENT them is still undecided
       (O-5); an ask still on our desk does not hold them.
   (3) pagesSignRows puts each signature in its party's box, ours first (O-1).
   (4) the sign step carries no comment box and the email is said, not asked;
       the reason box lives under "Not ready to sign?" (O-4).
   (5) a link whose answer was a signature draws the receipt, and the page
       says "You signed" rather than "ask for a fresh link" (O-2, O-3).
   (6) out of turn, or with a point open, the Sign button is held with its
       reason and the head's pill says so (O-5, O-6).
   (7) every new word is in both books.
   */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('f543 (1)(2) — the server', () => {
  let h, W, db;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });
    const { DatabaseSync } = require('node:sqlite');
    db = () => (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
    for (const id of ['MK-SG1', 'MK-SG2']) {
      const c = fixtureContract(id, 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', DOC);
      c.signatures = [{ party: 'first', name: 'Amina Otieno', title: 'Director', at: '2026-09-27T11:02:00.000Z',
        image: PNG, email: 'admin@example.co.ke', ip: '10.0.0.1', verified: true }];
      c.signerPlan = [
        { id: 'sg-us', party: 'internal', order: 1, name: 'Amina Otieno', role: 'Director', email: 'admin@example.co.ke',
          memberId: 'u_admin', signed: true, at: '2026-09-27T11:02:00.000Z' },
        { id: 'sg-cp', party: 'counterparty', order: 2, name: 'Grace Njeri', role: 'Legal Counsel', email: 'grace@client.co.ke', signed: false }];
      if (id === 'MK-SG2') c.changes = [
        { id: 'CHG-1', clauseId: 'c2', clauseLabel: '2. Payment', status: 'pending', authorSide: 'owner' },
        { id: 'CHG-2', clauseId: 'c1', clauseLabel: '1. Term', status: 'pending', authorSide: 'owner' }];
      await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    }
  });
  after(async () => { await h.stop(); });
  const mint = (id, changes) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
      at: new Date().toISOString(), docHash: 'h1', purpose: 'sign', purposeChosen: 'sign',
      contract: { id, name: 'Supply Agreement', counterparty: 'Juno Limited', fields: {},
        redlineText: DOC, format: 'text', docText: DOC, versions: [], changes: changes || [] } },
    channel: 'link', purpose: 'sign', recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' } } });

  test('(1) the signatures so far come down live, and their own the moment it is given', async () => {
    const s = await mint('MK-SG1');
    const them = h.client('them-sg1');
    const d0 = await them.json('/api/shares/' + s.token);
    assert.ok(Array.isArray(d0.signatures), 'a sign link carries the list');
    assert.equal(d0.signatures.length, 1);
    const ours = d0.signatures[0];
    assert.equal(ours.side, 'ours'); assert.equal(ours.name, 'Amina Otieno'); assert.equal(ours.title, 'Director');
    assert.equal(ours.image, PNG, 'the mark itself');
    assert.ok(!/@|10\.0\.0\.1|"ip"|"email"/.test(JSON.stringify(d0.signatures)), 'never an address or an IP');
    /* their own answer, stored on the link, not yet applied by our side */
    const d = db();
    d.prepare('UPDATE shares SET response=?, responded_at=?, applied=0 WHERE token=?').run(JSON.stringify({
      v: 1, kind: 'hati-response', action: 'sign', name: 'Grace Njeri', title: 'Legal Counsel',
      at: '2026-10-07T12:00:00.000Z', signatureImage: PNG, verify: 'tok' }), '2026-10-07T12:00:00.000Z', s.token);
    d.close();
    const d1 = await them.json('/api/shares/' + s.token);
    const mine = d1.signatures.find(x => x.side === 'theirs');
    assert.ok(mine, 'their own signature is on the list');
    assert.equal(mine.name, 'Grace Njeri'); assert.equal(mine.title, 'Legal Counsel');
    assert.equal(mine.verified, true); assert.equal(mine.pending, true);
    assert.equal(d1.lastResponse.title, 'Legal Counsel', 'the receipt has the title');
    assert.equal(d1.lastResponse.verified, true);
  });

  test('(2) a counterparty cannot sign over an ask we sent them', async () => {
    const s = await mint('MK-SG2', [{ id: 'CHG-1', clauseId: 'c2', status: 'pending', authorSide: 'owner' }]);
    const them = h.client('them-sg2');
    const r = await them.raw('/api/shares/' + s.token + '/respond', { method: 'POST', body: {
      v: 1, kind: 'hati-response', action: 'sign', name: 'Grace Njeri', email: 'grace@client.co.ke', at: new Date().toISOString() } });
    assert.equal(r.status, 409, 'refused');
    const j = r.json;
    assert.match(j.error, /Answer the open point first \(2\. Payment\)/);
    assert.ok(!/1\. Term/.test(j.error), 'CHG-2 was never sent to them, so it does not hold them');
  });
});

/* ---------------------------------------------------------------- (3) */
test('f543 (3) each signature lands in its own party\'s box', () => {
  const win = buildPortal().win;
  const c = { party: 'Highland', counterparty: 'Juno Limited' };
  const rows = win.pagesSignRows(c, [
    { side: 'theirs', name: 'Grace Njeri', title: 'Legal Counsel', at: '2026-10-07T12:00:00Z' },
    { party: 'first', name: 'Amina Otieno', title: 'Director' }]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, 'Amina Otieno', 'ours is the first box');
  assert.equal(rows[1].name, 'Grace Njeri', 'theirs the second');
  assert.equal(JSON.stringify(win.pagesSignRows(c, [])), '[null,null]', 'nothing signed, nothing drawn');
  /* the painter marks a signed box and drops its "Sign here" */
  const d = win.document;
  const host = d.createElement('div');
  host.innerHTML = '<div class="rl-paper-foot"><div class="rl-sigline" data-pg-flag="Sign here"><span class="rl-sigrule"></span><span class="rl-sigfor">For Highland</span></div>'
    + '<div class="rl-sigline pg-mine" data-pg-flag="Sign here"><span class="rl-sigrule"></span><span class="rl-sigfor">For Juno</span></div></div>';
  win.pagesSignMarks(host, [null, { name: 'Grace Njeri', title: 'Legal Counsel', image: PNG, verified: true, at: '2026-10-07T12:00:00Z' }]);
  const lines = host.querySelectorAll('.rl-sigline');
  assert.ok(!lines[0].classList.contains('pg-signed'), 'an unsigned box is left as it was');
  assert.ok(lines[1].classList.contains('pg-signed'));
  assert.equal(lines[1].getAttribute('data-pg-flag'), null, 'no "Sign here" over a signature');
  assert.ok(lines[1].querySelector('.rl-sigmark img'), 'the mark is drawn');
  assert.match(lines[1].querySelector('.rl-sigby').textContent, /Grace Njeri, Legal Counsel .* verified by email/);
});

/* ---------------------------------------------------------------- (4)–(6) */
function signingPage(opts){
  const p = buildPortal();
  const win = p.win;
  const c = win.migrateContract ? win.migrateContract(supplyContract()) : supplyContract();
  win.negoInit(c);
  if (opts.changes) c.changes = opts.changes;
  const payload = sharePayloadFor(p, c, {}, { purpose: 'sign' });
  payload.purpose = 'sign'; payload.purposeChosen = 'sign';
  if (opts.changes) payload.contract.changes = opts.changes;
  p.open(payload, Object.assign({ purpose: 'sign', token: 'tok-543',
    share: { recipientName: 'Erik Lindqvist', recipientEmail: 'erik@nordkust.se' } }, opts.opts || {}));
  return win;
}

test('f543 (4) the sign step asks only what it needs', () => {
  const win = signingPage({});
  const d = win.document;
  const body = d.getElementById('pt-sign-body');
  assert.ok(body, 'the sign step is drawn');
  const other = d.getElementById('pt-other');
  const box = d.getElementById('pt-comment');
  assert.ok(box && other.contains(box), 'the reason box lives under "Not ready to sign?"');
  assert.ok(!d.querySelector('#pt-sign-body input#pt-email:not([type="hidden"])'), 'the email is not a box to type in');
  assert.match(body.textContent, /erik@nordkust\.se/);
  assert.match(body.textContent, /Your one-time code goes to this address/);
});

test('f543 (5) a signed link draws the receipt and says it plainly', () => {
  const win = signingPage({ opts: { responded: true,
    lastResponse: { action: 'sign', name: 'Erik Lindqvist', title: 'CEO', at: '2026-10-07T12:00:00Z', verified: true } } });
  const d = win.document;
  const body = d.getElementById('pt-sign-body');
  assert.match(body.textContent, /You signed/);
  assert.match(body.textContent, /Erik Lindqvist, CEO/);
  assert.match(body.textContent, /Email code to erik@nordkust\.se/);
  assert.equal(d.getElementById('pt-sign'), null, 'no Sign button over a signature');
  assert.ok(!/Ask the sender for a fresh one/.test(d.body.textContent), 'never "ask for a fresh link" after signing');
  assert.equal(win.portalSignedHere(), true);
});

test('f543 (6) out of turn or over an open point, Sign is held with its reason', () => {
  const order = [
    { step: 1, rows: [{ side: 'ours', party: 'Highland', name: 'Wanjiru Kamau', signed: false, you: false }] },
    { step: 2, rows: [{ side: 'theirs', party: 'Nordkust', name: 'Erik Lindqvist', signed: false, you: true }] }];
  let d = signingPage({ opts: { signingOrder: order } }).document;
  let b = d.getElementById('pt-sign');
  assert.ok(b.disabled, 'held while it is not their turn');
  assert.match(d.getElementById('pt-sign-body').textContent, /Wanjiru Kamau signs first/);
  assert.match(d.body.textContent, /Waiting for Wanjiru Kamau/, 'the pill says so');
  const turn = order.map(st => ({ ...st, rows: st.rows.map(r => r.you ? r : { ...r, signed: true }) }));
  const ask = [{ id: 'CHG-9', clauseId: 'c2', clauseLabel: '2. Payment', status: 'pending', authorSide: 'owner' }];
  d = signingPage({ changes: ask, opts: { signingOrder: turn } }).document;
  b = d.getElementById('pt-sign');
  assert.ok(b.disabled, 'held while a point waits on them');
  assert.match(d.getElementById('pt-sign-body').textContent, /1 point still needs your answer/);
  assert.ok(d.getElementById('pt-go-point'), 'with a way to it');
  d = signingPage({ opts: { signingOrder: turn } }).document;
  assert.ok(!d.getElementById('pt-sign').disabled, 'live when it is their turn and nothing is open');
  assert.match(d.body.textContent, /Your turn to sign/);
});

test('f543 (7) every new word is in both books', () => {
  for (const k of ['pg_signature_of', 'pg_not_yet_signed', 'pg_verified_by_email', 'po_work_email', 'po_code_goes_here',
    'po_reason_label', 'po_why_ph', 'po_rc_you_signed', 'po_ro_signed', 'po_rc_checked', 'po_rc_download',
    'po_hold_wait', 'po_hold_points', 'po_pill_turn', 'po_pill_waiting', 'po_pill_fully'])
    assert.ok(inBoth(k), k);
});
