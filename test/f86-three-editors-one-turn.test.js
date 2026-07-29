/* F86 — three colleagues, one clause, one turn.

   The lab's change model was built for two parties and quietly assumed one
   person behind each. "One live ask per clause per side" meant the second
   colleague to touch a clause OVERWROTE the first, and the record kept no sign
   that anyone had been overruled. On a real deal that is the contracts manager
   losing the carve-out the lawyer put in, finding out at signature, and having
   no way to show it was ever there.

   So a second hand STACKS. The same hand still revises — coming back to your own
   wording is changing your mind, not disagreeing with yourself — but a different
   userId opens a linked sub-change through parentChangeId, and the chain is the
   internal micro-history of how the clause got where it is.

   That history is INTERNAL, and publishing is where the two facts are reconciled:
   the counterparty is handed ONE diff per clause, measured from the last wording
   they agreed, and everything behind it stays home marked folded. They have to
   answer what the clause says now; watching us argue about it is not part of the
   offer.

   And the wall gets a second lock. `sent === true` is still the authority — that
   is the property f60 pins — with `stage === 'published'` alongside it, so a
   change travels only by passing both. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadLab(){
  const store = new Map();
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); }
  };
  const win = { FIRST_PARTY: 'Wanjiru Catering Ltd' };
  const ctx = vm.createContext({
    window: win, localStorage, JSON, Math, console,
    nowISO: () => '2026-07-28T14:30:00.000Z'
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8'),
    ctx, { filename: 'doclab.js' });
  win._store = store;
  return win;
}

/* The lab runs in its own vm realm, so an array it built carries that realm's
   Array prototype and assert's deep compare — which checks prototypes — reports
   a mismatch on two structurally identical values. Copying into this realm is
   what f60 does for the same reason. */
const plain = v => JSON.parse(JSON.stringify(v));

const BASE = 'The Supplier shall invoice monthly and the Customer shall pay within thirty (30) days.';
const CLAUSE = { clauseId: 'c12', headingText: 'Payment', text: BASE };

/* Three people on our side, with the roles the spec names. */
const SARAH = { userId: 'u1', name: 'Sarah Jenkins', organization: 'Wanjiru Catering Ltd', role: 'contributor' };
const PETER = { userId: 'u2', name: 'Peter Otieno',  organization: 'Wanjiru Catering Ltd', role: 'contributor' };
const NAOMI = { userId: 'u3', name: 'Naomi Kariuki', organization: 'Wanjiru Catering Ltd', role: 'approver' };

const newLab = () => ({ threads: [], changes: [], nextId: 1 });
const file = (lab, l, after, who, clauseId = 'c12') => lab.labFileChange(l, {
  clauseId, clauseLabel: 'Payment', before: BASE, after,
  side: 'owner', authorRef: who, author: who.name + ' · ' + who.organization });

const R1 = BASE.replace('thirty (30) days', 'sixty (60) days');
const R2 = R1.replace('sixty (60) days', 'sixty (60) days of the invoice date');
const R3 = R2 + ' Interest accrues at 1.5% per month on late payment.';

