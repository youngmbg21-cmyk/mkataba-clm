/* f206 — ANSWERING WHEN THERE IS NO WAY BACK.
 *
 * Found by the re-audit, 14 Aug 2026, chasing the one route the first audit had
 * said out loud it did not cover: the PASTE-A-CODE half of the owner's "Import
 * their Word file" box.
 *
 * THE FINDING. A share link that cannot reach this server still has to be
 * answerable, and the response code is how: the counterparty copies it, sends
 * it back by email or WhatsApp, and the owner pastes it in. The owner's box
 * says exactly that — "Paste the response code the counterparty sent back after
 * opening your share link".
 *
 * Only half the product could produce one. portalRespond's SIGN / ACCEPT /
 * CHANGES / DECLINE branch minted a code whenever PORTAL_OPTS.token was absent.
 * The DECISIONS / READY branch — answering each of the other side's asks, which
 * is the commoner act and the one a negotiation link exists for — built the
 * whole response object and then threw it away:
 *
 *     if(!PORTAL_OPTS.token){ toast(po_no_channel_back); return; }
 *
 * So a counterparty with no route home could sign a contract but could not say
 * "yes to clause 3, no to clause 7". The more consequential act had the
 * fallback; the everyday one did not.
 *
 * THE FIX is one builder used by both branches — portalOfferResponseCode. The
 * SLOT differs because the two screens genuinely differ: the signing screen has
 * a result column and fills it exactly as before, and the negotiation workbench
 * has no such slot, so the code arrives in a dialog of its own. That is the
 * same answer openDerivedLinkDialog gives to the same problem, and for the same
 * reason it is not dismissable by a backdrop click: this is the one showing,
 * and losing it loses the reader's answers.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');

function contract(over = {}){
  return { id: 'MK-7', name: 'Raw Milk Collection', counterparty: 'Nordfrakt Logistik AB',
    template: 'WH', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], format: 'text',
    redlineText: 'Clause 1 Payment\n\nPayable within thirty (30) days.',
    changes: [{ id: 'CHG-1', clauseId: 'c1', clauseLabel: 'Clause 1 Payment',
      changeType: 'modify', status: 'pending',
      oldText: 'Payable within thirty (30) days.',
      newText: 'Payable within forty-five (45) days.',
      authorSide: 'owner', author: 'Wanjiru Kamau' }], ...over };
}

const PAYLOAD = () => ({ kind: 'hati-share', purpose: 'negotiate', purposeChosen: 'negotiate',
  org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau', at: '2026-07-30T09:00:00.000Z',
  docHash: 'abc123', contract: contract() });

/* The negotiation workbench — the screen with NO #portal-result slot, which is
   the whole reason the dialog exists. `token: null` is the no-way-back state. */
function bench(opts = {}){
  const p = buildPortal();
  const { win } = p;
  win.promptDialog = async () => 'Erik Lindqvist';
  win.navigator.clipboard = { writeText: async () => {} };
  win.renderShareWorkbench(PAYLOAD(), { token: null, share: { recipientName: 'Erik Lindqvist' },
    purpose: 'negotiate', ...opts });
  return p;
}
/* The landing / signing screen, which HAS the slot. It draws the respond panel
   for a link issued to be signed — the branch where the response code has
   always worked, and which this change must leave exactly as it was. */
function landing(opts = {}){
  const p = buildPortal();
  const { win } = p;
  win.promptDialog = async () => 'Erik Lindqvist';
  win.navigator.clipboard = { writeText: async () => {} };
  const pay = { ...PAYLOAD(), purpose: 'sign', purposeChosen: 'sign',
    contract: contract({ changes: [] }) };
  win.renderSharePortal(pay, { token: null, share: { recipientName: 'Erik Lindqvist' },
    purpose: 'sign', ...opts });
  p.pay = pay;
  return p;
}
const $ = (p, id) => p.win.document.getElementById(id);

