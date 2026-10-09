/* ============================================================
   F622 — a refused point is settled, not agreed (overnight run, 8 Oct 2026)
   ============================================================
   Where we are listed a change the counterparty REFUSED with a tick under
   "Agreed · n": dsSettled carries settled:false rows and the sheet drew one
   tick for all. The column is now headed "Settled · n" and each row carries
   its own mark — a tick where the change was taken, a cross and "not taken"
   where it was refused — on all three surfaces: our tab and their page draw
   standsHtml; the public status page is the server's standalone copy. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const deal = () => ({ id: 'MK-622', name: 'Haulage', counterparty: 'Nordbygg AB', status: 'Under Review',
  changes: [
    { id: 'CHG-1', status: 'accepted', authorSide: 'counterparty', clauseId: 'c4', clauseLabel: '4. Payment Terms', createdAt: iso(-5), resolvedAt: iso(-4) },
    { id: 'CHG-2', status: 'rejected', authorSide: 'owner', clauseId: 'c9', clauseLabel: '9. Liability Cap', createdAt: iso(-3), resolvedAt: iso(-2) },
  ], negotiation: { round: 2, rounds: [] }, signatures: [] });

describe('f622 — the sheet marks each settled point for what it is', () => {
  test('the in-app sheet: Settled heading, a tick for taken, a cross and "not taken" for refused', () => {
    const w = buildWorld({});
    const html = w.win.standsHtml(deal(), {});
    /* RE-POINTED 9 Oct 2026 (SAP batch 3): the card is titled "Settled (2)" and
       each row's words sit in their own span beside the mark. */
    assert.match(html, /Settled \(2\)/);
    assert.ok(!/Agreed /.test(html), 'the card is not headed Agreed');
    const rows = [...html.matchAll(/<div class="ds-li( is-refused)?"><span class="ds-tick"[^>]*>([^<]*)<\/span><span class="ds-li-b"><b>([^<]*)<\/b>(<i>([^<]*)<\/i>)?/g)]
      .map(m => ({ refused: !!m[1], mark: m[2], clause: m[3], sub: m[5] || '' }));
    const pay = rows.find(r => /Payment/.test(r.clause)), cap = rows.find(r => /Liability/.test(r.clause));
    assert.ok(pay && !pay.refused && pay.mark === '✓', JSON.stringify(rows));
    assert.ok(cap && cap.refused && cap.mark === '✕' && cap.sub === 'not taken', JSON.stringify(rows));
  });
  test('the public status page draws the same marks', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'server/server.js'), 'utf8');
    assert.match(src, /ch\(`Settled \(\$\{D\.settled\}\)`/);
    assert.match(src, /p\.settled \? '✓' : '✕'/);
    assert.match(src, /p\.settled \? '' : '<i[^']*>not taken<\/i>'/);
    assert.ok(!/Agreed \(\$\{D\.settled\}\)/.test(src));
  });
});