describe('F86a — a second hand stacks rather than overwrites', () => {
  let lab, l;
  beforeEach(() => { lab = loadLab(); l = newLab(); });

  test('the same person revising is one change, as it always was', () => {
    const a = file(lab, l, R1, SARAH);
    const b = file(lab, l, R2, SARAH);
    assert.equal(l.changes.length, 1, 'changing your own mind is not a disagreement');
    assert.equal(a.id, b.id);
    assert.equal(b.revised, 1);
    assert.equal(b.parentChangeId, null);
  });

  test('a different person stacks, and the link records what it is built on', () => {
    const a = file(lab, l, R1, SARAH);
    const b = file(lab, l, R2, PETER);
    assert.equal(l.changes.length, 2, 'Peter did not erase Sarah');
    assert.equal(b.parentChangeId, a.id);
    assert.equal(b.depth, 1);
    assert.equal(a.after, R1, 'and Sarah’s wording is still exactly what she wrote');
  });

  test('three hands make a chain of three, in the order they touched it', () => {
    file(lab, l, R1, SARAH);
    file(lab, l, R2, PETER);
    const head = file(lab, l, R3, NAOMI);
    const chain = lab.labChainOf(l.changes, head.id);
    assert.deepEqual(plain(chain.map(x => x.authorRef.name)),
      ['Sarah Jenkins', 'Peter Otieno', 'Naomi Kariuki']);
    assert.equal(head.depth, 2);
  });

  /* Every change is still measured from the SETTLED wording, not from the draft
     it was stacked on. That is what keeps rejection a clean return. */
  test('every change in the stack is a diff from the baseline', () => {
    file(lab, l, R1, SARAH);
    file(lab, l, R2, PETER);
    const head = file(lab, l, R3, NAOMI);
    for (const ch of lab.labChainOf(l.changes, head.id))
      assert.equal(ch.before, BASE, `${ch.id} must be measured from the settled wording`);
  });

  test('the head of the stack is what the clause reads as, not the first entry', () => {
    file(lab, l, R1, SARAH);
    file(lab, l, R2, PETER);
    assert.equal(lab.labPendingOn(l.changes, 'c12', 'owner').after, R2,
      'showing the oldest draft would hide the team’s own latest pass');
    assert.equal(lab.labWorkingText(CLAUSE, l.changes, 'owner').working, R2);
  });

  test('a chain that points at itself is bounded rather than hanging the page', () => {
    const a = file(lab, l, R1, SARAH);
    a.parentChangeId = a.id;                       // corrupt it on purpose
    const chain = lab.labChainOf(l.changes, a.id);
    assert.equal(chain.length, 1, 'a cycle must terminate, not spin');
  });

  test('authorship is a record, and an unknown role is the least capable one', () => {
    const ref = lab.labAuthorOf({ id: 'u9', name: 'Zawadi Mwangi', labRole: 'wizard' }, 'owner', {});
    assert.equal(ref.userId, 'u9');
    assert.equal(ref.name, 'Zawadi Mwangi');
    assert.equal(ref.organization, 'Wanjiru Catering Ltd');
    assert.equal(ref.role, 'contributor',
      'an unrecognised role must not be read as approver — that is the one that can publish');
  });

  test('initials are two letters, and cope with the shapes real names come in', () => {
    assert.equal(lab.labInitials('Sarah Jenkins'), 'SJ');
    assert.equal(lab.labInitials('Naomi'), 'NA');
    assert.equal(lab.labInitials('  Peter   Kimani  Otieno '), 'PO', 'first and last, not middle');
    assert.equal(lab.labInitials(''), '??');
    assert.equal(lab.labInitials(null), '??');
  });
});

