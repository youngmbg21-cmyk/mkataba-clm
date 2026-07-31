/* ============================================================
   F63 — a reply in progress survives closing the laptop
   ============================================================
   The other half of "why do I have to send a decision if I have accepted".
   f62 made the holding step visible; this makes it durable.

   Everything the counterparty has done and not yet sent lived in three module
   variables, and a module variable is exactly as long-lived as the tab. Answer
   four changes, close the laptop, come back — and you had answered nothing:
   the page rebuilt from the share payload and every card was undecided again.
   Wording typed into a Change went the same way, which is more work to lose
   than a click.

   It is now kept in the reader's own browser, against the link it belongs to.
   Three things about that are deliberate:

     · IT IS NOT A RECORD. Nothing in it has been agreed with anybody. It is a
       draft of a reply, and every card says so until it is sent.
     · IT IS KEYED BY THE LINK. A different link is a different negotiation.
     · IT EXPIRES. A draft nobody sent a month ago should not be resurrected
       onto a link that has moved several rounds since.

   And it degrades: a browser that refuses to remember gives exactly the
   behaviour of before, because every read and write is wrapped. The counterparty
   page can run somewhere localStorage throws outright, and a convenience that
   cannot remember must never be able to take the page down.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
async function ownerProposed(nums = ['4', '6']){
  const { win } = buildWorld({ negotiationView: true });
  const c = contract();
  win.negoInit(c);
  const filed = [];
  for (const n of nums){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    filed.push(await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'owner', author: 'Wanjiru Kamau', summary: F.PROTO_ASKS[n].summary }));
  }
  return { win, c, filed };
}
/* ONE browser, opened at the link more than once. A real origin, because that
   is what the counterparty actually has — the link is served from the same
   host as the app. The default portal stage has no origin, which is a useful
   stand-in for a browser that will not remember, and is exercised below. */
