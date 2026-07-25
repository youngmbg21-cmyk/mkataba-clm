/* F5 — the signer's IP and device belong in the evidence, not on the document.

   The signature block on an executed contract printed "IP 41.90.x.x" next to
   the signer's name. That is on the face of the document: every reader, every
   exported PDF, every screenshot and every forwarded copy carried it. It is
   still captured — it now appears in the audit trail and the evidence pack,
   which is where evidence goes. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

/* js/core.js owns signerProvenance() and downloadEvidence(). */
function loadCore() {
  return loadViews(['js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
    updateSidebarCounts() {}, renderWorkspace() {}, setView() {}, renderSignButton() {},
    crypto: { subtle: null },
  });
}

const IP = '41.90.64.12';
const UA = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

const SIGNED = {
  id: 'MK-A1', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', folder: 'proc',
  status: 'Signed', value: 48000000, valueType: 'standard', template: 'RM',
  hash: 'f'.repeat(64), signedAt: '10 Jul 2026, 09:00 EAT', sealVersion: 2,
  execution: { at: '2026-07-10T06:00:00.000Z', textHash: 'a'.repeat(64), html: '<p>frozen</p>',
    hashMode: 'text', method: 'session-authenticated', ip: IP, ua: UA },
  signatures: [
    { party: 'first', name: 'Amina Otieno', role: 'Admin', email: 'admin@example.co.ke',
      at: '2026-07-10T06:00:00.000Z', method: 'session-authenticated', form: 'drawn',
      imageHash: 'b'.repeat(64), ip: IP, ua: UA },
    { party: 'counterparty', name: 'Grace Njeri', title: 'Director', email: 'grace@kabras.co.ke',
      at: '2026-07-10T07:00:00.000Z', method: 'email one-time code', form: 'typed',
      ip: '197.232.1.9', ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/141.0 Mobile Safari/537.36' },
  ],
  audit: [
    { at: '2026-07-10T06:00:00.000Z', user: 'Amina Otieno', action: 'Signed',
      detail: 'Executed & sealed — 2 signature(s) · text hash aaaaaaaaaaaaaaaa… · IP ' + IP + ' · Chrome' },
  ],
  comments: [], fields: {}, distribution: null,
};

function renderSignatureBlock() {
  const sb = loadViews(['js/views/contract.js'], {
    isUpload: () => false,
    isExternallyExecuted: () => false,
    generatePseudo: () => 'x'.repeat(60),
    fmtDT: iso => String(iso),
    statusChip: s => `<span>${s}</span>`,
  });
  return sb.signatureBlock(SIGNED);
}

describe('F5 — the document face', () => {
  test('the signature block carries no IP address', () => {
    const html = renderSignatureBlock();
    assert.ok(!html.includes('IP '), 'the signature block still prints an IP label');
    assert.ok(!html.includes(IP), 'the internal signer\'s IP is on the document face');
    assert.ok(!html.includes('197.232.1.9'), 'the counterparty\'s IP is on the document face');
  });

  test('it carries no user-agent string either', () => {
    const html = renderSignatureBlock();
    assert.ok(!html.includes('Mozilla/'), 'a user-agent string is on the document face');
    assert.ok(!/AppleWebKit|Safari\/537/.test(html));
  });

  test('name, signature form and timestamp are still on the face', () => {
    const html = renderSignatureBlock();
    assert.ok(html.includes('Amina Otieno'), 'the signer\'s name must stay');
    assert.ok(html.includes('Grace Njeri'));
    assert.ok(html.includes('drawn signature'), 'the signature form must stay');
    assert.ok(html.includes('email one-time code'), 'the method must stay for the counterparty');
    assert.ok(html.includes('2026-07-10T06:00:00.000Z'), 'the timestamp must stay');
    assert.ok(html.includes('grace@kabras.co.ke'));
  });
});

describe('F5 — the evidence still has it', () => {
  test('the audit entry for the signature records IP and device', () => {
    const entry = SIGNED.audit.find(a => a.action === 'Signed');
    assert.match(entry.detail, /IP 41\.90\.64\.12/);
    assert.match(entry.detail, /Chrome/);
  });

  test('signerProvenance builds the audit suffix, and is empty when nothing was captured', () => {
    const { signerProvenance } = loadCore();
    assert.equal(signerProvenance(IP, UA), ' · IP 41.90.64.12 · Chrome');
    assert.equal(signerProvenance('197.232.1.9', 'Mozilla/5.0 (Linux; Android 14) Mobile Safari'), ' · IP 197.232.1.9 · Mobile');
    assert.equal(signerProvenance(null, null), '', 'nothing captured means nothing appended');
    assert.equal(signerProvenance(IP, null), ' · IP 41.90.64.12');
  });

  test('the evidence pack still carries signer IP and user-agent', () => {
    const sb = loadCore();
    let written = null;
    sb.downloadFile = (name, content) => { written = { name, content }; };
    sb.downloadEvidence(SIGNED);
    assert.ok(written, 'downloadEvidence should have produced a file');
    const pack = JSON.parse(written.content);
    const internal = pack.signatures.find(s => s.name === 'Amina Otieno');
    const counterparty = pack.signatures.find(s => s.name === 'Grace Njeri');
    assert.equal(internal.ip, IP, 'the evidence pack must still carry the signer IP');
    assert.equal(internal.userAgent, UA, 'the evidence pack must still carry the user agent');
    assert.equal(counterparty.ip, '197.232.1.9');
    assert.match(counterparty.userAgent, /Android/);
    // …and the trail that now carries the provenance line travels with it
    assert.ok(pack.auditTrail.some(a => /IP 41\.90\.64\.12/.test(a.detail)),
      'the audit trail in the pack should carry the signing provenance');
  });
});
