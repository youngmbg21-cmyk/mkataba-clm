/* ============================================================
   f321 — THE EXPOSURE REGISTER (S10 of HaTi's Next Fifteen, 16 Sep 2026)
   ============================================================
   *"A risk score out of 100 — every competitor has one and none can explain
   it. The exposure register counts instead, and every count opens onto the
   contracts behind it."*

   THE REFUSAL IS THE FEATURE, so section 4 is a WALL: there is no score on
   this page and there is not to be one. The rest is arithmetic over fields
   the record already holds, which is the other half of the same promise — a
   lawyer can derive every number here by opening the contracts behind it.

   SECTION 2 IS THE ONE THAT WOULD BE EASY TO GET WRONG. A contract whose
   wording does not settle the question belongs in the LAST row and in none of
   the others; counting `unclear` as exposure would inflate every figure on
   the page in the flattering direction, which is the direction a dispute
   destroys. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'intelligence.js'), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const EXP = CODE.slice(CODE.indexOf('const EXPOSURE_KINDS'), CODE.indexOf('function intelObligationsData'));
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
const META = fs.readFileSync(path.join(__dirname, '..', 'js', 'metadata.js'), 'utf8');

const C = (id, meta, extra) => Object.assign({
  id, name: id, counterparty: 'Co ' + id, status: 'Executed', value: 1000,
  folder: 'proc', metadata: Object.assign({ currency: 'KES' }, meta || {}),
  obligations: [], audit: [], comments: [], signatures: [], fields: {},
}, extra || {});

function world(cs){
  const w = buildWorld({ intelView: true, homeView: true });
  const win = w.win;
  win.state = Object.assign(win.state || {}, { contracts: cs });
  return win;
}
/* The book every claim below reads: one contract per exposure, one CONTROL
   whose field says `unclear`, one declined, one shelved, one that has been
   read and one that has not. */
function book(){
  return [
    C('L1', { liabilityCapped: 'uncapped' },   { scan: { at: '2026-01-01' } }),
    C('L2', { liabilityCapped: 'uncapped' },   { scan: { at: '2026-01-01' } }),
    C('U1', { liabilityCapped: 'unclear' },    { scan: { at: '2026-01-01' } }),
    C('U2', {},                                { scan: { at: '2026-01-01' } }),
    C('P1', { priceReview: 'open' },           { scan: { at: '2026-01-01' } }),
    C('P2', { priceReview: 'ceiling' },        { scan: { at: '2026-01-01' } }),
    C('I1', { indemnityCapped: 'uncapped' },   { scan: { at: '2026-01-01' } }),
    C('I2', { indemnityCapped: 'none' },       { scan: { at: '2026-01-01' } }),
    C('R1', { renewalType: 'auto-renew', noticePeriodDays: 14 }, { scan: { at: '2026-01-01' } }),
    C('R2', { renewalType: 'auto-renew', noticePeriodDays: 90 }, { scan: { at: '2026-01-01' } }),
    C('R3', { renewalType: 'auto-renew' },     { scan: { at: '2026-01-01' } }),
    C('X1', { exclusivity: 'exclusive', terminateForConvenience: 'no' },  { scan: { at: '2026-01-01' } }),
    C('X2', { exclusivity: 'exclusive', terminateForConvenience: 'yes' }, { scan: { at: '2026-01-01' } }),
    C('N1', { liabilityCapped: 'uncapped' },   {}),                       // never read
    C('D1', { liabilityCapped: 'uncapped' },   { status: 'Declined' }),   // out
    C('A1', { liabilityCapped: 'uncapped' },   { archived: { at: 'x' } }), // out
  ];
}
const rowOf = (d, k) => d.rows.find(r => r.k === k);

describe('f321 (1) a sixth tab, and it is a name added in one place', () => {
  test('1a IG_TABS and IG_TAB_LABEL hold the same six names', () => {
    const w = world(book());
    assert.deepEqual(w.IG_TABS, ['frame','friction','obligations','payterms','exposure','map']);
    assert.deepEqual(Object.keys(w.IG_TAB_LABEL).sort(), w.IG_TABS.slice().sort());
  });
  test('1b the row and renderIntel\'s own guard read the same list', () => {
    assert.match(CODE, /IG_TABS\.indexOf\(intel\.tab\)<0/);
    assert.match(CODE, /IG_TABS\.map\(k=>tabBtn\(k,i18t\(IG_TAB_LABEL\[k\]\)\)\)/);
  });
  test('1c intelGoTab reaches it, because it asks IG_TABS too', () => {
    const w = world(book());
    w.intelGoTab('exposure');
    assert.equal(w.intel.tab, 'exposure');
  });
  test('1d the label is a KEY, resolved at draw time, in both books', () => {
    assert.equal(world(book()).IG_TAB_LABEL.exposure, 'int_exposure');
    assert.match(I18N, /int_exposure: 'Exposure'/);
    assert.match(I18N, /int_exposure: 'Exponering'/);
  });
});

