/* ============================================================
   f373 — PLAIN ENGLISH READS IN THE BACKGROUND, A CLAUSE AT A TIME
   (fix 6, Young's go on the preview, 23 Sep 2026)
   ============================================================
   "On a long contract, one press tries to translate everything in one go, and
    nothing is kept until the very end — so one problem loses the lot."

   What the owner approved, and what each section below holds:
     1. each clause is saved the moment it is read — a press after a failure
        asks only for what is missing;
     2. when one clause changes, only that clause is read again;
     3. a page that failed is asked again, once — only that page;
     4. the reading is a job at the server: a second press JOINS it, and the
        column can ask how far it has got while it runs;
     5. a cut-short answer and a doubtful page are shown and never kept;
     6. the readings kept for a contract go with it when it is deleted;
     7. the page opens the column on the press and fills it as it is read.

   Every claim is asked of the real route with a stand-in provider; the
   browser half is asked of its source, and driven in
   test/chromium/reading-in-the-background-verify.js.

   Run: node --test test/f373-plain-english-in-the-background.test.js
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
const ROOM = fs.readFileSync(path.join(ROOT, 'js', 'views', 'contract.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

const clauses = (n, tag = '') => Array.from({ length: n }, (_, k) => ({
  num: String(k + 1),
  heading: `${k + 1}. Clause ${k + 1}`,
  text: `The parties agree the ${k + 1}th thing${tag}, in wording long enough to be worth reading.`,
  kind: 'clause',
}));

/* The stand-in reads the page it was sent, exactly as the provider does. */
const rowsOf = body => [...String(body.messages[0].content).matchAll(/\[(R\d{1,3})\] (?:CLAUSE|SECTION)[^\n]*\nheading: ([^\n]*)/g)]
  .map(m => ({ key: m[1], heading: m[2] }));
const answerPage = body => ({ content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings',
  input: { readings: rowsOf(body).map(r => ({ key: r.key, heading: r.heading, plain: `In plain words: ${r.heading}.` })) } }] });
const sentOf = call => String(call.body.messages[0].content).split('THE CONTRACT:\n')[1] || '';
const dead = () => 500;

