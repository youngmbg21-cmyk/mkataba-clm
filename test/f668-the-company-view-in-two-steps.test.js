/* f668 — THE COMPANY VIEW IN TWO STEPS (owner, 13 Oct 2026: "the loading is
   taking too long and ruining the user experience"; picked "Two steps")

   1. Opening Clauses asks Jambo only for the LIST — the sections and, per
      point, its title, severity, section, one line and its key words — on the
      FAST model, with a small answer allowance. None of the deep dive's
      sections is asked for there.
   2. A point's deep dive is its own small read, POST /api/ai/breakdown/point,
      on the press of Deep dive: it names the one point, and answers only the
      dive's sections.

   Read off what the stand-in RECEIVED — the only honest record of what the
   model was asked. Run: node --test test/f668-the-company-view-in-two-steps.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, startScriptedAi, seedWorkspace, FIXTURES } = require('./helpers');

const TEXT = '1. Term. This agreement runs for two years. '.repeat(8)
  + '2. Liability. Liability is capped at the fees paid in the last three months. '.repeat(6);

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h, { contracts: FIXTURES });
});
after(async () => { await h.stop(); await ai.stop(); });

describe('f668 (1) — the list read is quick', () => {
  test('it asks the fast model for the list only, with a small allowance', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu', name: 'break_down', input: {
      regions: [{ name: 'Risk', status: 'need', items: [{ ref: '2' }] }],
      points: [{ clause: '2', region: 1, status: 'need', title: 'Their liability is capped at three months', stake: 'A failure could cost us far more than the cap.',
        quote: 'Liability is capped at the fees paid in the last three months.' }] } }]);
    const r = await W.admin.json('/api/ai/breakdown', { method: 'POST', body: { text: TEXT } });
    assert.equal(r.regions.length, 1, 'the sections come back');
    assert.equal(r.points.length, 1, 'and the point');
    assert.equal(r.points[0].stake, 'A failure could cost us far more than the cap.');
    const sent = ai.calls[ai.calls.length - 1].body;
    const tool = (sent.tools || []).find(t => t.name === 'break_down');
    const pt = tool.input_schema.properties.points.items.properties;
    for (const gone of ['what', 'theirs', 'usual', 'figure', 'how', 'push', 'edge', 'trade', 'ask'])
      assert.ok(!(gone in pt), `the list does not ask for the dive's "${gone}"`);
    const rg = tool.input_schema.properties.regions.items.properties;
    for (const gone of ['sentence', 'meaning', 'fix', 'quotes'])
      assert.ok(!(gone in rg), `nor for a section's "${gone}"`);
    assert.ok(sent.max_tokens <= 6000, 'a small answer allowance, not ' + sent.max_tokens);
    assert.ok(/haiku/i.test(sent.model), 'the fast model, not ' + sent.model);
  });
});

describe('f668 (2) — a point\'s deep dive is its own read', () => {
  test('it names the one point and answers only the dive', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu', name: 'dive_point', input: {
      what: 'A single failure could cost us far more than the cap.', theirs: 'Three months of fees.', usual: 'Twelve months of fees.',
      figure: '', how: 'No figure in the wording.', push: 'They will say the fees are small.', edge: ['Ask for a mutual cap.'],
      trade: [{ give: 'Accept twelve months', get: 'Data breach outside the cap' }], ask: 'Liability shall not exceed twelve months of fees.' } }]);
    const r = await W.admin.json('/api/ai/breakdown/point', { method: 'POST', body: { text: TEXT,
      point: { title: 'Their liability is capped at three months', clause: '2', stake: 'A failure could cost us far more than the cap.', quote: 'Liability is capped' } } });
    assert.equal(r.usual, 'Twelve months of fees.');
    assert.deepEqual(r.edge, ['Ask for a mutual cap.']);
    assert.equal(r.trade.length, 1);
    const sent = ai.calls[ai.calls.length - 1].body;
    const prompt = JSON.stringify(sent.messages);
    assert.match(prompt, /POINT: Their liability is capped at three months/, 'the one point is named');
    assert.match(prompt, /CLAUSE: 2/);
    assert.ok(sent.max_tokens <= 2000, 'a small answer allowance');
  });
  test('a press without a point is refused, and spends nothing', async () => {
    ai.reset();
    const r = await W.admin.json('/api/ai/breakdown/point', { method: 'POST', body: { text: TEXT } }).catch(e => e);
    assert.equal(ai.calls.length, 0, 'nothing was asked of the model');
    assert.ok(r && (r.error || r.status === 400 || /point is required/.test(String(r.message || ''))), 'refused: ' + JSON.stringify(r));
  });
});

/* f668 (3) — IN THE READER'S LANGUAGE, IN PLAIN WORDS (owner, 15 Oct 2026:
   "Make the deep dive answer in the reader's language. Give it the same
   fuller plain-English rules the clause reading uses"). Both reads are asked
   in the caller's own language and carry the Plain English edition's shared
   lines; each answer says the language it was written in, so the browser
   keeps it only for a reader of that language. */
