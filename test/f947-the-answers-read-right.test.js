/* f947 — THE BUG LOG, BATCH 6: THE ANSWERS READ RIGHT (27 Oct 2026, the owner: "next ten bugs")

   Three readings that asked the wrong question:
     1 · Jambo's answer tool told the AI about wholeBook and ruleDoor OUTSIDE its list of fields, so the
         AI was never offered them (the door onto the whole Contracts list, the rule's own door)
     2 · the check before signing asked "who does this reminder reach?" with the contract in the duty's
         place, so every duty read as reaching nobody
     3 · the same check compared the obligation scan's stamp against the playbook's reading of the
         wording, not the words the scan read, so a contract filed with its signed copy always read
         "the wording moved since"

   Run: node --test test/f947-the-answers-read-right.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

describe('f947 (1) the answer tool offers every field it describes', () => {
  let ai, h, W;
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { approvalRules: [] });
  });
  after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });
  test('wholeBook and ruleDoor are among deliver_answer\'s fields', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer: 'ok', citations: [] } }]);
    await W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'list all the contracts' }] } });
    assert.ok(ai.calls.length >= 1, 'the AI was asked');
    const tool = (ai.calls[0].body.tools || []).find(t => t.name === 'deliver_answer');
    assert.ok(tool, 'the answer tool travels');
    const props = tool.input_schema.properties || {};
    assert.ok(props.wholeBook, 'wholeBook is a field');
    assert.ok(props.ruleDoor, 'ruleDoor is a field');
    assert.equal(tool.input_schema.wholeBook, undefined, 'nothing left outside the fields');
    assert.deepEqual(tool.input_schema.required, ['answer']);
  });
});

describe('f947 (2, 3) the check before signing reads the duties right', () => {
  const contract = over => Object.assign({ id: 'MK-947', name: 'Supply', counterparty: 'Acme', status: 'Under Review',
    fields: {}, metadata: {}, audit: [], changes: [], value: 1, valueType: 'estimated' }, over);
  test('a duty given to a member with an address reaches them; one given to nobody does not', () => {
    const { win } = buildWorld({ signcheck: true, contractView: true });
    const c = contract({ obligations: [
      { id: 'o1', desc: 'Deliver the report', due: '2030-01-01', party: 'ours', assignee: 'amina@hati.test' },
      { id: 'o2', desc: 'Pay', due: '2030-01-01', party: 'ours' }] });
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, settings: {} });
    win.getUsers = () => [{ id: 'u1', name: 'Amina', email: 'amina@hati.test' }];
    assert.equal(win.signCheckObligations(c).ownerless, 1, 'only the duty given to nobody');
  });
  test('stamped from the signed copy\'s words: not "moved since"', () => {
    const { win } = buildWorld({ signcheck: true, contractView: true });
    const c = contract({ format: 'text', redlineText: 'SUPPLY AGREEMENT\n1. The Supplier shall deliver monthly.',
      signedCopy: { text: 'SUPPLY AGREEMENT (as signed)\n1. The Supplier shall deliver weekly, and report each quarter.' },
      obligations: [{ id: 'o1', desc: 'Report each quarter', due: '2030-01-01', party: 'ours' }] });
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, settings: {} });
    assert.ok(typeof win.simhash64 === 'function', 'stage: the hasher is here');
    win.obligationsReadStamp(c, win.obligationsText(c));
    assert.ok(c.obligationsReadHash, 'fixture: the scan left its stamp');
    assert.equal(win.signCheckObligations(c).unread, false, 'the words the scan read are the words on file');
    c.signedCopy.text += '\n2. The Buyer shall pay within ten days.';
    assert.equal(win.signCheckObligations(c).unread, true, 'and new words still read as unread');
  });
});
