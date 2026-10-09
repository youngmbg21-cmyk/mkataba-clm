/* ============================================================
   F494 — An ask lives until the asker leaves (gap E, 4 Oct 2026)
   ============================================================
   The process review's last gaps. "Ask for it" on a clause somebody else is
   holding is kept alive by the asker's presence beat (POST /here refreshes
   THEIR asks, f473 (1)) — and that beat says nothing while the tab is hidden.
   So an asker who switched tab to read their mail fell out of the holder's
   queue after the lock's two minutes, although they had not left.

   WHAT WAS BUILT, and what each block below drives:
     (1) THE SERVER, on the real route, with time moved by ageing the stored
         record (the server is a child process, so its clock cannot be faked;
         a minute passing is every timestamp on the record a minute older):
           · the gap, measured — nobody beating, the ask lapses at two minutes;
           · a hidden tab's `askOnly` beat keeps it alive for four minutes and
             more, and stamps NO room, so the face row still drops the asker;
           · `leave` takes the caller's asks away — only theirs;
           · walls: json only, a sealed record answers without writing, and a
             quiet beat with nothing to keep writes nothing at all.
     (2) THE BROWSER MODULE, in jsdom with node's own mock clock:
           · hidden, the ordinary beat sends nothing and the slower ask beat
             sends `askOnly`, only while there is an ask, and stops when the
             server says none is left;
           · leaving the contract sends `leave` after the grace — and coming
             back to the same contract inside it is not leaving;
           · pagehide sends `leave` at once, as a keepalive request.
     (3) THE RELATION, pinned rather than the number: the hidden beat plus a
         throttled tab's minute stays inside the ask's window.
   The browser half where the user looks (the holder's queue, a real page
   closing) is test/chromium/take-it-in-turns-verify.js stage 8. */
