/* ============================================================
   f536 — PLAIN READS ONE CLAUSE AND ALWAYS ANSWERS; THE OPEN CLAUSE RISES
   TO THE TOP OF THE LIST (Young, 6 Oct 2026;
   docs/WORKORDER-plain-one-clause-and-the-list-glides.md)
   ============================================================
   "Hati keeps having a hard time translating a clause to plain english" ·
   "the translation is supposed to be one clause at a time only" · "there
   should never be an option to translate all clauses so please delete" ·
   "when i click on the next topic, it should go to the top pushing all the
   ones before it up the scroll so it is then the first one."

   (A) one clause asked, one answered: a heading copy one word off is not
       thrown away for a SHORT heading elsewhere in the contract;
   (B) the route refuses a whole-contract reading, and one naming two;
   (C) a press whose clause never got an answer fails WITH its reason, even
       where other clauses were read before;
   (D) the drawer: no "All N clauses" press; a row is marked only after a
       real ask, and says why;
   (E) the open row's head is brought to the top of the list on every change.
   Driven in a browser by test/chromium/thread-verify.js.

   Run: node --test test/f536-plain-one-clause-and-the-list-glides.test.js
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const CONTRACT = fs.readFileSync(path.join(ROOT, 'js', 'views', 'contract.js'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
const region = name => {
  const at = CONTRACT.search(new RegExp('(?:async )?function ' + name + '\\('));
  assert.ok(at > 0, name + ' is there');
  return CONTRACT.slice(at, CONTRACT.indexOf('\nfunction ', at + 10));
};
const tu = input => [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input }];

/* The screenshot's own clauses, with a short "Change of Control" heading the
   way a definitions clause carries one. */
const CL = [
  { num: '1.5', heading: '1.5 Change of Control', text: '"Change of Control" means a change in who controls a party.', kind: 'clause' },
  { num: '3.2', heading: '3.2 Termination for convenience', text: 'Maersk may terminate this Agreement for convenience on ninety (90) days notice.', kind: 'clause' },
  { num: '3.4', heading: '3.4 Termination for Change of Control.', text: 'If the Supplier undergoes a Change of Control, Maersk may terminate this Agreement with immediate effect and without penalty.', kind: 'clause' },
];

describe('f536 (A–C) the route reads one clause, and always answers', () => {
  let h, ai, W;
  const put = id => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
    id, name: 'Master Services Agreement', counterparty: 'Maersk', folder: FOLDER_A, status: 'Under Review',
    redlineText: '<p>x</p>', fields: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    for (const id of ['MK-F536-A0', 'MK-F536-A1', 'MK-F536-B', 'MK-F536-C']) await put(id);
  });
  after(async () => { await h.stop(); await ai.stop(); });

  ['3.4 Termination on Change of Control', 'Termination upon a Change of Control'].forEach((echo, n) => {
    test(`(A) THE OWNER'S REPORT: an echo reading "${echo}" lands on 3.4, the clause asked`, async () => {
      ai.reset();
      ai.script(tu({ readings: [{ key: 'R0', heading: echo, plain: 'If the supplier changes owner, Maersk can end the deal at once.' }] }));
      const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F536-A' + n, clauses: CL, only: [2] } });
      assert.equal(ai.calls.length, 1, 'Copilot was asked');
      const it = out.readings.items.find(x => x.i === 2);
      assert.ok(it && /changes owner/.test(it.plain), 'the reading lands — at the parent it was refused as a "shift" to 1.5');
      assert.ok(!(Number(out.readings.unmatched) > 0), 'and nothing is counted as unmatched');
      assert.ok(!out.readings.items.some(x => x.i === 0 && /changes owner/.test(x.plain)), 'never under 1.5');
    });
  });

  test('(B) a whole-contract reading is refused in words, and so is one naming two clauses — nothing spent', async () => {
    const before = ai.calls.length;
    for (const body of [{ id: 'MK-F536-B', clauses: CL }, { id: 'MK-F536-B', clauses: CL, only: [] }, { id: 'MK-F536-B', clauses: CL, only: [0, 2] }]) {
      const r = await W.admin.raw('/api/ai/readings', { method: 'POST', body });
      assert.equal(r.status, 400);
      assert.match(r.json.error, /one clause at a time/i);
      assert.equal(r.json.oneClause, true);
    }
    assert.equal(ai.calls.length, before);
  });

  test('(C) a press whose clause never got an answer fails with its reason, even where other clauses were read', async () => {
    ai.reset();
    ai.script(tu({ readings: [{ key: 'R0', heading: CL[1].heading, plain: 'Maersk can end it on 90 days notice.' }] }), () => 500, () => 500);
    await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F536-C', clauses: CL, only: [1] } });
    const r = await W.admin.raw('/api/ai/readings', { method: 'POST', body: { id: 'MK-F536-C', clauses: CL, only: [2] } });
    assert.equal(r.status, 502, 'the press failed — at the parent it came back 200 and the row said nothing of why');
    assert.ok(r.json && r.json.error);
  });
});

describe('f536 (D) the drawer: one clause, a mark only after a real ask, and why', () => {
  const THREAD = code(CONTRACT);
  test('no "All N clauses in plain English" press, and its sheet rule is gone', () => {
    assert.ok(!/data-th-explain-all/.test(THREAD));
    assert.ok(!/th_plain_all/.test(code(region('docThreadExplainHtml'))));
    assert.ok(!/\.doc-th-all\{/.test(INDEX));
  });
  test('docReadRun makes no press that names no clause, or several', () => {
    assert.match(region('docReadRun'), /if\(!only\|\|only\.length!==1\) return false;/);
  });
  test('the press reports whether it really asked, and why it got nothing', () => {
    const run = region('docReadRun');
    assert.match(run, /if\(out\)\{ out\.asked=true; out\.why=''; \}/);
    assert.ok(run.indexOf('out.asked=true') > run.indexOf('if(!only||only.length!==1) return false;'), 'raised only past every early return');
    assert.ok(run.indexOf('out.asked=true') > run.indexOf('if(_docReadJobs.get(id)) return false;'));
    assert.match(region('docThreadWire'), /if\(out\.asked\) docThreadCannotMark\(now,\[i\],out\.why\|\|'empty'\);/);
  });
  test('four reasons, in both books', () => {
    for (const k of ['th_cannot_empty', 'th_cannot_noai', 'th_cannot_limit', 'th_cannot_failed'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ': ', 'gm')) || []).length, 2, k);
  });
});

describe('f536 (E) the open clause rises to the top of the list', () => {
  test('every change of open row brings its head to the list\'s top — not only when it was out of sight', () => {
    const fill = code(region('docThreadFill'));
    assert.ok(!/box\.clientHeight-120/.test(fill), 'the "only when out of sight" test is gone');
    assert.ok(!/top-40/.test(fill), 'and so is the 40px drop below the top');
    assert.match(fill, /const to=Math\.max\(0,Math\.round\(box\.scrollTop\+r\.getBoundingClientRect\(\)\.top-box\.getBoundingClientRect\(\)\.top-pad\)\);/);
    assert.match(fill, /if\(i===_docThreadRevealed&&!o\.reveal\) return;/, 'a reading landing in the same row still moves nothing');
  });
});
