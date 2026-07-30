/* ============================================================
   F84 — the Redline Workbench keeps the master design's contract
   ============================================================
   The Redline tab is a port of a design mockup (HaTi Platform.html), and a
   port has two ways to rot. The obvious one is visual: somebody nudges a
   column and the 6/3/3 grid quietly becomes 1.9fr/.85fr/.9fr again, which
   looks close enough in a screenshot and is measurably not the design. The
   less obvious one is structural: the design names its parts — #view-redline,
   #rl-doc, #rl-changes, #rl-threads, #rl-banner — and those names are the
   handle everything else reaches for. Rename one to suit a refactor and the
   page still renders, so nothing fails, until whatever was holding that handle
   needs it.

   So this file pins the CONTRACT rather than the appearance:

     · the ids exist, on the right elements, in the right nesting;
     · the engine's own hooks are still there beside them — this port ADDS the
       design's names, it does not rename the wiring out from under
       wireNegotiationTab, the counterparty portal or the room;
     · the grid is twelve real columns at 6/3/3, folding to 8/4;
     · the header's three actions press the engine's controls rather than
       lookalikes, and disable themselves when the engine has nothing to press;
     · the clause toolbar files against the CONTRACT, not the Doc Lab sandbox.

   The last one is the one worth having. AI Assist / Add Note/Tag / Direct Edit
   exist in js/views/doclab.js too, look identical, and write to hati.lab.v1 —
   a store that by design cannot reach a contract. Wired onto this page they
   would appear to work and file nothing. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. TERMINATION',
  '3. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-238', name: 'Raw Material Supply Agreement',
    counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

/* The page rendered the way the router renders it: renderRedline() reads
   state.activeId and writes into #content, so the stage supplies both and then
   reads back the real DOM. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = opts.contract || contractFixture();
  win.negoInit(c);
  if (opts.withChange !== false){
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'counterparty', author: 'Erik Lindqvist · Kabras Sugar' });
  }
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  return { w, win, c, doc,
    $: sel => doc.querySelector(sel),
    $$: sel => [...doc.querySelectorAll(sel)],
    html: () => doc.getElementById('content').innerHTML,
    css: () => (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent };
}

describe('F84 — the design names every part, and the names are on the page', () => {
  /* Each id is asserted with what it must BE, not merely that it exists: an id
     on the wrong element is the failure this is written against, and it is
     invisible to a plain presence check. */
  test('every id in the design contract is present', async () => {
    const p = await page();
    for (const id of ['view-redline', 'rl-banner', 'rl-grid', 'rl-doc',
      'rl-changes-col', 'rl-changes', 'rl-disc-col', 'rl-threads',
      'rl-disc-show', 'rl-rail-count', 'rl-thread-count'])
      assert.ok(p.$('#' + id), `#${id} is missing from the rendered workbench`);
  });

  test('the three columns are the document, the changes and the discussion', async () => {
    const p = await page();
    const grid = p.$('#rl-grid');
    assert.ok(grid.contains(p.$('#rl-doc')), 'the document is not in the grid');
    assert.ok(grid.contains(p.$('#rl-changes-col')), 'tracked changes is not in the grid');
    assert.ok(grid.contains(p.$('#rl-disc-col')), 'the discussion is not in the grid');
  });

  test('#rl-changes is the card list inside the changes column', async () => {
    const p = await page();
    assert.ok(p.$('#rl-changes-col').contains(p.$('#rl-changes')));
    assert.ok(p.$('#rl-changes').querySelector('[data-nego-card]') ||
      p.$('#rl-changes').textContent.trim().length,
      'the design\'s card list must hold the engine\'s cards');
  });

  test('#rl-threads is present even with nothing to say', async () => {
    // the empty state is where a "render it only when it has content" bug hides
    const p = await page({ withChange: false });
    assert.ok(p.$('#rl-threads'), 'the thread list must exist before the first thread');
  });

  test('#rl-banner carries the wall, which is a disclosure boundary', async () => {
    const p = await page();
    assert.match(p.$('#rl-banner').textContent, /The wall:/,
      'the banner slot must hold the internal/shared wall, not be an empty div');
  });
});

