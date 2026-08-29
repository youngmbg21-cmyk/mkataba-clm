/* ============================================================
   f249 — a clause's name is part of the clause
   ============================================================
   Owner-asked 28 Aug 2026: "the ability to edit the name of the header."

   A contract is CITED by its headings — "subject to Clause 9", "the limits in
   Section 4" — so proposing “Charges” where the document says “Payment Terms”
   is a change to the agreement and not a caption on a screen. Until now it was
   the one part of a clause nothing could move: `headingText` was carried and
   applied for an insertClause ONLY, so a clause that already existed had a name
   nobody could propose against.

   WHAT IS PINNED HERE, and every one of them is a rule rather than a look:
     1  it files through the ONE funnel — no new act, no new record, no new
        store, and every guard the funnel carries applies without being repeated
     2  a rename with no wording change is a real change, and says so honestly
     3  a name equal to the one the clause has is NOT a rename
     4  taking a rename back is Withdraw, not an empty ask left on the column
     5  the fingerprint covers it (v5), and every older format still verifies
     6  accepting it moves the DOCUMENT's heading and keeps the clause's id
     7  both document renderers draw it, and both honour the reading
     8  a clause whose wording did not move keeps its own markup
     9  it travels to the other side
    10 the two editors that offer it, and the one that deliberately does not
    11 both languages
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const NEGO_SRC = read('js/negotiation.js');
const VIEW_SRC = read('js/views/negotiation.js');
const CE_SRC = read('js/views/clauseeditor.js');
const CORE_SRC = read('js/core.js');
const I18N = read('js/i18n.js');

function protoContract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
/* A contract with clause 4 in front of us, and the world that can draw it. */
function stage(opts = {}){
  const { win } = buildWorld({ negotiationView: true, contractView: true, ...opts });
  const c = protoContract();
  win.negoInit(c);
  const cl = win.negoClauseList(c).find(x => x.num === '4');
  assert.ok(cl && cl.headingText, 'the fixture must give clause 4 a heading to rename');
  return { win, c, cl };
}
const rename = (win, c, cl, to, over = {}) => win.negoEditClause(c, cl.clauseId,
  over.bodyHtml || cl.bodyHtml,
  { side: 'owner', author: 'Amina Odhiambo', headingText: to, ...over.opts });

describe('f249 (1) — it files through the one funnel', () => {
  test('a rename is an ordinary modify on the ordinary record', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, 'Clause 4 · Charges');
    assert.ok(ch, 'a rename files a change');
    assert.equal(ch.changeType, 'modify', 'and it is a modify — no new kind was invented');
    assert.equal(ch.clauseId, cl.clauseId, 'anchored on the clause it renames');
    assert.equal(ch.headingText, 'Clause 4 · Charges');
    assert.equal(ch.status, 'pending');
    assert.equal(win.negoChanges(c).length, 1, 'one record, not two');
  });

  test('no second filing path exists for it', () => {
    /* The rulebook's own rule: guards that must apply to ALL changes live in
       the funnel. A rename that reached the record any other way would skip the
       executed-wording freeze, the desk rule and the review gate. */
    const code = strip(NEGO_SRC);
    const doors = (code.match(/headingText/g) || []).length;
    assert.ok(doors > 0, 'the field is carried');
    assert.ok(!/changes\.push\(/.test(strip(CE_SRC)),
      'the clause editor never pushes a change of its own');
    assert.match(strip(CE_SRC), /negoEditClause\(c, clauseId, html, o\)/,
      'it files through the funnel door and nothing else');
  });

  test('an executed contract refuses it, like every other change', async () => {
    const { win, c, cl } = stage();
    c.status = 'Signed';
    const ch = await rename(win, c, cl, 'Clause 4 · Charges');
    assert.equal(ch, null, 'the wording freeze covers a name as well as words');
  });
});

