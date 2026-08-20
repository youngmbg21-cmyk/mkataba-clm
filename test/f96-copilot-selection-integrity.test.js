/* ============================================================
   F96 — a lawyer's highlight survives the document it is in
   ============================================================
   The Copilot on the Redline workbench is reached by highlighting wording and
   choosing a verb. Everything after that gesture used to depend on finding the
   highlighted STRING again inside the clause the model stores — and the string
   the browser hands back and the string the record holds disagree constantly,
   for reasons that are not exotic at all. They are the ordinary shapes of a
   commercial agreement:

     the screen shows what the record does not — the clause heading, the
       "#3 · Your ask" tag and the hover toolbar all sit inside the clause's own
       box, so a drag that starts above the first word sweeps them in;
     the record holds what the screen does not — the list markers the text
       projection prints ("a. ", "2.1. ", "• "), which the browser draws as
       ::marker and no selection can ever contain;
     the same phrase appears twice — "thirty (30) days" for invoices and again
       for a cure period — and a bare indexOf always answered the first;
     a settled redline still renders its marks, so a clause decided last month
       counted as "pending edits" and the reader was told to accept or reject a
       change that had already been accepted;
     and a drag that overshoots into the margin below a clause leaves its end at
       offset 0 of the next one, which read as a selection spanning two.

   Each of these refused a passage the reader could see was there, and each
   refusal explained itself with a reason that was not true. This file pins the
   fixes, and pins the two true refusals that must survive them: wording under a
   LIVE redline, and a drag genuinely across two numbered clauses.

   Driven through the REAL gesture — a real Range, a real mouseup, the real
   reading — because every bug here lived in the distance between what the Range
   knew and what the string remembered.

   ---- THE PAPER STOPPED OFFERING A MENU (19 Aug 2026) ----
   The owner has taken editing off the contract itself on this page: "there
   should not be possibility to edit the contract while on the contract in the
   left hand side. Only way to edit is to click edit and the edit happens in the
   panel on the right." A highlight on the paper is READING now — it still
   selects, so wording can still be copied out — and the one door into writing
   is the green Edit pill and the clause panel behind it.

   SO THIS FILE'S JOURNEYS STOP ONE STEP EARLIER, AND SAY SO. What every fix
   above actually fixed is the READING — negoReadPassage, which takes the page's
   furniture out of a highlight, forgives markers that were never on screen,
   counts which occurrence was pointed at and reports which clauses genuinely
   have words in the range. That function is unchanged and still live: it is
   what a highlight inside the clause panel's editor is read with. Its claims
   are pinned here against the same real markup and the same real Ranges, one
   layer down from the menu that used to follow them.

   WHAT IS NOT PINNED HERE ANY MORE, said out loud rather than quietly dropped:
   the paper journeys that ended in a proposal card and a filed change. They
   ended at a menu this page no longer raises, and re-pointing them at the
   panel's editor was refused as dishonest — the editor holds one clause's
   wording with no heading, no front matter, no second clause and no marks, so
   the cases that made this file worth writing cannot be staged there at all.
   The reading each of them rested on is asserted below; the filing itself is
   covered where filing still happens (f92, f144, f145, f210). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* A contract with the four shapes that broke: a heading whose number is not a
   plain integer, a clause body of more than one paragraph, a lettered
   sub-clause list, and a clause that says the same phrase twice. */
const RICH = [
  '<h1>SUPPLY AND SERVICES AGREEMENT</h1>',
  '<p>Between the parties named below.</p>',
  '<h2>2. PAYMENT TERMS</h2>',
  '<p>All invoices are payable within thirty (30) days from the date of issue.</p>',
  '<p>Any sum not paid when due carries interest at 2% per month until settled.</p>',
  '<h2>3. CURE AND REMEDIES</h2>',
  '<p>A party in breach shall remedy it within thirty (30) days of notice, '
    + 'failing which the other party may terminate on thirty (30) days written notice.</p>',
  '<h2>4. TERMINATION</h2>',
  '<ol type="a"><li>Either party may terminate for convenience on sixty (60) days notice.</li>',
  '<li>Accrued rights and remedies survive termination of this Agreement.</li></ol>',
  '<h2>5. GOVERNING LAW</h2>',
  '<p>This Agreement is governed by the laws of Kenya.</p>',
].join('');

/* The uploaded contract that arrived as a wall of paragraphs — no headings at
   all, so the clause model falls back to one clause PER PARAGRAPH. Those
   boundaries are an artefact of the parse, not of the agreement. */
const WALL = [
  '<p>The Supplier shall deliver the Goods to the Buyer at the address notified in writing.</p>',
  '<p>Delivery shall take place within fourteen (14) days of each purchase order.</p>',
  '<p>Risk in the Goods passes to the Buyer on delivery.</p>',
].join('');

function contractFixture(over = {}){
  return { id: 'MK-96', name: 'Supply and Services Agreement',
    counterparty: 'Naivas Supermarkets', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: RICH, format: 'rich', ...over };
}

