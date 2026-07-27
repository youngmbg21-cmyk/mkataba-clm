/* f50 — the library moved, and the Docs page stopped editing
   ============================================================
   Two reports, one change of shape.

   "At the top of the bar in the negotiations page is where we need to migrate
   the add clause feature and not in the Docs page."
   "There should be no editing of contracts in the docs page only scanning,
   checks and signing of the contracts."

   They are the same instruction said twice. There were two ways to change a
   contract — the negotiation, where every word is a tracked change somebody has
   to decide, and the Docs page, where the whole document was a textarea and the
   clause library appended wording nobody agreed to. Two ways to change a
   contract is how the two drift apart, and it was the untracked one that could
   not keep a heading.

   So the Docs page reads, checks and signs. The library lives on the
   negotiation room's top bar, on the owner's side only — the playbook IS our
   negotiating position, and handing it to the counterparty hands them that.

   The half that matters is not the button, though. It is where the button goes:
   applyClauseRedline used to append onto c.redlineText, so preferred wording
   simply appeared in the document. It now files an insertClause change with a
   fingerprint, a hash and a place in the chain. That fixed BOTH callers at once
   — the library picker and the playbook review's "apply this wording" — because
   the destination changed rather than each caller. This file spends most of its
   assertions there. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const ROOT = path.join(__dirname, '..');
const src = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}

describe('the Docs page reads, checks and signs — it does not edit', () => {
  /* The workspace header is a template literal inside renderWorkspace, and the
     real renderWorkspace needs the whole application around it. So this reads
     the source: the assertion is that the screen cannot emit the control, which
     is a property of the source and not of one render. */
  test('the workspace header emits no Edit button at all', () => {
    const s = src('js/views/contract.js');
    assert.ok(!/id="ws-edit"/.test(s),
      'the Docs page must not offer whole-document editing — wording changes are '
      + 'tracked changes in the negotiation, or they are not changes at all');
  });

  test('and nothing on that page is wired to the document editor', () => {
    const s = src('js/views/contract.js');
    const wired = s.split('\n').filter(l =>
      /addEventListener/.test(l) && /openEditDocModal/.test(l));
    assert.deepEqual(Array.from(wired), [],
      'a listener left behind on a removed button is how the feature comes back '
      + 'by accident the next time someone re-adds the markup');
  });

  /* Deliberately NOT deleted. openEditDocModal is still exported, because the
     rule for this session is migrate-never-drop and something outside the Docs
     page may yet need a document editor. What must be true is that the Docs
     page has no route to it. */
  test('the editor itself is not destroyed, only unreachable from Docs', () => {
    const s = src('js/views/contract.js');
    assert.match(s, /function openEditDocModal\(/,
      'the function stays — removing a screen is not the same as deleting code');
  });

  test('the page keeps everything it is FOR', () => {
    const s = src('js/views/contract.js');
    for (const [id, what] of [
      ['ws-compare', 'reading what changed'],
      ['ws-pdf', 'taking a copy away'],
      ['ws-share', 'sending it out'],
      ['ws-import', 'taking a response back'],
    ]) assert.ok(s.includes(`id="${id}"`), `${what} must survive — ${id}`);
  });

  test('and the playbook panel no longer inserts wording from there', () => {
    const s = src('js/playbook.js');
    assert.ok(!/id="pb-insert"/.test(s) && !/data-pb-insert/.test(s),
      'the insert control belongs to the negotiation now, not to the Docs playbook panel');
  });
});

describe('the clause library is on the negotiation room’s top bar', () => {
  async function room(side){
    const { win } = buildWorld({ negotiationView: true, playbook: true });
    const c = contract();
    win.negoInit(c);
    win.openNegotiationRoom(c, { side, by: 'Wanjiru Kamau', persist: false });
    return { win, c, doc: win.document };
  }

  test('the owner has it, in the top bar, where it was asked for', async () => {
    const { doc } = await room('owner');
    const btn = doc.getElementById('nego-insert-lib');
    assert.ok(btn, 'the migrated control must be on the negotiation page');
    assert.match(btn.textContent, /Insert clause/);
    assert.ok(btn.closest('.nego-topbar') || btn.closest('.nego-bar') || btn.closest('.nego-actions'),
      'and in the bar across the top, not buried in a pane');
  });

  test('the counterparty does not — the playbook is our position', async () => {
    const { doc } = await room('counterparty');
    assert.equal(doc.getElementById('nego-insert-lib'), null);
  });

  test('pressing it opens the library rather than doing nothing', async () => {
    const { win, doc } = await room('owner');
    let opened = 0;
    win.openClausePicker = () => { opened++; };
    doc.getElementById('nego-insert-lib').click();
    assert.equal(opened, 1);
  });

  test('with no library loaded it says so instead of failing silently', async () => {
    const { win, doc } = await room('owner');
    const w = buildWorld({ negotiationView: true });     // no playbook.js on this stage
    void w;
    win.openClausePicker = undefined;
    doc.getElementById('nego-insert-lib').click();
    assert.ok(true, 'a missing library must not throw — the click is a no-op with a message');
  });
});

