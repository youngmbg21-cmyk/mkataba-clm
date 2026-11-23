'use strict';
/* f1191 — JAMBO'S HELPS 4 AND 5 ON THE DUTY SHEET, AND THE WORD "DUTY" EVERYWHERE (owner, 23 Nov 2026: "build these:
   Round 2: renaming "obligations" to "duties" everywhere. Jambo's helps 4 and 5: suggesting who watches each duty, and
   saying why the proof box is ticked").
   (1) WHO WATCHES: the person watching the same kind of duty on most OTHER contracts, else the contract's owner; never a
       Viewer; filled in with the line saying why; the line goes when the name is changed or the duty is theirs.
   (2) WHY TICKED: only where the reading said it is a document they must hold, naming the clause; insurance says what
       the document is; the line goes when the tick is taken off.
   (3) THE WORD: the English book says duty, never obligation; the Swedish book is unchanged (it already said åtagande).
   At the parent every part fails (the helps and the words are new). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const USERS = [{ id: 'u1', name: 'Amina O.', role: 'editor' }, { id: 'u2', name: 'Brian K.', role: 'editor' }, { id: 'u3', name: 'Vera V.', role: 'viewer' }];
function world(){
  const { win } = buildWorld({ obligations: true, triage: true });
  win.state = win.state || {}; win.state.contracts = [];
  const c = { id: 'MK-9', name: 'Supply', counterparty: 'Delta LLC', status: 'Signed', expiry: '2027-06-30', owner: { id: 'u2', name: 'Brian K.' }, obligations: [], audit: [], fields: {} };
  const mk = (id, a) => ({ id, name: id, status: 'Signed', obligations: [{ id: id + 'o', desc: 'Review renewal options', party: 'ours', status: 'open', assignee: a }], audit: [] });
  win.state.contracts.push(c, mk('MK-8', 'Amina O.'), mk('MK-7', 'Amina O.'), mk('MK-6', 'Vera V.'), mk('MK-5', 'Vera V.'), mk('MK-4', 'Vera V.'));
  win.triageWordingHash = () => 'H1'; win.persist = () => {}; win.toast = () => {}; win.getUsers = () => USERS;
  return { win, c };
}
const RENEW = { desc: 'Review renewal options at least 3 months before expiry', quote: 'The parties shall review renewal options no later than three (3) months before expiry.', clause: '15.2', party: 'both', kind: 'event' };
const INSURE = { desc: 'Maintain goods-in-custody insurance', quote: 'AIT shall maintain goods-in-custody insurance.', clause: '11.1', party: 'them', kind: 'standing', doc: true };
const PAY = { desc: 'Pay each invoice within 30 days', quote: 'The Customer shall pay each invoice within thirty days.', clause: '7.3', party: 'us', kind: 'dated' };

test('f1191 (1) who watches: most of the other contracts, never a Viewer, else the owner', () => {
  const { win, c } = world();
  const w = win.dutyWatchOf(c, RENEW);
  assert.equal(w.name, 'Amina O.', 'Vera watches more, but a Viewer may do no duty');
  assert.equal(w.say, 'Watches this kind of duty on 2 other contracts');
  const p = win.dutyWatchOf(c, PAY);
  assert.deepEqual([p.name, p.say], ['Brian K.', 'Owns this contract'], 'nobody watches payments elsewhere: the owner');
  assert.equal(win.dutyWatchOf(Object.assign({}, c, { owner: { name: 'Vera V.' } }), PAY), null, 'a Viewer owner is not suggested');
});
test('f1191 (2) the sheet fills the name and says why; the line goes when the name changes', () => {
  const { win, c } = world();
  c.triage = { at: '2026-11-01T00:00:00Z', steps: { oblig: { ok: true, found: [RENEW] } } };
  win.openDutiesPage(c, [RENEW], {});
  const d = win.document;
  d.querySelector('[data-dtp-first]').click();
  assert.equal(d.getElementById('of-assignee').value, 'Amina O.');
  const ln = d.getElementById('of-watch-from');
  assert.match(ln.textContent, /Watches this kind of duty on 2 other contracts/);
  assert.equal(ln.hasAttribute('hidden'), false);
  d.getElementById('of-assignee').value = 'Brian K.';
  d.getElementById('of-assignee').dispatchEvent(new win.Event('input', { bubbles: true }));
  assert.equal(ln.hasAttribute('hidden'), true, 'the reason no longer matches the name');
  assert.equal(d.querySelectorAll('.dts-ov [data-of-party][aria-pressed="true"]').length, 0, 'whose is still the reader\'s choice');
});
test('f1191 (3) why the proof box is ticked: the clause, and what the document is', () => {
  const { win, c } = world();
  assert.equal(win.dutyProofSay(INSURE), 'Ticked because §11.1 asks for an insurance certificate they must hand over');
  assert.equal(win.dutyProofSay({ desc: 'Hold a valid trade licence', clause: '4.2', doc: true }), 'Ticked because Jambo read §4.2 as a document they must hold');
  assert.equal(win.dutyProofSay({ desc: 'Hold a licence', clause: '4.2', doc: true, origin: 'template' }), 'Ticked because our template marks §4.2 as a document they must hold');
  assert.equal(win.dutyProofSay(PAY), '', 'not read as a document: nothing said');
  c.triage = { at: '2026-11-01T00:00:00Z', steps: { oblig: { ok: true, found: [INSURE] } } };
  win.openDutiesPage(c, [INSURE], {});
  const d = win.document;
  d.querySelector('[data-dtp-first]').click();
  const ln = d.getElementById('of-proof-from');
  assert.ok(d.getElementById('of-isdoc').checked);
  assert.match(ln.textContent, /insurance certificate/);
  const t = d.getElementById('of-isdoc'); t.checked = false; t.dispatchEvent(new win.Event('change', { bubbles: true }));
  assert.equal(ln.hasAttribute('hidden'), true, 'untick: the reason goes');
});
test('f1191 (4) both books carry the helps; English says duty, never obligation', () => {
  const s = R('js/i18n.js'); const i = s.indexOf('\n  sv: {');
  const en = s.slice(0, i), sv = s.slice(i);
  ['dts_watch_past_one', 'dts_watch_past_other', 'dts_watch_owner', 'dts_proof_jb', 'dts_proof_jb_ins', 'dts_proof_tpl', 'dts_proof_tpl_ins', 'ob_gone_err']
    .forEach(k => { assert.ok(en.includes('    ' + k + ':'), 'en ' + k); assert.ok(sv.includes('    ' + k + ':'), 'sv ' + k); });
  const vals = [...en.matchAll(/^\s+[a-zA-Z0-9_]+:\s*(['"`])(.*?)\1,?\s*$/gm)].map(m => m[2]).filter(v => /obligation/i.test(v));
  assert.deepEqual(vals, [], 'no English sentence says obligation');
  assert.ok(!/toast\('That obligation/.test(R('js/obligations.js')));
  assert.match(R('js/handbook.js'), /title: \{ en: 'Duties: what we owe, what they owe'/);
});
