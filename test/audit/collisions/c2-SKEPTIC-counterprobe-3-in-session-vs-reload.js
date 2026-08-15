#!/usr/bin/env node
/* ============================================================
   SKEPTIC COUNTER-PROBE — C2, the mechanism half of the claim
   ============================================================
   THE FINDING SAYS: "refreshLiveShareQuietly refreshes EVERY standing link, so
   Astrid's own page is rebuilt from the flipped record. Her page now shows the
   ask she accepted as refused."

   THE SOURCE SAYS SOMETHING NARROWER (js/views/portal.js ~1305, inside
   portalNegoContract):

       const s=PORTAL_NEGO_SENT[ch.id];
       if(s) ch.status=s.status, ch.reply=s.reply||ch.reply||null, ch.sentByMe=true;

   PORTAL_NEGO_SENT is laid over the payload, so IN THE SAME SITTING the
   refreshed payload does NOT flip her card — she goes on seeing her own
   answer. The flip is visible only after a reload, which empties that
   module-level map.

   This probe drives the REAL page: accept, send (portalworld's stub answers
   the /respond route, which is what populates PORTAL_NEGO_SENT), then
   re-render the SAME window from the flipped payload, and read the card. Then
   a FRESH window on the same payload, which is the reload.

   No server needed — the claim is entirely about the counterparty's page.

   Run: node test/audit/collisions/c2-SKEPTIC-counterprobe-3-in-session-vs-reload.js
*/
const { buildPortal } = require('../../portalworld');

let pass = 0, fail = 0;
const P = (ok, msg, extra) => {
  if (ok) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '\n        ' + extra : '')); }
};
const NOTE = m => console.log('  ·   ' + m);
const HEAD = m => console.log('\n=== ' + m + ' ===');

const CH = over => ({ id: 'CHG-001', clauseId: 'c1', clauseLabel: 'Clause 1 Payment',
  changeType: 'modify', status: 'pending', seq: 1,
  oldText: 'Payable within thirty (30) days.',
  newText: 'Payable within forty-five (45) days.',
  author: 'Wanjiru Kamau', authorSide: 'owner',
  createdAt: '2026-08-15T08:00:00.000Z', roundN: 1, ...over });

const contract = ch => ({ id: 'MK-C2R', name: 'Raw Milk Collection',
  counterparty: 'Nordkust Industri AB', template: 'WH', status: 'Under Review',
  folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
  signatures: [], comments: [], format: 'text',
  redlineText: 'Clause 1 Payment\n\nPayable within thirty (30) days.',
  changes: [ch] });

const payload = ch => ({ kind: 'hati-share', purpose: 'negotiate', purposeChosen: 'negotiate',
  org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau', at: '2026-08-15T08:00:00.000Z',
  docHash: 'abc123', contract: contract(ch) });

/* what the link serves BEFORE the collision, and AFTER Bengt's answer landed */
const BEFORE = () => payload(CH());
const AFTER  = () => payload(CH({ status: 'rejected', reply: 'We cannot go past thirty.',
  resolvedAt: '2026-08-15T11:00:00.000Z' }));

/* THE CHANGE COLUMN, not the document pane — the first draft of this probe read
   the paper and both readings came back identical, which is a probe fault and
   is why it is named here. #rl-changes is the column the cards render into. */
function cardStatusText(doc) {
  const col = doc.getElementById('rl-changes')
    || doc.querySelector('[data-rl-card]')?.closest('div')
    || doc.getElementById('share-root') || doc.body;
  return String(col.textContent || '').replace(/\s+/g, ' ').trim();
}
function cardIds(doc) {
  return [...doc.querySelectorAll('[data-rl-card]')].map(e => e.getAttribute('data-rl-card'));
}

(async () => {
  HEAD('IN SESSION — Astrid accepts, sends, then the link is caught up');
  const her = buildPortal({ url: 'https://hati.test/' });
  const w = her.win, doc = w.document;
  w.promptDialog = async () => 'Astrid Berg';
  w.confirmDialog = async () => true;

  w.renderShareWorkbench(BEFORE(), { token: 'TOKEN-A',
    share: { recipientName: 'Astrid Berg (CFO)' } });

  const accept = doc.querySelector('[data-nego-accept="CHG-001"]');
  P(!!accept, 'armed: her page draws an Accept on CHG-001');
  if (!accept) { console.log('\n---- cannot arm; stopping ----'); process.exit(1); }
  accept.dispatchEvent(new w.Event('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 30));

  const send = doc.getElementById('nego-send-decisions');
  P(!!send, 'armed: her page draws the postbox (#nego-send-decisions)');
  send && send.dispatchEvent(new w.Event('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 120));
  const sent = her.log.sent.filter(x => /respond/.test(x.pathname));
  P(sent.length === 1 && sent[0].body && sent[0].body.negoDecisions
    && sent[0].body.negoDecisions[0].status === 'accepted',
    `armed: her acceptance really went — POST ${sent[0] && sent[0].pathname} `
    + JSON.stringify(sent[0] && sent[0].body && sent[0].body.negoDecisions),
    JSON.stringify(her.log.sent.map(x => x.pathname)));

  /* the catch-up: the SAME window, re-rendered from the flipped payload — this
     is portalRepaint's effect, and 'repaint' is what portalPollDecide returns
     once her held work is empty (portalBusy() is false after a send). */
  w.renderShareWorkbench(AFTER(), { token: 'TOKEN-A',
    share: { recipientName: 'Astrid Berg (CFO)' } });
  const inSession = cardStatusText(doc);
  NOTE('card text in session: ' + inSession.slice(0, 200));
  const flippedInSession = /Refused|refused|Rejected|rejected/.test(inSession)
    && !/Accepted|accepted/.test(inSession);
  P(flippedInSession,
    'THE FINDING\'S MECHANISM: her page shows the ask as refused in the same sitting',
    'it does not. PORTAL_NEGO_SENT is laid over the payload in portalNegoContract '
    + '(js/views/portal.js ~1305), so in the same sitting her card goes on showing HER '
    + 'answer. The card reads: "' + inSession.slice(0, 160) + '"');

  HEAD('AFTER A RELOAD — a fresh window on the same served payload');
  const her2 = buildPortal({ url: 'https://hati.test/' });
  her2.win.promptDialog = async () => 'Astrid Berg';
  her2.win.renderShareWorkbench(AFTER(), { token: 'TOKEN-A',
    share: { recipientName: 'Astrid Berg (CFO)' } });
  const afterReload = cardStatusText(her2.win.document);
  NOTE('card text after reload: ' + afterReload.slice(0, 200));
  P(/Refused|refused|Rejected|rejected|not adopted/.test(afterReload),
    'after a reload her page DOES show the ask as refused (the flip is real, one reload away)');
  P(!/Astrid|Bengt/.test(afterReload),
    'and the card itself names nobody as the decider',
    'a name appears on the card: ' + afterReload.slice(0, 200));

  console.log(`\n---- C2 SKEPTIC counter-probe 3: ${pass} passed, ${fail} failed ----`);
  process.exit(0);
})().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
