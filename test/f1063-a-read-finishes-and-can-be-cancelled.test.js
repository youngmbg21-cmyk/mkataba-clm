/* f1063 · A READ FINISHES, AND CAN BE CANCELLED (owner, 15 Nov 2026, on a photo of "Stopped · Personal data, 30 of 54
   read": "the page does not finish reading and stops for no reason and I can't move on. Also, if I choose to stop in
   the middle of the reading I should have an exit ramp to cancel the whole work and go back to the discover page. I
   should not be left hanging in limbo"; on what Cancel does with what was read: "you should have a choice to either
   throw them away or save them").
   (1) Read the N left reads the rest ON the screen and the screen then says what happened — before, it kept "Stopped"
   and the old count with no button on. A read that broke is offered again like a stopped one.
   (2) Cancel read beside Stop and beside Read the N left asks ONE question — keep what was read, throw it away, or go
   on — and either way lands on Discover's list.
   (3) The server throws a read away: only the answers THIS read wrote, its record, and a question left with nothing;
   the reader's own or an admin's; a batch still with Jambo when it is thrown away leaves nothing behind.
   Fails at the parent: none of it exists. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js')), AC = strip(read('js/views/askcolumn.js')), SRV = strip(read('server/server.js')), I18N = read('js/i18n.js');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function |\nif \(typeof document|\napp\.|\nconst /); return src.slice(at, nx > 0 ? at + 10 + nx : src.length); };
const ids = n => Array.from({ length: n }, (_, i) => 'CX-' + String(i + 1).padStart(2, '0'));

test('f1063 (1) Read the N left ends on a screen that says what happened; a broken read is offered again', () => {
  /* RE-POINTED 22 Nov 2026 (P-42 review): the stopped panel's "read them" is the same carry (data-dsn-carry) */
  assert.match(RD, /if \(t\.closest\('#dsc-carry, \[data-dsn-carry\]'\)\)\{ e\.preventDefault\(\); e\.stopPropagation\(\); dsnCarry\(\); return; \}/, 'the button goes through Discover\'s own carry');
  const C = fnBody(RD, 'dsnCarry');
  assert.match(C, /const pr = askColCarryOn\(\)/);
  assert.match(C, /_dsn\.done = Object\.assign\(\{\}, D, \{ k: Math\.max\(0, n - left\), n, stopped: !!\(got\.stopped \|\| \(got\.err && left\)\) \}\)/, 'the count and the heading follow the rest');
  assert.match(fnBody(AC, 'askColCarryOn'), /return got;/, 'the carry answers what happened');
  assert.match(fnBody(RD, 'dsnAsk'), /stopped: !!\(got\.stopped \|\| \(got\.err && \(got\.left \|\| \[\]\)\.length\)\)/, 'a read that broke offers the rest, never a dead end');
});

/* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): the head while it reads carries Stop alone — askColStop's one door —
   and, stopped, Ask another; the read is left by "‹ All reads" (it keeps reading) and thrown away from its results
   ("Throw away this read", dsnThrowAway → dsnCancelGo('drop')). The exit ramp's one question is kept, unused by the page. */
