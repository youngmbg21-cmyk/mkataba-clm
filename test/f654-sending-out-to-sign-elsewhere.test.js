/* f654 — SENDING A CONTRACT OUT TO BE SIGNED ELSEWHERE: THE SCREEN'S OWN
   READINGS (owner-asked 9 Oct 2026, after the coverage report showed the
   handover screen, js/views/handover.js, was about 25% checked).

   f388 and f389 pin the SHARED reading (js/outside.js) and the server's walls.
   This pins what the browser screen decides before anything reaches them:
   which words count as "what was agreed", the fingerprint of those words, when
   the route may still change, whether this very file was filed before, how a
   signed copy that comes back is matched to the contract it belongs to, and
   what the difference report, the filled-blanks line and the signed-copy
   record say. A CHARACTERISATION set: it describes today's behaviour; a red
   one means a rule moved. */
'use strict';
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

let W;
before(async () => {
  const w = await buildWorld({ contractView: true });
  W = w.win;
});
const plain = x => JSON.parse(JSON.stringify(x));
const AGREED = 'SUPPLY AGREEMENT\n1. Price\nThe price is KES 100 per unit.\n2. Term\nThis runs for two years.';
/* Their copy as a reader hands it back: lines kept, a heading run into its
   paragraph. (A copy with EVERY line break lost reads one clause number as an
   added word — logged in BUGLOG 9 Oct 2026, not pinned here.) */
const SIGNED_SAME = 'SUPPLY AGREEMENT\n1. Price The price is KES 100 per unit.\n2. Term This runs for two years.';
const contract = (extra = {}) => ({ id: 'c1', name: 'Supply Agreement', counterparty: 'Acme Ltd', redlineText: AGREED, changes: [], ...extra });
const out = (extra = {}) => contract({ signRoute: 'outside', handover: { at: '2026-10-01T09:00:00Z' }, ...extra });
const world = (contracts) => { W.state = { contracts }; };

describe('f654 — what counts as the agreed words', () => {
  test('(1) a negotiation\'s starting text wins over the plain wording', () => {
    const c = contract({ negotiation: { baselineBody: '<p>Negotiated words</p>' } });
    assert.match(W.outsideAgreedHtml(c), /Negotiated words/);
  });
  test('(2) plain wording becomes one paragraph per line, blank lines dropped, characters escaped', () => {
    const html = W.outsideAgreedHtml(contract({ redlineText: 'Line one\n\n  A & B <ok>  ' }));
    assert.equal(html, '<p>Line one</p><p>A &amp; B &lt;ok&gt;</p>');
  });
  test('(3) an upload\'s text is used only when there is nothing else; nothing at all is empty', () => {
    assert.equal(W.outsideAgreedHtml({ upload: { extractedText: 'From the file' } }), '<p>From the file</p>');
    assert.equal(W.outsideAgreedHtml({}), '');
    assert.equal(W.outsideAgreedHtml(null), '');
    assert.equal(W.outsideAgreedParas({}).length, 0);
  });
  test('(4) the paragraphs: the document\'s name is marked as its title, a numbered line carries its number', () => {
    const p = plain(W.outsideAgreedParas(contract()));
    assert.equal(p.length, 5);
    assert.equal(p[0].text, 'SUPPLY AGREEMENT');
    assert.equal(p[0].title, true);
    assert.equal(p[1].label, '1.');
    assert.ok(p.slice(1).every(x => x.title === false), 'only the first block can be the title');
  });
  test('(5) a heading names the clause the paragraphs under it belong to', () => {
    const c = contract({ redlineText: '<h2>Payment</h2><p>Pay in 30 days.</p><h2>Notices</h2><p>In writing.</p>', format: 'rich' });
    const p = plain(W.outsideAgreedParas(c));
    const under = Object.fromEntries(p.filter(x => !/^Payment$|^Notices$/.test(x.text)).map(x => [x.text, x.label]));
    assert.deepEqual(under, { 'Pay in 30 days.': 'Payment', 'In writing.': 'Notices' });
  });
  test('(6) the agreed words as plain text are the paragraphs, one per line', () => {
    assert.equal(W.outsideAgreedPlain(contract()), AGREED.replace(/\n/g, '\n'));
  });
});

describe('f654 — the fingerprint recorded at the handover', () => {
  test('(7) spacing and capitals do not change the fingerprint; a changed word does', async () => {
    const a = await W.outsideAgreedStamp(contract());
    const b = await W.outsideAgreedStamp(contract({ redlineText: AGREED.toLowerCase().replace(/ /g, '   ') }));
    const c = await W.outsideAgreedStamp(contract({ redlineText: AGREED.replace('100', '200') }));
    assert.equal(a.hash, b.hash);
    assert.notEqual(a.hash, c.hash);
    assert.match(a.hash, /^[0-9a-f]{64}$/, 'a real SHA-256, not the weak fallback');
    assert.equal(a.words, 18);
  });
  test('(8) no words, no count', async () => {
    assert.equal((await W.outsideAgreedStamp({})).words, 0);
  });
});