/* ---------- the page, and a way to highlight things on it ----------
   The Copilot panel is a double (the stage does not load js/ai.js) and the
   selection RECTANGLE is stubbed — jsdom does no layout, and openSelMenu quite
   rightly refuses a selection with no rectangle. Neither stands in for logic:
   the Range, the menu, the match, the splice and the filing are all the
   product's own. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  /* Layout, not logic: give every Range a rectangle so the menu will open. */
  win.Range.prototype.getBoundingClientRect = function (){
    return { left: 10, top: 10, right: 90, bottom: 30, width: 80, height: 20, x: 10, y: 10 };
  };
  const c = opts.contract || contractFixture(opts.body ? { redlineText: opts.body } : {});

  const panel = { opened: [], pushed: [], proposals: [], cards: [], sessions: [] };
  win.openAI = (prefill, o) => panel.opened.push(o || {});
  win.aiPush = (role, m) => panel.pushed.push({ role, m });
  win.renderAIFeed = () => {};
  win.copilotAvailable = () => opts.copilot !== false;
  win.copilotPropose = async o => { panel.proposals.push(o);
    return { advice: 'Shorter, same effect.', proposedText: opts.wording || 'REWRITTEN WORDING', strict: true }; };
  win.aiOpenProposal = o => { panel.cards.push(o); return o; };
  win.aiOpenRephraseSession = o => { panel.sessions.push(o); return o; };
  win.aiCloseRephraseSession = () => {};
  win.counterpartyContact = () => null;
  win.cachedShares = () => [];

  win.negoInit(c);
  if (typeof opts.seed === 'function') await opts.seed(win, c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();

  const doc = win.document;
  const $ = s => doc.querySelector(s);
  const $$ = s => [...doc.querySelectorAll(s)];
  /* The clause SECTION in the document canvas, found by the wording in it. */
  const clauseWith = re => $$('#rl-doc [data-clause]').find(el => re.test(el.textContent || ''));

  /* Every text node under an element, in document order — the coordinate space
     a real selection lives in. ::marker text is not here, which is precisely
     the asymmetry half this file is about. */
  const textNodes = el => {
    const out = [];
    (function walk(n){
      for (const ch of Array.from(n.childNodes)){
        if (ch.nodeType === 3) out.push(ch);
        else if (ch.nodeType === 1) walk(ch);
      }
    })(el);
    return out;
  };
  /* A boundary point: the nth occurrence of `needle` inside `el`, at `edge`. */
  const point = (el, needle, edge = 'start', nth = 0) => {
    const nodes = textNodes(el);
    const full = nodes.map(n => n.nodeValue).join('');
    let idx = -1, k = 0;
    for (let i = full.indexOf(needle); i >= 0; i = full.indexOf(needle, i + 1), k++){
      if (k === nth){ idx = i; break; }
    }
    assert.ok(idx >= 0, `fixture: “${needle}” (#${nth}) is not in that element`);
    const pos = edge === 'start' ? idx : idx + needle.length;
    let run = 0;
    for (const n of nodes){
      const len = n.nodeValue.length;
      if (pos <= run + len) return { node: n, offset: pos - run };
      run += len;
    }
    const last = nodes[nodes.length - 1];
    return { node: last, offset: last.nodeValue.length };
  };
  /* Highlight, then let go of the mouse — the gesture, not a call into the
     engine's internals. Returns the selection menu if one opened. */
  const drag = (a, b) => {
    const r = doc.createRange();
    r.setStart(a.node, a.offset);
    r.setEnd(b.node, b.offset);
    const sel = win.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    (a.node.parentElement || $('#rl-doc')).dispatchEvent(
      new win.MouseEvent('mouseup', { bubbles: true }));
    return $('.nego-selmenu');
  };
  /* The whole gesture in one line: highlight from one phrase to another inside
     one element, and hand back the menu. */
  const highlight = (el, from, to, o = {}) =>
    drag(point(el, from, 'start', o.fromNth || 0), point(el, to || from, 'end', o.toNth || 0));

  /* ---- THE GESTURE, AND WHAT THE PRODUCT READS FROM IT ----
     The paper raises no menu on our seat any more (see the header). This is the
     same drag, and it hands back BOTH answers: the menu that must not appear,
     and the passage the product's one reading takes from the range — the thing
     every fix in this file was actually about. Same Range, same markup, same
     function; one layer below a door that has been taken off. */
  const readRange = (a, b) => {
    const r = doc.createRange();
    r.setStart(a.node, a.offset);
    r.setEnd(b.node, b.offset);
    const sel = win.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    (a.node.parentElement || $('#rl-doc')).dispatchEvent(
      new win.MouseEvent('mouseup', { bubbles: true }));
    return { menu: $('.nego-selmenu'), range: r,
      passage: win.negoReadPassage(r, $('#rl-doc')) };
  };
  const readSel = (el, from, to, o = {}) =>
    readRange(point(el, from, 'start', o.fromNth || 0), point(el, to || from, 'end', o.toNth || 0));

  /* ---- AND THE OFFER ITSELF, WHERE A SURFACE STILL MAKES ONE ----
     The mount's own selMenu hook, handed the passage read from a real Range —
     which is precisely what a highlight inside the clause panel's editor does,
     and what the paper did until 19 Aug. Driving the hook rather than the paper
     is the shape B10 and B12 in this same file have always used for the cases
     the paper could not stage. It keeps the chain below the hook under test —
     menu, press, proposal, Apply, filed change — on the surfaces that still
     have it. */
  let handed = null;
  const mount = () => {
    if (handed) return handed;
    const real = win.wireNegotiationTab;
    win.wireNegotiationTab = (cc, o) => { handed = o; return real(cc, o); };
    win.renderRedline();
    win.wireNegotiationTab = real;
    return handed;
  };
  const offer = (el, from, to, o = {}) => {
    const { passage, range } = readSel(el, from, to, o);
    const clauseEl = passage.clauses[0] || el.closest('[data-clause]');
    mount().selMenu({ text: passage.text,
      clauseId: clauseEl && clauseEl.getAttribute('data-clause'),
      rect: { left: 10, top: 10, bottom: 30, right: 90, width: 80, height: 20 },
      passage, clauseIds: passage.clauseIds, range });
    return $('.nego-selmenu');
  };

  /* Press a verb in the menu. mousedown, because that is what the menu listens
     for — a click would collapse the selection first. Awaited, because asking
     the Copilot is a round trip and the proposal card exists on the other side
     of it. */
  const settle = () => new Promise(r => setImmediate(r));
  const press = async (menu, re = /Simplify/) => {
    assert.ok(menu, 'no selection menu opened for that highlight');
    const btn = [...menu.querySelectorAll('[data-nego-ai]')].find(b => re.test(b.textContent));
    assert.ok(btn, `no menu item matching ${re}`);
    btn.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await settle(); await settle();
    return btn;
  };
  const said = re => panel.pushed.some(m => re.test(String((m.m && m.m.text) || '')))
    || w.log.toasts.some(t => re.test(t.msg))
    || $$('.nego-selmenu .nego-selnote').some(n => re.test(n.textContent || ''));

  return { w, win, c, doc, panel, $, $$, clauseWith, point, drag, highlight, press, said, settle,
    readRange, readSel, offer,
    toasts: () => w.log.toasts.map(t => t.msg).join(' | '),
    changes: () => win.negoChanges(c),
    clauseText: re => (win.negoClauseList(c).find(x => re.test(x.text)) || {}).text || '' };
}

