/* f580 — THE SEAL IS THE SERVER'S (D4, the owner's decision, 8 Oct 2026).
   ============================================================
   "Seal on the server, recorded as HaTi (System), not whoever opened the app."
   The functional review of 9 Oct found the seal, the trail lines and the
   executed copies waiting for whichever colleague's browser next polled — and
   that bystander named as the signatory. Measured here on the server alone,
   with no browser anywhere:

     (1) the counterparty signs LAST on their link: the server files the
         signature, seals as HaTi with sealString's own string, names our own
         signer as the signatory, writes the trail, marks the answer filed
         (applied=2, listed as serverFiled) and sends the copies — the trail
         saying they wait in the outbox, because email is not set up (B16);
     (2) a page holding the record from before cannot save over the seal, and
         a later save does not unfile the copies;
     (3) a frozen copy drawn from wording that has since moved is NOT sealed
         from; the next save that carries a fresh one is, by HaTi;
     (4) the counterparty signs FIRST: the server files it, logged as a
         "Signature" and not a countersignature (B17), and our last signature
         is sealed in the save that carries it;
     (5) no route: our signature seals on its save, as it always did — by HaTi;
     (6) an older page that sealed for itself is re-sealed by the server.
   Run: node --test test/f580-the-seal-is-the-servers.test.js */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const sha = s => crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
/* sealString (js/core.js), copied by hand ON PURPOSE: the server's twin must
   agree with the browser's, and a test that imported the server's own would
   only prove it agrees with itself. */
const sealString = c => {
  const content = c.source === 'upload' ? 'file:' + ((c.upload && c.upload.fileHash) || '') : 'text:' + ((c.execution && c.execution.textHash) || '');
  const base = { id: c.id, firstParty: (c.execution && c.execution.firstParty), counterparty: c.counterparty,
    value: c.value, valueType: c.valueType, content, signedAt: (c.execution && c.execution.at) || '' };
  if (Number(c.sealVersion || 0) >= 2) base.sigs = (c.signatures || []).map(s => ({ name: s.name || '', at: s.at || '', form: s.form || s.method || '', imageHash: s.imageHash || '' }));
  return JSON.stringify(base);
};
const prep = (html, extra) => ({ html, format: 'text', hashMode: 'text', textHash: sha(html), firstParty: 'Highland Corporate Ltd',
  esignature: 'Signed electronically', ver: { text: DOC, canon: DOC, format: 'text', body: DOC }, ...(extra || {}) });
const ourSig = at => ({ party: 'internal-planned', name: 'Amina Otieno', title: 'Director', email: 'admin@example.co.ke',
  at, method: 'session-authenticated', form: 'typed', typedName: 'Amina Otieno' });
const wait = ms => new Promise(r => setTimeout(r, ms));

