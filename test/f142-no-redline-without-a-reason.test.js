/* ============================================================
   f142 — no redline crosses the table without a reason, from either chair
   ============================================================
   A redline said WHAT should change and was never made to say WHY. So the
   other side received "liability capped at EUR 250,000" with nothing to answer
   but yes or no, and the argument lived in an email thread — the fragmentation
   this product exists to end.

   The AI paths made it worse rather than better. A Copilot-applied change wrote
   its own note, "Copilot — Shorten & Simplify", which records the TOOL and not
   the argument — and that note is walled out of the share payload (f141), so
   what actually reached the counterparty was wording with no reason at all.

   WHERE THE RULE LIVES: AT THE POSTBOX, NOT AT THE KEYSTROKE. The question is
   asked when the ROUND IS SENT, and refused there, for three reasons that are
   the whole design:

     · drafting five clauses in a row must not be interrupted five times — an
       author blocked mid-flow types "commercial" to get past it, and a full
       stop is a WORSE record than no reason at all, because it looks like data;
     · at the postbox the reasons are read as a LIST, and a thin one is obvious
       beside its neighbours in a way no single dialog can reveal;
     · it is already the screen where the sender composes what to tell them.

   Nothing escapes in the meantime: unsent asks never travel (holdUnsent in
   buildSharePayload), so a reasonless draft cannot reach anybody. Only UNSENT
   asks are gated — a change delivered in an earlier round is with them already,
   and a rule invented today must not lock a contract negotiated before it
   existed. A change that arrives without one is legacy, inbound or
   machine-split, and its card says so out loud rather than omitting the row and
   implying no reason was needed.

   AND IT TRAVELS. `note` is the author's internal aside and ours stays home;
   `rationale` is written for the other side and goes both ways. A required
   field the other side never sees would be a form with no reader. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');

const BODY = [
  '<h2>1. PAYMENT</h2><p>Payment shall be made within thirty (30) days of invoice.</p>',
  '<h2>2. TERMINATION</h2><p>Either party may terminate on sixty (60) days notice.</p>',
].join('');

function page(side = 'owner') {
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  const c = { id: 'MK-400', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: BODY, format: 'rich' };
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.NEGO_SIDE = side;
  win.renderRedline();
  const doc = win.document;
  return { win, c, doc,
    clause(re) { return [...doc.querySelectorAll('#rl-doc .rl-clause')].find(x => re.test(x.textContent)); },
    changes: () => win.negoChanges(c) };
}

/* Open the inline editor on a clause and swap its body — the path a person's
   click takes. Returns the live controls so a test can drive them. */
function openEditor(p, re, html) {
  const cl = p.clause(re);
  assert.ok(cl, 'the clause must be on the page');
  cl.querySelector('[data-nego-edit]').click();
  const box = cl.querySelector('[data-nego-editor]');
  assert.ok(box, 'the inline editor opens on the clause');
  box.innerHTML = html;
  return { cl, box,
    why: cl.querySelector('[data-nego-why]'),
    save: cl.querySelector('[data-nego-save]') };
}
const typeReason = (win, el, v) => {
  el.value = v;
  el.dispatchEvent(new win.Event('input', { bubbles: true }));
};

describe('f142 — drafting is not interrupted, but the round is held', () => {
  test('the edit bar offers the question without blocking the save', async () => {
    const p = page('owner');
    const e = openEditor(p, /PAYMENT/, '<p>Payment shall be made within sixty (60) days of invoice.</p>');
    assert.ok(e.why, 'the fast path is there for anyone who wants it');
    assert.equal(e.save.disabled, false,
      'blocking here is what buys "commercial" — the question is asked at the postbox');
    e.save.click();
    await new Promise(r => setTimeout(r, 25));
    assert.equal(p.changes().length, 1, 'the draft is filed');
    assert.equal(p.changes()[0].rationale, null, 'and is honest that no reason is on it yet');
  });

  test('a reason typed while the wording is fresh is kept', async () => {
    const p = page('owner');
    const e = openEditor(p, /PAYMENT/, '<p>Payment shall be made within sixty (60) days of invoice.</p>');
    typeReason(p.win, e.why, 'Our cash cycle cannot support Net-30 on this volume.');
    e.save.click();
    await new Promise(r => setTimeout(r, 25));
    assert.equal(p.changes()[0].rationale, 'Our cash cycle cannot support Net-30 on this volume.');
  });

  test('the round names exactly which asks are still unexplained', async () => {
    const p = page('owner');
    const a = openEditor(p, /PAYMENT/, '<p>Payment within sixty (60) days.</p>');
    typeReason(p.win, a.why, 'Our cash cycle cannot support Net-30.');
    a.save.click();
    await new Promise(r => setTimeout(r, 25));
    const b = openEditor(p, /TERMINATION/, '<p>Either party may terminate on ninety (90) days notice.</p>');
    b.save.click();
    await new Promise(r => setTimeout(r, 25));

    const missing = p.win.negoAsksMissingReason(p.c, 'owner');
    assert.equal(missing.length, 1, 'one of the two is unexplained');
    assert.equal(missing[0].clauseId, p.clause(/TERMINATION/).getAttribute('data-clause'));
  });

  test('an ask already sent in an earlier round is not re-gated', () => {
    /* A rule invented today must not lock a contract negotiated before it. */
    const p = page('owner');
    p.c.changes = [{ id: 'CHG-OLD', clauseId: 'c1', status: 'pending', authorSide: 'owner',
      createdAt: '2026-01-01T00:00:00.000Z', summary: 'from an earlier round' }];
    p.c.negotiation = Object.assign({}, p.c.negotiation, { turnAt: '2026-06-01T00:00:00.000Z' });
    assert.equal(p.win.negoAsksMissingReason(p.c, 'owner').length, 0,
      'it is already with them — the reason cannot be added retrospectively');
  });
});