/* PRESSED, NOT SEEDED. PORTAL_NEGO_DECISIONS is a module-scope `let` inside
   portal.js — assigning window.PORTAL_NEGO_DECISIONS creates a property the
   page never reads, and the test then "fails" for its own reasons. So the
   decisions are made by pressing the counterparty's own Accept and Reject,
   which is also the only way to prove those buttons are drawn at all — and
   their absence with no live link was half the finding this file is about. */
function press(p, sel){
  const b = p.win.document.querySelector(sel);
  assert.ok(b, 'expected a button matching ' + sel);
  b.click();
  return b;
}
const heldCount = p => p.win.document.querySelectorAll('[data-rl-send]').length;

describe('f206a — the gap: a negotiation answer had nowhere to go', () => {
  test('THE FIX: with no channel back, answering the asks produces a code', async () => {
    const p = bench();
    const { win } = p;
    win.promptDialog = async () => 'Forty-five is too long.';   // the reject dialog's reason
    press(p, '[data-nego-reject="CHG-1"]');
    await new Promise(r => setTimeout(r, 30));
    win.promptDialog = async () => 'Erik Lindqvist';
    await win.portalRespond(PAYLOAD(), 'decisions', {});

    const box = $(p, 'pt-code');
    assert.ok(box, 'a response code must be produced — this returned early and threw the answer away');
    assert.ok(String(box.value).length > 40, 'and it must be the real encoded response');

    /* IT IS THE READER'S OWN ANSWER, not an empty shell. */
    const decoded = win.b64d(box.value);
    assert.equal(decoded.kind, 'hati-response');
    assert.equal(decoded.action, 'decisions');
    assert.equal(decoded.id, 'MK-7');
    const d = (decoded.negoDecisions || []).find(x => x.id === 'CHG-1');
    assert.ok(d, 'the decision travels');
    assert.equal(d.status, 'rejected');
    assert.equal(d.reply, 'Forty-five is too long.',
      'and so does the reason — collected on their page and dropped one line before the wire is the older bug this class produces');
  });

  test('the same holds for "ready to sign"', async () => {
    const p = bench();
    const { win } = p;
    press(p, '[data-nego-accept="CHG-1"]');
    await new Promise(r => setTimeout(r, 30));
    await win.portalRespond(PAYLOAD(), 'ready', {});
    const box = $(p, 'pt-code');
    assert.ok(box, 'readiness rides the same branch and needs the same way out');
    assert.equal(win.b64d(box.value).action, 'ready');
  });

  test('their answers are STILL HELD on their page — the code is the send', async () => {
    /* Nothing has reached us until the owner imports it, so clearing their
       screen would tell them the round had moved when it had not. */
    const p = bench();
    const { win } = p;
    press(p, '[data-nego-accept="CHG-1"]');
    await new Promise(r => setTimeout(r, 30));
    const before = heldCount(p);
    assert.equal(before, 1, 'the answer is held on their page, with its own Send');
    await win.portalRespond(PAYLOAD(), 'decisions', {});
    assert.equal(heldCount(p), 1,
      'a code is not a delivery; their decisions stay on their page until it is imported');
  });
});

