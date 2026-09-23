/* f367 — FOUR FIXES OFF ONE LONG CONTRACT (Young's order, 23 Sep 2026)

     1  a reading's answer is CHECKED before it is filed: the model's own call
        syntax is cut out of a field, an answer written under another field's
        name is moved there, "not specified" is filed as silence — at the
        server's route, at the browser's door, and on a record already carrying
        the fault
     2  Plain English reads a long contract in pages sized by their WORDS, with
        no whole-edition ceiling of one call, and a page cut short is asked
        again in two halves, once
     3  the X-ray map scrolls: every block has a height it can be pressed at,
        and the map follows the paper
     N  "Draft new agreement" opens two doors — Draft from HaTi, Upload a
        contract — and the separate Upload button is gone

   A missing name READS AS EMPTY rather than throwing. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const SERVER = strip(read('server/server.js'));
const ROOM = strip(read('js/views/contract.js'));
const CORE = strip(read('js/core.js'));
const APP = strip(read('js/app.js'));
const WIZ = strip(read('js/wizard.js'));
const INDEX = read('index.html');
const I18N = read('js/i18n.js');
let MC = {};
try { MC = require('../js/metaclean.js'); } catch (_) { MC = {}; }

/* ===================== 1 · THE ANSWER IS CHECKED ===================== */
describe('f367 (1) a reading\'s answer is checked before it is filed', () => {
  /* THE OWNER'S OWN RECORD, word for word off the screenshot. */
  const BROKEN = {
    contractType: 'Software as a Service Agreement', value: 9000000, currency: 'USD',
    paymentTerms: 'Terms not specified in available text</paymentTerms><parameter name="value">0',
    governingLaw: 'Denmark</governingLaw><parameter name="disputes">The Danish Institute of Arbitration in accordance with its rules of arbitration, 3 arbitrators, Copenhagen, English language',
    disputes: '',
    confidentiality: 'Perpetual for confidential information; exceptions include public domain',
  };
  const KEYS = ['contractType', 'value', 'currency', 'paymentTerms', 'governingLaw', 'disputes', 'confidentiality', 'noticePeriodDays'];
  test('the reading exists and is shared (module and window)', () => {
    assert.equal(typeof MC.metaUnleak, 'function');
    assert.ok(/Object\.assign\(window, API\)/.test(read('js/metaclean.js')));
  });
  test('the seam is cut, the misplaced answer moved, the number untouched', () => {
    const m = (MC.metaUnleak ? MC.metaUnleak(BROKEN, KEYS) : { meta: BROKEN }).meta;
    assert.equal(m.governingLaw, 'Denmark');
    assert.match(m.disputes, /^The Danish Institute of Arbitration/, 'the disputes answer lands in its own field');
    assert.equal(m.value, 9000000, 'a value the model gave is never overwritten by one after a seam');
    assert.ok(!Object.values(m).some(v => typeof v === 'string' && /<\/?[A-Za-z]/.test(v)), 'no markup survives');
  });
  test('an answer that only says the contract is silent is filed as silence', () => {
    const m = (MC.metaUnleak ? MC.metaUnleak(BROKEN, KEYS) : { meta: BROKEN }).meta;
    assert.equal(m.paymentTerms, '', 'the card prints its em-dash');
    const ok = (MC.metaUnleak ? MC.metaUnleak({ paymentTerms: 'Thirty (30) days from invoice' }) : { meta: {} }).meta;
    assert.equal(ok.paymentTerms, 'Thirty (30) days from invoice', 'a real answer is left alone');
  });
  test('[wall] an unknown name after a seam is dropped, never filed', () => {
    const m = (MC.metaUnleak ? MC.metaUnleak({ paymentTerms: 'x</paymentTerms><parameter name="evil">y' }, ['paymentTerms']) : { meta: {} }).meta;
    assert.ok(!('evil' in m));
  });
  test('the input is never changed — a copy comes back', () => {
    const copy = JSON.parse(JSON.stringify(BROKEN));
    if (MC.metaUnleak) MC.metaUnleak(copy, KEYS);
    assert.deepEqual(copy, BROKEN);
  });
  test('the server checks every answer before it leaves, against its own schema', () => {
    assert.match(SERVER, /const cleaned = metaUnleak\(block\.input \|\| \{\}, Object\.keys\(tool\.input_schema\.properties \|\| \{\}\)\);/);
    assert.match(SERVER, /require\(path\.join\(__dirname, '\.\.', 'js', 'metaclean\.js'\)\)/);
  });
  test('and the reading has room for the nineteen fields it now returns', () => {
    assert.match(SERVER, /max_tokens: 3000, tools: \[tool\], tool_choice: \{ type: 'tool', name: 'file_contract' \}/);
  });
  test('the browser checks at its door, and a record already broken is cleaned when opened', () => {
    assert.match(ROOM, /if\(typeof window\.metaUnleak==='function'\) m=window\.metaUnleak\(m\)\.meta;/, 'applyMetadata');
    assert.match(CORE, /return _repairMetadata\(_repairOwner\(/, 'migrateContract');
    assert.match(CORE, /Object\.assign\(c, full\); c\._loaded=true; c\._light=false; c\._v=full\._v;\s*_repairMetadata\(c\);/,
      'and the full record, which carries the metadata the light row did not');
    assert.match(APP, /import '\.\/metaclean\.js';/, 'loaded in the product');
  });
});

/* ===================== 2 · A LONG CONTRACT IS READ ===================== */
describe('f367 (2) Plain English reads a long contract in right-sized pages', () => {
  test('a page closes at READ_PAGE_CHARS of wording as well as READ_PAGE clauses', () => {
    assert.match(SERVER, /const READ_PAGE_CHARS = \d+;/);
    assert.match(SERVER, /pageText\(list\.slice\(at, end \+ 1\)\)\.length <= READ_PAGE_CHARS/);
  });
  test('[wall] the edition is no longer held to one call\'s character ceiling', () => {
    const route = SERVER.slice(SERVER.indexOf("app.post('/api/ai/readings'"), SERVER.indexOf("app.post('/api/ai/readings'") + 9000);
    assert.ok(!/const maxChars = aiDocChars\(\);/.test(route), 'no aiDocChars ceiling over the sum of pages');
    assert.match(SERVER, /const READ_MAX_PAGES = 40;/, 'what remains is a runaway guard');
  });
  test('a page cut short is asked again in two halves, once', () => {
    assert.match(SERVER, /g\.resp\.truncated && pg\.rows\.length > 1/);
    assert.match(SERVER, /const got = await askAll\(halves\);/);
  });
  test('an edition that could not finish is held, and its head says so', () => {
    assert.match(ROOM, /\|\|Number\(r\.readings\.over\)>0\|\|r\.readings\.truncated\)/, 'it lands instead of "nothing to say"');
    /* RE-POINTED IN PLACE (fix 6, 23 Sep 2026): a reading still RUNNING is
       held too — the column opens on the press and says how far it has got.
       The claim this was about, an edition that could not finish, is the
       same line. */
    assert.match(ROOM, /const docReadHeld=c=>docReadItems\(c\)\.length>0\|\|docReadUnmatched\(c\)>0\s*\|\|Number\(\(c&&c\._readings&&c\._readings\.over\)\|\|0\)>0\|\|docReadRunning\(c\);/);
  });
});

/* ===================== 3 · THE MAP SCROLLS ===================== */
describe('f367 (3) the X-ray map can be pressed on a long contract', () => {
  const seg = ROOM.slice(ROOM.indexOf('const XR_SEG_MIN'), ROOM.indexOf('function docXraySpineHtml('));
  test('every block has a height it can be pressed at, growing with its words', () => {
    assert.match(seg, /const XR_SEG_MIN = (\d+), XR_SEG_MAX = (\d+)/);
    const [, mn] = seg.match(/const XR_SEG_MIN = (\d+)/) || [];
    assert.ok(Number(mn) >= 14, 'no block below 14px');
    assert.match(ROOM, /style="height:\$\{docXraySegH\(x\.words\)\}px"/, 'a height, never a share of the screen');
  });
  test('the map scrolls on its own, and a block is never squeezed', () => {
    const rule = INDEX.slice(INDEX.indexOf('.doc-xr-spine{'), INDEX.indexOf('.doc-xr-spine{') + 500);
    assert.match(rule, /overflow-y:auto;/);
    assert.match(INDEX, /\.doc-xr-seg\{position:relative;flex:none;/);
  });
  test('the map follows the paper and keeps its place through a repaint', () => {
    assert.match(ROOM, /function docXrayFollow\(\)/);
    assert.match(ROOM, /scroller\.dataset\.xrFollowBound='1'/);
    assert.match(ROOM, /if\(keepTop\) sp\.scrollTop=keepTop;/);
    assert.match(INDEX, /\.doc-xr-seg\.is-here::before\{/);
  });
});

/* ===================== N · TWO DOORS ===================== */
describe('f367 (N) Draft new agreement opens two doors', () => {
  test('a person pressing the button meets the doors; every caller with options goes straight in', () => {
    assert.match(WIZ, /function openNewAgreement\(o\)\{\s*if\(o===undefined\) return openNewDoors\(\);/);
  });
  test('each door is the product\'s own act, never a second one', () => {
    const f = WIZ.slice(WIZ.indexOf('function openNewDoors('), WIZ.indexOf('function openNewAgreement('));
    assert.match(f, /if\(k==='draft'\) openNewAgreement\(\{ door:true \}\);/);
    assert.match(f, /openUploadModal\(\)/);
  });
  test('the separate Upload button is gone from the Contracts page', () => {
    assert.match(APP, /register: \['cohort', 'new'\],/);
  });
  test('both books carry the doors', () => {
    ['na_doors_title', 'na_door_draft', 'na_door_draft_sub', 'na_door_upload', 'na_door_upload_sub'].forEach(k =>
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k));
  });
});

/* ===================== 2, DRIVEN · THE REPORTED SHAPE ===================== */
const { before, after } = require('node:test');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('./helpers');
/* A contract of the owner's size: ~200 clauses of real commercial length —
   ~210,000 characters of wording, over the old whole-edition ceiling. */
const longClauses = n => Array.from({ length: n }, (_, k) => ({
  num: String(k + 1), heading: `${k + 1}. Clause ${k + 1}`, kind: 'clause',
  text: `Clause ${k + 1}. ` + 'The Supplier shall perform the Services with reasonable skill and care, in accordance with good industry practice and the Service Order. '.repeat(8),
}));
const answerPage = body => {
  const prompt = body.messages[0].content;
  const rows = [...prompt.matchAll(/\[(R\d{1,3})\] (?:CLAUSE|SECTION)[^\n]*\nheading: ([^\n]*)/g)]
    .map(m => ({ key: m[1], heading: m[2] }));
  return { content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings',
    input: { readings: rows.map(r => ({ key: r.key, heading: r.heading, plain: `In plain words: ${r.heading}.` })) } }] };
};
describe('f367 (2) driven: a 200-clause contract is read whole', () => {
  let h, ai, W;
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    for (const id of ['MK-F367-1', 'MK-F367-2']) await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
      id, name: 'Software as a Service Agreement', counterparty: 'nShift', folder: FOLDER_A, status: 'Under Review',
      format: 'rich', redlineText: '<h1>SaaS</h1><h2>1. Clause 1</h2><p>Words.</p>',
      fields: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], searchText: 'saas' } } });
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('every clause is read; no page is larger than READ_PAGE_CHARS; nothing is reported unread', async () => {
    ai.reset();
    ai.script(...Array.from({ length: 40 }, () => answerPage));
    const list = longClauses(200);
    const total = list.reduce((a, x) => a + x.text.length, 0);
    assert.ok(total > 200000, 'the stage is over the old whole-edition ceiling: ' + total);
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F367-1', clauses: list } });
    assert.equal(out.readings.items.length, 200, 'every clause has an entry');
    assert.equal(out.readings.over, 0, 'and nothing is left unread');
    const limit = Number((SERVER.match(/const READ_PAGE_CHARS = (\d+);/) || [])[1]);
    const sizes = ai.calls.map(c => (c.body.messages[0].content.split('THE CONTRACT:\n')[1] || '').length);
    assert.ok(sizes.every(n => n <= limit + 2000), 'no page is larger than a translation can answer: ' + Math.max(...sizes));
    assert.ok(!out.notice || !/shortened/.test(out.notice), 'and the reader is not told the input was shortened');
  });

  test('a page cut short is asked again in two halves, and the halves are kept', async () => {
    ai.reset();
    /* The first page comes back CUT SHORT with nothing in it; every call
       after that answers the page it was sent. */
    let first = true;
    ai.script(...Array.from({ length: 40 }, () => body => {
      if (first) { first = false; return { content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input: { readings: [] } }], stopReason: 'max_tokens' }; }
      return answerPage(body);
    }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F367-2', clauses: longClauses(20), force: true } });
    assert.equal(out.readings.items.length, 20, 'the cut-short page was re-asked in halves and every clause came back');
  });
});