/* The wording the Copilot's proposal card would file, applied. Returns what the
   card reported back, so a refusal can be read as well as a filing — and waits
   for the filing itself, which the card deliberately does not await (it settles
   at once and the toast reports what actually happened). */
const apply = async (p, wording = 'REWRITTEN WORDING') => {
  const card = p.panel.cards[p.panel.cards.length - 1];
  assert.ok(card, 'the Copilot never opened a proposal card');
  const r = card.onApply(wording);
  await p.settle(); await p.settle(); await p.settle();
  return r;
};

describe('F96 (B1) — a highlight that starts on the clause heading', () => {
  /* RE-POINTED 19 Aug 2026, with the claims intact. These three drove the drag
     into a menu, a proposal and a filing; the paper raises no menu now, so they
     assert the READING the whole chain rested on — that a heading swept into a
     drag is furniture and the wording under it is the passage. */
  test('the heading is not wording, and does not defeat the match', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    /* The natural "grab the whole clause" gesture: start on the number. */
    const { menu, passage } = p.readSel(cl, '2. PAYMENT TERMS', 'date of issue.');
    assert.equal(menu, null, 'and the paper offers nothing to press — it is a read now');
    assert.equal(passage.clauseIds.length, 1, 'one clause, found despite the heading');
    assert.match(passage.text, /All invoices are payable/,
      'THE FIX: this used to be unmatchable');
  });

  test('and the heading is not part of what the reading hands on', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    const { passage } = p.readSel(cl, '2. PAYMENT TERMS', 'date of issue.');
    assert.ok(!/PAYMENT TERMS/.test(passage.text),
      'the heading is chrome, not the wording under review');
    assert.match(passage.text, /All invoices are payable/);
  });

  test('a heading-to-end drag is recognised as the whole clause', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    const { passage } = p.readSel(cl, '2. PAYMENT TERMS', 'until settled.');
    assert.equal(passage.clauseIds.length, 1, 'one clause, end to end');
    assert.match(passage.text, /All invoices are payable/);
    assert.match(passage.text, /until settled\.$/,
      'and it runs to the last word of the clause, not to the end of its first block');
  });
});

describe('F96 — the two ordinary highlights, which must simply work', () => {
  test('two sentences inside one paragraph are read as exactly those words', async () => {
    const p = await page();
    const cl = p.clauseWith(/A party in breach/);
    const { passage } = p.readSel(cl, 'A party in breach', 'of notice,');
    assert.equal(passage.clauseIds.length, 1);
    assert.match(passage.text, /^A party in breach/);
    assert.match(passage.text, /of notice,$/,
      'exactly the span the reader drew, no more');
    assert.ok(!/terminate on thirty \(30\) days written notice/.test(passage.text),
      'the wording after the highlight is not swept in with it');
    /* And it is findable in the clause the record holds, which is the step the
       splice was built on. */
    const hit = p.win.negoFindPassage(p.clauseText(/A party in breach/), passage.text);
    assert.ok(hit, 'the passage is located in the stored wording');
  });

  test('a highlight across a paragraph break inside ONE headed clause', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    /* Two paragraphs, one clause — the break is the renderer's, not the
       document's, and the reader crossed it in a single drag. */
    assert.match(p.clauseText(/payable within thirty/), /\n/,
      'fixture: the clause body must really be more than one block');
    const { passage } = p.readSel(cl, 'All invoices are payable', 'until settled.');
    assert.equal(passage.clauseIds.length, 1,
      'a paragraph break inside a clause is not a second clause');
    assert.match(passage.text, /All invoices are payable/);
    assert.match(passage.text, /until settled\./);
  });
});

describe('F96 (B12) — a clause that is itself still a proposal', () => {
  /* Found on the re-audit, not in the original register: a clause somebody has
     asked to ADD is drawn like any other but is not in the round baseline, so
     negoEditClause answers null — and the toast that followed said the wording
     already matched the clause, which was a claim about the document and was
     not true. */
  test('the room says what it is, instead of claiming the wording already matched', async () => {
    const p = await page();
    const win = p.win;
    const ch = await win.negoInsertClause(p.c, null,
      { headingText: '6. CONFIDENTIALITY',
        bodyHtml: '<p>Each party shall keep the other party information confidential.</p>' },
      { side: 'owner', author: 'Wanjiru Kamau' });
    assert.equal(win.negoClauseById(p.c, ch.clauseId), null,
      'fixture: a proposed insertion is deliberately not in the round baseline');
    let handed = null;
    const real = win.wireNegotiationTab;
    win.wireNegotiationTab = (cc, o) => { handed = o; return real(cc, o); };
    win.renderRedline();
    win.wireNegotiationTab = real;
    handed.selMenu({ text: 'keep the other party information confidential', clauseId: ch.clauseId,
      rect: { left: 10, top: 10, bottom: 30, right: 90, width: 80, height: 20 } });
    await p.press(p.$('.nego-selmenu'));
    assert.ok(p.said(/itself still a proposal|not been accepted/i));
    assert.ok(!p.said(/matches the clause already/i),
      'the old answer was false: nothing was compared, because there was nothing to compare against');
    assert.equal(p.changes().filter(x => x.changeType === 'modify').length, 0);
  });
});

