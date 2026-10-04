/* F457 — THE OWNER'S FIFTEEN (Young, 3–4 Oct 2026)
 *
 * The readings behind the list Young built from iPad screenshots: the parts
 * that can be pinned without a browser. What is measured as drawn lives in
 * test/chromium/explorer-tidy-verify.js and where-we-are-verify.js.
 *
 *   (1) every spacing token a rule asks for exists — `.ds-sheet` asked for
 *       --s-5, which :root never had, so its whole padding was dropped and the
 *       words sat on the sheet's border;
 *   (2) one party, one group: names that differ only in capitals or spacing
 *       group together, printed in the book's own spelling; a different
 *       spelling stays a different name. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

describe('F457 (1) — a spacing token that is asked for exists', () => {
  test('every var(--s-N) in the page, the views and the server is defined in :root', () => {
    const html = read('index.html');
    const defined = new Set((html.match(/--s-\d+\s*:/g) || []).map(x => x.replace(/\s*:$/, '')));
    assert.ok(defined.has('--s-4'), 'the ladder moved: ' + [...defined].join(' '));
    const files = ['index.html'].concat(
      fs.readdirSync(path.join(__dirname, '..', 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f),
      fs.readdirSync(path.join(__dirname, '..', 'js', 'views')).filter(f => f.endsWith('.js')).map(f => 'js/views/' + f));
    const missing = [];
    files.forEach(f => (read(f).match(/var\(--s-\d+\)/g) || []).forEach(u => {
      const k = u.slice(4, -1); if (!defined.has(k)) missing.push(f + ': ' + u); }));
    assert.deepEqual(missing, [], 'a rule naming a token :root does not have is dropped whole');
  });
  test('the deal-stands sheet is inset like the Overview (16px, the .sec-head inset)', () => {
    const html = read('index.html');
    const rule = (html.match(/\.ds-sheet\{[^}]*\}/) || [''])[0];
    assert.match(rule, /padding:var\(--s-4\)/, rule);
    assert.match(html, /#kt-overview \.sec-head\{ padding:16px 16px 2px; \}/, 'the Overview moved its inset; move this with it');
  });
});

describe('F457 (2) — one party, one group', () => {
  const { buildWorld } = require('./world');
  const world = () => {
    const w = buildWorld({ intelView: true }).win;
    w.state = { contracts: [
      { id: 'A', counterparty: 'Juno Logistics Ltd' }, { id: 'B', counterparty: 'Juno Logistics Ltd' },
      { id: 'C', counterparty: 'juno  logistics ltd ' }, { id: 'D', counterparty: 'Naivas Supermarkets' },
      { id: 'E', counterparty: 'Naivas Supermarket' }, { id: 'F', counterparty: '' }], settings: {} };
    return w;
  };
  test('capitals and spacing fold; the spelling most of the book uses is printed', () => {
    const w = world();
    assert.equal(w.graphPartyLabel('juno  logistics ltd '), 'Juno Logistics Ltd');
    assert.equal(w.groupLabelOf(w.state.contracts[2], 'counterparty'), 'Juno Logistics Ltd');
    assert.equal(w.groupLabelOf(w.state.contracts[0], 'counterparty'), 'Juno Logistics Ltd');
  });
  test('a different spelling is a different name — HaTi does not guess two parties are one', () => {
    const w = world();
    assert.equal(w.graphPartyLabel('Naivas Supermarket'), 'Naivas Supermarket');
    assert.equal(w.graphPartyLabel('Naivas Supermarkets'), 'Naivas Supermarkets');
  });
  test('no name is still "No counterparty"', () => {
    const w = world();
    assert.equal(w.groupLabelOf(w.state.contracts[5], 'counterparty'), 'No counterparty');
  });
});

describe('F457 (3) — the map\'s look, asked for in words (items 4–7)', () => {
  const { buildWorld } = require('./world');
  const BOOK = [
    { id: 'MK-101', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', folder: 'proc', status: 'Signed', value: 48e6, metadata: {} },
    { id: 'MK-102', name: 'Modern Trade Listing', counterparty: 'Naivas Supermarkets', folder: 'sales', status: 'Under Review', value: 85e6, metadata: {} },
    { id: 'MK-103', name: 'Juno Freight', counterparty: 'Juno Logistics Ltd', folder: 'sales', status: 'Draft', value: 22e6, metadata: {} },
    { id: 'MK-104', name: 'Juno Fresh', counterparty: 'Juno Logistics Ltd', folder: 'proc', status: 'Signed', value: 3e6, metadata: {} },
  ];
  const world = () => {
    const w = buildWorld({ intelView: true }).win;
    w.state = { contracts: BOOK.map(c => JSON.parse(JSON.stringify(c))), settings: {} };
    w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
    w.cKind = c => c.kind || '';
    w.statusLabel = st => ({ 'Draft': 'Drafting', 'Under Review': 'In Review', 'Signed': 'Executed' })[st] || st;
    w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
    w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[]; intel.lastRole=null; intel.names=null; intel.dotScale=1; intel.folds={};');
    return w;
  };
  const acts = (w, q) => { const p = w.igRecipeParse(q); return p ? JSON.parse(JSON.stringify(p.acts)) : null; };
  const NONE = [{ names: { mode: 'none' } }];
  const PHRASES = [
    ['hide the names', NONE], ['remove the labels', NONE], ['just the bubbles', NONE], ['show me only the dots', NONE],
    ['bubbles only', NONE], ['turn off the names', NONE], ['no labels', NONE], ['hide all the names and just show bubbles', NONE],
    ['dölj namnen', NONE], ['bara bubblorna', NONE], ['ta bort etiketterna', NONE],
    ['show the names again', [{ names: null }]], ['bring back the labels', [{ names: null }]], ['visa namnen igen', [{ names: null }]],
    ['make the bubbles bigger', [{ dots: 1.5 }]], ['bigger dots', [{ dots: 1.5 }]], ['much bigger bubbles', [{ dots: 2 }]],
    ['make the bubbles a bit bigger', [{ dots: 1.2 }]], ['smaller bubbles', [{ dots: 1 / 1.5 }]], ['shrink the dots', [{ dots: 1 / 1.5 }]],
    ['normal size bubbles', [{ dots: 'reset' }]], ['reset the bubble size', [{ dots: 'reset' }]],
    ['större bubblor', [{ dots: 1.5 }]], ['mindre prickar', [{ dots: 1 / 1.5 }]], ['bubblor i normal storlek', [{ dots: 'reset' }]],
    ['show each customer as one bubble', [{ role: 'group', fact: 'counterparty' }, { fold: 'all' }]],
    ['one big bubble per value stream', [{ role: 'group', fact: 'folder' }, { fold: 'all' }]],
    ['show the groups as bubbles', [{ fold: 'all' }]],
    ['fold everything', [{ fold: 'all' }]], ['collapse all the groups', [{ fold: 'all' }]],
    ['open everything', [{ fold: 'none' }]], ['unfold all', [{ fold: 'none' }]],
    ['visa varje kund som en bubbla', [{ role: 'group', fact: 'counterparty' }, { fold: 'all' }]], ['fäll ihop allt', [{ fold: 'all' }]],
    ['size the bubbles by value', [{ bubbleBy: 'value' }]], ['group bubbles by count', [{ bubbleBy: 'count' }]],
  ];
  for (const [q, want] of PHRASES) test(JSON.stringify(q), () => assert.deepEqual(acts(world(), q), want));

  test('some names: only these, or all but these — read with the map\'s own conditions', () => {
    const w = world();
    const only = acts(w, 'only show names for Juno');
    assert.equal(only.length, 1); assert.equal(only[0].names.mode, 'only'); assert.match(only[0].names.label, /Juno/);
    const hide = acts(w, 'hide the names of the drafts');
    assert.equal(hide[0].names.mode, 'hide');
    assert.equal(acts(w, 'names only for Naivas')[0].names.mode, 'only');
    assert.equal(acts(w, 'visa bara namn för Juno')[0].names.mode, 'only');
    assert.deepEqual(acts(w, 'only show names for moon phase'), [{ namesUnknown: 'moon phase' }], 'an unknown set is said, not guessed');
  });

  test('the old roads are not taken over', () => {
    const w = world();
    assert.deepEqual(acts(w, 'size by value'), [{ role: 'size', fact: 'value' }]);
    assert.equal(acts(w, 'show Juno contracts')[0].narrow.mode, 'only');
    assert.deepEqual(acts(w, 'colour by status'), [{ role: 'colour', fact: 'status' }]);
  });

  test('done on the map: undoable, clamped, kept in the recipe, and said back', () => {
    const w = world();
    w.eval('rebuildIntelGraph=()=>{};');
    w.igRecipeRun({ acts: [{ names: { mode: 'none' } }] });
    assert.equal(w.intel.names.mode, 'none');
    assert.ok(w.igRecipeSays().some(x => /names hidden/.test(x)));
    w.igRecipeRun({ acts: [{ undo: true }] });
    assert.equal(w.intel.names, null, 'undo brings the names back');
    for (let i = 0; i < 6; i++) w.igRecipeRun({ acts: [{ dots: 1.5 }] });
    assert.equal(w.intel.dotScale, 3, 'never past the map\'s largest');
    assert.equal(w.igRecipeNow().dotScale, 3, 'a saved view keeps it');
    w.igRecipeRun({ acts: [{ dots: 'reset' }] }); assert.equal(w.intel.dotScale, 1);
    w.igRecipeRun({ acts: [{ fold: 'all' }] }); assert.equal(w.intel.foldWant, 'all', 'applied to the groups as they are built');
  });
});