describe('f668 (3) — the reader\'s language, and the plain words', () => {
  const LIST = { type: 'tool_use', id: 'tu', name: 'break_down', input: {
    regions: [{ name: 'Risk', status: 'need', items: [{ ref: '2' }] }],
    points: [{ clause: '2', region: 1, status: 'need', title: 'Capped liability', stake: 'A failure could cost us more.' }] } };
  const DIVE = { type: 'tool_use', id: 'tu', name: 'dive_point', input: { what: 'Det kan kosta oss mer.', usual: 'Tolv månader.' } };
  const POINT = { title: 'Capped liability', clause: '2', stake: 'A failure could cost us more.' };
  const setLang = lang => W.admin.json('/api/me/lang', { method: 'PUT', body: { lang } });
  after(() => setLang('en'));
  const promptOf = () => JSON.stringify(ai.calls[ai.calls.length - 1].body.messages);

  test('a Swedish reader is answered in Swedish, on both reads', async () => {
    await setLang('sv');
    ai.reset(); ai.script([LIST]);
    const r = await W.admin.json('/api/ai/breakdown', { method: 'POST', body: { text: TEXT } });
    assert.equal(r.lang, 'sv', 'the list says the language it was written in');
    assert.match(promptOf(), /WRITE EVERYTHING IN Swedish, whatever language the contract itself is written in/);
    ai.reset(); ai.script([DIVE]);
    const d = await W.admin.json('/api/ai/breakdown/point', { method: 'POST', body: { text: TEXT, point: POINT } });
    assert.equal(d.lang, 'sv', 'and so does the dive');
    assert.match(promptOf(), /WRITE EVERYTHING IN Swedish/);
  });
  test('an English reader is answered in English', async () => {
    await setLang('en');
    ai.reset(); ai.script([DIVE]);
    const d = await W.admin.json('/api/ai/breakdown/point', { method: 'POST', body: { text: TEXT, point: POINT } });
    assert.equal(d.lang, 'en');
    assert.match(promptOf(), /WRITE EVERYTHING IN English/);
  });
  test('the contract\'s own words are never translated', async () => {
    ai.reset(); ai.script([DIVE]);
    await W.admin.json('/api/ai/breakdown/point', { method: 'POST', body: { text: TEXT, point: POINT } });
    assert.match(promptOf(), /never translated: the key words you quote, clause numbers, and any wording meant to go into the contract/);
    const ask = ai.calls[ai.calls.length - 1].body.tools.find(t => t.name === 'dive_point').input_schema.properties.ask.description;
    assert.match(ask, /in the contract's own language and style/, 'the wording we would ask for is the contract\'s');
  });
  test('both reads carry the Plain English edition\'s own lines, said once in one home', async () => {
    const SRC = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'server', 'server.js'), 'utf8');
    const whom = /const PLAIN_FOR_WHOM = '([^']+)'/.exec(SRC), tone = /const PLAIN_TONE = '([^']+)'/.exec(SRC);
    assert.ok(whom && tone, 'the shared lines have one home');
    for (const [route, call] of [['/api/ai/breakdown', LIST], ['/api/ai/breakdown/point', DIVE]]){
      ai.reset(); ai.script([call]);
      await W.admin.json(route, { method: 'POST', body: { text: TEXT, point: POINT } });
      const p = JSON.parse(promptOf())[0].content;
      assert.ok(p.includes(whom[1]), route + ': written for somebody with no lawyer, everyday words');
      assert.ok(p.includes(tone[1]), route + ': plain, not chatty');
      assert.match(p, /KEEP EVERY FIGURE the wording states/, route + ': the figures kept, in plain words');
      assert.match(p, /Call our own side "we" and "us"/, route + ': our side as the headings call it');
    }
    assert.doesNotMatch(SRC, /Short plain English for a non-lawyer/, 'the old one-line ask is gone');
  });
  test('the browser keeps a reading only for a reader of its language', () => {
    const BD = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'views', 'breakdown.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const bdOf = BD.slice(BD.indexOf('function bdOf'), BD.indexOf('function bdStale'));
    assert.match(bdOf, /\(b\.lang \|\| 'en'\) === bdLang\(\)/, 'a reading in another language is not this reader\'s');
    assert.match(BD, /live\.breakdown = \{ ok: true, hash: bdHash\(live\), lang: r\.lang \|\| 'en'/, 'the reading keeps the language it came back in');
    assert.match(BD, /const stkKey = c => String\(c && c\.id\) \+ ':' \+ bdHash\(c\) \+ ':' \+ bdLang\(\);/, 'a language switch may read again in the same sitting');
  });
});

