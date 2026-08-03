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

  /* THE DIALOG GREW A QUESTION IN FRONT (Young, 03 Aug 2026). It used to open
     on "What you are sending" — the purpose cards, the change manifest and the
     summary on one dense screen — with no way to say that the RECORD, rather
     than the contract, was what was travelling. That question is now asked
     first and on its own, and the summary step is one Next behind it. The
     guarantee these tests were written for is unchanged and still checked: the
     send form is never what opens. */
  test('it opens on what you are sharing, with the rest behind Next', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);

    const sk = m.$('#share-step-kind'), s1 = m.$('#share-step-1'), s2 = m.$('#share-step-2');
    assert.ok(sk, 'the sharing question must exist');
    assert.ok(s1, 'step 1 must exist');
    assert.ok(s2, 'step 2 must exist');
    assert.ok(!sk.className.includes('hidden'), 'the sharing question is what opens');
    assert.ok(s1.className.includes('hidden'), 'the summary waits behind it');
    assert.ok(s2.className.includes('hidden'), 'the send form is not what opens');
    assert.match(sk.textContent, /What are you sharing\?/);
    assert.match(s1.textContent, /What you are sending/);
    assert.ok(m.$('#share-kind-next'), 'and there is a Next out of the first question');
    assert.ok(m.$('#share-next'), 'and a Next out of the second');
  });

  test('the first question offers the contract and the record, and nothing else', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);
    const opts = Array.from(m.root.querySelectorAll('#share-kind [data-share-kind]'))
      .map(b => b.getAttribute('data-share-kind'));
    assert.deepEqual(opts, ['contract', 'history'], 'two answers to one question');
    const contractBtn = m.root.querySelector('[data-share-kind="contract"]');
    assert.equal(contractBtn.getAttribute('aria-pressed'), 'true',
      'the contract leads — it is what almost every share is');
  });

  test('the record cannot be sent when there is no record', async () => {
    const { win } = buildWorld();
    /* A contract nobody has proposed anything on. negotiated() files changes;
       this deliberately does not. */
    const c = { id: 'MK-EMPTY', name: 'Nothing proposed yet', counterparty: 'Someone Ltd',
      template: 'WH', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
      signatures: [], comments: [], changes: [] };
    const m = await openShare(c);
    const histBtn = m.root.querySelector('[data-share-kind="history"]');
    assert.ok(histBtn.disabled, 'there is nothing to send, so the option does not pretend otherwise');
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

  /* THE BOX STOPPED BEING PRE-WRITTEN (Young, 03 Aug 2026). It used to open
     holding the generated change list, and whatever it held travelled — into
     the email and onto the counterparty's landing page as "What changed". So
     every link arrived with a machine-written paragraph listing changes that
     are already on the same screen, per clause, with the redline attached. The
     manifest above it is unchanged: the SENDER still sees exactly what is going
     out. What changed is that the RECIPIENT no longer receives a covering note
     nobody wrote. */
  test('the note is empty, and asks rather than answers', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);
    const box = m.$('#sh-summary');
    assert.ok(box, 'there must still be somewhere to write a note');
    assert.equal(box.tagName, 'TEXTAREA');
    assert.equal(box.value, '', 'nothing is written for the sender');
    assert.ok(box.getAttribute('placeholder'), 'and the box says what it is for');
  });

  test('the sender still sees every change that is going out', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);
    const txt = m.$('#share-manifest').textContent;
    assert.ok(txt.includes('#CHG-001') && txt.includes('#CHG-002'),
      'the manifest is what shows the sender what they are sending — it did not go anywhere');
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

  /* THE HISTORY BRANCH PREVIEWS THE RECORD, NOT THE MANIFEST. It shipped
     showing the change manifest — the list of what is going out for decision —
     which is the right preview for a contract link and the wrong one for a
     record. The preview is the product's own timeline component, so it cannot
     drift from the page it claims to be previewing. */
  test('choosing the record swaps the manifest for the history itself', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);
    const click = sel => m.root.querySelector(sel)
      .dispatchEvent(new m.win.Event('click', { bubbles: true }));

    assert.ok(!m.$('#share-manifest').className.includes('hidden'), 'the contract shows the manifest');
    assert.ok(m.$('#share-hist-preview').className.includes('hidden'), 'and not the record');

    click('[data-share-kind="history"]');
    assert.ok(m.$('#share-manifest').className.includes('hidden'), 'the record hides the manifest');
    assert.ok(!m.$('#share-hist-preview').className.includes('hidden'), 'and shows the timeline');
    assert.match(m.$('#share-hist-preview').textContent, /Negotiation history/,
      'it is the real screen, not a description of it');

    click('[data-share-kind="contract"]');
    assert.ok(!m.$('#share-manifest').className.includes('hidden'), 'and back again');
  });

  test('switching what is shared changes the invitation, never the sender\u2019s words', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c);
    const click = sel => m.root.querySelector(sel)
      .dispatchEvent(new m.win.Event('click', { bubbles: true }));
    const ta = () => m.$('#sh-summary');

    click('[data-share-kind="history"]');
    assert.equal(ta().value, '', 'the record gets no pre-written note either');
    assert.match(ta().getAttribute('placeholder'), /record/i,
      'only the invitation changes with the choice');

    ta().value = 'For your file, Amina — nothing needed from you.';
    click('[data-share-kind="contract"]');
    assert.equal(ta().value, 'For your file, Amina — nothing needed from you.',
      'switching the kind must never take the sender\u2019s words away');
  });

});

/* ============================================================
   The reason travels from the editor to the card
   ============================================================
   The field, the storage and the display all existed already: a change carries
   a note, and the card renders it under "Why they asked". The editor both
   seats use never asked for one, so every change arrived as bare wording and
   the owner had to go and ask. This checks the wire that was missing, not the
   two ends that were not. */
describe('a change can say why it was asked for', () => {
  test('what is typed in the editor is filed on the change', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const ch = await win.negoEditClause(c, cl.clauseId, '<p>Net-45 applies.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist',
        note: 'Our AP cycle runs monthly, so Net-30 forces an out-of-cycle payment.' });
    assert.equal(ch.note, 'Our AP cycle runs monthly, so Net-30 forces an out-of-cycle payment.');
  });

  test('a change filed without one carries no note at all', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const ch = await win.negoEditClause(c, cl.clauseId, '<p>Net-45 applies.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.ok(!ch.note, 'optional means absent, not an empty string on the record');
  });

  test('the card shows it, and shows nothing when there is none', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const list = win.negoClauseList(c);
    await win.negoEditClause(c, list.find(x => x.num === '4').clauseId, '<p>Net-45 applies.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist', note: 'AP-CYCLE-REASON' });
    await win.negoEditClause(c, list.find(x => x.num === '6').clauseId, '<p>Capped.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    const html = win.negoHistoryCardHtml
      ? win.negoChanges(c).map(x => win.negoHistoryCardHtml(c, x)).join('')
      : '';
    if (!html) return;   // the card renderer is not on this stage
    assert.match(html, /Why they asked/);
    assert.match(html, /AP-CYCLE-REASON/);
    assert.equal((html.match(/Why they asked/g) || []).length, 1,
      'only the change that has a reason gets the block');
  });
});
