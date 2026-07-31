/* ============================================================
   f106 — an executed contract takes no new edits
   ============================================================
   MK-248 was reported Executed, with the status chip reading Executed at the
   top of the page, and its clause body carried a live Save change bar, a Direct
   Edit button and a Propose deletion button. The edit filed.

   THE RULE EXISTED AND GUARDED HALF THE DOOR. negoResolve has carried the
   signed door for a long time — an executed record takes no new DECISIONS,
   however it came to be executed. negoFileChange, which is where every authored
   change is written, asked nothing at all. So the product's real rule was: you
   may not rule on a change to a signed agreement, but you may author one.

   WHAT THAT COSTS. negoCommitBody rewrites c.body, which is the text the seal
   was computed over, while execution.html keeps the wording that was actually
   signed. An edit after execution therefore walks the live document away from
   the sealed evidence in silence. Afterwards either verifySeal reports a break
   on a contract nobody tampered with, or the screen shows wording the sealed
   evidence does not contain. The seal is the product's entire claim; a seal
   that can be walked away from is not one.

   THREE SIGNALS, NOT ONE. `status === 'Signed'` is not the test. A contract
   carrying a seal (`hash`) or an execution stamp (`execution.at`) is executed
   whatever its status field says, and negoExecuted exists precisely so that
   narrowing cannot creep back in — it already had once, when the Word round
   trip was removed and took wordDoorClosed() with it.

   THE REGRESSION THAT WOULD HURT MOST is a lock that over-fires. A drafting
   product whose drafts cannot be edited is worse than one that lets a signed
   contract be touched, because it fails for everybody every day. "a draft is
   untouched by all of it" is asserted first, and deliberately.

   BOTH THE LOCK AND THE SIGN. negoFileChange refuses the write; renderRedline
   and the room mount stop rendering the verbs. Either alone is wrong: a sign
   with no lock is cosmetics, and a lock with no sign is a button that errors at
   a reader who should never have been offered it. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

function protoContract(over = {}){
  return { id: 'MK-248', name: 'Customer Information Request',
    counterparty: 'Brut Africa Ltd', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}

/* The three ways a contract can be executed, each on its own, so no test can
   pass by accident on a record that happens to carry two of them. */
const EXECUTED = [
  ['status Signed', { status: 'Signed' }],
  ['a seal', { hash: 'a'.repeat(64) }],
  ['an execution stamp', { execution: { at: '2026-07-30T09:00:00.000Z' } }],
];

/* A snapshot deep enough to prove "wrote nothing" rather than "wrote nothing
   visible" — the change list, the body the seal covers, and the versions. */
function snapshot(win, c){
  return JSON.stringify({
    changes: c.changes || null,
    body: c.redlineText || null,
    versions: c.versions || null,
    audit: c.audit || null,
  });
}

/* ============================================================
   0 — the regression that would hurt most: drafts still work
   ============================================================ */
describe('a draft contract is untouched by the lock', () => {
  const W = buildWorld();
  const win = W.win;

  test('negoExecuted is false for an ordinary draft', () => {
    assert.equal(win.negoExecuted(protoContract()), false);
  });

  test('a draft still files a modify', async () => {
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0];
    const ch = await win.negoEditClause(c, cl.clauseId,
      { newText: cl.text + ' Amended by agreement.' },
      { side: 'counterparty', author: 'Moses Kurua · Brut Africa Ltd' });
    assert.ok(ch, 'a draft must still accept an authored change');
    assert.equal(c.changes.length, 1);
  });

  test('a draft still files an insertion and a deletion', async () => {
    const c = protoContract();
    win.negoInit(c);
    const list = win.negoClauseList(c);
    const ins = await win.negoInsertClause(c, list[0].clauseId,
      { headingText: 'New Clause', bodyHtml: '<p>Added wording.</p>' },
      { side: 'owner', author: 'Wanjiru Kamau' });
    assert.ok(ins, 'a draft must still accept an insertion');
    const del = await win.negoDeleteClause(c, list[1].clauseId,
      { side: 'counterparty', author: 'Moses Kurua · Brut Africa Ltd' });
    assert.ok(del, 'a draft must still accept a proposed deletion');
  });
});

/* ============================================================
   1 — negoExecuted reads all three signals
   ============================================================ */
describe('negoExecuted answers about the record, not about the status field', () => {
  const W = buildWorld();
  const win = W.win;

  for (const [label, over] of EXECUTED){
    test(`a contract with ${label} is executed`, () => {
      assert.equal(win.negoExecuted(protoContract(over)), true,
        `${label} alone must be enough — narrowing this to status === 'Signed' is the bug`);
    });
  }

  test('the numbering lock asks the same question', () => {
    for (const [, over] of EXECUTED)
      assert.equal(win.negoNumberingLocked(protoContract(over)), true);
    assert.equal(win.negoNumberingLocked(protoContract()), false);
  });
});

/* ============================================================
   2 — THE LOCK: no authored change of any type, by any signal
   ============================================================ */
