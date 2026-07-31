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
   selection menu, the real Apply — because every bug here lived in the distance
   between what the Range knew and what the string remembered. */
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

  /* Press a verb in the menu. mousedown, because that is what the menu listens
     for — a click would collapse the selection first. Awaited, because asking
     the Copilot is a round trip and the proposal card exists on the other side
     of it. */
  const settle = () => new Promise(r => setImmediate(r));
  const press = async (menu, re = /Shorten/) => {
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
  test('the heading is not wording, and does not defeat the match', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    /* The natural "grab the whole clause" gesture: start on the number. */
    const menu = p.highlight(cl, '2. PAYMENT TERMS', 'date of issue.');
    assert.ok(menu, 'the menu must open on a heading-inclusive drag');
    await p.press(menu);
    assert.equal(p.panel.proposals.length, 1, 'THE FIX: this used to be refused as unmatchable');
    assert.ok(!p.said(/couldn.t be matched|pending edits/i));
  });

  test('and the heading is not sent to the model as if it were the passage', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    await p.press(p.highlight(cl, '2. PAYMENT TERMS', 'date of issue.'));
    const asked = p.panel.proposals[0].passage;
    assert.ok(!/PAYMENT TERMS/.test(asked), 'the heading is chrome, not the wording under review');
    assert.match(asked, /All invoices are payable/);
  });

  test('a heading-to-end drag is recognised as the whole clause', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    await p.press(p.highlight(cl, '2. PAYMENT TERMS', 'until settled.'));
    assert.equal(p.panel.proposals.length, 1);
    const r = await apply(p, 'The whole clause, rewritten.');
    assert.ok(r && r.ok, `apply refused: ${r && r.message}`);
    const ch = p.changes()[0];
    assert.match(ch.newText, /The whole clause, rewritten\./);
    assert.ok(!/All invoices are payable/.test(ch.newText), 'the old wording is gone, not appended');
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
    const menu = p.highlight(cl, 'Either party may terminate', 'survive termination of this Agreement.');
    assert.ok(menu);
    await p.press(menu);
    assert.equal(p.panel.proposals.length, 1, 'THE FIX: lettered sub-clauses are how contracts are written');
    assert.ok(!p.said(/couldn.t be matched/i));
  });

  test('the splice lands on the wording, and leaves the clause either side alone', async () => {
    const p = await page();
    const cl = p.clauseWith(/terminate for convenience/);
    await p.press(p.highlight(cl, 'Accrued rights', 'survive termination of this Agreement.'));
    const r = await apply(p, 'Accrued rights survive.');
    assert.ok(r && r.ok, `apply refused: ${r && r.message}`);
    const ch = p.changes()[0];
    assert.match(ch.newText, /Accrued rights survive\./);
    assert.match(ch.newText, /Either party may terminate for convenience/,
      'the first sub-clause was never selected and must not move');
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

describe('F96 (B3) — a wall of paragraphs has no clauses to stay inside', () => {
  test('a cross-paragraph highlight is not refused on a headingless document', async () => {
    const p = await page({ body: WALL });
    const first = p.clauseWith(/deliver the Goods/);
    const second = p.clauseWith(/fourteen \(14\) days/);
    assert.ok(first && second && first !== second,
      'fixture: each paragraph must be its own clause here');
    const menu = p.drag(p.point(first, 'The Supplier shall deliver', 'start'),
      p.point(second, 'each purchase order.', 'end'));
    assert.ok(menu, 'the menu must open across paragraphs of a wall-of-text upload');
    await p.press(menu);
    assert.ok(!p.said(/more than one clause/i),
      'THE FIX: those boundaries are an artefact of the parse, not of the agreement');
    assert.equal(p.panel.proposals.length, 1);
  });

  test('the span is filed as a rewrite of the head and a deletion of what it ate', async () => {
    const p = await page({ body: WALL });
    const first = p.clauseWith(/deliver the Goods/);
    const second = p.clauseWith(/fourteen \(14\) days/);
    await p.press(p.drag(p.point(first, 'The Supplier shall deliver', 'start'),
      p.point(second, 'each purchase order.', 'end')));
    const r = await apply(p, 'The Supplier shall deliver within fourteen (14) days of each order.');
    assert.ok(r && r.ok, `apply refused: ${r && r.message}`);
    const chs = p.changes();
    assert.equal(chs.length, 2, 'one rewrite and one deletion, each answerable on its own');
    assert.match(chs[0].newText, /deliver within fourteen \(14\) days of each order\./);
    assert.equal(chs[1].changeType, 'deleteClause');
    /* The third paragraph was never highlighted and must be untouched. */
    assert.ok(!chs.some(x => /Risk in the Goods/.test(x.oldText || '')),
      'a paragraph outside the highlight is not part of the rewrite');
  });

  test('the untouched tail of the last paragraph is kept, not carried off', async () => {
    const p = await page({ body: WALL });
    const first = p.clauseWith(/deliver the Goods/);
    const second = p.clauseWith(/fourteen \(14\) days/);
    /* The highlight stops mid-way through the second paragraph. */
    await p.press(p.drag(p.point(first, 'The Supplier shall deliver', 'start'),
      p.point(second, 'Delivery shall take place', 'end')));
    await apply(p, 'Delivery is prompt.');
    const chs = p.changes();
    const tail = chs.find(x => /purchase order/.test(x.newText || ''));
    assert.ok(tail, 'the wording after the highlight survives as its own clause');
    assert.ok(!/Delivery shall take place/.test(tail.newText),
      'and the part that WAS highlighted is not left behind as well');
  });

  test('a document with headings still refuses a cross-clause drag', async () => {
    const p = await page();
    const a = p.clauseWith(/payable within thirty/);
    const b = p.clauseWith(/A party in breach/);
    await p.press(p.drag(p.point(a, 'All invoices', 'start'), p.point(b, 'of notice', 'end')));
    assert.ok(p.said(/more than one clause/i),
      'merging two NUMBERED clauses renumbers an instrument cited by those numbers');
    assert.equal(p.panel.proposals.length, 0, 'and no tokens are spent on it');
  });
});

describe('F96 (B4) — a settled redline is not a pending one', () => {
  const withDecided = status => async (win, c) => {
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days from the date of issue',
      'sixty (60) days from the date of issue'), { side: 'counterparty', author: 'Amina Wanjiru' });
    const ch = win.negoChanges(c)[0];
    win.negoResolve(c, ch.id, status, { side: 'owner', by: 'Wanjiru Kamau' });
  };

  test('wording in an ACCEPTED clause is not refused as having pending edits', async () => {
    const p = await page({ seed: withDecided('accepted') });
    const cl = p.clauseWith(/payable within/);
    await p.press(p.highlight(cl, 'Any sum not paid when due', 'until settled.'));
    assert.ok(!p.said(/pending edits/i),
      'THE FIX: it was decided — there is no redline left to accept or reject');
    assert.equal(p.panel.proposals.length, 1);
  });

  test('wording in a REJECTED clause is not refused either', async () => {
    const p = await page({ seed: withDecided('rejected') });
    const cl = p.clauseWith(/payable within/);
    await p.press(p.highlight(cl, 'Any sum not paid when due', 'until settled.'));
    assert.ok(!p.said(/pending edits/i));
    assert.equal(p.panel.proposals.length, 1);
  });

  test('but wording inside a LIVE redline is still refused, and told the truth', async () => {
    const p = await page({ seed: async (win, c) => {
      await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days from the date of issue',
        'sixty (60) days from the date of issue'), { side: 'counterparty', author: 'Amina Wanjiru' });
    } });
    const cl = p.clauseWith(/payable within|invoices are payable/);
    const menu = p.highlight(cl, 'invoices are payable', 'from the date of issue');
    assert.ok(menu);
    await p.press(menu);
    assert.ok(p.said(/pending edits/i),
      'the true positive must survive the fix to the false one');
    assert.equal(p.panel.proposals.length, 0, 'and nothing is asked of the model');
  });
});

