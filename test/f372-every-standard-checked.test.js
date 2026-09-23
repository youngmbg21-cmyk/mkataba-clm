/* f372 — PREPARE REDLINES CHECKS EVERY STANDARD, AND SAYS HONESTLY WHAT IT
   CHECKED (Young ruled it 23 Sep 2026, off his Warehousing agreement; fix 3 of
   the seven he approved)

   *"I uploaded the attached contract and hati would not prepare redlines and
   gave an answer that everything was clean but even in scanning the contract
   it was clear that some issues where not aligned against the company
   standards and hati did not raise them."* His ruling on what to check: every
   standard on the Our standards page.

   TWO FAULTS UNDER ONE MESSAGE, both reproduced before a line moved:
     · the check read ONE book — four standards for a services agreement — so
       Termination (14 days to cure where the standard is 30) was never asked;
     · "every position is aligned" was `aligned === verdicts.length`, true of
       an EMPTY list, and a Copilot answer cut short by its 2,500-token ceiling
       arrived empty or half-finished and was saved.

     (1) the list is every standard on the page, one row per category
     (2) the model is shown the wording of each standard, one position each
     (3) a cut-short or empty answer is refused and never saved
     (4) a full answer records how many standards it answered
     (5) the rule-based check answers every standard too
     (6) "doesn't apply" is never a departure and never proposed
     (7) "every standard is met" needs a finished check
     (8) a saved check is reused only where it is finished and current
     (9) the server asks for one verdict each, with room for all of them
     (10) the Copilot editor's scan files the same one saved check
     (11) the words, in both books

   A missing name READS AS EMPTY rather than throwing, so a build without the
   fix reports its claims one at a time. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SERVER = read('server/server.js');
const PB = read('js/playbook.js');
const CE = read('js/views/clauseeditor.js');
const I18N = read('js/i18n.js');

const TEXT = 'THIS WAREHOUSING AGREEMENT is made between the Logistics Provider and the Customer. '
  + 'The Customer shall pay each invoice within thirty (30) days of the invoice date. '
  + 'Either Party may terminate this Agreement for material breach not remedied within fourteen (14) days of notice. '
  + 'This Agreement shall be governed by the laws of Kenya. '.repeat(3);

function stage(over = {}){
  const w = buildWorld({ negotiationView: true, contractView: true, playbook: true });
  const win = w.win;
  win.state = { settings: {}, contracts: [], aiConfigured: true };
  win.cKind = () => over.kind || 'Warehousing and Logistics Services Agreement';
  win.API_MODE = () => over.api !== false;
  win.simhash64 = t => 'h' + String(t || '').length + ':' + String(t || '').slice(0, 40);
  w.toasts = []; win.toast = (m, k) => w.toasts.push({ kind: k || 'ok', text: String(m) });
  w.sent = null;
  win.api = async (p, method, body) => { w.sent = { p, body }; return over.answer ? over.answer(body) : { verdicts: [] }; };
  const c = { id: 'MK-STD-1', name: 'Warehousing Agreement', status: 'Under Review', source: 'upload',
    upload: { name: 'w.docx', extractedText: TEXT }, changes: [], audit: [], fields: {}, metadata: {} };
  win.state.contracts.push(c);
  return { w, win, c };
}
const call = (win, name, ...a) => (typeof win[name] === 'function' ? win[name](...a) : null);
const cats = list => (list || []).map(x => x.category).join('|');
/* An answer that says something about every position it was sent. */
const answerAll = (status = 'aligned') => body => ({ verdicts: ((body && body.playbook && body.playbook.positions) || [])
  .map(p => ({ category: p.category, status, quote: '', position: p.note || '' })) });

describe('f372 (1) — the list is every standard on the page', () => {
  test('every clause library category is on it, whatever book the type picks', () => {
    const { win, c } = stage();
    const std = call(win, 'pbStandardsFor', c) || { standards: [] };
    const lib = (call(win, 'clauseLibrary') || []).map(x => x.category);
    assert.ok(lib.length >= 6, 'the page holds its six');
    for (const k of lib) assert.ok(cats(std.standards).split('|').includes(k), k + ' is asked');
  });
  test('Termination is asked of a services agreement, whose book never named it', () => {
    const { win, c } = stage();
    const std = call(win, 'pbStandardsFor', c) || { standards: [] };
    assert.equal(std.key, 'services', 'the premise: the type still picks the services book');
    assert.ok(/\bTermination\b/.test(cats(std.standards)));
  });
  test('one row per category: a book range folds into its standard', () => {
    const { win, c } = stage();
    const std = call(win, 'pbStandardsFor', c) || { standards: [] };
    const liab = std.standards.filter(x => x.category === 'Liability cap');
    assert.equal(liab.length, 1, 'one Liability cap, not a position and a range');
    assert.ok(liab[0].range && liab[0].range.key === 'liabilityMonths', 'carrying the range');
    assert.equal(liab[0].pos, 'required', 'held as hard as the book holds it');
    assert.equal(liab[0].escalate, true);
  });
  test('a category the book adds that the library does not carry is on it too', () => {
    const { win, c } = stage({ kind: 'Raw Material Supply Agreement' });
    const std = call(win, 'pbStandardsFor', c) || { standards: [] };
    assert.ok(/Quality & rejection/.test(cats(std.standards)));
  });
});

