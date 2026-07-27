/* f42 — Share opens on what you are sending, not on the send form
   ============================================================
   Share used to open straight onto the recipient fields. It asked someone to
   dispatch a contract to another company without once showing them what had
   changed since it last went out — which, six rounds in, nobody can hold in
   their head.

   It is now two steps: a summary of the changes on the table, then Next, then
   the send form exactly as it was. The summary travels with the link — into the
   message body AND onto the counterparty's landing page, so someone opening the
   link a week later still sees what they were asked to look at.

   The rule the summary must obey is the same one the change index obeys: every
   line is QUOTED FROM THE RECORD. A change's summary is either the sentence its
   proposer typed or the mechanical "what goes → what arrives" built from its
   stored ops. Prose about a legal change is never generated, because a reader
   would act on it. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const F = require('./clausefixtures.js');

const own = xs => Array.from(xs);

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
async function negotiated(win, nums = ['4', '6']){
  const c = contract();
  win.negoInit(c);
  for (const n of nums){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB',
        summary: F.PROTO_ASKS[n].summary });
  }
  return c;
}

describe('the summary is a read of the change records', () => {
  test('one line per change on the table, quoting the record', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const s = win.negoChangeSummary(c);

    assert.equal(s.total, 2);
    assert.equal(s.pending, 2);
    assert.equal(s.round, 1);
    assert.deepEqual(own(s.lines.map(x => x.id)), ['CHG-001', 'CHG-002']);
    assert.deepEqual(own(s.lines.map(x => x.summary)),
      ['Payment terms extended from Net-30 to Net-45',
        'Liability capped at EUR 250,000 per contract year'],
      'the proposer’s own words, verbatim');
    assert.deepEqual(own(s.lines.map(x => x.clause)),
      ['Clause 4 · Payment Terms', 'Clause 6 · Liability and Insurance']);
    for (const x of s.lines) assert.equal(x.mine, false, 'these are the counterparty’s asks');
  });

  test('every line can be traced to a change that really exists', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win, ['4', '5', '6', '9']);
    const s = win.negoChangeSummary(c);
    for (const line of s.lines){
      const ch = win.negoChangeById(c, line.id);
      assert.ok(ch, `${line.id} must be a real change`);
      assert.equal(line.summary, ch.summary, 'and the line must be its summary, not a retelling');
      assert.equal(line.clause, ch.clauseLabel);
      assert.equal(line.status, ch.status);
    }
  });

  test('a change with no written summary falls back to the quoted diff', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '9');
    await win.negoEditClause(c, cl.clauseId, cl.bodyHtml.replace("sixty (60)", "thirty (30)"),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    const s = win.negoChangeSummary(c);
    assert.equal(s.lines[0].summary, '“sixty (60)” → “thirty (30)”',
      'what goes and what arrives — quoted, not described');
  });

  test('the summary reflects decisions, and says so', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win, ['4', '5', '6']);
    win.negoResolve(c, 'CHG-001', 'accepted', { by: 'Wanjiru Kamau' });
    win.negoResolve(c, 'CHG-002', 'rejected', { by: 'Wanjiru Kamau' });
    const s = win.negoChangeSummary(c);
    assert.equal(s.accepted, 1);
    assert.equal(s.rejected, 1);
    assert.equal(s.pending, 1);
    assert.match(s.text, /1 awaiting a decision/);
  });

  test('a contract with nothing proposed says so plainly', () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const s = win.negoChangeSummary(c);
    assert.equal(s.total, 0);
    assert.match(s.text, /no changes have been proposed yet/i);
    assert.doesNotMatch(s.text, /undefined|null|NaN/);
  });

  test('the change types are named in words a reader knows', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const four = win.negoClauseList(c).find(x => x.num === '4');
    const nine = win.negoClauseList(c).find(x => x.num === '9');
    await win.negoEditClause(c, four.clauseId, '<p>Net-45 applies.</p>', { side: 'counterparty', author: 'Erik' });
    await win.negoInsertClause(c, four.clauseId, { headingText: 'Clause 4A · Disputes', bodyHtml: '<p>x</p>' },
      { side: 'counterparty', author: 'Erik' });
    await win.negoDeleteClause(c, nine.clauseId, { side: 'counterparty', author: 'Erik' });
    assert.deepEqual(own(win.negoChangeSummary(c).lines.map(x => x.kind)),
      ['Amended', 'New clause', 'Deletion']);
  });
});

describe('Share is two steps, and the summary travels', () => {
  /* The modal is built into #modal-root for real, so these read the markup the
     product actually produces rather than a description of it. */
  /* openShareModal lives in js/core.js, which test/world.js deliberately leaves
     off the light stage. test/portalworld.js loads it, so that window is the one
     that can open the real dialog rather than a copy of it. */
  async function openShare(c){
    const p = buildPortal({ url: 'http://localhost/hati/' });
    const win = p.win;
    win.API_MODE = () => false;      // static mode: no server round trip needed
    /* The portal stage boots as an ANONYMOUS counterparty page, so it has no
       signed-in user — and Share is an owner action. Assigning window.currentUser
       does not help: js/core.js declares it as a lexical `const`, so its own
       internal callers resolve to that binding and never see a replacement (the
       same trap negoResolve documents for canEdit). The session is therefore
       seeded where core.js actually reads it. */
    const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
    win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
    win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
    win.persist = () => {};
    win.renderAuditSection = () => {};
    win.renderSharesSection = () => {};
    win.refreshShareOverview = () => {};
    await win.openShareModal(c);
    const root = win.document.getElementById('modal-root');
    return { win, root, $: sel => root.querySelector(sel) };
  }

  test('it opens on the summary, with the send form hidden behind Next', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);

    const s1 = m.$('#share-step-1'), s2 = m.$('#share-step-2');
    assert.ok(s1, 'step 1 must exist');
    assert.ok(s2, 'step 2 must exist');
    assert.ok(!s1.className.includes('hidden'), 'step 1 is what opens');
    assert.ok(s2.className.includes('hidden'), 'the send form is not what opens');
    assert.match(s1.textContent, /What you are sending/);
    assert.ok(m.$('#share-next'), 'and there is a Next');
  });

  test('step 1 lists every change, with its fingerprint and its clause', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win, ['4', '5', '6']);
    const m = await openShare(c);
    const txt = m.$('#share-step-1').textContent;

    for (const id of ['#CHG-001', '#CHG-002', '#CHG-003'])
      assert.ok(txt.includes(id), `${id} must be listed`);
    assert.match(txt, /Payment terms extended from Net-30 to Net-45/);
    assert.match(txt, /Clause 4 · Payment Terms/);
    assert.match(txt, /Erik Lindqvist/, 'and who asked for it');
    assert.match(txt, /3 changes on the table/);
  });

  test('Next reveals the send form; Back returns to the summary', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);

    m.$('#share-next').click();
    assert.ok(m.$('#share-step-1').className.includes('hidden'), 'the summary steps aside');
    assert.ok(!m.$('#share-step-2').className.includes('hidden'), 'the send form appears');
    assert.ok(m.$('#sh-email'), 'with the recipient fields on it');
    assert.ok(m.$('#share-send'), 'and the send button');

    m.$('#share-back').click();
    assert.ok(!m.$('#share-step-1').className.includes('hidden'), 'Back returns to the summary');
  });

  test('the readiness warnings stay on the send step, where they were', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);
    const panel = m.$('#share-readiness');
    if (panel) assert.ok(m.$('#share-step-2').contains(panel),
      'a blocker belongs next to the button it blocks, not on the summary');
  });

  test('the summary is editable before it is sent', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);
    const box = m.$('#sh-summary');
    assert.ok(box, 'the summary must be an editable field, not fixed text');
    assert.equal(box.tagName, 'TEXTAREA');
    assert.match(box.value, /#CHG-001 · Clause 4 · Payment Terms/,
      'prefilled from the record — the sender edits a draft, they do not write from nothing');
  });

  test('a contract with no changes still opens, and says there are none', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const m = await openShare(c);
    assert.ok(m.$('#share-step-1'));
    assert.match(m.$('#share-step-1').textContent, /No changes have been proposed/i);
    assert.ok(m.$('#share-next'), 'and Next still works — sending a clean document is allowed');
  });

  test('the summary reaches the counterparty’s landing page', async () => {
    const p = buildPortal({ url: 'http://localhost/hati/' });
    const payload = sharePayloadFor(p, {
      id: 'MK-191', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
      template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      redlineText: F.protoRich(), format: 'rich' });
    payload.contract.changeSummary =
      'Round 1 — 2 changes on the table, 2 awaiting a decision:\n'
      + '  • #CHG-001 · Clause 4 · Payment Terms — Payment terms extended from Net-30 to Net-45\n'
      + '  • #CHG-002 · Clause 6 · Liability and Insurance — Liability capped at EUR 250,000 per contract year';
    p.open(payload);

    const box = p.win.document.getElementById('pt-change-summary');
    assert.ok(box, 'the landing page must show what changed');
    assert.match(box.textContent, /What changed/);
    assert.match(box.textContent, /#CHG-001/);
    assert.match(box.textContent, /Payment terms extended from Net-30 to Net-45/);
    assert.match(box.textContent, /Liability capped at EUR 250,000/);
  });

  test('a link with no summary shows no empty box', () => {
    const p = buildPortal({ url: 'http://localhost/hati/' });
    const payload = sharePayloadFor(p, {
      id: 'MK-192', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
      template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      redlineText: F.protoRich(), format: 'rich' });
    p.open(payload);
    assert.equal(p.win.document.getElementById('pt-change-summary'), null,
      'an empty "what changed" panel is worse than none');
  });

  test('a summary is text, never markup', () => {
    const p = buildPortal({ url: 'http://localhost/hati/' });
    const payload = sharePayloadFor(p, {
      id: 'MK-193', name: 'X', counterparty: 'gg', template: 'WH', status: 'Under Review',
      folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
      signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich' });
    payload.contract.changeSummary = '<img src=x onerror=alert(1)> and <script>alert(2)</script>';
    p.open(payload);
    const box = p.win.document.getElementById('pt-change-summary');
    assert.ok(box);
    assert.equal(box.querySelector('img'), null, 'no markup from a share reaches the DOM');
    assert.equal(box.querySelector('script'), null);
    assert.match(box.textContent, /onerror=alert\(1\)/, 'it is shown as the text it is');
  });
});