describe('F86b — publishing collapses the argument into an offer', () => {
  let lab, l;
  beforeEach(() => {
    lab = loadLab(); l = newLab();
    file(lab, l, R1, SARAH);
    file(lab, l, R2, PETER);
    file(lab, l, R3, NAOMI);
  });

  test('three internal drafts go out as one change', () => {
    const out = lab.labPublishRound(l, 'owner', { name: 'Naomi Kariuki' }, {});
    assert.equal(out.published.length, 1, 'one clause, one question to answer');
    assert.equal(out.folded.length, 2);
    assert.equal(lab.labShareChanges(l.changes).length, 1,
      'the counterparty is handed one diff, not our drafting order');
  });

  test('the wording that goes out is the head’s, measured from the baseline', () => {
    lab.labPublishRound(l, 'owner', NAOMI, {});
    const sent = lab.labShareChanges(l.changes)[0];
    assert.equal(sent.before, BASE);
    assert.equal(sent.after, R3, 'unchanged — publishing consolidates, it does not rewrite');
  });

  test('the folded drafts stay in the record and go nowhere', () => {
    lab.labPublishRound(l, 'owner', NAOMI, {});
    const folded = l.changes.filter(x => x.status === 'folded');
    assert.equal(folded.length, 2);
    for (const f of folded){
      assert.equal(f.stage, 'folded');
      assert.equal(f.sent, false, 'folded work was never sent and must not become sent');
    }
    const wire = JSON.stringify(lab.labShareChanges(l.changes));
    assert.ok(!wire.includes('sixty (60) days.'),
      'Sarah’s superseded wording must not be reconstructible from the payload');
  });

  test('a folded draft is no longer something the other side can decide', () => {
    lab.labPublishRound(l, 'owner', NAOMI, {});
    const folded = l.changes.find(x => x.status === 'folded');
    assert.equal(lab.labCanDecide(folded, 'counterparty'), false,
      'answering an overtaken draft would decide a question nobody is still asking');
  });

  test('the published change names the hands behind it, at home only', () => {
    lab.labPublishRound(l, 'owner', NAOMI, {});
    const head = l.changes.find(x => x.stage === 'published');
    assert.deepEqual(plain(head.roundHands), ['Sarah Jenkins', 'Peter Otieno', 'Naomi Kariuki']);
    assert.equal(head.foldedFrom.length, 2);
    const wire = JSON.stringify(lab.labShareChanges(l.changes));
    for (const nm of ['Sarah Jenkins', 'Peter Otieno'])
      assert.ok(!wire.includes(nm), `${nm} worked on this internally and is not in the payload`);
  });

  test('two clauses each collapse on their own', () => {
    const l2 = newLab();
    file(lab, l2, R1, SARAH);
    file(lab, l2, R2, PETER);
    lab.labFileChange(l2, { clauseId: 'c7', clauseLabel: 'Term', before: 'One year.',
      after: 'Two years.', side: 'owner', authorRef: NAOMI, author: 'Naomi' });
    const out = lab.labPublishRound(l2, 'owner', NAOMI, {});
    assert.equal(out.published.length, 2);
    assert.equal(out.folded.length, 1, 'only the stacked clause had anything to fold');
    assert.equal(out.clauses, 2);
  });

  test('publishing an empty desk does nothing and says so', () => {
    const empty = newLab();
    const out = lab.labPublishRound(empty, 'owner', NAOMI, {});
    assert.deepEqual(plain(out.published), []);
    assert.deepEqual(plain(out.folded), []);
  });

  test('publishing does not touch the other side’s drafts', () => {
    const theirs = lab.labFileChange(l, { clauseId: 'c9', clauseLabel: 'Law',
      before: 'Kenya.', after: 'England.', side: 'counterparty',
      authorRef: { userId: 'x1', name: 'Erik Lund', organization: 'Nordic', role: 'approver' },
      author: 'Erik Lund' });
    lab.labPublishRound(l, 'owner', NAOMI, {});
    assert.equal(theirs.sent, false, 'our turn is ours to send — theirs is not ours to send for them');
    assert.equal(theirs.stage, 'internal_draft');
  });

  test('publishing twice does not re-send or re-fold anything', () => {
    lab.labPublishRound(l, 'owner', NAOMI, {});
    const again = lab.labPublishRound(l, 'owner', NAOMI, {});
    assert.deepEqual(plain(again.published), [], 'nothing is waiting the second time');
    assert.equal(lab.labShareChanges(l.changes).length, 1);
  });
});

