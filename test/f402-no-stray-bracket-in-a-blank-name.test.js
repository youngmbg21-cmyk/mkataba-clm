/* f402 — A BLANK'S NAME CARRIES NO STRAY "[" (the owner's list, 27 Sep 2026)

   "Blank labels still show a stray '[' — for example 'Made effective as of ['
   in the uploaded-blanks panel and in the list of blanks the other side
   filled in. This is the case in your screenshot; the clean-up fixed only the
   round-bracket version."

   A ruled line written INSIDE square brackets — "as of [______]" — leaves the
   opening bracket in front of the line, and the name was read off the words in
   front of the line. upLeadName (js/uploadblanks.js) is the ONE reading of the
   name, asked by the uploaded-blanks panel, the other side's filled-in blanks
   list (ohBlankName, js/outside.js) and the template builder's blank
   candidates; the KEY (upLead) never moves, because a blank somebody has
   already answered is found again by it.

   Red at the parent (3ee647b): (1)(2)(4)(5). (3) is the WALL and (6) the
   CONTROL — both hold on both sides by design. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* The panel's reader, loaded as the page loads it (it publishes on window). */
const UB = (() => {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(read('js/uploadblanks.js'), ctx, { filename: 'js/uploadblanks.js' });
  return ctx.window;
})();

test('f402 (1) the name drops the unclosed square bracket and keeps the words the key showed', () => {
  assert.equal(UB.upLeadName('This Agreement is made effective as of ['), 'made effective as of');
  assert.equal(UB.upLeadName('Delivery address: ['), 'Delivery address');
});

test('f402 (2) a square bracket is the gap’s container: the words BEFORE it are the name', () => {
  assert.equal(UB.upLeadName('Price: [USD '), 'Price');
  assert.equal(UB.upLeadName('[Supplier '), 'Supplier', 'nothing stands before it, so the words inside answer');
  assert.equal(UB.upLeadName('['), '', 'a bracket alone names nothing — never a name of "["');
});

test('f402 (3) [wall] the KEY does not move, so an answer already typed is found again', () => {
  assert.equal(UB.upLead('This Agreement is made effective as of ['), 'made effective as of [');
  assert.equal(UB.upLead('Price: [USD '), 'Price: [USD');
});

test('f402 (4) the uploaded-blanks panel prints the name without the bracket', () => {
  const { win } = buildWorld({ blanks: true, templates: true });
  const c = { id: 'MK-702', name: 'Supply Agreement', status: 'Under Review', source: 'upload',
    format: 'rich', fields: {}, audit: [], metadata: {},
    redlineText: '<h1>SUPPLY AGREEMENT</h1><h4>1. Parties</h4>'
      + '<p>This Agreement is made effective as of [________] between Kijani Foods Ltd and Highland Corporate Ltd.</p>'
      + '<h4>2. Delivery</h4><p>Delivery address: ________</p>',
    upload: { fileName: 'supply.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } };
  win.state = win.state || { contracts: [], settings: {} };
  win.state.contracts = [c];
  win.state.activeId = c.id;
  const labels = win.contractBlanks(c).map(b => b.label);
  assert.ok(labels.length >= 2, 'STAGE: the upload was read as ' + labels.length + ' blanks');
  assert.ok(labels.every(l => !/\[/.test(l)), 'no label carries a "[": ' + JSON.stringify(labels));
  assert.ok(labels.some(l => /^Made effective as of$/i.test(l)), JSON.stringify(labels));
});

test('f402 (5) the other side’s filled-in blanks list names the blank without the bracket', () => {
  for (const k of ['upHits', 'upLabel', 'upLead', 'upStockPrompt', 'upLeadName']) global[k] = UB[k];
  try {
    const O = require('../js/outside.js');
    const agreed = [{ text: 'SUPPLY AGREEMENT', title: true },
      { text: 'This Agreement is made effective as of [______] between Kijani Foods Ltd and Highland Corporate Ltd.' },
      { text: '1. Fees. The Customer shall pay the fees within thirty days of invoice.' }];
    const signed = ['SUPPLY AGREEMENT',
      'This Agreement is made effective as of 1 October 2026 between Kijani Foods Ltd and Highland Corporate Ltd.',
      '1. Fees. The Customer shall pay the fees within thirty days of invoice.'].join('\n');
    const r = O.outsideCompare(agreed, signed);
    const names = (r.fills || []).map(f => f.name);
    assert.equal(names.length, 1, 'STAGE: one blank filled — ' + JSON.stringify(names));
    assert.equal(names[0], 'Made effective as of');
  } finally {
    for (const k of ['upHits', 'upLabel', 'upLead', 'upStockPrompt', 'upLeadName']) delete global[k];
  }
});

test('f402 (6) CONTROL: the round-bracket and list-marker rules of 26 Sep still hold', () => {
  assert.equal(UB.upLeadName('the Company (registration number '), 'registration number');
  assert.equal(UB.upLeadName('(a) Address: '), 'Address');
  assert.equal(UB.upLeadName('for one year. Delivery address: '), 'Delivery address');
});
