/* ============================================================
   f165 — the negotiation desk, stage 1: it is stamped and it is shown
   ============================================================
   Four questions stand between a person and a redline once this feature is
   finished: your role, your streams, are you on this desk, and is the rule
   switched on. THIS file covers only the part that ships first — the record.

   STAGE 1 PROMISES EXACTLY TWO THINGS AND MUST BREAK NOTHING:

   1. Starting work claims the negotiation. The first change filed on OUR side
      opens a desk, records who started it, and makes them the lead. It happens
      in negoFileChange — the single funnel every authoring path converges on —
      because a claim written into one wrapper is a claim the other four routes
      never make.

   2. Nothing is enforced. Not one verb changes hands. A second colleague files
      a change and it files, exactly as it did the day before. The whole point
      of shipping this stage alone is to run it for a fortnight and see whether
      the name recorded is the person actually doing the work; a stage that also
      refused would make that impossible to tell.

   AND THE WALL, WHICH IS NEVER A LATER STAGE'S PROBLEM. Who works a negotiation
   on our side is internal from the first commit. The chip refuses to draw on
   the counterparty's seat, in the owner's preview of it, and in the portal.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>';

const ME = { id: 'u_wanjiru', name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@wanjiru.co.ke' };
const GRACE = { id: 'u_grace', name: 'Grace Mwangi', role: 'legal', email: 'grace@wanjiru.co.ke' };
const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin', email: 'achieng@wanjiru.co.ke' };

function contract(over = {}){
  return { id: 'MK-D1', name: 'Cane Supply Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich', ...over };
}

function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: opts.settings || {}, contracts: [], activeId: 'MK-D1' };
  w.win.getUsers = () => [ME, GRACE, BOSS];
  w.win.userById = id => [ME, GRACE, BOSS].find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}

/* Our own ask on a named clause, filed the way the product files one. */
const mine = (win, c, num, body, over = {}) => {
  const cl = win.negoClauseList(c).find(x => String(x.num) === String(num));
  assert.ok(cl, `clause ${num} must be findable`);
  return win.negoEditClause(c, cl.clauseId, body, { side: 'owner', summary: 'our ask', ...over });
};
const theirs = (win, c, num, body, over = {}) => {
  const cl = win.negoClauseList(c).find(x => String(x.num) === String(num));
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB', summary: 'their ask', ...over });
};

/* ============================================================
   1 — STARTING WORK CLAIMS THE NEGOTIATION
   ============================================================ */