function theirBrowser(c, opts = {}){
  const p = buildPortal({ url: 'https://hati.test/' });
  const payload = sharePayloadFor(p, c, {}, { purpose: 'negotiate' });
  const doc = p.win.document;
  const scoped = sel => sel.replace(/#([\w-]+)/g, '[id="$1"]');
  const $ = sel => {
    const room = doc.querySelector('#nego-room');
    return (room ? room.querySelector(scoped(sel)) : null) || doc.querySelector(sel);
  };
  const open = () => p.open(payload, { token: opts.token || 'tok_test',
    share: { recipientName: 'Erik Lindqvist' } });
  open();
  return { p, win: p.win, $, open, payload,
    stored: () => p.win.localStorage.getItem(`hati.negoHeld.${opts.token || 'tok_test'}`),
    last: () => { const s = p.log.sent; return s.length ? s[s.length - 1].body : null; },
    async press(sel){
      const el = $(sel);
      assert.ok(el, 'missing control: ' + sel);
      el.dispatchEvent(new p.win.Event('click', { bubbles: true }));
      for (let i = 0; i < 3; i++) await new Promise(r => setImmediate(r));
    } };
}

describe('F63 — answers held on the page survive a reload', () => {
  test('an answer given and not sent is still there after reopening the link', async () => {
    const { c, filed } = await ownerProposed();
    const b = theirBrowser(c);
    await b.press(`[data-nego-accept="${filed[0].id}"]`);
    assert.ok(b.stored(), 'the draft reply is kept against this link');

    b.open();                                    // the laptop was closed and reopened
    assert.ok(b.$(`[data-unsent="${filed[0].id}"]`),
      'the answer is back, and still marked as not having gone anywhere');
    assert.match(b.$('#nego-send-decisions').textContent, /Send 1 decision/,
      'with the step that has not happened still offered');
    assert.equal(b.$(`[data-nego-accept="${filed[0].id}"]`), null,
      'and not back to being an open question');
  });

  test('it is still only a draft — nothing has reached anybody', async () => {
    const { c, filed } = await ownerProposed();
    const b = theirBrowser(c);
    await b.press(`[data-nego-accept="${filed[0].id}"]`);
    b.open();
    assert.equal(b.last(), null, 'remembering an answer is not sending it');
    const badge = b.$(`[data-nego-card="${filed[0].id}"] .rl-badge`);
    assert.match(badge.textContent, /held/, 'and the card still says so in words');
  });

  test('answers to several changes all come back', async () => {
    const { c, filed } = await ownerProposed();
    const b = theirBrowser(c);
    await b.press('#nego-bulk-acc');
    b.open();
    for (const f of filed) assert.ok(b.$(`[data-unsent="${f.id}"]`), `#${f.id} came back`);
    assert.match(b.$('#nego-send-decisions').textContent, /Send 2 decisions/);
  });

  test('and undoing one before the reload leaves it undone', async () => {
    const { c, filed } = await ownerProposed();
    const b = theirBrowser(c);
    await b.press(`[data-nego-accept="${filed[0].id}"]`);
    await b.press(`[data-nego-undo="${filed[0].id}"]`);
    b.open();
    assert.ok(b.$(`[data-nego-accept="${filed[0].id}"]`), 'back to an open question, as they left it');
    assert.equal(b.$('#nego-send-decisions'), null, 'with nothing waiting to go');
  });

  test('sending clears the draft, so a later reload does not resurrect it', async () => {
    const { c, filed } = await ownerProposed();
    const b = theirBrowser(c);
    await b.press('#nego-bulk-acc');
    await b.press('#nego-send-decisions');
    assert.equal(b.last().action, 'decisions');
    assert.equal(b.stored(), null, 'it has gone; it is not a draft any more');

    b.open();
    assert.equal(b.$('#nego-send-decisions'), null,
      'reopening must not offer to send an answer that has already gone');
    for (const f of filed) assert.equal(b.$(`[data-unsent="${f.id}"]`), null);
  });
});

describe('F63 — the draft belongs to one link, and does not outlive its usefulness', () => {
  test('a different link does not inherit answers given on this one', async () => {
    const { c, filed } = await ownerProposed();
    const b = theirBrowser(c, { token: 'tok_one' });
    await b.press(`[data-nego-accept="${filed[0].id}"]`);
    assert.ok(b.stored(), 'held against tok_one');

    // the same browser, a different negotiation
    b.p.open(b.payload, { token: 'tok_two', share: { recipientName: 'Erik Lindqvist' } });
    assert.equal(b.$(`[data-unsent="${filed[0].id}"]`), null,
      'answers must never follow a reader from one deal to another');
    assert.ok(b.$(`[data-nego-accept="${filed[0].id}"]`), 'the second link starts undecided');
  });

  test('a draft older than a month is not resurrected', async () => {
    const { c, filed } = await ownerProposed();
    const b = theirBrowser(c);
    await b.press(`[data-nego-accept="${filed[0].id}"]`);
    const held = JSON.parse(b.stored());
    held.at = Date.now() - 40 * 24 * 60 * 60 * 1000;          // stale news
    b.win.localStorage.setItem('hati.negoHeld.tok_test', JSON.stringify(held));

    b.open();
    assert.ok(b.$(`[data-nego-accept="${filed[0].id}"]`),
      'a reply nobody sent last month must not be put back onto a link that has moved on');
    assert.equal(b.win.localStorage.getItem('hati.negoHeld.tok_test'), null, 'and it is cleared out');
  });

  test('a corrupt or foreign draft is ignored rather than obeyed', async () => {
    const { c, filed } = await ownerProposed();
    const b = theirBrowser(c);
    b.win.localStorage.setItem('hati.negoHeld.tok_test', '{not json at all');
    b.open();
    assert.ok(b.$(`[data-nego-accept="${filed[0].id}"]`), 'the page still works');
    b.win.localStorage.setItem('hati.negoHeld.tok_test', JSON.stringify({ v: 99, decisions: { x: 1 } }));
    b.open();
    assert.ok(b.$(`[data-nego-accept="${filed[0].id}"]`), 'and a shape it does not know is not trusted');
  });
});

describe('F63 — a browser that will not remember still works', () => {
  /* The default portal stage has no origin, so every localStorage call throws —
     a fair stand-in for private browsing, a locked-down device, or a full quota.
     The old behaviour is the fallback, and nothing is allowed to break. */
  const noStorage = c => {
    const p = buildPortal();
    const payload = sharePayloadFor(p, c, {}, { purpose: 'negotiate' });
    const doc = p.win.document;
    const scoped = sel => sel.replace(/#([\w-]+)/g, '[id="$1"]');
    const $ = sel => {
      const room = doc.querySelector('#nego-room');
      return (room ? room.querySelector(scoped(sel)) : null) || doc.querySelector(sel);
    };
    p.open(payload, { token: 'tok_test', share: { recipientName: 'Erik Lindqvist' } });
    return { p, $,
      async press(sel){
        const el = $(sel);
        assert.ok(el, 'missing control: ' + sel);
        el.dispatchEvent(new p.win.Event('click', { bubbles: true }));
        for (let i = 0; i < 3; i++) await new Promise(r => setImmediate(r));
      } };
  };

  test('answering, marking and sending all behave exactly as before', async () => {
    const { c, filed } = await ownerProposed();
    const v = noStorage(c);
    await v.press(`[data-nego-accept="${filed[0].id}"]`);
    assert.ok(v.$(`[data-unsent="${filed[0].id}"]`),
      'the warning is drawn from the page, not from storage');
    await v.press('#nego-send-decisions');
    assert.equal(v.p.log.sent[v.p.log.sent.length - 1].body.action, 'decisions',
      'and the answer still goes');
    assert.ok(v.$(`[data-sent="${filed[0].id}"]`));
  });
});