describe('f654 — a blank still in the agreed words', () => {
  test('(9) a placeholder is a blank; a ruled line, a signature box and finished wording are not', () => {
    const b = c => plain(W.outsideBlanksOf(contract({ redlineText: c })));
    assert.deepEqual(b('The price is KES [INSERT PRICE] per unit, due {{due_date}}.'), ['[INSERT PRICE]', '{{due_date}}']);
    assert.deepEqual(b('Signed: ________  [SIGNATURE]'), [], 'ruled lines and signature boxes are where people sign, not blanks');
    assert.deepEqual(b(AGREED), []);
  });
});

describe('f654 — when the signing route may still change', () => {
  test('(10) a draft that has not gone out may change route', () => {
    assert.equal(W.outsideMayChangeRoute(contract()), true);
  });
  test('(11) never once signed, once handed over, or with nothing to change', () => {
    assert.equal(W.outsideMayChangeRoute(contract({ status: 'Signed' })), false);
    assert.equal(W.outsideMayChangeRoute(out()), false, 'out with them for signature: the route is frozen');
    assert.equal(W.outsideMayChangeRoute(null), false);
  });
  test('(12) a handover that was cancelled (reopened) frees the route again', () => {
    assert.equal(W.outsideMayChangeRoute(out({ handover: { at: '2026-10-01', cancelledAt: '2026-10-02' } })), true);
  });
  test('(13) the route card offers the change only where it is allowed', () => {
    assert.match(W.outsideRouteCardHtml(contract({ signRoute: 'outside' })), /data-ho-route="inside"/);
    assert.doesNotMatch(W.outsideRouteCardHtml(out()), /data-ho-route="inside"/);
  });
});

describe('f654 — has this very file been filed before', () => {
  const H = 'a'.repeat(64);
  test('(14) found as a signed copy, as an executed file, or as a SIGNED upload', () => {
    world([{ id: 'x', signedCopy: { file: { sha256: H } } }]);
    assert.equal(W.outsideFiledBefore(H, 'c1').id, 'x');
    world([{ id: 'y', execution: { fileHash: H } }]);
    assert.equal(W.outsideFiledBefore(H, 'c1').id, 'y');
    world([{ id: 'z', upload: { fileHash: H }, status: 'Signed' }]);
    assert.equal(W.outsideFiledBefore(H, 'c1').id, 'z');
  });
  test('(15) not this contract itself, not an unsigned upload, and never on no fingerprint', () => {
    world([{ id: 'c1', signedCopy: { file: { sha256: H } } }, { id: 'd', upload: { fileHash: H }, status: 'Draft' }]);
    assert.equal(W.outsideFiledBefore(H, 'c1'), null);
    assert.equal(W.outsideFiledBefore('', 'c1'), null);
  });
});

describe('f654 — the signed copy that comes back', () => {
  test('(16) an upload whose words match a contract out for signature is offered as its signed copy', async () => {
    const c = out();
    world([c, contract({ id: 'c2', name: 'Not out' })]);
    const m = await W.outsideMatchUpload(SIGNED_SAME, 'pdf');
    assert.equal(m.best && m.best.c.id, 'c1');
    assert.equal(m.outs.length, 1, 'only contracts out for signature are candidates');
    const html = W.outsideUploadOfferHtml(m);
    assert.match(html, /data-ho-up-file="c1"/);
    assert.match(html, /data-ho-up-new="1"/, '"No, a new contract" is always offered — never assumed');
  });
  test('(17) an unrelated file matches nothing, and the pick-list still names every file out', async () => {
    world([out(), out({ id: 'c3', name: 'Lease', counterparty: 'Beta' })]);
    const m = await W.outsideMatchUpload('Minutes of the board meeting held on Tuesday about the canteen.', 'pdf');
    assert.equal(m.best, null);
    const html = W.outsideUploadOfferHtml(m);
    assert.match(html, /value="c1"/);
    assert.match(html, /value="c3"/);
  });
  test('(18) nothing out, or no words, offers nothing', async () => {
    world([contract()]);
    const m = await W.outsideMatchUpload(SIGNED_SAME, 'pdf');
    assert.equal(m.best, null);
    assert.equal(W.outsideUploadOfferHtml(m), '');
    world([out()]);
    assert.equal((await W.outsideMatchUpload('   ', 'pdf')).best, null);
  });
  test('(19) a file that is out but archived is not a candidate', async () => {
    world([out({ archived: true })]);
    assert.equal((await W.outsideMatchUpload(SIGNED_SAME, 'pdf')).outs.length, 0);
  });
});

