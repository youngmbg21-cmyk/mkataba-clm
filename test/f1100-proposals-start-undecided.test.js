'use strict';
/* f1100 — PROPOSALS: NOTHING STARTS DECIDED (owner, 19 Nov 2026: "in the proposal, you have everything starting under us.
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

test('f1100 (1) every duty starts Undecided, whatever Jambo guessed; Undecided is the first button and the lit one', () => {
  const { W, c } = world();
  assert.deepEqual(FOUND.map(o => W.obnWhoseNow(c, o)), ['unsure', 'unsure']);
  const rows = W.obnProjects();
  const d = W.document.createElement('div'); d.innerHTML = W.obnLgHtml(rows[0], rows);
  for (const it of d.querySelectorAll('.obn-lg-it:not(.is-next)')){
    const b = [...it.querySelectorAll('[data-obn-whose]')];
    assert.deepEqual(b.map(x => x.textContent), ['Undecided', 'Us', 'Theirs', 'Both sides']);
    assert.deepEqual(b.filter(x => x.classList.contains('is-on')).map(x => x.textContent), ['Undecided']);
    assert.equal(it.querySelector('.obn-lg-now'), null, 'no side named beside the duty until the reader picks one');
  }
  const t = W.document.createElement('table'); t.innerHTML = W.obnDutyHtml(rows[0], FOUND[0], 0);
  assert.equal(t.querySelector('.obn-wh.is-on').textContent, 'Undecided', 'the list says the same');
});

test('f1100 (2) nothing decided, nothing to add; Add takes only what the reader gave a side', () => {
  const { W, c } = world();
  const rows = W.obnProjects();
  assert.equal(rows[0].ready, 0);
  assert.equal(W.obnReadyOf(c, FOUND), 0);
  const d = W.document.createElement('div'); d.innerHTML = W.obnLgHtml(rows[0], rows);
  assert.equal(d.querySelector('[data-obn-addall]'), null);
  const src = strip(read('js/obligations.js'));
  assert.match(src, /const w = obnWhoseNow\(c, o\); if\(w === 'unsure'\) return; if\(obAddFound\(c, o, w\)\) n\+\+;/, 'Add skips an undecided duty');
});

test('f1100 (3) both books carry the words', () => {
  const i18 = read('js/i18n.js');
  for (const k of ['obd_undecided', 'obn_add_ready_one', 'obn_add_ready_other'])
    assert.equal((i18.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
});
