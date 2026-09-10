/* f289 — ONE CLAUSE, ONE PAIR OF HANDS (Young asked 10 Sep 2026)
   =========================================================================
   *"to avoid collisions as far as multiple people editing the same clause,
   could we make it so that when user 1 is editing clause 5, it is locked to
   others until user 1 is out. When user 2 tries to click on the pencil symbol,
   they see the initials of User 1 and a short small line saying 'Locked by
   R. C.' or something to that effect?"*

   WHAT IS PROVED HERE: the reading, both directions of it; that the pencil's
   slot really carries the monogram and the sentence rather than a control; that
   the editor's own door is a WALL and not only a sign; that the server refuses
   as a DIFFERENCE and lets every other save through; and — the one that matters
   most — that a colleague's initials cannot reach the counterparty, which is
   asserted rather than assumed.

   MEASURED AGAINST THE PARENT: 25 of these 26 fail there. The one that passes
   — the share payload — is a named CONTROL, true before and after, and its job
   is to fail the day somebody puts a colleague's initials on the wire. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* THE MODEL RUNS IN NODE WITH NO WINDOW AT ALL, which is also the first thing
   worth proving: a stage with nobody signed in behaves exactly as it did.

   LOADED LAZILY AND GUARDED, so a build without the feature REPORTS its twenty
   failures rather than aborting on the first line and proving nothing — the
   same reason every driven half of a browser file in this suite is guarded. */
let _L = null;
const L = new Proxy({}, { get(_, k){
  if (!_L){
    try{ _L = require('../js/clauselock.js'); }
    catch(e){ throw new Error('js/clauselock.js is not there: ' + e.message); }
  }
  return _L[k];
} });

const NOW = () => new Date().toISOString();
const AGO = ms => new Date(Date.now() - ms).toISOString();
const lockedBy = (id, name, at) => ({ by: { id, name }, at: at || NOW() });

/* A stage that answers currentUser(), which is the only thing the model asks
   the window for. Restored after every use so nothing leaks between blocks. */
function asUser(u, fn){
  const had = 'window' in global;
  const prev = global.window;
  global.window = { currentUser: () => u, i18t: (k, o) =>
    k === 'cl_locked_by' ? `Locked by ${o.who}`
    : k === 'cl_locked_title' ? `${o.who} is editing this clause.`
    : k === 'cl_a_colleague' ? 'a colleague' : k };
  try{ return fn(global.window); }
  finally{ if (had) global.window = prev; else delete global.window; }
}

/* ---------------------------------------------------------------- 1. the
   reading, both directions ------------------------------------------------ */
test('f289 (1) a live lock held by somebody else is a lock; your own is not', () => {
  const c = { locks: { cl_5: lockedBy('u2', 'Ruth Chege') } };
  asUser({ id: 'u1', name: 'Amina Njoroge' }, () => {
    const l = L.clauseLockHeldByOther(c, 'cl_5');
    assert.ok(l, 'a colleague holds clause 5');
    assert.equal(l.by.name, 'Ruth Chege');
  });
  asUser({ id: 'u2', name: 'Ruth Chege' }, () => {
    assert.equal(L.clauseLockHeldByOther(c, 'cl_5'), null,
      'your own lock is not a lock to you');
  });
});

test('f289 (2) it lapses, and the window is one number read by both hosts', () => {
  const c = { locks: {
    fresh: lockedBy('u2', 'Ruth Chege', AGO(10000)),
    stale: lockedBy('u2', 'Ruth Chege', AGO(L.CLAUSE_LOCK_MS + 1000)) } };
  asUser({ id: 'u1', name: 'Amina Njoroge' }, () => {
    assert.ok(L.clauseLockHeldByOther(c, 'fresh'), 'ten seconds old still holds');
    assert.equal(L.clauseLockHeldByOther(c, 'stale'), null, 'past the window it is nobody\'s');
  });
  /* THE SAME NUMBER ON THE SERVER, read off its own source rather than trusted:
     two readings of "is this lock alive" is how a holder and everybody else come
     to disagree about it. */
  const srv = read('server/server.js');
  const m = /const CLAUSE_LOCK_MS = (\d+);/.exec(srv);
  assert.ok(m, 'the server states the window');
  assert.equal(Number(m[1]), L.CLAUSE_LOCK_MS, 'one window, both hosts');
});

