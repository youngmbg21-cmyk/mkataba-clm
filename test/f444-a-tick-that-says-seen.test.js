/* ============================================================
   f444 — A TICK THAT SAYS "SEEN" (Young asked 3 Oct 2026)
   ============================================================
   "Build ... idea number 1" — from the teamwork review: *a small tick on a
   note that means "I have read it and it is fine", without having to write a
   reply. The tick shows who gave it.*

   THE CLAIMS:
     1  `seen` is a list of {id, name, at}, absent until somebody ticks, and
        negoNoteSee is the ONE writer — one entry per person however many
        times they press, and un-ticking takes out their own and nobody else's
     2  negoNoteSeenByMe asks the id first and the name second
     3  IT IS NEVER A DECISION: no audit line is written, nothing on the
        contract moves, and a tick does not mark a note done
     4  THE WALL — `seen` is not on the server's msgMeta allow-list and not on
        the share payload, so it cannot reach the other side; the drawer
        refuses to draw it on their seat
     5  the tick is on EVERY note, not only a thread's first one, and who has
        ticked is said beside it
     6  both books carry every word

   Run: node --test test/f444-a-tick-that-says-seen.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEGO = read('js/negotiation.js');
const VIEW = read('js/views/negotiation.js');
const I18N = read('js/i18n.js');
const SERVER = read('server/server.js');
const CORE = read('js/core.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const ME = { id: 'u_me', name: 'Amina Yusuf', role: 'legal', email: 'amina@mk.co.ke' };
const MATE = { id: 'u_mate', name: 'Wanjiru Kamau', role: 'legal', email: 'w@mk.co.ke' };
const contract = () => ({ id: 'MK-444', name: 'Supply Agreement', counterparty: 'Saw Sawa Ltd',
  status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [],
  versions: [], signatures: [], comments: [], value: 4800000 });

function bench(user = ME){
  const w = buildWorld({ user, negotiationView: true, canEdit: true });
  w.win.getUsers = () => [ME, MATE];
  w.win.persist = () => {};
  return w;
}

describe('f444 (1) one writer, one entry per person', () => {
  test('absent until somebody ticks', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'Finance are happy with 45 days.');
    assert.equal(n.seen, undefined);
    /* Length, not a whole-array compare: the array is built in the harness's
       own realm, so deepStrictEqual fails on the prototype, not the facts. */
    assert.equal(w.win.negoNoteSeenBy(n).length, 0);
    assert.equal(w.win.negoNoteSeenByMe(n, ME), false);
  });

  test('ticking twice is still one tick', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'one');
    w.win.negoNoteSee(c, null, n, true, ME);
    w.win.negoNoteSee(c, null, n, true, ME);
    assert.equal(w.win.negoNoteSeenBy(n).length, 1, 'one entry, not two');
    assert.equal(w.win.negoNoteSeenBy(n)[0].name, ME.name);
    assert.ok(w.win.negoNoteSeenBy(n)[0].at, 'and it carries when');
  });

  test('two people each leave their own, and un-ticking takes only yours', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'one');
    w.win.negoNoteSee(c, null, n, true, ME);
    w.win.negoNoteSee(c, null, n, true, MATE);
    assert.equal(w.win.negoNoteSeenBy(n).length, 2);
    w.win.negoNoteSee(c, null, n, false, ME);
    const left = w.win.negoNoteSeenBy(n);
    assert.equal(left.length, 1, 'mine went');
    assert.equal(left[0].name, MATE.name, 'theirs stayed');
    w.win.negoNoteSee(c, null, n, false, MATE);
    assert.equal(n.seen, undefined, 'the last one out removes the field, never leaves []');
  });

  test('somebody with no name cannot tick', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'one');
    assert.equal(w.win.negoNoteSee(c, null, n, true, { id: 'x', name: '  ' }), null);
    assert.equal(n.seen, undefined);
  });
});

describe('f444 (2) whose tick it is', () => {
  test('the id wins over a stale name', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'one');
    w.win.negoNoteSee(c, null, n, true, { id: ME.id, name: 'Old Name' });
    assert.equal(w.win.negoNoteSeenByMe(n, ME), true);
    assert.equal(w.win.negoNoteSeenByMe(n, MATE), false);
  });

  test('and the name answers where there is no id', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'one');
    w.win.negoNoteSee(c, null, n, true, { id: null, name: MATE.name });
    assert.equal(w.win.negoNoteSeenByMe(n, MATE), true);
  });
});

