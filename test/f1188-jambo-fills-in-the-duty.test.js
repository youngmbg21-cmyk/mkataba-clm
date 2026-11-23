'use strict';
/* f1188 — JAMBO FILLS IN THE DUTY, A PERSON DECIDES (owner, 23 Nov 2026: "is there an AI / jambo opportunity here to reduce
   manual work?" → the drawing "Jambo fills in the duty, you decide" → "build 1, 2 and 3").
   (1) DATES: the due day from the duty's words and the contract's own end date, with the line saying how; a standing duty
       says it names no date; nothing guessed.
   (2) WHOSE: Jambo's reading under the choices with Use …; nothing is chosen until the press, which chooses.
   (3) PAST CHOICES: what the reader did with the same kind of duty on their other contracts.
   (4) No AI call, nothing written by the readings; both books; the Handbook.
   At the parent every part fails (the readings are new). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
function world(){
  const { win } = buildWorld({ obligations: true, triage: true });
  win.state = win.state || {}; win.state.contracts = [];
  const c = { id: 'MK-9', name: 'Supply', counterparty: 'Delta LLC', status: 'Signed', expiry: '2027-06-30', obligations: [], audit: [], fields: {} };
  const o = { id: 'MK-8', name: 'Older', status: 'Signed', obligations: [{ id: 'x1', desc: 'Keep stock insurance in force', party: 'theirs', status: 'open', doc: {} }], audit: [] };
  const p = { id: 'MK-7', name: 'Oldest', status: 'Signed', obligations: [{ id: 'x2', desc: 'Hold public liability insurance', party: 'theirs', status: 'open', doc: {} }], audit: [] };
  win.state.contracts.push(c, o, p);
  win.triageWordingHash = () => 'H1'; win.persist = () => {}; win.toast = () => {}; win.getUsers = () => [];
  return { win, c };
}
const RENEW = { desc: 'Review renewal options at least 3 months before expiry', quote: 'The parties shall review renewal options no later than three (3) months before expiry of the Initial Term.', clause: '15.2', party: 'both', kind: 'event' };
const INSURE = { desc: 'Maintain goods-in-custody insurance', quote: 'AIT shall maintain goods-in-custody insurance.', clause: '11.1', party: 'them', kind: 'standing', doc: true };

test('f1188 (1) the date is worked out from the contract\'s own end date, and says how; none guessed', () => {
  const { win, c } = world();
  const h = win.dutyDateHint(c, RENEW);
  assert.equal(h.due, '2027-03-30', 'three months before 30 Jun 2027');
  assert.match(h.from, /3 months before the end date on this contract/);
  assert.match(h.from, /§15\.2/);
  const s = win.dutyDateHint(c, INSURE);
  assert.equal(s.due, '', 'a standing duty has no date');
  assert.match(s.from, /names no date/);
  const none = win.dutyDateHint(Object.assign({}, c, { expiry: '' }), RENEW);
  assert.equal(none.due, '', 'no end date on the contract: nothing guessed');
  assert.equal(win.dutyDateHint(c, { desc: 'Invoice charges monthly in arrears', quote: 'monthly', clause: '7.1' }).recurring, 'monthly');
});
test('f1188 (2) Jambo\'s reading is shown with Use …; nothing is chosen until the press', () => {
  const { win, c } = world();
  c.triage = { at: '2026-11-01T00:00:00Z', steps: { oblig: { ok: true, found: [INSURE] } } };
  win.openDutiesPage(c, [INSURE], {});
  const d = win.document;
  d.querySelector('[data-dtp-first]').click();
  assert.match(d.querySelector('.dts-jb').textContent, /Jambo reads Theirs \(§11\.1\)/);
  assert.equal(d.querySelectorAll('.dts-ov [data-of-party][aria-pressed="true"]').length, 0, 'nothing pre-chosen');
  assert.equal(d.getElementById('of-save').disabled, true);
  d.querySelector('[data-of-use]').click();
  assert.equal(d.querySelector('.dts-ov [data-of-party][aria-pressed="true"]').getAttribute('data-of-party'), 'theirs');
  assert.equal(d.getElementById('of-save').disabled, false, 'Use is the reader\'s press');
  assert.match(d.querySelector('.dts-past').textContent, /On 2 other contracts you added this kind of duty as Theirs, with proof kept\./);
  assert.match(d.getElementById('of-due-from').textContent, /names no date/);
});
test('f1188 (3) past choices: skipped more than added says so; another topic says nothing', () => {
  const { win, c } = world();
  win.state.contracts.slice(1).forEach(o => { o.obligations = []; o.obReview = { skipped: ['provide warehousing and transportation services'] }; });
  assert.match(win.dutyPastSay(c, { desc: 'Deliver the services', quote: 'shall deliver' }), /You skipped this kind of duty on 2 other contracts\./);
  assert.equal(win.dutyPastSay(c, { desc: 'Something unusual', quote: 'x' }), '');
});
test('f1188 (4) no AI call, nothing written; both books; the Handbook', () => {
  const OB = R('js/obligations.js');
  const region = OB.slice(OB.indexOf('const DUTY_TOPICS'), OB.indexOf('/* THE ONE DOOR: every way in'));
  assert.doesNotMatch(region, /api\(|fetch\(|persist\(|\.push\(\{|obligations\s*=/, 'the readings read only');
  const I = R('js/i18n.js');
  for (const k of ['dts_use', 'dts_jb_reads', 'dts_from_months_other', 'dts_from_always', 'dts_past_added_other', 'dts_past_added_proof_other', 'dts_past_skipped_other'])
    assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  assert.match(R('js/handbook.js'), /Jambo fills in what he can/);
});