test('f289 (3) nobody signed in is refused nothing AND shown nothing', () => {
  const c = { locks: { cl_5: lockedBy('u2', 'Ruth Chege') } };
  asUser(null, () => {
    assert.equal(L.clauseLockHeldByOther(c, 'cl_5'), null, 'shown nothing');
    assert.equal(L.clauseLockTake(c, 'cl_5'), true, 'refused nothing');
  });
});

test('f289 (4) taking is refused where a colleague holds it, and granted where nobody does', () => {
  const c = { locks: { cl_5: lockedBy('u2', 'Ruth Chege') } };
  asUser({ id: 'u1', name: 'Amina Njoroge' }, () => {
    assert.equal(L.clauseLockTake(c, 'cl_5'), false, 'refused');
    assert.equal(c.locks.cl_5.by.id, 'u2', 'and nothing was taken off the holder');
    assert.equal(L.clauseLockTake(c, 'cl_9'), true, 'a free clause is granted');
    assert.equal(c.locks.cl_9.by.id, 'u1');
  });
});

test('f289 (5) letting go is only ever your own', () => {
  const c = { locks: { cl_5: lockedBy('u2', 'Ruth Chege') } };
  asUser({ id: 'u1', name: 'Amina Njoroge' }, () => {
    assert.equal(L.clauseLockRelease(c, 'cl_5'), false, 'a browser that lost a race lets go of nothing');
    assert.ok(c.locks.cl_5, 'and the holder keeps it');
  });
  asUser({ id: 'u2', name: 'Ruth Chege' }, () => {
    assert.equal(L.clauseLockRelease(c, 'cl_5'), true);
    assert.equal(c.locks, undefined, 'an empty map is taken off the record entirely');
  });
});

test('f289 (6) the monogram is what Young wrote, and the initials are the glance', () => {
  assert.equal(L.clauseLockMonogram('Ruth Chege'), 'R. C.');
  assert.equal(L.clauseLockInitials('Ruth Chege'), 'RC');
  assert.equal(L.clauseLockMonogram('Ruth Wanjiru Chege'), 'R. C.',
    'two letters at most — a third turns a glance into a word');
  assert.equal(L.clauseLockMonogram('Ruth'), 'R.');
  assert.equal(L.clauseLockInitials(''), '', 'no name, no monogram');
});

test('f289 (7) sweeping clears the lapsed and keeps the live', () => {
  const c = { locks: {
    a: lockedBy('u2', 'R C', AGO(L.CLAUSE_LOCK_MS + 5)),
    b: lockedBy('u2', 'R C') } };
  L.clauseLockSweep(c);
  assert.deepEqual(Object.keys(c.locks), ['b']);
});

/* ---------------------------------------------------------------- 2. never on
   their seat ---------------------------------------------------------------- */
test('f289 (8) the reading refuses PORTAL_MODE outright', () => {
  const c = { locks: { cl_5: lockedBy('u2', 'Ruth Chege') } };
  const had = 'window' in global; const prev = global.window;
  global.window = { PORTAL_MODE: true, currentUser: () => ({ id: 'u1', name: 'A N' }) };
  try{
    assert.equal(L.clauseLockOf(c, 'cl_5'), null,
      'a colleague\'s initials may never be drawn on the counterparty\'s page');
  } finally { if (had) global.window = prev; else delete global.window; }
});

test('f289 (9) buildSharePayload is an allow-list and does not carry locks', () => {
  const core = read('js/core.js');
  const i = core.indexOf('function buildSharePayload(');
  assert.ok(i > 0, 'the builder is where it says it is');
  /* Bounded at the next top-level declaration so this reads the builder rather
     than the rest of the file. */
  const rest = core.slice(i + 30);
  const j = rest.search(/\n(?:function|const|let|async function) /);
  const body = rest.slice(0, j > 0 ? j : 4000);
  assert.ok(!/\blocks\b/.test(body),
    'who on our side is typing is the most internal fact there is');
});

/* ---------------------------------------------------------------- 3. the sign
   in the pencil's own slot -------------------------------------------------- */
const NEG = read('js/views/negotiation.js');

