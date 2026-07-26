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

  test('both sides read the same list — same numbers, same captions, same authors', () => {
    const s = core();
    const p = s.buildSharePayload(contract({ versions: [
      { n: 1, at: '2026-07-22T09:00:00.000Z', label: 'Shared for review', by: 'Young Mbagaya', text: 'AS SENT' },
      { n: 2, at: '2026-07-23T09:00:00.000Z', label: 'Edited by Young Mbagaya', by: 'Young Mbagaya', text: 'REVISED' },
      { n: 3, at: '2026-07-24T09:00:00.000Z', label: 'Round 1 accepted (redline from Guliz Cetin)', by: 'Young Mbagaya', text: 'AFTER ROUND' },
    ] }), 'hash', WHO);
    // a version can only be named out loud if it is named the same on both sides
    assert.deepEqual(p.contract.versions.map(v => v.n), [1, 2, 3]);
    assert.deepEqual(p.contract.versions.map(v => v.label),
      ['Shared for review', 'Edited by Young Mbagaya', 'Round 1 accepted (redline from Guliz Cetin)']);
    assert.equal(p.contract.versions[1].by, 'Young Mbagaya');
  });

  test('internal drafting never travels — the history starts when it was first sent', () => {
    const s = core();
    const p = s.buildSharePayload(contract({ versions: [
      { n: 1, at: '2026-07-20T09:00:00.000Z', label: 'Original text', by: 'System', text: 'FIRST INTERNAL DRAFT' },
      { n: 2, at: '2026-07-21T09:00:00.000Z', label: 'Edited by Wanjiku Kamau', by: 'Wanjiku Kamau', text: 'SECOND INTERNAL DRAFT' },
      { n: 3, at: '2026-07-22T09:00:00.000Z', label: 'Shared for review', by: 'Young Mbagaya', text: 'AS SENT' },
      { n: 4, at: '2026-07-23T09:00:00.000Z', label: 'Round 1 accepted (redline from Guliz Cetin)', by: 'Young Mbagaya', text: 'AFTER THEIR ROUND' },
    ] }), 'hash', WHO);
    const labels = p.contract.versions.map(v => v.label);
    const raw = JSON.stringify(p.contract.versions);
    assert.equal(p.contract.versions.length, 2, 'the two pre-share drafts are the org\'s own work');
    assert.ok(!raw.includes('INTERNAL DRAFT'), 'wording never sent to anyone must not arrive now');
    assert.deepEqual(labels, ['Shared for review', 'Round 1 accepted (redline from Guliz Cetin)']);
    assert.ok(!raw.includes('Wanjiku Kamau'),
      'that edit happened before the contract was ever sent — it is not in the shared history at all');
  });

  test('a received document carries its own paper as v1, which the sender never shared', () => {
    const s = core();
    const p = s.buildSharePayload(contract({ source: 'upload', versions: [
      { n: 1, at: '2026-07-20T09:00:00.000Z', label: 'Original text', by: 'System', text: 'THEIR OWN PAPER' },
      { n: 2, at: '2026-07-21T09:00:00.000Z', label: 'Edited by Young Mbagaya', by: 'Young Mbagaya', text: 'EDITED' },
    ] }), 'hash', WHO);
    assert.equal(p.contract.versions.length, 2,
      'the paper they sent is theirs to see, share or no share');
    assert.equal(p.contract.versions[0].label, 'Original text');
  });

  test('the playbook fallback tier is still not named to the other side', () => {
    const s = core();
    const p = s.buildSharePayload(contract({ versions: [
      { n: 1, at: '2026-07-22T09:00:00.000Z', label: 'Shared for review', text: 'AS SENT' },
      { n: 2, at: '2026-07-23T09:00:00.000Z', label: 'Inserted preferred wording: Limitation of Liability (Tier 2 fallback)', text: 'REVISED' },
    ] }), 'hash', WHO);
    const raw = JSON.stringify(p.contract.versions);
    assert.ok(!raw.includes('Tier 2 fallback'), 'the playbook\'s internal naming is not counterparty business');
    assert.equal(p.contract.versions[1].label, 'Revised by Mkataba Ltd');
  });

  test('a contract never sent to anyone publishes no history', () => {
    const s = core();
    const p = s.buildSharePayload(contract({ versions: [
      { n: 1, at: '2026-07-20T09:00:00.000Z', label: 'Original text', text: 'DRAFT' },
    ] }), 'hash', WHO);
    assert.equal(p.contract.versions, undefined);
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
