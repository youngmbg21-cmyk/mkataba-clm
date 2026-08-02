/* ============================================================
   F94 — focus mode: the chrome steps aside, the work does not move
   ============================================================
   Focus mode hides the Redline page's shell and banner block and hands their
   height to the document and the sidebar. THE TOOLBAR STAYS — exactly as the
   Doc page's focus mode keeps its tab row — because it holds the engine's
   proxies, the type stepper, the contract jump, and the way OUT: the same
   button that entered the mode, now pressed and wearing a dark face. Three
   properties make it safe, and all rot invisibly if unpinned:

     · IT IS A CLASS FLIP, NOT A REPAINT. The banner can hold the set-once
       counterparty email form; hiding must be display:none over the same
       nodes, never removal. And because nothing rebuilds, the three scroll
       boxes keep their positions — the whole point of a reading mode.

     · THE WAY OUT NEVER HIDES. The toggle lives on the toolbar, and the
       toolbar stays on screen; a control that hides itself cannot be pressed
       again. Esc works beside it, and arriving at the tab from any other view
       always lands on the full screen.

     · THE BUTTON'S FACE TELLS THE TRUTH. aria-pressed and the .on class flip
       with the mode, on entry, on exit, and across a repaint. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-246', name: 'WH — Young',
    counterparty: 'Kabras Sugar', template: 'RM', status: 'Drafting',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

/* The page rendered the way the router renders it, same stage as F84. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => 'Because the commercial terms require it.';
  const c = opts.contract || contractFixture();
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.rlResetFocus();                   // each test starts on the full screen
  win.renderRedline();
  const doc = win.document;
  return { w, win, c, doc,
    $: sel => doc.querySelector(sel),
    view: () => doc.getElementById('view-redline'),
    css: () => (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent };
}

describe('F94 — the toggle exists, and the page starts un-focused', () => {
  test('the focus button sits in the toolbar strip, beside the type stepper', async () => {
    const p = await page();
    const btn = p.$('[data-rl-focus]');
    assert.ok(btn, 'the focus button is missing');
    const strip = p.$('.rl-head-id');
    assert.ok(strip && strip.contains(btn), 'the focus button must live in the toolbar strip');
    assert.ok(strip.contains(p.$('.rl-type-step')),
      'the type stepper shares the strip — the button is placed beside it');
  });

  test('a fresh render is NOT in focus mode, and the button says so', async () => {
    const p = await page();
    assert.ok(!p.view().classList.contains('rl-focus'));
    assert.equal(p.win.rlFocusOn(), false);
    const btn = p.$('[data-rl-focus]');
    assert.equal(btn.getAttribute('aria-pressed'), 'false');
    assert.ok(!btn.classList.contains('on'));
  });
});

describe('F94 — entering and leaving through the one button', () => {
  test('first press enters, second press leaves; the flag agrees with the class', async () => {
    const p = await page();
    const btn = p.$('[data-rl-focus]');
    btn.click();
    assert.ok(p.view().classList.contains('rl-focus'), 'clicking the button must enter focus');
    assert.equal(p.win.rlFocusOn(), true);
    btn.click();
    assert.ok(!p.view().classList.contains('rl-focus'), 'clicking it again must leave focus');
    assert.equal(p.win.rlFocusOn(), false);
  });

  test('the button wears the mode: aria-pressed and .on flip with each press', async () => {
    const p = await page();
    const btn = p.$('[data-rl-focus]');
    btn.click();
    assert.equal(btn.getAttribute('aria-pressed'), 'true', 'pressed must be said, not just shown');
    assert.ok(btn.classList.contains('on'), 'the dark face is the .on class');
    btn.click();
    assert.equal(btn.getAttribute('aria-pressed'), 'false');
    assert.ok(!btn.classList.contains('on'));
  });

  test('entering is a class flip over the SAME nodes — nothing is rebuilt or removed', async () => {
    const p = await page();
    const before = { doc: p.$('#rl-doc'), shell: p.$('.rl-shell'), banner: p.$('#rl-banner'),
      head: p.$('.rl-head') };
    p.$('[data-rl-focus]').click();
    assert.equal(p.$('#rl-doc'), before.doc, 'the document pane must be the same element');
    assert.equal(p.$('.rl-shell'), before.shell, 'the shell is hidden, never removed');
    assert.equal(p.$('#rl-banner'), before.banner, 'the banner block is hidden, never removed');
    assert.equal(p.$('.rl-head'), before.head, 'the toolbar is untouched — it does not even hide');
  });

  test('Esc leaves focus mode, and does nothing when the mode is off', async () => {
    const p = await page();
    const esc = () => p.doc.dispatchEvent(new p.win.KeyboardEvent('keydown',
      { key: 'Escape', bubbles: true }));
    p.$('[data-rl-focus]').click();
    esc();
    assert.equal(p.win.rlFocusOn(), false, 'Esc must exit focus mode');
    esc();
    assert.equal(p.win.rlFocusOn(), false, 'a second Esc is a no-op, not a toggle');
  });

  test('a repaint mid-session comes back in the mode it left, button face included', async () => {
    // saving a redline or answering a card repaints the whole page; the mode
    // must survive that, or the chrome would jump back over the reader's work
    const p = await page();
    p.$('[data-rl-focus]').click();
    p.win.renderRedline();
    assert.ok(p.view().classList.contains('rl-focus'),
      'renderRedline must re-read the flag and repaint focused');
    const btn = p.$('[data-rl-focus]');
    assert.equal(btn.getAttribute('aria-pressed'), 'true', 'the fresh button must say pressed');
    assert.ok(btn.classList.contains('on'));
  });

  test('rlResetFocus lands the NEXT render on the full screen — the router\'s arrival path', async () => {
    const p = await page();
    p.$('[data-rl-focus]').click();
    p.win.rlResetFocus();               // what setView does when the tab is entered
    p.win.renderRedline();
    assert.ok(!p.view().classList.contains('rl-focus'));
  });
});

describe('F94 — the stylesheet keeps the bargain', () => {
  test('focus hides exactly the shell and the banner, by display:none — never the toolbar', async () => {
    const p = await page();
    const css = p.css();
    const rule = css.match(/\.redline-page\.rl-focus \.rl-shell,\s*\.redline-page\.rl-focus #rl-banner\{display:none\}/);
    assert.ok(rule, 'the shell and the banner block hide together under .rl-focus');
    assert.ok(!/\.rl-focus[^{}]*\.rl-head[^{}]*\{[^}]*display:none/.test(css),
      'no rule may hide the toolbar under focus — it carries the way out');
  });

  test('the pressed button has its dark face in the stylesheet', async () => {
    const p = await page();
    assert.ok(/\.rl-focus-btn\.on/.test(p.css()),
      'the .on face must be styled, or a pressed toggle looks identical to an idle one');
  });
});