describe('f321 (2) a contract the wording does not settle is in NO exposure row', () => {
  test('2a `unclear` and absent are both left out — of every row', () => {
    const d = world(book()).exposureData();
    assert.deepEqual(rowOf(d,'liability').ids.sort(), ['L1','L2','N1'], 'U1 (unclear) and U2 (absent) are out');
    assert.deepEqual(rowOf(d,'price').ids, ['P1'], 'a ceiling is a price you can plan around');
    assert.deepEqual(rowOf(d,'indemnity').ids, ['I1'], '"none stated" is not "no ceiling"');
    assert.deepEqual(rowOf(d,'lockin').ids, ['X1'], 'an exclusive deal you can exit is not a lock-in');
  });
  test('2b an auto-renewal with no notice period recorded is not counted', () => {
    const d = world(book()).exposureData();
    assert.deepEqual(rowOf(d,'autorenew').ids, ['R1'], 'R3 has no window on file and R2\'s is 90 days');
  });
  test('2c the threshold is a named number, not a literal in the test', () => {
    const w = world(book());
    assert.equal(w.EXPOSURE_NOTICE_DAYS, 30);
    const cs = book(); cs.find(c=>c.id==='R2').metadata.noticePeriodDays = w.EXPOSURE_NOTICE_DAYS - 1;
    assert.deepEqual(rowOf(world(cs).exposureData(),'autorenew').ids.sort(), ['R1','R2']);
  });
  test('2d declined and shelved are out of the live book entirely', () => {
    const w = world(book());
    const live = w.exposureLive().map(c=>c.id);
    assert.ok(!live.includes('D1') && !live.includes('A1'));
    assert.ok(!rowOf(w.exposureData(),'liability').ids.includes('D1'));
  });
});

describe('f321 (3) the last row is the honest one', () => {
  test('3a it counts what copilotRead says has not been read', () => {
    const w = world(book());
    const d = w.exposureData();
    assert.deepEqual(d.unread.ids, ['N1'], 'every other live contract carries a scan');
    assert.equal(w.copilotRead(w.state.contracts[0]), true);
  });
  test('3b ANY ONE of the three counts as read — the same rule Home uses', () => {
    const cs = book();
    cs.find(c=>c.id==='N1').playbook = { at: 'x' };
    assert.equal(world(cs).exposureData().unread.n, 0);
    const cs2 = book(); cs2.find(c=>c.id==='N1')._hasBrief = true;
    assert.equal(world(cs2).exposureData().unread.n, 0);
  });
  test('3c a contract can be in an exposure row AND in the last row', () => {
    const d = world(book()).exposureData();
    assert.ok(rowOf(d,'liability').ids.includes('N1'));
    assert.ok(d.unread.ids.includes('N1'), 'the last row is not a sixth exposure, it is what we cannot say');
  });
});

describe('f321 (4) NO SCORE — the one place the market standard is refused', () => {
  test('4a nothing in the reading computes a rating', () => {
    assert.ok(!/score|rating|grade|\/ ?100|out of 100/i.test(EXP),
      'a number a lawyer cannot derive is worse than a count they can press');
  });
  test('4b and nothing in the dictionary offers one', () => {
    const keys = (I18N.match(/int_exp_[a-z_]+/g) || []);
    assert.ok(keys.length > 10);
    assert.ok(!keys.some(k => /score|rating|grade/.test(k)));
  });
  test('4c the drawn page carries no score either', () => {
    const w = world(book());
    const html = w.exposureHtml();
    assert.ok(!/score|out of 100/i.test(html));
  });
});

describe('f321 (5) every row is a door, and it is the door that already exists', () => {
  test('5a every non-empty row carries a press', () => {
    const w = world(book());
    const html = w.exposureHtml();
    w.exposureData().rows.filter(r=>r.n).forEach(r=>{
      assert.ok(html.includes('data-exp-go="' + r.k + '"'), r.k + ' has no door');
    });
    assert.ok(html.includes('data-exp-go="unread"'));
  });
  test('5b an EMPTY row draws no verb — a press that cannot work is not drawn', () => {
    const cs = [C('Z1', {})];
    const w = world(cs);
    assert.equal(w.exposureData().rows.filter(r=>r.n).length, 0);
    assert.ok(!/data-exp-go="liability"/.test(w.exposureHtml()));
  });
  test('5c the door is regShowOnly, which says what it narrowed to and carries the way back', () => {
    assert.match(EXP, /regShowOnly\(r\.ids, r\.title\)/);
    assert.ok(!/setView\('register'\)/.test(EXP), 'it does not navigate on its own');
  });
});

