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

  test('(1) THE REPORT: a page that fails no longer loses the pages that came back — they are kept, and the next press asks only for what is missing', async () => {
    ai.reset();
    /* Two pages of sixty and one of ten. The middle one fails, and fails again
       when it is asked the second time. */
    ai.script(answerPage, dead, answerPage, dead);
    const first = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-1', clauses: clauses(130) } });
    /* AT THE PARENT the 70 that came back were handed over and thrown away:
       nothing was kept, and the next press sent all 130 again. */
    assert.equal(first.readings.items.length, 70, 'what came back is handed over');
    assert.equal(first.readings.over, 60, 'and what did not is counted');
    ai.reset();
    ai.script(answerPage, answerPage, answerPage);
    const second = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-1', clauses: clauses(130) } });
    assert.equal(second.readings.items.length, 130, 'the second press makes the edition whole');
    const sent = ai.calls.map(sentOf).join('\n');
    assert.equal(ai.calls.length, 1, 'with ONE call — the sixty that failed, and nothing else');
    assert.ok(/CLAUSE 61\n/.test(sent) && /CLAUSE 120\n/.test(sent), 'the missing sixty were sent');
    assert.ok(!/CLAUSE 1\n/.test(sent) && !/CLAUSE 130\n/.test(sent), 'the seventy already read were not');
  });

  test('(2) when one clause changes, only that clause is read again', async () => {
    ai.reset();
    ai.script(answerPage, answerPage);
    const list = clauses(80);
    await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-2', clauses: list } });
    assert.equal(ai.calls.length, 2, 'the first reading is two pages');
    ai.reset();
    ai.script(answerPage);
    const moved = list.slice(); moved[41] = { ...moved[41], text: moved[41].text + ' As amended by the parties.' };
    const again = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-2', clauses: moved } });
    assert.equal(ai.calls.length, 1, 'one call');
    const sent = sentOf(ai.calls[0]);
    assert.equal(rowsOf(ai.calls[0].body).length, 1, 'carrying ONE clause');
    assert.ok(/CLAUSE 42\n/.test(sent) && /As amended by the parties/.test(sent), 'the one that moved');
    assert.equal(again.readings.items.length, 80, 'and the edition is whole');
    assert.equal(again.readings.items.find(x => x.i === 0).plain, 'In plain words: 1. Clause 1.',
      'the other seventy-nine came out of what was kept');
  });

  test('(3) a page that failed is asked again once, by itself, and lands', async () => {
    ai.reset();
    ai.script(dead, answerPage, answerPage);
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-3', clauses: clauses(80) } });
    assert.equal(out.readings.items.length, 80, 'the page that failed was asked again and every clause came back');
    assert.equal(out.readings.over, 0, 'nothing is counted as unread');
    assert.equal(ai.calls.length, 3, 'two pages, and the failed one once more — never the page that answered');
    const c = await W.admin.json('/api/contracts/MK-F373-3');
    assert.ok(c._readings && c._readings.items.length === 80, 'a whole edition rides the contract as before');
  });

  test('(5a) an answer cut short is shown and never kept: the next press asks for it again', async () => {
    ai.reset();
    const one = [{ num: '1', heading: '1. Scope', text: 'The Supplier shall supply the goods set out in each purchase order.', kind: 'clause' }];
    ai.script({ content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings',
      input: { readings: [{ key: 'R0', heading: '1. Scope', plain: 'The supplier provides the goods in each ord' }] } }], stopReason: 'max_tokens' });
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-4', clauses: one } });
    assert.equal(out.readings.truncated, true, 'the reader is told it was cut short');
    assert.equal(out.readings.items.length, 1, 'what came back is still shown');
    ai.reset();
    ai.script(answerPage);
    await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-4', clauses: one } });
    assert.equal(ai.calls.length, 1, 'the half sentence was never kept, so the next press asks for it again');
  });

  /* [control] — passes at the parent too, where NOTHING was ever kept. It is
     here to prove the per-clause keeping has a wall: a doubtful page is not
     let into it. */
  test('(5b) [control] a page more than a quarter misfiled is shown but not kept', async () => {
    ai.reset();
    const four = clauses(4);
    /* Two of four entries name the WRONG clause (a shift), so the page is
       doubtful as a whole. */
    ai.script({ content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input: { readings: [
      { key: 'R0', heading: four[0].heading, plain: 'About clause one.' },
      { key: 'R1', heading: four[1].heading, plain: 'About clause two.' },
      { key: 'R3', heading: four[2].heading, plain: 'About clause three, under four.' },
    ] } }] });
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-5', clauses: four } });
    assert.deepEqual(out.readings.items.map(x => x.i), [0, 1], 'the two that paired are shown');
    ai.reset();
    ai.script(answerPage);
    await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-5', clauses: four } });
    assert.equal(rowsOf(ai.calls[0].body).length, 4,
      'and none of the doubtful page was kept — all four are asked again');
  });

  test('(5c) an edition kept with a hole in it is not served whole: the next press asks for the hole alone', async () => {
    ai.reset();
    const four = clauses(4, ' again');
    /* One entry missing: below the quarter line, so the edition IS kept with
       its count (C-6) — and the clause it missed used to stay missing for the
       life of the wording, because the whole edition answered every press. */
    ai.script({ content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input: { readings: [
      { key: 'R0', heading: four[0].heading, plain: 'One.' },
      { key: 'R1', heading: four[1].heading, plain: 'Two.' },
      { key: 'R2', heading: four[3].heading, plain: 'Four, under three.' },
      { key: 'R3', heading: four[3].heading, plain: 'Four.' },
    ] } }] });
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-6', clauses: four } });
    assert.equal(out.readings.unmatched, 1, 'one clause could not be matched');
    ai.reset();
    ai.script(answerPage);
    const again = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-6', clauses: four } });
    assert.ok(!again.cached, 'the edition with a hole is not served as if it were whole');
    assert.equal(ai.calls.length, 1, 'one call');
    assert.deepEqual(rowsOf(ai.calls[0].body).map(r => r.heading), [four[2].heading], 'carrying the missing clause and nothing else');
    assert.equal(again.readings.items.length, 4, 'and now the edition is whole');
  });

  /* [control] — passes at the parent too, where nothing was kept to be left
     behind; (6b) is the claim that fails there. */
  test('(6) [control] the readings kept for a contract go with it', async () => {
    ai.reset();
    const del = await W.admin.raw('/api/contracts/MK-F373-2', { method: 'DELETE' });
    assert.ok(del.status < 300, 'the contract was deleted: ' + del.status);
    await put('MK-F373-2');
    ai.script(answerPage, answerPage);
    await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-2', clauses: clauses(80) } });
    assert.equal(ai.calls.length, 2, 'a new contract under the old number is read from the start — nothing of the old one was left behind');
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

  test('half way through, the column is told what has come back and how many are left', async () => {
    let release; gate.hold = new Promise(r => { release = r; });
    calls.length = 0;
    const run = 'f373run0000000001';
    const pending = W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-J', clauses: clauses(130), run } });
    /* The first and third pages answer at once; the second is held. */
    let p = null;
    for (let k = 0; k < 40; k++) {
      await new Promise(r => setTimeout(r, 50));
      p = await W.admin.json('/api/contracts/MK-F373-J/reading-progress?run=' + run + '&from=0');
      if (p && p.done >= 70) break;
    }
    assert.equal(p.running, true, 'it is still running');
    assert.equal(p.total, 130, 'it knows how many there are');
    assert.equal(p.done, 70, 'and says how many have come back — "Reading 70 of 130"');
    assert.equal(p.items.length, 70, 'handing over the entries that have');
    assert.ok(p.items.every(it => Number.isInteger(it.i) && it.i >= 0 && it.i < 130 && typeof it.plain === 'string'),
      'each carrying its place in the whole contract');
    /* `from` is how many the column already holds: only what is new comes back. */
    const again = await W.admin.json('/api/contracts/MK-F373-J/reading-progress?run=' + run + '&from=' + p.next);
    assert.equal(again.items.length, 0, 'nothing new yet');

    /* A SECOND PRESS ON THE SAME WORDING JOINS — the reader back from another
       page, or a colleague — and never pays twice. */
    const joined = W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F373-J', clauses: clauses(130), run: 'f373run0000000002' } });
    await new Promise(r => setTimeout(r, 150));
    const asked = calls.length;
    release();
    const [a, b] = await Promise.all([pending, joined]);
    assert.equal(a.readings.items.length, 130, 'the reading finishes whole');
    assert.equal(b.readings.items.length, 130, 'and the second press gets the same edition');
    assert.equal(calls.length, asked, 'without one more call');
    assert.equal(calls.length, 3, 'three pages in all, for two presses');
    const done = await W.admin.json('/api/contracts/MK-F373-J/reading-progress?run=' + run + '&from=' + p.next);
    assert.equal(done.running, false, 'and the column is told it has finished');
    assert.equal(done.items.length, 60, 'with the entries it had not yet been handed');
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
  test('the switch is set before the reading, so the reader watches it arrive', () => {
    const w = region('wireDocRead');
    assert.ok(w.indexOf('docViewSet(mode)') < w.indexOf('await docReadRun(c)'), 'the column opens first');
    assert.match(w, /if\(docViewMode\(\)!=='plain'\|\|!docReadWatching\(cur\.id\)\) return;/,
      'and a reader who moved on while it read keeps what they chose');
  });
  test('one press per contract: a reading already running is joined, never asked for twice', () => {
    const r = region('docReadRun');
    assert.match(r, /const busy=_docReadJobs\.get\(id\);\s*\n\s*if\(busy\) return busy\.promise;/);
    assert.match(r, /run:job\.run/, 'the press carries its own name, so progress is about THIS reading');
  });
  test('the column asks how far it has got only while somebody is looking', () => {
    const p = region('docReadPoll');
    assert.match(p, /if\(!always&&!docReadWatching\(id\)\) return null;/);
    assert.match(p, /reading-progress\?run=/);
    assert.match(ROOM, /const docReadWatching=id=>state\.view==='workspace'&&state\.activeId===id&&_wsTab==='docs'&&docReadOn\(\);/);
  });
  test('the head says "Reading N of M" in the slot the moved line uses, never a band', () => {
    const p = region('docReadPaint');
    assert.match(p, /running\?`<span class="doc-read-moved doc-read-progress" role="status">/);
    assert.match(p, /i18t\('ct_read_progress',\{n:prog\.done,m:prog\.total\}\)/);
    assert.equal((I18N.match(/ct_read_progress: '/g) || []).length, 2, 'in both books');
    assert.match(I18N, /ct_read_progress: 'Reading \{n\} of \{m\}'/);
  });
  test('a clause still to come keeps its place, with a class of its own', () => {
    const p = region('docReadPaint');
    assert.match(p, /class="doc-read-wait" data-doc-read-wait=/);
    assert.ok(!/doc-read-note[^"]*doc-read-wait|doc-read-wait[^"]*doc-read-note/.test(p), 'never a .doc-read-note — nothing that counts readings may find it');
    assert.match(p, /waitsUpTo\(Number\(p\.it&&p\.it\.i\)\)/, 'placed in the same pass as the readings, in paper order');
    assert.match(INDEX, /\.doc-read-wait\{ position:absolute;/);
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
