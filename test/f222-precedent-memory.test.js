/* ============================================================
   F222 — precedent memory (W3-2, the gap-map order)
   ============================================================
   Every negotiation this workspace has run is already on the record —
   what was asked, by whom, on which clause, and how it ended — and until
   now nothing read it back. So the same argument was had from scratch every
   time, and the playbook went on stating a line the company had quietly
   stopped holding.

   The rules pinned here:
   - IT IS DETERMINISTIC. Counting is not a job for a model, and a
     recommendation about the company's own standards must be checkable by
     the admin asked to confirm it. No AI call is involved anywhere.
   - PER WORKSPACE, NEVER ACROSS CUSTOMERS. It reads state.contracts — the
     caller's own scoped bootstrap — and nothing else.
   - WITHDRAWN IS NOT REFUSED. The side that asked took it back, which says
     nothing about whether the other side would have agreed; counting it as
     a refusal would flatter our own position every time somebody changed
     their mind.
   - IT SUGGESTS THE FALLBACK, NEVER THE PREFERRED POSITION. A preferred
     position is an aspiration and history cannot argue with one; a fallback
     is the line actually held, which is the thing the record knows best.
   - NOTHING IS WRITTEN WITHOUT AN ADMIN. A suggestion is evidence and a
     button.
   - AND IT NEVER SHOWS ON THE COUNTERPARTY'S PAGE: how far we have bent
     before is the most useful thing an opponent could read. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* A book with real argued history: payment fought five times and settled at
   45 twice, liability fought and held, one withdrawn ask that must count as
   neither, and one still-pending ask that is not precedent yet. */
const change = (o) => ({
  id: o.id, clauseId: o.clauseId || 'c1', clauseLabel: o.label || '',
  oldText: o.oldText || '', newText: o.newText || '',
  status: o.status, withdrawn: !!o.withdrawn,
  authorSide: o.side || 'counterparty', author: o.author || 'Them',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z',
  why: o.why || null,
});
const contract = (id, counterparty, changes) => ({
  id, name: id + ' agreement', counterparty, status: 'Signed', folder: 'proc',
  fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [],
  signatures: [], comments: [], changes, negotiation: { round: 2 },
});

function world() {
  const w = buildWorld({});
  const src = read('js/precedent.js');
  w.win.eval(src);
  return w;
}
/* buildWorld deliberately defines no `state` — a test supplies the book it
   wants read, which is exactly the shape precedent.js expects to find. */
function withBook(w, contracts) { w.win.state = { contracts, settings: {} }; return w.win; }

const BOOK = [
  contract('MK-P1', 'Kabras Sugar', [
    change({ id: 'CHG-1', label: 'Payment terms', status: 'accepted', side: 'counterparty',
      oldText: 'within thirty (30) days', newText: 'within forty-five (45) days' }),
    change({ id: 'CHG-2', label: 'Liability cap', status: 'rejected', side: 'counterparty',
      oldText: 'capped at twelve (12) months fees', newText: 'capped at three (3) months fees' }),
  ]),
  contract('MK-P2', 'Kabras Sugar', [
    change({ id: 'CHG-3', label: 'Payment terms', status: 'accepted', side: 'counterparty',
      oldText: 'within thirty (30) days', newText: 'within forty-five (45) days' }),
    change({ id: 'CHG-4', label: 'Payment terms', status: 'rejected', side: 'counterparty',
      oldText: 'within thirty (30) days', newText: 'within ninety (90) days' }),
  ]),
  contract('MK-P3', 'Nandi Dairy', [
    change({ id: 'CHG-5', label: 'Payment terms', status: 'accepted', side: 'owner',
      oldText: 'within sixty (60) days', newText: 'within forty-five (45) days' }),
    change({ id: 'CHG-6', label: 'Payment terms', status: 'accepted', side: 'counterparty',
      withdrawn: true, oldText: 'x', newText: 'within one hundred (100) days' }),
    change({ id: 'CHG-7', label: 'Confidentiality', status: 'pending', side: 'counterparty',
      oldText: 'three (3) years', newText: 'one (1) year' }),
  ]),
];