describe('F96 (B2) — a highlight across two lettered sub-clauses', () => {
  test('the markers the projection prints do not exist on screen, and are forgiven', async () => {
    const p = await page();
    const cl = p.clauseWith(/terminate for convenience/);
    /* The stored text carries "a. " and "b. "; the browser draws them as
       ::marker, so the selection contains neither. */
    assert.match(p.clauseText(/terminate for convenience/), /a\.\s/,
      'fixture: the projection must actually print markers');
    const { passage } = p.readSel(cl, 'Either party may terminate', 'survive termination of this Agreement.');
    assert.ok(passage.text, 'the drag reads as wording');
    /* THE FIX, one layer down: the passage the screen gives back is findable in
       the stored text even though the stored text carries markers the screen
       never drew. Lettered sub-clauses are how contracts are written. */
    const hit = p.win.negoFindPassage(p.clauseText(/terminate for convenience/), passage.text);
    assert.ok(hit, 'the markers must be forgiven, not made a reason to refuse');
  });

  test('the found span covers the wording, and leaves the clause either side alone', async () => {
    const p = await page();
    const cl = p.clauseWith(/terminate for convenience/);
    const { passage } = p.readSel(cl, 'Accrued rights', 'survive termination of this Agreement.');
    const hay = p.clauseText(/terminate for convenience/);
    const hit = p.win.negoFindPassage(hay, passage.text);
    assert.ok(hit, 'the passage is located');
    assert.match(hay.slice(hit.start, hit.end), /^Accrued rights/,
      'the span begins where the reader began');
    assert.ok(!/Either party may terminate for convenience/.test(hay.slice(hit.start, hit.end)),
      'the first sub-clause was never selected and is outside the span');
  });

  test('a marker mid-sentence is wording, not a marker', async () => {
    /* "(a)" inside a sentence is a cross-reference to a sub-clause. Only a
       LINE-LEADING marker may be skipped, or the matcher would quietly eat
       cross-references out of the middle of clauses. */
    const p = await page();
    const find = p.win.negoFindPassage;
    const hay = 'a. Subject to clause 4(a) the Supplier shall deliver.';
    const hit = find(hay, 'Subject to clause 4(a) the Supplier shall deliver.');
    assert.ok(hit);
    assert.equal(hay.slice(hit.start, hit.end), 'Subject to clause 4(a) the Supplier shall deliver.');
  });
});

describe('F96 (B1b) — the same rule on the room, which heads a clause differently', () => {
  /* Also from the re-audit. The workbench heads a clause with h4.rl-clause-h;
     the room uses a bare h2 and hangs status notes ("#3 needs review") inside
     the clause box as well. A rule that knew only the workbench's class would
     have left the room exactly as broken. */
  test('a bare h2 clause heading and its status notes are furniture too', async () => {
    const p = await page();
    const doc = p.doc;
    const host = doc.createElement('div');
    host.innerHTML = '<div class="nego-clause" data-clause="c1">'
      + '<button class="nego-badge">#3</button>'
      + '<h2 data-nego-chrome>2. PAYMENT<span class="nego-note no">#3 needs review</span></h2>'
      + '<div class="nego-body"><p>All invoices are payable within thirty (30) days.</p></div></div>';
    doc.body.appendChild(host);
    const r = doc.createRange();
    r.selectNodeContents(host.querySelector('[data-clause]'));
    const passage = p.win.negoReadPassage(r, host);
    assert.equal(passage.text, 'All invoices are payable within thirty (30) days.',
      'the heading, the badge and the review note are all about the clause, not in it');
  });

  test('but a sub-heading inside the clause BODY is stored wording and is kept', async () => {
    /* redlineOpsBlocksHtml renders a clause's own sub-headings as h4.rl-line,
       and richToText puts them in cl.text. Cutting those would break the very
       clauses this audit set out to fix. */
    const p = await page();
    const doc = p.doc;
    const host = doc.createElement('div');
    host.innerHTML = '<div class="nego-clause" data-clause="c1">'
      + '<h2 data-nego-chrome>4. TERMINATION</h2>'
      + '<div class="nego-body"><h4 class="rl-line rl-heading">4.1 For convenience</h4>'
      + '<p>Either party may terminate on notice.</p></div></div>';
    doc.body.appendChild(host);
    const r = doc.createRange();
    r.selectNodeContents(host.querySelector('[data-clause]'));
    const passage = p.win.negoReadPassage(r, host);
    assert.match(passage.text, /4\.1 For convenience/, 'a body sub-heading is the contract');
    assert.ok(!/4\. TERMINATION/.test(passage.text), 'the clause heading above it is not');
  });
});

describe('F96 (B3) — a wall of paragraphs has no clauses to stay inside', () => {
  test('a cross-paragraph highlight reads as a head, a middle and a tail', async () => {
    const p = await page({ body: WALL });
    const first = p.clauseWith(/deliver the Goods/);
    const second = p.clauseWith(/fourteen \(14\) days/);
    assert.ok(first && second && first !== second,
      'fixture: each paragraph must be its own clause here');
    const { passage } = p.readRange(p.point(first, 'The Supplier shall deliver', 'start'),
      p.point(second, 'each purchase order.', 'end'));
    /* THE FIX, at the level it was really made: the reading keeps each clause's
       OWN share of the highlight, which is what let a wall-of-text upload be
       redrafted across the parse's boundaries instead of refused at them. */
    assert.equal(passage.clauseIds.length, 2, 'both paragraphs have words in the drag');
    assert.equal(passage.parts.length, 2, 'and each keeps its own share of it');
    assert.match(passage.parts[0].text, /^The Supplier shall deliver/);
    assert.match(passage.parts[1].text, /each purchase order\.$/);
  });

  test('a paragraph outside the highlight is not part of the reading', async () => {
    const p = await page({ body: WALL });
    const first = p.clauseWith(/deliver the Goods/);
    const second = p.clauseWith(/fourteen \(14\) days/);
    const { passage } = p.readRange(p.point(first, 'The Supplier shall deliver', 'start'),
      p.point(second, 'each purchase order.', 'end'));
    assert.ok(!/Risk in the Goods/.test(passage.text),
      'the third paragraph was never highlighted');
    assert.ok(!passage.clauseIds.includes(
      p.clauseWith(/Risk in the Goods/).getAttribute('data-clause')));
  });

  test('the untouched tail of the last paragraph is outside the reading', async () => {
    const p = await page({ body: WALL });
    const first = p.clauseWith(/deliver the Goods/);
    const second = p.clauseWith(/fourteen \(14\) days/);
    /* The highlight stops mid-way through the second paragraph. */
    const { passage } = p.readRange(p.point(first, 'The Supplier shall deliver', 'start'),
      p.point(second, 'Delivery shall take place', 'end'));
    assert.equal(passage.parts.length, 2);
    assert.ok(!/purchase order/.test(passage.parts[1].text),
      'the wording after the highlight is the tail, and the tail is not in it');
    assert.match(passage.parts[1].text, /Delivery shall take place$/);
  });

  test('a drag across two numbered clauses is read as two, not silently as one', async () => {
    /* The refusal itself lived in the door this page no longer has. What made
       it possible — the reading saying honestly that the drag covers two
       clauses — is here, and is what any surface offering the Copilot asks. */
    const p = await page();
    const a = p.clauseWith(/payable within thirty/);
    const b = p.clauseWith(/A party in breach/);
    const { menu, passage } = p.readRange(p.point(a, 'All invoices', 'start'),
      p.point(b, 'of notice', 'end'));
    assert.equal(passage.clauseIds.length, 2,
      'merging two NUMBERED clauses renumbers an instrument cited by those numbers');
    assert.equal(menu, null, 'and nothing is offered on the paper to do it with');
    assert.equal(p.panel.proposals.length, 0, 'no tokens are spent on it');
  });
});