describe('F84 — the port adds the design\'s names, it does not rename the wiring', () => {
  /* If any of these go, the page still draws and the buttons stop working —
     the exact failure mode a visual review cannot catch. */
  test('the engine\'s own hooks survive beside the design\'s ids', async () => {
    const p = await page();
    assert.ok(p.$('#nego-root'), 'the room\'s token scope, without which the tools render invisible');
    assert.ok(p.$('#nego-cards'), 'the scroll box the counterparty portal reaches for by name');
    assert.ok(p.$('#rl-grid').classList.contains('nego-work'),
      'the clause tooling is scoped under .nego-work');
    assert.ok(p.$('#rl-doc').classList.contains('nego-pane') &&
      p.$('#rl-doc').classList.contains('working'),
      'the working-pane classes carry the clause tools and the fingerprint margin');
  });

  test('the document pane still carries the engine\'s clause hooks', async () => {
    const p = await page();
    const clause = p.$('#rl-doc [data-clause]');
    assert.ok(clause, 'no clause carries data-clause');
    assert.ok(clause.hasAttribute('data-nego-working'),
      'data-nego-working is how the engine finds the working copy of a clause');
  });
});

describe('F84 — twelve columns, six/three/three, folding to eight/four', () => {
  const spanOf = (css, sel) => {
    // the declaration block for exactly this selector, then its span
    const re = new RegExp(sel.replace(/[.#*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}');
    const m = css.match(re);
    return m && /grid-column:span (\d+)/.exec(m[1]) ? Number(/grid-column:span (\d+)/.exec(m[1])[1]) : null;
  };

  test('the grid is twelve real columns, not a fraction that looks like it', async () => {
    const p = await page();
    assert.match(p.css(), /\.redline-page \.rl-grid\{[^}]*grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/,
      'the design is a twelve-column grid; fractions cannot hold the ratio exactly');
  });

  test('open, the split is 6 / 3 / 3', async () => {
    const css = (await page()).css();
    assert.equal(spanOf(css, '.redline-page .rl-doc'), 6);
    assert.equal(spanOf(css, '.redline-page #rl-changes-col'), 3);
    assert.equal(spanOf(css, '.redline-page #rl-disc-col'), 3);
  });

  test('folded, it re-deals to 8 / 4 and the third column leaves', async () => {
    const css = (await page()).css();
    assert.equal(spanOf(css, '.redline-page.disc-off .rl-doc'), 8);
    assert.equal(spanOf(css, '.redline-page.disc-off #rl-changes-col'), 4);
    assert.match(css, /\.redline-page\.disc-off #rl-disc-col\{display:none\}/,
      'a collapsed column must leave the row, not sit in it at zero width');
  });

  test('the discussion survives a 13-inch laptop', async () => {
    // it used to be dropped below 1500px, which is most of the screens this is
    // actually read on; the design keeps all three from lg (1024px) up
    const css = (await page()).css();
    assert.ok(!/@media \(max-width:1500px\)/.test(css),
      'the three-column layout must not be abandoned above the design\'s lg breakpoint');
    assert.match(css, /@media \(max-width:1023px\)/, 'below lg the design stacks to one column');
  });
});

describe('F84 — the fold is a real function, and it remembers', () => {
  test('rlToggleDiscussion() toggles the page and the reveal chip together', async () => {
    const p = await page();
    const view = p.$('#view-redline'), chip = p.$('#rl-disc-show');
    assert.ok(!view.classList.contains('disc-off'), 'it starts open');
    assert.ok(chip.hidden, 'the reveal chip is for when the column is gone');

    assert.equal(p.win.rlToggleDiscussion(), true);
    assert.ok(view.classList.contains('disc-off'));
    assert.ok(!chip.hidden, 'with the column gone, the chip is the only way back');

    assert.equal(p.win.rlToggleDiscussion(), false);
    assert.ok(!view.classList.contains('disc-off'));
    assert.ok(chip.hidden);
  });

  test('the choice survives a repaint', async () => {
    const p = await page();
    p.win.rlToggleDiscussion(true);
    p.win.renderRedline();
    assert.ok(p.$('#view-redline').classList.contains('disc-off'),
      'a fold that unfolds itself on every clause is not a preference');
    assert.ok(!p.$('#rl-disc-show').hidden);
  });

  test('the chip and the header both call it', async () => {
    const p = await page();
    p.$('#rl-disc-show').click();
    assert.ok(p.$('#view-redline').classList.contains('disc-off'));
    p.$('#rl-disc-show').click();
    assert.ok(!p.$('#view-redline').classList.contains('disc-off'));
  });
});

describe('F84 — the header actions press the engine, not a lookalike', () => {
  test('the design\'s three header controls are all there', async () => {
    const p = await page();
    const labels = p.$$('.rl-actions button').map(b => b.textContent.trim());
    assert.ok(labels.some(t => /Internal View/.test(t)));
    assert.ok(labels.some(t => /Counterparty View/.test(t)));
    assert.ok(labels.some(t => /Accept All Non-Risk/.test(t)));
    assert.ok(labels.some(t => /Publish Round/.test(t)));
  });

  test('Accept All Non-Risk fires the engine\'s own bulk control', async () => {
    const p = await page();
    const engine = p.doc.getElementById('nego-bulk-acc');
    assert.ok(engine, 'the engine\'s bulk-accept must be in the DOM to be pressed');
    let fired = 0;
    engine.addEventListener('click', () => { fired++; });
    p.$('[data-redline-proxy="nego-bulk-acc"]').click();
    assert.equal(fired, 1, 'the header button must route through the engine\'s control');
  });

  test('a header button disables itself rather than lying', async () => {
    /* The header's actions are proxies: each presses a control the ENGINE
       renders, and the engine renders it only when there is something to
       press. So the honest state of the header button is whatever the engine's
       control is — which is what redlineSyncProxies reads. Taking the engine's
       control away is the case that matters: the proxy must go dead with it
       rather than stay lit and do nothing when clicked. */
    const p = await page();
    const proxy = p.$('[data-redline-proxy="nego-send"]');
    assert.ok(!proxy.disabled, 'with the engine offering a send, the header offers it too');

    p.doc.getElementById('nego-send').remove();
    p.win.redlineSyncProxies(p.doc.getElementById('content'));
    assert.ok(proxy.disabled, 'a button that cannot do its job must say so');
    assert.match(proxy.title, /Not available/, 'and say why, on hover');
  });

  test('the view toggle switches side and re-renders', async () => {
    const p = await page();
    p.$$('[data-redline-side]').find(b => b.getAttribute('data-redline-side') === 'counterparty').click();
    assert.ok(p.$('[data-redline-side="counterparty"]').classList.contains('on'),
      'the pressed side must read as pressed after the repaint');
  });
});

describe('F84 — the clause toolbar files against the contract, not the sandbox', () => {
  test('every clause carries the design\'s three verbs', async () => {
    const p = await page();
    const clause = p.$('#rl-doc .rl-clause');
    const labels = [...clause.querySelectorAll('.rl-tool')].map(b => b.textContent.trim());
    assert.ok(labels.some(t => /AI Assist/.test(t)));
    assert.ok(labels.some(t => /Add Note\/Tag/.test(t)));
    assert.ok(labels.some(t => /Direct Edit/.test(t)));
  });

  test('Direct Edit is the engine\'s propose handler, by attribute', async () => {
    const p = await page();
    const edit = [...p.$$('#rl-doc .rl-tool')].find(b => /Direct Edit/.test(b.textContent));
    assert.ok(edit.hasAttribute('data-nego-edit'),
      'Direct Edit must carry the attribute wireNegotiationTab binds the propose dialog to');
  });

  test('nothing on this page reaches for the Doc Lab\'s sandbox store', async () => {
    const p = await page();
    const raw = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    /* Comments stripped first: the code is allowed to NAME the store it is
       warning future readers away from, and does. What must not appear is a
       reference the engine would actually execute. */
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    assert.ok(!/hati\.lab\.v1/.test(src),
      'the workbench must never write to the lab\'s store — it cannot reach a contract');
    assert.ok(!/\blabFor\s*\(|\blabPut\s*\(/.test(src),
      'the lab\'s accessors write to the sandbox; the workbench files real changes');
    assert.ok(p.$('#rl-doc'), 'and the page still rendered');
  });

  test('AI Assist offers the engine\'s own actions, over this clause\'s words', async () => {
    const p = await page();
    const ai = [...p.$$('#rl-doc .rl-tool')].find(b => /AI Assist/.test(b.textContent));
    ai.click();
    const menu = p.$('.nego-selmenu');
    assert.ok(menu, 'AI Assist must open a menu');
    const offered = [...menu.querySelectorAll('[data-nego-ai]')].map(b => b.getAttribute('data-nego-ai'));
    /* Joined rather than deep-compared: the engine's array is built in the
       page's own realm, so its prototype is not this realm's Array and a deep
       compare reports a mismatch on two identical lists (the same trap f60
       documents). */
    assert.equal(offered.join(','), p.win.NEGO_AI_ACTIONS.map(a => a.id).join(','),
      'the menu must be built from the engine\'s action list, not a second copy');
    assert.match(menu.textContent, /This clause/);
  });

  test('the AI menu survives the gesture that opened it', async () => {
    /* Pressing the button is a mouseup inside the document pane, and the pane
       treats a mouseup as "the reader finished selecting words". A click
       collapses the selection, so the selection handler found none and
       dismissed the menu the button had just opened — the menu appeared and
       vanished, in that order, from one press. Real-browser measurement caught
       this; jsdom does not schedule it the same way, so the handler is invoked
       directly here rather than hoping the timing reproduces. */
    const p = await page();
    const ai = [...p.$$('#rl-doc .rl-tool')].find(b => /AI Assist/.test(b.textContent));
    ai.click();
    assert.ok(p.$('.nego-selmenu'), 'the menu must open');

    const ev = new p.win.MouseEvent('mouseup', { bubbles: true });
    ai.dispatchEvent(ev);
    await new Promise(r => setTimeout(r, 30));
    assert.ok(p.$('.nego-selmenu'),
      'a mouseup on a control is somebody operating the page, not selecting words in it');
  });

  test('Add Note/Tag on a clause with no change says so instead of filing one', async () => {
    const p = await page({ withChange: false });
    const note = [...p.$$('#rl-doc .rl-tool')].find(b => /Add Note\/Tag/.test(b.textContent));
    assert.ok(!note.hasAttribute('data-rl-change'), 'there is no change to hang a note on');
    note.click();
    assert.match(p.w.toastText(), /Propose an edit/,
      'an empty change filed to hold a note is a fingerprint nobody proposed');
  });

  test('Add Note/Tag unfolds the discussion before aiming at the composer', async () => {
    const p = await page();
    p.win.rlToggleDiscussion(true);              // the composer is now display:none
    const note = [...p.$$('#rl-doc .rl-tool')].find(b => b.hasAttribute('data-rl-change'));
    assert.ok(note, 'the changed clause should offer a note');
    note.click();
    assert.ok(!p.$('#view-redline').classList.contains('disc-off'),
      'focusing an input inside a hidden column silently does nothing');
  });
});

describe('F84 — focus mode', () => {
  test('it gives the document all twelve columns and hands them back', async () => {
    const p = await page();
    const css = p.css();
    assert.match(css, /\.redline-page\.rl-focus \.rl-doc\{grid-column:span 12\}/);
    assert.match(css, /\.redline-page\.rl-focus #rl-changes-col,\.redline-page\.rl-focus #rl-disc-col\{display:none\}/);

    assert.equal(p.win.rlToggleFocus(), true);
    assert.ok(p.$('#view-redline').classList.contains('rl-focus'));
    assert.equal(p.$('[data-rl-focus]').getAttribute('aria-pressed'), 'true');
    assert.equal(p.win.rlToggleFocus(), false);
    assert.ok(!p.$('#view-redline').classList.contains('rl-focus'));
  });

  test('leaving focus does not disturb the discussion preference', async () => {
    const p = await page();
    p.win.rlToggleDiscussion(true);
    p.win.rlToggleFocus(true);
    p.win.rlToggleFocus(false);
    assert.ok(p.$('#view-redline').classList.contains('disc-off'),
      'focus mode must put the page back as it found it, not as the design ships it');
  });
});