describe('f249 (2) — a rename with no wording change is a real change', () => {
  test('it files, it is not flagged formatting-only, and it says what moved', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, 'Clause 4 · Charges');
    assert.equal(ch.formattingOnly, false, 'a rename is not a formatting change');
    assert.equal(win.negoWordsMoved(ch), false, 'and the words did not move');
    assert.match(ch.summary, /Heading changed/,
      'the record says what moved, rather than the "Wording changed" fallback');
    assert.match(ch.summary, /Payment Terms/);
    assert.match(ch.summary, /Charges/);
  });

  test('a rename and a rewording in one press say both', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, 'Clause 4 · Charges',
      { bodyHtml: '<p>Payable within forty-five (45) days.</p>' });
    assert.equal(win.negoWordsMoved(ch), true);
    assert.match(ch.summary, /heading/, 'the summary names the rename');
    assert.match(ch.summary, /45/, 'and still names the wording');
  });

  test('a clause nobody touched still files nothing', async () => {
    const { win, c, cl } = stage();
    const ch = await win.negoEditClause(c, cl.clauseId, cl.bodyHtml,
      { side: 'owner', author: 'Amina Odhiambo' });
    assert.equal(ch, null, 'the no-op guard is not loosened by this feature');
  });
});

describe('f249 (3) — the name it already has is not a rename', () => {
  test('typing the same name files nothing', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, cl.headingText);
    assert.equal(ch, null);
    assert.equal(win.negoChanges(c).length, 0);
  });

  test('and negoHeadingAsk answers null for it', async () => {
    const { win, c, cl } = stage();
    assert.equal(win.negoHeadingAsk(cl, { changeType: 'modify', headingText: cl.headingText }), null,
      'the same name is not an ask');
    assert.equal(win.negoHeadingAsk(cl, { changeType: 'modify', headingText: '' }), null,
      'and an empty one says nothing at all');
    /* Field by field: the object comes back from the jsdom realm, so a
       deep-equal against a literal built here fails on identity alone. */
    const ask = win.negoHeadingAsk(cl, { changeType: 'modify', headingText: 'Charges' });
    assert.equal(ask.from, cl.headingText);
    assert.equal(ask.to, 'Charges');
  });
});

describe('f249 (4) — taking a rename back is Withdraw', () => {
  test('typing the original name back is refused, and the ask stands', async () => {
    const { win, c, cl } = stage();
    const a = await rename(win, c, cl, 'Clause 4 · Charges');
    assert.ok(a);
    const b = await rename(win, c, cl, cl.headingText);
    assert.equal(b, null, 'refused, exactly as reverting the WORDING already is');
    const live = win.negoChanges(c).find(x => x.id === a.id);
    assert.equal(live.headingText, 'Clause 4 · Charges',
      'the rename is still on the record — an empty ask is never left on the column');
  });

  test('revising the wording alongside it can still clear the rename', async () => {
    const { win, c, cl } = stage();
    await rename(win, c, cl, 'Clause 4 · Charges');
    const b = await rename(win, c, cl, cl.headingText,
      { bodyHtml: '<p>Payable within forty-five (45) days.</p>' });
    assert.ok(b, 'the wording moved, so this is a real revision');
    assert.equal(b.headingText, '', 'and it stops claiming a rename');
    assert.equal(b.revisions.length, 1, 'the earlier wording is on the record');
  });
});

describe('f249 (5) — the fingerprint covers it', () => {
  test('the heading is inside the canonical string', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, 'Clause 4 · Charges');
    const input = win.negoHashInput(c.id, ch);
    assert.match(input, /^hati-change-v5/, 'v5 is what this build writes');
    assert.ok(input.includes('Clause 4 · Charges'),
      'and the proposed name is in the string the fingerprint is taken over');
    const without = win.negoHashInput(c.id, { ...ch, headingText: 'Clause 4 · Fees' });
    assert.notEqual(input, without,
      'two renames of one clause cannot share a fingerprint');
  });

  test('every older format still verifies in the same chain', async () => {
    const { win, c, cl } = stage();
    const cl5 = win.negoClauseList(c).find(x => x.num === '5');
    const a = await win.negoEditClause(c, cl5.clauseId, '<p>Sixty (60) days.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    /* Rewritten as an old build would have written it. */
    a.hashV = 4; a.hash = await win.negoHash(c.id, a);
    c.negotiation.chainHead = a.hash;
    const b = await rename(win, c, cl, 'Clause 4 · Charges');
    assert.equal(b.hashV, 5);
    assert.equal(b.prevChangeHash, a.hash, 'the v5 record chains onto the v4 one');
    const v = await win.verifyChangeChain(c);
    assert.equal(v.ok, true, `a mixed-version chain verifies: ${v.detail}`);
    assert.ok(win.NEGO_HASH_VERIFIES.has(2) && win.NEGO_HASH_VERIFIES.has(3)
      && win.NEGO_HASH_VERIFIES.has(4) && win.NEGO_HASH_VERIFIES.has(5),
      'a bump must never accuse an existing contract of tampering');
  });

  test('tampering with the name is caught', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, 'Clause 4 · Charges');
    ch.headingText = 'Clause 4 · Fees';
    const v = await win.verifyChangeChain(c);
    assert.equal(v.ok, false);
    assert.equal(v.reason, 'content-altered');
  });
});