describe('f373 (1–3, 5–6) the route keeps every clause as it is read', () => {
  let h, ai, W;
  const put = (id, folder = FOLDER_A) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
    id, name: 'Master Services Agreement', counterparty: 'Nordvane', folder,
    status: 'Under Review', format: 'rich', redlineText: '<h1>Master Services</h1><h2>1. Clause 1</h2><p>Words.</p>',
    fields: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], searchText: 'services',
  } } });

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    for (const id of ['MK-F373-1', 'MK-F373-2', 'MK-F373-3', 'MK-F373-4', 'MK-F373-5', 'MK-F373-6']) await put(id);
  });
  after(async () => { await h.stop(); await ai.stop(); });

  /* RE-POINTED 6 Oct 2026 (Young: "the translation is supposed to be one
     clause at a time only" / "there should never be an option to translate
     all clauses"): every press names ONE clause, so each claim below is asked
     one clause at a time. (5b), a page of several more than a quarter
     misfiled, is RETIRED IN PLACE — no page holds several rows any more. */
  const ask = (id, list, k, extra) => W.admin.json('/api/ai/readings', { method: 'POST', body: { id, clauses: list, only: [k], ...(extra || {}) } });

  test('(1) THE REPORT: a press that fails loses nothing already read, and the next press asks only for the clause asked', async () => {
    ai.reset();
    const list = clauses(130);
    ai.script(answerPage, dead, dead);
    await ask('MK-F373-1', list, 0);
    const r = await W.admin.raw('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-1', clauses: list, only: [61] } });
    assert.equal(r.status, 502, 'the failed press says so');
    ai.reset();
    ai.script(answerPage);
    const second = await ask('MK-F373-1', list, 61);
    assert.equal(ai.calls.length, 1, 'one call');
    assert.equal(rowsOf(ai.calls[0].body).length, 1, 'carrying ONE clause');
    assert.ok(/CLAUSE 62\n/.test(sentOf(ai.calls[0])), 'the one asked');
    assert.deepEqual(second.readings.items.map(x => x.i), [0, 61], 'and what was read before is still there');
  });

  test('(2) when one clause changes, only that clause is read again', async () => {
    ai.reset();
    ai.script(answerPage, answerPage);
    const list = clauses(80);
    await ask('MK-F373-2', list, 41);
    await ask('MK-F373-2', list, 0);
    assert.equal(ai.calls.length, 2);
    ai.reset();
    ai.script(answerPage);
    const moved = list.slice(); moved[41] = { ...moved[41], text: moved[41].text + ' As amended by the parties.' };
    const again = await ask('MK-F373-2', moved, 41);
    assert.equal(ai.calls.length, 1, 'one call');
    assert.equal(rowsOf(ai.calls[0].body).length, 1, 'carrying ONE clause');
    assert.ok(/CLAUSE 42\n/.test(sentOf(ai.calls[0])) && /As amended by the parties/.test(sentOf(ai.calls[0])), 'the one that moved');
    assert.equal(again.readings.items.find(x => x.i === 0).plain, 'In plain words: 1. Clause 1.',
      'and the clause read before came out of what was kept');
  });

  test('(3) a press whose first ask failed is asked again once, and lands', async () => {
    ai.reset();
    ai.script(dead, answerPage);
    const out = await ask('MK-F373-3', clauses(80), 9);
    assert.deepEqual(out.readings.items.map(x => x.i), [9], 'the clause came back');
    assert.equal(ai.calls.length, 2, 'on the second ask');
  });

  test('(5a) an answer cut short is shown and never kept: the next press asks for it again', async () => {
    ai.reset();
    const one = [{ num: '1', heading: '1. Scope', text: 'The Supplier shall supply the goods set out in each purchase order.', kind: 'clause' }];
    ai.script({ content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings',
      input: { readings: [{ key: 'R0', heading: '1. Scope', plain: 'The supplier provides the goods in each ord' }] } }], stopReason: 'max_tokens' });
    const out = await ask('MK-F373-4', one, 0);
    assert.equal(out.readings.truncated, true, 'the reader is told it was cut short');
    assert.equal(out.readings.items.length, 1, 'what came back is still shown');
    ai.reset();
    ai.script(answerPage);
    await ask('MK-F373-4', one, 0);
    assert.equal(ai.calls.length, 1, 'the half sentence was never kept, so the next press asks for it again');
  });

  test('(5b) RETIRED IN PLACE: a press for several clauses — the only way a page could be misfiled — is refused', async () => {
    const r = await W.admin.raw('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-5', clauses: clauses(4), only: [0, 1, 2, 3] } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /one clause at a time/i);
  });

  test('(5c) a clause answered empty twice is said, kept nowhere, and the next press asks for it again', async () => {
    ai.reset();
    const four = clauses(4, ' again');
    const empty = { content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input: { readings: [{ key: 'R0', heading: four[2].heading, plain: '' }] } }] };
    ai.script(empty, empty);
    const out = await ask('MK-F373-6', four, 2);
    assert.equal(out.readings.unmatched, 1, 'the clause could not be read, and it is counted');
    ai.reset();
    ai.script(answerPage);
    const again = await ask('MK-F373-6', four, 2);
    assert.equal(ai.calls.length, 1, 'the next press asks for it');
    assert.deepEqual(again.readings.items.map(x => x.i), [2], 'and it lands');
  });

  /* [control] — passes at the parent too, where nothing was kept to be left
     behind; (6b) is the claim that fails there. */
  test('(6) [control] the readings kept for a contract go with it', async () => {
    ai.reset();
    const del = await W.admin.raw('/api/contracts/MK-F373-2', { method: 'DELETE' });
    assert.ok(del.status < 300, 'the contract was deleted: ' + del.status);
    await put('MK-F373-2');
    ai.script(answerPage);
    await ask('MK-F373-2', clauses(80), 0);
    assert.equal(ai.calls.length, 1, 'a new contract under the old number is read from the start — nothing of the old one was left behind');
  });

  test('(6b) the route is where every one of these readings is written, and the delete clears them', () => {
    const c = code(SERVER);
    assert.match(c, /CREATE TABLE IF NOT EXISTS clause_reading_rows \(/);
    assert.match(c, /DELETE FROM clause_reading_rows WHERE contract_id=\?/);
    assert.match(c, /INSERT OR IGNORE INTO clause_reading_rows/, 'a clause already kept is never rewritten');
    assert.equal((c.match(/INTO clause_reading_rows/g) || []).length, 1, 'one writer');
  });
});

