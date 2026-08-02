/* ============================================================
   F90 — two pages, one function name, and the app loads both
   ============================================================
   The Redline Workbench (js/views/negotiation.js) and the Doc Lab
   (js/views/doclab.js) both publish `rlToggleDiscussion`, and both for the
   same good reason: the master design calls it from an `onclick=` attribute,
   so the NAME is part of the contract each page is held to.

   js/app.js imports the workbench first and the lab second. The lab's
   assignment therefore took the name off the workbench, and the Redline page's
   Discussion fold ran the LAB's body against the LAB's element — putting
   `disc-off` on #rl-grid when the workbench's own rule is written against
   `.redline-page.disc-off`. Pressing the chevron on the Redline page did
   nothing whatsoever.

   Nothing failed loudly. Both pages mount an element called #rl-grid, so there
   was no error and no exception; the fold simply stopped working. And it could
   only be seen in the running app: every other test stage loads ONE view
   module, which makes the collision unreproducible by construction — a whole
   class of defect that a per-module test can never catch. It was found by
   driving the real server in a real browser.

   So this file loads BOTH, in js/app.js order, and holds three things:
     · each page's fold works while that page is the one on screen;
     · neither page's fold reaches into the other's markup;
     · and no OTHER name is shared between the two files, checked against the
       source rather than against a list somebody has to remember to update. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n');

function contractFixture(){
  return { id: 'MK-238', name: 'Raw Material Supply Agreement',
    counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text' };
}

/* The workbench, rendered on a stage that ALSO holds the Doc Lab — which is
   the only arrangement that can see this bug. */
async function page(){
  const w = buildWorld({ negotiationView: true, docLabView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = contractFixture();
  win.negoInit(c);
  await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
    { side: 'counterparty', author: 'Amina Wanjiru' });
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  return { w, win, c, doc: win.document,
    $: sel => win.document.querySelector(sel) };
}

describe('F90 — the Redline page keeps its own fold with the Doc Lab loaded', () => {
  test('both view modules really are on this stage', async () => {
    const p = await page();
    assert.equal(typeof p.win.renderRedline, 'function', 'the workbench is loaded');
    assert.equal(typeof p.win.renderDocLab, 'function',
      'the lab is loaded — without it this file proves nothing');
  });

  test('the mode marks the workbench page, not the lab\'s grid', async () => {
    const p = await page();
    const view = p.$('#view-redline');
    assert.ok(view.classList.contains('redline-page'), 'the workbench owns this page');

    assert.equal(p.win.rlToggleDiscussion(true), true,
      'the shared name must still reach the workbench when the workbench is showing');
    assert.equal(view.getAttribute('data-rl-side-mode'), 'changes',
      'the attribute belongs on the root the [data-rl-side-mode] rules are written against');
    assert.ok(!p.$('#rl-grid').classList.contains('disc-off'),
      'marking the grid is what made the old fold silently inert');

    assert.equal(p.win.rlToggleDiscussion(false), false);
    assert.equal(view.getAttribute('data-rl-side-mode'), 'disc');
    p.win.rlSetSideMode('changes');
  });

  test('the tabs in the rendered markup go to the same place', async () => {
    // the buttons the reader actually presses, not the function a test can call
    const p = await page();
    p.$('#rl-side [data-rl-mode="disc"]').click();
    assert.equal(p.$('#view-redline').getAttribute('data-rl-side-mode'), 'disc');
    p.$('#rl-side [data-rl-mode="changes"]').click();
    assert.equal(p.$('#view-redline').getAttribute('data-rl-side-mode'), 'changes');
  });

  test('the preference still survives a repaint', async () => {
    const p = await page();
    p.win.rlToggleDiscussion(false);      // discussion showing
    p.win.renderRedline();
    assert.equal(p.$('#view-redline').getAttribute('data-rl-side-mode'), 'disc',
      'a mode that resets itself on every repaint is not a preference');
    p.win.rlSetSideMode('changes');
  });

  test('with no workbench page mounted, the name is the lab\'s again', async () => {
    /* The delegation is conditional on the workbench OWNING the page. On the
       lab's own screen — #view-redline without .redline-page — the lab's body
       has to run, or fixing one page would have broken the other. */
    const p = await page();
    const view = p.$('#view-redline');
    view.classList.remove('redline-page');
    p.win.rlToggleDiscussion();
    assert.ok(p.$('#rl-grid').classList.contains('disc-off'),
      'the lab folds by marking the grid, and must still be able to');
    assert.ok(!view.classList.contains('disc-off'));
  });
});

describe('F90 — and no other name is quietly shared between the two files', () => {
  test('the only overlap is the one the design forces', async () => {
    /* Read from the SOURCE, so a new collision is caught the day it is
       written rather than the day somebody notices a button doing nothing.
       rlToggleDiscussion is the one allowed overlap — the master design names
       it in an onclick on both pages — and it is allowed only because the two
       implementations now delegate rather than clobber. */
    const names = file => {
      const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      const out = new Set();
      for (const m of src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) out.add(m[1]);
      for (const m of src.matchAll(/Object\.assign\(window,\s*\{([\s\S]*?)\}\s*\)/g))
        for (const t of m[1].split(/[,\n]/)){
          const k = t.trim().split(':')[0].trim();
          if (/^[A-Za-z_$][\w$]*$/.test(k)) out.add(k);
        }
      return out;
    };
    const nego = names('js/views/negotiation.js');
    const lab = names('js/views/doclab.js');
    const shared = [...nego].filter(n => lab.has(n)).sort();
    assert.deepEqual(shared, ['rlToggleDiscussion'],
      'a name published by both files means whichever loads second wins, silently — '
      + `found ${JSON.stringify(shared)}`);
  });
});
