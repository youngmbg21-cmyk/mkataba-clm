/* ============================================================
   F625 — the copy both sides sign is not "working text" (8 Oct 2026)
   ============================================================
   A sign link's paper was headed "<MARKET> · WORKING TEXT" while the panel
   beside it said "This is the copy both sides sign". The note belongs to the
   working copy only: our Document tab keeps it; our Signing tab, a sealed copy
   and a signing link on their page do not. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const deal = () => ({ id: 'MK-625', name: 'Haulage Agreement', counterparty: 'Nordbygg AB', status: 'Under Review',
  folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], signatures: [], comments: [], format: 'text',
  redlineText: 'This agreement is made today.\n\n1. SCOPE\n1. The Provider shall haul the goods.' });
const kick = html => (String(html).match(/<div class="rl-paper-kick">([^<]*)<\/div>/) || [])[1] || '';

describe('f625 — "working text" is said on the working copy only', () => {
  test('our Document tab keeps the note', () => {
    const w = buildWorld({ contractView: true }); w.win.jxName = () => 'Kenya';
    assert.match(kick(w.win.redlineDocBody(deal())), /working text/i);
  });
  test('a signing link on their page drops it', () => {
    const w = buildWorld({ contractView: true }); w.win.jxName = () => 'Kenya';
    w.win.PORTAL_MODE = true;
    w.win.PORTAL_OPTS = { purpose: 'sign' };
    const k = kick(w.win.redlineDocBody(deal()));
    assert.ok(!/working text/i.test(k), k);
    w.win.PORTAL_OPTS = { purpose: 'view' };
    assert.match(kick(w.win.redlineDocBody(deal())), /working text/i, 'a view link is not the signing copy');
  });
  test('our Signing tab drops it (docCopyOf answers "sign")', () => {
    const w = buildWorld({ contractView: true }); w.win.jxName = () => 'Kenya';
    w.win.docCopyOf = () => 'sign';
    const k = kick(w.win.redlineDocBody(deal()));
    assert.ok(k && !/working text/i.test(k), k);
  });
});
