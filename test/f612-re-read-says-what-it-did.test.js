/* ============================================================
   f612 — "Re-read document" says what it did (9 Oct 2026 review)
   ============================================================
   Measured: the press printed nothing (a bare toast(msg) prints nothing — the
   house rule), and on a redlined record it silently kept the body. Now the
   toast is an 'ok', it says when the redlined wording was kept, and once the
   document has changes the button is greyed with that reason.
   ============================================================ */
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const TEXT = 'WAREHOUSING SERVICES\n\n1. Scope\nThe Provider shall furnish warehousing services at the Sites.\n\n2. Fees\nFees are payable within thirty (30) days.\n';
const stage = () => {
  const w = buildWorld({ contractView: true });
  w.win.ocrBannerHtml = () => '';
  w.toasts = [];
  w.win.toast = (m, k) => w.toasts.push({ kind: k, text: String(m) });
  w.win.persist = () => {}; w.win.renderWorkspace = () => {};
  w.win.EXTRACT_MAX_CHARS = 200000;   // js/core.js's, which the world does not load
  return w;
};
function upload(over = {}){
  return { id: 'MK-U', name: 'Warehousing Services', counterparty: 'Nordfrakt AB', folder: 'proc',
    value: 500000, valueType: 'estimated', status: 'Under Review', template: null, source: 'upload',
    expiry: null, hash: null, signedAt: null, compliance: {}, fields: {}, scan: null, signatures: [],
    rounds: [], audit: [], changes: [], obligations: [], comments: [], versions: [],
    upload: { fileName: 'AIT.txt', mime: 'text/plain', size: 400, extractedText: TEXT, textSource: 'text',
      dataUrl: 'data:text/plain;base64,' + Buffer.from(TEXT).toString('base64') },
    ...over };
}

test('f612 (1) the button is live on an untouched upload, greyed with its reason once redlined', () => {
  const w = stage();
  const live = w.win.uploadDocBody(upload());
  const btn = live.match(/<button[^>]*data-reread[^>]*>/)[0];
  assert.ok(!/disabled/.test(btn), 'live before any change');
  const kept = w.win.uploadDocBody(upload({ changes: [{ id: 'CHG-001', status: 'pending', authorSide: 'owner' }] }));
  const b2 = kept.match(/<button[^>]*data-reread[^>]*>/)[0];
  assert.match(b2, /disabled aria-disabled="true"/, 'greyed');
  assert.match(b2, /title="This document has been redlined/, 'with the reason on it');
});

test('f612 (2) the press says what it did, in a toast that prints', async () => {
  const w = stage();
  await w.win.rereadUploadText(upload(), null);
  const t = w.toasts.find(x => /re-read/i.test(x.text));
  assert.ok(t, 'a toast is said: ' + JSON.stringify(w.toasts));
  assert.equal(t.kind, 'ok', 'with a kind, so it prints');
  assert.ok(!/kept/.test(t.text));
});

test('f612 (3) and says the redlined wording was kept where it was', async () => {
  const w = stage();
  const c = upload({ changes: [{ id: 'CHG-001', status: 'pending', authorSide: 'owner' }] });
  await w.win.rereadUploadText(c, null);
  const t = w.toasts.find(x => /re-read/i.test(x.text));
  assert.ok(t && t.kind === 'ok', JSON.stringify(w.toasts));
  assert.match(t.text, /redlined wording was kept/);
});