describe('f206b — where the code is shown, and why it differs', () => {
  test('the negotiation workbench has no result slot, so the code gets a dialog', async () => {
    const p = bench();
    const { win } = p;
    assert.equal($(p, 'portal-result'), null,
      'the premise: this screen is a document and a change column, with nowhere to put a result');
    press(p, '[data-nego-accept="CHG-1"]');
    await new Promise(r => setTimeout(r, 30));
    await win.portalRespond(PAYLOAD(), 'decisions', {});
    assert.ok($(p, 'pt-code-dialog'), 'so it arrives in a dialog of its own');
    assert.ok($(p, 'pt-copy'), 'with a way to copy it');
  });

  test('the signing screen keeps its slot, exactly as before', async () => {
    /* purpose 'sign' is the screen that actually draws the respond panel and
       its result column — the branch where the code route has always worked and
       which must be unchanged by this. */
    const p = landing();
    const { win } = p;
    assert.ok($(p, 'portal-result'), 'the premise: this screen has a result column');
    await win.portalRespond(p.pay, 'decline', { comment: 'We are going elsewhere.' });
    assert.ok($(p, 'pt-code'), 'the code is produced');
    assert.equal($(p, 'pt-code-dialog'), null,
      'and it fills the slot rather than opening a dialog over a screen that has one');
    assert.ok($(p, 'portal-result').innerHTML.includes('pt-code'),
      'in the slot, where this screen has always put it');
  });

  test('the dialog is not dismissed by a click on the backdrop', async () => {
    /* Same rule as openDerivedLinkDialog and for the same reason: this is the
       one showing of a value the reader cannot get back, and confirmDialog's
       click-anywhere-to-close is right for a question and wrong for this. */
    const p = bench();
    const { win } = p;
    press(p, '[data-nego-accept="CHG-1"]');
    await new Promise(r => setTimeout(r, 30));
    await win.portalRespond(PAYLOAD(), 'decisions', {});
    const ov = $(p, 'pt-code-dialog');
    ov.dispatchEvent(new win.Event('click', { bubbles: true }));
    assert.ok($(p, 'pt-code-dialog'), 'a stray click must not take the code away');
    /* Escape and the Done button DO close it — a dialog with no way out is worse. */
    $(p, 'pt-code-done').click();
    assert.equal($(p, 'pt-code-dialog'), null, 'Done closes it');
  });

  test('the dialog says this is the only showing', async () => {
    const p = bench();
    const { win } = p;
    press(p, '[data-nego-accept="CHG-1"]');
    await new Promise(r => setTimeout(r, 30));
    await win.portalRespond(PAYLOAD(), 'decisions', {});
    const txt = $(p, 'pt-code-dialog').textContent;
    assert.match(txt, /only time|only showing|Copy it before/i,
      'a value shown once must say so');
    assert.match(txt, /Wanjiru Kamau|Wanjiru Catering/,
      'and it names who to send it back to');
  });
});

describe('f206c — with a live link, nothing changed', () => {
  test('a token present still sends over the wire and mints no code', async () => {
    const p = bench({ token: 'tok_live' });
    const { win } = p;
    const calls = [];
    win.api = async (path, method, body) => { calls.push({ path, method, body }); return { ok: true }; };
    press(p, '[data-nego-accept="CHG-1"]');
    await new Promise(r => setTimeout(r, 30));
    await win.portalRespond(PAYLOAD(), 'decisions', {});
    assert.equal(calls.length, 1, 'it goes down the link, as it always did');
    assert.match(calls[0].path, /shares\/tok_live\/respond/);
    assert.equal(calls[0].body.kind, 'hati-response', 'the response IS the body');
    assert.equal($(p, 'pt-code-dialog'), null, 'and no code dialog appears over a working link');
    assert.equal(heldCount(p), 0,
      'a real send DOES clear their held decisions — that is the difference between the two');
  });
});

describe('f206d — one builder, not two', () => {
  test('both branches go through portalOfferResponseCode', () => {
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'portal.js'), 'utf8');
    const calls = (src.match(/portalOfferResponseCode\(/g) || []).length;
    assert.ok(calls >= 3, `expected the builder plus both callers, found ${calls}`);
    /* AND NO SECOND COPY OF THE MARKUP. Two code boxes built in two places is
       how one of them ends up with the wrong wording, or without a copy button. */
    assert.equal((src.match(/id="pt-code"/g) || []).length, 2,
      'exactly two — the slot version and the dialog version, both inside the one builder');
  });

  test('the refusal it replaced is gone from this branch', () => {
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'portal.js'), 'utf8');
    /* po_no_channel_back is still a real key used elsewhere; what must not
       survive is a bare early return that discards a built response. */
    const decisionsBranch = src.slice(src.indexOf("if(action==='decisions' || action==='ready')"),
      src.indexOf("if(action==='sign' && !email)"));
    assert.doesNotMatch(decisionsBranch, /if\(!PORTAL_OPTS\.token\)\{\s*toast\(i18t\('po_no_channel_back'\)/,
      'the answer must be offered, not refused');
    assert.match(decisionsBranch, /portalOfferResponseCode\(p, res,/,
      'the response that was being thrown away is what gets handed over');
  });
});