describe('f580 — the seal is the server\'s', () => {
  let h, W, sqlite;
  const db = () => { const d = new sqlite.DatabaseSync(require('node:path').join(h.dataDir, 'hati.db')); d.exec('PRAGMA busy_timeout = 5000'); return d; };
  const put = (c, v) => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: v } });
  const putRaw = (c, v) => W.admin.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: v } });
  const get = id => W.admin.json('/api/contracts/' + id);
  const mint = (id, signerId) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
      docHash: 'h1', purpose: 'sign', purposeChosen: 'sign',
      contract: { id, name: 'Supply Agreement', counterparty: 'Juno Limited', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [], changes: [] } },
    channel: 'link', purpose: 'sign', signerId, recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' } } });
  const theySign = async (token, email) => h.client('them-' + token.slice(0, 6)).raw('/api/shares/' + token + '/respond', { method: 'POST', body: {
    v: 1, kind: 'hati-response', action: 'sign', name: 'Grace Njeri', title: 'Legal Counsel', email: email || 'grace@client.co.ke',
    at: new Date().toISOString(), signatureForm: 'drawn', signatureImage: PNG, signatureImageHash: sha(PNG) } });
  const contract = (id, plan, extra) => ({ ...fixtureContract(id, 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', DOC),
    signerPlan: plan, ...(extra || {}) });

  before(async () => {
    sqlite = require('node:sqlite');
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });
  });
  after(async () => { await h.stop(); });

  test('(1) their last signature seals the record on the server, as HaTi, and the copies go', async () => {
    const at = '2026-10-08T09:00:00.000Z';
    const c = contract('MK-SL1', [
      { id: 'sg-us', party: 'internal', order: 1, name: 'Amina Otieno', role: 'Director', email: 'admin@example.co.ke', signed: true, at },
      { id: 'sg-cp', party: 'counterparty', order: 2, name: 'Grace Njeri', email: 'grace@client.co.ke', signed: false }],
      { signatures: [ourSig(at)], sealPrep: prep('<p>' + DOC + '</p>') });
    await put(c, 0);
    const held = await get('MK-SL1');
    assert.ok(held.sealPrep && held.sealPrep.basis, 'the server stamps the frozen copy with what it was drawn from');
    const s = await mint('MK-SL1', 'sg-cp');
    const r = await theySign(s.token);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const x = await get('MK-SL1');
    assert.equal(x.status, 'Signed', 'sealed the moment the signature landed — no browser opened');
    assert.equal(x.execution.by, 'HaTi');
    assert.equal(x.execution.textHash, sha('<p>' + DOC + '</p>'));
    assert.equal(x.sealVersion, 2);
    assert.equal(x.hash, sha(sealString(x)), 'the browser\'s sealString reproduces the seal — verifySeal agrees');
    assert.equal(x.signatory, 'Amina Otieno (Director)', 'our own signer, never a bystander');
    assert.equal(x.signatures.length, 2);
    assert.ok(x.signerPlan.every(p => p.signed), 'their row is marked signed');
    assert.ok(!x.sealPrep, 'the prep is gone once it became the seal');
    assert.ok(x.audit.some(a => a.user === 'HaTi' && a.action === 'Signed'), 'the seal\'s trail line is HaTi\'s');
    assert.ok(x.audit.some(a => a.user === 'HaTi' && a.action === 'Countersigned' && /Grace Njeri/.test(a.detail)),
      'we signed first, so theirs is a countersignature');
    assert.ok((x.versions || []).some(v => v.label === 'Signed & sealed' && v.by === 'HaTi'));
    const pend = await W.admin.json('/api/shares/pending');
    const mine = pend.find(p => p.token === s.token);
    assert.ok(mine && mine.serverFiled === true, 'listed so every page catches up, marked as filed by the server');
    let y = null;
    for (let i = 0; i < 40 && !(y && y.distribution); i++) { await wait(100); y = await get('MK-SL1'); }
    assert.ok(y.distribution && y.distribution.fully === true, 'the executed copies went from the server');
    const line = y.audit.filter(a => a.action === 'Distributed').pop();
    assert.ok(line && line.user === 'HaTi', 'the server wrote the line');
    assert.match(line.detail, /waiting in the outbox for \d recipient\(s\) — email is not set up/, 'B16: says what happened, not "emailed"');
    assert.doesNotMatch(line.detail, /emailed to/);
  });

  test('(2) a page from before the seal cannot save over it, and a later save keeps the copies on file', async () => {
    const x = await get('MK-SL1');
    const stale = { ...x, status: 'Under Review', hash: null }; delete stale._v;
    const r = await putRaw(stale, x._v - 2);
    assert.equal(r.status, 409);
    const fresh = await get('MK-SL1'); const v = fresh._v; delete fresh._v; delete fresh.distribution;
    fresh.notes = 'a note after signing';
    await put(fresh, v);
    const back = await get('MK-SL1');
    assert.ok(back.distribution && back.distribution.fully === true, 'the stored delivery receipt is not unfiled');
    assert.equal(back.hash, x.hash);
  });

  test('(3) a frozen copy drawn from wording that has since moved is not sealed from', async () => {
    const c = contract('MK-SL2', [
      { id: 'sg-us', party: 'internal', order: 1, name: 'Amina Otieno', role: 'Director', email: 'admin@example.co.ke', signed: false },
      { id: 'sg-cp', party: 'counterparty', order: 2, name: 'Grace Njeri', email: 'grace@client.co.ke', signed: false }],
      { sealPrep: prep('<p>old</p>') });
    await put(c, 0);
    const v1 = (await get('MK-SL2'))._v;
    const moved = { ...c, redlineText: DOC + '\n3. NOTICES\nIn writing.' };
    await put(moved, v1);
    const at = new Date().toISOString();
    const signed = { ...moved, signerPlan: moved.signerPlan.map(p => p.id === 'sg-us' ? { ...p, signed: true, at } : p), signatures: [ourSig(at)] };
    await put(signed, v1 + 1);
    const s = await mint('MK-SL2', 'sg-cp');
    assert.equal((await theySign(s.token)).status, 200);
    const x = await get('MK-SL2');
    assert.notEqual(x.status, 'Signed', 'never sealed over a copy of other words');
    assert.ok(x.signatures.length === 2 && x.signerPlan.every(p => p.signed), 'their signature is filed all the same');
    assert.ok(x.audit.some(a => a.action === 'Seal waiting'), 'and the trail says the seal is waiting');
    const v = x._v; delete x._v;
    const r = await put({ ...x, sealPrep: prep('<p>' + x.redlineText + '</p>') }, v);
    assert.equal(r.sealed, true, 'the save carrying a fresh copy is sealed — by the server');
    const y = await get('MK-SL2');
    assert.equal(y.status, 'Signed'); assert.equal(y.execution.by, 'HaTi');
    assert.equal(y.hash, sha(sealString(y)));
  });

  test('(4) they sign first: filed as a Signature (B17); our last signature seals on its save', async () => {
    const c = contract('MK-SL3', [
      { id: 'sg-cp', party: 'counterparty', order: 1, name: 'Grace Njeri', email: 'grace@client.co.ke', signed: false },
      { id: 'sg-us', party: 'internal', order: 2, name: 'Amina Otieno', role: 'Director', email: 'admin@example.co.ke', signed: false }]);
    await put(c, 0);
    const s = await mint('MK-SL3', 'sg-cp');
    assert.equal((await theySign(s.token)).status, 200);
    const x = await get('MK-SL3');
    assert.notEqual(x.status, 'Signed');
    const line = x.audit.find(a => /Grace Njeri/.test(a.detail || '') && /share link/.test(a.detail || ''));
    assert.ok(line, 'filed on the server');
    assert.equal(line.action, 'Signature', 'nobody on our side had signed — it is not a countersignature');
    const d = db(); const row = d.prepare('SELECT applied FROM shares WHERE token=?').get(s.token); d.close();
    assert.equal(row.applied, 2);
    const at = new Date().toISOString();
    const v = x._v; delete x._v;
    x.signerPlan = x.signerPlan.map(p => p.id === 'sg-us' ? { ...p, signed: true, at, by: 'Amina Otieno' } : p);
    x.signatures = x.signatures.concat([ourSig(at)]);
    x.sealPrep = prep('<p>' + DOC + '</p>');
    const r = await put(x, v);
    assert.equal(r.sealed, true);
    const y = await get('MK-SL3');
    assert.equal(y.status, 'Signed'); assert.equal(y.execution.by, 'HaTi');
    assert.equal(y.hash, sha(sealString(y)));
  });

  test('(5) no route: our signature seals on its save, as it always did — by HaTi', async () => {
    const at = new Date().toISOString();
    const c = { ...contract('MK-SL4', []), counterparty: '', signatures: [] };
    await put(c, 0);
    const x = await get('MK-SL4'); const v = x._v; delete x._v;
    x.signatures = [{ party: 'first', name: 'Amina Otieno', email: 'admin@example.co.ke', at, method: 'session-authenticated', form: 'typed' }];
    x.sealPrep = prep('<p>' + DOC + '</p>');
    const r = await put(x, v);
    assert.equal(r.sealed, true);
    const y = await get('MK-SL4');
    assert.equal(y.execution.by, 'HaTi'); assert.equal(y.hash, sha(sealString(y)));
    assert.equal(y.signatory, 'Amina Otieno');
  });

  test('(6) an older page that sealed for itself is re-sealed by the server', async () => {
    const at = new Date().toISOString();
    const c = contract('MK-SL5', [
      { id: 'sg-cp', party: 'counterparty', order: 1, name: 'Grace Njeri', email: 'grace@client.co.ke', signed: true, at },
      { id: 'sg-us', party: 'internal', order: 2, name: 'Amina Otieno', email: 'admin@example.co.ke', signed: false }],
      { signatures: [{ party: 'counterparty', name: 'Grace Njeri', at, method: 'share-link' }] });
    await put(c, 0);
    const x = await get('MK-SL5'); const v = x._v; delete x._v;
    x.signerPlan = x.signerPlan.map(p => ({ ...p, signed: true, at }));
    x.signatures = x.signatures.concat([ourSig(at)]);
    x.execution = { at, by: 'A Bystander', html: '<p>' + DOC + '</p>', textHash: sha('<p>' + DOC + '</p>'), firstParty: 'Highland Corporate Ltd', format: 'text', hashMode: 'text' };
    x.hash = 'computed-in-a-browser'; x.status = 'Signed'; x.sealVersion = 2; x.signatory = 'A Bystander';
    const r = await put(x, v);
    assert.equal(r.sealed, true);
    const y = await get('MK-SL5');
    assert.equal(y.execution.by, 'HaTi'); assert.notEqual(y.hash, 'computed-in-a-browser');
    assert.equal(y.hash, sha(sealString(y)));
    assert.equal(y.signatory, 'Amina Otieno (Director)', 'never the bystander the page named');
  });

  /* B17 (8 Oct 2026): after the counterparty signed, the owner's bell said
     "they cannot answer your changes — their link stopped working". The
     signing link closes the negotiation copy on purpose; once somebody has
     signed that is not a stuck way back. */
  test('(7) after their signature, the closed negotiation link is not a stuck way back (B17)', async () => {
    const c = contract('MK-SL6', [
      { id: 'sg-cp', party: 'counterparty', order: 1, name: 'Grace Njeri', email: 'grace@client.co.ke', signed: false },
      { id: 'sg-us', party: 'internal', order: 2, name: 'Amina Otieno', email: 'admin@example.co.ke', signed: false }]);
    await put(c, 0);
    await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
        docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
        contract: { id: 'MK-SL6', name: 'Supply Agreement', counterparty: 'Juno Limited', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [], changes: [] } },
      channel: 'link', purpose: 'negotiate', recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' } } });
    const s = await mint('MK-SL6', 'sg-cp');
    /* an ask of ours filed AFTER the signing link went — the one way a
       negotiation can still look open once signing has started */
    const x0 = await get('MK-SL6'); const v0 = x0._v; delete x0._v;
    x0.changes = [{ id: 'CHG-9', clauseId: 'c2', clauseLabel: '2. Payment', status: 'pending', authorSide: 'owner', createdAt: new Date().toISOString() }];
    await put(x0, v0);
    assert.equal((await theySign(s.token)).status, 200);
    const x = await get('MK-SL6');
    assert.ok(x._reach && x._reach.signing === true, 'the reading says signing has begun: ' + JSON.stringify(x._reach));
    const AG = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'views', 'agents.js'), 'utf8');
    assert.match(AG, /if \(move && move\.why === 'nocopy' && !R\.signing\)\{/, 'and the bell\'s reader stands down on it');
    const line = x.audit.find(a => /Grace Njeri/.test(a.detail || '') && /share link/.test(a.detail || ''));
    assert.equal(line && line.action, 'Signature', 'their first signature is not called a countersignature');
  });
});