describe('f372 (2) — the model is shown each standard\'s own words', () => {
  test('one position per standard, the library wording on it, no bare library id', async () => {
    const { w, win, c } = stage({ answer: answerAll() });
    await call(win, 'runPlaybookReview', c, { quiet: true });
    const pos = (w.sent && w.sent.body && w.sent.body.playbook && w.sent.body.playbook.positions) || [];
    const std = (call(win, 'pbStandardsFor', c) || { standards: [] }).standards;
    assert.equal(pos.length, std.length, 'as many positions as standards');
    assert.equal(((w.sent.body.playbook.ranges) || []).length, 0, 'ranges ride inside their standard');
    const term = pos.find(p => p.category === 'Termination');
    assert.ok(term && /thirty \(30\) days/.test(term.standard), 'the standard\'s own wording');
    const liab = pos.find(p => p.category === 'Liability cap');
    assert.ok(liab && liab.range && liab.range.limit, 'and the figure a range holds it to');
  });
});

describe('f372 (3) — a cut-short or empty answer is refused and never saved', () => {
  test('cut short: a quiet caller is handed the sentence, and nothing to store', async () => {
    const { win, c } = stage({ answer: () => ({ verdicts: [{ category: 'Governing law', status: 'aligned' }], truncated: true }) });
    const r = await call(win, 'runPlaybookReview', c, { quiet: true });
    assert.ok(r && r.error && r.truncated, 'a refusal, marked cut short');
    assert.ok(!r.verdicts, 'no verdicts to store');
    assert.equal(r.error, win.i18t('pb_cut_short'));
  });
  test('cut short: a loud caller sees it once and gets nothing to store', async () => {
    const { w, win, c } = stage({ answer: () => ({ verdicts: [], truncated: true }) });
    const r = await call(win, 'runPlaybookReview', c, {});
    assert.equal(r, null);
    assert.equal(w.toasts.filter(t => t.text === win.i18t('pb_cut_short')).length, 1);
  });
  test('empty: "nothing was checked", never "aligned"', async () => {
    const { win, c } = stage({ answer: () => ({ verdicts: [] }) });
    const r = await call(win, 'runPlaybookReview', c, { quiet: true });
    assert.ok(r && r.error && r.empty);
    assert.equal(r.error, win.i18t('pb_came_back_empty'));
  });
});

describe('f372 (4) — a full answer records how many standards it answered', () => {
  test('standards, checked and which categories', async () => {
    const { win, c } = stage({ answer: answerAll() });
    const r = await call(win, 'runPlaybookReview', c, { quiet: true }) || {};
    const n = (call(win, 'pbStandardsFor', c) || { standards: [] }).standards.length;
    assert.equal(r.standards, n); assert.equal(r.checked, n);
    assert.equal(String((r.categories || []).length), String(n));
  });
  test('a standard the answer skipped is counted as unanswered, not as met', async () => {
    const { win, c } = stage({ answer: body => ({ verdicts: answerAll()(body).verdicts.slice(0, 3) }) });
    const r = await call(win, 'runPlaybookReview', c, { quiet: true }) || {};
    assert.equal(r.checked, 3);
    assert.ok(r.standards > 3);
    assert.equal(call(win, 'pbReviewComplete', r), false);
  });
  test('an answer naming a narrower heading still answers its standard', () => {
    const { win } = stage();
    const got = call(win, 'pbAlignVerdicts', [{ category: 'Termination' }, { category: 'Payment terms' }],
      [{ category: 'Termination for convenience', status: 'deviation' }]) || { checked: 0, verdicts: [] };
    assert.equal(got.checked, 1);
    assert.equal(got.verdicts.length, 1, 'nothing the model said is dropped');
  });
});

describe('f372 (5) — the rule-based check answers every standard', () => {
  test('one verdict per standard, Termination included', () => {
    const { win, c } = stage({ api: false });
    const r = call(win, 'playbookReviewHeuristic', c, TEXT) || { verdicts: [] };
    const n = (call(win, 'pbStandardsFor', c) || { standards: [] }).standards.length;
    assert.equal(r.verdicts.length, n);
    assert.equal(r.checked, n);
    const term = r.verdicts.find(v => v.category === 'Termination');
    assert.ok(term && term.status === 'aligned' && /terminate/.test(term.quote));
  });
});

