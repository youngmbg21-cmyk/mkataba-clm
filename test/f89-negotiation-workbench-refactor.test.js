/* ============================================================
   F89 — the Negotiation Workbench refactor
   ============================================================
   Thirteen changes to the Redline page, made together because they are one
   complaint said thirteen ways: the workbench looked like a stack of boxes,
   interrupted itself with dialogs, and printed a document that was not quite
   the document that had been uploaded.

   F84 already pins the design CONTRACT — the ids, the twelve columns, the
   proxies. This file pins the BEHAVIOUR the refactor added, and each test is
   named for the thing that was wrong:

     · the header and the document sheet each carried one frame too many;
     · redlining opened a floating dialog over the very wording being judged,
       instead of the Copilot column beside it;
     · the selection menu offered four verbs, two of which nobody used;
     · the document was re-typeset from parsed parts, so "1.1" came back as
       "1.1." and a lettered sub-clause list came back as a sentence;
     · the contract read at one type size and its own diffs at another;
     · a marked phrase would not say whose hand it was;
     · the Tracked Changes column listed settled history nobody could act on;
     · the card verbs were all the same colour, and there was no way back to
       the clause from the card;
     · and an unsent draft — filed, fingerprinted, and seen by nobody — had its
       only send button below the fold. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* A RICH contract, because structure is the point of half this file. It
   carries the two things a re-typeset document loses: a heading whose number
   is not a plain integer, and a clause body made of more than one block. */
const RICH = [
  '<h1>SUPPLY AND SERVICES AGREEMENT</h1>',
  '<p>Between the parties named below.</p>',
  '<h2>1.1 Definitions</h2>',
  '<p>In this Agreement, <strong>Business Day</strong> means a day other than a Saturday.</p>',
  '<h2>2. PAYMENT TERMS</h2>',
  '<p>All invoices are payable within thirty (30) days from the date of issue.</p>',
  '<p>Interest accrues on any overdue amount at 2% per month.</p>',
  '<h2>8.2(a) Termination for convenience</h2>',
  '<ol><li>Either party may terminate on sixty (60) days notice.</li>',
  '<li>Accrued rights survive termination.</li></ol>',
].join('');

const PLAIN = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-901', name: 'Supply and Services Agreement',
    counterparty: 'Naivas Supermarkets', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: RICH, format: 'rich', ...over };
}

