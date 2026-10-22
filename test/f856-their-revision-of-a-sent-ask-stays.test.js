/* ============================================================
   f856 — THEIR REVISION OF AN ASK THEY HAD ALREADY SENT STAYS, AND GOES
   (22 Oct 2026, the bug log, 28 Sep: "On their page, revising their own ask
   that has ALREADY been sent revises it in place, and the revision is lost on
   the next repaint with no Send offered.")
   ============================================================
   Reproduced on the counterparty's own page before the fix: the funnel revises
   their pending ask in place (same number), the page's held-work rule saw that
   number on the payload and called it sent, so nothing was held, no Send was
   offered, and the page's next rebuild from the payload put the old wording
   back. Now, driven through the page itself (renderSharePortal → the
   workbench's own onChange):
     1  the revision is held as unsent work, under its own number
     2  a rebuild from the same payload (a poll, a repaint) keeps the revision
     3  the page counts it busy, so a poll that finds news never repaints over it
     4  Send carries it, and our side's one live ask on the clause takes the
        revised words (never two rival asks)
     5  an ask that arrived and was NOT revised is still not held
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

const FIRST = '<p>Payment shall be made within forty-five (45) days of a valid invoice.</p>';
const REVISED = '<p>Payment shall be made within sixty (60) days of a valid invoice.</p>';

async function stage(){
  const P = buildPortal(); const win = P.win;
  const owner = supplyContract(); win.negoInit(owner);
  const cl = win.negoClauseList(owner).find(x => /thirty/.test(x.text));
  const ask = await win.negoEditClause(owner, cl.clauseId, FIRST, { side: 'counterparty', author: 'Erik' });
  if (win.negoHandOver) win.negoHandOver(owner, { to: 'owner', by: 'Erik' });
  const payload = sharePayloadFor(P, owner);
  /* the workbench's own options, as the page hands them over */
  let opts = null; const real = win.redlineEmbed;
  win.redlineEmbed = (h, c, o) => { opts = o; return real(h, c, o); };
  P.open(payload);
  return { P, win, owner, cl, ask, payload, opts: () => opts };
}
const held = win => win.eval('PORTAL_NEGO_PROPOSED');

test('1–3 a revision of an ask that had arrived is held, kept across a rebuild, and counted busy', async () => {
  const S = await stage();
  assert.ok(S.opts(), 'the page mounted its workbench');
  const pc = S.win.portalNegoContract(S.payload);
  const rev = await S.win.negoEditClause(pc, S.cl.clauseId, REVISED, { side: 'counterparty', author: 'Erik' });
  assert.equal(rev.id, S.ask.id, 'the funnel revises their pending ask in place, under its own number');
  S.opts().onChange(pc);
  const h = held(S.win)[S.ask.id];
  assert.ok(h, 'the revision is held as unsent work');
  assert.match(String(h.newText), /sixty \(60\) days/);
  const again = S.win.portalNegoContract(S.payload);
  const shown = again.changes.find(x => x.id === S.ask.id);
  assert.match(String(shown.newText), /sixty \(60\) days/, 'a rebuild from the same payload keeps the revision, not the old words');
  assert.equal(S.win.portalBusy(), true, 'a poll finding news notifies instead of repainting over it');
});

test('4 Send carries it, and our side\'s one live ask takes the revised words', async () => {
  const S = await stage();
  const pc = S.win.portalNegoContract(S.payload);
  await S.win.negoEditClause(pc, S.cl.clauseId, REVISED, { side: 'counterparty', author: 'Erik' });
  S.opts().onChange(pc);
  const proposals = Object.values(held(S.win)).map(x => ({ id: x.id, clauseId: x.clauseId, changeType: x.changeType,
    oldText: x.oldText, newText: x.newText, bodyHtml: x.bodyHtml, why: x.why || null }));
  assert.equal(proposals.length, 1, 'one ask to send');
  const before = S.owner.changes.find(x => x.id === S.ask.id);
  assert.match(String(before.newText), /forty-five/, 'before the send our copy holds the version that went');
  await S.win.applyNegoProposals(S.owner, { negoProposed: proposals }, 'Erik');
  const live = S.owner.changes.filter(x => x.authorSide === 'counterparty' && x.status === 'pending' && x.clauseId === S.cl.clauseId);
  assert.equal(live.length, 1, 'one live ask of theirs on the clause, never two rivals');
  assert.match(String(live[0].newText), /sixty \(60\) days/, 'and it carries the revised words');
});

test('5 an ask that arrived and was not revised is still not held', async () => {
  const S = await stage();
  const pc = S.win.portalNegoContract(S.payload);
  S.opts().onChange(pc);
  assert.deepEqual(Object.keys(held(S.win)), [], 'nothing held');
});