/* ===================== 4 · A JOB, JOINED, AND ASKED HOW FAR IT HAS GOT ===================== */
describe('f373 (4) the reading is a job the column can watch', () => {
  let h, W, prov;
  const calls = [];
  const gate = { hold: null };
  before(async () => {
    /* A stand-in that holds the page carrying clause 61 until the test lets it
       go, so a reading can be caught half way. */
    prov = await new Promise(resolve => {
      const srv = http.createServer((req, res) => {
        let raw = ''; req.on('data', d => { raw += d; });
        req.on('end', () => {
          let body = {}; try { body = JSON.parse(raw); } catch (_) {}
          calls.push(body);
          const reply = () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: 'stub',
              content: answerPage(body).content, usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: 'end_turn' }));
          };
          if (/CLAUSE 61\n/.test(String(body.messages && body.messages[0] && body.messages[0].content)) && gate.hold)
            gate.hold.then(reply); else reply();
        });
      });
      srv.listen(0, '127.0.0.1', () => resolve({ base: 'http://127.0.0.1:' + srv.address().port, stop: () => new Promise(r => srv.close(r)) }));
    });
    h = await startHati({ ANTHROPIC_BASE_URL: prov.base });
    W = await seedWorkspace(h, { contracts: [] });
    for (const [id, folder] of [['MK-F373-J', FOLDER_A], ['MK-F373-K', FOLDER_B]])
      await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
        id, name: 'Long agreement', counterparty: 'Nordvane', folder, status: 'Under Review', format: 'rich',
        redlineText: '<h1>Long</h1><h2>1. Clause 1</h2><p>Words.</p>', fields: {}, obligations: [], audit: [],
        rounds: [], versions: [], signatures: [], comments: [], searchText: 'long' } } });
  });
  after(async () => { await h.stop(); await prov.stop(); });

  /* RE-POINTED 6 Oct 2026 (one clause at a time): the job is one clause's
     reading; while it is held the column is told it is running and handed
     what is already kept, and a second press on the same clause JOINS it. */
  test('while a clause is being read, the column is told it is running; a second press joins it', async () => {
    calls.length = 0;
    const list = clauses(130);
    await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-J', clauses: list, only: [0] } });
    let release; gate.hold = new Promise(r => { release = r; });
    const run = 'f373run0000000001';
    const pending = W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-J', clauses: list, only: [60], run } });
    let p = null;
    for (let k = 0; k < 40; k++) {
      await new Promise(r => setTimeout(r, 50));
      p = await W.admin.json('/api/contracts/MK-F373-J/reading-progress?run=' + run + '&from=0');
      if (p && p.known && calls.length >= 2) break;
    }
    assert.equal(p.running, true, 'it is still running');
    assert.equal(p.total, 130, 'it knows how many clauses the contract has');
    assert.deepEqual(p.items.map(it => it.i), [0], 'and hands over what is already kept, by its place in the whole contract');
    const again = await W.admin.json('/api/contracts/MK-F373-J/reading-progress?run=' + run + '&from=' + p.next);
    assert.equal(again.items.length, 0, 'nothing new yet');

    const joined = W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-J', clauses: list, only: [60], run: 'f373run0000000002' } });
    await new Promise(r => setTimeout(r, 150));
    const asked = calls.length;
    release();
    const [a, b] = await Promise.all([pending, joined]);
    assert.ok(a.readings.items.some(x => x.i === 60), 'the clause is read');
    assert.ok(b.readings.items.some(x => x.i === 60), 'and the second press gets the same reading');
    assert.equal(calls.length, asked, 'without one more call');
    assert.equal(calls.length, 2, 'two calls in all: clause 1, then clause 61 once for two presses');
    const done = await W.admin.json('/api/contracts/MK-F373-J/reading-progress?run=' + run + '&from=' + p.next);
    assert.equal(done.running, false, 'and the column is told it has finished');
    assert.deepEqual(done.items.map(it => it.i), [60], 'with the entry it had not yet been handed');
    gate.hold = null;
  });

  test('a press nobody made, or on a contract the reader cannot open, is told nothing', async () => {
    const none = await W.admin.json('/api/contracts/MK-F373-J/reading-progress?run=nobody0000000000&from=0');
    assert.equal(none.running, false);
    assert.equal(none.known, false, 'an unknown press is not somebody else\'s reading');
    const out = await W.restricted.raw('/api/contracts/MK-F373-K/reading-progress?run=f373run0000000001&from=0');
    assert.equal(out.status, 404, 'out of scope reads exactly like does not exist');
  });

  test('[wall] asking how far it has got spends nothing and passes no spending guard', () => {
    const c = code(SERVER);
    const m = c.match(/app\.get\('\/api\/contracts\/:id\/reading-progress', ([^\n]*)\(req, res\)/);
    assert.ok(m, 'the route is there');
    assert.ok(!/rlAiDeep|aiBudgetGuard|aiFeature|capAiInput/.test(m[1]), 'no AI limiter and no spend guard: ' + m[1]);
    const at = c.indexOf("app.get('/api/contracts/:id/reading-progress'");
    const body = c.slice(at, c.indexOf('\n});', at));
    assert.ok(!/anthropicMessages|db\.prepare\([^)]*(?:INSERT|UPDATE|DELETE)/.test(body), 'it asks no model and writes nothing');
    assert.match(body, /inScope\(folderScopeFor\(req\.user\), row\.folder\)/, 'and it asks the reader\'s scope first');
  });
});

