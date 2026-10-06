/* f538 — READ MORE ON THE INSIGHTS TODAY CARDS (Young, 6 Oct 2026: the
   Headline job order's item 4a, Part C of the combined job order)
   ============================================================================
     (1) the card's finding is its headline; "Ask why" is gone and Read more
         (the board's own data-hb-read-more) sits where it stood, keyed
         "ins:<card>";
     (2) Read more opens the card's OWN reading inside the card — the same run
         its thumbnail draws (hbReadSrc reads the card's question over the
         whole book), with "What could explain this?" in it; Show less folds
         it; it is per sitting (_hbReadOpen), nothing spent on paint;
     (3) hb_ins_why / hb_ins_why_q are inert in both books and nothing calls
         them; the shelf aligns its cards to the top so only the opened one
         grows.
   Browser: insights-shelf-verify 6a–6d. Run: node --test test/f538-shelf-read-more.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { mon } = require('./board-precision');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
function world(){
  const w = buildWorld({ intelView: true }).win;
  const cs = [];
  for (let k = 0; k < 8; k++) for (let j = 0; j < 3; j++){
    const days = 40 - 2 * k, signed = mon(k - 8, 10 + j), raised = new Date(Date.parse(signed + 'T00:00:00') - days * 864e5);
    cs.push({ id: 'S' + k + j, name: 'Signed ' + k + j, counterparty: 'Kevian Kenya Ltd', status: 'Signed', value: 1e6, expiry: mon(k + 20),
      signedAt: signed, _raisedAt: raised.toISOString(), folder: 'proc', audit: [], metadata: { paymentTerms: '30 days' } });
  }
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' } };
  w.cKind = () => 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
  w.paySide = () => null; w.contractExpired = () => false;
  w.currentUser = () => ({ id: 'u_ins', name: 'Test', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  return w;
}
const textOf = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

describe('f538 (1) Read more where Ask why stood', () => {
  test('the card carries Read more keyed to itself, and no Ask why', () => {
    const w = world();
    const c = w.hbInsCandidate('sign');
    const h = w.hbShelfHtml([c]);
    assert.match(h, new RegExp('data-hb-read-more="ins:' + c.id + '" aria-expanded="false">Read more<'));
    assert.ok(!/data-hb-ins="why"/.test(h));
    assert.ok(!/class="hb-read"/.test(h), 'closed at rest');
  });
});

describe('f538 (2) the card\'s own reading, in the card', () => {
  test('Read more opens the reading of the card\'s own chart, with What could explain this?, and Show less folds it', () => {
    const w = world();
    const c = w.hbInsCandidate('sign');
    const src = w.hbReadSrc('ins:' + c.id);
    assert.ok(src && src.reading && src.reading.lines.length, 'a reading of the card\'s own chart');
    assert.equal(src.cs.length, c.C.cs.length, 'over the same contracts its thumbnail counts');
    w.hbReadMoreToggle('ins:' + c.id);
    const open = w.hbShelfHtml([c]);
    assert.match(open, /class="hb-read"/);
    assert.match(open, /data-hb-why="ins:/, 'What could explain this? is in the card');
    assert.match(open, />Show less</);
    assert.ok(textOf(open).includes(textOf(src.reading.lines[0])), 'it is that reading');
    w.hbReadMoreToggle('ins:' + c.id);
    assert.ok(!/class="hb-read"/.test(w.hbShelfHtml([c])));
  });
  test('nothing is spent on paint, and the key reaches only a real card', () => {
    const w = world();
    let asked = 0; w.copilotAsk = async () => { asked++; return { answer: 'x' }; };
    const c = w.hbInsCandidate('sign'); w.hbReadMoreToggle('ins:' + c.id); w.hbShelfHtml([c]);
    assert.equal(asked, 0);
    assert.equal(w.hbReadSrc('ins:nosuch'), null);
  });
});

describe('f538 (3) the retired door', () => {
  test('hb_ins_why / hb_ins_why_q stay inert in both books; nothing calls them; the shelf aligns to the top', () => {
    const SRC = read('js/views/homeboard.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/'hb_ins_why'|'hb_ins_why_q'/.test(SRC));
    const I = read('js/i18n.js');
    for (const k of ['hb_ins_why', 'hb_ins_why_q']) assert.equal((I.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k);
    assert.match(read('index.html'), /\.hb-shelf\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:10px;align-items:start;/);
  });
});