/* f668 (4) — A BLANK CLAUSE IS NOT A MISSING ONE (the owner, 21 Oct 2026:
   "there is a bug where some clause 2 is missing")

   The schema had two states only — in the contract, or not in it at all — so
   a NUMBERED CLAUSE LEFT EMPTY came back as missing, had its number wiped,
   and was filed above the clause under "After §1 — not in the contract":
   words that were untrue, because clause 2 IS in the contract; its wording is
   not. `blank` is the third state: the clause's number is kept, the point is
   not missing, and it lands ON that clause's row. A blank with no number to
   stand on has nowhere to go, so it falls back to missing rather than being
   guessed at. */
describe('f668 (4) — the clause is there and says nothing', () => {
  const list = pts => ({ type: 'tool_use', id: 'tu', name: 'break_down', input: {
    regions: [{ name: 'Term and exit', status: 'need', items: [{ ref: '2' }] }], points: pts } });
  const read = async pts => { ai.reset(); ai.script([list(pts)]);
    return (await W.admin.json('/api/ai/breakdown', { method: 'POST', body: { text: TEXT } })).points[0]; };

  test('the reading may say a clause is blank, and the tool offers that state', async () => {
    const p = await read([{ clause: '2', region: 1, status: 'need', blank: true, title: 'Clause 2 is blank',
      stake: 'No notice period, exit terms or renewal dates.' }]);
    assert.equal(p.blank, true, 'the state travels');
    assert.equal(p.missing, false, 'a blank clause is NOT a missing point');
    assert.equal(p.clause, '2', 'and it keeps its number, so it can land on that clause');
    const tool = (ai.calls[ai.calls.length - 1].body.tools || []).find(t => t.name === 'break_down');
    const pt = tool.input_schema.properties.points.items.properties;
    assert.ok('blank' in pt, 'the schema has the third state');
    assert.match(pt.blank.description, /has no wording under it/);
    assert.match(JSON.stringify(ai.calls[ai.calls.length - 1].body.messages), /NUMBERED CLAUSE IS IN THE CONTRACT BUT LEFT EMPTY/, 'and the ask says when to use it');
  });
  test('a missing point is still a missing point, and keeps the clause it would follow', async () => {
    const p = await read([{ after: '1', region: 1, status: 'look', missing: true, title: 'No service levels anywhere',
      stake: 'Nothing says how late a load may be.' }]);
    assert.equal(p.missing, true);
    assert.equal(p.blank, false);
    assert.equal(p.clause, '');
    assert.equal(p.after, '1');
  });
  test('a blank with no clause to stand on falls back to missing, never guessed', async () => {
    const p = await read([{ clause: '', after: '1', region: 1, status: 'need', blank: true, title: 'Something is blank',
      stake: 'There is nowhere to put this.' }]);
    assert.equal(p.blank, false, 'it cannot be blank with no clause named');
    assert.equal(p.missing, true, 'so it is a missing point, which has a home');
  });
  test('the dive is told the clause says nothing', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu', name: 'dive_point', input: { what: 'There is no way out.', usual: 'A notice period.' } }]);
    await W.admin.json('/api/ai/breakdown/point', { method: 'POST', body: { text: TEXT,
      point: { title: 'Clause 2 is blank', clause: '2', stake: 'No notice period.', missing: false, blank: true } } });
    const prompt = JSON.stringify(ai.calls[ai.calls.length - 1].body.messages);
    assert.match(prompt, /Clause 2 is in the contract but has NO wording under it/, 'or it would be asked about wording that is not there');
    assert.doesNotMatch(prompt, /does NOT say/, 'and it is not called a missing point');
  });
  test('the browser passes that state on, and the walk of the paper draws such a clause as a clause', () => {
    const fsx = require('node:fs'), px = require('node:path');
    const BD = fsx.readFileSync(px.join(__dirname, '..', 'js', 'views', 'breakdown.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(BD, /blank: !!p\.blank/, 'the dive request carries it');
    const CT = fsx.readFileSync(px.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(CT, /const blankNumbered=row\.isHead&&!text&&!!cite\s+&&_docReadNumNext\(cite,_docReadRowNum\(rows\[i\+1\]\)\)\s+&&!DOC_READ_SELF_HEAD\.test\(_docReadHeadCut\(heading\)\.rest\)/,
      'a bodiless numbered heading the numbering carries straight on past, which does not name itself a part');
    assert.match(CT, /kind:\(row\.isHead&&!text&&!blankNumbered\)\?'section':'clause'/, 'is a clause row, not a section title');
  });
});