describe('f165 · the first redline opens a desk', () => {

  test('filing our first change records the initiator and makes them the lead', async () => {
    const { win } = world();
    const c = contract();
    assert.equal(win.deskIsOpen(c), false, 'a fresh contract has no desk');
    assert.equal(win.deskRole(c), null, 'and no desk means no seat — not "reader"');

    await mine(win, c, 4, '<p>Undisputed invoices are payable within forty-five (45) days.</p>');

    assert.equal(win.deskIsOpen(c), true);
    /* Read field by field: the object is built inside the jsdom sandbox, so its
       prototype is not this realm's Object and a strict deepEqual fails on the
       identity of Object itself rather than on anything the product got wrong. */
    assert.equal(win.deskInitiator(c).id, ME.id);
    assert.equal(win.deskInitiator(c).name, ME.name);
    assert.equal(win.deskLead(c).id, ME.id);
    assert.equal(win.deskRole(c), 'lead');
  });

  test('the claim is written by the FUNNEL, so every authoring route makes it', async () => {
    /* negoInsertClause and negoDeleteClause do not go near deskClaimOnFile
       themselves — they reach negoFileChange, which does. This is the whole
       reason the hook lives there: js/core.js's Copilot shortcut and both
       playbook entrances skip the wrappers and would otherwise never claim. */
    const { win } = world();
    const c = contract();
    const cl = win.negoClauseList(c).find(x => String(x.num) === '6');
    await win.negoDeleteClause(c, cl.clauseId, { side: 'owner', summary: 'strike it' });
    assert.equal(win.deskIsOpen(c), true, 'a proposed deletion is starting work too');
    assert.equal(win.deskLead(c).id, ME.id);
  });

  test('their change does not claim our desk', async () => {
    /* A response arriving through a link, a returned .docx, or typed in on
       their behalf is not somebody in this office starting work. Letting it
       claim would hand the negotiation to whoever imported the reply. */
    const { win } = world();
    const c = contract();
    await theirs(win, c, 2, '<p>Fortnightly consignments to the mill gate.</p>');
    assert.equal(win.deskIsOpen(c), false);
    assert.equal(win.deskOf(c), null, 'and nothing at all was written onto the contract');
  });

  test('the second person to file does not take the desk from the first', async () => {
    const { win } = world();
    const c = contract();
    await mine(win, c, 4, '<p>Payable within forty-five (45) days.</p>');

    const { win: w2 } = world({ user: GRACE });
    await w2.negoEditClause(c, win.negoClauseList(c).find(x => String(x.num) === '6').clauseId,
      '<p>Liability is capped at 150% of the fees paid in the preceding twelve months.</p>',
      { side: 'owner', summary: 'grace raises the cap' });

    assert.equal(win.deskLead(c).id, ME.id, 'the lead is whoever claimed it');
    assert.equal(win.deskInitiator(c).name, ME.name);
  });

  test('opening the desk writes one audit line naming who started it', async () => {
    const { win, log } = world();
    const c = contract();
    await mine(win, c, 4, '<p>Payable within forty-five (45) days.</p>');
    const lines = log.audit.filter(a => a.action === 'Negotiation desk');
    assert.equal(lines.length, 1);
    assert.match(lines[0].detail, /Wanjiru Kamau/);
    assert.match(lines[0].detail, /leads it/);
  });
});

/* ============================================================
   2 — READING NEVER WRITES
   ============================================================
   The lesson f59 caught on the review feature, restated because it is the one
   bug that turns every repaint into a save and makes "has this contract
   changed?" unanswerable. Painting a screen must leave the record alone. */
describe('f165 · reading the desk leaves the contract alone', () => {

  test('every read on a contract with no desk writes nothing', () => {
    const { win } = world();
    const c = contract();
    win.deskOf(c); win.deskIsOpen(c); win.deskLead(c); win.deskRole(c);
    win.deskInitiator(c); win.deskChipHtml(c, {});
    assert.equal('desk' in c, false, 'no desk key was stamped onto the contract');
  });
});

/* ============================================================
   3 — STAGE 1 ENFORCES NOTHING
   ============================================================
   The promise that makes this shippable on its own. */
describe('f165 · nobody loses a verb', () => {

  test('a colleague who is not the lead still files changes normally', async () => {
    const { win } = world();
    const c = contract();
    await mine(win, c, 4, '<p>Payable within forty-five (45) days.</p>');

    const { win: w2, log } = world({ user: GRACE });
    const filed = await w2.negoEditClause(c,
      win.negoClauseList(c).find(x => String(x.num) === '6').clauseId,
      '<p>Liability is capped at 150% of the fees paid in the preceding twelve months.</p>',
      { side: 'owner', summary: 'grace raises the cap' });

    assert.ok(filed, 'the change filed');
    assert.equal(log.toasts.filter(t => t.kind === 'err').length, 0, 'and nothing refused');
    assert.equal(win.negoChanges(c).length, 2);
  });
});

/* ============================================================
   4 — THE CHIP, AND WHO NEVER SEES IT
   ============================================================ */