describe('f654 — what the difference report says', () => {
  const cmp = (signed, c = contract()) => W.outsideCompare(W.outsideAgreedParas(c), signed, {});
  test('(20) the same words are reported the same', () => {
    const r = cmp(SIGNED_SAME);
    assert.equal(r.same, true);
    assert.equal(W.outsideDiffHtml(r), '');
    assert.ok(W.outsideCheckLine(r).length > 0);
  });
  test('(21) a changed figure is counted and drawn struck (agreed) and marked (their copy)', () => {
    const r = cmp(SIGNED_SAME.replace('100', '200'));
    assert.equal(r.same, false);
    assert.equal(r.changedCount, 1);
    assert.match(W.outsideCheckLine(r), /1/);
    const html = W.outsideDiffHtml(r);
    assert.match(html, /<span class="ho-del">100<\/span>/);
    assert.match(html, /<span class="ho-ins">200<\/span>/);
  });
  test('(22) their words are escaped in the report — a copy cannot inject markup', () => {
    const r = cmp(SIGNED_SAME.replace('100', '<img src=x onerror=alert(1)>'));
    const html = W.outsideDiffHtml(r);
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /&lt;img/);
  });
  test('(23) differences past what is drawn are counted, never silently dropped', () => {
    const html = W.outsideDiffHtml({ changed: [], missing: [], inserted: [], changedCount: 3, missingCount: 2 });
    assert.match(html, /ho-sub/);
    assert.match(html, /5/);
  });
  test('(24) an unrelated copy is said as unrelated; nothing at all says nothing', () => {
    assert.ok(W.outsideCheckLine({ unrelated: true }).length > 0);
    assert.notEqual(W.outsideCheckLine({ unrelated: true }), W.outsideCheckLine({ same: true, clauses: 2 }));
    assert.equal(W.outsideCheckLine(null), '');
    assert.equal(W.outsideDiffHtml(null), '');
  });
});

describe('f654 — the blanks they filled in', () => {
  test('(25) each filled blank is listed by name and what they wrote, open, escaped', () => {
    const html = W.outsideFillsHtml({ fills: [{ name: 'Price', text: 'KES <b>90</b>' }], fillCount: 1 });
    assert.match(html, /<details class="ho-fills" open>/);
    assert.match(html, /Price/);
    assert.match(html, /KES &lt;b&gt;90&lt;\/b&gt;/);
  });
  test('(26) more filled than kept is counted; none filled draws nothing', () => {
    const html = W.outsideFillsHtml({ fills: [{ name: 'A', text: '1' }], fillCount: 4 });
    assert.match(html, /3/);
    assert.equal(W.outsideFillsHtml({ fills: [], fillCount: 0 }), '');
    assert.equal(W.outsideFillsHtml(null), '');
  });
});

describe('f654 — the signed copy of record, on a filed contract', () => {
  test('(27) it shows the signed copy\'s fingerprint, name and an open button', () => {
    const c = contract({ status: 'Signed', signedCopy: { at: '2026-10-05T10:00:00Z', by: { name: 'Wanjiru' }, via: 'docusign',
      signedOn: '2026-10-04', file: { name: 'signed.pdf', fileId: 'f9', sha256: 'b'.repeat(64) },
      signers: [{ name: 'J. Otieno', on: '2026-10-04' }], compare: { same: true } } });
    const html = W.outsideExecutionBlock(c);
    assert.match(html, new RegExp('b'.repeat(64)));
    assert.match(html, /signed\.pdf/);
    assert.match(html, /data-ho-open-file="f9"/);
    assert.match(html, /Wanjiru/);
    assert.match(html, /J\. Otieno/);
  });
  test('(28) a contract filed through the old paper door still shows its file', () => {
    const html = W.outsideExecutionBlock(contract({ status: 'Signed',
      execution: { method: 'paper', fileName: 'scan.pdf', fileHash: 'c'.repeat(64), by: 'Admin', at: '2026-01-01' } }));
    assert.match(html, /scan\.pdf/);
    assert.match(html, new RegExp('c'.repeat(64)));
    assert.doesNotMatch(html, /data-ho-open-file/, 'no stored file id, no open button');
  });
  test('(29) a signer\'s name is escaped', () => {
    const html = W.outsideExecutionBlock(contract({ signedCopy: { file: {}, signers: [{ name: '<script>x</script>' }] } }));
    assert.doesNotMatch(html, /<script>/);
  });
});
