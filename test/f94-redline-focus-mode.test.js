/* ============================================================
   F94 — focus mode: the chrome steps aside, the work does not move
   ============================================================
   Focus mode hides the Redline page's three tiers of chrome — the shell, the
   toolbar strip and the banner block — and hands their height to the document
   and the sidebar. Two properties make it safe, and both are the kind that
   rot invisibly if unpinned:

     · IT IS A CLASS FLIP, NOT A REPAINT. The toolbar holds the proxies the
       engine's controls are pressed through, and the banner can hold the
       set-once counterparty email form; hiding must be display:none over the
       same nodes, never removal. And because nothing rebuilds, the three
       scroll boxes keep their positions — the whole point of a reading mode.

     · EVERY WAY IN HAS A VISIBLE WAY OUT. The exit pill floats over the
       document whenever the mode is on, Esc works beside it, and arriving at
       the tab from any other view always lands on the full screen: a mode
       whose exits are hidden is a trap, so none of these is optional. */
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

describe('F94 — the two controls exist, and the page starts un-focused', () => {
  test('the enter button sits in the toolbar strip, beside the type stepper', async () => {
    const p = await page();
    const btn = p.$('[data-rl-focus]');
    assert.ok(btn, 'the focus button is missing');
    const strip = p.$('.rl-head-id');
    assert.ok(strip && strip.contains(btn), 'the focus button must live in the toolbar strip');
    assert.ok(strip.contains(p.$('.rl-type-step')),
      'the type stepper shares the strip — the button is placed beside it');
  });

  test('the exit pill is rendered on the page, outside the chrome it hides', async () => {
    const p = await page();
    const pill = p.$('[data-rl-unfocus]');
    assert.ok(pill, 'the exit pill is missing');
    assert.ok(p.view().contains(pill), 'the pill must be inside #view-redline');
    for (const sel of ['.rl-shell', '.rl-head', '#rl-banner'])
      assert.ok(!p.$(sel).contains(pill),
        `the pill must not live inside ${sel} — hiding that would hide the way back`);
  });

  test('the pill says where the reader is: the round and the view', async () => {
    const p = await page();
    const pill = p.$('[data-rl-unfocus]');
    assert.match(pill.textContent, /Round 1/, 'the round is named on the pill');
    assert.match(pill.textContent, /Internal View/, 'and so is the side being viewed');
  });

  test('a fresh render is NOT in focus mode', async () => {
    const p = await page();
    assert.ok(!p.view().classList.contains('rl-focus'));
    assert.equal(p.win.rlFocusOn(), false);
  });
});

describe('F94 — entering and leaving', () => {
  test('the button enters; the pill leaves; the flag agrees with the class', async () => {
    const p = await page();
    p.$('[data-rl-focus]').click();
    assert.ok(p.view().classList.contains('rl-focus'), 'clicking the button must enter focus');
    assert.equal(p.win.rlFocusOn(), true);
    p.$('[data-rl-unfocus]').click();
    assert.ok(!p.view().classList.contains('rl-focus'), 'clicking the pill must leave focus');
    assert.equal(p.win.rlFocusOn(), false);
  });

  test('entering is a class flip over the SAME nodes — nothing is rebuilt or removed', async () => {
    const p = await page();
    const before = { doc: p.$('#rl-doc'), shell: p.$('.rl-shell'), banner: p.$('#rl-banner') };
    p.$('[data-rl-focus]').click();
    assert.equal(p.$('#rl-doc'), before.doc, 'the document pane must be the same element');
    assert.equal(p.$('.rl-shell'), before.shell, 'the shell is hidden, never removed');
    assert.equal(p.$('#rl-banner'), before.banner, 'the banner block is hidden, never removed');
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

  test('a repaint mid-session comes back in the mode it left', async () => {
    // saving a redline or answering a card repaints the whole page; the mode
    // must survive that, or the chrome would jump back over the reader's work
    const p = await page();
    p.$('[data-rl-focus]').click();
    p.win.renderRedline();
    assert.ok(p.view().classList.contains('rl-focus'),
      'renderRedline must re-read the flag and repaint focused');
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
  test('focus hides exactly the three tiers of chrome, by display:none', async () => {
    const p = await page();
    const css = p.css();
    const rule = css.match(/\.redline-page\.rl-focus \.rl-shell,\s*\.redline-page\.rl-focus \.rl-head,\s*\.redline-page\.rl-focus #rl-banner\{display:none\}/);
    assert.ok(rule, 'the shell, the strip and the banner block hide together under .rl-focus');
  });

  test('the exit pill is hidden outside focus mode and floats inside it', async () => {
    const p = await page();
    const css = p.css();
    assert.ok(/\.redline-page \.rl-focus-exit\{display:none\}/.test(css),
      'the pill must not be visible on the regular screen');
    assert.ok(/\.redline-page\.rl-focus \.rl-focus-exit\{position:absolute/.test(css),
      'and must float over the page when focus is on');
  });
});