const { test, describe, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const SRV = read('server/server.js');
const PZ = bare(read('js/presence.js'));
const LOCK = bare(read('js/clauselock.js'));
const API = bare(read('js/api.js'));
const ROUTE = bare(SRV.slice(SRV.indexOf("app.post('/api/contracts/:id/here'"),
  SRV.indexOf('/* ---------- executed records are immutable')));

describe('f494 (1) — the server keeps a hidden asker\'s ask, and takes it away when they leave', () => {
  let h, w, raw, ids;
  const CID = 'MK-A2', CL = 'cl_t494';
  before(async () => {
    h = await startHati();
    w = await seedWorkspace(h, { approvalRules: [] });
    const { DatabaseSync } = require('node:sqlite');
    raw = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    raw.exec('PRAGMA busy_timeout = 5000');
    const took = await w.admin.json(`/api/contracts/${CID}/lock`, { method: 'POST', body: { clauseId: CL } });
    ids = { holder: took.locks[CL].by.id, asker: w.users.unrestricted.id, other: w.users.novalues.id };
  });
  after(async () => { try { raw && raw.close(); } catch (_) {} if (h) await h.stop(); });

  const row = id => raw.prepare('SELECT json, version, updated_at FROM contracts WHERE id=?').get(id || CID);
  const stored = id => JSON.parse(row(id).json);
  /* A MINUTE PASSES: every presence timestamp on the record gets that much
     older. Written straight onto the row because nothing else can move the
     server's clock, and it touches only the three presence maps. */
  const age = ms => {
    const c = stored();
    const back = at => new Date(Date.parse(at) - ms).toISOString();
    Object.values(c.locks || {}).forEach(l => {
      if (l && l.at) l.at = back(l.at);
      (Array.isArray(l && l.asked) ? l.asked : []).forEach(r => { if (r && r.at) r.at = back(r.at); });
    });
    Object.values(c.here || {}).forEach(r => { if (r && r.at) r.at = back(r.at); });
    raw.prepare('UPDATE contracts SET json=? WHERE id=?').run(JSON.stringify(c), CID);
  };
  /* The holder's editor keeps their own lock, every few seconds while they
     type — so the lock never lapses, only the ask can. */
  const holderKeeps = () => w.admin.json(`/api/contracts/${CID}/lock`, { method: 'POST', body: { clauseId: CL } });
  const asksNow = () => ((stored().locks || {})[CL] || {}).asked || [];
  const askOf = id => asksNow().find(r => String(r.id) === String(id)) || null;
  const start = async () => {
    await w.admin.json(`/api/contracts/${CID}/lock`, { method: 'POST', body: { clauseId: CL, release: true } });
    await holderKeeps();
    await w.unrestricted.json(`/api/contracts/${CID}/here`, { method: 'POST', body: {} });
    await w.unrestricted.json(`/api/contracts/${CID}/lock`, { method: 'POST', body: { clauseId: CL, ask: true } });
    assert.ok(askOf(ids.asker), 'the stage has an ask on the holder\'s lock');
  };

  test('the gap, measured: a tab that sends nothing loses its ask at two minutes', async () => {
    await start();
    age(60000); await holderKeeps();
    assert.ok(askOf(ids.asker), 'one minute in, still asked');
    age(61000); await holderKeeps();
    assert.equal(askOf(ids.asker), null,
      'two minutes and a second with no beat, and the queue no longer names them — '
      + 'which is right for somebody who LEFT and wrong for somebody who looked away');
  });

  test('a hidden tab\'s askOnly beat keeps the ask alive well past the old window', async () => {
    await start();
    for (let minute = 1; minute <= 4; minute++){
      age(60000);
      const r = await w.unrestricted.json(`/api/contracts/${CID}/here`, { method: 'POST', body: { askOnly: true } });
      assert.deepEqual(r, { asks: 1 }, `minute ${minute}: one ask kept, and nothing said about who else is here`);
      await holderKeeps();
    }
    const kept = askOf(ids.asker);
    assert.ok(kept, 'four minutes hidden, and the holder\'s queue still names them');
    assert.ok(Date.now() - Date.parse(kept.at) < 5000, 'kept fresh by the last beat, not raised from an old stamp');
    assert.equal(String(stored().locks[CL].by.id), String(ids.holder), 'and asking still takes nothing');
  });

  test('…and stamps NO room: the face row still drops a hidden reader', async () => {
    /* Carrying on from the stage above: the asker's last ordinary beat is now
       four "minutes" old, and every beat since was askOnly. */
    const mine = (stored().here || {})[ids.asker];
    assert.ok(!mine || Date.now() - Date.parse(mine.at) > 75000,
      'an askOnly beat is not "here" — nothing re-stamped them in the room');
    const seen = await w.admin.json(`/api/contracts/${CID}/here`, { method: 'POST', body: {} });
    assert.ok(Array.isArray(seen.here), 'the holder\'s own beat answers with the row');
    assert.ok(!seen.here.some(r => String(r.id) === String(ids.asker)),
      'the holder\'s face row does not show somebody whose tab is hidden — presence is unchanged');
    assert.ok(askOf(ids.asker), 'while their ask still stands');
  });

  test('a hidden tab whose ask is gone stops being kept: the beat answers 0 and writes nothing', async () => {
    await start();
    age(121000);
    const before = row();
    const r = await w.unrestricted.json(`/api/contracts/${CID}/here`, { method: 'POST', body: { askOnly: true } });
    assert.deepEqual(r, { asks: 0 }, 'a lapsed ask is not raised from the dead');
    const afterRow = row();
    assert.equal(afterRow.json, before.json, 'nothing moved, so nothing is written — a hidden tab costs the record nothing');
  });

  test('leaving takes the caller\'s asks away — only theirs', async () => {
    await start();
    await w.novalues.json(`/api/contracts/${CID}/lock`, { method: 'POST', body: { clauseId: CL, ask: true } });
    const otherBefore = askOf(ids.other);
    const lockBefore = stored().locks[CL];
    assert.ok(otherBefore && askOf(ids.asker), 'two colleagues are waiting');
    const v0 = row();
    const r = await w.unrestricted.json(`/api/contracts/${CID}/here`, { method: 'POST', body: { leave: true } });
    assert.deepEqual(r, { asks: 0 }, 'nothing of theirs is left standing');
    assert.equal(askOf(ids.asker), null, 'the holder\'s queue stops naming somebody who is gone');
    assert.deepEqual(askOf(ids.other), otherBefore, 'the colleague still waiting is untouched — same ask, same time');
    const lockAfter = stored().locks[CL];
    assert.deepEqual(lockAfter.by, lockBefore.by, 'the holder still holds it');
    assert.equal(lockAfter.at, lockBefore.at, 'and their lock was not touched');
    const v1 = row();
    assert.equal(v1.version, v0.version, 'json only: the version did not move');
    assert.equal(v1.updated_at, v0.updated_at, 'nor the register\'s "updated" column');
    /* The last asker leaving leaves a bare lock, the shape a lock nobody asked
       for has always had. */
    await w.novalues.json(`/api/contracts/${CID}/here`, { method: 'POST', body: { leave: true } });
    assert.ok(!('asked' in stored().locks[CL]), 'no empty queue left on the lock');
  });

  test('leaving says nothing about the room either way', async () => {
    await start();
    const before = (stored().here || {})[ids.asker];
    await w.unrestricted.json(`/api/contracts/${CID}/here`, { method: 'POST', body: { leave: true } });
    assert.deepEqual((stored().here || {})[ids.asker], before,
      'leaving withdraws the asks and nothing else — the row ages out on its own window, as before');
  });

  test('a sealed record answers without writing', async () => {
    const sealed = 'MK-B1';
    const before = row(sealed);
    const r = await w.unrestricted.json(`/api/contracts/${sealed}/here`, { method: 'POST', body: { leave: true } });
    assert.ok(Array.isArray(r.here), 'the same answer /here gives a signed contract');
    const r2 = await w.unrestricted.json(`/api/contracts/${sealed}/here`, { method: 'POST', body: { askOnly: true } });
    assert.ok(Array.isArray(r2.here));
    assert.equal(row(sealed).json, before.json, 'not a byte written');
  });

  test('(parent: red) both beats live on the one door, and neither moves version or updated_at', () => {
    assert.equal((SRV.match(/app\.post\('\/api\/contracts\/:id\/here'/g) || []).length, 1,
      'one door: a second route would be a second way for two browsers to disagree about an ask');
    assert.match(ROUTE, /askOnly = \(req\.body \|\| \{\}\)\.askOnly === true, leave = \(req\.body \|\| \{\}\)\.leave === true/);
    assert.match(ROUTE, /if \(!askOnly && !leave\) \{\s*live\[String\(me\.id\)\] =/,
      'neither quiet beat stamps the room');
    assert.match(ROUTE, /if \(leave\) \{\s*const asked = l\.asked\.filter\(r => !\(r && String\(r\.id\) === String\(me\.id\)\)\)/,
      'leaving filters out the caller\'s own rows and nobody else\'s');
    assert.ok(!/version|updated_at/.test(ROUTE), 'json only');
  });
});

describe('f494 (2) — the browser keeps its asks while hidden, and withdraws them when it leaves', () => {
  let dom, W, calls, answer, hidden, C;
  const ME = { id: 'u_ask', name: 'Asha Kibet' };
  const stage = (cid, mineAsk = true) => {
    /* `_v`: a record the server has sent — presenceSay waits for one (f613). */
    C[cid] = { id: cid, _v: 1, locks: { cl1: { by: { id: 'u_hold', name: 'Holder' }, at: new Date().toISOString(),
      asked: mineAsk ? [{ id: ME.id, name: ME.name, at: new Date().toISOString() }] : [] } } };
  };
  const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r)); };
  /* TIME PASSES IN STEPS, with the answers landing between them — one long
     tick would fire every beat before the first answer came back, and each
     beat's latch would (rightly) turn the rest away. */
  const run = async ms => { for (let t = 0; t < ms; t += 5000){ mock.timers.tick(Math.min(5000, ms - t)); await flush(); } };
  const sent = kind => calls.filter(c => kind === 'here' ? !c.body.askOnly && !c.body.leave : c.body[kind]);
  before(() => {
    mock.timers.enable({ apis: ['setInterval', 'setTimeout', 'Date'], now: Date.parse('2026-10-04T10:00:00Z') });
    dom = new JSDOM('<!doctype html><body></body>');
    global.window = W = dom.window; global.document = dom.window.document;
    hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    C = {};
    calls = [];
    answer = () => ({ here: [] });
    W.API_MODE = () => true;
    W.currentUser = () => ME;
    W.getContract = id => C[id] || null;
    W.api = (p, method, body, opts) => { calls.push({ p, method, body: body || {}, opts: opts || {}, t: Date.now() }); return Promise.resolve(answer(body || {})); };
    delete require.cache[require.resolve('../js/presence.js')];
    require('../js/presence.js');
  });
  after(() => { try { W.presenceStop(); } catch (_) {} mock.timers.reset(); delete global.window; delete global.document; });

  test('hidden: the ordinary beat sends nothing, and the ask beat keeps the ask for minutes', async () => {
    stage('MK-H1');
    calls.length = 0; hidden = false;
    W.presenceStart('MK-H1');
    await flush();
    assert.equal(sent('here').length, 1, 'arriving says you are here, once');
    hidden = true;
    answer = b => (b.askOnly ? { asks: 1 } : { here: [] });
    const hidAt = Date.now();
    for (let s = 0; s < 5 * 60; s += 5){ mock.timers.tick(5000); await flush(); }
    /* THE LONGEST STRETCH THE ASK WENT UNKEPT, from the moment the tab was
       hidden: the server's window is what it has to stay inside. */
    const keeps = [hidAt, ...sent('askOnly').map(c => c.t)];
    const worst = Math.max(...keeps.slice(1).map((t, i) => t - keeps[i]));
    assert.equal(sent('here').length, 1, 'five hidden minutes and not one "I am here" — a hidden tab is not in the room');
    assert.ok(sent('askOnly').length >= 6, `the ask beat ran all along (${sent('askOnly').length} beats)`);
    assert.ok(worst <= W.PRESENCE_ASK_BEAT_MS, `never longer than one ask beat between keeps (${worst} ms)`);
    assert.ok(sent('askOnly').every(c => c.p === 'contracts/MK-H1/here' && c.opts.quiet === true),
      'on the one door, and quiet — a beat nobody asked for may not shout');
    W.presenceStop(); mock.timers.tick(W.PRESENCE_LEAVE_MS + 1); await flush();
  });

  test('visible, the ask beat stands aside: the ordinary beat keeps the asks already', async () => {
    stage('MK-H2');
    calls.length = 0; hidden = false;
    answer = () => ({ here: [] });
    W.presenceStart('MK-H2');
    await run(3 * 60000);
    assert.equal(sent('askOnly').length, 0, 'no second beat while the tab is in front');
    assert.ok(sent('here').length >= 7, 'the ordinary one ran');
    W.presenceStop(); mock.timers.tick(W.PRESENCE_LEAVE_MS + 1); await flush();
  });

  test('no ask, no beat — and an ask the server has dropped stops being kept until a new one', async () => {
    stage('MK-H3', false);
    calls.length = 0; hidden = true;
    answer = b => (b.askOnly ? { asks: 0 } : { here: [] });
    W.presenceStart('MK-H3');
    await run(3 * 60000);
    assert.equal(sent('askOnly').length, 0, 'a reader who asked for nothing costs nothing while hidden');
    stage('MK-H3');
    await run(3 * 60000);
    assert.equal(sent('askOnly').length, 1, 'one beat finds the ask gone (handed on, released or lapsed) — and stops');
    C['MK-H3'].locks.cl1.asked.push({ id: ME.id, name: ME.name, at: new Date(Date.now() + 1000).toISOString() });
    answer = b => (b.askOnly ? { asks: 1 } : { here: [] });
    mock.timers.tick(W.PRESENCE_ASK_BEAT_MS); await flush();
    assert.equal(sent('askOnly').length, 2, 'a NEW ask is kept again');
    W.presenceStop(); mock.timers.tick(W.PRESENCE_LEAVE_MS + 1); await flush();
  });

  test('leaving the contract withdraws the asks after the grace, as a keepalive request', async () => {
    stage('MK-H4');
    calls.length = 0; hidden = false;
    answer = () => ({ here: [] });
    W.presenceStart('MK-H4'); await flush();
    W.presenceStop();
    mock.timers.tick(W.PRESENCE_LEAVE_MS - 1); await flush();
    assert.equal(sent('leave').length, 0, 'not at once — the room and the negotiate page are one contract');
    mock.timers.tick(2); await flush();
    const left = sent('leave');
    assert.equal(left.length, 1, 'and after the grace, the asks go');
    assert.equal(left[0].p, 'contracts/MK-H4/here');
    assert.equal(left[0].opts.keepalive, true, 'a request that outlives the page that sent it');
    await run(5 * 60000);
    assert.equal(sent('leave').length, 1, 'once');
  });

  test('coming back to the same contract inside the grace is not leaving', async () => {
    stage('MK-H5');
    calls.length = 0; hidden = false;
    W.presenceStart('MK-H5'); await flush();
    W.presenceStop();                      // setView, on the way to the negotiate page
    mock.timers.tick(300);
    W.presenceStart('MK-H5'); await flush();
    await run(W.PRESENCE_LEAVE_MS * 3);
    assert.equal(sent('leave').length, 0, 'the ask stays with a reader who never left');
    W.presenceStop(); mock.timers.tick(W.PRESENCE_LEAVE_MS + 1); await flush();
    assert.equal(sent('leave').length, 1, 'and goes when they do');
  });

  test('a different contract is leaving the first one', async () => {
    stage('MK-H6'); stage('MK-H7', false);
    calls.length = 0; hidden = false;
    W.presenceStart('MK-H6'); await flush();
    W.presenceStart('MK-H7'); await flush();
    mock.timers.tick(W.PRESENCE_LEAVE_MS + 1); await flush();
    assert.deepEqual(sent('leave').map(c => c.p), ['contracts/MK-H6/here']);
    W.presenceStop(); mock.timers.tick(W.PRESENCE_LEAVE_MS + 1); await flush();
    assert.equal(sent('leave').length, 1, 'and nothing for a contract with no ask on it');
  });

  test('the page going away withdraws at once — the watched contract and any leave still in its grace', async () => {
    stage('MK-H8'); stage('MK-H9');
    calls.length = 0; hidden = false;
    W.presenceStart('MK-H8'); await flush();
    W.presenceStart('MK-H9'); await flush();   // MK-H8 is now waiting out its grace
    W.dispatchEvent(new W.Event('pagehide'));
    await flush();
    const left = sent('leave').map(c => c.p).sort();
    assert.deepEqual(left, ['contracts/MK-H8/here', 'contracts/MK-H9/here'], 'both go now — the page will not be here later');
    assert.ok(sent('leave').every(c => c.opts.keepalive === true));
    mock.timers.tick(W.PRESENCE_LEAVE_MS + 1); await flush();
    assert.equal(sent('leave').length, 2, 'and the grace timer does not send MK-H8 twice');
    W.presenceStop(); mock.timers.tick(W.PRESENCE_LEAVE_MS + 1); await flush();
  });
});

describe('f494 (3) — the relation, and the one door', () => {
  const num = (src, name) => Number((src.match(new RegExp('const ' + name + ' = (\\d+)')) || [])[1] || 0);
  test('the hidden beat plus a throttled tab\'s minute stays inside the ask\'s window', () => {
    const ask = num(PZ, 'PRESENCE_ASK_BEAT_MS'), beat = num(PZ, 'PRESENCE_BEAT_MS');
    const win = num(LOCK, 'CLAUSE_LOCK_MS'), srv = num(SRV, 'SRV_CLAUSE_LOCK_MS');
    assert.ok(ask > 0 && win > 0 && win === srv, 'the browser and the server measure an ask with one window');
    assert.ok(ask > beat, 'slower than the ordinary beat — a hidden tab is asked for less');
    assert.ok(ask + 60000 + 15000 <= win,
      `a hidden tab is woken about once a minute, so a beat may land a minute late: ${ask} + 60000 must leave room inside ${win}`);
  });

  test('the leave rides the one client door, kept alive past the page', () => {
    assert.match(API, /\.\.\.\(opts&&opts\.keepalive\?\{keepalive:true\}:\{\}\)/,
      'api() passes keepalive through, and only when asked');
    const fn = PZ.slice(PZ.indexOf('function presenceLeave('), PZ.indexOf('function presenceLeaveSoon'));
    assert.match(fn, /window\.api\(path, 'POST', body, \{ quiet: true, keepalive: true \}\)/);
    assert.match(fn, /navigator\.sendBeacon/, 'and a beacon where the browser has no keepalive');
  });

  test('pagehide is armed once, at module load', () => {
    assert.equal((PZ.match(/addEventListener\('pagehide'/g) || []).length, 1);
    const i = PZ.indexOf("addEventListener('pagehide'");
    const head = PZ.slice(Math.max(0, i - 200), i);
    assert.match(head, /typeof window\.addEventListener === 'function'\) window\.$/,
      'a listener added inside a function that runs twice would send every leave twice');
  });

  test('the ordinary beat still says nothing while hidden', () => {
    const fn = PZ.slice(PZ.indexOf('function presenceStart'), PZ.indexOf('function presenceStop'));
    assert.match(fn, /document\.hidden\) return;\s*presenceSay\(id\);/,
      'presence is unchanged: a tab behind three others is not somebody in the room');
    assert.match(fn, /!document\.hidden\) return;\s*presenceKeepAsks\(id\);/,
      'and the ask beat runs only while hidden');
  });
});
