/* F7 — the share payload carries only what the counterparty portal renders.

   The payload is a copy of the contract that leaves the organisation: in server
   mode it is served to anyone holding the link, in static mode it travels
   inside the link itself. This pins the field list, and guards the portal
   against the trim — the counterparty page must still render, counter-proposals
   must still work, and a rich-format body must still display. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const CORE = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');

/* Read the payload literal straight out of openShareModal — this is the object
   the product actually publishes, not a copy of it kept in a test. */
function payloadFields() {
  const at = CORE.indexOf('const payloadObj={');
  assert.ok(at > 0, 'openShareModal should still build a payloadObj');
  return CORE.slice(at, CORE.indexOf('const server=API_MODE();', at));
}

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

describe('F7 — the payload field list', () => {
  test('the contract\'s folder is no longer published', () => {
    const src = payloadFields();
    assert.ok(!/\bfolder:/.test(src), 'folder is still in the share payload');
  });

  test('every field the portal renders is still published', () => {
    const src = payloadFields();
    for (const f of ['id:', 'name:', 'counterparty:', 'template:', 'fields:', 'source:',
                     'upload:', 'value:', 'valueType:', 'redlineText:', 'format:',
                     'org:', 'sharedBy:', 'at:', 'docHash'])
      assert.ok(src.includes(f), `the portal needs ${f} and it is missing from the payload`);
  });

  test('the format marker travels, or a rich document renders as markup', () => {
    assert.match(payloadFields(), /format:c\.redlineText\?docFormat\(c\.format\):undefined/);
  });

  test('the upload is trimmed to the file itself', () => {
    const src = CORE.slice(CORE.indexOf('const shareUpload = u =>'), CORE.indexOf('const payloadObj={'));
    for (const keep of ['fileName', 'size', 'mime', 'fileHash', 'dataUrl', 'extractedText'])
      assert.ok(src.includes(keep), `the portal needs upload.${keep}`);
    for (const drop of ['textFingerprint', 'simhash', 'ocrPages', 'fileId'])
      assert.ok(!src.includes(drop), `upload.${drop} is portfolio bookkeeping and must not be published`);
  });
});

describe('F7 — the counterparty portal still works end to end', () => {
  /* A payload of exactly the shape openShareModal now produces — no folder,
     trimmed upload — pushed through a real server and read back by an
     anonymous portal visitor. */
  const PAYLOAD = {
    v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
    at: '2026-07-25T08:00:00.000Z', docHash: 'd'.repeat(64),
    contract: {
      id: 'MK-A2', name: 'Raw Milk Collection', template: 'RM', source: null, upload: undefined,
      counterparty: 'Nandi Dairy', value: 36000000, valueType: 'standard', fields: { value: '36000000' },
      redlineText: '<p>Clause 4 — <strong>payment</strong> within 30 days.</p>', format: 'rich',
    },
  };

  test('the portal fetch returns the payload, and it has no folder in it', async () => {
    const share = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: PAYLOAD, channel: 'link', recipient: { name: 'Grace Njeri' } } });
    const anon = h.client('portal');
    const got = await anon.raw('/api/shares/' + share.token);
    assert.equal(got.status, 200);
    assert.equal(got.json.payload.contract.folder, undefined, 'the folder reached the counterparty');
    assert.ok(!/"folder"/.test(got.text), 'the raw payload body still names a folder');
    assert.equal(got.json.payload.contract.format, 'rich', 'the rich-format marker must survive the round trip');
    assert.equal(got.json.payload.contract.redlineText, PAYLOAD.contract.redlineText);
    assert.equal(got.json.payload.contract.value, 36000000, 'the counter-proposal field needs the value');
  });

  test('the portal renders that payload without a folder', () => {
    const sb = loadViews(['js/views/portal.js'], {
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      migrateContract: c => Object.assign({ audit: [], signatures: [], comments: [], fields: {}, rounds: [] }, c),
      docBody: () => '<p>document</p>', docPlainText: () => 'document',
      isMonetary: c => c.valueType !== 'none',
      isUpload: c => c.source === 'upload',
      isExternallyExecuted: () => false,
      freezeContractHtml: () => '<p>document</p>', normText: s => String(s),
      renderDocHtml: s => s, richToText: s => s, isRich: f => f === 'rich',
      sanitizeRich: s => s, documentTextHtml: s => s,
      readOnlyDocHtml: s => s, statusChip: () => '', b64e: () => 'code', sha256: async () => 'x',
      nowISO: () => '2026-07-25T08:00:00.000Z', PORTAL_MODE: true,
      PORTAL_OPTS: { payload: PAYLOAD },
    });
    sb.renderSharePortal(PAYLOAD, {});
    const html = sb.document.getElementById('share-root').innerHTML;
    assert.ok(html.includes('Raw Milk Collection') || html.includes('MK-A2'),
      'the portal should have rendered the contract');
    assert.ok(html.includes('Propose a different value'),
      'the counter-proposal field must still be offered for a monetary contract');
  });

  test('a counter-proposal still comes back and is recorded', async () => {
    const share = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: PAYLOAD, channel: 'link', recipient: { name: 'Grace Njeri' } } });
    const anon = h.client('portal2');
    await anon.json('/api/shares/' + share.token);
    const r = await anon.json('/api/shares/' + share.token + '/respond', { method: 'POST', body: {
      v: 1, kind: 'hati-response', id: 'MK-A2', docHash: PAYLOAD.docHash, action: 'changes',
      name: 'Grace Njeri', title: 'Director', comment: 'Clause 4 needs 45 days.',
      proposedValue: 30000000, proposedText: 'Clause 4 — payment within 45 days.' } });
    assert.equal(r.ok, true);
    const pending = await W.admin.json('/api/shares/pending');
    const mine = pending.find(p => p.token === share.token);
    assert.ok(mine, 'the owner should see the counter-proposal');
    assert.equal(mine.response.proposedValue, 30000000);
    assert.equal(mine.response.action, 'changes');
  });
});

describe('F7 — static-mode sharing is labelled', () => {
  test('the share dialog warns that a link-borne document cannot be revoked', () => {
    const at = CORE.indexOf('Share with counterparty');
    const modal = CORE.slice(at - 4000, at + 4000);
    assert.match(modal, /for demonstrations only/i, 'static mode must say it is demo-only');
    assert.match(modal, /never expires and cannot be revoked/i,
      'the dialog must say the link never expires and cannot be revoked');
  });

  test('the warning is shown only without a server', () => {
    const at = CORE.indexOf('Demo sharing');
    const before = CORE.slice(at - 400, at);
    assert.match(before, /\$\{server\?''\:`/, 'the block must be gated on static mode');
  });
});
