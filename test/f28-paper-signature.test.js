/* ============================================================
   F28 — signed on paper, filed on its own contract
   ============================================================
   A deal negotiated in HaTi and then signed on paper had nowhere to land. The
   scan could only be uploaded as a NEW contract, so every round, every version
   and every decision was orphaned from the document those rounds produced.
   Cross-border deals are still signed on paper often enough that this was a
   real dead end, and it was at the last step.

   What this must NOT do is pretend HaTi witnessed something. No electronic
   signature is taken. The seal is the scanned file's own fingerprint, and the
   record says "executed outside HaTi" — the same claim, in the same words, a
   migrated already-signed contract carries. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');

/* A scanned signature page, as a file input hands it over. */
function scanFile(name = 'supply-agreement-signed.pdf', bytes = 4096) {
  const body = Buffer.alloc(bytes, 0x41);
  return { name, size: bytes, type: 'application/pdf',
    _dataUrl: 'data:application/pdf;base64,' + body.toString('base64') };
}
function installFileReader(win) {
  win.FileReader = class { readAsDataURL(f) { this.result = f._dataUrl; if (this.onload) this.onload(); } };
}
/* A contract that has been through the mill and is ready to sign. */
function negotiated(w) {
  const c = supplyContract();
  w.win.captureVersion(c, 'Drafted', 'Wanjiru Kamau');
  const base = w.win.docPlainText(c);
  c.rounds.push({ n: 1, at: w.win.nowISO(), by: 'Erik Lindqvist', comment: 'Net-60.',
    status: 'open', resolution: null, baseText: base,
    proposedText: base.replace('thirty (30) days', 'sixty (60) days') });
  w.win.acceptProposedRound(c, 1);
  return c;
}

describe('F28 — filing the signed copy', () => {
  let w, c, exec;
  before(async () => {
    w = buildWorld({ contractView: true }); installFileReader(w.win);
    c = negotiated(w);
    exec = await w.win.attachPaperSignature(c, scanFile(), { signedOn: '2026-07-24', note: 'Signed in Nairobi.' });
  });

  test('the contract itself becomes executed — not a second record', () => {
    assert.ok(exec, 'it must file something');
    assert.equal(c.status, 'Signed');
    assert.equal(c.id, 'MK-SUP-1', 'the SAME contract, with its own id');
  });

  test('the negotiation history survives, which is the entire point', () => {
    assert.equal(c.rounds.length, 1, 'the round is still here');
    assert.equal(c.rounds[0].resolution.decision, 'accepted');
    assert.ok(c.versions.length >= 2, 'and so are the versions');
    assert.match(w.win.docPlainText(c), /sixty \(60\) days/,
      'the wording the parties actually agreed is what the record carries');
  });

  test('the seal is the scanned file, because that is the signed document', () => {
    assert.match(c.hash, /^[0-9a-f]{64}$/);
    assert.equal(c.hash, exec.fileHash);
    assert.equal(exec.fileName, 'supply-agreement-signed.pdf');
  });

  test('it is recorded as executed OUTSIDE HaTi, not as a HaTi signature', () => {
    assert.equal(exec.offPlatform, true);
    assert.equal(exec.method, 'paper');
    assert.equal(w.win.isExternallyExecuted(c), true,
      'the UI must render a filing record, not a signing certificate');
    assert.equal((c.signatures || []).length, 0,
      'no electronic signature was taken, so none may appear on the record');
  });

  test('the audit trail says plainly what happened and what was not done', () => {
    const e = c.audit.filter(x => /Executed outside HaTi/.test(x.action)).pop();
    assert.ok(e, 'it must be on the record');
    assert.match(e.detail, /Signed on paper/);
    assert.match(e.detail, /No electronic signature was taken in HaTi/,
      'the one thing the record must never overstate');
    assert.match(e.detail, /supply-agreement-signed\.pdf/);
    assert.match(e.detail, /signed on 2026-07-24/);
    assert.equal(e.user, 'Wanjiru Kamau');
  });

  test('the file is registered so the server can authorise and sweep it', () => {
    assert.ok(Array.isArray(c.documents) && c.documents.length);
    assert.equal(c.documents[0].kind, 'paper-signature');
  });

  test('the wording at signature is recoverable from the versions', () => {
    /* No NEW version is written when nothing has changed since the last one —
       captureVersion deliberately refuses to spam the history, and here the
       wording has not moved since the round was accepted. What matters is that
       the text as executed can still be read back, and it can. */
    const last = c.versions[c.versions.length - 1];
    assert.equal(last.text.replace(/\s+/g, ' ').trim(),
      w.win.docPlainText(c).replace(/\s+/g, ' ').trim(),
      'the last version must BE the wording that was signed');
    assert.match(last.text, /sixty \(60\) days/);
  });
});