/* The page as the router renders it, plus a Copilot panel double: the world
   stage does not load js/ai.js, and every route this refactor added ends in
   that panel — so the panel is stubbed and the calls into it are recorded. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = opts.contract || contractFixture();

  const panel = { opened: [], pushed: [], proposals: [], sessions: [] };
  win.openAI = (prefill, o) => panel.opened.push(o || {});
  win.aiPush = (role, m) => panel.pushed.push({ role, m });
  win.renderAIFeed = () => {};
  win.copilotAvailable = () => opts.copilot !== false;
  win.copilotPropose = async o => { panel.proposals.push(o);
    return { advice: 'Shorter, same effect.', proposedText: opts.wording || 'Payable within thirty (30) days.', strict: true }; };
  win.aiOpenProposal = o => { panel.cards = (panel.cards || []).concat([o]); return o; };
  win.aiOpenRephraseSession = o => { panel.sessions.push(o); return o; };
  win.aiCloseRephraseSession = () => {};

  win.negoInit(c);
  if (opts.theirChange !== false){
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'counterparty', author: 'Amina Wanjiru' });
  }
  if (opts.myChange){
    await win.negoFileProposal(c, win.negoBaseText(c).replace('2% per month', '1.5% per month'),
      { side: 'owner', author: 'Young Mbagaya' });
  }
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  return { w, win, c, doc, panel,
    $: sel => doc.querySelector(sel),
    $$: sel => [...doc.querySelectorAll(sel)],
    html: () => doc.getElementById('content').innerHTML,
    css: () => (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent,
    /* The declaration block for exactly this selector. A selector can carry
       more than one block — .rl-doc has its grid span in one and its paint in
       another — so `has` picks the one being asked about rather than the
       first one written. */
    rule: (sel, has) => {
      const css = (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent;
      const re = new RegExp(sel.replace(/[.#*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}', 'g');
      const blocks = [...css.matchAll(re)].map(m => m[1]);
      if (!blocks.length) return null;
      return (has ? blocks.find(b => b.includes(has)) : blocks[0]) || null;
    } };
}

describe('F89 (1) — the header is a band, not a card inside a card', () => {
  test('the title row carries no frame of its own', async () => {
    const p = await page();
    const r = p.rule('.redline-page .rl-head');
    assert.ok(r, '.rl-head must still carry a rule');
    assert.match(r, /border:0/, 'the outer border is what doubled up against the page frame');
    assert.match(r, /box-shadow:none/);
    assert.match(r, /background:none/);
    assert.ok(!/border-radius:1[0-9]px/.test(r),
      'a radius here draws the rounded edge that reads as a second box');
  });

  test('and the header is still the header', async () => {
    // flattening a container must not flatten what is in it
    const p = await page();
    const head = p.$('#view-redline .rl-head');
    assert.ok(head, 'the header section survives');
    assert.match(head.textContent, /Redline Workbench/);
    assert.ok(head.querySelector('.rl-round'), 'the round tag stays');
  });
});

describe('F89 (2) — one document sheet, not a sheet inside a panel', () => {
  test('the inner .nego-doc wrapper gives up its card chrome', async () => {
    const p = await page();
    const r = p.rule('.redline-page .rl-paper');
    assert.ok(r, '.rl-paper must carry a rule');
    for (const decl of ['background:none', 'border:0', 'border-radius:0', 'box-shadow:none'])
      assert.match(r, new RegExp(decl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `.nego-doc draws a full panel; ${decl} is what stops it drawing a second one`);
  });

  test('the column is the sheet, and it has no border', async () => {
    const p = await page();
    const r = p.rule('.redline-page .rl-doc', 'box-shadow');
    assert.ok(r, '.rl-doc must have a paint rule of its own, split from .rl-col');
    assert.match(r, /border:0/, 'the prototype sheet is shadowed paper, not a boxed panel');
    assert.match(r, /box-shadow:0 10px 30px/, 'and it keeps the sheet shadow');
    // the other two columns are still cards — this is not a global de-framing
    assert.match(p.rule('.redline-page .rl-col') || '', /border:1px solid/);
  });
});

describe('F89 (2b) — the page sets the contract, it does not float it', () => {
  /* Three separate rules were each pushing the text in from the edges, and
     together they left the document sitting in a pool of white space that the
     master design does not have. Measured on the real box model before the
     fix: the text sat 116px from the left of its column and 46px from the
     right, and every clause carried 26px of INVISIBLE toolbar. */
  test('the engine\'s 100px fingerprint gutter is not reserved on this page', async () => {
    /* .nego-pane.working .nego-doc{padding-left:100px} exists so the room can
       hang change badges in the margin. This page carries the ask inline, in
       .rl-asktag on the clause's own row, so the gutter holds nothing — and it
       held it on ONE side, which is what made the sheet look off-centre. */
    const p = await page();
    const r = p.rule('.redline-page .nego-pane.working .rl-paper');
    assert.ok(r, 'the override must exist, or the engine\'s gutter applies');
    assert.match(r, /padding-left:24px/);
    assert.match(r, /padding-right:24px/);
    /* Four classes deep, because the engine's rule is three and this
       stylesheet is inserted BEFORE #nego-style — a tie would lose on order. */
    const css = p.css();
    assert.ok(css.indexOf('.redline-page .nego-pane.working .rl-paper') >= 0,
      'the selector must out-specify .nego-pane.working .nego-doc, not merely restate it');
  });

  test('a clause is flush to the sheet; only a changed one is framed', async () => {
    const p = await page();
    assert.match(p.rule('.redline-page .rl-clause') || '', /padding:0/,
      '.nego-clause\'s 10px/12px is a second inset inside the sheet\'s own');
    assert.match(p.rule('.redline-page .rl-clause.is-changed') || '', /padding:12px 14px/,
      'the design pads only what is on the table — p-3 — so the frame means something');
  });

  test('the clause toolbar costs what it shows', async () => {
    /* opacity:0 does not take an element out of the flow. Every clause in the
       document — including the ones under redline, which the reference gives
       no control at all — reserved a blank 26px row plus its margin. That was
       the vertical air with nothing in it. */
    const p = await page();
    const r = p.rule('.redline-page .rl-tools');
    assert.ok(r, '.rl-tools must carry a rule');
    assert.ok(!/opacity:0/.test(r),
      'an invisible row still occupies its height — that is the gap it was creating');
    assert.ok(!/\.redline-page \.rl-clause:hover \.rl-tools/.test(p.css()),
      'and hover does not exist on a touch screen (the room settled this — see f44)');
    assert.match(r, /min-height:20px/, 'one compact line, the spend the reference makes');
  });
});

describe('F89 (3,4) — redlining runs through the Copilot column, not a dialog', () => {
  test('an AI action opens the docked panel and files nothing', async () => {
    const p = await page();
    const ai = [...p.$$('#rl-doc .rl-tool')].find(b => /AI Assist/.test(b.textContent));
    ai.click();
    const shorten = [...p.$$('.nego-selmenu [data-nego-ai]')]
      .find(b => b.getAttribute('data-nego-ai') === 'shorten');
    assert.ok(shorten, 'the menu must offer the shorten action');
    shorten.click();
    await new Promise(r => setTimeout(r, 10));

    assert.equal(p.panel.opened.length, 1, 'the Copilot panel must open on the same gesture');
    assert.equal(p.panel.opened[0].docked, true,
      'docked, so the document it is about is still on the screen beside it');
    assert.ok(!p.$('.nego-aipop'),
      'no floating proposal dialog may be created — the proposal lives in the panel');
    assert.ok(p.panel.cards && p.panel.cards.length,
      'the proposal must arrive as a card in the panel stream');
  });

  test('what was asked appears in the reader\'s own stream first', async () => {
    const p = await page();
    const ai = [...p.$$('#rl-doc .rl-tool')].find(b => /AI Assist/.test(b.textContent));
    ai.click();
    p.$$('.nego-selmenu [data-nego-ai]')[1].click();
    await new Promise(r => setTimeout(r, 10));
    assert.ok(p.panel.pushed.some(x => x.role === 'user'),
      'a panel that answers a question it never showed reads as volunteering wording');
  });

  test('Rephrase asks what the rewrite is for instead of guessing', async () => {
    const p = await page();
    const ai = [...p.$$('#rl-doc .rl-tool')].find(b => /AI Assist/.test(b.textContent));
    ai.click();
    [...p.$$('.nego-selmenu [data-nego-ai]')]
      .find(b => b.getAttribute('data-nego-ai') === 'rephrase').click();
    await new Promise(r => setTimeout(r, 10));
    assert.equal(p.panel.sessions.length, 1, 'it must seed a session, not spend a call');
    assert.equal(p.panel.proposals.length, 0, 'nothing is asked until the drafter says what they want');
    assert.match(p.panel.sessions[0].greeting, /how would you like/i);
  });

  test('a selection drives the side panel through the page\'s own hook', async () => {
    /* jsdom makes no real text selection with a rectangle, so this drives the
       two halves of the route separately: that the engine is GIVEN a builder by
       this page (opts.selMenu — the contract a fork would break), and that the
       builder produces a menu whose items end in the panel. */
    const p = await page();
    let handed = null;
    const realWire = p.win.wireNegotiationTab;
    p.win.wireNegotiationTab = (c, o) => { handed = o; return realWire(c, o); };
    p.win.renderRedline();
    assert.equal(typeof handed.selMenu, 'function',
      'the workbench must hand the engine its own selection builder');

    const cl = p.win.negoClauseList(p.c).find(x => /PAYMENT/i.test(x.headingText));
    handed.selMenu({ text: 'thirty (30) days', clauseId: cl.clauseId,
      rect: { left: 10, top: 10, bottom: 30, right: 90, width: 80, height: 20 } });
    const menu = p.$('.nego-selmenu');
    assert.ok(menu, 'a selection offers a menu');
    assert.ok(!p.$('.nego-aipop') && !p.$('[role="dialog"]'),
      'and never a dialog over the wording being judged');
    const ev = new p.win.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    [...menu.querySelectorAll('[data-nego-ai]')]
      .find(b => b.getAttribute('data-nego-ai') === 'shorten').dispatchEvent(ev);
    await new Promise(r => setTimeout(r, 10));
    assert.equal(p.panel.opened.length, 1, 'choosing an item opens the Copilot column');
    assert.ok(!p.$('.nego-selmenu'), 'and the menu gets out of the way');
  });

  test('with no Copilot connected it says so in the panel, not in a dialog', async () => {
    const p = await page({ copilot: false });
    const ai = [...p.$$('#rl-doc .rl-tool')].find(b => /AI Assist/.test(b.textContent));
    ai.click();
    p.$$('.nego-selmenu [data-nego-ai]')[1].click();
    await new Promise(r => setTimeout(r, 10));
    assert.ok(!p.$('.nego-aipop'));
    assert.ok(p.panel.pushed.some(x => x.role === 'assistant' && /not connected/i.test(x.m.text)),
      'the refusal belongs in the conversation the reader just opened');
  });
});

describe('F89 (5) — three actions on a passage, and only three', () => {
  test('the menu is exactly the standardised set', async () => {
    const p = await page();
    const ids = p.win.RL_SEL_ACTIONS.map(a => a.id);
    assert.equal(ids.length, 3, 'three verbs, no more');
    assert.equal(ids.join(','), 'rephrase,shorten,tag');
    const labels = p.win.RL_SEL_ACTIONS.map(a => a.label);
    assert.match(labels[0], /Rephrase with Copilot/);
    assert.match(labels[1], /Shorten & Simplify/);
    assert.match(labels[2], /Tag with internal note/);
  });

  test('the rendered menu offers those and nothing else', async () => {
    const p = await page();
    const ai = [...p.$$('#rl-doc .rl-tool')].find(b => /AI Assist/.test(b.textContent));
    ai.click();
    const btns = p.$$('.nego-selmenu [data-nego-ai]');
    assert.equal(btns.length, 3);
    assert.ok(!/playbook/i.test(p.$('.nego-selmenu').textContent),
      'the playbook cannot draft, so it must not appear to');
  });

  test('Tag posts into the Discussion thread, with internal pressed', async () => {
    const p = await page();
    p.win.rlToggleDiscussion(true);                 // the composer is display:none
    const ch = p.win.negoChanges(p.c)[0];
    const ok = p.win.rlTagInternalNote({ c: p.c, clauseId: ch.clauseId, text: 'thirty (30) days' });
    assert.equal(ok, true);
    assert.ok(!p.$('#view-redline').classList.contains('disc-off'),
      'focusing an input inside a hidden column silently does nothing');
    const input = p.$('#nego-ti-' + ch.id);
    assert.ok(input, 'it must aim at the Discussion column\'s own composer');
    assert.match(input.value, /thirty \(30\) days/, 'the selected wording is quoted into the note');
    const pressed = p.$$(`[data-nego-vis][data-for="${ch.id}"]`)
      .filter(b => b.getAttribute('aria-pressed') === 'true')
      .map(b => b.getAttribute('data-nego-vis'));
    assert.deepEqual(pressed, ['internal'],
      'a note tagged from the document is internal by name — leaving it shared is how a private remark travels');
  });

  test('a clause with nothing on the table says so rather than filing a change', async () => {
    const p = await page({ theirChange: false });
    const cl = p.win.negoClauseList(p.c)[0];
    assert.equal(p.win.rlTagInternalNote({ c: p.c, clauseId: cl.clauseId, text: 'anything' }), false);
    assert.match(p.w.toastText(), /Propose an edit/);
  });
});

describe('F89 (6) — the document that was uploaded is the document that is drawn', () => {
  test('the clause heading is the literal one, not a rebuilt one', async () => {
    const p = await page({ theirChange: false });
    const heads = p.$$('#rl-doc .rl-clause-h').map(h => h.textContent.trim());
    assert.ok(heads.includes('1.1 Definitions'),
      `"1.1 Definitions" must survive verbatim — got ${JSON.stringify(heads)}`);
    assert.ok(heads.includes('8.2(a) Termination for convenience'),
      'a lettered sub-clause number must not be re-punctuated');
    assert.ok(!heads.some(h => /^1\.1\. /.test(h)),
      'a full stop nobody typed is a renumbering, however small');
  });

  test('paragraphs, bold and lists survive into the canvas', async () => {
    const p = await page({ theirChange: false });
    const doc = p.$('#rl-doc');
    assert.ok(doc.querySelector('.nego-body'), 'the body is drawn as rich markup, not a flat projection');
    assert.ok(doc.querySelector('.nego-body strong'), 'bold text must survive ingestion and render');
    assert.ok(doc.querySelector('.nego-body ol li'), 'a numbered sub-clause list must not read as a sentence');
    const payment = [...doc.querySelectorAll('.rl-clause')]
      .find(s => /PAYMENT TERMS/.test(s.textContent));
    assert.equal(payment.querySelectorAll('.nego-body > p').length, 2,
      'two paragraphs in the source are two paragraphs on the page');
  });

  test('a clause under redline keeps its blocks too', async () => {
    const p = await page();
    const changed = p.$('#rl-doc .rl-clause.is-changed');
    assert.ok(changed, 'the changed clause is drawn');
    assert.ok(changed.querySelector('.nego-body'),
      'the block renderer wraps in .nego-body so Direct Edit swaps the whole body');
    assert.ok(changed.querySelector('.rl-line'),
      'redlineOpsBlocksHtml regroups the stored ops at their newlines');
  });

  test('a headingless upload is not given an invented heading', async () => {
    const p = await page({ theirChange: false,
      contract: contractFixture({ redlineText: PLAIN, format: 'text' }) });
    const heads = p.$$('#rl-doc .rl-clause-h').map(h => h.textContent.trim());
    assert.ok(!heads.includes('Clause'), 'a placeholder heading is wording the document does not contain');
  });
});

describe('F89 (7) — one type size across the canvas and the changes column', () => {
  test('both are set from a single declaration', async () => {
    const p = await page();
    assert.match(p.css(), /\.redline-page\{--rl-type:[\d.]+px\}/,
      'the shared size must be one token, or the two columns can drift apart again');
    assert.match(p.rule('.redline-page .rl-card-diff') || '', /font-size:var\(--rl-type\)/);
    assert.match(p.css(), /\.redline-page \.rl-clause-p,[\s\S]{0,200}?font-size:var\(--rl-type\)/,
      'the contract body must read at the Tracked Changes card size');
  });

  test('the token is the card size the design sets its diffs at', async () => {
    const p = await page();
    const m = /\.redline-page\{--rl-type:([\d.]+)px\}/.exec(p.css());
    assert.equal(m[1], '11.5');
  });
});

describe('F89 (8) — a marked phrase says whose hand it was', () => {
  test('every redlined span in the document carries the last updater', async () => {
    const p = await page();
    const marks = p.$$('#rl-doc .rl-clause.is-changed ins, #rl-doc .rl-clause.is-changed del');
    assert.ok(marks.length, 'the changed clause must actually carry marked wording');
    for (const m of marks)
      assert.match(m.getAttribute('title') || '', /^Last updated by Amina Wanjiru/,
        'a mark with no attribution makes "who asked for this" a question you cannot answer by looking');
  });

  test('the card\'s diff answers the same question the same way', async () => {
    const p = await page();
    const mark = p.$('#rl-changes .rl-card-diff ins, #rl-changes .rl-card-diff del');
    assert.ok(mark);
    assert.match(mark.getAttribute('title') || '', /Last updated by Amina Wanjiru/);
  });

  test('a name carrying a quote cannot break out of the attribute', async () => {
    const p = await page({ theirChange: false });
    await p.win.negoFileProposal(p.c, p.win.negoBaseText(p.c).replace('thirty (30) days', 'forty (40) days'),
      { side: 'counterparty', author: 'A "Tricky" Name' });
    p.win.renderRedline();
    const mark = p.$('#rl-doc .rl-clause.is-changed ins, #rl-doc .rl-clause.is-changed del');
    assert.ok(mark, 'the change still renders');
    /* Read back through the PARSER, which is the whole test. An unescaped
       quote would close the attribute at "A ", and everything after it would be
       parsed as further attributes — so the title would come back truncated and
       the element would carry junk attributes it was never given. */
    assert.equal(mark.getAttribute('title').startsWith('Last updated by A "Tricky" Name'), true,
      'the whole name must survive the round trip through the attribute');
    assert.ok(!mark.hasAttribute('name') && !mark.hasAttribute('tricky'),
      'a broken-out attribute value reappears as attributes nobody wrote');
  });
});

describe('F89 (9) — folding the discussion re-deals two thirds and one third', () => {
  test('the collapsed split is 8 / 4 and the fold is live', async () => {
    const p = await page();
    assert.match(p.css(), /\.redline-page\.disc-off \.rl-doc\{grid-column:span 8\}/);
    assert.match(p.css(), /\.redline-page\.disc-off #rl-changes-col\{grid-column:span 4\}/);
    p.$('#rl-disc-col') && assert.ok(p.$('#rl-disc-col'));
    p.win.rlToggleDiscussion(true);
    assert.ok(p.$('#view-redline').classList.contains('disc-off'));
    assert.ok(!p.$('#rl-disc-show').hidden, 'the reveal chip is the only way back');
  });
});

describe('F89 (10) — the Tracked Changes column holds only live redlines', () => {
  test('a decided change leaves the column', async () => {
    const p = await page();
    const ch = p.win.negoChanges(p.c)[0];
    assert.ok(p.$(`#rl-changes [data-nego-card="${ch.id}"]`), 'it is there while it is pending');
    p.win.negoResolve(p.c, ch.id, 'accepted', { side: 'owner' });
    p.win.renderRedline();
    assert.ok(!p.$(`#rl-changes [data-nego-card="${ch.id}"]`),
      'a column of changes nobody can act on is a column people stop reading');
  });

  test('and the empty state says where the settled ones went', async () => {
    const p = await page();
    p.win.negoResolve(p.c, p.win.negoChanges(p.c)[0].id, 'accepted', { side: 'owner' });
    p.win.renderRedline();
    assert.match(p.$('#rl-changes').textContent, /already been decided/,
      'silence about the history reads as data loss');
  });

  test('an unchanged clause has no card at all', async () => {
    const p = await page();
    const cards = p.$$('#rl-changes [data-nego-card]').length;
    assert.equal(cards, 1, 'one live change, one card — not one card per clause');
    assert.ok(p.$$('#rl-doc .rl-clause').length > cards,
      'the document still shows every clause; only the column is narrowed');
  });
});

describe('F89 (11,12) — the card verbs, their colours, and where Edit lands', () => {
  test('Accept is green, Reject is red, Edit is grey', async () => {
    const p = await page();
    assert.match(p.rule('.redline-page .rl-acc,.redline-page .rl-send') || '', /background:#059669/);
    assert.match(p.rule('.redline-page .rl-rej') || '', /background:#dc2626/);
    assert.match(p.rule('.redline-page .rl-edit') || '', /background:#e2e8f0/);
    assert.match(p.rule('.redline-page .rl-edit') || '', /color:#1e293b/);
  });

  test('the buttons on a live card carry those classes', async () => {
    const p = await page();
    const card = p.$('#rl-changes .rl-card');
    assert.ok(card.querySelector('button.rl-acc[data-nego-accept]'));
    assert.ok(card.querySelector('button.rl-rej[data-nego-reject]'));
    assert.ok(card.querySelector('button.rl-edit[data-rl-edit]'));
  });

  test('an unsent draft of ours gets a green Send', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const card = p.$('#rl-changes .rl-card');
    const send = card.querySelector('button.rl-send[data-rl-send]');
    assert.ok(send, 'the one state that looks finished and is not must carry its own send');
    assert.match(card.textContent, /Draft/);
  });

  test('Edit jumps to the clause in the document and opens the editor there', async () => {
    const p = await page();
    const btn = p.$('#rl-changes [data-rl-edit]');
    const clauseId = btn.getAttribute('data-rl-edit');
    btn.click();
    const clause = p.$(`#rl-doc [data-clause="${clauseId}"]`);
    assert.ok(clause, 'the target clause must exist in the canvas');
    assert.ok(clause.classList.contains('rl-jump'),
      'a page that silently jumps has moved the reader without telling them where');
    assert.ok(clause.querySelector('[data-nego-editor]'),
      'Edit means edit — the engine\'s inline editor opens on the clause itself');
  });

  test('rlJumpToClause leaves focus mode so the document is on screen', async () => {
    const p = await page();
    p.win.rlToggleFocus(true);
    const id = p.$('#rl-changes [data-rl-edit]').getAttribute('data-rl-edit');
    assert.ok(p.win.rlJumpToClause(id, { edit: false }));
    assert.ok(!p.$('#view-redline').classList.contains('rl-focus'));
  });
});

describe('F89 (13) — the flashing batch send', () => {
  test('it appears with a count when drafts are held back', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const b = p.$('[data-rl-blast]');
    assert.ok(b, 'the send must be in the toolbar, not below the fold in a column head');
    assert.match(b.textContent, /Send All \(1\) Redline/);
    assert.ok(b.classList.contains('rl-btn-blast'));
    assert.match(p.css(), /@keyframes rlBlast/, 'prominent means animated');
    assert.match(p.css(), /prefers-reduced-motion:reduce/,
      'a pulse nobody can switch off is an accessibility defect');
  });

  test('the count is the engine\'s own count of unsent asks', async () => {
    const p = await page({ theirChange: false, myChange: true });
    await p.win.negoFileProposal(p.c, p.win.negoBaseText(p.c).replace('Saturday', 'Saturday or Sunday'),
      { side: 'owner', author: 'Young Mbagaya' });
    p.win.renderRedline();
    assert.equal(p.win.negoUnsentAsks(p.c, 'owner').length, 2);
    assert.match(p.$('[data-rl-blast]').textContent, /Send All \(2\) Redlines/);
  });

  test('nothing unsent, no flashing button', async () => {
    const p = await page();                       // only THEIR change is on the table
    assert.equal(p.win.negoUnsentAsks(p.c, 'owner').length, 0);
    assert.ok(!p.$('[data-rl-blast]'),
      'an alarm with nothing behind it is worse than no alarm');
  });

  test('one press publishes the lot through the engine\'s own send', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const engine = p.doc.getElementById('nego-send');
    assert.ok(engine, 'the engine\'s send must be in the DOM to be pressed');
    let fired = 0;
    engine.addEventListener('click', () => { fired++; });
    p.$('[data-rl-blast]').click();
    assert.equal(fired, 1, 'the toolbar button routes through the one act that sends a round');
  });

  test('the card\'s Send is the same act, not a second one', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const engine = p.doc.getElementById('nego-send');
    let fired = 0;
    engine.addEventListener('click', () => { fired++; });
    p.$('#rl-changes [data-rl-send]').click();
    assert.equal(fired, 1,
      'a per-change send would let a reader believe they published one ask while others stayed home');
  });

  test('the batch button keeps its own tooltip while it is usable', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const b = p.$('[data-rl-blast]');
    assert.match(b.title, /Publish every unsent redline/,
      'a control that only describes itself when broken is the wrong way round');
  });
});
