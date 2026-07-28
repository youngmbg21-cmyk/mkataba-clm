/* ============================================================
   F77 — ask who, once, and then sending is just sending
   ============================================================
   The two sides did the same act by completely different means. The
   counterparty files an answer and a postbox appears under it: press, gone.
   The owner files a change and gets a button that opens a DIALOG — recipient,
   channel, expiry, a message, a summary to approve — because the address has
   always been collected at send time.

   That is the whole difference. Collect it once, at the start, and the owner's
   send becomes what the counterparty's already is.

   Three things this must get right.

   IT ASKS WITHOUT BLOCKING. A modal that fires on opening the negotiation is in
   the way of somebody who only wanted to look, and "skip" is a button you have
   to press to dismiss something you never asked for. It is a strip at the top
   of the room: ignore it and it waits, fill it in and it goes.

   SKIPPING MUST NOT REBUILD THE DEAD END. Ignore the strip, propose a change,
   and the send still appears — it just asks for the address at that moment
   instead of sending. The one thing that must never happen again is work with
   nowhere to go.

   AND THE FULL DIALOG DOES NOT DISAPPEAR. Purpose, expiry, channel and a
   covering message still matter — a signing link is not a negotiation link —
   so the strip carries a way through to all of it.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-770', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}

async function room(opts = {}, over = {}){
  const { win } = buildWorld({ negotiationView: true, contractView: true });
  const c = contract(over);
  win.negoInit(c);
  const calls = { setContact: [], direct: 0, dialog: 0 };
  const propose = async num => {
    const cl = win.negoClauseList(c).find(x => x.num === num);
    return win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[num].text}</p>`,
      { side: 'owner', author: 'Wanjiru Kamau', summary: F.PROTO_ASKS[num].summary });
  };
  const paint = () => {
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false,
      onSetCounterparty: x => calls.setContact.push(x),
      onSendDirect: () => { calls.direct++; },
      onShareLink: () => { calls.dialog++; },
      ...opts });
    const host = win.document.querySelector('#nego-room') || win.document;
    return {
      strip: host.querySelector('[id="nego-cp-setup"]'),
      send: host.querySelector('[id="nego-send"]'),
      more: host.querySelector('[id="nego-cp-more"]'),
      host,
    };
  };
  const press = el => el.dispatchEvent(new win.Event('click', { bubbles: true }));
  return { win, c, calls, propose, paint, press };
}

describe('F77 — asking who, once', () => {
  test('the strip appears when we have no address for them', async () => {
    const r = await room();
    const p = r.paint();
    assert.ok(p.strip, 'the owner is about to negotiate with somebody we cannot reach');
    assert.match(p.strip.textContent, /Nordfrakt Logistik AB/,
      'and it already knows who — only the address is missing');
  });

  test('ignoring it is enough — nothing has to be dismissed', async () => {
    const r = await room();
    const p = r.paint();
    assert.ok(!p.host.querySelector('[data-nego-modal]'),
      'a strip waits; a dialog would be standing in the way of somebody who only wanted to read');
  });

  test('filling it in records the contact and the strip goes', async () => {
    const r = await room();
    let p = r.paint();
    p.host.querySelector('[id="nego-cp-email"]').value = 'erik@nordfrakt.se';
    r.press(p.host.querySelector('[id="nego-cp-save"]'));
    assert.equal(r.calls.setContact.length, 1);
    assert.equal(r.calls.setContact[0].email, 'erik@nordfrakt.se');
  });

  test('once we know it, the strip is gone', async () => {
    const r = await room({ contact: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } });
    assert.ok(!r.paint().strip, 'asked once, not on every visit');
  });

  test('a bad address is refused rather than saved', async () => {
    const r = await room();
    const p = r.paint();
    p.host.querySelector('[id="nego-cp-email"]').value = 'not-an-address';
    r.press(p.host.querySelector('[id="nego-cp-save"]'));
    assert.equal(r.calls.setContact.length, 0);
  });

  test('the counterparty never sees it — it is not their question', async () => {
    const { win } = buildWorld({ negotiationView: true, contractView: true });
    const c = contract();
    win.negoInit(c);
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'counterparty', by: 'Erik', persist: false });
    const host = win.document.querySelector('#nego-room') || win.document;
    assert.ok(!host.querySelector('[id="nego-cp-setup"]'));
  });

  test('nor does a viewer, who cannot act on it', async () => {
    const r = await room({ readonly: true });
    assert.ok(!r.paint().strip);
  });

  test('and the full dialog is still one press away', async () => {
    const r = await room();
    const p = r.paint();
    assert.ok(p.more, 'purpose, expiry, channel and a covering message all still matter');
    r.press(p.more);
    assert.equal(r.calls.dialog, 1);
  });
});

describe('F77 — and then sending is just sending', () => {
  test('with an address known, the send goes straight out', async () => {
    const r = await room({ contact: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } });
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    const p = r.paint();
    assert.match(p.send.className, /nego-pulse/, 'the same flashing button as theirs');
    r.press(p.send);
    assert.equal(r.calls.direct, 1, 'no dialog — we already know where it goes');
    assert.equal(r.calls.dialog, 0);
  });

  test('without one, it asks instead of failing', async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    const p = r.paint();
    assert.ok(p.send, 'the work still has somewhere to go — this is the dead end we removed');
    r.press(p.send);
    assert.equal(r.calls.dialog, 1, 'the dialog collects the address it needs');
    assert.equal(r.calls.direct, 0);
  });
});
