/* N6 — the template picker greets you with four, not twelve.

   The wizard's first screen was a flat grid tuned to the original FMCG demo,
   at the exact moment of highest intent. Now a "For you" row of at most four
   leads, chosen by what the workspace actually drafts from (demo seeds
   excluded), then its named line of business, then four universal starters
   any SME signs. Everything else waits behind a search box and an "All
   templates" fold; company standard templates stay pinned on top. The wizard
   beyond the doorway is untouched. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_FOLDERS } = require('./dom');

/* Real-shaped built-ins, not the proxy stub — curation is ABOUT which ids exist. */
const T = {};
for (const [id, kind] of Object.entries({ RM: 'Raw Materials Supply', PK: 'Packaging Supply',
  CM: 'Co-Manufacturing', EQ: 'Equipment Lease', WH: 'Warehousing', FF: 'Freight & Forwarding',
  DA: 'Distributor Agreement', RL: 'Retail Listing', MK: 'Marketing Services', ND: 'NDA',
  LE: 'Premises Lease', PS: 'Professional Services' }))
  T[id] = { id, kind, name: kind, blurb: kind + ' agreement', folder: 'proc', valueType: 'estimated', ic: 'file' };

function stage(over = {}) {
  const modals = [];
  const sb = loadViews(['js/wizard.js'], {
    TEMPLATES: T, FOLDERS: STUB_FOLDERS,
    openModal: html => { modals.push(String(html)); return { innerHTML: '' }; },
    closeModal(){}, canEdit: () => true, isAdmin: () => true,
    currentUser: () => ({ name: 'Amina', role: 'admin' }),
    templateFields: () => [], tplMapLabel: () => '', validateField: () => null,
    saveSettings(){},
    state: { contracts: [], settings: {}, view: 'dashboard' },
    ...over,
  });
  return { sb, modals };
}
const tmpls = () => Object.values(T);

describe('N6 (1) — who "For you" belongs to', () => {
  test('a fresh services-less workspace gets the universal starters', () => {
    const { sb } = stage();
    assert.deepEqual(Array.from(sb.forYouTemplates(tmpls()).map(t => t.id)), ['ND', 'PS', 'LE', 'MK'],
      'an NDA, services, a lease, marketing — what any SME signs');
  });

  test('a named line of business tunes the row', () => {
    const { sb } = stage({ state: { contracts: [], settings: { industry: 'distribution' }, view: 'dashboard' } });
    assert.deepEqual(Array.from(sb.forYouTemplates(tmpls()).map(t => t.id)), ['WH', 'FF', 'DA', 'ND']);
  });

  test('what the workspace actually drafts from outranks everything', () => {
    const { sb } = stage({ state: { settings: { industry: 'services' }, view: 'dashboard',
      contracts: [
        { id: '1', template: 'WH' }, { id: '2', template: 'WH' }, { id: '3', template: 'DA' },
      ] } });
    const ids = Array.from(sb.forYouTemplates(tmpls()).map(t => t.id));
    assert.deepEqual(ids.slice(0, 2), ['WH', 'DA'], 'heaviest real use first');
    assert.equal(ids.length, 4, 'topped up from the industry list, capped at four');
  });

  test('demo seeds do not vote', () => {
    const { sb } = stage({ state: { settings: {}, view: 'dashboard',
      contracts: [{ id: 's1', template: 'RM', seeded: true }, { id: 's2', template: 'RM', seeded: true }] } });
    assert.ok(!sb.forYouTemplates(tmpls()).map(t => t.id).includes('RM'),
      'a seeded FMCG portfolio must not steer a real services business');
  });

  test('role-gated templates never appear, and a junk stored industry reads as none', () => {
    const { sb } = stage({ state: { contracts: [], settings: { industry: 'zeppelins' }, view: 'dashboard' } });
    assert.equal(sb.workspaceIndustry(), null);
    const allowed = tmpls().filter(t => t.id !== 'ND');
    assert.ok(!sb.forYouTemplates(allowed).map(t => t.id).includes('ND'),
      'curation draws only from what this role may create');
  });
});

describe('N6 (2) — the doorway itself', () => {
  test('the picker leads with For you, then search, then the fold', () => {
    const { sb, modals } = stage();
    sb.openWizard();
    const html = modals[0];
    assert.match(html, /For you/);
    assert.match(html, /id="wz-search"/);
    assert.match(html, /All templates \(12\)/);
    assert.ok(!/<details id="wz-all" open/.test(html), 'the full grid waits folded when a For-you row exists');
  });

  test('company standard templates stay pinned on top', () => {
    const { sb, modals } = stage({ tplLibPublished: () => [{ id: 'L1', name: 'Wanjiru Standard MSA', publishedVersion: 3 }] });
    sb.openWizard();
    assert.match(modals[0], /Your company standard templates/);
    assert.match(modals[0], /Wanjiru Standard MSA/);
    assert.match(modals[0], /data-wz-lib="L1"/);
  });

  test('the line-of-business question is asked in the doorway, admins only', () => {
    const { sb, modals } = stage();
    sb.openWizard();
    assert.match(modals[0], /id="wz-industry"/);
    const nonAdmin = stage({ isAdmin: () => false });
    nonAdmin.sb.openWizard();
    assert.ok(!/wz-industry/.test(nonAdmin.modals[0]),
      'a select that cannot save for this role is worse than no select');
  });

  test('a preselected template still skips the doorway entirely', () => {
    const { sb, modals } = stage();
    sb.openWizard('WH');
    assert.ok(!/For you/.test(modals[0]), 'straight to the questions, as before');
    assert.match(modals[0], /Warehousing/);
  });
});