describe('f249 (6) — accepting it moves the document', () => {
  test('the heading changes and the clause keeps its id and its wording', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, 'Clause 4 · Charges');
    await win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty' });
    const now = win.clauseSegment(win.negoResolvedBody(c))
      .find(x => x.clauseId === cl.clauseId);
    assert.ok(now, 'the clause is still there under the SAME id — every change '
      + 'already filed against it still points at it');
    assert.equal(now.headingText, 'Clause 4 · Charges');
    assert.ok(String(now.bodyHtml || '').includes('thirty (30) days'),
      'and its wording is untouched');
  });

  test('rejecting it leaves the name alone', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, 'Clause 4 · Charges');
    await win.negoResolve(c, ch.id, 'rejected', { side: 'counterparty', reply: 'No' });
    const now = win.clauseSegment(win.negoResolvedBody(c))
      .find(x => x.clauseId === cl.clauseId);
    assert.equal(now.headingText, cl.headingText, 'silence rejects, and so does a refusal');
  });
});

describe('f249 (7) — both renderers draw it, and both honour the reading', () => {
  const headingOf = (html, needle) =>
    (html.match(/<h4 class="rl-clause-h">[\s\S]{0,300}?<\/h4>/g) || [])
      .find(x => x.includes(needle)) || '';
  const roomHeadingOf = (html, needle) =>
    (html.match(/<h2 data-nego-chrome>[\s\S]{0,320}?<\/h2>/g) || [])
      .find(x => x.includes(needle)) || '';

  test('the redlined reading shows the old name struck and the new one added', async () => {
    const { win, c, cl } = stage();
    await rename(win, c, cl, 'Clause 4 · Charges');
    win.rlSetReadMode('marks');
    const h = headingOf(win.redlineDocHtml(c, { side: 'owner' }), 'Charges');
    assert.match(h, /nego-del[^>]*>Clause 4 · Payment Terms/, 'the name it had, struck');
    assert.match(h, /nego-ins[^>]*>Clause 4 · Charges/, 'the name proposed, added');
  });

  test('as agreed keeps the name the clause has; with changes shows the new one', async () => {
    const { win, c, cl } = stage();
    await rename(win, c, cl, 'Clause 4 · Charges');
    win.rlSetReadMode('agreed');
    const agreed = win.redlineDocHtml(c, { side: 'owner' });
    assert.ok(agreed.includes('Clause 4 · Payment Terms'), 'as agreed = what it says today');
    assert.ok(!/nego-ins[^>]*>Clause 4 · Charges/.test(agreed), 'and no proposed name');
    win.rlSetReadMode('proposed');
    const proposed = win.redlineDocHtml(c, { side: 'owner' });
    assert.ok(proposed.includes('Clause 4 · Charges'), 'with changes = the name proposed');
    assert.ok(!/nego-del[^>]*>Clause 4 · Payment Terms/.test(proposed), 'drawn plainly');
    win.rlSetReadMode('marks');
  });

  test('the room draws the same reading in its own clothes', async () => {
    const { win, c, cl } = stage();
    await rename(win, c, cl, 'Clause 4 · Charges');
    win.rlSetReadMode('marks');
    const h = roomHeadingOf(win.negoDocHtml(c, { side: 'owner' }), 'Charges');
    assert.match(h, /nego-del/, 'the two canvases agree that a name moved');
    assert.match(h, /nego-ins/);
  });

  test('a settled rename keeps its marks in every reading', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, 'Clause 4 · Charges');
    await win.negoResolve(c, ch.id, 'rejected', { side: 'counterparty', reply: 'No' });
    for (const mode of ['marks', 'agreed', 'proposed']){
      win.rlSetReadMode(mode);
      const h = headingOf(win.redlineDocHtml(c, { side: 'owner' }), 'Charges');
      assert.match(h, /nego-del/, `a refused rename still says so under "${mode}"`);
    }
    win.rlSetReadMode('marks');
  });
});