describe('f142 — the counterparty is held to exactly the same rule', () => {
  /* Mounted the way the portal mounts it — redlineEmbed with side:'counterparty'
     — because that IS their workbench. One bar, both chairs; and their postbox
     refuses on the same terms the owner's does. */
  test('their edit bar offers the field, and files without blocking', async () => {
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    const c = { id: 'MK-403', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
      template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      redlineText: BODY, format: 'rich' };
    win.negoInit(c);
    win.getContract = id => (id === c.id ? c : null);
    win.redlineEmbed(win.document.getElementById('content'), c,
      { side: 'counterparty', by: 'Erik Lindqvist', author: 'Erik Lindqvist',
        persist: false, org: 'Nordkust Industri AB' });
    const cl = [...win.document.querySelectorAll('#rl-doc .rl-clause')]
      .find(x => /TERMINATION/.test(x.textContent));
    cl.querySelector('[data-nego-edit]').click();
    cl.querySelector('[data-nego-editor]').innerHTML =
      '<p>Either party may terminate on ninety (90) days notice.</p>';
    const why = cl.querySelector('[data-nego-why]');
    const save = cl.querySelector('[data-nego-save]');
    assert.ok(why, 'the counterparty is asked the same question');
    assert.equal(save.disabled, false, 'and is interrupted no more than the owner is');
    typeReason(win, why, 'Ninety days matches our own supply commitments.');
    save.click();
    await new Promise(r => setTimeout(r, 25));
    const chs = win.negoChanges(c);
    assert.equal(chs.length, 1);
    assert.equal(chs[0].authorSide, 'counterparty');
    assert.equal(chs[0].rationale, 'Ninety days matches our own supply commitments.');
  });

  test('their unexplained asks are counted by the same helper the owner uses', () => {
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    const c = { id: 'MK-404', name: 'S', counterparty: 'Nordkust', template: 'RM',
      status: 'Under Review', folder: 'proc', fields: {}, metadata: {}, audit: [],
      rounds: [], versions: [], signatures: [], comments: [], redlineText: BODY, format: 'rich' };
    win.negoInit(c);
    c.changes = [
      { id: 'CHG-1', clauseId: 'c1', status: 'pending', authorSide: 'counterparty',
        createdAt: '2026-08-02T12:00:00.000Z', rationale: 'Our insurers require it.' },
      { id: 'CHG-2', clauseId: 'c2', status: 'pending', authorSide: 'counterparty',
        createdAt: '2026-08-02T12:01:00.000Z' },
    ];
    c.negotiation = Object.assign({}, c.negotiation, { turnAt: '2026-08-02T11:00:00.000Z' });
    const missing = win.negoAsksMissingReason(c, 'counterparty');
    assert.equal(missing.length, 1, 'one rule, both chairs');
    assert.equal(missing[0].id, 'CHG-2');
  });
});