describe('F222 — the reading', () => {
  test('it counts settled asks per standard, per side', () => {
    const win = withBook(world(), BOOK);
    const m = win.precedentMine();
    assert.equal(m.payment.theirs.accepted, 2, 'they asked for 45 days twice and got it');
    assert.equal(m.payment.theirs.refused, 1, 'and asked for 90 once and did not');
    assert.equal(m.payment.ours.accepted, 1, 'our own settled ask counts on our side');
    assert.equal(m.liability.theirs.refused, 1);
    assert.equal(m.liability.theirs.accepted, 0);
  });

  test('a WITHDRAWN ask is neither agreed nor refused', () => {
    const win = withBook(world(), BOOK);
    const m = win.precedentMine();
    const total = m.payment.theirs.accepted + m.payment.theirs.refused + m.payment.ours.accepted + m.payment.ours.refused;
    assert.equal(total, 4, 'the five payment asks minus the withdrawn one');
    assert.ok(!m.payment.numbers.theirsAccepted.includes(100),
      'and its figure never reaches the arithmetic — it would flatter us every time somebody changed their mind');
  });

  test('a PENDING ask is not precedent yet', () => {
    const win = withBook(world(), BOOK);
    const m = win.precedentMine();
    assert.equal(m.conf.total, 0, 'nothing has been settled about confidentiality');
  });

  test('the figures come off the wording that was actually agreed', () => {
    const win = withBook(world(), BOOK);
    const m = win.precedentMine();
    /* Spread into THIS realm before comparing: the array is built inside the
       jsdom sandbox, so a strict deep-equal fails on the Array prototype
       rather than on the values. */
    assert.deepEqual([...m.payment.numbers.theirsAccepted].sort(), [45, 45]);
    assert.deepEqual([...m.payment.numbers.oursAccepted], [45]);
  });

  test('it narrows to one counterparty with the same arithmetic', () => {
    const win = withBook(world(), BOOK);
    const all = win.precedentMine();
    const kabras = win.precedentMine({ counterparty: 'Kabras Sugar' });
    assert.equal(all.payment.theirs.accepted, 2);
    assert.equal(kabras.payment.theirs.accepted, 2);
    assert.equal(kabras.payment.ours.accepted, 0, 'Nandi Dairy is somebody else');
    const nandi = win.precedentMine({ counterparty: 'Nandi Dairy' });
    assert.equal(nandi.payment.ours.accepted, 1);
  });

  test('the topic is read from the clause label first, then the wording', () => {
    const win = withBook(world(), []);
    assert.equal(win.precedentTopicOf({ clauseLabel: 'Payment terms' }).key, 'payment');
    assert.equal(win.precedentTopicOf({ clauseLabel: '', newText: 'aggregate liability is capped' }).key, 'liability');
    assert.equal(win.precedentTopicOf({ clauseLabel: 'Delivery schedule', newText: 'pallets by Tuesday' }), null,
      'a change belonging to no standard is not forced into one');
  });
});