describe('f249 (8) — a clause whose words did not move keeps its markup', () => {
  test('the paper draws the clause itself, not its text projection', async () => {
    const { win, c } = stage();
    /* A clause with real structure in it — a list — so a flattening shows. */
    const cl = win.negoClauseList(c).find(x => /<(ol|ul|li)/i.test(String(x.bodyHtml || '')))
      || win.negoClauseList(c).find(x => x.num === '5');
    const ch = await win.negoEditClause(c, cl.clauseId, cl.bodyHtml,
      { side: 'owner', author: 'Amina Odhiambo', headingText: 'A different name entirely' });
    assert.ok(ch, 'the rename files');
    win.rlSetReadMode('marks');
    const html = win.redlineDocHtml(c, { side: 'owner' });
    const block = html.split('data-clause="' + cl.clauseId + '"')[1] || '';
    const body = block.slice(0, 4000);
    assert.ok(!/nego-ins|nego-del/.test(body.split('</h4>')[1] || ''),
      'the wording carries no marks, because nobody touched it');
    assert.equal(win.negoWordsMoved(ch), false);
  });
});

describe('f249 (9) — it travels', () => {
  test('the payload allow-list already carries the name', () => {
    /* headingText has been on the allow-list since insertClause was built; the
       claim is that a rename inherits it rather than needing a second field. */
    assert.match(strip(CORE_SRC), /headingText:x\.headingText\|\|null/,
      'the change the counterparty receives names the heading it proposes');
  });
});