describe('f165 · the desk is drawn once, in the header', () => {

  test('it names the lead, and says "You" to the lead themselves', async () => {
    const { win } = world();
    const c = contract();
    await mine(win, c, 4, '<p>Payable within forty-five (45) days.</p>');

    const own = win.deskChipHtml(c, {});
    assert.match(own, /You lead/);
    /* ---- AND IT IS A LABEL, NOT A DOOR (Young, 11 Aug 2026) ----
       It used to carry data-dk-manage and open the desk sheet, so the one
       place the product STATED who leads was also the place seats were handed
       out. Assigning is reached through Internal review, which was already the
       door; this chip stopping being a second one leaves one rather than none. */
    assert.ok(!/data-dk-manage/.test(own), 'the chip no longer opens the desk sheet');
    assert.ok(!/<button/.test(own), 'and is not a button at all — disabled would say the wrong thing');
    assert.ok(!/aria-haspopup/.test(own), 'it promises no dialog, because it opens none');
    assert.match(own, /dk-chip-static/, 'and says so in its class, which is what stands the hover down');

    const { win: w2 } = world({ user: GRACE });
    const hers = w2.deskChipHtml(c, {});
    assert.match(hers, /Wanjiru Kamau leads/);
  });

  /* ---- CLAIMS REVERSED, 13 Aug 2026, OWNER-ASKED ----
     Both tests below asserted the chip's EMPTY state as a control: that an
     unclaimed contract offered a "Start negotiation" button rather than an
     empty space, and that a viewer — who cannot claim anything — was offered
     nothing at all.

     The button is gone. It read as a door into the negotiation and was not
     one (that is the green "Start negotiating" on the Document tab, a few
     inches away and almost the same words), and it was the one place the
     product both stated this fact and changed it. The claimed half of the
     same chip stopped being a button on 11 August for exactly this reasoning;
     this finishes the job.

     The viewer claim turns round with it, and that is the change that matters
     rather than a consequence of it: a fact is a fact from every chair, and a
     viewer looking at an empty corner where everybody else has something
     reads it as a fault. */
  test('an unclaimed contract STATES that nobody is assigned', () => {
    const { win } = world();
    const html = win.deskChipHtml(contract(), {});
    assert.ok(!/<button/.test(html), 'not a button — it was never a control');
    assert.ok(!/data-dk-open/.test(html), 'and no hook for the delegated opener');
    assert.match(html, /Nobody assigned yet/);
    assert.match(html, /dk-chip-static/, 'the class that stands the hover down');
    assert.ok(!/Start negotiation/.test(html),
      'and it does not wear the words of the door on the Document tab');
  });

  test('a viewer is told the same fact as everybody else', () => {
    const { win } = world({ canEdit: false });
    const html = win.deskChipHtml(contract(), {});
    assert.match(html, /Nobody assigned yet/,
      'who is working on a contract is a fact, not a permission');
    assert.ok(!/<button/.test(html));
  });

  test('but not on a contract that is already executed', () => {
    /* "Nobody is assigned YET" is untrue once the paper is signed — there is
       nothing left to assign — and that header is busy with facts that still
       matter. */
    const { win } = world();
    assert.equal(win.deskChipHtml(Object.assign(contract(), { status: 'Signed' }), {}), '');
  });

  test('the counterparty never learns who works this on our side', async () => {
    const { win } = world();
    const c = contract();
    await mine(win, c, 4, '<p>Payable within forty-five (45) days.</p>');

    assert.equal(win.deskChipHtml(c, { side: 'counterparty' }), '', 'not on their seat');
    assert.equal(win.deskChipHtml(c, { previewing: true }), '', 'not in our preview of it');
    win.PORTAL_MODE = true;
    assert.equal(win.deskChipHtml(c, {}), '', 'and never in the portal');
    win.PORTAL_MODE = false;
  });

  test('the share payload carries no desk at all', async () => {
    /* Asserted on the STRING rather than on the fields. buildSharePayload is an
       allow-list, so this is true by construction — which is exactly why it is
       checked this way: a deny-list passes a field check and fails this. */
    const { win } = world();
    const c = contract();
    await mine(win, c, 4, '<p>Payable within forty-five (45) days.</p>');
    if (typeof win.buildSharePayload !== 'function') return;   // engine-only stage
    const p = win.buildSharePayload(c, 'hash', { org: 'Wanjiru Catering Ltd', sharedBy: ME.name });
    const s = JSON.stringify(p);
    assert.equal(/"desk"/.test(s), false);
    assert.equal(/leadId/.test(s), false);
  });
});
