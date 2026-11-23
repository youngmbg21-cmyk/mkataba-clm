'use strict';
/* f1102 — PROPOSALS: NOTHING STARTS DECIDED (owner, 19 Nov 2026: "in the proposal, you have everything starting under us.
   There should be a first button that says undecided. build this").
   Every duty Jambo found shows Undecided · Us · Theirs · Both sides, Undecided lit, in Jambo's panel and in the list;
   Jambo's guess lights nothing; the tag beside the duty's name shows only a side the reader chose; Add adds only what
   the reader gave a side (obnReadyOf), never an undecided duty as ours.
   AT THE PARENT every test here fails: a duty starts as "Us", there is no Undecided button and no obnReadyOf. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const FOUND = [
  { desc: 'Keep the warehouse insured', quote: 'The Supplier shall maintain insurance.', clause: '4.2', party: 'them' },
  { desc: 'Pay storage fees monthly', quote: 'The Customer shall pay the storage fees monthly.', clause: '6.1', party: 'us' }];
function world(){
  const W = buildWorld({ obligations: true }).win;
  const c = { id: 'MK-U1', name: 'Warehousing Services', counterparty: 'Juno Logistics', folder: 'proc', status: 'Signed',
    obligations: [], metadata: {}, triage: { steps: { oblig: { ok: true, found: FOUND.map(o => Object.assign({}, o)) } } } };
  const st = W.eval('typeof state !== "undefined" ? state : (window.state = { contracts: [], settings: {} })'); (st.contracts = st.contracts || []).push(c);
  if (typeof W.triageHeldObligations !== 'function') W.triageHeldObligations = x => ((x.triage && x.triage.steps.oblig.found) || []).filter(o => !W.obligationAlreadyOn(x, o));
  W.canAccessFolder = () => true;
  return { W, c };
}

test('f1102 (1) every duty starts Undecided, whatever Jambo guessed; Undecided is the first button and the lit one', () => {
  const { W, c } = world();
  assert.deepEqual(FOUND.map(o => W.obnWhoseNow(c, o)), ['unsure', 'unsure']);
  const rows = W.obnProjects();
  const d = W.document.createElement('div'); d.innerHTML = W.obnLgHtml(rows[0], rows);
  /* RE-POINTED 23 Nov 2026 (owner, "Duties, end to end"): whose duty is asked in the sheet on the agreement's Duties page,
     where it starts unchosen (f1187 (2)); this panel names no side and offers no button to answer it */
  for (const it of d.querySelectorAll('.obn-lg-it:not(.is-next)')){
    assert.equal(it.querySelectorAll('[data-obn-whose]').length, 0);
    assert.equal(it.querySelector('.obn-lg-now'), null, 'no side named beside the duty until the reader picks one');
  }
});

test('f1102 (2) nothing decided, nothing to add; Add takes only what the reader gave a side', () => {
  const { W, c } = world();
  const rows = W.obnProjects();
  assert.equal(rows[0].ready, 0);
  assert.equal(W.obnReadyOf(c, FOUND), 0);
  const d = W.document.createElement('div'); d.innerHTML = W.obnLgHtml(rows[0], rows);
  assert.equal(d.querySelector('[data-obn-addall]'), null);
  /* RE-POINTED 23 Nov 2026: no mass add at all — the Add all handler is gone; each duty goes through the sheet */
  const src = strip(read('js/obligations.js'));
  assert.doesNotMatch(src, /closest\('\[data-obn-addall\]'\)/, 'no Add all');
});

test('f1102 (3) both books carry the words', () => {
  const i18 = read('js/i18n.js');
  for (const k of ['obd_undecided', 'obn_add_ready_one', 'obn_add_ready_other'])
    assert.equal((i18.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
});

/* (4)–(5) the owner, 19 Nov 2026, with two pictures: "for these rings, differentiate the colors between us and theirs" and
   "the obligations are redundant as they are already in the side panel. Delete them" */
test('f1102 (4) the ring and the bar paint each decided duty in its side\'s colour: ours amber, theirs steel', () => {
  const { W, c } = world();
  c.obligations.push({ id: 'x', desc: FOUND[0].desc, party: 'theirs', status: 'open' });
  W.obReviewMark(c, FOUND[0], 'added');
  const all = FOUND.concat([{ desc: 'Return the pallets', quote: 'q' }]);
  assert.deepEqual(Object.assign({}, W.obnSidesOf(c, all)), { us: 0, them: 1, both: 0, skip: 0 });
  const sides = { us: 2, them: 1, both: 0, skip: 1 };
  const d = W.document.createElement('div'); d.innerHTML = W.obnRingHtml(sides, 8) + W.obnBarHtml(sides, 8);
  const bg = d.querySelector('.obn-ring').getAttribute('style');
  assert.match(bg, /--st-amber-dot\) 0\.00% 25\.00%.*--st-steel-dot\) 25\.00% 37\.50%.*--st-gray-dot\) 37\.50% 50\.00%.*--color-neutral-100\) 50\.00% 100/);
  assert.deepEqual([...d.querySelectorAll('.obn-bar2 i')].map(i => i.className), ['is-us', 'is-them', 'is-skip']);
  assert.equal(d.querySelector('.obn-ring span').textContent, '4/8');
});

test('f1102 (5) the duties are answered in the panel only: no Open pill, no duty lines under the row', () => {
  const { W } = world();
  const rows = W.obnProjects();
  const t = W.document.createElement('tbody'); t.innerHTML = W.obnProjRowHtml(rows[0]);
  assert.equal(t.querySelectorAll('tr').length, 1);
  assert.equal(t.querySelector('[data-obn-open]'), null);
  assert.equal(typeof W.obnDutyHtml, 'undefined');
});