describe('f249 (10) — the two editors that offer it, and the one that does not', () => {
  test('the clause panel opens the name beside the wording', () => {
    const code = strip(VIEW_SRC);
    assert.match(code, /nego-name-edit/, 'the panel draws an editable name');
    assert.match(code, /headEl\s*=\s*document\.createElement/, 'built once, in the one handler');
    /* REVERSED IN PLACE 29 Aug 2026 — the claim is unchanged and one condition
       joined it: the panel draws the box, only where the clause HAS a heading,
       and only on OUR seat. Pinned as the three conditions rather than as the
       literal line, so the next one added costs no edit here. */
    assert.match(code, /if \(inPanel && headStands/,
      'in the panel, and only where the clause HAS a heading to rename');
    assert.match(code, /if \(inPanel && headStands && mayName\)/,
      'and only on our own seat — the other side may not rename our clauses');
    assert.match(code, /const mayName = meSide === .owner./,
      'the seat is read from the mount, not guessed');
  });

  test('work mode opens it on the paper itself', () => {
    const code = strip(CE_SRC);
    assert.match(code, /id="ce-clausehead"/, 'the name is typed where it sits');
    assert.match(code, /ceHeadEditable\(\)/, 'and only where there is one to rename');
    assert.match(code, /o\.headingText = _ceHead/, 'and it is filed with the wording');
  });

  test('the room’s inline editor deliberately offers none', () => {
    /* Said out loud rather than left to be discovered: that canvas prints a
       REBUILT label (number and title), not the heading string the document
       stores, so a box over it would edit something the record does not hold. */
    assert.match(VIEW_SRC, /REBUILT LABEL/,
      'the reason the room is left out is written down where the code is');
  });

  test('a headingless clause is refused a name box on both', () => {
    assert.match(strip(CE_SRC), /const ceHeadEditable = \(\) => !!_ceHeadBase/);
    assert.match(strip(VIEW_SRC), /inPanel && headStands/);
  });

  test('the draft’s two halves step back together', () => {
    const code = strip(CE_SRC);
    assert.match(code, /function ceRestoreStep/, 'one restore for the pair');
    assert.match(code, /_ceHead = st\.head == null \? _ceHeadBase : st\.head/,
      'a step recorded before the name joined the stack falls to the standing name');
    assert.match(code, /head: _ceHead/, 'and every new step carries it');
  });
});

/* ============================================================
   THE OTHER SIDE MAY NOT RENAME OUR CLAUSES — owner-ruled 29 Aug 2026
   ============================================================
   The rename shipped on 28 Aug with NO rule about seats, and their page mounts
   the same panel ours does, so until now they could propose a new name for a
   clause of ours. A clause's name is how the agreement is CITED — "subject to
   Clause 9" — and the numbering and cross-references are ours to keep coherent.

   WHAT IS NOT NARROWED, and it is the width of the rule: their right to propose
   new WORDING is untouched, a rename WE propose still reaches them, and they
   still accept or refuse it like any other change.

   NAMING A CLAUSE THEY ARE PROPOSING IS NOT RENAMING ONE OF OURS, so the guard
   is on `modify` alone: an insertClause carries the heading of a clause that
   does not exist yet, and refusing that would leave them able to propose a new
   clause and unable to call it anything.  */
describe('f249 (12) — the other side may not rename our clauses', () => {
  const theirs = (win, c, cl, to, over = {}) => win.negoEditClause(c, cl.clauseId,
    over.bodyHtml || cl.bodyHtml,
    { side: 'counterparty', author: 'Erik Lindqvist', headingText: to, ...over.opts });

  test('a rename-only attempt from their seat proposes nothing at all', async () => {
    /* With the name dropped and the wording untouched, what is left proposes
       nothing — and the no-op guard refuses it in the product's own words,
       exactly as it refuses one of OUR renames typed back to the standing name.
       So the rule needs no refusal of its own: it lands on one that exists. */
    const { win, c, cl } = stage();
    const ch = await theirs(win, c, cl, 'Clause 4 · Deras namn');
    assert.equal(ch, null, 'nothing is filed');
    assert.equal(c.changes.length, 0, 'and nothing is left on the column');
  });

  test('THE WORDING THEY TYPED SURVIVES — the rename is dropped, the edit is kept', async () => {
    /* Refusing the whole filing would cost them work they meant to do, over a
       field they cannot even be shown. */
    const { win, c, cl } = stage();
    const body = '<p>The Customer shall pay within thirty (30) days.</p>';
    const ch = await theirs(win, c, cl, 'Charges', { bodyHtml: body });
    assert.ok(ch, 'their ask still files');
    assert.equal(ch.changeType, 'modify');
    assert.match(String(ch.newText || ''), /thirty \(30\) days/, 'their wording is on the record');
    assert.ok(!ch.headingText, 'only the name was dropped');
  });

  test('OUR OWN rename is untouched by the rule', async () => {
    const { win, c, cl } = stage();
    const ch = await rename(win, c, cl, 'Clause 4 · Charges');
    assert.equal(ch.headingText, 'Clause 4 · Charges', 'our side still renames');
  });

  test('they may still NAME A CLAUSE THEY ARE PROPOSING', async () => {
    /* The exemption that keeps the rule narrow: an insertClause is their own
       new clause, not a rename of ours. */
    const { win, c, cl } = stage();
    const ch = await win.negoInsertClause(c, cl.clauseId,
      { headingText: 'Insurance', bodyHtml: '<p>Each party shall maintain insurance.</p>' },
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.ok(ch, 'they may propose a new clause');
    assert.equal(ch.changeType, 'insertClause');
    assert.equal(ch.headingText, 'Insurance', 'and it may carry its own name');
  });

  test('the wall is at the FUNNEL, so no door can walk round it', () => {
    /* The Copilot shortcut in core.js, both playbook entrances, the Word round
       trip and an inbound link all reach negoFileChange without passing a
       screen. A rule written at a wrapper is a rule those four never make. */
    const src = strip(NEGO_SRC);
    assert.match(src, /side === .counterparty. && draft && draft\.changeType === .modify.\s*&& draft\.headingText != null/,
      'negoFileChange itself drops it');
    const fileAt = NEGO_SRC.indexOf('async function negoFileChange');
    const editAt = NEGO_SRC.indexOf('async function negoEditClause');
    const guardAt = NEGO_SRC.indexOf('MAY NOT RENAME OUR CLAUSES');
    assert.ok(guardAt > fileAt && guardAt < editAt,
      'and it lives inside the funnel, not inside one of its wrappers');
  });

  test('the SIGN stands down on their seat too', () => {
    /* A control whose only outcome is a refusal is furniture — this codebase's
       own standing rule. The wall above is what makes it safe; this is what
       makes it honest. */
    assert.match(strip(VIEW_SRC), /const mayName = meSide === .owner./);
    assert.match(strip(VIEW_SRC), /if \(inPanel && headStands && mayName\)/);
  });
});

describe('f249 (11) — both languages', () => {
  for (const key of ['ce_step_named', 'ng_cp_name_edit']){
    test(`${key} is written in both`, () => {
      const hits = (I18N.match(new RegExp(`(^|[^\\w])${key}:`, 'g')) || []).length;
      assert.equal(hits, 2, `${key} must exist in English and in Swedish`);
    });
  }
});
