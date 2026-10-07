/* f554 — THE REVIEW DESK (work order O, part 6, 7 Oct 2026; O-31..O-35)
   (1) Copilot's one reading carries kind, whose job, clause, amount and
       document; an answer outside the lists is dropped, never guessed; the
       browser and server lists are equal (O-31).
   (2) the desk groups by kind with counts; nothing arrives ticked; a group
       tick then "Add N ticked" adds exactly those (O-32).
   (3) an item Copilot marks as theirs is stored as theirs (O-34).
   (4) Skip is remembered for this wording, survives a re-read, and Undo
       brings it back; changed wording starts fresh (O-35).
   (5) the door says "Review N proposed" with the desk's own number, and the
       tile counts only what is left (O-35).
   (6) Edit before adding opens the form you know, with its own two words (O-33).
   (7) every new word is in both books. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const OB = fs.readFileSync(path.join(ROOT, 'js', 'obligations.js'), 'utf8');
const SRV = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;

const FOUND = [
  { desc: 'Pay each invoice within 30 days', due: '', recurring: 'monthly', kind: 'dated', party: 'us', clause: '6.2', amount: 120000, quote: 'within thirty (30) days' },
  { desc: 'Deliver the quarterly sales report', recurring: 'quarterly', kind: 'dated', party: 'them', clause: '9.1', quote: 'quarterly report' },
  { desc: 'Notify a security breach within 48 hours', kind: 'event', party: 'both', clause: '12.4', quote: 'within 48 hours' },
  { desc: 'Keep product liability insurance in force', kind: 'standing', party: 'them', clause: '14.1', doc: true, quote: 'maintain insurance' },
  { desc: 'Something Copilot could not place', quote: 'x' }];
function world(){
  const { win } = buildWorld({ obligations: true, triage: true });
  win.state = win.state || {}; win.state.contracts = [];
  const c = { id: 'MK-9', name: 'Supply', counterparty: 'Delta LLC', status: 'Signed', obligations: [], audit: [], fields: {} };
  win.state.contracts.push(c);
  win.triageWordingHash = () => 'H1';
  win.persist = () => {};
  win.toast = () => {};
  return { win, c };
}

test('f554 (1) the lists are one list on both hosts, and the server drops what is not on them', () => {
  assert.match(OB, /const OB_KINDS = \['dated', 'event', 'standing'\];/);
  assert.match(SRV, /const OB_KINDS_SRV = \['dated', 'event', 'standing'\];/);
  assert.match(OB, /const OB_WHOSE = \['us', 'them', 'both'\];/);
  assert.match(SRV, /const OB_WHOSE_SRV = \['us', 'them', 'both'\];/);
  const { win } = world();
  assert.equal(win.obKindOf({ kind: 'weekly' }), 'unsure', 'a kind not on the list is not sure');
  assert.equal(win.obKindOf({ due: '2026-11-05' }), 'dated', 'a stated date is what dated means');
  assert.equal(win.obWhoseOf({}), 'unsure');
});

describe('f554 (1b) the route carries the five facts', () => {
  let h, ai, W;
  before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base }); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); await ai.stop(); });
  test('kind, whose job, clause, amount and document reach the window', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 't1', name: 'list_obligations', input: { obligations: [
      { desc: 'Pay within 30 days', kind: 'dated', party: 'us', clause: '6.2', amount: 120000, doc: false, quote: 'thirty days' },
      { desc: 'Hold insurance', kind: 'sometimes', party: 'nobody', quote: 'insurance' }] } }]);
    const r = await W.admin.json('/api/ai/obligations', { method: 'POST', body: { text: 'x'.repeat(400), ours: 'HaTi Ltd', theirs: 'Delta LLC' } });
    assert.equal(r.obligations.length, 2);
    const [a, b] = r.obligations;
    assert.equal(a.kind, 'dated'); assert.equal(a.party, 'us'); assert.equal(a.clause, '6.2'); assert.equal(a.amount, 120000); assert.equal(a.doc, false);
    assert.equal(b.kind, undefined, 'a kind off the list is dropped — the desk says Not sure');
    assert.equal(b.party, undefined);
  });
});

test('f554 (2) the desk groups, counts, and adds exactly what was ticked', () => {
  const { win, c } = world();
  win.openObligationsReview(c, FOUND);
  const d = win.document;
  assert.ok(d.getElementById('obd'), 'the desk');
  assert.match(d.querySelector('.obd-sub').textContent, /found 5/);
  const boxes = [...d.querySelectorAll('[data-ob-pick]')];
  assert.equal(boxes.length, 5);
  assert.ok(boxes.every(b => !b.checked), 'nothing arrives ticked');
  assert.equal(d.querySelectorAll('.obd-grp').length, 4, 'dated · event · standing · not sure');
  assert.match(d.getElementById('obd-count').textContent, /5 to decide · 0 added · 0 skipped/);
  const g = d.querySelector('[data-obd-group="dated"]'); g.checked = true;
  g.dispatchEvent(new win.Event('change', { bubbles: true }));
  assert.equal(d.getElementById('or-add').textContent, 'Add 2 ticked');
  d.getElementById('or-add').click();
  assert.equal(c.obligations.length, 2, 'exactly the two ticked');
});

test('f554 (3) an item marked theirs is stored as theirs, with its amount and document', () => {
  const { win, c } = world();
  win.openObligationsReview(c, FOUND);
  const d = win.document;
  [1, 3, 0].forEach(i => { const b = d.querySelector(`[data-ob-pick="${i}"]`); b.checked = true; b.dispatchEvent(new win.Event('change', { bubbles: true })); });
  d.getElementById('or-add').click();
  const by = t => c.obligations.find(o => o.desc === t);
  assert.equal(by('Deliver the quarterly sales report').party, 'theirs');
  assert.equal(by('Keep product liability insurance in force').party, 'theirs');
  assert.ok(by('Keep product liability insurance in force').doc, 'a document they must hold');
  assert.equal(by('Pay each invoice within 30 days').party, 'ours');
  assert.equal(by('Pay each invoice within 30 days').amount, 120000);
  assert.ok(win.obligationIsTheirs(by('Deliver the quarterly sales report')), 'the reminder runs read it as theirs');
});

test('f554 (4) Skip stays skipped for this wording; Undo; a new wording starts fresh', () => {
  const { win, c } = world();
  win.openObligationsReview(c, FOUND);
  const d = win.document;
  d.querySelector('[data-obd-sel="2"]').click();
  d.querySelector('[data-obd-skip]').click();
  assert.equal(win.obReviewTally(c, FOUND).skipped, 1);
  win.closeModal();
  win.openObligationsReview(c, FOUND);
  assert.match(win.document.getElementById('obd-count').textContent, /4 to decide · 0 added · 1 skipped/, 'a re-read does not bring it back');
  assert.equal(JSON.stringify(c.obReview.skipped), JSON.stringify(['notify a security breach within 48 hours']));
  win.document.querySelector('[data-obd-sel="2"]').click();
  win.document.querySelector('[data-obd-undo]').click();
  assert.equal(win.obReviewTally(c, FOUND).skipped, 0, 'Undo');
  win.document.querySelector('[data-obd-sel="2"]').click();
  win.document.querySelector('[data-obd-skip]').click();
  win.triageWordingHash = () => 'H2';
  assert.equal(win.obReviewTally(c, FOUND).skipped, 0, 'changed wording starts fresh');
});

test('f554 (5) the door and the tile count only what is left', () => {
  const { win, c } = world();
  c.triage = { at: '2026-10-01T00:00:00Z', steps: { oblig: { ok: true, found: FOUND.slice() } } };
  assert.equal(win.obReviewWaiting(c).length, 5);
  assert.equal(win.obFindWord(c), 'Review 5 proposed');
  win.openObligationsReview(c, FOUND);
  ['0', '1'].forEach(i => { win.document.querySelector(`[data-obd-sel="${i}"]`).click(); win.document.querySelector('[data-obd-skip]').click(); });
  assert.equal(win.obFindWord(c), 'Review 3 proposed', 'the door says the desk\'s own number');
  const tile = win.triageTiles(c).find(t => t.key === 'oblig');
  assert.equal(tile.count, 3);
  assert.equal(tile.headKey, 'tri_t_oblig_review');
  assert.match(tile.detail, /^1 on an event · 1 standing · 1 not sure/);
  [2, 3, 4].forEach(i => { win.document.querySelector(`[data-obd-sel="${i}"]`).click(); win.document.querySelector('[data-obd-skip]').click(); });
  assert.equal(win.obFindWord(c), 'Find obligations', 'all decided: the door reads anew');
  const t2 = win.triageTiles(c).find(t => t.key === 'oblig');
  assert.equal(t2.headKey, 'tri_t_oblig_sorted');
  assert.match(t2.detail, /0 added · 5 skipped/);
});

test('f554 (6) Edit before adding opens the form you know, with "Add obligation" and "Back to the list"', () => {
  const { win, c } = world();
  win.getUsers = () => [];
  win.openObligationsReview(c, FOUND);
  win.document.querySelector('[data-obd-sel="1"]').click();
  win.document.querySelector('[data-obd-edit]').click();
  const d = win.document;
  assert.ok(d.getElementById('of-desc'), 'the existing form');
  assert.equal(d.getElementById('of-desc').value, 'Deliver the quarterly sales report');
  assert.equal(d.getElementById('of-save').textContent.trim(), 'Add obligation');
  assert.equal(d.getElementById('of-cancel').textContent.trim(), 'Back to the list');
  d.getElementById('of-cancel').click();
  assert.ok(d.getElementById('obd'), 'back at the desk');
  assert.ok(d.querySelector('[data-obd-sel="1"].is-sel'), 'on the same item');
});

test('f554 (7) every new word is in both books', () => {
  for (const k of ['obd_sub_one', 'obd_sub_other', 'obd_f_all', 'obd_g_dated', 'obd_g_event', 'obd_g_standing', 'obd_g_already', 'obd_to_decide_one',
    'obd_add', 'obd_edit', 'obd_skip', 'obd_both_line', 'obd_foot', 'obd_add_all_other', 'obd_add_ob', 'obd_back', 'obd_review_n_other',
    'obd_split_dated', 'obd_sorted_line', 'tri_t_oblig_review', 'tri_t_oblig_sorted'])
    assert.ok(inBoth(k), k);
});
