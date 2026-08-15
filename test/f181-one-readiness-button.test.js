/* ============================================================
   F181 — Ready to sign lives in the header, and lives there ONCE
   ============================================================
   Two owner requests, eleven days apart, and the second one undid the first
   in a way that would have taken the page's verbs down with it if it had been
   done literally. Both halves are kept here because the second only makes
   sense next to the first.

   1 Aug 2026 — "put Ready to sign beside Compare wording, where the reader is
   already looking." The strip's own Ready to sign stayed exactly where it
   was, so the header got a MIRROR: a button that forwarded its click to
   #pt-nego-ready, copied that button's disabled state and title rather than
   recomputing the readiness gate, and — the safe default that turned out to
   matter — rendered itself hidden and un-hid only when it found a real button
   to mirror.

   12 Aug 2026 — "delete the full-width strip under the header; give that
   space to the contract, and move Decline and Share a read-only copy up into
   the header." Done literally, that deletes the only real Ready to sign on
   the page. The mirror then finds nothing to mirror, does the safe thing, and
   hides. A page with a readiness verb drawn twice becomes a page with none.

   So the strip did not lose its buttons; the strip's CONTAINER moved into the
   header row, carrying the real buttons with it, and the mirror was deleted.
   What this file now pins:

     · ONE readiness button, in the header, and it is the real one —
       #pt-nego-ready itself, not a forwarder. No second path to keep in step,
       and no second opinion about the gate.
     · THE GATE IS STILL THE ENGINE'S. A reader with a refused ask still on
       the table is NOT ready, whichever row the button sits in.
     · A DOOR ONTO NOTHING IS NOT DRAWN. On a read-only, superseded or
       already-answered link there is no readiness verb at all — the header
       must not invent one (portalCanDerive's own rule).

   And the pixel claim f180 taught: .ui-btn sets display:inline-flex, which
   beats the browser's [hidden], so visibility is asserted the way the page
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
    all: sel => Array.from(p.win.document.querySelectorAll(sel)),
    ready: () => $('#pt-nego-ready'),
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
  test('it is there, it is visible, and it sits in the header row', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    const ready = v.ready();
    assert.ok(ready, 'the header offers Ready to sign');
    assert.ok(v.shown(ready), 'and it is visible pixels, not markup only');
    assert.match(ready.textContent, /Ready to sign/);
    /* "Next to Compare wording" is the request, so the ROW is the assertion —
       and after the strip was folded into the header, the row is the identity
       section rather than the reading line it began in. Compare wording is
       still the neighbour, which is what was actually asked for. */
    const row = ready.closest('.pw-id');
    assert.ok(row, 'it joins the header rather than floating below it');
    assert.ok(row.querySelector('#pt-compare'),
      'and Compare wording is its neighbour, which is what was asked for');
  });

  test('the verbs that came up with it are there too, and nothing was left behind',
    async () => {
      const o = await ownerProposed();
      const v = counterpartyView(o.c);
      const head = v.$('.pw-id');
      for (const id of ['pt-nego-ready', 'pt-nego-decline', 'pt-derive']){
        const el = v.$(`#${id}`);
        assert.ok(el, `${id} survived the move`);
        assert.ok(head.contains(el), `${id} came up into the header`);
        assert.ok(v.shown(el), `${id} is visible pixels`);
      }
    });

  test('the full-width strip under the header is gone, and so is the name box',
    async () => {
      /* Owner-asked: that space goes to the contract. The bar's ID and its one
         builder survive the move — the verbs relocated, they did not vanish —
         so the claim is about WHERE it sits, not whether it exists. */
      const o = await ownerProposed();
      const v = counterpartyView(o.c);
      const foot = v.$('#pt-nego-foot');
      assert.ok(foot, 'the one verb slot still exists — one transport, however many doors');
      assert.ok(v.$('.pw-id').contains(foot),
        'and it is inside the header row, not a strip across the page');
      assert.equal(v.$('#nego-cp-name'), null,
        'the YOU / name box is deleted from this page');
    });

  /* ---- CLAIM REVERSED IN PLACE, 15 Aug 2026 (owner-asked, OI-8) ----
     This read "the focus button is gone from that row, and from the page", and
     it was right: on 12 Aug focus mode was deliberately deleted from the
     counterparty's page along with the strip that carried it, and #pt-focus,
     .pt-focus-btn and .pw-focus went with it.

     The owner has asked for it back — as one of three rows in a More menu, not
     as a button loose in the header. So the claim turns over rather than being
     deleted: the fact under test is still WHERE the control lives, and the
     answer has changed. It is not in the identity row and it does not wear the
     old class; it is a row inside the menu, which is where the owner put it. */
  test('focus mode is back — inside the menu, not loose in the row', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    const btn = v.$('#pt-focus');
    assert.ok(btn, 'the reader can give the contract the whole window again');
    assert.equal(v.$('.pt-focus-btn'), null,
      'and it did not come back wearing the class the old loose button had');
    const menu = v.$('#pt-more-menu');
    assert.ok(menu && menu.contains(btn),
      'it is a row in the overflow menu — the header row itself is unchanged');
    const row = v.$('.pw-id');
    assert.ok(!(row && [...row.children].some(el => el.id === 'pt-focus')),
      'nothing loose in the identity row, which is what 12 Aug was actually about');
  });
});

