/* f945 — THE BUG LOG, BATCH 4: WHAT STAYS HOME STAYS HOME (27 Oct 2026, the owner: "next ten bugs")

   Two walls a send or a colleague's screen walked around:
     1 · the Word file a send attaches was built from the whole redline, so a change held by an internal
         review, a draft kept back from the send, or a colleague's suggestion went out in the .docx while the
         link's payload left them behind. The send now passes the payload's own list (shareHeldBackIds).
     2 · /api/bootstrap handed every member every colleague's personal preferences (what they put away,
         their Jambo levels, their brief); a colleague's row keeps only "invited, not signed in yet".

   Run: node --test test/f945-what-stays-home.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');
const { startHati, seedWorkspace } = require('./helpers');

const BODY = ['SUPPLY AGREEMENT', '1. SUPPLY', '1. The Supplier shall deliver the goods monthly.',
  '2. PAYMENT', '2. All invoices are payable within thirty days.'].join('\n');

describe('f945 (1) the Word file a send attaches carries nothing the link leaves behind', () => {
  test('a draft kept back is in the full file and out of the sent one; the one shared list is the payload\'s', async () => {
    const { win } = buildPortal();
    const c = { id: 'MK-945', name: 'Supply Agreement', counterparty: 'Kabras Sugar', status: 'Draft', folder: 'proc',
      redlineText: BODY, format: 'text', fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [] };
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id });
    win.getContract = id => (id === c.id ? c : null);
    win.negoInit(c);
    const cl = win.negoClauseList(c);
    const pay = cl.find(x => /thirty days/.test(win.richToText ? win.richToText(x.bodyHtml || '') : String(x.bodyHtml || '')));
    const sup = cl.find(x => /monthly/.test(win.richToText ? win.richToText(x.bodyHtml || '') : String(x.bodyHtml || '')));
    assert.ok(pay && sup, 'fixture: the two clauses');
    await win.negoEditClause(c, pay.clauseId, String(pay.bodyHtml).replace('thirty days', 'ninety days'));
    await win.negoEditClause(c, sup.clauseId, String(sup.bodyHtml).replace('monthly', 'weekly'));
    /* the portal stage files from their seat; these two are ours, as a send from our side carries */
    for (const x of win.negoChanges(c)) x.authorSide = 'owner';
    const held = win.negoChanges(c).find(x => x.clauseId === pay.clauseId);
    assert.ok(held, 'fixture: the payment change is filed');
    c.negotiation.holdIds = [held.id];
    const ids = [...win.shareHeldBackIds(c, {})];
    assert.deepEqual(ids, [held.id], 'the one list holds the kept-back draft');
    /* the link's payload reads the same list (this stage has nobody signed in, so the builder is read as source) */
    const CORE = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const bsp = CORE.slice(CORE.indexOf('function buildSharePayload('), CORE.indexOf('const shareChanges', CORE.indexOf('function buildSharePayload(')));
    assert.match(bsp, /const heldBack = shareHeldBackIds\(c, opts\);/, 'the link leaves behind exactly this list');
    const full = await win.docxExtract(win.wordTrackedFile(c, { side: 'owner' }).bytes);
    assert.match(full.text, /ninety/, 'control: the whole redline carries it');
    const sent = await win.docxExtract(win.wordTrackedFile(c, { side: 'owner', hiddenIds: ids }).bytes);
    assert.doesNotMatch(sent.text, /ninety/, 'the file a send attaches does not');
    assert.match(sent.text, /weekly/, 'and still carries the change that is sent');
  });
});

describe('f945 (2) a colleague\'s preferences stay theirs', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });
  test('another member sees no prefs on my row; I and an admin see them', async () => {
    await W.restricted.json('/api/me/prefs', { method: 'PUT', body: { briefEvery: 'weekly' } });
    const id = W.users.restricted.id;
    const rowOf = async cl => ((await cl.json('/api/bootstrap')).users || []).find(u => u.id === id);
    assert.deepEqual((await rowOf(W.novalues)).prefs, {}, 'a colleague: nothing personal');
    assert.equal(((await rowOf(W.restricted)).prefs || {}).briefEvery, 'weekly', 'their own row: theirs');
    assert.equal(((await rowOf(W.admin)).prefs || {}).briefEvery, 'weekly', 'an admin: as before');
  });
});
