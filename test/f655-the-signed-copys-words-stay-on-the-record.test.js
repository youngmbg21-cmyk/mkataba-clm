/* f655 — THE SIGNED COPY'S OWN WORDS STAY ON THE RECORD (owner: "Fix the
   bugs", 10 Oct 2026)

   A contract filed on a signed copy whose words DIFFER from the agreed ones
   now keeps that copy's text (`signedCopy.text`, js/views/handover.js
   outsideFile), because the duties are read off it (obligationsText — f654
   (37)). This pins the server's half: the text is the RECORD's, like an
   upload's extracted text — left off the list, served on the record, and a
   save from a list row (which never carried it) does not wipe it.

   Red at the parent: (1) and (3) — the list carried the text whole, and a
   save without it dropped it. (2) is the control. */
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { if (h) await h.stop(); });

const TEXT = 'SERVICES AGREEMENT. 3. Fees. The Customer shall pay within sixty days of invoice.';
const load = async id => { const full = await W.admin.json('/api/contracts/' + id); const v = full._v; delete full._v; return { full, v }; };
const save = (c, v) => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: v } });

test('f655 (1) the list leaves the signed copy\'s words out; (2) the record serves them', async () => {
  const { full, v } = await load('MK-A2');
  full.signedCopy = { at: '2026-10-10T09:00:00Z', file: { name: 'signed.docx', sha256: 'a'.repeat(64) }, compare: { same: false }, text: TEXT };
  await save(full, v);
  const list = await W.admin.json('/api/contracts?limit=50');
  const row = (list.rows || []).find(r => r.id === 'MK-A2');
  assert.ok(row && row.signedCopy, 'the row carries the signed copy');
  assert.equal(row.signedCopy.text, undefined, 'but not its words');
  assert.equal(row.signedCopy.file.name, 'signed.docx', 'the rest of it is untouched');
  const rec = await W.admin.json('/api/contracts/MK-A2');
  assert.equal(rec.signedCopy.text, TEXT);
});

test('f655 (3) a save from a list row, which never carried the words, keeps them', async () => {
  const { full, v } = await load('MK-A2');
  const asListed = { ...full, signedCopy: { ...full.signedCopy, text: undefined } };
  delete asListed.signedCopy.text;
  await save(asListed, v);
  const rec = await W.admin.json('/api/contracts/MK-A2');
  assert.equal(rec.signedCopy.text, TEXT);
});
