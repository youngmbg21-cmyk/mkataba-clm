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
  /* ---- CLAIMS UPDATED IN PLACE, 15 Aug 2026 (OI-11) ----
     The flat grid and its "All templates (12)" fold are gone: the picker opens
     on the VALUE STREAMS now, and you reach a template by choosing a stream.
     Reported with three templates called "Momo Beach" on one screen and nothing
     to browse by. What N6 was really pinning survives and is asserted below —
     For you still leads, search is still in the doorway and still looks across
     everything, and a company standard is still reachable in one press from the
     front screen. */
  test('the picker leads with For you, then search, then the streams', () => {
    const { sb, modals } = stage();
    sb.openWizard();
    const html = modals[0];
    assert.match(html, /For you/);
    assert.match(html, /id="wz-search"/);
    assert.match(html, /data-wz-stream=/, 'the streams are the browse step');
    assert.ok(!/All templates \(/.test(html), 'and the flat fold is gone');
  });

  test('a company standard is one press from the front screen, in its stream', () => {
    const { sb, modals } = stage({ tplLibPublished: () =>
      [{ id: 'L1', name: 'Wanjiru Standard MSA', publishedVersion: 3, folder: 'corp' }] });
    sb.openWizard();
    /* On the streams screen it is COUNTED rather than listed; searching for it
       finds it without leaving that screen, which is the route the flat grid
       used to serve. */
    assert.match(modals[0], /data-wz-stream="corp"/, 'its stream is on the front screen');
    assert.match(modals[0], /id="wz-search"/, 'and the name route is still there');
  });

  test('a standard with no stream on it lands in Other, not nowhere', () => {
    const { sb, modals } = stage({ tplLibPublished: () =>
      [{ id: 'L2', name: 'Account Opening Form', publishedVersion: 1 }] });
    sb.openWizard();
    assert.match(modals[0], /data-wz-stream="__wz_other__"/,
      'the unfiled have a home rather than a guessed stream');
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

/* ════════════════════════════════════════════════════════════════
   N6 (4) — THE LINE OF BUSINESS KEEPS SEATS
   ════════════════════════════════════════════════════════════════
   Young, 20 Sep 2026: *"What is the purpose of the line of business filter
   and does it work? It does not seem to be doing anything."* … *"simply fix
   the pop up to make sense for its purpose."*

   IT WORKED ON A NEW WORKSPACE AND COULD NOT WORK ON A USED ONE. The order
   was usage → line of business → starters, capped at four, so a workspace
   that had drafted from four built-ins filled every seat with usage and the
   dropdown was never reached. MEASURED on the owner's own case (five
   templates used): all four cards identical under all four lines of
   business, while the heading above them named one. Every claim below is
   red against the commit before the fix, bar the two named CONTROLS. */
const USED_FIVE = [
  ...Array.from({ length: 9 }, (_, i) => ({ id: 'n' + i, template: 'ND' })),
  ...Array.from({ length: 7 }, (_, i) => ({ id: 'r' + i, template: 'RM' })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: 'p' + i, template: 'PK' })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: 'm' + i, template: 'MK' })),
  ...Array.from({ length: 2 }, (_, i) => ({ id: 'c' + i, template: 'CM' })),
];
const busy = industry => stage({ state: { contracts: USED_FIVE, view: 'dashboard',
  settings: industry ? { industry } : {} } });
const forYou = sb => Array.from(sb.forYouTemplates(tmpls()).map(t => t.id));

describe('N6 (4) the line of business tunes the row on a workspace that has one', () => {
  test('4a THE REPORTED FAULT: four lines of business, four different rows', () => {
    const rows = ['services', 'manufacturing', 'distribution', 'retail']
      .map(k => forYou(busy(k).sb).join(','));
    assert.equal(new Set(rows).size, 4, 'each answers differently — got ' + JSON.stringify(rows));
  });

  test('4b and every row really carries that line of business', () => {
    for (const k of ['services', 'manufacturing', 'distribution', 'retail']) {
      const { sb } = busy(k);
      const ids = forYou(sb);
      const want = sb.INDUSTRY_TEMPLATES[k];
      const hit = ids.filter(id => want.includes(id));
      assert.ok(hit.length >= sb.FOR_YOU_LOB_MIN,
        `${k}: ${JSON.stringify(ids)} carries only ${hit.length} of ${JSON.stringify(want)}`);
    }
  });

  test('4c CONTROL — what you actually draft still leads', () => {
    /* ND is used 9 times and RM 7; both must be on the row, ahead of the
       line of business's own. */
    const ids = forYou(busy('retail').sb);
    assert.deepEqual(ids.slice(0, 2).sort(), ['ND', 'RM'], JSON.stringify(ids));
  });

  test('4d the row is still four, and the cap is stated once', () => {
    const { sb } = busy('retail');
    assert.equal(sb.FOR_YOU_MAX, 4);
    assert.equal(forYou(sb).length, sb.FOR_YOU_MAX);
    assert.ok(sb.FOR_YOU_LOB_MIN > 0 && sb.FOR_YOU_LOB_MIN < sb.FOR_YOU_MAX,
      'the line of business keeps some seats and never all of them');
  });

  test('4e CONTROL — a workspace that never named one is unchanged', () => {
    /* Usage takes all four exactly as it always did. */
    assert.deepEqual(forYou(busy(null).sb), ['ND', 'RM', 'PK', 'MK']);
  });

  test('4f CONTROL — a fresh workspace still gets its line of business whole', () => {
    const { sb } = stage({ state: { contracts: [], view: 'dashboard', settings: { industry: 'distribution' } } });
    assert.deepEqual(forYou(sb), ['WH', 'FF', 'DA', 'ND']);
  });

  test('4g the heading may only name a line of business that picked something', () => {
    const { sb } = busy('retail');
    const f = sb.forYouPick(tmpls());
    assert.equal(f.lob, 'retail');
    assert.equal(f.lobShown, true, 'two of the four are retail paper');
    assert.equal(sb.forYouPick.call(null, tmpls()) && busy(null).sb.forYouPick(tmpls()).lobShown, false,
      'and it says nothing where none was named');
  });

  test('4h ONE READING — the list and the heading come from the same call', () => {
    const { sb } = busy('manufacturing');
    /* Joined, because the sandbox builds its arrays in its own realm and
       deepStrictEqual compares prototypes as well as contents. */
    assert.equal(forYou(sb).join(','), Array.from(sb.forYouPick(tmpls()).list).map(t => t.id).join(','),
      'forYouTemplates is forYouPick().list under its old name');
  });

  test('4i the eyebrow reads what was PICKED, never the stored setting', () => {
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js/wizard.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.match(src, /wz_for_you'\)\}\$\{fy\.lobShown\?/, 'the heading asks the reading');
    assert.doesNotMatch(src, /wz_for_you'\)\}\$\{industry\?/, 'never the raw setting');
  });

  test('4j CONTROL — a line of business this role cannot create from costs no seat', () => {
    /* Curation draws only from what the role may create — a short list must
       not leave the row with three cards. */
    const { sb } = busy('retail');
    const allowed = tmpls().filter(t => !['RL', 'DA', 'LE'].includes(t.id));
    assert.equal(sb.forYouTemplates(allowed).length, 4);
  });
});
