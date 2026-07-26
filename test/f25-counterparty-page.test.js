/* ============================================================
   F25 — the counterparty's own page, driven the way he uses it
   ============================================================
   Two bugs shipped in the same week, both on Erik's side of the glass, both
   past a suite of 342 green tests: a Word download that produced the whole
   contract as one unreadable paragraph, and an update he was never told about.
   Neither was exotic. Both were simply never exercised, because every test
   drove Wanjiru's side.

   This file drives the real counterparty page: it renders it from a payload
   built by the product's own buildSharePayload, presses its buttons, and reads
   what Erik actually receives. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

describe('F25 — what Erik sees when he opens the link', () => {
  let p, payload;
  before(() => {
    p = buildPortal();
    payload = sharePayloadFor(p, supplyContract());
    p.open(payload);
  });

  test('the contract is there, with its wording', () => {
    const html = p.html();
    assert.match(html, /RAW MATERIAL SUPPLY AGREEMENT/);
    assert.match(html, /thirty \(30\) days/);
    assert.match(html, /Wanjiru Catering Ltd shared a contract for your review/);
  });

  test('he can respond without an account', () => {
    for (const id of ['pt-sign', 'pt-accept', 'pt-redline', 'pt-changes', 'pt-decline'])
      assert.ok(p.has(id), `the counterparty must be able to ${id}`);
  });

  test('a contract drafted in HaTi still offers him a Word route', () => {
    assert.ok(p.has('pt-word-gen'),
      'a drafted contract has no uploaded file, and used to offer him no Word option at all');
    assert.ok(p.has('pt-word-up'), 'and he must be able to bring his marked-up copy back');
  });
});

describe('F25 — the Word file he actually downloads', () => {
  let p;
  before(() => {
    p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
  });

  test('it is a real Word file, not one unreadable paragraph', async () => {
    await p.click('pt-word-gen');
    const dl = p.lastDownload();
    assert.ok(dl, 'pressing download must produce a file');
    assert.equal(dl.bytes[0], 0x50, 'a .docx is a ZIP');
    assert.equal(dl.bytes[1], 0x4b);

    const back = await p.win.docxExtract(dl.bytes);
    const lines = back.text.split('\n').filter(l => l.trim());
    assert.ok(lines.length > 3,
      `the contract must keep its shape — got ${lines.length} line(s): ${JSON.stringify(back.text.slice(0, 120))}`);
  });

  test('it keeps the headings and the clause numbers', async () => {
    await p.click('pt-word-gen');
    const back = await p.win.docxExtract(p.lastDownload().bytes);
    assert.match(back.text, /RAW MATERIAL SUPPLY AGREEMENT/);
    assert.match(back.text, /3\.\s*Payment shall be made within thirty \(30\) days/,
      'the clause number must be in the file, or cross-references break');
    assert.match(back.text, /SIGNED for and on behalf of the parties/);
    const kinds = back.text.split('\n').map(p.win.docLineKind);
    assert.ok(kinds.includes('heading'), 'section titles must still read as headings');
  });

  test('it matches what the owner would have sent him', async () => {
    // the same contract exported from the owner's side, byte-for-byte comparable
    // in the only way that matters: the wording and its shape
    await p.click('pt-word-gen');
    const his = await p.win.docxExtract(p.lastDownload().bytes);
    const hers = await p.win.docxExtract(await p.win.contractDocxBytes(supplyContract()));
    assert.equal(his.text.replace(/\s+/g, ' ').trim(), hers.text.replace(/\s+/g, ' ').trim(),
      'both sides of the deal must be marking up the same document');
  });

  test('the filename is something he can find again', async () => {
    await p.click('pt-word-gen');
    assert.match(p.lastDownload().fileName, /\.docx$/);
    assert.match(p.lastDownload().fileName, /Raw Material Supply Agreement/);
  });
});

describe('F25 — proposing edits', () => {
  let p;
  before(() => {
    p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
  });

  test('the editor opens on the current wording, not empty', async () => {
    await p.click('pt-redline');
    const ta = p.win.document.getElementById('pt-redline-text');
    assert.ok(ta, 'there must be an editor');
    assert.match(ta.value, /RAW MATERIAL SUPPLY AGREEMENT/);
    assert.match(ta.value, /thirty \(30\) days/);
  });

  test('his edits are submitted with the base they were made against', async () => {
    await p.click('pt-redline');
    const ta = p.win.document.getElementById('pt-redline-text');
    ta.value = ta.value.replace('thirty (30) days', 'sixty (60) days');
    p.setValue('pt-name', 'Erik Lindqvist');
    p.setValue('pt-email', 'erik@nordkust.se');
    p.setValue('pt-comment', 'Net-60 is our standard.');
    await p.click('pt-redline-submit');

    const sent = p.lastSent();
    assert.ok(sent, 'the response must be submitted');
    assert.equal(sent.action, 'changes');
    assert.equal(sent.name, 'Erik Lindqvist');
    assert.match(sent.proposedText, /sixty \(60\) days/);
    assert.ok(sent.baseText, 'the base must travel, or the owner diffs against the wrong text');
    assert.match(sent.baseText, /thirty \(30\) days/);
    assert.equal(sent.comment, 'Net-60 is our standard.');
  });

  test('he cannot submit without saying who he is', async () => {
    const p2 = buildPortal();
    p2.open(sharePayloadFor(p2, supplyContract()));
    await p2.click('pt-redline');
    p2.win.document.getElementById('pt-redline-text').value = 'Some edited wording.';
    await p2.click('pt-redline-submit');
    assert.equal(p2.lastSent(), null, 'an anonymous proposal must not be sent');
    assert.match(p2.toastText(), /name/i);
  });
});

describe('F25 — what he is told about the negotiation so far', () => {
  test('his own ask and the reply are both shown', () => {
    const p = buildPortal();
    const c = supplyContract({ rounds: [{ n: 1, at: '2026-07-26T09:00:00.000Z',
      by: 'Erik Lindqvist', comment: 'Net-60 is our standard.',
      proposedText: 'x', baseText: 'y', status: 'closed',
      resolution: { decision: 'rejected', by: 'Wanjiru Kamau', at: '2026-07-26T10:00:00.000Z',
        comment: 'Net-30 stands, or a 2% price increase.' } }] });
    p.open(sharePayloadFor(p, c));
    const html = p.html();
    assert.match(html, /Net-60 is our standard/, 'his ask');
    assert.match(html, /Net-30 stands, or a 2% price increase/, 'and her reason');
  });

  test('a point that was refused is still visible, not silently gone', () => {
    const p = buildPortal();
    const c = supplyContract({ rounds: [{ n: 1, at: '2026-07-26T09:00:00.000Z',
      by: 'Erik Lindqvist', comment: 'Net-60.', proposedText: 'x', baseText: 'y', status: 'closed',
      blockDecisions: [{ id: 'b0', decision: 'reject',
        before: 'within thirty (30) days', after: 'within sixty (60) days' }],
      resolution: { decision: 'rejected', by: 'Wanjiru Kamau', at: '2026-07-26T10:00:00.000Z',
        comment: 'Net-30 stands.' } }] });
    p.open(sharePayloadFor(p, c));
    const html = p.html();
    assert.match(html, /Still open between us/);
    assert.match(html, /sixty \(60\)/, 'what he asked for');
    assert.match(html, /Net-30 stands/, 'and why it was refused');
  });

  test('nothing a counterparty typed can execute on this page', () => {
    const p = buildPortal();
    const c = supplyContract({ rounds: [{ n: 1, at: '2026-07-26T09:00:00.000Z',
      by: '<img src=x onerror=alert(1)>', comment: '<script>alert(2)</script>',
      proposedText: 'x', baseText: 'y', status: 'closed',
      resolution: { decision: 'rejected', at: '2026-07-26T10:00:00.000Z', comment: '<iframe src=evil></iframe>' } }] });
    p.open(sharePayloadFor(p, c));
    const html = p.html();
    for (const bad of ['<img', '<script', '<iframe']) assert.ok(!html.includes(bad), bad);
  });
});

describe('F25 — signing', () => {
  test('with no code available he is warned, and can still sign', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()), { emailConfigured: false });
    p.setValue('pt-name', 'Erik Lindqvist');
    p.setValue('pt-email', 'erik@nordkust.se');
    p.win.openSignaturePad = async () => ({ form: 'typed', image: null, imageHash: null, typedName: 'Erik Lindqvist' });
    await p.click('pt-sign');

    const html = p.html();
    assert.match(html, /Signing without an email check/,
      'he must be told the check is missing BEFORE he signs');
    assert.match(html, /not independently verified/i);
    assert.ok(p.has('pt-unver-go'), 'and still be able to go ahead');
  });

  test('with a code available the unverified path is not offered', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()), { emailConfigured: true });
    p.setValue('pt-name', 'Erik Lindqvist');
    p.setValue('pt-email', 'erik@nordkust.se');
    p.win.openSignaturePad = async () => ({ form: 'typed', image: null, imageHash: null });
    await p.click('pt-sign');
    assert.ok(!p.has('pt-unver-go'),
      'where verification is possible it must not be skippable');
  });
});
