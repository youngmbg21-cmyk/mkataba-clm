/* ============================================================
   f324 — "DO THIS TO THESE N", AND A REQUIRED DOCUMENT AS A FILTER
   (S13 + S14 + S8 of HaTi's Next Fifteen, built 16 Sep 2026)
   ============================================================
   THE CONDITION IS THE FEATURE. "These 14" means something only after the
   reader has just said which fourteen; with nothing narrowing the table the
   same button is an offer to act on the whole book, which is the one
   proposal in the fifteen that could damage a customer's relationships in an
   afternoon. So section 1 is about WHEN THE BUTTON EXISTS, and every claim
   there is a wall.

   WHAT THIS FILE CANNOT SEE. Whether the button lands left of Draft new
   agreement, whether the menu opens under it, whether the table moved by a
   pixel — none of that is knowable in jsdom. It is driven with a real mouse
   in the browser run instead. What IS here: the reading behind the button,
   the walls each act asks, the shape each act writes, and the guarantee that
   nothing in the pack was written by a model. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'cohort.js'), 'utf8');
/* Comments off first: this file's own header NAMES the things it refuses to
   do, and a net a header can trip is a net that gets silenced by deleting the
   header. String literals stay — a route written as a string IS the fault. */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const REG = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'register.js'), 'utf8');
const OBL = fs.readFileSync(path.join(__dirname, '..', 'js', 'obligations.js'), 'utf8');
const FAM = fs.readFileSync(path.join(__dirname, '..', 'js', 'family.js'), 'utf8');
const APP = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
/* buildWorld hands back the window it built; the book is seeded onto it. One
   world per claim, so a filter left on by one cannot narrow the next. */
function world(opts){
  const w = buildWorld(Object.assign({ registerView:true, obligations:true, cohort:true }, opts||{}));
  const win = w.win;
  win.state = Object.assign(win.state || {}, { contracts: book() });
  if(typeof win.regSetScope === 'function') win.regSetScope(null);
  if(typeof win.regState === 'function'){
    Object.assign(win.regState(), { query:'', stage:'all', type:'all', category:'all',
      signed:'all', payterms:'all', docs:'all', renewal:'all', sort:'updated', dir:-1,
      page:1, sel:{}, view:null, only:null });
  }
  /* getContract belongs to the application shell, which this stage does not
     boot — the book is a plain array here, so it is looked up as one. */
  win.getContract = id => (win.state.contracts || []).find(c => c && c.id === id);
  return win;
}
function book(){
  const C = (id, name, extra) => Object.assign({
    id, name, counterparty:'Bidco Africa', folder:'procurement', value:1000, valueType:'estimated',
    status:'Executed', template:null, metadata:{ currency:'KES' }, obligations:[], changes:[],
    audit:[], comments:[], signatures:[], fields:{},
  }, extra || {});
  return [
    C('MK-1','Palm olein supply',{ obligations:[
      { id:'o1', desc:'Insurance certificate', party:'theirs', status:'open', due:day(-40), doc:{ file:'P', until:day(-3) } } ] }),
    C('MK-2','Sugar supply',{ obligations:[
      { id:'o2', desc:'KEBS certificate', party:'theirs', status:'open', due:day(-10), doc:{ file:'K', until:day(400) } } ] }),
    C('MK-3','Carton supply',{ obligations:[
      { id:'o3', desc:'Food safety certificate', party:'theirs', status:'open', due:day(-10), doc:{} } ] }),
    C('MK-4','Depot lease',{ obligations:[
      { id:'o4', desc:'Pay the rent', party:'ours', status:'open', due:day(20) } ] }),
    C('MK-5','Soon to lapse',{ obligations:[
      { id:'o5', desc:'Licence', party:'theirs', status:'open', due:day(-2), doc:{ file:'L', until:day(9) } } ] }),
  ];
}

