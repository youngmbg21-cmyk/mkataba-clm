/* f946 — THE BUG LOG, BATCH 5: RECORDS WRITTEN RIGHT (27 Oct 2026, the owner: "next ten bugs")

   Four notes where HaTi wrote something nobody said, or kept half of something refused:
     1 · a returned Word file whose clauses Word numbers itself was read by the text-only reader, so its
         numbers vanished and were filed as the counterparty's changes; the import reads with the one
         structured reader (docxExtractRich), as the upload does
     2 · a change to a person that was refused part-way still saved the parts before the refusal (a name,
         a role, a two-step reset); the update is one transaction now
     3 · a person who renamed themselves could no longer discard their own drafts (matched by name); the
         funnel stamps the author's id and the check asks it first
     4 · Import stored a contract's start date as the day it was signed when the file named no signing day

   Run: node --test test/f946-records-written-right.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildPortal } = require('./portalworld');
const { mkDocx, styledPara, WORD_PARTS, para } = require('./docxfix');
const { startHati, seedWorkspace } = require('./helpers');

/* Their own paper: Word numbers the clauses itself (f257's shape) */
const THEIRS = mkDocx(
  styledPara('Title', null, 0, 'SUPPLY AGREEMENT')
  + para('This Agreement is made between Highland and Naivas.')
  + styledPara('Heading1', 1, 0, 'Term and Termination')
  + styledPara(null, 1, 1, 'This Agreement runs for twelve months.')
  + styledPara(null, 1, 1, 'Either party may terminate on sixty (60) days notice.')
  + styledPara('Heading1', 1, 0, 'Charges')
  + styledPara(null, 1, 1, 'The Buyer shall pay each invoice within thirty (30) days.'),
  { parts: WORD_PARTS });

describe('f946 (1) their own numbered file, sent back untouched, files nothing', () => {
  test('uploaded from their Word file, returned as it was: no change is filed', async () => {
    const { win } = buildPortal();
    const up = await win.docxExtractRich(THEIRS);
    const c = { id: 'MK-946', name: 'Supply Agreement', counterparty: 'Naivas', status: 'Draft', folder: 'proc',
      source: 'upload', upload: { fileName: 'supply.docx', extractedText: up.text }, redlineText: win.sanitizeRich(up.html), format: 'rich',
      fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [] };
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id });
    win.getContract = id => (id === c.id ? c : null);
    win.negoInit(c);
    const res = await win.negoImportReturnedDocx(c, THEIRS, {});
    assert.equal(res.filed.length, 0, 'filed ' + JSON.stringify(res.filed.map(x => [x.changeType, x.clauseLabel, x.newText])));
  });
});

describe('f946 (2) a refused change to a person saves none of it', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });
  test('a new role with a bad signing limit: refused, and the role is as it was', async () => {
    const id = W.users.restricted.id;
    const before = ((await W.admin.json('/api/bootstrap')).users || []).find(u => u.id === id);
    const r = await W.admin.raw('/api/users/' + id, { method: 'PATCH', body: { role: 'viewer', title: 'Changed', signCap: 'lots' } });
    assert.equal(r.status, 400, 'the bad limit is refused');
    const after = ((await W.admin.json('/api/bootstrap')).users || []).find(u => u.id === id);
    assert.equal(after.role, before.role, 'the role written before the refusal is undone');
    assert.equal(after.title, before.title, 'and the title');
    const ok = await W.admin.raw('/api/users/' + id, { method: 'PATCH', body: { title: 'Counsel' } });
    assert.equal(ok.status, 200, 'a good change still saves');
  });
});

describe('f946 (3) a rename keeps a person\'s own drafts theirs', () => {
  test('filed by id: still mine after my name changes; another person\'s is not', () => {
    const { win } = buildPortal();
    const c = { id: 'MK-9463', counterparty: 'K' };
    const ch = { id: 'CHG-1', authorSide: 'owner', author: 'Amina Otieno', authorId: 'u1' };
    assert.equal(win.negoMayDiscard(c, ch, { id: 'u1', name: 'Amina Otieno-Kamau', role: 'legal' }), true, 'renamed: still mine');
    const strangerOwns = win.negoMayDiscard(c, ch, { id: 'u2', name: 'Amina Otieno', role: 'legal' });
    assert.equal(strangerOwns, !!(win.contractOwnedBy && win.contractOwnedBy(c, { id: 'u2', name: 'Amina Otieno' })),
      'the same name on somebody else is not the author');
    const NEG = fs.readFileSync(path.join(__dirname, '..', 'js', 'negotiation.js'), 'utf8');
    assert.match(NEG, /author, authorSide: side,\s*\n\s*\.\.\.\(authorId \? \{ authorId \} : \{\}\),/, 'the funnel stamps the id on a new change');
  });
});

describe('f946 (4) Import stores a signing day only where one was read', () => {
  test('the start date is not taken for the day it was signed', () => {
    const MIG = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'migration.js'), 'utf8');
    const line = (/signedAt:executedOutside\?[^\n]*/.exec(MIG) || [''])[0];
    assert.match(line, /manifest\.signed/);
    assert.doesNotMatch(line, /effective/i, 'neither the manifest\'s nor the file\'s start date');
  });
});