test('f289 (10) the pencil builder asks the ONE reading, and asks it once', () => {
  const i = NEG.indexOf('function rlClauseEditPillHtml(');
  assert.ok(i > 0);
  const body = NEG.slice(i, NEG.indexOf('\nfunction ', i + 10));
  assert.ok(/clauseLockHeldByOther\(/.test(body),
    'the builder asks who holds the clause, so the four clause branches cannot disagree');
  assert.equal((body.match(/clauseLockHeldByOther\(/g) || []).length, 1,
    'once');
  /* AND THE CONTRACT REACHES IT. A reading handed no contract answers null on
     every clause, which is a lock that never draws — silently. */
  assert.ok(/rlClauseEditPillHtml\(cl, \{ c,/.test(NEG),
    'the one call site passes the contract');
});

test('f289 (11) it draws the monogram AND the line, and is not a control', () => {
  const i = NEG.indexOf('function rlClauseEditPillHtml(');
  const body = NEG.slice(i, NEG.indexOf('\nfunction ', i + 10));
  const k = body.indexOf('if (held){');
  assert.ok(k > 0, 'there is a locked branch');
  const branch = body.slice(k, body.indexOf('const label', k));
  assert.ok(/<span class="rl-cp-lock"/.test(branch), 'it takes the pencil\'s slot');
  assert.ok(!/<button/.test(branch),
    'a control drawn dead is how a reader comes to blame themselves');
  assert.ok(/clauseLockInitials\(/.test(branch), 'the initials Young asked for');
  assert.ok(/clauseLockLine\(/.test(branch), 'and the line');
  assert.ok(/clauseLockTitle\(/.test(branch), 'with the whole name on the hover');
});

test('f289 (12) the sign is drawn where the pencil would be, and the heading gives up its reserve', () => {
  const css = read('js/views/negotiation-css.js');
  assert.ok(/\.redline-page \.rl-cp-lock\{/.test(css), 'it has its own clothes');
  assert.ok(/\.redline-page \.rl-cp-lock\{[^}]*margin-left:auto/.test(css),
    'never parked on the left of a headingless clause — the pencil\'s own recorded reason');
  assert.ok(/\.rl-clause-top:has\(\.rl-cp-lock\) \.rl-clause-h\{padding-right:0\}/.test(css),
    'the reserve is for the pencil, and where the lock draws instead there is none');
  /* THE SHEET'S OWN TYPE, like every other piece of furniture on this paper. */
  assert.ok(/\.redline-page \.rl-cp-lock\{[^}]*var\(--doc-scale/.test(css),
    'the paper scales and so does its furniture');
  /* NOT AMBER: amber on this page means work waiting on the reader. */
  assert.ok(/\.redline-page \.rl-cp-lock\{[^}]*--color-neutral-600/.test(css));
});

/* ---------------------------------------------------------------- 4. the
   editor's door is a wall --------------------------------------------------- */
const CE = read('js/views/clauseeditor.js');

test('f289 (13) the editor refuses a held clause before any state is set', () => {
  const i = CE.indexOf('function rlOpenClauseEditor(');
  const body = CE.slice(i, CE.indexOf('\nfunction rlCloseClauseEditor', i));
  const g = body.indexOf('clauseLockHeldByOther(');
  assert.ok(g > 0, 'the door asks');
  assert.ok(g < body.indexOf('_ceC = probeC'),
    'asked on the probe, so a refusal leaves nothing half-open behind it');
  assert.ok(/cl_locked_refuse/.test(body), 'and it names who holds it');
  assert.ok(/toast\(_cet\('cl_locked_refuse'[\s\S]{0,220}?'warn'\)/.test(body),
    'warn, not err — nothing failed and this is somebody else\'s turn');
});

test('f289 (14) it takes the lock only once the clause is really there', () => {
  const i = CE.indexOf('function rlOpenClauseEditor(');
  const body = CE.slice(i, CE.indexOf('\nfunction rlCloseClauseEditor', i));
  const take = body.indexOf('clauseLockTake(');
  assert.ok(take > 0);
  assert.ok(take > body.indexOf('ce_clause_gone'),
    'a lock on a clause this page then refuses to open would be held by nobody who could let it go');
  assert.ok(/clauseLockSave\(/.test(body),
    'and it reaches the other browser — a lock held in one tab is a note to yourself');
});

test('f289 (15) every door out lets go, and stops the beat first', () => {
  const i = CE.indexOf('function rlCloseClauseEditor(');
  const body = CE.slice(i, i + 1400);
  const beat = body.indexOf('ceLockBeat(true)');
  const rel = body.indexOf('clauseLockRelease(');
  assert.ok(beat > 0 && rel > 0, 'both happen');
  assert.ok(beat < rel, 'a page that closed must not go on holding a clause it let go of');
  assert.ok(rel < body.indexOf('_ceC = null'),
    'released before the state is cleared, or it does not know which clause');
});

test('f289 (16) a pull refreshes the stamp in memory and does NOT save', () => {
  const i = CE.indexOf('function cePullText(');
  const body = CE.slice(i, i + 700);
  assert.ok(/clauseLockKeep\(/.test(body), 'somebody typing keeps the clause');
  assert.ok(!/clauseLockSave\(/.test(body),
    'a save on every blur would be a save on every keystroke\'s worth of hesitation');
});

test('f289 (17) the beat is well under half the window, and is cleared', () => {
  const m = /const CE_LOCK_BEAT_MS = (\d+);/.exec(CE);
  assert.ok(m, 'the beat states its own interval');
  assert.ok(Number(m[1]) < L.CLAUSE_LOCK_MS / 2,
    'a missed tick can never cost the clause');
  assert.ok(/clearInterval\(_ceLockBeat\)/.test(CE), 'and it is cleared');
});

test('f289 (18) a sealed record takes no courtesy write', () => {
  const src = read('js/clauselock.js');
  const i = src.indexOf('function clauseLockSave(');
  const body = src.slice(i, src.indexOf('\n}', i));
  assert.ok(/negoExecuted/.test(body) && /return false/.test(body),
    'aiNoteRead\'s own lesson, one field along');
});

/* ---------------------------------------------------------------- 5. the
   server's wall ------------------------------------------------------------- */
const SRV = read('server/server.js');

test('f289 (19) the server asks the STORED record, never the request body', () => {
  const i = SRV.indexOf('function srvClauseLockClash(');
  const body = SRV.slice(i, SRV.indexOf('\n}', SRV.indexOf('return null;', i)));
  assert.ok(/prev && prev\.locks/.test(body),
    'who holds a clause is the half the person being refused would restate on the way past');
  assert.ok(!/\breq\.body\b/.test(body));
});

test('f289 (20) it is asked as a DIFFERENCE, and only about OUR wording', () => {
  const i = SRV.indexOf('function ourClausesTouched(');
  const body = SRV.slice(i, SRV.indexOf('\n}\n', i));
  assert.ok(/authorSide !== 'counterparty'/.test(body),
    'their proposals arrive through the share routes, which have their own wall');
  assert.ok(/hash/.test(body) && /status/.test(body),
    '"reworded" is a string comparison rather than a judgement');
});

test('f289 (21) the guard sits on the save route and names the holder', () => {
  const i = SRV.indexOf('srvClauseLockClash(prev, c, req.user)');
  assert.ok(i > 0, 'the save route asks it');
  const near = SRV.slice(i, i + 500);
  assert.ok(/status\(403\)/.test(near));
  assert.ok(/Your work is safe/.test(near),
    'the refusal happens before anything is written, so the draft is still in the box');
  assert.ok(/clash\.name/.test(near), 'and it names who holds it');
});

test('f289 (22) ourClausesTouched really is a difference — run it', () => {
  /* Lifted out of the shipped source between named landmarks, so this is the
     server's own arithmetic rather than a description of it. */
  const a = SRV.indexOf('function ourClausesTouched(');
  const b = SRV.indexOf('\n}', SRV.indexOf('return out;', a));
  assert.ok(a > 0 && b > a, 'the landmarks are where they say they are');
  const fn = new Function(SRV.slice(a, b + 2) + '; return ourClausesTouched;')();

  const base = { changes: [{ id: 'CHG-1', clauseId: 'cl_5', hash: 'h1', status: 'pending' }] };
  const same = JSON.parse(JSON.stringify(base));
  assert.equal(fn(base, same).size, 0, 'a save that leaves our changes alone touches nothing');

  const reworded = JSON.parse(JSON.stringify(base));
  reworded.changes[0].hash = 'h2';
  assert.deepEqual([...fn(base, reworded)], ['cl_5'], 'a reworded change names its clause');

  const added = JSON.parse(JSON.stringify(base));
  added.changes.push({ id: 'CHG-2', clauseId: 'cl_9', hash: 'h9', status: 'pending' });
  assert.deepEqual([...fn(base, added)], ['cl_9']);

  const gone = { changes: [] };
  assert.deepEqual([...fn(base, gone)], ['cl_5'], 'and so does one taken away');

  const theirs = { changes: [...base.changes,
    { id: 'CHG-3', clauseId: 'cl_7', hash: 'x', status: 'pending', authorSide: 'counterparty' }] };
  assert.equal(fn(base, theirs).size, 0, 'their proposals are not this rule\'s business');
});

test('f289 (23) the clash refuses a colleague\'s clause and lets every other save through', () => {
  const a = SRV.indexOf('const CLAUSE_LOCK_MS = 120000;');
  const b = SRV.indexOf('\n}', SRV.indexOf('return null;\n}', SRV.indexOf('function srvClauseLockClash(')));
  assert.ok(a > 0 && b > a);
  const fn = new Function(SRV.slice(a, b + 2) + '; return srvClauseLockClash;')();

  const prev = { locks: { cl_5: lockedBy('u2', 'Ruth Chege') },
    changes: [{ id: 'CHG-1', clauseId: 'cl_5', hash: 'h1', status: 'pending' }] };
  const next = JSON.parse(JSON.stringify(prev)); next.changes[0].hash = 'h2';

  const clash = fn(prev, next, { id: 'u1' });
  assert.ok(clash && clash.clauseId === 'cl_5' && clash.name === 'Ruth Chege');
  assert.equal(fn(prev, next, { id: 'u2' }), null, 'the holder is refused nothing');

  const other = JSON.parse(JSON.stringify(prev));
  other.name = 'renamed';
  assert.equal(fn(prev, other, { id: 'u1' }), null,
    'a save that touches no change of ours passes untouched');

  const lapsed = JSON.parse(JSON.stringify(prev));
  lapsed.locks.cl_5.at = AGO(200000);
  assert.equal(fn(lapsed, next, { id: 'u1' }), null, 'a lapsed lock refuses nothing');
});

/* ---------------------------------------------------------------- 6. the
   words --------------------------------------------------------------------- */
test('f289 (24) all four sentences are in BOTH dictionaries', () => {
  const i18 = read('js/i18n.js');
  for (const k of ['cl_locked_by', 'cl_locked_title', 'cl_a_colleague', 'cl_locked_refuse']){
    assert.equal((i18.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
      k + ' is written in English and in Swedish');
  }
  /* The two that carry a name must carry the substitution, or the sentence
     names nobody. */
  assert.ok(/cl_locked_by: 'Locked by \{who\}'/.test(i18));
  assert.ok(/cl_locked_by: 'Låst av \{who\}'/.test(i18));
});

test('f289 (25) the module is on window, or every guard is silence', () => {
  const src = read('js/clauselock.js');
  for (const n of ['clauseLockHeldByOther', 'clauseLockTake', 'clauseLockKeep',
    'clauseLockRelease', 'clauseLockSave', 'clauseLockLine', 'clauseLockTitle',
    'clauseLockInitials'])
    assert.ok(new RegExp('Object\\.assign\\(window,[\\s\\S]*?\\b' + n + '\\b[\\s\\S]*?\\}\\)').test(src),
      n + ' is published — a name read through window and never exported is a guard that is always false');
  assert.ok(/import '\.\/clauselock\.js';/.test(read('js/app.js')),
    'and the app loads it');
});

test('f289 (26) the reading writes nothing', () => {
  const src = read('js/clauselock.js');
  const i = src.indexOf('function clauseLockOf(');
  const body = src.slice(i, src.indexOf('\n}', i));
  assert.ok(!/c\.locks\s*=|c\.locks\[/.test(body.replace(/\)\s*\?\s*c\.locks\[id\]/, '')),
    'a reading that started a lock by being asked would take a clause off a colleague every time a card was drawn');
});