describe('f324 (1) the button exists only while the table is narrowed', () => {
  test('1a cohortSet is empty with nothing narrowing, and the button is not drawn', () => {
    const w = world();
    assert.equal(w.regNarrowed(), false, 'nothing should be narrowing at rest');
    assert.deepEqual(w.cohortSet(), [], 'no cohort with the whole book showing');
    assert.equal(w.cohortButtonHtml(), '', 'and therefore no button');
  });
  test('1b one filter and the cohort is that filter\'s own set', () => {
    const w = world();
    w.regState().docs = 'lapsed';
    assert.equal(w.regNarrowed(), true);
    assert.deepEqual(w.cohortSet().map(c=>c.id), ['MK-1'], 'the register decides, not the cohort');
    assert.match(w.cohortButtonHtml(), /reg-cohort/);
  });
  test('1c the count on the button IS the count in the table', () => {
    const w = world();
    w.regState().query = 'supply';
    const n = w.regFiltered().length;
    assert.ok(n > 1, 'the fixture should narrow to more than one');
    assert.match(w.cohortButtonHtml(), new RegExp('\\b' + n + '\\b'));
  });
  test('1d never on the Negotiations seat — that page is not the book', () => {
    const w = world();
    w.regSetScope('negotiations');
    w.regState().stage = 'Executed';
    assert.deepEqual(w.cohortSet(), []);
    assert.equal(w.cohortButtonHtml(), '');
  });
  test('1e the page header leaves a SLOT, and the register is what fills it', () => {
    /* Upload joined the row on 21 Sep 2026 (the redesign's second pass); the
       slot is still FIRST, left of both. */
    /* RE-POINTED 23 Sep 2026: Upload is a door INSIDE Draft new agreement now
       (Young: "i need upload to be inside draft new agreement"), so the row is
       the slot and the one button — the slot still first. */
    assert.match(APP, /register:\s*\['cohort',\s*'new'\]/, 'the slot is first, left of Draft new agreement');
    assert.match(APP, /kind==='cohort'\)\s*return\s*`<span id="reg-cohort-slot"><\/span>`/,
      'the header draws an empty slot and never the button itself');
    assert.match(REG, /function regPaintCohort\(\)/);
    assert.match(REG, /regPaintCohort\(\);\s*\n\s*setActiveNav/, 'painted at the end of every register render');
  });
});