describe('F96 (B4) — a settled redline is not a pending one', () => {
  const withDecided = status => async (win, c) => {
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days from the date of issue',
      'sixty (60) days from the date of issue'), { side: 'counterparty', author: 'Amina Wanjiru' });
    const ch = win.negoChanges(c)[0];
    win.negoResolve(c, ch.id, status, { side: 'owner', by: 'Wanjiru Kamau' });
  };

  /* RE-POINTED 19 Aug 2026. "Pending edits" was never a property of the marks
     alone: it is the marks AND the change still being live, which is the
     distinction that made the false refusal false. The reading reports the
     marks honestly; the change's own status says whether they are live. Both
     halves are asserted here, on the same fixtures, one layer below the door. */
  test('wording in an ACCEPTED clause carries marks that are not a live redline', async () => {
    const p = await page({ seed: withDecided('accepted') });
    const cl = p.clauseWith(/payable within/);
    const { passage } = p.readSel(cl, 'Any sum not paid when due', 'until settled.');
    assert.ok(passage.text, 'the wording reads');
    assert.equal(p.win.negoChanges(p.c)[0].status, 'accepted',
      'THE FIX: it was decided — there is no redline left to accept or reject');
  });

  test('wording in a REJECTED clause is settled too', async () => {
    const p = await page({ seed: withDecided('rejected') });
    const cl = p.clauseWith(/payable within/);
    const { passage } = p.readSel(cl, 'Any sum not paid when due', 'until settled.');
    assert.ok(passage.text, 'the wording reads');
    assert.equal(p.win.negoChanges(p.c)[0].status, 'rejected');
  });

  test('but a LIVE redline is still marked, and still pending', async () => {
    const p = await page({ seed: async (win, c) => {
      await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days from the date of issue',
        'sixty (60) days from the date of issue'), { side: 'counterparty', author: 'Amina Wanjiru' });
    } });
    const cl = p.clauseWith(/payable within|invoices are payable/);
    const { passage } = p.readSel(cl, 'invoices are payable', 'from the date of issue');
    assert.ok(passage.hasMarks,
      'the true positive must survive the fix to the false one: these words are under a mark');
    assert.equal(p.win.negoChanges(p.c)[0].status, 'pending', 'and the mark is live');
    assert.equal(p.panel.proposals.length, 0, 'and nothing is asked of the model');
  });
});

describe('F96 (B5) — the second "thirty (30) days" is not the first', () => {
  test('the reading counts WHICH occurrence was pointed at', async () => {
    const p = await page();
    const cl = p.clauseWith(/A party in breach/);
    const before = p.clauseText(/A party in breach/);
    assert.equal((before.match(/thirty \(30\) days/g) || []).length, 2,
      'fixture: the clause must say it twice');
    /* The SECOND one — the termination notice period, not the cure period. */
    const { passage } = p.readSel(cl, 'thirty (30) days', 'thirty (30) days',
      { fromNth: 1, toNth: 1 });
    assert.equal(passage.text, 'thirty (30) days');
    assert.equal(passage.occurrence, 1,
      'THE FIX: a bare indexOf always answered the first, and the cure period must not move');
    /* And the occurrence is what the finder is asked with, so the span it
       returns is the second one and not the first. */
    const hit = p.win.negoFindPassage(before, passage.text, { occurrence: passage.occurrence });
    assert.ok(hit && before.slice(0, hit.start).includes('remedy it within thirty (30) days'),
      'the span found is past the cure period');
  });

  test('the first occurrence still answers when it is the one chosen', async () => {
    const p = await page();
    const cl = p.clauseWith(/A party in breach/);
    const { passage } = p.readSel(cl, 'thirty (30) days', 'thirty (30) days');
    assert.equal(passage.occurrence, 0);
    const hay = p.clauseText(/A party in breach/);
    const hit = p.win.negoFindPassage(hay, passage.text, { occurrence: 0 });
    assert.ok(hit && /remedy it within $/.test(hay.slice(0, hit.start)),
      'the cure period is the one under the cursor this time');
  });

  test('an occurrence index beyond what the clause holds falls back, it does not fail', async () => {
    const p = await page();
    const find = p.win.negoFindPassage;
    const hay = 'Payment is due within thirty (30) days.';
    const hit = find(hay, 'thirty (30) days', { occurrence: 4 });
    assert.ok(hit, 'a stale index is a preference, never a requirement');
    assert.equal(hay.slice(hit.start, hit.end), 'thirty (30) days');
  });
});

describe('F96 (B6) — a drag that overshoots into the margin', () => {
  test('touching the next clause is not selecting it', async () => {
    const p = await page();
    const a = p.clauseWith(/payable within thirty/);
    const b = p.clauseWith(/A party in breach/);
    /* The end lands at offset 0 of the next clause: zero characters of it are
       selected, which is what a drag into the gap below a clause produces. */
    const { passage } = p.readRange(p.point(a, 'All invoices', 'start'), { node: b, offset: 0 });
    assert.equal(passage.clauseIds.length, 1,
      'THE FIX: a boundary that touches is not a highlight that covers');
    assert.equal(passage.clauseIds[0], a.getAttribute('data-clause'),
      'and the one it covers is the one the drag started in');
  });
});

