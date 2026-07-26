/* ============================================================
   F12 — the counterparty is shown what the payload actually carries
   ============================================================
   The returned-changes banner shipped verified against a share payload built by
   hand in the test. The application's own payload is an allow-list that did not
   include the negotiation history, so the banner had nothing to read and never
   appeared in production — a green test for a feature that did not exist.

   These tests run against buildSharePayload() itself, so the allow-list and the
   thing that renders from it can no longer drift apart silently.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

// core.js is the whole application core; the payload builder needs only a small
// part of it, so it is loaded with the globals it actually reads stubbed out.
function core() {
  // richdoc.js defines docFormat/isRich and loads before core.js in the real app
  return loadViews(['js/richdoc.js', 'js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
  });
}

const WHO = { org: 'Mkataba Ltd', sharedBy: 'Young Mbagaya' };

const contract = (over = {}) => ({
  id: 'MK-177', name: 'Mkataba Logistics', counterparty: 'Mkataba LLC',
  template: 'MK', value: 95000000, valueType: 'standard', fields: { value: '95000000' },
  folder: 'proc', redlineText: 'AGREED WORDING', format: 'text',
  textFingerprint: 'fp-secret', simhash: 'sh-secret',
  audit: [{ action: 'internal note' }], comments: [{ text: 'internal chatter' }],
  ...over,
});

const round = (n, over = {}) => ({ n, at: '2026-07-25T09:00:00.000Z', by: 'Guliz Cetin',
  comment: 'Volumes are lower than forecast.', proposedText: 'THEIR PROPOSED WORDING',
  baseText: 'PREVIOUS WORDING', status: 'open', resolution: null, ...over });

describe('F12 — the share payload carries the negotiation history', () => {
  test('a decided round survives into the payload, so the banner has something to read', () => {
    const s = core();
    const p = s.buildSharePayload(contract({ rounds: [round(1, { status: 'closed',
      resolution: { decision: 'accepted', by: 'Young Mbagaya', at: '2026-07-26T11:00:00.000Z' } })] }), 'hash', WHO);
    assert.ok(Array.isArray(p.contract.rounds), 'the history must reach the counterparty');
    assert.equal(p.contract.rounds.length, 1);
    assert.equal(p.contract.rounds[0].n, 1);
    assert.equal(p.contract.rounds[0].resolution.decision, 'accepted');
    assert.equal(p.contract.rounds[0].resolution.at, '2026-07-26T11:00:00.000Z');
  });

  test('what the portal renders and what the payload carries agree', () => {
    // the exact pairing that broke: builder on one side, renderer on the other
    const s = core();
    const p = s.buildSharePayload(contract({ rounds: [round(1, { status: 'closed',
      resolution: { decision: 'accepted', by: 'Young Mbagaya', at: '2026-07-26T11:00:00.000Z' } })] }), 'hash', WHO);
    const portal = loadViews(['js/views/portal.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    const html = portal.portalRoundBanner(p.contract, p);
    assert.match(html, /Mkataba Ltd accepted your proposed changes/,
      'the banner must render from the payload the application really builds');
  });

  test('a contract with no history carries no empty scaffolding', () => {
    const s = core();
    const p = s.buildSharePayload(contract(), 'hash', WHO);
    assert.equal(p.contract.rounds, undefined);
    const portal = loadViews(['js/views/portal.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    assert.equal(portal.portalRoundBanner(p.contract, p), '', 'nothing happened, so nothing is announced');
  });

  test('the history is trimmed — bulk text and internal names stay behind', () => {
    const s = core();
    const p = s.buildSharePayload(contract({ rounds: [round(1, { status: 'closed',
      resolution: { decision: 'rejected', by: 'Wanjiku Kamau', at: '2026-07-26T11:00:00.000Z' } })] }), 'hash', WHO);
    const r = p.contract.rounds[0];
    assert.equal(r.proposedText, undefined, 'their own proposed text is bulk, not news');
    assert.equal(r.baseText, undefined);
    assert.equal(r.resolution.by, undefined,
      'the internal reviewer is not named to the counterparty — the banner speaks for the org');
    const raw = JSON.stringify(p);
    assert.ok(!raw.includes('Wanjiku Kamau'), 'no internal staff name may leak through the history');
  });

  test('the pre-existing trimming is not undone by any of this', () => {
    const s = core();
    const p = s.buildSharePayload(contract({ rounds: [round(1)] }), 'hash', WHO);
    const raw = JSON.stringify(p);
    assert.equal(p.contract.folder, undefined, 'the internal filing structure stays internal');
    assert.ok(!raw.includes('fp-secret') && !raw.includes('sh-secret'),
      'near-duplicate signals are portfolio analysis, not counterparty business');
    assert.ok(!raw.includes('internal chatter') && !raw.includes('internal note'),
      'internal comments and the audit trail never travel with a share');
  });

  test('the fields the portal has always needed are all still there', () => {
    const s = core();
    const p = s.buildSharePayload(contract(), 'the-hash', WHO);
    for (const k of ['id', 'name', 'counterparty', 'template', 'fields', 'value', 'valueType', 'redlineText', 'format'])
      assert.ok(p.contract[k] !== undefined, `the portal renders ${k} — it must survive the trim`);
    assert.equal(p.kind, 'hati-share');
    assert.equal(p.org, 'Mkataba Ltd');
    assert.equal(p.sharedBy, 'Young Mbagaya');
    assert.equal(p.docHash, 'the-hash');
  });
});
