/* f1007 — THE NOTES FOLLOW THE WORDING
   ====================================
   The owner, 11 Nov 2026: "walk me through … what happens to the notes once
   the counterparty accepts the changes … Do the notes disappear, when does the
   paper update with the latest changes to reflect the accepted changes that
   remove your concerns from the paper?" Then, asked when Jambo should read
   again: "Automatically".

   WHAT WAS TRUE BEFORE: the paper took the agreed words at once (negoResolve →
   negoCommitBody), but the risks, the standards check and the clause review
   went on describing the old words until the next send, or until somebody
   opened Clauses.

   WHAT IS PINNED HERE:
     1 · negoResolve tells js/triage.js after it rewrites the paper
     2 · a contract nobody has read is not read by this door
     3 · no AI key, their page, a viewer, a private stream: nothing is started
     4 · a run of decisions is ONE timer, not one a decision
     5 · the wording did not move: nothing is read
     6 · the wording moved: the arrival readings are made again, once, marked
         `agreed`, and the kept clause review after them, never beside them
     7 · the run stamps `agreed` and the Dossier says so, in both books

   Run: node --test test/f1007-the-notes-follow-the-wording.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ');

const TEXT = 'This Agreement is made between Highland Corporate Ltd and Ventura Capital. '
  + 'The Customer shall pay all rates and charges within thirty days of the invoice date. '.repeat(6);

/* a stage with the arrival-read module, a contract that HAS been read, and the timers held in hand */
function stage(over) {
  const { win } = buildWorld({ triage: true });
  const timers = [];
  win.setTimeout = fn => { timers.push(fn); return timers.length; };
  win.clearTimeout = n => { if (n >= 1) timers[n - 1] = null; };
  win.state = Object.assign(win.state || {}, { aiConfigured: true });
  win.API_MODE = () => true;
  win.canEdit = () => true;
  win.PORTAL_MODE = false;
  const c = { id: 'MK-900', name: 'Warehousing', status: 'Under Review', source: 'upload', upload: { name: 'w.docx', extractedText: TEXT }, changes: [] };
  win.isUpload = x => !!(x && x.upload);
  /* the wording's hasher asks js/dedupe.js for its fingerprint, which this stage does not load: a stand-in that differs when the words do */
  win.playbookHashOf = t => 'h' + String(t).length + ':' + [...String(t)].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
  win.getContract = id => (String(id) === c.id ? c : null);
  const calls = [];
  win.triageAndPaint = (x, o) => { calls.push(['triage', x.id, o || null]); return Promise.resolve({}); };
  win.bdStale = () => false;
  win.bdRun = x => { calls.push(['clauses', x.id]); return Promise.resolve(); };
  Object.assign(win, over || {});
  return { win, c, timers, calls, live: () => timers.filter(Boolean) };
}
const readIt = (win, c) => { c.triage = { at: 'x', steps: {}, hash: win.triageWordingHash(c) }; };
const move = c => { c.upload.extractedText = c.upload.extractedText.replace(/thirty days/g, 'sixty days'); };

describe('f1007 — the notes follow the wording', () => {
  test('1 · negoResolve tells the arrival read after it rewrites the paper', () => {
    const src = strip(read('js/negotiation.js'));
    const at = src.indexOf('function negoResolve(');
    const body = src.slice(at, src.indexOf('\nfunction ', at + 20));
    const commit = body.indexOf('negoCommitBody(c, negoResolvedBody(c))'), tell = body.indexOf('window.triageWordingMoved(c)');
    assert.ok(commit > 0 && tell > commit, 'after the commit');
    assert.match(strip(read('js/triage.js')), /Object\.assign\(window,\s*\{[^}]*\btriageWordingMoved\b/, 'published');
  });

  test('2 · a contract nobody has read is not read by this door', () => {
    const { win, c, live } = stage();
    assert.equal(typeof win.triageWordingHash(c), 'string', 'the stage can hash a wording');
    move(c);
    assert.equal(win.triageWordingMoved(c), false);
    assert.equal(live().length, 0, 'no timer');
  });

  test('3 · no AI key, their page, a viewer, a private stream: nothing is started', () => {
    for (const over of [{ API_MODE: () => false }, { PORTAL_MODE: true }, { canEdit: () => false }, { jamboOnPress: () => true }]) {
      const { win, c, live } = stage(over);
      readIt(win, c); move(c);
      assert.equal(win.triageWordingMoved(c), false, JSON.stringify(Object.keys(over)));
      assert.equal(live().length, 0);
    }
    const s = stage(); s.win.state.aiConfigured = false; readIt(s.win, s.c); move(s.c);
    assert.equal(s.win.triageWordingMoved(s.c), false, 'no key');
  });

  test('4 · a run of decisions is one timer', () => {
    const { win, c, live } = stage();
    readIt(win, c); move(c);
    for (let k = 0; k < 4; k++) assert.equal(win.triageWordingMoved(c), true);
    assert.equal(live().length, 1, 'four decisions, one reading owed');
  });

  test('5 · the wording did not move: nothing is read', async () => {
    const { win, c, live, calls } = stage();
    readIt(win, c);
    assert.equal(win.triageWordingMoved(c), true, 'the question is asked later');
    live()[0]();
    await new Promise(r => setImmediate(r));
    assert.deepEqual(calls, []);
    assert.equal(win.triageMovedDue(c), false);
  });

  test('6 · the wording moved: read again once, marked agreed; the clause review after it', async () => {
    const { win, c, live, calls } = stage({ bdStale: () => true });
    readIt(win, c); move(c);
    assert.equal(win.triageMovedDue(c), true);
    win.triageWordingMoved(c);
    const order = [];
    win.triageAndPaint = (x, o) => { order.push('triage'); calls.push(['triage', x.id, o]); return new Promise(r => setImmediate(() => { order.push('triage done'); r({}); })); };
    win.bdRun = x => { order.push('clauses'); calls.push(['clauses', x.id]); return Promise.resolve(); };
    live()[0]();
    for (let k = 0; k < 6; k++) await new Promise(r => setImmediate(r));
    assert.deepEqual(order, ['triage', 'triage done', 'clauses'], 'in turn, never side by side');
    assert.equal(calls.filter(x => x[0] === 'triage').length, 1);
    assert.equal(calls[0][2].agreed, true);
  });

  test('6b · a reading already running is waited for, not raced', async () => {
    const { win, c, live, calls } = stage();
    readIt(win, c); move(c); c._triaging = true;
    await win.triageMovedRun(c.id);
    assert.deepEqual(calls, []);
    assert.equal(live().length, 1, 'asked again later');
  });

  test('7 · the run stamps `agreed` and the Dossier says so, in both books', () => {
    const tri = strip(read('js/triage.js'));
    assert.match(tri, /if \(opts\.agreed\) t\.agreed = true;/);
    assert.match(strip(read('js/views/contract.js')), /triageRun\(c,\{[^}]*agreed:!!\(opts&&opts\.agreed\)/);
    assert.match(strip(read('js/paperdesk.js')), /c\.triage && c\.triage\.agreed\) \? 'pd2_read_agreed' : 'pd2_read_once'/);
    assert.equal((read('js/i18n.js').match(/^\s*pd2_read_agreed:/gm) || []).length, 2, 'English and Swedish');
  });
});
