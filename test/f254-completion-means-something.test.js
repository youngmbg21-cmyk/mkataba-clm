/* f254 — COMPLETION MEANS SOMETHING (owner-asked 29 Aug 2026, J-2.2)
   ========================================================================
   An obligation had two states — open and done — and nothing else. So there
   was no answer to "was it met on time", and the Insights obligations page
   said exactly that on its own data object (`canSeeCompletedOn:false`). And a
   QUARTERLY duty ticked off ended for ever: `recurring` was stored, printed on
   the row, and read by nothing at all.

   WHAT IS PINNED HERE:
     1  six fields, and ABSENT MEANS UNKNOWN for every one of them
     2  a completion carries a date and a person, and the date may move BACK
     3  a repeating duty opens EXACTLY ONE next instance, with its OWN id
     4  …and that id is why its reminders fire — proved against a real server,
        because the dedupe key is where this silently fails
     5  the on-time figure counts only what can answer
     6  the two blind spots on the Insights page close
     7  every screen draws identically for a record carrying none of it
     8  both languages
   ======================================================================== */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');
const { startHatiWithMail, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const OB_CODE = strip(read('js/obligations.js'));
const IG_CODE = strip(read('js/views/intelligence.js'));
const SRV = read('server/server.js');
const I18N = read('js/i18n.js');

const isoDay = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

function bench(obs){
  const w = buildWorld({ intelView: true, contractView: true });
  const win = w.win;
  const c = supplyContract({ id: 'MK-OB-2', obligations: obs || [] });
  const roster = [{ id: 'u1', name: 'Wanjiku Kamau', email: 'wanjiku@hati.test', role: 'admin' }];
  win.state = Object.assign(win.state || {}, { contracts: [c], activeId: c.id });
  win.getUsers = () => roster;
  win.currentUser = () => roster[0];
  win.getContract = id => (win.state.contracts.find(x => x.id === id) || null);
  return { w, win, c };
}

/* ================================================ 1 — SIX FIELDS, NO MIGRATION */
describe('f254 (1) — absent means unknown, and nothing is inferred', () => {
  test('an obligation completed before this phase keeps the truth it has', () => {
    const { win } = bench();
    const old = { id: 'o1', desc: 'Filed last year', due: isoDay(-400), status: 'done' };
    assert.equal(win.obligationOnTime(old), null,
      'done, on a day nobody wrote down — and no date is invented for it');
    assert.equal(win.obState(old), 'done', 'and every existing reading is unmoved');
    assert.equal(old.completedAt, undefined);
  });

  test('and one with no due date cannot answer either', () => {
    const { win } = bench();
    assert.equal(win.obligationOnTime({ status: 'done', completedAt: isoDay(-2) }), null);
  });

  test('on time is a comparison of two dates on the record, nothing more', () => {
    const { win } = bench();
    assert.equal(win.obligationOnTime({ due: isoDay(-5), completedAt: isoDay(-9), status: 'done' }), true);
    assert.equal(win.obligationOnTime({ due: isoDay(-9), completedAt: isoDay(-5), status: 'done' }), false);
    assert.equal(win.obligationOnTime({ due: isoDay(-5), completedAt: isoDay(-5), status: 'done' }), true,
      'the day it was due is on time');
  });

  test('the date goes through the normaliser, like every other date here', () => {
    /* An obligation due "31 March 2027" gives NaN through a raw comparison and
       is never overdue — the fault this file's own dateOnly exists for. */
    const { win } = bench();
    assert.equal(win.obligationOnTime({ due: '31 March 2027', completedAt: '1 January 2027', status: 'done' }), true);
  });
});

/* ================================================ 2 — THE COMPLETION */
describe('f254 (2) — a completion carries a date and a person', () => {
  test('completing records both, and the audit line says when', () => {
    const { win, c } = bench([{ id: 'o1', desc: 'Insurance certificate', due: isoDay(3), status: 'open' }]);
    win.toggleObligation(c, 0, { from: 'test' });
    const o = c.obligations[0];
    assert.equal(o.status, 'done');
    assert.equal(o.completedAt, isoDay(0), 'today, because that is the day it was ticked');
    assert.equal(o.completedBy, 'Wanjiku Kamau');
    assert.ok((c.audit || []).some(a => /Completed/.test(a.detail || '') && (a.detail || '').includes(isoDay(0))));
  });

  test('the date may be moved BACK but never forward', () => {
    /* Things are ticked off late, and a completion dated after today is a
       claim about work nobody has done yet. */
    const { win, c } = bench([{ id: 'o1', desc: 'x', due: isoDay(0), status: 'open' }]);
    win.toggleObligation(c, 0, { at: isoDay(-6) });
    assert.equal(c.obligations[0].completedAt, isoDay(-6), 'back is honoured');
    win.toggleObligation(c, 0);                       // reopen
    win.toggleObligation(c, 0, { at: isoDay(9) });    // and forward
    assert.equal(c.obligations[0].completedAt, isoDay(0), 'forward falls back to today');
  });

  test('a reference is kept, and an empty one is not written at all', () => {
    const { win, c } = bench([
      { id: 'o1', desc: 'x', due: isoDay(0), status: 'open' },
      { id: 'o2', desc: 'y', due: isoDay(0), status: 'open' }]);
    win.toggleObligation(c, 0, { note: '  REF/2026/118  ' });
    win.toggleObligation(c, 1, { note: '   ' });
    assert.equal(c.obligations[0].completedNote, 'REF/2026/118');
    assert.equal(c.obligations[1].completedNote, undefined, 'nothing drawn is nothing stored');
  });

  test('REOPENING CLEARS IT — a record may not claim a completion it has undone', () => {
    const { win, c } = bench([{ id: 'o1', desc: 'x', due: isoDay(0), status: 'open' }]);
    win.toggleObligation(c, 0, { note: 'REF' });
    win.toggleObligation(c, 0);
    const o = c.obligations[0];
    assert.equal(o.status, 'open');
    assert.equal(o.completedAt, undefined);
    assert.equal(o.completedBy, undefined);
    assert.equal(o.completedNote, undefined);
  });

  test('a viewer still cannot complete one', () => {
    const { win, c } = bench([{ id: 'o1', desc: 'x', due: isoDay(0), status: 'open' }]);
    win.canEdit = () => false;
    assert.equal(win.toggleObligation(c, 0), null);
    assert.equal(c.obligations[0].status, 'open');
  });
});

/* ================================================ 3 — THE SERIES */
describe('f254 (3) — a repeating duty opens the next one', () => {
  test('one cadence step from the DATE IT WAS DUE, never from the tick', () => {
    const { win } = bench();
    const at = (due, every) => win.obligationNextDue({ due, recurring: every });
    assert.equal(at('2026-01-15', 'monthly'), '2026-02-15');
    assert.equal(at('2026-01-15', 'quarterly'), '2026-04-15');
    assert.equal(at('2026-01-15', 'annual'), '2027-01-15');
    assert.equal(at('2026-01-31', 'monthly'), '2026-02-28', 'the month is clamped, not overflowed');
    assert.equal(at('2026-01-15', 'none'), null, 'a one-off opens nothing');
    assert.equal(at('', 'quarterly'), null, 'and a duty with no date has no next date');
  });

  test('EXACTLY ONE instance, with its OWN id, and the series is tied both ways', () => {
    const { win, c } = bench([{ id: 'ob_first', desc: 'Quarterly report',
      due: isoDay(-3), recurring: 'quarterly', status: 'open', assignee: 'Wanjiku Kamau' }]);
    win.toggleObligation(c, 0, {});
    assert.equal(c.obligations.length, 2, 'one, not two and not none');
    const [first, next] = c.obligations;
    assert.notEqual(next.id, first.id, 'its own id — the reminder dedupe keys on it');
    assert.equal(next.seriesId, 'ob_first');
    assert.equal(first.seriesId, 'ob_first', 'and the one it came from stands for the duty');
    assert.equal(next.status, 'open');
    assert.equal(next.completedAt, undefined, 'a fresh instance carries no completion');
    assert.equal(next.desc, first.desc);
    assert.equal(next.assignee, first.assignee, 'and the same person still owes it');
  });

  test('the next one may arrive overdue, and that is true rather than tidy', () => {
    /* Skipping forward to the next date in the future would quietly erase a
       missed quarter. Somebody is behind, and the page should say so. */
    const { win, c } = bench([{ id: 'ob_1', desc: 'x', due: '2020-01-15',
      recurring: 'quarterly', status: 'open' }]);
    win.toggleObligation(c, 0, {});
    assert.equal(c.obligations[1].due, '2020-04-15');
    assert.equal(win.obState(c.obligations[1]), 'overdue');
  });

  test('a one-off opens nothing, and reopening opens nothing either', () => {
    const { win, c } = bench([{ id: 'ob_1', desc: 'x', due: isoDay(0), status: 'open' }]);
    win.toggleObligation(c, 0, {});
    assert.equal(c.obligations.length, 1);
    const r = bench([{ id: 'ob_2', desc: 'y', due: isoDay(0), recurring: 'monthly', status: 'done' }]);
    r.win.toggleObligation(r.c, 0, {});
    assert.equal(r.c.obligations.length, 1, 'reopening is not a completion');
  });

  test('THE DIALOG NAMES IT BEFORE THE PRESS, off the same builder', () => {
    /* Two functions working out what the next one looks like would be two
       answers, and the reader would be shown one and filed the other. */
    const dlg = OB_CODE.match(/function openObligationDone\(c, i\)\{[\s\S]*?\n\}/)[0];
    assert.match(dlg, /const next = obligationNextInstance\(o\)/);
    assert.match(dlg, /i18t\('ob_done_next', \{ date: next\.due \}\)/);
    const verb = OB_CODE.match(/function toggleObligation\(c, i, opts=\{\}\)\{[\s\S]*?\n\}/)[0];
    assert.match(verb, /obligationNextInstance\(o\)/, 'and the verb files what was shown');
  });
});

/* ================================================ 4 — THE SERVER */
describe('f254 (4) — the new instance is reminded about', () => {
  let h, W, mail;
  const MEMBER = 'Unrestricted Legal';
  const EMAIL = 'everything@example.co.ke';
  /* The save route is optimistic-locked, so a second write to the same record
     has to carry the version it is building on — which is also what the
     browser does. `v` is passed by the caller because these tests deliberately
     write the SAME contract twice: once as it stood, once as completing an
     instance leaves it. */
  const put = (id, obligations, v = 0) => W.admin.json('/api/contracts/' + id,
    { method: 'PUT', body: { baseVersion: v, contract: {
      id, name: 'Supply — ' + id, counterparty: 'Savannah Consumer Goods Limited',
      status: 'Signed', fields: {}, metadata: {}, obligations,
      audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
  const run = () => W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
  const about = d => mail.sent.filter(m => (m.subject + ' ' + m.text).includes(d));
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const settle = async (pred, ms = 2000) => {
    const end = Date.now() + ms;
    while (Date.now() < end && !pred()) await pause(25);
    await pause(150);
  };

  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); mail = h.mail; });
  after(async () => { await h.stop(); });

  test('THE DEDUPE KEY IS WHERE THIS SILENTLY FAILS, so it is proved on a real server', async () => {
    /* The sweep keys on `${contract}:ob:${o.id || due}:soon`. An instance
       minted without a fresh id inherits the previous one's rows and its
       reminders never fire — no error, no log, just silence. */
    await put('MK-SER-1', [{ id: 'ob_q1', desc: 'Series quarterly filing',
      due: isoDay(7), status: 'open', assignee: MEMBER, recurring: 'quarterly' }]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Series quarterly filing').length >= 1);
    assert.equal(about('Series quarterly filing').length, 1, 'the first instance is nudged');

    /* THE SHAPE IS THE PRODUCT'S OWN, NOT A HAND-WRITTEN COPY OF IT.
       Written out by hand this whole block passed on the parent commit, where
       obligationNextInstance does not exist: what it proved was the server
       property "an obligation with a distinct id gets its own dedupe row",
       which was true before this job. The two halves are joined now — the
       browser's real verb produces the array, the server is then given exactly
       that — so deleting obligationNextInstance turns this red. */
    const { win, c: bc } = bench([
      { id: 'ob_q1', desc: 'Series quarterly filing', due: isoDay(-2), status: 'open',
        assignee: MEMBER, recurring: 'quarterly' }]);
    win.toggleObligation(bc, 0, { at: isoDay(-2) });
    const madeByTheProduct = JSON.parse(JSON.stringify(bc.obligations));
    assert.equal(madeByTheProduct.length, 2, 'the verb opened the next instance');
    assert.notEqual(madeByTheProduct[1].id, madeByTheProduct[0].id, 'with an id of its own');
    /* Its date is one cadence step from the date it was DUE, so it lands in
       the future; the sweep's seven-day rung is what this measures. */
    madeByTheProduct[1].due = isoDay(7);
    await put('MK-SER-1', madeByTheProduct, 1);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Series quarterly filing').length >= 1);
    const got = about('Series quarterly filing');
    assert.equal(got.length, 1, 'the NEW instance is nudged, on its own dedupe row');
    assert.equal(got[0].to, EMAIL);
  });

  test('…and reusing the old id is what would have silenced it', async () => {
    /* The control, so the claim above is attributable to the fresh id rather
       than to anything else on the record. */
    await put('MK-SER-2', [{ id: 'ob_same', desc: 'Reused identity filing',
      due: isoDay(7), status: 'open', assignee: MEMBER, recurring: 'quarterly' }]);
    mail.reset();
    await run();
    await settle(() => about('Reused identity filing').length >= 1);
    assert.equal(about('Reused identity filing').length, 1);

    await put('MK-SER-2', [
      { id: 'ob_same', desc: 'Reused identity filing', due: isoDay(-2), status: 'done', assignee: MEMBER },
      /* the same id again, which is the mistake */
      { id: 'ob_same', desc: 'Reused identity filing', due: isoDay(7), status: 'open', assignee: MEMBER },
    ], 1);
    mail.reset();
    await run();
    await pause(600);
    assert.equal(about('Reused identity filing').length, 0,
      'silence — which is exactly why the instance is minted with its own id');
  });

  test('a completion date on the record does not change what the sweep sends', async () => {
    /* Every new field is additive. The sweep reads status and due, and must
       not have learned anything from this phase. */
    const fn = SRV.match(/\(full\.obligations \|\| \[\]\)\.forEach\(o => \{[\s\S]{0,400}/)[0];
    assert.match(fn, /if \(o\.status === 'done'\) return;/);
    assert.ok(!/completedAt/.test(fn), 'the sweep reads none of the new fields');
  });
});

/* ================================================ 5 — THE SCAN STAMP */
describe('f254 (5) — the contract remembers that it was read', () => {
  test('the stamp is a day and a fingerprint of the wording that was read', () => {
    const { win, c } = bench();
    assert.equal(c.obligationsReadAt, undefined, 'absent until something reads it');
    win.obligationsReadStamp(c, 'A contract with quite enough words in it to fingerprint properly, '
      + 'repeated so the shingles have something to chew on, repeated so the shingles have something.');
    assert.equal(c.obligationsReadAt, isoDay(0), 'the day it was read');
    /* THE HASH IS THE SMALLER HALF AND MAY BE ABSENT. simhash64 is the
       product's own fingerprint and lives in js/dedupe.js; on a stage without
       that file the stamp keeps its DATE and carries no hash, which is a
       smaller fact rather than a wrong one. Asserted BOTH ways rather than
       assumed, because "it happened to be loaded" is not a claim. */
    if (typeof win.simhash64 === 'function') assert.ok(c.obligationsReadHash, 'and against which wording');
    else assert.equal(c.obligationsReadHash, undefined, 'and no hash is invented without the fingerprint');
  });

  test('IT IS STAMPED BY THE SCAN AND BY NOTHING ELSE', () => {
    /* A stamp written anywhere else would claim a reading that never happened,
       which is the exact fault the Insights page reported as a blind spot. */
    const hits = (OB_CODE.match(/obligationsReadStamp\(/g) || []).length;
    assert.equal(hits, 2, 'one definition, one caller');
    const run = OB_CODE.match(/async function runFindObligations\(c\)\{[\s\S]*?\n\}/)[0];
    assert.match(run, /obligationsReadStamp\(c, _obText\)/);
    assert.match(run, /_obText\.length>=120/,
      'and never where there was nothing to read — extractObligations refuses '
      + 'a document under 120 characters, and a stamp there would record a '
      + 'reading of something that could not be read');
  });
});

/* ================================================ 6 — THE BLIND SPOTS CLOSE */
describe('f254 (6) — the Insights page can see both now', () => {
  const stage = obs => {
    const w = buildWorld({ intelView: true });
    const win = w.win;
    win.getUsers = () => ([{ id: 'u1', name: 'Amina Otieno', email: 'amina@example.co.ke' }]);
    win.state = { contracts: [
      { id: 'A', name: 'A', status: 'Signed', counterparty: 'X', obligations: obs || [] },
      { id: 'B', name: 'B', status: 'Signed', counterparty: 'X', obligations: [], obligationsReadAt: isoDay(-4) },
      { id: 'C', name: 'C', status: 'Signed', counterparty: 'X', obligations: [] },
    ] };
    return win.intelObligationsData();
  };

  test('a contract with nothing on file splits: read and clear, or no record of a reading', () => {
    const d = stage([{ id: 'o1', desc: 'x', due: isoDay(3), status: 'open' }]);
    assert.equal(d.cover.none, 2);
    assert.equal(d.cover.noneClear, 1, 'B carries a stamp');
    assert.equal(d.cover.noneUnknown, 1, 'C carries none — which is not the same as "never"');
    assert.equal(d.canSeeScan, true);
  });

  test('the on-time figure counts only what can answer, and prints the rest', () => {
    const d = stage([
      { id: 'o1', desc: 'early', due: isoDay(-5), completedAt: isoDay(-9), status: 'done' },
      { id: 'o2', desc: 'late',  due: isoDay(-9), completedAt: isoDay(-5), status: 'done' },
      { id: 'o3', desc: 'older', due: isoDay(-9), status: 'done' },
      { id: 'o4', desc: 'undated', completedAt: isoDay(-1), status: 'done' },
    ]);
    assert.equal(d.ontime.on, 1);
    assert.equal(d.ontime.late, 1);
    assert.equal(d.ontime.unknown, 2, 'neither counted, and no date inferred for either');
    assert.equal(d.canSeeCompletedOn, true);
  });

  test('and the footer stops listing a blind spot it can see', () => {
    const html = IG_CODE.match(/const blind=`<section[\s\S]*?<\/section>`;/)[0];
    assert.match(html, /d\.canSeeScan\?\[\]:/, 'drawn only while it is still true');
    assert.match(html, /d\.canSeeCompletedOn\?\[\]:/);
    assert.match(html, /int_ob_blind_3/, 'and the one that is deliberate stays');
  });

  test('it BORROWS the reading rather than re-deriving it', () => {
    assert.match(IG_CODE, /window\.obligationOnTime==='function'\)\?obligationOnTime\(o\)/,
      'a second copy of "was it on time" is how two screens come to disagree');
  });
});

/* ================================================ 7 — NOTHING ELSE MOVED */
describe('f254 (7) — a record carrying none of it draws exactly as before', () => {
  test('the readings are unmoved on an old record', () => {
    const { win } = bench();
    const old = { id: 'o1', desc: 'x', due: isoDay(-2), status: 'open' };
    assert.equal(win.obState(old), 'overdue');
    assert.equal(win.obligationBand(old), 'overdue');
    assert.equal(win.obligationParty(old), 'ours');
    assert.equal(win.obligationSeriesId(old), 'o1');
  });

  test('and obligations still never travel to the counterparty', () => {
    const share = strip(read('js/negotiation.js')) + strip(read('js/core.js'));
    const fn = share.match(/function buildSharePayload\([\s\S]*?\n\}/);
    if (fn) assert.ok(!/obligations/.test(fn[0]), 'the payload never touches them');
  });

  test('they are still editable after execution', () => {
    /* A quarterly report starts mattering AFTER signature, which is the whole
       point. Nothing in this phase may narrow that. */
    const CT = strip(read('js/views/contract.js'));
    assert.match(CT, /kind==='oblig'/, 'the Checks panel still exempts them from the signed guard');
    assert.ok(!/EXECUTED_IMMUTABLE[\s\S]{0,200}obligations/.test(strip(read('server/server.js'))),
      'and the server still does not freeze them');
  });
});

/* ================================================ 8 — BOTH LANGUAGES */
describe('f254 (8) — both languages', () => {
  const KEYS = ['ob_done_title', 'ob_done_when', 'ob_done_when_why', 'ob_done_note',
    'ob_done_note_ph', 'ob_done_next', 'ob_done_go', 'ob_done_unknown', 'ob_done_by',
    'int_ob_cov_split_known', 'int_ob_time_lead2', 'int_ob_time_on', 'int_ob_time_late',
    'int_ob_time_none', 'int_ob_time_unknown', 'int_ob_time_aria'];
  test('every key is written twice and the two are not the same words', () => {
    for (const k of KEYS){
      const hits = [...I18N.matchAll(new RegExp('^    ' + k + ": '([^']*)'", 'gm'))].map(m => m[1]);
      assert.equal(hits.length, 2, `${k} is missing from one dictionary`);
      assert.notEqual(hits[0], hits[1], `${k} is untranslated`);
    }
  });
  test('the dialog reads in the reader’s language', () => {
    const { win } = bench();
    win.langSet('sv', { repaint: false });
    assert.equal(win.i18t('ob_done_go'), 'Markera klart');
    win.langSet('en', { repaint: false });
  });
});
