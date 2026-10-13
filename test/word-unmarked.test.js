/* "UNMARKED IN WORD", SAID (13 Oct 2026, phase 1 of the best-in-class plan).
   ============================================================
   The crash course: "the classic trick: a counterparty changes text without
   marking it. If anyone uploads a Word file, HaTi must compare it word by
   word against the last version and flag every difference." HaTi already
   compared the whole file and filed every difference as a change (f130); it
   did not say which differences had been made with Word's track changes OFF.
   Now it does: negoImportReturnedDocx reads the file twice (every tracked
   change accepted, then every tracked change rejected), negoFileProposal
   stamps `unmarked` on a change whose standing wording is not intact even in
   the rejected reading, the card says "not marked as a change in Word", and
   the History line counts them. A file with no marks at all: every change
   unmarked. A second reading that cannot be had: nothing stamped (never a
   guess).

   Run: node --test --test-reporter=dot test/word-unmarked.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. NOTICES',
  '3. Notices are delivered by hand or by registered post.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-WU1', name: 'WH — Young', counterparty: 'Kabras Sugar', template: 'RM', status: 'Drafting',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: BASE, format: 'text', ...over };
}
const xmlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const run = t => `<w:r><w:t xml:space="preserve">${xmlEsc(t)}</w:t></w:r>`;

/* A returned Word file from its paragraphs. A paragraph may be a string, or
   { before, del, ins, after }: a TRACKED change (del struck out, ins
   inserted) with plain wording either side. */
function returnedDocx(win, paragraphs){
  const body = paragraphs.map(p => {
    if (typeof p === 'string') return `<w:p>${run(p)}</w:p>`;
    return `<w:p>${p.before ? run(p.before) : ''}`
      + (p.del ? `<w:del w:id="11" w:author="Them" w:date="2026-10-01T10:00:00Z"><w:r><w:delText xml:space="preserve">${xmlEsc(p.del)}</w:delText></w:r></w:del>` : '')
      + (p.ins ? `<w:ins w:id="12" w:author="Them" w:date="2026-10-01T10:00:00Z">${run(p.ins)}</w:ins>` : '')
      + `${p.after ? run(p.after) : ''}</w:p>`;
  }).join('');
  const doc = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`;
  return win.docxZip([{ name: 'word/document.xml', data: doc }]);
}

async function world(){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  const c = contractFixture();
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id });
  win.getContract = id => (id === c.id ? c : null);
  return { w, win, c };
}
const lines = (win, c) => win.negoBaseText(c).split('\n');
const auditLines = c => (c.audit || []).map(a => String(a.detail || a.action || '')).join('\n');

describe('the Word reader can read a file with every tracked change rejected', () => {
  test('accepted: insertions kept, deletions dropped; rejected: the other way round', async () => {
    const { win } = await world();
    const bytes = returnedDocx(win, ['TITLE', { before: 'payable within ', del: 'thirty (30)', ins: 'forty-five (45)', after: ' days.' }]);
    const acc = await win.docxExtract(bytes);
    const rej = await win.docxExtract(bytes, { tracked: 'reject' });
    assert.match(acc.text, /forty-five \(45\)/); assert.doesNotMatch(acc.text, /thirty \(30\)/);
    assert.match(rej.text, /thirty \(30\)/);   assert.doesNotMatch(rej.text, /forty-five \(45\)/);
    assert.equal(acc.tracked.ins, 1); assert.equal(acc.tracked.del, 1);
  });
});

describe('a returned Word file: marked and unmarked differences are told apart', () => {
  test('one tracked change and one quiet edit: only the quiet one is stamped, and History counts it', async () => {
    const { win, c } = await world();
    const L = lines(win, c);
    const iSupply = L.findIndex(x => /5000 metric tonnes/.test(x));
    const iPay = L.findIndex(x => /thirty \(30\) days/.test(x));
    assert.ok(iSupply >= 0 && iPay >= 0, 'the fixture has both clauses');
    const paras = L.slice();
    paras[iSupply] = L[iSupply].replace('5000', '6000');                       // quiet: track changes off
    const [before, after] = L[iPay].split('thirty (30)');
    paras[iPay] = { before, del: 'thirty (30)', ins: 'forty-five (45)', after }; // marked: a tracked change
    const res = await win.negoImportReturnedDocx(c, returnedDocx(win, paras), {});
    assert.equal(res.filed.length, 2, 'two differences, two changes');
    const supply = res.filed.find(ch => /6000/.test(ch.newText || ''));
    const pay = res.filed.find(ch => /forty-five/.test(ch.newText || ''));
    assert.ok(supply && pay, 'both differences are filed as changes');
    assert.equal(supply.unmarked, true, 'the quiet edit is stamped unmarked');
    assert.notEqual(pay.unmarked, true, 'the tracked change is not');
    assert.match(auditLines(c), /received via a returned Word file · 1 of them not marked as a change in Word/,
      'History counts the quiet one');
  });

  test('a file with no tracked marks at all: every difference is unmarked', async () => {
    const { win, c } = await world();
    const L = lines(win, c);
    const paras = L.map(x => x.replace('5000', '7000').replace('thirty (30)', 'sixty (60)'));
    const res = await win.negoImportReturnedDocx(c, returnedDocx(win, paras), {});
    assert.equal(res.filed.length, 2);
    assert.ok(res.filed.every(ch => ch.unmarked === true), 'no marks in the file: both are unmarked');
    assert.match(auditLines(c), /2 of them not marked as changes in Word/);
  });

  test('a file where every difference is a tracked change: nothing is stamped and History says nothing of it', async () => {
    const { win, c } = await world();
    const L = lines(win, c);
    const iPay = L.findIndex(x => /thirty \(30\) days/.test(x));
    const [before, after] = L[iPay].split('thirty (30)');
    const paras = L.slice(); paras[iPay] = { before, del: 'thirty (30)', ins: 'ninety (90)', after };
    const res = await win.negoImportReturnedDocx(c, returnedDocx(win, paras), {});
    assert.equal(res.filed.length, 1);
    assert.notEqual(res.filed[0].unmarked, true);
    assert.doesNotMatch(auditLines(c), /not marked as/);
  });

  test('the change card says it, in the one builder every seat draws', async () => {
    const { win, c } = await world();
    const L = lines(win, c);
    const paras = L.map(x => x.replace('5000', '8000'));
    await win.negoImportReturnedDocx(c, returnedDocx(win, paras), {});
    const html = win.negoLiveCardsHtml(c, { side: 'owner' });
    assert.match(html, /not marked as a change in Word/, 'the card carries the sentence');
    const plain = await (async () => { const { win: w2, c: c2 } = await world(); return w2.negoLiveCardsHtml(c2, { side: 'owner' }); })();
    assert.doesNotMatch(plain, /not marked as a change in Word/, 'and a card with nothing unmarked does not');
  });

  test('and in the column\'s other renderer, with the card open (both renderers, the duplication rule)', async () => {
    const { openedCards } = require('./cards');
    const { win, c } = await world();
    const L = lines(win, c);
    await win.negoImportReturnedDocx(c, returnedDocx(win, L.map(x => x.replace('5000', '9000'))), {});
    const html = openedCards(win, c, { side: 'owner' });
    assert.match(String(html), /not marked as a change in Word/, 'the open card carries the sentence');
  });
});