describe('F222 — what it suggests, and what it refuses to suggest', () => {
  test('a repeated settled figure becomes a fallback suggestion', () => {
    const win = withBook(world(), BOOK);
    const sug = win.precedentSuggestions();
    const pay = sug.find(s => s.key === 'payment');
    assert.ok(pay, 'payment has been settled enough times to say something');
    assert.equal(pay.figure, 45, 'the line actually held, repeatedly');
    assert.equal(pay.category, 'Payment terms');
    assert.ok(pay.contracts.length >= 2, 'and it names the contracts it was read from');
  });

  test('one deal is an anecdote — it says nothing below the floor', () => {
    const thin = [contract('MK-T1', 'Someone', [
      change({ id: 'CHG-9', label: 'Payment terms', status: 'accepted',
        oldText: 'thirty (30) days', newText: 'within forty-five (45) days' })])];
    const win = withBook(world(), thin);
    assert.equal(win.precedentSuggestions().length, 0,
      'a standard changed on the strength of one contract is not a standard');
  });

  test('a figure seen once among many is not "the line held"', () => {
    const odd = BOOK.concat([contract('MK-P4', 'One Off', [
      change({ id: 'CHG-10', label: 'Payment terms', status: 'accepted',
        oldText: 'x', newText: 'within one hundred and twenty (120) days' })])]);
    const win = withBook(world(), odd);
    const pay = win.precedentSuggestions().find(s => s.key === 'payment');
    assert.equal(pay.figure, 45, 'the one deal everybody regrets does not become the standard');
  });

  test('it suggests nothing where the library already says so', () => {
    const win = withBook(world(), BOOK);
    win.state.settings = { clauseLibrary: [
      { id: 'cl-pay', category: 'Payment terms', name: 'x', preferred: 'p', fallback: 'Payment within forty-five (45) days.' },
    ] };
    win.clauseById = id => (win.state.settings.clauseLibrary.find(x => x.id === id) || null);
    const sug = win.precedentSuggestions();
    assert.ok(!sug.some(s => s.key === 'payment'),
      'a suggestion that changes nothing is noise');
  });
});

describe('F222 — the sentence, and the seat it is never said in', () => {
  test('it names the counterparty, the count and what was conceded', () => {
    const win = withBook(world(), BOOK);
    const c = BOOK[0];
    const line = win.precedentLine(win.precedentForChange(c, c.changes[0]));
    assert.match(line, /Kabras Sugar/);
    assert.match(line, /Payment terms/);
    assert.match(line, /agreed 2/);
    assert.match(line, /held 1/);
    assert.match(line, /45 days/, 'and the figure it settled at');
  });

  test('it says nothing where there is no history', () => {
    const win = withBook(world(), []);
    assert.equal(win.precedentForChange({ counterparty: 'Nobody' }, { clauseLabel: 'Payment terms' }), null);
    assert.equal(win.precedentLine(null), '');
  });

  test('THE COUNTERPARTY NEVER SEES IT — the wall is the seat, not the wording', () => {
    const neg = read('js/views/negotiation.js');
    const i = neg.indexOf('data-rl-precedent');
    assert.ok(i > 0, 'the line is drawn');
    const around = neg.slice(i - 900, i + 200);
    assert.match(around, /side !== 'counterparty' && !PORTAL_MODE/,
      'how far we have bent before is the most useful thing an opponent could read');
  });

  test('it reads this workspace and nothing else', () => {
    const src = read('js/precedent.js');
    assert.match(src, /window\.state&&Array\.isArray\(state\.contracts\)/,
      'the caller\'s own already-scoped bootstrap');
    assert.ok(!/\bapi\(|fetch\(/.test(src), 'no route, no cross-tenant reading — and there must never be one');
    assert.ok(!/ai\//.test(src), 'and no model: counting is not a job for one');
  });

  test('adopting is an admin act, through the ordinary write', () => {
    const set = read('js/views/settings.js');
    const fn = set.slice(set.indexOf('async function precedentAdopt'), set.indexOf('function renderClauseLibrary'));
    assert.match(fn, /confirmDialog/, 'moving the line the company holds asks first');
    assert.match(fn, /saveClauseLibrary\(lib\)/, 'and writes the way hand-editing the clause would');
    const panel = set.slice(set.indexOf('function renderPrecedentPanel'), set.indexOf('async function precedentAdopt'));
    assert.match(panel, /if\(!sug\.length\)\{ host\.innerHTML=''; return; \}/,
      'with nothing to say it draws nothing at all');
  });

  test('the words exist in both languages', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['pc_title', 'pc_sub', 'pc_line', 'pc_adopt', 'pc_adopt_q', 'pc_adopted', 'pc_current_none'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