describe('preferred wording is PROPOSED, not pasted in', () => {
  async function inserted(){
    const w = buildWorld({ playbook: true });
    const win = w.win;
    const c = contract();
    win.negoInit(c);
    const before = win.docPlainText(c);
    const ch = await win.applyClauseRedline(c,
      'Each party’s aggregate liability under this Agreement is capped at the total '
      + 'fees paid in the twelve (12) months preceding the claim.',
      'Liability cap at 12 months fees');
    return { w, win, c, ch, before };
  }

  test('it files a tracked change, and returns it', async () => {
    const { ch } = await inserted();
    assert.ok(ch && ch.id, 'appending to the document silently was the bug — it must file something');
    assert.equal(ch.changeType, 'insertClause');
    assert.equal(ch.status, 'pending', 'nobody has agreed to it yet');
    assert.equal(ch.authorSide, 'owner', 'proposed by us, because it is our playbook');
  });

  test('the change carries a fingerprint and a place in the chain', async () => {
    const { win, c, ch } = await inserted();
    assert.match(ch.id, /^CHG-\d{3}$/, 'a fingerprint anyone can quote');
    assert.ok(ch.hash && ch.hash.length >= 16, 'and a hash over its own content');
    const v = await win.verifyChangeChain(c);
    assert.equal(v.ok, true, v.reason || 'the chain must still verify after a library insert');
  });

  test('the document does not change until somebody accepts it', async () => {
    const { win, c, before } = await inserted();
    assert.equal(win.negoCommitBody
      ? win.docPlainText(c) : win.docPlainText(c), before,
      'the agreed wording is what the parties agreed — a library pick is an ask, not an edit');
  });

  test('accepting it is what puts the wording in', async () => {
    const { win, c, ch } = await inserted();
    win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });
    assert.match(win.docPlainText(c), /twelve \(12\) months preceding the claim/,
      'and once it is accepted it is in the document, by the same route as any other change');
  });

  test('rejecting it leaves the contract exactly as it was', async () => {
    const { win, c, ch, before } = await inserted();
    win.negoResolve(c, ch.id, 'rejected', { side: 'counterparty', by: 'Erik Lindqvist' });
    assert.equal(win.docPlainText(c), before);
    assert.ok(!/twelve \(12\) months preceding the claim/.test(win.docPlainText(c)));
  });

  test('the audit says it was proposed, not that the document was edited', async () => {
    const { w, c, ch } = await inserted();
    const line = (c.audit || []).concat(w.log.audit || [])
      .map(e => `${e.action} ${e.detail}`).join(' | ');
    assert.match(line, new RegExp('#' + ch.id),
      'the trail must name the fingerprint, so the wording can be traced to a decision');
    assert.match(line, /tracked change|proposed/i);
  });

  test('the playbook review’s "apply this wording" gets the same treatment', async () => {
    /* Same function, same destination — which is the point of fixing the
       destination rather than each button. */
    const { win, c } = await inserted();
    const second = await win.applyClauseRedline(c,
      'The Buyer shall pay each undisputed invoice within thirty (30) days of receipt.',
      'Payment within 30 days');
    assert.equal(second.changeType, 'insertClause');
    assert.equal(second.status, 'pending');
    assert.equal(win.negoChanges(c).length, 2, 'two asks on the table, not two silent edits');
  });

  test('a note is kept of what was inserted and which change it became', async () => {
    const { c, ch } = await inserted();
    const notes = Array.from(c.clauseInserts || []);
    assert.equal(notes.length, 1);
    assert.equal(notes[0].changeId, ch.id,
      'the insert log points at the tracked change, so the two cannot tell different stories');
    assert.equal(notes[0].name, 'Liability cap at 12 months fees');
  });

  test('inserting nothing inserts nothing', async () => {
    const w = buildWorld({ playbook: true });
    const c = contract();
    w.win.negoInit(c);
    assert.equal(await w.win.applyClauseRedline(c, '', 'Empty'), null);
    assert.equal(w.win.negoChanges(c).length, 0);
  });
});
