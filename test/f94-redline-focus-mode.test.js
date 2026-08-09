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

describe('F94 — the toggle exists, and the page starts un-focused', () => {
  test('the focus button sits on the toolbar strip, beside the type stepper', async () => {
    /* WHAT THIS PINS, AND WHAT IT DELIBERATELY NO LONGER PINS. The pair belong
       together on the toolbar — that is the rule, and it still holds. Which END
       of the strip they sit at is not: they moved from the front of the row to
       the quiet end beside the view toggle, because neither is pressed twice in
       the life of a contract and they were holding the two positions the eye
       lands on first. So the assertion is "same strip, still together", which is
       the thing that would actually be wrong if somebody broke it. */
    const p = await page();
    const btn = p.$('[data-rl-focus]');
    assert.ok(btn, 'the focus button is missing');
    const strip = p.$('.rl-head');
    assert.ok(strip && strip.contains(btn), 'the focus button must live on the toolbar strip');
    const stepper = p.$('.rl-type-step');
    assert.ok(stepper && strip.contains(stepper),
      'the type stepper shares the strip');
    const pair = p.$('.rl-setwrap');
    assert.ok(pair && pair.contains(btn) && pair.contains(stepper),
      'the two set-once controls stay grouped, at the quiet end of the row');
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
    /* THIS WAS PASSING ON NOTHING. It compared `.rl-shell` before and after,
       and once that element was retired both lookups returned null — null
       equals null, so the assertion held while checking no element at all.
       It names the parts that actually exist now, and the head is asserted
       PRESENT so the comparison cannot go hollow the same way twice. */
    const p = await page();
    const before = { doc: p.$('#rl-doc'), head: p.$('.room-head'), banner: p.$('#rl-banner'),
      strip: p.$('.rl-head'), exit: p.$('[data-rl-focus-exit]') };
    assert.ok(before.head && before.banner && before.strip && before.exit,
      'the elements being compared must exist, or this test proves nothing');
    p.$('[data-rl-focus]').click();
    assert.equal(p.$('#rl-doc'), before.doc, 'the document pane must be the same element');
    assert.equal(p.$('.room-head'), before.head, 'the head is hidden, never removed');
    assert.equal(p.$('#rl-banner'), before.banner, 'the banner block is hidden, never removed');
    assert.equal(p.$('.rl-head'), before.strip, 'and so is the strip');
    assert.equal(p.$('[data-rl-focus-exit]'), before.exit, 'the way out is the same node throughout');
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
