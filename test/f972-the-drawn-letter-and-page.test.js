'use strict';
/* f972 — THE NEW LOOK'S LETTER AND STATUS PAGE, AS DRAWN (owner, 31 Oct 2026: "Email as drawn, Jambo on press";
   "Both pages as drawn"). The email (js/sharemail.js, both hosts) opens "Dear", carries the note, their link as one
   plain line and "Kind regards" with the sender — no button; with no note the answers are said so it is never empty.
   Where the deal stands reads ONE reading (dpPage in js/dealstands.js) on both hosts. At the parent every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../js/sharemail.js');
const DS = require('../js/dealstands.js');
const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const base = { channel: 'email', purpose: 'negotiate', sender: 'Amina Otieno', org: 'Highland Corporate Ltd', cName: 'Parcel Delivery SaaS',
  recName: 'Erik Lindqvist', link: 'https://hati.example/#share=t:abc', round: 1, drawn: true,
  answers: { asked: 2, lines: [{ clause: 'Clause 5 · Payment', say: 'they propose 45 days (you asked for 60).' }], own: [] } };
test('1 the drawn letter: Dear, the note, the link as one line, Kind regards and the sender; no button', () => {
  const m = M.shareMailOf(Object.assign({}, base, { message: 'Thank you for your round.' }));
  assert.match(m.body, /^Dear Erik,\n\nThank you for your round\./);
  assert.match(m.body, /\nhttps:\/\/hati\.example\/#share=t:abc\n\nKind regards,\nAmina Otieno$/);
  assert.ok(!m.parts.some(p => p.k === 'btn'), 'no button');
  assert.ok(!/answered/.test(m.body), 'the note carries the answers, not a list');
  assert.match(m.html, /<a href="https:\/\/hati\.example\/#share=t:abc"/);
});
test('2 with no note the answers are said, so the letter is never empty', () => {
  const m = M.shareMailOf(base);
  assert.match(m.body, /has answered your redline:\nClause 5 · Payment: they propose 45 days/);
});
test('3 without the switch the letter is as before (Hello, the button)', () => {
  const m = M.shareMailOf(Object.assign({}, base, { drawn: false }));
  assert.match(m.body, /^Hello Erik,/); assert.ok(m.parts.some(p => p.k === 'btn'));
});
test('4 the status page as drawn reads the one reading, after the route, in literal values', () => {
  assert.match(SRV, /const \{ dpPage \} = require\('\.\.\/js\/dealstands\.js'\);/);
  const page = SRV.slice(SRV.indexOf('function dealPageDrawnHtml'), SRV.indexOf('function dealPageDrawnHtml') + 6000);
  assert.ok(/const P = dpPage\(c, D\);/.test(page));
  assert.ok(!/var\(--|:root/.test(page.slice(0, page.indexOf('\n}\n'))), 'a standalone page has no stylesheet to read');
  for (const tag of ['<form', '<input', '<button', '<script']) assert.ok(!page.slice(0, page.indexOf('\n}\n')).includes(tag), tag);
});
test('5 dpPage: positions in a few words, the clause as §, the party by its first word, agreed by number', () => {
  const c = { negotiation: { baselineBody: '<h2>1. Scope</h2><p>x</p><h2>5. Payment</h2><p>within 30 days</p>' },
    changes: [{ id: 'CHG-1', clauseId: 'a', clauseLabel: 'Clause 5 · Payment', authorSide: 'counterparty', status: 'pending',
      ops: [{ op: 'keep', text: 'within ' }, { op: 'del', text: '30' }, { op: 'ins', text: '60' }, { op: 'keep', text: ' days' }] }] };
  const D = { parties: [{ name: 'Highland Corporate Ltd', ours: true }, { name: 'Parcelway Logistics Ltd', ours: false }], round: 1, total: 1, open: 1, agreed: false, executed: false, move: { party: 'Highland Corporate Ltd' } };
  const P = DS.dpPage(c, D);
  assert.deepEqual(P.rows[0], { clause: '§ 5 Payment', ours: { words: '30 days', more: 0 }, theirs: { words: '60 days', more: 0 }, move: 'Highland' });
  assert.deepEqual(P.agreed, ['§ 1 Scope']);
  assert.equal(P.us, 'Highland'); assert.equal(P.them, 'Parcelway');
});