describe('an executed contract files no authored change', () => {
  for (const [label, over] of EXECUTED){
    describe(`executed by ${label}`, () => {
      const W = buildWorld();
      const win = W.win;

      test('a modify is refused and writes nothing', async () => {
        const draft = protoContract();
        win.negoInit(draft);
        const cl = win.negoClauseList(draft)[0];

        const c = protoContract(over);
        win.negoInit(c);
        const before = snapshot(win, c);
        const ch = await win.negoEditClause(c, cl.clauseId,
          { newText: 'Rewritten after signature.' },
          { side: 'owner', author: 'Wanjiru Kamau' });
        assert.equal(ch, null, 'the change must be refused');
        assert.equal(snapshot(win, c), before,
          'refused is not enough — the record must be byte-identical afterwards');
      });

      test('an insertion is refused and writes nothing', async () => {
        const c = protoContract(over);
        win.negoInit(c);
        const before = snapshot(win, c);
        const ch = await win.negoInsertClause(c, null,
          { headingText: 'Slipped In', bodyHtml: '<p>After the fact.</p>' },
          { side: 'owner', author: 'Wanjiru Kamau' });
        assert.equal(ch, null);
        assert.equal(snapshot(win, c), before);
      });

      test('a deletion is refused and writes nothing', async () => {
        const draft = protoContract();
        win.negoInit(draft);
        const target = win.negoClauseList(draft)[1].clauseId;

        const c = protoContract(over);
        win.negoInit(c);
        const before = snapshot(win, c);
        const ch = await win.negoDeleteClause(c, target,
          { side: 'counterparty', author: 'Moses Kurua · Brut Africa Ltd' });
        assert.equal(ch, null);
        assert.equal(snapshot(win, c), before);
      });
    });
  }
});

/* ============================================================
   3 — the counterparty's seat is not a way round it
   ============================================================
   The report came from the owner's screen, but the lock belongs to the record,
   not to the seat. A counterparty holding a live link to a contract that was
   executed while they had it open must be refused by the same rule. */
describe('the lock does not depend on which side is asking', () => {
  const W = buildWorld();
  const win = W.win;

  test('the counterparty cannot file against an executed contract either', async () => {
    const draft = protoContract();
    win.negoInit(draft);
    const cl = win.negoClauseList(draft)[0];

    const c = protoContract({ hash: 'b'.repeat(64) });
    win.negoInit(c);
    const before = snapshot(win, c);
    const ch = await win.negoEditClause(c, cl.clauseId,
      { newText: 'Their late edit.' },
      { side: 'counterparty', author: 'Moses Kurua · Brut Africa Ltd' });
    assert.equal(ch, null);
    assert.equal(snapshot(win, c), before);
  });
});

/* ============================================================
   4 — a change filed BEFORE execution is not retro-refused
   ============================================================
   The lock stops new writes. It must not reach backwards and invalidate the
   record of what was agreed on the way to signature — that record is the
   evidence the product exists to keep. */
describe('the lock is about new writes, not about existing history', () => {
  const W = buildWorld();
  const win = W.win;

  test('changes filed before execution survive it intact', async () => {
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0];
    const ch = await win.negoEditClause(c, cl.clauseId,
      { newText: cl.text + ' As agreed in round one.' },
      { side: 'counterparty', author: 'Moses Kurua · Brut Africa Ltd' });
    assert.ok(ch);
    win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });

    const historyBefore = JSON.stringify(c.changes);
    c.status = 'Signed';
    c.execution = { at: '2026-07-31T10:00:00.000Z' };

    assert.equal(JSON.stringify(c.changes), historyBefore,
      'executing must not rewrite the record of how the contract got there');
    assert.equal(c.changes.length, 1);
    assert.equal(c.changes[0].status, 'accepted');
  });
});

/* ============================================================
   5 — THE SIGN: the workbench renders no verb on an executed contract
   ============================================================ */
describe('the executed workbench offers nothing to press', () => {
  /* The verbs that must not appear. Each is a real id in the workbench: the AI
     and library controls, the draft saver, and the bulk verbs. */
  const VERBS = ['nego-copilot', 'nego-insert-lib', 'nego-save-draft',
    'nego-bulk-acc', 'nego-all-acc', 'nego-all-rej'];

  /* The page as the router renders it, per the f89 stage: the redline view
     needs state, a getContract, and the share layer stood in for. */
  async function render(over = {}){
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    const c = protoContract(over);
    win.cachedShares = () => [];
    win.openShareModal = () => {};
    win.counterpartyContact = () => null;
    win.negoInit(c);
    win.state = Object.assign({}, win.state,
      { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    win.renderRedline();
    return { html: win.document.getElementById('content').innerHTML, c, win };
  }

  test('a draft workbench renders its verbs (the control)', async () => {
    const { html } = await render();
    assert.ok(html.length > 500, 'the draft workbench must actually render');
    assert.ok(/rl-shell|nego-doc/.test(html),
      'the control must show a real workbench, or the executed assertion proves nothing');
    assert.ok(VERBS.some(id => html.includes(`id="${id}"`)),
      'at least one verb must render on a draft — otherwise the executed test passes vacuously');
  });

  test('an executed workbench renders no editing verb', async () => {
    const { html } = await render({ status: 'Signed', execution: { at: '2026-07-31T10:00:00.000Z' } });
    for (const id of VERBS)
      assert.ok(!html.includes(`id="${id}"`),
        `#${id} must not render on an executed contract`);
    assert.ok(!/contenteditable="true"/.test(html),
      'no editable surface may render on an executed contract');
  });

  test('a seal alone closes the workbench, with no Signed status', async () => {
    const { html } = await render({ hash: 'c'.repeat(64) });
    for (const id of VERBS)
      assert.ok(!html.includes(`id="${id}"`),
        `#${id} must not render on a sealed contract whose status still reads Under Review`);
  });

  test('the executed workbench says why, rather than going silent', async () => {
    const { html } = await render({ status: 'Signed', execution: { at: '2026-07-31T10:00:00.000Z' } });
    assert.ok(/executed|sealed/i.test(html),
      'a reader who expected to edit must be told the contract is sealed');
  });
});