describe('F28 — what it refuses to do', () => {
  let w;
  before(() => { w = buildWorld({ contractView: true }); installFileReader(w.win); });

  test('it will not seal over unresolved proposed edits', async () => {
    const c = supplyContract();
    w.win.captureVersion(c, 'Drafted', 'Wanjiru Kamau');
    const base = w.win.docPlainText(c);
    c.rounds.push({ n: 1, at: w.win.nowISO(), by: 'Erik Lindqvist', comment: 'Open.',
      status: 'open', resolution: null, baseText: base, proposedText: base + '\nExtra clause.' });

    assert.equal(await w.win.attachPaperSignature(c, scanFile()), null);
    assert.notEqual(c.status, 'Signed');
    assert.match(w.toastText(), /open proposed edits/i);
  });

  test('it will not execute a contract twice', async () => {
    const w2 = buildWorld({ contractView: true }); installFileReader(w2.win);
    const c = negotiated(w2);
    await w2.win.attachPaperSignature(c, scanFile());
    const firstHash = c.hash;
    assert.equal(await w2.win.attachPaperSignature(c, scanFile('another.pdf')), null);
    assert.equal(c.hash, firstHash, 'the original seal must be untouched');
  });

  test('it will not run while the document is out in Word', async () => {
    const w2 = buildWorld({ contractView: true }); installFileReader(w2.win);
    const c = negotiated(w2);
    c.wordReview = { out: true, since: w2.win.nowISO(), by: 'Wanjiru Kamau' };
    assert.equal(await w2.win.attachPaperSignature(c, scanFile()), null);
    assert.notEqual(c.status, 'Signed');
  });

  test('a viewer cannot execute a contract', async () => {
    const v = buildWorld({ canEdit: false, contractView: true }); installFileReader(v.win);
    const c = supplyContract();
    assert.equal(await v.win.attachPaperSignature(c, scanFile()), null);
    assert.notEqual(c.status, 'Signed');
  });

  test('an oversized scan is refused rather than half-stored', async () => {
    const w2 = buildWorld({ contractView: true }); installFileReader(w2.win);
    const c = negotiated(w2);
    assert.equal(await w2.win.attachPaperSignature(c, scanFile('huge.pdf', 40 * 1024 * 1024)), null);
    assert.notEqual(c.status, 'Signed');
  });
});

describe('F28 — a paper execution and a HaTi signature are not confused', () => {
  test('a HaTi-signed contract is NOT reported as executed outside', () => {
    const w = buildWorld({ contractView: true });
    const c = supplyContract({ status: 'Signed', hash: 'a'.repeat(64),
      execution: { at: w.win.nowISO(), method: 'session-authenticated' } });
    assert.equal(w.win.isExternallyExecuted(c), false);
  });

  test('a migrated already-signed contract still reads as executed outside (regression)', () => {
    const w = buildWorld({ contractView: true });
    assert.equal(w.win.isExternallyExecuted(supplyContract({ hash: 'MIGRATED' })), true);
    assert.equal(w.win.isExternallyExecuted(
      supplyContract({ migration: { executedOutside: true } })), true);
  });
});