describe('f372 (6) — "doesn\'t apply" is never a departure and never proposed', () => {
  test('the one reading of what is work', () => {
    const { win } = stage();
    const open = s => !!call(win, 'pbVerdictOpen', { status: s });
    assert.equal([open('deviation'), open('missing'), open('aligned'), open('na'), open('ok')].join(','),
      'true,true,false,false,false');
    /* A word no engine here writes stays WORK, as the old reading kept it —
       a check that drops what it cannot read is the fault this closes. */
    assert.equal(open('deviates'), true);
  });
  test('the proposal list skips it, and an older record\'s "ok"', () => {
    const { win, c } = stage();
    const items = call(win, 'rlPlaybookProposals', c, { verdicts: [
      { category: 'Payment terms', status: 'na', quote: '' },
      { category: 'Governing law', status: 'ok', quote: '' }] }) || [{}];
    assert.equal(items.length, 0);
  });
  test('the panel draws it in grey and calls it what it is', () => {
    assert.match(PB, /na:\s*\{ bg:'var\(--st-gray-bg\)'/);
    const { win } = stage();
    assert.equal(call(win, 'pbVerdictWords', { status: 'na', position: 'x' }), win.i18t('pb_na_line'));
  });
});

describe('f372 (7) — "every standard is met" needs a finished check', () => {
  test('an EMPTY check is not a clean one — the reported fault', () => {
    const { win } = stage();
    const say = call(win, 'rlPbOutcomeSay', { verdicts: [] }) || {};
    assert.notEqual(say.text, win.i18t('ng_pb_all_aligned', { n: 0 }));
    assert.equal(say.kind, 'warn');
  });
  test('a finished check with nothing open says so, with the count', () => {
    const { win } = stage();
    const say = call(win, 'rlPbOutcomeSay', { verdicts: [{ status: 'aligned' }, { status: 'na' }], standards: 2, checked: 2 }) || {};
    assert.equal(say.kind, 'ok');
    assert.equal(say.text, win.i18t('ng_pb_all_aligned', { n: 2 }));
  });
  test('a check that answered some of them says how many, and is not a clean bill', () => {
    const { win } = stage();
    const say = call(win, 'rlPbOutcomeSay', { verdicts: [{ status: 'aligned' }], standards: 6, checked: 1 }) || {};
    assert.equal(say.kind, 'warn');
    assert.equal(say.text, win.i18t('ng_pb_partly_checked', { k: 1, n: 6 }));
  });
  test('the green pill is drawn only over a finished check', () => {
    const { win } = stage();
    const pill = sm => String(call(win, 'pbHeadPill', sm) || '');
    assert.match(pill({ total: 3, ok: true, complete: true, dev: 0, miss: 0, esc: 0 }), /all aligned/);
    assert.doesNotMatch(pill({ total: 3, ok: true, complete: false, dev: 0, miss: 0, esc: 0 }), /all aligned/);
    assert.doesNotMatch(pill({ total: 3, ok: true, complete: null, dev: 0, miss: 0, esc: 0 }), /all aligned/);
  });
});

describe('f372 (8) — a saved check is reused only where it is finished and current', () => {
  test('finished, current and covering the page: reused', async () => {
    const { win, c } = stage({ answer: answerAll() });
    c.playbook = await call(win, 'runPlaybookReview', c, { quiet: true });
    assert.equal(call(win, 'pbReviewUsable', c), true);
  });
  test('the wording moved since: run again', async () => {
    const { win, c } = stage({ answer: answerAll() });
    c.playbook = await call(win, 'runPlaybookReview', c, { quiet: true });
    c.upload.extractedText = TEXT + ' A new sentence.';
    assert.equal(call(win, 'pbReviewUsable', c), false);
  });
  test('a check filed before every standard was asked: run again', () => {
    const { win, c } = stage();
    c.playbook = { key: 'services', label: 'Services', source: 'ai', verdicts: [{ category: 'Governing law', status: 'aligned' }] };
    assert.equal(call(win, 'pbReviewUsable', c), false);
  });
});

describe('f372 (9) — the server asks for one verdict each, with room for all', () => {
  test('"does not apply" is an answer the tool can give', () => {
    assert.match(SERVER, /enum: \['aligned','deviation','missing','na'\]/);
  });
  test('the ceiling is sized to what was asked, not a flat 2,500', () => {
    const fn = SERVER.slice(SERVER.indexOf('async function aiPlaybookVerdicts'), SERVER.indexOf("app.post('/api/ai/playbook'"));
    assert.doesNotMatch(fn, /max_tokens: 2500/);
    assert.match(fn, /max_tokens: pbReviewTokens\(asked\)/);
    assert.match(fn, /EXACTLY ONE verdict/);
  });
  test('and the route says when the answer was cut short, as a fact', () => {
    assert.match(SERVER, /res\.json\(\{ verdicts: r\.verdicts, truncated: !!\(r\.resp && r\.resp\.truncated\)/);
  });
});

describe('f372 (10) — the Copilot editor\'s scan files the one saved check', () => {
  test('ceRunScan writes the review onto the record, and the rail reads the record', () => {
    const fn = CE.slice(CE.indexOf('async function ceRunScan'), CE.indexOf('ONE SENTENCE AT A TIME'));
    assert.match(fn, /_ceC\.playbook = rev;/);
    assert.match(fn, /persist\(_ceC\)/);
  });
});

describe('f372 (11) — the words, in both books', () => {
  test('every new key is in English and Swedish', () => {
    for (const k of ['pb_cut_short', 'pb_came_back_empty', 'pb_na_line', 'pb_checked_of', 'ng_pb_all_aligned_old',
      'ng_pb_partly_checked', 'ng_pb_checked', 'ng_pb_checked_basic', 'ng_prepare_nothing_filed'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k);
  });
});