describe('f142 — the reason travels, in both directions', () => {
  const contractWith = ch => ({ id: 'MK-401', name: 'Supply Agreement',
    counterparty: 'Nordkust Industri AB', template: 'RM', status: 'Under Review', folder: 'proc',
    fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
    format: 'text', redlineText: 'Clause 1\n\nPayable within thirty (30) days.', changes: [ch] });
  const base = { id: 'CHG-001', clauseId: 'c1', clauseLabel: 'Clause 1', changeType: 'modify',
    type: 'modify', status: 'pending', oldText: 'Payable within thirty (30) days.',
    newText: 'Payable within sixty (60) days.', summary: 'Payment terms extended' };

  test('OUR reason reaches them — unlike our internal note, which does not', () => {
    const p = buildPortal();
    const out = sharePayloadFor(p, contractWith({ ...base, authorSide: 'owner',
      author: 'Young Mbagaya', rationale: 'Our cash cycle cannot support Net-30.',
      note: 'Copilot — Shorten & Simplify' })).contract.changes;
    assert.equal(out[0].rationale, 'Our cash cycle cannot support Net-30.',
      'a required reason the other side never saw would be a form with no reader');
    assert.equal(out[0].note, null, 'the internal aside still stays home');
  });

  test('and THEIR reason comes back to them intact', () => {
    const p = buildPortal();
    const out = sharePayloadFor(p, contractWith({ ...base, authorSide: 'counterparty',
      author: 'Erik Lindqvist', rationale: 'Our insurers cannot accept an uncapped indemnity.' }))
      .contract.changes;
    assert.equal(out[0].rationale, 'Our insurers cannot accept an uncapped indemnity.');
  });

  test('a change with no reason says so, rather than leaving the row out', () => {
    const p = buildPortal();
    const payload = sharePayloadFor(p, contractWith({ ...base, authorSide: 'owner',
      author: 'Young Mbagaya' }));
    assert.equal(payload.contract.changes[0].rationale, null);
    payload.purpose = 'negotiate'; payload.purposeChosen = 'negotiate';
    p.win.renderSharePortal(payload, { token: 't', share: { recipientName: 'Erik' } });
    assert.match(p.win.document.body.innerHTML, /No reason was recorded/,
      'omitting the row would read as "no reason was needed"');
  });
});