/* ===================== 7 · THE PAGE OPENS THE COLUMN AND FILLS IT ===================== */
describe('f373 (7) the column opens on the press and fills as it is read', () => {
  const region = name => {
    const at = ROOM.search(new RegExp('(?:async )?function ' + name + '\\('));
    assert.ok(at > 0, name + ' is there');
    return ROOM.slice(at, ROOM.indexOf('\nfunction ', at + 10));
  };
  test('the thread is up before the reading, so the reader watches it arrive', () => {
    /* RE-POINTED 5 Oct 2026 (the Thread): there is no switch to set; the
       row says Reading… the moment the press lands, and a reader who moved
       on is not repainted over. */
    const r = region('docReadRun');
    assert.ok(r.indexOf('if(docReadWatching(id)) docThreadPaint(c);') < r.indexOf("api('ai/readings','POST'"), 'the row says Reading… first');
    const w = region('docThreadWire');
    /* RE-POINTED 5 Oct 2026 (Plain never ends in silence): the row is marked
       when it is still unread, then painted — still only where the reader is. */
    /* RE-POINTED 6 Oct 2026: marked only after a press that REALLY asked
       (`out.asked`), and with the reason it came back with (`out.why`). */
    assert.match(w, /finally\{\n\s*ex\.disabled=false;\n\s*const now=docThreadCur\(cur\);\n\s*if\(docReadWatching\(now\.id\)\)\{ if\(out\.asked\) docThreadCannotMark\(now,\[i\],out\.why\|\|'empty'\); docThreadPaint\(now\); \}/,
      'and a reader who moved on while it read keeps what they chose');
  });
  /* RE-POINTED 6 Oct 2026: there is no whole reading any more — a press that
     names no clause, or several, is not made; a clause press waits for one
     already running. */
  test('one press per contract: one clause only; a clause press waits for one already running', () => {
    const r = region('docReadRun');
    assert.match(r, /if\(!only\|\|only\.length!==1\) return false;/, 'one clause, only');
    assert.match(r, /try\{ await busy\.promise; \}catch\(_\)\{\}/, 'a clause not in the run that is running waits its turn');
    assert.match(r, /run:job\.run/, 'the press carries its own name, so progress is about THIS reading');
    assert.match(r, /only\?\{only\}:\{\}/, 'and names the rows it wants, by their place in the whole walk');
  });
  test('the column asks how far it has got only while somebody is looking', () => {
    const p = region('docReadPoll');
    assert.match(p, /if\(!always&&!docReadWatching\(id\)\) return null;/);
    assert.match(p, /reading-progress\?run=/);
    /* RE-POINTED 10 Oct 2026 (Home's Paper clauses work order): the thread has two homes (TH_HOSTS); a row the scroll opens opens in one step ({follow:true}). */
    assert.match(ROOM, /const docReadWatching=id=>\(state\.view==='workspace'&&state\.activeId===id&&_wsTab==='docs'&&docReadOn\(\)\)\n  \|\|\(thOnHome\(\)&&thHomeLive\(\)&&/);
  });
  test('the open row says "Reading N of M" in its own line, never a band', () => {
    const p = region('docThreadProgress');
    assert.match(p, /i18t\('ct_read_progress',\{n:Number\(r\.done\),m:Number\(r\.total\)\}\)/);
    assert.match(region('docThreadBodyHtml'), /class="doc-th-wait">\$\{esc\(docThreadProgress\(c\)\)\}/);
    assert.equal((I18N.match(/ct_read_progress: '/g) || []).length, 2, 'in both books');
    assert.match(I18N, /ct_read_progress: 'Reading \{n\} of \{m\}'/);
  });
  test('a clause still to come says so on its row, with a class of its own', () => {
    const p = region('docThreadStates');
    assert.match(p, /class="is-wait">\$\{esc\(i18t\('ct_read_reading'\)\)\}/);
    assert.match(p, /\(!_docThreadOnly\|\|_docThreadOnly\.has\(i\)\)/, 'only the rows this press asked for');
    assert.match(INDEX, /\.doc-th-state \.is-wait\{/, 'and the sheet dresses it');
  });
  test('a connection that drops is not a reading that stopped: the page waits for the server, then asks once more', () => {
    const r = region('docReadRun');
    assert.match(r, /if\(!err\|\|err\.status\) break;/, 'an answer, or a refusal the server gave, ends it');
    assert.match(r, /p=await docReadPoll\(id,job,true\);/, 'otherwise it waits on the server\'s own progress');
    assert.match(r, /DOC_READ_WAIT_MS/, 'but not for ever');
  });
  test('nothing arrived: whatever the column held before the press is put back', () => {
    const r = region('docReadRun');
    assert.match(r, /if\(job\.prev\) c\._readings=job\.prev; else delete c\._readings;/);
  });
});