describe('F96 (B7) — the clause\'s furniture is not contract', () => {
  /* REVERSED IN PLACE, 16 Aug 2026. This section kept the hover TOOL ROW out
     of a highlight — user-select:none on .rl-tools, and the reading cutting
     "Direct Edit" from a swept passage. The row is retired (no edits on the
     paper; all writing through the clause panel), so the rules that dressed it
     are gone too — a user-select rule for an element nothing draws would be
     the dead scaffolding this suite exists to catch. The CLAIM survives on the
     furniture that is still on the clause: the ask-tag rule keeps its
     user-select:none (the builder still exists), and the green Edit pill is
     what a careless drag sweeps now. */
  test('the furniture is not selectable, and no rule dresses the retired row', async () => {
    const p = await page();
    const css = (p.doc.getElementById('redline-layout-css') || { textContent: '' }).textContent;
    assert.match(css, /\.redline-page \.rl-asktag[^{]*\{[^}]*user-select:none/,
      'an invisible control is still selectable text unless it is told not to be');
    assert.ok(!/\.redline-page \.rl-tools/.test(css),
      'no rule survives for the retired tool row');
  });

  test('and a drag that sweeps the Edit pill still reads as the clause', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    /* RE-POINTED 20 Aug 2026: the pill is icon-only now (owner-asked), so the
       word "Edit" is not on the paper to anchor a sweep on — the fault this
       test guarded (a control's word leaking into a swept passage) is
       UNREPRESENTABLE. The sweep runs from the clause heading, across the
       pill's place in the row, down into the wording; the residual claims
       hold: one clause, and nothing of the control in the passage. */
    const { passage } = p.readSel(cl, 'PAYMENT TERMS', 'payable within thirty');
    assert.equal(passage.clauseIds.length, 1, 'the pill must not defeat the match');
    assert.ok(!/\bEdit\b/.test(passage.text),
      'and a control is not wording, whatever a careless drag sweeps in');
    assert.equal((cl.querySelector('.rl-cp-pill') || { textContent: '' }).textContent.trim(), '',
      'the pill carries no text at all — nothing to leak');
  });
});

describe('F96 (B8) — the front matter, and the silence that is now correct', () => {
  /* REVERSED IN PLACE, 19 Aug 2026. This pinned a NOTICE: selecting the recital
     used to end in silence, and silence read as a broken page, so the page
     answered "this is front matter, there is nothing here to redraft".

     The reasoning has gone with the door. That notice existed to explain why
     the MENU had not appeared on a page where every other highlight raised one.
     No highlight raises one here now — the paper is a read — so an explanation
     of a missing menu would be the page talking about a feature it no longer
     has, on a gesture as ordinary as selecting words to copy them. Silence is
     the right answer when nothing was promised.

     WHAT MUST STILL BE TRUE is that the front matter is not mistaken for a
     clause, and that is the reading, asserted here. */
  test('the recital is not a clause, and the page says nothing about it', async () => {
    const p = await page();
    const recital = p.$('#rl-doc .rl-recital') || p.$('#rl-doc .rl-paper-head');
    assert.ok(recital, 'fixture: the page must render its front matter');
    const { menu, passage } = p.readSel(recital, 'Between the parties');
    assert.equal(passage.clauseIds.length, 0, 'front matter belongs to no clause');
    assert.equal(menu, null, 'and nothing is offered, because nothing is promised');
    assert.equal(p.$$('.nego-selnote').length, 0,
      'no explanation of a menu that was never coming');
  });
});

describe('F96 (B8b) — a drag that begins outside any clause', () => {
  test('the clause it reaches into is reported, and nothing is asked of the model',
    async () => {
    const p = await page();
    const recital = p.$('#rl-doc .rl-recital') || p.$('#rl-doc .rl-paper-head');
    const cl = p.clauseWith(/payable within thirty/);
    const { menu, passage } = p.readRange(p.point(recital, 'Between the parties', 'start'),
      p.point(cl, 'date of issue.', 'end'));
    /* The reading still tells the truth about the shape of the drag: it has
       words in exactly one clause, and it starts outside it. That is what the
       old refusal was built on — "the part that has to change is where the drag
       STARTED" — and it is what any surface offering the Copilot still asks. */
    assert.equal(passage.clauseIds.length, 1, 'one clause has words in this drag');
    assert.ok(/Between the parties/.test(passage.text),
      'and the drag really did begin outside it');
    assert.equal(menu, null);
    assert.equal(p.panel.proposals.length, 0, 'and nothing is asked of the model');
  });
});

