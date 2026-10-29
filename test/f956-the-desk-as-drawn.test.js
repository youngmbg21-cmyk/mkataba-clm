/* THE READING DESK AS DRAWN, AND THE SHORTER FORM (round 2 of the review, 28 Oct 2026; the owner's drawing, artifact
   C83usssBsvJMimRMC4xZWy). The browser says the column's name before the read (askColNameOf); the server keeps the
   name by the same rule (colNameOf). The two must never differ, or the form promises one name and the list shows
   another. At the parent (before this change) there is no askColNameOf. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const slice = (src, start, end) => { const a = src.indexOf(start); assert.ok(a >= 0, 'missing ' + start); const b = src.indexOf(end, a); assert.ok(b > a, 'missing end ' + end); return src.slice(a, b); };
const QS = ['Does this contract mention a rebate?', 'How much notice does each side need to end the contract?', 'Is our liability capped, and at what?',
  'Which law governs the contract?', 'Can either side end it without cause?', 'Does this agreement name a court or an arbitrator for disputes?',
  'What is the payment term?', 'Rebate', '', 'Who owns the intellectual property?'];

test('1 · the browser and the server name a column the same way', () => {
  const web = slice(read('js/views/askcolumn.js'), 'const AC_NAME_LEAD', 'function askColNamedHtml');
  const srv = slice(read('server/server.js'), 'const COLUMN_NAME_LEAD', 'function colAskKeep');
  const a = Function(web + '; return askColNameOf;')(), b = Function(srv + '; return colNameOf;')();
  for (const q of QS) assert.equal(a(q), b(q), 'differs on ' + JSON.stringify(q));
  assert.equal(a('Does this contract mention a rebate?'), 'Rebate');
  assert.equal(a('How much notice does each side need to end the contract?'), 'Notice');
  assert.equal(a('Is our liability capped, and at what?'), 'Liability capped');
});

test('2 · the form has one box and says the name; the card is Jambo\'s grey card with the question; the button says its cost', () => {
  const A = read('js/views/askcolumn.js');
  const form = slice(A, 'function askColFormHtml', '\n}\n');
  assert.doesNotMatch(form, /id="ac-name"/, 'no name box on the form until Change is pressed');
  assert.match(form, /askColNamedHtml\(f\)/);
  const busy = slice(A, 'function askColBusyHtml', 'function askColDeskHeadHtml');
  assert.match(busy, /ac-dk-card/); assert.match(busy, /askColDeskHeadHtml\(b\)/);
  assert.doesNotMatch(busy.replace(/\/\*[\s\S]*?\*\//g, ''), /class="ac-prog"/, 'no bar on the reading card');
  /* RE-POINTED 29 Oct 2026 (Stop stands still): Stop is a button, heading the card beside what is in flight */
  assert.match(busy, /class="ac-dk-top">\$\{askColDeskNowHtml\(b\)\}<button type="button" class="ui-btn ui-btn-sm ac-dk-stop" data-ac-stop/, 'Stop is a button, at the head of the card');
  const stop = slice(A, 'function askColStoppedHtml', '\n}\n');
  assert.match(stop, /ac-dk-card/, 'the stopped card is the same grey card'); assert.match(stop, /askColDeskHeadHtml\(/);
  const I = read('js/i18n.js');
  assert.match(I, /ac_read_btn_other: 'Read \{n\} contracts · \{calls\}'/);
});