describe('f444 (3) a tick is never a decision', () => {
  test('it writes no audit line', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'one');
    const before = (c.audit || []).length;
    w.win.negoNoteSee(c, null, n, true, ME);
    assert.equal((c.audit || []).length, before,
      'a tick per reader per note would bury the trail that records what was agreed');
  });

  test('and it does not mark the note done, or move the contract', () => {
    const w = bench(); const c = contract();
    const n = w.win.negoPostComment(c, null, 'one');
    const was = JSON.stringify({ s: c.status, v: c.value, ch: c.changes || null });
    w.win.negoNoteSee(c, null, n, true, ME);
    assert.equal(n.done, undefined, 'seen is not done');
    assert.equal(JSON.stringify({ s: c.status, v: c.value, ch: c.changes || null }), was);
  });

  test('the writer itself calls nothing that writes a trail', () => {
    const i = NEGO.indexOf('function negoNoteSee(');
    const fn = strip(NEGO.slice(i, NEGO.indexOf('\n/* Every note on this contract', i)));
    assert.doesNotMatch(fn, /logAudit/, 'no audit line');
    assert.doesNotMatch(fn, /api\(|fetch\(|negoPostToChannel/, 'and nothing leaves the building');
  });
});

describe('f444 (4) the wall: it never travels', () => {
  test('the server’s message allow-list does not name it', () => {
    const i = SERVER.indexOf('function msgMeta');
    const fn = SERVER.slice(i, SERVER.indexOf('\n}', i));
    assert.doesNotMatch(fn, /\bseen\b/, 'a field the allow-list does not name cannot cross');
  });

  test('the share payload does not carry it either', () => {
    const i = CORE.indexOf('function buildSharePayload');
    const fn = strip(CORE.slice(i, i + 20000));
    assert.doesNotMatch(fn, /\bseen\s*:/, 'nothing writes a seen field onto the payload');
  });

  test('the drawer refuses to draw the tick on their seat', () => {
    const i = VIEW.indexOf('function rlNpNoteHtml');
    const fn = VIEW.slice(i, VIEW.indexOf('\nfunction ', i + 10));
    assert.match(fn, /!PORTAL_MODE && window\.negoNoteSeenBy/, 'the reading stands down');
    assert.match(fn, /ctx\.mayWrite && !PORTAL_MODE\) \? `<button[^`]*rl-np-seen/,
      'and so does the button');
  });
});

describe('f444 (5) on every note, and said out loud', () => {
  test('the tick is not gated on being a thread’s first note', () => {
    const i = VIEW.indexOf('function rlNpNoteHtml');
    const fn = VIEW.slice(i, VIEW.indexOf('\nfunction ', i + 10));
    const tick = fn.slice(fn.indexOf('data-rl-np-seen') - 400, fn.indexOf('data-rl-np-seen'));
    assert.doesNotMatch(tick, /&& root\b/,
      'Done is on the root because it settles a thread; a reply is read too');
  });

  test('who ticked is printed beside it', () => {
    const i = VIEW.indexOf('function rlNpNoteHtml');
    const fn = VIEW.slice(i, VIEW.indexOf('\nfunction ', i + 10));
    assert.match(fn, /rl-np-seenby/, 'the names have a home');
    assert.match(fn, /ng_np_seen_by/, 'through one key');
    assert.match(fn, /ng_np_seen_you/, 'and your own tick reads as you');
  });

  test('the press is armed on every tick drawn', () => {
    const i = VIEW.indexOf('function rlNpWireActs');
    const fn = VIEW.slice(i, VIEW.indexOf('\nasync function rlNpSetGiven', i));
    assert.match(fn, /querySelectorAll\('\[data-rl-np-seen\]'\)/);
    assert.match(fn, /negoNoteSee\(c, home, m, on\)/, 'through the one writer');
    assert.match(fn, /persist\(c\)/, 'and the record is saved');
  });
});

describe('f444 (6) both books', () => {
  for (const k of ['ng_np_seen', 'ng_np_seen_by', 'ng_np_seen_you', 'ng_np_seen_on_t', 'ng_np_seen_off_t'])
    test(k + ' is in English and Swedish', () => {
      const hits = (I18N.match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length;
      assert.equal(hits, 2, k + ' found ' + hits);
    });
});
