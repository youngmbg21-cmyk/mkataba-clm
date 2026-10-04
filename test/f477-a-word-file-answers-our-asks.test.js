/* ============================================================
   F477 — a returned Word file ANSWERS our asks (4 Oct 2026, the other side)
   ============================================================
   The file we send carries our open asks as tracked changes, and the reader
   reads every tracked change as accepted. So an ask they left alone came back
   as an identical change of THEIRS that superseded ours; a rejection in Word
   filed nothing; and the import never handed the turn back.

   Now, per clause carrying an open ask of ours: our words → accepted by them;
   the wording ours replaced → rejected by them ("Rejected in Word"); anything
   else → their counter, filed as before. A returned file is an answer, so the
   import hands the table back exactly as a reply on their link does. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n');

const xmlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function docxOf(win, paragraphs){
  const body = paragraphs.map(t => `<w:p><w:r><w:t>${xmlEsc(t)}</w:t></w:r></w:p>`).join('');
  return win.docxZip([{ name: 'word/document.xml',
    data: `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>` }]);
}

async function world(){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  const c = { id: 'MK-477', name: 'Word answers', counterparty: 'Kabras Sugar', template: 'RM',
    status: 'Drafting', folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text' };
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id });
  win.getContract = id => (id === c.id ? c : null);
  /* Our ask on the payment clause, sent: the turn is theirs. */
  const mine = await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
    { side: 'owner', author: 'Us' });
  assert.equal(mine.length, 1, 'fixture: one ask of ours');
  win.negoHandOver(c, { to: 'counterparty', by: 'Us' });
  assert.equal(win.negoTurn(c), 'counterparty', 'fixture: their turn');
  return { win, c, ask: mine[0] };
}

describe('F477 — the Word file answers our asks', () => {
  test('(1) our tracked change left untouched in Word: our ask is ACCEPTED by them, nothing of theirs is filed', async () => {
    const { win, c, ask } = await world();
    /* The paragraph as Word keeps it when nobody touched our mark: the struck
       words in w:del, ours in w:ins. */
    const paras = win.negoBaseText(c).split('\n');
    const body = paras.map(t => {
      if (!/thirty \(30\) days/.test(t)) return `<w:p><w:r><w:t>${xmlEsc(t)}</w:t></w:r></w:p>`;
      const [a, b] = t.split('thirty (30)');
      return `<w:p><w:r><w:t xml:space="preserve">${xmlEsc(a)}</w:t></w:r>`
        + `<w:del w:id="1" w:author="Us"><w:r><w:delText>thirty (30)</w:delText></w:r></w:del>`
        + `<w:ins w:id="2" w:author="Us"><w:r><w:t>sixty (60)</w:t></w:r></w:ins>`
        + `<w:r><w:t xml:space="preserve">${xmlEsc(b)}</w:t></w:r></w:p>`;
    }).join('');
    const bytes = win.docxZip([{ name: 'word/document.xml',
      data: `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>` }]);
    const res = await win.negoImportReturnedDocx(c, bytes, {});
    assert.ok(res.tracked && res.tracked.ins >= 1, 'the file really carries tracked changes');
    assert.equal(res.filed.length, 0, 'no identical change of theirs is filed over ours');
    assert.equal(JSON.stringify(res.answered.map(x => [x.id, x.status])), JSON.stringify([[ask.id, 'accepted']]));
    const now = win.negoChangeById(c, ask.id);
    assert.equal(now.status, 'accepted', 'our ask is accepted, not superseded');
  });

  test('(2) the clause comes back as the wording ours replaced: REJECTED, with the reason said', async () => {
    const { win, c, ask } = await world();
    const res = await win.negoImportReturnedDocx(c, docxOf(win, win.negoBaseText(c).split('\n')), {});
    assert.equal(res.filed.length, 0);
    assert.equal(JSON.stringify(res.answered.map(x => [x.id, x.status])), JSON.stringify([[ask.id, 'rejected']]));
    const now = win.negoChangeById(c, ask.id);
    assert.equal(now.status, 'rejected');
    assert.match(JSON.stringify(now), /Rejected in Word/, 'the rejection says where it was made');
  });

  test('(3) rewritten differently: their COUNTER is filed and ours is not marked accepted', async () => {
    const { win, c, ask } = await world();
    const paras = win.negoBaseText(c).split('\n').map(l => l.replace('thirty (30) days', 'forty-five (45) days'));
    const res = await win.negoImportReturnedDocx(c, docxOf(win, paras), {});
    assert.equal(res.answered.length, 0, 'not an answer to our ask');
    assert.equal(res.filed.length, 1, 'one counter of theirs');
    assert.equal(res.filed[0].authorSide, 'counterparty');
    assert.match(res.filed[0].newText, /forty-five \(45\) days/);
    assert.notEqual(win.negoChangeById(c, ask.id).status, 'accepted');
  });

  test('(4) a new clause elsewhere is still their ask, beside the answer to ours', async () => {
    const { win, c, ask } = await world();
    const paras = win.negoBaseText(c).split('\n').map(l => l.replace('thirty (30) days', 'sixty (60) days'));
    paras.push('3. INSURANCE', '3. The Supplier shall keep insurance of not less than KES 10,000,000.');
    const res = await win.negoImportReturnedDocx(c, docxOf(win, paras), {});
    assert.equal(JSON.stringify(res.answered.map(x => [x.id, x.status])), JSON.stringify([[ask.id, 'accepted']]));
    assert.equal(res.filed.length, 1, 'the new clause is filed as theirs');
    assert.equal(res.filed[0].changeType, 'insertClause');
  });

  test('(5) a caller that does not pass the flag reads exactly as before', async () => {
    const { win, c } = await world();
    const filed = await win.negoFileProposal(c, win.negoBaseText(c), { side: 'counterparty', author: 'Them' });
    assert.equal(filed.answered, undefined, 'no answers are read without readOurAsks');
  });

  test('(6) the import hands the turn back and says what it read in an ok toast', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const at = src.indexOf('negoImportReturnedDocx(c, bytes');
    assert.ok(at > 0, 'the import door is found');
    const region = src.slice(at, src.indexOf('}catch(e){', at));
    assert.match(region, /negoTurnBack\(c,/, 'a returned file hands the table back like a link answer');
    assert.match(region, /co_import_accepted/, 'accepted answers are said');
    assert.match(region, /co_import_rejected/, 'rejected answers are said');
    assert.match(region, /'ok'\);/, 'the toast carries a kind');
  });
});