describe('F96 (B5) — the second "thirty (30) days" is not the first', () => {
  test('the redline lands on the occurrence that was highlighted', async () => {
    const p = await page();
    const cl = p.clauseWith(/A party in breach/);
    const before = p.clauseText(/A party in breach/);
    assert.equal((before.match(/thirty \(30\) days/g) || []).length, 2,
      'fixture: the clause must say it twice');
    /* The SECOND one — the termination notice period, not the cure period. */
    await p.press(p.highlight(cl, 'thirty (30) days', 'thirty (30) days', { fromNth: 1, toNth: 1 }));
    const r = await apply(p, 'ninety (90) days');
    assert.ok(r && r.ok, `apply refused: ${r && r.message}`);
    const after = p.changes()[0].newText;
    assert.match(after, /remedy it within thirty \(30\) days of notice/,
      'THE FIX: the cure period was not the one pointed at and must not move');
    assert.match(after, /terminate on ninety \(90\) days written notice/,
      'the occurrence under the cursor is the one that changed');
  });

  test('the first occurrence still answers when it is the one chosen', async () => {
    const p = await page();
    const cl = p.clauseWith(/A party in breach/);
    await p.press(p.highlight(cl, 'thirty (30) days', 'thirty (30) days'));
    await apply(p, 'ninety (90) days');
    const after = p.changes()[0].newText;
    assert.match(after, /remedy it within ninety \(90\) days of notice/);
    assert.match(after, /terminate on thirty \(30\) days written notice/);
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
    const menu = p.drag(p.point(a, 'All invoices', 'start'), { node: b, offset: 0 });
    assert.ok(menu, 'the menu must still open');
    await p.press(menu);
    assert.ok(!p.said(/more than one clause/i),
      'THE FIX: a boundary that touches is not a highlight that covers');
    assert.equal(p.panel.proposals.length, 1);
  });
});

