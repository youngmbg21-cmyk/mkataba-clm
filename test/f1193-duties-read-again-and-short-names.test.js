'use strict';
/* f1193 — JAMBO KNOWS THE PAPER'S SHORT NAMES, AND THE DUTIES CAN BE READ AGAIN (owner, 23 Nov 2026: "But the sentence is
   straight forward that AIT shall provide. Where is the ambiguity?" → "build both and merge").
   (1) The reading tells Jambo that a short name the paper gives a party ("AIT") is that party, said as us or them.
   (2) "Read the duties again" on the Duties page: ONE reading of the duties alone; the found list is replaced, what was
       added or skipped stays, the page lands on To decide.
   (3) A failure is said and the old list kept; never the basic scan in its place.
   (4) A Viewer gets no button; both books; the Handbook names it.
   At the parent every part fails (the sentence, the button and the reader are new). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const OLD = { desc: 'Provide written quotation before performing services', quote: 'Where no agreed rate exists, AIT shall provide a written quotation before performing the requested service.', party: 'unsure' };
const OLD2 = { desc: 'Pay each invoice within 30 days', quote: 'The Customer shall pay each invoice within thirty days.', party: 'us', clause: '7.3' };
const NEW = { desc: 'Provide written quotation before performing services', quote: OLD.quote, party: 'them', clause: '7.2', kind: 'event' };
function world(answer){
  const { win } = buildWorld({ obligations: true, triage: true });
  win.state = win.state || {}; win.state.contracts = [];
  const text = 'This Agreement is between Delta LLC and Adaptive IT AS ("AIT"). ' + 'AIT shall provide a written quotation. '.repeat(20);
  const c = { id: 'MK-9', name: 'Supply', counterparty: 'Adaptive IT AS', status: 'Signed', obligations: [], audit: [], fields: {},
    body: text, triage: { at: '2026-11-01T00:00:00Z', steps: { oblig: { ok: true, found: [OLD, OLD2] } } } };
  win.state.contracts.push(c); win.state.aiConfigured = true;
  win.API_MODE = () => true; win.contractPlainText = () => text; win.isUpload = () => false;
  win.triageWordingHash = () => 'H1'; win.persist = () => {}; win.getUsers = () => [];
  const said = []; win.toast = (m, k) => said.push([k, m]);
  const sent = [];
  win.api = async (p, m, body) => { sent.push([p, body]); if (answer instanceof Error) throw answer; return { obligations: answer }; };
  return { win, c, said, sent };
}

test('f1193 (1) Jambo is told the paper\'s short name is the same party', () => {
  const s = R('server/server.js');
  const i = s.indexOf("app.post('/api/ai/obligations'"), f = s.slice(i, i + 4000);
  assert.match(f, /SHORT NAME near its start \(for example "AIT", "the Supplier", "the Customer"\)/);
  assert.match(f, /that short name IS the same party, so a duty on it is that party's, and is said as us or them, never unsure/);
});
test('f1193 (2) read again: one reading, the found list replaced, decisions kept, lands on To decide', async () => {
  const { win, c, said, sent } = world([NEW]);
  win.obReviewMark(c, OLD2, 'skipped');
  win.openDutiesPage(c, null, {});
  const d = win.document;
  const b = d.querySelector('#dtp [data-dtp-again]');
  assert.ok(b, 'the button is on the page');
  assert.equal(b.textContent, 'Read the duties again');
  b.click();
  await new Promise(r => setTimeout(r, 30));
  assert.equal(sent.length, 1, 'one reading');
  assert.equal(sent[0][0], 'ai/obligations');
  assert.equal(sent[0][1].theirs, 'Adaptive IT AS');
  assert.deepEqual(c.triage.steps.oblig.found.map(x => x.party), ['them']);
  assert.equal(win.obReviewDecision(c, OLD2), 'skipped', 'what was skipped stays skipped');
  assert.ok(said.some(([k, m]) => k === 'ok' && /read the duties again: 1 found/.test(m)), JSON.stringify(said));
  d.querySelector('[data-dtp-decide]').click();
  assert.match(d.querySelector('.dts-jb').textContent, /Jambo reads Theirs \(§7\.2\)/, 'the whose line now shows');
});
test('f1193 (3) a failure is said, the old list kept, never the basic scan', async () => {
  const { win, c, said } = world(new Error('Jambo engine not configured'));
  win.openDutiesPage(c, null, {});
  const ok = await win.dutiesReadAgain(c);
  assert.equal(ok, false);
  assert.deepEqual(c.triage.steps.oblig.found, [OLD, OLD2], 'the earlier list stands');
  assert.ok(said.some(([k, m]) => k === 'err' && /were not read again: Jambo engine not configured.*earlier list is kept/.test(m)), JSON.stringify(said));
  const n = world([NEW]); n.win.state.aiConfigured = false;
  assert.equal(await n.win.dutiesReadAgain(n.c), false, 'no key: no basic scan put in its place');
  assert.deepEqual(n.c.triage.steps.oblig.found, [OLD, OLD2]);
  assert.equal(n.sent.length, 0);
});
test('f1193 (4) a Viewer gets no button; both books; the Handbook', () => {
  const { win, c } = world([NEW]);
  win.mayActOn = () => false;
  win.openDutiesPage(c, null, {});
  assert.equal(win.document.querySelector('#dtp [data-dtp-again]'), null);
  const s = R('js/i18n.js'), i = s.indexOf('\n  sv: {');
  ['dtp_again', 'dtp_again_done_one', 'dtp_again_done_other', 'dtp_again_failed', 'dtp_again_nokey']
    .forEach(k => { assert.ok(s.slice(0, i).includes('    ' + k + ':'), 'en ' + k); assert.ok(s.slice(i).includes('    ' + k + ':'), 'sv ' + k); });
  assert.match(R('js/handbook.js'), /press \{ui:dtp_again\} beside \{ui:dtp_own\}/);
});
