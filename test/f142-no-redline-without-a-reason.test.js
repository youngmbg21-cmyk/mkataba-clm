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

   WHERE THE RULE LIVES. At the authoring paths, not at negoFileChange. The
   funnel is also where a returned Word file, a pasted redraft and the other
   side's own proposals are split into changes, and none of those has an author
   present to be asked; refusing there would destroy those rounds rather than
   improve them. So every route a HUMAN types a redline through asks the
   question and will not file without an answer, and the funnel records what
   they gave. A change that arrives without one is legacy, inbound or
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

describe('f142 — the owner cannot file a redline with no reason', () => {
  test('the edit bar asks the question, and Save is refused until it is answered', async () => {
    const p = page('owner');
    const e = openEditor(p, /PAYMENT/, '<p>Payment shall be made within sixty (60) days of invoice.</p>');
    assert.ok(e.why, 'the reason field is on the bar, not hidden behind a second dialog');
    assert.equal(e.save.disabled, true, 'a change with no reason cannot be saved');
    e.save.click();
    await new Promise(r => setTimeout(r, 20));
    assert.equal(p.changes().length, 0, 'and pressing it anyway files nothing');
  });

  test('with a reason typed, it files — and the reason is on the record', async () => {
    const p = page('owner');
    const e = openEditor(p, /PAYMENT/, '<p>Payment shall be made within sixty (60) days of invoice.</p>');
    typeReason(p.win, e.why, 'Our cash cycle cannot support Net-30 on this volume.');
    assert.equal(e.save.disabled, false, 'answering the question unlocks the save');
    e.save.click();
    await new Promise(r => setTimeout(r, 25));
    const chs = p.changes();
    assert.equal(chs.length, 1);
    assert.equal(chs[0].rationale, 'Our cash cycle cannot support Net-30 on this volume.');
  });

  test('whitespace is not an answer', async () => {
    const p = page('owner');
    const e = openEditor(p, /PAYMENT/, '<p>Payment within sixty (60) days.</p>');
    typeReason(p.win, e.why, '    ');
    assert.equal(e.save.disabled, true, 'a box of spaces is a refusal to give a reason');
  });
});

describe('f142 — the counterparty is held to exactly the same rule', () => {
  /* Mounted the way the portal mounts it — redlineEmbed with side:'counterparty'
     — because that IS the counterparty's workbench. One bar, both chairs: a
     rule binding only one side would be the asymmetry they already suspect. */
  test('their edit bar carries the reason field and gates the save too', async () => {
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    const c = { id: 'MK-403', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
      template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      redlineText: BODY, format: 'rich' };
    win.negoInit(c);
    win.getContract = id => (id === c.id ? c : null);
    const host = win.document.getElementById('content');
    win.redlineEmbed(host, c, { side: 'counterparty', by: 'Erik Lindqvist',
      author: 'Erik Lindqvist', persist: false, org: 'Nordkust Industri AB' });
    const cl = [...win.document.querySelectorAll('#rl-doc .rl-clause')]
      .find(x => /TERMINATION/.test(x.textContent));
    assert.ok(cl, 'their workbench shows the clauses');
    cl.querySelector('[data-nego-edit]').click();
    const box = cl.querySelector('[data-nego-editor]');
    assert.ok(box, 'Direct Edit is their counter-proposal route');
    box.innerHTML = '<p>Either party may terminate on ninety (90) days notice.</p>';
    const why = cl.querySelector('[data-nego-why]');
    const save = cl.querySelector('[data-nego-save]');
    assert.ok(why, 'the counterparty is asked the same question');
    assert.equal(save.disabled, true, 'and is refused the same way until they answer');
    typeReason(win, why, 'Ninety days matches our own supply commitments.');
    assert.equal(save.disabled, false);
    save.click();
    await new Promise(r => setTimeout(r, 25));
    const chs = win.negoChanges(c);
    assert.equal(chs.length, 1);
    assert.equal(chs[0].authorSide, 'counterparty');
    assert.equal(chs[0].rationale, 'Ninety days matches our own supply commitments.');
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
