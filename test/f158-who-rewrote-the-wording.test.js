/* ============================================================
   f158 — when somebody else rewrites your change, the card says so
   ============================================================
   Found by asking a plain question of the finished feature: can an internal
   reviewer change the wording, or only send feedback back?

   The answer turned out to be "both, through different doors". The review
   itself is feedback only — clear, hold, advise, note. But a reviewer is an
   ordinary colleague with editing rights, so nothing stops them opening the
   clause and correcting it, and that is usually the USEFUL thing for them to
   do: fixing the cap beats writing "make it 24 months" and waiting a round.

   The update-in-place rule then does what it is supposed to: same change id,
   same slot, previous wording pushed onto revisions[], new fingerprint chained
   on. The audit line named the reviser correctly.

   THE CARD DID NOT. It went on printing the original author under wording
   somebody else had written, and "who wrote this" is not a detail on a document
   heading for signature. So the funnel records `revisedBy`, both card renderers
   print it, and — because this is an internal name — it stays behind the wall
   like every other internal name.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { JSDOM } = require('jsdom');

const BODY = '<h1>Cane Supply Agreement</h1>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at twelve months of fees.</p>';

const ME   = { id: 'u_me',   name: 'Wanjiru Kamau',  role: 'legal', email: 'w@x.co.ke' };
const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin', email: 'a@x.co.ke' };

const contract = () => ({ id: 'MK-W1', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  redlineText: BODY, format: 'rich' });

function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: {}, contracts: [] };
  w.win.getUsers = () => [ME, BOSS];
  w.win.userById = id => [ME, BOSS].find(u => u.id === id) || null;
  return w.win;
}
const edit = (win, c, num, body, who) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'owner', author: who, summary: 'wording on ' + num });
};

/* ============================================================
   1 — THE RECORD
   ============================================================ */
describe('f158 · the change knows who rewrote it', () => {
  test('a colleague rewriting your ask keeps your name on it and adds theirs', async () => {
    const win = world();
    const c = contract(); win.negoInit(c);
    const ch = await edit(win, c, '6', '<p>Liability is uncapped.</p>', ME.name);
    assert.equal(ch.author, ME.name);
    assert.equal(ch.revisedBy, undefined, 'nobody has rewritten it yet');

    const after = await edit(win, c, '6', '<p>Liability is capped at twenty-four months of fees.</p>', BOSS.name);
    assert.equal(after.id, ch.id, 'still one change, per the update-in-place rule');
    assert.equal(after.author, ME.name, 'the ask is still the person\'s who raised it');
    assert.equal(after.revisedBy, BOSS.name, 'and the wording is now theirs');
    assert.ok(after.revisedAt, 'stamped with when');
    assert.equal(after.revisions.length, 1, 'and the earlier wording is recoverable');
  });

  test('it clears when the author takes the wording back', async () => {
    const win = world();
    const c = contract(); win.negoInit(c);
    await edit(win, c, '6', '<p>Liability is uncapped.</p>', ME.name);
    await edit(win, c, '6', '<p>Capped at twenty-four months.</p>', BOSS.name);
    const back = await edit(win, c, '6', '<p>Capped at eighteen months.</p>', ME.name);
    assert.equal(back.revisedBy, undefined,
      'the wording is the author\'s again — a stale "revised by" would be a claim about the present');
  });

  test('the audit trail already named them, and still does', async () => {
    const win = world();
    const c = contract(); win.negoInit(c);
    await edit(win, c, '6', '<p>Liability is uncapped.</p>', ME.name);
    await edit(win, c, '6', '<p>Capped at twenty-four months.</p>', BOSS.name);
    assert.match((c.audit || []).map(a => a.detail).join(' | '),
      /revised by Achieng Otieno/);
  });

  test('every filing route inherits it, because it is recorded in the funnel', async () => {
    /* negoEditClause is one wrapper of four. The stamp is written in
       negoFileChange, so the clause-library insert, Copilot and the Word
       round-trip get it without knowing they need it. Asserted on the source,
       because the alternative is four near-identical tests. */
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'negotiation.js'), 'utf8');
    const at = src.indexOf('async function negoFileChange(');
    assert.ok(at > 0);
    const fn = src.slice(at, src.indexOf('\nfunction ', at + 10));
    assert.match(fn, /live\.revisedBy = author/, 'the stamp lives in the one funnel');
  });
});

/* ============================================================
   2 — AND BOTH CARDS SAY IT
   ============================================================ */
