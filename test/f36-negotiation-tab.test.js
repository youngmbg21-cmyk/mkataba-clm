/* ============================================================
   f36 — the Negotiation tab (Phase 2)
   ============================================================
   The three-pane fingerprinted redline, driven the way a person drives it:
   render it, read it, press its buttons, and check the document and the record
   afterwards.

   These are assertions about the SHIPPED component. js/views/negotiation.js is
   evaluated into a real DOM by test/world.js and the real clicks are dispatched
   on the real elements, so nothing here is asserting on a reimplementation. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');

const BASE = [
  'WAREHOUSING AND LOGISTICS SERVICES AGREEMENT',
  '1. SCOPE',
  '1. The Provider shall receive, store, handle and dispatch the goods.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. STORAGE',
  '3. Stored goods may remain in the facility for a maximum of one hundred and twenty (120) days.',
  '4. TERMINATION',
  '4. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

/* A rendered tab, with Erik's three proposals already on the table. Returns the
   world plus a few readers so each test reads the DOM rather than a copy of it. */
async function mounted(opts = {}){
  const w = buildWorld({ negotiationView: true, ...(opts.world || {}) });
  const { win } = w;
  /* The reject handler asks for a reason before it acts, and treats a CANCELLED
     prompt as "leave it pending" — which is the behaviour we want and also
     exactly what world.js's default stub returns (null). So the stage has to say
     which of the two it is standing in for. Blank-but-submitted is the default
     here; the test that checks the reason is kept overrides it with real words. */
  win.promptDialog = opts.promptDialog || (async () => '');
  if (opts.emailOff !== undefined) win.emailOff = () => !!opts.emailOff;
  const c = opts.contract || contractFixture();
  win.negoInit(c);
  const proposed = (opts.proposed || (t => t
    .replace('thirty (30) days', 'forty-five (45) days')
    .replace('one hundred and twenty (120) days', 'ninety (90) days')
    .replace('sixty (60) days', 'thirty (30) days')))(win.negoBaseText(c));
  const filed = await win.negoFileProposal(c, proposed,
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
  win.renderNegotiationTab(c, { hostId: 'nego-tab', side: opts.side || 'owner',
    by: 'Wanjiru Kamau', author: 'Wanjiru Kamau', readonly: !!opts.readonly, ...(opts.render || {}) });
  const doc = win.document;
  return { w, win, c, filed, doc,
    host: () => doc.getElementById('nego-tab'),
    html: () => doc.getElementById('nego-tab').innerHTML,
    $: sel => doc.querySelector(sel),
    $$: sel => Array.from(doc.querySelectorAll(sel)),
    click: sel => { const el = doc.querySelector(sel); assert.ok(el, 'missing element: ' + sel); el.click(); return el; },
    /* Rejecting is asynchronous — it asks for a reason first — so a test that
       rejects has to let that settle before reading the result back. */
    reject: async id => { const el = doc.querySelector(`[data-nego-reject="${id}"]`);
      assert.ok(el, 'missing reject control for ' + id); el.click();
      await new Promise(r => setImmediate(r)); },
    /* A clause id ("clause:2.") is a negotiation key, not a DOM id — the colon
       and the stop are CSS combinators. The component slugs it for the element
       and keeps the real key in data-clause; these read it back the same way. */
    base: clauseId => doc.getElementById('nb-' + win.negoDomId(clauseId)),
    work: clauseId => doc.getElementById('nw-' + win.negoDomId(clauseId)),
  };
}

describe('the three panes render, and they render the same clauses', () => {
  test('baseline, working and index are all present', async () => {
    const m = await mounted();
    assert.ok(m.$('.nego-pane.baseline'), 'the baseline pane');
    assert.ok(m.$('.nego-pane.working'), 'the working pane');
    assert.ok(m.$('.nego-pane.index'), 'the change index');
    assert.match(m.$('.nego-pane.baseline .nego-pane-head').textContent, /Baseline/);
    assert.match(m.$('.nego-pane.working .nego-pane-head').textContent, /Working/);
    assert.match(m.$('.nego-pane.index h3').textContent, /Fingerprinted Change Index/);
  });

  test('a clause sits at the same place in both panes, so the eye can cross', async () => {
    const m = await mounted();
    const base = m.$$('.nego-pane.baseline .nego-clause').map(n => n.getAttribute('data-clause'));
    const work = m.$$('.nego-pane.working .nego-clause').map(n => n.getAttribute('data-clause'));
    assert.equal(base.length, 4);
    assert.equal(work.join('|'), base.join('|'),
      'the two panes must be built from the same clause list');
  });

  test('the baseline pane carries no redline and no badges — it is the reference', async () => {
    const m = await mounted();
    const pane = m.$('.nego-pane.baseline');
    assert.equal(pane.querySelectorAll('.nego-badge').length, 0);
    assert.equal(pane.querySelectorAll('.nego-ins, .nego-del').length, 0);
    assert.match(pane.textContent, /thirty \(30\) days from the date of issue/,
      'the baseline keeps the wording as it was');
  });

  test('the working pane draws the redline: what goes and what arrives', async () => {
    const m = await mounted();
    const pane = m.$('.nego-pane.working');
    const dels = m.$$('.nego-pane.working .nego-del').map(n => n.textContent).join(' ');
    const inss = m.$$('.nego-pane.working .nego-ins').map(n => n.textContent).join(' ');
    assert.match(dels, /thirty \(30\)/, 'the wording that would go is struck out');
    assert.match(inss, /forty-five \(45\)/, 'the wording that would arrive is marked in');
  });

  test('headings label the clauses rather than becoming negotiable themselves', async () => {
    const m = await mounted();
    const h = m.$$('.nego-pane.working .nego-clause h2').map(n => n.textContent);
    assert.ok(h.some(x => /Clause 2 · PAYMENT TERMS/.test(x)));
    assert.equal(m.$$('.nego-pane.working .nego-clause[data-clause]').length, 4,
      'five heading lines must not add five more changes to decide');
  });
});

describe('fingerprint badges anchor in the margin', () => {
  test('one badge per pending change, in the working pane only', async () => {
    const m = await mounted();
    const badges = m.$$('.nego-pane.working .nego-badge');
    assert.equal(badges.length, 3);
    for (const b of badges) assert.match(b.textContent, /^#CHG-\d{3}$/);
  });

  test('a badge is positioned outside the text column', async () => {
    const m = await mounted();
    // the rule that puts it in the margin lives in the component's own stylesheet
    const style = m.doc.getElementById('nego-style').textContent;
    assert.match(style, /\.nego-badge\{position:absolute;right:calc\(100% \+ 6px\)/,
      'the badge must be anchored in the document margin, not inline with the text');
  });

  test('an accepted badge gains a tick, a rejected one a cross', async () => {
    const m = await mounted();
    const id = m.filed[0].id;
    m.click(`[data-nego-accept="${id}"]`);
    assert.match(m.$(`[data-badge="${id}"]`).textContent, /#CHG-\d{3} ✓$/);
    assert.ok(m.$(`[data-badge="${id}"]`).className.includes('is-accepted'));

    const id2 = m.filed[1].id;
    await m.reject(id2);
    assert.match(m.$(`[data-badge="${id2}"]`).textContent, /#CHG-\d{3} ✕$/);
    assert.ok(m.$(`[data-badge="${id2}"]`).className.includes('is-rejected'));
  });
});

describe('the change index card carries what a reader needs to decide', () => {
  test('id, twin status pills, summary, clause, author and the full hash', async () => {
    const m = await mounted();
    const card = m.$(`#nego-card-${m.filed[0].id}`);
    assert.ok(card, 'the card must exist');
    assert.match(card.querySelector('.nego-id').textContent, /^#CHG-001$/);
    const pills = Array.from(card.querySelectorAll('.nego-st')).map(n => n.textContent.trim());
    assert.deepEqual([...pills], ['Verified', 'pending'], 'Verified always, then the live status');
    assert.match(card.textContent, /Author:/);
    assert.match(card.textContent, /Erik Lindqvist · Nordfrakt Logistik AB/);
    // the abbreviated hash is shown; the full one is on the element
    const hash = card.querySelector('.nego-hash');
    assert.match(hash.textContent, /SHA-256: 0x[0-9a-f]{8}…[0-9a-f]{6}/);
    assert.match(hash.getAttribute('title'), /^0x[0-9a-f]{64}$/,
      'the whole fingerprint must be available, not only its abbreviation');
  });

  test('the counterparty is named as author — never the owner', async () => {
    const m = await mounted();
    const idx = m.$('.nego-pane.index').textContent;
    assert.match(idx, /Erik Lindqvist/);
    assert.ok(!/Author:\s*Wanjiru/.test(idx),
      'the owner must never be credited with the other side\'s wording');
  });

  test('a pending change offers Accept, Reject and Discuss', async () => {
    const m = await mounted();
    const card = m.$(`#nego-card-${m.filed[0].id}`);
    assert.ok(card.querySelector('[data-nego-accept]'));
    assert.ok(card.querySelector('[data-nego-reject]'));
    assert.ok(card.querySelector('[data-nego-discuss]'));
    assert.equal(card.querySelector('[data-nego-undo]'), null);
  });

  test('a resolved change offers Discuss and Undo instead', async () => {
    const m = await mounted();
    const id = m.filed[0].id;
    m.click(`[data-nego-accept="${id}"]`);
    const card = m.$(`#nego-card-${id}`);
    assert.equal(card.querySelector('[data-nego-accept]'), null);
    assert.ok(card.querySelector('[data-nego-undo]'), 'a decision must be reversible');
    assert.ok(card.querySelector('[data-nego-discuss]'));
  });

  test('a card is reachable by keyboard', async () => {
    const m = await mounted();
    const card = m.$(`#nego-card-${m.filed[0].id}`);
    assert.equal(card.getAttribute('role'), 'button');
    assert.equal(card.getAttribute('tabindex'), '0');
  });

  test('nobody rules on their own ask', async () => {
    // the SAME contract, viewed by the side that proposed the changes
    const m = await mounted({ side: 'counterparty' });
    const card = m.$(`#nego-card-${m.filed[0].id}`);
    assert.equal(card.querySelector('[data-nego-accept]'), null,
      'a party must not be able to mark its own wording adopted');
    assert.ok(card.querySelector('[data-nego-discuss]'), 'but they can still discuss it');
    assert.match(card.textContent, /\(your side\)/);
  });
});

describe('synchronised focus lights up all three panes', () => {
  test('clicking a badge highlights the clause in both panes and the card', async () => {
    const m = await mounted();
    const ch = m.filed[0];
    m.click(`[data-badge="${ch.id}"]`);
    assert.ok(m.base(ch.clauseId).className.includes('is-active'), 'the baseline clause');
    assert.ok(m.work(ch.clauseId).className.includes('is-active'), 'the working clause');
    assert.ok(m.$(`#nego-card-${ch.id}`).className.includes('is-active'), 'the index card');
    assert.ok(m.$(`[data-badge="${ch.id}"]`).className.includes('is-active'), 'the badge itself');
  });

  test('clicking a card does the same, from the other end', async () => {
    const m = await mounted();
    const ch = m.filed[1];
    m.click(`[data-nego-card="${ch.id}"]`);
    assert.ok(m.base(ch.clauseId).className.includes('is-active'));
    assert.ok(m.work(ch.clauseId).className.includes('is-active'));
    assert.ok(m.$(`#nego-card-${ch.id}`).className.includes('is-active'));
  });

  test('clicking a clause in the document does the same', async () => {
    const m = await mounted();
    const ch = m.filed[2];
    m.click(`.nego-pane.working .nego-clause[data-change="${ch.id}"]`);
    assert.ok(m.base(ch.clauseId).className.includes('is-active'));
    assert.ok(m.$(`#nego-card-${ch.id}`).className.includes('is-active'));
  });

  test('focusing one change un-focuses the last', async () => {
    const m = await mounted();
    const a = m.filed[0], b = m.filed[1];
    m.click(`[data-badge="${a.id}"]`);
    m.click(`[data-badge="${b.id}"]`);
    assert.ok(!m.$(`#nego-card-${a.id}`).className.includes('is-active'),
      'two changes must never both read as focused');
    assert.ok(m.$(`#nego-card-${b.id}`).className.includes('is-active'));
  });

  test('a badge click does not also fire its clause', async () => {
    const m = await mounted();
    // both handlers focus the same change, so the observable difference is that
    // a badge press scrolls the working pane and a clause press does not.
    // What must hold either way: exactly one change ends up focused.
    m.click(`[data-badge="${m.filed[0].id}"]`);
    assert.equal(m.$$('.nego-card.is-active').length, 1);
  });
});

describe('accept, reject and undo do what they say to the document', () => {
  test('accept merges that clause into the clean text', async () => {
    const m = await mounted();
    const ch = m.filed.find(x => /forty-five/.test(x.newText));
    m.click(`[data-nego-accept="${ch.id}"]`);

    assert.equal(m.win.negoChangeById(m.c, ch.id).status, 'accepted');
    assert.match(m.win.docPlainText(m.c), /forty-five \(45\) days/,
      'the wording must actually move');
    assert.match(m.$('.nego-pane.working').textContent, /forty-five \(45\) days/);
    // and the toast names the fingerprint that was filed
    assert.match(m.w.toastText(), /#CHG-\d{3} accepted — merged into the clean text · 0x[0-9a-f]{8}…/);
  });

  test('reject leaves the clause at the baseline, and says so in the document', async () => {
    const m = await mounted();
    const ch = m.filed.find(x => /ninety \(90\)/.test(x.newText));
    await m.reject(ch.id);

    assert.equal(m.win.negoChangeById(m.c, ch.id).status, 'rejected');
    assert.match(m.win.docPlainText(m.c), /one hundred and twenty \(120\) days/,
      'the baseline wording stands');
    assert.ok(!/ninety \(90\)/.test(m.win.docPlainText(m.c)),
      'the refused wording must not be in the contract');
    const clause = m.work(ch.clauseId);
    assert.match(clause.textContent, /Rejected — baseline kept/);
    assert.match(clause.textContent, /one hundred and twenty \(120\) days/);
  });

  test('undo puts a decided change back on the table', async () => {
    const m = await mounted();
    const ch = m.filed[0];
    m.click(`[data-nego-accept="${ch.id}"]`);
    assert.match(m.win.docPlainText(m.c), /forty-five \(45\)/);
    m.click(`[data-nego-undo="${ch.id}"]`);
    assert.equal(m.win.negoChangeById(m.c, ch.id).status, 'pending');
    assert.match(m.win.docPlainText(m.c), /thirty \(30\) days from the date of issue/,
      'undoing an acceptance takes the wording back out');
    assert.ok(m.$(`[data-nego-accept="${ch.id}"]`), 'and the controls come back');
  });

  test('the audit trail names the decider, the proposer and the fingerprint', async () => {
    const m = await mounted();
    m.click(`[data-nego-accept="${m.filed[0].id}"]`);
    const entry = m.c.audit.find(e => /#CHG-001 accepted/.test(e.detail));
    assert.ok(entry);
    assert.match(entry.detail, /accepted by Wanjiru Kamau/);
    assert.match(entry.detail, /proposed by Erik Lindqvist/);
    assert.match(entry.detail, /fingerprint 0x[0-9a-f]{64}/);
  });

  test('a rejection asks for a reason and keeps it with the change', async () => {
    const m = await mounted({ promptDialog: async () => 'Net-30 stands, or we can look at a 2% price increase.' });
    const ch = m.filed[0];
    await m.reject(ch.id);
    const after = m.win.negoChangeById(m.c, ch.id);
    assert.equal(after.status, 'rejected');
    assert.equal(after.reply, 'Net-30 stands, or we can look at a 2% price increase.');
    const pts = m.win.negoOpenPoints(m.c);
    assert.equal(pts.length, 1);
    assert.equal(pts[0].reason, 'Net-30 stands, or we can look at a 2% price increase.');
  });

  test('cancelling the reason prompt leaves the change pending', async () => {
    const m = await mounted({ promptDialog: async () => null });   // cancelled
    const ch = m.filed[0];
    await m.reject(ch.id);
    assert.equal(m.win.negoChangeById(m.c, ch.id).status, 'pending',
      'backing out of the reason must back out of the rejection');
  });

  test('a viewer sees the negotiation but cannot decide it', async () => {
    const m = await mounted({ readonly: true });
    assert.ok(m.$('.nego-pane.working'), 'they can still read it');
    assert.equal(m.$('[data-nego-accept]'), null);
    assert.equal(m.$('[data-nego-reject]'), null);
    assert.equal(m.$('#nego-bulk-acc'), null);
  });
});

describe('discussing a change opens no round', () => {
  test('Discuss expands the thread on the fingerprint itself', async () => {
    const m = await mounted();
    const ch = m.filed[0];
    assert.ok(!m.$(`#nego-thread-${ch.id}`).className.includes('open'));
    m.click(`[data-nego-discuss="${ch.id}"]`);
    assert.ok(m.$(`#nego-thread-${ch.id}`).className.includes('open'));
    assert.match(m.$(`#nego-thread-${ch.id}`).textContent, /no formal round re-draft/);
  });

  test('posting a comment changes nothing about the contract', async () => {
    const m = await mounted();
    const ch = m.filed[0];
    const rounds = (m.c.rounds || []).length;
    const versions = (m.c.versions || []).length;
    const text = m.win.docPlainText(m.c);

    m.click(`[data-nego-discuss="${ch.id}"]`);
    m.$(`#nego-ti-${ch.id}`).value = 'Would you take Net-45 with a 1% early-settlement discount?';
    m.click(`[data-nego-send="${ch.id}"]`);

    assert.equal((m.c.rounds || []).length, rounds, 'no round');
    assert.equal((m.c.versions || []).length, versions, 'no version');
    assert.equal(m.win.docPlainText(m.c), text, 'no wording moved');
    assert.equal(m.win.negoChangeById(m.c, ch.id).status, 'pending', 'no status moved');
    assert.match(m.w.toastText(), /the contract is unchanged and no round was opened/);
  });

  test('the comment appears in the thread, attributed to the side that wrote it', async () => {
    const m = await mounted();
    const ch = m.filed[0];
    m.click(`[data-nego-discuss="${ch.id}"]`);
    m.$(`#nego-ti-${ch.id}`).value = 'Would you take Net-45?';
    m.click(`[data-nego-send="${ch.id}"]`);
    const thread = m.$(`#nego-thread-${ch.id}`);
    assert.match(thread.textContent, /Would you take Net-45\?/);
    assert.match(thread.textContent, /Wanjiru Kamau/);
    // and the count reaches the button
    assert.match(m.$(`[data-nego-discuss="${ch.id}"]`).textContent, /Discuss \(1\)/);
  });

  test('an empty reply is refused rather than posted', async () => {
    const m = await mounted();
    const ch = m.filed[0];
    m.click(`[data-nego-discuss="${ch.id}"]`);
    m.$(`#nego-ti-${ch.id}`).value = '   ';
    m.click(`[data-nego-send="${ch.id}"]`);
    assert.equal(m.win.negoChangeById(m.c, ch.id).thread.length, 0);
    assert.match(m.w.toastText(), /Write your reply first/);
  });

  test('the thread survives the change being decided', async () => {
    const m = await mounted();
    const ch = m.filed[0];
    m.click(`[data-nego-discuss="${ch.id}"]`);
    m.$(`#nego-ti-${ch.id}`).value = 'Why do you need 45?';
    m.click(`[data-nego-send="${ch.id}"]`);
    m.click(`[data-nego-accept="${ch.id}"]`);
    assert.equal(m.win.negoChangeById(m.c, ch.id).thread.length, 1);
    assert.match(m.$(`#nego-card-${ch.id}`).textContent, /Discuss \(1\)/);
  });
});

describe('progress, bulk actions and the status strip', () => {
  test('the progress bar and label track the decisions', async () => {
    const m = await mounted();
    assert.match(m.$('#nego-progress').textContent, /^0 of 3 changes resolved$/);
    assert.equal(m.$('#nego-fill').style.width, '0%');
    assert.equal(m.$('#nego-count').textContent, '3');

    m.click(`[data-nego-accept="${m.filed[0].id}"]`);
    assert.match(m.$('#nego-progress').textContent, /^1 of 3 changes resolved$/);
    assert.equal(m.$('#nego-fill').style.width, '33%');
    assert.equal(m.$('#nego-count').textContent, '2');
  });

  test('Accept All takes every pending change and nothing else', async () => {
    const m = await mounted();
    await m.reject(m.filed[1].id);   // decided first — must stay decided
    m.click('#nego-bulk-acc');
    const st = m.win.negoChanges(m.c).map(x => x.status);
    assert.equal(st.filter(x => x === 'accepted').length, 2);
    assert.equal(st.filter(x => x === 'rejected').length, 1,
      'a bulk accept must not overturn a decision already made');
    assert.match(m.w.toastText(), /2 changes accepted/);
  });

  test('Reject All reverts every pending clause to the baseline', async () => {
    const m = await mounted();
    m.click('#nego-bulk-rej');
    assert.equal(m.win.docPlainText(m.c), BASE,
      'rejecting everything must reproduce the baseline exactly');
    assert.match(m.w.toastText(), /3 changes rejected/);
  });

  test('the bulk buttons disable once nothing is pending', async () => {
    const m = await mounted();
    m.click('#nego-bulk-acc');
    assert.equal(m.$('#nego-bulk-acc').disabled, true);
    assert.equal(m.$('#nego-bulk-rej').disabled, true);
  });

  test('the status strip reads its fields from the product, not from prose', async () => {
    const m = await mounted();
    const strip = m.$('#nego-status').textContent;
    assert.match(strip, /Email:/);
    assert.match(strip, /Last seen:/);
    assert.match(strip, /Negotiation: Round 1/);
    assert.match(strip, /Resolved: 0 \/ 3/);
    m.click(`[data-nego-accept="${m.filed[0].id}"]`);
    assert.match(m.$('#nego-status').textContent, /Resolved: 1 \/ 3/);
  });

  test('Email: Not Configured shows when the product says email is off', async () => {
    // emailOff() is core.js's answer, not this component's — the strip must
    // report it rather than decide it
    const m = await mounted({ emailOff: true });
    const strip = m.$('#nego-status').textContent;
    assert.match(strip, /Email: Not Configured/);
    assert.match(strip, /Sharing limits apply/);

    const on = await mounted({ emailOff: false });
    assert.match(on.$('#nego-status').textContent, /Email: Configured/);
  });

  test('the export control is gated until nothing is pending', async () => {
    const m = await mounted();
    assert.equal(m.$('#nego-export').disabled, true);
    assert.match(m.$('#nego-export').getAttribute('title'), /must be resolved first/);
    m.click('#nego-bulk-acc');
    assert.equal(m.$('#nego-export').disabled, false);
  });
});

describe('the one transition out', () => {
  test('Ready to sign appears only when every change has an answer', async () => {
    const m = await mounted();
    assert.equal(m.$('#nego-ready'), null, 'not while anything is pending');
    m.click(`[data-nego-accept="${m.filed[0].id}"]`);
    assert.equal(m.$('#nego-ready'), null, 'not part-way through');
    await m.reject(m.filed[1].id);
    m.click(`[data-nego-accept="${m.filed[2].id}"]`);
    assert.ok(m.$('#nego-ready'), 'once all three are decided');
    assert.match(m.$('#nego-ready').textContent, /Ready to sign — every change is resolved/);
  });

  test('it names the hand-off, and builds no signing logic', async () => {
    const m = await mounted();
    m.click('#nego-bulk-acc');
    const btn = m.$('#nego-to-docs');
    assert.ok(btn, 'the hand-off must be reachable');
    assert.equal(btn.textContent.trim(), 'Send to Docs tab for signature');
    // nothing on this screen signs, seals or executes
    assert.equal(m.$('[data-nego-sign]'), null);
    assert.ok(!/\bOTP\b/.test(m.html()));
    assert.equal(m.c.status, 'Under Review', 'the contract is not executed by this tab');
    assert.equal((m.c.signatures || []).length, 0);
  });

  test('the hand-off closes the round and makes the agreed wording the baseline', async () => {
    const m = await mounted();
    m.click('#nego-bulk-acc');
    m.click('#nego-to-docs');
    assert.equal(m.win.negoRound(m.c), 2);
    assert.match(m.win.negoBaseText(m.c), /forty-five \(45\) days/);
    assert.equal(m.win.negoChanges(m.c).length, 0, 'the decided set is archived onto the round');
    assert.equal(m.win.negoAllChanges(m.c).length, 3, 'and stays readable as history');
    assert.match(m.w.toastText(), /carried to the Docs tab/);
  });

  test('reopening a change withdraws readiness', async () => {
    const m = await mounted();
    m.click('#nego-bulk-acc');
    assert.ok(m.$('#nego-ready'));
    m.click(`[data-nego-undo="${m.filed[0].id}"]`);
    assert.equal(m.$('#nego-ready'), null);
  });
});

describe('the stylesheet survives a repaint', () => {
  /* The tab shipped unstyled after any repaint. The <style> block lived INSIDE
     the host element and a one-shot flag stopped it being written twice, so the
     first render was styled and every render after it — switching to Docs and
     back, deciding a change, any renderWorkspace() call — replaced innerHTML and
     threw the stylesheet away. It lives in <head> now.

     The old tests all read the stylesheet immediately after the FIRST render,
     which is exactly the one case that worked. These re-render first. */
  test('it is still there after a second render', async () => {
    const m = await mounted();
    assert.ok(m.doc.getElementById('nego-style'), 'first render');
    m.win.renderNegotiationTab(m.c, { hostId: 'nego-tab', side: 'owner', by: 'Wanjiru Kamau' });
    assert.ok(m.doc.getElementById('nego-style'),
      'a repaint must not take the stylesheet with it');
  });

  test('it is still there after a decision re-renders the tab', async () => {
    const m = await mounted();
    m.click(`[data-nego-accept="${m.filed[0].id}"]`);
    assert.ok(m.doc.getElementById('nego-style'), 'after accept');
    await m.reject(m.filed[1].id);
    assert.ok(m.doc.getElementById('nego-style'), 'after reject');
    m.click(`[data-nego-discuss="${m.filed[2].id}"]`);
    assert.ok(m.doc.getElementById('nego-style'), 'after opening a thread');
  });

  test('it lives in <head>, out of reach of the host being rebuilt', async () => {
    const m = await mounted();
    const style = m.doc.getElementById('nego-style');
    assert.ok(m.doc.head.contains(style),
      'inside the host it would be destroyed by the next innerHTML assignment');
    // and the host really is rebuilt wholesale on every render
    m.host().innerHTML = '';
    assert.ok(m.doc.getElementById('nego-style'), 'emptying the host leaves it standing');
  });

  test('re-adding is a no-op — never two copies', async () => {
    const m = await mounted();
    for (let i = 0; i < 4; i++) m.win.negoEnsureStyle();
    m.win.renderNegotiationTab(m.c, { hostId: 'nego-tab', side: 'owner' });
    assert.equal(m.$$('#nego-style').length, 1, 'exactly one stylesheet');
  });

  test('the markup carries no <style> of its own any more', async () => {
    const m = await mounted();
    assert.ok(!/<style/i.test(m.html()),
      'a stylesheet inside the host is the bug this test exists for');
  });
});

describe('the tab is built on HaTi\'s design system, not the prototype\'s tokens', () => {
  test('the stylesheet uses HaTi tokens, not the prototype\'s bespoke ramp', async () => {
    const m = await mounted();
    const css = m.doc.getElementById('nego-style').textContent;
    assert.match(css, /var\(--color-accent-800\)/, 'HaTi\'s slate');
    assert.match(css, /var\(--font-doc\)/, 'HaTi\'s document typeface');
    assert.match(css, /var\(--color-bg\)/, 'HaTi\'s warm canvas');
    assert.ok(!/#33475c/.test(css), 'the prototype\'s --slate must not be hard-coded');
    assert.ok(!/Georgia/.test(css), 'the prototype\'s serif must not override --font-doc');
    assert.ok(!/#f2f4f7/.test(css), 'the prototype\'s cool canvas must not override --color-bg');
  });

  test('the insertion green matches diffHtml, so the two redlines cannot drift', async () => {
    const m = await mounted();
    const css = m.doc.getElementById('nego-style').textContent;
    const compare = m.win.diffHtml('a thirty b', 'a forty-five b');
    assert.match(css, /\.nego-ins\{background:#d9eae0;color:#1e6b4d/);
    assert.match(compare, /#d9eae0/);
    assert.match(compare, /#1e6b4d/);
    assert.match(css, /\.nego-del\{background:#f1dcd8;color:#8f322b/);
    assert.match(compare, /#8f322b/);
  });

  test('reduced motion is honoured', async () => {
    const m = await mounted();
    const css = m.doc.getElementById('nego-style').textContent;
    assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
    assert.match(css, /animation:none/);
  });

  /* These four are rule-level assertions, and deliberately so: jsdom has no
     layout engine, so getBoundingClientRect is all zeros and nothing here can
     measure a pixel. Each rule below was verified for real in Chromium against
     the app's own tokens (see BUGLOG U-002/U-003) — what these tests do is stop
     the rule being deleted again. */
  test('the working pane reserves a gutter, so a margin-anchored badge is not clipped', async () => {
    const m = await mounted();
    const css = m.doc.getElementById('nego-style').textContent;
    assert.match(css, /\.nego-pane\.working \.nego-doc\{padding-left:100px\}/,
      'without the gutter the badge lands outside the pane and reads as "G-001"');
    // and below the gutter's worth of width it stops being margin-anchored
    assert.match(css, /@media \(max-width:900px\)\{[\s\S]*?\.nego-badge\{position:static/);
  });

  test('the grid may shrink below its content, so the index cannot be pushed off-screen', async () => {
    const m = await mounted();
    const css = m.doc.getElementById('nego-style').textContent;
    assert.match(css, /\.nego-work\{flex:1;min-height:0;min-width:0;display:grid/,
      'a grid holding a document will not shrink without min-width:0');
  });

  test('the root fills its flex parent rather than sizing to its content', async () => {
    const m = await mounted();
    const root = m.doc.getElementById('nego-root');
    assert.match(root.getAttribute('style'), /flex:1/);
    assert.match(root.getAttribute('style'), /width:100%/);
    assert.match(root.getAttribute('style'), /min-width:0/);
  });

  test('the responsive rules drop the baseline pane before the index', async () => {
    const m = await mounted();
    const css = m.doc.getElementById('nego-style').textContent;
    assert.match(css, /@media \(max-width:1120px\)\{[^}]*\}\s*\.nego-pane\.baseline\{display:none\}/);
    assert.match(css, /@media \(max-width:760px\)/);
    assert.match(css, /\.nego-pane\.index\.open\{transform:translateX\(0\)\}/);
  });
});

describe('a rich contract negotiates without losing its formatting', () => {
  test('accepting a change through the tab keeps headings and clause numbering', async () => {
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    const c = supplyContract();
    win.negoInit(c);
    const proposed = win.negoBaseText(c)
      .replace('thirty (30) days of a valid invoice', 'forty-five (45) days of a valid invoice');
    const filed = await win.negoFileProposal(c, proposed,
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.renderNegotiationTab(c, { hostId: 'nego-tab', side: 'owner', by: 'Wanjiru Kamau' });
    win.document.querySelector(`[data-nego-accept="${filed[0].id}"]`).click();

    assert.equal(win.docFormat(c.format), 'rich');
    assert.match(c.redlineText, /<h1>RAW MATERIAL SUPPLY AGREEMENT<\/h1>/);
    assert.match(c.redlineText, /<ol start="5">/);
    assert.match(win.docPlainText(c), /forty-five \(45\) days of a valid invoice/);
  });
});