describe('F86c — the second lock on the wall', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  test('a change is born into the internal sandbox', () => {
    const l = newLab();
    const ch = file(lab, l, R1, SARAH);
    assert.equal(ch.stage, 'internal_draft');
    assert.equal(ch.sent, false);
    assert.equal(lab.labShareChanges(l.changes).length, 0);
  });

  /* THE POINT OF TWO LOCKS. Each one alone is a single point of failure, and the
     failure mode the whole lab exists to prevent is exactly a flag that was
     never set reading as permission. */
  test('sent without a published stage does not travel', () => {
    assert.equal(lab.labShareChanges([{ id: 'L-001', sent: true, after: 'secret' }]).length, 0,
      'a stage nobody set must not be read as published');
    assert.equal(lab.labShareChanges([{ id: 'L-001', sent: true, stage: 'internal_draft', after: 'secret' }]).length, 0);
    assert.equal(lab.labShareChanges([{ id: 'L-001', sent: true, stage: 'folded', after: 'secret' }]).length, 0);
  });

  test('a published stage without sent does not travel either', () => {
    for (const v of [false, undefined, null, 0, 'yes', 1])
      assert.equal(lab.labShareChanges([{ id: 'L-001', sent: v, stage: 'published', after: 'secret' }]).length, 0,
        `sent=${JSON.stringify(v)} must not be treated as sent, whatever the stage says`);
  });

  test('both locks open together and only together', () => {
    const l = newLab();
    const ch = file(lab, l, R1, SARAH);
    lab.labSendChange(l, ch.id);
    assert.equal(ch.sent, true);
    assert.equal(ch.stage, 'published', 'sending one change is publishing it');
    assert.equal(lab.labShareChanges(l.changes).length, 1);
  });

  test('a misspelt stage stays home', () => {
    for (const v of ['Published', 'PUBLISHED', 'public', 'sent', '', ' published'])
      assert.equal(lab.labShareChanges([{ id: 'L-001', sent: true, stage: v, after: 'secret' }]).length, 0,
        `stage ${JSON.stringify(v)} must not be treated as published`);
  });

  /* A record written before the stage existed must not have its already-sent
     changes silently withdrawn from a live negotiation. */
  test('records written before stages existed are migrated on read, not broken', () => {
    const legacy = [
      { id: 'L-001', sent: true,  after: 'on the table' },
      { id: 'L-002', sent: false, after: 'still a draft' }
    ];
    lab.labMigrateChanges(legacy);
    assert.equal(legacy[0].stage, 'published', 'what was sent stays sent');
    assert.equal(legacy[1].stage, 'internal_draft');
    assert.equal(lab.labShareChanges(legacy).length, 1);
  });

  test('migration reads the old truth and does not invent permission', () => {
    const legacy = [{ id: 'L-001', after: 'never sent' }];
    lab.labMigrateChanges(legacy);
    assert.equal(legacy[0].stage, 'internal_draft',
      'no sent flag meant not sent, and it still does');
    assert.equal(lab.labShareChanges(legacy).length, 0);
  });

  test('migration leaves a stage that is already set alone', () => {
    const rec = [{ id: 'L-001', sent: true, stage: 'folded', after: 'x' }];
    lab.labMigrateChanges(rec);
    assert.equal(rec[0].stage, 'folded', 'a folded change must not be promoted by a migration');
  });

  test('internal authorship never reaches the payload', () => {
    const l = newLab();
    const ch = file(lab, l, R1, SARAH);
    lab.labSendChange(l, ch.id);
    const wire = lab.labShareChanges(l.changes)[0];
    assert.equal(wire.authorRef, undefined, 'our user ids and roles are not theirs to have');
    assert.equal(wire.parentChangeId, undefined);
    assert.equal(wire.stage, undefined, 'nor our internal staging vocabulary');
  });
});

describe('F86d — notes are coloured by the hand that wrote them', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  test('a note records the side that wrote it', () => {
    const l = newLab();
    const ch = file(lab, l, R1, SARAH);
    const t = lab.labTagChange(l, ch.id, 'Do not concede this', { side: 'owner' });
    assert.equal(t.side, 'owner');
    const t2 = lab.labTagChange(l, ch.id, 'We can live with it', { side: 'counterparty' });
    assert.equal(t2.side, 'counterparty');
  });

  test('an unmarked note defaults to ours, which is the safer of the two', () => {
    const l = newLab();
    const ch = file(lab, l, R1, SARAH);
    const t = lab.labTagChange(l, ch.id, 'no side given');
    assert.equal(t.side, 'owner',
      'mistaking our own note for theirs would have a reader answer a colleague as the opposition');
  });

  test('and it is still internal by default — visibility is a separate question', () => {
    const l = newLab();
    const ch = file(lab, l, R1, SARAH);
    assert.equal(lab.labTagChange(l, ch.id, 'x', { side: 'counterparty' }).visibility, 'internal',
      'who wrote it must not decide who can see it');
  });
});