describe('F181 — one readiness button, not a button and its reflection', () => {
  test('Ready to sign appears exactly once on the page', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    assert.equal(v.all('#pt-nego-ready').length, 1,
      'one real button — a mirror is a second thing to keep in step');
    assert.equal(v.$('#pt-ready-top'), null,
      'the header mirror is deleted, not left as the survivor');
    assert.equal(v.all('.pt-ready-top').length, 0,
      'and nothing else wears its class');
    const readyish = v.all('button').filter(b => /Ready to sign/i.test(b.textContent));
    assert.equal(readyish.length, 1,
      'a reader sees the phrase once, so there is nothing to choose between');
  });

  test('it is shut while the deal is contested, in its own words', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    assert.equal(v.ready().disabled, true, 'nothing is answered, so nobody is ready');
    /* The gate is the engine's reading (negoAlignment), asked by the one
       builder. Moving a button to a different row must not change what it
       knows — that was the whole reason the header copy was a mirror. */
    assert.match(v.ready().title, /waiting|decision|refus/i,
      'and it explains why, rather than failing silently when pressed');
  });

  test('answering opens it', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    await acceptEvery(v, o.filed);
    assert.equal(v.ready().disabled, false, 'the gate is open');
  });

  test('a read-only link draws no readiness verb at all', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c, { superseded: { at: '2026-08-01T09:00:00Z' } });
    assert.equal(v.ready(), null,
      'a superseded copy offers nothing to press — a button that always fails is worse than none');
    assert.equal(v.$('#pt-ready-top'), null, 'and there is no mirror left to draw one');
  });
});

describe('F181 — one act, one route', () => {
  test('pressing it sends the readiness ONCE, down the existing route', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    await acceptEvery(v, o.filed);
    v.p.setResponderName('Erik Lindqvist');
    await v.press(v.ready());

    assert.equal(v.p.log.sent.length, 1,
      'ONE call — a second path would have posted twice or posted differently');
    assert.match(v.p.log.sent[0].pathname, /respond$/, 'the route the strip already used');
    const r = v.p.lastSent();
    assert.equal(r.action, 'ready');
    assert.equal(r.name, 'Erik Lindqvist');
    /* The whole reason readiness and decisions travel together (see core.js's
       'ready' branch): pressing readiness must not lose the answers. */
    assert.equal(r.negoDecisions.length, o.filed.length,
      'the held decisions rode along');
    assert.ok(r.negoDecisions.every(d => d.status === 'accepted'));
  });

  test('and the button reports the send, in the one place it can be read', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    await acceptEvery(v, o.filed);
    v.p.setResponderName('Erik Lindqvist');
    await v.press(v.ready());
    assert.match(v.ready().textContent, /Sent|Readiness sent/,
      'one act, reported once rather than twice in ways that can disagree');
    assert.equal(v.ready().disabled, true, 'and the door is spent');
  });
});