describe('f321 (6) the money is "on paper", and what cannot be converted is said', () => {
  test('6a a contract already in the home currency is a real figure, not a zero', () => {
    const d = world(book()).exposureData();
    assert.equal(rowOf(d,'liability').value, 3000, 'three contracts at 1,000 each in KES');
    assert.equal(rowOf(d,'liability').left, 0);
  });
  test('6b a missing rate is LEFT OUT and counted, never summed at par', () => {
    const cs = book(); cs.find(c=>c.id==='L1').metadata.currency = 'EUR';
    const r = rowOf(world(cs).exposureData(), 'liability');
    assert.equal(r.value, 2000);
    assert.equal(r.left, 1);
  });
  test('6c money obeys canViewValues — absent, never a row of dashes', () => {
    const w = world(book());
    w.canViewValues = () => false;
    const d = w.exposureData();
    assert.equal(d.money, false);
    assert.equal(rowOf(d,'liability').value, null);
    assert.equal(rowOf(d,'liability').worst, null, 'the worst one is ranked by value, so it goes too');
    /* The COLUMN goes; the foot's own sentence about what the figure is stays
       (it names "Value on paper" too, which is why this asks for the header
       cell and not for the words anywhere on the page). */
    assert.ok(!/<th[^>]*>Value on paper<\/th>/.test(w.exposureHtml()));
    assert.equal(rowOf(d,'liability').n, 3, 'the COUNT still stands');
  });
  test('6d the worst one is the largest by value, and nothing else', () => {
    const cs = book(); cs.find(c=>c.id==='L2').value = 9000;
    const r = rowOf(world(cs).exposureData(), 'liability');
    assert.equal(r.worst.id, 'L2');
  });
  test('6e the foot says what the figure is and is not', () => {
    assert.match(I18N, /int_exp_foot: 'Live agreements only.*not what you would lose/);
  });
});

describe('f321 (7) counting is not drawing, and reading must not write', () => {
  test('7a the renderer computes nothing — it asks exposureData and prints it', () => {
    const draw = CODE.slice(CODE.indexOf('function exposureHtml'), CODE.indexOf('function exposureWire'));
    assert.ok(!/\.filter\(|\.reduce\(|fxHome\(/.test(draw.replace(/d\.rows\.map/g,'')),
      'a figure worked out twice is a figure that can differ');
    assert.match(draw, /const d = exposureData\(\)/);
  });
  test('7b nothing here calls a name that initialises a negotiation', () => {
    assert.ok(!/negoInit|negoChanges|negoClauseList|negoRound\(/.test(EXP));
  });
  test('7c it reads the record, never the wording, at draw time', () => {
    assert.ok(!/redlineText|bodyHtml|contractFullBody|\.body\b/.test(EXP),
      'a judgement made from wording on a page a lawyer reads as fact is a judgement made silently');
    assert.match(EXP, /_expMeta\(c\)/);
  });
  test('7d reading it twice gives the same answer and changes nothing', () => {
    const w = world(book());
    const a = JSON.stringify(w.state.contracts);
    const one = JSON.stringify(w.exposureData());
    const two = JSON.stringify(w.exposureData());
    assert.equal(one, two);
    assert.equal(JSON.stringify(w.state.contracts), a, 'the book is byte-identical after two readings');
  });
});

/* js/metadata.js is on no test stage — it is read as SOURCE here, which is
   the right instrument anyway: every claim in this section is about the shape
   of the catalogue, not about a value computed from it. */
describe('f321 (8) the two fields the register needed, and nothing more', () => {
  test('8a they are ordinary metadata, written like the field beside them', () => {
    assert.match(META, /k:'indemnityCapped',[^\n]*type:'select', opts:\['capped','uncapped','none','unclear'\]/);
    assert.match(META, /k:'terminateForConvenience',[^\n]*type:'select', opts:\['yes','no','unclear'\]/);
    assert.ok(/k:'liabilityCapped'/.test(META), 'they stand beside the field they are modelled on');
  });
  test('8b every option they offer has a label, in both books', () => {
    ['mo_none_stated','mo_yes','mo_no'].forEach(k=>{
      assert.equal((I18N.match(new RegExp(k + ':', 'g')) || []).length, 2, k + ' is not in both books');
    });
    assert.match(META, /get none\(\)\{ return i18t\('mo_none_stated'\); \}/);
    assert.match(META, /get yes\(\)\{ return i18t\('mo_yes'\); \}/);
  });
  test('8c the extractor is told to go and look for them', () => {
    assert.match(META, /indemnif\|indemnit\|hold harmless\|terminat/);
    assert.ok(/prio:2, re:\/indemnif/.test(META),
      'lifted OUT of the boilerplate band, or a long agreement\'s slice throws them away');
  });
  test('8d absent on every record on file — no migration, no default', () => {
    const c = C('Z', {});
    assert.equal(c.metadata.indemnityCapped, undefined);
    assert.equal(world([c]).exposureData().rows.every(r => r.n === 0), true);
  });
  test('8e and the reading never writes one in by looking', () => {
    const c = C('Z', {});
    const before = JSON.stringify(c.metadata);
    world([c]).exposureData();
    assert.equal(JSON.stringify(c.metadata), before);
  });
});
