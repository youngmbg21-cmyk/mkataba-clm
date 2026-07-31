/* ============================================================
   f122 — live numbering for HaTi-born contracts (N3)
   ============================================================
   A contract born from a template carries `numbering:'live'`: delete a clause
   and the run closes up with ZERO manual steps, references following. The
   decided implementation (documented at negoLiveNumbered) is automatic
   renumbering at the round boundary through the N2 engine — the stored
   document stays the ONE numbering authority every surface and every freeze
   path reads, which is what makes T2 ("no renderer formats its own number")
   and X2 ("frozen copies carry literal numbers") true by construction.

   The other half of the doctrine matters as much: a contract WITHOUT the
   flag — every existing contract, every upload — is untouched by all of it.
   An upload can never acquire the flag, even crafted. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const REF_BODY =
  '<h1>Master Agreement</h1><p>Between the parties</p>'
  + '<h2>Clause 1 · Scope</h2><p>Subject to Clause 12 and the limits in Clauses 4 to 6.</p>'
  + '<h2>Clause 4 · Payment</h2><p>Payable per Clause 5.</p>'
  + '<h2>Clause 5 · Storage</h2><p>Stored goods.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Capped.</p>'
  + '<h2>Clause 9 · Termination</h2><p>Sixty days.</p>'
  + '<h2>Clause 12 · Law</h2><p>Kenyan law.</p>';

function born(win, over = {}){
  return { id: 'MK-L1', name: 'Master Agreement', counterparty: 'Nordfrakt',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: REF_BODY, format: 'rich', numbering: 'live', ...over };
}

async function deleteNine(win, c){
  const cl9 = win.negoClauseList(c).find(x => x.num === '9');
  const ch = await win.negoDeleteClause(c, cl9.clauseId,
    { side: 'counterparty', author: 'Erik Lindqvist' });
  win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
  win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
  return ch;
}

describe('f122 — a live contract closes its own numbering up', () => {
  test('delete a clause, close the round: the run closes and references follow — zero manual steps', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = born(win);
    win.negoInit(c);
    await deleteNine(win, c);
    assert.equal(win.negoClauseList(c).map(cl => cl.num).join(','), '1,2,3,4,5',
      'the whole run closes — a template-born contract has no extract origin to preserve');
    const text = win.richToText(c.negotiation.baselineBody);
    assert.match(text, /Subject to Clause 5 and the limits in Clauses 2 to 4/,
      'the single reference and both range endpoints follow their clauses');
    assert.equal(win.negoNumberingGaps(c).length, 0, 'no gap notice — there is no gap');
    const entry = c.audit.find(a => a.action === 'Renumbered');
    assert.match(entry.detail, /automatically — this contract numbers live/,
      'the record says WHY it happened by itself');
    assert.equal(entry.data.kind, 'renumber', 'and the X3 beat is on the timeline like any other');
  });

  test('every surface reads the same run, because the stored document IS the run', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = born(win);
    win.negoInit(c);
    await deleteNine(win, c);
    // The workbench, the doc canvas and the portal all render the stored
    // headings — one authority, asserted at the seam they all read through.
    assert.equal(c.redlineText, c.negotiation.baselineBody,
      'live document and baseline agree byte for byte');
    const doc = win.redlineDocHtml(c, { side: 'owner' });
    assert.match(doc, /Clause 5 · Law/, 'the renumbered heading is what renders');
    assert.ok(!/Clause 12/.test(doc), 'no surface still prints the old number');
  });

  test('a literal contract is untouched by all of it — the gap stays, the notice appears', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = born(win, { numbering: undefined });
    win.negoInit(c);
    await deleteNine(win, c);
    assert.equal(win.negoClauseList(c).map(cl => cl.num).join(','), '1,4,5,6,12',
      'nothing moved — a number is the text the file carries');
    assert.equal(win.negoNumberingGaps(c).length, 1, 'and the notice does its job instead');
  });

  test('an upload can never acquire the flag, even crafted', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = born(win, { upload: { fileName: 'x.pdf', extractedText: 'x' }, source: 'upload' });
    assert.equal(win.negoLiveNumbered(c), false,
      'an uploaded contract\'s numbers are the paper\'s own facts');
    win.negoInit(c);
    await deleteNine(win, c);
    assert.equal(win.negoClauseList(c).map(cl => cl.num).join(','), '1,4,5,6,12');
  });

  test('the freeze is self-contained: execution seals literal numbers no code change can move (T5/X2)', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = born(win);
    win.negoInit(c);
    await deleteNine(win, c);
    // Execute: freeze the body as sealed html, seal it.
    win.sealString = cc => 'seal|' + cc.id + '|' + String(cc.redlineText || '');
    c.execution = { at: win.nowISO(), html: c.redlineText };
    c.status = 'Signed';
    c.hash = await win.sha256(win.sealString(c));
    const before = await win.negoIntegrityReport(c);
    assert.equal(before.ok, true, 'the sealed record verifies');
    assert.match(c.execution.html, /Clause 5 · Law/, 'the frozen copy carries the literal renumbered text');
    // Simulate the numbering code changing (or running again years later):
    // the lock refuses, and the sealed copy is byte-identical.
    const frozen = c.execution.html;
    assert.equal(win.negoRenumberApply(c, { by: 'Anyone' }), null,
      'no path can renumber an executed contract');
    assert.equal(c.execution.html, frozen);
    assert.equal((await win.negoIntegrityReport(c)).ok, true, 'and it verifies forever, self-contained');
  });

  test('the flag is written at both template-born creation paths, and only there', () => {
    const fs = require('node:fs');
    const wiz = fs.readFileSync(require('node:path').join(__dirname, '..', 'js/wizard.js'), 'utf8');
    const lib = fs.readFileSync(require('node:path').join(__dirname, '..', 'js/views/library.js'), 'utf8');
    const up = fs.readFileSync(require('node:path').join(__dirname, '..', 'js/views/contract.js'), 'utf8');
    assert.match(wiz, /numbering:'live'/, 'the wizard path');
    assert.match(lib, /numbering:'live'/, 'the custom-template path');
    assert.ok(!/numbering:'live'/.test(up), 'the upload path never writes it');
  });
});