describe('f324 (2) the four rows, and what each one really is', () => {
  test('2a four acts in the design\'s own order, keyed in stable English', () => {
    const w = world();
    assert.deepEqual(w.COHORT_ACTS.map(a=>a.k), ['amend','askdoc','pack','export']);
    assert.equal(w.COHORT_ACTS.filter(a=>a.lead).length, 1, 'one row leads');
  });
  test('2b Export is a PROXY onto the act that already exists, not a second exporter', () => {
    assert.match(CODE, /k==='export'\)\s*\{\s*if\(typeof regExportCsv==='function'\)\s*regExportCsv\(\)/);
    assert.ok(!/toCsv|Blob\(|download/i.test(CODE), 'the cohort writes no CSV of its own');
  });
  test('2c the amendment goes through family.js\'s own door and nothing else', () => {
    assert.match(CODE, /createAmendment\(/);
    assert.ok(!/state\.contracts\.(push|unshift)/.test(CODE), 'the cohort mints no contract itself');
    assert.ok(!/nextId\(/.test(CODE), 'and does not invent a reference');
  });
  test('2d the document ask goes through the obligations record\'s own writer', () => {
    assert.match(CODE, /obligationRequireDoc\(/);
    assert.match(CODE, /obligationChase\(/);
    assert.ok(!/obligations\.push/.test(CODE), 'the cohort writes no obligation itself');
  });
});

describe('f324 (3) waves, and a stop that is not decoration', () => {
  test('3a the stop is asked BETWEEN every contract, not once per wave', async () => {
    const w = world();
    const seen = [];
    const p = w.cohortRun(book(), async c => { seen.push(c.id); if(seen.length===2) w.cohortStop(); return { ok:true }; });
    const rep = await p;
    assert.equal(seen.length, 2, 'it stopped on the next contract, inside the wave');
    assert.equal(rep.done, 2);
    assert.equal(rep.stopped, true, 'and says so');
  });
  test('3b a refusal is counted and NAMED, never swallowed', async () => {
    const w = world();
    const rep = await w.cohortRun(book(), async c => c.id==='MK-2' ? { ok:true } : { ok:false, why:'nope' });
    assert.equal(rep.done, 1);
    assert.equal(rep.skipped, 4);
    assert.equal(rep.why['nope'], 4, 'the reason is kept with its count');
  });
  test('3c a step that throws is a refusal, not a run that dies half way', async () => {
    const w = world();
    const rep = await w.cohortRun(book(), async c => { if(c.id==='MK-1') throw new Error('boom'); return { ok:true }; });
    assert.equal(rep.done, 4);
    assert.equal(rep.skipped, 1);
    assert.ok(Object.keys(rep.why).some(k=>/boom/.test(k)));
  });
  test('3d the report totals cannot exceed the set', async () => {
    const w = world();
    const rep = await w.cohortRun(book(), async () => ({ ok:true }));
    assert.equal(rep.done + rep.skipped, rep.total);
    assert.equal(rep.total, 5);
  });
});

describe('f324 (4) "SENT" MUST MEAN SENT — the amendment row is worded to the truth', () => {
  test('4a the label says DRAFT, and the dictionary agrees in both books', () => {
    const I = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
    assert.match(I, /co_h_amend_other: 'Draft an amendment to all \{n\}'/);
    assert.match(I, /co_h_amend_sub_other: '.*Nothing is sent to anybody/);
    assert.ok(/co_h_amend_other: 'Skriv ett tillägg till alla \{n\}'/.test(I), 'and in Swedish');
  });
  test('4b the cohort opens no send door', () => {
    assert.ok(!/doSend|buildSharePayload|openShareModal|api\(['"`]shares/.test(CODE),
      'nothing here can put paper in front of a counterparty');
  });
  test('4c the typed wording lands in the draft, as ONE paragraph, escaped', () => {
    const w = world({ family:true });
    const parent = w.getContract('MK-1');
    const r = w.createAmendment(parent, { relation:'amendment', says:'Price <b>up</b> & away' });
    assert.ok(r.contract, r.error || 'should have minted');
    const body = r.contract.redlineText;
    assert.match(body, /Price &lt;b&gt;up&lt;\/b&gt; &amp; away/, 'typed text is text, never markup');
    assert.equal((body.match(/<p>/g)||[]).length, 5, 'four skeleton paragraphs plus the one that was typed');
  });
  test('4d a caller that passes no wording is byte-identical to before', () => {
    const w = world({ family:true });
    const a = w.amendmentSkeletonBody(w.getContract('MK-1'), { relation:'amendment', ordinal:1 });
    const b = w.amendmentSkeletonBody(w.getContract('MK-1'), { relation:'amendment', ordinal:1, says:'' });
    assert.equal(a, b);
    assert.equal((a.match(/<p>/g)||[]).length, 4);
  });
  test('4e a child agreement is refused BY NAME, not skipped in silence', () => {
    const w = world({ family:true });
    const child = w.getContract('MK-2'); child.parentId = 'MK-1';
    const r = w.createAmendment(child, {});
    assert.ok(r.error, 'family.js refuses it');
    assert.match(CODE, /c\.parentId\) return \{ ok:false, why:i18t\('co_h_why_child'\) \}/);
  });
});

describe('f324 (5) the required-document writer, and the wall it shares', () => {
  test('5a it writes the form\'s own shape: theirs, no assignee, an EMPTY doc', () => {
    const w = world();
    const c = w.getContract('MK-4');
    const r = w.obligationRequireDoc(c, { desc:'Public liability policy', due:day(14) });
    assert.equal(r.ok, true, r.why);
    assert.equal(r.o.party, 'theirs');
    assert.equal(r.o.assignee, '');
    assert.deepEqual(r.o.doc, {}, 'an empty doc is "this is a document and nothing has arrived"');
    assert.equal(w.obligationDocState(r.o), 'missing');
  });
  test('5b it asks obligationAlreadyOn — the SAME reading the typed door asks', () => {
    const w = world();
    const c = w.getContract('MK-4');
    assert.equal(w.obligationRequireDoc(c, { desc:'Licence' }).ok, true);
    const again = w.obligationRequireDoc(c, { desc:'  licence  ' });
    assert.equal(again.ok, false, 'whitespace collapsed and case folded, exactly as the scan matches');
    assert.match(again.why, /licence/i, 'and names what it clashes with');
    assert.equal(c.obligations.filter(o=>/licence/i.test(o.desc)).length, 1);
  });
  test('5c a refusal comes back as a reason, never as an exception', () => {
    const w = world();
    assert.equal(w.obligationRequireDoc(w.getContract('MK-4'), { desc:'' }).ok, false);
    assert.equal(w.obligationRequireDoc(null, { desc:'x' }).ok, false);
  });
  test('5d it writes one audit line and says the document is theirs to hold', () => {
    const w = world();
    const c = w.getContract('MK-4');
    const before = (c.audit||[]).length;
    w.obligationRequireDoc(c, { desc:'Insurance schedule' });
    assert.equal((c.audit||[]).length, before + 1);
    assert.match(c.audit[c.audit.length-1].detail, /a document we must hold/);
  });
});

describe('f324 (6) the quiet chase is quiet, never silent', () => {
  test('6a `opts` is additive — a caller that passes nothing is unchanged', () => {
    assert.match(OBL, /async function obligationChase\(cid, obId, opts\)\{/);
    assert.match(OBL, /const _quiet = !!_o\.quiet;/);
    assert.match(OBL, /return _quiet \? mail : o;/, 'the loud path still answers with the obligation');
  });
  test('6b every refusal the loud path toasts, the quiet path RETURNS', () => {
    const q = OBL.slice(OBL.indexOf('async function obligationChase'), OBL.indexOf('THE CHAIN\'S READINGS ARE PUBLISHED'));
    const toasts = (q.match(/if\(!_quiet\) toast\(/g) || []).length;
    assert.ok(toasts >= 5, 'every toast in the chase is behind the quiet flag — found ' + toasts);
    assert.ok(!/(^|[^!])\btoast\(/.test(q.replace(/if\(!_quiet\) toast\(/g, 'X(')),
      'and no toast is left unguarded');
  });
  test('6c the cohort counts what the chase answered, and prints it once', () => {
    assert.match(CODE, /confirm:false, quiet:true/);
    assert.match(CODE, /m\.sent \|\| m\.outbox/);
    assert.match(CODE, /co_h_askdoc_mail/, 'the two facts are reported apart');
  });
});

describe('f324 (7) the diligence pack is deterministic, and reads like the record', () => {
  test('7a no model, no route, no spend', () => {
    assert.ok(!/anthropic|copilotAsk|aiAsk|\/api\/ai|openai/i.test(CODE));
  });
  test('7b it reads `c.changes` RAW — negoOpenPoints would create a negotiation', () => {
    assert.ok(!/negoOpenPoints|negoInit|negoChanges|negoClauseList/.test(CODE),
      'READING MUST NOT WRITE: a pack over the book would stamp every contract');
    assert.match(CODE, /\(c\.changes\|\|\[\]\)/);
  });
  test('7c a standalone document carries no :root, so every value is a literal', () => {
    const pack = CODE.slice(CODE.indexOf('function cohortPackHtml'));
    assert.ok(!/var\(--/.test(pack), 'a var() in a second tab resolves to nothing');
  });
  test('7d money obeys canViewValues — no figures at all, never a row of dashes', () => {
    const w = world();
    w.canViewValues = () => false;
    const d = w.cohortPackData(w.state.contracts);
    assert.equal(d.total, null);
    assert.ok(d.rows.every(r => r.value === ''), 'the value is absent, not an em-dash');
    assert.ok(!/On paper/.test(w.cohortPackHtml(d)));
  });
  test('7e a contract already in the home currency is a real figure, not a zero', () => {
    const w = world();
    const d = w.cohortPackData(w.state.contracts);
    assert.equal(d.total, 5000, 'five contracts at 1,000 each, all in KES');
    assert.equal(d.left, 0);
  });
  test('7f a rate that is missing is LEFT OUT and counted, never guessed', () => {
    const cs = book(); cs[0].metadata = { currency:'EUR' };
    const w = world(); w.state.contracts = cs;
    const d = w.cohortPackData(w.state.contracts);
    assert.equal(d.total, 4000, 'the euro contract is not summed at par');
    assert.equal(d.left, 1);
    assert.match(w.cohortPackHtml(d), /left out, no rate on file/);
  });
  test('7g every document on the pack is the Overview\'s own reading', () => {
    const w = world();
    const r = w.cohortPackRow(w.getContract('MK-1'));
    assert.equal(r.docs.length, 1);
    assert.equal(r.docs[0].state, 'lapsed');
    assert.equal(w.obligationDocState(w.getContract('MK-1').obligations[0]), 'lapsed');
  });
});

describe('f324 (8) the required-document filter narrows the register', () => {
  const only = (docs) => {
    const w = world();
    w.regState().docs = docs;
    return w.regFiltered().map(c=>c.id).sort();
  };
  test('8a lapsed · missing · soon · none are obligationDocState\'s own four', () => {
    assert.deepEqual(only('lapsed'),  ['MK-1']);
    assert.deepEqual(only('missing'), ['MK-3']);
    assert.deepEqual(only('soon'),    ['MK-5']);
    assert.deepEqual(only('none'),    ['MK-4'], 'a contract requiring no document at all');
  });
  test('8b it is behind Adapt filters, like the two before it', () => {
    const w = world();
    assert.ok(w.REG_BAR_FILTERS.some(f=>f.k==='docs'));
    assert.ok(!w.REG_BAR_DEFAULT.includes('docs'), 'the bar does not grow on its own');
  });
  test('8c but it draws the moment it narrows — the bar\'s own safety property', () => {
    const w = world();
    assert.ok(!w.regBarShown(w.regState()).includes('docs'));
    w.regState().docs = 'lapsed';
    assert.ok(w.regBarShown(w.regState()).includes('docs'));
    assert.equal(w.regFilterActive('docs', w.regState()), true);
  });
  test('8d regNarrowed learned it, so Clear and the cohort button both see it', () => {
    const w = world();
    assert.equal(w.regNarrowed(), false);
    w.regState().docs = 'soon';
    assert.equal(w.regNarrowed(), true);
  });
  test('8e every place that clears the filters clears this one', () => {
    const clears = REG.match(/R\.payterms='all';/g) || [];
    const withDocs = REG.match(/R\.payterms='all'; R\.docs='all';|R\.payterms='all'; R\.docs='all'/g) || [];
    assert.equal(clears.length, withDocs.length,
      'a filter that Clear does not clear is a filter that can be quietly left on');
    assert.match(REG, /REG_STATE_DEF = \(\) => \(\{[^)]*docs:'all'/);
  });
});

describe('f324 (9) the register is what decides, so the two cannot drift', () => {
  test('9a cohortSet asks regFiltered and holds no copy of the rules', () => {
    assert.ok(!/status===|expiry|folder===|\.metadata\./.test(
      CODE.slice(CODE.indexOf('function cohortSet'), CODE.indexOf('function _cohortN'))),
      'no second set of filter rules');
    assert.match(CODE, /regFiltered\(\)/);
  });
  test('9b and it answers empty on a stage that has no register at all', () => {
    const w2 = buildWorld({ obligations:true, cohort:true });
    const w = w2.win; w.state = Object.assign(w.state||{}, { contracts: book() });
    assert.deepEqual(w.cohortSet(), [], 'a typeof guard, not a throw');
    assert.equal(w.cohortButtonHtml(), '');
  });
  test('9c every name this file publishes is reachable', () => {
    const w = world();
    ['cohortSet','cohortButtonHtml','cohortRun','cohortStop','cohortAct','cohortPackData',
     'cohortPackHtml','cohortPackRow','COHORT_ACTS','COHORT_WAVE'].forEach(n=>{
      assert.equal(typeof w[n] !== 'undefined', true, n + ' is not published');
    });
  });
  test('9d the skeleton\'s `says` is carried by createAmendment and nowhere else', () => {
    assert.match(FAM, /amendmentSkeletonBody\(parent, \{ relation:rel, ordinal:ord, says:opts\.says \}\)/);
    assert.equal((FAM.match(/says:opts\.says/g)||[]).length, 1);
  });
});