describe('F96 (B13) — a clause the record holds and the canvas did not draw', () => {
  /* The inverse of everything above: not the screen showing what the record
     lacks, but the record holding a whole CLAUSE the screen refused to draw.

     redlineDocHtml dropped every insertClause, which cost nothing for as long
     as nothing on this page could file one — the passage menu offered rephrase,
     shorten and tag. Edit with Copilot's placements opened that door, and the
     clause went through it into a canvas that would not show it: filed,
     fingerprinted, carded in the column, and missing from the contract the
     reader was reading. It stayed missing after the other side ACCEPTED it,
     because this canvas is built from the round baseline and an accepted insert
     only reaches that when the round turns. A lawyer would add a clause, be
     told it was filed, fail to find it, and reasonably add it again. */
  const seedInsert = (opts = {}) => async (win, c) => {
    const after = win.negoClauseList(c).find(x => /payable within thirty/.test(x.text || ''));
    const ch = await win.negoInsertClause(c, opts.orphan ? 'cl_gone_' : after.clauseId,
      { headingText: opts.label || '2A. CONFIDENTIALITY',
        bodyHtml: '<p>Each party shall keep the other party information confidential.</p>' },
      { side: opts.side || 'owner', author: opts.side === 'counterparty' ? 'Amina Wanjiru' : 'Wanjiru Kamau' });
    c.__ins = ch; c.__after = after;
    if (opts.decide) win.negoResolve(c, ch.id, opts.decide,
      { side: opts.side === 'counterparty' ? 'owner' : 'counterparty', by: 'The other side' });
  };
  const canvas = p => (p.$('#rl-doc') || { textContent: '' }).textContent;

  test('a proposed new clause is drawn in the document, not only carded beside it', async () => {
    const p = await page({ seed: seedInsert() });
    assert.match(canvas(p), /keep the other party information confidential/,
      'THE FIX: it was filed correctly and shown nowhere a reader reads');
    assert.match(canvas(p), /2A\. CONFIDENTIALITY/, 'with the heading it was given');
  });

  test('and it says it is an addition, not settled wording', async () => {
    const p = await page({ seed: seedInsert() });
    const sec = p.$$('#rl-doc [data-clause]').find(el => /confidential/.test(el.textContent));
    assert.ok(sec, 'the clause is on the canvas');
    assert.ok(sec.classList.contains('rl-clause-new'),
      'a clause that is not in the agreement yet must not read as one that is');
/* ---- REVERSED IN PLACE, 16 Aug 2026 ---- the ask tags have come off the
       paper (owner-asked: "remove the pills from the contracts"). A proposed
       clause says what it is through its own treatment, which is what a reader
       scrolling the page actually sees: the washed-green frame for one that is
       not in the agreement yet, insertion marks on its wording, and the strike
       when it has been refused. The claim is re-pointed at those. */
    assert.equal(sec.querySelector('.rl-asktag'), null, 'no tag on the paper');
    assert.ok(sec.querySelector('ins, .nego-ins'),
      'the wording carries insertion marks — which is what says it is an addition');
  });

  test('it sits after the clause it names, not swept to the end', async () => {
    const p = await page({ seed: seedInsert() });
    const ids = p.$$('#rl-doc [data-clause]').map(el => el.getAttribute('data-clause'));
    const at = ids.indexOf(p.c.__after.clauseId);
    assert.ok(at >= 0, 'the anchor clause is on the canvas');
    assert.equal(ids[at + 1], p.c.__ins.clauseId, 'the new clause follows its anchor');
    assert.ok(at + 1 < ids.length - 1, 'and that is genuinely not the end of the document');
  });

  test('an ACCEPTED new clause is still shown, before the round turns', async () => {
    const p = await page({ seed: seedInsert({ decide: 'accepted' }) });
    assert.equal(p.win.negoChangeById(p.c, p.c.__ins.id).status, 'accepted');
    assert.ok(!/keep the other party information confidential/.test(p.c.negotiation.baselineBody),
      'fixture: the round baseline deliberately does not absorb it yet');
    assert.match(canvas(p), /keep the other party information confidential/,
      'THE WORST CASE: agreed by both sides and absent from the contract');
  });

  test('a REJECTED one is struck through, not silently dropped', async () => {
    const p = await page({ seed: seedInsert({ decide: 'rejected' }) });
    const sec = p.$$('#rl-doc [data-clause]').find(el => /confidential/.test(el.textContent));
    assert.ok(sec, 'a gap in the document cannot be told from a clause never proposed');
    assert.ok(sec.querySelector('del, .nego-del'), 'refused wording is struck, not erased');
    /* ---- REVERSED IN PLACE, 16 Aug 2026 ---- the ask tags have come off the
       paper (owner-asked: "remove the pills from the contracts"). A proposed
       clause says what it is through its own treatment, which is what a reader
       scrolling the page actually sees: the washed-green frame for one that is
       not in the agreement yet, insertion marks on its wording, and the strike
       when it has been refused. The claim is re-pointed at those. */
    assert.equal(sec.querySelector('.rl-asktag'), null, 'and it says so by the strike, not a tag');
  });

  test('an insert whose anchor has gone falls to the end, and only then', async () => {
    const p = await page({ seed: seedInsert({ orphan: true }) });
    const ids = p.$$('#rl-doc [data-clause]').map(el => el.getAttribute('data-clause'));
    assert.equal(ids[ids.length - 1], p.c.__ins.clauseId,
      'the end is the one place that is always there and never a guess');
  });

  test('the wall holds: our unsent new clause is not in Counterparty View', async () => {
    /* Drawing an insert must not become a way around the view wall, and a whole
       clause is the most conspicuous thing there is to leak. Checked in the
       direction the wall actually runs: an unsent ask of OURS must not appear
       in the preview of what they see. (The mirror case does not exist — a
       change of theirs is on our record only because it was sent to us, which
       is negoUnsentAsks' own reasoning.) */
    const p = await page({ seed: seedInsert({ side: 'owner' }) });
    assert.ok(p.win.rlHiddenFrom(p.c, 'counterparty').has(p.c.__ins.id),
      'fixture: an unsent draft of ours must really be walled from their view');
    const theirs = p.win.redlineDocHtml(p.c, { side: 'counterparty' });
    assert.ok(!/keep the other party information confidential/.test(theirs),
      'a clause we have not sent is not in the document they are shown');
    assert.match(p.win.redlineDocHtml(p.c, { side: 'owner' }),
      /keep the other party information confidential/, 'and it is still in ours');
  });

  test('a proposed clause can be read, and the paper asks nothing of it', async () => {
    /* It is on the canvas now, so it can be selected — and it is still not in
       the baseline, so there is nothing to redline against. The refusal itself
       is B12's, which drives the mount's own hook and still holds; here the
       claim is that the paper does not offer the act at all, on a clause that
       could not honour it. */
    const p = await page({ seed: seedInsert() });
    const sec = p.$$('#rl-doc [data-clause]').find(el => /confidential/.test(el.textContent));
    const { menu, passage } = p.readSel(sec, 'keep the other party', 'information confidential');
    assert.match(passage.text, /keep the other party/, 'the wording reads');
    assert.equal(menu, null);
    assert.equal(p.panel.proposals.length, 0);
  });
});

