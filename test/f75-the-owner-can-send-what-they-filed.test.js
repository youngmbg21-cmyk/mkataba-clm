/* ============================================================
   F75 — the owner's own work had nowhere to go either
   ============================================================
   Reported as a question: "how am I supposed to send changes from the HaTi side
   to the counterparty, when that button is only on the counterparty's side?"

   It is the same dead end that was found and fixed on the counterparty's page —
   they could press Change on a clause, write what they wanted, and end up with
   a fingerprinted change in the index and no send anywhere on the screen — and
   it is now on ours.

   The owner's send lives in the turn banner and renders on one condition:
   `mine`, meaning it is our turn. That is right for the ordinary rhythm and
   wrong the moment the deal steps outside it. Send a round; the turn moves to
   them. Notice something else that needs changing, propose it — and the change
   is filed, pending, unsent, with no control anywhere in the room that would
   send it. It waits for THEM to answer before we are allowed to tell them what
   we asked.

   And the banner does not merely omit the button. It says "Waiting on Nordfrakt
   Logistik AB" over a change Nordfrakt has never been shown — asserting that
   the other side is the hold-up on something they cannot possibly answer.

   The rule the counterparty's postbox already follows is the right one: render
   it where there is something to send. Whose turn it is decides what the banner
   SAYS, not whether our own unsent work can leave the building.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

function contract(){
  return { id: 'MK-800', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich' };
}
async function room(){
  const { win } = buildWorld({ negotiationView: true, contractView: true });
  const c = contract();
  win.negoInit(c);
  const propose = async num => {
    const cl = win.negoClauseList(c).find(x => x.num === num);
    return win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[num].text}</p>`,
      { side: 'owner', author: 'Wanjiru Kamau', summary: F.PROTO_ASKS[num].summary });
  };
  const paint = () => {
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const host = win.document.querySelector('#nego-room') || win.document;
    return {
      send: host.querySelector('[id="nego-send"]'),
      banner: (host.querySelector('[id="nego-turn"]') || {}).textContent || '',
    };
  };
  return { win, c, propose, paint };
}

describe('F75 — work we have not sent can always be sent', () => {
  test('on our turn, the send is there — unchanged', async () => {
    const r = await room();
    await r.propose('4');
    assert.ok(r.paint().send, 'the ordinary rhythm still works exactly as before');
  });

  test('a change filed after we handed over can still be sent', async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    assert.equal(r.win.negoTurn(r.c), 'counterparty', 'it is genuinely their turn');
    assert.ok(r.paint().send,
      'and we are still holding an ask they have never seen — it has to be able to leave');
  });

  test('the banner stops claiming they are the hold-up', async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    const banner = r.paint().banner;
    assert.match(banner, /not sent|unsent|have not sent/i,
      'a change they have never been shown is not one they are keeping us waiting on');
  });

  test('having sent everything, the banner is plainly about them again', async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    const p = r.paint();
    assert.match(p.banner, /Waiting on Nordfrakt Logistik AB/,
      'nothing of ours is outstanding, so the wait really is theirs');
    assert.ok(!p.send, 'and there is nothing to send, so nothing offers to');
  });

  test('a viewer is offered nothing, whatever is outstanding', async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'owner', by: 'A Viewer', persist: false, readonly: true });
    const host = r.win.document.querySelector('#nego-room') || r.win.document;
    assert.ok(!host.querySelector('[id="nego-send"]'),
      'read-only is read-only — this must not become a way round it');
  });

  test('the counterparty’s banner never grows an owner send', async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'counterparty', by: 'Erik Lindqvist', persist: false });
    const host = r.win.document.querySelector('#nego-room') || r.win.document;
    assert.ok(!host.querySelector('[id="nego-send"]'),
      'their answers travel on the response route, not by minting a share link');
  });
});

/* The counterparty's postbox pulses under a line reading "nothing has reached
   them yet", so a held answer cannot be walked past. Ours sat still in a bar at
   the top, and an ask we had filed but not sent looked exactly like one we had
   already sent. Same signal, both sides. */
describe('F75 — unsent work asks to be sent', () => {
  const bannerHtml = async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const host = r.win.document.querySelector('#nego-room') || r.win.document;
    return { r, btn: host.querySelector('[id="nego-send"]') };
  };

  test('the send flashes while something is being held', async () => {
    const { btn } = await bannerHtml();
    assert.match(btn.className, /nego-pulse/,
      'the same animation the counterparty’s postbox uses, for the same reason');
  });

  test('and says how much, so the number is not a surprise', async () => {
    const { btn } = await bannerHtml();
    assert.match(btn.textContent, /Send All \(1\) Redline/);
    assert.match(btn.title, /Nordfrakt Logistik AB/,
      'the recipient rides on the tooltip since the blast identity moved onto this button');
  });

  test('the send sits in the index, beside the work it sends', async () => {
    const { btn } = await bannerHtml();
    const box = btn.closest ? btn.closest('.nego-index-send') : null;
    assert.ok(box, 'their side has always had it here; ours was a screen away');
    assert.match(box.textContent, /Nothing has reached Nordfrakt Logistik AB yet/,
      'and says so in the same words theirs does');
  });

  test('handing it back unchanged still has a send, and does not flash', async () => {
    const r = await room();
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const host = r.win.document.querySelector('#nego-room') || r.win.document;
    const btn = host.querySelector('[id="nego-send"]');
    assert.ok(btn, 'sending it back with nothing of ours outstanding is a real act');
    assert.ok(!/nego-pulse/.test(btn.className),
      'nothing is being held, so a blinking control would just be noise');
    assert.ok(!btn.closest('.nego-index-send'),
      'and it belongs in the banner, because there is no held work to sit beside');
  });
});

/* THE BUG THIS FILE'S OWN TESTS WALKED PAST.

   Moving the send into the index left the banner still rendering one whenever
   it was your turn — because negoTurnBanner reports unsent:0 on your own turn,
   which is right for the sentence it writes and wrong for deciding whether the
   postbox has this covered. Two elements, one id, and the wiring takes the
   first match: the button on screen beside the work was the one with no handler
   on it. Every test above passed throughout, because each asserted that A send
   exists and none asked how many. */
describe('F75 — there is exactly one send, and it is the one you can see', () => {
  const sends = host => host.querySelectorAll('[id="nego-send"]');

  test('on your own turn, holding an unsent ask', async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const host = r.win.document.querySelector('#nego-room') || r.win.document;
    assert.equal(sends(host).length, 1, 'two would mean one of them is dead');
    assert.ok(sends(host)[0].closest('.nego-index-send'),
      'and the live one has to be the one beside the work');
  });

  test('after handing over, holding a new ask', async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const host = r.win.document.querySelector('#nego-room') || r.win.document;
    assert.equal(sends(host).length, 1);
  });

  test('and with nothing held, exactly one in the banner', async () => {
    const r = await room();
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const host = r.win.document.querySelector('#nego-room') || r.win.document;
    assert.equal(sends(host).length, 1);
    assert.ok(!sends(host)[0].closest('.nego-index-send'));
  });

  test('the one that is rendered is the one that is wired', async () => {
    const r = await room();
    await r.propose('4');
    let fired = 0;
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false,
      onShareLink: () => { fired++; } });
    const host = r.win.document.querySelector('#nego-room') || r.win.document;
    host.querySelector('[id="nego-send"]').dispatchEvent(new r.win.Event('click', { bubbles: true }));
    assert.equal(fired, 1, 'pressing the button you can see has to do something');
  });
});
