/* ============================================================
   F181 — Ready to sign gets a second door, and only a door
   ============================================================
   Asked for on 12 Aug 2026: put Ready to sign beside Compare wording, at the
   top of the counterparty's page, where the reader is already looking. The
   strip's own Ready to sign stays exactly where it is — f180 is the file that
   explains what removing a deal verb from this page costs, and it is only a
   year old.

   So there are now TWO doors onto one act, and this file pins the three ways
   that goes wrong:

     · A SECOND PATH. If the header button called portalRespond itself, there
       would be two senders to keep in step, and the day one of them learned
       something the other did not, a reader would get a different answer
       depending on which button they happened to press. It forwards to
       #pt-nego-ready and does nothing else — the card Send's shape.
     · A SECOND OPINION. The strip's button is gated on negoAlignment: a
       reader with a refused ask still on the table is NOT ready, and the gate
       exists to stop them telling the other side otherwise. A header button
       that recomputed that gate would be a copy free to disagree. It mirrors.
     · A DOOR ONTO NOTHING. On a read-only, superseded or already-answered
       link the strip draws no readiness verb at all. The header must not draw
       one either — a button that always fails is worse than no button
       (portalCanDerive's own rule).

   And the pixel claim f180 taught: .ui-btn sets display:inline-flex, which
   beats the browser's [hidden], so "hidden" here is asserted the way the page
   would actually lose it — through getComputedStyle, not the attribute. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor } = require('./portalworld');

const BASE = [
  'WAREHOUSING AND LOGISTICS SERVICES AGREEMENT',
  '1. SCOPE',
  '1. The Provider shall receive, store, handle and dispatch the goods.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. TERMINATION',
  '3. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function ownerContract(over = {}){
  return { id: 'MK-181', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

function recordStage(){
  const p = buildPortal();
  p.win.promptDialog = async () => '';
  p.win.persist = () => {};
  p.win.saveContract = () => {};
  p.win.renderWorkspace = () => {};
  p.win.setView = () => {};
  return p.win;
}

/* Wanjiru has asked for ninety days' notice; Erik has not answered yet. */
async function ownerProposed(){
  const win = recordStage();
  const c = ownerContract();
  win.negoInit(c);
  const filed = await win.negoFileProposal(c,
    BASE.replace('sixty (60) days', 'ninety (90) days'),
    { side: 'owner', author: 'Wanjiru Kamau' });
  return { win, c, filed };
}

function counterpartyView(c, opts){
  const p = buildPortal();
  const payload = sharePayloadFor(p, { ...c });
  p.open(payload, opts);
  const $ = sel => p.win.document.querySelector(sel);
  return { p, payload, $,
    top: () => $('#pt-ready-top'),
    real: () => $('#pt-nego-ready'),
    /* The page loses a button to CSS, not to the attribute — see the header
       note. This is the question a reader's eye asks. */
    shown: el => !!el && p.win.getComputedStyle(el).display !== 'none',
    async press(el){
      el.dispatchEvent(new p.win.Event('click', { bubbles: true }));
      for (let round = 0; round < 3; round++){
        for (let i = 0; i < 20; i++) await Promise.resolve();
        await new Promise(r => setImmediate(r));
      }
    },
  };
}

/* Erik answers everything Wanjiru asked, which is what opens the gate. */
async function acceptEvery(v, filed){
  for (const ch of filed){
    const btn = v.$(`[data-nego-accept="${ch.id}"]`);
    if (btn) await v.press(btn);
  }
}

describe('F181 — the header carries Ready to sign, beside Compare wording', () => {
  test('it is there, it is visible, and it sits in the reading row', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    const top = v.top();
    assert.ok(top, 'the header offers Ready to sign');
    assert.ok(v.shown(top), 'and it is visible pixels, not markup only');
    assert.match(top.textContent, /Ready to sign/);
    /* "Next to Compare wording" is the request, so the row is the assertion —
       not merely "somewhere on the page". */
    const row = top.closest('.pw-id-read');
    assert.ok(row, 'it joins the reading row rather than floating in the header');
    assert.ok(row.querySelector('#pt-compare'),
      'and Compare wording is its neighbour, which is what was asked for');
  });

  test('the focus button is gone from that row, and from the page', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    assert.equal(v.$('#pt-focus'), null, 'the focus toggle is removed');
    assert.equal(v.$('.pt-focus-btn'), null, 'and nothing else wears its class');
  });

  test('the strip keeps its own Ready to sign — f180 stays true', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    assert.ok(v.shown(v.real()), 'the strip\'s verb is untouched and still visible');
    assert.ok(v.shown(v.$('#pt-nego-decline')), 'Decline with it');
  });
});

describe('F181 — the header button is a mirror, never a second opinion', () => {
  test('it is shut while the strip\'s is shut, and says the same why', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    assert.equal(v.real().disabled, true, 'nothing is answered, so nobody is ready');
    assert.equal(v.top().disabled, true,
      'a live door onto a refusal is the untruth the gate exists to prevent');
    assert.equal(v.top().title, v.real().title,
      'and it explains itself in the strip\'s own words, not a second copy');
  });

  test('answering opens BOTH doors together', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    await acceptEvery(v, o.filed);
    assert.equal(v.real().disabled, false, 'the gate is open');
    assert.equal(v.top().disabled, false, 'and the header followed it');
  });

  test('a read-only link draws no header door, because there is nothing to press',
    async () => {
      const o = await ownerProposed();
      const v = counterpartyView(o.c, { superseded: { at: '2026-08-01T09:00:00Z' } });
      assert.equal(v.real(), null, 'a superseded copy has no readiness verb');
      assert.equal(v.shown(v.top()), false,
        'so the header must not offer one — a button that always fails is worse than none');
    });
});

describe('F181 — one act, whichever door is used', () => {
  test('pressing the header sends the readiness ONCE, down the existing route', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    await acceptEvery(v, o.filed);
    v.p.setValue('nego-cp-name', 'Erik Lindqvist');
    await v.press(v.top());

    assert.equal(v.p.log.sent.length, 1,
      'ONE call — a second path would have posted twice or posted differently');
    assert.match(v.p.log.sent[0].pathname, /respond$/, 'the route the strip already used');
    const r = v.p.lastSent();
    assert.equal(r.action, 'ready');
    assert.equal(r.name, 'Erik Lindqvist');
    /* The whole reason readiness and decisions travel together (see core.js's
       'ready' branch): pressing the new door must not lose the answers. */
    assert.equal(r.negoDecisions.length, o.filed.length,
      'the held decisions rode along, exactly as they do from the strip');
    assert.ok(r.negoDecisions.every(d => d.status === 'accepted'));
  });

  test('and the strip reports the send, because the strip is what was pressed', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    await acceptEvery(v, o.filed);
    v.p.setValue('nego-cp-name', 'Erik Lindqvist');
    await v.press(v.top());
    assert.match(v.real().textContent, /Sent|Readiness sent/,
      'one act, reported in one place rather than two that can disagree');
    assert.equal(v.top().disabled, true, 'and the header door is spent with it');
  });
});