describe('f158 · both change cards name the reviser', () => {
  async function revised(win){
    const c = contract(); win.negoInit(c);
    const ch = await edit(win, c, '6', '<p>Liability is uncapped.</p>', ME.name);
    await edit(win, c, '6', '<p>Capped at twenty-four months of fees.</p>', BOSS.name);
    return { c, ch };
  }

  test('the workbench card and the contract-tab card both carry it', async () => {
    const win = world({ negotiationView: true });
    const { c } = await revised(win);
    for (const [name, html] of [
      ['workbench', win.redlineChangeCardsHtml(c, { side: 'owner' })],
      ['contract tab', win.negoLiveCardsHtml(c, { side: 'owner' })],
    ]){
    /* CLAIM UPDATED, 13 Aug 2026: a name on a CARD is now first name plus
       the surname's initial (cardName) — the whole name stays in the
       line's hover text, and in the record, the emails and the pickers.
       The claim is the same claim; only the form of the name moves. */
      assert.match(html, /Achieng O\. rewrote this wording/, name + ' names the reviser');
      assert.match(html, /Wanjiru K\. proposed the change/, name + ' still credits the author');
      assert.match(html, /title="[^"]*Achieng Otieno/, name + ' keeps both whole names on hover');
    }
  });

  test('an ask nobody else touched says nothing extra', async () => {
    const win = world({ negotiationView: true });
    const c = contract(); win.negoInit(c);
    await edit(win, c, '6', '<p>Liability is uncapped.</p>', ME.name);
    const html = win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.ok(!/rewrote this wording/.test(html), 'no line where there is nothing to say');
  });

  test('the "last updated by" tooltip stops naming the wrong person', async () => {
    const win = world({ negotiationView: true });
    const { c } = await revised(win);
    const html = win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(html, /Last updated by Achieng Otieno/);
    assert.ok(!/Last updated by Wanjiru Kamau/.test(html),
      'it used to claim the author had made a change somebody else made');
  });
});

/* ============================================================
   3 — IT IS AN INTERNAL NAME, SO IT STAYS HOME
   ============================================================ */
describe('f158 · the counterparty is not told who rewrote it', () => {
  test('the card shown on their seat carries neither name change nor stamp', async () => {
    const win = world({ negotiationView: true });
    const c = contract(); win.negoInit(c);
    await edit(win, c, '6', '<p>Liability is uncapped.</p>', ME.name);
    await edit(win, c, '6', '<p>Capped at twenty-four months.</p>', BOSS.name);
    const asThem = win.redlineChangeCardsHtml(c, { side: 'counterparty', readonly: true, hiddenIds: [] });
    assert.ok(!/rewrote this wording/.test(asThem));
    assert.ok(!/Achieng Otieno/.test(asThem), 'internal names do not cross the table');
  });

  test('and the payload does not carry it either', async () => {
    const W = new JSDOM('<!doctype html><body></body>', { url: 'https://hati.test/' }).window;
    const s = loadViews(
      ['js/richdoc.js', 'js/redline.js', 'js/clausemodel.js', 'js/negotiation.js',
        'js/review.js', 'js/core.js'],
      { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS, document: W.document,
        crypto: W.crypto, NodeFilter: W.NodeFilter, Node: W.Node, DOMParser: W.DOMParser });
    s.currentUser = () => ME;
    s.getUsers = () => [ME, BOSS];
    s.state = { settings: {}, contracts: [] };
    s.logAudit = () => {}; s.persist = () => {}; s.toast = () => {};

    const c = contract(); s.negoInit(c);
    const cl = s.negoClauseList(c).find(x => x.num === '6');
    await s.negoEditClause(c, cl.clauseId, '<p>Liability is uncapped.</p>',
      { side: 'owner', author: ME.name, summary: 'no cap' });
    await s.negoEditClause(c, cl.clauseId, '<p>Capped at twenty-four months.</p>',
      { side: 'owner', author: BOSS.name, summary: 'cap at 24' });

    const p = s.buildSharePayload(c, 'hash', { org: 'Wanjiru Catering Ltd', sharedBy: ME.name });
    const raw = JSON.stringify(p);
    assert.ok(!/revisedBy/.test(raw), 'the field does not travel');
    assert.ok(!/Achieng Otieno/.test(raw), 'and neither does the name in it');
    /* The allow-list is what makes that true, so the wording itself must still
       be there — otherwise this test would pass on an empty payload. */
    assert.match(raw, /twenty-four months/, 'the current wording does travel');
  });
});