describe('F96 (B9) — a mark with no words in it is not wording under change', () => {
  test('an empty mark at the selection boundary is not counted', async () => {
    const p = await page();
    const read = p.win.negoReadPassage;
    const doc = p.doc;
    const host = doc.createElement('div');
    host.innerHTML = '<section data-clause="c1"><p>plain wording here<ins class="nego-ins"></ins></p></section>';
    doc.body.appendChild(host);
    const target = host.querySelector('p').firstChild;
    const r = doc.createRange();
    r.setStart(target, 0);
    r.setEnd(target, target.nodeValue.length);
    const passage = read(r, host);
    assert.equal(passage.hasMarks, false,
      'cloneContents brings the empty <ins> along; it is not a redline over these words');
  });

  test('a mark with words in it is still counted', async () => {
    const p = await page();
    const doc = p.doc;
    const host = doc.createElement('div');
    host.innerHTML = '<section data-clause="c1"><p>keep <del class="nego-del">gone</del> tail</p></section>';
    doc.body.appendChild(host);
    const r = doc.createRange();
    r.selectNodeContents(host.querySelector('p'));
    assert.equal(p.win.negoReadPassage(r, host).hasMarks, true);
  });
});

describe('F96 (B10) — the safe default for an unknown selection', () => {
  test('a miss with nothing known about marks is not blamed on pending edits', async () => {
    /* The engine's own hook, called with no `marked` at all — the shape any
       future caller has before it learns to read a Range. */
    const p = await page();
    const win = p.win;
    let handed = null;
    const real = win.wireNegotiationTab;
    win.wireNegotiationTab = (cc, o) => { handed = o; return real(cc, o); };
    win.renderRedline();
    win.wireNegotiationTab = real;
    const cl = win.negoClauseList(p.c)[0];
    handed.selMenu({ text: 'wording that is in no clause at all', clauseId: cl.clauseId,
      rect: { left: 10, top: 10, bottom: 30, right: 90, width: 80, height: 20 } });
    await p.press(p.$('.nego-selmenu'));
    assert.ok(p.said(/reselect/i), 'an unknown selection gets the honest, checkable reason');
    assert.ok(!p.said(/pending edits/i),
      'claiming a redline exists is a claim about the document, and it must be earned');
  });
});

describe('F96 (B11) — two highlights are not one passage', () => {
  test('a second range is refused rather than half-honoured', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    const doc = p.doc;
    const a = doc.createRange();
    const s1 = p.point(cl, 'All invoices', 'start'), e1 = p.point(cl, 'date of issue', 'end');
    a.setStart(s1.node, s1.offset); a.setEnd(e1.node, e1.offset);
    const b = doc.createRange();
    const s2 = p.point(cl, 'Any sum not paid', 'start'), e2 = p.point(cl, 'until settled', 'end');
    b.setStart(s2.node, s2.offset); b.setEnd(e2.node, e2.offset);
    const sel = p.win.getSelection();
    sel.removeAllRanges(); sel.addRange(a);
    try { sel.addRange(b); } catch (e){}
    if (sel.rangeCount < 2) return;          // the platform collapsed them; nothing to test
    cl.dispatchEvent(new p.win.MouseEvent('mouseup', { bubbles: true }));
    const menu = p.$('.nego-selmenu');
    assert.ok(menu);
    assert.match(menu.textContent, /more than one highlight/i);
    assert.equal(menu.querySelectorAll('[data-nego-ai]').length, 0);
  });
});

describe('F96 — the guarantees the fixes are not allowed to cost', () => {
  test('the match is tolerant and the answer is still exact', async () => {
    const p = await page();
    const find = p.win.negoFindPassage;
    const hay = 'a.\nAll invoices are payable  within thirty (30) days.\nb.';
    const hit = find(hay, 'payable within thirty (30) days');
    assert.equal(hay.slice(0, hit.start) + 'payable within sixty (60) days' + hay.slice(hit.end),
      'a.\nAll invoices are payable within sixty (60) days.\nb.');
  });

  test('wording that is genuinely absent is still refused', async () => {
    const p = await page();
    assert.equal(p.win.negoFindPassage('Payment is due.', 'termination for convenience'), null);
    assert.equal(p.win.negoFindPassage('Payment is due.', '   '), null);
  });

  test('a Copilot proposal is filed as a tracked change like any other', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    await p.press(p.offer(cl, 'All invoices', 'date of issue.'));
    await apply(p, 'All invoices are payable on presentation.');
    const ch = p.changes()[0];
    assert.equal(ch.status, 'pending', 'a proposal, never an edit');
    assert.ok(ch.hash, 'fingerprinted like every other change');
    assert.match(ch.note || '', /Copilot/, 'and it says where it came from');
  });

  test('nothing is filed until a person presses Apply', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    await p.press(p.offer(cl, 'All invoices', 'date of issue.'));
    assert.equal(p.panel.proposals.length, 1, 'the model was asked');
    assert.equal(p.changes().length, 0, 'and the document is untouched');
  });
});

describe('F96 — the custom-prompt route matches the one-shot route', () => {
  test('Edit with Copilot opens a conversation, and its proposal splices the same way', async () => {
    const p = await page();
    const cl = p.clauseWith(/A party in breach/);
    await p.press(p.offer(cl, 'thirty (30) days', 'thirty (30) days', { fromNth: 1, toNth: 1 }),
      /Edit with Copilot/);
    assert.equal(p.panel.sessions.length, 1, 'the conversational action asks what the edit is FOR');
    assert.equal(p.panel.proposals.length, 0, 'and spends nothing before it is told');
    /* The lawyer types their instruction. */
    await p.panel.sessions[0].onPropose('Make the notice period longer.');
    assert.equal(p.panel.proposals.length, 1);
    assert.match(p.panel.proposals[0].instruction, /notice period longer/);
    const r = await apply(p, 'ninety (90) days');
    assert.ok(r && r.ok, `apply refused: ${r && r.message}`);
    const after = p.changes()[0].newText;
    assert.match(after, /remedy it within thirty \(30\) days of notice/,
      'the conversation route honours the occurrence too');
    assert.match(after, /terminate on ninety \(90\) days written notice/);
  });
});
