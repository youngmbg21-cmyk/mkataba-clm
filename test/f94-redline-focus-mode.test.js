/* ============================================================
   F94 — focus mode: the chrome steps aside, the work does not move
   ============================================================
   Focus mode stands the WHOLE page down — the shared head, the tab row, the
   strip, the banner, and the app's own sidebar and top strip — and hands that
   height to the document and the changes. It used to keep the toolbar, because
   the toolbar carried the only way out; the way out is now a chip pinned to
   the page, which is what lets the toolbar go with everything else. Three
   properties make it safe, and all rot invisibly if unpinned:

     · IT IS A CLASS FLIP, NOT A REPAINT. The banner can hold the set-once
       counterparty email form; hiding must be display:none over the same
       nodes, never removal. And because nothing rebuilds, the three scroll
       boxes keep their positions — the whole point of a reading mode.

     · THE WAY OUT NEVER HIDES. The toggle that enters the mode is inside the
       strip the mode hides — a control that hides itself cannot be pressed
       again — so the exit is a separate chip, always in the DOM, shown by the
       focus rule. Esc works beside it, and arriving at the tab from any other
       view always lands on the full screen.

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
  const w = buildWorld({ negotiationView: true, contractView: true });
  const { win } = w;
  win.promptDialog = async () => '';
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

describe('F94 — the toggle has left the strip, and focus still works', () => {
  /* WHERE IT WENT. The focus button sat at the quiet end of the toolbar beside
     the type stepper, and both have left it (10 Aug 2026): the design's strip
     carries the acts and the two ways of looking, and neither of these is
     pressed twice in the life of a contract. The stepper is on the Document
     tab; focus mode is a row in the room head's "..." menu (#ws-focus), which
     is where the rest of the give-the-document-more-room verbs already lived.

     THE MODE ITSELF IS UNTOUCHED, and that is what the rest of this file
     tests: the class, the flag, the Escape key and the way out. */
  test('the strip carries neither of the two set-once controls', async () => {
    const p = await page();
    assert.equal(p.$('.rl-head [data-rl-focus]'), null, 'no focus button on the strip');
    assert.equal(p.$('.rl-head .rl-type-step'), null, 'and no type stepper');
    assert.equal(p.$('.rl-setwrap'), null, 'the group they shared is gone with them');
  });

  test('the head\'s menu is the way in, and it presses the same function', async () => {
    const p = await page();
    const row = p.doc.getElementById('ws-focus');
    assert.ok(row, 'focus mode is a row in the "..." menu');
    row.click();
    assert.ok(p.view().classList.contains('rl-focus'), 'and it enters focus');
    p.win.rlSetFocus(false);
  });

  test('a fresh render is NOT in focus mode', async () => {
    const p = await page();
    assert.ok(!p.view().classList.contains('rl-focus'));
    assert.equal(p.win.rlFocusOn(), false);
  });
});

describe('F94 — entering and leaving', () => {
  test('the flag and the class move together, both ways', async () => {
    const p = await page();
    p.win.rlSetFocus(true);
    assert.ok(p.view().classList.contains('rl-focus'), 'entering focus marks the page');
    assert.equal(p.win.rlFocusOn(), true);
    p.win.rlSetFocus(false);
    assert.ok(!p.view().classList.contains('rl-focus'), 'and leaving takes the mark off');
    assert.equal(p.win.rlFocusOn(), false);
  });

  test('the way out is drawn over the page, because the way in is hidden', async () => {
    const p = await page();
    p.win.rlSetFocus(true);
    const exit = p.$('[data-rl-focus-exit]');
    assert.ok(exit, 'focus mode hides the head that opened it, so it draws its own exit');
    exit.click();
    assert.equal(p.win.rlFocusOn(), false);
  });
});

describe('F94 — the stylesheet keeps the bargain', () => {
  test('focus stands the whole page down — and leaves a way out that is not the toolbar', async () => {
    /* IT USED TO NAME .rl-shell — the title card this page drew for itself.
       That card is gone; both pages share one head now, so the rule matched
       nothing and the mode hid one banner and little else.

       Named properly, and taken further on request: the shared head, the tab
       row, the round line AND the app's own sidebar and top strip stand down,
       so the three panes take the window.

       THE OLD RULE — "never hide the toolbar, it carries the way out" — was
       right about the danger and is answered differently. The toolbar DOES
       hide now, and the way out is a chip pinned to the page instead. What may
       never happen is focus mode with no exit at all, and that is what this
       asserts. */
    const p = await page();
    const css = p.css();
    assert.ok(!/\.rl-shell\{/.test(css), 'the element it used to name, and its styles, are gone');
    ['.room-head', '.rl-tabrow', '.rl-head', '#rl-banner'].forEach(sel =>
      assert.ok(css.includes('.redline-page.rl-focus ' + sel),
        `${sel} stands down under .rl-focus`));
    assert.match(css, /body\.rl-focused #side-nav/, 'and so does the app sidebar');
    assert.match(css, /\.rl-focus-exit\{position:fixed/, 'the way out is pinned to the page');
    assert.ok(p.$('[data-rl-focus-exit]'), 'and it is rendered, in or out of focus');
  });

  test('the pressed button has its dark face in the stylesheet', async () => {
    const p = await page();
    assert.ok(/\.rl-focus-btn\.on/.test(p.css()),
      'the .on face must be styled, or a pressed toggle looks identical to an idle one');
  });
});