describe('F96 (B7) — the hover toolbar is furniture, not contract', () => {
  test('the clause tools and the ask tag are not selectable', async () => {
    const p = await page();
    const css = (p.doc.getElementById('redline-layout-css') || { textContent: '' }).textContent;
    assert.match(css, /\.redline-page \.rl-tools,\.redline-page \.rl-asktag[^{]*\{[^}]*user-select:none/,
      'an invisible control is still selectable text unless it is told not to be');
  });

  test('and a drag that sweeps them still matches the clause', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    /* Whatever the browser lets through, the reading takes it out again. */
    const menu = p.highlight(cl, 'All invoices', 'Direct Edit');
    assert.ok(menu);
    await p.press(menu);
    assert.equal(p.panel.proposals.length, 1, 'the toolbar must not defeat the match');
    const asked = p.panel.proposals[0].passage;
    assert.ok(!/Direct Edit|Propose deletion|Add Note/.test(asked),
      'and it must not be sent to the model as if it were wording');
  });
});

describe('F96 (B8) — a highlight in the front matter says so', () => {
  test('selecting the recital is answered, not ignored', async () => {
    const p = await page();
    const recital = p.$('#rl-doc .rl-recital') || p.$('#rl-doc .rl-paper-head');
    assert.ok(recital, 'fixture: the page must render its front matter');
    const menu = p.highlight(recital, 'Between the parties');
    assert.ok(menu, 'THE FIX: this used to end in silence, which reads as a broken page');
    assert.match(menu.textContent, /front matter|not a negotiable clause/i);
    assert.equal(menu.querySelectorAll('[data-nego-ai]').length, 0,
      'and it offers nothing, because there is nothing here to file against');
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
    await p.press(p.highlight(cl, 'All invoices', 'date of issue.'));
    await apply(p, 'All invoices are payable on presentation.');
    const ch = p.changes()[0];
    assert.equal(ch.status, 'pending', 'a proposal, never an edit');
    assert.ok(ch.hash, 'fingerprinted like every other change');
    assert.match(ch.note || '', /Copilot/, 'and it says where it came from');
  });

  test('nothing is filed until a person presses Apply', async () => {
    const p = await page();
    const cl = p.clauseWith(/payable within thirty/);
    await p.press(p.highlight(cl, 'All invoices', 'date of issue.'));
    assert.equal(p.panel.proposals.length, 1, 'the model was asked');
    assert.equal(p.changes().length, 0, 'and the document is untouched');
  });
});

describe('F96 — the custom-prompt route matches the one-shot route', () => {
  test('Rephrase opens a conversation, and its proposal splices the same way', async () => {
    const p = await page();
    const cl = p.clauseWith(/A party in breach/);
    await p.press(p.highlight(cl, 'thirty (30) days', 'thirty (30) days', { fromNth: 1, toNth: 1 }),
      /Rephrase/);
    assert.equal(p.panel.sessions.length, 1, 'Rephrase asks what the rewrite is FOR');
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