describe('f142 — the paths with nobody to ask are not broken by the rule', () => {
  test('a returned Word file still files its wording, reason recorded as absent', async () => {
    /* negoFileProposal is the returned-.docx and pasted-redraft route: one blob
       authored in the other side's word processor, split into changes here.
       Refusing it for want of a rationale would destroy the round. */
    const { win } = buildWorld({ negotiationView: true });
    const c = { id: 'MK-402', name: 'Supply Agreement', counterparty: 'Nordkust',
      template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      redlineText: BODY, format: 'rich' };
    win.negoInit(c);
    const filed = await win.negoFileProposal(c,
      '1. PAYMENT\nPayment shall be made within forty-five (45) days of invoice.\n'
      + '2. TERMINATION\nEither party may terminate on sixty (60) days notice.',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.ok(filed.length >= 1, 'their returned document still lands');
    assert.equal(filed[0].rationale, null, 'and is honest that no reason came with it');
  });
});

describe('f142 — the owner\'s postbox refuses the round', () => {
  /* The real Share dialog, opened on a contract with an unexplained ask. */
  async function shareOn(changes, purpose) {
    const p = buildPortal({ url: 'http://localhost/hati/' });
    const win = p.win;
    const toasts = [];
    const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
    win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
    win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
    win.API_MODE = () => false;
    win.persist = () => {}; win.renderAuditSection = () => {};
    win.renderSharesSection = () => {}; win.refreshShareOverview = () => {};
    win.toast = (m, k) => toasts.push(String(m));
    const c = { id: 'MK-410', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
      template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      value: 1, valueType: 'estimated', format: 'text',
      redlineText: 'Clause 1\n\nPayable within thirty (30) days.', changes };
    win.negoInit(c);
    c.negotiation = Object.assign({}, c.negotiation, { turnAt: null });
    await win.openShareModal(c, purpose ? { purpose } : {});
    const root = win.document.getElementById('modal-root');
    return { win, c, root, toasts, $: sel => root.querySelector(sel),
      next() { root.querySelector('#share-next').dispatchEvent(new win.Event('click', { bubbles: true })); },
      onSendForm() { return !root.querySelector('#share-step-2').className.includes('hidden'); } };
  }
  const ask = (over = {}) => ({ id: 'CHG-001', clauseId: 'c1', clauseLabel: 'Clause 1',
    changeType: 'modify', status: 'pending', authorSide: 'owner', author: 'Wanjiru Kamau',
    createdAt: '2026-08-02T12:00:00.000Z', oldText: 'a', newText: 'b',
    summary: 'Payment terms extended', ...over });

  test('the unexplained asks are listed, each with its own box', async () => {
    const m = await shareOn([ask(), ask({ id: 'CHG-002', clauseId: 'c2', summary: 'Liability capped' })],
      'negotiate');
    assert.ok(m.$('#share-reasons'), 'the round shows what still needs explaining');
    assert.ok(m.$('[data-share-why="CHG-001"]'), 'and one box per change, seen together');
    assert.ok(m.$('[data-share-why="CHG-002"]'),
      'which is what makes a thin reason obvious beside its neighbours');
  });

  test('Next is refused while an ask is unexplained, and names it', async () => {
    const m = await shareOn([ask()], 'negotiate');
    m.next();
    assert.equal(m.onSendForm(), false, 'the round does not reach the send form');
    assert.match(m.toasts.join(' | '), /CHG-001/, 'named, not "some changes"');
  });

  test('filling the box lets the round through, and writes it onto the record', async () => {
    const m = await shareOn([ask()], 'negotiate');
    m.$('[data-share-why="CHG-001"]').value = 'Our cash cycle cannot support Net-30.';
    m.next();
    assert.equal(m.onSendForm(), true, 'answered, so it goes on');
    assert.equal(m.c.changes[0].rationale, 'Our cash cycle cannot support Net-30.',
      'written as the sender types, so a dialog closed half-finished loses nothing');
  });

  test('a signing link is not gated — it delivers no new ask', async () => {
    const m = await shareOn([ask()], 'sign');
    m.next();
    assert.equal(m.onSendForm(), true);
  });

  test('a contract with nothing unexplained shows no panel at all', async () => {
    const m = await shareOn([ask({ rationale: 'Our cash cycle cannot support Net-30.' })], 'negotiate');
    assert.equal(m.$('#share-reasons'), null, 'nothing to nag about');
    m.next();
    assert.equal(m.onSendForm(), true);
  });

  test('the one-click "send updated version" refuses too, and points at the door', async () => {
    /* That path has no dialog, so it cannot collect a reason — it must not
       quietly deliver unexplained asks instead. */
    const m = await shareOn([ask()], 'negotiate');
    m.win.API_MODE = () => true;
    m.win.contractShares = async () => [{ token: 't', recipientEmail: 'e@x.se', durable: true }];
    await assert.rejects(
      () => m.win.reshareToLastRecipient(m.c, { purpose: 'negotiate' }),
      /CHG-001[\s\S]*Share|Share[\s\S]*CHG-001/);
  });
});

describe('f142 — the counterparty\'s postbox refuses on the same terms', () => {
  /* Their real page and their real Send, with the ask made through their own
     Direct Edit — the only route they have. A rule that bound only our side
     would be precisely the asymmetry they already suspect the portal of. */
  function theirPage() {
    const p = buildPortal();
    const sent = [], toasts = [];
    p.win.toast = m => toasts.push(String(m));
    p.win.api = async (path, method, body) => {
      if (/\/respond$/.test(String(path))) { sent.push(body); return { ok: true }; }
      return {};
    };
    const c = { id: 'MK-411', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
      template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      format: 'rich', redlineText: BODY };
    const payload = sharePayloadFor(p, c);
    payload.purpose = 'negotiate'; payload.purposeChosen = 'negotiate';
    p.win.renderSharePortal(payload, { token: 't', share: { recipientName: 'Erik Lindqvist' } });
    const d = p.win.document;
    return { p, win: p.win, d, sent, toasts, payload,
      /* Their counter-proposal, typed the way they type it. */
      async propose(re, html, why) {
        const cl = [...d.querySelectorAll('#pt-nego .rl-clause')].find(x => re.test(x.textContent));
        assert.ok(cl, 'their workbench shows the clause');
        cl.querySelector('[data-nego-edit]').click();
        cl.querySelector('[data-nego-editor]').innerHTML = html;
        if (why != null) typeReason(p.win, cl.querySelector('[data-nego-why]'), why);
        cl.querySelector('[data-nego-save]').click();
        await new Promise(r => setTimeout(r, 30));
      },
      async send() {
        const n = d.getElementById('nego-cp-name');
        if (n) n.value = 'Erik Lindqvist';
        await p.win.portalRespond(payload, 'decisions', { comment: '' });
        await new Promise(r => setTimeout(r, 20));
      } };
  }

  test('an unexplained ask stops their round, and says so', async () => {
    const v = theirPage();
    await v.propose(/TERMINATION/, '<p>Either party may terminate on ninety (90) days notice.</p>');
    await v.send();
    assert.equal(v.sent.length, 0, 'nothing left their browser');
    assert.match(v.toasts.join(' | '), /needs? a reason/i);
  });

  test('their held work survives the refusal', async () => {
    const v = theirPage();
    await v.propose(/TERMINATION/, '<p>Either party may terminate on ninety (90) days notice.</p>');
    await v.send();
    await v.send();
    assert.equal(v.sent.length, 0,
      'a refusal that discarded the round would be far worse than the gap it closes');
    assert.match(v.toasts.join(' | '), /needs? a reason/i);
  });

  test('with a reason on it, the round goes — and the reason travels', async () => {
    const v = theirPage();
    await v.propose(/TERMINATION/, '<p>Either party may terminate on ninety (90) days notice.</p>',
      'Ninety days matches our own supply commitments.');
    await v.send();
    assert.equal(v.sent.length, 1, 'answered, so it sends');
    const out = v.sent[0].negoProposed || [];
    assert.equal(out.length, 1);
    assert.equal(out[0].rationale, 'Ninety days matches our own supply commitments.',
      'the reason reaches the owner, or the field had no reader');
  });
});