test('f1063 (2) the head: Stop alone while it reads, Ask another once stopped; throwing away is the results\' own', () => {
  const H = fnBody(RD, 'dsnReadingHtml');
  assert.doesNotMatch(H, /id="dsn-cancel"/, 'no Cancel read beside Stop');
  assert.match(H, /const right = b \? `<button type="button" class="rfp-pill" id="dsc-stop"/, 'while it reads: Stop');
  assert.match(H, /data-dsn-again=/, 'stopped: Ask another');
  assert.match(H, /class="dsn-stopbar"[^`]*id="dsc-carry"/, 'Read the N left, said with what is left');
  assert.match(fnBody(RD, 'dsnThrowAway'), /dsnCancelGo\('drop'\)/, 'throwing a read away is the one throw-away');
  const O = fnBody(RD, 'dsnCancelOpen');
  assert.ok(O.indexOf('data-dsn-cx="keep"') < O.indexOf('data-dsn-cx="drop"') && O.indexOf('data-dsn-cx="drop"') < O.indexOf('data-dsn-cx="stay"'), 'act first, the way back last');
  assert.match(O, /data-dlg-cancel data-dsn-cx="stay"/);
  assert.doesNotMatch(O, /askColStop/, 'opening the question stops nothing: "No, go on" goes on');
  const G = fnBody(RD, 'dsnCancelGo');
  assert.match(G, /if \(how === 'stay'\) return;/);
  assert.match(G, /askColStop\(\)/); assert.match(G, /Date\.now\(\) - t0 < 15000/, 'the wait for the read to let go is bounded');
  assert.match(G, /api\('columns\/reads\/' \+ encodeURIComponent\(runId\), 'DELETE'\)/);
  assert.match(G, /A\.stopped = null/, 'no Read the N left waits behind a cancelled read');
  assert.match(G, /dsnGo\('list'/, 'back on Discover\'s list');
  for (const k of ['dsn_cancel', 'dsn_cancel_t', 'dsn_cancel_sub', 'dsn_cancel_body', 'dsn_cancel_keep', 'dsn_cancel_drop', 'dsn_cancel_stay', 'dsn_cancel_kept', 'dsn_cancel_dropped', 'dsn_cancel_fail', 'dsn_cancel_slow'])
    assert.equal((I18N.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k + ' in both books');
});

test('f1063 (3) the server throws a read away: only what it wrote, the walls, and a batch still with Jambo', async () => {
  const h = await startHati();
  try {
    const cs = ids(6).map(id => fixtureContract(id, 'Supply Agreement', 'Kabras Sugar', FOLDER_A, 1000000, 'Signed',
      'SUPPLY AGREEMENT\n\n12. Data\nThe Supplier acts as data processor under a data processing agreement.'));
    const W = await seedWorkspace(h, { contracts: cs });
    const Q = 'Does the supplier act as a data processor?';
    const r1 = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Processor', ids: ids(3), run: { id: 'cr_aaaaaaaaaaaaaaaa' } } });
    const askId = r1.ask.id;
    await new Promise(r => setTimeout(r, 20));
    await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Processor', ids: ids(6).slice(3), run: { id: 'cr_bbbbbbbbbbbbbbbb' } } });
    const answers = async () => Object.keys((await W.admin.json('/api/columns/answers', { method: 'POST', body: { askId, ids: ids(6) } })).answers || {}).sort();
    assert.deepEqual(await answers(), ids(6));
    /* the walls: not the starter and not an admin */
    if (W.restricted) assert.equal((await W.restricted.raw('/api/columns/reads/cr_bbbbbbbbbbbbbbbb', { method: 'DELETE' })).status, 403);
    /* the later read goes; the earlier read's answers and the question stay */
    const d = await W.admin.json('/api/columns/reads/cr_bbbbbbbbbbbbbbbb', { method: 'DELETE' });
    assert.equal(d.answers, 3); assert.deepEqual(d.asks, []);
    assert.deepEqual(await answers(), ids(3), 'only what this read wrote');
    let L = await W.admin.json('/api/columns/reads');
    assert.ok(!L.reads.some(r => r.id === 'cr_bbbbbbbbbbbbbbbb') && L.reads.some(r => r.id === 'cr_aaaaaaaaaaaaaaaa'));
    /* the last read goes, and the question left with nothing goes with it */
    const d2 = await W.admin.json('/api/columns/reads/cr_aaaaaaaaaaaaaaaa', { method: 'DELETE' });
    assert.deepEqual(d2.asks, [askId]);
    assert.equal((await W.admin.raw('/api/columns/answers', { method: 'POST', body: { askId, ids: ids(6) } })).status, 404, 'the question is gone');
    /* thrown away before its batch was written: the batch leaves nothing behind when it ends */
    await W.admin.json('/api/columns/reads/cr_cccccccccccccccc', { method: 'DELETE' });
    const r3 = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Processor', ids: ids(2), run: { id: 'cr_cccccccccccccccc' } } });
    L = await W.admin.json('/api/columns/reads');
    assert.ok(!L.reads.some(r => r.id === 'cr_cccccccccccccccc'), 'no record written');
    assert.equal((await W.admin.raw('/api/columns/answers', { method: 'POST', body: { askId: r3.ask.id, ids: ids(2) } })).status, 404, 'no answer and no question left');
    assert.equal((await W.admin.raw('/api/columns/reads/nope', { method: 'DELETE' })).status, 404);
  } finally { await h.stop(); }
  assert.match(SRV, /const runGone = b\.run && typeof b\.run === 'object' && COLUMN_RUNS_DROPPED\.has/);
});
